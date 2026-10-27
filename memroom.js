'use strict';
// memroom.js — 🃏 Memori: do'st bilan onlayn o'yin (WebSocket, "mm..." xabarlari).
// Kartalar serverda turadi: mijoz faqat ochilgan kartani ko'radi (aldab bo'lmaydi).
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const SIZES = { '4x6': [4, 6], '6x6': [6, 6] };
const REW = { '4x6': 3, '6x6': 5 };
const TURN_TC = [0, 10, 20];   // har yurishga soniya (0 — vaqtsiz)
const rooms = new Map();       // code -> room
const byConn = new Map();      // conn id -> code

function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const b = crypto.randomBytes(6); for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function who(m) {
  const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN);
  if (!t) return null;
  return { uid: String(t.id), name: String(t.first_name || t.username || 'O‘yinchi').slice(0, 20) };
}
function view(r, uid) {
  const n = r.deck.length;
  const cards = [];
  for (let i = 0; i < n; i++) cards.push(r.done[i] ? { s: r.deck[i], o: r.done[i] } : r.up.includes(i) ? { s: r.deck[i] } : null);
  return {
    type: 'mmState', code: r.code, size: r.size, theme: r.theme, tc: r.tc, cards,
    players: r.p.map(x => ({ uid: x.uid, name: x.name, sc: x.sc, on: !!x.ws })), me: r.p.findIndex(x => x.uid === uid),
    turn: r.turn, left: r.tc && r.deadline ? Math.max(0, r.deadline - Date.now()) : 0, status: r.status, winner: r.winner, quit: r.quit != null ? r.quit : null, gain: r.gain || null
  };
}
function push(r) { r.p.forEach(x => send(x.ws, view(r, x.uid))); }
function arm(r) {
  clearTimeout(r.tmr); r.deadline = 0;
  if (r.status !== 'play' || !r.tc) return;
  r.deadline = Date.now() + r.tc * 1000;
  r.tmr = setTimeout(() => {   // vaqt tugadi — navbat o'tadi
    if (r.status !== 'play') return;
    r.up = []; r.turn = 1 - r.turn; arm(r); push(r);
  }, r.tc * 1000 + 300);
}
function finish(r, quit) {
  r.status = 'over'; clearTimeout(r.tmr);
  const [a, b] = r.p;
  r.winner = quit != null ? 1 - quit : a.sc === b.sc ? -1 : a.sc > b.sc ? 0 : 1; r.quit = quit != null ? quit : null;
  r.gain = [0, 0];
  if (r.winner >= 0) {
    try {
      const st = require('./store.js'), u = st.users()[r.p[r.winner].uid];
      const day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
      if (u && r.p[0].uid !== r.p[1].uid) {
        u.mem = u.mem || {}; if (u.mem.day !== day) { u.mem.day = day; u.mem.coins = 0; }
        const g = Math.max(0, Math.min(REW[r.size] * 2, 60 - (u.mem.coins || 0)));
        u.mem.coins = (u.mem.coins || 0) + g; u.diamonds = (u.diamonds || 0) + g; r.gain[r.winner] = g;
        u.mem.fw = (u.mem.fw || 0) + 1; st.save();
      }
    } catch (e) { console.log('[memori]', e.message); }
  }
  push(r);
}
function deal(r) {
  const [w, h] = SIZES[r.size], pairs = w * h / 2;
  const syms = shuffle(r.symbols.slice()).slice(0, pairs);
  r.deck = shuffle(syms.concat(syms)); r.done = {}; r.up = []; r.busy = false;
  r.p.forEach(x => { x.sc = 0; });
  r.turn = crypto.randomInt(2); r.status = 'play'; r.winner = null; r.gain = null; r.quit = null;
  arm(r);
}

function handle(c, m) {
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('mm')) return false;
  if (m.type === 'mmCreate') {
    const u = who(m); if (!u) return send(c.ws, { type: 'mmErr', msg: 'Telegram orqali kiring' }), true;
    const size = SIZES[m.size] ? m.size : '4x6', tc = TURN_TC.includes(+m.tc) ? +m.tc : 0;
    const symbols = Array.isArray(m.symbols) ? m.symbols.filter(s => typeof s === 'string' && s.length <= 8).slice(0, 40) : [];
    if (symbols.length < SIZES[size][0] * SIZES[size][1] / 2) return send(c.ws, { type: 'mmErr', msg: 'Rasmlar yetarli emas' }), true;
    let k = code(); while (rooms.has(k)) k = code();
    const r = { code: k, size, tc, theme: String(m.theme || ''), symbols, p: [{ uid: u.uid, name: u.name, ws: c.ws, cid: c.id, sc: 0 }], status: 'wait', at: Date.now(), deck: [], done: {}, up: [] };
    rooms.set(k, r); byConn.set(c.id, k);
    send(c.ws, view(r, u.uid));
    return true;
  }
  const r = rooms.get(String(m.code || '').toUpperCase());
  if (!r) return send(c.ws, { type: 'mmErr', msg: 'O‘yin topilmadi yoki tugagan' }), true;
  if (m.type === 'mmJoin') {
    const u = who(m); if (!u) return send(c.ws, { type: 'mmErr', msg: 'Telegram orqali kiring' }), true;
    let p = r.p.find(x => x.uid === u.uid);
    if (!p) {
      if (r.p.length >= 2) return send(c.ws, { type: 'mmErr', msg: 'Bu o‘yinda allaqachon 2 kishi bor' }), true;
      p = { uid: u.uid, name: u.name, sc: 0 }; r.p.push(p);
    }
    p.ws = c.ws; p.cid = c.id; p.offAt = 0; byConn.set(c.id, r.code);
    if (r.p.length === 2 && r.status === 'wait') deal(r);
    push(r);
    return true;
  }
  const me = r.p.findIndex(x => x.cid === c.id);
  if (me < 0) return true;
  if (m.type === 'mmFlip') {
    const i = Math.floor(+m.i);
    if (r.status !== 'play' || r.turn !== me || r.busy || !(i >= 0 && i < r.deck.length) || r.done[i] || r.up.includes(i) || r.up.length >= 2) return true;
    r.up.push(i);
    if (r.up.length === 2) {
      const [a, b] = r.up; r.busy = true;
      if (r.deck[a] === r.deck[b]) {
        r.done[a] = r.done[b] = me + 1; r.p[me].sc++; r.up = []; r.busy = false;
        if (Object.keys(r.done).length >= r.deck.length) return finish(r), true;
        arm(r); push(r);   // topdi — yana yuradi
      } else {
        clearTimeout(r.tmr); push(r);
        setTimeout(() => { if (r.status !== 'play') return; r.up = []; r.busy = false; r.turn = 1 - r.turn; arm(r); push(r); }, 1100);
      }
      return true;
    }
    push(r);
    return true;
  }
  if (m.type === 'mmAgain') {   // qayta o'ynash (ikkalasi ham bosganda)
    if (r.status !== 'over') return true;
    r.again = r.again || {}; r.again[me] = 1;
    if (r.again[0] && r.again[1]) { r.again = {}; deal(r); }
    push(r); r.p.forEach((x, j) => { if (r.again && r.again[1 - j]) send(x.ws, { type: 'mmAgainAsk' }); });
    return true;
  }
  if (m.type === 'mmLeave') {
    r.p[me].ws = null; byConn.delete(c.id);
    if (r.status === 'play') finish(r, me);
    push(r);
    return true;
  }
  return true;
}
function onClose(c) {
  const k = byConn.get(c.id); if (!k) return; byConn.delete(c.id);
  const r = rooms.get(k); if (!r) return;
  const p = r.p.find(x => x.cid === c.id); if (p) { p.ws = null; p.offAt = Date.now(); }
  push(r);
}
// eski o'yinlarni tozalash
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of rooms) {
    const on = r.p.some(x => x.ws);
    if (r.status === 'play') { const off = r.p.findIndex(x => !x.ws && x.offAt && now - x.offAt > 60e3); if (off >= 0) finish(r, off); }
    if ((!on && now - r.at > 10 * 60e3) || now - r.at > 6 * 3600e3) { clearTimeout(r.tmr); rooms.delete(k); }
    else if (on) r.at = Math.max(r.at, now - 9 * 60e3);
  }
}, 60e3).unref();
module.exports = { handle, onClose };
