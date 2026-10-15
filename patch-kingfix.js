const fs = require('fs');
const A = "n[m.to.r][m.to.c]=p;return n}";
const B = "n[m.to.r][m.to.c]=(p===WHITE&&m.to.r===0)?WHITE_KING:(p===BLACK&&m.to.r===7)?BLACK_KING:p;return n}";
for (const f of ['rules-bridge.js', 'ShashkaPRO_Online.html']) {
  let s = fs.readFileSync(f, 'utf8');
  const n = s.split(A).length - 1;
  if (n !== 1) { console.log('XATO: ' + f + ' (' + n + ')'); process.exit(1); }
  fs.writeFileSync(f, s.replace(A, () => B));
}
console.log('TAYYOR');
