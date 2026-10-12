// 🔗 Havola: turnir, sians (simul) va do'stona o'yin xonasi uchun.
// Ishlatish: node patch-links.js   (loyiha papkasida; patch-simul.js dan KEYIN)
// Havolalar: startapp=lbt_<id> (turnir), lbs_<id> (sians), <xona> (xona); veb: ?t= ?s= ?room=
// index.html ga qo'shing: <script>window.TG_APP_LINK="https://t.me/BOT/APP";</script>
const fs = require('fs');
const R = String.raw;
const SOFT = true; // topilmasa to'xtamaydi, faqat ogohlantiradi

const SHARE = (fn, prefix, qp, textExpr) => R`function ${fn}(id, name) {
      var base = window.TG_APP_LINK || "";
      var url = base
        ? base + "?startapp=" + encodeURIComponent("${prefix}" + id)
        : location.origin + location.pathname + "?${qp}=" + encodeURIComponent(id);
      var text = ${textExpr};
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { toast("🔗 Havola nusxalandi", null, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
    }
`;

const OPEN = (fn, varName, tab, listName, idPrefix, label) => R`function ${fn}() {
      var id = ${varName}; ${varName} = "";
      curTab = "${tab}";
      openPanel();
      var found = (S.${listName} || []).some(function (x) { return String(x.id) === id; });
      if (!found) { toast("⚠️ Bu ${label} topilmadi yoki yopilgan", null, 5000); return; }
      var el = $("${idPrefix}" + id);
      if (el) {
        try { el.scrollIntoView({ block: "center" }); } catch (e) {}
        el.style.outline = "2px solid #2b7cff";
        setTimeout(function () { el.style.outline = ""; }, 4000);
      }
    }
`;

const plan = {
  'roomclient.js': [
    [R`if (!ROOM_RE.test(roomId)) return; // xona rejimi emas`,
     R`if (/^lb[ts]_/.test(roomId)) return; // turnir/sians havolasi - xona emas (lobbyclient.js ochadi)
    if (!ROOM_RE.test(roomId)) return; // xona rejimi emas`],
    [R`'<button id="rcChatBtn">💬 Chat</button>' +`,
     R`'<button id="rcLink">🔗 Havola</button>' +
      '<button id="rcChatBtn">💬 Chat</button>' +`],
    [R`    elResign.onclick = function () {`,
     R`    // 🔗 Havola: do'stona o'yin xonasiga to'g'ridan-to'g'ri kiritadi
    root.querySelector("#rcLink").onclick = function () {
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
  ],
  'lobbyclient.js': [
    [R`var inRoom = ROOM_RE.test(curRoom);`,
     R`var linkTid = "", linkSid = "";
    if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; }
    else if (/^lbs_/.test(curRoom)) { linkSid = curRoom.slice(4); curRoom = ""; }
    else {
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("t") || "")) linkTid = q.get("t");
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("s") || "")) linkSid = q.get("s");
    }
    var inRoom = ROOM_RE.test(curRoom);`],
    [R`if (panelOpen) renderAll(); renderIncoming();`,
     R`if (panelOpen) renderAll(); renderIncoming();
        if (linkTid && !inRoom) openLinkedTournament();
        if (linkSid && !inRoom) openLinkedSimul();`],
    [R`    function renderBadge() {`,
     '    ' + OPEN('openLinkedTournament', 'linkTid', 't', 'tournaments', 'lbtc_', 'turnir') + '\n    ' +
     OPEN('openLinkedSimul', 'linkSid', 's', 'simuls', 'lbsc_', 'sians') + '\n    ' +
     SHARE('shareTourney', 'lbt_', 't', R`"🏆 " + name + " turniriga qo‘shiling — ShashkaPRO"`) + '\n    ' +
     SHARE('shareSimul', 'lbs_', 's', R`"🎭 " + name + " siansiga qo‘shiling — ShashkaPRO"`) + '\n' +
     R`    function renderBadge() {`],
    [R`else if (act === "go") go(id);`,
     R`else if (act === "go") go(id);
        else if (act === "tlink") shareTourney(id, t.getAttribute("data-n") || "Turnir");
        else if (act === "slink") shareSimul(id, t.getAttribute("data-n") || "Sians");`],
    [R`h += "<div class=\"card\"><div><b>🏆 " + esc(t.name) + "</b></div><div class=\"muted\">" + esc(t.tc) + " · " + st + " · " + t.players.length + " o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";`,
     R`h += "<div class=\"card\" id=\"lbtc_" + esc(t.id) + "\"><div><b>🏆 " + esc(t.name) + "</b></div><div class=\"muted\">" + esc(t.tc) + " · " + st + " · " + t.players.length + " o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"tlink\" data-id=\"" + esc(t.id) + "\" data-n=\"" + esc(t.name) + "\">🔗 Havola</button>";`],
    [R`h += "<div class=\"card\"><div><b>🎭 " + esc(s.name)`,
     R`h += "<div class=\"card\" id=\"lbsc_" + esc(s.id) + "\"><div><b>🎭 " + esc(s.name)`, SOFT],
    [R`" o‘yinchi</div><div class=\"row\">";
        if (s.status === "reg") {`,
     R`" o‘yinchi</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"slink\" data-id=\"" + esc(s.id) + "\" data-n=\"" + esc(s.name) + "\">🔗 Havola</button>";
        if (s.status === "reg") {`, SOFT],
  ],
};

for (const f of Object.keys(plan)) if (!fs.existsSync(f)) { console.log('XATO: ' + f + ' topilmadi'); process.exit(1); }
const out = {};
let bad = 0;
for (const f in plan) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b, soft] of plan[f]) {
    if (s.includes(b)) { console.log('allaqachon bor:', f); continue; }
    if (s.split(a).length !== 2) {
      console.log((soft ? 'OGOHLANTIRISH' : 'MOS KELMADI') + ':', f, JSON.stringify(a.slice(0, 70)));
      if (!soft) bad++;
      continue;
    }
    s = s.replace(a, () => b);
  }
  out[f] = s;
}
if (bad) { console.log('Xato bor, hech narsa o‘zgartirilmadi'); process.exit(1); }
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('Tayyor');
