const fs = require('fs');
if (fs.readFileSync('economy.js', 'utf8').includes('EXTRA_GROUP_IDS')) { console.log('Allaqachon bor'); process.exit(0); }
function edit(file, reps) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('XATO: ' + file + ' -> ' + a.slice(0, 50) + ' (' + n + ')'); process.exit(1); }
    s = s.replace(a, () => b);
  }
  return s;
}
const MYCHAT = `function onMyChat(m) {
    try {
      const ch = m.chat || {};
      if (ch.type !== 'group' && ch.type !== 'supergroup') return;
      const st = (m.new_chat_member || {}).status;
      const adm = st === 'administrator' || st === 'creator';
      const s = require('./store');
      s.db.groups = s.db.groups || [];
      const id = String(ch.id), i = s.db.groups.findIndex(x => String(x) === id);
      if (adm && i < 0) { s.db.groups.push(ch.id); console.log('[bot] guruh qo‘shildi:', ch.title, id); s.save(); }
      else if (!adm && i >= 0) { s.db.groups.splice(i, 1); console.log('[bot] guruh o‘chirildi:', ch.title, id); s.save(); }
    } catch (e) { console.log('[bot] my_chat_member xato:', e.message); }
  }
  async function onCallback(q) {`;
const out = {
  'store.js': edit('store.js', [
    ['if (!db.users) db.users = {};', 'if (!db.users) db.users = {};\nif (!Array.isArray(db.groups)) db.groups = [];'],
    ['if (r.rows[0].v && Array.isArray(r.rows[0].v.shop)) db.shop = r.rows[0].v.shop;',
     'if (r.rows[0].v && Array.isArray(r.rows[0].v.shop)) db.shop = r.rows[0].v.shop;\n        if (r.rows[0].v && Array.isArray(r.rows[0].v.groups)) db.groups = r.rows[0].v.groups;']
  ]),
  'bot.js': edit('bot.js', [
    ['async function onCallback(q) {', MYCHAT],
    ['"pre_checkout_query", "callback_query"]', '"pre_checkout_query", "callback_query", "my_chat_member"]'],
    ['else if (u.callback_query) await onCallback(u.callback_query);', 'else if (u.callback_query) await onCallback(u.callback_query);\n          else if (u.my_chat_member) onMyChat(u.my_chat_member);']
  ]),
  'economy.js': edit('economy.js', [
    ["require('./puzimg.js')(_pb, b, j.side)",
     "Array.from(new Set([String(_gc)].concat((store.db.groups || []).map(String), String(process.env.EXTRA_GROUP_IDS || '').split(',').map(x => x.trim()).filter(Boolean)))).forEach((_cid, _ix) => { const _pb2 = Object.assign({}, _pb, { chat_id: _cid }); if (_ix > 0) delete _pb2.message_thread_id; setTimeout(() => { require('./puzimg.js')(_pb2, b, j.side)"],
    ["_pz.g = { m: d.result.message_id, c: (d.result.chat && d.result.chat.id) || _gc, ph:",
     "_pz.gs = _pz.gs || []; _pz.gs.push({ m: d.result.message_id, c: (d.result.chat && d.result.chat.id) || _cid, ph:"],
    [": _pb.text }; store.save(); } })", ": _pb.text }); if (!_pz.g) _pz.g = _pz.gs[0]; store.save(); } })"],
    [".catch(e => console.log('Guruh xatosi:', e.message));", ".catch(e => console.log('Guruh xatosi:', _cid, e.message)); }, _ix * 400); });"]
  ])
};
for (const f in out) fs.writeFileSync(f, out[f]);
fs.writeFileSync('grpupd.js', `const T = new Map();
module.exports = function (pz, cnt) {
  const list = (pz.gs && pz.gs.length) ? pz.gs : (pz.g ? [pz.g] : []);
  if (!list.length || !process.env.BOT_TOKEN || T.has(pz.id)) return;
  T.set(pz.id, setTimeout(() => {
    T.delete(pz.id);
    const names = (pz.sv || []).slice(-5).map(s => String(s).slice(0, 20)).join(', ');
    const n = cnt();
    const row = [{ text: '🏆 TOP', callback_data: 'top10' }];
    if (process.env.TG_APP_LINK) row.unshift({ text: '🧩 Yechish', url: process.env.TG_APP_LINK + '?startapp=pz_' + pz.id });
    const kb = { inline_keyboard: [row] };
    list.forEach((g, i) => setTimeout(() => {
      const txt = g.cap + '\\n\\n✅ Yechganlar: ' + n + (names ? '\\n👤 ' + names : '');
      const body = g.ph ? { chat_id: g.c, message_id: g.m, caption: txt.slice(0, 1000), reply_markup: kb } : { chat_id: g.c, message_id: g.m, text: txt, reply_markup: kb };
      fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + (g.ph ? '/editMessageCaption' : '/editMessageText'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(r => r.json()).then(d => { if (!d.ok && !/not modified/.test(d.description || '')) console.log('Guruh yangilanmadi:', g.c, d.description); }).catch(() => {});
    }, i * 300));
  }, 1500));
};
`);
console.log('TAYYOR');
