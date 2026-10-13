const fs = require('fs');
let s = fs.readFileSync('patch-clubui.js', 'utf8');
const a = s.indexOf('L = rep(L, "if (m.type === \'lbTCreate\')');
const b = s.indexOf('L = rep(L, "if (m.type === \'lbTJoin\'');
if (a < 0 || b < 0 || b < a) { console.log('FIX XATO'); process.exit(1); }
const neu = 'L = rep(L, "if (m.type === \'lbTCreate\') {", "\\n    { const cl0 = clubsApi.check(uid, m.clubIds); if (cl0.error) { err(c, cl0.error); return true; } }", \'after\');\n';
s = s.slice(0, a) + neu + s.slice(b);
fs.writeFileSync('patch-clubui.js', s);
console.log('FIX_OK');
