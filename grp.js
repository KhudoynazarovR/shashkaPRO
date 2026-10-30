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
function recordM(ci, s) {   // 🧠 Xotira natijasi
  if (!ci || !s || !s.a || !s.b) return;
  const T = store.db.grpTopM = store.db.grpTopM || {}, t = T[ci] = T[ci] || {};
  const put = (x, r) => { const o = t[x.uid] = t[x.uid] || { n: x.name, w: 0, d: 0, l: 0 }; o.n = x.name; o[r]++; };
  put(s.a, s.win === 0 ? 'w' : s.win === 1 ? 'l' : 'd'); put(s.b, s.win === 1 ? 'w' : s.win === 0 ? 'l' : 'd');
  store.save();
}
function topText(ci, n, mm) {
  const t = ((mm ? store.db.grpTopM : store.db.grpTop) || {})[ci] || {};
  const a = Object.values(t).map(x => Object.assign({ p: x.w * 2 + x.d }, x)).sort((x, y) => y.p - x.p || y.w - x.w).slice(0, n || 10);
  if (!a.length) return '📊 Bu guruhda hali o‘yin natijasi yo‘q.\n@DraughtsPRObot orqali doska tashlab o‘ynang!';
  return (mm ? '🧠 Xotira — guruh TOP\n' : '📊 Guruh TOP\n') + a.map((x, i) => (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + x.n + ' — ' + x.p + ' ochko (' + x.w + '/' + x.d + '/' + x.l + ')').join('\n');
}
function learnCi(m, q) {
  if (!m || !q.chat_instance || m.ci) return;
  m.ci = q.chat_instance;
  if (m.result) { record(m.ci, m.result); m.result = null; }
  if (m.mres) { recordM(m.ci, m.mres); m.mres = null; }
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

// ---------- 🧠 Xotira (guruh kartasi)
function mmOver(r, m) {
  if (r.votes && r.winner >= 0) { let ch = false; for (const [uid, v] of Object.entries(r.votes)) if (v === r.winner && coins(uid, 5)) ch = true; if (ch) store.save(); }
  const s = { a: r.p[0] && { uid: r.p[0].uid, name: r.p[0].name }, b: r.p[1] && { uid: r.p[1].uid, name: r.p[1].name }, win: r.winner };
  if (m.ci) recordM(m.ci, s); else m.mres = s;
}
function mmFinished(r) { return require('./gcup.js').mmFinished(r); }   // kubok o'yini tugadi

// ---------- 🏆 guruh kubogi — gcup.js da
function cmdTour(msg, arg) { return require('./gcup.js').cmdTour(msg, arg); }
function roomFinished(room) { try { require('./gcup.js').roomFinished(room); } catch (e) { console.log('[gcup]', e.message); } }

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
  if (d[1] === 'mv' || d[1] === 'mr' || d[1] === 'mt') {   // 🧠 Xotira kartasi
    const MR = require('./memroom.js'), r = MR.rooms.get(d[2]), m = G.msgOf('mm:' + d[2]); learnCi(m, q);
    if (d[1] === 'mt') return answer(q, topText(q.chat_instance, 5, true), true), true;
    if (!r) return answer(q, 'Bu o‘yin eskirgan — yangi karta tashlang'), true;
    if (d[1] === 'mv') {
      if (r.status !== 'play') return answer(q, 'Ovoz berish yopilgan'), true;
      if (r.S && Object.keys(r.S.done).length / 2 >= 3) return answer(q, '⌛ Ovoz berish 3 ta juftlik topilguncha edi'), true;
      if (r.p.some(x => x.uid === uid)) return answer(q, 'O‘yinchilar ovoz bera olmaydi 🙂'), true;
      if (!store.users()[uid]) return answer(q, 'Avval @DraughtsPRObot ni ochib ro‘yxatdan o‘ting — keyin ovoz bera olasiz', true), true;
      r.votes = r.votes || {}; r.votes[uid] = d[3] === '1' ? 1 : 0;
      answer(q, '✅ Ovozingiz: ' + (r.p[r.votes[uid]] ? r.p[r.votes[uid]].name : '') + '. Topsangiz +5 💰'); G.mmNow(r); return true;
    }
    if (!r.p.some(x => x.uid === uid)) return answer(q, 'Revansh — faqat o‘yinchilar uchun'), true;
    if (!MR.again(r)) return answer(q, 'Hozir revansh qilib bo‘lmaydi'), true;
    answer(q, '🔁 Revansh! Ikkalangiz «O‘yinga kirish» ni bosing'); G.mmNow(r); return true;
  }
  if (d[1] === 't') {   // 📊 guruh TOP
    if (q.message) { // oddiy xabar (/top) — xabar o'zgaradi
      G.tg('editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text: topText(q.chat_instance, 10), reply_markup: { inline_keyboard: [[{ text: '🔄 Yangilash', callback_data: 'g:t' }]] } });
      return answer(q, ''), true;
    }
    for (const id of [d[2]]) { const m = id && G.msgOf(id); learnCi(m, q); }
    return answer(q, topText(q.chat_instance, 5), true), true;
  }
  if (d[1] === 'j' || d[1] === 's' || d[1] === 'x' || d[1] === 'l') return require('./gcup.js').onCallback(q, d, uid);   // 🏆 kubok
  return false;
}
async function cmdTop(msg) {
  return G.tg('sendMessage', { chat_id: msg.chat.id, text: '📊 Guruh reytingi — @DraughtsPRObot doskalarida o‘ynalgan o‘yinlar bo‘yicha.', reply_markup: { inline_keyboard: [[{ text: '📊 Ko‘rish', callback_data: 'g:t' }]] } });
}
module.exports = { record, recordM, mmOver, mmFinished, setLink: f => { LINK = f; try { require('./gcup.js').setLink(f); } catch (e) {} }, gameOver, roomFinished, onCallback, cmdTop, cmdTour, topText };
