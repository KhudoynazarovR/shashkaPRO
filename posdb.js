'use strict';
// posdb.js — 📖 tahlil taxtasining «Baza» tabi (lichess Explorer kabi) va dvigatelning 3 varianti.
// Manbalar: 🎮 ShashkaPRO (o'yinchilar arxividagi barcha partiyalar, xotirada indeks), 📗 Colette va kitob,
// 🌐 lidraughts (King Kong o'yinlari), 📖 Repertuar (faqat admin — kkrep). Indeks diskka yozilmaydi: ishga tushganda fonda quriladi.
const store = require('./store.js');
const R = require('./kkrules.js');
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const MAXPLY = 24;
const IDX = new Map();   // key -> Map(moveId -> [oq, durang, qora])
const SEEN = new Set();
let built = false, building = false, nGames = 0;
const init = () => { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; } return b; };
const mtxt = m => [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps.length ? ':' : '-');

// hop'lar ([fr,fc,tr,tc,caps]) → to'liq yurishlar; har pozitsiyaga natija qo'shiladi
function addGame(id, hops, res, idx) {
  idx = idx || IDX;
  let b = init(), s = 1, i = 0, ply = 0;
  while (i < hops.length && ply < MAXPLY) {
    const L = R.moves(b, s); if (!L.length) break;
    const h0 = hops[i], f = h0[0] * 8 + h0[1];
    let best = null, bn = 0;
    for (const m of L) {
      if (m.from !== f) continue;
      const P = m.path && m.path.length ? m.path : [m.to]; let n = 0, cur = f;
      for (let k = 0; k < P.length && i + k < hops.length; k++) { const h = hops[i + k]; if (h[0] * 8 + h[1] !== cur || h[2] * 8 + h[3] !== P[k]) break; n++; cur = P[k]; }
      if (n === P.length && n > bn) { best = m; bn = n; }
    }
    if (!best) break;
    const k = b.join('') + s; let M = idx.get(k); if (!M) { M = new Map(); idx.set(k, M); }
    const id2 = best.from + '-' + best.to, v = M.get(id2) || [0, 0, 0]; v[res === 'w' ? 0 : res === 'b' ? 2 : 1]++; M.set(id2, v);
    b = best.board; s = -s; i += bn; ply++;
  }
}
function fromArch(g) {
  if (!g || !g.id || SEEN.has(g.id) || g.o || !Array.isArray(g.m) || g.m.length < 4) return;
  SEEN.add(g.id); nGames++;
  addGame(g.id, g.m, g.win === 'white' ? 'w' : g.win === 'black' ? 'b' : 'd');
}
// fonda indeks qurish (CPU ga yuk bermaslik uchun bo'lib-bo'lib)
function build() {
  if (built || building) return; building = true;
  let us = {}; try { us = store.users(); } catch (e) {}
  const ids = Object.keys(us); let i = 0;
  const tick = () => {
    const t0 = Date.now();
    while (i < ids.length && Date.now() - t0 < 25) { const u = us[ids[i++]]; (u && u.arch || []).forEach(fromArch); }
    if (i < ids.length) return setTimeout(tick, 40);
    built = true; building = false; console.log('[posdb] indeks tayyor:', nGames, 'partiya,', IDX.size, 'pozitsiya');
  };
  setTimeout(tick, 10);
}
{ const tm = setTimeout(build, 90e3); if (tm.unref) tm.unref(); }
// rooms.finish dan: yangi partiya darhol qo'shiladi
function onGame(g) { try { fromArch(g); } catch (e) {} }

// 🌐 lidraughts (King Kong) — kkGames dan, kichik, kesh bilan
let LD = null, LDn = -1;
function ldIdx() {
  const G = (store.db.kkGames || []).filter(g => /^ld/.test(String(g.id)));
  if (LD && LDn === G.length) return LD;
  LD = new Map(); LDn = G.length;
  for (const g of G) {
    try {
      const fm = require('./kkadm.js').movesOf(g), res = g.res === 'd' ? 'd' : ((g.res === 'w') === (g.kk === 1) ? 'w' : 'b');
      for (const x of fm.slice(0, MAXPLY)) { const k = x.b.join('') + x.s; let M = LD.get(k); if (!M) { M = new Map(); LD.set(k, M); } const id = x.from + '-' + x.to, v = M.get(id) || [0, 0, 0]; v[res === 'w' ? 0 : res === 'b' ? 2 : 1]++; M.set(id, v); }
    } catch (e) {}
  }
  return LD;
}
let BOOK = null;
function book() { if (BOOK) return BOOK; try { BOOK = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'book.json'), 'utf8')); } catch (e) { BOOK = {}; } return BOOK; }

// 📖 Debyut nomlari: debyut.js dagi kutubxonadan — har debyutning yakuniy pozitsiyasi → nomi (yurish tartibidan qat'i nazar)
let OPN = null;
function opIdx() {
  if (OPN) return OPN; OPN = new Map();
  try {
    const t = require('fs').readFileSync(require('path').join(__dirname, 'debyut.js'), 'utf8'), m = /var DATA = (\[.*?\]);\n/.exec(t), D = JSON.parse(m[1]);
    D.forEach((d, i) => [d.steps].concat(d.alts || []).forEach(st => {
      let b = init(), s = 1;
      for (const x of st) { const h = x.p, f = h[0][0] * 8 + h[0][1], e = h[h.length - 1][2] * 8 + h[h.length - 1][3]; const mv = R.moves(b, s).find(q => { const P = q.path && q.path.length ? q.path : [q.to]; return q.from === f && P[P.length - 1] === e; }); if (!mv) return; b = mv.board; s = -s; }
      const k = b.join('') + s; if (!OPN.has(k)) OPN.set(k, { i, uz: d.uz, ru: d.ru });
    }));
  } catch (e) { console.log('[posdb] debyutlar:', e.message); }
  return OPN;
}
function opOf(keys) { const I = opIdx(); for (let i = keys.length - 1; i >= 0; i--) { const o = I.get(keys[i]); if (o) return o; } return null; }
function rowsFrom(M, b, s) {
  const L = R.moves(b, s), out = [];
  if (M) for (const [id, v] of M) { const [f, t] = id.split('-').map(Number), m = L.find(x => x.from === f && x.to === t); if (m) out.push({ id, from: f, to: t, t: mtxt(m), n: v[0] + v[1] + v[2], w: v[0], d: v[1], l: v[2] }); }
  return out.sort((a, c) => c.n - a.n);
}
function explore(src, b, s, admin, sc) {
  if (src === 'sp') { if (!built) build(); return { rows: rowsFrom(IDX.get(b.join('') + s), b, s), building: !built, games: nGames }; }
  if (src === 'ld') return { rows: rowsFrom(ldIdx().get(b.join('') + s), b, s) };
  if (src === 'col') {
    const L = R.moves(b, s), k = b.join('') + s, rows = [];
    let c = null; try { c = require('./kestoai.js').peek(b, s).colette; } catch (e) {}
    const bk = book()[k];
    if (c) { const m = L.find(x => x.from === c.from && x.to === c.to); if (m) rows.push({ id: c.from + '-' + c.to, from: c.from, to: c.to, t: mtxt(m), tag: '📚 Nazariya' }); }
    if (bk) { const m = L.find(x => x.from === bk.from && x.to === bk.to); if (m) { const ex = rows.find(r => r.id === bk.from + '-' + bk.to); if (ex) { ex.tag += ' · 📖 kitob'; ex.n = bk.n; } else rows.push({ id: bk.from + '-' + bk.to, from: bk.from, to: bk.to, t: mtxt(m), tag: '📖 kitob', n: bk.n }); } }
    return { rows };
  }
  if (src === 'rep' && admin) { const v = require('./kkrep.js').view(sc || 'all', b, s); return { rows: v.list.map(m => ({ id: m.id, from: m.from, to: m.to, t: m.t, w: m.w, pct: m.pct, mk: m.mk, note: m.note, lock: m.lock, src: m.src, st: m.st, trap: m.trap })), taught: v.taught, sc: v.sc };
  }
  return { rows: [] };
}

// ⚙️ dvigatelning 3 varianti: eng yaxshisi + 2 ta keyingi (moddiy tartib), har biri davomi bilan
const MPV = new Map();
function multipv(b, s, cb, o) {
  o = o || {}; const secs = Math.min(2, Math.max(0.3, Number(o.t) || 0.8)), N = Math.min(3, Math.max(1, Number(o.n) || 3)), PL = Math.min(12, Math.max(4, Number(o.pl) || 8));
  const key = b.join('') + s + '|' + secs + '|' + N + '|' + PL, c = MPV.get(key); if (c) return cb(c);
  const K0 = require('./kestoai.js'), K = { pv: (bb, ss, t, p, cb) => K0.pv(bb, ss, t, p, cb, 0.1) }, L = R.moves(b, s);
  if (!L.length) return cb({ lines: [] });
  const busy = global.__tRunning && global.__tRunning();
  K.pv(b, s, secs, PL, r0 => {   // davomi tez: har yurish 0.1 s
    if (!r0 || r0.error || !r0.pv || !r0.pv.length) return cb({ lines: [] });
    const lines = [{ ev: r0.ev, pv: r0.pv }];
    if (busy || L.length < 2 || N < 2) { const o = { lines }; MPV.set(key, o); return cb(o); }
    const f0 = r0.pv[0].path[0], t0 = r0.pv[0].path[r0.pv[0].path.length - 1];
    let alt = []; try { alt = (require('./kkadm.js').rank(b, s, 4) || []).map(x => x.m).filter(x => !(x.from === f0 && x.to === t0)).slice(0, N - 1); } catch (e) { alt = L.filter(x => !(x.from === f0 && x.to === t0)).slice(0, N - 1); }
    let left = alt.length; if (!left) { const o = { lines }; MPV.set(key, o); return cb(o); }
    alt.forEach(a => {
      const m = L.find(x => x.from === a.from && x.to === a.to);
      K.pv(m.board, -s, 0.3, PL - 2, r => {
        lines.push({ ev: r && r.ev != null ? r.ev : null, pv: [{ path: [m.from].concat(m.path || [m.to]), caps: m.caps.length }].concat((r && r.pv) || []) });
        if (--left === 0) { lines.sort((x, y) => s * ((y.ev == null ? -99 * s : y.ev) - (x.ev == null ? -99 * s : x.ev))); const o = { lines }; MPV.set(key, o); if (MPV.size > 2000) MPV.delete(MPV.keys().next().value); cb(o); }
      });
    });
  });
}

function handle(req, res, p, h) {
  if (p !== '/api/explore' && p !== '/api/ai/multipv') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  h.readBody(req, 4000, body => {
    let j = {}; try { j = JSON.parse(body || '{}'); } catch (e) {}
    const b = j.board, s = j.side === -1 ? -1 : 1;
    if (!Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return h.send(res, 400, { error: 'bad' });
    if (p === '/api/ai/multipv') return multipv(b, s, r => h.send(res, 200, r), { t: j.time, n: j.n, pl: j.plies });
    let adm = false; try { adm = require('./kkbook.js').isAdmin(t.id); } catch (e) {}
    const src = ['sp', 'ld', 'col', 'rep'].includes(j.src) ? j.src : 'sp';
    if ((src === 'rep' || src === 'ld') && !adm) return h.send(res, 403, { error: 'Faqat admin' });
    const ex = explore(src, b, s, adm, j.sc), I = opIdx(), L = R.moves(b, s);
    (ex.rows || []).forEach(r => { const m = L.find(x => x.from === r.from && x.to === r.to); const o = m && I.get(m.board.join('') + (-s)); if (o) r.op = o.uz; });
    const hk = Array.isArray(j.hk) ? j.hk.slice(-60).filter(x => typeof x === 'string' && x.length < 80) : [];
    h.send(res, 200, Object.assign({ src, admin: adm, op: opOf(hk.concat([b.join('') + s])) }, ex));
  });
  return true;
}
module.exports = { handle, onGame, explore, multipv, addGame, build, opOf, opIdx };
