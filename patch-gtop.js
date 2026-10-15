const fs = require('fs');
if (fs.readFileSync('bot.js', 'utf8').includes('onCallback')) { console.log('Allaqachon bor'); process.exit(0); }
function edit(file, reps) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('XATO: ' + file + ' -> ' + a.slice(0, 50) + ' (' + n + ')'); process.exit(1); }
    s = s.replace(a, () => b);
  }
  return s;
}
const BTN = "{ text: '🏆 TOP', callback_data: 'top10' }";
const fn = `async function onCallback(q) {
    if (q.data !== 'top10') return;
    let txt = '🏆 TOP 10';
    try {
      const st = require('./store');
      const ids = new Set((st.db.puzzles || []).map(x => x.id));
      const rows = Object.values(st.users()).map(v => ({ name: Array.from(String(v.name || 'Foydalanuvchi')).slice(0, 12).join(''), n: (v.solved || []).filter(i => ids.has(i)).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).slice(0, 10);
      if (!rows.length) txt += '\\nHozircha hech kim yechmagan';
      for (let i = 0; i < rows.length; i++) {
        const line = '\\n' + (i + 1) + '. ' + rows[i].name + ' — ' + rows[i].n;
        if (Array.from(txt + line).length > 200) break;
        txt += line;
      }
    } catch (e) { txt = 'TOP hozircha mavjud emas'; }
    try { await api("answerCallbackQuery", { callback_query_id: q.id, text: txt, show_alert: true }); } catch (e) {}
  }
  let offset = 0;`;
const out = {
  'bot.js': edit('bot.js', [
    ['let offset = 0;', fn],
    ['["message", "inline_query", "pre_checkout_query"]', '["message", "inline_query", "pre_checkout_query", "callback_query"]'],
    ['else if (u.inline_query) await onInline(u.inline_query);', 'else if (u.inline_query) await onInline(u.inline_query);\n          else if (u.callback_query) await onCallback(u.callback_query);']
  ]),
  'economy.js': edit('economy.js', [
    ["url: _lk + '?startapp=pz_' + id }]]", "url: _lk + '?startapp=pz_' + id }, " + BTN + "]]"]
  ]),
  'grpupd.js': edit('grpupd.js', [
    ["'?startapp=pz_' + pz.id }]] }", "'?startapp=pz_' + pz.id }, " + BTN + "]] }"]
  ])
};
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
