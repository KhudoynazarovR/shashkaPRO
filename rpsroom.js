'use strict';
// rpsroom.js — ✊✌️✋ Tosh-qaychi-qog'oz: 2–8 kishi, ochko bo'yicha (WebSocket, "rp..." xabarlari).
// Har tur 10 s: har kim tanlaydi, tanlovlar hamma tanlagach (yoki vaqt tugagach) birga ochiladi.
// Ochko: har bir o'yinchi har bir yutgan raqibi uchun +1. Tanlamagan — 0, tanlaganlar uni yutgan hisoblanadi; ketma-ket 3 marta tanlamasa — chiqadi.
// Belgilangan turlar tugagach eng ko'p ochko — g'olib; teng kelsa, teng kelganlar orasida qo'shimcha tur.
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const ROUNDS = [5, 10, 15], MAXP = 8, PICK_MS = 10000, SHOW_MS = 4500, MISS_OUT = 3;
const BEATS = { r: 's', s: 'p', p: 'r' };
const rooms = new Map(), byConn = new Map();
function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.randomBytes(6); let s = ''; for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function who(m) { const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN); return t ? { uid: String(t.id), name: String(t.first_name || t.username || 'O‘yinchi').slice(0, 20) } : null; }
function act(r) { return r.p.filter(x => !x.out && (!r.tb || r.tb.includes(x.uid))); }   // shu turda o'ynaydiganlar
function view(r, uid) {
  return {
    type: 'rpState', code: r.code, status: r.status, rounds: r.rounds, round: r.round, tb: r.tb ? r.tb.length : 0, host: r.p[0] ? r.p[0].uid === uid : false, hostName: r.p[0] ? r.p[0].name : '',
    phase: r.phase || '', left: r.deadline ? Math.max(0, r.deadline - Date.now()) : 0, inl: !!r.inline,
    players: r.p.map(x => ({ name: x.name, score: x.score, out: !!x.out, on: !!x.ws, picked: r.phase === 'pick' ? !!r.picks[x.uid] : undefined, me: x.uid === uid, inTb: r.tb ? r.tb.includes(x.uid) : undefined })),
    last: r.last || null, chat: r.chat || [], mine: r.phase === 'pick' ? r.picks[uid] || '' : '', winner: r.winner || null
  };
}
function push(r) { r.p.forEach(x => send(x.ws, view(r, x.uid))); if (r.watch) for (const ws of r.watch.values()) send(ws, view(r, '')); }
function start(r) {
  if (r.status !== 'wait' || r.p.length < 2) return;
  r.status = 'play'; r.round = 0; r.p.forEach(x => { x.score = 0; x.miss = 0; x.out = false; }); r.tb = null; r.winner = null; r.last = null;
  next(r); if (r.inline) card(r);
}
function next(r) {
  clearTimeout(r.tmr);
  const A = act(r).filter(x => !x.out);
  if (r.p.filter(x => !x.out).length < 2) return finish(r);
  if (!r.tb && r.round >= r.rounds) return checkEnd(r);
  r.round++; r.phase = 'pick'; r.picks = {}; r.deadline = Date.now() + PICK_MS;
  r.tmr = setTimeout(() => resolve(r), PICK_MS + 200);
  push(r);
  void A;
}
function resolve(r) {
  if (r.status !== 'play' || r.phase !== 'pick') return;
  clearTimeout(r.tmr);
  const A = act(r), gain = {}, picks = {};
  A.forEach(x => { gain[x.uid] = 0; picks[x.uid] = r.picks[x.uid] || ''; });
  for (const a of A) for (const b of A) {
    if (a === b) continue;
    const pa = picks[a.uid], pb = picks[b.uid];
    if (pa && (!pb || BEATS[pa] === pb)) gain[a.uid]++;   // tanlamaganni yoki yutadigan belgini
  }
  const outNow = [];
  A.forEach(x => {
    if (r.tb) x.tbs = (x.tbs || 0) + gain[x.uid]; else x.score += gain[x.uid];
    if (picks[x.uid]) x.miss = 0; else if (++x.miss >= MISS_OUT) { x.out = true; outNow.push(x.name); }
  });
  r.last = { n: r.round, tb: !!r.tb, rows: A.map(x => ({ name: x.name, c: picks[x.uid], g: gain[x.uid] })), out: outNow };
  r.phase = 'show'; r.deadline = Date.now() + SHOW_MS;
  push(r); if (r.inline) card(r);
  r.tmr = setTimeout(() => {
    if (r.tb) {   // qo'shimcha tur: shu turda eng ko'p olganlar qoladi
      const T = r.p.filter(x => r.tb.includes(x.uid) && !x.out); const mx = Math.max(...T.map(x => x.tbs || 0));
      const top = T.filter(x => (x.tbs || 0) === mx); T.forEach(x => { x.tbs = 0; });
      if (top.length === 1) return finish(r, top[0]);
      if (!top.length) return finish(r);
      r.tb = top.map(x => x.uid); return next(r);
    }
    next(r);
  }, SHOW_MS);
}
function checkEnd(r) {
  const L = r.p.filter(x => !x.out); if (!L.length) return finish(r);
  const mx = Math.max(...L.map(x => x.score)), top = L.filter(x => x.score === mx);
  if (top.length === 1) return finish(r, top[0]);
  r.tb = top.map(x => x.uid); top.forEach(x => { x.tbs = 0; });   // ⚔️ teng — qo'shimcha tur
  next(r);
}
function finish(r, w) {
  clearTimeout(r.tmr); r.status = 'over'; r.phase = ''; r.deadline = 0;
  if (!w) { const L = r.p.filter(x => !x.out); w = L.sort((a, b) => b.score - a.score)[0]; }
  r.winner = w ? w.name : null; r.at = Date.now();
  push(r); if (r.inline) { card(r); forget(r.code); }
}
function handle(c, m) {
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('rp')) return false;
  if (m.type === 'rpCreate') {
    const u = who(m); if (!u) return send(c.ws, { type: 'rpErr', msg: 'O‘yinni Telegram ichida oching' }), true;
    let k = code(); while (rooms.has(k)) k = code();
    const r = { code: k, rounds: ROUNDS.includes(+m.rounds) ? +m.rounds : 10, p: [{ uid: u.uid, name: u.name, ws: c.ws, cid: c.id, score: 0, miss: 0 }], status: 'wait', at: Date.now(), round: 0 };
    rooms.set(k, r); byConn.set(c.id, k); push(r); return true;
  }
  let r = rooms.get(String(m.code || '').toUpperCase());
  if (!r && m.type === 'rpJoin') r = revive(String(m.code || '').toUpperCase());
  if (!r) return send(c.ws, { type: 'rpErr', msg: 'O‘yin topilmadi yoki tugagan' }), true;
  const u0 = r.p.find(x => x.cid === c.id);
  if (m.type === 'rpJoin') {
    const u = who(m); if (!u) return send(c.ws, { type: 'rpErr', msg: 'O‘yinni Telegram ichida oching' }), true;
    let p = r.p.find(x => x.uid === u.uid);
    if (!p) {
      if (r.status !== 'wait' || r.p.length >= MAXP) { r.watch = r.watch || new Map(); if (r.watch.size < 200) { r.watch.set(c.id, c.ws); byConn.set(c.id, r.code); } send(c.ws, view(r, '')); return true; }
      p = { uid: u.uid, name: u.name, score: 0, miss: 0 }; r.p.push(p);
      if (r.inline && !r.p[0].ws && r.p.length === 2) pingHost(r, u.name);
    }
    p.ws = c.ws; p.cid = c.id; p.offAt = 0; byConn.set(c.id, r.code);
    push(r); if (r.inline) card(r);
    return true;
  }
  if (!u0) return true;
  if (m.type === 'rpChat') {   // 💬 chat (faqat o'yinchilar), sokinish filtri — mod.js
    const now = Date.now(); if (u0.lastChat && now - u0.lastChat < 400) return true;
    let t = String(m.text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120); if (!t) return true;
    try { const M = require('./mod.js'); if (M.isMuted(u0.uid)) return true; t = M.censor(t); } catch (e) {}
    u0.lastChat = now; r.chat = r.chat || []; r.chatN = (r.chatN || 0) + 1; r.chat.push({ i: r.chatN, name: u0.name, text: t }); if (r.chat.length > 30) r.chat.shift();
    push(r); return true;
  }
  if (m.type === 'rpStart') {   // ochgan odam; u 60 s dan beri yo'q bo'lsa — istalgan o'yinchi
    const host = r.p[0];
    if (u0 === host || !host.ws) start(r);
    return true;
  }
  if (m.type === 'rpPick') {
    if (r.status !== 'play' || r.phase !== 'pick' || u0.out || (r.tb && !r.tb.includes(u0.uid)) || !BEATS[m.c] || r.picks[u0.uid]) return true;
    r.picks[u0.uid] = m.c;
    if (act(r).every(x => r.picks[x.uid])) resolve(r); else push(r);
    return true;
  }
  if (m.type === 'rpAgain') {   // 🔁 yana — xuddi shu tarkib bilan
    if (r.status !== 'over') return true;
    r.status = 'wait'; r.p = r.p.filter(x => x.ws); r.p.sort((a, b) => (a === u0 ? -1 : b === u0 ? 1 : 0)); push(r); if (r.inline) card(r);
    return true;
  }
  if (m.type === 'rpLeave') {
    byConn.delete(c.id); u0.ws = null; u0.offAt = Date.now();
    if (r.status === 'wait') { if (r.p.indexOf(u0) > 0 || !r.inline) r.p.splice(r.p.indexOf(u0), 1); if (!r.p.length) { rooms.delete(r.code); return true; } }
    push(r); if (r.inline) card(r);
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
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of rooms) {
    if (r.status === 'wait') { const gone = r.p.filter((x, i) => i > 0 && !x.ws && x.offAt && now - x.offAt > 60e3); if (gone.length) { r.p = r.p.filter(x => !gone.includes(x)); push(r); if (r.inline) card(r); } }
    const on = r.p.some(x => x.ws);
    if ((!on && now - r.at > 30 * 60e3) || now - r.at > 6 * 3600e3) { clearTimeout(r.tmr); rooms.delete(k); }
    else if (on) r.at = Math.max(r.at, now - 25 * 60e3);
  }
}, 30e3).unref();

// ================= 📣 guruh kartasi (inline): ochgan odam birinchi o'rinda, guruhdagilar bosib qo'shiladi, ochgan odam «Boshlash» ni bosadi
function inl() { const d = require('./store.js').db; return d ? (d.rpInl || (d.rpInl = {})) : null; }
function remember(codeX, o) {
  const I = inl(); if (!I || !codeX) return;
  const now = Date.now();
  for (const k of Object.keys(I)) if (now - (I[k].at || 0) > 24 * 3600e3) delete I[k];
  const ks = Object.keys(I); if (ks.length > 300) ks.sort((a, b) => I[a].at - I[b].at).slice(0, ks.length - 300).forEach(k => delete I[k]);
  I[codeX] = Object.assign(I[codeX] || { at: now }, o);
  const r = rooms.get(codeX); if (r && o.imid) { r.imid = o.imid; card(r); }
  try { require('./store.js').save(); } catch (e) {}
}
function forget(codeX) { const I = inl(); if (I && I[codeX]) { delete I[codeX]; try { require('./store.js').save(); } catch (e) {} } }
function revive(codeX) {
  const I = inl(), o = I && I[codeX]; if (!o || !o.uid || Date.now() - (o.at || 0) > 24 * 3600e3) return null;
  const r = { code: codeX, rounds: ROUNDS.includes(+o.rounds) ? +o.rounds : 10, p: [{ uid: String(o.uid), name: String(o.name || 'O‘yinchi').slice(0, 20), ws: null, score: 0, miss: 0 }], status: 'wait', at: Date.now(), round: 0, inline: true, imid: o.imid || '', link: o.link || '', img: o.img || '' };
  rooms.set(codeX, r); return r;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function TG(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return null; } }
function capOf(r) {
  const T = '✊✌️✋ <b>Tosh-qaychi-qog‘oz</b> · ' + r.rounds + ' tur';
  const top = r.p.filter(x => !x.out).slice().sort((a, b) => b.score - a.score).slice(0, 5).map((x, i) => (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(x.name) + ' — ' + x.score).join('\n');
  if (r.status === 'wait') return T + '\n👥 ' + r.p.length + ' kishi: ' + r.p.map(x => esc(x.name)).join(', ') + '\nBosing va qo‘shiling! (2–8 kishi) — <b>' + esc(r.p[0].name) + '</b> boshlaydi';
  if (r.status === 'play') return '🔴 <b>Jonli</b> · ' + T + '\n' + (r.tb ? '⚔️ Qo‘shimcha tur' : r.round + '/' + r.rounds + '-tur') + '\n' + top;
  return '🏁 ' + T + '\n🏆 G‘olib — <b>' + esc(r.winner || '—') + '</b>\n' + top;
}
function card(r) {
  if (!r.inline || !r.imid) return;
  const kb = r.status === 'over' ? { inline_keyboard: [[{ text: '🔁 Yana o‘ynash', switch_inline_query_current_chat: 'tosh' }]] } : { inline_keyboard: [[{ text: r.status === 'play' ? '👁 Tomosha' : '▶ Qo‘shilish', url: r.link }]] };
  const now = Date.now(); if (r.status === 'play' && r.cardAt && now - r.cardAt < 3000) return; r.cardAt = now;   // Telegram cheklovi — tez-tez emas
  const p = { inline_message_id: r.imid, text: capOf(r), parse_mode: 'HTML', reply_markup: kb };
  if (r.img) p.link_preview_options = { url: r.img, prefer_large_media: true, show_above_text: true };
  TG('editMessageText', p);
}
function pingHost(r, name) {
  if (r.pinged) return; r.pinged = Date.now();
  TG('sendMessage', { chat_id: r.p[0].uid, parse_mode: 'HTML', text: '✊✌️✋ <b>' + esc(name) + '</b> Tosh-qaychi-qog‘oz o‘yiningizga qo‘shildi!\nKiring va «▶ Boshlash» ni bosing.', reply_markup: { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: r.link || ('https://t.me/DraughtsPRObot/play?startapp=rp_' + r.code) }]] } });
}
module.exports = { handle, onClose, rooms, remember, BEATS };
