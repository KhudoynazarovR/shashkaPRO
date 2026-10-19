/* lobbyclient.js — onlayn zal va turnirlar (brauzer qismi).
   index.html ga server avtomatik ulaydi. O'yin xonalari roomclient.js orqali ochiladi (?room=ID). */
(function () {
  "use strict";
  var ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
  var q = new URLSearchParams(location.search);
  var TCS = ["1+1", "2+2", "3+2", "5+3"];

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
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && !/^(ref_|pz_|pf_|go_|shop_)/.test(tg.initDataUnsafe.start_param)) curRoom = String(tg.initDataUnsafe.start_param);
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
      "#lbPanel{position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b1017;color:#e9eef5;font:14px/1.4 Arial,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px calc(env(safe-area-inset-bottom,0px) + 40px);display:none}" +
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
        "<div class=\"tabs\"><button id=\"lbTabPl\">🌐 Online o‘yinchilar</button><button id=\"lbTabT\" style=\"display:none\">🏆 Turnirlar</button><button id=\"lbTabS\" style=\"display:none\">🎭 Sians</button></div>" +
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
        "<div class=\"row\"><select id=\"lbTk\"><option value=\"arena\">⚔️ Arena</option><option value=\"swiss\">Shveytsar</option><option value=\"olympic\">🏆 Olimpiya</option></select>" +
        "<select id=\"lbTdur\"><option value=\"10\">10 daq</option><option value=\"20\">20 daq</option><option value=\"30\" selected>30 daq</option><option value=\"45\">45 daq</option><option value=\"60\">60 daq</option><option value=\"90\">90 daq</option></select>" +
        "<select id=\"lbTin\" style=\"display:none\"><option value=\"0\">hozir</option><option value=\"2\">2 daq</option><option value=\"5\" selected>5 daq</option><option value=\"10\">10 daq</option><option value=\"30\">30 daq</option></select>" +
        "<select id=\"lbTp\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select></div>" +
"<div class=\"row\"><span class=\"muted\">Vaqt:</span><select id=\"lbTtc\">" + tcOpts + "</select></div>" +
"<div class=\"row\" id=\"lbTbzr\"><label><input type=\"checkbox\" id=\"lbTbz\" checked> ⚡ Berserk yoqilgan</label></div>" +
"<div class=\"row\"><span class=\"muted\">🪙 Mukofot:</span><input id=\"lbTpz\" type=\"number\" min=\"100\" value=\"100\" style=\"flex:1;min-width:0\"></div>" +
"<div class=\"row\"><span class=\"muted\">🏅 Mukofot oladigan o‘rinlar:</span><select id=\"lbTpl\"><option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\">5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option><option value=\"10\">10</option></select></div>" +
"<div id=\"lbTpzc\" class=\"muted\" style=\"font-size:12px\"></div>" +
        "<div class=\"row\"><span class=\"muted\">📅 Aniq sana va vaqt:</span><input id=\"lbTat\" type=\"datetime-local\" style=\"flex:1;min-width:0\"><button id=\"lbTatX\" type=\"button\" class=\"sec\">✕</button></div>" +
        "<div class=\"row\" id=\"lbSw\" style=\"display:none\"><span class=\"muted\">Turlar:</span><select id=\"lbTr\">" +
        "<option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\" selected>5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option><option value=\"10\">10</option><option value=\"11\">11</option></select>" +
        "<span class=\"muted\">Tanaffus:</span><select id=\"lbTiv\"><option value=\"10\">10 s</option><option value=\"20\" selected>20 s</option><option value=\"60\">1 daq</option><option value=\"120\">2 daq</option><option value=\"300\">5 daq</option></select>" +
        "<select id=\"lbTsin\"><option value=\"0\">qo‘lda boshlash</option><option value=\"2\">2 daq</option><option value=\"5\">5 daq</option><option value=\"10\">10 daq</option><option value=\"30\">30 daq</option></select></div>" +
        "<div id=\"lbTinfo\" class=\"muted\">Arena: belgilangan vaqt to‘xtovsiz o‘ynaladi (g‘alaba 2, durang 1, ketma-ket 2 g‘alabadan so‘ng olov ×2, berserk +1). Shveytsar: kamida 3 o‘yinchi.</div></div>" +
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
        $("lbTin").style.display = "none";
        $("lbSw").style.display = this.value === "swiss" ? "" : "none";
        var K = this.value, I = $("lbTinfo"); if (I) I.textContent = K === "swiss" ? "Shveytsar: turlar bo‘yicha o‘ynaladi, kamida 3 o‘yinchi kerak." : K === "olympic" ? "Olimpiya: yutgan keyingi bosqichga o‘tadi, yutqazgan o‘yindan chiqadi." : "Arena: belgilangan vaqt to‘xtovsiz o‘ynaladi (g‘alaba 2, durang 1, ketma-ket 2 g‘alabadan so‘ng olov ×2, berserk +1).";
        { var br = $("lbTbzr"); if (br) br.style.display = K === "arena" ? "" : "none"; }
      };
      $("lbTk").onchange();
      var PZT = { 3: [50,30,20], 4: [40,28,20,12], 5: [35,25,18,13,9], 6: [30,22,17,13,10,8], 7: [28,20,15,12,10,8,7], 8: [26,19,15,12,10,8,5,5], 9: [24,18,14,11,10,8,6,5,4], 10: [22,17,13,11,9,8,7,5,4,4] };
      var _pzc = function () {
        var v = Math.floor(Number($("lbTpz").value) || 0), n = Number($("lbTpl").value) || 3, e = $("lbTpzc"); if (!e) return;
        if (v < 100) { e.textContent = "Kamida 100 🪙 (admin uchun cheklov yo‘q)"; return; }
        var M = ["🥇", "🥈", "🥉"], t = PZT[n] || PZT[3];
        e.textContent = t.map(function (p, i) { return (M[i] || (i + 1) + ".") + " " + Math.floor(v * p / 100); }).join(" · ") + " 🪙 — yaratilganda yechiladi: " + v;
      };
      $("lbTpz").oninput = _pzc; $("lbTpl").onchange = _pzc; _pzc();
      $("lbTCreate").onclick = function () {
        window.lbAtOk() && sendMsg({ type: "lbTCreate", startAt: window.lbAt(), clubIds: lbClubIds(), kind: $("lbTk").value, pos: $("lbTp").value, duration: Number($("lbTdur").value), startIn: Number($($("lbTk").value === "arena" ? "lbTin" : "lbTsin").value), rounds: Number($("lbTr").value), interval: Number($("lbTiv").value), name: $("lbTn").value, tc: $("lbTtc").value, berserk: $("lbTbz").checked, prize: Number($("lbTpz").value)||0, places: Number($("lbTpl").value)||3 });
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
        if (act === "ch") sendMsg({ type: "lbChallenge", toUid: id, tc: $("lbTc").value, pos: $("lbPos").value, games: Number($("lbGm").value) }); else if (act === "cx") sendMsg({ type: "lbCancelTo", toUid: id });
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
      window.lbFriendAdd = function (u) { sendMsg({ type: "lbFriendReq", uid: String(u) }); };
      window.lbFriendRemove = function (u) { sendMsg({ type: "lbFriendRemove", uid: String(u) }); };
      window.lbFriendState = function (u) { try { u = String(u); if (u === String(me)) return "me"; if (/^bot(_|$)/.test(u)) return "bot"; return (S.friends || []).some(function (f) { return String(f.uid) === u; }) ? "friend" : "ok"; } catch (e) { return "ok"; } };
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
          window.__lbTk.txt = [f(d.wins, "🏆", "Eng ko‘p g‘alaba", "wins", ""), f(d.games, "🎮", "Eng ko‘p o‘yin", "games", ""), f(d.diamonds, "🪙", "Boyvachcha", "diamonds", "")].filter(Boolean).join("   •   ");
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
    function avh(uid, has, name, pr) { return '<div class="lbav' + (pr ? ' lbpr' : '') + '" style="overflow:hidden;cursor:pointer" onclick="window.spUser&&spUser(\'' + String(uid).replace(/[^0-9A-Za-z_-]/g, '') + '\')">' + (has ? '<img src="/api/av/' + encodeURIComponent(uid) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">' : '👤') + '</div>'; }
      var list = all.slice().sort(function (a, b) { return (b.uid === me ? 1 : 0) - (a.uid === me ? 1 : 0); });
    var fl = S.friends || [], fin = S.freqIn || [], fset = {}, showF = !!window.__lbF;
    fl.forEach(function (f) { fset[f.uid] = 1; });
    if (showF) list = fl.map(function (f) { return { uid: f.uid, name: f.name, elo: f.elo, gems: f.gems, hasAv: f.hasAv, busy: false, offline: !f.online }; });
      var h = "<div class=\"tabs\"><button class=\"lbtb" + (showF ? "" : " on") + "\" data-t=\"pl\">🌐 Online o‘yinchilar " + all.length + "</button><button class=\"lbtb" + (showF ? " on" : "") + "\" data-t=\"f\">👥 Do‘stlar " + fl.length + (fin.length ? " 🔴" : "") + "</button></div>";
    fin.forEach(function (r) { h += '<div class="lbp lbin">' + avh(r.uid, r.hasAv, r.name, false) + '<div class="lbinf"><b>' + esc(r.name) + '</b><small>do‘st bo‘lishni taklif qildi</small></div><button class="lbacc" data-f="acc" data-id="' + esc(r.uid) + '">Qabul</button><button class="lbrej" data-f="rej" data-id="' + esc(r.uid) + '">Rad</button></div>'; });
      (S.incoming || []).forEach(function (c) {
        h += "<div class=\"lbp lbin\"><div class=\"lbav\">" + esc((c.fromName || "?").charAt(0).toUpperCase()) + "</div><div class=\"lbinf\"><b>" + esc(c.fromName) + "</b><small>sizni o‘yinga taklif qildi · " + esc(c.tc) + "</small></div>" +
          "<button class=\"lbacc\" data-a=\"acc\" data-id=\"" + esc(c.id) + "\">Qabul</button><button class=\"lbrej\" data-a=\"rej\" data-id=\"" + esc(c.id) + "\">Rad</button></div>";
      });
      if (!list.length) h += "<div class=\"card muted\">Hozircha boshqa o‘yinchi yo‘q. “Tasodifiy o‘yin” ▶ ni bosib raqib kutishingiz mumkin.</div>";
      list.forEach(function (p) {
        h += "<div class=\"lbp\">" + avh(p.uid, p.hasAv, p.name, p.prem) +
          "<div class=\"lbinf\"><b>" + (p.bot ? esc(p.name).replace(/BOT\s*$/, "<span style=\"color:#ff2b2b;text-shadow:0 0 8px #ff0000\">BOT</span>") : esc(p.name)) + (p.prem ? " <span style=\"color:#f5b82e\">👑</span>" : "") + (p.busy ? " 🟡" : "") + "</b><small>ELO " + (p.elo || 1000) + " · 🪙 " + (p.gems || 0) + (p.busy ? " · o‘ynayapti" : "") + "</small></div>" +
          (p.uid === me ? "<i class='muted'>Bu siz</i>" : p.offline ? "<span class='muted'>oflayn</span>" : (fset[p.uid] || /^bot(_|$)/.test(String(p.uid))) ? "" : "") + (p.uid === me || p.offline ? "" : out[p.uid] ? "<button class=\"lbinv\" style=\"background:#8a2b2b\" data-a=\"cx\" data-id=\"" + esc(p.uid) + "\">✕ Bekor</button>" : (p.busy ? "" : "<button class=\"lbinv\" data-a=\"ch\" data-id=\"" + esc(p.uid) + "\">O‘yinga taklif</button>")) + "</div>";
      });
      $("lbPl").innerHTML = h;
    Array.prototype.forEach.call($("lbPl").querySelectorAll('[data-t]'), function (b) {
      b.onclick = function () { window.__lbF = b.getAttribute('data-t') === 'f'; renderAll(); };
    });
    Array.prototype.forEach.call($("lbPl").querySelectorAll('[data-f]'), function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-f'), id = b.getAttribute('data-id');
        if (a === 'add') { sendMsg({ type: 'lbFriendReq', uid: id }); b.textContent = '✓ Yuborildi'; b.disabled = true; }
        else sendMsg({ type: 'lbFriendResp', uid: id, accept: a === 'acc' });
      };
    });
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
    window.lbAt = function () { var e = $("lbTat"); if (!e || !e.value) return 0; var t = new Date(e.value).getTime(); return isNaN(t) ? 0 : t; };
    window.lbAtOk = function () {
      var t = window.lbAt(); if (!t) return true;
      var n = Date.now();
      if (t < n + 60000 || t > n + 183 * 86400000) { alert("Boshlanish vaqti hozirdan 1 daqiqadan 6 oygacha bo‘lishi kerak"); return false; }
      return true;
    };
    document.addEventListener("click", function (e) { if (e.target && e.target.id === "lbTatX") { var i = $("lbTat"); if (i) i.value = ""; } });
    window.lbClubIds = function () {
      var r = [];
      [].forEach.call(document.querySelectorAll("#lbTclRow input[data-cl]:checked"), function (x) { if (r.indexOf(x.value) < 0 && r.length < 6) r.push(x.value); });
      return r;
    };
    window.lbClubTbl = function (t) {
      if (!t.clubIds || !t.clubIds.length) return "";
      var cs = t.clubs || [];
      var h = "<div style=\"margin-top:10px\"><b>🛡 " + (cs.length > 1 ? "Klublar hisobi" : "Klub turniri") + "</b>";
      cs.forEach(function (c, i) {
        h += "<div class=\"lbcm\"><span>" + (i + 1) + ". " + esc(c.name) + " <small class=\"muted\">(" + c.players + " o‘yinchi)</small></span><b>" + c.score + "</b></div>";
      });
      return h + "</div>";
    };
    var clSig = "";
    setInterval(function () {
      var f = $("lbTform"); if (!f) return;
      var cs = S.clubs || [];
      var sig = cs.map(function (c) { return c.id + (c.isAdmin ? "a" : "m"); }).join();
      var row = $("lbTclRow");
      if (row && sig === clSig) return;
      var keepIds = window.lbClubIds ? window.lbClubIds() : [];
      if (!row) { row = document.createElement("div"); row.id = "lbTclRow"; row.className = "row"; f.insertBefore(row, f.children[1] || null); }
      clSig = sig;
      var adm = cs.filter(function (c) { return c.isAdmin; });
      row.style.display = adm.length ? "" : "none";
      row.className = "";
      row.innerHTML = "<details id=\"lbTclD\" style=\"width:100%;margin:6px 0\"><summary id=\"lbTclS\" style=\"cursor:pointer;padding:10px;border-radius:12px;background:#161a3a;border:1px solid #262b5a\">🛡 Klub turniri: yo‘q</summary><div style=\"padding:6px 4px\"><div class=\"muted\" style=\"margin-bottom:6px\">Qatnashadigan klublarni belgilang (6 tagacha). Kamida bittasida admin bo‘lishingiz kerak (⭐).</div>" +
        cs.slice().sort(function (p, q) { return (q.isAdmin ? 1 : 0) - (p.isAdmin ? 1 : 0); }).map(function (c) {
          return "<label style=\"display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.07)\"><input type=\"checkbox\" data-cl=\"1\" value=\"" + esc(c.id) + "\" style=\"width:22px;height:22px\"><span style=\"flex:1\">" + esc(c.name) + "</span>" + (c.isAdmin ? "<span>⭐</span>" : "") + "</label>";
        }).join("") + "</div></details>";
      var upd = function () { var ids = window.lbClubIds(), sm = $("lbTclS"); if (sm) sm.textContent = ids.length ? "🛡 Klub turniri: " + ids.length + " ta klub" : "🛡 Klub turniri: yo‘q"; };
      [].forEach.call(row.querySelectorAll("input[data-cl]"), function (x) {
        if (keepIds.indexOf(x.value) >= 0) x.checked = true;
        x.onchange = function () { if (row.querySelectorAll("input[data-cl]:checked").length > 6) x.checked = false; upd(); };
      });
      upd();
    }, 1000);
    
(function () {
      var tg = window.Telegram && Telegram.WebApp;
      var sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || "";
      var sent = false, hid = false;
      if (!document.getElementById("promoCss")) {
        var st = document.createElement("style"); st.id = "promoCss";
        st.textContent = "@keyframes pmS{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes pmG{0%,100%{box-shadow:0 0 8px #ffb300}50%{box-shadow:0 0 22px #ff5e00}}" +
          "#promoBar{position:fixed;left:8px;right:8px;bottom:74px;z-index:9998;padding:10px 38px 10px 12px;border-radius:14px;color:#2a1600;font-weight:700;font-size:14px;line-height:1.25;cursor:pointer;" +
          "background:linear-gradient(110deg,#ffb300 20%,#fff4b0 40%,#ffb300 60%,#ff7a00 80%);background-size:300% 100%;animation:pmS 3s linear infinite,pmG 1.6s ease-in-out infinite}" +
          "#promoBar small{display:block;font-weight:600;opacity:.8}#promoX{position:absolute;right:10px;top:8px;font-size:16px}";
        document.head.appendChild(st);
      }
      setInterval(function () {
        try {
          if (!sent && /^ref_/.test(sp) && S.me && !localStorage.getItem("refSent")) {
            sent = true; localStorage.setItem("refSent", "1"); sendMsg({ type: "lbRef", ref: sp });
          }
        } catch (e) {}
        var p = S.promo, el = document.getElementById("promoBar");
        if (!p || !p.on || hid || !S.me) { if (el) el.remove(); return; }
        var left = Math.max(0, p.end - Date.now()), d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), m = Math.floor(left % 3600000 / 60000);
        var html = "🔥 Shoshiling! Do‘stingni taklif qil — +200 🪙<small>Aksiya tugashiga: " + d + " kun " + h + " soat " + m + " daq · bosib ulashing</small><span id=\"promoX\">✕</span>";
        if (!el) {
          el = document.createElement("div"); el.id = "promoBar"; document.body.appendChild(el);
          el.onclick = function (e) {
            if (e.target.id === "promoX") { hid = true; el.remove(); return; }
            var link = (window.TG_APP_LINK || "https://t.me/DraughtsPRObot/play") + "?startapp=ref_" + S.me.uid;
            var u = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("Shashka PRO — kel, 500 🪙 sovg‘a!");
            if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank");
          };
        }
        if (el.dataset.t !== html) { el.dataset.t = html; el.innerHTML = html; }
      }, 1000);
    })();
    
(function () {
      var tg = window.Telegram && Telegram.WebApp;
      if (!document.getElementById("topCss")) {
        var st = document.createElement("style"); st.id = "topCss";
        st.textContent = "#promoBar{display:none!important}#lbTop{display:flex;gap:10px;align-items:stretch;margin:6px 0 10px}" +
          "#lbTop .lbc{flex:1 1 0;min-width:0;margin:0!important;padding:12px!important}#lbTop .lbc b{font-size:15px}#lbTop .lbc small{font-size:11px;display:block;margin-top:4px}" +
          "#lbPromoC{flex:1 1 0;min-width:0;border-radius:18px;padding:12px;color:#2a1600;font-weight:700;font-size:13px;line-height:1.25;cursor:pointer;" +
          "background:linear-gradient(110deg,#ffb300 20%,#fff4b0 40%,#ffb300 60%,#ff7a00 80%);background-size:300% 100%;animation:pmS 3s linear infinite,pmG 1.6s ease-in-out infinite}" +
          "#lbPromoC small{display:block;font-weight:600;opacity:.85;margin-top:4px;font-size:11px}" +
          "@keyframes pmS{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes pmG{0%,100%{box-shadow:0 0 8px #ffb300}50%{box-shadow:0 0 22px #ff5e00}}";
        document.head.appendChild(st);
      }
      setInterval(function () {
        var sb = document.getElementById("lbSnd");
        if (sb && sb.parentElement && sb.parentElement.parentElement) sb.parentElement.parentElement.style.display = "none";
        var f = document.querySelector(".lbc1"); if (!f) return;
        var top = document.getElementById("lbTop");
        if (!top) { top = document.createElement("div"); top.id = "lbTop"; f.parentNode.insertBefore(top, f); top.appendChild(f); }
        var sm = f.querySelector("small"); if (sm && sm.textContent !== "Havola yuboring") sm.textContent = "Havola yuboring";
        var p = S.promo, el = document.getElementById("lbPromoC");
        if (!p || !p.on || !S.me) { if (el) el.remove(); return; }
        var left = Math.max(0, p.end - Date.now()), d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), m = Math.floor(left % 3600000 / 60000);
        var html = "🔥 Shoshiling!<br>Do‘stingni taklif qil: +200 🪙<small>" + d + " kun " + h + " soat " + m + " daq qoldi</small>";
        if (!el) {
          el = document.createElement("div"); el.id = "lbPromoC"; top.appendChild(el);
          el.onclick = function () {
            var link = (window.TG_APP_LINK || "https://t.me/DraughtsPRObot/play") + "?startapp=ref_" + S.me.uid;
            var u = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("Shashka PRO — kel, 500 🪙 sovg‘a!");
            if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank");
          };
        }
        if (el.dataset.t !== html) { el.dataset.t = html; el.innerHTML = html; }
      }, 1000);
    })();
    
;(function () {
      var tgw = window.Telegram && window.Telegram.WebApp;
      var hero = null, daily = null, dailyT = 0, recent = null, recentT = 0, recSig = "";
      if (!document.getElementById("hzCss")) {
        var st = document.createElement("style"); st.id = "hzCss";
        st.textContent = [
          "#lbPanel .lbcards{display:none!important}",
          "@keyframes hzSh{0%{left:-60%}60%,100%{left:140%}}",
          "@keyframes hzS{0%{background-position:200% 0}100%{background-position:-200% 0}}",
          "@keyframes hzG{0%,100%{box-shadow:0 0 8px #ffb300}50%{box-shadow:0 0 22px #ff5e00}}",
          ".hz{margin:4px 0 12px;color:#fff;text-align:left}",
          ".hzHead{display:flex;align-items:center;gap:12px;padding:6px 2px 10px}",
          ".hzLogo{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:25px;flex:none;background:radial-gradient(circle at 35% 30%,#5b3fd0,#1d1350);box-shadow:0 0 0 2px #9a7bff,0 0 18px rgba(154,123,255,.7)}",
          ".hzHt{flex:1;min-width:0}.hzHt b{display:block;font-size:19px;letter-spacing:.2px}.hzHt span{font-size:12px;color:#a9b8ff}",
          ".hzOn{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:20px;border:1.5px solid #19c8a0;background:rgba(25,200,160,.14);font-weight:700;font-size:14px;flex:none}",
          ".hzOn i{width:10px;height:10px;border-radius:50%;background:#2dff72;box-shadow:0 0 8px #2dff72}",
          ".hzTitle{display:flex;align-items:center;gap:10px;margin:2px 0 12px}",
          ".hzPad{font-size:34px;flex:none}.hzTitle h1{margin:0;font-size:28px;font-weight:900;letter-spacing:.5px;line-height:1.05}",
          ".hzTitle p{margin:3px 0 0;font-size:13px;opacity:.82;line-height:1.25}",
          ".hzGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
          ".hzC{position:relative;overflow:hidden;border-radius:22px;padding:14px;min-height:158px;display:flex;flex-direction:column;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.32),0 8px 22px rgba(0,0,0,.4);-webkit-tap-highlight-color:transparent;transition:transform .12s}",
          ".hzC:active,.hzW:active{transform:scale(.97)}",
          ".hzC::after,.hzW::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.26),transparent);transform:skewX(-20deg);animation:hzSh 4.2s infinite;pointer-events:none}",
          ".hzIc{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none;background:rgba(255,255,255,.2);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6),0 0 14px rgba(255,255,255,.28)}",
          ".hzC b{display:block;font-size:17px;margin-top:10px;line-height:1.15}",
          ".hzC small{display:block;font-size:12px;opacity:.92;margin-top:4px;line-height:1.3}",
          ".hzFoot{margin-top:auto;padding-top:10px;display:flex;align-items:center;justify-content:space-between;gap:6px}",
          ".hzGo{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.95);color:#5a2fd0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;flex:none;margin-left:auto}",
          ".hzPl{padding:9px 16px;border-radius:20px;border:2px solid rgba(255,255,255,.9);background:rgba(255,255,255,.14);font-weight:800;font-size:14px;margin-left:auto}",
          ".hzChip{padding:6px 10px;border-radius:14px;background:rgba(0,0,0,.22);font-weight:700;font-size:12px;white-space:nowrap}",
          ".hzC1{background:linear-gradient(145deg,#ff5d8f 0%,#c13cff 58%,#7a3dff 100%)}",
          ".hzC2{background:linear-gradient(145deg,#2c7bff 0%,#1fa6ff 60%,#1ad0ff 100%)}",
          ".hzC3{background:linear-gradient(145deg,#ff9a1f 0%,#ff6a1f 55%,#ff3d4f 100%)}",
          ".hzC4{background:linear-gradient(145deg,#18d27a 0%,#0fb58a 60%,#0e8fa0 100%)}",
          ".hzW{position:relative;overflow:hidden;margin-top:12px;border-radius:22px;padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;background:linear-gradient(100deg,#8a3dff,#5a35e0 60%,#6f3cf0);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.32),0 8px 22px rgba(0,0,0,.4);transition:transform .12s}",
          ".hzW .hzIc{width:46px;height:46px;font-size:23px}.hzW b{display:block;font-size:17px;white-space:nowrap}.hzW small{display:block;font-size:12px;opacity:.92;margin-top:3px;line-height:1.3}",
          ".hzBtn{margin-left:auto;flex:none;padding:9px 12px;border-radius:20px;border:2px solid rgba(255,255,255,.88);background:rgba(255,255,255,.14);font-weight:800;font-size:13px;white-space:nowrap}",
          ".hzPromo{margin-top:12px;border-radius:18px;padding:12px 14px;color:#2a1600;font-weight:800;font-size:14px;line-height:1.25;cursor:pointer;background:linear-gradient(110deg,#ffb300 20%,#fff4b0 40%,#ffb300 60%,#ff7a00 80%);background-size:300% 100%;animation:hzS 3s linear infinite,hzG 1.6s ease-in-out infinite}",
          ".hzPromo small{display:block;font-weight:700;opacity:.8;font-size:12px;margin-top:3px}",
          ".hzDaily{margin-top:12px;border-radius:18px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;background:linear-gradient(110deg,#2a1b6e,#4b2aa8 50%,#2a1b6e);box-shadow:inset 0 0 0 1.5px #f5c542,0 0 18px rgba(245,197,66,.35)}",
          ".hzDi{font-size:30px;flex:none}.hzDaily small{display:block;color:#f5c542;font-weight:700;font-size:12px}.hzDaily b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
          ".hzN{flex:none;padding:7px 12px;border-radius:14px;background:rgba(245,197,66,.18);color:#ffd96b;font-weight:800;font-size:14px}",
          ".hzCnt{display:flex;gap:12px;margin-top:12px}",
          ".hzCn{position:relative;flex:1;min-width:0;border-radius:18px;padding:12px 8px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;cursor:pointer;background:rgba(255,255,255,.06);white-space:nowrap}",
          ".hzDot{position:absolute;top:8px;right:10px;width:11px;height:11px;border-radius:50%;background:#ff3b4e;box-shadow:0 0 8px #ff3b4e}",
          ".hzCn b{font-size:21px}",
          "#hzCp{box-shadow:inset 0 0 0 1.5px #1fcf8a;color:#9dffd0}#hzCf{box-shadow:inset 0 0 0 1.5px #4d8dff;color:#b6d0ff}",
          ".hzRec{margin-top:12px;border-radius:20px;padding:12px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1.5px rgba(139,124,255,.55)}",
          ".hzRh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.hzRh b{font-size:16px}.hzRh span{font-size:13px;color:#9fb0ff;cursor:pointer}",
          ".hzRl{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}",
          ".hzG{flex:1 0 82px;min-width:82px;border-radius:14px;padding:9px 6px;background:rgba(255,255,255,.07);text-align:center;cursor:pointer}",
          ".hzV{display:flex;align-items:center;justify-content:center;gap:5px;height:34px}",
          ".hzV img,.hzV .hzO,.hzV .hzMe{width:28px;height:28px;border-radius:50%;object-fit:cover;display:flex;align-items:center;justify-content:center;background:#3b34a8;font-size:15px;font-weight:700}",
          ".hzV small{opacity:.6;font-size:11px}",
          ".hzG em{display:block;font-style:normal;font-size:12px;font-weight:700;border-radius:10px;padding:3px 0;margin:7px 4px 4px}",
          ".hzG em.w{background:rgba(32,200,110,.22);color:#7dffb0}.hzG em.l{background:rgba(255,80,90,.22);color:#ff9aa2}.hzG em.d{background:rgba(160,170,210,.22);color:#cfd6f5}",
          ".hzG small{display:block;font-size:10px;opacity:.65;white-space:nowrap}",
          "@media (prefers-reduced-motion:reduce){.hzC::after,.hzW::after,.hzPromo{animation:none!important}}"
        ].join("");
        document.head.appendChild(st);
      }
      var HTML =
        "<div class=\"hzHead\"><div class=\"hzLogo\">👑</div><div class=\"hzHt\"><b>ShashkaPROBot</b><span>O‘yin • Do‘stlar • G‘alaba</span></div><div class=\"hzOn\"><i></i>Online</div></div>" +
        "<div class=\"hzTitle\"><span class=\"hzPad\">🎮</span><div><h1>O‘YIN ZALI</h1><p>O‘yiningizga mos o‘yinni tanlang va boshlang!</p></div></div>" +
        "<div class=\"hzGrid\">" +
        "<div class=\"hzC hzC1\" id=\"hzFr\"><div class=\"hzIc\">🤝</div><b>Do‘st bilan o‘ynash</b><small>Havola yuboring — do‘stingiz bossa, o‘yin boshlanadi</small><div class=\"hzFoot\"><span class=\"hzGo\">➜</span></div></div>" +
        "<div class=\"hzC hzC2\" id=\"hzRnd\"><div class=\"hzIc\">🔀</div><b>Tasodifiy raqib</b><small>Tasodifiy o‘yinchi bilan o‘ynang</small><div class=\"hzFoot\"><span class=\"hzPl\" id=\"hzRndB\">▶ O‘ynash</span></div></div>" +
        "<div class=\"hzC hzC3\" id=\"hzQk\"><div class=\"hzIc\">⚡</div><b>Tezkor o‘yin</b><small>Vaqtingiz kammi? Tez o‘yin tanlang!</small><div class=\"hzFoot\"><span class=\"hzChip\" id=\"hzQkC\">⏱ Tez</span><span class=\"hzGo\">➜</span></div></div>" +
        "<div class=\"hzC hzC4\" id=\"hzAi\"><div class=\"hzIc\">🤖</div><b>Kompyuterga qarshi</b><small>Sun‘iy intellekt bilan mahoratingizni sinang!</small><div class=\"hzFoot\"><span class=\"hzChip\">🎯 Mashq</span><span class=\"hzGo\">➜</span></div></div>" +
        "</div>" +
        "<div class=\"hzW\" id=\"hzMkR\"><div class=\"hzIc\">🏠</div><div style=\"min-width:0\"><b>Xona yaratish</b><small>Vaqt va pozitsiyani tanlang, do‘stlarni taklif qiling.</small></div><span class=\"hzBtn\">＋ Yaratish</span></div>" +
        "<div class=\"hzPromo\" id=\"hzPromo\" style=\"display:none\"></div>" +
        "<div class=\"hzDaily\" id=\"hzDaily\" style=\"display:none\"></div>" +
        "<div class=\"hzCnt\"><div class=\"hzCn\" id=\"hzCp\"></div><div class=\"hzCn\" id=\"hzCf\"></div></div>" +
        "<div class=\"hzRec\" id=\"hzRec\" style=\"display:none\"></div>";
      function ago(ts) {
        var m = Math.max(0, Math.floor((Date.now() - ts) / 60000));
        if (m < 1) return "hozir";
        if (m < 60) return m + " daqiqa oldin";
        var h = Math.floor(m / 60);
        if (h < 24) return h + " soat oldin";
        return Math.floor(h / 24) + " kun oldin";
      }
      function shortTc() {
        var sel = document.getElementById("lbTc"); if (!sel) return null;
        var best = null, bv = 1e9, i, v;
        for (i = 0; i < sel.options.length; i++) {
          v = parseFloat(sel.options[i].value);
          if (isFinite(v) && v > 0 && v < bv) { bv = v; best = sel.options[i].value; }
        }
        return best;
      }
      function addMk(e) {
        if (document.getElementById("hzMk")) return;
        var d = document.createElement("div"); d.className = "row";
        d.innerHTML = "<button id=\"hzMk\" style=\"flex:1\">🔗 Havola yaratish va ulashish</button>";
        e.appendChild(d);
        document.getElementById("hzMk").onclick = function () { window.lbFriend(); };
      }
      function openSet() {
        var e = $("lbSet"); if (!e) return;
        var show = e.style.display === "none";
        e.style.display = show ? "block" : "none";
        if (show) { addMk(e); try { e.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (x) {} }
      }
      function quickShort() {
        var sel = $("lbTc"), q = $("lbQuick"), t = shortTc();
        if (!sel || !q) return;
        if (S.inQueue) { q.click(); return; }
        if (!t) { openSet(); return; }
        var old = sel.value; sel.value = t; q.click(); sel.value = old;
      }
      function goList(f) {
        curTab = "pl"; window.__lbF = f; renderAll();
        var l = $("lbPl"); try { l.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (x) {}
      }
      function sharePromo() {
        if (!S.me) return;
        var link = (window.TG_APP_LINK || "https://t.me/DraughtsPRObot/play") + "?startapp=ref_" + S.me.uid;
        var u = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("Shashka PRO — kel, 500 🪙 sovg‘a!");
        if (tgw && tgw.openTelegramLink) tgw.openTelegramLink(u); else window.open(u, "_blank");
      }
      function loadDaily() {
        if (Date.now() - dailyT < 60000) return; dailyT = Date.now();
        fetch("/api/puzzles/day", { headers: { "x-init-data": initData } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { daily = d && d.top && d.top[0] ? d.top[0] : null; })
          .catch(function () {});
      }
      function loadRecent() {
        if (Date.now() - recentT < 90000) return; recentT = Date.now();
        fetch("/api/archive", { headers: { "x-init-data": initData } })
          .then(function (r) { return r.json(); })
          .then(function (d) { recent = ((d && d.list) || []).slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 4); })
          .catch(function () {});
      }
      function openGame(g) {
        if (!window.spAnalyze) return;
        window.spBoardOpen({
          white: g.w, black: g.b, winner: g.win,
          moves: (g.m || []).map(function (x) { return { from: { r: x[0], c: x[1] }, to: { r: x[2], c: x[3] }, captures: (x[4] || []).map(function (y) { return { r: y[0], c: y[1] }; }) }; })
        });
      }
      function renderRecent() {
        var box = document.getElementById("hzRec"); if (!box) return;
        box.style.display = "none"; return;
        var nm = (S.me && S.me.name) || (typeof myName === "string" ? myName : "");
        var sig = recent.map(function (g) { return g.at; }).join(",") + "|" + nm + "|" + Math.floor(Date.now() / 60000);
        box.style.display = "block";
        if (sig === recSig) return;
        recSig = sig;
        var meAv = S.me && S.me.uid ? "<img src=\"/api/av/" + encodeURIComponent(S.me.uid) + "\" onerror=\"this.outerHTML='<span class=hzMe>👤</span>'\">" : "<span class=\"hzMe\">👤</span>";
        var h = "<div class=\"hzRh\"><b>🕒 Oxirgi o‘yinlar</b><span data-hz=\"all\">Barchasi ›</span></div><div class=\"hzRl\">";
        recent.forEach(function (g, i) {
          var mc = g.w === nm ? "white" : (g.b === nm ? "black" : null);
          var opp = mc === "black" ? g.w : g.b, lab, cls;
          if (g.win === "white" || g.win === "black") {
            if (mc) { var won = g.win === mc; lab = won ? "G‘alaba" : "Mag‘lubiyat"; cls = won ? "w" : "l"; }
            else { lab = g.win === "white" ? "⚪ yutdi" : "⚫ yutdi"; cls = "d"; }
          } else { lab = "Durang"; cls = "d"; }
          h += "<div class=\"hzG\" data-hz=\"g" + i + "\"><div class=\"hzV\">" + meAv + "<small>vs</small><span class=\"hzO\">" + esc(String(opp || "?").charAt(0).toUpperCase()) + "</span></div><em class=\"" + cls + "\">" + lab + "</em><small>" + ago(g.at) + "</small></div>";
        });
        box.innerHTML = h + "</div>";
      }
      function build() {
        var anchor = panel && panel.querySelector(".lbcards"); if (!anchor) return;
        hero = document.createElement("div"); hero.id = "hzHero"; hero.className = "hz";
        hero.innerHTML = HTML;
        anchor.parentNode.insertBefore(hero, anchor);
        $("hzFr").onclick = function () { window.lbFriend(); };
        $("hzRnd").onclick = function () { var q = $("lbQuick"); if (q) q.click(); };
        $("hzQk").onclick = quickShort;
        $("hzAi").onclick = function () {
          if (!window.aiShow) return;
          try { if (window.lbNav) window.lbNav.close(); } catch (x) {}
          window.aiShow("play");
        };
        $("hzMkR").onclick = openSet;
        $("hzPromo").onclick = sharePromo;
        $("hzDaily").onclick = function () { if (window.mnA) window.mnA("@puz"); };
        $("hzCp").onclick = function () { goList(false); };
        $("hzCf").onclick = function () { goList(true); };
        $("hzRec").onclick = function (e) {
          var t = e.target; while (t && t !== this && !(t.getAttribute && t.getAttribute("data-hz"))) t = t.parentNode;
          var k = t && t.getAttribute ? t.getAttribute("data-hz") : "";
          if (k === "all") { if (window.mnA) window.mnA("@arch"); }
          else if (/^g\d+$/.test(k || "") && recent && recent[Number(k.slice(1))]) openGame(recent[Number(k.slice(1))]);
        };
      }
      function setHtml(el, html) { if (el && el.dataset.t !== html) { el.dataset.t = html; el.innerHTML = html; } }
      function tick() {
        if (!panel) return;
        if (!hero) { build(); if (!hero) return; }
        var show = curTab === "pl", want = show ? "" : "none";
        if (hero.style.display !== want) hero.style.display = want;
        if (!show) return;
        var rb = $("hzRndB"), tx = S.inQueue ? "⏳ Bekor qilish" : "▶ O‘ynash";
        if (rb && rb.textContent !== tx) rb.textContent = tx;
        var qc = $("hzQkC"), t = shortTc(), qt = t ? "⏱ " + t : "⏱ Tez";
        if (qc && qc.textContent !== qt) qc.textContent = qt;
        var fl = S.friends || [], nf = fl.filter(function (f) { return f.online; }).length;
        setHtml($("hzCp"), "👥 <b>" + (S.players || []).length + "</b> o‘yinchi online" + ((S.incoming || []).length ? "<i class=\"hzDot\"></i>" : ""));
        setHtml($("hzCf"), "🤝 <b>" + nf + "</b> do‘st online" + ((S.freqIn || []).length ? "<i class=\"hzDot\"></i>" : ""));
        var p = S.promo, pe = $("hzPromo");
        if (!p || !p.on || !S.me) pe.style.display = "none";
        else {
          var left = Math.max(0, p.end - Date.now()), d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), m = Math.floor(left % 3600000 / 60000);
          pe.style.display = "block";
          setHtml(pe, "🔥 Shoshiling! Do‘stingni taklif qil: +200 🪙<small>" + d + " kun " + h + " soat " + m + " daq qoldi · bosib ulashing</small>");
        }
        var de = $("hzDaily");
        if (!daily) de.style.display = "none";
        else {
          de.style.display = "flex";
          setHtml(de, "<div class=\"hzDi\">🧩</div><div style=\"flex:1;min-width:0\"><small>Kunning masala ustasi</small><b>👑 " + esc(daily.name) + "</b></div><span class=\"hzN\">✅ " + esc(daily.n) + " ta</span>");
        }
        if (panelOpen) { loadDaily(); loadRecent(); }
        renderRecent();
      }
      setInterval(tick, 1000);
    })();
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
      if (!document.getElementById("lbArena")) { var _as = document.createElement("style"); _as.id = "lbArena"; _as.textContent = "" +
"#lbHero{margin:0 0 12px}" +
".lbhb{position:relative;overflow:hidden;border-radius:20px;padding:16px;background:radial-gradient(circle at 85% 20%,rgba(245,183,43,.28),transparent 55%),linear-gradient(135deg,#2a1d52,#1a1440 60%,#3a2a08);border:1px solid #f5b72b;box-shadow:0 0 22px rgba(245,183,43,.35)}" +
".lbhb .tg{display:inline-block;font-size:11px;font-weight:800;padding:3px 9px;border-radius:9px;background:#ff8a1f;color:#fff}" +
".lbhb h3{margin:8px 0 2px;font-size:22px;font-weight:900;color:#fff}" +
".lbhb p{margin:0 0 8px;font-size:13px;opacity:.8}" +
".lbhb .tm{font-size:13px;opacity:.9;margin-bottom:10px}.lbhb .tm b{font-size:16px}" +
".lbhb button{border:0;border-radius:14px;padding:11px 18px;font-weight:800;font-size:15px;color:#2a1d00;background:linear-gradient(180deg,#ffd45a,#f5a623)}" +
"#lbTbar .tabs button{border:1px solid #2a3470;border-radius:14px;background:#10143a}" +
"#lbTbar .tabs button.on{border-color:#2fc8ff;box-shadow:0 0 10px rgba(47,200,255,.5)}" +
"#lbTs .card{border-radius:18px;border:1px solid #3d5bd9;background:linear-gradient(180deg,#1b2350,#10143a);box-shadow:0 0 14px rgba(61,91,217,.35)}" +
"#lbTs .card.lbta{border-color:#2fd37a;background:linear-gradient(180deg,#0f3a2c,#0c1a22);box-shadow:0 0 14px rgba(47,211,122,.35)}" +
"#lbTs .card.lbts{border-color:#7a5cf0;background:linear-gradient(180deg,#2a1f6e,#14123a);box-shadow:0 0 14px rgba(122,92,240,.4)}" +
".lbcl{border-radius:20px!important;border:1px solid #2a3470!important;background:linear-gradient(180deg,#141a44,#0e1233)!important;box-shadow:0 0 14px rgba(61,91,217,.25)}" +
".lbcr{border-radius:16px!important;border:1px solid #2a3470!important}" +
".lbmy{margin:10px 0}.lbmy .r{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 2px;border-top:1px solid rgba(255,255,255,.08);cursor:pointer}.lbmy .r:first-of-type{border-top:0}" +
".lbdr{display:flex;align-items:center;gap:10px;margin:10px 0;padding:12px;border-radius:18px;background:#10143a;border:1px solid #3d5bd9;box-shadow:0 0 14px rgba(61,91,217,.3)}";
document.head.appendChild(_as); }
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
      if (!document.getElementById("lbArena2")) { var _s2 = document.createElement("style"); _s2.id = "lbArena2"; _s2.textContent = "" +
".lbhb::before,.lbhb::after,.lbhb *::before,.lbhb *::after{content:none!important;display:none!important}" +
".lbhb *{box-shadow:none!important;filter:none!important;text-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;outline:0!important}" +
".lbhb h3,.lbhb p,.lbhb .tm,.lbhb b{background:none!important;border:0!important;margin-left:0}" +
".lbhb .tg{background:#ff8a1f!important;color:#fff!important}" +
".lbhb button{background:linear-gradient(180deg,#ffd45a,#f5a623)!important;color:#2a1d00!important;border:0!important;width:auto!important}"; document.head.appendChild(_s2); }
      if (!document.getElementById("lbRayCss")) { var _s3 = document.createElement("style"); _s3.id = "lbRayCss"; _s3.textContent = "" +
"@keyframes lbSw{0%{left:-50%}55%,100%{left:135%}}" +
"@keyframes lbGlG{0%,100%{box-shadow:0 0 14px rgba(245,183,43,.35)}50%{box-shadow:0 0 30px rgba(245,183,43,.8)}}" +
"@keyframes lbGlB{0%,100%{box-shadow:0 0 14px rgba(47,200,255,.35)}50%{box-shadow:0 0 30px rgba(47,200,255,.8)}}" +
".lbray{position:absolute;top:-30%;bottom:-30%;left:-50%;width:30%;pointer-events:none;z-index:2;transform:skewX(-22deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);animation:lbSw 3.2s ease-in-out infinite}" +
".lbray.b{width:12%;background:linear-gradient(90deg,transparent,rgba(255,214,102,.6),transparent);animation-delay:.45s}" +
".lbhb{animation:lbGlG 2.6s ease-in-out infinite}" +
".lbhb.lbcb{animation-name:lbGlB;background:radial-gradient(circle at 85% 20%,rgba(47,200,255,.28),transparent 55%),linear-gradient(135deg,#10285a,#14123a 60%,#0b3a4a);border-color:#2fc8ff}" +
".lbhb.lbcb .tg{background:#1f8fff!important}" +
".lbhb.lbcb button{background:linear-gradient(180deg,#5ad0ff,#2f7bff)!important;color:#fff!important}"; document.head.appendChild(_s3); }
      window.lbRays = function () {
        [].forEach.call(document.querySelectorAll(".lbhb,#lbHero div[onclick]"), function (e) {
          if (e.getAttribute("data-ray")) return;
          e.setAttribute("data-ray", "1");
          if (getComputedStyle(e).position === "static") e.style.position = "relative";
          e.style.overflow = "hidden";
          e.insertAdjacentHTML("beforeend", "<i class='lbray'></i><i class='lbray b'></i>");
        });
      };
      window.lbClubFix = function () {
        var card = null, all = document.querySelectorAll(".lbcl");
        for (var i = 0; i < all.length; i++) if (all[i].textContent.indexOf("Klublarga") >= 0) { card = all[i]; break; }
        var bn = document.getElementById("lbClubBn");
        if (!card) { if (bn) bn.remove(); return; }
        card.style.display = window.__lbCO ? "" : "none";
        if (bn && bn.nextSibling !== card) { bn.remove(); bn = null; }
        if (!bn) {
          bn = document.createElement("div"); bn.id = "lbClubBn"; bn.className = "lbhb lbcb";
          bn.style.cssText = "cursor:pointer;margin:0 0 12px";
          bn.onclick = function () { window.__lbCO = !window.__lbCO; window.lbClubFix(); };
          card.parentNode.insertBefore(bn, card);
        }
        var st = window.__lbCO ? "1" : "0";
        if (bn.getAttribute("data-st") !== st) {
          bn.setAttribute("data-st", st); bn.removeAttribute("data-ray");
          bn.innerHTML = "<span class='tg'>KLUBLAR</span><h3>👥 Klublar</h3><p>Klub safida o‘ynang va turnirlarda birga qatnashing.</p><button type='button'>" + (window.__lbCO ? "Yopish ‹" : "Klublarni ko‘rish ›") + "</button>";
        }
        var par = card.parentNode;
        if (window.__lbOE !== par) {
          if (window.__lbOb) window.__lbOb.disconnect();
          window.__lbOE = par;
          window.__lbOb = new MutationObserver(function () {
            if (window.__lbBz) return; window.__lbBz = 1;
            try { window.lbClubFix(); } finally { setTimeout(function () { window.__lbBz = 0; }, 0); }
          });
          window.__lbOb.observe(par, { childList: true });
        }
        window.lbRays();
      };
      
      var _hb = $("lbHero");
      if (!_hb && $("lbTbar")) { _hb = document.createElement("div"); _hb.id = "lbHero"; $("lbTbar").parentNode.insertBefore(_hb, $("lbTbar")); }
      if (_hb) {
        var _a = (S.tournaments || []).filter(function (t) { return t.status === "running"; })[0] || (S.tournaments || []).filter(function (t) { return t.status === "reg"; })[0];
        if (tFil === "fin") _hb.innerHTML = "";
        else if (!_a) {
          var _qc = function (bg, bd, ic, t1, t2) { return "<div onclick=\"lbTPlus()\" style=\"flex:1;cursor:pointer;border-radius:18px;padding:14px 12px;background:" + bg + ";border:1px solid " + bd + ";box-shadow:0 0 14px " + bd + "66\"><div style=\"font-size:26px\">" + ic + "</div><b style=\"display:block;margin-top:6px\">" + t1 + "</b><div class=\"muted\" style=\"font-size:12px;margin-top:2px\">" + t2 + "</div></div>"; };
          _hb.innerHTML = "<div class='lbhb'><span class='tg'>TURNIRLAR</span><h3>🏆 Birinchi turnirni oching!</h3><p>Do‘stlaringizni yig‘ing va eng kuchli o‘yinchi bo‘ling.</p><button onclick=\"lbTPlus()\">Turnir ochish ›</button></div>" +
            "<div style='display:flex;gap:10px;margin-top:12px'>" + _qc("linear-gradient(180deg,#0f3a2c,#0c1a22)", "#2fd37a", "⚔️", "Arena turnir", "Vaqt bo‘yicha, ochko yig‘ing") + _qc("linear-gradient(180deg,#2a1f6e,#14123a)", "#7a5cf0", "🏆", "Shveytsar turnir", "Turlar bo‘yicha o‘ynaladi") + "</div>";
        }
        
        else {
          var _ms = _a.status === "reg" ? (_a.startAt ? _a.startAt - Date.now() : 0) : (_a.endAt ? _a.endAt - Date.now() : 0), _lt = "";
          if (_ms > 0) { var _m = Math.floor(_ms / 60000), _d = Math.floor(_m / 1440), _h = Math.floor(_m % 1440 / 60); _m = _m % 60; _lt = "<div class='tm'>🕒 " + (_a.status === "reg" ? "Boshlanishiga" : "Qolgan vaqt") + ": <b>" + (_d ? _d + " kun " : "") + (_h || _d ? _h + " soat " : "") + _m + " daqiqa</b></div>"; }
          var _jn = _a.players.some(function (p) { return p.uid === me; });
          _hb.innerHTML = "<div class='lbhb'><span class='tg'>" + (_a.status === "running" ? "AKTIV TURNIR 🔥" : "RO‘YXAT OCHIQ") + "</span><h3>" + esc(_a.name) + "</h3><p>" + esc(_a.tc) + (_a.pos === "idf" ? " · IDF 780" : "") + " · " + _a.players.length + " o‘yinchi</p>" + _lt +
            "<button onclick=\"var e=document.getElementById('lbtc_" + esc(_a.id) + "');if(e)e.scrollIntoView({behavior:'smooth',block:'center'})\">" + (_jn ? "Ko‘rish ›" : "Qo‘shilish ›") + "</button></div>";
        }
      }
      window.lbClubFix(); window.lbRays();
      var _tsb = $("lbTs");
      if (_tsb) {
        var _dr = $("lbDream");
        if (!_dr) { _dr = document.createElement("div"); _dr.id = "lbDream"; _tsb.parentNode.insertBefore(_dr, _tsb.nextSibling); }
        var _my = (S.tournaments || []).filter(function (t) { return t.players.some(function (p) { return p.uid === me; }); }).slice(0, 4), _mh = "";
        if (_my.length) {
          _mh = "<div class='lbcl lbmy'><b>👤 Mening turnirlarim</b>" + _my.map(function (t) {
            var k = 0; t.players.forEach(function (p, i) { if (p.uid === me) k = i + 1; });
            var tx = t.status === "finished" ? "Tugatildi" : (t.status === "running" ? "Davom etmoqda" : "Ro‘yxat ochiq");
            return "<div class='r' onclick=\"var e=document.getElementById('lbtc_" + esc(t.id) + "');if(e)e.scrollIntoView({behavior:'smooth',block:'center'})\"><span>" + (t.type === "arena" ? "⚔️" : "🏆") + " " + esc(t.name) + " <small class='muted'>" + tx + "</small></span><b>" + k + "-o‘rin</b></div>";
          }).join("") + "</div>";
        }
        _dr.innerHTML = _mh + "<div class='lbdr'><span style='font-size:28px'>🎯</span><div><b>Orzular sari! 💪</b><div class='muted'>Turnirda g‘alaba qozon va eng kuchli o‘yinchi bo‘l!</div></div></div>";
      }
      if (!ts.length) { $("lbTs").innerHTML = tFil === "fin" ? "<div class=\"card muted\">Tugagan turnirlar hali yo‘q.</div>" : ""; return; }
      var h = "";
      ts.forEach(function (t) {
        var joined = t.players.some(function (p) { return p.uid === me; });
        var arena = t.type === "arena";
        var mins = function (ms) { return Math.max(0, Math.ceil(ms / 60000)) + " daq"; };
        var st = arena
          ? (t.status === "reg" ? "Boshlanishi: " + mins(t.startAt - Date.now()) : (t.status === "running" ? (t.ending ? "Tugayapti…" : "Qoldi: " + mins(t.endAt - Date.now())) : "Tugagan"))
          : (t.status === "reg" ? "Ro‘yxat ochiq · " + (t.roundsWanted || "?") + " tur" + (t.startAt ? " · boshlanishi: " + mins(t.startAt - Date.now()) : "") : (t.status === "running" ? t.round + "/" + t.rounds + "-tur" : "Tugagan"));
        h += "<div class=\"card lbtk " + (arena ? "lbta" : "lbts") + "\" id=\"lbtc_" + esc(t.id) + "\"><div><b>" + (arena ? "⚔️" : "🏆") + " " + esc(t.name) + "</b></div><div class=\"muted\">" + esc(t.tc) + (t.pos === "idf" ? " · IDF 780" : "") + " · " + st + " · " + t.players.length + " o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";
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
        h += lbClubTbl(t); if (t.players.length > 12) h += "<div class=\"muted\">… va yana " + (t.players.length - 12) + " o‘yinchi</div>";
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

;(function () {
  var ws = null, list = [], sig = "", box = null, n = 0;
  var COL = { "1+1": "#c0605f", "2+2": "#6aaed4", "3+2": "#6aaed4", "5+3": "#88aa3c", "7+5": "#88aa3c" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  if (!document.getElementById("hzLvCss")) {
    var st = document.createElement("style"); st.id = "hzLvCss";
    st.textContent = ".hzLv{margin-top:12px;border-radius:20px;padding:12px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1.5px rgba(245,197,66,.55)}.hzLvH{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:16px;margin-bottom:10px}.hzLvH small{opacity:.7;font-weight:400}.hzLvG{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hzLvC{border-radius:10px;overflow:hidden;background:#dcdcdc;color:#333;text-align:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.3)}.hzLvC b{display:block;padding:6px 4px;color:#fff;font-size:14px}.hzLvC div{padding:5px 4px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hzLvC i{display:block;font-style:normal;font-size:11px;color:#777}.hzLvC u{display:block;text-decoration:none;font-size:11px;color:#555;padding:3px 0 7px}.hzLvE{text-align:center;opacity:.7;padding:10px;font-size:13px}";
    document.head.appendChild(st);
  }
  function render() {
    if (!box) return;
    var s = JSON.stringify(list); if (s === sig) return; sig = s;
    var h = "<div class=\"hzLvH\"><span>🎯 Jonli stollar</span><small>" + list.length + " ta o‘yin</small></div>";
    if (!list.length) h += "<div class=\"hzLvE\">Hozir o‘ynalayotgan o‘yin yo‘q</div>";
    else {
      h += "<div class=\"hzLvG\">";
      list.slice(0, 10).forEach(function (r) {
        var c = COL[r.tc] || "#6aaed4";
        h += "<div class=\"hzLvC\" data-r=\"" + esc(r.id) + "\"><b style=\"background:" + c + "\">Shashka " + esc(r.tc) + "</b><div>⚪ " + esc(r.white) + " (" + (r.wElo || 1000) + ")</div><i>vs</i><div>⚫ " + esc(r.black) + " (" + (r.bElo || 1000) + ")</div><u>👁 " + (r.spectators || 0) + " · " + Math.ceil((r.moves || 0) / 2) + " yurish</u></div>";
      });
      h += "</div>";
    }
    box.innerHTML = h;
  }
  function ask() { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "roomLive" })); } catch (e) {} }
  function connect() {
    if (ws) return;
    try { ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host); } catch (e) { ws = null; return; }
    ws.onopen = ask;
    ws.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (m && m.type === "roomLive") { list = m.list || []; render(); } };
    ws.onclose = function () { ws = null; };
  }
  function drop() { try { if (ws) ws.close(); } catch (e) {} ws = null; }
  setInterval(function () {
    var hero = document.getElementById("hzHero");
    if (!hero || hero.offsetParent === null) { drop(); return; }
    if (!box || !box.parentNode) {
      var rec = document.getElementById("hzRec"); if (!rec) return;
      box = document.createElement("div"); box.className = "hzLv"; box.id = "hzLive";
      rec.parentNode.insertBefore(box, rec);
      box.onclick = function (e) {
        var t = e.target; while (t && t !== box && !(t.getAttribute && t.getAttribute("data-r"))) t = t.parentNode;
        var id = t && t.getAttribute ? t.getAttribute("data-r") : "";
        if (id) location.href = location.pathname + "?room=" + encodeURIComponent(id);
      };
      sig = ""; render();
    }
    connect(); n++; if (n % 5 === 0) ask();
  }, 1000);
})();

;(function () {
  if (!document.getElementById("hzSeekCss")) {
    var st = document.createElement("style"); st.id = "hzSeekCss";
    st.textContent = "#hzFr,#hzRnd,#hzQk{display:none!important}#hzAi{grid-column:1/-1;flex:1 1 100%;width:100%;box-sizing:border-box;min-height:120px!important}#hzSeek{grid-column:1/-1;flex:1 1 100%;width:100%;box-sizing:border-box;display:block;margin:4px 0 12px;padding:16px 12px;border:0;border-radius:18px;font:700 20px/1.2 inherit;color:#fff;text-align:center;cursor:pointer;background:linear-gradient(100deg,#13b955,#0e9f6e);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35),0 6px 18px rgba(16,185,129,.45)}#hzSeek.on{background:linear-gradient(100deg,#f59e0b,#ef6c00);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35),0 6px 18px rgba(245,158,11,.45)}";
    document.head.appendChild(st);
  }
  setInterval(function () {
    var hero = document.getElementById("hzHero"); if (!hero) return;
    var b = document.getElementById("hzSeek");
    if (!b) {
      var first = hero.querySelector(".hzC"); if (!first) return;
      b = document.createElement("button"); b.id = "hzSeek"; b.type = "button";
      first.parentNode.insertBefore(b, first);
      b.onclick = function () { var r = document.getElementById("hzRnd"); if (r) r.click(); };
    }
    var rb = document.getElementById("hzRndB");
    var q = !!(rb && /Bekor/.test(rb.textContent));
    var tx = q ? "⏳ Qidirilmoqda… (bekor qilish)" : "🔍 Raqib qidirish";
    if (b.textContent !== tx) b.textContent = tx;
    b.className = q ? "on" : "";
  }, 500);
})();

;(function () {
  if (document.getElementById("hzHideCss")) return;
  var st = document.createElement("style"); st.id = "hzHideCss";
  st.textContent = ".hzHead{display:none!important}#hzAi{display:none!important}";
  document.head.appendChild(st);
})();

;(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  if (!document.getElementById("hzLayoutCss")) {
    var st = document.createElement("style"); st.id = "hzLayoutCss";
    st.textContent =
      ".hzTitle,#lbTick,.hzCnt{display:none!important}" +
      "#hzSeek{position:relative;padding:24px 60px;border-radius:30px;font-size:30px;border:2px solid #4dff7c;background:linear-gradient(180deg,#22c955,#0f8f3a);box-shadow:0 0 22px rgba(60,255,110,.55),inset 0 0 0 2px rgba(255,255,255,.18)}" +
      "#hzSeek::after{content:'➜';position:absolute;right:26px;top:50%;transform:translateY(-50%);font-size:30px}" +
      "#hzSeek.on{background:linear-gradient(180deg,#f59e0b,#ea6a00);border-color:#ffd27a;box-shadow:0 0 22px rgba(255,170,40,.55),inset 0 0 0 2px rgba(255,255,255,.18)}" +
      "#hzPromo[style*='block']{display:flex!important;align-items:center;gap:12px;padding:12px 14px}" +
      ".pgI{font-size:52px;flex:none;line-height:1}.pgB{flex:1;min-width:0}.pgT{font-weight:800;font-size:19px;line-height:1.25}" +
      ".pgP{display:inline-block;background:#e8590c;color:#fff;border-radius:14px;padding:3px 10px;font-size:16px;margin-left:6px;white-space:nowrap}" +
      ".pgS{font-size:14px;margin-top:4px;opacity:.85}.pgA{font-size:34px;flex:none;color:#fff}" +
      "#hzDaily::after{content:'›';font-size:30px;margin-left:8px;opacity:.9}" +
      "#hzHero::after{content:'👑';display:block;text-align:center;font-size:150px;opacity:.12;margin-top:60px;filter:blur(1px)}";
    document.head.appendChild(st);
  }
  setInterval(function () {
    var pe = document.getElementById("hzPromo");
    if (pe && pe.style.display !== "none") {
      var sm = pe.querySelector("small");
      if (sm && !pe.querySelector(".pgT")) {
        pe.innerHTML = "<div class=\"pgI\">🎁</div><div class=\"pgB\"><div class=\"pgT\">Do‘stingizni taklif qiling! <span class=\"pgP\">+200 🪙</span></div><div class=\"pgS\">" + esc(sm.textContent) + "</div></div><div class=\"pgA\">›</div>";
      }
    }
    var lv = document.getElementById("hzLive");
    if (lv) lv.style.display = lv.querySelector(".hzLvC") ? "" : "none";
  }, 500);
})();

;(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  var tg = null, user = null, init = "";
  try { tg = window.Telegram && Telegram.WebApp; user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user; init = (tg && tg.initData) || ""; } catch (e) {}
  if (!user || !user.id) return;
  var info = { name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "O‘yinchi", elo: null, gems: null }, bar = null, last = 0, sig = "";
  if (!document.getElementById("hzMeCss")) {
    var st = document.createElement("style"); st.id = "hzMeCss";
    st.textContent = "#hzHero{padding-bottom:90px}#hzMe{position:fixed;left:10px;right:10px;bottom:calc(64px + 8px);z-index:9600;display:none;align-items:center;gap:12px;padding:8px 12px;border-radius:20px;background:rgba(20,16,70,.96);box-shadow:inset 0 0 0 1.5px rgba(110,120,255,.6),0 6px 18px rgba(0,0,0,.45);color:#fff;cursor:pointer}#hzMe img,#hzMe .meA{width:54px;height:54px;border-radius:50%;object-fit:cover;flex:none;background:#2a1fc9;display:flex;align-items:center;justify-content:center;font-size:26px}#hzMe .meB{flex:1;min-width:0}#hzMe b{display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#hzMe small{display:flex;align-items:center;gap:8px;font-size:14px;opacity:.9;margin-top:3px}#hzMe .dot{width:10px;height:10px;border-radius:50%;background:#2dff72;box-shadow:0 0 8px #2dff72}#hzMe .meG{font-size:26px;opacity:.8;flex:none;margin-right:56px}";
    document.head.appendChild(st);
  }
  function load() {
    var H = { headers: { "x-init-data": init } };
    fetch("/api/user/" + encodeURIComponent(user.id), H).then(function (r) { return r.json(); }).then(function (d) {
      var p = (d && (d.profile || d.stats)) || d || {};
      info.elo = p.elo != null ? p.elo : (d && d.elo != null ? d.elo : info.elo);
      if (d && d.name) info.name = d.name;
    }).catch(function () {});
    fetch("/api/balance", H).then(function (r) { return r.json(); }).then(function (d) { if (d && d.diamonds != null) info.gems = d.diamonds; }).catch(function () {});
  }
  function goProfile() {
    var all = document.querySelectorAll("button,div,a,span");
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.children.length === 0 || e.children.length === 1) {
        if ((e.textContent || "").replace(/\s+/g, " ").trim().replace(/^\S+\s/, "") === "Profil" || (e.textContent || "").trim() === "Profil") {
          var t = e; while (t && t !== document.body && getComputedStyle(t).position !== "fixed" && !t.onclick && t.tagName !== "BUTTON") t = t.parentNode;
          try { (t && t !== document.body ? t : e).click(); } catch (x) {}
          return;
        }
      }
    }
  }
  setInterval(function () {
    var hero = document.getElementById("hzHero");
    var show = !!(hero && hero.offsetParent !== null);
    if (!bar) {
      bar = document.createElement("div"); bar.id = "hzMe"; document.body.appendChild(bar); bar.onclick = goProfile;
    }
    bar.style.display = show ? "flex" : "none";
    if (!show) return;
    if (Date.now() - last > 30000) { last = Date.now(); load(); }
    var s = info.name + "|" + info.elo + "|" + info.gems; if (s === sig) return; sig = s;
    bar.innerHTML = "<img src=\"/api/av/" + encodeURIComponent(user.id) + "\" onerror=\"this.outerHTML='<span class=meA>👤</span>'\"><div class=\"meB\"><b>" + esc(info.name) + "</b><small><i class=\"dot\"></i>ELO " + (info.elo == null ? "—" : esc(info.elo)) + " &nbsp; 🪙 " + (info.gems == null ? "—" : esc(info.gems)) + "</small></div><div class=\"meG\">›</div>";
  }, 700);
})();

;(function () {
  if (!document.getElementById("hzFixCss")) {
    var st = document.createElement("style"); st.id = "hzFixCss";
    st.textContent =
      "#hzHero::after{content:'👑'!important;display:block!important;position:fixed!important;left:50%;top:48%;transform:translate(-50%,-50%);margin:0!important;font-size:170px!important;opacity:.07!important;filter:none!important;pointer-events:none;z-index:0}" +
      ".hzGone{display:none!important}" +
      "#hzSeek{background:linear-gradient(180deg,#22c955,#0f8f3a)!important;border-color:#4dff7c!important}" +
      "#lbPanel{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 170px)!important}";
    document.head.appendChild(st);
  }
  setInterval(function () {
    var p = document.getElementById("lbPanel"); if (!p) return;
    ["lbTc", "lbPos", "lbGm", "lbQuick"].forEach(function (id) {
      var e = document.getElementById(id); if (!e) return;
      var r = e.closest(".row"); if (!r || r === p) r = e;
      r.classList.add("hzGone");
    });
    Array.prototype.forEach.call(p.querySelectorAll("button"), function (b) {
      if (/Havola yaratish/.test(b.textContent || "")) b.classList.add("hzGone");
    });
  }, 500);
})();

;(function () {
  if (document.getElementById("hzOrdCss")) return;
  var st = document.createElement("style"); st.id = "hzOrdCss";
  st.textContent =
    "#hzHero{display:flex!important;flex-direction:column}#hzHero>*{order:9}" +
    "#hzPromo{order:2!important;margin:0 0 10px!important;padding:8px 12px!important;border-radius:18px!important}" +
    "#hzPromo .pgI{font-size:36px!important}#hzPromo .pgT{font-size:16px!important}#hzPromo .pgP{font-size:13px!important;padding:2px 8px!important}#hzPromo .pgS{font-size:12px!important;margin-top:2px!important}#hzPromo .pgA{font-size:26px!important}" +
    "#hzRow2{order:3!important;display:flex;gap:10px;margin:0 0 10px}" +
    "#hzRow2>*{flex:1 1 0;min-width:0;margin:0!important;box-sizing:border-box}" +
    "#hzRow2 #hzDaily{padding:10px!important}#hzRow2 #hzDaily .hzN{display:none!important}#hzRow2 #hzDaily::after{display:none!important}" +
    "#hzTrn{display:flex;align-items:center;gap:10px;padding:10px;border-radius:18px;cursor:pointer;color:#fff;font-weight:800;font-size:17px;background:linear-gradient(100deg,#2b7cff,#6a3df0);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35)}" +
    "#hzTrn span{font-size:30px;flex:none}#hzTrn small{display:block;font-weight:400;font-size:12px;opacity:.85}" +
    "#hzMkR{order:4!important}#hzLive{order:6!important}#hzRec{order:7!important}";
  document.head.appendChild(st);
})();

;(function () {
  function navTo(label) {
    var hero = document.getElementById("hzHero"), all = document.querySelectorAll("button,div,a,span,li");
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (hero && hero.contains(e)) continue;
      var tx = (e.textContent || "").replace(/\s+/g, " ").trim();
      if (tx === label || (tx.split(" ").pop() === label && e.children.length <= 2 && tx.length < label.length + 4)) { try { e.click(); } catch (x) {} return; }
    }
  }
  setInterval(function () {
    var hero = document.getElementById("hzHero"); if (!hero) return;
    var seek = document.getElementById("hzSeek");
    if (seek) seek.style.order = "1";
    var daily = document.getElementById("hzDaily"); if (!daily) return;
    var row = document.getElementById("hzRow2");
    if (!row) {
      row = document.createElement("div"); row.id = "hzRow2";
      hero.insertBefore(row, daily);
      row.appendChild(daily);
      var t = document.createElement("div"); t.id = "hzTrn";
      t.innerHTML = "<span>🏆</span><div>Turnirlar<small>Yangi va tugagan</small></div>";
      t.onclick = function () { navTo("Turnir"); };
      row.appendChild(t);
    }
  }, 500);
})();

;(function () {
  var st = document.createElement("style"); st.id = "hzFix2Css";
  st.textContent = "#hzMe{display:none!important}#hzHero{padding-bottom:0!important}#lbPanel{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 90px)!important}";
  document.head.appendChild(st);
  setInterval(function () {
    var h = document.getElementById("hzHero"), s = document.getElementById("hzSeek");
    if (h && s && s.parentNode && s.parentNode !== h) s.parentNode.style.order = "1";
  }, 500);
})();

;(function () {
  var st = document.createElement("style"); st.id = "hzSwapCss";
  st.textContent = "#hzTrn{display:none!important}#hzRow2 #hzMkR{padding:10px!important;gap:8px!important;min-height:0!important;border-radius:18px!important}#hzRow2 #hzMkR small,#hzRow2 #hzMkR .hzBtn{display:none!important}#hzRow2 #hzMkR b{font-size:17px!important}#hzRow2 #hzMkR .hzIc{font-size:30px!important}";
  document.head.appendChild(st);
  setInterval(function () {
    var row = document.getElementById("hzRow2"), mk = document.getElementById("hzMkR");
    if (row && mk && mk.parentNode !== row) row.appendChild(mk);
  }, 500);
})();

;(function () {
  var DEF = ["hzSeek", "hzPromo", "hzDaily", "hzMkR", "hzLive"], HALF = { hzDaily: 1, hzMkR: 1 };
  var AC = [["nav:Turnir", "🏆 Turnir"], ["nav:Reyting", "📊 Reyting"], ["nav:Menyu", "☰ Menyu"], ["nav:Profil", "👤 Profil"], ["puz", "🧩 Masalalar"], ["arch", "📁 Arxiv"], ["ai", "🤖 Kompyuterga qarshi"], ["url", "🔗 Havola"]];
  var CL = [["#2b7cff", "Ko‘k"], ["#16a34a", "Yashil"], ["#e8590c", "To‘q sariq"], ["#c0392b", "Qizil"], ["#7c3aed", "Binafsha"], ["#0f766e", "Moviy-yashil"]];
  var init = ""; try { init = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ""; } catch (e) {}
  var L = null, draft = null, admin = false, editing = false, lastLoad = 0;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o || {})); }
  function opts(a) { return a.map(function (x) { return "<option value=\"" + x[0] + "\">" + x[1] + "</option>"; }).join(""); }
  function say(t) { try { Telegram.WebApp.showAlert(t); } catch (e) { try { alert(t); } catch (x) {} } }
  var st = document.createElement("style");
  st.textContent =
    "#hzHero{position:relative!important;flex-direction:row!important;flex-wrap:wrap!important;gap:10px!important;align-content:flex-start}#hzRow2{display:contents!important}" +
    "#hzHero>*,#hzRow2>*{margin:0!important;box-sizing:border-box}.hzOff{display:none!important}.hzDim{opacity:.35}" +
    ".hzCus{display:flex;align-items:center;gap:10px;padding:14px;border-radius:18px;cursor:pointer;color:#fff;font-weight:800;font-size:17px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35)}.hzCus .cI{font-size:28px;flex:none}" +
    ".hzEd{outline:2px dashed rgba(255,255,255,.5);outline-offset:-2px}" +
    ".hzTb{position:absolute;display:flex;gap:4px;z-index:5;transform:translateX(-100%)}.hzTb i{font-style:normal;background:rgba(0,0,0,.7);color:#fff;border-radius:8px;padding:5px 9px;font-size:15px;line-height:1.2}" +
    "#hzEdBtn{position:fixed;right:10px;top:28px;z-index:9700;border:0;border-radius:50%;width:30px;height:30px;padding:0;line-height:30px;opacity:.85;background:#2b7cff;color:#fff;font-size:20px;font-weight:700;display:none}" +
    "#hzEdBar{position:fixed;left:10px;right:10px;bottom:176px;z-index:9700;display:none;gap:6px;flex-wrap:wrap;padding:8px;border-radius:16px;background:rgba(15,12,50,.97);box-shadow:inset 0 0 0 1.5px rgba(110,120,255,.6)}#hzEdBar button{flex:1 1 30%;border:0;border-radius:12px;padding:10px 6px;background:#262b66;color:#fff;font-size:14px}#hzEdBar .ok{background:#16a34a}#hzEdBar .no{background:#c0392b}" +
    "#hzMd{position:fixed;inset:0;z-index:9800;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}.hzMb{width:100%;max-width:380px;background:#1a1450;color:#fff;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px}.hzMb input,.hzMb select{background:#0f0c33;color:#fff;border:1px solid #3a3a8a;border-radius:10px;padding:10px;font-size:15px}.hzMr{display:flex;gap:8px}.hzMr button{flex:1;border:0;border-radius:10px;padding:11px;background:#2b7cff;color:#fff;font-size:15px}";
  document.head.appendChild(st);
  function navTo(label) {
    var hero = $("hzHero"), all = document.querySelectorAll("button,div,a,span,li");
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (hero && hero.contains(e)) continue;
      var tx = (e.textContent || "").replace(/\s+/g, " ").trim();
      if (tx === label || (tx.split(" ").pop() === label && e.children.length <= 2 && tx.length < label.length + 4)) { try { e.click(); } catch (x) {} return; }
    }
  }
  function go(c) {
    var a = c.a || "";
    if (a.indexOf("nav:") === 0) navTo(a.slice(4));
    else if (a === "puz") { if (window.mnA) window.mnA("@puz"); }
    else if (a === "arch") { if (window.mnA) window.mnA("@arch"); }
    else if (a === "ai") { if (window.aiShow) { try { if (window.lbNav) window.lbNav.close(); } catch (x) {} window.aiShow("play"); } }
    else if (a === "url" && /^https?:\/\//.test(c.u || "")) { try { Telegram.WebApp.openLink(c.u); } catch (e) { window.open(c.u, "_blank"); } }
  }
  function ids(c) {
    var o = (c && c.o) || [], r = [], all = DEF.concat(((c && c.c) || []).map(function (x) { return x.id; }));
    o.forEach(function (i) { if (all.indexOf(i) >= 0 && r.indexOf(i) < 0) r.push(i); });
    all.forEach(function (i) { if (r.indexOf(i) < 0) r.push(i); });
    return r;
  }
  function isHalf(c, id) { var w = (c.w || {})[id]; return w ? w === "half" : !!HALF[id]; }
  function cur() { return (editing ? draft : L) || {}; }
  function apply() {
    var hero = $("hzHero"); if (!hero) return;
    var c = cur(), cs = {}, sk = $("hzSeek");
    (c.c || []).forEach(function (x) { cs[x.id] = x; });
    if (sk && sk.parentNode !== hero) { var ow = sk.parentNode; hero.appendChild(sk); if (ow && ow !== hero) ow.classList.add("hzOff"); }
    Array.prototype.forEach.call(hero.querySelectorAll(".hzCus"), function (e) { if (!cs[e.id]) e.remove(); });
    (c.c || []).forEach(function (x) {
      var e = $(x.id);
      if (!e) {
        e = document.createElement("div"); e.id = x.id; e.className = "hzCus"; hero.appendChild(e);
        e.onclick = function () { var q = cur().c || []; for (var i = 0; i < q.length; i++) if (q[i].id === e.id) return go(q[i]); };
      }
      var s = x.t + "|" + x.i + "|" + x.k;
      if (e.dataset.s !== s) { e.dataset.s = s; e.style.background = x.k; e.innerHTML = "<span class=\"cI\">" + esc(x.i) + "</span><b>" + esc(x.t) + "</b>"; }
    });
    ids(c).forEach(function (id, n) {
      var e = $(id); if (!e) return;
      e.style.setProperty("order", String(n + 1), "important");
      e.style.setProperty("flex", isHalf(c, id) ? "1 1 calc(50% - 5px)" : "1 1 100%", "important");
      e.style.setProperty("min-width", "0", "important");
      var off = !!(c.h && c.h[id]);
      e.classList.toggle("hzOff", off && !editing);
      e.classList.toggle("hzDim", off && editing);
      e.classList.toggle("hzEd", editing);
    });
  }
  function tbs() {
    var hero = $("hzHero"); if (!hero) return;
    var old = hero.querySelectorAll(".hzTb");
    if (!editing) { Array.prototype.forEach.call(old, function (t) { t.remove(); }); return; }
    var c = draft || {}, list = ids(c), cs = {};
    (c.c || []).forEach(function (x) { cs[x.id] = 1; });
    Array.prototype.forEach.call(old, function (t) { if (list.indexOf(t.getAttribute("data-id")) < 0) t.remove(); });
    list.forEach(function (id) {
      var e = $(id); if (!e) return;
      var tb = hero.querySelector(".hzTb[data-id=\"" + id + "\"]");
      if (!tb) {
        tb = document.createElement("span"); tb.className = "hzTb"; tb.setAttribute("data-id", id);
        tb.innerHTML = "<i data-a=\"up\">▲</i><i data-a=\"dn\">▼</i><i data-a=\"w\">↔</i><i data-a=\"h\">👁</i>" + (cs[id] ? "<i data-a=\"x\">✖</i>" : "");
        hero.appendChild(tb);
      }
      if (!e.offsetParent) { tb.style.display = "none"; return; }
      tb.style.display = "flex"; tb.style.top = (e.offsetTop + 6) + "px"; tb.style.left = (e.offsetLeft + e.offsetWidth - 6) + "px";
    });
  }
  function act(a, id) {
    var o = ids(draft), i = o.indexOf(id);
    if (a === "up" && i > 0) o.splice(i - 1, 0, o.splice(i, 1)[0]);
    else if (a === "dn" && i >= 0 && i < o.length - 1) o.splice(i + 1, 0, o.splice(i, 1)[0]);
    else if (a === "w") { draft.w = draft.w || {}; draft.w[id] = isHalf(draft, id) ? "full" : "half"; }
    else if (a === "h") { draft.h = draft.h || {}; if (draft.h[id]) delete draft.h[id]; else draft.h[id] = 1; }
    else if (a === "x") { draft.c = (draft.c || []).filter(function (x) { return x.id !== id; }); o = o.filter(function (x) { return x !== id; }); }
    draft.o = o; apply();
  }
  function clickH(ev) {
    if (!editing) return;
    var t = ev.target, tb = t.closest ? t.closest(".hzTb") : null;
    ev.stopPropagation(); ev.preventDefault();
    var a = t.getAttribute && t.getAttribute("data-a");
    if (tb && a) act(a, tb.getAttribute("data-id"));
  }
  function newBtn() {
    if ($("hzMd")) return;
    var m = document.createElement("div"); m.id = "hzMd";
    m.innerHTML = "<div class=\"hzMb\"><b>Yangi tugma</b><input id=\"hzMn\" placeholder=\"Nomi\" maxlength=\"24\"><input id=\"hzMi\" value=\"⭐\" maxlength=\"4\"><select id=\"hzMc\">" + opts(CL) + "</select><select id=\"hzMa\">" + opts(AC) + "</select><input id=\"hzMu\" placeholder=\"https://...\" style=\"display:none\"><div class=\"hzMr\"><button id=\"hzMok\">Qo‘shish</button><button id=\"hzMx\" style=\"background:#c0392b\">Bekor</button></div></div>";
    document.body.appendChild(m);
    $("hzMa").onchange = function () { $("hzMu").style.display = this.value === "url" ? "block" : "none"; };
    $("hzMx").onclick = function () { m.remove(); };
    $("hzMok").onclick = function () {
      var t = $("hzMn").value.trim(); if (!t) return;
      var x = { id: "hzC" + Date.now().toString(36), t: t, i: $("hzMi").value || "⭐", k: $("hzMc").value, a: $("hzMa").value, u: $("hzMu").value.trim() };
      draft.c = (draft.c || []).concat([x]); draft.o = ids(draft); m.remove(); apply();
    };
  }
  function save() {
    fetch("/api/layout", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": init }, body: JSON.stringify({ layout: draft }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) { L = clone(draft); editing = false; draft = null; say("Saqlandi ✅"); } else say("Saqlanmadi: " + ((d && d.error) || "xato")); })
      .catch(function () { say("Aloqa xatosi"); });
  }
  function ui() {
    var hero = $("hzHero"), vis = !!(hero && hero.offsetParent !== null);
    var eb = $("hzEdBtn");
    if (!eb) { eb = document.createElement("button"); eb.id = "hzEdBtn"; eb.textContent = "+"; document.body.appendChild(eb); eb.onclick = function () { if (admin) { editing = true; draft = clone(L); } }; }
    eb.style.display = (admin && vis && !editing) ? "block" : "none";
    var bar = $("hzEdBar");
    if (!bar) {
      bar = document.createElement("div"); bar.id = "hzEdBar";
      bar.innerHTML = "<button id=\"hzB1\">➕ Yangi tugma</button><button id=\"hzB2\">🏅 Pro ko‘rinish</button><button id=\"hzB3\">↺ Asl holat</button><button id=\"hzB4\" class=\"ok\">💾 Saqlash</button><button id=\"hzB5\" class=\"no\">✖ Bekor</button>";
      document.body.appendChild(bar);
      $("hzB1").onclick = newBtn;
      $("hzB2").onclick = function () { draft = { o: ["hzSeek", "hzDaily", "hzMkR", "hzLive", "hzPromo"], h: { hzPromo: 1 }, w: { hzDaily: "half", hzMkR: "half" }, c: (draft && draft.c) || [] }; apply(); };
      $("hzB3").onclick = function () { draft = {}; apply(); };
      $("hzB4").onclick = save;
      $("hzB5").onclick = function () { editing = false; draft = null; apply(); };
    }
    bar.style.display = (editing && vis) ? "flex" : "none";
  }
  function load() {
    fetch("/api/layout", { headers: { "x-init-data": init } }).then(function (r) { return r.json(); }).then(function (d) { admin = !!d.admin; if (!editing) L = d.layout || null; }).catch(function () {});
  }
  setInterval(function () {
    var hero = $("hzHero"); if (!hero) return;
    if (!hero._hzE) { hero._hzE = 1; hero.addEventListener("click", clickH, true); }
    if (Date.now() - lastLoad > 60000) { lastLoad = Date.now(); load(); }
    apply(); tbs(); ui();
  }, 500);
})();

;(function () {
  if (window.spBoardOpen) return;
  window.spBoardOpen = function (g) {
    var fallback = function () { if (window.spAnalyze) window.spAnalyze(g); };
    try {
      if (window.spBoard) { window.spBoard(g); return; }
      var s = document.createElement("script");
      s.src = "/board.js?v=" + Date.now();
      s.onload = function () { try { window.spBoard(g); } catch (e) { fallback(); } };
      s.onerror = fallback;
      document.head.appendChild(s);
    } catch (e) { fallback(); }
  };
})();

;(function(){var s=document.createElement("script");s.src="/arenaview.js";document.head.appendChild(s)})();

;(function(){var s=document.createElement("script");s.src="/uzclock.js";document.head.appendChild(s)})();


;(function () {
  var adm = false;
  function ini() { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ''; }
  try { fetch('/api/botadmin', { headers: { 'x-init-data': ini() } }).then(function (r) { return r.json(); }).then(function (j) { adm = !!(j && j.admin); }).catch(function () {}); } catch (e) {}
  document.addEventListener('click', function (e) {
    if (!adm) return;
    var t = e.target.closest && e.target.closest('.lbav'); if (!t) return;
    var m = /spUser\('(bot[a-z_]*)'\)/.exec(t.getAttribute('onclick') || ''); if (!m) return;
    e.stopPropagation(); e.preventDefault(); openEd(m[1]);
  }, true);
  function openEd(uid) {
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000a;display:flex;align-items:center;justify-content:center';
    o.innerHTML = '<div style="background:#1b1b3a;color:#fff;padding:18px;border-radius:16px;width:80%;max-width:340px;font-size:15px"><b>Botni tahrirlash</b><input id="beN" placeholder="Yangi nom (masalan: Arslon BOT)" maxlength="24" style="width:100%;box-sizing:border-box;margin:12px 0;padding:10px;border-radius:10px;border:0"><input id="beF" type="file" accept="image/*" style="margin-bottom:12px;width:100%"><div style="display:flex;gap:8px"><button id="beS" style="flex:1;padding:10px;border:0;border-radius:10px;background:#2f7bff;color:#fff">Saqlash</button><button id="beC" style="flex:1;padding:10px;border:0;border-radius:10px;background:#444;color:#fff">Bekor</button></div><div id="beM" style="margin-top:8px;font-size:13px"></div></div>';
    document.body.appendChild(o);
    function $(i) { return o.querySelector('#' + i); }
    $('beC').onclick = function () { o.remove(); };
    $('beS').onclick = function () {
      var name = $('beN').value.trim(), f = $('beF').files && $('beF').files[0];
      function send(img) {
        var body = { uid: uid }; if (name) body.name = name; if (img) body.img = img;
        if (!name && !img) { $('beM').textContent = 'Nom yoki rasm tanlang'; return; }
        $('beM').textContent = 'Saqlanmoqda…';
        fetch('/api/botedit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': ini() }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.ok) { $('beM').textContent = '✅ Saqlandi'; setTimeout(function () { location.reload(); }, 600); } else $('beM').textContent = '⚠️ ' + ((j && j.error) || 'xatolik'); })
          .catch(function () { $('beM').textContent = '⚠️ tarmoq xatosi'; });
      }
      if (!f) return send(null);
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image();
        im.onload = function () {
          var z = 256, cv = document.createElement('canvas'); cv.width = z; cv.height = z;
          var mm = Math.min(im.width, im.height);
          cv.getContext('2d').drawImage(im, (im.width - mm) / 2, (im.height - mm) / 2, mm, mm, 0, 0, z, z);
          send(cv.toDataURL('image/jpeg', 0.8));
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
  }
})();
