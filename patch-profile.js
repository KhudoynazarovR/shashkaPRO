const fs = require('fs');
function patch(file, anchor, add) {
  const s = fs.readFileSync(file, 'utf8');
  if (s.split(anchor).length !== 2) { console.log('ANCHOR XATO:', file); process.exit(1); }
  fs.copyFileSync(file, file + '.before-prof');
  fs.writeFileSync(file, s.replace(anchor, () => anchor + add));
}
patch('lobby.js',
  'c.lb = { uid, name, tg, inRoom: !!m.inRoom };',
  "\n    if (tg) { try { require('./store').getOrCreate({ id: uid, first_name: name }); } catch (e) {} }");
patch('economy.js',
  "if (p === '/api/economy' && req.method === 'GET') { send(res, 200, CFG); return true; }",
  `
  if (p === '/api/profile' && req.method === 'GET') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    send(res, 200, {
      name: u.name, elo: u.elo || 1000, diamonds: u.diamonds || 0,
      wins: u.wins || 0, losses: u.losses || 0, draws: u.draws || 0, games: u.games || 0,
      streak: u.streak || 0, bestStreak: u.bestStreak || 0, hist: u.hist || [],
      created: u.created || 0, log: (u.log || []).slice(-10).reverse(), premium: store.isPremium(u)
    });
    return true;
  }`);
console.log('yangilandi');
