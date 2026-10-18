import re
f = 'menu.js'
s = open(f, encoding='utf8').read()
m = re.search(r"    var h = '<div style=\"display:flex;justify-content:space-between.*?return h;\n  \}", s, re.S)
if not m:
    print('TOPILMADI: pzMap tanasi'); raise SystemExit(1)
NEW = r"""    var h = '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:24px">' + sv.length + '<span style="font-size:13px;opacity:.6"> / ' + n + ' yechildi</span></b><span style="opacity:.7">🗺 ' + (ch + 1) + '-bosqich</span></div>';
    var bgm = ch % 2 ? '#1d3a5a' : '#2b6a34';
    h += '<div style="position:relative;display:flex;flex-direction:column-reverse;gap:26px;padding:34px 0 34px 0;margin:10px 0;border-radius:16px;overflow:hidden;background-color:' + bgm + ';background-image:linear-gradient(45deg,rgba(0,0,0,.12) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.12) 75%),linear-gradient(45deg,rgba(0,0,0,.12) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.12) 75%);background-size:48px 48px;background-position:0 0,24px 24px">';
    h += '<span style="position:absolute;left:8px;top:14px;font-size:44px;opacity:.9">🌳</span><span style="position:absolute;right:10px;bottom:30px;font-size:46px;opacity:.9">🏠</span>';
    var cnt = b - a;
    for (var i = a; i < b; i++) {
      var k = i - a, done = sv.indexOf(L[i].id) >= 0, now = (i === cu), lock = (i > cu + 3);
      var x = 8 + Math.round(k * (100 / Math.max(cnt, 1)) * 0.55) % 70;
      x = 12 + ((k * 17) % 56);
      var bg = done ? 'linear-gradient(135deg,#8fd14f,#5fa02f)' : now ? 'linear-gradient(135deg,#ffc94a,#f08a1a)' : lock ? 'linear-gradient(135deg,#dbe9ee,#aebfc7)' : 'linear-gradient(135deg,#d9a35a,#8a5a26)';
      var tx = done ? '✓' : now ? '♟' : lock ? '☁️' : (i + 1);
      h += '<div style="margin-left:' + x + '%;width:58px;height:58px;position:relative"><button ' + (lock ? 'disabled' : 'data-pz="' + i + '"') + ' style="width:58px;height:58px;border:0;border-radius:12px;background:' + bg + ';box-shadow:0 6px 0 rgba(0,0,0,.35);transform:rotate(45deg);' + (lock ? 'opacity:.7' : '') + '"><span style="display:inline-block;transform:rotate(-45deg);color:#fff;font-size:22px;font-weight:800;text-shadow:0 2px 2px rgba(0,0,0,.4)">' + tx + '</span></button></div>';
    }
    h += '</div><button id="pzGo" style="width:100%;padding:16px;border:0;border-radius:14px;background:#6fae3d;color:#fff;font-size:20px;font-weight:700;margin-bottom:14px;box-shadow:0 5px 0 #4b7f27">▶ Masalalar yechish</button>';
    return h;
  }"""
s = s[:m.start()] + NEW + s[m.end():]
open(f, 'w', encoding='utf8').write(s)
print('OK')
