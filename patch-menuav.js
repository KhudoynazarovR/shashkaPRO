const fs = require('fs');
let s = fs.readFileSync('menu.js', 'utf8');
if (s.includes('/api/av/')) { console.log('Allaqachon bor'); process.exit(0); }
const re = /var av = u\.photo_url \? "<img src=\\"" \+ esc\(u\.photo_url\) \+ "\\">" : "👤";/;
if (!re.test(s)) { console.log('XATO: av qatori topilmadi'); process.exit(1); }
s = s.replace(re, () => 'var av = u.id ? "<img src=\\"/api/av/" + encodeURIComponent(u.id) + "?t=" + Date.now() + "\\" onerror=\\"this.outerHTML=\'👤\'\\">" : "👤";');
fs.writeFileSync('menu.js', s);
console.log('TAYYOR');
