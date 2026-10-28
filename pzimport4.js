// "Курс шашечных лекций. Книга вторая" -> alohida papkalar (Taktika, Endshpil, ...).
// Pozitsiyalar diagrammalardan avtomatik o'qilgan (damkalar alohida tekshirilgan),
// yechimlar dvigatel / endshpil bazasi bilan topilgan va qoidalar bo'yicha tekshirilgan.
const SETS = [
  { flag: 'pzLektsiyaV1', file: './lektsiya_import.json', name: 'Kurs lektsiyalari 2: Taktika', id: 'lk', t: 'Taktika' },
  { flag: 'pzLektsiyaEndV1', file: './lektsiya_end.json', name: 'Kurs lektsiyalari 2: Endshpil', id: 'le', t: 'Endshpil' },
  { flag: 'pzLektsiyaTahV1', file: './lektsiya_tahlil.json', name: 'Kurs lektsiyalari 2: Tahlil', id: 'lt', t: 'Tahlil' }
];
module.exports = function (store) {
  // V2: sarlavhalar "Taktika 1, 2, 3..." ko'rinishida (avtomatik qayta raqamlash ishlashi uchun)
  if (!store.db.pzLektsiyaRenum1) {
    const arr = store.db.puzzles || []; let ch = 0;
    for (const S of SETS) {
      arr.filter(x => x.folder === S.name).sort((a, b) => (a.no || 0) - (b.no || 0) || (a.at || 0) - (b.at || 0))
        .forEach((x, i) => { const t = S.t + ' ' + (i + 1); if (/ D\.\d+$/.test(x.title || '') || x.title !== t) { if (/ D\.\d+$/.test(x.title || '') || /^(Taktika|Endshpil|Tahlil) \d+$/.test(x.title || '')) { x.title = t; x.no = i + 1; ch++; } } });
    }
    store.db.pzLektsiyaRenum1 = 1; if (ch) store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
    console.log('[Import4] qayta raqamlandi:', ch);
  }
  for (const S of SETS) {
    if (store.db[S.flag]) continue;
    let data; try { data = require(S.file); } catch (e) { console.log('[Import4] yo\'q:', S.file); continue; }
    const fl = store.db.pzFolders = store.db.pzFolders || []; if (!fl.includes(S.name)) fl.push(S.name);
    const arr = store.db.puzzles = store.db.puzzles || [];
    const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
    const t0 = Date.now(); let add = 0;
    data.forEach((d, i) => {
      const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
      arr.push({ id: S.id + d.src, no: i + 1, title: S.t + ' ' + (i + 1), level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + i, folder: S.name, src: 'Kurs lektsiyalari 2, D.' + (d.num || '?') });
      add++;
    });
    store.db[S.flag] = 1; store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
    console.log('[Import4]', S.name + ':', add, 'ta masala');
  }
};
