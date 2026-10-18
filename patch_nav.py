f = 'navbar.js'
s = open(f, encoding='utf8').read()
pairs = [
 ("['t', '🏆', 'Turnir'], ['rk', '📊', 'Reyting'], ['mn', '☰', 'Menyu']];",
  "['pz', '🧩', 'Masalalar'], ['t', '🏆', 'Turnir'], ['mn', '☰', 'Menyu']];"),
 ("if (k === 'mn') {",
  "if (k === 'pz') {\n      pg.style.display = 'none';\n      if (window.lbNav) window.lbNav.close();\n      if (window.mnA) window.mnA('@puz');\n      return;\n    }\n    if (k === 'mn') {"),
]
for a, b in pairs:
    if s.count(a) != 1:
        print("TOPILMADI/KO'P:", a[:40], s.count(a)); raise SystemExit(1)
    s = s.replace(a, b)
open(f, 'w', encoding='utf8').write(s)
print('OK')
