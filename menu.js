;(function () {
  if (window.spSettings) return;
  window.spNotify = function () {   // 🔔 bot xabarlari turlari
    var tw = window.Telegram && Telegram.WebApp, id = (tw && tw.initData) || "";
    var ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var bx = document.createElement("div"); bx.style.cssText = "width:100%;max-width:520px;background:#141040;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:system-ui,sans-serif";
    ov.appendChild(bx); document.body.appendChild(ov);
    function draw(d) {
      if (!d || d.error) { bx.innerHTML = "<div style='padding:20px;text-align:center'>Faqat Telegram orqali kirganda ishlaydi</div>"; return; }
      var h = "<div style='display:flex;align-items:center;margin-bottom:6px'><b style='font-size:20px'>🔔 Bot xabarlari</b><span data-x style='margin-left:auto;font-size:24px;padding:4px 8px;cursor:pointer'>✕</span></div><div style='font-size:13px;opacity:.7;margin-bottom:8px'>To‘lov va xarid tasdiqlari har doim keladi.</div>";
      d.cats.forEach(function (c) { h += "<label style='display:flex;align-items:center;gap:12px;padding:13px 2px;border-bottom:1px solid #26305a;cursor:pointer'><span style='flex:1;font-size:15px'>" + c.n + "</span><input type='checkbox' data-k='" + c.k + "'" + (c.on ? " checked" : "") + " style='width:24px;height:24px'></label>"; });
      bx.innerHTML = h;
      bx.querySelector("[data-x]").onclick = function () { ov.remove(); };
      [].forEach.call(bx.querySelectorAll("[data-k]"), function (inp) {
        inp.onchange = function () { fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": id }, body: JSON.stringify({ cat: inp.getAttribute("data-k"), on: inp.checked }) }).then(function (r) { return r.json(); }).then(draw); };
      });
    }
    bx.innerHTML = "<div style='padding:20px;opacity:.7;text-align:center'>Yuklanmoqda…</div>";
    fetch("/api/notify", { headers: { "x-init-data": id } }).then(function (r) { return r.json(); }).then(draw).catch(function () { draw(null); });
  };
  window.spSettings = function () {
    var old = document.getElementById("spSetSheet"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "spSetSheet";
    ov.style.cssText = "position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.55);display:flex;align-items:flex-end";
    var R = [
      ["🌐", "Til · Язык · Language", (window.spLangName ? window.spLangName() : "O‘zbekcha"), function () { if (window.spLangPicker) window.spLangPicker(); }],
      ["🔊", "Ovoz", "Ovoz balandligi, yurish va olish ovozlari", function () { if (window.SPSound && SPSound.openSettings) SPSound.openSettings(); }],
      ["🎤", "Ovozli boshqaruv", (function () { var off = false; try { off = localStorage.getItem("spMicOff") !== "0"; } catch (e) {} return !(window.spVoice && window.spVoice.supported()) ? "Bu brauzerda ishlamaydi (Chrome yoki ilovada ishlaydi)" : off ? "O‘chirilgan — yoqish uchun bosing" : "Yoqilgan — o‘chirish uchun bosing"; })(), function () { try { localStorage.setItem("spMicOff", localStorage.getItem("spMicOff") === "0" ? "1" : "0"); } catch (e) {} }],
      ["🎨", "Mavzu", "Tungi ko‘k, Grafit, Zumrad va fon rasmi", function () { if (window.spThemePicker) window.spThemePicker(); else if (window.spBgPicker) window.spBgPicker(); }],
      ["🔔", "Bot xabarlari", "Qaysi xabarlar kelishini tanlang", function () { window.spNotify(); }],
      ["🤖", "AI o‘yin sozlamalari", "Doska, vaqt va AI bilan o‘yin sozlamalari", function () { if (window.aiShow) window.aiShow("set"); }]
    ];
    if (window.hzIsAdmin && window.hzIsAdmin()) R.push(["🛠", "Bosh sahifani tahrirlash", "Admin: tugmalar tartibi va ko‘rinishi", function () { var b = document.querySelector('#nvBar button[data-k="pl"]'); if (b) b.click(); setTimeout(function () { if (window.hzEdit) window.hzEdit(); }, 300); }]);
    if (window.SP_WEB && window.spLogout) R.push(["🚪", "Hisobdan chiqish", "Bu qurilmada hisobdan chiqish", function () { if (confirm("Hisobdan chiqasizmi?")) window.spLogout(); }]);
    var h = '<div style="width:100%;background:#141040;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:system-ui,sans-serif">' +
      '<div style="display:flex;align-items:center;margin-bottom:10px"><b style="font-size:20px">⚙️ Sozlamalar</b><span id="spSetX" style="margin-left:auto;font-size:24px;padding:4px 8px">✕</span></div>';
    R.forEach(function (r, i) {
      h += '<div data-i="' + i + '" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid #26305a;cursor:pointer">' +
        '<span style="font-size:26px;width:34px;text-align:center">' + r[0] + '</span>' +
        '<span style="flex:1"><b style="display:block;font-size:17px">' + r[1] + '</b><small style="opacity:.65;font-size:13px">' + r[2] + '</small></span>' +
        '<span style="font-size:22px;opacity:.6">›</span></div>';
    });
    ov.innerHTML = h + '</div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov || e.target.id === "spSetX") ov.remove(); };
    Array.prototype.forEach.call(ov.querySelectorAll("[data-i]"), function (el) {
      el.onclick = function () { ov.remove(); R[+el.getAttribute("data-i")][3](); };
    });
  };
})();
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
    st.textContent += ".mqU{display:flex;align-items:center;gap:10px;min-width:0}.mqA{width:46px;height:46px;border-radius:50%;overflow:hidden;flex:none;background:#2a2f63;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 0 0 2px #f5b82e}.mqA img{width:100%;height:100%;object-fit:cover}" +
      ".mqU b{display:block;font-size:17px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}.mqU .mqC{font-size:14px;color:#f5d36a;font-weight:700}" +
      ".mqG{margin-left:8px;border:0;border-radius:10px;padding:3px 8px;background:#f5b82e;color:#222;font-weight:800;font-size:12px}" +
      ".mqH{font-size:24px;font-weight:900;color:#fff}.mqR{display:flex;gap:8px}.mqI{border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:9px 12px;background:rgba(255,255,255,.07);color:#fff;font-weight:700;font-size:14px}" +
      ".mqLs{margin:0 14px;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}.mqLs .mnr{border-bottom:1px solid rgba(255,255,255,.06)}" +
      ".mqV{text-align:center;opacity:.45;font-size:12px;margin:22px 0 6px}#bpBtn{display:none!important}";
    st.textContent += "#mnPanel{background:radial-gradient(circle at 50% 0,#1a1450 0,#0b0e1a 55%)}.mqT{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 6px}.mqL b{font-size:26px;font-weight:900;color:#fff}.mqL b i{font-style:normal;color:#f5b82e}.mqL small{display:block;font-size:12px;color:#a9b0ff}.mqR{display:flex;align-items:center;gap:8px}.mqC{padding:6px 12px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid #3d5bd9;font-weight:700}.mqP{margin:8px 14px;border-radius:22px;padding:14px;background:linear-gradient(135deg,#2b2a78,#4a1f8a 60%,#2a1050);border:1px solid #7a5cf0;box-shadow:0 0 18px rgba(122,92,240,.45)}.mqPh{display:flex;align-items:center;gap:12px}.mqav{width:64px;height:64px;border-radius:50%;border:3px solid #f5b82e;box-shadow:0 0 14px rgba(245,184,46,.6);background:#2a1fc9;display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden;flex:none}.mqav img{width:100%;height:100%;object-fit:cover}.mqN{flex:1;min-width:0}.mqN b{display:block;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mqN small{opacity:.7}.mqG{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.mqG.two{grid-template-columns:repeat(2,1fr);margin-top:8px}.mqG div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px 4px;text-align:center}.mqG b{display:block;font-size:18px}.mqG small{font-size:11px;opacity:.7}.mqS{display:flex;align-items:center;gap:8px;margin:16px 16px 8px;font-size:17px;font-weight:800;letter-spacing:.5px}.mqS span{font-size:20px}.mqGr{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 14px}.mqK{position:relative;border-radius:16px;padding:10px 8px;min-height:96px;box-sizing:border-box;cursor:pointer;overflow:hidden}.mqK .ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:6px}.mqK b{display:block;font-size:13px;line-height:1.2}.mqK small{display:block;font-size:10px;opacity:.7;margin-top:2px;line-height:1.2}.mqK em{position:absolute;right:8px;top:10px;font-style:normal;opacity:.6}.mqX{margin:8px 14px 0;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1)}.mqB{margin:16px 14px 0;display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;background:linear-gradient(135deg,#3a1d12,#1a1440);border:1px solid #f5873b;box-shadow:0 0 14px rgba(245,135,59,.4)}.mqB>span{font-size:30px}.mqB b{display:block;font-size:14px}.mqB small{opacity:.75;font-size:11px}"; document.head.appendChild(st);
  }
  var SEC = [
    ["O‘YNASH", [
      ["📮", "Yozishma o‘yinlari", "Har yurishga 1 kun — bot navbatingizni aytadi", "@corr", "#7c3aed,#0ea5e9"],
      ["🎓", "Endshpil maktabi", "Bazada tekshirilgan mashqlar — King Kongga qarshi", "@eg", "#0f766e,#22c55e"],
      ["📖", "Debyutlar", "Mashhur ochilishlar va yod olish", "@deb", "#0ea5e9,#6366f1"]], "🎮"],
    ["TOMOSHA VA TAHLIL", [
      ["📺", "Jonli efir", "Hozirgi o‘yinlarni kuzating", "@live", "#ff4d6d,#ff8fa3"],
      ["📁", "Arxiv", "O‘tgan o‘yinlar tarixi", "@arch", "#2fd27f,#1ea36a"],
      ["🔬", "Tahlil taxtasi", "Dragon dvigateli bilan pozitsiya tahlili", "@board", "#3b82f6,#06b6d4"]], "📺"],
    ["DO‘KON VA SOVRINLAR", [
      ["👑", "Premium", "2× tanga, chegirmalar va boshqalar", "@prem", "#b8860b,#ffd54a"],
      ["🪙", "Tosh do‘koni", "Donalar va o‘z donangiz", "@shop", "#7b3ff2,#d62f8f"],
      ["👥", "Do‘stlarni taklif qilish", "Har do‘st uchun 300 🪙 gacha", "@ref", "#2fd27f,#f5b72b"],
      ["🗺", "Viloyatlar jangi", "Viloyatingiz uchun o‘ynang — oylik sovrin", "@reg", "#16a34a,#0ea5e9"]], "💎"]
  ];
  var LIST = [
    ["⚙️", "Sozlamalar", "Til, ovoz, mavzu, AI o‘yin va boshqalar", "@set", "#6b7bff,#8fa0ff"],
    ["💬", "Taklif va shikoyatlar", "Dasturchiga yozing — javob shu botga keladi", "@fb", "#f5873b,#f7c02d"]];
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
    return "<div class='mqK' data-a='" + r[3] + "' onclick='mnA(this.dataset.a)' style='background:linear-gradient(135deg," + c1 + "33," + c2 + "14);border:1px solid " + c1 + "99;box-shadow:0 0 12px " + c1 + "40'><em>›</em>" + (r[0] ? "<div class='ic' style='background:linear-gradient(135deg," + r[4] + ")'>" + r[0] + "</div>" : "") + "<b>" + r[1] + "</b><small>" + r[2] + "</small></div>";
  }
  function render() {
    if (!panel) return;
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var name = ((u.first_name || "") + " " + (u.last_name || "")).trim() || "Mehmon";
    var av = u.id ? "<img src='/api/av/" + encodeURIComponent(u.id) + "?t=" + Date.now() + "' onerror=\"this.outerHTML='👤'\">" : "👤";
    function v(x) { return x == null ? "—" : x; }
    var P = pst || {};
    var lc = "UZ"; try { lc = String(localStorage.getItem("shashkaPRO_lang") || "uz").slice(0, 2).toUpperCase(); } catch (e) {}
    var tk = "a"; try { tk = localStorage.getItem("spTheme") || "a"; } catch (e) {}
    var ti = tk === "auto" ? "🌗" : tk === "d" ? "☀️" : "🌙";
    var h = "<div class='mqT'><div class='mqH'>☰ Menyu</div>" +
      "<div class='mqR'><button class='mqI' onclick='mnLang()'>🌐 " + lc + "</button><button class='mqI' onclick='mnTheme()' title='Tungi / kunduzgi / avto'>" + ti + "</button></div></div>";
    h += "<div class='mnm' id='mnMsg'></div>";
    SEC.forEach(function (s) { h += "<div class='mqS'><span>" + s[2] + "</span>" + s[0] + "</div><div class='mqGr'>" + s[1].map(cardHtml).join("") + "</div>"; });
    h += "<div class='mqS'><span>⚙️</span>ILOVA</div><div class='mqLs'>" + LIST.map(rowHtml).join("") + "</div>";
    if (window.__isAdmin) h += "<div class='mqS'><span>🛡</span>ADMIN</div><div class='mqGr'>" + cardHtml(["📊", "Statistika", "Faollik, iqtisod, Premium, tikish", "@stats", "#0ea5e9,#22c55e"]) + cardHtml(["🦍", "King Kong xatolari", "O‘yinlardagi xatolarni topish va tuzatish", "@kkadm", "#b45309,#f59e0b"]) + (document.getElementById("bpBtn") ? cardHtml(["🤖", "Bot kuchi", "Botlar kuchini 1–100% belgilash", "@bpow", "#8e6ff0,#c58bf2"]) : "") + "</div>";
    h += "<div class='mqV'>ShashkaPRO · v" + (window.SP_VER || "10.1") + "</div>";
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
      load(); setTimeout(function () { msgSet(d && d.ok ? "+" + d.amount + " 🪙 olindi" : "Bugun olingan"); }, 400);
    }).catch(function () { msgSet("Server bilan aloqa yo‘q"); });
  }
  function close() { if (panel) panel.style.display = "none"; }
  window.refGo = window.refGo || function () { if (window.refOpen) return window.refOpen(); var s = document.createElement("script"); s.src = "/refpanel.js?v=" + Date.now(); s.onload = function () { window.refOpen(); }; document.head.appendChild(s); };
  window.rcIsPremium = window.rcIsPremium || function () { return window.__prem !== false; };   // noma'lum bo'lsa — cheklamaymiz
  window.premGo = window.premGo || function () { if (window.premOpen) return window.premOpen(); var s = document.createElement("script"); s.src = "/prempanel.js?v=" + Date.now(); s.onload = function () { window.premOpen(); }; document.head.appendChild(s); };
  setTimeout(function () {   // 🎁 sovg'a Premium oynasi + startapp=prem (bot eslatmasidagi tugma)
    try {
      var _tw = window.Telegram && Telegram.WebApp, _id = _tw && _tw.initData; if (!_id) return;
      if ((_tw.initDataUnsafe || {}).start_param === "prem") window.premGo();
      var _cs = /^corr_(\w*)$/.exec((_tw.initDataUnsafe || {}).start_param || ""); if (_cs) window.corrGo(_cs[1] || undefined);
      fetch("/api/premium", { headers: { "x-init-data": _id } }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && !d.error) { window.__prem = !!d.premium; try { window.dispatchEvent(new Event("spPrem")); } catch (e) {} }
        function askRegion() {   // 🗺 viloyat tanlanmagan bo'lsa — tanlash oynasi (Viloyatlar jangiga qo'shilish)
          try { if (Date.now() < +(localStorage.getItem("spRegLater") || 0)) return; } catch (e) {}
          fetch("/api/region", { headers: { "x-init-data": _id } }).then(function (r) { return r.json(); }).then(function (v) {
            if (!v || v.error || v.my) return;
            var go = function () { if (window.regOpen) window.regOpen(true); else { var s = document.createElement("script"); s.src = "/regionpanel.js?v=" + Date.now(); s.onload = function () { window.regOpen(true); }; document.head.appendChild(s); } };
            var tries = 0, wt = setInterval(function () {   // kunlik vazifalar va boshqa oynalar yopilgach ko'rsatamiz
              if (++tries > 240) return clearInterval(wt);
              if (document.getElementById("dqOv") || document.getElementById("spRv") || [].some.call(document.querySelectorAll("[id$='Ov'],#spUo,#spRv"), function (x) { return x.offsetParent !== null || getComputedStyle(x).position === "fixed" && getComputedStyle(x).display !== "none"; }) || (document.getElementById("rcMenuBtn") && document.getElementById("rcMenuBtn").offsetParent)) return;   // boshqa oyna ochiq — kutamiz   // o'yin paytida emas
              clearInterval(wt); go();
            }, 1000);
          }).catch(function () {});
        }
        if (!d || !d.trialShow) return askRegion();
        fetch("/api/premium/seen", { method: "POST", headers: { "x-init-data": _id, "Content-Type": "application/json" }, body: "{}" });
        var ov = document.createElement("div");
        ov.style.cssText = "position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px";
        ov.innerHTML = "<div style='width:100%;max-width:360px;background:linear-gradient(160deg,#3a2a00,#0b0e1a 60%);border:1px solid #ffd54a;border-radius:24px;padding:22px 16px;color:#fff;text-align:center;font-family:inherit'>" +
          "<div style='font-size:56px'>🎁</div><b style='font-size:21px;color:#ffd54a'>7 kunlik Premium sovg‘a!</b>" +
          "<div style='font-size:14px;line-height:1.7;margin:12px 0 16px;text-align:left'>👑 Toj va oltin ism<br>🤖 Legend, Monster, Terminator, King Kong<br>🪙 G‘alabadan 2× tanga<br>🖼 Profil rasmi<br>🏆 Turnirga kirish −50%</div>" +
          "<div style='font-size:12px;opacity:.7;margin-bottom:14px'>" + new Date(d.until).toLocaleDateString("ru") + " gacha amal qiladi</div>" +
          "<button id='trOk' style='width:100%;border:0;border-radius:14px;padding:13px;font-size:16px;font-weight:700;color:#2a1600;background:linear-gradient(135deg,#ffd54a,#b8860b)'>Ajoyib! 🎉</button></div>";
        document.body.appendChild(ov);
        ov.querySelector("#trOk").onclick = function () { ov.remove(); setTimeout(askRegion, 400); };
      }).catch(function () {});
    } catch (e) {}
  }, 2500);
  window.corrGo = window.corrGo || function (id) { if (window.corrOpen) return window.corrOpen(id); var s = document.createElement("script"); s.src = "/corrpanel.js?v=" + Date.now(); s.onload = function () { window.corrOpen(id); }; document.head.appendChild(s); };
  window.mnA = function (a) {
    if (a === "@corr") { close(); window.corrGo(); return; }
    if (a === "@stake") { close(); if (window.lbTables) window.lbTables(); else if (window.lbStakeOpen) window.lbStakeOpen(); return; }
    if (a === "@prem") { close(); window.premGo(); return; }
    if (a === "@eg") { close(); if (window.egOpen) window.egOpen(); else { var _eg = document.createElement("script"); _eg.src = "/egpanel.js?v=" + Date.now(); _eg.onload = function () { window.egOpen(); }; document.head.appendChild(_eg); } return; }
    if (a === "@reg") { close(); if (window.regOpen) window.regOpen(); else { var _rg = document.createElement("script"); _rg.src = "/regionpanel.js?v=" + Date.now(); _rg.onload = function () { window.regOpen(); }; document.head.appendChild(_rg); } return; }
    if (a === "@ref") { close(); window.refGo(); return; }
    if (a === "@gomoku") { close(); var _o = document.createElement("div"); _o.style.cssText = "position:fixed;inset:0;z-index:99999;background:#161512"; _o.innerHTML = "<iframe src='/gomoku.html' style='position:absolute;inset:0;width:100%;height:100%;border:0'></iframe><button style='position:absolute;top:8px;right:8px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;background:#000a;color:#fff;font-size:20px'>✕</button>"; _o.querySelector("button").onclick = function () { _o.remove(); }; document.body.appendChild(_o); return; } if (a === "@set") { close(); if (window.spSettings) window.spSettings(); return; } if (a.indexOf("@ai:") === 0) { close(); if (window.aiShow) window.aiShow(a.slice(4)); return; }
    if (a === "@live") { close(); liveOpen(); return; }
    if (a === "@deb") { close(); if (window.spDebut) window.spDebut(); else { var _d = document.createElement('script'); _d.src = '/debyut.js?v=3'; _d.onload = function () { window.spDebut(); }; document.head.appendChild(_d); } return; }
    if (a === "@stats") { close(); if (window.spStats) window.spStats(); else { var _s = document.createElement('script'); _s.src = '/statsview.js?v=2'; _s.onload = function () { window.spStats(); }; document.head.appendChild(_s); } return; }
    if (a === "@kkadm") { var _go = function () { window.kkPanel(); }; if (window.kkPanel) _go(); else { var _s = document.createElement("script"); _s.src = "/kkpanel.js?v=3"; _s.onload = _go; document.head.appendChild(_s); } return; }
    if (a === "@bpow") { var _bp = document.getElementById("bpBtn"); if (_bp) _bp.click(); return; }
    if (a === "@arena") { close(); if (window.avOpen) window.avOpen(); return; }
    if (a === "@arch") { close(); archOpen(); return; }
    if (a === "@board") {
      close();
      var _go = function () { window.spBoard(); };
      if (window.spBoard) _go();
      else { var _s = document.createElement("script"); _s.src = "/board.js?v=" + Date.now(); _s.onload = _go; document.head.appendChild(_s); }
      return;
    }
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
  window.mnLang = function () { if (window.spLangPicker) window.spLangPicker(); };
  window.mnTheme = function () {   // 🌙 tungi → ☀️ kunduzgi → 🌗 avto (Telegram mavzusi bo'yicha)
    var k = "a"; try { k = localStorage.getItem("spTheme") || "a"; } catch (e) {}
    var nx = k === "d" ? "auto" : k === "auto" ? "a" : "d";
    if (window.spThemeSet) window.spThemeSet(nx); else { try { localStorage.setItem("spTheme", nx); } catch (e) {} }
    render();
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
        b.onclick = function () { var r = b.getAttribute("data-r"); if (window.rcOpen) { stop(); window.rcOpen(r); } else location.href = location.pathname + "?room=" + encodeURIComponent(r); };
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
            window.spBoardOpen({
              white: g.w, black: g.b, winner: g.win, start: g.o, first: g.f,
              moves: g.m.map(function (x) { return { from: { r: x[0], c: x[1] }, to: { r: x[2], c: x[3] }, captures: x[4].map(function (y) { return { r: y[0], c: y[1] }; }) }; })
            });
          };
        });
      })
      .catch(function () { shell('<div style="padding:30px;text-align:center">Server bilan aloqa yo‘q</div>'); });
  }
  window.mnClose = close;
  window.mnArchOpen = archOpen;   // 🏠 bosh sahifadagi «O‘yinlarim › Arxiv»
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
  var dayIds = null; // kunlik vazifa rejimi: faqat bugungi 5 ta Petrova masalasi

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
  // 🧠 Viktorina navbati (admin): sozlamalar, navbat, javob variantlari
  function qzIn(id) { return (S.qz || []).indexOf(id) >= 0; }
  function qzTog(id, cb) {
    api('/api/quiz/tog', { id: id }).then(function (d) {
      if (d && d.ok) { S.qz = S.qz || []; var i = S.qz.indexOf(id); if (d.on && i < 0) S.qz.push(id); if (!d.on && i >= 0) S.qz.splice(i, 1); }
      cb(d || { error: 'Xato' });
    }).catch(function () { cb({ error: 'Server bilan aloqa yo‘q' }); });
  }
  function qzPanel() {
    var Q = null, qm = '', pf = 'Kombinatsiyalar', pq = '', pn = 24, keep = 0;
    function mb(b) { var h = '<div style="width:84px;height:84px;flex:none;display:grid;grid-template-columns:repeat(8,1fr);border-radius:4px;overflow:hidden">'; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var v = b[r][c], d = (r + c) % 2 === 1; h += '<div style="background:' + (d ? '#b6695f' : '#f1d4cc') + ';display:flex;align-items:center;justify-content:center">' + (v ? '<i style="width:78%;height:78%;border-radius:50%;background:' + (v === 1 || v === 3 ? '#fff' : '#111') + ';box-shadow:inset 0 0 0 ' + (v > 2 ? '2px #f5b72b' : '1px #777') + '"></i>' : '') + '</div>'; } return h + '</div>'; }
    var IN = 'background:#0f1330;color:#fff;border:1px solid #2c3370;border-radius:10px;padding:8px;font-size:15px;width:70px;text-align:center';
    function ld(k) { api('/api/quiz').then(function (d) { if (d && !d.error) { Q = d; S.qz = d.q.map(function (x) { return x.id; }); } else qm = (d && d.error) || 'Xato'; keep = k ? ov.scrollTop : 0; dr(); }).catch(function () { qm = 'Server bilan aloqa yo‘q'; dr(); }); }
    function dr() {
      var h = head('Viktorina');
      if (qm) h += '<div style="margin:0 0 10px;padding:8px;border-radius:10px;background:#2a2560">' + esc(qm) + '</div>';
      if (!Q) { ov.innerHTML = h + '<div style="padding:24px;opacity:.7">Yuklanmoqda…</div>'; on('#pzBack', function () { list(); }); return; }
      var c = Q.cfg, dl = function (d) { return d === 0 ? 'bugun' : d === 1 ? 'ertaga' : (d + 1) + '-kun'; };
      h += '<div style="' + CARD + ';cursor:default">'
        + '<label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b>Har kuni avtomatik</b><input id="qzOn" type="checkbox" ' + (c.on ? 'checked' : '') + ' style="width:22px;height:22px"></label>'
        + '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px"><span>Boshlanish</span><input id="qzHm" type="time" value="' + c.hm + '" style="' + IN + ';width:110px"><span>Savol</span><input id="qzN" type="number" min="1" max="20" value="' + c.n + '" style="' + IN + '"><span>Soniya</span><input id="qzSec" type="number" min="10" max="600" value="' + c.sec + '" style="' + IN + '"></div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px"><span>Mukofot 1/2/3</span><input id="qzP0" type="number" value="' + c.prz[0] + '" style="' + IN + '"><input id="qzP1" type="number" value="' + c.prz[1] + '" style="' + IN + '"><input id="qzP2" type="number" value="' + c.prz[2] + '" style="' + IN + '"><span>Qolganlarga</span><input id="qzR" type="number" value="' + c.rest + '" style="' + IN + '"></div>'
        + '<label style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><input id="qzCh" type="checkbox" ' + (c.chOn ? 'checked' : '') + ' style="width:20px;height:20px">Kanalga ham yuborish (natijasiz)</label>'
        + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><span>Tosh</span><select id="qzSk" style="' + IN + ';width:auto;flex:1"><option value="">Asosiy tosh</option>' + Q.skins.map(function (k) { return '<option value="' + esc(k.id) + '"' + (c.skin === k.id ? ' selected' : '') + '>' + esc(k.name) + (k.def ? ' (asosiy)' : '') + '</option>'; }).join('') + '</select></div>'
        + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><span>Doska</span><select id="qzTh" style="' + IN + ';width:auto;flex:1">' + (Q.ths || []).map(function (k) { return '<option value="' + esc(k.id) + '"' + (c.th === k.id ? ' selected' : '') + '>' + esc(k.name) + '</option>'; }).join('') + '</select></div>'
        + '<button id="qzSave" style="' + BS + '">Saqlash</button>'
        + '<div style="font-size:13px;opacity:.7;margin-top:8px">Yuboriladi: ' + Q.chats + ' ta guruh/kanal' + (Q.run ? ' · Hozir ketyapti: ' + (Q.run.qi + 1) + '/' + Q.run.n : '') + '</div></div>';
      h += '<div style="margin-bottom:10px"><button id="qzNum" style="' + BG + '">Raqam bilan qo‘shish</button><button id="qzTest" style="' + BG + '">Sinov (o‘zimga)</button>' + (Q.run ? '<button id="qzStop" style="' + BG + ';background:#8a2b2b">To‘xtatish</button>' : '<button id="qzNow" style="' + BG + '">Hozir boshlash</button>') + '</div>';
      h += '<div style="text-align:left;font-weight:700;margin:6px 0 8px">Navbat: ' + Q.q.length + ' ta' + (Q.q.length < c.n ? ' <span style="color:#ff8a8a">(kuniga ' + c.n + ' ta kerak)</span>' : '') + '</div>';
      if (!Q.q.length) h += '<div style="padding:20px;opacity:.7">Navbat bo‘sh. Masalani ochib «Viktorinaga» tugmasini bosing yoki raqam bilan qo‘shing.</div>';
      Q.q.forEach(function (x, i) {
        h += '<div style="' + CARD + ';cursor:default"><div style="display:flex;justify-content:space-between;gap:6px"><b>' + (i + 1) + '. ' + esc(x.t) + '</b><span style="opacity:.6;font-size:13px;white-space:nowrap">' + dl(x.d) + '</span></div>'
          + '<div style="font-size:13px;margin-top:6px">' + (x.side === 'b' ? 'Qora yuradi' : 'Oq yuradi') + ' · To‘g‘ri: <b style="color:#5ee08a">' + esc(x.cor || '?') + '</b></div>'
          + '<div style="font-size:13px;opacity:.8;margin-top:4px">Noto‘g‘ri' + (x.man ? ' (qo‘lda)' : ' (avtomatik, 4 tasi tanlanadi)') + ': ' + esc(x.w.join(', ')) + '</div>'
          + '<div style="margin-top:6px"><button data-qu="' + esc(x.id) + '" style="' + BG + ';padding:6px 12px">↑</button><button data-qd="' + esc(x.id) + '" style="' + BG + ';padding:6px 12px">↓</button><button data-qo="' + esc(x.id) + '" style="' + BG + ';padding:6px 12px">Variantlar</button><button data-qx="' + esc(x.id) + '" style="' + BG + ';padding:6px 12px">Olib tashlash</button><button data-qt="' + esc(x.id) + '" style="' + BG + ';padding:6px 12px">Sinov</button></div></div>';
      });
      // masalalarni shu yerda tanlash
      var fos = (S.folders || []).filter(function (f) { return S.list.some(function (x) { return x.folder === f; }); });
      if (fos.indexOf(pf) < 0) pf = fos[0] || '';
      var all = S.list.filter(function (x) { return x.folder === pf && !x.et && x.board; });
      if (pq) all = all.filter(function (x) { var m = /(\d+)\s*$/.exec(x.title || ''); return (m && m[1].indexOf(pq) === 0) || String(x.title || '').toLowerCase().indexOf(pq.toLowerCase()) >= 0; });
      h += '<div style="text-align:left;font-weight:700;margin:16px 0 8px">Masalalardan tanlash</div>'
        + '<div style="display:flex;gap:8px;margin-bottom:10px"><select id="qzFo" style="' + IN + ';width:auto;flex:1">' + fos.map(function (f) { return '<option' + (f === pf ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select><input id="qzQ" placeholder="Raqam" value="' + esc(pq) + '" style="' + IN + ';width:90px"></div>'
        + '<div style="font-size:13px;opacity:.65;text-align:left;margin-bottom:8px">' + all.length + ' ta masala</div>';
      all.slice(0, pn).forEach(function (x) {
        var a = qzIn(x.id);
        h += '<div style="' + CARD + ';cursor:default;display:flex;gap:10px;align-items:center">' + mb(x.board) + '<div style="flex:1;min-width:0"><b>' + esc(x.title) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + (x.side === 'b' ? 'Qora yuradi' : 'Oq yuradi') + '</div></div><button data-qa="' + esc(x.id) + '" style="' + BG + ';padding:8px 10px;font-size:13px' + (a ? ';background:#2b8a3e' : '') + '">' + (a ? 'Viktorinada' : 'Viktorinaga') + '</button></div>';
      });
      if (all.length > pn) h += '<button id="qzMore" style="' + BG + '">Yana ' + Math.min(24, all.length - pn) + ' ta</button>';
      ov.innerHTML = h; ov.scrollTop = keep; keep = 0;
      on('#pzBack', function () { list(); });
      var g = function (id) { return ov.querySelector(id); };
      var fo = g('#qzFo'); if (fo) fo.onchange = function () { pf = fo.value; pn = 24; keep = 0; dr(); };
      var qi = g('#qzQ'); if (qi) qi.onchange = function () { pq = qi.value.trim(); pn = 24; keep = ov.scrollTop; dr(); };
      on('#qzMore', function () { pn += 24; keep = ov.scrollTop; dr(); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-qa]'), function (b) {
        b.onclick = function () { var id = b.getAttribute('data-qa'); b.disabled = true; qzTog(id, function (d) { if (d.error) { qm = d.error; } else qm = ''; ld(1); }); };
      });
      var post = function (path, b, okMsg) { qm = '…'; api(path, b).then(function (d) { if (d && d.error) qm = d.error; else { if (d && d.cfg) { Q = d; S.qz = d.q.map(function (x) { return x.id; }); } qm = okMsg || ''; } if (d && d.ok && !d.cfg) return ld(); dr(); }).catch(function () { qm = 'Server bilan aloqa yo‘q'; dr(); }); };
      on('#qzSave', function () { post('/api/quiz/cfg', { on: g('#qzOn').checked, hm: g('#qzHm').value, n: +g('#qzN').value, sec: +g('#qzSec').value, prz: [+g('#qzP0').value, +g('#qzP1').value, +g('#qzP2').value], rest: +g('#qzR').value, chOn: g('#qzCh').checked, skin: g('#qzSk').value, th: g('#qzTh') ? g('#qzTh').value : undefined }, 'Saqlandi'); });
      on('#qzNum', function () { var v = prompt('Kombinatsiyalar raqamlari (masalan: 12, 15-20):', ''); if (!v) return; api('/api/quiz/nums', { nums: v }).then(function (d) { qm = d.error || ('Qo‘shildi: ' + d.add + ' ta' + (d.bad ? ' · yechimi o‘qilmadi: ' + d.bad : '')); ld(); }); });
      on('#qzTest', function () { post('/api/quiz/test', {}, 'Sinov savoli botda sizga yuborildi'); });
      on('#qzNow', function () { if (!confirm('Viktorina hozir barcha guruhlarda boshlansinmi?')) return; post('/api/quiz/now', {}, 'Boshlandi'); });
      on('#qzStop', function () { if (!confirm('Viktorina to‘xtatilib, natija e’lon qilinsinmi?')) return; post('/api/quiz/stop', {}, 'To‘xtatildi'); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-qu],[data-qd],[data-qx],[data-qo],[data-qt]'), function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-qu') || b.getAttribute('data-qd') || b.getAttribute('data-qx') || b.getAttribute('data-qo') || b.getAttribute('data-qt');
          if (b.hasAttribute('data-qt')) return post('/api/quiz/test', { id: id }, 'Sinov savoli botda sizga yuborildi');
          if (b.hasAttribute('data-qo')) { var x = Q.q.filter(function (y) { return y.id === id; })[0]; var v = prompt('Noto‘g‘ri variantlar, vergul bilan (masalan: g5-f6, h6-g7). Bo‘sh qoldirsangiz — avtomatik:', x && x.man ? x.w.join(', ') : ''); if (v === null) return; return post('/api/quiz/opts', { id: id, opts: v.split(',') }, 'Saqlandi'); }
          post('/api/quiz/mv', { id: id, d: b.hasAttribute('data-qu') ? -1 : b.hasAttribute('data-qd') ? 1 : 0 });
        };
      });
    }
    dr(); ld();
  }
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
    hub = !pending; view = '';
    var old = document.getElementById('spPz'); if (old) old.remove();
    ov = document.createElement('div'); ov.id = 'spPz';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit;text-align:center';
    document.body.appendChild(ov);
    load();
  }
  function close() { curLv = 0; curFo = ''; curLv = 0; MG.on = false; MG.sel = []; var _mb = document.getElementById('pzMgBar'); if (_mb) _mb.remove(); if (ov) ov.remove(); }
  function load() {
    ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    on('#pzBack', close);
    api('/api/puzzles').then(function (d) {
      if (d.error) { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Telegram orqali kiring</div>'; on('#pzBack', close); return; }
      if (d.etl) { d.etl.forEach(function (a) { var b = blank(), k = 0, r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) continue; var ch = a[3].charAt(k++); b[r][c] = ch === 'w' ? 1 : ch === 'b' ? 2 : ch === 'W' ? 3 : ch === 'B' ? 4 : 0; } d.list.push({ id: 'et' + a[0], no: a[1], level: a[2], side: 'w', board: b, title: ((d.etp || {})[a[0].split('-')[0]] || 'Etyud') + ' ' + a[1] + (a[4] ? ' · ' + a[4] : ''), folder: (d.etf || {})[a[0].split('-')[0]] || 'Etyudlar · ' + a[0].split('-')[0] + '-kitob', et: 1, cnt: a[5] || 0 }); }); delete d.etl; }   // ♔ etyudlar (5 kitob)
      S = d; var _pid = pending; pending = null; var _pz = _pid && S.list.filter(function (x) { return x.id === _pid; })[0]; if (_pz) play(_pz); else list();
    }).catch(function () { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', close); });
  }
  var curLv = 0, curFo = '', edLv = 0, edFolder = '';
  var shelf = 's', curBook = null; try { shelf = localStorage.getItem('pzShelf') || 's'; } catch (e) {}   // 📚 kutubxona: tanlangan javon (s/m/e/f) va ochiq kitob
  var hub = 0, view = '';
  function hubSoon(n) { var t = '🚧 ' + n + ' tez orada qo‘shiladi!'; if (tg && tg.showAlert) tg.showAlert(t); else alert(t); }
  function dailyPz() { var L = S.list || []; if (!L.length) return null; return L[Math.floor((Date.now() + 18e6) / 864e5) % L.length]; }
  function hubView() {
    window.__pzMapKey = undefined;
    var go = function () {
      var dp = dailyPz();
      window.pzHub({
        ov: ov, coins: (S.coins != null ? S.coins : (S.bal != null ? S.bal : null)),
        dailyDone: !!(dp && (S.solved || []).indexOf(dp.id) >= 0),
        back: close, soon: hubSoon,
        daily: function () { var p = dailyPz(); if (!p) { hubSoon('Masalalar'); return; } hub = 0; view = ''; play(p); },
        custom: function () { hub = 0; view = 'custom'; list(); },
        solve: function () { hub = 0; view = ''; list(); },
        map: function () { hub = 0; view = 'map'; curFo = ''; curLv = 0; list(); }
      });
    };
    if (window.pzHub) go();
    else { var sc = document.createElement('script'); sc.src = '/pzhub.js?v=18'; sc.onload = go; sc.onerror = function () { hub = 0; list(); }; document.head.appendChild(sc); }
  }
  var CARD = 'text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer';
  function lvOf(p) { return [1, 2, 3].indexOf(p.level) >= 0 ? p.level : 1; }
  function foOf(p) { return (p.folder && (S.folders || []).indexOf(p.folder) >= 0) ? p.folder : ''; }
  function nDone(arr) { return arr.filter(function (p) { return (S.solved || []).indexOf(p.id) >= 0; }).length; }
  function cleanName(t) { return String(t || '').replace(/[<>]/g, '').trim().slice(0, 30); }
  function newPz(lv, fo) { edLv = lv || 0; edFolder = fo || ''; editor(); }
  function topBtns() { return '<button id="pzTop" style="' + BG + '">🏆 TOP</button>' + (S.admin ? '<button id="pzNew" style="' + BS + '">➕ Yangi</button><button id="pzQzP" style="' + BG + '">Viktorina</button>' : ''); }
  function moveDlg(p) {
    var fl = S.folders || [];
    var t = prompt('Papka nomi (bo‘sh qoldirsangiz papkadan chiqariladi).\nMavjud: ' + (fl.join(', ') || 'yo‘q'), foOf(p));
    if (t === null) return;
    t = cleanName(t);
    var go = function () { api('/api/puzzle/move', { id: p.id, folder: t }).then(function () { load(); }); };
    if (t && fl.indexOf(t) < 0) api('/api/puzzle/folder', { name: t }).then(go); else go();
  }
  // 🗺 Yangi sarguzasht xaritasi (sarguzasht.js): har kitob — o'lka, har 10 masala — bekat, oxiri — qal'a
  function advBooks() {
    var B = pzBooks(), o = { s: B.s, m: B.m, e: [] }, h36 = function (s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
    B.e.forEach(function (b) { o.e.push(Object.assign({}, b, { key: 'e' + h36(b.f || '') + '_' + b.k })); });
    return o;
  }
  function advOpen(land) {
    window.__advRet = null; window.__pzMapKey = undefined; hub = 0; view = 'map'; curFo = ''; curLv = 0; curBook = null;
    var go = function () {
      var bk = null;
      window.spAdv.open({ ov: ov, S: S, api: api, tg: tg, admin: !!S.admin, land: land, cached: !!land,
        books: function () { return bk || (bk = advBooks()); },
        play: function (p, b, ret) { curBook = b; window.__advRet = ret; window.__pzMapKey = undefined; play(p); },
        back: function () { window.__advRet = null; hub = 1; view = ''; list(); },
        enter: function () { window.__advRet = null; hub = 0; view = 'map'; curBook = null; },
        coins: function (n) { if (S.coins != null) S.coins += n; if (S.bal != null) S.bal += n; } });
    };
    var need = [];
    if (!window.spPzMap) need.push('/pzmapview.js?v=8');
    if (!window.spAdv) need.push('/sarguzasht.js?v=1');
    if (!need.length) return go();
    ov.innerHTML = '<div style="padding:40px;opacity:.7">Xarita yuklanmoqda…</div>';
    var left = need.length; need.forEach(function (src) { var sc = document.createElement('script'); sc.src = src; sc.onload = sc.onerror = function () { if (--left === 0) { if (window.spAdv) go(); else { ov.innerHTML = head('Xarita') + '<div style="padding:30px">Yuklanmadi</div>'; on('#pzBack', function () { hub = 1; view = ''; list(); }); } } }; document.head.appendChild(sc); });
  }
  // 🗺 Sarguzasht xaritasi (pzmapview.js): har 10 masala — bitta manzara, odamcha yechilgan masaladan keyingisiga qadam bosadi
  function mapJs(cb) {
    if (window.spPzMap) return window.spPzMap.load(cb);
    var sc = document.createElement('script'); sc.src = '/pzmapview.js?v=8';
    sc.onload = function () { window.spPzMap.load(cb); }; sc.onerror = function () {}; document.head.appendChild(sc);
  }
  // umumiy xarita tartibi: papkalar ketma-ket (Kombinatsiyalar → …), keyin papkasizlar
  // Bosh xarita — faqat Kombinatsiyalar (papkasiz, o'zi alohida turadi)
  var MAINF = 'Kombinatsiyalar';
  function mainOrder() {
    var o = S.list.filter(function (p) { return foOf(p) === MAINF; });
    if (o.length) return o;
    (S.folders || []).forEach(function (f) { S.list.forEach(function (p) { if (foOf(p) === f) o.push(p); }); });
    S.list.forEach(function (p) { if (!foOf(p)) o.push(p); });
    return o;
  }
  function heroSet() { if (window.spPzMap && window.spPzMap.setHero) window.spPzMap.setHero(S.heroAv, (S.solved || []).length, function (av) { S.heroAv = av; api('/api/pzmap/hero', { av: av }); }); }
  function pzMap(arr, key) {
    var sv = S.solved || [], n = arr.length, d = 0;
    var it = arr.map(function (p) { var ok = sv.indexOf(p.id) >= 0; if (ok) d++; return { i: S.list.indexOf(p), done: ok }; });
    var pc = n ? Math.round(d / n * 100) : 0;
    var h = '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:24px">' + d + '<span style="font-size:13px;opacity:.6"> / ' + n + ' yechildi</span></b><span style="opacity:.7">' + pc + '%</span></div>';
    if (!n) return h;
    heroSet();
    h += '<div id="pzMapBox">' + (window.spPzMap ? window.spPzMap.html(it, key, S.admin) : '<div style="height:min(66vh,620px);margin:10px 0;border-radius:18px;background:#0b1a33"></div>') + '</div>';
    if (!key) h += '<button id="pzGo" style="width:100%;padding:16px;border:0;border-radius:14px;background:#6fae3d;color:#fff;font-size:20px;font-weight:700;margin-bottom:14px;box-shadow:0 5px 0 #4b7f27">▶ Masalalar yechish</button>';
    var me = ov;
    setTimeout(function () {
      mapJs(function () {
        var bx = me.querySelector('#pzMapBox'); if (!bx || !document.body.contains(bx)) return;
        heroSet(); bx.innerHTML = window.spPzMap.html(it, key, S.admin);
        Array.prototype.forEach.call(bx.querySelectorAll('[data-pz]'), function (e) {
          e.onclick = function () {
            var i = Number(e.getAttribute('data-pz'));
            var c = key ? me.querySelector('[data-i="' + i + '"]') : null;   // papkada — kartani bosish (qulf qoidalari saqlanadi)
            window.__pzMapKey = key; if (c) c.click(); else if (S.list[i]) play(S.list[i]);
          };
        });
        window.spPzMap.after(bx, key, function () { list(); }, function () {
          // masala yechilgandan keyin: odamcha yetib borgach keyingi masala o'zi ochiladi
          if (!window.__pzAuto) return; window.__pzAuto = 0;
          var nx = null; for (var q = 0; q < arr.length; q++) if (sv.indexOf(arr[q].id) < 0 && (S.solved || []).indexOf(arr[q].id) < 0) { nx = arr[q]; break; }
          if (nx) { window.__pzMapKey = key; play(nx); }
        });
      });
    }, 0);
    return h;
  }
  function list() {
    window.__advRet = null;
    { var _mb0 = document.getElementById('pzMgBar'); if (_mb0) _mb0.remove(); }
    if (hub && !curLv && !curFo && !window.__pzPF) return hubView();
    if (window.__pzPF) { var _pf = window.__pzPF; window.__pzPF = ''; if ((S.folders || []).indexOf(_pf) >= 0) { curFo = _pf; curLv = 0; } }
    if (curFo && (S.folders || []).indexOf(curFo) < 0) curFo = '';
    if (curLv || curFo) return items();
    var fl = S.folders || [], _mapV = view === 'map', h;
    if (_mapV) return advOpen();
    if (_mapV) {
      h = head(view === 'custom' ? '🎨 Maxsus masalalar' : '🗺 Xarita', topBtns()) + '<div style="font-weight:800;font-size:18px;margin:2px 0 6px">🗺 ' + MAINF + '</div>' + pzMap(mainOrder(), '');
    } else {
      // ---- yangi ko'rinish: sarlavha, «Davom ettirish», rasmli to'plamlar (2 ustun)
      pzCss();
      var mix = S.list.filter(function (p) { return !foOf(p); }), all = [];
      fl.forEach(function (f, i) { all.push({ f: f, i: i, arr: S.list.filter(function (p) { return foOf(p) === f; }) }); });
      if (mix.length) all.push({ f: '', i: -1, arr: mix });
      all = all.filter(function (x) { return x.arr.length || S.admin; });
      var solvedN = (S.solved || []).length;
      h = '<div class="pzN"><div class="pzNh"><button id="pzBack" class="pzNb" aria-label="Orqaga">‹</button><div class="pzNt"><b>' + (view === 'custom' ? 'Maxsus masalalar' : 'Masalalar') + '</b><small>' + (S.admin ? S.list.length + ' ta masala · ' + all.length + ' ta to‘plam' : solvedN + ' ta yechildi') + '</small></div></div>' +
        '<div class="pzNp"><button id="pzTop">TOP</button>' + (S.admin ? '<button id="pzQzP">Viktorina</button><button id="pzPlus" class="pr">+ Yangi</button>' : '') + '</div>';
      // davom ettirish: boshlangan, tugamagan kitobdagi birinchi yechilmagan masala
      var BK = pzBooks(), allB = BK.s.concat(BK.m, BK.e), cb = null;
      allB.forEach(function (b) { if (cb) return; var d = nDone(b.arr); if (d > 0 && d < b.arr.length) cb = b; });
      if (!cb) allB.forEach(function (b) { if (!cb && nDone(b.arr) < b.arr.length) cb = b; });
      if (cb) {
        var cp = cb.arr.filter(function (p) { return (S.solved || []).indexOf(p.id) < 0; })[0];
        if (cp) { S._cont = { book: cb, p: cp }; h += '<button class="pzNc" id="pzCont">' + pzMini(cp.board, 0, 1) + '<span class="t"><small>DAVOM ETTIRISH</small><b>' + esc(cb.title) + '</b><span>' + (cb.from + cb.arr.indexOf(cp)) + '-masala · ' + (cp.side === 'w' ? 'Oq yuradi' : 'Qora yuradi') + '</span></span><span class="go">Yechish</span></button>'; }
      }
      var TABS = [['s', 'Sodda', BK.s.length], ['m', 'Murakkab', BK.m.length], ['e', 'Etyudlar', BK.e.length], ['f', 'To‘plamlar', all.length]];
      if (!S.admin) { TABS = TABS.filter(function (t) { return t[0] !== 'f'; }); if (shelf === 'f') shelf = 's'; }
      h += '<div class="pzTb">' + TABS.map(function (t) { return '<button data-sh="' + t[0] + '"' + (shelf === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>';
      if (shelf !== 'f') {
        var books = BK[shelf] || [];
        h += '<div class="pzNs"><span>' + (shelf === 's' ? 'SODDA MASALALAR' : shelf === 'm' ? 'MURAKKAB MASALALAR' : 'ETYUDLAR') + '</span><span>' + books.length + ' ta kitob</span></div>';
        h += books.length ? '<div class="pzSh3">' + books.map(function (b, k) { return bookHtml(b, k); }).join('') + '</div>' : '<div style="opacity:.7;padding:20px 4px">Hozircha kitob yo‘q</div>';
        h += '<div style="height:64px"></div></div>';
      } else {
      if (!S.list.length && !fl.length) h += '<div style="padding:30px;opacity:.7">Hozircha masala yo‘q</div>';
      h += '<div class="pzNs"><span>TO‘PLAMLAR</span><span>' + all.length + ' ta</span></div><div class="pzNg">';
      var ACC = ['#6b5cf0', '#f59e0b', '#ec4899', '#0ea5e9', '#16a34a', '#a855f7', '#ef4444', '#14b8a6'];
      all.forEach(function (x, k) {
        var n = x.arr.length, d = nDone(x.arr), pc = n ? Math.round(d / n * 100) : 0, done = n && d === n, f = x.f;
        var tags = '';
        if (S.admin && f && S.dayFolder === f) tags += '<i class="tg2" style="background:#16a34a">Kunlik</i>';
        if (S.admin && f && (S.chanFolders || []).indexOf(f) >= 0) tags += '<i class="tg2" style="background:#2563eb">Kanal</i>';
        h += '<div class="pzNf" ' + (x.i >= 0 ? 'data-fo="' + x.i + '"' : 'data-mix="1"') + '><div class="cv">' + (n ? pzMini(x.arr[0].board, k) : '<div class="em">Bo‘sh</div>') + '<em' + (done ? ' class="ok"' : '') + '>' + (done ? 'Tugatilgan' : pc + '%') + '</em>' +
          (S.admin && f && mgOk(f) ? '<button class="mo" data-mo="' + x.i + '">⋯</button><span style="display:none"><button data-ch="' + x.i + '"></button><button data-dy="' + x.i + '"></button><button data-rf="' + x.i + '"></button><button data-df="' + x.i + '"></button></span>' : '') + (tags ? '<span class="tgs">' + tags + '</span>' : '') + '</div>' +
          '<div class="bd"><b>' + esc(f || 'Aralash masalalar') + '</b><small><span>' + n + ' ta masala</span><span>' + d + '/' + n + '</span></small><div class="pzbr"><i style="width:' + pc + '%;background:' + (done ? '#16a34a' : ACC[k % ACC.length]) + '"></i></div></div></div>';
      });
      h += '</div><div style="height:64px"></div></div>';
      }
    }
    if (!S.admin) h += '<div style="font-size:11px;opacity:.4;margin-top:16px">ID: ' + esc(S.myId) + '</div>';
    ov.innerHTML = h;
    on('#pzBack', function () { hub = 1; view = ''; list(); }); on('#pzTop', pzTop); on('#pzQzP', qzPanel);
    on('#pzGo', function () { var mo = mainOrder(), nx = mo.filter(function (p) { return (S.solved || []).indexOf(p.id) < 0; })[0] || mo[0]; window.__pzMapKey = ''; if (nx) play(nx); }); on('#pzNew', function () { newPz(0, ''); });
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
    Array.prototype.forEach.call(ov.querySelectorAll('[data-ch]'), function (e) {   // 📣 kanal masalalari papkasi (bir nechta)
      e.onclick = function (ev) { ev.stopPropagation(); var f = fl[Number(e.getAttribute('data-ch'))], on = (S.chanFolders || []).indexOf(f) >= 0;
        if (!confirm(on ? '«' + f + '» kanal masalalari ro‘yxatidan olib tashlansinmi?' : 'Kanalga masalalar «' + f + '» papkasidan ham tushsinmi?\n\n(Bir nechta papka tanlash mumkin. Hech biri tanlanmasa — hamma papkalardan.)')) return;
        api('/api/puzzle/chanfolder', { folder: f }).then(function (d) { if (d && d.error) { alert(d.error); return; } load(); }); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-dy]'), function (e) {
      e.onclick = function (ev) { ev.stopPropagation(); var f = fl[Number(e.getAttribute('data-dy'))], off = S.dayFolder === f;
        if (!confirm(off ? '«' + f + '» kunlik masalalar papkasi bo‘lmay qolsinmi? (Petrova papkasiga qaytadi)' : 'Kunlik 5 ta masala endi «' + f + '» papkasidan kelsinmi?')) return;
        api('/api/puzzle/dayfolder', { folder: off ? '' : f }).then(function (d) { if (d && d.error) { alert(d.error); return; } load(); }); };
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
    on('#pzMG', function () { MG.on = !MG.on; MG.sel = []; list(); });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-mix]'), function (e) { e.onclick = function () { curLv = 9; curFo = ''; list(); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-sh]'), function (e) { e.onclick = function () { shelf = e.getAttribute('data-sh'); try { localStorage.setItem('pzShelf', shelf); } catch (x) {} list(); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-bk]'), function (e) { e.onclick = function () { var b = findBook(e.getAttribute('data-bk')); if (!b) return; if (bkLocked(b)) return pzSheet('Kitob qulflangan', [['Oldingi kitobdagi 100 ta masalani yeching', function () {}]]); bookView(b); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-bm]'), function (e) { e.onclick = function (ev) { ev.stopPropagation(); var b = findBook(e.getAttribute('data-bm')); if (b) bookMenu(b); }; });
    on('#pzCont', function () {
      var c = S._cont; if (!c) return;
      if (c.book) { curBook = c.book; return play(c.p); }
      if (c.f) { curFo = c.f; curLv = 0; } else { curLv = 9; curFo = ''; }
      list(); var el = ov.querySelector('[data-i="' + S.list.indexOf(c.p) + '"]'); if (el) el.click(); else play(c.p);
    });
    on('#pzPlus', function () {
      pzSheet('Yangi', [['Tekshiruv va xatolar', pzChkView], ['Yangi masala', function () { newPz(0, ''); }], ['Yangi papka', function () { var n = cleanName(prompt('Yangi papka nomi:')); if (n) api('/api/puzzle/folder', { name: n }).then(function () { load(); }); }]]
        .concat(fl.filter(mgOk).length >= 2 ? [['Papkalarni birlashtirish', function () { MG.on = true; MG.sel = []; list(); }]] : []));
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-mo]'), function (e) {
      e.onclick = function (ev) {
        ev.stopPropagation(); var i = Number(e.getAttribute('data-mo')), f = fl[i], q = function (a) { var b = ov.querySelector('[data-' + a + '="' + i + '"]'); if (b) b.click(); };
        pzSheet(f, [
          [((S.chanFolders || []).indexOf(f) >= 0 ? 'Kanaldan olib tashlash' : 'Kanalga yuborish'), function () { q('ch'); }],
          [(S.dayFolder === f ? 'Kunlik rejadan olib tashlash' : 'Kunlik rejaga qo‘shish'), function () { q('dy'); }],
          ['Nomini o‘zgartirish', function () { q('rf'); }],
          ['Boshqa papka bilan birlashtirish', function () { MG.on = true; MG.sel = [f]; list(); }],
          ['O‘chirish', function () { q('df'); }, 1]
        ]);
      };
    });
    mgUi(fl);
  }
  // 📚 kitoblar: server sodda/murakkab ro'yxatini beradi, etyudlar papkalari shu yerda 100 tadan bo'linadi
  function pzBooks() {
    var by = {}, out = { s: [], m: [], e: [] }, B = S.books || {};
    S.list.forEach(function (p) { by[p.id] = p; });
    var mk = function (kind, i, ids, title) {
      var arr = ids.map(function (id) { return by[id]; }).filter(Boolean);
      return { key: kind + i, kind: kind, n: i + 1, title: title, from: 1, arr: arr };
    };
    (B.s || []).forEach(function (ids, i) { out.s.push(mk('s', i, ids, 'Sodda · ' + (i + 1) + '-kitob')); });
    (B.m || []).forEach(function (ids, i) { out.m.push(mk('m', i, ids, 'Murakkab · ' + (i + 1) + '-kitob')); });
    (S.folders || []).forEach(function (f, fi) {
      var et = S.list.filter(function (p) { return p.et && p.folder === f; }); if (!et.length) return;
      for (var i = 0, k = 0; i < et.length; i += 100, k++) {
        var b = { key: 'e' + fi + '_' + k, f: f, k: k, kind: 'e', n: k + 1, title: f + (et.length > 100 ? ' · ' + (k + 1) : ''), from: 1, arr: et.slice(i, i + 100) };
        out.e.push(b);
      }
    });
    return out;
  }
  function bookStars(b) { var t = 0, sv = S.solved || [], st = S.stars || {}; b.arr.forEach(function (p) { if (sv.indexOf(p.id) >= 0) t += st[p.id] || 1; }); return t; }
  function findBook(key) { var B = pzBooks(), all = B.s.concat(B.m, B.e); return all.filter(function (b) { return b.key === key; })[0] || null; }
  // 🌿 muqova manzaralari (o'zimiz chizgan): tog', o'rmon, gullar, kapalaklar, oyli ko'l, sakura, kuz, sharshara, qumtepalar
  function natSvg(k, u) {
    var R = function (s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }, g = '', r, i, x, y, c;
    switch (k % 9) {
      case 0: g = '<defs><linearGradient id="n' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb36b"/><stop offset=".6" stop-color="#ff6f61"/><stop offset="1" stop-color="#6b3a7a"/></linearGradient></defs><rect width="100" height="147" fill="url(#n' + u + ')"/><circle cx="62" cy="52" r="15" fill="#ffe9a8"/><path d="M0 95 L25 60 L45 88 L65 55 L100 98 V147 H0Z" fill="#4a2f5e"/><path d="M0 112 L30 85 L55 108 L80 90 L100 110 V147 H0Z" fill="#2d1d3d"/>'; break;
      case 1: g = '<rect width="100" height="147" fill="#bfe8ff"/><path d="M0 100 Q50 80 100 100 V147 H0Z" fill="#7cc576"/>'; r = R(3 + k); for (i = 0; i < 9; i++) { x = r() * 100; var sz = 14 + r() * 14; y = 88 + r() * 30; g += '<path d="M' + x + ' ' + (y - sz * 2) + ' L' + (x + sz * .6) + ' ' + y + ' L' + (x - sz * .6) + ' ' + y + 'Z" fill="' + ['#1f6b3a', '#2b8048', '#175a30'][i % 3] + '"/><rect x="' + (x - 1.2) + '" y="' + y + '" width="2.4" height="5" fill="#5a3b1e"/>'; } break;
      case 2: g = '<rect width="100" height="147" fill="#bfe6ff"/><circle cx="20" cy="25" r="9" fill="#fff6b0"/><path d="M0 80 Q50 65 100 80 V147 H0Z" fill="#8fd16a"/>'; r = R(7 + k); for (i = 0; i < 26; i++) { x = r() * 100; y = 85 + r() * 58; c = ['#ff5c8a', '#ffd23f', '#ffffff', '#c77dff', '#ff8c42'][i % 5]; g += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 8) + '" stroke="#3f8f3a" stroke-width=".8"/>'; for (var q = 0; q < 5; q++) { var a = q * 72 * Math.PI / 180; g += '<circle cx="' + (x + Math.cos(a) * 2.2) + '" cy="' + (y + Math.sin(a) * 2.2) + '" r="1.7" fill="' + c + '"/>'; } g += '<circle cx="' + x + '" cy="' + y + '" r="1.2" fill="#ffb703"/>'; } break;
      case 3: g = '<rect width="100" height="147" fill="#ffe3ec"/>'; r = R(11 + k); for (i = 0; i < 6; i++) { x = 15 + r() * 70; y = 25 + r() * 95; var sc = .6 + r() * .7; c = ['#7b2cbf', '#ff6d00', '#0096c7', '#e63946', '#2a9d8f', '#f15bb5'][i]; g += '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ') rotate(' + (r() * 40 - 20) + ')"><ellipse cx="-6" cy="-4" rx="7" ry="9" fill="' + c + '"/><ellipse cx="6" cy="-4" rx="7" ry="9" fill="' + c + '"/><ellipse cx="-5" cy="7" rx="5" ry="6" fill="' + c + '" opacity=".8"/><ellipse cx="5" cy="7" rx="5" ry="6" fill="' + c + '" opacity=".8"/><circle cx="-6" cy="-5" r="2.2" fill="#fff" opacity=".7"/><circle cx="6" cy="-5" r="2.2" fill="#fff" opacity=".7"/><rect x="-1" y="-10" width="2" height="22" rx="1" fill="#2b2b2b"/></g>'; } break;
      case 4: g = '<rect width="100" height="147" fill="#13275e"/>'; r = R(5 + k); for (i = 0; i < 30; i++) g += '<circle cx="' + r() * 100 + '" cy="' + r() * 70 + '" r="' + (r() * .7 + .2) + '" fill="#fff" opacity="' + (.5 + r() * .5) + '"/>'; g += '<circle cx="70" cy="35" r="11" fill="#fdf3c4"/><path d="M0 78 L20 62 L38 76 L60 58 L100 80 V95 H0Z" fill="#0d1a3d"/><rect y="95" width="100" height="52" fill="#1d3570"/><rect x="62" y="98" width="16" height="2" fill="#fdf3c4" opacity=".6"/>'; break;
      case 5: g = '<rect width="100" height="147" fill="#fde2e4"/><path d="M0 120 Q50 110 100 120 V147 H0Z" fill="#a7c957"/><path d="M50 125 C48 105 52 95 46 80 M48 98 C40 90 34 88 28 84 M50 92 C58 84 66 82 72 76" stroke="#5e3b1e" stroke-width="3.5" fill="none" stroke-linecap="round"/>'; r = R(9 + k); for (i = 0; i < 60; i++) { var a2 = r() * Math.PI * 2, d2 = r() * 30; g += '<circle cx="' + (50 + Math.cos(a2) * d2 * 1.2) + '" cy="' + (70 + Math.sin(a2) * d2 * .8) + '" r="' + (2 + r() * 3) + '" fill="' + ['#ffafcc', '#ffc8dd', '#ff8fab', '#fff0f3'][i % 4] + '" opacity=".9"/>'; } break;
      case 6: g = '<rect width="100" height="147" fill="#ffe8c2"/><path d="M0 105 Q50 95 100 105 V147 H0Z" fill="#c9a26b"/>'; r = R(13 + k); for (i = 0; i < 5; i++) { x = 12 + i * 19 + r() * 6; y = 100 + r() * 8; g += '<rect x="' + (x - 1.5) + '" y="' + (y - 22) + '" width="3" height="24" fill="#5e3b1e"/><circle cx="' + x + '" cy="' + (y - 28) + '" r="' + (10 + r() * 4) + '" fill="' + ['#e76f51', '#f4a261', '#e9c46a', '#d62828', '#f77f00'][i] + '"/>'; } break;
      case 7: g = '<rect width="100" height="147" fill="#9be7d8"/><path d="M0 0 H35 V147 H0Z" fill="#4b6b5a"/><path d="M65 0 H100 V147 H65Z" fill="#4b6b5a"/><rect x="35" y="0" width="30" height="120" fill="#e0fbff"/>'; r = R(17 + k); for (i = 0; i < 14; i++) g += '<rect x="' + (36 + r() * 28) + '" y="' + r() * 110 + '" width="1" height="' + (8 + r() * 14) + '" fill="#7fd3e6"/>'; g += '<ellipse cx="50" cy="122" rx="30" ry="9" fill="#fff" opacity=".9"/><rect y="125" width="100" height="22" fill="#2a9d8f"/><circle cx="12" cy="20" r="9" fill="#2d6a4f"/><circle cx="88" cy="30" r="10" fill="#2d6a4f"/>'; break;
      default: g = '<rect width="100" height="147" fill="#ffc98b"/><circle cx="30" cy="40" r="13" fill="#fff1c1"/><path d="M0 90 Q30 70 60 92 T100 85 V147 H0Z" fill="#e9a35b"/><path d="M0 112 Q40 95 75 115 T100 110 V147 H0Z" fill="#c97b3b"/><path d="M78 92 v-14 m0 6 h-5 v-5 m5 9 h5 v-7" stroke="#2d6a4f" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 100 147" preserveAspectRatio="xMidYMid slice">' + g + '</svg>';
  }
  // 🔒 kitob qulfi: oldingi kitob 100/100 bo'lmaguncha yopiq; admin ochgan kitob ochiq; etyud kitoblari ochiq qoladi
  var LOCK_BIG = '<svg viewBox="0 0 24 24" width="38" height="38"><rect x="4" y="10" width="16" height="11" rx="2.5" fill="#e2e8f0"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#e2e8f0" stroke-width="2.4" fill="none"/><circle cx="12" cy="15" r="1.6" fill="#475569"/></svg>';
  var LOCK_SM = '<svg viewBox="0 0 24 24" width="13" height="13"><rect x="4" y="10" width="16" height="11" rx="2.5" fill="#94a3b8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#94a3b8" stroke-width="2.4" fill="none"/></svg>';
  function bkLocked(b) {
    if (S.admin || b.kind === 'e' || b.n <= 1) return false;
    var _ba = (S.bookAll || {})[b.key];
    if (_ba === 'open') return false;
    if (_ba === 'lock') return true;
    if ((S.bopen || {})[b.key]) return false;
    var prev = (pzBooks()[b.kind] || [])[b.n - 2], sv = S.solved || [];
    if (!prev) return false;
    var prevFull = prev.arr.every(function (p) { return sv.indexOf(p.id) >= 0; });
    return !prevFull;   // oldingi kitob 100/100 bo‘lmaguncha yopiq
  }
  function bookHtml(b, k) {
    var lk = bkLocked(b);
    var n = b.arr.length, d = nDone(b.arr), done = n && d === n, cov = S.books && S.books.cov && S.books.cov[b.key];
    var seed = (b.kind === 's' ? 0 : b.kind === 'm' ? 4 : 2) + b.n - 1 + (b.kind === 'e' ? k : 0);
    return '<div class="pzBk' + (lk ? ' lk' : '') + '" data-bk="' + b.key + '"' + (lk ? ' style="position:relative;filter:grayscale(1) brightness(.6)"' : '') + '>' + (lk ? '<span style="position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;pointer-events:none">' + LOCK_BIG + '</span>' : '') + (cov ? '<img src="/api/pzbook/cov?k=' + b.key + '&v=' + cov + '" alt="">' : natSvg(seed, b.key)) + (done ? '<span class="rib"></span>' : '') +
      '<div class="fr"></div><div class="tt">' + (b.kind === 'e' ? (function () { var pt = b.title.split(' · '); return '<small>' + esc(pt.length > 1 ? pt[0].toUpperCase() : 'ETYUD') + '</small><span class="sm">' + esc(pt.length > 1 ? pt.slice(1).join(' · ') : b.title) + '</span>'; })() : '<small>' + (b.kind === 's' ? 'SODDA' : 'MURAKKAB') + '</small><span>' + b.n + '-kitob</span>') + '</div>' +
      (S.admin ? '<button class="mo" data-bm="' + b.key + '">⋯</button>' : '') +
      '<div class="pl"><b>' + n + (b.kind === 'e' ? ' ta etyud' : ' ta masala') + '</b><i><u style="width:' + (n ? Math.round(d / n * 100) : 0) + '%"></u></i><small>' + (done ? 'Tugatilgan' : d + ' / ' + n) + (d ? ' · ★ ' + bookStars(b) : '') + '</small></div></div>';
  }
  // kitob ichi: mundarija (raqamlar to'ri)
  function bookView(b) {
    pzCss(); curBook = b; window.__advRet = null;
    var n = b.arr.length, d = nDone(b.arr), sv = S.solved || [], nx = b.arr.filter(function (p) { return sv.indexOf(p.id) < 0; })[0];
    var h = '<div class="pzN"><div class="pzNh"><button id="pzBack" class="pzNb">‹</button><div class="pzNt"><b>' + esc(b.title) + '</b><small>' + d + ' / ' + n + ' yechildi · <span style="color:#fbbf24">★ ' + bookStars(b) + ' / ' + n * 3 + '</span></small></div></div>';
    h += '<div class="pzbr" style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin:0 2px 12px"><i style="display:block;height:100%;width:' + (n ? Math.round(d / n * 100) : 0) + '%;background:#e9c46a"></i></div>';
    if (nx) h += '<button class="pzNc" id="pzBkGo">' + pzMini(nx.board, 0, 1) + '<span class="t"><small>' + (d ? 'DAVOM ETTIRISH' : 'BOSHLASH') + '</small><b>' + (b.from + b.arr.indexOf(nx)) + '-masala</b><span>' + (nx.side === 'w' ? 'Oq yuradi' : 'Qora yuradi') + '</span></span><span class="go">Yechish</span></button>';
    var fi = b.arr.indexOf(nx);
    h += '<div class="pzMd">' + b.arr.map(function (p, i) { var ok = sv.indexOf(p.id) >= 0, st = (S.stars || {})[p.id] || 0, lk = !S.admin && fi >= 0 && i > fi && !ok; return '<button data-bi="' + i + '" class="' + (ok ? 'ok s' + st : '') + (p === nx ? ' nx' : '') + (lk ? ' lk' : '') + '"' + (lk ? ' disabled' : '') + '>' + (lk ? LOCK_SM : (b.from + i) + (ok ? '<i>' + '★★★'.slice(0, st) + '<u>' + '★★★'.slice(st) + '</u></i>' : '')) + '</button>'; }).join('') + '</div><div style="height:64px"></div></div>';
    ov.innerHTML = h; ov.scrollTop = 0;
    on('#pzBack', function () { curBook = null; list(); });
    on('#pzBkGo', function () { play(nx); });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-bi]'), function (e) { e.onclick = function () { play(b.arr[+e.getAttribute('data-bi')]); }; });
  }
  // admin: muqova rasmi
  function bookMenu(b) {
    var has = S.books && S.books.cov && S.books.cov[b.key];
    pzSheet(b.title, [['Muqova rasmini qo‘yish', function () { coverPick(b); }], ['Foydalanuvchiga ochish', function () { bkGrant(b, true); }], ['Foydalanuvchidan yopish', function () { bkGrant(b, false); }], ['Hamma uchun ochiq', function () { bkAll(b, 'open'); }], ['Hamma uchun qulflangan', function () { bkAll(b, 'lock'); }], ['Hamma uchun oddiy qoida', function () { bkAll(b, ''); }]].concat(has ? [['Muqovani olib tashlash', function () { api('/api/pzbook/cov', { k: b.key, img: '' }).then(function (r) { if (r && r.cov) S.books.cov = r.cov; list(); }); }, 1]] : []));
  }
  function bkAll(b, st) {
    api('/api/puzzle/ball', { key: b.key, state: st }).then(function (r) { if (r && r.ok) { S.bookAll = S.bookAll || {}; if (st) S.bookAll[b.key] = st; else delete S.bookAll[b.key]; list(); } else window.alert((r && r.error) || 'Xato'); }).catch(function () { window.alert('Xato'); });
  }
  function bkGrant(b, on) {
    var q = window.prompt('Foydalanuvchi ismini yozing (kamida 2 harf):', '');
    if (!q || q.trim().length < 2) return;
    api('/api/puzzle/bfind', { q: q.trim() }).then(function (r) {
      var L = (r && r.list) || []; if (!L.length) { window.alert('Topilmadi'); return; }
      pzSheet('Topildi: ' + L.length, L.map(function (x) { return [x.name + ' (' + x.id + ')', function () {
        api('/api/puzzle/bopen', { uid: x.id, key: b.key, on: !!on }).then(function (rr) { if (rr && rr.ok) { if (on) { S.bopen = S.bopen || {}; S.bopen[b.key] = 1; } window.alert(on ? 'Kitob ochildi' : 'Kitob yopildi'); } else window.alert((rr && rr.error) || 'Xato'); });
      }]; }));
    }).catch(function () { window.alert('Xato'); });
  }
  function coverPick(b) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () {
        var W = 340, H = 500, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        var x = cv.getContext('2d'), sc = Math.max(W / img.width, H / img.height), w = img.width * sc, hh = img.height * sc;
        x.drawImage(img, (W - w) / 2, (H - hh) / 2, w, hh); URL.revokeObjectURL(url);
        var data = cv.toDataURL('image/webp', .82); if (data.indexOf('data:image/webp') !== 0) data = cv.toDataURL('image/jpeg', .82);
        api('/api/pzbook/cov', { k: b.key, img: data }).then(function (r) { if (r && r.error) { alert(r.error); return; } if (r && r.cov) S.books.cov = r.cov; list(); });
      };
      img.src = url;
    };
    inp.click();
  }
  // ⚠️ o'yinchi: «Xato bor» — sabab tanlanadi, adminga xabar ketadi
  function pzReport(p) {
    var send = function (w, note) {
      api('/api/pzchk/report', { id: p.id, why: w, note: note || '' }).then(function (r) {
        var t = r && r.error ? '⚠️ ' + r.error : r && r.again ? 'Siz bu masalani avval belgilagansiz. Rahmat!' : 'Rahmat! Xabaringiz adminga yuborildi. Xato tasdiqlansa, sizga tanga beriladi.';
        if (tg && tg.showAlert) tg.showAlert(t); else alert(t);
      });
    };
    pzSheet('Masalada qanday xato bor?', [
      ['Yechim noto‘g‘ri', function () { send('sol'); }],
      ['Boshqa yo‘l ham yutadi', function () { send('alt'); }],
      ['Pozitsiya xato', function () { send('pos'); }],
      ['Boshqa (yozib berish)', function () { var n = prompt('Xatoni qisqa yozing:'); if (n && n.trim()) send('other', n.trim()); }]
    ]);
  }
  // 🧩 admin: tekshiruv va xatolar ro'yxati
  function pzChkView() {
    pzCss();
    ov.innerHTML = '<div class="pzN"><div class="pzNh"><button id="pzBack" class="pzNb">‹</button><div class="pzNt"><b>Tekshiruv va xatolar</b><small>Yuklanmoqda…</small></div></div></div>';
    on('#pzBack', function () { list(); });
    api('/api/pzchk').then(function (d) {
      if (!d || d.error) { ov.querySelector('.pzNt small').textContent = (d && d.error) || 'Xato'; return; }
      var s = d.status, pc = s.total ? Math.round(s.done / s.total * 100) : 0;
      var h = '<div class="pzN"><div class="pzNh"><button id="pzBack" class="pzNb">‹</button><div class="pzNt"><b>Tekshiruv va xatolar</b><small>' + s.done + ' / ' + s.total + ' tekshirildi · ' + d.total + ' ta topildi</small></div></div>';
      h += '<div class="pzCk"><div class="pzbr" style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden"><i style="display:block;height:100%;width:' + pc + '%;background:#6b5cf0"></i></div>' +
        '<small>' + (s.on ? (s.now ? 'Tekshiruv ketyapti (kunduzi sekin, tunda tez)' : 'Tunda 02:00–07:00 da tekshiriladi') : pc >= 100 ? 'Hammasi tekshirilgan. Yangi yoki o‘zgargan masalalar keyingi safar tekshiriladi.' : 'To‘xtatilgan') + '</small>' +
        '<div class="pzNp" style="margin:10px 0 0">' + (s.on ? '<button id="ckStop">To‘xtatish</button>' : '<button id="ckNight">Tunda tekshirish</button><button id="ckNow" class="pr">Hozir boshlash</button>') + '</div></div>';
      var lab = { err: ['Xato', '#be123c'], warn: ['Shubhali', '#b45309'], user: ['O‘yinchi', '#2563eb'] };
      h += (d.list.length ? d.list.map(function (x, k) {
        var L = lab[x.st] || lab.user;
        return '<div class="pzCkI"><div class="t"><b>' + esc(x.title) + '</b><span style="background:' + L[1] + '">' + L[0] + (x.n ? ' · ' + x.n + ' kishi' : '') + '</span></div><small>' + esc(x.folder || (x.etud ? 'Etyud' : 'Papkasiz')) + '</small>' +
          x.why.slice(0, 4).map(function (w) { return '<p>' + esc(w) + '</p>'; }).join('') +
          '<div class="a"><button data-ck-o="' + k + '">Ochish</button>' + (x.etud ? '' : '<button data-ck-d="' + k + '" class="del">O‘chirish</button>') + '<button data-ck-k="' + k + '">Xato emas</button></div></div>';
      }).join('') : '<div style="opacity:.7;padding:20px 4px">Hozircha xato topilmadi</div>') + '<div style="height:64px"></div></div>';
      ov.innerHTML = h;
      on('#pzBack', function () { list(); });
      var go = function (u, b) { api(u, b || {}).then(pzChkView); };
      on('#ckStop', function () { go('/api/pzchk/stop'); });
      on('#ckNight', function () { go('/api/pzchk/start', { now: false }); });
      on('#ckNow', function () { go('/api/pzchk/start', { now: true }); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-ck-o]'), function (b) { b.onclick = function () { var x = d.list[+b.getAttribute('data-ck-o')], q = S.list.filter(function (y) { return y.id === x.id; })[0]; if (q) { window.__pzChkBack = 1; play(q); } else alert('Masala topilmadi'); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-ck-d]'), function (b) { b.onclick = function () { var x = d.list[+b.getAttribute('data-ck-d')]; if (!confirm('«' + x.title + '» o‘chirilsinmi?' + (x.n ? '\n\nBelgilagan ' + x.n + ' kishiga 10 tangadan beriladi.' : ''))) return; api('/api/pzchk/act', { id: x.id, act: 'del' }).then(function () { load(); setTimeout(pzChkView, 600); }); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-ck-k]'), function (b) { b.onclick = function () { var x = d.list[+b.getAttribute('data-ck-k')]; go('/api/pzchk/act', { id: x.id, act: 'ok' }); }; });
    });
  }
  // pastdan chiqadigan tanlov menyusi
  function pzSheet(title, items) {
    var o = document.createElement('div'); o.id = 'pzSh';
    o.innerHTML = '<div class="pzShB"></div><div class="pzShC"><h4>' + esc(title) + '</h4>' + items.map(function (it, k) { return '<button data-k="' + k + '"' + (it[2] ? ' class="del"' : '') + '>' + esc(it[0]) + '</button>'; }).join('') + '</div>';
    document.body.appendChild(o);
    o.querySelector('.pzShB').onclick = function () { o.remove(); };
    Array.prototype.forEach.call(o.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { o.remove(); items[+b.getAttribute('data-k')][1](); }; });
  }
  // kichik doska rasmi (papka muqovasi)
  var PZTH = [['#EFD9B1', '#B58863'], ['#F1D5CC', '#B5685D'], ['#FFFFDD', '#86A666'], ['#E3DAEE', '#8B72B5'], ['#DEE3E6', '#8CA2AD'], ['#D5F0EC', '#4A9A93']];
  function pzMini(b, k, sm) {
    var t = PZTH[k % PZTH.length], h = '<div class="pzMb' + (sm ? ' sm' : '') + '">';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var d = (r + c) % 2, v = b && b[r] ? b[r][c] : 0; h += '<i class="' + (v === 1 ? 'w' : v === 2 ? 'b' : v === 3 ? 'w k' : v === 4 ? 'b k' : '') + '" style="background:' + (d ? t[1] : t[0]) + '"></i>'; }
    return h + '</div>';
  }
  function pzCss() {
    if (document.getElementById('pzNCss')) return;
    var c = document.createElement('style'); c.id = 'pzNCss';
    c.textContent = '#spPz .pzN{text-align:left;margin:-14px;padding:14px;min-height:100%;background:radial-gradient(120% 50% at 50% -10%,#2a2470 0,#0b0e1a 60%)}' +
      '.pzNh{display:flex;align-items:center;gap:10px;margin:2px 0 10px}.pzNb{width:40px;height:40px;flex:none;border:0;border-radius:12px;background:rgba(255,255,255,.08);color:#fff;font-size:22px}.pzNt b{display:block;font-size:23px}.pzNt small{display:block;opacity:.65;font-size:12.5px;margin-top:2px}' +
      '.pzNp{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.pzNp button{border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:8px 14px;background:rgba(255,255,255,.08);color:#fff;font-weight:700;font-size:13.5px}.pzNp .pr{background:#6b5cf0;border-color:#6b5cf0}' +
      '.pzNc{width:100%;border:0;color:#fff;text-align:left;display:flex;gap:12px;align-items:center;border-radius:20px;padding:12px;margin-bottom:16px;background:linear-gradient(135deg,#6b5cf0,#a855f7 60%,#ec4899);box-shadow:0 10px 26px rgba(107,92,240,.35);font-family:inherit}' +
      '.pzNc .t{flex:1;min-width:0}.pzNc small{display:block;font-size:11px;letter-spacing:1px;opacity:.85;font-weight:800}.pzNc b{display:block;font-size:16px;margin:3px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pzNc .t>span{font-size:12.5px;opacity:.9}.pzNc .go{background:#fff;color:#5b21b6;border-radius:14px;padding:10px 13px;font-weight:900;font-size:14px;flex:none}' +
      '.pzNs{display:flex;justify-content:space-between;font-size:12px;letter-spacing:1.2px;font-weight:800;color:#a9a4d8;margin:2px 2px 9px}' +
      '.pzNg{display:grid;grid-template-columns:1fr 1fr;gap:11px}.pzNf{border-radius:18px;background:#161a3a;border:1px solid rgba(255,255,255,.07);overflow:hidden;cursor:pointer;position:relative}' +
      '.pzNf .cv{padding:9px 9px 7px;position:relative}.pzNf .cv em{position:absolute;right:15px;top:15px;font-style:normal;font-size:11px;font-weight:900;padding:3px 7px;border-radius:8px;background:rgba(0,0,0,.6);color:#fff}.pzNf .cv em.ok{background:#16a34a}' +
      '.pzNf .em{aspect-ratio:1;border-radius:10px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;opacity:.6}' +
      '.pzNf .mo{position:absolute;left:15px;top:15px;width:32px;height:28px;border:0;border-radius:9px;background:rgba(0,0,0,.6);color:#fff;font-weight:900;font-size:16px;line-height:1}' +
      '.pzNf .tgs{position:absolute;left:15px;bottom:13px;display:flex;gap:4px}.pzNf .tg2{font-style:normal;font-size:10.5px;font-weight:800;border-radius:7px;padding:2px 6px;color:#fff}' +
      '.pzNf .bd{padding:2px 11px 11px}.pzNf .bd b{display:block;font-size:14px;line-height:1.25;min-height:35px;word-break:break-word}.pzNf .bd small{display:flex;justify-content:space-between;opacity:.75;font-size:12px;margin:5px 0 6px}' +
      '.pzNf .pzbr{height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}.pzNf .pzbr i{display:block;height:100%;border-radius:3px}' +
      '.pzMb::before,.pzMb::after{content:none!important;display:none!important}.pzMb{display:grid;width:100%;grid-template-columns:repeat(8,minmax(0,1fr));border-radius:10px;overflow:hidden;box-shadow:0 6px 14px rgba(0,0,0,.4)}.pzMb.sm{width:78px!important;flex:none;border-radius:8px}' +
      '.pzMb i{aspect-ratio:1;position:relative;display:block;min-width:0;width:auto;height:auto;margin:0;padding:0;font-size:0;border:0}.pzMb i.w:after,.pzMb i.b:after{content:"";position:absolute;inset:13%;border-radius:50%}.pzMb i.w:after{background:radial-gradient(circle at 35% 30%,#fff,#cfc8b6)}.pzMb i.b:after{background:radial-gradient(circle at 35% 30%,#666,#111)}.pzMb i.k:after{box-shadow:inset 0 0 0 2px #e3b21c}' +
      '.pzTb{display:flex;gap:6px;margin:0 0 12px}.pzTb button{flex:1;border:1px solid rgba(233,196,106,.35);border-radius:12px;padding:9px 2px;background:rgba(255,255,255,.04);color:#e9d9a8;font-weight:700;font-size:13px;font-family:inherit}.pzTb .on{background:linear-gradient(180deg,#e9c46a,#b8862b);color:#2a1a05;border-color:#e9c46a}' +
      '.pzSh3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 10px}' +
      '.pzBk{position:relative;aspect-ratio:.68;border-radius:3px 7px 7px 3px;overflow:hidden;cursor:pointer;box-shadow:inset 4px 0 0 rgba(0,0,0,.35),3px 5px 10px rgba(0,0,0,.55);font-family:"DejaVu Serif",Georgia,serif}' +
      '.pzBk svg,.pzBk img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.pzBk .fr{position:absolute;inset:5px 5px 5px 9px;border:1px solid rgba(255,240,200,.7);border-radius:3px;pointer-events:none}' +
      '.pzBk .tt{position:absolute;left:12px;right:8px;top:9px;text-align:center;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8);font-weight:700;background:rgba(20,14,8,.45);border-radius:6px;padding:3px 2px 4px}.pzBk .tt small{display:block;font-size:8px;letter-spacing:1.5px}.pzBk .tt span{font-size:14px}.pzBk .tt .sm{font-size:10px;line-height:1.2;display:block;padding:0 3px}' +
      '.pzBk .pl{position:absolute;left:12px;right:8px;bottom:9px;background:rgba(20,14,8,.72);border-radius:6px;padding:5px 5px 6px;text-align:center}.pzBk .pl b{display:block;font-size:11px;color:#f6e7bf;white-space:nowrap}' +
      '.pzBk .pl i{display:block;height:3px;margin-top:4px;border-radius:2px;background:rgba(255,255,255,.2)}.pzBk .pl i u{display:block;height:100%;background:#e9c46a;border-radius:2px}.pzBk .pl small{display:block;font-size:9.5px;color:#e9c46a;margin-top:3px}' +
      '.pzBk .rib{position:absolute;right:12px;top:0;width:10px;height:24px;background:#2e9e5b;clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%);z-index:2}' +
      '.pzBk .mo{position:absolute;right:10px;bottom:66px;width:30px;height:24px;border:0;border-radius:8px;background:rgba(0,0,0,.6);color:#fff;font-weight:900;z-index:3;line-height:1}' +
      '.pzMd{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}.pzMd button{aspect-ratio:1;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:#161a3a;color:#fff;font-weight:700;font-size:13px;font-family:inherit}' +
      '.pzMd .ok{background:#14532d;color:#bbf7d0;border-color:#16a34a}.pzMd .ok.s2{background:#1f4d2b}.pzMd .ok.s1{background:#26402f;color:#d1e7d6}.pzMd .nx{outline:2px solid #e9c46a;outline-offset:1px}' +
      '.pzMd button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.1}.pzMd button i{font-style:normal;font-size:10px;color:#fbbf24;letter-spacing:.5px}.pzMd button i u{text-decoration:none;opacity:.3;color:#fff}' +
      '.pzCk{background:#161a3a;border-radius:16px;padding:12px;margin-bottom:12px}.pzCk small{display:block;opacity:.75;font-size:12.5px;margin-top:6px}' +
      '.pzCkI{background:#161a3a;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:11px 12px;margin-bottom:9px}.pzCkI .t{display:flex;gap:8px;align-items:flex-start}.pzCkI .t b{flex:1;font-size:14.5px}.pzCkI .t span{font-size:11px;font-weight:800;border-radius:8px;padding:3px 7px;white-space:nowrap}' +
      '.pzCkI small{display:block;opacity:.6;font-size:12px;margin:2px 0 4px}.pzCkI p{margin:3px 0;font-size:13px;opacity:.9}.pzCkI .a{display:flex;gap:6px;margin-top:8px}.pzCkI .a button{flex:1;border:0;border-radius:10px;padding:9px 4px;background:#262b66;color:#fff;font-weight:700;font-size:13px;font-family:inherit}.pzCkI .a .del{background:#7f1d1d}' +
      '#pzSh{position:fixed;inset:0;z-index:100010}#pzSh .pzShB{position:absolute;inset:0;background:rgba(0,0,0,.55)}#pzSh .pzShC{position:absolute;left:0;right:0;bottom:0;background:#161a3a;border-radius:20px 20px 0 0;padding:14px 14px calc(18px + env(safe-area-inset-bottom,0px));color:#fff;text-align:left}' +
      '#pzSh h4{margin:0 0 10px;font-size:15px;opacity:.8}#pzSh button{display:block;width:100%;text-align:left;border:0;padding:13px 12px;border-radius:12px;background:#1d2250;color:#fff;margin-bottom:7px;font-size:15px;font-family:inherit}#pzSh .del{background:#3b0d18;color:#fca5a5}';
    document.head.appendChild(c);
  }
  // ---- admin: 🔗 papkalarni birlashtirish (belgilangan papkalardagi masalalar bitta papkaga, tartib bilan qayta raqamlanadi)
  var MG = { on: false, sel: [] };
  function mgOk(f) { return f.indexOf('Etyudlar · ') !== 0 && f.indexOf('Ustyanov · ') !== 0 && f.indexOf('Malamed') !== 0; }   // etyud papkalari birlashtirilmaydi
  function mgUi(fl) {
    var old = document.getElementById('pzMgBar'); if (old) old.remove();
    if (!MG.on || !S.admin) return;
    var cnt = function (f) { return S.list.filter(function (p) { return foOf(p) === f; }).length; };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-fo]'), function (e) {
      var f = fl[Number(e.getAttribute('data-fo'))]; if (!mgOk(f)) { e.style.opacity = '.35'; e.onclick = null; return; }
      var k = MG.sel.indexOf(f);
      e.style.outline = k >= 0 ? '3px solid #a78bfa' : '2px dashed rgba(255,255,255,.25)'; e.style.outlineOffset = '-2px'; e.style.position = 'relative';
      var cb = document.createElement('span'); cb.style.cssText = 'position:absolute;left:-6px;top:-6px;z-index:3;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;border:2px solid ' + (k >= 0 ? '#7c3aed;background:#7c3aed' : '#fff;background:#141040');
      cb.textContent = k >= 0 ? String(k + 1) : ''; e.appendChild(cb);
      e.onclick = function (ev) { ev.stopPropagation(); var i = MG.sel.indexOf(f); if (i >= 0) MG.sel.splice(i, 1); else MG.sel.push(f); list(); };
    });
    var n = MG.sel.reduce(function (s, f) { return s + cnt(f); }, 0);
    var bar = document.createElement('div'); bar.id = 'pzMgBar';
    bar.style.cssText = 'position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 74px);z-index:100005;display:flex;gap:8px;align-items:center;padding:10px;border-radius:16px;background:#141040;box-shadow:0 6px 24px rgba(0,0,0,.6);color:#fff;font-family:inherit';
    bar.innerHTML = '<b style="flex:1;font-size:14px">' + (MG.sel.length ? MG.sel.length + ' ta papka · ' + n + ' ta masala' : 'Birlashtiriladigan papkalarni belgilang (tartib bo‘yicha)') + '</b><button id="pzMgX" style="border:0;border-radius:12px;padding:10px 12px;font-size:15px;color:#fff;background:#352d86">Bekor</button><button id="pzMgGo" style="border:0;border-radius:12px;padding:10px 12px;font-size:15px;font-weight:700;color:#fff;background:#7c3aed"' + (MG.sel.length < 2 ? ' disabled' : '') + '>✅ Birlashtirish</button>';
    document.body.appendChild(bar);
    bar.querySelector('#pzMgX').onclick = function () { MG.on = false; MG.sel = []; list(); };
    bar.querySelector('#pzMgGo').onclick = function () {
      if (MG.sel.length < 2) return;
      var to = cleanName(prompt('Birlashtirilgan papka nomi (belgilanganlardan biri yoki yangi nom):', MG.sel[0])); if (!to) return;
      if (!confirm(MG.sel.length + ' ta papkani (' + n + ' ta masala) «' + to + '» papkasiga birlashtiramizmi?\n\nMasalalar tanlangan tartibda qayta raqamlanadi. Yechilganlar saqlanadi.')) return;
      var b = this; b.disabled = true; b.textContent = '⏳';
      api('/api/puzzle/merge', { from: MG.sel, to: to }).then(function (r) {
        if (r && r.error) { alert('⚠️ ' + r.error); b.disabled = false; b.textContent = '✅ Birlashtirish'; return; }
        MG.on = false; MG.sel = []; var x = document.getElementById('pzMgBar'); if (x) x.remove(); load();
      }).catch(function () { b.disabled = false; b.textContent = '✅ Birlashtirish'; });
    };
  }
  // ---- admin: ro'yxatda belgilab bir nechta masalani o'chirish /*PZBULK*/
  var bulk = { on: false, sel: {} };
  function bulkUi() {
    if (!S.admin) return;
    if (!document.getElementById('pzBulkCss')) {
      var cs = document.createElement('style'); cs.id = 'pzBulkCss';
      cs.textContent = '.pzBk{position:relative;outline:2px dashed rgba(255,255,255,.25);outline-offset:-2px}.pzBk.on{outline:3px solid #ff5a5a;background:rgba(179,52,48,.28)!important}' +
        '.pzBk .pzCb{position:absolute;left:-6px;top:-6px;z-index:3;width:30px;height:30px;border-radius:9px;background:#141040;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff}.pzBk.on .pzCb{background:#e04a4a;border-color:#e04a4a}' +
        '#pzBar{position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 74px);z-index:100005;display:flex;gap:8px;align-items:center;padding:10px;border-radius:16px;background:#141040;box-shadow:0 6px 24px rgba(0,0,0,.6)}' +
        '#pzBar b{flex:1;font-size:16px}#pzBar button{border:0;border-radius:12px;padding:10px 12px;font-size:15px;font-weight:700;color:#fff;background:#352d86}#pzBar #pzBDel{background:#b33430}#pzBar #pzBDel[disabled]{opacity:.45}';
      document.head.appendChild(cs);
    }
    var row = ov.querySelector('#pzAdd'), old = document.getElementById('pzBar');
    if (old) old.remove();
    if (row && !ov.querySelector('#pzSelB')) {
      var b = document.createElement('button'); b.id = 'pzSelB'; b.setAttribute('style', BG); b.textContent = bulk.on ? '✖ Tanlashni yopish' : '☑️ Tanlash';
      b.onclick = function () { bulk.on = !bulk.on; bulk.sel = {}; items(); };
      row.parentNode.appendChild(b);
      var rn = document.createElement('button'); rn.id = 'pzRenB'; rn.setAttribute('style', BG); rn.textContent = '🔢 Raqamlash';
      rn.onclick = function () {
        if (!confirm('Bu ro‘yxatdagi masalalar 1, 2, 3… tartibida qayta raqamlansinmi?')) return;
        rn.disabled = true; rn.textContent = '⏳';
        api('/api/puzzle/renum', { folder: curFo || '', level: curLv || 1 }).then(function () { load(); }).catch(function () { rn.disabled = false; rn.textContent = '🔢 Raqamlash'; });
      };
      if (curLv !== 9) row.parentNode.appendChild(rn);   // aralashda (turli qiyinlik) raqamlash yo'q
    }
    if (!bulk.on) return;
    var cards = ov.querySelectorAll('[data-i]');
    Array.prototype.forEach.call(cards, function (c) {
      var p = S.list[Number(c.getAttribute('data-i'))]; if (!p) return;
      c.classList.add('pzBk'); c.classList.toggle('on', !!bulk.sel[p.id]);
      var cb = document.createElement('span'); cb.className = 'pzCb'; cb.textContent = bulk.sel[p.id] ? '✓' : ''; c.insertBefore(cb, c.firstChild);
    });
    if (!ov.__bulkCap) {
      ov.__bulkCap = 1;
      ov.addEventListener('click', function (e) {
        if (!bulk.on) return;
        var c = e.target.closest('[data-i]'); if (!c || !ov.contains(c)) return;
        e.stopPropagation(); e.preventDefault();
        var p = S.list[Number(c.getAttribute('data-i'))]; if (!p) return;
        if (bulk.sel[p.id]) delete bulk.sel[p.id]; else bulk.sel[p.id] = 1;
        c.classList.toggle('on', !!bulk.sel[p.id]); var cb = c.querySelector('.pzCb'); if (cb) cb.textContent = bulk.sel[p.id] ? '✓' : '';
        upd();
      }, true);
    }
    var bar = document.createElement('div'); bar.id = 'pzBar';
    bar.innerHTML = '<b id="pzBN"></b><button id="pzBAll">Hammasi</button><button id="pzBDel">🗑 O‘chirish</button>';
    document.body.appendChild(bar);
    function visIds() { return Array.prototype.map.call(ov.querySelectorAll('[data-i]'), function (c) { var p = S.list[Number(c.getAttribute('data-i'))]; return p && p.id; }).filter(Boolean); }
    function upd() {
      var n = Object.keys(bulk.sel).length, e = document.getElementById('pzBN'), d = document.getElementById('pzBDel');
      if (e) e.textContent = 'Tanlandi: ' + n; if (d) d.disabled = !n;
      var all = document.getElementById('pzBAll'), v = visIds(); if (all) all.textContent = v.length && v.every(function (id) { return bulk.sel[id]; }) ? 'Hech biri' : 'Hammasi';
    }
    upd();
    bar.querySelector('#pzBAll').onclick = function () {
      var v = visIds(), allOn = v.length && v.every(function (id) { return bulk.sel[id]; });
      v.forEach(function (id) { if (allOn) delete bulk.sel[id]; else bulk.sel[id] = 1; });
      items();
    };
    bar.querySelector('#pzBDel').onclick = function () {
      var ids = Object.keys(bulk.sel); if (!ids.length) return;
      if (!confirm(ids.length + ' ta masala o‘chirilsinmi? Buni qaytarib bo‘lmaydi.')) return;
      this.disabled = true; this.textContent = '⏳';
      api('/api/puzzle/del', { ids: ids }).then(function (d) {
        bulk.on = false; bulk.sel = {}; var x = document.getElementById('pzBar'); if (x) x.remove();
        if (d && d.ok) { S.list = S.list.filter(function (p) { return ids.indexOf(p.id) < 0; }); }
        load();
      }).catch(function () { alert('Server bilan aloqa yo‘q'); upd(); });
    };
  }
  // ro'yxatdan chiqilganda pastki panelni olib tashlaymiz
  setInterval(function () { var x = document.getElementById('pzBar'); if (x && (!ov || !document.body.contains(ov) || !ov.querySelector('.pzBk'))) x.remove(); }, 400);
  function items() { window.__pzMapKey = undefined; window.pzLeft = window.pzLeft || function (ms) { var d = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5); return d > 0 ? d + ' kun ' + hh + ' soat' : Math.max(1, hh) + ' soat'; }; if (!document.getElementById('pzCss2')) { var _s2 = document.createElement('style'); _s2.id = 'pzCss2'; _s2.textContent = '.pzSpW{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;transform:scaleY(.7)}.pzSpW i{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;background:#fff3c4;border-radius:50%;box-shadow:0 0 10px 4px #ffd86b;opacity:0;animation:pzSp 3.2s ease-in-out infinite both}@keyframes pzSp{0%{transform:rotate(var(--a)) translateX(var(--r)) scale(.3);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:rotate(calc(var(--a) + 360deg)) translateX(var(--r)) scale(.3);opacity:0}}.pzStars{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:1}.pzStars i{position:absolute;width:3px;height:3px;border-radius:50%;background:#ffe9a0;box-shadow:0 0 6px 1px #ffd86b;opacity:0;animation:pzTw 3s ease-in-out infinite}@keyframes pzTw{0%,100%{opacity:0;transform:translateY(0) scale(.5)}50%{opacity:.9;transform:translateY(-14px) scale(1.2)}}.pzBfs{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:1;overflow:hidden}.pzBf{position:absolute;line-height:1;animation:pzFly 18s ease-in-out infinite}.pzBf b{display:inline-block;font-weight:normal;animation:pzFlap .4s ease-in-out infinite alternate}@keyframes pzFly{0%,100%{transform:translate(0,0) rotate(-8deg)}25%{transform:translate(var(--x1),var(--y1)) rotate(14deg)}50%{transform:translate(var(--x2),var(--y2)) rotate(-10deg)}75%{transform:translate(var(--x3),var(--y3)) rotate(12deg)}}@keyframes pzFlap{from{transform:scaleX(1)}to{transform:scaleX(.3)}}@media (prefers-reduced-motion:reduce){.pzSpW,.pzStars,.pzBfs{display:none}}'; document.head.appendChild(_s2); }
    var h = head('🧩 Masalalar', '<button id="pzTop" style="' + BG + '">🏆 TOP</button>'), shown = 0;
    var _sp2 = ''; if (curFo && !curLv) { for (var _k = 0; _k < 18; _k++) _sp2 += '<i style="--a:' + (_k * 20) + 'deg;--r:' + (60 + (_k % 3) * 28) + 'px;animation-delay:' + (_k * 0.18) + 's"></i>'; _sp2 = '<span class="pzSpW">' + _sp2 + '</span>'; }
    h += '<div style="margin:6px 0 12px;font-weight:bold;position:relative;display:inline-block;padding:4px 14px">' + (curLv === 9 ? 'Aralash masalalar' : curLv ? LV[curLv] : '📁 ' + esc(curFo)) + _sp2 + '</div>';
    if (curFo && !curLv) h += '<div style="margin-bottom:12px">' + (S.link ? '<button id="pzShF" style="' + BS + '">🔗 Guruhga yuborish</button>' : '') + '<button id="pzHall" style="' + BG + '">🎮 O‘yin zaliga</button><button id="pzRk" style="' + BG + '">🏅 Unvonlar</button></div>';
    if (curFo && !curLv && S.promo && Date.now() < S.promo) h += '<div style="font-size:13px;margin:-4px 0 12px;padding:8px 10px;border-radius:10px;background:#2a2560">🎁 Aksiya (' + window.pzLeft(S.promo - Date.now()) + ' qoldi): havolangiz orqali kirgan har bir yangi o‘yinchi masala yechsa, sizga +100 🪙' + (S.inv ? '<br>👥 Taklif qilinganlar: ' + S.inv.total : '') + '</div>';
    if (S.admin) h += '<div style="margin-bottom:12px"><button id="pzAdd" style="' + BS + '">➕ Masala</button>' + (curFo ? '<button id="pzRF" style="' + BG + '">✏️ Nomi</button><button id="pzDF" style="' + BG + '">🗑 Papkani o‘chirish</button>' : '') + '</div>';
    S.list.forEach(function (p, i) {
      if (curLv === 9 ? foOf(p) : curLv ? (lvOf(p) !== curLv || foOf(p)) : foOf(p) !== curFo) return;
      shown++;
      var ok = (S.solved || []).indexOf(p.id) >= 0;
      h += '<div data-i="' + i + '" style="' + CARD + '">' + (S.admin ? '<button data-mv="' + i + '" style="float:right;background:#262b5a;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:14px">📁</button>' : '') + '<b>' + (ok ? '✅ ' : '') + esc(p.title) + (S.admin && (S.reels || []).indexOf(p.id) >= 0 ? ' 🎬' : '') + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + LV[lvOf(p)] + ' · 👥 ' + (p.cnt || 0) + ' · ' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + (p.author ? ' · ✍️ ' + esc(p.author) : '') + '</div></div>';
    });
    if (!shown) h += '<div style="padding:24px;opacity:.7">Bu papkada masala yo‘q</div>';
    if (curFo && !curLv) { var _stz = ''; for (var _q = 0; _q < 22; _q++) _stz += '<i style="left:' + Math.round(Math.random() * 96) + '%;top:' + Math.round(Math.random() * 92) + '%;animation-delay:' + (Math.random() * 3).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 2).toFixed(2) + 's"></i>'; h += '<div class="pzStars">' + _stz + '</div>';
      var _bf = '', _hu = [0, 60, 120, 180, 240, 300, 330], _rr = function (m) { return Math.round((Math.random() * 2 - 1) * m); };
      for (var _b2 = 0; _b2 < 7; _b2++) _bf += '<span class="pzBf" style="left:' + Math.round(5 + Math.random() * 85) + '%;top:' + Math.round(10 + Math.random() * 75) + '%;font-size:' + Math.round(22 + Math.random() * 14) + 'px;--x1:' + _rr(130) + 'px;--y1:' + _rr(110) + 'px;--x2:' + _rr(160) + 'px;--y2:' + _rr(140) + 'px;--x3:' + _rr(130) + 'px;--y3:' + _rr(110) + 'px;animation-duration:' + (14 + Math.random() * 10).toFixed(1) + 's;animation-delay:-' + (Math.random() * 10).toFixed(1) + 's"><b style="filter:hue-rotate(' + _hu[_b2] + 'deg) saturate(1.4)">🦋</b></span>';
      h += '<div class="pzBfs">' + _bf + '</div>'; }
    ov.innerHTML = h;
    on('#pzBack', function () { curLv = 0; curFo = ''; bulk.on = false; bulk.sel = {}; list(); });
    on('#pzTop', pzTop); on('#pzQzP', qzPanel);
    try { bulkUi(); } catch (e) {}
    // masaladan qaytganda ro'yxat oxirgi ochilgan masala yonida tursin
    try {
      var _lid = window.__pzLast;
      if (_lid) {
        var _cs = ov.querySelectorAll('[data-i]'), _el = null;
        for (var _q = 0; _q < _cs.length; _q++) { var _pp = S.list[Number(_cs[_q].getAttribute('data-i'))]; if (_pp && _pp.id === _lid) { _el = _cs[_q]; break; } }
        if (_el) {
          var _go = function () { _el.scrollIntoView({ block: 'center' }); };
          _go(); requestAnimationFrame(_go); setTimeout(_go, 60);
          _el.style.transition = 'box-shadow .3s'; _el.style.boxShadow = '0 0 0 3px #ffcf3f';
          setTimeout(function () { _el.style.boxShadow = ''; }, 1500);
        }
      }
    } catch (e) {}
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
        if (S.admin && !q.et) {
          var qb = document.createElement('button'), qs = function () { var a = qzIn(q.id); qb.textContent = a ? 'Viktorinada' : 'Viktorinaga'; qb.style.background = a ? '#2b8a3e' : '#262b5a'; };
          qb.setAttribute('style', 'float:right;color:#fff;border:0;border-radius:8px;padding:4px 8px;font-size:13px;margin-left:6px'); qs();
          qb.onclick = function (ev) { ev.stopPropagation(); qzTog(q.id, function (d) { if (d.error) alert(d.error); qs(); }); };
          e.insertBefore(qb, e.firstChild);
        }
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
    on('#pzAdd', function () { newPz(curLv === 9 ? 0 : curLv, curLv ? '' : curFo); });
    function rankDlg() {
      var t = (S.inv && S.inv.total) || 0, RK = S.ranks || [], cur = null, nxt = null;
      RK.forEach(function (r) { if (t >= r.n) cur = r; else if (!nxt) nxt = r; });
      var h = head('🏅 Unvonlar');
      h += '<div style="' + CARD + '"><div style="font-size:12px;opacity:.65">JORIY UNVON</div><b style="font-size:20px">' + (cur ? esc(cur.name) : 'Hali unvon yo‘q') + '</b><div style="font-size:13px;margin-top:6px">' + (nxt ? '⬆️ ' + esc(nxt.name) + ' bo‘lish uchun yana ' + (nxt.n - t) + ' ta do‘st kerak' : '🎉 Eng yuqori unvon!') + '</div>' + (nxt ? '<div style="height:8px;border-radius:4px;background:#2c3070;margin-top:8px"><div style="height:8px;border-radius:4px;background:#ffd86b;width:' + Math.min(100, Math.round(t / nxt.n * 100)) + '%"></div></div><div style="text-align:right;font-size:12px;margin-top:4px">' + t + ' / ' + nxt.n + '</div>' : '') + '</div>';
      if (S.promo && Date.now() < S.promo) h += '<div style="font-size:14px;margin:0 0 12px;padding:10px;border-radius:10px;background:#2a2560">⏰ Aksiya tugashiga: <b>' + window.pzLeft(S.promo - Date.now()) + '</b><br>Har bir yangi o‘yinchi uchun +100 🪙</div>';
      else h += '<div style="font-size:13px;opacity:.7;margin-bottom:12px">Aksiya tugagan</div>';
      h += '<div style="font-size:12px;opacity:.65;margin:8px 0">BARCHA UNVONLAR</div>';
      RK.slice().reverse().forEach(function (r) {
        h += '<div style="' + CARD + ';display:flex;justify-content:space-between;align-items:center;opacity:' + (t >= r.n ? 1 : 0.65) + '"><div><b>' + (t >= r.n ? '✅ ' : '') + esc(r.name) + '</b><div style="font-size:12px;opacity:.65">' + r.n + '+ taklif</div></div><b style="color:#ffb84d">' + r.gem + ' 🪙</b></div>';
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
        var nb = document.querySelector('#nvBar button[data-k="pl"]'); if (nb) { nb.click(); return; }
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
      e.onclick = function () { window.__pzMapKey = undefined; play(S.list[Number(e.getAttribute('data-i'))]); };
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
    // ♔ etyud: yechim yo'llari (A/B/C variantlar) birinchi ochilganda yuklanadi
    if (p && p.et && !(p.sols && p.sols.length)) {
      var _orig = S.list.filter(function (x) { return x.id === p.id; })[0];
      if (_orig && _orig.sols) { p = _orig; } else {
        ov.innerHTML = head('🧩 ' + esc(p.title)) + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>'; on('#pzBack', list);
        fetch('/api/etudes/pz/' + encodeURIComponent(p.id), { headers: { 'x-init-data': (tg && tg.initData) || '' } }).then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.sols || !d.sols.length) { ov.innerHTML = head('🧩 ' + esc(p.title)) + '<div style="padding:30px">Yuklab bo‘lmadi</div>'; on('#pzBack', list); return; }
          if (_orig) { _orig.sols = d.sols; _orig.sol = d.sols[0]; }
          play(Object.assign({}, p, { sols: d.sols, sol: d.sols[0] }));
        }).catch(function () { ov.innerHTML = head('🧩 ' + esc(p.title)) + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', list); });
        return;
      }
    }
    window.__pzLast = p && p.id; /*PZBACKPOS*/
    p = Object.assign({}, p);
    var lines = ((p.sols && p.sols.length) ? p.sols : [p.sol]).map(function (l) { return l.slice(); });
    if (p.et) { var _u = {}; lines = lines.filter(function (l) { var k = JSON.stringify(l); if (_u[k]) return false; _u[k] = 1; return true; }); }
    var alive = lines.map(function (_, i) { return i; });
    // ♔ etyud: har bir variant (qoraning har xil himoyasi) alohida yechiladi — hammasi tugagach "yechildi"
    var multi = !!p.et && lines.length > 1, doneL = {}, hist = [];
    // kitobdan tashqari (lekin to'g'ri) yo'l: server baza/dvigatel bilan tekshiradi, qora javobini ham o'sha beradi
    var free = false, fst = null, fn = 0, ext = false;
    // 🧩 chala kombinatsiya: kitob masalasida yechim tugagach, o'yinchi donalarni urib olguncha davom etadi (server: pzext.js)
    var extOk = !p.et && curBook && curBook.kind !== 'e' && curBook.arr.some(function (x) { return x.id === p.id; }) && (p.goal || 'win') !== 'draw' && !/^Petrova/.test(p.folder || '');   // Petrova — qadamma-qadam endshpil darslari, kombinatsiya emas
    function matN(b, sd) { var n = 0; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var v = b[r][c]; if (sideOf(v) === sd && !(b.dead || []).some(function (x) { return x[0] === r && x[1] === c; })) n += v > 2 ? 2 : 1; } return n; }
    var OPP = p.side === 'w' ? 'b' : 'w';
    function took() { return { got: matN(p.board, OPP) - matN(g.b, OPP), gave: matN(p.board, p.side) - matN(g.b, p.side) }; }
    function combDone() {
      if (!matN(g.b, OPP)) return true;
      var t = took(), lg = legal(g.b, g.side, g.forced), cap = lg.some(function (s) { return !!s.x; });
      return t.got - t.gave >= 1 && !cap;
    }
    function extMsg(pre) { var t = took(); return (pre ? pre + ' · ' : '') + 'Olingan: ' + t.got + ' · berilgan: ' + t.gave; }
    function extStart() {
      ext = true; free = true; fn = 0;
      msg = '✅ Kombinatsiya to‘g‘ri! Endi uni oxiriga yetkazing — donalarni urib oling (raqib: King Kong) · ' + extMsg(); draw();
      if (g.side === p.side) return;
      busy = true; var mt = myT;
      fetch('/api/pzext/judge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': (tg && tg.initData) || '' }, body: JSON.stringify({ id: p.id, mode: 'start', b: to64(g.b) }) })
        .then(function (r) { return r.json(); }).catch(function () { return null; }).then(function (d) {
          if (mt !== window.__pzTok) return;
          if (!d || !d.keep) { busy = false; ext = false; free = false; return freeDone(); }   // server javob bermasa — eskicha yakunlanadi
          if (d.solved && !d.reply) { busy = false; return freeDone(); }
          setTimeout(function () { applyReply(d.reply || []); busy = false; if (d.solved || combDone()) return freeDone(); msg = '✅ Kombinatsiya to‘g‘ri! Endi uni oxiriga yetkazing — donalarni urib oling · ' + extMsg(); draw(); }, 450);
        });
    }
    function applyReply(rp) { for (var i = 1; i < rp.length; i++) { var a = rp[i - 1], z = rp[i], s3 = findStep(legal(g.b, g.side, g.forced), [a >> 3, a & 7], [z >> 3, z & 7]); if (!s3) break; g = adv(g, s3); } }
    function to64(b8) { var o = []; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var v = b8[r][c]; o.push(v === 1 ? 1 : v === 3 ? 2 : v === 2 ? -1 : v === 4 ? -2 : 0); } return o; }
    function judgeMove() {
      busy = true; sel = null; msg = '⏳ Tekshirilmoqda…'; draw();
      var mt = myT, f0 = fst;
      fetch(ext ? '/api/pzext/judge' : '/api/etudes/judge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': (tg && tg.initData) || '' }, body: JSON.stringify({ id: p.id, b: to64(f0.b), path: f0.path, n: fn }) })
        .then(function (r) { return r.json(); }).catch(function () { return { keep: false, why: 'net' }; }).then(function (d) {
          if (mt !== window.__pzTok) return;
          fst = null;
          if (!d || !d.keep) {
            g = { b: f0.b, side: p.side, forced: null }; busy = false; errs++; markFail(); penErr();
            var why = d && d.why;
            if (ext && why === 'worse') { msg = '❌ Bu yurish kombinatsiyani buzadi — boshqasini sinang (xato: ' + errs + ') · ' + extMsg(); draw(); return; }
            msg = (why === 'busy' || why === 'eng' || why === 'err' || why === 'net') ? '⏳ Tekshirib bo‘lmadi — qaytadan urinib ko‘ring' : '❌ Noto‘g‘ri' + (why === 'loss' ? ' — bu yurishdan keyin oq yutqazadi' : why === 'draw' ? ' — bu yurish faqat durangga olib keladi' : ', boshqa yurishni sinang') + ' (xato: ' + errs + ')';
            draw(); return;
          }
          var was = free; free = true; fn++;
          if (d.solved && !(ext && d.reply)) { busy = false; return freeDone(); }
          msg = ext ? extMsg('✅ To‘g‘ri') : was ? '✅ To‘g‘ri' : '✅ To‘g‘ri — kitobdagidan boshqa yo‘l, natija saqlanadi'; draw();
          setTimeout(function () {
            if (mt !== window.__pzTok) return;
            var rp = d.reply || [];
            for (var i = 1; i < rp.length; i++) { var a = rp[i - 1], z = rp[i], s3 = findStep(legal(g.b, g.side, g.forced), [a >> 3, a & 7], [z >> 3, z & 7]); if (!s3) break; g = adv(g, s3); }
            busy = false; if (ext && (d.solved || combDone())) return freeDone(); if (ext) msg = extMsg('✅ To‘g‘ri · sizning navbatingiz'); draw();
          }, 450);
        });
    }
    function freeDone() { if (alive.length) doneL[alive[0]] = 1; free = false; fn = 0; if (ext) { var t = took(); window.__pzExtMsg = 'Kombinatsiya yakunlandi! ' + t.gave + ' ta berdingiz, ' + t.got + ' ta oldingiz'; } afterDone(); }
    function nDone() { return Object.keys(doneL).length; }
    p.sol = lines[0];
    var g = { b: copy(p.board), side: p.side, forced: null }, idx = 0, sel = null, msg = '', done = false, busy = false;
    var _fs = (S.settings || {})[foOf(p)] || {}, tLim = _fs.time || 0, t0 = Date.now(), errs = 0, hints = 0, failSent = false, tOut = false, fin = -1, myT = window.__pzTok = (window.__pzTok || 0) + 1;
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
      // dama urganda boshqa (lekin teng kuchli) katakka tushsa ham qabul qilamiz: o'sha donani urgan va yechimning davomi ham to'g'ri bo'lsa /*ALTLAND*/
      if (!keep.length && st.x) alive.forEach(function (i) {
        if (keep.length) return;
        var x = lines[i][idx]; if (!x || x[0] !== st.f[0] || x[1] !== st.f[1]) return;
        var es = findStep(legal(g.b, g.side, g.forced), [x[0], x[1]], [x[2], x[3]]);
        if (!es || !es.x || es.x[0] !== st.x[0] || es.x[1] !== st.x[1]) return;
        var gg = adv(g, st), ok = true;
        for (var k = idx + 1; k < lines[i].length; k++) { var y = lines[i][k], s2 = findStep(legal(gg.b, gg.side, gg.forced), [y[0], y[1]], [y[2], y[3]]); if (!s2) { ok = false; break; } gg = adv(gg, s2); }
        if (ok) { lines[i][idx] = want; keep.push(i); m = want; }
      });
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
      if (multi) { var c2 = c.filter(function (i) { return !doneL[i]; }); if (c2.length) c = c2; }
      var x = lines[c[Math.floor(Math.random() * c.length)]][idx];
      alive = c.filter(function (j) { return same(lines[j][idx], x); });
      p.sol = lines[alive[0]];
      return x;
    }
    function draw() {
      var tg2 = [];
      if (sel) tg2 = legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === sel[0] && s.f[1] === sel[1]; }).map(function (s) { return s.t; });
      if (!document.getElementById('pzCss')) { var _st = document.createElement('style'); _st.id = 'pzCss'; _st.textContent = '.pzWrap{position:relative;display:inline-block;margin:18px 0 10px}.pzBig{position:relative;font-size:21px!important;padding:18px 38px!important;border-radius:18px!important;font-weight:700;animation:pzGlow 1.5s ease-in-out infinite}.pzO{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;transform:scaleY(.5)}.pzO i{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#ffd86b;box-shadow:0 0 8px #ffd86b;animation:pzOrb 3s linear infinite}@keyframes pzOrb{from{transform:rotate(0deg) translateX(125px)}to{transform:rotate(360deg) translateX(125px)}}@keyframes pzGlow{0%,100%{box-shadow:0 0 14px #6b5cf0}50%{box-shadow:0 0 34px #a99bff}}'; document.head.appendChild(_st); }
      var _bi = curBook ? curBook.arr.findIndex(function (x) { return x.id === p.id; }) : -1;   // kitobda: nom ham kitob raqami bilan
      var h = head('🧩 ' + (_bi >= 0 ? (curBook.kind === 'e' ? esc(curBook.title) : curBook.n + '-kitob') + ' · ' + (_bi + 1) + '-masala' : esc(p.title)));
      h += '<div style="margin-bottom:8px">' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ' + (_bi >= 0 && curBook.kind !== 'e' ? (curBook.kind === 's' ? 'Sodda' : 'Murakkab') : LV[p.level]) + (multi ? ' · 🔀 ' + nDone() + ' / ' + lines.length + ' variant' : '') + '</div>' + '<div id="pzTm" style="font-size:20px;font-weight:bold;margin-bottom:6px">' + tmText() + '</div>';
      h += boardHtml(g.b, { sel: sel, hl: tg2 });
      h += '<div style="min-height:28px;margin:10px 0;font-size:16px">' + msg + '</div>';
      var _a = sibs(), _i = _a.findIndex(function (x) { return x.id === p.id; }), _day = isDay();
      if (_day) {
        var _sv = S.solved || [], _dn = _a.filter(function (x) { return _sv.indexOf(x.id) >= 0; }).length;
        h += '<div style="margin:4px 0 8px;font-weight:800;color:#ffcf3f">📗 Kunlik masala ' + (_i + 1) + ' / ' + _a.length + ' · ✅ ' + _dn + ' yechildi</div>';
        if (_dn >= _a.length && done) h += '<div style="margin:6px auto 10px;max-width:420px;padding:14px;border-radius:16px;background:linear-gradient(90deg,#16a34a,#0f8a63);font-weight:800;font-size:16px">🎉 Bugungi ' + _a.length + ' ta masala tugadi!<br><small style="font-weight:600;opacity:.9">Ertaga Petrova kitobidan yangi masalalar</small></div><button id="pzDayEnd" style="' + BS + '">📋 Vazifalarga qaytish</button>';
      } else
      h += '<div style="margin:4px 0 8px;opacity:.75">' + (_i + 1) + ' / ' + _a.length + '</div>';
      if (_a.length > 1 && !(_day && _i >= _a.length - 1) && window.__pzMapKey !== '') h += done ? ('<div style="text-align:center"><span class="pzWrap"><span class="pzO">' + [0,1,2,3,4,5,6,7].map(function (k) { return '<i style="animation-delay:-' + (k * 0.375) + 's"></i>'; }).join('') + '</span><button id="pzNext" class="pzBig" style="' + BS + '">➡️ Keyingi masala</button></span></div>') : '<button id="pzNext" style="' + BG + '">➡️ Keyingi</button>';
      if (_i > 0) h += '<button id="pzPrev" style="' + BG + '">⬅️ Oldingi</button>';
      h += '<button id="pzR" style="' + BG + '">🔄 Qayta</button><button id="pzH" style="' + BS + '">💡 Ko‘rsatma</button><button id="pzXR" style="' + BG + '">Xato bor</button>';
      if (S.link) h += '<button id="pzS" style="' + BS + '">📤 Yuborish</button>'; if (S.admin && !p.et) h += '<button id="pzE" style="' + BS + '">🛠 Tahrirlash</button>'; if (S.admin && !p.et) h += '<button id="pzN" style="' + BG + '">✏️ Nomi</button>'; if (S.admin && !p.et) h += '<button id="pzD" style="' + BG + '">🗑 O‘chirish</button>'; if (S.admin && !p.et) h += '<button id="pzQz" style="' + BG + (qzIn(p.id) ? ';background:#2b8a3e' : '') + '">' + (qzIn(p.id) ? 'Viktorinada' : 'Viktorinaga') + '</button>'; if (S.admin) h += '<button id="pzRl" style="' + BG + '">🎬 Reel' + ((S.reels || []).indexOf(p.id) >= 0 ? ' ✓' : '') + '</button>';
      ov.innerHTML = h;
      on('#pzBack', function () { dayIds = null; if (window.__advRet) { var _ar = window.__advRet; window.__advRet = null; return advOpen({ k: _ar.k }); } if (window.__pzChkBack) { window.__pzChkBack = 0; return pzChkView(); } if (curBook && curBook.arr.some(function (x) { return x.id === p.id; })) return bookView(curBook); list(); });
      on('#pzDayEnd', function () { dayIds = null; close(); if (window.dqOpen) window.dqOpen(); });
      on('#pzXR', function () { pzReport(p); });
      on('#pzPrev', function () { var a = sibs(), i = a.findIndex(function (x) { return x.id === p.id; }); if (i > 0) play(a[i - 1]); });
      on('#pzNext', goNext);
      on('#pzR', function () { play(p); });
      on('#pzE', function () { window.__pzTok = (window.__pzTok || 0) + 1; editor(p); });
      on('#pzS', function () {
        var u = S.link + '?startapp=pz_' + p.id, t = '🧩 Shashka masalasi: ' + p.title;
        var sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t);
        if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
      });
      on('#pzQz', function () { qzTog(p.id, function (d) { msg = d.error ? d.error : d.on ? 'Viktorina navbatiga qo‘shildi (' + d.pos + '-o‘rin)' : 'Viktorina navbatidan olindi'; draw(); }); });
      on('#pzRl', function () {   // 🎬 shu masaladan Instagram Reel videosi — bot Telegram'ga yuboradi
        if ((S.reels || []).indexOf(p.id) >= 0 && !confirm('Bu masaladan Reel avval yasalgan. Yana yasalsinmi?')) return;
        msg = '⏳ So‘rov yuborilmoqda…'; draw();
        api('/api/reel', { id: p.id }).then(function (d) {
          if (d && d.ok) { S.reels = S.reels || []; if (S.reels.indexOf(p.id) < 0) S.reels.push(p.id); msg = '🎬 Video tayyorlanmoqda (~' + (d.dur || 30) + ' s) — 1–3 daqiqada bot Telegram’da yuboradi'; }
          else msg = '⚠️ ' + ((d && d.error) || 'Video yasab bo‘lmadi');
          draw();
        }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
      });
      on('#pzN', function () {
        var n = prompt('Yangi nom:', p.title); if (n === null) return; n = n.trim(); if (!n) return;
        api('/api/puzzle/rename', { id: p.id, title: n }).then(function (d) {
          if (d && d.ok) { p.title = d.title; S.list.forEach(function (x) { if (x.id === p.id) x.title = d.title; }); msg = '✅ Nom o‘zgardi'; }
          else msg = '⚠️ Nom o‘zgarmadi';
          draw();
        });
      });
      on('#pzH', function () { if (ext) { msg = '💡 Urish majburiy — urish bo‘lsa uring, bo‘lmasa raqib donalarini olishga yo‘l oching · ' + extMsg(); draw(); return; } if (free) { msg = '💡 Siz kitobdagidan boshqa yo‘ldasiz — o‘zingiz davom eting yoki «Qayta» bosing'; draw(); return; } if (!done && !busy && g.side === p.side && p.sol[idx]) { hints++; markFail(); sel = [p.sol[idx][0], p.sol[idx][1]]; draw(); } });
      on('#pzD', function () {
        if (!confirm('Masala o‘chirilsinmi?')) return;
        api('/api/puzzle/del', { id: p.id }).then(function () { load(); });
      });
      bindBoard(tap);
    }
    function isDay() { return !!(dayIds && dayIds.indexOf(p.id) >= 0); }
    function sibs() { if (window.__advRet && window.__advRet.arr && window.__advRet.arr.some(function (x) { return x.id === p.id; })) return window.__advRet.arr.slice(); if (curBook && curBook.arr.some(function (x) { return x.id === p.id; })) return curBook.arr.slice(); if (isDay()) return dayIds.map(function (id) { return S.list.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean); var f = foOf(p); return S.list.filter(function (x) { return foOf(x) === f; }).sort(function (x, y) { return (x.no || 0) - (y.no || 0); }); }
    function goNext() { if (_fs.lock && !done && !S.admin && (S.solved || []).indexOf(p.id) < 0) { msg = '🔒 Avval shu masalani yeching'; draw(); return; }
      var inBk = !S.admin && (S.solved || []).indexOf(p.id) < 0 && ((curBook && curBook.arr.some(function (x) { return x.id === p.id; })) || (window.__advRet && window.__advRet.arr && window.__advRet.arr.some(function (x) { return x.id === p.id; })));
      if (inBk) { msg = '🔒 Avval shu masalani yeching'; draw(); return; }
      var a = sibs(), i = a.findIndex(function (x) { return x.id === p.id; }), sv = S.solved || [], n = a.length, j, k;
      
      if (i < n - 1) return play(a[i + 1]);
      msg = isDay() ? '📗 Bu bugungi oxirgi masala — qolganlari ertaga' : '🏁 Bu papkadagi oxirgi masala'; draw();
    }
    window.pzFan = window.pzFan || (function () {
      var A = null;
      function c() { if (!A) A = new (window.AudioContext || window.webkitAudioContext)(); if (A.state === 'suspended') A.resume(); return A; }
      document.addEventListener('pointerdown', function () { try { c(); } catch (e) {} }, true);
      function n(f, t, d, g) { var a = c(), o = a.createOscillator(), v = a.createGain(), t0 = a.currentTime + t; o.type = 'triangle'; o.frequency.setValueAtTime(f, t0); v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(v); v.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.05); }
      return function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (x, i) { n(x, i * 0.1, 0.35, 0.3); }); n(1318.5, 0.42, 0.5, 0.22); };
    })();
    function penErr() { if (!p || !p.id) return; try { api('/api/puzzle/err', { id: p.id }).catch(function () {}); } catch (e) {} }
    function markFail() { if (failSent || done) return; failSent = true; api('/api/puzzle/fail', { id: p.id }); }   // birinchi xato/ko'rsatma — bu masala uchun tanga yopiladi
    function solved() { if (tOut) return; try { window.pzFan(); } catch (e) {} var _el = pzEl(), _er = errs; fin = _el;
      done = true; msg = '🎉 Masala yechildi!'; draw();
      api('/api/puzzle/solved', { id: p.id, time: _el, errs: _er, hints: hints, ref: window.__pzRef || '', refP: window.__pzRefP || '' }).then(function (d) {
        if (d && d.stars) { S.stars = S.stars || {}; S.stars[p.id] = Math.max(S.stars[p.id] || 0, d.stars); msg += ' <span style="color:#fbbf24">' + '★★★'.slice(0, d.stars) + '<span style="opacity:.3">' + '★★★'.slice(d.stars) + '</span></span>'; }
        if (window.__pzExtMsg) { msg += '<div style="font-size:14px;margin:4px 0;color:#86efac">' + window.__pzExtMsg + '</div>'; window.__pzExtMsg = ''; }
        if (d && d.gain) msg += ' +' + d.gain + ' 🪙'; else if (d && d.noCoin) msg += '<div style="font-size:13px;opacity:.8;margin-top:4px">' + (d.order === false ? 'Tartib buzilgan: tanga berilmadi, yulduz yoziladi' : 'Xato yoki ko‘rsatma bo‘lgani uchun tanga berilmadi') + '</div>';
        msg += ' · ⏱ ' + _el + ' s · xato: ' + _er;
        if (d && d.best) { S.best = S.best || {}; S.best[p.id] = d.best; msg += ' · 🏅 eng yaxshi: ' + d.best + ' s'; }
        if ((S.solved || []).indexOf(p.id) < 0) S.solved.push(p.id);
        if (window.__advRet && window.spAdv) { var _ar2 = window.__advRet; try { window.spAdv.solved(p, d, _ar2, function (x) { msg += x; draw(); }, function () { return myT === window.__pzTok && ov && document.body.contains(ov) && done && window.__advRet === _ar2; }); } catch (e) {} }
        if (window.__pzMapKey === '' && !isDay()) msg += '<div style="margin-top:8px;font-size:14px;opacity:.85">🗺 Xaritaga qaytilmoqda — qahramon keyingi masalaga yo‘l oladi…</div>';
        draw();
        // 🗺 xaritaga chiqib, odamcha keyingi masalaga yurib boradi
        setTimeout(function () {
          if (myT !== window.__pzTok || isDay() || window.__pzMapKey !== '' || !ov || !document.body.contains(ov) || !done) return;   // faqat xaritadan ochilganda
          window.__pzTok = (window.__pzTok || 0) + 1;
          window.__pzAuto = 1; hub = 0; curLv = 0; curFo = window.__pzMapKey != null ? window.__pzMapKey : foOf(p); if (curFo === '' && window.__pzMapKey === '') view = 'map'; list();
        }, 2200);
      });
    }
    function lineDone() {
      // yechim oxirgi oq yurish bilan tugaydi — qora yurmaydi (chala kombinatsiya davomi o'chirildi; qaytarish: shu qatorni tiklang)
      // if (extOk && !ext && !combDone()) return extStart();
      alive.forEach(function (i) { if (lines[i].length === idx) doneL[i] = 1; });
      afterDone();
    }
    function afterDone() {
      var left = lines.map(function (_, i) { return i; }).filter(function (i) { return !doneL[i]; });
      if (!multi || !left.length) return solved();
      // keyingi variant: o'ynalgan yo'l bilan eng uzun umumiy boshlanishga qaytamiz (qora boshqacha javob beradigan joy)
      var k = -1; left.forEach(function (i) { var j = 0; while (j < hist.length && j < lines[i].length && same(lines[i][j], hist[j])) j++; if (j > k) k = j; });
      msg = '✅ Variant ' + nDone() + ' / ' + lines.length + ' yechildi! Endi qora boshqacha himoyalanadi…'; busy = true; sel = null; draw();
      setTimeout(function () {
        if (myT !== window.__pzTok || done) return;
        var gg = { b: copy(p.board), side: p.side, forced: null };
        for (var t = 0; t < k; t++) { var h = hist[t], s2 = findStep(legal(gg.b, gg.side, gg.forced), [h[0], h[1]], [h[2], h[3]]); if (!s2) break; gg = adv(gg, s2); }
        g = gg; idx = k; hist = hist.slice(0, k);
        alive = left.filter(function (i) { for (var t = 0; t < k; t++) if (!same(lines[i][t], hist[t])) return false; return true; });
        if (!alive.length) alive = left;
        p.sol = lines[alive[0]]; busy = false; msg = '🔀 Variant ' + (nDone() + 1) + ' / ' + lines.length; draw(); next();
      }, 1600);
    }
    function next() {
      if (g.side === p.side || idx >= p.sol.length) return;
      busy = true;
      setTimeout(function () {
        var w = oppPick(), st = findStep(legal(g.b, g.side, g.forced), [w[0], w[1]], [w[2], w[3]]);
        if (!st) { busy = false; msg = '⚠️ Masalada xato'; draw(); return; }
        g = adv(g, st); idx++; busy = false; hist.push(w.slice(0, 4));
        if (idx >= p.sol.length) return lineDone();
        draw(); next();
      }, 500);
    }
    function tap(r, c) {
      if (done || busy || g.side !== p.side) return;
      var lg = legal(g.b, g.side, g.forced), p0 = g.b[r][c];
      if (sel) {
        var st = findStep(lg, sel, [r, c]);
        if (st) {
          if ((p.et || ext) && (free || fst)) { if (!fst) fst = { b: copy(g.b), path: [st.f[0] * 8 + st.f[1]] }; g = adv(g, st); fst.path.push(st.t[0] * 8 + st.t[1]); if (g.forced && g.side === p.side) { sel = [g.forced[0], g.forced[1]]; draw(); return; } return judgeMove(); }
          var w = pick(st);
          if (p.et && !(w && w[0] === st.f[0] && w[1] === st.f[1] && w[2] === st.t[0] && w[3] === st.t[1])) { fst = { b: copy(g.b), path: [st.f[0] * 8 + st.f[1]] }; g = adv(g, st); fst.path.push(st.t[0] * 8 + st.t[1]); if (g.forced && g.side === p.side) { sel = [g.forced[0], g.forced[1]]; draw(); return; } return judgeMove(); }
          if (w && w[0] === st.f[0] && w[1] === st.f[1] && w[2] === st.t[0] && w[3] === st.t[1]) {
            g = adv(g, st); idx++; hist.push(w.slice(0, 4)); sel = (g.forced && g.side === p.side) ? [g.forced[0], g.forced[1]] : null; msg = '✅ To‘g‘ri';
            if (idx >= p.sol.length) return lineDone();
            draw(); next();
          } else { sel = null; errs++; markFail(); penErr(); msg = '❌ Noto‘g‘ri, boshqa yurishni sinang (xato: ' + errs + ')'; draw(); }
          return;
        }
      }
      sel = (p0 && sideOf(p0) === g.side && lg.some(function (s) { return s.f[0] === r && s.f[1] === c; })) ? [r, c] : null;
      draw();
    }
    draw();
  }

  // ---- masala kiritish (faqat admin)
  function editor(src) {
    var b = blank(), tool = 1, side = 'w', title = '', level = (edLv || 1), mode = 'edit', g = null, hist = [], rec = [], recSides = [], sel = null, b0 = null, msg = '', extra = [], edId = null, dirty = false;
    if (src) { /*PZEDIT*/
      edId = src.id; b = copy(src.board); side = src.side; title = src.title || ''; level = [1, 2, 3].indexOf(src.level) >= 0 ? src.level : 1;
      extra = ((src.sols && src.sols.length) ? src.sols : [src.sol]).filter(function (l) { return l && l.length; }).map(function (l) { return l.map(function (x) { return x.slice(); }); });
      b0 = copy(src.board);
    }
    function sync() {
      var t = ov.querySelector('#pzT'); if (t) title = t.value;
      var l = ov.querySelector('#pzL'); if (l) level = Number(l.value);
    }
    function draw() {
      var sc = ov.scrollTop, h, tools = [[1, '⚪'], [2, '⚫'], [3, '⚪♛'], [4, '⚫♛'], [0, '🧽']];
      if (mode === 'edit') {
        h = head(edId ? '🛠 Masalani tahrirlash' : '➕ Yangi masala');
        if (edId) h += '<div style="font-size:14px;margin-bottom:8px;padding:8px 10px;border-radius:10px;background:#1d2250">' + (dirty ? '⚠️ Doska o‘zgardi — yechimni qayta kiriting' : (extra.length ? '✅ Saqlangan yechim: ' + extra.length + ' ta variant. Nom/darajani o‘zgartirib darhol saqlash mumkin yoki yechimni qayta kiriting.' : '⚠️ Yechim yo‘q — kiriting')) + '</div>';
        h += '<div style="font-size:13px;opacity:.7;margin-bottom:8px">Asbobni tanlang, to‘q katakka bosing</div>';
        h += boardHtml(b, {});
        h += '<div style="margin-top:8px">' + tools.map(function (t) { return '<button data-t="' + t[0] + '" style="' + (tool === t[0] ? BS : BG) + '">' + t[1] + '</button>'; }).join('') + '</div>';
        h += '<div>Yuradi: <button data-s="w" style="' + (side === 'w' ? BS : BG) + '">⚪ Oq</button><button data-s="b" style="' + (side === 'b' ? BS : BG) + '">⚫ Qora</button></div>';
        h += '<input id="pzT" maxlength="40" placeholder="Masala nomi" value="' + esc(title) + '" style="width:92%;box-sizing:border-box;margin:8px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
        h += '<div><select id="pzL" style="padding:10px;border-radius:12px;background:#161a3a;color:#fff;border:1px solid #333a80;font-size:15px">' + [1, 2, 3].map(function (i) { return '<option value="' + i + '"' + (level === i ? ' selected' : '') + '>' + LV[i] + '</option>'; }).join('') + '</select></div>';
        h += '<div style="min-height:24px;margin:8px 0;color:#ffb3b3">' + msg + '</div>';
        h += '<button id="pzClr" style="' + BG + '">🧹 Tozalash</button><button id="pzStd" style="' + BG + '">📋 Boshlang‘ich</button><button id="pzRec" style="' + BS + '">▶ Yechimni ' + (edId ? 'qayta ' : '') + 'kiritish</button>' + (edId && !dirty && extra.length ? '<button id="pzQs" style="' + BS + '">💾 Saqlash</button>' : '');
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
        Array.prototype.forEach.call(ov.querySelectorAll('[data-s]'), function (e) { e.onclick = function () { sync(); var ns = e.getAttribute('data-s'); if (ns !== side) dirty = true; side = ns; draw(); }; });
        bindBoard(function (r, c) { if ((r + c) % 2 !== 1) return; sync(); if (b[r][c] !== tool) dirty = true; b[r][c] = tool; msg = ''; draw(); });
        on('#pzClr', function () { sync(); b = blank(); dirty = true; draw(); });
        on('#pzStd', function () { sync(); b = std(); dirty = true; draw(); });
        on('#pzQs', function () { sync(); save(); });
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
      api(edId ? '/api/puzzle/edit' : '/api/puzzle', { id: edId || undefined, folder: edFolder, title: title || 'Masala', level: level, side: side, board: b0, sol: (extra.length ? extra[0] : rec), sols: (rec.length ? extra.concat([rec]) : extra) }).then(function (d) {
        if (d && d.ok) load(); else { msg = '⚠️ Saqlanmadi: ' + ((d && d.error) || ''); draw(); }
      }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    draw();
  }

  window.spPuzzles = function () { dayIds = null; open(); };
  window.spPuzzleOpenId = function (id) { dayIds = null; pending = String(id); open(); };
  window.spPuzzleDaily = function (ids, first) { dayIds = (ids || []).map(String); pending = String(first || dayIds[0] || ''); open(); }; // kunlik vazifa: 5 ta masala
  var _sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (_sp && _sp.indexOf('pz_') === 0) { var _pm = /^pz_([A-Za-z0-9_]+?)(?:-r(\d{3,15}))?$/.exec(_sp); pending = _pm ? _pm[1] : _sp.slice(3); if (_pm && _pm[2]) { window.__pzRef = _pm[2]; window.__pzRefP = _pm[1]; } setTimeout(open, 700); }   // 📤 kanal: pz_<id>-r<taklif qilgan>
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
  try { var _c0 = localStorage.getItem('spEqIdC'); if (window.spEqId === undefined && _c0) window.spEqId = _c0; } catch (e) {} var ov = null, S = { list: [], owned: [], equipped: '', diamonds: 0, admin: false, link: '' }, tab = 'app', msg = '', form = null; try { var _c = localStorage.getItem('spShopCss'); if (_c && !document.getElementById('spShopCss')) { var _s = document.createElement('style'); _s.id = 'spShopCss'; _s.textContent = _c; document.head.appendChild(_s); } } catch (e) {}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
  }
  function imgUrl(id, k) { return '/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + k; }
  function applyEq() {
    var o = document.getElementById('spShopCss'); if (o) o.remove();
    var eqId = S.equipped === '-' ? '' : (S.equipped || S.def || ''); window.spEqId = eqId; try { localStorage.setItem('spEqIdC', eqId); } catch (e) {} try { window.dispatchEvent(new Event('spEq')); } catch (e) {} if (!eqId) { try { localStorage.removeItem('spShopCss'); } catch (e) {} } if (!eqId || !S.list.some(function (x) { return x.id === eqId; })) return;
    var id = eqId, B = 'html body #board[data-th][data-ps] .sq .pc';
    var css = B + '::before,' + B + '::after{display:none!important}'
      + B + '{background-color:transparent!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 3px 2px #0007)}'
      + B + '.w{background-image:url("' + imgUrl(id, 'w') + '")!important}'
      + B + '.b{background-image:url("' + imgUrl(id, 'b') + '")!important}'
      + B + '.w.k{background-image:url("' + imgUrl(id, 'wk') + '")!important}'
      + B + '.b.k{background-image:url("' + imgUrl(id, 'bk') + '")!important}';
    css += css.split(B).join('html body .cell.sq .pc'); try { localStorage.setItem('spShopCss', css); } catch (e) {} var st = document.createElement('style'); st.id = 'spShopCss'; st.textContent = css; document.head.appendChild(st);
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
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>🪙 Tosh do‘koni</span><span style="font-size:15px">🪙 ' + (S.diamonds || 0) + ' <button id="shBack" style="' + BG + '">⬅️</button></span></div>';
  }
  function card(it) {
    var own = S.owned.indexOf(it.id) >= 0 || !!it.def, eq = (S.equipped === '-' ? '' : (S.equipped || S.def)) === it.id;
    var h = '<div style="background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:10px"><b style="font-size:13px">' + esc(it.name) + '</b>';
    if (it.by) h += '<div style="font-size:12px;opacity:.7;margin-top:2px">muallif: ' + esc(it.author || 'o‘yinchi') + '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;aspect-ratio:1;margin:8px 0;border-radius:10px;overflow:hidden">';
    KS.forEach(function (k, i) {
      var dark = (i === 1 || i === 2);
      h += '<div style="background:' + (dark ? '#b58863' : '#f0d9b5') + " center/78% no-repeat url('" + imgUrl(it.id, k) + "')\"></div>";
    });
    h += '</div><div style="font-size:13px;opacity:.8">🪙 ' + it.price + ' · 🛒 ' + (it.sold || 0) + '</div>';
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
    if (tab === 'usr') h += '<button id="shNew" data-usr="1" style="' + BS + '">➕ Yangi dona' + (S.admin ? '' : ' · ' + (S.cost || 600) + ' 🪙') + '</button>';
    if (msg) h += '<div style="margin:8px 0;color:#ffd27a">' + esc(msg) + '</div>';
    if (!items.length) h += '<div style="padding:30px;opacity:.7">' + 'Hozircha dona yo‘q' + '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">' + items.map(card).join('') + '</div>';
    ov.innerHTML = h;
    ov.querySelector('#shBack').onclick = close;
    var nb = ov.querySelector('#shNew'); if (nb) nb.onclick = function () { form = { name: '', price: '150', pics: {}, usr: !!nb.getAttribute('data-usr') }; msg = ''; draw(); };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-tab]'), function (e) { e.onclick = function () { tab = e.getAttribute('data-tab'); msg = ''; draw(); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-a]'), function (e) { e.onclick = function () { act(e.getAttribute('data-a'), e.getAttribute('data-id')); }; });
  }
  function reload() { return api('/api/shop').then(function (d) { if (!d.error) merge(d); }); }
  function act(a, id) {
    var it = S.list.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (a === 'buy') {
      if (!confirm(it.name + ' donasini ' + it.price + ' 🪙 ga sotib olasizmi?')) return;
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
      var u = S.link + '?startapp=shop_' + id, sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent('🪙 Shashka donasi: ' + it.name);
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
    h += '<input id="fP" type="number" min="0" placeholder="Narxi (🪙)" value="' + esc(form.price) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
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
    var pay = form.usr && !S.admin;
    if (form.usr) h += '<div style="margin:6px 0 10px;font-size:13px;color:#ffd27a">' + (pay ? 'Yaratish ' + (S.cost || 600) + ' 🪙. ' : '') + 'Har sotuvdan narxning 50% sizga tushadi.</div>';
    h += '<button id="fC" style="' + BG + '">Bekor</button><button id="fS" style="' + BS + '">💾 Saqlash' + (pay ? ' · ' + (S.cost || 600) + ' 🪙' : '') + '</button>';
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
    if (form.usr && !S.admin) {
      if ((S.diamonds || 0) < (S.cost || 600)) { msg = '⚠️ Tanga yetarli emas (' + (S.cost || 600) + ' kerak)'; return draw(); }
      if (!confirm('Tosh yaratish ' + (S.cost || 600) + ' 🪙 turadi. Davom etasizmi?')) return;
    }
    msg = 'Saqlanmoqda…'; draw();
    api('/api/shop/add', { name: nm, price: pr, imgs: pics, usr: !!form.usr }).then(function (d) {
      if (d && d.ok) { form = null; msg = '✅ Dona qo‘shildi'; return reload().then(draw); }
      msg = '⚠️ ' + ((d && d.error) || 'Saqlanmadi'); draw();
    }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
  }

  
window.spShop = open;
  var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (sp && sp.indexOf('shop_') === 0) setTimeout(open, 700);
  else if (initData) setTimeout(function () { api('/api/shop').then(function (d) { if (d && !d.error) merge(d); }).catch(function () {}); }, 900);
})();


;(function () {
  if (window.spBoardOpen) return;
  window.spBoardOpen = function (g) {
    var fallback = function () { if (window.spAnalyze) window.spAnalyze(g); };
    try {
      if (window.spBoard) { window.spBoard(g); return; }
      var s = document.createElement("script");
      s.src = "/board.js?v=" + Date.now();
      s.onload = function () { try { window.spBoard(g); } catch (e) { fallback(); } };
      s.onerror = fallback;
      document.head.appendChild(s);
    } catch (e) { fallback(); }
  };
})();

/* PBLINK — startapp=pb_<kod>: do'st yuborgan Puzzle Battle havolasi */
;(function () {
  var tg = window.Telegram && window.Telegram.WebApp, sp = '';
  try { sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || ''; } catch (e) {}
  if (!/^pb_[a-z0-9]{3,12}$/.test(sp)) return;
  var code = sp.slice(3), key = 'pbDone_' + code;
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
  function ld(src, cb) { var s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s); }
  setTimeout(function () {
    var go = function () { window.spBattle({ join: code }); };
    var need = function () { if (window.spBattle) go(); else ld('/battleview.js?v=5', go); };
    if (window.spPzRules) need(); else ld('/rushview.js?v=4', need);
  }, 1200);
})();

/* PZTLINK — startapp=pzt_<id>: masala turniri havolasi (bot eslatmasidan) */
;(function () {
  var tg = window.Telegram && window.Telegram.WebApp, sp = '';
  try { sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || ''; } catch (e) {}
  if (!/^pzt_[a-z0-9]{3,12}$/.test(sp)) return;
  var id = sp.slice(4), key = 'pztDone_' + id;
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
  function ld(src, cb) { var s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s); }
  setTimeout(function () {
    var go = function () { window.spPzt({ open: id }); };
    var need = function () { if (window.spPzt) go(); else ld('/pztview.js?v=12', go); };
    if (window.spPzRules) need(); else ld('/rushview.js?v=4', need);
  }, 1200);
})();

/* 🦍 ertalabki hisobotdagi «Ko'rib chiqish» tugmasi: /?kk=fix — admin bo'lsa tuzatishlar darhol ochiladi */
;(function () {
  if (!/[?&]kk=fix/.test(location.search)) return;
  var k = 0, iv = setInterval(function () {
    if (window.__isAdmin) { clearInterval(iv); var go = function () { window.kkPanel('fix'); }; if (window.kkPanel) go(); else { var s = document.createElement("script"); s.src = "/kkpanel.js?v=3"; s.onload = go; document.head.appendChild(s); } }
    else if (++k > 80) clearInterval(iv);
  }, 250);
})();
