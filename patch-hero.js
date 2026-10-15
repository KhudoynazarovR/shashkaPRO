const fs = require('fs');
let s = fs.readFileSync('lobbyclient.js', 'utf8');
if (s.includes('hzHero')) { console.log('Allaqachon bor'); process.exit(0); }
const A = 'window.lbFriend = function () { sendMsg({ type: "lbFriendNew"';
const n = s.split(A).length - 1;
if (n !== 1) { console.log('XATO: lbFriend topilmadi (' + n + ')'); process.exit(1); }
const CODE = String.raw`;(function () {
      var tgw = window.Telegram && window.Telegram.WebApp;
      var hero = null, daily = null, dailyT = 0, recent = null, recentT = 0, recSig = "";
      if (!document.getElementById("hzCss")) {
        var st = document.createElement("style"); st.id = "hzCss";
        st.textContent = [
          "#lbPanel .lbcards{display:none!important}",
          "@keyframes hzSh{0%{left:-60%}60%,100%{left:140%}}",
          "@keyframes hzS{0%{background-position:200% 0}100%{background-position:-200% 0}}",
          "@keyframes hzG{0%,100%{box-shadow:0 0 8px #ffb300}50%{box-shadow:0 0 22px #ff5e00}}",
          ".hz{margin:4px 0 12px;color:#fff;text-align:left}",
          ".hzHead{display:flex;align-items:center;gap:12px;padding:6px 2px 10px}",
          ".hzLogo{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:25px;flex:none;background:radial-gradient(circle at 35% 30%,#5b3fd0,#1d1350);box-shadow:0 0 0 2px #9a7bff,0 0 18px rgba(154,123,255,.7)}",
          ".hzHt{flex:1;min-width:0}.hzHt b{display:block;font-size:19px;letter-spacing:.2px}.hzHt span{font-size:12px;color:#a9b8ff}",
          ".hzOn{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:20px;border:1.5px solid #19c8a0;background:rgba(25,200,160,.14);font-weight:700;font-size:14px;flex:none}",
          ".hzOn i{width:10px;height:10px;border-radius:50%;background:#2dff72;box-shadow:0 0 8px #2dff72}",
          ".hzTitle{display:flex;align-items:center;gap:10px;margin:2px 0 12px}",
          ".hzPad{font-size:34px;flex:none}.hzTitle h1{margin:0;font-size:28px;font-weight:900;letter-spacing:.5px;line-height:1.05}",
          ".hzTitle p{margin:3px 0 0;font-size:13px;opacity:.82;line-height:1.25}",
          ".hzGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
          ".hzC{position:relative;overflow:hidden;border-radius:22px;padding:14px;min-height:158px;display:flex;flex-direction:column;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.32),0 8px 22px rgba(0,0,0,.4);-webkit-tap-highlight-color:transparent;transition:transform .12s}",
          ".hzC:active,.hzW:active{transform:scale(.97)}",
          ".hzC::after,.hzW::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.26),transparent);transform:skewX(-20deg);animation:hzSh 4.2s infinite;pointer-events:none}",
          ".hzIc{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none;background:rgba(255,255,255,.2);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6),0 0 14px rgba(255,255,255,.28)}",
          ".hzC b{display:block;font-size:17px;margin-top:10px;line-height:1.15}",
          ".hzC small{display:block;font-size:12px;opacity:.92;margin-top:4px;line-height:1.3}",
          ".hzFoot{margin-top:auto;padding-top:10px;display:flex;align-items:center;justify-content:space-between;gap:6px}",
          ".hzGo{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.95);color:#5a2fd0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;flex:none;margin-left:auto}",
          ".hzPl{padding:9px 16px;border-radius:20px;border:2px solid rgba(255,255,255,.9);background:rgba(255,255,255,.14);font-weight:800;font-size:14px;margin-left:auto}",
          ".hzChip{padding:6px 10px;border-radius:14px;background:rgba(0,0,0,.22);font-weight:700;font-size:12px;white-space:nowrap}",
          ".hzC1{background:linear-gradient(145deg,#ff5d8f 0%,#c13cff 58%,#7a3dff 100%)}",
          ".hzC2{background:linear-gradient(145deg,#2c7bff 0%,#1fa6ff 60%,#1ad0ff 100%)}",
          ".hzC3{background:linear-gradient(145deg,#ff9a1f 0%,#ff6a1f 55%,#ff3d4f 100%)}",
          ".hzC4{background:linear-gradient(145deg,#18d27a 0%,#0fb58a 60%,#0e8fa0 100%)}",
          ".hzW{position:relative;overflow:hidden;margin-top:12px;border-radius:22px;padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;background:linear-gradient(100deg,#8a3dff,#5a35e0 60%,#6f3cf0);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.32),0 8px 22px rgba(0,0,0,.4);transition:transform .12s}",
          ".hzW .hzIc{width:46px;height:46px;font-size:23px}.hzW b{display:block;font-size:17px;white-space:nowrap}.hzW small{display:block;font-size:12px;opacity:.92;margin-top:3px;line-height:1.3}",
          ".hzBtn{margin-left:auto;flex:none;padding:9px 12px;border-radius:20px;border:2px solid rgba(255,255,255,.88);background:rgba(255,255,255,.14);font-weight:800;font-size:13px;white-space:nowrap}",
          ".hzPromo{margin-top:12px;border-radius:18px;padding:12px 14px;color:#2a1600;font-weight:800;font-size:14px;line-height:1.25;cursor:pointer;background:linear-gradient(110deg,#ffb300 20%,#fff4b0 40%,#ffb300 60%,#ff7a00 80%);background-size:300% 100%;animation:hzS 3s linear infinite,hzG 1.6s ease-in-out infinite}",
          ".hzPromo small{display:block;font-weight:700;opacity:.8;font-size:12px;margin-top:3px}",
          ".hzDaily{margin-top:12px;border-radius:18px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;background:linear-gradient(110deg,#2a1b6e,#4b2aa8 50%,#2a1b6e);box-shadow:inset 0 0 0 1.5px #f5c542,0 0 18px rgba(245,197,66,.35)}",
          ".hzDi{font-size:30px;flex:none}.hzDaily small{display:block;color:#f5c542;font-weight:700;font-size:12px}.hzDaily b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
          ".hzN{flex:none;padding:7px 12px;border-radius:14px;background:rgba(245,197,66,.18);color:#ffd96b;font-weight:800;font-size:14px}",
          ".hzCnt{display:flex;gap:12px;margin-top:12px}",
          ".hzCn{position:relative;flex:1;min-width:0;border-radius:18px;padding:12px 8px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;cursor:pointer;background:rgba(255,255,255,.06);white-space:nowrap}",
          ".hzDot{position:absolute;top:8px;right:10px;width:11px;height:11px;border-radius:50%;background:#ff3b4e;box-shadow:0 0 8px #ff3b4e}",
          ".hzCn b{font-size:21px}",
          "#hzCp{box-shadow:inset 0 0 0 1.5px #1fcf8a;color:#9dffd0}#hzCf{box-shadow:inset 0 0 0 1.5px #4d8dff;color:#b6d0ff}",
          ".hzRec{margin-top:12px;border-radius:20px;padding:12px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1.5px rgba(139,124,255,.55)}",
          ".hzRh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.hzRh b{font-size:16px}.hzRh span{font-size:13px;color:#9fb0ff;cursor:pointer}",
          ".hzRl{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}",
          ".hzG{flex:1 0 82px;min-width:82px;border-radius:14px;padding:9px 6px;background:rgba(255,255,255,.07);text-align:center;cursor:pointer}",
          ".hzV{display:flex;align-items:center;justify-content:center;gap:5px;height:34px}",
          ".hzV img,.hzV .hzO,.hzV .hzMe{width:28px;height:28px;border-radius:50%;object-fit:cover;display:flex;align-items:center;justify-content:center;background:#3b34a8;font-size:15px;font-weight:700}",
          ".hzV small{opacity:.6;font-size:11px}",
          ".hzG em{display:block;font-style:normal;font-size:12px;font-weight:700;border-radius:10px;padding:3px 0;margin:7px 4px 4px}",
          ".hzG em.w{background:rgba(32,200,110,.22);color:#7dffb0}.hzG em.l{background:rgba(255,80,90,.22);color:#ff9aa2}.hzG em.d{background:rgba(160,170,210,.22);color:#cfd6f5}",
          ".hzG small{display:block;font-size:10px;opacity:.65;white-space:nowrap}",
          "@media (prefers-reduced-motion:reduce){.hzC::after,.hzW::after,.hzPromo{animation:none!important}}"
        ].join("");
        document.head.appendChild(st);
      }
      var HTML =
        "<div class=\"hzHead\"><div class=\"hzLogo\">👑</div><div class=\"hzHt\"><b>ShashkaPROBot</b><span>O‘yin • Do‘stlar • G‘alaba</span></div><div class=\"hzOn\"><i></i>Online</div></div>" +
        "<div class=\"hzTitle\"><span class=\"hzPad\">🎮</span><div><h1>O‘YIN ZALI</h1><p>O‘yiningizga mos o‘yinni tanlang va boshlang!</p></div></div>" +
        "<div class=\"hzGrid\">" +
        "<div class=\"hzC hzC1\" id=\"hzFr\"><div class=\"hzIc\">🤝</div><b>Do‘st bilan o‘ynash</b><small>Havola yuboring — do‘stingiz bossa, o‘yin boshlanadi</small><div class=\"hzFoot\"><span class=\"hzGo\">➜</span></div></div>" +
        "<div class=\"hzC hzC2\" id=\"hzRnd\"><div class=\"hzIc\">🔀</div><b>Tasodifiy raqib</b><small>Tasodifiy o‘yinchi bilan o‘ynang</small><div class=\"hzFoot\"><span class=\"hzPl\" id=\"hzRndB\">▶ O‘ynash</span></div></div>" +
        "<div class=\"hzC hzC3\" id=\"hzQk\"><div class=\"hzIc\">⚡</div><b>Tezkor o‘yin</b><small>Vaqtingiz kammi? Tez o‘yin tanlang!</small><div class=\"hzFoot\"><span class=\"hzChip\" id=\"hzQkC\">⏱ Tez</span><span class=\"hzGo\">➜</span></div></div>" +
        "<div class=\"hzC hzC4\" id=\"hzAi\"><div class=\"hzIc\">🤖</div><b>Kompyuterga qarshi</b><small>Sun‘iy intellekt bilan mahoratingizni sinang!</small><div class=\"hzFoot\"><span class=\"hzChip\">🎯 Mashq</span><span class=\"hzGo\">➜</span></div></div>" +
        "</div>" +
        "<div class=\"hzW\" id=\"hzMkR\"><div class=\"hzIc\">🏠</div><div style=\"min-width:0\"><b>Xona yaratish</b><small>Vaqt va pozitsiyani tanlang, do‘stlarni taklif qiling.</small></div><span class=\"hzBtn\">＋ Yaratish</span></div>" +
        "<div class=\"hzPromo\" id=\"hzPromo\" style=\"display:none\"></div>" +
        "<div class=\"hzDaily\" id=\"hzDaily\" style=\"display:none\"></div>" +
        "<div class=\"hzCnt\"><div class=\"hzCn\" id=\"hzCp\"></div><div class=\"hzCn\" id=\"hzCf\"></div></div>" +
        "<div class=\"hzRec\" id=\"hzRec\" style=\"display:none\"></div>";
      function ago(ts) {
        var m = Math.max(0, Math.floor((Date.now() - ts) / 60000));
        if (m < 1) return "hozir";
        if (m < 60) return m + " daqiqa oldin";
        var h = Math.floor(m / 60);
        if (h < 24) return h + " soat oldin";
        return Math.floor(h / 24) + " kun oldin";
      }
      function shortTc() {
        var sel = document.getElementById("lbTc"); if (!sel) return null;
        var best = null, bv = 1e9, i, v;
        for (i = 0; i < sel.options.length; i++) {
          v = parseFloat(sel.options[i].value);
          if (isFinite(v) && v > 0 && v < bv) { bv = v; best = sel.options[i].value; }
        }
        return best;
      }
      function addMk(e) {
        if (document.getElementById("hzMk")) return;
        var d = document.createElement("div"); d.className = "row";
        d.innerHTML = "<button id=\"hzMk\" style=\"flex:1\">🔗 Havola yaratish va ulashish</button>";
        e.appendChild(d);
        document.getElementById("hzMk").onclick = function () { window.lbFriend(); };
      }
      function openSet() {
        var e = $("lbSet"); if (!e) return;
        var show = e.style.display === "none";
        e.style.display = show ? "block" : "none";
        if (show) { addMk(e); try { e.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (x) {} }
      }
      function quickShort() {
        var sel = $("lbTc"), q = $("lbQuick"), t = shortTc();
        if (!sel || !q) return;
        if (S.inQueue) { q.click(); return; }
        if (!t) { openSet(); return; }
        var old = sel.value; sel.value = t; q.click(); sel.value = old;
      }
      function goList(f) {
        curTab = "pl"; window.__lbF = f; renderAll();
        var l = $("lbPl"); try { l.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (x) {}
      }
      function sharePromo() {
        if (!S.me) return;
        var link = (window.TG_APP_LINK || "https://t.me/DraughtsPRObot/play") + "?startapp=ref_" + S.me.uid;
        var u = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("Shashka PRO — kel, 500 💎 sovg‘a!");
        if (tgw && tgw.openTelegramLink) tgw.openTelegramLink(u); else window.open(u, "_blank");
      }
      function loadDaily() {
        if (Date.now() - dailyT < 60000) return; dailyT = Date.now();
        fetch("/api/puzzles/day", { headers: { "x-init-data": initData } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { daily = d && d.top && d.top[0] ? d.top[0] : null; })
          .catch(function () {});
      }
      function loadRecent() {
        if (Date.now() - recentT < 90000) return; recentT = Date.now();
        fetch("/api/archive", { headers: { "x-init-data": initData } })
          .then(function (r) { return r.json(); })
          .then(function (d) { recent = ((d && d.list) || []).slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 4); })
          .catch(function () {});
      }
      function openGame(g) {
        if (!window.spAnalyze) return;
        window.spAnalyze({
          white: g.w, black: g.b, winner: g.win,
          moves: (g.m || []).map(function (x) { return { from: { r: x[0], c: x[1] }, to: { r: x[2], c: x[3] }, captures: (x[4] || []).map(function (y) { return { r: y[0], c: y[1] }; }) }; })
        });
      }
      function renderRecent() {
        var box = document.getElementById("hzRec"); if (!box) return;
        if (!recent || !recent.length) { box.style.display = "none"; return; }
        var nm = (S.me && S.me.name) || (typeof myName === "string" ? myName : "");
        var sig = recent.map(function (g) { return g.at; }).join(",") + "|" + nm + "|" + Math.floor(Date.now() / 60000);
        box.style.display = "block";
        if (sig === recSig) return;
        recSig = sig;
        var meAv = S.me && S.me.uid ? "<img src=\"/api/av/" + encodeURIComponent(S.me.uid) + "\" onerror=\"this.outerHTML='<span class=hzMe>👤</span>'\">" : "<span class=\"hzMe\">👤</span>";
        var h = "<div class=\"hzRh\"><b>🕒 Oxirgi o‘yinlar</b><span data-hz=\"all\">Barchasi ›</span></div><div class=\"hzRl\">";
        recent.forEach(function (g, i) {
          var mc = g.w === nm ? "white" : (g.b === nm ? "black" : null);
          var opp = mc === "black" ? g.w : g.b, lab, cls;
          if (g.win === "white" || g.win === "black") {
            if (mc) { var won = g.win === mc; lab = won ? "G‘alaba" : "Mag‘lubiyat"; cls = won ? "w" : "l"; }
            else { lab = g.win === "white" ? "⚪ yutdi" : "⚫ yutdi"; cls = "d"; }
          } else { lab = "Durang"; cls = "d"; }
          h += "<div class=\"hzG\" data-hz=\"g" + i + "\"><div class=\"hzV\">" + meAv + "<small>vs</small><span class=\"hzO\">" + esc(String(opp || "?").charAt(0).toUpperCase()) + "</span></div><em class=\"" + cls + "\">" + lab + "</em><small>" + ago(g.at) + "</small></div>";
        });
        box.innerHTML = h + "</div>";
      }
      function build() {
        var anchor = panel && panel.querySelector(".lbcards"); if (!anchor) return;
        hero = document.createElement("div"); hero.id = "hzHero"; hero.className = "hz";
        hero.innerHTML = HTML;
        anchor.parentNode.insertBefore(hero, anchor);
        $("hzFr").onclick = function () { window.lbFriend(); };
        $("hzRnd").onclick = function () { var q = $("lbQuick"); if (q) q.click(); };
        $("hzQk").onclick = quickShort;
        $("hzAi").onclick = function () {
          if (!window.aiShow) return;
          try { if (window.lbNav) window.lbNav.close(); } catch (x) {}
          window.aiShow("play");
        };
        $("hzMkR").onclick = openSet;
        $("hzPromo").onclick = sharePromo;
        $("hzDaily").onclick = function () { if (window.mnA) window.mnA("@puz"); };
        $("hzCp").onclick = function () { goList(false); };
        $("hzCf").onclick = function () { goList(true); };
        $("hzRec").onclick = function (e) {
          var t = e.target; while (t && t !== this && !(t.getAttribute && t.getAttribute("data-hz"))) t = t.parentNode;
          var k = t && t.getAttribute ? t.getAttribute("data-hz") : "";
          if (k === "all") { if (window.mnA) window.mnA("@arch"); }
          else if (/^g\d+$/.test(k || "") && recent && recent[Number(k.slice(1))]) openGame(recent[Number(k.slice(1))]);
        };
      }
      function setHtml(el, html) { if (el && el.dataset.t !== html) { el.dataset.t = html; el.innerHTML = html; } }
      function tick() {
        if (!panel) return;
        if (!hero) { build(); if (!hero) return; }
        var show = curTab === "pl", want = show ? "" : "none";
        if (hero.style.display !== want) hero.style.display = want;
        if (!show) return;
        var rb = $("hzRndB"), tx = S.inQueue ? "⏳ Bekor qilish" : "▶ O‘ynash";
        if (rb && rb.textContent !== tx) rb.textContent = tx;
        var qc = $("hzQkC"), t = shortTc(), qt = t ? "⏱ " + t : "⏱ Tez";
        if (qc && qc.textContent !== qt) qc.textContent = qt;
        var fl = S.friends || [], nf = fl.filter(function (f) { return f.online; }).length;
        setHtml($("hzCp"), "👥 <b>" + (S.players || []).length + "</b> o‘yinchi online" + ((S.incoming || []).length ? "<i class=\"hzDot\"></i>" : ""));
        setHtml($("hzCf"), "🤝 <b>" + nf + "</b> do‘st online" + ((S.freqIn || []).length ? "<i class=\"hzDot\"></i>" : ""));
        var p = S.promo, pe = $("hzPromo");
        if (!p || !p.on || !S.me) pe.style.display = "none";
        else {
          var left = Math.max(0, p.end - Date.now()), d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), m = Math.floor(left % 3600000 / 60000);
          pe.style.display = "block";
          setHtml(pe, "🔥 Shoshiling! Do‘stingni taklif qil: +200 💎<small>" + d + " kun " + h + " soat " + m + " daq qoldi · bosib ulashing</small>");
        }
        var de = $("hzDaily");
        if (!daily) de.style.display = "none";
        else {
          de.style.display = "flex";
          setHtml(de, "<div class=\"hzDi\">🧩</div><div style=\"flex:1;min-width:0\"><small>Kunning masala ustasi</small><b>👑 " + esc(daily.name) + "</b></div><span class=\"hzN\">✅ " + esc(daily.n) + " ta</span>");
        }
        if (panelOpen) { loadDaily(); loadRecent(); }
        renderRecent();
      }
      setInterval(tick, 1000);
    })();
    `;
s = s.replace(A, () => CODE + A);
fs.writeFileSync('lobbyclient.js', s);
console.log('TAYYOR');
