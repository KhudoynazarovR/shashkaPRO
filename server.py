import asyncio
import json
import random
import string
import websockets

waiting = None
players = {}
games = {}


def new_room():
    return "room_" + "".join(
        random.choices(string.ascii_letters + string.digits, k=8)
    )


def start_board():
    board = [[0 for _ in range(8)] for _ in range(8)]

    for r in range(3):
        for c in range(8):
            if (r + c) % 2:
                board[r][c] = 2

    for r in range(5, 8):
        for c in range(8):
            if (r + c) % 2:
                board[r][c] = 1

    return board


async def send(ws, data):
    try:
        await ws.send(json.dumps(data))
    except:
        pass


async def handle(ws):
    global waiting

    player = {
        "ws": ws,
        "userId": None,
        "username": "Player",
        "roomId": None,
        "color": None
    }

    try:
        async for raw in ws:
            try:
                data = json.loads(raw)
            except:
                await send(ws, {
                    "type": "error",
                    "message": "JSON xatosi"
                })
                continue

            msg_type = data.get("type")

            # -------------------------
            # AUTH
            # -------------------------
            if msg_type == "auth":
                player["userId"] = str(data.get("userId", ""))
                player["username"] = (
                    data.get("username") or "Player"
                )

                await send(ws, {
                    "type": "authenticated",
                    "userId": player["userId"]
                })

            # -------------------------
            # MATCHMAKING
            # -------------------------
            elif msg_type == "matchmake":

                if player["roomId"]:
                    continue

                if waiting is None:
                    waiting = player

                    await send(ws, {
                        "type": "searching"
                    })

                else:
                    opponent = waiting
                    waiting = None

                    room_id = new_room()

                    board = start_board()

                    white = opponent
                    black = player

                    white["roomId"] = room_id
                    black["roomId"] = room_id

                    white["color"] = "white"
                    black["color"] = "black"

                    games[room_id] = {
                        "white": white,
                        "black": black,
                        "board": board,
                        "turn": 1,
                        "whiteSeconds": 300,
                        "blackSeconds": 300
                    }

                    base_data = {
                        "type": "match_found",
                        "roomId": room_id,
                        "board": board,
                        "turn": 1,
                        "whiteSeconds": 300,
                        "blackSeconds": 300
                    }

                    await send(
                        white["ws"],
                        {
                            **base_data,
                            "color": "white"
                        }
                    )

                    await send(
                        black["ws"],
                        {
                            **base_data,
                            "color": "black"
                        }
                    )

            # -------------------------
            # CANCEL SEARCH
            # -------------------------
            elif msg_type == "cancel_matchmake":

                if waiting is player:
                    waiting = None

            # -------------------------
            # MOVE
            # -------------------------
            elif msg_type == "move":

                room_id = player["roomId"]

                if not room_id:
                    continue

                game = games.get(room_id)

                if not game:
                    continue

                color = player["color"]

                side = 1 if color == "white" else 2

                if game["turn"] != side:
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Hozir sizning navbatingiz emas"
                    })
                    continue

                board = game["board"]

                fr = data.get("from", {})
                to = data.get("to", {})

                r1 = int(fr.get("r", -1))
                c1 = int(fr.get("c", -1))
                r2 = int(to.get("r", -1))
                c2 = int(to.get("c", -1))

                if not (
                    0 <= r1 < 8 and
                    0 <= c1 < 8 and
                    0 <= r2 < 8 and
                    0 <= c2 < 8
                ):
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Noto‘g‘ri yurish"
                    })
                    continue

                piece = board[r1][c1]

                if piece not in (
                    1, 2, 3, 4
                ):
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Bu katakda dona yo‘q"
                    })
                    continue

                if side == 1 and piece not in (1, 3):
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Bu sizning donangiz emas"
                    })
                    continue

                if side == 2 and piece not in (2, 4):
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Bu sizning donangiz emas"
                    })
                    continue

                if board[r2][c2] != 0:
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Katak band"
                    })
                    continue

                dr = r2 - r1
                dc = c2 - c1

                valid = False
                captured = None

                # Oddiy yurish
                if abs(dr) == 1 and abs(dc) == 1:
                    valid = True

                # Urish
                elif abs(dr) == 2 and abs(dc) == 2:
                    mr = (r1 + r2) // 2
                    mc = (c1 + c2) // 2

                    middle = board[mr][mc]

                    enemy = (
                        middle in (2, 4)
                        if side == 1
                        else middle in (1, 3)
                    )

                    if enemy:
                        valid = True
                        captured = (mr, mc)

                if not valid:
                    await send(ws, {
                        "type": "invalid_move",
                        "message": "Noto‘g‘ri yurish"
                    })
                    continue

                board[r1][c1] = 0

                if captured:
                    board[captured[0]][captured[1]] = 0

                # King
                if piece == 1 and r2 == 0:
                    piece = 3

                if piece == 2 and r2 == 7:
                    piece = 4

                board[r2][c2] = piece

                game["turn"] = (
                    2 if game["turn"] == 1 else 1
                )

                message = {
                    "type": "move",
                    "board": board,
                    "turn": game["turn"],
                    "whiteSeconds": game["whiteSeconds"],
                    "blackSeconds": game["blackSeconds"]
                }

                await send(
                    game["white"]["ws"],
                    message
                )

                await send(
                    game["black"]["ws"],
                    message
                )

            # -------------------------
            # RESIGN
            # -------------------------
            elif msg_type == "resign":

                room_id = player["roomId"]

                game = games.get(room_id)

                if not game:
                    continue

                winner = (
                    "black"
                    if player["color"] == "white"
                    else "white"
                )

                message = {
                    "type": "game_over",
                    "winner": winner
                }

                await send(
                    game["white"]["ws"],
                    message
                )

                await send(
                    game["black"]["ws"],
                    message
                )

                games.pop(room_id, None)

    except websockets.exceptions.ConnectionClosed:
        pass

    finally:

        if waiting is player:
            waiting = None

        room_id = player["roomId"]

        if room_id:
            game = games.get(room_id)

            if game:

                opponent = (
                    game["black"]
                    if player["color"] == "white"
                    else game["white"]
                )

                await send(
                    opponent["ws"],
                    {
                        "type": "opponent_disconnected"
                    }
                )

                games.pop(room_id, None)


async def main():
    print("================================")
    print("   ShashkaPRO Online Server")
    print("================================")
    print("Server: ws://0.0.0.0:8090")
    print("Server ishga tushdi!")
    print("================================")

    async with websockets.serve(
        handle,
        "0.0.0.0",
        8090
    ):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
