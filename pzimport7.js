// Bir martalik import: v-damki.com (Vadim Kovalenko) masalalaridan bizda yo'q 14 tasi.
// 4 ta o'rta → «Damki · O‘rta», 3 ta qiyin → «Damki · Qiyin» (papka oxiriga), 7 ta etyud → «Etyudlar (v-damki)».
// Yechimlar ShashkaPRO qoidalari (kkrules) bilan tekshirilgan. Ma'lumot: [bo'lim, raqam, tomon, 32 qora katak, [yechimlar], muallif]
const D = [[1,1,"w","b......b..b.b.b.bwbw...w.w.b.www",["635241637254543636143452140567450527276363413052746352747665745647650112655412235443"],""],[1,3,"w","b.b.bbbb.b..wwb.w.w.bwww..ww....",["32211032564734565674544332546756503256455436472525030321214343077441305205160734341201235243"],""],[1,18,"w","...b...bbbb.b..bww..ww.w..ww....",["4332214343615072305272635274564774566745452727050532","4332214343615072305272635274564774566745452727050541","4332214343615072305272635274564774566745452727050550"],""],[1,19,"w","..b.b..........b.wb.......ww...w",["43320514655645547665547656477621472525030330"],""],[2,2,"w","....wb......b.b..b...wb......ww.",["10014361012323454563617063413052726152637452"],""],[2,9,"w","............bbb.b.b.w.....ww.w.w",["72634152634141233412675645676554122354452332453430413423321450321425322325362312364512014554766554760110"],""],[2,17,"w","........bW.........Wb...bw......",["4736617023322143635243613672"],""],[3,1,"w","W.........b......b.........w...w",["01234352235052635072637472362547766574566745"],"Kukuev"],[3,2,"w","....b.......W.....b.w...........",["304145564132566750416776413076213012"],"Shoshin"],[3,3,"w",".b....b...b..w.W..wb.........Bw.",["3627723627452536452747563221566721120321746521306556674527631425635225365263364763743041743047563021"],"Xaryanov"],[3,4,"b","bB......bw........w....w........",["21322341011256470314453414503425122325165061"],""],[3,5,"w","b...........bw....w.............",["453601123627122132103041100141520145526145346172344572362745"],"A. N. Pelya"],[3,6,"w",".......b...b.....w........w.....",["43321625322327366554"],"M. Tolkov"],[3,7,"w","......w.......wb.....b....bw.w..",["67566547342536451405455472615270051647561607"],"S. Kraevskiy"]];
module.exports = function (store) {
  if (store.db.pzVdamkiV1) return;
  const F = { 1: 'Damki · O‘rta', 2: 'Damki · Qiyin', 3: 'Etyudlar (v-damki)' }, LV = { 1: 2, 2: 3, 3: 3 };
  const fl = store.db.pzFolders = store.db.pzFolders || [];
  for (const k of [1, 2, 3]) if (!fl.includes(F[k])) fl.push(F[k]);
  const arr = store.db.puzzles = store.db.puzzles || [];
  const seen = new Set(arr.map(x => JSON.stringify(x.board) + x.side));
  const no = {}; arr.forEach(x => { if (x.no && Object.values(F).includes(x.folder)) no[x.folder] = Math.max(no[x.folder] || 0, x.no); });
  const toBoard = s => { const b = []; let k = 0; for (let r = 0; r < 8; r++) { b.push([]); for (let c = 0; c < 8; c++) b[r].push((r + c) % 2 ? '.wbWB'.indexOf(s.charAt(k++)) : 0); } return b; };
  const toSol = s => { const o = []; for (let i = 0; i + 3 < s.length; i += 4) o.push([+s[i], +s[i + 1], +s[i + 2], +s[i + 3]]); return o; };
  const t0 = Date.now(); let add = 0;
  D.forEach((d, i) => {
    const board = toBoard(d[3]), k = JSON.stringify(board) + d[2]; if (seen.has(k)) return; seen.add(k);
    const folder = F[d[0]], sols = d[4].map(toSol); no[folder] = (no[folder] || 0) + 1;
    arr.push({ id: 'vd' + d[0] + '_' + d[1], no: no[folder], title: (d[0] === 3 ? 'Etyud ' : 'Damki ') + no[folder], level: LV[d[0]], side: d[2], board, sol: sols[0], sols,
      at: t0 + i, folder, src: 'v-damki.com', author: d[5] || 'V. Kovalenko (to‘plam)' });
    add++;
  });
  store.db.pzVdamkiV1 = 1; if (add) store.db.pzVer = (store.db.pzVer || 0) + 1; store.save();
  console.log('[Import] v-damki.com:', add, 'ta masala qo\'shildi');
};
