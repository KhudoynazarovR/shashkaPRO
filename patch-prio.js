const fs = require('fs');
let K = fs.readFileSync('kestoai.js', 'utf8');
let B = fs.readFileSync('botarena.js', 'utf8');
const k1 = "function run(input, secs, cb) { queue.push({ input: input, secs: secs, cb: cb }); next(); }";
const k2 = "function move(j, cb) {";
const b1 = "K.move({ board: to64(board), side: side === WHITE ? 1 : -1, time: secs }";
const n = (s, a) => s.split(a).length - 1;
if (n(K, k1) !== 1 || n(K, k2) !== 1 || n(B, b1) !== 1) { console.log('XATO: qator topilmadi, hech narsa o\'zgarmadi'); process.exit(1); }
K = K.replace(k1, "let LOWFLAG = false;\nfunction run(input, secs, cb) {\n  const it = { input: input, secs: secs, cb: cb, low: LOWFLAG };\n  if (!it.low) { const i = queue.findIndex(q => q.low); if (i < 0) queue.push(it); else queue.splice(i, 0, it); } else queue.push(it);\n  next();\n}");
K = K.replace(k2, k2 + "\n  LOWFLAG = !!(j && j.arena);");
B = B.replace(b1, "K.move({ board: to64(board), side: side === WHITE ? 1 : -1, time: secs, arena: true }");
fs.writeFileSync('kestoai.js', K); fs.writeFileSync('botarena.js', B);
console.log('OK');
