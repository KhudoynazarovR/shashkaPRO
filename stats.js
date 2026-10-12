'use strict';
const store = require('./store');
const K = 32;
const user = id => store.users()[String(id)] || null;
const exp = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));

function apply(u, s, opp) {
  u.games = (u.games || 0) + 1;
  u.wins = u.wins || 0; u.losses = u.losses || 0; u.draws = u.draws || 0;
  u.streak = u.streak || 0; u.bestStreak = u.bestStreak || 0;
  let r = 'd';
  if (s === 1) { u.wins++; u.streak++; r = 'w'; if (u.streak > u.bestStreak) u.bestStreak = u.streak; }
  else if (s === 0) { u.losses++; u.streak = 0; r = 'l'; }
  else { u.draws++; u.streak = 0; }
  u.hist = u.hist || [];
  u.hist.unshift({ t: Date.now(), opp, r });
  if (u.hist.length > 10) u.hist.length = 10;
}

// Faqat ikkala o'yinchi ham ro'yxatdan o'tgan bo'lsa (mehmonlar hisoblanmaydi)
function record(whiteId, blackId, winner) {
  const w = user(whiteId), b = user(blackId);
  if (!w || !b || w === b) return;
  const sw = winner === 'white' ? 1 : winner === 'black' ? 0 : 0.5;
  const ew = exp(w.elo || 1000, b.elo || 1000);
  w.elo = Math.max(100, Math.round((w.elo || 1000) + K * (sw - ew)));
  b.elo = Math.max(100, Math.round((b.elo || 1000) + K * ((1 - sw) - (1 - ew))));
  apply(w, sw, b.name);
  apply(b, 1 - sw, w.name);
  store.save();
}

module.exports = { record };
