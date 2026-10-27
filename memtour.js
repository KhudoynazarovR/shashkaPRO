'use strict';
// memtour.js — 🏆 Xotira kunlik turniri. Har kim kuniga 3 marta urinadi (har safar yangi aralashtirilgan 6×6 doska),
// eng yaxshi natija (kam yurish, keyin kam vaqt) hisoblanadi. Kartalar serverda: har ochish so'rov orqali (aldab bo'lmaydi).
// Kun oxirida (Toshkent vaqti) top-3 ga tanga beriladi.
const crypto = require('crypto');
const store = require('./store.js');
const C = require('./memcore.js');
const SYM = Array.from('♟️👑🏆🥇🥈🥉🎯⭐🔥💎🎲🧩📖⏱️🛡️⚔️🦁🐯🦅🐺🦍🤖👹🦾🎓🏅🎖️🪙💰🧠⚡🌙').reduce((a, c) => { if (/[‍️]/.test(c) && a.length) a[a.length - 1] += c; else a.push(c); return a; }, []);
const PAIRS = 18, TRIES = 3, PRIZE = [100, 60, 30];
const GAMES = new Map();   // uid -> joriy urinish
const day = (t) => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10);
const R = () => crypto.randomInt(1e9) / 1e9;

function T() {
  const d = store.db; let t = d.memTour;
  const today = day();
  if (!t || t.day !== today) {
    let last = [];
    if (t && t.res) {   // kechagi turnir — sovrinlar
      const rows = Object.entries(t.res).sort((a, b) => a[1].mv - b[1].mv || a[1].ms - b[1].ms).slice(0, PRIZE.length);
      rows.forEach(([uid, r], i) => {
        const u = store.users()[uid];
        if (u) { u.diamonds = (u.diamonds || 0) + PRIZE[i]; u.memTourWins = (u.memTourWins || 0) + (i === 0 ? 1 : 0); }
        last.push({ name: r.name, mv: r.mv, ms: r.ms, prize: PRIZE[i] });
      });
    }
    t = d.memTour = { day: today, res: {}, tries: {}, last: last.length ? last : (t && t.last) || [] };
    GAMES.clear();
    store.save();
  }
  return t;
}
function top(t) { return Object.entries(t.res).map(([uid, r]) => ({ uid, name: r.name, mv: r.mv, ms: r.ms })).sort((a, b) => a.mv - b.mv || a.ms - b.ms); }
function info(uid) {
  const t = T(), all = top(t), i = all.findIndex(x => x.uid === uid);
  const end = Date.parse(t.day + 'T00:00:00+05:00') + 86400e3;
  return { day: t.day, ends: end, prize: PRIZE, tries: TRIES - (t.tries[uid] || 0), top: all.slice(0, 20).map(x => ({ name: x.name, mv: x.mv, ms: x.ms, me: x.uid === uid })), me: t.res[uid] || null, rank: i >= 0 ? i + 1 : 0, players: all.length, last: t.last || [] };
}
function start(uid, name) {
  const t = T(); const used = t.tries[uid] || 0;
  if (used >= TRIES) return { error: 'Bugungi urinishlar tugadi' };
  t.tries[uid] = used + 1; store.save();
  const S = C.newGame({ pairs: PAIRS, symbols: SYM, rules: {}, rnd: R, first: 0 });
  const g = { id: crypto.randomBytes(6).toString('hex'), S, t0: Date.now(), mv: 0, name, pend: null };
  GAMES.set(uid, g);
  return { id: g.id, n: 36, tries: TRIES - t.tries[uid] };
}
function flip(uid, id, i) {
  const g = GAMES.get(uid); if (!g || g.id !== id) return { error: 'O‘yin topilmadi' };
  const S = g.S;
  if (g.pend) { C.endTurn(S); S.turn = 0; g.pend = null; }   // oldingi xato juftlik yopiladi
  const res = C.flip(S, Math.floor(+i));
  if (!res) return { bad: 1 };
  const out = { i: +i, s: S.deck[+i] };
  if (res.match === true || res.match === false) {
    g.mv++; out.mv = g.mv;
    const a = S.done[+i] ? null : S.up[0];
    if (res.match === false) { g.pend = 1; out.miss = 1; out.other = a; }
    else out.ok = 1;
  }
  if (S.over) {
    const ms = Date.now() - g.t0, t = T(), prev = t.res[uid];
    if (!prev || g.mv < prev.mv || (g.mv === prev.mv && ms < prev.ms)) { t.res[uid] = { name: g.name, mv: g.mv, ms }; out.record = 1; }
    GAMES.delete(uid); store.save();
    out.done = { mv: g.mv, ms };
    const all = top(t); out.rank = all.findIndex(x => x.uid === uid) + 1;
  }
  return out;
}
module.exports = { info, start, flip };
