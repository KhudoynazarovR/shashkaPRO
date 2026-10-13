const fs = require('fs');
const re = /\u{1F441}\uFE0F?/gu;
const s = fs.readFileSync('menu.js', 'utf8');
const n = (s.match(re) || []).length;
fs.writeFileSync('menu.js', s.replace(re, '📺'));
console.log('menu.js almashtirildi:', n);
