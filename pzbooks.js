'use strict';
// pzbooks.js — 📚 masalalar kutubxonasi: masalalar 100 tadan kitoblarga bo'linadi.
// Sodda — o'yinchi ko'pi bilan 3 marta yuradi; Murakkab — 4 va undan ko'p. Osondan qiyinga tartiblanadi.
// Tekshiruvda «xato» chiqqan va qoidaga zid masalalar kitoblarga kirmaydi (papkalarda qoladi).
// Etyudlar kitoblari mijozda (etyud papkalari 100 tadan) yasaladi. Muqova rasmi — admin qo'yadi.
const store = require('./store.js');
const R = require('./pzcheck.js');
const SIZE = 100, EASY = 3;
let C = { k: '', v: null };
const moveN = new Map();   // id+hash → [o'z yurishlari, qadamlar] (qayta hisoblamaslik uchun)
// g'alati pozitsiya: donalar soni keskin farq qiladi (masalan 12 ga 1) — darslikdan chala ko'chirilgan rasm
function odd(b) {
  let w = 0, k = 0; (b || []).forEach(r => (r || []).forEach(v => { if (v === 1 || v === 3) w++; else if (v === 2 || v === 4) k++; }));
  const lo = Math.min(w, k), hi = Math.max(w, k);
  return !lo || hi - lo >= 5 || (hi >= lo * 3 && hi - lo >= 3);
}
function build() {
  const L = store.db.puzzles || [], bad = (store.db.pzChk && store.db.pzChk.bad) || {};
  const key = (store.db.pzVer || 0) + ':' + L.length + ':' + Object.keys(bad).filter(id => bad[id].st === 'err').length;
  if (C.k === key) return C.v;
  const s = [], m = [];
  L.forEach((p, i) => {
    if (bad[p.id] && bad[p.id].st === 'err') return;
    if (/Tahlil/i.test(p.folder || '')) return;   // o'yin tahlili pozitsiyalari — masala emas
    if (odd(p.board)) return;
    const sol = (p.sols && p.sols[0]) || p.sol; if (!Array.isArray(sol) || !sol.length) return;
    const mk = p.id + ':' + JSON.stringify(sol).length + ':' + sol[0].join('');
    let v = moveN.get(mk);
    if (!v) { const lg = R.legal(p); v = lg.ok ? [R.ownMoves(p, lg.sol), lg.sol.length] : [-1, 0]; moveN.set(mk, v); }
    if (v[0] < 0) return;
    (v[0] <= EASY ? s : m).push([p.id, v[0], v[1], i]);
  });
  const ord = (a, b) => a[1] - b[1] || a[2] - b[2] || a[3] - b[3];
  const chunk = a => { a.sort(ord); const out = []; for (let i = 0; i < a.length; i += SIZE) out.push(a.slice(i, i + SIZE).map(x => x[0])); return out; };
  C = { k: key, v: { s: chunk(s), m: chunk(m) } };
  return C.v;
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
module.exports = { build, covers, handle, odd };
