/* tahlilx.js — 🔬 tahlil taxtasi uchun qo'pol xato tekshiruvi (telefonning o'zida, serverga yuk yo'q).
   Rus shashkasi qoidalari (kkrules.js bilan bir xil) + donalar hisobi (oddiy 1, damka 3), 6 yarim yurish + majburiy urishlar oxirigacha.
   TX.loss(b64, side, from, to) → o'ynalgan yurish eng yaxshi muqobilga nisbatan necha dona yo'qotadi (0 — xavfsiz), yoki null (juda og'ir). */
;(function () {
  if (window.TX) return;
  var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function ins(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function mk(b, from, to, caps, side, path) {
    var n = b.slice(), p = n[from]; n[from] = 0;
    for (var i = 0; i < caps.length; i++) n[caps[i]] = 0;
    var r = to >> 3;
    if (Math.abs(p) === 1 && ((side > 0 && r === 0) || (side < 0 && r === 7))) p = 2 * side;
    if (Math.abs(p) === 1 && path) for (var k = 0; k < path.length; k++) { var rr = path[k] >> 3; if ((side > 0 && rr === 0) || (side < 0 && rr === 7)) { p = 2 * side; break; } }
    n[to] = p;
    return { from: from, to: to, caps: caps, path: path || [to], board: n };
  }
  function capFrom(b, side, start, r, c, king, path, taken, out, cur) {
    var any = false;
    for (var d = 0; d < 4; d++) {
      var dr = DIRS[d][0], dc = DIRS[d][1];
      if (king) {
        var rr = r + dr, cc = c + dc;
        while (ins(rr, cc) && (!b[rr * 8 + cc] || rr * 8 + cc === start)) { rr += dr; cc += dc; }
        if (!ins(rr, cc)) continue;
        var v = rr * 8 + cc;
        if (Math.sign(b[v]) !== -side || taken[v]) continue;
        var lr = rr + dr, lc = cc + dc, lands = [];
        while (ins(lr, lc) && (!b[lr * 8 + lc] || lr * 8 + lc === start)) { lands.push(lr * 8 + lc); lr += dr; lc += dc; }
        if (!lands.length) continue;
        any = true;
        var t2 = Object.assign({}, taken); t2[v] = 1;
        var cont = [];
        for (var i = 0; i < lands.length; i++) { var tmp = []; if (capFrom(b, side, start, lands[i] >> 3, lands[i] & 7, true, path.concat([lands[i]]), t2, tmp, lands[i])) cont.push(tmp); }
        if (cont.length) cont.forEach(function (t) { t.forEach(function (x) { out.push(x); }); });
        else for (var j = 0; j < lands.length; j++) out.push(mk(b, start, lands[j], Object.keys(t2).map(Number), side, path.concat([lands[j]])));
      } else {
        var mr = r + dr, mc = c + dc, lr2 = r + 2 * dr, lc2 = c + 2 * dc;
        if (!ins(lr2, lc2)) continue;
        var v2 = mr * 8 + mc, l = lr2 * 8 + lc2;
        if (Math.sign(b[v2]) !== -side || taken[v2] || (b[l] && l !== start)) continue;
        any = true;
        var t3 = Object.assign({}, taken); t3[v2] = 1;
        var promo = (side > 0 && lr2 === 0) || (side < 0 && lr2 === 7);
        if (!capFrom(b, side, start, lr2, lc2, promo, path.concat([l]), t3, out, l)) out.push(mk(b, start, l, Object.keys(t3).map(Number), side, path.concat([l])));
      }
    }
    return any;
  }
  function moves(b, side) {
    var caps = [], quiet = [];
    for (var i = 0; i < 64; i++) {
      var p = b[i]; if (!p || Math.sign(p) !== side) continue;
      var r = i >> 3, c = i & 7, king = Math.abs(p) === 2;
      capFrom(b, side, i, r, c, king, [], {}, caps, i);
      if (caps.length) continue;
      for (var d = 0; d < 4; d++) {
        var dr = DIRS[d][0], dc = DIRS[d][1];
        if (!king && dr !== -side) continue;
        var nr = r + dr, nc = c + dc;
        while (ins(nr, nc) && !b[nr * 8 + nc]) { quiet.push(mk(b, i, nr * 8 + nc, [], side)); if (!king) break; nr += dr; nc += dc; }
      }
    }
    return caps.length ? caps : quiet;
  }
  function mat(b, s) { var v = 0; for (var i = 0; i < 64; i++) { var x = b[i]; if (x) v += (x === 2 || x === -2 ? 3 : 1) * (x > 0 ? 1 : -1); } return v * s; }
  var CAP = 90000;
  function search(b, s, d, a, be, st) {
    if (++st.n > CAP) { st.cut = true; return mat(b, s); }
    var ms = moves(b, s); if (!ms.length) return -50;
    var cap = ms[0].caps.length > 0;
    if ((d <= 0 && !cap) || d <= -8) return mat(b, s);
    var best = -1e9;
    for (var i = 0; i < ms.length; i++) { var v = -search(ms[i].board, -s, d - 1, -be, -a, st); if (v > best) best = v; if (v > a) a = v; if (a >= be) break; }
    return best;
  }
  function loss(b, s, from, to) {
    var st = { n: 0, cut: false }, ms = moves(b, s), best = -1e9, me = null;
    if (ms.length < 2) return 0;
    for (var i = 0; i < ms.length; i++) {
      var v = -search(ms[i].board, -s, 5, -1e9, 1e9, st); if (st.cut) return null;
      if (v > best) best = v;
      if (ms[i].from === from && ms[i].to === to) me = v;
    }
    return me == null ? null : best - me;
  }
  window.TX = { moves: moves, loss: loss };
})();
