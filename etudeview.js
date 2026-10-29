/* ETUDEVIEW — ♔ Etyudlar (L.S. Vitoshkin, «Этюды в русские шашки», Антология, 1–5 qismlar).
   Har bir etyud King Kongga qarshi yechiladi: istalgan to'g'ri yo'l qabul qilinadi (natijani endshpil bazasi hal qiladi). */
;(function () {
  if (window.spEtudes) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var ov = null, L = null, S = {}, part = 1, flt = 'all', shown = 30, cur = null, solIx = 0, solPly = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(p) { return fetch(p, { headers: { 'x-init-data': (tg && tg.initData) || '' } }).then(function (r) { return r.json(); }); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function css() {
    if (document.getElementById('etCss')) return;
    var s = document.createElement('style'); s.id = 'etCss';
    s.textContent = '#spEtd{position:fixed;inset:0;z-index:2147482600;overflow-y:auto;background:radial-gradient(circle at 50% 0,#3b2a10,#120c05 62%);color:#fff;font-family:system-ui,Roboto,sans-serif;padding:12px 12px 100px;box-sizing:border-box}' +
      '#spEtd .tp{display:flex;align-items:center;gap:10px;margin-bottom:10px}#spEtd .tp b{flex:1;font-size:19px}#spEtd .tp button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:12px;min-width:42px;height:42px;font-size:18px}#spEtd .tp em{font-style:normal;font-weight:800;color:#ffd27a;background:rgba(0,0,0,.35);padding:7px 10px;border-radius:12px;font-size:14px}' +
      '#spEtd .hero{background:rgba(0,0,0,.3);border:1px solid rgba(255,210,122,.25);border-radius:16px;padding:12px;margin-bottom:10px;font-size:13.5px;line-height:1.45;color:#ffe9c2}#spEtd .hero b{color:#fff}' +
      '#spEtd .tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;scrollbar-width:none}#spEtd .tabs button{flex:1 0 auto;border:0;border-radius:12px;padding:9px 12px;background:rgba(255,255,255,.1);color:#fff;font:700 14px system-ui}#spEtd .tabs button.on{background:linear-gradient(180deg,#f5b72b,#c67c0a);color:#2a1700}' +
      '#spEtd .fl{display:flex;gap:6px;margin-bottom:10px}#spEtd .fl button{border:0;border-radius:10px;padding:7px 10px;background:rgba(255,255,255,.08);color:#ffe9c2;font:600 13px system-ui}#spEtd .fl button.on{background:rgba(245,183,43,.3);color:#fff}' +
      '#spEtd .gd{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}#spEtd .cd{position:relative;border:0;padding:6px;border-radius:12px;background:rgba(0,0,0,.32);color:#fff;text-align:left;font:600 12px system-ui}#spEtd .cd svg{display:block;width:100%;height:auto;border-radius:4px}#spEtd .cd b{display:block;margin-top:5px;font-size:13px}#spEtd .cd span{display:block;color:#ffd9a0;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spEtd .cd i{position:absolute;top:2px;right:4px;font-style:normal;font-size:18px;text-shadow:0 1px 3px #000}#spEtd .cd.ok{box-shadow:inset 0 0 0 2px #4ade80}' +
      '#spEtd .more{display:block;width:100%;margin:12px 0;border:0;border-radius:12px;padding:12px;background:rgba(255,255,255,.12);color:#fff;font:700 15px system-ui}' +
      '#spEtd .md{position:fixed;inset:0;z-index:2;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px}#spEtd .mb{width:min(94vw,440px);max-height:94vh;overflow-y:auto;background:#24180a;border:1px solid rgba(255,210,122,.3);border-radius:18px;padding:12px;box-sizing:border-box}' +
      '#spEtd .mb h3{margin:2px 0 4px;font-size:18px}#spEtd .mb p{margin:0 0 10px;color:#ffe2b0;font-size:14px}#spEtd .mb svg{display:block;width:100%;height:auto;border-radius:6px}' +
      '#spEtd .go{display:block;width:100%;margin-top:10px;border:0;border-radius:14px;padding:14px;font:900 16px system-ui;color:#2a1700;background:linear-gradient(180deg,#ffd76a,#e09a12);box-shadow:0 3px 0 #7a4a04}#spEtd .bt{display:block;width:100%;margin-top:8px;border:0;border-radius:12px;padding:11px;background:rgba(255,255,255,.12);color:#fff;font:700 15px system-ui}' +
      '#spEtd .nv{display:flex;gap:6px;justify-content:center;margin-top:8px}#spEtd .nv button{border:0;border-radius:10px;height:40px;min-width:46px;background:rgba(255,255,255,.14);color:#fff;font-size:17px}#spEtd .ml{margin-top:8px;font:13px ui-monospace,Menlo,monospace;line-height:1.7;color:#ffe9c2}#spEtd .ml span{padding:2px 4px;border-radius:5px}#spEtd .ml span.on{background:#e09a12;color:#000}#spEtd .vs{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}#spEtd .vs button{border:0;border-radius:9px;padding:6px 9px;background:rgba(255,255,255,.1);color:#fff;font:600 13px system-ui}#spEtd .vs button.on{background:#e09a12;color:#000}';
    document.head.appendChild(s);
  }
  // 32 belgili satr → SVG doska
  function svg(b, opt) {
    var h = '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#f3d7a6"/>', k = 0;
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue;
      h += '<rect x="' + c * 10 + '" y="' + r * 10 + '" width="10" height="10" fill="#9a5b2a"/>';
      var ch = b.charAt(k++);
      if (ch === 'w' || ch === 'W' || ch === 'b' || ch === 'B') {
        var w = ch === 'w' || ch === 'W', x = c * 10 + 5, y = r * 10 + 5;
        h += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + (w ? '#fbf6ea' : '#1d1d1d') + '" stroke="' + (w ? '#6b5a3a' : '#000') + '" stroke-width=".7"/>';
        if (ch === 'W' || ch === 'B') h += '<circle cx="' + x + '" cy="' + y + '" r="2" fill="none" stroke="#e8a10f" stroke-width="1"/>';
      }
    }
    if (opt && opt.last) opt.last.forEach(function (q) { h += '<rect x="' + (q % 8) * 10 + '" y="' + Math.floor(q / 8) * 10 + '" width="10" height="10" fill="none" stroke="#ffe14d" stroke-width="1"/>'; });
    return h + '</svg>';
  }
  function goalTx(g) { return g === 'd' ? 'Oq yuradi va durang qiladi' : 'Oq yuradi va yutadi'; }
  function items() {
    return L.filter(function (e) {
      if (e[2] !== part) return false;
      if (flt === 'new' && S[e[0]]) return false;
      if (flt === 'draw' && e[4] !== 'd') return false;
      return true;
    });
  }
  function render() {
    var tot = L.length, ok = L.filter(function (e) { return S[e[0]]; }).length, h = '';
    h += '<div class="tp"><button id="etX">✕</button><b>♔ Etyudlar</b><em>✓ ' + ok + '/' + tot + '</em></div>';
    h += '<div class="hero">L.S. Vitoshkinning <b>«Etyudlar antologiyasi»</b> (5 qism). Siz oq bilan <b>King Kong</b>ga qarshi o‘ynaysiz — <b>istalgan</b> to‘g‘ri yo‘l qabul qilinadi. Birinchi yechim uchun <b>+15 🪙</b>.</div>';
    h += '<div class="tabs">';
    for (var p = 1; p <= 5; p++) {
      var all = L.filter(function (e) { return e[2] === p; }), dn = all.filter(function (e) { return S[e[0]]; }).length;
      if (all.length) h += '<button data-p="' + p + '" class="' + (p === part ? 'on' : '') + '">' + p + '-qism · ' + dn + '/' + all.length + '</button>';
    }
    h += '</div><div class="fl"><button data-f="all" class="' + (flt === 'all' ? 'on' : '') + '">Hammasi</button><button data-f="new" class="' + (flt === 'new' ? 'on' : '') + '">Yechilmagan</button><button data-f="draw" class="' + (flt === 'draw' ? 'on' : '') + '">🤝 Durang</button></div>';
    var I = items();
    h += '<div class="gd">';
    I.slice(0, shown).forEach(function (e) {
      h += '<button class="cd' + (S[e[0]] ? ' ok' : '') + '" data-id="' + esc(e[0]) + '">' + svg(e[5]) + '<b>№' + e[1] + (e[4] === 'd' ? ' 🤝' : '') + '</b><span>' + esc(e[3] || '—') + '</span>' + (S[e[0]] ? '<i>✅</i>' : '') + '</button>';
    });
    h += '</div>';
    if (I.length > shown) h += '<button class="more" id="etMore">Yana ko‘rsatish (' + (I.length - shown) + ')</button>';
    if (!I.length) h += '<div class="hero" style="text-align:center">Bu yerda etyud yo‘q</div>';
    ov.innerHTML = h;
    ov.querySelector('#etX').onclick = close;
    var mo = ov.querySelector('#etMore'); if (mo) mo.onclick = function () { shown += 60; render(); };
    each('[data-p]', function (b) { b.onclick = function () { part = +b.getAttribute('data-p'); shown = 30; ls('etPart', part); render(); ov.scrollTop = 0; }; });
    each('[data-f]', function (b) { b.onclick = function () { flt = b.getAttribute('data-f'); shown = 30; render(); }; });
    each('[data-id]', function (b) { b.onclick = function () { var id = b.getAttribute('data-id'); open(L.filter(function (e) { return e[0] === id; })[0]); }; });
  }
  function each(q, f) { Array.prototype.forEach.call(ov.querySelectorAll(q), f); }
  function modal(html) {
    var m = ov.querySelector('.md'); if (!m) { m = document.createElement('div'); m.className = 'md'; ov.appendChild(m); m.onclick = function (ev) { if (ev.target === m) shut(); }; }
    m.innerHTML = '<div class="mb">' + html + '</div>'; return m;
  }
  function shut() { var m = ov.querySelector('.md'); if (m) m.remove(); cur = null; }
  function open(e) {
    if (!e) return; cur = e;
    var m = modal('<h3>№' + e[1] + ' · ' + esc(e[3] || '') + (S[e[0]] ? ' ✅' : '') + '</h3><p>' + goalTx(e[4]) + ' · ' + e[2] + '-qism</p>' + svg(e[5]) +
      '<button class="go" id="etGo">▶ King Kongga qarshi yechish</button>' + (e[6] ? '<button class="bt" id="etSol">👁 Yechim yo‘llari</button>' : '') + '<button class="bt" id="etC">Yopish</button>');
    m.querySelector('#etC').onclick = shut;
    m.querySelector('#etGo').onclick = function () {
      var b = m.querySelector('#etGo'); b.disabled = true; b.textContent = '⏳ O‘yin tayyorlanmoqda…';
      ls('etLast', e[0]);
      if (window.lbEtude) window.lbEtude(e[0]);
    };
    var sb = m.querySelector('#etSol'); if (sb) sb.onclick = function () { sol(e); };
  }
  // ---------- yechim yo'llari (dvigatel + endshpil bazasi bilan tekshirilgan)
  function sol(e) {
    api('/api/etudes/sol/' + encodeURIComponent(e[0])).then(function (j) {
      if (!j || !j.sol || !j.sol.length) return;
      solIx = 0; solPly = 0; drawSol(e, j.sol);
    }).catch(function () {});
  }
  function b64(s) { var b = []; for (var i = 0; i < 64; i++) b.push(0); var k = 0; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) continue; var ch = s.charAt(k++); b[r * 8 + c] = ch === 'w' ? 1 : ch === 'W' ? 2 : ch === 'b' ? -1 : ch === 'B' ? -2 : 0; } return b; }
  function s32(b) { var s = ''; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) continue; var v = b[r * 8 + c]; s += v === 1 ? 'w' : v === 2 ? 'W' : v === -1 ? 'b' : v === -2 ? 'B' : '.'; } return s; }
  function sq(i) { return String.fromCharCode(97 + i % 8) + (8 - Math.floor(i / 8)); }
  // yurish: [yo'l katakchalari...] (ketma-ket), urilganlar orasidagi donalar olinadi
  function play(b, mv) {
    b = b.slice(); var p = b[mv[0]];
    for (var i = 1; i < mv.length; i++) {
      var a = mv[i - 1], z = mv[i], dr = Math.sign(Math.floor(z / 8) - Math.floor(a / 8)), dc = Math.sign(z % 8 - a % 8), q = a + dr * 8 + dc;
      while (q !== z) { b[q] = 0; q += dr * 8 + dc; }
    }
    b[mv[0]] = 0; var t = mv[mv.length - 1], tr = Math.floor(t / 8);
    if (p === 1 && tr === 0) p = 2; if (p === -1 && tr === 7) p = -2; b[t] = p; return b;
  }
  function nota(b, mv) { var cap = mv.length > 2 || Math.abs(Math.floor(mv[1] / 8) - Math.floor(mv[0] / 8)) > 1 && (function () { var a = mv[0], z = mv[1], dr = Math.sign(Math.floor(z / 8) - Math.floor(a / 8)), dc = Math.sign(z % 8 - a % 8), q = a + dr * 8 + dc; while (q !== z) { if (b[q]) return true; q += dr * 8 + dc; } return false; })(); return mv.map(sq).join(cap ? ':' : '-'); }
  function drawSol(e, V) {
    var line = V[solIx].m, b = b64(e[5]), names = [], last = null;
    var pos = [b]; line.forEach(function (mv) { names.push(nota(pos[pos.length - 1], mv)); pos.push(play(pos[pos.length - 1], mv)); });
    if (solPly > 0) last = line[solPly - 1];
    var cv = V[solIx], note = cv.k ? '🦍 King Kong dvigateli topgan yo‘l' : (cv.t ? cv.t + ' variant — qora boshqacha himoyalansa' : 'Muallif yechimi');
    var fin = cv.e === 'x' ? ' · oxirida oq yutadi' : cv.e === '=' ? ' · durang' : cv.e === '…' ? ' · (yozuvning davomi o‘qilmadi)' : '';
    var h = '<h3>№' + e[1] + ' · yechim</h3><p>' + esc(note + fin) + '</p>' + svg(s32(pos[solPly]), { last: last }) +
      '<div class="nv"><button data-n="0">⏮</button><button data-n="-1">◀</button><button data-n="1">▶</button><button data-n="9">⏭</button></div><div class="ml">';
    names.forEach(function (n, i) { if (i % 2 === 0) h += (i / 2 + 1) + '. '; h += '<span data-k="' + (i + 1) + '" class="' + (i + 1 === solPly ? 'on' : '') + '">' + n + '</span> '; });
    h += '</div>';
    if (V.length > 1) { h += '<div class="vs">'; V.forEach(function (v, i) { h += '<button data-v="' + i + '" class="' + (i === solIx ? 'on' : '') + '">' + (v.k ? '🦍 King Kong' : v.t ? v.t + ' variant' : 'Asosiy') + '</button>'; }); h += '</div>'; }
    h += '<button class="bt" id="etBk">‹ Orqaga</button>';
    var m = modal(h);
    Array.prototype.forEach.call(m.querySelectorAll('[data-n]'), function (x) { x.onclick = function () { var n = +x.getAttribute('data-n'); solPly = n === 0 ? 0 : n === 9 ? line.length : Math.max(0, Math.min(line.length, solPly + n)); drawSol(e, V); }; });
    Array.prototype.forEach.call(m.querySelectorAll('[data-k]'), function (x) { x.onclick = function () { solPly = +x.getAttribute('data-k'); drawSol(e, V); }; });
    Array.prototype.forEach.call(m.querySelectorAll('[data-v]'), function (x) { x.onclick = function () { solIx = +x.getAttribute('data-v'); solPly = 0; drawSol(e, V); }; });
    m.querySelector('#etBk').onclick = function () { open(e); };
  }
  function close() { if (ov) ov.remove(); ov = null; }
  window.spEtudes = function () {
    css(); close();
    ov = document.createElement('div'); ov.id = 'spEtd'; document.body.appendChild(ov);
    ov.innerHTML = '<div class="tp"><button id="etX">✕</button><b>♔ Etyudlar</b></div><div class="hero" style="text-align:center">⏳ Yuklanmoqda…</div>';
    ov.querySelector('#etX').onclick = close;
    part = ls('etPart') || 1;
    Promise.all([L ? Promise.resolve(null) : api('/api/etudes/list'), api('/api/etudes/me').catch(function () { return null; })]).then(function (r) {
      if (r[0]) L = r[0].list || [];
      S = {}; ((r[1] && r[1].s) || []).forEach(function (id) { S[id] = 1; });
      if (ov) render();
    }).catch(function () { if (ov) ov.querySelector('.hero').textContent = '⚠️ Yuklab bo‘lmadi'; });
  };
})();
