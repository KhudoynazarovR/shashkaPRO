import sys, shutil, subprocess
F = 'tlist.js'
s = open(F, encoding='utf-8').read()
if 'tlCardV5' in s:
    sys.exit('Allaqachon qoʻllangan')
A1 = "document.head.appendChild(c4);"
O1 = r'''(t.status === 'finished' ? '' : '<button type="button">👁 Kuzatish</button>')'''
O2 = r'''(t.startAt > now ? 'Boshlanishiga ' + dur(t.startAt - now) : 'Boshlanmoqda')'''
O3 = r'''(t.startAt ? R('📅', 'Boshlanish: <b>' + dt(t.startAt) + '</b>') : '') + '''
N1 = r'''var name = String(t.name || 'Turnir').replace(/^[^\p{L}\p{N}]+\s*/u, '');'''
for o in (A1, O1, O2, O3):
    if s.count(o) != 1:
        sys.exit('XATO: kerakli joy aynan 1 marta topilmadi (avval katta karta patchi qoʻllanishi kerak), hech narsa oʻzgarmadi')
N2 = r'''(t.startAt > now ? 'Boshlanishiga ' + dur(t.startAt - now) + ' · ' + (dayLbl(t.startAt) || 'Bugun ') + f2(new Date(t.startAt).getHours()) + ':' + f2(new Date(t.startAt).getMinutes()) : 'Boshlanmoqda')'''
CSS = r'''/*tlCardV5*/
#tlList .r{box-shadow:none!important;background:rgba(0,0,0,.38)!important;border-color:rgba(255,255,255,.13)!important}
#tlList .r::before{display:none!important}
#tlList .r .b-reg{background:rgba(91,141,239,.22)!important}
#tlList .r .b-run{background:rgba(76,224,138,.16)!important}
#tlList .r .b-fin{background:rgba(255,255,255,.09)!important}
#tlList .r .rw{margin:7px 0}
#tlList .r .sbar{margin:10px 0 4px;font-size:14px}
'''
s = s.replace(O1, r'''(t.status === 'running' ? '<button type="button">👁 Kuzatish</button>' : '')''')
s = s.replace(O2, N2)
s = s.replace(O3, '')
if 'Extended_Pictographic' not in s and s.count(N1) == 1:
    s = s.replace(N1, N1[:-1] + r".replace(/[\s\p{Extended_Pictographic}\uFE0F]+$/u, '');")
s = s.replace(A1, A1 + "\n  var c5 = document.createElement('style'); c5.textContent = `" + CSS + "`; document.head.appendChild(c5);")
shutil.copy(F, F + '.before-card5')
open(F, 'w', encoding='utf-8').write(s)
r = subprocess.run(['node', '--check', F], capture_output=True, text=True)
if r.returncode != 0:
    shutil.copy(F + '.before-card5', F)
    print('SINTAKSIS XATO, orqaga qaytarildi:\n', r.stderr[:600])
    sys.exit(1)
print('TAYYOR: karta tuzatildi')
