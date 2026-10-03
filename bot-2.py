import os
import random
import asyncio
from dataclasses import dataclass, field

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, CommandHandler, CallbackQueryHandler,
    ContextTypes
)

# ============================================================
# SHASHKA GAMEBOT
# Rangli doska + 2 o'yinchi + AI + ELO reyting + TOP + profil
# ============================================================

TOKEN = os.getenv("BOT_TOKEN", "BOT_TOKENINGIZNI_SHU_YERGA_QOYING")

# Xotirada saqlanadi. Bot qayta ishga tushsa ma'lumotlar tozalanadi.
USERS = {}          # user_id -> stats
GAMES = {}          # chat_id -> Game


@dataclass
class Game:
    chat_id: int
    board: list
    red_player: int | None = None
    black_player: int | None = None
    turn: str = "r"
    selected: tuple | None = None
    against_ai: bool = False
    ai_color: str = "b"
    move_count: int = 0
    started: bool = False
    message_id: int | None = None


def new_board():
    b = [["." for _ in range(8)] for _ in range(8)]
    for r in range(3):
        for c in range(8):
            if (r + c) % 2 == 1:
                b[r][c] = "b"
    for r in range(5, 8):
        for c in range(8):
            if (r + c) % 2 == 1:
                b[r][c] = "r"
    return b


def stats(uid):
    if uid not in USERS:
        USERS[uid] = {
            "name": "Player",
            "rating": 1000,
            "wins": 0,
            "losses": 0,
            "draws": 0,
            "streak": 0,
            "best_streak": 0,
            "coins": 100,
        }
    return USERS[uid]


def piece_color(p):
    return p.lower() if p != "." else None


def is_king(p):
    return p in ("R", "B")


def inside(r, c):
    return 0 <= r < 8 and 0 <= c < 8


def directions_for(piece):
    color = piece_color(piece)
    if is_king(piece):
        return [(-1,-1), (-1,1), (1,-1), (1,1)]
    return [(-1,-1), (-1,1)] if color == "r" else [(1,-1), (1,1)]


def captures(board, r, c):
    p = board[r][c]
    if p == ".":
        return []
    out = []
    enemy = "b" if piece_color(p) == "r" else "r"
    for dr, dc in directions_for(p):
        mr, mc = r + dr, c + dc
        tr, tc = r + 2*dr, c + 2*dc
        if inside(tr, tc) and inside(mr, mc):
            if piece_color(board[mr][mc]) == enemy and board[tr][tc] == ".":
                out.append((tr, tc))
    return out


def moves_for_piece(board, r, c, must_capture=False):
    p = board[r][c]
    if p == ".":
        return []
    caps = captures(board, r, c)
    if must_capture:
        return caps
    if caps:
        return caps
    out = []
    for dr, dc in directions_for(p):
        nr, nc = r + dr, c + dc
        if inside(nr, nc) and board[nr][nc] == ".":
            out.append((nr, nc))
    return out


def all_moves(board, color):
    cap_moves = []
    normal = []
    for r in range(8):
        for c in range(8):
            if piece_color(board[r][c]) != color:
                continue
            for dest in captures(board, r, c):
                cap_moves.append(((r,c), dest))
    if cap_moves:
        return cap_moves
    for r in range(8):
        for c in range(8):
            if piece_color(board[r][c]) != color:
                continue
            for dest in moves_for_piece(board, r, c):
                normal.append(((r,c), dest))
    return normal


def mandatory_capture(board, color):
    return any(captures(board, r, c) for r in range(8) for c in range(8)
               if piece_color(board[r][c]) == color)


def make_move(board, src, dst):
    r, c = src
    nr, nc = dst
    p = board[r][c]
    board[nr][nc] = p
    board[r][c] = "."
    if abs(nr-r) == 2:
        board[(r+nr)//2][(c+nc)//2] = "."
    # promotion
    if p == "r" and nr == 0:
        board[nr][nc] = "R"
    elif p == "b" and nr == 7:
        board[nr][nc] = "B"


def board_text(game):
    b = game.board
    lines = []
    for r in range(8):
        row = []
        for c in range(8):
            dark = (r+c) % 2 == 1
            p = b[r][c]
            if game.selected == (r,c):
                cell = "🔆"
            elif p == "r":
                cell = "🔴"
            elif p == "R":
                cell = "👑"
            elif p == "b":
                cell = "⚫"
            elif p == "B":
                cell = "🟡"
            else:
                cell = "🟫" if dark else "⬜"
            row.append(cell)
        lines.append("".join(row))
    return "\n".join(lines)


def board_keyboard(game):
    kb = []
    for r in range(8):
        row = []
        for c in range(8):
            row.append(InlineKeyboardButton(
                "·",
                callback_data=f"sq:{r}:{c}"
            ))
        kb.append(row)
    kb.append([
        InlineKeyboardButton("🔄 Yangi o'yin", callback_data="new"),
        InlineKeyboardButton("🏳️ Taslim", callback_data="resign")
    ])
    return InlineKeyboardMarkup(kb)


def menu_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("👥 2 o'yinchi", callback_data="start2"),
            InlineKeyboardButton("🤖 AI bilan", callback_data="startai")
        ],
        [
            InlineKeyboardButton("🏆 TOP reyting", callback_data="top"),
            InlineKeyboardButton("👤 Profil", callback_data="profile")
        ],
    ])


def game_caption(game):
    red = f"👤 {stats(game.red_player)['name']}" if game.red_player else "🔴 Qizil"
    black = "🤖 AI" if game.against_ai else (
        f"👤 {stats(game.black_player)['name']}" if game.black_player else "⚫ Qora"
    )
    turn = "🔴 Qizil" if game.turn == "r" else "⚫ Qora"
    return (
        "♟️ *SHASHKA GAMEBOT*\n\n"
        f"{red}  ⚔️  {black}\n"
        f"🎯 Navbat: {turn}\n"
        f"♟️ Yurishlar: {game.move_count}\n\n"
        "🔴 Qizil • ⚫ Qora • 👑 Dama"
    )


def set_name(uid, name):
    stats(uid)["name"] = name[:25] or "Player"


def result_update(winner, loser):
    if winner:
        s = stats(winner)
        s["wins"] += 1
        s["streak"] += 1
        s["best_streak"] = max(s["best_streak"], s["streak"])
        s["rating"] += 25
        s["coins"] += 50
    if loser:
        s = stats(loser)
        s["losses"] += 1
        s["streak"] = 0
        s["rating"] = max(100, s["rating"] - 15)
        s["coins"] += 10


def ai_move(game):
    moves = all_moves(game.board, game.ai_color)
    if not moves:
        return False
    # Oddiy AI: avval urib olishga, keyin dama qilishga ustuvorlik beradi.
    captures_first = [m for m in moves if abs(m[1][0]-m[0][0]) == 2]
    choices = captures_first or moves
    move = random.choice(choices)
    make_move(game.board, *move)
    game.move_count += 1
    return True


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    set_name(uid, update.effective_user.first_name or "Player")
    text = (
        "🎮 *SHASHKA GAMEBOT*\n\n"
        "Chiroyli rangli doska, AI, TOP reyting va profil tayyor! 🔥\n\n"
        "Rejimni tanlang:"
    )
    await update.message.reply_text(text, parse_mode="Markdown",
                                    reply_markup=menu_keyboard())


async def newgame_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    chat_id = update.effective_chat.id
    g = Game(chat_id, new_board(), red_player=uid)
    GAMES[chat_id] = g
    await update.message.reply_text(
        "👥 Yangi 2 o'yinchilik xona yaratildi.\n"
        "Ikkinchi o'yinchi /join yozsin."
    )


async def join_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    uid = update.effective_user.id
    if chat_id not in GAMES:
        await update.message.reply_text("Avval /newgame bosing.")
        return
    g = GAMES[chat_id]
    if g.black_player and g.black_player != uid:
        await update.message.reply_text("Bu o'yin allaqachon boshlangan.")
        return
    if g.red_player == uid:
        await update.message.reply_text("Siz allaqachon o'yindasiz.")
        return
    g.black_player = uid
    g.started = True
    set_name(uid, update.effective_user.first_name or "Player")
    await update.message.reply_text(
        game_caption(g), parse_mode="Markdown", reply_markup=board_keyboard(g)
    )


async def show_top(target, uid=None):
    rows = sorted(USERS.items(), key=lambda x: x[1]["rating"], reverse=True)
    text = "🏆 *TOP REYTING*\n\n"
    medals = ["🥇", "🥈", "🥉"]
    for i, (pid, s) in enumerate(rows[:10], 1):
        medal = medals[i-1] if i <= 3 else f"{i}."
        text += f"{medal} {s['name']} — ⭐ {s['rating']} | 🏆 {s['wins']}\n"
    if not rows:
        text += "Hali reyting yo'q."
    await target.reply_text(text, parse_mode="Markdown")


async def profile(target, uid):
    s = stats(uid)
    text = (
        "👤 *PROFIL*\n\n"
        f"👤 Ism: {s['name']}\n"
        f"⭐ Reyting: {s['rating']}\n"
        f"🏆 G'alaba: {s['wins']}\n"
        f"💀 Mag'lubiyat: {s['losses']}\n"
        f"🤝 Durang: {s['draws']}\n"
        f"🔥 Streak: {s['streak']}\n"
        f"🏅 Eng yaxshi streak: {s['best_streak']}\n"
        f"🪙 Coin: {s['coins']}"
    )
    await target.reply_text(text, parse_mode="Markdown")


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    uid = q.from_user.id
    chat_id = q.message.chat_id
    set_name(uid, q.from_user.first_name or "Player")

    if q.data == "top":
        await show_top(q.message, uid)
        return

    if q.data == "profile":
        await profile(q.message, uid)
        return

    if q.data == "start2":
        g = Game(chat_id, new_board(), red_player=uid)
        GAMES[chat_id] = g
        await q.edit_message_text(
            "👥 2 o'yinchilik o'yin yaratildi.\n"
            "Ikkinchi o'yinchi shu chatda /join yozsin."
        )
        return

    if q.data == "startai":
        g = Game(chat_id, new_board(), red_player=uid, against_ai=True)
        GAMES[chat_id] = g
        g.started = True
        await q.edit_message_text(
            game_caption(g), parse_mode="Markdown",
            reply_markup=board_keyboard(g)
        )
        return

    if q.data == "new":
        g = Game(chat_id, new_board(), red_player=uid)
        GAMES[chat_id] = g
        await q.edit_message_text(
            "👥 Yangi o'yin yaratildi.\nIkkinchi o'yinchi /join yozsin."
        )
        return

    if q.data == "resign":
        g = GAMES.get(chat_id)
        if not g:
            return
        if uid not in (g.red_player, g.black_player):
            return
        winner = g.black_player if uid == g.red_player else g.red_player
        if winner:
            result_update(winner, uid)
        await q.edit_message_text("🏳️ O'yin tugadi.\n🏆 G'olib: raqib!")
        GAMES.pop(chat_id, None)
        return

    if not q.data.startswith("sq:"):
        return

    g = GAMES.get(chat_id)
    if not g or not g.started:
        await q.answer("Avval o'yinni boshlang.", show_alert=True)
        return

    color = "r" if uid == g.red_player else "b" if uid == g.black_player else None
    if g.against_ai:
        color = "r" if uid == g.red_player else None

    if color != g.turn:
        await q.answer("⏳ Hozir sizning navbatingiz emas.", show_alert=True)
        return

    _, rs, cs = q.data.split(":")
    r, c = int(rs), int(cs)
    p = g.board[r][c]

    if g.selected is None:
        if piece_color(p) != g.turn:
            await q.answer("Bu sizning donangiz emas.", show_alert=True)
            return
        if mandatory_capture(g.board, g.turn) and not captures(g.board, r, c):
            await q.answer("⚔️ Urib olish majburiy!", show_alert=True)
            return
        if not moves_for_piece(g.board, r, c, mandatory_capture(g.board, g.turn)):
            await q.answer("Bu dona yura olmaydi.", show_alert=True)
            return
        g.selected = (r, c)
        await q.edit_message_text(
            game_caption(g), parse_mode="Markdown",
            reply_markup=board_keyboard(g)
        )
        return

    src = g.selected
    legal = moves_for_piece(g.board, src[0], src[1], mandatory_capture(g.board, g.turn))
    if (r, c) not in legal:
        await q.answer("❌ Bu yurish mumkin emas.", show_alert=True)
        g.selected = None
        return

    make_move(g.board, src, (r, c))
    g.selected = None
    g.move_count += 1

    # Ketma-ket urish
    if abs(r-src[0]) == 2 and captures(g.board, r, c):
        g.selected = (r, c)
        await q.edit_message_text(
            game_caption(g) + "\n\n⚔️ Yana urishingiz mumkin!",
            parse_mode="Markdown", reply_markup=board_keyboard(g)
        )
        return

    g.turn = "b" if g.turn == "r" else "r"

    # AI
    if g.against_ai and g.turn == g.ai_color:
        await q.edit_message_text(
            game_caption(g) + "\n\n🤖 AI o'ylayapti...",
            parse_mode="Markdown", reply_markup=board_keyboard(g)
        )
        await asyncio.sleep(0.5)
        if not ai_move(g):
            result_update(g.red_player, None)
            await q.edit_message_text("🏆 Siz yutdingiz! 🎉")
            GAMES.pop(chat_id, None)
            return
        g.turn = "r"

    moves = all_moves(g.board, g.turn)
    if not moves:
        winner = g.red_player if g.turn == "b" else g.black_player
        loser = g.black_player if g.turn == "b" else g.red_player
        if g.against_ai:
            winner = g.red_player if g.turn == "b" else None
            loser = g.red_player if g.turn == "r" else None
        result_update(winner, loser)
        await q.edit_message_text(
            game_caption(g) + "\n\n🏆 *O'YIN TUGADI!*\nG'olib aniqlandi! 🎉",
            parse_mode="Markdown"
        )
        GAMES.pop(chat_id, None)
        return

    await q.edit_message_text(
        game_caption(g), parse_mode="Markdown",
        reply_markup=board_keyboard(g)
    )


async def top_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await show_top(update.message, update.effective_user.id)


async def profile_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    set_name(uid, update.effective_user.first_name or "Player")
    await profile(update.message, uid)


def main():
    if TOKEN == "BOT_TOKENINGIZNI_SHU_YERGA_QOYING":
        print("TOKEN topilmadi! bot.py ichidagi TOKEN joyiga BotFather tokenini qo'ying.")
        return

    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("newgame", newgame_cmd))
    app.add_handler(CommandHandler("join", join_cmd))
    app.add_handler(CommandHandler("top", top_cmd))
    app.add_handler(CommandHandler("profile", profile_cmd))
    app.add_handler(CallbackQueryHandler(button))
    print("✅ Shashka GameBot ishga tushdi!")
    app.run_polling()


if __name__ == "__main__":
    main()
