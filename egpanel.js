// egpanel.js — 🎓 Endshpil maktabi oynasi (window.egOpen)
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mini(b) {   // 32 belgili satrdan kichik doska
    var h = "<div style='display:grid;grid-template-columns:repeat(8,1fr);width:100%;aspect-ratio:1;border-radius:6px;overflow:hidden'>", k = 0;
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var d = (r + c) % 2 === 1, ch = d ? b.charAt(k++) : ".";
      var pc = ch === "." ? "" : "<i style='display:block;width:78%;height:78%;margin:11%;border-radius:50%;background:" + (/w/i.test(ch) ? "#f4f0e6" : "#222") + ";box-shadow:inset 0 0 0 2px " + (ch === ch.toUpperCase() ? "#f5b72b" : "#0004") + "'></i>";
      h += "<div style='background:" + (d ? "#8b5a2b" : "#f0d9b5") + "'>" + pc + "</div>";
    }
    return h + "</div>";
  }
  window.egOpen = function () {
    var tg = window.Telegram && Telegram.WebApp;
    var old = document.getElementById("egOv"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "egOv";
    ov.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:440px;max-height:92%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:22px;padding:16px 14px;font-family:inherit";
    box.innerHTML = "<div style='padding:30px;opacity:.7;text-align:center'>Yuklanmoqda…</div>";
    ov.appendChild(box); document.body.appendChild(ov);
    fetch("/api/endgame", { headers: { "x-init-data": (tg && tg.initData) || "" } }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error) { box.innerHTML = "<div style='padding:30px;text-align:center'>Faqat Telegram orqali kirganda ishlaydi</div>"; return; }
      var all = 0, ok = 0; d.cats.forEach(function (c) { c.list.forEach(function (x) { all++; if (x.ok) ok++; }); });
      var h = "<div style='display:flex;align-items:center;margin-bottom:6px'><b style='font-size:19px'>🎓 Endshpil maktabi</b><span id='egX' style='margin-left:auto;font-size:24px;padding:2px 8px;cursor:pointer'>✕</span></div>" +
        "<div style='font-size:13px;opacity:.75;margin-bottom:10px'>Siz oq bilan o‘ynaysiz, qarshingizda mukammal o‘ynaydigan 🦍 King Kong. Har mashq endshpil bazasida tekshirilgan. Birinchi yechganda <b>+15 🪙</b>.<br>Yechildi: <b>" + ok + "/" + all + "</b></div>";
      d.cats.forEach(function (c) {
        var n = c.list.filter(function (x) { return x.ok; }).length;
        h += "<div style='background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px'><div style='display:flex;justify-content:space-between;margin-bottom:8px'><b style='font-size:15px'>" + esc(c.title) + "</b><span style='font-size:12px;opacity:.7'>" + (c.goal === "draw" ? "🤝 durang qiling" : "🏆 yuting") + " · " + n + "/" + c.list.length + "</span></div><div style='display:grid;grid-template-columns:repeat(3,1fr);gap:8px'>";
        c.list.forEach(function (x, i) {
          h += "<div data-eg='" + esc(x.id) + "' style='position:relative;cursor:pointer;border-radius:8px;border:2px solid " + (x.ok ? "#22c55e" : "#262b5a") + "'>" + mini(x.b) + "<span style='position:absolute;left:4px;top:2px;font-size:11px;font-weight:700;color:#fff;text-shadow:0 1px 2px #000'>" + (i + 1) + "</span>" + (x.ok ? "<span style='position:absolute;right:2px;top:0;font-size:14px'>✅</span>" : "") + "</div>";
        });
        h += "</div></div>";
      });
      box.innerHTML = h;
      box.querySelector("#egX").onclick = function () { ov.remove(); };
      [].forEach.call(box.querySelectorAll("[data-eg]"), function (el) {
        el.onclick = function () { if (!window.lbEtude) return; ov.remove(); window.lbEtude(el.getAttribute("data-eg")); };
      });
    }).catch(function () { box.innerHTML = "<div style='padding:30px;text-align:center'>Server bilan aloqa yo‘q</div>"; });
  };
})();
