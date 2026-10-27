'use strict';
// kkrules.js — rus shashkasi qoidalari (server uchun): to'liq yurishlar ro'yxati.
// Doska: 64 ta son, index = r*8+c, r=0 — 8-gorizontal (tepada). 1 = oq dona, 2 = oq damka, -1 = qora dona, -2 = qora damka.
// Oq yuqoriga (r kamayadi) yuradi va r=0 da damka bo'ladi; qora pastga, r=7 da.
const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ins = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function moves(b, side) {
  const caps = [], quiet = [];
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (!p || Math.sign(p) !== side) continue;
    const r = i >> 3, c = i & 7, king = Math.abs(p) === 2;
    capFrom(b, side, i, r, c, king, [], new Set(), caps, i);
    if (caps.length) continue;
    for (const [dr, dc] of DIRS) {
      if (!king && dr !== -side) continue;
      let nr = r + dr, nc = c + dc;
      while (ins(nr, nc) && !b[nr * 8 + nc]) {
        quiet.push(mk(b, i, nr * 8 + nc, [], side));
        if (!king) break;
        nr += dr; nc += dc;
      }
    }
  }
  return caps.length ? caps : quiet;
}

// zanjirli urish: olingan donalar oxirigacha doskada turadi (ikki marta urib bo'lmaydi)
function capFrom(b, side, start, r, c, king, path, taken, out, cur) {
  let any = false;
  for (const [dr, dc] of DIRS) {
    if (king) {
      let nr = r + dr, nc = c + dc;
      while (ins(nr, nc) && (!b[nr * 8 + nc] || nr * 8 + nc === start)) { nr += dr; nc += dc; }
      if (!ins(nr, nc)) continue;
      const v = nr * 8 + nc;
      if (Math.sign(b[v]) !== -side || taken.has(v)) continue;
      let lr = nr + dr, lc = nc + dc;
      const t2 = new Set(taken); t2.add(v);
      const lands = [];
      while (ins(lr, lc) && (!b[lr * 8 + lc] || lr * 8 + lc === start)) { lands.push(lr * 8 + lc); lr += dr; lc += dc; }
      if (!lands.length) continue;
      any = true;
      // davom ettirish mumkin bo'lgan katak bo'lsa — faqat o'shalarga tushish mumkin
      const cont = [];
      for (const l of lands) { const tmp = []; if (capFrom(b, side, start, l >> 3, l & 7, true, path.concat([l]), t2, tmp, l)) cont.push(tmp); }
      if (cont.length) cont.forEach(t => out.push(...t));
      else for (const l of lands) out.push(mk(b, start, l, [...t2], side, path.concat([l])));
    } else {
      const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (!ins(lr, lc)) continue;
      const v = mr * 8 + mc, l = lr * 8 + lc;
      if (Math.sign(b[v]) !== -side || taken.has(v) || (b[l] && l !== start)) continue;
      any = true;
      const t2 = new Set(taken); t2.add(v);
      const promo = (side > 0 && lr === 0) || (side < 0 && lr === 7);
      if (!capFrom(b, side, start, lr, lc, promo, path.concat([l]), t2, out, l)) out.push(mk(b, start, l, [...t2], side, path.concat([l])));
    }
  }
  return any;
}

function mk(b, from, to, caps, side, path) {
  const n = b.slice();
  let p = n[from]; n[from] = 0;
  for (const x of caps) n[x] = 0;
  const r = to >> 3;
  if (Math.abs(p) === 1 && ((side > 0 && r === 0) || (side < 0 && r === 7))) p = 2 * side;
  if (Math.abs(p) === 1 && path) for (const q of path) { const rr = q >> 3; if ((side > 0 && rr === 0) || (side < 0 && rr === 7)) { p = 2 * side; break; } }
  n[to] = p;
  return { from, to, caps, path: path || [to], board: n };
}

module.exports = { moves };
