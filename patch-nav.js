const fs = require('fs');
function patch(file, anchor, fn) {
  const s = fs.readFileSync(file, 'utf8');
  if (s.split(anchor).length !== 2) { console.log('ANCHOR XATO:', file); process.exit(1); }
  fs.copyFileSync(file, file + '.before-nav');
  fs.writeFileSync(file, s.replace(anchor, () => fn(anchor)));
}
patch('lobbyclient.js',
  'function closePanel() { panel.style.display = "none"; panelOpen = false; }',
  a => a + '\n    window.lbNav = { open: function (tab) { curTab = tab; openPanel(); }, close: function () { if (panel) closePanel(); } };');
patch('server.js',
  'if (!html.includes("lobbyclient.js")) {',
  a => 'if (!html.includes("navbar.js")) {\n      html = html.replace("</body>", \'<script src="/navbar.js"></script>\\n</body>\');\n    }\n    ' + a);
console.log('yangilandi');
