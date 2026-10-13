const fs = require('fs');
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
const ANA = '\n;' + fs.readFileSync('analysis.js', 'utf8') + '\n';

// ---- rooms.js: tugagan o'yinni saqlash
let R = fs.readFileSync('rooms.js', 'utf8');
if (R.includes('u.arch')) { console.log('Allaqachon bor'); process.exit(0); }
R = rep(R, 'if (results.length > 500) results.shift();', `if (results.length > 500) results.shift();
    try {
      const st = require('./store'), us = st.users();
      if (room.moves.length) {
        const g = {
          id: room.id, at: Date.now(), w: room.white && room.white.name, b: room.black && room.black.name,
          win: winner || null, why: room.reason || '', tc: room.tc,
          m: room.moves.map(m => [m.from.r, m.from.c, m.to.r, m.to.c, (m.captures || []).map(x => [x.r, x.c])])
        };
        const ids = new Set([room.white && room.white.uid, room.black && room.black.uid].filter(Boolean).map(String));
        for (const uid of ids) {
          const u = us[uid]; if (!u) continue;
          u.arch = u.arch || []; u.arch.unshift(g); if (u.arch.length > 30) u.arch.length = 30;
        }
        st.save();
      }
    } catch (e) { console.log('Arxiv xatosi:', e.message); }`, 'finish');

// ---- economy.js: /api/archive
let E = fs.readFileSync('economy.js', 'utf8');
E = rep(E, "if (p === '/api/profile' && req.method === 'GET') {", `if (p === '/api/archive' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _u = store.users()[String(_tg.id)] || {};
    send(res, 200, { list: _u.arch || [] });
    return true;
  }
  if (p === '/api/profile' && req.method === 'GET') {`, 'api');

// ---- menu.js: qator, amal, ro'yxat
let M = fs.readFileSync('menu.js', 'utf8');
M = rep(M, '"@live", "#ff4d6d,#ff8fa3"]]],', '"@live", "#ff4d6d,#ff8fa3"],\n      ["📁", "Arxiv", "O‘tgan o‘yinlar tarixi", "@arch", "#2fd27f,#1ea36a"]]],', 'qator');
M = rep(M, 'if (a === "@live") { close(); liveOpen(); return; }', 'if (a === "@live") { close(); liveOpen(); return; }\n    if (a === "@arch") { close(); archOpen(); return; }', 'amal');
M = rep(M, 'window.mnClose = close;', `function archOpen() {
    var old = document.getElementById('mnArch'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'mnArch';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit';
    document.body.appendChild(ov);
    var head = '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>📁 Arxiv</span><button id="mnArX" style="border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff">⬅️</button></div>';
    function shell(body) { ov.innerHTML = head + body; ov.querySelector('#mnArX').onclick = function () { ov.remove(); }; }
    shell('<div style="padding:30px;text-align:center;opacity:.7">Yuklanmoqda…</div>');
    fetch('/api/archive', { headers: { 'x-init-data': initData } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var list = d.list || [];
        if (!list.length) { shell('<div style="padding:30px;text-align:center;opacity:.7">Hozircha tugagan o‘yin yo‘q</div>'); return; }
        var h = '';
        list.forEach(function (g, i) {
          var res = g.win === 'white' ? '🏆 ⚪' : g.win === 'black' ? '🏆 ⚫' : '🤝';
          var dt = new Date(g.at).toLocaleDateString();
          h += '<div data-i="' + i + '" style="background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer"><b>⚪ ' + esc(g.w) + ' — ⚫ ' + esc(g.b) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + res + ' · ' + esc(g.tc || '') + ' · ' + g.m.length + ' yurish · ' + dt + '</div></div>';
        });
        shell(h);
        Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (el) {
          el.onclick = function () {
            var g = list[Number(el.getAttribute('data-i'))];
            window.spAnalyze({
              white: g.w, black: g.b, winner: g.win,
              moves: g.m.map(function (x) { return { from: { r: x[0], c: x[1] }, to: { r: x[2], c: x[3] }, captures: x[4].map(function (y) { return { r: y[0], c: y[1] }; }) }; })
            });
          };
        });
      })
      .catch(function () { shell('<div style="padding:30px;text-align:center">Server bilan aloqa yo‘q</div>'); });
  }
  window.mnClose = close;`, 'panel');
M += ANA;

// ---- roomclient.js: Tahlil tugmasi
let C = fs.readFileSync('roomclient.js', 'utf8');
C = rep(C, 'elResign.style.display = playing ? "" : "none";', `elResign.style.display = playing ? "" : "none";
      var _tb = document.getElementById("rcAn");
      if (!_tb) {
        _tb = document.createElement("button"); _tb.id = "rcAn"; _tb.textContent = "🔍 Tahlil";
        elResign.parentNode.appendChild(_tb);
        _tb.onclick = function () { window.spAnalyze({ moves: st.moves, white: nameLine("white"), black: nameLine("black"), winner: st.winner }); };
      }
      _tb.style.display = (st.finished && st.moves.length) ? "" : "none";`, 'tahlil');
C += ANA;

fs.writeFileSync('rooms.js', R);
fs.writeFileSync('economy.js', E);
fs.writeFileSync('menu.js', M);
fs.writeFileSync('roomclient.js', C);
console.log('TAYYOR');
