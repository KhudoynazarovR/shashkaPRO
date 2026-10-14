/* roomclient.js — guruh o'yini (xona) rejimi.
   Faqat Telegram havolasidan (startapp=XONA) yoki ?room=XONA bilan ochilganda ishlaydi.
   Oddiy ochilganda hech narsa qilmaydi. index.html dagi qoidalar funksiyalaridan foydalanadi. */
(function () {
  "use strict";

  var ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
  var q = new URLSearchParams(location.search);

  function loadTg(cb) {
    if (window.Telegram && window.Telegram.WebApp) return cb();
    var s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  loadTg(function () {
    var tg = window.Telegram && window.Telegram.WebApp;
    var roomId = "";
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param && !/^(ref_|pz_|shop_)/.test(tg.initDataUnsafe.start_param)) roomId = String(tg.initDataUnsafe.start_param);
    if (!roomId && q.get("room")) roomId = q.get("room");
    if (/^lb[ts]_/.test(roomId)) return; // turnir/sians havolasi - xona emas
    if (!ROOM_RE.test(roomId)) return; // xona rejimi emas
    try { if (tg) { tg.ready(); tg.expand(); if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } } catch (e) {}
    var missing = missingFns();
    if (missing.length) {
      var d = document.createElement("div");
      d.style.cssText = "position:fixed;inset:0;z-index:9999;background:#0b1017;color:#fff;padding:24px;font-family:Arial,sans-serif";
      d.textContent = "⚠️ index.html da kerakli funksiyalar topilmadi: " + missing.join(", ");
      document.body.appendChild(d);
      return;
    }
    start(roomId, tg);
  });

  // index.html dan olinadigan funksiya/o'zgaruvchilar bormi — tekshiramiz
  function missingFns() {
    var need = ["WHITE", "BLACK", "initialBoard", "applyStep", "captureSteps", "simpleSteps",
      "allCaptures", "allMoves", "sameSide", "isWhite", "isKing"];
    var out = [];
    for (var i = 0; i < need.length; i++) {
      try { if (new Function("return typeof " + need[i])() === "undefined") out.push(need[i]); } catch (e) {}
    }
    return out;
  }

  // Telegramsiz kirganda har bir oyna (tab) o'z id'sini saqlaydi — qayta ulansa joyi yo'qolmaydi
  function guestId() {
    var k = "rcGuest", v = "";
    try { v = sessionStorage.getItem(k) || ""; } catch (e) {}
    if (!/^[A-Za-z0-9]{8,32}$/.test(v)) {
      v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      try { sessionStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }

  function start(roomId, tg) {
    var st = {
      color: "spectator", turn: "white", board: startBoard(), moves: [],
      white: null, black: null, whiteOnline: false, blackOnline: false,
      spectators: 0, finished: false, winner: null, reason: null,
      clock: { white: 0, black: 0 }, clockRunning: false, clockAt: 0, timeMs: 0, incMs: 0, tc: "", tcs: [],
      arena: false, berserk: { white: false, black: false }, drawOffer: null, chat: [], unread: 0, chatOpen: false,
      selected: null, forced: null, pending: false, connected: false, joined: false
    };
    var ws = null, hb = null, gid = guestId();

    // ---------- ovozlar ----------
    function soundForMove(mv, piece) {
      var S = window.SPSound;
      if (!S || !mv || !mv.to) return;
      var toLast = piece === 1 ? mv.to.r === 0 : piece === 2 ? mv.to.r === 7 : false;
      if (toLast) S.play("king");
      else if (mv.captures && mv.captures.length) S.play("capture");
      else S.play("move");
    }
    var lowFlag = { white: false, black: false }, lastTickSec = 0;
    function lowTimeCheck() {
      var S = window.SPSound;
      if (!S || st.finished || st.color === "spectator" || !st.clockRunning || st.turn !== st.color) return;
      var ms = remaining(st.color);
      if (ms <= 0) return;
      if (ms <= 10000 && !lowFlag[st.color]) { lowFlag[st.color] = true; S.play("low"); }
      if (ms > 12000) lowFlag[st.color] = false;       // inkrement bilan oshsa, qayta signal beriladi
      if (ms <= 5000) {
        var sec = Math.ceil(ms / 1000);
        if (sec !== lastTickSec) { lastTickSec = sec; S.play("tick"); }
      }
    }
    setInterval(lowTimeCheck, 300);
    function startBoard() {
      var o = (typeof st !== "undefined" && st) ? st.opening : null;
      var b = initialBoard();
      if (!o || !o.board) return b;
      var k = 0;
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        if ((r + c) % 2 !== 1) { b[r][c] = 0; continue; }
        var ch = o.board.charAt(k++);
        b[r][c] = ch === "w" ? 1 : ch === "b" ? 2 : ch === "W" ? 3 : ch === "B" ? 4 : 0;
      }
      return b;
    }


    // ---------- UI ----------
    var root = document.createElement("div");
    root.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;font-family:Arial,sans-serif;" +
      "display:flex;flex-direction:column;align-items:center;overflow:auto;" +
      "padding:calc(env(safe-area-inset-top,0px) + 10px) 10px 14px";
    root.innerHTML =
      '<div style="display:none">♟️ ShashkaPRO</div>' +
      '<div id="rcStatus" style="margin:8px 0;color:#e3b746;min-height:22px;text-align:center"></div>' +
      '<div id="rcTc" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:6px"></div>' +
      '<div id="rcTop" style="width:min(94vw,520px);padding:4px 2px;font-size:15px"></div>' +
      '<div id="rcBoard" style="width:min(94vw,520px);aspect-ratio:1;flex:none;display:grid;grid-template-columns:repeat(8,1fr);' +
      'grid-template-rows:repeat(8,1fr);border:3px solid #302217;border-radius:8px;overflow:hidden;' +
      'box-shadow:0 12px 35px #0009;touch-action:manipulation"></div>' +
      '<div id="rcBottom" style="width:min(94vw,520px);padding:4px 2px;font-size:15px"></div>' +
      '<div id="rcDraw" style="display:none;margin-top:10px;padding:8px 12px;border-radius:10px;background:#1c2733;text-align:center">' +
      '<div id="rcDrawText" style="margin-bottom:6px"></div>' +
      '<button id="rcDrawYes">✅ Qabul</button> <button id="rcDrawNo">❌ Rad etish</button></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center">' +
      '<button id="rcDrawOffer" style="display:none">🤝 Durang</button>' +
      '<button id="rcResign" style="display:none">🏳️ Taslim</button>' +
      '<button id="rcLink">🔗 Havola</button>' +
      '<button id="rcChatBtn">💬 Chat</button>' +
      '<button id="rcClose" style="display:none">✖️ Yopish</button></div>' +
      '<div id="rcChat" style="display:none;position:fixed;left:0;right:0;bottom:0;z-index:10000;background:#120b30;border-top:1px solid #3a2f7a;padding:8px 10px calc(env(safe-area-inset-bottom,0px) + 8px);box-sizing:border-box">' +
      '<div id="rcMsgs" style="height:90px;overflow:auto;background:#101a24;border-radius:8px;padding:6px 8px;font-size:14px"></div>' +
      '<div id="rcQuick"></div><div style="display:none">' +
      '<input id="rcInput" maxlength="200" placeholder="Xabar yozing…" style="flex:1;min-width:0;padding:8px;border-radius:8px;border:1px solid #2a3a4a;background:#0b1017;color:#fff;font-size:16px">' +
      '<button id="rcSend">➤</button></div></div>' +
      '<div id="rcInfo" style="margin-top:10px;font-size:13px;opacity:.7;text-align:center"></div>';
    document.body.appendChild(root);

    var elStatus = root.querySelector("#rcStatus");
    var elTop = root.querySelector("#rcTop");
    var elBottom = root.querySelector("#rcBottom");
    var elBoard = root.querySelector("#rcBoard");
    var elResign = root.querySelector("#rcResign");
    var elInfo = root.querySelector("#rcInfo");
    var elTc = root.querySelector("#rcTc");
    var elDraw = root.querySelector("#rcDraw");
    var elDrawText = root.querySelector("#rcDrawText");
    var elDrawOffer = root.querySelector("#rcDrawOffer");
    var elChat = root.querySelector("#rcChat");
    var elChatBtn = root.querySelector("#rcChatBtn");
    var elMsgs = root.querySelector("#rcMsgs");
    var elInput = root.querySelector("#rcInput");

    window.addEventListener("error", function (e) {
      elInfo.textContent = "⚠️ JS xato: " + (e && e.message);
    });

    root.querySelector("#rcClose").onclick = function () {
      if (tg && tg.close) tg.close(); else root.style.display = "none";
    };
    root.querySelector("#rcLink").onclick = function () {
      var base = window.TG_APP_LINK || "";
      var url = base
        ? base + "?startapp=" + encodeURIComponent(roomId)
        : location.origin + location.pathname + "?room=" + encodeURIComponent(roomId);
      var text = "♟️ ShashkaPRO — men bilan o‘ynang!";
      if (base && tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text));
        return;
      }
      if (navigator.share) { navigator.share({ title: "ShashkaPRO", text: text, url: url }).catch(function () {}); return; }
      var done = function () { elInfo.textContent = "🔗 Havola nusxalandi"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Havola:", url); });
      else prompt("Havola:", url);
    };
    elResign.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      if (confirm("Taslim bo‘lasizmi?")) send({ type: "roomResign", roomId: roomId });
    };

    elDrawOffer.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      send({ type: "roomDrawOffer", roomId: roomId });
    };
    root.querySelector("#rcDrawYes").onclick = function () { send({ type: "roomDrawAccept", roomId: roomId }); };
    root.querySelector("#rcDrawNo").onclick = function () { send({ type: "roomDrawDecline", roomId: roomId }); };

    var elBerserk = document.createElement("button");
    elBerserk.textContent = "⚡ Berserk";
    elBerserk.className = elResign.className;
    elBerserk.style.display = "none";
    elResign.parentNode.insertBefore(elBerserk, elResign);
    elBerserk.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      send({ type: "roomBerserk", roomId: roomId });
    };

    elChatBtn.onclick = function () {
      st.chatOpen = !st.chatOpen;
      if (st.chatOpen) st.unread = 0;
      renderChat();
      if (st.chatOpen) elMsgs.scrollTop = elMsgs.scrollHeight;
    };
    function sendChat() {
      var t = elInput.value.trim();
      if (!t) return;
      send({ type: "roomChat", roomId: roomId, text: t });
      elInput.value = "";
    }
    root.querySelector("#rcSend").onclick = sendChat;
    var CATS = [["🎮","Yurishlar",["👍 Ajoyib yurish!","⏩ Tezroq yur!","🐢 Shoshilma!","🎯 Aniq yurish!","🧠 Aqlli yurish!","🔥 Zo‘r yurish!","⚡ Tez va aniq!","👀 Yaxshilab o‘yla!","🤔 Variantlarni ko‘r!","💡 Mana bu yurishni qara!","🚀 Olg‘a!","🎲 Tavakkal qil!","🛡️ Himoyalan!","⚔️ Hujum qil!","🔄 Yana bir o‘yla!"]],["🧠","Strategiya",["🧠 Haqiqiy strateg!","♟️ Reja zo‘r!","🔮 Keyingi yurishni bilaman!","🧐 Qiziq strategiya!","💡 Zo‘r fikr!","🎯 Hammasi hisoblangan!","🕵️ Tuzog‘imga tushding!","🪤 Bu tuzoq!","🤯 Qanday yurish?!","📈 Ustunlik menda!","🧩 Kombinatsiyani top!","🧠 Miyani ishlat!","👑 Strategiya qiroli!","🥷 Ayyor yurish!","🔍 Bir xatoni kutyapman!"]],["🔥","Hujum",["🔥 Zo‘r kombinatsiya!","⚔️ Hujum boshlandi!","💥 Kuchli zarba!","🎯 Nishonga tegdi!","🪓 Bittasi ketdi!","💣 Portlovchi yurish!","🚀 Hujumga o‘t!","🐉 Shafqatsiz hujum!","⚡ Chaqmoqdek yurish!","🥊 Zarba ber!","🔗 Ketma-ket zarbalar!","💥 Bir yurishda ikki dona!","🧨 Kutilmagan hujum!","🦈 O‘ljani ko‘rdim!","🏹 Aniq zarba!"]],["👑","Dama",["👑 Dama bo‘ldi!","🎉 Dama oldim!","💎 Dama — mening boyligim!","🏆 Ustunlik menda!","📈 Vaziyat yaxshi!","😎 Endi qiziq bo‘ladi!","🔥 Dama bilan ehtiyot bo‘l!","👑 Dama qiroli!","🚀 Dama bilan hujum!","🛡️ Damani asra!","😏 Dama bilan nima qilasan?","💪 Kuchlar teng emas!","🌟 Dama vaqti!","🎯 Damani tutib ko‘r!","🦁 Maydon meniki!"]],["😂","Hazil",["😂 Nima qilyapsan?","🤣 Bunaqasi ham bo‘ladimi?","😅 Voy, xato ketdi!","🙈 Ko‘rmadim deb hisobla!","🤦 O‘zim ham tushunmadim!","😜 Ataylab qildim!","🫣 Bu yurishni unutaylik!","🤡 Bugun omad kulmadi!","🥲 Yuragim og‘ridi!","😎 Hammasi reja bo‘yicha!","🤭 Seni sinab ko‘rdim!","🐒 Qiziq yurish ekan!","😆 Qaytadan o‘ynaymizmi?","🙃 Vaziyat chatoq!","🫡 Xo‘p, ustoz!"]],["😤","Chaqiriq",["😤 Qani, kuchingni ko‘rsat!","🔥 Meni yenga olasanmi?","😏 Ishonching komilmi?","🥶 Sovuqqon bo‘l!","👀 Seni kuzatyapman!","🐯 Hujumga tayyormisan?","🦁 Qani, boshladik!","🎯 Meni tutib ko‘r!","🧠 O‘ylashga vaqt bor!","😜 Qo‘rqib ketdingmi?","⚔️ Oxirigacha kurash!","🏆 G‘olib kim bo‘larkin?","💪 Qani, raqib!","🔥 Hali hammasi oldinda!","😎 Men tayyorman!"]],["🤝","Hurmat",["👏 Yaxshi o‘yin!","🤝 Omad, raqib!","🙌 Ajoyib!","💯 Zo‘r o‘ynayapsan!","🫡 Hurmat!","👏 Chiroyli yurish!","🧠 Ustalik bilan!","🌟 Barakalla!","🏅 Haqiqiy mahorat!","🤜🤛 Kuchli raqib!","❤️ O‘yin uchun rahmat!","🙏 Rahmat, do‘stim!","🎖️ Munosib raqib!","🤝 Yana o‘ynaymiz!","🏆 G‘alabang muborak!"]],["😬","Omadsizlik",["😅 Omadsizlik!","🤦 Qanday xato!","😭 Voy, donam ketdi!","💔 Bu og‘riqli bo‘ldi!","🥲 Buni kutmagandim!","😵 Vaziyat yomonlashdi!","🙈 Xatoni ko‘rmadim!","😓 Endi nima qilaman?","💀 Tamom bo‘ldim!","🫠 Vaziyat erib ketdi!","😩 Bitta dona qoldi!","🤯 Qanday qilib?!","🥶 Sovuq dush!","📉 Ustunlik qo‘ldan ketdi!","🫥 Jim bo‘lib qoldim..."]],["🏆","G‘alaba",["🏆 Yutding!","🎉 G‘alaba!","👑 Men chempionman!","🔥 Zo‘r g‘alaba!","🥇 Birinchi o‘rin!","😎 Men aytgandim!","💪 Kuchlilar g‘alaba qozonadi!","🏳️ Taslim bo‘laman!","😅 Bu safar seniki!","🤝 Durang?","🥲 Keyingi safar yutaman!","🔄 Qayta o‘ynaymiz!","🏆 G‘alaba shirin!","👏 Munosib g‘alaba!","🎮 Yana bir partiya!"]],["⏳","Vaqt",["⏩ Tezroq yur!","⏰ Vaqt ketyapti!","🐢 Juda sekin!","⚡ Tezroq!","⌛ Kutib turibman!","🕐 Vaqting oz qoldi!","🏃 Qani, yur!","😴 Uxlab qoldingmi?","🤔 Hali ham o‘ylayapsanmi?","🚦 Navbat senda!","🔔 Yurish vaqti!","🧘 Shoshilma, lekin yur!","⏳ Vaqt tugayapti!","👀 Kutamiz...","⚡ Tezkor o‘yin!"]],["🤔","Hayrat",["🤔 O‘ylayapsanmi?","😳 Rostdanmi?","😮 Voy-bo‘!","🤯 Aql bovar qilmaydi!","🧐 Qiziq yurish!","👀 Buni kutmagandim!","😲 Qanday kombinatsiya!","🤨 Ishonching komilmi?","😱 Bunaqa ham bo‘ladimi?!","🫢 Kutilmagan yurish!","🧩 Rejangni tushunmadim!","🤔 Nima maqsad?","😏 Nimadir rejalashtiryapsan!","🕵️ Bir sir bor...","💭 O‘ylab ko‘ray..."]],["💪","Ruhlantirish",["💪 Sen uddalaysan!","🔥 Olg‘a!","🚀 To‘xtama!","🦁 Kurashni davom ettir!","🌟 Hammasi oldinda!","🙌 Ishon o‘zingga!","💯 Zo‘r ketyapsan!","🏆 G‘alabaga intil!","⚡ Kuchingni ko‘rsat!","🎯 Maqsad sari!","💪 Taslim bo‘lma!","🔥 Oxirigacha!","🌈 Hali imkon bor!","🧠 Aql bilan yut!","🥇 Chempion bo‘l!"]],["😎","Maqtanish",["😎 Shashka ustasi!","👑 Men qirolman!","🔥 Menga teng keladigani yo‘q!","🏆 G‘alaba meniki!","💪 Kuchimni ko‘rdingmi?","😏 Hammasi nazoratda!","🧠 Ustalik shu!","🥷 Sokin, lekin xavfli!","🎯 Bir zarbada!","👑 Maydon hukmdori!","😎 Professional daraja!","💎 Mening uslubim!","🚀 Darajam boshqa!","🦾 Kuchli o‘yinchi!","🏅 Tajriba gapiradi!"]],["🔁","Takliflar",["🤝 Durang?","🔄 Qayta o‘ynaymizmi?","🎮 Yana bir partiya?","⏸️ Biroz tanaffus?","🤔 Durangga rozimisan?","🔥 Yana bir jang!","🏆 Revansh qilamizmi?","🙌 Tayyor bo‘lsang, boshlaymiz!","🤜🤛 Kelishdik!","🔁 Yana urinib ko‘r!","🎯 Rematch?","🫱🏻‍🫲🏼 Kelishuv?","🕹️ O‘yinni davom ettiramiz!","💪 Ikkinchi raund?","👋 Keyingi safargacha!"]],["⚔️","Shashka",["♟️ Shashka ustasi!","👑 Dama bo‘ldi!","💥 Urib ol!","🔗 Zanjirli zarba!","🪤 Tuzoq tayyor!","🎯 Donani saqla!","🛡️ Himoyani mustahkamla!","⚔️ Hujum vaqti!","🔄 Donalarni almashtiramizmi?","🧩 Kombinatsiyani ko‘r!","🏃 Dama tomon yur!","👀 Donangni ehtiyot qil!","💎 Damani yo‘qotma!","🔥 Oxirgi donagacha!","🏆 Shashka — aql o‘yini!"]]];
    var elQ = root.querySelector("#rcQuick");
    elQ.style.cssText = "margin-top:6px";
    var tabs = document.createElement("div");
    tabs.style.cssText = "display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;align-items:center";
    var lab = document.createElement("div");
    lab.style.cssText = "font-size:12px;opacity:.7;margin-bottom:4px";
    var box = document.createElement("div");
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;max-height:112px;overflow-y:auto";
    function showCat(i) {
      box.innerHTML = "";
      lab.textContent = CATS[i][1];
      for (var k = 0; k < tabs.children.length; k++) tabs.children[k].style.background = k === i ? "#6b5cf0" : "";
      CATS[i][2].forEach(function (p) {
        var bt = document.createElement("button");
        bt.textContent = p; bt.style.cssText = "padding:7px 10px;border-radius:12px;font-size:14px";
        bt.onclick = function () { send({ type: "roomChat", roomId: roomId, text: p }); };
        box.appendChild(bt);
      });
    }
    CATS.forEach(function (c, i) {
      var t = document.createElement("button");
      t.textContent = c[0]; t.style.cssText = "flex:none;padding:6px 10px;border-radius:12px;font-size:18px";
      t.onclick = function () { showCat(i); };
      tabs.appendChild(t);
    });
    var xb = document.createElement("button");
    xb.textContent = "⬅️"; xb.style.cssText = "flex:none;padding:6px 12px;border-radius:12px;font-size:16px";
    xb.onclick = function () { elChatBtn.click(); };
    var hd = document.createElement("div"); hd.style.cssText = "display:flex;gap:6px;align-items:center"; tabs.style.flex = "1"; tabs.style.minWidth = "0"; hd.appendChild(xb); hd.appendChild(tabs);
    elQ.appendChild(hd); elQ.appendChild(lab); elQ.appendChild(box);
    showCat(0);
    elInput.addEventListener("keydown", function (e) { if (e.key === "Enter") sendChat(); });

    function addMsg(msg) {
      var row = document.createElement("div");
      var who = document.createElement("b");
      who.textContent = (msg.color === "white" ? "⚪ " : msg.color === "black" ? "⚫ " : "👁 ") + msg.name + ": ";
      who.style.color = msg.color === "spectator" ? "#8aa" : "#e3b746";
      var tx = document.createElement("span");
      tx.textContent = msg.text;
      row.appendChild(who); row.appendChild(tx);
      elMsgs.appendChild(row);
    }
    function renderChat() {
      elChat.style.display = st.chatOpen ? "" : "none";
      elChatBtn.textContent = "💬 Chat" + (st.unread ? " (" + st.unread + ")" : "");
    }
    function rebuildChat() {
      elMsgs.innerHTML = "";
      for (var i = 0; i < st.chat.length; i++) addMsg(st.chat[i]);
      elMsgs.scrollTop = elMsgs.scrollHeight;
    }

    // vaqt rejimi tugmalari (faqat o'yin boshlanmaguncha, faqat oq tanlaydi)
    function renderTc() {
      elTc.innerHTML = "";
      var canPick = st.color === "white" && st.moves.length === 0 && !st.finished;
      if (!canPick) { elTc.style.display = "none"; return; }
      elTc.style.display = "flex";
      st.tcs.forEach(function (tc) {
        var b = document.createElement("button");
        b.textContent = tc;
        b.style.cssText = tc === st.tc ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
        b.onclick = function () { send({ type: "roomSetTime", roomId: roomId, tc: tc });
      elTc.style.flexWrap = "wrap";
      var sep = document.createElement("span");
      sep.style.cssText = "flex-basis:100%;height:0";
      elTc.appendChild(sep);
      [["std", "📋 Standart"], ["idf", "🎲 IDF 780"]].forEach(function (pp) {
        var pb = document.createElement("button");
        pb.textContent = pp[1];
        var on = (pp[0] === "idf") === !!st.opening;
        pb.style.cssText = on ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
        pb.onclick = function () { send({ type: "roomSetPos", roomId: roomId, pos: pp[0] }); };
        elTc.appendChild(pb);
      }); };
        elTc.appendChild(b);
      });
    }

    // ---------- yordamchilar ----------
    function myCode() { return st.color === "white" ? WHITE : BLACK; }
    function codeOf(color) { return color === "white" ? WHITE : BLACK; }
    function sideName(color) { return color === "white" ? "Oq" : "Qora"; }
    function flipped() { return st.color === "black"; }
    function bothIn() { return !!(st.white && st.black); }

    function computeForced(step) {
      // yurishdan keyin shu dona yana urishi kerakmi
      if (!step || !step.captures || !step.captures.length) return null;
      var p = st.board[step.to.r][step.to.c];
      if (!p) return null;
      var pc = isWhite(p) ? "white" : "black";
      if (pc !== st.turn) return null;
      return captureSteps(st.board, step.to.r, step.to.c).length ? { r: step.to.r, c: step.to.c } : null;
    }

    function rebuild() {
      var b = startBoard();
      for (var i = 0; i < st.moves.length; i++) b = applyStep(b, st.moves[i]);
      st.board = b;
      st.forced = computeForced(st.moves[st.moves.length - 1]);
      st.selected = null;
      st.pending = false;
    }

    function send(obj) {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
    }

    function options() {
      // tanlangan dona uchun mumkin bo'lgan yurishlar
      if (!st.selected) return [];
      var caps = allCaptures(st.board, myCode());
      return caps.length
        ? captureSteps(st.board, st.selected.r, st.selected.c)
        : simpleSteps(st.board, st.selected.r, st.selected.c);
    }

    // ---------- chizish ----------
    function nameLine(color) {
      var nm = st[color], on = st[color + "Online"];
      var dot = color === "white" ? "⚪" : "⚫";
      return dot + " " + (nm ? (on ? "🟢 " : "🔴 ") + nm : "kutilmoqda…") +
        (st.color === color ? "  (siz)" : "");
    }

    // ismi chapda, soat o'ngda
    function fillLine(el, color) {
      el.innerHTML = "";
      el.style.display = "flex";
      el.style.justifyContent = "space-between";
      el.style.alignItems = "center";
      var l = document.createElement("span");
      l.textContent = nameLine(color) + (st.berserk && st.berserk[color] ? " ⚡" : "");
      var r = document.createElement("span");
      r.setAttribute("data-clock", color);
      r.style.cssText = "font-weight:bold;min-width:64px;text-align:center;padding:3px 8px;border-radius:6px;background:#1c2733";
      el.appendChild(l);
      el.appendChild(r);
    }

    function remaining(color) {
      var ms = st.clock[color] || 0;
      if (st.clockRunning && !st.finished && st.turn === color) ms -= performance.now() - st.clockAt;
      return Math.max(0, ms);
    }

    function fmt(ms) {
      var sec = Math.ceil(ms / 1000), m = Math.floor(sec / 60), s = sec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function updateClocks() {
      var els = root.querySelectorAll("[data-clock]");
      for (var i = 0; i < els.length; i++) {
        var color = els[i].getAttribute("data-clock"), ms = remaining(color);
        els[i].textContent = fmt(ms);
        var active = st.clockRunning && !st.finished && st.turn === color;
        els[i].style.background = active ? (ms < 30000 ? "#7a1f1f" : "#2b4a1f") : "#1c2733";
        els[i].style.color = ms < 30000 && active ? "#ffb4b4" : "#fff";
      }
    }

    function setClock(clock, running) {
      if (clock) st.clock = clock;
      st.clockRunning = !!running;
      st.clockAt = performance.now();
    }

    // ---------- platforma doskasi uslubi (mavzu, dona, qirol) ----------
    var themeCssDone = false;
    function cloneThemeCss() {
      if (themeCssDone) return;
      var css = "";
      try {
        for (var i = 0; i < document.styleSheets.length; i++) {
          var rules;
          try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
          for (var j = 0; j < rules.length; j++) {
            var t = rules[j].cssText || "";
            if (t.indexOf("#board[") === 0) css += t.replace(/#board\[/g, "#rcBoard[") + "\n";
          }
        }
      } catch (e) {}
      if (/edeon/.test(css)) themeCssDone = true;
    if (css) {
      var old = document.getElementById("rcThemeCss"); if (old) old.remove();
      var el = document.createElement("style"); el.id = "rcThemeCss";
      el.textContent = css;
        document.head.appendChild(el);
      }
    }

    function applySkin() {
      cloneThemeCss();
      var th = "edeon", ps = "glossy", km = "\u265B", pz = "80";
      try {
        if (typeof S === "object" && S) { th = S.th || th; ps = S.ps || ps; km = S.km || km; pz = S.pz || pz; }
      } catch (e) {}
      if (!/^(classic|green|blue|gray|walnut|purple|sand|ocean|rose|olive|photo|edeon)$/.test(th)) th = "edeon";
      elBoard.dataset.th = th;
      elBoard.dataset.ps = ps;
      elBoard.style.setProperty("--km", "'" + km + "'");
      elBoard.style.setProperty("--pz", pz + "%");
    }

    function render() {
      var fl = flipped();
      var topColor = fl ? "white" : "black";
      var bottomColor = fl ? "black" : "white";
      fillLine(elTop, topColor);
      fillLine(elBottom, bottomColor);
      updateClocks();

      var opts = options();
      applySkin();
      var lastMv = st.moves.length ? st.moves[st.moves.length - 1] : null;
      elBoard.innerHTML = "";
      for (var dr = 0; dr < 8; dr++) {
        for (var dc = 0; dc < 8; dc++) {
          var r = fl ? 7 - dr : dr, c = fl ? 7 - dc : dc;
          var cell = document.createElement("div");
          cell.className = "cell sq " + (((r + c) % 2) ? "d" : "l");
          cell.dataset.r = r; cell.dataset.c = c;
          if (lastMv && lastMv.from && lastMv.to &&
              ((lastMv.from.r === r && lastMv.from.c === c) || (lastMv.to.r === r && lastMv.to.c === c))) cell.classList.add("lm");
          if (st.selected && st.selected.r === r && st.selected.c === c) cell.classList.add("sel");
          for (var k = 0; k < opts.length; k++) {
            if (opts[k].to.r === r && opts[k].to.c === c) cell.classList.add(opts[k].captures.length ? "cp" : "tg");
          }
          var p = st.board[r][c];
          if (p) {
            var pc = document.createElement("i");
            pc.className = "piece pc " + (isWhite(p) ? "w" : "b") + (isKing(p) ? " k" : "");
            cell.appendChild(pc);
          }
          elBoard.appendChild(cell);
        }
      }

      // holat matni
      var t;
      if (!st.connected) t = "🔌 Ulanmoqda… (server uyg‘onishi 50 soniyagacha cho‘zilishi mumkin)";
      else if (!st.joined) t = "⏳ Xonaga kirilmoqda…";
      else if (st.finished) {
        var tm = st.reason === "timeout" ? "⏰ Vaqt tugadi · " : "";
        if (st.winner === "draw") t = "🤝 Durang (kelishildi)";
        else if (st.color === "spectator") t = tm + "🏆 " + sideName(st.winner) + " g‘alaba qozondi";
        else t = tm + (st.winner === st.color ? "🏆 Siz g‘alaba qozondingiz!" : "😔 Siz yutqazdingiz");
      }
      else if (!bothIn()) t = "⏳ Raqib kutilmoqda…";
      else if (st.color === "spectator") t = "👁 Tomoshabin · navbat: " + sideName(st.turn);
      else if (st.turn === st.color) t = st.forced ? "🔴 Yana urish majburiy!" : "✅ Sizning navbatingiz";
      else t = "⏳ Raqib yurishi kutilmoqda";
      elStatus.textContent = t;

      var playing = st.color !== "spectator" && !st.finished && bothIn();
      elResign.style.display = playing ? "" : "none";
      var _tb = document.getElementById("rcAn");
      if (!_tb) {
        _tb = document.createElement("button"); _tb.id = "rcAn"; _tb.textContent = "🔍 Tahlil";
        elResign.parentNode.appendChild(_tb);
        _tb.onclick = function () { window.spAnalyze({ moves: st.moves, white: nameLine("white"), black: nameLine("black"), winner: st.winner }); };
      }
      _tb.style.display = (st.finished && st.moves.length) ? "" : "none";
      elDrawOffer.style.display = (playing && st.moves.length >= 2 && !st.drawOffer) ? "" : "none";
      var canBz = playing && st.arena && st.berserk && !st.berserk[st.color] &&
        (st.color === "white" ? st.moves.length === 0 : st.moves.length <= 1);
      elBerserk.style.display = canBz ? "" : "none";
      if (!st.finished && st.drawOffer && st.color !== "spectator") {
        elDraw.style.display = "";
        var mine = st.drawOffer === st.color;
        elDrawText.textContent = mine ? "🤝 Durang taklif qildingiz. Raqib javobi kutilmoqda…" : "🤝 Raqib durang taklif qilmoqda";
        root.querySelector("#rcDrawYes").style.display = mine ? "none" : "";
        root.querySelector("#rcDrawNo").style.display = mine ? "none" : "";
      } else elDraw.style.display = "none";
      renderTc();
      renderChat();
      elInfo.textContent = (st.color === "spectator"
        ? "Siz tomoshabinsiz" + (st.spectators ? " · " + st.spectators + " ta tomoshabin" : "")
        : (st.spectators ? "👁 Tomoshabinlar: " + st.spectators : "")) +
        (bothIn() && !st.finished && !st.clockRunning && st.timeMs
          ? (st.spectators || st.color === "spectator" ? "\n" : "") + "⏱ " + st.tc + " (daqiqa + soniya) · soat birinchi ikki yurishdan keyin ishga tushadi"
          : "");
      elInfo.style.whiteSpace = "pre-line";
      if (st.opening) elInfo.textContent = "📖 IDF " + st.opening.id + (elInfo.textContent ? "\n" + elInfo.textContent : "");
    }

    // ---------- bosish ----------
    elBoard.addEventListener("click", function (e) {
      var cell = e.target.closest(".cell");
      if (!cell) return;
      onCell(Number(cell.dataset.r), Number(cell.dataset.c));
    });

    function onCell(r, c) {
      if (!st.joined || st.finished || st.pending) return;
      if (st.color === "spectator" || !bothIn()) return;
      if (st.turn !== st.color) return;
      var me = myCode(), p = st.board[r][c], mv;

      if (st.forced) {
        var fo = captureSteps(st.board, st.forced.r, st.forced.c);
        for (var i = 0; i < fo.length; i++) if (fo[i].to.r === r && fo[i].to.c === c) mv = fo[i];
        if (mv) sendMove(mv);
        return;
      }

      if (sameSide(p, me)) {
        var caps = allCaptures(st.board, me);
        var ok = caps.length ? captureSteps(st.board, r, c).length : simpleSteps(st.board, r, c).length;
        st.selected = ok ? { r: r, c: c } : null;
        render();
        return;
      }

      var o = options();
      for (var j = 0; j < o.length; j++) if (o[j].to.r === r && o[j].to.c === c) mv = o[j];
      if (mv) sendMove(mv);
    }

    function sendMove(mv) {
      var nb = applyStep(st.board, mv);
      var keep = mv.captures.length > 0 && captureSteps(nb, mv.to.r, mv.to.c).length > 0;
      st.pending = true;
      send({ type: "roomMove", roomId: roomId, move: mv, keepTurn: keep });
      try { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light"); } catch (e) {}
    }

    // ---------- server ----------
    function onMessage(m) {
      if (m.type === "roomState" && m.roomId === roomId) {
        st.joined = true;
        st.color = m.color;
        st.white = m.white; st.black = m.black;
        st.whiteOnline = m.whiteOnline; st.blackOnline = m.blackOnline;
        st.spectators = m.spectators || 0;
        var openNew = (m.opening ? m.opening.id : null) !== (st.opening ? st.opening.id : null);
        st.opening = m.opening || null;
        var same = !openNew && st.moves.length === (m.moves || []).length && st.turn === m.turn;
        st.moves = m.moves || [];
        st.turn = m.turn;
        st.finished = !!m.finished;
        st.winner = m.winner;
        st.reason = m.reason || null;
        st.timeMs = m.timeMs || 0;
        st.incMs = m.incMs || 0;
        st.tc = m.tc || "";
        st.tcs = m.tcs || [];
        st.drawOffer = m.drawOffer || null;
        st.arena = !!m.arena;
        st.berserk = m.berserk || { white: false, black: false };
        if (m.chat) { st.chat = m.chat; rebuildChat(); }
        setClock(m.clock, m.clockRunning);
        if (!same) rebuild();   // yurishlar o'zgarmagan bo'lsa, tanlov saqlanadi
        render();
      } else if (m.type === "roomMove" && m.roomId === roomId) {
        st.moves.push(m.move);
        var _pp = st.board[m.move.from.r] && st.board[m.move.from.r][m.move.from.c];
        st.board = applyStep(st.board, m.move);
        soundForMove(m.move, _pp);
        st.turn = m.turn;
        setClock(m.clock, m.clockRunning);
        st.pending = false;
        st.selected = null;
        st.forced = computeForced(m.move);
        render();
        // navbat o'tgan bo'lsa va yurish qolmagan bo'lsa — o'yin tugaydi
        if (m.turn !== m.color && st.color !== "spectator" && !st.finished) {
          if (!allMoves(st.board, codeOf(m.turn)).length) {
            send({ type: "roomFinish", roomId: roomId, winner: m.color });
          }
        }
      } else if (m.type === "roomDraw" && m.roomId === roomId) {
        st.drawOffer = m.offer || null;
        if (m.declined) elInfo.textContent = "❌ Durang taklifi rad etildi";
        render();
        if (m.declined) elInfo.textContent = "❌ Durang taklifi rad etildi";
      } else if (m.type === "roomBerserk" && m.roomId === roomId) {
        st.berserk[m.color] = true;
        setClock(m.clock, st.clockRunning);
        render();
      } else if (m.type === "roomChat" && m.roomId === roomId) {
        st.chat.push(m.msg);
        if (st.chat.length > 50) st.chat.shift();
        addMsg(m.msg);
        if (st.chatOpen) elMsgs.scrollTop = elMsgs.scrollHeight;
        else { st.unread++; renderChat(); }
      } else if (m.type === "roomFinished" && m.roomId === roomId) {
        st.finished = true;
        st.drawOffer = null;
        st.winner = m.winner;
        st.reason = m.reason || null;
        setClock(m.clock, false);
        render();
        try { if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success"); } catch (e) {}
      } else if (m.type === "error") {
        st.pending = false;
        elInfo.textContent = "⚠️ " + (m.message || "Xato");
      }
    }

    function connect() {
      var proto = location.protocol === "https:" ? "wss://" : "ws://";
      try { ws = new WebSocket(proto + location.host); } catch (e) { return setTimeout(connect, 3000); }
      ws.onopen = function () {
        st.connected = true;
        var name = "";
        try { name = tg.initDataUnsafe.user.first_name || ""; } catch (e) {}
        send({
          type: "roomJoin", roomId: roomId,
          initData: (tg && tg.initData) || "",
          name: name || ("Mehmon-" + gid.slice(0, 3).toUpperCase()),
          guestId: gid
        });
        render();
      };
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        onMessage(m);
      };
      ws.onclose = function () {
        st.connected = false; st.joined = false; st.pending = false;
        render();
        setTimeout(connect, 2500);
      };
      ws.onerror = function () { try { ws.close(); } catch (e) {} };
    }

    hb = setInterval(function () { send({ type: "roomSync", roomId: roomId }); }, 25000);
    setInterval(updateClocks, 250);
    render();
    connect();
  }
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

