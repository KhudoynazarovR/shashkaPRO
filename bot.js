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

setTimeout(() => { try { require('./grp.js').setLink(roomLink); } catch (e) {} }, 0);
function playMarkup(id) {
  return { inline_keyboard: [[{ text: "♟️ O‘ynash", url: roomLink(id) }]] };
}

const TEXT = "♟️ Shashka — yangi xona tayyor!\nBirinchi kirgan oq, ikkinchisi qora, qolganlar tomoshabin.";

function kbFor(msg) {
  if (!msg.chat || msg.chat.type !== "private") return undefined;
  const L = "https://t.me/" + BOT + "/" + APP + "?startapp=go_";
  return {
    inline_keyboard: [
      [{ text: "🎮 Shashka Mini App", url: L + "main", style: "primary" }],
      [{ text: "🧩 Masala yechish", url: L + "puz", style: "success" }],
      [{ text: "🤖 AI bilan o‘ynash", url: L + "ai", style: "primary" }]
    ]
  };
}

async function saveBanner(msg) {
  const f = msg.animation || msg.video || msg.document;
  const tok = process.env.BOT_TOKEN;
  const info = await api("getFile", { file_id: f.file_id });
  const fp = info && info.result && info.result.file_path;
  if (!fp) return null;
  const buf = Buffer.from(await (await fetch("https://api.telegram.org/file/bot" + tok + "/" + fp)).arrayBuffer());
  const fd = new FormData();
  fd.append("chat_id", String(msg.chat.id));
  fd.append("animation", new Blob([buf]), /\.gif$/i.test(fp) ? "banner.gif" : "banner.mp4");
  const r = await (await fetch("https://api.telegram.org/bot" + tok + "/sendAnimation", { method: "POST", body: fd })).json();
  const a = r && r.result && (r.result.animation || r.result.video || r.result.document);
  if (!a) return null;
  const st = require("./store.js");
  st.db.banner = a.file_id; st.save();
  return a.file_id;
}

async function onMessage(msg) {
  if (msg.chat && msg.chat.type === "private" && msg.from) {
    const _adm = (process.env.ADMIN_IDS || "").split(",").map(x => x.trim()).filter(Boolean).includes(String(msg.from.id));
    if (!_adm && /^\/banner/i.test(msg.caption || "")) { await api("sendMessage", { chat_id: msg.chat.id, text: "⛔ Admin emassiz. Sizning ID: " + msg.from.id + "\nADMIN_IDS: " + (process.env.ADMIN_IDS || "(bo‘sh)") }); return; }
    if (_adm && (msg.animation || msg.video || msg.document) && /^\/banner/i.test(msg.caption || "")) {
      let fid = null;
      try { fid = await saveBanner(msg); } catch (e) { console.log("banner xato:", e.message); }
      await api("sendMessage", { chat_id: msg.chat.id, text: fid ? "✅ Banner saqlandi. /start yozib ko‘ring.\n\nDoimiy bo‘lishi uchun Render → Environment ga BANNER_FILE_ID qiymatini qo‘ying:\n" + fid : "⚠️ Banner saqlanmadi. Fayl MP4 yoki GIF bo‘lsin (20 MB gacha)." });
      return;
    }
    if (_adm && /^\/backup\b/i.test(msg.text || "")) {
      const ok = await require("./store.js").tgBackup(msg.chat.id).catch(e => { console.log("backup xato:", e.message); return false; });
      if (!ok) await api("sendMessage", { chat_id: msg.chat.id, text: "⚠️ Zaxira yuborilmadi." });
      return;
    }
    if (_adm && !msg.document && /^\/restore\b/i.test(msg.text || "")) {
      const st = require("./store.js"), day = (msg.text.split(/\s+/)[1] || "").trim();
      try {
        if (!day) { const l = await st.backups(); await api("sendMessage", { chat_id: msg.chat.id, text: "Bazadagi zaxiralar:\n" + (l.join("\n") || "(yo‘q)") + "\n\nTiklash: /restore 2026-10-28\nYoki .json.gz faylni «/restore» izohi bilan yuboring." }); return; }
        await api("sendMessage", { chat_id: msg.chat.id, text: "⏳ " + day + " zaxirasidan tiklanmoqda. Server 1–2 daqiqada qayta ishga tushadi." });
        await st.restoreDay(day);
      } catch (e) { await api("sendMessage", { chat_id: msg.chat.id, text: "❌ " + e.message }); }
      return;
    }
    if (_adm && msg.document && /^\/restore\b/i.test(msg.caption || "")) {
      try {
        const info = await api("getFile", { file_id: msg.document.file_id });
        const fp = info && info.result && info.result.file_path;
        if (!fp) throw new Error("fayl 20 MB dan katta yoki yuklab bo‘lmadi");
        let buf = Buffer.from(await (await fetch("https://api.telegram.org/file/bot" + process.env.BOT_TOKEN + "/" + fp)).arrayBuffer());
        if (buf[0] === 0x1f && buf[1] === 0x8b) buf = require("zlib").gunzipSync(buf);
        const obj = JSON.parse(buf.toString("utf8"));
        const n = Object.keys((obj && obj.users) || {}).length;
        await api("sendMessage", { chat_id: msg.chat.id, text: "⏳ Tiklanmoqda: " + n + " foydalanuvchi, " + ((obj.puzzles || []).length) + " masala. Server 1–2 daqiqada qayta ishga tushadi." });
        await require("./store.js").restore(obj);
      } catch (e) {
        await api("sendMessage", { chat_id: msg.chat.id, text: "❌ Tiklanmadi: " + e.message });
      }
      return;
    }
    if (_adm && /^\/bannerdel/i.test(msg.text || "")) {
      const st = require("./store.js"); delete st.db.banner; st.save();
      await api("sendMessage", { chat_id: msg.chat.id, text: "🗑 Banner o‘chirildi (BANNER_FILE_ID bo‘lsa, uni ham Renderdan o‘chiring)." });
      return;
    }
  }
  const text = (msg.text || "").trim();
  // Telegramdan tashqarida (sayt / Play Market ilovasi) kirishni tasdiqlash
  const _lg = /^\/start(?:@\w+)?\s+login_([A-Za-z0-9]{10,40})$/.exec(text);
  if (_lg && msg.chat && msg.chat.type === "private" && msg.from) {
    const P = require("./weblogin.js").botStart(_lg[1], msg.from);
    if (!P) { await api("sendMessage", { chat_id: msg.chat.id, text: "⌛ Kirish havolasi eskirgan. Ilovada «Telegram orqali kirish» tugmasini qaytadan bosing." }); return; }
    await api("sendMessage", { chat_id: msg.chat.id, text: "🔐 ShashkaPRO ilovasiga yoki saytiga kirish so‘raldi.\n\nBu siz bo‘lsangiz — «✅ Ha, kiraman» ni bosing.\n⚠️ Agar bu havolani sizga boshqa odam yuborgan bo‘lsa, BOSMANG — u sizning hisobingizga kirib oladi.", reply_markup: { inline_keyboard: [[{ text: "✅ Ha, kiraman", callback_data: "lg:" + _lg[1], style: "success" }], [{ text: "❌ Yo‘q, bu men emas", callback_data: "lgno:" + _lg[1] }]] } });
    return;
  }
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

  if (name === "/top" || name === "/reyting") { await require("./grp.js").cmdTop(msg); return; }
  if (name === "/kubok") { await require("./grp.js").cmdTour(msg, text.split(/\s+/).slice(1).join(" ")); return; }
  if (name === "/new" || name === "/shashka") {
    const id = newRoomId();
    await api("sendMessage", {
      chat_id: msg.chat.id,
      text: TEXT,
      reply_markup: playMarkup(id)
    });
  } else if (name === "/start" || name === "/help") {
    if (msg.chat.type === "private") {
      const _bn = process.env.BANNER_FILE_ID || require("./store.js").db.banner;
      if (_bn) {
        try {
          const _rm = await api("sendMessage", { chat_id: msg.chat.id, text: "⏳", reply_markup: { remove_keyboard: true } });
          if (_rm && _rm.result) await api("deleteMessage", { chat_id: msg.chat.id, message_id: _rm.result.message_id });
        } catch (e) {}
        try {
          const _ra = await api("sendAnimation", { chat_id: msg.chat.id, animation: _bn, caption: "Shashka o‘ynash uchun 👇", reply_markup: kbFor(msg) });
          if (_ra && _ra.ok !== false) return;
        } catch (e) {}
      }
    }
    if (msg.chat.type === "private") {
      try {
        const rm = await api("sendMessage", { chat_id: msg.chat.id, text: "⏳", reply_markup: { remove_keyboard: true } });
        if (rm && rm.result) await api("deleteMessage", { chat_id: msg.chat.id, message_id: rm.result.message_id });
      } catch (e) {}
    }
    {
      const _sm = { chat_id: msg.chat.id, text: msg.chat.type === "private" ? "Shashka o‘ynash uchun 👇" : "Shashka o‘ynash uchun /new yozing — yangi xona havolasi yuboriladi.\nGuruhda ham ishlaydi. Yoki istalgan chatda @" + BOT + " deb yozing.", reply_markup: kbFor(msg) };
      let _rs = null;
      if (msg.chat.type === "private") { try { _rs = await api("sendMessage", Object.assign({ message_effect_id: "5046509860389126442" }, _sm)); } catch (e) {} }
      if (!_rs || _rs.ok === false) await api("sendMessage", _sm);
    }
  }
}

async function onInline(q) {
  const id = newRoomId(), G = require("./gcard.js"), from = String((q.from && (q.from.first_name || q.from.username)) || "").slice(0, 30);
  const o = G.parseOpt(q.query), tcC = (o.tc || "").replace("+", "p").replace(".", "d");
  const results = [];
  const ph = G.url(id, from, 0);
  const side = o.col === "b" ? "⚪ oq" : o.col === "r" ? "tasodifiy rang" : "⚫ qora", mine = o.col === "b" ? "⚫ qora" : o.col === "r" ? "🎲 tasodifiy" : "⚪ oq";
  if (ph) results.push({   // 🖼 doska kartasi: guruhga rasm + "O'yinga kirish" tugmasi, keyin jonli yangilanadi
    type: "photo", id: "g_" + id + "_" + (tcC || "0") + "_" + o.col, photo_url: ph, thumbnail_url: ph, photo_width: 1000, photo_height: 700,
    title: "♟️ Shashka o‘ynash" + (o.tc ? " · " + o.tc : ""), description: "Siz: " + mine + " · birinchi kirgan raqib bo‘ladi. Masalan: 3+2 qora",
    reply_markup: { inline_keyboard: [[{ text: "▶ O‘yinga kirish", url: roomLink(id) }]] }
  });
  // 🧠 Xotira kartasi
  const mq = String(q.query || ""), msz = /6\s*[x×х]\s*6/i.test(mq) ? "6x6" : "4x6", mtc = /\b20\s*s/i.test(mq) ? 20 : /\b10\s*s/i.test(mq) ? 10 : /2\s*(m|daq)|blitz|⚡/i.test(mq) ? -120 : 0;
  const mcode = (() => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", bb = crypto.randomBytes(6); let s = ""; for (let i = 0; i < 6; i++) s += a[bb[i] % a.length]; return s; })();
  const mrom = /romant|sevgi|yurak|gul|роман/i.test(mq);
  const mph = G.mmUrl(mcode, 0, from, mrom), mres = mph && {
    type: "photo", id: "m_" + mcode + "_" + msz + "_" + mtc + (mrom ? "_r" : ""), photo_url: mph, thumbnail_url: mph, photo_width: 1000, photo_height: 700,
    title: (mrom ? "🌹 Xotira · Romantik · " : "🧠 Xotira o‘ynash · ") + msz.replace("x", "×"), description: "Juftliklarni topish o‘yini · birinchi kirgan raqib bo‘ladi. Masalan: xotira romantik 6x6 10s",
    reply_markup: { inline_keyboard: [[{ text: "▶ O‘yinga kirish", url: roomLink("mm_" + mcode) }]] }
  };
  if (mres) { if (/xotira|memori|памят|romant/i.test(mq)) results.unshift(mres); else results.push(mres); }
  results.push({
    type: "article", id: id, title: "♟️ Shashka — oddiy havola", description: "Yangi xona ochish va havolani yuborish",
    input_message_content: { message_text: TEXT }, reply_markup: playMarkup(id)
  });
  await api("answerInlineQuery", { inline_query_id: q.id, cache_time: 0, is_personal: true, results });
}

async function start() {
  try { await api("deleteWebhook"); } catch (e) {}
  try {
    await api("setMyCommands", {
      commands: [{ command: "new", description: "Yangi shashka xonasi" }, { command: "kubok", description: "🏆 Guruh kubogi (masalan: /kubok 3+2)" }, { command: "top", description: "📊 Guruh reytingi" }]
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
    try { if (q.data && q.data.indexOf('g:') === 0 && await require('./grp.js').onCallback(q)) return; } catch (e) { console.log('[grp]', e.message); }
    if (q.data && (q.data.indexOf('lg:') === 0 || q.data.indexOf('lgno:') === 0)) {
      const yes = q.data.indexOf('lg:') === 0, code = q.data.slice(yes ? 3 : 5);
      const ok = yes && require('./weblogin.js').botConfirm(code, q.from);
      try { await api("answerCallbackQuery", { callback_query_id: q.id, text: yes ? (ok ? '✅ Kirdingiz!' : '⌛ Havola eskirgan') : 'Bekor qilindi' }); } catch (e) {}
      try { if (q.message) await api("editMessageText", { chat_id: q.message.chat.id, message_id: q.message.message_id, text: yes ? (ok ? '✅ Kirish tasdiqlandi. Ilovaga qayting — o‘yin ochiladi.' : '⌛ Havola eskirgan. Ilovada qaytadan urinib ko‘ring.') : '❌ Kirish rad etildi.' }); } catch (e) {}
      return;
    }
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
        allowed_updates: ["message", "inline_query", "chosen_inline_result", "pre_checkout_query", "callback_query", "my_chat_member"]
      });
      if (!r.ok) throw new Error(r.description || "getUpdates xato");
      for (const u of r.result) {
        offset = u.update_id + 1;
        try {
          if (u.pre_checkout_query) await pay.onPreCheckout(u.pre_checkout_query);
          else if (u.message && u.message.successful_payment) await pay.onPayment(u.message);
          else if (u.message) await onMessage(u.message);
          else if (u.inline_query) await onInline(u.inline_query);
          else if (u.chosen_inline_result) { try { const cr = u.chosen_inline_result, pr = String(cr.result_id || '').split('_'); if (pr[0] === 'm' && pr[1]) { const MRm = require('./memroom.js'), nm0 = (cr.from && (cr.from.first_name || cr.from.username)) || ''; const r = MRm.createInline(cr.from.id, nm0, pr[2], +pr[3] || 0, pr[4] === 'r' ? 'romantic' : 'animals'); MRm.rooms.delete(r.code); r.code = pr[1]; MRm.rooms.set(pr[1], r); require('./gcard.js').mmChosen(pr[1], cr.inline_message_id, nm0, roomLink('mm_' + pr[1])); } if (pr[0] === 'g' && pr[1]) { const tc = pr[2] && pr[2] !== '0' ? pr[2].replace('p', '+').replace('d', '.') : ''; require('./gcard.js').chosen(pr[1], cr.inline_message_id, (cr.from && (cr.from.first_name || cr.from.username)) || '', roomLink(pr[1]), cr.from && cr.from.id, tc, pr[3] || 'w'); } } catch (e) { console.log('[gcard]', e.message); } }
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
