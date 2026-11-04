// Bir martalik import: "Lidraughts kombinatsiyalari" papkasi (lidraughts.org rus shashkasi taktik masalalari, 693 ta).
// Har bir yechim ShashkaPRO qoidalari (kkrules) bilan yurishma-yurish tekshirilgan. Murakkablik lidraughts reytingidan: <1500 oson, <2100 o'rta, qolgani qiyin.
module.exports = function (store) {
  if (store.db.pzLidV1) return;
  let data; try { data = require('./lid_import.json'); } catch (e) { console.log('[Import] lid_import.json yo\'q'); return; }
  const NAME = 'Lidraughts kombinatsiyalari';
  const fl = store.db.pzFolders = store.db.pzFolders || []; if (!fl.includes(NAME)) fl.push(NAME);
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  let no = 0; arr.forEach(x => { if (x.folder === NAME && x.no) no = Math.max(no, x.no); });
  const t0 = Date.now(); let add = 0;
  data.sort((a, b) => a.rating - b.rating).forEach((d, i) => {   // osondan qiyinga
    const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
    arr.push({ id: 'l' + d.n.toString(36) + 'd', no: ++no, title: 'Lidraughts #' + d.n, level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + i, folder: NAME, src: 'lidraughts.org' });
    add++;
  });
  store.db.pzLidV1 = 1; store.save();
  console.log('[Import] Lidraughts kombinatsiyalari:', add, 'ta masala qo\'shildi');
};
