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
    // ekranning istalgan joyiga tegilsa tanga yo'qoladi (ekranda qolib ketmasin)
    setTimeout(function(){ var off=function(){ document.removeEventListener('pointerdown',off,true); try{ if(d.parentNode) d.remove(); }catch(e){} }; document.addEventListener('pointerdown',off,true); },700);
  };
})();
/* roomclient.js — guruh o'yini (xona) rejimi.
   Faqat Telegram havolasidan (startapp=XONA) yoki ?room=XONA bilan ochilganda ishlaydi.
   Oddiy ochilganda hech narsa qilmaydi. index.html dagi qoidalar funksiyalaridan foydalanadi. */
(function () {
  "use strict";

  var ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
  var q = new URLSearchParams(location.search);
  // 🪟 zal ichidagi oynada bo'lsa — sahifani qayta yuklamay, oynani yopamiz
  function rcLeave() { try { if (window.__spEmb && window.parent !== window && window.parent.rcClose) { window.parent.rcClose(); return; } } catch (e) {} try { var _w = window.Telegram && window.Telegram.WebApp, _u = (_w && _w.initDataUnsafe) || {}; if (_u.start_param) sessionStorage.setItem("spSpLeft", _u.start_param + "|" + (_u.hash || "")); } catch (e) {} location.href = location.pathname; }   // havola (startapp) xonasidan zalga: index.html dagi qo'riqchi o'sha xonani qayta ochmaydi

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
    // ?room= (o'yinga o'tish) Telegram start_param dan ustun: aks holda eski havola/turnir havolasi o'yinni bosib ketadi
    // 🧠 Xotira havolasi (mm_KOD): shashka/AI doskasi emas — Xotira o'yinini ochamiz
    try { var _sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || ""; var _du = /^du_(gomoku|go|chess|pod)_([A-Z0-9]{6})$/i.exec(_sp); if (!q.get("room") && /^rp_[A-Z0-9]{6}$/i.test(_sp)) _du = ["", "__rp", _sp.slice(3)]; if (!q.get("room") && (/^ug_[A-Z0-9]{6}$/i.test(_sp) || _du)) { var _ugGo = function () { if (document.getElementById("ugOv")) return; var o = document.createElement("div"); o.id = "ugOv"; o.style.cssText = "position:fixed;inset:0;z-index:99999;background:#100c33"; o.innerHTML = '<iframe src="' + (_du && _du[1] === "__rp" ? "/rps.html?room=" + _du[2].toUpperCase() : _du ? "/duo.html?g=" + _du[1].toLowerCase() + "&room=" + _du[2].toUpperCase() : "/ugolki.html?room=" + _sp.slice(3).toUpperCase()) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe><button style="position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:10px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;background:#000a;color:#fff;font-size:20px">✕</button>'; o.querySelector("button").onclick = function () { o.remove(); }; document.body.appendChild(o); }; if (document.body) setTimeout(_ugGo, 300); else document.addEventListener("DOMContentLoaded", function () { setTimeout(_ugGo, 300); }); return; }   // 🏁 Ugolki: do'st havolasi
    if (!q.get("room") && /^mm_[A-Z0-9]{6}$/i.test(_sp)) { if (!window.spMemori) { var _ms = document.createElement("script"); _ms.src = "/memori.js?v=9"; document.head.appendChild(_ms); } return; } } catch (e) {}
    if (q.get("room")) roomId = q.get("room");
    else if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && !/^(ref_|pz_|pf_|go_|shop_|pb_|pzt_|ntf_|mm_|ug_|du_|rp_|prem$|corr_|lbt_|lbs_|lbf_|adv$|perf$)/.test(tg.initDataUnsafe.start_param)) roomId = String(tg.initDataUnsafe.start_param);
    var _nb = function () { var bt = document.getElementById("rcBoot"); if (bt) bt.remove(); };
    if (/^lb[ts]_/.test(roomId)) return _nb(); // turnir/sians havolasi - xona emas
    if (!ROOM_RE.test(roomId)) return _nb(); // xona rejimi emas
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
    // guruh doskasi: tomoshabin uchun "Qo'shilish" paneli (chaqiruvchi o'z joyida)
    function sitBar(m) {
      var bar = document.getElementById("rcSit");
      if (!(m.canSit && m.color === "spectator")) { if (bar) bar.remove(); return; }
      if (!bar) {
        bar = document.createElement("div"); bar.id = "rcSit";
        bar.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9500;background:#1c2547;border:2px solid #ffd54f;border-radius:18px;padding:12px;color:#fff;font:15px system-ui,sans-serif;box-shadow:0 8px 24px #000a;text-align:center";
        document.body.appendChild(bar);
      }
      var _bw = m.sitColor !== "black"; bar.innerHTML = "♟ <b>" + String(m.white || m.black || "").replace(/[<>&]/g, "") + "</b> raqib kutyapti" + "<button id=\"rcSitB\" style=\"display:block;width:100%;margin-top:10px;padding:14px;border:0;border-radius:14px;background:linear-gradient(90deg,#2e9d3a,#5cb85c);color:#fff;font:800 18px system-ui\">▶ O‘yinga qo‘shilish (" + (_bw ? "⚪ oq" : "⚫ qora") + ")</button><div style=\"opacity:.7;font-size:13px;margin-top:6px\">yoki shunchaki tomosha qiling 👁</div>";
      document.getElementById("rcSitB").onclick = function () { send({ type: "roomSit", roomId: roomId }); this.disabled = true; this.textContent = "⏳"; };
    }
    var st = {
      color: "spectator", turn: "white", board: startBoard(), moves: [],
      white: null, black: null, whiteOnline: false, blackOnline: false,
      spectators: 0, finished: false, winner: null, reason: null,
      clock: { white: 0, black: 0 }, clockRunning: false, clockAt: 0, timeMs: 0, incMs: 0, tc: "", tcs: [],
      arena: false, berserk: { white: false, black: false }, drawOffer: null, chat: [], unread: 0, chatOpen: false,
      vsBot: false, botStarted: false, botColor: null, botNote: "", botSecs: 1.2, botBlunder: 0, botEng: "",
      selected: null, forced: null, pending: false, connected: false, joined: false
    };
    // lobbyclient uchun: foydalanuvchi shu xonada hali tugamagan o‘yin o‘ynayaptimi (turnirning yangi turiga avtomatik o‘tkazishdan oldin tekshiriladi)
    window.__rcLive = function () { return st.color !== "spectator" && !st.finished && !!st.joined; };
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
    // 🎨 klassik o'yin oynasi: o'yinchi kartalari, pastki 4 tugma (Chat, Taslim, Durang, Menu), chapdan ochiladigan chat
    var _sv = function (p) { return '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
    var RC_ICO = {
      chat: _sv('<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>'),
      flag: _sv('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="currentColor"/><path d="M4 22v-7"/>'),
      hand: _sv('<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>'),
      menu: _sv('<path d="M4 6h16M4 12h16M4 18h16"/>'),
      flip: _sv('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 15.5"/><path d="M3 21v-5.5h5.5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8.5"/><path d="M21 3v5.5h-5.5"/>'),
      share: _sv('<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>'),
      back: _sv('<path d="M15 18l-6-6 6-6"/>'),
      eye: _sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')
    };
    if (!document.getElementById("rcKlCss")) {
      var _kc = document.createElement("style"); _kc.id = "rcKlCss";
      _kc.textContent =
        ".rcPc{display:flex!important;align-items:center;gap:10px;width:min(94vw,520px)!important;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:8px 10px!important;margin:6px 0;box-shadow:0 4px 14px rgba(0,0,0,.35)}" +
        ".rcPc .av{width:44px;height:44px;border-radius:10px;flex:none;object-fit:cover;background:#5a4130;color:#fff;display:flex;align-items:center;justify-content:center;font:800 20px system-ui,sans-serif}" +
        ".rcPc .nm{flex:1;min-width:0}.rcPc .nm b{display:block;font:700 16px system-ui,sans-serif;color:#f3ebe0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
        ".rcPc .nm small{display:block;font:500 13px system-ui,sans-serif;color:#b9ab98;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rcPc .nm small i{font-style:normal;font-weight:700}" +
        ".rcPc .ck{font:700 26px/1 ui-monospace,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;min-width:92px;text-align:center;padding:7px 10px;border-radius:10px;border:2px solid rgba(255,255,255,.16);flex:none;box-sizing:border-box}" +
        "#rcBar{position:fixed;left:0;right:0;bottom:0;z-index:9990;display:flex;justify-content:space-around;align-items:flex-start;padding:10px 6px calc(env(safe-area-inset-bottom,0px) + 8px);background:var(--rcBar,#221a2e);box-shadow:0 -6px 18px rgba(0,0,0,.3)}" +
        "#rcBar button{all:unset;flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;color:#cfc8e0;font:600 13px system-ui,sans-serif;-webkit-tap-highlight-color:transparent;position:relative}" +
        "#rcBar button i{width:58px;height:58px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff}#rcBar button i svg{width:30px;height:30px;stroke-width:2.4}" +
        // Shashka Online uslubida: Chat ko'k-binafsha, Taslim va Durang to'q sariq, Menu binafsha
        "#rcBar [data-bb=chat] i{background:linear-gradient(135deg,#6f86f2,#7b52d6);box-shadow:0 6px 14px rgba(111,100,230,.45)}" +
        "#rcBar [data-bb=res] i,#rcBar [data-bb=draw] i{background:linear-gradient(180deg,#ffa726,#fb8c00);box-shadow:0 6px 14px rgba(251,140,0,.42)}" +
        "#rcBar [data-bb=menu] i{background:linear-gradient(135deg,#b23fd1,#8e24aa);box-shadow:0 6px 16px rgba(156,39,176,.55)}" +
        "#rcBar button.off{opacity:.38}#rcBar button[hidden],#rcBar .bd[hidden]{display:none}" +
        "#rcBar .bd{position:absolute;top:-5px;left:calc(50% + 16px);min-width:18px;height:18px;border-radius:9px;background:#e04a3a;color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center;padding:0 4px;box-sizing:border-box}" +
        "#rcResign,#rcDrawOffer,#rcDrawCnt,#rcChatBtn,#rcMenuBtn{display:none!important}" +
        // o'yin tugagach tugmalar paneli — pastki tugmalar o'rnida (yuqorida turib doska va kartani pastga surmaydi)
        "#rcEx.rcExB{position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);z-index:9994;margin:0!important;max-width:none!important;background:#221a2e!important;border-radius:16px!important;padding:10px!important;box-shadow:0 -6px 24px rgba(0,0,0,.35);display:flex!important;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;box-sizing:border-box}" +
        "#rcEx.rcExB>div{width:100%;margin:0!important;color:#cfc8e0;font:600 13px system-ui,sans-serif;text-align:center}#rcEx.rcExB button{flex:1 1 0;min-width:0;margin:0!important;border:0;border-radius:12px!important;padding:12px 6px!important;font:700 15px system-ui,sans-serif!important;color:#fff;background:#3a3150;box-shadow:none!important}.rcExOn #rcBar{display:none}" +
        // 🏟 arena: o'yin tugagach pastki panel (pastki tugmalar o'rnida, doskani yopmaydi)
        "#spAE{position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);z-index:9995;background:#221a2e;color:#fff;border-radius:16px;padding:10px 12px;box-shadow:0 -6px 24px rgba(0,0,0,.35);font-family:system-ui,sans-serif}.spAEon #rcBar{display:none}" +
        "#spAE .r1{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}#spAE .res{font:800 17px system-ui,sans-serif}#spAE .pt{font:800 16px system-ui,sans-serif;color:#9be36b}#spAE .mt{margin-left:auto;font:600 12px system-ui,sans-serif;color:#cfc8e0;white-space:nowrap}" +
        "#spAE .r2{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border-radius:12px;padding:7px 10px}" +
        "#spAE .cd{width:44px;height:44px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;position:relative;background:conic-gradient(#81b64c var(--p,0%),rgba(255,255,255,.15) 0)}#spAE .cd:before{content:'';position:absolute;inset:5px;border-radius:50%;background:#2a2238}#spAE .cd b{position:relative;font:800 19px system-ui,sans-serif}" +
        "#spAE .cd.wait{background:conic-gradient(#81b64c 0 22%,rgba(255,255,255,.15) 0);animation:spAEr 1s linear infinite}@keyframes spAEr{to{transform:rotate(360deg)}}" +
        "#spAE .nx{flex:1;min-width:0}#spAE .nx small{display:block;font:500 12px system-ui,sans-serif;color:#cfc8e0}#spAE .nx b{display:block;font:800 15px system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
        "#spAE .r3{display:flex;gap:8px;margin-top:8px}#spAE .r3 button{flex:1;border:0;border-radius:11px;padding:10px 0;font:700 14px system-ui,sans-serif;color:#fff}#spAE [data-a=p]{background:#7b52d6}#spAE [data-a=p].on{background:#4a3a6a}#spAE [data-a=t]{background:#fb8c00}#spAE [data-a=z]{background:#81b64c}" +
        // 🤝 durang taklifi — pastki tugmalar ustida, doim ko'rinadi (Qabul / Rad etish yopilib qolmaydi)
        "#rcDraw{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 104px);z-index:20;width:min(94vw,520px);box-sizing:border-box;margin:0!important;border-radius:12px!important;box-shadow:0 6px 20px rgba(0,0,0,.4)}" +
        "#rcH2H{width:min(94vw,520px);box-sizing:border-box;margin:2px auto 4px;padding:7px 12px;border-radius:12px;background:rgba(0,0,0,.22);font:600 14px system-ui,sans-serif;color:#f3ebe0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
        "#rcH2H .t{opacity:.7;font-weight:500;white-space:nowrap}#rcH2H .s{flex:1;min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:6px}" +
        "#rcH2H .s span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}#rcH2H .s span:first-child{flex:none;max-width:35%}#rcH2H .s b{white-space:nowrap;padding:2px 10px;border-radius:8px;background:rgba(255,255,255,.12);font-variant-numeric:tabular-nums}#rcH2H>div{width:100%}" +
        ".rcL #rcH2H{background:#fff;color:#2b2119;box-shadow:0 3px 10px rgba(80,50,20,.12)}.rcL #rcH2H .s b{background:#f3ede4}" +
        // och fonlar (krem, qor, marmar): oq kartalar, to'q yozuv
        ".rcL .rcPc{background:#fff;border-color:rgba(0,0,0,.08);box-shadow:0 3px 10px rgba(80,50,20,.15)}.rcL .rcPc .nm b{color:#2b2119}.rcL .rcPc .nm small{color:#8a7a68}" +
        ".rcL #rcInfo{color:#4a3a2a}.rcL #rcStatus{color:#9a6a12!important}" +
        "#rcChatBd{position:fixed;inset:0;z-index:10002;background:rgba(10,6,3,.45);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}" +
        "#rcChat{position:fixed;top:0;bottom:0;left:0;width:min(82vw,380px);z-index:10003;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:#262421;border-right:1px solid rgba(255,255,255,.1);box-shadow:10px 0 30px rgba(0,0,0,.5);color:#f3ebe0}" +
        "#rcChat .rcCH{display:flex;align-items:center;justify-content:space-between}#rcChat .rcCH b{display:flex;align-items:center;gap:8px;font:800 20px system-ui,sans-serif}#rcChat .rcCH b svg{width:24px;height:24px}" +
        "#rcChat #rcCX{all:unset;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;color:#fff}" +
        "#rcChat #rcMsgs{flex:1;min-height:0;overflow:auto;background:rgba(0,0,0,.28);border-radius:12px;padding:8px 10px;font-size:15px;line-height:1.45}" +
        "#rcChat #rcCIn{display:flex;gap:6px;align-items:center}" +
        "#rcChat #rcInput{flex:1;min-width:0;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.3);color:#fff;font-size:16px;outline:none}" +
        "#rcChat #rcSend{flex:none;padding:10px 14px;border-radius:10px;border:0;background:#81b64c;color:#fff;font-size:16px}" +
        "#rcQuick .rcQc{flex:none;border:0;border-radius:99px;padding:7px 12px;background:rgba(255,255,255,.08);color:#e2d9cc;font:700 14px system-ui,sans-serif;box-shadow:none}" +
        "#rcQuick .rcQc.on{background:#81b64c;color:#fff}" +
        "#rcQuick .rcQp{border:1px solid rgba(255,255,255,.12);border-radius:99px;padding:8px 12px;background:rgba(255,255,255,.1);color:#fff;font:600 14px system-ui,sans-serif;box-shadow:none}" +
        // 👁 tomoshabin: tepada «‹ Jonli tomosha» + tomoshabinlar rasmi, Dragon bilan kuzatish kartasi, doskada strelkalar
        "#spSH{width:min(94vw,520px);display:flex;align-items:center;gap:10px;margin:0 0 6px;box-sizing:border-box;position:relative}" +
        "#spSH .bk{all:unset;flex:none;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.28);color:#f3ebe0;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25)}#spSH .bk svg{width:22px;height:22px}" +
        "#spSH .tt{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font:800 17px system-ui,sans-serif;color:#f3ebe0;white-space:nowrap;overflow:hidden}" +
        "#spSH .tt i{flex:none;width:9px;height:9px;border-radius:50%;background:#e53935;box-shadow:0 0 0 4px rgba(229,57,53,.2)}#spSH .tt i.off{display:none}" +
        "#spSH .sv{all:unset;flex:none;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:99px;background:rgba(0,0,0,.28);cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25)}" +
        "#spSH .avs{display:flex}#spSH .avs span{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-9px;background:#8d7b68 center/cover;display:flex;align-items:center;justify-content:center;color:#fff;font:700 12px system-ui,sans-serif;box-sizing:border-box;overflow:hidden}#spSH .avs span:first-child{margin-left:0}" +
        "#spSH .sv b{display:flex;align-items:center;gap:4px;font:700 14px system-ui,sans-serif;color:#e8dccb}#spSH .sv b svg{width:17px;height:17px}" +
        "#spSL{position:absolute;right:0;top:44px;z-index:30;width:230px;max-height:60vh;overflow:auto;background:#2a2622;color:#f3ebe0;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:8px;box-sizing:border-box}" +
        "#spSL h4{margin:2px 6px 4px;font:700 12px system-ui,sans-serif;opacity:.65;text-transform:uppercase;letter-spacing:.04em}#spSL div{display:flex;align-items:center;gap:10px;padding:6px;font:600 14px system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spSL div span{flex:none;width:30px;height:30px;border-radius:50%;background:#8d7b68 center/cover;display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px system-ui,sans-serif}" +
        "#spDG{all:unset;width:min(94vw,520px);box-sizing:border-box;margin:0 0 2px;padding:6px 12px;border-radius:14px;background:rgba(0,0,0,.28);box-shadow:0 4px 14px rgba(0,0,0,.3);color:#f3ebe0;display:flex;align-items:center;gap:10px;min-height:46px;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
        "#spDG .ic{flex:none;font-size:22px;line-height:1}#spDG .t{flex:1;min-width:0}#spDG .t b{display:block;font:800 15px system-ui,sans-serif}#spDG .t small{display:block;font:500 12.5px system-ui,sans-serif;color:#b9ab98;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
        "#spDG .sw{flex:none;width:46px;height:28px;border-radius:14px;background:rgba(255,255,255,.22);position:relative;transition:background .2s}#spDG .sw::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s}" +
        "#spDG.on .sw{background:#81b64c}#spDG.on .sw::after{left:21px}#spDG.adm .sw{display:none}#spDG .an{display:none}#spDG.on .an,#spDG.adm .an{display:block;flex:none;padding:7px 10px;border-radius:12px;background:#81b64c;color:#fff;font:800 14px system-ui,sans-serif}#spDG.on:not(.adm) .sw{width:40px;height:24px}#spDG.on:not(.adm) .sw::after{width:18px;height:18px;left:19px}#spDG .a{display:block}#spDG .z{display:none}#spDG.on .a{display:none}#spDG.on .z{display:block}" +
        "#spDG .bar{display:flex;align-items:center;gap:8px}#spDG .bar b{flex:none;min-width:40px;font:800 16px system-ui,sans-serif;font-variant-numeric:tabular-nums}" +
        "#spDG .bar .bm{flex:none;font:800 14px system-ui,sans-serif;color:#5fc25a;white-space:nowrap}#spDG .bar .bm:empty{display:none}#spDG .bar .tr{flex:1;min-width:40px;height:10px;border-radius:5px;background:#3a3330;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}#spDG .bar .tr i{display:block;height:100%;width:50%;background:#fbf7f0;border-right:2px solid #c9a46a;transition:width .5s}" +
        "#spDG .mv{margin-top:4px;font:600 13px system-ui,sans-serif;color:#e2d6c6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spDG .mv .ok{color:#6cc04a}#spDG .mv .bad{color:#ff8a50}#spDG .mv .dg{color:#5fc25a}#spDG .mv em{font-style:normal;opacity:.7;font-weight:500}" +
        "#spDA{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:7}" +
        ".rcL #spSH .bk,.rcL #spSH .sv{background:#fff;color:#2b2119;box-shadow:0 3px 10px rgba(80,50,20,.15)}.rcL #spSH .tt{color:#2b2119}.rcL #spSH .sv b{color:#5a4a3a}" +
        ".rcL #spSL{background:#fff;color:#2b2119;box-shadow:0 10px 30px rgba(60,40,20,.28)}" +
        ".rcL #spDG{background:#fff;color:#2b2119;box-shadow:0 3px 10px rgba(80,50,20,.15)}.rcL #spDG .t small{color:#8a7a68}.rcL #spDG .sw{background:#d9cfc2}.rcL #spDG.on .sw{background:#81b64c}" +
        ".rcL #spDG .bar .tr{box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}.rcL #spDG .mv{color:#4a3a2a}.rcL #spDG .mv .ok{color:#3f8f2a}.rcL #spDG .mv .bad{color:#d0582a}.rcL #spDG .mv .dg,.rcL #spDG .bar .bm{color:#2e8b3a}" +
        ".rcSpec #rcStatus:empty{display:none}.rcSpec{padding-top:calc(env(safe-area-inset-top,0px) + 6px)!important}";
      document.head.appendChild(_kc);
    }
    var root = document.createElement("div");
    root.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:var(--rcBg,#ece2d3);color:#fff;font-family:Arial,sans-serif;" +
      "display:flex;flex-direction:column;align-items:center;overflow:auto;" +
      "padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(env(safe-area-inset-bottom,0px) + 110px)";
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
      '<button id="rcChatBtn">💬 Chat</button>' +
      '<button id="rcZal" style="display:none">Chiqish</button>' +   // chiqish — ☰ Menu ichida (bu tugma faqat ichki chaqiruv uchun)
      '<button id="rcClose" style="display:none">✖️ Yopish</button></div>' +
      // 💬 chat — chapdan ochiladigan yon panel: tepada xabarlar, pastda emojili so'zlar va yozish
      '<div id="rcChatBd" style="display:none"></div>' +
      '<div id="rcChat" style="display:none">' +
      '<div class="rcCH"><b>' + RC_ICO.chat + 'Chat</b><button id="rcCX">✕</button></div>' +
      '<div id="rcMsgs"></div>' +
      '<div id="rcQuick"></div><div id="rcCIn">' +
      '<input id="rcInput" maxlength="200" placeholder="Xabar yozing…">' +
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
      rcExit();
    };
    function rcExit() { try { var _tm = String(roomId).match(/^T(.+?)R\d+B\d+|^A(.+?)G\d+/); if (_tm) sessionStorage.setItem("spOpenT", _tm[1] || _tm[2]); } catch (e) {} rcLeave(); }
    var elMsgs = root.querySelector("#rcMsgs");
    var elInput = root.querySelector("#rcInput");

    window.addEventListener("error", function (e) {
      if (!e || !e.message || e.message === "Script error.") return; elInfo.textContent = "⚠️ JS xato: " + e.message + " (" + String(e.filename || "").split("/").pop() + ":" + e.lineno + ")";
    });

    root.querySelector("#rcClose").onclick = function () {
      if (tg && tg.close) tg.close(); else root.style.display = "none";
    };
    if (root.querySelector("#rcLink")) root.querySelector("#rcLink").onclick = function () {
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
        ["Feruza", "#D5F0EC", "#4A9A93", 1], ["Tungi", "#9AA5B8", "#3E4A5E", 1],
        ["Oltin", "#F7E7B4", "linear-gradient(135deg,#C9A227,#8A6508)", 1, "#F7E7B4", "#A07A10"], ["Marmar", "linear-gradient(135deg,#FAFAFA,#E3E3E0 55%,#F5F5F3)", "linear-gradient(135deg,#4B5563,#1F2937)", 1, "#EEEEEC", "#374151"],
        ["Malaxit", "#D9F2E3", "linear-gradient(135deg,#0F766E,#064E3B)", 1, "#D9F2E3", "#0B5F55"], ["Neon", "#1E1B4B", "linear-gradient(135deg,#7C3AED,#DB2777)", 1, "#1E1B4B", "#A633B5"]
      ];
      window.addEventListener("spEq", function () { try { render(); } catch (e) {} });
      window.addEventListener("spPrem", function () { try { rcmApply(); } catch (e) {} });
      var rcm = { night: false, sound: true, flat: false, board: -1, pieces: -1, auto: false, autoPro: false, tapTo: true, drag: true, chat: true };
      try { var rcmSv = JSON.parse(localStorage.getItem(RCM_KEY) || "{}"); for (var rcmK in rcmSv) rcm[rcmK] = rcmSv[rcmK]; } catch (e) {}
      function rcmSave() { try { localStorage.setItem(RCM_KEY, JSON.stringify(rcm)); } catch (e) {} }
      // hamma uchun asosiy doska — «Yog‘och» (tekis klassik ranglar) va odatiy donalar; o'zi boshqa doska tanlaganlarniki o'zgarmaydi
      if (!rcm.bv) { var _sth = ""; try { _sth = (typeof S === "object" && S && S.th) || JSON.parse(localStorage.getItem("sp_s2") || "{}").th || ""; } catch (e) {} if (rcm.board === -1 && (!_sth || _sth === "edeon")) rcm.board = 0; rcm.bv = 1; rcmSave(); }

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
      // 🖼 o'yin oynasi foni: kulrang (asosiy), krem, jigarrang — bepul; qolganlari tangaga; «O‘z rasmim» — rasm faqat shu telefonda saqlanadi
      var RC_BGS = [
        { k: "c", n: "Krem", p: 0, bg: "linear-gradient(180deg,#f3ebdf 0,#e6d8c3 100%)", bar: "#221a2e", l: 1 },   // hamma uchun asosiy
        { k: "g", n: "Kulrang", p: 0, bg: "#312e2b", bar: "#262421" },
        { k: "w", n: "Jigarrang", p: 0, bg: "radial-gradient(circle at 30% 0,#3b2a1d 0,#22180f 55%,#140e09 100%)", bar: "#1b130d" },
        { k: "n", n: "Tun", p: 150, bg: "linear-gradient(180deg,#22314f 0,#0d1424 100%)", bar: "#0b1120" },
        { k: "f", n: "O‘rmon", p: 150, bg: "linear-gradient(180deg,#2c4a34 0,#0f2017 100%)", bar: "#0c1a12" },
        { k: "v", n: "Binafsha", p: 150, bg: "radial-gradient(circle at 30% 0,#5b3590 0,#2a1650 55%,#140a2a 100%)", bar: "#120925" },
        { k: "q", n: "Qor", p: 150, bg: "linear-gradient(180deg,#f2f7fc 0,#d3e0ee 100%)", bar: "#221a2e", l: 1 },
        { k: "o", n: "Okean", p: 200, bg: "linear-gradient(180deg,#136a86 0,#0a3a4f 55%,#06202c 100%)", bar: "#051b25" },
        { k: "s", n: "Shafaq", p: 200, bg: "linear-gradient(180deg,#e8865a 0,#a2456a 50%,#2e1a40 100%)", bar: "#26152f" },
        { k: "m", n: "Marmar", p: 250, bg: "linear-gradient(125deg,#fafaf8 0,#e4e4e0 40%,#f3f3f0 60%,#d9d9d4 100%)", bar: "#221a2e", l: 1 },
        { k: "y", n: "Yog‘och", p: 300, bg: "repeating-linear-gradient(90deg,#5e4027 0,#6a4a2e 7px,#553923 13px,#664629 21px)", bar: "#3e2a19" },
        { k: "a", n: "Oltin", p: 300, bg: "radial-gradient(circle at 50% 0,#7a5f22 0,#3a2c10 55%,#1a1408 100%)", bar: "#161108" }
      ];
      var rcBg = { own: null, self: false, admin: false };   // serverdan: sotib olingan fonlar
      function rcBgDef(k) { for (var i = 0; i < RC_BGS.length; i++) if (RC_BGS[i].k === k) return RC_BGS[i]; return null; }
      function rcBgCur() { var k = "c"; try { k = localStorage.getItem("rcBg") || "c"; } catch (e) {} return k; }
      function rcBgImg() { try { return localStorage.getItem("rcBgImg") || ""; } catch (e) { return ""; } }
      function rcBgHas(k) { if (rcBg.admin) return true; if (k === "self") return rcBg.self; var d = rcBgDef(k); return !!d && (!d.p || (rcBg.own || []).indexOf(k) >= 0); }
      function rcBgApply() {
        var k = rcBgCur(), d = rcBgDef(k), img = k === "self" ? rcBgImg() : "";
        if (k === "self" ? (!img || (rcBg.own && !rcBgHas("self"))) : (!d || (rcBg.own && !rcBgHas(k)))) { k = "c"; d = rcBgDef("c"); }
        root.style.setProperty("--rcBg", k === "self" ? "linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url(" + img + ") center/cover no-repeat" : d.bg);
        root.style.setProperty("--rcBar", rcm.night ? "#0a0e1d" : k === "self" ? "#151515" : d.bar);   // tungi rejimda panel ham to'q
        root.classList.toggle("rcL", k !== "self" && !!d.l && !rcm.night);
      }
      function rcBgApi(path, body) {
        var idt = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || "";
        return fetch(path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", "x-init-data": idt }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
      }
      rcBgApi("/api/bg").then(function (d) { if (d && !d.error) { rcBg.own = d.own || []; rcBg.self = !!d.self; rcBg.admin = !!d.admin; rcBgApply(); } }).catch(function () {});
      function rcBgSet(k) { try { localStorage.setItem("rcBg", k); } catch (e) {} rcBgApply(); rcmBuild(); }
      function rcBgBuy(k, p, what, ok) {
        if (!confirm(what + " — " + p + " 🪙. Sotib olasizmi?")) return;
        rcBgApi("/api/bg/buy", { k: k }).then(function (d) {
          if (d && d.ok) { if (k === "self") rcBg.self = true; else { rcBg.own = rcBg.own || []; rcBg.own.push(k); } ok(); }
          else alert((d && d.error) || "Xato");
        }).catch(function () { alert("Server bilan aloqa yo‘q"); });
      }
      function rcBgFile() {   // telefondan rasm: 1280 px gacha kichraytiriladi va faqat shu telefonda saqlanadi
        var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
        inp.onchange = function () {
          var f = inp.files && inp.files[0]; if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            var im = new Image();
            im.onload = function () {
              var s = Math.min(1, 1280 / Math.max(im.width, im.height)), cv = document.createElement("canvas");
              cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
              cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
              var q = 0.8, url = cv.toDataURL("image/jpeg", q);
              while (url.length > 700000 && q > 0.4) { q -= 0.15; url = cv.toDataURL("image/jpeg", q); }
              try { localStorage.setItem("rcBgImg", url); } catch (e) { alert("Rasm juda katta — boshqa rasm tanlang"); return; }
              rcBgSet("self");
            };
            im.src = rd.result;
          };
          rd.readAsDataURL(f);
        };
        inp.click();
      }
      function rcBgPick(k) {
        if (k === "self") { if (rcBgHas("self")) rcBgFile(); else rcBgBuy("self", 500, "O‘z rasmingizni fon qilish", rcBgFile); return; }
        var d = rcBgDef(k); if (!d) return;
        if (rcBgHas(k)) rcBgSet(k); else rcBgBuy(k, d.p, "«" + d.n + "» foni", function () { rcBgSet(k); });
      }
      function rcmApply() {
        window.__rcmMute = !rcm.sound;
        var css = "";
        if (rcm.board >= 0 && RCM_BOARDS[rcm.board] && !(RCM_BOARDS[rcm.board][3] && window.rcIsPremium && !window.rcIsPremium())) {
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
        rcBgApply();
        rcmChatVis();
      }
      function rcmChatVis() {
        if (!rcm.chat) { elChatBtn.style.display = "none"; elChat.style.display = "none"; st.chatOpen = false; var _cbd = document.getElementById("rcChatBd"); if (_cbd) _cbd.style.display = "none"; }
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
      // ☰ Menu → Chiqish: tomoshabin, o'yin tugagan, raqib hali kelmagan — yoki ikki tomon ham birinchi yurishni qilmaguncha
      function rcmCanExit() { if (!st.joined) return false; if (st.color === "spectator" || st.finished || !bothIn()) return true; return (st.moves || []).length < 2; }
      function rcmNeedAbort() { return st.color !== "spectator" && !st.finished && bothIn() && !(st.vsBot && !st.botStarted); }

      // Menyu tugmasi va paneli
      var rcmBtn = document.createElement("button");
      rcmBtn.id = "rcMenuBtn"; rcmBtn.textContent = "☰ Menu";
      elChatBtn.parentNode.insertBefore(rcmBtn, elChatBtn);
      var rcmPanel = document.createElement("div");
      rcmPanel.style.cssText = "display:none;position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.55)";
      rcmPanel.innerHTML = '<div id="rcmBox" style="position:absolute;top:0;right:0;bottom:0;width:min(82vw,340px);background:#262421;color:#fff;overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 24px;font-size:16px;box-sizing:border-box"></div>';
      root.appendChild(rcmPanel);
      rcmPanel.onclick = function (e) { if (e.target === rcmPanel) rcmPanel.style.display = "none"; };
      rcmBtn.onclick = function () { rcmBuild(); rcmPanel.style.display = "block"; };

      function rcmShopFill(box) {
      var g = box.querySelector("#rcmShop"); if (!g) return;
      var idt = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || "";
      function sapi(p, b) { return fetch(p, { method: b ? "POST" : "GET", headers: { "Content-Type": "application/json", "x-init-data": idt }, body: b ? JSON.stringify(b) : undefined }).then(function (r) { return r.json(); }); }
      function note(t) { g.innerHTML = '<div style="grid-column:1/-1;opacity:.6;font-size:13px">' + t + '</div>'; }
      sapi("/api/shop").then(function (d) {
        if (!d || d.error) return note("Toshlar yuklanmadi");
        var eq = d.equipped === "-" ? "" : (d.equipped || d.def || "");
        var mine = (d.list || []).filter(function (x) { return x.def || d.admin || (d.owned || []).indexOf(x.id) >= 0; });
        if (!mine.length) return note("Do‘konda tosh yo‘q");
        g.innerHTML = mine.map(function (x) {
          var u = "/api/shop/img?id=" + encodeURIComponent(x.id) + "&k=", nm = String(x.name || "").replace(/[<>"']/g, "");
          return '<div data-sid="' + x.id + '" title="' + nm + '" style="border-radius:10px;background:rgba(255,255,255,.08);padding:6px 0;display:flex;justify-content:center;border:3px solid ' + (x.id === eq ? "#4c8dff" : "transparent") + '"><div style="display:grid;grid-template-columns:repeat(2,20px);gap:4px">' +
            ["w", "b", "wk", "bk"].map(function (k) { return '<i style="width:20px;height:20px;display:block;background:url(' + u + k + ') center/contain no-repeat"></i>'; }).join("") + '</div></div>';
        }).join("");
        Array.prototype.forEach.call(g.querySelectorAll("[data-sid]"), function (el) {
          el.onclick = function () {
            var id = el.getAttribute("data-sid");
            sapi("/api/shop/equip", { id: id }).then(function (r) {
              if (r && r.ok) { window.spEqId = id; rcm.pieces = -1; rcmSave(); rcmApply(); try { render(); } catch (e) {} rcmBuild(); }
            });
          };
        });
      }).catch(function () { note("Toshlar yuklanmadi"); });
    }
    function rcmBuild() {
        var box = document.getElementById("rcmBox");
        var T = [
          ["night", "🌙 Tungi rejim", ""], ["sound", "🔊 Ovoz", ""], ["flat", "◐ Oddiy toshlar", ""],
          ["auto", "⚡ Avtohod", "1 ta yurish yoki urish davomi bo‘lsa, o‘zi yuradi"],
          ["tapTo", "🎯 Katakni bosib yurish", "Donani tanlamasdan borish katagini bossangiz, o‘sha yerga bora oladigan dona yuradi"],
          ["drag", "✋ Sudrab yurish", "Donani barmoq bilan sudrab tashlash"],
          
          ["chat", "💬 Chat", ""]
        ];
        var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:19px">☰ Menu</b><span id="rcmX" style="font-size:24px;padding:4px 8px">✕</span></div>';
        T.forEach(function (t) {
          h += '<label style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.1)">' +
            '<span>' + t[1] + (t[2] ? '<small style="display:block;opacity:.6;font-size:12px;margin-top:2px">' + t[2] + '</small>' : '') + '</span>' +
            '<input type="checkbox" data-k="' + t[0] + '"' + (rcm[t[0]] ? " checked" : "") + ' style="width:22px;height:22px"></label>';
        });
        h += '<div style="margin:16px 0 8px">🎨 Doska rangi</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
        RCM_BOARDS.forEach(function (b, i) {
          h += '<div data-b="' + i + '" style="aspect-ratio:1;border-radius:10px;position:relative;border:3px solid ' + (i === rcm.board ? "#4c8dff" : "transparent") +
            ';background:conic-gradient(' + (b[5] || b[2]) + ' 25%,' + (b[4] || b[1]) + ' 0 50%,' + (b[5] || b[2]) + ' 0 75%,' + (b[4] || b[1]) + ' 0)">' +
            (b[3] ? '<span style="position:absolute;top:-8px;right:-4px;font-size:14px">👑</span>' : "") + '</div>';
        });
        h += '</div><div id="rcmReset" style="margin:10px 0 0;font-size:13px;opacity:.7;text-decoration:underline">↺ Standart doska</div>';
        var _bgc = rcBgCur(), _bgi = rcBgImg(), _bgL = function (p) { return '<span style="position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.62);color:#ffd27a;font-size:11px;font-weight:700;text-align:center;border-radius:0 0 7px 7px;padding:2px 0">' + p + ' 🪙</span>'; };
        h += '<div style="margin:18px 0 8px">Fon</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
        RC_BGS.forEach(function (b) {
          h += '<div data-bg="' + b.k + '" title="' + b.n + '" style="aspect-ratio:1;border-radius:10px;position:relative;background:' + b.bg + ';border:3px solid ' + (b.k === _bgc ? "#81b64c" : "rgba(255,255,255,.12)") + '">' + (rcBgHas(b.k) ? "" : _bgL(b.p)) + '</div>';
        });
        h += '<div data-bg="self" style="aspect-ratio:1;border-radius:10px;position:relative;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:700;line-height:1.2;color:#e2d9cc;background:' + (_bgi ? 'url(' + _bgi + ') center/cover' : 'rgba(255,255,255,.08)') + ';border:3px solid ' + (_bgc === "self" && _bgi ? "#81b64c" : "rgba(255,255,255,.12)") + '">' + (_bgi ? "" : "O‘z<br>rasmim") + (rcBgHas("self") ? "" : _bgL(500)) + '</div></div>';
        h += '<div style="margin:6px 0 0;font-size:12px;opacity:.6">' + (_bgc === "self" && _bgi ? "O‘z rasmingiz (faqat shu telefonda)" : (rcBgDef(_bgc) || RC_BGS[0]).n) + '</div>';
        h += '<div style="margin:18px 0 8px">♟ Toshlar</div><div id="rcmShop" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"><div style="grid-column:1/-1;opacity:.6;font-size:13px">Yuklanmoqda…</div></div>';
        if (rcmCanExit()) h += '<button id="rcmAbort" style="width:100%;margin-top:22px;padding:14px;border:0;border-radius:12px;background:#d32f2f;color:#fff;font-size:16px;font-weight:700">' + (rcmNeedAbort() ? "Chiqish (yurmasdan)" : "Chiqish") + '</button>';
        box.innerHTML = h; rcmShopFill(box);

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
            if (b[3] && window.rcIsPremium && !window.rcIsPremium()) { if (window.premGo) window.premGo(); else alert("👑 Bu doska faqat Premium uchun"); return; }
            rcm.board = i; rcmSave(); rcmApply(); rcmBuild();
          };
        });
        box.querySelector("#rcmReset").onclick = function () { rcm.board = 0; rcmSave(); rcmApply(); rcmBuild(); };
        Array.prototype.forEach.call(box.querySelectorAll("[data-bg]"), function (el) { el.onclick = function () { rcBgPick(el.getAttribute("data-bg")); }; });
        Array.prototype.forEach.call(box.querySelectorAll("[data-p]"), function (el) {
          el.onclick = function () { rcm.pieces = +el.getAttribute("data-p"); rcmSave(); rcmApply(); rcmBuild(); };
        });
        var pr = box.querySelector("#rcmPReset");
        if (pr) pr.onclick = function () { rcm.pieces = -1; rcmSave(); rcmApply(); rcmBuild(); };
        var ab = box.querySelector("#rcmAbort");
        if (ab) ab.onclick = function () {
          if (!rcmCanExit()) { rcmBuild(); return; }
          if (!rcmNeedAbort()) { rcmPanel.style.display = "none"; rcExit(); return; }
          if (!confirm("O‘yindan chiqmoqchimisiz?")) return;
          send({ type: "roomAbort", roomId: roomId });
          setTimeout(function () { rcExit(); }, 600);
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
          if (st.optN > 0) return;   // oldingi qadamga server javobi kelmaguncha kutamiz (takroriy qadam bo'lmasin)
          if (st.pre) return;   // oldindan belgilangan yurish bor — avval u tekshiriladi
          if (st.oppAt && Date.now() - st.oppAt < 550) return;   // raqib yurishi ko'rinib bo'lsin (toshlar «joy almashgandek» ko'rinmasin)
          var now = Date.now(); if (now - rcmLast < (st.forced ? 1200 : 600)) return;
          var chain = !!st.forced;
          var steps = chain ? captureSteps(st.board, st.forced.r, st.forced.c) : allMoves(st.board, codeOf(st.color));
          if (!steps || steps.length !== 1) return;
          
          var mv = steps[0];
          if (!mv || !mv.from || !mv.to) return;
          rcmLast = now;
          sendMove(mv);
        } catch (e) {}
      }, 350);

      rcmApply();
    } catch (e) { console.error("rc-menu xato:", e); }

    // ⬇️ pastki 4 tugma: Chat, Taslim, Durang, Menu (doim ekran pastida)
    var elBar = document.createElement("div"); elBar.id = "rcBar";
    elBar.innerHTML =
      '<button data-bb="chat"><i>' + RC_ICO.chat + '</i>Chat<span class="bd" hidden></span></button>' +
      '<button data-bb="res"><i>' + RC_ICO.flag + '</i>Taslim</button>' +
      '<button data-bb="draw"><i>' + RC_ICO.hand + '</i>Durang</button>' +
      '<button data-bb="menu"><i>' + RC_ICO.menu + '</i>Menu</button>';
    root.appendChild(elBar);
    function rcBarPlay() { return st.color !== "spectator" && !st.finished && bothIn(); }
    elBar.onclick = function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-bb]") : null; if (!b) return;
      var k = b.getAttribute("data-bb"), off = b.classList.contains("off");
      if (st.color === "spectator" && (k === "res" || k === "draw")) { if (k === "res") { st.specFlip = !st.specFlip; render(); } else spShare(); return; }   // 👁 tomoshabin: Burish / Ulashish
      if (k === "chat") { if (!off) elChatBtn.click(); }
      else if (k === "menu") { var mb = document.getElementById("rcMenuBtn"); if (mb) mb.click(); }
      else if (k === "res") { if (!off) elResign.onclick(); }
      else if (k === "draw") {
        if (!off) { elDrawOffer.onclick(); return; }
        if (!rcBarPlay()) return;
        alert(st.drawOffer === st.color ? "Durang taklif qilindi — raqib javobi kutilmoqda" : st.drawOffer ? "Raqib durang taklif qilmoqda — javob bering" : "Durang taklif qilish uchun har tomondan kamida 10 yurish kerak");
      }
    };
    function rcBarUpd() {
      var bs = elBar.children, pl = rcBarPlay(), sp = st.color === "spectator";
      bs[0].hidden = elChatBtn.style.display === "none";
      if (elBar._sp !== sp) {   // tomoshabinda Taslim/Durang o'rnida Burish va Ulashish
        elBar._sp = sp;
        bs[1].innerHTML = sp ? "<i>" + RC_ICO.flip + "</i>Burish" : "<i>" + RC_ICO.flag + "</i>Taslim";
        bs[2].innerHTML = sp ? "<i>" + RC_ICO.share + "</i>Ulashish" : "<i>" + RC_ICO.hand + "</i>Durang";
      }
      bs[1].classList.toggle("off", !sp && !pl);
      bs[2].classList.toggle("off", !sp && !(pl && st.moves.length >= 2 && st.canDraw && !st.drawOffer));
      var u = st.unread || 0, bd = bs[0].querySelector(".bd"); bd.hidden = !u; bd.textContent = u > 9 ? "9+" : String(u);
    }
    setInterval(function () { try { rcBarUpd(); } catch (e) {} }, 300);

    // 🏟 «‹ O‘yin zali» — holat qatorining chap chekkasida (o'yinchiga): raqib kutilayotganda, o'yin tugaganda,
    // do'stlar xonasida esa ikki tomon birinchi yurishni qilmaguncha (☰ Menu → Chiqish bilan bir xil: kerak bo'lsa o'yin bekor qilinadi)
    // ⚙️ Do'stlar xonasi (chat kartasi, havola): birinchi kirgan (oq) raqib kelguncha vaqt va pozitsiyani tanlaydi — zaldagi «Yangi stol» chiplari
    if (!document.getElementById("rcZalCss")) {
      var _zc = document.createElement("style"); _zc.id = "rcZalCss";
      _zc.textContent =
        "#rcZalB{all:unset;position:absolute;z-index:30;display:none;align-items:center;gap:3px;height:34px;padding:0 14px 0 8px;border-radius:17px;box-sizing:border-box;font-family:inherit;font-size:14.5px;font-weight:700;line-height:1;background:linear-gradient(135deg,#b84fe3,#7a2fc6);color:#fff;box-shadow:0 4px 14px rgba(150,60,220,.45);cursor:pointer;white-space:nowrap;transform:translateY(-50%);-webkit-tap-highlight-color:transparent}" +
        "#rcZalB svg{width:19px;height:19px;stroke-width:2.8}#rcZalB:active{transform:translateY(-50%) scale(.96)}" +
        "#rcCfg{position:absolute;z-index:25;display:none;box-sizing:border-box;background:rgba(34,28,90,.96);border:1px solid #3d3590;border-radius:16px;padding:9px 10px;box-shadow:0 10px 30px rgba(0,0,0,.45);color:#fff;font-family:inherit}" +
        "#rcCfg .r{display:flex;align-items:center;gap:6px}#rcCfg .r+.r{margin-top:7px}#rcCfg .lb{flex:none;width:80px;font-size:12.5px;opacity:.75;font-weight:600}" +
        "#rcCfg button{all:unset;flex:1;box-sizing:border-box;text-align:center;border:1px solid #4a42a0;background:#15113d;border-radius:10px;padding:7px 0;font-size:14px;font-weight:700;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
        "#rcCfg button.on{border-color:#f59e0b;background:#3a2a05;color:#ffd54a}";
      document.head.appendChild(_zc);
    }
    var elZalB = document.createElement("button"); elZalB.id = "rcZalB"; elZalB.type = "button";
    elZalB.innerHTML = RC_ICO.back + "<span>O‘yin zali</span>";
    root.appendChild(elZalB);
    function zalOk() {
      if (st.arena || !st.joined || st.color === "spectator" || st.etude) return false;   // tomoshabinda tepada o'z «‹» tugmasi bor
      if (st.finished || !bothIn()) return true;
      return !!st.casual && (st.moves || []).length < 2;
    }
    elZalB.onclick = function () {
      if (!zalOk()) return;
      if (st.finished || !bothIn()) { rcExit(); return; }
      if (!confirm("O‘yindan chiqmoqchimisiz?")) return;
      send({ type: "roomAbort", roomId: roomId });
      setTimeout(function () { rcExit(); }, 600);
    };
    function zalUpd() {
      var on = zalOk();
      elZalB.style.display = on ? "flex" : "none";
      if (!on) { if (elStatus._zal) { elStatus._zal = false; elStatus.style.width = ""; elStatus.style.boxSizing = ""; elStatus.style.paddingLeft = ""; } return; }
      elStatus._zal = true;
      var L = elBoard.offsetLeft + 10;   // doska ekran eniga teng bo'lsa ham chekkaga yopishmasin
      elStatus.style.boxSizing = "border-box"; elStatus.style.width = elBoard.offsetWidth + "px"; elStatus.style.paddingLeft = (elZalB.offsetWidth + 20) + "px";
      elZalB.style.left = L + "px";
      elZalB.style.top = (elStatus.offsetTop + elStatus.offsetHeight / 2) + "px";
    }
    var elCfg = null, CFG_TC = ["1+1", "2+2", "3+2", "5+3"];
    function cfgOk() { return !!st.casual && st.joined && st.color === "white" && !bothIn() && !st.finished && !st.vsBot && !st.etude && (st.moves || []).length === 0; }
    function cfgUpd() {
      if (!cfgOk()) { if (elCfg) elCfg.style.display = "none"; return; }
      if (!elCfg) {
        elCfg = document.createElement("div"); elCfg.id = "rcCfg"; root.appendChild(elCfg);
        elCfg.onclick = function (e) {
          var b = e.target && e.target.closest ? e.target.closest("button") : null; if (!b || !cfgOk()) return;
          if (b.getAttribute("data-tc")) send({ type: "roomSetTime", roomId: roomId, tc: b.getAttribute("data-tc") });
          else if (b.getAttribute("data-pos")) send({ type: "roomSetPos", roomId: roomId, pos: b.getAttribute("data-pos") });   // IDF qayta bosilsa — yangi qura
        };
      }
      var idf = !!st.opening, k = String(st.tc) + "|" + (idf ? String(st.opening.id || 1) : "");
      if (elCfg._k !== k) {
        elCfg._k = k;
        elCfg.innerHTML = '<div class="r"><div class="lb">⏱ Vaqt</div>' + CFG_TC.map(function (v) { return '<button data-tc="' + v + '"' + (v === st.tc ? ' class="on"' : '') + '>' + v + '</button>'; }).join("") + '</div>' +
          '<div class="r"><div class="lb">♟ Pozitsiya</div><button data-pos="std"' + (idf ? '' : ' class="on"') + '>Standart</button><button data-pos="idf"' + (idf ? ' class="on"' : '') + '>IDF 780</button></div>';
      }
      elCfg.style.display = "block";
      elCfg.style.left = (elBoard.offsetLeft + 8) + "px"; elCfg.style.width = (elBoard.offsetWidth - 16) + "px";
      elCfg.style.top = (elBoard.offsetTop + (elBoard.offsetHeight - elCfg.offsetHeight) / 2) + "px";
    }
    setInterval(function () { try { zalUpd(); cfgUpd(); } catch (e) {} }, 400);

    // ---------- 👁 tomoshabin oynasi ----------
    function spEsc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function spAv(x) {   // tomoshabin rasmi yoki ism harfi
      if (x && x.av && x.u) return '<span style="background-image:url(/api/av/' + encodeURIComponent(x.u) + ')"></span>';
      var n = String((x && x.n) || "?"), h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360;
      return '<span style="background:hsl(' + h + ',55%,52%)">' + spEsc(n.charAt(0).toUpperCase()) + "</span>";
    }
    function spList() { return (st.specList && st.specList.length) ? st.specList : (st.specNames || []).map(function (n) { return { n: n }; }); }
    function spOpenRoom(id) { try { if (window.__spEmb && window.parent !== window && window.parent.rcOpen) { window.parent.rcOpen(id); return; } } catch (e) {} location.href = location.pathname + "?room=" + encodeURIComponent(id); }
    function spShare() {   // jonli o'yin havolasi: Telegramda ulashish (yoki nusxa)
      var base = window.TG_APP_LINK || "https://t.me/DraughtsPRObot/play";
      var url = base + "?startapp=" + encodeURIComponent(roomId);
      var text = "👁 Jonli o‘yin: ⚪ " + (st.white || "Oq") + " — ⚫ " + (st.black || "Qora") + " · tomosha qiling!";
      if (tg && tg.openTelegramLink) { tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text)); return; }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      try { navigator.clipboard.writeText(url).then(function () { elInfo.textContent = "🔗 Havola nusxalandi"; }); } catch (e) {}
    }
    function spNextLive(b) { st._nl = b; b.disabled = true; b.textContent = "⏳ Qidirilmoqda…"; send({ type: "roomLive" }); }
    // 🐉 Dragon bilan kuzatish: tomoshabin yoqadi, server baholaydi — strelka hozirgi o'rindagi kuchli yurishni yurishdan oldin ko'rsatadi
    function spDgOn() { if (!st.dgOk) return false; if (st.dgAdm) return true; try { return localStorage.getItem("spDg") === "1"; } catch (e) { return !!st._dgOn; } }   // admin uchun doim yoniq
    function spDgReq(ms) {
      if (st.color !== "spectator" || !spDgOn() || !st.joined) return;
      if (ms == null) st._dgB = 0;   // yangi yurish — band bo'lgandagi qayta urinishlar hisobi yangidan
      clearTimeout(st._dgT); st._dgT = setTimeout(function () { send({ type: "roomEval", roomId: roomId }); }, ms == null ? 250 : ms);
    }
    function spSq(i) { return "abcdefgh".charAt(i & 7) + (8 - (i >> 3)); }
    function spDgFresh(d) { return !!(d && !d.busy && !d.err && d.n === st.moves.length); }   // baho hozirgi doskaga tegishli
    function spDgTxt() {
      var d = st.dg, z = document.getElementById("spDG"); if (!z) return;
      var ev = z.querySelector(".bar b"), w = z.querySelector(".bar .tr i"), bm = z.querySelector(".bar .bm"), mv = z.querySelector(".mv");
      if (!d || d.busy || d.err) {
        ev.textContent = "…"; w.style.width = "50%"; bm.textContent = "";
        mv.textContent = !d ? "Hisoblanmoqda…" : d.err ? "Bu o‘yinni tahlil qilib bo‘lmaydi" : "Dragon band — birozdan so‘ng";
        return;
      }
      var x = typeof d.ev === "number" ? d.ev / 200 : null, big = x != null && Math.abs(x) >= 10;
      ev.textContent = x == null ? "—" : big ? (x > 0 ? "⚪ yutadi" : "⚫ yutadi") : (x > 0.05 ? "+" : x < -0.05 ? "−" : "") + Math.abs(x).toFixed(1);
      w.style.width = (x == null ? 50 : 50 + Math.max(-5, Math.min(5, x)) * 10) + "%";
      var b = d.best;   // navbatdagi tomon uchun kuchli yurish — doskadagi yashil strelka bilan bir xil
      bm.textContent = b ? (d.turn === "black" ? "⚫ " : "⚪ ") + spSq(b.from) + (b.caps ? ":" : "-") + (b.path || []).map(spSq).join(b.caps ? ":" : "-") : "";
      var h = "", m = d.mv || {}, f = m.from ? m.from.r * 8 + m.from.c : -1, t = m.to ? m.to.r * 8 + m.to.c : -1;
      if (f >= 0) {   // oxirgi qilingan yurish: Dragon bahosi bo'yicha belgi
        var pb = d.pbest, same = !!(pb && pb.from === f && pb.path && pb.path[pb.path.length - 1] === t);
        var sg = m.col === "black" ? -1 : 1, loss = typeof d.prev === "number" && typeof d.ev === "number" ? sg * (d.prev - d.ev) / 200 : 0;
        var mk = same || loss < 0.3 ? '<span class="ok">✓ aniq</span>' : loss < 0.8 ? '<span class="bad">?! noaniq</span>' : loss < 1.5 ? '<span class="bad">? xato</span>' : '<span class="bad">?? qo‘pol xato</span>';
        h = Math.ceil(d.k / 2) + ". " + (m.col === "black" ? "⚫" : "⚪") + " " + spSq(f) + (m.caps ? ":" : "-") + spSq(t) + " " + mk;
      }
      if (d.end) h += (h ? " <em>·</em> " : "") + "<em>yurish qolmadi</em>";
      mv.innerHTML = h || (b ? "<em>Yashil strelka — kuchli yurish</em>" : "—");
    }
    function spDgArrows() {   // doskada yashil strelka — navbatdagi tomon uchun Dragonning kuchli yurishi (yurishdan oldin)
      var old = document.getElementById("spDA"); if (old) old.remove();
      var d = st.dg; if (st.color !== "spectator" || !spDgOn() || !spDgFresh(d) || !d.best || !d.best.path || !d.best.path.length) return;
      var fl = flipped();
      function pt(i) { var r = i >> 3, c = i & 7; if (fl) { r = 7 - r; c = 7 - c; } return [c + 0.5, r + 0.5]; }
      var P = [d.best.from].concat(d.best.path).map(pt), n = P.length;
      var a = P[n - 2], z = P[n - 1], dx = z[0] - a[0], dy = z[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1; P[n - 1] = [z[0] - dx / L * 0.3, z[1] - dy / L * 0.3];
      var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.id = "spDA"; s.setAttribute("viewBox", "0 0 8 8");
      s.innerHTML = '<defs><marker id="spAhG" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#3fb950"/></marker></defs>' +
        '<polyline points="' + P.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" ") + '" fill="none" stroke="#3fb950" stroke-width=".15" stroke-linecap="round" stroke-linejoin="round" opacity=".85" marker-end="url(#spAhG)"/>';
      if (getComputedStyle(elBoard).position === "static") elBoard.style.position = "relative";
      elBoard.appendChild(s);
    }
    function spDgSet(m) {
      if (m.off) { st.dgOk = false; st.dg = null; spSpecUI(); spDgArrows(); return; }   // admin o'chirgan
      if (m.n != null && m.n < st.moves.length) { if (st._dgN !== st.moves.length) { st._dgN = st.moves.length; spDgReq(); } return; }   // eski doska uchun javob — yangisini so'raymiz
      st.dg = m; spDgTxt(); spDgArrows();
      if (m.busy && (st._dgB = (st._dgB || 0) + 1) <= 6) spDgReq(2500);   // Dragon band — biroz kutib qayta (ko'pi bilan 6 marta)
    }
    function spAdmAnalyze() {   // 🔬 Dragon kuzatuvi ochiq tomoshabin (va admin): davom etayotgan o'yinni hozirgi pozitsiyadan tahlil taxtasida yurib ko'rish
      if (!st.dgOk) return;
      try { window.spBoardOpen({ moves: st.moves.slice(), white: nameLine("white"), black: nameLine("black"), start: st.opening && st.opening.board ? st.opening.board : undefined, first: st.opening && st.opening.side === "b" ? "black" : undefined, at: st.moves.length, flip: flipped(), live: !st.finished, winner: st.finished ? st.winner : null }); } catch (e) {}
    }
    function spSpecUI() {
      var spec = st.color === "spectator" && st.joined;
      root.classList.toggle("rcSpec", spec);
      var sh = document.getElementById("spSH"), dg = document.getElementById("spDG");
      if (!spec) { if (sh) sh.remove(); if (dg) dg.remove(); var a0 = document.getElementById("spDA"); if (a0) a0.remove();
      (function () {
        var pc = document.getElementById("spPC");
        if (st.color === "spectator") { if (pc) pc.remove(); return; }
        var L = spList(), n = st.spectators || L.length;
        if (!n) { if (pc) pc.remove(); return; }
        if (!document.getElementById("spPCcss")) { var cs = document.createElement("style"); cs.id = "spPCcss"; cs.textContent = "#spPC{width:min(94vw,520px);display:flex;justify-content:flex-end;margin:0 0 6px;box-sizing:border-box;position:relative}#spPC .sv{all:unset;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:99px;background:rgba(0,0,0,.28);cursor:pointer}#spPC .avs{display:flex}#spPC .avs span{width:26px;height:26px;border-radius:50%;border:2px solid #fff;margin-left:-9px;display:flex;align-items:center;justify-content:center;color:#fff;font:700 12px system-ui,sans-serif;box-sizing:border-box;overflow:hidden;background-size:cover;background-position:center}#spPC .sv b{display:flex;align-items:center;gap:4px;font:700 14px system-ui,sans-serif;color:#e8dccb}#spPC .sv b svg{width:17px;height:17px}#spPC #spSL{position:absolute;right:0;top:100%;z-index:60;margin-top:4px;min-width:190px;max-height:260px;overflow:auto;background:#1f2a22;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.4)}#spPC #spSL h4{margin:0 0 8px;font:700 13px system-ui,sans-serif;color:#cfc5b5}#spPC #spSL div{display:flex;align-items:center;gap:8px;padding:4px 0;font:600 14px system-ui,sans-serif;color:#f3ebe0}#spPC #spSL div span{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font:700 12px system-ui,sans-serif;overflow:hidden;background-size:cover;background-position:center;flex:none}"; document.head.appendChild(cs); }
        if (!pc) {
          pc = document.createElement("div"); pc.id = "spPC";
          pc.innerHTML = '<button class="sv"><div class="avs"></div><b>' + RC_ICO.eye + "<span></span></b></button>";
          root.insertBefore(pc, elTop);
          pc.querySelector(".sv").onclick = function (e) {
            e.stopPropagation();
            var l = document.getElementById("spSL"); if (l) { l.remove(); return; }
            var L2 = spList(); l = document.createElement("div"); l.id = "spSL";
            l.innerHTML = "<h4>Tomoshabinlar · " + (st.spectators || L2.length) + "</h4>" + L2.map(function (x) { return "<div>" + spAv(x) + spEsc(x.n) + "</div>"; }).join("");
            pc.appendChild(l);
            setTimeout(function () { document.addEventListener("click", function cl() { var q = document.getElementById("spSL"); if (q) q.remove(); document.removeEventListener("click", cl); }); }, 0);
          };
        }
        var ah = L.slice(0, 3).map(spAv).join("");
        var avs = pc.querySelector(".avs"); if (avs._h !== ah) { avs._h = ah; avs.innerHTML = ah; }
        pc.querySelector(".sv b span").textContent = String(n);
      })();
 return; }
      if (!sh) {
        sh = document.createElement("div"); sh.id = "spSH";
        sh.innerHTML = '<button class="bk" aria-label="Zalga">' + RC_ICO.back + '</button><div class="tt"><i></i><span></span></div><button class="sv"><div class="avs"></div><b>' + RC_ICO.eye + "<span></span></b></button>";
        root.insertBefore(sh, elStatus);
        sh.querySelector(".bk").onclick = function () { elZal.onclick(); };
        sh.querySelector(".sv").onclick = function (e) {
          e.stopPropagation();
          var l = document.getElementById("spSL"); if (l) { l.remove(); return; }
          var L = spList(); l = document.createElement("div"); l.id = "spSL";
          l.innerHTML = "<h4>Tomoshabinlar · " + (st.spectators || L.length) + "</h4>" + L.map(function (x) { return "<div>" + spAv(x) + spEsc(x.n) + "</div>"; }).join("");
          sh.appendChild(l);
          setTimeout(function () { document.addEventListener("click", function cl() { var q = document.getElementById("spSL"); if (q) q.remove(); document.removeEventListener("click", cl); }); }, 0);
        };
      }
      var L = spList(), n = st.spectators || L.length;
      var wn = st.winner === "white" ? st.white : st.winner === "black" ? st.black : null;
      sh.querySelector(".tt i").className = st.finished ? "off" : "";
      sh.querySelector(".tt span").textContent = !st.finished ? "Jonli tomosha" : st.winner === "draw" ? (st.reason === "abort" ? "O‘yin bekor qilindi" : "🤝 Durang") : wn ? "🏆 " + wn + " yutdi" : "O‘yin tugadi";
      var ah = L.slice(0, 4).map(spAv).join("");
      var avs = sh.querySelector(".avs"); if (avs._h !== ah) { avs._h = ah; avs.innerHTML = ah; }
      sh.querySelector(".sv b span").textContent = String(n);
      if (!st.dgOk) { if (dg) dg.remove(); return; }   // 🐉 admin bu tomoshabinga (yoki hammaga) o'chirgan
      if (!dg) {
        dg = document.createElement("button"); dg.id = "spDG";
        dg.innerHTML = '<div class="ic">🐉</div><div class="t"><div class="a"><b>Dragon bilan kuzatish</b><small>Kuchli yurish strelka bilan</small></div>' +
          '<div class="z"><div class="bar"><b>…</b><div class="tr"><i></i></div><span class="bm"></span></div><div class="mv">Hisoblanmoqda…</div></div></div><div class="sw"></div><span class="an">Tahlil</span>';
        root.insertBefore(dg, elTop);
        dg.querySelector(".an").onclick = function (e) { e.stopPropagation(); spAdmAnalyze(); };   // 🔬 «Tahlil»: shu o'yinni hozirgi pozitsiyadan taxtada yurib ko'rish (lichess kabi)
        dg.onclick = function () {
          if (st.dgAdm) { spAdmAnalyze(); return; }   // admin: doim yoniq — karta bosilsa ham tahlil ochiladi
          var on = !spDgOn(); st._dgOn = on; try { localStorage.setItem("spDg", on ? "1" : "0"); } catch (e) {}
          dg.classList.toggle("on", on);
          if (on) { st.dg = null; st._dgB = 0; spDgTxt(); spDgReq(0); } else spDgArrows();
        };
        spDgTxt();
      }
      dg.classList.toggle("on", spDgOn()); dg.classList.toggle("adm", !!st.dgAdm);
    }

    var elBerserk = document.createElement("button");
    elBerserk.textContent = "⚡ Berserk";
    elBerserk.className = elResign.className;
    elBerserk.style.display = "none";
    // ⚡ pastki panel ustida suzib turadi — ekrandan chiqib ketmaydi
    elBerserk.dataset.fx = "1";
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
    elInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); sendChat(); } });
    var CATS = [["🎮","Yurishlar",["👍 Ajoyib yurish!","⏩ Tezroq yur!","🐢 Shoshilma!","🎯 Aniq yurish!","🧠 Aqlli yurish!","🔥 Zo‘r yurish!","⚡ Tez va aniq!","👀 Yaxshilab o‘yla!","🤔 Variantlarni ko‘r!","💡 Mana bu yurishni qara!","🚀 Olg‘a!","Tavakkal qil!","🛡️ Himoyalan!","⚔️ Hujum qil!","🔄 Yana bir o‘yla!"]],["🧠","Strategiya",["🧠 Haqiqiy strateg!","♟️ Reja zo‘r!","🔮 Keyingi yurishni bilaman!","🧐 Qiziq strategiya!","💡 Zo‘r fikr!","🎯 Hammasi hisoblangan!","🕵️ Tuzog‘imga tushding!","🪤 Bu tuzoq!","🤯 Qanday yurish?!","📈 Ustunlik menda!","🧩 Kombinatsiyani top!","🧠 Miyani ishlat!","👑 Strategiya qiroli!","🥷 Ayyor yurish!","🔍 Bir xatoni kutyapman!"]],["🔥","Hujum",["🔥 Zo‘r kombinatsiya!","⚔️ Hujum boshlandi!","💥 Kuchli zarba!","🎯 Nishonga tegdi!","🪓 Bittasi ketdi!","💣 Portlovchi yurish!","🚀 Hujumga o‘t!","🐉 Shafqatsiz hujum!","⚡ Chaqmoqdek yurish!","🥊 Zarba ber!","🔗 Ketma-ket zarbalar!","💥 Bir yurishda ikki dona!","🧨 Kutilmagan hujum!","🦈 O‘ljani ko‘rdim!","🏹 Aniq zarba!"]],["👑","Dama",["👑 Dama bo‘ldi!","🎉 Dama oldim!","💎 Dama — mening boyligim!","🏆 Ustunlik menda!","📈 Vaziyat yaxshi!","😎 Endi qiziq bo‘ladi!","🔥 Dama bilan ehtiyot bo‘l!","👑 Dama qiroli!","🚀 Dama bilan hujum!","🛡️ Damani asra!","😏 Dama bilan nima qilasan?","💪 Kuchlar teng emas!","🌟 Dama vaqti!","🎯 Damani tutib ko‘r!","🦁 Maydon meniki!"]],["😂","Hazil",["😂 Nima qilyapsan?","🤣 Bunaqasi ham bo‘ladimi?","😅 Voy, xato ketdi!","🙈 Ko‘rmadim deb hisobla!","🤦 O‘zim ham tushunmadim!","😜 Ataylab qildim!","🫣 Bu yurishni unutaylik!","🤡 Bugun omad kulmadi!","🥲 Yuragim og‘ridi!","😎 Hammasi reja bo‘yicha!","🤭 Seni sinab ko‘rdim!","🐒 Qiziq yurish ekan!","😆 Qaytadan o‘ynaymizmi?","🙃 Vaziyat chatoq!","🫡 Xo‘p, ustoz!"]],["😤","Chaqiriq",["😤 Qani, kuchingni ko‘rsat!","🔥 Meni yenga olasanmi?","😏 Ishonching komilmi?","🥶 Sovuqqon bo‘l!","👀 Seni kuzatyapman!","🐯 Hujumga tayyormisan?","🦁 Qani, boshladik!","🎯 Meni tutib ko‘r!","🧠 O‘ylashga vaqt bor!","😜 Qo‘rqib ketdingmi?","⚔️ Oxirigacha kurash!","🏆 G‘olib kim bo‘larkin?","💪 Qani, raqib!","🔥 Hali hammasi oldinda!","😎 Men tayyorman!"]],["🤝","Hurmat",["👏 Yaxshi o‘yin!","🤝 Omad, raqib!","🙌 Ajoyib!","💯 Zo‘r o‘ynayapsan!","🫡 Hurmat!","👏 Chiroyli yurish!","🧠 Ustalik bilan!","🌟 Barakalla!","🏅 Haqiqiy mahorat!","🤜🤛 Kuchli raqib!","❤️ O‘yin uchun rahmat!","🙏 Rahmat, do‘stim!","🎖️ Munosib raqib!","🤝 Yana o‘ynaymiz!","🏆 G‘alabang muborak!"]],["😬","Omadsizlik",["😅 Omadsizlik!","🤦 Qanday xato!","😭 Voy, donam ketdi!","💔 Bu og‘riqli bo‘ldi!","🥲 Buni kutmagandim!","😵 Vaziyat yomonlashdi!","🙈 Xatoni ko‘rmadim!","😓 Endi nima qilaman?","💀 Tamom bo‘ldim!","🫠 Vaziyat erib ketdi!","😩 Bitta dona qoldi!","🤯 Qanday qilib?!","🥶 Sovuq dush!","📉 Ustunlik qo‘ldan ketdi!","🫥 Jim bo‘lib qoldim..."]],["🏆","G‘alaba",["🏆 Yutding!","🎉 G‘alaba!","👑 Men chempionman!","🔥 Zo‘r g‘alaba!","🥇 Birinchi o‘rin!","😎 Men aytgandim!","💪 Kuchlilar g‘alaba qozonadi!","🏳️ Taslim bo‘laman!","😅 Bu safar seniki!","🤝 Durang?","🥲 Keyingi safar yutaman!","🔄 Qayta o‘ynaymiz!","🏆 G‘alaba shirin!","👏 Munosib g‘alaba!","🎮 Yana bir partiya!"]],["⏳","Vaqt",["⏩ Tezroq yur!","⏰ Vaqt ketyapti!","🐢 Juda sekin!","⚡ Tezroq!","⌛ Kutib turibman!","🕐 Vaqting oz qoldi!","🏃 Qani, yur!","😴 Uxlab qoldingmi?","🤔 Hali ham o‘ylayapsanmi?","🚦 Navbat senda!","🔔 Yurish vaqti!","🧘 Shoshilma, lekin yur!","⏳ Vaqt tugayapti!","👀 Kutamiz...","⚡ Tezkor o‘yin!"]],["🤔","Hayrat",["🤔 O‘ylayapsanmi?","😳 Rostdanmi?","😮 Voy-bo‘!","🤯 Aql bovar qilmaydi!","🧐 Qiziq yurish!","👀 Buni kutmagandim!","😲 Qanday kombinatsiya!","🤨 Ishonching komilmi?","😱 Bunaqa ham bo‘ladimi?!","🫢 Kutilmagan yurish!","🧩 Rejangni tushunmadim!","🤔 Nima maqsad?","😏 Nimadir rejalashtiryapsan!","🕵️ Bir sir bor...","💭 O‘ylab ko‘ray..."]],["💪","Ruhlantirish",["💪 Sen uddalaysan!","🔥 Olg‘a!","🚀 To‘xtama!","🦁 Kurashni davom ettir!","🌟 Hammasi oldinda!","🙌 Ishon o‘zingga!","💯 Zo‘r ketyapsan!","🏆 G‘alabaga intil!","⚡ Kuchingni ko‘rsat!","🎯 Maqsad sari!","💪 Taslim bo‘lma!","🔥 Oxirigacha!","🌈 Hali imkon bor!","🧠 Aql bilan yut!","🥇 Chempion bo‘l!"]],["😎","Maqtanish",["😎 Shashka ustasi!","👑 Men qirolman!","🔥 Menga teng keladigani yo‘q!","🏆 G‘alaba meniki!","💪 Kuchimni ko‘rdingmi?","😏 Hammasi nazoratda!","🧠 Ustalik shu!","🥷 Sokin, lekin xavfli!","🎯 Bir zarbada!","👑 Maydon hukmdori!","😎 Professional daraja!","💎 Mening uslubim!","🚀 Darajam boshqa!","🦾 Kuchli o‘yinchi!","🏅 Tajriba gapiradi!"]],["🔁","Takliflar",["🤝 Durang?","🔄 Qayta o‘ynaymizmi?","🎮 Yana bir partiya?","⏸️ Biroz tanaffus?","🤔 Durangga rozimisan?","🔥 Yana bir jang!","🏆 Revansh qilamizmi?","🙌 Tayyor bo‘lsang, boshlaymiz!","🤜🤛 Kelishdik!","🔁 Yana urinib ko‘r!","🎯 Rematch?","🫱🏻‍🫲🏼 Kelishuv?","🕹️ O‘yinni davom ettiramiz!","💪 Ikkinchi raund?","👋 Keyingi safargacha!"]],["⚔️","Shashka",["♟️ Shashka ustasi!","👑 Dama bo‘ldi!","💥 Urib ol!","🔗 Zanjirli zarba!","🪤 Tuzoq tayyor!","🎯 Donani saqla!","🛡️ Himoyani mustahkamla!","⚔️ Hujum vaqti!","🔄 Donalarni almashtiramizmi?","🧩 Kombinatsiyani ko‘r!","🏃 Dama tomon yur!","👀 Donangni ehtiyot qil!","💎 Damani yo‘qotma!","🔥 Oxirgi donagacha!","🏆 Shashka — aql o‘yini!"]]];
    var elQ = root.querySelector("#rcQuick");
    // emojili so'zlar: bo'lim tugmalari (belgi + nomi) va so'zlar — chat panelining pastida
    var tabs = document.createElement("div");
    tabs.style.cssText = "display:flex;gap:6px;overflow-x:auto;padding:4px;margin-bottom:8px;background:rgba(0,0,0,.25);border-radius:99px;scrollbar-width:none";
    var box = document.createElement("div");
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;max-height:150px;overflow-y:auto";
    function showCat(i) {
      box.innerHTML = "";
      for (var k = 0; k < tabs.children.length; k++) tabs.children[k].classList.toggle("on", k === i);
      CATS[i][2].forEach(function (p) {
        var bt = document.createElement("button");
        bt.className = "rcQp"; bt.textContent = p;
        bt.onclick = function () { send({ type: "roomChat", roomId: roomId, text: p }); };
        box.appendChild(bt);
      });
    }
    CATS.forEach(function (c, i) {
      var t = document.createElement("button");
      t.className = "rcQc"; t.textContent = c[0] + " " + c[1];
      t.onclick = function () { showCat(i); };
      tabs.appendChild(t);
    });
    elQ.appendChild(tabs); elQ.appendChild(box);
    showCat(0);
    root.querySelector("#rcCX").onclick = function () { if (st.chatOpen) elChatBtn.click(); };
    root.querySelector("#rcChatBd").onclick = function () { if (st.chatOpen) elChatBtn.click(); };
    elInput.addEventListener("keydown", function (e) { if (e.key === "Enter") sendChat(); });

    function addMsg(msg) {
      if (msg.uid && window.lbFriendState && window.lbFriendState(msg.uid) === "blocked") return;   // 🚫 bloklaganim yozganlari ko'rinmaydi
      var row = document.createElement("div");
      var who = document.createElement("b");
      who.textContent = (msg.color === "white" ? "⚪ " : msg.color === "black" ? "⚫ " : "👁 ") + (msg.prem ? "👑 " : "") + msg.name + ": ";
      who.style.color = msg.prem ? "#ffd54a" : msg.color === "spectator" ? "#8aa" : "#e3b746";
      var tx = document.createElement("span");
      tx.textContent = msg.text;
      row.appendChild(who); row.appendChild(tx);
      elMsgs.appendChild(row);
    }
    function renderChat() {
      var _bd = root.querySelector("#rcChatBd");
      if (st.vsBot) { elChatBtn.style.display = "none"; elChat.style.display = "none"; _bd.style.display = "none"; st._cbHid = true; return; }
      if (st._cbHid) { elChatBtn.style.display = ""; st._cbHid = false; if (typeof rcmChatVis === "function") rcmChatVis(); }
      if (elChatBtn.style.display === "none") st.chatOpen = false;   // chat menyuda o'chirilgan
      elChat.style.display = st.chatOpen ? "" : "none";
      _bd.style.display = st.chatOpen ? "" : "none";
      elChatBtn.textContent = "💬 Chat" + (st.unread ? " (" + st.unread + ")" : "");
    }
    function rebuildChat() {
      elMsgs.innerHTML = "";
      for (var i = 0; i < st.chat.length; i++) addMsg(st.chat[i]);
      elMsgs.scrollTop = elMsgs.scrollHeight;
    }

    // 🔁 O'yin tugagach 10 soniyalik panel: Revansh / Stolga qaytish; vaqt tugasa — stolga
    var RM = { end: 0, key: '', el: null, t: null, done: false };
    function rmPanel() {
      var on = st.rmOk && st.finished && st.white && st.black && st.color && st.color !== "spectator";
      var key = on ? String(roomId) + '|' + (st.moves || []).length + '|' + (st.winner || '') : '';
      if (!on) { if (RM.el) { RM.el.remove(); RM.el = null; } if (RM.t) { clearInterval(RM.t); RM.t = null; } RM.key = ''; return; }
      if (RM.key !== key) { RM.key = key; RM.end = Date.now() + 10000; RM.done = false; RM.hid = false; }
      if (RM.hid) return;
      if (!RM.el) {
        RM.el = document.createElement('div'); RM.el.id = 'rcRm';
        RM.el.style.cssText = 'position:fixed;inset:0;z-index:2147481000;background:rgba(5,4,20,.55);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box';
        document.body.appendChild(RM.el);
      }
      var me = st.color, op = me === 'white' ? 'black' : 'white', win = st.winner, dr = win === 'draw' || !win, iw = win === me;
      var nm = function (c) { return String(st[c] || '').replace(/[<>&"]/g, ''); };
      var ini = function (c) { var m0 = nm(c).match(/[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ0-9]/); return (m0 ? m0[0] : (Array.from(nm(c))[0] || '?')).toUpperCase(); };
      var avH = function (c) { var inf = c === 'white' ? st.wInfo : st.bInfo, w = !dr && win === c, bd = 'width:66px;height:66px;margin:0 auto;border-radius:50%;position:relative;border:3px solid ' + (w ? '#ffd34d;box-shadow:0 0 16px rgba(255,211,77,.5)' : '#2f3a5c') + ';';
        var inner = inf && inf.uid && inf.av ? '<img src="/api/av/' + encodeURIComponent(inf.uid) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block" onerror="this.outerHTML=\'<span style=&quot;display:flex;width:100%;height:100%;align-items:center;justify-content:center;font-weight:900;font-size:24px&quot;>' + ini(c).replace(/'/g, '') + '</span>\'">' : '<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;font-weight:900;font-size:24px;border-radius:50%;background:' + (c === me ? 'linear-gradient(135deg,#8b5cf6,#3b82f6)' : 'linear-gradient(135deg,#f97316,#be123c)') + '">' + ini(c) + '</span>';
        return '<div style="' + bd + '">' + (w ? '<span style="position:absolute;top:-17px;left:50%;transform:translateX(-50%);font-size:20px">👑</span>' : '') + inner + '</div>'; };
      var ed = st.eloD, elH = function (c) { if (!ed || ed[c] == null) return '<div style="font-size:12px;margin-top:3px;opacity:.5">' + (st.unrated ? 'reytingsiz' : '…') + '</div>'; var d = ed[c], nw = c === 'white' ? ed.we : ed.be; return '<div style="font-size:13px;margin-top:3px;opacity:.9">' + (nw ? (nw - d) + ' → ' : '') + '<b style="color:' + (d >= 0 ? '#7ee08a' : '#ff8a8a') + '">' + (nw ? nw + ' ' : '') + '(' + (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + ')</b></div>'; };
      var pl = function (c) { return '<div style="width:140px">' + avH(c) + '<div style="font-size:14px;margin-top:7px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (c === me ? nm(c) + ' (siz)' : nm(c)) + '</div>' + elH(c) + '</div>'; };
      var R = st.reason, why = dr ? (R === 'agreed' ? 'Kelishilgan durang' : R === 'abort' ? 'O‘yin bekor qilindi' : 'Durang') : R === 'timeout' ? (iw ? 'Raqib vaqti tugadi' : 'Vaqtingiz tugadi') : R === 'resign' ? (iw ? 'Raqib taslim bo‘ldi' : 'Siz taslim bo‘ldingiz') : R === 'abandon' ? (iw ? 'Raqib o‘yindan chiqib ketdi' : 'Siz o‘yindan chiqib ketdingiz') : R === 'noshow' ? 'Birinchi yurish qilinmadi' : (iw ? 'Raqibning yurishi qolmadi' : 'Yurishingiz qolmadi');
      why += st.tc ? ' · ' + st.tc : '';
      var hd = dr ? 'radial-gradient(circle at 50% 0,#7a641f 0,#3b3214 55%,#141b2e 100%)' : iw ? 'radial-gradient(circle at 50% 0,#3d7a1f 0,#1f3b14 55%,#141b2e 100%)' : 'radial-gradient(circle at 50% 0,#7a1f2a 0,#3b141b 55%,#141b2e 100%)';
      var h2 = '', H = st.h2h;
      if (H && H.n) {
        var f = function (x) { var k = Math.floor(x), fr = x - k > 0.01; return (k || !fr ? String(k) : '') + (fr ? '½' : ''); }, L = H.last || [], wl = dr ? '' : (win === 'white' ? 'w' : 'b'), sk = 0;
        for (var q = L.length - 1; q >= 0 && wl && L[q] === wl; q--) sk++;
        h2 = '<div style="margin:8px 0 0;font-size:13px;background:#1c2540;border-radius:12px;padding:8px">O‘zaro hisob: <b>' + f(H[me] || 0) + ' – ' + f(H[op] || 0) + '</b>' + (sk >= 2 ? ' · ' + (iw ? 'Siz' : nm(op)) + ': ' + sk + ' ta g‘alaba ketma-ket' : '') + '</div>';
      }
      var bs = 'flex:1;border-radius:14px;padding:13px 0;font-size:16px;font-weight:800;color:#fff;cursor:pointer;';
      var msg = '', b1 = '', b2 = '<button data-rm="leave" style="' + bs + 'background:transparent;border:2px solid #3a425a">Stolga qaytish</button>';
      if (st.rematch === 'done') { msg = 'Yangi o‘yin ochilmoqda…'; b2 = ''; }
      else if (st.rematch === me) { msg = 'Revansh taklifi yuborildi — raqib javobi kutilmoqda…'; b1 = '<button data-rm="no" style="' + bs + 'background:transparent;border:2px solid #3a425a">Bekor qilish</button>'; }
      else if (st.rematch) { msg = '<b>' + nm(op) + '</b> revansh taklif qilyapti (ranglar almashadi)'; b1 = '<button data-rm="no" style="' + bs + 'background:transparent;border:2px solid #3a425a">Rad etish</button>'; b2 = '<button data-rm="yes" style="' + bs + 'background:#4f7dff;border:0">Qabul qilish</button>'; }
      else b1 = '<button data-rm="yes" style="' + bs + 'background:#5c9a2e;border:0">Revansh</button>';
      var ss = 'flex:1;border-radius:12px;padding:9px 0;font-size:14px;background:#1c2540;border:0;color:#fff;cursor:pointer';
      var sm = '<div style="display:flex;gap:8px;margin:0 0 14px"><button data-rm="an" style="' + ss + '">🔍 Tahlil</button>' + (iw && window.spShareCard ? '<button data-rm="sh" style="' + ss + '">📸 Ulashish</button>' : '') + '</div>';
      var h = '<div style="width:100%;max-width:420px;background:#141b2e;border-radius:24px;text-align:center;overflow:hidden;color:#fff;font-family:Roboto,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6)">' +
        '<div style="padding:20px 16px 16px;background:' + hd + '"><div style="font-size:40px;line-height:1">' + (dr ? '🤝' : iw ? '🏆' : '😔') + '</div><div style="font-size:28px;font-weight:900;margin-top:6px;color:' + (dr ? '#ffe08a' : iw ? '#fff' : '#ffb3b3') + '">' + (dr ? 'Durang' : iw ? 'G‘alaba!' : 'Mag‘lubiyat') + '</div><div style="font-size:14px;opacity:.78;margin-top:4px">' + why + '</div></div>' +
        '<div style="padding:4px 16px 0"><div style="display:flex;justify-content:space-around;align-items:flex-start;padding:14px 0 4px">' + pl(me) + '<div style="font-size:' + (dr ? 24 : 30) + 'px;font-weight:900;padding-top:18px;letter-spacing:1px;white-space:nowrap">' + (dr ? '½ : ½' : iw ? '1 : 0' : '0 : 1') + '</div>' + pl(op) + '</div>' + h2 +
        (msg ? '<div style="font-size:15px;margin:12px 0 0">' + msg + '</div>' : '') +
        '<div style="display:flex;gap:10px;margin:14px 0 10px">' + b1 + b2 + '</div>' + sm + '</div>' +
        '<div style="height:6px;background:#2a3147"><i id="rcRmBar" style="display:block;height:100%;background:#4f7dff;width:100%"></i></div></div>';
      if (RM.el._h !== h) {
        RM.el.innerHTML = h; RM.el._h = h;
        [].forEach.call(RM.el.querySelectorAll('[data-rm]'), function (b) {
          b.onclick = function () {
            var a = b.getAttribute('data-rm');
            if (a === 'yes') send({ type: "roomRematch", roomId: roomId });
            else if (a === 'no') send({ type: "roomRematchNo", roomId: roomId });
            else if (a === 'an') { RM.hid = true; RM.done = true; if (RM.el) { RM.el.remove(); RM.el = null; } var x = document.getElementById('rcAn'); if (x) x.click(); }
            else if (a === 'sh') { var o2 = nm(op); try { window.spShareCard({ theme: "win", title: "G‘ALABA!", big: "🏆", sub: "Raqib: " + o2, sub2: (st.tc ? "⏱ " + st.tc : "") + (st.reason === "timeout" ? " · vaqt bo‘yicha" : ""), cap: "🏆 ShashkaPRO’da " + o2 + "ni yutdim!" }); } catch (e) {} }
            else if (a === 'leave') { RM.done = true; if (st.rematch) send({ type: "roomRematchNo", roomId: roomId }); rcLeave(); }
          };
        });
      }
      if (!RM.t) RM.t = setInterval(function () {
        if (!RM.el) { clearInterval(RM.t); RM.t = null; return; }
        var left = Math.max(0, RM.end - Date.now()), bar = document.getElementById('rcRmBar'); if (bar) bar.style.width = (left / 100) + '%';
        if (left <= 0 && !RM.done && st.finished && st.rematch !== 'done') { RM.done = true; if (st.rematch) send({ type: "roomRematchNo", roomId: roomId }); rcLeave(); }
      }, 100);
    }
    // vaqt rejimi tugmalari (faqat o'yin boshlanmaguncha, faqat oq tanlaydi)
    function renderExtra() {
      try { rmPanel(); } catch (e) {}
      var ex = root.querySelector("#rcEx");
      if (!ex) {
        ex = document.createElement("div"); ex.id = "rcEx";
        ex.style.cssText = "display:none;margin:4px 0 8px;padding:8px 12px;border-radius:10px;background:#1c2733;text-align:center;max-width:min(94vw,520px)";
        var s0 = root.querySelector("#rcStatus"); s0.parentNode.insertBefore(ex, s0.nextSibling);
      }
      ex.innerHTML = "";
      var spec = st.color === "spectator", ser = (st.gamesTotal || 1) > 1;
      function line(t) { var d = document.createElement("div"); d.style.margin = "4px 0"; d.textContent = t; ex.appendChild(d); }
      function btn(t, fn) { var b = document.createElement("button"); b.textContent = t; b.style.margin = "3px"; b.onclick = fn; ex.appendChild(b); return b; }
      if (ser) {
        var sc = st.seriesScore || { white: 0, black: 0 };
        var no = Math.min((st.played || 0) + (st.finished ? 0 : 1), st.gamesTotal);
        line("🏁 Seriya " + (st.seriesDone ? "tugadi" : no + "/" + st.gamesTotal) + " · ⚪ " + sc.white + " – " + sc.black + " ⚫");
        if (st.finished && !st.seriesDone && st.nextIn) line("Keyingi o‘yin 5 soniyadan so‘ng, ranglar almashadi");
      }
      if (!spec && !st.etude && st.vsBot && !st.rmOk && st.finished && st.white && st.black && (!ser || st.seriesDone)) {
        if (st.rematch === st.color) {
          line("⏳ Raqib javobi kutilmoqda…");
          btn("Bekor qilish", function () { send({ type: "roomRematchNo", roomId: roomId }); });
        } else if (st.rematch) {
          line("🔁 Raqib qayta o‘ynashni taklif qildi");
          btn("✅ Qabul", function () { send({ type: "roomRematch", roomId: roomId }); });
          btn("❌ Rad", function () { send({ type: "roomRematchNo", roomId: roomId }); });
        } else {
          var _rb = btn("🔁 Qayta o‘ynash", function () { send({ type: "roomRematch", roomId: roomId }); }); _rb.style.cssText = "margin:3px;background:#5c9a2e;color:#fff;border:0;border-radius:10px;padding:10px 20px;font-size:16px;font-weight:bold;box-shadow:0 3px 0 #3e6b1f"; ex.insertBefore(_rb, ex.firstChild);
        }
      }
      if (!spec && st.stake && st.finished && st.winner && st.winner !== "draw" && st.winner !== st.color && !st.vsBot && (st.moves || []).length >= 2 && window.lbStakeRematch && !st._stRm) {
        var s2 = Math.min(1000, st.stake * 2);
        btn("🔁 Revansh: 2× tikish (" + s2 + " 🪙)", function () { st._stRm = true; window.lbStakeRematch(roomId); this.disabled = true; this.textContent = "⏳ Revansh taklifi yuborildi"; });
      }
      if (!spec && !st.arena && !st.etude && st.finished && st.winner === st.color && window.spShareCard) btn("📸 G‘alabani ulashish", function () { var opp = st.color === "white" ? st.black : st.white; window.spShareCard({ theme: "win", title: "G‘ALABA!", big: "🏆", sub: "Raqib: " + (st.vsBot ? "🤖 " : "") + (opp || ""), sub2: (st.tc ? "⏱ " + st.tc : "") + (st.reason === "timeout" ? " · vaqt bo‘yicha" : ""), cap: "🏆 ShashkaPRO’da " + (opp || "raqib") + "ni yutdim!" }); });
      if (false) btn("🎞 GIF qilib ulashish", function () {   // bot GIF yuboradi — u yerdan istalgan chatga ulashiladi
        var b = this; b.disabled = true; b.textContent = "⏳ GIF tayyorlanmoqda…";
        fetch("/api/gif", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": tg.initData }, body: JSON.stringify({ roomId: roomId }) })
          .then(function (r) { return r.json(); }).then(function (r) { b.textContent = r.ok ? "✅ GIF botga yuborildi — u yerdan ulashing" : "⚠️ " + (r.error || "Xatolik"); if (!r.ok) b.disabled = false; })
          .catch(function () { b.disabled = false; b.textContent = "⚠️ Server bilan aloqa yo‘q"; });
      });
      if (!spec && st.finished && st.vsBot && !st.opening && /Monster|Terminator|King ?Kong/i.test(String(st[st.botColor] || ""))) {
        var openRv = function () {
          var g0 = { moves: st.moves, me: st.color, white: nameLine("white"), black: nameLine("black"), winner: st.winner, bot: String(st[st.botColor] || "") };
          var go = function () { window.spReview(g0); };
          if (window.spReview) go(); else { var sc = document.createElement("script"); sc.src = "/review.js?v=3"; sc.onload = go; document.head.appendChild(sc); }
        };
        if (/King ?Kong/i.test(String(st[st.botColor] || ""))) btn("🦍 King Kong tahlili: xatolaringiz", openRv); else if (/Terminator/i.test(String(st[st.botColor] || ""))) btn("🦾 Terminator tahlili: xatolaringiz", openRv); else btn("👹 Monster tahlili: xatolaringiz", openRv);
        window.__rvDone = window.__rvDone || {};
        if (!window.__rvDone[roomId] && !st.opening) { window.__rvDone[roomId] = 1; setTimeout(openRv, 1800); }   // o'yin tugashi bilan o'zi ochiladi
      }
      if (spec && st.finished) {   // 👁 o'yin tugadi: boshqa jonli o'yinga o'tish yoki zalga
        var _nb = btn(st._nlT && Date.now() - st._nlT < 3000 ? "Hozir boshqa jonli o‘yin yo‘q" : "▶ Keyingi jonli o‘yin", function () { spNextLive(_nb); });
        _nb.style.cssText = "margin:3px;background:#5c9a2e;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-size:16px;font-weight:bold";
        btn("🏟 Zalga", function () { elZal.onclick(); });
      }
      ex.style.display = ex.childNodes.length ? "block" : "none";
      var _exB = !!(st.finished && ex.childNodes.length && (spec || !/^A.+?G\d+/.test(String(roomId))));   // arenada o'yinchining o'z paneli bor
      ex.classList.toggle("rcExB", _exB); root.classList.toggle("rcExOn", _exB);
    }

    function renderTc() { try { renderExtra(); } catch (e) { console.error(e); }
      elTc.innerHTML = "";
      if (st.vsBot) { renderBotSetup(); return; }
      elTc.style.display = "none"; return;   // vaqt va Standart/IDF tanlovi o‘yin oynasida yo‘q: o‘yin turi lobbida tanlanadi
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
      [["std", "📋 Standart"], ["idf", "IDF 780"]].forEach(function (pp) {
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
    function flipped() { return st.color === "spectator" ? !!st.specFlip : st.color === "black"; }   // tomoshabin «Burish» bilan aylantiradi
    function bothIn() { return !!(st.white && st.black); }
    // 🚪 raqib chiqib ketdi: 15 soniya kutish, keyin «Kutish» yoki «G'alabani olish»
    var claimHide = 0;
    setInterval(function () {
      var bar = document.getElementById("rcClaim");
      var me = st.color, opp = me === "white" ? "black" : me === "black" ? "white" : null;
      var off = opp && st.offAt && st.offAt[opp];
      if (!opp || st.finished || st.vsBot || !off || st[opp + "Online"] || (st.moves || []).length < 2 || Date.now() < claimHide) { if (bar) bar.remove(); return; }
      if (!bar) {
        bar = document.createElement("div"); bar.id = "rcClaim";
        bar.style.cssText = "position:fixed;left:10px;right:10px;bottom:18px;z-index:2147483000;background:#1b1f45;border:1px solid #f59e0b;border-radius:18px;padding:12px;color:#fff;font:600 15px system-ui,sans-serif;text-align:center;box-shadow:0 6px 24px #0009";
        document.body.appendChild(bar);
      }
      var left = Math.ceil(((st.claimMs || 15000) - (Date.now() - off)) / 1000), nm = st[opp] || "Raqib", k = left > 0 ? "w" + left : "btn";
      if (bar.getAttribute("data-k") === k) return; bar.setAttribute("data-k", k);
      if (left > 0) bar.innerHTML = "⚠️ " + String(nm).replace(/[<>&]/g, "") + " o‘yindan chiqib ketdi<div style='font-weight:400;font-size:13px;opacity:.8;margin-top:4px'>Qaytishini kutyapmiz… <b>" + left + "</b> s</div>";
      else {
        bar.innerHTML = "⚠️ " + String(nm).replace(/[<>&]/g, "") + " qaytmadi<div style='display:flex;gap:8px;margin-top:10px'><button id='rcClW' style='flex:1;border:1px solid #3a3f6b;background:transparent;color:#fff;border-radius:12px;padding:11px;font-size:15px'>⏳ Kutish</button><button id='rcClY' style='flex:1;border:0;background:linear-gradient(90deg,#22c55e,#10b981);color:#fff;border-radius:12px;padding:11px;font-size:15px;font-weight:700'>🏆 G‘alabani olish</button></div>";
        bar.querySelector("#rcClW").onclick = function () { claimHide = Date.now() + 30000; bar.remove(); };
        bar.querySelector("#rcClY").onclick = function () { send({ type: "roomClaimWin", roomId: roomId }); bar.remove(); claimHide = Date.now() + 3000; };
      }
    }, 500);

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

    // 🎯 «Pro avtohod»: borish katagiga tusha oladigan barcha qonuniy yurishlar (urish majburiyligi hisobga olinadi)
    function movesTo(r, c) {
      var me = myCode(), caps = allCaptures(st.board, me), out = [];
      for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
        if (!sameSide(st.board[i][j], me)) continue;
        var steps = caps.length ? captureSteps(st.board, i, j) : simpleSteps(st.board, i, j);
        for (var k = 0; k < steps.length; k++) if (steps[k].to.r === r && steps[k].to.c === c) out.push(steps[k]);
      }
      return out;
    }

    // ---------- chizish ----------
    function nameLine(color) {
      var nm = st[color], on = st[color + "Online"];
      var dot = color === "white" ? "⚪" : "⚫";
      return dot + " " + (nm ? (on ? "🟢 " : "🔴 ") + nm : "kutilmoqda…") +
        (st.color === color ? "  (siz)" : "");
    }

    // ismi chapda, soat o'ngda
    // o'yinchi kartasi: rasm, ism, onlayn holati va reyting, o'ngda soat (ramkada)
    function fillLine(el, color) {
      el.innerHTML = "";
      el.className = "rcPc";
      var _inf = color === "white" ? st.wInfo : st.bInfo, _nm = (color === "white" ? st.white : st.black) || "";
      function _letter() { var d = document.createElement("span"); d.className = "av"; d.textContent = (Array.from(String(_nm || "?"))[0] || "?").toUpperCase(); return d; }
      var av;
      if (_inf && _inf.uid && _inf.av) {
        av = document.createElement("img"); av.className = "av"; av.src = "/api/av/" + encodeURIComponent(_inf.uid);
        av.onerror = function () { if (av.parentNode) av.parentNode.replaceChild(_letter(), av); };
      } else av = _letter();
      el.appendChild(av);
      var nmD = document.createElement("div"); nmD.className = "nm";
      var b = document.createElement("b");
      b.textContent = (color === "white" ? "⚪ " : "⚫ ") + (_nm || "kutilmoqda…") + (st.color === color ? " (siz)" : "") + (st.berserk && st.berserk[color] ? " ⚡" : "");
      var sm = document.createElement("small");
      if (_nm) { var on = st[color + "Online"], ii = document.createElement("i"); ii.textContent = on ? "Onlayn" : "Oflayn"; ii.style.color = on ? "#7fc25a" : "#e0705a"; sm.appendChild(ii); }
      if (_inf && _inf.elo) {
        var _ed = st.finished && st.eloD ? st.eloD : null, _d = _ed ? _ed[color] : null, _nw = _ed ? (color === "white" ? _ed.we : _ed.be) : null;
        sm.appendChild(document.createTextNode((_nm ? " " : "") + "("));
        var _es = document.createElement("span"); _es.className = "el"; _es.textContent = typeof _d === "number" && _nw ? _nw : _inf.elo; sm.appendChild(_es);
        if (typeof _d === "number") { var _ds = document.createElement("i"); _ds.className = "eld"; _ds.textContent = (_d > 0 ? " +" : _d < 0 ? " −" : " ±") + Math.abs(_d); _ds.style.color = _d > 0 ? "#43a047" : _d < 0 ? "#e53935" : "#9e9e9e"; sm.appendChild(_ds); }   // ⭐ reyting o'zgarishi
        sm.appendChild(document.createTextNode(")"));
      }
      nmD.appendChild(b); nmD.appendChild(sm); el.appendChild(nmD);
      var r = document.createElement("span"); r.className = "ck"; r.setAttribute("data-clock", color);
      el.appendChild(r);
    }

    function remaining(color) {
      var ms = st.clock[color] || 0;
      var kkSide = st.vsBot && st.botColor === color && /King ?Kong/i.test(String(st[color] || ""));   // 🦍 soati yurmaydi
      if (st.clockRunning && !st.finished && st.turn === color && !kkSide) ms -= performance.now() - st.clockAt;
      return Math.max(0, ms);
    }

    function fmt(ms) {
      if (st && st.vsBot && (st.tc === "∞" || !st.tc)) return "∞";
      if (ms < 10000) { var _t = Math.floor(ms / 100) / 10; return "0:" + (_t < 10 ? "0" : "") + _t.toFixed(1); }
      var sec = Math.ceil(ms / 1000), m = Math.floor(sec / 60), s = sec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function updateClocks() {
      var els = root.querySelectorAll("[data-clock]");
      for (var i = 0; i < els.length; i++) {
        var color = els[i].getAttribute("data-clock"), ms = remaining(color);
        if (st.vsBot && st.botColor === color && /King ?Kong/i.test(String(st[color] || "")) && false) { els[i].textContent = "∞"; els[i].style.background = "#1c2733"; els[i].style.color = "#fff"; continue; }   // 🦍 soatsiz
        els[i].textContent = fmt(ms);
        var active = st.clockRunning && !st.finished && st.turn === color;
        var lt = root.classList.contains("rcL");   // och fon
        els[i].style.background = active ? (ms < 10000 ? "rgba(224,74,58,.22)" : "rgba(129,182,76,.2)") : (lt ? "#f3ede4" : "rgba(0,0,0,.25)");
        els[i].style.borderColor = active ? (ms < 10000 ? "#e04a3a" : "#81b64c") : (lt ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.16)");
        els[i].style.color = active ? (lt ? "#2b2119" : "#fff") : (lt ? "#3a2a1d" : "#bfb3a2");
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

    // 🤝 o'zaro natija (lidraughts uslubida): oxirgi 10 o'yin va umumiy hisob
    window.__h2hAdm = false;
  function h2hHdr() { return { 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  try { fetch('/api/h2hreset', { headers: h2hHdr() }).then(function (r) { return r.json(); }).then(function (j) { window.__h2hAdm = !!(j && j.admin); }).catch(function () {}); } catch (x) {}
  function h2hBtn() {
    if (!(st.botUid && window.__h2hAdm)) return '';
    var S = 'background:none;border:0;color:#ffb4b4;font-size:12px;padding:4px 2px';
    return '<div style="display:flex;justify-content:flex-end;gap:14px;margin-top:2px"><button data-h2h="one" style="' + S + '">🗑 Shu bot</button><button data-h2h="all" style="' + S + '">🗑 Hammasi</button></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-h2h]') : null;
    if (!b) return;
    var one = b.getAttribute('data-h2h') === 'one';
    var msg = (one ? 'Shu bot bilan hisob' : 'Hamma botlar bilan hisob') + ' o‘chiriladi. Qaytarib bo‘lmaydi. Davom etasizmi?';
    function go() {
      fetch('/api/h2hreset' + (one && st.botUid ? '/' + encodeURIComponent(st.botUid) : ''), { method: 'POST', headers: h2hHdr() })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok) { st.h2h = null; var el = document.getElementById('rcH2H'); if (el) el.style.display = 'none'; } })
        .catch(function () {});
    }
    try { var tg = window.Telegram && Telegram.WebApp; if (tg && tg.showConfirm) { tg.showConfirm(msg, function (ok) { if (ok) go(); }); return; } } catch (x) {}
    if (confirm(msg)) go();
  });
  // 🤝 o'zaro hisob — bitta qatorda: «Siz 3.5 : 1.5 Raqib» (har bir o'yin alohida ko'rsatilmaydi, joy egallamaydi)
  function drawH2H(topColor, bottomColor) {
      var el = document.getElementById("rcH2H"), h = st.h2h;
      if (!h || !h.n) { if (el) el.style.display = "none"; return; }
      if (!el) { el = document.createElement("div"); el.id = "rcH2H"; elBottom.parentNode.insertBefore(el, elBottom.nextSibling); }
      el.style.display = "";
      var sc = function (x) { return String(Math.round((+x || 0) * 2) / 2); };
      var nm = function (c) { return String(st[c] || (c === "white" ? "Oq" : "Qora")).replace(/[<>&"]/g, ""); };
      var me = bottomColor, op = topColor;
      el.innerHTML = '<span class="t">O‘zaro hisob</span><span class="s"><span>' + (st.color === me ? "Siz" : nm(me)) + '</span><b>' + sc(h[me]) + ' : ' + sc(h[op]) + '</b><span>' + nm(op) + '</span></span>' + h2hBtn();
    }
    // tosh elementi (do'kon donasi tanlangan bo'lsa — uning rasmi)
    function rcPieceEl(p) {
      var pc = document.createElement("i");
      pc.className = "piece pc " + (isWhite(p) ? "w" : "b") + (isKing(p) ? " k" : ""); var _u = window.spEqId ? "/api/shop/img?id=" + encodeURIComponent(window.spEqId) + "&k=" + (isWhite(p) ? "w" : "b") + (isKing(p) ? "k" : "") : ""; if (_u) { var _ps = pc.style; _ps.setProperty("background-image", "url(\"" + _u + "\")", "important"); _ps.setProperty("background-size", "contain", "important"); _ps.setProperty("background-position", "center", "important"); _ps.setProperty("background-repeat", "no-repeat", "important"); _ps.setProperty("background-color", "transparent", "important"); _ps.setProperty("border", "0", "important"); _ps.setProperty("box-shadow", "none", "important"); pc.classList.add("spImg"); if (!document.getElementById("spImgCss")) { var _sc = document.createElement("style"); _sc.id = "spImgCss"; _sc.textContent = "html body .cell .pc.spImg::before,html body .cell .pc.spImg::after{display:none!important;content:none!important}"; document.head.appendChild(_sc); } }
      return pc;
    }
    // 🎞 yurish animatsiyasi (lidraughts kabi, yumshoq va tez): tosh sirpanib boradi, urilgan tosh xiralashib yo'qoladi
    var RC_ANIM_MS = 170;
    function rcAnimReq(mv, board) {   // yurish qo'llanishidan OLDINGI doska bilan chaqiriladi (urilganlar rangi uchun)
      try {
        if (!mv || !mv.from || !mv.to) return;
        st.anim = { from: mv.from, to: mv.to, caps: (mv.captures || []).map(function (q) { return { r: q.r, c: q.c, p: board && board[q.r] ? board[q.r][q.c] : 0 }; }) };
      } catch (e) {}
    }
    function rcCell(r, c) { return elBoard.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]'); }
    function rcAnim(A) {
      if (!A || !("translate" in document.body.style)) return;
      var fc = rcCell(A.from.r, A.from.c), tc = rcCell(A.to.r, A.to.c); if (!fc || !tc) return;
      var pc = tc.querySelector(".pc"); if (!pc) return;
      var a = fc.getBoundingClientRect(), b = tc.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      tc.style.zIndex = "6"; tc.style.overflow = "visible"; if (getComputedStyle(tc).position === "static") tc.style.position = "relative";
      pc.style.transition = "none"; pc.style.translate = dx + "px " + dy + "px";
      void pc.offsetWidth;
      pc.style.transition = "translate " + RC_ANIM_MS + "ms cubic-bezier(.2,.75,.3,1)"; pc.style.translate = "0px 0px";
      setTimeout(function () { pc.style.transition = ""; pc.style.translate = ""; tc.style.zIndex = ""; }, RC_ANIM_MS + 40);
      (A.caps || []).forEach(function (q) {
        var cc = rcCell(q.r, q.c); if (!cc || !q.p || cc.querySelector(".pc")) return;
        var g = rcPieceEl(q.p); g.style.pointerEvents = "none";
        cc.appendChild(g); void g.offsetWidth;
        g.style.transition = "opacity " + (RC_ANIM_MS + 90) + "ms ease-out " + Math.round(RC_ANIM_MS * 0.4) + "ms, scale " + (RC_ANIM_MS + 90) + "ms ease-out " + Math.round(RC_ANIM_MS * 0.4) + "ms";
        g.style.opacity = "0"; g.style.scale = ".8";
        setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, RC_ANIM_MS * 2 + 120);
      });
    }
    function render() {
      var fl = flipped();
      var topColor = fl ? "white" : "black";
      var bottomColor = fl ? "black" : "white";
      fillLine(elTop, topColor);
      fillLine(elBottom, bottomColor);
      try { drawH2H(topColor, bottomColor); } catch (e) {}
      updateClocks();

      if (st.pre && !st.pre.to && st.turn === st.color && !st.pending) { if (!st.forced) { st.selected = st.pre.from; if (!options().length) st.selected = null; } st.pre = null; }
      var opts = options();
      applySkin();
      var lastMv = st.moves.length ? st.moves[st.moves.length - 1] : null;
      if (!elBoard._big) { elBoard._big = 1; var _bs = elBoard.style; _bs.setProperty("width", "min(100vw, 560px)", "important"); _bs.setProperty("height", "min(100vw, 560px)", "important"); _bs.setProperty("max-width", "none", "important"); _bs.setProperty("margin-left", "calc(50% - min(50vw, 280px))", "important"); _bs.setProperty("margin-right", "0", "important"); _bs.setProperty("border", "0", "important"); _bs.setProperty("border-radius", "0", "important"); _bs.setProperty("box-sizing", "border-box", "important"); try { elBoard.parentNode.style.setProperty("overflow", "visible", "important"); } catch (e) {} } elBoard.innerHTML = "";
      for (var dr = 0; dr < 8; dr++) {
        for (var dc = 0; dc < 8; dc++) {
          var r = fl ? 7 - dr : dr, c = fl ? 7 - dc : dc;
          var cell = document.createElement("div");
          cell.className = "cell sq " + (((r + c) % 2) ? "d" : "l");
          cell.dataset.r = r; cell.dataset.c = c;
          if (lastMv && lastMv.from && lastMv.to &&
              ((lastMv.from.r === r && lastMv.from.c === c) || (lastMv.to.r === r && lastMv.to.c === c))) cell.classList.add("lm");
          if (st.selected && st.selected.r === r && st.selected.c === c) cell.classList.add("sel");
          if (st.cand) for (var ci = 0; ci < st.cand.length; ci++) if (st.cand[ci].r === r && st.cand[ci].c === c) cell.classList.add("cand");   // 🎯 shu katakka bora oladigan donalar
          if (st.pre && ((st.pre.from.r === r && st.pre.from.c === c) || (st.pre.to && st.pre.to.r === r && st.pre.to.c === c))) cell.classList.add("pre");
          for (var k = 0; k < opts.length; k++) {
            if (opts[k].to.r === r && opts[k].to.c === c) cell.classList.add(opts[k].captures.length ? "cp" : "tg");
          }
          var p = st.board[r][c];
          if (p) cell.appendChild(rcPieceEl(p));
          if (st.pre && st.pre.to && st.pre.to.r === r && st.pre.to.c === c) { var pg = document.createElement("div"); pg.className = "preGhost"; cell.appendChild(pg); }   // ⏳ oldindan yurish qayerga tushishi
          elBoard.appendChild(cell);
        }
      }

      if (st.anim) { var _A = st.anim; st.anim = null; try { rcAnim(_A); } catch (e) {} }
      try { spSpecUI(); spDgArrows(); } catch (e) {}   // 👁 tomoshabin: tepa qator, Dragon kartasi va strelkalar
      if (!document.getElementById("rcPreCss")) { var pcs = document.createElement("style"); pcs.id = "rcPreCss"; pcs.textContent = ".cell.cand{box-shadow:inset 0 0 0 4px #ffd76a!important}" +
        ".rcDragGhost{position:fixed;z-index:2147483000;pointer-events:none;transform:translate(-50%,-50%) scale(1.15);opacity:.95;filter:drop-shadow(0 8px 12px rgba(0,0,0,.55))}" +
        ".cell.dhov{box-shadow:inset 0 0 0 5px #7dd3fc!important}" +                                  /* sudrayotganda barmoq ostidagi katak */
        ".cell.pre{box-shadow:inset 0 0 0 100px rgba(74,163,255,.28),inset 0 0 0 4px #4aa3ff!important;animation:rcPre 1.2s ease-in-out infinite}" +
        "@keyframes rcPre{50%{box-shadow:inset 0 0 0 100px rgba(74,163,255,.14),inset 0 0 0 4px #9ed0ff}}" +
        ".preGhost{position:absolute;left:10%;top:10%;width:80%;height:80%;border-radius:50%;opacity:.45;pointer-events:none;border:2px dashed #cfe8ff}" +   /* oldindan yurishning borish nuqtasi */
        ".rcPreTip{position:absolute;left:50%;transform:translateX(-50%);bottom:6px;z-index:5;background:rgba(10,20,40,.82);color:#cfe8ff;border:1px solid #4aa3ff;border-radius:999px;padding:3px 10px;font:700 13px system-ui;pointer-events:none}" +
        "@media(prefers-reduced-motion:reduce){.cell.pre{animation:none}}" + "body.rcPlaying #rcZal{display:none!important}"; document.head.appendChild(pcs); }
      if (st.pre && st.finished) st.pre = null;
      if (st.pre && st.pre.to && st.turn === st.color && !st.pending && !st.forced && !st.finished && !botBusy) {
        var pm = st.pre; st.pre = null;
        setTimeout(function () { try { if (st.turn !== st.color || st.pending || st.forced || st.finished || st.optN > 0) { st.selected = null; render(); return; }   // holat o'zgargan — oldindan yurish bekor
          st.selected = pm.from; var po = options(), pf = null; st.selected = null;
          for (var q = 0; q < po.length; q++) if (po[q].to.r === pm.to.r && po[q].to.c === pm.to.c) pf = po[q];
          if (pf) sendMove(pf); else render(); } catch (e) {} }, 0);   // oldindan yurish darhol bajariladi
      }
      try { var _br = elBoard.getBoundingClientRect(), _want = (document.documentElement.clientWidth - _br.width) / 2, _ml = parseFloat(getComputedStyle(elBoard).marginLeft) || 0; if (Math.abs(_br.left - _want) > 0.5) elBoard.style.setProperty("margin-left", (_ml + _want - _br.left) + "px", "important"); } catch (e) {}
      if (!st.finished && !st.vsBot && st.joined && bothIn() && (st.moves || []).length < 2) { var _fk = st.moves.length + ":" + st.turn; if (st._fmK !== _fk) { st._fmK = _fk; st._fmAt = Date.now(); } } else { st._fmK = null; st._fmAt = 0; }
      if (!st._fmIv) st._fmIv = setInterval(function () {
        var el = document.getElementById("rcFM");
        if (true) { if (el) el.style.display = "none"; return; }
        var left = Math.max(0, Math.ceil(15 - (Date.now() - st._fmAt) / 1000));
        if (!el) { el = document.createElement("div"); el.id = "rcFM"; document.body.appendChild(el); }
        var br = elBoard.getBoundingClientRect(), mine = st.turn === st.color;
        el.style.cssText = "position:fixed;left:" + (br.left + br.width / 2) + "px;top:" + (br.bottom + 8) + "px;transform:translateX(-50%);z-index:99990;pointer-events:none;display:flex;align-items:center;gap:10px;white-space:nowrap;padding:6px 16px;border-radius:14px;background:rgba(10,12,40,.92);color:" + (left <= 5 ? "#ff5a5a" : "#fff") + ";font:800 24px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.5)";
        el.innerHTML = "⏳ " + left + '<span style="font:600 15px system-ui,sans-serif;opacity:.9">' + (st.color === "spectator" ? "Birinchi yurish kutilmoqda" : mine ? "Siz yuring!" : "Raqib yurishi kutilmoqda") + "</span>";
      }, 250);
      // holat matni
      var t;
      if (!st.connected) t = "🔌 Ulanmoqda… (server uyg‘onishi 50 soniyagacha cho‘zilishi mumkin)";
      else if (!st.joined) t = "⏳ Xonaga kirilmoqda…";
      else if (st.finished && st.etude) {   // ♔ etyud natijasi
        var eok = st.winner === "white" || (st.etude.goal === "draw" && st.winner === "draw");
        t = eok ? "🎉 Etyud yechildi! " + (st.etude.goal === "draw" ? "Durang ta’minlandi" : "Yutuq yo‘li topildi") : "😔 Etyud yechilmadi — qaytadan urinib ko‘ring";
      }
      else if (st.finished) {
        var tm = st.reason === "abandon" ? "🚪 Raqib o‘yindan chiqib ketdi · " : st.reason === "timeout" ? "⏰ Vaqt tugadi · " : st.reason === "noshow" ? "⏳ Birinchi yurish qilinmadi · " : st.reason === "voice" ? "🎤 Noto‘g‘ri yurish aytildi" + (st.voiceSaid ? " («" + st.voiceSaid + "»)" : "") + " · " : "";
        if (st.winner === "draw") t = st.reason === "abort" ? "O‘yin bekor qilindi" : st.drawText ? "🤝 " + st.drawText : "🤝 Durang (kelishildi)";
        else if (st.color === "spectator") t = tm + "🏆 " + sideName(st.winner) + " g‘alaba qozondi";
        else t = st.winner === st.color ? tm + "🏆 Siz g‘alaba qozondingiz!" : tm.replace(/\s*·\s*$/, "");   // yutqazganda «Siz yutqazdingiz» yozilmaydi
      }
      else if (st.etude && st.turn === st.color) t = "♔ " + st.etude.title + " · " + (st.etude.goal === "draw" ? "Oq yuradi va durang qiladi" : "Oq yuradi va yutadi");
      else if (st.etude) t = "🦍 King Kong o‘ylamoqda…";
      else if (st.vsBot && !st.botStarted && st.color !== "spectator") t = "⚙️ Vaqt, rang va pozitsiyani tanlang, so‘ng ‘Boshlash’ ni bosing";
      else if (!bothIn()) t = "⏳ Raqib kutilmoqda…";
      else if (st.color === "spectator") t = "";   // tomoshabinda tepada «‹ Jonli tomosha» qatori bor
      else if (st.turn === st.color) t = st.forced ? "🔴 Yana urish majburiy!" : "";
      else t = "";
      if (st.color === "spectator" && st.finished && !st.etude) t = "";   // natija tepadagi qatorda
      if (st.arena && st.finished && st.color !== "spectator") t = "";
      elStatus.textContent = t;
      try { zalUpd(); cfgUpd(); } catch (e) {}   // 🏟 «O‘yin zali» va ⚙️ vaqt/pozitsiya tanlovi
      // ♔ etyud tugadi: qayta urinish / ro'yxatga qaytish
      var _eb = document.getElementById("rcEtB");
      if (st.etude && st.finished) {
        if (!_eb) {
          _eb = document.createElement("div"); _eb.id = "rcEtB";
          _eb.style.cssText = "display:flex;gap:8px;justify-content:center;margin:8px 0";
          _eb.innerHTML = '<button style="border:0;border-radius:12px;padding:10px 14px;font:800 15px system-ui;background:linear-gradient(180deg,#ffd76a,#e09a12);color:#2a1700">🔁 Qayta urinish</button><button style="border:0;border-radius:12px;padding:10px 14px;font:700 15px system-ui;background:rgba(255,255,255,.14);color:#fff">♔ Etyudlar</button>';
          var _bs = _eb.querySelectorAll("button");
          _bs[0].onclick = function () { _bs[0].disabled = true; if (window.lbEtude) window.lbEtude(st.etude.id); };
          _bs[1].onclick = function () { try { localStorage.setItem("etOpen", "1"); } catch (e) {} rcLeave(); };
          elStatus.parentNode.insertBefore(_eb, elStatus.nextSibling);
        }
      } else if (_eb) _eb.remove();

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
      if (canBz) {
        elBerserk.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(104px + env(safe-area-inset-bottom,0px));z-index:70;border:0;border-radius:16px;padding:13px 26px;font:800 17px system-ui;color:#2a1a00;background:linear-gradient(180deg,#ffdf8d,#e0a120);box-shadow:0 5px 0 #9b6b0d,0 10px 26px rgba(0,0,0,.5);white-space:nowrap';
        if (elBerserk.parentNode !== document.body) document.body.appendChild(elBerserk);
      } else elBerserk.style.display = "none";
      if (!st.finished && st.drawOffer && st.color !== "spectator") {
        elDraw.style.display = "";
        var mine = st.drawOffer === st.color;
        elDrawText.textContent = mine ? "🤝 Durang taklif qildingiz. Raqib javobi kutilmoqda…" : "🤝 Raqib durang taklif qilmoqda";
        root.querySelector("#rcDrawYes").style.display = mine ? "none" : "";
        root.querySelector("#rcDrawNo").style.display = mine ? "none" : "";
      } else elDraw.style.display = "none";
      renderTc();
      renderChat();
      elInfo.textContent = (st.color === "spectator" ? ""   // tomoshabinlar soni va rasmlari tepada
        : "") +
        (bothIn() && !st.finished && !st.clockRunning && !st.vsBot && st.timeMs && st.color !== "spectator"
          ? (st.spectators ? "\n" : "") + "⏱ " + st.tc + " (daqiqa + soniya)\n⏳ Birinchi yurish 15 soniya ichida qilinmasa, texnik mag‘lubiyat"
          : "");
      elInfo.style.whiteSpace = "pre-line"; document.body.classList.toggle("rcPlaying", st.color !== "spectator" && !st.finished && (st.moves || []).length > 0);
 if (st.stake && !st.finished) elInfo.textContent = "💰 Bank: " + (st.stake * 2) + " 🪙 · g‘olibga " + Math.floor(st.stake * 1.8) + (elInfo.textContent ? "\n" + elInfo.textContent : "");
      if (st.opening && !st.etude) elInfo.textContent = "📖 IDF " + st.opening.id + (elInfo.textContent ? "\n" + elInfo.textContent : "");
      if (false && st.vsBot && st.botNote) elInfo.textContent += (elInfo.textContent ? "\n" : "") + st.botNote;
    }

    // ---------- bosish ----------
    elBoard.addEventListener("click", function (e) {
      if (drag.blockClick && Date.now() - drag.blockClick < 400) return;   // sudrab tashlangan edi — ikkinchi marta yurmasin
      var cell = e.target.closest(".cell");
      if (!cell) return;
      onCell(Number(cell.dataset.r), Number(cell.dataset.c));
    });

    // ---------- sudrab yurish (drag & drop) ----------
    var drag = { on: false, from: null, ghost: null, x: 0, y: 0, moved: false, blockClick: 0 };
    function cellAt(x, y) {
      var el = document.elementFromPoint(x, y); el = el && el.closest ? el.closest(".cell") : null;
      if (el && el.dataset.r != null) return { r: Number(el.dataset.r), c: Number(el.dataset.c) };
      var b = elBoard.getBoundingClientRect();   // zaxira: doska o'lchamidan hisoblaymiz (ekrandan chiqib qolgan holat)
      if (x < b.left || x > b.right || y < b.top || y > b.bottom || !b.width) return null;
      var dc = Math.min(7, Math.max(0, Math.floor((x - b.left) / (b.width / 8))));
      var dr = Math.min(7, Math.max(0, Math.floor((y - b.top) / (b.height / 8))));
      var fl = flipped();
      return { r: fl ? 7 - dr : dr, c: fl ? 7 - dc : dc };
    }
    function dragEnd(ok) {
      if (drag.ghost) { try { drag.ghost.remove(); } catch (e) {} }
      if (drag.src) { try { drag.src.style.visibility = ""; } catch (e) {} }
      var ph = elBoard.querySelector(".cell.dhov"); if (ph) ph.classList.remove("dhov");
      drag.on = false; drag.ghost = null; drag.src = null; drag.from = null; drag.hov = "";
      try { elBoard.style.touchAction = "manipulation"; } catch (e) {}
      if (ok) drag.blockClick = Date.now();
    }
    elBoard.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      if (typeof rcm !== "undefined" && rcm.drag === false) return;   // ✋ sudrab yurish o'chirilgan
      if (!st.joined || st.finished || st.pending || st.color === "spectator" || st.turn !== st.color) return;
      var cell = e.target.closest(".cell"); if (!cell) return;
      var r = Number(cell.dataset.r), c = Number(cell.dataset.c);
      if (!sameSide(st.board[r][c], myCode())) return;
      var pc = cell.querySelector(".pc, .pv, img, div"); if (!pc) return;
      drag.on = true; drag.moved = false; drag.from = { r: r, c: c }; drag.x = e.clientX; drag.y = e.clientY; drag.src = pc;
      try { elBoard.style.touchAction = "none"; } catch (e3) {}   // sudrayotganda sahifa siljimasin
      try { elBoard.setPointerCapture(e.pointerId); } catch (e2) {}
    }, true);
    elBoard.addEventListener("pointermove", function (e) {
      if (!drag.on) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;   // kichik siljish — oddiy bosish
        drag.moved = true;
        onCell(drag.from.r, drag.from.c);   // donani tanlaymiz (mumkin bo'lgan yurishlar yonadi)
        if (!st.selected || st.selected.r !== drag.from.r || st.selected.c !== drag.from.c) { dragEnd(false); return; }   // bu dona yura olmaydi
        var sq = elBoard.querySelector('.cell[data-r="' + drag.from.r + '"][data-c="' + drag.from.c + '"]');
        var src = sq && (sq.querySelector(".pc, .pv") || sq.firstElementChild);
        if (src) {
          var rect = src.getBoundingClientRect();
          drag.ghost = src.cloneNode(true);
          drag.ghost.className = (drag.ghost.className || "") + " rcDragGhost";
          drag.ghost.style.width = rect.width + "px"; drag.ghost.style.height = rect.height + "px";
          document.body.appendChild(drag.ghost);
          drag.src = src; src.style.visibility = "hidden";
        }
      }
      if (drag.ghost) { drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; }
      var hc = cellAt(e.clientX, e.clientY), hk = hc ? hc.r + "," + hc.c : "";
      if (hk !== drag.hov) {
        drag.hov = hk;
        var prev = elBoard.querySelector(".cell.dhov"); if (prev) prev.classList.remove("dhov");
        if (hc) { var he = elBoard.querySelector('.cell[data-r="' + hc.r + '"][data-c="' + hc.c + '"]'); if (he) he.classList.add("dhov"); }
      }
      e.preventDefault();
    }, true);
    elBoard.addEventListener("pointerup", function (e) {
      if (!drag.on) return;
      var moved = drag.moved, from = drag.from, to = moved ? cellAt(e.clientX, e.clientY) : null;
      dragEnd(moved);
      if (!moved) return;
      if (to && (to.r !== from.r || to.c !== from.c)) onCell(to.r, to.c);
      else render();
    }, true);
    elBoard.addEventListener("pointercancel", function () { if (drag.on) { dragEnd(false); render(); } }, true);

    function onCell(r, c) {
      if (!st.joined || st.finished || st.pending || (st.vsBot && !st.botStarted)) return;
      if (st.voice && st.color !== "spectator") { if (window.spVoice) window.spVoice.hint("🎤 Ovozli bellashuv: yurishni 🎤 tugmasini bosib ayting (masalan: «c3 d4»)"); return; }
      if (st.color === "spectator" || !bothIn()) return;
      if (st.turn !== st.color) { var pp = st.board[r][c]; if (sameSide(pp, myCode())) { st.pre = (st.pre && st.pre.from.r === r && st.pre.from.c === c) ? null : { from: { r: r, c: c } }; } else if (st.pre && !pp) { st.pre.to = { r: r, c: c }; } else { st.pre = null; } try { render(); } catch (e) {} return; }
      var me = myCode(), p = st.board[r][c], mv;

      if (st.forced) {
        var fo = captureSteps(st.board, st.forced.r, st.forced.c);
        for (var i = 0; i < fo.length; i++) if (fo[i].to.r === r && fo[i].to.c === c) mv = fo[i]; if (!mv && fo.length === 1 && r === st.forced.r && c === st.forced.c) mv = fo[0];
        if (mv) sendMove(mv);
        return;
      }

      if (sameSide(p, me)) {
        var caps = allCaptures(st.board, me);
        var ok = caps.length ? captureSteps(st.board, r, c).length : simpleSteps(st.board, r, c).length;
        st.selected = ok ? { r: r, c: c } : null;
        if (st.selected && typeof rcm !== "undefined" && rcm.auto) { var o1 = options(); if (o1.length === 1) { sendMove(o1[0]); return; } }
        render();
        return;
      }

      var o = options();
      for (var j = 0; j < o.length; j++) if (o[j].to.r === r && o[j].to.c === c) mv = o[j];
      if (mv) { st.cand = null; sendMove(mv); return; }
      // 🎯 dona tanlanmagan bo'lsa ham: bo'sh katakni bossangiz, o'sha yerga bora oladigan dona yuradi
      if (!p && (typeof rcm === "undefined" || rcm.tapTo !== false)) {
        var cn = movesTo(r, c);
        if (cn.length === 1) { st.cand = null; st.selected = { r: cn[0].from.r, c: cn[0].from.c }; sendMove(cn[0]); return; }
        if (cn.length > 1) { st.selected = null; st.cand = cn.map(function (x) { return x.from; }); render(); return; }   // bir nechta dona bora oladi — tanlang
      }
      if (st.cand) { st.cand = null; render(); }
    }

    function sendMove(mv) { st.pre = null;
      rcAnimReq(mv, st.board);
      var nb = applyStep(st.board, mv);
      var keep = mv.captures.length > 0 && captureSteps(nb, mv.to.r, mv.to.c).length > 0;
      st.pending = true;
      send({ type: "roomMove", roomId: roomId, move: mv, keepTurn: keep });
      st.optim = true; st.optN = (st.optN || 0) + 1; try { soundForMove(mv, st.board[mv.from.r] && st.board[mv.from.r][mv.from.c]); } catch (e) {} st.board = nb; st.selected = null;
      if (keep) { st.forced = { r: mv.to.r, c: mv.to.c }; st.pending = false; } else { st.forced = null; }
      try { render(); } catch (e) {}
      try { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light"); } catch (e) {}
    }

    // ---------- 🎤 ovozli boshqaruv uchun (voice.js): kataklar ro'yxati bo'yicha yurish
    window.rcVoice = {
      info: function () {
        var playing = !!(st.joined && !st.finished && st.color && st.color !== "spectator" && bothIn() && !(st.vsBot && !st.botStarted));
        return { inRoom: true, voice: !!st.voice, playing: playing, myTurn: playing && st.turn === st.color && !st.pending };
      },
      move: function (sqs, said) {   // sqs: [{r,c}, ...] — 'ok' | 'illegal' | 'wait' | 'off'
        var inf = window.rcVoice.info();
        if (!inf.playing) return "off";
        if (!inf.myTurn) return "wait";
        var me = myCode(), last = sqs[sqs.length - 1], eq = function (a, b) { return a.r === b.r && a.c === b.c; };
        if (st.forced) {
          var fo = captureSteps(st.board, st.forced.r, st.forced.c), hit = null;
          for (var i = 0; i < fo.length; i++) if (eq(fo[i].to, last)) hit = fo[i];
          if (!hit) return "illegal";
          sendMove(hit); return "ok";
        }
        var all = allMoves(st.board, me), cand = [];
        for (var k = 0; k < all.length; k++) {
          var m = all[k]; if (!eq(m.from, sqs[0]) || !eq(m.to, last)) continue;
          if (sqs.length > 2 && m.path) { var okp = true; for (var q = 1; q < sqs.length - 1; q++) if (!m.path[q - 1] || !eq(m.path[q - 1], sqs[q])) okp = false; if (!okp) continue; }
          cand.push(m);
        }
        if (!cand.length) return "illegal";
        var mv = cand[0], steps = mv.captures.length ? chain(st.board, mv.from, mv.to, mv.captures.length, []) : [{ from: mv.from, to: mv.to, captures: [] }];
        if (!steps || !steps.length) return "illegal";
        sendMove(steps[0]);
        steps.slice(1).forEach(function (sp, j) { setTimeout(function () { try { sendMove(sp); } catch (e) {} }, 320 * (j + 1)); });
        return "ok";
      },
      fail: function (said) { send({ type: "roomVoiceFail", roomId: roomId, said: String(said || "").slice(0, 60) }); },
      resign: function () { if (confirm("Taslim bo‘lasizmi?")) send({ type: "roomResign", roomId: roomId }); },
      draw: function () { send({ type: "roomDrawOffer", roomId: roomId }); }
    };

    // ---------- 🤖 ShashkaBot: yurishni shu telefon hisoblaydi (AI so'rovi), server faqat uzatadi ----------
    var botBusy = false, botGen = 0;

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
      [["white", "⚪ Oq"], ["black", "⚫ Qora"], ["random", "Tasodifiy"]].forEach(function (c) {
        btn(c[1], c[0] === st.color, function () { send({ type: "roomSetColor", roomId: roomId, color: c[0] }); });
      });
      lab("📖 Boshlang‘ich holat");
      [["std", "📋 Standart"], ["idf", "IDF 780"]].forEach(function (pp) {
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
    // zaxira "miya": AI javob bermasa, tasodifiy emas — material bo'yicha alfa-beta qidiruv (bir necha yurish oldinga)
    function localBest(legal, side, lim) {
      try {
        var AM = window.allMoves, AP = window.applyMoveFull; if (!AM || !AP) return null;
        var me = codeOf(side), op = codeOf(side === "white" ? "black" : "white"), t0 = Date.now(), LIM = lim || 900;
        function ev(b) {
          var s = 0;
          for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
            var p = b[r][c]; if (!p) continue;
            var v = (p === 3 || p === 4) ? 300 : 100 + ((p === 1) ? (7 - r) : r) * 3 + ((c > 1 && c < 6) ? 4 : 0);
            s += (p === 1 || p === 3) ? v : -v;
          }
          return me === WHITE ? s : -s;
        }
        function ab(b, d, a, be, mine) {
          var ms = AM(b, mine ? me : op);
          if (!ms.length) return mine ? -100000 - d : 100000 + d;
          if (d <= 0 && !(ms[0].captures && ms[0].captures.length)) return ev(b);
          if (d <= -4 || Date.now() - t0 > LIM) return ev(b);
          if (mine) { var bv = -1e9; for (var i = 0; i < ms.length; i++) { var v = ab(AP(b, ms[i]), d - 1, a, be, false); if (v > bv) bv = v; if (bv > a) a = bv; if (a >= be) break; } return bv; }
          var wv = 1e9; for (var k = 0; k < ms.length; k++) { var w = ab(AP(b, ms[k]), d - 1, a, be, true); if (w < wv) wv = w; if (wv < be) be = wv; if (a >= be) break; } return wv;
        }
        var best = null;
        for (var D = 2; D <= 6 && Date.now() - t0 < LIM / 2; D++) {
          var bb = null, bv = -1e9, order = legal.slice().sort(function () { return Math.random() - 0.5; });
          for (var i = 0; i < order.length; i++) { var v = ab(AP(st.board, order[i]), D - 1, -1e9, 1e9, false); if (v > bv) { bv = v; bb = order[i]; } }
          if (Date.now() - t0 <= LIM || !best) best = bb;
        }
        return best;
      } catch (e) { return null; }
    }
    // kuchli bot dvigatelni kutayotganini ko'rsatadigan yozuv
    function botWait(on) {
      var el = document.getElementById("spBotWait");
      if (!on) { if (el) el.remove(); return; }
      if (el) return;
      el = document.createElement("div"); el.id = "spBotWait";
      el.style.cssText = "position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99999;background:#2a1f5c;color:#fff;padding:10px 16px;border-radius:14px;font:600 15px system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.4);max-width:90vw;text-align:center";
      var _kk = /King ?Kong/i.test(String(st[st.botColor] || ""));
      if (_kk) { el.style.background = "linear-gradient(90deg,#3b1d0e,#6b3410)"; el.style.border = "1px solid #ffb347"; }
      el.textContent = _kk ? (window.spT ? window.spT("🦍 King Kong o‘ylayapti…") : "🦍 King Kong o‘ylayapti…") : "⏳ Bot chuqur o‘ylayapti… (server yangilangan bo‘lsa, dvigatel 1–2 daqiqada tayyor bo‘ladi)";
      document.body.appendChild(el);
    }
    function botThink(cb) {
      var side = st.botColor, legal = allMoves(st.board, codeOf(side));
      if (!legal.length) return cb(null);
      var t0 = Date.now(), done = false;
      var timed = st.tc && st.tc !== "∞", rem = remaining(side) / 1000, inc = (st.incMs || 0) / 1000;
      // ⏱ vaqtli o'yinda bot soatini tejaydi: server bilan aloqa vaqti (lat) ham hisoblanadi, tez o'yinda bezak kechikishlar yo'q
      var isKK = /King ?Kong/i.test(String(st[st.botColor] || "")) || st.botSecs >= 15;   // 🦍 soati yurmaydi — har doim to'liq kuch
      var lat = st.botLat || 0.5, fast = timed && rem < 90;
      var budget = rem / 28 + inc * 0.8;
      var secs = timed ? Math.max(0.05, Math.min(st.botSecs, budget - lat, rem / 5)) : Math.max(0.05, Math.min(st.botSecs, rem / 15));
      if (isKK && !timed) secs = st.botSecs;
      if (isKK && timed) secs = Math.max(rem < 4 ? 0.08 : 0.15, Math.min(st.botSecs, (rem / 60 + inc * 0.6) - lat * 0.5, rem / 12));   // 🦍 tez o'yinda soatini tejaydi (vaqtdan yutqazmasin); navbat kutishi ham shu vaqtga kiradi
      st.botFast = fast;
      if (legal.length === 1) {   // yagona yurish (majburiy urish) — o'ylab o'tirmaymiz
        var only = stepsOf(legal[0]); st.botNote = "🤖 majburiy yurish"; st.botSrc = "f";
        if (only) return setTimeout(function () { cb(only); }, fast ? 0 : 350);
      }
      if (timed && (isKK ? rem < 1.2 : rem < 2.5)) {   // vaqt juda kam — serverga bormay, shu yerning o'zida tez hisoblaymiz
        var qb = localBest(legal, side, Math.max(40, Math.min(250, rem * 1000 / 20))), qs = qb ? stepsOf(qb) : null;
        if (!qs) { var qp = safePool(legal, side); for (var qi = 0; qi < qp.length && !qs; qi++) qs = stepsOf(qp[qi]); }
        if (qs) { st.botNote = "🤖 tezkor yurish ⏱"; st.botSrc = "t"; return cb(qs); }
      }
      if (st.botBlunder > 0 && legal.length > 1 && Math.random() < st.botBlunder) {   // yengil botlar ba'zan tasodifiy yuradi
        done = true;
        var pool0 = safePool(legal, side), st0 = null;
        for (var i0 = 0; i0 < pool0.length && !st0; i0++) st0 = stepsOf(pool0[i0]);
        st.botNote = "🤖 tasodifiy yurish"; st.botSrc = "r";
        return setTimeout(function () { cb(st0); }, fast ? 0 : 450);
      }
      function finishWith(mv, note) {
        if (done) return; done = true;
        var steps = mv ? stepsOf(mv) : null;
        if (!steps) {   // zaxira: o'zimizning qidiruv, bo'lmasa xavfsiz yurish
          var lb = localBest(legal, side, fast ? Math.max(40, Math.min(300, remaining(side) / 20)) : 900); if (lb) steps = stepsOf(lb);
          if (!steps) { var pool = safePool(legal, side); for (var i = 0; i < pool.length && !steps; i++) steps = stepsOf(pool[i]); }
          note = (note || "🤖 zaxira yurish") + "";
          st.botSrc = "z";
        } else st.botSrc = "e";
        st.botNote = note || "";
        setTimeout(function () { cb(steps); }, fast ? 0 : Math.max(0, 450 - (Date.now() - t0)));
      }
      var ctl = window.AbortController ? new AbortController() : null;
      // kuchli botlar (Sulton, Legend, Monster) zaif zaxira "miya"ga hech qachon o'tmaydi — dvigatel javob berguncha kutadi
      var strong = st.botSecs >= 2 && !timed;   // vaqtli o'yinda kuchli bot ham soatni o'ylaydi
      var deadline = strong ? Infinity : isKK && timed ? t0 + Math.max(900, Math.min(rem * 1000 * 0.25, (secs + lat * 2 + 2) * 1000)) : timed ? t0 + Math.max(fast ? 400 : 800, Math.min((secs * 2 + lat * 2 + (fast ? 0.5 : 6)) * 1000, rem * 1000 * (fast ? 0.12 : 0.4))) : t0 + (secs * 3 + 25) * 1000;   // dvigatel band bo'lsa navbat kutiladi
      var to = strong ? null : setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) {} finishWith(null, "🤖 zaxira yurish (AI kechikdi)"); }, deadline - t0);
      var waitT = strong || /King ?Kong/i.test(String(st[st.botColor] || "")) ? setTimeout(function () { if (!done) botWait(true); }, /King ?Kong/i.test(String(st[st.botColor] || "")) ? 1200 : Math.max(4000, secs * 1000 + 3000)) : null;
      var _fw = finishWith; finishWith = function (mv, note) { clearTimeout(waitT); botWait(false); _fw(mv, note); };
      function ask() {
        if (done) return;
        var tAsk = Date.now();
        try {
          fetch("/api/ai/move", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-init-data": (tg && tg.initData) || "" },
            body: JSON.stringify({ board: flatBoard(st.board), side: side === "white" ? 1 : -1, time: secs, maxTime: timed ? secs : undefined, eng: st.botEng || undefined, damkaPlies: st.botEng === 'dragon' ? st.kingOnly : undefined, dragonMode: st.botEng === "dragon" && timed ? (function(){var m=String(st.tc).match(/^(\d+(?:\.\d+)?)/);if(!m)return undefined;var total=Number(m[1])*60+40*inc;return total<180?"Bullet":total<600?"Blits":total<1800?"Rapid":"Klassik";})() : undefined, dragonRemaining: st.botEng === "dragon" && timed ? rem : undefined, dragonIncrement: st.botEng === "dragon" && timed ? inc : undefined, kk: isKK || undefined, rem: isKK && timed ? Math.round(rem * 10) / 10 : undefined, book: isKK || st.botSecs >= 1, tbAlways: isKK || st.botSecs >= 2 || undefined, wait: !strong && !isKK && isFinite(deadline) ? Math.max(0.15, Math.round(((deadline - Date.now()) / 1000 - lat - 0.5) * 100) / 100) : undefined, room: roomId }),
            signal: ctl ? ctl.signal : undefined
          }).then(function (r) {
            if (r.status === 429 || r.status === 503) return { retry: 1 };
            return r.ok ? r.json() : null;
          }).then(function (j) {
            if (done) return;
            if (j && j.retry && Date.now() + 1500 < deadline) return setTimeout(ask, strong ? 2000 : 900);   // band yoki hali tayyor emas — kutib qayta so'raymiz
            if (strong && !(j && typeof j.from === "number")) return setTimeout(ask, 3000);   // xato javob — kuchli bot zaxiraga o'tmaydi, qayta so'raydi
            if (j && typeof j.from === "number") { var _l = (Date.now() - tAsk) / 1000 - (typeof j.ms === "number" ? j.ms : secs * 1000) / 1000; st.botLat = Math.max(0.1, Math.min(3, (st.botLat || 0.5) * 0.7 + Math.max(0, _l) * 0.3)); }   // aloqa kechikishini o'rganamiz
            clearTimeout(to);
            var mv = null;
            if (j && typeof j.from === "number" && typeof j.to === "number") mv = pickLegal(legal, j, false) || pickLegal(legal, j, true);
            finishWith(mv, mv ? "🐉 Dragon" + (j.tb ? " · endshpil bazasi ♟" : j.book ? " · kitob" : j.cached ? " · xotiradan ⚡" : j.deep ? " · saboq 🧠 " + j.ms + " ms" : j.ms ? " · " + j.ms + " ms" : "") : "🤖 zaxira yurish (AI javobi mos kelmadi)");
          }).catch(function () { if (done) return; if (Date.now() + 2500 < deadline) return setTimeout(ask, strong ? 3000 : 1200); clearTimeout(to); finishWith(null, "🤖 zaxira yurish (AI ishlamadi)"); });
        } catch (e) { if (strong) return setTimeout(ask, 3000); clearTimeout(to); finishWith(null, "🤖 zaxira yurish (AI ishlamadi)"); }
      }
      ask();
    }

    function botKick() {
      if (botBusy) return;
      if (!st.vsBot || !st.botStarted || !st.joined || st.finished || st.color === "spectator") return;
      if (!st.botColor || st.turn !== st.botColor || !bothIn()) return;
      if (st.srvBot && !st.sbFb) {   // 🦍 King Kong yurishini server o'zi qiladi — ilova faqat zaxira (server kechiksa)
        var nW = st.moves.length;
        if (st.sbWait === nW) return; st.sbWait = nW;
        var rmS = remaining(st.botColor) / 1000, wt = Math.max(1500, Math.min(6000, rmS * 1000 * 0.35));
        setTimeout(function () { if (st.moves.length === nW && st.turn === st.botColor && !st.finished) { st.sbFb = true; try { botKick(); } finally { st.sbFb = false; } } }, wt);
        return;
      }
      botBusy = true;
      var n0 = st.moves.length, g0 = botGen;
      botThink(function (steps) {
        if (g0 !== botGen) return;
        if (!steps || !steps.length || st.finished || st.moves.length !== n0 || st.turn !== st.botColor) { botBusy = false; return; }
        var i = 0;
        (function next() {
          if (st.finished || g0 !== botGen) { if (g0 === botGen) botBusy = false; return; }
          var s = steps[i++], more = i < steps.length;
          send({ type: "roomBotMove", roomId: roomId, move: s, keepTurn: more, src: i === 1 ? st.botSrc : undefined });
          if (more) setTimeout(next, st.botFast ? 60 : 700); else { botBusy = false; try { render(); } catch (e) {} }
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
    /* ARENA: o'yin tugagach tugmalar + birinchi yurish chizig'i */
    function spBeep() { try { var C = window.AudioContext || window.webkitAudioContext; if (!window.__spAC) window.__spAC = new C(); var c = window.__spAC; if (c.state === "suspended") c.resume(); var o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.08); } catch (e) {} }
    // 🏟 arena: o'yin tugagach pastki panel — natija, o'rin, ochko, qolgan vaqt va keyingi raqib (3 soniyada o'tiladi)
    function spArenaT() { try { var mm = String(roomId).match(/^A(.+?)G\d+/), tid = mm ? mm[1] : "", S = window.__lb && window.__lb.S; return ((S && S.tournaments) || []).filter(function (x) { return String(x.id) === String(tid); })[0] || null; } catch (e) { return null; } }
    function spMeUid() { try { return String(tg.initDataUnsafe.user.id); } catch (e) { return ""; } }
    function spArenaMe(t) { var u = spMeUid(), L = (t && t.players) || []; for (var i = 0; i < L.length; i++) if (String(L[i].uid) === u) return { p: L[i], rank: i + 1 }; return null; }
    var spAG0 = -1, spAENext = null;
    window.__spArenaNext = function (m) {   // lobbyclient: keyingi arena o'yini tayyor
      if (!document.getElementById("spAE")) return false;
      if (spAENext && spAENext.roomId === m.roomId) return true;
      if (window.__spArenaStop) return true;
      spAENext = { roomId: m.roomId, name: String(m.opponent || ""), color: m.color, at: Date.now() };
      spAEDraw(); return true;
    };
    function spArenaEnd() {
      var old = document.getElementById("spAE"); if (old) old.remove();
      var mm = String(roomId).match(/^A(.+?)G\d+/), tid = mm ? mm[1] : "";
      spAENext = null; window.__spArenaStop = false;
      var bx = document.createElement("div"); bx.id = "spAE";
      bx.innerHTML = '<div class="r1"><b class="res"></b><span class="pt"></span><span class="mt"></span></div>' +
        '<div class="r2"><div class="cd"><b></b></div><div class="nx"><small></small><b></b></div></div>' +
        '<div class="r3"><button data-a="p">⏸ Pauza</button><button data-a="t">🔍 Tahlil</button><button data-a="z">🏟 Turnir</button></div>';
      bx.onclick = function (e) {
        var b = e.target && e.target.closest ? e.target.closest("[data-a]") : null; if (!b) return;
        var a = b.getAttribute("data-a");
        if (a === "p") { if (window.__spArenaStop) return; try { if (window.__lb && window.__lb.send) window.__lb.send({ type: "lbTLeave", tid: tid }); } catch (e2) {} window.__spArenaStop = true; spAENext = null; spAEDraw(); }
        else if (a === "t") { var an = document.getElementById("rcAn"); if (an) an.click(); }
        else if (a === "z") { try { elZal.onclick(); } catch (e2) {} }
      };
      root.appendChild(bx); root.classList.add("spAEon");
      spAEDraw();
    }
    function spAEDraw() {
      var bx = document.getElementById("spAE"); if (!bx) return;
      var t = spArenaT(), me = spArenaMe(t), now = Date.now();
      var w = st.winner, res = st.reason === "arena_cancel" ? "O‘yin bekor qilindi" : w === "draw" ? "🤝 Durang" : w === st.color ? "🏆 G‘alaba!" : "😔 Mag‘lubiyat";
      bx.querySelector(".res").textContent = res;
      var pt = "";
      if (st.reason !== "arena_cancel" && me && spAG0 >= 0 && me.p.games > spAG0) { var d = String(me.p.sheet || "").slice(-1); pt = "+" + (d || "0") + (me.p.fire && w === st.color ? " 🔥" : ""); }
      bx.querySelector(".pt").textContent = pt;
      var left = t && t.endAt ? Math.max(0, t.endAt - now) : 0, fin = !t || t.status === "finished" || (t.endAt && left <= 0);
      var mmss = Math.floor(left / 60000) + ":" + ("0" + Math.floor(left / 1000) % 60).slice(-2);
      bx.querySelector(".mt").textContent = me ? me.rank + "-o‘rin · " + me.p.score + " ochko" + (fin ? "" : " · " + mmss) : "";
      var cd = bx.querySelector(".cd"), cb = cd.querySelector("b"), sm = bx.querySelector(".nx small"), nb = bx.querySelector(".nx b");
      cd.classList.remove("wait"); cd.style.setProperty("--p", "0%"); cb.textContent = "";
      if (window.__spArenaStop || (me && me.p.withdrawn)) { spAENext = null; sm.textContent = "Pauzadasiz"; nb.textContent = "«Turnir» da davom etasiz"; bx.querySelector('[data-a="p"]').classList.add("on"); }
      else if (spAENext) {
        var sec = Math.max(0, 3 - Math.floor((now - spAENext.at) / 1000)), el = "";
        try { ((t && t.players) || []).forEach(function (q) { if (String(q.name) === spAENext.name && q.elo) el = " · " + q.elo; }); } catch (e) {}
        sm.textContent = "Keyingi raqib (o‘rningizga yaqin)"; nb.textContent = spAENext.name + el;
        cb.textContent = sec; cd.style.setProperty("--p", Math.round(((now - spAENext.at) / 3000) * 100) + "%");
        if (now - spAENext.at >= 3000) { var rid = spAENext.roomId; spAENext = null; try { if (window.__lb && window.__lb.go) window.__lb.go(rid); } catch (e) {} }
      }
      else if (fin) { sm.textContent = "Turnir tugadi"; nb.textContent = "Natijalar — «Turnir» da"; }
      else if (left < 60000) { sm.textContent = "Oxirgi daqiqa"; nb.textContent = "Yangi juftlik berilmaydi"; }
      else { cd.classList.add("wait"); sm.textContent = "Keyingi raqib qidirilmoqda…"; nb.textContent = "O‘rningizga yaqin o‘yinchi"; }
    }
    setInterval(function () {   // arena: o'yin davomida o'yinlar soni (natija ochkosini aniqlash uchun); tugagach panel yangilanadi
      try {
        if (!/^A.+?G\d+/.test(String(roomId))) return;
        if (!st.finished) { var me = spArenaMe(spArenaT()); if (me) spAG0 = me.p.games; if (root.classList.contains("spAEon")) root.classList.remove("spAEon"); return; }
        spAEDraw();
      } catch (e) {}
    }, 250);
    var _fmKey = -1, _fmT0 = 0, _fmLast = -1;
    setInterval(function () {
      try {
        var ae = document.getElementById("spAE"); if (ae && !st.finished) ae.remove();
        var bar = document.getElementById("spFM");
        var turn = st.turn || (st.moves.length % 2 === 0 ? "white" : "black");
        var on = !st.finished && st.joined && (st.arena ? !!st.arenaFirstDeadline : st.moves.length < 2 && bothIn() && !st.vsBot);
        if (!on) { if (bar) bar.remove(); _fmKey = -1; _fmLast = -1; return; }
        if (_fmKey !== st.moves.length) { _fmKey = st.moves.length; _fmT0 = Date.now(); _fmLast = -1; }
        var left = st.arena ? Math.max(0, Math.min(15, Math.ceil((st.arenaFirstDeadline - Date.now()) / 1000))) : Math.max(0, 15 - Math.floor((Date.now() - _fmT0) / 1000));
        if (!bar) { bar = document.createElement("div"); bar.id = "spFM"; bar.style.cssText = "position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 8px);z-index:5;width:min(94vw,520px);box-sizing:border-box;border-radius:10px;text-align:center;color:#fff;font:600 15px Arial,sans-serif;padding:7px;box-shadow:0 4px 12px rgba(0,0,0,.25)"; root.appendChild(bar); }   // ekran tepasida (bo'sh joyda): doim ko'rinadi, doska va tugmalarni yopmaydi
        bar.style.background = left <= 5 ? "#cf2a2a" : "#629924";
        // kimning vaqti — o'sha tomonda: pastdagi o'yinchi (odatda siz) — pastki tugmalar ustida, tepadagi (raqib) — ekran tepasida
        var _atBot = turn === (flipped() ? "black" : "white");
        if (st.color === "spectator") { bar._bot = null; bar.style.position = "absolute"; bar.style.bottom = "auto"; bar.style.top = Math.round(elBoard.offsetTop + elBoard.offsetHeight / 2 - bar.offsetHeight / 2) + "px"; }   // tomoshabinda — doskaning o'rtasida (kartalarni yopmaydi)
        else if (bar._bot !== _atBot) { bar._bot = _atBot; if (_atBot) { bar.style.position = "fixed"; bar.style.top = "auto"; bar.style.bottom = "calc(env(safe-area-inset-bottom,0px) + 104px)"; } else { bar.style.position = "absolute"; bar.style.bottom = "auto"; bar.style.top = "calc(env(safe-area-inset-top,0px) + 8px)"; } }
        bar.innerHTML = ((st.color === turn || st.color === "spectator") ? "" : "Raqib: ") + "<b>" + left + "</b> soniya birinchi yurishga";
        if (left <= 5 && left > 0 && left !== _fmLast && st.color === turn) spBeep();
        _fmLast = left;
      } catch (e) {}
    }, 250);
    function autoZalStart() {
      autoZalStop();
      if (st.vsBot || st.gamesTotal > 1 || st.color === "spectator") return;   // tomoshabin o'zi tanlaydi: keyingi jonli o'yin yoki zal
      if (st.rmOk) { setTimeout(function () { try { rmPanel(); } catch (e) {} }, 0); return; }   // 🔁 10 soniyalik revansh paneli o'zi stolga qaytaradi
      if (/^A.+?G\d+/.test(String(roomId))) { spArenaEnd(); return; }   // bot bilan o'yinda zalga avtomatik qaytmaymiz (qayta o'ynash bor)
      if (typeof elZal === "undefined" || !elZal || !elZal.onclick) return;
      var n = /^T.+?R\d+B\d+|^A.+?G\d+/.test(String(roomId)) ? 3 : 10;
      _azBox = document.createElement("div");
      _azBox.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 104px);z-index:2147483000;background:#1c2733;color:#fff;border:1px solid #2a3647;border-radius:12px;padding:10px 14px;font:14px Arial,sans-serif;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,.4)";
      var tx = document.createElement("span"), bt = document.createElement("button");
      bt.textContent = "Qolish";
      bt.style.cssText = "background:#3b3f8f;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-size:14px";
      bt.onclick = autoZalStop;
      _azBox.appendChild(tx); _azBox.appendChild(bt); document.body.appendChild(_azBox); var _azH = function () { autoZalStop(); document.removeEventListener("pointerdown", _azH, true); }; setTimeout(function () { document.addEventListener("pointerdown", _azH, true); }, 600);
      function upd() { tx.textContent = "🏟 " + n + " soniyadan keyin zalga qaytasiz"; }
      upd();
      _azT = setInterval(function () {
        if (!st.finished) { autoZalStop(); return; }
        n--;
        if (n <= 0) { autoZalStop(); try { elZal.onclick(); } catch (e) {} } else upd();
      }, 1000);
    }
    function onMessage(m) {
      if (m && m.type === "roomElo" && m.roomId === roomId) { st.eloD = m.eloD || null; try { rmPanel(); } catch (e) {} try { render(); } catch (e) {} }   // kartalarda yangi reyting
      if (m.type === "error" && (st.optim || m.resync)) { st.optim = false; st.optN = 0; st.pending = false; st.forced = null; if (m.resync) { st.needRebuild = true; botGen++; botBusy = false; } send({ type: "roomSync", roomId: roomId }); }
      if (m.type === "roomState" && m.roomId === roomId && !m.finished) { try { window.__coinClear(); } catch (e) {} }
      if (m.type === "roomState" && m.roomId === roomId) {
        setTimeout(function () { var bt = document.getElementById("rcBoot"); if (bt) bt.remove(); }, 250);
        st.optim = false;
        st.joined = true;
        st.color = m.color;
        try { sitBar(m); } catch (e) {}
        st.white = m.white; st.black = m.black; st.wInfo = m.wInfo || null; st.bInfo = m.bInfo || null;
        st.whiteOnline = m.whiteOnline; st.blackOnline = m.blackOnline; st.stake = m.stake || 0;
        st.offAt = { white: m.whiteOff ? Date.now() - (m.srvNow - m.whiteOff) : 0, black: m.blackOff ? Date.now() - (m.srvNow - m.blackOff) : 0 }; st.claimMs = m.claimMs || 15000;
        st.spectators = m.spectators || 0;
        st.specNames = m.spectatorNames || []; st.specList = m.specList || null; st.dgOk = !!m.dgOk; st.dgAdm = !!m.dgAdm;
        st.gamesTotal = m.gamesTotal || 1; st.played = m.played || 0; st.seriesScore = m.seriesScore || null;
        st.seriesDone = !!m.seriesDone; st.nextIn = !!m.nextIn; st.rematch = m.rematch || null; st.casual = !!m.casual; st.rmOk = !!m.rmOk; if (!m.finished) st.eloD = null; st.voice = !!m.voice; st.botUid = m.botUid || null; st.voiceSaid = m.voiceSaid || null; st.vsBot = !!m.vsBot; st.etude = m.etude || null; st.h2h = m.h2h || null; try { var _bk = "spBotRoom:" + roomId; if (st.vsBot) localStorage.setItem(_bk, "1"); else if (localStorage.getItem(_bk) === "1") { localStorage.removeItem(_bk); alert("Server qayta ishga tushdi, bot bilan o‘yin uzildi. Zalga qaytasiz."); rcLeave(); return; } } catch (e) {} try { renderChat(); } catch (e) {} st.botStarted = !!m.botStarted; st.srvBot = !!m.srvBot; st.botColor = m.botColor || null; st.botSecs = Number(m.botSecs) > 0 ? Number(m.botSecs) : 1.2; st.botBlunder = Number(m.botBlunder) || 0; st.botEng = String(m.botEng || "").slice(0, 12);
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
        st.kingOnly = m.kingOnly;
        st.drawInfo = m.drawInfo || null; st.drawText = m.drawText || null; st.canDraw = !!m.canDraw;
        st.arena = !!m.arena;
        st.arenaFirstDeadline = m.arenaFirstDeadline ? Date.now() + (m.arenaFirstDeadline - m.srvNow) : 0;
        st.berserk = m.berserk || { white: false, black: false };
        st.noBerserk = !!m.noBerserk;
        if (m.chat) { st.chat = m.chat; rebuildChat(); }
        setClock(m.clock, m.clockRunning);
        if (!same || st.needRebuild) { st.needRebuild = false; rebuild(); }   // yurishlar o'zgarmagan bo'lsa, tanlov saqlanadi
        render();
        botKick();
        if (!same || !st.dg) spDgReq();
      } else if (m.type === "roomEval" && m.roomId === roomId) { spDgSet(m);
      } else if (m.type === "roomLive") {   // ▶ keyingi jonli o'yin (tomoshabin)
        if (!st._nl) return; st._nl = null;
        var _lv = (m.list || []).filter(function (g) { return g.id !== roomId; }), _g = _lv.filter(function (g) { return !g.vsBot; })[0] || _lv[0];
        if (_g) spOpenRoom(_g.id); else { st._nlT = Date.now(); render(); setTimeout(function () { try { render(); } catch (e) {} }, 3100); }
      } else if (m.type === "roomMove" && m.roomId === roomId) {
        if (m.arenaFirstDeadline !== undefined) st.arenaFirstDeadline = m.arenaFirstDeadline ? Date.now() + (m.arenaFirstDeadline - m.srvNow) : 0;
        st.moves.push(m.move);
        st.kingOnly = m.kingOnly;
        if (m.drawInfo !== undefined) st.drawInfo = m.drawInfo;
        st.canDraw = !!m.canDraw;
        var _own = m.color === st.color && st.optN > 0; if (_own) st.optN--;
        var _pp = st.board[m.move.from.r] && st.board[m.move.from.r][m.move.from.c];
        if (!_own) { rcAnimReq(m.move, st.board); st.oppAt = Date.now(); st.board = applyStep(st.board, m.move); }
        if (!_own) soundForMove(m.move, _pp);
        st.turn = m.turn;
        setClock(m.clock, m.clockRunning);
        st.pending = false;
        st.selected = null;
        if (!_own) st.forced = computeForced(m.move);
        render();
        if (m.turn !== m.color) spDgReq();   // 🐉 yangi yurish — Dragon navbatdagi tomonning kuchli yurishini ko‘rsatadi
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
        var _blk = m.msg && m.msg.uid && window.lbFriendState && window.lbFriendState(m.msg.uid) === "blocked";
        addMsg(m.msg);
        if (st.chatOpen) elMsgs.scrollTop = elMsgs.scrollHeight;
        else if (!_blk) { st.unread++; renderChat(); }
      } else if (m.type === "botCoins" && m.roomId === roomId) { try { window.__coinFx(m.n); } catch (e) {}
      } else if (m.type === "roomFinished" && m.roomId === roomId) {
        st.finished = true;
        autoZalStart();
        st.drawOffer = null;
        st.drawInfo = null; st.drawText = m.text || null;
        st.winner = m.winner;
        st.reason = m.reason || null;
        setClock(m.clock, false);
        render();
        spDgReq();   // 🐉 o'yin tugadi — oxirgi yurish ham tahlil qilinadi
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
    setInterval(updateClocks, 100);
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

/* ELODELTA — o'yin tugagach reyting o'zgarishi (yashil +N / qizil −N) */
;(function(){
if(window.__eloDelta||true)return;window.__eloDelta=1;   /* endi o'yinchi kartasi o'zi ko'rsatadi */
var last=null,iv=null;
function myId(){try{var u=window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initDataUnsafe&&Telegram.WebApp.initDataUnsafe.user;return u?String(u.id):''}catch(e){return ''}}
function clear(){[].forEach.call(document.querySelectorAll('.eloDx,.eloDp'),function(e){e.remove()})}
function inl(){
  if(!last||document.querySelector('.eloDx'))return;
  var n1=last.e,n0=last.e-last.d;
  var c=[].filter.call(document.querySelectorAll('span,b,div'),function(e){
    if(e.children.length)return false;
    var m=/^[★⭐]?\s*(\d{3,4})$/.exec((e.textContent||'').trim());
    return m&&(+m[1]===n1||+m[1]===n0);
  });
  var e=c[c.length-1];if(!e)return;
  var s=document.createElement('b');s.className='eloDx';
  s.style.cssText='color:'+last.col+';margin-left:4px;font-weight:700;font-size:13px;flex:none;white-space:nowrap';
  s.textContent=last.txt;
  e.insertAdjacentElement('afterend',s);
}
function got(m){
  var id=myId(),side=String(m.wu)===id?'white':String(m.bu)===id?'black':null;
  if(!side||!m.eloD)return;
  var d=m.eloD[side],ne=side==='white'?m.eloD.we:m.eloD.be;
  if(typeof d!=='number')return;
  var col=d>0?'#4ade80':d<0?'#f87171':'#cfcfcf',txt=(d>0?'+':d<0?'−':'±')+Math.abs(d);
  last={d:d,e:ne,col:col,txt:txt};
  clear();
  var p=document.createElement('div');p.className='eloDp';
  p.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99992;background:#1f1e1c;border:1px solid '+col+';color:'+col+';padding:8px 16px;border-radius:12px;font:800 18px system-ui,sans-serif;pointer-events:none;white-space:nowrap';
  p.textContent='';p.style.display='none';
  document.body.appendChild(p);
  setTimeout(function(){p.remove()},7000);
  if(iv)clearInterval(iv);
  var t0=Date.now();
  iv=setInterval(function(){inl();if(Date.now()-t0>120000){clearInterval(iv);clear();last=null}},500);
}
var S=WebSocket.prototype.send;
WebSocket.prototype.send=function(){
  if(!this.__eloH){
    this.__eloH=1;
    this.addEventListener('message',function(ev){
      try{
        if(typeof ev.data!=='string'||ev.data.indexOf('"roomElo"')<0)return;
        var m=JSON.parse(ev.data);
        if(m&&m.type==='roomElo')got(m);
      }catch(e){}
    });
  }
  return S.apply(this,arguments);
};
})();

/* DRAWCNT — Durang tugmasi 10 yurishgacha kulrang sanoq bilan */
;(function(){
if(window.__drawCnt)return;window.__drawCnt=1;
var last=null;
function pick(o){
  if(!o||typeof o!=='object')return null;
  if(typeof o.canDraw==='boolean')return o;
  var k=['state','room','st','s'];
  for(var i=0;i<k.length;i++){var v=o[k[i]];if(v&&typeof v==='object'&&typeof v.canDraw==='boolean')return v}
  return null;
}
function got(s){
  var n=0;
  if(s.drawMoves&&typeof s.drawMoves.w==='number')n=Math.min(s.drawMoves.w,s.drawMoves.b);
  else if(Array.isArray(s.moves))n=Math.floor(s.moves.length/2);
  last={can:s.canDraw,fin:!!s.finished,n:Math.min(n,9)};
}
function tick(){
  var b=document.getElementById('rcDrawOffer'),c=document.getElementById('rcDrawCnt');
  if(!b||!b.parentNode){if(c)c.style.display='none';return}
  var act=false;
  [].forEach.call(b.parentNode.querySelectorAll('button'),function(x){
    if(x!==b&&x!==c&&x.offsetParent!==null&&(x.textContent||'').indexOf('Taslim')>=0)act=true;
  });
  var on=!!(last&&!last.can&&!last.fin&&act&&b.offsetParent===null);
  if(!c){
    c=b.cloneNode(false);c.id='rcDrawCnt';
    c.style.cssText='display:none;opacity:.5';
    c.addEventListener('click',function(e){
      e.preventDefault();
      var m='Durang taklif qilish uchun har tomondan kamida 10 yurish kerak';
      try{var tg=window.Telegram&&Telegram.WebApp;if(tg&&tg.showAlert){tg.showAlert(m);return}}catch(x){}
      alert(m);
    });
    b.insertAdjacentElement('beforebegin',c);
  }
  if(!on){if(c.style.display!=='none')c.style.display='none';return}
  var t='🤝 '+last.n+'/10';
  if(c.textContent!==t)c.textContent=t;
  if(c.style.display==='none')c.style.display='';
}
var S=WebSocket.prototype.send;
WebSocket.prototype.send=function(){
  if(!this.__drwH){
    this.__drwH=1;
    this.addEventListener('message',function(ev){
      try{
        if(typeof ev.data!=='string'||ev.data.indexOf('"canDraw"')<0)return;
        var s=pick(JSON.parse(ev.data));if(s)got(s);
      }catch(e){}
    });
  }
  return S.apply(this,arguments);
};
setInterval(tick,300);
})();

/* HIDELINK — Havola tugmasi faqat o'yin boshlanmaguncha va tugagach */
;(function(){
if(window.__hideLink)return;window.__hideLink=1;
var hide=false;
function pick(o){
  if(!o||typeof o!=='object')return null;
  if(Array.isArray(o.moves)&&'finished' in o)return o;
  var k=['state','room','st','s'];
  for(var i=0;i<k.length;i++){var v=o[k[i]];if(v&&typeof v==='object'&&Array.isArray(v.moves)&&'finished' in v)return v}
  return null;
}
function tick(){
  var l=document.getElementById('rcLink');if(!l)return;
  var want=false;
  if(hide){
    var tas=false;
    [].forEach.call(l.parentNode.querySelectorAll('button'),function(x){
      if(x!==l&&x.offsetParent!==null&&(x.textContent||'').indexOf('Taslim')>=0)tas=true;
    });
    want=tas;
  }
  var d=want?'none':'';
  if(l.style.display!==d)l.style.display=d;
}
var S=WebSocket.prototype.send;
WebSocket.prototype.send=function(){
  if(!this.__hlH){
    this.__hlH=1;
    this.addEventListener('message',function(ev){
      try{
        if(typeof ev.data!=='string'||ev.data.indexOf('"moves"')<0)return;
        var s=pick(JSON.parse(ev.data));
        if(s)hide=s.moves.length>0&&!s.finished;
      }catch(e){}
    });
  }
  return S.apply(this,arguments);
};
setInterval(tick,300);
})();

/* ZALBTN — o'yin tugagach "Qayta o'ynash" yonida "Zalga chiqish" */
;(function(){
if(window.__zalBtn)return;window.__zalBtn=1;
function tick(){
  var z=document.getElementById('rcZal'),ex=document.getElementById('rcZalX');
  var rb=[].filter.call(document.querySelectorAll('button'),function(b){
    var t=b.textContent||'';
    return b.id!=='rcZalX'&&t.indexOf('Qayta o')>=0&&t.indexOf('ynash')>=0&&b.offsetParent!==null;
  })[0];
  if(!z||!rb){if(ex)ex.remove();return}
  if(ex&&ex.parentNode===rb.parentNode)return;
  if(ex)ex.remove();
  var x=document.createElement('button');
  x.id='rcZalX';x.textContent='🏟 Zalga chiqish';
  x.style.cssText=rb.style.cssText;
  x.style.background='#363431';x.style.boxShadow='0 4px 0 #1f1e1c';
  x.addEventListener('click',function(){z.click()});
  rb.insertAdjacentElement('afterend',x);
}
setInterval(tick,400);
})();
