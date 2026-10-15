const fs = require('fs');
const code = fs.readFileSync('shop-form.txt', 'utf8');
const A = 'function drawForm() {', B = 'window.spShop = open;';
const res = {};
for (const f of ['shop.js', 'menu.js']) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('function paint(k, cv, sz)')) { console.log(f + ': allaqachon bor'); continue; }
  const a = s.split(A).length - 1, b = s.split(B).length - 1;
  if (a !== 1 || b !== 1) { console.log('XATO: ' + f + ' -> ' + a + '/' + b); process.exit(1); }
  const i = s.indexOf(A), j = s.indexOf(B);
  if (j < i) { console.log('XATO: tartib ' + f); process.exit(1); }
  res[f] = s.slice(0, i) + code + s.slice(j);
}
for (const f in res) fs.writeFileSync(f, res[f]);
console.log('TAYYOR');
