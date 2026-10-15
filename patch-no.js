const fs = require('fs');
let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('_title')) { console.log('Allaqachon bor'); process.exit(0); }
function rep(from, to, name) {
  const n = E.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  E = E.replace(from, () => to);
}
rep("store.db.puzzles = store.db.puzzles || [];\n    const _u = ",
`store.db.puzzles = store.db.puzzles || [];
    { let _mx = 0, _ch = false; const _a = store.db.puzzles; _a.forEach(x => { if (x.no) _mx = Math.max(_mx, x.no); }); _a.forEach(x => { if (!x.no) { x.no = ++_mx; _ch = true; } if (x.title === 'Masala') { x.title = 'Masala ' + x.no; _ch = true; } }); if (_ch) store.save(); }
    const _u = `, 'get');
rep("arr.push({ id, title: String(j.title || 'Masala').replace(/[<>]/g, '').trim().slice(0, 40) || 'Masala', level:",
`let _mx = 0; arr.forEach(x => { if (x.no) _mx = Math.max(_mx, x.no); }); arr.forEach(x => { if (!x.no) x.no = ++_mx; });
      const _no = ++_mx, _t0 = String(j.title || '').replace(/[<>]/g, '').trim().slice(0, 40), _title = (!_t0 || _t0 === 'Masala') ? 'Masala ' + _no : _t0; j.title = _title;
      arr.push({ id, no: _no, title: _title, level:`, 'push');
fs.writeFileSync('economy.js', E);
console.log('TAYYOR');
