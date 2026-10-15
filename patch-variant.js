const fs = require('fs');
function rep(src, from, to, name, file) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + file + ' / ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}

const SERVER = [
  [`const b = j.board, sol = j.sol;`,
   `const b = j.board; const _sols = Array.isArray(j.sols) ? j.sols.slice(0, 10) : [j.sol]; const sol = _sols[0];`, 's1'],
  [`const okS = Array.isArray(sol) && sol.length >= 1 && sol.length <= 60 && sol.every(s => Array.isArray(s) && s.length === 4 && s.every(v => Number.isInteger(v) && v >= 0 && v < 8));`,
   `const okS = _sols.length >= 1 && _sols.every(sl => Array.isArray(sl) && sl.length >= 1 && sl.length <= 60 && sl.every(s => Array.isArray(s) && s.length === 4 && s.every(v => Number.isInteger(v) && v >= 0 && v < 8)));`, 's2'],
  [`board: b, sol, at: Date.now()`, `board: b, sol, sols: _sols, at: Date.now()`, 's3']
];

const CLIENT = [
  [`var g = { b: copy(p.board), side: p.side, forced: null }, idx = 0, sel = null, msg = '', done = false, busy = false;`,
`p = Object.assign({}, p);
    var lines = (p.sols && p.sols.length) ? p.sols : [p.sol], alive = lines.map(function (_, i) { return i; });
    p.sol = lines[0];
    var g = { b: copy(p.board), side: p.side, forced: null }, idx = 0, sel = null, msg = '', done = false, busy = false;
    function same(x, y) { return x && y && x[0] === y[0] && x[1] === y[1] && x[2] === y[2] && x[3] === y[3]; }
    function pick(st) {
      var m = null, keep = [], want = [st.f[0], st.f[1], st.t[0], st.t[1]];
      alive.forEach(function (i) { var x = lines[i][idx]; if (same(x, want)) { keep.push(i); m = x; } });
      if (keep.length) {
        alive = keep;
        var fin = keep.filter(function (i) { return lines[i].length === idx + 1; });
        p.sol = lines[fin.length ? fin[0] : keep[0]];
      }
      return m;
    }
    function oppPick() {
      var c = alive.filter(function (i) { return lines[i][idx]; });
      if (!c.length) return p.sol[idx];
      var x = lines[c[Math.floor(Math.random() * c.length)]][idx];
      alive = c.filter(function (j) { return same(lines[j][idx], x); });
      p.sol = lines[alive[0]];
      return x;
    }`, 'c1'],
  [`var w = p.sol[idx];`, `var w = pick(st);`, 'c2'],
  [`var w = p.sol[idx], st =`, `var w = oppPick(), st =`, 'c3'],
  [`var b = blank(), tool = 1, side = 'w', title = '', level = 1, mode = 'edit', g = null, hist = [], rec = [], recSides = [], sel = null, b0 = null, msg = '';`,
   `var b = blank(), tool = 1, side = 'w', title = '', level = 1, mode = 'edit', g = null, hist = [], rec = [], recSides = [], sel = null, b0 = null, msg = '', extra = [];`, 'c4'],
  [`<button id="pzSv" style="' + BS + '">💾 Saqlash</button>`,
   `<button id="pzVar" style="' + BG + '">➕ Variant</button><button id="pzSv" style="' + BS + '">💾 Saqlash</button>`, 'c5'],
  [`on('#pzSv', save);`, `on('#pzVar', addVar); on('#pzSv', save);`, 'c6'],
  [`if (!rec.length) { msg = 'Avval yechim yurishlarini kiriting'; return draw(); }`,
   `if (!rec.length && !extra.length) { msg = 'Avval yechim yurishlarini kiriting'; return draw(); }`, 'c7'],
  [`if (recSides[recSides.length - 1] !== side || g.forced) {`,
   `if (rec.length && (recSides[recSides.length - 1] !== side || g.forced)) {`, 'c8'],
  [`board: b0, sol: rec }`,
   `board: b0, sol: (extra.length ? extra[0] : rec), sols: (rec.length ? extra.concat([rec]) : extra) }`, 'c9'],
  [`mode = 'rec'; draw();`, `extra = []; mode = 'rec'; draw();`, 'c10'],
  [`function recTap(r, c) {`,
`function addVar() {
      if (!rec.length) { msg = 'Avval yurishlarni kiriting'; return draw(); }
      if (recSides[recSides.length - 1] !== side || g.forced) { msg = '⚠️ Variant yechuvchi yurishi bilan tugashi kerak'; return draw(); }
      extra.push(rec.slice());
      g = { b: copy(b0), side: side, forced: null }; hist = [g]; rec = []; recSides = []; sel = null;
      msg = '✅ ' + extra.length + '-variant saqlandi. Endi ' + (extra.length + 1) + '-variantni kiriting';
      draw();
    }
    function recTap(r, c) {`, 'c11']
];

let E = fs.readFileSync('economy.js', 'utf8');
if (E.includes('_sols')) { console.log('Allaqachon bor'); process.exit(0); }
SERVER.forEach(x => { E = rep(E, x[0], x[1], x[2], 'economy.js'); });
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
