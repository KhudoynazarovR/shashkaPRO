// Bir martalik import: L.V. Petrova "Shag za shagom, bratsy, reshaem kombinatsii" (2000) -> alohida papka
module.exports = function (store) {
  if (store.db.pzPetrovaV1) return;
  let data; try { data = require('./petrova_import.json'); } catch (e) { console.log('[Import3] petrova_import.json yo\'q'); return; }
  const NAME = 'Petrova: Qadamma-qadam';
  const fl = store.db.pzFolders = store.db.pzFolders || []; if (!fl.includes(NAME)) fl.push(NAME);
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  const t0 = Date.now(); let add = 0, no = 0;
  arr.forEach(x => { if (x.folder === NAME && x.no) no = Math.max(no, x.no); });
  data.forEach((d, i) => {
    const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
    no++;
    arr.push({ id: 'pv' + d.n.toString(36) + 'x', no, title: 'Petrova ' + no, level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + i, folder: NAME, src: 'Petrova ' + d.src });
    add++;
  });
  store.db.pzPetrovaV1 = 1; store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
  console.log('[Import3] Petrova:', add, 'ta masala qo\'shildi');
};
