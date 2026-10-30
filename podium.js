'use strict';
// podium.js — kubok g'oliblari shohsupasi rasmi (🥇🥈🥉 + Telegram profil rasmlari) va guruhga yuborish
const F = 'DejaVu Sans,sans-serif';
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const api = () => 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;
function withTimeout(p, ms) { return Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]); }

// Telegram profil rasmi (bo'lmasa yoki maxfiy bo'lsa — null, harf chiziladi)
async function avatar(uid) {
  if (!process.env.BOT_TOKEN || !uid) return null;
  try {
    const ph = await withTimeout(fetch(api() + '/getUserProfilePhotos?user_id=' + encodeURIComponent(uid) + '&limit=1').then(r => r.json()), 4000);
    const sz = ph && ph.ok && ph.result.photos[0]; if (!sz || !sz.length) return null;
    const f = sz.find(x => x.width >= 160) || sz[sz.length - 1];
    const fi = await withTimeout(fetch(api() + '/getFile?file_id=' + encodeURIComponent(f.file_id)).then(r => r.json()), 4000);
    if (!fi || !fi.ok) return null;
    const buf = await withTimeout(fetch('https://api.telegram.org/file/bot' + process.env.BOT_TOKEN + '/' + fi.result.file_path).then(r => r.arrayBuffer()), 6000);
    if (!buf) return null;
    const sharp = require('sharp');
    const png = await sharp(Buffer.from(buf)).resize(200, 200, { fit: 'cover' }).png().toBuffer();
    return 'data:image/png;base64,' + png.toString('base64');
  } catch (e) { return null; }
}

// w: [{name, uid, prize}] — 0: 1-o'rin, 1: 2-o'rin, 2: 3-o'rin (bo'lmasa null)
async function render(w, info) {
  const sharp = require('sharp');
  const av = await Promise.all(w.map(p => p ? avatar(p.uid) : null));
  const COL = [['#ffe27a', '#c99400'], ['#eef2f8', '#97a3b6'], ['#f3b27a', '#a85f22']];
  const POS = [{ x: 335, h: 300 }, { x: 105, h: 220 }, { x: 565, h: 160 }];
  let defs = '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3b6e"/><stop offset="1" stop-color="#0b1630"/></linearGradient>';
  let g = '';
  // konfetti (shohsupa ustida, ism va rasmlarga tegmaydi)
  const CC = ['#ffd75a', '#ff6b8a', '#6be0ff', '#9dff6b', '#c79bff', '#ffffff'];
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 60; i++) { const x = rnd() * 900, y = 150 + rnd() * 110; if (Math.abs(x - 450) < 120) continue; g += '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="12" height="22" rx="2" fill="' + CC[i % 6] + '" opacity=".85" transform="rotate(' + (rnd() * 180).toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"/>'; }
  w.forEach((p, i) => {
    if (!p) return;
    const P = POS[i], top = 810 - P.h, cx = P.x + 115;
    defs += '<linearGradient id="c' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + COL[i][0] + '"/><stop offset="1" stop-color="' + COL[i][1] + '"/></linearGradient><clipPath id="k' + i + '"><circle cx="' + cx + '" cy="' + (top - 160) + '" r="75"/></clipPath>';
    g += '<rect x="' + P.x + '" y="' + top + '" width="230" height="' + P.h + '" rx="14" fill="url(#c' + i + ')"/>';
    g += '<text x="' + cx + '" y="' + (top + 100) + '" font-size="90" font-weight="800" fill="#ffffff" fill-opacity=".95" text-anchor="middle" font-family="' + F + '">' + (i + 1) + '</text>';
    const nm0 = Array.from(String(p.name || '').trim()), nm = nm0.length > 14 ? nm0.slice(0, 13).join('') + '…' : nm0.join('');
    g += '<text x="' + cx + '" y="' + (top - 50) + '" font-size="' + (nm.length > 10 ? 24 : 30) + '" font-weight="700" fill="#fff" text-anchor="middle" font-family="' + F + '">' + esc(nm) + '</text>';
    if (p.prize) g += '<text x="' + cx + '" y="' + (top - 16) + '" font-size="22" fill="#ffe58a" text-anchor="middle" font-family="' + F + '">+' + p.prize + ' tanga</text>';
    g += '<circle cx="' + cx + '" cy="' + (top - 160) + '" r="81" fill="#ffffff" fill-opacity=".25"/>';
    if (av[i]) g += '<image href="' + av[i] + '" x="' + (cx - 75) + '" y="' + (top - 235) + '" width="150" height="150" clip-path="url(#k' + i + ')"/>';
    else g += '<circle cx="' + cx + '" cy="' + (top - 160) + '" r="75" fill="' + COL[i][0] + '"/><text x="' + cx + '" y="' + (top - 138) + '" font-size="64" font-weight="800" fill="#0b1630" text-anchor="middle" font-family="' + F + '">' + esc(Array.from(nm.trim() || '?')[0].toUpperCase()) + '</text>';
    if (i === 0) { const y = top - 262; g += '<path d="M' + (cx - 46) + ' ' + (y + 40) + ' L' + (cx - 52) + ' ' + (y - 4) + ' L' + (cx - 24) + ' ' + (y + 18) + ' L' + cx + ' ' + (y - 16) + ' L' + (cx + 24) + ' ' + (y + 18) + ' L' + (cx + 52) + ' ' + (y - 4) + ' L' + (cx + 46) + ' ' + (y + 40) + ' Z" fill="#ffd54f" stroke="#a87a00" stroke-width="3" stroke-linejoin="round"/><circle cx="' + cx + '" cy="' + (y - 18) + '" r="6" fill="#ff4d6d"/><circle cx="' + (cx - 52) + '" cy="' + (y - 6) + '" r="5" fill="#4dd2ff"/><circle cx="' + (cx + 52) + '" cy="' + (y - 6) + '" r="5" fill="#4dd2ff"/>'; }
  });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><defs>' + defs + '</defs><rect width="900" height="900" fill="url(#bg)"/>' + g +
    '<rect x="90" y="808" width="720" height="10" rx="5" fill="#0a1020"/>' +
    '<text x="450" y="78" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle" font-family="' + F + '">' + esc(info.title || 'GURUH KUBOGI') + '</text>' +
    '<text x="450" y="120" font-size="24" fill="#bcd0ff" text-anchor="middle" font-family="' + F + '">' + esc(info.sub || '') + '</text>' +
    '<text x="450" y="866" font-size="24" fill="#bcd0ff" text-anchor="middle" font-family="' + F + '">' + esc(info.foot || '') + '</text></svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function send(chat, w, info, caption) {
  const fallback = () => fetch(api() + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: caption, parse_mode: 'HTML' }) }).then(r => r.json()).catch(() => null);
  if (!process.env.BOT_TOKEN) return null;
  try {
    const buf = await render(w, info);
    const fd = new FormData();
    fd.append('chat_id', String(chat)); fd.append('caption', String(caption).slice(0, 1020)); fd.append('parse_mode', 'HTML');
    fd.append('photo', new Blob([buf], { type: 'image/png' }), 'podium.png');
    const d = await fetch(api() + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json());
    return d && d.ok ? d : fallback();
  } catch (e) { return fallback(); }
}

// ---------- 🏆 olimpiya jadvali rasmi
// d: { title, sub, stage, qual, cols: [{ name, m: [{ a, b, w, live, tb, bye, wo }] }], third }
function cut(s, n) { const a = Array.from(String(s == null ? '' : s)); return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join(''); }
async function bracket(d) {
  const sharp = require('sharp');
  const cols = d.cols.map(c => ({ name: c.name, m: c.m.map(x => Object.assign({}, x)) }));
  // kelajak ustunlar: ma'lum g'oliblarni oldinga surib qo'yamiz (saralashsiz o'tganlar darhol ko'rinadi)
  const wn = m => m.w === 0 ? m.a : m.w === 1 ? m.b : null;
  for (let k = 1; k < cols.length; k++) cols[k].m.forEach((m, j) => { const A = cols[k - 1].m[2 * j], B = cols[k - 1].m[2 * j + 1]; if (m.a === '?' && A && wn(A)) m.a = wn(A); if (m.b === '?' && B && wn(B)) m.b = wn(B); });
  const mi = d.qual ? 1 : 0, M0 = cols[mi] ? cols[mi].m.length : 1;
  const BW = 190, BH = 56, CW = 235, TOP = 175;
  const U = Math.max(d.qual ? 150 : 96, Math.floor(600 / M0));
  const C = cols.length, W = Math.max(900, 40 + C * CW + 10), H = TOP + M0 * U + (d.third ? 40 : 0) + 70;
  const X = k => 30 + k * CW;
  const Y = [];   // markaz y lari
  for (let k = mi; k < C; k++) Y[k] = cols[k].m.map((_, j) => k === mi ? TOP + U * (j + 0.5) : (Y[k - 1][2 * j] + (Y[k - 1][2 * j + 1] != null ? Y[k - 1][2 * j + 1] : Y[k - 1][2 * j])) / 2);
  if (d.qual) Y[0] = cols[0].m.map((_, e) => Y[1][e >> 1] + (e & 1 ? 1 : -1) * U * 0.25);
  let g = '';
  const box = (x, y, m, lab) => {
    const top = y - BH / 2, row = (i, n) => {
      const win = m.w === i, lose = m.w != null && m.w !== i, yy = top + i * BH / 2;
      return '<rect x="' + x + '" y="' + yy + '" width="' + BW + '" height="' + BH / 2 + '" fill="' + (win ? '#1f6f3a' : '#1c2547') + '"/>' +
        '<text x="' + (x + 9) + '" y="' + (yy + 19) + '" font-size="14" font-weight="' + (win ? 700 : 400) + '" fill="' + (lose ? '#7f8bb0' : n && n !== '?' && n !== '—' ? '#fff' : '#5d6b94') + '" font-family="' + F + '"' + (lose ? ' text-decoration="line-through"' : '') + '>' + esc(cut(n || '?', 19)) + '</text>' +
        (win ? '<text x="' + (x + BW - 9) + '" y="' + (yy + 19) + '" font-size="14" fill="#9dff9d" text-anchor="end" font-family="' + F + '">✓</text>' : '');
    };
    let s = row(0, m.a) + row(1, m.b) + '<rect x="' + x + '" y="' + top + '" width="' + BW + '" height="' + BH + '" rx="6" fill="none" stroke="' + (m.live ? '#ffd54f' : '#33406e') + '" stroke-width="' + (m.live ? 3 : 1.5) + '"/><line x1="' + x + '" y1="' + y + '" x2="' + (x + BW) + '" y2="' + y + '" stroke="#33406e"/>';
    if (m.live) { const t = m.tb ? 'TAY-BREK ' + m.tb : 'JONLI', w = m.tb ? 96 : 62; s += '<rect x="' + (x + BW - w - 4) + '" y="' + (top - 12) + '" width="' + w + '" height="19" rx="9" fill="' + (m.tb ? '#d9822b' : '#c62828') + '"/><text x="' + (x + BW - 4 - w / 2) + '" y="' + (top + 2) + '" font-size="11" font-weight="700" fill="#fff" text-anchor="middle" font-family="' + F + '">' + t + '</text>'; }
    if (lab) s += '<text x="' + x + '" y="' + (top - 8) + '" font-size="13" fill="#9fb0d8" font-family="' + F + '">' + esc(lab) + '</text>';
    return s;
  };
  const link = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return '<path d="M' + x1 + ' ' + y1 + ' H' + mx + ' V' + y2 + ' H' + x2 + '" fill="none" stroke="#4a5a8f" stroke-width="2"/>'; };
  // sarlavhalar
  for (let k = 0; k < C; k++) g += '<text x="' + (X(k) + BW / 2) + '" y="' + (TOP - 30) + '" font-size="15" font-weight="700" fill="#ffd54f" text-anchor="middle" font-family="' + F + '">' + esc(cols[k].name) + '</text>';
  for (let k = 0; k < C; k++) cols[k].m.forEach((m, j) => {
    if (k === 0 && d.qual && m.bye) return;
    const y = Y[k][j];
    if (k + 1 < C) { const ny = Y[k + 1][j >> 1]; g += link(X(k) + BW, y, X(k + 1), ny + (j & 1 ? BH / 4 : -BH / 4)); }
    g += box(X(k), y, m, '');
  });
  if (d.qual) { const nb = cols[0].m.filter(m => m.bye).length; if (nb) g += '<text x="' + X(0) + '" y="' + (TOP - 10) + '" font-size="12" fill="#7f8bb0" font-family="' + F + '">' + nb + ' kishi saralashsiz o‘tdi →</text>'; }
  if (d.third) { const k = C - 1, y = Math.min(H - 110, Y[k][0] + U * 1.1 + 40); g += '<text x="' + (X(k) + BW / 2) + '" y="' + (y - BH / 2 - 12) + '" font-size="14" font-weight="700" fill="#f0a96a" text-anchor="middle" font-family="' + F + '">3-o‘rin uchun</text>' + box(X(k), y, d.third, ''); }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18224a"/><stop offset="1" stop-color="#0a0f26"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>' +
    '<text x="' + W / 2 + '" y="56" font-size="36" font-weight="800" fill="#ffd54f" text-anchor="middle" font-family="' + F + '">' + esc(d.title || 'GURUH KUBOGI · JADVAL') + '</text>' +
    '<text x="' + W / 2 + '" y="92" font-size="19" fill="#cbd5f5" text-anchor="middle" font-family="' + F + '">' + esc(d.sub || '') + '</text>' +
    '<text x="' + W / 2 + '" y="122" font-size="18" fill="#9fb0d8" text-anchor="middle" font-family="' + F + '">' + esc(d.stage || '') + '</text>' + g +
    '<text x="' + W / 2 + '" y="' + (H - 22) + '" font-size="17" fill="#7f8bb0" text-anchor="middle" font-family="' + F + '">@DraughtsPRObot</text></svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}
async function sendBracket(chat, d, caption, markup) {
  if (!process.env.BOT_TOKEN) return null;
  const buf = await bracket(d);
  const fd = new FormData();
  fd.append('chat_id', String(chat)); fd.append('caption', String(caption).slice(0, 1020)); fd.append('parse_mode', 'HTML');
  if (markup) fd.append('reply_markup', JSON.stringify(markup));
  fd.append('photo', new Blob([buf], { type: 'image/png' }), 'jadval.png');
  return fetch(api() + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json()).catch(() => null);
}
module.exports = { render, send, avatar, bracket, sendBracket };
