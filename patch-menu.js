// patch-menu.js — ShashkaPRO: o'yin ichidagi menyu
// Ishga tushirish:  node patch-menu.js
// Zaxira: roomclient.js.before-menu, rooms.js.before-menu
// Qaytarish: cp roomclient.js.before-menu roomclient.js && cp rooms.js.before-menu rooms.js
const fs = require("fs");

function patchFile(file, tag, marker, edits) {
  const src = fs.readFileSync(file, "utf8");
  if (src.includes(marker)) { console.log("⏭  " + file + ": allaqachon qo'llangan"); return true; }
  let out = src;
  for (const [name, anchor, replacer] of edits) {
    const n = out.split(anchor).length - 1;
    if (n !== 1) {
      console.log("❌ " + file + ": '" + name + "' topilmadi yoki " + n + " marta uchradi (1 bo'lishi kerak). Hech narsa o'zgarmadi.");
      return false;
    }
    out = out.replace(anchor, () => replacer(anchor));
  }
  fs.writeFileSync(file + ".before-" + tag, src);
  fs.writeFileSync(file, out);
  console.log("✅ " + file + " yangilandi (zaxira: " + file + ".before-" + tag + ")");
  return true;
}

// ---------------- CLIENT: roomclient.js ----------------
const CLIENT = String.raw`
    /* rc-menu-v1 */
    try {
      var RCM_KEY = "rc_menu_v1";
      var RCM_BOARDS = [
        ["Yog‘och", "#EFD9B1", "#B58863", 0], ["Ko‘k-kul", "#DEE3E6", "#8CA2AD", 0],
        ["Yashil", "#FFFFDD", "#86A666", 0], ["Kulrang", "#DDDDDD", "#A0A0A0", 0],
        ["Qizil", "#F1D5CC", "#B5685D", 1], ["Binafsha", "#E3DAEE", "#8B72B5", 1],
        ["Feruza", "#D5F0EC", "#4A9A93", 1], ["Tungi", "#9AA5B8", "#3E4A5E", 1]
      ];
      var rcm = { night: false, sound: true, flat: false, board: -1, auto: false, autoPro: false, chat: true };
      try { var rcmSv = JSON.parse(localStorage.getItem(RCM_KEY) || "{}"); for (var rcmK in rcmSv) rcm[rcmK] = rcmSv[rcmK]; } catch (e) {}
      function rcmSave() { try { localStorage.setItem(RCM_KEY, JSON.stringify(rcm)); } catch (e) {} }

      // Ovozni o'chirish (audio elementlar va WebAudio)
      if (!window.__rcmSoundPatched) {
        window.__rcmSoundPatched = true;
        try { var rcmHP = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (window.__rcmMute) return Promise.resolve(); return rcmHP.apply(this, arguments); }; } catch (e) {}
        ["AudioBufferSourceNode", "OscillatorNode"].forEach(function (n) {
          try { var P = window[n] && window[n].prototype; if (!P) return; var s0 = P.start; P.start = function () { if (window.__rcmMute) return; return s0.apply(this, arguments); }; } catch (e) {}
        });
      }

      var rcmOrigBg = root.style.background;
      var rcmStyle = document.createElement("style"); rcmStyle.id = "rcmStyle"; document.head.appendChild(rcmStyle);
      function rcmApply() {
        window.__rcmMute = !rcm.sound;
        var css = "";
        if (rcm.board >= 0 && RCM_BOARDS[rcm.board]) {
          var b = RCM_BOARDS[rcm.board];
          css += "#rcBoard .cell.sq.l:not(.lm):not(.sel){background:" + b[1] + " !important}";
          css += "#rcBoard .cell.sq.d:not(.lm):not(.sel){background:" + b[2] + " !important}";
        }
        css += ".rcFlat .pc{background-image:none!important;box-shadow:none!important}";
        css += ".rcFlat .pc.w{background:#f4f4f4!important;border:2px solid #bbb!important}";
        css += ".rcFlat .pc.b{background:#222!important;border:2px solid #555!important}";
        rcmStyle.textContent = css;
        root.classList.toggle("rcFlat", !!rcm.flat);
        root.style.background = rcm.night ? "radial-gradient(circle at 30% 10%,#10162b 0,#0a0e1d 55%,#05070f 100%)" : rcmOrigBg;
        rcmChatVis();
      }
      function rcmChatVis() {
        if (!rcm.chat) { elChatBtn.style.display = "none"; elChat.style.display = "none"; }
        else if (elChatBtn.style.display === "none") elChatBtn.style.display = "";
      }

      // "Yurmasdan chiqish" uchun: men yurdimmi?
      var rcmMovedFlag = false;
      var rcmSM = sendMove;
      sendMove = function (mv) { rcmMovedFlag = true; return rcmSM.apply(this, arguments); };
      function rcmMoved() {
        if (rcmMovedFlag) return true;
        if (!st.moves) return false;
        return st.color === "white" ? st.moves.length > 0 : st.moves.length >= 2;
      }
      function rcmCanAbort() { return st.color !== "spectator" && !st.finished && st.joined && !rcmMoved(); }

      // Menyu tugmasi va paneli
      var rcmBtn = document.createElement("button");
      rcmBtn.id = "rcMenuBtn"; rcmBtn.textContent = "☰ Menu";
      elChatBtn.parentNode.insertBefore(rcmBtn, elChatBtn);
      var rcmPanel = document.createElement("div");
      rcmPanel.style.cssText = "display:none;position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.55)";
      rcmPanel.innerHTML = '<div id="rcmBox" style="position:absolute;top:0;right:0;bottom:0;width:min(82vw,340px);background:#101a2e;color:#fff;overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 24px;font-size:16px;box-sizing:border-box"></div>';
      root.appendChild(rcmPanel);
      rcmPanel.onclick = function (e) { if (e.target === rcmPanel) rcmPanel.style.display = "none"; };
      rcmBtn.onclick = function () { rcmBuild(); rcmPanel.style.display = "block"; };

      function rcmBuild() {
        var box = document.getElementById("rcmBox");
        var T = [
          ["night", "🌙 Tungi rejim", ""], ["sound", "🔊 Ovoz", ""], ["flat", "◐ Oddiy toshlar", ""],
          ["auto", "⚡ Avtohod", "Faqat 1 ta yurish bo‘lsa, o‘zi yuradi"],
          ["autoPro", "⚡ Avtohod Pro", "Urish davomi 1 ta bo‘lsa, o‘zi davom ettiradi"],
          ["chat", "💬 Chat", ""]
        ];
        var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:19px">☰ Menu</b><span id="rcmX" style="font-size:24px;padding:4px 8px">✕</span></div>';
        T.forEach(function (t) {
          h += '<label style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #26344f">' +
            '<span>' + t[1] + (t[2] ? '<small style="display:block;opacity:.6;font-size:12px;margin-top:2px">' + t[2] + '</small>' : '') + '</span>' +
            '<input type="checkbox" data-k="' + t[0] + '"' + (rcm[t[0]] ? " checked" : "") + ' style="width:22px;height:22px"></label>';
        });
        h += '<div style="margin:16px 0 8px">🎨 Doska rangi</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
        RCM_BOARDS.forEach(function (b, i) {
          h += '<div data-b="' + i + '" style="aspect-ratio:1;border-radius:10px;position:relative;border:3px solid ' + (i === rcm.board ? "#4c8dff" : "transparent") +
            ';background:conic-gradient(' + b[2] + ' 25%,' + b[1] + ' 0 50%,' + b[2] + ' 0 75%,' + b[1] + ' 0)">' +
            (b[3] ? '<span style="position:absolute;top:-8px;right:-4px;font-size:14px">👑</span>' : "") + '</div>';
        });
        h += '</div><div id="rcmReset" style="margin:10px 0 0;font-size:13px;opacity:.7;text-decoration:underline">↺ Standart doska</div>';
        if (rcmCanAbort()) h += '<button id="rcmAbort" style="width:100%;margin-top:22px;padding:14px;border:0;border-radius:12px;background:#d32f2f;color:#fff;font-size:16px">⎋ Chiqish (yurmasdan)</button>';
        box.innerHTML = h;

        box.querySelector("#rcmX").onclick = function () { rcmPanel.style.display = "none"; };
        Array.prototype.forEach.call(box.querySelectorAll("input[data-k]"), function (inp) {
          inp.onchange = function () {
            var k = inp.getAttribute("data-k"); rcm[k] = inp.checked;
            if (k === "autoPro" && inp.checked) rcm.auto = true;
            if (k === "auto" && !inp.checked) rcm.autoPro = false;
            rcmSave(); rcmApply(); rcmBuild();
          };
        });
        Array.prototype.forEach.call(box.querySelectorAll("[data-b]"), function (el) {
          el.onclick = function () {
            var i = +el.getAttribute("data-b"), b = RCM_BOARDS[i];
            if (b[3] && window.rcIsPremium && !window.rcIsPremium()) { alert("👑 Bu doska premium. Tosh do‘konidan oching."); return; }
            rcm.board = i; rcmSave(); rcmApply(); rcmBuild();
          };
        });
        box.querySelector("#rcmReset").onclick = function () { rcm.board = -1; rcmSave(); rcmApply(); rcmBuild(); };
        var ab = box.querySelector("#rcmAbort");
        if (ab) ab.onclick = function () {
          if (!rcmCanAbort()) { rcmBuild(); return; }
          if (!confirm("Yurmasdan chiqasizmi? O‘yin bekor qilinadi.")) return;
          send({ type: "roomAbort", roomId: roomId });
          setTimeout(function () { location.href = location.pathname; }, 600);
        };
      }

      // Avtohod / Avtohod Pro
      var rcmLast = 0;
      setInterval(function () {
        try {
          rcmChatVis();
          if (!rcm.auto) return;
          if (!st || !st.joined || st.finished || st.color === "spectator" || st.pending) return;
          if (st.vsBot && !st.botStarted) return;
          if (!bothIn() || st.turn !== st.color) return;
          var now = Date.now(); if (now - rcmLast < 600) return;
          var chain = !!st.forced;
          var steps = chain ? captureSteps(st.board, st.forced.r, st.forced.c) : allMoves(st.board, codeOf(st.color));
          if (!steps || steps.length !== 1) return;
          if (chain && !rcm.autoPro) return;
          var mv = steps[0];
          if (!mv || !mv.from || !mv.to) return;
          rcmLast = now;
          sendMove(mv);
        } catch (e) {}
      }, 350);

      rcmApply();
    } catch (e) { console.error("rc-menu xato:", e); }

    `;

const okClient = patchFile("roomclient.js", "menu", "/* rc-menu-v1 */", [
  ["UI qismi (elBerserk)", 'var elBerserk = document.createElement("button");', (a) => CLIENT + a],
]);

// ---------------- SERVER: rooms.js ----------------
const SERVER_ABORT = `if (m.type === "roomAbort") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished) return true;
      if (room.mvCount && room.mvCount[col]) return err(c, "Birinchi yurishdan keyin chiqib bo‘lmaydi"), true;
      finish(room, "draw", "abort");   // rc-menu-v1
      return true;
    }

    `;
const okServer = patchFile("rooms.js", "menu", "rc-menu-v1", [
  ["roomMove hisoblagich", "return applyMove(c, room, roomId, col, m);",
    () => "{ const _b = room.moves.length; const _r = applyMove(c, room, roomId, col, m); if (col && room.moves.length > _b) { room.mvCount = room.mvCount || {}; room.mvCount[col] = (room.mvCount[col] || 0) + 1; } return _r; }"],
  ["roomFinish/roomResign", 'if (m.type === "roomFinish" || m.type === "roomResign") {', (a) => SERVER_ABORT + a],
]);

console.log(okClient && okServer ? "\nTayyor. Serverni qayta ishga tushiring va sahifani yangilang." : "\nBa'zi qismlar qo'llanmadi, yuqoridagi xabarlarni ko'ring.");
