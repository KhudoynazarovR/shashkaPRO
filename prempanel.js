// prempanel.js — 👑 Premium oynasi (window.premOpen): tanga yoki ⭐ Stars bilan, hamda 🪙 tanga paketlari.
// ⭐ to'lov tugmalari faqat Telegram ichida ko'rinadi (Android ilova / brauzerda — faqat tanga bilan).
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var CARD = "background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left";
  var BTN = "border:0;border-radius:12px;padding:10px 6px;font-size:14px;font-weight:700;color:#fff;font-family:inherit;cursor:pointer";
  var PERKS = [
    ["🖼", "Profil rasmi", "o‘z rasmingizni qo‘yasiz — hamma ko‘radi"],
    ["🤖", "Eng kuchli botlar", "Legend, Monster, Terminator va King Kong bilan o‘ynash"],
    ["👑", "Toj belgisi va oltin ism", "reytingda, profilda va chatda"],
    ["🪙", "G‘alabadan 2× tanga", "kunlik limit ham 2 barobar"],
    ["🔥", "Kunlik seriya bonusi 2×", "har kuni kirganda"],
    ["🏆", "Turnirga kirish −50%", "chegirma bilan qatnashing"],
    ["🔬", "Kuchli tahlil", "tahlil taxtasida KestoG 5–10 soniya o‘ylaydi"]
  ];
  function tgw() { return window.Telegram && Telegram.WebApp; }
  function initData() { var t = tgw(); return (t && t.initData) || ""; }
  function canStars() { var t = tgw(); return !!(t && t.initData && t.openInvoice); }   // faqat Telegram ichida
  function dmy(t) { var d = new Date(t); return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear(); }
  function post(u, b) { return fetch(u, { method: "POST", headers: { "Content-Type": "application/json", "x-init-data": initData() }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function payStars(link, done) {
    var t = tgw(); if (!t || !t.openInvoice) return;
    t.openInvoice(link, function (st) { if (st === "paid") setTimeout(done, 1500); });
  }

  window.premOpen = function () {
    var old = document.getElementById("premOv"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "premOv";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:420px;max-height:92%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #5a4a00;border-radius:22px;padding:16px 14px;font-family:inherit;text-align:center";
    ov.appendChild(box); document.body.appendChild(ov);
    function load() {
      box.innerHTML = "<div style='padding:30px;opacity:.7'>Yuklanmoqda…</div>";
      fetch("/api/premium", { headers: { "x-init-data": initData() } }).then(function (r) { return r.json(); }).then(render)
        .catch(function () { box.innerHTML = "<div style='padding:30px'>Server bilan aloqa yo‘q</div>"; });
    }
    function render(d) {
      if (d.error) { box.innerHTML = "<div style='padding:30px'>Premium faqat Telegram orqali kirganda ishlaydi</div><button style='" + BTN + ";width:100%;background:#3a3f6b' onclick=\"document.getElementById('premOv').remove()\">Yopish</button>"; return; }
      window.__prem = !!d.premium;
      var h = "<div style='display:flex;align-items:center;margin-bottom:6px'><b style='font-size:21px;color:#ffd54a'>👑 Premium</b><span id='prX' style='margin-left:auto;font-size:24px;padding:2px 8px;cursor:pointer'>✕</span></div>";
      h += d.premium
        ? "<div style='" + CARD + ";background:linear-gradient(135deg,#4a3a00,#161a3a);text-align:center'><b style='font-size:16px'>✅ Premium faol</b><div style='font-size:13px;margin-top:4px'>" + dmy(d.until) + " gacha" + (d.sub ? " · 🔄 oylik obuna avtomatik yangilanadi" : "") + "</div><div style='font-size:12px;opacity:.7;margin-top:4px'>Yana sotib olsangiz, muddat qo‘shiladi</div></div>"
        : "<div style='font-size:13px;opacity:.75;margin-bottom:10px'>O‘yindan ko‘proq foyda oling</div>";
      h += "<div style='" + CARD + "'>" + PERKS.map(function (p) { return "<div style='display:flex;gap:10px;align-items:center;padding:5px 0'><span style='font-size:22px'>" + p[0] + "</span><div><b style='font-size:14px'>" + p[1] + "</b><div style='font-size:12px;opacity:.65'>" + p[2] + "</div></div></div>"; }).join("") + "</div>";
      h += "<div id='prMsg' style='min-height:18px;font-size:13px;margin:4px 0 8px;color:#ff6b7f'></div>";
      d.plans.forEach(function (p) {
        var best = p.id === "y";
        h += "<div style='" + CARD + ";border-color:" + (best ? "#ffd54a" : "#262b5a") + "'>" +
          "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px'><b style='font-size:16px'>" + esc(p.name) + "</b><span style='font-size:12px;opacity:.7'>" + p.days + " kun" + (best ? " · 🔥 eng foydali" : "") + "</span></div>" +
          "<div style='display:flex;gap:8px'>" +
          "<button data-c='" + p.id + "' style='" + BTN + ";flex:1;background:" + (d.diamonds >= p.coins ? "#8a5a00" : "#3a3f6b") + "'>🪙 " + p.coins.toLocaleString("ru") + "</button>" +
          (canStars() ? "<button data-s='" + p.id + "' style='" + BTN + ";flex:1;background:#1a5fb4'>⭐ " + p.stars + (p.sub ? " / oy" : "") + "</button>" : "") +
          "</div>" + (p.sub && canStars() ? "<div style='font-size:11px;opacity:.6;margin-top:6px'>⭐ bilan — har oy avtomatik yangilanadi, Telegram sozlamalarida bekor qilish mumkin</div>" : "") + "</div>";
      });
      h += "<div style='font-size:13px;margin:4px 0 10px'>Balansingiz: <b>" + (d.diamonds || 0).toLocaleString("ru") + " 🪙</b></div>";
      if (canStars() && d.packs && d.packs.length) {
        h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:8px'>🪙 TANGA SOTIB OLISH</div><div style='display:flex;gap:8px'>" +
          d.packs.map(function (k) { return "<button data-k='" + k.id + "' style='" + BTN + ";flex:1;background:#262b66;font-size:13px'>" + k.diamonds.toLocaleString("ru") + " 🪙" + (k.bonus ? "<div style='font-size:11px;color:#7ee08a;margin-top:2px'>+" + k.bonus + " bonus</div>" : "") + "<div style='font-weight:400;font-size:12px;margin-top:2px'>⭐ " + k.stars + "</div></button>"; }).join("") + "</div></div>";
      }
      if (canStars()) h += "<div style='font-size:11px;opacity:.55;margin-bottom:10px'>To‘lov bo‘yicha muammo bo‘lsa: botga /paysupport yozing</div>";
      h += "<button style='" + BTN + ";width:100%;padding:12px;background:#6b5cf0' onclick=\"document.getElementById('premOv').remove()\">Yopish</button>";
      box.innerHTML = h;
      var msg = box.querySelector("#prMsg");
      box.querySelector("#prX").onclick = function () { ov.remove(); };
      [].forEach.call(box.querySelectorAll("[data-c]"), function (b) {
        b.onclick = function () {
          var p = d.plans.filter(function (x) { return x.id === b.getAttribute("data-c"); })[0];
          if (d.diamonds < p.coins) { msg.style.color = "#ff6b7f"; msg.textContent = "Tanga yetmaydi: yana " + (p.coins - d.diamonds) + " 🪙 kerak"; return; }
          if (!confirm(p.name + " Premium — " + p.coins + " 🪙. Sotib olasizmi?")) return;
          b.disabled = true;
          post("/api/premium/buy", { plan: p.id }).then(function (r) {
            if (r.error) { msg.style.color = "#ff6b7f"; msg.textContent = r.error; b.disabled = false; return; }
            load();
          }).catch(function () { msg.textContent = "Server bilan aloqa yo‘q"; b.disabled = false; });
        };
      });
      [].forEach.call(box.querySelectorAll("[data-s]"), function (b) {
        b.onclick = function () {
          b.disabled = true;
          post("/api/premium/invoice", { plan: b.getAttribute("data-s") }).then(function (r) {
            b.disabled = false;
            if (!r.link) { msg.textContent = "To‘lov oynasini ochib bo‘lmadi"; return; }
            payStars(r.link, load);
          }).catch(function () { b.disabled = false; msg.textContent = "Server bilan aloqa yo‘q"; });
        };
      });
      [].forEach.call(box.querySelectorAll("[data-k]"), function (b) {
        b.onclick = function () {
          b.disabled = true;
          fetch("/api/invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: initData(), pack: b.getAttribute("data-k") }) })
            .then(function (r) { return r.json(); }).then(function (r) {
              b.disabled = false;
              if (!r.link) { msg.textContent = "To‘lov oynasini ochib bo‘lmadi"; return; }
              payStars(r.link, load);
            }).catch(function () { b.disabled = false; msg.textContent = "Server bilan aloqa yo‘q"; });
        };
      });
    }
    load();
  };
})();
