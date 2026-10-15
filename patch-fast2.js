const fs = require("fs");
function R(a, b) {
  let s = fs.readFileSync("roomclient.js", "utf8");
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("XATO: anchor soni =", n, "\n", a.slice(0, 80)); process.exit(1); }
  fs.writeFileSync("roomclient.js", s.replace(a, () => b));
}
R(String.raw`st.optim = true; st.board = nb; st.selected = null;`,
  String.raw`st.optim = true; st.optN = (st.optN || 0) + 1; try { soundForMove(mv, st.board[mv.from.r] && st.board[mv.from.r][mv.from.c]); } catch (e) {} st.board = nb; st.selected = null;`);
R(String.raw`var _pp = st.board[m.move.from.r] && st.board[m.move.from.r][m.move.from.c];`,
  String.raw`var _own = m.color === st.color && st.optN > 0; if (_own) st.optN--;
        var _pp = st.board[m.move.from.r] && st.board[m.move.from.r][m.move.from.c];`);
R(String.raw`st.board = applyStep(st.board, m.move);`, String.raw`if (!_own) st.board = applyStep(st.board, m.move);`);
R(String.raw`soundForMove(m.move, _pp);`, String.raw`if (!_own) soundForMove(m.move, _pp);`);
R(String.raw`st.forced = computeForced(m.move);`, String.raw`if (!_own) st.forced = computeForced(m.move);`);
R(String.raw`if (m.type === "error" && st.optim) { st.optim = false;`, String.raw`if (m.type === "error" && st.optim) { st.optim = false; st.optN = 0;`);
console.log("OK");
