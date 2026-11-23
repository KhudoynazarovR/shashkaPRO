import sys, shutil, subprocess
F = 'lobbyclient.js'
s = open(F, encoding='utf-8').read()

CSS = r'''
.lbtk{background:linear-gradient(160deg,#181e45,#12162f);border:1px solid #2a3160;border-radius:18px;padding:14px;margin:12px 0}
.lbtk.lbta{border-color:#5b4a9e}
.tkh{display:flex;align-items:center;gap:10px;cursor:pointer}
.tki{width:44px;height:44px;border-radius:12px;background:#222a5a;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}
.lbtk.lbta .tki{background:#3a2f6e}
.tkn{flex:1;min-width:0;font-size:17px;font-weight:700;color:#fff;line-height:1.25;word-break:break-word}
.tkn small{display:block;font-size:12px;font-weight:400;color:#8f97c8;margin-top:3px}
.tkb{font-size:12px;padding:5px 10px;border-radius:10px;white-space:nowrap;font-weight:600;background:#1d2a5c;color:#7ea6ff}
.tkb_running{background:#143d33;color:#2ecc71}
.tkb_finished{background:#2a2f4a;color:#9aa0c0}
.tks{margin-top:12px;padding:9px 12px;border-radius:10px;font-size:14px;font-weight:600;background:#1b2350;color:#9fb8ff}
.tks_running{background:#143d33;color:#4ee08a}
.tks_finished{background:#2a2f4a;color:#9aa0c0}
.tkg{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.tkc{font-size:12px;padding:5px 10px;border-radius:8px;background:#1e2552;color:#c3c9ee}
.tkf{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 12px;margin-top:12px;font-size:13px;color:#8f97c8}
.tkf b{color:#fff}
.tkd{color:#aab0d6;font-size:14px;margin:6px 0}
.tkd b{color:#fff}
.lbtk .muted{margin-top:6px}
.lbtk .row{margin-top:12px;gap:8px;flex-wrap:wrap}
.lbtk .row button{flex:1 1 calc(50% - 8px);min-width:110px}
.lbtk .tbody{border:1px solid #2a3160;border-radius:14px;margin-top:12px}
.lbtk table{width:100%;border-collapse:collapse;font-size:14px}
.lbtk th{color:#8087b8;font-size:11px;text-transform:uppercase;text-align:left;padding:9px 8px;background:#1c2250}
.lbtk td{padding:11px 8px;border-top:1px solid #262c58}
.lbtk td:nth-child(3){color:#f5c542;font-weight:700}
'''

NEW = r'''var _bs = t.status === "reg" ? "Ro‘yxat ochiq" : (t.status === "running" ? "O‘ynalmoqda" : "Tugagan");
        var _chips = _ex.map(function (x) { return "<span class=\"tkc\">" + x + "</span>"; }).join("");
        h += "<div class=\"card lbtk " + (arena ? "lbta" : "lbts") + "\" id=\"lbtc_" + esc(t.id) + "\">" +
          "<div class=\"tkh\" onclick=\"lbTog('" + esc(t.id) + "')\"><div class=\"tki\">" + (arena ? "⚔️" : "🏆") + "</div><div class=\"tkn\">" + esc(t.name) + "<small>⏱ " + esc(t.tc) + " · " + (t.pos === "idf" ? "IDF 780" : "♟ Standart") + "</small></div><span class=\"tkb tkb_" + t.status + "\">" + _bs + "</span></div>" +
          (_st0 ? "<div class=\"tks tks_" + t.status + "\">" + _st0 + "</div>" : "") +
          "<div class=\"tkg\">" + _chips + "</div>" +
          "<div class=\"tkf\"><span>👥 Ishtirokchilar: <b>" + t.players.length + "</b></span><span>👤 Yaratuvchi: <b>" + esc(t.creatorName) + "</b></span></div>" +
          "<div class=\"row\">";'''

# 1) CSS bloki
m1 = 'st.id = "tkStyle"; st.textContent = `'
e1 = '`; document.head.appendChild(st)'
if s.count(m1) != 1 or s.count(e1) < 1:
    sys.exit('XATO: CSS bloki topilmadi, hech narsa oʻzgarmadi')
a = s.index(m1) + len(m1)
b = s.index(e1, a)
s = s[:a] + CSS + s[b:]

# 2) holat matnini ajratib saqlash
o2 = 'if (_ex.length) st += (st ? "<br>" : "") + _ex.join(" · ");'
if s.count(o2) != 1:
    sys.exit('XATO: _ex qatori topilmadi, hech narsa oʻzgarmadi')
s = s.replace(o2, 'var _st0 = st; ' + o2)

# 3) karta HTML shabloni
st1 = r'''h += "<div class=\"card lbtk "'''
en1 = r'''</div><div class=\"row\">";'''
if s.count(st1) != 1:
    sys.exit('XATO: shablon boshi topilmadi, hech narsa oʻzgarmadi')
i1 = s.index(st1)
i2 = s.index(en1, i1) + len(en1)
s = s[:i1] + NEW + s[i2:]

shutil.copy(F, F + '.before-tdesign2')
open(F, 'w', encoding='utf-8').write(s)
r = subprocess.run(['node', '--check', F], capture_output=True, text=True)
if r.returncode != 0:
    shutil.copy(F + '.before-tdesign2', F)
    print('SINTAKSIS XATO, orqaga qaytarildi:\n', r.stderr[:600])
else:
    print('TAYYOR: dizayn almashtirildi, sintaksis toʻgʻri')
