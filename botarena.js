'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./russian-rules.js');
const K = require('./kestoai.js');
let store = null; try { store = require('./store.js'); } catch (e) {}
let IDF = null; try { IDF = require('./idf780.js'); } catch (e) {}

const WHITE = R.WHITE, BLACK = R.BLACK;
const USE_IDF = false;
const MAXPLY = 300, ELO_K = 24, BOOT_DELAY = 60000;
const LOCAL = { botElo: {}, botMem: {}, arenaLog: [] };
let dirty = false, lastWatch = 0, cur = null, FAST = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const watched = () => Date.now() - lastWatch < 25000;
const rnd = n => Math.floor(Math.random() * n);

function D() {
  const d = store && store.db;
  if (!d || typeof d !== 'object') return LOCAL;
  if (!d.botElo) d.botElo = {};
  if (!d.botMem) d.botMem = {};
  if (!Array.isArray(d.arenaLog)) d.arenaLog = [];
  return d;
}
function stat(uid) { const d = D(); return d.botElo[uid] || (d.botElo[uid] = { elo: 1000, w: 0, l: 0, dr: 0 }); }

function loadBots() {
  let list = [];
  try {
    const src = fs.readFileSync(path.join(__dirname, 'lobby.js'), 'utf8');
    const re = /\{\s*uid:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)+)',\s*secs:\s*([\d.]+),\s*blunder:\s*([\d.]+)\s*\}/g;
    let m;
    while ((m = re.exec(src))) { if (!list.some(x => x.uid === m[1])) list.push({ uid: m[1], name: m[2], secs: +m[3], blunder: +m[4] }); }
  } catch (e) {}
  if (list.length < 2) list = [{ uid: 'bot_easy', name: 'Yengil', secs: 0.05, blunder: 0.35 }, { uid: 'bot', name: 'ShashkaBot', secs: 1.2, blunder: 0 }];
  return list;
}
const BOTS = loadBots();

function sq(p) { return 'abcdefgh'[p[1]] + (8 - p[0]); }
function mstr(m) { const c = (m.captures || []).length; return sq(m.from) + '-' + sq(m.to) + (c ? 'x' + c : ''); }
function to64(b) {
  const o = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; o.push(p === 'w' ? 1 : p === 'W' ? 2 : p === 'b' ? -1 : p === 'B' ? -2 : 0); }
  return o;
}
function fromIDF(p) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let q = 0; q < 32; q++) {
    const ch = p.board.charAt(q); if (!ch || ch === '.') continue;
    const r = q >> 2, kk = q & 3, c = (r % 2 === 0) ? 2 * kk + 1 : 2 * kk;
    b[r][c] = ch;
  }
  return { board: b, side: String(p.side).toLowerCase() === 'w' ? WHITE : BLACK, id: p.id };
}
function pickStart() {
  for (let t = 0; t < 6; t++) {
    if (USE_IDF && IDF && IDF.length && Math.random() < 0.7) {
      const s = fromIDF(IDF[rnd(IDF.length)]);
      if (R.getAllMoves(s.board, s.side).length) return s;
    }
  }
  return { board: R.startPosition(), side: WHITE, id: 'std' };
}

function memGet(uid, key) { const m = D().botMem[uid]; return (m && m.k && m.k[key]) || null; }
function memAdd(uid, key, mv) {
  const d = D(); const m = d.botMem[uid] || (d.botMem[uid] = { k: {}, o: [] });
  if (!m.k[key]) { m.k[key] = []; m.o.push(key); while (m.o.length > 200) delete m.k[m.o.shift()]; }
  if (m.k[key].indexOf(mv) < 0) m.k[key].push(mv);
  dirty = true;
}
function strength(bot) {
  const e = stat(bot.uid).elo;
  return { secs: clamp(bot.secs * 0.5 + (e - 1000) / 1000, 0.05, 6), blunder: clamp(bot.blunder - (e - 1000) / 1500, 0, 0.6) };
}

async function askEngine(board, side, secs) {
  for (let i = 0; i < 6; i++) {
    const r = await new Promise(res => {
      try { K.move({ board: to64(board), side: side === WHITE ? 1 : -1, time: secs }, x => res(x || { error: 'x' })); }
      catch (e) { res({ error: 'throw' }); }
    });
    if (r && !r.error) return r;
    if (r && (r.error === 'busy' || r.error === 'notready')) { await sleep(700); continue; }
    return r;
  }
  return { error: 'retry' };
}
function matchMove(moves, r) {
  if (!r || r.error) return null;
  const fr = r.from >> 3, fc = r.from & 7, tr = r.to >> 3, tc = r.to & 7;
  const c = moves.filter(m => m.from[0] === fr && m.from[1] === fc && m.to[0] === tr && m.to[1] === tc);
  if (!c.length) return null;
  return c.find(m => (m.captures || []).length === r.jumps) || c[0];
}
async function choose(bot, board, side, moves, key) {
  const sg = strength(bot);
  let pick = null;
  if (moves.length === 1) pick = moves[0];
  else if (Math.random() < sg.blunder) pick = moves[rnd(moves.length)];
  else pick = matchMove(moves, await askEngine(board, side, sg.secs));
  if (!pick) pick = moves[rnd(moves.length)];
  const bad = memGet(bot.uid, key);
  if (bad && moves.length > 1 && bad.indexOf(mstr(pick)) >= 0) {
    const alt = moves.filter(m => bad.indexOf(mstr(m)) < 0);
    if (alt.length) pick = alt[rnd(alt.length)];
  }
  return pick;
}

function finish(white, black, result, hist, ply) {
  const d = D(), sw = stat(white.uid), sb = stat(black.uid);
  const s = result === WHITE ? 1 : result === BLACK ? 0 : 0.5;
  const ew = 1 / (1 + Math.pow(10, (sb.elo - sw.elo) / 400));
  sw.elo = Math.max(600, Math.round(sw.elo + ELO_K * (s - ew)));
  sb.elo = Math.max(600, Math.round(sb.elo + ELO_K * (ew - s)));
  if (s === 1) { sw.w++; sb.l++; } else if (s === 0) { sb.w++; sw.l++; } else { sw.dr++; sb.dr++; }
  if (result !== 'draw') {
    const ls = result === WHITE ? BLACK : WHITE;
    hist[ls].slice(-8).forEach(h => memAdd(h.uid, h.key, h.mv));
  }
  d.arenaLog.unshift({ w: white.name, b: black.name, r: s === 1 ? '1-0' : s === 0 ? '0-1' : '1/2', n: ply, t: Date.now() });
  if (d.arenaLog.length > 30) d.arenaLog.length = 30;
  dirty = true;
  cur.over = true; cur.result = result; cur.white.elo = sw.elo; cur.black.elo = sb.elo;
}

async function playGame(a, b) {
  const white = Math.random() < 0.5 ? a : b, black = white === a ? b : a;
  const st = pickStart();
  let board = st.board, side = st.side, ply = 0, result = null;
  const seen = {}, hist = { white: [], black: [] };
  cur = { id: Date.now(), start: st.id, white: { uid: white.uid, name: white.name, elo: stat(white.uid).elo }, black: { uid: black.uid, name: black.name, elo: stat(black.uid).elo }, board: to64(board), moves: [], ply: 0, turn: side, over: false, result: null };
  while (!result) {
    const moves = R.getAllMoves(board, side);
    if (!moves.length) { result = side === WHITE ? BLACK : WHITE; break; }
    const key = String(R.positionKey(board, side));
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] >= 3 || ply >= MAXPLY) { result = 'draw'; break; }
    while (!FAST && K.load && K.load() > 0) await sleep(1000);
    const bot = side === WHITE ? white : black;
    const t0 = Date.now();
    const mv = await choose(bot, board, side, moves, key);
    const el = Date.now() - t0;
    hist[side].push({ key: key, mv: mstr(mv), uid: bot.uid });
    board = R.applyMove(board, mv);
    side = side === WHITE ? BLACK : WHITE;
    ply++;
    cur.board = to64(board); cur.moves.push(mstr(mv)); if (cur.moves.length > 14) cur.moves.shift();
    cur.ply = ply; cur.turn = side;
    if (!FAST) await sleep(watched() ? 1400 : Math.max(150, el * 2));
  }
  finish(white, black, result, hist, ply);
  return result;
}

function pickPair() {
  const a = BOTS[rnd(BOTS.length)];
  const da = stat(a.uid).elo;
  const rest = BOTS.filter(x => x.uid !== a.uid).sort((x, y) => Math.abs(stat(x.uid).elo - da) - Math.abs(stat(y.uid).elo - da));
  return [a, rest[Math.min(rest.length - 1, Math.random() < 0.7 ? 0 : 1)]];
}
const enabled = () => process.env.ARENA !== '0' && !D().arenaOff;

async function loop() {
  for (;;) {
    try {
      if (!enabled()) { await sleep(5000); continue; }
      const probe = await new Promise(res => K.move({ board: to64(R.startPosition()), side: 1, time: 0.05 }, res));
      if (probe && probe.error === 'notready') { await sleep(10000); continue; }
      const p = pickPair();
      await playGame(p[0], p[1]);
    } catch (e) { console.log('[arena] xato:', e && e.message); await sleep(5000); }
    await sleep(watched() ? 4000 : 400);
  }
}

function state(isAdmin) {
  lastWatch = Date.now();
  return {
    enabled: enabled(), admin: !!isAdmin, game: cur,
    bots: BOTS.map(b => { const s = stat(b.uid); return { uid: b.uid, name: b.name, elo: s.elo, w: s.w, l: s.l, dr: s.dr }; }).sort((x, y) => y.elo - x.elo),
    log: D().arenaLog.slice(0, 10)
  };
}
function control(j) { if (j && typeof j.on === 'boolean') { D().arenaOff = !j.on; dirty = true; } }
async function test() {
  FAST = true; await sleep(2500);
  const p = pickPair(), t = Date.now();
  const r = await playGame(p[0], p[1]);
  console.log('TEST:', p[0].name, 'vs', p[1].name, '=>', r, '| yurishlar:', cur.ply, '| vaqt:', Date.now() - t, 'ms');
  console.log(JSON.stringify(D().botElo));
}

setInterval(function () {
  if (dirty && store && typeof store.save === 'function') { try { store.save(); dirty = false; } catch (e) {} }
}, 30000).unref();
if (process.env.ARENA !== '0') setTimeout(loop, BOOT_DELAY);

module.exports = { state, control, test, bots: () => BOTS };
