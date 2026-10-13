const fs = require('fs');
let s = fs.readFileSync('clubs.js', 'utf8');
if (s.includes("'clubs'")) { console.log('Allaqachon bor'); process.exit(0); }

const a = "let timer = null;\nfunction save() {";
const re = /let timer = null;\s*function save\(\) \{/;
if (!re.test(s)) { console.log('XATO: save topilmadi'); process.exit(1); }
s = s.replace(re, () => `const toRow = c => ({ ...c, members: [...c.members], pending: [...c.pending], admins: [...c.admins] });
const fromRow = c => ({ id: c.id, name: c.name, desc: c.desc || '', leaderUid: c.leaderUid, leaderName: c.leaderName, created: c.created,
  open: c.open !== false, img: c.img || '', pts: c.pts || 0, tw: c.tw || 0, members: new Map(c.members), pending: new Map(c.pending || []), admins: new Set(c.admins || [c.leaderUid]) });
let pool = null, ready = false;
async function writeDb() {
  if (!pool || !ready) return;
  try {
    await pool.query("insert into kv(k, v) values('clubs', $1) on conflict (k) do update set v = excluded.v", [JSON.stringify([...clubs.values()].map(toRow))]);
  } catch (e) { console.log('Klub DB yozish xatosi:', e.message); }
}
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const U = process.env.DATABASE_URL;
  pool = new Pool({ connectionString: U, ssl: /@[^/]*\\./.test(U) ? { rejectUnauthorized: false } : false, max: 2 });
  pool.on('error', e => console.log('Klub DB xato:', e.message));
  (async () => {
    try {
      await pool.query('create table if not exists kv (k text primary key, v jsonb not null)');
      const r = await pool.query("select v from kv where k = 'clubs'");
      if (r.rows.length && Array.isArray(r.rows[0].v)) {
        for (const c of r.rows[0].v) clubs.set(c.id, fromRow(c));
        console.log('Klublar DB dan yuklandi:', clubs.size);
      } else console.log('Klublar DB bo‘sh, ko‘chirilmoqda:', clubs.size);
      ready = true;
      await writeDb();
    } catch (e) { console.log('Klub DB ulanish xatosi:', e.message); }
  })();
  const bye = async () => { await writeDb(); };
  process.on('SIGTERM', bye);
}
let timer = null;
function save() {`);

const re2 = /(try \{ fs\.writeFileSync\(FILE, [^\n]*\} catch \(e\) \{\})/;
if (!re2.test(s)) { console.log('XATO: yozish qatori topilmadi'); process.exit(1); }
s = s.replace(re2, (m) => m + '\n    writeDb();');
fs.writeFileSync('clubs.js', s);
console.log('TAYYOR');
