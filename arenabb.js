'use strict';
// arenabb.js — 🤖⚔️🤖 arena turnirida bot va bot o'rtasidagi haqiqiy o'yin (serverda, xonasiz).
// Har yurish KestoG dvigatelidan (past navbatda — odamlarning o'yinlari birinchi), botning kuchi (botPow) bo'yicha;
// soatlar hisoblanadi (vaqt tugasa — mag'lubiyat), 3 marta takror / durang qoidalari / 200 yarim yurish — durang.
// Tomosha qilish uchun jonli holat: live(roomId) → { board64, moves, clock, turn }.
const R = require('./russian-rules.js');
let K = null; try { K = require('./kestoai.js'); } catch (e) {}
let DR = null; try { DR = require('./draw-rules'); } catch (e) {}
const WHITE = R.WHITE, BLACK = R.BLACK, MAXPLY = 200;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LIVE = new Map();   // roomId -> holat

function to64(b) { const o = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; o.push(p === 'w' ? 1 : p === 'W' ? 2 : p === 'b' ? -1 : p === 'B' ? -2 : 0); } return o; }
function ask(board, side, secs) {
  return new Promise(res => {
    if (!K) return res(null);
    try { K.move({ board: to64(board), side: side === WHITE ? 1 : -1, time: secs, arena: true, tbAlways: secs >= 0.3 }, x => res(x || null)); } catch (e) { res(null); }
  });
}
function match(moves, r) {
  if (!r || r.error) return null;
  const fr = r.from >> 3, fc = r.from & 7, tr = r.to >> 3, tc = r.to & 7;
  const c = moves.filter(m => m.from[0] === fr && m.from[1] === fc && m.to[0] === tr && m.to[1] === tc);
  return c.find(m => (m.captures || []).length === r.jumps) || c[0] || null;
}
// tc: '3+2' → { base ms, inc ms }
function tcMs(tc) { const a = String(tc || '3+2').split('+'); return { base: Math.max(15, (Number(a[0]) || 3) * 60) * 1000, inc: (Number(a[1]) || 0) * 1000 }; }

// o: { roomId, tc, white:{uid,cfg:{secs,blunder}}, black:{...}, alive: () => bool } → Promise<{ winner: 'white'|'black'|null, plies, reason }>
async function play(o) {
  const T = tcMs(o.tc), clock = { white: T.base, black: T.base };
  let board = R.startPosition(), side = WHITE, ply = 0, winner = null, reason = '', done = false;
  const seen = {}, st = { roomId: o.roomId, board64: to64(board), moves: [], clock, turn: 'white', since: Date.now() };
  LIVE.set(o.roomId, st);
  const dst = DR ? DR.createDrawState(board, 'white') : null;
  try {
    while (!done) {
      if (o.alive && !o.alive()) { reason = 'stop'; break; }
      const moves = R.getAllMoves(board, side);
      if (!moves.length) { winner = side === WHITE ? 'black' : 'white'; reason = 'nomoves'; break; }
      const key = typeof R.positionKey === 'function' ? String(R.positionKey(board, side)) : JSON.stringify(board) + side;
      seen[key] = (seen[key] || 0) + 1;
      if (seen[key] >= 3) { reason = 'repeat'; break; }
      if (ply >= MAXPLY) { reason = 'maxply'; break; }
      const me = side === WHITE ? o.white : o.black, col = side === WHITE ? 'white' : 'black', cfg = me.cfg || {};
      // o'ylash vaqti: bot kuchi, lekin soatga sig'adigan (qolgan vaqtning ~1/25 + qo'shimcha)
      const rem = clock[col] / 1000, think = Math.max(0.05, Math.min(cfg.secs || 1, rem / 25 + T.inc / 1000 * 0.7, 3));
      const t0 = Date.now();
      let mv = null;
      if (moves.length === 1) mv = moves[0];
      else if (Math.random() < (cfg.blunder || 0)) mv = moves[Math.floor(Math.random() * moves.length)];
      else {
        for (let i = 0; i < 40 && !mv; i++) {   // dvigatel band bo'lsa (odamlar o'yini) — kutamiz
          const r = await ask(board, side, think);
          if (r && !r.error) { mv = match(moves, r); break; }
          if (!r || (r.error && r.error !== 'busy')) break;   // dvigatel yo'q/tayyor emas — tasodifiy qonuniy yurish (o'yin to'xtab qolmasin)
          await sleep(500);
        }
        if (!mv) mv = moves[Math.floor(Math.random() * moves.length)];
      }
      // tabiiy sur'at: odam o'yiniga yaqin (juda tez bo'lsa botlar ochkoni odamlardan tez yig'adi)
      const pace = Math.max(400, Math.min(4000, (T.base / 1000 / 40 + T.inc / 1000) * 500));
      const spent = Date.now() - t0; if (spent < pace) await sleep(pace - spent);
      clock[col] -= Math.max(pace, Math.min(spent, think * 1000 + 300));   // dvigatel navbatida kutish (odamlar o'yini) botning soatidan ketmaydi if (clock[col] <= 0) { clock[col] = 0; winner = col === 'white' ? 'black' : 'white'; reason = 'time'; break; }
      clock[col] += T.inc;
      const b0 = board; board = R.applyMove(board, mv);
      if (dst) { try { const d = DR.updateDraw(dst, b0, mv, col, board); if (d && d.draw) { ply++; reason = 'draw'; break; } } catch (e) {} }
      side = side === WHITE ? BLACK : WHITE; ply++;
      st.board64 = to64(board); st.turn = side === WHITE ? 'white' : 'black'; st.since = Date.now();
      st.moves.push({ from: { r: mv.from[0], c: mv.from[1] }, to: { r: mv.to[0], c: mv.to[1] }, captures: (mv.captures || []).map(x => ({ r: x[0], c: x[1] })) });
    }
  } catch (e) { console.log('[arenabb]', e.message); reason = 'error'; }
  setTimeout(() => LIVE.delete(o.roomId), 30000).unref();
  st.over = true; st.winner = winner;
  return { winner, plies: ply, reason };
}
function live(roomId) { return LIVE.get(roomId) || null; }
module.exports = { play, live };
