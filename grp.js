'use strict';
// grp.js — guruh imkoniyatlari: 🗳 kim yutadi (ovoz), 🔁 revansh, 📊 guruh TOP, 🏆 guruh turniri.
// Guruh "chat_instance" bo'yicha taniladi (inline xabarlarda chat id berilmaydi).
const G = require('./gcard.js');
const store = require('./store.js');
let LINK = id => id;
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function rid() { const a = 'abcdefghijkmnpqrstuvwxyz23456789', b = require('crypto').randomBytes(8); let s = ''; for (let i = 0; i < 8; i++) s += a[b[i] % a.length]; return s; }
function nm(u) { return String((u && (u.first_name || u.username)) || 'O‘yinchi').slice(0, 20); }
function coins(uid, n) { const u = store.users()[String(uid)]; if (!u) return false; u.diamonds = (u.diamonds || 0) + n; return true; }
const answer = (q, text, alert) => G.tg('answerCallbackQuery', { callback_query_id: q.id, text: String(text || '').slice(0, 195), show_alert: !!alert });

// ---------- 📊 guruh reytingi
function record(ci, room) {
  if (!ci || !room || !room.white || !room.black) return;
  const T = store.db.grpTop = store.db.grpTop || {}, t = T[ci] = T[ci] || {};
  const put = (s, r) => { const x = t[s.uid] = t[s.uid] || { n: s.name, w: 0, d: 0, l: 0 }; x.n = s.name; x[r]++; };
  const w = room.winner === 'white' ? 'w' : room.winner === 'black' ? 'l' : 'd';
  put(room.white, w); put(room.black, w === 'w' ? 'l' : w === 'l' ? 'w' : 'd');
  store.save();
}
function topText(ci, n) {
  const t = (store.db.grpTop || {})[ci] || {};
  const a = Object.values(t).map(x => Object.assign({ p: x.w * 2 + x.d }, x)).sort((x, y) => y.p - x.p || y.w - x.w).slice(0, n || 10);
  if (!a.length) return '📊 Bu guruhda hali o‘yin natijasi yo‘q.\n@DraughtsPRObot orqali doska tashlab o‘ynang!';
  return '📊 Guruh TOP\n' + a.map((x, i) => (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + x.n + ' — ' + x.p + ' ochko (' + x.w + '/' + x.d + '/' + x.l + ')').join('\n');
}
function learnCi(m, q) {
  if (!m || !q.chat_instance || m.ci) return;
  m.ci = q.chat_instance;
  if (m.result) { record(m.ci, m.result); m.result = null; }
}

// ---------- o'yin tugadi (guruh kartasidagi o'yin)
function gameOver(room, m) {
  // 🗳 to'g'ri topganlarga +5
  const win = room.winner === 'white' ? 'w' : room.winner === 'black' ? 'b' : null;
  if (room.votes && win) { let ch = false; for (const [uid, v] of Object.entries(room.votes)) if (v === win && coins(uid, 5)) ch = true; if (ch) store.save(); }
  // 📊 natija (guruh noma'lum bo'lsa — keyinroq, birinchi tugma bosilganda yoziladi)
  const snap = { white: room.white && { uid: room.white.uid, name: room.white.name }, black: room.black && { uid: room.black.uid, name: room.black.name }, winner: room.winner };
  if (m.ci) record(m.ci, snap); else m.result = snap;
}

// ---------- 🏆 guruh turniri
function T(chat) { const a = store.db.gtour = store.db.gtour || {}; return a[String(chat)]; }
function tourText(t) {
  const st = t.status === 'reg' ? '📝 Ro‘yxatdan o‘tish' : t.status === 'run' ? '⚔️ ' + t.round + '-tur' : '🏁 Tugadi';
  let s = '🏆 <b>Guruh kubogi</b> · ⏱ ' + esc(t.tc) + ' · olimpiya tizimi\n' + st + '\n\n👥 Qatnashchilar (' + t.players.length + '):\n' + (t.players.map((p, i) => (i + 1) + '. ' + esc(p.name)).join('\n') || '—');
  if (t.status === 'reg') s += '\n\n«✅ Qatnashaman» ni bosing. ' + esc(t.byName) + ' «▶ Boshlash» ni bosganda kubok boshlanadi.\n🥇 G‘olibga +50 💰';
  if (t.status === 'done' && t.champ) s += '\n\n🏆 <b>Chempion: ' + esc(t.champ) + '</b> (+50 💰)';
  return s;
}
function tourKb(t) {
  if (t.status !== 'reg') return { inline_keyboard: [] };
  return { inline_keyboard: [[{ text: '✅ Qatnashaman', callback_data: 'g:j:' + t.chat }], [{ text: '▶ Boshlash', callback_data: 'g:s:' + t.chat }, { text: '❌ Bekor', callback_data: 'g:x:' + t.chat }]] };
}
function tourEdit(t) { if (t.msg) G.tg('editMessageText', { chat_id: t.chat, message_id: t.msg, text: tourText(t), parse_mode: 'HTML', reply_markup: tourKb(t) }); }
async function cmdTour(msg, arg) {
  if (!msg.chat || msg.chat.type === 'private') return G.tg('sendMessage', { chat_id: msg.chat.id, text: '🏆 Kubok guruhda o‘tkaziladi: botni guruhga qo‘shib, u yerda /kubok yozing.' });
  const a = store.db.gtour = store.db.gtour || {}, old = a[String(msg.chat.id)];
  if (old && old.status !== 'done' && Date.now() - old.at < 6 * 3600e3) return G.tg('sendMessage', { chat_id: msg.chat.id, text: tourText(old), parse_mode: 'HTML', reply_markup: tourKb(old), reply_to_message_id: old.msg });
  const m = /(\d{1,2})\s*\+\s*(\d{1,2})/.exec(arg || ''), tc = m ? m[1] + '+' + m[2] : '3+2';
  const t = a[String(msg.chat.id)] = { chat: msg.chat.id, tc, by: String(msg.from.id), byName: nm(msg.from), players: [{ uid: String(msg.from.id), name: nm(msg.from) }], status: 'reg', round: 0, at: Date.now(), pairs: [] };
  const r = await G.tg('sendMessage', { chat_id: msg.chat.id, text: tourText(t), parse_mode: 'HTML', reply_markup: tourKb(t) });
  if (r && r.result) t.msg = r.result.message_id;
  store.save();
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
async function nextRound(t) {
  const API = G.api();
  if (t.alive.length <= 1) {
    t.status = 'done'; const c = t.players.find(p => p.uid === t.alive[0]);
    t.champ = c ? c.name : '—'; if (c) coins(c.uid, 50);
    store.save(); tourEdit(t);
    return G.tg('sendMessage', { chat_id: t.chat, text: '🏆🎉 Kubok tugadi!\nChempion: <b>' + esc(t.champ) + '</b> — +50 💰', parse_mode: 'HTML' });
  }
  t.round++; t.pairs = []; t.roundAt = Date.now();
  const al = shuffle(t.alive.slice()), P = uid => t.players.find(p => p.uid === uid);
  for (let i = 0; i + 1 < al.length; i += 2) {
    const a = P(al[i]), b = P(al[i + 1]), id = rid();
    const room = API && API.create(id, { tc: t.tc, white: { uid: a.uid, name: a.name }, black: { uid: b.uid, name: b.name } });
    if (room) { room.gt = { chat: t.chat }; room.casual = true; }
    t.pairs.push({ room: id, a: a.uid, b: b.uid, win: null });
  }
  if (al.length % 2) t.pairs.push({ room: null, a: al[al.length - 1], b: null, win: al[al.length - 1] });   // juft topilmadi — keyingi turga o'tadi
  store.save();
  const rows = t.pairs.filter(p => p.room).map(p => [{ text: '⚔️ ' + P(p.a).name.slice(0, 12) + ' — ' + P(p.b).name.slice(0, 12), url: LINK(p.room) }]);
  const bye = t.pairs.find(p => !p.room);
  G.tg('sendMessage', { chat_id: t.chat, text: '⚔️ <b>' + t.round + '-tur</b> boshlandi (⏱ ' + esc(t.tc) + ')\nO‘yiningiz tugmasini bosing — o‘rningiz band qilingan.' + (bye ? '\n🎟 ' + esc(P(bye.a).name) + ' — juftsiz, keyingi turga o‘tdi.' : '') + '\n⌛ 10 daqiqada kirmagan o‘yinchi yutqazadi.', parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
}
function roundCheck(t) {
  if (t.status !== 'run' || t.pairs.some(p => !p.win)) return;
  t.alive = t.pairs.map(p => p.win);
  const P = uid => t.players.find(p => p.uid === uid);
  G.tg('sendMessage', { chat_id: t.chat, text: '✅ ' + t.round + '-tur natijalari:\n' + t.pairs.filter(p => p.room).map(p => '• ' + esc(P(p.a).name) + ' — ' + esc(P(p.b).name) + ': 🏆 ' + esc(P(p.win).name) + (p.coin ? ' (durang, qur‘a)' : '')).join('\n'), parse_mode: 'HTML' });
  nextRound(t);
}
function roomFinished(room) {
  if (!room || !room.gt) return;
  const t = T(room.gt.chat); if (!t || t.status !== 'run') return;
  const p = t.pairs.find(x => x.room === room.id); if (!p || p.win) return;
  if (room.winner === 'white') p.win = p.a; else if (room.winner === 'black') p.win = p.b; else { p.win = Math.random() < 0.5 ? p.a : p.b; p.coin = true; }
  if (t.ci) record(t.ci, room);
  store.save(); roundCheck(t);
}
// kelmaganlar: 10 daqiqada yurish bo'lmasa — kirgan yutadi (ikkalasi ham kirmasa — qur'a)
setInterval(() => {
  const a = store.db.gtour || {}, R = G.rooms();
  for (const t of Object.values(a)) {
    if (t.status !== 'run' || Date.now() - (t.roundAt || 0) < 10 * 60e3) continue;
    let ch = false;
    for (const p of t.pairs) {
      if (p.win || !p.room) continue;
      const room = R && R.get(p.room);
      if (room && (room.moves || []).length) continue;
      const on = s => !!(s && s.clientId);
      const wOn = room && on(room.white), bOn = room && on(room.black);
      p.win = wOn && !bOn ? p.a : bOn && !wOn ? p.b : (Math.random() < 0.5 ? p.a : p.b); p.coin = !(wOn !== bOn); ch = true;
      if (room && !room.finished) { try { G.api().forfeit(p.room, p.win === p.a ? 'white' : 'black', 'noshow'); } catch (e) {} }
    }
    if (ch) { store.save(); roundCheck(t); }
  }
}, 60e3).unref();

// ---------- tugmalar
async function onCallback(q) {
  const d = String(q.data || '').split(':'), uid = String(q.from.id);
  if (d[0] !== 'g') return false;
  const R = G.rooms();
  if (d[1] === 'v') {   // 🗳 ovoz
    const room = R && R.get(d[2]); learnCi(G.msgOf(d[2]), q);
    if (!room || room.finished || !room.white || !room.black) return answer(q, 'Ovoz berish yopilgan'), true;
    if ((room.plies || 0) >= 20) return answer(q, '⌛ Ovoz berish 10-yurishgacha edi'), true;
    if (room.white.uid === uid || room.black.uid === uid) return answer(q, 'O‘yinchilar ovoz bera olmaydi 🙂'), true;
    if (!store.users()[uid]) return answer(q, 'Avval @DraughtsPRObot ni ochib ro‘yxatdan o‘ting — keyin ovoz bera olasiz', true), true;
    room.votes = room.votes || {}; room.votes[uid] = d[3] === 'b' ? 'b' : 'w';
    answer(q, '✅ Ovozingiz: ' + (d[3] === 'b' ? '⚫ ' + room.black.name : '⚪ ' + room.white.name) + '. Topsangiz +5 💰');
    G.now(room); return true;
  }
  if (d[1] === 'r') {   // 🔁 revansh
    const old = R && R.get(d[2]), m = G.msgOf(d[2]); learnCi(m, q);
    if (!old || !m) return answer(q, 'Bu o‘yin eskirgan — yangi doska tashlang'), true;
    if (!((old.white && old.white.uid === uid) || (old.black && old.black.uid === uid))) return answer(q, 'Revansh — faqat o‘yinchilar uchun'), true;
    const API = G.api(), id = rid();
    const room = API.create(id, { tc: old.tc, white: old.black && { uid: old.black.uid, name: old.black.name }, black: old.white && { uid: old.white.uid, name: old.white.name } });
    room.inline = true; room.casual = true;
    m.mkLink = LINK; const n = G.move(d[2], id); n.link = LINK(id);
    answer(q, '🔁 Revansh! Ranglar almashdi — «O‘yinga kirish» ni bosing');
    G.now(room); return true;
  }
  if (d[1] === 't') {   // 📊 guruh TOP
    if (q.message) { // oddiy xabar (/top) — xabar o'zgaradi
      G.tg('editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text: topText(q.chat_instance, 10), reply_markup: { inline_keyboard: [[{ text: '🔄 Yangilash', callback_data: 'g:t' }]] } });
      return answer(q, ''), true;
    }
    for (const id of [d[2]]) { const m = id && G.msgOf(id); learnCi(m, q); }
    return answer(q, topText(q.chat_instance, 5), true), true;
  }
  if (d[1] === 'j' || d[1] === 's' || d[1] === 'x') {   // 🏆 turnir
    const t = T(d[2]); if (!t) return answer(q, 'Kubok topilmadi'), true;
    if (q.chat_instance) t.ci = q.chat_instance;
    if (t.status !== 'reg') return answer(q, 'Ro‘yxat yopilgan'), true;
    if (d[1] === 'j') {
      if (t.players.some(p => p.uid === uid)) return answer(q, 'Siz allaqachon ro‘yxatdasiz ✅'), true;
      if (t.players.length >= 32) return answer(q, 'Joy qolmadi (32)'), true;
      t.players.push({ uid, name: nm(q.from) }); store.save(); tourEdit(t);
      return answer(q, '✅ Ro‘yxatga qo‘shildingiz!'), true;
    }
    if (uid !== t.by && !ADM().includes(uid)) return answer(q, 'Faqat ' + t.byName + ' boshqaradi'), true;
    if (d[1] === 'x') { t.status = 'done'; t.champ = null; store.save(); G.tg('editMessageText', { chat_id: t.chat, message_id: t.msg, text: '❌ Kubok bekor qilindi.' }); return answer(q, 'Bekor qilindi'), true; }
    if (t.players.length < 2) return answer(q, 'Kamida 2 ta qatnashchi kerak'), true;
    t.status = 'run'; t.alive = t.players.map(p => p.uid); tourEdit(t);
    answer(q, '▶ Kubok boshlandi!'); nextRound(t); return true;
  }
  return false;
}
async function cmdTop(msg) {
  return G.tg('sendMessage', { chat_id: msg.chat.id, text: '📊 Guruh reytingi — @DraughtsPRObot doskalarida o‘ynalgan o‘yinlar bo‘yicha.', reply_markup: { inline_keyboard: [[{ text: '📊 Ko‘rish', callback_data: 'g:t' }]] } });
}
module.exports = { setLink: f => { LINK = f; }, gameOver, roomFinished, onCallback, cmdTop, cmdTour, topText };
