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
    st.textContent += "#mnPanel{background:radial-gradient(circle at 50% 0,#1a1450 0,#0b0e1a 55%)}.mqT{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 6px}.mqL b{font-size:26px;font-weight:900;color:#fff}.mqL b i{font-style:normal;color:#f5b82e}.mqL small{display:block;font-size:12px;color:#a9b0ff}.mqR{display:flex;align-items:center;gap:8px}.mqC{padding:6px 12px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid #3d5bd9;font-weight:700}.mqP{margin:8px 14px;border-radius:22px;padding:14px;background:linear-gradient(135deg,#2b2a78,#4a1f8a 60%,#2a1050);border:1px solid #7a5cf0;box-shadow:0 0 18px rgba(122,92,240,.45)}.mqPh{display:flex;align-items:center;gap:12px}.mqav{width:64px;height:64px;border-radius:50%;border:3px solid #f5b82e;box-shadow:0 0 14px rgba(245,184,46,.6);background:#2a1fc9;display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden;flex:none}.mqav img{width:100%;height:100%;object-fit:cover}.mqN{flex:1;min-width:0}.mqN b{display:block;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mqN small{opacity:.7}.mqG{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.mqG.two{grid-template-columns:repeat(2,1fr);margin-top:8px}.mqG div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px 4px;text-align:center}.mqG b{display:block;font-size:18px}.mqG small{font-size:11px;opacity:.7}.mqS{display:flex;align-items:center;gap:8px;margin:16px 16px 8px;font-size:17px;font-weight:800;letter-spacing:.5px}.mqS span{font-size:20px}.mqGr{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 14px}.mqK{position:relative;border-radius:16px;padding:10px 8px;min-height:96px;box-sizing:border-box;cursor:pointer;overflow:hidden}.mqK .ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:6px}.mqK b{display:block;font-size:13px;line-height:1.2}.mqK small{display:block;font-size:10px;opacity:.7;margin-top:2px;line-height:1.2}.mqK em{position:absolute;right:8px;top:10px;font-style:normal;opacity:.6}.mqX{margin:8px 14px 0;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1)}.mqB{margin:16px 14px 0;display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;background:linear-gradient(135deg,#3a1d12,#1a1440);border:1px solid #f5873b;box-shadow:0 0 14px rgba(245,135,59,.4)}.mqB>span{font-size:30px}.mqB b{display:block;font-size:14px}.mqB small{opacity:.75;font-size:11px}"; document.head.appendChild(st);
  }
  var SEC = [
    ["O‘YINLAR", [
      ["🤖", "AI bilan o‘ynash", "Kompyuterga qarshi o‘ynang", "@ai:play", "#8e6ff0,#c58bf2"],
      ["📺", "Jonli efir", "Hozirgi o‘yinlarni kuzating", "@live", "#ff4d6d,#ff8fa3"],
      ["📁", "Arxiv", "O‘tgan o‘yinlar tarixi", "@arch", "#2fd27f,#1ea36a"],
      ["🧩", "Masalalar", "Shashka masalalarini yeching", "@puz", "#f5873b,#f7c02d"],
      ["💎", "Tosh do‘koni", "Donalar va o‘z donangiz", "@shop", "#7b3ff2,#d62f8f"]]],
    ["ILOVA", [
      ["⚙️", "Sozlamalar", "Tema, ovoz va boshqalar", "@ai:set", "#6b7bff,#8fa0ff"],
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
  var pst = null;
  function cardHtml(r) {
    var cs = r[4].split(","), c1 = cs[0], c2 = cs[1] || cs[0];
    return "<div class='mqK' data-a='" + r[3] + "' onclick='mnA(this.dataset.a)' style='background:linear-gradient(135deg," + c1 + "33," + c2 + "14);border:1px solid " + c1 + "99;box-shadow:0 0 12px " + c1 + "40'><em>›</em><div class='ic' style='background:linear-gradient(135deg," + r[4] + ")'>" + r[0] + "</div><b>" + r[1] + "</b><small>" + r[2] + "</small></div>";
  }
  function render() {
    if (!panel) return;
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var name = ((u.first_name || "") + " " + (u.last_name || "")).trim() || "Mehmon";
    var av = u.id ? "<img src='/api/av/" + encodeURIComponent(u.id) + "?t=" + Date.now() + "' onerror=\"this.outerHTML='👤'\">" : "👤";
    function v(x) { return x == null ? "—" : x; }
    var P = pst || {};
    var h = "<div class='mqT'><div class='mqL'><b>Shashka<i>PRO</i> 👑</b><small>Yaxshiroq o‘yinchilar uchun!</small></div><div class='mqR'><span class='mqC'>💎 " + (bal == null ? "—" : bal) + "</span><button class='mnd' onclick=\"mnA('@daily')\"" + (canDaily ? "" : " disabled") + ">" + (canDaily ? "🎁 Bonus" : "✅ Olingan") + "</button></div></div>";
    h += "<div class='mqP'><div class='mqPh'><div class='mqav'>" + av + "</div><div class='mqN'><b>" + esc(name) + " 👑</b><small>" + (u.id ? "ID: " + esc(u.id) : "Telegram orqali kiring") + "</small></div></div>" +
      "<div class='mqG'><div><b>🏆 " + v(P.wins) + "</b><small>G‘alaba</small></div><div><b>✖️ " + v(P.losses) + "</b><small>Mag‘lub</small></div><div><b>🤝 " + v(P.draws) + "</b><small>Durang</small></div></div>" +
      "<div class='mqG two'><div><b>🔥 " + v(P.bestStreak) + "</b><small>G‘alaba seriyasi</small></div><div><b>👑 " + v(P.elo) + "</b><small>ELO</small></div></div></div>";
    h += "<div class='mnm' id='mnMsg'></div>";
    SEC.forEach(function (s, i) {
      h += "<div class='mqS'><span>" + (i === 0 ? "🎮" : "⚙️") + "</span>" + s[0] + "</div><div class='mqGr'>" + s[1].map(cardHtml).join("") + "</div>";
      if (i === 1 && open === "help") h += "<div class='mnx mqX'>📱 <b>Pastki menyu:</b><br>👤 Profil: ma‘lumotlaringiz va balans<br>🎮 O‘yin: onlayn raqiblar va tezkor o‘yin<br>🏆 Turnir: turnirlar va klublar<br>📊 Reyting: eng kuchli o‘yinchilar<br>☰ Menyu: AI o‘yin, muharrir va sozlamalar</div>";
      if (i === 1 && open === "fb") h += "<div class='mnx mqX'><textarea id='mnFbT' maxlength='1000' placeholder='Taklif yoki shikoyatingizni yozing…'></textarea><button id='mnFbB' onclick='mnSend()'>Yuborish</button><div id='mnFbM' class='mnm' style='margin:8px 0 0'></div></div>";
    });
    h += "<div class='mqB'><span>🏆</span><div><b>ShashkaPRO — Doim siz bilan!</b><small>O‘yin, do‘stlar, turnirlar va yanada ko‘p imkoniyatlar!</small></div></div>";
    panel.innerHTML = h + "<div class='mnp'></div>";
  }
  function loadStats() {
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    if (!initData || !u.id) return;
    fetch("/api/user/" + encodeURIComponent(u.id), { headers: { "x-init-data": initData } })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && !d.error) { pst = d; render(); } })
      .catch(function () {});
  }
  var _ld0 = load; load = function () { _ld0(); loadStats(); };
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
    if (a === "@arch") { close(); archOpen(); return; }
    if (a === "@puz") { close(); if (window.spPuzzles) window.spPuzzles(); return; }
    if (a === "@shop") { close(); if (window.spShop) window.spShop(); return; }
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
  function archOpen() {
    var old = document.getElementById('mnArch'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'mnArch';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit';
    document.body.appendChild(ov);
    var head = '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>📁 Arxiv</span><button id="mnArX" style="border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff">⬅️</button></div>';
    function shell(body) { ov.innerHTML = head + body; ov.querySelector('#mnArX').onclick = function () { ov.remove(); }; }
    shell('<div style="padding:30px;text-align:center;opacity:.7">Yuklanmoqda…</div>');
    fetch('/api/archive', { headers: { 'x-init-data': initData } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var list = d.list || [];
        if (!list.length) { shell('<div style="padding:30px;text-align:center;opacity:.7">Hozircha tugagan o‘yin yo‘q</div>'); return; }
        var h = '';
        list.forEach(function (g, i) {
          var res = g.win === 'white' ? '🏆 ⚪' : g.win === 'black' ? '🏆 ⚫' : '🤝';
          var dt = new Date(g.at).toLocaleDateString();
          h += '<div data-i="' + i + '" style="background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer"><b>⚪ ' + esc(g.w) + ' — ⚫ ' + esc(g.b) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + res + ' · ' + esc(g.tc || '') + ' · ' + g.m.length + ' yurish · ' + dt + '</div></div>';
        });
        shell(h);
        Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (el) {
          el.onclick = function () {
            var g = list[Number(el.getAttribute('data-i'))];
            window.spAnalyze({
              white: g.w, black: g.b, winner: g.win,
              moves: g.m.map(function (x) { return { from: { r: x[0], c: x[1] }, to: { r: x[2], c: x[3] }, captures: x[4].map(function (y) { return { r: y[0], c: y[1] }; }) }; })
            });
          };
        });
      })
      .catch(function () { shell('<div style="padding:30px;text-align:center">Server bilan aloqa yo‘q</div>'); });
  }
  window.mnClose = close;
})();

;(function () {
  if (window.spAnalyze) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function start() {
    var b = [], r, c;
    for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) b[r].push(r < 3 && (r + c) % 2 ? 2 : (r > 4 && (r + c) % 2 ? 1 : 0)); }
    return b;
  }
  function apply(b, m) {
    var n = b.map(function (x) { return x.slice(); }), p = n[m.from.r][m.from.c];
    n[m.from.r][m.from.c] = 0;
    (m.captures || []).forEach(function (x) { n[x.r][x.c] = 0; });
    if (p === 1 && m.to.r === 0) p = 3;
    if (p === 2 && m.to.r === 7) p = 4;
    n[m.to.r][m.to.c] = p;
    return n;
  }
  (function () {
    if (window.spPcImg) return;
    var ok = {};
    function chk(id) { if (ok[id] !== undefined) return; ok[id] = false; var im = new Image(); im.onload = function () { ok[id] = true; }; im.src = '/api/shop/img?id=' + encodeURIComponent(id) + '&k=w'; }
    window.spPcImg = function (p) {
      var id = window.spEqId !== undefined ? window.spEqId : 'def';
      if (!id) return '';
      chk(id);
      if (!ok[id]) return '';
      return '/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + (p === 1 ? 'w' : p === 2 ? 'b' : p === 3 ? 'wk' : 'bk');
    };
    window.spPcImg(1);
  })();
  window.spAnalyze = function (g) {
    var mv = g.moves || [], bs = [start()], i;
    for (i = 0; i < mv.length; i++) bs.push(apply(bs[i], mv[i]));
    var cur = mv.length, auto = null, spd = 1, flip = false;
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    function startAuto() {
      stopAuto();
      if (cur >= mv.length) cur = 0;
      auto = setInterval(function () {
        if (!document.body.contains(ov)) { stopAuto(); return; }
        if (cur < mv.length) { cur++; draw(); } else { stopAuto(); draw(); }
      }, 1500 / spd);
    }
    var old = document.getElementById('spAn'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spAn';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    var res = g.winner === 'white' ? '🏆 ⚪ ' + esc(g.white) : g.winner === 'black' ? '🏆 ⚫ ' + esc(g.black) : '🤝 Durang';
    function draw() {
      var b = bs[cur], m = cur > 0 ? mv[cur - 1] : null, h = '', r, c, p, bg, hl;
      if (flip) { b = b.slice().reverse().map(function (x) { return x.slice().reverse(); }); if (m) m = { from: { r: 7 - m.from.r, c: 7 - m.from.c }, to: { r: 7 - m.to.r, c: 7 - m.to.c } }; }
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>🔍 Tahlil</b><button id="anX" style="border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff;font-size:16px">⬅️</button></div>';
      h += '<div style="font-size:14px;margin-bottom:8px">⚪ ' + esc(g.white) + ' — ⚫ ' + esc(g.black) + '<br><span style="opacity:.8">' + res + '</span></div>';
      h += '<div style="width:min(94vw,480px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #8a4a1c;border-radius:6px;overflow:hidden">';
      for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
        bg = (r + c) % 2 ? '#7b2f13' : '#f3bb86';
        hl = m && ((m.from.r === r && m.from.c === c) || (m.to.r === r && m.to.c === c)) ? 'box-shadow:inset 0 0 0 3px #f5d92b;' : '';
        p = b[r][c];
        h += '<div style="background:' + bg + ';' + hl + 'display:flex;align-items:center;justify-content:center">';
        if (p) {
          var white = p === 1 || p === 3;
          var _im = window.spPcImg ? window.spPcImg(p) : '';
          if (_im) h += '<div style="width:88%;height:88%;background:url(' + _im + ') center/contain no-repeat;filter:drop-shadow(0 3px 2px #0007)"></div>';
          else h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (white ? '#9a9a9a' : '#000') + ';background:' + (white ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      h += '<div id="anL" style="margin:10px 0;font-size:15px">Yurish: ' + cur + ' / ' + mv.length + '</div>';
      h += '<div style="display:flex;gap:8px;justify-content:center">';
      var bst = 'border:0;border-radius:14px;padding:12px 18px;background:#6b5cf0;color:#fff;font-size:20px';
      h += '<button id="an0" style="' + bst + '">⏮</button><button id="an1" style="' + bst + '">◀</button><button id="an2" style="' + bst + '">▶</button><button id="an3" style="' + bst + '">⏭</button></div>';
      h += '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button id="anP" style="' + bst + '">' + (auto ? '⏸ To‘xta' : '▶️ Avto') + '</button><button id="anS" style="' + bst + '">' + spd + '×</button><button id="anF" style="' + bst + '">🔄</button></div>';
      h += '<input id="anR" type="range" min="0" max="' + mv.length + '" value="' + cur + '" style="width:min(86vw,420px);margin-top:14px">';
      ov.innerHTML = h;
      ov.querySelector('#anX').onclick = function () { stopAuto(); ov.remove(); };
      ov.querySelector('#an0').onclick = function () { cur = 0; draw(); };
      ov.querySelector('#an1').onclick = function () { if (cur > 0) cur--; draw(); };
      ov.querySelector('#an2').onclick = function () { if (cur < mv.length) cur++; draw(); };
      ov.querySelector('#an3').onclick = function () { cur = mv.length; draw(); };
      ov.querySelector('#anP').onclick = function () { if (auto) stopAuto(); else startAuto(); draw(); };
      ov.querySelector('#anS').onclick = function () { spd = spd % 3 + 1; if (auto) startAuto(); draw(); };
      ov.querySelector('#anF').onclick = function () { flip = !flip; draw(); };
      var rg = ov.querySelector('#anR');
      rg.oninput = function () { var l = ov.querySelector('#anL'); if (l) l.textContent = 'Yurish: ' + rg.value + ' / ' + mv.length; };
      rg.onchange = function () { cur = Number(rg.value); draw(); };
    }
    draw();
  };
})();


(function () {
  if (window.spPuzzles) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var LV = ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'];
  var BS = 'border:0;border-radius:12px;padding:10px 14px;background:#6b5cf0;color:#fff;font-size:15px;margin:4px';
  var BG = 'border:0;border-radius:12px;padding:10px 14px;background:#262b66;color:#fff;font-size:15px;margin:4px';
  var ov = null, pending = null, S = { list: [], solved: [] };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ins(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function sideOf(p) { return p === 1 || p === 3 ? 'w' : (p === 2 || p === 4 ? 'b' : null); }
  function blank() { var b = [], r; for (r = 0; r < 8; r++) b.push([0, 0, 0, 0, 0, 0, 0, 0]); return b; }
  function copy(b) { var n = b.map(function (x) { return x.slice(); }); if (b.dead) n.dead = b.dead.slice(); return n; }
  function std() { var b = blank(), r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = r < 3 ? 2 : (r > 4 ? 1 : 0); return b; }

  // ---- qoidalar (rus shashkasi): majburiy urish, dama uzoqqa yuradi
  function caps(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p), dead = b.dead || [];
    function isD(a, e) { for (var i = 0; i < dead.length; i++) if (dead[i][0] === a && dead[i][1] === e) return true; return false; }
    DIRS.forEach(function (d) {
      var nr, nc;
      if (p < 3) {
        var mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
        if (ins(lr, lc) && b[mr][mc] && sideOf(b[mr][mc]) !== me && !isD(mr, mc) && !b[lr][lc]) out.push({ f: [r, c], t: [lr, lc], x: [mr, mc] });
      } else {
        nr = r + d[0]; nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { nr += d[0]; nc += d[1]; }
        if (ins(nr, nc) && sideOf(b[nr][nc]) !== me && !isD(nr, nc)) {
          var er = nr, ec = nc; nr += d[0]; nc += d[1];
          while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc], x: [er, ec] }); nr += d[0]; nc += d[1]; }
        }
      }
    });
    return out;
  }
  function simple(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p);
    DIRS.forEach(function (d) {
      if (p > 2) {
        var nr = r + d[0], nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc] }); nr += d[0]; nc += d[1]; }
      } else if (d[0] === (me === 'w' ? -1 : 1)) {
        var tr = r + d[0], tc = c + d[1];
        if (ins(tr, tc) && !b[tr][tc]) out.push({ f: [r, c], t: [tr, tc] });
      }
    });
    return out;
  }
  function legal(b, side, forced) {
    var cs = [], ss = [], r, c;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      if (sideOf(b[r][c]) !== side) continue;
      if (forced && (forced[0] !== r || forced[1] !== c)) continue;
      cs = cs.concat(caps(b, r, c));
      if (!forced) ss = ss.concat(simple(b, r, c));
    }
    return cs.length ? cs : ss;
  }
  function adv(g, s) {
    var n = copy(g.b), p = n[s.f[0]][s.f[1]], dead = (g.b.dead || []).slice();
    n[s.f[0]][s.f[1]] = 0;
    if (p === 1 && s.t[0] === 0) p = 3;
    if (p === 2 && s.t[0] === 7) p = 4;
    n[s.t[0]][s.t[1]] = p;
    if (s.x) dead.push([s.x[0], s.x[1]]);
    n.dead = dead;
    var more = !!s.x && caps(n, s.t[0], s.t[1]).length > 0;
    if (!more) { dead.forEach(function (x) { n[x[0]][x[1]] = 0; }); n.dead = []; }
    return { b: n, side: more ? g.side : (g.side === 'w' ? 'b' : 'w'), forced: more ? [s.t[0], s.t[1]] : null };
  }
  function findStep(lg, f, t) {
    for (var i = 0; i < lg.length; i++) if (lg[i].f[0] === f[0] && lg[i].f[1] === f[1] && lg[i].t[0] === t[0] && lg[i].t[1] === t[1]) return lg[i];
    return null;
  }

  // ---- umumiy oyna
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); });
  }
  function on(sel, fn) { var e = ov.querySelector(sel); if (e) e.onclick = fn; }
  function head(t, extra) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>' + t + '</span><span>' + (extra || '') + '<button id="pzBack" style="' + BG + '">⬅️</button></span></div>';
  }
  function boardHtml(b, o) {
    o = o || {};
    var h = '<div id="pzB" style="width:min(94vw,460px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #8a4a1c;border-radius:6px;overflow:hidden">', r, c;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      var dark = (r + c) % 2 === 1, p = b[r][c], sh = '', dot = '';
      if (o.sel && o.sel[0] === r && o.sel[1] === c) sh = 'box-shadow:inset 0 0 0 3px #f5d92b;';
      if ((o.hl || []).some(function (x) { return x[0] === r && x[1] === c; })) dot = '<i style="position:absolute;width:30%;height:30%;border-radius:50%;background:#34f5c5"></i>';
      h += '<div data-r="' + r + '" data-c="' + c + '" style="position:relative;background:' + (dark ? '#7b2f13' : '#f3bb86') + ';' + sh + 'display:flex;align-items:center;justify-content:center">' + dot;
      if (p) {
        var w = p === 1 || p === 3;
        h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f5b72b;border:2px solid ' + (w ? '#9a9a9a' : '#000') + ';background:' + (w ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';
      }
      h += '</div>';
    }
    return h + '</div>';
  }
  function bindBoard(fn) {
    var e = ov.querySelector('#pzB'); if (!e) return;
    e.onclick = function (ev) { var c = ev.target.closest('[data-r]'); if (c) fn(Number(c.getAttribute('data-r')), Number(c.getAttribute('data-c'))); };
  }

  function open() {
    var old = document.getElementById('spPz'); if (old) old.remove();
    ov = document.createElement('div'); ov.id = 'spPz';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit;text-align:center';
    document.body.appendChild(ov);
    load();
  }
  function close() { curLv = 0; curFo = ''; curLv = 0; if (ov) ov.remove(); }
  function load() {
    ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    on('#pzBack', close);
    api('/api/puzzles').then(function (d) {
      if (d.error) { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Telegram orqali kiring</div>'; on('#pzBack', close); return; }
      S = d; var _pid = pending; pending = null; var _pz = _pid && S.list.filter(function (x) { return x.id === _pid; })[0]; if (_pz) play(_pz); else list();
    }).catch(function () { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', close); });
  }
  var curLv = 0, curFo = '', edLv = 0, edFolder = '';
  var CARD = 'text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer';
  function lvOf(p) { return [1, 2, 3].indexOf(p.level) >= 0 ? p.level : 1; }
  function foOf(p) { return (p.folder && (S.folders || []).indexOf(p.folder) >= 0) ? p.folder : ''; }
  function nDone(arr) { return arr.filter(function (p) { return (S.solved || []).indexOf(p.id) >= 0; }).length; }
  function cleanName(t) { return String(t || '').replace(/[<>]/g, '').trim().slice(0, 30); }
  function newPz(lv, fo) { edLv = lv || 0; edFolder = fo || ''; editor(); }
  function topBtns() { return '<button id="pzTop" style="' + BG + '">🏆 TOP</button>' + (S.admin ? '<button id="pzNew" style="' + BS + '">➕ Yangi</button>' : ''); }
  function moveDlg(p) {
    var fl = S.folders || [];
    var t = prompt('Papka nomi (bo‘sh qoldirsangiz papkadan chiqariladi).\nMavjud: ' + (fl.join(', ') || 'yo‘q'), foOf(p));
    if (t === null) return;
    t = cleanName(t);
    var go = function () { api('/api/puzzle/move', { id: p.id, folder: t }).then(function () { load(); }); };
    if (t && fl.indexOf(t) < 0) api('/api/puzzle/folder', { name: t }).then(go); else go();
  }
  function list() {
    if (window.__pzPF) { var _pf = window.__pzPF; window.__pzPF = ''; if ((S.folders || []).indexOf(_pf) >= 0) { curFo = _pf; curLv = 0; } }
    if (curFo && (S.folders || []).indexOf(curFo) < 0) curFo = '';
    if (curLv || curFo) return items();
    var fl = S.folders || [], h = head('🧩 Masalalar', topBtns());
    if (S.admin) h += '<div style="margin-bottom:10px"><button id="pzNF" style="' + BG + '">📁 Yangi papka</button></div>';
    if (!S.list.length && !fl.length) h += '<div style="padding:30px;opacity:.7">Hozircha masala yo‘q</div>';
    [1, 2, 3].forEach(function (lv) {
      var arr = S.list.filter(function (p) { return lvOf(p) === lv && !foOf(p); }); if (!arr.length && (S.hideLv || []).indexOf(lv) >= 0) return;
      h += '<div data-lv="' + lv + '" style="' + CARD + '">' + (S.admin && !arr.length ? '<button data-hl="' + lv + '" style="float:right;background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">🗑</button>' : '') + '<b style="font-size:17px">📁 ' + LV[lv] + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + arr.length + ' ta masala · ✅ ' + nDone(arr) + '/' + arr.length + '</div></div>';
    });
    fl.forEach(function (f, i) {
      var arr = S.list.filter(function (p) { return foOf(p) === f; });
      h += '<div data-fo="' + i + '" style="' + CARD + '">' + (S.admin ? '<span style="float:right"><button data-rf="' + i + '" style="background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">✏️</button> <button data-df="' + i + '" style="background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">🗑</button></span>' : '') + '<b style="font-size:17px">📁 ' + esc(f) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + arr.length + ' ta masala · ✅ ' + nDone(arr) + '/' + arr.length + '</div></div>';
    });
    if (!S.admin) h += '<div style="font-size:11px;opacity:.4;margin-top:16px">ID: ' + esc(S.myId) + '</div>';
    ov.innerHTML = h;
    on('#pzBack', close); on('#pzTop', pzTop); on('#pzNew', function () { newPz(0, ''); });
    on('#pzNF', function () {
      var n = cleanName(prompt('Yangi papka nomi:'));
      if (!n) return;
      api('/api/puzzle/folder', { name: n }).then(function () { load(); });
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-lv]'), function (e) {
      e.onclick = function () { curLv = Number(e.getAttribute('data-lv')); curFo = ''; list(); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-hl]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var lv = Number(e.getAttribute('data-hl')); if (!confirm('"' + LV[lv] + '" papkasi yashirilsinmi? (Unga masala qo‘shsangiz qayta chiqadi)')) return; api('/api/puzzle/folder', { name: 'x', hideLv: lv }).then(function () { load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-rf]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var f = (S.folders || [])[Number(e.getAttribute('data-rf'))]; var n = cleanName(prompt('Papkaning yangi nomi:', f)); if (!n || n === f) return; api('/api/puzzle/folder', { name: f, ren: n }).then(function () { load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-df]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var f = (S.folders || [])[Number(e.getAttribute('data-df'))]; if (!confirm('"' + f + '" papkasi o‘chirilsinmi? Masalalar saqlanadi.')) return; api('/api/puzzle/folder', { name: f, del: true }).then(function () { load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-fo]'), function (e) {
      e.onclick = function () { curFo = (S.folders || [])[Number(e.getAttribute('data-fo'))] || ''; curLv = 0; list(); };
    });
  }
  function items() { window.pzLeft = window.pzLeft || function (ms) { var d = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5); return d > 0 ? d + ' kun ' + hh + ' soat' : Math.max(1, hh) + ' soat'; }; if (!document.getElementById('pzCss2')) { var _s2 = document.createElement('style'); _s2.id = 'pzCss2'; _s2.textContent = '.pzSpW{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;transform:scaleY(.7)}.pzSpW i{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;background:#fff3c4;border-radius:50%;box-shadow:0 0 10px 4px #ffd86b;opacity:0;animation:pzSp 3.2s ease-in-out infinite both}@keyframes pzSp{0%{transform:rotate(var(--a)) translateX(var(--r)) scale(.3);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:rotate(calc(var(--a) + 360deg)) translateX(var(--r)) scale(.3);opacity:0}}.pzStars{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:1}.pzStars i{position:absolute;width:3px;height:3px;border-radius:50%;background:#ffe9a0;box-shadow:0 0 6px 1px #ffd86b;opacity:0;animation:pzTw 3s ease-in-out infinite}@keyframes pzTw{0%,100%{opacity:0;transform:translateY(0) scale(.5)}50%{opacity:.9;transform:translateY(-14px) scale(1.2)}}.pzBfs{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:1;overflow:hidden}.pzBf{position:absolute;line-height:1;animation:pzFly 18s ease-in-out infinite}.pzBf b{display:inline-block;font-weight:normal;animation:pzFlap .4s ease-in-out infinite alternate}@keyframes pzFly{0%,100%{transform:translate(0,0) rotate(-8deg)}25%{transform:translate(var(--x1),var(--y1)) rotate(14deg)}50%{transform:translate(var(--x2),var(--y2)) rotate(-10deg)}75%{transform:translate(var(--x3),var(--y3)) rotate(12deg)}}@keyframes pzFlap{from{transform:scaleX(1)}to{transform:scaleX(.3)}}@media (prefers-reduced-motion:reduce){.pzSpW,.pzStars,.pzBfs{display:none}}'; document.head.appendChild(_s2); }
    var h = head('🧩 Masalalar', '<button id="pzTop" style="' + BG + '">🏆 TOP</button>'), shown = 0;
    var _sp2 = ''; if (curFo && !curLv) { for (var _k = 0; _k < 18; _k++) _sp2 += '<i style="--a:' + (_k * 20) + 'deg;--r:' + (60 + (_k % 3) * 28) + 'px;animation-delay:' + (_k * 0.18) + 's"></i>'; _sp2 = '<span class="pzSpW">' + _sp2 + '</span>'; }
    h += '<div style="margin:6px 0 12px;font-weight:bold;position:relative;display:inline-block;padding:4px 14px">' + (curLv ? LV[curLv] : '📁 ' + esc(curFo)) + _sp2 + '</div>';
    if (curFo && !curLv) h += '<div style="margin-bottom:12px">' + (S.link ? '<button id="pzShF" style="' + BS + '">🔗 Guruhga yuborish</button>' : '') + '<button id="pzHall" style="' + BG + '">🎮 O‘yin zaliga</button><button id="pzRk" style="' + BG + '">🏅 Unvonlar</button></div>';
    if (curFo && !curLv && S.promo && Date.now() < S.promo) h += '<div style="font-size:13px;margin:-4px 0 12px;padding:8px 10px;border-radius:10px;background:#2a2560">🎁 Aksiya (' + window.pzLeft(S.promo - Date.now()) + ' qoldi): havolangiz orqali kirgan har bir yangi o‘yinchi masala yechsa, sizga +100 💎' + (S.inv ? '<br>👥 Taklif qilinganlar: ' + S.inv.total : '') + '</div>';
    if (S.admin) h += '<div style="margin-bottom:12px"><button id="pzAdd" style="' + BS + '">➕ Masala</button>' + (curFo ? '<button id="pzRF" style="' + BG + '">✏️ Nomi</button><button id="pzDF" style="' + BG + '">🗑 Papkani o‘chirish</button>' : '') + '</div>';
    S.list.forEach(function (p, i) {
      if (curLv ? (lvOf(p) !== curLv || foOf(p)) : foOf(p) !== curFo) return;
      shown++;
      var ok = (S.solved || []).indexOf(p.id) >= 0;
      h += '<div data-i="' + i + '" style="' + CARD + '">' + (S.admin ? '<button data-mv="' + i + '" style="float:right;background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">📁</button>' : '') + '<b>' + (ok ? '✅ ' : '') + esc(p.title) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + LV[lvOf(p)] + ' · 👥 ' + (p.cnt || 0) + ' · ' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + '</div></div>';
    });
    if (!shown) h += '<div style="padding:24px;opacity:.7">Bu papkada masala yo‘q</div>';
    if (curFo && !curLv) { var _stz = ''; for (var _q = 0; _q < 22; _q++) _stz += '<i style="left:' + Math.round(Math.random() * 96) + '%;top:' + Math.round(Math.random() * 92) + '%;animation-delay:' + (Math.random() * 3).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 2).toFixed(2) + 's"></i>'; h += '<div class="pzStars">' + _stz + '</div>';
      var _bf = '', _hu = [0, 60, 120, 180, 240, 300, 330], _rr = function (m) { return Math.round((Math.random() * 2 - 1) * m); };
      for (var _b2 = 0; _b2 < 7; _b2++) _bf += '<span class="pzBf" style="left:' + Math.round(5 + Math.random() * 85) + '%;top:' + Math.round(10 + Math.random() * 75) + '%;font-size:' + Math.round(22 + Math.random() * 14) + 'px;--x1:' + _rr(130) + 'px;--y1:' + _rr(110) + 'px;--x2:' + _rr(160) + 'px;--y2:' + _rr(140) + 'px;--x3:' + _rr(130) + 'px;--y3:' + _rr(110) + 'px;animation-duration:' + (14 + Math.random() * 10).toFixed(1) + 's;animation-delay:-' + (Math.random() * 10).toFixed(1) + 's"><b style="filter:hue-rotate(' + _hu[_b2] + 'deg) saturate(1.4)">🦋</b></span>';
      h += '<div class="pzBfs">' + _bf + '</div>'; }
    ov.innerHTML = h;
    on('#pzBack', function () { curLv = 0; curFo = ''; list(); });
    on('#pzTop', pzTop);
    (function () {
      var cs = (S.settings || {})[curFo] || {}, inF = !curLv && curFo, lockOn = inF && cs.lock && !S.admin, blocked = false;
      function setDlg() {
        var cur = (S.settings || {})[curFo] || {}, T = [[0, 'Oʻchiq'], [20, '20 s'], [30, '30 s'], [60, '1 daq'], [120, '2 daq'], [180, '3 daq'], [240, '4 daq'], [300, '5 daq']];
        var h = head('⚙️ ' + esc(curFo));
        h += '<div style="margin:6px 0 8px">⏱ Vaqt chegarasi (har masalaga)</div><div>';
        T.forEach(function (x) { h += '<button data-t="' + x[0] + '" style="' + ((cur.time || 0) === x[0] ? BS : BG) + ';margin:0 6px 8px 0">' + x[1] + '</button>'; });
        h += '</div><div style="margin:14px 0 8px">🔒 Ketma-ket ochilish (oldingisini yechmasa keyingisi yopiq)</div><button id="pzLk" style="' + (cur.lock ? BS : BG) + '">' + (cur.lock ? 'Yoqiq' : 'Oʻchiq') + '</button>';
        ov.innerHTML = h;
        on('#pzBack', items);
        Array.prototype.forEach.call(ov.querySelectorAll('[data-t]'), function (e) {
          e.onclick = function () { api('/api/puzzle/settings', { folder: curFo, time: Number(e.getAttribute('data-t')) }).then(function (d) { if (d && d.settings) S.settings = d.settings; setDlg(); }); };
        });
        on('#pzLk', function () { api('/api/puzzle/settings', { folder: curFo, lock: !cur.lock }).then(function (d) { if (d && d.settings) S.settings = d.settings; setDlg(); }); });
      }
      var df = ov.querySelector('#pzDF');
      if (S.admin && df) {
        var sb = document.createElement('button'); sb.id = 'pzSet'; sb.setAttribute('style', df.getAttribute('style')); sb.textContent = '⚙️ Sozlamalar'; df.parentNode.appendChild(sb); sb.onclick = setDlg;
      }
      var cards = ov.querySelectorAll('[data-i]');
      if (inF && cards.length) {
        var info = document.createElement('div');
        info.style.cssText = 'font-size:13px;opacity:.75;margin:-2px 0 10px';
        info.textContent = (cs.time ? '⏱ ' + (cs.time >= 60 ? (cs.time / 60) + ' daqiqa' : cs.time + ' soniya') : '⏱ vaqt chegarasiz') + (cs.lock ? ' · 🔒 ketma-ket' : '');
        cards[0].parentNode.insertBefore(info, cards[0]);
      }
      Array.prototype.forEach.call(cards, function (e) {
        var q = S.list[Number(e.getAttribute('data-i'))], ok = (S.solved || []).indexOf(q.id) >= 0, bt = (S.best || {})[q.id], meta = e.querySelector('div'), b0 = e.querySelector('b');
        if (bt && meta) meta.textContent += ' · 🏅 ' + bt + ' s';
        if (lockOn && blocked) {
          e.style.opacity = '.45';
          if (b0) b0.textContent = '🔒 ' + b0.textContent;
          e.addEventListener('click', function (ev) { ev.stopImmediatePropagation(); var m = '🔒 Avval oldingi masalani yeching'; if (tg && tg.showAlert) tg.showAlert(m); else alert(m); }, true);
        }
        if (!ok) blocked = true;
        if (S.admin) {
          [['dn', '⬇️'], ['up', '⬆️']].forEach(function (x) {
            var bb = document.createElement('button');
            bb.textContent = x[1];
            bb.setAttribute('style', 'float:right;background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px;margin-left:6px');
            bb.onclick = function (ev) { ev.stopPropagation(); api('/api/puzzle/order', { id: q.id, dir: x[0] }).then(function () { load(); }); };
            e.insertBefore(bb, e.firstChild);
          });
        }
      });
    })();
    on('#pzAdd', function () { newPz(curLv, curLv ? '' : curFo); });
    function rankDlg() {
      var t = (S.inv && S.inv.total) || 0, RK = S.ranks || [], cur = null, nxt = null;
      RK.forEach(function (r) { if (t >= r.n) cur = r; else if (!nxt) nxt = r; });
      var h = head('🏅 Unvonlar');
      h += '<div style="' + CARD + '"><div style="font-size:12px;opacity:.65">JORIY UNVON</div><b style="font-size:20px">' + (cur ? esc(cur.name) : 'Hali unvon yo‘q') + '</b><div style="font-size:13px;margin-top:6px">' + (nxt ? '⬆️ ' + esc(nxt.name) + ' bo‘lish uchun yana ' + (nxt.n - t) + ' ta do‘st kerak' : '🎉 Eng yuqori unvon!') + '</div>' + (nxt ? '<div style="height:8px;border-radius:4px;background:#2c3070;margin-top:8px"><div style="height:8px;border-radius:4px;background:#ffd86b;width:' + Math.min(100, Math.round(t / nxt.n * 100)) + '%"></div></div><div style="text-align:right;font-size:12px;margin-top:4px">' + t + ' / ' + nxt.n + '</div>' : '') + '</div>';
      if (S.promo && Date.now() < S.promo) h += '<div style="font-size:14px;margin:0 0 12px;padding:10px;border-radius:10px;background:#2a2560">⏰ Aksiya tugashiga: <b>' + window.pzLeft(S.promo - Date.now()) + '</b><br>Har bir yangi o‘yinchi uchun +100 💎</div>';
      else h += '<div style="font-size:13px;opacity:.7;margin-bottom:12px">Aksiya tugagan</div>';
      h += '<div style="font-size:12px;opacity:.65;margin:8px 0">BARCHA UNVONLAR</div>';
      RK.slice().reverse().forEach(function (r) {
        h += '<div style="' + CARD + ';display:flex;justify-content:space-between;align-items:center;opacity:' + (t >= r.n ? 1 : 0.65) + '"><div><b>' + (t >= r.n ? '✅ ' : '') + esc(r.name) + '</b><div style="font-size:12px;opacity:.65">' + r.n + '+ taklif</div></div><b style="color:#ffb84d">' + r.gem + ' 💎</b></div>';
      });
      h += '<div style="font-size:12px;opacity:.65;margin:14px 0 8px">🏆 ENG KO‘P TAKLIF QILGANLAR</div>';
      var tp = S.topInv || [];
      if (!tp.length) h += '<div style="opacity:.7;padding:8px 0">Hali hech kim taklif qilmagan</div>';
      tp.forEach(function (x, i) { h += '<div style="display:flex;justify-content:space-between;padding:6px 2px"><span>' + (i + 1) + '. ' + esc(x.name) + '</span><b>' + x.total + ' ta</b></div>'; });
      if (S.link) h += '<div style="margin-top:14px"><button id="pzInv" style="' + BS + '">🔗 Do‘stga taklif qilish</button></div>';
      ov.innerHTML = h;
      on('#pzBack', items);
      on('#pzInv', function () {
        var nm = curFo, e64 = btoa(unescape(encodeURIComponent(nm))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        var u = S.link + '?startapp=pf_' + S.myId + '_' + e64, tx = '🧩 Shashka masalalari: ' + nm;
        var sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(tx);
        if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
      });
    }
    on('#pzRk', rankDlg);
    on('#pzShF', function () {
      var nm = curFo, e64 = btoa(unescape(encodeURIComponent(nm))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      var u = S.link + '?startapp=pf_' + S.myId + '_' + e64, t = '🧩 Shashka masalalari: ' + nm;
      var sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t);
      if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
    });
    on('#pzHall', function () {
      close();
      setTimeout(function () {
        var t = Array.prototype.slice.call(document.querySelectorAll('*')).filter(function (e) { return /^\s*(🎮\s*)?O[‘'ʻ’]yin\s*$/.test(e.textContent || ''); });
        if (t.length) t[t.length - 1].click();
      }, 150);
    });
    on('#pzRF', function () {
      var f = curFo, n = cleanName(prompt('Papkaning yangi nomi:', f)); if (!n || n === f) return;
      api('/api/puzzle/folder', { name: f, ren: n }).then(function () { curFo = n; load(); });
    });
    on('#pzDF', function () {
      var f = curFo;
      if (!confirm('"' + f + '" papkasi o‘chirilsinmi? Masalalar saqlanadi.')) return;
      api('/api/puzzle/folder', { name: f, del: true }).then(function () { curFo = ''; load(); });
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (e) {
      e.onclick = function () { play(S.list[Number(e.getAttribute('data-i'))]); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-mv]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); moveDlg(S.list[Number(e.getAttribute('data-mv'))]); };
    });
  }

  // ---- yechish
  function pzTop() {
    ov.innerHTML = head('🏆 Masalalar TOP') + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    on('#pzBack', list);
    api('/api/puzzles/top').then(function (d) {
      var h = head('🏆 Masalalar TOP'), t = d.top || [];
      if (!t.length) h += '<div style="padding:30px;opacity:.7">Hozircha hech kim yechmagan</div>';
      t.forEach(function (x, i) {
        h += '<div style="text-align:left;background:' + (x.me ? '#262b66' : '#161a3a') + ';border:1px solid #262b5a;border-radius:14px;padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between"><span>' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(x.name) + '</span><b>✅ ' + x.n + '</b></div>';
      });
      if (d.rank > 100) h += '<div style="margin-top:10px;opacity:.85">Sizning o‘rningiz: ' + d.rank + ' · ✅ ' + d.n + '</div>';
      ov.innerHTML = h; on('#pzBack', list);
    }).catch(function () { ov.innerHTML = head('🏆 TOP') + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', list); });
  }
  function play(p) {
    p = Object.assign({}, p);
    var lines = (p.sols && p.sols.length) ? p.sols : [p.sol], alive = lines.map(function (_, i) { return i; });
    p.sol = lines[0];
    var g = { b: copy(p.board), side: p.side, forced: null }, idx = 0, sel = null, msg = '', done = false, busy = false;
    var _fs = (S.settings || {})[foOf(p)] || {}, tLim = _fs.time || 0, t0 = Date.now(), errs = 0, tOut = false, fin = -1, myT = window.__pzTok = (window.__pzTok || 0) + 1;
    function pzEl() { return Math.floor((Date.now() - t0) / 1000); }
    function pzFmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function tmText() { var s = fin >= 0 ? fin : pzEl(); return (tLim && fin < 0) ? '⏱ ' + pzFmt(Math.max(0, tLim - s)) + (tOut ? ' · vaqt tugadi' : '') : '⏱ ' + pzFmt(s); }
    var _iv = setInterval(function () {
      var el = document.getElementById('pzTm');
      if (window.__pzTok !== myT || !el || done) { clearInterval(_iv); return; }
      if (tLim && pzEl() >= tLim) { tOut = true; done = true; msg = '⏰ Vaqt tugadi! «Qayta» tugmasini bosing'; clearInterval(_iv); draw(); return; }
      el.textContent = tmText();
    }, 500);
    function same(x, y) { return x && y && x[0] === y[0] && x[1] === y[1] && x[2] === y[2] && x[3] === y[3]; }
    function pick(st) {
      var m = null, keep = [], want = [st.f[0], st.f[1], st.t[0], st.t[1]];
      alive.forEach(function (i) { var x = lines[i][idx]; if (same(x, want)) { keep.push(i); m = x; } });
      if (keep.length) {
        alive = keep;
        var fin = keep.filter(function (i) { return lines[i].length === idx + 1; });
        p.sol = lines[fin.length ? fin[0] : keep[0]];
      }
      return m;
    }
    function oppPick() {
      var c = alive.filter(function (i) { return lines[i][idx]; });
      if (!c.length) return p.sol[idx];
      var x = lines[c[Math.floor(Math.random() * c.length)]][idx];
      alive = c.filter(function (j) { return same(lines[j][idx], x); });
      p.sol = lines[alive[0]];
      return x;
    }
    function draw() {
      var tg2 = [];
      if (sel) tg2 = legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === sel[0] && s.f[1] === sel[1]; }).map(function (s) { return s.t; });
      if (!document.getElementById('pzCss')) { var _st = document.createElement('style'); _st.id = 'pzCss'; _st.textContent = '.pzWrap{position:relative;display:inline-block;margin:18px 0 10px}.pzBig{position:relative;font-size:21px!important;padding:18px 38px!important;border-radius:18px!important;font-weight:700;animation:pzGlow 1.5s ease-in-out infinite}.pzO{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;transform:scaleY(.5)}.pzO i{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#ffd86b;box-shadow:0 0 8px #ffd86b;animation:pzOrb 3s linear infinite}@keyframes pzOrb{from{transform:rotate(0deg) translateX(125px)}to{transform:rotate(360deg) translateX(125px)}}@keyframes pzGlow{0%,100%{box-shadow:0 0 14px #6b5cf0}50%{box-shadow:0 0 34px #a99bff}}'; document.head.appendChild(_st); }
      var h = head('🧩 ' + esc(p.title));
      h += '<div style="margin-bottom:8px">' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ' + LV[p.level] + '</div>' + '<div id="pzTm" style="font-size:20px;font-weight:bold;margin-bottom:6px">' + tmText() + '</div>';
      h += boardHtml(g.b, { sel: sel, hl: tg2 });
      h += '<div style="min-height:28px;margin:10px 0;font-size:16px">' + msg + '</div>';
      var _a = sibs(), _i = _a.findIndex(function (x) { return x.id === p.id; });
      h += '<div style="margin:4px 0 8px;opacity:.75">' + (_i + 1) + ' / ' + _a.length + '</div>';
      if (_i > 0) h += '<button id="pzPrev" style="' + BG + '">⬅️ Oldingi</button>';
      if (_a.length > 1) h += done ? ('<div style="text-align:center"><span class="pzWrap"><span class="pzO">' + [0,1,2,3,4,5,6,7].map(function (k) { return '<i style="animation-delay:-' + (k * 0.375) + 's"></i>'; }).join('') + '</span><button id="pzNext" class="pzBig" style="' + BS + '">➡️ Keyingi masala</button></span></div>') : '<button id="pzNext" style="' + BG + '">➡️ Keyingi</button>';
      h += '<button id="pzR" style="' + BG + '">🔄 Qayta</button><button id="pzH" style="' + BS + '">💡 Ko‘rsatma</button>';
      if (S.link) h += '<button id="pzS" style="' + BS + '">📤 Yuborish</button>'; if (S.admin) h += '<button id="pzN" style="' + BG + '">✏️ Nomi</button>'; if (S.admin) h += '<button id="pzD" style="' + BG + '">🗑 O‘chirish</button>';
      ov.innerHTML = h;
      on('#pzBack', list);
      on('#pzPrev', function () { var a = sibs(), i = a.findIndex(function (x) { return x.id === p.id; }); if (i > 0) play(a[i - 1]); });
      on('#pzNext', goNext);
      on('#pzR', function () { play(p); });
      on('#pzS', function () {
        var u = S.link + '?startapp=pz_' + p.id, t = '🧩 Shashka masalasi: ' + p.title;
        var sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t);
        if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
      });
      on('#pzN', function () {
        var n = prompt('Yangi nom:', p.title); if (n === null) return; n = n.trim(); if (!n) return;
        api('/api/puzzle/rename', { id: p.id, title: n }).then(function (d) {
          if (d && d.ok) { p.title = d.title; S.list.forEach(function (x) { if (x.id === p.id) x.title = d.title; }); msg = '✅ Nom o‘zgardi'; }
          else msg = '⚠️ Nom o‘zgarmadi';
          draw();
        });
      });
      on('#pzH', function () { if (!done && !busy && g.side === p.side && p.sol[idx]) { sel = [p.sol[idx][0], p.sol[idx][1]]; draw(); } });
      on('#pzD', function () {
        if (!confirm('Masala o‘chirilsinmi?')) return;
        api('/api/puzzle/del', { id: p.id }).then(function () { load(); });
      });
      bindBoard(tap);
    }
    function sibs() { var f = foOf(p); return S.list.filter(function (x) { return foOf(x) === f; }).sort(function (x, y) { return (x.no || 0) - (y.no || 0); }); }
    function goNext() { if (_fs.lock && !done && !S.admin && (S.solved || []).indexOf(p.id) < 0) { msg = '🔒 Avval shu masalani yeching'; draw(); return; }
      var a = sibs(), i = a.findIndex(function (x) { return x.id === p.id; }), sv = S.solved || [], n = a.length, j, k;
      
      if (i < n - 1) return play(a[i + 1]);
      msg = '🏁 Bu papkadagi oxirgi masala'; draw();
    }
    window.pzFan = window.pzFan || (function () {
      var A = null;
      function c() { if (!A) A = new (window.AudioContext || window.webkitAudioContext)(); if (A.state === 'suspended') A.resume(); return A; }
      document.addEventListener('pointerdown', function () { try { c(); } catch (e) {} }, true);
      function n(f, t, d, g) { var a = c(), o = a.createOscillator(), v = a.createGain(), t0 = a.currentTime + t; o.type = 'triangle'; o.frequency.setValueAtTime(f, t0); v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(v); v.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.05); }
      return function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (x, i) { n(x, i * 0.1, 0.35, 0.3); }); n(1318.5, 0.42, 0.5, 0.22); };
    })();
    function solved() { if (tOut) return; try { window.pzFan(); } catch (e) {} var _el = pzEl(), _er = errs; fin = _el;
      done = true; msg = '🎉 Masala yechildi!'; draw();
      api('/api/puzzle/solved', { id: p.id, time: _el, errs: _er, ref: window.__pzRef || '' }).then(function (d) {
        if (d && d.gain) msg += ' +' + d.gain + ' 💎';
        msg += ' · ⏱ ' + _el + ' s · xato: ' + _er;
        if (d && d.best) { S.best = S.best || {}; S.best[p.id] = d.best; msg += ' · 🏅 eng yaxshi: ' + d.best + ' s'; }
        if ((S.solved || []).indexOf(p.id) < 0) S.solved.push(p.id);
        draw();
      });
    }
    function next() {
      if (g.side === p.side || idx >= p.sol.length) return;
      busy = true;
      setTimeout(function () {
        var w = oppPick(), st = findStep(legal(g.b, g.side, g.forced), [w[0], w[1]], [w[2], w[3]]);
        if (!st) { busy = false; msg = '⚠️ Masalada xato'; draw(); return; }
        g = adv(g, st); idx++; busy = false;
        if (idx >= p.sol.length) return solved();
        draw(); next();
      }, 500);
    }
    function tap(r, c) {
      if (done || busy || g.side !== p.side) return;
      var lg = legal(g.b, g.side, g.forced), p0 = g.b[r][c];
      if (sel) {
        var st = findStep(lg, sel, [r, c]);
        if (st) {
          var w = pick(st);
          if (w && w[0] === st.f[0] && w[1] === st.f[1] && w[2] === st.t[0] && w[3] === st.t[1]) {
            g = adv(g, st); idx++; sel = (g.forced && g.side === p.side) ? [g.forced[0], g.forced[1]] : null; msg = '✅ To‘g‘ri';
            if (idx >= p.sol.length) return solved();
            draw(); next();
          } else { sel = null; errs++; msg = '❌ Noto‘g‘ri (xato: ' + errs + '). kutilgan: ' + JSON.stringify(p.sol[idx]) + ' siz: ' + JSON.stringify([st.f[0], st.f[1], st.t[0], st.t[1]]); draw(); }
          return;
        }
      }
      if (sel) msg = 'ℹ️ yurish yo‘q: ' + JSON.stringify(sel) + '→' + r + ',' + c + ' mumkin: ' + JSON.stringify(lg.map(function (q) { return [q.f, q.t]; }));
      sel = (p0 && sideOf(p0) === g.side && lg.some(function (s) { return s.f[0] === r && s.f[1] === c; })) ? [r, c] : null;
      draw();
    }
    draw();
  }

  // ---- masala kiritish (faqat admin)
  function editor() {
    var b = blank(), tool = 1, side = 'w', title = '', level = (edLv || 1), mode = 'edit', g = null, hist = [], rec = [], recSides = [], sel = null, b0 = null, msg = '', extra = [];
    function sync() {
      var t = ov.querySelector('#pzT'); if (t) title = t.value;
      var l = ov.querySelector('#pzL'); if (l) level = Number(l.value);
    }
    function draw() {
      var sc = ov.scrollTop, h, tools = [[1, '⚪'], [2, '⚫'], [3, '⚪♛'], [4, '⚫♛'], [0, '🧽']];
      if (mode === 'edit') {
        h = head('➕ Yangi masala');
        h += '<div style="font-size:13px;opacity:.7;margin-bottom:8px">Asbobni tanlang, to‘q katakka bosing</div>';
        h += boardHtml(b, {});
        h += '<div style="margin-top:8px">' + tools.map(function (t) { return '<button data-t="' + t[0] + '" style="' + (tool === t[0] ? BS : BG) + '">' + t[1] + '</button>'; }).join('') + '</div>';
        h += '<div>Yuradi: <button data-s="w" style="' + (side === 'w' ? BS : BG) + '">⚪ Oq</button><button data-s="b" style="' + (side === 'b' ? BS : BG) + '">⚫ Qora</button></div>';
        h += '<input id="pzT" maxlength="40" placeholder="Masala nomi" value="' + esc(title) + '" style="width:92%;box-sizing:border-box;margin:8px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
        h += '<div><select id="pzL" style="padding:10px;border-radius:12px;background:#161a3a;color:#fff;border:1px solid #333a80;font-size:15px">' + [1, 2, 3].map(function (i) { return '<option value="' + i + '"' + (level === i ? ' selected' : '') + '>' + LV[i] + '</option>'; }).join('') + '</select></div>';
        h += '<div style="min-height:24px;margin:8px 0;color:#ffb3b3">' + msg + '</div>';
        h += '<button id="pzClr" style="' + BG + '">🧹 Tozalash</button><button id="pzStd" style="' + BG + '">📋 Boshlang‘ich</button><button id="pzRec" style="' + BS + '">▶ Yechimni kiritish</button>';
      } else {
        var tg2 = [];
        if (sel) tg2 = legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === sel[0] && s.f[1] === sel[1]; }).map(function (s) { return s.t; });
        h = head('🎯 Yechimni kiriting');
        h += '<div style="font-size:13px;opacity:.75;margin-bottom:8px">Avval yechuvchi (' + (side === 'w' ? '⚪' : '⚫') + ') yuradi, keyin raqib javobi va hokazo. Oxirgi yurish yechuvchiniki bo‘lsin.</div>';
        h += '<div style="margin-bottom:8px">Navbat: ' + (g.side === 'w' ? '⚪ Oq' : '⚫ Qora') + ' · yurishlar: ' + rec.length + '</div>';
        h += boardHtml(g.b, { sel: sel, hl: tg2 });
        h += '<div style="min-height:24px;margin:8px 0;color:#ffb3b3">' + msg + '</div>';
        h += '<button id="pzUn" style="' + BG + '">↩ Bekor</button><button id="pzEd" style="' + BG + '">✏️ Doska</button><button id="pzVar" style="' + BG + '">➕ Variant</button><button id="pzSv" style="' + BS + '">💾 Saqlash</button>';
      }
      ov.innerHTML = h; ov.scrollTop = sc;
      on('#pzBack', function () { if (mode === 'rec') { mode = 'edit'; msg = ''; draw(); } else list(); });
      if (mode === 'edit') {
        Array.prototype.forEach.call(ov.querySelectorAll('[data-t]'), function (e) { e.onclick = function () { sync(); tool = Number(e.getAttribute('data-t')); draw(); }; });
        Array.prototype.forEach.call(ov.querySelectorAll('[data-s]'), function (e) { e.onclick = function () { sync(); side = e.getAttribute('data-s'); draw(); }; });
        bindBoard(function (r, c) { if ((r + c) % 2 !== 1) return; sync(); b[r][c] = tool; msg = ''; draw(); });
        on('#pzClr', function () { sync(); b = blank(); draw(); });
        on('#pzStd', function () { sync(); b = std(); draw(); });
        on('#pzRec', function () {
          sync();
          var w = 0, k = 0, r, c;
          for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { if (sideOf(b[r][c]) === 'w') w++; if (sideOf(b[r][c]) === 'b') k++; }
          if (!w || !k) { msg = 'Ikkala tomonda ham dona bo‘lsin'; return draw(); }
          if (!legal(b, side, null).length) { msg = 'Bu tomonda yurish yo‘q'; return draw(); }
          b0 = copy(b); g = { b: copy(b), side: side, forced: null }; hist = [g]; rec = []; recSides = []; sel = null; msg = ''; extra = []; mode = 'rec'; draw();
        });
      } else {
        bindBoard(recTap);
        on('#pzUn', function () { if (rec.length) { rec.pop(); recSides.pop(); hist.pop(); g = hist[hist.length - 1]; sel = null; msg = ''; draw(); } });
        on('#pzEd', function () { mode = 'edit'; msg = ''; draw(); });
        on('#pzVar', addVar); on('#pzSv', save);
      }
    }
    function addVar() {
      if (!rec.length) { msg = 'Avval yurishlarni kiriting'; return draw(); }
      if (recSides[recSides.length - 1] !== side || g.forced) { msg = '⚠️ Variant yechuvchi yurishi bilan tugashi kerak'; return draw(); }
      extra.push(rec.slice());
      g = { b: copy(b0), side: side, forced: null }; hist = [g]; rec = []; recSides = []; sel = null;
      msg = '✅ ' + extra.length + '-variant saqlandi. Endi ' + (extra.length + 1) + '-variantni kiriting';
      draw();
    }
    function recTap(r, c) {
      var lg = legal(g.b, g.side, g.forced), p0 = g.b[r][c];
      if (sel) {
        var st = findStep(lg, sel, [r, c]);
        if (st) {
          recSides.push(g.side); rec.push([st.f[0], st.f[1], st.t[0], st.t[1]]);
          g = adv(g, st); hist.push(g); sel = null; msg = ''; return draw();
        }
      }
      sel = (p0 && sideOf(p0) === g.side && lg.some(function (s) { return s.f[0] === r && s.f[1] === c; })) ? [r, c] : null;
      draw();
    }
    function save() {
      if (!rec.length && !extra.length) { msg = 'Avval yechim yurishlarini kiriting'; return draw(); }
      if (rec.length && (recSides[recSides.length - 1] !== side || g.forced)) { msg = '⚠️ Oxirgi yurish yechuvchiniki bo‘lishi va zarba tugallanishi kerak'; return draw(); }
      msg = 'Saqlanmoqda…'; draw();
      api('/api/puzzle', { folder: edFolder, title: title || 'Masala', level: level, side: side, board: b0, sol: (extra.length ? extra[0] : rec), sols: (rec.length ? extra.concat([rec]) : extra) }).then(function (d) {
        if (d && d.ok) load(); else { msg = '⚠️ Saqlanmadi: ' + ((d && d.error) || ''); draw(); }
      }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    draw();
  }

  window.spPuzzles = open;
  var _sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (_sp && _sp.indexOf('pz_') === 0) { pending = _sp.slice(3); setTimeout(open, 700); }
  if (_sp && _sp.indexOf('pf_') === 0) { try { var _r = _sp.slice(3), _m = /^(\d{3,15})_(.+)$/.exec(_r); if (_m) { window.__pzRef = _m[1]; _r = _m[2]; } var _b = _r.replace(/-/g, '+').replace(/_/g, '/'); while (_b.length % 4) _b += '='; window.__pzPF = decodeURIComponent(escape(atob(_b))); } catch (e) {} setTimeout(open, 700); }
  if (/[?&]go=puz/.test(location.search || '') || _sp === 'go_puz') setTimeout(open, 700);
})();


;(function () {
  if (window.spShop) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var BS = 'border:0;border-radius:12px;padding:9px 12px;background:#6b5cf0;color:#fff;font-size:14px;margin:3px';
  var BG = 'border:0;border-radius:12px;padding:9px 12px;background:#262b66;color:#fff;font-size:14px;margin:3px';
  var BO = 'border:0;border-radius:12px;padding:9px 12px;background:linear-gradient(90deg,#f59e0b,#ea580c);color:#fff;font-size:14px;margin:3px';
  var KS = ['w', 'b', 'wk', 'bk'], KN = { w: 'Oq', b: 'Qora', wk: 'Oq damka', bk: 'Qora damka' };
  var ov = null, S = { list: [], owned: [], equipped: '', diamonds: 0, admin: false, link: '' }, tab = 'app', msg = '', form = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
  }
  function imgUrl(id, k) { return '/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + k; }
  function applyEq() {
    var o = document.getElementById('spShopCss'); if (o) o.remove();
    var eqId = S.equipped === '-' ? '' : (S.equipped || S.def || ''); window.spEqId = eqId; if (!eqId || !S.list.some(function (x) { return x.id === eqId; })) return;
    var id = eqId, B = 'html body #board[data-th][data-ps] .sq .pc';
    var css = B + '::before,' + B + '::after{display:none!important}'
      + B + '{background-color:transparent!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 3px 2px #0007)}'
      + B + '.w{background-image:url("' + imgUrl(id, 'w') + '")!important}'
      + B + '.b{background-image:url("' + imgUrl(id, 'b') + '")!important}'
      + B + '.w.k{background-image:url("' + imgUrl(id, 'wk') + '")!important}'
      + B + '.b.k{background-image:url("' + imgUrl(id, 'bk') + '")!important}';
    var st = document.createElement('style'); st.id = 'spShopCss'; st.textContent = css; document.head.appendChild(st);
  }
  function merge(d) { S = d; applyEq(); }

  function open() {
    var old = document.getElementById('spShop'); if (old) old.remove();
    ov = document.createElement('div'); ov.id = 'spShop';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit;text-align:center';
    document.body.appendChild(ov);
    form = null; msg = '';
    ov.innerHTML = '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    api('/api/shop').then(function (d) {
      if (d.error) { ov.innerHTML = '<div style="padding:30px">Telegram orqali kiring</div>'; return; }
      merge(d); draw();
    }).catch(function () { ov.innerHTML = '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; });
  }
  function close() { if (ov) ov.remove(); }
  function head() {
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>💎 Tosh do‘koni</span><span style="font-size:15px">💎 ' + (S.diamonds || 0) + ' <button id="shBack" style="' + BG + '">⬅️</button></span></div>';
  }
  function card(it) {
    var own = S.owned.indexOf(it.id) >= 0 || !!it.def, eq = (S.equipped === '-' ? '' : (S.equipped || S.def)) === it.id;
    var h = '<div style="background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:10px"><b style="font-size:13px">' + esc(it.name) + '</b>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;aspect-ratio:1;margin:8px 0;border-radius:10px;overflow:hidden">';
    KS.forEach(function (k, i) {
      var dark = (i === 1 || i === 2);
      h += '<div style="background:' + (dark ? '#b58863' : '#f0d9b5') + " center/78% no-repeat url('" + imgUrl(it.id, k) + "')\"></div>";
    });
    h += '</div><div style="font-size:13px;opacity:.8">💎 ' + it.price + ' · 🛒 ' + (it.sold || 0) + '</div>';
    if (own) h += '<button data-a="eq" data-id="' + it.id + '" style="' + (eq ? BS : BG) + ';width:92%">' + (eq ? '✅ Tanlangan' : 'Tanlash') + '</button>';
    else h += '<button data-a="buy" data-id="' + it.id + '" style="' + BO + ';width:92%">🛒 Sotib olish</button>';
    if (S.link) h += '<button data-a="sh" data-id="' + it.id + '" style="' + BG + ';width:92%">🔗 Ulashish</button>';
    if (S.admin) h += '<button data-a="def" data-id="' + it.id + '" style="' + BG + ';width:92%">' + (it.def ? '⭐ Asosiy (bekor qilish)' : '⭐ Hamma uchun asosiy') + '</button>'; if (S.admin) h += '<button data-a="del" data-id="' + it.id + '" style="' + BG + ';width:92%">🗑 O‘chirish</button>';
    return h + '</div>';
  }
  function draw() {
    if (form) return drawForm();
    var items = S.list.filter(function (x) { return tab === 'app' ? !x.by : !!x.by; });
    var h = head();
    h += '<div style="display:flex;justify-content:center;margin-bottom:10px"><button data-tab="app" style="' + (tab === 'app' ? BS : BG) + '">🤖 Dastur donalari</button><button data-tab="usr" style="' + (tab === 'usr' ? BS : BG) + '">👥 Userlar donalari</button></div>';
    if (S.admin && tab === 'app') h += '<button id="shNew" style="' + BS + '">➕ Yangi dona</button>';
    if (msg) h += '<div style="margin:8px 0;color:#ffd27a">' + esc(msg) + '</div>';
    if (!items.length) h += '<div style="padding:30px;opacity:.7">' + (tab === 'app' ? 'Hozircha dona yo‘q' : 'Userlar donalari tez orada') + '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">' + items.map(card).join('') + '</div>';
    ov.innerHTML = h;
    ov.querySelector('#shBack').onclick = close;
    var nb = ov.querySelector('#shNew'); if (nb) nb.onclick = function () { form = { name: '', price: '150', pics: {} }; msg = ''; draw(); };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-tab]'), function (e) { e.onclick = function () { tab = e.getAttribute('data-tab'); msg = ''; draw(); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-a]'), function (e) { e.onclick = function () { act(e.getAttribute('data-a'), e.getAttribute('data-id')); }; });
  }
  function reload() { return api('/api/shop').then(function (d) { if (!d.error) merge(d); }); }
  function act(a, id) {
    var it = S.list.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (a === 'buy') {
      if (!confirm(it.name + ' donasini ' + it.price + ' 💎 ga sotib olasizmi?')) return;
      api('/api/shop/buy', { id: id }).then(function (d) {
        if (d && d.ok) { msg = '✅ Sotib olindi'; return reload(); }
        msg = '⚠️ ' + ((d && d.error) || 'Xato');
      }).then(draw).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    } else if (a === 'eq') {
      api('/api/shop/equip', { id: ((S.equipped === '-' ? '' : (S.equipped || S.def)) === id) ? '-' : id }).then(function (d) {
        if (d && d.ok) { S.equipped = d.equipped; applyEq(); msg = (d.equipped && d.equipped !== '-') ? '✅ Dona doskada qo‘llandi' : 'Standart dona qaytdi'; } else msg = '⚠️ ' + ((d && d.error) || 'Xato');
        draw();
      });
    } else if (a === 'sh') {
      var u = S.link + '?startapp=shop_' + id, sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent('💎 Shashka donasi: ' + it.name);
      if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
    } else if (a === 'def') {
      api('/api/shop/default', { id: it.def ? '' : id }).then(reload).then(function () { msg = '✅ Saqlandi'; draw(); });
    } else if (a === 'del') {
      if (!confirm('Dona o‘chirilsinmi?')) return;
      api('/api/shop/del', { id: id }).then(reload).then(draw);
    }
  }

  function drawForm() {
    form.src = form.src || {}; form.t = form.t || {};
    var SB = 'border:0;border-radius:10px;padding:7px 11px;background:#262b66;color:#fff;font-size:15px;margin:2px';
    var h = head() + '<div style="font-size:17px;font-weight:700;margin-bottom:8px">➕ Yangi dona</div>';
    h += '<input id="fN" maxlength="30" placeholder="Nomi" value="' + esc(form.name) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<input id="fP" type="number" min="0" placeholder="Narxi (💎)" value="' + esc(form.price) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">';
    KS.forEach(function (k) {
      var has = !!form.src[k], dis = has ? '' : ';opacity:.35';
      h += '<div style="background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:8px;font-size:13px">' + KN[k];
      if (has) h += '<canvas data-c="' + k + '" width="120" height="120" style="display:block;margin:6px auto;width:120px;height:120px;border-radius:50%;background:#222;touch-action:none"></canvas>';
      else h += '<label style="display:flex;width:120px;height:120px;border-radius:50%;border:2px dashed #555;margin:6px auto;align-items:center;justify-content:center;cursor:pointer;font-size:12px;box-sizing:border-box">📷 Rasm tanlang<input type="file" accept="image/*" data-k="' + k + '" style="display:none"></label>';
      h += '<div>' + [['in', '＋'], ['out', '－'], ['rs', '↺'], ['ct', '🎯'], ['cl', '🧽']].map(function (z) {
        return '<button data-z="' + z[0] + '" data-k="' + k + '" style="' + SB + dis + '">' + z[1] + '</button>';
      }).join('') + '</div></div>';
    });
    h += '</div>';
    if (msg) h += '<div style="margin:8px 0;color:#ffb3b3">' + esc(msg) + '</div>';
    h += '<button id="fC" style="' + BG + '">Bekor</button><button id="fS" style="' + BS + '">💾 Saqlash</button>';
    ov.innerHTML = h;
    ov.querySelector('#shBack').onclick = function () { form = null; msg = ''; draw(); };
    ov.querySelector('#fC').onclick = function () { form = null; msg = ''; draw(); };
    ov.querySelector('#fS').onclick = saveForm;
    Array.prototype.forEach.call(ov.querySelectorAll('input[type=file]'), function (inp) {
      inp.onchange = function () { sync(); pick(inp.getAttribute('data-k'), inp.files && inp.files[0]); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('canvas[data-c]'), function (cv) {
      var k = cv.getAttribute('data-c'), px = 0, py = 0, dn = false;
      paint(k, cv, 120);
      cv.onpointerdown = function (e) { dn = true; px = e.clientX; py = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (x) {} };
      cv.onpointermove = function (e) { if (!dn) return; var t = form.t[k]; t.x += (e.clientX - px) / 120; t.y += (e.clientY - py) / 120; px = e.clientX; py = e.clientY; paint(k, cv, 120); };
      cv.onpointerup = cv.onpointercancel = function () { dn = false; };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-z]'), function (b) {
      b.onclick = function () {
        sync();
        var k = b.getAttribute('data-k'), z = b.getAttribute('data-z'), t = form.t[k];
        if (!form.src[k]) return;
        if (z === 'in') t.s = Math.min(4, t.s * 1.15);
        else if (z === 'out') t.s = Math.max(0.3, t.s / 1.15);
        else if (z === 'rs') { t.s = 1; t.x = 0; t.y = 0; }
        else if (z === 'ct') { autoCenter(k); }
        else { delete form.src[k]; delete form.t[k]; draw(); return; }
        var cv = ov.querySelector('canvas[data-c="' + k + '"]'); if (cv) paint(k, cv, 120);
      };
    });
  }
  function paint(k, cv, sz) {
    var im = form.src[k], t = form.t[k], cx = cv.getContext('2d');
    cx.clearRect(0, 0, sz, sz); cx.save(); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2, 0, 6.2832); cx.clip();
    var m = Math.min(im.width, im.height), sc = sz / m * t.s, dw = im.width * sc, dh = im.height * sc;
    cx.drawImage(im, sz / 2 - dw / 2 + t.x * sz, sz / 2 - dh / 2 + t.y * sz, dw, dh); cx.restore();
    if (cv.getAttribute('data-c')) { cx.save(); cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(sz / 2, 0); cx.lineTo(sz / 2, sz); cx.moveTo(0, sz / 2); cx.lineTo(sz, sz / 2); cx.stroke(); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2 - 3, 0, 6.2832); cx.strokeStyle = 'rgba(80,220,160,.7)'; cx.stroke(); cx.restore(); }
  }
  function autoCenter(k) {
    var im = form.src[k], N = 200, c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true }), m = Math.min(im.width, im.height), sc = N / m;
    x.drawImage(im, N / 2 - im.width * sc / 2, N / 2 - im.height * sc / 2, im.width * sc, im.height * sc);
    var d = x.getImageData(0, 0, N, N).data, bg = [d[0], d[1], d[2], d[3]], x0 = N, y0 = N, x1 = -1, y1 = -1, i, j;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var p = (j * N + i) * 4, a = d[p + 3];
      var solid = bg[3] < 40 ? a > 40 : (a > 40 && (Math.abs(d[p] - bg[0]) + Math.abs(d[p + 1] - bg[1]) + Math.abs(d[p + 2] - bg[2])) > 60);
      if (solid) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    }
    if (x1 < 0) { msg = 'Donani aniqlab bo‘lmadi, qo‘lda sozlang'; return draw(); }
    var w = x1 - x0 + 1, h = y1 - y0 + 1, mid = [(x0 + x1) / 2, (y0 + y1) / 2], t = form.t[k];
    t.s = Math.max(0.3, Math.min(4, N * 0.92 / Math.max(w, h)));
    t.x = -(mid[0] - N / 2) / N * t.s; t.y = -(mid[1] - N / 2) / N * t.s;
    msg = ''; draw();
  }
  function edgeCut(k) {
    var N = 120, c = document.createElement('canvas'); c.width = c.height = N; paint(k, c, N);
    var d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, N, N).data, cnt = 0, tot = 0, a, i;
    for (a = 0; a < 360; a += 4) {
      var px = Math.round(N / 2 + (N / 2 - 3) * Math.cos(a * Math.PI / 180)), py = Math.round(N / 2 + (N / 2 - 3) * Math.sin(a * Math.PI / 180));
      i = (py * N + px) * 4; tot++; if (d[i + 3] > 200) cnt++;
    }
    return cnt / tot > 0.25;
  }
  function exportK(k) {
    var out = '', sz = 200;
    while (sz >= 100) {
      var cv = document.createElement('canvas'); cv.width = cv.height = sz; paint(k, cv, sz);
      out = cv.toDataURL('image/webp', 0.85);
      if (out.length <= 140000) break;
      sz -= 30;
    }
    return out;
  }
  function sync() { var n = ov.querySelector('#fN'), p = ov.querySelector('#fP'); if (n) form.name = n.value; if (p) form.price = p.value; }
  function pick(k, f) {
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () { form.src[k] = im; form.t[k] = { s: 1, x: 0, y: 0 }; msg = ''; draw(); };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  function saveForm() {
    sync();
    var nm = form.name.trim(), pr = Number(form.price);
    if (!nm) { msg = 'Nom yozing'; return draw(); }
    if (!Number.isInteger(pr) || pr < 0) { msg = 'Narx butun son bo‘lsin'; return draw(); }
    if (KS.some(function (k) { return !form.src[k]; })) { msg = '4 ta rasmni ham tanlang'; return draw(); }
    var cut = KS.filter(function (k) { return edgeCut(k); });
    if (cut.length && !form.warned) { form.warned = true; msg = '⚠️ Qirrasi kesilgan: ' + cut.map(function (k) { return KN[k]; }).join(', ') + '. 🎯 yoki － bilan sozlang. Baribir saqlash uchun yana 💾 bosing.'; return draw(); }
    var pics = {}, bad = false;
    KS.forEach(function (k) { pics[k] = exportK(k); if (pics[k].length > 150000) bad = true; });
    if (bad) { msg = '⚠️ Rasm juda og‘ir'; return draw(); }
    msg = 'Saqlanmoqda…'; draw();
    api('/api/shop/add', { name: nm, price: pr, imgs: pics }).then(function (d) {
      if (d && d.ok) { form = null; msg = '✅ Dona qo‘shildi'; return reload().then(draw); }
      msg = '⚠️ ' + ((d && d.error) || 'Saqlanmadi'); draw();
    }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
  }

  
window.spShop = open;
  var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (sp && sp.indexOf('shop_') === 0) setTimeout(open, 700);
  else if (initData) setTimeout(function () { api('/api/shop').then(function (d) { if (d && !d.error) merge(d); }).catch(function () {}); }, 900);
})();

