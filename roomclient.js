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
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) roomId = String(tg.initDataUnsafe.start_param);
    if (!roomId && q.get("room")) roomId = q.get("room");
    if (!ROOM_RE.test(roomId)) return; // xona rejimi emas
    try { if (tg) { tg.ready(); tg.expand(); if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } } catch (e) {}
    start(roomId, tg);
  });

  function start(roomId, tg) {
    var st = {
      color: "spectator", turn: "white", board: initialBoard(), moves: [],
      white: null, black: null, whiteOnline: false, blackOnline: false,
      spectators: 0, finished: false, winner: null,
      selected: null, forced: null, pending: false, connected: false, joined: false
    };
    var ws = null, hb = null;

    // ---------- UI ----------
    var root = document.createElement("div");
    root.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#0b1017;color:#fff;font-family:Arial,sans-serif;" +
      "display:flex;flex-direction:column;align-items:center;overflow:auto;" +
      "padding:calc(env(safe-area-inset-top,0px) + 10px) 10px 14px";
    root.innerHTML =
      '<div style="font-weight:bold;font-size:18px">♟️ ShashkaPRO</div>' +
      '<div id="rcStatus" style="margin:8px 0;color:#e3b746;min-height:22px;text-align:center"></div>' +
      '<div id="rcTop" style="width:min(94vw,520px);padding:4px 2px;font-size:15px"></div>' +
      '<div id="rcBoard" style="width:min(94vw,520px);aspect-ratio:1;display:grid;grid-template-columns:repeat(8,1fr);' +
      'grid-template-rows:repeat(8,1fr);border:6px solid #302217;border-radius:10px;overflow:hidden;' +
      'box-shadow:0 12px 35px #0009;touch-action:manipulation"></div>' +
      '<div id="rcBottom" style="width:min(94vw,520px);padding:4px 2px;font-size:15px"></div>' +
      '<div style="display:flex;gap:10px;margin-top:10px">' +
      '<button id="rcResign" style="display:none">🏳️ Taslim</button>' +
      '<button id="rcClose">✖️ Yopish</button></div>' +
      '<div id="rcInfo" style="margin-top:10px;font-size:13px;opacity:.7;text-align:center"></div>';
    document.body.appendChild(root);

    var elStatus = root.querySelector("#rcStatus");
    var elTop = root.querySelector("#rcTop");
    var elBottom = root.querySelector("#rcBottom");
    var elBoard = root.querySelector("#rcBoard");
    var elResign = root.querySelector("#rcResign");
    var elInfo = root.querySelector("#rcInfo");

    root.querySelector("#rcClose").onclick = function () {
      if (tg && tg.close) tg.close(); else root.style.display = "none";
    };
    elResign.onclick = function () {
      if (st.finished || st.color === "spectator") return;
      if (confirm("Taslim bo‘lasizmi?")) send({ type: "roomResign", roomId: roomId });
    };

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
      var b = initialBoard();
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

    function render() {
      var fl = flipped();
      var topColor = fl ? "white" : "black";
      var bottomColor = fl ? "black" : "white";
      elTop.textContent = nameLine(topColor);
      elBottom.textContent = nameLine(bottomColor);

      var opts = options();
      elBoard.innerHTML = "";
      for (var dr = 0; dr < 8; dr++) {
        for (var dc = 0; dc < 8; dc++) {
          var r = fl ? 7 - dr : dr, c = fl ? 7 - dc : dc;
          var cell = document.createElement("div");
          cell.className = "cell " + (((r + c) % 2) ? "dark" : "light");
          cell.dataset.r = r; cell.dataset.c = c;
          if (st.selected && st.selected.r === r && st.selected.c === c) cell.classList.add("selected");
          for (var k = 0; k < opts.length; k++) {
            if (opts[k].to.r === r && opts[k].to.c === c) cell.classList.add(opts[k].captures.length ? "capture" : "target");
          }
          var p = st.board[r][c];
          if (p) {
            var pc = document.createElement("div");
            pc.className = "piece " + (isWhite(p) ? "white" : "black") + (isKing(p) ? " king" : "");
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
        if (st.winner === "draw") t = "🤝 Durang";
        else if (st.color === "spectator") t = "🏆 " + sideName(st.winner) + " g‘alaba qozondi";
        else t = st.winner === st.color ? "🏆 Siz g‘alaba qozondingiz!" : "😔 Siz yutqazdingiz";
      }
      else if (!bothIn()) t = "⏳ Raqib kutilmoqda…";
      else if (st.color === "spectator") t = "👁 Tomoshabin · navbat: " + sideName(st.turn);
      else if (st.turn === st.color) t = st.forced ? "🔴 Yana urish majburiy!" : "✅ Sizning navbatingiz";
      else t = "⏳ Raqib yurishi kutilmoqda";
      elStatus.textContent = t;

      elResign.style.display = (st.color !== "spectator" && !st.finished && bothIn()) ? "" : "none";
      elInfo.textContent = st.color === "spectator"
        ? "Siz tomoshabinsiz" + (st.spectators ? " · " + st.spectators + " ta tomoshabin" : "")
        : (st.spectators ? "👁 Tomoshabinlar: " + st.spectators : "");
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
        var same = st.moves.length === (m.moves || []).length && st.turn === m.turn;
        st.moves = m.moves || [];
        st.turn = m.turn;
        st.finished = !!m.finished;
        st.winner = m.winner;
        if (!same) rebuild();   // yurishlar o'zgarmagan bo'lsa, tanlov saqlanadi
        render();
      } else if (m.type === "roomMove" && m.roomId === roomId) {
        st.moves.push(m.move);
        st.board = applyStep(st.board, m.move);
        st.turn = m.turn;
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
      } else if (m.type === "roomFinished" && m.roomId === roomId) {
        st.finished = true;
        st.winner = m.winner;
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
          name: name || "Mehmon"
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
    render();
    connect();
  }
})();
