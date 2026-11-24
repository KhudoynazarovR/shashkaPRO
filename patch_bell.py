import sys, shutil, subprocess
def rd(f): return open(f, encoding='utf-8').read()
T, L = rd('tlist.js'), rd('lobby.js')
if 'lbTNotify' in L:
    sys.exit('Allaqachon qoʻllangan')
if 'tlShareV1' not in T:
    sys.exit('XATO: avval ulashish patchi (patch_tlist_share.py) qoʻllanishi kerak')
B1 = """title="Ulashish">📤</button>'"""
B2 = "ls.onclick = function (e) { var sh = e.target.closest('[data-share]');"
B3 = "document.head.appendChild(c6);"
R1 = "if (t.announce) { try { require('./tposter.js').remind(t); } catch (e) {} }"
CASE = None
for c in ("case 'lbTRef': {", "case 'lbRef': {"):
    if L.count(c) == 1:
        CASE = c
        break
for src, a, n in ((T, B1, 'tlist.js'), (T, B2, 'tlist.js'), (T, B3, 'tlist.js'), (L, R1, 'lobby.js')):
    if src.count(a) != 1:
        sys.exit('XATO: kerakli joy aynan 1 marta topilmadi (' + n + '): ' + a[:50] + ' — hech narsa oʻzgarmadi')
if CASE is None:
    sys.exit('XATO: lobby.js da case joyi topilmadi — hech narsa oʻzgarmadi')
NB1 = B1 + r""" + (t.status === 'reg' && t.startAt > Date.now() && !inn ? '<button type="button" class="shr bel' + ((function () { try { return localStorage.getItem('tBell_' + t.id) === '1'; } catch (x) { return false; } })() ? ' on">🔔✓' : '">🔔') + '</button>' : '')"""
NB1 = NB1.replace("""'<button type="button" class="shr bel' +""", """'<button type="button" class="shr bel" data-bell="' + esc(t.id) + '" data-x="' +""", 1)
NB1 = NB1.replace("""? ' on">🔔✓' : '">🔔')""", """? ' on" data-on="1">🔔✓' : '">🔔')""")
NB2 = r"""ls.onclick = function (e) { var bl = e.target.closest('[data-bell]'); if (bl) { var bid = bl.getAttribute('data-bell'), k = 'tBell_' + bid, on = true; try { on = localStorage.getItem(k) !== '1'; if (on) localStorage.setItem(k, '1'); else localStorage.removeItem(k); } catch (x) {} bl.classList.toggle('on', on); bl.textContent = on ? '🔔✓' : '🔔'; if (window.lbSend) window.lbSend({ type: 'lbTNotify', tid: bid, on: on }); return; } var sh = e.target.closest('[data-share]');"""
NB3 = B3 + "\n  var c7 = document.createElement('style'); c7.textContent = '/*tlBellV1*/#tlList .r .btns .bel{flex:0 0 62px;font-size:17px;padding:0}#tlList .r .btns .bel.on{background:rgba(76,224,138,.22);color:#4ee08a}'; document.head.appendChild(c7);"
NR1 = r"""for (const wuid of Object.keys(t.watch || {})) {
        if (!/^\d+$/.test(wuid) || [...t.players.values()].some(p => String(p.uid) === wuid)) continue;
        try { if (!require('./notify.js').allowed(wuid, 'arena')) continue; } catch (e) {}
        const wm = { chat_id: Number(wuid), text: '🔔 ' + title + '\n' + mins + ' daqiqadan keyin boshlanadi!\n⏱ ' + t.tc + (t.prize ? ' · 💰 ' + t.prize : '') + ' · 👥 ' + t.players.size + '\nSiz eslatma yoqgan edingiz 💪' };
        if (url) wm.reply_markup = { inline_keyboard: [[{ text: '▶ Turnirga kirish', url }]] };
        tgCall('sendMessage', wm).catch(() => {});
      }
      """ + R1
NCASE = r"""case 'lbTNotify': {
        if (!c.lb || !c.lb.tg) { toast(me.uid, 'Eslatma uchun Telegram orqali kiring'); break; }
        const tn = tournaments.get(String(m.tid));
        if (!tn || tn.status !== 'reg' || !tn.startAt || tn.startAt <= Date.now()) { toast(me.uid, 'Bu turnir uchun eslatma kerak emas'); break; }
        tn.watch = tn.watch || {};
        if (m.on === false) { delete tn.watch[String(me.uid)]; toast(me.uid, '🔕 Eslatma o‘chirildi'); break; }
        if (Object.keys(tn.watch).length >= 3000) break;
        tn.watch[String(me.uid)] = 1;
        toast(me.uid, '🔔 Eslatma yoqildi: turnirdan 15 daqiqa oldin xabar beramiz');
        break;
      }
      """ + CASE
T2 = T.replace(B1, NB1).replace(B2, NB2).replace(B3, NB3)
L2 = L.replace(R1, NR1).replace(CASE, NCASE)
files = [('tlist.js', T2), ('lobby.js', L2)]
for f, _ in files:
    shutil.copy(f, f + '.before-bell')
for f, txt in files:
    open(f, 'w', encoding='utf-8').write(txt)
bad = None
for f, _ in files:
    r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
    if r.returncode != 0:
        bad = (f, r.stderr[:500]); break
if bad:
    for f, _ in files:
        shutil.copy(f + '.before-bell', f)
    print('SINTAKSIS XATO (' + bad[0] + '), hammasi orqaga qaytarildi:\n' + bad[1])
    sys.exit(1)
print('TAYYOR: eslatma tugmasi qoʻllandi')
