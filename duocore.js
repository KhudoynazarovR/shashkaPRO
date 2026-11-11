/* duocore.js — 👥 2 kishilik o'yinlar qoidalari (server va brauzer uchun bitta kod): Gomoku, Go 9×9, Shaxmat, Poddavki.
   Har o'yin: start() → holat {turn:1|2, ply, over, res (1|2|0 durang), why, last}, moves(st) (faqat poddavki/shaxmat), play(st, mv) → true/false.
   1-tomon birinchi yuradi: Gomoku/Go — qora, Shaxmat/Poddavki — oq. */
(function (root) {
  var G = {};
  function fin(st, res, why) { st.over = true; st.res = res; st.why = why; }

  // ================= ⚫ GOMOKU (15×15, 5 va undan ko'p qatorda — g'alaba)
  G.gomoku = {
    N: 15, name: 'Gomoku', sides: ['⚫ Qora', '⚪ Oq'],
    start: function () { return { b: new Array(225).fill(0), turn: 1, ply: 0, over: false, res: null, why: '', last: null }; },
    play: function (st, mv) {
      var i = +mv.i, N = 15; if (st.over || !(i >= 0 && i < 225) || st.b[i]) return false;
      var s = st.turn; st.b[i] = s; st.ply++; st.last = [i];
      var r = Math.floor(i / N), c = i % N, D = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (var k = 0; k < 4; k++) {
        var line = [i];
        for (var sg = -1; sg <= 1; sg += 2) for (var t = 1; t < 15; t++) { var rr = r + D[k][0] * t * sg, cc = c + D[k][1] * t * sg; if (rr < 0 || cc < 0 || rr >= N || cc >= N || st.b[rr * N + cc] !== s) break; line.push(rr * N + cc); }
        if (line.length >= 5) { st.win = line; fin(st, s, 'five'); return true; }
      }
      if (st.ply >= 225) { fin(st, 0, 'full'); return true; }
      st.turn = 3 - s; return true;
    }
  };

  // ================= ⚪ GO 9×9 (xitoycha hisob: toshlar + hudud, komi 7.5; ko taqiqlangan; ikki marta pas — hisob)
  function goGroup(b, N, i) {
    var s = b[i], seen = {}, st = [i], g = [], lib = 0, ls = {}; seen[i] = 1;
    while (st.length) {
      var x = st.pop(); g.push(x); var r = Math.floor(x / N), c = x % N, nb = [];
      if (r > 0) nb.push(x - N); if (r < N - 1) nb.push(x + N); if (c > 0) nb.push(x - 1); if (c < N - 1) nb.push(x + 1);
      for (var k = 0; k < nb.length; k++) { var y = nb[k]; if (!b[y]) { if (!ls[y]) { ls[y] = 1; lib++; } } else if (b[y] === s && !seen[y]) { seen[y] = 1; st.push(y); } }
    }
    return { g: g, lib: lib };
  }
  function goNb(N, x) { var r = Math.floor(x / N), c = x % N, nb = []; if (r > 0) nb.push(x - N); if (r < N - 1) nb.push(x + N); if (c > 0) nb.push(x - 1); if (c < N - 1) nb.push(x + 1); return nb; }
  function goScore(st) {
    var N = st.N, b = st.b, sc = [0, 0, 0], terr = new Array(N * N).fill(0), seen = {};
    for (var i = 0; i < N * N; i++) {
      if (b[i]) { sc[b[i]]++; continue; }
      if (seen[i]) continue;
      var q = [i], reg = [], touch = {}; seen[i] = 1;
      while (q.length) { var x = q.pop(); reg.push(x); goNb(N, x).forEach(function (y) { if (!b[y]) { if (!seen[y]) { seen[y] = 1; q.push(y); } } else touch[b[y]] = 1; }); }
      var own = touch[1] && !touch[2] ? 1 : touch[2] && !touch[1] ? 2 : 0;
      if (own) { sc[own] += reg.length; reg.forEach(function (x) { terr[x] = own; }); }
    }
    st.terr = terr; st.score = [sc[1], sc[2] + st.komi];
    fin(st, st.score[0] > st.score[1] ? 1 : 2, 'score');
  }
  G.go = {
    N: 9, name: 'Go', sides: ['⚫ Qora', '⚪ Oq'],
    start: function () { return { N: 9, b: new Array(81).fill(0), turn: 1, ply: 0, over: false, res: null, why: '', last: null, ko: -1, pass: 0, cap: [0, 0], komi: 7.5 }; },
    play: function (st, mv) {
      if (st.over) return false;
      var N = st.N, s = st.turn, o = 3 - s;
      if (mv.pass) { st.pass++; st.ply++; st.last = null; st.ko = -1; if (st.pass >= 2) goScore(st); else st.turn = o; return true; }
      var i = +mv.i; if (!(i >= 0 && i < N * N) || st.b[i] || i === st.ko) return false;
      var b = st.b.slice(); b[i] = s; var capd = [];
      goNb(N, i).forEach(function (y) { if (b[y] === o) { var g = goGroup(b, N, y); if (!g.lib) g.g.forEach(function (x) { if (b[x]) { b[x] = 0; capd.push(x); } }); } });
      var me = goGroup(b, N, i); if (!me.lib) return false;   // o'z-o'zini o'ldirish taqiqlangan
      st.ko = capd.length === 1 && me.g.length === 1 && me.lib === 1 ? capd[0] : -1;
      st.b = b; st.cap[s - 1] += capd.length; st.pass = 0; st.ply++; st.last = [i]; st.capd = capd;
      if (st.ply >= 250) { goScore(st); return true; }
      st.turn = o; return true;
    },
    score: goScore
  };

  // ================= ♟ SHAXMAT (to'liq qoidalar: rokirovka, en passant, aylantirish, mat/pat, 50 yurish, 3 marta takror, kuch yetmasligi)
  var KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var RD = [[-1, 0], [1, 0], [0, -1], [0, 1]], BD = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function isW(p) { return p && p === p.toUpperCase(); }
  function side(p) { return !p ? 0 : isW(p) ? 1 : 2; }
  function attacked(b, sq, by) {   // sq katagini "by" tomon urayaptimi
    var r = sq >> 3, c = sq & 7, k, rr, cc, p;
    var pr = by === 1 ? r + 1 : r - 1;   // piyoda pastdan (oq) yoki yuqoridan (qora) uradi
    for (k = -1; k <= 1; k += 2) { cc = c + k; if (pr >= 0 && pr < 8 && cc >= 0 && cc < 8) { p = b[pr * 8 + cc]; if (p === (by === 1 ? 'P' : 'p')) return true; } }
    for (k = 0; k < 8; k++) { rr = r + KN[k][0]; cc = c + KN[k][1]; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { p = b[rr * 8 + cc]; if (p === (by === 1 ? 'N' : 'n')) return true; } }
    for (k = 0; k < 8; k++) { rr = r + KG[k][0]; cc = c + KG[k][1]; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { p = b[rr * 8 + cc]; if (p === (by === 1 ? 'K' : 'k')) return true; } }
    var sl = [[RD, 'RQ'], [BD, 'BQ']];
    for (var t = 0; t < 2; t++) for (k = 0; k < 4; k++) {
      rr = r; cc = c;
      while (true) { rr += sl[t][0][k][0]; cc += sl[t][0][k][1]; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) break; p = b[rr * 8 + cc]; if (!p) continue; if (side(p) === by && sl[t][1].indexOf(p.toUpperCase()) >= 0) return true; break; }
    }
    return false;
  }
  function kingSq(b, s) { var K = s === 1 ? 'K' : 'k'; for (var i = 0; i < 64; i++) if (b[i] === K) return i; return -1; }
  function pseudo(st) {
    var b = st.b, s = st.turn, out = [], i, r, c, k, rr, cc, p, t;
    function add(f, to, extra) { var tr = to >> 3, P = b[f].toUpperCase(); if (P === 'P' && (tr === 0 || tr === 7)) { 'QRBN'.split('').forEach(function (q) { out.push({ from: f, to: to, promo: q }); }); } else out.push(Object.assign({ from: f, to: to }, extra || {})); }
    for (i = 0; i < 64; i++) {
      p = b[i]; if (side(p) !== s) continue; r = i >> 3; c = i & 7; var P = p.toUpperCase();
      if (P === 'P') {
        var dir = s === 1 ? -1 : 1, sr = s === 1 ? 6 : 1; rr = r + dir;
        if (rr >= 0 && rr < 8 && !b[rr * 8 + c]) { add(i, rr * 8 + c); if (r === sr && !b[(r + 2 * dir) * 8 + c]) add(i, (r + 2 * dir) * 8 + c, { dbl: 1 }); }
        for (k = -1; k <= 1; k += 2) { cc = c + k; if (cc < 0 || cc > 7 || rr < 0 || rr > 7) continue; t = rr * 8 + cc; if (b[t] && side(b[t]) !== s) add(i, t); else if (t === st.ep) add(i, t, { ep: 1 }); }
      } else if (P === 'N' || P === 'K') {
        var L = P === 'N' ? KN : KG;
        for (k = 0; k < 8; k++) { rr = r + L[k][0]; cc = c + L[k][1]; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue; t = rr * 8 + cc; if (side(b[t]) !== s) add(i, t); }
        if (P === 'K') {   // rokirovka
          var o = 3 - s, row = s === 1 ? 7 : 0, ks = s === 1 ? 'K' : 'k', qs = s === 1 ? 'Q' : 'q';
          if (i === row * 8 + 4 && !attacked(b, i, o)) {
            if (st.cas.indexOf(ks) >= 0 && !b[row * 8 + 5] && !b[row * 8 + 6] && b[row * 8 + 7] === (s === 1 ? 'R' : 'r') && !attacked(b, row * 8 + 5, o) && !attacked(b, row * 8 + 6, o)) out.push({ from: i, to: row * 8 + 6, cas: 'k' });
            if (st.cas.indexOf(qs) >= 0 && !b[row * 8 + 3] && !b[row * 8 + 2] && !b[row * 8 + 1] && b[row * 8] === (s === 1 ? 'R' : 'r') && !attacked(b, row * 8 + 3, o) && !attacked(b, row * 8 + 2, o)) out.push({ from: i, to: row * 8 + 2, cas: 'q' });
          }
        }
      } else {
        var dirs = P === 'R' ? RD : P === 'B' ? BD : RD.concat(BD);
        for (k = 0; k < dirs.length; k++) { rr = r; cc = c; while (true) { rr += dirs[k][0]; cc += dirs[k][1]; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) break; t = rr * 8 + cc; if (!b[t]) { out.push({ from: i, to: t }); continue; } if (side(b[t]) !== s) out.push({ from: i, to: t }); break; } }
      }
    }
    return out;
  }
  function chApply(st, m) {   // tekshirmasdan qo'llaydi; yangi holat qaytaradi
    var b = st.b.slice(), p = b[m.from], s = st.turn, cap = b[m.to] || (m.ep ? 'x' : '');
    b[m.to] = m.promo ? (s === 1 ? m.promo : m.promo.toLowerCase()) : p; b[m.from] = '';
    if (m.ep) b[m.to + (s === 1 ? 8 : -8)] = '';
    if (m.cas) { var row = s === 1 ? 7 : 0; if (m.cas === 'k') { b[row * 8 + 5] = b[row * 8 + 7]; b[row * 8 + 7] = ''; } else { b[row * 8 + 3] = b[row * 8]; b[row * 8] = ''; } }
    var cas = st.cas;
    function drop(ch) { cas = cas.replace(ch, ''); }
    if (p === 'K') { drop('K'); drop('Q'); } if (p === 'k') { drop('k'); drop('q'); }
    [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(function (x) { if (m.from === x[0] || m.to === x[0]) drop(x[1]); });
    return { b: b, turn: 3 - s, cas: cas, ep: m.dbl ? (m.from + m.to) / 2 : -1, half: (p.toUpperCase() === 'P' || cap) ? 0 : st.half + 1, ply: st.ply + 1, rep: st.rep, over: false, res: null, why: '', last: [m.from, m.to] };
  }
  function chLegal(st) { var s = st.turn; return pseudo(st).filter(function (m) { var n = chApply(st, m); return !attacked(n.b, kingSq(n.b, s), 3 - s); }); }
  function key(st) { return st.b.map(function (x) { return x || '.'; }).join('') + st.turn + st.cas + st.ep; }
  function insuff(b) {
    var pcs = b.filter(function (x) { return x && x.toUpperCase() !== 'K'; });
    if (!pcs.length) return true;
    return pcs.length === 1 && 'BN'.indexOf(pcs[0].toUpperCase()) >= 0;
  }
  G.chess = {
    name: 'Shaxmat', sides: ['⚪ Oq', '⚫ Qora'],
    start: function () {
      var b = new Array(64).fill(''), R = 'rnbqkbnr';
      for (var c = 0; c < 8; c++) { b[c] = R[c]; b[8 + c] = 'p'; b[48 + c] = 'P'; b[56 + c] = R[c].toUpperCase(); }
      var st = { b: b, turn: 1, cas: 'KQkq', ep: -1, half: 0, ply: 0, rep: {}, over: false, res: null, why: '', last: null };
      st.rep[key(st)] = 1; return st;
    },
    moves: chLegal, attacked: attacked, kingSq: kingSq,
    play: function (st, mv) {
      if (st.over) return false;
      var L = chLegal(st), m = L.find(function (x) { return x.from === +mv.from && x.to === +mv.to && (!x.promo || x.promo === (mv.promo || 'Q')); });
      if (!m) return false;
      var n = chApply(st, m), s = st.turn;
      Object.keys(n).forEach(function (k) { st[k] = n[k]; });
      st.san = m; var kk = key(st); st.rep[kk] = (st.rep[kk] || 0) + 1;
      var check = attacked(st.b, kingSq(st.b, st.turn), s); st.check = check;
      if (!chLegal(st).length) fin(st, check ? s : 0, check ? 'mate' : 'stalemate');
      else if (st.half >= 100) fin(st, 0, 'fifty');
      else if (st.rep[kk] >= 3) fin(st, 0, 'repeat');
      else if (insuff(st.b)) fin(st, 0, 'material');
      return true;
    }
  };

  // ================= 🔄 PODDAVKI (rus shashkasi qoidalari, maqsad teskari: donasi tugagan yoki yurolmagan tomon YUTADI)
  // b[i]: 0 bo'sh, 1 oq, 2 qora, 3 oq damka, 4 qora damka. Oq pastda (5–7 qatorlar), birinchi yuradi.
  var DD = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function pSide(v) { return !v ? 0 : (v === 1 || v === 3) ? 1 : 2; }
  function pKing(v) { return v === 3 || v === 4; }
  function caps(b, from, s) {   // shu donaning hamma urish yo'llari [[from, ...to], captured[]]
    var out = [], startK = pKing(b[from]);
    function rec(pos, king, path, taken) {
      var r = pos >> 3, c = pos & 7, any = false;
      for (var k = 0; k < 4; k++) {
        var dr = DD[k][0], dc = DD[k][1];
        if (!king) {
          var mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
          if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
          var mi = mr * 8 + mc, li = lr * 8 + lc;
          if (pSide(b[mi]) !== 3 - s || taken.indexOf(mi) >= 0) continue;
          if (b[li] && li !== from) continue;
          any = true; var pk = (s === 1 && lr === 0) || (s === 2 && lr === 7);
          rec(li, pk, path.concat([li]), taken.concat([mi]));
        } else {
          var rr = r + dr, cc = c + dc, found = -1;
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            var ii = rr * 8 + cc;
            if (b[ii] && ii !== from) { if (taken.indexOf(ii) >= 0) break; if (pSide(b[ii]) === s) break; found = ii; break; }
            rr += dr; cc += dc;
          }
          if (found < 0) continue;
          var lands = []; rr = (found >> 3) + dr; cc = (found & 7) + dc;
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { var li2 = rr * 8 + cc; if (b[li2] && li2 !== from) break; lands.push(li2); rr += dr; cc += dc; }
          if (!lands.length) continue;
          any = true;
          var t2 = taken.concat([found]), cont = lands.filter(function (l) { return canMore(l, t2); });   // davom etadigan joy bo'lsa — faqat o'sha
          (cont.length ? cont : lands).forEach(function (l) { rec(l, true, path.concat([l]), t2); });
        }
      }
      if (!any && taken.length) out.push({ path: path, taken: taken, king: king });
    }
    function canMore(pos, taken) { var save = out.length; var probe = []; var o2 = out; out = probe; rec(pos, true, [pos], taken); var ok = probe.some(function (x) { return x.taken.length > taken.length; }); out = o2; return ok; }
    rec(from, startK, [from], []);
    return out;
  }
  function pMoves(st) {
    var b = st.b, s = st.turn, cap = [], quiet = [];
    for (var i = 0; i < 64; i++) {
      if (pSide(b[i]) !== s) continue;
      caps(b, i, s).forEach(function (x) { cap.push({ from: i, to: x.path[x.path.length - 1], path: x.path, taken: x.taken, king: x.king }); });
      if (cap.length) continue;
      var r = i >> 3, c = i & 7, K = pKing(b[i]);
      for (var k = 0; k < 4; k++) {
        var dr = DD[k][0], dc = DD[k][1];
        if (!K && dr !== (s === 1 ? -1 : 1)) continue;
        var rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !b[rr * 8 + cc]) { var t = rr * 8 + cc; quiet.push({ from: i, to: t, path: [i, t], taken: [], king: K || (s === 1 && rr === 0) || (s === 2 && rr === 7) }); if (!K) break; rr += dr; cc += dc; }
      }
    }
    return cap.length ? cap : quiet;   // urish majburiy
  }
  G.pod = {
    name: 'Poddavki', sides: ['⚪ Oq', '⚫ Qora'],
    start: function () { var b = new Array(64).fill(0); for (var i = 0; i < 64; i++) { var r = i >> 3, c = i & 7; if ((r + c) % 2) { if (r <= 2) b[i] = 2; else if (r >= 5) b[i] = 1; } } return { b: b, turn: 1, ply: 0, quiet: 0, over: false, res: null, why: '', last: null }; },
    moves: pMoves,
    play: function (st, mv) {
      if (st.over) return false;
      var L = pMoves(st), m = L.find(function (x) { return x.from === +mv.from && x.to === +mv.to && (!mv.path || x.path.join() === String(mv.path)); }) || L.find(function (x) { return x.from === +mv.from && x.to === +mv.to; });
      if (!m) return false;
      var s = st.turn, v = st.b[m.from], wasK = pKing(v);
      st.b[m.from] = 0; m.taken.forEach(function (x) { st.b[x] = 0; });
      st.b[m.to] = m.king ? (s === 1 ? 3 : 4) : v;
      st.quiet = (m.taken.length || !wasK) ? 0 : st.quiet + 1;
      st.ply++; st.last = m.path; st.turn = 3 - s;
      var mine = st.b.some(function (x) { return pSide(x) === s; }), his = st.b.some(function (x) { return pSide(x) === 3 - s; });
      if (!mine) return fin(st, s, 'empty'), true;            // donalari tugadi — YUTDI
      if (!his) return fin(st, 3 - s, 'empty'), true;
      if (!pMoves(st).length) return fin(st, st.turn, 'blocked'), true;   // yurolmaydi — yutadi
      if (st.quiet >= 30) fin(st, 0, 'quiet');                 // 15 juft damka yurishi urishsiz — durang
      return true;
    }
  };

  var api = { G: G };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DUO = api;
})(this);
