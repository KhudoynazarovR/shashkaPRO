'use strict';
// lobby.js — onlayn zal: o'yinchilar ro'yxati, chaqiruv, tezkor o'yin, Shveytsar va Arena turnirlari.
// O'yinning o'zi rooms.js dagi xonalarda o'tadi (soat, durang, chat shu yerda tayyor).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { verifyInitData } = require('./rooms');

const TCS = ['1+1', '2+2', '3+2', '5+3', '7+5'];
const DEFAULT_TC = '5+3';
const NOSHOW_MS = Number(process.env.LOBBY_NOSHOW_MS || 120000);   // tur boshlangach kelmaganlar uchun kutish
const NEXT_ROUND_MS = Number(process.env.LOBBY_NEXT_MS || 20000);  // turlar orasidagi tanaffus
const CHALLENGE_TTL = 60000;
const MIN_T_PLAYERS = 3;
const MAX_T_PLAYERS = 64;
const MAX_TOURNAMENTS = 20;
const SWISS_ROUNDS = [3, 4, 5, 6, 7, 8, 9, 10, 11];  // turlar soni
const SWISS_INTERVALS = [10, 20, 60, 120, 300];       // turlar orasidagi tanaffus (soniya)
const SWISS_STARTS = [2, 5, 10, 30];                  // rejalashtirilgan boshlanish (daqiqa); boshqasi = qo'lda
const REG_TTL = 2 * 3600 * 1000;
const KEEP_FINISHED = 6 * 3600 * 1000;

// ---- Arena sozlamalari ----
const ARENA_DURATIONS = [10, 20, 30, 45, 60, 90];   // daqiqa
const ARENA_STARTS = [0, 2, 5, 10, 30];             // boshlanishgacha kutish (daqiqa)
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

  let pushTimer = null;

  const lbClients = () => [...clients.values()].filter(c => c.lb);
  const connsOf = uid => lbClients().filter(c => c.lb.uid === uid);
  const toast = (uid, text) => connsOf(uid).forEach(c => send(c.ws, { type: 'lbToast', text }));
  const err = (c, message) => send(c.ws, { type: 'error', message });
  const sendUid = (uid, data) => connsOf(uid).forEach(c => send(c.ws, data));

  // ---------- holat ----------
  function playersList() {
    const seen = new Map();
    for (const c of lbClients()) {
      const p = seen.get(c.lb.uid);
      if (!p) seen.set(c.lb.uid, { uid: c.lb.uid, name: c.lb.name, busy: !!c.lb.inRoom });
      else p.busy = p.busy && !!c.lb.inRoom;
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

  function pubT(t) {
    return {
      id: t.id, name: t.name, tc: t.tc, status: t.status, pos: t.pos || 'std',
      roundsWanted: t.roundsWanted || 0, interval: t.interval || 0,
      type: t.type || 'swiss', durationMin: t.durationMin || 0, startAt: t.startAt || 0, endAt: t.endAt || 0, ending: !!t.ending,
      creatorUid: t.creatorUid, creatorName: t.creatorName,
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

  function stateFor(c) {
    const uid = c.lb.uid;
    return {
      type: 'lbState',
      me: { uid, name: c.lb.name },
      players: playersList(),
      inQueue: queue.has(uid),
      incoming: [...challenges.values()].filter(x => x.toUid === uid)
        .map(x => ({ id: x.id, fromName: x.fromName, tc: x.tc })),
      outgoing: [...challenges.values()].filter(x => x.fromUid === uid)
        .map(x => ({ id: x.id, toUid: x.toUid, tc: x.tc })),
      tournaments: [...tournaments.values()].map(pubT)
    };
  }

  function push() {
    if (pushTimer) return;
    pushTimer = setTimeout(() => {
      pushTimer = null;
      for (const c of lbClients()) send(c.ws, stateFor(c));
    }, 200);
  }

  // ---------- xona ochish ----------
  function openRoom(roomId, tc, w, b, arena, opening) {
    roomsApi.create(roomId, { tc, arena: !!arena, opening: opening || null, white: { uid: w.uid, name: w.name }, black: { uid: b.uid, name: b.name } });
  }

  function makeMatch(a, b, tc, reason) {
    const [w, k] = Math.random() < 0.5 ? [a, b] : [b, a];
    const roomId = 'L' + hex(5);
    openRoom(roomId, tc, w, k);
    sendUid(w.uid, { type: 'lbGo', roomId, reason, color: 'white', opponent: k.name, tc });
    sendUid(k.uid, { type: 'lbGo', roomId, reason, color: 'black', opponent: w.name, tc });
    push();
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

  function startRound(t) {
    t.round++;
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
    const ref = roomToBoard.get(room.id);
    if (!ref) return;
    const { t, b } = ref;
    if (b.done) return;
    if (t.type === 'arena') return arenaGameDone(t, b, room);
    b.done = true;
    b.winner = room.winner;
    const pw = t.players.get(b.white), pb = t.players.get(b.black);
    let sw = 0, sb = 0;
    if (room.noshowBoth) { sw = 0; sb = 0; }
    else if (room.winner === 'white') sw = 1;
    else if (room.winner === 'black') sb = 1;
    else { sw = 0.5; sb = 0.5; }
    pw.score += sw; pb.score += sb;
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
    t.finishedAt = Date.now();
    t.nextAt = 0;
    const st = t.type === 'arena' ? arenaStandings(t) : standings(t);
    const top = st[0] ? st[0].name : '-';
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
    openRoom(roomId, t.tc, w, k, true, t.pos === 'idf' ? pickOpening() : null);
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
    pw.lastOpp = pb.uid; pb.lastOpp = pw.uid;
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
    for (const t of tournaments.values()) { const p = t.players.get(uid); if (p) p.name = name; }
    push();
  }

  function handle(c, m) {
    if (!m || typeof m.type !== 'string' || !m.type.startsWith('lb')) return false;
    if (m.type === 'lbHello') { hello(c, m); return true; }
    if (!c.lb) { err(c, 'Avval kirish kerak'); return true; }
    const me = c.lb;

    switch (m.type) {
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
        const other = [...queue.values()].find(x => x.uid !== me.uid && x.tc === tc && connsOf(x.uid).length);
        if (other) {
          queue.delete(other.uid); queue.delete(me.uid);
          makeMatch({ uid: other.uid, name: connsOf(other.uid)[0].lb.name }, { uid: me.uid, name: me.name }, tc, 'quick');
        } else { queue.set(me.uid, { uid: me.uid, tc }); push(); }
        break;
      }
      case 'lbQuickCancel': queue.delete(me.uid); push(); break;
      case 'lbChallenge': {
        const to = connsOf(String(m.toUid))[0];
        if (!to || to.lb.uid === me.uid) return err(c, 'O‘yinchi topilmadi'), true;
        if ([...challenges.values()].some(x => x.fromUid === me.uid && x.toUid === to.lb.uid)) return err(c, 'Chaqiruv allaqachon yuborilgan'), true;
        if (challenges.size > 500) return err(c, 'Hozir band, keyinroq urinib ko‘ring'), true;
        const ch = { id: 'c' + hex(4), fromUid: me.uid, fromName: me.name, toUid: to.lb.uid, tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC, at: Date.now() };
        challenges.set(ch.id, ch);
        sendUid(ch.toUid, { type: 'lbChallengeIn', id: ch.id, fromName: ch.fromName, tc: ch.tc });
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
          if (connsOf(ch.fromUid).length) makeMatch({ uid: ch.fromUid, name: ch.fromName }, { uid: me.uid, name: me.name }, ch.tc, 'challenge');
          else toast(me.uid, 'Chaqiruvchi chiqib ketgan');
        } else if (mine) toast(ch.fromUid, me.name + ' chaqiruvni rad etdi');
        push();
        break;
      }
      case 'lbTCreate': {
        if (tournaments.size >= MAX_TOURNAMENTS) return err(c, 'Turnirlar soni limitga yetdi'), true;
        if ([...tournaments.values()].some(t => t.creatorUid === me.uid && t.status === 'reg')) return err(c, 'Sizda allaqachon ochiq turnir bor'), true;
        if (m.kind === 'arena') {
          const dur = ARENA_DURATIONS.includes(Number(m.duration)) ? Number(m.duration) : 30;
          const delay = ARENA_STARTS.includes(Number(m.startIn)) ? Number(m.startIn) : 5;
          const startAt = Date.now() + delay * 60000;
          const at = {
            id: hex(3), type: 'arena', name: cleanTitle(m.name) || ('Arena ' + me.name),
            tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC,
            creatorUid: me.uid, creatorName: me.name, status: 'reg', created: Date.now(),
            players: new Map(), round: 0, rounds: 0, cur: [], curBye: null, nextAt: 0,
            durationMin: dur, startAt, endAt: startAt + dur * 60000, gameNo: 0, ending: false,
            pos: m.pos === 'idf' ? 'idf' : 'std'
          };
          at.players.set(me.uid, newArenaPlayer(me));
          tournaments.set(at.id, at);
          push();
          break;
        }
        const t = {
          id: hex(3), name: cleanTitle(m.name) || ('Turnir ' + me.name), tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC,
          creatorUid: me.uid, creatorName: me.name, status: 'reg', created: Date.now(),
          players: new Map(), round: 0, rounds: 0, cur: [], curBye: null, nextAt: 0,
          pos: m.pos === 'idf' ? 'idf' : 'std',
          roundsWanted: SWISS_ROUNDS.includes(Number(m.rounds)) ? Number(m.rounds) : 0,
          interval: SWISS_INTERVALS.includes(Number(m.interval)) ? Number(m.interval) * 1000 : 0,
          startAt: SWISS_STARTS.includes(Number(m.startIn)) ? Date.now() + Number(m.startIn) * 60000 : 0
        };
        t.players.set(me.uid, newPlayer(me));
        tournaments.set(t.id, t);
        push();
        break;
      }
      case 'lbTJoin': {
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

  return { handle, onClose, onRoomFinished, tournaments, arenaTick };
}

module.exports = { createLobby };
