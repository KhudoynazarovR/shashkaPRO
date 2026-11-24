import sys, shutil, subprocess
F = 'tlist.js'
s = open(F, encoding='utf-8').read()
if 'tlCardV4' in s:
    sys.exit('Allaqachon qoʻllangan')
A1 = None
for c in ['document.head.appendChild(c3);', 'document.head.appendChild(ccss);']:
    if s.count(c) == 1:
        A1 = c
        break
S_MARK = "return '<div class=\"r'"
E2 = "<div class=\"chs\">' + ch + '</div></div>';"
if A1 is None or s.count(S_MARK) != 1 or s.count(E2) != 1:
    sys.exit('XATO: kerakli joy aynan 1 marta topilmadi, hech narsa oʻzgarmadi')
a = s.index(S_MARK)
b = s.index(E2, a) + len(E2)

NEW = r'''var dt = function (ts) { var d = new Date(ts); return f2(d.getDate()) + '.' + f2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + f2(d.getHours()) + ':' + f2(d.getMinutes()); };
    var top0 = ps.filter(function (p) { return p.games > 0 || p.score > 0; })[0] || ps[0];
    var bcl = t.status === 'running' ? 'b-run' : t.status === 'finished' ? 'b-fin' : 'b-reg';
    var btx = t.status === 'running' ? 'O‘ynalmoqda' : t.status === 'finished' ? 'Tugagan' : 'Faol';
    var sbt = t.status === 'running' ? (t.ending ? 'Yakunlanmoqda…' : 'O‘ynalmoqda' + (t.round ? ' · ' + t.round + (t.rounds ? ' / ' + t.rounds : '') + '-tur' : '') + (t.endAt ? ' · tugashiga ' + dur(t.endAt - now) : '')) : t.status === 'finished' ? 'Yakunlandi' + (top0 ? ' · 🥇 ' + esc(String(top0.name || '').replace(/^🤖\s*/, '').slice(0, 18)) : '') : (t.startAt ? (t.startAt > now ? 'Boshlanishiga ' + dur(t.startAt - now) : 'Boshlanmoqda') : 'Ro‘yxat ochiq');
    var R = function (ic, tx) { return '<div class="rw"><i>' + ic + '</i><span>' + tx + '</span></div>'; };
    var fmtTx = (t.pos === 'idf' ? 'IDF 780' : 'Standart') + (t.tc && t.tc !== '∞' && !t.mix ? ' · ' + esc(tcTxt(t.tc)) + (sp[1] ? ' ' + sp[1] : '') : '') + (kind ? ' · ' + kind : '');
    var feat = '';
    if (t.type === 'arena') feat += '<span class="c">' + (t.berserk === false ? '⚡ Berserk yo‘q' : '⚡ Berserk') + '</span>';
    feat += '<span class="c">' + (t.rated === false ? '🤝 Reytingsiz' : '⭐ Reytingli') + '</span>';
    if ((t.clubIds || []).length) feat += '<span class="c">🛡 ' + ((t.clubIds || []).length > 1 ? 'klublar jangi' : 'klub') + '</span>';
    var cta = t.status === 'finished' ? 'Natijalar' : inn ? 'Turnirga kirish' : 'Qatnashaman';
    return '<div class="r' + (inn ? ' me' : '') + scl + '" data-tid="' + esc(t.id) + '"><div class="hd"><span class="i ' + spk + '">' + (t.mix ? '🔀' : t.type === 'arena' ? sp[0] : '🏆') + '</span><b class="nm">' + esc(name) + '</b><span class="bdg ' + bcl + '">' + btx + '</span></div><div class="sbar ' + bcl + '">⏳ ' + sbt + '</div>' + (t.startAt ? R('📅', 'Boshlanish: <b>' + dt(t.startAt) + '</b>') : '') + R('♟', fmtTx) + '<div class="ft">' + feat + '</div>' + R('👥', 'Ishtirokchilar: <b>' + hum + '</b>' + (bots ? ' · 🤖 ' + bots : '') + (empty ? ' · <span class="y">qo‘shiling!</span>' : '')) + (t.prize ? R('🪙', 'Mukofot: <b>' + t.prize + '</b> (' + (t.places || 3) + ' o‘ringa)') : '') + (t.creatorName ? R('👤', 'Yaratuvchi: <b class="cr">' + esc(t.creatorName) + '</b>') : '') + '<div class="btns">' + (t.status === 'finished' ? '' : '<button type="button">👁 Kuzatish</button>') + '<button type="button" class="cta">' + cta + '</button></div></div>';'''

CSS = r'''/*tlCardV4*/
#tlList .r{padding:14px;margin:12px 0;border-radius:20px;background:linear-gradient(160deg,#181e45,#12162f);border:1px solid #2a3160}
#tlList .r::before{display:none}
#tlList .r.me{border-color:rgba(108,192,74,.5)}
#tlList .r .hd{display:flex;align-items:center;gap:12px}
#tlList .r .hd .i{width:46px;height:46px;font-size:25px;border-radius:14px}
#tlList .r .nm{flex:1;min-width:0;font-size:18px;font-weight:800;line-height:1.25;word-break:break-word}
#tlList .r .bdg{font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:10px;white-space:nowrap}
#tlList .r .b-run{background:#143d33;color:#4ee08a}
#tlList .r .b-reg{background:#1d2a5c;color:#8fb0ff}
#tlList .r .b-fin{background:#2a2f4a;color:#9aa0c0}
#tlList .r .sbar{margin:12px 0 6px;padding:10px 12px;border-radius:12px;font-size:14.5px;font-weight:700}
#tlList .r .rw{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:#aab0d6;margin:9px 0;line-height:1.35}
#tlList .r .rw i{font-style:normal;width:22px;text-align:center;flex:none}
#tlList .r .rw b{color:#fff}
#tlList .r .rw b.cr{color:#8fa4ff}
#tlList .r .ft{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 4px 32px}
#tlList .r .btns{display:flex;gap:8px;margin-top:14px}
#tlList .r .btns button{flex:1;border:0;border-radius:14px;height:46px;font-size:15px;font-weight:700;color:#fff;background:rgba(255,255,255,.09)}
#tlList .r .btns .cta{flex:2;background:linear-gradient(90deg,#6366f1,#8b5cf6)}
#tlList .r .btns button:active{filter:brightness(.88);transform:translateY(1px)}
'''
s = s[:a] + NEW + s[b:]
s = s.replace(A1, A1 + "\n  var c4 = document.createElement('style'); c4.textContent = `" + CSS + "`; document.head.appendChild(c4);")
shutil.copy(F, F + '.before-card4')
open(F, 'w', encoding='utf-8').write(s)
r = subprocess.run(['node', '--check', F], capture_output=True, text=True)
if r.returncode != 0:
    shutil.copy(F + '.before-card4', F)
    print('SINTAKSIS XATO, orqaga qaytarildi:\n', r.stderr[:600])
    sys.exit(1)
print('TAYYOR: katta karta qoʻllandi')
