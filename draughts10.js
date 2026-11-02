(function (root) {
  'use strict';
  var N = 10, EMPTY = 0, WHITE = 1, BLACK = 2, WK = 3, BK = 4;
  var DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  function inside(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }
  function isW(p) { return p === WHITE || p === WK; }
  function isB(p) { return p === BLACK || p === BK; }
  function isKing(p) { return p === WK || p === BK; }
  function ownerOf(p) { return isW(p) ? WHITE : isB(p) ? BLACK : 0; }
  function clone(b) { return b.map(function (r) { return r.slice(); }); }

  function startPosition() {
    var b = [], r, c;
    for (r = 0; r < N; r++) b.push(new Array(N).fill(EMPTY));
    for (r = 0; r < 4; r++) for (c = 0; c < N; c++) if ((r + c) % 2) b[r][c] = BLACK;
    for (r = 6; r < N; r++) for (c = 0; c < N; c++) if ((r + c) % 2) b[r][c] = WHITE;
    return b;
  }

  function sqToRC(n) { var r = Math.floor((n - 1) / 5), k = (n - 1) % 5; return { r: r, c: r % 2 === 0 ? 2 * k + 1 : 2 * k }; }
  function rcToSq(r, c) { return r * 5 + Math.floor(c / 2) + 1; }

  function captureSeqs(b, r0, c0, side) {
    var p = b[r0][c0], king = isKing(p), out = [];
    function enemy(q) { return side === WHITE ? isB(q) : isW(q); }
    function dfs(r, c, caps, path) {
      var found = false, i, d, nr, nc;
      for (i = 0; i < 4; i++) {
        d = DIRS[i];
        if (!king) {
          nr = r + d[0]; nc = c + d[1];
          if (!inside(nr, nc) || !enemy(b[nr][nc]) || caps.indexOf(nr * N + nc) >= 0) continue;
          var lr = nr + d[0], lc = nc + d[1];
          if (!inside(lr, lc) || (b[lr][lc] !== EMPTY && !(lr === r0 && lc === c0))) continue;
          found = true;
          dfs(lr, lc, caps.concat([nr * N + nc]), path.concat([[lr, lc]]));
        } else {
          nr = r + d[0]; nc = c + d[1];
          while (inside(nr, nc) && (b[nr][nc] === EMPTY || (nr === r0 && nc === c0))) { nr += d[0]; nc += d[1]; }
          if (!inside(nr, nc) || !enemy(b[nr][nc]) || caps.indexOf(nr * N + nc) >= 0) continue;
          var er = nr, ec = nc;
          nr += d[0]; nc += d[1];
          while (inside(nr, nc) && (b[nr][nc] === EMPTY || (nr === r0 && nc === c0))) {
            found = true;
            dfs(nr, nc, caps.concat([er * N + ec]), path.concat([[nr, nc]]));
            nr += d[0]; nc += d[1];
          }
        }
      }
      if (!found && caps.length) out.push({ caps: caps, path: path });
    }
    dfs(r0, c0, [], []);
    return out;
  }

  function legalMoves(b, side) {
    var caps = [], simple = [], r, c, p, best = 0, i, s, m, seen = {};
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      p = b[r][c];
      if (ownerOf(p) !== side) continue;
      var seqs = captureSeqs(b, r, c, side);
      for (i = 0; i < seqs.length; i++) {
        s = seqs[i];
        var last = s.path[s.path.length - 1];
        var key = r + ',' + c + '>' + last[0] + ',' + last[1] + ':' + s.caps.slice().sort().join('.');
        if (seen[key]) continue; seen[key] = 1;
        m = { from: { r: r, c: c }, to: { r: last[0], c: last[1] }, captures: s.caps.map(function (x) { return { r: Math.floor(x / N), c: x % N }; }), path: s.path.map(function (x) { return { r: x[0], c: x[1] }; }) };
        if (m.captures.length > best) { best = m.captures.length; caps = [m]; }
        else if (m.captures.length === best) caps.push(m);
      }
      if (best === 0) {
        if (isKing(p)) {
          for (i = 0; i < 4; i++) {
            var nr = r + DIRS[i][0], nc = c + DIRS[i][1];
            while (inside(nr, nc) && b[nr][nc] === EMPTY) { simple.push({ from: { r: r, c: c }, to: { r: nr, c: nc }, captures: [], path: [{ r: nr, c: nc }] }); nr += DIRS[i][0]; nc += DIRS[i][1]; }
          }
        } else {
          var dr = side === WHITE ? -1 : 1;
          for (i = 0; i < 4; i++) if (DIRS[i][0] === dr) {
            var tr = r + dr, tc = c + DIRS[i][1];
            if (inside(tr, tc) && b[tr][tc] === EMPTY) simple.push({ from: { r: r, c: c }, to: { r: tr, c: tc }, captures: [], path: [{ r: tr, c: tc }] });
          }
        }
      }
    }
    return best > 0 ? caps : simple;
  }

  function applyMove(b, m) {
    var nb = clone(b), p = nb[m.from.r][m.from.c];
    nb[m.from.r][m.from.c] = EMPTY;
    m.captures.forEach(function (x) { nb[x.r][x.c] = EMPTY; });
    if (p === WHITE && m.to.r === 0) p = WK;
    else if (p === BLACK && m.to.r === N - 1) p = BK;
    nb[m.to.r][m.to.c] = p;
    return nb;
  }

  function notate(m) { return rcToSq(m.from.r, m.from.c) + (m.captures.length ? 'x' : '-') + rcToSq(m.to.r, m.to.c); }

  function result(b, side) {
    return legalMoves(b, side).length ? 0 : (side === WHITE ? BLACK : WHITE);
  }

  var api = { N: N, EMPTY: EMPTY, WHITE: WHITE, BLACK: BLACK, WK: WK, BK: BK, startPosition: startPosition, legalMoves: legalMoves, applyMove: applyMove, sqToRC: sqToRC, rcToSq: rcToSq, notate: notate, result: result, clone: clone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Draughts10 = api;
})(typeof window !== 'undefined' ? window : this);
