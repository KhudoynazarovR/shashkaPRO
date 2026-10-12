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

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

// HTTP: GET /api/economy, GET /api/balance, POST /api/daily (sarlavha: x-init-data)
function handle(req, res, url) {
  const p = url.pathname;
  if (p === '/api/economy' && req.method === 'GET') { send(res, 200, CFG); return true; }
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
