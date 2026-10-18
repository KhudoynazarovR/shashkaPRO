f = 'arenaview.js'
s = open(f, encoding='utf8').read()
a = "#avOv .avMk{padding:2px 4px;border-radius:6px}"
b = a + "#hzMkR,#hzDaily,#hzPromo{display:none!important}"
if s.count(a) != 1:
    print("TOPILMADI/KO'P", s.count(a)); raise SystemExit(1)
open(f, 'w', encoding='utf8').write(s.replace(a, b))
print('OK')
