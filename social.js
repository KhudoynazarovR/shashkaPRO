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
  if (b.lkBy[me]) return { error: 'Siz allaqachon like bosgansiz', likes: b.lk || 0, liked: true };
  b.lkBy[me] = day(); b.lk = (b.lk || 0) + 1;
  const ks = Object.keys(b.lkBy); if (ks.length > 20000) for (const k of ks.slice(0, ks.length - 20000)) delete b.lkBy[k];
  store.save();
  return { ok: true, likes: b.lk, liked: true };
}

// ---------- ❤️ kim like bosgan: faqat profil egasi va adminlar ko'radi
function likers(me, uid) {
  const id = String(uid || me), x = users()[id];
  if (!x) return { error: 'O‘yinchi topilmadi' };
  if (me !== id && !ADM().includes(me)) return { error: 'Bu ro‘yxatni faqat profil egasi ko‘radi' };
  const us = users(), by = x.lkBy || {};
  const list = Object.keys(by).map(k => {
    const a = us[k] || {};
    return { uid: k, n: nm(a), vip: store.isPremium(a), d: by[k], elo: a.elo || 0 };
  }).sort((p, q) => String(q.d).localeCompare(String(p.d)) || q.elo - p.elo);
  return { likes: x.lk || 0, n: list.length, list: list.slice(0, 200) };
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

// ---------- 💬 bio izohlari
const BIO_MAX = 200, BIO_LEN = 200, BIO_DAY = 20, BIO_WRITE_PREMIUM = true;
function bioShape(owner, oid, e, me) {
  const us = users(), a = us[e.f] || {};
  let r = null;
  if (e.r) { const q = bioArr(owner).find(z => z.id === e.r); if (q) r = { n: nm(us[q.f]), tx: String(q.tx).slice(0, 80) }; }
  return { id: e.id, f: e.f, n: nm(a), vip: store.isPremium(a), tx: e.tx, t: e.t, r, del: me === String(oid) || me === e.f || ADM().includes(me) };
}
// 🩹 eski ma'lumot: u.bio matn bo'lib qolgan bo'lsa — about ga ko'chiramiz, izohlar massivini tiklaymiz
function bioArr(x) {
  if (!Array.isArray(x.bio)) { if (typeof x.bio === 'string' && x.bio) x.about = x.about || x.bio; x.bio = []; }
  return x.bio;
}
function bioList(me, uid, before) {
  const x = users()[String(uid)]; if (!x) return { error: 'O‘yinchi topilmadi' };
  const b = +before || Infinity, pool = bioArr(x).filter(e => e.id < b), page = pool.slice(-30);
  const own = me === String(uid), adm = ADM().includes(me);
  const canWrite = own || adm || (!x.bioOff && (!BIO_WRITE_PREMIUM || store.isPremium(users()[me] || {})));
  return { list: page.map(e => bioShape(x, uid, e, me)), more: pool.length > page.length, n: (x.bio || []).length, canWrite, off: !!x.bioOff, own: own || adm };
}
// 🔒 profil egasi izohlarni yopadi/ochadi
function bioLock(me, uid, off) {
  const id = String(uid || me), x = users()[id];
  if (!x) return { error: 'O‘yinchi topilmadi' };
  if (me !== id && !ADM().includes(me)) return { error: 'Ruxsat yo‘q' };
  x.bioOff = !!off; store.save();
  return { ok: true, off: !!x.bioOff };
}
// 🧹 profil egasi hamma izohni o'chiradi
function bioClear(me, uid) {
  const id = String(uid || me), x = users()[id];
  if (!x) return { error: 'O‘yinchi topilmadi' };
  if (me !== id && !ADM().includes(me)) return { error: 'Ruxsat yo‘q' };
  const n = bioArr(x).length; x.bio = []; store.save();
  return { ok: true, n };
}
function bioPost(me, uid, text, reply) {
  const us = users(), a = us[me], x = us[String(uid)];
  if (!a || !x) return { error: 'O‘yinchi topilmadi' };
  if (x.bioOff && me !== String(uid) && !ADM().includes(me)) return { error: 'Bu profilda izohlar yopiq' };
  if (BIO_WRITE_PREMIUM && me !== String(uid) && !store.isPremium(a) && !ADM().includes(me)) return { error: 'Izoh yozish faqat Premium uchun', prem: true };
  try { if (require('./mod.js').isMuted(me)) return { error: 'Yozish vaqtincha yopiq' }; } catch (e) {}
  let tx = String(text || '').replace(/\s+/g, ' ').trim().slice(0, BIO_LEN);
  if (!tx) return { error: 'Izoh bo‘sh' };
  try { const c = require('./mod.js').censor(tx); if (typeof c === 'string' && c) tx = c; } catch (e) {}
  const d = day(); if (!a.bioDay || a.bioDay.d !== d) a.bioDay = { d, n: 0 };
  if (a.bioDay.n >= BIO_DAY) return { error: 'Bugungi izoh limiti tugadi' };
  bioArr(x); x.bioSeq = (x.bioSeq || 0) + 1;
  const e = { id: x.bioSeq, f: me, tx, t: Date.now() };
  const rid = +reply; if (rid && x.bio.some(z => z.id === rid)) e.r = rid;
  x.bio.push(e); if (x.bio.length > BIO_MAX) x.bio.splice(0, x.bio.length - BIO_MAX);
  a.bioDay.n++;
  // ↩️ javob bo'lsa — izoh egasiga xabar (profil egasidan alohida)
  let rTo = '';
  if (e.r) {
    const q = x.bio.find(z => z.id === e.r);
    if (q && String(q.f) !== me && /^\d+$/.test(String(q.f))) {
      rTo = String(q.f);
      tg('sendMessage', { chat_id: Number(rTo), parse_mode: 'HTML',
        text: '↩️ <b>' + esc(nm(a)) + '</b> izohingizga javob yozdi\n\n<i>Siz:</i> ' + esc(String(q.tx).slice(0, 60)) + '\n<b>Javob:</b> ' + esc(tx.slice(0, 120)) + '\n\n👤 ' + esc(nm(x)) + ' profilida' });
    }
  }
  if (String(uid) !== me && String(uid) !== rTo && /^\d+$/.test(String(uid)) && Date.now() - (x.bioNt || 0) > 6 * 3600e3) {
    x.bioNt = Date.now();
    tg('sendMessage', { chat_id: uid, parse_mode: 'HTML', text: '💬 <b>' + esc(nm(a)) + '</b> profilingizga izoh yozdi: ' + esc(tx.slice(0, 80)) });
  }
  store.save();
  return { ok: true, item: bioShape(x, uid, e, me) };
}
function bioDel(me, uid, id) {
  const x = users()[String(uid)]; if (!x || !bioArr(x).length) return { error: 'Topilmadi' };
  const i = x.bio.findIndex(e => e.id === +id); if (i < 0) return { error: 'Topilmadi' };
  if (me !== String(uid) && me !== x.bio[i].f && !ADM().includes(me)) return { error: 'Ruxsat yo‘q' };
  x.bio.splice(i, 1); store.save(); return { ok: true };
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
      return h.send(res, 200, { likes: x.lk || 0, liked: !!(x.lkBy && x.lkBy[me]), rank: rankOf(x).name }), true; }
    if (p === '/api/social/bio') return h.send(res, 200, bioList(me, url.searchParams.get('uid'), url.searchParams.get('before'))), true;
    if (p === '/api/social/likers') return h.send(res, 200, likers(me, url.searchParams.get('uid') || me)), true;
    if (p === '/api/social/igtop') return h.send(res, 200, { list: igTop() }), true;
    h.send(res, 404, { error: 'none' }); return true;
  }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/social/bio') return h.send(res, 200, bioPost(me, j.uid, j.text, j.reply));
    if (p === '/api/social/biodel') return h.send(res, 200, bioDel(me, j.uid, j.id));
    if (p === '/api/social/biolock') return h.send(res, 200, bioLock(me, j.uid, j.off));
    if (p === '/api/social/bioclear') return h.send(res, 200, bioClear(me, j.uid));
    if (p === '/api/social/like') return h.send(res, 200, like(me, j.uid));
    if (p === '/api/social/ig') return h.send(res, 200, igSubmit(me, j.url));
    if (p === '/api/social/setpass') return h.send(res, 200, setPass(me, j.login, j.password));
    h.send(res, 404, { error: 'none' });
  });
  return true;
}
module.exports = { handle, onCallback, passLogin, rankOf, RANKS, _t: { hashPw, checkPw } };
