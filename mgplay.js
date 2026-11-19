'use strict';
// mgplay.js — 🎮 Mini o'yinlar markazi: 🧠 Xotira, 🏁 Ugolki, ⭕ Gomoku, ⚪ Go 9×9.
// • Reyting: har o'yinning o'z Glicko-2 reytingi (1500 dan, glicko.js bilan bir xil usul). Do'st bilan onlayn o'yinlar yoziladi
//   (bot bilan — yo'q). Yozilmaydi: kelmaganlik, juda qisqa o'yin, bir raqib bilan kuniga PAIR_DAY dan ortig'i (kelishib reyting yig'masin).
// • «O‘ynash»: o'yin + vaqt bo'yicha navbat — mos raqib bo'lsa ikkalasiga xona ochiladi (mgGo). «Kutayotganlar» — navbatdagilar.
// • «⚔ Chaqirish»: onlayn o'yinchiga taklif — ilovada oyna va Telegramda bot xabari (Qabul / Rad), INV_MS ichida.
// Xabarlar (WebSocket, zal ulanishi orqali, c.lb): mgInfo, mgQueue, mgJoinQ, mgCancel, mgInvite, mgInvCancel, mgAccept, mgDecline.
const crypto = require('crypto');
const store = require('./store.js');
const GL = require('./glicko.js');

const GAMES = {
  mm: { t: 'Xotira', ic: '🧠', tcs: ['2'], def: '2', min: 4 },
  ug: { t: 'Ugolki', ic: '🏁', tcs: ['3+2', '5+3', '10+5'], def: '3+2', min: 10 },
  gomoku: { t: 'Gomoku', ic: '⭕', tcs: ['1+1', '3+2', '5+3'], def: '3+2', min: 6 },
  go: { t: 'Go 9×9', ic: '⚪', tcs: ['3+2', '5+3', '10+5'], def: '5+3', min: 10 }
};
const PAIR_DAY = 3;           // bir raqib bilan kuniga reytingli o'yinlar
const INV_MS = 60e3;          // taklif amal qilish vaqti
const Q_MS = 5 * 60e3;        // navbatda kutish
const NOSHOW_MS = 30e3;       // xona ochilgach kirmagan — texnik mag'lubiyat (xona modulida)
const Q = new Map();          // uid -> { uid, name, g, tc, at, c }
const INV = new Map();        // id -> taklif

const tday = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
const isTg = uid => /^\d+$/.test(String(uid || ''));
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function send(c, o) { try { if (c && c.ws && c.ws.readyState === 1) c.ws.send(JSON.stringify(o)); } catch (e) {} }
function pushUid(uid, o) { try { return (global.spLobby && global.spLobby.pushUid(String(uid), o)) || 0; } catch (e) { return 0; } }
function TG(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
function appLink(sp) { return 'https://t.me/' + (process.env.BOT_USERNAME || 'DraughtsPRObot') + '/' + (process.env.APP_NAME || 'play') + '?startapp=' + sp; }
function startParam(g, code) { return g === 'mm' ? 'mm_' + code : g === 'ug' ? 'ug_' + code : 'du_' + g + '_' + code; }
function nameOf(uid) { const u = store.users()[String(uid)]; return u ? String(u.name || 'O‘yinchi').slice(0, 20) : 'O‘yinchi'; }

// ---------------- ⭐ reyting
function T(g) { const d = store.db; if (!d.mgr) d.mgr = {}; return d.mgr[g] || (d.mgr[g] = {}); }
function rec(g, uid) { const t = T(g); return t[uid] || (t[uid] = { r: 1500, rd: 350, v: 0.06, n: 0, w: 0, l: 0, d: 0, at: 0 }); }
function prov(p) { return GL.age({ rd: p.rd, at: p.at }, Date.now()).rd > GL.PROV ? 1 : 0; }
function pub(g, uid) { const p = T(g)[String(uid)]; return p ? { r: Math.round(p.r), p: prov(p), n: p.n, w: p.w, l: p.l, d: p.d } : { r: 1500, p: 1, n: 0, w: 0, l: 0, d: 0 }; }
function board(g) {
  const t = T(g), U = store.users();
  return Object.keys(t).filter(u => t[u].n > 0 && U[u]).map(u => ({ uid: u, name: String(U[u].name || 'O‘yinchi').slice(0, 20), r: Math.round(t[u].r), p: prov(t[u]), n: t[u].n, av: store.avOf(U[u]) ? 1 : 0 }))
    .sort((a, b) => b.r - a.r || b.n - a.n);
}
// o'yin tugadi: a — 1-tomon, b — 2-tomon; res 1 (a yutdi) | 2 (b yutdi) | 0 (durang). Qaytaradi: { [uid]: {from, to} } | { capped: 1 } | null
function rated(g, a, b, res, info) {
  try {
    const G = GAMES[g]; info = info || {};
    a = String(a || ''); b = String(b || '');
    if (!G || !isTg(a) || !isTg(b) || a === b) return null;
    const U = store.users(); if (!U[a] || !U[b]) return null;
    if (info.noshow || info.why === 'noshow' || (info.plies || 0) < G.min) return null;
    const d = store.db, day = tday();
    if (!d.mgPair || d.mgPair.day !== day) d.mgPair = { day, n: {} };
    const k = g + '|' + [a, b].sort().join('|');
    if ((d.mgPair.n[k] || 0) >= PAIR_DAY) return { capped: 1 };
    d.mgPair.n[k] = (d.mgPair.n[k] || 0) + 1;
    const now = Date.now(), A = rec(g, a), B = rec(g, b);
    GL.age(A, now); GL.age(B, now);
    const sa = res === 1 ? 1 : res === 2 ? 0 : 0.5;
    const nA = GL.step(A, B, sa), nB = GL.step(B, A, 1 - sa);
    const out = {}; out[a] = { from: Math.round(A.r), to: Math.round(nA.r) }; out[b] = { from: Math.round(B.r), to: Math.round(nB.r) };
    Object.assign(A, nA); Object.assign(B, nB);
    A.n++; B.n++; A.at = B.at = now;
    if (sa === 1) { A.w++; B.l++; } else if (sa === 0) { A.l++; B.w++; } else { A.d++; B.d++; }
    store.save();
    return out;
  } catch (e) { console.log('[mg] reyting:', e.message); return null; }
}
// xona ko'rinishi uchun: shu o'yinchiga tegishli o'zgarish
function rtView(rt, uid) { if (!rt) return null; if (rt.capped) return { capped: 1 }; return rt[String(uid)] || null; }

// ---------------- 👥 kim nima o'ynayapti (onlayn ro'yxat va plitkalardagi son)
function playing() {
  const m = new Map();
  const mark = (r, g) => { if (r && r.status === 'play') r.p.forEach(x => { if (x.ws) m.set(String(x.uid), g); }); };
  try { for (const r of require('./ugroom.js').rooms.values()) mark(r, 'ug'); } catch (e) {}
  try { for (const r of require('./duoroom.js').rooms.values()) if (GAMES[r.g]) mark(r, r.g); } catch (e) {}
  try { for (const r of require('./memroom.js').rooms.values()) mark(r, 'mm'); } catch (e) {}
  return m;
}
function act(pl) { const o = { mm: 0, ug: 0, gomoku: 0, go: 0 }; for (const g of pl.values()) o[g]++; for (const q of Q.values()) o[q.g]++; return o; }
function online(g, me, pl) {
  let L = []; try { L = (global.spLobby && global.spLobby.players && global.spLobby.players()) || []; } catch (e) {}
  const U = store.users(), seen = new Set(), out = [];
  for (const p of L) {
    const uid = String(p.uid); if (!isTg(uid) || uid === me || seen.has(uid) || !U[uid]) continue; seen.add(uid);
    const pg = pl.get(uid), q = Q.get(uid);
    out.push({ uid, name: String(U[uid].name || p.name || 'O‘yinchi').slice(0, 20), r: pub(g, uid).r, p: pub(g, uid).p, av: store.avOf(U[uid]) ? 1 : 0, busy: pg ? GAMES[pg].ic + ' ' + GAMES[pg].t : (p.busy ? '⚫ Shashka' : q ? '⏳ ' + GAMES[q.g].t + ' kutyapti' : '') });
  }
  return out.sort((a, b) => (!!a.busy - !!b.busy) || b.r - a.r).slice(0, 30);
}
function info(c, g) {
  const me = String(c.lb.uid), pl = playing(), out = { type: 'mgInfo', me: {}, act: act(pl), top: {}, games: {} };
  for (const k of Object.keys(GAMES)) {
    const b = board(k), i = b.findIndex(x => x.uid === me);
    out.me[k] = Object.assign(pub(k, me), { rank: i >= 0 ? i + 1 : 0, of: b.length });
    out.top[k] = b.slice(0, 5);
    out.games[k] = { t: GAMES[k].t, ic: GAMES[k].ic, tcs: GAMES[k].tcs };
  }
  const q = Q.get(me); out.q = q ? { g: q.g, tc: q.tc, at: q.at } : null;
  if (GAMES[g]) {
    out.g = g;
    out.wait = [...Q.values()].filter(x => x.g === g && x.uid !== me).sort((a, b) => a.at - b.at).slice(0, 20).map(x => ({ uid: x.uid, name: x.name, tc: x.tc, r: pub(g, x.uid).r, p: pub(g, x.uid).p, av: store.avOf(store.users()[x.uid]) ? 1 : 0 }));
    out.online = online(g, me, pl);
  }
  send(c, out);
}
function full(c, g) { if (!GAMES[g]) return; send(c, { type: 'mgTop', g, list: board(g).slice(0, 100) }); }

// ---------------- 🎲 xona ochish (ikkala o'rin band, 30 s ichida kirmagan — texnik mag'lubiyat)
function start(g, tc, A, B) {
  const a = { uid: String(A.uid), name: A.name }, b = { uid: String(B.uid), name: B.name };
  let r = null;
  try {
    if (g === 'mm') r = require('./memroom.js').createTour(a, b, '4x6', -120, () => {}, NOSHOW_MS);
    else if (g === 'ug') r = require('./ugroom.js').createPair(a, b, tc, () => {}, NOSHOW_MS);
    else r = require('./duoroom.js').createPair(a, b, tc, () => {}, NOSHOW_MS, g);
  } catch (e) { console.log('[mg] xona:', e.message); return null; }
  if (!r) return null;
  delete r.onEnd;   // turnir emas: revansh bor, natija — reytingga (xona modulidagi umumiy ilgak orqali)
  const id = 'mx:' + g + ':' + r.code, tcT = g === 'mm' ? '⚡ 2 daq' : tc;
  pushUid(a.uid, { type: 'mgGo', g, id, opp: b.name, tc: tcT });
  pushUid(b.uid, { type: 'mgGo', g, id, opp: a.name, tc: tcT });
  return r;
}

// ---------------- ⚔ taklif
function invId() { let k; do { k = crypto.randomBytes(5).toString('hex'); } while (INV.has(k)); return k; }
function invText(v) { const G = GAMES[v.g]; return '⚔ <b>' + esc(v.from.name) + '</b> (⭐ ' + pub(v.g, v.from.uid).r + ') sizni <b>' + G.ic + ' ' + esc(G.t) + ' · ' + (v.g === 'mm' ? '⚡ 2 daq' : esc(v.tc)) + '</b> o‘yiniga chaqiryapti'; }
function invEdit(v, line, kb) {
  if (!v.msg) return;
  TG('editMessageText', { chat_id: v.msg.chat, message_id: v.msg.id, parse_mode: 'HTML', text: invText(v) + '\n\n' + line, reply_markup: { inline_keyboard: kb || [] } }).catch(() => {});
}
function invClose(v, why) {
  if (!INV.has(v.id)) return; INV.delete(v.id); clearTimeout(v.tmr);
  pushUid(v.to.uid, { type: 'mgInviteGone', id: v.id });
  if (why === 'timeout') { pushUid(v.from.uid, { type: 'mgInviteRes', id: v.id, ok: false, why: 'timeout', name: v.to.name }); invEdit(v, '⌛ Taklif muddati tugadi'); }
  else if (why === 'cancel') invEdit(v, '✖ Taklif bekor qilindi');
}
function invite(c, m) {
  const me = String(c.lb.uid), g = String(m.g || ''), to = String(m.to || '');
  if (!GAMES[g]) return send(c, { type: 'mgErr', msg: 'Noma’lum o‘yin' });
  if (!isTg(to) || to === me || !store.users()[to]) return send(c, { type: 'mgErr', msg: 'O‘yinchi topilmadi' });
  const tc = GAMES[g].tcs.includes(String(m.tc)) ? String(m.tc) : GAMES[g].def;
  for (const v of INV.values()) if (v.from.uid === me) invClose(v, 'cancel');   // bir vaqtda bitta taklif
  Q.delete(me);
  const v = { id: invId(), g, tc, from: { uid: me, name: String(c.lb.name || nameOf(me)).slice(0, 20) }, to: { uid: to, name: nameOf(to) }, at: Date.now() };
  INV.set(v.id, v);
  v.tmr = setTimeout(() => invClose(v, 'timeout'), INV_MS); if (v.tmr.unref) v.tmr.unref();
  const n = pushUid(to, { type: 'mgInviteIn', id: v.id, g, tc, from: { uid: me, name: v.from.name, r: pub(g, me).r, p: pub(g, me).p }, ms: INV_MS });
  TG('sendMessage', { chat_id: to, parse_mode: 'HTML', text: invText(v), _cat: 'game', reply_markup: { inline_keyboard: [[{ text: '✓ Qabul qilish', callback_data: 'mgA:' + v.id }, { text: '✗ Rad etish', callback_data: 'mgD:' + v.id }]] } })
    .then(r => { if (r && r.ok && r.result) v.msg = { chat: r.result.chat.id, id: r.result.message_id }; if (!INV.has(v.id)) invEdit(v, '⌛ Taklif muddati tugadi'); }).catch(() => {});
  send(c, { type: 'mgInviteSent', id: v.id, g, tc, name: v.to.name, app: n > 0, ms: INV_MS });
}
function accept(v, viaTg) {
  if (!INV.has(v.id)) return null;
  INV.delete(v.id); clearTimeout(v.tmr);
  Q.delete(v.from.uid); Q.delete(v.to.uid);
  const r = start(v.g, v.tc, v.from, v.to);
  if (!r) { pushUid(v.from.uid, { type: 'mgInviteRes', id: v.id, ok: false, why: 'err', name: v.to.name }); return null; }
  pushUid(v.from.uid, { type: 'mgInviteRes', id: v.id, ok: true, name: v.to.name });
  if (!viaTg) pushUid(v.to.uid, { type: 'mgInviteGone', id: v.id });
  invEdit(v, '✅ Qabul qilindi', [[{ text: '▶ O‘yinga kirish', url: appLink(startParam(v.g, r.code)) }]]);
  return r;
}
function decline(v, viaTg) {
  if (!INV.has(v.id)) return;
  INV.delete(v.id); clearTimeout(v.tmr);
  pushUid(v.from.uid, { type: 'mgInviteRes', id: v.id, ok: false, why: 'declined', name: v.to.name });
  if (!viaTg) pushUid(v.to.uid, { type: 'mgInviteGone', id: v.id });
  invEdit(v, '✗ Rad etildi');
}
// bot.js callback_query: mgA:<id> / mgD:<id>
async function onCallback(q) {
  const d = String(q.data || ''); if (!/^mg[AD]:/.test(d)) return false;
  const v = INV.get(d.slice(4)), uid = String(q.from && q.from.id);
  if (!v || v.to.uid !== uid) { TG('answerCallbackQuery', { callback_query_id: q.id, text: '⌛ Taklif endi amal qilmaydi', show_alert: false }); if (q.message) TG('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } }); return true; }
  if (d[2] === 'A') { const r = accept(v, true); TG('answerCallbackQuery', { callback_query_id: q.id, text: r ? '✅ Qabul qilindi — «O‘yinga kirish»ni bosing' : '⚠️ O‘yinni ochib bo‘lmadi' }); }
  else { decline(v, true); TG('answerCallbackQuery', { callback_query_id: q.id, text: 'Rad etildi' }); }
  return true;
}

// ---------------- ⏳ navbat
function queue(c, m) {
  const me = String(c.lb.uid), g = String(m.g || '');
  if (!GAMES[g]) return send(c, { type: 'mgErr', msg: 'Noma’lum o‘yin' });
  const tc = GAMES[g].tcs.includes(String(m.tc)) ? String(m.tc) : GAMES[g].def;
  Q.delete(me);
  const name = String(c.lb.name || nameOf(me)).slice(0, 20);
  const opp = [...Q.values()].filter(x => x.g === g && x.tc === tc && x.uid !== me).sort((a, b) => a.at - b.at)[0];
  if (opp) { Q.delete(opp.uid); if (start(g, tc, opp, { uid: me, name })) return; }
  Q.set(me, { uid: me, name, g, tc, at: Date.now(), c });
  send(c, { type: 'mgQueued', g, tc });
}
function joinQ(c, m) {
  const me = String(c.lb.uid), q = Q.get(String(m.uid || ''));
  if (!q || q.uid === me) return send(c, { type: 'mgErr', msg: 'Bu o‘yinchi endi kutmayapti' });
  Q.delete(q.uid); Q.delete(me);
  if (!start(q.g, q.tc, q, { uid: me, name: String(c.lb.name || nameOf(me)).slice(0, 20) })) send(c, { type: 'mgErr', msg: 'O‘yinni ochib bo‘lmadi' });
}
setInterval(() => {
  const now = Date.now();
  for (const [uid, q] of Q) if (now - q.at > Q_MS || !q.c || !q.c.ws || q.c.ws.readyState !== 1) { Q.delete(uid); send(q.c, { type: 'mgQueueEnd', why: 'timeout' }); }
}, 15e3).unref();

function handle(c, m) {
  if (!m || typeof m.type !== 'string' || !/^mg[A-Z]/.test(m.type)) return false;
  if (!c.lb || !c.lb.tg || !isTg(c.lb.uid)) { send(c, { type: 'mgErr', msg: 'Mini o‘yinlar uchun Telegram orqali kiring' }); return true; }
  const me = String(c.lb.uid);
  if (m.type === 'mgInfo') { info(c, String(m.g || '')); return true; }
  if (m.type === 'mgTop') { full(c, String(m.g || '')); return true; }
  if (m.type === 'mgQueue') { queue(c, m); return true; }
  if (m.type === 'mgJoinQ') { joinQ(c, m); return true; }
  if (m.type === 'mgCancel') { Q.delete(me); send(c, { type: 'mgQueueEnd', why: 'cancel' }); return true; }
  if (m.type === 'mgInvite') { invite(c, m); return true; }
  const v = INV.get(String(m.id || ''));
  if (m.type === 'mgInvCancel') { if (v && v.from.uid === me) invClose(v, 'cancel'); return true; }
  if (m.type === 'mgAccept') { if (!v || v.to.uid !== me) send(c, { type: 'mgErr', msg: 'Taklif endi amal qilmaydi' }); else if (!accept(v, false)) send(c, { type: 'mgErr', msg: 'O‘yinni ochib bo‘lmadi' }); return true; }
  if (m.type === 'mgDecline') { if (v && v.to.uid === me) decline(v, false); return true; }
  return true;
}
function onClose(c) { for (const [uid, q] of Q) if (q.c === c) Q.delete(uid); }

module.exports = { GAMES, handle, onClose, onCallback, rated, rtView, pub, board };
