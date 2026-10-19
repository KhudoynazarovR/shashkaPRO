const fs = require('fs');
const files = ['lobby.js','public/index.html','lobbyclient.js','payments.js','economy.js','navbar.js','profile.js','ratings.js','menu.js','puzzles.js','shop.js','pzranks.js'];
let total = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.log("yo'q:", f); continue; }
  const s = fs.readFileSync(f, 'utf8');
  fs.writeFileSync('bak_coin/' + f.replace(/\//g, '_'), s);
  const n = (s.match(/💎|olmos|Olmos|OLMOS/g) || []).length;
  const t = s.replace(/💎/g, '🪙').replace(/olmos/g, 'tanga').replace(/Olmos/g, 'Tanga').replace(/OLMOS/g, 'TANGA');
  if (n) { fs.writeFileSync(f, t); total += n; console.log(f, n); }
}
console.log('JAMI almashtirildi:', total);
