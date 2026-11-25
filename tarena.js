/* tarena.js — ⚔️ Arena turniri sahifasi (lidraughts uslubida): jadval + ochko ketma-ketligi + 🔥, sahifalash,
   Qatnashish/Pauza, ma'lumot va shartlar, yetakchi o'yin (jonli doska), TOP o'yinlar, chat, qoidalar.
   Faqat type==='arena' turnirlar uchun window.tvOpen ni egallaydi; qolgan turnirlar eski oynada ochiladi. */
;(function () {
  if (window.__tArena) return; window.__tArena = 1;
  var PER = 10;
  function g(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); }
  function L() { return window.__lb || null; }
  function St() { try { return window.__lb ? window.__lb.S : null; } catch (e) { return null; } }
  function findT(id) { var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function me() { var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function send(m) { var l = L(); if (l && l.send) l.send(m); }
  function fmt(ms) { ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function clk(ms) { if (ms == null) return ''; ms = Math.max(0, ms); var s = Math.ceil(ms / 1000), m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  // 🏳️ viloyat belgisi (SRX…) yoki chet el bayrog'i
  function bdg(k, c, t) { return /^[A-Z]+$/.test(String(k)) ? '<span title="' + esc(t || '') + '" style="display:inline-block;min-width:30px;padding:1px 4px;margin-right:5px;border-radius:5px;background:' + c + ';color:#fff;font-size:10.5px;font-weight:900;letter-spacing:.3px;text-align:center;vertical-align:1px">' + esc(k) + '</span>' : '<span title="' + esc(t || '') + '" style="margin-right:4px">' + esc(k) + '</span>'; }
  function nm(s) { return esc(String(s || '').replace(/^🤖\s*/, '')); }
  function avT(p) {
    var id = String(p && p.uid != null ? p.uid : ''), ch = String((p && p.name) || '?').replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase() || '?';
    if (/^\d+$/.test(id)) return '<span class="taAv"><img src="/api/av/' + encodeURIComponent(id) + '" alt="" onerror="this.outerHTML=\'<i>' + esc(ch) + '</i>\'"></span>';
    return '<span class="taAv"><i>' + esc(ch) + '</i></span>';
  }
  function tcInfo(tc) {
    var a = String(tc || '3+2').split('+'), b = Number(a[0]) || 0, inc = Number(a[1]) || 0, est = b * 60 + inc * 40;
    var sp = est < 30 ? ['⚡', 'Giper'] : est < 180 ? ['🚀', 'Bullet'] : est < 480 ? ['🔥', 'Blits'] : ['⏱', 'Rapid'];
    return { icon: sp[0], name: sp[1], txt: (b > 0 && b < 1 ? Math.round(b * 60) + ' s' : b) + ' + ' + inc };
  }
  // ochko ketma-ketligi: '0'..'9' oddiy, 'A'..'I' (=1..9) va 'o' (=0) — olovdagi o'yin
  function sheetHtml(s) {
    s = String(s || ''); var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), fire = false, v = ch;
      if (ch === 'o') { fire = true; v = '0'; } else if (ch >= 'A' && ch <= 'I') { fire = true; v = String(ch.charCodeAt(0) - 64); }
      out += '<i class="' + (fire ? 'f' : v === '0' ? 'z' : v === '1' ? 'd' : 'w') + '">' + v + '</i>';
    }
    return out;
  }

  var css = '' +
    '#taP{position:fixed;inset:0;z-index:2147483050;display:none;flex-direction:column;background:var(--spBg2,#1b130d);color:#f2ede6;font-family:-apple-system,system-ui,Roboto,"Segoe UI","Noto Sans",Arial,sans-serif;font-variant-numeric:tabular-nums}' +
    '#taP.on{display:flex}' +
    'body.taOn #lbPanel{visibility:hidden!important}' +
    'body.taOn #lbToasts{z-index:2147483100!important}' +   // «yangi o'yin — 3 soniyada o'tasiz» xabari arena ustida ko'rinsin
    '#taP .taTop{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 10px;background:rgba(18,13,9,.84);border-bottom:1px solid rgba(255,255,255,.09)}' +
    '#taP .taBk{border:0;background:rgba(255,255,255,.09);color:#fff;border-radius:12px;width:40px;height:40px;font-size:18px;flex:none}' +
    '#taP .taTt{flex:1;min-width:0}#taP .taTt b{display:block;font-size:18px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#taP .taTt small{display:block;font-size:12px;color:var(--spMute,#b9ab98);margin-top:2px}' +
    '#taP .taCd{font-size:20px;font-weight:800;color:#fff;flex:none}#taP .taCd:not(:empty){background:#5d8a2f;border-radius:10px;padding:5px 10px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.25)}' +
    '#taP .taSc{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 0 calc(env(safe-area-inset-bottom,0px) + 18px)}' +
    '#taP .taBar{display:flex;align-items:center;gap:4px;padding:8px 8px;background:rgba(18,13,9,.84);border-bottom:1px solid rgba(255,255,255,.09);position:sticky;top:0;z-index:2}' +
    '#taP .taBar button.n{border:0;background:transparent;color:#d6ccbd;font-size:17px;padding:6px 7px;border-radius:8px;flex:none}#taP .taBar button.n:disabled{opacity:.3}' +
    '#taP .taPg{font-size:14px;color:#d6ccbd;min-width:0;flex:1;text-align:center;white-space:nowrap}' +
    '#taP .taJ{margin-left:auto;flex:none;white-space:nowrap;border:0;border-radius:10px;padding:9px 12px;font-weight:800;font-size:14px;letter-spacing:.3px;color:#fff;background:#81b64c;box-shadow:0 3px 0 #5a8a2e}' +
    '#taP .taJ.p{background:#3a2e24;box-shadow:0 3px 0 #1f1812}#taP .taJ.s{background:#d97706;box-shadow:0 3px 0 #92400e}#taP .taJ.d{background:#c93b3b;box-shadow:0 3px 0 #7f1d1d}' +
    '#taP #taMenu{flex-direction:column;gap:8px;padding:10px 12px;background:rgba(18,13,9,.84);border-bottom:1px solid rgba(255,255,255,.09)}' +
    '#taP #taJw.taJwIn{display:flex;gap:6px;margin-left:auto;flex:none;align-items:center}#taP #taJw .taJ{margin-left:0;flex:none;padding:7px 11px;font-size:13px;white-space:nowrap;text-align:center}' +
    '#taP #taMenu[style*="flex"]{display:flex!important}#taP #taMenu .taJ{margin-left:0;width:100%;text-align:left}' +
    '#taP #taRows{margin:10px 10px 0;border-radius:14px;overflow:hidden;background:var(--spCard,rgba(30,22,16,.8));border:1px solid var(--spLine,rgba(255,255,255,.08))}#taP .taTh{display:grid;grid-template-columns:30px minmax(0,1fr) auto 48px;gap:6px;padding:8px 10px;font-size:11px;letter-spacing:1px;font-weight:800;color:var(--spMute2,#a89886);text-transform:uppercase;background:rgba(0,0,0,.2);border-bottom:1px solid rgba(255,255,255,.08)}#taP .taTh span:first-child{text-align:center}#taP .taTh span:last-child{text-align:right}#taP .taRow{display:grid;grid-template-columns:30px 28px minmax(0,1fr) auto 48px;align-items:center;gap:6px;padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.06)}#taP .taRow:last-child{border-bottom:0}#taP .taRk.m1,#taP .taRk.m2,#taP .taRk.m3{width:24px;height:24px;line-height:24px;border-radius:50%;color:#2b1d0e;font-weight:900;margin:0 auto}#taP .taRk.m1{background:linear-gradient(145deg,#fde68a,#d4a017)}#taP .taRk.m2{background:linear-gradient(145deg,#f1f5f9,#94a3b8)}#taP .taRk.m3{background:linear-gradient(145deg,#f3c39a,#b06a35)}#taP .taRow.np{opacity:.55}#taP .taNm small .np{margin-left:4px}#taP .taRow.pz .taNm b,#taP .taRow.pz .taAv{opacity:.7}#taP .taNm small .pzL{margin-left:6px;color:#e9c46a}#taP .taWt{margin:10px 10px 0;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);font-size:13.5px;line-height:1.45;color:#e2d9cc}#taP .taWt b{color:#fff}' +
    '#taP .taRow:nth-child(even){background:rgba(255,255,255,.025)}#taP .taRow.me{background:rgba(129,182,76,.14);box-shadow:inset 3px 0 0 #81b64c}' +
    '#taP .taRk{font-size:14px;color:var(--spMute,#b9ab98);text-align:center}#taP .taRk.ps{color:#9c8f80;font-weight:800;letter-spacing:-1px}' +
    '#taP .taAv{width:28px;height:28px;border-radius:50%;overflow:hidden;flex:none;display:inline-flex;align-items:center;justify-content:center;background:#4a3b2e;color:#fff;font-weight:800;font-size:13px;margin:0 8px 0 2px}#taP .taAv img{width:100%;height:100%;object-fit:cover;display:block}#taP .taAv i{font-style:normal}' +
    '#taP .taNm{min-width:0}#taP .taNm b{display:block;font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#taP .taNm small{font-size:12px;color:var(--spMute,#b9ab98)}#taP .taNm small .u{color:#6cc04a}#taP .taNm small .dn{color:#e5534b}#taP .taNm small .pl{color:#5fb3ff;margin-left:4px}' +
    '#taP .taSh{max-width:44vw;overflow:hidden;white-space:nowrap;direction:rtl;text-align:left;font-size:15px;letter-spacing:1px}' +
    '#taP .taSh span{direction:ltr;unicode-bidi:bidi-override}#taP .taSh i{font-style:normal}#taP .taSh i.w{color:#9fd36f}#taP .taSh i.d{color:#e2d9cc}#taP .taSh i.z{color:#7d6f60}#taP .taSh i.f{color:#ff9b2f;font-weight:800}' +
    '#taP .taPt{text-align:right;font-weight:800;font-size:16px}#taP .taPt.f{color:#ff9b2f}' +
    '#taP .taEm{padding:22px 14px;text-align:center;color:var(--spMute,#b9ab98)}' +
    '#taP .taCard{margin:12px 10px 0;background:rgba(18,13,9,.84);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:12px 14px}' +
    '#taP .taCard h4{margin:0 0 8px;font-size:13px;letter-spacing:.6px;color:var(--spMute,#b9ab98);font-weight:700;text-transform:uppercase}' +
    '#taP .taInf{display:flex;gap:12px;align-items:center}#taP .taInf .ic{font-size:30px}#taP .taInf div{font-size:15px;line-height:1.45}' +
    '#taP .taLn{display:block;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.09);font-size:14px;line-height:1.5}' +
    '#taP .taLn.bad{color:#f87171}#taP .taLn.ok{color:#86efac}' +
    '#taP .taPod{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:14px 10px 4px}' +
    '#taP .taPod div{flex:1;max-width:120px;text-align:center;border-radius:12px 12px 4px 4px;padding:10px 6px;background:rgba(30,22,16,.85)}' +
    '#taP .taPod div b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#taP .taPod div em{font-style:normal;font-size:26px;display:block}#taP .taPod div small{color:#f5b72b;font-weight:800}' +
    '#taP .taPod .p1{padding-top:22px;background:linear-gradient(180deg,#8a6a12,rgba(30,22,16,.85))}' +
    '#taP .taFt{display:grid;grid-template-columns:repeat(8,1fr);width:100%;max-width:360px;margin:6px auto;border:4px solid #7a4016;border-radius:4px;box-sizing:border-box}' +
    '#taP .taFt i{aspect-ratio:1;display:flex;align-items:center;justify-content:center}#taP .taFt i.l{background:#f3bb86}#taP .taFt i.d{background:#7b2f13}' +
    '#taP .taFt u{display:block;width:80%;height:80%;border-radius:50%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.35),0 1px 2px #0008;position:relative}' +
    '#taP .taFt u.w{background:#efefeb}#taP .taFt u.b{background:#232327}#taP .taFt u.k::after{content:"K";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:70%;color:#f5b72b}' +
    '#taP .taFp{display:flex;justify-content:space-between;align-items:center;font-size:14px;max-width:360px;margin:0 auto}' +
    '#taP .taFp b{font-weight:600}#taP .taFp small{color:var(--spMute,#b9ab98)}#taP .taFp .c{background:rgba(0,0,0,.35);border-radius:6px;padding:2px 8px;font-weight:700}' +
    '#taP .taW{display:block;width:100%;max-width:360px;margin:10px auto 0;border:0;border-radius:10px;padding:10px;background:rgba(255,255,255,.1);color:#fff;font-weight:700;font-size:14px}' +
    '#taP .taTg{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.09)}' +
    '#taP .taTg:last-child{border-bottom:0}#taP .taTg div{font-size:14px;line-height:1.5;min-width:0}#taP .taTg div span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#taP .taTg small{color:var(--spMute,#b9ab98)}#taP .taTg .rk{display:inline-block;background:rgba(255,255,255,.09);border-radius:5px;padding:0 5px;font-size:12px;margin-right:4px;color:#d6ccbd}' +
    '#taP .taTg button{border:0;border-radius:9px;background:rgba(255,255,255,.1);color:#fff;padding:8px 10px;font-size:13px}' +
    '#taP .cHd{display:flex;align-items:center;justify-content:space-between}#taP .cSw{position:relative;display:inline-block;width:44px;height:24px;margin:0;flex:none}#taP .cSw input{opacity:0;width:0;height:0;position:absolute}#taP .cSw i{position:absolute;inset:0;background:rgba(255,255,255,.14);border-radius:999px;transition:.2s}#taP .cSw i:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}#taP .cSw input:checked+i{background:#81b64c}#taP .cSw input:checked+i:before{transform:translateX(20px)}#taP .cFt{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.09);color:#9c8f80;font-size:12px}#taP .cX{float:right;border:0;border-radius:8px;background:rgba(255,255,255,.09);color:#d6ccbd;font-size:12px;padding:4px 9px;font-weight:700}#taP .cm{display:flex;gap:8px;margin:0 0 10px;align-items:flex-start}#taP .cm .taAv{margin:0;width:30px;height:30px;font-size:14px}#taP .cb{min-width:0;flex:1}#taP .cb>b{font-size:13px;color:#e9c46a}#taP .cm.me .cb>b{color:#f5b72b}#taP .cq{border-left:3px solid #81b64c;padding:2px 8px;margin:3px 0;font-size:12px;color:#cdbfae;background:rgba(255,255,255,.06);border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#taP .ct{font-size:14px;line-height:1.4;word-break:break-word;color:#f2f2f7}#taP .cA{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}#taP .cA button{border:0;background:transparent;color:#b9ab98;font-size:12px;padding:3px 6px;border-radius:6px}#taP .cA button.on{color:#f5b72b;font-weight:700}#taP .cA button[data-act=del],#taP .cA button[data-act=blk]{color:#f08a80}#taP .cRp{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border-radius:8px;padding:6px 10px;font-size:12px;color:#d6ccbd;margin:6px 0}#taP .cRp span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#taP .cRp button{border:0;background:transparent;color:#d6ccbd;font-size:16px}#taP .ce{color:var(--spMute,#b9ab98);margin:0}#taP .taCard.cols .taCh,#taP .taCard.cols .taCi,#taP .taCard.cols #taRp{display:none}#taP .taCard.cols #taChX{}#taP .taCh{max-height:340px;overflow-y:auto;font-size:14px;line-height:1.45}#taP .taCh p{margin:0 0 5px}#taP .taCh p b{color:#e9c46a;margin-right:5px}#taP .taCh p.me b{color:#f5b72b}' +
    '#taP .taCi{display:flex;gap:6px;margin-top:8px}#taP .taCi input{flex:1;min-width:0;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.3);color:#fff;border-radius:10px;padding:10px;font-size:15px}' +
    '#taP .taCi button{border:0;border-radius:10px;background:#81b64c;color:#fff;padding:0 14px;font-size:16px}' +
    '#taP .taRl{font-size:14px;line-height:1.55;color:#e2d9cc}#taP .taRl p{margin:0 0 7px}#taP details summary{cursor:pointer;font-weight:700;color:#d6ccbd;list-style:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var P = null, cur = null, page = -1, timer = null, sigMain = '', sigChat = '', sigFeat = '';
  var RULES = '<p>⏱ Arena belgilangan vaqt davom etadi. O‘yiningiz tugashi bilan sizga darhol yangi raqib topiladi — o‘rni yaqin o‘yinchilar bir-biriga tushadi.</p>' +
    '<p>🏅 G‘alaba — <b>2</b>, durang — <b>1</b>, mag‘lubiyat — <b>0</b> ochko.</p>' +
    '<p>🔥 Ketma-ket 2 g‘alabadan keyin olov yonadi: keyingi o‘yinlarda ochko ikki barobar (g‘alaba 4, durang 2). Durang yoki mag‘lubiyat olovni o‘chiradi.</p>' +
    '<p>⚡ Berserk: o‘yin boshida soatingizning yarmini bersangiz, g‘alaba uchun +1 ochko (kamida 7 yurishdan keyin).</p>' +
    '<p>🤝 10 yurishdan oldingi durangga ochko berilmaydi.</p>' +
    '<p>⚖️ Ochko teng bo‘lsa, turnirdagi samaradorligi (raqiblar reytingi va natijalar) yuqori o‘yinchi oldinda.</p>' +
    '<p>⏸ Pauza bossangiz juftlanmaysiz, ochkolaringiz saqlanadi. «Qatnashish» bilan qaytasiz. 30 soniyada o‘yinga kirmasangiz — mag‘lubiyat va pauza.</p>' +
    '<p>🏁 Vaqt tugaganda ketayotgan o‘yinlar oxirigacha o‘ynaladi va hisoblanadi.</p>';

  function build() {
    if (P) return;
    P = document.createElement('div'); P.id = 'taP';
    P.innerHTML = '<div class="taTop"><button class="taBk" id="taBk">←</button><div class="taTt"><b id="taNm"></b><small id="taSub"></small></div><div class="taCd" id="taCd"></div></div>' +
      '<div class="taSc" id="taSc"><div id="taPod"></div><div id="taClubs"></div>' +
      '<div class="taBar"><button class="n" data-a="me" title="Meni top">🔍</button><button class="n" data-a="first">⏮</button><button class="n" data-a="prev">◀</button><span class="taPg" id="taPg"></span><button class="n" data-a="next">▶</button><button class="n" data-a="last">⏭</button><span id="taJw" class="taJwIn"></span></div><div id="taMenu" style="display:none"></div>' +
      '<div id="taWt"></div><div id="taRows"></div>' +
      '<div class="taCard" id="taInfo"></div>' +
      '<div class="taCard"><details><summary>ℹ️ Arena qoidalari</summary><div class="taRl" style="margin-top:10px">' + RULES + '</div></details></div>' +
      '<div class="taCard" id="taFeatC" style="display:none"><h4>📺 Yetakchi o‘yin</h4><div id="taFeat"></div></div>' +
      '<div class="taCard" id="taTopC" style="display:none"><h4>⭐ TOP o‘yinlar</h4><div id="taTop"></div></div>' +
      '<div class="taCard" id="taChC"><h4 class="cHd">💬 Chat <span id="taChN"></span><label class="cSw" title="Chatni yoqish/o‘chirish"><input type="checkbox" id="taChX" checked><i></i></label></h4><div class="taCh" id="taCh"></div><div id="taRp" class="cRp" style="display:none"></div><div class="taCi"><input id="taTx" maxlength="200" placeholder="Xabar yozing…"><button id="taSd">➤</button></div><div class="cFt">Chatda odob saqlang!</div></div>' +
      '</div>';
    document.body.appendChild(P);
    g('taBk').onclick = close;
    g('taSd').onclick = chat;
    g('taChX').onchange = function () { g('taChC').classList.toggle('cols', !this.checked); };
    g('taCh').onclick = function (e) {
      var b = e.target.closest ? e.target.closest('button[data-act]') : null; if (!b || !cur) return;
      var a = b.getAttribute('data-act'), mid = b.getAttribute('data-mid'), uid = b.getAttribute('data-uid');
      if (a === 'reply') { var mm = ((window.__taLastT || {}).chat || []).find(function (x) { return x.id === mid; }); if (mm) { chReply = { id: mm.id, name: mm.name, text: mm.text }; renderReply(); g('taTx').focus(); } }
      else if (a === 'like') send({ type: 'lbTChatLike', tid: cur, mid: mid, k: 'l' });
      else if (a === 'rep') send({ type: 'lbTChatReport', tid: cur, mid: mid, reason: 'insult' });
      else if (a === 'del') send({ type: 'lbTChatDel', tid: cur, mid: mid });
      else if (a === 'blk') send({ type: 'lbTChatBlock', tid: cur, uid: uid });
    };
    g('taRp').onclick = function (e) { if (e.target.tagName === 'BUTTON') { chReply = null; renderReply(); } };
    g('taTx').onkeydown = function (e) { if (e.key === 'Enter') chat(); };
    P.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b || !cur) return;
      var a = b.getAttribute('data-a'), t = findT(cur); if (!t) return;
      if (a === 'menu') { var mm = g('taMenu'); mm.style.display = mm.style.display === 'flex' ? 'none' : 'flex'; return; }
      var n = Math.max(1, Math.ceil((t.players || []).length / PER));
      if (a === 'first') page = 0; else if (a === 'prev') page = Math.max(0, page - 1); else if (a === 'next') page = Math.min(n - 1, page + 1); else if (a === 'last') page = n - 1;
      else if (a === 'me') { var i = myIdx(t); if (i >= 0) page = Math.floor(i / PER); }
      else if (a === 'join') {
        if (t.flag) {   // 🏳️ bayroqli: viloyat tanlanmagan bo'lsa — avval tanlash
          var tg0 = window.Telegram && Telegram.WebApp, idt = (tg0 && tg0.initData) || '', tid0 = cur;
          fetch('/api/region', { headers: { 'x-init-data': idt } }).then(function (r) { return r.json(); }).then(function (v) {
            if (v && v.my) return send({ type: 'lbTJoin', tid: tid0 });
            var go = function () { window.regOpen(true); };
            if (window.regOpen) go(); else { var sc = document.createElement('script'); sc.src = '/regionpanel.js?v=' + Date.now(); sc.onload = go; document.head.appendChild(sc); }
            alert('🏳️ Bu bayroqli turnir — avval viloyatingizni tanlang, keyin «Qatnashish»ni yana bosing.');
          }).catch(function () { send({ type: 'lbTJoin', tid: tid0 }); });
        } else send({ type: 'lbTJoin', tid: cur });
      }
      else if (a === 'pause') { send({ type: 'lbTLeave', tid: cur }); }
      else if (a === 'invite') { send({ type: 'lbTInvite', tid: cur }); }
      else if (a === 'ann') { send({ type: 'lbTAnnList', tid: cur }); }
      else if (a === 'cancel') { if (confirm('Turnir o‘chirilsinmi? E’lon kanal va guruhlardan ham o‘chiriladi.')) send({ type: 'lbTCancel', tid: cur }); }
      else if (a === 'leave') { if (confirm('Arenadan chiqasizmi?')) send({ type: 'lbTLeave', tid: cur }); }
      else if (a === 'start') { send({ type: 'lbTStart', tid: cur }); }
      else if (a === 'bbw') { pinR = b.getAttribute('data-room'); sigMain = ''; render(); askPeek(); var fc = g('taFeatC'); if (fc) fc.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      else if (a === 'watch') { var r = b.getAttribute('data-room'), l = L(); close(); if (l && l.go) l.go(r); return; }
      sigMain = ''; render();
    });
  }
  // 📣 admin: e'lon joyini tanlash oynasi (guruh/kanal, belgilanganlar yuboriladi)
  function annEsc(v) { return String(v).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  window.__taShowAnn = function (m) {
    var old = document.getElementById('taAnnOv'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'taAnnOv';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483000;display:flex;align-items:flex-end;justify-content:center';
    var rows = (m.list || []).map(function (x) {
      return '<label style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #0001"><input type="checkbox" data-id="' + annEsc(x.id) + '"' + (x.sent ? ' disabled' : '') + '><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + annEsc(x.title) + '</span>' + (x.sent ? '<small>yuborilgan</small>' : '') + '</label>';
    }).join('') || '<div>Guruhlar topilmadi. Bot guruhda admin bo‘lsin.</div>';
    ov.innerHTML = '<div style="background:rgba(18,13,9,.92);color:#f2f2f7;width:100%;max-width:460px;border-radius:16px 16px 0 0;padding:16px 16px calc(96px + env(safe-area-inset-bottom,0px));box-sizing:border-box;max-height:80vh;display:flex;flex-direction:column;gap:10px"><b style="font-size:16px">E’lonni qayerga yuborish?</b><div style="flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;color:#f2f2f7">' + rows + '</div><div style="display:flex;gap:8px;flex:none"><button id="taAnnGo" class="taJ s" style="flex:1;min-height:44px">Yuborish</button><button id="taAnnNo" class="taJ" style="flex:1;min-height:44px">Yopish</button></div></div>';
    ov.querySelectorAll('label').forEach(function (l) { l.style.color = '#f2f2f7'; l.style.borderBottom = '1px solid rgba(255,255,255,.12)'; });
    ov.querySelectorAll('small').forEach(function (s) { s.style.color = '#9fd8ad'; });
    document.body.appendChild(ov);
    ov.onclick = function (ev) { if (ev.target === ov || ev.target.id === 'taAnnNo') ov.remove(); };
    document.getElementById('taAnnGo').onclick = function () {
      var ids = [].slice.call(ov.querySelectorAll('input[data-id]:checked')).map(function (i) { return i.getAttribute('data-id'); });
      if (!ids.length) return;
      send({ type: 'lbTAnnSend', tid: m.tid, ids: ids }); ov.remove();
    };
  };
  if (!window.__taAnnL) { window.__taAnnL = 1; window.addEventListener('lbTAnnList', function (e) { if (window.__taShowAnn) window.__taShowAnn(e.detail); }); }
  var chReply = null;
  function renderReply() { var r = g('taRp'); if (!r) return; if (!chReply) { r.style.display = 'none'; r.innerHTML = ''; return; } r.style.display = 'flex'; r.innerHTML = '<span>Javob: ' + nm(chReply.name) + ' — ' + esc(chReply.text) + '</span><button>×</button>'; }
  function chat() { var v = g('taTx').value.trim(); if (!v || !cur) return; var o = { type: 'lbTChat', tid: cur, text: v }; if (chReply) o.re = chReply.id; send(o); g('taTx').value = ''; chReply = null; renderReply(); }
  function plist(t) { var ps = t.players || []; if (t.status !== 'finished') return ps; return ps.filter(function (p) { return p.games > 0; }).concat(ps.filter(function (p) { return !(p.games > 0); })); }   // tugaganda: o‘ynaganlar oldin, o‘ynamaganlar o‘rinsiz
  function myIdx(t) { var u = me(), ps = plist(t); for (var i = 0; i < ps.length; i++) if (String(ps[i].uid) === u) return i; return -1; }

  function render() {
    if (!P || !cur) return;
    var t = findT(cur), now = Date.now();
    if (!t) { g('taSub').textContent = 'Turnir topilmadi yoki bekor qilingan'; return; }
    g('taNm').textContent = '🏆 ' + t.name;
    var cd = '', sub = '';
    if (t.status === 'reg') { cd = t.startAt ? fmt(t.startAt - now) : ''; sub = t.startAt ? 'Boshlanishiga' : 'Ro‘yxat ochiq'; }
    else if (t.status === 'running') { if (t.ending) { sub = '⌛ Yakunlanmoqda — natija 1 daqiqagacha e‘lon qilinadi'; } else { cd = fmt(t.endAt - now); sub = 'Tugashiga'; } }
    else sub = '🏁 Arena tugadi';
    g('taCd').textContent = cd; g('taSub').textContent = sub + ' · ' + (t.players || []).length + ' o‘yinchi';
    var sig = JSON.stringify([t.status, t.ending, t.players, t.boards, page, me(), t.minGames, t.prize, t.clubs, t.awards, t.pay, !!(t.endAt && t.endAt - now < 60000)]);
    if (sig !== sigMain) { sigMain = sig; renderMain(t); }
    var cs = JSON.stringify(t.chat || []); if (cs !== sigChat) { sigChat = cs; renderChat(t); }
  }

  function renderMain(t) {
    var ps = plist(t), fin = t.status === 'finished', u = me(), mi = myIdx(t), mp = mi >= 0 ? ps[mi] : null, n = Math.max(1, Math.ceil(ps.length / PER));
    if (page < 0) page = mi >= 0 ? Math.floor(mi / PER) : 0;
    if (page > n - 1) page = n - 1;
    // podium
    var pod = '';
    if (t.status === 'finished') {
      var top = ps.filter(function (p) { return p.games > 0; }).slice(0, 3);
      if (top.length) {
        var ord = [1, 0, 2], md = ['🥇', '🥈', '🥉'];
        pod = '<div class="taPod">' + ord.map(function (i) { var p = top[i]; if (!p) return '<span style="flex:1;max-width:120px"></span>'; return '<div class="p' + (i + 1) + '"><em>' + md[i] + '</em><b>' + nm(p.name) + '</b><small>' + p.score + ' ochko</small></div>'; }).join('') + '</div>';
      }
    }
    g('taPod').innerHTML = pod;
    // 👥 klublar jangi (lichess Team Battle kabi): har klubning eng yaxshi 5 o'yinchisi ochkolari yig'indisi
    var cl = t.clubs || [], ch = '';
    if (cl.length) {
      var md2 = fin ? ['🥇', '🥈', '🥉'] : [];   // medal faqat turnir tugaganda
      var fmtN3 = function (n) { return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
      ch = '<div class="taCard" style="margin-top:10px"><h4>👥 Klublar jangi · eng yaxshi 5 o‘yinchi</h4>' + cl.map(function (c, i) {
        return '<div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,.09);font-size:14px">' +
          '<div style="display:flex;align-items:center;gap:8px"><span style="width:26px;text-align:center">' + (md2[i] || (i + 1)) + '</span>' +
          '<b style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + nm(c.name) + '</b>' +
          '<small style="opacity:.6;min-width:60px;text-align:center">' + (c.players || 0) + ' kishi</small>' +
          '<b style="min-width:42px;text-align:right;color:#f5b72b;font-size:15px">' + (c.score || 0) + '</b></div>' +
          (c.rsum ? '<div style="margin:3px 0 0 34px;font-size:12.5px;color:var(--spMute,#b9ab98)">⚔ ' + fmtN3(c.rsum) + ' <span style="opacity:.6">· eng yaxshi 5 reyting</span></div>' : '') + '</div>';
      }).join('') + '</div>';
    }
    if (t.flag && (t.regs || []).length) {   // 🏳️ viloyatlar hisobi: eng yaxshi 5 o'yinchi
      var R = t.regs, md3 = fin ? ['🥇', '🥈', '🥉'] : [];   // medal faqat turnir tugaganda
      ch = '<div class="taCard" style="margin-top:10px"><h4>🗺 Viloyatlar hisobi · eng yaxshi 5 o‘yinchi</h4>' + R.slice(0, 14).map(function (r, i) {
        var fmtN2 = function (n) { return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
        // eng kuchli a'zo — ismi va reytingi; kapitan bo'lsa 👑 bilan
        var bst = r.best, isCap = !!(bst && r.cap && String(r.cap.uid) === String(bst.uid));
        var lead = (bst ? (isCap ? '👑 ' : '') + esc(String(bst.name || '').slice(0, 14)) + (bst.elo ? ' <b style="color:#dcd2c4">' + bst.elo + '</b>' : '')
                        : (r.cap ? '👑 ' + esc(String(r.cap.name || '').slice(0, 14)) : '')) +
          (r.rsum ? '<span style="float:right;color:#8fb0ff">⚔ ' + fmtN2(r.rsum) + '</span>' : '');
        return '<div class="taReg" data-reg="' + esc(r.r) + '" style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,.09);font-size:14px">' +
          '<div style="display:flex;align-items:center;gap:8px"><span style="width:24px;text-align:center">' + (md3[i] || (i + 1)) + '</span>' + bdg(r.k, r.c) +
          '<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.r) + '</span>' +
          '<small style="opacity:.6;min-width:60px;text-align:center">' + r.n + ' kishi</small>' +
          '<b style="min-width:42px;text-align:right;color:#f5b72b;font-size:15px">' + r.score + '</b></div>' +
          (lead ? '<div style="margin:3px 0 0 56px;font-size:12.5px;color:var(--spMute,#b9ab98)">' + lead + '</div>' : '') + '</div>';
      }).join('') + '</div>' + ch;
    }
    g('taClubs').innerHTML = ch;
    // 🗺 viloyat qatorini bosish: a'zolar ro'yxati va kapitan
    Array.prototype.forEach.call(P.querySelectorAll('.taReg'), function (el) {
      el.style.cursor = 'pointer';
      el.onclick = function () {
        var key = el.getAttribute('data-reg'), R2 = (t.regs || []).filter(function (x) { return x.r === key; })[0];
        if (!R2) return;
        var adm = !!(t.adm || window.__isAdmin), cap = R2.cap;
        var isCap = cap && String(cap.uid) === String((window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user || {}).id || '');
        var ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.6);display:flex;align-items:flex-end';
        var rows = (R2.top || []).map(function (x, j) {
          return '<div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.08)">' +
            '<span style="width:22px;opacity:.6">' + (j + 1) + '</span><b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(x.name || '') + '</b>' +
            '<small style="opacity:.6">' + (x.elo || '') + '</small><b style="min-width:34px;text-align:right;color:#f5b72b">' + (x.score || 0) + '</b>' +
            ((adm || isCap) ? '<button data-cap="' + esc(x.uid) + '" style="border:0;border-radius:10px;padding:7px 10px;background:#3a2f66;color:#fff;font-size:12px">👑</button>' : '') + '</div>';
        }).join('');
        ov.innerHTML = '<div style="width:100%;max-height:86vh;overflow:auto;background:#141833;color:#fff;border-radius:20px 20px 0 0;padding:14px 14px calc(env(safe-area-inset-bottom,0px) + 14px);box-sizing:border-box">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><b style="font-size:17px">🗺 ' + esc(key) + '</b>' +
          '<button data-x="1" style="border:0;background:#262b5a;color:#fff;border-radius:10px;width:36px;height:36px">✕</button></div>' +
          '<div style="font-size:13.5px;color:#b9c3f0;margin-bottom:10px">Kapitan: <b style="color:#ffd76a">' + (cap ? esc(cap.name) : 'tayinlanmagan') + '</b> · ' + (R2.n || 0) + ' o‘yinchi</div>' +
          (rows || '<div style="opacity:.7;padding:10px 0">Hozircha o‘yinchi yo‘q</div>') +
          ((adm && cap) ? '<button data-cap="" style="width:100%;margin-top:10px;border:0;border-radius:12px;padding:12px;background:#4a1b1b;color:#ffd9d9;font-weight:700">Kapitanni olib tashlash</button>' : '') + '</div>';
        document.body.appendChild(ov);
        ov.onclick = function (e) {
          if (e.target === ov || e.target.closest('[data-x]')) { ov.remove(); return; }
          var b2 = e.target.closest('[data-cap]'); if (!b2) return;
          var uid2 = b2.getAttribute('data-cap');
          if (window.lbSend) window.lbSend({ type: 'lbTCap', reg: key, uid: uid2 });
          ov.remove();
        };
      };
    });
    // sahifalash va tugma
    g('taPg').textContent = ps.length ? (page * PER + 1) + '-' + Math.min(ps.length, page * PER + PER) + ' / ' + ps.length : '0';
    var bs = P.querySelectorAll('.taBar button.n');
    bs[1].disabled = bs[2].disabled = page <= 0; bs[3].disabled = bs[4].disabled = page >= n - 1; bs[0].disabled = mi < 0;
    for (var bi = 0; bi < bs.length; bi++) bs[bi].style.display = n > 1 ? '' : 'none';
    var adm = '', jb = '';
    if (t.status !== 'finished' && !t.ending) {
      if (t.status === 'reg' && !t.startAt && String(t.creatorUid) === u) adm += '<button class="taJ s" data-a="start">▶ BOSHLASH</button>';
      if (t.status === 'reg' && String(t.creatorUid) === u) adm += '<button class="taJ p" data-a="invite">📣 CHAQIRISH</button>';
      if (t.status === 'reg' && (String(t.creatorUid) === u || window.__isAdmin)) adm += '<button class="taJ p" data-a="ann">GURUHGA YUBORISH</button>';
      if (t.status === 'reg' && (String(t.creatorUid) === u || window.__isAdmin)) adm += '<button class="taJ d" data-a="cancel">TURNIRNI O‘CHIRISH</button>';
      if (!mp || mp.withdrawn) jb += '<button class="taJ" data-a="join">▶ QATNASHISH</button>';
      else jb += t.status === 'running' ? '<button class="taJ p" data-a="pause">⏸ PAUZA</button>' : '<button class="taJ p" data-a="leave"><svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px;margin-right:6px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>TARK ETISH</button>';
    }
    adm = '';   // ⋯ Amallar endi turnir kartasida (tlist) — ichkarida takrorlanmaydi
    g('taJw').innerHTML = jb;
    g('taMenu').innerHTML = adm;
    // jadval
    var rows = ps.slice(page * PER, page * PER + PER).map(function (p, k) {
      var i = page * PER + k, pl = p.games > 0, d = pl ? Number(p.d) || 0 : 0;   // reyting o‘zgarishi — faqat arenada o‘ynaganda
      var dh = d > 0 ? ' <span class="u">↗' + d + '</span>' : d < 0 ? ' <span class="dn">↘' + (-d) + '</span>' : '';
      var npl = fin && !pl, pz = !fin && p.withdrawn, rk = npl ? '–' : (i + 1), md = !npl && i < 3 && p.score > 0 ? ' m' + (i + 1) : '';
      return '<div class="taRow' + (String(p.uid) === u ? ' me' : '') + (npl ? ' np' : '') + (pz ? ' pz' : '') + '">' +
        '<div class="taRk' + md + '">' + rk + '</div>' + avT(p) +
        '<div class="taNm"><b>' + (p.rg ? bdg(p.rg, p.rc, p.rn) : '') + nm(p.name) + (p.bh ? ' <img src="/img/bhunt_s.png" title="Botlar ovchisi ×' + p.bh + '" style="width:18px;height:20px;vertical-align:-3px">' : '') + '</b><small>' + (p.elo || '') + dh + (p.busy ? '<span class="pl">⚔ o‘ynamoqda</span>' : '') + (npl ? '<span class="np">· o‘ynamadi</span>' : '') + (pz ? '<span class="pzL">⏸ pauzada</span>' : '') + '</small></div>' +
        '<div class="taSh"><span>' + sheetHtml(p.sheet) + '</span></div>' +
        '<div class="taPt' + (p.fire ? ' f' : '') + '">' + (p.fire ? '🔥' : '') + p.score + '</div></div>';
    }).join('');
    g('taRows').innerHTML = rows ? '<div class="taTh"><span>#</span><span>O‘yinchi</span><span>Natijalar</span><span>Ochko</span></div>' + rows : '<div class="taEm">Hali hech kim qo‘shilmadi. Birinchi bo‘ling!</div>';
    // ⏳ kutayotgan o‘yinchiga holat: raqib bormi (arena faqat ilovada turgan va pauzada bo‘lmaganlarni juftlaydi)
    var wt = '';
    if (t.status === 'running' && mp && mp.withdrawn && !t.ending) wt = '⏸ <b>Siz pauzadasiz.</b> Yangi o‘yinga juftlanmaysiz, ochkolaringiz saqlanadi. Qaytish uchun «Qatnashish»ni bosing.';
    else if (t.status === 'running' && mp && !mp.withdrawn && !mp.busy) {
      var free = ps.filter(function (p) { return String(p.uid) !== u && !p.withdrawn && !p.busy && p.on; }).length;
      if (t.ending || (t.endAt && t.endAt - Date.now() < 60000)) wt = '⌛ <b>Oxirgi daqiqa</b> — yangi o‘yinlar boshlanmaydi.';
      else if (!free) wt = '⏳ <b>Raqib kutilmoqda.</b> Hozir bo‘sh raqib yo‘q: qolganlar o‘ynayapti, pauzada yoki ilovada emas. Kimdir bo‘shashi bilan o‘yin o‘zi boshlanadi — sahifani yopmang.';
      else wt = '⏳ <b>Raqib qidirilmoqda…</b> Bir necha soniyada o‘yin boshlanadi.';
    }
    g('taWt').innerHTML = wt ? '<div class="taWt">' + wt + '</div>' : '';
    // ma'lumot
    var tc = tcInfo(t.tc), inf = '<div class="taInf"><span class="ic">' + tc.icon + '</span><div><b>' + tc.txt + '</b> · ' + tc.name + ' · ' + (t.durationMin || 0) + ' daq<br>' + (t.rated === false ? '🤝 Reytingsiz' : '⭐ Reytingli') + ' · Arena' + (t.flag ? ' · 🏳️ Bayroqli' : '') + (t.berserk ? ' · ⚡ Berserk' : '') + (t.pos === 'idf' ? ' · IDF pozitsiyalar' : '') + '</div></div>' + (t.desc ? '<div class="taLn">📝 ' + esc(t.desc) + '</div>' : '');
    if (t.prize > 0) {
      var aw = (t.awards || []).filter(function (x) { return x.amt > 0; }), mdl = ['🥇', '🥈', '🥉'];
      var pay = t.pay || null, hasPay = fin && pay && ((pay.grp && pay.grp.length) || (pay.mem && pay.mem.length) || (pay.top && pay.top.length));
      if (!fin) inf += '<div class="taLn">🏆 Mukofot jamg‘armasi: <b>' + t.prize + '</b> tanga · ' + (t.places || 3) + ' o‘ringa</div>';
      else if (hasPay) {   // 🪙 to'liq taqsimot: jamoa ulushi + o'yinchilar + eng yaxshilar
        inf += '<div class="taLn">🏆 Mukofot jamg‘armasi: <b>' + t.prize + '</b> tanga</div>';
        if (pay.grp && pay.grp.length) {
          inf += '<div class="taLn">' + (t.flag ? '🏳️ Viloyatlar' : '👥 Klublar') + ' ulushi (60%): ' +
            pay.grp.map(function (x, i) { return (mdl[i] || (i + 1) + '.') + ' ' + nm(x.r) + ' — <b>' + x.amt + '</b>'; }).join(' · ') + ' tanga</div>';
        }
        if (pay.mem && pay.mem.length) {
          var gr = {}, ord = [];
          pay.mem.forEach(function (x) { var k = x.reg || ''; if (!gr[k]) { gr[k] = []; ord.push(k); } gr[k].push(x); });
          inf += '<div class="taLn">🪙 Jamoa a‘zolariga: ' + ord.map(function (k) {
            return (k ? nm(k) + ': ' : '') + gr[k].map(function (x) { return nm(x.name) + ' <b>' + x.amt + '</b>'; }).join(', ');
          }).join(' · ') + '</div>';
        }
        if (pay.top && pay.top.length) {
          inf += '<div class="taLn">⭐ Eng yaxshi o‘yinchilar (40%): ' +
            pay.top.map(function (x, i) { return (mdl[i] || (i + 1) + '.') + ' ' + nm(x.name) + ' — <b>' + x.amt + '</b>'; }).join(' · ') + ' tanga</div>';
        }
      }
      else if (aw.length) inf += '<div class="taLn">🏆 Mukofotlar: ' + aw.map(function (x) { return (mdl[x.place - 1] || x.place + '.') + ' ' + nm(x.name) + ' — <b>' + x.amt + '</b>'; }).join(' · ') + ' tanga</div>';
      else inf += '<div class="taLn">🏆 Mukofot berilmadi: arenada birorta ham o‘yin o‘ynalmadi' + (t.flag ? '' : ', jamg‘arma tashkilotchiga qaytarildi') + '.</div>';
    }
    if (t.minGames > 0) {
      var s = St(), mg = s && s.me && s.me.games != null ? Number(s.me.games) : null, ok = mp ? true : mg == null ? null : mg >= t.minGames;
      inf += '<div class="taLn' + (ok === false ? ' bad' : ok ? ' ok' : '') + '">' + (ok === false ? '✖' : '✔') + ' Ishtirok sharti: kamida ' + t.minGames + ' ta reytingli o‘yin' + (mg != null && !mp ? ' (sizda ' + mg + ')' : '') + '</div>';
    }
    if (t.creatorName) inf += '<div class="taLn">👤 Tashkilotchi: ' + nm(t.creatorName) + '</div>';
    g('taInfo').innerHTML = inf;
    // TOP o'yinlar (eng yuqori o'rinlar bo'yicha)
    var rk = {}; ps.forEach(function (p, i) { rk[String(p.uid)] = i + 1; });
    var live = (t.boards || []).filter(function (b) { return !b.done; }).map(function (b) { return { b: b, r: Math.min(rk[String(b.white)] || 999, rk[String(b.black)] || 999) }; }).sort(function (a, b) { return (a.b.bb ? 1 : 0) - (b.b.bb ? 1 : 0) || a.r - b.r; });
    var pinB = pinR ? live.filter(function (x) { return x.b.roomId === pinR; })[0] : null; if (!pinB) pinR = '';
    feat = pinB ? pinB.b : live.length ? live[0].b : null;
    g('taFeatC').style.display = feat ? '' : 'none';
    g('taTopC').style.display = live.length > 1 ? '' : 'none';
    g('taTop').innerHTML = live.slice(1, 9).map(function (x) {
      var b = x.b;
      return '<div class="taTg"><div><span><i class="rk">#' + (rk[String(b.white)] || '–') + '</i>⚪ ' + nm(b.whiteName) + ' <small>' + (b.whiteElo || '') + '</small></span><span><i class="rk">#' + (rk[String(b.black)] || '–') + '</i>⚫ ' + nm(b.blackName) + ' <small>' + (b.blackElo || '') + '</small></span></div>' + (b.bb ? '<button data-a="bbw" data-room="' + esc(b.roomId) + '">👁 Ko‘rish</button>' : '<button data-a="watch" data-room="' + esc(b.roomId) + '">👁 Tomosha</button>') + '</div>';
    }).join('');
    featRk = rk; renderFeat();
  }

  function renderChat(t) {
    window.__taLastT = t;
    var cc0 = g('taChC'); if (cc0) cc0.style.display = t.chatOff ? 'none' : '';
    var c = t.chat || [], u = me(), box = g('taCh'), isCr = String(t.creatorUid) === u || !!window.__isAdmin;
    g('taChN').textContent = c.length ? '(' + c.length + ')' : '';
    var bottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = c.length ? c.map(function (m) {
      var mine = String(m.uid) === u, ups = (m.ups || []), liked = ups.indexOf(u) >= 0;
      var quote = m.re ? '<div class="cq">' + nm(m.re.name) + ': ' + esc(m.re.text) + '</div>' : '';
      var acts = '<div class="cA"><button data-act="reply" data-mid="' + esc(m.id) + '">Javob</button>' +
        '<button data-act="like" data-mid="' + esc(m.id) + '"' + (liked ? ' class="on"' : '') + '>Yoqdi' + (ups.length ? ' ' + ups.length : '') + '</button>' +
        (mine ? '' : '<button data-act="rep" data-mid="' + esc(m.id) + '">Shikoyat</button>') +
        ((mine || isCr) ? '<button data-act="del" data-mid="' + esc(m.id) + '">O‘chirish</button>' : '') +
        (isCr && !mine ? '<button data-act="blk" data-uid="' + esc(m.uid) + '">Bloklash</button>' : '') + '</div>';
      return '<div class="cm' + (mine ? ' me' : '') + '">' + avT({ uid: m.uid, name: m.name }) +
        '<div class="cb"><b>' + (mine ? 'Siz' : nm(m.name)) + '</b>' + quote + '<div class="ct">' + esc(m.text) + '</div>' + acts + '</div></div>';
    }).join('') : '<p class="ce">Hali xabar yo‘q.</p>';
    if (bottom) box.scrollTop = box.scrollHeight;
  }

  // ---- yetakchi o'yin: roomPeek orqali jonli doska
  var feat = null, featRk = {}, ws = null, peek = null, peekAt = 0;
  function conn() {
    if (ws) return;
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host); } catch (e) { ws = null; return; }
    ws.onopen = askPeek;
    ws.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (!m || m.type !== 'roomPeek') return; peek = (m.games || [])[0] || null; peekAt = Date.now(); sigFeat = ''; renderFeat(); };
    ws.onclose = function () { ws = null; };
  }
  function askPeek() { if (!feat || !cur) return; if (!ws) return conn(); if (ws.readyState === 1) try { ws.send(JSON.stringify({ type: 'roomPeek', ids: [feat.roomId] })); } catch (e) {} }
  function boardOf(x) {
    if (typeof window.initialBoard !== 'function' || typeof window.applyStep !== 'function') return null;
    var b = window.initialBoard();
    if (x.opening && x.opening.board) { var k = 0; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) { b[r][c] = 0; continue; } var ch = x.opening.board.charAt(k++); b[r][c] = ch === 'w' ? 1 : ch === 'b' ? 2 : ch === 'W' ? 3 : ch === 'B' ? 4 : 0; } }
    try { for (var i = 0; i < (x.moves || []).length; i++) b = window.applyStep(b, x.moves[i]); } catch (e) {}
    return b;
  }
  function renderFeat() {
    if (!feat) { g('taFeat').innerHTML = ''; return; }
    var pk = peek && peek.id === feat.roomId ? peek : null;
    var sig = feat.roomId + ':' + (pk ? (pk.moves || []).length + ':' + JSON.stringify(pk.clock) : '-');
    if (sig === sigFeat) return; sigFeat = sig;
    var b = pk ? boardOf(pk) : null, cells = '', GS = skin();
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var v = b ? b[r][c] : 0, pc = '';
      if (v) { var w = v === 1 || v === 3, k = v > 2, u = window.spEqId ? '/api/shop/img?id=' + encodeURIComponent(window.spEqId) + '&k=' + (w ? 'w' : 'b') + (k ? 'k' : '') : '';
        pc = '<i class="piece pc ' + (w ? 'w' : 'b') + (k ? ' k' : '') + '"' + (u ? ' style="background-image:url(&quot;' + u + '&quot;)!important;background-size:contain!important;background-color:transparent!important;border:0!important;box-shadow:none!important"' : '') + '></i>'; }
      cells += '<div class="sq ' + ((r + c) % 2 ? 'd' : 'l') + '" style="' + (GS.rc ? 'background:' + ((r + c) % 2 ? GS.rc[1] : GS.rc[0]) + ';' : '') + 'position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:1">' + pc + '</div>';
    }
    var ck = pk && pk.clock ? pk.clock : {};
    function line(col) {
      var uid = col === 'w' ? feat.white : feat.black, n = col === 'w' ? feat.whiteName : feat.blackName, e = col === 'w' ? feat.whiteElo : feat.blackElo, t = col === 'w' ? ck.white : ck.black;
      return '<div class="taFp"><span><small>#' + (featRk[String(uid)] || '–') + '</small> <b>' + nm(n) + '</b> <small>' + (e || '') + '</small></span><span class="c">' + clk(t) + '</span></div>';
    }
    g('taFeat').innerHTML = line('b') + '<div class="taFt" id="taFtB" data-th="' + GS.th + '" data-ps="' + GS.ps + '" style="--pz:' + GS.pz + '%;--km:\'' + GS.km + '\'">' + cells + '</div>' + line('w') + (feat.bb ? '<div style="text-align:center;color:var(--spMute,#b9ab98);font-size:13px;margin-top:8px">🤖 Botlar o‘yini — jonli</div>' : '<button class="taW" data-a="watch" data-room="' + esc(feat.roomId) + '">👁 Tomosha qilish</button>');
  }

  function open(id) {
    build(); cur = String(id); window.__tvCur = cur; page = -1; sigMain = ''; sigChat = ''; sigFeat = ''; peek = null;
    GSK = null; document.body.classList.add('taOn'); P.classList.add('on'); g('taSc').scrollTop = 0; render();
    if (timer) clearInterval(timer);
    var k = 0; timer = setInterval(function () { render(); if (++k % 3 === 0) askPeek(); }, 1000);
    setTimeout(askPeek, 300);
  }
  var pinR = '';
  // 🎨 o'yinchining doska va donalari (do'kon / sozlamalar) — o'yin xonasidagidek
  var RCB = [["#EFD9B1", "#B58863"], ["#DEE3E6", "#8CA2AD"], ["#FFFFDD", "#86A666"], ["#DDDDDD", "#A0A0A0"], ["#F1D5CC", "#B5685D"], ["#E3DAEE", "#8B72B5"], ["#D5F0EC", "#4A9A93"], ["#9AA5B8", "#3E4A5E"], ["#F7E7B4", "linear-gradient(135deg,#C9A227,#8A6508)"], ["linear-gradient(135deg,#FAFAFA,#E3E3E0 55%,#F5F5F3)", "linear-gradient(135deg,#4B5563,#1F2937)"], ["#D9F2E3", "linear-gradient(135deg,#0F766E,#064E3B)"], ["#1E1B4B", "linear-gradient(135deg,#7C3AED,#DB2777)"]];
  var GSK = null;
  function skin() {
    if (GSK) return GSK;
    var o = { th: 'edeon', ps: 'img', pz: '90', km: '\u265B', rc: null };
    try { var x = JSON.parse(localStorage.getItem('sp_s2') || '{}'); if (x.th) o.th = x.th; if (x.ps) o.ps = x.ps; if (x.pz) o.pz = x.pz; if (x.km) o.km = x.km; } catch (e) {}
    try { var m = JSON.parse(localStorage.getItem('rc_menu_v1') || '{}'); if (m.board >= 0 && RCB[m.board]) o.rc = RCB[m.board]; } catch (e) {}
    try {
      if (!document.getElementById('taFtTh')) {
        var css = '';
        for (var i = 0; i < document.styleSheets.length; i++) { var Rl; try { Rl = document.styleSheets[i].cssRules; } catch (e) { continue; } for (var j = 0; j < Rl.length; j++) { var t = Rl[j].cssText || ''; if (t.indexOf('#board[') === 0) css += t.replace(/#board\[/g, '#taFtB[') + '\n'; } }
        var st = document.createElement('style'); st.id = 'taFtTh'; st.textContent = css + '#taFtB .sq{border:0!important}#taFtB .pc{pointer-events:none}'; document.head.appendChild(st);
      }
    } catch (e) {}
    GSK = o; return o;
  }
  // 🎮 o'yinga tushganda (xona ochilsa) arena sahifasi yopiladi — aks holda o'yin orqada qoladi
  setInterval(function () { if (P && P.classList.contains('on') && (document.getElementById('lbBack') || document.getElementById('rcFrameOv'))) close(); }, 300);   // o'yin xonasi ochildi (o'zida yoki oyna ichida)
  function close() {
    pinR = '';
    document.body.classList.remove('taOn'); if (P) P.classList.remove('on'); cur = null; window.__tvCur = null;
    if (timer) { clearInterval(timer); timer = null; }
    try { if (ws) ws.close(); } catch (e) {} ws = null;
  }
  window.taOpen = open; window.taClose = close;
  window.taPeek = function (x) { peek = x; sigFeat = ''; renderFeat(); };   // sinov/tashqi ma'lumot uchun

  // window.tvOpen ni egallash: arena — yangi sahifa, qolganlari — eski oyna
  function hook() {
    if (!window.tvOpen || window.tvOpen.__ta) return false;
    var orig = window.tvOpen;
    var f = function (id) {
      var t = findT(id);
      if (t && t.type === 'arena') { try { if (window.tvClose) window.tvClose(); } catch (e) {} return open(id); }
      return orig.apply(this, arguments);
    };
    f.__ta = 1; window.tvOpen = f; return true;
  }
  var hk = setInterval(function () { hook(); }, 400);
  setTimeout(function () { clearInterval(hk); setInterval(hook, 3000); }, 20000);
})();

/* TAFX: g'oliblar shohsupasi — konfetti, lentalar va fanfara */
;(function () {
  var fired = {}, lastCur = null;
  function fanfare() {
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      var c = window.__spAC || (window.__spAC = new C()); if (c.state === 'suspended') c.resume();
      function note(f, t, d, type, v) {
        var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05);
      }
      // ta-ta-ta-taaa
      [[523.25, 0, .16], [523.25, .18, .16], [523.25, .36, .16], [659.25, .54, .5]].forEach(function (n) { note(n[0], n[1], n[2], 'square', 0.12); note(n[0] / 2, n[1], n[2], 'triangle', 0.15); });
      [[783.99, 1.1, .2], [659.25, 1.3, .2], [783.99, 1.5, .2], [1046.5, 1.7, .9]].forEach(function (n) { note(n[0], n[1], n[2], 'square', 0.12); note(n[0] / 2, n[1], n[2], 'triangle', 0.15); });
      for (var i = 0; i < 12; i++) note(1500 + Math.random() * 2500, 1.7 + i * 0.07, 0.12, 'sine', 0.05);
    } catch (e) {}
  }
  function confetti() {
    try {
      var cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483200';
      var W = cv.width = innerWidth, H = cv.height = innerHeight; document.body.appendChild(cv);
      var cx = cv.getContext('2d'), cols = ['#f5b72b', '#4cc9f0', '#f72585', '#7ae582', '#b5179e', '#ff9b2f', '#ffffff'], P = [];
      function add(x, ang, n) {
        for (var i = 0; i < n; i++) {
          var a = ang + (Math.random() - 0.5) * 1.3, s = 9 + Math.random() * 13, rib = Math.random() < 0.3;
          P.push({ x: x, y: H * 0.55, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
            w: rib ? 5 : 8 + Math.random() * 6, h: rib ? 26 + Math.random() * 22 : 6 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] });
        }
      }
      add(0, -Math.PI / 3, 90); add(W, -2 * Math.PI / 3, 90);
      setTimeout(function () { add(W * 0.25, -Math.PI / 2, 50); add(W * 0.75, -Math.PI / 2, 50); }, 900);
      var t0 = Date.now();
      (function loop() {
        var el = Date.now() - t0; cx.clearRect(0, 0, W, H);
        P.forEach(function (p) {
          p.vy += 0.35; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.max(0, Math.min(1, (5200 - el) / 1200));
          cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
        });
        if (el < 5200) requestAnimationFrame(loop); else cv.remove();
      })();
    } catch (e) {}
  }
  setInterval(function () {
    try {
      var P = document.getElementById('taP'), on = P && P.classList.contains('on'), cur = on ? window.__tvCur : null;
      if (cur !== lastCur) { lastCur = cur; }
      if (!cur || fired[cur]) return;
      var T = (window.__lb && window.__lb.S && window.__lb.S.tournaments) || [], t = null;
      for (var i = 0; i < T.length; i++) if (String(T[i].id) === String(cur)) t = T[i];
      if (!t || t.type !== 'arena' || t.status !== 'finished') return;
      if (!(t.players || []).some(function (p) { return p.games > 0; })) return;
      fired[cur] = 1; confetti(); fanfare();
    } catch (e) {}
  }, 500);
})();
