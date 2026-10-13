const fs = require('fs');
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
let s = fs.readFileSync('roomclient.js', 'utf8');
if (s.includes('olive|photo|edeon')) { console.log('Allaqachon bor'); process.exit(0); }
s = rep(s, 'olive|photo)$/.test(th)) th = "classic";', 'olive|photo|edeon)$/.test(th)) th = "edeon";', 'tekshiruv');
s = rep(s, 'var th = "classic", ps = "glossy"', 'var th = "edeon", ps = "glossy"', 'boshlangich');

// Edeon CSS topilmaguncha "tayyor" deb belgilamaymiz, eski uslubni almashtiramiz
const re1 = /if \(themeCssDone\) return;\s*themeCssDone = true;/;
if (!re1.test(s)) { console.log('XATO: flag1 topilmadi'); process.exit(1); }
s = s.replace(re1, 'if (themeCssDone) return;');
const re2 = /if \(css\) \{\s*var el = document\.createElement\("style"\);\s*el\.textContent = css;/;
if (!re2.test(s)) { console.log('XATO: style bloki topilmadi'); process.exit(1); }
s = s.replace(re2, 'if (/edeon/.test(css)) themeCssDone = true;\n    if (css) {\n      var old = document.getElementById("rcThemeCss"); if (old) old.remove();\n      var el = document.createElement("style"); el.id = "rcThemeCss";\n      el.textContent = css;');
fs.writeFileSync('roomclient.js', s);
console.log('TAYYOR');
