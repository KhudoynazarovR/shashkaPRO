const fs = require('fs');
let s = fs.readFileSync('lobby.js', 'utf8');
const a = "hasAv: !!(su && su.avatar), bot: !!c.isBot";
if (s.split(a).length !== 2) { console.log('XATO: qator topilmadi'); process.exit(1); }
s = s.replace(a, () => "hasAv: !!(su && su.avatar) || (!!c.isBot && !!botX(c.lb.uid).a), bot: !!c.isBot");
fs.writeFileSync('lobby.js', s);
console.log('OK');
