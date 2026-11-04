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
          "<div class='rkw'" + (p.premium ? " style='color:#ffd54a'" : "") + ">" + esc(p.name) + (p.premium ? " 👑" : "") + (sub ? "<small>" + sub + "</small>" : "") + "</div><div class='rkv'>" + ico() + " " + fmt(p[key]) + suf + "</div>" + dl(p) + "</div>";
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
  function ico() { return ({ puz: "🧩", elo: "📊", diamonds: "🪙", wins: "🏆", games: "🎮" })[tab] || ""; }
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
    seasonBar();
  };
  function seasonBar() {   // 🏆 oylik mavsum banneri
    var tg = window.Telegram && window.Telegram.WebApp;
    fetch("/api/season", { headers: { "x-init-data": (tg && tg.initData) || "" } }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || d.error || !panel) return;
      var MN = ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"], mn = MN[+d.m.slice(5, 7)];
      var el = document.getElementById("rkSeason"); if (!el) { el = document.createElement("div"); el.id = "rkSeason"; panel.insertBefore(el, panel.firstChild.nextSibling); }
      el.style.cssText = "margin:10px 12px;padding:12px;border-radius:16px;background:linear-gradient(135deg,#3a2a00,#1d1f45);border:1px solid #f5b72b;color:#fff;cursor:pointer;font-size:14px";
      el.innerHTML = "🏆 <b>" + mn + " mavsumi</b> — oy oxirida ELO TOP-10 ga sovrin<div style='font-size:12px;opacity:.8;margin-top:4px'>🥇 2000 🪙 + 30 kun 👑 · 🥈 1000 🪙 + 7 kun · 🥉 500 🪙 + 7 kun · 4–10: 200 🪙<br>Shart: oyda kamida " + d.min + " ta o‘yin · siz: <b>" + Math.min(d.myGames, d.min) + "/" + d.min + "</b> · batafsil ›</div>";
      el.onclick = function () {
        var ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px";
        ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
        var h = "<div style='width:100%;max-width:380px;max-height:85%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #f5b72b;border-radius:22px;padding:16px'><b style='font-size:18px'>🏆 " + mn + " mavsumi — joriy TOP-10</b><div style='font-size:12px;opacity:.7;margin:4px 0 10px'>Faqat shu oyda " + d.min + "+ o‘yin o‘ynaganlar</div>";
        if (!d.top.length) h += "<div style='opacity:.7;padding:10px 0'>Hali hech kim shartni bajarmagan — birinchi bo‘ling!</div>";
        d.top.forEach(function (x, i) { h += "<div style='display:flex;justify-content:space-between;padding:6px 2px;border-bottom:1px solid #1c2147'><span>" + (["🥇", "🥈", "🥉"][i] || (i + 1) + ".") + " " + esc(x.name) + "</span><b>" + x.elo + "</b></div>"; });
        if (d.last && d.last.top && d.last.top.length) h += "<div style='font-size:12px;opacity:.7;margin-top:10px'>O‘tgan mavsum chempioni: <b>" + esc(d.last.top[0].name) + "</b> (" + d.last.top[0].elo + ")</div>";
        h += "<button style='width:100%;margin-top:12px;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#6b5cf0'>Yopish</button></div>";
        ov.innerHTML = h; ov.querySelector("button").onclick = function () { ov.remove(); }; document.body.appendChild(ov);
      };
    }).catch(function () {});
  }
  window.rkClose = function () { if (panel) panel.style.display = "none"; };
  window.rkIsOpen = function () { return !!panel && panel.style.display !== "none"; };

  window.spReport = function (d, btn) {
    var tg = window.Telegram && window.Telegram.WebApp;
    var R = [["insult", "Haqorat / so‘kinish"], ["cheat", "Chiterlik"], ["scam", "Aldash / firibgarlik"], ["spam", "Spam"], ["name", "Nomaqbul ism yoki rasm"], ["other", "Boshqa"]];
    var ov = document.createElement("div"); ov.id = "spRep";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var b = document.createElement("div");
    b.style.cssText = "width:100%;max-width:360px;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:22px;padding:18px 14px;font-family:inherit";
    b.innerHTML = "<div style=\"font-size:17px;font-weight:700;margin-bottom:10px;text-align:center\">⚠️ “" + esc(d.name) + "” ustidan shikoyat</div>" +
      R.map(function (r) { return "<label style=\"display:flex;gap:10px;align-items:center;padding:9px 6px;font-size:15px;border-bottom:1px solid #1c2147\"><input type=\"radio\" name=\"spR\" value=\"" + r[0] + "\" style=\"width:18px;height:18px\">" + r[1] + "</label>"; }).join("") +
      "<textarea id=\"spRn\" maxlength=\"200\" placeholder=\"Izoh (ixtiyoriy)\" style=\"width:100%;box-sizing:border-box;margin-top:10px;height:64px;border-radius:12px;border:1px solid #262b5a;background:#161a3a;color:#fff;padding:8px;font:inherit;font-size:14px\"></textarea>" +
      "<div id=\"spRe\" style=\"color:#ff6b7f;font-size:13px;min-height:18px;margin:6px 0\"></div>" +
      "<div style=\"display:flex;gap:8px\"><button id=\"spRc\" style=\"flex:1;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#3a3f6b\">Bekor</button><button id=\"spRs\" style=\"flex:1;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#c0392b\">Yuborish</button></div>";
    ov.appendChild(b); document.body.appendChild(ov);
    b.querySelector("#spRc").onclick = function () { ov.remove(); };
    b.querySelector("#spRs").onclick = function () {
      var sel = b.querySelector("input[name=spR]:checked"), e = b.querySelector("#spRe");
      if (!sel) { e.textContent = "Sababni tanlang"; return; }
      var sb = this; sb.disabled = true;
      fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": (tg && tg.initData) || "" }, body: JSON.stringify({ uid: d.id, reason: sel.value, note: b.querySelector("#spRn").value }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.error) { e.textContent = j.error; sb.disabled = false; return; }
          ov.remove();
          if (btn) { btn.textContent = "✓ Shikoyat yuborildi"; btn.disabled = true; }
        })
        .catch(function () { e.textContent = "Server bilan aloqa yo‘q"; sb.disabled = false; });
    };
  };

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
        if (!document.getElementById("spPrRingCss")) { var _rs = document.createElement("style"); _rs.id = "spPrRingCss"; _rs.textContent = "@keyframes spPrSpin{to{transform:rotate(360deg)}}.spPrRing{position:relative;width:110px;height:110px;margin:0 auto;display:flex;align-items:center;justify-content:center}.spPrRing::before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(#ffd54a,#b8860b,#fff3b0,#c98a00,#ffd54a);animation:spPrSpin 3s linear infinite;box-shadow:0 0 18px #f5b72b99}.spPrRing>*{position:relative;z-index:1}.spPrRing>b{position:absolute;top:-14px;left:50%;transform:translateX(-50%) rotate(-8deg);font-size:26px;z-index:2}"; document.head.appendChild(_rs); }
        var av = d.hasAv ? "<img src=\"/api/av/" + encodeURIComponent(d.id) + "\" style=\"width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid " + (d.premium ? "#0b0e1a" : "#f5b72b") + "\">" : "<div style=\"width:96px;height:96px;border-radius:50%;background:#1a00a8;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:44px;border:4px solid " + (d.premium ? "#0b0e1a" : "#f5b72b") + "\">👤</div>";
        if (d.premium) av = "<div class=\"spPrRing\"><b>👑</b>" + av.replace("margin:0 auto;", "") + "</div>";
        box.innerHTML = av + "<div style=\"font-size:21px;font-weight:700;margin-top:10px\">" + esc(d.name) + (d.premium ? " 👑" : "") + "</div>" + (d.elchi ? "<div style=\"font-size:12px;color:#f5b72b;margin-top:2px\">🏅 Elchi</div>" : "") + (d.region ? "<div style=\"font-size:12px;color:#7ee08a;margin-top:2px\">📍 " + esc(d.region) + "</div>" : "") + (d.titles && d.titles.length ? "<div style=\"font-size:12px;color:#ffd54a;margin-top:4px\">" + d.titles.map(esc).join("<br>") + "</div>" : "") +
          (d.bio ? "<div style=\"font-size:13px;color:#a9b0ff;margin-top:6px\">" + esc(d.bio) + "</div>" : "") +
          "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0\">" +
          cell("📈", d.elo, "ELO") + cell("🪙", d.diamonds, "Tanga") + cell("🏆", d.wins, "G‘alaba") +
          cell("✖️", d.losses, "Mag‘lub") + cell("🤝", d.draws, "Durang") + cell("🎮", d.games, "O‘yinlar") +
          cell("📊", pct + "%", "G‘alaba %") + cell("⭐", d.bestStreak, "Eng yaxshi seriya") + cell("🥇", d.tournWins, "Turnir") +
          "</div><button style=\"width:100%;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#6b5cf0\" onclick=\"document.getElementById('spUo').remove()\">Yopish</button>";
        (function () {
          var stt = window.lbFriendState ? window.lbFriendState(d.id) : "ok";
          if ((stt !== "ok" && stt !== "friend") || !window.lbFriendAdd) return;
          var fb = document.createElement("button"); fb.setAttribute("data-fb", "1");
          fb.style.cssText = "width:100%;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;margin-bottom:8px;background:" + (stt === "friend" ? "#3a3f6b" : "#2e7d32");
          fb.textContent = stt === "friend" ? "✓ Do‘stsiz" : "➕ Do‘st bo‘lish";
          if (stt === "friend") {
            fb.onclick = function () {
              if (!window.lbFriendRemove || !confirm("“" + d.name + "” bilan do‘stlikdan chiqasizmi?")) return;
              window.lbFriendRemove(d.id);
              fb.textContent = "Do‘stlikdan chiqildi"; fb.disabled = true; fb.style.background = "#3a3f6b";
            };
          }
          else fb.onclick = function () { window.lbFriendAdd(d.id); fb.textContent = "✓ Yuborildi"; fb.disabled = true; fb.style.background = "#3a3f6b"; };
          box.insertBefore(fb, box.lastElementChild);
        })();
        (function () {   // 📊 g'alaba foizi chizig'i + 🪨 toshlar to'plami
          var grid = box.querySelector("div[style*='grid-template-columns']"); if (!grid) return;
          var w = document.createElement("div");
          var h = "<div style='background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left'><div style='display:flex;justify-content:space-between;font-size:14px'><span>📈 G‘alaba foizi</span><b style='color:#7ee08a'>" + pct + "%</b></div>" +
            "<div style='height:8px;background:#262b5a;border-radius:5px;margin-top:8px'><div style='height:8px;width:" + pct + "%;background:linear-gradient(90deg,#22c55e,#10b981);border-radius:5px'></div></div></div>";
          if (d.stones && d.stones.length) {
            h += "<div style='background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left'><div style='display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px'><span>🪨 Toshlar to‘plami</span><span style='opacity:.7'>" + d.stones.length + " ta</span></div><div style='display:flex;gap:12px;overflow-x:auto;padding-bottom:4px'>" +
              d.stones.map(function (s) { return "<div style='flex:none;width:62px;text-align:center;position:relative'><img src='/api/shop/img?id=" + encodeURIComponent(s.id) + "&k=w' style='width:52px;height:52px;border-radius:50%;object-fit:cover;background:#0b0e1a;border:2px solid " + (s.eq ? "#22c55e" : "#262b5a") + "' onerror=\"this.style.visibility='hidden'\">" + (s.eq ? "<span style='position:absolute;top:-4px;right:2px;font-size:14px'>✅</span>" : "") + "<div style='font-size:11px;opacity:.75;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>" + esc(s.name) + "</div></div>"; }).join("") + "</div></div>";
          }
          w.innerHTML = h; grid.parentNode.insertBefore(w, grid.nextSibling);
        })();
        (function () {   // 🏅 yutuqlar (faqat ochilganlari)
          if (!d.ach || !d.ach.list || !d.ach.list.length) return;
          var grid = box.querySelector("div[style*='grid-template-columns']"); if (!grid) return;
          var w = document.createElement("div");
          w.innerHTML = "<div style='background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left'><div style='display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px'><span>🏅 Yutuqlar</span><span style='opacity:.7'>" + d.ach.n + "/" + d.ach.total + "</span></div><div style='display:flex;flex-wrap:wrap;gap:6px'>" +
            d.ach.list.map(function (a) { return "<span title='" + esc(a.name) + "' style='width:38px;height:38px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;background:linear-gradient(135deg,#3a2a00,#1d1f45);border:1px solid #f5b72b'>" + a.ic + "</span>"; }).join("") + "</div></div>";
          grid.parentNode.insertBefore(w, grid.nextSibling);
        })();
        (function () {   // 🎮 o'yinga taklif · 🎁 tanga sovg'a · 👑 Premium sovg'a
          var stt = window.lbFriendState ? window.lbFriendState(d.id) : "ok";
          if (stt === "me" || stt === "bot" || stt === "blocked" || !/^\d+$/.test(String(d.id))) return;
          var BS = "width:100%;border:0;border-radius:14px;padding:12px;font-size:15px;font-weight:700;color:#fff;margin-bottom:8px;";
          function mk(txt, bg, fn) { var b = document.createElement("button"); b.style.cssText = BS + "background:" + bg; b.innerHTML = txt; b.onclick = fn; box.insertBefore(b, box.lastElementChild); return b; }
          function post(u, body) { return fetch(u, { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": (tg && tg.initData) || "" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
          function modal(html) {
            var m = document.createElement("div"); m.style.cssText = "position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px";
            m.onclick = function (e) { if (e.target === m) m.remove(); };
            m.innerHTML = "<div style='width:100%;max-width:360px;background:#141833;color:#fff;border:1px solid #2c3270;border-radius:22px;padding:18px 16px;text-align:center;font-family:inherit'>" + html + "</div>";
            document.body.appendChild(m); return m;
          }
          var my = d.myDiamonds || 0, F = d.giftFee || [0.05, 5];
          function fee(n) { return Math.max(F[1], Math.ceil(n * F[0])); }
          if (window.lbChallengeUid) {
            var on = window.lbIsOnline ? window.lbIsOnline(d.id) : true;
            var cb = mk(on ? "🎮 O‘yinga taklif" : "🎮 O‘yinga taklif <span style='font-weight:400;font-size:12px;opacity:.75'>· oflayn</span>", on ? "linear-gradient(90deg,#5b6cf0,#7c4dce)" : "#2a2f5c", function () {
              if (!(window.lbIsOnline && window.lbIsOnline(d.id))) { cb.innerHTML = "😴 " + esc(d.name) + " hozir oflayn"; return; }
              if (window.lbStakeInvite) window.lbStakeInvite(d.id, d.name, 0);
            });
            var sb = mk("💰 Tanga tikib o‘ynash", "linear-gradient(90deg,#f59e0b,#ea580c)", function () {
              if (!(window.lbIsOnline && window.lbIsOnline(d.id))) { sb.innerHTML = "😴 " + esc(d.name) + " hozir oflayn"; return; }
              if (window.lbStakeInvite) window.lbStakeInvite(d.id, d.name, 50);
            });
          }
          mk("📮 Yozishma o‘yiniga taklif", "linear-gradient(90deg,#7c3aed,#0ea5e9)", function () {
            var m = modal("<b style='font-size:18px'>📮 Yozishma o‘yini</b><div style='opacity:.75;font-size:13px;margin:6px 0 12px'>" + esc(d.name) + " ga taklif. Har yurishga qancha vaqt?</div><div style='display:flex;gap:6px'>" +
              [[12, "12 soat"], [24, "1 kun"], [72, "3 kun"]].map(function (x) { return "<button data-cp='" + x[0] + "' style='flex:1;border:0;border-radius:12px;padding:12px 0;font-size:15px;font-weight:700;color:#fff;background:" + (x[0] === 24 ? "#2e7d32" : "#262b66") + "'>" + x[1] + "</button>"; }).join("") + "</div><div id='cpE' style='font-size:13px;min-height:18px;margin-top:8px'></div>");
            [].forEach.call(m.querySelectorAll("[data-cp]"), function (b) {
              b.onclick = function () {
                var go = function () { window.corrInvite(d.id, +b.getAttribute("data-cp")).then(function (r) { var e = m.querySelector("#cpE"); if (r.error) { e.style.color = "#ff6b7f"; e.textContent = r.error; return; } e.style.color = "#7ee08a"; e.textContent = "✓ Taklif yuborildi — bot " + d.name + " ga xabar beradi"; setTimeout(function () { m.remove(); }, 1600); }); };
                if (window.corrInvite) go(); else { var s = document.createElement("script"); s.src = "/corrpanel.js?v=" + Date.now(); s.onload = go; document.head.appendChild(s); }
              };
            });
          });
          mk("🎁 Tanga sovg‘a qilish", "linear-gradient(90deg,#e0446a,#d62f4f)", function () {
            var m = modal("<b style='font-size:19px'>🎁 Tanga sovg‘a qilish</b><div style='opacity:.7;font-size:13px;margin:4px 0 12px'>Sizda: <b>" + my + " 🪙</b></div>" +
              "<div style='display:flex;gap:6px'>" + [10, 50, 100, 500].map(function (v) { return "<button data-v='" + v + "' style='flex:1;border:2px solid #f59e0b;background:transparent;color:#f5b72b;border-radius:12px;padding:9px 0;font-size:15px;font-weight:700'>" + v + "</button>"; }).join("") + "</div>" +
              "<input id='gfN' type='number' inputmode='numeric' min='1' placeholder='Miqdor kiriting' style='width:100%;box-sizing:border-box;margin-top:10px;border-radius:12px;border:1px solid #2c3270;background:#1c2150;color:#fff;padding:12px;font-size:16px;font-family:inherit'>" +
              "<div id='gfI' style='font-size:13px;opacity:.8;min-height:20px;margin:8px 0'></div><div id='gfE' style='font-size:13px;color:#ff6b7f;min-height:18px'></div>" +
              "<div style='display:flex;gap:8px;margin-top:6px'><button id='gfC' style='flex:1;border:1px solid #2c3270;background:transparent;color:#fff;border-radius:14px;padding:12px;font-size:15px'>Bekor</button><button id='gfS' style='flex:2;border:0;background:linear-gradient(90deg,#f59e0b,#f97316);color:#fff;border-radius:14px;padding:12px;font-size:15px;font-weight:700'>Yuborish 🎁</button></div>");
            var inp = m.querySelector("#gfN"), info = m.querySelector("#gfI"), er = m.querySelector("#gfE");
            function upd() { var n = Math.floor(+inp.value || 0); info.innerHTML = n > 0 ? "Miqdor: " + n + " 🪙 + xizmat haqi: " + fee(n) + " 🪙 = <b>" + (n + fee(n)) + " 🪙</b>" : ""; }
            inp.oninput = upd;
            [].forEach.call(m.querySelectorAll("[data-v]"), function (b) { b.onclick = function () { inp.value = b.getAttribute("data-v"); upd(); }; });
            m.querySelector("#gfC").onclick = function () { m.remove(); };
            m.querySelector("#gfS").onclick = function () {
              var n = Math.floor(+inp.value || 0), sb = this; if (n < 1) { er.textContent = "Miqdorni kiriting"; return; }
              sb.disabled = true;
              post("/api/gift/coins", { uid: d.id, amount: n }).then(function (r) {
                if (r.error) { er.textContent = r.error; sb.disabled = false; return; }
                my = r.diamonds; m.innerHTML = "<div style='width:100%;max-width:360px;background:#141833;color:#fff;border-radius:22px;padding:26px 16px;text-align:center'><div style='font-size:52px'>🎁</div><b style='font-size:18px'>" + n + " 🪙 yuborildi!</b><div style='opacity:.75;font-size:13px;margin-top:6px'>" + esc(d.name) + " ga xabar boradi</div></div>";
                setTimeout(function () { m.remove(); }, 1800);
              }).catch(function () { er.textContent = "Server bilan aloqa yo‘q"; sb.disabled = false; });
            };
          });
          mk("👑 Premium sovg‘a qilish", "linear-gradient(90deg,#9b4dff,#d97a6c)", function () {
            var plan = "m";
            var m = modal("<b style='font-size:19px'>👑 Premium sovg‘a</b><div style='opacity:.7;font-size:13px;margin:4px 0 12px'>Sizda: <b>" + my + " 🪙</b></div>" +
              "<div style='display:flex;gap:8px'><button data-p='w' style='flex:1;border-radius:12px;padding:10px 0;font-size:14px;font-weight:700'>1 hafta<br><span style='font-weight:400'>300 🪙</span></button><button data-p='m' style='flex:1;border-radius:12px;padding:10px 0;font-size:14px;font-weight:700'>1 oy<br><span style='font-weight:400'>800 🪙</span></button></div>" +
              "<div id='pgT' style='background:#fff3c4;color:#5a3b00;border:2px solid #f5b72b;border-radius:14px;padding:12px;margin:12px 0 6px;text-align:left;font-size:14px;line-height:1.5'></div><div id='pgE' style='font-size:13px;color:#ff6b7f;min-height:18px'></div>" +
              "<div style='display:flex;gap:8px;margin-top:6px'><button id='pgC' style='flex:1;border:1px solid #2c3270;background:transparent;color:#fff;border-radius:14px;padding:12px;font-size:15px'>Bekor</button><button id='pgS' style='flex:2;border:0;background:linear-gradient(90deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:12px;font-size:15px;font-weight:700'>👑 Sovg‘a qilish</button></div>");
            function paint() {
              [].forEach.call(m.querySelectorAll("[data-p]"), function (b) { var on = b.getAttribute("data-p") === plan; b.style.border = "2px solid " + (on ? "#a855f7" : "#2c3270"); b.style.background = on ? "#2a1f5c" : "transparent"; b.style.color = "#fff"; });
              m.querySelector("#pgT").innerHTML = "<b>" + esc(d.name) + "</b> ga " + (plan === "m" ? "1 oylik" : "1 haftalik") + " Premium sovg‘a qilmoqchimisiz?<br>Sizdan <b>" + (plan === "m" ? 800 : 300) + " 🪙</b> yechiladi.";
            }
            paint();
            [].forEach.call(m.querySelectorAll("[data-p]"), function (b) { b.onclick = function () { plan = b.getAttribute("data-p"); paint(); }; });
            m.querySelector("#pgC").onclick = function () { m.remove(); };
            m.querySelector("#pgS").onclick = function () {
              var sb = this; sb.disabled = true;
              post("/api/gift/premium", { uid: d.id, plan: plan }).then(function (r) {
                if (r.error) { m.querySelector("#pgE").textContent = r.error; sb.disabled = false; return; }
                my = r.diamonds; m.innerHTML = "<div style='width:100%;max-width:360px;background:#141833;color:#fff;border-radius:22px;padding:26px 16px;text-align:center'><div style='font-size:52px'>👑</div><b style='font-size:18px'>Premium sovg‘a qilindi!</b><div style='opacity:.75;font-size:13px;margin-top:6px'>" + esc(d.name) + " ga xabar boradi</div></div>";
                setTimeout(function () { m.remove(); }, 1800);
              }).catch(function () { m.querySelector("#pgE").textContent = "Server bilan aloqa yo‘q"; sb.disabled = false; });
            };
          });
        })();
        (function () {   // 🚫 bitta tugma: bloklash / blokdan chiqarish
          var stt = window.lbFriendState ? window.lbFriendState(d.id) : "ok";
          if (stt === "me" || stt === "bot" || !window.lbBlock) return;
          var on = stt === "blocked", bb = document.createElement("button"); bb.setAttribute("data-bb", "1");
          function paint() {
            bb.textContent = on ? "✅ Blokdan chiqarish" : "🚫 Bloklash";
            bb.style.cssText = "width:100%;border-radius:14px;padding:12px;font-size:15px;margin-bottom:8px;background:transparent;border:1px solid " + (on ? "#2e7d32;color:#7ee08a" : "#5a2a35;color:#ff6b7f");
          }
          paint();
          bb.onclick = function () {
            if (!on && !confirm("“" + d.name + "” ni bloklaysizmi? U sizga do‘stlik va o‘yin taklifi yubora olmaydi.")) return;
            on = !on; window.lbBlock(d.id, on); paint();
            var f = box.querySelector("[data-fb]"); if (f && on) f.remove();
          };
          box.insertBefore(bb, box.lastElementChild);
        })();
        (function () {   // ⚠️ shikoyat
          var stt = window.lbFriendState ? window.lbFriendState(d.id) : "ok";
          if (stt === "me" || stt === "bot") return;
          var rb = document.createElement("button");
          rb.textContent = "⚠️ Shikoyat qilish";
          rb.style.cssText = "width:100%;border-radius:14px;padding:12px;font-size:15px;margin-bottom:8px;background:transparent;border:1px solid #6b5a2a;color:#f5b72b";
          rb.onclick = function () { spReport(d, rb); };
          var _bb = box.querySelector("[data-bb]");
          box.insertBefore(rb, _bb || box.lastElementChild);
        })();
        if (d.adm) (function () {   // 🛡 admin: jazo tugmalari
          var w = document.createElement("div");
          w.style.cssText = "border:1px dashed #5a2a35;border-radius:16px;padding:10px;margin-bottom:8px;text-align:left";
          function dt(t) { var x = new Date(t); return ("0" + x.getDate()).slice(-2) + "." + ("0" + (x.getMonth() + 1)).slice(-2) + " " + ("0" + x.getHours()).slice(-2) + ":" + ("0" + x.getMinutes()).slice(-2); }
          function line(k, ic, nm) { var z = (d.sanc && d.sanc[k]) || { n: 0, until: 0 }; return "<div style=\"font-size:13px;margin:3px 0\">" + ic + " " + nm + ": " + (z.until ? "<b style=\"color:#ff6b7f\">" + dt(z.until) + " gacha</b> (" + esc(z.reason) + ")" : "ochiq") + " · " + z.n + " marta</div>"; }
          function act(a, lab, bg) { return "<button data-ma=\"" + a + "\" style=\"flex:1;border:0;border-radius:12px;padding:10px 4px;font-size:13px;color:#fff;background:" + bg + "\">" + lab + "</button>"; }
          function paint() {
            w.innerHTML = "<div style=\"font-size:13px;color:#ff9aa8;font-weight:700;margin-bottom:4px\">🛡 Admin</div>" + line("chat", "💬", "Chat") + line("play", "🎮", "O‘yin") +
              (d.cheat ? "<div style=\"font-size:13px;margin:3px 0\">🕵️ KestoG bilan moslik: <b style=\"color:" + (d.cheat.avg >= 80 ? "#ff6b7f" : "#7ee08a") + "\">" + d.cheat.avg + "%</b> (" + d.cheat.n + " ta g‘alaba tahlili)</div>" : "") +
              "<div style=\"display:flex;gap:6px;margin-top:8px\">" + act("chat", "💬 Chat ⛔", "#8a5a00") + act("play", "🎮 O‘yin ⛔", "#a3263a") + act("undo", "↩️ Bekor", "#3a3f6b") + "</div>";
            [].forEach.call(w.querySelectorAll("[data-ma]"), function (b) {
              b.onclick = function () {
                var a = b.getAttribute("data-ma"), reason = "";
                if (a !== "undo") { reason = prompt("Sabab (masalan: so‘kinish, chiterlik):", a === "play" ? "Chiterlik" : "Haqorat / so‘kinish"); if (reason === null) return; }
                else if (!confirm("“" + d.name + "” dan barcha faol jazolar olib tashlansinmi?")) return;
                b.disabled = true;
                fetch("/api/mod", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": (tg && tg.initData) || "" }, body: JSON.stringify({ uid: d.id, act: a, reason: reason }) })
                  .then(function (r) { return r.json(); })
                  .then(function (j) { if (j.error) { alert(j.error); b.disabled = false; return; } d.sanc = j.sanc; paint(); })
                  .catch(function () { alert("Server bilan aloqa yo‘q"); b.disabled = false; });
              };
            });
          }
          paint();
          box.insertBefore(w, box.lastElementChild);
        })();
      })
      .catch(function () { box.innerHTML = "<div style=\"padding:30px\">Server bilan aloqa yo‘q</div>"; });
  };
})();
