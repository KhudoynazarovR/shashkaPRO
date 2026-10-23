/* BAZA — "Partiyalar bazasi": chempionat va turnirlardagi 109 ming usta partiyasini qidirish va tomosha qilish.
   Ma'lumot serverdan: /api/baza/list, /api/baza/game (bazaserver.js). Manba: Aurora Borealis bazasi (A. Svirin). */
;(function () {
  if (window.spBaza) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var AL = 'abcdefghijklmnopqrstuvwxyzABCDEF';
  var ov = null, q = '', res = '', page = 0, items = [], total = 0, all = 0, loading = false, qT = null;
  var cur = null, steps = [], ply = 0, flip = false, auto = null, scrollY = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hap() { try { tg.HapticFeedback.impactOccurred('light'); } catch (e) {} }
  function hdr() { return { 'x-init-data': (tg && tg.initData) || '' }; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function css() {
    if (document.getElementById('bazaCss')) return;
    var s = document.createElement('style'); s.id = 'bazaCss';
    s.textContent = '#spBaza{position:fixed;inset:0;z-index:2147482500;overflow-y:auto;background:#0b0e1a;color:#fff;font-family:system-ui,Roboto,sans-serif;padding:12px 12px 100px;box-sizing:border-box}' +
      '#spBaza .tp{display:flex;align-items:center;gap:10px;margin-bottom:12px}#spBaza .tp b{flex:1;font-size:20px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spBaza .tp button{border:0;background:#262b5a;color:#fff;border-radius:12px;padding:9px 13px;font-size:18px}' +
      '#spBaza .sub{color:#9aa3d9;font-size:13px;margin:-6px 2px 12px}' +
      '#spBaza input.sr{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1px solid #262b5a;background:#161a3a;color:#fff;font-size:16px;margin-bottom:10px;outline:none}' +
      '#spBaza .ch{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}#spBaza .ch button{border:1px solid #262b5a;background:#161a3a;color:#cfd5ff;border-radius:20px;padding:7px 12px;font-size:14px}#spBaza .ch button.on{background:#3b46b8;border-color:#6f7cff;color:#fff}' +
      '#spBaza .it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:11px 12px;margin-bottom:8px;color:#fff}' +
      '#spBaza .it .tx{flex:1;min-width:0}#spBaza .it b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spBaza .it small{display:block;font-size:12px;color:#9aa3d9;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#spBaza .rs{font-weight:800;font-size:14px;min-width:42px;text-align:center;padding:5px 6px;border-radius:9px;background:#262b5a}#spBaza .rs.w{background:#e8e8e8;color:#111}#spBaza .rs.b{background:#000;border:1px solid #555}#spBaza .rs.d{background:#4b4f7a}' +
      '#spBaza .more{width:100%;border:0;border-radius:14px;padding:13px;background:#262b5a;color:#fff;font-size:16px;margin-top:4px}' +
      '#spBaza .src{color:#6f77a8;font-size:12px;text-align:center;margin-top:16px}' +
      '#bzBoard{--l:#f3bb86;--d:#7b2f13;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:min(94vw,440px);height:min(94vw,440px);margin:0 auto;border-radius:6px;overflow:hidden;box-shadow:0 6px 20px #0005;box-sizing:border-box}' +
      '#bzBoard .sq{min-width:0;min-height:0;overflow:hidden}#bzBoard .crd{font:bold 10px sans-serif;position:absolute;left:3px;bottom:1px;opacity:.6;pointer-events:none}' +
      '#bzBoard .pc.k::after{font-size:min(5vw,26px)}' +
      '#spBaza .pl{display:flex;align-items:center;gap:8px;max-width:440px;margin:8px auto;font-size:15px}#spBaza .pl i{width:14px;height:14px;border-radius:50%;display:inline-block;border:1px solid #888}#spBaza .pl span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#spBaza .nav{display:flex;gap:6px;justify-content:center;margin:12px 0}#spBaza .nav button{border:0;border-radius:12px;padding:11px 15px;background:#262b5a;color:#fff;font-size:18px}' +
      '#spBaza .ml{display:flex;flex-wrap:wrap;gap:4px;margin:10px auto;max-width:440px;font-family:ui-monospace,Menlo,monospace;font-size:14px}#spBaza .ml span{padding:5px 7px;border-radius:8px;background:#161a3a;cursor:pointer}#spBaza .ml span.on{background:#3b46b8}#spBaza .ml em{font-style:normal;color:#6f77a8;padding:5px 0 5px 4px}';
    document.head.appendChild(s);
  }
  // o'yindagi doska mavzusi va donalar uslubini (Sozlamalar) shu yerda ham ishlatamiz
  var themeDone = false;
  function themeCss() {
    if (themeDone) return; var css = '';
    try { for (var i = 0; i < document.styleSheets.length; i++) { var rl; try { rl = document.styleSheets[i].cssRules; } catch (e) { continue; } for (var j = 0; j < rl.length; j++) { var t = rl[j].cssText || ''; if (t.indexOf('#board[') === 0) css += t.replace(/#board\[/g, '#bzBoard[') + '\n'; } } } catch (e) {}
    if (css) { themeDone = true; var el = document.createElement('style'); el.id = 'bzThemeCss'; el.textContent = css; document.head.appendChild(el); }
  }
  function skin() {
    var th = 'edeon', ps = 'glossy', km = '\u265B', pz = '80';
    try { if (typeof S === 'object' && S) { th = S.th || th; ps = S.ps || ps; km = S.km || km; pz = S.pz || pz; } } catch (e) {}
    if (!/^(classic|green|blue|gray|walnut|purple|sand|ocean|rose|olive|photo|edeon)$/.test(th)) th = 'edeon';
    return ' data-th="' + th + '" data-ps="' + esc(ps) + '" style="--km:\'' + esc(km) + '\';--pz:' + (+pz || 80) + '%"';
  }
  function close() { stopAuto(); if (ov) ov.remove(); ov = null; }
  function shell() { if (!ov) { ov = document.createElement('div'); ov.id = 'spBaza'; document.body.appendChild(ov); } return ov; }

  // ---------- ro'yxat
  function rsCls(r) { return r === '1-0' ? 'w' : r === '0-1' ? 'b' : r === '½-½' ? 'd' : ''; }
  function list() {
    stopAuto(); cur = null; shell();
    var h = '<div class="tp"><button data-x="1">‹</button><b>📚 Partiyalar bazasi</b></div>' +
      '<div class="sub">Chempionat va turnirlardagi ' + fmt(all || 109409) + ' ta usta partiyasi</div>' +
      '<input class="sr" placeholder="O‘yinchi, turnir, shahar yoki yil…" value="' + esc(q) + '">' +
      '<div class="ch">' + [['', 'Hammasi'], ['1', '⚪ Oq yutgan'], ['2', '½ Durang'], ['3', '⚫ Qora yutgan']].map(function (x) { return '<button data-r="' + x[0] + '"' + (res === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="sub">' + (loading && !items.length ? 'Yuklanmoqda…' : 'Topildi: ' + fmt(total)) + '</div><div id="bzL">';
    items.forEach(function (g) {
      h += '<button class="it" data-id="' + g.id + '"><span class="rs ' + rsCls(g.r) + '">' + esc(g.r) + '</span><span class="tx"><b>' + esc(g.w) + ' – ' + esc(g.b) + '</b><small>' +
        esc([g.t, g.s, g.y].filter(Boolean).join(' · ') || 'Turnir ko‘rsatilmagan') + ' · ' + Math.ceil(g.n / 2) + ' yurish</small></span>›</button>';
    });
    h += '</div>' + (items.length < total ? '<button class="more">' + (loading ? 'Yuklanmoqda…' : 'Yana ko‘rsatish') + '</button>' : '') +
      '<div class="src">Manba: Aurora Borealis dasturining rus shashkasi bazasi (A. Svirin)</div>';
    ov.innerHTML = h;
    ov.querySelector('[data-x]').onclick = close;
    var inp = ov.querySelector('.sr');
    inp.oninput = function () { clearTimeout(qT); qT = setTimeout(function () { q = inp.value.trim(); load(true); }, 450); };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { res = b.getAttribute('data-r'); load(true); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-id]'), function (b) { b.onclick = function () { scrollY = ov.scrollTop; openGame(+b.getAttribute('data-id')); }; });
    var mo = ov.querySelector('.more'); if (mo) mo.onclick = function () { if (!loading) { page++; load(false); } };
  }
  function load(reset) {
    if (reset) { page = 0; items = []; }
    loading = true; if (reset) list();
    fetch('/api/baza/list?q=' + encodeURIComponent(q) + '&res=' + res + '&page=' + page, { headers: hdr() }).then(function (r) { return r.json(); }).then(function (j) {
      loading = false; if (!ov || cur) return;
      total = j.total || 0; all = j.all || all; items = items.concat(j.items || []);
      var y = ov.scrollTop, focus = document.activeElement && document.activeElement.classList.contains('sr');
      list(); ov.scrollTop = y;
      if (focus) { var i = ov.querySelector('.sr'); i.focus(); try { i.setSelectionRange(i.value.length, i.value.length); } catch (e) {} }
    }).catch(function () { loading = false; if (ov && !cur) { list(); ov.querySelector('.sub:last-of-type').textContent = 'Server bilan aloqa yo‘q'; } });
  }

  // ---------- partiyani ko'rish
  function rc(ch) { var k = AL.indexOf(ch), row = k >> 2; return [7 - row, row % 2 === 0 ? 2 * (k & 3) : 2 * (k & 3) + 1]; }
  function nm(p) { return String.fromCharCode(97 + p[1]) + (8 - p[0]); }
  function init() { var b = []; for (var r = 0; r < 8; r++) { b.push([]); for (var c = 0; c < 8; c++) b[r].push((r + c) % 2 === 1 ? (r < 3 ? 2 : r > 4 ? 1 : 0) : 0); } return b; }
  function hop(b, a, z) {
    var p = b[a[0]][a[1]]; b[a[0]][a[1]] = 0;
    var dr = z[0] > a[0] ? 1 : -1, dc = z[1] > a[1] ? 1 : -1, cap = false;
    for (var r = a[0] + dr, c = a[1] + dc; r !== z[0]; r += dr, c += dc) { if (b[r][c]) cap = true; b[r][c] = 0; }
    if (p === 1 && z[0] === 0) p = 3; if (p === 2 && z[0] === 7) p = 4;
    b[z[0]][z[1]] = p; return cap;
  }
  function parse(mv) {
    var b = init(), out = [];
    (mv ? mv.split(' ') : []).forEach(function (m) {
      var sq = m.split('').map(rc), cap = false;
      for (var i = 1; i < sq.length; i++) cap = hop(b, sq[i - 1], sq[i]) || cap;
      out.push({ sq: sq, n: sq.map(nm).join(cap ? ':' : '-'), b: b.map(function (r) { return r.slice(); }) });
    });
    return out;
  }
  function openGame(id) {
    stopAuto(); shell(); ov.innerHTML = '<div class="tp"><button data-x="1">‹</button><b>Yuklanmoqda…</b></div>';
    ov.querySelector('[data-x]').onclick = back;
    fetch('/api/baza/game?id=' + id, { headers: hdr() }).then(function (r) { return r.json(); }).then(function (g) {
      if (!ov || !g || g.error) return; cur = g; steps = parse(g.mv); ply = 0; flip = false; draw(); ov.scrollTop = 0;
    }).catch(function () { if (ov) ov.querySelector('.tp b').textContent = 'Server bilan aloqa yo‘q'; });
  }
  function back() { stopAuto(); cur = null; list(); ov.scrollTop = scrollY; }
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
  function go(n) { ply = Math.max(0, Math.min(steps.length, n)); draw(); }
  function draw() {
    if (!ov || !cur) return;
    var b = ply ? steps[ply - 1].b : init(), last = ply ? steps[ply - 1].sq : [], lm = {};
    last.forEach(function (p) { lm[p[0] * 8 + p[1]] = 1; });
    var top = flip ? [cur.w, '#eee'] : [cur.b, '#111'], bot = flip ? [cur.b, '#111'] : [cur.w, '#eee'];
    var h = '<div class="tp"><button data-x="1">‹</button><b>' + esc(cur.w) + ' – ' + esc(cur.b) + '</b></div>' +
      '<div class="sub">' + esc([cur.t, cur.s, cur.y].filter(Boolean).join(' · ')) + (cur.t || cur.s || cur.y ? ' · ' : '') + 'Natija: <b>' + esc(cur.r) + '</b></div>' +
      '<div class="pl"><i style="background:' + top[1] + '"></i><span>' + esc(top[0]) + '</span></div><div id="bzBoard"' + skin() + '>';
    for (var i = 0; i < 64; i++) {
      var r = flip ? 7 - (i >> 3) : i >> 3, c = flip ? 7 - (i & 7) : i & 7, dark = (r + c) % 2 === 1, p = b[r][c];
      h += '<div class="sq ' + (dark ? 'd' : 'l') + (lm[r * 8 + c] ? ' lm' : '') + '">' + (p ? '<i class="pc ' + (p === 1 || p === 3 ? 'w' : 'b') + (p > 2 ? ' k' : '') + '"></i>' : '') +
        ((flip ? r === 0 : r === 7) ? '<span class="crd">' + String.fromCharCode(97 + c) + '</span>' : '') + '</div>';
    }
    h += '</div><div class="pl"><i style="background:' + bot[1] + '"></i><span>' + esc(bot[0]) + '</span></div>' +
      '<div class="nav"><button data-n="s">⏮</button><button data-n="p">◀</button><button data-n="a">' + (auto ? '⏸' : '▶️') + '</button><button data-n="f">▶</button><button data-n="e">⏭</button><button data-n="x">🔄</button></div><div class="ml">';
    steps.forEach(function (s, k) {
      if (k % 2 === 0) h += '<em>' + (k / 2 + 1) + '.</em>';
      h += '<span data-k="' + (k + 1) + '"' + (k + 1 === ply ? ' class="on"' : '') + '>' + s.n + '</span>';
    });
    h += '</div>';
    ov.innerHTML = h;
    ov.querySelector('[data-x]').onclick = back;
    Array.prototype.forEach.call(ov.querySelectorAll('[data-n]'), function (e) {
      e.onclick = function () {
        var a = e.getAttribute('data-n'); hap();
        if (a === 'a') { if (auto) stopAuto(); else { if (ply >= steps.length) ply = 0; auto = setInterval(function () { if (ply >= steps.length) { stopAuto(); draw(); return; } go(ply + 1); }, 1100); } draw(); return; }
        stopAuto();
        if (a === 's') go(0); else if (a === 'p') go(ply - 1); else if (a === 'f') go(ply + 1); else if (a === 'e') go(steps.length); else if (a === 'x') { flip = !flip; draw(); }
      };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-k]'), function (e) { e.onclick = function () { stopAuto(); go(+e.getAttribute('data-k')); }; });
    var on = ov.querySelector('.ml span.on'); if (on && on.scrollIntoView && auto) { try { on.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  }

  window.spBaza = function () { css(); themeCss(); q = ''; res = ''; load(true); };
})();
