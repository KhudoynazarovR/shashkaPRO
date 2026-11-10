'use strict';
// corr.js — 📮 Yozishma o'yinlari: har yurishga 12 soat / 1 kun / 3 kun. O'yinlar bazada saqlanadi (server qayta ishga tushsa ham davom etadi).
// Raqib yursa — bot xabar beradi; vaqt tugashiga 3 soat qolganda eslatma; o'z vaqtida yurmagan yutqazadi.
// Alohida reyting (📮 Yozishma ELO). Bir vaqtda 10 tagacha o'yin.
const store = require('./store.js');
const R = require('./kkrules.js');
const PERS = { 12: 12 * 3600e3, 24: 24 * 3600e3, 72: 72 * 3600e3 };
const MAXG = 10, K = 32, NOCAP = 60, REMIND = 3 * 3600e3;
const users = () => store.users();
const db = () => { const d = store.db; d.corr = d.corr || { g: {}, seeks: {} }; return d.corr; };
const nm = uid => String(((users()[uid] || {}).name) || 'O‘yinchi').slice(0, 24);
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hex = n => require('crypto').randomBytes(n).toString('hex');
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
const appLink = () => (process.env.TG_APP_LINK || process.env.APP_LINK || 'https://t.me/DraughtsPRObot/play').replace(/\/$/, '');
const dm = (uid, text, gid) => /^\d+$/.test(String(uid)) && tg('sendMessage', { _cat: 'game', chat_id: String(uid), text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '♟ O‘yinni ochish', url: appLink() + '?startapp=corr_' + (gid || '') }]] } });
const left = ms => { const h = Math.max(0, Math.floor(ms / 3600e3)), m = Math.max(0, Math.floor(ms % 3600e3 / 60000)); return h >= 1 ? h + ' soat' : m + ' daqiqa'; };
const init = () => { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; } return b; };
const active = uid => Object.values(db().g).filter(g => !g.res && (g.w === uid || g.b === uid)).length;
const sideOf = (g, uid) => g.w === uid ? 1 : g.b === uid ? -1 : 0;
const celo = uid => (users()[uid] || {}).celo || 1500;

function create(w, b, per) {
  const id = hex(4), g = { id, w, b, per, board: init(), turn: 1, moves: [], created: Date.now(), dl: Date.now() + PERS[per], quiet: 0, rep: {} };
  db().g[id] = g; store.save();
  return g;
}
function finish(g, res, why) {   // res: 'w' | 'b' | 'd'
  if (g.res) return;
  g.res = res; g.why = why; g.end = Date.now(); g.drawBy = null;
  const a = users()[g.w], b = users()[g.b];
  if (a && b && g.moves.length >= 4) {
    const s = res === 'w' ? 1 : res === 'b' ? 0 : 0.5;
    try { require('./glicko.js').rate(g.w, g.b, s, 'corr'); } catch (e) { console.log('[reyting corr]', e.message); }   // ⭐ 📮 Yozishma toifasi (Glicko-2)
    a.cgames = (a.cgames || 0) + 1; b.cgames = (b.cgames || 0) + 1;
  }
  store.save();
  const W = { timeout: '⏰ vaqt tugadi', resign: '🏳 taslim bo‘ldi', nomoves: '♟ yurish qolmadi', agreed: '🤝 kelishilgan durang', nocap: '🤝 uzoq vaqt urishsiz — durang' }[why] || why;
  for (const u of [g.w, g.b]) {
    const me = sideOf(g, u), r = res === 'd' ? '🤝 Durang' : (res === 'w') === (me === 1) ? '🏆 Siz yutdingiz!' : '😔 Siz yutqazdingiz';
    dm(u, '📮 <b>Yozishma o‘yini tugadi</b>\n' + esc(nm(g.w)) + ' ⚪ — ⚫ ' + esc(nm(g.b)) + '\n\n' + r + ' (' + W + ')\n📮 Yozishma ELO: <b>' + celo(u) + '</b>', g.id);
  }
}

// ---------- yurish
function move(uid, id, from, to) {
  const g = db().g[id]; if (!g) return { error: 'O‘yin topilmadi' };
  if (g.res) return { error: 'O‘yin tugagan' };
  const me = sideOf(g, uid); if (!me) return { error: 'Siz bu o‘yinda emassiz' };
  if (g.turn !== me) return { error: 'Hozir raqib navbati' };
  const L = R.moves(g.board, me), m = L.find(x => x.from === +from && x.to === +to);
  if (!m) return { error: 'Noto‘g‘ri yurish' };
  const was = g.board[m.from];
  g.board = m.board; g.moves.push([m.from, m.to]); g.turn = -me; g.drawBy = null; g.rem = 0;
  g.dl = Date.now() + PERS[g.per];
  g.quiet = m.caps.length || Math.abs(was) === 1 ? 0 : (g.quiet || 0) + 1;
  const key = g.board.join('') + g.turn; g.rep = g.rep || {}; g.rep[key] = (g.rep[key] || 0) + 1;
  if (!R.moves(g.board, g.turn).length) { finish(g, me === 1 ? 'w' : 'b', 'nomoves'); return { ok: true, game: view(g, uid) }; }
  if (g.quiet >= NOCAP || g.rep[key] >= 3) { finish(g, 'd', 'nocap'); return { ok: true, game: view(g, uid) }; }
  store.save();
  const opp = me === 1 ? g.b : g.w;
  dm(opp, '♟ <b>' + esc(nm(uid)) + '</b> yurish qildi — navbat sizda!\n📮 Yozishma o‘yini · ' + Math.ceil(g.moves.length / 2) + '-yurish\n⏳ Javob uchun: <b>' + left(g.dl - Date.now()) + '</b>', g.id);
  return { ok: true, game: view(g, uid) };
}

// ---------- vaqt nazorati
setInterval(() => {
  try {
    const now = Date.now();
    for (const g of Object.values(db().g)) {
      if (g.res) { if (now - g.end > 30 * 86400e3) delete db().g[g.id]; continue; }
      if (now >= g.dl) { finish(g, g.turn === 1 ? 'b' : 'w', 'timeout'); continue; }
      if (!g.rem && g.dl - now <= REMIND) { g.rem = 1; store.save(); dm(g.turn === 1 ? g.w : g.b, '⏰ <b>Yurish vaqti tugayapti!</b>\n📮 ' + esc(nm(g.w)) + ' — ' + esc(nm(g.b)) + '\nQoldi: <b>' + left(g.dl - now) + '</b>. Yurmasangiz, o‘yin yutqazilgan hisoblanadi.', g.id); }
    }
    const S = db().seeks; for (const k of Object.keys(S)) if (now - S[k].at > 7 * 86400e3) delete S[k];
  } catch (e) { console.log('[corr]', e.message); }
}, 60000).unref();

function view(g, uid) {
  const me = sideOf(g, uid);
  return {
    id: g.id, w: { uid: g.w, name: nm(g.w), elo: celo(g.w) }, b: { uid: g.b, name: nm(g.b), elo: celo(g.b) }, me, per: g.per,
    board: g.board, turn: g.turn, n: g.moves.length, last: g.moves[g.moves.length - 1] || null, dl: g.dl, now: Date.now(),
    res: g.res || null, why: g.why || null, drawBy: g.drawBy || null,
    legal: !g.res && g.turn === me ? R.moves(g.board, me).map(m => [m.from, m.to]) : []
  };
}

// ---------- HTTP: /api/corr/*
function handle(req, res, p, h) {
  if (!p.startsWith('/api/corr')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(t.id); store.getOrCreate(t);
  if (req.method === 'GET') {
    if (p === '/api/corr') {
      const G = Object.values(db().g).filter(g => g.w === uid || g.b === uid).sort((a, b) => (!!a.res - !!b.res) || ((b.turn === sideOf(b, uid)) - (a.turn === sideOf(a, uid))) || b.created - a.created).slice(0, 30);
      const seeks = Object.values(db().seeks).map(s => ({ id: s.id, uid: s.uid, name: nm(s.uid), elo: celo(s.uid), per: s.per, to: s.to || null, mine: s.uid === uid })).filter(s => !s.to || s.to === uid || s.mine);
      const top = Object.entries(users()).filter(([, u]) => (u.cgames || 0) >= 1).map(([id, u]) => ({ name: u.name || 'O‘yinchi', elo: u.celo || 1000 })).sort((a, b) => b.elo - a.elo).slice(0, 10);
      h.send(res, 200, { games: G.map(g => view(g, uid)), seeks, my: { elo: celo(uid), active: active(uid), max: MAXG }, top });
      return true;
    }
    const g = db().g[p.slice(10)]; if (!g) { h.send(res, 404, { error: 'O‘yin topilmadi' }); return true; }
    h.send(res, 200, view(g, uid)); return true;
  }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const S = db().seeks, per = PERS[+j.per] ? +j.per : 24;
    if (p === '/api/corr/seek') {   // ochiq taklif yoki aniq o'yinchiga taklif
      if (active(uid) >= MAXG) return h.send(res, 400, { error: 'Bir vaqtda ' + MAXG + ' tagacha o‘yin' });
      const to = j.to ? String(j.to) : null;
      if (to && (!users()[to] || to === uid)) return h.send(res, 400, { error: 'O‘yinchi topilmadi' });
      if (to && (((users()[to] || {}).blocked || []).includes(uid) || ((users()[uid] || {}).blocked || []).includes(to))) return h.send(res, 400, { error: 'Bu o‘yinchiga taklif yuborib bo‘lmaydi' });
      if (Object.values(S).filter(s => s.uid === uid).length >= 5) return h.send(res, 400, { error: 'Ochiq takliflaringiz ko‘p' });
      const s = { id: hex(3), uid, per, to, at: Date.now() }; S[s.id] = s; store.save();
      if (to) dm(to, '📮 <b>' + esc(nm(uid)) + '</b> sizni yozishma o‘yiniga taklif qildi!\n⏳ Har yurishga: ' + (per === 72 ? '3 kun' : per === 24 ? '1 kun' : '12 soat') + '\nQabul qilish uchun ilovani oching 👇', '');
      return h.send(res, 200, { ok: true });
    }
    if (p === '/api/corr/accept') {
      const s = S[String(j.id)]; if (!s) return h.send(res, 400, { error: 'Taklif topilmadi' });
      if (s.uid === uid) { delete S[s.id]; store.save(); return h.send(res, 200, { ok: true, cancelled: true }); }   // o'z taklifini bekor qilish
      if (s.to && s.to !== uid) return h.send(res, 400, { error: 'Bu taklif sizga emas' });
      if (active(uid) >= MAXG) return h.send(res, 400, { error: 'Bir vaqtda ' + MAXG + ' tagacha o‘yin' });
      delete S[s.id];
      const g = Math.random() < 0.5 ? create(s.uid, uid, s.per) : create(uid, s.uid, s.per);
      dm(s.uid, '📮 <b>' + esc(nm(uid)) + '</b> yozishma o‘yiningizni qabul qildi!' + (g.w === s.uid ? '\nSiz oq bilan — birinchi yurish sizdan.' : '\nRaqib oq bilan boshlaydi.'), g.id);
      return h.send(res, 200, { ok: true, game: view(g, uid) });
    }
    if (p === '/api/corr/move') { const r = move(uid, String(j.id), j.from, j.to); return h.send(res, r.error ? 400 : 200, r); }
    const g = db().g[String(j.id)]; if (!g || g.res || !sideOf(g, uid)) return h.send(res, 400, { error: 'O‘yin topilmadi' });
    if (p === '/api/corr/resign') { finish(g, sideOf(g, uid) === 1 ? 'b' : 'w', 'resign'); return h.send(res, 200, { ok: true, game: view(g, uid) }); }
    if (p === '/api/corr/draw') {
      if (g.drawBy && g.drawBy !== uid) { finish(g, 'd', 'agreed'); return h.send(res, 200, { ok: true, game: view(g, uid) }); }
      g.drawBy = uid; store.save(); dm(sideOf(g, uid) === 1 ? g.b : g.w, '🤝 <b>' + esc(nm(uid)) + '</b> yozishma o‘yinida durang taklif qildi.', g.id);
      return h.send(res, 200, { ok: true, game: view(g, uid) });
    }
    h.send(res, 404, { error: 'none' });
  });
  return true;
}
module.exports = { handle, move, create, view };
