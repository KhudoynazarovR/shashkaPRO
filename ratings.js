(function () {
  "use strict";
  var D = null, tab = "elo", q = "", panel = null, loading = false;
  var TABS = [["elo", "ELO", "elo"], ["wins", "G‘alaba", "wins"], ["games", "O‘yin", "games"], ["diamonds", "Olmos", "diamonds"], ["best", "Seriya", "best"], ["pct", "G‘alaba %", "pct"]];
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
    document.head.appendChild(st);
  }
  function card(label, ico, arr, key, suf) {
    var x = arr && arr[0];
    return "<div class=\"rkk\"><small>" + ico + " " + label + "</small><b>👑 " + (x ? esc(x.name) : "—") + "</b>" +
      (x ? "<small>" + fmt(x[key]) + (suf || "") + "</small>" : "") + "</div>";
  }
  function avatar(p) {
    var a = p.av || "";
    if (a && (a.indexOf("http") === 0 || a.indexOf("/") === 0 || a.indexOf("data:image") === 0)) return "<div class=\"rka\"><img src=\"" + esc(a) + "\"></div>";
    return "<div class=\"rka\">" + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>";
  }
  function render() {
    if (!panel) return;
    var h = "<div class=\"rkh\"><div class=\"rkt\"><span>🏆 Reyting jadvali</span><button class=\"rkb\" onclick=\"rkSearch()\">🔍</button></div>";
    if (D) {
      h += "<div class=\"rkc\">" + card("Boyvachcha", "💎", D.diamonds, "diamonds", " 💎") + card("Eng faol", "🎮", D.games, "games", " o‘yin") +
        card("Eng ko‘p yutgan", "🏆", D.wins, "wins", " g‘alaba") + card("Eng uzun seriya", "🔥", D.best, "best", " ketma-ket") + "</div>";
    }
    h += "</div><div class=\"rks\" id=\"rkS\"><input id=\"rkQ\" placeholder=\"Ism bo‘yicha qidirish\" value=\"" + esc(q) + "\" oninput=\"rkQ(this.value)\"></div>";
    h += "<div class=\"rkn\">" + TABS.map(function (t) { return "<button class=\"" + (t[0] === tab ? "on" : "") + "\" onclick=\"rkTab('" + t[0] + "')\">" + t[1] + "</button>"; }).join("") + "</div>";
    h += "<div class=\"rkl\" id=\"rkList\"></div>";
    panel.innerHTML = h;
    var s = document.getElementById("rkS"); if (s && q) s.style.display = "block";
    list();
  }
  function list() {
    var el = document.getElementById("rkList"); if (!el) return;
    if (!D) { el.innerHTML = "<div class=\"rke\">" + (loading ? "Yuklanmoqda…" : "Ma‘lumot olinmadi. Qayta urinib ko‘ring.") + "</div>"; return; }
    var key = TABS.filter(function (t) { return t[0] === tab; })[0][2];
    var arr = (D[tab] || []);
    var qq = q.trim().toLowerCase();
    if (qq) arr = arr.filter(function (p) { return (p.name || "").toLowerCase().indexOf(qq) >= 0; });
    if (!arr.length) { el.innerHTML = "<div class=\"rke\">" + (tab === "pct" ? "Kamida 20 ta o‘yin o‘ynaganlar chiqadi." : "Hozircha bo‘sh.") + "</div>"; return; }
    var suf = tab === "pct" ? "%" : "";
    el.innerHTML = arr.map(function (p, i) {
      var sub = p.games ? p.games + " o‘yin · " + p.wins + " g‘alaba" : "";
      return "<div class=\"rkr\"><div class=\"rkm\">" + (i < 3 && !qq ? ["🥇", "🥈", "🥉"][i] : (i + 1)) + "</div>" + avatar(p) +
        "<div class=\"rkw\">" + esc(p.name) + (p.premium ? " ⭐" : "") + (sub ? "<small>" + sub + "</small>" : "") + "</div><div class=\"rkv\">" + fmt(p[key]) + suf + "</div></div>";
    }).join("");
  }
  window.rkTab = function (t) { tab = t; render(); };
  window.rkQ = function (v) { q = v; list(); };
  window.rkSearch = function () {
    var s = document.getElementById("rkS"); if (!s) return;
    var on = s.style.display !== "block"; s.style.display = on ? "block" : "none";
    if (on) { var i = document.getElementById("rkQ"); if (i) i.focus(); } else { q = ""; list(); }
  };
  function load() {
    loading = true;
    var tg = window.Telegram && window.Telegram.WebApp;
    fetch("/api/leaderboard", { headers: { "x-init-data": (tg && tg.initData) || "" } })
      .then(function (r) { return r.json(); })
      .then(function (j) { D = j; loading = false; render(); })
      .catch(function () { loading = false; render(); });
  }
  window.rkOpen = function () {
    css();
    if (!panel) { panel = document.createElement("div"); panel.id = "rkPanel"; document.body.appendChild(panel); }
    panel.style.display = "block"; render(); load();
  };
  window.rkClose = function () { if (panel) panel.style.display = "none"; };
  window.rkIsOpen = function () { return !!panel && panel.style.display !== "none"; };
})();
