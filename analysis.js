(function () {
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
  (function () {
    if (window.spPcImg) return;
    var ok = {};
    function chk(id) { if (ok[id] !== undefined) return; ok[id] = false; var im = new Image(); im.onload = function () { ok[id] = true; }; im.src = '/api/shop/img?id=' + encodeURIComponent(id) + '&k=w'; }
    window.spPcImg = function (p) {
      var id = window.spEqId !== undefined ? window.spEqId : 'def';
      if (!id) return '';
      chk(id);
      if (!ok[id]) return '';
      return '/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + (p === 1 ? 'w' : p === 2 ? 'b' : p === 3 ? 'wk' : 'bk');
    };
    window.spPcImg(1);
  })();
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
    var EV = [], evRun = false, evMsg = '';
    function toEng(b) { var a = [], r, c, p; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { p = b[r][c]; a.push(p === 1 ? 1 : p === 2 ? -1 : p === 3 ? 2 : p === 4 ? -2 : 0); } return a; }
    function evFmt(x) { if (x == null) return '–'; x = Math.max(-9.9, Math.min(9.9, x)); return (x > 0 ? '+' : '') + x.toFixed(1); }
    function getEv(k, cb) {
      var side = (k % 2 === 0) ? 1 : -1;
      var hd = { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' };
      fetch('/api/ai/move', { method: 'POST', headers: hd, body: JSON.stringify({ board: toEng(bs[k]), side: side, time: 0.25 }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { cb(j && typeof j.ev === 'number' ? side * j.ev / 200 : null); })
        .catch(function () { cb(null); });
    }
    function runEval() {
      if (evRun) return; evRun = true; var k = 0;
      (function next() {
        if (!document.body.contains(ov)) { evRun = false; return; }
        if (k > mv.length) { evRun = false; draw(); return; }
        getEv(k, function (v) {
          EV[k] = v; k++;
          evMsg = 'Baholanmoqda ' + Math.min(k, mv.length + 1) + '/' + (mv.length + 1);
          var l = ov.querySelector('#anE'); if (l) l.textContent = evMsg;
          next();
        });
      })();
    }
    function mark(i) {
      if (EV[i] == null || EV[i + 1] == null) return '';
      var sg = (i % 2 === 0) ? 1 : -1, loss = sg * (EV[i] - EV[i + 1]);
      return loss >= 1.5 ? '??' : loss >= 0.8 ? '?' : '';
    }
    function evBlock() {
      if (evRun) return evMsg || 'Baholanmoqda...';
      var any = EV.some(function (x) { return x != null; });
      if (!any) return '<button id="anV" style="border:0;border-radius:14px;padding:10px 16px;background:#2e9d6b;color:#fff;font-size:16px">📊 Baho</button>' + (EV.length ? '<div style="margin-top:6px;font-size:13px;opacity:.8">Baho olinmadi, qayta urinib ko‘ring</div>' : '');
      var x = EV[cur], pc = 50 + Math.max(-5, Math.min(5, x == null ? 0 : x)) * 10, mk = cur > 0 ? mark(cur - 1) : '';
      return 'Baho: <b>' + evFmt(x) + '</b>' + (mk ? ' · yurish <b style="color:#ff6b6b">' + mk + '</b>' : '') +
        '<div style="width:min(86vw,420px);height:10px;margin:6px auto;background:#222;border-radius:5px;overflow:hidden"><div style="width:' + pc + '%;height:100%;background:#eee"></div></div>';
    }
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
      var bv = ov.querySelector('#anV'); if (bv) bv.onclick = function () { EV = []; runEval(); draw(); };
      var rg = ov.querySelector('#anR');
      rg.oninput = function () { var l = ov.querySelector('#anL'); if (l) l.textContent = 'Yurish: ' + rg.value + ' / ' + mv.length; };
      rg.onchange = function () { cur = Number(rg.value); draw(); };
    }
    draw();
  };
})();
