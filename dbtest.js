const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
c.connect().then(() => c.query('select now()')).then(r => { console.log('ULANDI', r.rows[0]); c.end(); }).catch(e => { console.log('XATO', e.message); process.exit(1); });
