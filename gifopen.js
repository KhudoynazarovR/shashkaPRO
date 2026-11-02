const fs = require("fs");
let BOOK = null;
const book = () => BOOK || (BOOK = JSON.parse(fs.readFileSync(__dirname + "/book.json", "utf8")));
const key = b => { let s = ""; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; s += p === "w" ? "1" : p === "b" ? "-1" : p === "W" ? "2" : p === "B" ? "-2" : "0"; } return s; };
function start() { return Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (r + c) % 2 === 1 ? (r < 3 ? "b" : r > 4 ? "w" : null) : null)); }
const sq = (r, c) => "abcdefgh"[c] + (8 - r);
function line(plies) {
  const B = book(); let b = start();
  const frames = [b], moves = [];
  for (let i = 0; i < plies; i++) {
    const side = i % 2 ? "b" : "w", dr = side === "w" ? -1 : 1, cand = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] === side) for (const dc of [-1, 1]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7 || b[nr][nc]) continue;
      const nb = b.map(x => x.slice()); nb[nr][nc] = side; nb[r][c] = null;
      const e = B[key(nb) + (side === "w" ? "-1" : "1")]; if (e) cand.push({ nb, w: e.n || 1, m: sq(r, c) + "-" + sq(nr, nc) });
    }
    if (!cand.length) break;
    let t = Math.random() * cand.reduce((a, x) => a + x.w, 0), pick = cand[0];
    for (const x of cand) { t -= x.w; if (t <= 0) { pick = x; break; } }
    b = pick.nb; frames.push(b); moves.push(pick.m);
  }
  return { frames, moves };
}
module.exports = { line };
