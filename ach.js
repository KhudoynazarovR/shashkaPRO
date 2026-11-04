'use strict';
// ach.js — 🏅 Yutuqlar: o'yinchi statistikasidan hisoblanadi (eski o'yinchilarga ham avtomatik ochiladi).
// Har yangi yutuq — tanga mukofoti va bot xabari.
const store = require('./store.js');
const A = [
  // [id, belgi, nomi, sharti matni, mukofot, tekshiruv(u)]
  ['win1', '🥇', 'Birinchi g‘alaba', 'Odamni 1 marta yuting', 20, u => (u.wins || 0) >= 1],
  ['win10', '⚔️', 'Jangchi', '10 ta g‘alaba', 50, u => (u.wins || 0) >= 10],
  ['win100', '🗡', 'Usta', '100 ta g‘alaba', 200, u => (u.wins || 0) >= 100],
  ['win500', '🏯', 'Afsona', '500 ta g‘alaba', 1000, u => (u.wins || 0) >= 500],
  ['games50', '🎮', 'Faol o‘yinchi', '50 ta o‘yin', 50, u => (u.games || 0) >= 50],
  ['games500', '🕹', 'Shashka ishqibozi', '500 ta o‘yin', 300, u => (u.games || 0) >= 500],
  ['streak5', '🔥', 'Seriya', 'Ketma-ket 5 g‘alaba', 50, u => (u.bestStreak || 0) >= 5],
  ['streak10', '☄️', 'To‘xtatib bo‘lmas', 'Ketma-ket 10 g‘alaba', 200, u => (u.bestStreak || 0) >= 10],
  ['elo1200', '📈', 'Havaskor', 'ELO 1200', 50, u => (u.elo || 0) >= 1200],
  ['elo1500', '🎯', 'Kuchli o‘yinchi', 'ELO 1500', 200, u => (u.elo || 0) >= 1500],
  ['elo1800', '💎', 'Ustoz', 'ELO 1800', 500, u => (u.elo || 0) >= 1800],
  ['tourn1', '🏆', 'Turnir g‘olibi', '1 ta turnirda g‘olib', 100, u => (u.tournWins || 0) >= 1],
  ['tourn5', '👑', 'Chempion', '5 ta turnirda g‘olib', 400, u => (u.tournWins || 0) >= 5],
  ['legend', '🦁', 'Legendni yutdi', 'Legend BOT ni yuting', 100, u => !!(u.botWins && u.botWins.bot_champ)],
  ['monster', '👹', 'Monsterni yutdi', 'Monster BOT ni yuting', 200, u => !!(u.botWins && u.botWins.bot_monster)],
  ['terminator', '🦾', 'Terminatorni yutdi', 'Terminator BOT ni yuting', 400, u => !!(u.botWins && u.botWins.bot_terminator)],
  ['kingkong', '🦍', 'King Kongni yutdi', 'King Kong BOT ni yuting', 1000, u => !!(u.botWins && u.botWins.bot_kingkong)],
  ['daily7', '📅', 'Sodiq o‘yinchi', '7 kun ketma-ket kiring', 50, u => ((u.strk && u.strk.best) || 0) >= 7],
  ['daily30', '🗓', 'Har kuni shu yerda', '30 kun ketma-ket kiring', 300, u => ((u.strk && u.strk.best) || 0) >= 30],
  ['friends5', '🤝', 'Do‘stona', '5 ta do‘st', 30, u => (u.friends || []).length >= 5],
  ['ref1', '📣', 'Taklifchi', '1 ta faol do‘st taklif qiling', 50, u => (u.refAct || 0) >= 1],
  ['region', '🗺', 'Vatanparvar', 'Viloyatingizni tanlang', 10, u => !!u.region],
  ['avatar', '🖼', 'Yuzim bor', 'Profil rasmini qo‘ying', 10, u => !!u.avatar],
];
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }

// yangi ochilganlarini belgilaydi, tanga beradi; ochilganlar ro'yxatini qaytaradi
function sync(uid, opts) {
  const u = store.users()[String(uid)]; if (!u || !/^\d+$/.test(String(uid))) return [];
  u.ach = u.ach || {};
  const first = !u.achInit;   // birinchi tekshiruv: eski yutuqlar jim va tangasiz ochiladi
  const fresh = [];
  for (const [id, ic, name, , coins, ok] of A) {
    if (u.ach[id]) continue;
    let y = false; try { y = ok(u); } catch (e) {}
    if (!y) continue;
    u.ach[id] = Date.now(); fresh.push({ id, ic, name, coins: first ? 0 : coins });
    if (!first) u.diamonds = (u.diamonds || 0) + coins;   // eski (oldin bajarilgan) yutuqlar tangasiz ochiladi — iqtisod buzilmasin
  }
  if (first) u.achInit = Date.now();
  if (fresh.length) {
    store.save();
    if (!first && !(opts && opts.quiet)) {
      const sum = fresh.reduce((s, x) => s + x.coins, 0);
      tg('sendMessage', { chat_id: String(uid), parse_mode: 'HTML', text: '🏅 <b>Yangi yutuq' + (fresh.length > 1 ? 'lar' : '') + '!</b>\n\n' + fresh.map(x => x.ic + ' <b>' + x.name + '</b> — +' + x.coins + ' 🪙').join('\n') + (fresh.length > 1 ? '\n\nJami: +' + sum + ' 🪙' : '') });
    }
  }
  return fresh;
}
function list(uid, own) {
  const u = store.users()[String(uid)] || {}, got = u.ach || {};
  const all = A.map(([id, ic, name, cond, coins]) => ({ id, ic, name, cond, coins, at: got[id] || 0 }));
  return { n: all.filter(x => x.at).length, total: A.length, list: own ? all : all.filter(x => x.at) };
}
module.exports = { A, sync, list };
