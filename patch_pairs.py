f = 'arenaview.js'
s = open(f, encoding='utf8').read()
a = "g.all.forEach(function (mm, i) { mh += '<a class=\"avMk\" data-p=\"' + (i + 1) + '\" style=\"cursor:pointer;margin-right:6px;display:inline-block;' + (cp === i + 1 ? 'color:#ffd54a;font-weight:700' : '') + '\">' + (i + 1) + '.' + esc(mm) + '</a>'; });"
b = ("var mk = function (mm, i) { return '<a class=\"avMk\" data-p=\"' + (i + 1) + '\" style=\"cursor:pointer;margin-right:4px;' + (cp === i + 1 ? 'color:#ffd54a;font-weight:700' : '') + '\">' + esc(mm) + '</a>'; };"
     " for (var q = 0; q < g.all.length; q += 2) { mh += '<span style=\"display:inline-block;margin-right:10px;white-space:nowrap\">' + (q / 2 + 1) + '.' + mk(g.all[q], q) + (q + 1 < g.all.length ? mk(g.all[q + 1], q + 1) : '') + '</span>'; }")
if s.count(a) != 1:
    print('TOPILMADI'); raise SystemExit(1)
open(f, 'w', encoding='utf8').write(s.replace(a, b))
print('OK')
