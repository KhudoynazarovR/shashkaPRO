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
  window.spAnalyze = function (g) {
    var mv = g.moves || [], bs = [start()], i;
    for (i = 0; i < mv.length; i++) bs.push(apply(bs[i], mv[i]));
    var cur = mv.length;
    var old = document.getElementById('spAn'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spAn';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    var res = g.winner === 'white' ? '🏆 ⚪ ' + esc(g.white) : g.winner === 'black' ? '🏆 ⚫ ' + esc(g.black) : '🤝 Durang';
    function draw() {
      var b = bs[cur], m = cur > 0 ? mv[cur - 1] : null, h = '', r, c, p, bg, hl;
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
          h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (white ? '#9a9a9a' : '#000') + ';background:' + (white ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      h += '<div style="margin:10px 0;font-size:15px">Yurish: ' + cur + ' / ' + mv.length + '</div>';
      h += '<div style="display:flex;gap:8px;justify-content:center">';
      var bst = 'border:0;border-radius:14px;padding:12px 18px;background:#6b5cf0;color:#fff;font-size:20px';
      h += '<button id="an0" style="' + bst + '">⏮</button><button id="an1" style="' + bst + '">◀</button><button id="an2" style="' + bst + '">▶</button><button id="an3" style="' + bst + '">⏭</button></div>';
      ov.innerHTML = h;
      ov.querySelector('#anX').onclick = function () { ov.remove(); };
      ov.querySelector('#an0').onclick = function () { cur = 0; draw(); };
      ov.querySelector('#an1').onclick = function () { if (cur > 0) cur--; draw(); };
      ov.querySelector('#an2').onclick = function () { if (cur < mv.length) cur++; draw(); };
      ov.querySelector('#an3').onclick = function () { cur = mv.length; draw(); };
    }
    draw();
  };
})();


;(function () {
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
  function copy(b) { return b.map(function (x) { return x.slice(); }); }
  function std() { var b = blank(), r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = r < 3 ? 2 : (r > 4 ? 1 : 0); return b; }

  // ---- qoidalar (rus shashkasi): majburiy urish, dama uzoqqa yuradi
  function caps(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p);
    DIRS.forEach(function (d) {
      var nr, nc;
      if (p < 3) {
        var mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
        if (ins(lr, lc) && b[mr][mc] && sideOf(b[mr][mc]) !== me && !b[lr][lc]) out.push({ f: [r, c], t: [lr, lc], x: [mr, mc] });
      } else {
        nr = r + d[0]; nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { nr += d[0]; nc += d[1]; }
        if (ins(nr, nc) && sideOf(b[nr][nc]) !== me) {
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
    var n = copy(g.b), p = n[s.f[0]][s.f[1]];
    n[s.f[0]][s.f[1]] = 0;
    if (s.x) n[s.x[0]][s.x[1]] = 0;
    if (p === 1 && s.t[0] === 0) p = 3;
    if (p === 2 && s.t[0] === 7) p = 4;
    n[s.t[0]][s.t[1]] = p;
    var more = s.x && caps(n, s.t[0], s.t[1]).length > 0;
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
  function close() { if (ov) ov.remove(); }
  function load() {
    ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    on('#pzBack', close);
    api('/api/puzzles').then(function (d) {
      if (d.error) { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Telegram orqali kiring</div>'; on('#pzBack', close); return; }
      S = d; var _pid = pending; pending = null; var _pz = _pid && S.list.filter(function (x) { return x.id === _pid; })[0]; if (_pz) play(_pz); else list();
    }).catch(function () { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', close); });
  }
  function list() {
    var h = head('🧩 Masalalar', S.admin ? '<button id="pzNew" style="' + BS + '">➕ Yangi</button>' : '');
    if (!S.list.length) h += '<div style="padding:30px;opacity:.7">Hozircha masala yo‘q</div>';
    S.list.forEach(function (p, i) {
      var ok = (S.solved || []).indexOf(p.id) >= 0;
      h += '<div data-i="' + i + '" style="text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer"><b>' + (ok ? '✅ ' : '') + esc(p.title) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + LV[p.level] + ' · ' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + '</div></div>';
    });
    if (!S.admin) h += '<div style="font-size:11px;opacity:.4;margin-top:16px">ID: ' + esc(S.myId) + '</div>';
    ov.innerHTML = h;
    on('#pzBack', close); on('#pzNew', editor);
    Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (e) {
      e.onclick = function () { play(S.list[Number(e.getAttribute('data-i'))]); };
    });
  }

  // ---- yechish
  function play(p) {
    p = Object.assign({}, p);
    var lines = (p.sols && p.sols.length) ? p.sols : [p.sol], alive = lines.map(function (_, i) { return i; });
    p.sol = lines[0];
    var g = { b: copy(p.board), side: p.side, forced: null }, idx = 0, sel = null, msg = '', done = false, busy = false;
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
      var h = head('🧩 ' + esc(p.title));
      h += '<div style="margin-bottom:8px">' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ' + LV[p.level] + '</div>';
      h += boardHtml(g.b, { sel: sel, hl: tg2 });
      h += '<div style="min-height:28px;margin:10px 0;font-size:16px">' + msg + '</div>';
      h += '<button id="pzR" style="' + BG + '">🔄 Qayta</button><button id="pzH" style="' + BS + '">💡 Ko‘rsatma</button>';
      if (S.link) h += '<button id="pzS" style="' + BS + '">📤 Yuborish</button>'; if (S.admin) h += '<button id="pzN" style="' + BG + '">✏️ Nomi</button>'; if (S.admin) h += '<button id="pzD" style="' + BG + '">🗑 O‘chirish</button>';
      ov.innerHTML = h;
      on('#pzBack', list);
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
    function solved() {
      done = true; msg = '🎉 Masala yechildi!'; draw();
      api('/api/puzzle/solved', { id: p.id }).then(function (d) {
        if (d && d.gain) msg += ' +' + d.gain + ' 💎';
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
            g = adv(g, st); idx++; sel = null; msg = '✅ To‘g‘ri';
            if (idx >= p.sol.length) return solved();
            draw(); next();
          } else { sel = null; msg = '❌ Noto‘g‘ri, boshqa yurishni sinang'; draw(); }
          return;
        }
      }
      sel = (p0 && sideOf(p0) === g.side && lg.some(function (s) { return s.f[0] === r && s.f[1] === c; })) ? [r, c] : null;
      draw();
    }
    draw();
  }

  // ---- masala kiritish (faqat admin)
  function editor() {
    var b = blank(), tool = 1, side = 'w', title = '', level = 1, mode = 'edit', g = null, hist = [], rec = [], recSides = [], sel = null, b0 = null, msg = '', extra = [];
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
      api('/api/puzzle', { title: title || 'Masala', level: level, side: side, board: b0, sol: (extra.length ? extra[0] : rec), sols: (rec.length ? extra.concat([rec]) : extra) }).then(function (d) {
        if (d && d.ok) load(); else { msg = '⚠️ Saqlanmadi: ' + ((d && d.error) || ''); draw(); }
      }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    draw();
  }

  window.spPuzzles = open;
  var _sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (_sp && _sp.indexOf('pz_') === 0) { pending = _sp.slice(3); setTimeout(open, 700); }
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
    if (!S.equipped || !S.list.some(function (x) { return x.id === S.equipped; })) return;
    var id = S.equipped, B = 'html body #board .sq .pc';
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
    var own = S.owned.indexOf(it.id) >= 0, eq = S.equipped === it.id;
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
    if (S.admin) h += '<button data-a="del" data-id="' + it.id + '" style="' + BG + ';width:92%">🗑 O‘chirish</button>';
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
      api('/api/shop/equip', { id: S.equipped === id ? '' : id }).then(function (d) {
        if (d && d.ok) { S.equipped = d.equipped; applyEq(); msg = d.equipped ? '✅ Dona doskada qo‘llandi' : 'Standart dona qaytdi'; } else msg = '⚠️ ' + ((d && d.error) || 'Xato');
        draw();
      });
    } else if (a === 'sh') {
      var u = S.link + '?startapp=shop_' + id, sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent('💎 Shashka donasi: ' + it.name);
      if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
    } else if (a === 'del') {
      if (!confirm('Dona o‘chirilsinmi?')) return;
      api('/api/shop/del', { id: id }).then(reload).then(draw);
    }
  }

  function drawForm() {
    var h = head() + '<div style="font-size:17px;font-weight:700;margin-bottom:8px">➕ Yangi dona</div>';
    h += '<input id="fN" maxlength="30" placeholder="Nomi" value="' + esc(form.name) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<input id="fP" type="number" min="0" placeholder="Narxi (💎)" value="' + esc(form.price) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">';
    KS.forEach(function (k) {
      var pv = form.pics[k] ? '<img src="' + form.pics[k] + '" style="width:64px;height:64px;border-radius:50%">' : '<div style="width:64px;height:64px;border-radius:50%;border:2px dashed #555;margin:0 auto"></div>';
      h += '<label style="background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:8px;font-size:13px">' + KN[k] + '<br>' + pv + '<input type="file" accept="image/*" data-k="' + k + '" style="display:none"></label>';
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
  }
  function sync() { var n = ov.querySelector('#fN'), p = ov.querySelector('#fP'); if (n) form.name = n.value; if (p) form.price = p.value; }
  function pick(k, f) {
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var out = '', sz = 200;
        while (sz >= 100) {
          var cv = document.createElement('canvas'); cv.width = cv.height = sz;
          var cx = cv.getContext('2d'); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2, 0, 6.2832); cx.clip();
          var m = Math.min(im.width, im.height), sx = (im.width - m) / 2, sy = (im.height - m) / 2;
          cx.drawImage(im, sx, sy, m, m, 0, 0, sz, sz);
          out = cv.toDataURL('image/webp', 0.85);
          if (out.length <= 140000) break;
          sz -= 30;
        }
        if (out.length > 150000) { msg = '⚠️ Rasm juda og‘ir'; return draw(); }
        form.pics[k] = out; msg = ''; draw();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  function saveForm() {
    sync();
    var nm = form.name.trim(), pr = Number(form.price);
    if (!nm) { msg = 'Nom yozing'; return draw(); }
    if (!Number.isInteger(pr) || pr < 0) { msg = 'Narx butun son bo‘lsin'; return draw(); }
    if (KS.some(function (k) { return !form.pics[k]; })) { msg = '4 ta rasmni ham tanlang'; return draw(); }
    msg = 'Saqlanmoqda…'; draw();
    api('/api/shop/add', { name: nm, price: pr, imgs: form.pics }).then(function (d) {
      if (d && d.ok) { form = null; msg = '✅ Dona qo‘shildi'; return reload().then(draw); }
      msg = '⚠️ ' + ((d && d.error) || 'Saqlanmadi'); draw();
    }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
  }

  window.spShop = open;
  var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (sp && sp.indexOf('shop_') === 0) setTimeout(open, 700);
  else if (initData) setTimeout(function () { api('/api/shop').then(function (d) { if (d && !d.error) merge(d); }).catch(function () {}); }, 900);
})();

