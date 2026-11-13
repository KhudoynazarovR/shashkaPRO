(function () {
  "use strict";
  var D = null, tab = "blits", flt = "all", q = "", panel = null, loading = false, CACHE = {};
  var TABS = [["bullet", "🚀 Bullet"], ["blits", "⚡ Blits"], ["rapid", "⏱ Rapid"], ["corr", "📮 Yozishma"], ["puz", "🧩 Masala"], ["bots", "🤖 Botlar"]];
  var FLT = [["all", "🌐 Hammasi"], ["friends", "👥 Do‘stlar"], ["region", "📍 Viloyatim"], ["week", "📅 Hafta"]];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function idata() { var tg = window.Telegram && window.Telegram.WebApp; return (tg && tg.initData) || ""; }
  function css() {
    if (document.getElementById("rkStyle2")) return;
    var st = document.createElement("style"); st.id = "rkStyle2";
    st.textContent = "#rkPanel{position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9000;color:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:inherit;background:radial-gradient(circle at 50% 0,#22186a 0,#110c3c 45%,#0c0930 100%);padding-bottom:84px;box-sizing:border-box}" +
      ".rk2{padding:14px 12px 0}.rkHd{display:flex;align-items:center;justify-content:space-between}.rkHd b{font-size:24px;font-weight:900}.rkHd button{width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);font-size:18px;color:#fff}" +
      ".rkS2{display:none;margin-top:10px}.rkS2 input{width:100%;padding:11px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;box-sizing:border-box;font-size:15px}" +
      ".rkTb{display:flex;gap:6px;margin:12px 0 10px;overflow-x:auto;scrollbar-width:none}.rkTb::-webkit-scrollbar{display:none}.rkTb button{flex:none;border:0;padding:9px 12px;border-radius:12px;font-size:13.5px;font-weight:700;color:#cfd3ff;background:rgba(255,255,255,.06)}.rkTb button.on{background:#6d5cf0;color:#fff;box-shadow:0 3px 10px rgba(109,92,240,.4)}" +
      ".rkCh{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;scrollbar-width:none}.rkCh::-webkit-scrollbar{display:none}.rkCh button{flex:none;white-space:nowrap;padding:6px 11px;border-radius:20px;font-size:12.5px;border:1px solid rgba(255,255,255,.14);background:none;color:#dfe2ff}.rkCh button.on{background:rgba(255,255,255,.16);border-color:transparent;color:#fff}" +
      ".rkPd{display:flex;align-items:flex-end;gap:8px;margin:14px 0 14px}.rkPd>div{flex:1;min-width:0;text-align:center;border-radius:18px;padding:14px 4px 10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);position:relative;cursor:pointer}" +
      ".rkPd .q1{padding-top:20px;background:linear-gradient(180deg,rgba(245,184,46,.25),rgba(245,184,46,.05));border-color:rgba(245,184,46,.6)}.rkPd .q2{border-color:rgba(190,200,220,.45)}.rkPd .q3{border-color:rgba(205,127,50,.5)}" +
      ".rkPd .md{position:absolute;top:-13px;left:50%;transform:translateX(-50%);font-size:22px}.rkPd .ra{width:52px;height:52px;margin:0 auto 6px}.rkPd .q1 .ra{width:62px;height:62px;box-shadow:0 0 0 3px #f5b82e}" +
      ".rkPd b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px}.rkPd em{font-style:normal;display:block;font-size:19px;font-weight:900;color:#f5d36a;margin-top:2px}.rkPd small{opacity:.6;font-size:11px}" +
      ".ra{width:36px;height:36px;border-radius:50%;background:#2b2f6b;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none;overflow:hidden}.ra img{width:100%;height:100%;object-fit:cover}" +
      ".rkL{border-radius:18px;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:12px}" +
      ".rkR{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid rgba(255,255,255,.06);cursor:pointer}.rkR:first-child{border-top:0}.rkR.me{background:rgba(109,92,240,.2)}" +
      ".rkR .n{width:26px;text-align:center;opacity:.6;font-weight:700;font-size:14px;flex:none}.rkR .t{flex:1;min-width:0}.rkR .t b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rkR .t small{opacity:.55;font-size:12px}" +
      ".rkR .v{text-align:right;flex:none}.rkR .v b{font-size:17px}.rkR .v small{display:block;font-size:11.5px;font-weight:700}.rkUp{color:#22c55e}.rkDn{color:#ef4444}.rkQ{opacity:.55;font-weight:700}" +
      ".rkE{padding:22px;text-align:center;opacity:.7;font-size:14px;line-height:1.5}" +
      ".rkMe{position:fixed;left:12px;right:12px;bottom:74px;z-index:9001;display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:16px;background:linear-gradient(90deg,#4b3ac9,#6d5cf0);box-shadow:0 8px 24px rgba(0,0,0,.4)}" +
      ".rkMe .ra{width:38px;height:38px}.rkMe b{font-size:18px}.rkMe small{opacity:.85;font-size:12px;display:block}.rkMe .x{margin-left:auto;text-align:right}";
    document.head.appendChild(st);
  }
  function av(p) { return "<div class='ra'>" + (p.id && p.hasAv ? "<img src='/api/av/" + encodeURIComponent(p.id) + "'>" : (p.bot ? "🤖" : "👤")) + "</div>"; }
  function rv(p) { return fmt(p.r) + (p.prov ? "<span class='rkQ'>?</span>" : ""); }
  function dlt(d) { if (d == null) return "<small style='opacity:.35'>—</small>"; if (d > 0) return "<small class='rkUp'>▲ " + d + "</small>"; if (d < 0) return "<small class='rkDn'>▼ " + (-d) + "</small>"; return "<small style='opacity:.5'>0</small>"; }
  function sub(p) { return tab === "puz" ? "✅ " + p.n + " ta masala" : tab === "bots" ? (p.n ? p.n + " o‘yin · " + (p.w || 0) + "/" + (p.l || 0) + "/" + (p.dr || 0) : "hali o‘yin yo‘q") : p.n + " o‘yin" + (p.pct ? " · " + p.pct + "%" : ""); }
  function val(p) { return tab === "puz" ? "<b>" + fmt(p.n) + "</b>" : "<b>" + rv(p) + "</b>" + (tab === "bots" ? "" : dlt(flt === "week" ? p.d : p.d)); }
  function click(p) { return p.bot ? "" : " onclick=\"spUser('" + esc(p.id) + "')\""; }
  function render() {
    if (!panel) return;
    var h = "<div class='rk2'><div class='rkHd'><b>📊 Reyting</b><button onclick='rkSearch()'>🔍</button></div>" +
      "<div class='rkS2' id='rkS'><input id='rkQ' placeholder='Ism bo‘yicha qidirish' value=\"" + esc(q) + "\" oninput='rkQ(this.value)'></div>" +
      "<div class='rkTb'>" + TABS.map(function (t) { return "<button class='" + (t[0] === tab ? "on" : "") + "' onclick=\"rkTab('" + t[0] + "')\">" + t[1] + "</button>"; }).join("") + "</div>" +
      (tab === "puz" || tab === "bots" ? "" : "<div class='rkCh'>" + FLT.map(function (f) { return "<button class='" + (f[0] === flt ? "on" : "") + "' onclick=\"rkF('" + f[0] + "')\">" + f[1] + "</button>"; }).join("") + "</div>") +
      "<div id='rkSeasonSlot'></div><div id='rkBody'></div></div><div class='rkMe' id='rkMe' style='display:none'></div>";
    panel.innerHTML = h;
    var s = document.getElementById("rkS"); if (s && q) s.style.display = "block";
    var se = document.getElementById("rkSeason"); if (se) document.getElementById("rkSeasonSlot").appendChild(se);
    body();
  }
  function body() {
    var el = document.getElementById("rkBody"), me = document.getElementById("rkMe"); if (!el) return;
    if (!D) { el.innerHTML = "<div class='rkE'>" + (loading ? "Yuklanmoqda…" : "Ma‘lumot olinmadi. Qayta urinib ko‘ring.") + "</div>"; if (me) me.style.display = "none"; return; }
    var full = D.list || [], arr = full, qq = q.trim().toLowerCase();
    if (qq) arr = arr.filter(function (p) { return String(p.name || "").toLowerCase().indexOf(qq) >= 0; });
    var h = "";
    if (!arr.length) {
      h = "<div class='rkE'>" + (qq ? "Topilmadi." : flt === "region" && !D.region ? "Viloyatingiz tanlanmagan — Menyu → Viloyatlar jangi." : flt === "week" ? "Bu hafta hali hech kim reyting yig‘magan." : tab === "puz" || tab === "bots" ? "Hozircha bo‘sh." :
        "Jadvalga oxirgi 2 haftada kamida 3 ta o‘yin o‘ynaganlar chiqadi (<b>?</b> — reyting hali aniqlanmoqda).<br>O‘ynang — reytingingiz shu yerda paydo bo‘ladi!") + "</div>";
    } else {
      var top = !qq && arr.length >= 3, rest = top ? arr.slice(3) : arr;
      if (top) {
        var pc = function (p, k) { return "<div class='q" + k + "'" + click(p) + "><span class='md'>" + (k === 1 ? "👑" : k === 2 ? "🥈" : "🥉") + "</span>" + av(p) + "<b>" + esc(p.name) + "</b><em>" + (tab === "puz" ? fmt(p.n) : rv(p)) + "</em><small>" + sub(p) + "</small></div>"; };
        h += "<div class='rkPd'>" + pc(arr[1], 2) + pc(arr[0], 1) + pc(arr[2], 3) + "</div>";
      }
      if (rest.length) h += "<div class='rkL'>" + rest.map(function (p) {
        return "<div class='rkR" + (p.id === myId() ? " me" : "") + "'" + click(p) + "><span class='n'>" + (full.indexOf(p) + 1) + "</span>" + av(p) + "<div class='t'><b>" + esc(p.name) + (p.premium ? " 👑" : "") + "</b><small>" + sub(p) + "</small></div><div class='v'>" + val(p) + "</div></div>";
      }).join("") + "</div>";
    }
    el.innerHTML = h;
    // pastda: sizning o'rningiz
    if (me) {
      var M = D.me;
      if (!M || tab === "bots" || tab === "puz") { me.style.display = "none"; }
      else {
        me.style.display = "flex";
        me.innerHTML = av({ id: myId(), hasAv: M.hasAv }) + "<div><small>Sizning o‘rningiz</small><b>" + (M.pos ? "#" + M.pos + " · " : "") + fmt(M.r) + (M.prov ? "?" : "") + "</b></div>" +
          "<div class='x'><small>" + (M.prov ? "«?» — yana o‘ynang" : "Shu hafta") + "</small>" + (M.prov ? "" : "<b class='" + (M.d > 0 ? "rkUp" : M.d < 0 ? "rkDn" : "") + "'>" + (M.d == null ? "—" : (M.d > 0 ? "▲ " : M.d < 0 ? "▼ " : "") + Math.abs(M.d)) + "</b>") + "</div>";
      }
    }
  }
  function myId() { var tg = window.Telegram && window.Telegram.WebApp; var u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user; return u ? String(u.id) : ""; }
  window.rkTab = function (t) { tab = t; if (t === "puz" || t === "bots") flt = "all"; load(); };
  window.rkF = function (f) { flt = f; load(); };
  window.rkQ = function (v) { q = v; body(); };
  window.rkSearch = function () {
    var s = document.getElementById("rkS"); if (!s) return;
    var on = s.style.display !== "block"; s.style.display = on ? "block" : "none";
    if (on) { var i = document.getElementById("rkQ"); if (i) i.focus(); } else { q = ""; body(); }
  };
  function load() {
    var key = tab + "|" + flt, c = CACHE[key];
    D = c && Date.now() - c.t < 60000 ? c.d : null; loading = !D; render();
    if (D) return;
    var url = tab === "puz" ? "/api/puzzles/top" : "/api/rating?cat=" + tab + "&f=" + flt;
    fetch(url, { headers: { "x-init-data": idata() } }).then(function (r) { return r.json(); }).then(function (j) {
      var d = tab === "puz" ? { list: ((j && j.top) || []).map(function (x) { return { id: x.id, name: x.name, n: x.n, hasAv: true }; }) } : j;
      CACHE[key] = { t: Date.now(), d: d };
      if (key === tab + "|" + flt) { D = d; loading = false; render(); }
    }).catch(function () { loading = false; render(); });
  }
  window.rkOpen = function () {
    css();
    if (!panel) { panel = document.createElement("div"); panel.id = "rkPanel"; document.body.appendChild(panel); }
    panel.style.display = "block"; CACHE = {}; load();
    seasonBar();
  };
  function seasonBar() {   // 🏆 oylik mavsum banneri
    var tg = window.Telegram && window.Telegram.WebApp;
    fetch("/api/season", { headers: { "x-init-data": (tg && tg.initData) || "" } }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || d.error || !panel) return;
      var MN = ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"], mn = MN[+d.m.slice(5, 7)];
      var el = document.getElementById("rkSeason"); if (!el) { el = document.createElement("div"); el.id = "rkSeason"; } var _sl = document.getElementById("rkSeasonSlot"); if (_sl && el.parentNode !== _sl) _sl.appendChild(el);
      el.style.cssText = "margin:0 0 12px;padding:10px 12px;border-radius:16px;background:linear-gradient(135deg,#3a2a00,#1d1f45);border:1px solid #f5b72b;color:#fff;cursor:pointer;font-size:14px";
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
          (d.rt ? "<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:16px 0 0\">" + [["bullet", "🚀", "Bullet"], ["blits", "⚡", "Blits"], ["rapid", "⏱", "Rapid"], ["corr", "📮", "Yozishma"]].map(function (c) { var x = d.rt[c[0]] || { r: 1500, prov: true, n: 0 }; return "<div style=\"background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:8px 2px\"><div style=\"font-size:18px\">" + c[1] + "</div><b style=\"font-size:16px\">" + x.r + (x.prov ? "<span style=\"opacity:.55\">?</span>" : "") + "</b><div style=\"font-size:10.5px;opacity:.6\">" + c[2] + " · " + x.n + "</div></div>"; }).join("") + "</div>" : "") +
          "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 16px\">" +
          cell("🪙", d.diamonds, "Tanga") + cell("🏆", d.wins, "G‘alaba") +
          cell("🤝", d.draws, "Durang") + cell("🎮", d.games, "O‘yinlar") +
          cell("📊", pct + "%", "G‘alaba %") + cell("⭐", d.bestStreak, "Eng yaxshi seriya") + cell("🥇", d.tournWins, "Turnir") + cell("✖️", d.losses, "Mag‘lub") +
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
          (function () {   // ❤️ profilga like (kuniga 1 marta) va 🎖 unvon
            var lb = mk("❤️ Yoqdi", "linear-gradient(90deg,#be123c,#f43f5e)", function () {
              lb.disabled = true;
              post("/api/social/like", { uid: String(d.id) }).then(function (r) { lb.disabled = false; if (r.likes != null) lb.innerHTML = "❤️ " + r.likes + (r.ok ? " · rahmat!" : ""); if (r.error) { lb.innerHTML = "❤️ " + (r.likes != null ? r.likes + " · " : "") + esc(r.error); } });
            });
            fetch("/api/social/user?uid=" + encodeURIComponent(d.id), { headers: { "x-init-data": (tg && tg.initData) || "" } }).then(function (r) { return r.json(); }).then(function (r) {
              if (!r || r.error) return; lb.innerHTML = (r.liked ? "❤️ " : "🤍 ") + r.likes + (r.liked ? " · bugun yoqtirdingiz" : " · Yoqdi"); lb.title = r.rank;
            }).catch(function () {});
          })();
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
              (d.cheat ? "<div style=\"font-size:13px;margin:3px 0\">🕵️ Dragon bilan moslik: <b style=\"color:" + (d.cheat.avg >= 80 ? "#ff6b7f" : "#7ee08a") + "\">" + d.cheat.avg + "%</b> (" + d.cheat.n + " ta g‘alaba tahlili)</div>" : "") +
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
