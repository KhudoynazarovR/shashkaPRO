# -*- coding: utf-8 -*-
# Jonli Shashka Pro index.html ga "IDF qura (780 pozitsiya)" ni qo'shadi.
# Ishlatish:  python patch_live_idf780.py [index.html]
import sys, re, zlib, base64, shutil, subprocess, tempfile, os

PATH = sys.argv[1] if len(sys.argv) > 1 else "index.html"
DATA = """
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
"""
raw = zlib.decompress(base64.b64decode("".join(DATA.split()))).decode("utf-8")
assert raw.count("\n") == 779, "ma'lumot buzilgan"
s = open(PATH, encoding="utf-8").read()

if "idf780List" in s:
    print("Allaqachon qo'shilgan. Hech narsa o'zgarmadi."); sys.exit(0)

REPL = [
 ('<option value="idf">IDF Drawing Table 64</option></select>',
  '<option value="idf">IDF Drawing Table 64</option><option value="idf780">IDF qura (780 pozitsiya)</option></select>'),
 ("const L=dtList(S.open);",
  "const L=S.open==='idf780'?idf780List():dtList(S.open);"),
 ("if(e){if(playOpen(e))G.opn={...e,k:S.open};else{G.pos=[init()];G.mv=[];G.cur=0;toast('✗ '+e.n)}}}",
  "if(e){if(e.bs?setIdf(e):playOpen(e))G.opn={...e,k:S.open};else{G.pos=[init()];G.mv=[];G.cur=0;G.s0=1;toast('✗ '+e.n)}}}"),
]
for old, new in REPL:
    if s.count(old) != 1:
        print("XATO: kutilgan kod topilmadi (fayl boshqacha):", old[:60]); sys.exit(1)
    s = s.replace(old, new, 1)

helper = ("const IDF780_RAW=`" + raw + "`;\n"
 "let _idf780=null;\n"
 "function idf780List(){if(_idf780)return _idf780;_idf780=IDF780_RAW.trim().split('\\n').map(l=>{const p=l.split('|');return{n:'IDF '+p[0],mv:p[3].split(' '),bs:p[2],sd:p[1]==='b'?-1:1}});return _idf780}\n"
 "function setIdf(e){const b=Array(64).fill(0),mp={w:1,b:-1,W:2,B:-2};let k=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2){const ch=e.bs[k++];if(ch!=='.')b[r*8+c]=mp[ch]}G.pos=[b];G.mv=[];G.cur=0;G.s0=e.sd;return true}\n")
anchor = "function playOpen(e){"
assert s.count(anchor) == 1
s = s.replace(anchor, helper + anchor, 1)

shutil.copy(PATH, PATH + ".oldin_780")
open(PATH, "w", encoding="utf-8").write(s)

try:
    code = "\n".join(re.findall(r"<script>(.*?)</script>", s, re.S))
    tf = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8")
    tf.write(code); tf.close()
    r = subprocess.run(["node", "--check", tf.name], capture_output=True, text=True)
    os.unlink(tf.name)
    if r.returncode != 0:
        shutil.copy(PATH + ".oldin_780", PATH)
        print("XATO, fayl qaytarildi:\n", r.stderr[:600]); sys.exit(1)
except FileNotFoundError:
    pass
print("✅ Tayyor. Zaxira:", PATH + ".oldin_780")
