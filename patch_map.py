import re
f = 'menu.js'
s = open(f, encoding='utf8').read()

MAP = r"""function pzMap() {
    var L = S.list, n = L.length, sv = S.solved || [];
    var cu = 0; while (cu < n && sv.indexOf(L[cu].id) >= 0) cu++;
    var ch = Math.floor(Math.min(cu, Math.max(n - 1, 0)) / 20), a = ch * 20, b = Math.min(a + 20, n);
    var h = '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:24px">' + sv.length + '<span style="font-size:13px;opacity:.6"> / ' + n + ' yechildi</span></b><span style="opacity:.7">🗺 ' + (ch + 1) + '-bosqich</span></div>';
    h += '<div style="display:flex;flex-direction:column-reverse;gap:8px;padding:16px 10px;margin:10px 0;border-radius:16px;background:' + (ch % 2 ? '#1d3a5a' : '#1f4a2a') + '">';
    for (var i = a; i < b; i++) {
      var done = sv.indexOf(L[i].id) >= 0, now = (i === cu), lock = (i > cu + 3);
      var off = [0, 60, 110, 60][(i - a) % 4];
      var bg = done ? '#6fae3d' : now ? '#f5a623' : lock ? '#cfe3ea' : '#b07a3c';
      var tx = done ? '✓' : now ? '♟' : lock ? '☁️' : (i + 1);
      h += '<button ' + (lock ? 'disabled' : 'data-pz="' + i + '"') + ' style="margin-left:' + off + 'px;width:64px;height:64px;border:0;border-radius:16px;background:' + bg + ';color:#fff;font-size:24px;font-weight:700;' + (lock ? 'opacity:.55' : '') + '">' + tx + '</button>';
    }
    h += '</div><button id="pzGo" style="width:100%;padding:16px;border:0;border-radius:14px;background:#6fae3d;color:#fff;font-size:20px;font-weight:700;margin-bottom:14px">▶ Masalalar yechish</button>';
    return h;
  }
  function list() {"""

# eski progress blokini olib tashlash (bo'lsa)
s = re.sub(r"\n    var _tot = S\.list\.length.*?</button></div>';", "", s, flags=re.S)

pairs = [
 ("function list() {", MAP),
 ("var fl = S.folders || [], h = head('🧩 Masalalar', topBtns());",
  "var fl = S.folders || [], h = head('🧩 Masalalar', topBtns()); h += pzMap();"),
]
for a, b in pairs:
    if s.count(a) != 1:
        print("TOPILMADI/KO'P:", a[:40], s.count(a)); raise SystemExit(1)
    s = s.replace(a, b)

# bosish hodisalari
bind = ("\n    Array.prototype.forEach.call(ov.querySelectorAll('[data-pz]'), function (e) { e.onclick = function () { var p = S.list[Number(e.getAttribute('data-pz'))]; if (p) play(p); }; });"
        "\n    on('#pzGo', function () { var nx = S.list.filter(function (p) { return (S.solved || []).indexOf(p.id) < 0; })[0] || S.list[0]; if (nx) play(nx); });")
a = "on('#pzBack', close); on('#pzTop', pzTop);"
if s.count(a) != 1:
    print("bind TOPILMADI", s.count(a)); raise SystemExit(1)
s = s.replace(a, a + bind)
# patch_pz dan qolgan eski #pzGo chaqiruvi bo'lsa, ikki marta bog'lanmasin
s = re.sub(r"\n    on\('#pzGo', function \(\) \{ var nx = S\.list\.filter.*?play\(nx\); \}\);", "", s, count=1, flags=re.S) if s.count("on('#pzGo'") > 1 else s
open(f, 'w', encoding='utf8').write(s)
print('OK')
