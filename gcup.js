'use strict';
// gcup.js — 🏆 Guruh kubogi (olimpiya tizimi).
// Qoidalar:
//  • /kubok 3+2 20:00 — belgilangan vaqtda o'zi boshlanadi (O'zbekiston vaqti); vaqtsiz — admin «▶ Boshlash» bosadi.
//    "har kuni" / "har shanba" — takrorlanadigan kubok (guruh admini); "/kubok to'xtat" — takrorni o'chiradi.
//  • Kamida 4 qatnashchi; belgilangan vaqtda yetmasa — 30 daqiqaga suriladi, yana yetmasa bekor.
//  • Jadval 1-turda qur'a bilan tuziladi (soni 2 ning darajasi bo'lmasa — saralash turi), keyin g'oliblar jadval bo'yicha uchrashadi.
//  • Tur boshlanishi bilan oqning soati yuradi: kelmagan vaqtdan yutqazadi. Ikkalasi ham kelmasa — ikkalasi ham chiqadi.
//  • Durang — shu stolda tay-brek: 5+0 → 3+0 → 2+0 → 1+0 → 0:30 (0:30 kimdir yutguncha takrorlanadi), ranglar almashadi.
//  • Tur tugagach (oxirgi o'yin, tay-brek ham) — 2 daqiqa tanaffus. Final bilan birga 3-o'rin uchun o'yin.
//  • Mukofot: 🥇500 🥈350 🥉100, o'ynaganlarga 10 (8+ qatnashchi; 4–7 da yarmi). Guruhda kuniga bitta mukofotli kubok.
const G = require('./gcard.js');
const store = require('./store.js');
const TZ = 5 * 3600e3;   // Asia/Tashkent
const MIN_PLAYERS = 4, MAX_PLAYERS = 32;
const BREAK_MS = 2 * 60e3, POSTPONE_MS = 30 * 60e3, ANNOUNCE_AHEAD = 6 * 3600e3;
const PRIZE = [500, 350, 100], PART = 10;
const TB = ['5+0', '3+0', '2+0', '1+0', '0.5+0'];
const MM_NOSHOW = 5 * 60e3;
const DAYS = { yakshanba: 0, dushanba: 1, seshanba: 2, chorshanba: 3, payshanba: 4, juma: 5, shanba: 6 };
const DAYN = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
let LINK = id => id;
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function rid() { const a = 'abcdefghijkmnpqrstuvwxyz23456789', b = require('crypto').randomBytes(8); let s = ''; for (let i = 0; i < 8; i++) s += a[b[i] % a.length]; return s; }
function nm(u) { return String((u && (u.first_name || u.username)) || 'O‘yinchi').slice(0, 20); }
function coins(uid, n) { const u = store.users()[String(uid)]; if (!u || !n) return false; u.diamonds = (u.diamonds || 0) + n; return true; }
const answer = (q, text, alert) => G.tg('answerCallbackQuery', { callback_query_id: q.id, text: String(text || '').slice(0, 195), show_alert: !!alert });
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const hm = ms => { const d = new Date(ms + TZ); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const dayKey = ms => new Date(ms + TZ).toISOString().slice(0, 10);
const dateTxt = ms => { const d = new Date(ms + TZ); return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
function mmTc(s) { s = String(s || ''); return /\b20\s*s/i.test(s) ? 20 : /\b10\s*s/i.test(s) ? 10 : /2\s*(m|daq)|blitz|⚡/i.test(s) ? -120 : 0; }
function mmTcTxt(tc) { return tc > 0 ? tc + ' s' : tc < 0 ? '⚡ 2 daq' : '∞'; }
const tcTxt = tc => String(tc).replace('0.5+0', '0:30');

function T(chat) { const a = store.db.gtour = store.db.gtour || {}; return a[String(chat)]; }
const P = (t, uid) => t.players.find(p => p.uid === uid) || { uid, name: '?' };
const API = () => G.api();

// ---------- vaqt: "20:00" → keyingi shu vaqt (ms), kunlar ro'yxati bo'lsa — o'sha kunlardan biri
function nextAt(h, m, days, from) {
  const now = from || Date.now();
  const d = new Date(now + TZ); d.setUTCHours(h, m, 0, 0);
  let at = d.getTime() - TZ;
  for (let i = 0; i < 8; i++) {
    const wd = new Date(at + TZ).getUTCDay();
    if (at > now + 30e3 && (!days || days.includes(wd))) return at;
    at += 24 * 3600e3;
  }
  return at;
}
function parseArg(arg) {
  arg = String(arg || '');
  const mm = /xotira|memori|память/i.test(arg);
  const m = /(\d{1,2})\s*\+\s*(\d{1,2})/.exec(arg);
  const tm = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.exec(arg.replace(/(\d{1,2})\s*\+\s*(\d{1,2})/, ' '));
  let days = null, rec = false;
  if (/har\s+kun|kunda|daily|каждый/i.test(arg)) rec = true;
  for (const k in DAYS) if (new RegExp('har\\s+' + k, 'i').test(arg)) { rec = true; (days = days || []).push(DAYS[k]); }
  return {
    game: mm ? 'mm' : 'sh', tc: mm ? mmTc(arg) : m ? m[1] + '+' + m[2] : '3+2',
    size: /6\s*[x×х]\s*6/i.test(arg) ? '6x6' : '4x6', theme: /romant|sevgi|yurak|роман/i.test(arg) ? 'romantic' : 'animals',
    h: tm ? +tm[1] : null, m: tm ? +tm[2] : null, days, rec
  };
}

// ---------- e'lon (ro'yxatdan o'tish)
function tourText(t) {
  const head = t.game === 'mm' ? '🏆 <b>Xotira kubogi</b> · 🧠 ' + esc(t.size.replace('x', '×')) + ' · ⏱ ' + esc(mmTcTxt(t.tc)) : '🏆 <b>Guruh kubogi</b> · ⏱ ' + esc(tcTxt(t.tc));
  const st = t.status === 'reg' ? (t.startAt ? '🕗 Boshlanish: <b>' + dateTxt(t.startAt) + ' ' + hm(t.startAt) + '</b>' + (t.postponed ? ' (surildi)' : '') : '📝 Ro‘yxatdan o‘tish') : t.status === 'done' ? '🏁 Tugadi' : '⚔️ Davom etmoqda';
  let s = head + ' · olimpiya tizimi\n' + st + '\n\n👥 Qatnashchilar (' + t.players.length + '):\n' + (t.players.map((p, i) => (i + 1) + '. ' + esc(p.name)).join('\n') || '—');
  if (t.status === 'reg') {
    s += '\n\n«✅ Qatnashaman» ni bosing. ' + (t.startAt ? 'Kubok belgilangan vaqtda o‘zi boshlanadi' : esc(t.byName) + ' «▶ Boshlash» ni bosganda boshlanadi') + ' (kamida ' + MIN_PLAYERS + ' kishi).';
    s += '\n🎁 Mukofot: 🥇' + PRIZE[0] + ' · 🥈' + PRIZE[1] + ' · 🥉' + PRIZE[2] + ' 💰, o‘ynaganlarga ' + PART + ' 💰 (8+ kishi; 4–7 da yarmi)';
    if (prizeUsed(t.chat, t.startAt || Date.now())) s += '\n<i>Bugun mukofotli kubok o‘tdi — bu kubok mukofotsiz.</i>';
    s += '\n\n📜 Qoidalar: tur boshlanishi bilan soat yuradi — kelmagan vaqtdan yutqazadi. Durang bo‘lsa — tay-brek 5+0 → 3+0 → 2+0 → 1+0 → 0:30. Turlar orasida 2 daqiqa tanaffus. Finalda 3-o‘rin uchun ham o‘yin.';
  }
  if (t.status === 'done' && t.champ) s += '\n\n🏆 <b>Chempion: ' + esc(t.champ) + '</b>' + (t.podium && t.podium[1] ? '\n🥈 ' + esc(t.podium[1]) : '') + (t.podium && t.podium[2] ? '\n🥉 ' + esc(t.podium[2]) : '');
  return s;
}
function tourKb(t) {
  if (t.status !== 'reg') return { inline_keyboard: [] };
  return { inline_keyboard: [[{ text: '✅ Qatnashaman', callback_data: 'g:j:' + t.chat }, { text: '🚪 Chiqish', callback_data: 'g:l:' + t.chat }], [{ text: '▶ Boshlash', callback_data: 'g:s:' + t.chat }, { text: '❌ Bekor', callback_data: 'g:x:' + t.chat }]] };
}
function tourEdit(t) { if (t.msg) G.tg('editMessageText', { chat_id: t.chat, message_id: t.msg, text: tourText(t), parse_mode: 'HTML', reply_markup: tourKb(t) }); }
function prizeUsed(chat, at) { const d = (store.db.gprizeDay || {})[String(chat)]; return d === dayKey(at || Date.now()); }

async function isChatAdmin(chat, uid) {
  if (ADM().includes(String(uid))) return true;
  try { const r = await G.tg('getChatMember', { chat_id: chat, user_id: uid }); return !!(r && r.ok && /creator|administrator/.test(r.result.status)); } catch (e) { return false; }
}
async function announce(chat, title, o, by, byName, startAt) {
  const a = store.db.gtour = store.db.gtour || {};
  const t = a[String(chat)] = { v: 2, chat, title: String(title || '').slice(0, 40), game: o.game, tc: o.tc, size: o.size, theme: o.theme, by: String(by), byName, players: [], status: 'reg', at: Date.now(), startAt: startAt || null, rem: {}, postponed: 0, rounds: [], cur: -1 };
  if (by && !o.auto) t.players.push({ uid: String(by), name: byName });
  const r = await G.tg('sendMessage', { chat_id: chat, text: tourText(t), parse_mode: 'HTML', reply_markup: tourKb(t) });
  if (r && r.result) { t.msg = r.result.message_id; G.tg('pinChatMessage', { chat_id: chat, message_id: t.msg, disable_notification: true }); }
  store.save();
  return t;
}
async function cmdTour(msg, arg) {
  if (!msg.chat || msg.chat.type === 'private') return G.tg('sendMessage', { chat_id: msg.chat.id, text: '🏆 Kubok guruhda o‘tkaziladi: botni guruhga qo‘shib, u yerda /kubok yozing.\nMasalan: /kubok 3+2 20:00 yoki /kubok 3+2 20:00 har kuni' });
  const chat = msg.chat.id, uid = String(msg.from.id);
  if (/to.?xtat|stop|bekor/i.test(arg || '')) {
    const C = store.db.gcron = store.db.gcron || {};
    if (!C[String(chat)]) return G.tg('sendMessage', { chat_id: chat, text: 'Bu guruhda takrorlanadigan kubok yo‘q.' });
    if (!(await isChatAdmin(chat, uid))) return G.tg('sendMessage', { chat_id: chat, text: 'Takrorlanadigan kubokni faqat guruh admini o‘chira oladi.' });
    delete C[String(chat)]; store.save();
    return G.tg('sendMessage', { chat_id: chat, text: '🛑 Takrorlanadigan kubok o‘chirildi.' });
  }
  const old = T(chat);
  if (old && old.status !== 'done' && Date.now() - old.at < 24 * 3600e3) return G.tg('sendMessage', { chat_id: chat, text: tourText(old), parse_mode: 'HTML', reply_markup: tourKb(old), reply_to_message_id: old.msg });
  const o = parseArg(arg);
  if (o.rec) {
    if (o.h == null) return G.tg('sendMessage', { chat_id: chat, text: 'Takrorlanadigan kubok uchun vaqtni yozing: /kubok 3+2 20:00 har kuni' });
    if (!(await isChatAdmin(chat, uid))) return G.tg('sendMessage', { chat_id: chat, text: 'Takrorlanadigan kubokni faqat guruh admini belgilay oladi.' });
    const C = store.db.gcron = store.db.gcron || {};
    C[String(chat)] = { game: o.game, tc: o.tc, size: o.size, theme: o.theme, h: o.h, m: o.m, days: o.days, title: String(msg.chat.title || '').slice(0, 40), by: uid, byName: nm(msg.from) };
    store.save();
    G.tg('sendMessage', { chat_id: chat, text: '🔁 Kubok endi ' + (o.days ? 'har ' + o.days.map(d => DAYN[d]).join(', ') : 'har kuni') + ' soat ' + String(o.h).padStart(2, '0') + ':' + String(o.m).padStart(2, '0') + ' da o‘tkaziladi. E’lon boshlanishidan 6 soat oldin chiqadi.\nO‘chirish: /kubok to‘xtat' });
  }
  const startAt = o.h != null ? nextAt(o.h, o.m, o.rec ? o.days : null) : null;
  if (o.rec && startAt - Date.now() > ANNOUNCE_AHEAD) return;   // e'lonni vaqti kelganda ticker chiqaradi
  return announce(chat, msg.chat.title, o, uid, nm(msg.from), startAt);
}

// ---------- jadval
function buildBracket(t) {
  const ids = shuffle(t.players.map(p => p.uid)), N = ids.length;
  let pw = 1; while (pw * 2 <= N) pw *= 2;
  const r0 = [];
  if (N === pw) { for (let i = 0; i < N; i += 2) r0.push({ a: ids[i], b: ids[i + 1] }); }
  else {
    const q = N - pw;   // saralash o'yinlari soni; qolganlar to'g'ridan-to'g'ri o'tadi (bye)
    const pos = []; for (let i = 1; i < pw; i += 2) pos.push(i); for (let i = 0; i < pw; i += 2) pos.push(i);   // saralash o'yinlari iloji boricha bye bilan juftlashadi
    const isQ = new Set(pos.slice(0, q)); let k = 0;
    for (let e = 0; e < pw; e++) { if (isQ.has(e)) { r0.push({ a: ids[k], b: ids[k + 1] }); k += 2; } else { r0.push({ a: ids[k], b: null, win: ids[k], bye: true }); k++; } }
    t.qual = true;
  }
  t.rounds = [r0]; t.cur = -1;
}
const isFinalRound = (t, r) => t.rounds[r] && t.rounds[r].length === 1;
function roundName(t, r) {
  const n = t.rounds[r] ? t.rounds[r].length : 0;
  if (r === 0 && t.qual) return 'Saralash';
  return n === 1 ? 'Final' : n === 2 ? 'Yarim final' : n === 4 ? 'Chorak final' : '1/' + n + ' final';
}
const loserOf = m => m.win && m.b && m.a ? (m.win === m.a ? m.b : m.a) : null;

// ---------- tur
function mkRoom(t, m) {
  if (t.game === 'mm') {
    const r = require('./memroom.js').createPair(P(t, m.a), P(t, m.b), t.size, t.tc, t.theme); r.gt = { chat: t.chat };
    m.room = r.code; m.mm = true; m.at = Date.now(); return;
  }
  const id = rid(), A = API();
  const room = A && A.create(id, { tc: t.tc, white: { uid: m.a, name: P(t, m.a).name }, black: { uid: m.b, name: P(t, m.b).name } });
  if (room) { room.gt = { chat: t.chat }; room.casual = true; A.startClock && A.startClock(id); }
  m.room = id; m.at = Date.now();
}
// bo'sh joy (ikkalasi ham chiqqan) va bye larni hal qilish
function settle(m) {
  if (m.win !== undefined && m.win !== null) return;
  if (m.a === '' && m.b === '') { m.win = ''; m.empty = true; }
  else if (m.a === '' || m.b === '') { m.win = m.a || m.b; m.wo = true; }
}
async function startRound(t) {
  const r = t.cur + 1;
  if (r > 0) {   // keyingi tur juftliklari jadval bo'yicha
    const prev = t.rounds[r - 1], nx = [];
    for (let i = 0; i < prev.length; i += 2) nx.push({ a: prev[i].win || '', b: prev[i + 1] ? prev[i + 1].win || '' : '' });
    t.rounds[r] = nx;
    if (nx.length === 1 && prev.length === 2) {   // final — 3-o'rin uchun o'yin ham
      const l = prev.map(m => m.empty ? '' : loserOf(m) || '');
      if (l[0] || l[1]) { t.third = { a: l[0], b: l[1], third: true }; }
    }
  }
  t.cur = r; t.status = 'run'; t.roundAt = Date.now();
  const list = t.rounds[r].concat(t.third && isFinalRound(t, r) ? [t.third] : []);
  for (const m of list) { settle(m); if (m.win == null && m.a && m.b && !m.room) mkRoom(t, m); }
  store.save();
  // jadval rasmi + tugmalar
  const live = list.filter(m => m.room && m.win == null);
  const rows = live.map(m => [{ text: (m.third ? '🥉 ' : isFinalRound(t, r) ? '🏆 ' : '⚔️ ') + P(t, m.a).name.slice(0, 12) + ' — ' + P(t, m.b).name.slice(0, 12), url: LINK(m.mm ? 'mm_' + m.room : m.room) }]);
  const byes = t.rounds[r].filter(m => m.bye).map(m => esc(P(t, m.a).name));
  const wos = list.filter(m => m.wo).map(m => esc(P(t, m.win).name));
  const head = isFinalRound(t, r) ? '🏆 <b>FINAL</b>' + (t.third && t.third.room ? ' va 🥉 3-o‘rin uchun o‘yin' : '') : '⚔️ <b>' + (r + 1) + '-tur · ' + roundName(t, r) + '</b>';
  const cap = head + ' boshlandi (' + (t.game === 'mm' ? '🧠 Xotira · ⏱ ' + esc(mmTcTxt(t.tc)) : '⏱ ' + esc(tcTxt(t.tc))) + ')\n' +
    (t.game === 'mm' ? 'O‘yiningiz tugmasini bosing. ⌛ 5 daqiqada kirmagan yutqazadi.' : '⏱ Soat hozir boshlandi — tugmani bosib darhol kiring! Kelmagan vaqtdan yutqazadi.') +
    (byes.length ? '\n🎟 Saralashsiz: ' + byes.join(', ') : '') + (wos.length ? '\n🏳 Raqibsiz o‘tdi: ' + wos.join(', ') : '');
  await sendBracket(t, cap, rows);
  for (const m of live) for (const [me, op] of [[m.a, m.b], [m.b, m.a]]) dm(me, (m.third ? '🥉 3-o‘rin uchun o‘yiningiz' : isFinalRound(t, r) ? '🏆 Final o‘yiningiz' : '⚔️ Kubok: ' + roundName(t, r) + ' o‘yiningiz') + ' boshlandi!\nRaqib: <b>' + esc(P(t, op).name) + '</b> · ⏱ ' + esc(t.game === 'mm' ? mmTcTxt(t.tc) : tcTxt(t.tc)) + (t.game === 'mm' ? '' : '\nSoat yuryapti — darhol kiring!'), LINK(m.mm ? 'mm_' + m.room : m.room));
  check(t);
}
function dm(uid, text, link) { if (!uid) return; G.tg('sendMessage', { chat_id: uid, text, parse_mode: 'HTML', reply_markup: link ? { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: link }]] } : undefined }); }
async function sendBracket(t, caption, rows) {
  let ok = null;
  try { ok = await require('./podium.js').sendBracket(t.chat, bracketData(t), caption, rows && rows.length ? { inline_keyboard: rows } : undefined); } catch (e) { console.log('[gcup] jadval', e.message); }
  if (!ok || !ok.ok) G.tg('sendMessage', { chat_id: t.chat, text: caption, parse_mode: 'HTML', reply_markup: rows && rows.length ? { inline_keyboard: rows } : undefined });
}
function bracketData(t) {
  const nmOf = u => u === '' ? '—' : u == null ? '?' : P(t, u).name;
  const conv = (m, r) => ({ a: nmOf(m.a), b: m.bye ? null : nmOf(m.b), w: m.win == null || m.win === '' ? null : m.win === m.a ? 0 : 1, live: !!(m.room && m.win == null && r === t.cur), tb: m.tb || 0, bye: !!m.bye, wo: !!m.wo });
  const cols = [];
  for (let r = 0; r < t.rounds.length; r++) cols.push({ name: roundName(t, r), m: t.rounds[r].map(m => conv(m, r)) });
  // kelajak turlar — "?" bilan
  let n = t.rounds[t.rounds.length - 1].length;
  while (n > 1) { n /= 2; cols.push({ name: n === 1 ? 'Final' : n === 2 ? 'Yarim final' : n === 4 ? 'Chorak final' : '1/' + n + ' final', m: Array.from({ length: n }, () => ({ a: '?', b: '?', w: null })) }); }
  const third = t.third ? conv(t.third, t.cur) : (cols.length >= 2 && cols[cols.length - 1].m.length === 1 && cols[cols.length - 2].m.length === 2 ? { a: '?', b: '?', w: null } : null);
  const stage = t.status === 'done' ? 'Kubok tugadi' : t.status === 'brk' ? 'Tanaffus · ' + (t.cur + 2) + '-tur ' + hm(t.breakUntil) + ' da' : 'Hozir: ' + roundName(t, t.cur);
  return { title: t.game === 'mm' ? 'XOTIRA KUBOGI · JADVAL' : 'GURUH KUBOGI · JADVAL', sub: (t.title ? t.title + ' · ' : '') + (t.game === 'mm' ? mmTcTxt(t.tc) : '⏱ ' + tcTxt(t.tc)) + ' · ' + t.players.length + ' ishtirokchi', stage, qual: !!t.qual, cols, third };
}
// tur tugadimi
function check(t) {
  if (t.status !== 'run') return;
  const r = t.cur, list = t.rounds[r].concat(t.third && isFinalRound(t, r) ? [t.third] : []);
  list.forEach(settle);
  if (list.some(m => m.win == null)) return;
  store.save();
  const res = list.filter(m => m.room).map(m => (m.third ? '🥉 ' : '• ') + esc(P(t, m.a).name) + ' — ' + esc(P(t, m.b).name) + ': ' + (m.empty ? '❌ ikkalasi ham kelmadi' : '🏆 ' + esc(P(t, m.win).name) + (m.ns ? ' (raqib kelmadi)' : m.coin ? ' (qur‘a)' : m.tb ? ' (tay-brek)' : '')));
  if (isFinalRound(t, r)) { G.tg('sendMessage', { chat_id: t.chat, text: '✅ Final natijalari:\n' + res.join('\n'), parse_mode: 'HTML' }); return finishTour(t); }
  t.status = 'brk'; t.breakUntil = Date.now() + BREAK_MS; store.save();
  G.tg('sendMessage', { chat_id: t.chat, text: '✅ ' + (r + 1) + '-tur (' + roundName(t, r) + ') natijalari:\n' + res.join('\n') + '\n\n☕ 2 daqiqa tanaffus · ' + (r + 2) + '-tur soat <b>' + hm(t.breakUntil) + '</b> da boshlanadi.', parse_mode: 'HTML' });
}
const findMatch = (t, room) => { for (const R of t.rounds) for (const m of R) if (m.room === room) return m; return t.third && t.third.room === room ? t.third : null; };

// ---------- o'yin tugadi (rooms.js chaqiradi)
function roomFinished(room) {
  if (!room || !room.gt) return;
  const t = T(room.gt.chat); if (!t || t.v !== 2 || t.status !== 'run') return;
  const m = findMatch(t, room.id); if (!m || m.win != null) return;
  const nmv = (room.moves || []).length; m.played = m.played || {};
  if (room.white && nmv >= 1) m.played[room.white.uid] = 1;
  if (room.black && nmv >= 2) m.played[room.black.uid] = 1;
  const wu = room.white && room.white.uid, bu = room.black && room.black.uid;
  if (t.ci && nmv) try { require('./grp.js').record(t.ci, room); } catch (e) {}   // 📊 guruh reytingi
  if (room.winner === 'draw' || !room.winner) {   // 🤝 durang — tay-brek shu stolda
    m.tb = (m.tb || 0) + 1;
    const tc = TB[Math.min(m.tb - 1, TB.length - 1)];
    const A = API(); store.save();
    const txt = '🤝 Durang! Stoldan chiqmang — 10 soniyadan keyin tay-brek №' + m.tb + ' (' + tcTxt(tc) + '), ranglar almashadi.';
    setTimeout(() => { try { A.tieBreak(room.id, tc, 10000); A.notice(room.id, txt); } catch (e) { console.log('[gcup] tay-brek', e.message); } }, 1500);
    for (const u of [m.a, m.b]) dm(u, txt, LINK(room.id));
    G.tg('sendMessage', { chat_id: t.chat, text: '🤝 ' + esc(P(t, m.a).name) + ' — ' + esc(P(t, m.b).name) + ': durang, tay-brek ' + tcTxt(tc), parse_mode: 'HTML' });
    return;
  }
  const win = room.winner === 'white' ? wu : bu, los = win === wu ? bu : wu;
  // oq bitta ham yurmay vaqtdan yutqazdi va qora xonaga umuman kirmagan — ikkalasi ham chiqadi
  const losColor = win === wu ? 'black' : 'white';
  const seatIn = s => !!(s && s.clientId);
  if (room.reason === 'timeout' && nmv === 0 && !seatIn(room[room.winner])) { m.win = ''; m.empty = true; }
  else { m.win = win; if (room.reason === 'timeout' && !m.played[los] && !seatIn(room[losColor])) m.ns = true; }
  store.save(); setTimeout(() => check(t), 0);
}
function mmFinished(r) {
  if (!r || !r.gt) return false;
  const t = T(r.gt.chat); if (!t || t.v !== 2 || t.status !== 'run') return false;
  const m = findMatch(t, r.code); if (!m || m.win != null) return true;
  const ia = r.p.findIndex(x => x.uid === m.a), ib = 1 - ia;
  if (r.winner === ia) m.win = m.a; else if (r.winner === ib) m.win = m.b; else { m.win = Math.random() < 0.5 ? m.a : m.b; m.coin = true; }
  m.played = { [m.a]: 1, [m.b]: 1 };
  store.save(); setTimeout(() => check(t), 0); return true;
}

// ---------- boshlash
function begin(t) {
  if (t.players.length < MIN_PLAYERS) return false;
  t.prize = !prizeUsed(t.chat, Date.now());
  if (t.prize) { store.db.gprizeDay = store.db.gprizeDay || {}; store.db.gprizeDay[String(t.chat)] = dayKey(Date.now()); }
  t.mult = t.players.length >= 8 ? 1 : 0.5;
  buildBracket(t); t.status = 'run'; tourEdit(t);
  if (t.msg) G.tg('unpinChatMessage', { chat_id: t.chat, message_id: t.msg });
  startRound(t);
  return true;
}

// ---------- tugadi
function finishTour(t) {
  t.status = 'done';
  const last = t.rounds[t.rounds.length - 1], fin = last && last[0];
  const champ = fin && fin.win ? fin.win : null;
  const second = fin && !fin.empty && fin.win && fin.a && fin.b ? loserOf(fin) : null;
  let third = null, fourth = null;
  if (t.third) { if (t.third.win) { third = t.third.win; fourth = t.third.a && t.third.b ? loserOf(t.third) : null; } }
  const top = [champ, second, third];
  const prize = t.prize ? PRIZE.map(x => Math.round(x * (t.mult || 1))) : [0, 0, 0];
  const part = t.prize ? Math.round(PART * (t.mult || 1)) : 0;
  top.forEach((u, i) => { if (u) coins(u, prize[i]); });
  const played = new Set(); for (const R of t.rounds) for (const m of R) Object.keys(m.played || {}).forEach(u => played.add(u)); if (t.third) Object.keys(t.third.played || {}).forEach(u => played.add(u));
  if (part) played.forEach(u => coins(u, part));
  t.champ = champ ? P(t, champ).name : null; t.podium = top.map(u => u ? P(t, u).name : null);
  store.save(); tourEdit(t);
  sendBracket(t, '🏁 Kubok jadvali — yakuniy', null);
  if (!champ) return G.tg('sendMessage', { chat_id: t.chat, text: '🏁 Kubok tugadi — g‘olib aniqlanmadi.' });
  // chempion yo'li
  const path = [];
  for (const R of t.rounds) { const m = R.find(x => x.a === champ || x.b === champ); if (!m || m.bye) continue; const op = m.a === champ ? m.b : m.a; path.push(op ? esc(P(t, op).name) + (m.ns ? ' (kelmadi)' : m.tb ? ' (tay-brek)' : '') : '—'); }
  // qaysi turda chiqqanlar
  const out = {};
  t.rounds.forEach((R, r) => R.forEach(m => { if (m.empty) { if (m.a) out[m.a] = r; if (m.b) out[m.b] = r; } else { const l = loserOf(m); if (l) out[l] = r; } }));
  const rest = Object.entries(out).filter(([u]) => ![champ, second, third, fourth].includes(u)).sort((a, b) => b[1] - a[1]);
  const games = t.rounds.reduce((n, R) => n + R.filter(m => m.room).length, 0) + (t.third && t.third.room ? 1 : 0);
  const L = ['🎉 <b>Kubok yakunlandi!</b> 🎉', '🏆 ' + (t.title ? esc(t.title) + ' · ' : '') + dateTxt(Date.now()) + ' · ' + (t.game === 'mm' ? '🧠 Xotira' : '⏱ ' + esc(tcTxt(t.tc))), '',
    '👑 <b>CHEMPION: ' + esc(P(t, champ).name) + '</b>', 'Guruhning yangi ' + (t.game === 'mm' ? 'xotira' : 'shashka') + ' qiroli! 🔥'];
  if (path.length) L.push('🛤 Yo‘li: ' + path.join(' → '));
  L.push('');
  L.push('🥇 ' + esc(P(t, champ).name) + (prize[0] ? ' · +' + prize[0] + ' 💰' : ''));
  if (second) L.push('🥈 ' + esc(P(t, second).name) + (prize[1] ? ' · +' + prize[1] + ' 💰' : ''));
  if (third) L.push('🥉 ' + esc(P(t, third).name) + (prize[2] ? ' · +' + prize[2] + ' 💰' : ''));
  if (fourth) L.push('4. ' + esc(P(t, fourth).name));
  if (rest.length) L.push('🎖 ' + rest.map(([u, r]) => esc(P(t, u).name) + ' (' + roundName(t, r).toLowerCase() + ')').join(', '));
  if (part) L.push('🎁 O‘ynagan har bir qatnashchiga +' + part + ' 💰');
  else if (!t.prize) L.push('<i>Bugungi mukofotli kubok avvalroq o‘tgan — bu kubok mukofotsiz.</i>');
  L.push('', '📊 ' + t.rounds.length + ' tur · ' + games + ' o‘yin · ' + t.players.length + ' ishtirokchi', 'Hammaga rahmat! 👏', '🔁 Revansh? /kubok yozing!');
  const info = { title: t.game === 'mm' ? 'XOTIRA KUBOGI' : 'GURUH KUBOGI', sub: (t.title ? t.title.slice(0, 32) + ' · ' : '') + dateTxt(Date.now()) + (t.game === 'mm' ? '' : ' · ' + tcTxt(t.tc)), foot: t.players.length + ' ishtirokchi · ' + t.rounds.length + ' tur · @DraughtsPRObot' };
  setTimeout(() => require('./podium.js').send(t.chat, top.map((u, i) => u ? { name: P(t, u).name, uid: u, prize: prize[i] } : null), info, L.join('\n')), 1500);
}

// ---------- tugmalar
async function onCallback(q, d, uid) {
  const t = T(d[2]); if (!t) return answer(q, 'Kubok topilmadi'), true;
  if (q.chat_instance) t.ci = q.chat_instance;
  if (t.status !== 'reg') return answer(q, 'Ro‘yxat yopilgan'), true;
  if (d[1] === 'j') {
    if (t.players.some(p => p.uid === uid)) return answer(q, 'Siz allaqachon ro‘yxatdasiz ✅'), true;
    if (t.players.length >= MAX_PLAYERS) return answer(q, 'Joy qolmadi (' + MAX_PLAYERS + ')'), true;
    t.players.push({ uid, name: nm(q.from) }); store.save(); tourEdit(t);
    return answer(q, '✅ Ro‘yxatga qo‘shildingiz!' + (t.startAt ? ' Boshlanish: ' + hm(t.startAt) : '')), true;
  }
  if (d[1] === 'l') {
    const i = t.players.findIndex(p => p.uid === uid); if (i < 0) return answer(q, 'Siz ro‘yxatda yo‘qsiz'), true;
    t.players.splice(i, 1); store.save(); tourEdit(t); return answer(q, 'Ro‘yxatdan chiqdingiz'), true;
  }
  if (uid !== t.by && !ADM().includes(uid) && !(await isChatAdmin(t.chat, uid))) return answer(q, 'Faqat ' + t.byName + ' yoki guruh admini boshqaradi'), true;
  if (d[1] === 'x') { t.status = 'done'; t.champ = null; store.save(); G.tg('editMessageText', { chat_id: t.chat, message_id: t.msg, text: '❌ Kubok bekor qilindi.' }); if (t.msg) G.tg('unpinChatMessage', { chat_id: t.chat, message_id: t.msg }); return answer(q, 'Bekor qilindi'), true; }
  if (t.players.length < MIN_PLAYERS) return answer(q, 'Kamida ' + MIN_PLAYERS + ' ta qatnashchi kerak', true), true;
  answer(q, '▶ Kubok boshlandi!'); begin(t); return true;
}

// ---------- taymer: eslatmalar, avtomatik boshlash, tanaffus, takrorlanadigan kubok, Xotira kelmaganlari
function tick() {
  const now = Date.now(), a = store.db.gtour || {};
  for (const t of Object.values(a)) {
    if (!t || t.v !== 2) continue;
    try {
      if (t.status === 'reg' && t.startAt) {
        const left = t.startAt - now; t.rem = t.rem || {};
        if (left <= 3600e3 && left > 3300e3 && !t.rem.h) { t.rem.h = 1; G.tg('sendMessage', { chat_id: t.chat, text: '⏰ Kubokka 1 soat qoldi (' + hm(t.startAt) + ')! Ro‘yxatdan o‘ting: ' + t.players.length + ' kishi', reply_to_message_id: t.msg }); }
        if (left <= 15 * 60e3 && left > 10 * 60e3 && !t.rem.q) { t.rem.q = 1; G.tg('sendMessage', { chat_id: t.chat, text: '⏰ Kubokka 15 daqiqa qoldi!\n👥 ' + t.players.map(p => esc(p.name)).join(', '), parse_mode: 'HTML', reply_to_message_id: t.msg }); }
        if (left <= 5 * 60e3 && left > 0 && !t.rem.f) { t.rem.f = 1; for (const p of t.players) dm(p.uid, '⏰ Guruh kubogi 5 daqiqadan keyin boshlanadi (' + hm(t.startAt) + '). Telefoningizni yaqin tuting — tur boshlanishi bilan soat yuradi!'); }
        if (left <= 0) {
          if (t.players.length >= MIN_PLAYERS) begin(t);
          else if (!t.postponed) { t.postponed = 1; t.startAt = now + POSTPONE_MS; t.rem = { h: 1, q: 0, f: 0 }; store.save(); tourEdit(t); G.tg('sendMessage', { chat_id: t.chat, text: '⏳ Qatnashchilar yetarli emas (' + t.players.length + '/' + MIN_PLAYERS + '). Kubok 30 daqiqaga surildi — ' + hm(t.startAt) + ' da. Do‘stlaringizni chaqiring!', reply_to_message_id: t.msg }); }
          else { t.status = 'done'; t.champ = null; store.save(); G.tg('editMessageText', { chat_id: t.chat, message_id: t.msg, text: '❌ Kubok bekor qilindi — qatnashchilar yetarli emas (' + t.players.length + '/' + MIN_PLAYERS + ').' }); if (t.msg) G.tg('unpinChatMessage', { chat_id: t.chat, message_id: t.msg }); }
        }
      }
      if (t.status === 'brk' && now >= t.breakUntil) startRound(t);
      if (t.status === 'run') {
        const R = G.rooms(), list = t.rounds[t.cur].concat(t.third && isFinalRound(t, t.cur) ? [t.third] : []);
        let ch = false;
        for (const m of list) {
          if (m.win != null || !m.room) continue;
          if (m.mm) {   // 🧠 Xotira: 5 daqiqada boshlanmasa — kirgan yutadi
            if (now - (m.at || t.roundAt) < MM_NOSHOW) continue;
            const mr = require('./memroom.js').rooms.get(m.room); if (mr && mr.S) continue;
            const on = uid => !!(mr && mr.p.find(x => x.uid === uid && x.ws)), aOn = on(m.a), bOn = on(m.b);
            if (!aOn && !bOn) { m.win = ''; m.empty = true; } else { m.win = aOn ? m.a : m.b; m.ns = true; }
            if (mr) { mr.status = 'over'; mr.winner = mr.p.findIndex(x => x.uid === m.win); try { require('./memroom.js').push(mr); } catch (e) {} }
            ch = true; continue;
          }
          const room = R && R.get(m.room);
          if (!room) { m.win = Math.random() < 0.5 ? m.a : m.b; m.coin = true; ch = true; }   // xona yo'qolgan (kutilmagan holat)
        }
        if (ch) { store.save(); check(t); }
      }
    } catch (e) { console.log('[gcup] tick', e.message); }
  }
  // 🔁 takrorlanadigan kubok: boshlanishidan 6 soat oldin e'lon
  const C = store.db.gcron || {};
  for (const [chat, c] of Object.entries(C)) {
    try {
      const t = a[chat];
      if (t && t.status !== 'done') continue;
      const at = nextAt(c.h, c.m, c.days);
      if (at - now > ANNOUNCE_AHEAD) continue;
      if (t && t.startAt === at) continue;
      if (t && t.status === 'done' && t.lastCron === at) continue;
      announce(+chat, c.title, Object.assign({ auto: true }, c), c.by, c.byName, at).then(n => { if (n) n.lastCron = at; });
    } catch (e) { console.log('[gcup] cron', e.message); }
  }
}
setInterval(tick, 15e3).unref();
// eski (v1) kubok yangilanishda davom etayotgan bo'lsa — to'xtatamiz
setTimeout(() => { const a = store.db.gtour || {}; for (const t of Object.values(a)) if (t && t.v !== 2 && t.status !== 'done') { t.status = 'done'; if (Date.now() - (t.at || 0) < 6 * 3600e3) G.tg('sendMessage', { chat_id: t.chat, text: '⚠️ Bot yangilandi — davom etayotgan kubok to‘xtatildi. Iltimos, /kubok bilan qaytadan boshlang.' }); } }, 20e3).unref();

module.exports = { cmdTour, onCallback, roomFinished, mmFinished, setLink: f => { LINK = f; }, T, _t: { parseArg, nextAt, buildBracket, bracketData, startRound, check, begin, finishTour, tick } };
