const fs = require('fs');
const R = String.raw;
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}

// ---------- ratings.js ----------
let A = fs.readFileSync('ratings.js', 'utf8');
if (A.includes('window.spUser')) { console.log('Allaqachon bor'); process.exit(0); }
A = rep(A, 'function avatar(p) {',
  R`function avatar(p) { if (p.id) return "<div class=\"rka\">" + (p.hasAv ? "<img src=\"/api/av/" + encodeURIComponent(p.id) + "\">" : "👤") + "</div>";`, 'avatar');
A = rep(A, R`return "<div class=\"rkr\"><div class=\"rkm\">"`,
  R`return "<div class=\"rkr\" style=\"cursor:pointer\" onclick=\"spUser('" + esc(p.id) + "')\"><div class=\"rkm\">"`, 'row');
A = rep(A, 'window.rkIsOpen = function () { return !!panel && panel.style.display !== "none"; };',
`window.rkIsOpen = function () { return !!panel && panel.style.display !== "none"; };

  window.spUser = function (id) {
    var tg = window.Telegram && window.Telegram.WebApp;
    var old = document.getElementById("spUo"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "spUo";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:0;z-index:100000;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:380px;max-height:90%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:24px;padding:20px 16px;text-align:center;font-family:inherit";
    box.innerHTML = "<div style=\\"padding:30px;opacity:.7\\">Yuklanmoqda…</div>";
    ov.appendChild(box); document.body.appendChild(ov);
    fetch("/api/user/" + encodeURIComponent(id), { headers: { "x-init-data": (tg && tg.initData) || "" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) { box.innerHTML = "<div style=\\"padding:30px\\">Yuklab bo‘lmadi</div>"; return; }
        var pct = d.games ? Math.round(d.wins * 100 / d.games) : 0;
        function cell(ic, v, l) { return "<div style=\\"background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:10px 2px\\"><div style=\\"font-size:18px\\">" + ic + "</div><div style=\\"font-size:19px;font-weight:700\\">" + v + "</div><div style=\\"font-size:11px;color:#8a8db8\\">" + l + "</div></div>"; }
        var av = d.hasAv ? "<img src=\\"/api/av/" + encodeURIComponent(d.id) + "\\" style=\\"width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid #f5b72b\\">" : "<div style=\\"width:96px;height:96px;border-radius:50%;background:#1a00a8;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:44px;border:4px solid #f5b72b\\">👤</div>";
        box.innerHTML = av + "<div style=\\"font-size:21px;font-weight:700;margin-top:10px\\">" + esc(d.name) + (d.premium ? " 👑" : "") + "</div>" +
          (d.bio ? "<div style=\\"font-size:13px;color:#a9b0ff;margin-top:6px\\">" + esc(d.bio) + "</div>" : "") +
          "<div style=\\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0\\">" +
          cell("📈", d.elo, "ELO") + cell("💎", d.diamonds, "Olmos") + cell("🏆", d.wins, "G‘alaba") +
          cell("✖️", d.losses, "Mag‘lub") + cell("🤝", d.draws, "Durang") + cell("🎮", d.games, "O‘yinlar") +
          cell("📊", pct + "%", "G‘alaba %") + cell("⭐", d.bestStreak, "Eng yaxshi seriya") + cell("🥇", d.tournWins, "Turnir") +
          "</div><button style=\\"width:100%;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#6b5cf0\\" onclick=\\"document.getElementById('spUo').remove()\\">Yopish</button>";
      })
      .catch(function () { box.innerHTML = "<div style=\\"padding:30px\\">Server bilan aloqa yo‘q</div>"; });
  };`, 'spUser');
fs.writeFileSync('ratings.js', A);

// ---------- lobbyclient.js ----------
let C = fs.readFileSync('lobbyclient.js', 'utf8');
C = rep(C, `' + (pr ? ' lbpr' : '') + '" style="overflow:hidden">'`,
  `' + (pr ? ' lbpr' : '') + '" style="overflow:hidden;cursor:pointer" onclick="window.spUser&&spUser(\\'' + String(uid).replace(/[^0-9A-Za-z_-]/g, '') + '\\')">'`, 'lobby avatar');
fs.writeFileSync('lobbyclient.js', C);
console.log('TAYYOR');
