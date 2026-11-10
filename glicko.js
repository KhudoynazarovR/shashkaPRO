'use strict';
// glicko.js — ⭐ reyting tizimi lidraughts/lichess kabi: Glicko-2, 4 toifa (🚀 Bullet · ⚡ Blits · ⏱ Rapid · 📮 Yozishma).
// Har o'yinchida har toifa uchun: r (reyting), rd (ishonchsizlik), v (o'zgaruvchanlik), n (o'yinlar), at (oxirgi o'yin).
// Boshida rd katta → g'alaba/mag'lubiyat uchun ko'p ball; o'yin ko'paygani sari kam. rd > 110 bo'lsa reyting yonida «?».
// O'ynamay qo'ysa rd asta-sekin oshadi (qaytganda tezroq to'g'rilanadi).
// Botlar: odamlar bilan o'yinda reytingi o'zgaradi (bitta umumiy reyting, store.db.botElo da), bot va bot o'yinlari reytingsiz.
const store = require('./store');
const SC = 173.7178, TAU = 0.75, EPS = 1e-6;
const R0 = 1500, RD0 = 350, V0 = 0.06, RD_MIN = 45, RD_MAX = 350, PROV = 110;
const C2 = (RD_MAX * RD_MAX - 60 * 60) / 365;   // kuniga rd o'sishi (bir yilda 60 → 350)
const CATS = ['bullet', 'blits', 'rapid', 'corr'];
const LBL = { bullet: '🚀 Bullet', blits: '⚡ Blits', rapid: '⏱ Rapid', corr: '📮 Yozishma' };
// botlarning boshlang'ich kuchi (taxminiy) — «?» bilan, o'yinlarda o'zi to'g'rilanadi
const BOT0 = { bot_easy: 900, bot_mid: 1150, bot: 1400, bot_pro: 1650, bot_gm: 1850, bot_champ: 2000, bot_monster: 2200, bot_terminator: 2350, bot_kingkong: 2500 };

// lichess kabi: '1+1' → bullet (100 s), '2+2'/'3+2'/'5+3' → blits, '10+5' → rapid; '∞' (bot bilan vaqtsiz) → rapid; 'corr' → corr
function catOf(tc) {
  if (tc === 'corr') return 'corr';
  const m = /^(\d+(?:\.\d+)?)(?:\+(\d+))?/.exec(String(tc || ''));
  if (!m) return 'rapid';
  const est = +m[1] * 60 + (+m[2] || 0) * 40;   // lichess kabi: taxminiy o'yin vaqti = boshlang'ich + 40 × qo'shimcha
  return est < 180 ? 'bullet' : est < 480 ? 'blits' : 'rapid';
}
function fresh() { return { r: R0, rd: RD0, v: V0, n: 0, at: 0 }; }
function age(p, now) {   // o'ynamagan kunlar → rd oshadi
  if (!p.at) return p;
  const d = (now - p.at) / 864e5;
  if (d > 0) p.rd = Math.min(RD_MAX, Math.sqrt(p.rd * p.rd + C2 * d));
  return p;
}
// bitta o'yin bo'yicha yangilash (lichess kabi har o'yindan keyin). s: 1 g'alaba, 0.5 durang, 0 mag'lubiyat
function step(p, o, s) {
  const mu = (p.r - 1500) / SC, phi = p.rd / SC, muj = (o.r - 1500) / SC, phij = o.rd / SC;
  const g = 1 / Math.sqrt(1 + 3 * phij * phij / (Math.PI * Math.PI));
  const E = 1 / (1 + Math.exp(-g * (mu - muj)));
  const v = 1 / (g * g * E * (1 - E));
  const delta = v * g * (s - E);
  // o'zgaruvchanlik (Illinois usuli)
  const a = Math.log(p.v * p.v);
  const f = x => { const ex = Math.exp(x), t = phi * phi + v + ex; return ex * (delta * delta - phi * phi - v - ex) / (2 * t * t) - (x - a) / (TAU * TAU); };
  let A = a, B, k = 1;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else { while (f(a - k * TAU) < 0 && k < 100) k++; B = a - k * TAU; }
  let fA = f(A), fB = f(B), it = 0;
  while (Math.abs(B - A) > EPS && it++ < 100) {
    const Cc = A + (A - B) * fA / (fB - fA), fC = f(Cc);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA = fA / 2;
    B = Cc; fB = fC;
  }
  const v2 = Math.exp(A / 2);
  const phiS = Math.sqrt(phi * phi + v2 * v2);
  const phi2 = 1 / Math.sqrt(1 / (phiS * phiS) + 1 / v);
  const mu2 = mu + phi2 * phi2 * g * (s - E);
  return { r: Math.max(100, Math.min(3500, 1500 + SC * mu2)), rd: Math.max(RD_MIN, Math.min(RD_MAX, SC * phi2)), v: Math.min(0.1, v2) };
}

// ---------- bir martalik o'tish: hamma 1500? dan (eski reyting o'chiriladi), botlar taxminiy kuchidan
function ensure() {
  const d = store.db; if (!d || !d.users) return;
  if (store.isReady && !store.isReady()) return;
  if (d.rtV1) return;
  const us = d.users; let n = 0;
  for (const id of Object.keys(us)) {
    const u = us[id]; if (!u || typeof u !== 'object') continue;
    u.rt = {}; u.elo = R0; u.celo = R0; delete u.rtW; delete u.rtH; n++;
  }
  d.botElo = d.botElo || {};
  for (const b of Object.keys(BOT0)) {
    const o = d.botElo[b] || (d.botElo[b] = { w: 0, l: 0, dr: 0 });
    o.elo = BOT0[b]; o.rd = 150; o.v = V0; o.n = 0; o.at = 0; o.w = 0; o.l = 0; o.dr = 0;
  }
  d.rtV1 = Date.now();
  console.log('[reyting] Glicko-2 ga o‘tildi: ' + n + ' o‘yinchi 1500? dan boshlaydi');
  try { store.save(); } catch (e) {}
}
setInterval(ensure, 5000).unref();

function rt(u, cat) { u.rt = u.rt || {}; return u.rt[cat] || (u.rt[cat] = fresh()); }
function botP(uid) {
  const d = store.db; d.botElo = d.botElo || {};
  const o = d.botElo[uid] || (d.botElo[uid] = { elo: BOT0[uid] || R0, w: 0, l: 0, dr: 0 });
  if (o.rd == null) { o.rd = 150; o.v = V0; o.n = 0; o.at = 0; }
  return o;
}
const isBot = u => typeof u === 'string' && (u === 'bot' || u.indexOf('bot_') === 0);
function weekKey(t) { const d = new Date(t + 5 * 3600e3), day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return d.toISOString().slice(0, 10); }
// asosiy reyting (u.elo — ro'yxatlar, juftlash va boshqa joylar uchun): eng ko'p o'ynalgan toifa
function main(u) {
  let best = null;
  for (const c of CATS) { const p = u.rt && u.rt[c]; if (p && p.n && (!best || p.n > best.n || (p.n === best.n && p.at > best.at))) best = p; }
  u.elo = Math.round(best ? best.r : R0);
}
function note(u, cat, before) {   // haftalik o'zgarish va grafik uchun tarix
  const now = Date.now(), wk = weekKey(now);
  if (!u.rtW || u.rtW.wk !== wk) u.rtW = { wk, base: {} };
  if (u.rtW.base[cat] == null) u.rtW.base[cat] = Math.round(before);
  u.rtH = u.rtH || {}; const h = u.rtH[cat] || (u.rtH[cat] = []);
  const dk = new Date(now + 5 * 3600e3).toISOString().slice(0, 10), r = Math.round(u.rt[cat].r);
  if (h.length && h[h.length - 1][0] === dk) h[h.length - 1][1] = r; else h.push([dk, r]);
  if (h.length > 120) h.splice(0, h.length - 120);
}
// a, b: o'yinchilar (uid). sa: a ning natijasi (1 / 0.5 / 0). Natija: { a: {d, r, prov}, b: {...}, cat }
function rate(aId, bId, sa, tc) {
  ensure();
  const us = store.users(), cat = catOf(tc), now = Date.now();
  const side = id => {
    id = String(id);
    if (isBot(id)) { const o = botP(id); age(o, now); return { bot: true, id, p: { r: o.elo, rd: o.rd, v: o.v }, o }; }
    const u = us[id]; if (!u) return null;
    const p = age(rt(u, cat), now); return { bot: false, id, u, p };
  };
  const A = side(aId), B = side(bId);
  if (!A || !B || A.id === B.id || (A.bot && B.bot)) return null;
  const pa = { r: A.p.r, rd: A.p.rd }, pb = { r: B.p.r, rd: B.p.rd };
  const na = step(A.p, pb, sa), nb = step(B.p, pa, 1 - sa);
  const out = { cat };
  for (const [X, nx, key, s] of [[A, na, 'a', sa], [B, nb, 'b', 1 - sa]]) {
    const before = X.p.r, cap = X.bot ? 60 : 150;   // bitta o'yinda juda katta sakrash bo'lmasin (yangi o'yinchi King Kongni tasodifan yutsa ham)
    nx.r = Math.max(before - cap, Math.min(before + cap, nx.r));
    if (X.bot) {
      Object.assign(X.o, { elo: Math.round(nx.r), rd: nx.rd, v: nx.v, n: (X.o.n || 0) + 1, at: now });
      if (s === 1) X.o.w = (X.o.w || 0) + 1; else if (s === 0) X.o.l = (X.o.l || 0) + 1; else X.o.dr = (X.o.dr || 0) + 1;
    } else {
      Object.assign(X.p, nx, { n: (X.p.n || 0) + 1, at: now });
      X.p.best = Math.max(X.p.best || 0, Math.round(nx.r));
      if (cat === 'corr') { X.u.celo = Math.round(nx.r); }
      note(X.u, cat, before); main(X.u);
    }
    out[key] = { d: Math.round(nx.r) - Math.round(before), r: Math.round(nx.r), prov: nx.rd > PROV };
  }
  try { store.save(); } catch (e) {}
  return out;
}
// ko'rsatish uchun: { bullet: {r, prov, n, d (haftalik)}, ... }
function view(u) {
  const now = Date.now(), wk = weekKey(now), o = {};
  for (const c of CATS) {
    const p = u && u.rt && u.rt[c], rd = p ? age({ rd: p.rd, at: p.at }, now).rd : RD0;
    const r = p ? Math.round(p.r) : R0;
    const base = u && u.rtW && u.rtW.wk === wk && u.rtW.base[c] != null ? u.rtW.base[c] : null;
    o[c] = { r, prov: rd > PROV, n: p ? p.n || 0 : 0, d: base == null ? null : r - base, best: p && p.best || null };
  }
  return o;
}
function botView(uid) { const o = botP(uid); const rd = age({ rd: o.rd, at: o.at }, Date.now()).rd; return { r: Math.round(o.elo), prov: rd > PROV, n: o.n || 0, w: o.w || 0, l: o.l || 0, dr: o.dr || 0 }; }
const BOTN = { bot_easy: 'Shogird BOT', bot_mid: 'Jangchi BOT', bot: 'Yo‘lbars BOT', bot_pro: 'Arslon BOT', bot_gm: 'Sulton BOT', bot_champ: 'Legend BOT', bot_monster: 'Monster BOT', bot_terminator: 'Terminator BOT', bot_kingkong: 'King Kong BOT' };
module.exports = { BOT0, BOTN, rate, view, botView, catOf, ensure, CATS, LBL, PROV, isBot, weekKey };
