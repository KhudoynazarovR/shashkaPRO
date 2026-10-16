// Bir martalik import: "Kombinatsiyalar" papkasi. economy.js dan chaqiriladi.
module.exports = function (store) {
  if (store.db.pzCombV1) return;
  let data; try { data = require('./combos_import.json'); } catch (e) { console.log('[Import] combos_import.json yo\'q'); return; }
  const NAME = 'Kombinatsiyalar';
  const fl = store.db.pzFolders = store.db.pzFolders || []; if (!fl.includes(NAME)) fl.push(NAME);
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  let no = 0; arr.forEach(x => { if (x.folder === NAME && x.no) no = Math.max(no, x.no); });
  const t0 = Date.now(); let add = 0;
  data.forEach((d, i) => {
    const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
    arr.push({ id: 'k' + d.n.toString(36) + 'x', no: ++no, title: 'Kombinatsiya ' + d.n, level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + i, folder: NAME });
    add++;
  });
  store.db.pzCombV1 = 1; store.save();
  console.log('[Import] Kombinatsiyalar:', add, 'ta masala qo\'shildi');
};
