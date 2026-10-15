const fs = require("fs");
function R(a, b) {
  let s = fs.readFileSync("roomclient.js", "utf8");
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("XATO: anchor soni =", n, "\n", a.slice(0, 80)); process.exit(1); }
  fs.writeFileSync("roomclient.js", s.replace(a, () => b));
}
R(String.raw`function onMessage(m) {`, String.raw`var _azT = null, _azBox = null;
    function autoZalStop() {
      clearInterval(_azT); _azT = null;
      if (_azBox && _azBox.parentNode) _azBox.parentNode.removeChild(_azBox);
      _azBox = null;
    }
    function autoZalStart() {
      autoZalStop();
      if (st.gamesTotal > 1) return;
      if (typeof elZal === "undefined" || !elZal || !elZal.onclick) return;
      var n = 10;
      _azBox = document.createElement("div");
      _azBox.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:2147483000;background:#1c2733;color:#fff;border:1px solid #2a3647;border-radius:12px;padding:10px 14px;font:14px Arial,sans-serif;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,.4)";
      var tx = document.createElement("span"), bt = document.createElement("button");
      bt.textContent = "Qolish";
      bt.style.cssText = "background:#3b3f8f;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-size:14px";
      bt.onclick = autoZalStop;
      _azBox.appendChild(tx); _azBox.appendChild(bt); document.body.appendChild(_azBox);
      function upd() { tx.textContent = "🏟 " + n + " soniyadan keyin zalga qaytasiz"; }
      upd();
      _azT = setInterval(function () {
        if (!st.finished) { autoZalStop(); return; }
        n--;
        if (n <= 0) { autoZalStop(); try { elZal.onclick(); } catch (e) {} } else upd();
      }, 1000);
    }
    function onMessage(m) {`);
R(String.raw`} else if (m.type === "roomFinished" && m.roomId === roomId) {`, String.raw`} else if (m.type === "roomFinished" && m.roomId === roomId) {
        autoZalStart();`);
console.log("OK");
