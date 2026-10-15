const fs = require('fs');
let s = fs.readFileSync('puzimg.js', 'utf8');
if (s.includes('async function pcImgs')) { console.log('Allaqachon bor'); process.exit(0); }
const reps = [
[`function svgBoard(board, side) {`,
`async function pcImgs(sharp) {
  try {
    const it = (require('./store').db.shop || []).find(x => x.def);
    if (!it || !it.imgs) return null;
    const o = {};
    for (const k of ['w', 'b', 'wk', 'bk']) {
      const m = /^data:image\\/(?:png|webp|jpeg);base64,(.+)$/.exec(it.imgs[k] || '');
      if (!m) return null;
      const buf = await sharp(Buffer.from(m[1], 'base64')).resize(68, 68, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      o[k] = 'data:image/png;base64,' + buf.toString('base64');
    }
    return o;
  } catch (e) { return null; }
}
function svgBoard(board, side, IM) {`],
[`'<svg xmlns="http://www.w3.org/2000/svg" width="'`, `'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'`],
[`const w = v === 1 || v === 3, cx = x + S / 2, cy = y + S / 2;`,
`const w = v === 1 || v === 3, cx = x + S / 2, cy = y + S / 2;
      if (IM) { s += '<image xlink:href="' + IM[v === 1 ? 'w' : v === 2 ? 'b' : v === 3 ? 'wk' : 'bk'] + '" x="' + (cx - 34) + '" y="' + (cy - 34) + '" width="68" height="68"/>'; continue; }`],
[`return sharp(Buffer.from(svgBoard(board, side))).png().toBuffer().then(buf => {`,
`return pcImgs(sharp).then(IM => sharp(Buffer.from(svgBoard(board, side, IM))).png().toBuffer().catch(() => sharp(Buffer.from(svgBoard(board, side, null))).png().toBuffer())).then(buf => {`]
];
for (const [a] of reps) {
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log('XATO: ' + a.slice(0, 50) + ' (' + n + ')'); process.exit(1); }
}
for (const [a, b] of reps) s = s.replace(a, () => b);
fs.writeFileSync('puzimg.js', s);
console.log('TAYYOR');
