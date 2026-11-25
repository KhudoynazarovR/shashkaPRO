'use strict';
// 🔄 Bazani ko'chirish: eski bazadagi `kv` jadvalining hamma qatorini yangi bazaga nusxalaydi.
// Ishlatish (Render Shell'da, yangi Frankfurt xizmatida):
//   OLD_DB_URL="postgresql://...eski bazaning External URL'i..." node migrate-db.js
// DATABASE_URL — shu xizmatning o'z bazasi (yangi), u avtomatik olinadi.
const ssl = u => (/\.render\.com|sslmode=require/.test(String(u)) ? { rejectUnauthorized: false } : false);

(async () => {
  const src = process.env.OLD_DB_URL, dst = process.env.DATABASE_URL;
  if (!src) { console.log('❌ OLD_DB_URL berilmagan'); process.exit(1); }
  if (!dst) { console.log('❌ DATABASE_URL yo‘q'); process.exit(1); }
  if (src === dst) { console.log('❌ Ikkala manzil bir xil — to‘xtatildi'); process.exit(1); }

  const { Client } = require('pg');

  const a = new Client({ connectionString: src, ssl: ssl(src) });
  const b = new Client({ connectionString: dst, ssl: ssl(dst) });
  await a.connect(); console.log('✅ eski bazaga ulandim');
  await b.connect(); console.log('✅ yangi bazaga ulandim');

  await b.query('create table if not exists kv (k text primary key, v jsonb not null)');
  const was = (await b.query('select count(*)::int n from kv')).rows[0].n;
  const rows = (await a.query('select k, v::text as vt from kv')).rows;   // matn ko'rinishida olamiz
  console.log('eski bazada ' + rows.length + ' qator, yangi bazada ' + was + ' qator');

  if (process.env.WIPE === '1' && was) { await b.query('delete from kv'); console.log('🧹 yangi bazadagi ' + was + ' qator o‘chirildi'); }

  // Postgres json yolg'iz surrogat (yarim emoji) va \u0000 ni qabul qilmaydi — tozalaymiz
  const BAD = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]|\u0000/g;
  let n = 0, fixed = 0, bad = 0, t0 = Date.now();
  for (const r of rows) {
    let v = r.vt;
    if (BAD.test(v)) { BAD.lastIndex = 0; v = v.replace(BAD, ''); fixed++; } else BAD.lastIndex = 0;
    try {
      await b.query('insert into kv(k, v) values($1, $2::jsonb) on conflict (k) do update set v = excluded.v', [r.k, v]);
      n++;
    } catch (e) { bad++; console.log('  ⚠️ ' + r.k + ': ' + e.message.slice(0, 60)); }
    if ((n + bad) % 50 === 0) console.log('  ' + (n + bad) + '/' + rows.length);
  }
  if (fixed) console.log('🧼 tozalangan qatorlar: ' + fixed);
  if (bad) console.log('⚠️ ko‘chmagan qatorlar: ' + bad);
  const now = (await b.query('select count(*)::int n from kv')).rows[0].n;
  console.log('🏁 ko‘chirildi: ' + n + ' qator · yangi bazada jami ' + now + ' qator · ' + Math.round((Date.now() - t0) / 1000) + ' s');

  // tekshiruv: asosiy kalitlar joyidami
  for (const k of ['s:users', 'players', 'u:0']) {
    const q = await b.query('select length(v::text) len from kv where k = $1', [k]);
    if (q.rows[0]) console.log('  ' + k + ': ' + q.rows[0].len + ' belgi');
  }
  await a.end(); await b.end();
  process.exit(0);
})().catch(e => { console.log('❌ xato: ' + e.message); process.exit(1); });
