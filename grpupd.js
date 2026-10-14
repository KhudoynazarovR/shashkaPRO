const T = new Map();
module.exports = function (pz, cnt) {
  const g = pz.g;
  if (!g || !process.env.BOT_TOKEN || T.has(pz.id)) return;
  T.set(pz.id, setTimeout(() => {
    T.delete(pz.id);
    const names = (pz.sv || []).slice(-5).map(s => String(s).slice(0, 20)).join(', ');
    const txt = g.cap + '\n\n✅ Yechganlar: ' + cnt() + (names ? '\n👤 ' + names : '');
    const kb = process.env.TG_APP_LINK ? { inline_keyboard: [[{ text: '🧩 Yechish', url: process.env.TG_APP_LINK + '?startapp=pz_' + pz.id }]] } : undefined;
    const body = g.ph ? { chat_id: g.c, message_id: g.m, caption: txt.slice(0, 1000), reply_markup: kb } : { chat_id: g.c, message_id: g.m, text: txt, reply_markup: kb };
    fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + (g.ph ? '/editMessageCaption' : '/editMessageText'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.json()).then(d => { if (!d.ok && !/not modified/.test(d.description || '')) console.log('Guruh yangilanmadi:', d.description); }).catch(() => {});
  }, 1500));
};
