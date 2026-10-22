'use strict';
/* lidraughts.js — 👹 Monster BOT'ni lidraughts.org ga ulash (rasmiy Bot API).
   Render Environment: LIDRAUGHTS_TOKEN (bot:play, challenge:read, challenge:write)
   Ixtiyoriy: LIDRAUGHTS_AUTO=1 — bo'sh paytda boshqa botlarni o'zi chaqiradi
              LIDRAUGHTS_TARGETS=RipeCherry,Adder,coletteBOT  LIDRAUGHTS_TC=3+2  LIDRAUGHTS_RATED=1
   Faqat Russian variant o'ynaydi. Kataklar lidraughts raqamlashida (1..32, 1 = b8). */
const https = require('https');
const R = require('./russian-rules.js');
const K = require('./kestoai.js');

const TOKEN = process.env.LIDRAUGHTS_TOKEN || '';
const HOST = 'lidraughts.org';
const MAX_GAMES = Number(process.env.LIDRAUGHTS_MAX || 1);
const ST = { on: false, me: null, games: {}, results: [], log: [], started: Date.now() };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function log(...a) { const s = a.join(' '); console.log('[lidraughts]', s); ST.log.unshift(new Date().toISOString().slice(11, 19) + ' ' + s); ST.log.length = Math.min(ST.log.length, 60); }

// ---------- HTTP
function req(method, path, body, cb) {
  const data = body ? new URLSearchParams(body).toString() : null;
  const r = https.request({ host: HOST, path, method, headers: Object.assign({ Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'ShashkaPRO-Monster/1.0' }, data ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } : {}) }, res => {
    let t = ''; res.on('data', d => t += d); res.on('end', () => { let j = null; try { j = JSON.parse(t); } catch (e) {} cb && cb(res.statusCode, j, t); });
  });
  r.on('error', e => cb && cb(0, null, String(e.message)));
  r.setTimeout(15000, () => r.destroy(new Error('timeout')));
  if (data) r.write(data);
  r.end();
}
const post = (p, b) => new Promise(res => req('POST', p, b, (s, j, t) => res({ s, j, t })));
const get = p => new Promise(res => req('GET', p, null, (s, j, t) => res({ s, j, t })));
// ndjson oqimi: har bir qator — alohida JSON; uzilsa qayta ulanadi
function stream(path, onObj, onEnd) {
  const r = https.get({ host: HOST, path, headers: { Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'ShashkaPRO-Monster/1.0' } }, res => {
    if (res.statusCode !== 200) { log('oqim xato', path, res.statusCode); res.resume(); return onEnd && onEnd(res.statusCode); }
    let buf = '';
    res.setEncoding('utf8');
    res.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line) { try { onObj(JSON.parse(line)); } catch (e) { log('xato', e.message); } } } });
    res.on('end', () => onEnd && onEnd(200));
    res.on('error', () => onEnd && onEnd(0));
  });
  r.on('error', () => onEnd && onEnd(0));
  return r;
}

// ---------- katak raqamlari
function locToRC(n) { const r = Math.floor((n - 1) / 4), k = (n - 1) % 4; return [r, r % 2 === 0 ? 2 * k + 1 : 2 * k]; }
function rcToLoc(r, c) { return r * 4 + Math.floor(c / 2) + 1; }
const two = n => (n < 10 ? '0' : '') + n;
function parseFen(fen) {   // "W:W21,22,K30:B1,2" → board, side
  if (!fen || fen === 'startpos') return { board: R.startPosition(), side: R.WHITE };
  const b = R.emptyBoard(), parts = String(fen).split(':');
  const side = /^B/i.test(parts[0]) ? R.BLACK : R.WHITE;
  for (const p of parts.slice(1)) {
    const col = p[0] === 'W' ? 'w' : p[0] === 'B' ? 'b' : null; if (!col) continue;
    p.slice(1).split(',').forEach(x => {
      x = x.trim(); if (!x) return;
      const king = /^K/i.test(x); if (king) x = x.slice(1);
      const put = (r, c) => { if (r >= 0 && r < 8 && c >= 0 && c < 8) b[r][c] = king ? col.toUpperCase() : col; };
      const al = /^([a-h])([1-8])$/i.exec(x);   // algebraik (a1, c3 …) ko'rinishidagi FEN
      if (al) return put(8 - Number(al[2]), al[1].toLowerCase().charCodeAt(0) - 97);
      const m = /^(\d+)(?:-(\d+))?$/.exec(x); if (!m) return;
      for (let n = +m[1]; n <= +(m[2] || m[1]); n++) { const [r, c] = locToRC(n); put(r, c); }
    });
  }
  return { board: b, side };
}
// "2823" yoki "282319" — ketma-ket qadamlar; urilgan dona olib tashlanadi
function applyToken(board, tok) {
  // lidraughts ko'p urishni shunday yuboradi: "111825 1825" — birinchi token to'liq yo'l, keyingilari qolgan qadamlar.
  // Shuning uchun har tokendan faqat BIRINCHI qadam olinadi (lidraughts-bot/pydraughts ham shunday qiladi).
  const sq = (tok.match(/\d\d/g) || []).map(Number).slice(0, 2); let wasCap = false, last = null;
  for (let i = 1; i < sq.length; i++) {
    const [fr, fc] = locToRC(sq[i - 1]), [tr, tc] = locToRC(sq[i]);
    let p = board[fr][fc]; if (!p) continue;
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    for (let r = fr + dr, c = fc + dc; r !== tr; r += dr, c += dc) if (board[r][c]) { board[r][c] = null; wasCap = true; }
    board[fr][fc] = null;
    if (p === 'w' && tr === 0) p = 'W'; if (p === 'b' && tr === 7) p = 'B';
    board[tr][tc] = p; last = [tr, tc];
  }
  return { wasCap, last };
}
function position(fen, moves) {
  let { board, side } = parseFen(fen);
  const toks = String(moves || '').trim().split(/\s+/).filter(Boolean);
  for (const t of toks) {
    const { wasCap, last } = applyToken(board, t);
    let more = false;
    if (wasCap && last) { try { more = R.allCaptures(board, side).some(m => m.from[0] === last[0] && m.from[1] === last[1]); } catch (e) {} }
    if (!more) side = side === R.WHITE ? R.BLACK : R.WHITE;
  }
  return { board, side, plies: toks.length };
}
function to64(b) { const o = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; o.push(p === 'w' ? 1 : p === 'W' ? 2 : p === 'b' ? -1 : p === 'B' ? -2 : 0); } return o; }
function engine(board, side, secs, room, maxTime) {
  return new Promise(async res => {
    for (let i = 0; i < 40; i++) {
      const r = await new Promise(rs => K.move({ board: to64(board), side: side === R.WHITE ? 1 : -1, time: secs, book: true, room, maxTime }, rs));
      if (r && !r.error) return res(r);
      if (r && (r.error === 'busy' || r.error === 'notready')) { await sleep(800); continue; }
      return res(null);
    }
    res(null);
  });
}

// ---------- o'yin
function playGame(id) {
  if (ST.games[id]) return;
  const G = ST.games[id] = { id, color: null, fen: null, busy: false, lastPlies: -1, opp: '?', started: Date.now() };
  let greeted = false;
  const think = async (state) => {
    G.last = state;
    if (G.busy || state.status && state.status !== 'started' && state.status !== 'created') return;
    const pos = position(G.fen, state.moves);
    if (pos.side !== G.color || pos.plies === G.lastPlies) return;
    const moves = R.getAllMoves(pos.board, pos.side); if (!moves.length) return;
    G.busy = true; G.lastPlies = pos.plies;
    try {
      let mv = moves[0];
      if (moves.length > 1) {
        const my = (G.color === R.WHITE ? state.wtime : state.btime) || 180000, inc = (G.color === R.WHITE ? state.winc : state.binc) || 0;
        const secs = Math.max(0.3, Math.min(Number(process.env.LIDRAUGHTS_MAXSEC || 20), my / 1000 / 20 + inc / 1000 * 0.8));   // uzoq nazoratda chuqurroq o'ylaydi
        const t0 = Date.now();
        const r = await engine(pos.board, pos.side, secs, 'ld_' + id, Math.max(0.5, my / 1000 / 12));
        log('yurish hisoblandi', id, '#' + pos.plies, ((Date.now() - t0) / 1000).toFixed(1) + 's', '| soat:', Math.round(my / 1000) + 's', r ? (r.cached ? '(xotira)' : r.book ? '(kitob)' : r.deep ? '(saboq)' : '') : '(dvigatel javob bermadi)');
        if (r) {
          const fr = r.from >> 3, fc = r.from & 7, tr = r.to >> 3, tc = r.to & 7;
          const c = moves.filter(m => m.from[0] === fr && m.from[1] === fc && m.to[0] === tr && m.to[1] === tc);
          mv = c.find(m => (m.captures || []).length === r.jumps) || c[0] || mv;
        }
      }
      const pts = [mv.from].concat(mv.path && mv.path.length ? mv.path : [mv.to]);
      for (let i = 1; i < pts.length; i++) {
        const part = two(rcToLoc(pts[i - 1][0], pts[i - 1][1])) + two(rcToLoc(pts[i][0], pts[i][1]));
        let x = await post('/api/bot/game/' + id + '/move/' + part);
        for (let t = 0; t < 4 && (x.s === 0 || x.s >= 500 || x.s === 429); t++) { await sleep(1500 * (t + 1)); x = await post('/api/bot/game/' + id + '/move/' + part); }   // tarmoq uzilsa — qayta yuboramiz
        if (x.s !== 200) { log('yurish rad etildi', id, part, x.s, (x.t || '').slice(0, 120), '| fen:', String(G.fen).slice(0, 90), '| moves:', String(state.moves || '').slice(-80)); G.lastPlies = -1; break; }
      }
    } catch (e) { log('xato', e.message); }
    G.busy = false;
    if (G.lastPlies === -1 && !G.done && G.last && (G.rej = (G.rej || 0) + 1) <= 5) setTimeout(() => think(G.last), 2000);
    else if (G.lastPlies !== -1) G.rej = 0;   // rad etildi — holatni qayta tekshirib, yana urinamiz
  };
  const onEnd = (state) => {
    if (G.done) return; G.done = true;
    const w = state && state.winner, res = !w ? 'durang' : (w === G.color ? 'G‘ALABA' : 'mag‘lubiyat');
    ST.results.unshift({ id, opp: G.opp, res, at: Date.now(), url: 'https://lidraughts.org/' + id });
    ST.results.length = Math.min(ST.results.length, 50);
    log('o‘yin tugadi', id, 'vs', G.opp, '→', res, '| sabab:', state && state.status, '| yurishlar:', String(state && state.moves || '').split(' ').filter(Boolean).length);
    if (w && w !== G.color && !/outoftime|timeout|noStart|aborted/i.test(String(state && state.status))) { try { K.learn('ld_' + id); } catch (e) {} }   // yurish bilan yutqazdi — saboq oladi (vaqt bo'yicha emas)
  };
  stream('/api/bot/game/stream/' + id, async o => {
    if (o.type === 'gameFull') {
      G.color = o.white && ST.me && String(o.white.id).toLowerCase() === ST.me ? R.WHITE : R.BLACK;
      G.fen = o.initialFen || 'startpos';
      log('fen:', String(G.fen).slice(0, 120), '| variant:', o.variant && (o.variant.key || o.variant.name));
      G.opp = (G.color === R.WHITE ? o.black : o.white) || {}; G.opp = G.opp.name || G.opp.id || '?';
      log('o‘yin boshlandi', id, G.color, 'vs', G.opp);
      if (!greeted) { greeted = true; post('/api/bot/game/' + id + '/chat', { room: 'player', text: '👹 ShashkaPRO Monster — omad! Rus shashkasi: t.me/DraughtsPRObot' }); }
      if (o.state) { if (o.state.status && o.state.status !== 'started' && o.state.status !== 'created') onEnd(o.state); else think(o.state); }
    } else if (o.type === 'gameState') {
      if (o.status && o.status !== 'started' && o.status !== 'created') onEnd(o); else think(o);
    }
  }, () => { delete ST.games[id]; });
}

// ---------- hodisalar va chaqiruvlar
function events() {
  stream('/api/stream/event', async o => {
    if (o.type === 'challenge') {
      const c = o.challenge || {}, v = c.variant && c.variant.key, sp = c.speed;
      if (c.challenger && ST.me && String(c.challenger.id).toLowerCase() === ST.me) return;   // o'zimizning chaqiruvimiz
      let why = null;
      if (v !== 'russian') why = 'variant';
      else if (sp === 'correspondence') why = 'timeControl';
      else if (Object.keys(ST.games).length >= MAX_GAMES) why = 'later';
      if (why) { post('/api/challenge/' + c.id + '/decline', { reason: why }); log('chaqiruv rad etildi', c.id, why); }
      else { const x = await post('/api/challenge/' + c.id + '/accept'); log('chaqiruv qabul qilindi', c.id, c.challenger && c.challenger.name, x.s); }
    } else if (o.type === 'gameStart') {
      playGame(o.game && (o.game.id || o.game.gameId));
    }
  }, async () => { await sleep(5000); events(); });
}
async function autoChallenge() {
  if (process.env.LIDRAUGHTS_AUTO !== '1') return;
  const targets = String(process.env.LIDRAUGHTS_TARGETS || 'RipeCherry,Adder,coletteBOT').split(',').map(s => s.trim()).filter(Boolean);
  const [lim, inc] = String(process.env.LIDRAUGHTS_TC || '3+2').split('+').map(Number);
  let i = 0;
  for (;;) {
    await sleep(4 * 60 * 1000);
    if (Object.keys(ST.games).length) continue;
    // faqat hozir onlayn bo'lgan botlarni chaqiramiz
    let online = targets;
    try { const st = await get('/api/users/status?ids=' + encodeURIComponent(targets.join(','))); if (st.s === 200 && Array.isArray(st.j)) online = targets.filter(t => st.j.some(u => String(u.id || u.name).toLowerCase() === t.toLowerCase() && u.online)); } catch (e) {}
    if (!online.length) { if (!(i++ % 6)) log('hech qaysi bot onlayn emas:', targets.join(', ')); continue; }
    const who = online[i++ % online.length];
    const x = await post('/api/challenge/' + who, { rated: process.env.LIDRAUGHTS_RATED === '0' ? 'false' : 'true', 'clock.limit': String((lim || 3) * 60), 'clock.increment': String(inc || 0), variant: 'russian', color: 'random' });
    log('chaqiruv yuborildi →', who, x.s, x.s === 200 ? '' : (x.t || '').slice(0, 100));
  }
}
async function start() {
  if (!TOKEN || ST.on) return;
  ST.on = true;
  await sleep(8000);   // dvigatel tayyor bo'lsin
  const a = await get('/api/account');
  if (a.s !== 200 || !a.j) { log('token xato yoki lidraughts javob bermadi:', a.s); ST.on = false; return; }
  ST.me = String(a.j.id || a.j.username || '').toLowerCase();
  log('ulandi:', a.j.username, a.j.title ? '(' + a.j.title + ')' : '');
  events();
  autoChallenge();
  // Render bepul tarifida server uxlab qolmasligi uchun (bot onlayn tursin)
  const base = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || '';
  if (base) setInterval(() => { try { https.get(base.replace(/\/$/, '') + '/api/auth/config', r => r.resume()).on('error', () => {}); } catch (e) {} }, 10 * 60 * 1000).unref();
}
function status() { return { on: ST.on, me: ST.me, games: Object.values(ST.games).map(g => ({ id: g.id, opp: g.opp, color: g.color })), results: ST.results.slice(0, 20), log: ST.log.slice(0, 30) }; }
async function challenge(user, tc, rated) {
  const [lim, inc] = String(tc || '3+2').split('+').map(Number);
  return post('/api/challenge/' + encodeURIComponent(user), { rated: rated ? 'true' : 'false', 'clock.limit': String((lim || 3) * 60), 'clock.increment': String(inc || 0), variant: 'russian', color: 'random' });
}
start();
module.exports = { status, challenge, _t: { locToRC, rcToLoc, parseFen, position } };
