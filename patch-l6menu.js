const fs = require('fs');
let H = fs.readFileSync('index.html', 'utf8');
if (H.includes('<option value="5">')) { console.log('Allaqachon bor'); process.exit(0); }
const re = /(<select data-s="lvl">[\s\S]*?)(<\/select>)/g;
const found = H.match(re) || [];
if (found.length !== 1) { console.log('XATO: lvl select ' + found.length + ' marta topildi'); process.exit(1); }
H = H.replace(re, (m, a, b) => a + '<option value="5">6 · Usta</option>' + b);
fs.writeFileSync('index.html', H);
console.log('TAYYOR');
