'use strict';
// kkfix.js — 🦍 King Kong o'zini tuzatadi: xatolar → tuzatish takliflari (admin bir bosishda tasdiqlaydi yoki avto-tuzatish).
// Manbalar: o'yin tahlili (kkadm: dona yo'qotgan yurishlar), 🌙 tungi chuqur tahlil (dvigatel bahosi tushgan yurishlar),
// 🤖 tungi sinov o'yinlari (King Kong ↔ dvigatel). Har taklifga dvigatel 15 s o'ylab to'g'ri yurish tanlaydi (faqat server bo'sh paytda).
// ☀️ Har kuni 08:00 da adminlarga hisobot. Kunlik aniqlik va debyut statistikasi ham shu yerda.
const store = require('./store.js');
const R = require('./kkrules.js');
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const D = () => store.db;
const FX = () => { D().kkFix = D().kkFix || []; return D().kkFix; };
const DAY = t => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 10);
const HOUR = () => new Date(Date.now() + 5 * 3600e3).getUTCHours();
const mtxt = (b, s, from, to) => { const m = R.moves(b, s).find(x => x.from === from && x.to === to); return m ? [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps.length ? ':' : '-') : SQ(from) + '-' + SQ(to); };
const kadm = () => require('./kkadm.js');

// ---------- takliflar
// add({b, s, from, to, loss, line, gid, opp, src:'oyin'|'tun'|'sinov', drop})
function add(o) {
  const key = o.b.join('') + o.s, L = FX();
  if ((D().kkBook || {})[key]) return null;   // allaqachon o'rgatilgan
  let x = L.find(f => f.key === key);
  if (x) {
    if (o.opp && x.opps.indexOf(o.opp) < 0) { x.opps.push(o.opp); if (x.opps.length > 12) x.opps.shift(); }
    x.hits++; x.last = Date.now(); if (x.st === 'skip' && x.hits >= 3) x.st = 'new';   // takrorlansa — qayta ko'rsatamiz
    return x;
  }
  x = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), key, b: o.b.join(','), s: o.s, from: o.from, to: o.to, t: mtxt(o.b, o.s, o.from, o.to), loss: o.loss || 0, drop: o.drop || 0, line: (o.line || []).slice(0, 6), src: o.src || 'oyin', gid: o.gid || '', opps: o.opp ? [o.opp] : [], hits: 1, at: Date.now(), last: Date.now(), st: 'new', best: null };
  L.unshift(x); if (L.length > 400) L.length = 400;
  store.save(); kick();
  return x;
}
const board = x => x.b.split(',').map(Number);
function pending() { const B = D().kkBook || {}; return FX().filter(x => x.st === 'new' && !B[x.key]); }

// ---------- dvigatel (past navbat: o'yinlarga xalaqit bermaydi)
const ask1 = (b, s, secs, extra) => new Promise(res => { try { require('./kestoai.js').move(Object.assign({ board: b, side: s, time: secs, maxTime: secs, book: false, arena: true }, extra || {}), r => res(r)); } catch (e) { res(null); } });
async function ask(b, s, secs, extra) { for (let t = 0; t < 40; t++) { const r = await ask1(b, s, secs, extra); if (!(r && r.error === 'busy')) return r; await sleep(3000); } return null; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
function idle() {
  try { const q = require('./kestoai.js').qstat(); if (q.queue > 0) return false; } catch (e) {}
  try { const h = require('./cpustat.js').hist(), r = h[h.length - 1]; if (r && (r.all >= 55 || r.lag >= 150)) return false; } catch (e) {}
  return true;
}
// taklif uchun to'g'ri yurish: dvigatel 15 s + qo'riqchi tekshiruvi
async function resolve(x) {
  const b = board(x), s = x.s, r = await ask(b, s, 15);
  if (!r || r.from == null) return false;
  let safe = true; try { const c = kadm().check(b, s, r.from, r.to); safe = !c || c.loss < 1; } catch (e) {}
  x.best = { from: r.from, to: r.to, t: mtxt(b, s, r.from, r.to), ev: r.ev == null ? null : Math.round(r.ev) / 230, safe, same: r.from === x.from && r.to === x.to };
  // played yurish bahosi (taqqoslash uchun)
  try { const m = R.moves(b, s).find(y => y.from === x.from && y.to === x.to); if (m && R.moves(m.board, -s).length) { const a = await ask(m.board, -s, 3); if (a && a.ev != null) x.playedEv = Math.round(-a.ev) / 230; } } catch (e) {}
  if (x.best.same) x.st = 'doubt';   // dvigatel ham shu yurishni tanladi — ko'rsatamiz, lekin avtomatik o'rgatmaymiz
  else if (D().kkAuto && x.best.safe && (x.loss >= 1 || x.drop >= 1.5)) {
    try { const k = require('./kkbook.js'); if (k.addAuto && k.addAuto(b, s, r.from, r.to)) { x.st = 'auto'; x.done = Date.now(); D().kkAutoN = (D().kkAutoN || 0) + 1; } } catch (e) {}
  }
  store.save(); return true;
}

// ---------- 🌙 tungi chuqur tahlil: dona yo'qotmasa ham bahosi keskin tushgan yurishlar
async function deepGame(g) {
  const fm = kadm().movesOf(g); let n = 0;
  for (let k = 0; k < fm.length; k++) {
    const x = fm[k]; if (x.s !== g.kk) continue;
    const L = R.moves(x.b, x.s); if (L.length < 2) continue;
    if ((g.errs || []).some(e => e.k === k)) continue;   // moddiy xato allaqachon bor
    if (!nightOk()) return false;
    const best = await ask(x.b, x.s, 4); if (!best || best.from == null || best.ev == null) continue;
    if (best.from === x.from && best.to === x.to) continue;
    const m = L.find(y => y.from === x.from && y.to === x.to); if (!m || !R.moves(m.board, -x.s).length) continue;
    const a = await ask(m.board, -x.s, 4); if (!a || a.ev == null) continue;
    const drop = (best.ev + a.ev) / 230;   // eng yaxshi − o'ynalgan (dona birligida)
    if (drop >= 1 && best.ev > -1500) { add({ b: x.b, s: x.s, from: x.from, to: x.to, drop: Math.round(drop * 10) / 10, gid: g.id, opp: g.opp, src: 'tun' }); n++; }
  }
  g.deep = Date.now(); store.save(); return n;
}

// ---------- 🤖 sinov o'yinlari: King Kong (haqiqiy sozlamalar) ↔ dvigatel, tasodifiy debyut
function initB() { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; } return b; }
const mat = b => b.reduce((t, v) => t + (v > 0 ? (v === 2 ? 3 : 1) : v < 0 ? -(v === -2 ? 3 : 1) : 0), 0);
async function spar() {
  const kk = Math.random() < 0.5 ? 1 : -1, id = 'spar_' + Date.now().toString(36);
  let b = initB(), s = 1; const hist = [];
  for (let i = 0; i < 4; i++) { const L = R.moves(b, s); const m = L[Math.floor(Math.random() * L.length)]; hist.push({ b: b.slice(), s, from: m.from, to: m.to }); b = m.board; s = -s; }
  let res = null, rep = new Map();
  for (let ply = 0; ply < 140; ply++) {
    if (!nightOk()) return null;
    const L = R.moves(b, s); if (!L.length) { res = s === kk ? 'l' : 'w'; break; }
    const k = b.join('') + s; rep.set(k, (rep.get(k) || 0) + 1); if (rep.get(k) >= 3) { res = 'd'; break; }
    let m = L.length === 1 ? L[0] : null;
    if (!m) {
      const r = s === kk ? await ask(b, s, 1, { kk: true, book: true, room: id, tbAlways: true, arena: false }) : await ask(b, s, 1, { tbAlways: true });
      m = r && L.find(y => y.from === r.from && y.to === r.to); if (!m) m = L[0];
    }
    hist.push({ b: b.slice(), s, from: m.from, to: m.to }); b = m.board; s = -s;
  }
  if (!res) { const d = mat(b) * kk; res = d >= 2 ? 'w' : d <= -2 ? 'l' : 'd'; }
  let errs = 0;
  for (const x of hist.slice(4)) {
    if (x.s !== kk) continue;
    try { const c = kadm().check(x.b, x.s, x.from, x.to); if (c && c.loss >= 1) { errs++; add({ b: x.b, s: x.s, from: x.from, to: x.to, loss: c.loss, line: c.line, gid: id, src: 'sinov' }); } } catch (e) {}
  }
  const SP = D().kkSpar = D().kkSpar || []; SP.unshift({ at: Date.now(), kk, res, plies: hist.length, errs }); if (SP.length > 40) SP.length = 40;
  store.save(); return res;
}

// ---------- 📊 kunlik aniqlik va debyutlar (kkadm.record / analyze dan)
function dayAdd(t, f) { const M = D().kkDay = D().kkDay || {}, k = DAY(t), o = M[k] || (M[k] = { n: 0, w: 0, l: 0, d: 0, mv: 0, err: 0 }); f(o); const ks = Object.keys(M).sort(); while (ks.length > 60) delete M[ks.shift()]; }
function onRecord(g) {
  dayAdd(g.at, o => { o.n++; o[g.res] = (o[g.res] || 0) + 1; });
  if (g.op) { const O = D().kkOpen = D().kkOpen || {}, o = O[g.op] || (O[g.op] = { w: 0, l: 0, d: 0 }); o[g.res]++; const ks = Object.keys(O); if (ks.length > 600) { ks.sort((a, b) => (O[a].w + O[a].l + O[a].d) - (O[b].w + O[b].l + O[b].d)).slice(0, 100).forEach(k => delete O[k]); } }
}
function onAnalyzed(g, kkMoves) {
  if (g.dayDone) return; g.dayDone = 1;
  dayAdd(g.at, o => { o.mv += kkMoves; o.err += (g.errs || []).length; });
  (g.errs || []).forEach(e => { const x = kadm().movesOf(g)[e.k]; if (x) add({ b: x.b, s: x.s, from: x.from, to: x.to, loss: e.loss, line: e.line, gid: g.id, opp: g.opp, src: 'oyin' }); });
}

// ---------- ishchi: bo'sh paytda takliflarni yechadi; kechasi chuqur tahlil va sinov; ertalab hisobot
const nightOk = () => { const h = HOUR(); return h >= 1 && h < 7 && idle(); };
let working = false, kickT = null;
function kick() { if (!kickT) kickT = setTimeout(() => { kickT = null; work(); }, 20e3); }
async function work() {
  if (working) return; working = true;
  try {
    for (let i = 0; i < 6; i++) {   // bir aylanishda ko'pi bilan 6 ta taklif
      const x = FX().find(f => f.st === 'new' && !f.best); if (!x || !idle()) break;
      await resolve(x);
    }
    if (nightOk()) {
      const N = D().kkNight = D().kkNight || {}, day = DAY();
      if (N.day !== day) { N.day = day; N.deep = 0; N.spar = 0; }
      const g = (D().kkGames || []).find(x => x.res !== 'w' && !x.deep && x.errs && Date.now() - x.at < 36 * 3600e3);
      if (g && N.deep < 25) { N.deep++; await deepGame(g); }
      else if (N.spar < 4) { N.spar++; await spar(); }
      store.save();
    }
  } catch (e) { console.log('[kkfix]', e.message); }
  working = false;
}
function morning() {
  const day = DAY(); if (HOUR() < 8 || D().kkMorning === day) return;
  D().kkMorning = day; store.save();
  const y = DAY(Date.now() - 864e5), o = (D().kkDay || {})[y] || { n: 0, w: 0, l: 0, d: 0, mv: 0, err: 0 }, P = pending().length;
  const acc = o.mv ? Math.round(100 - o.err * 100 / o.mv) : null, auto = FX().filter(x => x.st === 'auto' && x.done && Date.now() - x.done < 864e5).length;
  const sp = (D().kkSpar || []).filter(x => Date.now() - x.at < 864e5);
  let t = '☀️ <b>King Kong — kechagi hisobot</b>\n' + o.n + ' o‘yin: ✅ ' + o.w + ' · ❌ ' + o.l + ' · 🤝 ' + o.d + (acc != null ? '\n🎯 Aniqlik: <b>' + acc + '%</b>' : '');
  if (sp.length) t += '\n🤖 Sinov o‘yinlari: ' + sp.length + ' ta (' + sp.filter(x => x.res === 'w').length + ' yutuq)';
  if (auto) t += '\n🤖 Avto-tuzatildi: ' + auto + ' ta';
  t += '\n\n⚡ <b>' + P + ' ta tuzatish</b> sizni kutyapti';
  const base = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
  const kb = base && P ? { inline_keyboard: [[{ text: '👀 Ko‘rib chiqish (' + P + ')', web_app: { url: base + '/?kk=fix' } }]] } : undefined;
  if (o.n || P) for (const a of ADM()) tg('sendMessage', Object.assign({ chat_id: a, text: t, parse_mode: 'HTML' }, kb ? { reply_markup: kb } : {}));
}
let started = false;
function start() {
  if (started) return; started = true;
  setInterval(() => { work(); try { morning(); } catch (e) {} }, 2 * 60e3).unref();
}

// ---------- HTTP (kkadm.handle dan, admin tekshirilgan)
function view(x) {
  let line = x.line || [];
  return { id: x.id, b: board(x), s: x.s, from: x.from, to: x.to, t: x.t, loss: x.loss, drop: x.drop, line, src: x.src, hits: x.hits, opps: x.opps.length, at: x.at, st: x.st, best: x.best, playedEv: x.playedEv == null ? null : x.playedEv };
}
function summary() {
  const P = pending();
  const days = Object.entries(D().kkDay || {}).sort().slice(-30).map(([k, o]) => ({ d: k.slice(5), n: o.n, w: o.w, l: o.l, dr: o.d, acc: o.mv ? Math.round(1000 - o.err * 1000 / o.mv) / 10 : null }));
  const O = D().kkOpen || {}, ops = Object.entries(O).map(([k, o]) => ({ k, w: o.w, l: o.l, d: o.d, n: o.w + o.l + o.d })).filter(x => x.n >= 2).sort((a, b) => (b.l / b.n) - (a.l / a.n) || b.n - a.n).slice(0, 15);
  return { fix: { pending: P.length, ready: P.filter(x => x.best).length, auto: !!D().kkAuto, autoN: D().kkAutoN || 0 }, days, ops, spar: (D().kkSpar || []).slice(0, 10) };
}
async function http(p, j, res, h, adminId) {
  if (p === '/api/kkadm/fixes') {
    const P = pending().sort((a, b) => (b.hits - a.hits) || (b.loss - a.loss) || (b.at - a.at)).slice(0, 60);
    const doubt = FX().filter(x => x.st === 'doubt').slice(0, 20);
    return h.send(res, 200, { list: P.map(view), doubt: doubt.map(view) });
  }
  if (p === '/api/kkadm/fix') {
    const x = FX().find(f => f.id === String(j.id)); if (!x) return h.send(res, 404, { error: 'Topilmadi' });
    if (j.act === 'skip') { x.st = 'skip'; store.save(); return h.send(res, 200, { ok: true }); }
    const from = j.from != null ? +j.from : x.best && x.best.from, to = j.to != null ? +j.to : x.best && x.best.to;
    if (from == null) return h.send(res, 400, { error: 'To‘g‘ri yurish hali tayyor emas' });
    const k = require('./kkbook.js'), r = k.addAuto(board(x), x.s, from, to, adminId);
    if (!r) return h.send(res, 400, { error: 'Noto‘g‘ri yurish' });
    x.st = 'ok'; x.done = Date.now(); store.save();
    return h.send(res, 200, { ok: true, n: r.n });
  }
  if (p === '/api/kkadm/auto') { D().kkAuto = !!j.v; store.save(); return h.send(res, 200, { ok: true, auto: D().kkAuto }); }
  return false;
}
module.exports = { add, start, onRecord, onAnalyzed, summary, http, pending, work };
