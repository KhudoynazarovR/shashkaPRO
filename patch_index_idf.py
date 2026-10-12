# -*- coding: utf-8 -*-
import sys, re, shutil, subprocess, tempfile, os

PATH = sys.argv[1] if len(sys.argv) > 1 else "index.html"
s = open(PATH, encoding="utf-8").read()

if "pickStartPosition" in s:
    print("Allaqachon qo'shilgan. Hech narsa o'zgarmadi."); sys.exit(0)
if 'src="idf780.js"' not in s:
    print('XATO: index.html da idf780.js ulanmagan.'); sys.exit(1)

a = s.find("function startGame(){")
if a < 0:
    print("XATO: function startGame(){ topilmadi."); sys.exit(1)
b = s.index("\n}\n", a) + 3
seg = s[a:b]

old1 = "boardState=startPosition();turn=WHITE;"
old2 = "updateTimer();startTimer()"
if old1 not in seg or old2 not in seg:
    print("XATO: startGame ichidagi kutilgan qatorlar topilmadi."); sys.exit(1)
seg2 = seg.replace(old1, "const _p=pickStartPosition();boardState=_p.board;turn=_p.turn;", 1)
seg2 = seg2.replace(old2, old2 + ';if($("gameTitle")&&_p.label)$("gameTitle").textContent+=" · IDF "+_p.label;if(turn===BLACK&&!gameOver)aiTimer=setTimeout(aiMove,600)', 1)

helper = r'''function pickStartPosition(){
  const mode=($("posMode")&&$("posMode").value)||"std";
  if(mode==="idf"&&typeof IDF780!=="undefined"&&IDF780.length){
    const p=IDF780[Math.floor(Math.random()*IDF780.length)];
    const map={w:WHITE,b:BLACK,W:WHITE_KING,B:BLACK_KING};
    const b=Array.from({length:8},()=>Array(8).fill(EMPTY));let k=0;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2){const ch=p.board[k++];if(ch!=="."&&map[ch])b[r][c]=map[ch]}
    return{board:b,turn:p.side==="b"?BLACK:WHITE,label:p.id}
  }
  return{board:startPosition(),turn:WHITE,label:""}
}
'''
s = s[:a] + helper + seg2 + s[b:]

sel = ('<label for="posMode">📍 Boshlang\'ich pozitsiya</label>\n'
       '<select id="posMode"><option value="std">Oddiy shashka</option>'
       '<option value="idf">IDF qura (780 pozitsiya)</option></select>\n')
m = '<label for="timeControl">'
if m not in s:
    print("XATO: timeControl yorlig'i topilmadi."); sys.exit(1)
s = s.replace(m, sel + m, 1)

shutil.copy(PATH, PATH + ".oldin_pozitsiya")
open(PATH, "w", encoding="utf-8").write(s)

try:
    code = "\n".join(re.findall(r"<script>(.*?)</script>", s, re.S))
    tf = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8")
    tf.write(code); tf.close()
    r = subprocess.run(["node", "--check", tf.name], capture_output=True, text=True)
    os.unlink(tf.name)
    if r.returncode != 0:
        shutil.copy(PATH + ".oldin_pozitsiya", PATH)
        print("XATO, fayl qaytarildi:\n", r.stderr[:600]); sys.exit(1)
except FileNotFoundError:
    pass
print("✅ Tayyor. Zaxira:", PATH + ".oldin_pozitsiya")
