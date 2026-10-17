// Bir martalik: "Kombinatsiya N" masalalarini har papkada 1 dan ketma-ket qayta raqamlaydi.
module.exports = function (store) {
  if (store.db.pzRenum1) return;
  const groups = {};
  (store.db.puzzles || []).forEach(x => {
    if (/^Kombinatsiya \d+$/.test(x.title || '')) (groups[x.folder] = groups[x.folder] || []).push(x);
  });
  let n = 0;
  Object.keys(groups).forEach(f => {
    const l = groups[f];
    l.sort((a, b) => parseInt(a.title.slice(13)) - parseInt(b.title.slice(13)) || (a.at || 0) - (b.at || 0));
    l.forEach((x, i) => { x.oldTitle = x.title; x.title = 'Kombinatsiya ' + (i + 1); n++; });
  });
  store.db.pzRenum1 = 1; store.save();
  console.log('[Renum] qayta raqamlandi:', n);
};
