'use strict';
// social.js — 🎖 unvonlar (taklif qilingan do'stlar soni), ❤️ profilga like, 📸 Instagram'da ulash (post → admin tasdig'i → +50 🪙),
// 🔐 login + parol (Telegram ishlamaganda saytdan kirish).
const crypto = require('crypto');
const store = require('./store.js');
const users = () => store.users();
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const nm = u => String((u && u.name) || 'O‘yinchi').slice(0, 24);
const day = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);

// ---------- 🎖 unvonlar: taklif qilingan do'stlar soni (ref.js: u.refCount)
const RANKS = [
  { n: 0, name: '🌱 Yangi' }, { n: 2, name: '🪖 Askar' }, { n: 5, name: '🎖 Serjant' }, { n: 10, name: '⭐ Leytenant' },
  { n: 20, name: '🌟 Kapitan' }, { n: 35, name: '🏅 Mayor' }, { n: 50, name: '👑 General' }
];
function rankOf(u) {
  const n = (u && u.refCount) || 0; let i = 0;
  RANKS.forEach((r, k) => { if (n >= r.n) i = k; });
  const nx = RANKS[i + 1] || null;
  return { i, name: RANKS[i].name, n, next: nx ? { name: nx.name, n: nx.n, need: nx.n - n, from: RANKS[i].n } : null };
}

// ---------- ❤️ like: har o'yinchi boshqasiga kuniga 1 marta (kamida 3 o'yin o'ynagan bo'lishi kerak)
function like(me, uid) {
  const us = users(), a = us[me], b = us[String(uid)];
  if (!a || !b) return { error: 'O‘yinchi topilmadi' };
  if (me === String(uid)) return { error: 'O‘zingizga like bosib bo‘lmaydi' };
  if ((a.games || 0) < 3) return { error: 'Like bosish uchun kamida 3 ta o‘yin o‘ynang' };
  b.lkBy = b.lkBy || {};
  if (b.lkBy[me] === day()) return { error: 'Bugun allaqachon like bosgansiz', likes: b.lk || 0, liked: true };
  b.lkBy[me] = day(); b.lk = (b.lk || 0) + 1;
  const ks = Object.keys(b.lkBy); if (ks.length > 400) for (const k of ks.slice(0, ks.length - 400)) delete b.lkBy[k];
  store.save();
  return { ok: true, likes: b.lk, liked: true };
}

// ---------- 📸 Instagram'da ulash
const IGB = 50, IG_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/([A-Za-z0-9_-]{5,40})/i;
function igSubmit(me, url) {
  const u = users()[me]; if (!u) return { error: 'Avval o‘yinga kiring' };
  const m = IG_RE.exec(String(url || '').trim()); if (!m) return { error: 'Instagram post havolasini qo‘ying (instagram.com/p/… yoki /reel/…)' };
  const code = m[3], db = store.db, seen = db.igSeen = db.igSeen || {};
  if (seen[code]) return { error: 'Bu post allaqachon yuborilgan' };
  u.ig = u.ig || [];
  if (u.ig.some(x => x.st === 'p')) return { error: 'Oldingi postingiz hali tekshirilmoqda' };
  if (u.ig.some(x => x.st === 'ok' && day() === new Date(x.at + 5 * 3600e3).toISOString().slice(0, 10))) return { error: 'Bugun bonus olgansiz — ertaga yana post yuboring' };
  const p = { code, url: 'https://www.instagram.com/' + m[2].toLowerCase().replace('reels', 'reel') + '/' + code + '/', st: 'p', at: Date.now() };
  u.ig.push(p); if (u.ig.length > 20) u.ig.shift(); seen[code] = me; store.save();
  for (const a of ADM()) tg('sendMessage', { chat_id: a, parse_mode: 'HTML', disable_web_page_preview: false,
    text: '📸 <b>Instagram post</b>\n👤 ' + esc(nm(u)) + ' (<code>' + me + '</code>) · do‘stlari: ' + (u.refCount || 0) + '\n' + p.url + '\n\nPostda rasm va bot havolasi bormi? Tasdiqlansa: +' + IGB + ' 🪙',
    reply_markup: { inline_keyboard: [[{ text: '✅ +' + IGB + ' 🪙', callback_data: 'ig:ok:' + me + ':' + code }, { text: '❌ Rad etish', callback_data: 'ig:no:' + me + ':' + code }]] } });
  return { ok: true };
}
async function onCallback(q) {
  const d = String(q.data || '').split(':'); if (d[0] !== 'ig') return false;
  const ans = t => tg('answerCallbackQuery', { callback_query_id: q.id, text: t });
  if (!ADM().includes(String(q.from.id))) { await ans('Faqat admin'); return true; }
  const u = users()[d[2]], p = u && (u.ig || []).find(x => x.code === d[3]);
  if (!p) { await ans('Post topilmadi'); return true; }
  if (p.st !== 'p') { await ans('Allaqachon ko‘rib chiqilgan'); return true; }
  p.st = d[1] === 'ok' ? 'ok' : 'no'; p.by = String(q.from.id);
  if (p.st === 'ok') { require('./economy.js').add(d[2], IGB, 'ig-post'); u.igOk = (u.igOk || 0) + 1; }
  store.save();
  tg('sendMessage', { _cat: 'ach', chat_id: d[2], text: p.st === 'ok' ? '📸 Instagram postingiz tasdiqlandi: +' + IGB + ' 🪙\nRahmat! Postingiz orqali kelgan har bir do‘st uchun ham mukofot olasiz.' : '📸 Instagram postingiz tasdiqlanmadi. Postda ShashkaPRO rasmi va havolangiz bo‘lishi kerak.' });
  await ans(p.st === 'ok' ? 'Tasdiqlandi' : 'Rad etildi');
  if (q.message) tg('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[{ text: p.st === 'ok' ? '✅ Tasdiqlangan' : '❌ Rad etilgan', callback_data: 'ig:x' }]] } });
  return true;
}
function igTop() {
  return Object.entries(users()).filter(([, u]) => (u.igOk || 0) > 0)
    .map(([id, u]) => ({ name: nm(u), uid: id, posts: u.igOk, friends: u.refCount || 0, av: !!(u.avatar) }))
    .sort((a, b) => b.friends - a.friends || b.posts - a.posts).slice(0, 30);
}

// ---------- 🔐 login + parol
const LOGIN_RE = /^[a-z0-9_]{4,20}$/;
function hashPw(pw, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return 'scrypt$' + salt + '$' + crypto.scryptSync(String(pw), salt, 32).toString('hex'); }
function checkPw(pw, h) {
  const [k, salt, hex] = String(h || '').split('$'); if (k !== 'scrypt' || !salt || !hex) return false;
  const a = Buffer.from(crypto.scryptSync(String(pw), salt, 32).toString('hex')), b = Buffer.from(hex);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function setPass(me, login, pw) {
  const u = users()[me]; if (!u) return { error: 'Avval o‘yinga kiring' };
  login = String(login || '').trim().toLowerCase(); pw = String(pw || '');
  if (!LOGIN_RE.test(login)) return { error: 'Login: 4–20 ta lotin harfi, raqam yoki _' };
  if (pw.length < 6 || pw.length > 64) return { error: 'Parol kamida 6 ta belgi bo‘lsin' };
  const L = store.db.logins = store.db.logins || {};
  if (L[login] && L[login] !== me) return { error: 'Bu login band, boshqasini tanlang' };
  if (u.login && u.login !== login) delete L[u.login];
  L[login] = me; u.login = login; u.pw = hashPw(pw); store.save();
  return { ok: true, login };
}
const FAIL = new Map();   // kalit (ip|login) -> [vaqtlar]
function tooMany(k) { const now = Date.now(), a = (FAIL.get(k) || []).filter(t => now - t < 10 * 60e3); FAIL.set(k, a); if (FAIL.size > 5000) FAIL.delete(FAIL.keys().next().value); return a.length >= 6; }
function fail(k) { const a = FAIL.get(k) || []; a.push(Date.now()); FAIL.set(k, a); }
function passLogin(ip, login, pw) {
  login = String(login || '').trim().toLowerCase();
  if (tooMany('i' + ip) || tooMany('l' + login)) return { error: 'Juda ko‘p urinish. 10 daqiqadan keyin qayta urinib ko‘ring' };
  const uid = (store.db.logins || {})[login], u = uid && users()[uid];
  if (!u || !u.pw || !checkPw(pw, u.pw)) { fail('i' + ip); fail('l' + login); return { error: 'Login yoki parol noto‘g‘ri' }; }
  return { user: { id: Number(uid), first_name: String(u.name || login).slice(0, 40) } };
}

// ---------- HTTP: /api/social/*
function handle(req, res, p, h) {
  if (!p.startsWith('/api/social/')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const me = String(t.id), u = users()[me] || {};
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    if (p === '/api/social/me') return h.send(res, 200, { rank: rankOf(u), ranks: RANKS, likes: u.lk || 0, login: u.login || '', hasPass: !!u.pw,
      ig: { bonus: IGB, posts: (u.ig || []).slice(-10).reverse().map(x => ({ url: x.url, st: x.st, at: x.at })), ok: u.igOk || 0 } }), true;
    if (p === '/api/social/user') { const id = String(url.searchParams.get('uid') || ''), x = users()[id]; if (!x) return h.send(res, 200, { error: 'none' }), true;
      return h.send(res, 200, { likes: x.lk || 0, liked: !!(x.lkBy && x.lkBy[me] === day()), rank: rankOf(x).name }), true; }
    if (p === '/api/social/igtop') return h.send(res, 200, { list: igTop() }), true;
    h.send(res, 404, { error: 'none' }); return true;
  }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/social/like') return h.send(res, 200, like(me, j.uid));
    if (p === '/api/social/ig') return h.send(res, 200, igSubmit(me, j.url));
    if (p === '/api/social/setpass') return h.send(res, 200, setPass(me, j.login, j.password));
    h.send(res, 404, { error: 'none' });
  });
  return true;
}
module.exports = { handle, onCallback, passLogin, rankOf, RANKS, _t: { hashPw, checkPw } };
