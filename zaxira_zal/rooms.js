// rooms.js — guruh o'yinlari uchun xonalar (Mini App orqali).
// Birinchi kirgan = oq (white), ikkinchi = qora (black), qolganlar = tomoshabin.
const crypto = require("crypto");

const ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
const MAX_MOVES = 1000;
const IDLE_MS = 6 * 60 * 60 * 1000;

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

function createRooms({ send, clients }) {
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
      winner: room.winner
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

  function finish(room, winner) {
    if (room.finished) return;
    room.finished = true;
    room.winner = winner;
    results.push({
      roomId: room.id,
      winner,
      white: room.white && room.white.uid,
      black: room.black && room.black.uid,
      whiteName: room.white && room.white.name,
      blackName: room.black && room.black.name,
      moves: room.moves.length,
      at: Date.now()
    });
    if (results.length > 500) results.shift();
    broadcast(room, { type: "roomFinished", roomId: room.id, winner });
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
        user = { id: c.id, name: nm };
      }

      let room = rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          white: null,
          black: null,
          members: new Set(),
          moves: [],
          turn: "white",
          finished: false,
          winner: null,
          lastActive: Date.now()
        };
        rooms.set(roomId, room);
      }

      c.hidden = true; // lobbidagi o'yinchilar ro'yxatida ko'rinmasin
      c.roomIds = c.roomIds || new Set();
      c.roomIds.add(roomId);
      room.members.add(c.id);
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
      room.moves.push(m.move);
      if (!m.keepTurn) room.turn = other(room.turn); // ketma-ket olishda keepTurn:true yuboring
      broadcast(room, { type: "roomMove", roomId, move: m.move, turn: room.turn, color: col });
      return true;
    }

    if (m.type === "roomFinish" || m.type === "roomResign") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      let winner = m.type === "roomFinish" ? m.winner : null;
      if (winner !== "white" && winner !== "black" && winner !== "draw") winner = other(col);
      finish(room, winner);
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

  setInterval(() => {
    const now = Date.now();
    for (const [rid, room] of rooms) {
      if (now - room.lastActive > IDLE_MS) rooms.delete(rid);
    }
  }, 10 * 60 * 1000).unref();

  return { handle, onClose, rooms, results };
}

module.exports = { createRooms, verifyInitData };
