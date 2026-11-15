'use strict';
// pzcheck.js — masala yechimini rus shashkasi qoidalari bo'yicha tekshirish (urish majburiy, damka uzoqqa yuradi)
// board: 8x8, 1=oq, 2=qora, 3=oq damka, 4=qora damka. Oq pastdan (r=7) tepaga (r=0) yuradi.
const D = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const side = p => p === 1 || p === 3 ? 'w' : p === 2 || p === 4 ? 'b' : null;
const king = p => p === 3 || p === 4;
const ins = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
// bitta qadamli urishlar (dead — shu yurishda urilgan, hali olinmagan donalar)
function capsFrom(b, r, c, dead) {
  const p = b[r][c], me = side(p), out = [];
  const isD = (a, e) => dead.some(x => x[0] === a && x[1] === e);
  for (const [dr, dc] of D) {
    if (!king(p)) {
      const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (ins(lr, lc) && b[mr][mc] && side(b[mr][mc]) !== me && !isD(mr, mc) && !b[lr][lc]) out.push([lr, lc, mr, mc]);
    } else {
      let nr = r + dr, nc = c + dc;
      while (ins(nr, nc) && !b[nr][nc]) { nr += dr; nc += dc; }
      if (!ins(nr, nc) || side(b[nr][nc]) === me || isD(nr, nc)) continue;
      const mr = nr, mc = nc; nr += dr; nc += dc;
      while (ins(nr, nc) && !b[nr][nc]) { out.push([nr, nc, mr, mc]); nr += dr; nc += dc; }
    }
  }
  return out;
}
function anyCap(b, s) { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (side(b[r][c]) === s && capsFrom(b, r, c, []).length) return true; return false; }
function quietFrom(b, r, c) {
  const p = b[r][c], out = [];
  for (const [dr, dc] of D) {
    if (!king(p)) { if ((p === 1 && dr !== -1) || (p === 2 && dr !== 1)) continue; const nr = r + dr, nc = c + dc; if (ins(nr, nc) && !b[nr][nc]) out.push([nr, nc]); }
    else { let nr = r + dr, nc = c + dc; while (ins(nr, nc) && !b[nr][nc]) { out.push([nr, nc]); nr += dr; nc += dc; } }
  }
  return out;
}
function hasMove(b, s) { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (side(b[r][c]) === s && (quietFrom(b, r, c).length || capsFrom(b, r, c, []).length)) return true; return false; }
function count(b, s) { let n = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (side(b[r][c]) === s) n += king(b[r][c]) ? 2.5 : 1; return n; }
// yechimni o'ynab ko'rish. Qaytaradi: {ok, err, at, b, turn}
function play(board, first, sol) {
  const b = board.map(x => x.slice()); let turn = first, cap = null; // cap: {r,c,dead}
  const other = s => s === 'w' ? 'b' : 'w';
  const promote = (r, c) => { const p = b[r][c]; if (p === 1 && r === 0) b[r][c] = 3; if (p === 2 && r === 7) b[r][c] = 4; };
  const finish = () => { cap.dead.forEach(([r, c]) => { b[r][c] = 0; }); cap = null; turn = other(turn); };
  for (let i = 0; i < sol.length; i++) {
    const [r1, c1, r2, c2] = sol[i];
    if (![r1, c1, r2, c2].every(v => Number.isInteger(v) && v >= 0 && v < 8)) return { ok: false, err: 'noto‘g‘ri katak', at: i };
    if (cap && (r1 !== cap.r || c1 !== cap.c)) {   // urish tugamay boshqa yurish
      return { ok: false, err: 'urish oxirigacha davom ettirilmagan', at: i };
    }
    const p = b[r1][c1];
    if (!p) return { ok: false, err: 'bo‘sh katakdan yurish', at: i };
    if (side(p) !== turn) return { ok: false, err: 'navbat boshqa tomonda', at: i };
    const caps = capsFrom(b, r1, c1, cap ? cap.dead : []);
    const hit = caps.find(x => x[0] === r2 && x[1] === c2);
    if (hit) {
      cap = cap || { dead: [] }; cap.dead.push([hit[2], hit[3]]);
      b[r2][c2] = p; b[r1][c1] = 0; cap.r = r2; cap.c = c2; promote(r2, c2);
      if (!capsFrom(b, r2, c2, cap.dead).length) finish();
      continue;
    }
    if (cap) return { ok: false, err: 'urish noto‘g‘ri davom ettirilgan', at: i };
    if (anyCap(b, turn)) return { ok: false, err: 'majburiy urish o‘tkazib yuborilgan', at: i };
    if (!quietFrom(b, r1, c1).some(x => x[0] === r2 && x[1] === c2)) return { ok: false, err: 'qoidaga zid yurish', at: i };
    b[r2][c2] = p; b[r1][c1] = 0; promote(r2, c2); turn = other(turn);
  }
  if (cap) return { ok: false, err: 'yechim urish o‘rtasida tugagan', at: sol.length };
  return { ok: true, b, turn };
}
// qoidalar bo'yicha tekshiruv: har bir yechim yo'li qonuniy bo'lishi kerak
function legal(pz) {
  const sols = (pz.sols && pz.sols.length ? pz.sols : [pz.sol]).filter(s => Array.isArray(s) && s.length);
  if (!sols.length) return { ok: false, err: 'yechim yo‘q' };
  const me = pz.side === 'b' ? 'b' : 'w';
  for (const s of sols) { const r = play(pz.board, me, s); if (!r.ok) return Object.assign(r, { at: (r.at | 0) + 1 }); }
  return { ok: true, sol: sols[0] };
}
// yechimdagi birinchi yurish (urish zanjiri bilan): {from:[r,c], to:[r,c]}
function firstMove(pz, sol) {
  const me = pz.side === 'b' ? 'b' : 'w';
  for (let k = 1; k <= sol.length; k++) { const r = play(pz.board, me, sol.slice(0, k)); if (r.ok && r.turn !== me) return { from: sol[0].slice(0, 2), to: sol[k - 1].slice(2, 4) }; }
  return { from: sol[0].slice(0, 2), to: sol[0].slice(2, 4) };
}
// o'yinchining o'z yurishlari soni (qiyinlik uchun)
function ownMoves(pz, sol) {
  const me = pz.side === 'b' ? 'b' : 'w'; let n = 0, pt = me;
  for (let k = 1; k <= sol.length; k++) { const r = play(pz.board, me, sol.slice(0, k)); if (r.ok && r.turn !== pt) { if (pt === me) n++; pt = r.turn; } }
  return n;
}
module.exports = { play, legal, firstMove, ownMoves, capsFrom, anyCap };
