// patch-pieces.js — menyuga 8 xil dona (va damka) uslubi qo'shadi
// Avval patch-menu.js qo'llangan bo'lishi kerak.
// Ishga tushirish:  node patch-pieces.js
// Zaxira: roomclient.js.before-pieces   Qaytarish: cp roomclient.js.before-pieces roomclient.js
const fs = require("fs");
const FILE = "roomclient.js";
const MARK = "/* rc-pieces-v1 */";

const src = fs.readFileSync(FILE, "utf8");
if (src.includes(MARK)) { console.log("⏭  allaqachon qo'llangan"); process.exit(0); }
if (!src.includes("rc-menu-v1")) { console.log("❌ Avval `node patch-menu.js` ni ishga tushiring."); process.exit(1); }

// ---- 1) Uslublar jadvali va CSS generatori ----
const DEFS = String.raw`${MARK}
      var RCM_PIECES = ["Gambler", "Halqa", "3D disk", "Yog‘och", "Neon", "Oltin-kumush", "Minimal", "Shisha"];
      function rcmCrown(c) {
        return 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27' +
          c.replace("#", "%23") + '%27 d=%27M3 18h18v2H3zM3 7l4.5 4L12 4l4.5 7L21 7l-2 9H5z%27/%3E%3C/svg%3E") center/58% no-repeat';
      }
      function rcmPcCss() {
        var C = "circle closest-side";
        // [oq fon, qora fon, oq qo'shimcha css, qora qo'shimcha css, oq damka qatlami, qora damka qatlami]
        var S = [
          // 1 Gambler: yaltiroq halqali, damkada markaziy nuqta
          ["radial-gradient(" + C + ",#ddd 0 20%,#fff 21% 34%,#c9c9c9 35% 38%,#f4f4f4 39% 62%,#d6d6d6 63% 70%,#fafafa 71%)",
           "radial-gradient(" + C + ",#222 0 20%,#000 21% 34%,#444 35% 38%,#0b0b0b 39% 62%,#333 63% 70%,#000 71%)",
           "border:1px solid #bbb;box-shadow:0 3px 5px rgba(0,0,0,.45),inset 0 -2px 3px rgba(0,0,0,.2)",
           "border:1px solid #000;box-shadow:0 3px 5px rgba(0,0,0,.5),inset 0 -2px 3px rgba(255,255,255,.15)",
           "radial-gradient(" + C + ",#111 0 15%,transparent 16%)", "radial-gradient(" + C + ",#eee 0 15%,transparent 16%)"],
          // 2 Halqa: yassi, konsentrik halqalar, damkada toj
          ["repeating-radial-gradient(" + C + ",#f6f6f6 0 5%,#d9d9d9 5% 7%)",
           "repeating-radial-gradient(" + C + ",#2e2e2e 0 5%,#0c0c0c 5% 7%)",
           "border:2px solid #ececec;box-shadow:0 2px 4px rgba(0,0,0,.35)",
           "border:2px solid #000;box-shadow:0 2px 4px rgba(0,0,0,.45)",
           rcmCrown("#222222"), rcmCrown("#f2f2f2")],
          // 3 3D disk: qalin disk, oltin toj
          ["linear-gradient(#ffffff,#e4e4e4)", "linear-gradient(#444,#000)",
           "border:1px solid #cfcfcf;box-shadow:0 5px 0 #b4b4b4,0 8px 7px rgba(0,0,0,.4)",
           "border:1px solid #333;box-shadow:0 5px 0 #000,0 8px 7px rgba(0,0,0,.5)",
           rcmCrown("#d4a017"), rcmCrown("#d4a017")],
          // 4 Yog'och
          ["radial-gradient(circle at 35% 30%,#f6e3bd,#d9b77a 60%,#b98e50)",
           "radial-gradient(circle at 35% 30%,#7a4a2a,#4a2a14 60%,#2b160a)",
           "border:2px solid #9a7138;box-shadow:inset 0 0 0 4px rgba(120,80,30,.25),0 3px 5px rgba(0,0,0,.4)",
           "border:2px solid #1d0e05;box-shadow:inset 0 0 0 4px rgba(255,220,170,.15),0 3px 5px rgba(0,0,0,.5)",
           rcmCrown("#6b4420"), rcmCrown("#f0c36b")],
          // 5 Neon
          ["radial-gradient(" + C + ",#0b2a33 0 60%,#06161b 100%)", "radial-gradient(" + C + ",#2e0b2a 0 60%,#170515 100%)",
           "border:2px solid #35e0ff;box-shadow:0 0 8px #35e0ff,inset 0 0 8px rgba(53,224,255,.45)",
           "border:2px solid #ff3dcb;box-shadow:0 0 8px #ff3dcb,inset 0 0 8px rgba(255,61,203,.45)",
           rcmCrown("#35e0ff"), rcmCrown("#ff3dcb")],
          // 6 Oltin va kumush (oq = kumush, qora = oltin)
          ["radial-gradient(circle at 35% 30%,#ffffff,#cfd5dc 45%,#8d96a1)", "radial-gradient(circle at 35% 30%,#fff1a8,#e0b32e 45%,#8a6510)",
           "border:2px solid #aab3be;box-shadow:0 3px 5px rgba(0,0,0,.4)",
           "border:2px solid #b8891c;box-shadow:0 3px 5px rgba(0,0,0,.45)",
           rcmCrown("#3a3f46"), rcmCrown("#5a3d06")],
          // 7 Minimal: tekis rang, damkada halqa
          ["linear-gradient(#f2efe6,#f2efe6)", "linear-gradient(#2a2a2a,#2a2a2a)",
           "border:3px solid #d0cbbd", "border:3px solid #111",
           "radial-gradient(" + C + ",transparent 0 28%,#bdb7a6 29% 40%,transparent 41%)",
           "radial-gradient(" + C + ",transparent 0 28%,#777 29% 40%,transparent 41%)"],
          // 8 Shisha
          ["radial-gradient(circle at 30% 25%,rgba(255,255,255,.95) 0 12%,rgba(120,190,255,.8) 40%,rgba(40,110,220,.95))",
           "radial-gradient(circle at 30% 25%,rgba(255,255,255,.9) 0 12%,rgba(255,120,120,.8) 40%,rgba(190,20,40,.95))",
           "border:2px solid rgba(255,255,255,.7);box-shadow:0 3px 6px rgba(0,0,0,.4),inset 0 -4px 8px rgba(0,60,160,.5)",
           "border:2px solid rgba(255,255,255,.6);box-shadow:0 3px 6px rgba(0,0,0,.45),inset 0 -4px 8px rgba(120,0,20,.55)",
           rcmCrown("#ffffff"), rcmCrown("#ffffff")]
        ];
        function imp(str) { return str.split(";").filter(Boolean).map(function (x) { return x + " !important"; }).join(";"); }
        var css = ".pv{border-radius:50%!important}.rcPS .pc{border-radius:50%!important}" +
          ".rcPS .pc::before,.rcPS .pc::after{display:none!important;content:none!important}";
        S.forEach(function (s, i) {
          var n = i + 1;
          var sel = function (side, king) { return ".rcP" + n + " .pc." + side + (king ? ".k" : "") + ",.rcPV" + n + " .pv." + side + (king ? ".k" : ""); };
          [["w", 0, 2, 4], ["b", 1, 3, 5]].forEach(function (d) {
            css += sel(d[0], false) + "{background:" + s[d[1]] + " !important;" + imp(s[d[2]]) + "}";
            css += sel(d[0], true) + "{background:" + s[d[3]] + "," + s[d[1]] + " !important}";
          });
        });
        return css;
      }
      `;

// ---- 2) Menyu qismi: dona tanlash katakchalari ----
const MENU_HTML = String.raw`h += '<div style="margin:18px 0 8px">♟ Toshlar</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
        RCM_PIECES.forEach(function (nm, i) {
          var pv = function (cls) { return '<i class="pv ' + cls + '" style="width:20px;height:20px;display:block"></i>'; };
          h += '<div data-p="' + i + '" title="' + nm + '" class="rcPV' + (i + 1) + '" style="border-radius:10px;background:#26344f;padding:6px 0;display:flex;justify-content:center;border:3px solid ' + (i === rcm.pieces ? "#4c8dff" : "transparent") + '">' +
            '<div style="display:grid;grid-template-columns:repeat(2,20px);gap:4px">' + pv("w") + pv("b") + pv("w k") + pv("b k") + '</div></div>';
        });
        h += '</div><div id="rcmPReset" style="margin:10px 0 0;font-size:13px;opacity:.7;text-decoration:underline">↺ Standart toshlar</div>';
        `;

const HANDLERS = String.raw`Array.prototype.forEach.call(box.querySelectorAll("[data-p]"), function (el) {
          el.onclick = function () { rcm.pieces = +el.getAttribute("data-p"); rcmSave(); rcmApply(); rcmBuild(); };
        });
        var pr = box.querySelector("#rcmPReset");
        if (pr) pr.onclick = function () { rcm.pieces = -1; rcmSave(); rcmApply(); rcmBuild(); };
        `;

const APPLY = String.raw`
        for (var pi = 1; pi <= 8; pi++) root.classList.remove("rcP" + pi);
        root.classList.remove("rcPS");
        if (rcm.pieces >= 0) { root.classList.add("rcP" + (rcm.pieces + 1)); root.classList.add("rcPS"); }`;

const edits = [
  ["sozlama (pieces)", "flat: false, board: -1,", () => "flat: false, board: -1, pieces: -1,"],
  ["uslublar", "var rcmOrigBg = root.style.background;", (a) => DEFS + a],
  ["sinf qo'yish", 'root.classList.toggle("rcFlat", !!rcm.flat);', (a) => a + APPLY],
  ["CSS", "rcmStyle.textContent = css;", () => "css += rcmPcCss(); rcmStyle.textContent = css;"],
  ["menyu katakchalari", "if (rcmCanAbort()) h += '<button id=\"rcmAbort\"", (a) => MENU_HTML + a],
  ["bosish hodisalari", 'var ab = box.querySelector("#rcmAbort");', (a) => HANDLERS + a],
];

let out = src;
for (const [name, anchor, rep] of edits) {
  const n = out.split(anchor).length - 1;
  if (n !== 1) { console.log("❌ '" + name + "' topilmadi yoki " + n + " marta uchradi. Hech narsa o'zgarmadi."); process.exit(1); }
  out = out.replace(anchor, () => rep(anchor));
}
fs.writeFileSync(FILE + ".before-pieces", src);
fs.writeFileSync(FILE, out);
console.log("✅ roomclient.js yangilandi (zaxira: roomclient.js.before-pieces)\nServerni qayta ishga tushirmasdan, sahifani yangilash yetadi.");
