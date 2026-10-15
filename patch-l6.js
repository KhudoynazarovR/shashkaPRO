const fs = require('fs');
let H = fs.readFileSync('index.html', 'utf8');
if (H.includes('bestMove6')) { console.log('Allaqachon bor'); process.exit(0); }
const eng = fs.readFileSync('l6-engine.txt', 'utf8');
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
H = rep(H, 'const LV=[[1,40],[3,150],[5,500],[8,1500],[14,3500]];', eng + '\nconst LV=[[1,40],[3,150],[5,500],[8,1500],[14,3500]];', 'LV');
H = rep(H, 'function bestMove(b,side,lvl,ms_){', 'function bestMove(b,side,lvl,ms_){if(lvl>=5)return bestMove6(b,side,ms_);', 'bestMove');
fs.writeFileSync('index.html', H);
console.log('TAYYOR');
