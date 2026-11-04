'use strict';
// premium.js — 👑 Premium: tanga yoki ⭐ Telegram Stars bilan (haftalik / oylik / yillik).
// Oylik Stars — avtomatik yangilanadigan obuna (Telegram faqat 30 kunlik obunaga ruxsat beradi).
// Premium: 👑 belgi va oltin ism, g'alabadan 2× tanga (kunlik limit ham 2×), 🔥 seriya bonusi 2×,
// turnirga kirish 50% chegirma, tahlil taxtasida KestoG uzoqroq o'ylaydi.
const store = require('./store.js');
const DAY = 86400e3;
const PLANS = {
  w: { name: 'Haftalik', days: 7, coins: 300, stars: 50 },
  m: { name: 'Oylik', days: 30, coins: 800, stars: 150, sub: true },
  y: { name: 'Yillik', days: 365, coins: 8000, stars: 1200 },
};
const users = () => store.users();
const isPrem = u => !!(u && u.premiumUntil > Date.now());
function tg(method, params) {
  const T = process.env.BOT_TOKEN; if (!T) return Promise.resolve(null);
  return fetch('https://api.telegram.org/bot' + T + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).then(r => r.json()).catch(() => null);
}
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const dm = (uid, text) => /^\d+$/.test(String(uid)) && tg('sendMessage', { chat_id: String(uid), text });
const dmy = t => { const d = new Date(t + 5 * 3600e3); return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear(); };

function grant(u, days, why) {
  u.premiumUntil = Math.max(Date.now(), u.premiumUntil || 0) + days * DAY;
  u.premLog = u.premLog || []; u.premLog.push({ t: Date.now(), days, why }); if (u.premLog.length > 20) u.premLog.shift();
  store.save();
  return u.premiumUntil;
}

// ---------- tanga bilan
function buyCoins(uid, plan) {
  const P = PLANS[plan], u = users()[String(uid)];
  if (!P || !u) return { error: 'Tarif topilmadi' };
  if ((u.diamonds || 0) < P.coins) return { error: 'Tanga yetmaydi: ' + P.coins + ' 🪙 kerak', need: P.coins - (u.diamonds || 0) };
  if (!require('./economy.js').spend(uid, P.coins, 'premium_' + plan)) return { error: 'Tanga yetmaydi' };
  const until = grant(u, P.days, 'coins_' + plan);
  dm(uid, '👑 Premium yoqildi (' + P.name + ', ' + P.coins + ' 🪙)! ' + dmy(until) + ' gacha amal qiladi.');
  return { ok: true, until, diamonds: u.diamonds };
}

// ---------- ⭐ Stars bilan: invoys
async function invoice(uid, plan) {
  const P = PLANS[plan]; if (!P) return { error: 'Tarif topilmadi' };
  const q = {
    title: '👑 ShashkaPRO Premium — ' + P.name,
    description: P.sub ? 'Har 30 kunda avtomatik yangilanadi, Telegram sozlamalarida istalgan payt bekor qilish mumkin.' : P.days + ' kunlik Premium',
    payload: uid + ':pr_' + plan, currency: 'XTR', prices: [{ label: 'Premium', amount: P.stars }],
  };
  if (P.sub) q.subscription_period = 2592000;
  const r = await tg('createInvoiceLink', q);
  if (!r || !r.ok) { console.log('[prem] invoys xato:', r && r.description); return { error: 'invoice' }; }
  return { link: r.result };
}
function checkPay(payload, amount) {   // pre_checkout va successful_payment uchun
  const m = /^(\d+):pr_([wmy])$/.exec(String(payload || '')); if (!m) return null;
  const P = PLANS[m[2]]; if (!P || amount !== P.stars) return false;
  return { uid: m[1], plan: m[2], P };
}
function onPaid(msg, x) {   // payments.js dan, to'lov tekshirilgandan keyin
  const p = msg.successful_payment, u = users()[x.uid] || store.getOrCreate(msg.from);
  u.charges = u.charges || [];
  if (u.charges.includes(p.telegram_payment_charge_id)) return;
  u.charges.push(p.telegram_payment_charge_id); if (u.charges.length > 50) u.charges.shift();
  if (p.subscription_expiration_date) u.premSub = p.subscription_expiration_date * 1000;
  u.payLog = u.payLog || []; u.payLog.push({ c: p.telegram_payment_charge_id, k: 'pr_' + x.plan, s: p.total_amount, t: Date.now() }); if (u.payLog.length > 30) u.payLog.shift();
  const until = grant(u, x.P.days, 'stars_' + x.plan + (p.is_recurring ? '_renew' : ''));
  dm(x.uid, (p.is_recurring ? '🔄 Premium obunasi yangilandi' : '👑 Premium yoqildi (' + x.P.name + ')') + '! ' + dmy(until) + ' gacha amal qiladi.\nRahmat! 🙏');
  for (const a of ADM()) dm(a, '💰 ' + (u.name || x.uid) + ' (' + x.uid + '): Premium ' + x.P.name + ' — ' + p.total_amount + ' ⭐' + (p.is_recurring ? ' (yangilanish)' : '') + '\n' + p.telegram_payment_charge_id);
}

// ---------- 🎁 7 kunlik sovg'a Premium (har kimga bir marta) va 📩 eslatmalar
const TRIAL_DAYS = 7;
const appLink = () => (process.env.TG_APP_LINK || process.env.APP_LINK || 'https://t.me/DraughtsPRObot/play').replace(/\/$/, '');
const kb = (bt, sp) => ({ inline_keyboard: [[{ text: bt || '👑 Faollashtirish', url: appLink() + '?startapp=' + (sp || 'prem') }]] });
const dmK = (uid, text, bt, sp) => /^\d+$/.test(String(uid)) && tg('sendMessage', { chat_id: String(uid), text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, reply_markup: kb(bt, sp) });
// 📩 xabar matnlari (HTML)
const PERKS_TXT = '👑 Toj va oltin ism\n🤖 Legend, Monster, Terminator, King Kong\n🪙 G‘alabadan 2× tanga\n🔥 Kunlik bonus 2×\n🖼 Profil rasmi\n🏆 Turnirga kirish −50%';
const bar = n => '▰'.repeat(Math.max(0, Math.min(7, n))) + '▱'.repeat(7 - Math.max(0, Math.min(7, n)));
const TIPS = {
  6: '🤖 Bugun <b>Monster BOT</b> bilan kuchingizni sinab ko‘ring — u faqat Premium uchun!',
  5: '🪙 Har g‘alabadan <b>2 barobar</b> tanga — tangalarni yig‘ib qoling!',
  4: '🖼 Profilingizga <b>o‘z rasmingizni</b> qo‘ying — hamma ko‘radi.',
  3: '🦾 <b>Terminator BOT</b> ni yenga olasizmi? Sinab ko‘ring!',
  2: '🏆 Turnirlarga <b>yarim narxda</b> qatnashing.'
};
const PRICE_TXT = '💡 Davom ettirish:\n• haftalik — <b>300 🪙</b> yoki <b>50 ⭐</b>\n• oylik — <b>800 🪙</b> yoki <b>150 ⭐</b>\n• yillik — <b>8000 🪙</b> yoki <b>1200 ⭐</b>';
const MSG = {
  gift: t => '🎁 <b>Sizga sovg‘a — 7 kunlik Premium!</b>\n\nShashkaPRO jamoasidan kichik sovg‘a 💛\nHammasi yoqildi, kirib sinab ko‘ring:\n\n' + PERKS_TXT + '\n\n⏳ <i>' + dmy(t) + ' gacha amal qiladi</i>',
  trial: (left, t) => (left === 1
    ? '⏰ <b>Ertaga Premium tugaydi!</b>\n' + bar(1) + '  <b>1 kun</b>\n\nErtadan quyidagilar yopiladi:\n' + PERKS_TXT + '\n\n'
    : '👑 <b>Premium: ' + left + ' kun qoldi</b>\n' + bar(left) + '  <i>' + dmy(t) + ' gacha</i>\n\n' + (TIPS[left] || '') + '\n\n') + PRICE_TXT,
  paid: (left, t) => (left === 1 ? '⏰ <b>Premium ertaga tugaydi</b>' : '👑 <b>Premium: ' + left + ' kun qoldi</b>') + '\n<i>' + dmy(t) + ' gacha</i>\n\nUzilib qolmasligi uchun oldindan uzaytiring — yangi muddat ustiga qo‘shiladi.\n\n' + PRICE_TXT,
  expired: () => '😔 <b>Premium muddati tugadi</b>\n\nYopilgan imkoniyatlar:\n' + PERKS_TXT + '\n\n' + PRICE_TXT + '\n\n👇 Bir bosishda qayta yoqing'
};
function giveTrial(u) {   // store.getOrCreate (yangi o'yinchi) va bir martalik hammaga tarqatish
  if (!u || u.premTrial) return false;
  u.premTrial = Date.now();
  u.premiumUntil = Math.max(Date.now(), u.premiumUntil || 0) + TRIAL_DAYS * DAY;
  u.trialEnd = u.premiumUntil; u.trialShow = 1;
  return true;
}
setTimeout(() => {   // hozirgi o'yinchilarga bir martalik sovg'a (server birinchi ishga tushganda)
  try {
    const db = store.db; if (db.trialAll) return;
    db.trialAll = Date.now();
    const q = [];
    for (const [id, u] of Object.entries(users())) if (/^\d+$/.test(id) && giveTrial(u)) q.push(id);
    store.save();
    console.log('[prem] sovg\'a Premium berildi:', q.length);
    let k = 0;
    const t = setInterval(() => {   // Telegram cheklovi: sekundiga ~10 ta xabar
      if (k >= q.length) return clearInterval(t);
      const id = q[k++], u = users()[id]; dmK(id, MSG.gift((u && u.premiumUntil) || Date.now()), '🎮 O‘ynash', 'go_play');
    }, 100);
  } catch (e) { console.log('[prem] sovg\'a xato:', e.message); }
}, 20000);
// har kuni ~12:00 (Toshkent) — sovg'a Premium: 6…1 kun qoldi; sotib olingan: 3 va 1 kun qoldi; tugaganda bir marta
const dayKey = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
const hourTz = () => new Date(Date.now() + 5 * 3600e3).getUTCHours();
function remindTick() {
  if (hourTz() < 12) return;
  const now = Date.now(), dk = dayKey(); let ch = false, k = 0;
  for (const [id, u] of Object.entries(users())) {
    if (!/^\d+$/.test(id)) continue;
    const t = u.premiumUntil || 0;
    if (t > now) {
      if (u.premRemDay === dk) continue;
      const left = Math.ceil((t - now) / DAY), trialOnly = u.trialEnd && t <= u.trialEnd + 60000;
      if (u.premSub && u.premSub >= t - 3 * 3600e3) continue;   // oylik obuna o'zi yangilanadi
      let msg = '';
      if (trialOnly && left >= 1 && left <= 6) msg = MSG.trial(left, t);
      else if (!trialOnly && (left === 3 || left === 1)) msg = MSG.paid(left, t);
      if (!msg) continue;
      u.premRemDay = dk; ch = true;
      setTimeout(() => dmK(id, msg), (k++) * 100);
    } else if (t && now - t < 2 * DAY && u.premExp !== t) {
      u.premExp = t; ch = true;
      setTimeout(() => dmK(id, MSG.expired(), '👑 Qayta faollashtirish'), (k++) * 100);
    }
  }
  if (ch) store.save();
}
setInterval(() => { try { remindTick(); } catch (e) { console.log('[prem] eslatma xato:', e.message); } }, 15 * 60e3).unref();

// ---------- HTTP
function handle(req, res, p, h) {
  if (!p.startsWith('/api/premium')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(t.id), u = store.getOrCreate(t);
  if (p === '/api/premium' && req.method === 'GET') {
    const packs = require('./payments.js').PACKS;
    h.send(res, 200, {
      premium: isPrem(u), until: u.premiumUntil || 0, trialShow: !!u.trialShow, trial: !!(u.trialEnd && (u.premiumUntil || 0) <= u.trialEnd + 60000), sub: !!(u.premSub && u.premSub > Date.now()), diamonds: u.diamonds || 0,
      plans: Object.entries(PLANS).map(([k, x]) => ({ id: k, name: x.name, days: x.days, coins: x.coins, stars: x.stars, sub: !!x.sub })),
      packs: Object.entries(packs).map(([k, x]) => ({ id: k, stars: x.stars, diamonds: x.diamonds, bonus: x.bonus || 0 }))
    });
    return true;
  }
  if (req.method !== 'POST') { h.send(res, 405, { error: 'method' }); return true; }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/premium/seen') { if (u.trialShow) { delete u.trialShow; store.save(); } h.send(res, 200, { ok: true }); return; }
    if (p === '/api/premium/buy') { const r = buyCoins(uid, String(j.plan)); h.send(res, r.error ? 400 : 200, r); return; }
    if (p === '/api/premium/invoice') { invoice(uid, String(j.plan)).then(r => h.send(res, r.error ? 400 : 200, r)); return; }
    h.send(res, 404, { error: 'none' });
  });
  return true;
}

// ---------- admin: Stars qaytarish (/refund <uid> <charge_id>)
async function refund(uid, charge) {
  const u = users()[String(uid)];
  const r = await tg('refundStarPayment', { user_id: Number(uid), telegram_payment_charge_id: String(charge) });
  if (!r || !r.ok) return '❌ Qaytarib bo‘lmadi: ' + ((r && r.description) || 'xato');
  let what = '';
  const L = u && (u.payLog || []).find(x => x.c === charge && !x.ref);
  if (u && L) {
    L.ref = Date.now();
    const pk = require('./payments.js').PACKS[L.k], pl = /^pr_(\w)$/.exec(L.k);
    if (pl && PLANS[pl[1]]) { u.premiumUntil = Math.max(Date.now(), (u.premiumUntil || 0) - PLANS[pl[1]].days * DAY); u.premSub = 0; what = ' · Premium ' + PLANS[pl[1]].days + ' kun olib tashlandi'; }
    else if (pk) { u.diamonds = Math.max(0, (u.diamonds || 0) - pk.diamonds); what = ' · ' + pk.diamonds + ' 🪙 olib tashlandi'; }
    store.save();
  }
  dm(uid, '↩️ To‘lovingiz qaytarildi (Stars hisobingizga tushdi).');
  return '✅ Qaytarildi' + what;
}

module.exports = { MSG, giveTrial, TRIAL_DAYS, PLANS, isPrem, grant, buyCoins, invoice, checkPay, onPaid, handle, refund };
