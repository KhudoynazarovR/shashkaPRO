(function () {
  "use strict";
  var D = null, tab = "elo", q = "", panel = null, loading = false;
  var TABS = [["elo", "ELO", "elo"], ["puz", "Masala", "n"], ["diamonds", "Tanga", "diamonds"], ["wins", "G‘alaba", "wins"], ["games", "O‘yin", "games"], ["best", "Seriya", "best"], ["pct", "G‘alaba %", "pct"], ["tourn", "Turnir", "tw"]];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function css() {
    if (document.getElementById("rkStyle")) return;
    var st = document.createElement("style"); st.id = "rkStyle";
    st.textContent = "#rkPanel{position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9000;background:#0b0e1a;color:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:inherit}" +
      ".rkh{background:linear-gradient(135deg,#2b2a78,#5a1f9a);padding:18px 14px 14px;border-radius:0 0 28px 28px}" +
      ".rkt{display:flex;align-items:center;justify-content:space-between;font-size:22px;font-weight:700}" +
      ".rkb{width:42px;height:42px;border-radius:13px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;font-size:18px}" +
      ".rkc{display:flex;gap:10px;overflow-x:auto;margin-top:14px;padding-bottom:4px}.rkc::-webkit-scrollbar{display:none}" +
      ".rkk{min-width:150px;border-radius:16px;padding:10px 12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2)}" +
      ".rkk small{opacity:.85;display:block}.rkk b{display:block;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}" +
      ".rks{display:none;margin:12px 14px 0}.rks input{width:100%;padding:11px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:#161a3a;color:#fff;box-sizing:border-box}" +
      ".rkn{display:flex;gap:8px;overflow-x:auto;padding:14px 14px 4px}.rkn::-webkit-scrollbar{display:none}" +
      ".rkn button{flex:none;padding:9px 14px;border-radius:14px;border:0;background:#161a3a;color:#cfd3ff}.rkn button.on{background:#6b5cf0;color:#fff}" +
      ".rkl{margin:10px 14px 20px;border-radius:18px;background:#161a3a;overflow:hidden;border:1px solid rgba(255,255,255,.08)}" +
      ".rkr{display:flex;align-items:center;gap:12px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.07)}.rkr:first-child{border-top:0}" +
      ".rkm{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#9aa0d6;flex:none}" +
      ".rka{width:42px;height:42px;border-radius:50%;background:#2a1fc9;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;overflow:hidden}.rka img{width:100%;height:100%;object-fit:cover}" +
      ".rkw{flex:1;min-width:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rkw small{display:block;font-weight:400;opacity:.6}" +
      ".rkv{padding:6px 12px;border-radius:12px;background:#262b66;color:#a9b0ff;font-weight:700;flex:none}" +
      ".rke{padding:24px;text-align:center;opacity:.7}";
    st.textContent += "#rkPanel{background:radial-gradient(circle at 50% 0,#1a1450 0,#0b0e1a 55%)}.rkh{background:none;padding:16px 14px 0;border-radius:0}.rkT{font-size:24px;font-weight:900;letter-spacing:1px;background:linear-gradient(90deg,#27d3ff,#c24dff);-webkit-background-clip:text;background-clip:text;color:transparent}.rkS{font-size:13px;color:#a9b0ff;margin-top:2px;font-weight:400}.rkb{border:1px solid #2fc8ff;background:rgba(47,200,255,.1);box-shadow:0 0 10px rgba(47,200,255,.35)}#rkPod{display:flex;align-items:flex-end;justify-content:center;gap:8px;padding:18px 10px 6px}.rkp{flex:1;min-width:0;text-align:center;border-radius:18px;padding:22px 4px 10px;position:relative;background:linear-gradient(180deg,#1b2350,#10143a);border:1px solid #3d5bd9;box-shadow:0 0 14px rgba(61,91,217,.45)}.rkp1{padding-top:30px;padding-bottom:16px;background:linear-gradient(180deg,#3a2a08,#1a1405);border:1px solid #f5b72b;box-shadow:0 0 22px rgba(245,183,43,.55)}.rkp3{background:linear-gradient(180deg,#3a1d12,#1a0f0c);border:1px solid #d9733d;box-shadow:0 0 14px rgba(217,115,61,.45)}.rkpb{position:absolute;top:-14px;left:50%;transform:translateX(-50%);min-width:30px;height:30px;border-radius:50%;background:#0b0e1a;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-weight:800;color:#9fb4ff}.rkp1 .rkpb{color:#f5b72b}.rkp3 .rkpb{color:#d9733d}.rkp .rka{width:58px;height:58px;margin:0 auto 6px;border:3px solid currentColor}.rkp1 .rka{width:70px;height:70px;border-color:#f5b72b}.rkpn{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px}.rkps{font-size:10px;opacity:.7;margin:3px 0 7px}.rkpv{margin:0 6px;padding:5px 2px;border-radius:12px;background:rgba(255,255,255,.1);font-weight:800;font-size:14px}.rkpv small{display:block;font-size:9px;opacity:.6;font-weight:600}.rkn button{border:1px solid #2a3470;background:#10143a}.rkn button.on{background:#10143a;border:1px solid #2fc8ff;color:#fff;box-shadow:0 0 10px rgba(47,200,255,.5)}.rkl{background:none;border:0;margin:6px 14px 10px;overflow:visible}.rkr{border:1px solid #2a3470;border-radius:16px;background:#10143a;margin-bottom:8px;border-top:1px solid #2a3470}.rkr:first-child{border-top:1px solid #2a3470}.rkm{background:#1b2350;color:#cfd3ff}.rkv{background:#16206a;border:1px solid #3d5bd9;color:#fff}.rkd{font-size:11px;font-weight:700;text-align:center;line-height:1.1;min-width:26px;color:#9aa0d6}.rkd.up{color:#32e07a}.rkd.dn{color:#ff4d5e}.rkme{position:sticky;bottom:6px;margin:6px 14px 12px;padding:10px 12px;border-radius:18px;background:#10143a;border:2px solid #6b5cf0;box-shadow:0 0 16px rgba(107,92,240,.6);display:none;align-items:center;gap:10px}.rkme b{font-size:26px;color:#4d7bff}.rkme small{display:block;font-size:12px;color:#c9ceff}.rkme .tx{margin-left:auto;text-align:right;font-size:11px;color:#cfd3ff}"; document.head.appendChild(st);
  }
  function card(label, ico, arr, key, suf) {
    var x = arr && arr[0];
    return "<div class=\"rkk\"><small>" + ico + " " + label + "</small><b>👑 " + (x ? esc(x.name) : "—") + "</b>" +
      (x ? "<small>" + fmt(x[key]) + (suf || "") + "</small>" : "") + "</div>";
  }
  function avatar(p) { if (p.id) return "<div class=\"rka\">" + (p.hasAv ? "<img src=\"/api/av/" + encodeURIComponent(p.id) + "\">" : "👤") + "</div>";
    var a = p.av || "";
    if (a && (a.indexOf("http") === 0 || a.indexOf("/") === 0 || a.indexOf("data:image") === 0)) return "<div class=\"rka\"><img src=\"" + esc(a) + "\"></div>";
    return "<div class=\"rka\">" + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>";
  }
  var ICO = { puz: "🧩", elo: "📊", wins: "🏆", games: "🎮", diamonds: "🪙", best: "🔥", pct: "📈", tourn: "🥇" };
  function myId() { var tg = window.Telegram && window.Telegram.WebApp; var u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user; return u ? String(u.id) : ""; }
  function dl(p) {
    var v = p.delta != null ? p.delta : (p.d != null ? p.d : (p.change != null ? p.change : null));
    if (v == null || isNaN(v)) return "";
    v = Number(v);
    if (v > 0) return "<div class='rkd up'>▲<br>+" + v + "</div>";
    if (v < 0) return "<div class='rkd dn'>▼<br>" + v + "</div>";
    return "<div class='rkd'>–<br>0</div>";
  }
  function pcard(p, rank, key, suf, lab) {
    if (!p) return "<div class='rkp' style='visibility:hidden'></div>";
    var sub = p.puz ? "✅ " + p.n + " masala yechgan" : "🏆 " + (p.wins || 0) + " g‘alaba · " + (p.games || 0) + " o‘yin";
    return "<div class='rkp rkp" + rank + "' onclick=\"spUser('" + esc(p.id) + "')\"><div class='rkpb'>" + (rank === 1 ? "👑" : rank) + "</div>" + avatar(p) +
      "<div class='rkpn'>" + esc(p.name) + "</div><div class='rkps'>" + sub + "</div><div class='rkpv'>" + ico() + " " + fmt(p[key]) + suf + "<small>" + lab + "</small></div></div>";
  }
  function render() {
    if (!panel) return;
    var h = "<div class='rkh'><div class='rkt'><div><div class='rkT'>🏆 REYTING ARENASI</div><div class='rkS'>Eng kuchli o‘yinchilar — bu yerda!</div></div><button class='rkb' onclick='rkSearch()'>🔍</button></div></div>";
    h += "<div class='rks' id='rkS'><input id='rkQ' placeholder='Ism bo‘yicha qidirish' value=\"" + esc(q) + "\" oninput='rkQ(this.value)'></div>";
    h += "<div id='rkPod'></div>";
    h += "<div class='rkn'>" + TABS.map(function (t) { return "<button class='" + (t[0] === tab ? "on" : "") + "' onclick=\"rkTab('" + t[0] + "')\">" + (ICO[t[0]] || "") + " " + t[1] + "</button>"; }).join("") + "</div>";
    h += "<div class='rkl' id='rkList'></div><div class='rkme' id='rkMe'></div>";
    panel.innerHTML = h;
    var s = document.getElementById("rkS"); if (s && q) s.style.display = "block";
    list();
  }
  function list() {
    var el = document.getElementById("rkList"); if (!el) return;
    var pe = document.getElementById("rkPod"), me = document.getElementById("rkMe");
    if (!D) { if (pe) pe.innerHTML = ""; if (me) me.style.display = "none"; el.innerHTML = "<div class='rke'>" + (loading ? "Yuklanmoqda…" : "Ma‘lumot olinmadi. Qayta urinib ko‘ring.") + "</div>"; return; }
    var t = TABS.filter(function (x) { return x[0] === tab; })[0], key = t[2], lab = t[1];
    var full = D[tab] || [], arr = full, qq = q.trim().toLowerCase();
    if (qq) arr = arr.filter(function (p) { return (p.name || "").toLowerCase().indexOf(qq) >= 0; });
    var suf = tab === "pct" ? "%" : "";
    var top = !qq && arr.length > 0;
    if (pe) { pe.style.display = top ? "flex" : "none"; pe.innerHTML = top ? pcard(arr[1], 2, key, suf, lab) + pcard(arr[0], 1, key, suf, lab) + pcard(arr[2], 3, key, suf, lab) : ""; }
    if (!arr.length) { el.style.display = "block"; el.innerHTML = "<div class='rke'>" + (tab === "pct" ? "Kamida 20 ta o‘yin o‘ynaganlar chiqadi." : (tab === "tourn" ? "Hali turnir g‘olibi yo‘q." : "Hozircha bo‘sh.")) + "</div>"; }
    else {
      var rest = top ? arr.slice(3) : arr;
      el.style.display = rest.length ? "block" : "none";
      el.innerHTML = rest.map(function (p) {
        var sub = p.puz ? "✅ " + p.n + " masala yechgan" : p.games ? "🏆 " + p.wins + " g‘alaba · 🎮 " + p.games + " o‘yin" : "";
        return "<div class='rkr' style='cursor:pointer' onclick=\"spUser('" + esc(p.id) + "')\"><div class='rkm'>" + (full.indexOf(p) + 1) + "</div>" + avatar(p) +
          "<div class='rkw'>" + esc(p.name) + (p.premium ? " ⭐" : "") + (sub ? "<small>" + sub + "</small>" : "") + "</div><div class='rkv'>" + ico() + " " + fmt(p[key]) + suf + "</div>" + dl(p) + "</div>";
      }).join("");
    }
    var id = myId(), mi = -1;
    if (id) for (var i = 0; i < full.length; i++) if (String(full[i].id) === id) { mi = i; break; }
    if (me) {
      if (mi < 0) { me.style.display = "none"; }
      else {
        var m = full[mi]; me.style.display = "flex";
        me.innerHTML = "<div class='rka'>" + (m.hasAv ? "<img src='/api/av/" + encodeURIComponent(m.id) + "'>" : "👤") + "</div><div><small>Sizning o‘rningiz:</small><b>#" + (mi + 1) + "</b></div>" +
          "<div class='rkv'>" + ico() + " " + fmt(m[key]) + suf + "</div><div class='tx'>Barqaror o‘yin<br>bilan oldinga!</div>";
      }
    }
  }
  window.rkTab = function (t) { tab = t; render(); };
  window.rkQ = function (v) { q = v; list(); };
  window.rkSearch = function () {
    var s = document.getElementById("rkS"); if (!s) return;
    var on = s.style.display !== "block"; s.style.display = on ? "block" : "none";
    if (on) { var i = document.getElementById("rkQ"); if (i) i.focus(); } else { q = ""; list(); }
  };
  function ico() { return tab === "puz" ? "🧩" : "🪙"; }
  function loadPuz() {
    var tg = window.Telegram && window.Telegram.WebApp;
    fetch("/api/puzzles/top", { headers: { "x-init-data": (tg && tg.initData) || "" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!D || !d || !d.top) return;
        var m = {};
        ["elo", "wins", "games", "diamonds", "best", "pct"].forEach(function (k) { (D[k] || []).forEach(function (p) { if (p.id != null) m[String(p.id)] = p; }); });
        D.puz = d.top.map(function (x) { var o = m[String(x.id)] || {}; return { id: x.id, name: x.name, n: x.n, hasAv: o.hasAv, av: o.av, premium: o.premium, puz: 1 }; });
        render();
      }).catch(function () {});
  }
  function load() {
    loading = true;
    var tg = window.Telegram && window.Telegram.WebApp;
    fetch("/api/leaderboard", { headers: { "x-init-data": (tg && tg.initData) || "" } })
      .then(function (r) { return r.json(); })
      .then(function (j) { D = j; D.puz = []; loading = false; render(); loadPuz(); })
      .catch(function () { loading = false; render(); });
  }
  window.rkOpen = function () {
    css();
    if (!panel) { panel = document.createElement("div"); panel.id = "rkPanel"; document.body.appendChild(panel); }
    panel.style.display = "block"; render(); load();
  };
  window.rkClose = function () { if (panel) panel.style.display = "none"; };
  window.rkIsOpen = function () { return !!panel && panel.style.display !== "none"; };

  window.spUser = function (id) {
    var tg = window.Telegram && window.Telegram.WebApp;
    var old = document.getElementById("spUo"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "spUo";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:0;z-index:100000;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:380px;max-height:90%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:24px;padding:20px 16px;text-align:center;font-family:inherit";
    box.innerHTML = "<div style=\"padding:30px;opacity:.7\">Yuklanmoqda…</div>";
    ov.appendChild(box); document.body.appendChild(ov);
    fetch("/api/user/" + encodeURIComponent(id), { headers: { "x-init-data": (tg && tg.initData) || "" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) { box.innerHTML = "<div style=\"padding:30px\">Yuklab bo‘lmadi</div>"; return; }
        var pct = d.games ? Math.round(d.wins * 100 / d.games) : 0;
        function cell(ic, v, l) { return "<div style=\"background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:10px 2px\"><div style=\"font-size:18px\">" + ic + "</div><div style=\"font-size:19px;font-weight:700\">" + v + "</div><div style=\"font-size:11px;color:#8a8db8\">" + l + "</div></div>"; }
        var av = d.hasAv ? "<img src=\"/api/av/" + encodeURIComponent(d.id) + "\" style=\"width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid #f5b72b\">" : "<div style=\"width:96px;height:96px;border-radius:50%;background:#1a00a8;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:44px;border:4px solid #f5b72b\">👤</div>";
        box.innerHTML = av + "<div style=\"font-size:21px;font-weight:700;margin-top:10px\">" + esc(d.name) + (d.premium ? " 👑" : "") + "</div>" +
          (d.bio ? "<div style=\"font-size:13px;color:#a9b0ff;margin-top:6px\">" + esc(d.bio) + "</div>" : "") +
          "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0\">" +
          cell("📈", d.elo, "ELO") + cell("🪙", d.diamonds, "Tanga") + cell("🏆", d.wins, "G‘alaba") +
          cell("✖️", d.losses, "Mag‘lub") + cell("🤝", d.draws, "Durang") + cell("🎮", d.games, "O‘yinlar") +
          cell("📊", pct + "%", "G‘alaba %") + cell("⭐", d.bestStreak, "Eng yaxshi seriya") + cell("🥇", d.tournWins, "Turnir") +
          "</div><button style=\"width:100%;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#6b5cf0\" onclick=\"document.getElementById('spUo').remove()\">Yopish</button>";
      })
      .catch(function () { box.innerHTML = "<div style=\"padding:30px\">Server bilan aloqa yo‘q</div>"; });
  };
})();
