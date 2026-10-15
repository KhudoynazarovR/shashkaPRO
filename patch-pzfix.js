const fs = require('fs');
const from = '!/^ref_/.test(tg.initDataUnsafe.start_param)';
const to = '!/^(ref_|pz_)/.test(tg.initDataUnsafe.start_param)';
const out = {};
for (const f of ['lobbyclient.js', 'roomclient.js']) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('(ref_|pz_)')) { console.log(f + ': allaqachon bor'); continue; }
  const n = s.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + f + ' -> ' + n + ' marta topildi'); process.exit(1); }
  out[f] = s.replace(from, () => to);
}
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
