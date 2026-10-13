const fs = require('fs');
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('/api/puzzles')) { console.log('Allaqachon bor'); process.exit(0); }

E = rep(E, "if (p === '/api/profile' && req.method === 'GET') {", `if (p === '/api/puzzles' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    store.db.puzzles = store.db.puzzles || [];
    const _u = store.users()[String(_tg.id)] || {};
    const _adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
    send(res, 200, { admin: _adm, myId: String(_tg.id), solved: _u.solved || [], list: store.db.puzzles });
    return true;
  }
  if ((p === '/api/puzzle' || p === '/api/puzzle/del' || p === '/api/puzzle/solved') && req.method === 'POST') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    readBody(req, 100000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      const arr = store.db.puzzles = store.db.puzzles || [];
      if (p === '/api/puzzle/solved') {
        const pz = arr.find(x => x.id === j.id);
        if (!pz) return send(res, 404, { error: 'none' });
        const u = store.getOrCreate(_tg);
        u.solved = u.solved || [];
        let gain = 0;
        if (!u.solved.includes(pz.id)) { u.solved.push(pz.id); gain = 5; u.diamonds = (u.diamonds || 0) + gain; store.save(); }
        return send(res, 200, { ok: true, gain });
      }
      const adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
      if (!adm) return send(res, 403, { error: 'admin emassiz' });
      if (p === '/api/puzzle/del') {
        const i = arr.findIndex(x => x.id === j.id);
        if (i >= 0) { arr.splice(i, 1); store.save(); }
        return send(res, 200, { ok: true });
      }
      const b = j.board, sol = j.sol;
      const okB = Array.isArray(b) && b.length === 8 && b.every(r => Array.isArray(r) && r.length === 8 && r.every(v => Number.isInteger(v) && v >= 0 && v <= 4));
      const okS = Array.isArray(sol) && sol.length >= 1 && sol.length <= 60 && sol.every(s => Array.isArray(s) && s.length === 4 && s.every(v => Number.isInteger(v) && v >= 0 && v < 8));
      if (!okB || !okS || (j.side !== 'w' && j.side !== 'b')) return send(res, 400, { error: 'noto‘g‘ri ma‘lumot' });
      const id = 'p' + Date.now().toString(36);
      arr.push({ id, title: String(j.title || 'Masala').replace(/[<>]/g, '').trim().slice(0, 40) || 'Masala', level: [1, 2, 3].includes(j.level) ? j.level : 1, side: j.side, board: b, sol, at: Date.now() });
      store.save();
      send(res, 200, { ok: true, id });
    });
    return true;
  }
  if (p === '/api/profile' && req.method === 'GET') {`, 'economy');

// store.js: masalalar bazadan ham tiklansin
let T = fs.readFileSync('store.js', 'utf8');
T = rep(T, "const remote = (r.rows[0].v && r.rows[0].v.users) || {};",
  "const remote = (r.rows[0].v && r.rows[0].v.users) || {};\n        if (r.rows[0].v && Array.isArray(r.rows[0].v.puzzles)) db.puzzles = r.rows[0].v.puzzles;", 'store');

// menu.js
let M = fs.readFileSync('menu.js', 'utf8');
M = rep(M, '"@arch", "#2fd27f,#1ea36a"]]],', '"@arch", "#2fd27f,#1ea36a"],\n      ["🧩", "Masalalar", "Shashka masalalarini yeching", "@puz", "#f5873b,#f7c02d"]]],', 'qator');
M = rep(M, 'if (a === "@arch") { close(); archOpen(); return; }', 'if (a === "@arch") { close(); archOpen(); return; }\n    if (a === "@puz") { close(); if (window.spPuzzles) window.spPuzzles(); return; }', 'amal');
M += '\n;' + fs.readFileSync('puzzles.js', 'utf8') + '\n';

fs.writeFileSync('economy.js', E);
fs.writeFileSync('store.js', T);
fs.writeFileSync('menu.js', M);
console.log('TAYYOR');
