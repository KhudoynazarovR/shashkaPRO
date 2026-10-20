// Puzzle Rush: 3 daqiqa, 3 ta xato bilan chiqasiz. Javoblarni server tekshiradi (yechim mijozga yuborilmaydi).
'use strict';
const DUR_MS = 180 * 1000;           // 3 daqiqa
const MAX_ERR = 3;                   // 3 ta xato = tugadi
const REWARD_CAP = 15;               // bitta urinishda maksimal tanga
const PAID_RUNS_PER_DAY = 3;         // kuniga tanga beriladigan urinishlar soni

// ---- qoidalar (puzzles.js bilan bir xil: rus shashkasi, majburiy urish, dama uzoqqa)
const DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ins = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const sideOf = p => (p === 1 || p === 3 ? 'w' : (p === 2 || p === 4 ? 'b' : null));
function copy(b) { const n = b.map(x => x.slice()); n.dead = (b.dead || []).slice(); return n; }
function caps(b, r, c) {
  const p = b[r][c], out = [], me = sideOf(p), dead = b.dead || [];
  const isD = (a, e) => dead.some(x => x[0] === a && x[1] === e);
  for (const d of DIRS) {
    if (p < 3) {
      const mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
      if (ins(lr, lc) && b[mr][mc] && sideOf(b[mr][mc]) !== me && !isD(mr, mc) && !b[lr][lc]) out.push({ f: [r, c], t: [lr, lc], x: [mr, mc] });
    } else {
      let nr = r + d[0], nc = c + d[1];
      while (ins(nr, nc) && !b[nr][nc]) { nr += d[0]; nc += d[1]; }
      if (ins(nr, nc) && sideOf(b[nr][nc]) !== me && !isD(nr, nc)) {
        const er = nr, ec = nc; nr += d[0]; nc += d[1];
        while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc], x: [er, ec] }); nr += d[0]; nc += d[1]; }
      }
    }
  }
  return out;
}
function simple(b, r, c) {
  const p = b[r][c], out = [], me = sideOf(p);
  for (const d of DIRS) {
    if (p > 2) { let nr = r + d[0], nc = c + d[1]; while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc] }); nr += d[0]; nc += d[1]; } }
    else if (d[0] === (me === 'w' ? -1 : 1)) { const tr = r + d[0], tc = c + d[1]; if (ins(tr, tc) && !b[tr][tc]) out.push({ f: [r, c], t: [tr, tc] }); }
  }
  return out;
}
function legal(b, side, forced) {
  let cs = [], ss = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (sideOf(b[r][c]) !== side) continue;
    if (forced && (forced[0] !== r || forced[1] !== c)) continue;
    cs = cs.concat(caps(b, r, c));
    if (!forced) ss = ss.concat(simple(b, r, c));
  }
  return cs.length ? cs : ss;
}
function adv(g, s) {
  const n = copy(g.b); let p = n[s.f[0]][s.f[1]]; const dead = (g.b.dead || []).slice();
  n[s.f[0]][s.f[1]] = 0;
  if (p === 1 && s.t[0] === 0) p = 3;
  if (p === 2 && s.t[0] === 7) p = 4;
  n[s.t[0]][s.t[1]] = p;
  if (s.x) dead.push([s.x[0], s.x[1]]);
  n.dead = dead;
  const more = !!s.x && caps(n, s.t[0], s.t[1]).length > 0;
  if (!more) { dead.forEach(x => { n[x[0]][x[1]] = 0; }); n.dead = []; }
  return { b: n, side: more ? g.side : (g.side === 'w' ? 'b' : 'w'), forced: more ? [s.t[0], s.t[1]] : null };
}
const findStep = (lg, w) => lg.find(s => s.f[0] === w[0] && s.f[1] === w[1] && s.t[0] === w[2] && s.t[1] === w[3]) || null;
const same = (x, y) => x && y && x[0] === y[0] && x[1] === y[1] && x[2] === y[2] && x[3] === y[3];

// ---- masalalar banki: faqat yechimi qoidalarga to'g'ri keladiganlar, osondan qiyinga
let BANK = null, BANK_N = -1;
function linesOf(p) { return (Array.isArray(p.sols) && p.sols.length ? p.sols : [p.sol]).filter(l => Array.isArray(l) && l.length); }
function validLine(p, line) {
  let g = { b: copy(p.board), side: p.side, forced: null };
  for (const w of line) { const st = findStep(legal(g.b, g.side, g.forced), w); if (!st) return false; g = adv(g, st); }
  return true;
}
function bank(store) {
  const arr = store.db.puzzles || [];
  const key = arr.length + ':' + (store.db.pzVer || 0);
  if (BANK && BANK_N === key) return BANK;
  const out = [];
  for (const p of arr) {
    try {
      if (!Array.isArray(p.board) || p.board.length !== 8 || (p.side !== 'w' && p.side !== 'b')) continue;
      const ls = linesOf(p).filter(l => validLine(p, l));
      if (!ls.length) continue;
      const mine = ls[0].length; // yurishlar soni ~ qiyinlik
      out.push({ id: p.id, lv: [1, 2, 3].includes(p.level) ? p.level : 1, len: mine });
    } catch (e) {}
  }
  out.forEach(x => { x.k = x.lv * 100 + Math.min(x.len, 40); });
  BANK = out; BANK_N = key;
  return BANK;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// 5 ta bosqich: har bosqichdan tasodifiy, oson -> qiyin
function makeQueue(store) {
  const b = bank(store).slice().sort((x, y) => x.k - y.k);
  if (!b.length) return [];
  const tiers = 5, q = [];
  for (let t = 0; t < tiers; t++) {
    const part = b.slice(Math.floor(b.length * t / tiers), Math.floor(b.length * (t + 1) / tiers));
    q.push(...shuffle(part.slice()).slice(0, t < 2 ? 8 : 12));
  }
  return q.map(x => x.id);
}

// ---- sessiyalar (xotirada)
const S = new Map(); // uid -> sessiya
const dayKey = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);

function pub(p) { return { id: p.id, no: p.no || 0, title: p.title || 'Masala', side: p.side, level: p.level || 1, board: p.board }; }
function loadNext(store, s) {
  const all = store.db.puzzles || [];
  while (s.q.length) {
    const id = s.q.shift(), p = all.find(x => x.id === id);
    if (!p) continue;
    const ls = linesOf(p).filter(l => validLine(p, l));
    if (!ls.length) continue;
    s.cur = { p, lines: ls, alive: ls.map((_, i) => i), idx: 0, g: { b: copy(p.board), side: p.side, forced: null } };
    s.n++;
    return pub(p);
  }
  s.cur = null;
  return null;
}
function finish(store, s, why) {
  if (s.over) return s.res;
  s.over = true; S.delete(s.uid);
  const u = store.users()[s.uid];
  let gain = 0, best = s.score, rec = false;
  if (u) {
    const d = dayKey();
    u.rush = u.rush || {};
    if (u.rush.day !== d) { u.rush.day = d; u.rush.runs = 0; u.rush.dayBest = 0; }
    u.rush.runs = (u.rush.runs || 0) + 1;
    if (u.rush.runs <= PAID_RUNS_PER_DAY) gain = Math.min(s.score, REWARD_CAP);
    if (gain > 0) u.diamonds = (u.diamonds || 0) + gain;
    if (s.score > (u.rush.best || 0)) { u.rush.best = s.score; rec = s.score > 0; }
    if (s.score > (u.rush.dayBest || 0)) u.rush.dayBest = s.score;
    best = u.rush.best || 0;
    const dt = store.db.rushDay = (store.db.rushDay && store.db.rushDay.d === d) ? store.db.rushDay : { d, c: {} };
    if (s.score > (dt.c[s.uid] || 0)) dt.c[s.uid] = s.score;
    store.save();
  }
  s.res = { over: true, why, score: s.score, errors: s.err, gain, best, record: rec, runsLeft: u ? Math.max(0, PAID_RUNS_PER_DAY - (u.rush.runs || 0)) : 0 };
  return s.res;
}
function left(s) { return Math.max(0, s.end - Date.now()); }

function handle(req, res, p, ctx) {
  const { store, verifyInitData, send, readBody } = ctx;
  const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tg) { send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tg.id);

  if (p === '/api/rush/top' && req.method === 'GET') {
    const us = store.users(), d = dayKey(), dt = store.db.rushDay && store.db.rushDay.d === d ? store.db.rushDay.c : {};
    const all = Object.entries(us).filter(([, v]) => v.rush && v.rush.best > 0).map(([k, v]) => ({ uid: k, name: v.name || 'O‘yinchi', n: v.rush.best })).sort((a, b) => b.n - a.n).slice(0, 20);
    const day = Object.entries(dt).filter(([k, n]) => n > 0 && us[k]).map(([k, n]) => ({ uid: k, name: us[k].name || 'O‘yinchi', n })).sort((a, b) => b.n - a.n).slice(0, 20);
    const u = us[uid] || {}, r = u.rush || {};
    send(res, 200, { all, day, best: r.best || 0, runsLeft: r.day === d ? Math.max(0, PAID_RUNS_PER_DAY - (r.runs || 0)) : PAID_RUNS_PER_DAY, cap: REWARD_CAP, dur: DUR_MS / 1000, maxErr: MAX_ERR });
    return true;
  }
  if (req.method !== 'POST') return false;

  readBody(req, 4000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/rush/start') {
      const old = S.get(uid); if (old) finish(store, old, 'restart');
      const s = { uid, sid: Math.random().toString(36).slice(2, 10), q: makeQueue(store), n: 0, score: 0, err: 0, start: Date.now(), end: Date.now() + DUR_MS, over: false };
      const pz = loadNext(store, s);
      if (!pz) return send(res, 200, { error: 'Masalalar topilmadi' });
      S.set(uid, s);
      return send(res, 200, { sid: s.sid, left: left(s), score: 0, errors: 0, maxErr: MAX_ERR, pz });
    }
    const s = S.get(uid);
    if (!s || s.sid !== j.sid) return send(res, 200, { over: true, why: 'none', score: 0, errors: 0, gain: 0 });
    if (p === '/api/rush/end') return send(res, 200, finish(store, s, left(s) <= 0 ? 'time' : 'quit'));
    if (p === '/api/rush/skip') {
      if (left(s) <= 0) return send(res, 200, finish(store, s, 'time'));
      const c = s.cur, sol = c ? c.lines[c.alive[0]].slice(c.idx) : [];
      s.err++;
      if (s.err >= MAX_ERR) return send(res, 200, Object.assign({ wrong: true, sol }, finish(store, s, 'errors')));
      const pz = loadNext(store, s);
      if (!pz) return send(res, 200, Object.assign({ wrong: true, sol }, finish(store, s, 'empty')));
      return send(res, 200, { wrong: true, sol, score: s.score, errors: s.err, left: left(s), pz });
    }
    if (p === '/api/rush/move') {
      if (left(s) <= 0) return send(res, 200, finish(store, s, 'time'));
      const c = s.cur, w = Array.isArray(j.step) ? j.step.map(Number) : [];
      if (!c || c.g.side !== c.p.side) return send(res, 200, { bad: true });
      const st = findStep(legal(c.g.b, c.g.side, c.g.forced), w);
      if (!st) return send(res, 200, { bad: true });
      const keep = c.alive.filter(i => same(c.lines[i][c.idx], w));
      if (!keep.length) {
        const sol = c.lines[c.alive[0]].slice(c.idx);
        s.err++;
        if (s.err >= MAX_ERR) return send(res, 200, Object.assign({ wrong: true, sol }, finish(store, s, 'errors')));
        const pz = loadNext(store, s);
        if (!pz) return send(res, 200, Object.assign({ wrong: true, sol }, finish(store, s, 'empty')));
        return send(res, 200, { wrong: true, sol, score: s.score, errors: s.err, left: left(s), pz });
      }
      c.alive = keep; c.g = adv(c.g, st); c.idx++;
      const opp = [];
      const done = () => c.alive.some(i => c.lines[i].length === c.idx);
      while (!done() && c.g.side !== c.p.side) {
        const cand = c.alive.filter(i => c.lines[i][c.idx]);
        if (!cand.length) break;
        const x = c.lines[cand[Math.floor(Math.random() * cand.length)]][c.idx];
        const os = findStep(legal(c.g.b, c.g.side, c.g.forced), x);
        if (!os) break;
        c.alive = cand.filter(i => same(c.lines[i][c.idx], x));
        c.g = adv(c.g, os); c.idx++; opp.push(x);
      }
      if (done()) {
        s.score++;
        const pz = loadNext(store, s);
        if (!pz) return send(res, 200, Object.assign({ ok: true, solved: true, opp }, finish(store, s, 'empty')));
        return send(res, 200, { ok: true, solved: true, opp, score: s.score, errors: s.err, left: left(s), pz });
      }
      return send(res, 200, { ok: true, opp, score: s.score, errors: s.err, left: left(s) });
    }
    send(res, 404, { error: 'none' });
  });
  return true;
}

module.exports = { handle, _t: { bank, makeQueue, validLine, legal, adv, findStep, same, copy, linesOf, pub } };
