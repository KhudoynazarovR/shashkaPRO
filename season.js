'use strict';
// season.js — 🏆 Oylik mavsum: oy oxirida ELO bo'yicha TOP-10 ga sovrin va "Oy chempioni" belgisi.
// Shart: shu oyda kamida 10 ta odam bilan o'yin. ELO qayta tiklanmaydi.
const store = require('./store.js');
const MIN_GAMES = 10;
const PRIZE = [[2000, 30], [1000, 7], [500, 7], [200, 0], [200, 0], [200, 0], [200, 0], [200, 0], [200, 0], [200, 0]];   // [tanga, Premium kun]
const MN = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const month = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 7);
const users = () => store.users();
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }

// stats.record dan: oydagi o'yinlar soni
function onGame(a, b) {
  const m = month();
  for (const id of [a, b]) { const u = users()[String(id)]; if (!u) continue; if (!u.mon || u.mon.m !== m) u.mon = { m, g: 0 }; u.mon.g++; }
}
function board(m) {
  return Object.entries(users()).filter(([id, u]) => /^\d+$/.test(id) && u.mon && u.mon.m === m && u.mon.g >= MIN_GAMES)
    .map(([id, u]) => ({ uid: id, name: u.name || 'O‘yinchi', elo: u.elo || 1000, g: u.mon.g })).sort((a, b) => b.elo - a.elo || b.g - a.g).slice(0, 10);
}
function tick() {
  const db = store.db, m = month();
  if (!db.season) { db.season = { m }; store.save(); return; }
  if (db.season.m === m) return;
  const old = db.season.m, top = board(old), title = (MN[+old.slice(5, 7)] || old) + ' ' + old.slice(0, 4);
  db.seasonLast = { m: old, top: top.map((x, i) => Object.assign({ place: i + 1, coins: PRIZE[i][0], days: PRIZE[i][1] }, x)) };
  db.season = { m }; store.save();
  top.forEach((x, i) => {
    const u = users()[x.uid]; if (!u) return;
    const [c, d] = PRIZE[i];
    try { require('./economy.js').add(x.uid, c, 'season_' + (i + 1)); } catch (e) {}
    if (d) try { require('./premium.js').grant(u, d, 'season'); } catch (e) {}
    u.titles = u.titles || [];
    u.titles.push({ t: (i === 0 ? '🏆 ' + title + ' chempioni' : (i < 3 ? ['', '🥈', '🥉'][i] : '🎖') + ' ' + title + ' TOP-' + (i < 3 ? i + 1 : 10)), m: old });
    if (u.titles.length > 12) u.titles.shift();
    setTimeout(() => tg('sendMessage', { chat_id: x.uid, parse_mode: 'HTML', text: (i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖') + ' <b>' + title + ' mavsumi yakunlandi!</b>\n\nSiz reytingda <b>' + (i + 1) + '-o‘rin</b>ni egalladingiz (ELO ' + x.elo + ').\n\nMukofot: <b>+' + c + ' 🪙</b>' + (d ? ' va <b>' + d + ' kunlik 👑 Premium</b>' : '') + '\nProfilingizga belgi qo‘shildi 🎉' }), i * 150);
  });
  store.save();
  console.log('[season]', old, 'yakunlandi, TOP:', top.length);
}
setInterval(() => { try { tick(); } catch (e) { console.log('[season]', e.message); } }, 3600e3).unref();
setTimeout(() => { try { tick(); } catch (e) {} }, 30000);

function view(uid) {
  const m = month(), u = users()[String(uid)] || {};
  return { m, min: MIN_GAMES, prizes: PRIZE, top: board(m), myGames: u.mon && u.mon.m === m ? u.mon.g : 0, last: store.db.seasonLast || null };
}
module.exports = { onGame, view, tick, board };
