const fs = require('fs');
let E = fs.readFileSync('economy.js', 'utf8');
const a = "if (p === '/api/profile' && req.method === 'GET') {";
if (E.split(a).length - 1 !== 1) { console.log('XATO: topilmadi'); process.exit(1); }
if (E.includes('/api/user/')) { console.log('Allaqachon bor'); process.exit(0); }
E = E.replace(a, () => `if (p.startsWith('/api/user/') && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _id = decodeURIComponent(p.slice(10));
    const _u = store.users()[_id];
    if (!_u) { send(res, 404, { error: 'none' }); return true; }
    send(res, 200, {
      id: _id, name: _u.name || 'Oyinchi', elo: _u.elo || 1000, diamonds: _u.diamonds || 0,
      wins: _u.wins || 0, losses: _u.losses || 0, draws: _u.draws || 0, games: _u.games || 0,
      bestStreak: _u.bestStreak || 0, tournWins: _u.tournWins || 0,
      bio: _u.bio || '', hasAv: !!_u.avatar, premium: !!store.isPremium(_u)
    });
    return true;
  }
  ` + a);
fs.writeFileSync('economy.js', E);
console.log('OK');
