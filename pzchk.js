'use strict';
// pzchk.js — 🧩 masalalarni tekshirish va o'yinchilar belgilagan xatolar.
// 1) Qoidalar: yechimdagi har bir yurish rus shashkasi qoidalariga mosmi (pzcheck.js).
// 2) Dvigatel (KestoG + endshpil bazasi): yechim oxiridagi pozitsiya rostdan yutuqmi; boshqa yo'l ham yutadimi.
//    Tekshiruv tunda (02:00–07:00) bo'lib-bo'lib ishlaydi; admin «Hozir» desa kunduzi ham sekin ishlaydi.
// 3) «Xato bor» — o'yinchi belgilaydi, adminga bot xabari keladi (Ochish / O'chirish / Xato emas).
//    Admin o'chirsa — belgilaganlarga 10 tanga.
// Hech narsa avtomatik o'chirilmaydi: hammasi admin ro'yxatiga tushadi.
const crypto = require('crypto');
const store = require('./store.js');
const R = require('./pzcheck.js');

const T = 0.4;                 // dvigatel o'ylash vaqti (s)
const REWARD = 10;             // tasdiqlangan xabar uchun mukofot
const WHY = { sol: 'Yechim noto‘g‘ri', alt: 'Boshqa yo‘l ham yutadi', pos: 'Pozitsiya xato', other: 'Boshqa' };
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const isAdm = id => ADM().includes(String(id));
const SQ = (r, c) => 'abcdefgh'[c] + (8 - r);
function tg(m, p) { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function D() {
  const d = store.db;
  d.pzChk = d.pzChk || {}; const c = d.pzChk;
  c.ok = c.ok || {}; c.bad = c.bad || {}; c.ign = c.ign || {}; c.run = c.run || { on: false };
  d.pzRep = d.pzRep || {};
  return c;
}
const list = () => store.db.puzzles || [];
function hash(p) { return crypto.createHash('md5').update(JSON.stringify([p.board, p.side, p.goal || '', p.sols && p.sols.length ? p.sols : [p.sol]])).digest('hex').slice(0, 10); }
function to64(b) { const a = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const v = b[r][c]; a.push(v === 1 ? 1 : v === 3 ? 2 : v === 2 ? -1 : v === 4 ? -2 : 0); } return a; }
function ask(b, s) {
  return new Promise(res => {
    let done = false; const tm = setTimeout(() => { if (!done) { done = true; res(null); } }, (T + 8) * 1000);
    try { require('./kestoai.js').move({ board: to64(b), side: s === 'w' ? 1 : -1, time: T, book: false, arena: true, tbAlways: true }, r => { if (done) return; done = true; clearTimeout(tm); res(r && !r.error ? r : null); }); }
    catch (e) { done = true; clearTimeout(tm); res(null); }
  });
}
const fmt = ev => (ev > 0 ? '+' : '') + (Math.abs(ev) >= 2500 ? (ev > 0 ? 'yutuq' : 'yutqazish') : (ev / 100).toFixed(1));

// bitta masalani tekshirish → {st:'ok'|'err'|'warn', why} yoki null (dvigatel band — keyinroq)
async function checkOne(p) {
  const L = R.legal(p);
  if (!L.ok) return { st: 'err', why: (/^doska/.test(L.err) ? 'Pozitsiya xato: ' : 'Qoidaga zid: ') + L.err + (L.at ? ' (' + L.at + '-qadam)' : '') };
  try { if (require('./pzbooks.js').odd(p.board)) return { st: 'err', why: 'Pozitsiya xato: donalar soni keskin farq qiladi (chala ko‘chirilgan bo‘lishi mumkin)' }; } catch (e) {}
  const me = p.side === 'b' ? 'b' : 'w', end = R.play(p.board, me, L.sol);
  const e = await ask(end.b, end.turn); if (!e) return null;
  let ev = e.ev == null ? 0 : e.ev; if (end.turn !== me) ev = -ev;
  // endshpil bazasi (≤5 dona) — aniq natija; aks holda dvigatel bahosi
  const tb = e.tb ? ((e.tb === 'win') === (end.turn === me) ? (e.tb === 'draw' ? 'draw' : 'win') : (e.tb === 'draw' ? 'draw' : 'loss')) : null;
  if ((p.goal || 'win') === 'draw') {
    if (tb ? tb === 'loss' : ev < -800) return { st: 'err', why: 'Durang masalasi, lekin yechim oxirida yutqazish (' + (tb ? 'endshpil bazasi' : 'baho ' + fmt(ev)) + ')' };
  } else if (tb ? tb !== 'win' : ev < 250) return { st: 'err', why: 'Yechim oxirida yutuq yo‘q (' + (tb ? 'endshpil bazasi: ' + (tb === 'draw' ? 'durang' : 'yutqazish') : 'baho ' + fmt(ev)) + ')' };
  const s = await ask(p.board, me); if (!s) return null;
  const fm = R.firstMove(p, L.sol), f = fm.from[0] * 8 + fm.from[1], t = fm.to[0] * 8 + fm.to[1];
  if ((s.from !== f || s.to !== t) && s.ev != null && s.ev >= 600 && (p.goal || 'win') !== 'draw')
    return { st: 'warn', why: 'Boshqa yo‘l ham yutishi mumkin: ' + SQ(s.from >> 3, s.from & 7) + '-' + SQ(s.to >> 3, s.to & 7) + ' (yechimda ' + SQ(fm.from[0], fm.from[1]) + '-' + SQ(fm.to[0], fm.to[1]) + ')' };
  return { st: 'ok' };
}

// ---- fon tekshiruvi
let busy = false;
function night() { const h = new Date(Date.now() + 5 * 3600e3).getUTCHours(); return h >= 2 && h < 7; }
function nextTodo() {
  const c = D();
  for (const p of list()) { const h = hash(p); if (c.ok[p.id] !== h && !(c.bad[p.id] && c.bad[p.id].h === h) && c.ign[p.id] !== h) return [p, h]; }
  return null;
}
async function tick() {
  const c = D(); if (busy || !c.run.on) return;
  if (!night() && !c.run.now) return;
  busy = true;
  try {
    const t0 = Date.now(), lim = night() ? 15000 : 2500;   // kunduzi sekin: o'yinlarga xalaqit bermasin
    while (Date.now() - t0 < lim) {
      const nx = nextTodo();
      if (!nx) { c.run.on = false; c.run.now = false; c.run.end = Date.now(); store.save(); report(); break; }
      const [p, h] = nx, r = await checkOne(p);
      if (!r) break;
      if (r.st === 'ok') { c.ok[p.id] = h; delete c.bad[p.id]; }
      else { c.bad[p.id] = { st: r.st, why: r.why, h, at: Date.now() }; delete c.ok[p.id]; }
      c.run.n = (c.run.n || 0) + 1;
    }
    store.save();
  } catch (e) { console.log('[pzchk]', e.message); }
  busy = false;
}
setInterval(tick, 20000).unref();
function report() {
  const c = D(), b = Object.values(c.bad);
  const t = '🧩 Masalalar tekshiruvi tugadi\nTekshirildi: ' + list().length + '\nXato: ' + b.filter(x => x.st === 'err').length + '\nShubhali: ' + b.filter(x => x.st === 'warn').length + '\n\nMasalalar → + Yangi → Tekshiruv va xatolar';
  ADM().forEach(a => tg('sendMessage', { chat_id: a, text: t }));
}
function status() {
  const c = D(), all = list(); let done = 0;
  all.forEach(p => { const h = hash(p); if (c.ok[p.id] === h || (c.bad[p.id] && c.bad[p.id].h === h) || c.ign[p.id] === h) done++; });
  return { total: all.length, done, on: !!c.run.on, now: !!c.run.now, night: night() };
}

// ---- o'yinchi xabarlari
function pzOf(id) {
  let p = list().find(x => x.id === id);
  if (!p) { try { p = require('./etudes.js').asPuzzle(id); } catch (e) {} }
  return p || null;
}
function repText(id) {
  const r = store.db.pzRep[id], p = pzOf(id), by = Object.entries(r.by || {});
  const last = by.sort((a, b) => b[1].at - a[1].at)[0];
  const nm = uid => { const u = store.users()[uid]; return (u && u.name) || uid; };
  let t = '⚠️ <b>Masalada xato belgilandi</b>\n«' + esc(p ? p.title : id) + '»' + (p && p.folder ? ' · ' + esc(p.folder) : '') + '\n\n';
  t += by.slice(0, 6).map(([uid, x]) => '• ' + esc(nm(uid)) + ': ' + esc(WHY[x.w] || x.w) + (x.t ? ' — «' + esc(x.t) + '»' : '')).join('\n');
  t += '\n\nBelgilaganlar: ' + by.length + ' kishi' + (last ? ' (oxirgisi: ' + esc(nm(last[0])) + ')' : '');
  if (r.st) t += '\n\n' + (r.st === 'del' ? '🗑 O‘chirildi, belgilaganlarga +' + REWARD + ' tanga' : '✅ Xato emas deb belgilandi');
  return t;
}
function repKb(id) {
  const r = store.db.pzRep[id], link = process.env.TG_APP_LINK || '', row = [];
  if (link) row.push({ text: 'Ochish', url: link + '?startapp=pz_' + id });
  if (r.st) return { inline_keyboard: row.length ? [row] : [] };
  const etud = /^et/.test(id);
  return { inline_keyboard: [row, (etud ? [] : [{ text: '🗑 O‘chirish', callback_data: 'pzr:d:' + id }]).concat([{ text: 'Xato emas', callback_data: 'pzr:o:' + id }])].filter(x => x.length) };
}
function repSend(id) {
  const r = store.db.pzRep[id]; r.msg = r.msg || {};
  ADM().forEach(a => {
    const mid = r.msg[a], text = repText(id), reply_markup = repKb(id);
    if (mid) tg('editMessageText', { chat_id: a, message_id: mid, text, parse_mode: 'HTML', reply_markup });
    else tg('sendMessage', { chat_id: a, text, parse_mode: 'HTML', reply_markup }).then(x => { if (x && x.ok && x.result) { r.msg[a] = x.result.message_id; store.save(); } });
  });
}
// admin qarori: 'del' — o'chirish (+mukofot), 'ok' — xato emas
function decide(id, act) {
  const c = D(), r = store.db.pzRep[id], p = list().find(x => x.id === id);
  if (act === 'del') {
    if (p) {
      const arr = list(), i = arr.indexOf(p); arr.splice(i, 1);
      try { require('./economy.js').pzRenum(arr, p.folder, p.level); } catch (e) {}
      store.db.pzVer = (store.db.pzVer || 0) + 1;
    }
    delete c.bad[id]; delete c.ok[id];
    if (r && !r.st) Object.keys(r.by || {}).forEach(uid => { try { require('./economy.js').add(uid, REWARD, 'masala xatosi topildi'); } catch (e) {} tg('sendMessage', { chat_id: uid, text: '🧩 Rahmat! Siz belgilagan masala xatosi tasdiqlandi va masala olib tashlandi. +' + REWARD + ' tanga' }); });
  } else {
    const q = p || pzOf(id); if (q && p) c.ign[id] = hash(q); delete c.bad[id];
  }
  if (r) { r.st = act === 'del' ? 'del' : 'ok'; repSend(id); }
  store.save();
}
async function onCallback(q) {
  const m = /^pzr:([do]):(.+)$/.exec(q.data || ''); if (!m) return false;
  if (!isAdm(q.from && q.from.id)) { tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Faqat admin' }); return true; }
  const r = store.db.pzRep && store.db.pzRep[m[2]];
  if (r && r.st) { tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Allaqachon hal qilingan' }); return true; }
  decide(m[2], m[1] === 'd' ? 'del' : 'ok');
  tg('answerCallbackQuery', { callback_query_id: q.id, text: m[1] === 'd' ? '🗑 O‘chirildi' : '✅ Belgilandi' });
  return true;
}

// ---- API
function handle(req, res, p, h) {
  if (!p.startsWith('/api/pzchk')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(t.id), adm = isAdm(uid);
  if (p === '/api/pzchk' && req.method === 'GET') {
    if (!adm) { h.send(res, 403, { error: 'Faqat admin' }); return true; }
    const c = D(), items = {};
    Object.entries(c.bad).forEach(([id, x]) => { items[id] = { id, st: x.st, why: [x.why], n: 0 }; });
    Object.entries(store.db.pzRep).forEach(([id, r]) => {
      if (r.st) return; const by = Object.values(r.by || {});
      const it = items[id] || (items[id] = { id, st: 'user', why: [], n: 0 });
      it.n = by.length; by.forEach(x => it.why.push('O‘yinchi: ' + (WHY[x.w] || x.w) + (x.t ? ' — «' + x.t + '»' : '')));
    });
    const out = Object.values(items).map(x => { const q = pzOf(x.id); return Object.assign(x, { title: q ? q.title : x.id, folder: q ? q.folder || '' : '', etud: /^et/.test(x.id) }); })
      .sort((a, b) => (b.n - a.n) || ((a.st === 'err' ? 0 : a.st === 'user' ? 1 : 2) - (b.st === 'err' ? 0 : b.st === 'user' ? 1 : 2)));
    h.send(res, 200, { status: status(), list: out.slice(0, 500), total: out.length });
    return true;
  }
  h.readBody(req, 4000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const c = D();
    if (p === '/api/pzchk/report') {
      const id = String(j.id || ''), w = WHY[j.why] ? j.why : 'other', note = String(j.note || '').replace(/\s+/g, ' ').trim().slice(0, 200);
      if (!pzOf(id)) return h.send(res, 404, { error: 'Masala topilmadi' });
      const day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10), u = store.users()[uid] || {};
      u.pzRepDay = u.pzRepDay && u.pzRepDay.d === day ? u.pzRepDay : { d: day, n: 0 };
      const r = store.db.pzRep[id] || (store.db.pzRep[id] = { by: {}, at: Date.now() });
      if (r.by[uid]) return h.send(res, 200, { ok: true, again: true });
      if (u.pzRepDay.n >= 20) return h.send(res, 429, { error: 'Bugun ko‘p xabar yubordingiz' });
      u.pzRepDay.n++; r.by[uid] = { w, t: note, at: Date.now() }; if (r.st) { r.st = ''; r.msg = {}; }
      store.save(); repSend(id);
      return h.send(res, 200, { ok: true });
    }
    if (!adm) return h.send(res, 403, { error: 'Faqat admin' });
    if (p === '/api/pzchk/start') { c.run.on = true; c.run.now = !!j.now; c.run.n = 0; c.run.at = Date.now(); store.save(); setTimeout(tick, 500); return h.send(res, 200, { status: status() }); }
    if (p === '/api/pzchk/stop') { c.run.on = false; c.run.now = false; store.save(); return h.send(res, 200, { status: status() }); }
    if (p === '/api/pzchk/act') {
      const id = String(j.id || ''); if (!id) return h.send(res, 400, { error: 'id' });
      decide(id, j.act === 'del' ? 'del' : 'ok');
      return h.send(res, 200, { ok: true });
    }
    h.send(res, 404, { error: 'topilmadi' });
  });
  return true;
}
module.exports = { handle, onCallback, checkOne, status };
