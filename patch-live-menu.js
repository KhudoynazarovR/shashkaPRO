const fs = require('fs');
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
let s = fs.readFileSync('menu.js', 'utf8');
if (s.includes('@live')) { console.log('Allaqachon bor'); process.exit(0); }
s = rep(s, '["📋", "PDN", "Partiyani import va eksport", "@ai:pdn", "#2fd27f,#1ea36a"]]],',
  '["📋", "PDN", "Partiyani import va eksport", "@ai:pdn", "#2fd27f,#1ea36a"],\n      ["👁", "Jonli efir", "Hozirgi o‘yinlarni kuzating", "@live", "#ff4d6d,#ff8fa3"]]],', 'qator');
s = rep(s, 'if (a === "@daily") { daily(); return; }',
  'if (a === "@live") { close(); liveOpen(); return; }\n    if (a === "@daily") { daily(); return; }', 'amal');
s = rep(s, 'window.mnClose = close;', `function liveOpen() {
    var old = document.getElementById("mnLive"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "mnLive";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit";
    document.body.appendChild(ov);
    var ws, timer;
    function stop() { clearInterval(timer); try { ws.close(); } catch (e) {} ov.remove(); }
    function draw(list) {
      var h = "<div style=\\"display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px\\"><span>👁 Jonli efir</span><button id=\\"mnLvX\\" style=\\"border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff\\">⬅️</button></div>";
      if (!list.length) h += "<div style=\\"padding:30px;text-align:center;opacity:.7\\">Hozir o‘ynalayotgan o‘yin yo‘q</div>";
      list.forEach(function (r) {
        h += "<div style=\\"background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;display:flex;align-items:center;gap:10px\\"><div style=\\"flex:1;min-width:0\\"><b>⚪ " + esc(r.white) + "</b> — <b>⚫ " + esc(r.black) + "</b><div style=\\"font-size:12px;opacity:.65;margin-top:4px\\">" + esc(r.tc || "") + " · " + (r.moves || 0) + " yurish · 👁 " + (r.spectators || 0) + "</div></div><button data-r=\\"" + esc(r.id) + "\\" style=\\"border:0;border-radius:12px;padding:10px 14px;background:#6b5cf0;color:#fff\\">👁 Kuzatish</button></div>";
      });
      ov.innerHTML = h;
      ov.querySelector("#mnLvX").onclick = stop;
      Array.prototype.forEach.call(ov.querySelectorAll("[data-r]"), function (b) {
        b.onclick = function () { location.href = location.pathname + "?room=" + encodeURIComponent(b.getAttribute("data-r")); };
      });
    }
    draw([]);
    var proto = location.protocol === "https:" ? "wss://" : "ws://";
    try { ws = new WebSocket(proto + location.host); } catch (e) { return; }
    function ask() { try { ws.send(JSON.stringify({ type: "roomLive" })); } catch (e) {} }
    ws.onopen = function () { ask(); timer = setInterval(ask, 5000); };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m && m.type === "roomLive") draw(m.list || []);
    };
  }
  window.mnClose = close;`, 'panel');
fs.writeFileSync('menu.js', s);
console.log('TAYYOR');
