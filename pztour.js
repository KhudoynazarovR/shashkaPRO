// 🧩 Masala turniri: hamma bir vaqtda, bir xil masalalar, quiz kabi. Javob va vaqtni server o'lchaydi.
// O'rin: avval yechilgan masalalar soni, teng bo'lsa — umumiy vaqt kam bo'lgan yuqorida, keyin ⚡ birinchi yechganlar soni.
'use strict';
const E = require('./pzrush.js')._t;
const https = require('https');
const crypto = require('crypto');

const CREATE_FEE = 50;                       // turnir yaratish narxi (admin uchun bepul)
const COUNTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const PER = [0, 30, 60, 120, 180, 300];      // har masalaga vaqt (0 = chegarasiz)
const PRIZES = [0, 100, 200, 300, 500, 1000];
const MAXERR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];                // 0 = o'chiq; N ta xato qilgan o'yinchi turnirdan chiqadi
const PZT = { 1: [100], 2: [60, 40], 3: [50, 30, 20], 4: [40, 28, 20, 12], 5: [35, 25, 18, 13, 9], 6: [30, 22, 17, 13, 10, 8], 7: [28, 20, 15, 12, 10, 8, 7], 8: [26, 19, 15, 12, 10, 8, 5, 5], 9: [24, 18, 14, 11, 10, 8, 6, 5, 4], 10: [22, 17, 13, 11, 9, 8, 7, 5, 4, 4] };
const LATE_JOIN = 0.5;                       // davomiylikning yarmigacha kech qo'shilish mumkin
const NOFOLDER = '__nofolder__';

const rid = () => Math.random().toString(36).slice(2, 9);
const isAdmin = uid => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(uid));
const clean = s => String(s || '').replace(/[<>\u0000-\u001f]/g, ' ').trim();

let store = null, dirty = false;
function db() { const d = store.db; d.pzTours = d.pzTours || []; return d.pzTours; }
function save() { dirty = true; }
setInterval(() => { if (dirty && store) { dirty = false; try { store.save(); } catch (e) {} } }, 4000).unref();

// ---------- masalalar
function folderStats() {
  const ok = new Set(E.bank(store).map(x => x.id)), m = {};
  for (const p of store.db.puzzles || []) {
    if (!ok.has(p.id)) continue;
    const f = p.folder && (store.db.pzFolders || []).includes(p.folder) ? p.folder : NOFOLDER;
    m[f] = (m[f] || 0) + 1;
  }
  return Object.keys(m).map(k => ({ name: k, title: k === NOFOLDER ? 'Papkasiz masalalar' : k, n: m[k] })).sort((a, b) => (a.name === NOFOLDER) - (b.name === NOFOLDER) || a.title.localeCompare(b.title));
}
function pickPuzzles(folders, count) {
  const ok = new Map(E.bank(store).map(x => [x.id, x])), fs = new Set(folders), pool = [];
  for (const p of store.db.puzzles || []) {
    const b = ok.get(p.id); if (!b) continue;
    const f = p.folder && (store.db.pzFolders || []).includes(p.folder) ? p.folder : NOFOLDER;
    if (fs.has(f)) pool.push(b);
  }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, count).sort((a, b) => a.k - b.k).map(x => x.id);
}
function puzzle(id) { return (store.db.puzzles || []).find(x => x.id === id) || null; }

// ---------- turnir
function duration(t) { return t.per ? t.q.length * t.per * 1000 : Math.min(90, Math.max(10, t.q.length * 2)) * 60000; }
function make(o) {
  const q = pickPuzzles(o.folders, o.count);
  const t = { id: rid(), name: o.name, creatorUid: o.uid, creatorName: o.uname, folders: o.folders, per: o.per, q, prize: o.prize, paid: o.paid || 0, places: o.places, startAt: o.startAt, status: 'reg', players: {}, firsts: {}, at: Date.now(), daily: o.daily || null };
  t.maxErr = MAXERR.includes(+o.maxErr) ? +o.maxErr : 0;
  t.endAt = t.startAt + duration(t);
  db().push(t); save();
  return t;
}
function find(id) { return db().find(x => x.id === id) || null; }
function player(t, uid) { return t.players[uid] || null; }

// o'yinchining joriy masalasi holati (xotirada; serverni qayta ishga tushirsa steps orqali tiklanadi)
const CHAT_AT = new Map();
const WATCH = new Map(); // tid -> Map(uid -> ts) tomoshabinlar
function watchers(t, now) { const m = WATCH.get(t.id); if (!m) return 0; let n = 0; for (const [k, ts] of m) { if (now - ts < 12000) n++; else m.delete(k); } return n; }
const LIVE = new Map(); // tid:uid -> { c }
function cur(t, uid) {
  const P = player(t, uid); if (!P || P.k >= t.q.length) return null;
  const key = t.id + ':' + uid; let L = LIVE.get(key);
  if (L && L.k === P.k) return L.c;
  const p = puzzle(t.q[P.k]);
  if (!p) { resolve(t, uid, false, 0); return cur(t, uid); }
  const lines = E.linesOf(p).filter(l => E.validLine(p, l)).map(l => l.slice());
  if (!lines.length) { resolve(t, uid, false, 0); return cur(t, uid); }
  const c = { p, lines, alive: lines.map((_, i) => i), idx: 0, g: { b: E.copy(p.board), side: p.side, forced: null } };
  for (const w of (P.steps || [])) { // tiklash
    const st = E.findStep(E.legal(c.g.b, c.g.side, c.g.forced), w); if (!st) break;
    c.alive = c.alive.filter(i => E.same(c.lines[i][c.idx], w)); if (!c.alive.length) c.alive = lines.map((_, i) => i);
    c.g = E.adv(c.g, st); c.idx++;
  }
  LIVE.set(key, { k: P.k, c });
  return c;
}
function resolve(t, uid, ok, ms, isErr) {
  const P = player(t, uid); if (!P || P.k >= t.q.length) return;
  const k = P.k;
  P.res.push({ k, ok, ms });
  P.time += ms;
  if (ok) {
    P.solved++; P.points += 2;
    if (!t.firsts[k]) { t.firsts[k] = uid; P.firsts++; P.points += 1; }
  }
  P.k++; P.steps = []; P.shownAt = 0;
  if (!ok && isErr) { P.err = (P.err || 0) + 1; if (t.maxErr && P.err >= t.maxErr) { P.out = true; P.k = t.q.length; } } // xatolar chegarasi
  if (P.k >= t.q.length) P.doneAt = Date.now();
  LIVE.delete(t.id + ':' + uid);
  save();
}
// vaqt chegarasi o'tgan bo'lsa masala yonadi
function tickPlayer(t, uid, now) {
  const P = player(t, uid); if (!P || t.status !== 'running') return;
  if (!P.started) return;
  while (P.k < t.q.length && t.per && P.shownAt && now - P.shownAt >= t.per * 1000) resolve(t, uid, false, t.per * 1000);
  if (P.k < t.q.length && !P.shownAt) { P.shownAt = Math.max(now, t.startAt); save(); }
}
const wtok = (t, uid) => crypto.createHash('sha1').update(t.id + ':' + uid).digest('hex').slice(0, 10);
function standings(t) {
  return Object.entries(t.players).map(([uid, P]) => ({ uid, w: wtok(t, uid), name: P.name, solved: P.solved, points: P.points, firsts: P.firsts, time: P.time, k: P.k, done: P.k >= t.q.length, out: !!P.out }))
    .sort((a, b) => b.solved - a.solved || a.time - b.time || b.firsts - a.firsts || a.name.localeCompare(b.name));
}
function step(now) {
  for (const t of db()) {
    if (t.status === 'reg' && now >= t.startAt) {
      if (!Object.keys(t.players).length) { t.status = 'finished'; t.empty = true; refundCreator(t); save(); continue; }
      t.status = 'running'; t.endAt = t.startAt + duration(t); save(); notifyStart(t);
    }
    if (t.status === 'running') {
      for (const uid of Object.keys(t.players)) tickPlayer(t, uid, now);
      const all = Object.values(t.players).every(P => P.k >= t.q.length);
      if (now >= t.endAt || all) finish(t);
    }
  }
  // eski turnirlarni tozalash (oxirgi 40 ta tugagani qoladi)
  const fin = db().filter(x => x.status === 'finished').sort((a, b) => b.endAt - a.endAt);
  if (fin.length > 40) { const drop = new Set(fin.slice(40).map(x => x.id)); store.db.pzTours = db().filter(x => !drop.has(x.id)); save(); }
  daily(now);
}
function refundCreator(t) {
  if (t.paid && t.creatorUid && store.users()[t.creatorUid]) { const u = store.users()[t.creatorUid]; u.diamonds = (u.diamonds || 0) + t.paid; t.refunded = t.paid; t.paid = 0; }
}
function finish(t) {
  if (t.status === 'finished') return;
  t.status = 'finished'; t.finishedAt = Date.now();
  const st = standings(t), us = store.users();
  const el = st.filter(x => x.solved > 0);
  t.awards = [];
  if (t.prize > 0 && el.length) {
    const n = Math.min(t.places || 3, el.length), sh = PZT[n];
    sh.forEach((pc, i) => {
      const amt = Math.floor(t.prize * pc / 100), u = us[el[i].uid];
      if (u && amt > 0) u.diamonds = (u.diamonds || 0) + amt;
      t.awards.push({ uid: el[i].uid, place: i + 1, amt });
    });
  } else if (t.prize > 0) refundCreator(t);
  st.forEach((x, i) => { const u = us[x.uid]; if (!u) return; u.pzt = u.pzt || {}; u.pzt.played = (u.pzt.played || 0) + 1; if (i === 0 && x.solved > 0) u.pzt.wins = (u.pzt.wins || 0) + 1; });
  // statistika
  t.stats = t.q.map((pid, k) => {
    let sol = 0, tm = 0, tried = 0;
    for (const P of Object.values(t.players)) { const r = P.res.find(z => z.k === k); if (!r) continue; tried++; if (r.ok) { sol++; tm += r.ms; } }
    const p = puzzle(pid);
    return { k, title: p ? p.title : '—', tried, solved: sol, avg: sol ? Math.round(tm / sol) : 0, first: t.firsts[k] ? (t.players[t.firsts[k]] || {}).name : null };
  });
  save(); try { store.save(); } catch (e) {}
  postResults(t, st);
}

// ---------- Telegram
function tg(method, body) {
  return new Promise(res => {
    if (!process.env.BOT_TOKEN) return res(null);
    try {
      const data = JSON.stringify(body);
      const r = https.request({ hostname: 'api.telegram.org', path: '/bot' + process.env.BOT_TOKEN + '/' + method, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, rs => { let s = ''; rs.on('data', d => { s += d; }); rs.on('end', () => res(s)); });
      r.on('error', () => res(null)); r.write(data); r.end();
    } catch (e) { res(null); }
  });
}
// banner rasm: /img/pzt.jpg (Telegram file_id keshlanadi)
function baseUrl(req) {
  const b = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
  if (b) return b.replace(/\/$/, '');
  const h = req && (req.headers['x-forwarded-host'] || req.headers.host);
  return h ? 'https://' + h : 'https://shashkapro.onrender.com';
}
function photoSrc(req) { return (store.db && store.db.pztPhotoId) || baseUrl(req) + '/img/pzt.jpg?v=1'; }
function rememberPhoto(r) {
  try { const j = JSON.parse(r || '{}'); const ph = j.ok && j.result && j.result.photo; if (ph && ph.length && !store.db.pztPhotoId) { store.db.pztPhotoId = ph[ph.length - 1].file_id; store.save(); } return !!j.ok; } catch (e) { return false; }
}
function annText(t) {
  const d = new Date(t.startAt + 5 * 3600e3).toISOString().slice(11, 16);
  return '🧩 Masala turniri: «' + t.name + '»\n🕐 ' + d + ' da boshlanadi\n📚 ' + t.q.length + ' ta masala' + (t.per ? ', har biriga ' + (t.per < 60 ? t.per + ' s' : t.per / 60 + ' daq') : '') + (t.prize ? '\n💰 Mukofot: ' + t.prize + ' (' + t.places + ' o‘ringa)' : '') + (t.maxErr ? '\n❌ ' + t.maxErr + ' ta xatoda turnirdan chiqiladi' : '') + '\n👥 Qatnashing — kim tez va ko‘p yechadi?';
}
function link(t) { const l = process.env.TG_APP_LINK || ''; return l ? l + '?startapp=pzt_' + t.id : ''; }
function fmt(ms) { const s = ms / 1000, m = Math.floor(s / 60); return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60).toFixed(1); }
function notifyStart(t) {
  const l = link(t);
  for (const uid of Object.keys(t.players)) {
    if (!/^\d+$/.test(uid)) continue;
    const b = { chat_id: Number(uid), text: '🧩 «' + t.name + '» masala turniri boshlandi!\n' + t.q.length + ' ta masala' + (t.per ? ', har biriga ' + t.per + ' s' : '') + '. Omad! 🍀' };
    if (l) b.reply_markup = { inline_keyboard: [[{ text: '▶️ Turnirga kirish', url: l }]] };
    tg('sendMessage', b);
  }
}
function postResults(t, st) {
  const gc = process.env.GROUP_CHAT_ID; if (!gc || !st.length) return;
  const M = ['🥇', '🥈', '🥉'];
  let tx = '🧩 «' + t.name + '» masala turniri yakunlandi!\n👥 ' + st.length + ' ishtirokchi · ' + t.q.length + ' ta masala\n\n';
  st.slice(0, 10).forEach((x, i) => {
    const a = (t.awards || []).find(z => z.uid === x.uid);
    tx += (M[i] || (i + 1) + '.') + ' ' + x.name + ' — ' + x.solved + '/' + t.q.length + ' · ' + fmt(x.time) + (x.firsts ? ' · ⚡' + x.firsts : '') + (a && a.amt ? ' · +' + a.amt + ' 💰' : '') + '\n';
  });
  const b = { chat_id: gc, text: tx };
  if (process.env.GROUP_TOPIC_ID) b.message_thread_id = Number(process.env.GROUP_TOPIC_ID);
  const l = process.env.TG_APP_LINK; if (l) b.reply_markup = { inline_keyboard: [[{ text: '🧩 Masalalar', url: l }]] };
  tg('sendMessage', b);
}

// ---------- kunlik turnir (admin shabloni)
function tzDay(now) { return new Date(now + 5 * 3600e3).toISOString().slice(0, 10); }
function daily(now) {
  const D = store.db.pztDaily; if (!D || !D.on) return;
  const day = tzDay(now), start = Date.parse(day + 'T' + D.hm + ':00+05:00');
  if (now < start - 60 * 60000 || now >= start) return;
  if (db().some(t => t.daily === day)) return;
  if (!pickPuzzles(D.folders, 1).length) return;
  make({ name: D.name, uid: 'system', uname: 'ShashkaPRO', folders: D.folders, count: D.count, per: D.per, prize: D.prize, places: D.places, maxErr: D.maxErr || 0, startAt: start, daily: day });
}

// ---------- ko'rinishlar
function summary(t, uid, now) {
  const P = player(t, uid);
  return { id: t.id, name: t.name, status: t.status, startAt: t.startAt, endAt: t.endAt, count: t.q.length, per: t.per, prize: t.prize, places: t.places, creatorName: t.creatorName, mine: t.creatorUid === uid, joined: !!P, players: Object.keys(t.players).length, maxErr: t.maxErr || 0, daily: !!t.daily, folders: t.folders.map(f => f === NOFOLDER ? 'Papkasiz' : f), canJoin: canJoin(t, now) };
}
function canJoin(t, now) { return t.status === 'reg' || (t.status === 'running' && now < t.startAt + duration(t) * LATE_JOIN); }
function full(t, uid, now) {
  const r = summary(t, uid, now), P = player(t, uid);
  r.now = now; r.link = link(t); r.admin = isAdmin(uid); r.watchers = watchers(t, now); r.watched = !!(t.watched && t.watched[uid]);
  r.chat = (t.chat || []).slice(-60).map(m => ({ id: m.id, name: m.name, text: m.text, at: m.at, me: m.uid === uid, host: m.uid === t.creatorUid }));
  r.table = standings(t).map((x, i) => Object.assign({ place: i + 1, me: x.uid === uid }, x, { uid: undefined, av: i < 3 && /^\d+$/.test(x.uid) ? x.uid : undefined }));
  r.awards = (t.awards || []).map(a => ({ place: a.place, amt: a.amt, name: (t.players[a.uid] || {}).name }));
  if (P) {
    r.me = { k: P.k, solved: P.solved, points: P.points, firsts: P.firsts, time: P.time, done: P.k >= t.q.length, started: !!P.started, res: P.res, err: P.err || 0, out: !!P.out };
    if (t.status === 'running' && P.started && P.k < t.q.length) {
      const c = cur(t, uid);
      if (c) { r.pz = Object.assign(E.pub(c.p), { k: P.k }); r.steps = P.steps || []; r.shownAt = P.shownAt; r.deadline = t.per ? P.shownAt + t.per * 1000 : 0; }
    }
  }
  if (t.status === 'finished') r.stats = t.stats || [];
  return r;
}

function handle(req, res, p, ctx) {
  store = ctx.store;
  const { verifyInitData, send, readBody } = ctx;
  const tgu = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tgu) { send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tgu.id), us = store.users(), u = us[uid] || {}, adm = isAdmin(uid), now = Date.now();
  step(now);

  if (p === '/api/pzt/list' && req.method === 'GET') {
    const list = db().filter(t => t.status !== 'finished' || now - (t.finishedAt || t.endAt) < 3 * 86400e3).sort((a, b) => (a.status === 'finished') - (b.status === 'finished') || (a.status === 'finished' ? b.endAt - a.endAt : a.startAt - b.startAt)).slice(0, 30);
    send(res, 200, { tours: list.map(t => summary(t, uid, now)), folders: folderStats(), admin: adm, fee: adm ? 0 : CREATE_FEE, coins: u.diamonds || 0, counts: COUNTS, pers: PER, prizes: PRIZES, maxErrs: MAXERR, daily: adm ? (store.db.pztDaily || null) : undefined, now });
    return true;
  }
  if (req.method !== 'POST') return false;
  readBody(req, 6000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/pzt/create') {
      const name = clean(j.name).slice(0, 40) || 'Masala turniri';
      const fs = new Set(folderStats().map(f => f.name)), folders = (Array.isArray(j.folders) ? j.folders : []).map(String).filter(f => fs.has(f)).slice(0, 20);
      if (!folders.length) return send(res, 200, { error: 'Kamida bitta papka tanlang' });
      const count = COUNTS.includes(+j.count) ? +j.count : 10, per = PER.includes(+j.per) ? +j.per : 0, prize = adm ? Math.max(0, Math.min(10000000, Math.floor(+j.prize) || 0)) : (PRIZES.includes(+j.prize) ? +j.prize : 0), places = Math.max(1, Math.min(10, Math.floor(+j.places) || 3));
      const startIn = Math.max(1, Math.min(24 * 60, Math.floor(+j.startIn) || 10)), maxErr = MAXERR.includes(+j.maxErr) ? +j.maxErr : 0;
      const avail = folderStats().filter(f => folders.includes(f.name)).reduce((s, f) => s + f.n, 0);
      if (avail < 5) return send(res, 200, { error: 'Tanlangan papkalarda masala kam (' + avail + ')' });
      if (db().filter(t => t.creatorUid === uid && t.status !== 'finished').length >= 3 && !adm) return send(res, 200, { error: 'Bir vaqtda 3 tadan ortiq turnir yaratib bo‘lmaydi' });
      const cost = (adm ? 0 : CREATE_FEE) + (adm ? 0 : prize);
      if (cost > 0) { if ((u.diamonds || 0) < cost) return send(res, 200, { error: 'Yetarli tanga yo‘q: ' + cost + ' 🪙 kerak' }); u.diamonds -= cost; }
      const t = make({ name, uid, uname: u.name || 'O‘yinchi', folders, count, per, prize, paid: adm ? 0 : prize, places, maxErr, startAt: now + startIn * 60000 });
      t.players[uid] = newP(u);
      if (adm && j.daily) {
        const hm = new Date(t.startAt + 5 * 3600e3).toISOString().slice(11, 16);
        store.db.pztDaily = { on: true, name, hm, folders, count, per, prize, places, maxErr };
        t.daily = tzDay(t.startAt);
      }
      save();
      return send(res, 200, { ok: true, id: t.id, cost, real: t.q.length });
    }
    if (p === '/api/pzt/daily') {
      if (!adm) return send(res, 403, { error: 'admin emassiz' });
      if (store.db.pztDaily) store.db.pztDaily.on = !!j.on;
      save(); return send(res, 200, { ok: true, daily: store.db.pztDaily || null });
    }
    const t = find(String(j.id || ''));
    if (!t) return send(res, 200, { error: 'Turnir topilmadi' });
    if (p === '/api/pzt/join') {
      if (!canJoin(t, now)) return send(res, 200, { error: 'Qo‘shilish vaqti o‘tgan' });
      if (t.status === 'running' && t.watched && t.watched[uid] && !t.players[uid]) return send(res, 200, { error: 'Masalalarni tomosha qilganingiz uchun bu turnirga qo‘shila olmaysiz' });
      if (!t.players[uid]) { t.players[uid] = newP(u); save(); }
      return send(res, 200, full(t, uid, now));
    }
    if (p === '/api/pzt/leave') {
      if (t.status === 'reg' && t.players[uid]) { delete t.players[uid]; save(); }
      return send(res, 200, full(t, uid, now));
    }
    if (p === '/api/pzt/cancel') {
      if (t.status !== 'reg' || (t.creatorUid !== uid && !adm)) return send(res, 200, { error: 'Bekor qilib bo‘lmaydi' });
      t.status = 'finished'; t.cancelled = true; t.finishedAt = now; refundCreator(t);
      if (t.creatorUid === uid && !adm && t.creatorUid !== 'system') { u.diamonds = (u.diamonds || 0) + CREATE_FEE; }
      save(); return send(res, 200, { ok: true });
    }
    if (p === '/api/pzt/state') return send(res, 200, full(t, uid, now));
    if (p === '/api/pzt/review') { // tugagan masalani ko'rish: holat + to'g'ri yechim
      const k = Math.floor(+j.k), me = player(t, uid), len = t.q.length;
      if (!(k >= 0 && k < len)) return send(res, 200, { error: 'Masala topilmadi' });
      if (t.status !== 'finished' && !(me && me.k >= len)) return send(res, 200, { error: 'Masalalarni o‘zingiz tugatganingizdan keyin ko‘rasiz' });
      const pz = puzzle(t.q[k]); if (!pz) return send(res, 200, { error: 'Masala o‘chirilgan' });
      const line = E.linesOf(pz).filter(l => E.validLine(pz, l))[0] || [];
      const r = me && me.res.filter(x => x.k === k)[0];
      return send(res, 200, Object.assign(E.pub(pz), { k, count: len, sol: line, res: r ? { ok: r.ok, ms: r.ms } : null, first: t.firsts[k] ? (t.players[t.firsts[k]] || {}).name || '' : '' }));
    }
    if (p === '/api/pzt/watch') { // boshqa o'yinchi qaysi masalani qanday yechayotganini kuzatish
      const tu = Object.keys(t.players).find(x => wtok(t, x) === String(j.w || '')), Q = tu && t.players[tu];
      if (!Q) return send(res, 200, { error: 'O‘yinchi topilmadi' });
      const me = player(t, uid), len = t.q.length;
      const r = { name: Q.name, k: Q.k, count: len, done: Q.k >= len, out: !!Q.out, started: !!Q.started, solved: Q.solved, points: Q.points, time: Q.time, err: Q.err || 0, maxErr: t.maxErr || 0, res: Q.res.map(x => ({ k: x.k, ok: x.ok, ms: x.ms })), status: t.status, now, watchers: watchers(t, now) };
      if (t.status !== 'running' || !Q.started || Q.k >= len) return send(res, 200, r);
      // adolat: o'zi hali yechmagan masalani ko'ra olmaydi
      if (me && me.k < len && Q.k >= me.k) { r.lock = true; return send(res, 200, r); }
      if (!me && canJoin(t, now)) { t.watched = t.watched || {}; if (!t.watched[uid]) { t.watched[uid] = 1; save(); } }
      if (tu !== uid) { if (!WATCH.has(t.id)) WATCH.set(t.id, new Map()); WATCH.get(t.id).set(uid, now); }
      const c = cur(t, tu);
      if (c) { r.pz = Object.assign(E.pub(c.p), { k: Q.k }); r.steps = Q.steps || []; r.shownAt = Q.shownAt; r.deadline = t.per ? Q.shownAt + t.per * 1000 : 0; }
      return send(res, 200, r);
    }
    if (p === '/api/pzt/chat') { // turnir chati
      const tx = clean(j.text).slice(0, 200);
      if (!tx) return send(res, 200, full(t, uid, now));
      const last = CHAT_AT.get(uid) || 0; if (now - last < 1000) return send(res, 200, full(t, uid, now));
      CHAT_AT.set(uid, now);
      t.chat = t.chat || []; t.chat.push({ id: rid(), uid, name: u.name || 'O‘yinchi', text: tx, at: now });
      if (t.chat.length > 120) t.chat.splice(0, t.chat.length - 120);
      save(); return send(res, 200, full(t, uid, now));
    }
    if (p === '/api/pzt/shareprep') { // foydalanuvchi ulashishi uchun rasmli tayyor xabar (WebApp.shareMessage)
      const l = link(t); if (!l || !/^\d+$/.test(uid)) return send(res, 200, { error: 'no' });
      const fid = store.db.pztPhotoId, cap = annText(t) + '\n👇';
      const r0 = { id: ('pzt' + t.id + Date.now().toString(36)).slice(0, 60), caption: cap, reply_markup: { inline_keyboard: [[{ text: '✅ Qatnashish', url: l }]] } };
      if (fid) { r0.type = 'photo'; r0.photo_file_id = fid; } else { const u2 = baseUrl(req) + '/img/pzt.jpg?v=1'; r0.type = 'photo'; r0.photo_url = u2; r0.thumbnail_url = u2; }
      tg('savePreparedInlineMessage', { user_id: Number(uid), result: r0, allow_user_chats: true, allow_group_chats: true, allow_channel_chats: true }).then(r => {
        let pid = null; try { const j = JSON.parse(r || '{}'); if (j.ok) pid = j.result.id; } catch (e) {}
        send(res, 200, pid ? { pid } : { error: 'prep' });
      });
      return;
    }
    if (p === '/api/pzt/announce') { // admin: bot orqali guruhga e'lon
      if (!adm) return send(res, 403, { error: 'admin emassiz' });
      const gc = process.env.GROUP_CHAT_ID; if (!gc) return send(res, 200, { error: 'GROUP_CHAT_ID sozlanmagan' });
      const l = link(t), mk = l ? { inline_keyboard: [[{ text: '✅ Qatnashish', url: l }]] } : undefined;
      const b = { chat_id: gc, photo: photoSrc(req), caption: annText(t) };
      if (process.env.GROUP_TOPIC_ID) b.message_thread_id = Number(process.env.GROUP_TOPIC_ID);
      if (mk) b.reply_markup = mk;
      tg('sendPhoto', b).then(r => {
        if (rememberPhoto(r)) return send(res, 200, { ok: true });
        const m = { chat_id: gc, text: annText(t) }; if (b.message_thread_id) m.message_thread_id = b.message_thread_id; if (mk) m.reply_markup = mk;
        tg('sendMessage', m).then(r2 => { let ok = false; try { ok = JSON.parse(r2 || '{}').ok; } catch (e) {} send(res, 200, ok ? { ok: true } : { error: 'Guruhga yuborilmadi' }); });
      });
      return;
    }
    const P = player(t, uid);
    if (!P) return send(res, 200, full(t, uid, now));
    if (p === '/api/pzt/go') { // o'yinchi yechishni boshlaydi
      if (t.status === 'running' && !P.started) { P.started = now; P.shownAt = now; save(); }
      return send(res, 200, full(t, uid, now));
    }
    if (t.status !== 'running' || !P.started || P.k >= t.q.length) return send(res, 200, full(t, uid, now));
    if (p === '/api/pzt/skip') {
      resolve(t, uid, false, now - (P.shownAt || now)); tickPlayer(t, uid, now); step(now);
      return send(res, 200, Object.assign(full(t, uid, now), { wrong: true }));
    }
    if (p === '/api/pzt/move') {
      const c = cur(t, uid); if (!c) return send(res, 200, full(t, uid, now));
      const k0 = P.k, w = Array.isArray(j.step) ? j.step.map(Number) : [];
      if (j.k !== undefined && +j.k !== k0) return send(res, 200, full(t, uid, now)); // eski masalaga yurish
      if (c.g.side !== c.p.side) return send(res, 200, { bad: true });
      const st = E.findStep(E.legal(c.g.b, c.g.side, c.g.forced), w);
      if (!st) return send(res, 200, { bad: true });
      let keep = c.alive.filter(i => E.same(c.lines[i][c.idx], w));
      if (!keep.length) keep = E.altLanding(c, st, w);
      if (!keep.length) {
        const sol = c.lines[c.alive[0]].slice(c.idx);
        resolve(t, uid, false, now - P.shownAt, true); tickPlayer(t, uid, now); step(now);
        return send(res, 200, Object.assign(full(t, uid, now), { wrong: true, sol }));
      }
      c.alive = keep; c.g = E.adv(c.g, st); c.idx++; P.steps = (P.steps || []).concat([w]);
      const opp = [], done = () => c.alive.some(i => c.lines[i].length === c.idx);
      while (!done() && c.g.side !== c.p.side) {
        const cand = c.alive.filter(i => c.lines[i][c.idx]); if (!cand.length) break;
        const x = c.lines[cand[Math.floor(Math.random() * cand.length)]][c.idx];
        const os = E.findStep(E.legal(c.g.b, c.g.side, c.g.forced), x); if (!os) break;
        c.alive = cand.filter(i => E.same(c.lines[i][c.idx], x)); c.g = E.adv(c.g, os); c.idx++; opp.push(x); P.steps.push(x);
      }
      if (done()) {
        const first = !t.firsts[k0];
        resolve(t, uid, true, now - P.shownAt); tickPlayer(t, uid, now); step(now);
        return send(res, 200, Object.assign(full(t, uid, now), { ok: true, solved: true, opp, first }));
      }
      save();
      return send(res, 200, Object.assign(full(t, uid, now), { ok: true, opp, k: k0 }));
    }
    send(res, 404, { error: 'none' });
  });
  return true;
}
function newP(u) { return { name: u.name || 'O‘yinchi', k: 0, solved: 0, points: 0, firsts: 0, time: 0, res: [], steps: [], started: 0, shownAt: 0, joinedAt: Date.now() }; }

// fon: turnirlarni o'z vaqtida boshlash/tugatish (so'rov bo'lmasa ham)
setInterval(() => { if (store) { try { step(Date.now()); } catch (e) { console.log('[pzt]', e.message); } } }, 5000).unref();
function init(s) { store = s; }

module.exports = { handle, init, _t: { make, find, standings, finish, step, pickPuzzles, folderStats, setStore: s => { store = s; } } };
