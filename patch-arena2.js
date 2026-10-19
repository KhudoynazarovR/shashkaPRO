const fs = require('fs');
const cnt = (t, x) => t.split(x).length - 1;
let B = fs.readFileSync('botarena.js', 'utf8'), V = fs.readFileSync('arenaview.js', 'utf8');
const b1 = "function stat(uid) {";
const b2 = "const moves = R.getAllMoves(board, side);";
const b3 = "cur.ply = ply; cur.turn = side;";
const v1 = "function draw(j) {";
const v2 = "h += '<div id=\"avBd\">' + board64(g.board) + '</div>';";
const v3 = "ov.innerHTML = h;";
const mvRe = /h \+= '<div class="avMv">' \+ esc\(\(g\.moves \|\| \[\]\)\.join\([^)]*\)\) \+ '<\/div>';/;
const bad = [[B,b1],[B,b2],[B,b3],[V,v1],[V,v2],[V,v3]].filter(x => cnt(x[0], x[1]) !== 1);
if (bad.length || !mvRe.test(V) || B.includes('encB(')) { console.log('XATO yoki allaqachon qollangan (' + bad.length + ')'); process.exit(1); }

B = B.replace(b1, () => "function encB(b) { let s = ''; for (let i = 0; i < 64; i++) { const v = b[i]; s += v ? (v > 0 ? (v === 2 ? 'W' : 'w') : (v === -2 ? 'B' : 'b')) : '.'; } return s; }\n" + b1);
B = B.replace(b2, () => "if (!cur.hist) { cur.hist = [encB(cur.board)]; cur.all = []; }\n    " + b2);
B = B.replace(b3, () => b3 + `
    cur.hist.push(encB(cur.board)); cur.all.push(mstr(mv));
    { let men = 0, wk = 0, bk = 0;
      for (let i = 0; i < 64; i++) { const v = cur.board[i]; if (v === 1 || v === -1) men++; else if (v === 2) wk++; else if (v === -2) bk++; }
      const tot = men + wk + bk;
      if (men > 0 || tot !== cur.tot) cur.qc = 0; else cur.qc = (cur.qc || 0) + 1;
      cur.tot = tot;
      const lim = (wk + bk === 3 && Math.min(wk, bk) === 1) ? 10 : 30;
      if (men === 0 && cur.qc >= lim && !result) result = 'draw'; }`);

V = V.replace(v1, () => `var viewPly = null, vId = null;
  (function () { var s = document.createElement('style'); s.textContent = '#avOv .avN{border:0;border-radius:10px;background:#2e2a70;color:#fff;padding:8px 14px;font-size:18px}#avOv .avMk{padding:2px 4px;border-radius:6px}'; document.head.appendChild(s); })();
  function decB(s) { var a = []; for (var i = 0; i < 64; i++) { var c = s.charAt(i); a.push(c === 'w' ? 1 : c === 'W' ? 2 : c === 'b' ? -1 : c === 'B' ? -2 : 0); } return a; }
  function bindNav(g) {
    if (!g || !g.hist) return;
    var n = g.hist.length - 1, cp = (viewPly == null || viewPly > n) ? n : viewPly;
    ov.querySelectorAll('.avN').forEach(function (b) { b.onclick = function () {
      var t = b.getAttribute('data-n');
      if (t === 'first') viewPly = 0; else if (t === 'prev') viewPly = Math.max(0, cp - 1);
      else if (t === 'next') viewPly = (cp + 1 >= n) ? null : cp + 1; else viewPly = null;
      draw(last); }; });
    ov.querySelectorAll('.avMk').forEach(function (a) { a.onclick = function () {
      var p = +a.getAttribute('data-p'); viewPly = p >= n ? null : p; draw(last); }; });
  }
  ` + v1);
V = V.replace(v2, () => `if (g.id !== vId) { vId = g.id; viewPly = null; }
      var cp = -1, tot = 0, shown = g.board;
      if (g.hist && g.hist.length) { tot = g.hist.length - 1; cp = (viewPly == null || viewPly > tot) ? tot : viewPly; shown = decB(g.hist[cp]); }
      h += '<div id="avBd">' + board64(shown) + '</div>';
      if (cp >= 0) h += '<div style="display:flex;gap:8px;justify-content:center;align-items:center;margin:6px 0"><button class="avN" data-n="first">\\u23EE</button><button class="avN" data-n="prev">\\u25C0</button><b style="min-width:70px;text-align:center">' + cp + ' / ' + tot + '</b><button class="avN" data-n="next">\\u25B6</button><button class="avN" data-n="live">\\u23ED</button></div>';`);
V = V.replace(mvRe, m => `if (g.all && g.all.length) { var mh = ''; g.all.forEach(function (mm, i) { mh += '<a class="avMk" data-p="' + (i + 1) + '" style="cursor:pointer;margin-right:6px;display:inline-block;' + (cp === i + 1 ? 'color:#ffd54a;font-weight:700' : '') + '">' + (i + 1) + '.' + esc(mm) + '</a>'; }); h += '<div class="avMv">' + mh + '</div>'; } else ` + m);
V = V.replace(v3, () => v3 + " bindNav(g);");

fs.writeFileSync('botarena.js', B); fs.writeFileSync('arenaview.js', V);
console.log('OK');
