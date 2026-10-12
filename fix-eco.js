const fs = require("fs");
let s = fs.readFileSync("economy.js", "utf8");
const a = s.indexOf("  HOST_TIERS:");
const b = s.indexOf("function note(");
const fixed = [
  "  HOST_TIERS: [[150, 1000], [100, 350], [50, 150]],",
  "};",
  "",
  "const today = () => new Date().toISOString().slice(0, 10);",
  "const user = (id) => store.users()[String(id)] || null;",
  "",
  ""
].join("\n");
s = s.slice(0, a) + fixed + s.slice(b);
fs.writeFileSync("economy.js", s);
console.log("tuzatildi");
