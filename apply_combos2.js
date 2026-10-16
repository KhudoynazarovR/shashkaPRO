// ShashkaPRO papkasida: node apply_combos2.js
const fs = require('fs');
let s = fs.readFileSync('economy.js', 'utf8');
if (s.includes('pzimport2.js')) { console.log('Allaqachon qo\'llangan'); process.exit(0); }
const a = "require('./pzimport.js')(store);";
if (!s.includes(a)) { console.log('TOPILMADI: avval apply_combos.js qo\'llanishi kerak'); process.exit(1); }
fs.writeFileSync('economy.js.bak_combo2', s);
s = s.replace(a, a + " require('./pzimport2.js')(store);");
fs.writeFileSync('economy.js', s); console.log('OK: economy.js');
