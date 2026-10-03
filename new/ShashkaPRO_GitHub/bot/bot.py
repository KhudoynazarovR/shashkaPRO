import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
TOKEN=os.getenv("BOT_TOKEN")
WEBAPP_URL=os.getenv("WEBAPP_URL","https://YOUR-DOMAIN/")
TEXT="""🌐 SHASHKA ONLINE'GA XUSH KELIBSIZ!

♟️ Aql, strategiya va mahorat maydoniga xush kelibsiz!
🏆 Har bir yurish — yangi imkoniyat.
⚡ Raqibingizni mag‘lub eting, mahoratingizni namoyish eting va g‘alabalar sari intiling!

👇 O‘yinni boshlash uchun bosing 🎮"""
async def start(update:Update,context:ContextTypes.DEFAULT_TYPE):
    kb=InlineKeyboardMarkup([[InlineKeyboardButton("🎮 O‘yinni boshlash",web_app=WebAppInfo(url=WEBAPP_URL))]])
    await update.message.reply_text(TEXT,reply_markup=kb)
async def help_cmd(update:Update,context:ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("/start — ShashkaPRO'ni ochish\n/help — yordam")
def main():
    if not TOKEN: raise SystemExit("BOT_TOKEN topilmadi")
    app=ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start",start));app.add_handler(CommandHandler("help",help_cmd))
    print("🤖 ShashkaPRO bot ishlayapti");app.run_polling()
if __name__=="__main__":main()
