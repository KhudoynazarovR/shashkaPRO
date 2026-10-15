p = "rooms.js"
s = open(p, encoding="utf-8").read()
if "roomSetGames" in s:
    raise SystemExit("Patch allaqachon qo'llangan")

A1 = "function finish(room, winner, reason) {"
A2 = 'broadcast(room, { type: "roomFinished", roomId: room.id, winner, reason: room.reason, clock: room.clock });'
A3 = "chat: room.chat"
A4 = 'if (m.type === "roomDrawOffer") {'
for a in (A1, A2, A3, A4):
    if s.count(a) != 1:
        raise SystemExit("Anchor topilmadi/ko'p (%d): %s" % (s.count(a), a[:50]))

helpers = r'''function startNextGame(room, swap, fresh) {
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
    room.finished = false; room.winner = null; room.reason = null; room.plies = 0;
    room.clock = { white: room.timeMs, black: room.timeMs };
    room.berserk = { white: false, black: false };
    room.drawOffer = null; room.offerPly = { white: -1, black: -1 };
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

  '''

handlers = r'''if (m.type === "roomSetGames") {
      if (room.arena || room.locked) return err(c, "Bu o‘yinda o‘yinlar sonini o‘zgartirib bo‘lmaydi"), true;
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
      if (room.arena || room.locked || !room.finished || room.nextTimer) return true;
      if ((room.gamesTotal || 1) > 1 && (room.played || 0) < room.gamesTotal) return true;
      if (!room.white || !room.black) return err(c, "Raqib yo‘q"), true;
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

    '''

snap = ("chat: room.chat, gamesTotal: room.gamesTotal || 1, played: room.played || 0, "
        "seriesScore: (room.gamesTotal > 1 ? { white: (room.white && room.pts && room.pts[room.white.uid]) || 0, black: (room.black && room.pts && room.pts[room.black.uid]) || 0 } : null), "
        "seriesDone: (room.gamesTotal > 1 && (room.played || 0) >= room.gamesTotal), "
        "nextIn: !!room.nextTimer, rematch: room.rematch || null")

s = s.replace(A1, helpers + "\n  " + A1, 1)
s = s.replace(A2, A2 + ' try { afterFinish(room, winner); } catch (e) { console.error("[afterFinish]", e); }', 1)
s = s.replace(A3, snap, 1)
s = s.replace(A4, handlers + A4, 1)
open(p, "w", encoding="utf-8").write(s)
print("OK")
