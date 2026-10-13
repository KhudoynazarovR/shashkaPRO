var fs = require('fs'), s = fs.readFileSync('index.html', 'utf8');
var a = "if(!S.v2){S.ps='img';S.pz='90';S.v2=1;sv()}";
if (s.split(a).length - 1 !== 1) { console.log('XATO: topilmadi'); process.exit(1); }
if (s.includes("S.v3=1")) { console.log('Allaqachon bor'); process.exit(0); }
s = s.replace(a, function () { return a + "if(!S.v3){S.th='edeon';S.v3=1;sv()}"; });
fs.writeFileSync('index.html', s);
console.log('OK');
