// Ovoz tizimini ulaydi: server.js, lobby.js, lobbyclient.js, roomclient.js.
// Ishlatish: node patch-sound.js   (loyiha papkasida; sound.js shu yerda turishi kerak)
const fs = require('fs');
const R = String.raw;

if (!fs.existsSync('sound.js')) { console.log('XATO: sound.js shu papkada yo‘q'); process.exit(1); }

const plan = {
  'server.js': [
    [R`html = html.replace(/(lobbyclient|roomclient)\.js(\?v=\d+)?/g, "$1.js?v=" + Date.now());`,
     R`html = html.replace(/(lobbyclient|roomclient|sound)\.js(\?v=\d+)?/g, "$1.js?v=" + Date.now());`],
    [R`if (!html.includes("rules-bridge.js")) {`,
     R`if (!html.includes("sound.js")) {
      html = html.replace("</body>", '<script src="/sound.js"></script>\n</body>');
    }
    if (!html.includes("rules-bridge.js")) {`],
  ],
  'lobby.js': [
    [R`type: 'lbState',`, R`type: 'lbState', now: Date.now(),`],
  ],
  'lobbyclient.js': [
    // server soati bilan farq (sanash aniq bo'lishi uchun)
    [R`S = m; renderBadge();`, R`S = m; if (m.now) window.__lbSkew = m.now - Date.now(); renderBadge();`],
    // zal sarlavhasiga 🔊 tugmasi
    [R`<button id=\"lbClose\" class=\"sec\">✕</button></div>" +`,
     R`<span><button id=\"lbSnd\" class=\"sec\">🔊</button> <button id=\"lbClose\" class=\"sec\">✕</button></span></div>" +`],
    [R`$("lbClose").onclick = closePanel;`,
     R`$("lbClose").onclick = closePanel;
      $("lbSnd").onclick = function () { if (window.SPSound) window.SPSound.openSettings(); };`],
    // turnir boshlanishidan oldin 10 dan 1 gacha sanash
    [R`renderTournaments(); }, 2000);`,
     R`renderTournaments(); }, 2000);

    // Turnir boshlanishidan oldin 10 → 1 sanash (faqat qo'shilgan o'yinchilarga)
    (function () {
      var lastKey = "";
      setInterval(function () {
        var me = S && S.me ? S.me.uid : null;
        if (!me || !window.SPSound) return;
        var now = Date.now() + (window.__lbSkew || 0);
        (S.tournaments || []).forEach(function (t) {
          if (t.status !== "reg" || !t.startAt) return;
          if (t.type !== "arena" && t.players.length < 3) return;
          if (!t.players.some(function (p) { return p.uid === me; })) return;
          var left = Math.ceil((t.startAt - now) / 1000);
          if (left >= 1 && left <= 10) {
            var key = t.id + ":" + left;
            if (key !== lastKey) { lastKey = key; window.SPSound.count(left); }
          }
        });
      }, 200);
    })();`],
  ],
  'roomclient.js': [
    [R`var ws = null, hb = null, gid = guestId();`,
     R`var ws = null, hb = null, gid = guestId();

    // ---------- ovozlar ----------
    function soundForMove(mv, piece) {
      var S = window.SPSound;
      if (!S || !mv || !mv.to) return;
      var toLast = piece === 1 ? mv.to.r === 0 : piece === 2 ? mv.to.r === 7 : false;
      if (toLast) S.play("king");
      else if (mv.captures && mv.captures.length) S.play("capture");
      else S.play("move");
    }
    var lowFlag = { white: false, black: false }, lastTickSec = 0;
    function lowTimeCheck() {
      var S = window.SPSound;
      if (!S || st.finished || st.color === "spectator" || !st.clockRunning || st.turn !== st.color) return;
      var ms = remaining(st.color);
      if (ms <= 0) return;
      if (ms <= 10000 && !lowFlag[st.color]) { lowFlag[st.color] = true; S.play("low"); }
      if (ms > 12000) lowFlag[st.color] = false;       // inkrement bilan oshsa, qayta signal beriladi
      if (ms <= 5000) {
        var sec = Math.ceil(ms / 1000);
        if (sec !== lastTickSec) { lastTickSec = sec; S.play("tick"); }
      }
    }
    setInterval(lowTimeCheck, 300);`],
    [R`st.board = applyStep(st.board, m.move);`,
     R`var _pp = st.board[m.move.from.r] && st.board[m.move.from.r][m.move.from.c];
        st.board = applyStep(st.board, m.move);
        soundForMove(m.move, _pp);`],
  ],
};

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
