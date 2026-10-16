(function () {
  if (window.spBoard) return;
  var D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function W(p) { return p === 1 || p === 3; }
  function own(p, t) { return t > 0 ? W(p) : (p === 2 || p === 4); }
  function inb(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function cp(b) { return b.map(function (x) { return x.slice(); }); }
  function start() { var b = [], r, c; for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) b[r].push(r < 3 && (r + c) % 2 ? 2 : (r > 4 && (r + c) % 2 ? 1 : 0)); } return b; }
  function sq(r, c) { return 'abcdefgh'[c] + (8 - r); }
  function isDone(d, r, c) { return d.some(function (x) { return x[0] === r && x[1] === c; }); }
  function dfs(b, r, c, king, t, done, path, out) {
    var any = false;
    D.forEach(function (d) {
      var rr = r + d[0], cc = c + d[1];
      if (king) { while (inb(rr, cc) && b[rr][cc] === 0) { rr += d[0]; cc += d[1]; } }
      if (!inb(rr, cc)) return;
      var q = b[rr][cc];
      if (!q || own(q, t) || isDone(done, rr, cc)) return;
      var lr = rr + d[0], lc = cc + d[1], lands = [];
      while (inb(lr, lc) && b[lr][lc] === 0) { lands.push([lr, lc]); if (!king) break; lr += d[0]; lc += d[1]; }
      if (!lands.length) return;
      any = true;
      var nd = done.concat([[rr, cc]]), sub = [], cont = false;
      lands.forEach(function (l) {
        var nk = king || (t > 0 ? l[0] === 0 : l[0] === 7), o = [];
        var more = dfs(b, l[0], l[1], nk, t, nd, path.concat([l]), o);
        sub.push({ l: l, more: more, o: o, nk: nk });
        if (more) cont = true;
      });
      sub.forEach(function (s) {
        if (cont && !s.more) return;
        if (s.more) s.o.forEach(function (x) { out.push(x); });
        else out.push({ path: path.concat([s.l]), caps: nd, king: s.nk });
      });
    });
    return any;
  }
  function legal(b, t) {
    var caps = [], quiet = [], r, c, p;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      p = b[r][c]; if (!p || !own(p, t)) continue;
      var bb = cp(b); bb[r][c] = 0; var o = [];
      dfs(bb, r, c, p > 2, t, [], [[r, c]], o);
      o.forEach(function (m) { caps.push(m); });
    }
    if (caps.length) return caps;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      p = b[r][c]; if (!p || !own(p, t)) continue;
      if (p > 2) {
        D.forEach(function (d) { var rr = r + d[0], cc = c + d[1]; while (inb(rr, cc) && b[rr][cc] === 0) { quiet.push({ path: [[r, c], [rr, cc]], caps: [], king: true }); rr += d[0]; cc += d[1]; } });
      } else {
        var dr = t > 0 ? -1 : 1;
        [-1, 1].forEach(function (dc) { var rr = r + dr, cc = c + dc; if (inb(rr, cc) && b[rr][cc] === 0) quiet.push({ path: [[r, c], [rr, cc]], caps: [], king: t > 0 ? rr === 0 : rr === 7 }); });
      }
    }
    return quiet;
  }
  function applyM(b, m) {
    var n = cp(b), f = m.path[0], e = m.path[m.path.length - 1], p = n[f[0]][f[1]];
    n[f[0]][f[1]] = 0; m.caps.forEach(function (x) { n[x[0]][x[1]] = 0; });
    if (m.king && p < 3) p = W(p) ? 3 : 4;
    n[e[0]][e[1]] = p; return n;
  }
  function toEng(b) { var a = [], r, c, p; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { p = b[r][c]; a.push(p === 1 ? 1 : p === 2 ? -1 : p === 3 ? 2 : p === 4 ? -2 : 0); } return a; }
  function kf(h) { return toEng(h.b).join('') + h.t; }
  function evFmt(x) { if (x == null) return '–'; x = Math.max(-9.9, Math.min(9.9, x)); return (x > 0 ? '+' : '') + x.toFixed(1); }
  function note(m) { return m.path.map(function (x) { return sq(x[0], x[1]); }).join(m.caps.length ? ':' : '-'); }
  function hd() { return { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  function ask(h, cb, tries) {
    tries = tries || 0;
    fetch('/api/ai/move', { method: 'POST', headers: hd(), body: JSON.stringify({ board: toEng(h.b), side: h.t, time: 0.3 }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.from != null) cb({ ev: typeof j.ev === 'number' ? h.t * j.ev / 200 : null, best: { from: [j.from >> 3, j.from & 7], to: [j.to >> 3, j.to & 7] } });
        else if (j && j.error === 'busy' && tries < 4) setTimeout(function () { ask(h, cb, tries + 1); }, 800);
        else cb(null);
      }).catch(function () { cb(null); });
  }
  window.spBoard = function () {
    var hist = [{ b: start(), t: 1, m: null }], cur = 0, flip = false, sel = null, EV = {}, busyK = {}, FAIL = {}, allRun = false, prog = '';
    var old = document.getElementById('spBd'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spBd';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    function evOf(i) {
      var h = hist[i], k = kf(h);
      if (EV[k]) return EV[k].ev;
      if (!legal(h.b, h.t).length) return h.t > 0 ? -9.9 : 9.9;
      return null;
    }
    function go(i) { cur = Math.max(0, Math.min(hist.length - 1, i)); sel = null; draw(); analyzeCur(); }
    function analyzeCur() {
      var h = hist[cur], k = kf(h);
      if (EV[k] || busyK[k] || FAIL[k]) return;
      if (!legal(h.b, h.t).length) return;
      busyK[k] = 1;
      ask(h, function (r) { delete busyK[k]; if (r) EV[k] = r; else FAIL[k] = 1; if (document.body.contains(ov)) draw(); });
    }
    function runAll() {
      if (allRun) return; allRun = true; var i = 0;
      (function nx() {
        if (!document.body.contains(ov)) { allRun = false; return; }
        if (i >= hist.length) { allRun = false; prog = ''; draw(); return; }
        var h = hist[i], k = kf(h); i++;
        if (EV[k] || !legal(h.b, h.t).length) { nx(); return; }
        ask(h, function (r) { if (r) EV[k] = r; prog = i + '/' + hist.length; draw(); nx(); });
      })();
    }
    function play(m) {
      var h = hist[cur];
      hist = hist.slice(0, cur + 1);
      hist.push({ b: applyM(h.b, m), t: -h.t, m: m, n: note(m) });
      cur++; sel = null; draw(); analyzeCur();
    }
    function click(r, c) {
      var h = hist[cur];
      if (sel) {
        var m = sel.moves.filter(function (x) { var e = x.path[x.path.length - 1]; return e[0] === r && e[1] === c; })[0];
        if (m) { play(m); return; }
      }
      var p = h.b[r][c];
      if (p && own(p, h.t)) {
        var ms = legal(h.b, h.t).filter(function (x) { return x.path[0][0] === r && x.path[0][1] === c; });
        sel = { r: r, c: c, moves: ms };
      } else sel = null;
      draw();
    }
    function mark(i) {
      var a = evOf(i), b = evOf(i + 1);
      if (a == null || b == null) return '';
      var loss = (hist[i].t) * (a - b);
      return loss >= 1.5 ? '??' : loss >= 0.8 ? '?' : loss >= 0.4 ? '?!' : '';
    }
    function draw() {
      var st = ov.scrollTop, h = hist[cur], k = kf(h), e = EV[k], ms = legal(h.b, h.t), over = !ms.length;
      var x = evOf(cur), pc = 50 + Math.max(-5, Math.min(5, x == null ? 0 : x)) * 10, s = '';
      s += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>🔬 Tahlil taxtasi</b><button id="bdX" style="border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff;font-size:16px">⬅️</button></div>';
      s += '<div style="font-size:18px;margin-bottom:4px">Baho: <b>' + evFmt(x) + '</b></div>';
      s += '<div style="width:min(94vw,480px);height:10px;margin:0 auto 8px;background:#222;border-radius:5px;overflow:hidden"><div style="width:' + pc + '%;height:100%;background:#eee"></div></div>';
      s += '<div style="position:relative;width:min(94vw,480px);margin:0 auto;box-sizing:border-box;border:4px solid #8a4a1c;border-radius:6px"><div style="display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);aspect-ratio:1;overflow:hidden">';
      var lm = h.m ? [h.m.path[0], h.m.path[h.m.path.length - 1]] : [], rr, cc, r, c, p, hl, dot;
      for (rr = 0; rr < 8; rr++) for (cc = 0; cc < 8; cc++) {
        r = flip ? 7 - rr : rr; c = flip ? 7 - cc : cc; p = h.b[r][c];
        hl = ''; dot = false;
        lm.forEach(function (q) { if (q[0] === r && q[1] === c) hl = 'box-shadow:inset 0 0 0 3px #f5d92b;'; });
        if (sel && sel.r === r && sel.c === c) hl = 'box-shadow:inset 0 0 0 4px #4ade80;';
        if (sel) sel.moves.forEach(function (m) { var q = m.path[m.path.length - 1]; if (q[0] === r && q[1] === c) dot = true; });
        s += '<div data-r="' + r + '" data-c="' + c + '" style="background:' + ((r + c) % 2 ? '#7b2f13' : '#f3bb86') + ';' + hl + 'display:flex;align-items:center;justify-content:center">';
        if (p) { var w = W(p); s += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (w ? '#9a9a9a' : '#000') + ';background:' + (w ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>'; }
        else if (dot) s += '<div style="width:30%;height:30%;border-radius:50%;background:#4ade80;opacity:.8"></div>';
        s += '</div>';
      }
      s += '</div>';
      if (e && e.best && !over) {
        var f = e.best.from, t2 = e.best.to;
        var x1 = (flip ? 7 - f[1] : f[1]) + .5, y1 = (flip ? 7 - f[0] : f[0]) + .5, x2 = (flip ? 7 - t2[1] : t2[1]) + .5, y2 = (flip ? 7 - t2[0] : t2[0]) + .5;
        var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1; x2 -= dx / L * .3; y2 -= dy / L * .3;
        s += '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs><marker id="bdAh" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#3fb950"/></marker></defs><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#3fb950" stroke-width=".2" stroke-linecap="round" opacity=".85" marker-end="url(#bdAh)"/></svg>';
      }
      s += '</div>';
      var info = '';
      if (over) info = '🏁 O‘yin tugadi: ' + (h.t > 0 ? '⚫ Qora' : '⚪ Oq') + ' yutdi';
      else if (e && e.best) info = 'Eng yaxshi: <b>' + sq(e.best.from[0], e.best.from[1]) + (ms.length && ms[0].caps.length ? ':' : '-') + sq(e.best.to[0], e.best.to[1]) + '</b>';
      else if (busyK[k]) info = '⏳ Dvigatel o‘ylayapti...';
      else if (FAIL[k]) info = 'Baho olinmadi (Telegram ichida oching) <button id="bdRt" style="border:0;border-radius:10px;padding:6px 10px;background:#2e9d6b;color:#fff">Qayta</button>';
      s += '<div style="margin:8px 0;font-size:15px">' + (h.t > 0 ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ' + info + '</div>';
      var bst = 'border:0;border-radius:14px;padding:12px 16px;background:#6b5cf0;color:#fff;font-size:20px';
      s += '<div style="display:flex;gap:8px;justify-content:center"><button id="bd0" style="' + bst + '">⏮</button><button id="bd1" style="' + bst + '">◀</button><button id="bd2" style="' + bst + '">▶</button><button id="bd3" style="' + bst + '">⏭</button><button id="bdF" style="' + bst + '">🔄</button></div>';
      s += '<div style="display:flex;gap:8px;justify-content:center;margin-top:8px"><button id="bdA" style="' + bst + ';font-size:15px;background:#2e9d6b">📊 Hammasini baholash' + (prog ? ' ' + prog : '') + '</button><button id="bdN" style="' + bst + ';font-size:15px;background:#8a2b3a">🗑 Yangi</button></div>';
      s += '<div style="margin-top:12px;text-align:left;font-size:15px;line-height:2.2">';
      for (var i = 0; i < hist.length - 1; i++) {
        if (i % 2 === 0) s += '<span style="opacity:.6;margin-left:6px">' + (i / 2 + 1) + '.</span> ';
        var mk = mark(i), bad = mk === '??' ? '#ff6b6b' : mk ? '#ffb347' : '#fff';
        s += '<span data-g="' + (i + 1) + '" style="display:inline-block;padding:2px 8px;margin:2px;border-radius:8px;background:' + (cur === i + 1 ? '#6b5cf0' : '#262b66') + ';color:' + bad + '">' + hist[i + 1].n + mk + ' <small style="opacity:.7;color:#fff">' + evFmt(evOf(i + 1)) + '</small></span>';
      }
      s += '</div>';
      ov.innerHTML = s;
      function on(id, f) { var el = ov.querySelector(id); if (el) el.onclick = f; }
      on('#bdX', function () { ov.remove(); });
      on('#bd0', function () { go(0); }); on('#bd1', function () { go(cur - 1); });
      on('#bd2', function () { go(cur + 1); }); on('#bd3', function () { go(hist.length - 1); });
      on('#bdF', function () { flip = !flip; draw(); }); on('#bdA', runAll);
      on('#bdN', function () { hist = [{ b: start(), t: 1, m: null }]; cur = 0; sel = null; draw(); analyzeCur(); });
      on('#bdRt', function () { delete FAIL[kf(hist[cur])]; analyzeCur(); draw(); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-r]'), function (el) { el.onclick = function () { click(+el.getAttribute('data-r'), +el.getAttribute('data-c')); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-g]'), function (el) { el.onclick = function () { go(+el.getAttribute('data-g')); }; });
      ov.scrollTop = st;
    }
    draw(); analyzeCur();
  };
})();
