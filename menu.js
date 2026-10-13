(function () {
  "use strict";
  var tg = window.Telegram && window.Telegram.WebApp, initData = (tg && tg.initData) || "";
  var panel = null, bal = null, canDaily = false, open = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function isLite() { try { return localStorage.getItem("mnLite") === "1"; } catch (e) { return false; } }
  function lite(on) {
    var el = document.getElementById("mnLiteCss");
    if (on && !el) { el = document.createElement("style"); el.id = "mnLiteCss"; el.textContent = "*{animation:none!important;transition:none!important;box-shadow:none!important;text-shadow:none!important}"; document.head.appendChild(el); }
    else if (!on && el) el.remove();
  }
  lite(isLite());
  function css() {
    if (document.getElementById("mnStyle")) return;
    var st = document.createElement("style"); st.id = "mnStyle";
    st.textContent = "#mnPanel{position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9000;background:#0b0e1a;color:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch}" +
      ".mnh{display:flex;align-items:center;gap:12px;padding:18px 14px;background:linear-gradient(135deg,#2b2a78,#5a1f9a);border-radius:0 0 28px 28px}" +
      ".mnav{width:56px;height:56px;border-radius:50%;background:#2a1fc9;display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden;flex:none;border:2px solid #fff}.mnav img{width:100%;height:100%;object-fit:cover}" +
      ".mnu{flex:1;min-width:0}.mnu b{display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".mnb{display:inline-block;margin-top:4px;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,.15)}" +
      ".mnd{border:0;border-radius:14px;padding:10px 12px;background:#f5b82e;color:#222;font-weight:700}.mnd:disabled{opacity:.55}" +
      ".mnm{margin:8px 16px 0;font-size:13px;opacity:.8;min-height:16px}" +
      ".mns{margin:14px 16px 8px;font-size:12px;letter-spacing:1px;color:#8a8db8;font-weight:700}" +
      ".mnl{margin:0 14px;border-radius:18px;background:#161a3a;border:1px solid rgba(255,255,255,.08);overflow:hidden}" +
      ".mnr{display:flex;align-items:center;gap:12px;padding:12px;border-top:1px solid rgba(255,255,255,.07)}.mnl>.mnr:first-child{border-top:0}" +
      ".mni{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}" +
      ".mnt{flex:1;min-width:0}.mnt b{display:block}.mnt small{opacity:.65}.mng{opacity:.6;font-size:20px}" +
      ".mnsw{width:46px;height:26px;border-radius:13px;background:#3a3f6e;position:relative;display:inline-block}.mnsw i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff}.mnsw.on{background:#6b5cf0}.mnsw.on i{left:23px}" +
      ".mnx{padding:12px 14px;background:#10142e;border-top:1px solid rgba(255,255,255,.07);font-size:14px;line-height:1.5}" +
      ".mnx textarea{width:100%;box-sizing:border-box;min-height:90px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:#161a3a;color:#fff;padding:10px}" +
      ".mnx button{margin-top:8px;border:0;border-radius:12px;padding:10px 16px;background:#6b5cf0;color:#fff}.mnp{height:24px}";
    document.head.appendChild(st);
  }
  var SEC = [
    ["O‘YINLAR", [
      ["🤖", "AI bilan o‘ynash", "Kompyuterga qarshi o‘ynang", "@ai:play", "#8e6ff0,#c58bf2"],
      ["✏️", "Muharrir", "Pozitsiya tuzing va o‘ynang", "@ai:ed", "#17b2f7,#17e3ff"],
      ["📋", "PDN", "Partiyani import va eksport", "@ai:pdn", "#2fd27f,#1ea36a"],
      ["📺", "Jonli efir", "Hozirgi o‘yinlarni kuzating", "@live", "#ff4d6d,#ff8fa3"]]],
    ["ILOVA", [
      ["⚙️", "Sozlamalar", "Tema, ovoz va boshqalar", "@ai:set", "#6b7bff,#8fa0ff"],
      ["📴", "Eski qurilma rejimi", "Animatsiyasiz — zaif telefonlar uchun", "@lite", "#9aa0c8,#c3c8ea"],
      ["❓", "Yordam", "Bo‘limlar haqida", "@help", "#17b2f7,#17e3ff"],
      ["💬", "Taklif va shikoyatlar", "Fikringizni yozib qoldiring", "@fb", "#f5873b,#f7c02d"]]]
  ];
  function rowHtml(r) {
    var a = r[3], right = "›";
    if (a === "@lite") right = "<span class=\"mnsw" + (isLite() ? " on" : "") + "\"><i></i></span>";
    var h = "<div class=\"mnr\" onclick=\"mnA('" + a + "')\"><div class=\"mni\" style=\"background:linear-gradient(135deg," + r[4] + ")\">" + r[0] + "</div>" +
      "<div class=\"mnt\"><b>" + r[1] + "</b><small>" + r[2] + "</small></div><span class=\"mng\">" + right + "</span></div>";
    if (a === "@help" && open === "help") h += "<div class=\"mnx\">📱 <b>Pastki menyu:</b><br>👤 Profil: ma‘lumotlaringiz va balans<br>🎮 O‘yin: onlayn raqiblar va tezkor o‘yin<br>🏆 Turnir: turnirlar va klublar<br>📊 Reyting: eng kuchli o‘yinchilar<br>☰ Menyu: AI o‘yin, muharrir va sozlamalar</div>";
    if (a === "@fb" && open === "fb") h += "<div class=\"mnx\"><textarea id=\"mnFbT\" maxlength=\"1000\" placeholder=\"Taklif yoki shikoyatingizni yozing…\"></textarea><button id=\"mnFbB\" onclick=\"mnSend()\">Yuborish</button><div id=\"mnFbM\" class=\"mnm\" style=\"margin:8px 0 0\"></div></div>";
    return h;
  }
  function render() {
    if (!panel) return;
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var name = ((u.first_name || "") + " " + (u.last_name || "")).trim() || "Mehmon";
    var av = u.id ? "<img src=\"/api/av/" + encodeURIComponent(u.id) + "?t=" + Date.now() + "\" onerror=\"this.outerHTML='👤'\">" : "👤";
    var h = "<div class=\"mnh\"><div class=\"mnav\">" + av + "</div><div class=\"mnu\"><b>" + esc(name) + "</b><span class=\"mnb\">💎 " + (bal == null ? "—" : bal) + "</span></div>" +
      "<button class=\"mnd\" onclick=\"mnA('@daily')\"" + (canDaily ? "" : " disabled") + ">" + (canDaily ? "🎁 Bonus" : "✅ Olingan") + "</button></div><div class=\"mnm\" id=\"mnMsg\"></div>";
    SEC.forEach(function (s) {
      h += "<div class=\"mns\">" + s[0] + "</div><div class=\"mnl\">" + s[1].map(rowHtml).join("") + "</div>";
    });
    panel.innerHTML = h + "<div class=\"mnp\"></div>";
  }
  function msgSet(t) { var m = document.getElementById("mnMsg"); if (m) m.textContent = t; }
  function load() {
    if (!initData) { msgSet("Balans va bonus uchun Telegram orqali kiring."); return; }
    fetch("/api/balance", { headers: { "x-init-data": initData } }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && !d.error) { bal = d.diamonds; canDaily = !!d.canClaimDaily; render(); }
    }).catch(function () {});
  }
  function daily() {
    if (!initData) { msgSet("Bonus uchun Telegram orqali kiring."); return; }
    fetch("/api/daily", { method: "POST", headers: { "x-init-data": initData } }).then(function (r) { return r.json(); }).then(function (d) {
      load(); setTimeout(function () { msgSet(d && d.ok ? "+" + d.amount + " 💎 olindi" : "Bugun olingan"); }, 400);
    }).catch(function () { msgSet("Server bilan aloqa yo‘q"); });
  }
  function close() { if (panel) panel.style.display = "none"; }
  window.mnA = function (a) {
    if (a.indexOf("@ai:") === 0) { close(); if (window.aiShow) window.aiShow(a.slice(4)); return; }
    if (a === "@live") { close(); liveOpen(); return; }
    if (a === "@daily") { daily(); return; }
    if (a === "@lite") { var on = !isLite(); try { localStorage.setItem("mnLite", on ? "1" : "0"); } catch (e) {} lite(on); render(); return; }
    if (a === "@help") { open = open === "help" ? null : "help"; render(); return; }
    if (a === "@fb") { open = open === "fb" ? null : "fb"; render(); return; }
    close();
    if (a === "btnAI") { var b = document.getElementById("btnAI"); if (b) b.click(); return; }
    if (window.openScreen) window.openScreen(a);
  };
  window.mnSend = function () {
    var t = document.getElementById("mnFbT"), m = document.getElementById("mnFbM"), b = document.getElementById("mnFbB");
    var v = t ? t.value.trim() : "";
    if (v.length < 5) { if (m) m.textContent = "Kamida 5 ta belgi yozing"; return; }
    if (b) b.disabled = true; if (m) m.textContent = "Yuborilmoqda…";
    fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": initData }, body: JSON.stringify({ text: v }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) { if (t) t.value = ""; if (m) m.textContent = "✅ Rahmat! Xabaringiz yuborildi"; } else if (m) m.textContent = "⚠️ " + ((j && j.error) || "Xatolik"); if (b) b.disabled = false; })
      .catch(function () { if (m) m.textContent = "⚠️ Server bilan aloqa yo‘q"; if (b) b.disabled = false; });
  };
  window.mnOpen = function () {
    css();
    if (!panel) { panel = document.createElement("div"); panel.id = "mnPanel"; document.body.appendChild(panel); }
    panel.style.display = "block"; render(); load();
  };
  function liveOpen() {
    var old = document.getElementById("mnLive"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "mnLive";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit";
    document.body.appendChild(ov);
    var ws, timer;
    function stop() { clearInterval(timer); try { ws.close(); } catch (e) {} ov.remove(); }
    function draw(list) {
      var h = "<div style=\"display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px\"><span>📺 Jonli efir</span><button id=\"mnLvX\" style=\"border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff\">⬅️</button></div>";
      if (!list.length) h += "<div style=\"padding:30px;text-align:center;opacity:.7\">Hozir o‘ynalayotgan o‘yin yo‘q</div>";
      list.forEach(function (r) {
        h += "<div style=\"background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;display:flex;align-items:center;gap:10px\"><div style=\"flex:1;min-width:0\"><b>⚪ " + esc(r.white) + "</b> — <b>⚫ " + esc(r.black) + "</b><div style=\"font-size:12px;opacity:.65;margin-top:4px\">" + esc(r.tc || "") + " · " + (r.moves || 0) + " yurish · 📺 " + (r.spectators || 0) + "</div></div><button data-r=\"" + esc(r.id) + "\" style=\"border:0;border-radius:12px;padding:10px 14px;background:#6b5cf0;color:#fff\">📺 Kuzatish</button></div>";
      });
      ov.innerHTML = h;
      ov.querySelector("#mnLvX").onclick = stop;
      Array.prototype.forEach.call(ov.querySelectorAll("[data-r]"), function (b) {
        b.onclick = function () { location.href = location.pathname + "?room=" + encodeURIComponent(b.getAttribute("data-r")); };
      });
    }
    draw([]);
    var proto = location.protocol === "https:" ? "wss://" : "ws://";
    try { ws = new WebSocket(proto + location.host); } catch (e) { return; }
    function ask() { try { ws.send(JSON.stringify({ type: "roomLive" })); } catch (e) {} }
    ws.onopen = function () { ask(); timer = setInterval(ask, 5000); };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m && m.type === "roomLive") draw(m.list || []);
    };
  }
  window.mnClose = close;
})();
