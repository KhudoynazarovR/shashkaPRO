/* tlist.js — 🏆 Turnirlar ro'yxati (chess.com / lichess uslubida, ixcham).
   «Turnir» tabidagi eski kartalar (lbTs), hero, «Keyingi turnirlar» va «Orzular» bloklari o'rniga.
   Bo'limlar: Hozir o'ynalmoqda (tugash vaqti bo'yicha) · Tez orada (boshlanish vaqti bo'yicha) · Tugaganlar tabida.
   Qatorni bosish → turnir sahifasi (arena — tarena.js, qolganlari — eski oyna). Yaratish — mavjud forma (lbTPlus). */
;(function () {
  if (window.__tList) return; window.__tList = 1;
  function g(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); }
  function St() { try { return window.__lb ? window.__lb.S : null; } catch (e) { return null; } }
  function me() { var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function f2(n) { return (n < 10 ? '0' : '') + n; }
  function speed(tc) {
    var a = String(tc || '').split('+'), b = Number(a[0]) || 0, inc = Number(a[1]) || 0, est = b * 60 + inc * 40;
    if (!tc || tc === '∞') return ['♟', ''];
    return est < 30 ? ['⚡', 'Giper'] : est < 180 ? ['🚀', 'Bullet'] : est < 480 ? ['🔥', 'Blits'] : est < 1500 ? ['🐇', 'Tezkor'] : ['🐢', 'Klassik'];
  }
  function tcTxt(tc) { var a = String(tc || '').split('+'), b = Number(a[0]) || 0; return (b > 0 && b < 1 ? Math.round(b * 60) + ' s' : b) + ' + ' + (Number(a[1]) || 0); }
  function dur(ms) {   // ⏱ jonli sanoq: soniyagacha
    var s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
    if (d >= 1) return d + ' kun ' + f2(h) + ':' + f2(m) + ':' + f2(ss);
    if (h >= 1) return h + ':' + f2(m) + ':' + f2(ss);
    return m + ':' + f2(ss);
  }
  function dayLbl(ts) {
    var d = new Date(ts), n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), dd = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - t0) / 864e5);
    return dd === 0 ? '' : dd === 1 ? 'Ertaga ' : f2(d.getDate()) + '.' + f2(d.getMonth() + 1) + ' ';
  }
  var css = '' +
    '#lbT.tlOn>#lbTbar,#lbT.tlOn>#lbHero,#lbT.tlOn #lbTs,#lbT.tlOn #lbDream,#lbT.tlOn #nxtBox2,#lbT.tlOn #lbTsH{display:none!important}' +
    '#lbT.tlOn:not(.tlClub) #lbClubs,#tvClub3{display:none!important}#lbT.tlClub #tlList{display:none}' +
    'body.tlOnB #tvClub3{display:none!important}' +
    '#tlHead{display:flex;align-items:center;gap:8px;margin:4px 0 6px}#tlHead b{flex:1;font-size:21px;font-weight:800}' +
    '#tlHead button{border:0;border-radius:12px;height:40px;padding:0 12px;font-weight:700;font-size:14px;color:#fff;background:rgba(255,255,255,.09)}#tlHead button.add{background:#81b64c}' +
    '#tlTabs{display:flex;border-bottom:1px solid rgba(255,255,255,.12);margin-bottom:4px}#tlTabs button{flex:1;border:0;background:none;color:var(--spMute,#b9ab98);font-weight:700;font-size:15px;padding:11px 0;border-bottom:3px solid transparent}' +
    '#tlTabs button.on{color:#fff;border-bottom-color:#6cc04a}' +
    '#tlList h5{margin:14px 4px 4px;font-size:12px;letter-spacing:.8px;color:#9c8f80;font-weight:700}' +
    '#tlList .r{display:flex;align-items:center;gap:12px;padding:11px 8px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '#tlList .r:active{background:rgba(255,255,255,.05)}#tlList .r.me{background:rgba(108,192,74,.09);box-shadow:inset 3px 0 0 #6cc04a}' +
    '#tlList .i{font-size:25px;width:32px;text-align:center;flex:none}#tlList .t{flex:1;min-width:0}' +
    '#tlList .t b{display:block;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tlList .t small{display:block;color:var(--spMute,#b9ab98);font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tlList .t small .p{color:#f5b72b}#tlList .t small .y{color:#86efac}' +
    '#tlList .w{text-align:right;font-size:12.5px;color:#d6ccbd;white-space:nowrap;flex:none}#tlList .w b{display:block;color:#fff;font-size:15px}#tlList .w b.l{color:#6cc04a}' +
    '#tlList .e{padding:28px 10px;text-align:center;color:var(--spMute,#b9ab98)}#tlList .e button{margin-top:12px;border:0;border-radius:12px;padding:11px 18px;background:#81b64c;color:#fff;font-weight:700;font-size:15px}';
  var stl = document.createElement('style'); stl.textContent = css; document.head.appendChild(stl);
  var ccss = document.createElement('style'); ccss.textContent = `/*tlCardV2*/
#tlList .r{display:block;padding:12px;margin:8px 0;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.05);box-shadow:inset 4px 0 0 var(--ac,#5b8def)}
#tlList .r.s-run{--ac:#6cc04a}
#tlList .r.s-fin{--ac:#7b8196}
#tlList .r.me{background:rgba(108,192,74,.1);border-color:rgba(108,192,74,.4)}
#tlList .r .top{display:flex;align-items:flex-start;gap:12px}
#tlList .r .i{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none;background:rgba(255,255,255,.08)}
#tlList .r .i.k-gp,#tlList .r .i.k-mx{background:rgba(170,120,255,.24)}
#tlList .r .i.k-bl{background:rgba(91,141,239,.26)}
#tlList .r .i.k-bz{background:rgba(255,140,60,.24)}
#tlList .r .i.k-rp{background:rgba(108,192,74,.22)}
#tlList .r .i.k-kl{background:rgba(64,200,190,.22)}
#tlList .r .i.k-tr{background:rgba(245,183,43,.22)}
#tlList .r .t{padding-top:2px}
#tlList .r .t b{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3;word-break:break-word}
#tlList .r .w{padding-top:1px}
#tlList .r .chs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
#tlList .r .c{font-size:12.5px;padding:4px 9px;border-radius:8px;background:rgba(255,255,255,.08);color:#d6ccbd}
#tlList .r .c.p{background:rgba(245,183,43,.16);color:#f5b72b}
#tlList .r .c.y{background:rgba(134,239,172,.14);color:#86efac}
`; document.head.appendChild(ccss);
  var c4 = document.createElement('style'); c4.textContent = `/*tlCardV4*/
#tlList .r{padding:14px;margin:12px 0;border-radius:20px;background:linear-gradient(160deg,#181e45,#12162f);border:1px solid #2a3160}
#tlList .r::before{display:none}
#tlList .r.me{border-color:rgba(108,192,74,.5)}
#tlList .r .hd{display:flex;align-items:center;gap:12px}
#tlList .r .hd .i{width:46px;height:46px;font-size:25px;border-radius:14px}
#tlList .r .nm{flex:1;min-width:0;font-size:18px;font-weight:800;line-height:1.25;word-break:break-word}
#tlList .r .bdg{font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:10px;white-space:nowrap}
#tlList .r .b-run{background:#143d33;color:#4ee08a}
#tlList .r .b-reg{background:#1d2a5c;color:#8fb0ff}
#tlList .r .b-fin{background:#2a2f4a;color:#9aa0c0}
#tlList .r .sbar{margin:12px 0 6px;padding:10px 12px;border-radius:12px;font-size:14.5px;font-weight:700}
#tlList .r .rw{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:#aab0d6;margin:9px 0;line-height:1.35}
#tlList .r .rw i{font-style:normal;width:22px;text-align:center;flex:none}
#tlList .r .rw b{color:#fff}
#tlList .r .rw b.cr{color:#8fa4ff}
#tlList .r .ft{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 4px 32px}
#tlList .r .btns{display:flex;gap:8px;margin-top:14px}
#tlList .r .btns button{flex:1;border:0;border-radius:14px;height:46px;font-size:15px;font-weight:700;color:#fff;background:rgba(255,255,255,.09)}
#tlList .r .btns .cta{flex:2;background:linear-gradient(90deg,#6366f1,#8b5cf6)}
#tlList .r .btns button:active{filter:brightness(.88);transform:translateY(1px)}
`; document.head.appendChild(c4);
  var c5 = document.createElement('style'); c5.textContent = `/*tlCardV5*/
#tlList .r{box-shadow:none!important;background:rgba(0,0,0,.38)!important;border-color:rgba(255,255,255,.13)!important}
#tlList .r::before{display:none!important}
#tlList .r .b-reg{background:rgba(91,141,239,.22)!important}
#tlList .r .b-run{background:rgba(76,224,138,.16)!important}
#tlList .r .b-fin{background:rgba(255,255,255,.09)!important}
#tlList .r .rw{margin:7px 0}
#tlList .r .sbar{margin:10px 0 4px;font-size:14px}
`; document.head.appendChild(c5);
  var c6 = document.createElement('style'); c6.textContent = '/*tlShareV1*/#tlList .r .btns .shr{flex:0 0 52px;font-size:19px;padding:0}'; document.head.appendChild(c6);
  var c8 = document.createElement('style'); c8.textContent = `/*tlAvatarV1*/
#tlList .r .rw.tlAv{display:flex;align-items:center;gap:10px}
#tlList .r .rw.tlAv .av{display:flex;flex:0 0 auto}
#tlList .r .rw.tlAv .av i{width:30px;height:30px;border-radius:50%;margin-left:-9px;border:2px solid rgba(255,255,255,.22);background:#3b4a7a;color:#e6ecff;font:700 13px/26px system-ui;font-style:normal;text-align:center;overflow:hidden;display:block;flex:0 0 auto}
#tlList .r .rw.tlAv .av i:first-child{margin-left:0}
#tlList .r .rw.tlAv .av i img{width:100%;height:100%;object-fit:cover;display:block}
#tlList .r .rw.tlAv .av i.mo{background:#56659c;font-size:12px;letter-spacing:-.5px}
#tlList .r .ft .c.tk{background:rgba(129,182,76,.18);border:1px solid rgba(129,182,76,.4);color:#b7e58a;font-weight:700}
#tlList .r .ft .c.tk.on{background:linear-gradient(180deg,#ffd76a,#e2a21f);border-color:#e2a21f;color:#2a1a00}
`; document.head.appendChild(c8);
  var c7 = document.createElement('style'); c7.textContent = '/*tlBellV1*/#tlList .r .btns .bel{flex:0 0 62px;font-size:17px;padding:0}#tlList .r .btns .bel.on{background:rgba(76,224,138,.22);color:#4ee08a}'; document.head.appendChild(c7);
  var c9 = document.createElement('style'); c9.textContent = `/*tlProV1 — oltin-yashil karta*/
#tlHead button.add{background:linear-gradient(180deg,#9ad455,#6ba32c)!important;color:#16260a!important;box-shadow:0 3px 0 #4a7117;border-radius:13px!important;height:42px!important}
#tlTabs{border-bottom:0!important;background:rgba(0,0,0,.3);border-radius:12px;padding:4px;gap:4px;margin-bottom:12px}
#tlTabs button{border-radius:9px;padding:9px 0!important;color:#a2927a!important}
#tlTabs button.on{color:#2a1a00!important;background:linear-gradient(180deg,#ffd76a,#e8ab2a);border-bottom-color:transparent!important}
#tlList h5{color:#8d7d66!important;letter-spacing:1.3px!important;font-size:11px!important;margin:14px 3px 9px!important}
#tlList .r{position:relative;overflow:hidden;padding:14px!important;border-radius:20px!important;
 background:linear-gradient(170deg,rgba(255,214,130,.09),rgba(0,0,0,0) 38%),linear-gradient(180deg,#2e1f11,#171009)!important;
 border:1px solid rgba(255,196,96,.26)!important;box-shadow:0 12px 24px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,228,170,.09)!important}
#tlList .r:after{content:'';position:absolute;right:-30px;top:-30px;width:150px;height:150px;opacity:.06;pointer-events:none;
 background:repeating-conic-gradient(from 0deg,#fff 0 25%,transparent 0 50%) 0 0/26px 26px;transform:rotate(12deg)}
#tlList .r.s-run{background:linear-gradient(170deg,rgba(90,220,140,.1),rgba(0,0,0,0) 38%),linear-gradient(180deg,#132618,#0b1409)!important;border-color:rgba(90,220,140,.38)!important}
#tlList .r>*{position:relative;z-index:1}
#tlList .r .hd{align-items:flex-start!important;gap:11px!important}
#tlList .r .hd .i{width:46px;height:46px;border-radius:14px;background:linear-gradient(180deg,#9a5a18,#4a2a08)!important;border:1px solid rgba(255,196,96,.4);box-shadow:inset 0 1px 0 rgba(255,220,150,.25)}
#tlList .r.s-run .hd .i{background:linear-gradient(180deg,#1e7a44,#0c3b20)!important;border-color:rgba(90,220,140,.45)}
#tlList .r .t2{flex:1;min-width:0}
#tlList .r .t2 b.nm{display:block;font-size:18.5px;font-weight:800;line-height:1.18;letter-spacing:-.2px;word-break:break-word}
#tlList .r .t2 small{display:block;font-size:13px;font-weight:600;color:#a9977c;margin-top:3px}
#tlList .r .pz{flex:0 0 auto;text-align:center;border-radius:13px;padding:7px 11px;background:linear-gradient(180deg,#ffdf8d,#e0a120);box-shadow:0 3px 0 #9b6b0d}
#tlList .r .pz b{display:block;font:900 17px system-ui;color:#3a2500;line-height:1}
#tlList .r .pz small{display:block;font:800 9px system-ui;color:#6b4a06;letter-spacing:.7px;margin-top:2px}
#tlList .r .sbar{display:flex;align-items:center;gap:10px;margin:12px 0 0!important;padding:9px 11px!important;border-radius:13px!important;
 background:rgba(0,0,0,.32)!important;border:1px solid rgba(255,196,96,.18);color:#efe6d7!important}
#tlList .r.s-run .sbar{border-color:rgba(90,220,140,.25)}
#tlList .r .sbar .lbl{font:800 10px system-ui;color:#9d8a6c;letter-spacing:.8px;flex:0 0 auto}
#tlList .r .sbar .val{font:800 19px ui-monospace,SFMono-Regular,monospace;color:#ffd76a;letter-spacing:.5px;line-height:1.1;flex:1;min-width:0}
#tlList .r.s-run .sbar .val{color:#7ee8a2}
#tlList .r.s-fin .sbar .val{font-size:15px;color:#e8dcc4}
#tlList .r .sbar .when{margin-left:auto;text-align:right;font:600 12px system-ui;color:#a9977c;flex:0 0 auto;line-height:1.3}
#tlList .r .pbar{height:4px;border-radius:3px;background:rgba(255,255,255,.08);margin:9px 0 0;overflow:hidden}
#tlList .r .pbar i{display:block;height:100%;background:linear-gradient(90deg,#e8ab2a,#ffe7a8)}
#tlList .r.s-run .pbar i{background:linear-gradient(90deg,#3fa96a,#8ff0b4)}
#tlList .r .ft{margin:11px 0 0!important;gap:6px!important}
#tlList .r .ft .c{font-size:12.5px!important;padding:6px 10px!important;border-radius:9px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.07);color:#e3d6bd!important}
#tlList .r .ft .c.tk{background:rgba(154,212,85,.16)!important;border-color:rgba(154,212,85,.4)!important;color:#c2ea92!important;font-weight:800}
#tlList .r .ft .c.tk.on{background:linear-gradient(180deg,#ffdf8d,#e0a120)!important;border-color:#e0a120!important;color:#3a2500!important}
#tlList .r .pod{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}
#tlList .r .pod div{background:rgba(255,255,255,.06);border-radius:12px;padding:9px 6px;text-align:center}
#tlList .r .pod i{display:block;width:30px;height:30px;margin:0 auto 5px;border-radius:50%;font-style:normal;font:800 13px/30px system-ui;color:#fff}
#tlList .r .pod b{display:block;font:700 12.5px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tlList .r .pod small{font:800 13px system-ui;color:#ffd76a}
#tlList .r .rw.tlAv{margin-top:12px!important;gap:10px!important;align-items:center!important}
#tlList .r .rw.tlAv.empty{color:#c2ea92;font-weight:700;font-size:13.5px}
#tlList .r .rw.tlAv .av i{width:32px!important;height:32px!important;margin-left:-10px!important;border:2px solid rgba(255,215,140,.5)!important;
 font:800 14px/28px system-ui!important;color:#fff!important;box-shadow:0 2px 6px rgba(0,0,0,.45)}
#tlList .r .rw.tlAv .av i:first-child{margin-left:0!important}
#tlList .r .rw.tlAv .tx{font:700 14px system-ui;color:#f0e5d0}
#tlList .r .rw.tlAv .av i.a1,#tlList .r .pod i.a1{background:linear-gradient(135deg,#ff9566,#e2552a)}
#tlList .r .rw.tlAv .av i.a2,#tlList .r .pod i.a2{background:linear-gradient(135deg,#7cc8ff,#2f7fd0)}
#tlList .r .rw.tlAv .av i.a3,#tlList .r .pod i.a3{background:linear-gradient(135deg,#a5e07a,#4f9a2d)}
#tlList .r .rw.tlAv .av i.a4,#tlList .r .pod i.a4{background:linear-gradient(135deg,#d9a7ff,#8a4ed0)}
#tlList .r .rw.tlAv .av i.a5,#tlList .r .pod i.a5{background:linear-gradient(135deg,#ffd76a,#dd9f1c);color:#3a2500!important}
#tlList .r .rw.tlAv .av i.a6,#tlList .r .pod i.a6{background:linear-gradient(135deg,#6ad0c0,#1f8d7d)}
#tlList .r .rw.tlAv .av i.mo{background:linear-gradient(135deg,#8a6a3a,#4e3819)!important;font-size:11px!important}
#tlList .r .mine{margin-top:10px;font:700 13px system-ui;color:#c2ea92;background:rgba(154,212,85,.13);border:1px solid rgba(154,212,85,.22);border-radius:11px;padding:9px 11px}
#tlList .r .spB{margin-top:11px;background:rgba(255,214,130,.07);border:1px solid rgba(255,196,96,.25);border-radius:14px;padding:10px 11px}
#tlList .r .spH{display:flex;justify-content:space-between;font:800 13px system-ui;color:#ffd76a;margin-bottom:7px}
#tlList .r .spL{display:flex;align-items:center;gap:9px;padding:4px 0;font:600 13.5px system-ui;color:#efe2c8}
#tlList .r .spL i{width:26px;height:26px;border-radius:50%;flex:none;font-style:normal;text-align:center;font:800 12px/26px system-ui;color:#fff}
#tlList .r .spL span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tlList .r .spL b.bs{font:800 10.5px system-ui;color:#2a1a00;background:linear-gradient(180deg,#ffdf8d,#e0a120);border-radius:8px;padding:2px 7px}
#tlList .r .spL em{font-style:normal;font-weight:900;color:#ffd76a}
#tlList .r .spM{font:600 12px system-ui;color:#9d8a6c;margin-top:5px}
#tlList .r .crl{margin-top:9px;font:600 12.5px system-ui;color:#9d8a6c}
#tlList .r .crl b{color:#d9c8a8;font-weight:800}
#tlList .r .btns{margin-top:13px!important;gap:8px!important}
#tlList .r .btns button{border-radius:14px!important;height:50px!important;font-size:16px!important;font-weight:800!important;
 background:rgba(255,255,255,.08)!important;color:#f0e5d0!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)!important}
#tlList .r .btns .cta{flex:2;color:#16260a!important;background:linear-gradient(180deg,#a8e163,#6ea52c)!important;box-shadow:0 4px 0 #46700f!important}
#tlList .r.s-run .btns .cta{background:linear-gradient(180deg,#7ee8a2,#2f9b5b)!important;box-shadow:0 4px 0 #1b5e35!important}
#tlList .r .btns button:active{transform:translateY(2px);filter:brightness(.95)}
#tlList .r .bdg{background:rgba(255,255,255,.08)!important;color:#e3d6bd!important}
#tlList .r .bdg.b-run{background:rgba(90,220,140,.18)!important;color:#7ee8a2!important}
`; document.head.appendChild(c9);

  var tab = 'live', sig = '';
  // 🎟 CHIPTA: 20 🪙 — 24 soat turnirlarga cheksiz kirish
  var TK = { left: 0, price: 20, hours: 24 };
  function idt() { try { return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || ''; } catch (e) { return ''; } }
  function tkTxt() { if (TK.left > 0) { var m = Math.floor(TK.left / 60000), h = Math.floor(m / 60); return 'Chipta: ' + (h ? h + ' soat' : Math.max(1, m) + ' daq') + ' qoldi'; } return 'Chipta ' + TK.price + ' tanga'; }
  function tkLoad() {
    fetch('/api/ticket', { headers: { 'x-init-data': idt() } }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || typeof j.left !== 'number') return;
      TK.left = j.left; TK.price = j.price || TK.price; TK.hours = j.hours || TK.hours; sig = ''; render();
    }).catch(function () {});
  }
  function tkMsg(s) { try { var w = window.Telegram && window.Telegram.WebApp; if (w && w.showAlert) return w.showAlert(s); } catch (e) {} if (window.toast) window.toast(s, null, 3000); else alert(s); }
  function tkBuy() {
    if (TK.left > 0) return tkMsg('Chiptangiz amal qilmoqda — ' + tkTxt().replace('Chipta: ', '') + '. Turnirlarga bepul kirasiz.');
    var q = 'Chipta ' + TK.price + ' tanga — ' + TK.hours + ' soat davomida barcha turnirlarga bepul kirasiz. Olasizmi?';
    var go = function () {
      fetch('/api/ticket', { method: 'POST', headers: { 'x-init-data': idt(), 'Content-Type': 'application/json' }, body: '{}' })
        .then(function (r) { return r.json(); }).then(function (j) {
          if (j && j.ok) { TK.left = Math.max(0, (j.until || 0) - Date.now()); sig = ''; render(); tkMsg('Chipta olindi — ' + TK.hours + ' soat amal qiladi'); }
          else tkMsg(j && j.need ? 'Chipta uchun ' + j.need + ' tanga kerak' : 'Chipta olinmadi');
        }).catch(function () { tkMsg('Chipta olinmadi'); });
    };
    try { var w = window.Telegram && window.Telegram.WebApp; if (w && w.showConfirm) return w.showConfirm(q, function (ok) { if (ok) go(); }); } catch (e) {}
    if (confirm(q)) go();
  }
  setInterval(function () { if (TK.left > 0) { TK.left = Math.max(0, TK.left - 60000); sig = ''; } }, 60000);
  setTimeout(tkLoad, 1200); setInterval(tkLoad, 300000);
  // 📣 turnir yaratilgandan so'ng e'lon joyini shu yerda tanlanadi (alohida bosqich bo'lmaydi)
  var annAsked = {};
  function annCheck(T, u) {
    for (var i = 0; i < T.length; i++) {
      var t = T[i]; if (t.status !== 'reg' || String(t.creatorUid) !== String(u) || annAsked[t.id]) continue;
      var age = Date.now() - (t.created || 0); if (!(age >= 0 && age < 120000)) continue;
      var k = 'tAnn_' + t.id, seen = false; try { seen = localStorage.getItem(k) === '1'; } catch (e) {}
      annAsked[t.id] = 1; if (seen) continue;
      try { localStorage.setItem(k, '1'); } catch (e) {}
      if (window.lbSend) window.lbSend({ type: 'lbTAnnList', tid: t.id });
    }
  }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function avCls(uid) { var s = String(uid || ''), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return 'a' + (h % 6 + 1); }
  function ini(n) { n = String(n || '').replace(/^[^0-9A-Za-zА-Яа-яЎўҚқҒғҲҳ]+/, '').trim(); return esc((n.charAt(0) || '•').toUpperCase()); }
  // 💰 homiylik oynasi
  function sheet(title, html) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482900;background:rgba(0,0,0,.6);display:flex;align-items:flex-end';
    ov.innerHTML = '<div style="width:100%;max-height:88vh;overflow:auto;background:#1b1209;color:#f2e9da;border:1px solid rgba(255,196,96,.3);border-radius:22px 22px 0 0;padding:14px 14px calc(env(safe-area-inset-bottom,0px) + 14px);box-sizing:border-box">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><b style="font-size:17px">' + title + '</b>' +
      '<button data-x="1" style="border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;width:36px;height:36px;font-size:16px">✕</button></div>' + html + '</div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov || e.target.closest('[data-x]')) ov.remove(); };
    return ov;
  }
  function sponsor(tid) {
    var t = (St() && St().tournaments || []).filter(function (x) { return String(x.id) === String(tid); })[0] || {};
    var ov = sheet('💰 Homiy bo‘lish',
      '<div style="font-size:14px;color:#c9b793;line-height:1.5;margin-bottom:12px">«' + esc(t.name || '') + '» mukofot jamg‘armasiga qo‘shasiz. Eng kami <b style="color:#ffd76a">100 tanga</b>. Homiylik qilgach botga chiroyli rasm yuboriladi.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' + [100, 300, 500, 1000, 5000].map(function (n) {
        return '<button data-s="' + n + '" style="flex:1;min-width:84px;border:1px solid rgba(255,214,130,.35);background:rgba(255,255,255,.07);color:#ffd76a;border-radius:12px;padding:11px 6px;font-weight:800;font-size:15px">' + n + '</button>';
      }).join('') + '</div>' +
      '<input id="spSum" type="number" min="100" placeholder="Boshqa miqdor (100 dan ko‘p)" style="width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #4a3a1c;background:#120c05;color:#fff;font-size:16px;margin-bottom:10px">' +
      '<button id="spGo" style="width:100%;border:0;border-radius:13px;padding:14px;font-weight:800;font-size:16px;color:#3a2500;background:linear-gradient(180deg,#ffdf8d,#e0a120)">💰 Homiylik qilish</button>' +
      '<div id="spErr" style="color:#ff9a9a;font-size:13.5px;min-height:18px;margin-top:8px"></div>');
    var inp = ov.querySelector('#spSum');
    ov.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { inp.value = b.getAttribute('data-s'); }; });
    ov.querySelector('#spGo').onclick = function () {
      var n = Math.floor(Number(inp.value) || 0);
      if (n < 100) { ov.querySelector('#spErr').textContent = 'Eng kami 100 tanga'; return; }
      if (window.lbSend) window.lbSend({ type: 'lbTSponsor', tid: tid, sum: n });
      ov.remove();
    };
  }
  // ⋯ tashkilotchi amallari
  function actions(tid) {
    var t = (St() && St().tournaments || []).filter(function (x) { return String(x.id) === String(tid); })[0] || {};
    var reg = t.status === 'reg';
    var ov = sheet('⋯ Amallar',
      (reg && !t.startAt ? '<button data-a="start" class="aB">▶ Boshlash</button>' : '') +
      (reg ? '<button data-a="invite" class="aB">📣 Chaqirish</button>' : '') +
      '<button data-a="ann" class="aB">📨 Guruhga yuborish</button>' +
      '<div class="aT">⏱ Vaqtni siljitish</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px">' + [['+15', 15], ['+1 soat', 60], ['+1 kun', 1440], ['−15', -15]].map(function (p) {
        return '<button data-add="' + p[1] + '" style="flex:1;border:1px solid rgba(255,214,130,.3);background:rgba(255,255,255,.07);color:#ffd76a;border-radius:12px;padding:11px 4px;font-weight:800;font-size:14px">' + p[0] + '</button>';
      }).join('') + '</div>' +
      '<button data-a="edit" class="aB">✏️ Nom, mukofot, davomiylik</button>' +
      (reg ? '<button data-a="cancel" class="aB d">🗑 Turnirni o‘chirish</button>' : ''));
    var st = document.createElement('style');
    st.textContent = '.aB{width:100%;border:0;border-radius:13px;padding:13px;margin-bottom:8px;background:#2b1f10;color:#f2e9da;font-size:15.5px;font-weight:700;text-align:left}.aB.d{background:#4a1b1b;color:#ffd9d9}.aT{font-size:11.5px;letter-spacing:1px;color:#9d8a6c;margin:12px 2px 7px;font-weight:800}';
    ov.appendChild(st);
    ov.querySelectorAll('[data-add]').forEach(function (b) {
      b.onclick = function () { if (window.lbSend) window.lbSend({ type: 'lbTEdit', tid: tid, addMin: Number(b.getAttribute('data-add')) }); ov.remove(); };
    });
    ov.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-a');
        if (a === 'start') window.lbSend({ type: 'lbTStart', tid: tid });
        else if (a === 'invite') window.lbSend({ type: 'lbTInvite', tid: tid });
        else if (a === 'ann') window.lbSend({ type: 'lbTAnnList', tid: tid });
        else if (a === 'cancel') { if (!confirm('Turnir o‘chirilsinmi?')) return; window.lbSend({ type: 'lbTCancel', tid: tid }); }
        else if (a === 'edit') {
          var nm2 = prompt('Turnir nomi:', t.name || ''); if (nm2 === null) return;
          var pz = prompt('Mukofot (tanga):', String(t.prize || 0)); if (pz === null) return;
          var du = prompt('Davomiyligi (daqiqa):', String(t.durationMin || 60)); if (du === null) return;
          window.lbSend({ type: 'lbTEdit', tid: tid, name: nm2, prize: Number(pz) || 0, duration: Number(du) || 0 });
        }
        ov.remove();
      };
    });
  }
  // 💰 homiylar ro'yxati
  function spRow(t) {
    var sp = (t.sponsors || []).slice().sort(function (a, b) { return b.sum - a.sum; });
    if (!sp.length) return '';
    var tot = sp.reduce(function (n, x) { return n + (x.sum || 0); }, 0);
    var top = sp.slice(0, 3).map(function (x, i) {
      return '<div class="spL"><i class="' + avCls(x.uid) + '">' + ini(x.name) + '</i><span>' + esc(String(x.name || '').slice(0, 14)) + (i === 0 ? ' <b class="bs">bosh homiy</b>' : '') + '</span><em>' + fmtN(x.sum) + '</em></div>';
    }).join('');
    return '<div class="spB"><div class="spH">💰 Homiylar<span>' + fmtN(tot) + ' tanga</span></div>' + top +
      (sp.length > 3 ? '<div class="spM">yana ' + (sp.length - 3) + ' homiy</div>' : '') + '</div>';
  }
  // 🥇 jonli turnirda top-3
  function podium(t) {
    var ps = (t.players || []).filter(function (p) { return (p.score || 0) > 0 || p.games > 0; }).slice(0, 3);
    if (ps.length < 3) return '';
    var md = ['🥇', '🥈', '🥉'];
    return '<div class="pod">' + ps.map(function (p, i) {
      return '<div><i class="' + avCls(p.uid) + '">' + ini(p.name) + '</i><b>' + esc(String(p.name || '').replace(/^🤖\s*/, '').slice(0, 10)) + '</b><small>' + md[i] + ' ' + (p.score || 0) + '</small></div>';
    }).join('') + '</div>';
  }
  // 🟢 o'zingizning o'rningiz
  function myLine(t, u) {
    var ps = t.players || [], k = -1;
    for (var i = 0; i < ps.length; i++) if (String(ps[i].uid) === String(u) && !ps[i].withdrawn) { k = i; break; }
    if (k < 0) return '';
    if (t.status === 'reg') return '<div class="mine">Siz ro‘yxatdasiz — boshlanishini kuting</div>';
    return '<div class="mine">Siz: ' + (k + 1) + '-o‘rin' + (ps[k].score != null ? ' · ' + ps[k].score + ' ochko' : '') + '</div>';
  }
  // ▓ to'ldirish chizig'i
  function pct(t, now) {
    var a = 0, b = 0;
    if (t.status === 'reg' && t.startAt) { a = t.created || (t.startAt - 864e5); b = t.startAt; }
    else if (t.status === 'running' && t.startAt && t.endAt) { a = t.startAt; b = t.endAt; }
    else if (t.status === 'finished') return 100;
    else return 0;
    if (b <= a) return 0;
    return Math.max(2, Math.min(100, Math.round((now - a) / (b - a) * 100)));
  }
  // ⏳ holat qatori: yorliq · sanoq · izoh (sanoq har soniyada yangilanadi)
  function sbarParts(t, now, top0) {
    if (!top0) { var ps0 = t.players || []; top0 = ps0.filter(function (p) { return p.games > 0 || p.score > 0; })[0] || ps0[0]; }
    var hum = (t.players || []).filter(function (p) { return !p.bot; }).length;
    if (t.status === 'running') {
      if (t.ending) return { lbl: 'YAKUNLANMOQDA', val: 'oxirgi o‘yinlar', when: hum + ' ishtirokchi' };
      var live = (t.boards || []).filter(function (b) { return !b.done; }).length;
      return { lbl: 'TUGASHIGA', val: t.endAt ? dur(t.endAt - now) : (t.round ? t.round + ' / ' + (t.rounds || '?') + '-tur' : 'o‘ynalmoqda'),
        when: hum + ' ishtirokchi' + (live ? '<br>' + live + ' o‘yin ketyapti' : '') };
    }
    if (t.status === 'finished') return { lbl: 'YAKUNLANDI', val: top0 ? '🥇 ' + esc(String(top0.name || '').replace(/^🤖\s*/, '').slice(0, 14)) : 'tugadi',
      when: t.endAt ? (dayLbl(t.endAt) || '') + f2(new Date(t.endAt).getHours()) + ':' + f2(new Date(t.endAt).getMinutes()) : '' };
    if (!t.startAt) return { lbl: 'RO‘YXAT', val: 'ochiq', when: hum + ' ishtirokchi' };
    if (t.startAt <= now) return { lbl: 'BOSHLANMOQDA', val: 'kuting…', when: hum + ' ishtirokchi' };
    return { lbl: 'BOSHLANISHIGA', val: dur(t.startAt - now),
      when: (dayLbl(t.startAt) || 'Bugun') .replace(/,\s*$/, '') + '<br>' + f2(new Date(t.startAt).getHours()) + ':' + f2(new Date(t.startAt).getMinutes()) };
  }
  // ⏳ sarlavha ostidagi holat qatori — har soniyada yangilanadi
  function sbarTxt(t, now, top0) {
    if (!top0) { var ps0 = t.players || []; top0 = ps0.filter(function (p) { return p.games > 0 || p.score > 0; })[0] || ps0[0]; }
    if (t.status === 'running') return t.ending ? 'Yakunlanmoqda…' : 'O‘ynalmoqda' + (t.round ? ' · ' + t.round + (t.rounds ? ' / ' + t.rounds : '') + '-tur' : '') + (t.endAt ? ' · tugashiga ' + dur(t.endAt - now) : '');
    if (t.status === 'finished') return 'Yakunlandi' + (top0 ? ' · 🥇 ' + String(top0.name || '').replace(/^🤖\s*/, '').slice(0, 18) : '');
    if (!t.startAt) return 'Ro‘yxat ochiq';
    if (t.startAt <= now) return 'Boshlanmoqda';
    return 'Boshlanishiga ' + dur(t.startAt - now) + ' · ' + (dayLbl(t.startAt) || 'Bugun ') + f2(new Date(t.startAt).getHours()) + ':' + f2(new Date(t.startAt).getMinutes());
  }
  setInterval(function () {   // jonli sanoq: butun ro'yxatni qayta chizmasdan
    var s = St(), T = (s && s.tournaments) || [], now = Date.now(); if (!T.length) return;
    var ls = g('tlList'); if (!ls) return;
    for (var i = 0; i < T.length; i++) {
      var t = T[i], r = ls.querySelector('[data-tid="' + String(t.id).replace(/"/g, '') + '"]'); if (!r) continue;
      var b = r.querySelector('.sbar'); if (!b) continue;
      var P = sbarParts(t, now), vl = b.querySelector('.val'), lb = b.querySelector('.lbl'), wh = b.querySelector('.when');
      if (!vl) { var v = '⏳ ' + sbarTxt(t, now); if (b.textContent !== v) b.textContent = v; continue; }
      if (vl.innerHTML !== P.val) vl.innerHTML = P.val;
      if (lb && lb.textContent !== P.lbl) lb.textContent = P.lbl;
      if (wh && wh.innerHTML !== P.when) wh.innerHTML = P.when;
      var pb = r.querySelector('.pbar i'), pv = pct(t, now) + '%'; if (pb && pb.style.width !== pv) pb.style.width = pv;
    }
  }, 1000);
  function rowOf(t, u) {
    var sp = speed(t.tc), ps = t.players || [], bots = 0, hum = 0, inn = false, now = Date.now();
    ps.forEach(function (p) { if (p.bot) bots++; else hum++; if (String(p.uid) === u && !p.withdrawn) inn = true; });
    var kind = t.mix ? '🔀 Miks · ' + t.mix.length + ' o‘yin' : t.type === 'arena' ? '' : t.type === 'swiss' ? 'Shveytsariya' + (t.roundsWanted ? ' · ' + t.roundsWanted + ' tur' : '') : t.type === 'olympic' || t.type === 'ko' ? 'Olimpiya tizimi' : 'Turnir';
    var name = String(t.name || 'Turnir').replace(/^[^\p{L}\p{N}]+\s*/u, '').replace(/[\s\p{Extended_Pictographic}\uFE0F]+$/u, '');
    var empty = !hum && !bots && t.status !== 'finished';
    var sub = (t.tc && t.tc !== '∞' && !t.mix ? esc(tcTxt(t.tc)) + ' ' + sp[1] + ' · ' : '') + (kind ? kind + ' · ' : '') + (empty ? '<span class="y">Bo‘sh — qo‘shiling!</span>' : hum + ' o‘yinchi') + (bots ? ' · 🤖 ' + bots : '') +
      ((t.clubIds || []).length ? ' · 👥 ' + ((t.clubIds || []).length > 1 ? 'klublar jangi' : 'klub') : '') + (t.prize ? ' · <span class="p">🏆 ' + t.prize + '</span>' : '') + (inn ? ' · <span class="y">✓ siz</span>' : '');
    var w = '';
    if (t.status === 'running') w = t.ending ? '<b class="l">yakunlanmoqda</b>oxirgi o‘yinlar' : t.endAt ? '<b class="l">' + dur(t.endAt - now) + '</b>tugashiga' : '<b class="l">' + (t.round ? t.round + '-tur' : 'jonli') + '</b>' + (t.rounds ? t.rounds + ' turdan' : 'o‘ynalmoqda');
    else if (t.status === 'reg') w = t.startAt ? '<b>' + dayLbl(t.startAt) + f2(new Date(t.startAt).getHours()) + ':' + f2(new Date(t.startAt).getMinutes()) + '</b>' + (t.startAt > now ? dur(t.startAt - now) + ' qoldi' : 'boshlanmoqda') : '<b>Ro‘yxat</b>ochiq';
    else { var top = ps.filter(function (p) { return p.games > 0 || p.score > 0; })[0] || ps[0]; w = '<b>' + (top ? '🥇 ' + esc(String(top.name || '').replace(/^🤖\s*/, '').slice(0, 14)) : 'Tugadi') + '</b>' + (t.endAt ? dayLbl(t.endAt) + f2(new Date(t.endAt).getHours()) + ':' + f2(new Date(t.endAt).getMinutes()) : 'tugadi'); }
    var spk = t.mix ? 'k-mx' : t.type === 'arena' ? (sp[1] === 'Giper' ? 'k-gp' : sp[1] === 'Bullet' ? 'k-bl' : sp[1] === 'Blits' ? 'k-bz' : sp[1] === 'Tezkor' ? 'k-rp' : 'k-kl') : 'k-tr';
    var scl = t.status === 'running' ? ' s-run' : t.status === 'finished' ? ' s-fin' : '';
    var ch = '';
    if (t.tc && t.tc !== '∞' && !t.mix) ch += '<span class="c">⏱ ' + esc(tcTxt(t.tc)) + (sp[1] ? ' · ' + sp[1] : '') + '</span>';
    if (kind) ch += '<span class="c">' + kind + '</span>';
    ch += empty ? '<span class="c y">Bo‘sh — qo‘shiling!</span>' : '<span class="c">👥 ' + hum + (bots ? ' · 🤖 ' + bots : '') + '</span>';
    if ((t.clubIds || []).length) ch += '<span class="c">🛡 ' + ((t.clubIds || []).length > 1 ? 'klublar jangi' : 'klub') + '</span>';
    if (t.prize) ch += '<span class="c p">🏆 ' + t.prize + '</span>';
    if (inn) ch += '<span class="c y">✓ siz</span>';
    var dt = function (ts) { var d = new Date(ts); return f2(d.getDate()) + '.' + f2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + f2(d.getHours()) + ':' + f2(d.getMinutes()); };
    var top0 = ps.filter(function (p) { return p.games > 0 || p.score > 0; })[0] || ps[0];
    var bcl = t.status === 'running' ? 'b-run' : t.status === 'finished' ? 'b-fin' : 'b-reg';
    var btx = t.status === 'running' ? 'O‘ynalmoqda' : t.status === 'finished' ? 'Tugagan' : 'Faol';
    var sbt = sbarTxt(t, now, top0);
    var R = function (ic, tx) { return '<div class="rw"><i>' + ic + '</i><span>' + tx + '</span></div>'; };
    // 👥 ishtirokchilar yuzi: 5 ta avatar + «+N», keyin soni
    var avRow = (function () {
      var L = ps.filter(function (p) { return !p.withdrawn && !p.bot; });
      if (!L.length) return '<div class="rw tlAv empty">Hali hech kim qo‘shilmagan — birinchi bo‘ling</div>';
      var a = L.slice(0, 5).map(function (p) {
        var cl = avCls(p.uid), ch = ini(p.name);
        return /^\d+$/.test(String(p.uid))
          ? '<i class="' + cl + '"><img src="/api/av/' + encodeURIComponent(p.uid) + '" alt="" onerror="this.parentNode.textContent=\'' + ch + '\'"></i>'
          : '<i class="' + cl + '">' + ch + '</i>';
      }).join('') + (L.length > 5 ? '<i class="mo">+' + (L.length - 5) + '</i>' : '');
      return '<div class="rw tlAv"><span class="av">' + a + '</span><span class="tx"><b>' + hum + '</b> ishtirokchi' + (bots ? ' · 🤖 ' + bots : '') + '</span></div>';
    })();
    var fmtTx = (t.pos === 'idf' ? 'IDF 780' : 'Standart') + (t.tc && t.tc !== '∞' && !t.mix ? ' · ' + esc(tcTxt(t.tc)) + (sp[1] ? ' ' + sp[1] : '') : '') + (kind ? ' · ' + kind : '');
    var feat = '';
    if (t.type === 'arena') feat += '<span class="c">' + (t.berserk === false ? '⚡ Berserk yo‘q' : '⚡ Berserk') + '</span>';
    feat += '<span class="c">' + (t.rated === false ? '🤝 Reytingsiz' : '⭐ Reytingli') + '</span>';
    if (t.status !== 'finished') feat += '<span class="c tk' + (TK.left > 0 ? ' on' : '') + '" data-tk="1">' + tkTxt() + '</span>';
    if ((t.clubIds || []).length) feat += '<span class="c">🛡 ' + ((t.clubIds || []).length > 1 ? 'klublar jangi' : 'klub') + '</span>';
    var cta = t.status === 'finished' ? 'Natijalar' : inn ? 'Turnirga kirish' : 'Qatnashaman';
    var P = sbarParts(t, now, top0);
    var pz = t.prize ? '<span class="pz"><b>' + fmtN(t.prize) + '</b><small>MUKOFOT</small></span>' : '<span class="bdg ' + bcl + '">' + btx + '</span>';
    return '<div class="r' + (inn ? ' me' : '') + scl + '" data-tid="' + esc(t.id) + '">' +
      '<div class="hd"><span class="i ' + spk + '">' + (t.mix ? '🔀' : t.type === 'arena' ? sp[0] : '🏆') + '</span>' +
      '<span class="t2"><b class="nm">' + esc(name) + '</b><small>' + fmtTx + '</small></span>' + pz + '</div>' +
      '<div class="sbar ' + bcl + '"><span class="lbl">' + P.lbl + '</span><span class="val">' + P.val + '</span><span class="when">' + P.when + '</span></div>' +
      '<div class="pbar ' + bcl + '"><i style="width:' + pct(t, now) + '%"></i></div>' +
      '<div class="ft">' + feat + '</div>' + (t.status === 'running' ? podium(t) : '') + avRow + myLine(t, u) + spRow(t) +
      (t.creatorName ? '<div class="crl">Tashkilotchi: <b>' + esc(t.creatorName) + '</b>' + (t.prize ? ' · ' + (t.places || 3) + ' o‘ringa' : '') + '</div>' : '') +
      '<div class="btns"><button type="button" class="shr" data-share="' + esc(t.id) + '" title="Ulashish">🔗</button>' + (t.status === 'reg' && t.startAt > Date.now() && !inn ? '<button type="button" class="shr bel" data-bell="' + esc(t.id) + '" data-x="' + ((function () { try { return localStorage.getItem('tBell_' + t.id) === '1'; } catch (x) { return false; } })() ? ' on" data-on="1">🔔✓' : '">🔔') + '</button>' : '') + (t.status === 'running' ? '<button type="button">👁 Kuzatish</button>' : '') +
      (t.status !== 'finished' ? '<button type="button" class="shr" data-spn="' + esc(t.id) + '" title="Homiy bo‘lish">💰</button>' : '') +
      ((t.status !== 'finished' && (String(t.creatorUid) === String(u) || window.__isAdmin)) ? '<button type="button" class="shr" data-act="' + esc(t.id) + '" title="Amallar">⋯</button>' : '') + '<button type="button" class="cta">' + cta + '</button></div></div>';
  }
  function render() {
    var bx = g('lbT'); if (!bx) return;
    if (!bx.classList.contains('tlOn')) bx.classList.add('tlOn');
    var inT = false; try { var lp = g('lbPanel'); inT = !!(lp && lp.classList.contains('lbTMode') && lp.style.display !== 'none'); } catch (e) {}
    document.body.classList.toggle('tlOnB', inT);
    var hd = g('tlHead');
    if (!hd) {
      hd = document.createElement('div'); hd.id = 'tlHead';
      hd.innerHTML = '<b>🏆 Turnirlar</b><button type="button" class="add" id="tlAdd">➕ Yaratish</button>';
      bx.insertBefore(hd, bx.firstChild);
      var tb = document.createElement('div'); tb.id = 'tlTabs'; tb.innerHTML = '<button type="button" data-tb="live" class="on">Jonli</button><button type="button" data-tb="fin">Tugaganlar</button><button type="button" data-tb="club">👥 Klublar</button>';
      var ls = document.createElement('div'); ls.id = 'tlList';
      var form = g('lbTform'); if (form && form.parentNode === bx) { bx.insertBefore(ls, form.nextSibling); bx.insertBefore(tb, ls); } else { bx.insertBefore(ls, hd.nextSibling); bx.insertBefore(tb, ls); }
      g('tlAdd').onclick = function () { if (window.lbTPlus) window.lbTPlus(); try { enhanceForm(); } catch (e) {} var f = g('lbTform'); if (f && f.style.display !== 'none') setTimeout(function () { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
      tb.onclick = function (e) { var b = e.target.closest('[data-tb]'); if (!b) return; tab = b.getAttribute('data-tb'); [].forEach.call(tb.children, function (x) { x.classList.toggle('on', x === b); }); sig = ''; render(); };
      tb.__set = function (k) { tab = k; [].forEach.call(tb.children, function (x) { x.classList.toggle('on', x.getAttribute('data-tb') === k); }); };
      ls.onclick = function (e) {
        var spb = e.target.closest('[data-spn]'); if (spb) { e.preventDefault(); sponsor(spb.getAttribute('data-spn')); return; }
        var acb = e.target.closest('[data-act]'); if (acb) { e.preventDefault(); actions(acb.getAttribute('data-act')); return; }
        var tkc = e.target.closest('[data-tk]'); if (tkc) { e.preventDefault(); tkBuy(); return; } var bl = e.target.closest('[data-bell]'); if (bl) { var bid = bl.getAttribute('data-bell'), k = 'tBell_' + bid, on = true; try { on = localStorage.getItem(k) !== '1'; if (on) localStorage.setItem(k, '1'); else localStorage.removeItem(k); } catch (x) {} bl.classList.toggle('on', on); bl.textContent = on ? '🔔✓' : '🔔'; if (window.lbSend) window.lbSend({ type: 'lbTNotify', tid: bid, on: on }); return; } var sh = e.target.closest('[data-share]'); if (sh) { var rr = sh.closest('[data-tid]'); var tid = sh.getAttribute('data-share'); var nm = ((rr && rr.querySelector('.nm')) || {}).textContent || 'Turnir'; var sb = ((rr && rr.querySelector('.sbar')) || {}).textContent || ''; var base = window.TG_APP_LINK || 'https://t.me/DraughtsPRObot/play'; var _tw = window.Telegram && window.Telegram.WebApp, _uid = _tw && _tw.initDataUnsafe && _tw.initDataUnsafe.user && _tw.initDataUnsafe.user.id; var url = base + '?startapp=lbt_' + encodeURIComponent(tid) + (_uid ? '_r' + _uid : ''); var txt = '🏆 ' + nm + '\n' + sb.replace('⏳', '').trim() + '\nShashkaPRO turniriga qo‘shiling!'; var su = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(txt); try { var tgw = window.Telegram && window.Telegram.WebApp; if (tgw && tgw.openTelegramLink) tgw.openTelegramLink(su); else window.open(su, '_blank'); } catch (x) { window.open(su, '_blank'); } return; } var r = e.target.closest('[data-tid]'); if (!r) return; var id = r.getAttribute('data-tid'); if (window.tvOpen) window.tvOpen(id); };
    }
    // 👥 Klublar tabi: mavjud klublar paneli (#lbClubs) shu yerga ko'chadi; boshqa tablarda yashirin
    var club = tab === 'club', cl = g('lbClubs'), lsE = g('tlList'), tbE = g('tlTabs');
    bx.classList.toggle('tlClub', club);
    if (club && cl && lsE && cl.previousSibling !== tbE) bx.insertBefore(cl, lsE);
    if (window.__lbCO !== club) { window.__lbCO = club; try { if (window.lbClubFix) window.lbClubFix(); } catch (e) {} }
    if (club) { lsE.innerHTML = ''; sig = ''; return; }
    var s = St(), T = (s && s.tournaments) || [], u = me(), now = Date.now();
    try { annCheck(T, u); } catch (e) {}
    var key = JSON.stringify([tab, u, Math.floor(now / 30000), T.map(function (t) { return [t.id, t.status, t.ending, t.startAt, t.endAt, (t.players || []).length, t.round, t.name, t.prize, (t.players || []).some(function (p) { return String(p.uid) === u && !p.withdrawn; })]; })]);
    if (key === sig) return; sig = key;
    var h = '';
    if (tab === 'live') {
      var run = T.filter(function (t) { return t.status === 'running'; }).sort(function (a, b) { return (a.endAt || 9e15) - (b.endAt || 9e15); });
      var reg = T.filter(function (t) { return t.status === 'reg'; }).sort(function (a, b) { return (a.startAt || 9e15) - (b.startAt || 9e15); });
      if (run.length) h += '<h5>HOZIR O‘YNALMOQDA</h5>' + run.map(function (t) { return rowOf(t, u); }).join('');
      if (reg.length) h += '<h5>TEZ ORADA</h5>' + reg.map(function (t) { return rowOf(t, u); }).join('');
      if (!run.length && !reg.length) h = '<div class="e">Hozircha rejalashtirilgan turnir yo‘q.<br><button type="button" onclick="document.getElementById(\'tlAdd\').click()">➕ Turnir yaratish</button></div>';
    } else {
      var fin = T.filter(function (t) { return t.status === 'finished'; }).sort(function (a, b) { return (b.endAt || b.startAt || 0) - (a.endAt || a.startAt || 0); });
      h = fin.length ? fin.map(function (t) { return rowOf(t, u); }).join('') : '<div class="e">Tugagan turnirlar hali yo‘q.</div>';
    }
    g('tlList').innerHTML = h;
  }
  // ---- ➕ Turnir yaratish formasi: ochiladigan ro'yxatlar o'rniga bosiladigan tugmalar (select'lar joyida qoladi — eski mantiq ishlaydi)
  var LBL = { lbTk: 'Turnir turi', lbTtb: 'Boshlang‘ich vaqt', lbTti: 'Har yurishga qo‘shimcha', lbTdur: 'Davomiyligi', lbTflag: 'Bayroq', lbTr: 'Turlar soni', lbTiv: 'Turlar orasida tanaffus', lbTsin: 'Boshlanishi', lbTp: 'Pozitsiya', lbTmg: 'Ishtirok sharti', lbTrated: 'Reyting', lbTpl: 'Mukofot oladigan o‘rinlar' };
  var SHORT = { lbTmg: function (v) { return +v ? 'Kamida ' + v + ' o‘yin' : '✅ Shartsiz'; }, lbTk: function (v, t) { return v === 'swiss' ? '♟ Shveytsariya' : t; } };
  var fcss = document.createElement('style'); fcss.textContent =
    '#lbTform.tlF{background:linear-gradient(180deg,#2a1f17,#1e1610)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:18px!important;padding:14px!important;box-shadow:0 8px 24px rgba(0,0,0,.35)!important}' +
    '#lbTform.tlF select.tlHid{display:none!important}#lbTform.tlF .row{flex-wrap:wrap;gap:8px}#lbTform.tlF .row>.muted.tlHid{display:none!important}' +
    '#lbTform.tlF #lbTn{height:46px;font-size:16px;border-radius:12px}#lbTform.tlF #lbTCreate{height:46px;border-radius:12px;background:#81b64c!important;color:#fff!important;font-weight:800}' +
    '.tlCh{width:100%;margin:6px 0 2px}.tlCh>small{display:block;font-size:12px;letter-spacing:.5px;color:var(--spMute,#b9ab98);font-weight:700;text-transform:uppercase;margin-bottom:6px}' +
    '.tlCh>div{display:flex;flex-wrap:wrap;gap:6px}.tlCh button{border:1px solid rgba(255,255,255,.14)!important;background:rgba(0,0,0,.3)!important;color:#e2d9cc!important;border-radius:10px!important;padding:9px 12px!important;font-size:14px!important;font-weight:600;min-height:0;box-shadow:none!important}' +
    '.tlCh button.on{background:#81b64c!important;border-color:#81b64c!important;color:#fff!important}';
  document.head.appendChild(fcss);
  function enhanceForm() {
    var f = g('lbTform'); if (!f) return;
    if (!f.classList.contains('tlF')) f.classList.add('tlF');
    Object.keys(LBL).forEach(function (id) {
      var sel = g(id); if (!sel || sel.tagName !== 'SELECT') return;
      var box = sel.__tlCh;
      if (!box) {
        box = document.createElement('div'); box.className = 'tlCh'; box.innerHTML = '<small>' + LBL[id] + '</small><div></div>';
        var fc = g('tlFC'); if (!fc) { fc = document.createElement('div'); fc.id = 'tlFC'; var r0 = f.querySelector('.row'); if (r0) r0.parentNode.insertBefore(fc, r0.nextSibling); else f.insertBefore(fc, f.firstChild); }
        var ks = Object.keys(LBL), nx = null; for (var q = ks.indexOf(id) + 1; q < ks.length && !nx; q++) { var o2 = g(ks[q]); if (o2 && o2.__tlCh && o2.__tlCh.parentNode === fc) nx = o2.__tlCh; }
        fc.insertBefore(box, nx);   // LBL tartibida
        var mu = sel.previousElementSibling; if (mu && mu.classList && mu.classList.contains('muted')) mu.classList.add('tlHid');
        box.lastChild.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; e.preventDefault(); sel.value = b.getAttribute('data-v'); try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {} enhanceForm(); };
        sel.__tlCh = box; sel.classList.add('tlHid');
      }
      sync(sel, box);
    });
  }
  function sync(sel, box) {
    var opts = [].map.call(sel.options, function (o) { return o.value + '\u0001' + o.textContent; }).join('|');
    if (box.__o !== opts) { box.__o = opts; var sh = SHORT[sel.id]; box.lastChild.innerHTML = [].map.call(sel.options, function (o) { return '<button type="button" data-v="' + esc(o.value) + '">' + esc(sh ? sh(o.value, o.textContent) : o.textContent) + '</button>'; }).join(''); }
    [].forEach.call(box.lastChild.children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === sel.value); });
    var hid = sel.style.display === 'none' || (sel.closest('.row') && sel.closest('.row').style.display === 'none') || (sel.closest('#lbSw') && g('lbSw').style.display === 'none');
    box.style.display = hid ? 'none' : '';
  }
  // ⚙️ admin «Bot kuchi» tugmasi faqat Menyu sahifasida (boshqa sahifalarda tugmalar ustida suzib turmasin)
  function gear() { var bp = g('bpBtn'); if (!bp) return; var on = document.querySelector('#nvBar button.on'), m = !!(on && /Menyu|Меню|Menu/i.test(on.textContent || '')); bp.style.setProperty('display', 'none', 'important'); }   // endi Menyu → ADMIN → «Bot kuchi» kartasidan ochiladi
  setInterval(function () { try { render(); enhanceForm(); gear(); } catch (e) {} }, 1000);
  setTimeout(function () { try { render(); } catch (e) {} }, 300);
})();
