const fs = require('fs');
let s = fs.readFileSync('board.js', 'utf8');
if (s.includes('pvWorkerBody')) { console.log('Allaqachon bor'); process.exit(0); }
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
const code = fs.readFileSync('pv-insert.txt', 'utf8');
s = rep(s, 'window.spBoard = function (g) {', code + '\n  window.spBoard = function (g) {', 'spBoard');
s = rep(s, "sq(e.best.to[0], e.best.to[1]) + '</b>';", "sq(e.best.to[0], e.best.to[1]) + '</b>' + pvHtml(h);", 'info');
fs.copyFileSync('board.js', 'board.js.bak-pv');
fs.writeFileSync('board.js', s);
console.log('TAYYOR');
