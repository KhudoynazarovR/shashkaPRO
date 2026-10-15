p = "roomclient.js"
s = open(p, encoding="utf-8").read()
a = s.find('\n      elTc.style.flexWrap = "wrap";')
bm = 'elTc.appendChild(pb);\n      });'
b = s.find(bm, a)
if a < 0 or b < 0:
    raise SystemExit("Blok topilmadi")
b += len(bm)
block = s[a:b]
s = s[:a] + s[b:]
anchor = "        elTc.appendChild(b);\n      });"
if s.count(anchor) != 1:
    raise SystemExit("Anchor topilmadi: %d" % s.count(anchor))
s = s.replace(anchor, anchor + block, 1)
open(p, "w", encoding="utf-8").write(s)
print("OK")
