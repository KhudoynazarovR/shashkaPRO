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
function packJson(blobs) {
  return JSON.stringify(db, (k, v) => {
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
    const blobs = new Map();
    const main = packJson(blobs);
    for (const [h, v] of blobs) {
      if (savedBlobs.has(h)) continue;
      await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do nothing", ['blob:' + h, JSON.stringify(v)]);
      savedBlobs.add(h);
    }
    if (main !== lastMain || force) {
      await pool.query(
        "insert into kv(k, v) values('players', $1) on conflict (k) do update set v = excluded.v",
        [main]
      );
      lastMain = main; writes++;
      if (nUsers > loadedUsers) loadedUsers = nUsers;
    }
    // kunlik zaxira nusxa bazaning o'zida (oxirgi 7 kun)
    if (Date.now() - lastBk > 24 * 3600e3) {
      lastBk = Date.now();
      const day = new Date().toISOString().slice(0, 10);
      await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do update set v = excluded.v", ['backup:' + day, main]);
      await pool.query("delete from kv where k like 'backup:%' and k not in (select k from kv where k like 'backup:%' order by k desc limit 7)");
    }
    if (Date.now() - lastVac > 3600e3) { lastVac = Date.now(); await pool.query('vacuum kv'); }
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
    await pool.query("insert into kv(k, v) select 'backup:pre-restore', v from kv where k = 'players' on conflict (k) do update set v = excluded.v");
  }
  for (const k of Object.keys(db)) if (k !== 'users') delete db[k];
  for (const id of Object.keys(db.users)) delete db.users[id];
  for (const k of Object.keys(obj)) if (k !== 'users') db[k] = obj[k];
  Object.assign(db.users, obj.users);
  loadedUsers = 0; lastMain = '';
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
  pool = new Pool({ connectionString: URL_, ssl: external ? { rejectUnauthorized: false } : false, max: 3 });
  pool.on('error', e => console.log('DB xato:', e.message));
  let tries = 0;
  const init = async () => {
    try {
      await pool.query('create table if not exists kv (k text primary key, v jsonb not null)');
      // eski shishgan jadvalni siqish (joyni diskka qaytaradi)
      try { await pool.query('vacuum full kv'); console.log('DB: vacuum full bajarildi'); } catch (e) { console.log('DB vacuum xato:', e.message); }
      const r = await pool.query("select v from kv where k = 'players'");
      if (r.rows.length) {
        const bl = new Map();
        const br = await pool.query("select k, v from kv where k like 'blob:%'");
        for (const row of br.rows) { const h = row.k.slice(5); bl.set(h, row.v); savedBlobs.add(h); }
        unpack(r.rows[0].v, bl);
        const remote = (r.rows[0].v && r.rows[0].v.users) || {};
        if (r.rows[0].v && Array.isArray(r.rows[0].v.puzzles)) db.puzzles = r.rows[0].v.puzzles;
        if (r.rows[0].v && Array.isArray(r.rows[0].v.shop)) db.shop = r.rows[0].v.shop;
        if (r.rows[0].v && Array.isArray(r.rows[0].v.groups)) db.groups = r.rows[0].v.groups;
        if (r.rows[0].v && r.rows[0].v.pzDay && typeof r.rows[0].v.pzDay === 'object') db.pzDay = r.rows[0].v.pzDay;
        Object.keys(r.rows[0].v || {}).forEach(k => { if (k !== 'users') db[k] = r.rows[0].v[k]; });
        { const _fs = new Set(Array.isArray(db.pzFolders) ? db.pzFolders : []); (db.puzzles || []).forEach(x => { if (x.folder) _fs.add(x.folder); }); if (_fs.size) db.pzFolders = [..._fs]; }
        for (const id of Object.keys(db.users)) if (!remote[id]) remote[id] = db.users[id];
        for (const id of Object.keys(db.users)) delete db.users[id];
        Object.assign(db.users, remote);
        console.log('DB dan yuklandi, foydalanuvchilar:', Object.keys(db.users).length);
      } else {
        console.log('DB bo‘sh, mavjud ma‘lumot ko‘chirilmoqda:', Object.keys(db.users).length);
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
  if (!timer) timer = setTimeout(() => { timer = null; writeFile(); }, 5000);
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
  } else {
    u.name = name;
  }
  save();
  return u;
}

function isPremium(u) { return u.premiumUntil > Date.now(); }

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

module.exports = { backups, restoreDay, tgBackup, restore, db, getOrCreate, save, isPremium, users: () => db.users };
