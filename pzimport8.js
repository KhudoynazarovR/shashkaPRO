// С.С. Соминский, «Комбинационные идеи в русских шашках» (1979) -> "Sominskiy: Kombinatsion g'oyalar" papkasi.
// Pozitsiyalar kitob diagrammalaridan avtomatik o'qilgan, har biri King Kong bilan yechilgan:
// majburiy yo'l bilan to'liq yechilganlari va dvigatel dona yutishini tasdiqlaganlari qo'shiladi; yechimi topilmaganlari tashlab ketilgan.
// Raqamlar kitobdagi diagramma raqami bilan bir xil.
const FOLDER = "Sominskiy: Kombinatsion g'oyalar";
module.exports = function (store) {
  if (store.db.pzSominskiyV1) return;
  let data; try { data = require('./sominskiy_import.json'); } catch (e) { console.log('[Import8] yo\'q: sominskiy_import.json'); return; }
  const fl = store.db.pzFolders = store.db.pzFolders || []; if (!fl.includes(FOLDER)) fl.push(FOLDER);
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  const t0 = Date.now(); let add = 0;
  data.forEach((d, i) => {
    const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
    arr.push({ id: 'som' + d.num, no: d.num, title: 'Sominskiy ' + d.num, level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + i, folder: FOLDER, src: 'Sominskiy 1979, №' + d.num });
    add++;
  });
  store.db.pzSominskiyV1 = 1; if (add) store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
  console.log('[Import8] Sominskiy:', add, 'ta masala qo\'shildi');
};
