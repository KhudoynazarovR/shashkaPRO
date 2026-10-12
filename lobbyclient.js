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
    // havola orqali kirish: startapp=lbt_<turnir> / lbs_<sians> yoki ?t= / ?s=
    var linkTid = "", linkSid = "", linkFid = "";
    if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; }
    else if (/^lbs_/.test(curRoom)) { linkSid = curRoom.slice(4); curRoom = ""; }
    else if (/^lbf_/.test(curRoom)) { linkFid = curRoom.slice(4); curRoom = ""; }
    else {
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("t") || "")) linkTid = q.get("t");
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("s") || "")) linkSid = q.get("s");
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("f") || "")) linkFid = q.get("f");
    }
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
        S = m; if (m.now) window.__lbSkew = m.now - Date.now(); renderBadge(); if (panelOpen) renderAll(); renderIncoming(); updateSimulBtn();
        if (linkTid && !inRoom) openLinked("t");
        if (linkSid && !inRoom) openLinked("s");
        if (m.appLink && !window.TG_APP_LINK) window.TG_APP_LINK = m.appLink;
        if (linkFid && !inRoom) { var _fid = linkFid; linkFid = ""; sendMsg({ type: "lbFriendJoin", id: _fid }); }
      } else if (m.type === "lbShareReady" || m.type === "lbShareFail") {
        var ps = pendingShare; pendingShare = null;
        if (ps) {
          clearTimeout(ps.timer);
          if (m.type === "lbShareReady") { try { tg.shareMessage(m.msgId); } catch (e) { ps.fb(); } }
          else ps.fb();
        }
      } else if (m.type === "lbFriendLink") {
        shareLinkPlain("lbf_", "f", m.id, "♟ Keling, shashka o‘ynaymiz! — ShashkaPRO");
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
      if (m.reason === "series" && m.series) {
        var stx = "🔁 Seriya: " + m.series.game + "/" + m.series.total + "-o‘yin<br>" + esc(m.series.score) + "<br>Raqib: <b>" + esc(m.opponent) + "</b> (" + (m.color === "white" ? "oq" : "qora") + ")";
        var sleft = 3, st2;
        toast(stx + "<br><span id=\"lbCd\">" + sleft + "</span> soniyadan so‘ng o‘tasiz…", [["Hozir", function () { clearInterval(st2); go(m.roomId); }]], 4000);
        st2 = setInterval(function () {
          sleft--;
          var el2 = $("lbCd"); if (el2) el2.textContent = sleft;
          if (sleft <= 0) { clearInterval(st2); go(m.roomId); }
        }, 1000);
        return;
      }
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
        try { if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success"); else if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
        if (panelOpen && curTab === "pl") return;
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
    // ---------- 🔗 havolalar ----------
    var hl = { id: "", until: 0 };
    function applyHl() {
      if (!hl.id || Date.now() > hl.until) return;
      var e = $(hl.id);
      if (e) e.style.outline = "2px solid #2b7cff";
    }
    function openLinked(kind) {
      var id = kind === "t" ? linkTid : linkSid;
      if (kind === "t") linkTid = ""; else linkSid = "";
      curTab = kind;
      openPanel();
      var list = kind === "t" ? S.tournaments : S.simuls;
      var found = (list || []).some(function (x) { return String(x.id) === id; });
      if (!found) { toast("⚠️ Bu " + (kind === "t" ? "turnir" : "sians") + " topilmadi yoki yopilgan", null, 5000); return; }
      hl.id = (kind === "t" ? "lbtc_" : "lbsc_") + id;
      hl.until = Date.now() + 4000;
      applyHl();
      var el = $(hl.id);
      if (el) { try { el.scrollIntoView({ block: "center" }); } catch (e) {} }
    }
    var pendingShare = null;
    function shareLink(prefix, qp, id, text) {
      if (tg && tg.shareMessage && initData) {
        if (pendingShare) clearTimeout(pendingShare.timer);
        pendingShare = {
          fb: function () { shareLinkPlain(prefix, qp, id, text); },
          timer: setTimeout(function () { var p = pendingShare; pendingShare = null; if (p) p.fb(); }, 6000)
        };
        sendMsg({ type: "lbShare", kind: prefix === "lbt_" ? "t" : "s", id: id });
        return;
      }
      shareLinkPlain(prefix, qp, id, text);
    }
    function shareLinkPlain(prefix, qp, id, text) {
      var base = window.TG_APP_LINK || ""; // masalan: "https://t.me/BOT_USERNAME/APP_NAME"
      var url = base
        ? base + "?startapp=" + encodeURIComponent(prefix + id)
        : location.origin + location.pathname + "?" + qp + "=" + encodeURIComponent(id);
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { toast("🔗 Havola nusxalandi", null, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
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
    window.lbNav = { open: function (tab) { curTab = tab; openPanel(); }, close: function () { if (panel) closePanel(); } };

    function buildPanel() {
      panel = document.createElement("div");
      panel.id = "lbPanel";
      var nameRow = initData ? "" :
        "<div class=\"row\"><input id=\"lbNm\" maxlength=\"20\" placeholder=\"Ismingiz\" style=\"flex:1\" value=\"" + esc(myName) + "\"><button id=\"lbNmSave\" class=\"sec\">Saqlash</button></div>";
      var tcOpts = TCS.map(function (t) { return "<option value=\"" + t + "\"" + (t === "5+3" ? " selected" : "") + ">" + t + "</option>"; }).join("");
      panel.innerHTML =
        "<div class=\"row\" style=\"justify-content:space-between\"><h2>🏟 O‘yinchilar zali</h2><span><button id=\"lbSnd\" class=\"sec\">🔊</button> <button id=\"lbClose\" class=\"sec\">✕</button></span></div>" +
        nameRow +
        "<div class=\"lbcards\">" +
        "<div class=\"lbc lbc1\" onclick=\"lbFriend()\"><b>Do‘st bilan o‘ynash</b><small>Havola yuboring — do‘stingiz bossa, o‘yin boshlanadi</small></div>" +
        "<div class=\"lbc lbc3\"><div class=\"lbmain\" onclick=\"document.getElementById('lbQuick').click()\"><b>🔀 Tasodifiy o‘yin</b><small>Tasodifiy o‘yinchi bilan o‘ynash</small></div>" +
        "<div class=\"lbplay\" onclick=\"document.getElementById('lbQuick').click()\">▶</div>" +
        "<div class=\"lbgear\" onclick=\"var e=document.getElementById('lbSet');e.style.display=e.style.display==='none'?'block':'none'\">⚙️</div></div></div>" +
        "<div id=\"lbSet\" style=\"display:none\">" +
        "<div class=\"row\"><span class=\"muted\">Vaqt:</span><select id=\"lbTc\">" + tcOpts + "</select><button id=\"lbQuick\" style=\"flex:1\">⚡ Tezkor o‘yin</button></div>" +
        "<div class=\"row\"><span class=\"muted\">Pozitsiya:</span><select id=\"lbPos\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select>" +
        "<select id=\"lbGm\" style=\"flex:1\"><option value=\"1\">1 o‘yin</option><option value=\"2\">1 match (2 o‘yin)</option><option value=\"4\">2 match (4 o‘yin)</option></select></div>" +
        "</div>" +
        "<div class=\"tabs\"><button id=\"lbTabPl\">🌐 Barcha onlinelar</button><button id=\"lbTabT\" style=\"display:none\">🏆 Turnirlar</button><button id=\"lbTabS\" style=\"display:none\">🎭 Sians</button></div>" +
        "<div id=\"lbPl\"></div>" +
        "<div id=\"lbS\" style=\"display:none\">" +
        "<div class=\"card\"><div class=\"row\"><input id=\"lbSn\" maxlength=\"30\" placeholder=\"Sians nomi\" style=\"flex:1\"><button id=\"lbSCreate\">➕ Ochish</button></div>" +
        "<div class=\"row\"><select id=\"lbSm\"><option value=\"5\">5 kishi</option><option value=\"10\" selected>10 kishi</option><option value=\"15\">15 kishi</option><option value=\"20\">20 kishi</option><option value=\"30\">30 kishi</option></select>" +
        "<select id=\"lbSb\"><option value=\"0\">Qo‘shimcha vaqt yo‘q</option><option value=\"1\">Mezbonga +1 daq</option><option value=\"2\">Mezbonga +2 daq</option><option value=\"3\" selected>Mezbonga +3 daq</option><option value=\"5\">Mezbonga +5 daq</option></select></div>" +
        "<div class=\"row\"><select id=\"lbSc\"><option value=\"alt\">Ranglar navbat bilan</option><option value=\"w\">Mezbon oq</option><option value=\"b\">Mezbon qora</option></select>" +
        "<select id=\"lbSp\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select></div>" +
        "<div class=\"muted\">Simul: siz bir vaqtning o‘zida ko‘p o‘yinchi bilan o‘ynaysiz. Vaqt rejimi yuqoridagi tanlovdan olinadi; mezbonga har taxtada qo‘shimcha vaqt beriladi.</div></div>" +
        "<div id=\"lbSs\"></div></div>" +
        "<div id=\"lbT\" style=\"display:none\">" +
        "<div class=\"card\"><div class=\"row\"><input id=\"lbTn\" maxlength=\"30\" placeholder=\"Turnir nomi\" style=\"flex:1\"><button id=\"lbTCreate\">➕ Ochish</button></div>" +
        "<div class=\"row\"><select id=\"lbTk\"><option value=\"arena\">⚔️ Arena</option><option value=\"swiss\">Shveytsar</option></select>" +
        "<select id=\"lbTdur\"><option value=\"10\">10 daq</option><option value=\"20\">20 daq</option><option value=\"30\" selected>30 daq</option><option value=\"45\">45 daq</option><option value=\"60\">60 daq</option><option value=\"90\">90 daq</option></select>" +
        "<select id=\"lbTin\"><option value=\"0\">hozir</option><option value=\"2\">2 daq</option><option value=\"5\" selected>5 daq</option><option value=\"10\">10 daq</option><option value=\"30\">30 daq</option></select>" +
        "<select id=\"lbTp\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select></div>" +
        "<div class=\"row\" id=\"lbSw\" style=\"display:none\"><span class=\"muted\">Turlar:</span><select id=\"lbTr\">" +
        "<option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\" selected>5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option><option value=\"10\">10</option><option value=\"11\">11</option></select>" +
        "<span class=\"muted\">Tanaffus:</span><select id=\"lbTiv\"><option value=\"10\">10 s</option><option value=\"20\" selected>20 s</option><option value=\"60\">1 daq</option><option value=\"120\">2 daq</option><option value=\"300\">5 daq</option></select>" +
        "<select id=\"lbTsin\"><option value=\"0\">qo‘lda boshlash</option><option value=\"2\">2 daq</option><option value=\"5\">5 daq</option><option value=\"10\">10 daq</option><option value=\"30\">30 daq</option></select></div>" +
        "<div class=\"muted\">Arena: belgilangan vaqt to‘xtovsiz o‘ynaladi (g‘alaba 2, durang 1, ketma-ket 2 g‘alabadan so‘ng olov ×2, berserk +1). Shveytsar: kamida 3 o‘yinchi.</div></div>" +
        "<div id=\"lbTs\"></div></div>";
      document.body.appendChild(panel);

      $("lbClose").onclick = closePanel;
      $("lbSCreate").onclick = function () {
        sendMsg({ type: "lbSCreate", name: $("lbSn").value, tc: $("lbTc").value, max: Number($("lbSm").value), bonus: Number($("lbSb").value), color: $("lbSc").value, pos: $("lbSp").value });
        $("lbSn").value = "";
      };
      $("lbSnd").onclick = function () { if (window.SPSound) window.SPSound.openSettings(); };
      $("lbTabPl").onclick = function () { curTab = "pl"; renderAll(); };
      $("lbTabT").onclick = function () { curTab = "t"; renderAll(); };
      $("lbTabS").onclick = function () { curTab = "s"; renderAll(); };
      $("lbQuick").onclick = function () {
        if (S.inQueue) sendMsg({ type: "lbQuickCancel" });
        else sendMsg({ type: "lbQuick", tc: $("lbTc").value, pos: $("lbPos").value, games: Number($("lbGm").value) });
      };
      $("lbTk").onchange = function () {
        var a = this.value === "arena";
        $("lbTdur").style.display = a ? "" : "none";
        $("lbTin").style.display = a ? "" : "none";
        $("lbSw").style.display = a ? "none" : "";
      };
      $("lbTCreate").onclick = function () {
        sendMsg({ type: "lbTCreate", kind: $("lbTk").value, pos: $("lbTp").value, duration: Number($("lbTdur").value), startIn: Number($($("lbTk").value === "arena" ? "lbTin" : "lbTsin").value), rounds: Number($("lbTr").value), interval: Number($("lbTiv").value), name: $("lbTn").value, tc: $("lbTc").value });
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
        if (act === "ch") sendMsg({ type: "lbChallenge", toUid: id, tc: $("lbTc").value, pos: $("lbPos").value, games: Number($("lbGm").value) });
        else if (act === "tj") sendMsg({ type: "lbTJoin", tid: id });
        else if (act === "tl") sendMsg({ type: "lbTLeave", tid: id });
        else if (act === "ts") sendMsg({ type: "lbTStart", tid: id });
        else if (act === "tc") sendMsg({ type: "lbTCancel", tid: id });
        else if (act === "go") go(id);
        else if (act === "acc") sendMsg({ type: "lbRespond", id: id, accept: true });
        else if (act === "rej") sendMsg({ type: "lbRespond", id: id, accept: false });
        else if (act === "tlink") shareLink("lbt_", "t", id, "🏆 " + (t.getAttribute("data-n") || "Turnir") + " turniriga qo‘shiling — ShashkaPRO");
        else if (act === "slink") shareLink("lbs_", "s", id, "🎭 " + (t.getAttribute("data-n") || "Sians") + " siansiga qo‘shiling — ShashkaPRO");
        else if (act === "sj") sendMsg({ type: "lbSJoin", sid: id });
        else if (act === "sl") sendMsg({ type: "lbSLeave", sid: id });
        else if (act === "ss") sendMsg({ type: "lbSStart", sid: id });
        else if (act === "sc") sendMsg({ type: "lbSCancel", sid: id });
        else if (act === "sk") sendMsg({ type: "lbSKick", sid: id, uid: t.getAttribute("data-u") });
      });
    }

    function renderAll() {
      if (!panel) return;
      $("lbTabPl").className = curTab === "pl" ? "on" : "";
      $("lbTabT").className = curTab === "t" ? "on" : "";
      $("lbTabS").className = curTab === "s" ? "on" : "";
      $("lbPl").style.display = curTab === "pl" ? "block" : "none";
      $("lbT").style.display = curTab === "t" ? "block" : "none";
      $("lbS").style.display = curTab === "s" ? "block" : "none";
      var _t = curTab === "t";
      var _c = panel.querySelector(".lbcards"); if (_c) _c.style.display = curTab === "pl" ? "flex" : "none";
      var _st = document.getElementById("lbSet"); if (_st && curTab !== "pl") _st.style.display = "none";
      var _tb = panel.querySelector(".tabs"); if (_tb) _tb.style.display = "none";
      var _h = panel.querySelector("h2"); if (_h) _h.textContent = _t ? "🏆 Turnirlar" : (curTab === "s" ? "🎭 Sians" : "🏟 O‘yinchilar zali");
      $("lbQuick").textContent = S.inQueue ? "⏳ Raqib kutilmoqda… (bekor qilish)" : "⚡ Tezkor o‘yin";
      if (curTab === "pl") renderPlayers(); else if (curTab === "s") renderSimuls(); else renderTournaments();
    }

    function renderPlayers() {
      if (!document.getElementById("lbFx")) {
        var fx = document.createElement("style"); fx.id = "lbFx";
        fx.textContent = "#lbPanel{background:linear-gradient(160deg,#1b1450,#3a1a7a 45%,#0f1c4d)!important}" +
          "#lbPanel>*{position:relative;z-index:1}" +
          "#lbPanel::before{content:'';position:fixed;left:0;right:0;top:0;bottom:64px;pointer-events:none;z-index:0;opacity:.7;background-size:340px 220px;animation:lbTw 4s ease-in-out infinite alternate;background-image:radial-gradient(2px 2px at 20px 30px,#fff,transparent),radial-gradient(2px 2px at 90px 120px,#ffd86b,transparent),radial-gradient(1.5px 1.5px at 160px 60px,#fff,transparent),radial-gradient(2px 2px at 230px 180px,#9ad1ff,transparent),radial-gradient(1.5px 1.5px at 300px 90px,#fff,transparent)}" +
          "@keyframes lbTw{from{opacity:.25}to{opacity:.9}}" +
          ".lbc{position:relative;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.35)}" +
          ".lbc::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:lbSh 3.5s infinite}" +
          "@keyframes lbSh{0%{left:-60%}60%,100%{left:140%}}" +
          ".lbin{background:rgba(107,92,240,.28);border-left:3px solid #8b7cff;border-radius:12px;animation:lbPu 1.6s ease-in-out infinite}" +
          "@keyframes lbPu{50%{box-shadow:0 0 14px rgba(139,124,255,.7)}}" +
          ".lbacc{background:#1fb86a;color:#fff;border:0;border-radius:12px;padding:8px 11px}.lbrej{background:#ef5a5a;color:#fff;border:0;border-radius:12px;padding:8px 11px;margin-left:6px}";
        document.head.appendChild(fx);
      }
      if (!document.getElementById("lbStyle")) {
        var st = document.createElement("style"); st.id = "lbStyle";
        st.textContent = ".lbcards{display:flex;flex-direction:column;gap:10px;margin:8px 0}.lbc{border-radius:16px;padding:14px;color:#fff;cursor:pointer}.lbc b{display:block;font-size:17px}.lbc small{opacity:.85}.lbc1{background:linear-gradient(135deg,#f5873b,#e84a9b)}.lbc3{background:linear-gradient(135deg,#2fd27f,#2ee86a);display:flex;align-items:center;gap:10px}.lbmain{flex:1}.lbplay{font-size:22px;padding:0 10px}.lbgear{font-size:22px;padding:0 6px;border-left:1px solid rgba(255,255,255,.3)}.lbp{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.08)}.lbav{width:46px;height:46px;border-radius:50%;background:#2a1fc9;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:18px}.lbinf{flex:1}.lbinf b{display:block}.lbinf small{opacity:.7}.lbpr{box-shadow:0 0 0 3px #f5b82e,0 0 12px rgba(245,184,46,.7)}.lbinv{background:#6b5cf0;color:#fff;border:0;border-radius:14px;padding:7px 12px}";
        document.head.appendChild(st);
      }
      var me = S.me ? S.me.uid : "";
      var out = (S.outgoing || []).reduce(function (a, o) { a[o.toUid] = 1; return a; }, {});

      if (!document.getElementById("lbTickCss")) {
        var tk = document.createElement("style"); tk.id = "lbTickCss";
        tk.textContent = "#lbTick{overflow:hidden;white-space:nowrap;margin:6px -2px;padding:7px 0;border-radius:12px;background:rgba(255,255,255,.08);font-size:13px}#lbTick span{display:inline-block;padding-left:100%;animation:lbMq 28s linear infinite}@keyframes lbMq{to{transform:translateX(-100%)}}";
        document.head.appendChild(tk);
      }
      if (!window.__lbTk || Date.now() - window.__lbTk.t > 60000) {
        window.__lbTk = { t: Date.now(), txt: window.__lbTk ? window.__lbTk.txt : "" };
        fetch("/api/leaderboard").then(function (r) { return r.json(); }).then(function (d) {
          var f = function (a, ic, lab, key, suf) { return a && a[0] ? ic + " " + lab + ": " + a[0].name + " — " + a[0][key] + suf : ""; };
          window.__lbTk.txt = [f(d.wins, "🏆", "Eng ko‘p g‘alaba", "wins", ""), f(d.games, "🎮", "Eng ko‘p o‘yin", "games", ""), f(d.diamonds, "💎", "Boyvachcha", "diamonds", "")].filter(Boolean).join("   •   ");
          var te = document.getElementById("lbTick"); if (te) te.firstChild.textContent = window.__lbTk.txt;
          if (te) te.style.display = window.__lbTk.txt ? "block" : "none";
        }).catch(function () {});
      }
      if (!document.getElementById("lbTick") && panel) {
        var td = document.createElement("div"); td.id = "lbTick"; td.innerHTML = "<span></span>";
        td.firstChild.textContent = window.__lbTk.txt || "";
        td.style.display = window.__lbTk.txt ? "block" : "none";
        var hd = panel.querySelector("h2"); var row = hd && hd.parentNode;
        if (row && row.nextSibling) row.parentNode.insertBefore(td, row.nextSibling); else panel.insertBefore(td, panel.firstChild);
      }
      var all = (S.players || []);
      var list = all.filter(function (p) { return p.uid !== me; });
      var h = "<div class=\"tabs\"><button class=\"on\">🌐 Barcha onlinelar " + all.length + "</button></div>";
      (S.incoming || []).forEach(function (c) {
        h += "<div class=\"lbp lbin\"><div class=\"lbav\">" + esc((c.fromName || "?").charAt(0).toUpperCase()) + "</div><div class=\"lbinf\"><b>" + esc(c.fromName) + "</b><small>sizni o‘yinga taklif qildi · " + esc(c.tc) + "</small></div>" +
          "<button class=\"lbacc\" data-a=\"acc\" data-id=\"" + esc(c.id) + "\">Qabul</button><button class=\"lbrej\" data-a=\"rej\" data-id=\"" + esc(c.id) + "\">Rad</button></div>";
      });
      if (!list.length) h += "<div class=\"card muted\">Hozircha boshqa o‘yinchi yo‘q. “Tasodifiy o‘yin” ▶ ni bosib raqib kutishingiz mumkin.</div>";
      list.forEach(function (p) {
        h += "<div class=\"lbp\"><div class=\"lbav" + (p.prem ? " lbpr" : "") + "\">" + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>" +
          "<div class=\"lbinf\"><b>" + esc(p.name) + (p.prem ? " <span style=\"color:#f5b82e\">👑</span>" : "") + (p.busy ? " 🟡" : "") + "</b><small>ELO " + (p.elo || 1000) + " · 💎 " + (p.gems || 0) + (p.busy ? " · o‘ynayapti" : "") + "</small></div>" +
          (out[p.uid] ? "<span class=\"muted\">chaqirildi…</span>" : (p.busy ? "" : "<button class=\"lbinv\" data-a=\"ch\" data-id=\"" + esc(p.uid) + "\">O‘yinga taklif</button>")) + "</div>";
      });
      $("lbPl").innerHTML = h;
    }

    // ---------- Simul (bitta xo'jayin ko'p o'yinchi bilan bir vaqtda) ----------
    function fmtMs(ms) {
      var s = Math.ceil(ms / 1000);
      return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
    }

    function renderSimuls() {
      var box = $("lbSs");
      if (!box) return;
      var me = S.me ? S.me.uid : "";
      var ss = S.simuls || [];
      if (!ss.length) { box.innerHTML = "<div class=\"card muted\">Hozircha simul yo‘q. Birinchi bo‘lib oching!</div>"; return; }
      var order = { running: 0, reg: 1, finished: 2 };
      ss = ss.slice().sort(function (a, b) { return order[a.status] - order[b.status]; });
      var h = "";
      ss.forEach(function (s) {
        var host = s.hostUid === me;
        var joined = s.players.some(function (p) { return p.uid === me; });
        var stTxt = s.status === "reg" ? "Ro‘yxat ochiq" : (s.status === "running" ? "Davom etmoqda" : "Tugagan");
        var colTxt = s.color === "w" ? "mezbon oq" : (s.color === "b" ? "mezbon qora" : "ranglar navbat bilan");
        h += "<div class=\"card\" id=\"lbsc_" + esc(s.id) + "\"><div><b>🎭 " + esc(s.name) + "</b></div><div class=\"muted\">" + esc(s.tc) +
          (s.bonus ? " · mezbonga +" + s.bonus + " daq" : "") + (s.pos === "idf" ? " · IDF 780" : "") + " · " + colTxt + " · " + stTxt +
          "<br>Mezbon: " + esc(s.hostName) + " · " + s.players.length + "/" + s.max + " o‘yinchi</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"slink\" data-id=\"" + esc(s.id) + "\" data-n=\"" + esc(s.name) + "\">🔗 Havola</button>";
        if (s.status === "reg") {
          if (host) h += "<button class=\"grn\" data-a=\"ss\" data-id=\"" + s.id + "\">▶ Boshlash</button><button class=\"red\" data-a=\"sc\" data-id=\"" + s.id + "\">Bekor qilish</button>";
          else if (joined) h += "<button class=\"sec\" data-a=\"sl\" data-id=\"" + s.id + "\">Chiqish</button>";
          else h += "<button data-a=\"sj\" data-id=\"" + s.id + "\">Qo‘shilish</button>";
        }
        h += "</div>";
        if (s.status === "reg") {
          s.players.forEach(function (p) {
            h += "<div class=\"pl\"><span>" + esc(p.name) + (p.uid === me ? " 👈" : "") + "</span>" +
              (host ? "<button class=\"sec\" data-a=\"sk\" data-id=\"" + s.id + "\" data-u=\"" + esc(p.uid) + "\">✕</button>" : "") + "</div>";
          });
        } else {
          var sc = s.score || { w: 0, d: 0, l: 0 };
          h += "<div class=\"muted\">Mezbon hisobi: +" + sc.w + " =" + sc.d + " −" + sc.l + "</div>";
          var turnGames = s.games.filter(function (g) { return !g.done && g.hostTurn; })
            .sort(function (a, b) { return a.hostMs - b.hostMs; });
          if (host && s.status === "running" && turnGames.length) {
            h += "<div class=\"row\"><button class=\"grn\" data-a=\"go\" data-id=\"" + esc(turnGames[0].roomId) + "\">▶ Keyingi taxta (" + turnGames.length + ")</button></div>";
          }
          var mine = s.games.filter(function (g) { return g.uid === me; })[0];
          if (!host && mine && !mine.done) h += "<div class=\"row\"><button class=\"grn\" data-a=\"go\" data-id=\"" + esc(mine.roomId) + "\">▶ O‘yinga o‘tish</button></div>";
          h += "<table><tr><th>#</th><th>O‘yinchi</th><th>Holat</th><th></th></tr>";
          var rows = s.games.slice().sort(function (a, b) {
            if (a.done !== b.done) return a.done ? 1 : -1;
            if (a.hostTurn !== b.hostTurn) return a.hostTurn ? -1 : 1;
            return a.hostMs - b.hostMs;
          });
          rows.forEach(function (g, i) {
            var st;
            if (g.done) st = g.result === "host" ? "✅ +" : (g.result === "draw" ? "🤝 =" : (g.result === "player" ? "❌ −" : "—"));
            else st = (g.hostTurn ? "🟢 navbat sizda · " : "⏳ ") + fmtMs(g.hostMs);
            h += "<tr><td>" + (i + 1) + "</td><td>" + esc(g.name) + (g.uid === me ? " 👈" : "") + "</td><td>" + st + "</td><td>" +
              ((host || g.uid === me) && !g.done ? "<button data-a=\"go\" data-id=\"" + esc(g.roomId) + "\">▶</button>" : "") + "</td></tr>";
          });
          h += "</table>";
        }
        h += "</div>";
      });
      box.innerHTML = h;
      applyHl();
    }

    // Xo'jayin uchun suzuvchi tugma: navbat o'zida bo'lgan keyingi taxtaga o'tadi (vaqti eng kam bo'lgani)
    function updateSimulBtn() {
      var me = S && S.me ? S.me.uid : "";
      var cur = typeof curRoom !== "undefined" ? curRoom : null;
      var best = null, n = 0;
      (S.simuls || []).forEach(function (s) {
        if (s.hostUid !== me || s.status !== "running") return;
        s.games.forEach(function (g) {
          if (g.done || !g.hostTurn || g.roomId === cur) return;
          n++;
          if (!best || g.hostMs < best.hostMs) best = g;
        });
      });
      var b = document.getElementById("lbNext");
      if (!best) { if (b) b.style.display = "none"; return; }
      if (!b) {
        b = document.createElement("button");
        b.id = "lbNext";
        b.style.cssText = "position:fixed;right:12px;bottom:112px;z-index:2147482000;padding:10px 14px;border-radius:20px;border:0;background:#2e9e4f;color:#fff;font:700 14px Arial;box-shadow:0 2px 10px rgba(0,0,0,.4);cursor:pointer";
        document.body.appendChild(b);
      }
      b.style.display = "";
      b.textContent = "🎭 Keyingi taxta · " + n;
      b.onclick = function () { go(best.roomId); };
    }

    var clubAll = false, clubView = null, clubOpen = true, clubImgData = "", clubN = "", clubD = "";
    window.lbCImg = function (inp, cid) {
      var f = inp.files && inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var c = document.createElement("canvas"); c.width = c.height = 96;
          var s = Math.min(im.width, im.height);
          c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 96, 96);
          var d = c.toDataURL("image/jpeg", 0.7);
          if (cid) sendMsg({ type: "lbClubImg", cid: cid, img: d }); else { clubImgData = d; renderClubs(); }
        };
        im.src = r.result;
      };
      r.readAsDataURL(f); inp.value = "";
    };
    window.lbCA = function (act, id, u) {
      var n0 = $("lbCn"), d0 = $("lbCdsc"); if (n0) clubN = n0.value; if (d0) clubD = d0.value;
      if (act === "cv") { clubView = id; clubAll = false; }
      else if (act === "cb") { clubView = null; }
      else if (act === "ca") { clubAll = !clubAll; }
      else if (act === "cj") sendMsg({ type: "lbClubJoin", cid: id });
      else if (act === "cl") sendMsg({ type: "lbClubLeave", cid: id });
      else if (act === "cd") { if (confirm("Klub yopilsinmi?")) { sendMsg({ type: "lbClubDisband", cid: id }); clubView = null; } }
      else if (act === "ck") sendMsg({ type: "lbClubKick", cid: id, uid: u });
      else if (act === "cy") sendMsg({ type: "lbClubAccept", cid: id, uid: u });
      else if (act === "cx") sendMsg({ type: "lbClubReject", cid: id, uid: u });
      else if (act === "cm") sendMsg({ type: "lbClubAdmin", cid: id, uid: u });
      else if (act === "ct") sendMsg({ type: "lbClubSet", cid: id, open: u === "1" });
      else if (act === "co") { clubOpen = !clubOpen; }
      else if (act === "cp") { var f = $(id ? "lbCfileA" : "lbCfile"); if (f) f.click(); return; }
      else if (act === "cn") { sendMsg({ type: "lbClubCreate", name: clubN, desc: clubD, open: clubOpen, img: clubImgData }); clubN = ""; clubD = ""; clubImgData = ""; clubOpen = true; }
      renderClubs();
    };
    function cav(c, big) {
      var sz = big ? 64 : 44, st = "width:" + sz + "px;height:" + sz + "px;flex:none";
      if (c.img) return "<div class=\"lbav2\" style=\"" + st + ";background:url(" + esc(c.img) + ") center/cover\"></div>";
      return "<div class=\"lbav2\" style=\"" + st + "\">" + esc((c.name || "?").charAt(0).toUpperCase()) + "</div>";
    }
    function renderClubs() {
      var box = $("lbT"); if (!box) return;
      if (!document.getElementById("lbCStyle")) {
        var st = document.createElement("style"); st.id = "lbCStyle";
        st.textContent = "#lbT.lbhide #lbTbar,#lbT.lbhide #lbTs,#lbT.lbhide #lbTform{display:none!important}.lbcl{border-radius:18px;background:#161a3a;border:1px solid rgba(255,255,255,.1);padding:14px;margin:8px 0}.lbcr{display:flex;align-items:center;gap:12px;padding:10px;margin-top:8px;border-radius:14px;background:#1e2348;cursor:pointer}.lbav2{width:44px;height:44px;border-radius:12px;background:#3a2fc9;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:18px}.lbcr .lbinf{flex:1}.lbcr .lbinf b{display:block}.lbcr .lbinf small{opacity:.7}.lbl{color:#8b7cff;cursor:pointer}.lbcm{display:flex;justify-content:space-between;align-items:center;padding:8px 2px;border-bottom:1px solid rgba(255,255,255,.07)}" + ".lbcl b,.lbcl .muted{word-break:break-word;overflow-wrap:anywhere}.lbcl textarea{width:100%;box-sizing:border-box;margin-bottom:6px;min-height:64px;resize:vertical}.lbbd{font-size:12px;padding:2px 8px;border-radius:10px;background:#2a3166;margin-left:6px}";
        document.head.appendChild(st);
      }
      var el = $("lbClubs");
      if (!el) { el = document.createElement("div"); el.id = "lbClubs"; box.insertBefore(el, box.firstChild); }
      var ae = document.activeElement;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA") && el.contains(ae)) return;
      var cs = S.clubs || [], me = S.me ? S.me.uid : "", h = "";
      var cur = clubView ? cs.filter(function (x) { return x.id === clubView; })[0] : null;
      if (clubView && !cur) clubView = null;
      box.classList.toggle("lbhide", !!cur);
      if (cur) {
        var lead = cur.leaderUid === me, adm = !!cur.isAdmin;
        h += "<div class=\"lbcl\"><div class=\"row\"><button class=\"sec\" onclick=\"lbCA('cb')\">←</button>" + cav(cur, true) +
          "<b style=\"font-size:18px;flex:1\">" + esc(cur.name) + "</b></div>" +
          "<div class=\"muted\" style=\"margin-top:8px\">" + (cur.open ? "🔓 Ochiq klub" : "🔒 Yopiq klub") + "</div>" +
          (cur.desc ? "<div class=\"muted\" style=\"margin:8px 0\">" + esc(cur.desc) + "</div>" : "") +
          "<div class=\"muted\">👑 Rahbar: " + esc(cur.leaderName) + " · " + cur.count + " a‘zo</div><div class=\"row\" style=\"margin-top:10px;flex-wrap:wrap\">";
        if (cur.joined) h += "<button class=\"sec\" onclick=\"lbCA('cl','" + cur.id + "')\">Chiqish</button>";
        else if (cur.requested) h += "<button class=\"sec\" disabled>So‘rov yuborildi ⏳</button>";
        else h += "<button onclick=\"lbCA('cj','" + cur.id + "')\">" + (cur.open ? "Qo‘shilish" : "So‘rov yuborish") + "</button>";
        if (adm) h += "<button class=\"sec\" onclick=\"lbCA('cp','" + cur.id + "')\">🖼 Rasm</button>" +
          "<button class=\"sec\" onclick=\"lbCA('ct','" + cur.id + "','" + (cur.open ? "0" : "1") + "')\">" + (cur.open ? "🔒 Yopiq qilish" : "🔓 Ochiq qilish") + "</button>" +
          "<input id=\"lbCfileA\" type=\"file\" accept=\"image/*\" style=\"display:none\" onchange=\"lbCImg(this,'" + cur.id + "')\">";
        if (lead) h += "<button class=\"red\" onclick=\"lbCA('cd','" + cur.id + "')\">Klubni yopish</button>";
        h += "</div>";
        if (adm && cur.pend && cur.pend.length) {
          h += "<div style=\"margin-top:12px\"><b>📩 Qo‘shilish so‘rovlari (" + cur.pend.length + ")</b>";
          cur.pend.forEach(function (p) {
            h += "<div class=\"lbcm\"><span>" + esc(p.name) + "</span><span><button onclick=\"lbCA('cy','" + cur.id + "','" + esc(p.uid) + "')\">✓</button> <button class=\"sec\" onclick=\"lbCA('cx','" + cur.id + "','" + esc(p.uid) + "')\">✕</button></span></div>";
          });
          h += "</div>";
        }
        h += "<div style=\"margin-top:10px\">";
        cur.members.forEach(function (m) {
          var isL = m.uid === cur.leaderUid;
          h += "<div class=\"lbcm\"><span>" + (isL ? "👑 " : (m.admin ? "⭐ " : "")) + esc(m.name) + (m.uid === me ? " 👈" : "") + "</span><span>" +
            (lead && !isL ? "<button class=\"sec\" onclick=\"lbCA('cm','" + cur.id + "','" + esc(m.uid) + "')\">" + (m.admin ? "⭐✕" : "⭐") + "</button> " : "") +
            (adm && m.uid !== me && !isL && (lead || !m.admin) ? "<button class=\"sec\" onclick=\"lbCA('ck','" + cur.id + "','" + esc(m.uid) + "')\">✕</button>" : "") + "</span></div>";
        });
        h += "</div></div>";
      } else {
        var shown = clubAll ? cs : cs.slice(0, 3);
        h += "<div class=\"lbcl\"><div class=\"row\" style=\"justify-content:space-between\"><b>👥 Klublarga qo‘shiling</b><span class=\"lbl\" onclick=\"lbCA('ca')\">" + (clubAll ? "Yopish" : "Barcha klublar ›") + "</span></div>" +
          "<div class=\"muted\" style=\"margin-top:6px\">Klub safida o‘ynang va turnirlarda birga qatnashing.</div>";
        if (!shown.length) h += "<div class=\"muted\" style=\"margin-top:10px\">Hozircha klub yo‘q. Birinchi bo‘lib oching!</div>";
        shown.forEach(function (c) {
          h += "<div class=\"lbcr\" onclick=\"lbCA('cv','" + c.id + "')\">" + cav(c, false) + "<div class=\"lbinf\"><b>" + esc(c.name) + "</b><small>" + (c.open ? "🔓" : "🔒") + " " + c.count + " a‘zo" + (c.joined ? " · siz a‘zosiz" : (c.requested ? " · so‘rov yuborilgan" : "")) + "</small></div><span>›</span></div>";
        });
        if (clubAll) {
          h += "<div style=\"margin-top:12px\"><div class=\"row\" style=\"margin-bottom:6px\">" + (clubImgData ? cav({ img: clubImgData }, true) : "") +
            "<button class=\"sec\" onclick=\"lbCA('cp','')\">🖼 Klub rasmi</button>" +
            "<button class=\"sec\" onclick=\"lbCA('co')\">" + (clubOpen ? "🔓 Ochiq klub" : "🔒 Yopiq klub") + "</button></div>" +
            "<input id=\"lbCfile\" type=\"file\" accept=\"image/*\" style=\"display:none\" onchange=\"lbCImg(this,'')\">" +
            "<input id=\"lbCn\" maxlength=\"40\" placeholder=\"Klub nomi\" value=\"" + esc(clubN) + "\" style=\"width:100%;margin-bottom:6px\">" +
            "<textarea id=\"lbCdsc\" maxlength=\"300\" placeholder=\"Tavsif (ixtiyoriy)\">" + esc(clubD) + "</textarea>" +
            "<div class=\"muted\" style=\"margin-bottom:6px\">" + (clubOpen ? "Ochiq klubga hamma darhol qo‘shiladi." : "Yopiq klubga faqat admin ruxsati bilan qo‘shiladi.") + "</div>" +
            "<button style=\"width:100%\" onclick=\"lbCA('cn')\">➕ Klub ochish</button></div>";
        }
        h += "</div>";
      }
      el.innerHTML = h;
    }
    window.lbFriend = function () { sendMsg({ type: "lbFriendNew", tc: $("lbTc").value, pos: $("lbPos").value, games: Number($("lbGm").value) }); toast("🔗 Havola tayyorlanmoqda…", null, 2000); };
    var tFil = "new";
    window.lbTF = function (f) { tFil = f === 2 ? "fin" : "new"; renderTournaments(); };
    window.lbTPlus = function () { var f = $("lbTform"); if (f) f.style.display = f.style.display === "none" ? "block" : "none"; };
    window.lbTRef = function () { renderTournaments(); };
    function renderTournaments() {
      if (!document.getElementById("lbTStyle")) {
        var stt = document.createElement("style"); stt.id = "lbTStyle";
        stt.textContent = "#lbT{padding-top:4px}#lbTbar{display:flex;align-items:center;gap:8px;margin:6px 0 10px}#lbTbar .tabs{flex:1;display:flex;gap:6px;margin:0}#lbTbar .tabs button{flex:1;padding:11px 6px;border-radius:14px}#lbTbar .tabs button.on{background:#12a966;color:#fff}#lbTbar .ib{width:44px;height:44px;padding:0;font-size:20px;border-radius:14px}#lbTs .card,#lbTform{border-radius:18px;background:#161a3a;border:1px solid rgba(255,255,255,.1)}";
        document.head.appendChild(stt);
      }
      var _bx = $("lbT");
      if (_bx && !$("lbTbar")) {
        var _f = _bx.querySelector(".card"); if (_f) { _f.id = "lbTform"; _f.style.display = "none"; }
        var _d = document.createElement("div"); _d.id = "lbTbar"; _bx.insertBefore(_d, _bx.firstChild);
      }
      renderClubs();
      if ($("lbTbar")) {
        var _n = (S.tournaments || []).filter(function (t) { return t.status !== "finished"; }).length;
        $("lbTbar").innerHTML = '<div class="tabs"><button class="' + (tFil === "new" ? "on" : "") + '" onclick="lbTF(1)">⚡ Yangi ' + _n + '</button><button class="' + (tFil === "fin" ? "on" : "") + '" onclick="lbTF(2)">🏁 Tugagan</button></div>' +
          '<button class="sec ib" onclick="lbTPlus()">➕</button><button class="sec ib" onclick="lbTRef()">🔄</button>';
      }
      var me = S.me ? S.me.uid : "";
      var ts = (S.tournaments || []).filter(function (t) { return tFil === "fin" ? t.status === "finished" : t.status !== "finished"; }).sort(function (a, b) {
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
          : (t.status === "reg" ? "Ro‘yxat ochiq · " + (t.roundsWanted || "?") + " tur" + (t.startAt ? " · boshlanishi: " + mins(t.startAt - Date.now()) : "") : (t.status === "running" ? t.round + "/" + t.rounds + "-tur" : "Tugagan"));
        h += "<div class=\"card\" id=\"lbtc_" + esc(t.id) + "\"><div><b>" + (arena ? "⚔️" : "🏆") + " " + esc(t.name) + "</b></div><div class=\"muted\">" + esc(t.tc) + (t.pos === "idf" ? " · IDF 780" : "") + " · " + st + " · " + t.players.length + " o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"tlink\" data-id=\"" + esc(t.id) + "\" data-n=\"" + esc(t.name) + "\">🔗 Havola</button>";
        if (t.status === "reg") {
          if (!joined) h += "<button data-a=\"tj\" data-id=\"" + t.id + "\">Qo‘shilish</button>";
          else if (t.creatorUid !== me) h += "<button class=\"sec\" data-a=\"tl\" data-id=\"" + t.id + "\">Chiqish</button>";
          if (t.creatorUid === me) {
            h += "<button class=\"grn\" data-a=\"ts\" data-id=\"" + t.id + "\">▶ Boshlash</button><button class=\"red\" data-a=\"tc\" data-id=\"" + t.id + "\">Bekor qilish</button>";
          }
        }
        if (!arena && t.status === "running") {
          var meS = t.players.filter(function (p) { return p.uid === me; })[0];
          if (meS && !meS.withdrawn) h += "<button class=\"sec\" data-a=\"tl\" data-id=\"" + t.id + "\">⏸ Pauza</button>";
          else if (meS || t.round <= Math.ceil(t.rounds / 2)) h += "<button data-a=\"tj\" data-id=\"" + t.id + "\">" + (meS ? "Qaytish" : "Qo‘shilish") + "</button>";
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
          else if (t.nextAt) h += "<span class=\"muted\">Keyingi tur: " + Math.max(0, Math.ceil((t.nextAt - Date.now()) / 1000)) + " s</span>";
          else if (joined) h += "<span class=\"muted\">" + (arena ? "Raqib qidirilmoqda…" : "Stolingiz tugadi, boshqalarni kuting") + "</span>";
        }
        h += "</div>";
        h += "<table><tr><th>#</th><th>O‘yinchi</th><th>Ochko</th><th>" + (arena ? "O‘yin" : "SB") + "</th>" + (arena ? "" : "<th>Bux.</th>") + "</tr>";
        t.players.slice(0, 12).forEach(function (p, i) {
          h += "<tr><td>" + (i + 1) + "</td><td>" + esc(p.name) + (p.uid === me ? " 👈" : "") + (p.withdrawn ? " <span class=\"muted\">(chiqdi)</span>" : "") + "</td><td>" + p.score + (p.fire ? " 🔥" : "") + "</td><td>" + (arena ? p.games : p.sb) + "</td>" + (arena ? "" : "<td>" + p.buch + "</td>") + "</tr>";
        });
        h += "</table>";
        if (t.players.length > 12) h += "<div class=\"muted\">… va yana " + (t.players.length - 12) + " o‘yinchi</div>";
        h += "</div>";
      });
      $("lbTs").innerHTML = h;
      applyHl();
    }

    // keyingi tur sanog'i uchun sekin yangilash
    setInterval(function () { if (panelOpen && curTab === "t") renderTournaments(); }, 2000);

    // Turnir boshlanishidan oldin 10 → 1 sanash (faqat qo'shilgan o'yinchilarga)
    (function () {
      var lastKey = "";
      setInterval(function () {
        var me = S && S.me ? S.me.uid : null;
        if (!me || !window.SPSound) return;
        var now = Date.now() + (window.__lbSkew || 0);
        (S.tournaments || []).forEach(function (t) {
          if (t.status !== "reg" || !t.startAt) return;
          if (t.type !== "arena" && t.players.length < 3) return;
          if (!t.players.some(function (p) { return p.uid === me; })) return;
          var left = Math.ceil((t.startAt - now) / 1000);
          if (left >= 1 && left <= 10) {
            var key = t.id + ":" + left;
            if (key !== lastKey) { lastKey = key; window.SPSound.count(left); }
          }
        });
      }, 200);
    })();

    connect();
  }
})();
