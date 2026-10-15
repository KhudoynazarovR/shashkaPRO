const fs = require("fs");
function R(a, b) {
  let s = fs.readFileSync("roomclient.js", "utf8");
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("XATO: anchor soni =", n, "\n", a.slice(0, 80)); process.exit(1); }
  fs.writeFileSync("roomclient.js", s.replace(a, () => b));
}
R(String.raw`send({ type: "roomMove", roomId: roomId, move: mv, keepTurn: keep });`,
String.raw`send({ type: "roomMove", roomId: roomId, move: mv, keepTurn: keep });
      st.optim = true; st.board = nb; st.selected = null;
      if (keep) { st.forced = { r: mv.to.r, c: mv.to.c }; st.pending = false; } else { st.forced = null; }
      try { render(); } catch (e) {}`);
R(String.raw`function onMessage(m) {`,
String.raw`function onMessage(m) {
      if (m.type === "error" && st.optim) { st.optim = false; st.pending = false; st.forced = null; send({ type: "roomSync", roomId: roomId }); }`);
R(String.raw`if (m.type === "roomState" && m.roomId === roomId) {`,
String.raw`if (m.type === "roomState" && m.roomId === roomId) {
        st.optim = false;`);
console.log("OK");
