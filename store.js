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
async function writeDb() {
  if (!pool || !ready) return;
  if (writing) { setTimeout(writeDb, 3000); return; }
  writing = true;
  try {
    const blobs = new Map();
    const main = packJson(blobs);
    for (const [h, v] of blobs) {
      if (savedBlobs.has(h)) continue;
      await pool.query("insert into kv(k, v) values($1, $2) on conflict (k) do nothing", ['blob:' + h, JSON.stringify(v)]);
      savedBlobs.add(h);
    }
    if (main !== lastMain) {
      await pool.query(
        "insert into kv(k, v) values('players', $1) on conflict (k) do update set v = excluded.v",
        [main]
      );
      lastMain = main; writes++;
    }
    // soatiga bir marta: ishlatilmayotgan rasmlarni o'chirish va VACUUM
    if (Date.now() - lastVac > 3600e3) {
      lastVac = Date.now();
      const keep = [...blobs.keys()].map(h => 'blob:' + h);
      await pool.query("delete from kv where k like 'blob:%' and not (k = any($1))", [keep]);
      for (const h of [...savedBlobs]) if (!blobs.has(h)) savedBlobs.delete(h);
      if (hashOf.size > 5000) hashOf.clear();
      await pool.query('vacuum kv');
    }
  } catch (e) { console.log('DB yozish xatosi:', e.message); }
  writing = false;
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
  (async () => {
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
      ready = true;
      await writeDb();
    } catch (e) { console.log('DB ulanish xatosi:', e.message); }
  })();
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

module.exports = { db, getOrCreate, save, isPremium, users: () => db.users };
