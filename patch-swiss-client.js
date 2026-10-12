// lobbyclient.js ni Lichess uslubidagi Shveytsar uchun yangilaydi.
// Ishlatish: node patch-swiss-client.js   (lobbyclient.js turgan papkada)
const fs = require('fs');
const R = String.raw;
const f = 'lobbyclient.js';
let s = fs.readFileSync(f, 'utf8');
let bad = 0;

function rep(a, b) {
  if (s.includes(b)) { console.log('allaqachon bor'); return; }
  if (s.split(a).length !== 2) { console.log('MOS KELMADI:', JSON.stringify(a.slice(0, 70))); bad++; return; }
  s = s.replace(a, () => b);
}

// 1. Shveytsar sozlamalari qatori (tur, tanaffus, boshlanish)
rep(
  R`<option value=\"idf\">IDF 780</option></select></div>" +`,
  R`<option value=\"idf\">IDF 780</option></select></div>" +
        "<div class=\"row\" id=\"lbSw\" style=\"display:none\"><span class=\"muted\">Turlar:</span><select id=\"lbTr\">" +
        "<option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\" selected>5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option><option value=\"10\">10</option><option value=\"11\">11</option></select>" +
        "<span class=\"muted\">Tanaffus:</span><select id=\"lbTiv\"><option value=\"10\">10 s</option><option value=\"20\" selected>20 s</option><option value=\"60\">1 daq</option><option value=\"120\">2 daq</option><option value=\"300\">5 daq</option></select>" +
        "<select id=\"lbTsin\"><option value=\"0\">qo‘lda boshlash</option><option value=\"2\">2 daq</option><option value=\"5\">5 daq</option><option value=\"10\">10 daq</option><option value=\"30\">30 daq</option></select></div>" +`
);

// 2. Tur tanlanganda tegishli maydonlarni ko'rsatish
rep(
  R`        $("lbTin").style.display = a ? "" : "none";`,
  R`        $("lbTin").style.display = a ? "" : "none";
        $("lbSw").style.display = a ? "none" : "";`
);

// 3. Yaratish xabari
rep(
  R`startIn: Number($("lbTin").value),`,
  R`startIn: Number($($("lbTk").value === "arena" ? "lbTin" : "lbTsin").value), rounds: Number($("lbTr").value), interval: Number($("lbTiv").value),`
);

// 4. Holat matni: turlar soni va boshlanish vaqti
rep(
  R`: (t.status === "reg" ? "Ro‘yxat ochiq" : (t.status === "running" ? t.round + "/" + t.rounds + "-tur" : "Tugagan"));`,
  R`: (t.status === "reg" ? "Ro‘yxat ochiq · " + (t.roundsWanted || "?") + " tur" + (t.startAt ? " · boshlanishi: " + mins(t.startAt - Date.now()) : "") : (t.status === "running" ? t.round + "/" + t.rounds + "-tur" : "Tugagan"));`
);

// 5. Turnir davomida qo'shilish / pauza / qaytish (faqat Shveytsar)
rep(
  R`if (arena && t.status === "running" && !t.ending) {`,
  R`if (!arena && t.status === "running") {
          var meS = t.players.filter(function (p) { return p.uid === me; })[0];
          if (meS && !meS.withdrawn) h += "<button class=\"sec\" data-a=\"tl\" data-id=\"" + t.id + "\">⏸ Pauza</button>";
          else if (meS || t.round <= Math.ceil(t.rounds / 2)) h += "<button data-a=\"tj\" data-id=\"" + t.id + "\">" + (meS ? "Qaytish" : "Qo‘shilish") + "</button>";
        }
        if (arena && t.status === "running" && !t.ending) {`
);

// 6. Keyingi tur sanog'i
rep(
  R`else if (t.nextAt) h += "<span class=\"muted\">Keyingi tur tez orada…</span>";`,
  R`else if (t.nextAt) h += "<span class=\"muted\">Keyingi tur: " + Math.max(0, Math.ceil((t.nextAt - Date.now()) / 1000)) + " s</span>";`
);
rep(R`renderTournaments(); }, 5000);`, R`renderTournaments(); }, 2000);`);

// 7. Jadval: Bux. va SB ustunlari (Shveytsar)
rep(
  R`<th>Ochko</th><th>" + (arena ? "O‘yin" : "Bux.") + "</th></tr>";`,
  R`<th>Ochko</th><th>" + (arena ? "O‘yin" : "SB") + "</th>" + (arena ? "" : "<th>Bux.</th>") + "</tr>";`
);
rep(
  R`"</td><td>" + (arena ? p.games : p.buch) + "</td></tr>";`,
  R`"</td><td>" + (arena ? p.games : p.sb) + "</td>" + (arena ? "" : "<td>" + p.buch + "</td>") + "</tr>";`
);

if (bad) { console.log('Xato bor, fayl o‘zgartirilmadi'); process.exit(1); }
fs.writeFileSync(f, s);
console.log('Tayyor');
