'use strict';
const fs = require('fs');
const path = require('path');

const FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'players.json');
let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
if (!db.users) db.users = {};

const URL_ = process.env.DATABASE_URL;
let pool = null, ready = false, timer = null;

async function writeDb() {
  if (!pool || !ready) return;
  try {
    await pool.query(
      "insert into kv(k, v) values('players', $1) on conflict (k) do update set v = excluded.v",
      [JSON.stringify(db)]
    );
  } catch (e) { console.log('DB yozish xatosi:', e.message); }
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
      const r = await pool.query("select v from kv where k = 'players'");
      if (r.rows.length) {
        const remote = (r.rows[0].v && r.rows[0].v.users) || {};
        if (r.rows[0].v && Array.isArray(r.rows[0].v.puzzles)) db.puzzles = r.rows[0].v.puzzles;
        if (r.rows[0].v && Array.isArray(r.rows[0].v.shop)) db.shop = r.rows[0].v.shop;
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
  const bye = async () => { await writeDb(); process.exit(0); };
  process.on('SIGTERM', bye);
  process.on('SIGINT', bye);
}

function save() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    writeFile();
    writeDb();
  }, 200);
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
