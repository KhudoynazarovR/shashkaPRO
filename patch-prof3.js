const fs = require('fs');
function patch(file, anchor, fn) {
  const s = fs.readFileSync(file, 'utf8');
  if (s.split(anchor).length !== 2) { console.log('ANCHOR XATO:', file, anchor); process.exit(1); }
  fs.copyFileSync(file, file + '.before-prof3');
  fs.writeFileSync(file, s.replace(anchor, () => fn(anchor)));
}
patch('navbar.js', "if (k === 'pf') profile();",
  () => "if (k === 'pf') { if (window.nvProfile) window.nvProfile(pg); else soon('Profil', 'Yuklanmoqda…'); }");
patch('server.js', 'if (!html.includes("navbar.js")) {',
  a => 'if (!html.includes("profile.js")) {\n      html = html.replace("</body>", \'<script src="/profile.js?v=\' + Date.now() + \'"></script>\\n</body>\');\n    }\n    ' + a);
console.log('yangilandi');
