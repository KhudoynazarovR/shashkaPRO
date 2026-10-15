ec = open("economy.js", encoding="utf-8").read()
pz = open("puzzles.js", encoding="utf-8").read()

# ---------- SERVER ----------
E = {
 "route": "|| p === '/api/puzzle/rename') && req.method === 'POST')",
 "del": "if (p === '/api/puzzle/del') {",
 "id": "const id = 'p' + Date.now().toString(36);",
 "push": "side: j.side, board: b, sol, sols: _sols, at: Date.now() });",
 "get": "send(res, 200, { admin: _adm, link: process.env.TG_APP_LINK || '', myId:",
}
for k, a in E.items():
    if ec.count(a) != 1:
        raise SystemExit("economy.js anchor topilmadi (%s): %d" % (k, ec.count(a)))
if "/api/puzzle/folder" in ec:
    raise SystemExit("economy.js allaqachon qo'llangan")

ec = ec.replace(E["route"], "|| p === '/api/puzzle/rename' || p === '/api/puzzle/folder' || p === '/api/puzzle/move') && req.method === 'POST')", 1)

handlers = r'''if (p === '/api/puzzle/folder') {
        const fl = store.db.pzFolders = store.db.pzFolders || [];
        const nm = String(j.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
        if (!nm) return send(res, 400, { error: 'invalid' });
        if (j.del) {
          const k = fl.indexOf(nm); if (k >= 0) fl.splice(k, 1);
          arr.forEach(x => { if (x.folder === nm) delete x.folder; });
        } else if (!fl.includes(nm)) {
          if (fl.length >= 30) return send(res, 400, { error: 'ko‘p papka' });
          fl.push(nm);
        }
        store.save();
        return send(res, 200, { ok: true, folders: fl });
      }
      if (p === '/api/puzzle/move') {
        const fl = store.db.pzFolders = store.db.pzFolders || [];
        const pzm = arr.find(x => x.id === j.id);
        const nf = String(j.folder || '').replace(/[<>]/g, '').trim().slice(0, 30);
        if (!pzm) return send(res, 404, { error: 'none' });
        if (nf && !fl.includes(nf)) return send(res, 400, { error: 'papka yo‘q' });
        if (nf) pzm.folder = nf; else delete pzm.folder;
        store.save();
        return send(res, 200, { ok: true });
      }
      '''
ec = ec.replace(E["del"], handlers + E["del"], 1)
ec = ec.replace(E["id"], E["id"] + " const _fn = String(j.folder || '').replace(/[<>]/g, '').trim().slice(0, 30), _fo = (store.db.pzFolders || []).includes(_fn) ? _fn : undefined;", 1)
ec = ec.replace(E["push"], "side: j.side, board: b, sol, sols: _sols, at: Date.now(), folder: _fo });", 1)
ec = ec.replace(E["get"], "send(res, 200, { folders: store.db.pzFolders || [], admin: _adm, link: process.env.TG_APP_LINK || '', myId:", 1)

# ---------- CLIENT ----------
C1 = "title = '', level = 1, mode = 'edit'"
C2 = "api('/api/puzzle', { title: title || 'Masala', level: level, side: side,"
C3 = "function close() {"
for k, a in (("editor", C1), ("save", C2), ("close", C3), ("yechish", "// ---- yechish")):
    if pz.count(a) != 1:
        raise SystemExit("puzzles.js anchor topilmadi (%s): %d" % (k, pz.count(a)))
if "pzNF" in pz:
    raise SystemExit("puzzles.js allaqachon qo'llangan")
i = pz.find("var curLv = 0;")
if i < 0:
    i = pz.find("function list() {")
j = pz.find("// ---- yechish")
if i < 0 or j <= i or j - i > 8000:
    raise SystemExit("list() bloki topilmadi")

NEW = r'''var curLv = 0, curFo = '', edLv = 0, edFolder = '';
  var CARD = 'text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer';
  function lvOf(p) { return [1, 2, 3].indexOf(p.level) >= 0 ? p.level : 1; }
  function foOf(p) { return (p.folder && (S.folders || []).indexOf(p.folder) >= 0) ? p.folder : ''; }
  function nDone(arr) { return arr.filter(function (p) { return (S.solved || []).indexOf(p.id) >= 0; }).length; }
  function cleanName(t) { return String(t || '').replace(/[<>]/g, '').trim().slice(0, 30); }
  function newPz(lv, fo) { edLv = lv || 0; edFolder = fo || ''; editor(); }
  function topBtns() { return '<button id="pzTop" style="' + BG + '">🏆 TOP</button>' + (S.admin ? '<button id="pzNew" style="' + BS + '">➕ Yangi</button>' : ''); }
  function moveDlg(p) {
    var fl = S.folders || [];
    var t = prompt('Papka nomi (bo‘sh qoldirsangiz papkadan chiqariladi).\nMavjud: ' + (fl.join(', ') || 'yo‘q'), foOf(p));
    if (t === null) return;
    t = cleanName(t);
    var go = function () { api('/api/puzzle/move', { id: p.id, folder: t }).then(function () { load(); }); };
    if (t && fl.indexOf(t) < 0) api('/api/puzzle/folder', { name: t }).then(go); else go();
  }
  function list() {
    if (curFo && (S.folders || []).indexOf(curFo) < 0) curFo = '';
    if (curLv || curFo) return items();
    var fl = S.folders || [], h = head('🧩 Masalalar', topBtns());
    if (S.admin) h += '<div style="margin-bottom:10px"><button id="pzNF" style="' + BG + '">📁 Yangi papka</button></div>';
    if (!S.list.length && !fl.length) h += '<div style="padding:30px;opacity:.7">Hozircha masala yo‘q</div>';
    [1, 2, 3].forEach(function (lv) {
      var arr = S.list.filter(function (p) { return lvOf(p) === lv && !foOf(p); });
      h += '<div data-lv="' + lv + '" style="' + CARD + '"><b style="font-size:17px">📁 ' + LV[lv] + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + arr.length + ' ta masala · ✅ ' + nDone(arr) + '/' + arr.length + '</div></div>';
    });
    fl.forEach(function (f, i) {
      var arr = S.list.filter(function (p) { return foOf(p) === f; });
      h += '<div data-fo="' + i + '" style="' + CARD + '"><b style="font-size:17px">📁 ' + esc(f) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + arr.length + ' ta masala · ✅ ' + nDone(arr) + '/' + arr.length + '</div></div>';
    });
    if (!S.admin) h += '<div style="font-size:11px;opacity:.4;margin-top:16px">ID: ' + esc(S.myId) + '</div>';
    ov.innerHTML = h;
    on('#pzBack', close); on('#pzTop', pzTop); on('#pzNew', function () { newPz(0, ''); });
    on('#pzNF', function () {
      var n = cleanName(prompt('Yangi papka nomi:'));
      if (!n) return;
      api('/api/puzzle/folder', { name: n }).then(function () { load(); });
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-lv]'), function (e) {
      e.onclick = function () { curLv = Number(e.getAttribute('data-lv')); curFo = ''; list(); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-fo]'), function (e) {
      e.onclick = function () { curFo = (S.folders || [])[Number(e.getAttribute('data-fo'))] || ''; curLv = 0; list(); };
    });
  }
  function items() {
    var h = head('🧩 Masalalar', '<button id="pzTop" style="' + BG + '">🏆 TOP</button>'), shown = 0;
    h += '<div style="margin:6px 0 12px;font-weight:bold">' + (curLv ? LV[curLv] : '📁 ' + esc(curFo)) + '</div>';
    if (S.admin) h += '<div style="margin-bottom:12px"><button id="pzAdd" style="' + BS + '">➕ Masala</button>' + (curFo ? '<button id="pzDF" style="' + BG + '">🗑 Papkani o‘chirish</button>' : '') + '</div>';
    S.list.forEach(function (p, i) {
      if (curLv ? (lvOf(p) !== curLv || foOf(p)) : foOf(p) !== curFo) return;
      shown++;
      var ok = (S.solved || []).indexOf(p.id) >= 0;
      h += '<div data-i="' + i + '" style="' + CARD + '">' + (S.admin ? '<button data-mv="' + i + '" style="float:right;background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">📁</button>' : '') + '<b>' + (ok ? '✅ ' : '') + esc(p.title) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + LV[lvOf(p)] + ' · 👥 ' + (p.cnt || 0) + ' · ' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + '</div></div>';
    });
    if (!shown) h += '<div style="padding:24px;opacity:.7">Bu papkada masala yo‘q</div>';
    ov.innerHTML = h;
    on('#pzBack', function () { curLv = 0; curFo = ''; list(); });
    on('#pzTop', pzTop);
    on('#pzAdd', function () { newPz(curLv, curLv ? '' : curFo); });
    on('#pzDF', function () {
      var f = curFo;
      if (!confirm('"' + f + '" papkasi o‘chirilsinmi? Masalalar saqlanadi.')) return;
      api('/api/puzzle/folder', { name: f, del: true }).then(function () { curFo = ''; load(); });
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (e) {
      e.onclick = function () { play(S.list[Number(e.getAttribute('data-i'))]); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-mv]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); moveDlg(S.list[Number(e.getAttribute('data-mv'))]); };
    });
  }

  '''
pz = pz[:i] + NEW + pz[j:]
pz = pz.replace(C1, "title = '', level = (edLv || 1), mode = 'edit'", 1)
pz = pz.replace(C2, "api('/api/puzzle', { folder: edFolder, title: title || 'Masala', level: level, side: side,", 1)
pz = pz.replace(C3, "function close() { curLv = 0; curFo = '';", 1)

open("economy.js", "w", encoding="utf-8").write(ec)
open("puzzles.js", "w", encoding="utf-8").write(pz)
print("OK")
