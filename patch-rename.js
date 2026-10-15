const fs = require('fs');
function rep(src, from, to, name, file) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + file + ' / ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('/api/puzzle/rename')) { console.log('Allaqachon bor'); process.exit(0); }

E = rep(E, `|| p === '/api/puzzle/solved') && req.method === 'POST') {`,
  `|| p === '/api/puzzle/solved' || p === '/api/puzzle/rename') && req.method === 'POST') {`, 'e1', 'economy.js');
E = rep(E, `if (p === '/api/puzzle/del') {`,
`if (p === '/api/puzzle/rename') {
        const pz2 = arr.find(x => x.id === j.id);
        const nt = String(j.title || '').replace(/[<>]/g, '').trim().slice(0, 40);
        if (!pz2 || !nt) return send(res, 400, { error: 'invalid' });
        pz2.title = nt; store.save();
        return send(res, 200, { ok: true, title: nt });
      }
      if (p === '/api/puzzle/del') {`, 'e2', 'economy.js');
E = rep(E, `send(res, 200, { admin: _adm, myId: String(_tg.id),`,
  `send(res, 200, { admin: _adm, link: process.env.TG_APP_LINK || '', myId: String(_tg.id),`, 'e3', 'economy.js');

const CLIENT = [
  [`var ov = null, S = { list: [], solved: [] };`, `var ov = null, pending = null, S = { list: [], solved: [] };`, 'c1'],
  [`S = d; list();`, `S = d; var _pid = pending; pending = null; var _pz = _pid && S.list.filter(function (x) { return x.id === _pid; })[0]; if (_pz) play(_pz); else list();`, 'c2'],
  [`if (S.admin) h += '<button id="pzD"`,
   `if (S.link) h += '<button id="pzS" style="' + BS + '">📤 Yuborish</button>'; if (S.admin) h += '<button id="pzN" style="' + BG + '">✏️ Nomi</button>'; if (S.admin) h += '<button id="pzD"`, 'c3'],
  [`on('#pzR', function () { play(p); });`,
`on('#pzR', function () { play(p); });
      on('#pzS', function () {
        var u = S.link + '?startapp=pz_' + p.id, t = '🧩 Shashka masalasi: ' + p.title;
        var sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t);
        if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
      });
      on('#pzN', function () {
        var n = prompt('Yangi nom:', p.title); if (n === null) return; n = n.trim(); if (!n) return;
        api('/api/puzzle/rename', { id: p.id, title: n }).then(function (d) {
          if (d && d.ok) { p.title = d.title; S.list.forEach(function (x) { if (x.id === p.id) x.title = d.title; }); msg = '✅ Nom o‘zgardi'; }
          else msg = '⚠️ Nom o‘zgarmadi';
          draw();
        });
      });`, 'c4'],
  [`window.spPuzzles = open;`,
`window.spPuzzles = open;
  var _sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (_sp && _sp.indexOf('pz_') === 0) { pending = _sp.slice(3); setTimeout(open, 700); }`, 'c5']
];
let P = fs.readFileSync('puzzles.js', 'utf8');
let M = fs.readFileSync('menu.js', 'utf8');
CLIENT.forEach(x => {
  P = rep(P, x[0], x[1], x[2], 'puzzles.js');
  M = rep(M, x[0], x[1], x[2], 'menu.js');
});
fs.writeFileSync('economy.js', E);
fs.writeFileSync('puzzles.js', P);
fs.writeFileSync('menu.js', M);
console.log('TAYYOR');
