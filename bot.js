// bot.js — /new buyrug'i va inline rejim: yangi xona havolasini yuboradi.
// Qo'shimcha kutubxona kerak emas (Node 18+). Long polling ishlatadi.
//
// Render Environment:
//   BOT_TOKEN    = BotFather bergan token (allaqachon bor)
//   BOT_USERNAME = DraughtsPRObot   (@ belgisiz)
//   APP_NAME     = play             (/newapp dagi short name)
//
// Ulash: server.js ning eng tepasiga  require("./bot.js");  qo'shing.

const crypto = require("crypto");

const TOKEN = process.env.BOT_TOKEN;
const BOT = process.env.BOT_USERNAME || "DraughtsPRObot";
const APP = process.env.APP_NAME || "play";

if (!TOKEN) {
  console.log("[bot] BOT_TOKEN yo'q — bot ishga tushmadi");
} else {
  start();
}

function api(method, params) {
  return fetch("https://api.telegram.org/bot" + TOKEN + "/" + method, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {})
  }).then(r => r.json());
}

// Xona nomi: faqat harf va raqam, 8 belgi (rooms.js dagi ROOM_RE ga mos)
function newRoomId() {
  const abc = "abcdefghijkmnpqrstuvwxyz23456789";
  const b = crypto.randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += abc[b[i] % abc.length];
  return s;
}

function roomLink(id) {
  return "https://t.me/" + BOT + "/" + APP + "?startapp=" + id;
}

function playMarkup(id) {
  return { inline_keyboard: [[{ text: "♟️ O‘ynash", url: roomLink(id) }]] };
}

const TEXT = "♟️ Shashka — yangi xona tayyor!\nBirinchi kirgan oq, ikkinchisi qora, qolganlar tomoshabin.";

async function onMessage(msg) {
  const text = (msg.text || "").trim();
  if (!text.startsWith("/")) return;
  // /new yoki /new@DraughtsPRObot
  const cmd = text.split(/\s+/)[0].split("@");
  if (cmd[1] && cmd[1].toLowerCase() !== BOT.toLowerCase()) return; // boshqa botga
  const name = cmd[0].toLowerCase();

  if (name === "/new" || name === "/shashka") {
    const id = newRoomId();
    await api("sendMessage", {
      chat_id: msg.chat.id,
      text: TEXT,
      reply_markup: playMarkup(id)
    });
  } else if (name === "/start" || name === "/help") {
    await api("sendMessage", {
      chat_id: msg.chat.id,
      text: "Shashka o‘ynash uchun /new yozing — yangi xona havolasi yuboriladi.\n" +
        "Guruhda ham ishlaydi. Yoki istalgan chatda @" + BOT + " deb yozing."
    });
  }
}

async function onInline(q) {
  const id = newRoomId();
  await api("answerInlineQuery", {
    inline_query_id: q.id,
    cache_time: 0,
    is_personal: true,
    results: [
      {
        type: "article",
        id: id,
        title: "♟️ Shashka o‘ynash",
        description: "Yangi xona ochish va havolani yuborish",
        input_message_content: { message_text: TEXT },
        reply_markup: playMarkup(id)
      }
    ]
  });
}

async function start() {
  try { await api("deleteWebhook"); } catch (e) {}
  try {
    await api("setMyCommands", {
      commands: [{ command: "new", description: "Yangi shashka xonasi" }]
    });
  } catch (e) {}
  console.log("[bot] ishga tushdi: @" + BOT);

  let offset = 0;
  for (;;) {
    try {
      const r = await api("getUpdates", {
        offset: offset,
        timeout: 30,
        allowed_updates: ["message", "inline_query"]
      });
      if (!r.ok) throw new Error(r.description || "getUpdates xato");
      for (const u of r.result) {
        offset = u.update_id + 1;
        try {
          if (u.message) await onMessage(u.message);
          else if (u.inline_query) await onInline(u.inline_query);
        } catch (e) {
          console.log("[bot] xato:", e.message);
        }
      }
    } catch (e) {
      console.log("[bot] polling xato:", e.message);
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}
