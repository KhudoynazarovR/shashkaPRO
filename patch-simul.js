// Simul (master klass): rooms.js va lobbyclient.js uchun tuzatish.
// Ishlatish: node patch-simul.js   (loyiha papkasida; avval patch-sound.js bajarilgan bo'lishi kerak)
const fs = require('fs');
const R = String.raw;

const plan = {
  'rooms.js': [
    // xo'jayinga qo'shimcha vaqt va vaqtni o'zgartirishni bloklash
    [R`room.arena = !!(opts && opts.arena);`,
     R`room.arena = !!(opts && opts.arena);
    room.locked = !!(opts && opts.locked);
    if (opts && opts.bonus && opts.bonus.ms > 0) {
      const bc = opts.bonus.color === "black" ? "black" : "white";
      room.clock[bc] += Number(opts.bonus.ms);
    }`],
    [R`if (room.arena) return err(c, "Arena o‘yinida vaqtni o‘zgartirib bo‘lmaydi"), true;`,
     R`if (room.arena || room.locked) return err(c, "Bu o‘yinda vaqtni o‘zgartirib bo‘lmaydi"), true;`],
  ],
  'lobbyclient.js': [
    // 🎭 Simul yorlig'i va bo'limi
    [R`<button id=\"lbTabT\">🏆 Turnirlar</button></div>" +`,
     R`<button id=\"lbTabT\">🏆 Turnirlar</button><button id=\"lbTabS\">🎭 Sians</button></div>" +`],
    [R`"<div id=\"lbPl\"></div>" +`,
     R`"<div id=\"lbPl\"></div>" +
        "<div id=\"lbS\" style=\"display:none\">" +
        "<div class=\"card\"><div class=\"row\"><input id=\"lbSn\" maxlength=\"30\" placeholder=\"Sians nomi\" style=\"flex:1\"><button id=\"lbSCreate\">➕ Ochish</button></div>" +
        "<div class=\"row\"><select id=\"lbSm\"><option value=\"5\">5 kishi</option><option value=\"10\" selected>10 kishi</option><option value=\"15\">15 kishi</option><option value=\"20\">20 kishi</option><option value=\"30\">30 kishi</option></select>" +
        "<select id=\"lbSb\"><option value=\"0\">Qo‘shimcha vaqt yo‘q</option><option value=\"1\">Xo‘jayinga +1 daq</option><option value=\"2\">Xo‘jayinga +2 daq</option><option value=\"3\" selected>Xo‘jayinga +3 daq</option><option value=\"5\">Xo‘jayinga +5 daq</option></select></div>" +
        "<div class=\"row\"><select id=\"lbSc\"><option value=\"alt\">Ranglar navbat bilan</option><option value=\"w\">Xo‘jayin oq</option><option value=\"b\">Xo‘jayin qora</option></select>" +
        "<select id=\"lbSp\"><option value=\"std\">Standart</option><option value=\"idf\">IDF 780</option></select></div>" +
        "<div class=\"muted\">Simul: siz bir vaqtning o‘zida ko‘p o‘yinchi bilan o‘ynaysiz. Vaqt rejimi yuqoridagi tanlovdan olinadi; xo‘jayinga har taxtada qo‘shimcha vaqt beriladi.</div></div>" +
        "<div id=\"lbSs\"></div></div>" +`],
    [R`$("lbTabT").onclick = function () { curTab = "t"; renderAll(); };`,
     R`$("lbTabT").onclick = function () { curTab = "t"; renderAll(); };
      $("lbTabS").onclick = function () { curTab = "s"; renderAll(); };`],
    [R`$("lbTabT").className = curTab === "t" ? "on" : "";`,
     R`$("lbTabT").className = curTab === "t" ? "on" : "";
      $("lbTabS").className = curTab === "s" ? "on" : "";`],
    [R`$("lbT").style.display = curTab === "t" ? "block" : "none";`,
     R`$("lbT").style.display = curTab === "t" ? "block" : "none";
      $("lbS").style.display = curTab === "s" ? "block" : "none";`],
    [R`if (curTab === "pl") renderPlayers(); else renderTournaments();`,
     R`if (curTab === "pl") renderPlayers(); else if (curTab === "s") renderSimuls(); else renderTournaments();`],
    // ochish tugmasi
    [R`$("lbClose").onclick = closePanel;`,
     R`$("lbClose").onclick = closePanel;
      $("lbSCreate").onclick = function () {
        sendMsg({ type: "lbSCreate", name: $("lbSn").value, tc: $("lbTc").value, max: Number($("lbSm").value), bonus: Number($("lbSb").value), color: $("lbSc").value, pos: $("lbSp").value });
        $("lbSn").value = "";
      };`],
    // tugmalar
    [R`else if (act === "go") go(id);`,
     R`else if (act === "go") go(id);
        else if (act === "sj") sendMsg({ type: "lbSJoin", sid: id });
        else if (act === "sl") sendMsg({ type: "lbSLeave", sid: id });
        else if (act === "ss") sendMsg({ type: "lbSStart", sid: id });
        else if (act === "sc") sendMsg({ type: "lbSCancel", sid: id });
        else if (act === "sk") sendMsg({ type: "lbSKick", sid: id, uid: t.getAttribute("data-u") });`],
    // holat kelganda "Keyingi taxta" tugmasini yangilash
    [R`renderBadge(); if (panelOpen) renderAll(); renderIncoming();`,
     R`renderBadge(); if (panelOpen) renderAll(); renderIncoming(); updateSimulBtn();`],
    // ko'rinish funksiyalari
    [R`function renderTournaments() {`,
     R`// ---------- Simul (bitta xo'jayin ko'p o'yinchi bilan bir vaqtda) ----------
    function fmtMs(ms) {
      var s = Math.ceil(ms / 1000);
      return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
    }

    function renderSimuls() {
      var box = $("lbSs");
      if (!box) return;
      var me = S.me ? S.me.uid : "";
      var ss = S.simuls || [];
      if (!ss.length) { box.innerHTML = "<div class=\"card muted\">Hozircha simul yo‘q. Birinchi bo‘lib oching!</div>"; return; }
      var order = { running: 0, reg: 1, finished: 2 };
      ss = ss.slice().sort(function (a, b) { return order[a.status] - order[b.status]; });
      var h = "";
      ss.forEach(function (s) {
        var host = s.hostUid === me;
        var joined = s.players.some(function (p) { return p.uid === me; });
        var stTxt = s.status === "reg" ? "Ro‘yxat ochiq" : (s.status === "running" ? "Davom etmoqda" : "Tugagan");
        var colTxt = s.color === "w" ? "xo‘jayin oq" : (s.color === "b" ? "xo‘jayin qora" : "ranglar navbat bilan");
        h += "<div class=\"card\"><div><b>🎭 " + esc(s.name) + "</b></div><div class=\"muted\">" + esc(s.tc) +
          (s.bonus ? " · xo‘jayinga +" + s.bonus + " daq" : "") + (s.pos === "idf" ? " · IDF 780" : "") + " · " + colTxt + " · " + stTxt +
          "<br>Xo‘jayin: " + esc(s.hostName) + " · " + s.players.length + "/" + s.max + " o‘yinchi</div><div class=\"row\">";
        if (s.status === "reg") {
          if (host) h += "<button class=\"grn\" data-a=\"ss\" data-id=\"" + s.id + "\">▶ Boshlash</button><button class=\"red\" data-a=\"sc\" data-id=\"" + s.id + "\">Bekor qilish</button>";
          else if (joined) h += "<button class=\"sec\" data-a=\"sl\" data-id=\"" + s.id + "\">Chiqish</button>";
          else h += "<button data-a=\"sj\" data-id=\"" + s.id + "\">Qo‘shilish</button>";
        }
        h += "</div>";
        if (s.status === "reg") {
          s.players.forEach(function (p) {
            h += "<div class=\"pl\"><span>" + esc(p.name) + (p.uid === me ? " 👈" : "") + "</span>" +
              (host ? "<button class=\"sec\" data-a=\"sk\" data-id=\"" + s.id + "\" data-u=\"" + esc(p.uid) + "\">✕</button>" : "") + "</div>";
          });
        } else {
          var sc = s.score || { w: 0, d: 0, l: 0 };
          h += "<div class=\"muted\">Xo‘jayin hisobi: +" + sc.w + " =" + sc.d + " −" + sc.l + "</div>";
          var turnGames = s.games.filter(function (g) { return !g.done && g.hostTurn; })
            .sort(function (a, b) { return a.hostMs - b.hostMs; });
          if (host && s.status === "running" && turnGames.length) {
            h += "<div class=\"row\"><button class=\"grn\" data-a=\"go\" data-id=\"" + esc(turnGames[0].roomId) + "\">▶ Keyingi taxta (" + turnGames.length + ")</button></div>";
          }
          var mine = s.games.filter(function (g) { return g.uid === me; })[0];
          if (!host && mine && !mine.done) h += "<div class=\"row\"><button class=\"grn\" data-a=\"go\" data-id=\"" + esc(mine.roomId) + "\">▶ O‘yinga o‘tish</button></div>";
          h += "<table><tr><th>#</th><th>O‘yinchi</th><th>Holat</th><th></th></tr>";
          var rows = s.games.slice().sort(function (a, b) {
            if (a.done !== b.done) return a.done ? 1 : -1;
            if (a.hostTurn !== b.hostTurn) return a.hostTurn ? -1 : 1;
            return a.hostMs - b.hostMs;
          });
          rows.forEach(function (g, i) {
            var st;
            if (g.done) st = g.result === "host" ? "✅ +" : (g.result === "draw" ? "🤝 =" : (g.result === "player" ? "❌ −" : "—"));
            else st = (g.hostTurn ? "🟢 navbat sizda · " : "⏳ ") + fmtMs(g.hostMs);
            h += "<tr><td>" + (i + 1) + "</td><td>" + esc(g.name) + (g.uid === me ? " 👈" : "") + "</td><td>" + st + "</td><td>" +
              ((host || g.uid === me) && !g.done ? "<button data-a=\"go\" data-id=\"" + esc(g.roomId) + "\">▶</button>" : "") + "</td></tr>";
          });
          h += "</table>";
        }
        h += "</div>";
      });
      box.innerHTML = h;
    }

    // Xo'jayin uchun suzuvchi tugma: navbat o'zida bo'lgan keyingi taxtaga o'tadi (vaqti eng kam bo'lgani)
    function updateSimulBtn() {
      var me = S && S.me ? S.me.uid : "";
      var cur = typeof curRoom !== "undefined" ? curRoom : null;
      var best = null, n = 0;
      (S.simuls || []).forEach(function (s) {
        if (s.hostUid !== me || s.status !== "running") return;
        s.games.forEach(function (g) {
          if (g.done || !g.hostTurn || g.roomId === cur) return;
          n++;
          if (!best || g.hostMs < best.hostMs) best = g;
        });
      });
      var b = document.getElementById("lbNext");
      if (!best) { if (b) b.style.display = "none"; return; }
      if (!b) {
        b = document.createElement("button");
        b.id = "lbNext";
        b.style.cssText = "position:fixed;right:12px;bottom:112px;z-index:2147482000;padding:10px 14px;border-radius:20px;border:0;background:#2e9e4f;color:#fff;font:700 14px Arial;box-shadow:0 2px 10px rgba(0,0,0,.4);cursor:pointer";
        document.body.appendChild(b);
      }
      b.style.display = "";
      b.textContent = "🎭 Keyingi taxta · " + n;
      b.onclick = function () { go(best.roomId); };
    }

    function renderTournaments() {`],
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
