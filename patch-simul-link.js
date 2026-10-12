// Sians (simul) kartasiga 🔗 Havola qo'shadi va havola orqali kirishni yoqadi.
// Ishlatish: node patch-simul-link.js   (loyiha papkasida; patch-simul.js dan KEYIN bajaring)
// Havola: startapp=lbs_<sians_id>  yoki  ?s=<sians_id>
const fs = require('fs');
const R = String.raw;

const plan = {
  'roomclient.js': [
    [R`if (/^lbt_/.test(roomId)) return;`,
     R`if (/^lb[ts]_/.test(roomId)) return;`],
  ],
  'lobbyclient.js': [
    // havola parametri
    [R`var inRoom = ROOM_RE.test(curRoom);`,
     R`var linkSid = "";
    if (/^lbs_/.test(curRoom)) { linkSid = curRoom.slice(4); curRoom = ""; }
    else if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("s") || "")) linkSid = q.get("s");
    var inRoom = ROOM_RE.test(curRoom);`],
    // holat kelganda sianslarni ochish
    [R`if (linkTid && !inRoom) openLinkedTournament();`,
     R`if (linkTid && !inRoom) openLinkedTournament();
        if (linkSid && !inRoom) openLinkedSimul();`],
    // funksiyalar
    [R`function shareLink(tid, name) {`,
     R`function openLinkedSimul() {
      var sid = linkSid; linkSid = "";
      curTab = "s";
      openPanel();
      var found = (S.simuls || []).some(function (s) { return String(s.id) === sid; });
      if (!found) { toast("⚠️ Bu sians topilmadi yoki yopilgan", null, 5000); return; }
      var el = $("lbsc_" + sid);
      if (el) {
        try { el.scrollIntoView({ block: "center" }); } catch (e) {}
        el.style.outline = "2px solid #2b7cff";
        setTimeout(function () { el.style.outline = ""; }, 4000);
      }
    }

    function shareSimul(sid, name) {
      var base = window.TG_APP_LINK || "";
      var url = base
        ? base + "?startapp=" + encodeURIComponent("lbs_" + sid)
        : location.origin + location.pathname + "?s=" + encodeURIComponent(sid);
      var text = "🎭 " + name + " siansiga qo‘shiling — ShashkaPRO";
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { toast("🔗 Havola nusxalandi", null, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
    }

    function shareLink(tid, name) {`],
    // tugma bosilishi
    [R`else if (act === "tlink") shareLink(id, t.getAttribute("data-n") || "Turnir");`,
     R`else if (act === "tlink") shareLink(id, t.getAttribute("data-n") || "Turnir");
        else if (act === "slink") shareSimul(id, t.getAttribute("data-n") || "Sians");`],
    // karta id si
    [R`h += "<div class=\"card\"><div><b>🎭 " + esc(s.name)`,
     R`h += "<div class=\"card\" id=\"lbsc_" + esc(s.id) + "\"><div><b>🎭 " + esc(s.name)`],
    // 🔗 tugmasi
    [R`" o‘yinchi</div><div class=\"row\">";
        if (s.status === "reg") {`,
     R`" o‘yinchi</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"slink\" data-id=\"" + esc(s.id) + "\" data-n=\"" + esc(s.name) + "\">🔗 Havola</button>";
        if (s.status === "reg") {`],
  ],
};

for (const f of Object.keys(plan)) if (!fs.existsSync(f)) { console.log('XATO: ' + f + ' topilmadi'); process.exit(1); }
const out = {};
let bad = 0;
for (const f in plan) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of plan[f]) {
    if (s.includes(b)) { console.log('allaqachon bor:', f); continue; }
    if (s.split(a).length !== 2) { console.log('MOS KELMADI:', f, JSON.stringify(a.slice(0, 70))); bad++; continue; }
    s = s.replace(a, () => b);
  }
  out[f] = s;
}
if (bad) { console.log('Xato bor, hech narsa o‘zgartirilmadi'); process.exit(1); }
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('Tayyor');
