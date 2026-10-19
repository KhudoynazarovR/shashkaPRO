;(function(){
  var A=null;
  function ac(){ if(!A) A=new (window.AudioContext||window.webkitAudioContext)(); if(A.state==='suspended') A.resume(); return A; }
  function tone(f,t,d,g){ var a=ac(),o=a.createOscillator(),v=a.createGain(),t0=a.currentTime+t;
    o.type='sine'; o.frequency.setValueAtTime(f,t0);
    v.gain.setValueAtTime(0.0001,t0); v.gain.exponentialRampToValueAtTime(g,t0+0.01); v.gain.exponentialRampToValueAtTime(0.0001,t0+d);
    o.connect(v); v.connect(a.destination); o.start(t0); o.stop(t0+d+0.05); }
  function snd(){ tone(987.77,0,0.18,0.35); tone(1318.5,0.12,0.45,0.35); tone(1975.5,0.12,0.45,0.12); }
  window.__coinClear=function(){ var e=document.getElementById('coinFxEl'); if(e) e.remove(); };
  window.__coinFx=function(k){
    try{ snd(); }catch(e){}
    if(!document.getElementById('coinFxCss')){
      var st=document.createElement('style'); st.id='coinFxCss';
      st.textContent='@keyframes coinFxIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes coinFxUp{0%{opacity:0;transform:translate(-50%,0) scale(.6)}15%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}70%{opacity:1;transform:translate(-50%,-40px) scale(1)}100%{opacity:0;transform:translate(-50%,-70px) scale(1)}}';
      document.head.appendChild(st);
    }
    var d=document.createElement('div');
    d.textContent='+'+k+' \uD83E\uDE99';
    d.style.cssText='position:fixed;left:50%;top:48%;z-index:99999;pointer-events:none;font-size:44px;font-weight:800;color:#ffd54a;text-shadow:0 2px 10px #000,0 0 18px #f5a300;animation:coinFxIn .6s ease-out forwards';
    window.__coinClear(); d.id='coinFxEl'; document.body.appendChild(d); setTimeout(function(){ try{ if(d.parentNode) d.remove(); }catch(e){} },600000);
  };
})();
/* roomclient.js — guruh o'yini (xona) rejimi.
   Faqat Telegram havolasidan (startapp=XONA) yoki ?room=XONA bilan ochilganda ishlaydi.
   Oddiy ochilganda hech narsa qilmaydi. index.html dagi qoidalar funksiyalaridan foydalanadi. */
(function () {
  "use strict";

  var ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
  var q = new URLSearchParams(location.search);

  function loadTg(cb) {
    if (window.Telegram && window.Telegram.WebApp) return cb();
    var s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  loadTg(function () {
    var tg = window.Telegram && window.Telegram.WebApp;
    var roomId = "";
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && !/^(ref_|pz_|pf_|go_|shop_)/.test(tg.initDataUnsafe.start_param)) roomId = String(tg.initDataUnsafe.start_param);
    if (!roomId && q.get("room")) roomId = q.get("room");
    if (/^lb[ts]_/.test(roomId)) return; // turnir/sians havolasi - xona emas
    if (!ROOM_RE.test(roomId)) return; // xona rejimi emas
    try { if (tg) { tg.ready(); tg.expand(); if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } } catch (e) {}
    var missing = missingFns();
    if (missing.length) {
      var d = document.createElement("div");
      d.style.cssText = "position:fixed;inset:0;z-index:9999;background:#0b1017;color:#fff;padding:24px;font-family:Arial,sans-serif";
      d.textContent = "⚠️ index.html da kerakli funksiyalar topilmadi: " + missing.join(", ");
      document.body.appendChild(d);
      return;
    }
    start(roomId, tg);
  });

  // index.html dan olinadigan funksiya/o'zgaruvchilar bormi — tekshiramiz
  function missingFns() {
    var need = ["WHITE", "BLACK", "initialBoard", "applyStep", "captureSteps", "simpleSteps",
      "allCaptures", "allMoves", "sameSide", "isWhite", "isKing"];
    var out = [];
    for (var i = 0; i < need.length; i++) {
      try { if (new Function("return typeof " + need[i])() === "undefined") out.push(need[i]); } catch (e) {}
    }
    return out;
  }

  // Telegramsiz kirganda har bir oyna (tab) o'z id'sini saqlaydi — qayta ulansa joyi yo'qolmaydi
  function guestId() {
    var k = "rcGuest", v = "";
    try { v = sessionStorage.getItem(k) || ""; } catch (e) {}
    if (!/^[A-Za-z0-9]{8,32}$/.test(v)) {
      v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      try { sessionStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }

  function start(roomId, tg) {
    var st = {
      color: "spectator", turn: "white", board: startBoard(), moves: [],
      white: null, black: null, whiteOnline: false, blackOnline: false,
      spectators: 0, finished: false, winner: null, reason: null,
      clock: { white: 0, black: 0 }, clockRunning: false, clockAt: 0, timeMs: 0, incMs: 0, tc: "", tcs: [],
      arena: false, berserk: { white: false, black: false }, drawOffer: null, chat: [], unread: 0, chatOpen: false,
      vsBot: false, botStarted: false, botColor: null, botNote: "", botSecs: 1.2, botBlunder: 0,
      selected: null, forced: null, pending: false, connected: false, joined: false
    };
    var ws = null, hb = null, gid = guestId();

    // ---------- ovozlar ----------
    function soundForMove(mv, piece) {
      var S = window.SPSound;
      if (!S || !mv || !mv.to) return;
      var toLast = piece === 1 ? mv.to.r === 0 : piece === 2 ? mv.to.r === 7 : false;
      if (toLast) S.play("king");
      else if (mv.captures && mv.captures.length) { for (var ci = 0; ci < mv.captures.length; ci++) setTimeout(function () { S.play("capture"); }, ci * 120); }
      else S.play("move");
    }
    var lowFlag = { white: false, black: false }, lastTickSec = 0;
    function lowTimeCheck() {
      var S = window.SPSound;
      if (!S || st.finished || st.color === "spectator" || !st.clockRunning || st.turn !== st.color) return;
      var ms = remaining(st.color);
      if (ms <= 0) return;
      if (ms <= 10000 && !lowFlag[st.color]) { lowFlag[st.color] = true; S.play("low"); }
      if (ms > 12000) lowFlag[st.color] = false;       // inkrement bilan oshsa, qayta signal beriladi
      if (ms <= 5000) {
        var sec = Math.ceil(ms / 1000);
        if (sec !== lastTickSec) { lastTickSec = sec; S.play("tick"); }
      }
    }
    setInterval(lowTimeCheck, 300);
    function startBoard() {
      var o = (typeof st !== "undefined" && st) ? st.opening : null;
      var b = initialBoard();
      if (!o || !o.board) return b;
      var k = 0;
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        if ((r + c) % 2 !== 1) { b[r][c] = 0; continue; }
        var ch = o.board.charAt(k++);
        b[r][c] = ch === "w" ? 1 : ch === "b" ? 2 : ch === "W" ? 3 : ch === "B" ? 4 : 0;
      }
      return b;
    }


    // ---------- UI ----------
    var root = document.createElement("div");
    root.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;font-family:Arial,sans-serif;" +
      "display:flex;flex-direction:column;align-items:center;overflow:auto;" +
      "padding:calc(env(safe-area-inset-top,0px) + 10px) 10px 14px";
    root.innerHTML =
      '<div style="display:none">♟️ ShashkaPRO</div>' +
      '<div id="rcStatus" style="margin:8px 0;color:#e3b746;min-height:22px;text-align:center"></div>' +
      '<div id="rcDrawInfo" style="display:none;margin:0 0 8px;padding:5px 14px;border-radius:14px;background:#3a2f7a;color:#ffe08a;font-size:15px;font-weight:bold;text-align:center"></div>' +
      '<div id="rcTc" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:6px"></div>' +
      '<div id="rcTop" style="width:min(94vw,520px);padding:4px 2px;font-size:15px"></div>' +
      '<div id="rcBoard" style="width:min(94vw,520px);aspect-ratio:1;flex:none;display:grid;grid-template-columns:repeat(8,1fr);' +
      'grid-template-rows:repeat(8,1fr);border:3px solid #302217;border-radius:8px;overflow:hidden;' +
      'box-shadow:0 12px 35px #0009;touch-action:manipulation"></div>' +
      '<div id="rcBottom" style="width:min(94vw,520px);padding:4px 2px;font-size:15px"></div>' +
      '<div id="rcDraw" style="display:none;margin-top:10px;padding:8px 12px;border-radius:10px;background:#1c2733;text-align:center">' +
      '<div id="rcDrawText" style="margin-bottom:6px"></div>' +
      '<button id="rcDrawYes">✅ Qabul</button> <button id="rcDrawNo">❌ Rad etish</button></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center">' +
      '<button id="rcDrawOffer" style="display:none">🤝 Durang</button>' +
      '<button id="rcResign" style="display:none">🏳️ Taslim</button>' +
      '<button id="rcLink">🔗 Havola</button>' +
      '<button id="rcChatBtn">💬 Chat</button>' +
      '<button id="rcZal">🏟 O‘yin zali</button>' +
      '<button id="rcClose" style="display:none">✖️ Yopish</button></div>' +
      '<div id="rcChat" style="display:none;position:fixed;left:0;right:0;bottom:0;z-index:10000;background:#120b30;border-top:1px solid #3a2f7a;padding:8px 10px calc(env(safe-area-inset-bottom,0px) + 8px);box-sizing:border-box">' +
      '<div id="rcMsgs" style="height:90px;overflow:auto;background:#101a24;border-radius:8px;padding:6px 8px;font-size:14px"></div>' +
      '<div id="rcQuick"></div><div style="display:none">' +
      '<input id="rcInput" maxlength="200" placeholder="Xabar yozing…" style="flex:1;min-width:0;padding:8px;border-radius:8px;border:1px solid #2a3a4a;background:#0b1017;color:#fff;font-size:16px">' +
      '<button id="rcSend">➤</button></div></div>' +
      '<div id="rcInfo" style="margin-top:10px;font-size:13px;opacity:.7;text-align:center"></div>';
    document.body.appendChild(root);

    var elStatus = root.querySelector("#rcStatus");
    var elDrawInfo = root.querySelector("#rcDrawInfo");
    var elTop = root.querySelector("#rcTop");
    var elBottom = root.querySelector("#rcBottom");
    var elBoard = root.querySelector("#rcBoard");
    var elResign = root.querySelector("#rcResign");
    var elInfo = root.querySelector("#rcInfo");
    var elTc = root.querySelector("#rcTc");
    var elDraw = root.querySelector("#rcDraw");
    var elDrawText = root.querySelector("#rcDrawText");
    var elDrawOffer = root.querySelector("#rcDrawOffer");
    var elChat = root.querySelector("#rcChat");
    var elChatBtn = root.querySelector("#rcChatBtn");
    var elZal = root.querySelector("#rcZal");
    elZal.onclick = function () {
      var live = st.color !== "spectator" && !st.finished && bothIn() && st.moves.length > 0;
      if (live && !confirm("O‘yin davom etyapti, zalga chiqsangiz vaqtingiz ketadi. Chiqasizmi?")) return;
      location.href = location.pathname;
    };
    var elMsgs = root.querySelector("#rcMsgs");
    var elInput = root.querySelector("#rcInput");

    window.addEventListener("error", function (e) {
      elInfo.textContent = "⚠️ JS xato: " + (e && e.message);
    });

    root.querySelector("#rcClose").onclick = function () {
      if (tg && tg.close) tg.close(); else root.style.display = "none";
    };
    root.querySelector("#rcLink").onclick = function () {
      var base = window.TG_APP_LINK || "";
      var url = base
        ? base + "?startapp=" + encodeURIComponent(roomId)
        : location.origin + location.pathname + "?room=" + encodeURIComponent(roomId);
      var text = "♟️ ShashkaPRO — men bilan o‘ynang!";
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { elInfo.textContent = "🔗 Havola nusxalandi"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
    };
    elResign.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      if (confirm("Taslim bo‘lasizmi?")) send({ type: "roomResign", roomId: roomId });
    };

    elDrawOffer.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      send({ type: "roomDrawOffer", roomId: roomId });
    };
    root.querySelector("#rcDrawYes").onclick = function () { send({ type: "roomDrawAccept", roomId: roomId }); };
    root.querySelector("#rcDrawNo").onclick = function () { send({ type: "roomDrawDecline", roomId: roomId }); };

    
    /* rc-menu-v1 */
    try {
      var RCM_KEY = "rc_menu_v1";
      var RCM_BOARDS = [
        ["Yog‘och", "#EFD9B1", "#B58863", 0], ["Ko‘k-kul", "#DEE3E6", "#8CA2AD", 0],
        ["Yashil", "#FFFFDD", "#86A666", 0], ["Kulrang", "#DDDDDD", "#A0A0A0", 0],
        ["Qizil", "#F1D5CC", "#B5685D", 1], ["Binafsha", "#E3DAEE", "#8B72B5", 1],
        ["Feruza", "#D5F0EC", "#4A9A93", 1], ["Tungi", "#9AA5B8", "#3E4A5E", 1]
      ];
      var rcm = { night: false, sound: true, flat: false, board: -1, pieces: -1, auto: false, autoPro: false, chat: true };
      try { var rcmSv = JSON.parse(localStorage.getItem(RCM_KEY) || "{}"); for (var rcmK in rcmSv) rcm[rcmK] = rcmSv[rcmK]; } catch (e) {}
      function rcmSave() { try { localStorage.setItem(RCM_KEY, JSON.stringify(rcm)); } catch (e) {} }

      // Ovozni o'chirish (audio elementlar va WebAudio)
      if (!window.__rcmSoundPatched) {
        window.__rcmSoundPatched = true;
        try { var rcmHP = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (window.__rcmMute) return Promise.resolve(); return rcmHP.apply(this, arguments); }; } catch (e) {}
        ["AudioBufferSourceNode", "OscillatorNode"].forEach(function (n) {
          try { var P = window[n] && window[n].prototype; if (!P) return; var s0 = P.start; P.start = function () { if (window.__rcmMute) return; return s0.apply(this, arguments); }; } catch (e) {}
        });
      }

      /* rc-pieces-v1 */
      var RCM_PIECES = ["Gambler", "Halqa", "3D disk", "Yog‘och", "Neon", "Oltin-kumush", "Minimal", "Shisha"];
      function rcmCrown(c) {
        return 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27' +
          c.replace("#", "%23") + '%27 d=%27M3 18h18v2H3zM3 7l4.5 4L12 4l4.5 7L21 7l-2 9H5z%27/%3E%3C/svg%3E") center/58% no-repeat';
      }
      function rcmPcCss() {
        var C = "circle closest-side";
        // [oq fon, qora fon, oq qo'shimcha css, qora qo'shimcha css, oq damka qatlami, qora damka qatlami]
        var S = [
          // 1 Gambler: yaltiroq halqali, damkada markaziy nuqta
          ["radial-gradient(" + C + ",#ddd 0 20%,#fff 21% 34%,#c9c9c9 35% 38%,#f4f4f4 39% 62%,#d6d6d6 63% 70%,#fafafa 71%)",
           "radial-gradient(" + C + ",#222 0 20%,#000 21% 34%,#444 35% 38%,#0b0b0b 39% 62%,#333 63% 70%,#000 71%)",
           "border:1px solid #bbb;box-shadow:0 3px 5px rgba(0,0,0,.45),inset 0 -2px 3px rgba(0,0,0,.2)",
           "border:1px solid #000;box-shadow:0 3px 5px rgba(0,0,0,.5),inset 0 -2px 3px rgba(255,255,255,.15)",
           "radial-gradient(" + C + ",#111 0 15%,transparent 16%)", "radial-gradient(" + C + ",#eee 0 15%,transparent 16%)"],
          // 2 Halqa: yassi, konsentrik halqalar, damkada toj
          ["repeating-radial-gradient(" + C + ",#f6f6f6 0 5%,#d9d9d9 5% 7%)",
           "repeating-radial-gradient(" + C + ",#2e2e2e 0 5%,#0c0c0c 5% 7%)",
           "border:2px solid #ececec;box-shadow:0 2px 4px rgba(0,0,0,.35)",
           "border:2px solid #000;box-shadow:0 2px 4px rgba(0,0,0,.45)",
           rcmCrown("#222222"), rcmCrown("#f2f2f2")],
          // 3 3D disk: qalin disk, oltin toj
          ["linear-gradient(#ffffff,#e4e4e4)", "linear-gradient(#444,#000)",
           "border:1px solid #cfcfcf;box-shadow:0 5px 0 #b4b4b4,0 8px 7px rgba(0,0,0,.4)",
           "border:1px solid #333;box-shadow:0 5px 0 #000,0 8px 7px rgba(0,0,0,.5)",
           rcmCrown("#d4a017"), rcmCrown("#d4a017")],
          // 4 Yog'och
          ["radial-gradient(circle at 35% 30%,#f6e3bd,#d9b77a 60%,#b98e50)",
           "radial-gradient(circle at 35% 30%,#7a4a2a,#4a2a14 60%,#2b160a)",
           "border:2px solid #9a7138;box-shadow:inset 0 0 0 4px rgba(120,80,30,.25),0 3px 5px rgba(0,0,0,.4)",
           "border:2px solid #1d0e05;box-shadow:inset 0 0 0 4px rgba(255,220,170,.15),0 3px 5px rgba(0,0,0,.5)",
           rcmCrown("#6b4420"), rcmCrown("#f0c36b")],
          // 5 Neon
          ["radial-gradient(" + C + ",#0b2a33 0 60%,#06161b 100%)", "radial-gradient(" + C + ",#2e0b2a 0 60%,#170515 100%)",
           "border:2px solid #35e0ff;box-shadow:0 0 8px #35e0ff,inset 0 0 8px rgba(53,224,255,.45)",
           "border:2px solid #ff3dcb;box-shadow:0 0 8px #ff3dcb,inset 0 0 8px rgba(255,61,203,.45)",
           rcmCrown("#35e0ff"), rcmCrown("#ff3dcb")],
          // 6 Oltin va kumush (oq = kumush, qora = oltin)
          ["radial-gradient(circle at 35% 30%,#ffffff,#cfd5dc 45%,#8d96a1)", "radial-gradient(circle at 35% 30%,#fff1a8,#e0b32e 45%,#8a6510)",
           "border:2px solid #aab3be;box-shadow:0 3px 5px rgba(0,0,0,.4)",
           "border:2px solid #b8891c;box-shadow:0 3px 5px rgba(0,0,0,.45)",
           rcmCrown("#3a3f46"), rcmCrown("#5a3d06")],
          // 7 Minimal: tekis rang, damkada halqa
          ["linear-gradient(#f2efe6,#f2efe6)", "linear-gradient(#2a2a2a,#2a2a2a)",
           "border:3px solid #d0cbbd", "border:3px solid #111",
           "radial-gradient(" + C + ",transparent 0 28%,#bdb7a6 29% 40%,transparent 41%)",
           "radial-gradient(" + C + ",transparent 0 28%,#777 29% 40%,transparent 41%)"],
          // 8 Shisha
          ["radial-gradient(circle at 30% 25%,rgba(255,255,255,.95) 0 12%,rgba(120,190,255,.8) 40%,rgba(40,110,220,.95))",
           "radial-gradient(circle at 30% 25%,rgba(255,255,255,.9) 0 12%,rgba(255,120,120,.8) 40%,rgba(190,20,40,.95))",
           "border:2px solid rgba(255,255,255,.7);box-shadow:0 3px 6px rgba(0,0,0,.4),inset 0 -4px 8px rgba(0,60,160,.5)",
           "border:2px solid rgba(255,255,255,.6);box-shadow:0 3px 6px rgba(0,0,0,.45),inset 0 -4px 8px rgba(120,0,20,.55)",
           rcmCrown("#ffffff"), rcmCrown("#ffffff")]
        ];
        function imp(str) { return str.split(";").filter(Boolean).map(function (x) { return x + " !important"; }).join(";"); }
        var css = ".pv{border-radius:50%!important}.rcPS .pc{border-radius:50%!important}" +
          ".rcPS .pc::before,.rcPS .pc::after{display:none!important;content:none!important}";
        S.forEach(function (s, i) {
          var n = i + 1;
          var sel = function (side, king) { return ".rcP" + n + " .pc." + side + (king ? ".k" : "") + ",.rcPV" + n + " .pv." + side + (king ? ".k" : ""); };
          [["w", 0, 2, 4], ["b", 1, 3, 5]].forEach(function (d) {
            css += sel(d[0], false) + "{background:" + s[d[1]] + " !important;" + imp(s[d[2]]) + "}";
            css += sel(d[0], true) + "{background:" + s[d[3]] + "," + s[d[1]] + " !important}";
          });
        });
        return css;
      }
      var rcmOrigBg = root.style.background;
      var rcmStyle = document.createElement("style"); rcmStyle.id = "rcmStyle"; document.head.appendChild(rcmStyle);
      function rcmApply() {
        window.__rcmMute = !rcm.sound;
        var css = "";
        if (rcm.board >= 0 && RCM_BOARDS[rcm.board]) {
          var b = RCM_BOARDS[rcm.board];
          css += "#rcBoard .cell.sq.l:not(.lm):not(.sel){background:" + b[1] + " !important}";
          css += "#rcBoard .cell.sq.d:not(.lm):not(.sel){background:" + b[2] + " !important}";
        }
        css += ".rcFlat .pc{background-image:none!important;box-shadow:none!important}";
        css += ".rcFlat .pc.w{background:#f4f4f4!important;border:2px solid #bbb!important}";
        css += ".rcFlat .pc.b{background:#222!important;border:2px solid #555!important}";
        css += rcmPcCss(); rcmStyle.textContent = css;
        root.classList.toggle("rcFlat", !!rcm.flat);
        for (var pi = 1; pi <= 8; pi++) root.classList.remove("rcP" + pi);
        root.classList.remove("rcPS");
        if (rcm.pieces >= 0) { root.classList.add("rcP" + (rcm.pieces + 1)); root.classList.add("rcPS"); }
        root.style.background = rcm.night ? "radial-gradient(circle at 30% 10%,#10162b 0,#0a0e1d 55%,#05070f 100%)" : rcmOrigBg;
        rcmChatVis();
      }
      function rcmChatVis() {
        if (!rcm.chat) { elChatBtn.style.display = "none"; elChat.style.display = "none"; }
        else if (!st.vsBot && elChatBtn.style.display === "none") elChatBtn.style.display = "";
      }

      // "Yurmasdan chiqish" uchun: men yurdimmi?
      var rcmMovedFlag = false;
      var rcmSM = sendMove;
      sendMove = function (mv) { rcmMovedFlag = true; return rcmSM.apply(this, arguments); };
      function rcmMoved() {
        if (rcmMovedFlag) return true;
        if (!st.moves) return false;
        return st.color === "white" ? st.moves.length > 0 : st.moves.length >= 2;
      }
      function rcmCanAbort() { return st.color !== "spectator" && !st.finished && st.joined && !rcmMoved(); }

      // Menyu tugmasi va paneli
      var rcmBtn = document.createElement("button");
      rcmBtn.id = "rcMenuBtn"; rcmBtn.textContent = "☰ Menu";
      elChatBtn.parentNode.insertBefore(rcmBtn, elChatBtn);
      var rcmPanel = document.createElement("div");
      rcmPanel.style.cssText = "display:none;position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.55)";
      rcmPanel.innerHTML = '<div id="rcmBox" style="position:absolute;top:0;right:0;bottom:0;width:min(82vw,340px);background:#101a2e;color:#fff;overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 24px;font-size:16px;box-sizing:border-box"></div>';
      root.appendChild(rcmPanel);
      rcmPanel.onclick = function (e) { if (e.target === rcmPanel) rcmPanel.style.display = "none"; };
      rcmBtn.onclick = function () { rcmBuild(); rcmPanel.style.display = "block"; };

      function rcmBuild() {
        var box = document.getElementById("rcmBox");
        var T = [
          ["night", "🌙 Tungi rejim", ""], ["sound", "🔊 Ovoz", ""], ["flat", "◐ Oddiy toshlar", ""],
          ["auto", "⚡ Avtohod", "Faqat 1 ta yurish bo‘lsa, o‘zi yuradi"],
          ["autoPro", "⚡ Avtohod Pro", "Urish davomi 1 ta bo‘lsa, o‘zi davom ettiradi"],
          ["chat", "💬 Chat", ""]
        ];
        var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:19px">☰ Menu</b><span id="rcmX" style="font-size:24px;padding:4px 8px">✕</span></div>';
        T.forEach(function (t) {
          h += '<label style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #26344f">' +
            '<span>' + t[1] + (t[2] ? '<small style="display:block;opacity:.6;font-size:12px;margin-top:2px">' + t[2] + '</small>' : '') + '</span>' +
            '<input type="checkbox" data-k="' + t[0] + '"' + (rcm[t[0]] ? " checked" : "") + ' style="width:22px;height:22px"></label>';
        });
        h += '<div style="margin:16px 0 8px">🎨 Doska rangi</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
        RCM_BOARDS.forEach(function (b, i) {
          h += '<div data-b="' + i + '" style="aspect-ratio:1;border-radius:10px;position:relative;border:3px solid ' + (i === rcm.board ? "#4c8dff" : "transparent") +
            ';background:conic-gradient(' + b[2] + ' 25%,' + b[1] + ' 0 50%,' + b[2] + ' 0 75%,' + b[1] + ' 0)">' +
            (b[3] ? '<span style="position:absolute;top:-8px;right:-4px;font-size:14px">👑</span>' : "") + '</div>';
        });
        h += '</div><div id="rcmReset" style="margin:10px 0 0;font-size:13px;opacity:.7;text-decoration:underline">↺ Standart doska</div>';
        h += '<div style="margin:18px 0 8px">♟ Toshlar</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
        RCM_PIECES.forEach(function (nm, i) {
          var pv = function (cls) { return '<i class="pv ' + cls + '" style="width:20px;height:20px;display:block"></i>'; };
          h += '<div data-p="' + i + '" title="' + nm + '" class="rcPV' + (i + 1) + '" style="border-radius:10px;background:#26344f;padding:6px 0;display:flex;justify-content:center;border:3px solid ' + (i === rcm.pieces ? "#4c8dff" : "transparent") + '">' +
            '<div style="display:grid;grid-template-columns:repeat(2,20px);gap:4px">' + pv("w") + pv("b") + pv("w k") + pv("b k") + '</div></div>';
        });
        h += '</div><div id="rcmPReset" style="margin:10px 0 0;font-size:13px;opacity:.7;text-decoration:underline">↺ Standart toshlar</div>';
        if (rcmCanAbort()) h += '<button id="rcmAbort" style="width:100%;margin-top:22px;padding:14px;border:0;border-radius:12px;background:#d32f2f;color:#fff;font-size:16px">⎋ Chiqish (yurmasdan)</button>';
        box.innerHTML = h;

        box.querySelector("#rcmX").onclick = function () { rcmPanel.style.display = "none"; };
        Array.prototype.forEach.call(box.querySelectorAll("input[data-k]"), function (inp) {
          inp.onchange = function () {
            var k = inp.getAttribute("data-k"); rcm[k] = inp.checked;
            if (k === "autoPro" && inp.checked) rcm.auto = true;
            if (k === "auto" && !inp.checked) rcm.autoPro = false;
            rcmSave(); rcmApply(); rcmBuild();
          };
        });
        Array.prototype.forEach.call(box.querySelectorAll("[data-b]"), function (el) {
          el.onclick = function () {
            var i = +el.getAttribute("data-b"), b = RCM_BOARDS[i];
            if (b[3] && window.rcIsPremium && !window.rcIsPremium()) { alert("👑 Bu doska premium. Tosh do‘konidan oching."); return; }
            rcm.board = i; rcmSave(); rcmApply(); rcmBuild();
          };
        });
        box.querySelector("#rcmReset").onclick = function () { rcm.board = -1; rcmSave(); rcmApply(); rcmBuild(); };
        Array.prototype.forEach.call(box.querySelectorAll("[data-p]"), function (el) {
          el.onclick = function () { rcm.pieces = +el.getAttribute("data-p"); rcmSave(); rcmApply(); rcmBuild(); };
        });
        var pr = box.querySelector("#rcmPReset");
        if (pr) pr.onclick = function () { rcm.pieces = -1; rcmSave(); rcmApply(); rcmBuild(); };
        var ab = box.querySelector("#rcmAbort");
        if (ab) ab.onclick = function () {
          if (!rcmCanAbort()) { rcmBuild(); return; }
          if (!confirm("Yurmasdan chiqasizmi? O‘yin bekor qilinadi.")) return;
          send({ type: "roomAbort", roomId: roomId });
          setTimeout(function () { location.href = location.pathname; }, 600);
        };
      }

      // Avtohod / Avtohod Pro
      var rcmLast = 0;
      setInterval(function () {
        try {
          rcmChatVis();
          if (!rcm.auto) return;
          if (!st || !st.joined || st.finished || st.color === "spectator" || st.pending) return;
          if (st.vsBot && !st.botStarted) return;
          if (!bothIn() || st.turn !== st.color) return;
          var now = Date.now(); if (now - rcmLast < (st.forced ? 1200 : 600)) return;
          var chain = !!st.forced;
          var steps = chain ? captureSteps(st.board, st.forced.r, st.forced.c) : allMoves(st.board, codeOf(st.color));
          if (!steps || steps.length !== 1) return;
          if (chain && !rcm.autoPro) return;
          var mv = steps[0];
          if (!mv || !mv.from || !mv.to) return;
          rcmLast = now;
          sendMove(mv);
        } catch (e) {}
      }, 350);

      rcmApply();
    } catch (e) { console.error("rc-menu xato:", e); }

    var elBerserk = document.createElement("button");
    elBerserk.textContent = "⚡ Berserk";
    elBerserk.className = elResign.className;
    elBerserk.style.display = "none";
    elResign.parentNode.insertBefore(elBerserk, elResign);
    elBerserk.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      send({ type: "roomBerserk", roomId: roomId });
    };

    elChatBtn.onclick = function () {
      st.chatOpen = !st.chatOpen;
      if (st.chatOpen) st.unread = 0;
      renderChat();
      if (st.chatOpen) elMsgs.scrollTop = elMsgs.scrollHeight;
    };
    function sendChat() {
      var t = elInput.value.trim();
      if (!t) return;
      send({ type: "roomChat", roomId: roomId, text: t });
      elInput.value = "";
    }
    root.querySelector("#rcSend").onclick = sendChat;
    var CATS = [["🎮","Yurishlar",["👍 Ajoyib yurish!","⏩ Tezroq yur!","🐢 Shoshilma!","🎯 Aniq yurish!","🧠 Aqlli yurish!","🔥 Zo‘r yurish!","⚡ Tez va aniq!","👀 Yaxshilab o‘yla!","🤔 Variantlarni ko‘r!","💡 Mana bu yurishni qara!","🚀 Olg‘a!","🎲 Tavakkal qil!","🛡️ Himoyalan!","⚔️ Hujum qil!","🔄 Yana bir o‘yla!"]],["🧠","Strategiya",["🧠 Haqiqiy strateg!","♟️ Reja zo‘r!","🔮 Keyingi yurishni bilaman!","🧐 Qiziq strategiya!","💡 Zo‘r fikr!","🎯 Hammasi hisoblangan!","🕵️ Tuzog‘imga tushding!","🪤 Bu tuzoq!","🤯 Qanday yurish?!","📈 Ustunlik menda!","🧩 Kombinatsiyani top!","🧠 Miyani ishlat!","👑 Strategiya qiroli!","🥷 Ayyor yurish!","🔍 Bir xatoni kutyapman!"]],["🔥","Hujum",["🔥 Zo‘r kombinatsiya!","⚔️ Hujum boshlandi!","💥 Kuchli zarba!","🎯 Nishonga tegdi!","🪓 Bittasi ketdi!","💣 Portlovchi yurish!","🚀 Hujumga o‘t!","🐉 Shafqatsiz hujum!","⚡ Chaqmoqdek yurish!","🥊 Zarba ber!","🔗 Ketma-ket zarbalar!","💥 Bir yurishda ikki dona!","🧨 Kutilmagan hujum!","🦈 O‘ljani ko‘rdim!","🏹 Aniq zarba!"]],["👑","Dama",["👑 Dama bo‘ldi!","🎉 Dama oldim!","💎 Dama — mening boyligim!","🏆 Ustunlik menda!","📈 Vaziyat yaxshi!","😎 Endi qiziq bo‘ladi!","🔥 Dama bilan ehtiyot bo‘l!","👑 Dama qiroli!","🚀 Dama bilan hujum!","🛡️ Damani asra!","😏 Dama bilan nima qilasan?","💪 Kuchlar teng emas!","🌟 Dama vaqti!","🎯 Damani tutib ko‘r!","🦁 Maydon meniki!"]],["😂","Hazil",["😂 Nima qilyapsan?","🤣 Bunaqasi ham bo‘ladimi?","😅 Voy, xato ketdi!","🙈 Ko‘rmadim deb hisobla!","🤦 O‘zim ham tushunmadim!","😜 Ataylab qildim!","🫣 Bu yurishni unutaylik!","🤡 Bugun omad kulmadi!","🥲 Yuragim og‘ridi!","😎 Hammasi reja bo‘yicha!","🤭 Seni sinab ko‘rdim!","🐒 Qiziq yurish ekan!","😆 Qaytadan o‘ynaymizmi?","🙃 Vaziyat chatoq!","🫡 Xo‘p, ustoz!"]],["😤","Chaqiriq",["😤 Qani, kuchingni ko‘rsat!","🔥 Meni yenga olasanmi?","😏 Ishonching komilmi?","🥶 Sovuqqon bo‘l!","👀 Seni kuzatyapman!","🐯 Hujumga tayyormisan?","🦁 Qani, boshladik!","🎯 Meni tutib ko‘r!","🧠 O‘ylashga vaqt bor!","😜 Qo‘rqib ketdingmi?","⚔️ Oxirigacha kurash!","🏆 G‘olib kim bo‘larkin?","💪 Qani, raqib!","🔥 Hali hammasi oldinda!","😎 Men tayyorman!"]],["🤝","Hurmat",["👏 Yaxshi o‘yin!","🤝 Omad, raqib!","🙌 Ajoyib!","💯 Zo‘r o‘ynayapsan!","🫡 Hurmat!","👏 Chiroyli yurish!","🧠 Ustalik bilan!","🌟 Barakalla!","🏅 Haqiqiy mahorat!","🤜🤛 Kuchli raqib!","❤️ O‘yin uchun rahmat!","🙏 Rahmat, do‘stim!","🎖️ Munosib raqib!","🤝 Yana o‘ynaymiz!","🏆 G‘alabang muborak!"]],["😬","Omadsizlik",["😅 Omadsizlik!","🤦 Qanday xato!","😭 Voy, donam ketdi!","💔 Bu og‘riqli bo‘ldi!","🥲 Buni kutmagandim!","😵 Vaziyat yomonlashdi!","🙈 Xatoni ko‘rmadim!","😓 Endi nima qilaman?","💀 Tamom bo‘ldim!","🫠 Vaziyat erib ketdi!","😩 Bitta dona qoldi!","🤯 Qanday qilib?!","🥶 Sovuq dush!","📉 Ustunlik qo‘ldan ketdi!","🫥 Jim bo‘lib qoldim..."]],["🏆","G‘alaba",["🏆 Yutding!","🎉 G‘alaba!","👑 Men chempionman!","🔥 Zo‘r g‘alaba!","🥇 Birinchi o‘rin!","😎 Men aytgandim!","💪 Kuchlilar g‘alaba qozonadi!","🏳️ Taslim bo‘laman!","😅 Bu safar seniki!","🤝 Durang?","🥲 Keyingi safar yutaman!","🔄 Qayta o‘ynaymiz!","🏆 G‘alaba shirin!","👏 Munosib g‘alaba!","🎮 Yana bir partiya!"]],["⏳","Vaqt",["⏩ Tezroq yur!","⏰ Vaqt ketyapti!","🐢 Juda sekin!","⚡ Tezroq!","⌛ Kutib turibman!","🕐 Vaqting oz qoldi!","🏃 Qani, yur!","😴 Uxlab qoldingmi?","🤔 Hali ham o‘ylayapsanmi?","🚦 Navbat senda!","🔔 Yurish vaqti!","🧘 Shoshilma, lekin yur!","⏳ Vaqt tugayapti!","👀 Kutamiz...","⚡ Tezkor o‘yin!"]],["🤔","Hayrat",["🤔 O‘ylayapsanmi?","😳 Rostdanmi?","😮 Voy-bo‘!","🤯 Aql bovar qilmaydi!","🧐 Qiziq yurish!","👀 Buni kutmagandim!","😲 Qanday kombinatsiya!","🤨 Ishonching komilmi?","😱 Bunaqa ham bo‘ladimi?!","🫢 Kutilmagan yurish!","🧩 Rejangni tushunmadim!","🤔 Nima maqsad?","😏 Nimadir rejalashtiryapsan!","🕵️ Bir sir bor...","💭 O‘ylab ko‘ray..."]],["💪","Ruhlantirish",["💪 Sen uddalaysan!","🔥 Olg‘a!","🚀 To‘xtama!","🦁 Kurashni davom ettir!","🌟 Hammasi oldinda!","🙌 Ishon o‘zingga!","💯 Zo‘r ketyapsan!","🏆 G‘alabaga intil!","⚡ Kuchingni ko‘rsat!","🎯 Maqsad sari!","💪 Taslim bo‘lma!","🔥 Oxirigacha!","🌈 Hali imkon bor!","🧠 Aql bilan yut!","🥇 Chempion bo‘l!"]],["😎","Maqtanish",["😎 Shashka ustasi!","👑 Men qirolman!","🔥 Menga teng keladigani yo‘q!","🏆 G‘alaba meniki!","💪 Kuchimni ko‘rdingmi?","😏 Hammasi nazoratda!","🧠 Ustalik shu!","🥷 Sokin, lekin xavfli!","🎯 Bir zarbada!","👑 Maydon hukmdori!","😎 Professional daraja!","💎 Mening uslubim!","🚀 Darajam boshqa!","🦾 Kuchli o‘yinchi!","🏅 Tajriba gapiradi!"]],["🔁","Takliflar",["🤝 Durang?","🔄 Qayta o‘ynaymizmi?","🎮 Yana bir partiya?","⏸️ Biroz tanaffus?","🤔 Durangga rozimisan?","🔥 Yana bir jang!","🏆 Revansh qilamizmi?","🙌 Tayyor bo‘lsang, boshlaymiz!","🤜🤛 Kelishdik!","🔁 Yana urinib ko‘r!","🎯 Rematch?","🫱🏻‍🫲🏼 Kelishuv?","🕹️ O‘yinni davom ettiramiz!","💪 Ikkinchi raund?","👋 Keyingi safargacha!"]],["⚔️","Shashka",["♟️ Shashka ustasi!","👑 Dama bo‘ldi!","💥 Urib ol!","🔗 Zanjirli zarba!","🪤 Tuzoq tayyor!","🎯 Donani saqla!","🛡️ Himoyani mustahkamla!","⚔️ Hujum vaqti!","🔄 Donalarni almashtiramizmi?","🧩 Kombinatsiyani ko‘r!","🏃 Dama tomon yur!","👀 Donangni ehtiyot qil!","💎 Damani yo‘qotma!","🔥 Oxirgi donagacha!","🏆 Shashka — aql o‘yini!"]]];
    var elQ = root.querySelector("#rcQuick");
    elQ.style.cssText = "margin-top:6px";
    var tabs = document.createElement("div");
    tabs.style.cssText = "display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;align-items:center";
    var lab = document.createElement("div");
    lab.style.cssText = "font-size:12px;opacity:.7;margin-bottom:4px";
    var box = document.createElement("div");
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;max-height:112px;overflow-y:auto";
    function showCat(i) {
      box.innerHTML = "";
      lab.textContent = CATS[i][1];
      for (var k = 0; k < tabs.children.length; k++) tabs.children[k].style.background = k === i ? "#6b5cf0" : "";
      CATS[i][2].forEach(function (p) {
        var bt = document.createElement("button");
        bt.textContent = p; bt.style.cssText = "padding:7px 10px;border-radius:12px;font-size:14px";
        bt.onclick = function () { send({ type: "roomChat", roomId: roomId, text: p }); };
        box.appendChild(bt);
      });
    }
    CATS.forEach(function (c, i) {
      var t = document.createElement("button");
      t.textContent = c[0]; t.style.cssText = "flex:none;padding:6px 10px;border-radius:12px;font-size:18px";
      t.onclick = function () { showCat(i); };
      tabs.appendChild(t);
    });
    var xb = document.createElement("button");
    xb.textContent = "⬅️"; xb.style.cssText = "flex:none;padding:6px 12px;border-radius:12px;font-size:16px";
    xb.onclick = function () { elChatBtn.click(); };
    var hd = document.createElement("div"); hd.style.cssText = "display:flex;gap:6px;align-items:center"; tabs.style.flex = "1"; tabs.style.minWidth = "0"; hd.appendChild(xb); hd.appendChild(tabs);
    elQ.appendChild(hd); elQ.appendChild(lab); elQ.appendChild(box);
    showCat(0);
    elInput.addEventListener("keydown", function (e) { if (e.key === "Enter") sendChat(); });

    function addMsg(msg) {
      var row = document.createElement("div");
      var who = document.createElement("b");
      who.textContent = (msg.color === "white" ? "⚪ " : msg.color === "black" ? "⚫ " : "👁 ") + msg.name + ": ";
      who.style.color = msg.color === "spectator" ? "#8aa" : "#e3b746";
      var tx = document.createElement("span");
      tx.textContent = msg.text;
      row.appendChild(who); row.appendChild(tx);
      elMsgs.appendChild(row);
    }
    function renderChat() {
      if (st.vsBot) { elChatBtn.style.display = "none"; elChat.style.display = "none"; st._cbHid = true; return; }
      if (st._cbHid) { elChatBtn.style.display = ""; st._cbHid = false; if (typeof rcmChatVis === "function") rcmChatVis(); }
      elChat.style.display = st.chatOpen ? "" : "none";
      elChatBtn.textContent = "💬 Chat" + (st.unread ? " (" + st.unread + ")" : "");
    }
    function rebuildChat() {
      elMsgs.innerHTML = "";
      for (var i = 0; i < st.chat.length; i++) addMsg(st.chat[i]);
      elMsgs.scrollTop = elMsgs.scrollHeight;
    }

    // vaqt rejimi tugmalari (faqat o'yin boshlanmaguncha, faqat oq tanlaydi)
    function renderExtra() {
      var ex = root.querySelector("#rcEx");
      if (!ex) {
        ex = document.createElement("div"); ex.id = "rcEx";
        ex.style.cssText = "display:none;margin:4px 0 8px;padding:8px 12px;border-radius:10px;background:#1c2733;text-align:center;max-width:min(94vw,520px)";
        var s0 = root.querySelector("#rcStatus"); s0.parentNode.insertBefore(ex, s0.nextSibling);
      }
      ex.innerHTML = "";
      var spec = st.color === "spectator", ser = (st.gamesTotal || 1) > 1;
      function line(t) { var d = document.createElement("div"); d.style.margin = "4px 0"; d.textContent = t; ex.appendChild(d); }
      function btn(t, fn) { var b = document.createElement("button"); b.textContent = t; b.style.margin = "3px"; b.onclick = fn; ex.appendChild(b); }
      if (ser) {
        var sc = st.seriesScore || { white: 0, black: 0 };
        var no = Math.min((st.played || 0) + (st.finished ? 0 : 1), st.gamesTotal);
        line("🏁 Seriya " + (st.seriesDone ? "tugadi" : no + "/" + st.gamesTotal) + " · ⚪ " + sc.white + " – " + sc.black + " ⚫");
        if (st.finished && !st.seriesDone && st.nextIn) line("Keyingi o‘yin 5 soniyadan so‘ng, ranglar almashadi");
      }
      if (!spec && (st.casual || st.vsBot) && st.finished && st.white && st.black && (!ser || st.seriesDone)) {
        if (st.rematch === st.color) {
          line("⏳ Raqib javobi kutilmoqda…");
          btn("Bekor qilish", function () { send({ type: "roomRematchNo", roomId: roomId }); });
        } else if (st.rematch) {
          line("🔁 Raqib qayta o‘ynashni taklif qildi");
          btn("✅ Qabul", function () { send({ type: "roomRematch", roomId: roomId }); });
          btn("❌ Rad", function () { send({ type: "roomRematchNo", roomId: roomId }); });
        } else {
          btn("🔁 Qayta o‘ynash", function () { send({ type: "roomRematch", roomId: roomId }); });
        }
      }
      if (spec) { line("👁 Siz tomoshabinsiz"); btn("🏟 O‘yin zaliga o‘tish", function () { elZal.onclick(); }); }
      ex.style.display = ex.childNodes.length ? "block" : "none";
    }

    function renderTc() { try { renderExtra(); } catch (e) { console.error(e); }
      elTc.innerHTML = "";
      if (st.vsBot) { renderBotSetup(); return; }
      var canPick = st.color === "white" && st.moves.length === 0 && !st.finished;
      if (!canPick) { elTc.style.display = "none"; return; }
      elTc.style.display = "flex";
      st.tcs.forEach(function (tc) {
        var b = document.createElement("button");
        b.textContent = tc;
        b.style.cssText = tc === st.tc ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
        b.onclick = function () { send({ type: "roomSetTime", roomId: roomId, tc: tc }); };
        elTc.appendChild(b);
      });
      elTc.style.flexWrap = "wrap";
      var sep = document.createElement("span");
      sep.style.cssText = "flex-basis:100%;height:0";
      elTc.appendChild(sep);
      [["std", "📋 Standart"], ["idf", "🎲 IDF 780"]].forEach(function (pp) {
        var pb = document.createElement("button");
        pb.textContent = pp[1];
        var on = (pp[0] === "idf") === !!st.opening;
        pb.style.cssText = on ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
        pb.onclick = function () { send({ type: "roomSetPos", roomId: roomId, pos: pp[0] }); };
        elTc.appendChild(pb);
      });
      if (st.casual && (st.played || 0) === 0) {
        var sep2 = document.createElement("span");
        sep2.style.cssText = "flex-basis:100%;height:0";
        elTc.appendChild(sep2);
        [[1, "1 o‘yin"], [2, "2 o‘yin ⇄"], [4, "4 o‘yin ⇄"]].forEach(function (g) {
          var gb = document.createElement("button");
          gb.textContent = g[1];
          gb.style.cssText = (st.gamesTotal || 1) === g[0] ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
          gb.onclick = function () { send({ type: "roomSetGames", roomId: roomId, games: g[0] }); };
          elTc.appendChild(gb);
        });
      }
    }

    // ---------- yordamchilar ----------
    function myCode() { return st.color === "white" ? WHITE : BLACK; }
    function codeOf(color) { return color === "white" ? WHITE : BLACK; }
    function sideName(color) { return color === "white" ? "Oq" : "Qora"; }
    function flipped() { return st.color === "black"; }
    function bothIn() { return !!(st.white && st.black); }

    function computeForced(step) {
      // yurishdan keyin shu dona yana urishi kerakmi
      if (!step || !step.captures || !step.captures.length) return null;
      var p = st.board[step.to.r][step.to.c];
      if (!p) return null;
      var pc = isWhite(p) ? "white" : "black";
      if (pc !== st.turn) return null;
      return captureSteps(st.board, step.to.r, step.to.c).length ? { r: step.to.r, c: step.to.c } : null;
    }

    function rebuild() {
      var b = startBoard();
      for (var i = 0; i < st.moves.length; i++) b = applyStep(b, st.moves[i]);
      st.board = b;
      st.forced = computeForced(st.moves[st.moves.length - 1]);
      st.selected = null;
      st.pending = false;
    }

    function send(obj) {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
    }

    function options() {
      // tanlangan dona uchun mumkin bo'lgan yurishlar
      if (!st.selected) return [];
      var caps = allCaptures(st.board, myCode());
      return caps.length
        ? captureSteps(st.board, st.selected.r, st.selected.c)
        : simpleSteps(st.board, st.selected.r, st.selected.c);
    }

    // ---------- chizish ----------
    function nameLine(color) {
      var nm = st[color], on = st[color + "Online"];
      var dot = color === "white" ? "⚪" : "⚫";
      return dot + " " + (nm ? (on ? "🟢 " : "🔴 ") + nm : "kutilmoqda…") +
        (st.color === color ? "  (siz)" : "");
    }

    // ismi chapda, soat o'ngda
    function fillLine(el, color) {
      el.innerHTML = "";
      el.style.display = "flex";
      el.style.justifyContent = "space-between";
      el.style.alignItems = "center";
      var l = document.createElement("span");
      var _inf = color === "white" ? st.wInfo : st.bInfo, _nm = (color === "white" ? st.white : st.black) || "?";
      l.style.cssText = "display:flex;align-items:center;gap:7px;min-width:0";
      function _letter() {
        var d = document.createElement("span"); d.textContent = (Array.from(String(_nm))[0] || "?").toUpperCase();
        d.style.cssText = "width:30px;height:30px;border-radius:50%;background:#3b3f8f;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;flex:none";
        return d;
      }
      if (_inf && _inf.uid) {
        if (_inf.av) {
          var _im = document.createElement("img"); _im.src = "/api/av/" + encodeURIComponent(_inf.uid);
          _im.style.cssText = "width:30px;height:30px;border-radius:50%;object-fit:cover;flex:none;background:#2a2f55";
          _im.onerror = function () { if (_im.parentNode) _im.parentNode.replaceChild(_letter(), _im); };
          l.appendChild(_im);
        } else l.appendChild(_letter());
      }
      var _tx = document.createElement("span"); _tx.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0";
      _tx.textContent = nameLine(color) + (st.berserk && st.berserk[color] ? " ⚡" : "");
      l.appendChild(_tx);
      if (_inf && _inf.elo) { var _eb = document.createElement("span"); _eb.textContent = "⭐" + _inf.elo; _eb.style.cssText = "color:#ffd86b;font-size:13px;font-weight:bold;flex:none"; l.appendChild(_eb); }
      var r = document.createElement("span");
      r.setAttribute("data-clock", color);
      r.style.cssText = "font-weight:bold;min-width:64px;text-align:center;padding:3px 8px;border-radius:6px;background:#1c2733";
      el.appendChild(l);
      el.appendChild(r);
    }

    function remaining(color) {
      var ms = st.clock[color] || 0;
      if (st.clockRunning && !st.finished && st.turn === color) ms -= performance.now() - st.clockAt;
      return Math.max(0, ms);
    }

    function fmt(ms) {
      if (st && st.vsBot) return "∞";
      var sec = Math.ceil(ms / 1000), m = Math.floor(sec / 60), s = sec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function updateClocks() {
      var els = root.querySelectorAll("[data-clock]");
      for (var i = 0; i < els.length; i++) {
        var color = els[i].getAttribute("data-clock"), ms = remaining(color);
        els[i].textContent = fmt(ms);
        var active = st.clockRunning && !st.finished && st.turn === color;
        els[i].style.background = active ? (ms < 30000 ? "#7a1f1f" : "#2b4a1f") : "#1c2733";
        els[i].style.color = ms < 30000 && active ? "#ffb4b4" : "#fff";
      }
    }

    function setClock(clock, running) {
      if (clock) st.clock = clock;
      st.clockRunning = !!running;
      st.clockAt = performance.now();
    }

    // ---------- platforma doskasi uslubi (mavzu, dona, qirol) ----------
    var themeCssDone = false;
    function cloneThemeCss() {
      if (themeCssDone) return;
      var css = "";
      try {
        for (var i = 0; i < document.styleSheets.length; i++) {
          var rules;
          try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
          for (var j = 0; j < rules.length; j++) {
            var t = rules[j].cssText || "";
            if (t.indexOf("#board[") === 0) css += t.replace(/#board\[/g, "#rcBoard[") + "\n";
          }
        }
      } catch (e) {}
      if (/edeon/.test(css)) themeCssDone = true;
    if (css) {
      var old = document.getElementById("rcThemeCss"); if (old) old.remove();
      var el = document.createElement("style"); el.id = "rcThemeCss";
      el.textContent = css;
        document.head.appendChild(el);
      }
    }

    function applySkin() {
      cloneThemeCss();
      var th = "edeon", ps = "glossy", km = "\u265B", pz = "80";
      try {
        if (typeof S === "object" && S) { th = S.th || th; ps = S.ps || ps; km = S.km || km; pz = S.pz || pz; }
      } catch (e) {}
      if (!/^(classic|green|blue|gray|walnut|purple|sand|ocean|rose|olive|photo|edeon)$/.test(th)) th = "edeon";
      elBoard.dataset.th = th;
      elBoard.dataset.ps = ps;
      elBoard.style.setProperty("--km", "'" + km + "'");
      elBoard.style.setProperty("--pz", pz + "%");
    }

    function render() {
      var fl = flipped();
      var topColor = fl ? "white" : "black";
      var bottomColor = fl ? "black" : "white";
      fillLine(elTop, topColor);
      fillLine(elBottom, bottomColor);
      updateClocks();

      var opts = options();
      applySkin();
      var lastMv = st.moves.length ? st.moves[st.moves.length - 1] : null;
      elBoard.innerHTML = "";
      for (var dr = 0; dr < 8; dr++) {
        for (var dc = 0; dc < 8; dc++) {
          var r = fl ? 7 - dr : dr, c = fl ? 7 - dc : dc;
          var cell = document.createElement("div");
          cell.className = "cell sq " + (((r + c) % 2) ? "d" : "l");
          cell.dataset.r = r; cell.dataset.c = c;
          if (lastMv && lastMv.from && lastMv.to &&
              ((lastMv.from.r === r && lastMv.from.c === c) || (lastMv.to.r === r && lastMv.to.c === c))) cell.classList.add("lm");
          if (st.selected && st.selected.r === r && st.selected.c === c) cell.classList.add("sel");
          for (var k = 0; k < opts.length; k++) {
            if (opts[k].to.r === r && opts[k].to.c === c) cell.classList.add(opts[k].captures.length ? "cp" : "tg");
          }
          var p = st.board[r][c];
          if (p) {
            var pc = document.createElement("i");
            pc.className = "piece pc " + (isWhite(p) ? "w" : "b") + (isKing(p) ? " k" : "");
            cell.appendChild(pc);
          }
          elBoard.appendChild(cell);
        }
      }

      // holat matni
      var t;
      if (!st.connected) t = "🔌 Ulanmoqda… (server uyg‘onishi 50 soniyagacha cho‘zilishi mumkin)";
      else if (!st.joined) t = "⏳ Xonaga kirilmoqda…";
      else if (st.finished) {
        var tm = st.reason === "timeout" ? "⏰ Vaqt tugadi · " : "";
        if (st.winner === "draw") t = st.drawText ? "🤝 " + st.drawText : "🤝 Durang (kelishildi)";
        else if (st.color === "spectator") t = tm + "🏆 " + sideName(st.winner) + " g‘alaba qozondi";
        else t = tm + (st.winner === st.color ? "🏆 Siz g‘alaba qozondingiz!" : "😔 Siz yutqazdingiz");
      }
      else if (st.vsBot && !st.botStarted && st.color !== "spectator") t = "⚙️ Vaqt, rang va pozitsiyani tanlang, so‘ng ‘Boshlash’ ni bosing";
      else if (!bothIn()) t = "⏳ Raqib kutilmoqda…";
      else if (st.color === "spectator") t = "👁 Tomoshabin · navbat: " + sideName(st.turn);
      else if (st.turn === st.color) t = st.forced ? "🔴 Yana urish majburiy!" : "✅ Sizning navbatingiz";
      else t = "⏳ Raqib yurishi kutilmoqda";
      elStatus.textContent = t;

      // doska tepasida durang sanog'i (3 damka, 1 damka va boshqa holatlar)
      if (st.drawInfo && !st.finished && st.joined) {
        var di = st.drawInfo;
        elDrawInfo.textContent = "🤝 Durang sanog‘i: " + di.used + "/" + di.limit +
          (di.side ? " · " + (di.side === "white" ? "⚪" : "⚫") + " yurishlari" : " yurish");
        elDrawInfo.style.display = "";
      } else elDrawInfo.style.display = "none";

      var playing = st.color !== "spectator" && !st.finished && bothIn();
      elResign.style.display = playing ? "" : "none";
      var _tb = document.getElementById("rcAn");
      if (!_tb) {
        _tb = document.createElement("button"); _tb.id = "rcAn"; _tb.textContent = "🔍 Tahlil";
        elResign.parentNode.appendChild(_tb);
        _tb.onclick = function () { window.spBoardOpen({ moves: st.moves, white: nameLine("white"), black: nameLine("black"), winner: st.winner }); };
      }
      _tb.style.display = (st.finished && st.moves.length) ? "" : "none";
      elDrawOffer.style.display = (playing && st.moves.length >= 2 && st.canDraw && !st.drawOffer) ? "" : "none";
      var canBz = playing && st.arena && !st.noBerserk && st.berserk && !st.berserk[st.color] &&
        (st.color === "white" ? st.moves.length === 0 : st.moves.length <= 1);
      elBerserk.style.display = canBz ? "" : "none";
      if (!st.finished && st.drawOffer && st.color !== "spectator") {
        elDraw.style.display = "";
        var mine = st.drawOffer === st.color;
        elDrawText.textContent = mine ? "🤝 Durang taklif qildingiz. Raqib javobi kutilmoqda…" : "🤝 Raqib durang taklif qilmoqda";
        root.querySelector("#rcDrawYes").style.display = mine ? "none" : "";
        root.querySelector("#rcDrawNo").style.display = mine ? "none" : "";
      } else elDraw.style.display = "none";
      renderTc();
      renderChat();
      elInfo.textContent = (st.color === "spectator"
        ? "Siz tomoshabinsiz" + (st.spectators ? " · " + st.spectators + " ta tomoshabin" + ((st.specNames || []).length ? " (" + st.specNames.join(", ") + ")" : "") : "")
        : (st.spectators ? "👁 Tomoshabinlar: " + st.spectators + ((st.specNames || []).length ? " (" + st.specNames.join(", ") + ")" : "") : "")) +
        (bothIn() && !st.finished && !st.clockRunning && !st.vsBot && st.timeMs
          ? (st.spectators || st.color === "spectator" ? "\n" : "") + "⏱ " + st.tc + " (daqiqa + soniya) · soat birinchi ikki yurishdan keyin ishga tushadi"
          : "");
      elInfo.style.whiteSpace = "pre-line"; document.body.classList.toggle("rcPlaying", st.color !== "spectator" && !st.finished && (st.moves || []).length > 0);
      if (st.opening) elInfo.textContent = "📖 IDF " + st.opening.id + (elInfo.textContent ? "\n" + elInfo.textContent : "");
      if (false && st.vsBot && st.botNote) elInfo.textContent += (elInfo.textContent ? "\n" : "") + st.botNote;
    }

    // ---------- bosish ----------
    elBoard.addEventListener("click", function (e) {
      var cell = e.target.closest(".cell");
      if (!cell) return;
      onCell(Number(cell.dataset.r), Number(cell.dataset.c));
    });

    function onCell(r, c) {
      if (!st.joined || st.finished || st.pending || (st.vsBot && !st.botStarted)) return;
      if (st.color === "spectator" || !bothIn()) return;
      if (st.turn !== st.color) return;
      var me = myCode(), p = st.board[r][c], mv;

      if (st.forced) {
        var fo = captureSteps(st.board, st.forced.r, st.forced.c);
        for (var i = 0; i < fo.length; i++) if (fo[i].to.r === r && fo[i].to.c === c) mv = fo[i];
        if (mv) sendMove(mv);
        return;
      }

      if (sameSide(p, me)) {
        var caps = allCaptures(st.board, me);
        var ok = caps.length ? captureSteps(st.board, r, c).length : simpleSteps(st.board, r, c).length;
        st.selected = ok ? { r: r, c: c } : null;
        render();
        return;
      }

      var o = options();
      for (var j = 0; j < o.length; j++) if (o[j].to.r === r && o[j].to.c === c) mv = o[j];
      if (mv) sendMove(mv);
    }

    function sendMove(mv) {
      var nb = applyStep(st.board, mv);
      var keep = mv.captures.length > 0 && captureSteps(nb, mv.to.r, mv.to.c).length > 0;
      st.pending = true;
      send({ type: "roomMove", roomId: roomId, move: mv, keepTurn: keep });
      st.optim = true; st.optN = (st.optN || 0) + 1; try { soundForMove(mv, st.board[mv.from.r] && st.board[mv.from.r][mv.from.c]); } catch (e) {} st.board = nb; st.selected = null;
      if (keep) { st.forced = { r: mv.to.r, c: mv.to.c }; st.pending = false; } else { st.forced = null; }
      try { render(); } catch (e) {}
      try { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light"); } catch (e) {}
    }

    // ---------- 🤖 ShashkaBot: yurishni shu telefon hisoblaydi (AI so'rovi), server faqat uzatadi ----------
    var botBusy = false;

    function renderBotSetup() {
      if (st.color === "spectator" || st.botStarted || st.finished) { elTc.style.display = "none"; return; }
      elTc.style.display = "flex";
      elTc.style.flexWrap = "wrap";
      function lab(t) {
        var d = document.createElement("div");
        d.style.cssText = "flex-basis:100%;text-align:center;font-size:13px;opacity:.75;margin-top:4px";
        d.textContent = t; elTc.appendChild(d);
      }
      function btn(t, on, fn) {
        var b = document.createElement("button");
        b.textContent = t;
        b.style.cssText = on ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
        b.onclick = fn; elTc.appendChild(b);
      }
      lab("⏱ Vaqt (daqiqa + soniya)");
      (st.tcs || []).forEach(function (tc) {
        btn(tc, tc === st.tc, function () { send({ type: "roomSetTime", roomId: roomId, tc: tc }); });
      });
      lab("🎨 Dona rangi");
      [["white", "⚪ Oq"], ["black", "⚫ Qora"], ["random", "🎲 Tasodifiy"]].forEach(function (c) {
        btn(c[1], c[0] === st.color, function () { send({ type: "roomSetColor", roomId: roomId, color: c[0] }); });
      });
      lab("📖 Boshlang‘ich holat");
      [["std", "📋 Standart"], ["idf", "🎲 IDF 780"]].forEach(function (pp) {
        btn(pp[1], (pp[0] === "idf") === !!st.opening, function () { send({ type: "roomSetPos", roomId: roomId, pos: pp[0] }); });
      });
      var go = document.createElement("button");
      go.textContent = "▶️ Boshlash";
      go.style.cssText = "flex-basis:100%;margin-top:10px;padding:12px 28px;font-size:18px;font-weight:bold;background:#2e7d32;color:#fff;border-radius:14px";
      go.onclick = function () { send({ type: "roomBotStart", roomId: roomId }); };
      elTc.appendChild(go);
    }

    // doska -> AI uchun 64 katakli massiv (oq musbat: 1 dona, 2 dama; qora manfiy)
    function flatBoard(b) {
      var a = [];
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        var p = b[r][c];
        a.push(p === 1 ? 1 : p === 3 ? 2 : p === 2 ? -1 : p === 4 ? -2 : 0);
      }
      return a;
    }

    // AI javobi (from/to katak raqami) -> mavjud qonuniy yurish
    function pickLegal(legal, j, rot) {
      var f = rot ? 63 - j.from : j.from, t = rot ? 63 - j.to : j.to;
      var hit = [];
      for (var i = 0; i < legal.length; i++) {
        var m = legal[i];
        if (m.from.r === (f >> 3) && m.from.c === (f & 7) && m.to.r === (t >> 3) && m.to.c === (t & 7)) hit.push(m);
      }
      if (!hit.length) return null;
      for (var k = 0; k < hit.length; k++) if (hit[k].captures.length === j.jumps) return hit[k];
      return hit[0];
    }

    // ketma-ket urish: har bir qadamni o'yin qoidalari (captureSteps/applyStep) bo'yicha tiklaymiz
    function chain(b, pos, to, need, acc) {
      var opts = captureSteps(b, pos.r, pos.c);
      if (!opts.length) return (acc.length === need && pos.r === to.r && pos.c === to.c) ? acc : null;
      for (var i = 0; i < opts.length; i++) {
        var res = chain(applyStep(b, opts[i]), opts[i].to, to, need, acc.concat([opts[i]]));
        if (res) return res;
      }
      return null;
    }
    function stepsOf(mv) {
      if (!mv.captures.length) return [{ from: mv.from, to: mv.to, captures: [] }];
      return chain(st.board, mv.from, mv.to, mv.captures.length, []);
    }

    function safePool(legal, side) {
      var shuffled = legal.slice().sort(function () { return Math.random() - 0.5; });
      try {
        var b0 = st.board;
        if (!Array.isArray(b0) || !Array.isArray(b0[0])) return shuffled;
        var oppCode = codeOf(side === "white" ? "black" : "white");
        var safe = shuffled.filter(function (mv) {
          try {
            var b = b0.map(function (row) { return row.slice(); });
            var empty = b[mv.to.r][mv.to.c];
            var p = b[mv.from.r][mv.from.c];
            b[mv.from.r][mv.from.c] = empty;
            (mv.captures || []).forEach(function (x) { b[x.r][x.c] = empty; });
            b[mv.to.r][mv.to.c] = p;
            var om = allMoves(b, oppCode);
            return !(om.length && om[0].captures && om[0].captures.length);
          } catch (e) { return true; }
        });
        return safe.length ? safe : shuffled;
      } catch (e) { return shuffled; }
    }
    function botThink(cb) {
      var side = st.botColor, legal = allMoves(st.board, codeOf(side));
      if (!legal.length) return cb(null);
      var t0 = Date.now(), done = false;
      var secs = Math.max(0.05, Math.min(st.botSecs, remaining(side) / 1000 / 15));
      if (st.botBlunder > 0 && legal.length > 1 && Math.random() < st.botBlunder) {   // yengil botlar ba'zan tasodifiy yuradi
        done = true;
        var pool0 = safePool(legal, side), st0 = null;
        for (var i0 = 0; i0 < pool0.length && !st0; i0++) st0 = stepsOf(pool0[i0]);
        st.botNote = "🤖 tasodifiy yurish";
        return setTimeout(function () { cb(st0); }, 450);
      }
      function finishWith(mv, note) {
        if (done) return; done = true;
        var steps = mv ? stepsOf(mv) : null;
        if (!steps) {   // zaxira: tasodifiy qonuniy yurish
          note = "🤖 zaxira yurish (AI javobi mos kelmadi)";
          var pool = legal.slice().sort(function () { return Math.random() - 0.5; });
          for (var i = 0; i < pool.length && !steps; i++) steps = stepsOf(pool[i]);
        }
        st.botNote = note || "";
        setTimeout(function () { cb(steps); }, Math.max(0, 450 - (Date.now() - t0)));
      }
      var ctl = window.AbortController ? new AbortController() : null;
      var to = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) {} finishWith(null, "🤖 zaxira yurish (AI kechikdi)"); }, (secs + 6) * 1000);
      try {
        fetch("/api/ai/move", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-init-data": (tg && tg.initData) || "" },
          body: JSON.stringify({ board: flatBoard(st.board), side: side === "white" ? 1 : -1, time: secs }),
          signal: ctl ? ctl.signal : undefined
        }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          clearTimeout(to);
          var mv = null;
          if (j && typeof j.from === "number" && typeof j.to === "number") mv = pickLegal(legal, j, false) || pickLegal(legal, j, true);
          finishWith(mv, mv ? "🤖 KestoG" + (j.ms ? " · " + j.ms + " ms" : "") : "🤖 zaxira yurish (AI javobi mos kelmadi)");
        }).catch(function () { clearTimeout(to); finishWith(null, "🤖 zaxira yurish (AI ishlamadi)"); });
      } catch (e) { clearTimeout(to); finishWith(null, "🤖 zaxira yurish (AI ishlamadi)"); }
    }

    function botKick() {
      if (botBusy) return;
      if (!st.vsBot || !st.botStarted || !st.joined || st.finished || st.color === "spectator") return;
      if (!st.botColor || st.turn !== st.botColor || !bothIn()) return;
      botBusy = true;
      var n0 = st.moves.length;
      botThink(function (steps) {
        if (!steps || !steps.length || st.finished || st.moves.length !== n0 || st.turn !== st.botColor) { botBusy = false; return; }
        var i = 0;
        (function next() {
          if (st.finished) { botBusy = false; return; }
          var s = steps[i++], more = i < steps.length;
          send({ type: "roomBotMove", roomId: roomId, move: s, keepTurn: more });
          if (more) setTimeout(next, 700); else { botBusy = false; try { render(); } catch (e) {} }
        })();
      });
    }

    // ---------- server ----------
    var _azT = null, _azBox = null;
    function autoZalStop() {
      clearInterval(_azT); _azT = null;
      if (_azBox && _azBox.parentNode) _azBox.parentNode.removeChild(_azBox);
      _azBox = null;
    }
    function autoZalStart() {
      autoZalStop();
      if (st.vsBot || st.gamesTotal > 1) return;   // bot bilan o'yinda zalga avtomatik qaytmaymiz (qayta o'ynash bor)
      if (typeof elZal === "undefined" || !elZal || !elZal.onclick) return;
      var n = 10;
      _azBox = document.createElement("div");
      _azBox.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:2147483000;background:#1c2733;color:#fff;border:1px solid #2a3647;border-radius:12px;padding:10px 14px;font:14px Arial,sans-serif;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,.4)";
      var tx = document.createElement("span"), bt = document.createElement("button");
      bt.textContent = "Qolish";
      bt.style.cssText = "background:#3b3f8f;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-size:14px";
      bt.onclick = autoZalStop;
      _azBox.appendChild(tx); _azBox.appendChild(bt); document.body.appendChild(_azBox);
      function upd() { tx.textContent = "🏟 " + n + " soniyadan keyin zalga qaytasiz"; }
      upd();
      _azT = setInterval(function () {
        if (!st.finished) { autoZalStop(); return; }
        n--;
        if (n <= 0) { autoZalStop(); try { elZal.onclick(); } catch (e) {} } else upd();
      }, 1000);
    }
    function onMessage(m) {
      if (m.type === "error" && st.optim) { st.optim = false; st.optN = 0; st.pending = false; st.forced = null; send({ type: "roomSync", roomId: roomId }); }
      if (m.type === "roomState" && m.roomId === roomId && !m.finished) { try { window.__coinClear(); } catch (e) {} }
      if (m.type === "roomState" && m.roomId === roomId) {
        st.optim = false;
        st.joined = true;
        st.color = m.color;
        st.white = m.white; st.black = m.black; st.wInfo = m.wInfo || null; st.bInfo = m.bInfo || null;
        st.whiteOnline = m.whiteOnline; st.blackOnline = m.blackOnline;
        st.spectators = m.spectators || 0;
        st.specNames = m.spectatorNames || [];
        st.gamesTotal = m.gamesTotal || 1; st.played = m.played || 0; st.seriesScore = m.seriesScore || null;
        st.seriesDone = !!m.seriesDone; st.nextIn = !!m.nextIn; st.rematch = m.rematch || null; st.casual = !!m.casual; st.vsBot = !!m.vsBot; try { renderChat(); } catch (e) {} st.botStarted = !!m.botStarted; st.botColor = m.botColor || null; st.botSecs = Number(m.botSecs) > 0 ? Number(m.botSecs) : 1.2; st.botBlunder = Number(m.botBlunder) || 0;
        var openNew = (m.opening ? m.opening.id : null) !== (st.opening ? st.opening.id : null);
        st.opening = m.opening || null;
        var same = !openNew && st.moves.length === (m.moves || []).length && st.turn === m.turn;
        st.moves = m.moves || [];
        st.turn = m.turn;
        st.finished = !!m.finished;
        st.winner = m.winner;
        st.reason = m.reason || null;
        st.timeMs = m.timeMs || 0;
        st.incMs = m.incMs || 0;
        st.tc = m.tc || "";
        st.tcs = m.tcs || [];
        st.drawOffer = m.drawOffer || null;
        st.drawInfo = m.drawInfo || null; st.drawText = m.drawText || null; st.canDraw = !!m.canDraw;
        st.arena = !!m.arena;
        st.berserk = m.berserk || { white: false, black: false };
        st.noBerserk = !!m.noBerserk;
        if (m.chat) { st.chat = m.chat; rebuildChat(); }
        setClock(m.clock, m.clockRunning);
        if (!same) rebuild();   // yurishlar o'zgarmagan bo'lsa, tanlov saqlanadi
        render();
        botKick();
      } else if (m.type === "roomMove" && m.roomId === roomId) {
        st.moves.push(m.move);
        if (m.drawInfo !== undefined) st.drawInfo = m.drawInfo;
        st.canDraw = !!m.canDraw;
        var _own = m.color === st.color && st.optN > 0; if (_own) st.optN--;
        var _pp = st.board[m.move.from.r] && st.board[m.move.from.r][m.move.from.c];
        if (!_own) st.board = applyStep(st.board, m.move);
        if (!_own) soundForMove(m.move, _pp);
        st.turn = m.turn;
        setClock(m.clock, m.clockRunning);
        st.pending = false;
        st.selected = null;
        if (!_own) st.forced = computeForced(m.move);
        render();
        // navbat o'tgan bo'lsa va yurish qolmagan bo'lsa — o'yin tugaydi
        if (m.turn !== m.color && st.color !== "spectator" && !st.finished) {
          if (!allMoves(st.board, codeOf(m.turn)).length) {
            send({ type: "roomFinish", roomId: roomId, winner: m.color });
          }
        }
        botKick();
      } else if (m.type === "roomDraw" && m.roomId === roomId) {
        st.drawOffer = m.offer || null;
        if (m.declined) elInfo.textContent = "❌ Durang taklifi rad etildi";
        render();
        if (m.declined) elInfo.textContent = "❌ Durang taklifi rad etildi";
      } else if (m.type === "roomBerserk" && m.roomId === roomId) {
        st.berserk[m.color] = true;
        setClock(m.clock, st.clockRunning);
        render();
      } else if (m.type === "roomChat" && m.roomId === roomId) {
        st.chat.push(m.msg);
        if (st.chat.length > 50) st.chat.shift();
        addMsg(m.msg);
        if (st.chatOpen) elMsgs.scrollTop = elMsgs.scrollHeight;
        else { st.unread++; renderChat(); }
      } else if (m.type === "botCoins" && m.roomId === roomId) { try { window.__coinFx(m.n); } catch (e) {}
      } else if (m.type === "roomFinished" && m.roomId === roomId) {
        autoZalStart();
        st.finished = true;
        st.drawOffer = null;
        st.drawInfo = null; st.drawText = m.text || null;
        st.winner = m.winner;
        st.reason = m.reason || null;
        setClock(m.clock, false);
        render();
        try { if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success"); } catch (e) {}
      } else if (m.type === "error") {
        st.pending = false;
        elInfo.textContent = "⚠️ " + (m.message || "Xato");
      }
    }

    function connect() {
      var proto = location.protocol === "https:" ? "wss://" : "ws://";
      try { ws = new WebSocket(proto + location.host); } catch (e) { return setTimeout(connect, 3000); }
      ws.onopen = function () {
        st.connected = true;
        var name = "";
        try { name = tg.initDataUnsafe.user.first_name || ""; } catch (e) {}
        send({
          type: "roomJoin", roomId: roomId,
          initData: (tg && tg.initData) || "",
          name: name || ("Mehmon-" + gid.slice(0, 3).toUpperCase()),
          guestId: gid
        });
        render();
      };
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        onMessage(m);
      };
      ws.onclose = function () {
        st.connected = false; st.joined = false; st.pending = false;
        render();
        setTimeout(connect, 2500);
      };
      ws.onerror = function () { try { ws.close(); } catch (e) {} };
    }

    hb = setInterval(function () { send({ type: "roomSync", roomId: roomId }); }, 25000);
    setInterval(updateClocks, 250);
    render();
    connect();
  }
})();

;(function () {
  if (window.spAnalyze) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function start() {
    var b = [], r, c;
    for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) b[r].push(r < 3 && (r + c) % 2 ? 2 : (r > 4 && (r + c) % 2 ? 1 : 0)); }
    return b;
  }
  function apply(b, m) {
    var n = b.map(function (x) { return x.slice(); }), p = n[m.from.r][m.from.c];
    n[m.from.r][m.from.c] = 0;
    (m.captures || []).forEach(function (x) { n[x.r][x.c] = 0; });
    if (p === 1 && m.to.r === 0) p = 3;
    if (p === 2 && m.to.r === 7) p = 4;
    n[m.to.r][m.to.c] = p;
    return n;
  }
  window.spAnalyze = function (g) {
    var mv = g.moves || [], bs = [start()], i;
    for (i = 0; i < mv.length; i++) bs.push(apply(bs[i], mv[i]));
    var cur = mv.length, auto = null, spd = 1, flip = false;
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    function startAuto() {
      stopAuto();
      if (cur >= mv.length) cur = 0;
      auto = setInterval(function () {
        if (!document.body.contains(ov)) { stopAuto(); return; }
        if (cur < mv.length) { cur++; draw(); } else { stopAuto(); draw(); }
      }, 1500 / spd);
    }
    var old = document.getElementById('spAn'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spAn';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    var res = g.winner === 'white' ? '🏆 ⚪ ' + esc(g.white) : g.winner === 'black' ? '🏆 ⚫ ' + esc(g.black) : '🤝 Durang';
    function draw() {
      var b = bs[cur], m = cur > 0 ? mv[cur - 1] : null, h = '', r, c, p, bg, hl;
      if (flip) { b = b.slice().reverse().map(function (x) { return x.slice().reverse(); }); if (m) m = { from: { r: 7 - m.from.r, c: 7 - m.from.c }, to: { r: 7 - m.to.r, c: 7 - m.to.c } }; }
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>🔍 Tahlil</b><button id="anX" style="border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff;font-size:16px">⬅️</button></div>';
      h += '<div style="font-size:14px;margin-bottom:8px">⚪ ' + esc(g.white) + ' — ⚫ ' + esc(g.black) + '<br><span style="opacity:.8">' + res + '</span></div>';
      h += '<div style="width:min(94vw,480px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #8a4a1c;border-radius:6px;overflow:hidden">';
      for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
        bg = (r + c) % 2 ? '#7b2f13' : '#f3bb86';
        hl = m && ((m.from.r === r && m.from.c === c) || (m.to.r === r && m.to.c === c)) ? 'box-shadow:inset 0 0 0 3px #f5d92b;' : '';
        p = b[r][c];
        h += '<div style="background:' + bg + ';' + hl + 'display:flex;align-items:center;justify-content:center">';
        if (p) {
          var white = p === 1 || p === 3;
          var _im = window.spPcImg ? window.spPcImg(p) : '';
          if (_im) h += '<div style="width:88%;height:88%;background:url(' + _im + ') center/contain no-repeat;filter:drop-shadow(0 3px 2px #0007)"></div>';
          else h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (white ? '#9a9a9a' : '#000') + ';background:' + (white ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      h += '<div id="anL" style="margin:10px 0;font-size:15px">Yurish: ' + cur + ' / ' + mv.length + '</div>';
      h += '<div style="display:flex;gap:8px;justify-content:center">';
      var bst = 'border:0;border-radius:14px;padding:12px 18px;background:#6b5cf0;color:#fff;font-size:20px';
      h += '<button id="an0" style="' + bst + '">⏮</button><button id="an1" style="' + bst + '">◀</button><button id="an2" style="' + bst + '">▶</button><button id="an3" style="' + bst + '">⏭</button></div>';
      h += '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button id="anP" style="' + bst + '">' + (auto ? '⏸ To‘xta' : '▶️ Avto') + '</button><button id="anS" style="' + bst + '">' + spd + '×</button><button id="anF" style="' + bst + '">🔄</button></div>';
      h += '<input id="anR" type="range" min="0" max="' + mv.length + '" value="' + cur + '" style="width:min(86vw,420px);margin-top:14px">';
      ov.innerHTML = h;
      ov.querySelector('#anX').onclick = function () { stopAuto(); ov.remove(); };
      ov.querySelector('#an0').onclick = function () { cur = 0; draw(); };
      ov.querySelector('#an1').onclick = function () { if (cur > 0) cur--; draw(); };
      ov.querySelector('#an2').onclick = function () { if (cur < mv.length) cur++; draw(); };
      ov.querySelector('#an3').onclick = function () { cur = mv.length; draw(); };
      ov.querySelector('#anP').onclick = function () { if (auto) stopAuto(); else startAuto(); draw(); };
      ov.querySelector('#anS').onclick = function () { spd = spd % 3 + 1; if (auto) startAuto(); draw(); };
      ov.querySelector('#anF').onclick = function () { flip = !flip; draw(); };
      var rg = ov.querySelector('#anR');
      rg.oninput = function () { var l = ov.querySelector('#anL'); if (l) l.textContent = 'Yurish: ' + rg.value + ' / ' + mv.length; };
      rg.onchange = function () { cur = Number(rg.value); draw(); };
    }
    draw();
  };
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
