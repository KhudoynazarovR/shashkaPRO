/* pzmapview.js — 🗺 Masalalar xaritasi: har 10 ta masala — bitta manzara (rasm), yo'l bo'ylab bekatlar.
   Odamcha yechilgan masaladan keyingisiga qadam bosib boradi (animatsiya).
   Admin har papka uchun o'z rasmlarini joylaydi va bekatlar joyini barmoq bilan belgilaydi.
   API: spPzMap.load(cb), spPzMap.html(items, key, admin), spPzMap.after(root, key, onPlay) */
;(function () {
  if (window.spPzMap) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  function api(p, body) {
    return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': (tg && tg.initData) || '' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  var PER = 10;
  // standart manzaralar (bekatlar — rasm ichidagi %)
  var DEF = [
    { u: '/img/pzzone1.webp?v=1', w: 768, h: 758, pts: [[41.8, 87.6], [62.5, 75.7], [33.9, 68.3], [72.3, 58.4], [52.1, 51.7], [33.5, 39.1], [69.8, 33.7], [36.7, 21.8], [66.0, 15.3], [50.3, 5.6]] },
    { u: '/img/pzzone2.webp?v=1', w: 768, h: 758, pts: [[35.2, 89.1], [68.8, 85.1], [26.9, 64.4], [55.0, 70.3], [43.9, 43.6], [75.9, 50.5], [26.2, 27.7], [50.9, 17.3], [80.9, 23.8], [67.6, 5.6]] },
    { u: '/img/pzzone3.webp?v=1', w: 768, h: 758, pts: [[76.0, 94.5], [57.8, 88.6], [42.3, 76.7], [59.2, 68.0], [33.2, 58.4], [43.0, 51.0], [50.5, 44.5], [57.9, 33.0], [35.8, 23.8], [51.7, 10.6]] }
  ];
  var GEN = [[50, 90], [70, 80], [40, 71], [64, 61], [34, 52], [58, 43], [32, 34], [62, 25], [42, 16], [56, 7]];
  var MAPS = {};
  function zonesOf(key) {
    var z = (MAPS[key] && MAPS[key].length) ? MAPS[key] : (MAPS[''] && MAPS[''].length ? MAPS[''] : null);
    if (!z) return DEF;
    return z.map(function (x) { return { u: '/api/pzmap/img?id=' + encodeURIComponent(x.id), w: x.w || 768, h: x.h || 758, pts: x.pts && x.pts.length === PER ? x.pts : GEN }; });
  }
  function load(cb) { api('/api/pzmap').then(function (d) { if (d && d.maps) MAPS = d.maps; if (cb) cb(); }); }
  function css() {
    if (document.getElementById('pzMapCss')) return;
    var s = document.createElement('style'); s.id = 'pzMapCss';
    s.textContent = '#pzScroll{position:relative;height:min(66vh,620px);overflow-y:auto;-webkit-overflow-scrolling:touch;margin:10px 0;border:3px solid #f5c542;border-radius:18px;box-shadow:0 0 0 2px #7a5a10,0 6px 18px rgba(0,0,0,.45);background:#0b1a33}' +
      '.pzZone{position:relative;width:100%;background-size:100% 100%;background-repeat:no-repeat}' +
      '.pzZt{position:absolute;left:8px;bottom:8px;z-index:2;background:rgba(0,0,0,.55);color:#fff;font:700 12px/1 system-ui,sans-serif;padding:6px 10px;border-radius:12px}' +
      '.pzN{position:absolute;z-index:3;transform:translate(-50%,-50%);width:17%;aspect-ratio:1;border-radius:50%;border:3px solid rgba(255,255,255,.9);color:#fff;font:900 clamp(15px,5vw,24px)/1 system-ui,sans-serif;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-shadow:0 2px 2px rgba(0,0,0,.45);box-shadow:0 5px 0 rgba(0,0,0,.35),0 0 14px rgba(0,0,0,.35)}' +
      '.pzN small{font-size:.55em;line-height:1}.pzN.d{background:radial-gradient(circle at 35% 30%,#7ef07a,#1f9a2a 60%,#0f5e16)}' +
      '.pzN.c{background:radial-gradient(circle at 35% 30%,#ffe58a,#f5a623 60%,#b86a00);animation:pzPulse 1.4s ease-in-out infinite;box-shadow:0 5px 0 rgba(0,0,0,.35),0 0 22px #ffd54f}' +
      '.pzN.o{background:radial-gradient(circle at 35% 30%,#e7b678,#a8692c 60%,#6b3d12)}.pzN.l{background:radial-gradient(circle at 35% 30%,#e8eef1,#9fb2bb 60%,#6c7d86);color:#3b4a52;text-shadow:none}' +
      '#pzHero{position:absolute;z-index:6;width:17%;transform:translate(-50%,-90%);pointer-events:none;will-change:left,top}' +
      '#pzHeroW{display:inline-block;transition:transform .15s}#pzHeroB{display:block;transform-origin:50% 100%;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}' +
      '#pzHeroB.idle{animation:pzIdle 2.4s ease-in-out infinite}#pzHeroB.walk{animation:pzWalk .36s ease-in-out infinite alternate}#pzHeroB.joy{animation:pzJoy .9s ease-out 2}' +
      '.pzSh{position:absolute;left:50%;bottom:-2px;width:70%;height:8%;margin-left:-35%;border-radius:50%;background:rgba(0,0,0,.35);filter:blur(2px);animation:pzShI 1.6s ease-in-out infinite}' +
      '@keyframes pzIdle{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.98)}}' +
      '@keyframes pzShI{0%,100%{transform:scaleX(1);opacity:.35}50%{transform:scaleX(.85);opacity:.25}}' +
      '@keyframes pzWalk{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-4%) rotate(3deg)}}' +
      '@keyframes pzJoy{0%{transform:translateY(0) scale(1)}20%{transform:translateY(0) scale(1.15,.85)}45%{transform:translateY(-45%) scale(.92,1.1) rotate(-8deg)}70%{transform:translateY(0) scale(1.12,.88)}100%{transform:translateY(0) scale(1)}}' +
      '@keyframes pzPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}}' +
      '.pzFx{position:absolute;z-index:7;pointer-events:none;transform:translate(-50%,-50%);font-size:clamp(14px,4.5vw,22px);animation:pzFx .8s ease-out forwards}' +
      '@keyframes pzFx{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.2)}}' +
      '.pzN.pop{animation:pzPop .5s ease-out}@keyframes pzPop{0%{transform:translate(-50%,-50%) scale(1)}40%{transform:translate(-50%,-50%) scale(1.35)}100%{transform:translate(-50%,-50%) scale(1)}}' +
      '.pzBar{display:flex;justify-content:space-between;gap:8px;margin-top:8px}.pzHeroPick{margin:0;border:0;border-radius:10px;padding:6px 12px;background:#6b5cf0;color:#fff;font:700 14px system-ui}.pzMapEd{margin:0;border:0;border-radius:10px;padding:7px 12px;background:#2b3270;color:#fff;font:700 13px system-ui}';
    document.head.appendChild(s);
  }
  // items: [{i, done}] — tartibda; key: '' (umumiy) yoki papka nomi
  // ---------------- 🧍 Harakatlanuvchi qahramon (SVG): oyoq-qo'llari yuradi, ko'zini pirpiratadi, quvonganda qo'l ko'taradi
  var HV = {
    '🧑‍🎓': { sk: '#f6c9a0', hr: '#5b3a1e', hs: 'short', top: '#3b82f6', bot: '#1e293b', hat: 'grad' },
    '👦': { sk: '#e9b48a', hr: '#1f1f1f', hs: 'short', top: '#ef4444', bot: '#2563eb', hat: 'cap' },
    '👧': { sk: '#f6c9a0', hr: '#7a4520', hs: 'braids', top: '#ec4899', bot: '#ec4899', dress: 1, hat: 'bow', pretty: '#7a4520' },
    '🐻': { sk: '#f6c9a0', hood: '#8b5a2b', ear: 'round', top: '#8b5a2b', bot: '#6b4220', belly: '#d9a066' },
    '🦊': { sk: '#f6c9a0', hood: '#f97316', ear: 'point', top: '#f97316', bot: '#7c2d12', belly: '#fff7ed', tail: '#f97316' },
    '🐼': { sk: '#f6c9a0', hood: '#f8fafc', ear: 'roundk', top: '#111827', bot: '#111827', belly: '#f8fafc', patch: 1 },
    '🐱': { sk: '#f6c9a0', hood: '#9ca3af', ear: 'point', top: '#9ca3af', bot: '#4b5563', belly: '#e5e7eb', tail: '#9ca3af', whisk: 1 },
    '🥷': { sk: '#e9b48a', hr: '#111', hs: 'none', top: '#1f2937', bot: '#111827', hat: 'ninja' },
    '🧙': { sk: '#f6c9a0', hr: '#9ca3af', hs: 'short', top: '#6d28d9', bot: '#6d28d9', dress: 1, hat: 'wizard' },
    '🧚': { sk: '#f9d5b5', hr: '#f59e0b', hs: 'long', top: '#22c55e', bot: '#22c55e', dress: 1, hat: 'tiara', wings: 1, pretty: '#15803d', aura: 'star' },
    '🦸': { sk: '#e9b48a', hr: '#1f1f1f', hs: 'short', top: '#2563eb', bot: '#2563eb', cape: '#dc2626', mask: 1, emb: 1 },
    '👸': { sk: '#fde8dc', hr: '#f8fafc', hs: 'long', top: '#7dd3fc', bot: '#bae6fd', gown: ['#f0f9ff', '#7dd3fc', '#0284c7'], hat: 'ice', cape: '#bae6fd', capeOp: .6, pretty: '#0ea5e9', aura: 'snow' },
    '🌸': { sk: '#f9d5b5', hr: '#8b4513', hs: 'long', top: '#f9a8d4', bot: '#f9a8d4', gown: ['#fdf2f8', '#f9a8d4', '#db2777'], hat: 'flower', pretty: '#16a34a', aura: 'petal' },
    '🌙': { sk: '#f3d2b8', hr: '#1e1b4b', hs: 'long', top: '#4338ca', bot: '#4338ca', gown: ['#6366f1', '#312e81', '#0f172a'], hat: 'moon', cape: '#1e1b4b', capeOp: .85, pretty: '#8b5cf6', aura: 'star' },
    '🤴': { sk: '#e9b48a', hr: '#5b3a1e', hs: 'short', top: '#f59e0b', bot: '#7c2d12', hat: 'crown', cape: '#b91c1c' },
    '🦄': { sk: '#f6c9a0', hood: '#fdf4ff', ear: 'point', horn: 1, top: '#f5d0fe', bot: '#c084fc', belly: '#fff', mane: 1 },
    '🐉': { sk: '#f6c9a0', hood: '#16a34a', ear: 'spike', top: '#16a34a', bot: '#14532d', belly: '#bbf7d0', tail: '#16a34a', dwing: 1 },
    '🤖': { robot: 1, top: '#94a3b8', bot: '#64748b' },
    '👑': { sk: '#e9b48a', hr: '#3f2a14', hs: 'short', top: '#111827', bot: '#111827', hat: 'crown', cape: 'chk' }
  };
  var _hid = 0;
  function heroSvg(id) {
    var v = HV[id] || HV['🧑‍🎓'], u = 'h' + (++_hid), O = 'stroke="#2a1a10" stroke-width="1.6" stroke-linejoin="round"', s = '';
    s += '<svg class="pzH" viewBox="0 0 60 92" width="100%" style="display:block;overflow:visible">';
    if (v.gown) s += '<defs><linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + v.gown[0] + '"/><stop offset=".55" stop-color="' + v.gown[1] + '"/><stop offset="1" stop-color="' + v.gown[2] + '"/></linearGradient><radialGradient id="' + u + 's" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
    if (v.aura) {   // atrofida uchib yurgan qor parchalari / gul barglari / yulduzlar
      var AU = { snow: '<path d="M0 -3V3M-2.6 -1.5L2.6 1.5M-2.6 1.5L2.6 -1.5" stroke="#e0f2fe" stroke-width="1" stroke-linecap="round"/>', petal: '<ellipse rx="1.6" ry="2.6" fill="#f9a8d4" transform="rotate(30)"/>', star: '<path d="M0 -3L.9 -.9L3 0L.9 .9L0 3L-.9 .9L-3 0L-.9 -.9Z" fill="#fde68a"/>' }[v.aura];
      [[6, 30, 0], [54, 22, .7], [10, 62, 1.4], [52, 58, 2.1], [30, -6, 2.8], [4, 46, 3.5]].forEach(function (q) { s += '<g transform="translate(' + q[0] + ' ' + q[1] + ')"><g class="hAu" style="animation-delay:-' + q[2] + 's">' + AU + '</g></g>'; });
    }
    if (v.cape === 'chk') s += '<defs><pattern id="' + u + 'c" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#f8fafc"/><rect width="3" height="3" fill="#111"/><rect x="3" y="3" width="3" height="3" fill="#111"/></pattern></defs>';
    // orqa: qanot, plash, dum
    if (v.wings) s += '<g class="hWg"><ellipse cx="19" cy="44" rx="11" ry="15" fill="#a5f3fc" opacity=".75" ' + O + '/><ellipse cx="41" cy="44" rx="11" ry="15" fill="#a5f3fc" opacity=".75" ' + O + '/></g>';
    if (v.dwing) s += '<g class="hWg"><path d="M24 42 L6 30 L10 44 L4 50 L22 50Z" fill="#22c55e" ' + O + '/><path d="M36 42 L54 30 L50 44 L56 50 L38 50Z" fill="#22c55e" ' + O + '/></g>';
    if (v.cape) s += '<path class="hCp" d="M21 38 L39 38 L' + (v.gown ? '50 84 Q30 90 10 84' : '46 76 Q30 82 14 76') + 'Z" fill="' + (v.cape === 'chk' ? 'url(#' + u + 'c)' : v.cape) + '"' + (v.capeOp ? ' fill-opacity="' + v.capeOp + '"' : '') + ' ' + O + '/>';
    if (v.tail) s += '<path class="hTl" d="M36 60 Q52 62 52 48 Q56 58 46 66 Q40 68 36 64Z" fill="' + v.tail + '" ' + O + '/>' + (id === '🦊' ? '<path d="M50 50 Q54 56 49 60 Q51 54 50 50Z" fill="#fff"/>' : '');
    // oyoqlar
    var leg = function (c, x) { return '<g class="' + c + '"><rect x="' + x + '" y="58" width="9.5" height="22" rx="4.5" fill="' + v.bot + '" ' + O + '/><ellipse cx="' + (x + 6) + '" cy="82" rx="7" ry="4" fill="' + (v.robot ? '#475569' : '#3b2416') + '" ' + O + '/></g>'; };
    s += leg('hLb', 27) + leg('hLf', 23.5);
    // orqa qo'l
    var arm = function (c, x) { return '<g class="' + c + '"><rect x="' + (x - 4) + '" y="39" width="8" height="17" rx="4" fill="' + v.top + '" ' + O + '/><circle cx="' + x + '" cy="57" r="4.4" fill="' + (v.robot ? '#cbd5e1' : v.sk) + '" ' + O + '/></g>'; };
    s += arm('hAb', 40);
    // tana
    if (v.gown) s += '<g class="hGn"><path d="M22 36 L38 36 Q40 52 49 80 Q30 87 11 80 Q20 52 22 36Z" fill="url(#' + u + 'g)" ' + O + '/><path d="M12 79 Q16 76 20 80 Q25 77 30 81 Q35 77 40 80 Q44 76 48 79" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1.4"/><ellipse cx="27" cy="54" rx="5" ry="12" fill="url(#' + u + 's)" opacity=".7"/><circle cx="24" cy="66" r=".9" fill="#fff"/><circle cx="35" cy="60" r=".8" fill="#fff"/><circle cx="31" cy="72" r=".9" fill="#fff"/><circle cx="20" cy="74" r=".7" fill="#fff"/><circle cx="40" cy="70" r=".8" fill="#fff"/></g><path d="M22 36 L38 36 L37 46 Q30 49 23 46Z" fill="' + v.top + '" ' + O + '/><path d="M23 45 Q30 48 37 45" stroke="#fde68a" stroke-width="1.6" fill="none"/>';
    else if (v.dress) s += '<path d="M20 37 L40 37 L46 66 Q30 71 14 66Z" fill="' + v.top + '" ' + O + '/><path d="M18 62 Q30 66 42 62" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>';
    else s += '<rect x="18" y="36" width="24" height="25" rx="8" fill="' + v.top + '" ' + O + '/>';
    if (v.belly) s += '<ellipse cx="30" cy="51" rx="6.5" ry="8" fill="' + v.belly + '"/>';
    if (v.emb) s += '<path d="M25 46 L30 42 L35 46 L30 54Z" fill="#facc15" ' + O + '/>';
    if (v.robot) s += '<rect x="25" y="44" width="10" height="7" rx="1.5" fill="#0f172a"/><circle class="hLed" cx="28" cy="47.5" r="1.3" fill="#22d3ee"/><circle cx="32" cy="47.5" r="1.3" fill="#f43f5e"/>';
    // bosh
    s += '<g class="hHd">';
    if (v.robot) {
      s += '<line x1="30" y1="6" x2="30" y2="12" stroke="#475569" stroke-width="2"/><circle class="hLed" cx="30" cy="5" r="2.6" fill="#f43f5e" ' + O + '/>';
      s += '<rect x="16" y="11" width="28" height="25" rx="7" fill="#cbd5e1" ' + O + '/><rect x="19.5" y="16" width="21" height="11" rx="4" fill="#0f172a"/>';
      s += '<g class="hEy"><rect x="22.5" y="19" width="5" height="5" rx="2" fill="#22d3ee"/><rect x="32.5" y="19" width="5" height="5" rx="2" fill="#22d3ee"/></g><rect x="25" y="30" width="10" height="2" rx="1" fill="#475569"/>';
    } else {
      if (v.hs === 'long' || v.hs === 'braids') s += '<path d="M15 22 Q14 44 20 50 L40 50 Q46 44 45 22Z" fill="' + v.hr + '" ' + O + '/>';
      if (v.hs === 'braids') s += '<path class="hBr" d="M16 30 Q10 44 14 54" fill="none" stroke="' + v.hr + '" stroke-width="5" stroke-linecap="round"/><path class="hBr" d="M44 30 Q50 44 46 54" fill="none" stroke="' + v.hr + '" stroke-width="5" stroke-linecap="round"/>';
      if (v.hood) {   // kostyum qalpog'i
        if (v.ear === 'round' || v.ear === 'roundk') { var ec = v.ear === 'roundk' ? '#111' : v.hood; s += '<circle cx="17" cy="11" r="5.5" fill="' + ec + '" ' + O + '/><circle cx="43" cy="11" r="5.5" fill="' + ec + '" ' + O + '/>'; }
        if (v.ear === 'point') s += '<path d="M14 18 L16 3 L25 12Z" fill="' + v.hood + '" ' + O + '/><path d="M46 18 L44 3 L35 12Z" fill="' + v.hood + '" ' + O + '/><path d="M16.5 14 L17 7 L21 11Z" fill="#fca5a5"/><path d="M43.5 14 L43 7 L39 11Z" fill="#fca5a5"/>';
        if (v.ear === 'spike') s += '<path d="M20 9 L23 1 L27 8 L30 0 L33 8 L37 1 L40 9Z" fill="#facc15" ' + O + '/>';
        s += '<circle cx="30" cy="23" r="16" fill="' + v.hood + '" ' + O + '/>';
        if (v.horn) s += '<path d="M27 8 L30 -6 L33 8Z" fill="#fde047" ' + O + '/>';
        if (v.mane) s += '<path class="hBr" d="M44 14 Q52 22 46 34 Q50 24 42 18Z" fill="#f472b6"/><path class="hBr" d="M42 10 Q50 12 50 22 Q46 14 40 14Z" fill="#60a5fa"/>';
      }
      s += '<circle cx="30" cy="24" r="12.5" fill="' + v.sk + '" ' + O + '/>';
      if (v.patch) s += '<ellipse cx="25" cy="23" rx="3.6" ry="4.4" fill="#111" transform="rotate(-20 25 23)"/><ellipse cx="35" cy="23" rx="3.6" ry="4.4" fill="#111" transform="rotate(20 35 23)"/>';
      if (v.hs === 'short') s += '<path d="M17.5 22 Q18 10 30 10 Q43 10 42.5 22 Q38 15 30 16 Q22 15 17.5 22Z" fill="' + v.hr + '" ' + O + '/>';
      if (v.hs === 'long' || v.hs === 'braids') s += '<path d="M17 24 Q16 10 30 10 Q44 10 43 24 Q40 14 33 15 Q30 20 22 18 Q19 20 17 24Z" fill="' + v.hr + '" ' + O + '/>';
      if (v.mask) s += '<path d="M18 21 Q30 17 42 21 L41 26 Q30 23 19 26Z" fill="#111"/>';
      // ko'zlar (pirpiratadi)
      if (v.pretty) s += '<g class="hEy"><ellipse cx="25.3" cy="24.3" rx="2.5" ry="3.2" fill="#1f130b"/><ellipse cx="34.7" cy="24.3" rx="2.5" ry="3.2" fill="#1f130b"/><ellipse cx="25.3" cy="25" rx="1.8" ry="2.2" fill="' + v.pretty + '"/><ellipse cx="34.7" cy="25" rx="1.8" ry="2.2" fill="' + v.pretty + '"/><circle cx="26.2" cy="23.2" r="1" fill="#fff"/><circle cx="35.6" cy="23.2" r="1" fill="#fff"/><circle cx="24.6" cy="26" r=".5" fill="#fff"/><circle cx="34" cy="26" r=".5" fill="#fff"/><path d="M22.5 22 L21.3 20.8 M23.6 21.3 L22.9 19.9 M37.5 22 L38.7 20.8 M36.4 21.3 L37.1 19.9" stroke="#1f130b" stroke-width=".8" stroke-linecap="round"/></g>';
      else s += '<g class="hEy"><ellipse cx="25.5" cy="24" rx="2" ry="2.6" fill="' + (v.mask || v.patch ? '#fff' : '#1f130b') + '"/><ellipse cx="34.5" cy="24" rx="2" ry="2.6" fill="' + (v.mask || v.patch ? '#fff' : '#1f130b') + '"/>' + (v.mask || v.patch ? '<circle cx="25.8" cy="24.3" r="1.1" fill="#111"/><circle cx="34.8" cy="24.3" r="1.1" fill="#111"/>' : '<circle cx="26.2" cy="23.2" r=".8" fill="#fff"/><circle cx="35.2" cy="23.2" r=".8" fill="#fff"/>') + '</g>';
      s += '<ellipse cx="21.5" cy="29" rx="2.2" ry="1.3" fill="#f87171" opacity=".45"/><ellipse cx="38.5" cy="29" rx="2.2" ry="1.3" fill="#f87171" opacity=".45"/>';
      if (v.hat === 'ninja') s += '<rect x="17" y="26.5" width="26" height="9" rx="4" fill="#1f2937"/><path d="M17 17 Q30 13 43 17 L43 21 Q30 18 17 21Z" fill="#dc2626"/><path class="hBr" d="M42 18 Q50 16 54 22 M42 20 Q49 22 52 28" fill="none" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/>';
      else if (v.pretty) s += '<path class="hMo" d="M27.2 30.4 Q30 32.8 32.8 30.4 Q30 31.4 27.2 30.4Z" fill="#e11d48" stroke="#be123c" stroke-width=".7"/>';
      else s += '<path class="hMo" d="M26 30 Q30 33.5 34 30" fill="none" stroke="#7c2d12" stroke-width="1.6" stroke-linecap="round"/>';
      if (v.whisk) s += '<path d="M19 29 L12 28 M19 31 L12 32 M41 29 L48 28 M41 31 L48 32" stroke="#4b5563" stroke-width="1"/>';
      if (v.hat === 'grad') s += '<path d="M14 13 L30 6 L46 13 L30 19Z" fill="#111827" ' + O + '/><rect x="23" y="13" width="14" height="5" fill="#111827"/><path class="hBr" d="M44 13 L45 22" stroke="#facc15" stroke-width="1.6"/><circle cx="45" cy="23" r="1.6" fill="#facc15"/>';
      if (v.hat === 'cap') s += '<path d="M17.5 18 Q18 8 30 8 Q42 8 42.5 18Z" fill="#f97316" ' + O + '/><path d="M40 17 L50 18 Q48 21 40 20Z" fill="#ea580c" ' + O + '/>';
      if (v.hat === 'bow') s += '<path d="M38 12 L46 8 L45 16Z M38 12 L33 6 L34 15Z" fill="#f43f5e" ' + O + '/><circle cx="38" cy="12" r="2" fill="#be123c"/>';
      if (v.hat === 'wizard') s += '<path d="M14 15 Q30 20 46 15 L40 13 L31 -10 L22 13Z" fill="#7c3aed" ' + O + '/><circle cx="27" cy="5" r="1.4" fill="#fde047"/><circle cx="33" cy="9" r="1.1" fill="#fde047"/><path d="M29 -1 l1 2 l2 .3 l-1.5 1.3 l.4 2 l-1.9 -1 l-1.9 1 l.4 -2 l-1.5 -1.3 l2 -.3Z" fill="#fde047"/>';
      if (v.hat === 'tiara') s += '<path d="M22 13 L25 8 L28 12 L30 6 L32 12 L35 8 L38 13Z" fill="#fde047" ' + O + '/>';
      if (v.hat === 'crown') s += '<path d="M20 14 L20 3 L25 9 L30 1 L35 9 L40 3 L40 14Z" fill="#facc15" ' + O + '/><circle cx="30" cy="10" r="1.8" fill="#dc2626"/><circle cx="24" cy="11" r="1.2" fill="#2563eb"/><circle cx="36" cy="11" r="1.2" fill="#16a34a"/>';
      if (v.hat === 'ice') s += '<path d="M18 14 L19 5 L23 10 L25 1 L28 9 L30 -5 L32 9 L35 1 L37 10 L41 5 L42 14Z" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="1.2" stroke-linejoin="round"/><path d="M30 -1 L30 8 M26.5 3.5 L33.5 3.5 M27.5 1 L32.5 6 M32.5 1 L27.5 6" stroke="#38bdf8" stroke-width=".9"/><circle cx="30" cy="11.5" r="1.6" fill="#38bdf8"/><circle class="hTw" cx="25" cy="3" r=".9" fill="#fff"/><circle class="hTw" cx="35" cy="3" r=".9" fill="#fff" style="animation-delay:-.6s"/>';
      if (v.hat === 'flower') s += [[19, 14, '#f472b6'], [23, 11, '#fde047'], [27, 9.5, '#f9a8d4'], [33, 9.5, '#fde047'], [37, 11, '#f472b6'], [41, 14, '#f9a8d4'], [30, 9, '#fb7185']].map(function (f) { return '<g transform="translate(' + f[0] + ' ' + f[1] + ')"><circle r="2.4" fill="' + f[2] + '" stroke="#be185d" stroke-width=".6"/><circle r=".9" fill="#fef3c7"/></g>'; }).join('') + '<path d="M17 15 Q14 13 15 11 M43 15 Q46 13 45 11" stroke="#16a34a" stroke-width="1.4" fill="none"/>';
      if (v.hat === 'moon') s += '<path d="M22 13 Q30 7 38 13" fill="none" stroke="#e5e7eb" stroke-width="1.6"/><path d="M31 1 A5 5 0 1 0 31 11 A3.6 3.6 0 1 1 31 1Z" fill="#fde68a" stroke="#ca8a04" stroke-width=".8"/><circle class="hTw" cx="36" cy="3" r=".9" fill="#fff"/><circle class="hTw" cx="24" cy="6" r=".8" fill="#fff" style="animation-delay:-.8s"/>';
    }
    s += '</g>';
    // old qo'l
    s += arm('hAf', 20);
    s += '</svg>';
    return s;
  }
  var HCSS = '.pzH .hLf{transform-origin:28px 60px}.pzH .hLb{transform-origin:32px 60px}.pzH .hAf{transform-origin:20px 41px}.pzH .hAb{transform-origin:40px 41px}.pzH .hHd{transform-origin:30px 36px}.pzH .hCp,.pzH .hTl{transform-origin:30px 40px}.pzH .hWg{transform-origin:30px 44px}.pzH .hEy{transform-origin:30px 24px;animation:hBlink 3.6s infinite}.pzH .hBr{transform-origin:30px 28px}' +
    '@keyframes hBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    // turish: nafas, qo'l chayqalishi
    '.idle .pzH .hAf{animation:hSw 2.4s ease-in-out infinite}.idle .pzH .hAb{animation:hSw 2.4s ease-in-out infinite reverse}.idle .pzH .hHd{animation:hNod 3.2s ease-in-out infinite}.idle .pzH .hCp,.idle .pzH .hTl{animation:hCp 2s ease-in-out infinite}.idle .pzH .hWg{animation:hWg .5s ease-in-out infinite}' +
    '@keyframes hSw{0%,100%{transform:rotate(5deg)}50%{transform:rotate(-3deg)}}@keyframes hNod{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes hCp{0%,100%{transform:skewX(-4deg)}50%{transform:skewX(4deg)}}@keyframes hWg{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.75)}}' +
    // yurish: oyoq-qo'l almashib, tana tebranib
    '.walk .pzH .hLf{animation:hStep .36s ease-in-out infinite alternate}.walk .pzH .hLb{animation:hStep .36s ease-in-out infinite alternate-reverse}' +
    '.walk .pzH .hAf{animation:hArm .36s ease-in-out infinite alternate-reverse}.walk .pzH .hAb{animation:hArm .36s ease-in-out infinite alternate}' +
    '.walk .pzH .hCp,.walk .pzH .hTl{animation:hCpW .36s ease-in-out infinite alternate}.walk .pzH .hBr{animation:hNod .36s ease-in-out infinite alternate}.walk .pzH .hWg{animation:hWg .25s ease-in-out infinite}' +
    '@keyframes hStep{from{transform:rotate(28deg)}to{transform:rotate(-28deg)}}@keyframes hArm{from{transform:rotate(26deg)}to{transform:rotate(-26deg)}}@keyframes hCpW{from{transform:skewX(-14deg) rotate(6deg)}to{transform:skewX(-4deg) rotate(10deg)}}' +
    // quvonch: ikki qo'l yuqoriga, oyoq yoyiladi
    '.joy .pzH .hAf{animation:hUpF .45s ease-in-out infinite alternate}.joy .pzH .hAb{animation:hUpB .45s ease-in-out infinite alternate}.joy .pzH .hLf{transform:rotate(-10deg)}.joy .pzH .hLb{transform:rotate(10deg)}.joy .pzH .hMo{transform:scale(1.3,1.6);transform-origin:30px 31px}.joy .pzH .hWg{animation:hWg .2s infinite}' +
    '@keyframes hUpF{from{transform:rotate(150deg)}to{transform:rotate(120deg)}}@keyframes hUpB{from{transform:rotate(-150deg)}to{transform:rotate(-120deg)}}' +
    '.pzH .hLed{animation:hLed 1s steps(2) infinite}@keyframes hLed{50%{opacity:.25}}' +
    '.pzH .hGn{transform-origin:30px 40px}.walk .pzH .hGn{animation:hGnW .36s ease-in-out infinite alternate}.idle .pzH .hGn{animation:hGnI 3s ease-in-out infinite}' +
    '@keyframes hGnW{from{transform:skewX(-6deg)}to{transform:skewX(6deg)}}@keyframes hGnI{0%,100%{transform:skewX(-1.5deg)}50%{transform:skewX(1.5deg)}}' +
    '.pzH .hAu{transform-box:fill-box;transform-origin:center;animation:hAu 3.5s ease-in-out infinite}@keyframes hAu{0%{transform:translate(0,0) rotate(0) scale(.6);opacity:0}25%{opacity:1}50%{transform:translate(3px,-6px) rotate(120deg) scale(1.1);opacity:1}100%{transform:translate(-2px,-12px) rotate(240deg) scale(.6);opacity:0}}' +
    '.pzH .hTw{animation:hTw 1.4s ease-in-out infinite}@keyframes hTw{0%,100%{opacity:.2}50%{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.pzH *{animation:none!important}}';
  function heroCss() { if (document.getElementById('pzHeroCss')) return; var st = document.createElement('style'); st.id = 'pzHeroCss'; st.textContent = HCSS; document.head.appendChild(st); }
  // 🧑‍🎓 Qahramonlar: ko'proq masala yechgan sari yangilari ochiladi
  var HEROES = [
    ['🧑‍🎓', 'Talaba', 0], ['👦', 'Bola', 0], ['👧', 'Qizcha', 0], ['🐻', 'Ayiqcha', 15], ['🦊', 'Tulki', 30], ['🐼', 'Panda', 50],
    ['🐱', 'Mushukcha', 75], ['🥷', 'Ninja', 100], ['🧙', 'Sehrgar', 150], ['🧚', 'Pari', 200], ['🌸', 'Gul malikasi', 250], ['🦸', 'Qahramon', 300], ['🌙', 'Oy malikasi', 350], ['👸', 'Qor malikasi', 400],
    ['🤴', 'Shahzoda', 500], ['🦄', 'Yolqinli ot', 600], ['🐉', 'Ajdar', 750], ['🤖', 'Robot', 900], ['👑', 'Shashka qiroli', 1100]
  ];
  var HS = { av: '', n: 0, save: null };
  function heroAv() { for (var i = 0; i < HEROES.length; i++) if (HEROES[i][0] === HS.av && HS.n >= HEROES[i][2]) return HS.av; return HEROES[0][0]; }
  function setHero(av, n, save) { HS.av = av || ''; HS.n = n || 0; HS.save = save; }
  function picker(onDone) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(5,8,25,.96);color:#fff;overflow:auto;padding:16px;font:15px system-ui,sans-serif;box-sizing:border-box';
    var cur = heroAv(), h = '<div style="display:flex;align-items:center;margin-bottom:6px"><b style="flex:1;font-size:19px">🧑‍🎓 Qahramon tanlang</b><button data-x style="border:0;border-radius:10px;padding:8px 12px;background:#2b3270;color:#fff;font-size:16px">✕</button></div>' +
      '<div style="font-size:13px;opacity:.75;margin-bottom:12px">Siz yechgan masalalar: <b>' + HS.n + '</b>. Ko‘proq yeching — yangi qahramonlar ochiladi!</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
    HEROES.forEach(function (x) {
      var ok = HS.n >= x[2], on = x[0] === cur;
      h += '<button data-av="' + x[0] + '" ' + (ok ? '' : 'disabled') + ' style="position:relative;border:' + (on ? '3px solid #ffd54f' : '2px solid #2b3270') + ';border-radius:16px;padding:10px 4px;background:' + (on ? '#3a3a10' : '#161c45') + ';color:#fff;opacity:' + (ok ? 1 : .55) + '">' +
        '<div class="' + (on ? 'idle' : '') + '" style="width:46px;margin:0 auto;' + (ok ? '' : 'filter:grayscale(1)') + '">' + heroSvg(x[0]) + '</div><div style="font-size:12px;font-weight:700;margin-top:4px">' + x[1] + '</div>' +
        '<div style="font-size:11px;opacity:.8;margin-top:2px">' + (on ? '✅ tanlangan' : ok ? 'Tanlash' : '🔒 ' + x[2] + ' ta masala') + '</div></button>';
    });
    heroCss(); ov.innerHTML = h + '</div>'; document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
    [].forEach.call(ov.querySelectorAll('[data-av]'), function (b) {
      b.onclick = function () { HS.av = b.getAttribute('data-av'); if (HS.save) HS.save(HS.av); ov.remove(); if (onDone) onDone(); };
    });
  }
  var ST = {};
  function html(items, key, admin) {
    css(); heroCss();
    var n = items.length; if (!n) return '';
    var cu = 0; while (cu < n && items[cu].done) cu++;
    var cur = Math.min(cu, n - 1), zc = Math.floor(cur / PER), Z = zonesOf(key), NZ = Math.ceil(n / PER);
    var z0 = Math.max(0, zc - 1), z1 = Math.min(NZ - 1, zc + 2);
    ST = { key: key, cu: cu, cur: cur, n: n, z0: z0, z1: z1 };
    var h = '<div class="pzBar"><button class="pzHeroPick" data-heropick><span class="idle" style="display:inline-block;width:18px;vertical-align:middle;margin:-4px 4px 0 0">' + heroSvg(heroAv()) + '</span>Qahramon</button>' + (admin ? '<button class="pzMapEd" data-mapedit>🗺 Xaritani sozlash</button>' : '') + '</div><div id="pzScroll">';
    for (var z = z1; z >= z0; z--) {
      var cfg = Z[z % Z.length];
      h += '<div class="pzZone" style="aspect-ratio:' + cfg.w + '/' + cfg.h + ';background-image:url(\'' + cfg.u + '\')"><span class="pzZt">' + (z + 1) + '/' + NZ + '-bosqich</span>';
      for (var k = 0; k < PER; k++) {
        var j = z * PER + k; if (j >= n) break;
        var p = cfg.pts[k] || GEN[k], done = items[j].done, now = j === cu, lock = j > cu + 3;
        var cls = done ? 'd' : now ? 'c' : lock ? 'l' : 'o';
        var lab = done ? '<small>✓</small>' + (j + 1) : now ? '<small>👑</small>' + (j + 1) : lock ? '🔒' : (j + 1);
        h += '<button class="pzN ' + cls + '" data-node="' + j + '" ' + (lock ? 'disabled' : 'data-pz="' + items[j].i + '"') + ' style="left:' + p[0] + '%;top:' + p[1] + '%">' + lab + '</button>';
      }
      h += '</div>';
    }
    h += '<div id="pzHero"><i class="pzSh"></i><span id="pzHeroW"><span id="pzHeroB" class="idle">' + heroSvg(heroAv()) + '</span></span></div></div>';
    return h;
  }
  function after(root, key, onEdit, onArrive) {
    var c = root.querySelector('#pzScroll'), hero = root.querySelector('#pzHero'), hb = root.querySelector('#pzHeroB'); if (!c || !hero) return;
    var hp = root.querySelector('[data-heropick]'); if (hp) hp.onclick = function () { picker(function () { var a = heroAv(); hb.innerHTML = heroSvg(a); hp.innerHTML = '<span class="idle" style="display:inline-block;width:18px;vertical-align:middle;margin:-4px 4px 0 0">' + heroSvg(a) + '</span>Qahramon'; hb.className = 'joy'; setTimeout(function () { hb.className = 'idle'; }, 1800); }); };
    var ed = root.querySelector('[data-mapedit]'); if (ed) ed.onclick = function (e) { e.stopPropagation(); editor(key, onEdit); };
    function at(j) {
      var b = c.querySelector('[data-node="' + j + '"]'); if (!b) return null;
      var cr = c.getBoundingClientRect(), br = b.getBoundingClientRect();
      return { x: br.left - cr.left + br.width / 2 + c.scrollLeft, y: br.top - cr.top + c.scrollTop + br.height * 0.05 };
    }
    var sk = 'pzHero:' + key, from = ST.cur;
    try { var sp = parseInt(localStorage.getItem(sk) || '', 10); if (sp >= ST.z0 * PER && sp < ST.cur) from = sp; } catch (e) {}
    function place(j, smooth) {
      var P = at(j); if (!P) return null;
      hero.style.left = P.x + 'px'; hero.style.top = P.y + 'px';
      var t = P.y - c.clientHeight / 2;
      if (smooth && c.scrollTo) c.scrollTo({ top: t, behavior: 'smooth' }); else c.scrollTop = t;
      return P;
    }
    var hw = root.querySelector('#pzHeroW');
    function fx(x, y, ch, n, spread) {   // effekt zarrachalari (chang, uchqun, konfetti)
      for (var i = 0; i < n; i++) {
        var e = document.createElement('span'), a = Math.random() * Math.PI * 2, r = spread * (0.5 + Math.random() * 0.6);
        e.className = 'pzFx'; e.textContent = ch[i % ch.length];
        e.style.left = x + 'px'; e.style.top = y + 'px';
        e.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px'); e.style.setProperty('--dy', Math.round(Math.sin(a) * r * 0.7 - spread * 0.3) + 'px');
        e.style.animationDelay = (i * 0.03) + 's';
        c.appendChild(e); setTimeout(function (el) { return function () { el.remove(); }; }(e), 1100);
      }
    }
    function hop(A, B, dur, cb) {   // yoy bo'ylab sakrash (requestAnimationFrame)
      var t0 = null, H = 6;   // yurish: ozgina chayqalib
      fx(A.x, A.y + 6, ['💨'], 2, 22);
      (function fr(ts) {
        if (!document.body.contains(hero)) return;
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur), e = t;
        var x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e - Math.abs(Math.sin(Math.PI * t * 3)) * H;
        hero.style.left = x + 'px'; hero.style.top = y + 'px';
        var ct = y - c.clientHeight / 2; c.scrollTop += (ct - c.scrollTop) * 0.18;
        if (t < 1) requestAnimationFrame(fr); else { fx(B.x, B.y + 10, ['✨', '⭐'], 4, 30); cb(); }
      })(performance.now());
      requestAnimationFrame(function () {});
    }
    var go = function () {
      var P0 = at(from); if (!P0) return;
      hero.style.left = P0.x + 'px'; hero.style.top = P0.y + 'px'; c.scrollTop = P0.y - c.clientHeight / 2;
      var k = from, cur = ST.cur;
      if (k < cur) { hb.className = 'walk'; }
      (function step() {
        if (!document.body.contains(hero)) return;
        if (k >= cur) {
          try { localStorage.setItem(sk, String(cur)); } catch (e) {}
          var E = at(cur), nb = c.querySelector('[data-node="' + cur + '"]');
          if (from < cur && E) {   // yetib keldi: quvonch + konfetti
            hb.className = 'joy'; fx(E.x, E.y, ['🎉', '⭐', '✨', '🎊', '💛'], 12, 70);
            if (nb) { nb.classList.add('pop'); }
            setTimeout(function () { hb.className = 'idle'; }, 1800);
          }
          if (onArrive) setTimeout(function () { if (document.body.contains(hero)) onArrive(); }, from < cur ? 1500 : 700);
          return;
        }
        var A = at(k); k++; var B = at(k);
        if (!A || !B) { step(); return; }
        hw.style.transform = B.x < A.x ? 'scaleX(-1)' : '';
        hop(A, B, Math.max(700, Math.hypot(B.x - A.x, B.y - A.y) * 9), function () { setTimeout(step, 90); });
      })();
    };
    // rasmlar yuklanib, o'lcham aniq bo'lgach
    setTimeout(go, 80);
  }

  // ---------------- admin: xarita sozlash
  function shrink(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var W = Math.min(768, im.width), H = Math.round(im.height * W / im.width), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        cv.getContext('2d').drawImage(im, 0, 0, W, H);
        var d = cv.toDataURL('image/webp', 0.78); if (!/^data:image\/webp/.test(d) || d.length > 700000) d = cv.toDataURL('image/jpeg', 0.75);
        cb({ img: d, w: W, h: H });
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function editor(key, done) {
    var zones = (MAPS[key] || []).map(function (x) { return { id: x.id, w: x.w, h: x.h, pts: (x.pts || []).slice(), u: '/api/pzmap/img?id=' + encodeURIComponent(x.id) }; });
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:#0b1026;color:#fff;overflow:auto;padding:14px;font:15px system-ui,sans-serif;box-sizing:border-box';
    document.body.appendChild(ov);
    var B = 'border:0;border-radius:10px;padding:9px 12px;margin:3px;color:#fff;font:600 14px system-ui;background:#2b3270';
    function draw() {
      var h = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1;font-size:18px">🗺 Xarita: ' + (key ? key.replace(/[<>]/g, '') : 'Umumiy') + '</b><button data-x style="' + B + '">✕</button></div>' +
        '<div style="font-size:13px;opacity:.8;margin-bottom:10px">Har bir rasm — 10 ta masala. Rasmlar pastdan yuqoriga navbat bilan takrorlanadi. Rasm yo‘q bo‘lsa standart xarita ishlatiladi.</div>';
      zones.forEach(function (z, i) {
        h += '<div style="display:flex;gap:10px;align-items:center;background:#161c45;border-radius:12px;padding:8px;margin:8px 0"><img src="' + (z.img || z.u) + '" style="width:90px;height:90px;object-fit:cover;border-radius:8px"><div style="flex:1"><b>' + (i + 1) + '-rasm</b><div style="font-size:12px;opacity:.75">' + (z.pts && z.pts.length === PER ? '📍 10 bekat belgilangan' : '📍 bekatlar standart') + '</div>' +
          '<button data-pt="' + i + '" style="' + B + '">📍 Bekatlar</button><button data-up="' + i + '" style="' + B + '">⬆</button><button data-del="' + i + '" style="' + B + ';background:#7a2333">🗑</button></div></div>';
      });
      h += '<label style="' + B + ';display:inline-block;background:#3b7d2a">➕ Rasm qo‘shish<input type="file" accept="image/*" data-file style="display:none"></label>' +
        '<button data-reset style="' + B + '">↺ Standart xarita</button><div style="margin-top:14px"><button data-save style="' + B + ';background:#6b5cf0;font-size:17px;padding:12px 20px">💾 Saqlash</button> <span data-msg></span></div>';
      ov.innerHTML = h;
      ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
      ov.querySelector('[data-file]').onchange = function () { var f = this.files && this.files[0]; if (!f) return; shrink(f, function (r) { zones.push({ img: r.img, w: r.w, h: r.h, pts: [] }); draw(); }); };
      ov.querySelector('[data-reset]').onclick = function () { zones = []; draw(); };
      [].forEach.call(ov.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { zones.splice(+b.getAttribute('data-del'), 1); draw(); }; });
      [].forEach.call(ov.querySelectorAll('[data-up]'), function (b) { b.onclick = function () { var i = +b.getAttribute('data-up'); if (i > 0) { var t = zones[i - 1]; zones[i - 1] = zones[i]; zones[i] = t; } draw(); }; });
      [].forEach.call(ov.querySelectorAll('[data-pt]'), function (b) { b.onclick = function () { points(zones[+b.getAttribute('data-pt')], draw); }; });
      ov.querySelector('[data-save]').onclick = function () {
        var m = ov.querySelector('[data-msg]'); m.textContent = '⏳';
        api('/api/pzmap/save', { key: key, zones: zones.map(function (z) { return { id: z.id, img: z.img, w: z.w, h: z.h, pts: z.pts }; }) }).then(function (d) {
          if (d && d.ok) { MAPS = d.maps || MAPS; ov.remove(); if (done) done(); } else m.textContent = '❌ ' + ((d && d.error) || 'xato');
        });
      };
    }
    draw();
  }
  function points(z, back) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483200;background:#000;color:#fff;overflow:auto;font:15px system-ui,sans-serif';
    document.body.appendChild(ov);
    var pts = [];
    function draw() {
      ov.innerHTML = '<div style="padding:10px;display:flex;gap:6px;align-items:center;position:sticky;top:0;background:#000;z-index:2"><b style="flex:1">📍 ' + (pts.length < PER ? (pts.length + 1) + '-bekatni bosing (1 — pastdagi)' : 'Tayyor!') + '</b><button data-u style="border:0;border-radius:8px;padding:8px 10px;background:#333;color:#fff">↶</button><button data-ok style="border:0;border-radius:8px;padding:8px 12px;background:#3b7d2a;color:#fff"' + (pts.length < PER ? ' disabled' : '') + '>✓</button><button data-x style="border:0;border-radius:8px;padding:8px 10px;background:#333;color:#fff">✕</button></div>' +
        '<div data-img style="position:relative;width:100%;aspect-ratio:' + z.w + '/' + z.h + ';background:url(\'' + (z.img || z.u) + '\') 0 0/100% 100% no-repeat">' +
        pts.map(function (p, i) { return '<span style="position:absolute;left:' + p[0] + '%;top:' + p[1] + '%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#f5a623;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:900">' + (i + 1) + '</span>'; }).join('') + '</div>';
      var im = ov.querySelector('[data-img]');
      im.onclick = function (e) { if (pts.length >= PER) return; var r = im.getBoundingClientRect(); pts.push([+((e.clientX - r.left) / r.width * 100).toFixed(1), +((e.clientY - r.top) / r.height * 100).toFixed(1)]); draw(); };
      ov.querySelector('[data-u]').onclick = function () { pts.pop(); draw(); };
      ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
      ov.querySelector('[data-ok]').onclick = function () { z.pts = pts; ov.remove(); back(); };
    }
    draw();
  }
  window.spPzMap = { load: load, html: html, after: after, setHero: setHero, heroSvg: function (id) { heroCss(); return heroSvg(id); }, heroes: HEROES };
})();
