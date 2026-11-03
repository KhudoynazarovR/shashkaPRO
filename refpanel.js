// refpanel.js — 👥 Do'stlarni taklif qilish oynasi (window.refOpen)
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var APP = function () { return window.TG_APP_LINK || "https://t.me/DraughtsPRObot/play"; };
  var BOT = function () { var m = /t\.me\/([^/?]+)/.exec(APP()); return m ? m[1] : "DraughtsPRObot"; };
  var CARD = "background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;text-align:left";
  var BTN = "border:0;border-radius:14px;padding:12px;font-size:15px;color:#fff;font-family:inherit";
  function myId() { try { return String(Telegram.WebApp.initDataUnsafe.user.id); } catch (e) { return ""; } }
  function link() { return APP() + "?startapp=ref_" + myId(); }
  function open(u) { var tg = window.Telegram && Telegram.WebApp; if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank"); }
  window.refShare = function () {
    if (!myId()) return;
    open("https://t.me/share/url?url=" + encodeURIComponent(link()) + "&text=" + encodeURIComponent("♟ Shashka PRO — kel, birga o‘ynaymiz! Kirganingga 500 🪙 sovg‘a"));
  };
  window.refOpen = function () {
    var tg = window.Telegram && Telegram.WebApp;
    var old = document.getElementById("refOv"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "refOv";
    ov.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:0;z-index:100000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:12px";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:420px;max-height:92%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #262b5a;border-radius:22px;padding:16px 14px;font-family:inherit;text-align:center";
    box.innerHTML = "<div style='padding:30px;opacity:.7'>Yuklanmoqda…</div>";
    ov.appendChild(box); document.body.appendChild(ov);
    fetch("/api/ref", { headers: { "x-init-data": (tg && tg.initData) || "" } }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error) { box.innerHTML = "<div style='padding:30px'>Faqat Telegram ichida ishlaydi</div><button style='" + BTN + ";width:100%;background:#3a3f6b' onclick=\"document.getElementById('refOv').remove()\">Yopish</button>"; return; }
      var R = d.rules, h = "";
      h += "<div style='display:flex;align-items:center;margin-bottom:10px'><b style='font-size:19px'>👥 Do‘stlarni taklif qilish</b><span id='refX' style='margin-left:auto;font-size:24px;padding:2px 8px;cursor:pointer'>✕</span></div>";
      h += "<div style='" + CARD + ";background:linear-gradient(135deg,#3a2a00,#161a3a)'>" +
        "<div style='font-size:14px;line-height:1.6'>🔗 Do‘stingiz havolangiz orqali kirsa:<br>" +
        "🎮 odamlar bilan <b>" + R.g1 + "</b> ta o‘yin o‘ynasa — sizga <b>+" + R.p1 + " 🪙</b><br>" +
        "🔥 <b>" + R.g2 + "</b> ta o‘yin o‘ynasa — sizga yana <b>+" + R.p2 + " 🪙</b>, do‘stingizga <b>+" + R.p2f + " 🪙</b></div>" +
        "<div style='font-size:12px;opacity:.65;margin-top:6px'>Sizning o‘zingiz bilan o‘ynagan o‘yinlari hisoblanmaydi · " + R.max + " tagacha do‘st</div></div>";
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65'>SIZNING HAVOLANGIZ</div><div id='refL' style='font-size:13px;word-break:break-all;margin:6px 0 10px;color:#a9b0ff'>" + esc(link()) + "</div>" +
        "<div style='display:flex;gap:8px'><button id='refSh' style='" + BTN + ";flex:2;background:#2e7d32'>📤 Ulashish</button><button id='refCp' style='" + BTN + ";flex:1;background:#3a3f6b'>📋 Nusxa</button></div></div>";
      h += "<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px'>" +
        "<div style='" + CARD + ";margin:0;text-align:center'><div style='font-size:22px;font-weight:700'>" + d.joined + "</div><div style='font-size:12px;color:#8a8db8'>Taklif qilganlar</div></div>" +
        "<div style='" + CARD + ";margin:0;text-align:center'><div style='font-size:22px;font-weight:700;color:#7ee08a'>" + d.active + "</div><div style='font-size:12px;color:#8a8db8'>Faol (" + R.g2 + "+ o‘yin)</div></div></div>";
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>🎖 MUKOFOTLAR (faol do‘stlar soni)</div>";
      d.tiers.forEach(function (t) {
        var ok = d.active >= t.n, pc = Math.min(100, Math.round(d.active * 100 / t.n));
        h += "<div style='margin:6px 0'><div style='display:flex;justify-content:space-between;font-size:14px'><span>" + (ok ? "✅ " : "") + esc(t.name) + "</span><b>" + Math.min(d.active, t.n) + "/" + t.n + "</b></div>" +
          "<div style='height:6px;background:#262b5a;border-radius:4px;margin-top:4px'><div style='height:6px;width:" + pc + "%;background:" + (ok ? "#2e7d32" : "#f5b72b") + ";border-radius:4px'></div></div></div>";
      });
      h += "</div>";
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>👥 SIZ TAKLIF QILGANLAR</div>";
      if (!d.list.length) h += "<div style='opacity:.7;font-size:14px'>Hali hech kim yo‘q — havolani ulashing!</div>";
      d.list.forEach(function (x) {
        h += "<div style='display:flex;justify-content:space-between;font-size:14px;padding:5px 0;border-bottom:1px solid #1c2147'><span>" + esc(x.name) + "</span><span style='color:" + (x.st >= 2 ? "#7ee08a" : "#a9b0ff") + "'>" + (x.st >= 2 ? "✅ faol" : "🎮 " + x.g + "/" + R.g2) + "</span></div>";
      });
      h += "</div>";
      var mm = d.month.m.split("-"), MN = ["", "yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
      h += "<div style='" + CARD + "'><div style='font-size:12px;opacity:.65;margin-bottom:6px'>🏆 " + MN[+mm[1]].toUpperCase() + " OYI TOP · sovrin: 🥇 " + d.month.prizes[0] + " · 🥈 " + d.month.prizes[1] + " · 🥉 " + d.month.prizes[2] + " 🪙</div>";
      if (!d.month.top.length) h += "<div style='opacity:.7;font-size:14px'>Bu oy hali hech kim yo‘q — birinchi bo‘ling!</div>";
      d.month.top.forEach(function (x, i) {
        h += "<div style='display:flex;justify-content:space-between;font-size:14px;padding:4px 0" + (x.me ? ";color:#f5b72b;font-weight:700" : "") + "'><span>" + (["🥇", "🥈", "🥉"][i] || (i + 1) + ".") + " " + esc(x.name) + "</span><b>" + x.n + "</b></div>";
      });
      h += "<div style='font-size:12px;opacity:.65;margin-top:6px'>Siz bu oy: " + d.month.mine + " ta faol do‘st</div>";
      if (d.last && d.last.top && d.last.top.length) h += "<div style='font-size:12px;opacity:.65;margin-top:4px'>O‘tgan oy g‘oliblari: " + d.last.top.map(function (x) { return esc(x.name) + " (" + x.n + ")"; }).join(", ") + "</div>";
      h += "</div>";
      h += "<div style='" + CARD + "'><div style='font-size:14px;line-height:1.5'>🤖 <b>Botni guruhingizga admin qiling</b><br>Guruhdagi har bir a‘zo uchun <b>1 🪙</b> (" + R.grpMax + " 🪙 gacha). Har guruh uchun bir marta.</div>" +
        (d.grp.length ? "<div style='font-size:12px;opacity:.7;margin-top:6px'>" + d.grp.map(function (g) { return "✅ " + esc(g.title) + ": +" + g.n + " 🪙"; }).join("<br>") + "</div>" : "") +
        "<button id='refGr' style='" + BTN + ";width:100%;margin-top:10px;background:#1a5fb4'>➕ Guruhga qo‘shish</button></div>";
      h += "<button style='" + BTN + ";width:100%;background:#6b5cf0' onclick=\"document.getElementById('refOv').remove()\">Yopish</button>";
      box.innerHTML = h;
      box.querySelector("#refX").onclick = function () { ov.remove(); };
      box.querySelector("#refSh").onclick = window.refShare;
      box.querySelector("#refCp").onclick = function () {
        var b = this, done = function () { b.textContent = "✓ Nusxalandi"; };
        try { navigator.clipboard.writeText(link()).then(done, function () { prompt("Nusxa oling:", link()); }); } catch (e) { prompt("Nusxa oling:", link()); }
      };
      box.querySelector("#refGr").onclick = function () { open("https://t.me/" + BOT() + "?startgroup=ref&admin=pin_messages+delete_messages"); };
    }).catch(function () { box.innerHTML = "<div style='padding:30px'>Server bilan aloqa yo‘q</div>"; });
  };
  window.refOpenLazy = window.refOpen;
})();
