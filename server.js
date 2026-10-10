const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");
const online = require("./online"); /*ONL:require*/

const KESTOG_PATH = path.resolve(__dirname, "../KestoG/bridge");

let kesto = null;
let kestoBusy = false;
let kestoBuffer = "";
let kestoQueue = [];

function startKestoG() {
  if (kesto) return;

  kesto = spawn(KESTOG_PATH, [], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  kesto.stdout.on("data", data => {
    kestoBuffer += data.toString();

    const lines = kestoBuffer.split("\n");
    kestoBuffer = lines.pop();

    for (const line of lines) {
      const text = line.trim();
      if (!text) continue;

      const p = text.split(/\s+/).map(Number);

      if (p.length >= 5 && p.every(Number.isFinite)) {
        const item = kestoQueue.shift();

        if (item) {
          kestoBusy = false;
          item.resolve(p);
          runNextKesto();
        }
      }
    }
  });

  kesto.stderr.on("data", data => {
    const lines = data.toString().split(/\\r?\\n/);

    for (const line of lines) {
      const text = line.trim();
      if (text) {
        console.log("[KestoG]", text);
      }
    }
  });

  kesto.on("close", () => {
    kesto = null;
    kestoBusy = false;
    kestoBuffer = "";
  });
}

function runNextKesto() {
  if (kestoBusy || !kestoQueue.length || !kesto) return;

  kestoBusy = true;
  kesto.stdin.write(kestoQueue[0].input);
}

function askKestoG(color, time, board) {
  return new Promise((resolve, reject) => {
    const input =
      color + " " + time + "\n" +
      [
        board[0][1], board[0][3], board[0][5], board[0][7],
        board[1][0], board[1][2], board[1][4], board[1][6],
        board[2][1], board[2][3], board[2][5], board[2][7],
        board[3][0], board[3][2], board[3][4], board[3][6],
        board[4][1], board[4][3], board[4][5], board[4][7],
        board[5][0], board[5][2], board[5][4], board[5][6],
        board[6][1], board[6][3], board[6][5], board[6][7],
        board[7][0], board[7][2], board[7][4], board[7][6]
      ].join(" ") + "\n";

    kestoQueue.push({
      input,
      resolve,
      reject
    });

    runNextKesto();
  });
}
startKestoG();

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

function broadcast(data, exceptId = null) {
  for (const c of clients.values()) {
    if (c.id !== exceptId) send(c.ws, data);
  }
}

function playerList() {
  return [...clients.values()].map(c => ({
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

  online.initMatch(match);
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
  online.reward(match, winner, clients, send);

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

function serveFile(req, res) {
  let requested = new URL(req.url, "http://localhost").pathname;

  if (requested === "/") requested = "/index.html";

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

  const ext = path.extname(file);

  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml"
  };

  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream"
  });

  fs.createReadStream(file).pipe(res);
}
function convertBoardForKestoG(board) {
  return board.map(row =>
    row.map(p => {
      if (p === 0) return 0;
      if (p === 1) return 5;
      if (p === 2) return 6;
      if (p === 3) return 9;
      if (p === 4) return 10;
      return 0;
    })
  );
}

async function handleAI(req, res) {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const data = JSON.parse(body);

      if (!Array.isArray(data.board) || data.board.length !== 8) {
        throw new Error("Doska noto‘g‘ri");
      }

      const color = Number(data.color) || 2;
      const time = Math.max(0.1, Number(data.time) || 1);

      const board = convertBoardForKestoG(data.board);

      const result = await askKestoG(
        color,
        time,
        board
      );

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      });

      res.end(JSON.stringify({
        ok: true,
        move: {
          from: {
            x: result[0],
            y: result[1]
          },
          to: {
            x: result[2],
            y: result[3]
          },
          jumps: result[4]
        }
      }));

    } catch (err) {
      console.error("[AI ERROR]", err);

      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      });

      res.end(JSON.stringify({
        ok: false,
        error: err.message
      }));
    }
  });
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
if (url.pathname === "/api/ai" && req.method === "POST") {
  return handleAI(req, res);
}

  if (url.pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    return res.end(JSON.stringify({
      ok: true,
      players: clients.size,
      matches: matches.size,
      waiting: waiting.size
    }));
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
        me: online.pub(c.user),
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

    if (m.type === "register") { /*ONL:login*/
      { const L = online.login(c, m); if (!L.ok) return send(ws, { type: "error", message: "Telegram orqali kiring" }); if (L.name) m.name = L.name; }
      c.name =
        String(m.name || "ShashkaPRO Player")
          .trim()
          .slice(0, 20) ||
        "ShashkaPRO Player";

      send(ws, {
        type: "registered",
        me: online.pub(c.user),
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

      if (!online.checkMove(match, side, m.move)) return send(ws, { type: "error", message: "Noto‘g‘ri yurish" });
      match.turn = match.turn === "white" ? "black" : "white";

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
      { const w = online.winnerAfter(match); if (w) finishMatch(match, w); }

      return;
    }

    if (m.type === "finishMatch") {
      const match = matches.get(m.matchId);

      if (!match) return;

      if (
        match.whiteId !== c.id &&
        match.blackId !== c.id
      ) return;

      let winner = online.claimWinner(match, c.id, m.winner);
      if (!winner) return;

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
