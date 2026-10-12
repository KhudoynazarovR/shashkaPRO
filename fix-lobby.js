const fs = require('fs');
let L = fs.readFileSync('lobbyclient.js', 'utf8').split('\n');
function chk(n, re) { if (!re.test(L[n - 1])) { console.log('LINE MISMATCH', n, L[n - 1].slice(0, 80)); process.exit(1); } }
chk(412, /Simul \(bitta xo'jayin/); chk(500, /^    }$/); chk(501, /^$/); chk(502, /function renderTournaments/);
L.splice(411, 90);
chk(216, /id=\\"lbS\\"/); chk(217, /Sians nomi/); chk(223, /id=\\"lbSs\\"/); chk(224, /id=\\"lbS\\"/);
L.splice(215, 8);
let s = L.join('\n');
function rep(a, b) {
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log('MOS KELMADI (' + n + '):', JSON.stringify(a.slice(0, 80))); process.exit(1); }
  s = s.replace(a, () => b);
}
const R = String.raw;
rep(R`    var inRoom = ROOM_RE.test(curRoom);`,
R`    // havola orqali kirish: startapp=lbt_<turnir> / lbs_<sians> yoki ?t= / ?s=
    var linkTid = "", linkSid = "";
    if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; }
    else if (/^lbs_/.test(curRoom)) { linkSid = curRoom.slice(4); curRoom = ""; }
    else {
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("t") || "")) linkTid = q.get("t");
      if (/^[A-Za-z0-9_-]{1,64}$/.test(q.get("s") || "")) linkSid = q.get("s");
    }
    var inRoom = ROOM_RE.test(curRoom);`);
rep(R`renderIncoming(); updateSimulBtn();`,
R`renderIncoming(); updateSimulBtn();
        if (linkTid && !inRoom) openLinked("t");
        if (linkSid && !inRoom) openLinked("s");`);
rep(R`    function renderBadge() {`,
R`    // ---------- 🔗 havolalar ----------
    var hl = { id: "", until: 0 };
    function applyHl() {
      if (!hl.id || Date.now() > hl.until) return;
      var e = $(hl.id);
      if (e) e.style.outline = "2px solid #2b7cff";
    }
    function openLinked(kind) {
      var id = kind === "t" ? linkTid : linkSid;
      if (kind === "t") linkTid = ""; else linkSid = "";
      curTab = kind;
      openPanel();
      var list = kind === "t" ? S.tournaments : S.simuls;
      var found = (list || []).some(function (x) { return String(x.id) === id; });
      if (!found) { toast("⚠️ Bu " + (kind === "t" ? "turnir" : "sians") + " topilmadi yoki yopilgan", null, 5000); return; }
      hl.id = (kind === "t" ? "lbtc_" : "lbsc_") + id;
      hl.until = Date.now() + 4000;
      applyHl();
      var el = $(hl.id);
      if (el) { try { el.scrollIntoView({ block: "center" }); } catch (e) {} }
    }
    function shareLink(prefix, qp, id, text) {
      var base = window.TG_APP_LINK || ""; // masalan: "https://t.me/BOT_USERNAME/APP_NAME"
      var url = base
        ? base + "?startapp=" + encodeURIComponent(prefix + id)
        : location.origin + location.pathname + "?" + qp + "=" + encodeURIComponent(id);
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { toast("🔗 Havola nusxalandi", null, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
    }

    function renderBadge() {`);
rep(R`        else if (act === "go") go(id);`,
R`        else if (act === "go") go(id);
        else if (act === "tlink") shareLink("lbt_", "t", id, "🏆 " + (t.getAttribute("data-n") || "Turnir") + " turniriga qo‘shiling — ShashkaPRO");
        else if (act === "slink") shareLink("lbs_", "s", id, "🎭 " + (t.getAttribute("data-n") || "Sians") + " siansiga qo‘shiling — ShashkaPRO");`);
rep(R`h += "<div class=\"card\"><div><b>" + (arena ? "⚔️" : "🏆")`,
    R`h += "<div class=\"card\" id=\"lbtc_" + esc(t.id) + "\"><div><b>" + (arena ? "⚔️" : "🏆")`);
rep(R`" o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";`,
    R`" o‘yinchi · ochdi: " + esc(t.creatorName) + "</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"tlink\" data-id=\"" + esc(t.id) + "\" data-n=\"" + esc(t.name) + "\">🔗 Havola</button>";`);
rep(R`      $("lbTs").innerHTML = h;`, R`      $("lbTs").innerHTML = h;
      applyHl();`);
rep(R`h += "<div class=\"card\"><div><b>🎭 " + esc(s.name)`,
    R`h += "<div class=\"card\" id=\"lbsc_" + esc(s.id) + "\"><div><b>🎭 " + esc(s.name)`);
rep(R`<br>Mezbon: " + esc(s.hostName) + " · " + s.players.length + "/" + s.max + " o‘yinchi</div><div class=\"row\">";`,
    R`<br>Mezbon: " + esc(s.hostName) + " · " + s.players.length + "/" + s.max + " o‘yinchi</div><div class=\"row\">";
        h += "<button class=\"sec\" data-a=\"slink\" data-id=\"" + esc(s.id) + "\" data-n=\"" + esc(s.name) + "\">🔗 Havola</button>";`);
rep(R`      box.innerHTML = h;`, R`      box.innerHTML = h;
      applyHl();`);
fs.writeFileSync('lobbyclient.js', s);
console.log('OK');
