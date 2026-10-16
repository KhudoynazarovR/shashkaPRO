const https = require("https");
function get(u, cb) { https.get(u, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => cb(r.statusCode, d)); }).on("error", e => cb(0, String(e))); }
get("https://shashkapro.onrender.com/", (code, html) => {
  console.log("sahifa:", code, "uzunlik:", html.length, "clicksound:", html.includes("clicksound"));
  const m = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)];
  let e = 0;
  m.forEach((x, i) => { try { new Function(x[1]); } catch (er) { e++; console.log("script", i, "XATO:", er.message); } });
  console.log("skriptlar:", m.length, "xato:", e);
  const b = Array(64).fill(0);
  for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 === 1) { if (r < 3) b[i] = -1; else if (r > 4) b[i] = 1; } }
  const body = JSON.stringify({ board: b, side: 1, time: 0.3 });
  const rq = https.request("https://shashkapro.onrender.com/api/ai/move", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, r => {
    let d = ""; r.on("data", c => d += c);
    r.on("end", () => console.log("KESTOG:", r.statusCode, d.slice(0, 200)));
  });
  rq.on("error", er => console.log("KESTOG xato:", String(er)));
  rq.end(body);
});
