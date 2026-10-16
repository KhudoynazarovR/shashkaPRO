// Bir martalik tozalash: "Kombinatsiyalar 2" papkasini va undagi masalalarni o'chiradi.
module.exports = function (store) {
  if (store.db.pzCombFix) return;
  const NAME = 'Kombinatsiyalar 2';
  const before = (store.db.puzzles || []).length;
  store.db.puzzles = (store.db.puzzles || []).filter(x => x.folder !== NAME);
  store.db.pzFolders = (store.db.pzFolders || []).filter(x => x !== NAME);
  store.db.pzCombFix = 1; store.save();
  console.log('[Fix] "' + NAME + '" o\'chirildi, masalalar:', before - store.db.puzzles.length);
};
