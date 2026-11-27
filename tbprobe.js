'use strict';
// tbprobe.js — endshpil bazasidan (engine/tb.c bilan hisoblangan) mukammal yurishni tanlash.
// Doska: 64 ta son (kkrules.js formati). Fayllar: tb/W{wm}{wk}B{bm}{bk}.bin
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const R = require('./kkrules.js');
const DIR = process.env.TB_DIR || path.join(__dirname, 'tb');
const C = []; for (let n = 0; n < 40; n++) { C.push([1]); for (let k = 1; k < 8; k++) C[n][k] = n ? C[n - 1][k - 1] + (C[n - 1][k] || 0) : 0; }
const comb = (n, k) => (k < 0 || k > n) ? 0 : C[n][k];
const S2 = []; for (let s = 0; s < 32; s++) { const r = s >> 2, c = 2 * (s & 3) + (r % 2 === 0 ? 1 : 0); S2.push(r * 8 + c); }
// ≤4 dona — server yonganda xotiraga yuklanadi; 5 dona — kerak bo'lganda diskdan o'qiladi (Render xotirasi kichik), eng ko'p ~TB_CACHE_MB (sukut 120 MB) xotirada turadi
const TB = {}, LAZY = {}; let MAXN = 0, cacheB = 0; const LRU = [];
const CAP = Math.max(1, Number(process.env.TB_CACHE_MB) || 120) * 1e6;
const PAGE = 65536, pages = new Map(); let pageBytes = 0;
function diskByte(L, offset) {
  const base = Math.floor(offset / PAGE) * PAGE, key = L.f + ':' + base;
  let p = pages.get(key);
  if (!p) {
    let fd; try { fd = fs.openSync(L.f, 'r'); const b = Buffer.allocUnsafe(PAGE); const n = fs.readSync(fd, b, 0, PAGE, base); p = b.subarray(0, n); } catch (_) { return null; } finally { if (fd !== undefined) fs.closeSync(fd); }
    while (pageBytes + p.length > Math.min(CAP, 8e6) && pages.size) { const k = pages.keys().next().value; pageBytes -= pages.get(k).length; pages.delete(k); }
    pages.set(key, p); pageBytes += p.length;
  } else { pages.delete(key); pages.set(key, p); }
  return p[offset - base] ?? null;
}
try {
  for (const f of fs.readdirSync(DIR)) {
    const m = /^W(\d)(\d)B(\d)(\d)\.bin(\.gz)?$/.exec(f); if (!m) continue;
    const key = m[1] + m[2] + m[3] + m[4], n = +m[1] + +m[2] + +m[3] + +m[4];
    if (n <= 4) { let buf = fs.readFileSync(path.join(DIR, f)); if (m[5]) buf = zlib.gunzipSync(buf); TB[key] = buf; }
    else if (!LAZY[key] || !m[5]) LAZY[key] = { f: path.join(DIR, f), gz: !!m[5] };
    MAXN = Math.max(MAXN, n);
  }
  console.log('[Endshpil bazasi]', Object.keys(TB).length + Object.keys(LAZY).length, 'bo\'lak, ≤' + MAXN, 'dona');
} catch (e) { console.log('[Endshpil bazasi] yo\'q'); }
function slice(key) {
  const t = TB[key]; if (t) { const i = LRU.indexOf(key); if (i >= 0) { LRU.splice(i, 1); LRU.push(key); } return t; }
  const L = LAZY[key]; if (!L) return null;
  let buf; try { buf = fs.readFileSync(L.f); if (L.gz) buf = zlib.gunzipSync(buf, { maxOutputLength: Math.floor(CAP) }); } catch (e) { return null; }
  TB[key] = buf; LRU.push(key); cacheB += buf.length;
  while (cacheB > CAP && LRU.length > 1) { const k = LRU.shift(); cacheB -= TB[k].length; delete TB[k]; }
  return buf;
}
const rank = (p) => { let x = 0; for (let i = 0; i < p.length; i++) x += comb(p[i], i + 1); return x; };
// qiymat (stm nuqtai nazaridan): 0 durang, 1..127 yutadi (d yarim yurish), 128..254 yutqazadi
function value(b, side) {
  const wm = [], wk = [], bm = [], bk = [];
  for (let s = 0; s < 32; s++) { const p = b[S2[s]]; if (p === 1) wm.push(s - 4); else if (p === 2) wk.push(s); else if (p === -1) bm.push(s); else if (p === -2) bk.push(s); }
  if (side > 0 && !wm.length && !wk.length) return 128;
  if (side < 0 && !bm.length && !bk.length) return 128;
  const key = '' + wm.length + wk.length + bm.length + bk.length;
  if (wm.some(x => x < 0) || bm.some(x => x >= 28)) return null;
  const L = LAZY[key];
  const nwk = comb(32, wk.length), nbm = comb(28, bm.length), nbk = comb(32, bk.length);
  let i = rank(wm); i = i * nwk + rank(wk); i = i * nbm + rank(bm); i = i * nbk + rank(bk);
  const offset = i * 2 + (side > 0 ? 0 : 1);
  if (L && !L.gz) return diskByte(L, offset);
  const t = slice(key); return t ? (t[offset] ?? null) : null;
}
const count = b => b.reduce((n, v) => n + (v ? 1 : 0), 0);
// eng yaxshi yurish: yutishda eng tez, yutqazishda eng uzoq, durangda — durang saqlaydigan
function best(b, side) {
  if (!MAXN || count(b) > MAXN) return null;
  const me = value(b, side); if (me == null || me === 255) return null;
  const ms = R.moves(b, side); if (!ms.length) return null;
  let pick = null, score = -1e9;
  for (const m of ms) {
    const v = value(m.board, -side); if (v == null || v === 255) return null;
    // bolaning qiymati raqib nuqtai nazaridan: yutqazsa — biz yutamiz
    let sc;
    if (v >= 128) sc = 1000 - (v - 128);        // raqib yutqazadi: tezroq yaxshi
    else if (v === 0) sc = 0;                  // durang
    else sc = -1000 + v;                       // raqib yutadi: uzoqroq yaxshi
    if (sc > score) { score = sc; pick = m; }
  }
  if ((me >= 128 && score >= 0) || (me === 0 && score !== 0) || (me > 0 && me < 128 && score <= 0)) return null;
  return pick ? { from: pick.from, to: pick.to, path: pick.path, caps: pick.caps, res: me >= 128 ? 'loss' : me === 0 ? 'draw' : 'win', d: me === 0 ? 0 : me >= 128 ? me - 128 : me } : null;
}
module.exports = { best, value, ready: () => MAXN > 0, max: () => MAXN };
