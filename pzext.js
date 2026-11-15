'use strict';
// pzext.js — 🧩 chala yozilgan kombinatsiyani oxirigacha o'ynash.
// Kitobdagi yechim tugagach, o'yinchi kombinatsiyani donalarni urib olguncha davom ettiradi; raqibning javobini
// King Kong (yoki ≤5 donada endshpil bazasi) beradi. O'yinchining istalgan yurishi qabul qilinadi — agar natija
// eng yaxshi yurishdan yomon bo'lmasa. Tugash sharti: o'yinchi boshlang'ich holatga nisbatan kamida 1 dona ko'p
// (damka = 2) va navbat o'yinchida, urish yo'q (kombinatsiya to'liq yakunlangan) — yoki raqibning donasi/yurishi qolmagan.
const store = require('./store.js');
const R = () => require('./kkrules.js');
const engMove = (b, side, t) => new Promise(r => { try { require('./kestoai.js').move({ board: b, side, time: t, book: false, arena: true, tbAlways: true }, r); } catch (e) { r({ error: 'eng' }); } });
const W = v => v === 2 || v === -2 ? 2 : 1;
function mat(b, s) { let n = 0; for (const v of b) if (v && Math.sign(v) === s) n += W(v); return n; }
function to64(b8) { const o = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const v = b8[r][c]; o.push(v === 1 ? 1 : v === 3 ? 2 : v === 2 ? -1 : v === 4 ? -2 : 0); } return o; }
function capsAvail(b, s) { return R().moves(b, s).some(m => m.caps && m.caps.length); }
function gain(pz, b, s) { const b0 = to64(pz.board); return (mat(b, s) - mat(b, -s)) - (mat(b0, s) - mat(b0, -s)); }
// kombinatsiya yakunlandimi (navbat o'yinchida)
function finished(pz, b, s) {
  if (!b.some(v => v && Math.sign(v) === -s)) return true;
  return gain(pz, b, s) >= 1 && !capsAvail(b, s);
}
const pack = m => [m.from].concat(m.path);
let BUSY = 0;
async function reply(pz, a, s) {   // a: raqib yurishi kerak bo'lgan pozitsiya
  const bm = R().moves(a, -s);
  if (!a.some(v => v && Math.sign(v) === -s) || !bm.length) return { keep: true, solved: true };
  const e = await engMove(a, -s, 0.6);
  const rm = (e && !e.error && bm.find(x => x.from === e.from && x.to === e.to)) || bm[0];
  const solved = finished(pz, rm.board, s);
  return { keep: true, reply: pack(rm), solved };
}
async function judge(pz, b, path, s, n) {
  const ms = R().moves(b, s), m = ms.find(x => x.from === path[0] && x.path.join() === path.slice(1).join());
  if (!m) return { keep: false, why: 'illegal' };
  const a = m.board;
  if (!a.some(v => v && Math.sign(v) === -s) || !R().moves(a, -s).length) return { keep: true, solved: true };
  if (BUSY >= 4) return { keep: false, why: 'busy' };
  BUSY++;
  try {
    // o'yinchi yurishi eng yaxshisidan yomon emasmi: raqib nuqtai nazaridan baholar solishtiriladi
    const w0 = await engMove(b, s, 0.6), best = w0 && !w0.error ? ms.find(x => x.from === w0.from && x.to === w0.to) : null;
    let ok = !best || (best.from === m.from && best.to === m.to);
    if (!ok) {
      const rU = await engMove(a, -s, 0.6), rB = await engMove(best.board, -s, 0.6);
      if (!rU || rU.error || !rB || rB.error) return { keep: false, why: 'eng' };
      ok = rU.ev != null && rB.ev != null && rU.ev <= rB.ev + 60;   // eng yaxshi yurishdan sezilarli yomon bo'lmasa — qabul
    }
    if (!ok) return { keep: false, why: 'worse' };
    if (n >= 12) return { keep: true, solved: true };   // juda cho'zilsa — kombinatsiya qismi bajarilgan, yakunlaymiz
    return await reply(pz, a, s);
  } finally { BUSY--; }
}
function handle(req, res, p, h) {
  if (p !== '/api/pzext/judge' || req.method !== 'POST') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  h.readBody(req, 4000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const pz = (store.db.puzzles || []).find(x => x.id === String(j.id || ''));
    if (!pz) return h.send(res, 404, { keep: false, why: 'none' });
    const b = j.b, s = pz.side === 'b' ? -1 : 1;
    if (!Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return h.send(res, 400, { keep: false, why: 'bad' });
    const done = r => h.send(res, 200, Object.assign({ ok: true }, r));
    if (j.mode === 'start') {   // kitobdagi yechim raqib navbatida tugadi — raqib javob beradi
      if (BUSY >= 4) return done({ keep: false, why: 'busy' });
      BUSY++; return reply(pz, b, s).then(r => { BUSY--; done(r); }, () => { BUSY--; done({ keep: false, why: 'err' }); });
    }
    const path = Array.isArray(j.path) ? j.path.map(Number).filter(v => v >= 0 && v < 64) : [];
    if (path.length < 2) return done({ keep: false, why: 'bad' });
    judge(pz, b, path, s, Number(j.n) || 0).then(done, () => done({ keep: false, why: 'err' }));
  });
  return true;
}
module.exports = { handle, finished, gain };
