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
const pay = require("./payments.js");

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

function kbFor(msg) {
  if (!msg.chat || msg.chat.type !== "private") return undefined;
  const L = "https://t.me/" + BOT + "/" + APP + "?startapp=go_";
  return {
    inline_keyboard: [
      [{ text: "🎮 Shashka Mini App", url: L + "main" }],
      [{ text: "🧩 Masala yechish", url: L + "puz" }],
      [{ text: "🤖 AI bilan o‘ynash", url: L + "ai" }]
    ]
  };
}

async function onMessage(msg) {
  const text = (msg.text || "").trim();
  const _go = { "🎮 Shashka Mini App": ["Shashka Mini App", "main"], "🧩 Masala yechish": ["Masalalar", "puz"], "🤖 AI bilan o‘ynash": ["AI bilan o‘yin", "ai"] }[text];
  if (_go) {
    try { await api("deleteMessage", { chat_id: msg.chat.id, message_id: msg.message_id }); } catch (e) {}
    try { const rm2 = await api("sendMessage", { chat_id: msg.chat.id, text: "⏳", reply_markup: { remove_keyboard: true } }); if (rm2 && rm2.result) await api("deleteMessage", { chat_id: msg.chat.id, message_id: rm2.result.message_id }); } catch (e) {}
    await api("sendMessage", { chat_id: msg.chat.id, text: "Shashka o‘ynash uchun 👇", reply_markup: kbFor(msg) });
    return;
  }
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
    if (msg.chat.type === "private") {
      try {
        const rm = await api("sendMessage", { chat_id: msg.chat.id, text: "⏳", reply_markup: { remove_keyboard: true } });
        if (rm && rm.result) await api("deleteMessage", { chat_id: msg.chat.id, message_id: rm.result.message_id });
      } catch (e) {}
    }
    await api("sendMessage", {
      chat_id: msg.chat.id,
      text: msg.chat.type === "private" ? "Shashka o‘ynash uchun 👇" : "Shashka o‘ynash uchun /new yozing — yangi xona havolasi yuboriladi.\nGuruhda ham ishlaydi. Yoki istalgan chatda @" + BOT + " deb yozing.", reply_markup: kbFor(msg)
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

  function onMyChat(m) {
    try {
      const ch = m.chat || {};
      if (ch.type !== 'group' && ch.type !== 'supergroup') return;
      const st = (m.new_chat_member || {}).status;
      const adm = st === 'administrator' || st === 'creator';
      const s = require('./store');
      s.db.groups = s.db.groups || [];
      const id = String(ch.id), i = s.db.groups.findIndex(x => String(x) === id);
      if (adm && i < 0) { s.db.groups.push(ch.id); console.log('[bot] guruh qo‘shildi:', ch.title, id); s.save(); }
      else if (!adm && i >= 0) { s.db.groups.splice(i, 1); console.log('[bot] guruh o‘chirildi:', ch.title, id); s.save(); }
    } catch (e) { console.log('[bot] my_chat_member xato:', e.message); }
  }
  async function onCallback(q) {
    if (q.data !== 'top10') return;
    let txt = '🏆 TOP 10';
    try {
      const st = require('./store');
      const ids = new Set((st.db.puzzles || []).map(x => x.id));
      const rows = Object.values(st.users()).map(v => ({ name: Array.from(String(v.name || 'Foydalanuvchi')).slice(0, 12).join(''), n: (v.solved || []).filter(i => ids.has(i)).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).slice(0, 10);
      if (!rows.length) txt += '\nHozircha hech kim yechmagan';
      for (let i = 0; i < rows.length; i++) {
        const line = '\n' + (i + 1) + '. ' + rows[i].name + ' — ' + rows[i].n;
        if (Array.from(txt + line).length > 200) break;
        txt += line;
      }
    } catch (e) { txt = 'TOP hozircha mavjud emas'; }
    try { await api("answerCallbackQuery", { callback_query_id: q.id, text: txt, show_alert: true }); } catch (e) {}
  }
  let offset = 0;
  for (;;) {
    try {
      const r = await api("getUpdates", {
        offset: offset,
        timeout: 30,
        allowed_updates: ["message", "inline_query", "pre_checkout_query", "callback_query", "my_chat_member"]
      });
      if (!r.ok) throw new Error(r.description || "getUpdates xato");
      for (const u of r.result) {
        offset = u.update_id + 1;
        try {
          if (u.pre_checkout_query) await pay.onPreCheckout(u.pre_checkout_query);
          else if (u.message && u.message.successful_payment) await pay.onPayment(u.message);
          else if (u.message) await onMessage(u.message);
          else if (u.inline_query) await onInline(u.inline_query);
          else if (u.callback_query) await onCallback(u.callback_query);
          else if (u.my_chat_member) onMyChat(u.my_chat_member);
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
