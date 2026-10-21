'use strict';
// leagues.js — haftalik ligalar (Bronza → Usta) va yutuqlar (nishonlar).
// XP manbasi: quests.bump() orqali barcha voqealar (o'yin, g'alaba, masala, Rush, jang, vazifa...)
let store = null;
const TIERS = [
  { n: 'Bronza', ic: '🥉', c: '#cd7f32' },
  { n: 'Kumush', ic: '🥈', c: '#c0c7d1' },
  { n: 'Oltin', ic: '🥇', c: '#ffcf3f' },
  { n: 'Olmos', ic: '💎', c: '#5ad1ff' },
  { n: 'Usta', ic: '👑', c: '#c084fc' },
];
const XP = { game: 5, win: 10, bot: 5, puzzle: 3, petrova: 5, rush: 5, battle: 5, q_claim: 10, q_bonus: 15, streak_claim: 5, share: 0 };
const UP = 0.2, DOWN = 0.2;                         // eng yaxshi 20% ko'tariladi, eng past 20% tushadi
const PRIZE = [60, 40, 25];                         // har ligada TOP-3 (x liga darajasi + 1)

const dayKey = (t) => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10);
function weekKey(t) { // dushanba (Toshkent vaqti)
  const d = new Date((t || Date.now()) + 5 * 3600e3); const wd = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd)).toISOString().slice(0, 10);
}
function weekEnd(t) { return Date.parse(weekKey(t) + 'T00:00:00+05:00') + 7 * 864e5; }
function users() { if (!store) store = require('./store'); return store.users(); }
function isUid(k) { return /^\d+$/.test(k); }

function lg(u) {
  const w = weekKey();
  u.lg = u.lg || { tier: 0, w, xp: 0, best: 0 };
  if (u.lg.w !== w) { u.lg.w = w; u.lg.xp = 0; }
  return u.lg;
}

// ---------- haftani yakunlash
function rollover() {
  if (!store) store = require('./store');
  const db = store.db, w = weekKey();
  db.lgw = db.lgw || w;
  if (db.lgw === w) return false;
  const prev = db.lgw, us = users(), groups = [];
  // avval barcha ligalarni o'zgartirmasdan saralaymiz (aks holda ko'tarilgan o'yinchi yana hisoblanadi)
  for (let t = 0; t < TIERS.length; t++) groups.push(Object.entries(us).filter(([k, u]) => isUid(k) && u.lg && u.lg.w === prev && (u.lg.tier || 0) === t && u.lg.xp > 0)
      .sort((a, b) => b[1].lg.xp - a[1].lg.xp || (a[1].lg.at || 0) - (b[1].lg.at || 0)));
  for (let t = 0; t < TIERS.length; t++) {
    const rows = groups[t], n = rows.length, up = t < TIERS.length - 1 && n >= 2 ? Math.max(1, Math.floor(n * UP)) : 0, dn = t > 0 && n >= 5 ? Math.floor(n * DOWN) : 0;
    rows.forEach(([k, u], i) => {
      const place = i + 1, res = i < up ? 'up' : (i >= n - dn ? 'down' : 'stay');
      const reward = place <= 3 ? PRIZE[place - 1] * (t + 1) : 0;
      if (reward) u.diamonds = (u.diamonds || 0) + reward;
      const nt = res === 'up' ? t + 1 : res === 'down' ? t - 1 : t;
      u.lg.last = { w: prev, tier: t, place, of: n, xp: u.lg.xp, res, reward, nt, seen: false };
      u.lg.tier = nt; u.lg.best = Math.max(u.lg.best || 0, nt);
    });
  }
  db.lgw = w;
  store.save();
  return true;
}

// ---------- yutuqlar
const ACH = [
  { id: 'win1', ic: '🎉', t: 'Birinchi g‘alaba', d: 'Birinchi o‘yinda yuting', k: 'win', n: 1, r: 20 },
  { id: 'win10', ic: '🏅', t: '10 ta g‘alaba', d: '10 ta o‘yinda yuting', k: 'win', n: 10, r: 50 },
  { id: 'win50', ic: '🏆', t: '50 ta g‘alaba', d: '50 ta o‘yinda yuting', k: 'win', n: 50, r: 120 },
  { id: 'win200', ic: '👑', t: 'Shashka qiroli', d: '200 ta o‘yinda yuting', k: 'win', n: 200, r: 300 },
  { id: 'game100', ic: '🎮', t: 'Yuz partiya', d: '100 ta o‘yin o‘ynang', k: 'game', n: 100, r: 80 },
  { id: 'beatLegend', ic: '🦁', t: 'Legend yengildi', d: 'Legend BOTni yuting', k: 'beat_bot_champ', n: 1, r: 200 },
  { id: 'beatSulton', ic: '🤴', t: 'Sultonni yiqitdi', d: 'Sulton BOTni yuting', k: 'beat_bot_gm', n: 1, r: 100 },
  { id: 'pz50', ic: '🧩', t: 'Masalachi', d: '50 ta masala yeching', k: '$solved', n: 50, r: 50 },
  { id: 'pz200', ic: '🧠', t: 'Kombinatsiya ustasi', d: '200 ta masala yeching', k: '$solved', n: 200, r: 150 },
  { id: 'petrova', ic: '📗', t: 'Petrova kitobi', d: 'Petrova kitobidagi barcha masalalarni yeching', k: '$petrova', n: 0, r: 300 },
  { id: 'streak7', ic: '🔥', t: 'Bir hafta', d: '7 kun ketma-ket kiring', k: '$streak', n: 7, r: 70 },
  { id: 'streak30', ic: '☄️', t: 'Temir iroda', d: '30 kun ketma-ket kiring', k: '$streak', n: 30, r: 300 },
  { id: 'rush20', ic: '⚡', t: 'Chaqmoq', d: 'Puzzle Rush’da 20 ta masala', k: '$rush', n: 20, r: 100 },
  { id: 'battle10', ic: '⚔️', t: 'Jangchi', d: 'Masala jangida 10 marta yuting', k: '$battle', n: 10, r: 80 },
  { id: 'share5', ic: '📸', t: 'Mashhur', d: '5 marta natija ulashing', k: 'share', n: 5, r: 40 },
  { id: 'gold', ic: '🥇', t: 'Oltin liga', d: 'Oltin ligaga chiqing', k: '$tier', n: 2, r: 100 },
  { id: 'master', ic: '💜', t: 'Usta', d: 'Usta ligasiga chiqing', k: '$tier', n: 4, r: 300 },
];
function petrovaTotal() { return ((store && store.db.puzzles) || []).filter(x => /^Petrova/.test(x.folder || '')).length; }
function achVal(u, a) {
  const c = (u.ach && u.ach.c) || {};
  switch (a.k) {
    case '$solved': return (u.solved || []).length;
    case '$petrova': { const ids = new Set(((store && store.db.puzzles) || []).filter(x => /^Petrova/.test(x.folder || '')).map(x => x.id)); return (u.solved || []).filter(i => ids.has(i)).length; }
    case '$streak': return Math.max((u.strk && u.strk.best) || 0, (u.strk && u.strk.n) || 0);
    case '$rush': return (u.rush && u.rush.best) || 0;
    case '$battle': return (u.battle && u.battle.wins) || 0;
    case '$tier': return Math.max((u.lg && u.lg.best) || 0, (u.lg && u.lg.tier) || 0);
    default: return c[a.k] || 0;
  }
}
function achNeed(a) { return a.k === '$petrova' ? Math.max(1, petrovaTotal()) : a.n; }
function checkAch(u) { // yangi ochilganlarni qaytaradi (tangasi beriladi)
  u.ach = u.ach || { got: {}, c: {}, fresh: [] };
  const fresh = [];
  for (const a of ACH) {
    if (u.ach.got[a.id]) continue;
    if (a.k === '$petrova' && !petrovaTotal()) continue;
    if (achVal(u, a) >= achNeed(a)) { u.ach.got[a.id] = Date.now(); u.diamonds = (u.diamonds || 0) + a.r; fresh.push(a.id); }
  }
  if (fresh.length) { u.ach.fresh = (u.ach.fresh || []).concat(fresh).slice(-10); try { require('./quests.js').stat('ach', fresh.length); } catch (e) {} }
  return fresh;
}

// quests.bump va boshqalardan chaqiriladi
function event(uid, kind, n) {
  try {
    const u = users()[String(uid)]; if (!u || !isUid(String(uid))) return;
    rollover();
    const x = XP[kind] || 0;
    if (x) { const L = lg(u); L.xp += x * (n || 1); L.at = Date.now(); }
    u.ach = u.ach || { got: {}, c: {}, fresh: [] };
    u.ach.c[kind] = (u.ach.c[kind] || 0) + (n || 1);
    checkAch(u);
    store.save();
  } catch (e) { console.log('[leagues]', e.message); }
}

function table(u, uid) {
  const L = lg(u), us = users(), t = L.tier || 0, w = weekKey();
  const rows = Object.entries(us).filter(([k, v]) => isUid(k) && v.lg && v.lg.w === w && (v.lg.tier || 0) === t && (v.lg.xp > 0 || k === uid))
    .map(([k, v]) => ({ k, name: v.name || 'O‘yinchi', xp: v.lg.xp || 0, at: v.lg.at || 0 }))
    .sort((a, b) => b.xp - a.xp || a.at - b.at);
  const n = rows.filter(r => r.xp > 0).length;
  const up = t < TIERS.length - 1 && n >= 2 ? Math.max(1, Math.floor(n * UP)) : 0, dn = t > 0 && n >= 5 ? Math.floor(n * DOWN) : 0;
  const me = rows.findIndex(r => r.k === uid);
  const out = rows.slice(0, 30).map((r, i) => ({ p: i + 1, name: r.name, xp: r.xp, me: r.k === uid, av: r.k }));
  if (me >= 30) out.push({ p: me + 1, name: rows[me].name, xp: rows[me].xp, me: true, av: uid });
  return { rows: out, n, up, dn, rank: me + 1 };
}
function view(uid) {
  rollover();
  const u = users()[uid]; if (!u) return { error: 'no_user' };
  const L = lg(u), fresh = checkAch(u), tb = table(u, uid);
  const ach = ACH.map(a => ({ id: a.id, ic: a.ic, t: a.t, d: a.d, r: a.r, v: Math.min(achVal(u, a), achNeed(a)), n: achNeed(a), got: (u.ach.got || {})[a.id] || 0 }));
  const newAch = (u.ach.fresh || []).map(id => ach.find(a => a.id === id)).filter(Boolean);
  store.save();
  return {
    tiers: TIERS, tier: L.tier || 0, xp: L.xp, week: L.w, ends: weekEnd(), xpTable: XP, prize: PRIZE.map(p => p * ((L.tier || 0) + 1)),
    table: tb, last: L.last && !L.last.seen ? L.last : null, ach, newAch, got: Object.keys(u.ach.got || {}).length, fresh,
  };
}

function handle(req, res, p, ctx) {
  store = ctx.store;
  const { verifyInitData, send, readBody } = ctx;
  const tgu = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tgu) { send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tgu.id), u = users()[uid];
  if (!u) { send(res, 200, { error: 'no_user' }); return true; }
  if (p === '/api/league' && req.method === 'GET') { send(res, 200, view(uid)); return true; }
  if (p === '/api/league/seen' && req.method === 'POST') {
    readBody(req, 300, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      if (j.last && u.lg && u.lg.last) u.lg.last.seen = true;
      if (j.ach && u.ach) u.ach.fresh = [];
      store.save(); send(res, 200, { ok: true });
    });
    return true;
  }
  return false;
}
function init(st) { store = st; setInterval(() => { try { rollover(); } catch (e) {} }, 10 * 60e3); }

module.exports = { handle, event, init, checkAch, _t: { rollover, weekKey, weekEnd, lg, view, ACH, TIERS } };
