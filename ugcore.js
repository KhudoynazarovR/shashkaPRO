/* ugcore.js — 🏁 Ugolki qoidalari (server va brauzer uchun bitta kod).
   Doska 8×8, katak = r*8+c (r=0 — yuqori qator, 8-qator). Oq: chap yuqori burchak 3×4 (a6–d8), qora: o'ng pastki 3×4 (e1–h3).
   Yurish: 1 katak yonga/oldinga/orqaga yoki yonma-yon dona ustidan bo'sh katakka sakrash (ketma-ket bir necha marta). Diagonal yo'q, urish yo'q.
   G'alaba: hamma 12 donani raqib burchagiga birinchi olib kirish. Oq to'ldirsa, qoraga bitta yurish beriladi — u ham to'ldirsa durang.
   40-yurishdan keyin (har biri 40 tadan) o'z uyida dona qolgan o'yinchi yutqazadi (ikkalasi ham bo'lsa — durang).
   80 yurishdan keyin (har biri) — manzilga ko'proq dona kiritgan yutadi. */
(function (root) {
  var W = 1, B = 2, HOME = 40, MAXM = 80;
  function inW(i) { var r = i >> 3, c = i & 7; return r <= 2 && c <= 3; }   // oqning uyi = qoraning manzili
  function inB(i) { var r = i >> 3, c = i & 7; return r >= 5 && c >= 4; }   // qoraning uyi = oqning manzili
  function home(s, i) { return s === W ? inW(i) : inB(i); }
  function goal(s, i) { return s === W ? inB(i) : inW(i); }
  function start() {
    var b = new Array(64).fill(0);
    for (var i = 0; i < 64; i++) { if (inW(i)) b[i] = W; else if (inB(i)) b[i] = B; }
    return { b: b, turn: W, ply: 0, over: false, res: null, why: '', pend: false, last: null };
  }
  var D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  function ok(r, c) { return r >= 0 && c >= 0 && r < 8 && c < 8; }
  // bitta donaning hamma yurishlari: [{to, path:[from,...,to], j:sakrashmi}]
  function pieceMoves(b, from) {
    var out = [], seen = {}, r0 = from >> 3, c0 = from & 7, k, r, c, i;
    for (k = 0; k < 4; k++) { r = r0 + D[k][0]; c = c0 + D[k][1]; if (ok(r, c) && !b[i = r * 8 + c]) { out.push({ to: i, path: [from, i], j: false }); seen[i] = 1; } }
    seen[from] = 1;
    var q = [[from]];
    while (q.length) {
      var p = q.shift(), at = p[p.length - 1], ar = at >> 3, ac = at & 7;
      for (k = 0; k < 4; k++) {
        var mr = ar + D[k][0], mc = ac + D[k][1], tr = ar + 2 * D[k][0], tc = ac + 2 * D[k][1];
        if (!ok(tr, tc) || !b[mr * 8 + mc]) continue;
        var t = tr * 8 + tc; if (t !== from && b[t]) continue; if (seen[t]) continue;
        seen[t] = 1; var np = p.concat([t]); if (t !== from) out.push({ to: t, path: np, j: true }); q.push(np);
      }
    }
    return out;
  }
  function moves(st, s) {
    s = s || st.turn; var out = [];
    for (var i = 0; i < 64; i++) if (st.b[i] === s) { var m = pieceMoves(st.b, i); for (var k = 0; k < m.length; k++) out.push({ from: i, to: m[k].to, path: m[k].path }); }
    return out;
  }
  function count(b, s, f) { var n = 0; for (var i = 0; i < 64; i++) if (b[i] === s && f(s, i)) n++; return n; }
  function done(b, s) { return count(b, s, goal) === 12; }
  function finish(st, res, why) { st.over = true; st.res = res; st.why = why; }   // res: 1 oq, 2 qora, 0 durang
  // yurish qilish (tekshiradi). Qaytaradi: true / false
  function play(st, from, to) {
    if (st.over || st.b[from] !== st.turn) return false;
    var m = pieceMoves(st.b, from).find(function (x) { return x.to === to; }); if (!m) return false;
    var s = st.turn; st.b[to] = s; st.b[from] = 0; st.ply++; st.last = m.path;
    after(st, s);
    return true;
  }
  function pass(st) { var s = st.turn; st.ply++; st.last = null; after(st, s); }   // yurish yo'q bo'lsa (juda kam holat)
  function after(st, s) {
    var o = s === W ? B : W;
    if (st.pend) {   // oq to'ldirgan edi, qora oxirgi yurishini qildi
      finish(st, done(st.b, B) ? 0 : W, done(st.b, B) ? 'both' : 'goal'); return;
    }
    if (done(st.b, s)) {
      if (s === W) { st.pend = true; st.turn = B; return; }
      finish(st, B, 'goal'); return;
    }
    if (s === B && st.ply === HOME * 2) {   // 40-yurish qoidasi
      var hw = count(st.b, W, home) > 0, hb = count(st.b, B, home) > 0;
      if (hw && hb) return finish(st, 0, 'home');
      if (hw) return finish(st, B, 'home');
      if (hb) return finish(st, W, 'home');
    }
    if (s === B && st.ply >= MAXM * 2) {
      var gw = count(st.b, W, goal), gb = count(st.b, B, goal);
      return finish(st, gw > gb ? W : gb > gw ? B : 0, 'limit');
    }
    st.turn = o;
    if (!moves(st, o).length) { if (!moves(st, s).length) return finish(st, 0, 'block'); st.turn = o; }
  }
  // 🤖 bot: masofa (manzil burchagiga) + uyda qolganlarga jarima
  function dist(s, i) {   // manzil zonasigacha masofa (asosiy) + zona ichida chuqurroq burchakka (kichik)
    var r = i >> 3, c = i & 7;
    return s === W ? 3 * (Math.max(0, 5 - r) + Math.max(0, 4 - c)) + 0.25 * ((7 - r) + (7 - c))
                   : 3 * (Math.max(0, r - 2) + Math.max(0, c - 3)) + 0.25 * (r + c);
  }
  function evalS(b, s, ply) {
    var o = s === W ? B : W, v = 0, ds = 0, dO = 0, hs = 0, ho = 0;
    for (var i = 0; i < 64; i++) {
      if (b[i] === s) { ds += dist(s, i); if (home(s, i)) hs++; }
      else if (b[i] === o) { dO += dist(o, i); if (home(o, i)) ho++; }
    }
    var late = ply > 50 ? 3 : ply > 30 ? 1.2 : 0.3;
    v = (dO - ds) - late * (hs - ho);
    return v;
  }
  function clone(st) { return { b: st.b.slice(), turn: st.turn, ply: st.ply, over: st.over, res: st.res, why: st.why, pend: st.pend, last: st.last }; }
  function score(st, me) { if (st.over) return st.res === me ? 1e5 - st.ply : st.res === 0 ? 0 : -1e5 + st.ply; return evalS(st.b, me, st.ply); }
  function search(st, me, d, a, bb) {
    if (d === 0 || st.over) return score(st, me);
    var ms = moves(st); if (!ms.length) { var c0 = clone(st); pass(c0); return search(c0, me, d - 1, a, bb); }
    order(st, ms);
    if (ms.length > 24) ms = ms.slice(0, 24);
    var mx = st.turn === me, best = mx ? -1e9 : 1e9;
    for (var k = 0; k < ms.length; k++) {
      var c = clone(st); play(c, ms[k].from, ms[k].to);
      var v = search(c, me, d - 1, a, bb);
      if (mx) { if (v > best) best = v; if (v > a) a = v; } else { if (v < best) best = v; if (v < bb) bb = v; }
      if (a >= bb) break;
    }
    return best;
  }
  function order(st, ms) { var s = st.turn; ms.forEach(function (m) { m.g = dist(s, m.from) - dist(s, m.to); }); ms.sort(function (x, y) { return y.g - x.g; }); }
  // lv: 1 Shogird (tasodifiy-ochko'z), 2 O'rtacha (1 qadam), 3 Kuchli (3 qadam oldindan)
  function bot(st, lv) {
    var me = st.turn, ms = moves(st); if (!ms.length) return null;
    order(st, ms);
    if (lv <= 1) {
      var good = ms.filter(function (m) { return m.g > 0; }); var pool = (good.length ? good : ms).slice(0, 6);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    var d = lv >= 3 ? 3 : 1, best = null, bv = -1e9;
    for (var k = 0; k < Math.min(ms.length, 40); k++) {
      var c = clone(st); play(c, ms[k].from, ms[k].to);
      var v = search(c, me, d - 1, -1e9, 1e9) + Math.random() * 0.3;
      if (v > bv) { bv = v; best = ms[k]; }
    }
    return best;
  }
  var api = { W: W, B: B, HOME: HOME, MAXM: MAXM, start: start, moves: moves, pieceMoves: pieceMoves, play: play, pass: pass, bot: bot, clone: clone, goal: goal, home: home, inW: inW, inB: inB,
    inGoal: function (b, s) { return count(b, s, goal); }, atHome: function (b, s) { return count(b, s, home); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.UG = api;
})(this);
