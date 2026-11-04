'use strict';
// elon.js — 📣 admin e'loni: /elon [matn] → avval adminga namuna (tugmalar bilan), «✅ Hammaga yuborish» bosilsa barcha o'yinchilarga.
// Xabar «Aksiya va eslatmalar» (promo) turida: o'chirib qo'yganlarga bormaydi, ostida 🔕 tugmasi bo'ladi. Tezlik ~20 xabar/soniya.
const store = require('./store.js');
const BOT = process.env.BOT_USERNAME || 'DraughtsPRObot', APP = process.env.APP_NAME || 'play';
const IG = process.env.INSTAGRAM_URL || 'https://instagram.com/shashkapro.uz';
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const tg = (m, p) => require('./gcard.js').tg(m, p);
const DEF = '🎉 <b>ShashkaPRO endi Instagram\'da!</b>\n\n' +
  'Sahifamizda sizni nimalar kutmoqda:\n' +
  '🧩 Har kuni yangi masala — birinchi to\'g\'ri javob bergan tabriklanadi\n' +
  '🦍 King Kong\'ning eng chiroyli kombinatsiyalari\n' +
  '🏆 Turnir g\'oliblari va yangiliklar\n\n' +
  'Obuna bo\'ling va do\'stlaringizga ham ulashing! 👇';
let pending = null, running = false;
function kb(withIg) {
  const share = 'https://t.me/share/url?url=' + encodeURIComponent('https://t.me/' + BOT) + '&text=' + encodeURIComponent('♟ Keling, shashka o‘ynaymiz! ShashkaPRO — Telegram’dagi shashka: odamlar va kuchli botlar bilan, turnirlar va masalalar.');
  const rows = [];
  if (withIg) rows.push([{ text: '📸 Instagram\'ga obuna bo\'lish', url: IG }]);
  rows.push([{ text: '♟ O\'ynash', url: 'https://t.me/' + BOT + '/' + APP + '?startapp=go_main' }, { text: '📤 Do\'stga ulashish', url: share }]);
  return rows;
}
async function cmd(msg, text) {
  if (!ADM().includes(String(msg.from && msg.from.id))) return false;
  const body = text.replace(/^\/elon(@\w+)?/i, '').trim();
  pending = { text: body || DEF, ig: !body || /instagram/i.test(body), by: String(msg.from.id) };
  const n = Object.keys(store.users()).filter(id => /^\d+$/.test(id)).length;
  await tg('sendMessage', { chat_id: msg.chat.id, text: pending.text, parse_mode: 'HTML', disable_web_page_preview: true,
    reply_markup: { inline_keyboard: kb(pending.ig).concat([[{ text: '✅ Hammaga yuborish (' + n + ')', callback_data: 'el:go' }, { text: '❌ Bekor', callback_data: 'el:no' }]]) } });
  return true;
}
async function onCallback(q) {
  const d = String(q.data || ''); if (d.indexOf('el:') !== 0) return false;
  const ans = t => tg('answerCallbackQuery', { callback_query_id: q.id, text: t });
  if (!ADM().includes(String(q.from.id))) { await ans('Faqat admin'); return true; }
  const strip = () => q.message && tg('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: kb(pending ? pending.ig : true) } });
  if (d === 'el:no') { pending = null; await ans('Bekor qilindi'); await strip(); return true; }
  if (!pending) { await ans('Namuna eskirgan — /elon ni qayta yozing'); return true; }
  if (running) { await ans('Yuborish davom etyapti…'); return true; }
  const P = pending; pending = null; running = true;
  await ans('Yuborish boshlandi'); await strip();
  const ids = Object.keys(store.users()).filter(id => /^\d+$/.test(id));
  await tg('sendMessage', { chat_id: q.from.id, text: '📣 E\'lon ' + ids.length + ' kishiga yuborilmoqda… Tugagach hisobot keladi.' });
  let ok = 0, off = 0, bad = 0;
  for (const id of ids) {
    try {
      const r = await tg('sendMessage', { _cat: 'promo', chat_id: id, text: P.text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: { inline_keyboard: kb(P.ig) } });
      if (r === null) off++; else if (r && r.ok) ok++; else { bad++; if (r && r.error_code === 429) await new Promise(z => setTimeout(z, ((r.parameters && r.parameters.retry_after) || 3) * 1000)); }
    } catch (e) { bad++; }
    await new Promise(z => setTimeout(z, 50));
  }
  running = false;
  await tg('sendMessage', { chat_id: q.from.id, text: '✅ E\'lon yuborildi\n\n📬 Yetib bordi: ' + ok + '\n🔕 O‘chirib qo‘yganlar: ' + off + '\n🚫 Yetmadi (botni bloklagan va h.k.): ' + bad });
  return true;
}
module.exports = { cmd, onCallback };
