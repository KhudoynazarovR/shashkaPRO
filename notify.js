'use strict';
// notify.js — 🔔 bot xabarlari turlari: o'yinchi qaysilari kelishini o'zi tanlaydi.
// gcard.tg ga `_cat` berilsa: o'chirilgan bo'lsa yuborilmaydi, xabar ostiga «🔕 Bunday xabarlarni o'chirish» tugmasi qo'shiladi.
const store = require('./store.js');
const CATS = {
  game: '♟ O‘yin xabarlari (yozishma, takliflar, sovg‘alar)',
  arena: '🌙 Turnir va arena',
  prem: '👑 Premium eslatmalari',
  ach: '🏅 Yutuq va mukofotlar',
  promo: '👋 Aksiya va eslatmalar'
};
function allowed(uid, cat) { const u = store.users()[String(uid)]; return !(u && u.nf && u.nf[cat] === false); }
function decorate(params) {   // gcard.tg ichidan: true — yuborish kerak
  const cat = params._cat; delete params._cat;
  if (!cat || !CATS[cat]) return true;
  if (!allowed(params.chat_id, cat)) return false;
  const kb = (params.reply_markup && params.reply_markup.inline_keyboard) ? params.reply_markup.inline_keyboard.slice() : [];
  kb.push([{ text: '🔕 Bunday xabarlarni o‘chirish', callback_data: 'nf:off:' + cat }]);
  params.reply_markup = Object.assign({}, params.reply_markup || {}, { inline_keyboard: kb });
  return true;
}
async function onCallback(q) {
  const d = String(q.data || '').split(':'); if (d[0] !== 'nf') return false;
  const tg = (m, p) => require('./gcard.js').tg(m, p);
  const u = store.getOrCreate(q.from), cat = d[2];
  if (d[1] === 'off' && CATS[cat]) { u.nf = u.nf || {}; u.nf[cat] = false; store.save(); }
  if (d[1] === 'on' && CATS[cat]) { u.nf = u.nf || {}; delete u.nf[cat]; store.save(); }
  if (q.message) {
    const kb = ((q.message.reply_markup || {}).inline_keyboard || []).filter(r => !(r[0] && /^nf:/.test(r[0].callback_data || '')));
    kb.push([d[1] === 'off' ? { text: '🔔 Qayta yoqish', callback_data: 'nf:on:' + cat } : { text: '🔕 Bunday xabarlarni o‘chirish', callback_data: 'nf:off:' + cat }]);
    tg('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: kb } });
  }
  tg('answerCallbackQuery', { callback_query_id: q.id, text: d[1] === 'off' ? '🔕 «' + CATS[cat] + '» o‘chirildi. Ilovada Sozlamalar → 🔔 Bot xabarlari orqali yoqish mumkin' : '🔔 Yana yoqildi', show_alert: d[1] === 'off' });
  return true;
}
// GET /api/notify · POST /api/notify {cat, on}
function handle(req, res, p, h) {
  if (p !== '/api/notify') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const u = store.getOrCreate(t), view = () => ({ cats: Object.entries(CATS).map(([k, n]) => ({ k, n, on: !(u.nf && u.nf[k] === false) })), all: !(u.ntfOff || u.ntfOn === false) });
  if (req.method === 'GET') { h.send(res, 200, view()); return true; }
  h.readBody(req, 500, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (j.cat === 'all') { if (j.on) { delete u.ntfOff; delete u.ntfOn; } else u.ntfOn = false; }
    else if (CATS[j.cat]) { u.nf = u.nf || {}; if (j.on) delete u.nf[j.cat]; else u.nf[j.cat] = false; }
    store.save(); h.send(res, 200, view());
  });
  return true;
}
module.exports = { CATS, allowed, decorate, onCallback, handle };
