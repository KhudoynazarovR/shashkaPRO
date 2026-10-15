const fs = require('fs');
if (fs.readFileSync('economy.js', 'utf8').includes('/api/puzzles/day')) { console.log('Allaqachon bor'); process.exit(0); }
function edit(file, reps) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('XATO: ' + file + ' -> ' + a.slice(0, 60) + ' (' + n + ')'); process.exit(1); }
    s = s.replace(a, () => b);
  }
  return s;
}
const out = {
  'store.js': edit('store.js', [
    ['if (r.rows[0].v && Array.isArray(r.rows[0].v.groups)) db.groups = r.rows[0].v.groups;',
     'if (r.rows[0].v && Array.isArray(r.rows[0].v.groups)) db.groups = r.rows[0].v.groups;\n        if (r.rows[0].v && r.rows[0].v.pzDay && typeof r.rows[0].v.pzDay === \'object\') db.pzDay = r.rows[0].v.pzDay;']
  ]),
  'economy.js': edit('economy.js', [
    ["pz.sv = (pz.sv || []).concat([u.name || 'Foydalanuvchi']).slice(-200);",
     "pz.sv = (pz.sv || []).concat([u.name || 'Foydalanuvchi']).slice(-200); try { const _dk = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); if (!store.db.pzDay || store.db.pzDay.d !== _dk) store.db.pzDay = { d: _dk, c: {} }; const _us = store.users(), _uk = Object.keys(_us).find(k => _us[k] === u); if (_uk) store.db.pzDay.c[_uk] = (store.db.pzDay.c[_uk] || 0) + 1; } catch (e) {}"],
    ["if (p === '/api/puzzles/top' && req.method === 'GET') {",
     `if (p === '/api/puzzles/day' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _dk = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10), _pd = store.db.pzDay, _us = store.users();
    const _rows = (_pd && _pd.d === _dk) ? Object.entries(_pd.c || {}).filter(([k, n]) => n > 0 && _us[k]).map(([k, n]) => ({ uid: k, name: _us[k].name || 'Foydalanuvchi', n })).sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name))) : [];
    send(res, 200, { day: _dk, top: _rows.slice(0, 3), me: _pd && _pd.d === _dk ? (_pd.c[String(_tg.id)] || 0) : 0 });
    return true;
  }
  if (p === '/api/puzzles/top' && req.method === 'GET') {`]
  ])
};
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
