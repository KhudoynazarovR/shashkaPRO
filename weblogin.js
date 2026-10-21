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

// ---------- HTTP
function handle(req, res, p, ctx) {
  const { send, readBody } = ctx;
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
