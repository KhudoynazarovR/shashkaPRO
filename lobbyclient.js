/* lobbyclient.js — onlayn zal va turnirlar (brauzer qismi).
   index.html ga server avtomatik ulaydi. O'yin xonalari roomclient.js orqali ochiladi (?room=ID). */
(function () {
  "use strict";
  var ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
  var q = new URLSearchParams(location.search);
  var TCS = ["1+1", "2+2", "3+2", "5+3", "7+5"];

  function loadTg(cb) {
    if (window.Telegram && window.Telegram.WebApp) return cb();
    var s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  loadTg(function () { try { boot(); } catch (e) { console.error("[lobby]", e); } });

  function boot() {
    var tg = window.Telegram && window.Telegram.WebApp;
    var curRoom = "";
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) curRoom = String(tg.initDataUnsafe.start_param);
    if (!curRoom && q.get("room")) curRoom = q.get("room");
    var inRoom = ROOM_RE.test(curRoom);
    var initData = (tg && tg.initData) || "";

    // roomclient.js bilan bir xil guestId (sessionStorage "rcGuest") — xonada o'rindiq shu bo'yicha topiladi
    function guestId() {
      var k = "rcGuest", v = "";
      try { v = sessionStorage.getItem(k) || ""; } catch (e) {}
      if (!/^[A-Za-z0-9]{8,32}$/.test(v)) {
        v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
        try { sessionStorage.setItem(k, v); } catch (e) {}
      }
      return v;
    }
    var gid = guestId();
    var myName = "";
    try { myName = localStorage.getItem("lbName") || ""; } catch (e) {}

    var S = { me: null, players: [], tournaments: [], inQueue: false, incoming: [], outgoing: [] };
    var ws = null, ready = false, outbox = [], retry = 0, panelOpen = false, curTab = "pl";

    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function $(id) { return document.getElementById(id); }
    function go(roomId) { location.href = location.pathname + "?room=" + encodeURIComponent(roomId); }

    // ---------- ulanish ----------
    function sendMsg(m) {
      var s = JSON.stringify(m);
      if (ws && ws.readyState === 1 && ready) ws.send(s); else outbox.push(s);
    }
    function connect() {
      var proto = location.protocol === "https:" ? "wss://" : "ws://";
      try { ws = new WebSocket(proto + location.host); } catch (e) { return setTimeout(connect, 3000); }
      ws.onopen = function () {
        retry = 0;
        ws.send(JSON.stringify({ type: "lbHello", initData: initData, guestId: gid, name: myName, inRoom: inRoom }));
        ready = true;
        outbox.splice(0).forEach(function (s) { ws.send(s); });
      };
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        onMsg(m);
      };
      ws.onclose = function () { ready = false; setTimeout(connect, Math.min(10000, 1000 + 1500 * retry++)); };
      ws.onerror = function () {};
    }

    function onMsg(m) {
      if (m.type === "lbState") {
        S = m; renderBadge(); if (panelOpen) renderAll(); renderIncoming();
      } else if (m.type === "lbGo") {
        onGo(m);
      } else if (m.type === "lbToast") {
        toast(esc(m.text), null, 7000);
      } else if (m.type === "error" && panelOpen) {
        toast("⚠️ " + esc(m.message), null, 5000);
      }
    }

    function onGo(m) {
      if (m.roomId === curRoom) return;
      if (m.reason === "tournament" || m.reason === "arena") {
        var txt = "🏆 <b>" + esc(m.tname) + "</b> — " + (m.reason === "arena" ? "yangi o‘yin" : m.round + "-tur boshlandi") + ".<br>Raqib: <b>" + esc(m.opponent) + "</b> (" + (m.color === "white" ? "oq" : "qora") + ")";
        if (!inRoom) {
          var left = m.reason === "arena" ? 3 : 6, t;
          var box = toast(txt + "<br><span id=\"lbCd\">" + left + "</span> soniyadan so‘ng o‘tasiz…", [["Hozir", function () { clearInterval(t); go(m.roomId); }]], 7000);
          t = setInterval(function () {
            left--;
            var el = $("lbCd"); if (el) el.textContent = left;
            if (left <= 0) { clearInterval(t); go(m.roomId); }
          }, 1000);
        } else {
          toast(txt, [["▶ O‘yinga o‘tish", function () { go(m.roomId); }]], 30000);
        }
      } else {
        if (!inRoom) go(m.roomId);
        else toast("⚔️ " + esc(m.opponent) + " bilan o‘yin tayyor", [["▶ O‘tish", function () { go(m.roomId); }]], 30000);
      }
    }

    // ---------- UI ----------
    var css = document.createElement("style");
    css.textContent =
      "#lbBtn{position:fixed;right:12px;bottom:12px;z-index:9000;width:48px;height:48px;border-radius:50%;border:0;background:#2b7cff;color:#fff;font-size:22px;box-shadow:0 2px 10px rgba(0,0,0,.4);cursor:pointer}" +
      "#lbBadge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#e53935;color:#fff;font:700 11px/18px Arial;text-align:center;display:none}" +
      "#lbBack{position:fixed;left:10px;bottom:10px;z-index:9000;padding:8px 12px;border-radius:18px;background:#2b7cff;color:#fff;font:600 13px Arial;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.4)}" +
      "#lbPanel{position:fixed;inset:0;z-index:9500;background:#0b1017;color:#e9eef5;font:14px/1.4 Arial,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px calc(env(safe-area-inset-bottom,0px) + 20px);display:none}" +
      "#lbPanel h2{margin:0;font-size:18px}#lbPanel .row{display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap}" +
      "#lbPanel input,#lbPanel select{background:#151d29;color:#fff;border:1px solid #2a3647;border-radius:8px;padding:9px 10px;font-size:14px;min-width:0}" +
      "#lbPanel button{background:#2b7cff;color:#fff;border:0;border-radius:8px;padding:9px 12px;font-size:14px;cursor:pointer}" +
      "#lbPanel button.sec{background:#243246}#lbPanel button.red{background:#c62828}#lbPanel button.grn{background:#2e7d32}" +
      "#lbPanel .tabs{display:flex;gap:6px;margin:10px 0}#lbPanel .tabs button{flex:1;background:#151d29}#lbPanel .tabs button.on{background:#2b7cff}" +
      "#lbPanel .card{background:#111925;border:1px solid #223046;border-radius:10px;padding:10px;margin:8px 0}" +
      "#lbPanel .muted{color:#8da0b8;font-size:12px}#lbPanel .pl{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #1b2636}" +
      "#lbPanel table{width:100%;border-collapse:collapse;margin-top:6px}#lbPanel td,#lbPanel th{padding:4px 6px;text-align:left;border-bottom:1px solid #1b2636;font-size:13px}" +
      "#lbToasts{position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:9800;display:flex;flex-direction:column;gap:8px;pointer-events:none}" +
      "#lbToasts .t{pointer-events:auto;background:#1c2a3d;color:#fff;border:1px solid #3a5478;border-radius:10px;padding:10px 12px;font:14px/1.4 Arial,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.5)}" +
      "#lbToasts .t button{margin:8px 8px 0 0;background:#2b7cff;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-size:14px}" +
      "#lbToasts .t button.no{background:#5b6b82}";
    document.head.appendChild(css);

    var toasts = document.createElement("div");
    toasts.id = "lbToasts";
    document.body.appendChild(toasts);

    function toast(html, buttons, ttl) {
      var d = document.createElement("div");
      d.className = "t";
      d.innerHTML = html;
      (buttons || []).forEach(function (b) {
        var bt = document.createElement("button");
        bt.textContent = b[0];
        if (b[2]) bt.className = b[2];
        bt.onclick = function () { b[1](); if (d.parentNode) d.parentNode.removeChild(d); };
        d.appendChild(bt);
      });
      toasts.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, ttl || 5000);
      return d;
    }

    var shownIncoming = {};
    function renderIncoming() {
      (S.incoming || []).forEach(function (c) {
        if (shownIncoming[c.id]) return;
        shownIncoming[c.id] = 1;
        toast("⚔️ <b>" + esc(c.fromName) + "</b> sizni o‘yinga chaqirdi (" + esc(c.tc) + ")", [
          ["Qabul", function () { sendMsg({ type: "lbRespond", id: c.id, accept: true }); }],
          ["Rad etish", function () { sendMsg({ type: "lbRespond", id: c.id, accept: false }); }, "no"]
        ], 55000);
      });
    }

    // tugmalar
    var btn;
    if (inRoom) {
      btn = document.createElement("a");
      btn.id = "lbBack";
      btn.href = location.pathname;
      btn.textContent = "🏟 Zal";
      document.body.appendChild(btn);
    } else {
      btn = document.createElement("button");
      btn.id = "lbBtn";
      btn.innerHTML = "🏟<span id=\"lbBadge\"></span>";
      btn.onclick = openPanel;
      document.body.appendChild(btn);
    }
    function renderBadge() {
      var b = $("lbBadge"); if (!b) return;
      var n = (S.incoming || []).length;
      b.style.display = n ? "block" : "none";
      b.textContent = n;
    }

    var panel = null;
    function openPanel() {
      if (!panel) buildPanel();
      panel.style.display = "block";
      panelOpen = true;
      renderAll();
    }
    function closePanel() { panel.style.display = "none"; panelOpen = false; }

    function buildPanel() {
      panel = document.createElement("div");
      panel.id = "lbPanel";
      var nameRow = initData ? "" :
        "<div class=\"row\"><input id=\"lbNm\" maxlength=\"20\" placeholder=\"Ismingiz\" style=\"flex:1\" value=\"" + esc(myName) + "\"><button id=\"lbNmSave\" class=\"sec\">Saqlash</button></div>";
      var tcOpts = TCS.map(function (t) { return "<option value=\"" + t + "\"" + (t === "5+3" ? " selected" : "") + ">" + t + "</option>"; }).join("");
      panel.innerHTML =
        "<div class=\"row\" style=\"justify-content:space-between\"><h2>🏟 O‘yinchilar zali</h2><button id=\"lbClose\" class=\"sec\">✕</button></div>" +
        nameRow +
        "<div class=\"row\"><span class=\"muted\">Vaqt:</span><select id=\"lbTc\">" + tcOpts + "</select><button id=\"lbQuick\" style=\"flex:1\">⚡ Tezkor o‘yin</button></div>" +
        "<div class=\"tabs\"><button id=\"lbTabPl\">👥 O‘yinchilar</button><button id=\"lbTabT\">🏆 Turnirlar</button></div>" +
        "<div id=\"lbPl\"></div>" +
        "<div id=\"lbT\" style=\"display:none\">" +
        "<div class=\"card\"><div class=\"row\"><input id=\"lbTn\" maxlength=\"30\" placeholder=\"Turnir nomi\" style=\"flex:1\"><button id=\"lbTCreate\">➕ Ochish</button></div>" +
        "<div class=\"row\"><select id=\"lbTk\"><option value=\"arena\">⚔️ Arena</option><option value=\"swiss\">Shveytsar</option></select>" +
        "<select id=\"lbTdur\"><option value=\"10\">10 daq</option><option value=\"20\">20 daq</option><option value=\"30\" selected>30 daq</option><option value=\"45\">45 daq</option><option value=\"60\">60 daq</option><option value=\"90\">90 daq</option></select>" +
        "<select id=\"lbTin\"><option value=\"0\">hozir</option><option value=\"2\">2 daq</option><option value=\"5\" selected>5 daq</option><option value=\"10\">10 daq</option><option value=\"30\">30 daq</option></select>" +
        "<select id=\"lbTp\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select></div>" +
        "<div class=\"muted\">Arena: belgilangan vaqt to‘xtovsiz o‘ynaladi (g‘alaba 2, durang 1, ketma-ket 2 g‘alabadan so‘ng olov ×2, berserk +1). Shveytsar: kamida 3 o‘yinchi.</div></div>" +
        "<div id=\"lbTs\"></div></div>";
      document.body.appendChild(panel);

      $("lbClose").onclick = closePanel;
      $("lbTabPl").onclick = function () { curTab = "pl"; renderAll(); };
      $("lbTabT").onclick = function () { curTab = "t"; renderAll(); };
      $("lbQuick").onclick = function () {
        if (S.inQueue) sendMsg({ type: "lbQuickCancel" });
        else sendMsg({ type: "lbQuick", tc: $("lbTc").value });
      };
      $("lbTk").onchange = function () {
        var a = this.value === "arena";
        $("lbTdur").style.display = a ? "" : "none";
        $("lbTin").style.display = a ? "" : "none";
      };
      $("lbTCreate").onclick = function () {
        sendMsg({ type: "lbTCreate", kind: $("lbTk").value, pos: $("lbTp").value, duration: Number($("lbTdur").value), startIn: Number($("lbTin").value), name: $("lbTn").value, tc: $("lbTc").value });
        $("lbTn").value = "";
      };
      if (!initData) {
        $("lbNmSave").onclick = function () {
          var v = $("lbNm").value.trim().slice(0, 20);
          if (!v) return;
          myName = v;
          try { localStorage.setItem("lbName", v); } catch (e) {}
          sendMsg({ type: "lbName", name: v });
          toast("Ism saqlandi", null, 1500);
        };
      }
      panel.addEventListener("click", function (e) {
        var t = e.target; if (!t || !t.getAttribute) return;
        var act = t.getAttribute("data-a"), id = t.getAttribute("data-id");
        if (!act) return;
        if (act === "ch") sendMsg({ type: "lbChallenge", toUid: id, tc: $("lbTc").value });
        else if (act === "tj") sendMsg({ type: "lbTJoin", tid: id });
        else if (act === "tl") sendMsg({ type: "lbTLeave", tid: id });
        else if (act === "ts") sendMsg({ type: "lbTStart", tid: id });
        else if (act === "tc") sendMsg({ type: "lbTCancel", tid: id });
        else if (act === "go") go(id);
      });
    }

    function renderAll() {
      if (!panel) return;
      $("lbTabPl").className = curTab === "pl" ? "on" : "";
      $("lbTabT").className = curTab === "t" ? "on" : "";
      $("lbPl").style.display = curTab === "pl" ? "block" : "none";
      $("lbT").style.display = curTab === "t" ? "block" : "none";
      $("lbQuick").textContent = S.inQueue ? "⏳ Raqib kutilmoqda… (bekor qilish)" : "⚡ Tezkor o‘yin";
      if (curTab === "pl") renderPlayers(); else renderTournaments();
    }

    function renderPlayers() {
      var me = S.me ? S.me.uid : "";
      var out = (S.outgoing || []).reduce(function (a, o) { a[o.toUid] = 1; return a; }, {});
      var list = (S.players || []).filter(function (p) { return p.uid !== me; });
      var h = "<div class=\"muted\">Onlayn: " + (S.players || []).length + "</div>";
      if (!list.length) h += "<div class=\"card muted\">Hozircha boshqa o‘yinchi yo‘q. “Tezkor o‘yin” ni bosib raqib kutishingiz mumkin.</div>";
      list.forEach(function (p) {
        h += "<div class=\"pl\"><span>" + (p.busy ? "🟡" : "🟢") + " " + esc(p.name) + (p.busy ? " <span class=\"muted\">o‘ynayapti</span>" : "") + "</span>" +
          (out[p.uid] ? "<span class=\"muted\">chaqirildi…</span>" : (p.busy ? "" : "<button data-a=\"ch\" data-id=\"" + esc(p.uid) + "\">Chaqirish</button>")) + "</div>";
      });
      $("lbPl").innerHTML = h;
    }

    function renderTournaments() {
      var me = S.me ? S.me.uid : "";
      var ts = (S.tournaments || []).slice().sort(function (a, b) {
        var o = { running: 0, reg: 1, finished: 2 };
        return o[a.status] - o[b.status];
      });
      if (!ts.length) { $("lbTs").innerHTML = "<div class=\"card muted\">Hozircha turnir yo‘q. Birinchi bo‘lib oching!</div>"; return; }
      var h = "";
      ts.forEach(function (t) {
        var joined = t.players.some(function (p) { return p.uid === me; });
        var arena = t.type === "arena";
        var mins = function (ms) { return Math.max(0, Math.ceil(ms / 60000)) + " daq"; };
        var st = arena
          ? (t.status === "reg" ? "Boshlanishi: " + mins(t.startAt - Date.now()) : (t.status === "running" ? (t.ending ? "Tugayapti…" : "Qoldi: " + mins(t.endAt - Date.now())) : "Tugagan"))
          : (t.status === "reg" ? "Ro‘yxat ochiq" : (t.status === "running" ? t.round + "/" + t.rounds + "-tur" : "Tugagan"));
        h += "<div class=\"card\"><div><b>" + (arena ? "⚔️" : "🏆") + " " + esc(t.name) + "</b></div><div class=\"muted\">" + esc(t.tc) + (t.pos === "idf" ? " · IDF 780" : "") + " · " + st + " · " + t.players.length + " o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";
        if (t.status === "reg") {
          if (!joined) h += "<button data-a=\"tj\" data-id=\"" + t.id + "\">Qo‘shilish</button>";
          else if (t.creatorUid !== me) h += "<button class=\"sec\" data-a=\"tl\" data-id=\"" + t.id + "\">Chiqish</button>";
          if (t.creatorUid === me) {
            h += "<button class=\"grn\" data-a=\"ts\" data-id=\"" + t.id + "\">▶ Boshlash</button><button class=\"red\" data-a=\"tc\" data-id=\"" + t.id + "\">Bekor qilish</button>";
          }
        }
        if (arena && t.status === "running" && !t.ending) {
          var meP = t.players.filter(function (p) { return p.uid === me; })[0];
          if (!meP || meP.withdrawn) h += "<button data-a=\"tj\" data-id=\"" + t.id + "\">Qo‘shilish</button>";
          else h += "<button class=\"sec\" data-a=\"tl\" data-id=\"" + t.id + "\">⏸ Pauza</button>";
        }
        if (t.status === "running") {
          var mine = t.boards.filter(function (b) { return !b.done && (b.white === me || b.black === me); })[0];
          if (mine) h += "<button class=\"grn\" data-a=\"go\" data-id=\"" + esc(mine.roomId) + "\">▶ O‘yinga o‘tish</button>";
          else if (t.bye === me) h += "<span class=\"muted\">Bu turda dam olasiz (+1)</span>";
          else if (t.nextAt) h += "<span class=\"muted\">Keyingi tur tez orada…</span>";
          else if (joined) h += "<span class=\"muted\">" + (arena ? "Raqib qidirilmoqda…" : "Stolingiz tugadi, boshqalarni kuting") + "</span>";
        }
        h += "</div>";
        h += "<table><tr><th>#</th><th>O‘yinchi</th><th>Ochko</th><th>" + (arena ? "O‘yin" : "Bux.") + "</th></tr>";
        t.players.slice(0, 12).forEach(function (p, i) {
          h += "<tr><td>" + (i + 1) + "</td><td>" + esc(p.name) + (p.uid === me ? " 👈" : "") + (p.withdrawn ? " <span class=\"muted\">(chiqdi)</span>" : "") + "</td><td>" + p.score + (p.fire ? " 🔥" : "") + "</td><td>" + (arena ? p.games : p.buch) + "</td></tr>";
        });
        h += "</table>";
        if (t.players.length > 12) h += "<div class=\"muted\">… va yana " + (t.players.length - 12) + " o‘yinchi</div>";
        h += "</div>";
      });
      $("lbTs").innerHTML = h;
    }

    // keyingi tur sanog'i uchun sekin yangilash
    setInterval(function () { if (panelOpen && curTab === "t") renderTournaments(); }, 5000);

    connect();
  }
})();
