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
  window.spAnalyze = function (g) {
    var mv = g.moves || [], bs = [start()], i;
    for (i = 0; i < mv.length; i++) bs.push(apply(bs[i], mv[i]));
    var cur = mv.length;
    var old = document.getElementById('spAn'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spAn';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    var res = g.winner === 'white' ? '🏆 ⚪ ' + esc(g.white) : g.winner === 'black' ? '🏆 ⚫ ' + esc(g.black) : '🤝 Durang';
    function draw() {
      var b = bs[cur], m = cur > 0 ? mv[cur - 1] : null, h = '', r, c, p, bg, hl;
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
          h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (white ? '#9a9a9a' : '#000') + ';background:' + (white ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      h += '<div style="margin:10px 0;font-size:15px">Yurish: ' + cur + ' / ' + mv.length + '</div>';
      h += '<div style="display:flex;gap:8px;justify-content:center">';
      var bst = 'border:0;border-radius:14px;padding:12px 18px;background:#6b5cf0;color:#fff;font-size:20px';
      h += '<button id="an0" style="' + bst + '">⏮</button><button id="an1" style="' + bst + '">◀</button><button id="an2" style="' + bst + '">▶</button><button id="an3" style="' + bst + '">⏭</button></div>';
      ov.innerHTML = h;
      ov.querySelector('#anX').onclick = function () { ov.remove(); };
      ov.querySelector('#an0').onclick = function () { cur = 0; draw(); };
      ov.querySelector('#an1').onclick = function () { if (cur > 0) cur--; draw(); };
      ov.querySelector('#an2').onclick = function () { if (cur < mv.length) cur++; draw(); };
      ov.querySelector('#an3').onclick = function () { cur = mv.length; draw(); };
    }
    draw();
  };
})();
