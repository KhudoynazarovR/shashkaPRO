/* daraxt.js — 🌳 Tanga daraxti: bosh sahifadagi karta va to'liq oyna (server: daraxtsrv.js).
   6 bosqich: nihol → ko'chat → yosh daraxt → katta daraxt → gullagan olma → mevali olma (hosil). Rasmlar o'zimiz chizgan SVG. */
;(function () {
  if (window.spDaraxt) return;
  var S = null, ov = null;
  var $ = function (id) { return document.getElementById(id); };
  function hd() { return { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  function load(cb) { fetch('/api/daraxt', { headers: hd() }).then(function (r) { return r.json(); }).then(function (j) { if (j && !j.error) { S = j; card(); if (ov) render(); } if (cb) cb(); }).catch(function () {}); }
  function post(u, b) { return fetch(u, { method: 'POST', headers: hd(), body: JSON.stringify(b || {}) }).then(function (r) { return r.json(); }); }
  function fmt(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function R(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  // daraxt rasmi (bosqich 0–5)
  function tree(st, u) {
    var g = '<svg viewBox="0 0 200 220" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="sk' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient>' +
      '<radialGradient id="ap' + u + '" cx=".35" cy=".3"><stop offset="0" stop-color="#ff8a80"/><stop offset=".55" stop-color="#e53935"/><stop offset="1" stop-color="#9b1b1b"/></radialGradient>' +
      '<linearGradient id="tr' + u + '" x1="0" x2="1"><stop offset="0" stop-color="#6d4426"/><stop offset=".5" stop-color="#8b5a33"/><stop offset="1" stop-color="#5a361c"/></linearGradient></defs>';
    g += '<rect width="200" height="220" fill="url(#sk' + u + ')"/><circle cx="165" cy="35" r="16" fill="#fff4b8"/><ellipse cx="45" cy="40" rx="20" ry="7" fill="#fff" opacity=".8"/><ellipse cx="60" cy="36" rx="13" ry="6" fill="#fff" opacity=".8"/>';
    g += '<path d="M0 185 Q100 168 200 185 V220 H0Z" fill="#6cc04a"/><path d="M0 198 Q100 186 200 198 V220 H0Z" fill="#4fa83a"/>';
    var r = R(7 + st), i, gy = 180, AP = 'url(#ap' + u + ')';
    for (i = 0; i < 18; i++) { var x = r() * 200, y = 188 + r() * 28; g += '<path d="M' + x + ' ' + y + ' l1.5 -5 l1.5 5" stroke="#3d8f2e" stroke-width="1" fill="none"/>'; }
    if (st === 0) {
      g += '<ellipse cx="100" cy="182" rx="16" ry="4" fill="#7a5230"/><path d="M100 180 C100 170 99 162 100 154" stroke="#3f8f2e" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M100 158 C88 150 82 152 80 146 C90 142 98 148 100 158Z" fill="#6fd14f"/><path d="M100 156 C110 146 118 146 122 140 C112 136 102 144 100 156Z" fill="#58c03c"/>';
    } else if (st === 1) {
      g += '<ellipse cx="100" cy="182" rx="20" ry="5" fill="#7a5230"/><line x1="112" y1="182" x2="112" y2="120" stroke="#c9a26b" stroke-width="3"/><path d="M100 180 C101 160 99 140 100 118" stroke="url(#tr' + u + ')" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M100 140 L84 126 M100 132 L117 118" stroke="#6d4426" stroke-width="2.5" stroke-linecap="round"/>';
      [[84, 124], [117, 116], [100, 114], [90, 134], [110, 128], [96, 104], [106, 106]].forEach(function (p, k) { g += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="8" ry="4.5" transform="rotate(' + (k * 37 % 80 - 40) + ' ' + p[0] + ' ' + p[1] + ')" fill="' + (k % 2 ? '#5cc23f' : '#7ad65a') + '"/>'; });
    } else {
      var sc = [0, 0, .62, .85, 1, 1][st], th = [0, 0, 9, 13, 16, 16][st], top = gy - [0, 0, 70, 100, 115, 115][st];
      g += '<path d="M' + (100 - th) + ' 182 Q' + (100 - th * .4) + ' ' + ((gy + top) / 2) + ' ' + (100 - th * .35) + ' ' + (top + 30 * sc) + ' L' + (100 + th * .35) + ' ' + (top + 30 * sc) + ' Q' + (100 + th * .4) + ' ' + ((gy + top) / 2) + ' ' + (100 + th) + ' 182Z" fill="url(#tr' + u + ')"/>';
      g += '<path d="M100 ' + (top + 45 * sc) + ' L' + (100 - 45 * sc) + ' ' + (top + 5 * sc) + ' M100 ' + (top + 50 * sc) + ' L' + (100 + 48 * sc) + ' ' + (top + 8 * sc) + ' M100 ' + (top + 38 * sc) + ' L100 ' + (top - 5 * sc) + '" stroke="#6d4426" stroke-width="' + (th * .45) + '" stroke-linecap="round"/>';
      var cx = 100, cy = top + 5 * sc, rr = R(3), cols = ['#2e8b3e', '#3aa64a', '#47b955', '#2a7a37', '#56c763'], k, a, d;
      for (k = 0; k < 34; k++) { a = rr() * Math.PI * 2; d = Math.sqrt(rr()) * 58 * sc; g += '<circle cx="' + (cx + Math.cos(a) * d * 1.15) + '" cy="' + (cy + Math.sin(a) * d * .78) + '" r="' + ((14 + rr() * 10) * sc) + '" fill="' + cols[k % 5] + '"/>'; }
      for (k = 0; k < 14; k++) { a = rr() * Math.PI * 2; d = Math.sqrt(rr()) * 50 * sc; g += '<circle cx="' + (cx + Math.cos(a) * d * 1.1 - 4) + '" cy="' + (cy + Math.sin(a) * d * .7 - 6) + '" r="' + (7 * sc) + '" fill="#7fdc6c" opacity=".55"/>'; }
      if (st === 4) {
        var rb = R(21);
        for (k = 0; k < 46; k++) { a = rb() * Math.PI * 2; d = Math.sqrt(rb()) * 62; var x3 = cx + Math.cos(a) * d * 1.12, y3 = cy + Math.sin(a) * d * .76; for (var q = 0; q < 5; q++) { var an = q * 72 * Math.PI / 180; g += '<circle cx="' + (x3 + Math.cos(an) * 2.4) + '" cy="' + (y3 + Math.sin(an) * 2.4) + '" r="2.1" fill="' + (k % 3 ? '#fff' : '#ffc8dd') + '"/>'; } g += '<circle cx="' + x3 + '" cy="' + y3 + '" r="1.2" fill="#ffd166"/>'; }
        for (k = 0; k < 8; k++) g += '<ellipse cx="' + (40 + rb() * 120) + '" cy="' + (150 + rb() * 40) + '" rx="2" ry="1.2" fill="#ffc8dd"/>';
      }
      if (st === 5) {
        var ra = R(33);
        for (k = 0; k < 22; k++) { a = ra() * Math.PI * 2; d = Math.sqrt(ra()) * 60; var x4 = cx + Math.cos(a) * d * 1.12, y4 = cy + Math.sin(a) * d * .76 + 4; g += '<circle cx="' + x4 + '" cy="' + y4 + '" r="6.2" fill="' + AP + '"/><path d="M' + x4 + ' ' + (y4 - 6) + ' q1 -3 3 -4" stroke="#5a361c" stroke-width="1.2" fill="none"/>'; }
        [[58, 190], [140, 192], [125, 198], [70, 200]].forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="' + AP + '"/>'; });
        g += '<path d="M150 200 q8 -12 22 -10 l-3 14 q-10 4 -19 -4z" fill="#b5783a"/><circle cx="156" cy="194" r="4.5" fill="' + AP + '"/><circle cx="164" cy="193" r="4.5" fill="' + AP + '"/>';
      }
    }
    return g + '</svg>';
  }
  var st = document.createElement('style');
  st.textContent =
    '#lbPanel #hzHero #dxCard{order:3!important}' +
    '#dxCard{flex:1 1 100%;width:100%;box-sizing:border-box;display:flex;gap:12px;align-items:center;border-radius:20px;overflow:hidden;margin:0 0 12px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#123d26,#1d5a36 60%,#14532d);border:1px solid rgba(134,239,172,.25);padding:10px}' +
    '#dxCard .im{width:84px;height:92px;flex:none;border-radius:14px;overflow:hidden}#dxCard .im svg{width:100%;height:100%;display:block}' +
    '#dxCard .tx{flex:1;min-width:0}#dxCard .t{font-size:11px;letter-spacing:1.2px;font-weight:800;color:#bbf7d0}#dxCard b{display:block;font-size:17px;margin:2px 0 6px}' +
    '#dxCard .br{height:7px;border-radius:4px;background:rgba(255,255,255,.15);overflow:hidden}#dxCard .br i{display:block;height:100%;background:linear-gradient(90deg,#4ade80,#16a34a)}#dxCard small{display:block;font-size:12px;opacity:.85;margin-top:5px}' +
    '#dxCard.hv{background:linear-gradient(135deg,#5a1414,#9b1b1b 60%,#14532d);border-color:rgba(255,138,128,.4)}#dxCard.hv .br i{background:linear-gradient(90deg,#f87171,#dc2626)}' +
    '#dxOv{position:fixed;inset:0;z-index:2147482100;background:#0b0e1a;color:#fff;overflow-y:auto;font-family:inherit}#dxOv .in{max-width:520px;margin:0 auto;padding:14px 14px 96px}' +
    '#dxOv .hd{display:flex;align-items:center;gap:10px;margin-bottom:10px}#dxOv .hd button{width:40px;height:40px;border:0;border-radius:12px;background:rgba(255,255,255,.08);color:#fff;font-size:22px}#dxOv .hd b{font-size:21px;flex:1}' +
    '#dxOv .hd span{font-size:12px;font-weight:800;border-radius:8px;padding:4px 9px;background:#14532d;color:#bbf7d0}#dxOv .hd span.hv{background:#7f1d1d;color:#fecaca}' +
    '#dxOv .big{border-radius:20px;overflow:hidden}#dxOv .big svg{display:block;width:100%}' +
    '#dxOv .br{height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;margin:12px 0 6px}#dxOv .br i{display:block;height:100%;background:linear-gradient(90deg,#4ade80,#16a34a)}#dxOv .pg{font-size:13px;opacity:.8}' +
    '#dxOv .kv{display:flex;gap:8px;margin:12px 0}#dxOv .kv div{flex:1;background:#161a3a;border-radius:12px;padding:9px 4px;text-align:center;font-size:11.5px;opacity:.95}#dxOv .kv b{display:block;font-size:17px}' +
    '#dxOv .st{display:flex;gap:4px;margin:8px 0 12px}#dxOv .st div{flex:1;text-align:center;font-size:10.5px;opacity:.45}#dxOv .st div.on{opacity:1;color:#86efac;font-weight:700}#dxOv .st i{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.2);margin-bottom:4px}#dxOv .st div.on i{background:#4ade80}' +
    '#dxOv .go{width:100%;border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:900;color:#fff;background:linear-gradient(90deg,#ef4444,#b91c1c);font-family:inherit}#dxOv .go:disabled{opacity:.5}' +
    '#dxOv .nt{background:#161a3a;border-radius:14px;padding:12px;font-size:13px;line-height:1.5;opacity:.9}#dxOv .ad{margin-top:10px;border:1px dashed rgba(255,255,255,.25);background:none;color:#fff;border-radius:12px;padding:9px 12px;font-family:inherit}';
  document.head.appendChild(st);
  function left(ms) { var h = Math.max(0, Math.ceil(ms / 3600e3)); return h > 24 ? Math.ceil(h / 24) + ' kun' : h + ' soat'; }
  function prog() {
    if (!S) return { pc: 0, txt: '' };
    if (S.harv) return { pc: 100, txt: S.harv.picked ? 'Bugun olma terdingiz · ertaga yana' : 'Olma terish uchun bosing · ' + left(S.harv.until - S.now) + ' qoldi' };
    var a = S.th[S.stage], b = S.th[S.stage + 1] || S.th[5], nn = ['Ko‘chatgacha', 'Yosh daraxtgacha', 'Katta daraxtgacha', 'Gullashigacha', 'Hosilgacha'][S.stage];
    return { pc: Math.max(2, Math.min(100, Math.round((S.pool - a) / (b - a) * 100))), txt: nn + ': ' + fmt(S.pool) + ' / ' + fmt(b) + ' tanga' };
  }
  // 🏠 bosh sahifa kartasi
  function card() {
    var hero = $('hzHero'); if (!hero || !S) return;
    var c0 = $('dxCard'); if (c0) c0.remove(); return;   // bosh sahifada emas — Menyu'da (menu.js: @daraxt)
    var c = $('dxCard');
    if (!c) { c = document.createElement('div'); c.id = 'dxCard'; c.onclick = open; }
    var anchor = $('drBan') || $('hxPz');
    if (anchor && anchor.parentNode === hero) { if (anchor.nextSibling !== c) hero.insertBefore(c, anchor.nextSibling); } else if (c.parentNode !== hero) hero.appendChild(c);
    var p = prog(), h = '<div class="im">' + tree(S.stage, 'c') + '</div><div class="tx"><div class="t">TANGA DARAXTI</div><b>' + (S.harv ? 'Hosil vaqti!' : S.name) + '</b><div class="br"><i style="width:' + p.pc + '%"></i></div><small>' + p.txt + '</small></div>';
    c.className = S.harv ? 'hv' : '';
    if (c._h !== h) { c.innerHTML = h; c._h = h; }
  }
  // 🌳 to'liq oyna
  function render() {
    if (!ov || !S) return;
    var p = prog(), N = ['Nihol', 'Ko‘chat', 'Yosh', 'Katta', 'Gul', 'Meva'];
    var h = '<div class="in"><div class="hd"><button id="dxB">‹</button><b>Tanga daraxti</b><span class="' + (S.harv ? 'hv' : '') + '">' + (S.harv ? 'Hosil vaqti!' : S.name) + '</span></div>' +
      '<div class="big">' + tree(S.stage, 'b') + '</div>' +
      '<div class="br"><i style="width:' + p.pc + '%;' + (S.harv ? 'background:linear-gradient(90deg,#f87171,#dc2626)' : '') + '"></i></div><div class="pg">' + p.txt + '</div>' +
      '<div class="st">' + N.map(function (n, i) { return '<div class="' + (i <= S.stage ? 'on' : '') + '"><i></i>' + n + '</div>'; }).join('') + '</div>';
    if (S.harv) h += '<button class="go" id="dxPick"' + (S.harv.picked ? ' disabled' : '') + '>' + (S.harv.picked ? 'Bugun terdingiz' : 'Olma terish · +' + S.harv.reward + ' tanga') + '</button>';
    h += '<div class="kv"><div><b>' + fmt(S.week.sum) + '</b>bu hafta tanga</div><div><b>' + fmt(S.week.cnt) + '</b>xato</div><div><b>' + fmt(S.week.ppl) + '</b>kishi hissa</div></div>';
    h += '<div class="nt">Daraxt o‘yinchilar xato qilganda olinadigan tangalar bilan o‘sadi. ' + fmt(S.th[5]) + ' tangaga yetganda olma pishadi: 3 kun davomida har kim kuniga bir marta olma teradi. Ko‘p masala yechganlarga ko‘proq tanga tushadi. Hosildan keyin daraxt bog‘da qoladi va yangi nihol ekiladi.' + (S.garden ? '<br><br>Bog‘da: ' + S.garden + ' ta daraxt' : '') + '</div>';
    if (S.admin) h += '<button class="ad" id="dxAd">Admin sinovi: +1 000 tanga</button> <button class="ad" id="dxRs">Nolga qaytarish</button>';
    ov.innerHTML = h + '</div>';
    ov.querySelector('#dxB').onclick = close;
    var pk = ov.querySelector('#dxPick'); if (pk) pk.onclick = function () {
      pk.disabled = true;
      post('/api/daraxt/pick').then(function (r) { if (r && r.error) { alert(r.error); pk.disabled = false; return; } S = r; card(); render(); try { Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {} alert('🍎 +' + r.got + ' tanga!'); });
    };
    var rs = ov.querySelector('#dxRs'); if (rs) rs.onclick = function () { if (!confirm('Daraxt boshidan boshlansinmi? (nihol, 0 tanga)')) return; post('/api/daraxt/reset').then(function (r) { if (r && !r.error) { S = r; card(); render(); } }); };
    var ad = ov.querySelector('#dxAd'); if (ad) ad.onclick = function () { post('/api/daraxt/add', { n: 1000 }).then(function (r) { if (r && !r.error) { S = r; card(); render(); } }); };
  }
  function open() { if (!ov) { ov = document.createElement('div'); ov.id = 'dxOv'; document.body.appendChild(ov); } render(); load(); }
  function close() { if (ov) ov.remove(); ov = null; }
  window.spDaraxtOpen = function () { open(); };
  window.spDaraxt = open;
  load();
  setInterval(card, 3000);
  setInterval(function () { if (!document.hidden) load(); }, 90000);
})();
