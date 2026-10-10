// rooms.js — guruh o'yinlari uchun xonalar (Mini App orqali).
// Birinchi kirgan = oq (white), ikkinchi = qora (black), qolganlar = tomoshabin.
const crypto = require("crypto");

const ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
const MAX_MOVES = 1000;
const IDLE_MS = 6 * 60 * 60 * 1000;
// Vaqt rejimlari: [boshlang'ich soniya, har yurishdan keyin qo'shiladigan soniya]
const TCS = { "1+1": [60, 1], "2+2": [120, 2], "3+2": [180, 2], "5+3": [300, 3], "7+5": [420, 5] };
const DEFAULT_TC = "5+3";
const CHAT_KEEP = 50;
const CHAT_MAX = 200;

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
    return !!(room.white && room.black && !room.finished && room.plies >= 2);
  }

  function currentClock(room) {
    const c = { white: room.clock.white, black: room.clock.black };
    if (clockRunning(room)) {
      c[room.turn] = Math.max(0, c[room.turn] - (Date.now() - room.turnStartedAt));
    }
    return c;
  }

  function snapshot(room, color) {
    return {
      type: "roomState",
      roomId: room.id,
      color: color || "spectator",
      white: room.white ? room.white.name : null,
      black: room.black ? room.black.name : null,
      whiteOnline: isOnline(room.white),
      blackOnline: isOnline(room.black),
      spectators: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).length,
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
      tcs: Object.keys(TCS),
      arena: !!room.arena,
      berserk: room.berserk,
      drawOffer: room.drawOffer,
      chat: room.chat
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

  function finish(room, winner, reason) {
    if (room.finished) return;
    room.clock = currentClock(room); // soatni to'xtatamiz
    room.finished = true;
    room.drawOffer = null;
    room.winner = winner;
    room.reason = reason || null;
    results.push({
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
    broadcast(room, { type: "roomFinished", roomId: room.id, winner, reason: room.reason, clock: room.clock });
    if (typeof onFinish === "function") {
      try { onFinish(room); } catch (e) { console.error("[onFinish]", e); }
    }
  }

  function newRoom(roomId, tcKey) {
    const t = TCS[tcKey] ? TCS[tcKey] : TCS[DEFAULT_TC];
    const key = TCS[tcKey] ? tcKey : DEFAULT_TC;
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
    if (opts && opts.white) room.white = { uid: String(opts.white.uid), name: opts.white.name, clientId: null };
    if (opts && opts.black) room.black = { uid: String(opts.black.uid), name: opts.black.name, clientId: null };
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

  function handle(c, m) {
    if (!m || typeof m.type !== "string" || !m.type.startsWith("room")) return false;

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
        room = newRoom(roomId, DEFAULT_TC);
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
        room.plies++;
      }
      room.turnStartedAt = now;
      broadcast(room, {
        type: "roomMove", roomId, move: m.move, turn: room.turn, color: col,
        clock: currentClock(room), clockRunning: clockRunning(room)
      });
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
      if (room.finished || !room.white || !room.black) return true;
      if (room.berserk[col]) return true;
      const before = col === "white" ? room.plies === 0 : room.plies <= 1;
      if (!before) return err(c, "Berserk faqat birinchi yurishdan oldin mumkin"), true;
      room.berserk[col] = true;
      room.clock[col] = Math.floor(room.timeMs / 2);
      broadcast(room, { type: "roomBerserk", roomId, color: col, clock: currentClock(room) });
      return true;
    }

    if (m.type === "roomSetTime") {
      if (room.arena) return err(c, "Arena o‘yinida vaqtni o‘zgartirib bo‘lmaydi"), true;
      if (col !== "white") return err(c, "Vaqtni faqat xona egasi (oq) tanlaydi"), true;
      if (room.moves.length > 0 || room.finished) return err(c, "O‘yin boshlangan, vaqtni o‘zgartirib bo‘lmaydi"), true;
      const t = TCS[m.tc];
      if (!t) return err(c, "Noma’lum vaqt rejimi"), true;
      room.tc = m.tc;
      room.timeMs = t[0] * 1000;
      room.incMs = t[1] * 1000;
      room.clock = { white: room.timeMs, black: room.timeMs };
      pushState(room);
      return true;
    }

    if (m.type === "roomDrawOffer") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished || !room.white || !room.black) return true;
      if (room.moves.length < 2) return err(c, "Avval kamida bittadan yurish qiling"), true;
      if (room.drawOffer) return true;
      if (room.offerPly[col] >= room.plies) return err(c, "Durang taklifini keyingi yurishdan so‘ng qayta yuboring"), true;
      room.drawOffer = col;
      room.offerPly[col] = room.plies;
      broadcast(room, { type: "roomDraw", roomId, offer: col });
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
      if (!clockRunning(room)) continue;
      if (room.clock[room.turn] - (now - room.turnStartedAt) <= 0) {
        finish(room, other(room.turn), "timeout");
      }
    }
  }, 500).unref();

  setInterval(() => {
    const now = Date.now();
    for (const [rid, room] of rooms) {
      if (now - room.lastActive > IDLE_MS) rooms.delete(rid);
    }
  }, 10 * 60 * 1000).unref();

  return { handle, onClose, rooms, results, create, forfeit, get: id => rooms.get(id) };
}

module.exports = { createRooms, verifyInitData };
