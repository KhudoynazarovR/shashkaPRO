'use strict';
// kkadm.js — 🦍 King Kong xatolari: (1) qo'pol xato qo'riqchisi — o'yin paytida dona yo'qotadigan yurishni ushlaydi,
// (2) o'yin tugagach King Kong yurishlarini tekshiradi va adminga ro'yxat beradi (☰ Menyu → 🛡 ADMIN → 🦍 King Kong xatolari).
// Tekshiruv: donalar hisobi (oddiy 1, damka 3), 6 yarim yurish oldinga + majburiy urishlar oxirigacha (rus qoidalari, kkrules.js).
const R = require('./kkrules.js');
const store = require('./store.js');
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const DEPTH = 6, NODE_CAP = 160000;

// ---------- tez qidiruv
function mat(b, s) { let v = 0; for (const x of b) if (x) v += (x === 2 || x === -2 ? 3 : 1) * Math.sign(x); return v * s; }
function search(b, s, d, a, be, st) {
  if (++st.n > NODE_CAP) { st.cut = true; return { v: mat(b, s), pv: [] }; }
  const ms = R.moves(b, s);
  if (!ms.length) return { v: -50, pv: [] };   // yurish yo'q — yutqazdi
  const cap = ms[0].caps.length > 0;
  if (d <= 0 && !cap) return { v: mat(b, s), pv: [] };
  if (d <= -8) return { v: mat(b, s), pv: [] };
  let best = { v: -1e9, pv: [] };
  for (const m of ms) {
    const r = search(m.board, -s, d - 1, -be, -a, st), v = -r.v;
    if (v > best.v) best = { v, pv: [m].concat(r.pv) };
    if (v > a) a = v;
    if (a >= be) break;
  }
  return best;
}
function mtxt(m) { return [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps && m.caps.length ? ':' : '-'); }
// pozitsiyadagi hamma yurishlar bahosi: [{m, v, pv}] (kamayish tartibida). Juda og'ir bo'lsa null.
function rank(b, s, depth) {
  const st = { n: 0, cut: false }, ms = R.moves(b, s), out = [];
  for (const m of ms) { const r = search(m.board, -s, (depth || DEPTH) - 1, -1e9, 1e9, st); out.push({ m, v: -r.v, pv: r.pv }); if (st.cut) return null; }
  return out.sort((x, y) => y.v - x.v);
}
// o'ynalgan yurish tekshiruvi: loss > 0 — majburiy yo'l bilan shuncha material yo'qotadi (eng yaxshi muqobilga nisbatan)
function check(b, s, from, to) {
  const L = rank(b, s); if (!L || !L.length) return null;
  const me = L.find(x => x.m.from === from && x.m.to === to); if (!me) return null;
  const best = L[0].v, loss = best - me.v;
  return { loss, safe: L.filter(x => x.v === best).slice(0, 6).map(x => ({ from: x.m.from, to: x.m.to, t: mtxt(x.m), j: x.m.caps.length })), line: me.pv.slice(0, 6).map(mtxt) };
}
// 🛡 qo'riqchi (kestoai.move dan): yurish dona yo'qotsa va dvigatel o'zi katta ustunlik ko'rmasa — xavfsiz muqobil
const GSTAT = { n: 0, swap: 0, ms: 0 };
function guard(b, s, r) {
  try {
    if (!r || r.error || r.from == null || r.tb || r.admin) return r;
    if (r.ev != null && r.ev >= 150) return r;   // dvigatel ataylab qurbon beryapti va yutayotganini ko'ryapti
    const t0 = Date.now(), c = check(b, s, r.from, r.to); GSTAT.n++; GSTAT.ms += Date.now() - t0;
    if (!c || c.loss < 1 || !c.safe.length) return r;
    const alt = c.safe[0]; GSTAT.swap++;
    console.log('[qo‘riqchi] ' + SQ(r.from) + '-' + SQ(r.to) + ' (' + (r.colette ? 'Colette' : r.book ? 'kitob' : 'dvigatel') + ', ' + c.loss + ' dona yo‘qotadi) → ' + alt.t);
    return Object.assign({}, r, { from: alt.from, to: alt.to, jumps: alt.j, ev: null, guard: { from: r.from, to: r.to, loss: c.loss } });
  } catch (e) { return r; }
}

// ---------- o'yin davomida: King Kong har yurishining manbasi (dvigatel / Colette / kitob / admin / qo'riqchi)
const SRC = new Map();   // roomId -> Map(kalit -> {src, g})
function note(room, b, s, r) {
  if (!room || !r || r.from == null) return;
  if (!SRC.has(room)) { SRC.set(room, new Map()); if (SRC.size > 300) SRC.delete(SRC.keys().next().value); }
  const src = r.tb ? 'baza' : r.admin ? 'admin' : r.rep ? (r.rep === 'trap' ? 'tuzoq' : 'repertuar') : r.colette ? 'Colette' : r.etude ? 'etyud' : r.book ? 'kitob' : r.cached ? 'xotira' : 'dvigatel';
  SRC.get(room).set(b.join('') + s, { src, g: r.guard ? { from: r.guard.from, to: r.guard.to, loss: r.guard.loss } : null });
}

// ---------- o'yin tugadi (kkbook.result dan)
function G() { const d = store.db; d.kkGames = d.kkGames || []; return d.kkGames; }
function startBoard(room) {
  const b = Array(64).fill(0), o = room.opening && room.opening.board;
  if (o) { let k = 0; for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; const ch = o.charAt(k++); b[i] = ch === 'w' ? 1 : ch === 'W' ? 2 : ch === 'b' ? -1 : ch === 'B' ? -2 : 0; } return { b, s: room.opening.side === 'b' ? -1 : 1 }; }
  for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; }
  return { b, s: 1 };
}
// xona yurishlari (qadamlar) → to'liq yurishlar [{b, s, from, to, t}]
function fullMoves(b0, s0, steps) {
  const out = []; let b = b0.slice(), s = s0, i = 0;
  while (i < steps.length) {
    const L = R.moves(b, s), f = steps[i].from.r * 8 + steps[i].from.c; let m = null, j = i;
    for (; j < steps.length && j < i + 12; j++) { const t = steps[j].to.r * 8 + steps[j].to.c; m = L.find(x => x.from === f && x.to === t && (x.path || [x.to]).length === j - i + 1); if (m) break; }
    if (!m) break;
    out.push({ b: b.slice(), s, from: m.from, to: m.to, t: mtxt(m), path: [m.from].concat(m.path || [m.to]), caps: m.caps || [] });
    b = m.board; s = -s; i = j + 1;
  }
  return out;
}
function record(room, res) {   // res: 'w' | 'l' | 'd' (King Kong nuqtai nazaridan)
  try {
    if (!room || !Array.isArray(room.moves) || room.moves.length < 4) return;
    const kkCol = room.white && /^bot/.test(String(room.white.uid)) ? 'white' : 'black', human = room[kkCol === 'white' ? 'black' : 'white'] || {};
    const st = startBoard(room), src = SRC.get(room.id); SRC.delete(room.id);
    const g = { id: room.id + '_' + Date.now().toString(36), at: Date.now(), opp: String(human.name || '?').slice(0, 24), tc: room.tc || '', res, kk: kkCol === 'white' ? 1 : -1, b0: st.b.join(','), s0: st.s, steps: room.moves.map(x => [x.from.r * 8 + x.from.c, x.to.r * 8 + x.to.c]), src: {}, errs: null };
    if (src) { let n = 0; const fm = fullMoves(st.b, st.s, room.moves); fm.forEach((x, k) => { const v = src.get(x.b.join('') + x.s); if (v) g.src[k] = v; }); void n; }
    if (!(room.opening && room.opening.board)) { try { const tk = require('./kkbook.js').notation(room.moves).split(' '), o = []; let n = 0; for (const t of tk) { o.push(t); if (!/^\d+\.$/.test(t) && ++n >= 6) break; } if (n >= 6) g.op = o.join(' '); } catch (e) {} }
    const L = G(); L.unshift(g); if (L.length > 200) L.length = 200;
    try { require('./kkfix.js').onRecord(g); } catch (e) {}
    try { require('./kkrep.js').result(room.id, res); } catch (e) {}
    store.save();
    setTimeout(() => analyze(g), res !== 'w' ? 3000 : 20000);   // yutganlari ham (🪤 raqib xatolari — tuzoqlar uchun)   // yutqazgan/durang — darhol tekshiramiz (yutganlari admin ochganda)
  } catch (e) { console.log('[kkadm]', e.message); }
}
function movesOf(g) {
  const b0 = g.b0.split(',').map(Number), steps = g.steps.map(x => ({ from: { r: x[0] >> 3, c: x[0] & 7 }, to: { r: x[1] >> 3, c: x[1] & 7 } }));
  return fullMoves(b0, g.s0, steps);
}
// King Kong yurishlarini birma-bir tekshirish (har biri ~0.1–0.3 s; server bo'g'ilmasin deb oraliq bilan)
const RUN = new Map();
function analyze(g) {
  if (g.errs) return Promise.resolve(g);
  if (RUN.has(g.id)) return RUN.get(g.id);
  const p = new Promise(done => {
    const fm = movesOf(g), errs = []; let k = 0;
    const step = () => {
      while (k < fm.length && fm[k].s !== g.kk) { const y = fm[k]; try { if (R.moves(y.b, y.s).length > 1) { const c2 = check(y.b, y.s, y.from, y.to); require('./kkrep.js').noteOpp(y.b, y.s, c2 ? c2.loss : 0); } } catch (e) {} k++; }
      if (k >= fm.length) { g.errs = errs; RUN.delete(g.id); try { require('./kkfix.js').onAnalyzed(g, fm.filter(y => y.s === g.kk).length); } catch (e) {} try { store.save(); } catch (e) {} return done(g); }
      const x = fm[k], c = check(x.b, x.s, x.from, x.to);
      if (c && c.loss >= 1) errs.push({ k, loss: c.loss, safe: c.safe, line: c.line, key: x.b.join('') + x.s });
      k++; setTimeout(step, 40);
    };
    step();
  });
  RUN.set(g.id, p); return p;
}

// tahlil taxtasi (board.js) uchun: to'liq yurish → bosqichlar [{from:{r,c}, to:{r,c}, captures:[{r,c}]}]
function hops(x) {
  const out = [], P = x.path || [x.from, x.to];
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], ar = a >> 3, ac = a & 7, br = b >> 3, bc = b & 7, dr = Math.sign(br - ar), dc = Math.sign(bc - ac), cap = [];
    for (let r = ar + dr, c = ac + dc; r !== br; r += dr, c += dc) if ((x.caps || []).includes(r * 8 + c)) cap.push({ r, c });
    out.push({ from: { r: ar, c: ac }, to: { r: br, c: bc }, captures: cap });
  }
  return out;
}
// ---------- HTTP: /api/kkadm (faqat admin)
function fixedCnt(g) { const B = (store.db && store.db.kkBook) || {}; return (g.errs || []).filter(e => B[e.key]).length; }
function handle(req, res, p, h) {
  if (!p.startsWith('/api/kkadm')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  let adm = false; try { adm = require('./kkbook.js').isAdmin(t && t.id); } catch (e) {}
  if (!t || !adm) { h.send(res, 403, { error: 'Faqat admin uchun' }); return true; }
  if (req.method === 'GET') {
    const L = G(), day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10), td = L.filter(g => new Date(g.at + 5 * 3600e3).toISOString().slice(0, 10) === day);
    const games = L.map(g => ({ id: g.id, at: g.at, opp: g.opp, tc: g.tc, res: g.res, n: Math.ceil(g.steps.length / 2), errs: g.errs ? g.errs.length : null, fixed: fixedCnt(g), guard: Object.values(g.src || {}).filter(x => x && x.g).length }));
    let fx = {}; try { fx = require('./kkfix.js').summary(); } catch (e) {}
    h.send(res, 200, { fx, games, today: { n: td.length, w: td.filter(g => g.res === 'w').length, l: td.filter(g => g.res === 'l').length, d: td.filter(g => g.res === 'd').length, e: td.reduce((s, g) => s + (g.errs ? g.errs.length : 0), 0) }, guard: GSTAT });
    return true;
  }
  h.readBody(req, 5000, async body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/kkadm/game') {
      const g = G().find(x => x.id === String(j.id)); if (!g) return h.send(res, 404, { error: 'O‘yin topilmadi' });
      await analyze(g);
      const B = (store.db && store.db.kkBook) || {}, E = {}; (g.errs || []).forEach(e => { E[e.k] = e; });
      const fm = movesOf(g).map((x, k) => {
        const e = E[k], sr = (g.src || {})[k];
        return { b: x.b, s: x.s, from: x.from, to: x.to, t: x.t, st: hops(x), kk: x.s === g.kk, src: sr ? sr.src : null, g: sr && sr.g ? { t: SQ(sr.g.from) + '-' + SQ(sr.g.to), loss: sr.g.loss } : null, err: e ? { loss: e.loss, safe: e.safe, line: e.line } : null, taught: B[x.b.join('') + x.s] ? { from: B[x.b.join('') + x.s].f, to: B[x.b.join('') + x.s].t } : null };
      });
      return h.send(res, 200, { id: g.id, opp: g.opp, tc: g.tc, res: g.res, kk: g.kk, moves: fm });
    }
    try { const r = await require('./kkfix.js').http(p, j, res, h, t.id); if (r !== false) return; } catch (e) { console.log('[kkfix]', e.message); return h.send(res, 500, { error: 'xato' }); }
    if (p === '/api/kkadm/safe') {   // ixtiyoriy pozitsiya uchun xavfsiz yurishlar (doskadan tanlashda)
      if (!Array.isArray(j.board) || j.board.length !== 64) return h.send(res, 400, { error: 'Pozitsiya noto‘g‘ri' });
      const L = rank(j.board.map(Number), j.side > 0 ? 1 : -1) || [];
      return h.send(res, 200, { list: L.slice(0, 12).map(x => ({ from: x.m.from, to: x.m.to, t: mtxt(x.m), v: x.v })) });
    }
    h.send(res, 404, { error: 'Noma’lum' });
  });
  return true;
}
module.exports = { guard, note, record, check, rank, handle, analyze, movesOf, GSTAT };
