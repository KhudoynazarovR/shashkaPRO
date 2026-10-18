f = 'menu.js'
s = open(f, encoding='utf8').read()
pairs = [
 ("var fl = S.folders || [], h = head('🧩 Masalalar', topBtns());",
  "var fl = S.folders || [], h = head('🧩 Masalalar', topBtns());\n"
  "    var _tot = S.list.length, _dn = nDone(S.list), _pc = _tot ? Math.round(_dn * 100 / _tot) : 0;\n"
  "    h += '<div style=\"margin-bottom:14px\"><div style=\"display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px\"><b style=\"font-size:26px\">' + _dn + '<span style=\"font-size:14px;opacity:.6\"> / ' + _tot + ' yechildi</span></b><span style=\"opacity:.7\">' + _pc + '%</span></div>"
  "<div style=\"height:12px;border-radius:8px;background:#262b5a;overflow:hidden\"><div style=\"height:100%;width:' + _pc + '%;background:#f5873b\"></div></div>"
  "<button id=\"pzGo\" style=\"width:100%;margin-top:14px;padding:16px;border:0;border-radius:14px;background:#6fae3d;color:#fff;font-size:20px;font-weight:700\">▶ Masalalar yechish</button></div>';"),
 ("on('#pzBack', close); on('#pzTop', pzTop);",
  "on('#pzBack', close); on('#pzTop', pzTop);\n"
  "    on('#pzGo', function () { var nx = S.list.filter(function (p) { return (S.solved || []).indexOf(p.id) < 0; })[0] || S.list[0]; if (nx) play(nx); });"),
]
for a, b in pairs:
    if s.count(a) != 1:
        print("TOPILMADI/KO'P:", a[:45], s.count(a)); raise SystemExit(1)
    s = s.replace(a, b)
open(f, 'w', encoding='utf8').write(s)
print('OK')
