const fs = require('fs');
function edit(f, reps) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('spPcImg') || s.includes('pcImgs')) { console.log('Allaqachon bor: ' + f); return; }
  for (const [a] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('O‘TKAZILDI: ' + f + ' -> ' + a.slice(0, 45) + ' (' + n + ')'); return; }
  }
  for (const [a, b] of reps) s = s.replace(a, () => b);
  fs.writeFileSync(f, s);
  console.log('TAYYOR: ' + f);
}
const PIECE = `h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (white ? '#9a9a9a' : '#000') + ';background:' + (white ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';`;
const PIECE_NEW = `var _im = window.spPcImg ? window.spPcImg(p) : '';
          if (_im) h += '<div style="width:88%;height:88%;background:url(' + _im + ') center/contain no-repeat;filter:drop-shadow(0 3px 2px #0007)"></div>';
          else ` + PIECE;
const MARK = `window.spAnalyze = function (g) {`;
const HELPER = `(function () {
    if (window.spPcImg) return;
    var ok = {};
    function chk(id) { if (ok[id] !== undefined) return; ok[id] = false; var im = new Image(); im.onload = function () { ok[id] = true; }; im.src = '/api/shop/img?id=' + encodeURIComponent(id) + '&k=w'; }
    window.spPcImg = function (p) {
      var id = window.spEqId !== undefined ? window.spEqId : 'def';
      if (!id) return '';
      chk(id);
      if (!ok[id]) return '';
      return '/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + (p === 1 ? 'w' : p === 2 ? 'b' : p === 3 ? 'wk' : 'bk');
    };
    window.spPcImg(1);
  })();
  ` + MARK;
const EQ = `var eqId = S.equipped === '-' ? '' : (S.equipped || S.def || '');`;
const EQ_NEW = EQ + ` window.spEqId = eqId;`;

edit('menu.js', [[MARK, HELPER], [PIECE, PIECE_NEW], [EQ, EQ_NEW]]);
edit('analysis.js', [[MARK, HELPER], [PIECE, PIECE_NEW]]);
edit('roomclient.js', [[PIECE, PIECE_NEW]]);
edit('shop.js', [[EQ, EQ_NEW]]);

edit('economy.js', [[
  `const _it = (store.db.shop || []).find(x => x.id === _q.get('id'));`,
  `const _it = (store.db.shop || []).find(x => _q.get('id') === 'def' ? !!x.def : x.id === _q.get('id'));`
]]);

edit('puzimg.js', [
  [`function svgBoard(board, side) {`,
`function pcImgs() {
  try {
    const it = (require('./store').db.shop || []).find(x => x.def);
    if (!it || !it.imgs) return null;
    const o = {};
    for (const k of ['w', 'b', 'wk', 'bk']) {
      if (!/^data:image\\/(png|webp|jpeg);base64,/.test(it.imgs[k] || '')) return null;
      o[k] = it.imgs[k];
    }
    return o;
  } catch (e) { return null; }
}
function svgBoard(board, side) {
  const IM = pcImgs();`],
  [`'<svg xmlns="http://www.w3.org/2000/svg" width="'`, `'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'`],
  [`const w = v === 1 || v === 3, cx = x + S / 2, cy = y + S / 2;`,
`const w = v === 1 || v === 3, cx = x + S / 2, cy = y + S / 2;
      if (IM) { s += '<image xlink:href="' + IM[v === 1 ? 'w' : v === 2 ? 'b' : v === 3 ? 'wk' : 'bk'] + '" x="' + (cx - 34) + '" y="' + (cy - 34) + '" width="68" height="68"/>'; continue; }`]
]);
