'use strict';
// kkrep.js — 📖 King Kong repertuari: har pozitsiyada yurishlarga admin foiz (vazn) qo'yadi, King Kong vazn bo'yicha tasodifiy tanlaydi.
// Doiralar (ustunlik tartibida): raqib nomi (opp:<ism>) → raqib darajasi (grp:kuchli / grp:yangi) → vaqt (tc:tez / tc:uzun) → umumiy (all).
// 📊 natijaga qarab foizlar o'zi moslashadi (qo'lda qulflanganlari tegilmaydi), 🪤 tuzoqlar, 🕓 tarix va orqaga qaytarish,
// 📗 Colette/kitobdan va 📥 PDN dan import. kestoai.move (King Kong) o'rgatilgan yurishlardan keyin, Colette/kitobdan oldin chaqiradi.
const store = require('./store.js');
const R = require('./kkrules.js');
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const unsq = s => { const m = /^([a-h])([1-8])$/.exec(String(s || '').trim()); return m ? (8 - +m[2]) * 8 + 'abcdefgh'.indexOf(m[1]) : -1; };
const D = () => { const d = store.db; d.kkRep = d.kkRep || {}; const r = d.kkRep; r.sc = r.sc || { all: {} }; r.cfg = Object.assign({ depth: 12, tour100: false, adapt: true, traps: true }, r.cfg || {}); r.hist = r.hist || []; r.st = r.st || {}; r.trap = r.trap || {}; return r; };
const init = () => { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; } return b; };
const keyOf = (b, s) => b.join('') + s;
const mvTxt = m => [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps.length ? ':' : '-');
const SCOPES = { all: 'Umumiy', 'tc:tez': '⏱ Tez (blits)', 'tc:uzun': '⏱ Uzun', 'grp:kuchli': '💪 Kuchlilar (1800+)', 'grp:yangi': '🌱 Yangi boshlovchilar (<1300)' };
const okScope = s => /^(all|tc:(tez|uzun)|grp:(kuchli|yangi)|opp:[a-z0-9_\-]{1,40})$/.test(String(s || ''));

// ---------- tanlash (kestoai dan)
const used = new Map();   // room -> [{key, mv}]
function scopesFor(ctx) {
  const o = [];
  if (ctx.opp) o.push('opp:' + String(ctx.opp).toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 40));
  if (ctx.elo >= 1800) o.push('grp:kuchli'); else if (ctx.elo > 0 && ctx.elo < 1300) o.push('grp:yangi');
  if (ctx.tcs > 0) o.push(ctx.tcs <= 300 ? 'tc:tez' : ctx.tcs >= 900 ? 'tc:uzun' : null);
  o.push('all');
  return o.filter(Boolean);
}
function pick(b, side, ctx) {
  try {
    const r = D(), k = keyOf(b, side); ctx = ctx || {};
    for (const sc of scopesFor(ctx)) {
      const P = r.sc[sc] && r.sc[sc][k]; if (!P) continue;
      let L = Object.entries(P).filter(([, v]) => v.w > 0);
      if (ctx.tour && r.cfg.tour100) { const t = L.filter(([, v]) => v.w >= 100); if (t.length) L = t; }
      if (!L.length) continue;
      const legal = R.moves(b, side); L = L.filter(([m]) => { const [f, t] = m.split('-').map(Number); return legal.some(x => x.from === f && x.to === t); });
      if (!L.length) continue;
      let sum = L.reduce((s, [, v]) => s + v.w, 0), x = Math.random() * sum, ch = L[0];
      for (const e of L) { x -= e[1].w; if (x <= 0) { ch = e; break; } }
      const [f, t] = ch[0].split('-').map(Number);
      if (ctx.room) { const a = used.get(ctx.room) || []; a.push({ k, m: ch[0], sc }); used.set(ctx.room, a); if (used.size > 500) used.delete(used.keys().next().value); }
      return { from: f, to: t, sc };
    }
    // 🪤 tuzoq: raqiblar ko'p xato qilgan pozitsiyaga olib boruvchi xavfsiz yurish
    if (r.cfg.traps) {
      const legal = R.moves(b, side); if (legal.length < 2) return null;
      let best = null, bv = 0;
      for (const m of legal) {
        const T = r.trap[keyOf(m.board, -side)]; if (!T || T.err < 2) continue;
        const rate = T.err / Math.max(1, T.n); if (rate < 0.35 || rate <= bv) continue;
        try { const c = require('./kkadm.js').check(b, side, m.from, m.to); if (c && c.loss >= 1) continue; } catch (e) { continue; }
        best = m; bv = rate;
      }
      if (best) { if (ctx.room) { const a = used.get(ctx.room) || []; a.push({ k, m: best.from + '-' + best.to, sc: 'trap' }); used.set(ctx.room, a); } return { from: best.from, to: best.to, sc: 'trap' }; }
    }
  } catch (e) { console.log('[kkrep]', e.message); }
  return null;
}
// o'yin tugadi (kkadm.record dan): statistika va 📊 moslashuv
function result(roomId, res) {
  const a = used.get(roomId); used.delete(roomId); if (!a) return;
  const r = D();
  for (const u of a) {
    const s = r.st[u.k] || (r.st[u.k] = {}), v = s[u.m] || (s[u.m] = { w: 0, l: 0, d: 0 }); v[res]++;
    if (!r.cfg.adapt || u.sc === 'trap') continue;
    const e = r.sc[u.sc] && r.sc[u.sc][u.k] && r.sc[u.sc][u.k][u.m]; if (!e || e.lock) continue;
    e.w = Math.max(5, Math.min(100, Math.round(e.w + (res === 'w' ? 2 : res === 'l' ? -8 : -1))));
  }
  const ks = Object.keys(r.st); if (ks.length > 30000) ks.slice(0, 5000).forEach(k => delete r.st[k]);
  store.save();
}
// 🪤 o'yin tahlilidan: raqib yurishlari (kkadm.analyze)
function noteOpp(b, s, loss) {
  const r = D(), k = keyOf(b, s), T = r.trap[k] || (r.trap[k] = { n: 0, err: 0 }); T.n++; if (loss >= 1) T.err++;
  const ks = Object.keys(r.trap); if (ks.length > 20000) ks.sort((a, c) => r.trap[a].n - r.trap[c].n).slice(0, 4000).forEach(x => delete r.trap[x]);
}

// ---------- tahrirlash
function set(sc, b, s, moves, by, why) {   // moves: {"from-to": {w, note, mk, lock}}
  const r = D(); if (!okScope(sc)) return null;
  const k = keyOf(b, s), S = r.sc[sc] || (r.sc[sc] = {}), old = S[k] ? JSON.parse(JSON.stringify(S[k])) : null, legal = R.moves(b, s), nw = {};
  for (const [m, v] of Object.entries(moves || {})) {
    const [f, t] = m.split('-').map(Number); if (!legal.some(x => x.from === f && x.to === t)) continue;
    const w = Math.max(0, Math.min(100, Math.round(+v.w || 0)));
    if (w > 0 || v.note || v.mk) nw[m] = { w, note: String(v.note || '').slice(0, 200), mk: /^(!!|!|\?!|!\?|\?|\?\?)$/.test(v.mk || '') ? v.mk : '', lock: v.lock === undefined ? true : !!v.lock, src: v.src || 'admin' };
  }
  if (Object.keys(nw).length) S[k] = nw; else delete S[k];
  r.hist.unshift({ at: Date.now(), by: String(by || ''), sc, k, b: b.join(','), s, old, nw: S[k] || null, why: why || '' }); if (r.hist.length > 300) r.hist.length = 300;
  store.save(); return S[k] || {};
}
function undo(i) {
  const r = D(), h = r.hist[i]; if (!h) return false;
  const S = r.sc[h.sc] || (r.sc[h.sc] = {}); if (h.old) S[h.k] = h.old; else delete S[h.k];
  r.hist.splice(i, 1); store.save(); return true;
}
// pozitsiya ko'rinishi: barcha qonuniy yurishlar + vazn, ulush, natija
function view(sc, b, s) {
  const r = D(), k = keyOf(b, s), P = (r.sc[sc] && r.sc[sc][k]) || {}, A = (r.sc.all && r.sc.all[k]) || {}, st = r.st[k] || {}, L = R.moves(b, s);
  const sum = Object.values(P).reduce((t, v) => t + (v.w || 0), 0);
  let kb = null; try { const x = (store.db.kkBook || {})[k]; if (x) kb = x.f + '-' + x.t; } catch (e) {}
  const list = L.map(m => { const id = m.from + '-' + m.to, e = P[id] || {}, z = st[id] || null, T = r.trap[keyOf(m.board, -s)]; return { id, t: mvTxt(m), from: m.from, to: m.to, w: e.w || 0, pct: sum ? Math.round((e.w || 0) * 100 / sum) : 0, note: e.note || '', mk: e.mk || '', lock: !!e.lock, src: e.src || '', allW: sc !== 'all' && A[id] ? A[id].w : null, st: z, trap: T && T.err >= 2 ? { n: T.n, err: T.err } : null, after: m.board }; })
    .sort((a, c) => c.w - a.w || ((c.st ? c.st.w + c.st.l + c.st.d : 0) - (a.st ? a.st.w + a.st.l + a.st.d : 0)));
  return { k, sc, side: s, list, taught: kb, has: !!Object.keys(P).length };
}
// daraxt: boshlang'ich pozitsiyadan vaznli yurishlar bo'ylab (ikkala tomon), chuqurlik bilan
function tree(sc, maxPly) {
  const r = D(), S = r.sc[sc] || {}, out = []; let n = 0;
  const walk = (b, s, ply, pre) => {
    if (ply >= maxPly || n > 400) return;
    const P = S[keyOf(b, s)]; if (!P) return;
    const st = r.st[keyOf(b, s)] || {}, L = R.moves(b, s);
    Object.entries(P).filter(([, v]) => v.w > 0).sort((a, c) => c[1].w - a[1].w).forEach(([id, v]) => {
      const [f, t] = id.split('-').map(Number), m = L.find(x => x.from === f && x.to === t); if (!m) return;
      const z = st[id], bad = z && z.l >= 2 && z.l > z.w;
      out.push({ d: ply, pre, t: mvTxt(m), w: v.w, mk: v.mk || '', st: z || null, bad, s, b }); n++;
      walk(m.board, -s, ply + 1, pre.concat([mvTxt(m)]));
    });
    // raqib yurishlari (vazn qo'yilmagan) — ularning ichida King Kong javoblari bormi
    if (ply + 1 < maxPly) for (const m of L) { if (P[m.from + '-' + m.to]) continue; const P2 = S[keyOf(m.board, -s)]; if (P2) { out.push({ d: ply, pre, t: mvTxt(m), w: null, s, opp: 1, b }); n++; walk(m.board, -s, ply + 1, pre.concat([mvTxt(m)])); } }
  };
  walk(init(), 1, 0, []);
  return out;
}
// 📗 Colette va kitobdan import: boshlang'ich pozitsiyadan, King Kong tomonida Colette/kitob yurishi, raqib tomonida hamma yurishlar
function importBooks(sc, depthPly, by) {
  const r = D(); if (!okScope(sc)) return 0;
  let C = {}, B = {};
  try { C = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'partiyalar', 'colette_moves.json'), 'utf8')); } catch (e) {}
  try { B = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'book.json'), 'utf8')); } catch (e) {}
  const S = r.sc[sc] || (r.sc[sc] = {}); let add = 0; const seen = new Set();
  for (const me of [1, -1]) {
    const q = [[init(), 1, 0]];
    while (q.length && add < 6000) {
      const [b, s, ply] = q.shift(), k = keyOf(b, s); if (seen.has(k + me) || ply >= depthPly) continue; seen.add(k + me);
      const L = R.moves(b, s); if (!L.length) continue;
      if (s === me) {
        const c = C[k], bk = B[k], mv = {};
        if (c) mv[c[0] + '-' + c[1]] = 100;
        if (bk && bk.from != null && !mv[bk.from + '-' + bk.to]) mv[bk.from + '-' + bk.to] = c ? 60 : 100;
        const ids = Object.keys(mv).filter(id => { const [f, t] = id.split('-').map(Number); return L.some(x => x.from === f && x.to === t); });
        if (!ids.length) continue;
        const P = S[k] || (S[k] = {});
        if (!Object.values(P).some(v => v.lock)) for (const id of ids) if (!P[id]) { P[id] = { w: mv[id], note: '', mk: '', lock: false, src: c && id === c[0] + '-' + c[1] ? 'colette' : 'kitob' }; add++; }
        for (const id of ids) { const [f, t] = id.split('-').map(Number), m = L.find(x => x.from === f && x.to === t); q.push([m.board, -s, ply + 1]); }
      } else for (const m of L) q.push([m.board, -s, ply + 1]);
    }
  }
  r.hist.unshift({ at: Date.now(), by: String(by || ''), sc, k: null, why: '📚 Nazariya importi: ' + add + ' ta yurish' }); store.save();
  return add;
}
// 📥 PDN: bir yoki ko'p partiya → chastota bo'yicha vaznlar
function importPdn(sc, text, sides, depthPly, by) {
  const r = D(); if (!okScope(sc)) return { error: 'Doira noto‘g‘ri' };
  const games = String(text || '').split(/\n\s*\n(?=\s*(\[|1\.))|(?<=\s(?:1-0|0-1|2-0|0-2|1-1|1\/2-1\/2|\*))\s+(?=1\.)/).filter(g => g && /\d\.\s*[a-h][1-8]/.test(g));
  const cnt = {}; let ok = 0, bad = 0;
  for (const g of games) {
    const body = g.replace(/\[[^\]]*\]/g, ' '), toks = (body.match(/[a-h][1-8](?:[-x:][a-h][1-8])+/g) || []);
    let b = init(), s = 1, ply = 0, good = true;
    for (const t of toks) {
      if (ply >= depthPly) break;
      const ps = t.split(/[-x:]/).map(unsq), f = ps[0], to = ps[ps.length - 1];
      const m = R.moves(b, s).find(x => x.from === f && x.to === to); if (!m) { good = false; break; }
      if (sides === 'both' || (sides === 'w' ? s === 1 : s === -1)) { const k = keyOf(b, s), e = cnt[k] || (cnt[k] = { b: b.slice(), s, m: {} }); e.m[m.from + '-' + m.to] = (e.m[m.from + '-' + m.to] || 0) + 1; }
      b = m.board; s = -s; ply++;
    }
    if (good && ply) ok++; else bad++;
  }
  const S = r.sc[sc] || (r.sc[sc] = {}); let add = 0;
  for (const [k, e] of Object.entries(cnt)) {
    const mx = Math.max(...Object.values(e.m)), P = S[k] || (S[k] = {});
    if (Object.values(P).some(v => v.lock)) continue;
    for (const [id, n] of Object.entries(e.m)) { const w = Math.max(10, Math.round(100 * n / mx)); if (!P[id] || (P[id].src !== 'admin' && P[id].w < w)) { P[id] = { w, note: '', mk: '', lock: false, src: 'pdn' }; add++; } }
  }
  r.hist.unshift({ at: Date.now(), by: String(by || ''), sc, k: null, why: '📥 PDN importi: ' + ok + ' partiya, ' + add + ' ta yurish' }); store.save();
  return { games: ok, bad, add };
}
function traps(n) {
  const r = D();
  return Object.entries(r.trap).filter(([, T]) => T.err >= 2).map(([k, T]) => ({ k, b: (k.endsWith('-1') ? k.slice(0, -2) : k.slice(0, -1)).match(/-?\d/g).map(Number), s: k.endsWith('-1') ? -1 : 1, n: T.n, err: T.err, rate: Math.round(T.err * 100 / Math.max(1, T.n)) })).sort((a, b) => b.err - a.err || b.rate - a.rate).slice(0, n || 40);
}

// 🐉 Dragon taklifi: har yurish baholanadi → foiz (eng yaxshisi 100, har 0.1 dona farq −10, dona yo'qotadigani 0)
const SUG = new Map();
function suggest(b, s, cb) {
  const key = b.join('') + s; if (SUG.has(key)) return cb(SUG.get(key));
  const L = R.moves(b, s); if (!L.length) return cb({ list: [] });
  if (L.length === 1) return cb({ list: [{ id: L[0].from + '-' + L[0].to, w: 100, ev: null }] });
  let lose = {}; try { const rk = require('./kkadm.js').rank(b, s, 4); if (rk && rk.length) rk.forEach(x => { lose[x.m.from + '-' + x.m.to] = rk[0].v - x.v; }); } catch (e) {}
  const K = require('./kestoai.js'), out = []; let i = 0;
  (function next() {
    if (i >= L.length) {
      const sc = out.filter(x => x.sc != null).map(x => x.sc), best = sc.length ? Math.max.apply(null, sc) : 0;
      const list = out.map(x => { let w = x.sc == null ? 0 : Math.round(Math.max(0, 100 - (best - x.sc) * 100) / 5) * 5; if ((lose[x.id] || 0) >= 1) w = 0; if (w < 20) w = 0; return { id: x.id, w, ev: x.sc == null ? null : Math.round(x.sc * 100) / 100 }; });
      const o = { list }; SUG.set(key, o); if (SUG.size > 1000) SUG.delete(SUG.keys().next().value); return cb(o);
    }
    const m = L[i++];
    K.pv(m.board, -s, 0.3, 1, r => { out.push({ id: m.from + '-' + m.to, sc: r && typeof r.ev === 'number' ? s * r.ev : null }); next(); });
  })();
}
// ---------- HTTP: /api/kkrep (faqat admin)
function handle(req, res, p, h) {
  if (!p.startsWith('/api/kkrep')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  let adm = false; try { adm = require('./kkbook.js').isAdmin(t && t.id); } catch (e) {}
  if (!t || !adm) { h.send(res, 403, { error: 'Faqat admin uchun' }); return true; }
  h.readBody(req, 400000, async body => {
    let j = {}; try { j = JSON.parse(body || '{}'); } catch (e) {}
    const r = D(), sc = okScope(j.sc) ? j.sc : 'all';
    const okB = Array.isArray(j.board) && j.board.length === 64 && j.board.every(v => Number.isInteger(v) && v >= -2 && v <= 2);
    const b = okB ? j.board : init(), s = j.side === -1 ? -1 : 1;
    if (p === '/api/kkrep/view') return h.send(res, 200, Object.assign(view(sc, b, s), { cfg: r.cfg, scopes: Object.keys(r.sc).map(x => ({ id: x, n: Object.keys(r.sc[x]).length, name: SCOPES[x] || ('🎯 ' + x.slice(4)) })) }));
    if (p === '/api/kkrep/set') { const x = set(sc, b, s, j.moves, t.id, j.why); return h.send(res, x ? 200 : 400, x ? { ok: true } : { error: 'Xato' }); }
    if (p === '/api/kkrep/tree') return h.send(res, 200, { list: tree(sc, Math.max(2, Math.min(40, +j.depth || r.cfg.depth * 2))), cfg: r.cfg });
    if (p === '/api/kkrep/cfg') { ['depth'].forEach(k => { if (j[k] != null) r.cfg[k] = Math.max(1, Math.min(30, +j[k] || 12)); }); ['tour100', 'adapt', 'traps'].forEach(k => { if (j[k] != null) r.cfg[k] = !!j[k]; }); store.save(); return h.send(res, 200, { cfg: r.cfg }); }
    if (p === '/api/kkrep/hist') return h.send(res, 200, { list: r.hist.slice(0, 120).map((x, i) => ({ i, at: x.at, sc: x.sc, why: x.why, b: x.b, s: x.s, old: x.old ? Object.keys(x.old).length : 0, nw: x.nw ? Object.entries(x.nw).map(([id, v]) => { const [f, tt] = id.split('-').map(Number); return SQ(f) + '-' + SQ(tt) + ' ' + v.w; }).join(', ') : '—' })) });
    if (p === '/api/kkrep/suggest') return suggest(b, s, x => h.send(res, 200, x));
    if (p === '/api/kkrep/undo') return h.send(res, undo(+j.i) ? 200 : 400, { ok: true });
    if (p === '/api/kkrep/import') return h.send(res, 200, { add: importBooks(sc, Math.max(2, Math.min(40, (+j.depth || r.cfg.depth) * 2)), t.id) });
    if (p === '/api/kkrep/pdn') return h.send(res, 200, importPdn(sc, j.text, j.sides === 'w' || j.sides === 'b' ? j.sides : 'both', Math.max(2, Math.min(60, (+j.depth || r.cfg.depth) * 2)), t.id));
    if (p === '/api/kkrep/traps') return h.send(res, 200, { list: traps(40), on: r.cfg.traps });
    if (p === '/api/kkrep/scope') { const id = String(j.id || '').toLowerCase(); if (!okScope(id)) return h.send(res, 400, { error: 'Nom noto‘g‘ri' }); if (j.del) { if (id !== 'all') delete r.sc[id]; } else r.sc[id] = r.sc[id] || {}; store.save(); return h.send(res, 200, { ok: true }); }
    if (p === '/api/kkrep/export') return h.send(res, 200, { sc, data: r.sc[sc] || {} });
    if (p === '/api/kkrep/test') { try { const n = await require('./kkfix.js').sparFrom(b, s, j.kk === -1 ? -1 : 1, Math.max(1, Math.min(10, +j.n || 10)), sc); return h.send(res, 200, n); } catch (e) { return h.send(res, 500, { error: e.message }); } }
    h.send(res, 404, { error: 'Noma’lum' });
  });
  return true;
}
module.exports = { pick, result, noteOpp, set, view, tree, importBooks, importPdn, traps, handle, SCOPES };
