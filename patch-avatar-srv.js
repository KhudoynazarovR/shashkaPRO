const fs = require('fs');
let s = fs.readFileSync('economy.js', 'utf8');
const helper = fs.readFileSync('eco-helper.txt', 'utf8');
const routes = fs.readFileSync('eco-routes.txt', 'utf8');
const edits = [
  ['function send(res, code, obj) {', a => helper + '\n' + a],
  ["if (p === '/api/profile' && req.method === 'GET') {", a => routes + '\n  ' + a],
  ['created: u.created || 0,', a => a + " avatar: u.avatar || '', bio: u.bio || '',"]
];
for (const [a] of edits) {
  if (s.split(a).length !== 2) { console.log('ANCHOR XATO:', a); process.exit(1); }
}
fs.copyFileSync('economy.js', 'economy.js.before-avatar');
for (const [a, f] of edits) s = s.replace(a, () => f(a));
fs.writeFileSync('economy.js', s);
console.log('yangilandi');
