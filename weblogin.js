'use strict';
// weblogin.js — Telegramdan tashqarida (brauzer, Play Market ilovasi) kirish.
// Oqim: sayt /api/auth/start → kod → foydalanuvchi botda «✅ Ha, kiraman» ni bosadi → sayt /api/auth/poll orqali sessiya oladi.
// Sessiya — server BOT_TOKEN bilan imzolagan Telegram initData formatidagi satr, shuning uchun
// barcha mavjud tekshiruvlar (auth.js, rooms.js) uni hech qanday o'zgarishsiz qabul qiladi.
// initData 24 soat amal qiladi; uzoq muddatli «refresh» kalit bilan yangilanadi (180 kun).
const crypto = require('crypto');

const TTL = 10 * 60e3;                 // kirish kodi 10 daqiqa amal qiladi
const REFRESH_DAYS = 180;
const PEND = new Map();                // code -> { at, user, ok, ip }

function tok() { return process.env.BOT_TOKEN || ''; }
function botName() { return process.env.BOT_USERNAME || 'DraughtsPRObot'; }
function b64u(s) { return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(); }
function rcode() { const a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.randomBytes(20); let s = ''; for (let i = 0; i < 20; i++) s += a[b[i] % a.length]; return s; }
function cleanup() { const now = Date.now(); for (const [k, v] of PEND) if (now - v.at > TTL) PEND.delete(k); }

function pickUser(u) {
  const o = { id: Number(u.id), first_name: String(u.first_name || '').slice(0, 64) };
  if (u.last_name) o.last_name = String(u.last_name).slice(0, 64);
  if (u.username) o.username = String(u.username).slice(0, 64);
  if (u.language_code) o.language_code = String(u.language_code).slice(0, 8);
  return o;
}
// Telegram Mini App initData bilan bir xil algoritm
function mintInitData(u) {
  const p = new URLSearchParams();
  p.set('auth_date', String(Math.floor(Date.now() / 1000)));
  p.set('user', JSON.stringify(pickUser(u)));
  const dcs = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(tok()).digest();
  p.set('hash', crypto.createHmac('sha256', secret).update(dcs).digest('hex'));
  return p.toString();
}
function rkey() { return crypto.createHash('sha256').update('sp-refresh:' + tok()).digest(); }
function mintRefresh(u) {
  const body = b64u(JSON.stringify({ u: pickUser(u), exp: Date.now() + REFRESH_DAYS * 864e5 }));
  return body + '.' + crypto.createHmac('sha256', rkey()).update(body).digest('hex');
}
function readRefresh(r) {
  const [body, sig] = String(r || '').split('.');
  if (!body || !sig) return null;
  const calc = crypto.createHmac('sha256', rkey()).update(body).digest('hex');
  if (calc.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(sig))) return null;
  try { const j = JSON.parse(unb64u(body)); return j && j.u && j.exp > Date.now() ? j : null; } catch (e) { return null; }
}
function session(u) { return { initData: mintInitData(u), user: pickUser(u), refresh: mintRefresh(u) }; }

// ---------- bot tomoni (bot.js chaqiradi)
function botStart(code, from) { // /start login_CODE
  cleanup();
  const P = PEND.get(code);
  if (!P || P.ok) return null;
  P.user = pickUser(from);
  return P;
}
function botConfirm(code, from) { // «✅ Ha, kiraman» tugmasi
  const P = PEND.get(code);
  if (!P || !P.user || String(P.user.id) !== String(from.id)) return false;
  P.ok = true; P.user = pickUser(from);
  return true;
}

// ---------- Google orqali kirish (tashqi brauzerda Google OAuth; ilova esa /api/auth/poll bilan kutadi)
// Render Environment: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google Cloud → OAuth client, turi «Web application»)
// Redirect URI: https://shashkapro.onrender.com/api/auth/gcb
function gconf() { return { id: process.env.GOOGLE_CLIENT_ID || '', secret: process.env.GOOGLE_CLIENT_SECRET || '' }; }
function baseUrl(req) { return process.env.PUBLIC_URL || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'shashkapro.onrender.com')); }
function gRedirect(req) { return baseUrl(req) + '/api/auth/gcb'; }
// Google foydalanuvchisiga barqaror raqamli ID (Telegram ID lar bilan to'qnashmaydi: 9·10^11 dan boshlanadi)
function gUid(sub) {
  const store = require('./store');
  const db = store.db; db.gauth = db.gauth || {}; db.gnext = db.gnext || 900000000001;
  if (!db.gauth[sub]) { db.gauth[sub] = db.gnext++; store.save(); }
  return db.gauth[sub];
}
function htmlPage(title, body) {
  return '<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title>' +
    '<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;box-sizing:border-box;text-align:center;color:#fff;font-family:system-ui,Roboto,sans-serif;background:radial-gradient(circle at 50% 20%,#3a1a7a,#140a33 70%)}h1{margin:0;font-size:26px}p{margin:0;color:#d9d2ff;max-width:340px;line-height:1.5;font-size:17px}a.b{display:inline-block;border-radius:14px;padding:14px 24px;font:800 17px system-ui;color:#fff;background:#2563eb;text-decoration:none}</style></head><body>' + body + '</body></html>';
}
function sendHtml(res, code, html) { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(html); }
async function gCallback(req, res, url) {
  const st = url.searchParams.get('state') || '', code = url.searchParams.get('code') || '', P = PEND.get(st);
  if (!P || Date.now() - P.at > TTL) return sendHtml(res, 400, htmlPage('ShashkaPRO', '<h1>⌛ Havola eskirgan</h1><p>Ilovaga qaytib, «Google orqali kirish» ni qaytadan bosing.</p>'));
  if (!code) return sendHtml(res, 400, htmlPage('ShashkaPRO', '<h1>❌ Kirish bekor qilindi</h1><p>Ilovaga qaytib, qaytadan urinib ko‘ring.</p>'));
  try {
    const g = gconf();
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: g.id, client_secret: g.secret, redirect_uri: gRedirect(req), grant_type: 'authorization_code' }).toString() });
    const j = await r.json();
    if (!j.id_token) throw new Error(j.error_description || j.error || 'token');
    // id_token Google'ning token manzilidan to'g'ridan-to'g'ri (TLS) keldi — imzoni qayta tekshirish shart emas
    const c = JSON.parse(Buffer.from(j.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (c.aud !== g.id || !c.sub) throw new Error('aud');
    const user = { id: gUid(String(c.sub)), first_name: String(c.given_name || c.name || (c.email || '').split('@')[0] || 'O‘yinchi').slice(0, 40) };
    if (c.family_name) user.last_name = String(c.family_name).slice(0, 40);
    if (c.locale) user.language_code = String(c.locale).slice(0, 2);
    P.user = pickUser(user); P.ok = true; P.via = 'google';
    try { require('./store').getOrCreate(P.user); } catch (e) {}
    if (P.app) return sendHtml(res, 200, htmlPage('ShashkaPRO', '<h1>✅ Kirdingiz, ' + P.user.first_name.replace(/[<>&"]/g, '') + '!</h1><p>Endi <b>ShashkaPRO ilovasiga qayting</b> — o‘yin o‘zi ochiladi.</p><p style="font-size:14px;opacity:.75">Bu oynani yopsangiz bo‘ladi.</p>'));
    // brauzerda (sayt): sessiyani shu yerning o'zida saqlab, o'yinga qaytamiz
    const s = session(P.user); PEND.delete(st);
    const a = JSON.stringify({ initData: s.initData, user: s.user, refresh: s.refresh, at: Date.now() }).replace(/</g, '\\u003c');
    return sendHtml(res, 200, htmlPage('ShashkaPRO', '<h1>✅ Kirdingiz!</h1><p>O‘yin ochilmoqda…</p><script>try{localStorage.setItem("spAuth",' + JSON.stringify(a) + ')}catch(e){}location.replace("/")</script>'));
  } catch (e) {
    console.log('[gauth]', e.message);
    return sendHtml(res, 500, htmlPage('ShashkaPRO', '<h1>⚠️ Google bilan kirib bo‘lmadi</h1><p>Birozdan keyin qaytadan urinib ko‘ring.</p>'));
  }
}

// ---------- HTTP
function handle(req, res, p, ctx) {
  const { send, readBody } = ctx;
  if (p === '/api/auth/config' && req.method === 'GET') { send(res, 200, { google: !!(gconf().id && gconf().secret), telegram: !!tok() }); return true; }
  if (p === '/api/auth/gcb' && req.method === 'GET') { gCallback(req, res, new URL(req.url, 'http://x')); return true; }
  if (p === '/api/auth/gstart' && req.method === 'POST') {
    const g = gconf(); if (!g.id || !g.secret) { send(res, 200, { error: 'Google kirish hali sozlanmagan' }); return true; }
    readBody(req, 300, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      cleanup();
      if (PEND.size > 5000) return send(res, 429, { error: 'Keyinroq urinib ko‘ring' });
      const code = rcode();
      PEND.set(code, { at: Date.now(), user: null, ok: false, app: !!j.app });
      const q = new URLSearchParams({ client_id: g.id, redirect_uri: gRedirect(req), response_type: 'code', scope: 'openid email profile', state: code, prompt: 'select_account' });
      send(res, 200, { code, url: 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString(), ttl: TTL });
    });
    return true;
  }
  if (!tok()) { send(res, 500, { error: 'BOT_TOKEN yo‘q' }); return true; }
  if (p === '/api/auth/start' && req.method === 'POST') {
    cleanup();
    if (PEND.size > 5000) { send(res, 429, { error: 'Keyinroq urinib ko‘ring' }); return true; }
    const code = rcode();
    PEND.set(code, { at: Date.now(), user: null, ok: false });
    send(res, 200, { code, link: 'https://t.me/' + botName() + '?start=login_' + code, tg: 'tg://resolve?domain=' + botName() + '&start=login_' + code, ttl: TTL });
    return true;
  }
  if (p === '/api/auth/poll' && req.method === 'POST') {
    readBody(req, 500, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      const P = PEND.get(String(j.code || ''));
      if (!P || Date.now() - P.at > TTL) return send(res, 200, { error: 'expired' });
      if (!P.ok) return send(res, 200, { wait: true, seen: !!P.user });
      PEND.delete(String(j.code));
      send(res, 200, session(P.user));
    });
    return true;
  }
  if (p === '/api/auth/refresh' && req.method === 'POST') {
    readBody(req, 2000, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      const r = readRefresh(j.refresh);
      if (!r) return send(res, 200, { error: 'relogin' });
      send(res, 200, session(r.u));
    });
    return true;
  }
  return false;
}

module.exports = { handle, botStart, botConfirm, _t: { mintInitData, mintRefresh, readRefresh, PEND } };
