const s = require("fs").readFileSync("index.html", "utf8");
const m = [...s.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)];
const all = m.map(x => x[1]).join("\n;\n");
try { new Function(all); console.log("BIRGALIKDA OK"); } catch (e) { console.log("XATO:", e.message); }
