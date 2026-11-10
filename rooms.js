// rooms.js — guruh o'yinlari uchun xonalar (Mini App orqali).
// Birinchi kirgan = oq (white), ikkinchi = qora (black), qolganlar = tomoshabin.
const crypto = require("crypto");
const DRAW = require("./draw-rules"); // IDF durang qoidalari (8.2.3 - 8.2.25)

const ROOM_RE = /^[A-Za-z0-9_-]{3,64}$/;
const MAX_MOVES = 1000;
const IDLE_MS = 6 * 60 * 60 * 1000;
// Vaqt rejimlari: [boshlang'ich soniya, har yurishdan keyin qo'shiladigan soniya]
const TCS = { "1+1": [60, 1], "2+2": [120, 2], "3+2": [180, 2], "5+3": [300, 3], "7+5": [420, 5], "0.5+0": [30, 0] };
const DEFAULT_TC = "5+3";
// erkin vaqt: "daqiqa+soniya" (1–60 daq, 0–30 s qo'shimcha)
function tcParse(k) { if (TCS[k]) return TCS[k]; const m = /^(\d{1,3}(?:\.\d{1,2})?)\+(\d{1,2})$/.exec(String(k || "")); if (!m) return null; const a = +m[1], b = +m[2]; return (a >= 0.25 && a <= 180 && b <= 60 && (a * 60) % 1 === 0) ? [a * 60, b] : null; }
const CHAT_KEEP = 50;
const CHAT_MAX = 200;
// 🤖 ShashkaBot: serverda faqat "o'rindiq", yurishlarni o'yinchining telefoni hisoblaydi (roomBotMove)
const isBotUid = u => typeof u === "string" && (u === "bot" || u.indexOf("bot_") === 0);
const BOT_TCS = ["∞", "1+1", "2+2", "3+2", "5+3"];
const BOT_INF_MS = 600000;   // vaqtsiz o'yinda bot o'ylash vaqtini hisoblash uchun

// Telegram Mini App initData imzosini tekshirish (BOT_TOKEN Render'da Environment'ga yoziladi)
function verifyInitData(initData) {
  const token = process.env.BOT_TOKEN;
  if (!token || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dcs = [...params.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => k + "=" + v)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calc = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
  if (calc.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const age = Date.now() / 1000 - Number(params.get("auth_date") || 0);
  if (age > 86400) return null;
  try {
    const u = JSON.parse(params.get("user") || "null");
    if (!u || !u.id) return null;
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "Player";
    return { id: String(u.id), name: name.slice(0, 20) };
  } catch {
    return null;
  }
}

function createRooms({ send, clients, onFinish }) {
  const rooms = new Map();
  const results = []; // tugagan o'yinlar natijasi (bot olib turadi)

  const other = col => (col === "white" ? "black" : "white");
  const botColorOf = room => (room.vsBot ? (room.white && isBotUid(room.white.uid) ? "white" : (room.black && isBotUid(room.black.uid) ? "black" : null)) : null);
  // vaqt/pozitsiya/rangni kim tanlaydi: oddiy xonada oq, bot xonasida odam (qaysi rangda bo'lmasin)
  const isOwner = (room, col) => !!col && (room.vsBot ? col !== botColorOf(room) : col === "white");

  function colorOf(room, c) {
    if (room.white && room.white.clientId === c.id) return "white";
    if (room.black && room.black.clientId === c.id) return "black";
    return null;
  }

  function isOnline(seat) {
    return !!(seat && clients.get(seat.clientId));
  }
  // 🚪 raqib o'yindan chiqib ketsa: 15 soniyadan keyin qolgan o'yinchi g'alabani olishi mumkin
  const CLAIM_MS = 15000;
  const claimable = room => !!(room && room.white && room.black && !room.finished && !room.vsBot && !room.simul && !/^S/.test(String(room.id || '')) && (room.plies || 0) >= 2);
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (!claimable(room)) continue;
      let ch = false;
      for (const s of [room.white, room.black]) {
        const on = isOnline(s);
        if (!on && !s.offSince) { s.offSince = now; ch = true; }
        else if (on && s.offSince) { s.offSince = 0; ch = true; }
      }
      if (ch) pushState(room);
    }
  }, 1000).unref();

  // Soat: har ikki tomonning birinchi yurishi bepul, undan keyin navbatdagi o'yinchi vaqti ketadi.
  function clockRunning(room) {
    if (room.vsBot && room.tc === "∞") return false;   // bot bilan vaqtsiz o'yin
    if (room.gt) return !!(room.white && room.black && !room.finished && room.turnStartedAt > 0);   // 🏆 guruh kubogi: soat o'yin boshlanishi bilan yuradi (kelmagan vaqtdan yutqazadi)
    return !!(room.white && room.black && !room.finished && room.plies >= 2);
  }

  // 🦍 King Kong har qanday vaqt nazoratida to'liq kuch bilan o'ynaydi: uning soati yurmaydi (faqat odamniki yuradi)
  function kkFrozen(room, col) { return false; }   // King Kong soati endi yuradi
  function currentClock(room) {
    const c = { white: room.clock.white, black: room.clock.black };
    if (clockRunning(room) && !kkFrozen(room, room.turn)) {
      c[room.turn] = Math.max(0, c[room.turn] - (Date.now() - room.turnStartedAt));
    }
    return c;
  }

  function _pi(seat) {
    try {
      if (!seat || !seat.uid) return null;
      if (isBotUid(seat.uid)) return { uid: seat.uid, elo: 0, av: false, bot: true };
      var u = require("./store.js").users()[String(seat.uid)] || {};
      return { uid: String(seat.uid), elo: u.elo || 1000, av: !!require("./store").avOf(u) };
    } catch (e) { return null; }
  }
  // 🎯 Jonli stollar: botning haqiqiy reytingi (_pi botga 0 beradi → avval (1000) chiqardi)
  function _liveElo(seat) {
    try {
      if (seat && seat.uid && isBotUid(seat.uid)) {
        const m = require("./store").db.botElo, e = (m && m[seat.uid] && m[seat.uid].elo) || 0, cap = { bot_kingkong: 2500, bot_terminator: 2400 }[seat.uid];
        return Math.round(cap && e > cap ? cap : e) || 1000;
      }
    } catch (e) {}
    return (_pi(seat) || {}).elo || 1000;
  }
  // 🎯 jonli stol kartasidagi kichik doska: 64 belgi (0 bo'sh, 1 oq, 2 qora, 3 oq damka, 4 qora damka)
  function _bd64(r) { try { const v = require("./vrules.js").stateOf(r); if (!v || !v.b) return ""; let o = ""; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) o += String(v.b[i][j] || 0); return o; } catch (e) { return ""; } }
  function snapshot(room, color) {
    return {
      type: "roomState",
      roomId: room.id,
      color: color || "spectator",
      white: room.white ? room.white.name : null,
      wInfo: _pi(room.white), bInfo: _pi(room.black),
      h2h: h2hOf(room),
      black: room.black ? room.black.name : null,
      whiteOnline: isOnline(room.white), canSit: !!(room.inline && !room.finished && (!!room.white !== !!room.black)), sitColor: room.white ? 'black' : 'white',
      blackOnline: isOnline(room.black),
      stake: room.stake || 0,
      whiteOff: (room.white && room.white.offSince) || 0, blackOff: (room.black && room.black.offSince) || 0, srvNow: Date.now(), claimMs: CLAIM_MS,
      spectators: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).length,
      spectatorNames: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).map(id => room.names.get(id) || "Mehmon").slice(0, 8),
      moves: room.moves,
      turn: room.turn,
      finished: room.finished,
      winner: room.winner,
      reason: room.reason,
      clock: currentClock(room),
      clockRunning: clockRunning(room),
      timeMs: room.timeMs,
      incMs: room.incMs,
      tc: room.tc,
      tcs: room.vsBot ? BOT_TCS : Object.keys(TCS).filter(k => k !== "0.5+0" && k !== "7+5"),
      vsBot: !!room.vsBot, etude: room.etude || null, botUid: (room.vsBot ? ((botColorOf(room) === 'white' ? room.white : room.black) || {}).uid : null) || null, botStarted: !!room.botStarted, botColor: botColorOf(room),
      srvBot: srvBotOn(room), botSecs: botSecsFor(room), botBlunder: room.botCfg ? room.botCfg.blunder : 0,
      arena: !!room.arena, noBerserk: !!room.noBerserk, voice: !!room.voice, voiceSaid: room.voiceSaid || null,
      opening: room.opening,
      berserk: room.berserk,
      drawOffer: room.drawOffer,
      drawInfo: (room.dr && room.dr.st && room.dr.st.info) || null,
      drawText: room.drawText || null,
      canDraw: DRAW.canOfferDraw(room.dr && room.dr.st), drawMoves: (room.dr && room.dr.st && room.dr.st.moves) ? { w: room.dr.st.moves.white, b: room.dr.st.moves.black } : null,
      chat: room.chat, gamesTotal: room.gamesTotal || 1, played: room.played || 0, seriesScore: (room.gamesTotal > 1 ? { white: (room.white && room.pts && room.pts[room.white.uid]) || 0, black: (room.black && room.pts && room.pts[room.black.uid]) || 0 } : null), seriesDone: (room.gamesTotal > 1 && (room.played || 0) >= room.gamesTotal), nextIn: !!room.nextTimer, rematch: room.rematch || null, casual: !!room.casual
    };
  }

  function broadcast(room, data) {
    for (const id of room.members) {
      const cl = clients.get(id);
      if (cl) send(cl.ws, data);
    }
  }

  function pushState(room) {
    try { require('./gcard.js').touch(room); } catch (e) {}
    if (srvBotOn(room)) setImmediate(() => srvBotKick(room));
    for (const id of room.members) {
      const cl = clients.get(id);
      if (cl) send(cl.ws, snapshot(room, colorOf(room, cl)));
    }
  }

  function startNextGame(room, swap, fresh) {
    if (room.nextTimer) { clearTimeout(room.nextTimer); room.nextTimer = null; }
    if (fresh) { room.played = 0; room.pts = {}; }
    if (swap) { const t = room.white; room.white = room.black; room.black = t; }
    if (room.opening) {
      if (fresh || (room.played || 0) % 2 === 0) {
        const o = pickIdf();
        if (o && o.board) room.opening = { id: String(o.id), board: String(o.board), side: o.side === "b" ? "b" : "w" };
      }
    }
    room.moves = [];
    room.finished = false; room.winner = null; room.reason = null; room.plies = 0; room.waitSince = 0;
    room.clock = { white: room.timeMs, black: room.timeMs };
    room.berserk = { white: false, black: false };
    room.drawOffer = null; room.offerPly = { white: -1, black: -1 };
    room.dr = null; room.drawText = null; room.eloD = null; // yangi o'yin: durang sanog'i noldan
    room.turnStartedAt = 0; room.rematch = null; room.lastActive = Date.now();
    room.turn = room.opening && room.opening.side === "b" ? "black" : "white";
    room.first = room.turn;
    pushState(room);
  }

  function afterFinish(room, winner) {
    if (room.nextTimer) { clearTimeout(room.nextTimer); room.nextTimer = null; }
    room.rematch = null;
    if (!(room.gamesTotal > 1) || room.arena || room.locked) return;
    const wu = room.white && room.white.uid, bu = room.black && room.black.uid;
    if (!wu || !bu) return;
    room.pts = room.pts || {};
    room.pts[wu] = room.pts[wu] || 0; room.pts[bu] = room.pts[bu] || 0;
    if (winner === "white") room.pts[wu] += 1;
    else if (winner === "black") room.pts[bu] += 1;
    else { room.pts[wu] += 0.5; room.pts[bu] += 0.5; }
    room.played = (room.played || 0) + 1;
    if (room.played < room.gamesTotal) {
      room.nextTimer = setTimeout(() => {
        room.nextTimer = null;
        if (rooms.get(room.id) !== room || !room.finished || !room.white || !room.black) return;
        startNextGame(room, true, false);
      }, 5000);
    }
    pushState(room);
  }

  
  const BOT_COINS = { bot_easy: 1, bot_mid: 2, bot: 3, bot_pro: 5, bot_gm: 8, bot_champ: 12, bot_monster: 25, bot_terminator: 40, bot_kingkong: 65 };
  const BOT_DAILY = 20, BOT_MIN_PLIES = 8;
  function botReward(room, winner) {
    if (!room.vsBot || !winner || (room.moves || []).length < BOT_MIN_PLIES) return;
    const wu = room.white && room.white.uid, bu = room.black && room.black.uid;
    const botUid = isBotUid(wu) ? wu : isBotUid(bu) ? bu : null;
    const human = isBotUid(wu) ? bu : wu;
    const humanColor = isBotUid(wu) ? 'black' : 'white';
    if (!botUid || !human || winner !== humanColor) return;
    const coins = BOT_COINS[botUid]; if (!coins) return;
    const eco = require('./economy'), u = require('./store').users()[String(human)];
    if (!u) return;
    if (!room.etude) { u.botWins = u.botWins || {}; u.botWins[botUid] = (u.botWins[botUid] || 0) + 1; try { require('./ach.js').sync(human); } catch (e) {} }   // 🏅 yutuqlar uchun
    const day = new Date().toISOString().slice(0, 10);
    if (!u.botDay || u.botDay.day !== day) u.botDay = { day, n: 0 };
    if (u.botDay.n >= BOT_DAILY) return;
    u.botDay.n++;
    eco.add(human, coins, 'bot_win');
    broadcast(room, { type: 'botCoins', roomId: room.id, n: coins });
  }
  // 🤝 o'zaro natija (odam-odam va odam-bot): har bir foydalanuvchida raqib bo'yicha saqlanadi
  function h2hRecord(room, winner) {
    if ((room.moves || []).length < 2 || room.reason === 'noshow') return;
    const wu = room.white && room.white.uid, bu = room.black && room.black.uid; if (!wu || !bu || wu === bu) return;
    const us = require('./store').users();
    [[wu, bu, 'white'], [bu, wu, 'black']].forEach(([me, op, col]) => {
      const u = us[String(me)]; if (!u) return;
      const h = u.h2h || (u.h2h = {}), e = h[String(op)] || (h[String(op)] = { w: 0, d: 0, l: 0, last: '' });
      const r = !winner || winner === 'draw' ? 'd' : winner === col ? 'w' : 'l';
      e[r]++; e.last = (e.last + r).slice(-20); e.at = Date.now();
    });
  }
  function h2hOf(room) {
    try {
      const wu = room.white && room.white.uid, bu = room.black && room.black.uid; if (!wu || !bu) return null;
      const us = require('./store').users(); let e = null, inv = false;
      if (us[String(wu)] && us[String(wu)].h2h) e = us[String(wu)].h2h[String(bu)];
      if (!e && us[String(bu)] && us[String(bu)].h2h) { e = us[String(bu)].h2h[String(wu)]; inv = true; }
      if (!e || !(e.w + e.d + e.l)) return null;
      const W = inv ? e.l : e.w, L = inv ? e.w : e.l;
      return { white: W + e.d / 2, black: L + e.d / 2, n: e.w + e.d + e.l, last: e.last.split('').map(c => c === 'd' ? 'd' : (c === 'w') !== inv ? 'w' : 'b') };
    } catch (e) { return null; }
  }
  function finish(room, winner, reason) {
    console.log('[finish]', room.id, winner, reason, 'yurish:', room.moves && room.moves.length, 'text:', room.drawText);
    if (room.finished) return;
    room.clock = currentClock(room); // soatni to'xtatamiz
    room.finished = true;
    room.drawOffer = null;
    room.winner = winner;
    room.reason = reason || null;
    if (room.etude) { try { require('./etudes.js').done(room, winner); } catch (e) { console.log('etude:', e.message); } }
    else try { botReward(room, winner); } catch (e) { console.log('botReward:', e.message); }
    try { h2hRecord(room, winner); } catch (e) { console.log('h2h:', e.message); }
    try { require('./kkbook.js').result(room, winner); } catch (e) {}   // 🦍 ustaxona statistikasi va mag'lubiyat xabari
    try { // bot yutqazsa — o'sha o'yindan saboq oladi (keyingi safar shu pozitsiyalarda chuqurroq o'ylaydi)
      const bc = botColorOf(room);
      if (room.vsBot && !room.etude && bc && winner && winner !== 'draw' && winner !== bc) require('./kestoai.js').learn(room.id);
    } catch (e) {}
    try { // kunlik vazifalar: o'yin / g'alaba / botni yutish
      if (!room.etude && (room.moves || []).length >= 8 && room.reason !== 'noshow') {
        const q = require('./quests.js'), seats = { white: room.white && room.white.uid, black: room.black && room.black.uid };
        for (const c of ['white', 'black']) {
          const id = seats[c]; if (!id || isBotUid(id)) continue;
          q.bump(id, 'game');
          if (winner === c) { q.bump(id, 'win'); const o = seats[c === 'white' ? 'black' : 'white']; if (isBotUid(o)) { q.bump(id, 'bot'); try { require('./leagues.js').event(id, 'beat_' + o); } catch (e) {} } }
          else if (winner === 'draw') { const o = seats[c === 'white' ? 'black' : 'white']; if (o === 'bot_kingkong') try { require('./leagues.js').event(id, 'draw_bot_kingkong'); } catch (e) {} }
        }
      }
    } catch (e) { console.log('quests:', e.message); }
    if (!room.vsBot) results.push({
      roomId: room.id,
      winner,
      reason: room.reason,
      white: room.white && room.white.uid,
      black: room.black && room.black.uid,
      whiteName: room.white && room.white.name,
      blackName: room.black && room.black.name,
      moves: room.moves.length,
      at: Date.now()
    });
    if (results.length > 500) results.shift();
    try {
      const st = require('./store'), us = st.users();
      if (room.moves.length) {
        const g = {
          id: room.id, at: Date.now(), w: room.white && room.white.name, b: room.black && room.black.name, wu: room.white && String(room.white.uid || ''), bu: room.black && String(room.black.uid || ''), we: _liveElo(room.white), be: _liveElo(room.black),
          win: winner || null, why: room.reason || '', tc: room.tc,
          m: room.moves.map(m => [m.from.r, m.from.c, m.to.r, m.to.c, (m.captures || []).map(x => [x.r, x.c])])
        };
        const ids = new Set([room.white && room.white.uid, room.black && room.black.uid].filter(Boolean).map(String));
        for (const uid of ids) {
          const u = us[uid]; if (!u) continue;
          u.arch = u.arch || []; u.arch.unshift(g); if (u.arch.length > 30) u.arch.length = 30;
        }
        st.save();
      }
    } catch (e) { console.log('Arxiv xatosi:', e.message); }
    broadcast(room, { type: "roomFinished", roomId: room.id, winner, reason: room.reason, clock: room.clock, text: room.drawText || undefined }); try { require('./gcard.js').touch(room); } catch (e) {} try { require('./grp.js').roomFinished(room); } catch (e) {} try { afterFinish(room, winner); } catch (e) { console.error("[afterFinish]", e); }
    if (typeof onFinish === "function") {
      try { onFinish(room); } catch (e) { console.error("[onFinish]", e); }
      setTimeout(function () { try { if (room.eloD) broadcast(room, { type: "roomElo", roomId: room.id, eloD: room.eloD, wu: room.white && room.white.uid, bu: room.black && room.black.uid }); } catch (e) {} }, 400);
    }
  }

  let _idf = null;
  function pickIdf() {
    try {
      if (!_idf) {
        const src = require("fs").readFileSync(require("path").join(__dirname, "idf780.js"), "utf8");
        try { _idf = new Function(src + "\n;return IDF780;")(); }
        catch (e) { _idf = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1)); }
      }
    } catch (e) { console.error("[idf780]", e.message); _idf = []; }
    return _idf.length ? _idf[Math.floor(Math.random() * _idf.length)] : null;
  }

  function newRoom(roomId, tcKey) {
    const t = tcParse(tcKey) || TCS[DEFAULT_TC];
    const key = tcParse(tcKey) ? tcKey : DEFAULT_TC;
    return {
      id: roomId,
      white: null,
      black: null,
      members: new Set(),
      moves: [],
      turn: "white",
      finished: false,
      winner: null,
      reason: null,
      plies: 0,
      tc: key,
      timeMs: t[0] * 1000,
      incMs: t[1] * 1000,
      clock: { white: t[0] * 1000, black: t[0] * 1000 },
      arena: false,
      berserk: { white: false, black: false },
      opening: null,
      first: "white",
      drawOffer: null,
      offerPly: { white: -1, black: -1 },
      chat: [],
      names: new Map(),
      turnStartedAt: 0,
      lastActive: Date.now()
    };
  }

  // Zal/turnir uchun: xonani oldindan ochib, o'yinchilarni uid bo'yicha o'rindiqqa qo'yadi
  function create(roomId, opts) {
    if (!ROOM_RE.test(String(roomId))) return null;
    let room = rooms.get(roomId);
    if (room) return room;
    room = newRoom(roomId, opts && opts.tc);
    room.arena = !!(opts && opts.arena);
    room.noBerserk = !!(opts && opts.noBerserk);
    room.locked = !!(opts && opts.locked);
    room.vsBot = !!(opts && opts.vsBot);
    room.voice = !!(opts && opts.voice);   // 🎤 ovozli bellashuv: noto'g'ri yurish aytgan yutqazadi
    room.botCfg = (opts && opts.botCfg) || null;
    room.etude = (opts && opts.etude) || null;   // ♔ etyud: { id, goal: 'win'|'draw', title } — King Kongga qarshi yechish
    room.botStarted = !!room.vsBot;   // bot bilan o'yin birdan boshlanadi
    if (srvBotOn(room)) setTimeout(() => srvBotKick(room), 1500);   // 🦍 King Kong oq bo'lsa — birinchi yurish
    if (room.vsBot && (opts.tc === "∞" || !tcParse(opts.tc))) { room.tc = "∞"; room.timeMs = BOT_INF_MS; room.incMs = 0; room.clock = { white: BOT_INF_MS, black: BOT_INF_MS }; }
    if (opts && opts.bonus && opts.bonus.ms > 0) {
      const bc = opts.bonus.color === "black" ? "black" : "white";
      room.clock[bc] += Number(opts.bonus.ms);
    }
    if (opts && opts.opening && opts.opening.board) {
      room.opening = { id: String(opts.opening.id), board: String(opts.opening.board), side: opts.opening.side === "b" ? "b" : "w" };
      room.turn = room.opening.side === "b" ? "black" : "white";
      room.first = room.turn;
    }
    if (opts && opts.white) room.white = { uid: String(opts.white.uid), name: opts.white.name, clientId: opts.white.clientId || null };
    if (opts && opts.black) room.black = { uid: String(opts.black.uid), name: opts.black.name, clientId: opts.black.clientId || null };
    rooms.set(roomId, room);
    return room;
  }

  function forfeit(roomId, winner, reason) {
    const room = rooms.get(roomId);
    if (!room || room.finished) return false;
    finish(room, winner, reason || "forfeit");
    return true;
  }

  function err(c, message) {
    if (c && c.ws) send(c.ws, { type: "error", message });
  }

  // 🦍 King Kong (vaqtli o'yin): yurishni server o'zi hisoblab, darhol qo'yadi — telefon orqali borib-kelish yo'q.
  // Yagona yurish yoki urish zanjiri — o'ylamasdan (avtohod). Server javob bermasa, odamning ilovasi zaxira sifatida yuradi.
  const SBC = { id: "srvbot", ws: null };
  function botSecsFor(room) {
  const cfg = room && room.botCfg, d = cfg ? cfg.secs : 1.2;
  try {
    if (!cfg || !room.tc || room.tc === '∞' || !(room.timeMs > 0)) return d;
    const bc = botColorOf(room); if (!bc) return d;
    const rem = Math.max(0, currentClock(room)[bc] / 1000), inc = (room.incMs || 0) / 1000, base = room.timeMs / 1000;
    let s = Math.max(rem < 4 ? 0.05 : 0.1, Math.min(d, rem / 60 + inc * 0.6, rem / 12));
    if (base <= 30 || rem < 3) s = Math.min(d, 0.05);
    return s;
  } catch (e) { return d; }
}
const srvBotOn = room => !!(room && room.vsBot && room.botCfg && room.botCfg.id === "bot_kingkong" && room.tc && room.tc !== "∞");
  function kkSteps(b, m) {   // kkrules yurishi → xona qadamlari (har sakrashda urilgan dona)
    const pts = [m.from].concat(m.path && m.path.length ? m.path : [m.to]), out = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], z = pts[i], ar = a >> 3, ac = a & 7, zr = z >> 3, zc = z & 7, dr = Math.sign(zr - ar), dc = Math.sign(zc - ac);
      let cap = [];
      if (m.caps && m.caps.length) for (let r = ar + dr, c = ac + dc; r !== zr; r += dr, c += dc) if (b[r * 8 + c] && !out.some(s => s.captures.some(x => x.r === r && x.c === c))) { cap = [{ r, c }]; break; }
      out.push({ from: { r: ar, c: ac }, to: { r: zr, c: zc }, captures: cap });
    }
    return out;
  }
  function srvBotKick(room) {
    try {
      if (!srvBotOn(room) || !room.botStarted || room.finished || !room.white || !room.black || room._sbBusy) return;
      const bc = botColorOf(room); if (!bc || room.turn !== bc) return;
      const vs = require("./vrules.js").stateOf(room); if (!vs || vs.turn !== bc || vs.forced) return;
      const b = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = vs.b[r][c]; b.push(p === 1 ? 1 : p === 2 ? -1 : p === 3 ? 2 : p === 4 ? -2 : 0); }
      const side = bc === "white" ? 1 : -1, L = require("./kkrules.js").moves(b, side);
      if (!L.length) return;
      const n0 = room.moves.length, g0 = room.moves; room._sbBusy = 1;
      let done = false;
      const play = (m, why) => {
        if (done) return; done = true; clearTimeout(tm); room._sbBusy = 0;
        if (room.finished || room.moves !== g0 || room.moves.length !== n0 || room.turn !== bc) return;
        const st = kkSteps(b, m);
        for (let i = 0; i < st.length && !room.finished; i++) applyMove(SBC, room, room.id, bc, { move: st[i], keepTurn: i < st.length - 1 });
      };
      let tm = null;
      if (L.length === 1) return setImmediate(() => play(L[0], "only"));
      const rem = Math.max(0, currentClock(room)[bc] / 1000), inc = (room.incMs || 0) / 1000, base = (room.timeMs || 0) / 1000;
      let secs = Math.max(rem < 4 ? 0.05 : 0.1, Math.min(room.botCfg.secs || 4, rem / 60 + inc * 0.6, rem / 12));
      if (base <= 30 || rem < 3) secs = 0.05;   // juda qisqa o'yin: tayyor bilim (kitob, Colette, xotira, baza) yoki eng qisqa hisob
      const fb = () => play(L[Math.floor(Math.random() * L.length)], "fallback");
      tm = setTimeout(fb, Math.max(600, Math.min(secs * 1000 + 2500, rem * 1000 * 0.3)));
      const ask = (k) => require("./kestoai.js").move({ board: b, side, time: secs, maxTime: secs, kk: true, book: true, tbAlways: true, room: room.id, rem: Math.max(0.1, rem) }, r => {
        if (done) return;
        if (r && typeof r.from === "number") return play(L.find(x => x.from === r.from && x.to === r.to) || L[0], "engine");
        if (r && (r.code === 429 || r.code === 503) && k < 6) return setTimeout(() => ask(k + 1), 120);
        fb();
      });
      ask(0);
    } catch (e) { room._sbBusy = 0; console.log("[srvbot]", e.message); }
  }

  // ---- Durang qoidalari: server doskani yuritib boradi ----
  // Hamma o'yin turi (do'stona, reytingli, turnir, arena, bot) shu yerdan o'tadi.
  function drawStartBoard(room) {
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    const o = room.opening && room.opening.board;
    if (o) {
      let k = 0;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 !== 1) continue;
        const ch = o.charAt(k++);
        b[r][c] = (ch === "w" || ch === "b" || ch === "W" || ch === "B") ? ch : null;
      }
      return b;
    }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = "b";
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = "w";
    return b;
  }

  // Har bir qadam (zanjirli urishning har bir bosqichi ham) shu yerga keladi.
  // To'liq yurish tugagandagina qoidalar tekshiriladi va natija qaytariladi.
  function drawTrack(room, col, m) {
    try {
      const mv = m.move;
      if (!mv || !mv.from || !mv.to) return null;
      let dr = room.dr;
      if (!dr) {
        if (room.moves.length > 1) return null; // kuzatuv boshlanmagan (o'yin o'rtasida server yangilangan)
        const b0 = drawStartBoard(room);
        dr = room.dr = { b: b0, pre: null, from: null, cap: false, st: DRAW.createDrawState(b0, room.first || "white") };
      }
      if (!dr.pre) { dr.pre = dr.b; dr.from = [mv.from.r, mv.from.c]; dr.cap = false; }
      const nb = dr.b.map(r => r.slice());
      let p = nb[mv.from.r][mv.from.c];
      nb[mv.from.r][mv.from.c] = null;
      for (const x of mv.captures || []) nb[x.r][x.c] = null;
      if (p === "w" && mv.to.r === 0) p = "W";
      if (p === "b" && mv.to.r === 7) p = "B";
      nb[mv.to.r][mv.to.c] = p;
      dr.b = nb;
      if ((mv.captures || []).length) dr.cap = true;
      if (m.keepTurn) return null; // zanjir davom etyapti
      const res = DRAW.updateDraw(dr.st, dr.pre, { from: dr.from, to: [mv.to.r, mv.to.c], captures: dr.cap ? [1] : [] }, col, dr.b);
      dr.pre = null;
      return res;
    } catch (e) {
      console.error("[draw]", e && e.message);
      return null;
    }
  }

  // yurishni qo'llash (odam yoki bot nomidan)
  function applyMove(c, room, roomId, col, m) {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished) return err(c, "O‘yin tugagan"), true;
      if (!room.white || !room.black) return err(c, "Raqib hali qo‘shilmagan"), true;
      if (col !== room.turn) return err(c, "Hozir navbat sizniki emas"), true;
      if (room.moves.length >= MAX_MOVES) return err(c, "Yurishlar limiti"), true;
      // 🛡 qadam qoida bo'yicha tekshiriladi (qoidaga zid yoki takroriy qadam — rad etiladi, ilova doskani serverdan qayta oladi)
      const _vr = require("./vrules.js").check(room, col, m);
      if (_vr.error) { if (c && c.ws) send(c.ws, { type: "error", message: _vr.error, resync: 1 }); return true; }
      if (_vr.ok) m.keepTurn = _vr.keep;
      const now = Date.now();
      const wasRunning = clockRunning(room);
      if (wasRunning) {
        if (!kkFrozen(room, col)) room.clock[col] -= now - room.turnStartedAt;
        if (room.clock[col] <= 0) {
          room.clock[col] = 0;
          finish(room, other(col), "timeout");
          return true;
        }
      }
      if (wasRunning && !m.keepTurn && !room.berserk[col] && !kkFrozen(room, col)) room.clock[col] += room.incMs; // inkrement (berserkda yo'q)
      room.moves.push(m.move);
      require("./vrules.js").commit(room, _vr);
      if (room.drawOffer) {
        room.drawOffer = null; // yurish bilan taklif rad etiladi
        broadcast(room, { type: "roomDraw", roomId, offer: null });
      }
      if (!m.keepTurn) {
        room.turn = other(room.turn); // ketma-ket olishda keepTurn:true yuboring
        room.plies++; room.waitSince = Date.now();
      }
      room.turnStartedAt = now;
      const dres = drawTrack(room, col, m);
      // 🦍 King Kong: o'z yurishidan keyin raqib o'ylayotganda ham o'ylaydi (ponder)
      if (!m.keepTurn && room.vsBot && room.botCfg && room.botCfg.ponder && room.timeMs > 0 && room.timeMs <= 60000 && !(room.incMs > 0) && col === botColorOf(room) && room.dr && room.dr.b && !room.finished) {
        try { const b64 = []; for (let r = 0; r < 8; r++) for (let c2 = 0; c2 < 8; c2++) { const p = room.dr.b[r][c2]; b64.push(p === 'w' ? 1 : p === 'W' ? 2 : p === 'b' ? -1 : p === 'B' ? -2 : 0); } require('./kestoai.js').ponder(b64, col === 'white' ? -1 : 1, room.botCfg.secs, room.id); } catch (e) { console.log('[ponder]', e.message); }
      }
      broadcast(room, {
        type: "roomMove", roomId, move: m.move, turn: room.turn, color: col,
        clock: currentClock(room), clockRunning: clockRunning(room),
        drawInfo: dres ? (dres.info || null) : undefined,
        canDraw: DRAW.canOfferDraw(room.dr && room.dr.st)
      });
      if (dres && dres.draw) {
        room.drawText = dres.reason;
        finish(room, "draw", "rule");
      }
      if (!m.keepTurn) { try { require('./gcard.js').touch(room); } catch (e) {} }
      if (!m.keepTurn && room.etude && !room.finished) { try { const v = require('./etudes.js').check(room); if (v) finish(room, v.winner, v.reason); } catch (e) { console.log('etude check:', e.message); } }
      if (!m.keepTurn && !room.finished && srvBotOn(room)) setImmediate(() => srvBotKick(room));
      return true;
  }

  function handle(c, m) {
    if (!m || typeof m.type !== "string" || !m.type.startsWith("room")) return false;
    if (m.type === "roomLive") {
      const list = [];
      for (const r of rooms.values()) {
        if (!r.white || !r.black || r.finished) continue;
        if (![...r.members].some(id => { const cl = clients.get(id); return cl && colorOf(r, cl); })) continue;
        list.push({
          id: r.id, vsBot: !!r.vsBot, white: r.white.name, black: r.black.name, tc: r.tc, wElo: _liveElo(r.white), bElo: _liveElo(r.black),
          moves: (r.moves || []).length, bd: _bd64(r),
          spectators: [...r.members].filter(id => !colorOf(r, clients.get(id) || {})).length
        });
      }
      list.sort((a, b) => b.spectators - a.spectators || b.moves - a.moves);
      send(c.ws, { type: "roomLive", list: list.slice(0, 30) });
      return true;
    }
    if (m.type === "roomPeek") { /*TVPEEK*/
      const ids = Array.isArray(m.ids) ? m.ids.slice(0, 40) : [];
      const games = [];
      for (const id of ids) {
        const r = rooms.get(String(id));
        if (!r) { try { const bb = require('./arenabb.js').live(String(id)); if (bb) games.push({ id: bb.roomId, moves: bb.moves, turn: bb.turn, finished: !!bb.over, winner: bb.winner || null, clock: bb.clock, running: !bb.over, bb: 1 }); } catch (e) {} continue; }   // 🤖 arenadagi bot va bot o'yini
        games.push({
          id: r.id, moves: r.moves || [], turn: r.turn, finished: !!r.finished, winner: r.winner || null,
          clock: currentClock(r), running: clockRunning(r),
          opening: r.opening && r.opening.board ? { board: r.opening.board } : null,
          wElo: (_pi(r.white) || {}).elo || 0, bElo: (_pi(r.black) || {}).elo || 0,
          spectators: [...r.members].filter(x => !colorOf(r, clients.get(x) || {})).length
        });
      }
      send(c.ws, { type: "roomPeek", games });
      return true;
    }

    const roomId = String(m.roomId || "");
    if (!ROOM_RE.test(roomId)) {
      err(c, "Xona raqami noto‘g‘ri");
      return true;
    }

    if (m.type === "roomJoin") {
      let user;
      if (m.initData) {
        user = verifyInitData(String(m.initData));
        if (!user) {
          err(c, "Telegram tasdiqlash xatosi");
          return true;
        }
      } else if (process.env.REQUIRE_TG === "1") {
        err(c, "Faqat Telegram ichidan kirish mumkin");
        return true;
      } else {
        const nm = String(m.name || "Mehmon").trim().slice(0, 20) || "Mehmon";
        // Telegramsiz: brauzer oynasi o'z guestId'si bilan taniladi, qayta ulansa joyi saqlanadi
        const gid = /^[A-Za-z0-9]{8,32}$/.test(String(m.guestId || "")) ? "g_" + m.guestId : c.id;
        user = { id: gid, name: nm };
      }

      let room = rooms.get(roomId);
      if (!room) {
        room = newRoom(roomId, DEFAULT_TC); room.casual = true; if (!rRestored) room._tmp = true; /*RTMP*/
        rooms.set(roomId, room);
      }

      c.hidden = true; // lobbidagi o'yinchilar ro'yxatida ko'rinmasin
      c.roomIds = c.roomIds || new Set();
      c.roomIds.add(roomId);
      room.members.add(c.id);
      room.names.set(c.id, user.name);
      room.lastActive = Date.now();

      const seat = { uid: user.id, name: user.name, clientId: c.id };
      c.roomUser = { id: user.id, name: user.name };
      const _pb = !room.vsBot && require("./mod.js").playText(user.id);   // ⛔ o'yin taqiqi — faqat tomoshabin
      if (room.white && room.white.uid === user.id) room.white = seat;
      else if (room.black && room.black.uid === user.id) room.black = seat;
      else if (_pb) { if (!room.finished && !(room.white && room.black)) err(c, _pb); }
      else if (room.inline) {
        const own = room.white || room.black;
        if (own && !(room.white && room.black) && !room.finished && own.uid !== user.id) {
          if (room.white) room.black = seat; else room.white = seat;
        }
      }   // guruhdagi doska: chaqiruvchi o'z joyida, qolganlar "Qo'shilish" tugmasini bosguncha tomoshabin
      else if (!room.white) room.white = seat;
      else if (!room.black) room.black = seat;

      pushState(room);
      return true;
    }

    const room = rooms.get(roomId);
    if (!room) {
      err(c, "Xona topilmadi");
      return true;
    }
    room.lastActive = Date.now();
    const col = colorOf(room, c);

    if (m.type === "roomSit") {   // guruh doskasi: tomoshabin raqib bo'lib o'tiradi
      const u = c.roomUser;
      if (!room.inline || room.finished || !u || (!!room.white === !!room.black)) return true;
      const own = room.white || room.black; if (own.uid === u.id) return true;
      { const _pb = require("./mod.js").playText(u.id); if (_pb) return err(c, _pb), true; }
      const s = { uid: u.id, name: u.name, clientId: c.id };
      if (room.white) room.black = s; else room.white = s;
      pushState(room);
      return true;
    }
    if (m.type === "roomMove") {
      if (room.vsBot && !room.botStarted) return err(c, "Avval ‘Boshlash’ tugmasini bosing"), true;
      { const _b = room.moves.length; const _r = applyMove(c, room, roomId, col, m); if (col && room.moves.length > _b) { room.mvCount = room.mvCount || {}; room.mvCount[col] = (room.mvCount[col] || 0) + 1; } return _r; }
    }

    if (m.type === "roomBotMove") {
      if (!room.vsBot || !col || !room.botStarted) return true;
      const bc = botColorOf(room);
      if (!bc || col === bc) return true;   // faqat odam bot nomidan yubora oladi
      if (m.src) try { require("./memguard.js").botSrc(m.src, room.botCfg && room.botCfg.id); } catch (e) {}
      return applyMove(c, room, roomId, bc, m);
    }

    if (m.type === "roomBotStart") {
      if (!room.vsBot || room.botStarted || room.finished || !isOwner(room, col)) return true;
      room.botStarted = true;
      room.lastActive = Date.now();
      pushState(room);
      return true;
    }

    if (m.type === "roomSetColor") {
      if (!room.vsBot) return true;
      if (!isOwner(room, col)) return err(c, "Rangni faqat o‘yinchi tanlaydi"), true;
      if (room.botStarted || room.moves.length > 0 || room.finished) return err(c, "O‘yin boshlangan, rangni o‘zgartirib bo‘lmaydi"), true;
      const want = m.color === "white" || m.color === "black" ? m.color : (Math.random() < 0.5 ? "white" : "black");
      if (want !== col) { const t = room.white; room.white = room.black; room.black = t; }
      pushState(room);
      return true;
    }

    if (m.type === "roomAbort") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished) return true;
      if (room.mvCount && room.mvCount[col]) return err(c, "Birinchi yurishdan keyin chiqib bo‘lmaydi"), true;
      finish(room, "draw", "abort");   // rc-menu-v1
      return true;
    }

    if (m.type === "roomVoiceFail") {   // ovozli bellashuvda noto'g'ri yurish aytildi — o'sha o'yinchi yutqazadi
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (!room.voice || room.finished || !room.white || !room.black) return true;
      room.voiceSaid = String(m.said || "").slice(0, 60);
      finish(room, other(col), "voice");
      return true;
    }
    if (m.type === "roomFinish" || m.type === "roomResign") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      let winner = m.type === "roomFinish" ? m.winner : null;
      if (winner !== "white" && winner !== "black" && winner !== "draw") winner = other(col);
      finish(room, winner, m.type === "roomResign" ? "resign" : "finish");
      return true;
    }

    if (m.type === "roomBerserk") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (!room.arena) return err(c, "Berserk faqat Arena o‘yinlarida"), true;
      if (room.noBerserk) return err(c, "Bu turnirda berserk o‘chirilgan"), true;
      if (room.finished || !room.white || !room.black) return true;
      if (room.berserk[col]) return true;
      const before = room.plies <= (col === room.first ? 0 : 1);
      if (!before) return err(c, "Berserk faqat birinchi yurishdan oldin mumkin"), true;
      room.berserk[col] = true;
      room.clock[col] = Math.floor(room.timeMs / 2);
      broadcast(room, { type: "roomBerserk", roomId, color: col, clock: currentClock(room) });
      return true;
    }

    if (m.type === "roomSetTime") {
      if (room.arena || room.locked) return err(c, "Bu o‘yinda vaqtni o‘zgartirib bo‘lmaydi"), true;
      if (!isOwner(room, col)) return err(c, "Vaqtni faqat xona egasi tanlaydi"), true;
      if (room.moves.length > 0 || room.finished || room.botStarted) return err(c, "O‘yin boshlangan, vaqtni o‘zgartirib bo‘lmaydi"), true;
      const t = room.vsBot && m.tc === "∞" ? [BOT_INF_MS / 1000, 0] : tcParse(m.tc);
      if (!t) return err(c, "Noma’lum vaqt rejimi"), true;
      room.tc = m.tc;
      room.timeMs = t[0] * 1000;
      room.incMs = t[1] * 1000;
      room.clock = { white: room.timeMs, black: room.timeMs };
      pushState(room);
      return true;
    }

    if (m.type === "roomSetPos") {
      if (room.arena || room.locked) return err(c, "Bu o‘yinda pozitsiyani o‘zgartirib bo‘lmaydi"), true;
      if (!isOwner(room, col)) return err(c, "Pozitsiyani faqat xona egasi tanlaydi"), true;
      if (room.moves.length > 0 || room.finished || room.botStarted) return err(c, "O‘yin boshlangan, pozitsiyani o‘zgartirib bo‘lmaydi"), true;
      if (m.pos === "idf") {
        const o = pickIdf();
        if (!o || !o.board) return err(c, "IDF pozitsiyalari topilmadi"), true;
        room.opening = { id: String(o.id), board: String(o.board), side: o.side === "b" ? "b" : "w" };
      } else {
        room.opening = null;
      }
      room.turn = room.opening && room.opening.side === "b" ? "black" : "white";
      room.first = room.turn;
      pushState(room);
      return true;
    }

    if (m.type === "roomSetGames") {
      if (!room.casual || room.arena || room.locked) return err(c, "Bu o‘yinda o‘yinlar sonini o‘zgartirib bo‘lmaydi"), true;
      if (col !== "white") return err(c, "O‘yinlar sonini faqat xona egasi (oq) tanlaydi"), true;
      if (room.moves.length > 0 || room.finished || (room.played || 0) > 0) return err(c, "O‘yin boshlangan, o‘zgartirib bo‘lmaydi"), true;
      const n = Number(m.games);
      if (![1, 2, 4].includes(n)) return err(c, "Noto‘g‘ri son"), true;
      room.gamesTotal = n; room.played = 0; room.pts = {};
      pushState(room);
      return true;
    }

    if (m.type === "roomRematch") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if ((!room.casual && !room.vsBot) || room.arena || room.locked || !room.finished || room.nextTimer) return true;
      if ((room.gamesTotal || 1) > 1 && (room.played || 0) < room.gamesTotal) return true;
      if (!room.white || !room.black) return err(c, "Raqib yo‘q"), true;
      if (room.vsBot) { startNextGame(room, true, true); return true; }   // bot darhol rozi, ranglar almashadi
      if (room.rematch && room.rematch !== col) { startNextGame(room, true, true); return true; }
      room.rematch = col;
      pushState(room);
      return true;
    }

    if (m.type === "roomRematchNo") {
      if (!col) return true;
      room.rematch = null;
      pushState(room);
      return true;
    }

    if (m.type === "roomDrawOffer") {
      if (!col) return err(c, "Siz tomoshabinsiz"), true;
      if (room.finished || !room.white || !room.black) return true;
      if (room.moves.length < 2) return err(c, "Avval kamida bittadan yurish qiling"), true;
      if (!DRAW.canOfferDraw(room.dr && room.dr.st)) return err(c, "Durang taklif qilish uchun har tomondan kamida 10 yurish bo‘lishi kerak (qoida 9.2)"), true;
      if (room.drawOffer) return true;
      if (room.offerPly[col] >= room.plies) return err(c, "Durang taklifini keyingi yurishdan so‘ng qayta yuboring"), true;
      room.drawOffer = col;
      room.offerPly[col] = room.plies;
      broadcast(room, { type: "roomDraw", roomId, offer: col });
      if (room.vsBot) {
        setTimeout(() => {
          if (room.drawOffer === col && !room.finished) {
            room.drawOffer = null;
            const bc = botColorOf(room);
            let ok = false;
            try { ok = !!(bc && room.dr && DRAW.botAcceptsDraw(room.dr.b, bc, room.dr.st)); } catch (e) { console.error("[botDraw]", e && e.message); }
                        if (ok && room.arena) { let nw = 0, nb = 0; for (const r of room.dr.b) for (const p of r) { if (p === "w" || p === "W") nw++; else if (p === "b" || p === "B") nb++; } if (nw > 3 || nb > 3) ok = false; }
            if (ok) finish(room, "draw", "agreed");
            else broadcast(room, { type: "roomDraw", roomId, offer: null, declined: true });
          }
        }, 1500);
      }
      return true;
    }

    if (m.type === "roomDrawAccept") {
      if (!col || room.finished) return true;
      if (!room.drawOffer || room.drawOffer === col) return true;
      room.drawOffer = null;
      finish(room, "draw", "agreed");
      return true;
    }

    if (m.type === "roomClaimWin") {   // 🏆 raqib chiqib ketdi — g'alabani olish
      if (!col || !claimable(room)) return true;
      const opp = room[other(col)];
      if (!opp || isOnline(opp) || !opp.offSince || Date.now() - opp.offSince < CLAIM_MS) return err(c, "Raqib hali qaytishi mumkin — biroz kuting"), true;
      finish(room, col, "abandon");
      return true;
    }

    if (m.type === "roomDrawDecline") {
      if (!col || !room.drawOffer || room.drawOffer === col) return true;
      room.drawOffer = null;
      broadcast(room, { type: "roomDraw", roomId, offer: null, declined: true });
      return true;
    }

    if (m.type === "roomChat") {
      if (!room.members.has(c.id)) return true;
      const text = String(m.text || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, CHAT_MAX);
      if (!text) return true;
      const now = Date.now();
      if (c.lastChat && now - c.lastChat < 700) return err(c, "Juda tez yozyapsiz"), true;
      const _M = require("./mod.js"), _cu = c.roomUser && c.roomUser.id;
      if (_cu && _M.isMuted(_cu)) return err(c, "🔇 " + _M.muteText(_cu)), true;
      c.lastChat = now;
      const msg = { uid: _cu || "", prem: !!(_cu && require("./store").isPremium(require("./store").users()[String(_cu)] || {})) || undefined, name: room.names.get(c.id) || "Mehmon", color: col || "spectator", text: _M.censor(text), at: now };
      room.chat.push(msg);
      if (room.chat.length > CHAT_KEEP) room.chat.shift();
      broadcast(room, { type: "roomChat", roomId, msg });
      return true;
    }

    if (m.type === "roomSync") {
      send(c.ws, snapshot(room, col));
      return true;
    }

    return false;
  }

  function onClose(c) {
    if (!c.roomIds) return;
    for (const rid of c.roomIds) {
      const room = rooms.get(rid);
      if (!room) continue;
      room.members.delete(c.id);
      // o'yinchi uzilsa, joyi saqlanadi (qayta kirsa davom etadi)
      setTimeout(() => {
        if (rooms.get(rid)) pushState(room);
      }, 0);
    }
  }

  // Vaqti tugaganini tekshirish
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      // Seriyaning 2+ o'yinida birinchi yurish uchun 30 soniya
      if (room.white && room.black && !room.finished && room.plies < 2 && room.gamesTotal > 1 && (room.played || 0) > 0 && !room.arena) {
        const k = room.played + ":" + room.plies + ":" + room.turn;
        if (room._fmKey !== k) { room._fmKey = k; room._fmSince = now; }
        else if (now - room._fmSince >= 30000) { finish(room, other(room.turn), "timeout"); continue; }
      }
      if (!clockRunning(room)) continue;
      if (!kkFrozen(room, room.turn) && room.clock[room.turn] - (now - room.turnStartedAt) <= 0) {
        finish(room, other(room.turn), "timeout");
      }
    }
  }, 500).unref();

  setInterval(() => {
    const now = Date.now();
    for (const [rid, room] of rooms) {
      if (!global.__spFM) global.__spFM = setInterval(() => { const t0 = Date.now(); for (const rm of rooms.values()) { try {
        if (rm.gt) continue;   // 🏆 guruh kubogi — bu qoida yo'q, soat o'zi hal qiladi
        if (rm.finished || rm.vsBot || rm.simul || /^S/.test(String(rm.id || "")) || !rm.white || !rm.black || rm.plies >= 2) { if (rm.finished || rm.plies >= 2) rm.waitSince = 0; continue; }
        // 15 soniya har bir birinchi yurish uchun alohida, va faqat navbatdagi o'yinchi xonaga kirgandan keyin sanaladi
        if (rm._fmP !== rm.plies) { rm._fmP = rm.plies; rm.waitSince = 0; }
        if (!rm._crAt) rm._crAt = t0;
        if (!rm.waitSince) { if (isOnline(rm[rm.turn]) || t0 - rm._crAt > 60000) rm.waitSince = t0; continue; }
        if (t0 - rm.waitSince >= 15000) { rm.waitSince = 0; finish(rm, rm.turn === "white" ? "black" : "white", "noshow"); }
      } catch (e) {} } }, 1000);
      if (now - room.lastActive > IDLE_MS) rooms.delete(rid);
    }
  }, 10 * 60 * 1000).unref();

  // ---------- /*RSAVE*/ partiyalarni saqlash / tiklash ----------
  const _rrep = (k, v) => v instanceof Map ? { __map: [...v] } : v instanceof Set ? { __set: [...v] } : v;
  const _rrev = (k, v) => v && v.__map ? new Map(v.__map) : v && v.__set ? new Set(v.__set) : v;
  var rRestored = false, rReady = false, rSig = '';
  function rSnap() {
    const arr = [];
    for (const r of rooms.values()) {
      if (r.finished || !r.white || !r.black || r.vsBot || r._tmp) continue;
      const o = Object.assign({}, r);
      o.members = []; o.names = []; delete o.nextTimer;
      o.white = Object.assign({}, r.white, { clientId: null });
      o.black = Object.assign({}, r.black, { clientId: null });
      o.clock = currentClock(r);
      arr.push(o);
    }
    return arr;
  }
  function saveRooms(force) {
    if (!rReady) return;
    try {
      const arr = rSnap();
      const sig = JSON.stringify(arr.map(o => [o.id, o.moves.length, o.turn, o.berserk, o.drawOffer]));
      if (!force && sig === rSig) return;
      rSig = sig;
      const st = require('./store'), s = JSON.stringify(arr, _rrep);
      if (st.db.rSave !== s) { st.db.rSave = s; st.save(); }
    } catch (e) { console.log('[xona] saqlash xato:', e.message); }
  }
  function restore() {
    if (rRestored) return true;
    try {
      const st = require('./store');
      if (!st.db) return false;
      if (typeof st.db.rSave === 'string') {
        const arr = JSON.parse(st.db.rSave, _rrev), now = Date.now();
        let n = 0;
        for (const o of arr) {
          const ex = rooms.get(o.id);
          if (ex && !ex._tmp) continue;
          o.members = new Set(); o.names = new Map();
          o.turnStartedAt = now; o.lastActive = now; o.nextTimer = null; o.drawOffer = null;
          if (ex) {
            o.members = ex.members; o.names = ex.names;
            for (const k of ['white', 'black']) for (const s2 of [ex.white, ex.black]) if (s2 && o[k] && String(s2.uid) === String(o[k].uid)) o[k].clientId = s2.clientId;
          }
          rooms.set(o.id, o); n++;
          if (ex) pushState(o);
        }
        console.log('[xona] tiklandi:', n);
        rRestored = true; rReady = true; return true;
      }
      if (st.db.users && Object.keys(st.db.users).length) { rRestored = true; rReady = true; return true; }
    } catch (e) { console.log('[xona] tiklash xato:', e.message); }
    return false;
  }
  (function tr(n) { if (restore() || n > 30) { rRestored = true; rReady = true; return; } setTimeout(() => tr(n + 1), 1500); })(0);
  setInterval(() => saveRooms(false), 3000).unref();
  process.once('SIGTERM', () => {
    console.log('[xona] SIGTERM: partiyalar saqlanmoqda');
    saveRooms(true);
    setTimeout(() => process.exit(0), 3000);
  });

  // 🏆 guruh kubogi uchun: soatni ishga tushirish va durangdan keyin shu stolda tay-brek (ranglar almashadi, vaqt qisqaradi)
  function startClock(roomId) { const room = rooms.get(roomId); if (!room || room.finished) return false; room.turnStartedAt = Date.now(); pushState(room); return true; }
  function notice(roomId, text) { const room = rooms.get(roomId); if (!room) return; const msg = { name: "🏆 Kubok", color: "spectator", text: String(text).slice(0, CHAT_MAX), at: Date.now() }; room.chat.push(msg); if (room.chat.length > CHAT_KEEP) room.chat.shift(); broadcast(room, { type: "roomChat", roomId, msg }); }
  function tieBreak(roomId, tcKey, delayMs) {
    const room = rooms.get(roomId), t = tcParse(tcKey); if (!room || !t) return false;
    room.tc = tcKey; room.timeMs = t[0] * 1000; room.incMs = t[1] * 1000;
    startNextGame(room, true, false);
    room.turnStartedAt = 0;
    const g = room.moves;
    setTimeout(() => { if (rooms.get(roomId) === room && !room.finished && room.moves === g && !room.turnStartedAt) startClock(roomId); }, delayMs || 10000);
    return true;
  }
  return { handle, onClose, rooms, results, create, forfeit, restore, get: id => rooms.get(id), startClock, notice, tieBreak };
}

module.exports = { createRooms, verifyInitData };
