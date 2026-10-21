'use strict';
// quests.js — kunlik vazifalar, ketma-ket kirish seriyasi (🔥) va natija rasmlarini ulashish.
// Hooklar: bump(uid, kind, n) — rooms.js (o'yin tugashi), economy.js (masala yechildi), pzrush.js, pzbattle.js
const https = require('https');
const crypto = require('crypto');

let store = null;
const POOL = [
  { k: 'game', t: '3 ta o‘yin o‘ynang', n: 3, r: 30, ic: '🎮' },
  { k: 'win', t: '2 ta o‘yinda g‘alaba qozoning', n: 2, r: 40, ic: '🏆' },
  { k: 'bot', t: 'Botni 1 marta yuting', n: 1, r: 30, ic: '🤖' },
  { k: 'puzzle', t: '5 ta masala yeching', n: 5, r: 30, ic: '🧩' },
  { k: 'puzzle', t: '10 ta masala yeching', n: 10, r: 50, ic: '🧩' },
  { k: 'rush', t: 'Puzzle Rush o‘ynang', n: 1, r: 20, ic: '⚡' },
  { k: 'battle', t: 'Masala jangida qatnashing', n: 1, r: 25, ic: '⚔️' },
  { k: 'share', t: 'Natijangizni ulashing', n: 1, r: 20, ic: '📸' },
];
// Har kuni birinchi vazifa — Petrova kitobidan navbatdagi masala (oyna tepasida doska bilan ko'rsatiladi)
const DAY_PZ = 5; // kuniga Petrova kitobidan nechta masala
const FIXED = { k: 'petrova', t: 'Petrova kitobidan 5 ta masala yeching', n: DAY_PZ, r: 50, ic: '📗' };
const BONUS = 50;                                   // uchala vazifa bajarilsa sandiq
const STREAK = [20, 25, 30, 35, 40, 50, 150];       // 1..7-kun kirish mukofoti (7-kundan keyin qaytadan)

const dayKey = (t) => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10); // Toshkent vaqti
const prevDay = (d) => new Date(Date.parse(d + 'T00:00:00Z') - 86400e3).toISOString().slice(0, 10);
function nextReset() { const d = dayKey(); return Date.parse(d + 'T00:00:00+05:00') + 86400e3; }

// Har kuni hamma uchun bir xil 3 ta vazifa (har xil turdagi)
function todays(d) {
  let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const idx = POOL.map((_, i) => i), out = [], kinds = new Set();
  while (out.length < 3 && idx.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    const i = idx.splice(h % idx.length, 1)[0];
    if (kinds.has(POOL[i].k)) continue;
    kinds.add(POOL[i].k); out.push(i);
  }
  return out;
}

function qlist(d) { return [FIXED].concat(todays(d).slice(0, 2).map(i => POOL[i])); }
function petrovaAll() { return ((store && store.db.puzzles) || []).filter(x => /^Petrova/.test(x.folder || '')).sort((a, b) => (a.no || 0) - (b.no || 0)); }
// Bugungi 5 ta masala: kun boshida kitob tartibida keyingi yechilmaganlar (kun davomida o'zgarmaydi)
function daySet(u) {
  const q = qstate(u), all = petrovaAll(); if (!all.length) return [];
  const ids = new Set(all.map(x => x.id));
  if (!Array.isArray(q.pzs) || !q.pzs.length || q.pzs.some(id => !ids.has(id))) {
    const sv = new Set(u.solved || []);
    let pick = all.filter(x => !sv.has(x.id)).slice(0, DAY_PZ);
    if (pick.length < DAY_PZ) { const off = Math.floor(Date.now() / 864e5) * DAY_PZ; for (let i = 0; pick.length < Math.min(DAY_PZ, all.length); i++) { const x = all[(off + i) % all.length]; if (!pick.includes(x)) pick.push(x); } }
    q.pzs = pick.map(x => x.id);
  }
  return q.pzs;
}
function nextPetrova(u) {
  const all = petrovaAll(); if (!all.length) return null;
  const set = daySet(u), q = qstate(u), sv = new Set(u.solved || []), dn = new Set(q.pzd || []);
  const byId = id => all.find(x => x.id === id);
  const left = set.filter(id => !dn.has(id) && !sv.has(id));
  const p = byId(left[0] || set[set.length - 1]);
  return { id: p.id, board: p.board, side: p.side, no: p.no || 0, title: p.title || '', level: p.level || 1, total: all.length, set: set, setDone: set.filter(id => dn.has(id) || sv.has(id)).length, done: !left.length, solvedN: all.filter(x => sv.has(x.id)).length };
}
function users() { return store ? store.users() : {}; }
function qstate(u) {
  const d = dayKey();
  if (!u.qd || u.qd.d !== d) u.qd = { d, p: {}, c: [], b: false };
  return u.qd;
}
function bump(uid, kind, n, pzId) {
  try {
    if (!store) store = require('./store');
    const u = users()[String(uid)]; if (!u) return;
    const q = qstate(u);
    if (kind === 'petrova') { // faqat bugungi 5 talikdagi masala hisoblanadi
      const set = daySet(u); if (!set.includes(pzId)) { store.save(); return; }
      q.pzd = q.pzd || []; if (q.pzd.includes(pzId)) return; q.pzd.push(pzId);
    }
    q.p[kind] = (q.p[kind] || 0) + (n || 1);
    stat(kind, n || 1);
    store.save();
  } catch (e) { console.log('[quests]', e.message); }
}

// ---------- kirish seriyasi
function streakInfo(u) {
  const d = dayKey(), s = u.strk || { n: 0, d: '' };
  const claimed = s.d === d;
  const alive = claimed || s.d === prevDay(d);
  const cur = alive ? s.n : 0;                       // bugun olinmagan bo'lsa — kechagi seriya
  const next = claimed ? cur : cur + 1;              // bugun olinadigan kun raqami
  return { n: cur, claimed, day: next, reward: STREAK[(next - 1) % 7], lost: !alive && s.n > 0 ? s.n : 0 };
}
function claimStreak(u) {
  const i = streakInfo(u);
  if (i.claimed) return { error: 'Bugun olingan' };
  u.strk = { n: i.day, d: dayKey(), best: Math.max(i.day, (u.strk && u.strk.best) || 0) };
  u.diamonds = (u.diamonds || 0) + i.reward;
  stat('streak_claim');
  u.lastDaily = new Date().toISOString().slice(0, 10); // eski "kunlik bonus" bilan ikki marta olinmasin
  store.save();
  return { ok: true, amount: i.reward, day: i.day };
}

function view(u) {
  const q = qstate(u), list = qlist(q.d);
  return {
    pz: nextPetrova(u),
    quests: list.map((x, j) => { return { i: j, ic: x.ic, t: x.t, n: x.n, r: x.r, p: Math.min(x.n, q.p[x.k] || 0), done: (q.p[x.k] || 0) >= x.n, claimed: !!q.c[j] }; }),
    bonus: { r: BONUS, claimed: !!q.b, ready: list.every((_, j) => q.c[j]) },
    streak: Object.assign(streakInfo(u), { list: STREAK, best: (u.strk && u.strk.best) || 0 }),
    reset: nextReset(), coins: u.diamonds || 0, day: q.d,
  };
}

// ---------- ulashish rasmlari (xotirada, 48 soat)
const IMG = new Map();
const IMG_TTL = 48 * 3600e3, IMG_MAX = 300;
function putImg(buf) {
  const id = crypto.randomBytes(9).toString('hex');
  IMG.set(id, { buf, at: Date.now() });
  if (IMG.size > IMG_MAX) IMG.delete(IMG.keys().next().value);
  return id;
}
function baseUrl(req) {
  const b = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
  if (b) return b.replace(/\/$/, '');
  const h = req.headers['x-forwarded-host'] || req.headers.host;
  return h ? 'https://' + h : 'https://shashkapro.onrender.com';
}
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

// ---------- statistika: faollik va kunlik hisoblagichlar
function stat(key, n) {
  try {
    if (!store) store = require('./store');
    const d = dayKey(), m = store.db.mstat = store.db.mstat || {};
    const x = m[d] = m[d] || {}; x[key] = (x[key] || 0) + (n || 1);
    const ks = Object.keys(m).sort(); while (ks.length > 60) delete m[ks.shift()];
  } catch (e) {}
}
function touch(u) { // ilovaga kirgan kunlar (oxirgi 40 kun) — DAU va qaytish (retention) uchun
  const d = dayKey(); u.seen = Date.now();
  if (!u.created) u.created = 1; // eski foydalanuvchi: yaratilgan sanasi noma'lum — "yangi" deb sanalmasin
  u.days = Array.isArray(u.days) ? u.days : [];
  if (u.days[u.days.length - 1] !== d) { u.days.push(d); if (u.days.length > 40) u.days.splice(0, u.days.length - 40); }
}
const addDay = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400e3).toISOString().slice(0, 10);
function adminStats() {
  const us = users(), all = Object.entries(us).filter(([k]) => /^\d+$/.test(k)).map(([, v]) => v), today = dayKey(), m = store.db.mstat || {};
  const cday = u => u.created ? dayKey(u.created) : null, act = (u, d) => Array.isArray(u.days) && u.days.includes(d);
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = addDay(today, -i), nw = all.filter(u => cday(u) === d);
    const r = k => { const t = addDay(d, k); if (t > today || !nw.length) return null; return Math.round(nw.filter(u => act(u, t)).length * 100 / nw.length); };
    days.push({ d, dau: all.filter(u => act(u, d)).length, nw: nw.length, d1: r(1), d7: r(7), ev: m[d] || {} });
  }
  const within = n => { const from = addDay(today, -(n - 1)); return all.filter(u => Array.isArray(u.days) && u.days.some(x => x >= from)).length; };
  const lead = all.filter(u => u.strk && (u.strk.d === today || u.strk.d === addDay(today, -1))).sort((a, b) => b.strk.n - a.strk.n).slice(0, 10).map(u => ({ name: u.name || 'O‘yinchi', n: u.strk.n }));
  const since = Object.keys(m).sort()[0] || today;
  return { today, total: all.length, dau: days[0].dau, wau: within(7), mau: within(30), days, lead, ntfOff: all.filter(u => u.ntfOff || u.ntfOn === false).length, since };
}

// ---------- bot eslatmalari (kuniga ko'pi bilan 1 ta xabar)
let NT = null;
function tzHour() { return new Date(Date.now() + 5 * 3600e3).getUTCHours(); }
function notifyTick(hh) {
  if (process.env.NOTIFY_OFF === '1' || !process.env.BOT_TOKEN || !process.env.TG_APP_LINK || !store) return;
  const h = hh == null ? tzHour() : hh, today = dayKey(), now = Date.now(), y = prevDay(today), out = [];
  for (const [uid, u] of Object.entries(users())) {
    if (!/^\d+$/.test(uid) || u.ntfOff || u.ntfOn === false) continue;
    const n = u.ntf = u.ntf || {};
    if (n.d === today) continue;
    const s = u.strk;
    if (h >= 19 && h < 21 && s && s.d === y && s.n >= 2) out.push([uid, u, 'streak']);
    else if (h >= 18 && h < 20 && u.seen && now - u.seen > 3 * 864e5 && now - u.seen < 21 * 864e5 && (!n.back || now - n.back > 7 * 864e5)) out.push([uid, u, 'back']);
    if (out.length >= 300) break;
  }
  let i = 0, stop = false;
  const next = () => {
    if (stop || i >= out.length) { if (out.length) store.save(); return; }
    const [uid, u, type] = out[i++], s = u.strk || { n: 0 }, si = streakInfo(u);
    const text = type === 'streak'
      ? '🔥 ' + s.n + ' kunlik seriyangiz bugun uziladi!\n\nKirib bugungi sovg‘ani oling: +' + si.reward + ' 🪙\n📗 Kunlik 5 ta masala ham kutyapti.'
      : '👋 Sizni sog‘indik!\n\n📗 Bugungi 5 ta masala va 🎁 kunlik sovg‘a sizni kutyapti. Bir partiya o‘ynaymizmi?';
    const body = { chat_id: Number(uid), text, reply_markup: { inline_keyboard: [[{ text: type === 'streak' ? '🔥 Seriyani saqlash' : '🎮 O‘ynash', url: process.env.TG_APP_LINK + '?startapp=ntf_' + type }]] } };
    u.ntf.d = today; if (type === 'back') u.ntf.back = Date.now();
    if (process.env.NOTIFY_DRY === '1') { console.log('[notify dry]', uid, type); stat('ntf_' + type); return setTimeout(next, 10); }
    tg('sendMessage', body).then(r => {
      let j = {}; try { j = JSON.parse(r || '{}'); } catch (e) {}
      if (j.ok) stat('ntf_' + type);
      else if (j.error_code === 403 || j.error_code === 400) { u.ntfOff = true; stat('ntf_blocked'); }
      else if (j.error_code === 429) stop = true;
      setTimeout(next, 70);
    });
  };
  next();
}
function init(st) { store = st; if (NT) return; NT = setInterval(() => { try { notifyTick(); } catch (e) { console.log('[notify]', e.message); } }, 5 * 60e3); }

function handle(req, res, p, ctx) {
  store = ctx.store;
  const { verifyInitData, send, readBody } = ctx;

  // rasmni berish (Telegram serverlari ham shu manzildan oladi — avtorizatsiyasiz)
  const m = p.match(/^\/api\/share\/i\/([0-9a-f]{18})\.jpg$/);
  if (m && req.method === 'GET') {
    const x = IMG.get(m[1]);
    if (!x || Date.now() - x.at > IMG_TTL) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': x.buf.length, 'Cache-Control': 'public, max-age=86400' });
    res.end(x.buf); return true;
  }

  const tgu = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tgu) { send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tgu.id), u = users()[uid];
  if (!u) { send(res, 200, { error: 'no_user' }); return true; }

  if (p === '/api/quests' && req.method === 'GET') { touch(u); const v = view(u); v.admin = isAdmin(uid); v.ntfOn = !u.ntfOff && u.ntfOn !== false; store.save(); send(res, 200, v); return true; }
  if (p === '/api/admin/stats' && req.method === 'GET') { if (!isAdmin(uid)) { send(res, 403, { error: 'admin emassiz' }); return true; } send(res, 200, adminStats()); return true; }
  if (req.method !== 'POST') return false;
  if (p === '/api/quests/notify' || p === '/api/quests/open') {
    readBody(req, 500, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      if (p === '/api/quests/notify') { u.ntfOn = !!j.on; if (j.on) u.ntfOff = false; store.save(); return send(res, 200, { ok: true, on: u.ntfOn }); }
      const src = String(j.src || '').replace(/[^a-z_]/g, '').slice(0, 20); if (/^ntf_/.test(src)) stat('open_' + src); send(res, 200, { ok: true });
    });
    return true;
  }

  if (p === '/api/quests/streak') { const r = claimStreak(u); send(res, 200, Object.assign(r, { state: view(u) })); return true; }
  if (p === '/api/quests/claim') {
    readBody(req, 1000, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      const q = qstate(u), list = qlist(q.d);
      if (j.bonus) {
        if (q.b) return send(res, 200, { error: 'Olingan' });
        if (!list.every((_, k) => q.c[k])) return send(res, 200, { error: 'Avval uchala vazifani bajaring' });
        q.b = true; u.diamonds = (u.diamonds || 0) + BONUS; stat('q_bonus'); store.save();
        return send(res, 200, { ok: true, amount: BONUS, state: view(u) });
      }
      const k = Math.floor(+j.i); if (!(k >= 0 && k < list.length)) return send(res, 200, { error: 'xato' });
      const x = list[k];
      if (q.c[k]) return send(res, 200, { error: 'Olingan' });
      if ((q.p[x.k] || 0) < x.n) return send(res, 200, { error: 'Hali bajarilmagan' });
      q.c[k] = true; u.diamonds = (u.diamonds || 0) + x.r; stat('q_claim'); store.save();
      send(res, 200, { ok: true, amount: x.r, state: view(u) });
    });
    return true;
  }
  if (p === '/api/share/img') { // { img: 'data:image/jpeg;base64,...', cap }
    readBody(req, 2500000, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(j.img || ''));
      if (!mm) return send(res, 200, { error: 'rasm' });
      const buf = Buffer.from(mm[1], 'base64');
      if (buf.length < 1000 || buf.length > 1800000 || buf[0] !== 0xff || buf[1] !== 0xd8) return send(res, 200, { error: 'rasm' });
      const now = Date.now(); if (now - (u.shareAt || 0) < 3000) return send(res, 200, { error: 'slow' });
      u.shareAt = now;
      const id = putImg(buf), url = baseUrl(req) + '/api/share/i/' + id + '.jpg';
      bump(uid, 'share');
      const app = process.env.TG_APP_LINK || '';
      const link = app ? app + '?startapp=ref_' + uid : '';
      const cap = String(j.cap || '').replace(/[<>]/g, '').slice(0, 300) + (link ? '\n👉 ' + link : '');
      const r0 = { type: 'photo', id: 'sh' + id, photo_url: url, thumbnail_url: url, caption: cap };
      if (link) r0.reply_markup = { inline_keyboard: [[{ text: '🎮 O‘ynash', url: link }]] };
      tg('savePreparedInlineMessage', { user_id: Number(uid), result: r0, allow_user_chats: true, allow_group_chats: true, allow_channel_chats: true }).then(rr => {
        let pid = null; try { const x = JSON.parse(rr || '{}'); if (x.ok) pid = x.result.id; } catch (e) {}
        send(res, 200, { ok: true, url, pid, link });
      });
    });
    return true;
  }
  return false;
}

const isAdmin = id => (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean).includes(String(id));
module.exports = { handle, bump, view, init, stat, _t: { adminStats, notifyTick, touch, todays, qlist, nextPetrova, POOL, streakInfo, claimStreak, dayKey, IMG } };
