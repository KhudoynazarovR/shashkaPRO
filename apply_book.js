// Ishlatish: ShashkaPRO papkasida: node apply_book.js   (book.json shu papkada bo'lsin)
const fs = require('fs');
function patch(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file + '.bak_book', s);
  for (const [a, b, name] of pairs) {
    if (!s.includes(a)) { console.log('TOPILMADI:', file, name); continue; }
    s = s.replace(a, b); console.log('OK:', file, name);
  }
  fs.writeFileSync(file, s);
}
patch('kestoai.js', [
  ['let ready = false, busy = 0;',
   'let ready = false, busy = 0;\nlet BOOK = {}; try { BOOK = JSON.parse(fs.readFileSync(path.join(__dirname, "book.json"), "utf8")); console.log("[Kitob] pozitsiyalar:", Object.keys(BOOK).length); } catch (e) { console.log("[Kitob] book.json yo\'q"); }',
   'BOOK yuklash'],
  ['if (busy >= 2) return cb({ error: "busy", code: 429 });',
   'const bk = BOOK[b.join("") + side];\n  if (bk && j.book) return cb({ from: bk.from, to: bk.to, jumps: 0, ev: null, ms: 0, book: 1 });\n  if (busy >= 2) return cb({ error: "busy", code: 429 });',
   'oʻyinda kitob'],
  ['cb({ from: from, to: to, jumps: v[4],',
   'cb({ bk: bk ? { from: bk.from, to: bk.to } : null, from: from, to: to, jumps: v[4],',
   'tahlilda kitob'],
]);
patch('board.js', [
  ["best: { from: [j.from >> 3, j.from & 7], to: [j.to >> 3, j.to & 7] } });",
   "best: { from: [j.from >> 3, j.from & 7], to: [j.to >> 3, j.to & 7] }, bk: j.bk || null });",
   'ask(): bk saqlash'],
  ["'Eng yaxshi: <b>'",
   "(e.bk ? '📖 Kitob: <b>' + sq(e.bk.from >> 3, e.bk.from & 7) + '-' + sq(e.bk.to >> 3, e.bk.to & 7) + '</b> · ' : '') + 'Eng yaxshi: <b>'",
   'koʻrsatish'],
]);
