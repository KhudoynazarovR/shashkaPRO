'use strict';
// reelgen.js — 🎬 Instagram Reels: har kuni damki masalasidan musiqali video (1080×1920) yasab, adminlarga Telegram'da yuboradi.
// 04:00 (Toshkent) — navbatdagi masaladan video yasaladi, 09:00 — adminlarga video + nusxalanadigan izoh.
// Navbat: dk_import.json dagi o'rta/qiyin «oq yutadi» masalalari, yechim oxirida qorada dona yoki yurish qolmaydiganlari.
// Kadrlar xom RGB buferda yig'iladi (fon/doska/donalar/yozuvlar bir marta sharp bilan chiziladi) va ffmpeg'ga oqim bilan uzatiladi.
// Admin: /reel (hozir yangisi), /reel <raqam>, /reel navbat, /reel on|off
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const store = require('./store.js');
const W = 1080, H = 1920, FPS = 30, BS = 936, BX = 72, BY = 500, C = 117;   // chizma koordinatalari (1080×1920)
const Z = 2 / 3, W2 = 720, H2 = 1280;   // haqiqiy kadr 720×1280 — server RAMi uchun (Instagram uchun yetarli)
const FONT = 'DejaVu Sans, Arial, sans-serif';
const LV = { 1: ['OSON', '#22c55e'], 2: ['O‘RTA', '#f59e0b'], 3: ['QIYIN', '#ef4444'] };
const USED0 = [167, 1529];   // Instagram'ga qo'lda joylanganlar
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const xml = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sq = (r, c) => 'abcdefgh'[c] + (8 - r);
function FF() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try { const p = require('ffmpeg-static'); if (p && fs.existsSync(p)) return p; } catch (e) {}
  return 'ffmpeg';
}

// ---------- masalalar
let DK = null;
function data() { if (!DK) { try { DK = JSON.parse(fs.readFileSync(path.join(__dirname, 'dk_import.json'), 'utf8')); } catch (e) { DK = []; } } return DK; }
function board(s) { const b = []; let k = 0; for (let r = 0; r < 8; r++) { b.push([]); for (let c = 0; c < 8; c++) b[r].push((r + c) % 2 ? '.wbWB'.indexOf(s.charAt(k++)) : 0); } return b; }
// yechimni yurishlarga ajratadi: [{ white, path:[[r,c]..], caps:[[r,c]..], note }]
function moves(d) {
  const st = []; for (let i = 0; i + 3 < d[4].length; i += 4) st.push([+d[4][i], +d[4][i + 1], +d[4][i + 2], +d[4][i + 3]]);
  return movesB(board(d[3]), st);
}
function movesB(b0, st) {   // b0: 8×8 (1 oq, 2 qora, 3 oq damka, 4 qora damka), st: [[fr,fc,tr,tc]…]
  const b = b0.map(r => r.slice());
  const out = []; let cur = null, dead = [];
  for (const [fr, fc, tr, tc] of st) {
    const p = b[fr][fc]; if (!p) return null;
    const white = p === 1 || p === 3, dr = tr > fr ? 1 : -1, dc = tc > fc ? 1 : -1; let cap = null;
    for (let r = fr + dr, c = fc + dc; r !== tr; r += dr, c += dc) if (b[r][c] && !dead.some(x => x[0] === r && x[1] === c)) cap = [r, c];
    if (cur && cur.open && cur.path[cur.path.length - 1][0] === fr && cur.path[cur.path.length - 1][1] === fc && cur.white === white) cur.path.push([tr, tc]);
    else { if (cur) { for (const x of dead) b[x[0]][x[1]] = 0; dead = []; } cur = { white, path: [[fr, fc], [tr, tc]], caps: [], open: false }; out.push(cur); }
    b[tr][tc] = p === 1 && tr === 0 ? 3 : p === 2 && tr === 7 ? 4 : p; b[fr][fc] = 0;
    if (cap) { cur.caps.push(cap); dead.push(cap); cur.open = true; } else cur.open = false;
  }
  for (const m of out) m.note = m.path.map(x => sq(x[0], x[1])).join(m.caps.length ? ':' : '-');
  return out;
}
function finalBoard(d, mv) {
  const b = board(d[3]);
  for (const m of mv) { const [r0, c0] = m.path[0]; let p = b[r0][c0]; b[r0][c0] = 0; for (const [r] of m.path.slice(1)) { if (p === 1 && r === 0) p = 3; if (p === 2 && r === 7) p = 4; } const e = m.path[m.path.length - 1]; b[e[0]][e[1]] = p; for (const [r, c] of m.caps) b[r][c] = 0; }
  return b;
}
function blackMoves(b) {
  let n = 0; const ins = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c]; if (p !== 2 && p !== 4) continue;
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const r1 = r + dr, c1 = c + dc; if (!ins(r1, c1)) continue;
      if (!b[r1][c1] && (p === 4 || dr === 1)) n++;
      if ((b[r1][c1] === 1 || b[r1][c1] === 3) && ins(r1 + dr, c1 + dc) && !b[r1 + dr][c1 + dc]) n++;
      if (p === 4) { let rr = r1, cc = c1; while (ins(rr, cc) && !b[rr][cc]) { rr += dr; cc += dc; } if (ins(rr, cc) && (b[rr][cc] === 1 || b[rr][cc] === 3) && ins(rr + dr, cc + dc) && !b[rr + dr][cc + dc]) n++; }
    }
  }
  return n;
}
function info(d) {
  const mv = moves(d); if (!mv || !mv.length) return null;
  const b = board(d[3]);
  mv.forEach(m => { m.me = m.white; });
  return { id: d[0], label: 'Damki №' + d[0], side: 'w', lvl: d[1], goal: d[2], author: d[5] || '', b, mv, wm: mv.length && mv.filter(m => m.white).length, pieces: b.flat().filter(Boolean).length };
}
function cleanWin(d, I) {
  if (!I || I.goal !== 'w' || !I.mv[I.mv.length - 1].white) return false;
  const f = finalBoard(d, I.mv); return !f.flat().some(x => x === 2 || x === 4) || blackMoves(f) === 0;
}
// platformadagi istalgan masaladan (admin tanlaydi): { id, title, board, side, sol|sols, level, goal, author }
function infoPz(pz) {
  const st = (pz.sol && pz.sol.length ? pz.sol : (pz.sols || [])[0]) || [];
  if (!Array.isArray(pz.board) || pz.board.length !== 8 || !st.length) return null;
  const b = pz.board.map(r => r.map(v => Number(v) || 0)), side = pz.side === 'b' ? 'b' : 'w';
  const mv = movesB(b, st.map(x => x.map(Number))); if (!mv || !mv.length) return null;
  mv.forEach(m => { m.me = m.white === (side === 'w'); });
  return { id: String(pz.id), pid: String(pz.id), label: String(pz.title || pz.id), side, lvl: Math.max(1, Math.min(3, Number(pz.level) || 2)), goal: pz.goal === 'draw' ? 'd' : 'w',
    author: pz.author || '', b, mv, wm: mv.filter(m => m.me).length, pieces: b.flat().filter(Boolean).length };
}
const who = I => I.side === 'b' ? 'Qora' : 'Oq';
let Q = null;
function queueAll() {
  if (!Q) Q = data().map(d => [d, info(d)]).filter(([d, I]) => I && I.lvl >= 2 && cleanWin(d, I)).sort((a, b) => a[1].wm - b[1].wm || a[0][0] - b[0][0]).map(x => x[0][0]);
  return Q;
}
function S() { const s = store.db.reel = store.db.reel || {}; if (s.on === undefined) s.on = true; s.used = s.used || USED0.slice(); s.usedP = s.usedP || []; s.done = s.done || {}; return s; }
// Reel'i yasalgan masalalar (platforma id'lari) — ro'yxatda 🎬 belgisi uchun
function usedIds() { const s = S(), o = new Set(s.usedP); for (const n of s.used) o.add('dk' + Number(n).toString(36)); return [...o]; }
function markUsed(I) { const s = S(); if (I.pid) { if (!s.usedP.includes(I.pid)) s.usedP.push(I.pid); const m = /^dk([0-9a-z]+)$/.exec(I.pid); if (m) { const n = parseInt(m[1], 36); if (!s.used.includes(n)) s.used.push(n); } } else if (!s.used.includes(I.id)) s.used.push(I.id); if (s.usedP.length > 3000) s.usedP.splice(0, s.usedP.length - 3000); }
const left = () => { const u = new Set(S().used); return queueAll().filter(id => !u.has(id)); };

// ---------- chizish (xom RGB)
function sharp() { const s = require('sharp'); try { s.cache(false); } catch (e) {} return s; }
async function rgba(svg) { const { data, info } = await sharp()(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { w: info.width, h: info.height, d: data }; }
async function rgb(svg) { const { data } = await sharp()(Buffer.from(svg)).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return data; }
function blit(dst, s, x0, y0, mul) {
  x0 = Math.round(x0 * Z); y0 = Math.round(y0 * Z); const m = mul == null ? 1 : mul;
  for (let y = 0; y < s.h; y++) {
    const Y = y0 + y; if (Y < 0 || Y >= H2) continue;
    for (let x = 0; x < s.w; x++) {
      const X = x0 + x; if (X < 0 || X >= W2) continue;
      const si = (y * s.w + x) * 4, a = s.d[si + 3] * m; if (a < 1) continue;
      const di = (Y * W2 + X) * 3, k = a / 255, j = 1 - k;
      dst[di] = s.d[si] * k + dst[di] * j; dst[di + 1] = s.d[si + 1] * k + dst[di + 1] * j; dst[di + 2] = s.d[si + 2] * k + dst[di + 2] * j;
    }
  }
}
function fill(dst, x0, y0, w, h, col) { x0 = Math.round(x0 * Z); y0 = Math.round(y0 * Z); w = Math.round(w * Z); h = Math.round(h * Z); for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * W2 + x) * 3; dst[i] = col[0]; dst[i + 1] = col[1]; dst[i + 2] = col[2]; } }
const svgOpen = (w, h) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(w * Z) + '" height="' + Math.round(h * Z) + '" viewBox="0 0 ' + w + ' ' + h + '">';
const txt = (x, y, s, size, col, bold, stroke) => '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + size + '"' + (bold ? ' font-weight="700"' : '') + ' fill="' + col + '" text-anchor="middle"' + (stroke ? ' stroke="#14082e" stroke-width="' + stroke + '" paint-order="stroke" stroke-linejoin="round"' : '') + '>' + xml(s) + '</text>';
const SP = 140, R = C * 0.38;   // dona rasmi o'lchami
function pieceSvg(white, king, ring) {
  const c = SP / 2;
  return svgOpen(SP, SP) + '<circle cx="' + (c + 4) + '" cy="' + (c + 9) + '" r="' + R + '" fill="#000" fill-opacity="0.35"/>' +
    (white ? '<circle cx="' + c + '" cy="' + c + '" r="' + R + '" fill="#eeeeea" stroke="#969696" stroke-width="4"/><circle cx="' + c + '" cy="' + c + '" r="' + R * 0.62 + '" fill="none" stroke="#bebeba" stroke-width="4"/>'
      : '<circle cx="' + c + '" cy="' + c + '" r="' + R + '" fill="#222226" stroke="#000" stroke-width="4"/><circle cx="' + c + '" cy="' + c + '" r="' + R * 0.62 + '" fill="none" stroke="#505056" stroke-width="4"/>') +
    (king ? txt(c, c + R * 0.36, 'K', Math.round(R), '#f5b72b', true) : '') +
    (ring ? '<circle cx="' + c + '" cy="' + c + '" r="' + (R + 8) + '" fill="none" stroke="#ef4444" stroke-width="8"/>' : '') + '</svg>';
}
async function assets(lvl, title) {
  const [nm, col] = LV[lvl] || LV[2], A = { spr: {}, txt: new Map() };
  let g = svgOpen(W, H) + '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a7a"/><stop offset="1" stop-color="#12082e"/></linearGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>' +
    '<rect x="' + (BX - 22) + '" y="' + (BY - 22) + '" width="' + (BS + 44) + '" height="' + (BS + 44) + '" rx="26" fill="' + col + '"/>' +
    '<rect x="' + (BX - 12) + '" y="' + (BY - 12) + '" width="' + (BS + 24) + '" height="' + (BS + 24) + '" rx="18" fill="#7a4016"/>';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g += '<rect x="' + (BX + c * C) + '" y="' + (BY + r * C) + '" width="' + C + '" height="' + C + '" fill="' + ((r + c) % 2 ? '#7b2f13' : '#f3bb86') + '"/>';
  const pw = nm.length * 30 + 68;
  g += '<rect x="' + (W - pw) / 2 + '" y="222" width="' + pw + '" height="60" rx="30" fill="' + col + '"/>' + txt(W / 2, 266, nm, 40, '#fff', true) + txt(W / 2, 360, title, 68, '#ffd54a', true, 6) + '</svg>';
  A.base = await rgb(g);
  for (const w of [0, 1]) for (const k of [0, 1]) for (const r of [0, 1]) A.spr[w + '' + k + r] = await rgba(pieceSvg(w, k, r));
  A.hl = await rgba(svgOpen(C, C) + '<rect x="8" y="8" width="' + (C - 16) + '" height="' + (C - 16) + '" fill="none" stroke="#50dc78" stroke-width="8"/></svg>');
  A.strip = async (key, size, col, bold, stroke, hgt) => {   // bir qatorli yozuv (kesh)
    const k = key + '|' + size + col; if (!A.txt.has(k)) A.txt.set(k, await rgba(svgOpen(W, hgt || 100) + txt(W / 2, Math.round((hgt || 100) * 0.68), key, size, col, bold, stroke) + '</svg>'));
    return A.txt.get(k);
  };
  return A;
}
async function endCard(goal, side) {
  const L = [[600, goal === 'w' ? (side === 'b' ? 'Qora yutdi!' : 'Oq yutdi!') : 'Durang!', 110, '#ffd54a', 1], [740, 'Siz topdingizmi?', 62, '#fff', 1], [820, 'Izohga yozing ⬇', 52, '#cdc3ff', 0],
    [990, 'Har kuni yangi masalalar', 54, '#fff', 1], [1070, 'Telegram: @Draughts_uz', 56, '#ffd54a', 1], [1215, 'O‘ynash:', 48, '#cdc3ff', 0],
    [1305, '@DraughtsPRObot', 80, '#fff', 1], [1460, 'Do‘stingizga yuboring — u topa oladimi?', 40, '#cdc3ff', 0]];
  return rgba(svgOpen(W, H) + '<rect width="' + W + '" height="' + H + '" fill="#10062c" fill-opacity="0.93"/>' + L.map(x => txt(W / 2, x[0], x[1], x[2], x[3], x[4], 6)).join('') + '</svg>');
}

// ---------- video
const ease = t => t * t * (3 - 2 * t);
const ctr = p => [BX + p[1] * C + C / 2, BY + p[0] * C + C / 2];
const RSS_MAX = Number(process.env.REEL_RSS_MAX || 340) * 1e6;   // server RAMi bundan yuqori bo'lsa video yasalmaydi (kutadi)
const RSS_MAN = Number(process.env.REEL_RSS_MANUAL || 380) * 1e6;   // admin qo'lda so'raganda (512 MB dan ~130 MB zaxira)
const ramOk = lim => process.memoryUsage().rss < (lim || RSS_MAX);
function freeRam() { try { require('./memguard.js').clear(); } catch (e) {} try { if (global.gc) global.gc(); } catch (e) {} }
async function make(id, out, lim) {   // id: damki raqami yoki tayyor info (infoPz)
  if (!ramOk(lim)) throw new Error('RAM band (' + Math.round(process.memoryUsage().rss / 1e6) + ' MB) — keyinroq urinib ko‘ring');
  let I, mseed = 0;
  if (id && typeof id === 'object' && !Array.isArray(id) && id.mv) { I = id; mseed = [...String(I.id)].reduce((a, c) => a + c.charCodeAt(0), 0); id = 'p' + String(I.id).replace(/[^\w-]/g, '').slice(0, 24); }
  else {
    const d = Array.isArray(id) ? id : data().find(x => x[0] === Number(id)); if (!d) throw new Error('Masala topilmadi: ' + id); if (Array.isArray(id)) id = 'k' + d[0];
    I = info(d); if (!I) throw new Error('Yechimni o‘qib bo‘lmadi: ' + id); mseed = Number(d[0]) || 0;
  }
  const draw = I.goal === 'd', title = draw ? who(I) + ' yuradi — durang' : who(I) + ' yuradi va yutadi', hint = draw ? 'Durangni toping' : I.wm + ' yurishda';
  const A = await assets(I.lvl, title), END = await endCard(I.goal, I.side);
  const state = new Map(); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const v = I.b[r][c]; if (v) state.set(r * 8 + c, [v === 1 || v === 3, v === 3 || v === 4]); }
  // javob qismi ~24 soniyadan oshmasin
  const est = I.mv.reduce((s, m) => s + (m.me ? 1.55 : 1.05) + (m.path.length - 1) * 0.5, 0), K = Math.max(0.5, Math.min(1, 24 / est));
  const ff = FF(), tmp = path.join(os.tmpdir(), 'reel_' + id + '_' + Date.now()), vid = tmp + '_v.mp4';
  const p = spawn(ff, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', W2 + 'x' + H2, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '21', '-threads', '1', '-x264-params', 'rc-lookahead=0:sync-lookahead=0', '-pix_fmt', 'yuv420p', vid], { stdio: ['pipe', 'ignore', 'pipe'] });
  let perr = ''; p.stderr.on('data', x => { perr += x; }); const done = new Promise(res => { p.on('close', res); p.on('error', e => { perr += e.message; res(-1); }); }); p.stdin.on('error', () => {});
  let n = 0, cover = null; const pool = [0, 1, 2].map(() => Buffer.alloc(W2 * H2 * 3)), pend = [null, null, null];   // 3 ta bufer aylanadi — RAM tejaladi
  async function frame(o) {
    o = o || {}; const pi = n % 3; if (pend[pi]) await pend[pi]; const f = pool[pi]; A.base.copy(f);
    if (o.note) blit(f, await A.strip(o.note, 48, '#fff', 1, 5), 0, 372);
    else if (o.hint !== false) blit(f, await A.strip(hint + ' · topa olasizmi?', 44, '#fff', 0, 4), 0, 372);
    for (const h of o.hl || []) blit(f, A.hl, BX + h[1] * C, BY + h[0] * C);
    for (const [k, [w, kg]] of state) {
      if (o.mov && k === o.mov.k) continue;
      const fad = o.fading && o.fading.has(k), mk = fad || (o.marked && o.marked.has(k)), [x, y] = ctr([k >> 3, k & 7]);
      blit(f, A.spr[(w ? 1 : 0) + '' + (kg ? 1 : 0) + (mk ? 1 : 0)], x - SP / 2, y - SP / 2, fad ? o.fade : 1);
    }
    if (o.mov) blit(f, A.spr[(o.mov.w ? 1 : 0) + '' + (o.mov.kg ? 1 : 0) + '0'], o.mov.x - SP / 2, o.mov.y - SP / 2);
    if (o.timer) {
      const y = BY + BS + 40, x1 = Math.max(22, Math.round(BS * o.timer[0]));
      fill(f, BX, y, BS, 22, [60, 40, 110]); fill(f, BX, y, x1, 22, [255, 213, 74]);
      blit(f, await A.strip('Pauza qiling va o‘ylang · ' + o.timer[1], 44, '#fff', 1, 4), 0, y + 26);
    } else if (o.sub) blit(f, await A.strip(o.sub, 48, '#ffd54a', 1, 4), 0, BY + BS + 30);
    else blit(f, await A.strip('shashkapro.uz  ·  @DraughtsPRObot', 34, '#cdc3ff', 0, 0), 0, BY + BS + 30);
    if (o.end) blit(f, END, 0, 0, o.end);
    n++; if (n === Math.round(FPS * 2.5)) cover = Buffer.from(f);
    pend[pi] = new Promise(r => p.stdin.write(f, () => r()));
  }
  const hold = async (sec, o) => { for (let i = 0, m = Math.round(sec * FPS); i < m; i++) await frame(o); };
  await hold(1.2);
  const TT = 6; for (let i = 0, m = TT * FPS; i < m; i++) await frame({ timer: [1 - i / m, Math.ceil(TT - i / FPS)] });
  await hold(0.7, { sub: 'JAVOB ⬇', hint: false });
  let wn = 0;
  for (const m of I.mv) {
    const p0 = m.path[0], k0 = p0[0] * 8 + p0[1], pc = state.get(k0); if (!pc) break;
    const w = pc[0]; let kg = pc[1]; if (m.me) wn++;
    const note = (m.me ? wn + '. ' : wn + '… ') + m.note + (m.me ? '!' : ''), sp = (m.me ? 0.42 : 0.34) * K;
    await hold(0.25 * K, { note, hl: [p0] });
    const caps = new Set();
    for (let i = 1; i < m.path.length; i++) {
      const a = m.path[i - 1], b = m.path[i], A0 = ctr(a), B0 = ctr(b), len = Math.abs(b[0] - a[0]);
      for (const cp of m.caps) if (Math.min(a[0], b[0]) < cp[0] && cp[0] < Math.max(a[0], b[0]) && (cp[0] - a[0]) * (b[1] - a[1]) === (cp[1] - a[1]) * (b[0] - a[0])) caps.add(cp[0] * 8 + cp[1]);
      const nn = Math.max(4, Math.round((sp + 0.06 * (len - 1)) * FPS));
      for (let j = 0; j <= nn; j++) { const t = ease(j / nn); await frame({ note, hl: [p0], marked: caps, mov: { k: k0, w, kg, x: A0[0] + (B0[0] - A0[0]) * t, y: A0[1] + (B0[1] - A0[1]) * t - Math.sin(t * Math.PI) * (m.caps.length ? 36 : 0) } }); }
      if ((w && b[0] === 0) || (!w && b[0] === 7)) kg = true;   // zanjir o'rtasida damka
      await hold(0.08, { note, hl: [p0], marked: caps, mov: { k: k0, w, kg, x: B0[0], y: B0[1] } });
    }
    const e = m.path[m.path.length - 1]; state.delete(k0); state.set(e[0] * 8 + e[1], [w, kg]);
    const nn = Math.round(0.4 * FPS); for (let j = 0; j <= nn; j++) await frame({ note, hl: [e], fading: caps, fade: 1 - j / nn });
    for (const k of caps) state.delete(k);
    await hold((m.me ? 0.8 : 0.45) * K, { note, hl: [e] });
  }
  await hold(1.0, { note: draw ? 'Durang!' : who(I) + ' yutdi!' });
  for (let j = 0, m = Math.round(0.6 * FPS); j <= m; j++) await frame({ end: j / m, hint: false });
  await hold(3.8, { end: 1, hint: false });
  await Promise.all(pend.filter(Boolean)); p.stdin.end(); const code = await done;
  if (code !== 0) throw new Error('ffmpeg: ' + perr.slice(-300));
  const dur = n / FPS, mus = path.join(__dirname, 'reel_music', 'm' + (mseed % 4) + '.m4a');
  const args = ['-y', '-v', 'error', '-i', vid];
  if (fs.existsSync(mus)) args.push('-i', mus, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-af', 'afade=t=in:d=0.5,afade=t=out:st=' + Math.max(0, dur - 1.8).toFixed(2) + ':d=1.8', '-shortest');
  else args.push('-c', 'copy');
  args.push('-movflags', '+faststart', out);
  const c2 = await new Promise(res => { const q = spawn(ff, args, { stdio: 'ignore' }); q.on('close', res); q.on('error', () => res(-1)); });
  try { fs.unlinkSync(vid); } catch (e) {}
  if (c2 !== 0) throw new Error('ffmpeg (musiqa) xato');
  const coverJpg = cover ? await sharp()(cover, { raw: { width: W2, height: H2, channels: 3 } }).resize(180, 320).jpeg({ quality: 85 })   /* Telegram: muqova ≤320px */.toBuffer() : null;
  return { file: out, dur, I, cover: coverJpg };
}
function caption(I) {
  const lv = (LV[I.lvl] || LV[2])[0], lvn = lv.charAt(0) + lv.slice(1).toLowerCase(), draw = I.goal === 'd';
  const w = who(I).toLowerCase();
  return '🧩 ' + lvn + ' masala: ' + (draw ? w + ' yuradi — durang' : w + ' yuradi va yutadi — ' + I.wm + ' yurishda') + '!\n' +
    'Videoni to‘xtating va o‘ylang 🤔 Javobni izohga yozing ⬇️\nDo‘stingizga yuboring — u topa oladimi?\n\n' +
    'Har kuni yangi masalalar — Telegram: @Draughts_uz\nO‘ynash: @DraughtsPRObot\n' + (I.author ? 'Muallif: ' + I.author + '\n' : '') +
    '\n#shashka #shashki #шашки #русскиешашки #checkers #draughts #masala #uzbekistan #shashkapro';
}

// ---------- yuborish
async function sendVideo(chat, r) {
  const T0 = process.env.BOT_TOKEN; if (!T0) return null;
  const fd = new FormData();
  fd.append('chat_id', String(chat)); fd.append('supports_streaming', 'true'); fd.append('width', String(W2)); fd.append('height', String(H2)); fd.append('duration', String(Math.round(r.dur)));
  fd.append('caption', '🎬 Bugungi Reel · ' + (LV[r.I.lvl] || LV[2])[0] + ' · ' + (r.I.label || 'Damki №' + r.I.id) + ' · ' + Math.round(r.dur) + ' soniya\nSaqlang (⋮ → Save to gallery) va Instagram’da ＋ → REEL orqali joylang. Izoh — keyingi xabarda (bosib nusxalang).');
  fd.append('video', new Blob([fs.readFileSync(r.file)], { type: 'video/mp4' }), 'reel_' + String(r.I.id).replace(/[^\w-]/g, '') + '.mp4');
  if (r.cover) fd.append('thumbnail', new Blob([r.cover], { type: 'image/jpeg' }), 'cover.jpg');
  const j = await fetch('https://api.telegram.org/bot' + T0 + '/sendVideo', { method: 'POST', body: fd }).then(x => x.json()).catch(e => ({ ok: false, description: e.message }));
  if (j && j.ok) await tg('sendMessage', { chat_id: chat, text: '<pre>' + xml(caption(r.I)) + '</pre>', parse_mode: 'HTML' });
  return j;
}
let busy = false, pend = null;
// ⏳ RAM band bo'lsa — navbatga: har daqiqada tekshiramiz, bo'shashi bilan yasab yuboramiz
setInterval(() => { if (!pend || busy) return; freeRam(); if (!ramOk(RSS_MAN)) return; const q = pend; pend = null; produce(q.id, q.to).then(m => { if (m) for (const a of (q.to || ADM())) require('./gcard.js').tg('sendMessage', { chat_id: a, text: m }).catch(() => {}); }); }, 60000).unref();
async function produce(id, to) {   // id yo'q bo'lsa — navbatdagisi
  if (busy) return '⏳ Video hozir yasalmoqda, biroz kuting';
  if (!ramOk(RSS_MAN)) { freeRam(); if (!ramOk(RSS_MAN)) { pend = { id, to }; return '⏳ Server xotirasi band (' + Math.round(process.memoryUsage().rss / 1e6) + ' MB). Reel navbatga qo‘yildi — xotira bo‘shashi bilan yasalib, sizga yuboriladi.'; } }
  busy = true;
  const s = S(), pid = id || left()[0], fn = 'reel_' + (typeof pid === 'object' ? 'p' + String(pid.id).replace(/[^\w-]/g, '').slice(0, 24) : pid) + '.mp4';
  try {
    if (!pid) return '📭 Navbatda masala qolmadi';
    const t0 = Date.now(), r = await make(pid, path.join(os.tmpdir(), fn), RSS_MAN);
    let ok = 0; for (const a of (to || ADM())) { const j = await sendVideo(a, r); if (j && j.ok) ok++; else console.log('[reel] sendVideo:', j && j.description); }
    try { fs.unlinkSync(r.file); } catch (e) {}
    if (ok) markUsed(r.I);
    store.save();
    console.log('[reel]', r.I.label || r.I.id, Math.round(r.dur) + 's video,', Math.round((Date.now() - t0) / 1000) + 's da yasaldi, yuborildi:', ok);
    return ok ? '' : '⚠️ Video yasaldi, lekin yuborib bo‘lmadi';
  } catch (e) { console.log('[reel]', e.message); return '⚠️ Reel xatosi: ' + e.message.slice(0, 300); }
  finally { busy = false; }
}

// ---------- jadval: 04:00 tayyorlanadi (oldindan tekshirish), 09:00 yuboriladi
function hm() { return new Date(Date.now() + 5 * 3600e3).toISOString(); }
let ready = null;   // { day, r }
async function tick() {
  const s = S(); if (!s.on || !process.env.BOT_TOKEN || !ADM().length || busy) return;
  const t = hm(), day = t.slice(0, 10), h = t.slice(11, 16);
  try {
    if (h >= '04:00' && h < '08:55' && !s.done['g' + day] && (!ready || ready.day !== day) && ramOk()) {   // RAM band bo'lsa — keyingi daqiqada
      s.done['g' + day] = 1; store.save();
      const pid = left()[0]; if (!pid) return;
      busy = true;
      try { ready = { day, r: await make(pid, path.join(os.tmpdir(), 'reel_' + pid + '.mp4')) }; console.log('[reel] tayyor:', pid); }
      catch (e) { console.log('[reel] 04:00:', e.message); } finally { busy = false; }
    }
    if (h >= '09:00' && !s.done['s' + day]) {
      s.done['s' + day] = 1; store.save();
      if (ready && ready.day === day && fs.existsSync(ready.r.file)) {
        let ok = 0; for (const a of ADM()) { const j = await sendVideo(a, ready.r); if (j && j.ok) ok++; }
        if (ok && !s.used.includes(ready.r.I.id)) s.used.push(ready.r.I.id);
        try { fs.unlinkSync(ready.r.file); } catch (e) {}
        ready = null; store.save();
      } else { const m = await produce(); if (m) for (const a of ADM()) await tg('sendMessage', { chat_id: a, text: m }); }   // server qayta ishga tushgan bo'lsa — hozir yasaydi
      for (const k of Object.keys(s.done)) if (k.slice(1) < new Date(Date.now() - 3 * 864e5 + 5 * 3600e3).toISOString().slice(0, 10)) delete s.done[k];
    }
  } catch (e) { console.log('[reel] tick:', e.message); }
}
let started = false;
function start() { if (started) return; started = true; setTimeout(tick, 60e3); setInterval(tick, 60e3).unref(); }

// ---------- admin /reel
async function cmd(msg, text) {
  if (!ADM().includes(String(msg.from && msg.from.id))) return false;
  const s = S(), a = text.trim().split(/\s+/).slice(1), c = msg.chat.id, say = t => tg('sendMessage', { chat_id: c, text: t });
  if (a[0] === 'on' || a[0] === 'off') { s.on = a[0] === 'on'; store.save(); await say(s.on ? '✅ Kunlik Reel yoqildi (09:00 da keladi)' : '⏸ Kunlik Reel to‘xtatildi'); return true; }
  if (a[0] === 'navbat') { const L = left(); await say('🎬 Reel navbati: ' + L.length + ' ta masala qoldi (jami ' + queueAll().length + ', ishlatilgan ' + s.used.length + ')\nKeyingilari: ' + L.slice(0, 5).join(', ') + '\nKunlik yuborish: ' + (s.on ? '✅ yoqilgan' : '⏸ o‘chiq')); return true; }
  if (a[0] && !/^\d+$/.test(a[0])) { await say('Foydalanish:\n/reel — hozir navbatdagi video\n/reel 1529 — aniq masaladan\n/reel navbat — qolganlar\n/reel on | off'); return true; }
  await say('🎬 Video yasalmoqda (1–3 daqiqa)…');
  const m = await produce(a[0] ? Number(a[0]) : 0, [c]); if (m) await say(m);
  return true;
}
// ---------- platformadan: masala oynasidagi «🎬 Reel» tugmasi (admin) → POST /api/reel { id }
function handle(req, res, p, h) {
  if (p !== '/api/reel' || req.method !== 'POST') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t || !ADM().includes(String(t.id))) { h.send(res, 403, { error: 'admin emassiz' }); return true; }
  h.readBody(req, 5000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const id = String(j.id || '');
    let pz = (store.db.puzzles || []).find(x => String(x.id) === id);
    if (!pz) { try { pz = require('./etudes.js').asPuzzle(id); } catch (e) {} }
    if (!pz) return h.send(res, 404, { error: 'Masala topilmadi' });
    const I = infoPz(pz); if (!I) return h.send(res, 400, { error: 'Bu masalaning yechimi yo‘q yoki o‘qib bo‘lmadi' });
    if (busy) return h.send(res, 409, { error: '⏳ Boshqa video yasalmoqda, 1–2 daqiqadan keyin urinib ko‘ring' });
    h.send(res, 200, { ok: 1, dur: Math.round(14 + I.mv.length * 1.3) });
    produce(I, [String(t.id)]).then(m => { if (m) tg('sendMessage', { chat_id: String(t.id), text: m }); });
  });
  return true;
}
module.exports = { handle, usedIds, infoPz, start, cmd, make, caption, queueAll, left, _t: { moves, cleanWin, info, tick } };
