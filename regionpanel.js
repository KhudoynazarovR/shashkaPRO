// regionpanel.js — 🗺 Viloyatlar jangi oynasi (window.regOpen)
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var MN = ["", "yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  var CARD = "background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left";
  function initData() { var t = window.Telegram && Telegram.WebApp; return (t && t.initData) || ""; }
  window.regOpen = function (first) {
    var old = document.getElementById("regOv"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "regOv";
    ov.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:420px;max-height:92%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:22px;padding:16px 14px;font-family:inherit;text-align:center";
    box.innerHTML = "<div style='padding:30px;opacity:.7'>Yuklanmoqda…</div>";
    ov.appendChild(box); document.body.appendChild(ov);
    function load() { fetch("/api/region", { headers: { "x-init-data": initData() } }).then(function (r) { return r.json(); }).then(render).catch(function () { box.innerHTML = "<div style='padding:30px'>Server bilan aloqa yo‘q</div>"; }); }
    function pick(d) {
      var h = (first && !d.my ? "<div style='font-size:40px;text-align:center'>🗺</div><b style='font-size:19px;display:block;text-align:center'>Viloyatlar jangiga qo‘shiling!</b><div style='font-size:13px;opacity:.8;margin:6px 0 12px;text-align:center;line-height:1.5'>Har g‘alabangiz viloyatingizga <b>+3 ochko</b> qo‘shadi. Oy oxirida g‘olib viloyat o‘yinchilari <b>300 🪙</b> oladi, qahramonga <b>👑 Premium</b>.<br>Qaysi viloyatdansiz?</div>" : "<b style='font-size:18px'>📍 Viloyatingizni tanlang</b><div style='font-size:13px;opacity:.7;margin:6px 0 12px'>O‘yinlaringiz shu viloyat hisobiga ochko qo‘shadi. " + d.rules.days + " kunda bir marta o‘zgartirish mumkin.</div>") + "<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px'>";
      d.regions.forEach(function (r) { h += "<button data-r='" + esc(r) + "' style='border:1px solid " + (r === d.my ? "#22c55e" : "#262b5a") + ";background:" + (r === d.my ? "#14532d" : "#161a3a") + ";color:#fff;border-radius:12px;padding:11px 6px;font-size:14px'>" + esc(r) + "</button>"; });
      h += "</div><div id='rgE' style='color:#ff6b7f;font-size:13px;min-height:18px;margin-top:8px'></div><button id='rgB' style='width:100%;margin-top:6px;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#3a3f6b'>" + (d.my ? "Orqaga" : "Keyinroq") + "</button>";
      box.innerHTML = h;
      box.querySelector("#rgB").onclick = function () { if (d.my) return render(d); try { localStorage.setItem("spRegLater", String(Date.now() + 3 * 86400e3)); } catch (e) {} ov.remove(); };
      [].forEach.call(box.querySelectorAll("[data-r]"), function (b) {
        b.onclick = function () {
          var r = b.getAttribute("data-r");
          if (r === "Chet el" && d.countries && d.countries.length) return country(d);   // 🌍 davlatni tanlash
          if (d.my && r !== d.my && !confirm("Viloyatni «" + r + "» ga o‘zgartirasizmi? Keyingi o‘zgartirish " + d.rules.days + " kundan keyin.")) return;
          fetch("/api/region", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": initData() }, body: JSON.stringify({ r: r }) })
            .then(function (x) { return x.json(); }).then(function (j) { if (j.error) { box.querySelector("#rgE").textContent = j.error; return; } render(j); });
        };
      });
    }
    function country(d) {
      var h = "<div style='font-size:36px;text-align:center'>🌍</div><b style='font-size:18px;display:block;text-align:center'>Qaysi davlatdasiz?</b><div style='font-size:13px;opacity:.75;margin:6px 0 12px;text-align:center'>Turnirlarda ismingiz yonida bayroq ko‘rinadi</div><div style='display:grid;grid-template-columns:1fr 1fr;gap:8px'>";
      d.countries.forEach(function (c) { h += "<button data-c='" + c[0] + "' style='border:1px solid " + (c[0] === d.myC ? "#22c55e" : "#262b5a") + ";background:" + (c[0] === d.myC ? "#14532d" : "#161a3a") + ";color:#fff;border-radius:12px;padding:10px 6px;font-size:14px;text-align:left'>" + c[1] + " " + esc(c[2]) + "</button>"; });
      h += "</div><div id='rgE' style='color:#ff6b7f;font-size:13px;min-height:18px;margin-top:8px'></div><button id='rgB' style='width:100%;margin-top:6px;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#3a3f6b'>Orqaga</button>";
      box.innerHTML = h;
      box.querySelector("#rgB").onclick = function () { render(d); };
      [].forEach.call(box.querySelectorAll("[data-c]"), function (b) {
        b.onclick = function () {
          if (d.my && d.my !== "Chet el" && !confirm("Viloyatni «Chet el» ga o‘zgartirasizmi? Keyingi o‘zgartirish " + d.rules.days + " kundan keyin.")) return;
          fetch("/api/region", { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": initData() }, body: JSON.stringify({ r: "Chet el", c: b.getAttribute("data-c") }) })
            .then(function (x) { return x.json(); }).then(function (j) { if (j.error) { box.querySelector("#rgE").textContent = j.error; return; } render(j); });
        };
      });
    }
    function render(d) {
      if (d.error) { box.innerHTML = "<div style='padding:30px'>Faqat Telegram orqali kirganda ishlaydi</div>"; return; }
      if (!d.my) return pick(d);
      var mx = Math.max(1, d.table[0] ? d.table[0].p : 1), mm = MN[+d.m.slice(5, 7)] || "";
      var h = "<div style='display:flex;align-items:center;margin-bottom:8px'><b style='font-size:19px'>🗺 Viloyatlar jangi</b><span id='rgX' style='margin-left:auto;font-size:24px;padding:2px 8px;cursor:pointer'>✕</span></div>";
      h += "<div style='" + CARD + ";background:linear-gradient(135deg,#123a2a,#161a3a)'><div style='display:flex;justify-content:space-between;align-items:center'><div><div style='font-size:12px;opacity:.65'>SIZNING VILOYATINGIZ</div><b style='font-size:17px'>📍 " + esc(d.my) + "</b></div>" + (d.canChange ? "<button id='rgC' style='border:1px solid #3a3f6b;background:transparent;color:#a9b0ff;border-radius:10px;padding:6px 10px;font-size:12px'>O‘zgartirish</button>" : "") + "</div>" +
        "<div style='font-size:13px;margin-top:8px'>Bu oy siz qo‘shgan ochko: <b style='color:#7ee08a'>" + d.myPts + "</b>" + (d.myPts < d.rules.min ? " <span style='opacity:.65'>(sovrin uchun kamida " + d.rules.min + ")</span>" : " ✅") + "</div></div>";
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:8px'>🏆 " + mm.toUpperCase() + " OYI JADVALI</div>";
      d.table.forEach(function (x, i) {
        var me = x.r === d.my, pc = Math.round(x.p * 100 / mx);
        h += "<div style='margin:7px 0'><div style='display:flex;justify-content:space-between;font-size:14px" + (me ? ";color:#7ee08a;font-weight:700" : "") + "'><span>" + ((x.p > 0 && ["🥇", "🥈", "🥉"][i]) || (i + 1) + ".") + " " + esc(x.r) + " <span style='font-size:11px;opacity:.6;font-weight:400'>· " + x.n + " kishi</span></span><b>" + x.p + "</b></div>" +
          "<div style='height:6px;background:#262b5a;border-radius:4px;margin-top:3px'><div style='height:6px;width:" + pc + "%;background:" + (me ? "#22c55e" : i === 0 ? "#f5b72b" : "#6b5cf0") + ";border-radius:4px'></div></div>" +
          (x.hero && x.hero.p ? "<div style='font-size:11px;opacity:.6;margin-top:2px'>🦸 " + esc(x.hero.name) + " — " + x.hero.p + "</div>" : "") + "</div>";
      });
      h += "</div>";
      h += "<div style='" + CARD + ";font-size:13px;line-height:1.6'>📜 <b>Qoidalar</b><br>• Odam bilan o‘yinda g‘alaba <b>+" + d.rules.win + "</b>, durang <b>+" + d.rules.draw + "</b> ochko viloyatingizga<br>• Oy oxirida g‘olib viloyatning " + d.rules.min + "+ ochko yig‘gan har bir o‘yinchisiga <b>" + d.rules.reward + " 🪙</b><br>• G‘olib viloyat qahramoniga (eng ko‘p ochko) <b>7 kunlik 👑 Premium</b></div>";
      if (d.last && d.last.win) h += "<div style='" + CARD + ";font-size:13px'>🏅 " + (MN[+d.last.m.slice(5, 7)] || d.last.m) + " g‘olibi: <b>" + esc(d.last.win) + "</b>" + (d.last.hero ? "<br>🦸 Qahramon: " + esc(d.last.hero.name) + " (" + d.last.hero.p + ")" : "") + "</div>";
      h += "<button style='width:100%;border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;background:#6b5cf0' onclick=\"document.getElementById('regOv').remove()\">Yopish</button>";
      box.innerHTML = h;
      box.querySelector("#rgX").onclick = function () { ov.remove(); };
      var c = box.querySelector("#rgC"); if (c) c.onclick = function () { pick(d); };
    }
    load();
  };
})();
