// rooms.js — guruh o'yinlari uchun xonalar (Mini App orqali).
// Birinchi kirgan = oq (white), ikkinchi = qora (black), qolganlar = tomoshabin.
const crypto = require("crypto");
const DRAW = require("./draw-rules"); // IDF durang qoidalari (8.2.3 - 8.2.25)

const ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
const MAX_MOVES = 1000;
const IDLE_MS = 6 * 60 * 60 * 1000;
// Vaqt rejimlari: [boshlang'ich soniya, har yurishdan keyin qo'shiladigan soniya]
const TCS = { "1+1": [60, 1], "2+2": [120, 2], "3+2": [180, 2], "5+3": [300, 3], "7+5": [420, 5], "0.5+0": [30, 0] };
const DEFAULT_TC = "5+3";
// erkin vaqt: "daqiqa+soniya" (1–60 daq, 0–30 s qo'shimcha)
function tcParse(k) { if (TCS[k]) return TCS[k]; const m = /^(\d{1,2})\+(\d{1,2})$/.exec(String(k || "")); if (!m) return null; const a = +m[1], b = +m[2]; return (a >= 1 && a <= 60 && b <= 30) ? [a * 60, b] : null; }
const CHAT_KEEP = 50;
const CHAT_MAX = 200;
// 🤖 ShashkaBot: serverda faqat "o'rindiq", yurishlarni o'yinchining telefoni hisoblaydi (roomBotMove)
const isBotUid = u => typeof u === "string" && (u === "bot" || u.indexOf("bot_") === 0);
const BOT_TCS = ["1+1", "2+2", "3+2", "5+3"];

// Telegram Mini App initData imzosini tekshirish (BOT_TOKEN Render'da Environment'ga yoziladi)
function verifyInitData(initData) {
  const token = process.env.BOT_TOKEN;
  if (!token || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dcs = [...params.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => k + "=" + v)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calc = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
  if (calc.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const age = Date.now() / 1000 - Number(params.get("auth_date") || 0);
  if (age > 86400) return null;
  try {
    const u = JSON.parse(params.get("user") || "null");
    if (!u || !u.id) return null;
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "Player";
    return { id: String(u.id), name: name.slice(0, 20) };
  } catch {
    return null;
  }
}

function createRooms({ send, clients, onFinish }) {
  const rooms = new Map();
  const results = []; // tugagan o'yinlar natijasi (bot olib turadi)

  const other = col => (col === "white" ? "black" : "white");
  const botColorOf = room => (room.vsBot ? (room.white && isBotUid(room.white.uid) ? "white" : (room.black && isBotUid(room.black.uid) ? "black" : null)) : null);
  // vaqt/pozitsiya/rangni kim tanlaydi: oddiy xonada oq, bot xonasida odam (qaysi rangda bo'lmasin)
  const isOwner = (room, col) => !!col && (room.vsBot ? col !== botColorOf(room) : col === "white");

  function colorOf(room, c) {
    if (room.white && room.white.clientId === c.id) return "white";
    if (room.black && room.black.clientId === c.id) return "black";
    return null;
  }

  function isOnline(seat) {
    return !!(seat && clients.get(seat.clientId));
  }

  // Soat: har ikki tomonning birinchi yurishi bepul, undan keyin navbatdagi o'yinchi vaqti ketadi.
  function clockRunning(room) {
    if (room.vsBot) return false;   // bot bilan o'yin vaqtsiz
    return !!(room.white && room.black && !room.finished && room.plies >= 2);
  }

  function currentClock(room) {
    const c = { white: room.clock.white, black: room.clock.black };
    if (clockRunning(room)) {
      c[room.turn] = Math.max(0, c[room.turn] - (Date.now() - room.turnStartedAt));
    }
    return c;
  }

  function _pi(seat) {
    try {
      if (!seat || !seat.uid) return null;
      if (isBotUid(seat.uid)) return { uid: seat.uid, elo: 0, av: false, bot: true };
      var u = require("./store.js").users()[String(seat.uid)] || {};
      return { uid: String(seat.uid), elo: u.elo || 1000, av: !!u.avatar };
    } catch (e) { return null; }
  }
  function snapshot(room, color) {
    return {
      type: "roomState",
      roomId: room.id,
      color: color || "spectator",
      white: room.white ? room.white.name : null,
      wInfo: _pi(room.white), bInfo: _pi(room.black),
      black: room.black ? room.black.name : null,
      whiteOnline: isOnline(room.white),
      blackOnline: isOnline(room.black),
      spectators: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).length,
      spectatorNames: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).map(id => room.names.get(id) || "Mehmon").slice(0, 8),
      moves: room.moves,
      turn: room.turn,
      finished: room.finished,
      winner: room.winner,
      reason: room.reason,
      clock: currentClock(room),
      clockRunning: clockRunning(room),
      timeMs: room.timeMs,
      incMs: room.incMs,
      tc: room.tc,
      tcs: room.vsBot ? BOT_TCS : Object.keys(TCS).filter(k => k !== "0.5+0" && k !== "7+5"),
      vsBot: !!room.vsBot, botStarted: !!room.botStarted, botColor: botColorOf(room),
      botSecs: room.botCfg ? room.botCfg.secs : 1.2, botBlunder: room.botCfg ? room.botCfg.blunder : 0,
      arena: !!room.arena, noBerserk: !!room.noBerserk, voice: !!room.voice, voiceSaid: room.voiceSaid || null,
      opening: room.opening,
      berserk: room.berserk,
      drawOffer: room.drawOffer,
      drawInfo: (room.dr && room.dr.st && room.dr.st.info) || null,
      drawText: room.drawText || null,
      canDraw: DRAW.canOfferDraw(room.dr && room.dr.st),
      chat: room.chat, gamesTotal: room.gamesTotal || 1, played: room.played || 0, seriesScore: (room.gamesTotal > 1 ? { white: (room.white && room.pts && room.pts[room.white.uid]) || 0, black: (room.black && room.pts && room.pts[room.black.uid]) || 0 } : null), seriesDone: (room.gamesTotal > 1 && (room.played || 0) >= room.gamesTotal), nextIn: !!room.nextTimer, rematch: room.rematch || null, casual: !!room.casual
    };
  }

  function broadcast(room, data) {
    for (const id of room.members) {
      const cl = clients.get(id);
      if (cl) send(cl.ws, data);
    }
  }

  function pushState(room) {
    for (const id of room.members) {
      const cl = clients.get(id);
      if (cl) send(cl.ws, snapshot(room, colorOf(room, cl)));
    }
  }

  function startNextGame(room, swap, fresh) {
    if (room.nextTimer) { clearTimeout(room.nextTimer); room.nextTimer = null; }
    if (fresh) { room.played = 0; room.pts = {}; }
    if (swap) { const t = room.white; room.white = room.black; room.black = t; }
    if (room.opening) {
      if (fresh || (room.played || 0) % 2 === 0) {
        const o = pickIdf();
        if (o && o.board) room.opening = { id: String(o.id), board: String(o.board), side: o.side === "b" ? "b" : "w" };
      }
    }
    room.moves = [];
    room.finished = false; room.winner = null; room.reason = null; room.plies = 0; room.waitSince = 0;
    room.clock = { white: room.timeMs, black: room.timeMs };
    room.berserk = { white: false, black: false };
    room.drawOffer = null; room.offerPly = { white: -1, black: -1 };
    room.dr = null; room.drawText = null; // yangi o'yin: durang sanog'i noldan
    room.turnStartedAt = 0; room.rematch = null; room.lastActive = Date.now();
    room.turn = room.opening && room.opening.side === "b" ? "black" : "white";
    room.first = room.turn;
    pushState(room);
  }

  function afterFinish(room, winner) {
    if (room.nextTimer) { clearTimeout(room.nextTimer); room.nextTimer = null; }
    room.rematch = null;
    if (!(room.gamesTotal > 1) || room.arena || room.locked) return;
    const wu = room.white && room.white.uid, bu = room.black && room.black.uid;
    if (!wu || !bu) return;
    room.pts = room.pts || {};
    room.pts[wu] = room.pts[wu] || 0; room.pts[bu] = room.pts[bu] || 0;
    if (winner === "white") room.pts[wu] += 1;
    else if (winner === "black") room.pts[bu] += 1;
    else { room.pts[wu] += 0.5; room.pts[bu] += 0.5; }
    room.played = (room.played || 0) + 1;
    if (room.played < room.gamesTotal) {
      room.nextTimer = setTimeout(() => {
        room.nextTimer = null;
        if (rooms.get(room.id) !== room || !room.finished || !room.white || !room.black) return;
        startNextGame(room, true, false);
      }, 5000);
    }
    pushState(room);
  }

  
  const BOT_COINS = { bot_easy: 1, bot_mid: 2, bot: 3, bot_pro: 5, bot_gm: 8, bot_champ: 12 };
  const BOT_DAILY = 20, BOT_MIN_PLIES = 8;
  function botReward(room, winner) {
    if (!room.vsBot || !winner || (room.moves || []).length < BOT_MIN_PLIES) return;
    const wu = room.white && room.white.uid, bu = room.black && room.black.uid;
    const botUid = isBotUid(wu) ? wu : isBotUid(bu) ? bu : null;
    const human = isBotUid(wu) ? bu : wu;
    const humanColor = isBotUid(wu) ? 'black' : 'white';
    if (!botUid || !human || winner !== humanColor) return;
    const coins = BOT_COINS[botUid]; if (!coins) return;
    const eco = require('./economy'), u = require('./store').users()[String(human)];
    if (!u) return;
    const day = new Date().toISOString().slice(0, 10);
    if (!u.botDay || u.botDay.day !== day) u.botDay = { day, n: 0 };
    if (u.botDay.n >= BOT_DAILY) return;
    u.botDay.n++;
    eco.add(human, coins, 'bot_win');
    broadcast(room, { type: 'botCoins', roomId: room.id, n: coins });
  }
  function finish(room, winner, reason) {
    if (room.finished) return;
    room.clock = currentClock(room); // soatni to'xtatamiz
    room.finished = true;
    room.drawOffer = null;
    room.winner = winner;
    room.reason = reason || null;
    try { botReward(room, winner); } catch (e) { console.log('botReward:', e.message); }
    try { // kunlik vazifalar: o'yin / g'alaba / botni yutish
      if ((room.moves || []).length >= 8 && room.reason !== 'noshow') {
        const q = require('./quests.js'), seats = { white: room.white && room.white.uid, black: room.black && room.black.uid };
        for (const c of ['white', 'black']) {
          const id = seats[c]; if (!id || isBotUid(id)) continue;
          q.bump(id, 'game');
          if (winner === c) { q.bump(id, 'win'); const o = seats[c === 'white' ? 'black' : 'white']; if (isBotUid(o)) { q.bump(id, 'bot'); try { require('./leagues.js').event(id, 'beat_' + o); } catch (e) {} } }
        }
      }
    } catch (e) { console.log('quests:', e.message); }
    if (!room.vsBot) results.push({
      roomId: room.id,
      winner,
      reason: room.reason,
      white: room.white && room.white.uid,
      black: room.black && room.black.uid,
      whiteName: room.white && room.white.name,
      blackName: room.black && room.black.name,
      moves: room.moves.length,
      at: Date.now()
    });
    if (results.length > 500) results.shift();
    try {
      const st = require('./store'), us = st.users();
      if (room.moves.length) {
        const g = {
          id: room.id, at: Date.now(), w: room.white && room.white.name, b: room.black && room.black.name,
          win: winner || null, why: room.reason || '', tc: room.tc,
          m: room.moves.map(m => [m.from.r, m.from.c, m.to.r, m.to.c, (m.captures || []).map(x => [x.r, x.c])])
        };
        const ids = new Set([room.white && room.white.uid, room.black && room.black.uid].filter(Boolean).map(String));
        for (const uid of ids) {
          const u = us[uid]; if (!u) continue;
          u.arch = u.arch || []; u.arch.unshift(g); if (u.arch.length > 30) u.arch.length = 30;
        }
        st.save();
      }
    } catch (e) { console.log('Arxiv xatosi:', e.message); }
    broadcast(room, { type: "roomFinished", roomId: room.id, winner, reason: room.reason, clock: room.clock, text: room.drawText || undefined }); try { afterFinish(room, winner); } catch (e) { console.error("[afterFinish]", e); }
    if (typeof onFinish === "function") {
      try { onFinish(room); } catch (e) { console.error("[onFinish]", e); }
    }
  }

  let _idf = null;
  function pickIdf() {
    try {
      if (!_idf) {
        const src = require("fs").readFileSync(require("path").join(__dirname, "idf780.js"), "utf8");
        try { _idf = new Function(src + "\n;return IDF780;")(); }
        catch (e) { _idf = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1)); }
      }
    } catch (e) { console.error("[idf780]", e.message); _idf = []; }
    return _idf.length ? _idf[Math.floor(Math.random() * _idf.length)] : null;
  }

  function newRoom(roomId, tcKey) {
    const t = tcParse(tcKey) || TCS[DEFAULT_TC];
    const key = tcParse(tcKey) ? tcKey : DEFAULT_TC;
    return {
      id: roomId,
      white: null,
      black: null,
      members: new Set(),
      moves: [],
      turn: "white",
      finished: false,
      winner: null,
      reason: null,
      plies: 0,
      tc: key,
      timeMs: t[0] * 1000,
      incMs: t[1] * 1000,
      clock: { white: t[0] * 1000, black: t[0] * 1000 },
      arena: false,
      berserk: { white: false, black: false },
      opening: null,
      first: "white",
      drawOffer: null,
      offerPly: { white: -1, black: -1 },
      chat: [],
      names: new Map(),
      turnStartedAt: 0,
      lastActive: Date.now()
    };
  }

  // Zal/turnir uchun: xonani oldindan ochib, o'yinchilarni uid bo'yicha o'rindiqqa qo'yadi
  function create(roomId, opts) {
    if (!ROOM_RE.test(String(roomId))) return null;
    let room = rooms.get(roomId);
    if (room) return room;
    room = newRoom(roomId, opts && opts.tc);
    room.arena = !!(opts && opts.arena);
    room.noBerserk = !!(opts && opts.noBerserk);
    room.locked = !!(opts && opts.locked);
    room.vsBot = !!(opts && opts.vsBot);
    room.voice = !!(opts && opts.voice);   // 🎤 ovozli bellashuv: noto'g'ri yurish aytgan yutqazadi
    room.botCfg = (opts && opts.botCfg) || null;
    room.botStarted = !!room.vsBot;   // bot bilan o'yin birdan boshlanadi
    if (opts && opts.bonus && opts.bonus.ms > 0) {
      const bc = opts.bonus.color === "black" ? "black" : "white";
      room.clock[bc] += Number(opts.bonus.ms);
    }
    if (opts && opts.opening && opts.opening.board) {
      room.opening = { id: String(opts.opening.id), board: String(opts.opening.board), side: opts.opening.side === "b" ? "b" : "w" };
      room.turn = room.opening.side === "b" ? "black" : "white";
      room.first = room.turn;
    }
    if (opts && opts.white) room.white = { uid: String(opts.white.uid), name: opts.white.name, clientId: opts.white.clientId || null };
    if (opts && opts.black) room.black = { uid: String(opts.black.uid), name: opts.black.name, clientId: opts.black.clientId || null };
    rooms.set(roomId, room);
    return room;
  }

  function forfeit(roomId, winner, reason) {
    const room = rooms.get(roomId);
    if (!room || room.finished) return false;
    finish(room, winner, reason || "forfeit");
    return true;
  }

  function err(c, message) {
    send(c.ws, { type: "error", message });
  }

  // ---- Durang qoidalari: server doskani yuritib boradi ----
  // Hamma o'yin turi (do'stona, reytingli, turnir, arena, bot) shu yerdan o'tadi.
  function drawStartBoard(room) {
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    const o = room.opening && room.opening.board;
    if (o) {
      let k = 0;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 !== 1) continue;
        const ch = o.charAt(k++);
        b[r][c] = (ch === "w" || ch === "b" || ch === "W" || ch === "B") ? ch : null;
      }
      return b;
    }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = "b";
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = "w";
    return b;
  }

  // Har bir qadam (zanjirli urishning har bir bosqichi ham) shu yerga keladi.
  // To'liq yurish tugagandagina qoidalar tekshiriladi va natija qaytariladi.
  function drawTrack(room, col, m) {
    try {
      const mv = m.move;
      if (!mv || !mv.from || !mv.to) return null;
      let dr = room.dr;
      if (!dr) {
        if (room.moves.length > 1) return null; // kuzatuv boshlanmagan (o'yin o'rtasida server yangilangan)
        const b0 = drawStartBoard(room);
        dr = room.dr = { b: b0, pre: null, from: null, cap: false, st: DRAW.createDrawState(b0, room.first || "white") };
      }
      if (!dr.pre) { dr.pre = dr.b; dr.from = [mv.from.r, mv.from.c]; dr.cap = false; }
      const nb = dr.b.map(r => r.slice());
      let p = nb[mv.from.r][mv.from.c];
      nb[mv.from.r][mv.from.c] = null;
      for (const x of mv.captures || []) nb[x.r][x.c] = null;
      if (p === "w" && mv.to.r === 0) p = "W";
      if (p === "b" && mv.to.r === 7) p = "B";
      nb[mv.to.r][mv.to.c] = p;
      dr.b = nb;
      if ((mv.captures || []).length) dr.cap = true;
      if (m.keepTurn) return null; // zanjir davom etyapti
      const res = DRAW.updateDraw(dr.st, dr.pre, { from: dr.from, to: [mv.to.r, mv.to.c], captures: dr.cap ? [1] : [] }, col, dr.b);
      dr.pre = null;
      return res;
    } catch (e) {
      console.error("[draw]", e && e.message);
      return null;
    }
  }

  // yurishni qo'llash (odam yoki bot nomidan)
  function applyMove(c, room, roomId, col, m) {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished) return err(c, "O‘yin tugagan"), true;
      if (!room.white || !room.black) return err(c, "Raqib hali qo‘shilmagan"), true;
      if (col !== room.turn) return err(c, "Hozir navbat sizniki emas"), true;
      if (room.moves.length >= MAX_MOVES) return err(c, "Yurishlar limiti"), true;
      const now = Date.now();
      const wasRunning = clockRunning(room);
      if (wasRunning) {
        room.clock[col] -= now - room.turnStartedAt;
        if (room.clock[col] <= 0) {
          room.clock[col] = 0;
          finish(room, other(col), "timeout");
          return true;
        }
      }
      if (wasRunning && !m.keepTurn && !room.berserk[col]) room.clock[col] += room.incMs; // inkrement (berserkda yo'q)
      room.moves.push(m.move);
      if (room.drawOffer) {
        room.drawOffer = null; // yurish bilan taklif rad etiladi
        broadcast(room, { type: "roomDraw", roomId, offer: null });
      }
      if (!m.keepTurn) {
        room.turn = other(room.turn); // ketma-ket olishda keepTurn:true yuboring
        room.plies++; room.waitSince = Date.now();
      }
      room.turnStartedAt = now;
      const dres = drawTrack(room, col, m);
      broadcast(room, {
        type: "roomMove", roomId, move: m.move, turn: room.turn, color: col,
        clock: currentClock(room), clockRunning: clockRunning(room),
        drawInfo: dres ? (dres.info || null) : undefined,
        canDraw: DRAW.canOfferDraw(room.dr && room.dr.st)
      });
      if (dres && dres.draw) {
        room.drawText = dres.reason;
        finish(room, "draw", "rule");
      }
      return true;
  }

  function handle(c, m) {
    if (!m || typeof m.type !== "string" || !m.type.startsWith("room")) return false;
    if (m.type === "roomLive") {
      const list = [];
      for (const r of rooms.values()) {
        if (!r.white || !r.black || r.finished) continue;
        if (![...r.members].some(id => { const cl = clients.get(id); return cl && colorOf(r, cl); })) continue;
        list.push({
          id: r.id, vsBot: !!r.vsBot, white: r.white.name, black: r.black.name, tc: r.tc, wElo: (_pi(r.white) || {}).elo || 1000, bElo: (_pi(r.black) || {}).elo || 1000,
          moves: (r.moves || []).length,
          spectators: [...r.members].filter(id => !colorOf(r, clients.get(id) || {})).length
        });
      }
      list.sort((a, b) => b.spectators - a.spectators || b.moves - a.moves);
      send(c.ws, { type: "roomLive", list: list.slice(0, 30) });
      return true;
    }
    if (m.type === "roomPeek") { /*TVPEEK*/
      const ids = Array.isArray(m.ids) ? m.ids.slice(0, 40) : [];
      const games = [];
      for (const id of ids) {
        const r = rooms.get(String(id));
        if (!r) continue;
        games.push({
          id: r.id, moves: r.moves || [], turn: r.turn, finished: !!r.finished, winner: r.winner || null,
          clock: currentClock(r), running: clockRunning(r),
          opening: r.opening && r.opening.board ? { board: r.opening.board } : null,
          wElo: (_pi(r.white) || {}).elo || 0, bElo: (_pi(r.black) || {}).elo || 0,
          spectators: [...r.members].filter(x => !colorOf(r, clients.get(x) || {})).length
        });
      }
      send(c.ws, { type: "roomPeek", games });
      return true;
    }

    const roomId = String(m.roomId || "");
    if (!ROOM_RE.test(roomId)) {
      err(c, "Xona raqami noto‘g‘ri");
      return true;
    }

    if (m.type === "roomJoin") {
      let user;
      if (m.initData) {
        user = verifyInitData(String(m.initData));
        if (!user) {
          err(c, "Telegram tasdiqlash xatosi");
          return true;
        }
      } else if (process.env.REQUIRE_TG === "1") {
        err(c, "Faqat Telegram ichidan kirish mumkin");
        return true;
      } else {
        const nm = String(m.name || "Mehmon").trim().slice(0, 20) || "Mehmon";
        // Telegramsiz: brauzer oynasi o'z guestId'si bilan taniladi, qayta ulansa joyi saqlanadi
        const gid = /^[A-Za-z0-9]{8,32}$/.test(String(m.guestId || "")) ? "g_" + m.guestId : c.id;
        user = { id: gid, name: nm };
      }

      let room = rooms.get(roomId);
      if (!room) {
        room = newRoom(roomId, DEFAULT_TC); room.casual = true; if (!rRestored) room._tmp = true; /*RTMP*/
        rooms.set(roomId, room);
      }

      c.hidden = true; // lobbidagi o'yinchilar ro'yxatida ko'rinmasin
      c.roomIds = c.roomIds || new Set();
      c.roomIds.add(roomId);
      room.members.add(c.id);
      room.names.set(c.id, user.name);
      room.lastActive = Date.now();

      const seat = { uid: user.id, name: user.name, clientId: c.id };
      if (room.white && room.white.uid === user.id) room.white = seat;
      else if (room.black && room.black.uid === user.id) room.black = seat;
      else if (!room.white) room.white = seat;
      else if (!room.black) room.black = seat;

      pushState(room);
      return true;
    }

    const room = rooms.get(roomId);
    if (!room) {
      err(c, "Xona topilmadi");
      return true;
    }
    room.lastActive = Date.now();
    const col = colorOf(room, c);

    if (m.type === "roomMove") {
      if (room.vsBot && !room.botStarted) return err(c, "Avval ‘Boshlash’ tugmasini bosing"), true;
      { const _b = room.moves.length; const _r = applyMove(c, room, roomId, col, m); if (col && room.moves.length > _b) { room.mvCount = room.mvCount || {}; room.mvCount[col] = (room.mvCount[col] || 0) + 1; } return _r; }
    }

    if (m.type === "roomBotMove") {
      if (!room.vsBot || !col || !room.botStarted) return true;
      const bc = botColorOf(room);
      if (!bc || col === bc) return true;   // faqat odam bot nomidan yubora oladi
      return applyMove(c, room, roomId, bc, m);
    }

    if (m.type === "roomBotStart") {
      if (!room.vsBot || room.botStarted || room.finished || !isOwner(room, col)) return true;
      room.botStarted = true;
      room.lastActive = Date.now();
      pushState(room);
      return true;
    }

    if (m.type === "roomSetColor") {
      if (!room.vsBot) return true;
      if (!isOwner(room, col)) return err(c, "Rangni faqat o‘yinchi tanlaydi"), true;
      if (room.botStarted || room.moves.length > 0 || room.finished) return err(c, "O‘yin boshlangan, rangni o‘zgartirib bo‘lmaydi"), true;
      const want = m.color === "white" || m.color === "black" ? m.color : (Math.random() < 0.5 ? "white" : "black");
      if (want !== col) { const t = room.white; room.white = room.black; room.black = t; }
      pushState(room);
      return true;
    }

    if (m.type === "roomAbort") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished) return true;
      if (room.mvCount && room.mvCount[col]) return err(c, "Birinchi yurishdan keyin chiqib bo‘lmaydi"), true;
      finish(room, "draw", "abort");   // rc-menu-v1
      return true;
    }

    if (m.type === "roomVoiceFail") {   // ovozli bellashuvda noto'g'ri yurish aytildi — o'sha o'yinchi yutqazadi
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (!room.voice || room.finished || !room.white || !room.black) return true;
      room.voiceSaid = String(m.said || "").slice(0, 60);
      finish(room, other(col), "voice");
      return true;
    }
    if (m.type === "roomFinish" || m.type === "roomResign") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      let winner = m.type === "roomFinish" ? m.winner : null;
      if (winner !== "white" && winner !== "black" && winner !== "draw") winner = other(col);
      finish(room, winner, m.type === "roomResign" ? "resign" : "finish");
      return true;
    }

    if (m.type === "roomBerserk") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (!room.arena) return err(c, "Berserk faqat Arena o‘yinlarida"), true;
      if (room.noBerserk) return err(c, "Bu turnirda berserk o‘chirilgan"), true;
      if (room.finished || !room.white || !room.black) return true;
      if (room.berserk[col]) return true;
      const before = room.plies <= (col === room.first ? 0 : 1);
      if (!before) return err(c, "Berserk faqat birinchi yurishdan oldin mumkin"), true;
      room.berserk[col] = true;
      room.clock[col] = Math.floor(room.timeMs / 2);
      broadcast(room, { type: "roomBerserk", roomId, color: col, clock: currentClock(room) });
      return true;
    }

    if (m.type === "roomSetTime") {
      if (room.arena || room.locked) return err(c, "Bu o‘yinda vaqtni o‘zgartirib bo‘lmaydi"), true;
      if (!isOwner(room, col)) return err(c, "Vaqtni faqat xona egasi tanlaydi"), true;
      if (room.moves.length > 0 || room.finished || room.botStarted) return err(c, "O‘yin boshlangan, vaqtni o‘zgartirib bo‘lmaydi"), true;
      const t = tcParse(m.tc);
      if (!t) return err(c, "Noma’lum vaqt rejimi"), true;
      if (room.vsBot && !BOT_TCS.includes(m.tc)) return err(c, "Bu vaqt rejimi bot bilan o‘ynashda mavjud emas"), true;
      room.tc = m.tc;
      room.timeMs = t[0] * 1000;
      room.incMs = t[1] * 1000;
      room.clock = { white: room.timeMs, black: room.timeMs };
      pushState(room);
      return true;
    }

    if (m.type === "roomSetPos") {
      if (room.arena || room.locked) return err(c, "Bu o‘yinda pozitsiyani o‘zgartirib bo‘lmaydi"), true;
      if (!isOwner(room, col)) return err(c, "Pozitsiyani faqat xona egasi tanlaydi"), true;
      if (room.moves.length > 0 || room.finished || room.botStarted) return err(c, "O‘yin boshlangan, pozitsiyani o‘zgartirib bo‘lmaydi"), true;
      if (m.pos === "idf") {
        const o = pickIdf();
        if (!o || !o.board) return err(c, "IDF pozitsiyalari topilmadi"), true;
        room.opening = { id: String(o.id), board: String(o.board), side: o.side === "b" ? "b" : "w" };
      } else {
        room.opening = null;
      }
      room.turn = room.opening && room.opening.side === "b" ? "black" : "white";
      room.first = room.turn;
      pushState(room);
      return true;
    }

    if (m.type === "roomSetGames") {
      if (!room.casual || room.arena || room.locked) return err(c, "Bu o‘yinda o‘yinlar sonini o‘zgartirib bo‘lmaydi"), true;
      if (col !== "white") return err(c, "O‘yinlar sonini faqat xona egasi (oq) tanlaydi"), true;
      if (room.moves.length > 0 || room.finished || (room.played || 0) > 0) return err(c, "O‘yin boshlangan, o‘zgartirib bo‘lmaydi"), true;
      const n = Number(m.games);
      if (![1, 2, 4].includes(n)) return err(c, "Noto‘g‘ri son"), true;
      room.gamesTotal = n; room.played = 0; room.pts = {};
      pushState(room);
      return true;
    }

    if (m.type === "roomRematch") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if ((!room.casual && !room.vsBot) || room.arena || room.locked || !room.finished || room.nextTimer) return true;
      if ((room.gamesTotal || 1) > 1 && (room.played || 0) < room.gamesTotal) return true;
      if (!room.white || !room.black) return err(c, "Raqib yo‘q"), true;
      if (room.vsBot) { startNextGame(room, true, true); return true; }   // bot darhol rozi, ranglar almashadi
      if (room.rematch && room.rematch !== col) { startNextGame(room, true, true); return true; }
      room.rematch = col;
      pushState(room);
      return true;
    }

    if (m.type === "roomRematchNo") {
      if (!col) return true;
      room.rematch = null;
      pushState(room);
      return true;
    }

    if (m.type === "roomDrawOffer") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished || !room.white || !room.black) return true;
      if (room.moves.length < 2) return err(c, "Avval kamida bittadan yurish qiling"), true;
      if (!DRAW.canOfferDraw(room.dr && room.dr.st)) return err(c, "Durang taklif qilish uchun har tomondan kamida 20 yurish bo‘lishi kerak (qoida 9.2)"), true;
      if (room.drawOffer) return true;
      if (room.offerPly[col] >= room.plies) return err(c, "Durang taklifini keyingi yurishdan so‘ng qayta yuboring"), true;
      room.drawOffer = col;
      room.offerPly[col] = room.plies;
      broadcast(room, { type: "roomDraw", roomId, offer: col });
      if (room.vsBot) {
        setTimeout(() => {
          if (room.drawOffer === col && !room.finished) {
            room.drawOffer = null;
            const bc = botColorOf(room);
            let ok = false;
            try { ok = !!(bc && room.dr && DRAW.botAcceptsDraw(room.dr.b, bc, room.dr.st)); } catch (e) { console.error("[botDraw]", e && e.message); }
            if (ok) finish(room, "draw", "agreed");
            else broadcast(room, { type: "roomDraw", roomId, offer: null, declined: true });
          }
        }, 1500);
      }
      return true;
    }

    if (m.type === "roomDrawAccept") {
      if (!col || room.finished) return true;
      if (!room.drawOffer || room.drawOffer === col) return true;
      room.drawOffer = null;
      finish(room, "draw", "agreed");
      return true;
    }

    if (m.type === "roomDrawDecline") {
      if (!col || !room.drawOffer || room.drawOffer === col) return true;
      room.drawOffer = null;
      broadcast(room, { type: "roomDraw", roomId, offer: null, declined: true });
      return true;
    }

    if (m.type === "roomChat") {
      if (!room.members.has(c.id)) return true;
      const text = String(m.text || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, CHAT_MAX);
      if (!text) return true;
      const now = Date.now();
      if (c.lastChat && now - c.lastChat < 700) return err(c, "Juda tez yozyapsiz"), true;
      c.lastChat = now;
      const msg = { name: room.names.get(c.id) || "Mehmon", color: col || "spectator", text, at: now };
      room.chat.push(msg);
      if (room.chat.length > CHAT_KEEP) room.chat.shift();
      broadcast(room, { type: "roomChat", roomId, msg });
      return true;
    }

    if (m.type === "roomSync") {
      send(c.ws, snapshot(room, col));
      return true;
    }

    return false;
  }

  function onClose(c) {
    if (!c.roomIds) return;
    for (const rid of c.roomIds) {
      const room = rooms.get(rid);
      if (!room) continue;
      room.members.delete(c.id);
      // o'yinchi uzilsa, joyi saqlanadi (qayta kirsa davom etadi)
      setTimeout(() => {
        if (rooms.get(rid)) pushState(room);
      }, 0);
    }
  }

  // Vaqti tugaganini tekshirish
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      // Seriyaning 2+ o'yinida birinchi yurish uchun 30 soniya
      if (room.white && room.black && !room.finished && room.plies < 2 && room.gamesTotal > 1 && (room.played || 0) > 0 && !room.arena) {
        const k = room.played + ":" + room.plies + ":" + room.turn;
        if (room._fmKey !== k) { room._fmKey = k; room._fmSince = now; }
        else if (now - room._fmSince >= 30000) { finish(room, other(room.turn), "timeout"); continue; }
      }
      if (!clockRunning(room)) continue;
      if (room.clock[room.turn] - (now - room.turnStartedAt) <= 0) {
        finish(room, other(room.turn), "timeout");
      }
    }
  }, 500).unref();

  setInterval(() => {
    const now = Date.now();
    for (const [rid, room] of rooms) {
      if (!global.__spFM) global.__spFM = setInterval(() => { const t0 = Date.now(); for (const rm of rooms.values()) { try {
        if (rm.finished || rm.vsBot || rm.simul || /^S/.test(String(rm.id || "")) || !rm.white || !rm.black || rm.plies >= 2) { if (rm.finished || rm.plies >= 2) rm.waitSince = 0; continue; }
        // 15 soniya har bir birinchi yurish uchun alohida, va faqat navbatdagi o'yinchi xonaga kirgandan keyin sanaladi
        if (rm._fmP !== rm.plies) { rm._fmP = rm.plies; rm.waitSince = 0; }
        if (!rm._crAt) rm._crAt = t0;
        if (!rm.waitSince) { if (isOnline(rm[rm.turn]) || t0 - rm._crAt > 60000) rm.waitSince = t0; continue; }
        if (t0 - rm.waitSince >= 15000) { rm.waitSince = 0; finish(rm, rm.turn === "white" ? "black" : "white", "noshow"); }
      } catch (e) {} } }, 1000);
      if (now - room.lastActive > IDLE_MS) rooms.delete(rid);
    }
  }, 10 * 60 * 1000).unref();

  // ---------- /*RSAVE*/ partiyalarni saqlash / tiklash ----------
  const _rrep = (k, v) => v instanceof Map ? { __map: [...v] } : v instanceof Set ? { __set: [...v] } : v;
  const _rrev = (k, v) => v && v.__map ? new Map(v.__map) : v && v.__set ? new Set(v.__set) : v;
  var rRestored = false, rReady = false, rSig = '';
  function rSnap() {
    const arr = [];
    for (const r of rooms.values()) {
      if (r.finished || !r.white || !r.black || r.vsBot || r._tmp) continue;
      const o = Object.assign({}, r);
      o.members = []; o.names = []; delete o.nextTimer;
      o.white = Object.assign({}, r.white, { clientId: null });
      o.black = Object.assign({}, r.black, { clientId: null });
      o.clock = currentClock(r);
      arr.push(o);
    }
    return arr;
  }
  function saveRooms(force) {
    if (!rReady) return;
    try {
      const arr = rSnap();
      const sig = JSON.stringify(arr.map(o => [o.id, o.moves.length, o.turn, o.berserk, o.drawOffer]));
      if (!force && sig === rSig) return;
      rSig = sig;
      const st = require('./store'), s = JSON.stringify(arr, _rrep);
      if (st.db.rSave !== s) { st.db.rSave = s; st.save(); }
    } catch (e) { console.log('[xona] saqlash xato:', e.message); }
  }
  function restore() {
    if (rRestored) return true;
    try {
      const st = require('./store');
      if (!st.db) return false;
      if (typeof st.db.rSave === 'string') {
        const arr = JSON.parse(st.db.rSave, _rrev), now = Date.now();
        let n = 0;
        for (const o of arr) {
          const ex = rooms.get(o.id);
          if (ex && !ex._tmp) continue;
          o.members = new Set(); o.names = new Map();
          o.turnStartedAt = now; o.lastActive = now; o.nextTimer = null; o.drawOffer = null;
          if (ex) {
            o.members = ex.members; o.names = ex.names;
            for (const k of ['white', 'black']) for (const s2 of [ex.white, ex.black]) if (s2 && o[k] && String(s2.uid) === String(o[k].uid)) o[k].clientId = s2.clientId;
          }
          rooms.set(o.id, o); n++;
          if (ex) pushState(o);
        }
        console.log('[xona] tiklandi:', n);
        rRestored = true; rReady = true; return true;
      }
      if (st.db.users && Object.keys(st.db.users).length) { rRestored = true; rReady = true; return true; }
    } catch (e) { console.log('[xona] tiklash xato:', e.message); }
    return false;
  }
  (function tr(n) { if (restore() || n > 30) { rRestored = true; rReady = true; return; } setTimeout(() => tr(n + 1), 1500); })(0);
  setInterval(() => saveRooms(false), 3000).unref();
  process.once('SIGTERM', () => {
    console.log('[xona] SIGTERM: partiyalar saqlanmoqda');
    saveRooms(true);
    setTimeout(() => process.exit(0), 3000);
  });

  return { handle, onClose, rooms, results, create, forfeit, restore, get: id => rooms.get(id) };
}

module.exports = { createRooms, verifyInitData };
