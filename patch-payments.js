const fs = require('fs');

function patch(file, edits) {
  let s = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [find, repl, marker] of edits) {
    if (s.includes(marker)) { console.log(file + ': allaqachon bor -> ' + marker); continue; }
    if (!s.includes(find)) { console.log(file + ': TOPILMADI -> ' + find); process.exitCode = 1; continue; }
    s = s.replace(find, () => repl);
    changed = true;
  }
  if (changed) {
    fs.copyFileSync(file, file + '.before-pay');
    fs.writeFileSync(file, s);
    console.log(file + ': yangilandi');
  }
}

patch('bot.js', [
  ['const crypto = require("crypto");',
   'const crypto = require("crypto");\nconst pay = require("./payments.js");',
   'require("./payments.js")'],
  ['allowed_updates: ["message", "inline_query"]',
   'allowed_updates: ["message", "inline_query", "pre_checkout_query"]',
   '"pre_checkout_query"'],
  ['if (u.message) await onMessage(u.message);',
   'if (u.pre_checkout_query) await pay.onPreCheckout(u.pre_checkout_query);\n' +
   '          else if (u.message && u.message.successful_payment) await pay.onPayment(u.message);\n' +
   '          else if (u.message) await onMessage(u.message);',
   'pay.onPreCheckout'],
]);

patch('server.js', [
  ['if (url.pathname === "/health") {',
   'if (require("./payments.js").handle(req, res, url)) return;\n\n  if (url.pathname === "/health") {',
   'require("./payments.js").handle'],
]);
