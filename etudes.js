'use strict';
// etudes.js — ♔ Etyudlar (L.S. Vitoshkin, «Этюды в русские шашки», 1–5 qismlar).
// Har etyud King Kongga qarshi yechiladi: istalgan to'g'ri yo'l qabul qilinadi.
// Endshpil bazasi (≤4 dona): yutuq boy berilsa — darhol "yechilmadi"; durang etyudida bazadagi durang — "yechildi". Yutish etyudi oxirigacha o'ynaladi.
const fs = require('fs'), path = require('path');
let DATA = null, BYID = null;
function load() {
  if (DATA) return DATA;
  try { DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'etudes.json'), 'utf8')); } catch (e) { DATA = { list: [] }; }
  BYID = new Map(DATA.list.map(e => [e.id, e]));
  return DATA;
}
function get(id) { load(); return BYID.get(String(id)) || null; }
// 32 belgili satr (qora kataklar r=0..7 tartibida): w/b — oddiy, W/B — damka, '.' — bo'sh
function board64(s) {
  const b = Array(64).fill(0); let k = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2 !== 1) continue;
    const ch = s[k++]; b[r * 8 + c] = ch === 'w' ? 1 : ch === 'W' ? 2 : ch === 'b' ? -1 : ch === 'B' ? -2 : 0;
  }
  return b;
}
function fromRoom(room) {
  const b = Array(64).fill(0), d = room.dr && room.dr.b; if (!d) return null;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = d[r][c]; b[r * 8 + c] = p === 'w' ? 1 : p === 'W' ? 2 : p === 'b' ? -1 : p === 'B' ? -2 : 0; }
  return b;
}
// har yurishdan keyin: endshpil bazasiga tushdimi — natijani hal qilamiz
function check(room) {
  const b = fromRoom(room); if (!b) return null;
  const n = b.filter(v => v).length; if (n > 4) return null;
  const side = room.turn === 'white' ? 1 : -1;
  let v = null; try { v = require('./tbprobe.js').value(b, side); } catch (e) {}
  if (v == null) return null;
  const toMoveWins = v >= 1 && v <= 127, toMoveLoses = v >= 128 && v <= 254;
  const white = side === 1 ? (toMoveWins ? 'win' : toMoveLoses ? 'loss' : 'draw') : (toMoveLoses ? 'win' : toMoveWins ? 'loss' : 'draw');
  const goal = room.etude.goal;
  // yutish etyudi: yutuq saqlanib tursa — o'yin davom etadi (oxirigacha o'ynab ko'rsatish kerak); yutuq boy berilsa — darhol "yechilmadi"
  if (goal !== 'draw') return white === 'win' ? null : { winner: 'black', reason: 'etude_fail' };
  // durang etyudi: bazada durang (yoki yaxshiroq) — yechildi
  return white === 'loss' ? { winner: 'black', reason: 'etude_fail' } : { winner: 'draw', reason: 'etude' };
}
// o'yin tugadi: yechilgan bo'lsa — birinchi marta +15 🪙
function done(room, winner) {
  const e = room.etude; if (!e) return;
  const ok = winner === 'white' || (e.goal === 'draw' && winner === 'draw');
  const human = room.white && room.white.uid; if (!human || String(human).indexOf('bot') === 0) return;
  const st = require('./store.js'), u = st.users()[String(human)]; if (!u) return;
  u.et = u.et || { s: [] };
  if (ok && !u.et.s.includes(e.id)) {
    u.et.s.push(e.id); u.diamonds = (u.diamonds || 0) + 15; st.save();
    try { require('./quests.js').bump(human, 'puzzle'); } catch (er) {}
    room.etude.gain = 15;
  }
}
// 🦍 King Kong bilimi: kitobdagi yechimlardagi qora javoblari (muallif ko'rsatgan eng kuchli himoya)
let EB = null;
function buildBook() {
  EB = new Map(); const R = require('./kkrules.js');
  for (const e of load().list) {
    if (!e.sol) continue;
    for (const ln of e.sol) {
      let b = board64(e.b), side = 1;
      for (const mv of (ln.m || [])) {
        const ms = R.moves(b, side), m = ms.find(x => x.from === mv[0] && x.to === mv[mv.length - 1] && x.path.join() === mv.slice(1).join());
        if (!m) break;
        if (side === -1) { const k = b.join('') + side; if (!EB.has(k)) EB.set(k, { from: m.from, to: m.to }); }
        b = m.board; side = -side;
      }
    }
  }
  return EB;
}
function bookMove(b, side) { if (side !== -1) return null; if (!EB) buildBook(); return EB.get(b.join('') + side) || null; }
// HTTP: GET /api/etudes/list — ro'yxat (kesh bilan); GET /api/etudes/me — yechilganlar (x-init-data)
let LISTJ = null;
// ♔ kitobdagidan boshqa yurish: natija saqlansa (yutuq / durang) — qabul qilinadi, qora javobini baza yoki dvigatel beradi
const cntP = b => b.filter(v => v).length;
function tbRes(b, side) {   // oq nuqtai nazaridan
  let v = null; try { v = require('./tbprobe.js').value(b, side); } catch (e) {}
  if (v == null || v === 255) return null;
  const w = v >= 1 && v <= 127, l = v >= 128 && v <= 254;
  return side === 1 ? (w ? 'win' : l ? 'loss' : 'draw') : (l ? 'win' : w ? 'loss' : 'draw');
}
const engMove = (b, side, t) => new Promise(r => { try { require('./kestoai.js').move({ board: b, side, time: t, book: false }, r); } catch (e) { r({ error: 'eng' }); } });
let JBUSY = 0;
async function judge(e, b, path, n) {
  const R = require('./kkrules.js'), goal = e.g === 'd' ? 'd' : 'w';
  const m = R.moves(b, 1).find(x => x.from === path[0] && x.path.join() === path.slice(1).join());
  if (!m) return { keep: false, why: 'illegal' };
  const a = m.board, bm = R.moves(a, -1);
  if (!a.some(v => v < 0) || !bm.length) return { keep: true, solved: true };
  const pack = mm => [mm.from].concat(mm.path);
  if (cntP(a) <= 4) {
    const r = tbRes(a, -1);
    if (r) {
      const keep = goal === 'w' ? r === 'win' : r !== 'loss';
      if (!keep) return { keep: false, why: r };
      if (goal === 'd' || (n >= 40)) return { keep: true, solved: true };
      const t = require('./tbprobe.js').best(a, -1), rm = t && bm.find(x => x.from === t.from && x.to === t.to);
      return { keep: true, reply: pack(rm || bm[0]) };
    }
  }
  // ko'p dona: dvigatel bilan solishtiramiz (foydalanuvchi yurishi kitobdagi / dvigatel yurishidan yomon bo'lmasligi kerak)
  if (JBUSY >= 3) return { keep: false, why: 'busy' };
  JBUSY++;
  try {
    const w0 = await engMove(b, 1, 1.2);
    const bestM = w0 && !w0.error ? R.moves(b, 1).find(x => x.from === w0.from && x.to === w0.to) : null;
    const rU = await engMove(a, -1, 1.2);
    if (!rU || rU.error) return { keep: false, why: 'eng' };
    let ok = bestM && bestM.from === m.from && bestM.to === m.to;
    if (!ok && bestM) { const rB = await engMove(bestM.board, -1, 1.2); if (rB && !rB.error && rU.ev != null && rB.ev != null) ok = rU.ev <= rB.ev + 40 && (goal === 'd' ? rU.ev < 300 : rU.ev < -150); }
    if (!ok) return { keep: false, why: 'worse' };
    if (goal === 'd' && n >= 30) return { keep: true, solved: true };
    const rm = bm.find(x => x.from === rU.from && x.to === rU.to) || bm[0];
    if (!R.moves(rm.board, 1).length || !rm.board.some(v => v > 0)) return { keep: false, why: 'lost' };
    return { keep: true, reply: pack(rm) };
  } finally { JBUSY--; }
}
function handle(req, res, p, ctx) {
  if (p === '/api/etudes/judge' && req.method === 'POST') {
    const tg = ctx.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { ctx.send(res, 401, { error: 'auth' }); return true; }
    let body = ''; req.on('data', d => { body += d; if (body.length > 5000) req.destroy(); });
    req.on('end', () => {
      let j = {}; try { j = JSON.parse(body); } catch (er) {}
      const e = get(String(j.id || '').replace(/^et/, ''));
      const b = j.b, path = j.path;
      if (!e || !Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2) || !Array.isArray(path) || path.length < 2 || !path.every(v => Number.isInteger(v) && v >= 0 && v < 64)) return ctx.send(res, 400, { error: 'bad' });
      judge(e, b, path, Number(j.n) || 0).then(r => ctx.send(res, 200, Object.assign({ ok: true }, r)), () => ctx.send(res, 200, { ok: true, keep: false, why: 'err' }));
    });
    return true;
  }
  if (req.method !== 'GET') return false;
  if (p === '/api/etudes/list') {
    if (!LISTJ) { const d = load(); LISTJ = JSON.stringify({ ok: true, src: d.src || '', list: d.list.map(e => [e.id, e.n, e.part, e.a || '', e.g || 'w', e.b, e.sol ? 1 : 0]) }); }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }); res.end(LISTJ); return true;
  }
  if (p === '/api/etudes/me') {
    const tg = ctx.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    ctx.send(res, 200, { ok: true, s: tg ? solved(tg.id) : [] }); return true;
  }
  if (p.startsWith('/api/etudes/pz/')) {   // masala formatidagi yechimlar
    const sols = puzzleSols(decodeURIComponent(p.slice(15)));
    ctx.send(res, sols ? 200 : 404, sols ? { ok: true, sols } : { ok: false }); return true;
  }
  if (p.startsWith('/api/etudes/sol/')) {   // yechim yo'llari (bitta etyud)
    const e = get(decodeURIComponent(p.slice(16)));
    ctx.send(res, e ? 200 : 404, e ? { ok: true, sol: e.sol || null } : { ok: false }); return true;
  }
  return false;
}
// 🧩 Masalalar bo'limi uchun: har kitob — alohida papka ("Etyudlar · 1-kitob"), etyud — oddiy masala kabi yechiladi
// kitoblar: 1–5 — Vitoshkin etyudlari, 6 — Ustyanov "Сокровища малого миттельшпиля", 7 — Ustyanov "Харьковская школа"
const BOOKS = { 6: { f: 'Ustyanov · Kichik mittelshpil xazinalari', p: 'Masala' }, 7: { f: 'Ustyanov · Xarkov kompozitsiya maktabi', p: 'Masala' } };
const FOLDER = part => (BOOKS[part] && BOOKS[part].f) || 'Etyudlar · ' + part + '-kitob';
const PRE = part => (BOOKS[part] && BOOKS[part].p) || 'Etyud';
const FOLDERS = [6, 7, 1, 2, 3, 4, 5].map(FOLDER);
const ETF = {}, ETP = {}; [1, 2, 3, 4, 5, 6, 7].forEach(k => { ETF[k] = FOLDER(k); ETP[k] = PRE(k); });
let PZL = null;
function lvl(e) { const m = e.sol && e.sol[0] && e.sol[0].m || []; const w = Math.ceil(m.length / 2); return w <= 3 ? 1 : w <= 6 ? 2 : 3; }
function puzzleList() {
  if (PZL) return PZL;
  PZL = load().list.filter(e => e.sol && e.sol.length).map(e => ({ id: 'et' + e.id, no: e.n, t: (e.a || '') + (e.g === 'd' ? ' (durang)' : ''), title: PRE(e.part) + ' ' + e.n + (e.a ? ' · ' + e.a : '') + (e.g === 'd' ? ' (durang)' : ''), level: lvl(e), side: 'w', b32: e.b, et: 1, folder: FOLDER(e.part) }));
  return PZL;
}
function asPuzzle(id) { id = String(id || ''); if (id.indexOf('et') !== 0) return null; const e = get(id.slice(2)); return e && e.sol ? { id, folder: FOLDER(e.part), title: PRE(e.part) + ' ' + e.n, et: 1 } : null; }
// yechim yo'llari masala formatida: [[r1,c1,r2,c2], ...] (har sakrash alohida)
function puzzleSols(id) {
  const e = get(String(id || '').replace(/^et/, '')); if (!e || !e.sol) return null;
  return e.sol.map(l => { const out = []; (l.m || []).forEach(mv => { for (let i = 1; i < mv.length; i++) out.push([mv[i - 1] >> 3, mv[i - 1] & 7, mv[i] >> 3, mv[i] & 7]); }); return out; }).filter(x => x.length);
}
function solved(uid) { const u = require('./store.js').users()[String(uid)]; return (u && u.et && u.et.s) || []; }
module.exports = { load, get, board64, check, done, solved, handle, bookMove, FOLDERS, ETF, ETP, puzzleList, asPuzzle, puzzleSols };
