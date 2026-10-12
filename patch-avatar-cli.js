const fs = require('fs');
let s = fs.readFileSync('profile.js', 'utf8');
const a1 = `$('pfRank').textContent = rank(d.wins) + (d.premium ? ' · 👑 Premium' : '');`;
const a2 = `.pf-bt:disabled{opacity:.5}';`;
if (s.split(a1).length !== 2 || s.split(a2).length !== 2) { console.log('ANCHOR XATO'); process.exit(1); }
fs.copyFileSync('profile.js', 'profile.js.before-avatar');
const add = fs.readFileSync('prof-add.txt', 'utf8');
s = s.replace(a1, () => a1 + '\n' + add);
s = s.replace(a2, () => `.pf-bt:disabled{opacity:.5}' +\n    '.pf-sm{border:0;border-radius:14px;padding:8px 16px;font-size:14px;color:#fff;background:#ffffff2b}.pf-bio{margin:10px 12px 0;font-size:14px;color:#e5e7ff}';`);
fs.writeFileSync('profile.js', s);
console.log('yangilandi');
