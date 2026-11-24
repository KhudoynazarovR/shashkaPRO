import sys, shutil, subprocess
F = 'tlist.js'
s = open(F, encoding='utf-8').read()
if 'tlCardV2' in s:
    sys.exit('Allaqachon qoʻllangan')

A1 = "document.head.appendChild(stl);"
S_MARK = "return '<div class=\"r'"
E_MARK = "<div class=\"w\">' + w + '</div></div>';"
if s.count(A1) != 1 or s.count(S_MARK) != 1:
    sys.exit('XATO: kerakli joy aynan 1 marta topilmadi, hech narsa oʻzgarmadi')
a = s.index(S_MARK)
b = s.find(E_MARK, a)
if b < 0:
    sys.exit('XATO: return qatori oxiri topilmadi, hech narsa oʻzgarmadi')
b += len(E_MARK)

NEW = r'''var spk = t.mix ? 'k-mx' : t.type === 'arena' ? (sp[1] === 'Giper' ? 'k-gp' : sp[1] === 'Bullet' ? 'k-bl' : sp[1] === 'Blits' ? 'k-bz' : sp[1] === 'Tezkor' ? 'k-rp' : 'k-kl') : 'k-tr';
    var scl = t.status === 'running' ? ' s-run' : t.status === 'finished' ? ' s-fin' : '';
    var ch = '';
    if (t.tc && t.tc !== '∞' && !t.mix) ch += '<span class="c">⏱ ' + esc(tcTxt(t.tc)) + (sp[1] ? ' · ' + sp[1] : '') + '</span>';
    if (kind) ch += '<span class="c">' + kind + '</span>';
    ch += empty ? '<span class="c y">Bo‘sh — qo‘shiling!</span>' : '<span class="c">👥 ' + hum + (bots ? ' · 🤖 ' + bots : '') + '</span>';
    if ((t.clubIds || []).length) ch += '<span class="c">🛡 ' + ((t.clubIds || []).length > 1 ? 'klublar jangi' : 'klub') + '</span>';
    if (t.prize) ch += '<span class="c p">🏆 ' + t.prize + '</span>';
    if (inn) ch += '<span class="c y">✓ siz</span>';
    return '<div class="r' + (inn ? ' me' : '') + scl + '" data-tid="' + esc(t.id) + '"><div class="top"><span class="i ' + spk + '">' + (t.mix ? '🔀' : t.type === 'arena' ? sp[0] : '🏆') + '</span><div class="t"><b>' + esc(name) + '</b></div><div class="w">' + w + '</div></div><div class="chs">' + ch + '</div></div>';'''

CSS = r'''/*tlCardV2*/
#tlList .r{display:block;padding:12px;margin:8px 0;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.05);box-shadow:inset 4px 0 0 var(--ac,#5b8def)}
#tlList .r.s-run{--ac:#6cc04a}
#tlList .r.s-fin{--ac:#7b8196}
#tlList .r.me{background:rgba(108,192,74,.1);border-color:rgba(108,192,74,.4)}
#tlList .r .top{display:flex;align-items:flex-start;gap:12px}
#tlList .r .i{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none;background:rgba(255,255,255,.08)}
#tlList .r .i.k-gp,#tlList .r .i.k-mx{background:rgba(170,120,255,.24)}
#tlList .r .i.k-bl{background:rgba(91,141,239,.26)}
#tlList .r .i.k-bz{background:rgba(255,140,60,.24)}
#tlList .r .i.k-rp{background:rgba(108,192,74,.22)}
#tlList .r .i.k-kl{background:rgba(64,200,190,.22)}
#tlList .r .i.k-tr{background:rgba(245,183,43,.22)}
#tlList .r .t{padding-top:2px}
#tlList .r .t b{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3;word-break:break-word}
#tlList .r .w{padding-top:1px}
#tlList .r .chs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
#tlList .r .c{font-size:12.5px;padding:4px 9px;border-radius:8px;background:rgba(255,255,255,.08);color:#d6ccbd}
#tlList .r .c.p{background:rgba(245,183,43,.16);color:#f5b72b}
#tlList .r .c.y{background:rgba(134,239,172,.14);color:#86efac}
'''

s = s[:a] + NEW + s[b:]
s = s.replace(A1, A1 + "\n  var ccss = document.createElement('style'); ccss.textContent = `" + CSS + "`; document.head.appendChild(ccss);")

shutil.copy(F, F + '.before-card2')
open(F, 'w', encoding='utf-8').write(s)
r = subprocess.run(['node', '--check', F], capture_output=True, text=True)
if r.returncode != 0:
    shutil.copy(F + '.before-card2', F)
    print('SINTAKSIS XATO, orqaga qaytarildi:\n', r.stderr[:600])
else:
    print('TAYYOR: turnir kartasi almashtirildi')
