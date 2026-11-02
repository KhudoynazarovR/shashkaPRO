const fs = require('fs');
let s = fs.readFileSync('gcup.js', 'utf8');
const add = String.raw`const qm = /^\s*qosh\s+(.+)$/i.exec(arg || '');
  if (qm) {
    if (!cur || cur.v !== 2 || cur.status !== 'reg') return G.tg('sendMessage', { chat_id: chat, text: 'Avval shu guruhda /kubok oching (ro‘yxat bosqichida bo‘lsin).' });
    if (!(uid === cur.by || await isChatAdmin(chat, uid))) return G.tg('sendMessage', { chat_id: chat, text: 'Faqat ' + cur.byName + ' yoki guruh admini ulay oladi.' });
    cur.mir = cur.mir || {};
    const ok = [], bad = [];
    for (const id of (qm[1].match(/-?\d+/g) || [])) {
      if (String(id) === String(chat) || cur.mir[id]) continue;
      if (!(await isChatAdmin(id, uid))) { bad.push(id); continue; }
      const rr = await G.tg('sendMessage', { chat_id: id, text: tourText(cur), parse_mode: 'HTML', reply_markup: tourKb(cur) });
      if (rr && rr.result) { cur.mir[id] = rr.result.message_id; G.tg('pinChatMessage', { chat_id: id, message_id: rr.result.message_id, disable_notification: true }); ok.push(id); }
      else bad.push(id);
    }
    store.save(); tourEdit(cur);
    return G.tg('sendMessage', { chat_id: chat, text: '✅ Ulandi: ' + (ok.join(', ') || 'yo‘q') + (bad.length ? '\n⚠️ Ulanmadi (bot a’zo/admin emas yoki siz u yerda admin emassiz): ' + bad.join(', ') : '') });
  }
  `;
const c = s.split('const lm = ').length - 1;
if (c !== 1) { console.log('Topilmadi/ko‘p:', c); process.exit(1); }
s = s.replace('const lm = ', () => add + 'const lm = ');
fs.writeFileSync('gcup.js', s);
console.log('Qo‘shildi');
