const fs = require('fs');
if (fs.readFileSync('economy.js', 'utf8').includes('/api/puzzles/top')) { console.log('Allaqachon bor'); process.exit(0); }
function edit(file, reps) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('XATO: ' + file + ' -> ' + a.slice(0, 50) + ' (' + n + ')'); process.exit(1); }
    s = s.replace(a, () => b);
  }
  return s;
}
const srv = [
  ["if (p === '/api/puzzles' && req.method === 'GET') {",
`if (p === '/api/puzzles/top' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _ids = new Set((store.db.puzzles || []).map(x => x.id));
    const _rows = Object.entries(store.users()).map(([k, v]) => ({ k, name: v.name || 'Foydalanuvchi', n: (v.solved || []).filter(i => _ids.has(i)).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name)));
    const _i = _rows.findIndex(x => x.k === String(_tg.id));
    send(res, 200, { top: _rows.slice(0, 20).map(x => ({ name: x.name, n: x.n, me: x.k === String(_tg.id) })), rank: _i < 0 ? 0 : _i + 1, n: _i < 0 ? 0 : _rows[_i].n });
    return true;
  }
  if (p === '/api/puzzles' && req.method === 'GET') {`],
  ["list: store.db.puzzles });",
   "list: (() => { const _c = {}; Object.values(store.users()).forEach(v => (v.solved || []).forEach(i => { _c[i] = (_c[i] || 0) + 1; })); return store.db.puzzles.map(x => Object.assign({}, x, { cnt: _c[x.id] || 0 })); })() });"],
  ["u.solved.push(pz.id); gain = 5; u.diamonds = (u.diamonds || 0) + gain; store.save(); }",
   "if (Date.now() - (u.lastSolve || 0) < 6000) return send(res, 429, { error: 'slow' }); u.lastSolve = Date.now(); u.solved.push(pz.id); gain = 5; u.diamonds = (u.diamonds || 0) + gain; pz.sv = (pz.sv || []).concat([u.name || 'Foydalanuvchi']).slice(-200); store.save(); try { require('./grpupd.js')(pz, () => Object.values(store.users()).filter(v => (v.solved || []).includes(pz.id)).length); } catch (e) {} }"],
  [".then(r => r.json()).then(d => { if (!d.ok) console.log('Guruhga yuborilmadi:', d.description); })",
   ".then(d => { if (!d || !d.ok) return console.log('Guruhga yuborilmadi:', d && d.description); const _pz = arr.find(x => x.id === id); if (_pz && d.result) { _pz.g = { m: d.result.message_id, c: (d.result.chat && d.result.chat.id) || _gc, ph: !!d.result.photo, cap: d.result.photo ? String(_pb.text).split('\\n\\n')[0].slice(0, 1000) : _pb.text }; store.save(); } })"]
];
const cli = [
  ["LV[p.level] + ' · ' + (p.side", "LV[p.level] + ' · 👥 ' + (p.cnt || 0) + ' · ' + (p.side"],
  ["S.admin ? '<button id=\"pzNew\" style=\"' + BS + '\">➕ Yangi</button>' : '');",
   "'<button id=\"pzTop\" style=\"' + BG + '\">🏆 TOP</button>' + (S.admin ? '<button id=\"pzNew\" style=\"' + BS + '\">➕ Yangi</button>' : ''));"],
  ["on('#pzNew', editor);", "on('#pzNew', editor); on('#pzTop', pzTop);"],
  ["function play(p) {",
`function pzTop() {
    ov.innerHTML = head('🏆 Masalalar TOP') + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    on('#pzBack', list);
    api('/api/puzzles/top').then(function (d) {
      var h = head('🏆 Masalalar TOP'), t = d.top || [];
      if (!t.length) h += '<div style="padding:30px;opacity:.7">Hozircha hech kim yechmagan</div>';
      t.forEach(function (x, i) {
        h += '<div style="text-align:left;background:' + (x.me ? '#262b66' : '#161a3a') + ';border:1px solid #262b5a;border-radius:14px;padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between"><span>' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(x.name) + '</span><b>✅ ' + x.n + '</b></div>';
      });
      if (d.rank > 20) h += '<div style="margin-top:10px;opacity:.85">Sizning o‘rningiz: ' + d.rank + ' · ✅ ' + d.n + '</div>';
      ov.innerHTML = h; on('#pzBack', list);
    }).catch(function () { ov.innerHTML = head('🏆 TOP') + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', list); });
  }
  function play(p) {`]
];
const out = { 'economy.js': edit('economy.js', srv), 'puzzles.js': edit('puzzles.js', cli), 'menu.js': edit('menu.js', cli) };
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
