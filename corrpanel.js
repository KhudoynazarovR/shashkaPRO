// corrpanel.js — 📮 Yozishma o'yinlari (window.corrOpen(gameId?))
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function idt() { var t = window.Telegram && Telegram.WebApp; return (t && t.initData) || ""; }
  function get(u) { return fetch(u, { headers: { "x-init-data": idt() } }).then(function (r) { return r.json(); }); }
  function post(u, b) { return fetch(u, { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": idt() }, body: JSON.stringify(b || {}) }).then(function (r) { return r.json(); }); }
  var PER = { 12: "12 soat", 24: "1 kun", 72: "3 kun" };
  function left(ms) { if (ms <= 0) return "0"; var h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60000); return h >= 24 ? Math.floor(h / 24) + " kun " + (h % 24) + " soat" : h >= 1 ? h + " soat " + m + " daq" : m + " daq"; }
  var CARD = "background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left";
  var BTN = "border:0;border-radius:12px;padding:10px;font-size:14px;font-weight:700;color:#fff;font-family:inherit;cursor:pointer";
  var ov, box, poll;
  function shell() {
    var old = document.getElementById("corrOv"); if (old) old.remove();
    ov = document.createElement("div"); ov.id = "corrOv";
    ov.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:10px";
    box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:440px;max-height:94%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:22px;padding:14px 12px;font-family:inherit";
    ov.appendChild(box); document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) close(); };
  }
  function close() { clearInterval(poll); if (ov) ov.remove(); }
  function head(t, back) { return "<div style='display:flex;align-items:center;margin-bottom:8px'>" + (back ? "<span id='cBk' style='font-size:22px;padding:2px 10px 2px 0;cursor:pointer'>‹</span>" : "") + "<b style='font-size:18px'>" + t + "</b><span id='cX' style='margin-left:auto;font-size:24px;padding:2px 8px;cursor:pointer'>✕</span></div>"; }
  function wire(back) { box.querySelector("#cX").onclick = close; var b = box.querySelector("#cBk"); if (b) b.onclick = back; }

  // ---------- ro'yxat
  function list() {
    clearInterval(poll);
    box.innerHTML = "<div style='padding:30px;opacity:.7;text-align:center'>Yuklanmoqda…</div>";
    get("/api/corr").then(function (d) {
      if (d.error) { box.innerHTML = head("📮 Yozishma o‘yinlari") + "<div style='padding:20px;text-align:center'>Faqat Telegram orqali kirganda ishlaydi</div>"; wire(); return; }
      var h = head("📮 Yozishma o‘yinlari");
      h += "<div style='" + CARD + ";font-size:13px;line-height:1.55'>Har yurishga vaqt beriladi — qulay paytda kirib yurasiz. Raqib yursa, <b>bot sizga xabar beradi</b>.<br>📮 Yozishma ELO: <b>" + d.my.elo + "</b> · o‘yinlar: " + d.my.active + "/" + d.my.max + "</div>";
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:8px'>➕ OCHIQ TAKLIF (har yurishga)</div><div style='display:flex;gap:6px'>" +
        [12, 24, 72].map(function (p) { return "<button data-seek='" + p + "' style='" + BTN + ";flex:1;background:" + (p === 24 ? "#2e7d32" : "#262b66") + "'>" + PER[p] + "</button>"; }).join("") + "</div><div id='cMsg' style='font-size:13px;min-height:16px;margin-top:6px;color:#7ee08a'></div></div>";
      var inc = d.seeks.filter(function (s) { return !s.mine; }), mine = d.seeks.filter(function (s) { return s.mine; });
      if (inc.length) {
        h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>📨 TAKLIFLAR</div>";
        inc.forEach(function (s) { h += "<div style='display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1c2147'><span style='flex:1'>" + (s.to ? "📩 " : "") + esc(s.name) + " <span style='opacity:.6;font-size:12px'>· " + s.elo + " · " + PER[s.per] + "</span></span><button data-acc='" + s.id + "' style='" + BTN + ";background:#2e7d32;padding:7px 12px'>Qabul</button></div>"; });
        h += "</div>";
      }
      if (mine.length) {
        h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>⏳ SIZNING TAKLIFLARINGIZ</div>";
        mine.forEach(function (s) { h += "<div style='display:flex;align-items:center;gap:8px;padding:5px 0'><span style='flex:1;font-size:14px'>" + PER[s.per] + (s.to ? " · shaxsiy" : " · ochiq") + "</span><button data-acc='" + s.id + "' style='" + BTN + ";background:#5a2a35;padding:6px 10px;font-size:12px'>Bekor</button></div>"; });
        h += "</div>";
      }
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>♟ O‘YINLARIM</div>";
      if (!d.games.length) h += "<div style='opacity:.7;font-size:14px'>Hali o‘yin yo‘q — taklif yarating yoki qabul qiling</div>";
      d.games.forEach(function (g) {
        var opp = g.me === 1 ? g.b : g.w, my = !g.res && g.turn === g.me;
        var st = g.res ? (g.res === "d" ? "🤝 Durang" : (g.res === "w") === (g.me === 1) ? "🏆 Yutdingiz" : "😔 Yutqazdingiz") : my ? "<b style='color:#7ee08a'>▶ Navbat sizda</b> · " + left(g.dl - g.now) : "⏳ Raqib o‘ylayapti";
        h += "<div data-g='" + g.id + "' style='display:flex;align-items:center;gap:8px;padding:9px 6px;border-bottom:1px solid #1c2147;cursor:pointer" + (my ? ";background:#123a2a;border-radius:10px" : "") + "'><span style='font-size:18px'>" + (g.me === 1 ? "⚪" : "⚫") + "</span><span style='flex:1'>" + esc(opp.name) + " <span style='opacity:.6;font-size:12px'>" + opp.elo + "</span><div style='font-size:12px;margin-top:2px'>" + st + " · " + Math.ceil(g.n / 2) + "-yurish</div></span><span style='opacity:.6'>›</span></div>";
      });
      h += "</div>";
      if (d.top.length) { h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>🏆 YOZISHMA REYTINGI</div>"; d.top.forEach(function (x, i) { h += "<div style='display:flex;justify-content:space-between;font-size:14px;padding:3px 0'><span>" + (["🥇", "🥈", "🥉"][i] || (i + 1) + ".") + " " + esc(x.name) + "</span><b>" + x.elo + "</b></div>"; }); h += "</div>"; }
      box.innerHTML = h; wire();
      [].forEach.call(box.querySelectorAll("[data-seek]"), function (b) { b.onclick = function () { post("/api/corr/seek", { per: +b.getAttribute("data-seek") }).then(function (r) { if (r.error) { box.querySelector("#cMsg").style.color = "#ff6b7f"; box.querySelector("#cMsg").textContent = r.error; } else list(); }); }; });
      [].forEach.call(box.querySelectorAll("[data-acc]"), function (b) { b.onclick = function () { b.disabled = true; post("/api/corr/accept", { id: b.getAttribute("data-acc") }).then(function (r) { if (r.error) { alert(r.error); b.disabled = false; return; } if (r.game) game(r.game.id); else list(); }); }; });
      [].forEach.call(box.querySelectorAll("[data-g]"), function (el) { el.onclick = function () { game(el.getAttribute("data-g")); }; });
    }).catch(function () { box.innerHTML = "<div style='padding:30px;text-align:center'>Server bilan aloqa yo‘q</div>"; });
  }

  // ---------- o'yin
  var G = null, sel = -1;
  function game(id) {
    sel = -1; clearInterval(poll);
    get("/api/corr/" + id).then(function (g) { if (g.error) { alert(g.error); return list(); } G = g; draw(); });
    poll = setInterval(function () { if (!G || G.res || G.turn === G.me) return; get("/api/corr/" + id).then(function (g) { if (!g.error && (g.n !== G.n || g.res !== G.res || g.drawBy !== G.drawBy)) { G = g; sel = -1; draw(); } }); }, 15000);
  }
  function draw() {
    var g = G, flip = g.me === -1, opp = g.me === 1 ? g.b : g.w, mine = g.me === 1 ? g.w : g.b, my = !g.res && g.turn === g.me;
    var tg = {}, fr = {};
    g.legal.forEach(function (m) { fr[m[0]] = 1; if (m[0] === sel) tg[m[1]] = 1; });
    var h = head("📮 " + esc(opp.name), list);
    h += "<div style='display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px'><span>" + (g.me === 1 ? "⚫ " : "⚪ ") + esc(opp.name) + " · " + opp.elo + "</span><span style='opacity:.7'>⏳ " + PER[g.per] + "/yurish</span></div>";
    h += "<div style='display:grid;grid-template-columns:repeat(8,1fr);aspect-ratio:1;border-radius:8px;overflow:hidden;box-shadow:0 6px 20px #0006'>";
    for (var rr = 0; rr < 8; rr++) for (var cc = 0; cc < 8; cc++) {
      var r = flip ? 7 - rr : rr, c = flip ? 7 - cc : cc, i = r * 8 + c, dark = (r + c) % 2 === 1, p = g.board[i];
      var last = g.last && (g.last[0] === i || g.last[1] === i);
      var bg = !dark ? "#f0d9b5" : i === sel ? "#4c8d3a" : tg[i] ? "#3a6ea5" : last ? "#a8873a" : "#8b5a2b";
      var pc = p ? "<i style='display:block;width:80%;height:80%;margin:10%;border-radius:50%;background:" + (p > 0 ? "radial-gradient(circle at 35% 30%,#fff,#d6d0bd 75%)" : "radial-gradient(circle at 35% 30%,#707070,#0e0e0e 75%)") + ";box-shadow:0 2px 3px #0008;position:relative'>" + (Math.abs(p) === 2 ? "<b style='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#d4a017;font-size:18px'>♛</b>" : "") + "</i>" : "";
      h += "<div data-i='" + i + "' style='background:" + bg + ";cursor:" + (my && (fr[i] || tg[i]) ? "pointer" : "default") + (my && fr[i] && i !== sel ? ";box-shadow:inset 0 0 0 3px #7ee08a88" : "") + "'>" + pc + "</div>";
    }
    h += "</div>";
    h += "<div style='display:flex;justify-content:space-between;font-size:13px;margin-top:6px'><span>" + (g.me === 1 ? "⚪ " : "⚫ ") + esc(mine.name) + " (siz) · " + mine.elo + "</span><span>" + Math.ceil(g.n / 2) + "-yurish</span></div>";
    var st = g.res ? (g.res === "d" ? "🤝 Durang" : (g.res === "w") === (g.me === 1) ? "🏆 Siz yutdingiz!" : "😔 Siz yutqazdingiz") + " <span style='opacity:.7;font-size:12px'>(" + ({ timeout: "vaqt tugadi", resign: "taslim", nomoves: "yurish qolmadi", agreed: "kelishuv", nocap: "urishsiz uzoq o‘yin" }[g.why] || "") + ")</span>"
      : my ? "▶ <b style='color:#7ee08a'>Navbat sizda</b> · qoldi: " + left(g.dl - g.now) : "⏳ Raqib o‘ylayapti · unga " + left(g.dl - g.now) + " qoldi";
    h += "<div style='text-align:center;margin:10px 0;font-size:15px'>" + st + "</div>";
    if (!g.res) h += "<div style='display:flex;gap:8px'><button id='cRs' style='" + BTN + ";flex:1;background:#3a1f2a'>🏳 Taslim</button><button id='cDr' style='" + BTN + ";flex:1;background:#262b66'>" + (g.drawBy && g.drawBy !== mine.uid ? "🤝 Durangni qabul qilish" : g.drawBy ? "🤝 Durang taklif qilindi" : "🤝 Durang taklifi") + "</button></div>";
    h += "<div id='cE' style='color:#ff6b7f;font-size:13px;min-height:16px;margin-top:6px;text-align:center'></div>";
    box.innerHTML = h; wire(list);
    [].forEach.call(box.querySelectorAll("[data-i]"), function (el) {
      el.onclick = function () {
        if (!my) return; var i = +el.getAttribute("data-i");
        if (fr[i]) { sel = sel === i ? -1 : i; return draw(); }
        if (sel >= 0 && tg[i]) {
          var f = sel; sel = -1;
          post("/api/corr/move", { id: g.id, from: f, to: i }).then(function (r) { if (r.error) { box.querySelector("#cE").textContent = r.error; return; } G = r.game; draw(); });
        }
      };
    });
    var rs = box.querySelector("#cRs"); if (rs) rs.onclick = function () { if (!confirm("Taslim bo‘lasizmi?")) return; post("/api/corr/resign", { id: g.id }).then(function (r) { if (r.game) { G = r.game; draw(); } }); };
    var dr = box.querySelector("#cDr"); if (dr) dr.onclick = function () { if (g.drawBy === mine.uid) return; post("/api/corr/draw", { id: g.id }).then(function (r) { if (r.game) { G = r.game; draw(); } }); };
  }
  window.corrOpen = function (id) { shell(); if (id) game(id); else list(); };
  window.corrInvite = function (uid, per) { return post("/api/corr/seek", { to: String(uid), per: per || 24 }); };
})();
