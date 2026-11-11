'use strict';
// duoroom.js — 👥 2 kishilik o'yinlar do'st bilan onlayn (WebSocket, "du..." xabarlari): Gomoku, Go 9×9, Shaxmat, Poddavki.
// Qoidalar duocore.js da (brauzer bilan bir xil kod), har yurish serverda tekshiriladi. Tuzilishi ugroom.js bilan bir xil.
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const D = require('./duocore.js').G;
const TCS = { '0': [0, 0], '1+1': [60, 1], '3+2': [180, 2], '5+3': [300, 3], '10+5': [600, 5] };
const rooms = new Map();     // code -> xona
const byConn = new Map();    // conn id -> code
function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.randomBytes(6); let s = ''; for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function who(m) {
  const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN);
  return t ? { uid: String(t.id), name: String(t.first_name || t.username || 'O‘yinchi').slice(0, 20) } : null;
}
function clocks(r) {   // qolgan vaqt (ms), yurayotgan tomonning soati hozirgacha hisoblanadi
  if (!r.tc || !r.S) return null;
  const c = r.clk.slice(); if (r.status === 'play' && r.runAt) c[r.S.turn - 1] -= Date.now() - r.runAt;
  return c.map(x => Math.max(0, Math.round(x)));
}
function view(r, uid) {
  const S = r.S;
  return {
    type: 'duState', g: r.g, code: r.code, tc: r.tcK, status: r.status,
    st: S ? Object.assign({}, S, { rep: undefined }) : null,
    players: r.p.map(x => ({ name: x.name, side: x.side || 0, on: !!x.ws })),
    me: (r.p.find(x => x.uid === uid) || {}).side || 0,
    clk: clocks(r), draw: r.draw || 0, tour: !!r.onEnd, again: r.again ? Object.keys(r.again).map(Number) : []
  };
}
function push(r) { r.p.forEach(x => send(x.ws, view(r, x.uid))); if (r.watch) for (const ws of r.watch.values()) send(ws, view(r, '')); }
function arm(r) {
  clearTimeout(r.tmr); if (!r.tc || r.status !== 'play') return;
  const s = r.S.turn, left = r.clk[s - 1];
  r.tmr = setTimeout(() => { if (r.status === 'play' && r.S.turn === s) { r.clk[s - 1] = 0; end(r, s === 1 ? 2 : 1, 'time'); } }, Math.max(0, left) + 250);
}
function end(r, res, why) {
  clearTimeout(r.tmr); clearTimeout(r.nsT); r.status = 'over';
  if (r.onEnd && !r.reported) { r.reported = 1; try { r.onEnd(res, { why, plies: r.S ? r.S.ply : 0 }); } catch (e) { console.log('[' + 'mix]', e.message); } }
  if (r.S && !r.S.over) { r.S.over = true; r.S.res = res; r.S.why = why; }
  r.at = Date.now(); r.draw = 0; push(r);
}
function begin(r) {
  if (r.fixed) { r.p[0].side = 1; r.p[1].side = 2; r.fixed = false; r.games = 1; } else {
  const flip = crypto.randomInt(2) === 1;   // ranglar tasodifiy (keyingi o'yinlarda almashadi)
  if (r.games) { r.p.forEach(x => { x.side = x.side === 1 ? 2 : 1; }); } else { r.p[0].side = flip ? 2 : 1; r.p[1].side = flip ? 1 : 2; }
  r.games = (r.games || 0) + 1; }
  r.S = D[r.g].start(); r.status = 'play'; r.draw = 0; r.again = null;
  r.clk = [r.tc * 1000, r.tc * 1000]; r.runAt = Date.now(); r.at = Date.now();
  arm(r);
}
function handle(c, m) {
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('du')) return false;
  if (m.type === 'duCreate') {
    if (!D[m.g]) return send(c.ws, { type: 'duErr', msg: 'Noma’lum o‘yin' }), true;
    const u = who(m); if (!u) return send(c.ws, { type: 'duErr', msg: 'O‘yinni Telegram ichida oching' }), true;
    const tcK = TCS[m.tc] ? String(m.tc) : '0';
    let k = code(); while (rooms.has(k)) k = code();
    const r = { g: m.g, code: k, tcK, tc: TCS[tcK][0], inc: TCS[tcK][1], p: [{ uid: u.uid, name: u.name, ws: c.ws, cid: c.id, offAt: 0 }], status: 'wait', at: Date.now(), S: null };
    rooms.set(k, r); byConn.set(c.id, k); push(r);
    return true;
  }
  const r = rooms.get(String(m.code || '').toUpperCase());
  if (!r) return send(c.ws, { type: 'duErr', msg: 'O‘yin topilmadi yoki tugagan' }), true;
  if (m.type === 'duJoin') {
    const u = who(m); if (!u) return send(c.ws, { type: 'duErr', msg: 'O‘yinni Telegram ichida oching' }), true;
    let p = r.p.find(x => x.uid === u.uid);
    if (!p) {
      if (r.p.length >= 2) { r.watch = r.watch || new Map(); if (r.watch.size < 100) { r.watch.set(c.id, c.ws); byConn.set(c.id, r.code); } send(c.ws, view(r, '')); return true; }   // 👁 tomosha
      p = { uid: u.uid, name: u.name }; r.p.push(p);
    }
    p.ws = c.ws; p.cid = c.id; p.offAt = 0; byConn.set(c.id, r.code);
    if (r.p.length === 2 && r.status === 'wait' && (!r.onEnd || r.p.every(x => x.ws))) begin(r);   // turnirda — ikkalasi ham kirganda
    push(r);
    return true;
  }
  const me = r.p.find(x => x.cid === c.id); if (!me) return true;
  const S = r.S;
  if (m.type === 'duMove') {
    if (r.status !== 'play' || S.turn !== me.side) return true;
    const now = Date.now();
    if (r.tc) { r.clk[me.side - 1] -= now - r.runAt; if (r.clk[me.side - 1] <= 0) { r.clk[me.side - 1] = 0; end(r, me.side === 1 ? 2 : 1, 'time'); return true; } }
    if (!D[r.g].play(S, m.mv || {})) { send(c.ws, view(r, me.uid)); return true; }
    if (r.tc) { r.clk[me.side - 1] += r.inc * 1000; r.runAt = now; }
    r.draw = 0; r.at = now;
    if (S.over) { end(r, S.res, S.why); return true; }
    arm(r); push(r);
    return true;
  }
  if (m.type === 'duResign') { if (r.status === 'play') end(r, me.side === 1 ? 2 : 1, 'resign'); return true; }
  if (m.type === 'duDraw') {   // durang taklifi: ikkinchi tomon ham bossa — durang
    if (r.status !== 'play' || S.ply < 2) return true;
    if (r.draw && r.draw !== me.side) { end(r, 0, 'agree'); return true; }
    r.draw = me.side; push(r); return true;
  }
  if (m.type === 'duAgain') {
    if (r.onEnd) return true;   // turnir o'yini — revansh yo'q   // 🔁 revansh — ikkalasi ham bosganda
    if (r.status !== 'over' || r.p.length !== 2) return true;
    r.again = r.again || {}; r.again[me.side] = 1;
    if (r.again[1] && r.again[2]) begin(r);
    push(r); return true;
  }
  if (m.type === 'duLeave') {
    byConn.delete(c.id); me.ws = null; me.offAt = Date.now();
    if (r.status === 'wait') { if (r.onEnd) { push(r); return true; } clearTimeout(r.tmr); rooms.delete(r.code); return true; }
    if (r.status === 'play') end(r, me.side === 1 ? 2 : 1, 'left'); else push(r);
    return true;
  }
  return true;
}
function onClose(c) {
  const k = byConn.get(c.id); if (!k) return; byConn.delete(c.id);
  const r = rooms.get(k); if (!r) return;
  if (r.watch) r.watch.delete(c.id);
  const p = r.p.find(x => x.cid === c.id); if (p) { p.ws = null; p.offAt = Date.now(); }
  push(r);
}
// uzilganlar (60 s) va eski xonalar
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of rooms) {
    if (r.status === 'play') { const off = r.p.find(x => !x.ws && x.offAt && now - x.offAt > 60e3); if (off) end(r, off.side === 1 ? 2 : 1, 'left'); }
    const on = r.p.some(x => x.ws);
    if ((!on && now - r.at > 30 * 60e3) || now - r.at > 6 * 3600e3) { clearTimeout(r.tmr); rooms.delete(k); }
  }
}, 30e3).unref();
// 🔀 Miks turnir: ikkala o'rin oldindan band (a — birinchi yuradi), natija onEnd(res 1|2|0, {why, plies, noshow, noshowBoth}) bilan qaytadi.
// noshowMs ichida o'yin boshlanmasa: kirgan yutadi, hech kim kirmasa — ikkalasi ham kelmadi.
function createPair(a, b, tcK, onEnd, noshowMs, g) {
  tcK = TCS[tcK] ? String(tcK) : '3+2';
  let k = code(); while (rooms.has(k)) k = code();
  const r = { code: k, tcK, tc: TCS[tcK][0], inc: TCS[tcK][1], p: [{ uid: String(a.uid), name: a.name, ws: null, offAt: 0 }, { uid: String(b.uid), name: b.name, ws: null, offAt: 0 }], status: 'wait', at: Date.now(), S: null, fixed: true, onEnd };
  if (g) r.g = g;
  r.nsT = setTimeout(() => {
    if (r.status !== 'wait') return;
    const on = r.p.map(x => !!x.ws);
    r.status = 'over'; r.at = Date.now();
    if (!r.reported) { r.reported = 1; try { onEnd(on[0] && !on[1] ? 1 : on[1] && !on[0] ? 2 : 0, { why: 'noshow', plies: 0, noshow: true, noshowBoth: !on[0] && !on[1] }); } catch (e) { console.log('[mix]', e.message); } }
    r.S = r.S || null; push(r);
  }, noshowMs || 120000);
  if (r.nsT.unref) r.nsT.unref();
  rooms.set(k, r); return r;
}
module.exports = { handle, onClose, rooms, createPair };
