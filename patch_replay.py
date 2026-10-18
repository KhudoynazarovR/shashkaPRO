def sub(f, pairs):
    s = open(f, encoding='utf8').read()
    for a, b in pairs:
        if s.count(a) != 1:
            print('TOPILMADI/KO\'P:', f, a[:50]); raise SystemExit(1)
        s = s.replace(a, b)
    open(f, 'w', encoding='utf8').write(s)
    print('OK', f)

sub('botarena.js', [(
 "n: ply, t: Date.now() });",
 "n: ply, t: Date.now(), s: cur.start, we: cur.white.elo, be: cur.black.elo, h: cur.hist, a: cur.all });\n  d.arenaLog.forEach((x, i) => { if (i >= 6) { delete x.h; delete x.a; } });"
)])

sub('arenaview.js', [
 ("var viewPly = null, vId = null;",
  "var viewPly = null, vId = null, vLog = null;"),
 ("if (!ov) return; last = j;",
  "if (!ov) return; last = j; var rv = null;\n    if (vLog != null && j.log && j.log[vLog] && j.log[vLog].h) { var x0 = j.log[vLog]; rv = x0; j = Object.assign({}, j, { game: { id: 'L' + x0.t, white: { name: x0.w, elo: x0.we || '' }, black: { name: x0.b, elo: x0.be || '' }, board: null, hist: x0.h, all: x0.a, start: x0.s || 'std', ply: x0.n, over: true, result: x0.r === '1-0' ? 'white' : x0.r === '0-1' ? 'black' : 'draw', moves: [] } }); }"),
 ("if (g.id !== vId) { vId = g.id; viewPly = null; }",
  "if (g.id !== vId) { vId = g.id; viewPly = null; }\n        if (rv) h += '<button class=\"avN avBk\" style=\"margin:6px 0\">\\u2B05 Jonli o‘yin</button>';"),
 ("function (x) { h += '<tr><td>' + nm(x.w)",
  "function (x, i) { h += '<tr class=\"avLg\" data-i=\"' + i + '\" style=\"' + (x.h ? 'cursor:pointer;background:rgba(255,255,255,.06)' : '') + '\"><td>' + nm(x.w)"),
 ("ov.innerHTML = h; bindNav(g);",
  "ov.innerHTML = h; bindNav(g);\n    ov.querySelectorAll('.avLg').forEach(function (r) { r.onclick = function () { var i = +r.getAttribute('data-i'); if (j.log[i] && j.log[i].h) { vLog = i; viewPly = null; vId = null; draw(last); } }; });\n    var bk = ov.querySelector('.avBk'); if (bk) bk.onclick = function () { vLog = null; viewPly = null; vId = null; draw(last); };"),
])
