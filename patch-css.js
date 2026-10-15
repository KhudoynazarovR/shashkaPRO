const fs = require('fs');
const a = "B = 'html body #board .sq .pc'";
const b = "B = 'html body #board[data-th][data-ps] .sq .pc'";
const out = {};
for (const f of ['shop.js', 'menu.js']) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(b)) { console.log(f + ': allaqachon bor'); continue; }
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log('XATO: ' + f + ' -> ' + n); process.exit(1); }
  out[f] = s.replace(a, () => b);
}
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
