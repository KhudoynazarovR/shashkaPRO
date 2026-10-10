'use strict';
const R = require('./russian-rules');
const store = require('./store');
const { verifyInitData } = require('./auth');

const STRICT = process.env.STRICT_MOVES !== '0';
const MIN_MOVES = 8;
const WIN_DIAMONDS = 25, LOSS_DIAMONDS = 5;

function pub(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, elo: u.elo, diamonds: u.diamonds,
    premium: store.isPremium(u), premiumUntil: u.premiumUntil,
    wins: u.wins, losses: u.losses, games: u.games };
}

function login(c, m) {
  const tg = verifyInitData(m.initData, process.env.BOT_TOKEN);
  if (tg) {
    c.user = store.getOrCreate(tg);
    c.elo = c.user.elo;
    return { ok: true, name: c.user.name };
  }
  c.user = null;
  if (process.env.ALLOW_GUEST === '0') return { ok: false };
  return { ok: true, name: null };
}

function initMatch(match) {
  match.board = R.startPosition();
  match.moves = 0;
  match.trusted = true;
}

function checkMove(match, side, move) {
  const okShape = move && Array.isArray(move.from) && Array.isArray(move.to);
  if (okShape && R.legalMove(match.board, side, move)) {
    match.board = R.applyMove(match.board, move);
    match.moves++;
    return true;
  }
  console.log('[online] rad etilgan yurish:', JSON.stringify(move));
  if (STRICT) return false;
  match.trusted = false;
  try { if (okShape) match.board = R.applyMove(match.board, move); } catch (e) {}
  match.moves++;
  return true;
}

function winnerAfter(match) {
  return R.winnerFor(match.board, match.turn);
}

function claimWinner(match, cid, claimed) {
  const me = match.whiteId === cid ? 'white' : 'black';
  const opp = me === 'white' ? 'black' : 'white';
  if (claimed === me) {
    const w = R.winnerFor(match.board, match.turn);
    return w === me ? me : null;
  }
  return opp; // o'zi yutqazganini tan oladi (taslim yoki vaqt)
}

function reward(match, winner, clients, send) {
  if (!match.trusted || match.moves < MIN_MOVES) return;
  const w = clients.get(winner === 'white' ? match.whiteId : match.blackId);
  const l = clients.get(winner === 'white' ? match.blackId : match.whiteId);
  const wu = w && w.user, lu = l && l.user;
  if (!wu || !lu || wu.id === lu.id) return;

  const exp = 1 / (1 + Math.pow(10, (lu.elo - wu.elo) / 400));
  const delta = Math.max(1, Math.round(32 * (1 - exp)));
  wu.elo += delta;
  lu.elo = Math.max(100, lu.elo - delta);
  const gain = Math.round(WIN_DIAMONDS * (store.isPremium(wu) ? 1.5 : 1));
  wu.diamonds += gain;
  lu.diamonds += LOSS_DIAMONDS;
  wu.wins++; lu.losses++; wu.games++; lu.games++;
  w.elo = wu.elo; l.elo = lu.elo;
  store.save();

  send(w.ws, { type: 'rewards', result: 'win', eloDelta: delta, diamonds: gain, me: pub(wu) });
  send(l.ws, { type: 'rewards', result: 'loss', eloDelta: -delta, diamonds: LOSS_DIAMONDS, me: pub(lu) });
}

module.exports = { pub, login, initMatch, checkMove, winnerAfter, claimWinner, reward };
