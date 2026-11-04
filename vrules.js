'use strict';
// vrules.js — 🛡 xonadagi har bir yurish qadamini serverda qoida bo'yicha tekshirish (rus shashkasi).
// Ilova yuborgan qadam: { from:{r,c}, to:{r,c}, captures:[{r,c}] } — bitta sakrash yoki butun urish zanjiri (Avtohod).
// Turk urishi: zanjir davomida urilgan donalar doskada qoladi (ikkinchi marta urib bo'lmaydi), zanjir oxirida olinadi.
// Holat room._vs da keshlanadi; tarixni qayta o'ynab bo'lmasa (eski/buzilgan o'yin) — tekshiruv o'chadi, o'yin to'xtamaydi.
const DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const W = 1, B = 2, WK = 3, BK = 4;
const isW = p => p === W || p === WK, isB = p => p === B || p === BK, isK = p => p === WK || p === BK;
const same = (a, b) => (isW(a) && isW(b)) || (isB(a) && isB(b));
const ins = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const cl = b => b.map(r => r.slice());
const isDead = (d, r, c) => d.some(x => x.r === r && x.c === c);
const own = (p, col) => col === 'white' ? isW(p) : isB(p);

function startOf(room) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(0)), o = room.opening && room.opening.board;
  if (o) {
    let k = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) continue; const ch = String(o).charAt(k++); b[r][c] = ch === 'w' ? W : ch === 'b' ? B : ch === 'W' ? WK : ch === 'B' ? BK : 0; }
    return b;
  }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = B;
  for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = W;
  return b;
}
function simple(b, r, c) {
  const p = b[r][c], out = []; if (!p) return out;
  if (isK(p)) { for (const d of DIRS) { let nr = r + d[0], nc = c + d[1]; while (ins(nr, nc) && !b[nr][nc]) { out.push({ to: { r: nr, c: nc }, caps: [] }); nr += d[0]; nc += d[1]; } } }
  else { const dr = isW(p) ? -1 : 1; for (const d of DIRS) if (d[0] === dr) { const nr = r + d[0], nc = c + d[1]; if (ins(nr, nc) && !b[nr][nc]) out.push({ to: { r: nr, c: nc }, caps: [] }); } }
  return out;
}
function raw(b, r, c, dead) {
  const p = b[r][c], out = []; if (!p) return out;
  if (isK(p)) {
    for (const d of DIRS) {
      let nr = r + d[0], nc = c + d[1], en = null;
      while (ins(nr, nc)) { const x = b[nr][nc]; if (!x) { if (en) out.push({ to: { r: nr, c: nc }, caps: [en] }); } else { if (same(p, x) || en || isDead(dead, nr, nc)) break; en = { r: nr, c: nc }; } nr += d[0]; nc += d[1]; }
    }
  } else {
    for (const d of DIRS) { const mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1]; if (ins(lr, lc) && b[mr][mc] && !same(p, b[mr][mc]) && !isDead(dead, mr, mc) && !b[lr][lc]) out.push({ to: { r: lr, c: lc }, caps: [{ r: mr, c: mc }] }); }
  }
  return out;
}
function keep(b, dead, fr, s) {   // bitta sakrash, urilganlar doskada qoladi
  const n = cl(b), p = n[fr.r][fr.c]; n[fr.r][fr.c] = 0;
  n[s.to.r][s.to.c] = (p === W && s.to.r === 0) ? WK : (p === B && s.to.r === 7) ? BK : p;
  return { b: n, dead: dead.concat(s.caps) };
}
function jumps(b, dead, r, c) {   // damka: davom ettirish mumkin bo'lgan joyga tushishi shart
  const L = raw(b, r, c, dead); if (L.length < 2 || !isK(b[r][c])) return L;
  const g = new Map(); for (const s of L) { const k = s.caps[0].r * 8 + s.caps[0].c; if (!g.has(k)) g.set(k, []); g.get(k).push(s); }
  const out = [];
  for (const a of g.values()) { const cont = a.filter(s => { const n = keep(b, dead, { r, c }, s); return raw(n.b, s.to.r, s.to.c, n.dead).length > 0; }); out.push(...(cont.length ? cont : a)); }
  return out;
}
function anyCap(b, col) { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] && own(b[r][c], col) && jumps(b, [], r, c).length) return true; return false; }
function chains(b, dead, fr, path0, caps0, out) {   // butun zanjirlar (Avtohod bitta qadamda yuboradi)
  const L = jumps(b, dead, fr.r, fr.c);
  if (!L.length) { if (caps0.length) out.push({ to: fr, caps: caps0 }); return; }
  for (const s of L) { const n = keep(b, dead, fr, s); chains(n.b, n.dead, s.to, path0, caps0.concat(s.caps), out); }
}
const eqSet = (a, b) => a.length === b.length && a.every(x => b.some(y => y.r === x.r && y.c === x.c));
const okSq = q => q && Number.isInteger(q.r) && Number.isInteger(q.c) && ins(q.r, q.c);
const finish = (b, dead) => { const n = cl(b); for (const x of dead) n[x.r][x.c] = 0; return n; };

// st: { b, dead, forced, turn } → { st: yangi holat, keep } yoki { error }; keepTurn=null — tarixni o'qishda (o'zi aniqlanadi)
function step(st, col, mv, keepTurn) {
  if (!mv || !okSq(mv.from) || !okSq(mv.to) || !Array.isArray(mv.captures || [])) return { error: 'Yurish noto‘g‘ri' };
  if (col !== st.turn) return { error: 'Hozir navbat sizniki emas' };
  const caps = (mv.captures || []).filter(okSq), f = mv.from, b = st.b, p = b[f.r][f.c];
  if (!p || !own(p, col)) return { error: 'Bu katakda sizning donangiz yo‘q' };
  if (st.forced && (st.forced.r !== f.r || st.forced.c !== f.c)) return { error: 'Urishni shu dona bilan davom ettiring' };
  const mustCap = !!st.forced || anyCap(b, col);
  if (!mustCap) {
    if (caps.length || !simple(b, f.r, f.c).some(s => s.to.r === mv.to.r && s.to.c === mv.to.c)) return { error: 'Bunday yurish qoidaga zid' };
    const n = cl(b), q = n[f.r][f.c]; n[f.r][f.c] = 0; n[mv.to.r][mv.to.c] = (q === W && mv.to.r === 0) ? WK : (q === B && mv.to.r === 7) ? BK : q;
    if (keepTurn === true) return { error: 'Bunday yurish qoidaga zid' };
    return { st: { b: n, dead: [], forced: null, turn: col === 'white' ? 'black' : 'white' }, keep: false };
  }
  const one = jumps(b, st.dead, f.r, f.c).find(s => s.to.r === mv.to.r && s.to.c === mv.to.c && eqSet(s.caps, caps));
  if (one) {
    const n = keep(b, st.dead, f, one), more = raw(n.b, mv.to.r, mv.to.c, n.dead).length > 0;
    if (keepTurn !== null && !!keepTurn !== more) return { error: more ? 'Urishni oxirigacha davom ettiring' : 'Bunday yurish qoidaga zid' };
    if (more) return { st: { b: n.b, dead: n.dead, forced: { r: mv.to.r, c: mv.to.c }, turn: col }, keep: true };
    return { st: { b: finish(n.b, n.dead), dead: [], forced: null, turn: col === 'white' ? 'black' : 'white' }, keep: false };
  }
  if (keepTurn !== true && caps.length > 1) {   // butun zanjir bitta qadamda
    const out = []; chains(b, st.dead, f, [], [], out);
    const ch = out.find(x => x.to.r === mv.to.r && x.to.c === mv.to.c && eqSet(st.dead.concat(caps), st.dead.concat(x.caps)) && eqSet(x.caps, caps));
    if (ch) {
      // zanjirni qayta yurib, oxirgi holatni olamiz (damkaga aylanish yo'lda ham bo'lishi mumkin)
      const fin = replayChain(b, st.dead, f, caps, mv.to); if (!fin) return { error: 'Bunday yurish qoidaga zid' };
      return { st: { b: fin, dead: [], forced: null, turn: col === 'white' ? 'black' : 'white' }, keep: false };
    }
  }
  return { error: mustCap ? 'Urish majburiy — boshqa yurish qilib bo‘lmaydi' : 'Bunday yurish qoidaga zid' };
}
function replayChain(b, dead, fr, caps, to) {   // berilgan urilganlar to'plami va oxirgi katak bo'yicha zanjirni topadi
  const L = jumps(b, dead, fr.r, fr.c);
  if (!L.length) return (fr.r === to.r && fr.c === to.c && eqSet(dead.filter(x => caps.some(y => y.r === x.r && y.c === x.c)), caps)) ? finish(b, dead) : null;
  for (const s of L) { if (!caps.some(y => y.r === s.caps[0].r && y.c === s.caps[0].c)) continue; const n = keep(b, dead, fr, s); const r = replayChain(n.b, n.dead, s.to, caps, to); if (r) return r; }
  return null;
}

// xona holati (keshlangan); tarixni o'qib bo'lmasa null — tekshiruv o'chiq
function stateOf(room) {
  const v = room._vs;
  if (v && v.arr === room.moves && v.n === room.moves.length) return v.off ? null : v.st;
  let st = { b: startOf(room), dead: [], forced: null, turn: room.first || (room.opening && room.opening.side === 'b' ? 'black' : 'white') };
  for (let i = 0; i < room.moves.length; i++) {
    const mv = room.moves[i], col = st.turn;
    const r = step(st, col, mv, null);
    if (r.error) { room._vs = { arr: room.moves, n: room.moves.length, off: true }; return null; }
    st = r.st;
  }
  room._vs = { arr: room.moves, n: room.moves.length, st };
  return st;
}
// applyMove dan: { ok, keep, st } yoki { error }; tekshiruv o'chiq bo'lsa { skip: true }
function check(room, col, m) {
  try {
    const st = stateOf(room); if (!st) return { skip: true };
    if (st.turn !== col) return { skip: true };   // navbatni rooms.js o'zi tekshiradi (vaqt tugashi va h.k.)
    const r = step(st, col, m.move, !!m.keepTurn);
    return r.error ? r : { ok: true, keep: r.keep, st: r.st };
  } catch (e) { console.log('[vrules]', e.message); return { skip: true }; }
}
function commit(room, r) { if (r && r.ok) room._vs = { arr: room.moves, n: room.moves.length, st: r.st }; }
module.exports = { check, commit, stateOf, _t: { step, startOf } };
