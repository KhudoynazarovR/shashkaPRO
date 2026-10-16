// ShashkaPRO papkasida: node apply_fix.js
const fs = require('fs');
let s = fs.readFileSync('economy.js', 'utf8');
if (s.includes('pzfix.js')) { console.log('Allaqachon qo\'llangan'); process.exit(0); }
const a = "require('./pzimport2.js')(store);";
if (!s.includes(a)) { console.log('TOPILMADI: apply_combos2.js qo\'llanmagan'); process.exit(1); }
fs.writeFileSync('economy.js.bak_fix', s);
s = s.replace(a, a + " require('./pzfix.js')(store);");
fs.writeFileSync('economy.js', s); console.log('OK: economy.js');
