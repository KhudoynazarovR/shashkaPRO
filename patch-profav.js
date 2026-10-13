const fs = require('fs');
let s = fs.readFileSync('profile.js', 'utf8');
if (s.includes('/api/av/')) { console.log('Allaqachon bor'); process.exit(0); }
const re = /var av = u\.photo_url\s*\?[^;]*;/;
if (!re.test(s)) { console.log('XATO: av qatori topilmadi'); process.exit(1); }
s = s.replace(re, () => `var av = u.id
      ? '<img class="pf-av" src="/api/av/' + u.id + '?t=' + Date.now() + '" onerror="this.outerHTML=&quot;<div class=pf-av>👤</div>&quot;">'
      : '<div class="pf-av">👤</div>';`);
const b = 'if (d.avatar) setAv(d.avatar);';
if (s.split(b).length - 1 === 1) s = s.replace(b, () => '');
fs.writeFileSync('profile.js', s);
console.log('TAYYOR');
