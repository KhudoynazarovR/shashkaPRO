// Puzzle Battle: 1 ga 1, 3 daqiqa, ikkalasiga bir xil masalalar. 3 ta xato = chiqasiz.
// Raqib 20 soniyada topilmasa — bot bilan. Javoblarni server tekshiradi.
'use strict';
const E = require('./pzrush.js')._t;
const DUR_MS = 180 * 1000, MAX_ERR = 3, COUNTDOWN_MS = 4000, BOT_AFTER_MS = 20000, IDLE_MS = 25000;
const WIN_COINS = 20, WIN_COINS_BOT = 10, PAID_WINS_PER_DAY = 5, SAME_OPP_PER_DAY = 2;
// Botlar: aniqlik (acc) va har masalaga sarflaydigan vaqt oralig'i (soniya), g'alaba uchun tanga
const BOTS = [
  // err: butun o'yin davomida qiladigan xatolar soni oralig'i (3 = chiqib ketishi mumkin)
  { name: 'Shogird BOT', rt: 900,  err: [2, 3], gap: [9, 15], coins: 3 },
  { name: 'Usta BOT',    rt: 1100, err: [1, 3], gap: [7, 11], coins: 5 },
  { name: 'Sulton BOT',  rt: 1300, err: [1, 2], gap: [5, 8],  coins: 8 },
  { name: 'Arslon BOT',  rt: 1500, err: [0, 2], gap: [3.5, 6], coins: 12 },
  { name: 'Legend BOT',  rt: 1800, err: [0, 1], gap: [2.5, 4], coins: 20 }
];
function botByRating(rt) { let k = 0; BOTS.forEach((b, i) => { if (Math.abs(b.rt - rt) < Math.abs(BOTS[k].rt - rt)) k = i; }); return k; }
function makeBotSide(lv) { const b = BOTS[lv]; const s = newSide('bot_' + rid(), b.name, b.rt, true); s.lv = lv; return s; }

const Q = new Map();      // uid -> { uid, name, rt, at, seen }
const M = new Map();      // mid -> match
const BY = new Map();     // uid -> mid
const INV = new Map();    // code -> { code, uid, name, rt, at }  (do'stni havola orqali chaqirish)
const INVBY = new Map();  // uid -> code
const INV_TTL = 10 * 60 * 1000;
function appLink() { return process.env.TG_APP_LINK || process.env.APP_LINK || ''; }
function dropInv(uid) { const c = INVBY.get(uid); if (c) INV.delete(c); INVBY.delete(uid); }
const dayKey = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
const rid = () => Math.random().toString(36).slice(2, 10);

function rating(u) { return (u && u.battle && u.battle.rt) || 1000; }
function newSide(uid, name, rt, bot) { return { uid, name, rt, bot: !!bot, score: 0, err: 0, at: 0, out: false, qi: 0, cur: null, seen: Date.now() }; }

function loadNext(store, m, s) {
  const all = store.db.puzzles || [];
  while (s.qi < m.q.length) {
    const id = m.q[s.qi++], p = all.find(x => x.id === id);
    if (!p) continue;
    const ls = E.linesOf(p).filter(l => E.validLine(p, l));
    if (!ls.length) continue;
    s.cur = { p, lines: ls, alive: ls.map((_, i) => i), idx: 0, g: { b: E.copy(p.board), side: p.side, forced: null } };
    return E.pub(p);
  }
  s.cur = null; s.out = true;
  return null;
}
function makeMatch(store, a, b) {
  const m = { id: rid(), q: E.makeQueue(store), start: Date.now() + COUNTDOWN_MS, end: Date.now() + COUNTDOWN_MS + DUR_MS, over: false, res: null };
  m.p = [a, b];
  m.p.forEach(s => { if (!s.bot) BY.set(s.uid, m.id); loadNext(store, m, s); });
  const bot = m.p.find(s => s.bot);
  if (bot) {
    // xatolarni o'yin boshida rejalashtiramiz: kuchli bot hech qachon 3 ta xato qilmaydi
    const B = BOTS[bot.lv || 0], tries = Math.max(4, Math.round(DUR_MS / 1000 / ((B.gap[0] + B.gap[1]) / 2)));
    const ne = B.err[0] + Math.floor(Math.random() * (B.err[1] - B.err[0] + 1)), plan = new Set();
    while (plan.size < ne) plan.add(Math.floor(Math.random() * tries));
    bot.errPlan = plan; bot.tries = 0;
    bot.next = m.start + botGap(bot);
  }
  M.set(m.id, m);
  return m;
}
function botGap(bot) { const g = BOTS[bot.lv || 0].gap; return Math.round((g[0] + Math.random() * (g[1] - g[0])) * 1000); }
function stepBot(m) {
  const b = m.p.find(s => s.bot); if (!b || b.out) return;
  const now = Math.min(Date.now(), m.end);
  while (!b.out && b.next <= now) {
    if (!(b.errPlan && b.errPlan.has(b.tries++))) { b.score++; b.at = b.next; } else { b.err++; if (b.err >= MAX_ERR) b.out = true; }
    b.next += botGap(b);
  }
}
function oppOf(m, uid) { return m.p.find(s => s.uid !== uid); }
function meOf(m, uid) { return m.p.find(s => s.uid === uid); }
function sum(s) { return { name: s.name, rt: s.rt, bot: s.bot, score: s.score, err: s.err, out: s.out }; }

function finish(store, m) {
  if (m.over) return m.res;
  m.over = true;
  const [a, b] = m.p;
  let w = null;
  if (a.score !== b.score) w = a.score > b.score ? a : b;
  else if (a.score > 0) w = a.at <= b.at ? a : b;
  const us = store.users(), d = dayKey(), res = { winner: w ? w.uid : null, draw: !w, gain: {}, delta: {}, scores: {} };
  m.p.forEach(s => { res.scores[s.uid] = s.score; if (!s.bot) { try { require('./quests.js').bump(s.uid, 'battle'); } catch (e) {} } });
  const human = !a.bot && !b.bot;
  // reyting (faqat odam vs odam)
  if (human) {
    const ua = us[a.uid], ub = us[b.uid];
    if (ua && ub) {
      const ra = rating(ua), rb = rating(ub), ea = 1 / (1 + Math.pow(10, (rb - ra) / 400)), sa = w ? (w === a ? 1 : 0) : 0.5, K = 24;
      const da = Math.round(K * (sa - ea));
      ua.battle = ua.battle || {}; ub.battle = ub.battle || {};
      ua.battle.rt = ra + da; ub.battle.rt = rb - da;
      res.delta[a.uid] = da; res.delta[b.uid] = -da;
    }
  }
  m.p.forEach(s => {
    if (s.bot) return;
    const u = us[s.uid]; if (!u) return;
    u.battle = u.battle || {};
    const bt = u.battle;
    if (bt.day !== d) { bt.day = d; bt.paid = 0; bt.vs = {}; }
    bt.games = (bt.games || 0) + 1;
    if (w === s) {
      bt.wins = (bt.wins || 0) + 1;
      const o = oppOf(m, s.uid), key = o.bot ? 'bot' + (o.lv || 0) : o.uid;
      if (o.bot) { bt.beat = bt.beat || {}; bt.beat[o.lv || 0] = 1; }
      bt.vs[key] = (bt.vs[key] || 0) + 1;
      if (bt.paid < PAID_WINS_PER_DAY && (o.bot || bt.vs[key] <= SAME_OPP_PER_DAY)) {
        const g = o.bot ? BOTS[o.lv || 0].coins : WIN_COINS;
        bt.paid++; u.diamonds = (u.diamonds || 0) + g; res.gain[s.uid] = g;
      }
    }
    if (s.score > (bt.best || 0)) bt.best = s.score;
  });
  store.save();
  m.res = res;
  setTimeout(() => { M.delete(m.id); m.p.forEach(s => { if (BY.get(s.uid) === m.id) BY.delete(s.uid); }); }, 120000).unref();
  return res;
}
function check(store, m) {
  if (m.over) return;
  stepBot(m);
  const now = Date.now(), [a, b] = m.p;
  const gone = s => !s.bot && now - s.seen > IDLE_MS && now > m.start;
  m.p.forEach(s => { if (gone(s)) s.out = true; });
  if (now >= m.end || (a.out && b.out) || (a.out && b.score > a.score) || (b.out && a.score > b.score)) finish(store, m);
}
function view(store, m, uid) {
  check(store, m);
  const me = meOf(m, uid), op = oppOf(m, uid), now = Date.now();
  const r = { mid: m.id, phase: m.over ? 'over' : (now < m.start ? 'count' : 'play'), startIn: Math.max(0, m.start - now), left: Math.max(0, m.end - now), me: sum(me), op: sum(op), maxErr: MAX_ERR };
  if (m.over) {
    const res = m.res;
    r.result = { win: res.winner === uid, draw: res.draw, gain: res.gain[uid] || 0, delta: res.delta[uid] || 0, rt: rating(store.users()[uid]) };
  }
  return r;
}

function handle(req, res, p, ctx) {
  const { store, verifyInitData, send, readBody } = ctx;
  const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tg) { send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tg.id), us = store.users(), u = us[uid] || {};

  if (p === '/api/battle/top' && req.method === 'GET') {
    const rows = Object.entries(us).filter(([, v]) => v.battle && v.battle.games > 0).map(([k, v]) => ({ uid: k, name: v.name || 'O‘yinchi', rt: v.battle.rt || 1000, w: v.battle.wins || 0, g: v.battle.games || 0 })).sort((a, b) => b.rt - a.rt).slice(0, 20);
    const bt = u.battle || {};
    send(res, 200, { top: rows, rt: bt.rt || 1000, wins: bt.wins || 0, games: bt.games || 0, paidLeft: bt.day === dayKey() ? Math.max(0, PAID_WINS_PER_DAY - (bt.paid || 0)) : PAID_WINS_PER_DAY, dur: DUR_MS / 1000, maxErr: MAX_ERR, coins: WIN_COINS, coinsBot: WIN_COINS_BOT, online: Q.size, bots: BOTS.map((b, i) => ({ lv: i, name: b.name, rt: b.rt, coins: b.coins, beat: !!((u.battle || {}).beat || {})[i] })) });
    return true;
  }
  if (req.method !== 'POST') return false;

  readBody(req, 4000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const now = Date.now();

    if (p === '/api/battle/find') {
      const cur = BY.get(uid), cm = cur && M.get(cur);
      if (cm && !cm.over) return send(res, 200, view(store, cm, uid));
      if (cm && cm.over) BY.delete(uid);
      const me = { uid, name: u.name || 'O‘yinchi', rt: rating(u), at: now, seen: now };
      // navbatdagi eng yaqin reytingli raqib
      let best = null;
      for (const x of Q.values()) {
        if (x.uid === uid || now - x.seen > 6000) continue;
        if (!best || Math.abs(x.rt - me.rt) < Math.abs(best.rt - me.rt)) best = x;
      }
      if (best) {
        Q.delete(best.uid); Q.delete(uid);
        const m = makeMatch(store, newSide(best.uid, best.name, best.rt), newSide(uid, me.name, me.rt));
        return send(res, 200, view(store, m, uid));
      }
      const old = Q.get(uid);
      Q.set(uid, old ? Object.assign(old, { seen: now }) : me);
      return send(res, 200, { phase: 'wait', since: now - (old ? old.at : now), botIn: Math.max(0, BOT_AFTER_MS - (now - (old ? old.at : now))) });
    }
    if (p === '/api/battle/poll') {
      const cur = BY.get(uid), cm = cur && M.get(cur);
      if (cm && !(cm.over && Q.has(uid))) { meOf(cm, uid).seen = now; return send(res, 200, view(store, cm, uid)); }
      const ic = INVBY.get(uid), iv = ic && INV.get(ic);
      if (iv) { if (now - iv.at > INV_TTL) { dropInv(uid); return send(res, 200, { phase: 'expired' }); } return send(res, 200, { phase: 'invite', code: iv.code, link: appLink() ? appLink() + '?startapp=pb_' + iv.code : '', left: INV_TTL - (now - iv.at) }); }
      const w = Q.get(uid);
      if (!w) return send(res, 200, { phase: 'idle' });
      w.seen = now;
      if (j.bot || now - w.at >= BOT_AFTER_MS) {
        Q.delete(uid);
        const m = makeMatch(store, newSide(uid, w.name, w.rt), makeBotSide(botByRating(w.rt)));
        return send(res, 200, view(store, m, uid));
      }
      return send(res, 200, { phase: 'wait', since: now - w.at, botIn: Math.max(0, BOT_AFTER_MS - (now - w.at)) });
    }
    if (p === '/api/battle/cancel') { Q.delete(uid); dropInv(uid); return send(res, 200, { phase: 'idle' }); }
    if (p === '/api/battle/invite') {
      const cur = BY.get(uid), cm = cur && M.get(cur);
      if (cm && !cm.over) return send(res, 200, view(store, cm, uid));
      if (cm) BY.delete(uid);
      Q.delete(uid); dropInv(uid);
      let code; do { code = Math.random().toString(36).slice(2, 8); } while (INV.has(code));
      const iv = { code, uid, name: u.name || 'O‘yinchi', rt: rating(u), at: now };
      INV.set(code, iv); INVBY.set(uid, code);
      return send(res, 200, { phase: 'invite', code, link: appLink() ? appLink() + '?startapp=pb_' + code : '', left: INV_TTL });
    }
    if (p === '/api/battle/join') {
      const code = String(j.code || '').replace(/[^a-z0-9]/g, '').slice(0, 12), iv = INV.get(code);
      const cur = BY.get(uid), cm = cur && M.get(cur);
      if (cm && !cm.over) return send(res, 200, view(store, cm, uid));
      if (!iv || now - iv.at > INV_TTL) return send(res, 200, { phase: 'expired' });
      if (iv.uid === uid) return send(res, 200, { phase: 'invite', code, link: appLink() ? appLink() + '?startapp=pb_' + code : '', left: INV_TTL - (now - iv.at) });
      if (cm) BY.delete(uid);
      const host = BY.get(iv.uid) && M.get(BY.get(iv.uid));
      if (host && !host.over) { dropInv(iv.uid); return send(res, 200, { phase: 'busy' }); }
      dropInv(iv.uid); Q.delete(uid); Q.delete(iv.uid);
      const m = makeMatch(store, newSide(iv.uid, iv.name, iv.rt), newSide(uid, u.name || 'O‘yinchi', rating(u)));
      return send(res, 200, view(store, m, uid));
    }
    if (p === '/api/battle/bot') { // tanlangan bot bilan darhol
      const cur = BY.get(uid), cm = cur && M.get(cur);
      if (cm && !cm.over) return send(res, 200, view(store, cm, uid));
      if (cm) BY.delete(uid);
      Q.delete(uid);
      const lv = Math.max(0, Math.min(BOTS.length - 1, Number(j.lv) || 0));
      const m = makeMatch(store, newSide(uid, u.name || 'O‘yinchi', rating(u)), makeBotSide(lv));
      return send(res, 200, view(store, m, uid));
    }

    const m = M.get(String(j.mid || ''));
    if (!m || !meOf(m, uid)) return send(res, 200, { phase: 'idle' });
    const me = meOf(m, uid); me.seen = now;

    if (p === '/api/battle/puzzle') {
      check(store, m);
      return send(res, 200, Object.assign(view(store, m, uid), { pz: me.cur && !me.out ? E.pub(me.cur.p) : null }));
    }
    if (p === '/api/battle/resign') {
      me.out = true; check(store, m); if (!m.over && oppOf(m, uid).score >= me.score) finish(store, m);
      return send(res, 200, view(store, m, uid));
    }
    if (p === '/api/battle/move' || p === '/api/battle/skip') {
      check(store, m);
      if (m.over || me.out || now < m.start) return send(res, 200, view(store, m, uid));
      const c = me.cur;
      const wrong = () => {
        const sol = c ? c.lines[c.alive[0]].slice(c.idx) : [];
        me.err++;
        if (me.err >= MAX_ERR) { me.out = true; check(store, m); return send(res, 200, Object.assign(view(store, m, uid), { wrong: true, sol })); }
        const pz = loadNext(store, m, me); check(store, m);
        return send(res, 200, Object.assign(view(store, m, uid), { wrong: true, sol, pz }));
      };
      if (p === '/api/battle/skip') return wrong();
      const w = Array.isArray(j.step) ? j.step.map(Number) : [];
      if (!c || c.g.side !== c.p.side) return send(res, 200, { bad: true });
      const st = E.findStep(E.legal(c.g.b, c.g.side, c.g.forced), w);
      if (!st) return send(res, 200, { bad: true });
      let keep = c.alive.filter(i => E.same(c.lines[i][c.idx], w));
      if (!keep.length) keep = E.altLanding(c, st, w);
      if (!keep.length) return wrong();
      c.alive = keep; c.g = E.adv(c.g, st); c.idx++;
      const opp = [], done = () => c.alive.some(i => c.lines[i].length === c.idx);
      while (!done() && c.g.side !== c.p.side) {
        const cand = c.alive.filter(i => c.lines[i][c.idx]); if (!cand.length) break;
        const x = c.lines[cand[Math.floor(Math.random() * cand.length)]][c.idx];
        const os = E.findStep(E.legal(c.g.b, c.g.side, c.g.forced), x); if (!os) break;
        c.alive = cand.filter(i => E.same(c.lines[i][c.idx], x)); c.g = E.adv(c.g, os); c.idx++; opp.push(x);
      }
      if (done()) {
        me.score++; me.at = now;
        const pz = loadNext(store, m, me); check(store, m);
        return send(res, 200, Object.assign(view(store, m, uid), { ok: true, solved: true, opp, pz }));
      }
      return send(res, 200, Object.assign(view(store, m, uid), { ok: true, opp }));
    }
    send(res, 404, { error: 'none' });
  });
  return true;
}

// eski navbat va o'yinlarni tozalash
setInterval(() => { const now = Date.now(); for (const [k, x] of Q) if (now - x.seen > 15000) Q.delete(k); for (const [c, x] of INV) if (now - x.at > INV_TTL) { INV.delete(c); INVBY.delete(x.uid); } }, 10000).unref();

module.exports = { handle };
