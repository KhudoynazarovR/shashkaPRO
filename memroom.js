'use strict';
// memroom.js — 🧠 Xotira: do'st bilan onlayn o'yin (WebSocket, "mm..." xabarlari).
// Kartalar serverda turadi: mijoz faqat ochilgan kartani ko'radi (aldab bo'lmaydi). Qoidalar — memcore.js.
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const C = require('./memcore.js');
const SIZES = { '4x6': [4, 6], '6x6': [6, 6] };
const REW = { '4x6': 3, '6x6': 5 };
const TCS = [0, 10, 20, -120];   // >0 — har yurishga soniya, 0 — vaqtsiz, -120 — ⚡ tezkor: butun o'yinga 2 daqiqa
const rooms = new Map();       // code -> room
const byConn = new Map();      // conn id -> code
const R = () => crypto.randomInt(1e9) / 1e9;

const ANIMALS = Array.from('🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦆🦉🐴🦄🐝🦋🐢🐍🐙🦀🐬🐳🦒🐘');
function hook(r) { if (r.inline || r.gt) { try { require('./gcard.js').mmTouch(r); } catch (e) {} } }
function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const b = crypto.randomBytes(6); for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function who(m) {
  const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN);
  if (!t) return null;
  return { uid: String(t.id), name: String(t.first_name || t.username || 'O‘yinchi').slice(0, 20) };
}
function view(r, uid) {
  const S = r.S, cards = [];
  if (S) for (let i = 0; i < S.deck.length; i++) cards.push(S.done[i] ? { s: S.deck[i], o: S.done[i] } : S.up.includes(i) ? { s: S.deck[i] } : null);
  const now = Date.now();
  return {
    type: 'mmState', code: r.code, size: r.size, theme: r.theme, tc: r.tc, rules: r.rules, cards,
    players: r.p.map((x, j) => ({ uid: x.uid, name: x.name, sc: S ? S.sc[j] : 0, on: !!x.ws })), me: r.p.findIndex(x => x.uid === uid),
    turn: S ? S.turn : 0, left: r.tc > 0 && r.deadline ? Math.max(0, r.deadline - now) : 0, blitz: r.tc < 0 && r.blitzEnd ? Math.max(0, r.blitzEnd - now) : 0,
    canSit: !!(r.inline && r.p.length === 1 && r.status === 'wait'), host: r.p[0] ? r.p[0].name : '',
    status: r.status, winner: r.winner, quit: r.quit != null ? r.quit : null, gain: r.gain || null, ev: r.ev || null
  };
}
function push(r) {
  hook(r);
  r.p.forEach(x => send(x.ws, view(r, x.uid)));
  if (r.watch && r.watch.size) { const v = Object.assign(view(r, ''), { watch: true, viewers: r.watch.size }); for (const [, ws] of r.watch) send(ws, v); }
  r.ev = null;
}
const watching = new Map();   // conn id -> code (tomoshabinlar)
function arm(r) {
  clearTimeout(r.tmr); r.deadline = 0;
  if (r.status !== 'play' || r.tc <= 0) return;
  r.deadline = Date.now() + r.tc * 1000;
  r.tmr = setTimeout(() => {   // vaqt tugadi — navbat o'tadi
    if (r.status !== 'play' || r.busy) return;
    C.timeout(r.S); r.ev = { t: 'timeout' }; arm(r); push(r);
  }, r.tc * 1000 + 300);
}
function finish(r, quit) {
  r.status = 'over'; clearTimeout(r.tmr); clearTimeout(r.btmr);
  r.winner = quit != null ? 1 - quit : C.winner(r.S); r.quit = quit != null ? quit : null;
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
    } catch (e) { console.log('[xotira]', e.message); }
  }
  try { require('./grp.js').mmFinished(r); } catch (e) { console.log('[grp]', e.message); }
  push(r);
}
function deal(r) {
  const [w, h] = SIZES[r.size];
  r.S = C.newGame({ pairs: w * h / 2, symbols: r.symbols, rules: r.rules, rnd: R });
  r.busy = false; r.status = 'play'; r.winner = null; r.gain = null; r.quit = null;
  clearTimeout(r.btmr); r.blitzEnd = 0;
  if (r.tc < 0) { r.blitzEnd = Date.now() + (-r.tc) * 1000; r.btmr = setTimeout(() => { if (r.status === 'play') finish(r); }, -r.tc * 1000 + 200); }
  arm(r);
}

let CL = null;   // server.js dagi ulanishlar (o'yin zalidagilarni topish uchun)
function lobbyConns(uid) { return CL ? [...CL.values()].filter(x => x && x.lb && !x.isBot && String(x.lb.uid) === String(uid)) : []; }
function invGone(r, except) {   // taklif qilinganlarga: taklif endi amal qilmaydi
  if (!r.inv) return;
  for (const uid of Object.keys(r.inv)) if (uid !== except) lobbyConns(uid).forEach(x => send(x.ws, { type: 'mmInviteGone', code: r.code }));
  r.inv = {};
}
function handle(c, m, clients) {
  if (clients) CL = clients;
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('mm')) return false;
  if (m.type === 'mmPlayers') {   // o'yin zalidagi onlayn o'yinchilar (taklif uchun)
    const u = who(m), seen = new Set(), list = [], inMem = new Set();
    for (const r of rooms.values()) if (r.status === 'play') r.p.forEach(x => { if (x.ws) inMem.add(x.uid); });
    if (CL) for (const x of CL.values()) {
      if (!x || !x.lb || x.isBot || x.hidden) continue;
      const id = String(x.lb.uid); if (seen.has(id) || (u && id === u.uid)) continue; seen.add(id);
      list.push({ uid: id, name: String(x.lb.name || 'O‘yinchi').slice(0, 24), busy: !!x.lb.inRoom || inMem.has(id) });
    }
    send(c.ws, { type: 'mmPlayers', list: list.slice(0, 100) });
    return true;
  }
  if (m.type === 'mmLive') {   // 📺 jonli efir: hozir ketayotgan o'yinlar
    const list = [];
    for (const r of rooms.values()) if (r.status === 'play' && r.p.length === 2 && r.S) list.push({ code: r.code, size: r.size, a: r.p[0].name, b: r.p[1].name, sa: r.S.sc[0], sb: r.S.sc[1], v: r.watch ? r.watch.size : 0 });
    send(c.ws, { type: 'mmLive', list: list.slice(0, 30) });
    return true;
  }
  if (m.type === 'mmCreate') {
    const u = who(m); if (!u) return send(c.ws, { type: 'mmErr', msg: 'Telegram orqali kiring' }), true;
    const size = SIZES[m.size] ? m.size : '4x6', tc = TCS.includes(+m.tc) ? +m.tc : 0;
    const symbols = Array.isArray(m.symbols) ? m.symbols.filter(s => typeof s === 'string' && s.length <= 8).slice(0, 40) : [];
    if (symbols.length < SIZES[size][0] * SIZES[size][1] / 2) return send(c.ws, { type: 'mmErr', msg: 'Rasmlar yetarli emas' }), true;
    const ru = m.rules || {}, rules = { streak: !!ru.streak, shuffle: !!ru.shuffle, black: !!ru.black };
    let k = code(); while (rooms.has(k)) k = code();
    const r = { code: k, size, tc, rules, theme: String(m.theme || ''), symbols, p: [{ uid: u.uid, name: u.name, ws: c.ws, cid: c.id }], status: 'wait', at: Date.now(), S: null };
    rooms.set(k, r); byConn.set(c.id, k);
    send(c.ws, view(r, u.uid));
    return true;
  }
  const r = rooms.get(String(m.code || '').toUpperCase());
  if (!r) return send(c.ws, { type: 'mmErr', msg: 'O‘yin topilmadi yoki tugagan' }), true;
  if (m.type === 'mmJoin') {
    const u = who(m); if (!u) return send(c.ws, { type: 'mmErr', msg: 'Telegram orqali kiring' }), true;
    let p = r.p.find(x => x.uid === u.uid);
    if (!p && r.inline && r.p.length < 2) {   // guruh kartasi: ochgan odam avval tomoshabin, "Qo'shilish" bilan raqib bo'ladi
      r.watch = r.watch || new Map(); r.watch.set(c.id, c.ws); watching.set(c.id, r.code); push(r);
      return true;
    }
    if (!p && (r.inline || r.gt) && r.p.length >= 2) { r.watch = r.watch || new Map(); r.watch.set(c.id, c.ws); watching.set(c.id, r.code); push(r); return true; }
    if (!p) {
      if (r.p.length >= 2) return send(c.ws, { type: 'mmErr', msg: r.inv && r.inv[u.uid] ? 'Kechikdingiz — boshqa o‘yinchi birinchi qabul qildi' : 'Bu o‘yinda allaqachon 2 kishi bor' }), true;
      p = { uid: u.uid, name: u.name }; r.p.push(p);
      invGone(r, u.uid);
    }
    p.ws = c.ws; p.cid = c.id; p.offAt = 0; byConn.set(c.id, r.code);
    if (r.p.length === 2 && r.status === 'wait' && (!(r.inline || r.gt) || r.p.every(x => x.ws))) deal(r);
    push(r);
    return true;
  }
  if (m.type === 'mmSit') {   // guruh kartasi: tomoshabin raqib bo'ladi
    const u = who(m); if (!u || !r.inline || r.p.length !== 1 || r.status !== 'wait' || r.p[0].uid === u.uid) return true;
    if (r.watch) r.watch.delete(c.id); watching.delete(c.id);
    r.p.push({ uid: u.uid, name: u.name, ws: c.ws, cid: c.id, offAt: 0 }); byConn.set(c.id, r.code);
    if (r.p[0].ws) deal(r);
    push(r);
    return true;
  }
  if (m.type === 'mmWatch') {
    if (r.p.some(x => x.cid === c.id)) return true;
    const old = watching.get(c.id); if (old && rooms.get(old) && rooms.get(old).watch) rooms.get(old).watch.delete(c.id);
    r.watch = r.watch || new Map(); if (r.watch.size >= 200) return send(c.ws, { type: 'mmErr', msg: 'Tomoshabinlar juda ko‘p' }), true;
    r.watch.set(c.id, c.ws); watching.set(c.id, r.code); push(r);
    return true;
  }
  if (m.type === 'mmUnwatch') { if (r.watch) r.watch.delete(c.id); watching.delete(c.id); return true; }
  if (m.type === 'mmDecline') {
    const u = who(m); if (u && r.status === 'wait' && r.p[0]) send(r.p[0].ws, { type: 'mmDeclined', name: u.name });
    return true;
  }
  const me = r.p.findIndex(x => x.cid === c.id);
  if (me < 0) return true;
  if (m.type === 'mmFlip') {
    const S = r.S;
    if (r.status !== 'play' || !S || S.turn !== me || r.busy) return true;
    const res = C.flip(S, Math.floor(+m.i));
    if (!res) return true;
    if (res.match === true) {
      r.ev = res.ev.length ? { t: res.ev.join(','), by: me } : null;
      if (S.over) return finish(r), true;
      arm(r); push(r);   // topdi — yana yuradi
    } else if (res.match === false) {
      r.busy = true; clearTimeout(r.tmr); push(r);
      setTimeout(() => {
        if (r.status !== 'play') return;
        const e = C.endTurn(S); r.busy = false;
        if (e.shuffled) r.ev = { t: 'shuffle', at: e.shuffled };
        arm(r); push(r);
      }, 1100);
    } else push(r);
    return true;
  }
  if (m.type === 'mmAgain') {   // qayta o'ynash (ikkalasi ham bosganda)
    if (r.status !== 'over') return true;
    r.again = r.again || {}; r.again[me] = 1;
    if (r.again[0] && r.again[1]) { r.again = {}; deal(r); push(r); return true; }
    const o = r.p[1 - me]; if (o) send(o.ws, { type: 'mmAgainAsk' });
    return true;
  }
  if (m.type === 'mmInvite') {   // zaldagi o'yinchiga taklif (kodsiz)
    if (r.status !== 'wait' || me !== 0) return true;
    const to = String(m.toUid || ''), cs = lobbyConns(to);
    if (!cs.length) return send(c.ws, { type: 'mmInviteRes', toUid: to, ok: false }), true;
    r.inv = r.inv || {}; if (r.inv[to] && Date.now() - r.inv[to] < 15e3) return true; r.inv[to] = Date.now();
    cs.forEach(x => send(x.ws, { type: 'mmInviteIn', code: r.code, fromName: r.p[0].name, size: r.size, tc: r.tc }));
    send(c.ws, { type: 'mmInviteRes', toUid: to, ok: true });
    return true;
  }
  if (m.type === 'mmInviteAll') {   // 🎲 tasodifiy raqib: zaldagi hammaga so'rov, kim birinchi qabul qilsa
    if (r.status !== 'wait' || me !== 0) return true;
    r.inv = r.inv || {}; const seen = new Set(); let n = 0;
    if (CL) for (const x of CL.values()) {
      if (!x || !x.lb || x.isBot || x.hidden || x.lb.inRoom) continue;
      const id = String(x.lb.uid); if (id === r.p[0].uid) continue;
      send(x.ws, { type: 'mmInviteIn', code: r.code, fromName: r.p[0].name, size: r.size, tc: r.tc, all: true });
      if (!seen.has(id)) { seen.add(id); r.inv[id] = Date.now(); n++; }
    }
    send(c.ws, { type: 'mmInviteAllRes', n });
    return true;
  }
  if (m.type === 'mmLeave') {
    if (r.status === 'wait' && me === 0) { invGone(r); byConn.delete(c.id); rooms.delete(r.code); return true; }   // bekor qilindi
    r.p[me].ws = null; byConn.delete(c.id);
    if (r.status === 'play') finish(r, me); else push(r);
    return true;
  }
  return true;
}
function onClose(c) {
  const wk = watching.get(c.id); if (wk) { watching.delete(c.id); const wr = rooms.get(wk); if (wr && wr.watch) wr.watch.delete(c.id); }
  const k = byConn.get(c.id); if (!k) return; byConn.delete(c.id);
  const r = rooms.get(k); if (!r) return;
  const p = r.p.find(x => x.cid === c.id); if (p) { p.ws = null; p.offAt = Date.now(); }
  push(r);
}
// uzilganlar va eski o'yinlar
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of rooms) {
    const on = r.p.some(x => x.ws);
    if (r.status === 'play') { const off = r.p.findIndex(x => !x.ws && x.offAt && now - x.offAt > 60e3); if (off >= 0) finish(r, off); }
    if ((!on && now - r.at > ((r.inline || r.gt) ? 90 : 10) * 60e3) || now - r.at > 6 * 3600e3) { clearTimeout(r.tmr); clearTimeout(r.btmr); rooms.delete(k); }
    else if (on) r.at = Math.max(r.at, now - 9 * 60e3);
  }
}, 30e3).unref();
function newRoom(o) {
  let k = code(); while (rooms.has(k)) k = code();
  const size = SIZES[o.size] ? o.size : '4x6', tc = TCS.includes(+o.tc) ? +o.tc : 0;
  const r = { code: k, size, tc, rules: { streak: false, shuffle: false, black: false }, theme: 'animals', symbols: ANIMALS, p: o.p, status: 'wait', at: Date.now(), S: null };
  rooms.set(k, r); return r;
}
// guruh kartasi (inline): chaqiruvchi o'rni band
function createInline(uid, name, size, tc) { const r = newRoom({ size, tc, p: [{ uid: String(uid), name: String(name || 'O‘yinchi').slice(0, 20), ws: null, offAt: 0 }] }); r.inline = true; return r; }
// kubok: ikkala o'rin band, ikkalasi kirganda boshlanadi
function createPair(a, b, size, tc) { return newRoom({ size, tc, p: [{ uid: a.uid, name: a.name, ws: null, offAt: 0 }, { uid: b.uid, name: b.name, ws: null, offAt: 0 }] }); }
function again(r) { if (!r || r.status !== 'over' || r.p.length !== 2) return false; r.p.reverse(); r.again = {}; r.votes = {}; r.status = 'wait'; r.S = null; r.at = Date.now(); if (r.p.every(x => x.ws)) deal(r); push(r); return true; }
module.exports = { handle, onClose, rooms, createInline, createPair, again, finish, push, SIZES };
