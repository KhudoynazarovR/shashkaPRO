;(function () {
  if (window.spPod) return;
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var PZT = { 3: [50,30,20], 4: [40,28,20,12], 5: [35,25,18,13,9], 6: [30,22,17,13,10,8], 7: [28,20,15,12,10,8,7], 8: [26,19,15,12,10,8,5,5], 9: [24,18,14,11,10,8,6,5,4], 10: [22,17,13,11,9,8,7,5,4,4] };
  window.spPod = function (t) {
    var box = document.getElementById("tvPod");
    var live = document.getElementById("tvLive");
    if (live && live.parentNode) live.parentNode.style.display = t.status === "finished" ? "none" : "";
    if (!box) return;
    if (t.status !== "finished") { box.innerHTML = ""; return; }
    var pl = (t.players || []).filter(function (p) { return p.games > 0 && (t.type === "arena" || !p.withdrawn); });
    var aw = t.awards || [];
    if (!aw.length && t.prize > 0) {
      var sh = pl.length >= 3 ? PZT[Math.min(t.places || 3, pl.length)] : pl.length === 2 ? [60, 40] : pl.length === 1 ? [100] : [];
      aw = sh.map(function (pc, i) { return { uid: pl[i].uid, name: pl[i].name, place: i + 1, amt: Math.floor(t.prize * pc / 100) }; });
    }
    var top = [0, 1, 2].map(function (i) { var p = pl[i]; if (!p) return null; var a = aw.filter(function (x) { return x.place === i + 1; })[0]; return { name: p.name, amt: a ? a.amt : 0 }; });
    if (!top[0]) { box.innerHTML = ""; return; }
    var M = ["🥇", "🥈", "🥉"], H = [118, 88, 66], C = ["#f5c542", "#c9d1dc", "#d58a4e"];
    function col(i) {
      var p = top[i]; if (!p) return '<div style="flex:1"></div>';
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0">' +
        '<div style="font-size:30px;line-height:1">' + M[i] + '</div>' +
        '<div style="max-width:100%;font-weight:700;font-size:14px;margin:4px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + e(p.name) + '</div>' +
        (p.amt ? '<div style="font-size:13px;color:#ffd54a;margin-bottom:6px">+' + p.amt + ' 🪙</div>' : '<div style="height:6px"></div>') +
        '<div style="width:100%;height:' + H[i] + 'px;border-radius:10px 10px 0 0;background:linear-gradient(180deg,' + C[i] + ',' + C[i] + '88);display:flex;align-items:flex-start;justify-content:center;padding-top:8px;box-sizing:border-box;font-size:26px;font-weight:800;color:#1a1a1a">' + (i + 1) + '</div></div>';
    }
    box.innerHTML = '<div class="tvSec"><div class="tvSh">🏆 Shohsupa</div><div style="display:flex;gap:8px;align-items:flex-end;padding:6px 4px 0">' + col(1) + col(0) + col(2) + '</div></div>';
  };
})();
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
    // ?room= (o'yinga o'tish) Telegram start_param dan ustun: aks holda eski havola/turnir havolasi o'yinni bosib ketadi
    if (q.get("room")) curRoom = q.get("room");
    else if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && !/^(ref_|pz_|pf_|go_|shop_|pb_|pzt_|ntf_)/.test(tg.initDataUnsafe.start_param)) curRoom = String(tg.initDataUnsafe.start_param);
    // havola orqali kirish: startapp=lbt_<turnir> / lbs_<sians> yoki ?t= / ?s=
    var linkTid = "", linkSid = "", linkFid = "";
    if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; window.__tvLinkTid = linkTid; }
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
      if (kind === "t") linkTid = ""; else linkSid = ""; /*TVOPENLINK*/ if (kind === "t" && id) { var _tvi = 0, _tvt = setInterval(function () { if (window.tvOpen) { clearInterval(_tvt); window.tvOpen(id); } else if (++_tvi > 20) clearInterval(_tvt); }, 150); }
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
    window.__lb = { get S() { return S; }, send: function (m) { sendMsg(m); }, go: function (id) { if (typeof go === "function") go(id); } };
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
        "<div class=\"card\"><div class=\"row\"><input id=\"lbTn\" maxlength=\"30\" placeholder=\"Turnir nomi\" style=\"flex:1\"><button id=\"lbTCreate\">➕ Ochish</button><button class=\"sec\" onclick=\"lbTPlus()\" title=\"Yopish\">✕</button></div>" +
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
      (function () { var _f0 = $("lbTform"); if (_f0) _f0.style.display = "none"; })();
      $("lbTCreate").onclick = function () {
        var _okc = window.lbAtOk(); _okc && sendMsg({ type: "lbTCreate", startAt: window.lbAt(), clubIds: lbClubIds(), kind: $("lbTk").value, pos: $("lbTp").value, duration: Number($("lbTdur").value), startIn: Number($($("lbTk").value === "arena" ? "lbTin" : "lbTsin").value), rounds: Number($("lbTr").value), interval: Number($("lbTiv").value), name: $("lbTn").value, tc: $("lbTtc").value, berserk: $("lbTbz").checked, prize: Number($("lbTpz").value)||0, places: Number($("lbTpl").value)||3 });
        $("lbTn").value = ""; if (_okc) { var _tf = $("lbTform"); if (_tf) _tf.style.display = "none"; } try { var _d = $("lbTclD"); if (_d) _d.open = false; var _cb = document.querySelectorAll("#lbTclD input[type=checkbox]"); for (var _i = 0; _i < _cb.length; _i++) _cb[_i].checked = false; } catch (e) {}
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
      var _t = curTab === "t"; panel.classList.toggle("lbTMode", _t);
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
        $("lbTbar").innerHTML = '<div class="tabs"><button class="' + (tFil === "new" ? "on" : "") + '" onclick="lbTF(1)">⚡ Yangi ' + _n + '</button><button class="' + (tFil === "fin" ? "on" : "") + '" onclick="lbTF(2)" style="flex:0 0 52px;min-width:52px;max-width:52px;padding:0;font-size:22px">🏁</button><button type="button" onclick="window.spBgPicker&&window.spBgPicker()" style="flex:0 0 52px;min-width:52px;max-width:52px;padding:0;font-size:22px">🎨</button></div>' +
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
        if (false && _my.length) {
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
      window.__tOpen = window.__tOpen || {};
    (function () { if (document.getElementById("tkStyle")) return; var st = document.createElement("style"); st.id = "tkStyle"; st.textContent = `
.lbtk{background:#151a38;border:1px solid #2a3160;border-radius:20px;padding:14px;margin:12px 0}
.lbtk>div:first-child{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:18px}
.tkb{font-size:12px;padding:5px 10px;border-radius:10px;white-space:nowrap;font-weight:600;background:#1d2a5c;color:#7ea6ff}
.tkb_running{background:#143d33;color:#2ecc71}
.tkb_finished{background:#2a2f4a;color:#9aa0c0}
.lbtk .muted{margin-top:6px}
.tkd{color:#aab0d6;font-size:14px;margin:6px 0}
.tkd b{color:#fff}
.lbtk .row{margin-top:10px;gap:8px;flex-wrap:wrap}
.lbtk .tbody{border:1px solid #2a3160;border-radius:14px;margin-top:12px}
.lbtk table{width:100%;border-collapse:collapse;font-size:14px}
.lbtk th{color:#8087b8;font-size:11px;text-transform:uppercase;text-align:left;padding:9px 8px;background:#1c2250}
.lbtk td{padding:11px 8px;border-top:1px solid #262c58}
.lbtk td:nth-child(3){color:#f5c542;font-weight:700}
`; document.head.appendChild(st); })(); window.lbTog = function (id) { window.__tOpen[id] = !window.__tOpen[id]; var e = document.querySelector("#lbtc_" + id + " .tbody"); if (e) e.style.display = window.__tOpen[id] ? "block" : "none"; };
      ts.forEach(function (t) {
        var joined = t.players.some(function (p) { return p.uid === me; });
        var arena = t.type === "arena";
        var mins = function (ms) { return Math.max(0, Math.ceil(ms / 60000)) + " daq"; };
        var st = arena
          ? (t.status === "reg" ? (t.startAt ? "" : "Ro‘yxat ochiq") : (t.status === "running" ? (t.ending ? "Tugayapti…" : "") : "Tugagan"))
          : (t.status === "reg" ? "Ro‘yxat ochiq · " + (t.roundsWanted || "?") + " tur" + "" : (t.status === "running" ? t.round + "/" + t.rounds + "-tur" : "Tugagan"));
        var _p2 = function (n) { return ("0" + n).slice(-2); }, _ex = [];
        if (t.startAt && t.status === "reg") { var _d = new Date(t.startAt); _ex.push("🕐 " + (_d.toDateString() === new Date().toDateString() ? "" : _p2(_d.getDate()) + "." + _p2(_d.getMonth() + 1) + " ") + _p2(_d.getHours()) + ":" + _p2(_d.getMinutes())); }
        if (t.prize > 0) _ex.push("🪙 Mukofot: " + t.prize + " (" + (t.places || 3) + " o‘ringa)");
        if (arena) _ex.push(t.berserk === false ? "⚡ Berserk yo‘q" : "⚡ Berserk");
        if (_ex.length) st += (st ? "<br>" : "") + _ex.join(" · ");
        h += "<div class=\"card lbtk " + (arena ? "lbta" : "lbts") + "\" id=\"lbtc_" + esc(t.id) + "\"><div style=\"cursor:pointer\" onclick=\"lbTog('" + esc(t.id) + "')\"><b>" + (arena ? "⚔️" : "🏆") + " " + esc(t.name) + " ▾</b><span class=\"tkb tkb_" + t.status + "\">" + (t.status === "reg" ? "Ro‘yxat ochiq" : (t.status === "running" ? "O‘ynalmoqda" : "Tugagan")) + "</span></div><div class=\"muted\">⏱ " + esc(t.tc) + " · " + (t.pos === "idf" ? "🎲 IDF 780" : "♟ Standart") + "</div><div class=\"tkd\">" + st + "</div><div class=\"tkd\">👥 Ishtirokchilar: <b>" + t.players.length + "</b></div><div class=\"tkd\">👤 Yaratuvchi: <b>" + esc(t.creatorName) + "</b>" + "</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"tlink\" data-id=\"" + esc(t.id) + "\" data-n=\"" + esc(t.name) + "\">🔗 Havola</button>";
        if (t.status === "reg") {
          if (!joined) h += "<button data-a=\"tj\" data-id=\"" + t.id + "\">Qo‘shilish</button>";
          else if (t.creatorUid !== me) h += "<button class=\"sec\" data-a=\"tl\" data-id=\"" + t.id + "\">Chiqish</button>";
          if (t.creatorUid === me) {
            if (!t.startAt) h += "<button class=\"grn\" data-a=\"ts\" data-id=\"" + t.id + "\">▶ Boshlash</button>"; h += "<button class=\"red\" data-a=\"tc\" data-id=\"" + t.id + "\">Bekor qilish</button>";
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
        h += "<div class=\"tbody\" style=\"max-height:260px;overflow:auto;display:" + (window.__tOpen[t.id] ? "block" : "none") + "\"><table><tr><th>#</th><th>O‘yinchi</th><th>Ochko</th><th>" + (arena ? "O‘yin" : "SB") + "</th>" + (arena ? "" : "<th>Bux.</th>") + "</tr>";
        t.players.slice(0, 12).forEach(function (p, i) {
          h += "<tr><td>" + (i + 1) + "</td><td>" + esc(p.name) + (p.uid === me ? " 👈" : "") + (p.withdrawn ? " <span class=\"muted\">(chiqdi)</span>" : "") + "</td><td>" + p.score + (p.fire ? " 🔥" : "") + "</td><td>" + (arena ? p.games : p.sb) + "</td>" + (arena ? "" : "<td>" + p.buch + "</td>") + "</tr>";
        });
        h += "</table></div>";
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
        var bot = r.vsBot || /BOT/.test(String(r.white)+String(r.black)); var tcl = bot ? "∞" : r.tc; var c = bot ? "#8e6bd6" : (COL[r.tc] || "#6aaed4");
        h += "<div class=\"hzLvC\" data-r=\"" + esc(r.id) + "\"><b style=\"background:" + c + "\">Shashka " + esc(tcl) + "</b><div>⚪ " + esc(r.white) + " (" + (r.wElo || 1000) + ")</div><i>vs</i><div>⚫ " + esc(r.black) + " (" + (r.bElo || 1000) + ")</div><u>👁 " + (r.spectators || 0) + " · " + Math.ceil((r.moves || 0) / 2) + " yurish</u></div>";
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
    b.classList.toggle("on", q); // className= hzOff (yashirish) ni o'chirib, miltillatardi
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
        pe.innerHTML = "<div class=\"pgI\">🎁</div><div class=\"pgB\"><div class=\"pgT\">Do‘st taklif qiling</div><span class=\"pgP\">+200 🪙</span><div class=\"pgS\">⏳ " + esc(sm.textContent.split(" · ")[0].replace(" qoldi", "")) + "</div></div>";
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
  var GONE = { hzSeek: 1, hzPromo: 1, hzDaily: 1 }; // bosh sahifadan butunlay olib tashlangan (Raqib qidirish, Do‘st taklif, Kunning masala ustasi)
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
    "#hzHero>*,#hzRow2>*{margin:0!important;box-sizing:border-box}.hzOff,html body #hzHero #hzPromo.hzOff{display:none!important}.hzDim{opacity:.35}" +
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
      var off = !!GONE[id] || !!(c.h && c.h[id]);
      e.classList.toggle("hzOff", off && !editing);
      e.classList.toggle("hzDim", off && editing);
      e.classList.toggle("hzEd", editing);
    });
    // Taklif banneri doim tepada, profil kartasi yonida yarim kenglikda
    var pr = $("hzPromo"), pf = $("pfCard"), prOn = !!(pr && pr.style.display !== "none" && !pr.classList.contains("hzOff"));
    if (pr && !editing) { pr.style.setProperty("order", "0", "important"); pr.style.setProperty("flex", "1 1 calc(50% - 5px)", "important"); }
    if (pf) pf.classList.toggle("pfHalf", prOn && !editing);
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
    eb.style.display = "none"; // suzib yuruvchi «+» halaqit berardi — endi ⚙️ Sozlamalar → «Bosh sahifani tahrirlash»
    window.hzIsAdmin = function () { return !!admin; };
    window.hzEdit = function () { if (admin) { editing = true; draft = clone(L); } };
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
;(function(){
  if (document.getElementById("lbGreenCss")) return;
  var LEAF = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><g opacity='.55'><path fill='%23238b45' d='M100 5C150 40 160 110 100 195C40 110 50 40 100 5Z'/><path stroke='%2357c27a' stroke-width='3' fill='none' d='M100 15V185'/><path fill='%23186c34' transform='rotate(55 100 100)' d='M100 20C140 50 148 105 100 175C52 105 60 50 100 20Z'/><path fill='%232fa356' transform='rotate(-50 100 100)' d='M100 30C135 55 140 105 100 165C60 105 65 55 100 30Z'/></g></svg>";
  var ARR = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6' stroke='%2390f0b0' stroke-width='2.5' fill='none' stroke-linecap='round'/></svg>";
  var P = "#lbPanel.lbTMode ";
  var css =
  "#lbPanel.lbTMode{background:url(\"data:image/svg+xml," + LEAF + "\") right -40px top -30px/190px no-repeat,url(\"data:image/svg+xml," + LEAF + "\") left -60px bottom 40px/220px no-repeat,radial-gradient(circle at 15% 10%,rgba(80,200,120,.25),transparent 40%),radial-gradient(circle at 90% 85%,rgba(40,160,90,.22),transparent 45%),linear-gradient(160deg,#06281a,#0b3b24 45%,#04170f)!important}" +
  "#lbPanel.lbTMode::before{display:none!important}" +
  P+"h2{color:#eafff0;text-shadow:0 2px 8px rgba(0,0,0,.5)}" +
  P+"#lbT>.card{background:linear-gradient(180deg,rgba(10,60,35,.9),rgba(5,35,20,.94))!important;border:1px solid rgba(110,230,150,.35)!important;border-radius:22px!important;padding:16px!important;box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(160,255,190,.15)!important}" +
  P+"#lbT .row{gap:10px;align-items:center;margin:10px 0}" +
  P+"#lbT .muted{color:#9fe3b4!important;font-weight:600}" +
  P+"#lbT input:not([type=checkbox]),"+P+"#lbT select{background-color:rgba(3,30,16,.8)!important;color:#eafff0!important;border:1px solid rgba(90,210,130,.45)!important;border-radius:14px!important;padding:11px 12px!important;outline:none;color-scheme:dark;box-shadow:inset 0 2px 6px rgba(0,0,0,.35)}" +
  P+"#lbT select{-webkit-appearance:none;appearance:none;background-image:url(\"data:image/svg+xml," + ARR + "\")!important;background-repeat:no-repeat!important;background-position:right 10px center!important;background-size:16px!important;padding-right:34px!important}" +
  P+"#lbT input:focus,"+P+"#lbT select:focus{border-color:#5ee08a!important;box-shadow:0 0 0 3px rgba(94,224,138,.25)!important}" +
  P+"#lbT input::placeholder{color:#7fbf95}" +
  P+"#lbTCreate{background:linear-gradient(180deg,#45d873,#1e9e45)!important;color:#fff!important;border:1px solid #7dff9f!important;border-radius:14px!important;font-weight:800;padding:11px 16px!important;box-shadow:0 4px 14px rgba(40,200,90,.45)}" +
  P+"#lbT .sec{background:rgba(5,40,22,.85)!important;color:#dfffe8!important;border:1px solid rgba(90,210,130,.45)!important;border-radius:14px!important}" +
  P+"#lbTclS{background:rgba(3,30,16,.8)!important;border:1px solid rgba(90,210,130,.45)!important;color:#eafff0}" +
  P+"#lbTbzr label{color:#8ff0ae;font-weight:700;display:flex;align-items:center;gap:10px}" +
  P+"#lbT input[type=checkbox]{accent-color:#2fbf5b;width:22px;height:22px}" +
  P+"#lbTbzr{padding-bottom:10px;border-bottom:1px solid rgba(110,230,150,.18)}" +
  P+"#lbTpzc{color:#cdeed7!important;font-size:13px!important;padding:2px 0 10px;border-bottom:1px solid rgba(110,230,150,.18)}" +
  P+"#lbTinfo{position:relative;background:rgba(20,80,50,.55);border:1px solid rgba(110,230,150,.3);border-radius:14px;padding:10px 12px 10px 40px;margin-top:10px;color:#cdeed7!important;font-weight:400!important}" +
  P+"#lbTinfo::before{content:'ℹ️';position:absolute;left:12px;top:10px}" +
  P+"#lbTs .card{background:rgba(6,45,26,.88)!important;border:1px solid rgba(110,230,150,.25)!important;border-radius:18px!important}";
  var st = document.createElement("style"); st.id = "lbGreenCss"; st.textContent = css;
  document.head.appendChild(st);
})();

/*TVIEW-START*/
;(function(){
  if (window.__tvInit) return; window.__tvInit = 1;
  function g(id){ return document.getElementById(id); }
  function L(){ return window.__lb || null; }
  function St(){ var l = L(); try { return l ? l.S : null; } catch(e){ return null; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(x){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]; }); }
  function findT(id){ var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function meUid(){ var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function myP(t){ var u = meUid(), ps = t.players || []; for (var i = 0; i < ps.length; i++) if (String(ps[i].uid) === u) return ps[i]; return null; }
  function joined(t){ var p = myP(t); return !!(p && !p.withdrawn); }
  function send(m){ var l = L(); if (l && l.send) l.send(m); }
  function fmt(ms){ ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function hm(ts){ var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  var CSS =
  "#tvP{position:fixed;inset:0;z-index:2147481500;display:none;flex-direction:column;color:#eafff0;background:radial-gradient(circle at 15% 8%,rgba(80,200,120,.22),transparent 40%),radial-gradient(circle at 90% 85%,rgba(40,160,90,.2),transparent 45%),linear-gradient(160deg,#06281a,#0b3b24 45%,#04170f)}" +
  "#tvP.on{display:flex}" +
  ".tvHead{display:flex;align-items:center;gap:8px;padding:12px;background:rgba(3,25,14,.9);border-bottom:1px solid rgba(110,230,150,.25)}" +
  ".tvIc{width:42px;height:42px;min-height:0!important;padding:0!important;border-radius:12px!important;background:rgba(5,40,22,.9)!important;color:#dfffe8!important;border:1px solid rgba(90,210,130,.45)!important;font-size:18px}" +
  ".tvTit{flex:1;min-width:0}.tvTit b{display:block;font-size:18px;color:#ffd76a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tvTit small{color:#9fe3b4;font-size:13px}" +
  "#tvBody{flex:1;overflow-y:auto;padding:12px 12px 100px;-webkit-overflow-scrolling:touch}" +
  ".tvInfo{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}" +
  ".tvChip{background:rgba(20,80,50,.6);border:1px solid rgba(110,230,150,.3);border-radius:999px;padding:5px 10px;font-size:13px}" +
  ".tvSec{background:linear-gradient(180deg,rgba(10,60,35,.92),rgba(5,35,20,.95));border:1px solid rgba(110,230,150,.3);border-radius:18px;padding:12px;margin-bottom:12px;box-shadow:0 8px 24px rgba(0,0,0,.35)}" +
  ".tvSh{display:flex;align-items:center;gap:6px;font-weight:800;font-size:15px;margin-bottom:8px}.tvSh span{color:#9fe3b4;font-weight:600}.tvSh i{margin-left:auto;font-style:normal;color:#9fe3b4}" +
  "#tvChatH{cursor:pointer}" +
  "#tvMsgs{max-height:170px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:2px}" +
  ".tvM{max-width:82%;align-self:flex-start;background:rgba(3,30,16,.85);border:1px solid rgba(90,210,130,.25);border-radius:14px 14px 14px 4px;padding:6px 10px;font-size:14px;word-wrap:break-word}" +
  ".tvM.me{align-self:flex-end;background:linear-gradient(180deg,#2a9d52,#1c7a3c);border-color:#5ee08a;border-radius:14px 14px 4px 14px}" +
  ".tvM b{display:block;font-size:12px;color:#ffd76a}.tvM small{display:block;text-align:right;font-size:10px;opacity:.6}" +
  ".tvIn{display:flex;gap:8px;margin-top:8px}" +
  ".tvIn input{flex:1;min-width:0;background:rgba(3,30,16,.85);color:#eafff0;border:1px solid rgba(90,210,130,.45);border-radius:14px;padding:10px 12px;outline:none}" +
  ".tvIn button{min-height:0!important;width:46px;border-radius:14px!important;background:linear-gradient(180deg,#45d873,#1e9e45)!important;color:#fff!important;border:0!important;font-size:18px}" +
  ".tvLive{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}" +
  ".tvG{flex:0 0 auto;width:170px;background:rgba(3,30,16,.85);border:1px solid rgba(90,210,130,.35);border-radius:14px;padding:10px;position:relative}" +
  ".tvG .lv{position:absolute;top:8px;right:8px;font-size:11px;color:#ff6b6b;font-weight:800}" +
  ".tvG .n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;margin:3px 0;padding-right:4px}" +
  ".tvG button{width:100%;min-height:0!important;margin-top:8px;padding:7px!important;border-radius:10px!important;background:rgba(46,180,90,.25)!important;color:#bfffd2!important;border:1px solid rgba(94,224,138,.5)!important;font-weight:700}" +
  ".tvEmpty{color:#9fe3b4;font-size:13px;padding:6px 2px}" +
  ".tvTb{width:100%;border-collapse:collapse;font-size:14px}" +
  ".tvTb th{color:#9fe3b4;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;padding:6px 4px;border-bottom:1px solid rgba(110,230,150,.25)}" +
  ".tvTb th.r,.tvTb td.r{text-align:right}" +
  ".tvTb td{padding:9px 4px;border-bottom:1px solid rgba(110,230,150,.1)}" +
  ".tvTb tr.me td{background:rgba(94,224,138,.14)}" +
  ".tvTb .sc{color:#ffd76a;font-weight:800}" +
  ".tvFoot{position:absolute;left:0;right:0;bottom:0;padding:10px 12px calc(12px + env(safe-area-inset-bottom));display:flex;gap:8px;background:linear-gradient(180deg,transparent,rgba(3,20,11,.96) 35%)}" +
  ".tvFoot button{flex:1;min-height:50px;border-radius:16px!important;font-weight:800;font-size:16px;border:0!important;color:#fff!important}" +
  ".tvJ{background:linear-gradient(180deg,#45d873,#1e9e45)!important;box-shadow:0 4px 16px rgba(40,200,90,.45)}" +
  ".tvL{background:linear-gradient(180deg,#e05555,#a92e2e)!important}" +
  ".tvS{background:linear-gradient(180deg,#f0c14b,#c08a1c)!important;color:#1a1205!important}" +
  ".tvD{background:#2b3a31!important;color:#9fb5a6!important}" +
  ".tvRow{display:flex;gap:8px;margin-top:10px}" +
  ".tvRow button{flex:1;min-height:44px!important;border-radius:14px!important;font-weight:800;border:0!important;color:#fff!important}" +
  ".tvCJ{background:linear-gradient(180deg,#45d873,#1e9e45)!important}" +
  ".tvCL{background:linear-gradient(180deg,#e05555,#a92e2e)!important}" +
  ".tvCE{background:rgba(255,215,106,.15)!important;color:#ffd76a!important;border:1px solid rgba(255,215,106,.55)!important}";

  var HTML =
  '<div class="tvHead"><button class="tvIc" id="tvBack">←</button><div class="tvTit"><b id="tvName"></b><small id="tvSub"></small></div><button class="tvIc" id="tvRef">🔄</button></div>' +
  '<div id="tvBody">' +
    '<div class="tvInfo" id="tvInfo"></div>' +
    '<div class="tvSec"><div class="tvSh" id="tvChatH">💬 Chat <span id="tvChatN"></span><i id="tvChatArr">▾</i></div>' +
      '<div id="tvChatBox"><div id="tvMsgs"></div><div class="tvIn"><input id="tvTxt" maxlength="200" placeholder="Xabar yozing..."><button id="tvSend">➤</button></div></div></div>' +
    '<div class="tvSec"><div class="tvSh">🔴 Live o‘yinlar <span id="tvLiveN"></span></div><div id="tvLive" class="tvLive"></div></div>' +
    '<div id="tvPod"></div>' + '<div class="tvSec"><div class="tvSh">🏅 Jadval</div><div id="tvTable"></div></div>' +
  '</div>' +
  '<div class="tvFoot" id="tvFoot"></div>';

  var st = document.createElement('style'); st.id = 'tvCss'; st.textContent = CSS; document.head.appendChild(st);

  var P = null, curId = null, chatOpen = true, lastMain = '', lastChat = '', timer = null;

  function build(){
    if (P) return;
    P = document.createElement('div'); P.id = 'tvP'; P.innerHTML = HTML; document.body.appendChild(P);
    g('tvBack').onclick = close;
    g('tvRef').onclick = function(){ lastMain = ''; lastChat = ''; render(); };
    g('tvChatH').onclick = function(){ chatOpen = !chatOpen; g('tvChatBox').style.display = chatOpen ? '' : 'none'; g('tvChatArr').textContent = chatOpen ? '▾' : '▸'; };
    g('tvSend').onclick = sendChat;
    g('tvTxt').onkeydown = function(e){ if (e.key === 'Enter') sendChat(); };
    P.addEventListener('dblclick', function(e){ var x = e.target.closest('.tvM[data-mid]'); if (x) send({ type: 'lbTChatLike', tid: curId, mid: x.getAttribute('data-mid') }); }); /*TVDBL*/
    P.addEventListener('click', function(e){
      var b = e.target.closest('[data-tv]'); if (!b) return;
      var a = b.getAttribute('data-tv');
      if (a === 'join') send({ type: 'lbTJoin', tid: curId });
      else if (a === 'leave') { if (confirm('Turnirdan chiqasizmi?')) send({ type: 'lbTLeave', tid: curId }); }
      else if (a === 'start') send({ type: 'lbTStart', tid: curId });
      else if (a === 'like') send({ type: 'lbTChatLike', tid: curId, mid: b.getAttribute('data-mid') }); /*TVLKC*/
      else if (a === 'watch') { var r = b.getAttribute('data-room'), l = L(); close(); if (l && l.go) l.go(r); }
    });
  }

  function sendChat(){
    var v = g('tvTxt').value.trim(); if (!v || !curId) return;
    send({ type: 'lbTChat', tid: curId, text: v });
    g('tvTxt').value = '';
  }

  function render(){
    if (!P || !curId) return;
    var t = findT(curId);
    if (!t) { g('tvSub').textContent = 'Turnir topilmadi yoki bekor qilingan'; return; }
    var now = Date.now(), ar = t.type === 'arena';
    g('tvSub').textContent =
      t.status === 'reg' ? (t.startAt ? '⏳ Boshlanishiga ' + fmt(t.startAt - now) : '📝 Ro‘yxat ochiq') :
      t.status === 'running' ? (ar ? (t.ending ? '⌛ Yakunlanmoqda' : '🔥 Tugashiga ' + fmt(t.endAt - now)) : '♟ Tur ' + t.round + '/' + t.rounds + (t.nextAt ? ' · keyingisi ' + fmt(t.nextAt - now) : '')) :
      '🏁 Turnir tugagan';
    var sig = JSON.stringify([t.status, t.players, t.boards, t.name, t.ending, meUid()]);
    if (sig !== lastMain) { lastMain = sig; renderMain(t); }
    var cs = JSON.stringify(t.chat || []);
    if (cs !== lastChat) { lastChat = cs; renderChat(t); }
  }

  function renderMain(t){
    var ar = t.type === 'arena';
    g('tvName').textContent = (ar ? '⚔️ ' : t.type === 'olympic' ? '🏆 ' : '♟ ') + t.name;
    var ch = ['🎯 ' + (ar ? 'Arena' : t.type === 'olympic' ? 'Olimpiya' : 'Shveytsar'), '⏱ ' + t.tc, '👥 ' + (t.players || []).length];
    if (t.prize) ch.push('🪙 ' + t.prize + (t.places ? ' (' + t.places + ' o‘ringa)' : ''));
    if (ar && t.berserk) ch.push('⚡ Berserk');
    if (t.startAt && t.status === 'reg') ch.push('🕐 ' + hm(t.startAt));
    if (t.creatorName) ch.push('👤 ' + t.creatorName);
    g('tvInfo').innerHTML = ch.map(function(x){ return '<span class="tvChip">' + esc(x) + '</span>'; }).join('');

    var live = (t.boards || []).filter(function(b){ return !b.done; });
    g('tvLiveN').textContent = live.length ? '(' + live.length + ')' : '';
    g('tvLive').innerHTML = live.length ? live.map(function(b){
      return '<div class="tvG"><span class="lv">● LIVE</span><div class="n">⚪ ' + esc(b.whiteName) + '</div><div class="n">⚫ ' + esc(b.blackName) + '</div><button data-tv="watch" data-room="' + esc(b.roomId) + '">👁 Tomosha</button></div>';
    }).join('') : '<div class="tvEmpty">' + (t.status === 'running' ? 'Hozir jonli o‘yin yo‘q, juftlash kutilmoqda…' : 'O‘yinlar turnir boshlangach shu yerda chiqadi') + '</div>';

    var me = meUid(), M = ['🥇', '🥈', '🥉'], ps = t.players || [];
    var h = '<table class="tvTb"><tr><th>#</th><th>O‘yinchi</th><th class="r">O‘yin</th><th class="r">Ochko</th></tr>';
    ps.slice(0, 100).forEach(function(p, i){
      h += '<tr class="' + (String(p.uid) === me ? 'me' : '') + '"><td>' + (t.status === 'finished' && M[i] ? M[i] : (i + 1) + '.') /*TVRANK*/ + '</td><td>' + esc(p.name) + (p.fire ? ' 🔥' : '') + (p.busy ? ' 🎮' : '') + (p.withdrawn ? ' ⏸' : '') + '</td><td class="r">' + (p.games || 0) + '</td><td class="r sc">' + (p.score || 0) + '</td></tr>';
    });
    g('tvTable').innerHTML = ps.length ? h + '</table>' : '<div class="tvEmpty">Hali ishtirokchi yo‘q</div>';

    var f = '';
    if (t.status === 'finished') { f = '<button class="tvD" disabled>🏁 Turnir tugagan</button>'; try { window.spPod(t); } catch (e) {} }
    else {
      if (t.status === 'reg' && String(t.creatorUid) === me) f += '<button class="tvS" data-tv="start">▶ Boshlash</button>';
      f += joined(t) ? '<button class="tvL" data-tv="leave">🚪 Chiqish</button>' : '<button class="tvJ" data-tv="join">✅ Qo‘shilish</button>';
    }
    g('tvFoot').innerHTML = f;
  }

  function renderChat(t){
    var c = t.chat || [], me = meUid(), box = g('tvMsgs');
    g('tvChatN').textContent = c.length ? '(' + c.length + ')' : '';
    var atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = c.length ? c.map(function(m){
      var mine = String(m.uid) === me;
      var lk = (m.likes || []).map(String), liked = lk.indexOf(me) >= 0; /*TVLKR*/
      return '<div class="tvM' + (mine ? ' me' : '') + '"' + (m.id ? ' data-mid="' + esc(m.id) + '"' : '') + '><b>' + (mine ? 'Siz' : esc(m.name)) + (String(m.uid) === String(t.creatorUid) ? ' 👑' : '') + '</b>' + esc(m.text) + '<small>' + (m.id ? '<span class="tvLk" data-tv="like" data-mid="' + esc(m.id) + '">' + (liked ? '❤️' : '🤍') + (lk.length ? ' ' + lk.length : '') + '</span>' : '<span></span>') + '<span>' + hm(m.at) + '</span></small></div>';
    }).join('') : '<div class="tvEmpty">Hali xabar yo‘q. Birinchi bo‘lib yozing!</div>';
    if (atBottom || !box.__init) { box.scrollTop = box.scrollHeight; box.__init = 1; }
  }

  function open(id){
    build(); curId = String(id); window.__tvCur = curId; lastMain = ''; lastChat = ''; g('tvMsgs').__init = 0;
    P.classList.add('on'); render();
    if (timer) clearInterval(timer); timer = setInterval(render, 1000);
  }
  function close(){
    if (P) P.classList.remove('on'); curId = null;
    if (timer) { clearInterval(timer); timer = null; }
  }
  window.tvOpen = open; window.tvClose = close;

  var pend = false;
  function decorate(){
    pend = false;
    var box = g('lbTs'); if (!box) return;
    var links = box.querySelectorAll('[data-a="tlink"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], id = a.getAttribute('data-id'), card = a.closest('.card');
      if (!card || card.querySelector('.tvRow')) continue;
      var t = findT(id); if (!t) continue;
      var old = card.querySelectorAll('[data-a="tj"],[data-a="tl"]');
      for (var k = 0; k < old.length; k++) old[k].parentNode.removeChild(old[k]);
      var row = document.createElement('div'); row.className = 'tvRow';
      row.innerHTML = (t.status === 'finished' ? '' : (joined(t)
        ? '<button class="tvCL" data-a="tl" data-id="' + esc(id) + '">✅ Qo‘shildingiz</button>'
        : '<button class="tvCJ" data-a="tj" data-id="' + esc(id) + '">➕ Qo‘shilish</button>')) +
        '<button class="tvCE" data-tvopen="1">🏟 Kirish ›</button>';
      card.appendChild(row);
      card.style.cursor = 'pointer';
      (function(tid){
        card.addEventListener('click', function(e){
          if (e.target.closest('[data-tvopen]')) return open(tid);
          if (e.target.closest('button,a,input,select,summary,label')) return;
          open(tid);
        });
      })(id);
    }
  }
  new MutationObserver(function(){ if (!pend) { pend = true; decorate(); } })
    .observe(document.body, { childList: true, subtree: true });
})();
;(function(){
  if (document.getElementById('tvBlue')) return;
  var css =
  "#tvP{color:#eaf2ff!important;background:radial-gradient(circle at 15% 8%,rgba(80,150,255,.22),transparent 40%),radial-gradient(circle at 90% 85%,rgba(40,110,220,.2),transparent 45%),linear-gradient(160deg,#06183a,#0b2a5c 45%,#040f26)!important}" +
  ".tvHead{background:rgba(3,14,36,.92)!important;border-bottom-color:rgba(90,150,255,.3)!important}" +
  ".tvIc{background:rgba(8,30,70,.9)!important;color:#e3eeff!important;border-color:rgba(80,140,240,.5)!important}" +
  ".tvTit small,.tvSh span,.tvSh i,.tvEmpty,.tvTb th{color:#9cc2ff!important}" +
  ".tvChip{background:rgba(20,60,130,.6)!important;border-color:rgba(90,150,255,.35)!important}" +
  ".tvSec{background:linear-gradient(180deg,rgba(11,42,92,.92),rgba(6,24,58,.95))!important;border-color:rgba(90,150,255,.35)!important}" +
  ".tvM{background:rgba(4,18,46,.85)!important;border-color:rgba(80,140,240,.3)!important}" +
  ".tvM.me{background:linear-gradient(180deg,#2f7bf0,#1d57c4)!important;border-color:#6aa6ff!important}" +
  ".tvIn input{background:rgba(4,18,46,.85)!important;color:#eaf2ff!important;border-color:rgba(80,140,240,.5)!important}" +
  ".tvIn button,.tvJ{background:linear-gradient(180deg,#4d95ff,#2563d9)!important}" +
  ".tvJ{box-shadow:0 4px 16px rgba(47,123,240,.45)!important}" +
  ".tvG{background:rgba(4,18,46,.85)!important;border-color:rgba(80,140,240,.4)!important}" +
  ".tvG button{background:rgba(47,123,240,.25)!important;color:#cfe1ff!important;border-color:rgba(106,166,255,.55)!important}" +
  ".tvTb th{border-bottom-color:rgba(90,150,255,.3)!important}" +
  ".tvTb td{border-bottom-color:rgba(90,150,255,.12)!important}" +
  ".tvTb tr.me td{background:rgba(106,166,255,.16)!important}" +
  ".tvFoot{background:linear-gradient(180deg,transparent,rgba(3,12,32,.96) 35%)!important}";
  var s = document.createElement('style'); s.id = 'tvBlue'; s.textContent = css; document.head.appendChild(s);
})();

;(function(){ if (document.getElementById('tvLikeCss')) return; var s = document.createElement('style'); s.id = 'tvLikeCss'; s.textContent = '.tvM small{display:flex!important;justify-content:space-between;align-items:center;gap:10px;margin-top:2px}.tvLk{cursor:pointer;font-size:13px;opacity:1;padding:2px 6px;border-radius:10px;background:rgba(255,255,255,.08);user-select:none}.tvM.me b{color:#dbe9ff!important}'; document.head.appendChild(s); })();

;(function(){
  if (window.__tvRem) return; window.__tvRem = 1;
  function S(){ try { return window.__lb ? window.__lb.S : null; } catch(e){ return null; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(x){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]; }); }
  function me(){ var s = S(); return s && s.me ? String(s.me.uid) : ''; }
  function isIn(t){ var u = me(); return (t.players || []).some(function(p){ return String(p.uid) === u && !p.withdrawn; }); }
  function find(id){ var s = S(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
  function fmt(ms){ ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function hm(ts){ var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  var css =
  "#tvRem{position:fixed;left:10px;right:10px;top:10px;z-index:2147482500;background:linear-gradient(180deg,#0e3170,#081d47);border:1px solid rgba(255,215,106,.6);border-radius:18px;padding:12px 14px;color:#eaf2ff;box-shadow:0 10px 30px rgba(0,0,0,.5);transform:translateY(-150%);transition:transform .35s ease}" +
  "#tvRem.on{transform:translateY(0)}" +
  "#tvRem .rT{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#ffd76a;font-weight:800}" +
  "#tvRem .rX{background:none!important;border:0!important;color:#9cc2ff!important;font-size:16px;min-height:0!important;padding:0 4px!important}" +
  "#tvRem .rN{font-size:17px;font-weight:800;margin:4px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  "#tvRem .rI{font-size:13px;color:#9cc2ff}" +
  "#tvRem .rB{display:flex;gap:8px;margin-top:10px}" +
  "#tvRem .rB button{flex:1;min-height:42px!important;border-radius:12px!important;font-weight:800;border:0!important}" +
  "#tvRem .rJ{background:linear-gradient(180deg,#4d95ff,#2563d9)!important;color:#fff!important}" +
  "#tvRem .rL{background:rgba(255,255,255,.1)!important;color:#dbe9ff!important}";
  var st = document.createElement('style'); st.id = 'tvRemCss'; st.textContent = css; document.head.appendChild(st);

  var shown = {}, box = null, cur = null, hideT = null;
  function hide(){ if (box) box.classList.remove('on'); cur = null; clearTimeout(hideT); }
  function show(t, stage){
    if (!box) {
      box = document.createElement('div'); box.id = 'tvRem'; document.body.appendChild(box);
      box.addEventListener('click', function(e){
        var b = e.target.closest('[data-r]'); if (!b || !cur) return;
        var a = b.getAttribute('data-r'), id = cur.id;
        if (a === 'join') { if (window.__lb) window.__lb.send({ type: 'lbTJoin', tid: id }); hide(); setTimeout(function(){ if (window.tvOpen) window.tvOpen(id); }, 600); }
        else if (a === 'open') { hide(); if (window.tvOpen) window.tvOpen(id); }
        else hide();
      });
    }
    cur = { id: t.id, stage: stage };
    var joined = isIn(t);
    box.innerHTML =
      '<div class="rT">' + (stage === 'm15' ? '⏰ 15 daqiqadan keyin boshlanadi!' : '🏆 Yaqinda turnir') + '<button class="rX" data-r="x">✕</button></div>' +
      '<div class="rN">' + (t.type === 'arena' ? '⚔️ ' : '🏆 ') + esc(t.name) + '</div>' +
      '<div class="rI">🕐 ' + hm(t.startAt) + ' · ⏳ <span id="tvRemL">' + fmt(t.startAt - Date.now()) + '</span> · ⏱ ' + esc(t.tc) + (t.prize ? ' · 🪙 ' + t.prize : '') + ' · 👥 ' + (t.players || []).length + '</div>' +
      '<div class="rB">' + (joined
        ? '<button class="rJ" data-r="open">🏟 Turnirga kirish</button><button class="rL" data-r="x">OK</button>'
        : '<button class="rJ" data-r="join">✅ Qo‘shilish</button><button class="rL" data-r="later">Keyinroq</button>') + '</div>';
    requestAnimationFrame(function(){ box.classList.add('on'); });
    clearTimeout(hideT); hideT = setTimeout(hide, 20000);
  }
  function tick(){
    var s = S(); if (!s || !s.tournaments || !s.me) return;
    if (cur) { var lt = document.getElementById('tvRemL'), ct = find(cur.id); if (lt && ct) lt.textContent = fmt(ct.startAt - Date.now()); return; }
    if (/room|xona/i.test(location.search + location.hash)) return;
    var tvp = document.getElementById('tvP'); if (tvp && tvp.classList.contains('on')) return;
    var now = Date.now();
    var list = s.tournaments.filter(function(t){ return t.status === 'reg' && t.startAt && t.startAt > now; })
      .sort(function(a, b){ return a.startAt - b.startAt; });
    for (var i = 0; i < list.length; i++) {
      var t = list[i], left = t.startAt - now;
      if (left <= 15 * 60000) {
        var k = 'tvRem15_' + t.id;
        if (!shown[k] && !ls(k)) { shown[k] = 1; ls(k, '1'); show(t, 'm15'); return; }
      } else if (!isIn(t)) {
        var k2 = 'enter_' + t.id;
        if (!shown[k2]) { shown[k2] = 1; show(t, 'enter'); return; }
      }
    }
  }
  setInterval(tick, 2000);
})();

;(function(){
  if (window.__tvNavFix) return; window.__tvNavFix = 1;
  var n = 0, iv = setInterval(function(){
    if (window.lbNav && window.lbNav.open && !window.lbNav.__tvw) {
      var o = window.lbNav.open;
      window.lbNav.open = function(tab){
        window.nvK = tab;
        var r = o.apply(this, arguments);
        var h = document.getElementById('hzHero'), b = document.getElementById('nvPlayBtn');
        if (tab !== 'pl') { if (h) h.style.display = 'none'; if (b) b.style.display = 'none'; }
        return r;
      };
      window.lbNav.__tvw = 1; clearInterval(iv);
    } else if (++n > 100) clearInterval(iv);
  }, 100);
})();


;(function(){
  if (window.__tvUi2) return; window.__tvUi2 = 1;
  function St(){ try { return window.__lb ? window.__lb.S : null; } catch(e){ return null; } }
  function findT(id){ var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function me(){ var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }

  var css =
  '#tvChatBtn{position:relative}' +
  '#tvChatBtn b{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;line-height:18px;text-align:center;display:none}' +
  '#tvChatBtn.has b{display:block}' +
  '#tvChatDim{position:absolute;inset:0;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .25s;z-index:5}' +
  '#tvChatDim.on{opacity:1;pointer-events:auto}' +
  '#tvChatSheet{position:absolute;left:0;right:0;bottom:0;height:72%;z-index:6;display:flex;flex-direction:column;background:linear-gradient(180deg,#0b2a5c,#061634);border-top:1px solid rgba(90,150,255,.45);border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.5);transform:translateY(105%);transition:transform .28s ease}' +
  '#tvChatSheet.on{transform:translateY(0)}' +
  '#tvChatSheet .shH{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;font-weight:800;font-size:17px}' +
  '#tvChatSheet .shH:before{content:"";position:absolute;left:50%;top:6px;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:rgba(255,255,255,.25)}' +
  '#tvChatSheet .shX{background:none!important;border:0!important;color:#9cc2ff!important;font-size:20px;min-height:0!important;padding:0 4px!important}' +
  '#tvChatSheet .tvSec{flex:1;display:flex;flex-direction:column;margin:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;padding:0 14px calc(14px + env(safe-area-inset-bottom))!important;min-height:0}' +
  '#tvChatSheet #tvChatH{display:none!important}' +
  '#tvChatSheet #tvChatBox{display:flex!important;flex-direction:column;flex:1;min-height:0}' +
  '#tvChatSheet #tvMsgs{flex:1;max-height:none!important;min-height:0}';
  var st = document.createElement('style'); st.id = 'tvUi2Css'; st.textContent = css; document.head.appendChild(st);

  var sheet = null, dim = null, btn = null;
  function seenKey(){ return 'tvSeen_' + window.__tvCur; }
  function setup(){
    var P = document.getElementById('tvP'); if (!P) return false;
    var head = P.querySelector('.tvHead'), ref = document.getElementById('tvRef'), chatH = document.getElementById('tvChatH');
    if (!head || !chatH) return false;
    if (!btn) {
      btn = document.createElement('button'); btn.id = 'tvChatBtn'; btn.className = 'tvIc'; btn.type = 'button'; btn.title = 'Chat';
      btn.innerHTML = '💬<b></b>';
      head.insertBefore(btn, ref || null);
      btn.onclick = function(){ openChat(); };
    }
    if (!sheet) {
      dim = document.createElement('div'); dim.id = 'tvChatDim'; P.appendChild(dim);
      sheet = document.createElement('div'); sheet.id = 'tvChatSheet';
      sheet.innerHTML = '<div class="shH"><span>💬 Turnir chati</span><button class="shX" type="button">✕</button></div>';
      P.appendChild(sheet);
      sheet.appendChild(chatH.closest('.tvSec'));
      dim.onclick = closeChat; sheet.querySelector('.shX').onclick = closeChat;
    }
    return true;
  }
  function lastAt(t){ var c = t.chat || [], u = me(), n = 0, mx = 0; for (var i = 0; i < c.length; i++) { if (c[i].at > mx) mx = c[i].at; } return mx; }
  function openChat(){
    if (!sheet) return;
    sheet.classList.add('on'); dim.classList.add('on');
    var t = findT(window.__tvCur); if (t) ls(seenKey(), String(lastAt(t)));
    var m = document.getElementById('tvMsgs'); if (m) setTimeout(function(){ m.scrollTop = m.scrollHeight; }, 50);
    upd();
  }
  function closeChat(){ if (sheet) { sheet.classList.remove('on'); dim.classList.remove('on'); } upd(); }
  function upd(){
    var P = document.getElementById('tvP');
    if (!P || !P.classList.contains('on')) { if (sheet && sheet.classList.contains('on')) closeChat(); return; }
    if (!setup()) return;
    var t = findT(window.__tvCur); if (!t) return;
    // Live faqat turnir ketayotganda
    var lv = document.getElementById('tvLive'), sec = lv && lv.closest('.tvSec');
    if (sec) sec.style.display = t.status === 'running' ? '' : 'none';
    // o'qilmagan xabarlar
    if (sheet.classList.contains('on')) ls(seenKey(), String(lastAt(t)));
    var seen = Number(ls(seenKey()) || 0), u = me(), n = 0, c = t.chat || [];
    for (var i = 0; i < c.length; i++) if (c[i].at > seen && String(c[i].uid) !== u) n++;
    var b = btn.querySelector('b'); b.textContent = n > 9 ? '9+' : String(n);
    btn.classList.toggle('has', n > 0);
  }
  setInterval(upd, 700);
})();

;(function(){
  if (window.__tvTheme) return; window.__tvTheme = 1;
  var BG = '#1a1650', CARD = '#2a2470', DEEP = '#141040', BTN = '#352d86', LINE = '#4a42a0',
      SH = '0 3px 0 #0e0b30', TX = '#ffffff', MU = '#bababa', GR = '#81b64c', GRS = '0 4px 0 #45753c';
  var O = 'html body #lbPanel.lbTMode ', I = 'html body #tvP ';
  var css =
  // ---------- tashqari: turnirlar ro'yxati va yaratish formasi ----------
  O.trim() + '{background:' + BG + '!important}' +
  O + 'h2{color:' + TX + '!important;text-shadow:none!important}' +
  O + '#lbT>.card,' + O + '#lbTs .card,' + O + '.lbhb,' + O + '#lbHero>div>div{background:' + CARD + '!important;border:0!important;box-shadow:' + SH + '!important;border-radius:14px!important}' +
  O + '#lbT .muted,' + O + '#lbTs .muted{color:' + MU + '!important}' +
  O + '#lbT input:not([type=checkbox]),' + O + '#lbT select{background-color:' + DEEP + '!important;color:' + TX + '!important;border:1px solid ' + LINE + '!important;box-shadow:none!important}' +
  O + '#lbT select{background-image:url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path d=\'M6 9l6 6 6-6\' stroke=\'%23bababa\' stroke-width=\'2.5\' fill=\'none\' stroke-linecap=\'round\'/></svg>")!important}' +
  O + '#lbT input:focus,' + O + '#lbT select:focus{border-color:' + GR + '!important;box-shadow:0 0 0 2px rgba(129,182,76,.25)!important}' +
  O + '#lbTCreate,' + O + '.tvCJ{background:' + GR + '!important;color:#fff!important;border:0!important;box-shadow:' + GRS + '!important}' +
  O + '.sec,' + O + '.tvCE,' + O + '#lbTbar button{background:' + BTN + '!important;color:' + TX + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  O + '#lbTbar button.on,' + O + '#lbTbar button.act,' + O + '#lbTbar button.active{background:' + GR + '!important;box-shadow:' + GRS + '!important}' +
  O + '.tvCL{background:#b33430!important;color:#fff!important;border:0!important;box-shadow:0 4px 0 #7a201d!important}' +
  O + '#lbTclS,' + O + '#lbTinfo{background:' + DEEP + '!important;border:1px solid ' + LINE + '!important;color:' + MU + '!important}' +
  O + '#lbTbzr label{color:' + TX + '!important}' +
  O + '#lbTbzr,' + O + '#lbTpzc{border-bottom-color:' + LINE + '!important}' +
  O + '#lbTpzc{color:' + MU + '!important}' +
  O + 'input[type=checkbox]{accent-color:' + GR + '!important}' +
  O + '#tvClubBtn.on{box-shadow:inset 0 0 0 2px ' + GR + '!important}' +
  // ---------- ichkari: turnir sahifasi ----------
  I.trim() + '{background:' + BG + '!important;color:' + TX + '!important}' +
  I + '.tvHead{background:' + DEEP + '!important;border-bottom:1px solid ' + BTN + '!important}' +
  I + '.tvIc{background:' + BTN + '!important;color:' + TX + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  I + '.tvTit b{color:' + TX + '!important}' +
  I + '.tvTit small,' + I + '.tvSh span,' + I + '.tvSh i,' + I + '.tvEmpty,' + I + '.tvTb th{color:' + MU + '!important}' +
  I + '.tvChip{background:' + BTN + '!important;border:0!important;color:#e8e6e3!important}' +
  I + '.tvSec:not(#tvPodium){background:' + CARD + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  I + '.tvTb th{border-bottom-color:' + LINE + '!important}' +
  I + '.tvTb td{border-bottom-color:' + BTN + '!important}' +
  I + '.tvTb tr.me td{background:rgba(129,182,76,.16)!important}' +
  I + '.tvTb .sc{color:' + TX + '!important}' +
  I + '.tvM{background:' + DEEP + '!important;border:0!important}' +
  I + '.tvM b{color:' + GR + '!important}' +
  I + '.tvM.me{background:#4e7a32!important;border:0!important}' +
  I + '.tvM.me b{color:#e3f2d4!important}' +
  I + '.tvIn input{background:' + DEEP + '!important;color:' + TX + '!important;border:1px solid ' + LINE + '!important}' +
  I + '.tvIn button,' + I + '.tvJ,' + I + '.tvS{background:' + GR + '!important;color:#fff!important;box-shadow:' + GRS + '!important}' +
  I + '.tvL{background:#b33430!important;box-shadow:0 4px 0 #7a201d!important}' +
  I + '.tvD{background:' + BTN + '!important;color:' + MU + '!important}' +
  I + '.tvG{background:' + DEEP + '!important;border:0!important}' +
  I + '.tvG button{background:' + BTN + '!important;color:' + TX + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  I + '.tvFoot{background:linear-gradient(180deg,transparent,' + BG + ' 35%)!important}' +
  I + '#tvChatSheet{background:' + CARD + '!important;border-top:0!important}' +
  I + '#tvChatSheet .shX{color:' + MU + '!important}' +
  'html body #tvRem{background:' + CARD + '!important;border:0!important;box-shadow:0 10px 30px rgba(0,0,0,.6)!important}' +
  'html body #tvRem .rT{color:' + GR + '!important}' +
  'html body #tvRem .rI,html body #tvRem .rX{color:' + MU + '!important}' +
  'html body #tvRem .rJ{background:' + GR + '!important;box-shadow:' + GRS + '!important}' +
  'html body #tvRem .rL{background:' + BTN + '!important;color:' + TX + '!important}';
  var st = document.createElement('style'); st.id = 'tvThemeCss'; st.textContent = css;
  (document.body || document.head).appendChild(st);
})();
;(function(){
  if (window.__tvClub3) return; window.__tvClub3 = 1;
  var s = document.createElement('style');
  s.textContent = '#lbClubBn{display:none!important}' +
    '#tvClub3{position:fixed;z-index:2147480000;display:none;align-items:center;justify-content:center;border:0;border-radius:14px;background:#352d86;color:#fff;font-size:22px;box-shadow:0 3px 0 #0e0b30;padding:0;min-height:0;margin:0}' +
    '#tvClub3.on{background:#81b64c;box-shadow:0 4px 0 #45753c}';
  document.body.appendChild(s);
  var b = document.createElement('button'); b.id = 'tvClub3'; b.type = 'button'; b.textContent = '👥'; b.title = 'Klublar';
  document.body.appendChild(b);
  function ref(){
    var bar = document.getElementById('lbTbar'); if (!bar) return null;
    var bs = bar.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (bs[i].textContent.indexOf('🔄') >= 0) return bs[i];
    return null;
  }
  function place(){
    var r = ref(), p = document.getElementById('lbPanel'), tv = document.getElementById('tvP');
    var ok = !!(r && p && p.style.display !== 'none' && p.classList.contains('lbTMode') && !(tv && tv.classList.contains('on')));
    if (ok) {
      if (r.style.display === 'none') r.style.display = '';
      if (r.style.visibility !== 'hidden') r.style.visibility = 'hidden';
      var q = r.getBoundingClientRect(); ok = q.width > 0 && q.height > 0;
      if (ok) { b.style.left = q.left + 'px'; b.style.top = q.top + 'px'; b.style.width = q.width + 'px'; b.style.height = q.height + 'px'; }
    }
    b.style.display = ok ? 'flex' : 'none';
    b.classList.toggle('on', !!window.__lbCO);
  }
  b.onclick = function(){
    window.__lbCO = !window.__lbCO;
    if (window.lbClubFix) window.lbClubFix();
    place();
    if (window.__lbCO) setTimeout(function(){
      var all = document.querySelectorAll('.lbcl');
      for (var i = 0; i < all.length; i++) if (all[i].offsetParent) { all[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
    }, 120);
  };
  setInterval(place, 150);
  window.addEventListener('scroll', place, true);
})();
;(function(){
  if (window.__tvLink) return; window.__tvLink = 1;
  var st = document.createElement('style'); st.id = 'tvLinkCss';
  st.textContent = '#tvP{z-index:2147483000!important}#tvRem{z-index:2147483100!important}';
  document.head.appendChild(st);
  function inRoom(){ return !!document.getElementById('lbBack'); }
  var sp = window.__tvLinkTid ? 'lbt_' + window.__tvLinkTid : '';
  try { if (!sp) sp = (Telegram.WebApp.initDataUnsafe || {}).start_param || ''; } catch(e){}
  try { if (!sp) sp = new URLSearchParams(Telegram.WebApp.initData || '').get('start_param') || ''; } catch(e){}
  if (!/^lbt_/.test(sp)) return;
  if (/[?&]room=/.test(location.search)) return; // o'yin xonasiga o'tilgan - turnir sahifasini ochmaymiz
  var tid = sp.slice(4), key = 'tvLinkDone_' + tid;
  try { if (sessionStorage.getItem(key)) return; } catch(e){}
  function findT(){ try { var s = window.__lb && window.__lb.S; if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === tid) return s.tournaments[i]; } catch(e){} return null; }
  var fromLink = false, n = 0;
  var iv = setInterval(function(){
    n++;
    if (inRoom()) { clearInterval(iv); try { sessionStorage.setItem(key, '1'); } catch(e){} return; }
    if (n < 3) return;
    if (findT() && window.tvOpen) {
      clearInterval(iv);
      try { sessionStorage.setItem(key, '1'); } catch(e){}
      fromLink = true; window.tvOpen(tid);
      var p = document.getElementById('tvP');
      if (p) new MutationObserver(function(){
        if (fromLink && !p.classList.contains('on')) { fromLink = false; if (!inRoom() && window.lbNav) window.lbNav.open('t'); }
      }).observe(p, { attributes: true, attributeFilter: ['class'] });
    } else if (n > 60) clearInterval(iv);
  }, 500);
})();
;(function(){
  if (window.__tvRoomGuard) return; window.__tvRoomGuard = 1;
  setInterval(function(){
    if (!document.getElementById('lbBack')) return;
    var p = document.getElementById('tvP');
    if (p && p.classList.contains('on') && window.tvClose) window.tvClose();
    var r = document.getElementById('tvRem'); if (r) r.classList.remove('on');
  }, 300);
})();

/*TVIEW-END*/

/* ===== spBg: fon tanlash (kunduzgi / kechki / o'z rangi / o'z rasmi) ===== */
;(function () {
  if (window.spBgInit2) return; window.spBgInit2 = true;
  var STARS = "radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 42%,#fff,transparent),radial-gradient(1.5px 1.5px at 46% 12%,#fff,transparent),radial-gradient(1px 1px at 63% 33%,#fff,transparent),radial-gradient(2px 2px at 81% 16%,#fff,transparent),radial-gradient(1px 1px at 90% 48%,#fff,transparent),radial-gradient(1px 1px at 8% 62%,#fff,transparent),radial-gradient(1.5px 1.5px at 37% 72%,#fff,transparent),radial-gradient(1px 1px at 72% 66%,#fff,transparent),radial-gradient(1px 1px at 55% 88%,#fff,transparent),";
  var BG = [
    ["auto", "🔄 Avto", "", 0],
    ["day", "☀️ Kunduzgi osmon", "linear-gradient(180deg,#0f3d7a 0%,#1f62b0 50%,#3a86cf 100%)", 0],
    ["dawn", "🌅 Tong", "linear-gradient(180deg,#3b2c7a 0%,#8a3f78 55%,#b8606a 100%)", 0],
    ["sunset", "🌇 Quyosh botishi", "linear-gradient(180deg,#2b1055 0%,#a3375c 50%,#f28c38 100%)", 0],
    ["evening", "🌆 Kechki", "linear-gradient(180deg,#141e46 0%,#2e3b8f 55%,#6a4c9c 100%)", 0],
    ["night", "🌙 Tungi yulduzli", STARS + "radial-gradient(circle at 80% 10%,rgba(255,255,220,.35),transparent 18%),linear-gradient(180deg,#05081f 0%,#0d1440 60%,#1b1a4f 100%)", 0],
    ["purple", "💜 Binafsha", "linear-gradient(180deg,#1a1650 0%,#3a2a8a 55%,#4a2a9a 100%)", 0],
    ["samarqand", "🕌 Samarqand ko‘k", "linear-gradient(180deg,#073b4c 0%,#0f6e8c 50%,#1fa3b5 100%)", 0],
    ["garden", "🌿 Bog‘", "linear-gradient(180deg,#0b3d2e 0%,#1d6b45 55%,#4f9a5a 100%)", 0],
    ["color", "🎨 O‘z rangim", "", 0],
    ["photo", "🖼 O‘z rasmim", "", 0]
  ];
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return ""; } }
  function lum(hex) { var n = parseInt(String(hex).replace("#", ""), 16); if (isNaN(n)) return 0; return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  function resolve() {
    var id = ls("spBg");
    if (!id) return null;
    if (id === "auto") { var h = new Date().getHours(); id = (h >= 6 && h < 18) ? "day" : "night"; }
    if (id === "color") { var c = ls("spBgColor") || "#1a1650"; return { css: lum(c) > 0.5 ? "linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))," + c : c, light: false }; }
    if (id === "photo") { var u = ls("spBgImg"); return u ? { css: 'linear-gradient(rgba(10,8,40,.45),rgba(10,8,40,.45)),url("' + u + '") center/cover no-repeat', light: false } : null; }
    for (var i = 0; i < BG.length; i++) if (BG[i][0] === id && BG[i][2]) return { css: BG[i][2], light: !!BG[i][3] };
    return null;
  }
  function sweep(on) {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!on) { Array.prototype.forEach.call(document.querySelectorAll("[data-spbg]"), function (el) { el.style.removeProperty("background"); el.removeAttribute("data-spbg"); }); return; }
    var all = document.body ? document.body.getElementsByTagName("*") : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.hasAttribute("data-spbg") || el.id === "spBgSheet" || el.id === "spSetSheet" || el.id === "tvP") continue;
      if (el.tagName === "CANVAS" || el.tagName === "IMG" || el.tagName === "SVG") continue;
      var r = el.getBoundingClientRect();
      if (r.width < vw * 0.9 || r.height < vh * 0.6) continue;
      if (el.closest && el.closest("#spBgSheet,#spSetSheet")) continue;
      var cs = getComputedStyle(el);
      if ((parseFloat(cs.borderTopLeftRadius) || 0) > 6) continue;
      var m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/), a = 0;
      if (m) { var p = m[1].split(","); a = p.length > 3 ? parseFloat(p[3]) : 1; }
      if (a >= 0.85 || cs.backgroundImage !== "none") { el.setAttribute("data-spbg", "1"); el.style.setProperty("background", "transparent", "important"); }
    }
  }
  function apply() {
    var b = resolve(), st = document.getElementById("spBgCss");
    if (!b) { if (st) st.remove(); sweep(false); if (document.body) document.body.classList.remove("spLight"); return; }
    if (!st) { st = document.createElement("style"); st.id = "spBgCss"; document.head.appendChild(st); }
    st.textContent = "html body.nvT{background:" + b.css + " !important;background-attachment:fixed !important;background-size:cover !important;min-height:100vh}html body div#tvP#tvP{background:" + b.css + " !important;background-attachment:fixed !important;background-size:cover !important}" +
      "html body div#tvP#tvP .tvHead{background:rgba(8,6,32,.55)!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}html body div#tvP#tvP #tvTabs{background:transparent!important}html body div#tvP#tvP .tvFoot{background:linear-gradient(180deg,transparent,rgba(8,6,32,.75) 45%)!important}html body div#tvP#tvP .tvSec:not(.spPdW){background:rgba(42,36,112,.82)!important}" +
      "body.spLight,body.spLight *{text-shadow:0 0 2px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.55)}";
    document.body.classList.remove("spLight");
    sweep(document.body.classList.contains("nvT"));
  }
  function pickColor(done) {
    var i = document.createElement("input"); i.type = "color"; i.value = ls("spBgColor") || "#1a1650";
    i.style.cssText = "position:fixed;left:-100px;top:0;opacity:0"; document.body.appendChild(i);
    i.oninput = i.onchange = function () { ls("spBgColor", i.value); ls("spBg", "color"); apply(); };
    i.onblur = function () { setTimeout(function () { i.remove(); }, 300); };
    i.click(); done();
  }
  function pickPhoto(done) {
    var i = document.createElement("input"); i.type = "file"; i.accept = "image/*";
    i.style.cssText = "position:fixed;left:-100px;top:0;opacity:0"; document.body.appendChild(i);
    i.onchange = function () {
      var f = i.files && i.files[0]; i.remove(); if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image();
        im.onload = function () {
          var W = 1080, sc = Math.min(1, W / im.width), cv = document.createElement("canvas");
          cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
          cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
          var q = 0.82, u = cv.toDataURL("image/jpeg", q);
          while (u.length > 1500000 && q > 0.4) { q -= 0.1; u = cv.toDataURL("image/jpeg", q); }
          try { localStorage.setItem("spBgImg", u); ls("spBg", "photo"); apply(); } catch (e) { alert("Rasm juda katta, boshqa rasm tanlang"); }
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    i.click(); done();
  }
  function picker() {
    var old = document.getElementById("spBgSheet"); if (old) { old.remove(); return; }
    var ov = document.createElement("div"); ov.id = "spBgSheet";
    ov.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end";
    var cur = ls("spBg") || "", h = '<div style="width:100%;max-height:85vh;overflow:auto;background:#141040;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:system-ui,sans-serif;text-shadow:none">' +
      '<div style="display:flex;align-items:center;margin-bottom:12px"><b style="font-size:19px">🎨 Fon tanlash</b><span id="spBgOff" style="margin-left:auto;font-size:13px;opacity:.75;text-decoration:underline;padding:4px 8px">↺ Standart</span><span id="spBgX" style="font-size:24px;padding:4px 8px">✕</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
    BG.forEach(function (b) {
      var prev = b[0] === "auto" ? "linear-gradient(135deg,#62b2f5 0 50%,#0d1440 50% 100%)" :
        b[0] === "color" ? (ls("spBgColor") ? ls("spBgColor") : "conic-gradient(#f44,#fd4,#4d4,#4df,#44f,#f4f,#f44)") :
        b[0] === "photo" ? (ls("spBgImg") ? "url('" + ls("spBgImg") + "') center/cover no-repeat" : "linear-gradient(135deg,#3a2a8a,#1f62b0)") : b[2];
      h += '<div data-bg="' + b[0] + '" style="cursor:pointer;text-align:center;font-size:12px">' +
        '<div style="height:70px;border-radius:12px;background:' + prev + ';border:3px solid ' + (b[0] === cur ? "#4c8dff" : "rgba(255,255,255,.15)") + ';display:flex;align-items:center;justify-content:center;font-size:24px;position:relative;overflow:hidden">' + (b[0] !== "photo" ? "" : ls("spBgImg")
          ? '<span style="position:absolute;right:5px;bottom:5px;font-size:12px;font-weight:700;background:rgba(0,0,0,.65);border-radius:8px;padding:3px 7px">📷 Almashtirish</span>'
          : '<span style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;font-weight:700"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/><path d="M18 2v5M15.5 4.5h5"/></svg>Rasm yuklash</span>') + '</div>' +
        '<div style="margin-top:5px;opacity:.9">' + b[1] + '</div></div>';
    });
    ov.innerHTML = h + '</div></div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); }
    ov.onclick = function (e) { if (e.target === ov || e.target.id === "spBgX") close(); };
    ov.querySelector("#spBgOff").onclick = function () { ls("spBg", null); apply(); close(); };
    Array.prototype.forEach.call(ov.querySelectorAll("[data-bg]"), function (el) {
      el.onclick = function () {
        var id = el.getAttribute("data-bg");
        if (id === "color") return pickColor(close);
        if (id === "photo") return pickPhoto(close);
        ls("spBg", id); apply(); close();
      };
    });
  }
  window.spBgPicker = picker;
  function boot() {
    if (!document.body) return setTimeout(boot, 50);
    var old = document.getElementById("spBgBtn"); if (old) old.remove();
    apply();
    setInterval(function () { if (resolve()) { if (ls("spBg") === "auto") apply(); else sweep(document.body.classList.contains("nvT")); } else sweep(false); }, 1500);
  }
  boot();
})();

/* ===== turnir o'yinidan keyin turnir oynasiga qaytish ===== */
;(function () {
  var tid; try { tid = sessionStorage.getItem("spOpenT"); if (tid) sessionStorage.removeItem("spOpenT"); } catch (e) {}
  if (!tid || /[?&]room=|startapp=/.test(location.search)) return;
  var k = 0, iv = setInterval(function () {
    if (window.tvOpen && window.__lb) { clearInterval(iv); setTimeout(function () { try { window.tvOpen(tid); } catch (e) {} }, 700); }
    else if (++k > 60) clearInterval(iv);
  }, 250);
})();

/* TVTABS — turnir sahifasida 3 ta tab: Juftliklar · Jadval · LIVE (jonli doskalar) */
;(function(){
  if (window.__tvTabs) return; window.__tvTabs = 1;
  function St(){ try { return window.__lb ? window.__lb.S : null; } catch(e){ return null; } }
  function findT(id){ var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function me(){ var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(x){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]; }); }
  function g(id){ return document.getElementById(id); }
  function fmtC(ms){ ms = Math.max(0, ms); var s = Math.ceil(ms / 1000), m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }

  var BG = '#1a1650', CARD = '#2a2470', DEEP = '#141040', BTN = '#352d86', LINE = '#4a42a0', GR = '#81b64c', MU = '#bababa';
  var css =
  '#tvTabs{position:sticky;top:0;z-index:3;display:flex;gap:6px;margin:0 -12px 12px;padding:8px 12px;background:' + BG + '}' +
  '#tvTabs button{flex:1;min-width:0;min-height:44px!important;padding:0 6px!important;border-radius:12px!important;background:' + CARD + '!important;color:' + MU + '!important;border:2px solid transparent!important;box-shadow:0 3px 0 #0e0b30!important;font-weight:800;font-size:13px;letter-spacing:.3px;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}' +
  '#tvTabs button.on{color:#fff!important;border-color:' + GR + '!important;background:' + BTN + '!important}' +
  '#tvTabs button i{font-style:normal;font-size:11px;background:' + DEEP + ';border-radius:999px;padding:2px 7px;color:#fff}' +
  '#tvTabs button.on i{background:' + GR + '}' +
  '#tvTabs .dot{width:8px;height:8px;border-radius:50%;background:#ff4d4d;box-shadow:0 0 0 0 rgba(255,77,77,.7);animation:tvPulse 1.6s infinite}' +
  '@keyframes tvPulse{0%{box-shadow:0 0 0 0 rgba(255,77,77,.7)}70%{box-shadow:0 0 0 7px rgba(255,77,77,0)}100%{box-shadow:0 0 0 0 rgba(255,77,77,0)}}' +
  '#tvBody .tvOldLive{display:none!important}' +
  '#tvBody[data-tab="p"] .tvPaneT,#tvBody[data-tab="p"] .tvPaneL{display:none!important}' +
  '#tvBody[data-tab="t"] .tvPaneP,#tvBody[data-tab="t"] .tvPaneL{display:none!important}' +
  '#tvBody[data-tab="l"] .tvPaneP,#tvBody[data-tab="l"] .tvPaneT{display:none!important}' +
  '.tvPr{display:flex;align-items:center;gap:10px;background:' + DEEP + ';border-radius:12px;padding:8px 10px;margin-bottom:8px}' +
  '.tvPr .no{width:22px;text-align:center;color:' + MU + ';font-weight:700;font-size:13px;flex:none}' +
  '.tvPr .pl{flex:1;min-width:0}' +
  '.tvPr .pn{display:flex;align-items:center;gap:6px;font-size:14px;padding:3px 0;min-width:0}' +
  '.tvPr .pn+.pn{border-top:1px solid ' + BTN + '}' +
  '.tvPr .pn span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.tvPr .pn small{color:' + MU + ';font-size:12px;flex:none}' +
  '.tvPr .pn.me span{color:' + GR + ';font-weight:700}' +
  '.tvPr .w{flex:none;font-size:11px;font-weight:800;background:#f5c542;color:#1a1205;border-radius:6px;padding:1px 6px}' +
  '.tvPr .rs{flex:none;font-size:12px;font-weight:800;border-radius:8px;padding:5px 9px}' +
  '.tvPr .rs.d{background:rgba(245,197,66,.15);color:#f5c542}' +
  '.tvPr button.rs{min-height:0!important;background:' + BTN + '!important;color:#fff!important;border:0!important;box-shadow:0 3px 0 #0e0b30!important}' +
  '.tvPh{color:' + MU + ';font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin:4px 2px 8px}' +
  '.tvLg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}' +
  '.tvLc{background:' + DEEP + ';border-radius:12px;padding:6px;cursor:pointer;position:relative}' +
  '.tvLc .ln{display:flex;align-items:center;gap:4px;font-size:12px;padding:3px 2px;min-width:0}' +
  '.tvLc .ln span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.tvLc .ln b{flex:none;font-variant-numeric:tabular-nums;font-size:12px;background:' + BTN + ';border-radius:5px;padding:1px 5px;color:' + MU + '}' +
  '.tvLc .ln b.run{background:#fff;color:#141040}' +
  '.tvLc .ln b.low{background:#e04a4a;color:#fff}' +
  '.tvMb{display:grid;grid-template-columns:repeat(8,1fr);aspect-ratio:1;border-radius:6px;overflow:hidden;border:2px solid #302217}' +
  '.tvMb div{position:relative}' +
  '.tvMb .lt{background:#f0d9b5}.tvMb .dk{background:#b58863}.tvMb .dk.hl{background:#c9a23f}' +
  '.tvMb .pc{position:absolute;inset:12%;border-radius:50%}' +
  '.tvMb .pw{background:radial-gradient(circle at 35% 30%,#fff,#d9d9d9);box-shadow:0 1px 1px rgba(0,0,0,.5)}' +
  '.tvMb .pb{background:radial-gradient(circle at 35% 30%,#555,#111);box-shadow:0 1px 1px rgba(0,0,0,.5)}' +
  '.tvMb .kg:after{content:"";position:absolute;inset:28%;border-radius:50%;border:2px solid #f5c542}' +
  '.tvLc .sp{position:absolute;top:8px;right:8px;font-size:10px;font-weight:800;color:#fff;background:#e04a4a;border-radius:5px;padding:1px 5px;opacity:.95}' +
  '.tvLe{color:' + MU + ';font-size:13px;padding:6px 2px}';
  var st = document.createElement('style'); st.id = 'tvTabsCss'; st.textContent = css; document.head.appendChild(st);

  var tab = null, tabFor = null, lastP = '', lastL = '';
  function key(){ return 'tvTab_' + window.__tvCur; }

  function setup(){
    var body = g('tvBody'), info = g('tvInfo'), tb = g('tvTable'), lv = g('tvLive'), pod = g('tvPod');
    if (!body || !info || !tb) return false;
    if (g('tvTabs')) return true;
    var bar = document.createElement('div'); bar.id = 'tvTabs';
    bar.innerHTML = '<button data-tab="p">📋 Juftliklar <i id="tvTabPn">0</i></button><button data-tab="t">🏅 Jadval</button><button data-tab="l"><span class="dot" id="tvTabDot"></span>LIVE <i id="tvTabLn">0</i></button>';
    info.parentNode.insertBefore(bar, info.nextSibling);
    var ps = document.createElement('div'); ps.className = 'tvSec tvPaneP'; ps.innerHTML = '<div id="tvPairs"></div>';
    var ls = document.createElement('div'); ls.className = 'tvSec tvPaneL'; ls.innerHTML = '<div id="tvLiveB"></div>';
    bar.parentNode.insertBefore(ls, bar.nextSibling);
    bar.parentNode.insertBefore(ps, bar.nextSibling);
    tb.closest('.tvSec').classList.add('tvPaneT');
    if (pod) pod.classList.add('tvPaneT');
    if (lv && lv.closest('.tvSec')) lv.closest('.tvSec').classList.add('tvOldLive');
    bar.addEventListener('click', function(e){
      var b = e.target.closest('[data-tab]'); if (!b) return;
      setTab(b.getAttribute('data-tab'), true);
    });
    var P = g('tvP');
    P.addEventListener('click', function(e){
      var c = e.target.closest('.tvLc[data-room]'); if (!c || e.target.closest('[data-tv]')) return;
      var w = document.createElement('button'); w.setAttribute('data-tv', 'watch'); w.setAttribute('data-room', c.getAttribute('data-room')); w.style.display = 'none';
      c.appendChild(w); w.click(); c.removeChild(w);
    });
    return true;
  }

  function setTab(k, save){
    tab = k;
    var body = g('tvBody'); if (body) body.setAttribute('data-tab', k);
    var bs = document.querySelectorAll('#tvTabs [data-tab]');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', bs[i].getAttribute('data-tab') === k);
    if (save) { try { sessionStorage.setItem(key(), k); } catch(e){} }
    if (k === 'l') peek();
  }

  function liveBoards(t){ return (t.boards || []).filter(function(b){ return !b.done; }); }

  function renderPairs(t){
    var pm = {}, ps = t.players || [], u = me();
    ps.forEach(function(p){ pm[String(p.uid)] = p; });
    function line(uid, name, won){
      var p = pm[String(uid)], sc = p ? (p.score || 0) : '';
      return '<div class="pn' + (String(uid) === u ? ' me' : '') + '"><span>' + esc(name) + '</span>' + (sc !== '' ? '<small>' + sc + '</small>' : '') + (won ? '<em class="w" style="font-style:normal">yutdi</em>' : '') + '</div>';
    }
    function row(no, b, live){
      var res = live
        ? '<button class="rs" data-tv="watch" data-room="' + esc(b.roomId) + '">👁 Kuzatish</button>'
        : (b.winner === 'draw' || (!b.winner && b.done) ? '<span class="rs d">Durang</span>' : '');
      return '<div class="tvPr"><div class="no">' + no + '</div><div class="pl">' +
        line(b.white, '⚪ ' + b.whiteName, !live && b.winner === 'white') +
        line(b.black, '⚫ ' + b.blackName, !live && b.winner === 'black') + '</div>' + res + '</div>';
    }
    var h = '', bs = t.boards || [], ar = t.type === 'arena';
    if (ar) {
      var lv = liveBoards(t), hs = (t.hist || []).slice().reverse();
      if (lv.length) { h += '<div class="tvPh">🔴 Hozir o‘ynalmoqda</div>'; lv.forEach(function(b, i){ h += row(i + 1, b, true); }); }
      if (hs.length) { h += '<div class="tvPh">🏁 Tugagan o‘yinlar</div>'; hs.forEach(function(b, i){ h += row(i + 1, b, false); }); }
    } else {
      if (bs.length) h += '<div class="tvPh">♟ ' + (t.round || 1) + '-tur juftliklari</div>';
      bs.forEach(function(b, i){ h += row(b.board || i + 1, b, !b.done); });
      if (t.bye) { var bp = pm[String(t.bye)]; h += '<div class="tvPr"><div class="no">—</div><div class="pl">' + line(t.bye, (bp ? bp.name : '?')) + '</div><span class="rs d">Bo‘sh (+1)</span></div>'; }
    }
    if (!h) h = '<div class="tvLe">' + (t.status === 'reg' ? 'Juftliklar turnir boshlangach shu yerda chiqadi' : t.status === 'finished' ? 'Turnir tugagan' : 'Juftlash kutilmoqda…') + '</div>';
    g('tvPairs').innerHTML = h;
    var n = ar ? liveBoards(t).length + (t.hist || []).length : bs.length;
    g('tvTabPn').textContent = n;
  }

  // ---------- LIVE: jonli doskalar ----------
  var ws = null, peekData = {}, peekAt = 0, boardCache = {};
  function conn(){
    if (ws) return;
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host); } catch(e){ ws = null; return; }
    ws.onopen = peek;
    ws.onmessage = function(ev){
      var m; try { m = JSON.parse(ev.data); } catch(e){ return; }
      if (!m || m.type !== 'roomPeek') return;
      peekAt = Date.now(); peekData = {};
      (m.games || []).forEach(function(x){ peekData[x.id] = x; });
      lastL = ''; renderLive();
    };
    ws.onclose = function(){ ws = null; };
  }
  function drop(){ try { if (ws) ws.close(); } catch(e){} ws = null; }
  function peek(){
    var t = findT(window.__tvCur); if (!t) return;
    var ids = liveBoards(t).map(function(b){ return b.roomId; });
    if (!ids.length) { peekData = {}; return; }
    if (!ws) return conn();
    if (ws.readyState === 1) { try { ws.send(JSON.stringify({ type: 'roomPeek', ids: ids })); } catch(e){} }
  }

  function boardOf(x){
    var ck = x.id + ':' + x.moves.length;
    if (boardCache[x.id] && boardCache[x.id].k === ck) return boardCache[x.id].b;
    if (typeof window.initialBoard !== 'function' || typeof window.applyStep !== 'function') return null;
    var b = window.initialBoard();
    if (x.opening && x.opening.board) {
      var k = 0;
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        if ((r + c) % 2 !== 1) { b[r][c] = 0; continue; }
        var ch = x.opening.board.charAt(k++);
        b[r][c] = ch === 'w' ? 1 : ch === 'b' ? 2 : ch === 'W' ? 3 : ch === 'B' ? 4 : 0;
      }
    }
    try { for (var i = 0; i < x.moves.length; i++) b = window.applyStep(b, x.moves[i]); } catch(e){}
    boardCache[x.id] = { k: ck, b: b };
    return b;
  }

  function miniBoard(x){
    var b = boardOf(x); if (!b) return '<div class="tvMb"></div>';
    var lm = x.moves.length ? x.moves[x.moves.length - 1] : null, h = '<div class="tvMb">';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var dk = (r + c) % 2 === 1, p = b[r][c];
      var hl = lm && ((lm.from && lm.from.r === r && lm.from.c === c) || (lm.to && lm.to.r === r && lm.to.c === c));
      h += '<div class="' + (dk ? 'dk' : 'lt') + (hl ? ' hl' : '') + '">' +
        (p ? '<i class="pc ' + (p === 1 || p === 3 ? 'pw' : 'pb') + (p >= 3 ? ' kg' : '') + '"></i>' : '') + '</div>';
    }
    return h + '</div>';
  }

  function clk(x, col){
    var cc = col === 'white' ? 'ckw' : 'ckb';
    if (!x || !x.clock) return '<b class="' + cc + '">–:–</b>';
    var ms = x.clock[col], run = x.running && x.turn === col && !x.finished;
    if (run) ms -= Date.now() - peekAt;
    return '<b class="' + cc + (run ? (ms < 10000 ? ' low' : ' run') : '') + '">' + fmtC(ms) + '</b>';
  }

  function renderLive(){
    var t = findT(window.__tvCur), box = g('tvLiveB'); if (!t || !box) return;
    var lv = liveBoards(t);
    g('tvTabLn').textContent = lv.length;
    g('tvTabDot').style.display = lv.length ? '' : 'none';
    var sig = JSON.stringify([lv.map(function(b){ return b.roomId; }), Object.keys(peekData).map(function(k){ var x = peekData[k]; return [k, x.moves.length, x.turn, x.finished]; })]);
    if (sig === lastL) { // faqat soatlarni yangilaymiz
      var cs = box.querySelectorAll('.tvLc[data-room]');
      for (var i = 0; i < cs.length; i++) {
        var x = peekData[cs[i].getAttribute('data-room')]; if (!x) continue;
        var tk = cs[i].querySelector('.ckb'), bk = cs[i].querySelector('.ckw');
        if (tk) tk.outerHTML = clk(x, 'black');
        if (bk) bk.outerHTML = clk(x, 'white');
      }
      return;
    }
    lastL = sig;
    if (!lv.length) {
      box.innerHTML = '<div class="tvLe">' + (t.status === 'running' ? 'Hozir jonli o‘yin yo‘q, juftlash kutilmoqda…' : t.status === 'finished' ? 'Turnir tugagan' : 'Jonli o‘yinlar turnir boshlangach shu yerda chiqadi') + '</div>';
      return;
    }
    var h = '<div class="tvLg">';
    lv.forEach(function(b){
      var x = peekData[b.roomId];
      var cb = clk(x, 'black'), cw = clk(x, 'white');
      h += '<div class="tvLc" data-room="' + esc(b.roomId) + '">' +
        (x && x.spectators ? '<span class="sp">👁 ' + x.spectators + '</span>' : '') +
        '<div class="ln"><span>⚫ ' + esc(b.blackName) + (x && x.bElo ? ' <small style="opacity:.6">' + x.bElo + '</small>' : '') + '</span>' + cb + '</div>' +
        (x ? miniBoard(x) : '<div class="tvMb">' + emptyGrid() + '</div>') +
        '<div class="ln"><span>⚪ ' + esc(b.whiteName) + (x && x.wElo ? ' <small style="opacity:.6">' + x.wElo + '</small>' : '') + '</span>' + cw + '</div></div>';
    });
    box.innerHTML = h + '</div>';
  }
  function emptyGrid(){ var h = ''; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) h += '<div class="' + ((r + c) % 2 ? 'dk' : 'lt') + '"></div>'; return h; }

  // ---------- asosiy sikl ----------
  var lastPeek = 0;
  setInterval(function(){
    var P = g('tvP');
    if (!P || !P.classList.contains('on')) { if (ws) drop(); tabFor = null; return; }
    if (!setup()) return;
    var t = findT(window.__tvCur); if (!t) return;
    if (tabFor !== window.__tvCur) {
      tabFor = window.__tvCur; lastP = ''; lastL = ''; peekData = {}; boardCache = {};
      var sv = null; try { sv = sessionStorage.getItem(key()); } catch(e){}
      setTab(sv || (t.status === 'finished' || t.status === 'reg' ? 't' : 'p'), false);
    }
    var sp = JSON.stringify([t.boards, t.hist, t.bye, t.round, t.status, (t.players || []).map(function(p){ return [p.uid, p.score]; }), me()]);
    if (sp !== lastP) { lastP = sp; renderPairs(t); }
    renderLive();
    var n = Date.now();
    if (tab === 'l' && n - lastPeek > 1500) { lastPeek = n; if (!ws) conn(); else peek(); }
    if (tab !== 'l' && ws) drop();
  }, 500);
})();

/* TVTAP — bosilganda faqat tugma sezilsin, butun karta emas */
;(function(){
  if (document.getElementById('tvTapCss')) return;
  var s = document.createElement('style'); s.id = 'tvTapCss';
  s.textContent =
    '#lbTs .lbtk,#lbTs .lbtk *{-webkit-tap-highlight-color:transparent!important}' +
    '#lbTs .lbtk{-webkit-user-select:none;user-select:none}' +
    '#lbTs .lbtk:active{transform:none!important;filter:none!important}' +
    '#lbTs .lbtk .row [data-a="tj"],#lbTs .lbtk .row [data-a="tl"]{display:none!important}' +
    '#lbTs .lbtk button{transition:transform .08s,filter .08s}' +
    '#lbTs .lbtk button:active{transform:translateY(2px) scale(.98);filter:brightness(.9)}';
  document.head.appendChild(s);
})();

/* TVLOOK — ichkarida ma'lumot chiplari yashiriladi (ular kartada bor), tablar rangli */
;(function(){
  if (document.getElementById('tvLookCss')) return;
  var s = document.createElement('style'); s.id = 'tvLookCss';
  var B = 'html body #tvP #tvTabs button';
  s.textContent =
    'html body #tvP #tvInfo{display:none!important}' +
    'html body #tvP #tvTabs{gap:10px!important;padding-top:12px!important}' +
    B + '{border:2px solid transparent!important;color:#fff!important;opacity:.72}' +
    B + '[data-tab="p"]{background:#352d86!important;box-shadow:0 4px 0 #0e0b30!important}' +
    B + '[data-tab="t"]{background:#0b0920!important;box-shadow:0 4px 0 #000!important}' +
    B + '[data-tab="l"]{background:#b33430!important;box-shadow:0 4px 0 #7a201d!important}' +
    B + '.on{opacity:1;border-color:#fff!important;transform:translateY(-1px)}' +
    B + ' i{background:rgba(255,255,255,.18)!important}' +
    'html body #tvP #tvTabs .dot{background:#fff!important}';
  document.head.appendChild(s);
})();

/* PFROW — profil + taklif bir qatorda (yarim/yarim) */
;(function(){
  if (document.getElementById('pfRowCss')) return;
  var s = document.createElement('style'); s.id = 'pfRowCss';
  s.textContent =
    '#pfCard{order:-1!important;flex:1 1 100%!important;min-width:0!important;margin:0!important;box-sizing:border-box}' +
    '#pfCard.pfHalf{flex:1 1 calc(50% - 5px)!important;padding:10px!important;gap:9px!important}' +
    '#pfCard.pfHalf .pfA{width:46px!important;height:46px!important;border-radius:13px!important}' +
    '#pfCard.pfHalf .pfC{font-size:18px!important}' +
    '#pfCard.pfHalf .pfE{font-size:15px!important;margin-top:2px!important}' +
    '#pfCard.pfHalf .pfE small,#pfCard.pfHalf .pfG{display:none!important}' +
    '#hzPromo[style*="block"]{gap:8px!important;padding:10px!important;border-radius:18px!important;min-width:0!important;box-sizing:border-box}' +
    '#hzPromo .pgI{font-size:34px!important}' +
    '#hzPromo .pgT{font-size:15px!important;line-height:1.15!important}' +
    '#hzPromo .pgP{margin:3px 0 0!important;font-size:13px!important;padding:2px 8px!important}' +
    '#hzPromo .pgS{font-size:12px!important;margin-top:3px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
  document.head.appendChild(s);
})();

/* SPPOD2 — shohsupa: tayyor fon rasmi (/podium.jpg) ustiga jonli ism, avatar, ochko va tanga */
;(function () {
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var PZT = { 3: [50,30,20], 4: [40,28,20,12], 5: [35,25,18,13,9], 6: [30,22,17,13,10,8], 7: [28,20,15,12,10,8,7], 8: [26,19,15,12,10,8,5,5], 9: [24,18,14,11,10,8,6,5,4], 10: [22,17,13,11,9,8,7,5,4,4] };
  if (!document.getElementById("spPd2Css")) {
    var st = document.createElement("style"); st.id = "spPd2Css";
    st.textContent =
      ".spPd{position:relative;width:100%;aspect-ratio:1149/958;border-radius:18px;overflow:hidden;margin-bottom:12px;background:#0b0920 center/cover no-repeat;box-shadow:0 3px 0 #0e0b30;font-family:Roboto,system-ui,sans-serif;color:#fff}" +
      ".spPd img.bg{position:absolute;left:0;top:0;width:100%;height:142.86%;object-fit:fill}" +
      ".spPd .tt{position:absolute;left:12%;right:12%;top:28.71%;transform:translateY(-50%);text-align:center;font:900 2.3em Georgia,'Times New Roman',serif;color:#ffe08a;text-shadow:0 2px 0 #7a4c00,0 0 12px rgba(255,190,60,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".spPd .sl{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;text-align:center}" +
      ".spPd .av{border-radius:50%;overflow:hidden;background:#1f4fd6;border:.18em solid #ffd76a;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;box-sizing:border-box}" +
      ".spPd .av img{width:100%;height:100%;object-fit:cover}" +
      ".spPd .nm{margin-top:.35em;max-width:100%;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000}" +
      ".spPd .sc{font-weight:900;margin-top:.15em;text-shadow:0 1px 2px #000}" +
      ".spPd .pz{display:inline-block;margin-left:.2em;font-size:.9em;font-weight:900;color:#1a1205;background:#f5c542;border-radius:999px;padding:.05em .55em;white-space:nowrap}";
    document.head.appendChild(st);
  }
  // kartalar joyi (rasmga nisbatan %)
  var SL = [
    // rasmning yuqori 70% ko'rsatiladi (zinapoya kesilgan) — y: to'liq rasmdagi %, K ga bo'linadi
    { x: 50.0, y: 31.5, w: 21, d: 15.5, f: 1.25 },  // 1-o'rin
    { x: 23.3, y: 39.6, w: 17, d: 11.5, f: 1.05 },  // 2-o'rin
    { x: 76.8, y: 40.6, w: 17, d: 11.5, f: 1.05 }   // 3-o'rin
  ];
  function fit(el) { if (el && el.clientWidth) el.style.fontSize = (el.clientWidth / 40) + "px"; }
  window.addEventListener("resize", function () { fit(document.querySelector(".spPd")); });
  window.spPod = function (t) {
    var box = document.getElementById("tvPod");
    var live = document.getElementById("tvLive");
    if (live && live.parentNode) live.parentNode.style.display = t.status === "finished" ? "none" : "";
    if (!box) return;
    if (t.status !== "finished") { box.innerHTML = ""; return; }
    var pl = (t.players || []).filter(function (p) { return p.games > 0 && (t.type === "arena" || !p.withdrawn); });
    if (!pl.length) { box.innerHTML = ""; return; }
    var aw = t.awards || [];
    if (!aw.length && t.prize > 0) {
      var sh = pl.length >= 3 ? PZT[Math.min(t.places || 3, pl.length)] : pl.length === 2 ? [60, 40] : [100];
      aw = sh.map(function (pc, i) { return { place: i + 1, amt: Math.floor(t.prize * pc / 100) }; });
    }
    var h = '<div class="spPd"><img class="bg" src="/podium.jpg" alt=""><div class="tt">' + e(t.name) + '</div>';
    for (var i = 0; i < 3; i++) {
      var p = pl[i]; if (!p) continue;
      var s = SL[i], a = aw.filter(function (x) { return x.place === i + 1; })[0], ini = e(String(p.name || "?").charAt(0).toUpperCase());
      var av = /^\d+$/.test(String(p.uid)) ? '<img src="/api/av/' + encodeURIComponent(p.uid) + '" alt="" onerror="this.parentNode.textContent=\'' + ini.replace(/'/g, "") + '\'">' : ini;
      h += '<div class="sl" style="left:' + s.x + '%;top:' + (s.y / 0.70).toFixed(2) + '%;width:' + s.w + '%;font-size:' + s.f + 'em">' +
        '<div class="av" style="width:' + (s.d / s.w * 100) + '%;aspect-ratio:1;font-size:1.6em">' + av + '</div>' +
        '<div class="nm">' + e(p.name) + '</div>' +
        '<div class="sc">⭐ ' + (p.score || 0) + (a && a.amt ? ' <span class="pz">+' + a.amt + ' 🪙</span>' : '') + '</div></div>';
    }
    box.innerHTML = h + '</div>';
    var el = box.querySelector(".spPd"); fit(el); setTimeout(function () { fit(el); }, 60);
  };
})();

/* TKCD — kartada katta teskari sanoq (Havola va Bekor qilish orasida) + yaqqolroq matn */
;(function(){
  if (window.__tkCd) return; window.__tkCd = 1;
  var P = 'html body #lbPanel #lbTs .lbtk ';
  var s = document.createElement('style'); s.id = 'tkCdCss';
  s.textContent =
    P + '.tkd{color:#f1f0ff!important;font-size:16px!important;line-height:1.45!important}' +
    P + '.tkd b{color:#fff!important}' +
    P + '.muted{color:#e2e0ff!important;font-size:15px!important;font-weight:700!important;opacity:1!important}' +
    P + '.row{align-items:center!important}' +
    P + '.tkCd{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;pointer-events:none}' +
    P + '.tkCd small{font-size:12px;font-weight:700;color:#c9c6f5;letter-spacing:.3px}' +
    P + '.tkCd b{font-size:30px;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:.5px}' +
    P + '.tkCd.soon b{color:#ffb547}' + P + '.tkCd.now b{color:#ff5a5a}';
  document.head.appendChild(s);
  function St(){ try { return window.__lb ? window.__lb.S : null; } catch(e){ return null; } }
  function f2(n){ return (n < 10 ? '0' : '') + n; }
  function fmt(ms){ ms = Math.max(0, ms); var x = Math.ceil(ms / 1000), h = Math.floor(x / 3600), m = Math.floor(x % 3600 / 60), sc = x % 60; return (h ? h + ':' + f2(m) : f2(m)) + ':' + f2(sc); }
  setInterval(function(){
    var S = St(); if (!S || !S.tournaments) return;
    var skew = window.__lbSkew || 0, now = Date.now() + skew;
    S.tournaments.forEach(function(t){
      var card = document.getElementById('lbtc_' + t.id); if (!card) return;
      var row = card.querySelector('.row'); if (!row) return;
      var target = 0, label = '';
      if (t.status === 'reg' && t.startAt) { target = t.startAt; label = 'boshlanishiga'; }
      else if (t.status === 'running' && t.type === 'arena' && t.endAt && !t.ending) { target = t.endAt; label = 'tugashiga'; }
      var cd = row.querySelector('.tkCd');
      if (!target) { if (cd) cd.remove(); return; }
      if (!cd) {
        cd = document.createElement('div'); cd.className = 'tkCd'; cd.innerHTML = '<small></small><b></b>';
        var lk = row.querySelector('[data-a="tlink"]');
        if (lk && lk.nextSibling) row.insertBefore(cd, lk.nextSibling); else row.appendChild(cd);
      }
      var left = target - now;
      cd.querySelector('small').textContent = label;
      cd.querySelector('b').textContent = fmt(left);
      cd.classList.toggle('soon', left <= 60000 && left > 10000);
      cd.classList.toggle('now', left <= 10000);
    });
  }, 250);
})();

/* CARDTHEME — turnir kartalari: qora fon (ko'zga yengil) */
;(function(){
  if (document.getElementById('cardThemeCss')) return;
  var s = document.createElement('style'); s.id = 'cardThemeCss';
  s.textContent = "html body #lbPanel #lbTs .card.lbtk{background:#1c1c22!important;border:1px solid #2e2e38!important;box-shadow:0 3px 0 #000!important;color:#c9c9d2!important}html body #lbPanel #lbTs .card.lbtk>div:first-child b{color:#ffffff!important}html body #lbPanel #lbTs .card.lbtk .muted{color:#b4b4bf!important}html body #lbPanel #lbTs .card.lbtk .tkd{color:#c9c9d2!important}html body #lbPanel #lbTs .card.lbtk .tkd b{color:#ffffff!important}html body #lbPanel #lbTs .card.lbtk .tkb{background:#2c2c35!important;color:#b4b4bf!important}html body #lbPanel #lbTs .card.lbtk .tkb_running{background:#143d2a!important;color:#2ecc71!important}html body #lbPanel #lbTs .card.lbtk .tkb_reg{background:#1f2a4d!important;color:#8fb0ff!important}html body #lbPanel #lbTs .card.lbtk [data-a=\"tlink\"]{background:#2c2c35!important;color:#ffffff!important;border:0!important;box-shadow:0 2px 0 #000!important}html body #lbPanel #lbTs .card.lbtk .tvCE{background:#34343f!important;color:#ffffff!important;border:0!important;box-shadow:0 3px 0 #000!important}html body #lbPanel #lbTs .card.lbtk .tbody{border-color:#2c2c35!important}html body #lbPanel #lbTs .card.lbtk th{background:#24242c!important;color:#9a9aa6!important}html body #lbPanel #lbTs .card.lbtk td{border-top-color:#2c2c35!important;color:#c9c9d2!important}html body #lbPanel #lbTs .card.lbtk .tkCd small{color:#b4b4bf!important}html body #lbPanel #lbTs .card.lbtk .tkCd b{color:#ffffff!important}";
  document.head.appendChild(s);
})();
