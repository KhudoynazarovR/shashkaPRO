f = 'botarena.js'
s = open(f, encoding='utf8').read()
pairs = [
 ("let pick = null;", "let pick = null, why = 'dvigatel';"),
 ("else if (Math.random() < sg.blunder) pick = moves[rnd(moves.length)];",
  "else if (Math.random() < sg.blunder) { why = 'blunder'; pick = matchMove(moves, await askEngine(board, side, 0.05)); }"),
 ("const bad = memGet(bot.uid, key);",
  "const bad = memGet(bot.uid, key); if (process.env.ARDBG) console.log('[arena]', bot.name, why, pick ? mstr(pick) : 'null');"),
 ("if (bad && moves.length > 1 && bad.indexOf(mstr(pick)) >= 0) {",
  "if (bad && moves.length > 1 && Math.random() < 0.3 && bad.indexOf(mstr(pick)) >= 0) {"),
]
for a, b in pairs:
    if s.count(a) != 1:
        print('TOPILMADI/KO\'P:', a[:50]); raise SystemExit(1)
    s = s.replace(a, b)
open(f, 'w', encoding='utf8').write(s)
print('OK')
