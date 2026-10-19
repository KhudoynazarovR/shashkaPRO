const fs = require('fs');
let ok = true;
let s = fs.readFileSync('lobby.js', 'utf8');
if (s.includes('/*TREMIND*/')) console.log('= bor edi: TREMIND');
else if (!s.includes('setInterval(arenaTick, 2000).unref();')) { console.log('✗ TOPILMADI: setInterval(arenaTick'); ok = false; }
else {
  s = s.replace('setInterval(arenaTick, 2000).unref();', `function remindTick() { /*TREMIND*/
    const now = Date.now(), appLink = (process.env.TG_APP_LINK || process.env.APP_LINK || '').replace(/\\/$/, '');
    for (const t of tournaments.values()) {
      if (t.status !== 'reg' || !t.startAt || t.remind15) continue;
      const left = t.startAt - now;
      if (left > 15 * 60000 || left <= 0) continue;
      t.remind15 = true;
      const mins = Math.max(1, Math.round(left / 60000));
      const title = (t.type === 'arena' ? '⚔️ ' : '🏆 ') + t.name;
      const url = appLink ? appLink + '?startapp=lbt_' + t.id : '';
      for (const p of t.players.values()) {
        if (p.withdrawn || !/^\\d+$/.test(String(p.uid))) continue;
        const msg = { chat_id: Number(p.uid), text: '⏰ ' + title + '\\n' + mins + ' daqiqadan keyin boshlanadi!\\n⏱ ' + t.tc + (t.prize ? ' · 🪙 ' + t.prize : '') + ' · 👥 ' + t.players.size + '\\nTayyor turing 💪' };
        if (url) msg.reply_markup = { inline_keyboard: [[{ text: '▶ Turnirga kirish', url }]] };
        tgCall('sendMessage', msg).catch(() => {});
      }
      console.log('[turnir] 15 daqiqa eslatmasi:', t.name);
    }
  }
  setInterval(remindTick, 5000).unref();
  setInterval(arenaTick, 2000).unref();`);
  fs.writeFileSync('lobby.js', s); console.log('✓ TREMIND');
}
let tv = fs.readFileSync('tview.js', 'utf8');
if (tv.includes('__tvRem')) console.log('= bor edi: banner');
else { tv += '\n' + fs.readFileSync('tvrem.js', 'utf8'); fs.writeFileSync('tview.js', tv); console.log('✓ banner'); }
console.log(ok ? '✅ Tayyor' : '⚠️ Ba’zi joylar topilmadi, natijani yuboring');
