// lobbyclient.js: zalda pozitsiya (Standart / IDF 780) va o'yinlar soni (1 / 1 match / 2 match) tanlovi.
// Ishlatish: node patch-series-client.js   (lobbyclient.js turgan papkada)
const fs = require('fs');
const R = String.raw;
const f = 'lobbyclient.js';
let s = fs.readFileSync(f, 'utf8');
let bad = 0;

function rep(a, b) {
  if (s.includes(b)) { console.log('allaqachon bor'); return; }
  if (s.split(a).length !== 2) { console.log('MOS KELMADI:', JSON.stringify(a.slice(0, 80))); bad++; return; }
  s = s.replace(a, () => b);
}

// 1. Tanlov qatori: pozitsiya va o'yinlar soni
rep(
  R`style=\"flex:1\">⚡ Tezkor o‘yin</button></div>" +`,
  R`style=\"flex:1\">⚡ Tezkor o‘yin</button></div>" +
        "<div class=\"row\"><span class=\"muted\">Pozitsiya:</span><select id=\"lbPos\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select>" +
        "<select id=\"lbGm\" style=\"flex:1\"><option value=\"1\">1 o‘yin</option><option value=\"2\">1 match (2 o‘yin)</option><option value=\"4\">2 match (4 o‘yin)</option></select></div>" +`
);

// 2. Tezkor o'yin va chaqiruv xabarlari
rep(
  R`else sendMsg({ type: "lbQuick", tc: $("lbTc").value });`,
  R`else sendMsg({ type: "lbQuick", tc: $("lbTc").value, pos: $("lbPos").value, games: Number($("lbGm").value) });`
);
rep(
  R`sendMsg({ type: "lbChallenge", toUid: id, tc: $("lbTc").value });`,
  R`sendMsg({ type: "lbChallenge", toUid: id, tc: $("lbTc").value, pos: $("lbPos").value, games: Number($("lbGm").value) });`
);

// 3. Seriyaning keyingi o'yini: hisob ko'rsatilib, avtomatik o'tkaziladi
rep(
  R`if (m.reason === "tournament" || m.reason === "arena") {`,
  R`if (m.reason === "series" && m.series) {
        var stx = "🔁 Seriya: " + m.series.game + "/" + m.series.total + "-o‘yin<br>" + esc(m.series.score) + "<br>Raqib: <b>" + esc(m.opponent) + "</b> (" + (m.color === "white" ? "oq" : "qora") + ")";
        var sleft = 3, st2;
        toast(stx + "<br><span id=\"lbCd\">" + sleft + "</span> soniyadan so‘ng o‘tasiz…", [["Hozir", function () { clearInterval(st2); go(m.roomId); }]], 4000);
        st2 = setInterval(function () {
          sleft--;
          var el2 = $("lbCd"); if (el2) el2.textContent = sleft;
          if (sleft <= 0) { clearInterval(st2); go(m.roomId); }
        }, 1000);
        return;
      }
      if (m.reason === "tournament" || m.reason === "arena") {`
);

if (bad) { console.log('Xato bor, fayl o‘zgartirilmadi'); process.exit(1); }
fs.writeFileSync(f, s);
console.log('Tayyor');
