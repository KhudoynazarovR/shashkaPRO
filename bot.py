import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

TOKEN = os.getenv("BOT_TOKEN")

# ShashkaPRO sayti. GitHub Pages yoqilgach shu manzil ishlaydi.
WEBAPP_URL = os.getenv(
    "WEBAPP_URL",
    "https://khudoynazarovr.github.io/shashkaPRO/"
)

IMAGE_FILE = os.path.join(os.path.dirname(__file__), "shashka_online.png")

WELCOME_TEXT = """🌐 SHASHKA ONLINE'GA XUSH KELIBSIZ!

♟️ Aql, strategiya va mahorat maydoniga xush kelibsiz!
🏆 Har bir yurish — yangi imkoniyat.
⚡ Raqibingizni mag‘lub eting, mahoratingizni namoyish qiling va g‘alabalar sari intiling!

👇 O‘yinni boshlash uchun bosing 🎮"""

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🎮 O‘yinni boshlash",
                web_app={"url": WEBAPP_URL}
            )
        ]
    ])

    if os.path.exists(IMAGE_FILE):
        with open(IMAGE_FILE, "rb") as photo:
            await update.message.reply_photo(
                photo=photo,
                caption=WELCOME_TEXT,
                reply_markup=keyboard
            )
    else:
        await update.message.reply_text(
            WELCOME_TEXT,
            reply_markup=keyboard
        )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🎮 O‘yinni ochish uchun /start bosing.")

def main():
    if not TOKEN:
        print("❌ BOT_TOKEN topilmadi.")
        print("Avval Termuxda BOT_TOKEN ni o‘rnating.")
        return

    print("================================")
    print("   SHASHKA ONLINE BOT")
    print("================================")
    print(f"WebApp: {WEBAPP_URL}")
    print("Bot ishga tushdi. Telegramda /start yuboring.")
    print("================================")

    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.run_polling()

if __name__ == "__main__":
    main()
