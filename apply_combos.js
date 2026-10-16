// ShashkaPRO papkasida: node apply_combos.js
const fs = require('fs');
let s = fs.readFileSync('economy.js', 'utf8'); fs.writeFileSync('economy.js.bak_combo', s);
const re = /(store\.db\.puzzles = store\.db\.puzzles \|\| \[\];)(\s*\{ let _mx = 0)/;
if (!re.test(s)) { console.log('TOPILMADI: economy.js da kerakli joy'); process.exit(1); }
if (s.includes("pzimport.js")) { console.log('Allaqachon qo\'llangan'); process.exit(0); }
s = s.replace(re, "$1 try { require('./pzimport.js')(store); } catch (e) { console.log('[Import] xato', e.message); }$2");
fs.writeFileSync('economy.js', s); console.log('OK: economy.js');
