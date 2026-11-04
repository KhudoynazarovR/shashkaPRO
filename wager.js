'use strict';
// wager.js — 💰 tanga tikib o'ynash (odam bilan, bitta o'yin). Ikkala tomonning tangasi o'yin boshida muzlatiladi.
// G'olib bankni oladi, 10% komissiya yo'q qilinadi (tanga qadrsizlanmasin). Durang yoki o'yin boshlanmay tugasa — qaytariladi.
// Shart: kamida 3 kunlik va 10 o'yinli akkaunt (soxta akkaunt bilan tanga yig'ishdan himoya). O'yinlar soni cheklanmagan.
const store = require('./store.js');
const STAKES = [10, 50, 100, 500], FEE = 0.10, MIN_AGE = 3 * 86400e3, MIN_GAMES = 10;
const users = () => store.users();
const prize = s => Math.floor(2 * s * (1 - FEE));
function can(uid, stake) {
  const u = users()[String(uid)];
  if (!STAKES.includes(stake)) return 'Tikish miqdori noto‘g‘ri';
  if (!u || !/^\d+$/.test(String(uid))) return 'Tikib o‘ynash faqat Telegram orqali kirganda';
  if (Date.now() - (u.created || 0) < MIN_AGE) return '💰 Tikib o‘ynash ro‘yxatdan o‘tgach 3 kundan keyin ochiladi';
  if ((u.games || 0) < MIN_GAMES) return '💰 Tikib o‘ynash uchun kamida ' + MIN_GAMES + ' ta o‘yin o‘ynagan bo‘lish kerak (sizda ' + (u.games || 0) + ')';
  if ((u.diamonds || 0) < stake) return '💰 Tanga yetmaydi: ' + stake + ' 🪙 kerak';
  try { if (require('./mod.js').isPlayBanned(uid)) return 'O‘yin taqiqi bor'; } catch (e) {}
  return null;
}
function lock(a, b, stake) {   // ikkalasidan ham bir vaqtda yechiladi
  if (can(a, stake) || can(b, stake)) return false;
  const E = require('./economy.js');
  if (!E.spend(a, stake, 'wager_lock')) return false;
  if (!E.spend(b, stake, 'wager_lock')) { E.add(a, stake, 'wager_refund'); return false; }
  return true;
}
function stat(uid, d, r) { const u = users()[String(uid)]; if (!u) return; const g = u.wg = u.wg || { n: 0, w: 0, net: 0 }; g.n++; if (r === 'w') g.w++; g.net += d; }
// o'yin tugadi: { kind, text } har o'yinchiga
function settle(room, w, k, stake) {
  const E = require('./economy.js'), out = {};
  if ((room.plies || 0) < 2 || room.reason === 'noshow' || room.noshowBoth) {
    E.add(w, stake, 'wager_refund'); E.add(k, stake, 'wager_refund');
    out[w] = out[k] = '💰 O‘yin boshlanmadi — ' + stake + ' 🪙 qaytarildi';
  } else if (room.winner === 'white' || room.winner === 'black') {
    const win = room.winner === 'white' ? w : k, los = win === w ? k : w, p = prize(stake);
    E.add(win, p, 'wager_win');
    stat(win, p - stake, 'w'); stat(los, -stake, 'l');
    out[win] = '💰 Bank sizniki: +' + p + ' 🪙 (komissiya ' + (2 * stake - p) + ')'; out[los] = '💰 Tikilgan ' + stake + ' 🪙 raqibga o‘tdi';
  } else {
    E.add(w, stake, 'wager_refund'); E.add(k, stake, 'wager_refund'); stat(w, 0, 'd'); stat(k, 0, 'd');
    out[w] = out[k] = '🤝 Durang — ' + stake + ' 🪙 qaytarildi';
  }
  store.save();
  return out;
}
function top() {
  return Object.entries(users()).filter(([, u]) => u.wg && u.wg.n).map(([id, u]) => ({ name: u.name || 'O‘yinchi', net: u.wg.net, n: u.wg.n, w: u.wg.w })).sort((a, b) => b.net - a.net).slice(0, 10);
}
module.exports = { STAKES, FEE, prize, can, lock, settle, top };
