'use strict';
// Unvonlar: n = nechta taklif, gem = bir martalik bonus. Shu yerda oʻzgartirasiz.
const RANKS = [
  { n: 3, name: 'Askar', gem: 20 },
  { n: 10, name: 'Serjant', gem: 50 },
  { n: 25, name: 'Kapitan', gem: 100 },
  { n: 60, name: 'Mayor', gem: 200 },
  { n: 150, name: 'Polkovnik', gem: 500 },
  { n: 400, name: 'General', gem: 1200 }
];
const FOLDER_MIN = 5, FOLDER_GEM = 50;
const END = () => Date.parse(process.env.PZ_PROMO_END || '2026-10-25T23:59:59+05:00');

function say(chat, text, extra) {
  if (!process.env.BOT_TOKEN || !chat) return;
  try {
    fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.assign({ chat_id: chat, text: text }, extra || {}))
    }).catch(() => {});
  } catch (e) {}
}

function onInvite(iv, chat) {
  const t = (iv.pzInv && iv.pzInv.total) || 0;
  let paid = iv.pzRank || 0;
  RANKS.forEach((r, i) => {
    if (t >= r.n && i + 1 > paid) {
      paid = i + 1;
      iv.diamonds = (iv.diamonds || 0) + r.gem;
      say(chat, '🏅 Tabriklaymiz! Siz «' + r.name + '» unvoniga erishdingiz: +' + r.gem + ' 💎');
    }
  });
  iv.pzRank = paid;
}

function top(store) {
  return Object.values(store.users())
    .filter(v => v.pzInv && v.pzInv.total > 0)
    .sort((a, b) => b.pzInv.total - a.pzInv.total)
    .slice(0, 10)
    .map(v => ({ name: String(v.name || 'Foydalanuvchi').slice(0, 24), total: v.pzInv.total }));
}

function folderBonus(store, u, pz, chat) {
  const f = pz.folder;
  if (!f) return 0;
  const all = (store.db.puzzles || []).filter(x => x.folder === f);
  u.pzFolderDone = u.pzFolderDone || [];
  if (all.length < FOLDER_MIN || u.pzFolderDone.includes(f)) return 0;
  if (!all.every(x => (u.solved || []).includes(x.id))) return 0;
  u.pzFolderDone.push(f);
  say(chat, '🏆 «' + f + '» papkasidagi hamma masalani yechdingiz: +' + FOLDER_GEM + ' 💎');
  return FOLDER_GEM;
}

let timer = null;
function watch(store) {
  if (timer) return;
  timer = setInterval(() => {
    try {
      const now = Date.now(), end = END();
      if (now >= end - 24 * 36e5 && now < end && !store.db.pzPromoNotified) {
        const gc = process.env.GROUP_CHAT_ID, lk = process.env.TG_APP_LINK;
        if (gc) say(gc, '⏰ Aksiya tugashiga 1 kun qoldi!\n🧩 Masalalar papkasini do‘stlaringizga yuboring: havolangiz orqali kirgan har bir yangi o‘yinchi masala yechsa, +100 💎',
          lk ? { reply_markup: { inline_keyboard: [[{ text: '🧩 Masalalar', url: lk }]] } } : {});
        store.db.pzPromoNotified = 1; store.save();
      }
    } catch (e) {}
  }, 600000);
  if (timer.unref) timer.unref();
}

module.exports = { RANKS, END, onInvite, top, folderBonus, watch };
