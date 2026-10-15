const fs = require('fs');
function one(s, a, name) { const n = s.split(a).length - 1; if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); } }
let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('/api/shop')) { console.log('Allaqachon bor'); process.exit(0); }
const ea = "if (p === '/api/profile' && req.method === 'GET') {";
one(E, ea, 'economy');
E = E.replace(ea, () => fs.readFileSync('shop-srv.txt', 'utf8') + '  ' + ea);
let T = fs.readFileSync('store.js', 'utf8');
const ta = 'db.puzzles = r.rows[0].v.puzzles;';
one(T, ta, 'store');
T = T.replace(ta, () => ta + '\n        if (r.rows[0].v && Array.isArray(r.rows[0].v.shop)) db.shop = r.rows[0].v.shop;');
let M = fs.readFileSync('menu.js', 'utf8');
const ma = '"@puz", "#f5873b,#f7c02d"]]],';
const mb = 'if (a === "@puz") { close(); if (window.spPuzzles) window.spPuzzles(); return; }';
one(M, ma, 'menu1'); one(M, mb, 'menu2');
M = M.replace(ma, () => '"@puz", "#f5873b,#f7c02d"],\n      ["💎", "Tosh do‘koni", "Donalar va o‘z donangiz", "@shop", "#7b3ff2,#d62f8f"]]],');
M = M.replace(mb, () => mb + '\n    if (a === "@shop") { close(); if (window.spShop) window.spShop(); return; }');
M += '\n;' + fs.readFileSync('shop.js', 'utf8') + '\n';
const fx = [['lobbyclient.js', '(ref_|pz_)', '(ref_|pz_|shop_)'], ['roomclient.js', '(ref_|pz_)', '(ref_|pz_|shop_)'], ['aiview.js', '(lb[tsf]|ref|pz)_', '(lb[tsf]|ref|pz|shop)_']];
const out = {};
for (const [f, a, b] of fx) { const s = fs.readFileSync(f, 'utf8'); one(s, a, f); out[f] = s.replace(a, () => b); }
fs.writeFileSync('economy.js', E); fs.writeFileSync('store.js', T); fs.writeFileSync('menu.js', M);
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
