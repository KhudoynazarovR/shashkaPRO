require("./bot.js");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const { createRooms } = require("./rooms");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";

const clients = new Map();
const requests = new Map();
const waiting = new Set();
const matches = new Map();

function id(prefix) {
  return prefix + "_" + crypto.randomBytes(6).toString("hex");
}

function send(ws, data) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

// Guruh o'yinlari (Mini App xonalari)
const { createLobby } = require("./lobby");
let lobbyApi = null;
const roomsApi = createRooms({ send, clients, onFinish: room => lobbyApi && lobbyApi.onRoomFinished(room) });
lobbyApi = createLobby({ send, clients, roomsApi });

function broadcast(data, exceptId = null) {
  for (const c of clients.values()) {
    if (c.id !== exceptId) send(c.ws, data);
  }
}

function playerList() {
  return [...clients.values()]
    .filter(c => !c.hidden)
    .map(c => ({
      id: c.id,
      name: c.name,
      elo: c.elo,
      busy: !!c.matchId
    }));
}

function notifyPlayers() {
  broadcast({
    type: "players",
    players: playerList()
  });
}

function makeMatch(a, b) {
  const match = {
    id: id("match"),
    whiteId: a.id,
    blackId: b.id,
    turn: "white",
    finished: false
  };

  a.matchId = match.id;
  b.matchId = match.id;

  waiting.delete(a.id);
  waiting.delete(b.id);

  matches.set(match.id, match);

  send(a.ws, {
    type: "matchFound",
    matchId: match.id,
    color: "white",
    opponentName: b.name
  });

  send(b.ws, {
    type: "matchFound",
    matchId: match.id,
    color: "black",
    opponentName: a.name
  });

  notifyPlayers();
}

function finishMatch(match, winner) {
  if (!match || match.finished) return;

  match.finished = true;

  const white = clients.get(match.whiteId);
  const black = clients.get(match.blackId);

  if (white) white.matchId = null;
  if (black) black.matchId = null;

  send(white?.ws, {
    type: "matchFinished",
    matchId: match.id,
    winner
  });

  send(black?.ws, {
    type: "matchFinished",
    matchId: match.id,
    winner
  });

  matches.delete(match.id);
  notifyPlayers();
}

function leaveClient(c) {
  waiting.delete(c.id);

  for (const [rid, r] of requests) {
    if (r.fromId === c.id || r.toId === c.id) {
      requests.delete(rid);

      const other = clients.get(
        r.fromId === c.id ? r.toId : r.fromId
      );

      if (other) {
        send(other.ws, {
          type: "requestRemoved",
          requestId: rid
        });
      }
    }
  }

  if (c.matchId) {
    const match = matches.get(c.matchId);

    if (match && !match.finished) {
      const winner =
        match.whiteId === c.id ? "black" : "white";

      const opponent =
        match.whiteId === c.id
          ? clients.get(match.blackId)
          : clients.get(match.whiteId);

      if (opponent) {
        send(opponent.ws, {
          type: "opponentLeft",
          matchId: match.id,
          winner
        });

        opponent.matchId = null;
      }

      matches.delete(match.id);
    }
  }

  clients.delete(c.id);
  notifyPlayers();
}

const BLOCKED = new Set([
  "quests.js", "leagues.js", "weblogin.js",
  "server.js", "rooms.js", "pzrush.js", "pzbattle.js", "pztour.js", "draw-rules.js", "lobby.js", "users.json", "package.json", "package-lock.json"
]);

function serveFile(req, res) {
  let requested = new URL(req.url, "http://localhost").pathname;

  if (requested === "/") requested = "/index.html";

  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".wav": "audio/wav",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json; charset=utf-8"
  };

  const ext = path.extname(requested);
  const base = path.basename(requested);

  // xavfsizlik: faqat ruxsat etilgan turdagi fayllar, server fayllari yopiq
  if (!types[ext] || BLOCKED.has(base)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }

  const candidates = [
    path.join(__dirname, requested),
    path.join(__dirname, "public", requested)
  ];

  const file = candidates.find(p => fs.existsSync(p));

  if (!file) {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    return res.end("Not found");
  }

  // index.html ga guruh (xona) rejimi skriptini avtomatik ulaymiz
  if (base === "index.html") {
    let html = fs.readFileSync(file, "utf8");
    // Telegramdan tashqarida kirish (sayt / Play Market ilovasi) — boshqa skriptlardan oldin
    if (!html.includes("webauth.js")) html = html.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', '<script src="https://telegram.org/js/telegram-web-app.js"></script><script src="/webauth.js?v=4"></script><script src="/i18n.js?v=6"></script><link rel="manifest" href="/app/manifest.webmanifest"><meta name="theme-color" content="#1b1150"><link rel="apple-touch-icon" href="/app/apple-180.png">');
    if (!html.includes("aiview.js")) {
      html = html.replace("</body>", '<script src="/aiview.js?v=' + Date.now() + '"></script>\n</body>');
    }
    if (!html.includes("sound.js")) {
      html = html.replace("</body>", '<script src="/sound.js"></script>\n</body>');
    }
    if (!html.includes("rules-bridge.js")) {
      html = html.replace("</body>", '<script src="/rules-bridge.js"></script>\n</body>');
    }
    if (!html.includes("roomclient.js")) {
      html = html.replace("</body>", '<script src="/roomclient.js"></script>\n</body>');
    }
    if (!html.includes("profile.js")) {
      html = html.replace("</body>", '<script src="/profile.js?v=' + Date.now() + '"></script>\n</body>');
    }
    if (!html.includes("navbar.js")) {
      html = html.replace("</body>", '<script src="/navbar.js"></script>\n</body>');
    }
    if (!html.includes("voice.js")) html = html.replace("</body>", '<script src="/voice.js?v=3"></script>\n</body>');
    if (!html.includes("ratings.js")) {
      html = html.replace("</body>", '<script src="/ratings.js?v=' + Date.now() + '"></script>\n</body>');
    }
    if (!html.includes("/menu.js")) {
      html = html.replace("</body>", '<script src="/menu.js?v=' + Date.now() + '"></script>\n</body>');
    }
    if (!html.includes("dailyq.js")) {
      html = html.replace("</body>", '<script src="/sharecard.js?v=' + String(process.env.RENDER_GIT_COMMIT || Date.now()).slice(0, 8) + '"></script>\n<script src="/dailyq.js?v=' + String(process.env.RENDER_GIT_COMMIT || Date.now()).slice(0, 8) + '"></script>\n<script src="/leagueview.js?v=' + String(process.env.RENDER_GIT_COMMIT || Date.now()).slice(0, 8) + '"></script>\n</body>');
    }
    if (!html.includes("lobbyclient.js")) {
      html = html.replace("</body>", '<script src="/lobbyclient.js?v=' + String(process.env.RENDER_GIT_COMMIT || Date.now()).slice(0, 8) + '"></script>\n</body>');
    }
    html = html.replace(/(lobbyclient|roomclient|sound)\.js(\?v=\d+)?/g, "$1.js?v=" + Date.now());
    res.writeHead(200, {
      "Content-Type": types[".html"],
      "Cache-Control": "no-cache"
    });
    return res.end(html);
  }

  res.writeHead(200, {
    "Content-Type": types[ext],
    "Cache-Control": "no-cache"
  });

  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (require("./payments.js").handle(req, res, url)) return;

  if (require("./economy.js").handle(req, res, url)) return;

  if (url.pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    return res.end(JSON.stringify({
      ok: true,
      players: clients.size,
      matches: matches.size,
      waiting: waiting.size,
      rooms: roomsApi.rooms.size
    }));
  }

  // Bot uchun: tugagan guruh o'yinlari natijalari (RESULTS_SECRET kerak)
  if (url.pathname === "/api/results") {
    const secret = process.env.RESULTS_SECRET;
    if (!secret || url.searchParams.get("secret") !== secret) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: false }));
    }
    const out = roomsApi.results.splice(0, roomsApi.results.length);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ ok: true, results: out }));
  }

  if (url.pathname === "/preview.jpg") {
    return fs.readFile(path.join(__dirname, "preview.jpg"), (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400"
      });
      res.end(data);
    });
  }

  serveFile(req, res);
});

const wss = new WebSocketServer({ server });

wss.on("connection", ws => {
  const c = {
    id: id("player"),
    ws,
    name: "ShashkaPRO Player",
    elo: 1000,
    matchId: null
  };

  clients.set(c.id, c);

  send(ws, {
    type: "registered",
    id: c.id,
    players: playerList(),
    requests: []
  });

  notifyPlayers();

  ws.on("message", raw => {
    let m;

    try {
      m = JSON.parse(raw.toString());
    } catch {
      return send(ws, {
        type: "error",
        message: "Noto‘g‘ri JSON"
      });
    }

    // Zal va turnir (lb...) xabarlari
    if (lobbyApi.handle(c, m)) return;

    // Guruh xonalari (room...) xabarlari
    if (roomsApi.handle(c, m)) {
      notifyPlayers();
      return;
    }

    if (m.type === "register") {
      c.name =
        String(m.name || "ShashkaPRO Player")
          .trim()
          .slice(0, 20) ||
        "ShashkaPRO Player";

      send(ws, {
        type: "registered",
        id: c.id,
        players: playerList(),
        requests: [...requests.values()]
          .filter(r => r.toId === c.id)
          .map(r => ({
            id: r.id,
            fromId: r.fromId,
            fromName: r.fromName
          }))
      });

      notifyPlayers();
      return;
    }

    if (m.type === "gameRequest") {
      const to = clients.get(m.toId);

      if (!to || to.id === c.id) {
        return send(ws, {
          type: "error",
          message: "O‘yinchi topilmadi"
        });
      }

      if (c.matchId || to.matchId) {
        return send(ws, {
          type: "error",
          message: "O‘yinchi band"
        });
      }

      const r = {
        id: id("req"),
        fromId: c.id,
        fromName: c.name,
        toId: to.id
      };

      requests.set(r.id, r);

      send(to.ws, {
        type: "requestReceived",
        request: r
      });

      return;
    }

    if (m.type === "respondRequest") {
      const r = requests.get(m.requestId);

      if (!r || r.toId !== c.id) return;

      requests.delete(r.id);

      const from = clients.get(r.fromId);

      if (!from) return;

      send(from.ws, {
        type: "requestRemoved",
        requestId: r.id
      });

      if (
        m.accept &&
        !c.matchId &&
        !from.matchId
      ) {
        makeMatch(from, c);
      }

      return;
    }

    if (m.type === "randomMatch") {
      if (c.matchId) {
        return send(ws, {
          type: "error",
          message: "Siz allaqachon o‘yindasiz"
        });
      }

      waiting.add(c.id);

      const candidate = [...waiting]
        .map(x => clients.get(x))
        .find(
          x =>
            x &&
            x.id !== c.id &&
            !x.matchId
        );

      if (candidate) {
        makeMatch(candidate, c);
      } else {
        send(ws, {
          type: "waiting",
          message: "Raqib kutilmoqda..."
        });

        notifyPlayers();
      }

      return;
    }

    if (m.type === "move") {
      const match = matches.get(m.matchId);

      if (!match || match.finished) {
        return send(ws, {
          type: "error",
          message: "O‘yin topilmadi"
        });
      }

      const side =
        match.whiteId === c.id
          ? "white"
          : match.blackId === c.id
            ? "black"
            : null;

      if (!side) {
        return send(ws, {
          type: "error",
          message: "Bu o‘yinda siz yo‘qsiz"
        });
      }

      if (side !== match.turn) {
        return send(ws, {
          type: "error",
          message: "Hozir navbat sizniki emas"
        });
      }

      match.turn =
        match.turn === "white"
          ? "black"
          : "white";

      const white = clients.get(match.whiteId);
      const black = clients.get(match.blackId);

      const msg = {
        type: "move",
        matchId: match.id,
        move: m.move,
        turn: match.turn
      };

      send(white?.ws, msg);
      send(black?.ws, msg);

      return;
    }

    if (m.type === "finishMatch") {
      const match = matches.get(m.matchId);

      if (!match) return;

      if (
        match.whiteId !== c.id &&
        match.blackId !== c.id
      ) return;

      let winner = m.winner;

      if (
        winner !== "white" &&
        winner !== "black"
      ) {
        winner =
          match.whiteId === c.id
            ? "black"
            : "white";
      }

      finishMatch(match, winner);
      return;
    }

    if (m.type === "leaveMatch") {
      const match = matches.get(m.matchId);

      if (!match) return;

      if (
        match.whiteId !== c.id &&
        match.blackId !== c.id
      ) return;

      const winner =
        match.whiteId === c.id
          ? "black"
          : "white";

      finishMatch(match, winner);
      return;
    }
  });

  ws.on("close", () => {
    leaveClient(c);
    roomsApi.onClose(c);
    lobbyApi.onClose(c);
  });

  ws.on("error", () => {});
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("================================");
  console.log("   ShashkaPRO Online Server");
  console.log("================================");
  console.log("Server: http://" + HOST + ":" + PORT);
  console.log("WebSocket: ws://" + HOST + ":" + PORT);
  console.log("================================");
});
