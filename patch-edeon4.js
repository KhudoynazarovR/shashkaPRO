var fs = require('fs'), s = fs.readFileSync('index.html', 'utf8');
var a = "tc:'300+3',th:'classic'";
if (s.split(a).length - 1 !== 1) { console.log('XATO: boshlang\u2018ich qiymat topilmadi'); process.exit(1); }
s = s.replace(a, function () { return "tc:'300+3',th:'edeon'"; });
var m = "if(!S.v2){S.ps='img';S.pz='90';S.v2=1;sv()}";
if (s.indexOf("S.v3=1") < 0) {
  if (s.split(m).length - 1 !== 1) { console.log('XATO: v2 topilmadi'); process.exit(1); }
  s = s.replace(m, function () { return m + "if(!S.v3){S.th='edeon';S.v3=1;sv()}"; });
}
fs.writeFileSync('index.html', s);
console.log('OK');
