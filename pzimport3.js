// L.V. Petrova "Shag za shagom, bratsy, reshaem kombinatsii" (2000) -> alohida papka
// V2: damkalar qayta aniqlandi. Admin tahrirlagan masalalar saqlanadi, qolganlari yangilanadi.
module.exports = function (store) {
  if (store.db.pzPetrovaV2) return;
  let data; try { data = require('./petrova_import.json'); } catch (e) { console.log('[Import3] petrova_import.json yo\'q'); return; }
  const NAME = 'Petrova: Qadamma-qadam';
  const fl = store.db.pzFolders = store.db.pzFolders || []; if (!fl.includes(NAME)) fl.push(NAME);
  let arr = store.db.puzzles = store.db.puzzles || [];
  const keepSrc = new Set();
  // eski importni olib tashlaymiz (tahrirlanganlarini qoldiramiz)
  store.db.puzzles = arr = arr.filter(x => {
    if (x.folder !== NAME || !/^pv/.test(String(x.id))) return true;
    if (x.edited) { if (x.src) keepSrc.add(x.src); return true; }
    return false;
  });
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  const t0 = Date.now(); let add = 0;
  data.forEach((d, i) => {
    const src = 'Petrova ' + d.src; if (keepSrc.has(src)) return;
    const k = JSON.stringify(d.board) + d.side; if (seen.has(k)) return; seen.add(k);
    arr.push({ id: 'pv' + d.src.replace('.', 'n'), no: 1000 + i, title: 'Petrova 0', level: d.level, side: d.side, board: d.board, sol: d.sols[0], sols: d.sols, at: t0 + i, folder: NAME, src });
    add++;
  });
  // kitob tartibida 1, 2, 3... raqamlash
  const ord = s => { const m = /(\d+)\.(\d+)/.exec(s || ''); return m ? Number(m[1]) * 100 + Number(m[2]) : 99999; };
  arr.filter(x => x.folder === NAME).sort((a, b) => ord(a.src) - ord(b.src)).forEach((x, i) => { x.no = i + 1; if (/^Petrova \d+$/.test(x.title)) x.title = 'Petrova ' + (i + 1); });
  store.db.pzPetrovaV1 = 1; store.db.pzPetrovaV2 = 1; store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
  console.log('[Import3] Petrova V2:', add, 'ta masala, saqlangan tahrirlar:', keepSrc.size);
};
