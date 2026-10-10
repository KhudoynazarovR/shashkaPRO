const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  let file = req.url === "/" ? "index.html" : req.url.slice(1);
  file = path.join(__dirname, file);

  if (!fs.existsSync(file)) {
    res.writeHead(404);
    return res.end("404 Not Found");
  }

  const ext = path.extname(file);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  };

  res.writeHead(200, {
    "Content-Type": types[ext] || "text/plain; charset=utf-8"
  });

  fs.createReadStream(file).pipe(res);
});

const wss = new WebSocket.Server({ server });

const players = new Map();
const requests = new Map();
const matches = new Map();

let nextPlayerId = 1;
let nextRequestId = 1;
let nextMatchId = 1;

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(data) {
  for (const player of players.values()) {
    send(player.ws, data);
  }
}

function publicPlayers() {
  return [...players.values()].map(p => ({
    id: p.id,
    name: p.name,
    elo: p.elo,
    busy: !!p.matchId
  }));
}

function updatePlayers() {
  broadcast({
    type: "players",
    players: publicPlayers()
  });
}

function findPlayer(id) {
  return players.get(id);
}

function removePlayerFromMatch(player) {
  if (!player || !player.matchId) return;

  const match = matches.get(player.matchId);
  if (!match) {
    player.matchId = null;
    return;
  }

  const opponentId =
    match.white === player.id ? match.black : match.white;

  const opponent = players.get(opponentId);

  if (opponent) {
    opponent.matchId = null;

    send(opponent.ws, {
      type: "opponentLeft",
      winner: opponent.id === match.white ? "white" : "black"
    });
  }

  matches.delete(match.id);
  player.matchId = null;

  updatePlayers();
}

function createMatch(a, b) {
  const matchId = "match-" + nextMatchId++;

  const white = Math.random() < 0.5 ? a : b;
  const black = white.id === a.id ? b : a;

  const match = {
    id: matchId,
    white: white.id,
    black: black.id,
    turn: "white"
  };

  matches.set(matchId, match);

  white.matchId = matchId;
  black.matchId = matchId;

  send(white.ws, {
    type: "matchFound",
    matchId,
    color: "white",
    opponentName: black.name
  });

  send(black.ws, {
    type: "matchFound",
    matchId,
    color: "black",
    opponentName: white.name
  });

  updatePlayers();
}

wss.on("connection", ws => {
  let player = null;

  ws.on("message", raw => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return send(ws, {
        type: "error",
        message: "Noto‘g‘ri JSON"
      });
    }

    // REGISTER
    if (msg.type === "register") {
      if (player) return;

      const id = "player-" + nextPlayerId++;

      player = {
        id,
        name: String(msg.name || "ShashkaPRO Player")
          .trim()
          .slice(0, 20),
        elo: 1000,
        ws,
        matchId: null
      };

      players.set(id, player);

      send(ws, {
        type: "registered",
        id,
        players: publicPlayers(),
        requests: []
      });

      updatePlayers();
      return;
    }

    if (!player) {
      return send(ws, {
        type: "error",
        message: "Avval register qiling"
      });
    }

    // O'YIN SO'ROVI
    if (msg.type === "gameRequest") {
      const target = findPlayer(msg.toId);

      if (!target) {
        return send(ws, {
          type: "error",
          message: "O‘yinchi topilmadi"
        });
      }

      if (target.id === player.id) {
        return send(ws, {
          type: "error",
          message: "O‘zingizga so‘rov yubora olmaysiz"
        });
      }

      if (player.matchId || target.matchId) {
        return send(ws, {
          type: "error",
          message: "O‘yinchi band"
        });
      }

      const requestId = "request-" + nextRequestId++;

      const request = {
        id: requestId,
        fromId: player.id,
        fromName: player.name,
        toId: target.id
      };

      requests.set(requestId, request);

      send(target.ws, {
        type: "requestReceived",
        request
      });

      return;
    }

    // SO'ROVNI QABUL / RAD ETISH
    if (msg.type === "respondRequest") {
      const request = requests.get(msg.requestId);

      if (!request) {
        return send(ws, {
          type: "error",
          message: "So‘rov topilmadi"
        });
      }

      if (request.toId !== player.id) {
        return send(ws, {
          type: "error",
          message: "Bu so‘rov sizga tegishli emas"
        });
      }

      requests.delete(msg.requestId);

      const from = findPlayer(request.fromId);

      if (from) {
        send(from.ws, {
          type: "requestRemoved",
          requestId: request.id
        });
      }

      if (!msg.accept) {
        updatePlayers();
        return;
      }

      if (!from || from.matchId || player.matchId) {
        return send(ws, {
          type: "error",
          message: "O‘yin boshlash imkonsiz"
        });
      }

      createMatch(from, player);
      return;
    }

    // RANDOM MATCH
    if (msg.type === "randomMatch") {
      if (player.matchId) {
        return send(ws, {
          type: "error",
          message: "Siz allaqachon o‘yindasiz"
        });
      }

      const opponent = [...players.values()]
        .find(p =>
          p.id !== player.id &&
          !p.matchId
        );

      if (!opponent) {
        return send(ws, {
          type: "error",
          message: "Hozircha raqib topilmadi"
        });
      }

      createMatch(player, opponent);
      return;
    }

    // YURISH
    if (msg.type === "move") {
      const match = matches.get(msg.matchId);

      if (!match || player.matchId !== msg.matchId) {
        return send(ws, {
          type: "error",
          message: "O‘yin topilmadi"
        });
      }

      const color =
        match.white === player.id ? "white" :
        match.black === player.id ? "black" :
        null;

      if (!color) {
        return send(ws, {
          type: "error",
          message: "Siz bu o‘yinda emassiz"
        });
      }

      if (match.turn !== color) {
        return send(ws, {
          type: "error",
          message: "Hozir sizning navbatingiz emas"
        });
      }

      if (!msg.move || !msg.move.from || !msg.move.to) {
        return send(ws, {
          type: "error",
          message: "Noto‘g‘ri yurish"
        });
      }

      // Navbatni almashtirish
      match.turn =
        color === "white" ? "black" : "white";

      const opponentId =
        color === "white" ? match.black : match.white;

      const opponent = players.get(opponentId);

      if (opponent) {
        send(opponent.ws, {
          type: "move",
          matchId: match.id,
          move: msg.move
        });
      }

      return;
    }

    // O'YINNI TUGATISH
    if (msg.type === "finishMatch") {
      const match = matches.get(msg.matchId);

      if (!match) return;

      const winner = msg.winner;

      const winnerId =
        winner === "white"
          ? match.white
          : match.black;

      const loserId =
        winner === "white"
          ? match.black
          : match.white;

      const winnerPlayer = players.get(winnerId);
      const loserPlayer = players.get(loserId);

      if (winnerPlayer) {
        winnerPlayer.elo += 25;
      }

      if (loserPlayer) {
        loserPlayer.elo = Math.max(
          100,
          loserPlayer.elo - 20
        );
      }

      if (winnerPlayer) {
        send(winnerPlayer.ws, {
          type: "matchFinished",
          winner
        });
      }

      if (loserPlayer) {
        send(loserPlayer.ws, {
          type: "matchFinished",
          winner
        });
      }

      if (winnerPlayer) winnerPlayer.matchId = null;
      if (loserPlayer) loserPlayer.matchId = null;

      matches.delete(match.id);

      updatePlayers();
      return;
    }

    // MATCHDAN CHIQISH
    if (msg.type === "leaveMatch") {
      if (player.matchId === msg.matchId) {
        removePlayerFromMatch(player);
      }
      return;
    }
  });

  ws.on("close", () => {
    if (!player) return;

    removePlayerFromMatch(player);

    for (const [id, request] of requests) {
      if (
        request.fromId === player.id ||
        request.toId === player.id
      ) {
        requests.delete(id);
      }
    }

    players.delete(player.id);
    updatePlayers();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log("   ShashkaPRO Online Server");
  console.log("=================================");
  console.log("Server: http://0.0.0.0:" + PORT);
  console.log("WebSocket: ws://0.0.0.0:" + PORT);
  console.log("=================================");
  console.log("");
});
