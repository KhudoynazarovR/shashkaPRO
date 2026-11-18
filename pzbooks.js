'use strict';
// pzbooks.js — 🏅 kombinatsiyalar darajalar bo'yicha: 3-daraja, 2-daraja, 1-daraja, KMS, MS, GM.
// Daraja — o'yinchi yechishi kerak bo'lgan yurishlar soni bo'yicha (darajalar ichida osondan qiyinga).
// Tarkib bir marta tuziladi va DBda qotiriladi (store.db.pzRanks): yangi masala faqat o'z darajasining oxiriga
// qo'shiladi, boshqalar joyidan siljimaydi. Durang masalalari — alohida ro'yxat (dr).
// Kirmaydi: tekshiruvda «xato», darslik pozitsiyalari (Tahlil, Endshpil), etyudlar (alohida bo'lim), «Qora yuradi», g'alati pozitsiyalar.
// Etyudlar kitoblari mijozda (etyud papkalari 100 tadan) yasaladi. Muqova rasmi — admin qo'yadi.
const store = require('./store.js');
const R = require('./pzcheck.js');
const RANKS = [
  { k: 'r3', t: '3-daraja', min: 1, max: 3 },
  { k: 'r2', t: '2-daraja', min: 4, max: 4 },
  { k: 'r1', t: '1-daraja', min: 5, max: 5 },
  { k: 'kms', t: 'KMS', min: 6, max: 6 },
  { k: 'ms', t: 'MS', min: 7, max: 8 },
  { k: 'gm', t: 'GM', min: 9, max: 999 }
];
const RK = RANKS.map(r => r.k);
const UNLOCK = 100;   // keyingi daraja: oldingi darajadan shuncha masala yechilganda ochiladi
let C = { k: '', v: null };
const moveN = new Map();   // id+hash → [o'z yurishlari, qadamlar] (qayta hisoblamaslik uchun)
// g'alati pozitsiya: donalar soni keskin farq qiladi (masalan 12 ga 1) — darslikdan chala ko'chirilgan rasm
function odd(b) {
  let w = 0, k = 0; (b || []).forEach(r => (r || []).forEach(v => { if (v === 1 || v === 3) w++; else if (v === 2 || v === 4) k++; }));
  const lo = Math.min(w, k), hi = Math.max(w, k);
  return !lo || hi - lo >= 5 || (hi >= lo * 3 && hi - lo >= 3);
}
const SRC = f => /Oson/.test(f) ? 0 : /Qiyin/.test(f) ? 2 : 1;   // manba qiyinligi (Damki · Oson/O‘rta/Qiyin) — daraja ichida tartib uchun
// masala turi: 'c' — kombinatsiya (yutish), 'd' — durang; null — kirmaydi
function classify(p, bad) {
  if (bad[p.id] && bad[p.id].st === 'err') return null;
  const f = p.folder || '';
  if (/Tahlil|lektsiyalari 2: Endshpil/i.test(f)) return null;   // darslik pozitsiyalari — masala emas
  if (/Etyud/i.test(f) || p.et) return null;   // etyudlar alohida bo'limda
  if (p.side === 'b') return null;   // faqat «Oq yuradi»
  if (odd(p.board)) return null;
  const sol = (p.sols && p.sols[0]) || p.sol; if (!Array.isArray(sol) || !sol.length) return null;
  const mk = p.id + ':' + JSON.stringify(sol).length + ':' + sol[0].join('');
  let v = moveN.get(mk);
  if (!v) { const lg = R.legal(p); v = lg.ok ? [R.ownMoves(p, lg.sol), lg.sol.length] : [-1, 0]; moveN.set(mk, v); }
  if (v[0] < 0) return null;
  return { t: (p.goal || 'win') === 'draw' ? 'd' : 'c', own: v[0], pl: v[1], src: SRC(f) };
}
function rankOf(own) { return (RANKS.find(r => own >= r.min && own <= r.max) || RANKS[RANKS.length - 1]).k; }
function build() {
  const L = store.db.puzzles || [], bad = (store.db.pzChk && store.db.pzChk.bad) || {};
  const F0 = store.db.pzRanks && store.db.pzRanks.v === 1 ? store.db.pzRanks : null;
  const key = (store.db.pzVer || 0) + ':' + L.length + ':' + Object.keys(bad).filter(id => bad[id].st === 'err').length + ':' + (F0 ? F0.at : 0);
  if (C.k === key) return C.v;
  const info = new Map();
  L.forEach((p, i) => { const c = classify(p, bad); if (c) { c.i = i; info.set(p.id, c); } });
  const ord = (a, b) => a[1].own - b[1].own || a[1].pl - b[1].pl || a[1].src - b[1].src || a[1].i - b[1].i;
  let F = F0, ch = false;
  if (!F) {   // birinchi marta: hammasi saralanadi va qotiriladi
    F = { v: 1, at: Date.now(), r: {}, dr: [] }; RK.forEach(k => { F.r[k] = []; });
    [...info.entries()].sort(ord).forEach(([id, c]) => { if (c.t === 'd') F.dr.push(id); else F.r[rankOf(c.own)].push(id); });
    ch = true;
  } else {   // yangi masalalar — o'z darajasining oxiriga (bir-biri orasida saralanib)
    const have = new Set(F.dr); RK.forEach(k => { F.r[k] = F.r[k] || []; F.r[k].forEach(id => have.add(id)); });
    [...info.entries()].filter(([id]) => !have.has(id)).sort(ord).forEach(([id, c]) => { if (c.t === 'd') F.dr.push(id); else F.r[rankOf(c.own)].push(id); ch = true; });
  }
  if (ch) { store.db.pzRanks = F; store.save(); }
  // ko'rinish: o'chirilgan yoki «xato» bo'lib qolganlar tushirib qoldiriladi (DBda turadi — tuzatilsa joyiga qaytadi)
  const out = { r: {}, dr: F.dr.filter(id => info.has(id) && info.get(id).t === 'd') };
  RK.forEach(k => { out.r[k] = F.r[k].filter(id => info.has(id) && info.get(id).t === 'c'); });
  C = { k: (store.db.pzVer || 0) + ':' + L.length + ':' + Object.keys(bad).filter(id => bad[id].st === 'err').length + ':' + F.at, v: out };
  return out;
}
function rebuild() { delete store.db.pzRanks; C = { k: '', v: null }; return build(); }   // admin: darajalarni qaytadan saralash
// daraja ochiqmi: 1-daraja va durang doim ochiq; admin qarori (hamma uchun ochiq/qulf, shu o'yinchiga ochilgan); oldingi darajadan UNLOCK ta yechilgan
function rankOpen(k, u, B) {
  const i = RK.indexOf(k); if (i <= 0) return true;
  const a = (store.db.pzBookAll || {})[k];
  if (a === 'open') return true; if (a === 'lock') return false;
  if (u && u.pzOpenB && u.pzOpenB[k]) return true;
  B = B || build(); const pv = B.r[RK[i - 1]] || [], sv = new Set((u && u.solved) || []);
  let c = 0; for (const id of pv) if (sv.has(id)) c++;
  return c >= Math.min(UNLOCK, pv.length);
}
function covers() { const c = store.db.pzBookCov || {}, o = {}; Object.keys(c).forEach(k => { o[k] = c[k].v; }); return o; }
function handle(req, res, p, h) {
  if (!p.startsWith('/api/pzbook')) return false;
  if (p === '/api/pzbook/cov' && req.method === 'GET') {
    const k = new URL(req.url, 'http://x').searchParams.get('k') || '', c = (store.db.pzBookCov || {})[k];
    const m = c && /^data:(image\/(?:webp|jpeg|png));base64,(.+)$/.exec(c.img || '');
    if (!m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=2592000, immutable' }); res.end(Buffer.from(m[2], 'base64'));
    return true;
  }
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  const adm = t && (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).includes(String(t.id));
  if (!adm) { h.send(res, 403, { error: 'Faqat admin' }); return true; }
  h.readBody(req, 400000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p !== '/api/pzbook/cov') return h.send(res, 404, { error: 'topilmadi' });
    const k = String(j.k || ''); if (!/^[a-z0-9_]{1,40}$/.test(k)) return h.send(res, 400, { error: 'kalit' });
    store.db.pzBookCov = store.db.pzBookCov || {};
    if (!j.img) delete store.db.pzBookCov[k];
    else {
      if (!/^data:image\/(webp|jpeg|png);base64,/.test(j.img) || j.img.length > 300000) return h.send(res, 400, { error: 'Rasm juda katta yoki noto‘g‘ri' });
      store.db.pzBookCov[k] = { img: j.img, v: Date.now().toString(36) };
    }
    store.save(); h.send(res, 200, { ok: true, cov: covers() });
  });
  return true;
}
module.exports = { build, rebuild, rankOpen, covers, handle, odd, RANKS, RK, UNLOCK };
