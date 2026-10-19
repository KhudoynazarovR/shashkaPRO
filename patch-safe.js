const fs = require('fs');
let C = fs.readFileSync('roomclient.js', 'utf8');
const n = (t, x) => t.split(x).length - 1;
const a = "var pool0 = legal.slice().sort(function () { return Math.random() - 0.5; }), st0 = null;";
const b = "function botThink(cb) {";
if (n(C, a) !== 1 || n(C, b) !== 1 || C.includes('safePool(')) { console.log('XATO yoki allaqachon qollangan'); process.exit(1); }
const fn = `function safePool(legal, side) {
      var shuffled = legal.slice().sort(function () { return Math.random() - 0.5; });
      try {
        var b0 = st.board;
        if (!Array.isArray(b0) || !Array.isArray(b0[0])) return shuffled;
        var oppCode = codeOf(side === "white" ? "black" : "white");
        var safe = shuffled.filter(function (mv) {
          try {
            var b = b0.map(function (row) { return row.slice(); });
            var empty = b[mv.to.r][mv.to.c];
            var p = b[mv.from.r][mv.from.c];
            b[mv.from.r][mv.from.c] = empty;
            (mv.captures || []).forEach(function (x) { b[x.r][x.c] = empty; });
            b[mv.to.r][mv.to.c] = p;
            var om = allMoves(b, oppCode);
            return !(om.length && om[0].captures && om[0].captures.length);
          } catch (e) { return true; }
        });
        return safe.length ? safe : shuffled;
      } catch (e) { return shuffled; }
    }
    `;
C = C.replace(b, fn + b);
C = C.replace(a, "var pool0 = safePool(legal, side), st0 = null;");
fs.writeFileSync('roomclient.js', C);
console.log('OK');
