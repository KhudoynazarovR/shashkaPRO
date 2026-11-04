'use strict';
// gift.js — 🎁 boshqa o'yinchiga tanga yoki 👑 Premium sovg'a qilish (profil oynasidan).
// Tanga: xizmat haqi 5% (kamida 5 🪙); yuboruvchi ≥3 kunlik va ≥10 o'yin; kuniga ≤1000 🪙; bir odamga kuniga 1 marta.
const store = require('./store.js');
const DAY = 86400e3;
const FEE_PCT = 0.05, FEE_MIN = 5, DAY_MAX = 1000, MIN_AGE = 3 * DAY, MIN_GAMES = 10;
const users = () => store.users();
const nm = u => String((u && u.name) || 'O‘yinchi').slice(0, 30);
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const fee = n => Math.max(FEE_MIN, Math.ceil(n * FEE_PCT));
const dayKey = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
const appLink = () => (process.env.TG_APP_LINK || process.env.APP_LINK || 'https://t.me/DraughtsPRObot/play').replace(/\/$/, '');
const dm = (uid, text) => /^\d+$/.test(String(uid)) && tg('sendMessage', { _cat: 'game', chat_id: String(uid), text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🎮 Ilovani ochish', url: appLink() }]] } });

function check(me, to) {
  const us = users(), a = us[me], b = us[to];
  if (!a) return { error: 'Avval ilovaga kiring' };
  if (!b || !/^\d+$/.test(to)) return { error: 'O‘yinchi topilmadi' };
  if (me === to) return { error: 'O‘zingizga sovg‘a qilib bo‘lmaydi' };
  if ((a.blocked || []).includes(to)) return { error: 'Avval blokdan chiqaring' };
  if ((b.blocked || []).includes(me)) return { error: 'Bu o‘yinchi sovg‘a qabul qilmaydi' };
  return { a, b };
}
function state(a) { const d = dayKey(); if (!a.gift || a.gift.d !== d) a.gift = { d, sum: 0, to: {} }; return a.gift; }

function coins(me, to, amount) {
  me = String(me); to = String(to);
  const c = check(me, to); if (c.error) return c;
  const n = Math.floor(Number(amount));
  if (!(n >= 1 && n <= 100000)) return { error: 'Miqdorni kiriting' };
  const { a, b } = c;
  if (Date.now() - (a.created || 0) < MIN_AGE) return { error: 'Tanga sovg‘a qilish ro‘yxatdan o‘tgach 3 kundan keyin ochiladi' };
  if ((a.games || 0) < MIN_GAMES) return { error: 'Tanga sovg‘a qilish uchun kamida ' + MIN_GAMES + ' ta o‘yin o‘ynagan bo‘lish kerak (sizda ' + (a.games || 0) + ')' };
  const g = state(a);
  if (g.to[to]) return { error: 'Bu o‘yinchiga bugun sovg‘a yuborgansiz' };
  if (g.sum + n > DAY_MAX) return { error: 'Kuniga ' + DAY_MAX + ' 🪙 gacha yuborish mumkin (bugun qoldi: ' + Math.max(0, DAY_MAX - g.sum) + ')' };
  const f = fee(n), E = require('./economy.js');
  if ((a.diamonds || 0) < n + f) return { error: 'Tanga yetmaydi: ' + (n + f) + ' 🪙 kerak' };
  if (!E.spend(me, n + f, 'gift_out_' + to)) return { error: 'Tanga yetmaydi' };
  E.add(to, n, 'gift_in_' + me);
  g.sum += n; g.to[to] = n; store.save();
  dm(to, '🎁 <b>' + esc(nm(a)) + '</b> sizga <b>' + n + ' 🪙</b> sovg‘a qildi!\n\nBalansingiz: ' + (b.diamonds || 0) + ' 🪙');
  return { ok: true, sent: n, fee: f, diamonds: a.diamonds };
}

function premium(me, to, plan) {
  me = String(me); to = String(to);
  const c = check(me, to); if (c.error) return c;
  const P = require('./premium.js'), p = P.PLANS[plan];
  if (!p || plan === 'y') return { error: 'Tarifni tanlang' };
  const { a, b } = c;
  if ((a.diamonds || 0) < p.coins) return { error: 'Tanga yetmaydi: ' + p.coins + ' 🪙 kerak' };
  if (!require('./economy.js').spend(me, p.coins, 'gift_prem_' + to)) return { error: 'Tanga yetmaydi' };
  const until = P.grant(b, p.days, 'gift_' + me);
  const d = new Date(until + 5 * 3600e3), dmy = String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear();
  dm(to, '👑 <b>' + esc(nm(a)) + '</b> sizga <b>' + (plan === 'm' ? '1 oylik' : '1 haftalik') + ' Premium</b> sovg‘a qildi!\n\n⏳ <i>' + dmy + ' gacha amal qiladi</i>');
  return { ok: true, until, diamonds: a.diamonds };
}

// POST /api/gift/coins {uid, amount} · POST /api/gift/premium {uid, plan: w|m}
function handle(req, res, p, h) {
  if (p !== '/api/gift/coins' && p !== '/api/gift/premium') return false;
  if (req.method !== 'POST') { h.send(res, 405, { error: 'method' }); return true; }
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const r = p === '/api/gift/coins' ? coins(t.id, j.uid, j.amount) : premium(t.id, j.uid, String(j.plan));
    h.send(res, r.error ? 400 : 200, r);
  });
  return true;
}
module.exports = { handle, coins, premium, fee, FEE_PCT, FEE_MIN, DAY_MAX };
