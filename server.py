import asyncio, hashlib, hmac, json, os, random, sqlite3, time, uuid
from urllib.parse import parse_qsl
from aiohttp import web, WSMsgType

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
DEV = os.environ.get("DEV") == "1"          # lokal sinov: initData = "dev:123:Ali"
DB_PATH = os.environ.get("DB_PATH", "shashka.db")  # Render'da doimiy disk yo'li, masalan /data/shashka.db
BASE = os.path.dirname(os.path.abspath(__file__))
TIME_BASE, TIME_INC = 300, 3                # 5+3
DIRS = [(1, 1), (1, -1), (-1, 1), (-1, -1)]

db = sqlite3.connect(DB_PATH, check_same_thread=False)
db.executescript("""
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, elo INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, draws INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS games(id TEXT PRIMARY KEY, white INTEGER, black INTEGER,
  moves TEXT, result TEXT, rated INTEGER, ts INTEGER);
""")

ONLINE, QUEUE, GAMES, IN_GAME = {}, {}, {}, {}


# ---------- QOIDALAR (rus shashkasi) ----------
def ins(r, c): return 0 <= r < 8 and 0 <= c < 8
def side_of(p): return p.lower() if p else None
def is_king(p): return p in ("W", "B")
def other(s): return "b" if s == "w" else "w"
def sq(r, c): return "abcdefgh"[c] + str(8 - r)

def start_board():
    b = [[None] * 8 for _ in range(8)]
    for r in range(8):
        for c in range(8):
            if (r + c) % 2 == 1:
                if r < 3: b[r][c] = "b"
                elif r > 4: b[r][c] = "w"
    return b

def captures(b, r, c):
    p = b[r][c]; s = side_of(p); out = []
    for dr, dc in DIRS:
        if is_king(p):
            nr, nc, found = r + dr, c + dc, None
            while ins(nr, nc):
                q = b[nr][nc]
                if not q:
                    if found: out.append(((r, c), (nr, nc), found))
                elif side_of(q) != s and not found:
                    found = (nr, nc)
                else:
                    break
                nr += dr; nc += dc
        else:
            er, ec, lr, lc = r + dr, c + dc, r + 2 * dr, c + 2 * dc
            if ins(lr, lc) and b[er][ec] and side_of(b[er][ec]) != s and not b[lr][lc]:
                out.append(((r, c), (lr, lc), (er, ec)))
    return out

def steps(b, r, c):
    p = b[r][c]; out = []
    if is_king(p):
        for dr, dc in DIRS:
            nr, nc = r + dr, c + dc
            while ins(nr, nc) and not b[nr][nc]:
                out.append(((r, c), (nr, nc), None)); nr += dr; nc += dc
    else:
        dr = -1 if p == "w" else 1
        for dc in (-1, 1):
            nr, nc = r + dr, c + dc
            if ins(nr, nc) and not b[nr][nc]:
                out.append(((r, c), (nr, nc), None))
    return out

def legal(b, side, chain=None):
    cells = [chain] if chain else [(r, c) for r in range(8) for c in range(8) if side_of(b[r][c]) == side]
    caps = [m for r, c in cells for m in captures(b, r, c)]
    if caps or chain: return caps
    return [m for r, c in cells for m in steps(b, r, c)]

def apply(b, m):
    (r, c), (nr, nc), cap = m
    p = b[r][c]; b[r][c] = None
    if cap: b[cap[0]][cap[1]] = None
    if p == "w" and nr == 0: p = "W"
    if p == "b" and nr == 7: p = "B"
    b[nr][nc] = p


# ---------- O'YIN ----------
class Game:
    def __init__(s, w, b, rated):
        s.id = uuid.uuid4().hex[:8]; s.p = {"w": w, "b": b}; s.rated = rated
        s.board = start_board(); s.turn = "w"; s.chain = None; s.moves = []
        s.t = {"w": TIME_BASE, "b": TIME_BASE}; s.last = time.time()
        s.draw = None; s.over = False; s.disc = {}

    def state(s):
        t = dict(s.t); t[s.turn] -= time.time() - s.last
        return {"type": "state", "id": s.id, "board": s.board, "turn": s.turn,
                "chain": s.chain, "t": {k: round(max(0, v), 1) for k, v in t.items()},
                "moves": s.moves}

async def send(u, payload):
    ws = u.get("ws")
    if ws and not ws.closed:
        try: await ws.send_json(payload)
        except Exception: pass

async def broadcast(g):
    st = g.state()
    for u in g.p.values(): await send(u, st)

async def end(g, winner, reason):
    if g.over: return
    g.over = True
    W, B = g.p["w"], g.p["b"]
    score = {"w": 1, "b": 0}.get(winner, 0.5)
    d = {"w": 0, "b": 0}
    if g.rated:
        ew = 1 / (1 + 10 ** ((B["elo"] - W["elo"]) / 400))
        d["w"] = round(32 * (score - ew)); d["b"] = -d["w"]
    for side, u in g.p.items():
        u["elo"] = max(0, u["elo"] + d[side])
        if winner is None: u["draws"] += 1
        elif winner == side: u["wins"] += 1
        else: u["losses"] += 1
        db.execute("UPDATE users SET elo=?,wins=?,losses=?,draws=? WHERE id=?",
                   (u["elo"], u["wins"], u["losses"], u["draws"], u["id"]))
        IN_GAME.pop(u["id"], None)
    db.execute("INSERT INTO games VALUES(?,?,?,?,?,?,?)",
               (g.id, W["id"], B["id"], " ".join(g.moves),
                f"{winner or 'draw'}:{reason}", int(g.rated), int(time.time())))
    db.commit(); GAMES.pop(g.id, None)
    for side, u in g.p.items():
        await send(u, {"type": "end", "winner": winner, "reason": reason,
                       "delta": d[side], "elo": u["elo"]})

async def do_move(g, side, frm, to):
    if g.over or g.turn != side: return
    now = time.time(); g.t[side] -= now - g.last; g.last = now
    if g.t[side] <= 0: return await end(g, other(side), "time")
    m = next((x for x in legal(g.board, side, g.chain)
              if x[0] == tuple(frm) and x[1] == tuple(to)), None)
    if not m:
        return await send(g.p[side], {"type": "error", "msg": "illegal"})
    apply(g.board, m)
    g.moves.append(sq(*m[0]) + ("x" if m[2] else "-") + sq(*m[1]))
    g.draw = None
    if m[2] and captures(g.board, *m[1]):
        g.chain = m[1]                       # shu dona bilan urishni davom ettirish majburiy
    else:
        g.chain = None; g.t[side] += TIME_INC; g.turn = other(side)
        if not legal(g.board, g.turn):
            await broadcast(g); return await end(g, side, "no_moves")
    await broadcast(g)

def match_msg(g, side):
    o = g.p[other(side)]
    return {"type": "match", "id": g.id, "color": side, "rated": g.rated,
            "opp": {"name": o["name"], "elo": o["elo"]}}

async def start_game(a, b, rated):
    QUEUE.pop(a["id"], None); QUEUE.pop(b["id"], None)
    if random.random() < .5: a, b = b, a
    g = Game(a, b, rated); GAMES[g.id] = g
    IN_GAME[a["id"]] = (g, "w"); IN_GAME[b["id"]] = (g, "b")
    for side, u in g.p.items(): await send(u, match_msg(g, side))
    await broadcast(g)


# ---------- FONLAR ----------
async def matchmaker():
    while True:
        await asyncio.sleep(1)
        now = time.time()
        for rated in (True, False):
            q = sorted([x for x in QUEUE.values() if x[1] == rated], key=lambda x: x[2])
            used = set()
            for i, a in enumerate(q):
                if a[0]["id"] in used: continue
                win = 100 + 50 * int(now - a[2]) if rated else 10 ** 9   # kutgan sari oraliq kengayadi
                for b in q[i + 1:]:
                    if b[0]["id"] in used: continue
                    if abs(a[0]["elo"] - b[0]["elo"]) <= win:
                        used |= {a[0]["id"], b[0]["id"]}
                        await start_game(a[0], b[0], rated); break

async def clock_loop():
    while True:
        await asyncio.sleep(1)
        now = time.time()
        for g in list(GAMES.values()):
            if g.over: continue
            if g.t[g.turn] - (now - g.last) <= 0:
                await end(g, other(g.turn), "time"); continue
            for side, ts in list(g.disc.items()):
                if now - ts > 45: await end(g, other(side), "disconnect")


# ---------- KIRISH ----------
def verify(init):
    try:
        if DEV and init.startswith("dev:"):
            _, i, n = init.split(":", 2); return {"id": int(i), "first_name": n}
        data = dict(parse_qsl(init, keep_blank_values=True))
        h = data.pop("hash", None)
        if not h or not BOT_TOKEN: return None
        check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
        secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(hmac.new(secret, check.encode(), hashlib.sha256).hexdigest(), h):
            return None
        if time.time() - int(data.get("auth_date", 0)) > 86400: return None
        return json.loads(data["user"])
    except Exception:
        return None

def load_user(u):
    row = db.execute("SELECT elo,wins,losses,draws FROM users WHERE id=?", (u["id"],)).fetchone()
    name = u.get("first_name", "Player")
    if not row:
        db.execute("INSERT INTO users(id,name) VALUES(?,?)", (u["id"], name)); db.commit()
        row = (1000, 0, 0, 0)
    return {"id": u["id"], "name": name, "elo": row[0], "wins": row[1],
            "losses": row[2], "draws": row[3], "ws": None}

async def ws_handler(req):
    ws = web.WebSocketResponse(heartbeat=20); await ws.prepare(req)
    user = None
    async for msg in ws:
        if msg.type != WSMsgType.TEXT: continue
        try: d = json.loads(msg.data)
        except Exception: continue
        t = d.get("type")
        if t == "auth":
            u = verify(d.get("initData", ""))
            if not u:
                await ws.send_json({"type": "error", "msg": "auth"}); continue
            user = ONLINE.get(u["id"]) or load_user(u)
            ONLINE[user["id"]] = user; user["ws"] = ws
            await ws.send_json({"type": "auth_ok", "id": user["id"], "name": user["name"],
                                "elo": user["elo"], "wins": user["wins"],
                                "losses": user["losses"], "draws": user["draws"]})
            if user["id"] in IN_GAME:        # qayta ulanish
                g, side = IN_GAME[user["id"]]; g.disc.pop(side, None)
                await send(user, match_msg(g, side)); await send(user, g.state())
            continue
        if not user: continue
        uid = user["id"]
        if t == "find" and uid not in IN_GAME:
            QUEUE[uid] = (user, bool(d.get("rated", True)), time.time())
            await ws.send_json({"type": "queued"})
        elif t == "cancel":
            QUEUE.pop(uid, None); await ws.send_json({"type": "cancelled"})
        elif uid in IN_GAME:
            g, side = IN_GAME[uid]
            if t == "move": await do_move(g, side, d.get("from", []), d.get("to", []))
            elif t == "resign": await end(g, other(side), "resign")
            elif t == "draw_offer":
                g.draw = side; await send(g.p[other(side)], {"type": "draw_offered"})
            elif t == "draw_accept" and g.draw and g.draw != side:
                await end(g, None, "draw")
    if user and user.get("ws") is ws:
        QUEUE.pop(user["id"], None)
        if user["id"] in IN_GAME:
            g, side = IN_GAME[user["id"]]; g.disc[side] = time.time()
    return ws

async def top(req):
    rows = db.execute("SELECT name,elo,wins,games FROM (SELECT name,elo,wins,wins+losses+draws AS games "
                      "FROM users) ORDER BY elo DESC LIMIT 30").fetchall()
    return web.json_response([{"name": r[0], "elo": r[1], "wins": r[2], "games": r[3]} for r in rows])

async def index(req):
    return web.FileResponse(os.path.join(BASE, "index.html"))

async def on_start(app):
    app["tasks"] = [asyncio.create_task(matchmaker()), asyncio.create_task(clock_loop())]

app = web.Application()
app.add_routes([web.get("/", index), web.get("/ws", ws_handler), web.get("/top", top)])
app.on_startup.append(on_start)

if __name__ == "__main__":
    web.run_app(app, port=int(os.environ.get("PORT", 8080)))
