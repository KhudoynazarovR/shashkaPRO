// Ikkinchi partiya: to'liq yechimlar -> "Kombinatsiyalar", qisman -> "Kombinatsiyalar 2"
module.exports = function (store) {
  if (store.db.pzCombV2) return;
  let data; try { data = require('./combos_import2.json'); } catch (e) { console.log('[Import2] combos_import2.json yo\'q'); return; }
  const fl = store.db.pzFolders = store.db.pzFolders || [];
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  const t0 = Date.now(); let add = 0, i = 0;
  [['Kombinatsiyalar', data.full || []], ['Kombinatsiyalar 2', data.part || []]].forEach(([NAME, list]) => {
    if (!list.length) return;
    if (!fl.includes(NAME)) fl.push(NAME);
    let no = 0; arr.forEach(x => { if (x.folder === NAME && x.no) no = Math.max(no, x.no); });
    list.forEach(d => {
      const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
      arr.push({ id: 'k' + d.n.toString(36) + 'y', no: ++no, title: 'Kombinatsiya ' + d.n, level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + (i++), folder: NAME });
      add++;
    });
  });
  store.db.pzCombV2 = 1; store.save();
  console.log('[Import2] qo\'shildi:', add);
};
