'use strict';
// tuzoqreel.js — 🎬 Debyut tuzog'idan Instagram Reels videosi (720×1280, 30 fps).
// Admin tuzoq oynasida «Video yasash» → POST /api/tuzoq/reel { n, th } → video yasalib, botda adminga 2 ta fayl keladi:
//   1) musiqali, 2) faqat ovoz effektlari (Instagram'da trenddagi musiqani qo'yish uchun) + nusxalanadigan matn.
// Ketma-ketlik: ilgak (hal qiluvchi zarba tez ko'rsatiladi) → debyut → xato → «Topa olasizmi?» 3-2-1 → kombinatsiya
// (qurbonlar, urilgan donalar doska chetidagi qatorga uchadi, katta zarbada kamera yaqinlashadi) → yakun.
// Har kadr: tayyor fon (raw) + SVG qatlam → sharp → ffmpeg. Musiqa va effektlar shu yerda sintez qilinadi (mualliflik muammosi yo'q).
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const W = 720, H = 1280, FPS = 30, BX = 48, BY = 333, BS = 624, Q = BS / 8, SR = 44100;
const FONT = 'DejaVu Sans, Arial, sans-serif';
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const x = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function FF() { if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH; try { const p = require('ffmpeg-static'); if (p && fs.existsSync(p)) return p; } catch (e) {} return 'ffmpeg'; }
function sharp() { const s = require('sharp'); try { s.cache(false); } catch (e) {} return s; }

// ---------- tuzoqlar (tuzoq.js dagi D massivi)
let TR = null;
function traps() {
  if (TR) return TR;
  try { const s = fs.readFileSync(path.join(__dirname, 'tuzoq.js'), 'utf8'), i = s.indexOf('var D = ') + 8; let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '[') d++; else if (s[j] === ']') { d--; if (!d) break; } } TR = JSON.parse(s.slice(i, j + 1)); } catch (e) { TR = []; }
  return TR;
}
const isCap = s => Math.abs(s[0] - s[2]) > 1;
function level(t) { const sac = t.z.filter((m, k) => k % 2 === 1 && isCap(m[0])).length, zl = t.z.length; return { lv: zl >= 11 && sac >= 3 ? 3 : zl <= 5 ? 1 : 2, sac, zl }; }

// ---------- doskalar
const TH = {
  pink: ['Ilovadagi', '#f1d4cc', '#b6695f', '#3b1d12', '#e2b155'], wood: ['Yog‘och', '#ecd2a6', '#7d4f2b', '#3a2412', '#d9a85b'], green: ['Turnir yashil', '#eeeed2', '#769656', '#2f3b22', '#c9d6a3'],
  marble: ['Qora marmar', '#cfd0d6', '#24272e', '#0d0e11', '#9aa0ad'], blue: ['Ko‘k shisha', '#dcecff', '#2361c2', '#ffffff', '#3aa0ff'], purple: ['Binafsha', '#ffe9f3', '#7b4bd6', '#ffffff', '#ff2e93']
};

// ---------- vaqt jadvali
const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const lerp = (a, b, u) => a + (b - a) * u;
function init() { const b = []; for (let r = 0; r < 8; r++) { b.push([]); for (let c = 0; c < 8; c++) b[r].push((r + c) % 2 === 1 ? (r < 3 ? 2 : r > 4 ? 1 : 0) : 0); } return b; }
function plan(T) {
  const EV = [], HK = 2.4, nm = T.m.length, sp = Math.min(1, 12 / Math.max(1, nm - 1));
  let t = HK;
  T.m.forEach((m, i) => { const last = i === nm - 1; EV.push({ ph: 'deb', i, m, t0: t, dur: last ? 0.9 : 0.32 * sp, last }); t += last ? 1.4 : 0.42 * sp; });
  const tMis = EV[EV.length - 1].t0, tQ = t + 0.8, tZ = tQ + 3.2; t = tZ;
  const L = level(T);
  // eng katta zarba (g'olib tomonning eng ko'p urishli yurishi)
  let big = -1, bigN = 0; T.z.forEach((m, k) => { if (k % 2 === 0 && isCap(m[0]) && m.length > bigN) { bigN = m.length; big = k; } });
  let est = 0; T.z.forEach((m, k) => { const mul = k === big && m.length > 1; est += (mul ? 0.85 * m.length : 0.36) + (mul ? 0.8 : (k % 2 === 1 && isCap(m[0]) ? 0.7 : 0.45)); });
  const K = Math.max(0.55, Math.min(1, 24 / est));
  let sacN = 0;
  T.z.forEach((m, k) => { const multi = k === big && m.length > 1, sac = k % 2 === 1 && isCap(m[0]); if (sac) sacN++; const dur = multi ? 0.85 * m.length : 0.36 * Math.max(0.8, K); EV.push({ ph: 'z', k, m, t0: t, dur, sac: sac ? sacN : 0, multi }); t += dur + (multi ? 0.8 : (sac ? 0.7 : 0.45) * K); });
  const tEnd = t + 0.3, TOTAL = tEnd + 4.4, EM = EV.find(e => e.multi) || EV.filter(e => e.ph === 'z' && e.k % 2 === 0).pop();
  const HV0 = EM.t0 - 0.15, HV1 = EM.t0 + EM.dur + 0.25;
  const SFX = [];
  EV.forEach(e => { const n = e.m.length; for (let j = 0; j < n; j++) { const cap = isCap(e.m[j]), at = e.t0 + (j + 1) * e.dur / n; SFX.push({ t: at, k: cap ? 'cap' : 'move' }); if (cap) SFX.push({ t: at + 0.75, k: 'tok' }); } if (e.sac) SFX.push({ t: e.t0 + e.dur, k: 'sac' }); });
  for (let j = 0; j < EM.m.length; j++) { const vt = EM.t0 + (j + 1) * EM.dur / EM.m.length; SFX.push({ t: (vt - HV0) / (HV1 - HV0) * 1.9, k: 'cap' }); }
  SFX.push({ t: tMis + 0.9, k: 'bad' }); [0, 1, 2].forEach(i => SFX.push({ t: tQ + 0.2 + i, k: 'tick' })); SFX.push({ t: tEnd, k: 'win' });
  // urilgan raqib donalari
  let lostN = 0; { const b = init(); T.m.forEach(m => apply(b, m)); T.z.forEach((m, k) => { const c = apply(b, m); if (k % 2 === 0) lostN += c.length; }); }
  return { EV, HK, tMis, tQ, tZ, tEnd, TOTAL, EM, HV0, HV1, SFX, sacN, bigN: EM.m.length > 1 ? EM.m.length : 0, L, lostN };
}
function apply(b, m) {
  const caps = []; const s0 = m[0]; let v = b[s0[0]][s0[1]];
  m.forEach(s => { b[s[0]][s[1]] = 0; if (isCap(s)) { const dr = Math.sign(s[2] - s[0]), dc = Math.sign(s[3] - s[1]); for (let r = s[0] + dr, c = s[1] + dc; r !== s[2]; r += dr, c += dc) if (b[r][c]) { caps.push([r, c]); b[r][c] = 0; } } if (v === 1 && s[2] === 0) v = 3; if (v === 2 && s[2] === 7) v = 4; b[s[2]][s[3]] = v; });
  return caps;
}
const nm = (r, c) => 'abcdefgh'[c] + (8 - r);
const nota = m => nm(m[0][0], m[0][1]) + m.map(s => (isCap(s) ? ':' : '-') + nm(s[2], s[3])).join('');

// ---------- bitta kadr (SVG qatlam)
function scene(T, P, TT, th, flip) {
  const tt = TT < P.HK ? P.HV0 + Math.min(1, TT / 1.9) * (P.HV1 - P.HV0) : TT;
  const D = (r, c) => flip ? [7 - r, 7 - c] : [r, c];
  const b = init(); let mv = null; const caps = []; let camC = null, zs = 1, arrows = '';
  for (const e of P.EV) {
    if (tt < e.t0) break;
    const legs = e.m.length, prog = Math.min(1, (tt - e.t0) / e.dur); let done = Math.floor(prog * legs + 1e-9); if (prog >= 1) done = legs;
    const s0 = e.m[0]; let v = b[s0[0]][s0[1]]; b[s0[0]][s0[1]] = 0; let pr = s0[0], pc = s0[1];
    for (let j = 0; j < legs; j++) {
      const s = e.m[j];
      if (j < done) { if (isCap(s)) { const dr = Math.sign(s[2] - s[0]), dc = Math.sign(s[3] - s[1]); for (let r = s[0] + dr, c = s[1] + dc; r !== s[2]; r += dr, c += dc) if (b[r][c]) { caps.push({ r, c, v: b[r][c], tc: e.t0 + (j + 1) * e.dur / legs, big: e.multi }); b[r][c] = 0; } } pr = s[2]; pc = s[3]; }
      else if (j === done) { const u = ease(prog * legs - j); mv = { r: lerp(s[0], s[2], u), c: lerp(s[1], s[3], u), v }; }
    }
    if (prog >= 1) { if (v === 1 && pr === 0) v = 3; if (v === 2 && pr === 7) v = 4; b[pr][pc] = v; mv = null; }
    if (e.multi) {
      const lg = Math.min(legs - 1, Math.floor(Math.max(0, tt - e.t0) / e.dur * legs)), sA = e.m[lg], u = ease(Math.min(1, ((tt - e.t0) - lg * e.dur / legs) / 0.35));
      const tgt = [(sA[2] + sA[0]) / 2, (sA[3] + sA[1]) / 2], prv = lg ? [(e.m[lg - 1][2] + e.m[lg - 1][0]) / 2, (e.m[lg - 1][3] + e.m[lg - 1][1]) / 2] : tgt;
      camC = [lerp(prv[0], tgt[0], u), lerp(prv[1], tgt[1], u)];
      const zi = Math.min(1, (tt - e.t0 + 0.15) / 0.35), zo = tt > e.t0 + e.dur + 0.1 ? Math.min(1, (tt - e.t0 - e.dur - 0.1) / 0.4) : 0;
      zs = 1 + 0.42 * ease(zi) * (1 - ease(zo)); if (zo >= 1) camC = null;
      if (tt < e.t0 + e.dur + 1.2) { const pts = [[s0[0], s0[1]]].concat(e.m.map(s => [s[2], s[3]])), n = Math.min(pts.length - 1, done + 1); for (let a = 0; a < n; a++) { const A = D(pts[a][0], pts[a][1]), Z = D(pts[a + 1][0], pts[a + 1][1]); arrows += `<line x1="${(A[1] + .5) * Q}" y1="${(A[0] + .5) * Q}" x2="${(Z[1] + .5) * Q}" y2="${(Z[0] + .5) * Q}" stroke="#00f0ff" stroke-opacity=".35" stroke-width="26" stroke-linecap="round"/><line x1="${(A[1] + .5) * Q}" y1="${(A[0] + .5) * Q}" x2="${(Z[1] + .5) * Q}" y2="${(Z[0] + .5) * Q}" stroke="#bff9ff" stroke-width="10" stroke-linecap="round"/>`; } }
    }
  }
  const t1 = TH[th] || TH.purple;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<radialGradient id="pw" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f7f7f7"/><stop offset=".8" stop-color="#d6d6d6"/><stop offset="1" stop-color="#ececec"/></radialGradient>
<radialGradient id="pb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a3a3a"/><stop offset=".55" stop-color="#262626"/><stop offset=".8" stop-color="#060606"/><stop offset="1" stop-color="#1e1e1e"/></radialGradient>
<radialGradient id="gw"><stop offset=".55" stop-color="#00f0ff" stop-opacity=".9"/><stop offset="1" stop-color="#00f0ff" stop-opacity="0"/></radialGradient>
<radialGradient id="gb"><stop offset=".55" stop-color="#ff2e93" stop-opacity=".85"/><stop offset="1" stop-color="#ff2e93" stop-opacity="0"/></radialGradient>
<linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffe36e"/></linearGradient>
<linearGradient id="br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3b5c"/><stop offset="1" stop-color="#c2002a"/></linearGradient>
<linearGradient id="bo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb300"/><stop offset="1" stop-color="#ff5e00"/></linearGradient>
<linearGradient id="bc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#22c55e"/></linearGradient>
<clipPath id="clip"><rect x="0" y="0" width="${BS}" height="${BS}" rx="10"/></clipPath></defs>`;
  // doska + donalar (kamera)
  const cx = camC ? (D(camC[0], camC[1])[1] + .5) * Q : BS / 2, cy = camC ? (D(camC[0], camC[1])[0] + .5) * Q : BS / 2;
  let tx = BS / 2 - cx * zs, ty = BS / 2 - cy * zs; tx = Math.max(BS - BS * zs, Math.min(0, tx)); ty = Math.max(BS - BS * zs, Math.min(0, ty));
  let shk = 0; for (const o of caps) { const e2 = tt - o.tc; if (e2 >= 0 && e2 < 0.45) shk = Math.max(shk, (o.big ? 5 : 3) * (1 - e2 / 0.45)); }
  const sx = shk ? (Math.sin(TT * 91) * shk) : 0, sy = shk ? (Math.cos(TT * 77) * shk) : 0;
  // 🎥 doska sekin suzadi, savolda kamera yaqinlashadi, urishda chayqaladi
  const GX = BX + BS / 2, GY = BY + BS / 2, push = tt >= P.tQ && tt < P.tZ ? 1 + 0.06 * ease((tt - P.tQ) / (P.tZ - P.tQ)) : (tt >= P.tZ && tt < P.tZ + 0.4 ? 1 + 0.06 * (1 - ease((tt - P.tZ) / 0.4)) : 1);
  const DS = (1 + 0.012 * Math.sin(TT * 0.45)) * push, DR = 0.9 * Math.sin(TT * 0.6) + shk * 0.25 * Math.sin(TT * 40);
  s += `<g transform="translate(${GX},${GY}) rotate(${DR.toFixed(3)}) scale(${DS.toFixed(4)}) translate(${-GX},${-GY})">`;
  s += `<rect x="${BX - 13}" y="${BY - 13}" width="${BS + 26}" height="${BS + 26}" rx="18" fill="${t1[4]}"/><rect x="${BX - 7}" y="${BY - 7}" width="${BS + 14}" height="${BS + 14}" rx="13" fill="${t1[3]}"/>`;
  s += `<g transform="translate(${BX},${BY})" clip-path="url(#clip)"><g transform="translate(${tx + sx},${ty + sy}) scale(${zs})">`;
  s += `<rect width="${BS}" height="${BS}" fill="${t1[1]}"/>`;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) s += `<rect x="${c * Q}" y="${r * Q}" width="${Q}" height="${Q}" fill="${t1[2]}"/>`;
  const piece = (r, c, v, sc, op, flat) => { const [R, C] = D(r, c), X = (C + .5) * Q, Y = (R + .5) * Q, w = v % 2 === 1; sc = sc || 1; op = op == null ? 1 : op;
    return `<g transform="translate(${X.toFixed(1)},${Y.toFixed(1)}) scale(${sc.toFixed(3)},${(sc * (flat == null ? 1 : flat)).toFixed(3)})" opacity="${op}"><circle r="${Q * .5}" fill="url(#${w ? 'gw' : 'gb'})"/><ellipse cx="0" cy="${Q * .06}" rx="${Q * .41}" ry="${Q * .41}" fill="#000" fill-opacity=".35"/><circle r="${Q * .41}" fill="url(#${w ? 'pw' : 'pb'})"/><circle r="${Q * .26}" fill="none" stroke="${w ? '#cfcfcf' : '#3a3a3a'}" stroke-width="3"/>${v > 2 ? `<circle r="${Q * .15}" fill="none" stroke="#ffd400" stroke-width="5"/>` : ''}</g>`; };
  // xato kataklari
  if (tt >= P.tMis && tt < P.tZ) { const ms = T.m[T.m.length - 1][0]; for (const p of [[ms[0], ms[1]], [ms[2], ms[3]]]) { const [R, C] = D(p[0], p[1]); s += `<rect x="${C * Q}" y="${R * Q}" width="${Q}" height="${Q}" fill="#ff1e3c" fill-opacity="${(0.55 + 0.3 * Math.sin(tt * 12)).toFixed(2)}"/>`; } }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c]) s += piece(r, c, b[r][c]);
  s += arrows;
  for (const o of caps) { const e2 = tt - o.tc; if (e2 < 0.45) { const A2 = e2 / 0.45, [R, C] = D(o.r, o.c); s += `<circle cx="${(C + .5) * Q}" cy="${(R + .5) * Q}" r="${(35 + A2 * 55).toFixed(1)}" fill="none" stroke="#fff" stroke-width="${(4 * (1 - A2)).toFixed(2)}" stroke-opacity="${(0.8 * (1 - A2)).toFixed(2)}"/>`; } }
  if (mv) { const [R, C] = D(mv.r, mv.c), X = (C + .5) * Q, Y = (R + .5) * Q; s += `<circle cx="${X}" cy="${Y}" r="${Q * .62}" fill="url(#${mv.v % 2 ? 'gw' : 'gb'})"/>` + piece(mv.r, mv.c, mv.v, 1.15); }
  s += '</g></g></g>';
  // urilgan donalar uchib, chetdagi qatorga tushadi (kamera yaqinlashganda yashirin)
  if (zs < 1.01) {
    let nW = 0, nB = 0; const loserW = T.s === 'b';
    for (const o of caps) {
      if (TT < P.HK && !o.big) continue;
      const own = (o.v % 2 === 1) === !loserW, slot = own ? nW++ : nB++;   // own = g'olibning (qurbon) donasi — tepada
      const txs = 0.15 + slot * 0.55, tys = own ? -1.12 : 8.28, e2 = tt - o.tc, A = Math.min(1, Math.max(0, e2) / 0.8), u = ease(A), lift = Math.sin(A * Math.PI) * 0.4;
      const [R0, C0] = D(o.r, o.c), Xc = BX + (lerp(C0, txs, u) + .5) * Q, Yc = BY + (lerp(R0, tys, u) - lift * 1.6 + .5) * Q, sc = lerp(1, 0.5, u) + lift * 0.5, flat = A < 1 ? Math.abs(Math.cos(A * 3 * Math.PI)) * 0.85 + 0.15 : 1;
      const w = o.v % 2 === 1;
      s += `<g transform="translate(${Xc.toFixed(1)},${Yc.toFixed(1)}) scale(${sc.toFixed(3)},${(sc * flat).toFixed(3)})"><ellipse cx="0" cy="${(Q * (.06 + lift * .5)).toFixed(1)}" rx="${Q * .41}" ry="${Q * .41}" fill="#000" fill-opacity="${(.35 - lift * .3).toFixed(2)}"/><circle r="${Q * .41}" fill="url(#${w ? 'pw' : 'pb'})"/><circle r="${Q * .26}" fill="none" stroke="${w ? '#cfcfcf' : '#3a3a3a'}" stroke-width="3"/></g>`;
    }
  }
  // 🌑 qorong'u tushadi: xatoda va hal qiluvchi zarbadan oldin — faqat bitta dona yoritiladi; urishlarda chaqnaydi
  { let d = 0, sp = null, fl = 0; const EM = P.EM, ms = T.m[T.m.length - 1][0];
    if (TT >= P.HK && tt >= P.tMis && tt < P.tMis + 1.4) { const u = tt - P.tMis; d = u < 0.5 ? 0.72 * ease(u / 0.5) : u < 0.9 ? 0.72 : 0.72 * (1 - ease((u - 0.9) / 0.5)); sp = mv ? [mv.r, mv.c] : [ms[2], ms[3]]; if (u >= 0.9 && u < 1.15) fl = 0.35 * (1 - (u - 0.9) / 0.25); }
    const a0 = EM.t0 - 1.3, a1 = EM.t0 + EM.dur;
    if (tt >= a0 && tt < a1 + 0.45) { d = tt < EM.t0 ? 0.85 * ease((tt - a0) / 1.3) : tt < a1 ? 0.72 : 0.72 * (1 - ease((tt - a1) / 0.45)); sp = mv ? [mv.r, mv.c] : tt < EM.t0 ? [EM.m[0][0], EM.m[0][1]] : [EM.m[EM.m.length - 1][2], EM.m[EM.m.length - 1][3]];
      for (const o of caps) if (o.big) { const e2 = tt - o.tc; if (e2 >= 0 && e2 < 0.25) fl = Math.max(fl, 0.4 * (1 - e2 / 0.25)); }
      if (tt >= a1 && tt < a1 + 0.35) fl = Math.max(fl, 0.6 * (1 - (tt - a1) / 0.35)); }
    if (d > 0.01) { const [R0, C0] = D(sp[0], sp[1]); let px = BX + tx + zs * (C0 + .5) * Q, py = BY + ty + zs * (R0 + .5) * Q;
      const a = DR * Math.PI / 180, dx = (px - GX) * DS, dy = (py - GY) * DS; px = GX + dx * Math.cos(a) - dy * Math.sin(a); py = GY + dx * Math.sin(a) + dy * Math.cos(a);
      const rr = Q * 1.25 * zs * DS;
      s += `<defs><radialGradient id="spg" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rr.toFixed(1)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#spg)" opacity="${d.toFixed(3)}"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(rr * 0.9).toFixed(1)}" fill="#fff6d6" fill-opacity="${(0.1 * d).toFixed(3)}"/>`; }
    if (fl > 0.01) s += `<rect width="${W}" height="${H}" fill="#fff" opacity="${fl.toFixed(3)}"/>`;
  }
  // matnlar
  const big = (t, y, sz, op) => `<text x="${W / 2}" y="${y}" font-family="${FONT}" font-weight="900" font-size="${sz}" text-anchor="middle" fill="url(#tg)" stroke="#b3006b" stroke-width="7" stroke-linejoin="round" paint-order="stroke" opacity="${op == null ? 1 : op}">${x(t)}</text>`;
  const sub = (t, y, sz) => `<text x="${W / 2}" y="${y}" font-family="${FONT}" font-weight="800" font-size="${sz || 26}" letter-spacing="4" text-anchor="middle" fill="#00f0ff" stroke="#05203a" stroke-width="3" paint-order="stroke">${x(t)}</text>`;
  const badge = (t, g, sc) => { sc = sc || 1; const w = t.length * 25 + 60; return `<g transform="translate(${W / 2},1078) scale(${sc.toFixed(3)})"><rect x="${-w / 2}" y="-36" width="${w}" height="66" rx="18" fill="url(#${g})"/><text x="0" y="10" font-family="${FONT}" font-weight="800" font-size="38" letter-spacing="5" text-anchor="middle" fill="#fff">${x(t)}</text></g>`; };
  const midT = (t, sz) => `<text x="${W / 2}" y="1085" font-family="${FONT}" font-weight="900" font-size="${sz || 46}" text-anchor="middle" fill="#fff" stroke="#05203a" stroke-width="4" paint-order="stroke">${x(t)}</text>`;
  const Win = T.s === 'w' ? 'Oq' : 'Qora', Los = T.s === 'w' ? 'Qora' : 'Oq';
  if (TT < P.HK) {
    const a = Math.min(1, TT / 0.25), l1 = P.bigN >= 3 ? 'Bir yurishda' : P.sacN >= 3 ? P.sacN + ' ta qurbon' : P.L.zl + ' yurishli', l2 = P.bigN >= 3 ? P.bigN + ' dona!' : P.sacN >= 3 ? 'va g‘alaba!' : 'kombinatsiya!';
    s += big(l1, 125, 66, a) + big(l2, 200, 66, a) + sub('QANDAY QILIB? OXIRIGACHA KO‘RING', 262, 25);
  } else if (tt < P.tMis) {
    const cur = P.EV.filter(e => e.ph === 'deb' && e.t0 <= tt).pop(), mm = cur.m;
    s += big(T.u, 125, 48) + sub('TUZOQ #' + T.n, 180) + `<rect x="${W - 196}" y="262" width="168" height="44" rx="18" fill="#000" fill-opacity=".45" stroke="#00f0ff" stroke-width="3"/><text x="${W - 112}" y="292" font-family="${FONT}" font-weight="800" font-size="24" text-anchor="middle" fill="#00f0ff">${cur.i + 1}-yurish</text>` + midT(nota(mm));
  } else if (tt < P.tQ) {
    const ms = T.m[T.m.length - 1];
    s += big(Los + ' yuradi…', 125, 48) + `<rect x="${W - 196}" y="262" width="168" height="44" rx="18" fill="#000" fill-opacity=".45" stroke="#00f0ff" stroke-width="3"/><text x="${W - 112}" y="292" font-family="${FONT}" font-weight="800" font-size="24" text-anchor="middle" fill="#00f0ff">${T.m.length}-yurish</text>`;
    if (tt > P.tMis + 0.9) { const a2 = Math.min(1, (tt - P.tMis - 0.9) / 0.15); s += badge('XATO', 'br', 1.3 - 0.3 * a2) + `<text x="${W / 2}" y="1170" font-family="${FONT}" font-weight="900" font-size="42" text-anchor="middle" fill="#fff">${x(nota(ms))}</text>`; }
  } else if (tt < P.tZ) {
    const k3 = Math.max(1, 3 - Math.floor(Math.max(0, tt - P.tQ - 0.2))), fr = Math.max(0, tt - P.tQ - 0.2) % 1, R = 80, C2 = 2 * Math.PI * R;
    s += big(Win + ' yutadi.', 120, 60) + big('Topa olasizmi?', 192, 60) + sub(P.L.zl + ' YURISHLI KOMBINATSIYA', 252, 25);
    s += `<circle cx="${W / 2}" cy="1110" r="${R}" fill="#1b1464" stroke="#ffffff" stroke-opacity=".15" stroke-width="16"/><circle cx="${W / 2}" cy="1110" r="${R}" fill="none" stroke="#ffe36e" stroke-width="16" stroke-dasharray="${(C2 * (1 - fr)).toFixed(1)} ${C2.toFixed(1)}" transform="rotate(-90 ${W / 2} 1110)"/><text x="${W / 2}" y="1145" font-family="${FONT}" font-weight="900" font-size="${(104 * (1.25 - 0.25 * Math.min(1, fr * 4))).toFixed(0)}" text-anchor="middle" fill="#ffe36e">${k3}</text>`;
  } else if (tt < P.tEnd) {
    const cz = P.EV.filter(e => e.ph === 'z' && e.t0 <= tt).pop(), lastSac = P.EV.filter(e => e.ph === 'z' && e.sac && e.t0 + e.dur <= tt && tt < e.t0 + e.dur + 0.75).pop();
    if (cz.multi) s += big('Hal qiluvchi zarba', 125, 54) + (P.bigN >= 2 ? sub('BIR YURISHDA ' + P.bigN + ' TA DONA', 185) : '');
    else s += big('Kombinatsiya', 125, 54) + sub((cz.k + 1) + ' / ' + P.L.zl, 185);
    if (lastSac) { const a3 = Math.min(1, (tt - lastSac.t0 - lastSac.dur) / 0.12); s += badge('QURBON ' + lastSac.sac + '/' + P.sacN, 'bo', 1.25 - 0.25 * a3); }
    else s += midT(nota(cz.m), cz.multi ? 40 : 46);
  } else {
    const a4 = Math.min(1, (TT - P.tEnd) / 0.3);
    s += big(Win.toUpperCase() + ' YUTDI!', 135, 76 * (0.7 + 0.3 * a4)) + sub('TUZOQ #' + T.n + ' · ' + T.u.toUpperCase(), 192, 23);
    const st = [[P.sacN, 'qurbon'], [P.lostN, 'dona urildi'], [P.L.zl, 'yurish']], bw = 170, gx = W / 2 - (bw * 3 + 24) / 2;
    s += `<g opacity="${a4}">` + st.map((q, i) => `<rect x="${gx + i * (bw + 12)}" y="1030" width="${bw}" height="92" rx="18" fill="#000" fill-opacity=".35" stroke="#fff" stroke-opacity=".4" stroke-width="3"/><text x="${gx + i * (bw + 12) + bw / 2}" y="1076" font-family="${FONT}" font-weight="900" font-size="40" text-anchor="middle" fill="#ffe36e">${q[0]}</text><text x="${gx + i * (bw + 12) + bw / 2}" y="1108" font-family="${FONT}" font-weight="800" font-size="20" text-anchor="middle" fill="#fff">${q[1]}</text>`).join('')
      + `<text x="${W / 2}" y="1160" font-family="${FONT}" font-weight="800" font-size="27" text-anchor="middle" fill="#fff">Siz topa olardingizmi? Izohda yozing</text><rect x="40" y="1182" width="${W - 80}" height="70" rx="22" fill="url(#bc)"/><text x="${W / 2}" y="1227" font-family="${FONT}" font-weight="900" font-size="30" text-anchor="middle" fill="#04122a">Yechib ko‘ring · @DraughtsPRObot</text></g>`;
  }
  if (TT < P.tEnd) s += `<text x="${W / 2}" y="1252" font-family="${FONT}" font-weight="800" font-size="21" letter-spacing="4" text-anchor="middle" fill="#fff" fill-opacity=".85">SHASHKAPRO</text>`;
  if (tt >= P.tMis + 0.9 && tt < P.tMis + 1.25 && TT >= P.HK) s += `<rect x="0" y="${(380 + Math.sin(TT * 50) * 200).toFixed(0)}" width="${W}" height="40" fill="#ff003c" fill-opacity=".3"/><rect x="0" y="${(800 + Math.cos(TT * 43) * 150).toFixed(0)}" width="${W}" height="18" fill="#00f0ff" fill-opacity=".3"/>`;
  return s + '</svg>';
}
function bgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2=".55" y2="1"><stop offset="0" stop-color="#ff2e93"/><stop offset=".38" stop-color="#7b2ff7"/><stop offset=".7" stop-color="#1b1464"/><stop offset="1.1" stop-color="#00a8d4"/></linearGradient>
<pattern id="st" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="4" height="46" fill="#fff" fill-opacity=".05"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#st)"/></svg>`;
}

// ---------- ovoz (sintez)
function rngF(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function audio(P, withMusic) {
  const N = Math.ceil((P.TOTAL + 1) * SR), out = new Float32Array(N), mus = new Float32Array(N), R = rngF(7), gn = () => { let u = 0, v = 0; while (!u) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const add = (buf, f, at, dur, g) => { const i0 = Math.round(at * SR), n = Math.round(dur * SR); for (let i = 0; i < n && i0 + i < N; i++) if (i0 + i >= 0) buf[i0 + i] += g * f(i / SR, i); };
  const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t * d);
  if (withMusic) {
    const beat = 60 / 128, prog = [[220, [220, 261.6, 329.6]], [174.6, [174.6, 220, 261.6]], [261.6, [261.6, 329.6, 392]], [196, [196, 246.9, 293.7]]], tQ = P.tQ, tZ = P.tZ;
    let tm = 0, bi = 0;
    while (tm < P.TOTAL) {
      const [root, ch] = prog[Math.floor(tm / (4 * beat)) % 4], inQ = tm >= tQ && tm < tZ;
      if (!inQ) { let ph = 0; add(mus, t => { const f = 45 + 90 * Math.exp(-t * 30); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * Math.exp(-t * 9); }, tm, 0.35, 0.9); }
      { let prev = 0; add(mus, t => { const n = gn(), d = n - prev; prev = n; return d * env(t, 0.001, 70) * 0.5; }, tm + beat / 2, 0.05, inQ ? 0.15 : 0.35); }
      for (let k = 0; k < 2; k++) add(mus, t => (2 * ((t * root / 2) % 1) - 1) * env(t, 0.003, 6), tm + k * beat / 2, beat / 2 * 0.9, inQ ? 0.08 : 0.18);
      if (tm > 2.4) for (let k = 0; k < 4; k++) { const f = ch[(bi * 4 + k) % 3] * 2; add(mus, t => (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * env(t, 0.002, 22), tm + k * beat / 4, 0.12, inQ ? 0.05 : 0.1); }
      bi++; tm += beat;
    }
    add(mus, (t) => gn() * Math.pow(t / (tZ - tQ), 2) * 0.18, tQ, tZ - tQ, 1);
  }
  for (const e of P.SFX) {
    if (e.k === 'move') add(out, t => (Math.sin(2 * Math.PI * 1800 * t) * 0.6 + gn() * 0.4) * env(t, 0.001, 90), e.t, 0.04, 0.7);
    else if (e.k === 'cap') { let ph = 0, lp = 0; add(out, t => { const f = 50 + 70 * Math.exp(-t * 18); ph += 2 * Math.PI * f / SR; lp += 0.02 * (gn() - lp); return Math.sin(ph) * Math.exp(-t * 5) + lp * 6 * Math.exp(-t * 10); }, e.t, 0.7, 0.9); }
    else if (e.k === 'tok') add(out, t => (Math.sin(2 * Math.PI * 900 * t) * 0.6 + Math.sin(2 * Math.PI * 1500 * t) * 0.3) * Math.exp(-t * 45), e.t, 0.12, 0.35);
    else if (e.k === 'sac') add(out, t => gn() * Math.pow(Math.sin(Math.PI * t / 0.5), 2) * 0.5, e.t - 0.1, 0.5, 0.9);
    else if (e.k === 'bad') add(out, t => (Math.sign(Math.sin(2 * Math.PI * 110 * t)) * 0.35 + Math.sign(Math.sin(2 * Math.PI * 116 * t)) * 0.25) * Math.exp(-t * 3), e.t, 0.45, 0.8);
    else if (e.k === 'tick') add(out, t => Math.sin(2 * Math.PI * 1200 * t) * env(t, 0.002, 40), e.t, 0.08, 0.8);
    else if (e.k === 'win') [523.3, 659.3, 784, 1046.5].forEach((f, i) => add(out, t => (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t)) * env(t, 0.003, 3) * 0.5, e.t + i * 0.1, 1.2, 0.9));
  }
  let mm = 1e-9, mo = 1e-9; for (let i = 0; i < N; i++) { mm = Math.max(mm, Math.abs(mus[i])); mo = Math.max(mo, Math.abs(out[i])); }
  const L = Math.round(P.TOTAL * SR), fo = Math.round(1.5 * SR), pcm = Buffer.alloc(L * 2); let mx = 1e-9; const mix = new Float32Array(L);
  for (let i = 0; i < L; i++) { let v = (withMusic ? 0.55 * mus[i] / mm : 0) + 0.6 * out[i] / mo; if (i > L - fo) v *= (L - i) / fo; v = Math.tanh(v * 1.2); mix[i] = v; mx = Math.max(mx, Math.abs(v)); }
  for (let i = 0; i < L; i++) pcm.writeInt16LE(Math.round(mix[i] / (mx * 1.05) * 32767), i * 2);
  const hd = Buffer.alloc(44); hd.write('RIFF', 0); hd.writeUInt32LE(36 + pcm.length, 4); hd.write('WAVEfmt ', 8); hd.writeUInt32LE(16, 16); hd.writeUInt16LE(1, 20); hd.writeUInt16LE(1, 22); hd.writeUInt32LE(SR, 24); hd.writeUInt32LE(SR * 2, 28); hd.writeUInt16LE(2, 32); hd.writeUInt16LE(16, 34); hd.write('data', 36); hd.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([hd, pcm]);
}

// ---------- video
const run = (args) => new Promise(res => { let err = ''; const q = spawn(FF(), args, { stdio: ['ignore', 'ignore', 'pipe'] }); q.stderr.on('data', d => { err += d; }); q.on('close', c => res(c === 0 ? '' : (err.slice(-300) || 'ffmpeg ' + c))); q.on('error', e => res(e.message)); });
async function make(n, th, onFrame) {
  const T = traps().find(t => t.n === Number(n)); if (!T) throw new Error('Tuzoq topilmadi: №' + n);
  if (!T.z.length) throw new Error('Bu tuzoqda kombinatsiya yo‘q');
  const P = plan(T), flip = T.s === 'b', S = sharp(), NF = Math.ceil(P.TOTAL * FPS);
  const base = await S(Buffer.from(bgSvg())).removeAlpha().raw().toBuffer();
  const tmp = path.join(os.tmpdir(), 'tz' + T.n + '_' + Date.now()), vid = tmp + '_v.mp4';
  const p = spawn(FF(), ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', W + 'x' + H, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '1', vid], { stdio: ['pipe', 'ignore', 'pipe'] });
  let perr = ''; p.stderr.on('data', d => { perr += d; }); const done = new Promise(r => { p.on('close', r); p.on('error', e => { perr += e.message; r(-1); }); }); p.stdin.on('error', () => {});
  let cover = null;
  for (let i = 0; i < NF; i++) {
    const t = i / FPS, svg = scene(T, P, t, th, flip);
    const f = await S(base, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: Buffer.from(svg) }]).removeAlpha().raw().toBuffer();
    if (i === Math.round(1.0 * FPS)) cover = f;
    if (!p.stdin.write(f)) await new Promise(r => p.stdin.once('drain', r));
    if (onFrame && i % 60 === 0) onFrame(i / NF);
  }
  p.stdin.end(); const code = await done; if (code !== 0) throw new Error('ffmpeg: ' + perr.slice(-300));
  const wa = tmp + '_m.wav', wb = tmp + '_s.wav', oa = tmp + '_musiqa.mp4', ob = tmp + '_effekt.mp4';
  fs.writeFileSync(wa, audio(P, true)); fs.writeFileSync(wb, audio(P, false));
  for (const [w, o] of [[wa, oa], [wb, ob]]) { const e = await run(['-y', '-v', 'error', '-i', vid, '-i', w, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', o]); if (e) throw new Error('ffmpeg (ovoz): ' + e); }
  for (const f of [vid, wa, wb]) { try { fs.unlinkSync(f); } catch (e) {} }
  const coverJpg = cover ? await S(cover, { raw: { width: W, height: H, channels: 3 } }).resize(180, 320).jpeg({ quality: 85 }).toBuffer() : null;
  return { T, P, dur: P.TOTAL, files: [oa, ob], cover: coverJpg };
}
function caption(r) {
  const T = r.T, P = r.P, W0 = T.s === 'w' ? 'Oq' : 'Qora';
  const hook = P.bigN >= 3 ? 'Bir yurishda ' + P.bigN + ' dona!' : P.sacN >= 3 ? P.sacN + ' ta qurbon va g‘alaba!' : P.L.zl + ' yurishli kombinatsiya!';
  return hook + ' ' + T.u + ' — debyut tuzog‘i №' + T.n + '\n' + W0 + ' yutadi. Siz topa olardingizmi? Javobni izohga yozing.\n\n' +
    'Barcha tuzoqlarni yeching: @DraughtsPRObot\nTelegram: @Draughts_uz\n\n#shashka #shashki #шашки #русскиешашки #checkers #draughts #tuzoq #kombinatsiya #uzbekistan #shashkapro';
}
async function sendVideo(chat, file, cap, r) {
  const T0 = process.env.BOT_TOKEN; if (!T0) return null;
  const fd = new FormData();
  fd.append('chat_id', String(chat)); fd.append('supports_streaming', 'true'); fd.append('width', String(W)); fd.append('height', String(H)); fd.append('duration', String(Math.round(r.dur))); fd.append('caption', cap);
  fd.append('video', new Blob([fs.readFileSync(file)], { type: 'video/mp4' }), path.basename(file));
  if (r.cover) fd.append('thumbnail', new Blob([r.cover], { type: 'image/jpeg' }), 'cover.jpg');
  return fetch('https://api.telegram.org/bot' + T0 + '/sendVideo', { method: 'POST', body: fd }).then(x => x.json()).catch(e => ({ ok: false, description: e.message }));
}
let busy = false;
async function produce(n, th, to) {
  if (busy) return 'Boshqa video yasalmoqda, biroz kuting';
  busy = true; const t0 = Date.now();
  try {
    const r = await make(n, th);
    const a = await sendVideo(to, r.files[0], 'Tuzoq №' + r.T.n + ' · ' + r.T.u + ' · musiqali · ' + Math.round(r.dur) + ' s', r);
    const b = await sendVideo(to, r.files[1], 'Tuzoq №' + r.T.n + ' · faqat ovoz effektlari — Instagram’da trenddagi musiqani qo‘shing', r);
    if ((a && a.ok) || (b && b.ok)) await tg('sendMessage', { chat_id: to, text: '<pre>' + x(caption(r)) + '</pre>', parse_mode: 'HTML' });
    for (const f of r.files) { try { fs.unlinkSync(f); } catch (e) {} }
    const s = store().db; s.tzReel = s.tzReel || {}; s.tzReel[r.T.n] = Date.now(); store().save();
    console.log('[tzreel] №' + r.T.n, Math.round(r.dur) + 's video,', Math.round((Date.now() - t0) / 1000) + 's da yasaldi');
    return (a && a.ok) || (b && b.ok) ? '' : 'Video yasaldi, lekin botga yuborib bo‘lmadi: ' + ((a && a.description) || '');
  } catch (e) { console.log('[tzreel]', e.message); return 'Video xatosi: ' + e.message.slice(0, 300); }
  finally { busy = false; }
}
const store = () => require('./store.js');
// POST /api/tuzoq/reel { n, th } (admin) · GET /api/tuzoq/reel — video yasalgan tuzoqlar
function handle(req, res, p, h) {
  if (p !== '/api/tuzoq/reel') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t || !ADM().includes(String(t.id))) { h.send(res, 403, { error: 'Faqat admin' }); return true; }
  if (req.method === 'GET') { h.send(res, 200, { done: (store().db.tzReel) || {}, busy }); return true; }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const n = Number(j.n), th = TH[j.th] ? j.th : 'purple';
    if (!traps().find(z => z.n === n)) return h.send(res, 404, { error: 'Tuzoq topilmadi' });
    if (busy) return h.send(res, 409, { error: 'Boshqa video yasalmoqda, 1–2 daqiqadan keyin urinib ko‘ring' });
    h.send(res, 200, { ok: 1 });
    produce(n, th, String(t.id)).then(m => { if (m) tg('sendMessage', { chat_id: String(t.id), text: m }); });
  });
  return true;
}
module.exports = { handle, make, traps, level, TH, _t: { plan, scene, audio, bgSvg } };
