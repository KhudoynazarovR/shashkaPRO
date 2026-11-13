'use strict';
// kkrep.js — 📖 King Kong repertuari: har pozitsiyada yurishlarga admin foiz (vazn) qo'yadi, King Kong vazn bo'yicha tasodifiy tanlaydi.
// Doiralar (ustunlik tartibida): raqib nomi (opp:<ism>) → raqib darajasi (grp:kuchli / grp:yangi) → vaqt (tc:tez / tc:uzun) → umumiy (all).
// 📊 natijaga qarab foizlar o'zi moslashadi (qo'lda qulflanganlari tegilmaydi), 🪤 tuzoqlar, 🕓 tarix va orqaga qaytarish,
// 📗 Colette/kitobdan va 📥 PDN dan import. kestoai.move (King Kong) o'rgatilgan yurishlardan keyin, Colette/kitobdan oldin chaqiradi.
const store = require('./store.js');
const R = require('./kkrules.js');
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const unsq = s => { const m = /^([a-h])([1-8])$/.exec(String(s || '').trim()); return m ? (8 - +m[2]) * 8 + 'abcdefgh'.indexOf(m[1]) : -1; };
const D = () => { const d = store.db; d.kkRep = d.kkRep || {}; const r = d.kkRep; r.sc = r.sc || { all: {} }; r.cfg = Object.assign({ depth: 12, tour100: false, adapt: true, traps: true, top: true }, r.cfg || {}); r.hist = r.hist || []; r.st = r.st || {}; r.trap = r.trap || {}; return r; };
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
      if (r.cfg.top !== false) { const mx = Math.max.apply(null, L.map(([, v]) => v.w)); L = L.filter(([, v]) => v.w >= mx);  const MS = { '!!': 3, '!': 2, '!?': 1, '?!': -1, '?': -2, '??': -3 }, ms = v => MS[v.mk] || 0, mm = Math.max.apply(null, L.map(([, v]) => ms(v))); L = L.filter(([, v]) => ms(v) >= mm); }   // teng foizda: !! > ! > !? > belgisiz   // 🥇 eng katta foiz doim birinchi (tenglar orasida tasodifiy)
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

// ---------- 🛡 Admin o'zgarishlari yo'qolmasin (deploy paytida eski va yangi server bir vaqtda ishlaydi):
// har o'zgarish vaqti bilan alohida «live» qatorga darhol yoziladi; yangi server ishga tushgach 15 daqiqa davomida
// shu qatorni o'qib, yangiroq o'zgarishlarni o'ziga qo'shadi (eski server oxirgi daqiqalarda saqlaganlari ham).
let liveT = null;
function touch(sc, k) {
  const r = D(); r.tm = r.tm || {}; r.tm[sc + '|' + k] = Date.now();
  if (!liveT) liveT = setTimeout(() => { liveT = null; const x = D(); store.kvSet('kkrep:live', { sc: x.sc, tm: x.tm || {} }).catch(() => {}); }, 1500);
}
async function liveMerge() {
  const v = await store.kvGet('kkrep:live'); let o = null; try { o = typeof v === 'string' ? JSON.parse(v) : v; } catch (e) {}
  if (!o || !o.tm || !o.sc) return 0;
  const r = D(); r.tm = r.tm || {}; let n = 0;
  for (const [key, t] of Object.entries(o.tm)) {
    if (t <= (r.tm[key] || 0)) continue;
    const i = key.indexOf('|'), sc = key.slice(0, i), k = key.slice(i + 1), S = r.sc[sc] || (r.sc[sc] = {}), P = o.sc[sc] && o.sc[sc][k];
    if (P) S[k] = P; else delete S[k];
    r.tm[key] = t; n++;
  }
  if (n) { console.log('[kkrep] live dan qo‘shildi:', n); store.save(); }
  return n;
}
{ const t0 = Date.now(); const tick = () => { liveMerge().catch(() => {}).then(() => { if (Date.now() - t0 < 15 * 60e3) { const t = setTimeout(tick, 30e3); if (t.unref) t.unref(); } }); }; const t = setTimeout(tick, 20e3); if (t.unref) t.unref(); }
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
  touch(sc, k); store.save(); return S[k] || {};
}
function undo(i) {
  const r = D(), h = r.hist[i]; if (!h) return false;
  const S = r.sc[h.sc] || (r.sc[h.sc] = {}); if (h.old) S[h.k] = h.old; else delete S[h.k];
  r.hist.splice(i, 1); touch(h.sc, h.k); store.save(); return true;
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
function importPdn(sc, text, sides, depthPly, by, wmax, src) {
  wmax = wmax || 100; src = src || 'pdn';
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
    for (const [id, n] of Object.entries(e.m)) { const w = Math.max(10, Math.round(wmax * n / mx)); if (!P[id] || (P[id].src !== 'admin' && P[id].w < w)) { P[id] = { w, note: P[id] && P[id].note || '', mk: P[id] && P[id].mk || '', lock: false, src }; add++; } }
  }
  r.hist.unshift({ at: Date.now(), by: String(by || ''), sc, k: null, why: (src === 'durang' ? 'Durang partiya (kompyuter-kompyuter): ' : '📥 PDN importi: ') + ok + ' partiya, ' + add + ' ta yurish' }); store.save();
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
// 📖 Debyutlarni to'ldirish: debyutlar kutubxonasidagi har pozitsiyada hamma yurishlarga foiz + belgi (Dragon bahosi + kitob/nazariya).
// Qo'lda saqlangan (🔒) pozitsiyalarga tegilmaydi. Natija qulflanmagan (src: dragon) — admin tekshirib saqlaydi.
const FILL = { run: false, done: 0, total: 0, add: 0, q: [], at: 0, err: '' };
function fillQueue() {
  const t = require('fs').readFileSync(require('path').join(__dirname, 'debyut.js'), 'utf8'), D0 = JSON.parse(/var DATA = (\[.*?\]);\n/.exec(t)[1]);
  const seen = new Set(), q = [];
  D0.forEach(d => [d.steps].concat(d.alts || []).forEach(st => {
    let b = init(), s = 1;
    for (const x of st) {
      const k = keyOf(b, s); if (!seen.has(k)) { seen.add(k); q.push([b, s]); }
      const h = x.p, f = h[0][0] * 8 + h[0][1], e = h[h.length - 1][2] * 8 + h[h.length - 1][3];
      const m = R.moves(b, s).find(z => { const P = z.path && z.path.length ? z.path : [z.to]; return z.from === f && P[P.length - 1] === e; }); if (!m) break;
      b = m.board; s = -s;
    }
    const k = keyOf(b, s); if (!seen.has(k)) { seen.add(k); q.push([b, s]); }   // debyutdan keyingi pozitsiya ham
  }));
  return q;
}
function fillOne(b, s, cb) {
  const r = D(), k = keyOf(b, s), S = r.sc.all || (r.sc.all = {}), P = S[k];
  if (P && Object.values(P).some(v => v.lock)) return cb(0);   // admin qo'lda saqlagan — tegilmaydi
  const L = R.moves(b, s); if (L.length < 2) return cb(0);
  let C = null, B = null; try { C = colette()[k] || null; } catch (e) {} try { B = bookJ()[k] || null; } catch (e) {}
  let lose = {}; try { const rk = require('./kkadm.js').rank(b, s, 4); if (rk && rk.length) rk.forEach(x => { lose[x.m.from + '-' + x.m.to] = rk[0].v - x.v; }); } catch (e) {}
  const K = require('./kestoai.js'), out = []; let i = 0;
  (function next() {
    if (!FILL.run) return cb(0);
    if (i >= L.length) {
      const sc = out.filter(x => x.sc != null).map(x => x.sc), best = sc.length ? Math.max.apply(null, sc) : 0;
      const nw = {}; let n = 0; const near = out.filter(x => x.sc != null && best - x.sc <= 0.15).length, uniq = near === 1;   // '!' — faqat yagona eng yaxshi yurish
      out.forEach(x => {
        const d = x.sc == null ? 9 : best - x.sc, ls = lose[x.id] || 0, isC = C && C[0] + '-' + C[1] === x.id, isB = B && B.from != null && B.from + '-' + B.to === x.id;
        let w = Math.round(Math.max(0, 100 - d * 100) / 5) * 5; if (ls >= 1) w = 0; if (w < 20) w = 0;
        const th = isC || isB;   // nazariya/kitob yurishi: nazariyaga ishonamiz (gambit bo'lishi mumkin)
        if (th) w = ls >= 2 ? 0 : Math.max(w, w >= 80 ? 95 : 60);
        let mk = '';
        if (!th && (ls >= 1 || d >= 1)) mk = '??'; else if (!th && d >= 0.5) mk = '?'; else if (d >= 0.25) mk = '?!';
        else if (d <= 0.05 && uniq) mk = th ? '!!' : '!'; else if (th && d <= 0.1) mk = '!';
        const note = isC && isB ? 'nazariya, kitob' : isC ? 'nazariya' : isB ? 'kitob' : '';
        if (w > 0 || mk) { nw[x.id] = { w, note, mk, lock: false, src: 'dragon' }; n++; }
      });
      if (n) S[k] = nw;
      return cb(n);
    }
    const m = L[i++];
    K.pv(m.board, -s, 0.3, 1, rr => { out.push({ id: m.from + '-' + m.to, sc: rr && typeof rr.ev === 'number' ? s * rr.ev : null }); next(); });
  })();
}
let _C = null, _B = null;
function colette() { if (!_C) try { _C = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'partiyalar', 'colette_moves.json'), 'utf8')); } catch (e) { _C = {}; } return _C; }
function bookJ() { if (!_B) try { _B = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'book.json'), 'utf8')); } catch (e) { _B = {}; } return _B; }
function fillStart(by) {
  if (FILL.run) return FILL;
  try { FILL.q = fillQueue(); } catch (e) { FILL.err = e.message; return FILL; }
  Object.assign(FILL, { run: true, done: 0, total: FILL.q.length, add: 0, at: Date.now(), err: '' });
  (function step() {
    if (!FILL.run) return;
    if (global.__tRunning && global.__tRunning()) return setTimeout(step, 30000);   // turnir paytida kutadi
    const x = FILL.q.shift();
    if (!x) { FILL.run = false; const r = D(); r.hist.unshift({ at: Date.now(), by: String(by || ''), sc: 'all', k: null, why: 'Debyutlarni to‘ldirish: ' + FILL.add + ' ta yurish, ' + FILL.total + ' pozitsiya' }); store.save(); return; }
    fillOne(x[0], x[1], n => { FILL.done++; FILL.add += n; if (FILL.done % 20 === 0) store.save(); setTimeout(step, 300); });
  })();
  return FILL;
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
    if (p === '/api/kkrep/cfg') { ['depth'].forEach(k => { if (j[k] != null) r.cfg[k] = Math.max(1, Math.min(30, +j[k] || 12)); }); ['tour100', 'adapt', 'traps', 'top'].forEach(k => { if (j[k] != null) r.cfg[k] = !!j[k]; }); store.save(); return h.send(res, 200, { cfg: r.cfg }); }
    if (p === '/api/kkrep/hist') return h.send(res, 200, { list: r.hist.slice(0, 120).map((x, i) => ({ i, at: x.at, sc: x.sc, why: x.why, b: x.b, s: x.s, old: x.old ? Object.keys(x.old).length : 0, nw: x.nw ? Object.entries(x.nw).map(([id, v]) => { const [f, tt] = id.split('-').map(Number); return SQ(f) + '-' + SQ(tt) + ' ' + v.w; }).join(', ') : '—' })) });
    if (p === '/api/kkrep/suggest') return suggest(b, s, x => h.send(res, 200, x));
    if (p === '/api/kkrep/fill') { if (j.stop) { FILL.run = false; store.save(); } else if (j.start) fillStart(t.id); return h.send(res, 200, { run: FILL.run, done: FILL.done, total: FILL.total, add: FILL.add, err: FILL.err }); }
    if (p === '/api/kkrep/bk') { if (j.now) await repBackup(true); return h.send(res, 200, { list: store.db.kkRepBk || [], n: repCount() }); }
    if (p === '/api/kkrep/restore') return h.send(res, 200, await repRestore(+j.slot, t.id));
    if (p === '/api/kkrep/draw') return h.send(res, 200, importPdn('all', j.text, 'both', Math.max(2, Math.min(60, r.cfg.depth * 2)), t.id, 90, 'durang'));
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
// 🛡 Repertuar zaxirasi: har kuni alohida nusxa bazada (30 kunlik halqa), qisqarib ketsa — ogohlantirish. Asosiy saqlash: store (Postgres) + kunlik to'liq zaxira.
const repCount = () => { const r = D(); let n = 0; for (const sc of Object.keys(r.sc)) for (const k of Object.keys(r.sc[sc])) n += Object.keys(r.sc[sc][k]).length; return n; };
async function repBackup(force) {
  const r = D(), day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10), I = store.db.kkRepBk || (store.db.kkRepBk = []);
  if (!force && I.length && I[0].day === day) return null;
  const n = repCount(), last = I[0];
  if (last && last.n > 50 && n < last.n * 0.7) { try { (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean).forEach(a => require('./gcard.js').tg('sendMessage', { chat_id: a, text: '⚠️ Repertuar ' + last.n + ' dan ' + n + ' ta yurishga kamaydi. Tiklash: King Kong paneli → Repertuar → Zaxiralar.' })); } catch (e) {} }
  const slot = (I.length ? (I[0].slot + 1) : 0) % 30;
  const ok = await store.kvSet('kkrep:' + slot, { sc: r.sc, cfg: r.cfg, st: r.st, trap: r.trap });
  if (!ok) return null;
  const e = { slot, day, n, at: Date.now() }; store.db.kkRepBk = [e].concat(I.filter(x => x.slot !== slot)).slice(0, 30); store.save(); return e;
}
async function repRestore(slot, by) {
  const I = store.db.kkRepBk || [], e = I.find(x => x.slot === slot); if (!e) return { error: 'Zaxira topilmadi' };
  const v = await store.kvGet('kkrep:' + slot); let o = null; try { o = typeof v === 'string' ? JSON.parse(v) : v; } catch (x) {}
  if (!o || !o.sc) return { error: 'Zaxirani o‘qib bo‘lmadi' };
  await repBackup(true);   // hozirgi holat ham saqlanadi
  const r = D(); r.sc = o.sc; if (o.cfg) r.cfg = o.cfg; if (o.st) r.st = o.st; if (o.trap) r.trap = o.trap;
  r.hist.unshift({ at: Date.now(), by: String(by || ''), sc: 'all', k: null, why: 'Zaxiradan tiklandi: ' + e.day }); store.save();
  return { ok: true, n: repCount() };
}
{ const tm = setInterval(() => { repBackup(false).catch(() => {}); }, 3 * 3600e3); if (tm.unref) tm.unref(); const t2 = setTimeout(() => repBackup(false).catch(() => {}), 5 * 60e3); if (t2.unref) t2.unref(); }
module.exports = { repBackup, repCount, pick, result, noteOpp, set, view, tree, importBooks, importPdn, traps, handle, SCOPES };
