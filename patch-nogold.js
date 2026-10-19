const fs = require('fs');
let C = fs.readFileSync('lobbyclient.js', 'utf8');
const t = '" + (p.bot ? " style=\\"color:#f5b82e;text-shadow:0 0 8px #f5a300\\"" : "") + "';
if (C.split(t).length !== 2) { console.log('XATO: qator topilmadi'); process.exit(1); }
C = C.replace(t, () => '');
fs.writeFileSync('lobbyclient.js', C);
console.log('OK');
