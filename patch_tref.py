import sys, shutil, subprocess
def rd(f): return open(f, encoding='utf-8').read()
T, C, L = rd('tlist.js'), rd('lobbyclient.js'), rd('lobby.js')
if 'lbTRef' in L:
    sys.exit('Allaqachon qoʻllangan')
if 'tlShareV1' not in T:
    sys.exit('XATO: avval ulashish patchi (patch_tlist_share.py) qoʻllanishi kerak')
A1 = "var url = base + '?startapp=lbt_' + encodeURIComponent(tid);"
A2 = 'if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; window.__tvLinkTid = linkTid; }'
A3 = 'if (!sent && /^ref_/.test(sp) && S.me && !localStorage.getItem("refSent")) {'
A4 = "case 'lbRef': {"
for src, a, n in ((T, A1, 'tlist.js'), (C, A2, 'lobbyclient.js'), (C, A3, 'lobbyclient.js'), (L, A4, 'lobby.js')):
    if src.count(a) != 1:
        sys.exit('XATO: kerakli joy aynan 1 marta topilmadi (' + n + '): ' + a[:50] + ' — hech narsa oʻzgarmadi')
N1 = "var _tw = window.Telegram && window.Telegram.WebApp, _uid = _tw && _tw.initDataUnsafe && _tw.initDataUnsafe.user && _tw.initDataUnsafe.user.id; var url = base + '?startapp=lbt_' + encodeURIComponent(tid) + (_uid ? '_r' + _uid : '');"
N2 = 'if (/^lbt_/.test(curRoom)) { var _tp = curRoom.slice(4), _rm = _tp.match(/^(.+)_r(\\d{3,15})$/); if (_rm) { _tp = _rm[1]; window.__tRefInv = _rm[2]; } linkTid = _tp; curRoom = ""; window.__tvLinkTid = linkTid; }'
N3 = 'if (window.__tRefInv && S.me && !window.__tRefDone && !localStorage.getItem("tRefSent_" + window.__tRefInv)) { window.__tRefDone = true; localStorage.setItem("tRefSent_" + window.__tRefInv, "1"); sendMsg({ type: "lbTRef", ref: window.__tRefInv }); }\n          ' + A3
N4 = r"""case 'lbTRef': {
        if (!c.lb || !c.lb.tg) break;
        const inv = String(m.ref || '').replace(/[^0-9]/g, '');
        if (!inv || inv === String(me.uid)) break;
        const rj = require('./ref.js').join(me.uid, inv);
        if (rj) { toast(rj.inviter, '👋 Do‘stingiz ' + rj.name + ' qo‘shildi! 3 ta o‘yin o‘ynasa +100 🪙'); push(); break; }
        const st0 = require('./store.js');
        if (!st0.users()[inv]) break;
        const db0 = st0.db, TR = db0.tRef = db0.tRef || { seen: {}, day: '', c: {} };
        const dy = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
        if (TR.day !== dy) { TR.day = dy; TR.c = {}; }
        const kk = inv + ':' + me.uid;
        if (TR.seen[kk] || (TR.c[inv] || 0) >= 50) break;
        TR.seen[kk] = 1; TR.c[inv] = (TR.c[inv] || 0) + 5;
        require('./economy.js').add(inv, 5, 'ref-tour');
        st0.save();
        const msg0 = '🏆 ' + (me.name || 'O‘yinchi') + ' havolangiz orqali turnirga keldi: +5 🪙';
        toast(inv, msg0);
        try { tgCall('sendMessage', { chat_id: Number(inv), text: msg0 }).catch(() => {}); } catch (e) {}
        break;
      }
      """ + A4
T2 = T.replace(A1, N1)
C2 = C.replace(A2, N2).replace(A3, N3)
L2 = L.replace(A4, N4)
files = [('tlist.js', T2), ('lobbyclient.js', C2), ('lobby.js', L2)]
for f, _ in files:
    shutil.copy(f, f + '.before-tref')
for f, txt in files:
    open(f, 'w', encoding='utf-8').write(txt)
bad = None
for f, _ in files:
    r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
    if r.returncode != 0:
        bad = (f, r.stderr[:500]); break
if bad:
    for f, _ in files:
        shutil.copy(f + '.before-tref', f)
    print('SINTAKSIS XATO (' + bad[0] + '), hammasi orqaga qaytarildi:\n' + bad[1])
    sys.exit(1)
print('TAYYOR: taklif +5 qoʻllandi')
