const fs = require('fs');
let s = fs.readFileSync('lobbyclient.js', 'utf8');
const a = s.indexOf('var clubAll = false, clubView = null;');
const b = s.indexOf('window.lbFriend = function');
if (a < 0 || b < 0 || b < a) { console.log('JOY TOPILMADI'); process.exit(1); }
const old = s.slice(a, b);
const m = old.match(/st\.textContent = ("(?:[^"\\]|\\.)*");/);
if (!m) { console.log('CSS TOPILMADI'); process.exit(1); }
const neu = fs.readFileSync('club-ui.part', 'utf8').replace('__CSS__', () => m[1]);
s = s.slice(0, a) + neu + '    ' + s.slice(b);
fs.writeFileSync('lobbyclient.js', s);
console.log('PATCH_OK');
