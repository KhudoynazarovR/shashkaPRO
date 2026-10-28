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
    { u: '/img/pzzone3.webp?v=1', w: 768, h: 758, pts: [[76.0, 94.5], [57.8, 88.6], [42.3, 76.7], [59.2, 68.0], [33.2, 58.4], [43.0, 51.0], [50.5, 44.5], [57.9, 33.0], [35.8, 23.8], [51.7, 10.6]] },
    { u: '/img/pzzone4.webp?v=1', w: 768, h: 788, pts: [[19.0, 92.4], [36.3, 82.9], [55.7, 78.1], [68.4, 66.2], [44.4, 60.5], [61.3, 49.5], [39.4, 39.5], [64.0, 33.8], [46.6, 25.7], [56.0, 10.5]] }
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
      '#pzHero{position:absolute;z-index:6;width:19%;transform:translate(-50%,-90%);pointer-events:none;will-change:left,top}' +
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
  // ---------------- 🧍 Anime qahramonlar (SVG): oyoq-qo'llari yuradi, ko'zini pirpiratadi, quvonganda qo'l ko'taradi.
  // Bolalar va qizlar uchun 10 tadan, har 50 ta yechilgan masalada yangisi ochiladi.
  var _aid = 0;
  function anime(o) {
    var u = 'a' + (++_aid), L = 'stroke="#2a2238" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"', s = '', D = '';
    function lg(id, a, b, c, vert) { D += '<linearGradient id="' + u + id + '" x1="0" y1="0" x2="' + (vert === false ? 1 : 0) + '" y2="' + (vert === false ? 0 : 1) + '"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/>' : '<stop offset="1" stop-color="' + b + '"/>') + '</linearGradient>'; return 'url(#' + u + id + ')'; }
    var HR = lg('hr', o.h[0], o.h[1], o.h[2]), HR2 = lg('hr2', o.h[0], o.h[1]);
    var C = lg('c', o.c[0], o.c[1], o.c[2]), IR = lg('ir', o.e[0], o.e[1], o.e[2]);
    var PT = lg('pt', o.p ? o.p[0] : '#3563c9', o.p ? o.p[1] : '#1e3a8a');
    D += '<radialGradient id="' + u + 'sk" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#fff2e8"/><stop offset=".75" stop-color="#ffdfcc"/><stop offset="1" stop-color="#f0bc9c"/></radialGradient>';
    D += '<radialGradient id="' + u + 'bl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8fa3" stop-opacity=".6"/><stop offset="1" stop-color="#ff8fa3" stop-opacity="0"/></radialGradient>';
    D += '<linearGradient id="' + u + 'sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".3"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>';
    var SK = 'url(#' + u + 'sk)', SH = 'url(#' + u + 'sh)', T = o.t || '#fde047';
    if (o.glow) D += '<radialGradient id="' + u + 'gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + o.glow + '" stop-opacity=".75"/><stop offset="1" stop-color="' + o.glow + '" stop-opacity="0"/></radialGradient>';
    if (o.cape === 'chk') D += '<pattern id="' + u + 'ck" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f8fafc"/><rect width="4" height="4" fill="#111"/><rect x="4" y="4" width="4" height="4" fill="#111"/></pattern>';
    var long = o.body === 'gown' || o.body === 'robe';
    // nur
    if (o.glow) s += '<ellipse class="hGl" cx="60" cy="96" rx="58" ry="78" fill="url(#' + u + 'gl)"/>';
    // qanotlar
    if (o.wings === 'fairy') s += '<g class="hWg">' + ['M50 92 Q14 50 10 84 Q12 104 50 100Z', 'M70 92 Q106 50 110 84 Q108 104 70 100Z', 'M50 100 Q22 112 26 128 Q40 126 52 106Z', 'M70 100 Q98 112 94 128 Q80 126 68 106Z'].map(function (d) { return '<path d="' + d + '" fill="' + o.wc + '" fill-opacity=".55" stroke="' + o.wc2 + '" stroke-width="1.2"/>'; }).join('') + '<circle cx="24" cy="80" r="2" fill="#fff" opacity=".8"/><circle cx="96" cy="80" r="2" fill="#fff" opacity=".8"/></g>';
    if (o.wings === 'angel') s += '<g class="hWg">' + [-1, 1].map(function (d) { var x = 60 + d * 10; return [0, 1, 2, 3].map(function (k) { return '<path d="M' + x + ' 92 Q' + (x + d * (30 + k * 6)) + ' ' + (50 + k * 10) + ' ' + (x + d * (44 + k * 4)) + ' ' + (68 + k * 12) + ' Q' + (x + d * 24) + ' ' + (98 + k * 4) + ' ' + x + ' 102Z" fill="#ffffff" stroke="#e5d9a8" stroke-width="1"/>'; }).join(''); }).join('') + '</g>';
    if (o.wings === 'dragon') s += '<g class="hWg">' + [-1, 1].map(function (d) { var x = 60 + d * 8; return '<path d="M' + x + ' 94 L' + (x + d * 30) + ' 46 L' + (x + d * 50) + ' 60 L' + (x + d * 44) + ' 76 L' + (x + d * 54) + ' 86 L' + (x + d * 38) + ' 92 L' + (x + d * 42) + ' 104 L' + x + ' 104Z" fill="' + o.wc + '" stroke="#2a2238" stroke-width="1.3" stroke-linejoin="round"/><path d="M' + (x + d * 30) + ' 46 L' + (x + d * 6) + ' 100 M' + (x + d * 50) + ' 60 L' + (x + d * 10) + ' 100 M' + (x + d * 54) + ' 86 L' + (x + d * 14) + ' 102" stroke="' + o.wc2 + '" stroke-width="1.2"/>'; }).join('') + '</g>';
    // aura zarrachalari
    if (o.aura) {
      var AU = { star: '<path d="M0 -4L1.2 -1.2L4 0L1.2 1.2L0 4L-1.2 1.2L-4 0L-1.2 -1.2Z" fill="#fde68a"/>', snow: '<path d="M0 -4V4M-3.5 -2L3.5 2M-3.5 2L3.5 -2" stroke="#e0f7ff" stroke-width="1.2" stroke-linecap="round"/>', petal: '<ellipse rx="2" ry="3.2" fill="#f9a8d4" transform="rotate(30)"/>', fire: '<path d="M0 -5Q3 -1 2 2Q1 4 0 4Q-2 4 -2 1Q-2 -2 0 -5Z" fill="#fb923c"/><path d="M0 -1Q1 1 0.5 3Q-1 3 -0.8 1Z" fill="#fde047"/>', heart: '<path d="M0 3L-3.5 -0.5A2 2 0 0 1 0 -2.8A2 2 0 0 1 3.5 -0.5Z" fill="#fb7185"/>', bubble: '<circle r="3" fill="#bae6fd" fill-opacity=".35" stroke="#e0f7ff" stroke-width=".8"/><circle cx="-1" cy="-1" r=".8" fill="#fff"/>', gold: '<path d="M0 -4L1.2 -1.2L4 0L1.2 1.2L0 4L-1.2 1.2L-4 0L-1.2 -1.2Z" fill="#facc15"/><circle r="1" fill="#fff"/>', leaf: '<path d="M0 -4Q3 0 0 4Q-3 0 0 -4Z" fill="#4ade80"/>' }[o.aura];
      [[8, 70, 0], [112, 60, .8], [12, 128, 1.6], [108, 120, 2.4], [96, 16, 3.1], [22, 28, 3.8], [60, -10, 1.2], [4, 100, 2.8]].slice(0, o.auraN || 6).forEach(function (q) { s += '<g transform="translate(' + q[0] + ' ' + q[1] + ')"><g class="hAu" style="animation-delay:-' + q[2] + 's">' + AU + '</g></g>'; });
    }
    // orqa sochlar
    if (o.hs === 'long' || o.hs === 'wavy') s += '<g class="hBr"><path d="M28 50 Q16 96 24 130 Q34 142 44 134 Q40 112 44 90 L76 90 Q80 112 76 134 Q86 142 96 130 Q104 96 92 50Z" fill="' + HR + '" ' + L + '/>' + (o.hs === 'wavy' ? '<path d="M24 130 Q18 122 22 114 M96 130 Q102 122 98 114" stroke="' + o.h[1] + '" stroke-width="3" fill="none"/>' : '') + '</g>';
    if (o.hs === 'twin') s += '<g class="hBr">' + [-1, 1].map(function (d) { var x = 60 + d * 32; return '<path d="M' + x + ' 34 Q' + (x + d * 20) + ' 60 ' + (x + d * 12) + ' 104 Q' + (x + d * 6) + ' 116 ' + (x - d * 2) + ' 108 Q' + (x + d * 6) + ' 72 ' + (x - d * 4) + ' 40Z" fill="' + HR + '" ' + L + '/>'; }).join('') + '</g>';
    if (o.hs === 'pony') s += '<path class="hBr" d="M66 14 Q100 10 98 50 Q96 80 82 96 Q88 70 80 44 Q76 26 62 20Z" fill="' + HR + '" ' + L + '/>';
    // plash
    if (o.cape) s += '<path class="hCp" d="M40 86 Q60 80 80 86 L' + (long ? '104 162 Q60 174 16 162' : '96 138 Q60 148 24 138') + 'Z" fill="' + (o.cape === 'chk' ? 'url(#' + u + 'ck)' : o.cape) + '"' + (o.capeOp ? ' fill-opacity="' + o.capeOp + '"' : '') + ' ' + L + '/>' + (o.cape === 'chk' ? '' : '<path d="M44 90 L' + (long ? '26 160' : '30 136') + '" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>');
    // orqa qurol (qilich orqada)
    if (o.prop === 'katana') s += '<g class="hCp"><path d="M84 70 L36 128" stroke="#2a2238" stroke-width="5" stroke-linecap="round"/><path d="M84 70 L36 128" stroke="#334155" stroke-width="3.4" stroke-linecap="round"/><path d="M80 75 L86 80" stroke="' + T + '" stroke-width="3"/></g>';
    // oyoqlar
    function leg(c, x) {
      if (long) return '<g class="' + c + '"><path d="M' + x + ' 150 L' + x + ' 163" stroke="' + (o.st || '#dbeafe') + '" stroke-width="7" stroke-linecap="round"/><ellipse cx="' + (x + (c === 'hLf' ? -2 : 3)) + '" cy="166" rx="8" ry="4.2" fill="' + (o.shoe || '#7cc8f5') + '" ' + L + '/><ellipse cx="' + (x + (c === 'hLf' ? -4 : 1)) + '" cy="164.5" rx="3" ry="1.2" fill="#fff" opacity=".8"/></g>';
      var top = o.body === 'dress' ? 126 : 128, col = o.body === 'dress' ? (o.st || '#fff') : PT;
      return '<g class="' + c + '"><path d="M' + x + ' ' + top + ' L' + x + ' 152" stroke="#2a2238" stroke-width="12" stroke-linecap="round"/><path d="M' + x + ' ' + top + ' L' + x + ' 152" stroke="' + col + '" stroke-width="9.5" stroke-linecap="round"/>' +
        (o.boots ? '<path d="M' + (x - 6) + ' 142 L' + (x + 6) + ' 142 L' + (x + 6) + ' 156 L' + (x + 11) + ' 160 L' + (x - 6) + ' 160Z" fill="' + o.boots + '" ' + L + '/><path d="M' + (x - 6) + ' 145 L' + (x + 6) + ' 145" stroke="' + T + '" stroke-width="2"/>'
          : '<path d="M' + (x - 7) + ' 160 Q' + (x - 7) + ' 152 ' + x + ' 152 Q' + (x + 9) + ' 152 ' + (x + 11) + ' 160Z" fill="' + (o.shoe || '#fff') + '" ' + L + '/><path d="M' + (x - 7.5) + ' 160 L' + (x + 11.5) + ' 160" stroke="' + (o.sole || '#ef4444') + '" stroke-width="3" stroke-linecap="round"/>') + '</g>';
    }
    s += leg('hLb', 64) + leg('hLf', 55);
    // qo'llar
    var sl = o.sl || o.c[1];
    function arm(c, x, d, front) {
      var hx = x + d * 5, r = '<g class="' + c + '">';
      if (front && (o.prop === 'staff' || o.prop === 'scepter')) r += '<path d="M' + hx + ' 150 L' + hx + ' 84" stroke="#2a2238" stroke-width="4.5" stroke-linecap="round"/><path d="M' + hx + ' 150 L' + hx + ' 84" stroke="' + (o.prop === 'scepter' ? '#facc15' : '#8b5a2b') + '" stroke-width="3" stroke-linecap="round"/><circle class="hTw" cx="' + hx + '" cy="80" r="' + (o.prop === 'scepter' ? 5 : 6) + '" fill="' + (o.orb || '#a78bfa') + '" stroke="#fff" stroke-width="1.2"/><circle cx="' + (hx - 1.5) + '" cy="78" r="1.6" fill="#fff"/>' + (o.prop === 'scepter' ? '<path d="M' + (hx - 6) + ' 76 L' + (hx - 4) + ' 70 L' + hx + ' 74 L' + (hx + 4) + ' 70 L' + (hx + 6) + ' 76Z" fill="#facc15" ' + L + '/>' : '');
      r += '<path d="M' + x + ' 92 Q' + hx + ' 104 ' + hx + ' 116" fill="none" stroke="#2a2238" stroke-width="11" stroke-linecap="round"/><path d="M' + x + ' 92 Q' + hx + ' 104 ' + hx + ' 116" fill="none" stroke="' + sl + '" stroke-width="8.4" stroke-linecap="round"/>';
      if (o.cuff) r += '<path d="M' + (hx - 4.5) + ' 113 L' + (hx + 4.5) + ' 113" stroke="' + T + '" stroke-width="2.4" stroke-linecap="round"/>';
      if (front && o.prop === 'sword') r += '<path d="M' + hx + ' 118 L' + (hx - 18) + ' 74" stroke="#2a2238" stroke-width="6" stroke-linecap="round"/><path d="M' + hx + ' 118 L' + (hx - 18) + ' 74" stroke="' + (o.blade || '#e2e8f0') + '" stroke-width="4" stroke-linecap="round"/><path d="M' + (hx - 2) + ' 112 L' + (hx - 14) + ' 82" stroke="#fff" stroke-width="1" opacity=".8"/><path d="M' + (hx - 6) + ' 116 L' + (hx + 6) + ' 111" stroke="' + T + '" stroke-width="3.4" stroke-linecap="round"/>';
      if (front && o.prop === 'wand') r += '<path d="M' + hx + ' 118 L' + (hx - 10) + ' 98" stroke="#2a2238" stroke-width="3" stroke-linecap="round"/><path class="hTw" d="M' + (hx - 11) + ' 89 l1.6 3.4 l3.6 .5 l-2.6 2.5 l.6 3.6 l-3.2 -1.7 l-3.2 1.7 l.6 -3.6 l-2.6 -2.5 l3.6 -.5Z" fill="#fde047" stroke="#fff" stroke-width=".6"/>';
      if (front && o.prop === 'piece') r += '<ellipse cx="' + (hx - 2) + '" cy="122" rx="8" ry="4" fill="#111" stroke="#facc15" stroke-width="1.4"/><ellipse cx="' + (hx - 2) + '" cy="120" rx="8" ry="4" fill="#1f2937" stroke="#facc15" stroke-width="1.4"/><path d="M' + (hx - 6) + ' 120 L' + (hx - 4) + ' 117 L' + (hx - 2) + ' 119 L' + hx + ' 117 L' + (hx + 2) + ' 120Z" fill="#facc15"/>';
      if (front && o.prop === 'shield') r += '<path d="M' + (hx - 10) + ' 104 L' + (hx + 8) + ' 104 L' + (hx + 8) + ' 118 Q' + (hx - 1) + ' 130 ' + (hx - 10) + ' 118Z" fill="' + (o.shc || '#1d4ed8') + '" ' + L + '/><path d="M' + (hx - 1) + ' 106 L' + (hx - 1) + ' 124 M' + (hx - 8) + ' 112 L' + (hx + 6) + ' 112" stroke="' + T + '" stroke-width="2"/>';
      return r + '<circle cx="' + hx + '" cy="119" r="4.3" fill="' + SK + '" ' + L + '/></g>';
    }
    s += arm('hAb', 78, 1, false);
    // tana
    if (long) {
      s += '<g class="hGn"><path d="M46 96 Q60 92 74 96 Q80 120 96 156 Q60 168 24 156 Q40 120 46 96Z" fill="' + C + '" ' + L + '/><path d="M46 96 Q60 92 74 96 Q80 120 96 156 Q60 168 24 156 Q40 120 46 96Z" fill="' + SH + '"/>' +
        '<path d="M25 155 Q31 150 37 156 Q43 151 49 157 Q55 152 61 158 Q67 152 73 157 Q79 151 85 156 Q91 150 95 155" fill="none" stroke="' + (o.hem || '#fff') + '" stroke-width="1.8" opacity=".95"/>' +
        (o.body === 'robe' ? '<path d="M60 98 L60 162" stroke="' + T + '" stroke-width="2.4"/>' : '') +
        [[40, 136], [70, 128], [58, 146], [80, 146], [34, 150], [66, 112]].map(function (p) { return '<circle class="hTw" cx="' + p[0] + '" cy="' + p[1] + '" r="1.1" fill="#fff" style="animation-delay:-' + ((p[0] % 7) / 5) + 's"/>'; }).join('') + '</g>';
      s += '<path d="M47 84 Q60 80 73 84 L72 98 Q60 102 48 98Z" fill="' + (o.bod || o.c[2]) + '" ' + L + '/><path d="M48 97 Q60 101 72 97" fill="none" stroke="' + T + '" stroke-width="1.6"/><path d="M60 86 l1.8 3.4 l-1.8 3.4 l-1.8 -3.4Z" fill="' + T + '"/>';
    } else if (o.body === 'dress') {
      s += '<g class="hGn"><path d="M46 96 L74 96 Q84 116 90 132 Q60 140 30 132 Q36 116 46 96Z" fill="' + C + '" ' + L + '/><path d="M46 96 L74 96 Q84 116 90 132 Q60 140 30 132 Q36 116 46 96Z" fill="' + SH + '"/><path d="M31 131 Q37 127 43 132 Q49 128 55 133 Q61 128 67 133 Q73 128 79 132 Q85 127 89 131" fill="none" stroke="' + (o.hem || '#fff') + '" stroke-width="1.8"/></g>';
      s += '<path d="M47 84 Q60 80 73 84 L73 98 Q60 101 47 98Z" fill="' + (o.bod || o.c[1]) + '" ' + L + '/><path d="M47 97 Q60 100 73 97" stroke="' + T + '" stroke-width="2" fill="none"/>';
    } else if (o.body === 'armor') {
      s += '<path d="M44 88 Q60 82 76 88 L78 128 Q60 132 42 128Z" fill="' + C + '" ' + L + '/><path d="M44 88 Q60 82 76 88 L78 128 Q60 132 42 128Z" fill="' + SH + '"/>' +
        '<path d="M50 94 Q60 90 70 94 L68 114 Q60 120 52 114Z" fill="none" stroke="' + T + '" stroke-width="2"/><path d="M60 98 L60 112 M54 104 L66 104" stroke="' + T + '" stroke-width="2.2"/>' +
        '<path d="M42 124 Q60 130 78 124 L78 130 Q60 136 42 130Z" fill="' + T + '" ' + L + '/><circle cx="60" cy="129" r="3" fill="' + (o.gem || '#ef4444') + '" stroke="#fff" stroke-width=".8"/>' +
        '<ellipse cx="42" cy="90" rx="9" ry="6.5" fill="' + C + '" ' + L + '/><ellipse cx="78" cy="90" rx="9" ry="6.5" fill="' + C + '" ' + L + '/><path d="M35 90 Q42 86 49 90 M71 90 Q78 86 85 90" stroke="' + T + '" stroke-width="1.6" fill="none"/>';
    } else if (o.body === 'kimono') {
      s += '<path d="M44 88 Q60 82 76 88 L80 130 Q60 134 40 130Z" fill="' + C + '" ' + L + '/><path d="M50 86 L60 104 L70 86" fill="none" stroke="#fff" stroke-width="3"/><path d="M42 110 L78 110 L78 120 L42 120Z" fill="' + T + '" ' + L + '/><path d="M58 110 L62 120" stroke="#2a2238" stroke-width="1"/>';
    } else if (o.body === 'suit') {
      s += '<path d="M44 88 Q60 82 76 88 L78 128 Q60 132 42 128Z" fill="' + C + '" ' + L + '/><path d="M44 88 Q60 82 76 88 L78 128 Q60 132 42 128Z" fill="' + SH + '"/><circle class="hTw" cx="60" cy="104" r="7" fill="' + T + '" stroke="#fff" stroke-width="1.4"/><path d="M57 101 L63 101 L60 108Z" fill="#fff"/><path d="M42 124 Q60 130 78 124" stroke="' + T + '" stroke-width="3" fill="none"/>';
    } else { // kurtka
      s += '<path d="M44 88 Q60 82 76 88 L78 128 Q60 132 42 128Z" fill="' + C + '" ' + L + '/><path d="M53 87 L67 87 L66 127 L54 127Z" fill="' + (o.tee || '#fff') + '" stroke="#cbd5e1" stroke-width=".8"/>' +
        '<path d="M56 100 L64 100 L62 108 L58 108Z" fill="#111827"/><path d="M57.5 102 L62.5 102 M57.5 104.5 L62.5 104.5 M59 101 L59 107 M61 101 L61 107" stroke="#f8fafc" stroke-width=".7"/>' +
        '<path d="M42 126 Q60 131 78 126 L78 131 Q60 136 42 131Z" fill="' + T + '" ' + L + '/><path d="M44 86 Q50 80 60 82 Q70 80 76 86 L70 92 L60 88 L50 92Z" fill="' + o.c[2] + '" ' + L + '/>';
    }
    if (o.fur) s += '<path d="M42 84 Q47 78 54 81 Q60 76 66 81 Q73 78 78 84 Q72 89 60 88 Q48 89 42 84Z" fill="#fff" stroke="#cbd5e1" stroke-width="1"/>';
    s += arm('hAf', 42, -1, true);
    // bosh
    s += '<g class="hHd"><path d="M54 72 L54 84 L66 84 L66 72Z" fill="#f2c8a8"/>';
    s += '<path d="M31 46 Q31 20 60 18 Q89 20 89 46 Q89 66 74 75 Q66 80 60 80 Q54 80 46 75 Q31 66 31 46Z" fill="' + SK + '" ' + L + '/>';
    if (o.g === 'b') s += '<ellipse cx="29.5" cy="50" rx="3.5" ry="5.5" fill="' + SK + '" ' + L + '/><ellipse cx="90.5" cy="50" rx="3.5" ry="5.5" fill="' + SK + '" ' + L + '/>';
    s += '<ellipse cx="42" cy="62" rx="6.5" ry="3.8" fill="url(#' + u + 'bl)"/><ellipse cx="78" cy="62" rx="6.5" ry="3.8" fill="url(#' + u + 'bl)"/>';
    // ko'zlar
    var gi = o.g === 'g';
    function eye(cx, d) {
      var r = '<g><ellipse cx="' + cx + '" cy="53" rx="' + (gi ? 8 : 7.2) + '" ry="' + (gi ? 9.6 : 8.6) + '" fill="#fff"/><ellipse cx="' + (cx + d * .6) + '" cy="54" rx="' + (gi ? 6.6 : 5.8) + '" ry="' + (gi ? 8.6 : 7.6) + '" fill="' + IR + '"/><ellipse cx="' + (cx + d * .6) + '" cy="55" rx="3" ry="4.3" fill="' + (o.e[3] || '#14102a') + '"/>' +
        '<ellipse cx="' + (cx - 2.6) + '" cy="50" rx="2.5" ry="3.1" fill="#fff"/><circle cx="' + (cx + 3) + '" cy="58.5" r="1.4" fill="#fff"/><circle cx="' + (cx - 1.5) + '" cy="59.5" r=".7" fill="#fff" opacity=".8"/>';
      r += '<path d="M' + (cx - 9 * (d < 0 ? 1 : 1)) + ' ' + (gi ? 46 : 47) + ' Q' + cx + ' ' + (gi ? 39.5 : 42) + ' ' + (cx + 9) + ' ' + (gi ? 46 : 47) + '" fill="none" stroke="#1b1530" stroke-width="2.8" stroke-linecap="round"/>';
      if (gi) { var ox = d < 0 ? cx - 9 : cx + 9; r += '<path d="M' + ox + ' 46 L' + (ox + d * 3) + ' 43.5 M' + (ox - d * 1.5) + ' 44 L' + (ox + d * 1) + ' 40.8" stroke="#1b1530" stroke-width="1.5" stroke-linecap="round"/>'; }
      return r + '</g>';
    }
    s += '<g class="hEy">' + eye(46, -1) + eye(74, 1) + '</g>';
    s += '<path d="M' + (gi ? '40 37 Q45 35 51 36.5 M69 36.5 Q75 35 80 37' : '38 40 Q45 36 53 39 M67 39 Q75 36 82 40') + '" fill="none" stroke="' + o.h[2] + '" stroke-width="' + (gi ? 1.4 : 2.4) + '" stroke-linecap="round"/>';
    s += '<path d="M59.5 62 Q60.5 63.5 61.5 62.5" fill="none" stroke="#d99a78" stroke-width="1" stroke-linecap="round"/>';
    if (o.mask) s += '<path d="M33 64 Q60 60 87 64 L84 74 Q72 80 60 80 Q48 80 36 74Z" fill="' + o.mask + '" ' + L + '/>';
    else s += gi ? '<path class="hMo" d="M55.5 67 Q60 71.5 64.5 67 Q60 68.5 55.5 67Z" fill="#ff7a93" stroke="#d94f6c" stroke-width=".8"/>' : '<path class="hMo" d="M54 67 Q60 73 66 67 Q60 69 54 67Z" fill="#fff" stroke="#2a2238" stroke-width="1"/>';
    // old sochlar
    var hs = o.hs;
    if (hs === 'spiky' || hs === 'flame') s += '<path d="M26 48 L22 34 L30 36 L26 20 L37 28 L38 10 L48 22 L56 4 L62 20 L72 6 L74 22 L86 12 L84 28 L96 26 L88 38 L96 46 L88 46 Q86 36 80 32 L78 42 Q72 32 66 30 L64 40 Q58 30 52 30 L48 42 Q44 32 40 34 L36 44 Q32 38 32 44Z" fill="' + HR + '" ' + L + '/><path d="M44 16 Q50 14 54 10 M66 14 Q70 12 72 10" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>';
    else if (hs === 'short') s += '<path d="M28 50 Q24 18 60 14 Q96 18 92 50 Q88 40 84 36 L82 44 Q76 34 68 32 L66 42 Q60 32 54 32 L50 42 Q46 34 40 36 L38 44 Q32 40 28 50Z" fill="' + HR + '" ' + L + '/><path d="M46 20 Q54 16 62 17" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>';
    else if (hs === 'pony') s += '<path d="M28 50 Q24 16 60 12 Q96 16 92 50 Q88 38 82 32 L80 44 Q72 32 64 30 L60 42 Q56 32 50 32 L44 44 Q40 36 36 38 L34 46Z" fill="' + HR + '" ' + L + '/><path d="M46 18 Q54 14 62 15" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>';
    else s += '<path d="M27 50 Q24 16 60 11 Q96 16 93 50 Q90 40 86 34 L85 47 Q81 37 76 31 L74 43 Q70 33 65 29 L62 41 Q58 31 55 29 L50 42 Q48 33 46 31 L40 44 Q39 36 36 33 L33 46 Q31 42 30 38Z" fill="' + HR2 + '" ' + L + '/><path d="M44 20 Q52 16 60 17" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path class="hBr" d="M30 44 Q20 58 26 72 Q22 80 28 88 Q32 80 30 74 Q36 64 34 52Z" fill="' + HR + '" ' + L + '/><path class="hBr" d="M90 44 Q100 58 94 72 Q98 80 92 88 Q88 80 90 74 Q84 64 86 52Z" fill="' + HR + '" ' + L + '/>';
    if (hs === 'twin') s += [-1, 1].map(function (d) { return '<circle cx="' + (60 + d * 31) + '" cy="34" r="3.6" fill="' + T + '" ' + L + '/>'; }).join('');
    // bosh kiyimlari
    var hat = o.hat;
    if (hat === 'bow') s += '<path d="M76 18 L88 10 L87 26Z M76 18 L66 9 L67 25Z" fill="' + o.hatc + '" ' + L + '/><circle cx="76" cy="18" r="3" fill="' + T + '" ' + L + '/>';
    if (hat === 'band') s += '<path d="M28 36 Q60 26 92 36 L92 43 Q60 33 28 43Z" fill="' + o.hatc + '" ' + L + '/><path class="hBr" d="M90 38 Q100 34 106 42 M90 41 Q99 44 102 52" fill="none" stroke="' + o.hatc + '" stroke-width="3" stroke-linecap="round"/>';
    if (hat === 'witch' || hat === 'wizard') s += '<path d="M18 30 Q60 40 102 30 Q90 22 78 24 L' + (hat === 'witch' ? '86 -14 Q70 -6 60 -20' : '64 -26') + ' L42 24 Q30 22 18 30Z" fill="' + o.hatc + '" ' + L + '/><path d="M40 26 Q60 32 80 26" stroke="' + T + '" stroke-width="3" fill="none"/><path class="hTw" d="M58 4 l1.4 3 l3.2 .4 l-2.4 2.2 l.6 3.2 l-2.8 -1.6 l-2.8 1.6 l.6 -3.2 l-2.4 -2.2 l3.2 -.4Z" fill="' + T + '"/>';
    if (hat === 'flower') s += [[34, 26, '#f472b6'], [42, 18, '#fde047'], [51, 13.5, '#f9a8d4'], [60, 12, '#fb7185'], [69, 13.5, '#fde047'], [78, 18, '#f472b6'], [86, 26, '#f9a8d4']].map(function (f) { return '<g transform="translate(' + f[0] + ' ' + f[1] + ')">' + [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="-2.6" rx="2" ry="2.8" fill="' + f[2] + '" transform="rotate(' + a + ')" stroke="#be185d" stroke-width=".4"/>'; }).join('') + '<circle r="1.4" fill="#fef3c7"/></g>'; }).join('') + '<path d="M30 30 Q26 26 28 22 M90 30 Q94 26 92 22" stroke="#16a34a" stroke-width="1.6" fill="none"/>';
    function crownPath(y, h, c) { return '<path d="M38 ' + y + ' L40 ' + (y - h * .55) + ' L45 ' + (y - h * .25) + ' L48 ' + (y - h * .9) + ' L53 ' + (y - h * .35) + ' L60 ' + (y - h * 1.3) + ' L67 ' + (y - h * .35) + ' L72 ' + (y - h * .9) + ' L75 ' + (y - h * .25) + ' L80 ' + (y - h * .55) + ' L82 ' + y + ' Q60 ' + (y - 5) + ' 38 ' + y + 'Z" fill="' + c + '" stroke="' + (o.hatc2 || '#b45309') + '" stroke-width="1.1" stroke-linejoin="round"/>'; }
    if (hat === 'tiara') s += crownPath(18, 12, o.hatc) + '<circle cx="60" cy="13" r="2.4" fill="' + (o.gem || '#38bdf8') + '" stroke="#fff" stroke-width=".8"/>';
    if (hat === 'ice') s += '<ellipse class="hTw" cx="60" cy="8" rx="26" ry="10" fill="#bfe9ff" opacity=".35"/>' + crownPath(18, 18, '#d6f1ff') + '<path d="M60 -4 L60 12 M48 4 L49 13 M72 4 L71 13" stroke="#fff" stroke-width=".9"/><circle cx="60" cy="15" r="2.2" fill="#5ec8ff" stroke="#fff" stroke-width=".8"/>';
    if (hat === 'crown') s += '<ellipse class="hTw" cx="60" cy="8" rx="24" ry="9" fill="#fde68a" opacity=".35"/>' + crownPath(20, 18, '#facc15') + '<circle cx="60" cy="14" r="2.6" fill="#ef4444" stroke="#fff" stroke-width=".8"/><circle cx="48" cy="16" r="1.6" fill="#3b82f6"/><circle cx="72" cy="16" r="1.6" fill="#22c55e"/><circle cx="60" cy="-3" r="1.8" fill="#fff"/>';
    if (hat === 'moon') s += '<path d="M36 22 Q60 10 84 22" fill="none" stroke="#e5e7eb" stroke-width="2"/><path d="M62 0 A8 8 0 1 0 62 16 A6 6 0 1 1 62 0Z" fill="#fde68a" stroke="#ca8a04" stroke-width="1"/>';
    if (hat === 'flamecrown') s += crownPath(18, 16, '#fb923c') + '<path class="hTw" d="M60 -6 Q66 2 62 8 Q58 4 60 -6Z M48 0 Q52 6 49 10 Q45 6 48 0Z M72 0 Q75 6 71 10 Q68 6 72 0Z" fill="#fde047"/>';
    if (hat === 'halo') s += '<ellipse class="hTw" cx="60" cy="2" rx="18" ry="5" fill="none" stroke="#fde047" stroke-width="3"/><ellipse cx="60" cy="2" rx="18" ry="5" fill="none" stroke="#fff" stroke-width="1"/>' + crownPath(18, 8, '#fff7d6');
    if (hat === 'horns') s += '<path d="M36 24 Q26 8 32 -2 Q36 12 44 20Z M84 24 Q94 8 88 -2 Q84 12 76 20Z" fill="' + o.hatc + '" ' + L + '/>';
    if (hat === 'helm') s += '<path d="M28 40 Q26 10 60 8 Q94 10 92 40 L84 40 Q82 22 60 20 Q38 22 36 40Z" fill="#cbd5e1" ' + L + '/><path d="M60 8 L60 -8 Q68 -2 64 8" fill="' + o.hatc + '" ' + L + '/><path d="M36 30 Q60 22 84 30" stroke="' + T + '" stroke-width="2" fill="none"/>';
    if (hat === 'pearl') s += crownPath(18, 10, '#e0f2fe') + [40, 46, 53, 60, 67, 74, 80].map(function (x, i) { return '<circle cx="' + x + '" cy="' + (19 - (i === 3 ? 1 : 0)) + '" r="1.8" fill="#fff" stroke="#93c5fd" stroke-width=".5"/>'; }).join('') + '<path d="M54 6 Q60 -2 66 6 Q60 4 54 6Z" fill="#f9a8d4" ' + L + '/>';
    return '<svg class="pzA' + (long ? ' lg' : '') + '" viewBox="0 0 120 180" width="100%" style="display:block;overflow:visible"><defs>' + D + '</defs>' + s + '</g></svg>';
  }

  var BOYS = [
    [0, 'O‘quvchi', { g: 'b', hs: 'spiky', h: ['#3b3f8f', '#1f2160', '#14163f'], e: ['#7a3200', '#e07a10', '#ffd27a'], c: ['#ff6b3d', '#d9361a', '#c2310f'], cuff: 1 }],
    [50, 'Sportchi', { g: 'b', hs: 'short', h: ['#8b5a2b', '#5c3a1a', '#3b2410'], e: ['#14532d', '#22c55e', '#bbf7d0'], c: ['#22c55e', '#15803d', '#166534'], p: ['#15803d', '#14532d'], hat: 'band', hatc: '#ef4444', cuff: 1, t: '#fff', tee: '#fde047', aura: 'star', auraN: 3 }],
    [100, 'Ninja', { g: 'b', hs: 'spiky', h: ['#4b5563', '#1f2937', '#111827'], e: ['#7f1d1d', '#dc2626', '#fca5a5'], c: ['#334155', '#1e293b', '#0f172a'], p: ['#1e293b', '#0f172a'], body: 'kimono', t: '#dc2626', hat: 'band', hatc: '#dc2626', mask: '#1e293b', prop: 'katana', boots: '#1f2937', aura: 'leaf', auraN: 4 }],
    [150, 'Sehrgar shogirdi', { g: 'b', hs: 'short', h: ['#fcd34d', '#f59e0b', '#b45309'], e: ['#4c1d95', '#8b5cf6', '#ddd6fe'], c: ['#8b5cf6', '#6d28d9', '#4c1d95'], body: 'robe', hat: 'wizard', hatc: '#6d28d9', prop: 'staff', orb: '#22d3ee', aura: 'star', shoe: '#4c1d95', st: '#ddd6fe', hem: '#fde047' }],
    [200, 'Ritsar', { g: 'b', hs: 'short', h: ['#a16207', '#713f12', '#422006'], e: ['#1e3a8a', '#3b82f6', '#bfdbfe'], c: ['#f1f5f9', '#94a3b8', '#64748b'], sl: '#94a3b8', p: ['#475569', '#334155'], body: 'armor', cape: '#1d4ed8', prop: 'sword', boots: '#64748b', gem: '#3b82f6', aura: 'star' }],
    [250, 'Samuray', { g: 'b', hs: 'pony', h: ['#374151', '#111827', '#030712'], e: ['#7c2d12', '#ea580c', '#fed7aa'], c: ['#dc2626', '#991b1b', '#7f1d1d'], p: ['#1f2937', '#111827'], body: 'kimono', t: '#111827', prop: 'katana', boots: '#111827', aura: 'petal', cape: '#111827' }],
    [300, 'Kosmik qahramon', { g: 'b', hs: 'spiky', h: ['#67e8f9', '#0891b2', '#164e63'], e: ['#0c4a6e', '#0ea5e9', '#a5f3fc'], c: ['#f8fafc', '#cbd5e1', '#94a3b8'], sl: '#e2e8f0', p: ['#e2e8f0', '#94a3b8'], body: 'suit', t: '#06b6d4', boots: '#0891b2', cape: '#0e7490', glow: '#22d3ee', aura: 'bubble', prop: 'shield', shc: '#0891b2' }],
    [350, 'Olov ritsari', { g: 'b', hs: 'flame', h: ['#fde047', '#f97316', '#b91c1c'], e: ['#7c2d12', '#f97316', '#fde68a'], c: ['#fca5a5', '#dc2626', '#7f1d1d'], sl: '#b91c1c', p: ['#7f1d1d', '#450a0a'], body: 'armor', t: '#fbbf24', cape: '#b91c1c', prop: 'sword', blade: '#fdba74', boots: '#7f1d1d', gem: '#fde047', glow: '#f97316', aura: 'fire', auraN: 8 }],
    [400, 'Ajdar shahzodasi', { g: 'b', hs: 'spiky', h: ['#86efac', '#16a34a', '#14532d'], e: ['#713f12', '#eab308', '#fef08a'], c: ['#4ade80', '#15803d', '#14532d'], sl: '#15803d', p: ['#14532d', '#052e16'], body: 'armor', t: '#facc15', hat: 'horns', hatc: '#fef3c7', wings: 'dragon', wc: '#16a34a', wc2: '#86efac', prop: 'sword', boots: '#14532d', gem: '#facc15', glow: '#4ade80', aura: 'gold', auraN: 7 }],
    [450, 'Shashka imperatori', { g: 'b', hs: 'short', h: ['#fef9c3', '#facc15', '#a16207'], e: ['#4c1d95', '#a855f7', '#f5d0fe'], c: ['#fef08a', '#eab308', '#a16207'], sl: '#eab308', p: ['#1f2937', '#111827'], body: 'armor', t: '#7c3aed', hat: 'crown', cape: 'chk', prop: 'scepter', orb: '#a855f7', boots: '#a16207', gem: '#a855f7', glow: '#facc15', aura: 'gold', auraN: 8, wings: 'angel' }]
  ];
  var GIRLS = [
    [0, 'Qizcha', { g: 'g', hs: 'twin', h: ['#c08457', '#8b5a2b', '#5c3a1a'], e: ['#14532d', '#22c55e', '#bbf7d0'], c: ['#fbcfe8', '#ec4899', '#be185d'], sl: '#f9a8d4', body: 'dress', hat: 'bow', hatc: '#ec4899', t: '#fde047', st: '#fff', shoe: '#ec4899', sole: '#be185d' }],
    [50, 'Gul parisi', { g: 'g', hs: 'long', h: ['#fef3c7', '#fcd34d', '#d97706'], e: ['#14532d', '#16a34a', '#bbf7d0'], c: ['#bbf7d0', '#4ade80', '#16a34a'], sl: '#86efac', body: 'dress', hat: 'flower', wings: 'fairy', wc: '#f9a8d4', wc2: '#ec4899', aura: 'petal', st: '#fdf2f8', shoe: '#16a34a', sole: '#14532d' }],
    [100, 'Sehrgar qiz', { g: 'g', hs: 'wavy', h: ['#5eead4', '#0d9488', '#134e4a'], e: ['#4c1d95', '#8b5cf6', '#ddd6fe'], c: ['#99f6e4', '#14b8a6', '#115e59'], body: 'robe', hat: 'witch', hatc: '#115e59', prop: 'wand', aura: 'star', shoe: '#115e59', st: '#ccfbf1', hem: '#fde047' }],
    [150, 'Gul malikasi', { g: 'g', hs: 'long', h: ['#c2410c', '#9a3412', '#7c2d12'], e: ['#14532d', '#16a34a', '#bbf7d0'], c: ['#fdf2f8', '#f9a8d4', '#db2777'], bod: '#ec4899', body: 'gown', hat: 'flower', aura: 'petal', auraN: 8, shoe: '#f472b6' }],
    [200, 'Dengiz malikasi', { g: 'g', hs: 'wavy', h: ['#a5f3fc', '#22d3ee', '#0e7490'], e: ['#164e63', '#06b6d4', '#cffafe'], c: ['#ecfeff', '#67e8f9', '#0e7490'], bod: '#0891b2', body: 'gown', hat: 'pearl', aura: 'bubble', auraN: 8, shoe: '#22d3ee' }],
    [250, 'Oy malikasi', { g: 'g', hs: 'long', h: ['#4338ca', '#1e1b4b', '#0f0a2e'], e: ['#4c1d95', '#8b5cf6', '#ede9fe'], c: ['#6366f1', '#312e81', '#0f172a'], bod: '#312e81', body: 'gown', hat: 'moon', cape: '#1e1b4b', capeOp: .85, aura: 'star', auraN: 8, shoe: '#6366f1', glow: '#818cf8' }],
    [300, 'Qor malikasi', { g: 'g', hs: 'long', h: ['#f5f3ff', '#ddd6fe', '#5ab8f0'], e: ['#0c4a8a', '#2b8fe0', '#8fe3ff'], c: ['#dff4ff', '#8fd3fb', '#1d5fa8'], bod: '#1e3f8f', body: 'gown', hat: 'ice', cape: '#bae6fd', capeOp: .55, fur: 1, aura: 'snow', auraN: 8, glow: '#7dd3fc', t: '#bfe9ff' }],
    [350, 'Olov malikasi', { g: 'g', hs: 'wavy', h: ['#fde047', '#f97316', '#b91c1c'], e: ['#7c2d12', '#f97316', '#fde68a'], c: ['#fed7aa', '#f97316', '#991b1b'], bod: '#b91c1c', body: 'gown', hat: 'flamecrown', cape: '#dc2626', capeOp: .8, aura: 'fire', auraN: 8, glow: '#fb923c', shoe: '#dc2626', prop: 'wand' }],
    [400, 'Farishta malika', { g: 'g', hs: 'long', h: ['#fffbeb', '#fde68a', '#d97706'], e: ['#1e3a8a', '#3b82f6', '#dbeafe'], c: ['#ffffff', '#fef3c7', '#fcd34d'], bod: '#fde68a', body: 'gown', hat: 'halo', wings: 'angel', aura: 'heart', auraN: 8, glow: '#fde68a', shoe: '#facc15', hem: '#facc15' }],
    [450, 'Shashka malikasi', { g: 'g', hs: 'long', h: ['#fdf4ff', '#e9d5ff', '#a855f7'], e: ['#4c1d95', '#a855f7', '#f5d0fe'], c: ['#f5d0fe', '#a855f7', '#581c87'], bod: '#facc15', body: 'gown', hat: 'crown', cape: 'chk', prop: 'scepter', orb: '#f0abfc', glow: '#e879f9', aura: 'gold', auraN: 8, wings: 'fairy', wc: '#f0abfc', wc2: '#a855f7', shoe: '#facc15', hem: '#facc15' }]
  ];

  var HEROES = [];   // [id, nomi, kerakli masala, sozlama, jins]
  BOYS.forEach(function (x) { HEROES.push(['b' + x[0], x[1], x[0], x[2], 'b']); });
  GIRLS.forEach(function (x) { HEROES.push(['g' + x[0], x[1], x[0], x[2], 'g']); });
  var HMAP = {}; HEROES.forEach(function (x) { HMAP[x[0]] = x; });
  function heroSvg(id) { return anime((HMAP[id] || HEROES[0])[3]); }
  var HCSS = '.pzA .hLf{transform-origin:55px 128px}.pzA .hLb{transform-origin:64px 128px}.pzA.lg .hLf{transform-origin:56px 150px}.pzA.lg .hLb{transform-origin:62px 150px}' +
    '.pzA .hAf{transform-origin:42px 92px}.pzA .hAb{transform-origin:78px 92px}.pzA .hHd{transform-origin:60px 80px}.pzA .hGn,.pzA .hCp{transform-origin:60px 96px}.pzA .hBr{transform-origin:60px 46px}.pzA .hWg{transform-origin:60px 96px}' +
    '.pzA .hEy{transform-origin:60px 53px;animation:hBlink 3.6s infinite}@keyframes hBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    '.pzA .hAu{transform-box:fill-box;transform-origin:center;animation:hAu 3.5s ease-in-out infinite}@keyframes hAu{0%{transform:translate(0,0) rotate(0) scale(.6);opacity:0}25%{opacity:1}50%{transform:translate(3px,-6px) rotate(120deg) scale(1.1);opacity:1}100%{transform:translate(-2px,-12px) rotate(240deg) scale(.6);opacity:0}}' +
    '.pzA .hTw{animation:hTw 1.4s ease-in-out infinite}@keyframes hTw{0%,100%{opacity:.3}50%{opacity:1}}' +
    '.pzA .hGl{transform-box:fill-box;transform-origin:center;animation:hGl 2.4s ease-in-out infinite}@keyframes hGl{0%,100%{opacity:.6;transform:scale(.92)}50%{opacity:1;transform:scale(1.05)}}' +
    '.pzA .hWg{animation:hWg 1.6s ease-in-out infinite}@keyframes hWg{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.88)}}' +
    '.idle .pzA .hAf{animation:hSw 2.4s ease-in-out infinite}.idle .pzA .hAb{animation:hSw 2.4s ease-in-out infinite reverse}.idle .pzA .hHd{animation:hNod 3.2s ease-in-out infinite}.idle .pzA .hGn,.idle .pzA .hCp,.idle .pzA .hBr{animation:hGnI 3s ease-in-out infinite}' +
    '@keyframes hSw{0%,100%{transform:rotate(4deg)}50%{transform:rotate(-3deg)}}@keyframes hNod{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}@keyframes hGnI{0%,100%{transform:skewX(-1.5deg)}50%{transform:skewX(1.5deg)}}' +
    '.walk .pzA .hLf{animation:hStep .36s ease-in-out infinite alternate}.walk .pzA .hLb{animation:hStep .36s ease-in-out infinite alternate-reverse}' +
    '.walk .pzA .hAf{animation:hArm .36s ease-in-out infinite alternate-reverse}.walk .pzA .hAb{animation:hArm .36s ease-in-out infinite alternate}' +
    '.walk .pzA .hGn,.walk .pzA .hBr{animation:hGnW .36s ease-in-out infinite alternate}.walk .pzA .hCp{animation:hGnW .36s ease-in-out infinite alternate-reverse}.walk .pzA .hWg{animation:hWg .3s ease-in-out infinite}' +
    '@keyframes hStep{from{transform:rotate(20deg)}to{transform:rotate(-20deg)}}@keyframes hArm{from{transform:rotate(24deg)}to{transform:rotate(-24deg)}}@keyframes hGnW{from{transform:skewX(-5deg)}to{transform:skewX(5deg)}}' +
    '.joy .pzA .hAf{animation:hUpF .45s ease-in-out infinite alternate}.joy .pzA .hAb{animation:hUpB .45s ease-in-out infinite alternate}.joy .pzA .hWg{animation:hWg .25s infinite}' +
    '@keyframes hUpF{from{transform:rotate(150deg)}to{transform:rotate(120deg)}}@keyframes hUpB{from{transform:rotate(-150deg)}to{transform:rotate(-120deg)}}' +
    '@media (prefers-reduced-motion:reduce){.pzA *{animation:none!important}}';
  function heroCss() { if (document.getElementById('pzHeroCss2')) return; var st = document.createElement('style'); st.id = 'pzHeroCss2'; st.textContent = HCSS; document.head.appendChild(st); }
  var HS = { av: '', n: 0, save: null };
  function heroAv() { var x = HMAP[HS.av]; return x && HS.n >= x[2] ? HS.av : 'b0'; }
  function setHero(av, n, save) { HS.av = av || ''; HS.n = n || 0; HS.save = save; }
  function picker(onDone) {
    heroCss();
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(5,8,25,.97);color:#fff;overflow:auto;padding:16px;font:15px system-ui,sans-serif;box-sizing:border-box';
    var cur = heroAv(), h = '<div style="display:flex;align-items:center;margin-bottom:6px"><b style="flex:1;font-size:19px">🦸 Qahramon tanlang</b><button data-x style="border:0;border-radius:10px;padding:8px 12px;background:#2b3270;color:#fff;font-size:16px">✕</button></div>' +
      '<div style="font-size:13px;opacity:.8;margin-bottom:6px">Siz yechgan masalalar: <b>' + HS.n + '</b>. Har 50 ta masalada yangi, yanada zo‘r qahramon ochiladi!</div>';
    [['b', '👦 Bolalar'], ['g', '👧 Qizlar']].forEach(function (sx) {
      h += '<div style="font-weight:800;font-size:16px;margin:14px 0 8px">' + sx[1] + '</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
      HEROES.forEach(function (x) {
        if (x[4] !== sx[0]) return;
        var ok = HS.n >= x[2], on = x[0] === cur;
        h += '<button data-av="' + x[0] + '" ' + (ok ? '' : 'disabled') + ' style="position:relative;border:' + (on ? '3px solid #ffd54f' : '2px solid #2b3270') + ';border-radius:16px;padding:8px 2px;background:' + (on ? 'linear-gradient(#4a4210,#2a2608)' : 'linear-gradient(#25306b,#141a40)') + ';color:#fff">' +
          '<div class="' + (on ? 'idle' : '') + '" style="width:70px;margin:6px auto 0;' + (ok ? '' : 'filter:grayscale(.85) brightness(.6)') + '">' + heroSvg(x[0]) + '</div><div style="font-size:12px;font-weight:800;margin-top:2px">' + x[1] + '</div>' +
          '<div style="font-size:11px;margin-top:2px;color:' + (ok ? '#a7f3d0' : '#fde68a') + '">' + (on ? '✅ tanlangan' : ok ? 'Tanlash' : '🔒 ' + x[2] + ' ta masala') + '</div></button>';
      });
      h += '</div>';
    });
    ov.innerHTML = h; document.body.appendChild(ov);
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
    var h = '<div class="pzBar"><button class="pzHeroPick" data-heropick><span class="idle" style="display:inline-block;width:26px;height:26px;overflow:hidden;vertical-align:middle;margin:-6px 6px -4px 0">' + heroSvg(heroAv()) + '</span>Qahramon</button>' + (admin ? '<button class="pzMapEd" data-mapedit>🗺 Xaritani sozlash</button>' : '') + '</div><div id="pzScroll">';
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
    var hp = root.querySelector('[data-heropick]'); if (hp) hp.onclick = function () { picker(function () { var a = heroAv(); hb.innerHTML = heroSvg(a); hp.innerHTML = '<span class="idle" style="display:inline-block;width:26px;height:26px;overflow:hidden;vertical-align:middle;margin:-6px 6px -4px 0">' + heroSvg(a) + '</span>Qahramon'; hb.className = 'joy'; setTimeout(function () { hb.className = 'idle'; }, 1800); }); };
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
