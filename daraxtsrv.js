'use strict';
// daraxtsrv.js — 🌳 Tanga daraxti (umumiy): o'yinchilardan olingan jarima tangalari shu yerga tushadi
// (jarimalar keyin ulanadi: feed(n, uid) chaqiriladi). Bosqichlar: nihol → ko'chat → yosh daraxt → katta daraxt →
// gullagan olma → mevali olma. 100 000 ga yetganda 3 kunlik hosil: har kim kuniga bir marta olma teradi.
// Hosildan keyin daraxt bog'da qoladi (garden), yangi nihol ekiladi — keyin boshqa mevali daraxtlar qo'shiladi.
const store = require('./store.js');
const TH = [0, 1000, 5000, 20000, 50000, 100000];
const NAMES = ['Nihol', 'Ko‘chat', 'Yosh daraxt', 'Katta daraxt', 'Gullagan olma', 'Mevali olma'];
const HARV_MS = 3 * 864e5;
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const day = (t) => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10);
function wk(t) { const d = new Date((t || Date.now()) + 5 * 3600e3); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
function D() {
  const t = store.db.ctree = store.db.ctree || { cyc: 1, pool: 0, total: 0, garden: [], harv: null, week: null };
  if (!t.week || t.week.k !== wk()) t.week = { k: wk(), sum: 0, cnt: 0, ppl: 0, u: {} };
  if (t.harv && Date.now() > t.harv.until) endHarvest(t);
  return t;
}
function stage(pool) { let s = 0; for (let i = 0; i < TH.length; i++) if (pool >= TH[i]) s = i; return s; }
function endHarvest(t) {
  t.garden.push({ f: 'olma', cyc: t.cyc, at: Date.now(), picks: Object.keys(t.harv.picked || {}).length });
  t.cyc++; t.pool = 0; t.harv = null;
}
// tanga tushishi (jarima va h.k.)
function feed(n, uid, test) {
  n = Math.floor(Number(n) || 0); if (n <= 0) return;
  const t = D();
  t.pool += n; t.total += n;
  if (!test) { t.week.sum += n; t.week.cnt++; }
  if (!test && uid && !t.week.u[uid]) { t.week.u[uid] = 1; t.week.ppl++; if (t.week.ppl > 5000) t.week.u = {}; }
  if (!t.harv && t.pool >= TH[TH.length - 1]) {
    t.harv = { until: Date.now() + HARV_MS, picked: {}, paid: 0 };
    try { const tg = require('./gcard.js').tg; ADM().forEach(a => tg('sendMessage', { chat_id: a, text: '🍎 Tanga daraxti hosilga kirdi! 3 kun davomida o‘yinchilar olma teradi.' })); } catch (e) {}
  }
  store.save();
}
function reward(u) { return 10 + Math.min(20, Math.floor(((u && u.solved) || []).length / 25)); }   // 10 + yechgan masalalarga qarab (ko'pi bilan 30)
function view(uid) {
  const t = D(), s = t.harv ? 5 : Math.min(4, stage(t.pool)), u = store.users()[uid];
  return {
    pool: t.pool, stage: s, name: NAMES[s], th: TH, next: s < 5 ? TH[s + 1] : TH[5],
    harv: t.harv ? { until: t.harv.until, picked: (t.harv.picked || {})[uid] === day(), reward: reward(u) } : null,
    week: { sum: t.week.sum, cnt: t.week.cnt, ppl: t.week.ppl }, garden: t.garden.length, cyc: t.cyc, admin: ADM().includes(String(uid)), now: Date.now()
  };
}
function handle(req, res, p, h) {
  if (!p.startsWith('/api/daraxt')) return false;
  const tk = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tk) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tk.id);
  if (req.method === 'GET') { h.send(res, 200, view(uid)); return true; }
  h.readBody(req, 1000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const t = D();
    if (p === '/api/daraxt/pick') {
      if (!t.harv) return h.send(res, 400, { error: 'Hozir hosil vaqti emas' });
      if (t.harv.picked[uid] === day()) return h.send(res, 400, { error: 'Bugun olma terdingiz, ertaga yana keling' });
      const u = store.users()[uid]; if (!u) return h.send(res, 400, { error: 'Avval o‘ynab ko‘ring' });
      const n = Math.min(reward(u), t.pool); if (n <= 0) return h.send(res, 400, { error: 'Olma qolmadi' });
      t.harv.picked[uid] = day(); t.harv.paid += n; t.pool -= n;
      try { require('./economy.js').add(uid, n, 'olma hosili'); } catch (e) {}
      store.save();
      return h.send(res, 200, Object.assign(view(uid), { got: n }));
    }
    if (p === '/api/daraxt/reset') {   // admin: daraxtni boshidan (nihol, 0 tanga, bog' bo'sh)
      if (!ADM().includes(uid)) return h.send(res, 403, { error: 'Faqat admin' });
      store.db.ctree = null; D(); store.save(); return h.send(res, 200, view(uid));
    }
    if (p === '/api/daraxt/add') {   // admin sinovi uchun
      if (!ADM().includes(uid)) return h.send(res, 403, { error: 'Faqat admin' });
      feed(Math.min(100000, Number(j.n) || 0), uid, true); return h.send(res, 200, view(uid));
    }
    h.send(res, 404, { error: 'topilmadi' });
  });
  return true;
}
module.exports = { handle, feed, view };
