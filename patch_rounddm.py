import sys, shutil, subprocess
F = 'lobby.js'
s = open(F, encoding='utf-8').read()
if 'function roundDm' in s:
    sys.exit('Allaqachon qoʻllangan')
H = "function olyOpenBoard(t, b, tcN) {"
O = "color: 'black', opponent: W.name, tc: tcN });"
S = "color: 'black', opponent: w.name, tc: tcR });"
for a in (H, O, S):
    if s.count(a) != 1:
        sys.exit('XATO: kerakli joy aynan 1 marta topilmadi, hech narsa oʻzgarmadi: ' + a[:45])
HELP = r"""function roundDm(uid, oppName, t, tcTxt) {   // 🔔 yangi tur: ilovada bo'lmagan o'yinchiga bot xabari
    try {
      if (!/^\d+$/.test(String(uid)) || connsOf(uid).length) return;
      try { if (!require('./notify.js').allowed(uid, 'arena')) return; } catch (e) {}
      const al = (process.env.TG_APP_LINK || process.env.APP_LINK || '').replace(/\/$/, '') || 'https://t.me/DraughtsPRObot/play';
      tgCall('sendMessage', { chat_id: Number(uid), text: '⚔️ ' + t.name + ' · ' + t.round + '-tur boshlandi!\nRaqibingiz: ' + String(oppName || '').replace(/^🤖\s*/, '').slice(0, 30) + (tcTxt ? '\n⏱ ' + tcTxt : '') + '\nKechiksangiz, texnik mag‘lubiyat berilishi mumkin.', reply_markup: { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: al + '?startapp=lbt_' + t.id }]] } }).catch(() => {});
    } catch (e) {}
  }
  """
s = s.replace(H, HELP + H)
s = s.replace(O, O + "\n    roundDm(b.white, B.name, t, tcN); roundDm(b.black, W.name, t, tcN);")
s = s.replace(S, S + "\n      roundDm(w.uid, b.name, t, tcR); roundDm(b.uid, w.name, t, tcR);")
shutil.copy(F, F + '.before-rounddm')
open(F, 'w', encoding='utf-8').write(s)
r = subprocess.run(['node', '--check', F], capture_output=True, text=True)
if r.returncode != 0:
    shutil.copy(F + '.before-rounddm', F)
    print('SINTAKSIS XATO, orqaga qaytarildi:\n', r.stderr[:600])
    sys.exit(1)
print('TAYYOR: tur xabari qoʻllandi')
