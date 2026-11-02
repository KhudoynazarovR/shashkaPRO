const fs = require('fs');
let s = fs.readFileSync('gcup.js', 'utf8');
let n = 0;
function rep(a, b) { const c = s.split(a).length - 1; if (c) { s = s.split(a).join(b); n += c; } console.log(c, '→', a.slice(0, 50)); }

// 1) mirror funksiyasi
const fn = `function mirror(t, method, p) {
  const main = G.tg(method, p);
  for (const [cid, mid] of Object.entries(t.mir || {})) {
    const q = Object.assign({}, p, { chat_id: cid });
    delete q.reply_to_message_id;
    if (q.message_id) q.message_id = mid;
    try { Promise.resolve(G.tg(method, q)).catch(() => {}); } catch (e) {}
  }
  return main;
}
`;
rep('function T(chat) {', fn + 'function T(chat) {');

// 2) barcha t.chat xabarlari ikkala guruhga
rep("G.tg('sendMessage', { chat_id: t.chat,", "mirror(t, 'sendMessage', { chat_id: t.chat,");
rep("G.tg('editMessageText', { chat_id: t.chat,", "mirror(t, 'editMessageText', { chat_id: t.chat,");
rep("G.tg('unpinChatMessage', { chat_id: t.chat,", "mirror(t, 'unpinChatMessage', { chat_id: t.chat,");

// 3) /kubok id va /kubok ulash
const cmd = `const cur = T(chat);
  if (/^\\s*id\\s*$/i.test(arg || '')) return G.tg('sendMessage', { chat_id: chat, text: 'Guruh ID: ' + chat });
  const lm = /^\\s*ulash\\s+(-?\\d+)/i.exec(arg || '');
  if (lm) {
    if (!(await isChatAdmin(chat, uid))) return G.tg('sendMessage', { chat_id: chat, text: 'Ulashni faqat guruh admini qila oladi.' });
    const tt = T(lm[1]);
    if (!tt || tt.v !== 2 || tt.status !== 'reg') return G.tg('sendMessage', { chat_id: chat, text: 'Ro‘yxati ochiq kubok topilmadi. Avval birinchi guruhda /kubok yozing.' });
    tt.mir = tt.mir || {};
    const rr = await G.tg('sendMessage', { chat_id: chat, text: tourText(tt), parse_mode: 'HTML', reply_markup: tourKb(tt) });
    if (rr && rr.result) { tt.mir[String(chat)] = rr.result.message_id; G.tg('pinChatMessage', { chat_id: chat, message_id: rr.result.message_id, disable_notification: true }); }
    store.save(); tourEdit(tt);
    return;
  }`;
rep('const cur = T(chat);', cmd);

fs.writeFileSync('gcup.js', s);
console.log('Jami almashtirish:', n);
