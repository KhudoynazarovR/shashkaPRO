const fs = require('fs');
const jobs = [
  ['lobbyclient.js', '!/^ref_/.test(tg.initDataUnsafe.start_param)', '!/^(ref_|pz_)/.test(tg.initDataUnsafe.start_param)', '(ref_|pz_)'],
  ['roomclient.js', '!/^ref_/.test(tg.initDataUnsafe.start_param)', '!/^(ref_|pz_)/.test(tg.initDataUnsafe.start_param)', '(ref_|pz_)'],
  ['aiview.js', '!/^(lb[tsf]|ref)_/.test(sp)', '!/^(lb[tsf]|ref|pz)_/.test(sp)', '|pz)_']
];
const out = {};
for (const [f, a, b, mark] of jobs) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(mark)) { console.log(f + ': allaqachon bor'); continue; }
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log('XATO: ' + f + ' -> ' + n + ' marta topildi'); process.exit(1); }
  out[f] = s.replace(a, () => b);
}
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
