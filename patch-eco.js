const fs = require("fs");
let s = fs.readFileSync("server.js", "utf8");
const f = 'if (url.pathname === "/health") {';
const add = 'if (require("./economy.js").handle(req, res, url)) return;';
if (s.includes("economy.js")) {
  console.log("allaqachon bor");
} else if (!s.includes(f)) {
  console.log("TOPILMADI");
} else {
  fs.copyFileSync("server.js", "server.js.before-eco");
  s = s.replace(f, () => add + "\n\n  " + f);
  fs.writeFileSync("server.js", s);
  console.log("yangilandi");
}
