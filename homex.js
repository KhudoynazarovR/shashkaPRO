/* homex.js — 🏠 bosh sahifa (B variant: «Samarqand» uslubi).
   Tartib: profil kartasi + «Do‘st bilan o‘ynash» → Mini o‘yinlar | Kunlik masala | Botlar → jonli stollar → reytinglar →
   online o‘yinchilar / do‘stlar (lobbyclient). «O‘yinlarim» bosh sahifada yo‘q — arxiv Menyu'da.
   Mavjud bloklar (profil kartasi, jonli stollar, mini o‘yinlar / botlar) o‘z joyida ishlaydi — biz faqat joylashuv, uslub va
   bir nechta kichik elementni (do‘st tugmasi, masala tugmasi, reytinglar) qo‘shamiz. */
;(function () {
  if (window.__hx) return; window.__hx = 1;
  var tg = window.Telegram && window.Telegram.WebApp;
  function $(id) { return document.getElementById(id); }
  function idata() { return (tg && tg.initData) || ''; }
  // bir xil chiziqli ikonlar (emoji o‘rniga — har telefonda bir xil ko‘rinadi)
  function ic(p, s) { s = s || 20; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var P = {
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    pad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.54-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5z"/>',
    puz: '<path d="M19.44 7.85c-.05.32.06.65.29.88l1.57 1.57c.47.47.7 1.09.7 1.7s-.23 1.23-.7 1.7l-1.61 1.61a.98.98 0 0 1-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 1 0-3.21 3.21c.45.17.86.5.93.97a.98.98 0 0 1-.28.84l-1.61 1.61a2.4 2.4 0 0 1-3.41 0l-1.57-1.57a1.03 1.03 0 0 0-.88-.29c-.49.07-.84.5-1.02.97a2.5 2.5 0 1 1-3.24-3.24c.46-.18.9-.53.97-1.02a1.03 1.03 0 0 0-.29-.88l-1.57-1.57A2.4 2.4 0 0 1 2 12c0-.62.24-1.23.7-1.7l1.53-1.53c.24-.24.58-.35.92-.3.51.08.88.53 1.07 1.01a2.5 2.5 0 1 0 3.26-3.26c-.48-.2-.93-.56-1.01-1.07-.05-.34.06-.68.3-.92l1.53-1.53A2.4 2.4 0 0 1 12 2c.62 0 1.23.24 1.7.7l1.57 1.57c.23.23.56.34.88.29.49-.07.84-.5 1.02-.97a2.5 2.5 0 1 1 3.24 3.24c-.46.18-.9.53-.97 1.02Z"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>'
  };
  // karta uslubi: shaffof to‘q ko‘k + ingichka oltin chiziq (fon naqshidan ajralib turadi)
  var GL = 'background:rgba(14,22,82,.84)!important;border:1px solid rgba(232,196,106,.28)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 22px rgba(0,0,0,.28)!important';
  var H = '#lbPanel #hzHero', D3 = H + ' #nvDuo';
  var st = document.createElement('style'); st.id = 'hxCss';
  st.textContent =
    // ── setka: 1-qator profil | do‘st tugmasi, keyin to‘liq kenglikdagi bloklar
    'body:not(.nvT) ' + H + '.hz{display:grid!important;grid-template-columns:minmax(0,1fr) 104px;gap:10px!important;align-items:stretch!important;align-content:start!important}' +
    H + '.hz>*,' + H + '.hz #hzRow2>*{grid-column:1/-1;min-width:0}' +
    H + ' #nvKK{display:none!important}' +
    H + ' #nvDuo{order:2!important}' + H + ' #hxLvW{order:3!important}' + H + ' #hxRt{order:4!important}' +
    H + ' #hxLvW:not(:has(.hzLvC)){display:none!important}' +
    // ── profil kartasi
    H + '.hz #pfCard{grid-row:1;grid-column:1;order:0!important;display:flex!important;align-items:flex-start!important;gap:10px!important;margin:0!important;padding:10px 12px 12px!important;min-height:92px;border-radius:16px!important;box-sizing:border-box;cursor:pointer;' + GL + '}' +
    H + ' #pfCard .pfA{width:44px!important;height:44px!important;border-radius:50%!important;flex:none;background:linear-gradient(150deg,#3b82f6,#1e3a8a)!important;box-shadow:0 0 0 2px #e8c46a!important;font-size:16px!important;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;margin:1px 0 0 1px}' +
    H + ' #pfCard .pfA img{width:100%;height:100%;object-fit:cover;border-radius:50%}' +
    H + ' #pfCard .pfB{flex:1;min-width:0}' +
    H + ' #pfCard .pfN{font-size:14px!important;font-weight:700!important;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    H + ' #pfCard .pfC{display:flex;align-items:center;gap:5px;margin-top:4px;font-size:16px!important;font-weight:800!important;line-height:1.2;color:#ffc53d!important;white-space:nowrap}' +
    H + ' #pfCard .pfCo{width:14px;height:14px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 35%,#ffe08a,#f5a524);box-shadow:inset 0 0 0 2px #d48806}' +
    H + ' #pfCard .pfE,' + H + ' #pfCard .pfG{display:none!important}' +
    // ── o‘rin va seriya belgilari: profil kartasi ichida, pastki qatorda
    H + ' #hxChips{grid-row:1;grid-column:1;align-self:end;display:flex!important;flex-wrap:wrap;align-items:center;gap:6px;margin:0 10px 10px 12px!important;padding:0!important;pointer-events:none;z-index:2;min-width:0;width:auto!important;height:auto!important;background:none!important}' +
    H + ' #hxChips:empty{display:none}' +
    H + ' #hxChips>#lgCard,' + H + ' #hxChips>#dqCard{pointer-events:auto;position:relative!important;top:auto!important;right:auto!important;left:auto!important;bottom:auto!important;flex:0 0 auto!important;width:auto!important;max-width:max-content!important;height:24px!important;margin:0!important;padding:0 8px!important;gap:4px!important;border-radius:99px!important;box-shadow:none!important;z-index:auto!important;box-sizing:border-box}' +
    H + ' #hxChips>#lgCard{background:rgba(255,255,255,.08)!important;border:1px solid rgba(232,196,106,.25)!important}' +
    H + ' #hxChips .f{font-size:12px!important}' + H + ' #hxChips b{font-size:11.5px!important}' + H + ' #hxChips small{font-size:10.5px!important}' +
    H + ' #hxChips .dot{min-width:18px!important;height:18px!important;font-size:11px!important;line-height:18px!important;top:-7px!important;right:-6px!important}' +
    // ── Do‘st bilan o‘ynash
    H + ' #hxFrB{grid-row:1;grid-column:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 6px;border-radius:16px;text-align:center;color:#fff;cursor:pointer;box-sizing:border-box;min-width:0;background:linear-gradient(160deg,#8b5cf6,#5b21b6);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 4px 0 #3b137f}' +
    H + ' #hxFrB:active{transform:translateY(2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 2px 0 #3b137f}' +
    H + ' #hxFrB b{font-size:12.5px;line-height:1.2;font-weight:700}' + H + ' #hxFrB small{font-size:10px;line-height:1.2;color:#e4d9ff}' +
    // ── Mini o‘yinlar | Kunlik masala | Botlar
    D3 + '{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px!important;margin:0!important}' +
    D3 + ' #nvMemRow{order:1!important}' + D3 + ' #hxPzT{order:2!important}' + D3 + ' #nvBotRow{order:3!important}' + D3 + ' #nvStolRow{display:none!important}' +
    D3 + ' #nvMemRow,' + D3 + ' #hxPzT,' + D3 + ' #nvBotRow{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;min-width:0!important;min-height:96px!important;height:auto!important;margin:0!important;padding:12px 8px!important;border:0!important;border-radius:16px!important;color:#fff!important;cursor:pointer;box-sizing:border-box;flex:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 4px 0 rgba(0,0,0,.35)!important}' +
    D3 + ' #nvMemRow{background:linear-gradient(160deg,#7c3aed,#4c1d95)!important}' +
    D3 + ' #hxPzT{background:linear-gradient(160deg,#22c55e,#15803d)!important}' +
    D3 + ' #nvBotRow{background:linear-gradient(160deg,#fb923c,#c2410c)!important}' +
    D3 + ' .hxIc{width:34px;height:34px;border-radius:10px;flex:none;display:flex!important;align-items:center;justify-content:center;background:rgba(255,255,255,.18);font-size:0!important}' +
    D3 + ' .hxIc svg{width:20px;height:20px}' +
    D3 + ' #nvBotRow .st,' + D3 + ' #nvBotRow .ar,' + D3 + ' #nvMemRow div div{display:none!important}' +
    D3 + '>div>div{min-width:0;max-width:100%}' +
    D3 + ' b{display:block!important;font-size:clamp(12px,3.4vw,13px)!important;font-weight:700!important;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    D3 + ' small,' + D3 + ' small.hxSub{display:block!important;margin-top:2px;font-size:11px!important;opacity:.88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    // ── sarlavhalar
    '.hxH{display:flex;justify-content:space-between;align-items:baseline;margin:6px 2px 10px;font-weight:700;font-size:16px}' +
    // ── jonli stollar
    '#lbPanel #hzLive.hzLv{margin:0!important;padding:0!important;background:none!important;box-shadow:none!important;border-radius:0!important}' +
    '#lbPanel #hzLive:not(:has(.hzLvC)){display:none!important}' +
    '#lbPanel #hzLive .hzLvH{display:flex;justify-content:space-between;align-items:baseline;margin:6px 2px 10px!important;font-size:16px!important;font-weight:700}' +
    '#lbPanel #hzLive .hzLvH small{font-size:12px;font-weight:400;color:#b6c4ee;opacity:1!important}' +
    '#lbPanel #hzLive .hzLvG{display:flex!important;gap:10px!important;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}' +
    '#lbPanel #hzLive .hzLvG::-webkit-scrollbar{display:none}' +
    '#lbPanel #hzLive .hzLvC{flex:0 0 calc(50% - 5px)!important;scroll-snap-align:start;box-sizing:border-box;padding:8px!important;border-radius:16px!important;text-align:left!important;color:#fff!important;overflow:hidden;' + GL + '}' +
    '#lbPanel #hzLive .hzLvC>b{display:inline-flex!important;align-items:center;gap:4px;max-width:100%;margin:0 0 8px!important;padding:3px 8px!important;border-radius:99px;font-size:11px!important;font-weight:700;white-space:nowrap;color:#fff}' +
    '#lbPanel #hzLive .hzLvC>b svg{width:12px;height:12px;flex:none}' +
    '#lbPanel #hzLive .hzLvB{display:grid!important;grid-template-columns:repeat(8,1fr);width:100%!important;height:auto!important;aspect-ratio:1/1;margin:0!important;padding:0!important;border-radius:8px!important;overflow:hidden;box-shadow:none!important}' +
    '.hzLvB i{display:flex!important;align-items:center;justify-content:center;padding:0!important}.hzLvB i.l{background:#ecd3a5}.hzLvB i.d{background:#9a6334}' +
    '.hzLvB s{display:block;width:78%;height:78%;border-radius:50%;text-decoration:none}.hzLvB s.p1,.hzLvB s.p3{background:#fafafa;box-shadow:inset 0 -1px 0 #bbb}.hzLvB s.p2,.hzLvB s.p4{background:#222}.hzLvB s.p3,.hzLvB s.p4{box-shadow:0 0 0 1.5px #f5b82e}' +
    '#lbPanel #hzLive .hzLp{display:flex!important;align-items:center;gap:6px;margin:0;padding:0!important;font-size:12px!important;line-height:1.5;white-space:nowrap;overflow:hidden;color:#fff}' +
    '#lbPanel #hzLive .hzLvB+.hzLp{margin-top:8px}' +
    '#lbPanel #hzLive .hzNm{min-width:0;overflow:hidden;text-overflow:ellipsis}' +
    '#lbPanel #hzLive .hzLp em{flex:none;font-style:normal;color:#8ea0d6}' +
    '#lbPanel #hzLive .hzDw,#lbPanel #hzLive .hzDb{width:10px;height:10px;border-radius:50%;flex:none}' +
    '#lbPanel #hzLive .hzDw{background:#f8fafc;box-shadow:inset 0 0 0 1px #94a3b8}#lbPanel #hzLive .hzDb{background:#0f172a;box-shadow:inset 0 0 0 1px #64748b}' +
    '#lbPanel #hzLive .hzLvC u{display:flex!important;align-items:center;gap:5px;margin-top:6px;padding:0!important;text-decoration:none;font-size:11px!important;color:#8ea0d6!important}' +
    '#lbPanel #hzLive .hzLvC u svg{width:13px;height:13px;flex:none}' +
    // ── reytinglar: bitta kartada uchta ustun
    '#lbPanel #hxRt .rt{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));margin:0!important;border-radius:16px;overflow:hidden;' + GL + '}' +
    '#lbPanel #hxRt .rt>div{padding:11px 4px;text-align:center;cursor:pointer;border-left:1px solid rgba(232,196,106,.22);min-width:0}' +
    '#lbPanel #hxRt .rt>div:first-child{border-left:0}' +
    '#lbPanel #hxRt .lab{display:flex;align-items:center;justify-content:center;gap:5px;font-size:12px;color:#b6c4ee}' +
    '#lbPanel #hxRt .lab svg{width:14px;height:14px;flex:none}' +
    '#lbPanel #hxRt .rt b{display:block;margin-top:3px;font-size:20px;font-weight:800;color:#fff}' +
    '#lbPanel #hxRt .rt b i{font-style:normal;font-size:14px;opacity:.45;margin-left:1px}' +
    // ── online o‘yinchilar / do‘stlar (lobbyclient yozgan tugmalar)
    '#lbPanel #lbPl .tabs{display:grid!important;grid-template-columns:1fr 1fr;gap:8px!important;margin:0 0 8px!important}' +
    '#lbPanel #lbPl .tabs .lbtb{display:flex!important;align-items:center;gap:10px;min-width:0;padding:10px 12px!important;border-radius:16px!important;color:#fff!important;text-align:left;font:inherit;cursor:pointer;' + GL + '}' +
    '#lbPanel #lbPl .tabs .lbtb.on{background:rgba(29,78,216,.5)!important;border-color:rgba(232,196,106,.6)!important}' +
    '#lbPanel #lbPl .lbtb .lbtI{position:relative;width:34px;height:34px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1)}' +
    '#lbPanel #lbPl .lbtb .lbtI svg{width:18px;height:18px}' +
    '#lbPanel #lbPl .lbtb .lbtOn{position:absolute;right:0;bottom:0;width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px #0e1650}' +
    '#lbPanel #lbPl .lbtb .lbtNew{position:absolute;right:-1px;top:-1px;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px #0e1650}' +
    '#lbPanel #lbPl .lbtb .lbtT{display:flex;flex-direction:column;min-width:0;line-height:1.2}' +
    '#lbPanel #lbPl .lbtb .lbtT small{font-size:11px;color:#b6c4ee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#lbPanel #lbPl .lbtb .lbtT b{font-size:16px;font-weight:800}' +
    // ── bo‘sh holat
    '#hxBot{padding:0 0 10px}#hxBot:empty{display:none}' +
    '#hxEmp{margin:4px 0 6px;padding:12px;border-radius:16px;border:1px dashed rgba(232,196,106,.35);text-align:center;font-size:13.5px;color:#dfe6ff}#hxEmp small{display:block;margin-top:3px;opacity:.7}';
  document.head.appendChild(st);

  var D = null, dAt = 0;
  function load(force) {
    if (!idata() || (!force && Date.now() - dAt < 60000)) return;
    dAt = Date.now();
    fetch('/api/home', { headers: { 'x-init-data': idata() } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) { D = j; draw(); } }).catch(function () {});
  }
  function nav(rx) { var b = [].slice.call(document.querySelectorAll('#nvBar button')).find(function (x) { return rx.test(x.textContent || ''); }); if (b) b.click(); }
  function openDaily() {
    if (!window.spPuzzles) { nav(/Masalalar|Задачи|Puzzles/); return; }
    window.spPuzzles();
    var n = 0, t = setInterval(function () { var d = document.querySelector('[data-pzh="daily"]'); if (d) { clearInterval(t); d.click(); } else if (++n > 30) clearInterval(t); }, 200);
  }
  function el(id, html) {
    var e = $(id); if (!e) { e = document.createElement('div'); e.id = id; }
    if (e.__h !== html) { e.innerHTML = html; e.__h = html; }
    return e;
  }
  function mk(id, tag) { var e = $(id); if (!e) { e = document.createElement(tag || 'div'); e.id = id; } return e; }
  function draw() {
    var hero = $('hzHero'); if (!hero) return;
    // 🎯 jonli stollar — o‘z o‘ramimizda (#hxLvW), uchta tugmadan keyin
    var lw = mk('hxLvW');
    if (lw.parentNode !== hero) hero.appendChild(lw);
    var lv = $('hzLive'); if (lv && lv.parentNode !== lw) lw.appendChild(lv);
    // 🔗 Do‘st bilan o‘ynash — profil kartasining o‘ng tomonida
    var fb = $('hxFrB');
    if (!fb) {
      fb = mk('hxFrB'); fb.setAttribute('role', 'button');
      fb.innerHTML = ic(P.link, 22) + '<b>Do‘st bilan o‘ynash</b><small>Havola yuboring</small>';
      fb.onclick = function () { if (window.lbPlay) window.lbPlay.friend(window.__nvTc || '3+2'); };
    }
    if (fb.parentNode !== hero) hero.appendChild(fb);
    // o‘rin va seriya belgilari profil kartasi ichida; karta balandligi belgilarga qarab
    var cw = mk('hxChips');
    if (cw.parentNode !== hero) hero.appendChild(cw);
    var lg = $('lgCard'), dq = $('dqCard');
    if (lg && lg.parentNode !== cw) cw.insertBefore(lg, cw.firstChild);
    if (dq && dq.parentNode !== cw) cw.appendChild(dq);
    var pf = $('pfCard');
    if (pf) {
      var pb = (cw.offsetHeight ? cw.offsetHeight + 20 : 12) + 'px';
      if (pf.style.getPropertyValue('padding-bottom') !== pb) pf.style.setProperty('padding-bottom', pb, 'important');
    }
    // Mini o‘yinlar | Kunlik masala | Botlar
    var duo = $('nvDuo');
    if (duo) {
      var mem = $('nvMemRow'), bt = $('nvBotRow');
      var pt = $('hxPzT');
      if (!pt) { pt = mk('hxPzT'); pt.setAttribute('role', 'button'); pt.onclick = openDaily; }
      var day = D ? D.day || 0 : 0;
      var ph = '<span class="hxIc">' + ic(P.puz) + '</span><div><b>Kunlik masala</b><small>' + (day ? 'Bugun ' + day + ' ta' : 'Bugungi masala') + '</small></div>';
      if (pt.__h !== ph) { pt.innerHTML = ph; pt.__h = ph; }
      if (pt.parentNode !== duo) duo.insertBefore(pt, bt && bt.parentNode === duo ? bt : null);
      if (mem && mem.dataset.mini && !mem.__hx) {
        mem.__hx = 1;
        var s0 = mem.querySelector('span'); if (s0) { s0.removeAttribute('style'); s0.className = 'hxIc'; s0.innerHTML = ic(P.pad); }
        var d0 = mem.querySelector('div'), b0 = d0 && d0.querySelector('b');
        if (b0 && !d0.querySelector('.hxSub')) { var sm = document.createElement('small'); sm.className = 'hxSub'; sm.textContent = 'Tez o‘yinlar'; d0.insertBefore(sm, b0.nextSibling); }
      }
      if (bt && !bt.__hx) {
        bt.__hx = 1;
        var ib = document.createElement('span'); ib.className = 'hxIc'; ib.innerHTML = ic(P.bot); bt.insertBefore(ib, bt.firstChild);
        var b1 = bt.querySelector('div b'); if (b1) b1.textContent = 'Botlar';
      }
    }
    // 📊 reytinglar
    var RT = (D && D.rt) || {}, cell = function (k, p, lb) { var x = RT[k] || { r: 1500, prov: true }; return '<div data-x="rk"><span class="lab">' + ic(p, 14) + '<span>' + lb + '</span></span><b>' + x.r + (x.prov ? '<i>?</i>' : '') + '</b></div>'; };
    var rt = el('hxRt', '<div class="hxH">Reytinglar</div><div class="rt">' + cell('bullet', P.rocket, 'Bullet') + cell('blits', P.zap, 'Blits') + cell('rapid', P.timer, 'Rapid') + '</div>');
    if (rt.parentNode !== hero) {
      hero.appendChild(rt);
      rt.onclick = function (e) {
        var t = e.target; while (t && t !== rt && !(t.getAttribute && t.getAttribute('data-x'))) t = t.parentNode;
        if (t && t !== rt) nav(/Reyting|Рейтинг|Rating/);
      };
    }
    // online ro‘yxat ostida: faqat «hamma o‘yinda» xabari (o‘yinlarim — Menyu → Arxiv)
    var gm = $('hxGm'); if (gm) gm.remove();
    var pl = $('lbPl'); if (!pl || !pl.parentNode) return;
    var bot = mk('hxBot');
    if (bot.previousSibling !== pl) pl.parentNode.insertBefore(bot, pl.nextSibling);
    bot.style.display = pl.offsetParent ? '' : 'none';
    var vis = [].slice.call(pl.querySelectorAll('.lbp')).filter(function (x) { return x.offsetParent; }).length;
    var onTab = pl.querySelector('.lbtb.on'), fr = onTab && onTab.getAttribute('data-t') === 'f';
    var h = vis <= 1 && !fr ? '<div id="hxEmp">😴 Hozir hamma o‘yinda<small>Bir daqiqada bo‘shaydi</small></div>' : '';
    if (bot.__h !== h) { bot.innerHTML = h; bot.__h = h; }
  }
  setInterval(function () { var hero = $('hzHero'); if (!hero || !hero.offsetParent) return; load(); try { draw(); } catch (e) {} }, 1000);
  // o‘yindan qaytganda yangilaymiz
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(true); });
  window.hxRefresh = function () { load(true); };
})();
