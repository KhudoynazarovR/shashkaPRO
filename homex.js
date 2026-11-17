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
  // rangli fon ustidagi emoji ikonlar
  function em(ch, cls) { return '<span class="hxEm' + (cls ? ' ' + cls : '') + '">' + ch + '</span>'; }
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
    // ── 🏅 reyting lentasi (eng tepada, suzib yuradi; bosilsa — Reyting)
    H + ' #hxTick{grid-row:1;grid-column:1/-1;position:relative;overflow:hidden;height:36px;border-radius:12px;cursor:pointer;' + GL + '}' +
    H + '.hxTk #pfCard,' + H + '.hxTk #hxChips,' + H + '.hxTk #hxFrB{grid-row:2!important}' +
    H + ' #hxTick::before,' + H + ' #hxTick::after{content:""!important;display:block!important;position:absolute;top:0;bottom:0;width:22px;z-index:2;pointer-events:none}' +
    H + ' #hxTick::before{left:0;background:linear-gradient(90deg,rgba(14,22,82,1),rgba(14,22,82,0))}' + H + ' #hxTick::after{right:0;background:linear-gradient(270deg,rgba(14,22,82,1),rgba(14,22,82,0))}' +
    '@keyframes hxTk{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
    H + ' #hxTick .tr{display:flex;width:max-content;height:100%;align-items:center;animation:hxTk 40s linear infinite!important}' +
    H + ' #hxTick .it{display:flex;align-items:center;gap:7px;padding:0 14px;white-space:nowrap;font-size:13px;color:#fff}' +
    H + ' #hxTick .it .e{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;line-height:1;box-shadow:inset 0 1px 0 rgba(255,255,255,.45)}' +
    H + ' #hxTick .it small{font-size:12px;color:#b6c4ee}' + H + ' #hxTick .it b{font-weight:700;max-width:170px;overflow:hidden;text-overflow:ellipsis}' + H + ' #hxTick .it i{font-style:normal;font-weight:800;color:#ffc53d}' +
    H + ' #hxTick .sep{color:#e8c46a;opacity:.6;font-size:10px}' +
    '@media (prefers-reduced-motion: reduce){' + H + ' #hxTick .tr{animation:none!important}' + H + ' #hxTick{overflow-x:auto}}' +
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
    H + ' #hxFrB{position:relative;overflow:hidden}' + H + ' #hxFrB .hxEc{width:38px;height:38px;border-radius:50%;font-size:20px;background:linear-gradient(145deg,rgba(255,255,255,.45),rgba(255,255,255,.12));box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 3px 8px rgba(0,0,0,.25)}' +
    H + ' #hxFrB b{font-size:12.5px;line-height:1.2;font-weight:700}' + H + ' #hxFrB small{font-size:10px;line-height:1.2;color:#e4d9ff}' +
    // ── Mini o‘yinlar | Kunlik masala | Botlar
    D3 + '{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px!important;margin:0!important}' +
    D3 + ' #nvMemRow{order:1!important}' + D3 + ' #hxPzT{order:2!important}' + D3 + ' #nvBotRow{order:3!important}' + D3 + ' #nvStolRow{display:none!important}' +
    D3 + ' #nvMemRow,' + D3 + ' #hxPzT,' + D3 + ' #nvBotRow{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;min-width:0!important;min-height:96px!important;height:auto!important;margin:0!important;padding:12px 8px!important;border:0!important;border-radius:16px!important;color:#fff!important;cursor:pointer;box-sizing:border-box;flex:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 4px 0 rgba(0,0,0,.35)!important}' +
    D3 + ' #nvMemRow{background:linear-gradient(160deg,#7c3aed,#4c1d95)!important}' +
    D3 + ' #hxPzT{background:linear-gradient(160deg,#22c55e,#15803d)!important}' +
    D3 + ' #nvBotRow{background:linear-gradient(160deg,#fb923c,#c2410c)!important}' +
    D3 + ' .hxIc{width:42px;height:42px;border-radius:13px;flex:none;display:flex!important;align-items:center;justify-content:center;font-size:24px!important;line-height:1;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 8px rgba(0,0,0,.28)}' +
    D3 + ' #nvMemRow .hxIc{background:linear-gradient(145deg,#d8b4fe,#8b5cf6)}' + D3 + ' #hxPzT .hxIc{background:linear-gradient(145deg,#bbf7d0,#22c55e)}' + D3 + ' #nvBotRow .hxIc{background:linear-gradient(145deg,#fde68a,#f97316)}' +
    D3 + '>div:active,' + H + ' #hxFrB:active{transform:scale(.97)!important}' +
    D3 + ' #nvBotRow .st,' + D3 + ' #nvBotRow .ar,' + D3 + ' #nvMemRow div div{display:none!important}' +
    D3 + '>div>div{min-width:0;max-width:100%}' +
    D3 + ' b{display:block!important;font-size:clamp(12px,3.4vw,13px)!important;font-weight:700!important;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    D3 + ' small,' + D3 + ' small.hxSub{display:block!important;margin-top:2px;font-size:11px!important;opacity:.88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    // ── sarlavhalar
    '.hxEm{display:inline-flex;align-items:center;justify-content:center;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.28))}' +
    '.hxH{display:flex;justify-content:space-between;align-items:baseline;margin:6px 2px 10px;font-weight:700;font-size:16px}' +
    // ── jonli stollar
    '#lbPanel #hzLive.hzLv{margin:0!important;padding:0!important;background:none!important;box-shadow:none!important;border-radius:0!important}' +
    '#lbPanel #hzLive:not(:has(.hzLvC)){display:none!important}' +
    '#lbPanel #hzLive .hzLvH{display:flex;justify-content:space-between;align-items:baseline;margin:6px 2px 10px!important;font-size:16px!important;font-weight:700}' +
    '#lbPanel #hzLive .hzLvH>span{display:inline-flex;align-items:center;gap:8px}' +
    '#lbPanel #hzLive .hzLvH>span::before{content:""!important;display:inline-block!important;width:9px;height:9px;border-radius:50%;background:#ef4444}' +
    '#lbPanel #hzLive .hzLvH small{font-size:12px;font-weight:400;color:#b6c4ee;opacity:1!important}' +
    '#lbPanel #hzLive .hzLvG{display:flex!important;gap:10px!important;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}' +
    '#lbPanel #hzLive .hzLvG::-webkit-scrollbar{display:none}' +
    '#lbPanel #hzLive .hzLvC{flex:0 0 calc(50% - 5px)!important;scroll-snap-align:start;box-sizing:border-box;padding:8px!important;border-radius:16px!important;text-align:left!important;color:#fff!important;overflow:hidden;' + GL + '}' +
    '#lbPanel #hzLive .hzLvC>b{display:inline-flex!important;align-items:center;gap:4px;max-width:100%;margin:0 0 8px!important;padding:3px 8px!important;border-radius:99px;font-size:11px!important;font-weight:700;white-space:nowrap;color:#fff}' +
    '#lbPanel #hzLive .hzLvC>b .hzE,#lbPanel #hzLive .hzLvC u .hzE{font-size:12px;line-height:1;flex:none}' +
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
    // ── reytinglar: bitta kartada uchta ustun
    '#lbPanel #hxRt .rt{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));margin:0!important;border-radius:16px;overflow:hidden;' + GL + '}' +
    '#lbPanel #hxRt .rt>div{padding:11px 4px;text-align:center;cursor:pointer;border-left:1px solid rgba(232,196,106,.22);min-width:0}' +
    '#lbPanel #hxRt .rt>div:first-child{border-left:0}' +
    '#lbPanel #hxRt .lab{display:flex;align-items:center;justify-content:center;gap:5px;font-size:12px;color:#b6c4ee}' +
    '#lbPanel #hxRt .hxRc{width:24px;height:24px;border-radius:50%;font-size:13px;flex:none}' +
    '#lbPanel #hxRt .rt>div:nth-child(1) .hxRc{background:linear-gradient(145deg,#fca5a5,#dc2626)}#lbPanel #hxRt .rt>div:nth-child(2) .hxRc{background:linear-gradient(145deg,#93c5fd,#2563eb)}#lbPanel #hxRt .rt>div:nth-child(3) .hxRc{background:linear-gradient(145deg,#86efac,#16a34a)}' +
    '#lbPanel #hxRt .rt b{display:block;margin-top:3px;font-size:20px;font-weight:800;color:#fff}' +
    '#lbPanel #hxRt .rt b i{font-style:normal;font-size:14px;opacity:.45;margin-left:1px}' +
    // ── online o‘yinchilar / do‘stlar (lobbyclient yozgan tugmalar)
    '#lbPanel #lbPl .tabs{display:grid!important;grid-template-columns:1fr 1fr;gap:8px!important;margin:0 0 8px!important}' +
    '#lbPanel #lbPl .tabs .lbtb{display:flex!important;align-items:center;gap:10px;min-width:0;padding:10px 12px!important;border-radius:16px!important;color:#fff!important;text-align:left;font:inherit;cursor:pointer;' + GL + '}' +
    '#lbPanel #lbPl .tabs .lbtb.on{background:rgba(29,78,216,.5)!important;border-color:rgba(232,196,106,.6)!important}' +
    '#lbPanel #lbPl .lbtb .lbtI{position:relative;width:34px;height:34px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;background:linear-gradient(145deg,#93c5fd,#1d4ed8);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 6px rgba(0,0,0,.25)}' +
    '#lbPanel #lbPl .lbtb[data-t="f"] .lbtI{background:linear-gradient(145deg,#e9d5ff,#7c3aed)}' +
    '#lbPanel #lbPl .lbtb .lbtOn{position:absolute;right:0;bottom:0;width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px #0e1650}' +
    '#lbPanel #lbPl .lbtb .lbtNew{position:absolute;right:-1px;top:-1px;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px #0e1650}' +
    '#lbPanel #lbPl .lbtb .lbtT{display:flex;flex-direction:column;min-width:0;line-height:1.2}' +
    '#lbPanel #lbPl .lbtb .lbtT small{font-size:11px;color:#b6c4ee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#lbPanel #lbPl .lbtb .lbtT b{font-size:16px;font-weight:800}' +
    // ── bo‘sh holat
    '#hxBot{padding:0 0 10px}#hxBot:empty{display:none}' +
    '#hxEmp{margin:4px 0 6px;padding:12px;border-radius:16px;border:1px dashed rgba(232,196,106,.35);text-align:center;font-size:13.5px;color:#dfe6ff}#hxEmp small{display:block;margin-top:3px;opacity:.7}';
  document.head.appendChild(st);

  // ✨ jonli effektlar (harakatlar) — admin Menyu'dan hamma uchun yoqadi / o‘chiradi (/api/home → fx).
  // Faqat transform / opacity: telefonni sekinlashtirmaydi; «harakatni kamaytirish» yoqilgan telefonda o‘chadi.
  var FX =
    '@keyframes hxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '@keyframes hxShine{0%{transform:translateX(-140%) skewX(-20deg)}60%,100%{transform:translateX(320%) skewX(-20deg)}}' +
    '@keyframes hxPulse{0%{transform:scale(1);opacity:.75}100%{transform:scale(2.6);opacity:0}}' +
    '@keyframes hxFlick{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.18) rotate(-7deg)}}' +
    '@keyframes hxIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
    '@keyframes hxGlow{0%,100%{opacity:.25}50%{opacity:.85}}' +
    '@keyframes hxCoin{0%,78%,100%{transform:rotateY(0)}89%{transform:rotateY(180deg)}}' +
    '@keyframes hxWig{0%,84%,100%{transform:rotate(0)}88%{transform:rotate(-14deg)}92%{transform:rotate(12deg)}96%{transform:rotate(-6deg)}}' +
    D3 + ' .hxIc{animation:hxFloat 3.2s ease-in-out infinite!important}' + D3 + ' #hxPzT .hxIc{animation-delay:.5s!important}' + D3 + ' #nvBotRow .hxIc{animation-delay:1s!important}' +
    H + ' #pfCard,' + H + ' #hxFrB,' + D3 + '>div,' + H + ' #hxLvW,' + H + ' #hxRt{animation:hxIn .5s cubic-bezier(.2,.8,.2,1) both!important}' +
    H + ' #hxFrB{animation-delay:.06s!important}' + D3 + ' #nvMemRow{animation-delay:.12s!important}' + D3 + ' #hxPzT{animation-delay:.18s!important}' + D3 + ' #nvBotRow{animation-delay:.24s!important}' + H + ' #hxLvW{animation-delay:.3s!important}' + H + ' #hxRt{animation-delay:.36s!important}' +
    H + ' #hxFrB::after{content:""!important;display:block!important;position:absolute;top:0;bottom:0;left:0;width:45%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);animation:hxShine 3.6s ease-in-out infinite!important;pointer-events:none}' +
    H + ' #hxFrB .hxEc{animation:hxWig 4s ease-in-out infinite!important}' +
    H + ' #hxChips #dqCard .f{display:inline-block!important;animation:hxFlick 1.8s ease-in-out infinite!important}' +
    H + ' #pfCard .pfCo{animation:hxCoin 4.5s ease-in-out infinite!important}' +
    '#lbPanel #lbPl .lbtb .lbtOn::after{content:""!important;display:block!important;position:absolute;inset:0;border-radius:50%;background:#22c55e;animation:hxPulse 1.6s ease-out infinite!important}' +
    '#lbPanel #hzLive .hzLvH>span::before{animation:hxGlow 1.4s ease-in-out infinite!important}' +
    '#nvPlayBtn{overflow:visible!important}#nvPlayBtn::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 20px 4px rgba(132,204,22,.6);animation:hxGlow 2.4s ease-in-out infinite;pointer-events:none}';
  var fxSt = document.createElement('style'); fxSt.id = 'hxFx';
  var RM = false; try { RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
  function fxSet(on) {
    on = on !== false; window.hxFx = on;
    try { localStorage.setItem('hxFx', on ? '1' : '0'); } catch (e) {}
    var t = on && !RM ? FX : '';
    if (fxSt.textContent !== t) fxSt.textContent = t;
    if (!fxSt.parentNode) document.head.appendChild(fxSt);
  }
  window.hxFxSet = fxSet;
  (function () { var v = '1'; try { v = localStorage.getItem('hxFx') || '1'; } catch (e) {} fxSet(v !== '0'); })();

  var D = null, dAt = 0, LD = null, ldAt = 0;
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function loadLd() {
    if (Date.now() - ldAt < 60000) return; ldAt = Date.now();
    fetch('/api/leaders').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) { LD = j; draw(); } }).catch(function () {});
  }
  // lenta: [kalit, emoji, rang, yozuv]
  var LDK = [['elo', '⚡', '#93c5fd,#2563eb', 'Reyting yetakchisi'], ['wins', '🏆', '#fde68a,#f59e0b', 'Eng ko‘p g‘alaba'], ['games', '🎮', '#d8b4fe,#8b5cf6', 'Eng ko‘p o‘yin'],
    ['best', '🔥', '#fdba74,#ea580c', 'Eng uzun seriya'], ['diamonds', '🪙', '#fef08a,#ca8a04', 'Boyvachcha'], ['tw', '👑', '#fbcfe8,#db2777', 'Turnir g‘olibi']];
  function load(force) {
    if (!idata() || (!force && Date.now() - dAt < 60000)) return;
    dAt = Date.now();
    fetch('/api/home', { headers: { 'x-init-data': idata() } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) { D = j; fxSet(j.fx); draw(); } }).catch(function () {});
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
    // 🏅 reyting lentasi
    var items = LD ? LDK.filter(function (k) { return LD[k[0]] && LD[k[0]].v > 0; }) : [];
    var tk = $('hxTick');
    if (items.length) {
      if (!tk) { tk = mk('hxTick'); tk.setAttribute('role', 'button'); tk.onclick = function () { nav(/Reyting|Рейтинг|Rating/); }; }
      var one = items.map(function (k) { var c = k[2].split(','), x = LD[k[0]]; return '<span class="it"><span class="e" style="background:linear-gradient(145deg,' + c[0] + ',' + c[1] + ')">' + k[1] + '</span><small>' + k[3] + '</small><b>' + esc(x.name) + '</b><i>' + num(x.v) + '</i></span><span class="sep">◆</span>'; }).join('');
      var th = '<div class="tr" style="animation-duration:' + Math.max(18, items.length * 7) + 's!important">' + one + one + '</div>';
      if (tk.__h !== th) { tk.innerHTML = th; tk.__h = th; }
      if (tk.parentNode !== hero) hero.insertBefore(tk, hero.firstChild);
      hero.classList.add('hxTk');
    } else { if (tk) tk.remove(); hero.classList.remove('hxTk'); }
    // 🎯 jonli stollar — o‘z o‘ramimizda (#hxLvW), uchta tugmadan keyin
    var lw = mk('hxLvW');
    if (lw.parentNode !== hero) hero.appendChild(lw);
    var lv = $('hzLive'); if (lv && lv.parentNode !== lw) lw.appendChild(lv);
    // 🔗 Do‘st bilan o‘ynash — profil kartasining o‘ng tomonida
    var fb = $('hxFrB');
    if (!fb) {
      fb = mk('hxFrB'); fb.setAttribute('role', 'button');
      fb.innerHTML = em('🔗', 'hxEc') + '<b>Do‘st bilan o‘ynash</b><small>Havola yuboring</small>';
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
      var ph = '<span class="hxIc">🧩</span><div><b>Kunlik masala</b><small>' + (day ? 'Bugun ' + day + ' ta' : 'Bugungi masala') + '</small></div>';
      if (pt.__h !== ph) { pt.innerHTML = ph; pt.__h = ph; }
      if (pt.parentNode !== duo) duo.insertBefore(pt, bt && bt.parentNode === duo ? bt : null);
      if (mem && mem.dataset.mini && !mem.__hx) {
        mem.__hx = 1;
        var s0 = mem.querySelector('span'); if (s0) { s0.removeAttribute('style'); s0.className = 'hxIc'; s0.textContent = '🎮'; }
        var d0 = mem.querySelector('div'), b0 = d0 && d0.querySelector('b');
        if (b0 && !d0.querySelector('.hxSub')) { var sm = document.createElement('small'); sm.className = 'hxSub'; sm.textContent = 'Tez o‘yinlar'; d0.insertBefore(sm, b0.nextSibling); }
      }
      if (bt && !bt.__hx) {
        bt.__hx = 1;
        var ib = document.createElement('span'); ib.className = 'hxIc'; ib.textContent = '🤖'; bt.insertBefore(ib, bt.firstChild);
        var b1 = bt.querySelector('div b'); if (b1) b1.textContent = 'Botlar';
      }
    }
    // 📊 reytinglar
    var RT = (D && D.rt) || {}, cell = function (k, e, lb) { var x = RT[k] || { r: 1500, prov: true }; return '<div data-x="rk"><span class="lab">' + em(e, 'hxRc') + '<span>' + lb + '</span></span><b>' + x.r + (x.prov ? '<i>?</i>' : '') + '</b></div>'; };
    var rt = el('hxRt', '<div class="hxH">Reytinglar</div><div class="rt">' + cell('bullet', '🚀', 'Bullet') + cell('blits', '⚡', 'Blits') + cell('rapid', '⏱️', 'Rapid') + '</div>');
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
  setInterval(function () { var hero = $('hzHero'); if (!hero || !hero.offsetParent) return; load(); loadLd(); try { draw(); } catch (e) {} }, 1000);
  // o‘yindan qaytganda yangilaymiz
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(true); });
  window.hxRefresh = function () { load(true); };
})();
