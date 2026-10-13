'use strict';
const store = require('./store');
const { verifyInitData } = require('./auth');

const CFG = {
  CREATE_COST: 100,
  JOIN_FEE: 10,
  DAILY_BONUS: 20,
  WIN_CASUAL: 1,
  WIN_TOURNAMENT: 3,
  CASUAL_WINS_PER_DAY: 20,
  SAME_OPPONENT_PER_DAY: 3,
  TOURNAMENT_WINS_CAP: 10,
  HOST_TIERS: [[150, 1000], [100, 350], [50, 150]],
};

const today = () => new Date().toISOString().slice(0, 10);
const user = (id) => store.users()[String(id)] || null;

function note(u, d, why) {
  u.log = u.log || [];
  u.log.push({ t: Date.now(), d, why });
  if (u.log.length > 30) u.log.shift();
}
function add(id, n, why) {
  const u = user(id);
  if (!u || n <= 0) return false;
  u.diamonds = (u.diamonds || 0) + n;
  note(u, n, why);
  store.save();
  return true;
}
function spend(id, n, why) {
  const u = user(id);
  if (!u || (u.diamonds || 0) < n) return false;
  u.diamonds -= n;
  note(u, -n, why);
  store.save();
  return true;
}
function balance(id) { const u = user(id); return u ? (u.diamonds || 0) : 0; }

function claimDaily(id) {
  const u = user(id);
  if (!u) return { ok: false, error: 'no_user' };
  const d = today();
  if (u.lastDaily === d) return { ok: false, error: 'already', diamonds: u.diamonds };
  u.lastDaily = d;
  add(id, CFG.DAILY_BONUS, 'daily');
  return { ok: true, amount: CFG.DAILY_BONUS, diamonds: u.diamonds };
}

function dayState(u) {
  const d = today();
  if (!u.eco || u.eco.day !== d) u.eco = { day: d, wins: 0, opp: {}, tw: {} };
  return u.eco;
}

// G'alaba mukofoti. tournamentId berilsa turnir g'alabasi (+3), bo'lmasa oddiy (+1).
// Qancha olmos berilganini qaytaradi (0 = limit yoki aldash himoyasi).
function rewardWin(winnerId, loserId, tournamentId) {
  const u = user(winnerId);
  if (!u || String(winnerId) === String(loserId)) return 0;
  const e = dayState(u);
  if (tournamentId) {
    const k = String(tournamentId);
    if ((e.tw[k] || 0) >= CFG.TOURNAMENT_WINS_CAP) return 0;
    e.tw[k] = (e.tw[k] || 0) + 1;
    add(winnerId, CFG.WIN_TOURNAMENT, 'tournament_win');
    return CFG.WIN_TOURNAMENT;
  }
  const o = String(loserId);
  if (e.wins >= CFG.CASUAL_WINS_PER_DAY) return 0;
  if ((e.opp[o] || 0) >= CFG.SAME_OPPONENT_PER_DAY) return 0;
  e.wins++;
  e.opp[o] = (e.opp[o] || 0) + 1;
  add(winnerId, CFG.WIN_CASUAL, 'win');
  return CFG.WIN_CASUAL;
}

// Turnir yaratish / qatnashish to'lovi. { ok:false, error:'no_diamonds' } qaytarishi mumkin.
function chargeCreate(id) {
  return spend(id, CFG.CREATE_COST, 'tournament_create') ? { ok: true } : { ok: false, error: 'no_diamonds', need: CFG.CREATE_COST };
}
function chargeJoin(id) {
  return spend(id, CFG.JOIN_FEE, 'tournament_join') ? { ok: true } : { ok: false, error: 'no_diamonds', need: CFG.JOIN_FEE };
}
function refund(id, n, why) { return add(id, n, why || 'refund'); }

function hostBonus(n) {
  for (const [min, amt] of CFG.HOST_TIERS) if (n > min) return amt;
  return 0;
}
// Turnir tugaganda chaqiring. participantIds = to'lov qilib qatnashganlar.
function finishTournament(creatorId, participantIds) {
  const set = new Set(participantIds.map(String));
  set.delete(String(creatorId));
  const bonus = hostBonus(set.size);
  if (bonus) add(creatorId, bonus, 'host_bonus_' + set.size);
  return { participants: set.size, bonus };
}

function readBody(req, max, cb) {
  let d = '', big = false;
  req.on('data', c => { d += c; if (d.length > max) { big = true; req.destroy(); } });
  req.on('end', () => { if (!big) cb(d); });
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

// HTTP: GET /api/economy, GET /api/balance, POST /api/daily (sarlavha: x-init-data)
function handle(req, res, url) {
  const p = url.pathname;
  if (p === '/api/economy' && req.method === 'GET') { send(res, 200, CFG); return true; }
  if (p.startsWith('/api/av/') && req.method === 'GET') {
    const _u = store.users()[decodeURIComponent(p.slice(8))];
    const _m = /^data:image\/jpeg;base64,(.+)$/.exec((_u && _u.avatar) || '');
    if (!_m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=300' });
    res.end(Buffer.from(_m[1], 'base64'));
    return true;
  }
  if ((p === '/api/avatar' || p === '/api/bio') && req.method === 'POST') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    readBody(req, 200000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      if (p === '/api/avatar') {
        const a = String(j.img || '');
        if (!/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(a) || a.length > 150000) return send(res, 400, { error: 'bad_image' });
        u.avatar = a;
      } else {
        u.bio = String(j.bio || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 120);
      }
      store.save();
      send(res, 200, { ok: true });
    });
    return true;
  }

  if (p === '/api/feedback' && req.method === 'POST') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    let raw = '';
    req.on('data', d => { raw += d; if (raw.length > 4000) req.destroy(); });
    req.on('end', () => {
      let text = '';
      try { text = String((JSON.parse(raw) || {}).text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 1000); } catch (e) {}
      if (text.length < 5) return send(res, 400, { error: 'Xabar juda qisqa' });
      const who = tg ? ((tg.first_name || tg.name || '') + ' #' + tg.id) : 'mehmon';
      global.__fbAt = global.__fbAt || {};
      const k = tg ? String(tg.id) : (req.socket.remoteAddress || 'x');
      const now = Date.now(), arr = (global.__fbAt[k] || []).filter(t => now - t < 3600000);
      if (arr.length >= 5) return send(res, 429, { error: 'Juda ko‘p xabar. Keyinroq urinib ko‘ring' });
      arr.push(now); global.__fbAt[k] = arr;
      try { require('fs').appendFileSync(require('path').join(__dirname, 'feedback.txt'), new Date().toISOString() + ' | ' + who + ' | ' + text + '\n'); } catch (e) {}
      try {
        if (process.env.ADMIN_ID && process.env.BOT_TOKEN) {
          const body = JSON.stringify({ chat_id: process.env.ADMIN_ID, text: '💬 Taklif/shikoyat\n' + who + '\n\n' + text });
          const r = require('https').request({ hostname: 'api.telegram.org', path: '/bot' + process.env.BOT_TOKEN + '/sendMessage', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } });
          r.on('error', () => {}); r.end(body);
        }
      } catch (e) {}
      send(res, 200, { ok: true });
    });
    return true;
  }
  if (p === '/api/leaderboard' && req.method === 'GET') {
    const all = Object.entries(store.users()).map(([id, u]) => {
      const g = u.games || 0, w = u.wins || 0;
      return {
        id, name: u.name || 'Oyinchi', elo: u.elo || 1000, diamonds: u.diamonds || 0,
        games: g, wins: w, losses: u.losses || 0, draws: u.draws || 0,
        best: u.bestStreak || 0, tw: u.tournWins || 0, pct: g >= 20 ? Math.round(w * 100 / g) : 0,
        av: (u.avatar && u.avatar.length < 500) ? u.avatar : '',
        hasAv: !!u.avatar, premium: !!store.isPremium(u)
      };
    });
    const top = (key, minGames) => all.filter(x => x.games >= (minGames || 0) && x[key] > 0)
      .sort((a, b) => b[key] - a[key] || b.elo - a.elo).slice(0, 30);
    send(res, 200, {
      total: all.length,
      elo: all.slice().sort((a, b) => b.elo - a.elo || b.games - a.games).slice(0, 30),
      wins: top('wins'), games: top('games'), diamonds: top('diamonds'),
      best: top('best'), tourn: all.filter(x => x.tw > 0).sort((a, b) => b.tw - a.tw || b.elo - a.elo).slice(0, 30), pct: top('pct', 20)
    });
    return true;
  }
  if (p.startsWith('/api/user/') && req.method === 'GET') {
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
  if (p === '/api/archive' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _u = store.users()[String(_tg.id)] || {};
    send(res, 200, { list: _u.arch || [] });
    return true;
  }
  if (p === '/api/puzzles' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    store.db.puzzles = store.db.puzzles || [];
    const _u = store.users()[String(_tg.id)] || {};
    const _adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
    send(res, 200, { admin: _adm, myId: String(_tg.id), solved: _u.solved || [], list: store.db.puzzles });
    return true;
  }
  if ((p === '/api/puzzle' || p === '/api/puzzle/del' || p === '/api/puzzle/solved') && req.method === 'POST') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    readBody(req, 100000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      const arr = store.db.puzzles = store.db.puzzles || [];
      if (p === '/api/puzzle/solved') {
        const pz = arr.find(x => x.id === j.id);
        if (!pz) return send(res, 404, { error: 'none' });
        const u = store.getOrCreate(_tg);
        u.solved = u.solved || [];
        let gain = 0;
        if (!u.solved.includes(pz.id)) { u.solved.push(pz.id); gain = 5; u.diamonds = (u.diamonds || 0) + gain; store.save(); }
        return send(res, 200, { ok: true, gain });
      }
      const adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
      if (!adm) return send(res, 403, { error: 'admin emassiz' });
      if (p === '/api/puzzle/del') {
        const i = arr.findIndex(x => x.id === j.id);
        if (i >= 0) { arr.splice(i, 1); store.save(); }
        return send(res, 200, { ok: true });
      }
      const b = j.board; const _sols = Array.isArray(j.sols) ? j.sols.slice(0, 10) : [j.sol]; const sol = _sols[0];
      const okB = Array.isArray(b) && b.length === 8 && b.every(r => Array.isArray(r) && r.length === 8 && r.every(v => Number.isInteger(v) && v >= 0 && v <= 4));
      const okS = _sols.length >= 1 && _sols.every(sl => Array.isArray(sl) && sl.length >= 1 && sl.length <= 60 && sl.every(s => Array.isArray(s) && s.length === 4 && s.every(v => Number.isInteger(v) && v >= 0 && v < 8)));
      if (!okB || !okS || (j.side !== 'w' && j.side !== 'b')) return send(res, 400, { error: 'noto‘g‘ri ma‘lumot' });
      const id = 'p' + Date.now().toString(36);
      arr.push({ id, title: String(j.title || 'Masala').replace(/[<>]/g, '').trim().slice(0, 40) || 'Masala', level: [1, 2, 3].includes(j.level) ? j.level : 1, side: j.side, board: b, sol, sols: _sols, at: Date.now() });
      store.save();
      send(res, 200, { ok: true, id });
    });
    return true;
  }
  if (p === '/api/profile' && req.method === 'GET') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    send(res, 200, {
      name: u.name, elo: u.elo || 1000, diamonds: u.diamonds || 0,
      wins: u.wins || 0, losses: u.losses || 0, draws: u.draws || 0, games: u.games || 0,
      streak: u.streak || 0, bestStreak: u.bestStreak || 0, hist: u.hist || [],
      created: u.created || 0, avatar: u.avatar || '', bio: u.bio || '', log: (u.log || []).slice(-10).reverse(), premium: store.isPremium(u)
    });
    return true;
  }
  if ((p === '/api/balance' && req.method === 'GET') || (p === '/api/daily' && req.method === 'POST')) {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    if (p === '/api/daily') send(res, 200, claimDaily(tg.id));
    else send(res, 200, { diamonds: u.diamonds || 0, canClaimDaily: u.lastDaily !== today() });
    return true;
  }
  return false;
}

module.exports = { CFG, balance, add, spend, claimDaily, rewardWin, chargeCreate, chargeJoin, refund, finishTournament, hostBonus, handle };
