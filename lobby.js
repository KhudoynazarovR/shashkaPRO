'use strict';
// lobby.js — onlayn zal: o'yinchilar ro'yxati, chaqiruv, tezkor o'yin va Shveytsar turnirlari.
// O'yinning o'zi rooms.js dagi xonalarda o'tadi (soat, durang, chat shu yerda tayyor).
const crypto = require('crypto');
const { verifyInitData } = require('./rooms');

const TCS = ['1+1', '2+2', '3+2', '5+3', '7+5'];
const DEFAULT_TC = '5+3';
const NOSHOW_MS = Number(process.env.LOBBY_NOSHOW_MS || 120000);   // tur boshlangach kelmaganlar uchun kutish
const NEXT_ROUND_MS = Number(process.env.LOBBY_NEXT_MS || 20000);  // turlar orasidagi tanaffus
const CHALLENGE_TTL = 60000;
const MIN_T_PLAYERS = 3;
const MAX_T_PLAYERS = 64;
const MAX_TOURNAMENTS = 20;
const REG_TTL = 2 * 3600 * 1000;
const KEEP_FINISHED = 6 * 3600 * 1000;

const hex = n => crypto.randomBytes(n).toString('hex');
const cleanName = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 20);
const cleanTitle = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 30);

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

  function standings(t) {
    const arr = [...t.players.values()].map(p => {
      let buch = 0;
      for (const u of p.opps) { const o = t.players.get(u); if (o) buch += o.score; }
      return { uid: p.uid, name: p.name, score: p.score, buch, withdrawn: p.withdrawn };
    });
    arr.sort((a, b) => b.score - a.score || b.buch - a.buch || a.name.localeCompare(b.name));
    return arr;
  }

  function pubT(t) {
    return {
      id: t.id, name: t.name, tc: t.tc, status: t.status,
      creatorUid: t.creatorUid, creatorName: t.creatorName,
      round: t.round, rounds: t.rounds, nextAt: t.nextAt || 0,
      players: standings(t),
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
  function openRoom(roomId, tc, w, b) {
    roomsApi.create(roomId, { tc, white: { uid: w.uid, name: w.name }, black: { uid: b.uid, name: b.name } });
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
  function tryPair(list, allowRematch) {
    const used = new Array(list.length).fill(false);
    const out = [];
    let steps = 0;
    function rec() {
      const i = used.indexOf(false);
      if (i < 0) return true;
      if (++steps > 200000) return false;
      used[i] = true;
      for (let j = i + 1; j < list.length; j++) {
        if (used[j]) continue;
        const a = list[i], b = list[j];
        if (!allowRematch && a.opps.includes(b.uid)) continue;
        used[j] = true;
        out.push([a, b]);
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
    for (const allow of [false, true]) {
      if (sorted.length % 2 === 0) {
        pairs = tryPair(sorted, allow);
      } else {
        // dam olish: eng quyi ochkodagi, hali dam olmagan o'yinchi
        const cands = sorted.slice().reverse().sort((a, b) => a.hadBye - b.hadBye || a.score - b.score);
        for (const cand of cands) {
          const rest = sorted.filter(p => p !== cand);
          const r = tryPair(rest, allow);
          if (r) { pairs = r; bye = cand; break; }
        }
      }
      if (pairs) break;
    }
    if (!pairs) pairs = [];
    // ranglar: oq kam o'ynagan o'yinchiga
    const out = pairs.map(([a, b]) => {
      const da = a.colors.w - a.colors.b, db = b.colors.w - b.colors.b;
      if (da < db) return [a, b];
      if (db < da) return [b, a];
      return Math.random() < 0.5 ? [a, b] : [b, a];
    });
    return { pairs: out, bye };
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
      openRoom(roomId, t.tc, w, b);
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

  function checkNoShows(t, roundNo) {
    if (t.status !== 'running' || t.round !== roundNo) return;
    for (const b of t.cur.slice()) {
      if (b.done) continue;
      const room = roomsApi.get(b.roomId);
      if (!room || room.finished || room.plies >= 2) continue; // soat o'zi hal qiladi
      const on = seat => !!(seat && seat.clientId && clients.has(seat.clientId));
      const wOn = on(room.white), bOn = on(room.black);
      if (!wOn && !bOn) { room.noshowBoth = true; roomsApi.forfeit(b.roomId, 'draw', 'noshow'); }
      else if (wOn && !bOn) roomsApi.forfeit(b.roomId, 'white', 'noshow');
      else if (!wOn && bOn) roomsApi.forfeit(b.roomId, 'black', 'noshow');
      else roomsApi.forfeit(b.roomId, room.turn === 'white' ? 'black' : 'white', 'noshow'); // yurish navbatidagi jim o'tirdi
    }
  }

  function onRoomFinished(room) {
    const ref = roomToBoard.get(room.id);
    if (!ref) return;
    const { t, b } = ref;
    if (b.done) return;
    b.done = true;
    b.winner = room.winner;
    const pw = t.players.get(b.white), pb = t.players.get(b.black);
    let sw = 0, sb = 0;
    if (room.noshowBoth) { sw = 0; sb = 0; }
    else if (room.winner === 'white') sw = 1;
    else if (room.winner === 'black') sb = 1;
    else { sw = 0.5; sb = 0.5; }
    pw.score += sw; pb.score += sb;
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
        t.nextAt = Date.now() + NEXT_ROUND_MS;
        t.timer = setTimeout(() => { if (t.status === 'running') startRound(t); }, NEXT_ROUND_MS);
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
    const st = standings(t);
    const top = st[0] ? st[0].name : '-';
    for (const p of t.players.values()) {
      const rank = st.findIndex(x => x.uid === p.uid) + 1;
      toast(p.uid, '🏆 ' + t.name + ' tugadi. G‘olib: ' + top + '. Sizning o‘rningiz: ' + rank);
    }
    push();
  }

  function startT(t) {
    const n = t.players.size;
    t.rounds = Math.min(n - 1, Math.min(9, Math.max(3, Math.ceil(Math.log2(n)))));
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
        const t = {
          id: hex(3), name: cleanTitle(m.name) || ('Turnir ' + me.name), tc: TCS.includes(m.tc) ? m.tc : DEFAULT_TC,
          creatorUid: me.uid, creatorName: me.name, status: 'reg', created: Date.now(),
          players: new Map(), round: 0, rounds: 0, cur: [], curBye: null, nextAt: 0
        };
        t.players.set(me.uid, newPlayer(me));
        tournaments.set(t.id, t);
        push();
        break;
      }
      case 'lbTJoin': {
        const t = tournaments.get(String(m.tid));
        if (!t || t.status !== 'reg') return err(c, 'Turnir ro‘yxatdan o‘tishga yopiq'), true;
        if (t.players.size >= MAX_T_PLAYERS) return err(c, 'Turnir to‘lgan'), true;
        if (!t.players.has(me.uid)) t.players.set(me.uid, newPlayer(me));
        push();
        break;
      }
      case 'lbTLeave': {
        const t = tournaments.get(String(m.tid));
        if (!t || t.status !== 'reg' || t.creatorUid === me.uid) break;
        t.players.delete(me.uid);
        push();
        break;
      }
      case 'lbTStart': {
        const t = tournaments.get(String(m.tid));
        if (!t || t.status !== 'reg') break;
        if (t.creatorUid !== me.uid) return err(c, 'Turnirni faqat uni ochgan o‘yinchi boshlay oladi'), true;
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
    return { uid: me.uid, name: me.name, score: 0, opps: [], colors: { w: 0, b: 0 }, hadBye: false, noshows: 0, withdrawn: false };
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

  return { handle, onClose, onRoomFinished, tournaments };
}

module.exports = { createLobby };
