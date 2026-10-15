const fs = require("fs");
function R(file, a, b) {
  let s = fs.readFileSync(file, "utf8");
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("XATO:", file, "anchor soni =", n, "\n", a.slice(0, 80)); process.exit(1); }
  fs.writeFileSync(file, s.replace(a, () => b));
}
// ---- server ----
R("rooms.js", String.raw`function snapshot(room, color) {`,
String.raw`function _pi(seat) {
    try {
      if (!seat || !seat.uid) return null;
      var u = require("./store.js").users()[String(seat.uid)] || {};
      return { uid: String(seat.uid), elo: u.elo || 1000, av: !!u.avatar };
    } catch (e) { return null; }
  }
  function snapshot(room, color) {`);
R("rooms.js", String.raw`white: room.white ? room.white.name : null,`,
String.raw`white: room.white ? room.white.name : null,
      wInfo: _pi(room.white), bInfo: _pi(room.black),`);
// ---- client ----
R("roomclient.js", String.raw`st.white = m.white; st.black = m.black;`,
String.raw`st.white = m.white; st.black = m.black; st.wInfo = m.wInfo || null; st.bInfo = m.bInfo || null;`);
R("roomclient.js", String.raw`l.textContent = nameLine(color) + (st.berserk && st.berserk[color] ? " ⚡" : "");`,
String.raw`var _inf = color === "white" ? st.wInfo : st.bInfo, _nm = (color === "white" ? st.white : st.black) || "?";
      l.style.cssText = "display:flex;align-items:center;gap:7px;min-width:0";
      function _letter() {
        var d = document.createElement("span"); d.textContent = String(_nm).charAt(0).toUpperCase();
        d.style.cssText = "width:30px;height:30px;border-radius:50%;background:#3b3f8f;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;flex:none";
        return d;
      }
      if (_inf && _inf.uid) {
        if (_inf.av) {
          var _im = document.createElement("img"); _im.src = "/api/av/" + encodeURIComponent(_inf.uid);
          _im.style.cssText = "width:30px;height:30px;border-radius:50%;object-fit:cover;flex:none;background:#2a2f55";
          _im.onerror = function () { if (_im.parentNode) _im.parentNode.replaceChild(_letter(), _im); };
          l.appendChild(_im);
        } else l.appendChild(_letter());
      }
      var _tx = document.createElement("span"); _tx.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0";
      _tx.textContent = nameLine(color) + (st.berserk && st.berserk[color] ? " ⚡" : "");
      l.appendChild(_tx);
      if (_inf && _inf.elo) { var _eb = document.createElement("span"); _eb.textContent = "⭐" + _inf.elo; _eb.style.cssText = "color:#ffd86b;font-size:13px;font-weight:bold;flex:none"; l.appendChild(_eb); }`);
console.log("OK");
