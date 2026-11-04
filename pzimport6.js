// Bir martalik import: 64.damki.net masalalari (rus shashkasi) — 1927 ta, 4 papka: Oson / O‘rta / Qiyin (yutish) va Durang.
// Har bir yechim ShashkaPRO qoidalari (kkrules) bilan yurishma-yurish tekshirilgan; yechimi yo'q yoki pozitsiyaga mos kelmaganlari olinmagan.
// dk_import.json: [raqam, daraja 1–3, 'w' yutish | 'd' durang, 32 qora katak ('.wbWB'), yechim (har qadam 4 raqam: fr fc tr tc), muallif]
const fs = require('fs'), path = require('path');
module.exports = function (store) {
  if (store.db.pzDamkiV1) return;
  let data; try { data = JSON.parse(fs.readFileSync(path.join(__dirname, 'dk_import.json'), 'utf8')); } catch (e) { console.log('[Import] dk_import.json yo\'q'); return; }
  const F = { 1: 'Damki · Oson', 2: 'Damki · O‘rta', 3: 'Damki · Qiyin', d: 'Damki · Durang' };
  const fl = store.db.pzFolders = store.db.pzFolders || [];
  for (const k of [1, 2, 3, 'd']) if (!fl.includes(F[k])) fl.push(F[k]);
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  const no = {}; arr.forEach(x => { if (x.no && Object.values(F).includes(x.folder)) no[x.folder] = Math.max(no[x.folder] || 0, x.no); });
  const toBoard = s => { const b = []; let k = 0; for (let r = 0; r < 8; r++) { b.push([]); for (let c = 0; c < 8; c++) b[r].push((r + c) % 2 ? '.wbWB'.indexOf(s.charAt(k++)) : 0); } return b; };
  const toSol = s => { const o = []; for (let i = 0; i + 3 < s.length; i += 4) o.push([+s[i], +s[i + 1], +s[i + 2], +s[i + 3]]); return o; };
  // har papkada osondan qiyinga: daraja, keyin yechim uzunligi
  data.sort((a, b) => a[1] - b[1] || a[4].length - b[4].length || a[0] - b[0]);
  const t0 = Date.now(); let add = 0;
  data.forEach((d, i) => {
    const board = toBoard(d[3]), k = JSON.stringify(board) + 'w'; if (seen.has(k)) return; seen.add(k);
    const folder = d[2] === 'd' ? F.d : F[d[1]] || F[2], sol = toSol(d[4]);
    arr.push({ id: 'dk' + d[0].toString(36), no: (no[folder] = (no[folder] || 0) + 1), title: (d[2] === 'd' ? '🤝 Durang · ' : '') + 'Damki #' + d[0] + (d[5] ? ' · ' + d[5] : ''),
      level: d[1], side: 'w', board, sol, sols: [sol], at: t0 + i, folder, src: '64.damki.net', author: d[5] || '', goal: d[2] === 'd' ? 'draw' : 'win' });
    add++;
  });
  store.db.pzDamkiV1 = 1; if (add) store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
  console.log('[Import] 64.damki.net:', add, 'ta masala qo\'shildi');
};
