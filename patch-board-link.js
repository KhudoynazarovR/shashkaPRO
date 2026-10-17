// patch-board-link.js — o'yin tugagach "🔍 Tahlil" tugmasi Tahlil taxtasini (board.js, dvigatel bilan) ochadi
// Ishga tushirish:  node patch-board-link.js
// Zaxira: <fayl>.before-boardlink   Qaytarish: cp roomclient.js.before-boardlink roomclient.js (va hokazo)
const fs = require("fs");
const MARK = "spBoardOpen";

// Hamma uch faylga qo'shiladigan yordamchi: board.js ni kerak bo'lsa yuklab, spBoard(g) ni ochadi.
// Taxta ochilmasa, eski ko'rish oynasiga (spAnalyze) qaytadi.
const HELPER = `
;(function () {
  if (window.spBoardOpen) return;
  window.spBoardOpen = function (g) {
    var fallback = function () { if (window.spAnalyze) window.spAnalyze(g); };
    try {
      if (window.spBoard) { window.spBoard(g); return; }
      var s = document.createElement("script");
      s.src = "/board.js?v=" + Date.now();
      s.onload = function () { try { window.spBoard(g); } catch (e) { fallback(); } };
      s.onerror = fallback;
      document.head.appendChild(s);
    } catch (e) { fallback(); }
  };
})();
`;

const targets = [
  { file: "roomclient.js", anchor: "window.spAnalyze({ moves: st.moves" },
  { file: "menu.js", anchor: "window.spAnalyze({" },
  { file: "lobbyclient.js", anchor: "window.spAnalyze({" },
];

// Avval hammasini tekshiramiz, keyin yozamiz (yarim-yarti o'zgarish bo'lmasin)
const plan = [];
for (const t of targets) {
  const src = fs.readFileSync(t.file, "utf8");
  if (src.includes(MARK)) { console.log("⏭  " + t.file + ": allaqachon qo'llangan"); continue; }
  const n = src.split(t.anchor).length - 1;
  if (n !== 1) { console.log("❌ " + t.file + ": '" + t.anchor + "' " + n + " marta uchradi (1 bo'lishi kerak). Hech narsa o'zgarmadi."); process.exit(1); }
  plan.push({ t, src });
}
for (const { t, src } of plan) {
  const out = src.replace(t.anchor, () => t.anchor.replace("spAnalyze", "spBoardOpen")) + HELPER;
  fs.writeFileSync(t.file + ".before-boardlink", src);
  fs.writeFileSync(t.file, out);
  console.log("✅ " + t.file + " yangilandi (zaxira: " + t.file + ".before-boardlink)");
}
console.log(plan.length ? "\nTayyor. Sahifani yangilang (server qayta ishga tushirilmaydi)." : "\nHech narsa qilinmadi.");
