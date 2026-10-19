'use strict';
// lobby.js — onlayn zal: o'yinchilar ro'yxati, chaqiruv, tezkor o'yin, Shveytsar va Arena turnirlari.
// O'yinning o'zi rooms.js dagi xonalarda o'tadi (soat, durang, chat shu yerda tayyor).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { verifyInitData } = require('./rooms');
const economy = require('./economy');
const clubsApi = require('./clubs');
const friends = new Map();
const MIN_REWARD_PLIES = Number(process.env.REWARD_MIN_PLIES || 8);
function payWin(room, whiteUid, blackUid, tid) {
  if (!room.noshowBoth && room.reason !== 'noshow' && (room.plies || 0) >= MIN_REWARD_PLIES) require('./stats').record(whiteUid, blackUid, room.winner);
  if (room.noshowBoth || room.reason === 'noshow' || (room.plies || 0) < MIN_REWARD_PLIES) return;
  if (room.winner === 'white') economy.rewardWin(whiteUid, blackUid, tid);
  else if (room.winner === 'black') economy.rewardWin(blackUid, whiteUid, tid);
}

const TCS = ['1+1', '2+2', '3+2', '5+3'];
const DEFAULT_TC = '5+3';
// 🤖 Botlar: kuch pog'onasi. secs = dvigatelga beriladigan o'ylash vaqti, blunder = tasodifiy yurish ehtimoli
const BOTS = [
  { uid: 'bot_easy', name: 'Shogird BOT', secs: 0.05, blunder: 0.12 },
  { uid: 'bot_mid', name: 'Jangchi BOT', secs: 0.2, blunder: 0.12 },
  { uid: 'bot', name: 'Yo‘lbars BOT', secs: 1, blunder: 0 },
  { uid: 'bot_pro', name: 'Arslon BOT', secs: 1, blunder: 0 },
  { uid: 'bot_gm', name: 'Sulton BOT', secs: 1, blunder: 0 },
  { uid: 'bot_champ', name: 'Legend BOT', secs: 1, blunder: 0 }
];
const botByUid = uid => BOTS.find(b => b.uid === uid) || null;
const BOT_TCS = ['1+1', '2+2', '3+2', '5+3'];
const NOSHOW_MS = Number(process.env.LOBBY_NOSHOW_MS || 120000);   // tur boshlangach kelmaganlar uchun kutish
const NEXT_ROUND_MS = Number(process.env.LOBBY_NEXT_MS || 20000);  // turlar orasidagi tanaffus
const CHALLENGE_TTL = 60000;
const MIN_T_PLAYERS = 3;
const MAX_T_PLAYERS = 64;
const MAX_TOURNAMENTS = 20;
const SIMUL_MAXES = [5, 10, 15, 20, 30];          // simulda eng ko'p o'yinchi
const SIMUL_BONUS = [0, 1, 2, 3, 5];               // xo'jayinga har taxtada qo'shimcha daqiqa
const SIMUL_NOSHOW_MS = Number(process.env.SIMUL_NOSHOW_MS || 120000);  // o'yinchi kelmasa, xo'jayin yutadi
const MAX_SIMULS = 10;
const GAMES_OPTS = [1, 2, 4];   // 1 o'yin, 1 match (2 o'yin), 2 match (4 o'yin)
const SERIES_GAP_MS = Number(process.env.SERIES_GAP_MS || 5000);  // seriyada o'yinlar orasidagi tanaffus
const SWISS_ROUNDS = [3, 4, 5, 6, 7, 8, 9, 10, 11];  // turlar soni
const SWISS_INTERVALS = [10, 20, 60, 120, 300];       // turlar orasidagi tanaffus (soniya)
const SWISS_STARTS = [2, 5, 10, 30];                  // rejalashtirilgan boshlanish (daqiqa); boshqasi = qo'lda
const REG_TTL = 2 * 3600 * 1000;
const KEEP_FINISHED = 6 * 3600 * 1000;

// ---- Arena sozlamalari ----
const ARENA_DURATIONS = [10, 20, 30, 45, 60, 90];   // daqiqa
const ARENA_STARTS = [0, 2, 5, 10, 30];
const validStart = v => { v = Number(v); const n = Date.now(); return v >= n + 60000 && v <= n + 183 * 86400000 ? Math.floor(v) : 0; };   // aniq boshlanish: 1 daqiqadan 6 oygacha             // boshlanishgacha kutish (daqiqa)
const ARENA_MAX_PLAYERS = 200;
const ARENA_FIRE_AFTER = 2;                          // ketma-ket shuncha g'alabadan keyin olov yonadi
const ARENA_PAIR_DELAY_MS = Number(process.env.ARENA_PAIR_DELAY_MS || 5000);       // o'yin tugagach juftlashgacha
const ARENA_REMATCH_WAIT_MS = Number(process.env.ARENA_REMATCH_WAIT_MS || 15000);  // bir xil raqibga qaytishdan oldin kutish
const ARENA_NOSHOW_MS = Number(process.env.ARENA_NOSHOW_MS || 30000);              // o'yinga kirmaganlar uchun kutish
const ARENA_MIN_DRAW_PLIES = Number(process.env.ARENA_MIN_DRAW_PLIES || 0);        // shundan qisqa durangga ochko yo'q (0 = o'chirilgan)
const ARENA_BERSERK_MIN_PLIES = Number(process.env.ARENA_BERSERK_MIN_PLIES || 14); // berserk bonusi uchun minimal yarim-yurishlar soni

const hex = n => crypto.randomBytes(n).toString('hex');
const cleanName = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 20);
const cleanTitle = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 30);

// ---- IDF 780 pozitsiyalari (idf780.js dan) ----
let IDF_LIST = null;
function idfList() {
  if (IDF_LIST) return IDF_LIST;
  try {
    const src = fs.readFileSync(path.join(__dirname, 'idf780.js'), 'utf8');
    try { IDF_LIST = new Function(src + '\n;return IDF780;')(); }
    catch (e) { IDF_LIST = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1)); }
  } catch (e) { console.error('[idf780]', e.message); IDF_LIST = []; }
  return IDF_LIST;
}
function pickOpening() {
  const L = idfList();
  return L.length ? L[Math.floor(Math.random() * L.length)] : null;
}

function createLobby({ send, clients, roomsApi }) {
  const queue = new Map();       // uid -> { uid, tc }
  const challenges = new Map();  // id -> { id, fromUid, fromName, toUid, tc, at }
  const tournaments = new Map(); // tid -> t
  const roomToBoard = new Map(); // roomId -> { t, b }
  const roomToSeries = new Map();
  const simuls = new Map();       // sid -> simul
  const roomToSimul = new Map();  // roomId -> { sm, g } // roomId -> { s, w, k }  (o'yinchilar orasidagi seriya)

  let pushTimer = null;

  const lbClients = () => [...clients.values()].filter(c => c.lb);
  const connsOf = uid => lbClients().filter(c => c.lb.uid === uid);
  const toast = (uid, text) => connsOf(uid).forEach(c => send(c.ws, { type: 'lbToast', text }));
  const err = (c, message) => send(c.ws, { type: 'error', message });
  const sendUid = (uid, data) => connsOf(uid).forEach(c => send(c.ws, data));

  // ---------- holat ----------
  function botX(u) { try { const d = require('./store').db; return { n: (d.botNames || {})[u], a: !!(d.botAv || {})[u] }; } catch (e) { return {}; } }
  function botElo(u) { try { const m = require('./store').db.botElo; return (m && m[u] && m[u].elo) || 0; } catch (e) { return 0; } }
  function playersList() {
    const seen = new Map();
    for (const c of lbClients()) {
      const p = seen.get(c.lb.uid);
      if (!p) { let su = null; try { su = require('./store').users()[String(c.lb.uid)]; } catch (e) {} seen.set(c.lb.uid, { uid: c.lb.uid, name: c.lb.name, busy: !!c.lb.inRoom, elo: (c.isBot ? botElo(c.lb.uid) : 0) || (su && su.elo) || 1000, gems: (su && su.diamonds) || 0, wins: (su && su.wins) || 0, hasAv: !!(su && su.avatar) || (!!c.isBot && !!botX(c.lb.uid).a), bot: !!c.isBot, prem: !!(su && require('./store').isPremium(su)) }); }
      else { p.busy = p.busy && !!c.lb.inRoom; if (c.isBot) { p.elo = botElo(c.lb.uid) || p.elo; const x = botX(c.lb.uid); p.hasAv = !!x.a; if (x.n) p.name = x.n; } }
    }
    return [...seen.values()];
  }

  // Buxgols = raqiblar ochkolari yig'indisi.
  // Zonneborn-Berger (SB) = yutgan raqiblar ochkosi + durang raqiblar ochkosining yarmi.
  function swissStats(t, p) {
    let buch = 0, sb = 0;
    for (const r of (p.res || [])) {
      const o = t.players.get(r.opp);
      if (!o) continue;
      buch += o.score;
      sb += r.pts * o.score;
    }
    return { buch: Math.round(buch * 100) / 100, sb: Math.round(sb * 100) / 100 };
  }

  function standings(t) {
    const arr = [...t.players.values()].map(p => {
      const st = swissStats(t, p);
      return { uid: p.uid, name: p.name, score: p.score, buch: st.buch, sb: st.sb, games: (p.res || []).length, withdrawn: p.withdrawn };
    });
    // Lichess tartibi: ochko, keyin SB, keyin Buxgols
    arr.sort((a, b) => b.score - a.score || b.sb - a.sb || b.buch - a.buch || a.name.localeCompare(b.name));
    return arr;
  }

  function arenaStandings(t) {
    const arr = [...t.players.values()].map(p => ({
      uid: p.uid, name: p.name, score: p.score, buch: 0, withdrawn: p.withdrawn,
      games: p.games, wins: p.wins, fire: p.streak >= ARENA_FIRE_AFTER, busy: p.busy, at: p.lastScoreAt
    }));
    // ochko teng bo'lsa shu ochkoga birinchi yetgan yuqorida
    arr.sort((a, b) => b.score - a.score || a.at - b.at || a.name.localeCompare(b.name));
    return arr;
  }

  function clubStandings(t) {
    if (!t.clubIds || !t.clubIds.length) return [];
    const st = t.type === 'arena' ? arenaStandings(t) : standings(t);
    const by = new Map(t.clubIds.map(id => [id, []]));
    for (const p of st) { const cid = clubsApi.clubOfIn(p.uid, t.clubIds); if (cid) by.get(cid).push(+p.score || 0); }
    return [...by].map(([id, a]) => {
      a.sort((x, y) => y - x);
      return { id, name: clubsApi.nameOf(id), players: a.length, score: Math.round(a.slice(0, 5).reduce((s, x) => s + x, 0) * 10) / 10 };
    }).sort((a, b) => b.score - a.score);
  }

  function promoInfo() {
    const st = require('./store');
    if (!st.db.promoEnd) { st.db.promoEnd = Date.now() + 10 * 86400000; st.save(); }
    return { end: st.db.promoEnd, on: Date.now() < st.db.promoEnd };
  }
  function pubT(t) {
    return {
      id: t.id, name: t.name, tc: t.tc, status: t.status, pos: t.pos || 'std',
      roundsWanted: t.roundsWanted || 0, interval: t.interval || 0,
      type: t.type || 'swiss', durationMin: t.durationMin || 0, startAt: t.startAt || 0, endAt: t.endAt || 0, ending: !!t.ending,
      creatorUid: t.creatorUid, creatorName: t.creatorName, clubIds: t.clubIds || [], clubs: clubStandings(t),
      round: t.round, rounds: t.rounds, nextAt: t.nextAt || 0,
      players: t.type === 'arena' ? arenaStandings(t) : standings(t),
      boards: t.cur.map(b => ({
        board: b.board, roomId: b.roomId, white: b.white, black: b.black,
        whiteName: t.players.get(b.white).name, blackName: t.players.get(b.black).name,
        done: b.done, winner: b.winner || null
      })),
      bye: t.curBye || null
    };
  }

  function friendState(uid) {
    let st, us;
    try { st = require('./store'); us = st.users(); } catch (e) { return { friends: [], freqIn: [] }; }
    const u = us[String(uid)] || {};
    const on = new Set(lbClients().map(x => String(x.lb.uid)));
    return {
      friends: (u.friends || []).map(id => { const f = us[id] || {}; return { uid: id, name: f.name || '?', elo: f.elo || 1000, gems: f.diamonds || 0, hasAv: !!f.avatar, online: on.has(id) }; }),
      freqIn: (u.fReq || []).map(id => { const f = us[id] || {}; return { uid: id, name: f.name || '?', hasAv: !!f.avatar }; })
    };
  }

  function stateFor(c) {
    const uid = c.lb.uid;
    return {
      type: 'lbState', now: Date.now(),
      me: { uid, name: c.lb.name }, ...friendState(uid),
      players: playersList(),
      inQueue: queue.has(uid),
      incoming: [...challenges.values()].filter(x => x.toUid === uid)
        .map(x => ({ id: x.id, fromName: x.fromName, tc: x.tc + describeOpts(x) })),
      outgoing: [...challenges.values()].filter(x => x.fromUid === uid)
        .map(x => ({ id: x.id, toUid: x.toUid, tc: x.tc })),
      tournaments: [...tournaments.values()].map(pubT), promo: promoInfo(),
      simuls: [...simuls.values()].map(pubSimul),
      clubs: clubsApi.list(uid),
      appLink: process.env.TG_APP_LINK || process.env.APP_LINK || ''
    };
  }

  function push() {
    if (pushTimer) return;
    pushTimer = setTimeout(() => {
      pushTimer = null;
      for (const c of lbClients()) if (!c.isBot) send(c.ws, stateFor(c));
    }, 200);
  }

  // ---------- xona ochish ----------
  function openRoom(roomId, tc, w, b, arena, opening, noBz) {
    roomsApi.create(roomId, { tc, arena: !!arena, noBerserk: !!noBz, opening: opening || null, white: { uid: w.uid, name: w.name }, black: { uid: b.uid, name: b.name } });
  }

  function cleanOpts(m) {
    return { pos: m && m.pos === 'idf' ? 'idf' : 'std', games: GAMES_OPTS.includes(Number(m && m.games)) ? Number(m.games) : 1 };
  }
  function describeOpts(o) {
    return (o.pos === 'idf' ? ' · IDF 780' : '') + (o.games > 1 ? ' · ' + o.games + ' o‘yin' : '');
  }
  const fmtPts = x => String(x);
  function seriesScore(s) {
    const [A, B] = s.p;
    return A.name + ' ' + fmtPts(s.pts[A.uid]) + ' – ' + fmtPts(s.pts[B.uid]) + ' ' + B.name;
  }

  // 🤖 Bot bilan o'yin: chaqiruv darhol qabul qilinadi, xona ochiladi, vaqt/rang/pozitsiya xonada tanlanadi
  function startBotGame(human, o, bot) {
    const roomId = 'B' + hex(5);
    const tc = o && BOT_TCS.includes(o.tc) ? o.tc : DEFAULT_TC;
    const opening = o && o.pos === 'idf' ? pickOpening() : null;
    roomsApi.create(roomId, {
      tc, vsBot: true, opening, botCfg: { id: bot.uid, secs: bot.secs, blunder: bot.blunder },
      white: { uid: human.uid, name: human.name },
      black: { uid: bot.uid, name: bot.name, clientId: 'ai_' + bot.uid }
    });
    sendUid(human.uid, { type: 'lbGo', roomId, reason: 'challenge', color: 'white', opponent: bot.name, tc, series: null });
  }

  // Seriya: 1 o'yin, yoki match = bir pozitsiya, ranglar almashgan 2 o'yin
  function makeMatch(a, b, tc, reason, o) {
    o = o || { pos: 'std', games: 1 };
    const first = Math.random() < 0.5 ? a : b;
    const s = { id: hex(4), p: [first, first === a ? b : a], tc, pos: o.pos, total: o.games, played: 0, pts: {}, opening: null, reason };
    s.pts[a.uid] = 0; s.pts[b.uid] = 0;
    startSeriesGame(s);
    push();
  }

  function startSeriesGame(s) {
    const g = s.played;                                   // 0 dan boshlanadi
    if (g % 2 === 0) s.opening = s.pos === 'idf' ? pickOpening() : null;   // har matchga yangi pozitsiya
    const w = g % 2 === 0 ? s.p[0] : s.p[1];
    const k = g % 2 === 0 ? s.p[1] : s.p[0];             // matchning 2-o'yinida ranglar almashadi
    const roomId = 'L' + hex(5);
    openRoom(roomId, s.tc, w, k, false, s.opening);
    roomToSeries.set(roomId, { s, w: w.uid, k: k.uid });
    const series = s.total > 1 ? { game: g + 1, total: s.total, score: seriesScore(s) } : null;
    const reason = g === 0 ? s.reason : 'series';
    sendUid(w.uid, { type: 'lbGo', roomId, reason, color: 'white', opponent: k.name, tc: s.tc, series });
    sendUid(k.uid, { type: 'lbGo', roomId, reason, color: 'black', opponent: w.name, tc: s.tc, series });
  }

  function seriesGameDone(ref, room) {
    const { s, w, k } = ref;
    s.played++;
    if (room.winner === 'white') s.pts[w] += 1;
    else if (room.winner === 'black') s.pts[k] += 1;
    else { s.pts[w] += 0.5; s.pts[k] += 0.5; }
    const [A, B] = s.p;
    payWin(room, w, k, null); if (s.total <= 1) return;
    if (s.played >= s.total) {
      const sa = s.pts[A.uid], sb = s.pts[B.uid];
      const res = sa === sb ? 'Durang' : 'G‘olib: ' + (sa > sb ? A.name : B.name);
      const txt = '🏁 Seriya tugadi: ' + seriesScore(s) + '. ' + res;
      toast(A.uid, txt); toast(B.uid, txt);
      return;
    }
    const txt = '🔁 Seriya ' + s.played + '/' + s.total + ': ' + seriesScore(s) + '. Keyingi o‘yin ' + Math.round(SERIES_GAP_MS / 1000) + ' soniyadan so‘ng';
    toast(A.uid, txt); toast(B.uid, txt);
    const timer = setTimeout(() => {
      if (!connsOf(A.uid).length || !connsOf(B.uid).length) {
        const left = connsOf(A.uid).length ? A : B;
        toast(left.uid, 'Raqib chiqib ketdi, seriya tugatildi: ' + seriesScore(s));
        return;
      }
      startSeriesGame(s);
      push();
    }, SERIES_GAP_MS);
    if (timer.unref) timer.unref();
  }

  // ---------- Shveytsar ----------
  // Rang ehtiyoji: dir +1 = oq kerak, -1 = qora kerak; strict = majburiy (ketma-ket 2 bir xil rang yoki farq 2)
  function colorNeed(p) {
    const d = p.colors.w - p.colors.b;
    const q = p.seq || [];
    const l = q.length;
    if (l >= 2 && q[l - 1] === q[l - 2]) return { dir: q[l - 1] === 'w' ? -1 : 1, strict: true };
    if (d >= 2) return { dir: -1, strict: true };
    if (d <= -2) return { dir: 1, strict: true };
    if (d > 0) return { dir: -1, strict: false };
    if (d < 0) return { dir: 1, strict: false };
    if (l) return { dir: q[l - 1] === 'w' ? -1 : 1, strict: false };
    return { dir: 0, strict: false };
  }

  function colorsOk(a, b) {
    const na = colorNeed(a), nb = colorNeed(b);
    return !(na.strict && nb.strict && na.dir !== 0 && na.dir === nb.dir);
  }

  function assignColors(a, b) {
    const na = colorNeed(a), nb = colorNeed(b);
    const str = n => (n.strict ? 2 : (n.dir ? 1 : 0));
    let first = a, fn = na, second = b, sn = nb;
    if (str(nb) > str(na) || (str(nb) === str(na) && Math.abs(b.colors.w - b.colors.b) > Math.abs(a.colors.w - a.colors.b))) {
      first = b; fn = nb; second = a; sn = na;
    }
    let firstWhite;
    if (fn.dir) firstWhite = fn.dir === 1;
    else if (sn.dir) firstWhite = sn.dir === -1;
    else firstWhite = Math.random() < 0.5;
    return firstWhite ? [first, second] : [second, first];
  }

  // Dutch: bir xil ochkodagi guruhda yuqori yarmi quyi yarmi bilan juftlanadi (1-3, 2-4 ...)
  function tryPair(list, allowRematch, enforceColor) {
    const n = list.length;
    const used = new Array(n).fill(false);
    const out = [];
    let steps = 0;
    function rec() {
      const i = used.indexOf(false);
      if (i < 0) return true;
      if (++steps > 20000) return false;
      used[i] = true;
      const a = list[i];
      const same = [];
      for (let j = i + 1; j < n; j++) if (!used[j] && list[j].score === a.score) same.push(j);
      const ideal = Math.floor((same.length + 1) / 2) - 1;
      const cand = [];
      for (let j = i + 1; j < n; j++) {
        if (used[j]) continue;
        const b = list[j];
        if (!allowRematch && a.opps.includes(b.uid)) continue;
        if (enforceColor && !colorsOk(a, b)) continue;
        cand.push(j);
      }
      const rank = j => { const k = same.indexOf(j); return k >= 0 ? [0, Math.abs(k - ideal), k] : [1, j, 0]; };
      cand.sort((x, y) => { const rx = rank(x), ry = rank(y); return rx[0] - ry[0] || rx[1] - ry[1] || rx[2] - ry[2]; });
      for (const j of cand) {
        used[j] = true;
        out.push([a, list[j]]);
        if (rec()) return true;
        out.pop();
        used[j] = false;
      }
      used[i] = false;
      return false;
    }
    return rec() ? out : null;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function swissPair(players) {
    const sorted = shuffle(players.slice()).sort((a, b) => b.score - a.score);
    let bye = null;
    let pairs = null;
    // avval qat'iy qoidalar, keyin birin-ketin yumshatamiz: takror raqib, rang
    const levels = [[false, true], [false, false], [true, true], [true, false]];
    for (const [allow, color] of levels) {
      if (sorted.length % 2 === 0) {
        pairs = tryPair(sorted, allow, color);
      } else {
        // dam olish: hali dam olmagan, eng kam ochkoli o'yinchi
        const cands = sorted.slice().reverse().sort((a, b) => (a.hadBye ? 1 : 0) - (b.hadBye ? 1 : 0) || a.score - b.score);
        for (const cand of cands) {
          const rest = sorted.filter(p => p !== cand);
          const r = tryPair(rest, allow, color);
          if (r) { pairs = r; bye = cand; break; }
        }
      }
      if (pairs) break;
    }
    if (!pairs) pairs = [];
    return { pairs: pairs.map(([a, b]) => assignColors(a, b)), bye };
  }

  // ---------- Olimpiya tizimi (yutgan o‘tadi) ----------
  const OLY_LADDER = ['5+3', '3+2', '2+2', '1+1', '0.5+0'];
  const olyLadder = tc => { const i = OLY_LADDER.indexOf(tc); return OLY_LADDER.slice(i < 0 ? 0 : i); };
  function olyElo(uid) { try { const u = require('./store').users()[String(uid)]; return u ? (Number(u.elo) || 1000) : 1000; } catch (e) { return 1000; } }

  function olyOpenBoard(t, b, tcN) {
    const W = t.players.get(b.white), B = t.players.get(b.black);
    if (!W || !B) return;
    openRoom(b.roomId, tcN, W, B, false, t.pos === 'idf' ? pickOpening() : null);
    sendUid(b.white, { type: 'lbGo', roomId: b.roomId, reason: 'tournament', tname: t.name, round: t.round, color: 'white', opponent: B.name, tc: tcN });
    sendUid(b.black, { type: 'lbGo', roomId: b.roomId, reason: 'tournament', tname: t.name, round: t.round, color: 'black', opponent: W.name, tc: tcN });
    const nid = b.roomId, rn = t.round;
    const to = setTimeout(() => { if (t.status === 'running' && t.round === rn && !b.done && b.roomId === nid) forfeitIdle(b); }, NOSHOW_MS);
    if (to.unref) to.unref();
  }

  function olyStartRound(t) {
    const alive = [...t.players.values()].filter(p => !p.withdrawn && !p.out);
    if (alive.length < 2) return finishT(t);
    if (t.round === 1) {
      alive.sort((a, b) => olyElo(b.uid) - olyElo(a.uid)).forEach((p, i) => { p.seed = i + 1; });
      t.rounds = Math.max(1, Math.ceil(Math.log2(alive.length)));
    }
    alive.sort((a, b) => (a.seed || 999) - (b.seed || 999));
    let k = 1; while (k < alive.length) k *= 2;
    const nb = k - alive.length, byes = alive.slice(0, nb), rest = alive.slice(nb);
    t.cur = []; t.nextAt = 0; t.curBye = byes.length ? byes[0].uid : null;
    byes.forEach(p => { p.score += 1; p.hadBye = true; toast(p.uid, '🏆 ' + t.name + ': bu turda dam olasiz, keyingi turga o‘tdingiz'); });
    const lad = olyLadder(t.tc);
    for (let i = 0; i < rest.length / 2; i++) {
      const w = rest[i], bl = rest[rest.length - 1 - i];
      const roomId = 'T' + t.id + 'R' + t.round + 'B' + (i + 1);
      w.opps.push(bl.uid); bl.opps.push(w.uid); w.colors.w++; bl.colors.b++; w.seq.push('w'); bl.seq.push('b');
      const board = { board: i + 1, roomId, white: w.uid, black: bl.uid, done: false, winner: null, level: 0, game: 1 };
      t.cur.push(board); roomToBoard.set(roomId, { t, b: board });
      olyOpenBoard(t, board, lad[0]);
    }
    push();
  }

  function olyGameDone(t, b, room) {
    const pw = t.players.get(b.white), pb = t.players.get(b.black);
    if (!pw || !pb) return;
    let winUid = room.winner === 'white' ? b.white : room.winner === 'black' ? b.black : null;
    const lad = olyLadder(t.tc);
    if (!winUid && !room.noshowBoth && b.level + 1 < lad.length) {
      // durang: keyingi pog‘ona vaqti bilan yana bitta partiya, ranglar almashadi
      roomToBoard.delete(room.id);
      b.level++; b.game++;
      const tmp = b.white; b.white = b.black; b.black = tmp;
      const nid = 'T' + t.id + 'R' + t.round + 'B' + b.board + 'G' + b.game, tcN = lad[b.level];
      b.roomId = nid; roomToBoard.set(nid, { t, b });
      toast(b.white, '🤝 ' + t.name + ': durang! Keyingi partiya ' + tcN);
      toast(b.black, '🤝 ' + t.name + ': durang! Keyingi partiya ' + tcN);
      setTimeout(() => { if (t.status === 'running' && !b.done && b.roomId === nid) { olyOpenBoard(t, b, tcN); push(); } }, 4000);
      push();
      return;
    }
    if (!winUid) {   // hamma partiya durang: reytingi yuqori o‘yinchi o‘tadi
      winUid = olyElo(b.white) >= olyElo(b.black) ? b.white : b.black;
      b.byElo = true;
      toast(b.white, '⚖️ ' + t.name + ': hamma partiya durang, reytingi yuqori o‘yinchi o‘tdi');
      toast(b.black, '⚖️ ' + t.name + ': hamma partiya durang, reytingi yuqori o‘yinchi o‘tdi');
    }
    b.done = true; b.winner = winUid === b.white ? 'white' : 'black';
    const winP = winUid === b.white ? pw : pb, loseP = winUid === b.white ? pb : pw;
    winP.score += 1; winP.res.push({ opp: loseP.uid, pts: 1 }); loseP.res.push({ opp: winP.uid, pts: 0 });
    loseP.out = true; loseP.outRound = t.round;
    if (room.winner === 'white' || room.winner === 'black') { try { payWin(room, b.white, b.black, t.id); } catch (e) {} }
    toast(loseP.uid, '❌ ' + t.name + ': turnirdan chiqdingiz');
    toast(winP.uid, '✅ ' + t.name + ': keyingi turga o‘tdingiz');
    if (t.status === 'running' && t.cur.every(x => x.done)) {
      const left = [...t.players.values()].filter(p => !p.withdrawn && !p.out).length;
      if (t.round >= t.rounds || left < 2) finishT(t);
      else {
        const gap = t.interval || NEXT_ROUND_MS;
        t.nextAt = Date.now() + gap;
        t.timer = setTimeout(() => { if (t.status === 'running') startRound(t); }, gap);
        if (t.timer.unref) t.timer.unref();
      }
    }
    push();
  }

  function startRound(t) {
    t.round++;
    if (t.type === 'olympic') return olyStartRound(t);
    const active = [...t.players.values()].filter(p => !p.withdrawn);
    if (active.length < 2) return finishT(t);
    const { pairs, bye } = swissPair(active);
    t.cur = [];
    t.nextAt = 0;
    t.curBye = null;
    if (bye) { bye.score += 1; bye.hadBye = true; t.curBye = bye.uid; toast(bye.uid, '🏆 ' + t.name + ': bu turda dam olasiz (+1 ochko)'); }
    pairs.forEach(([w, b], i) => {
      const roomId = 'T' + t.id + 'R' + t.round + 'B' + (i + 1);
      w.opps.push(b.uid); b.opps.push(w.uid);
      w.colors.w++; b.colors.b++;
      w.seq.push('w'); b.seq.push('b');
      openRoom(roomId, t.tc, w, b, false, t.pos === 'idf' ? pickOpening() : null);
      const board = { board: i + 1, roomId, white: w.uid, black: b.uid, done: false, winner: null };
      t.cur.push(board);
      roomToBoard.set(roomId, { t, b: board });
      sendUid(w.uid, { type: 'lbGo', roomId, reason: 'tournament', tname: t.name, round: t.round, color: 'white', opponent: b.name, tc: t.tc });
      sendUid(b.uid, { type: 'lbGo', roomId, reason: 'tournament', tname: t.name, round: t.round, color: 'black', opponent: w.name, tc: t.tc });
    });
    const roundNo = t.round;
    t.timer = setTimeout(() => checkNoShows(t, roundNo), NOSHOW_MS);
    if (t.timer.unref) t.timer.unref();
    push();
  }

  function forfeitIdle(b) {
    if (b.done) return;
    const room = roomsApi.get(b.roomId);
    if (!room || room.finished || room.plies >= 2) return; // soat o'zi hal qiladi
    const on = seat => !!(seat && seat.clientId && clients.has(seat.clientId));
    const wOn = on(room.white), bOn = on(room.black);
    if (!wOn && !bOn) { room.noshowBoth = true; roomsApi.forfeit(b.roomId, 'draw', 'noshow'); }
    else if (wOn && !bOn) roomsApi.forfeit(b.roomId, 'white', 'noshow');
    else if (!wOn && bOn) roomsApi.forfeit(b.roomId, 'black', 'noshow');
    else roomsApi.forfeit(b.roomId, room.turn === 'white' ? 'black' : 'white', 'noshow'); // yurish navbatidagi jim o'tirdi
  }

  function checkNoShows(t, roundNo) {
    if (t.status !== 'running' || t.round !== roundNo) return;
    for (const b of t.cur.slice()) forfeitIdle(b);
  }

  function onRoomFinished(room) {
    const sim = roomToSimul.get(room.id);
    if (sim) { roomToSimul.delete(room.id); return simulGameDone(sim, room); }
    const sr = roomToSeries.get(room.id);
    if (sr) { roomToSeries.delete(room.id); return seriesGameDone(sr, room); }
    const ref = roomToBoard.get(room.id);
    if (!ref) return;
    const { t, b } = ref;
    if (b.done) return;
    if (t.type === 'arena') return arenaGameDone(t, b, room);
    if (t.type === 'olympic') return olyGameDone(t, b, room);
    b.done = true;
    b.winner = room.winner;
    const pw = t.players.get(b.white), pb = t.players.get(b.black);
    let sw = 0, sb = 0;
    if (room.noshowBoth) { sw = 0; sb = 0; }
    else if (room.winner === 'white') sw = 1;
    else if (room.winner === 'black') sb = 1;
    else { sw = 0.5; sb = 0.5; }
    pw.score += sw; pb.score += sb; payWin(room, b.white, b.black, t.id);
    pw.res.push({ opp: pb.uid, pts: sw }); pb.res.push({ opp: pw.uid, pts: sb });
    if (room.reason === 'noshow') {
      if (room.noshowBoth) { pw.noshows++; pb.noshows++; }
      else if (room.winner === 'white') { pb.noshows++; pw.noshows = 0; }
      else if (room.winner === 'black') { pw.noshows++; pb.noshows = 0; }
    } else { pw.noshows = 0; pb.noshows = 0; }
    for (const p of [pw, pb]) {
      if (p.noshows >= 2 && !p.withdrawn) { p.withdrawn = true; toast(p.uid, '⚠️ ' + t.name + ': ketma-ket 2 marta kelmadingiz, turnirdan chiqarildingiz'); }
    }
    if (t.status === 'running' && t.cur.every(x => x.done)) {
      const left = [...t.players.values()].filter(p => !p.withdrawn).length;
      if (t.round >= t.rounds || left < 2) finishT(t);
      else {
        const gap = t.interval || NEXT_ROUND_MS;
        t.nextAt = Date.now() + gap;
        t.timer = setTimeout(() => { if (t.status === 'running') startRound(t); }, gap);
        if (t.timer.unref) t.timer.unref();
      }
    }
    push();
  }

  function finishT(t) {
    if (t.status === 'finished') return;
    if (t.timer) clearTimeout(t.timer);
    t.status = 'finished';
    t.finishedAt = Date.now(); if (!t.paidOut) { t.paidOut = true; const r = economy.finishTournament(t.creatorUid, [...(t.paid || [])]); if (r.bonus) toast(t.creatorUid, '🪙 Yaratuvchi bonusi: +' + r.bonus); }
    t.nextAt = 0;
    const st = t.type === 'arena' ? arenaStandings(t) : standings(t);
    const top = st[0] ? st[0].name : '-';
    if (t.clubIds && t.clubIds.length) { const cs = clubStandings(t); if (cs.length > 1) { clubsApi.award(cs); if (cs[0]) for (const p of t.players.values()) toast(p.uid, '🏅 Klublar hisobida g‘olib: ' + cs[0].name + ' (' + cs[0].score + ')'); } }
    try {
      if (st[0] && st[0].score > 0 && t.players.size >= MIN_T_PLAYERS) {
        const _st = require('./store'), _u = _st.users()[String(st[0].uid)];
        if (_u) { _u.tournWins = (_u.tournWins || 0) + 1; _st.save(); }
      }
    } catch (e) {}
    for (const p of t.players.values()) {
      const rank = st.findIndex(x => x.uid === p.uid) + 1;
      toast(p.uid, '🏆 ' + t.name + ' tugadi. G‘olib: ' + top + '. Sizning o‘rningiz: ' + rank);
    }
    push();
  }

  // ---------- Arena ----------
  function newArenaPlayer(me) {
    const now = Date.now();
    return {
      uid: me.uid, name: me.name, score: 0, streak: 0, games: 0, wins: 0, draws: 0, losses: 0,
      busy: false, withdrawn: false, lastOpp: null, colors: { w: 0, b: 0 },
      waitingSince: now, lastScoreAt: now
    };
  }

  function startArena(t) {
    if (t.status !== 'reg') return;
    t.status = 'running';
    const now = Date.now();
    for (const p of t.players.values()) {
      p.waitingSince = now - ARENA_PAIR_DELAY_MS;
      toast(p.uid, '⚔️ ' + t.name + ' boshlandi!');
    }
    push();
  }

  function startArenaGame(t, a, b) {
    const da = a.colors.w - a.colors.b, db = b.colors.w - b.colors.b;
    let w = a, k = b;
    if (db < da || (da === db && Math.random() < 0.5)) { w = b; k = a; }
    const roomId = 'A' + t.id + 'G' + (++t.gameNo);
    w.colors.w++; k.colors.b++;
    w.busy = true; k.busy = true;
    openRoom(roomId, t.tc, w, k, true, t.pos === 'idf' ? pickOpening() : null, t.berserk === false);
    const board = { board: t.gameNo, roomId, white: w.uid, black: k.uid, done: false, winner: null };
    t.cur.push(board);
    roomToBoard.set(roomId, { t, b: board });
    sendUid(w.uid, { type: 'lbGo', roomId, reason: 'arena', tname: t.name, round: 0, color: 'white', opponent: k.name, tc: t.tc });
    sendUid(k.uid, { type: 'lbGo', roomId, reason: 'arena', tname: t.name, round: 0, color: 'black', opponent: w.name, tc: t.tc });
    const timer = setTimeout(() => forfeitIdle(board), ARENA_NOSHOW_MS);
    if (timer.unref) timer.unref();
  }

  function arenaPair(t) {
    const now = Date.now();
    const avail = shuffle([...t.players.values()].filter(p =>
      !p.withdrawn && !p.busy && now - p.waitingSince >= ARENA_PAIR_DELAY_MS && connsOf(p.uid).length
    )).sort((a, b) => b.score - a.score);
    const used = new Set();
    let made = false;
    for (let i = 0; i < avail.length; i++) {
      const a = avail[i];
      if (used.has(a)) continue;
      let pick = null;
      for (let j = i + 1; j < avail.length; j++) {
        const b = avail[j];
        if (used.has(b)) continue;
        const rematch = a.lastOpp === b.uid || b.lastOpp === a.uid;
        if (rematch && !(now - a.waitingSince >= ARENA_REMATCH_WAIT_MS && now - b.waitingSince >= ARENA_REMATCH_WAIT_MS)) continue;
        pick = b; break;
      }
      if (!pick) continue;
      used.add(a); used.add(pick);
      startArenaGame(t, a, pick);
      made = true;
    }
    if (made) push();
  }

  // Ochko: g'alaba 2, durang 1. Olovda (ketma-ket 2 g'alabadan keyin) g'alaba 4, durang 2.
  // Durang yoki mag'lubiyat olovni o'chiradi.
  function arenaGameDone(t, b, room) {
    b.done = true;
    b.winner = room.winner;
    t.cur = t.cur.filter(x => x !== b);
    roomToBoard.delete(room.id);
    const pw = t.players.get(b.white), pb = t.players.get(b.black);
    const now = Date.now();
    // Berserk: rooms.js room.berserk = { white: bool, black: bool } ni to'ldiradi.
    // Berserk qilgan o'yinchi g'alaba qozonsa +1 ochko (kamida ARENA_BERSERK_MIN_PLIES yurishdan keyin).
    const award = (p, kind, color) => {
      const fire = p.streak >= ARENA_FIRE_AFTER;
      let pts = 0;
      if (kind === 'win') {
        pts = fire ? 4 : 2; p.streak++; p.wins++;
        const bz = room.berserk && room.berserk[color];
        if (bz && room.plies >= ARENA_BERSERK_MIN_PLIES) pts += 1;
      }
      else if (kind === 'draw') {
        pts = (room.plies < ARENA_MIN_DRAW_PLIES) ? 0 : (fire ? 2 : 1);
        p.streak = 0; p.draws++;
      } else { p.streak = 0; p.losses++; }
      if (pts) { p.score += pts; p.lastScoreAt = now; }
      p.games++;
    };
    if (room.noshowBoth) {
      for (const p of [pw, pb]) { p.withdrawn = true; toast(p.uid, '⚠️ ' + t.name + ': o‘yinga kirmadingiz, pauzadasiz. Qaytish uchun „Qo‘shilish“ni bosing'); }
    } else {
      if (room.winner === 'white') { award(pw, 'win', 'white'); award(pb, 'loss', 'black'); }
      else if (room.winner === 'black') { award(pb, 'win', 'black'); award(pw, 'loss', 'white'); }
      else { award(pw, 'draw', 'white'); award(pb, 'draw', 'black'); }
      if (room.reason === 'noshow') {
        const lost = room.winner === 'white' ? pb : room.winner === 'black' ? pw : null;
        if (lost) { lost.withdrawn = true; toast(lost.uid, '⚠️ ' + t.name + ': o‘yinga kirmadingiz, pauzadasiz. Qaytish uchun „Qo‘shilish“ni bosing'); }
      }
    }
    payWin(room, b.white, b.black, t.id); pw.lastOpp = pb.uid; pb.lastOpp = pw.uid;
    pw.busy = false; pb.busy = false;
    pw.waitingSince = now; pb.waitingSince = now;
    push();
  }

  function arenaTick() {
    const now = Date.now();
    for (const t of tournaments.values()) {
      if (t.type !== 'arena') {
        if (t.status === 'reg' && t.startAt && now >= t.startAt) {
          if (t.players.size >= MIN_T_PLAYERS) startT(t);
          else {
            t.startAt = now + 60000;
            toast(t.creatorUid, '⏳ ' + t.name + ': kamida ' + MIN_T_PLAYERS + ' o‘yinchi kerak, boshlanish 1 daqiqaga kechiktirildi');
          }
          push();
        }
        continue;
      }
      if (t.status === 'reg' && now >= t.startAt) startArena(t);
      if (t.status !== 'running') continue;
      if (!t.ending && now >= t.endAt) { t.ending = true; push(); }
      if (t.ending) { if (!t.cur.length) finishT(t); continue; } // boshlangan o'yinlar oxirigacha o'ynaladi
      arenaPair(t);
    }
  }

  // ---------- Simul: bitta xo'jayin ko'p o'yinchi bilan bir vaqtda ----------
  function pubSimul(sm) {
    const now = Date.now();
    const games = sm.games.map(g => {
      const room = roomsApi.get(g.roomId);
      let hostTurn = false, hostMs = 0;
      if (room && !room.finished && !g.done) {
        hostTurn = room.turn === g.hc && !!(room.white && room.black);
        hostMs = room.clock ? room.clock[g.hc] : 0;
        if (room.plies >= 2 && room.turn === g.hc) hostMs -= now - room.turnStartedAt;
      }
      return {
        roomId: g.roomId, uid: g.uid, name: g.name, hc: g.hc, white: g.white, black: g.black,
        done: g.done, winner: g.winner, result: g.result, hostTurn, hostMs: Math.max(0, Math.round(hostMs)),
        plies: room ? room.plies : 0
      };
    });
    let w = 0, d = 0, l = 0;
    for (const g of sm.games) {
      if (!g.done || g.result === 'none') continue;
      if (g.result === 'host') w++; else if (g.result === 'draw') d++; else l++;
    }
    return {
      id: sm.id, name: sm.name, hostUid: sm.hostUid, hostName: sm.hostName, tc: sm.tc, bonus: sm.bonus,
      color: sm.color, pos: sm.pos, max: sm.max, status: sm.status,
      players: [...sm.players.values()].map(p => ({ uid: p.uid, name: p.name })),
      games, score: { w, d, l }
    };
  }

  function startSimul(sm) {
    const list = [...sm.players.values()];
    sm.status = 'running';
    sm.startedAt = Date.now();
    const host = { uid: sm.hostUid, name: sm.hostName };
    let firstHostWhite = null;
    list.forEach((p, i) => {
      const hostWhite = sm.color === 'w' ? true : sm.color === 'b' ? false : i % 2 === 0;
      const roomId = 'S' + sm.id + 'G' + (i + 1);
      const w = hostWhite ? host : p, b = hostWhite ? p : host;
      const opening = sm.pos === 'idf' ? pickOpening() : null;
      roomsApi.create(roomId, {
        tc: sm.tc, locked: true, opening,
        bonus: sm.bonus ? { color: hostWhite ? 'white' : 'black', ms: sm.bonus * 60000 } : null,
        white: { uid: w.uid, name: w.name }, black: { uid: b.uid, name: b.name }
      });
      const g = { roomId, uid: p.uid, name: p.name, hc: hostWhite ? 'white' : 'black', white: w.uid, black: b.uid, done: false, winner: null, result: null };
      sm.games.push(g);
      roomToSimul.set(roomId, { sm, g });
      if (hostWhite && !firstHostWhite) firstHostWhite = roomId;
      sendUid(p.uid, { type: 'lbGo', roomId, reason: 'simul', tname: sm.name, round: 0, color: hostWhite ? 'black' : 'white', opponent: sm.hostName, tc: sm.tc });
      const timer = setTimeout(() => simulNoShow(g, sm), SIMUL_NOSHOW_MS);
      if (timer.unref) timer.unref();
    });
    toast(sm.hostUid, '🎭 ' + sm.name + ': ' + list.length + ' ta taxta ochildi');
    if (firstHostWhite) sendUid(sm.hostUid, { type: 'lbGo', roomId: firstHostWhite, reason: 'simul', tname: sm.name, round: 0, color: 'white', opponent: list[0].name, tc: sm.tc });
    push();
  }

  // o'yinchi taxtaga umuman kirmagan bo'lsa, xo'jayin yutadi (xo'jayin hamma taxtada bir vaqtda bo'la olmaydi, shuning uchun faqat o'yinchi tekshiriladi)
  function simulNoShow(g, sm) {
    if (g.done) return;
    const room = roomsApi.get(g.roomId);
    if (!room || room.finished || room.plies >= 1) return;
    const seat = room[g.hc === 'white' ? 'black' : 'white'];
    const online = !!(seat && seat.clientId && clients.has(seat.clientId));
    if (!online) roomsApi.forfeit(g.roomId, g.hc, 'noshow');
  }

  function simulGameDone(ref, room) {
    const { sm, g } = ref;
    g.done = true;
    g.winner = room.winner;
    if (room.noshowBoth) g.result = 'none';
    else if (room.winner === 'draw') g.result = 'draw';
    else g.result = room.winner === g.hc ? 'host' : 'player';
    if (sm.status === 'running' && sm.games.every(x => x.done)) {
      sm.status = 'finished';
      sm.finishedAt = Date.now();
      const sc = pubSimul(sm).score;
      const txt = '🎭 ' + sm.name + ' tugadi: +' + sc.w + ' =' + sc.d + ' −' + sc.l + ' (mezbon ' + sm.hostName + ' hisobida)';
      toast(sm.hostUid, txt);
      for (const p of sm.players.values()) toast(p.uid, txt);
    }
    push();
  }

  function startT(t) {
    const n = t.players.size;
    const auto = Math.min(9, Math.max(3, Math.ceil(Math.log2(n))));
    t.rounds = Math.max(1, Math.min(n - 1, t.roundsWanted || auto));
    t.startAt = 0;
    t.status = 'running';
    startRound(t);
  }

  // ---------- xabarlar ----------
  function hello(c, m) {
    let uid, name, tg = false;
    if (m.initData) {
      const u = verifyInitData(String(m.initData));
      if (!u) return err(c, 'Telegram tasdiqlash xatosi');
      uid = u.id; name = u.name; tg = true;
    } else {
      if (process.env.REQUIRE_TG === '1') return err(c, 'Faqat Telegram ichidan kirish mumkin');
      if (!/^[A-Za-z0-9]{8,32}$/.test(String(m.guestId || ''))) return err(c, 'Noto‘g‘ri id');
      uid = 'g_' + m.guestId;
      name = cleanName(m.name) || 'Mehmon-' + String(m.guestId).slice(0, 3).toUpperCase();
    }
    c.lb = { uid, name, tg, inRoom: !!m.inRoom };
    if (tg) { try { require('./store').getOrCreate({ id: uid, first_name: name }); } catch (e) {} }
    for (const t of tournaments.values()) { const p = t.players.get(uid); if (p) p.name = name; }
    push();
  }

  function handle(c, m) {
    if (!m || typeof m.type !== 'string' || !c.lb) return handleInner(c, m);
    const uid = c.lb.uid;
    const t0 = tournaments.get(String(m.tid || ''));
    const FEE = economy.CFG;
    if (m.type === 'lbTCreate') {
    { const cl0 = clubsApi.check(uid, m.clubIds); if (cl0.error) { err(c, cl0.error); return true; } }
      const before = tournaments.size;
      const adm = economy.isAdmin(uid);
      let pz = Math.floor(Number(m.prize) || 0);
      if (!adm && pz < 100) pz = 100;
      if (pz < 0) pz = 0;
      if (pz > 10000000) pz = 10000000;
      if (!adm && !economy.spend(uid, pz, 'tournament_prize')) { err(c, 'Turnir yaratish uchun ' + pz + ' 🪙 kerak'); return true; }
      m._prize = pz; m._paid = adm ? 0 : pz;
      const ret = handleInner(c, m);
      if (tournaments.size === before && m._paid) economy.refund(uid, m._paid, 'refund_create');
      return ret;
    }
    if (m.type === 'lbTJoin' && t0 && !t0.players.has(uid)) {
    if (t0.clubIds && t0.clubIds.length && !clubsApi.inAny(uid, t0.clubIds)) { err(c, 'Bu turnir faqat klub a‘zolari uchun'); return true; }
      t0.paid = t0.paid || new Set();
      if (!economy.chargeJoin(uid).ok) { err(c, 'Qatnashish uchun ' + FEE.JOIN_FEE + ' 🪙 kerak'); return true; }
      const ret = handleInner(c, m);
      if (t0.players.has(uid)) t0.paid.add(uid); else economy.refund(uid, FEE.JOIN_FEE, 'refund_join');
      return ret;
    }
    if (m.type === 'lbTLeave' && t0 && t0.status === 'reg' && t0.paid && t0.paid.has(uid)) {
      const ret = handleInner(c, m);
      if (!t0.players.has(uid)) { t0.paid.delete(uid); economy.refund(uid, FEE.JOIN_FEE, 'refund_leave'); }
      return ret;
    }
    if (m.type === 'lbTCancel' && t0 && t0.status === 'reg' && t0.creatorUid === uid) {
      const ret = handleInner(c, m);
      if (!tournaments.has(t0.id)) {
        if (t0.prizePaid) economy.refund(uid, t0.prizePaid, 'refund_create');
        for (const p of (t0.paid || [])) economy.refund(p, FEE.JOIN_FEE, 'refund_join');
      }
      return ret;
    }
    return handleInner(c, m);
  }
  function handleInner(c, m) {
    if (!m || typeof m.type !== 'string' || !m.type.startsWith('lb')) return false;
    if (m.type === 'lbHello') { hello(c, m); return true; }
    if (!c.lb) { err(c, 'Avval kirish kerak'); return true; }
    const me = c.lb;

    switch (m.type) {
      case 'lbFriendRemove': {
        const st = require('./store'), us = st.users();
        const to = String(m.uid), mine = String(me.uid);
        const ut = us[to], uu = us[mine];
        if (!uu || to === mine) break;
        uu.friends = (uu.friends || []).filter(x => x !== to);
        if (ut) ut.friends = (ut.friends || []).filter(x => x !== mine);
        st.save(); push(); break;
      }
      case 'lbFriendReq': {
        const st = require('./store'), us = st.users();
        const to = String(m.uid), mine = String(me.uid);
        const ut = us[to], uu = us[mine];
        if (!ut || !uu || to === mine) break;
        uu.friends = uu.friends || []; ut.friends = ut.friends || [];
        ut.fReq = ut.fReq || []; uu.fReq = uu.fReq || [];
        if (uu.friends.includes(to)) break;
        if (uu.fReq.includes(to)) {
          uu.fReq = uu.fReq.filter(x => x !== to);
          uu.friends.push(to);
          if (!ut.friends.includes(mine)) ut.friends.push(mine);
        } else if (!ut.fReq.includes(mine)) {
          ut.fReq.push(mine);
          toast(to, '👥 ' + me.name + ' do‘stlikka taklif qildi');
        }
        st.save(); push(); break;
      }
      case 'lbFriendResp': {
        const st = require('./store'), us = st.users();
        const from = String(m.uid), mine = String(me.uid);
        const uu = us[mine], uf = us[from];
        if (!uu) break;
        uu.fReq = (uu.fReq || []).filter(x => x !== from);
        if (m.accept && uf) {
          uu.friends = uu.friends || []; uf.friends = uf.friends || [];
          if (!uu.friends.includes(from)) uu.friends.push(from);
          if (!uf.friends.includes(mine)) uf.friends.push(mine);
          toast(from, '✅ ' + me.name + ' do‘stlik taklifini qabul qildi');
        }
        st.save(); push(); break;
      }
      case 'lbName': {
        if (me.tg) break;
        const nm = cleanName(m.name);
        if (nm) {
          me.name = nm;
          for (const t of tournaments.values()) { const p = t.players.get(me.uid); if (p) p.name = nm; }
          push();
        }
        break;
      }
      case 'lbQuick': {
        const tc = TCS.includes(m.tc) ? m.tc : DEFAULT_TC;
        const o = cleanOpts(m);
        const other = [...queue.values()].find(x => x.uid !== me.uid && x.tc === tc && x.pos === o.pos && x.games === o.games && connsOf(x.uid).length);
        if (other) {
          queue.delete(other.uid); queue.delete(me.uid);
          makeMatch({ uid: other.uid, name: connsOf(other.uid)[0].lb.name }, { uid: me.uid, name: me.name }, tc, 'quick', o);
        } else { queue.set(me.uid, { uid: me.uid, tc, pos: o.pos, games: o.games }); push(); }
        break;
      }
      case 'lbQuickCancel': queue.delete(me.uid); push(); break;
      case 'lbCancelTo': {
        const tu = String(m.toUid);
        [...challenges.entries()].forEach(([cid, x]) => { if (x.fromUid === me.uid && x.toUid === tu) challenges.delete(cid); });
        push(); break;
      }
      case 'lbChallenge': {
        const to = connsOf(String(m.toUid))[0];
        if (!to || to.lb.uid === me.uid) return err(c, 'O‘yinchi topilmadi'), true;
        if ([...challenges.values()].some(x => x.fromUid === me.uid && x.toUid === to.lb.uid)) return err(c, 'Chaqiruv allaqachon yuborilgan'), true;
        if (challenges.size > 500) return err(c, 'Hozir band, keyinroq urinib ko‘ring'), true;
        const ch = { id: 'c' + hex(4), fromUid: me.uid, fromName: me.name, toUid: to.lb.uid, tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC, ...cleanOpts(m), at: Date.now() };
        if (botByUid(ch.toUid)) {   // bot taklifni darhol qabul qiladi
          queue.delete(me.uid);
          startBotGame({ uid: me.uid, name: me.name }, ch, botByUid(ch.toUid));
          push();
          break;
        }
        challenges.set(ch.id, ch);
        sendUid(ch.toUid, { type: 'lbChallengeIn', id: ch.id, fromName: ch.fromName, tc: ch.tc + describeOpts(ch) });
        push();
        break;
      }
      case 'lbRespond': {
        const ch = challenges.get(String(m.id));
        if (!ch) break;
        const mine = ch.toUid === me.uid, own = ch.fromUid === me.uid;
        if (!mine && !(own && !m.accept)) break;
        challenges.delete(ch.id);
        if (mine && m.accept) {
          queue.delete(ch.fromUid); queue.delete(ch.toUid);
          if (connsOf(ch.fromUid).length) makeMatch({ uid: ch.fromUid, name: ch.fromName }, { uid: me.uid, name: me.name }, ch.tc, 'challenge', ch);
          else toast(me.uid, 'Chaqiruvchi chiqib ketgan');
        } else if (mine) toast(ch.fromUid, me.name + ' chaqiruvni rad etdi');
        push();
        break;
      }
      case 'lbTCreate': {
        const cl = clubsApi.check(me.uid, m.clubIds); if (cl.error) return err(c, cl.error), true;
        if (tournaments.size >= MAX_TOURNAMENTS) return err(c, 'Turnirlar soni limitga yetdi'), true;
        if ([...tournaments.values()].some(t => t.creatorUid === me.uid && t.status === 'reg')) return err(c, 'Sizda allaqachon ochiq turnir bor'), true;
        if (m.kind === 'arena') {
          const dur = ARENA_DURATIONS.includes(Number(m.duration)) ? Number(m.duration) : 30;
          const delay = ARENA_STARTS.includes(Number(m.startIn)) ? Number(m.startIn) : 5;
          const startAt = validStart(m.startAt) || (Date.now() + delay * 60000);
          const at = {
            id: hex(3), type: 'arena', name: cleanTitle(m.name) || ('Arena ' + me.name),
            tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC,
            creatorUid: me.uid, creatorName: me.name, status: 'reg', created: Date.now(),
            players: new Map(), round: 0, rounds: 0, cur: [], curBye: null, nextAt: 0,
            durationMin: dur, startAt, endAt: startAt + dur * 60000, gameNo: 0, ending: false,
            pos: m.pos === 'idf' ? 'idf' : 'std', berserk: m.berserk !== false, prize: m._prize || 0, prizePaid: m._paid || 0
          };
          at.players.set(me.uid, newArenaPlayer(me));
          at.clubIds = cl.ids; tournaments.set(at.id, at);
          push();
          break;
        }
        const t = {
          id: hex(3), name: cleanTitle(m.name) || ('Turnir ' + me.name), tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC,
          creatorUid: me.uid, creatorName: me.name, status: 'reg', created: Date.now(),
          players: new Map(), round: 0, rounds: 0, cur: [], curBye: null, nextAt: 0,
          pos: m.pos === 'idf' ? 'idf' : 'std',
          prize: m._prize || 0, prizePaid: m._paid || 0,
          roundsWanted: SWISS_ROUNDS.includes(Number(m.rounds)) ? Number(m.rounds) : 0,
          interval: SWISS_INTERVALS.includes(Number(m.interval)) ? Number(m.interval) * 1000 : 0,
          startAt: validStart(m.startAt) || (SWISS_STARTS.includes(Number(m.startIn)) ? Date.now() + Number(m.startIn) * 60000 : 0)
        };
        t.players.set(me.uid, newPlayer(me));
        if (m.kind === 'olympic') { t.type = 'olympic'; t.roundsWanted = 0; }
        t.clubIds = cl.ids; tournaments.set(t.id, t);
        push();
        break;
      }
      case 'lbTJoin': {
        { const tt = tournaments.get(String(m.tid)); if (tt && tt.clubIds && tt.clubIds.length && !clubsApi.inAny(me.uid, tt.clubIds)) return err(c, 'Bu turnir faqat klub a‘zolari uchun'), true; }
        const t = tournaments.get(String(m.tid));
        if (t && t.type === 'arena') {
          if (t.status === 'finished' || t.ending) return err(c, 'Arena tugagan'), true;
          const ex = t.players.get(me.uid);
          if (ex) { if (ex.withdrawn) { ex.withdrawn = false; ex.waitingSince = Date.now(); } }
          else {
            if (t.players.size >= ARENA_MAX_PLAYERS) return err(c, 'Arena to‘lgan'), true;
            t.players.set(me.uid, newArenaPlayer(me));
          }
          push();
          break;
        }
        if (!t) return err(c, 'Turnir topilmadi'), true;
        if (t.status === 'running') {
          // Lichess kabi: turnir davomida qo'shilish (rejadagi turlarning yarmigacha) va pauzadan qaytish
          const ex = t.players.get(me.uid);
          if (ex) { if (ex.withdrawn) { ex.withdrawn = false; ex.noshows = 0; } }
          else {
            if (t.round > Math.ceil(t.rounds / 2)) return err(c, 'Turnirga qo‘shilish muddati o‘tgan'), true;
            if (t.players.size >= MAX_T_PLAYERS) return err(c, 'Turnir to‘lgan'), true;
            t.players.set(me.uid, newPlayer(me));
          }
          push();
          break;
        }
        if (t.status !== 'reg') return err(c, 'Turnir tugagan'), true;
        if (t.players.size >= MAX_T_PLAYERS) return err(c, 'Turnir to‘lgan'), true;
        if (!t.players.has(me.uid)) t.players.set(me.uid, newPlayer(me));
        push();
        break;
      }
      case 'lbTLeave': {
        const t = tournaments.get(String(m.tid));
        if (t && t.type === 'arena' && t.status !== 'finished') {
          const p = t.players.get(me.uid);
          if (p) { if (t.status === 'reg' && t.creatorUid !== me.uid) t.players.delete(me.uid); else p.withdrawn = true; }
          push();
          break;
        }
        if (t && t.status === 'running') {
          const p = t.players.get(me.uid);
          if (p) { p.withdrawn = true; push(); }   // pauza: keyingi turda juftlanmaysiz
          break;
        }
        if (!t || t.status !== 'reg' || t.creatorUid === me.uid) break;
        t.players.delete(me.uid);
        push();
        break;
      }
      case 'lbTStart': {
        const t = tournaments.get(String(m.tid));
        if (!t || t.status !== 'reg') break;
        if (t.creatorUid !== me.uid) return err(c, 'Turnirni faqat uni ochgan o‘yinchi boshlay oladi'), true;
        if (t.type === 'arena') {
          if (t.players.size < 2) return err(c, 'Boshlash uchun kamida 2 o‘yinchi kerak'), true;
          t.startAt = Date.now(); t.endAt = t.startAt + t.durationMin * 60000;
          startArena(t);
          break;
        }
        if (t.players.size < MIN_T_PLAYERS) return err(c, 'Boshlash uchun kamida ' + MIN_T_PLAYERS + ' o‘yinchi kerak'), true;
        startT(t);
        break;
      }
      case 'lbSCreate': {
        if (simuls.size >= MAX_SIMULS) return err(c, 'Simullar soni limitga yetdi'), true;
        if ([...simuls.values()].some(x => x.hostUid === me.uid && x.status !== 'finished')) return err(c, 'Sizda allaqachon faol simul bor'), true;
        const sm = {
          id: hex(3), name: cleanTitle(m.name) || ('Simul ' + me.name), hostUid: me.uid, hostName: me.name,
          tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC,
          bonus: SIMUL_BONUS.includes(Number(m.bonus)) ? Number(m.bonus) : 0,
          color: ['w', 'b', 'alt'].includes(m.color) ? m.color : 'alt',
          pos: m.pos === 'idf' ? 'idf' : 'std',
          max: SIMUL_MAXES.includes(Number(m.max)) ? Number(m.max) : 10,
          status: 'reg', created: Date.now(), players: new Map(), games: []
        };
        simuls.set(sm.id, sm);
        push();
        break;
      }
      case 'lbSJoin': {
        const sm = simuls.get(String(m.sid));
        if (!sm || sm.status !== 'reg') return err(c, 'Simulga qo‘shilib bo‘lmaydi'), true;
        if (sm.hostUid === me.uid) return err(c, 'Mezbon o‘z simuliga qo‘shila olmaydi'), true;
        if (sm.players.size >= sm.max) return err(c, 'Simul to‘lgan'), true;
        sm.players.set(me.uid, { uid: me.uid, name: me.name });
        push();
        break;
      }
      case 'lbSLeave': {
        const sm = simuls.get(String(m.sid));
        if (!sm || sm.status !== 'reg') break;
        sm.players.delete(me.uid);
        push();
        break;
      }
      case 'lbSKick': {
        const sm = simuls.get(String(m.sid));
        if (!sm || sm.status !== 'reg' || sm.hostUid !== me.uid) break;
        const uid = String(m.uid);
        if (sm.players.delete(uid)) toast(uid, '🎭 ' + sm.name + ': mezbon sizni ro‘yxatdan chiqardi');
        push();
        break;
      }
      case 'lbSStart': {
        const sm = simuls.get(String(m.sid));
        if (!sm || sm.status !== 'reg') break;
        if (sm.hostUid !== me.uid) return err(c, 'Simulni faqat mezbon boshlay oladi'), true;
        if (sm.players.size < 1) return err(c, 'Boshlash uchun kamida 1 o‘yinchi kerak'), true;
        startSimul(sm);
        break;
      }
      case 'lbSCancel': {
        const sm = simuls.get(String(m.sid));
        if (!sm || sm.hostUid !== me.uid || sm.status !== 'reg') break;
        simuls.delete(sm.id);
        for (const p of sm.players.values()) toast(p.uid, '🎭 ' + sm.name + ' bekor qilindi');
        push();
        break;
      }
      case 'lbClubCreate': case 'lbClubJoin': case 'lbClubLeave': case 'lbClubKick': case 'lbClubDisband': case 'lbClubAccept': case 'lbClubReject': case 'lbClubAdmin': case 'lbClubSet': case 'lbClubImg': {
        const r = clubsApi.act(me, m);
        if (r && r.error) err(c, r.error);
        push();
        break;
      }
      case 'lbRef': {
        if (!c.lb || !c.lb.tg) break;
        const st = require('./store'), us = st.users();
        const rid = String(m.ref || '').replace(/^ref_/, '').replace(/[^0-9]/g, '');
        const u = us[String(me.uid)], inv = us[rid];
        if (!u || !inv || rid === String(me.uid) || u.refBy || !promoInfo().on) break;
        if (Date.now() - (u.created || 0) > 3600000) break;
        if ((inv.refCount || 0) >= 50) break;
        u.refBy = rid; inv.refCount = (inv.refCount || 0) + 1; st.save();
        economy.add(rid, 200, 'referral');
        toast(rid, '🎉 Do‘stingiz ' + u.name + ' qo‘shildi: +200 🪙');
        push();
        break;
      }
      case 'lbFriendNew': {
        for (const [k, f] of friends) if (f.fromUid === me.uid || Date.now() - f.at > 1800000) friends.delete(k);
        const fr = { id: 'f' + hex(4), fromUid: me.uid, fromName: me.name, tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC, opts: cleanOpts(m), at: Date.now() };
        friends.set(fr.id, fr);
        send(c.ws, { type: 'lbFriendLink', id: fr.id });
        break;
      }
      case 'lbFriendJoin': {
        const fr = friends.get(String(m.id || ''));
        if (!fr || Date.now() - fr.at > 1800000) return err(c, 'Havola eskirgan. Do‘stingizdan yangisini so‘rang'), true;
        if (fr.fromUid === me.uid) return err(c, 'Bu sizning havolangiz'), true;
        if (!connsOf(fr.fromUid)[0]) return err(c, 'Do‘stingiz hozir onlayn emas'), true;
        friends.delete(fr.id);
        const ch = { id: 'c' + hex(4), fromUid: fr.fromUid, fromName: fr.fromName, toUid: me.uid, tc: fr.tc, ...fr.opts, at: Date.now() };
        challenges.set(ch.id, ch);
        return handleInner(c, { type: 'lbRespond', id: ch.id, accept: true });
      }
      case 'lbShare': { handleShare(c, m); break; }
      case 'lbTCancel': {
        const t = tournaments.get(String(m.tid));
        if (!t || t.creatorUid !== me.uid || t.status !== 'reg') break;
        tournaments.delete(t.id);
        for (const p of t.players.values()) toast(p.uid, t.name + ' bekor qilindi');
        push();
        break;
      }
      default: break;
    }
    return true;
  }

  // ---------- 🔗 tayyor xabar ulashish (savePreparedInlineMessage) ----------
  const https = require('https');
  function botToken() {
    return process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || process.env.TOKEN || '';
  }
  function tgCall(method, payload) {
    return new Promise((resolve, reject) => {
      const token = botToken();
      if (!token) return reject(new Error('BOT_TOKEN yo‘q'));
      const body = JSON.stringify(payload);
      const req = https.request({
        hostname: 'api.telegram.org', path: '/bot' + token + '/' + method, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 8000
      }, res => {
        let d = '';
        res.on('data', x => { d += x; });
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
      req.end(body);
    });
  }
  function shareImageUrl() {
    if (process.env.SHARE_IMAGE_URL) return process.env.SHARE_IMAGE_URL;
    const base = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
    return base ? base.replace(/\/$/, '') + '/share.jpg' : '';
  }
  async function handleShare(c, m) {
    const me = c.lb;
    const fail = why => send(c.ws, { type: 'lbShareFail', kind: m.kind, id: String(m.id || ''), why });
    try {
      if (!me.tg || !/^\d+$/.test(String(me.uid))) return fail('tg');
      const appLink = process.env.TG_APP_LINK || process.env.APP_LINK || '';
      const img = shareImageUrl();
      if (!appLink || !img) return fail('config');
      const id = String(m.id || '');
      let title, text, prefix;
      if (m.kind === 't') {
        const t = tournaments.get(id);
        if (!t) return fail('notfound');
        prefix = 'lbt_';
        title = (t.type === 'arena' ? '⚔️ ' : '🏆 ') + t.name;
        text = title + ' ga qo‘shiling!\n' + t.tc + ' · ' + t.players.size + ' o‘yinchi';
      } else if (m.kind === 's') {
        const sm = simuls.get(id);
        if (!sm) return fail('notfound');
        prefix = 'lbs_';
        title = '🎭 ' + sm.name;
        text = title + ' siansiga qo‘shiling!\nMezbon: ' + sm.hostName + ' · ' + sm.tc;
      } else return fail('kind');
      const url = appLink.replace(/\/$/, '') + '?startapp=' + prefix + id;
      const r = await tgCall('savePreparedInlineMessage', {
        user_id: Number(me.uid),
        result: {
          type: 'photo', id: hex(8), photo_url: img, thumbnail_url: img,
          title, caption: text,
          reply_markup: { inline_keyboard: [[{ text: '▶ Qo‘shilish', url }]] }
        },
        allow_user_chats: true, allow_bot_chats: false, allow_group_chats: true, allow_channel_chats: true
      });
      if (!r || !r.ok || !r.result || !r.result.id) {
        console.error('[share]', r && r.description);
        return fail('api');
      }
      send(c.ws, { type: 'lbShareReady', kind: m.kind, id, msgId: r.result.id });
    } catch (e) {
      console.error('[share]', e.message);
      fail('error');
    }
  }

  function newPlayer(me) {
    return { uid: me.uid, name: me.name, score: 0, opps: [], seq: [], res: [], colors: { w: 0, b: 0 }, hadBye: false, noshows: 0, withdrawn: false };
  }

  function onClose(c) {
    if (!c.lb) return;
    const uid = c.lb.uid;
    c.lb = null; // ro'yxatdan chiqdi
    if (!connsOf(uid).length) {
      queue.delete(uid);
      for (const [id, ch] of challenges) if (ch.fromUid === uid || ch.toUid === uid) challenges.delete(id);
    }
    push();
  }

  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, ch] of challenges) if (now - ch.at > CHALLENGE_TTL) { challenges.delete(id); changed = true; }
    for (const [id, t] of tournaments) {
      if ((t.status === 'finished' && now - t.finishedAt > KEEP_FINISHED) || (t.status === 'reg' && now - t.created > REG_TTL)) {
        tournaments.delete(id); changed = true;
      }
    }
    if (changed) push();
  }, 10000).unref();

  setInterval(arenaTick, 2000).unref();

  // xo'jayin navbati va soatlari xonalarda o'zgaradi, shuning uchun ishlayotgan simullarni tez-tez yangilaymiz
  setInterval(() => { if ([...simuls.values()].some(x => x.status === 'running')) push(); }, 2000).unref();
  setInterval(() => {
    const now = Date.now();
    let ch = false;
    for (const [id, sm] of simuls) {
      if ((sm.status === 'finished' && now - sm.finishedAt > KEEP_FINISHED) || (sm.status === 'reg' && now - sm.created > REG_TTL)) { simuls.delete(id); ch = true; }
    }
    if (ch) push();
  }, 10000).unref();

  // 🤖 ShashkaBot: lobbida doim onlayn turadi (soxta ulanish, unga hech narsa yuborilmaydi)
  const botWs = { readyState: 1, isAlive: true, send() {}, ping() {}, pong() {}, terminate() {}, close() {}, on() {} };
  global.__botRename = function (uid, name) { const b = BOTS.find(x => x.uid === uid); if (!b) return; b.name = name; const c = clients.get('ai_' + uid); if (c) { c.name = name; if (c.lb) c.lb.name = name; } };
  const _applyBN = () => { try { const bn = require('./store').db.botNames || {}; for (const k in bn) global.__botRename(k, bn[k]); } catch (e) {} };
  _applyBN(); setTimeout(_applyBN, 5000); setTimeout(_applyBN, 20000);
  for (const b of BOTS) {
    clients.set('ai_' + b.uid, { id: 'ai_' + b.uid, name: b.name, elo: 0, ws: botWs, isBot: true, hidden: true, lb: { uid: b.uid, name: b.name, tg: false, inRoom: false } });
  }

  return { handle, onClose, onRoomFinished, tournaments, arenaTick };
}

module.exports = { createLobby };
