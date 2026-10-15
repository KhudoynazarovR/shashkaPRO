const fs = require('fs');
let H = fs.readFileSync('index.html', 'utf8');
if (H.includes('analyze6')) { console.log('Allaqachon bor'); process.exit(0); }
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
const code = fs.readFileSync('l6-analysis.txt', 'utf8');
H = rep(H, 'const LV=[[1,40],[3,150],[5,500],[8,1500],[14,3500]];', code + '\nconst LV=[[1,40],[3,150],[5,500],[8,1500],[14,3500]];', 'LV');
H = rep(H, 'function analyze(){', 'function analyze(){if(+S.lvl>=5)return analyze6();', 'analyze');
fs.writeFileSync('index.html', H);
console.log('TAYYOR');
