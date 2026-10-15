const fs = require("fs");
function R(file, a, b) {
  let s = fs.readFileSync(file, "utf8");
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("XATO:", file, "anchor soni =", n, "\n", a.slice(0, 80)); process.exit(1); }
  s = s.replace(a, () => b);
  fs.writeFileSync(file, s);
}
fs.copyFileSync("economy.js", "economy.js.bak31");
fs.copyFileSync("menu.js", "menu.js.bak31");

// ---- server ----
R("economy.js",
String.raw`if (p === '/api/puzzle/folder') {`,
String.raw`if (p === '/api/puzzle/folder') {
      { const _fl = store.db.pzFolders = store.db.pzFolders || [], _nm = String(j.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
      if (j.hideLv) { const _h = store.db.pzHideLv = store.db.pzHideLv || []; const _lv = Number(j.hideLv); if (!_h.includes(_lv)) _h.push(_lv); store.save(); return send(res, 200, { ok: true }); }
      if (j.ren !== undefined) {
        const _nn = String(j.ren || '').replace(/[<>]/g, ' ').trim().slice(0, 30), _k = _fl.indexOf(_nm);
        if (!_nn || _k < 0 || (_nn !== _nm && _fl.includes(_nn))) return send(res, 400, { error: 'invalid' });
        _fl[_k] = _nn; arr.forEach(x => { if (x.folder === _nm) x.folder = _nn; });
        const _st = store.db.pzSettings; if (_st && _st[_nm] !== undefined) { _st[_nn] = _st[_nm]; delete _st[_nm]; }
        store.save(); return send(res, 200, { ok: true, folders: _fl });
      } }`);
R("economy.js",
String.raw`settings: store.db.pzSettings || {}, best:`,
String.raw`settings: store.db.pzSettings || {}, hideLv: store.db.pzHideLv || [], best:`);

// ---- client ----
R("menu.js",
String.raw`var arr = S.list.filter(function (p) { return lvOf(p) === lv && !foOf(p); });`,
String.raw`var arr = S.list.filter(function (p) { return lvOf(p) === lv && !foOf(p); }); if (!arr.length && (S.hideLv || []).indexOf(lv) >= 0) return;`);
R("menu.js",
String.raw`h += '<div data-lv="' + lv + '" style="' + CARD + '"><b style="font-size:17px">📁 ' + LV[lv] + '`,
String.raw`h += '<div data-lv="' + lv + '" style="' + CARD + '">' + (S.admin && !arr.length ? '<button data-hl="' + lv + '" style="float:right;background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">🗑</button>' : '') + '<b style="font-size:17px">📁 ' + LV[lv] + '`);
R("menu.js",
String.raw`h += '<div data-fo="' + i + '" style="' + CARD + '"><b style="font-size:17px">📁 ' + esc(f) + '`,
String.raw`h += '<div data-fo="' + i + '" style="' + CARD + '">' + (S.admin ? '<span style="float:right"><button data-rf="' + i + '" style="background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">✏️</button> <button data-df="' + i + '" style="background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">🗑</button></span>' : '') + '<b style="font-size:17px">📁 ' + esc(f) + '`);
R("menu.js",
String.raw`Array.prototype.forEach.call(ov.querySelectorAll('[data-fo]'), function (e) {`,
String.raw`Array.prototype.forEach.call(ov.querySelectorAll('[data-hl]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var lv = Number(e.getAttribute('data-hl')); if (!confirm('"' + LV[lv] + '" papkasi yashirilsinmi? (Unga masala qo‘shsangiz qayta chiqadi)')) return; api('/api/puzzle/folder', { name: 'x', hideLv: lv }).then(function () { load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-rf]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var f = (S.folders || [])[Number(e.getAttribute('data-rf'))]; var n = cleanName(prompt('Papkaning yangi nomi:', f)); if (!n || n === f) return; api('/api/puzzle/folder', { name: f, ren: n }).then(function () { load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-df]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var f = (S.folders || [])[Number(e.getAttribute('data-df'))]; if (!confirm('"' + f + '" papkasi o‘chirilsinmi? Masalalar saqlanadi.')) return; api('/api/puzzle/folder', { name: f, del: true }).then(function () { load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-fo]'), function (e) {`);
R("menu.js",
String.raw`(curFo ? '<button id="pzDF" style="' + BG + '">`,
String.raw`(curFo ? '<button id="pzRF" style="' + BG + '">✏️ Nomi</button><button id="pzDF" style="' + BG + '">`);
R("menu.js",
String.raw`on('#pzDF', function () {`,
String.raw`on('#pzRF', function () {
      var f = curFo, n = cleanName(prompt('Papkaning yangi nomi:', f)); if (!n || n === f) return;
      api('/api/puzzle/folder', { name: f, ren: n }).then(function () { curFo = n; load(); });
    });
    on('#pzDF', function () {`);
console.log("OK");
