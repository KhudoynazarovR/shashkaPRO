'use strict';
const fs = require('fs');
const path = require('path');

const FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'players.json');
let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
if (!db.users) db.users = {};
if (!Array.isArray(db.groups)) db.groups = [];

const URL_ = process.env.DATABASE_URL;
let pool = null, ready = false, timer = null;

// Rasmlar (data:image...) alohida "blob:<hash>" qatorlarida bir marta saqlanadi,
// asosiy "players" qatori kichik bo'ladi. Bazaga ko'pi bilan har 10 soniyada yoziladi.
const crypto = require('crypto');
const BLOB = '@@blob:';
const hashOf = new Map(); // string -> hash
let lastMain = '', writing = false, lastVac = 0, writes = 0;
// Postgres json turi yolg'iz surrogat (yarim emoji — masalan ism .slice() bilan kesilganda) va \u0000 ni qabul qilmaydi:
// bitta shunday belgi butun yozuvni to'xtatardi ("invalid input syntax for type json"). Yozishdan oldin tozalaymiz.
const BAD = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]|\u0000/g;
function clean(s) { return BAD.test(s) ? (BAD.lastIndex = 0, s.replace(BAD, '')) : (BAD.lastIndex = 0, s); }
function rep(k, v) { return typeof v === 'string' ? clean(v) : v; }
function packJson(blobs) {
  return JSON.stringify(db, (k, v) => {
    if (typeof v === 'string') v = clean(v);
    if (typeof v === 'string' && v.length > 1500 && v.startsWith('data:')) {
      let h = hashOf.get(v);
      if (!h) { h = crypto.createHash('sha1').update(v).digest('hex'); hashOf.set(v, h); }
      blobs.set(h, v);
      return BLOB + h;
    }
    return v;
  });
}
function unpack(v, blobs) {
  if (typeof v === 'string') return v.startsWith(BLOB) ? (blobs.get(v.slice(BLOB.length)) || '') : v;
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = unpack(v[i], blobs); return v; }
  if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = unpack(v[k], blobs); return v; }
  return v;
}
const savedBlobs = new Set();
// ---- admin ogohlantirish (Telegram), soatiga ko'pi bilan bir marta har turi uchun
const ADMINS = (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
const alertAt = {};
function tg(method, body, isForm) {
  if (!process.env.BOT_TOKEN) return Promise.resolve(null);
  return fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/' + method, isForm ? { method: 'POST', body } :
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()).catch(e => ({ ok: false, description: e.message }));
}
function alertAdmin(kind, text) {
  if (Date.now() - (alertAt[kind] || 0) < 3600e3) return;
  alertAt[kind] = Date.now();
  for (const id of ADMINS) tg('sendMessage', { chat_id: id, text: '⚠️ ShashkaPRO baza: ' + text });
}

let loadedUsers = 0, lastBk = 0, failN = 0;
// ---- 🧩 bo'lak-bo'lak saqlash (v2): butun baza bitta katta qator emas —
// har bir bo'lim "s:<kalit>" qatorida, o'yinchilar UB ta "u:<n>" qatorida; faqat o'zgargan qator yoziladi (sha1 bilan solishtiriladi).
// "meta" qatori: qaysi bo'limlar bor va nechta o'yinchi/masala. Eski "players" qatori tegilmaydi (7 kun zaxira, keyin o'chiriladi).
const UB = 16;
const bucketOf = id => { let h = 0; const s = String(id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % UB; };
const lastHash = new Map();   // qator -> oxirgi yozilgan sha1
let v2 = false, v2Since = 0;
function packVal(val, blobs) {
  return JSON.stringify(val, (k, v) => {
    if (typeof v === 'string') v = clean(v);
    if (typeof v === 'string' && v.length > 1500 && v.startsWith('data:')) {
      let h = hashOf.get(v);
      if (!h) { h = crypto.createHash('sha1').update(v).digest('hex'); hashOf.set(v, h); }
      blobs.set(h, v);
      return BLOB + h;
    }
    return v;
  });
}
async function putRow(k, str) {
  const h = crypto.createHash('sha1').update(str).digest('hex');
  if (lastHash.get(k) === h) return false;
  await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do update set v = excluded.v", [k, str]);
  lastHash.set(k, h); return true;
}
async function writeDb(force) {
  if (!pool || !ready) return;
  if (writing) { setTimeout(writeDb, 3000); return; }
  const nUsers = Object.keys(db.users).length;
  if (!force && loadedUsers > 20 && nUsers < loadedUsers * 0.8) {
    console.log('DB: yozish to‘xtatildi — foydalanuvchilar keskin kamaydi', nUsers, '/', loadedUsers);
    alertAdmin('guard', 'foydalanuvchilar soni ' + loadedUsers + ' dan ' + nUsers + ' ga tushib ketdi — bazaga yozish to‘xtatildi (eski ma’lumot himoyalandi).');
    return;
  }
  writing = true;
  try {
    if (force) lastHash.clear();
    const blobs = new Map(), rows = [];
    const keys = Object.keys(db).filter(k => k !== 'users' && db[k] !== undefined);
    for (const k of keys) rows.push(['s:' + k, packVal(db[k], blobs)]);
    const ub = Array.from({ length: UB }, () => ({}));
    for (const id of Object.keys(db.users)) ub[bucketOf(id)][id] = db.users[id];
    for (let i = 0; i < UB; i++) rows.push(['u:' + i, packVal(ub[i], blobs)]);
    for (const [h, v] of blobs) {   // rasmlar — bir marta
      if (savedBlobs.has(h)) continue;
      await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do nothing", ['blob:' + h, JSON.stringify(v, rep)]);
      savedBlobs.add(h);
    }
    let n = 0;
    for (const [k, str] of rows) if (await putRow(k, str)) n++;
    if (n || !v2) {
      if (!v2Since) v2Since = Date.now();
      await putRow('meta', JSON.stringify({ v: 2, since: v2Since, keys, ub: UB, users: nUsers, puzzles: (db.puzzles || []).length }));
      v2 = true; writes++;
      if (nUsers > loadedUsers) loadedUsers = nUsers;
    }
    // kunlik zaxira nusxa bazaning o'zida (oxirgi 7 kun, to'liq)
    if (Date.now() - lastBk > 24 * 3600e3) {
      lastBk = Date.now();
      const day = new Date().toISOString().slice(0, 10), bl = new Map();
      await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do update set v = excluded.v", ['backup:' + day, packVal(db, bl)]);
      await pool.query("delete from kv where k like 'backup:%' and k not in (select k from kv where k like 'backup:%' order by k desc limit 7)");
      // eski bitta-qator "players" — yangi tuzilish 7 kun ishlagach o'chiriladi
      if (v2Since && Date.now() - v2Since > 7 * 24 * 3600e3) await pool.query("delete from kv where k = 'players'");
      await pool.query('vacuum kv');
    }
    if (failN) { failN = 0; alertAdmin('ok', '✅ bazaga yozish yana ishlayapti.'); }
  } catch (e) {
    console.log('DB yozish xatosi:', e.message);
    failN++;
    alertAdmin('write', 'bazaga yozib bo‘lmadi: ' + e.message + '\nRender → shashkapro_db ni tekshiring! O‘zgarishlar saqlanmayapti.');
  }
  writing = false;
}

// ---- to'liq zaxira Telegramga (rasmlar bilan, .json.gz)
async function tgBackup(chatId) {
  const to = chatId ? [String(chatId)] : ADMINS;
  if (!to.length || !process.env.BOT_TOKEN) return false;
  const zlib = require('zlib');
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(db)));
  const day = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  let ok = false;
  for (const id of to) {
    const fd = new FormData();
    fd.append('chat_id', id);
    fd.append('caption', '💾 ShashkaPRO zaxira · ' + Object.keys(db.users).length + ' foydalanuvchi · ' + (db.puzzles || []).length + ' masala\nTiklash: shu faylni botga «/restore» izohi bilan yuboring.');
    fd.append('document', new Blob([gz]), 'shashkapro_' + day + '.json.gz');
    const r = await tg('sendDocument', fd, true);
    if (r && r.ok) ok = true; else console.log('Zaxira yuborilmadi:', r && r.description);
  }
  if (ok && !chatId) { db.tgBkAt = Date.now(); save(); }
  return ok;
}

// ---- zaxiradan tiklash (bot orqali admin yuboradi). Tiklangach server qayta ishga tushadi.
async function restore(obj) {
  if (!obj || typeof obj !== 'object' || !obj.users || typeof obj.users !== 'object') throw new Error('fayl noto‘g‘ri');
  if (pool && ready) {
    await pool.query("insert into kv(k, v) values('backup:pre-restore', $1) on conflict (k) do update set v = excluded.v", [packVal(db, new Map())]);
  }
  for (const k of Object.keys(db)) if (k !== 'users') delete db[k];
  for (const id of Object.keys(db.users)) delete db.users[id];
  for (const k of Object.keys(obj)) if (k !== 'users') db[k] = obj[k];
  Object.assign(db.users, obj.users);
  loadedUsers = 0; lastMain = ''; lastHash.clear();
  writeFile();
  await writeDb(true);
  setTimeout(() => process.exit(0), 1500);
  return { users: Object.keys(db.users).length, puzzles: (db.puzzles || []).length };
}

function writeFile() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(db));
    fs.renameSync(FILE + '.tmp', FILE);
  } catch (e) { console.log('Fayl yozish xatosi:', e.message); }
}

if (URL_) {
  const { Pool } = require('pg');
  const external = /@[^/]*\./.test(URL_);
  pool = new Pool({ connectionString: URL_, ssl: external ? { rejectUnauthorized: false } : false, max: 3, keepAlive: true, idleTimeoutMillis: 20000, connectionTimeoutMillis: 10000 });
  pool.on('error', e => console.log('DB xato:', e.message));
  let tries = 0;
  const init = async () => {
    try {
      await pool.query('create table if not exists kv (k text primary key, v jsonb not null)');
      const bl = new Map();
      const br = await pool.query("select k, v from kv where k like 'blob:%'");
      for (const row of br.rows) { const h = row.k.slice(5); bl.set(h, row.v); savedBlobs.add(h); }
      // 1) yangi tuzilish (meta + bo'limlar), 2) bo'lmasa yoki shubhali bo'lsa — eski "players" qatori
      let src = null, how = '';
      const mr = await pool.query("select v from kv where k = 'meta'");
      const oldR = await pool.query("select v from kv where k = 'players'");
      const old = oldR.rows.length ? oldR.rows[0].v : null;
      if (mr.rows.length && mr.rows[0].v && mr.rows[0].v.v === 2) {
        const meta = mr.rows[0].v, o = { users: {} };
        const sr = await pool.query("select k, v from kv where k like 's:%' or k like 'u:%'");
        const got = new Map(sr.rows.map(r => [r.k, r.v]));
        for (const k of meta.keys || []) if (got.has('s:' + k)) o[k] = got.get('s:' + k);
        for (let i = 0; i < (meta.ub || UB); i++) Object.assign(o.users, got.get('u:' + i) || {});
        const nu = Object.keys(o.users).length, nOld = old && old.users ? Object.keys(old.users).length : 0;
        const okU = nu >= (meta.users || 0) * 0.98 && nu >= nOld * 0.95, okP = !meta.puzzles || (Array.isArray(o.puzzles) && o.puzzles.length >= meta.puzzles * 0.98);
        if (okU && okP) { src = o; how = 'v2'; v2 = true; v2Since = meta.since || Date.now(); }
        else if (old) {   // bo'limlardan biri yo'qolgan: eski qator ustiga yangi bo'limlar qo'yiladi (bori — yangiroq)
          console.log('DB: yangi tuzilish to‘liq emas', nu, '/', meta.users, nOld, '— eski qator bilan birlashtirildi');
          alertAdmin('v2bad', 'yangi tuzilishdagi baza to‘liq emas (' + nu + ' o‘yinchi, kutilgan ' + (meta.users || nOld) + ') — eski «players» qatori bilan birlashtirib yuklandi.');
          src = Object.assign({}, old, o, { users: Object.assign({}, old.users || {}, o.users) });
          if (!okP && Array.isArray(old.puzzles)) src.puzzles = old.puzzles;
          how = 'v2+players'; v2Since = meta.since || Date.now();
        } else { src = o; how = 'v2 (to‘liq emas)'; v2 = true; v2Since = meta.since || Date.now(); alertAdmin('v2bad', 'bazada ' + nu + ' o‘yinchi topildi, kutilgan ' + meta.users + '. Admin tekshirsin.'); }
      }
      if (!src && old) { src = old; how = 'players'; }
      const wasV2 = v2 || how === 'v2+players';
      if (src) {
        unpack(src, bl);
        const remote = src.users || {};
        Object.keys(src).forEach(k => { if (k !== 'users') db[k] = src[k]; });
        { const _fs = new Set(Array.isArray(db.pzFolders) ? db.pzFolders : []); (db.puzzles || []).forEach(x => { if (x.folder) _fs.add(x.folder); }); if (_fs.size) db.pzFolders = [..._fs]; }
        for (const id of Object.keys(db.users)) if (!remote[id]) remote[id] = db.users[id];
        for (const id of Object.keys(db.users)) delete db.users[id];
        Object.assign(db.users, remote);
        console.log('DB dan yuklandi (' + how + '), foydalanuvchilar:', Object.keys(db.users).length, 'masalalar:', (db.puzzles || []).length);
      } else {
        console.log('DB bo‘sh, mavjud ma‘lumot ko‘chirilmoqda:', Object.keys(db.users).length);
      }
      if (!wasV2 && src) {   // birinchi marta yangi tuzilishga o'tish: avval Telegramga to'liq zaxira
        try { const ok = await tgBackup(); console.log('DB: o‘tishdan oldin Telegram zaxira:', ok ? 'yuborildi' : 'yuborilmadi'); } catch (e) { console.log('zaxira xato:', e.message); }
      }
      loadedUsers = Object.keys(db.users).length;
      try { const bk = await pool.query("select k from kv where k like 'backup:2%' order by k desc limit 1"); if (bk.rows.length && bk.rows[0].k.slice(7) === new Date().toISOString().slice(0, 10)) lastBk = Date.now(); } catch (e) {}
      ready = true;
      if (tries) alertAdmin('ok2', '✅ baza qayta ulandi (' + loadedUsers + ' foydalanuvchi).');
      await writeDb();
      // Telegramga kunlik to'liq zaxira
      const tick = () => { if (Date.now() - (db.tgBkAt || 0) > 20 * 3600e3) tgBackup().catch(e => console.log('zaxira xato:', e.message)); };
      setTimeout(tick, 90e3); setInterval(tick, 3600e3);
    } catch (e) {
      tries++;
      console.log('DB ulanish xatosi:', e.message, '— 30 s dan keyin qayta urinish');
      alertAdmin('conn', 'bazaga ulanib bo‘lmadi: ' + e.message + '\nRender → shashkapro_db holatini tekshiring (Suspended bo‘lsa Resume bosing). Ulanmaguncha o‘zgarishlar saqlanmaydi.');
      setTimeout(init, 30000);
    }
  };
  init();
  const bye = async () => { writing = false; await writeDb(); process.exit(0); };
  process.on('SIGTERM', bye);
  process.on('SIGINT', bye);
}

let dbTimer = null;
function save() {
  if (!timer) timer = setTimeout(() => { timer = null; writeFile(); }, URL_ ? 60000 : 5000);   // Postgres bor bo'lsa disk nusxasi — zaxira, har daqiqada
  if (!dbTimer) dbTimer = setTimeout(() => { dbTimer = null; writeDb(); }, 10000);
}

function getOrCreate(tg) {
  const id = String(tg.id);
  const name = String(tg.first_name || tg.username || 'Player').slice(0, 20);
  let u = db.users[id];
  if (!u) {
    u = db.users[id] = {
      id, name, elo: 1000, diamonds: 500, premiumUntil: 0,
      wins: 0, losses: 0, games: 0, lastDaily: '', created: Date.now()
    };
    try { require('./premium.js').giveTrial(u); } catch (e) {}   // 🎁 yangi o'yinchiga 7 kunlik Premium
  } else {
    u.name = name;
  }
  save();
  return u;
}

function isPremium(u) { return u.premiumUntil > Date.now(); }
// 🖼 profil rasmi faqat Premium faol bo'lsa ko'rinadi (rasm o'chirilmaydi — Premium yangilansa qaytadi)
function avOf(u) { return u && u.avatar && isPremium(u) ? u.avatar : ''; }

async function backups() {
  if (!pool || !ready) return [];
  return (await pool.query("select k from kv where k like 'backup:%' order by k desc")).rows.map(r => r.k.slice(7));
}
async function restoreDay(day) {
  if (!pool || !ready) throw new Error('baza ulanmagan');
  const r = await pool.query('select v from kv where k = $1', ['backup:' + day]);
  if (!r.rows.length) throw new Error('bunday zaxira yo‘q');
  const bl = new Map();
  for (const row of (await pool.query("select k, v from kv where k like 'blob:%'")).rows) bl.set(row.k.slice(5), row.v);
  return restore(unpack(r.rows[0].v, bl));
}

// alohida qatorlar (masalan dvigatel xotirasi) — asosiy "players" qatoriga tegmaydi
function kvGet(k) {
  return new Promise(res => {
    if (!pool) return res(null);
    const t0 = Date.now();
    (function w() {
      if (!ready) return Date.now() - t0 < 120e3 ? setTimeout(w, 1000) : res(null);
      pool.query('select v from kv where k = $1', ['x:' + k]).then(r => res(r.rows.length ? r.rows[0].v : null)).catch(() => res(null));
    })();
  });
}
async function kvSet(k, v) {
  if (!pool || !ready) return false;
  try { await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do update set v = excluded.v", ['x:' + k, JSON.stringify(v, rep)]); return true; }
  catch (e) { console.log('kv yozish xatosi:', e.message); return false; }
}

module.exports = { kvGet, kvSet, backups, restoreDay, tgBackup, restore, db, getOrCreate, save, isPremium, avOf, users: () => db.users };
