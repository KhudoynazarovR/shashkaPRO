// Xona ichiga 🔗 Havola tugmasi (do'stona o'yin). Ishlatish: node patch-room-link.js
const fs = require('fs');
const R = String.raw;
const plan = [
  [R`if (!ROOM_RE.test(roomId)) return; // xona rejimi emas`,
   R`if (/^lb[ts]_/.test(roomId)) return; // turnir/sians havolasi - xona emas
    if (!ROOM_RE.test(roomId)) return; // xona rejimi emas`],
  [R`'<button id="rcChatBtn">💬 Chat</button>' +`,
   R`'<button id="rcLink">🔗 Havola</button>' +
      '<button id="rcChatBtn">💬 Chat</button>' +`],
  [R`    elResign.onclick = function () {`,
   R`    root.querySelector("#rcLink").onclick = function () {
      var base = window.TG_APP_LINK || "";
      var url = base
        ? base + "?startapp=" + encodeURIComponent(roomId)
        : location.origin + location.pathname + "?room=" + encodeURIComponent(roomId);
      var text = "♟️ ShashkaPRO — men bilan o‘ynang!";
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { elInfo.textContent = "🔗 Havola nusxalandi"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
    };
    elResign.onclick = function () {`],
];
let s = fs.readFileSync('roomclient.js', 'utf8'), bad = 0;
for (const [a, b] of plan) {
  if (s.includes(b)) { console.log('allaqachon bor'); continue; }
  if (s.split(a).length !== 2) { console.log('MOS KELMADI:', JSON.stringify(a.slice(0, 60))); bad++; continue; }
  s = s.replace(a, () => b);
}
if (bad) { console.log('Hech narsa o‘zgartirilmadi'); process.exit(1); }
fs.writeFileSync('roomclient.js', s); console.log('Tayyor');
