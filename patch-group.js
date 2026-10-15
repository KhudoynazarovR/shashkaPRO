const fs = require('fs');
let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('GROUP_CHAT_ID')) { console.log('Allaqachon bor'); process.exit(0); }
const from = "send(res, 200, { ok: true, id });";
const n = E.split(from).length - 1;
if (n !== 1) { console.log('XATO: ' + n + ' marta topildi'); process.exit(1); }
const add = `try {
        const _gc = process.env.GROUP_CHAT_ID, _lk = process.env.TG_APP_LINK;
        if (_gc && _lk && process.env.BOT_TOKEN) {
          const _lv = ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'][[1, 2, 3].includes(j.level) ? j.level : 1];
          const _pb = { chat_id: _gc, text: '🧩 Yangi shashka masalasi!\\n' + String(j.title || 'Masala').replace(/[<>]/g, '').trim().slice(0, 40) + '\\n' + _lv + ' · ' + (j.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi'),
            reply_markup: { inline_keyboard: [[{ text: '🧩 Yechish', url: _lk + '?startapp=pz_' + id }]] } };
          if (process.env.GROUP_TOPIC_ID) _pb.message_thread_id = Number(process.env.GROUP_TOPIC_ID);
          fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_pb) })
            .then(r => r.json()).then(d => { if (!d.ok) console.log('Guruhga yuborilmadi:', d.description); }).catch(e => console.log('Guruh xatosi:', e.message));
        }
      } catch (e) {}
      `;
E = E.replace(from, () => add + from);
fs.writeFileSync('economy.js', E);
console.log('TAYYOR');
