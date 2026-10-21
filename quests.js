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

function users() { return store ? store.users() : {}; }
function qstate(u) {
  const d = dayKey();
  if (!u.qd || u.qd.d !== d) u.qd = { d, p: {}, c: [], b: false };
  return u.qd;
}
function bump(uid, kind, n) {
  try {
    if (!store) store = require('./store');
    const u = users()[String(uid)]; if (!u) return;
    const q = qstate(u);
    q.p[kind] = (q.p[kind] || 0) + (n || 1);
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
  u.lastDaily = new Date().toISOString().slice(0, 10); // eski "kunlik bonus" bilan ikki marta olinmasin
  store.save();
  return { ok: true, amount: i.reward, day: i.day };
}

function view(u) {
  const q = qstate(u), list = todays(q.d);
  return {
    quests: list.map((pi, j) => { const x = POOL[pi]; return { i: j, ic: x.ic, t: x.t, n: x.n, r: x.r, p: Math.min(x.n, q.p[x.k] || 0), done: (q.p[x.k] || 0) >= x.n, claimed: !!q.c[j] }; }),
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

  if (p === '/api/quests' && req.method === 'GET') { const v = view(u); store.save(); send(res, 200, v); return true; }
  if (req.method !== 'POST') return false;

  if (p === '/api/quests/streak') { const r = claimStreak(u); send(res, 200, Object.assign(r, { state: view(u) })); return true; }
  if (p === '/api/quests/claim') {
    readBody(req, 1000, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      const q = qstate(u), list = todays(q.d);
      if (j.bonus) {
        if (q.b) return send(res, 200, { error: 'Olingan' });
        if (!list.every((_, k) => q.c[k])) return send(res, 200, { error: 'Avval uchala vazifani bajaring' });
        q.b = true; u.diamonds = (u.diamonds || 0) + BONUS; store.save();
        return send(res, 200, { ok: true, amount: BONUS, state: view(u) });
      }
      const k = Math.floor(+j.i); if (!(k >= 0 && k < list.length)) return send(res, 200, { error: 'xato' });
      const x = POOL[list[k]];
      if (q.c[k]) return send(res, 200, { error: 'Olingan' });
      if ((q.p[x.k] || 0) < x.n) return send(res, 200, { error: 'Hali bajarilmagan' });
      q.c[k] = true; u.diamonds = (u.diamonds || 0) + x.r; store.save();
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

module.exports = { handle, bump, view, _t: { todays, POOL, streakInfo, claimStreak, dayKey, IMG } };
