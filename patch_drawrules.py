f = 'botarena.js'
s = open(f, encoding='utf8').read()
pairs = [
 ("function finish(white, black, result, hist, ply) {",
  "const DR = require('./draw-rules');\nfunction finish(white, black, result, hist, ply) {"),
 ("const seen = {}, hist = { white: [], black: [] };",
  "const seen = {}, hist = { white: [], black: [] };\n  const dst = DR.createDrawState(board, side === WHITE ? 'white' : 'black');"),
 ("board = R.applyMove(board, mv);",
  "const _b0 = board, _mover = side; board = R.applyMove(board, mv);\n    try { const _dr = DR.updateDraw(dst, _b0, mv, _mover === WHITE ? 'white' : 'black', board); if (_dr && _dr.draw && !result) result = 'draw'; } catch (e) { console.log('[arena] draw-rules xato:', e && e.message); }"),
 ("if (men === 0 && cur.qc >= lim && !result) result = 'draw'; }",
  "}"),
]
for a, b in pairs:
    if s.count(a) != 1:
        print("TOPILMADI/KO'P:", a[:50], s.count(a)); raise SystemExit(1)
    s = s.replace(a, b)
open(f, 'w', encoding='utf8').write(s)
print('OK')
