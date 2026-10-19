const fs = require('fs');
const cnt = (s, a) => s.split(a).length - 1;
let H = fs.readFileSync('index.html', 'utf8');
let R = fs.readFileSync('roomclient.js', 'utf8');
let L = fs.readFileSync('lobby.js', 'utf8');

const h1 = "function ab6(b,side,d,al,be,ply){";
const h2 = "const key=side+b.join(''),e=TT6.get(key);let tm=-1;";
const h3 = "TT6.get(s+bb.join(''))";
const h4 = "for(const x of sc){const v=-ab6(apply(b,x[1]),-side,d-1,-be,-al,ply+1);";
const r1 = "remaining(side) / 1000 / 25";
const l1 = "uid: 'bot_pro', name: '🤖 Usta', secs: 3, blunder: 0 }";

const bad = [[H,h1],[H,h2],[H,h3],[H,h4],[R,r1],[L,l1]].filter(x => cnt(x[0], x[1]) !== 1);
if (bad.length) { console.log('XATO: ' + bad.length + ' ta qator topilmadi, hech narsa o\'zgarmadi'); process.exit(1); }
if (H.includes('function hk(')) { console.log('Allaqachon qo\'llangan'); process.exit(0); }

const HK = "function hk(b,s){let a=s>0?17:31,c=s>0?5:9;for(let i=0;i<64;i++){const v=b[i]+2;a=(Math.imul(a,33)+v+i)|0;c=(Math.imul(c,131)^(v*(i+1)))|0}return(a>>>0)*2097152+((c>>>0)&2097151)}\n";
H = H.replace(h1, HK + h1);
H = H.replace(h2, "const key=hk(b,side),e=TT6.get(key);let tm=-1;");
H = H.replace(h3, "TT6.get(hk(bb,s))");
H = H.replace(h4, "let ix=0;for(const x of sc){ix++;let v;if(d>=3&&ix>6&&!x[1].caps.length&&ms.length>1){v=-ab6(apply(b,x[1]),-side,d-2,-be,-al,ply+1);if(v>al)v=-ab6(apply(b,x[1]),-side,d-1,-be,-al,ply+1)}else v=-ab6(apply(b,x[1]),-side,d-1,-be,-al,ply+1);");
R = R.replace(r1, "remaining(side) / 1000 / 15");
L = L.replace(l1, l1 + ",\n  { uid: 'bot_gm', name: '🤖 Grossmeyster', secs: 6, blunder: 0 },\n  { uid: 'bot_champ', name: '🤖 Chempion', secs: 12, blunder: 0 }");

fs.writeFileSync('index.html', H); fs.writeFileSync('roomclient.js', R); fs.writeFileSync('lobby.js', L);
console.log('OK: dvigatel va botlar yangilandi');
