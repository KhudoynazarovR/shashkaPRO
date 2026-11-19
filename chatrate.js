'use strict';
// chatrate.js — chatga tashlangan shashka kartalari (/new, /shashka, @DraughtsPRObot «Shashka o‘ynash»).
// 1) Bu kartalar xonasidagi o‘yinlar asosiy reytingga yoziladi. Shartlar zaldagi o‘yinlar bilan bir xil:
//    ikkala o‘yinchi ro‘yxatdan o‘tgan, kamida 8 yurish, kelmaganlik va bekor qilingan o‘yin hisoblanmaydi.
//    Xona nomida imzo bor (6 tasodifiy + 2 tekshiruv belgisi, BOT_TOKEN bilan) — ro‘yxat saqlash shart emas,
//    server qayta ishga tushsa ham xona taniladi.
// 2) /new va /shashka GIF karta bilan yuboriladi (birinchi marta fayl yuklanadi, keyin Telegram file_id si bilan).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ABC = 'abcdefghijkmnpqrstuvwxyz23456789';   // bot.js newRoomId bilan bir xil alifbo (32 belgi)
const MIN_PLIES = Number(process.env.REWARD_MIN_PLIES || 8);
const GIF = path.join(__dirname, 'public', 'img', 'gc', 'shashka.gif');

function sig(s) { const h = crypto.createHmac('sha256', 'chatrate:' + (process.env.BOT_TOKEN || '')).update(s).digest(); return ABC[h[0] % 32] + ABC[h[1] % 32]; }
function newId() { const b = crypto.randomBytes(6); let s = ''; for (let i = 0; i < 6; i++) s += ABC[b[i] % 32]; return s + sig(s); }
function isChat(id) { id = String(id || ''); return /^[a-z2-9]{8}$/.test(id) && sig(id.slice(0, 6)) === id.slice(6); }

// rooms.js finish() dan: o'yin tugadi — chat kartasi xonasi bo'lsa, reytingga yozamiz
function finished(room) {
  if (!room || !isChat(room.id) || room.vsBot || room.arena || room.locked || room.etude || room.eloD) return;
  const w = room.white && room.white.uid, b = room.black && room.black.uid;
  if (!w || !b || String(w) === String(b)) return;
  if (room.noshowBoth || room.reason === 'noshow' || room.reason === 'abort' || (room.plies || 0) < MIN_PLIES) return;
  const d = require('./stats.js').record(w, b, room.winner, room.tc);
  if (d) room.eloD = d;   // rooms.js 400 ms dan keyin «roomElo» bilan o'yinchilarga yuboradi
  try { require('./cheat.js').onFinish(room); } catch (e) {}
}

let gifVer = null;
function ver() {
  if (gifVer === null) { try { gifVer = crypto.createHash('md5').update(fs.readFileSync(GIF)).digest('hex').slice(0, 8); } catch (e) { gifVer = ''; } }
  return gifVer;
}
// /new, /shashka: GIF + matn + «O‘ynash» tugmasi. GIF yuborilmasa (guruhda media taqiqlangan va h.k.) — oddiy matn.
async function sendCard(chatId, text, markup) {
  const T = process.env.BOT_TOKEN; if (!T) return null;
  const U = 'https://api.telegram.org/bot' + T + '/';
  const post = (m, p) => fetch(U + m, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).then(r => r.json()).catch(() => null);
  const st = require('./store.js'), v = ver(), c = st.db.shGif;
  if (v) {
    if (c && c.v === v && c.id) { const r = await post('sendAnimation', { chat_id: chatId, animation: c.id, caption: text, reply_markup: markup }); if (r && r.ok) return r; }
    try {
      const fd = new FormData();
      fd.append('chat_id', String(chatId)); fd.append('caption', text); fd.append('reply_markup', JSON.stringify(markup));
      fd.append('animation', new Blob([fs.readFileSync(GIF)], { type: 'image/gif' }), 'shashka.gif');
      const r = await fetch(U + 'sendAnimation', { method: 'POST', body: fd }).then(x => x.json()).catch(() => null);
      const a = r && r.ok && r.result && (r.result.animation || r.result.document);
      if (a && a.file_id) { st.db.shGif = { id: a.file_id, v }; st.save(); return r; }
    } catch (e) { console.log('[chatrate] GIF:', e.message); }
  }
  return post('sendMessage', { chat_id: chatId, text, reply_markup: markup });
}

module.exports = { newId, isChat, finished, sendCard };
