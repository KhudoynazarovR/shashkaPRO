import sys, shutil, subprocess
F = 'tlist.js'
s = open(F, encoding='utf-8').read()
if 'tlShareV1' in s:
    sys.exit('Allaqachon qoʻllangan')
A_BTN = r"""'<div class="btns">' + (t.status === 'running'"""
A_CLICK = r"""ls.onclick = function (e) { var r = e.target.closest('[data-tid]');"""
A_CSS = "document.head.appendChild(c5);"
for a in (A_BTN, A_CLICK, A_CSS):
    if s.count(a) != 1:
        sys.exit('XATO: kerakli joy aynan 1 marta topilmadi, hech narsa oʻzgarmadi: ' + a[:40])
N_BTN = r"""'<div class="btns"><button type="button" class="shr" data-share="' + esc(t.id) + '" title="Ulashish">📤</button>' + (t.status === 'running'"""
N_CLICK = r"""ls.onclick = function (e) { var sh = e.target.closest('[data-share]'); if (sh) { var rr = sh.closest('[data-tid]'); var tid = sh.getAttribute('data-share'); var nm = ((rr && rr.querySelector('.nm')) || {}).textContent || 'Turnir'; var sb = ((rr && rr.querySelector('.sbar')) || {}).textContent || ''; var base = window.TG_APP_LINK || 'https://t.me/DraughtsPRObot/play'; var url = base + '?startapp=lbt_' + encodeURIComponent(tid); var txt = '🏆 ' + nm + '\n' + sb.replace('⏳', '').trim() + '\nShashkaPRO turniriga qo‘shiling!'; var su = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(txt); try { var tgw = window.Telegram && window.Telegram.WebApp; if (tgw && tgw.openTelegramLink) tgw.openTelegramLink(su); else window.open(su, '_blank'); } catch (x) { window.open(su, '_blank'); } return; } var r = e.target.closest('[data-tid]');"""
N_CSS = A_CSS + "\n  var c6 = document.createElement('style'); c6.textContent = '/*tlShareV1*/#tlList .r .btns .shr{flex:0 0 52px;font-size:19px;padding:0}'; document.head.appendChild(c6);"
s = s.replace(A_BTN, N_BTN).replace(A_CLICK, N_CLICK).replace(A_CSS, N_CSS)
shutil.copy(F, F + '.before-share')
open(F, 'w', encoding='utf-8').write(s)
r = subprocess.run(['node', '--check', F], capture_output=True, text=True)
if r.returncode != 0:
    shutil.copy(F + '.before-share', F)
    print('SINTAKSIS XATO, orqaga qaytarildi:\n', r.stderr[:600])
    sys.exit(1)
print('TAYYOR: ulashish tugmasi qoʻllandi')
