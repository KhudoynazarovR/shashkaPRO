'use strict';
// eco.js — 📊 admin uchun iqtisod statistikasi: kunlik tanga oqimi (sabab bo'yicha), tikish hajmi va yo'q qilingan komissiya,
// Premium (tanga / ⭐ / sovg'a / sinov), Stars to'lovlari, muomaladagi tanga. Kunlik hisoblagich store.db.eco da (45 kun saqlanadi).
const store = require('./store.js');
const KEEP = 45;
const day = (t) => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10);   // Toshkent vaqti
const D = () => { const d = store.db; d.eco = d.eco || { since: day(), days: {} }; return d.eco; };
const cat = why => String(why || '?').replace(/_\d+$/, '').replace(/_(out|in)_.*$/, '_$1').slice(0, 24);
function cur() {
  const E = D(), k = day();
  if (!E.days[k]) { E.days[k] = { c: {}, pr: {}, st: 0, stn: 0 }; const ks = Object.keys(E.days).sort(); while (ks.length > KEEP) delete E.days[ks.shift()]; }
  return E.days[k];
}
// economy.js note() dan: d > 0 — tushum, d < 0 — sarf
function coin(d, why) {
  try { const c = cur().c, k = cat(why), x = c[k] = c[k] || [0, 0, 0]; if (d > 0) x[0] += d; else x[1] += -d; x[2]++; } catch (e) {}
}
// premium.grant dan
function prem(why, days) {
  try { const w = String(why || ''), k = /^coins_/.test(w) ? 'coins' : /^stars_.*renew/.test(w) ? 'renew' : /^stars_/.test(w) ? 'stars' : /^gift_/.test(w) ? 'gift' : /trial/.test(w) ? 'trial' : 'bonus'; const p = cur().pr; p[k] = (p[k] || 0) + 1; } catch (e) {}
}
// ⭐ to'lov (premium yoki tanga paketi)
function fee(n) { try { const d = cur(); d.wf = (d.wf || 0) + (Number(n) || 0); } catch (e) {} }
function stars(n) { try { const d = cur(); d.st += Number(n) || 0; d.stn++; } catch (e) {} }

const sum = (o, keys, i) => keys.reduce((s, k) => s + ((o[k] || [])[i] || 0), 0);
function view() {
  const E = D(), us = Object.values(store.users()), now = Date.now();
  let coins = 0, rich = 0, premA = 0, trialA = 0, wgN = 0, wgPl = 0;
  for (const u of us) {
    coins += u.diamonds || 0; if ((u.diamonds || 0) >= 1000) rich++;
    if ((u.premiumUntil || 0) > now) { premA++; if (u.trialEnd && u.premiumUntil <= u.trialEnd + 60000) trialA++; }
    if (u.wg && u.wg.n) { wgPl++; wgN += u.wg.n; }
  }
  const days = Object.keys(E.days).sort().reverse().slice(0, 14).map(k => {
    const x = E.days[k], c = x.c || {}, ks = Object.keys(c);
    const lock = (c.wager_lock || [0, 0])[1];
    return {
      day: k, minted: sum(c, ks, 0), burned: sum(c, ks, 1),
      wager: { vol: lock, games: Math.round(((c.wager_lock || [0, 0, 0])[2]) / 2), fee: x.wf || 0 },
      premCoins: sum(c, ks.filter(k => /^premium_/.test(k)), 1), prem: x.pr || {}, stars: x.st || 0, starsN: x.stn || 0,
      gifts: sum(c, ks.filter(k => /^gift_/.test(k)), 1),
      top: ks.map(k => ({ k, in: c[k][0], out: c[k][1], n: c[k][2] })).sort((a, b) => (b.in + b.out) - (a.in + a.out)).slice(0, 12)
    };
  });
  let wtop = []; try { wtop = require('./wager.js').top().slice(0, 5); } catch (e) {}
  let corr = 0; try { corr = Object.values((store.db.corr || {}).g || {}).filter(g => !g.end).length; } catch (e) {}
  return { since: E.since, users: us.length, coins, rich, premA, trialA, paidA: premA - trialA, wgPl, wgN, corr, wtop, days };
}
// HTTP: /api/admin/eco (faqat admin)
function handle(req, res, p, h) {
  if (p !== '/api/admin/eco') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t || !require('./kkbook.js').isAdmin(t.id)) { h.send(res, 403, { error: 'Faqat admin uchun' }); return true; }
  h.send(res, 200, view()); return true;
}
module.exports = { coin, prem, stars, fee, view, day, handle };
