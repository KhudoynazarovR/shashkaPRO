const fs = require('fs');
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
let s = fs.readFileSync('roomclient.js', 'utf8');
if (s.includes('var hd = document.createElement')) { console.log('Allaqachon bor'); process.exit(0); }
s = rep(s, 'xb.textContent = "✕";', 'xb.textContent = "⬅️";', 'belgi');
s = rep(s, 'tabs.appendChild(xb);', 'var hd = document.createElement("div"); hd.style.cssText = "display:flex;gap:6px;align-items:center"; tabs.style.flex = "1"; tabs.style.minWidth = "0"; hd.appendChild(xb); hd.appendChild(tabs);', 'hd');
s = rep(s, 'elQ.appendChild(tabs);', 'elQ.appendChild(hd);', 'append');
s = rep(s, 'k < tabs.children.length - 1', 'k < tabs.children.length', 'loop');
fs.writeFileSync('roomclient.js', s);
console.log('TAYYOR');
