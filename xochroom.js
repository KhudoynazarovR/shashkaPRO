'use strict';
// xochroom.js — Xoch shashka: 4 kishilik onlayn xona (WebSocket, "xc..." xabarlari).
// Qoidalar serverda tekshiriladi. Bo'sh o'rinlarni botlar to'ldiradi.
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const N = 10;
const D = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const FW = [[[1, 1], [1, -1], [-1, 1]], [[1, -1], [1, 1], [-1, -1]], [[-1, -1], [-1, 1], [1, -1]], [[-1, 1], [-1, -1], [1, 1]]];
const CR = [[0, 0], [0, 9], [9, 9], [9, 0]];
const TURN_MS = +process.env.XOCH_TURN_MS || 30000;
const BOT_MS = +process.env.XOCH_BOT_MS || 900;
const BOTN = ['Bot Terminator', 'Bot Monster', 'Bot Legend', 'Bot Pro'];
const ok = (r, c) => r >= 0 && c >= 0 && r < N && c < N;
const promo = (p, r, c) => p == 0 ? (r == 9 || c == 9) : p == 1 ? (r == 9 || c == 0) : p == 2 ? (r == 0 || c == 0) : (r == 0 || c == 9);
function newBoard() {
  const B = Array.from({ length: N }, () => Array(N).fill(null));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if ((r + c) % 2 != 1) continue;
    const p = r < 4 && c < 4 ? 0 : r < 4 && c >= 6 ? 1 : r >= 6 && c >= 6 ? 2 : r >= 6 && c < 4 ? 3 : -1;
    if (p >= 0) B[r][c] = { p, k: false };
  }
  return B;
}
function chain(B, p, r, c, k, path, cap, out) {
  let any = false;
  for (const [dr, dc] of D) {
    let a = r + dr, b = c + dc;
    if (k) while (ok(a, b) && !B[a][b]) { a += dr; b += dc; }
    if (!ok(a, b)) continue;
    const t = B[a][b];
    if (!t || t.p == p || cap.has(a * N + b)) continue;
    const lands = []; let l = a + dr, m = b + dc;
    while (ok(l, m) && !B[l][m]) { lands.push([l, m]); if (!k) break; l += dr; m += dc; }
    if (!lands.length) continue;
    cap.add(a * N + b);
    for (const [x, y] of lands) { any = true; chain(B, p, x, y, k || promo(p, x, y), path.concat([[x, y]]), cap, out); }
    cap.delete(a * N + b);
  }
  if (!any && path.length > 1) out.push({ path, cap: [...cap] });
}
function moves(B, p) {
  const caps = [], q = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = B[r][c]; if (!x || x.p != p) continue;
    B[r][c] = null; chain(B, p, r, c, x.k, [[r, c]], new Set(), caps); B[r][c] = x;
  }
  if (caps.length) return caps;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = B[r][c]; if (!x || x.p != p) continue;
    for (const [dr, dc] of (x.k ? D : FW[p])) {
      let a = r + dr, b = c + dc;
      while (ok(a, b) && !B[a][b]) { q.push({ path: [[r, c], [a, b]], cap: [] }); if (!x.k) break; a += dr; b += dc; }
    }
  }
  return q;
}
function applyMv(B, mv) {
  const [fr, fc] = mv.path[0], [tr, tc] = mv.path[mv.path.length - 1], x = B[fr][fc];
  B[fr][fc] = null; mv.cap.forEach(k => { B[Math.floor(k / N)][k % N] = null; });
  B[tr][tc] = x; if (promo(x.p, tr, tc)) x.k = true;
  return x;
}
const cnt = (B, p) => B.flat().filter(x => x && x.p == p).length;
function pick(B, p, cur) {
  const mx = Math.max(...cur.map(m => m.cap.length));
  let best = null, bs = -1e9;
  for (const m of cur.filter(m => m.cap.length == mx)) {
    const [fr, fc] = m.path[0], [tr, tc] = m.path[m.path.length - 1], pc = B[fr][fc];
    const prog = Math.abs(tr - CR[p][0]) + Math.abs(tc - CR[p][1]) - Math.abs(fr - CR[p][0]) - Math.abs(fc - CR[p][1]);
    const s = (mx ? 0 : prog * 2 + (pc.k ? -1 : 1)) + Math.random() * 3 - (mx ? 0 : (Math.abs(tr - 4.5) + Math.abs(tc - 4.5)) * 0.05);
    if (s > bs) { bs = s; best = m; }
  }
  return best;
}

const rooms = new Map(), byConn = new Map();
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function genCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const b = crypto.randomBytes(6); for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function who(m) {
  const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN);
  if (!t) return null;
  const ph = /^https:\/\/(t\.me|cdn[0-9]*\.telegram-cdn\.org)\//.test(String(t.photo_url || '')) ? String(t.photo_url) : '';
  return { uid: String(t.id), name: String(t.first_name || t.username || 'Oyinchi').slice(0, 20), photo: ph };
}
function view(r, cid) {
  return {
    type: 'xcState', code: r.code, status: r.status, me: r.p.findIndex(x => x && x.cid === cid), host: r.p[r.host] ? r.p[r.host].cid === cid : false,
    board: r.B ? r.B.map(row => row.map(x => x ? { p: x.p, k: x.k } : null)) : null,
    turn: r.turn, alive: r.alive, last: r.last, rank: r.rank || null, tms: r.tms || TURN_MS,
    players: r.p.map(x => x ? { name: x.name, bot: !!x.bot, photo: x.photo || '' } : null),
    left: r.deadline ? Math.max(0, r.deadline - Date.now()) : 0
  };
}
function push(r) { r.p.forEach(x => { if (x && x.ws) send(x.ws, view(r, x.cid)); }); }
function del(r) {
  clearTimeout(r.tmr); clearTimeout(r.gcT); rooms.delete(r.code);
  r.p.forEach(x => { if (x && x.cid) byConn.delete(x.cid); });
}
function gc(r) {
  if (r.p.some(x => x && x.ws)) return;
  clearTimeout(r.gcT);
  r.gcT = setTimeout(() => { if (!r.p.some(x => x && x.ws)) del(r); }, 120000);
}
function adv(r) {
  const B = r.B;
  for (let i = 0; i < 4; i++) {
    r.turn = (r.turn + 1) % 4; if (!r.alive[r.turn]) continue;
    r.cur = moves(B, r.turn); if (r.cur.length) break;
    r.alive[r.turn] = false; r.order.push(r.turn);
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (B[a][b] && B[a][b].p == r.turn) B[a][b] = null;
  }
  const left = r.alive.map((a, i) => a ? i : -1).filter(i => i >= 0);
  if (left.length < 2 || r.quiet >= 80) {
    r.status = 'done'; left.sort((a, b) => cnt(B, b) - cnt(B, a));
    r.rank = left.concat(r.order.slice().reverse()); r.turn = left[0] != null ? left[0] : 0;
    r.gcT = setTimeout(() => del(r), 600000);
  }
}
function play(r, mv) {
  const x = applyMv(r.B, mv);
  r.quiet = (mv.cap.length || !x.k) ? 0 : r.quiet + 1; r.last = mv.path;
  adv(r); push(r); arm(r);
}
function auto(r, miss) {
  if (r.status !== 'play') return;
  const s = r.p[r.turn];
  if (miss && s && !s.bot) { s.miss = (s.miss || 0) + 1; if (s.miss >= 3) { s.bot = true; s.name += ' (bot)'; } }
  play(r, pick(r.B, r.turn, r.cur));
}
function arm(r) {
  clearTimeout(r.tmr); r.deadline = 0;
  if (r.status !== 'play') return;
  const s = r.p[r.turn];
  if (s.bot || !s.ws) { r.tmr = setTimeout(() => auto(r, false), s.bot ? BOT_MS : BOT_MS + 600); return; }
  r.deadline = Date.now() + (r.tms || TURN_MS);
  r.tmr = setTimeout(() => auto(r, true), (r.tms || TURN_MS) + 200);
}
function roomOf(c) { const code = byConn.get(c.id); return code ? rooms.get(code) : null; }
function leave(c, hard) {
  const r = roomOf(c); byConn.delete(c.id);
  if (!r) return;
  const idx = r.p.findIndex(x => x && x.cid === c.id); if (idx < 0) return;
  const s = r.p[idx];
  if (r.status === 'wait') {
    if (idx === r.host) {
      r.p.forEach((x, i) => { if (x && i !== idx && x.ws) send(x.ws, { type: 'xcClosed' }); });
      del(r);
    } else { r.p[idx] = null; push(r); }
    return;
  }
  s.ws = null;
  if (hard && r.status === 'play') { s.bot = true; s.left = true; if (!/\(bot\)$/.test(s.name)) s.name += ' (bot)'; }
  if (r.status === 'play' && r.turn === idx) arm(r);
  push(r); gc(r);
}
function handle(c, m) {
  if (!m || typeof m.type !== 'string' || m.type.slice(0, 2) !== 'xc') return false;
  const ws = c.ws, err = t => send(ws, { type: 'xcError', message: t });
  if (m.type === 'xcCreate') {
    leave(c, true);
    const u = who(m); if (!u) { err('Telegram ichida oching'); return true; }
    let code; do { code = genCode(); } while (rooms.has(code));
    const r = { code, p: [null, null, null, null], B: null, status: 'wait', turn: 0, alive: [true, true, true, true], order: [], quiet: 0, last: null, host: 0, cur: [], tms: [10, 30, 60].includes(+m.turn) ? +m.turn * 1000 : TURN_MS };
    r.p[0] = { uid: u.uid, name: u.name, hname: u.name, photo: u.photo, ws, cid: c.id };
    rooms.set(code, r); byConn.set(c.id, code); push(r); return true;
  }
  if (m.type === 'xcJoin') {
    const code = String(m.code || '').toUpperCase().trim(), r = rooms.get(code);
    const u = who(m); if (!u) { err('Telegram ichida oching'); return true; }
    if (!r) { err('Xona topilmadi'); return true; }
    const ex = r.p.findIndex(x => x && x.uid === u.uid);
    if (roomOf(c) !== r) leave(c, true);
    if (ex >= 0) {
      const s = r.p[ex];
      if (s.left) { err('Siz bu oyindan chiqib ketgansiz'); return true; }
      if (s.ws && s.cid !== c.id) { try { send(s.ws, { type: 'xcClosed' }); } catch (e) {} byConn.delete(s.cid); }
      s.ws = ws; s.cid = c.id; s.bot = false; s.name = s.hname; s.miss = 0;
      byConn.set(c.id, code); clearTimeout(r.gcT); push(r); if (r.status === 'play' && r.turn === ex) arm(r); return true;
    }
    if (r.status !== 'wait') { err('Oyin boshlangan'); return true; }
    const idx = r.p.findIndex(x => !x);
    if (idx < 0) { err('Xona toliq'); return true; }
    r.p[idx] = { uid: u.uid, name: u.name, hname: u.name, photo: u.photo, ws, cid: c.id };
    byConn.set(c.id, code); push(r); return true;
  }
  if (m.type === 'xcLeave') { leave(c, true); return true; }
  const r = roomOf(c);
  if (!r) { err('Xona topilmadi'); return true; }
  const idx = r.p.findIndex(x => x && x.cid === c.id);
  if (m.type === 'xcStart') {
    if (idx !== r.host || r.status !== 'wait') return true;
    for (let i = 0; i < 4; i++) if (!r.p[i]) r.p[i] = { uid: 'bot' + i, name: BOTN[i], hname: BOTN[i], bot: true, ws: null, cid: null };
    r.B = newBoard(); r.turn = 0; r.cur = moves(r.B, 0); r.status = 'play';
    push(r); arm(r); return true;
  }
  if (m.type === 'xcMove') {
    if (r.status !== 'play' || r.turn !== idx) { send(ws, view(r, c.id)); return true; }
    const path = Array.isArray(m.path) ? m.path.map(q => [+q[0], +q[1]]) : [];
    const mv = r.cur.find(x => JSON.stringify(x.path) === JSON.stringify(path));
    if (!mv) { err('Yurish notogri'); send(ws, view(r, c.id)); return true; }
    r.p[idx].miss = 0; play(r, mv); return true;
  }
  if (m.type === 'xcTime') { const t = +m.turn; if (idx === r.host && r.status === 'wait' && [10, 30, 60].includes(t)) { r.tms = t * 1000; push(r); } return true; }
  if (m.type === 'xcChat') {
    const s = r.p[idx]; if (!s || idx < 0) return true;
    const now = Date.now(); if (s.cat && now - s.cat < 700) return true; s.cat = now;
    const e = String(m.e || '').slice(0, 8), t = String(m.t || '').slice(0, 40);
    if (!e && !t) return true;
    r.p.forEach(x => { if (x && x.ws) send(x.ws, { type: 'xcChat', from: idx, e, t }); });
    return true;
  }
  if (m.type === 'xcState') { send(ws, view(r, c.id)); return true; }
  return true;
}
function onClose(c) { leave(c, false); }
module.exports = { handle, onClose, _t: { moves, newBoard } };
