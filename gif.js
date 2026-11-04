'use strict';
// gif.js — 🎞 tugagan o'yinni GIF qilib bot orqali yuborish (keyin Telegramda istalgan joyga ulashish mumkin).
// Har yurish — bitta kadr (zanjirli urishda har sakrash alohida), oxirgi kadrda natija. sharp bilan animatsiya.
const store = require('./store.js');
const W = 380, HEAD = 46, FOOT = 34;
const cache = new Map();   // roomId -> gif buffer
const lim = new Map();     // uid -> [vaqtlar]
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function start(room) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(0));
  const o = room && room.opening && room.opening.board;
  if (o) { let k = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) continue; const ch = o.charAt(k++); b[r][c] = { w: 1, b: 2, W: 3, B: 4 }[ch] || 0; } return b; }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = r < 3 ? 2 : r > 4 ? 1 : 0;
  return b;
}
function frames(room) {
  let b = start(room); const out = [{ b: b.map(r => r.slice()), m: null }];
  for (const mv of room.moves || []) {
    if (!mv || !mv.from || !mv.to) continue;
    b = b.map(r => r.slice());
    let p = b[mv.from.r][mv.from.c]; b[mv.from.r][mv.from.c] = 0;
    for (const x of mv.captures || []) b[x.r][x.c] = 0;
    if (p === 1 && mv.to.r === 0) p = 3; if (p === 2 && mv.to.r === 7) p = 4;
    b[mv.to.r][mv.to.c] = p;
    out.push({ b, m: mv });
  }
  return out;
}
async function make(room, flip) {
  const key = room.id + ':' + (room.moves || []).length + ':' + (flip ? 1 : 0);
  if (cache.has(key)) return cache.get(key);
  const sharp = require('sharp'), svgBoard = require('./puzimg.js').svgBoard;
  let F = frames(room);
  if (F.length > 150) F = [F[0]].concat(F.slice(-149));   // juda uzun o'yin — oxirgi qismi
  const wn = esc(room.white && room.white.name || 'Oq'), bn = esc(room.black && room.black.name || 'Qora');
  const res = room.winner === 'white' ? wn + ' yutdi!' : room.winner === 'black' ? bn + ' yutdi!' : room.winner === 'draw' ? 'Durang' : '';   // (rasmda rangli emoji chiqmaydi)
  const H = W + HEAD + FOOT, bs = W;
  const imgs = [];
  for (let i = 0; i < F.length; i++) {
    const f = F[i], last = i === F.length - 1;
    let bsvg = svgBoard(f.b, flip ? 'b' : 'w');
    bsvg = bsvg.replace('<svg ', '<svg x="0" y="' + HEAD + '" ');   // ichki svg
    const hl = f.m ? (() => { const S = 80, M = 28, k = bs / (S * 8 + M * 2), pos = p => { const r = flip ? 7 - p.r : p.r, c = flip ? 7 - p.c : p.c; return [M + c * S, M + r * S]; }; const [x1, y1] = pos(f.m.from), [x2, y2] = pos(f.m.to); return '<g transform="translate(0,' + HEAD + ') scale(' + k + ')"><rect x="' + x1 + '" y="' + y1 + '" width="80" height="80" fill="#ffe600" opacity=".28"/><rect x="' + x2 + '" y="' + y2 + '" width="80" height="80" fill="#ffe600" opacity=".38"/></g>'; })() : '';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '">' +
      '<rect width="' + W + '" height="' + H + '" fill="#141040"/>' +
      '<circle cx="18" cy="23" r="9" fill="#f4f0e6" stroke="#999" stroke-width="1.5"/><text x="34" y="29" font-size="17" fill="#fff" font-family="DejaVu Sans, sans-serif" font-weight="bold">' + wn.slice(0, 16) + '</text>' +
      '<text x="' + (W / 2) + '" y="29" font-size="16" text-anchor="middle" fill="#8a8db8" font-family="DejaVu Sans, sans-serif">vs</text>' +
      '<circle cx="' + (W - 18) + '" cy="23" r="9" fill="#222" stroke="#777" stroke-width="1.5"/><text x="' + (W - 34) + '" y="29" font-size="17" text-anchor="end" fill="#fff" font-family="DejaVu Sans, sans-serif" font-weight="bold">' + bn.slice(0, 16) + '</text>' +
      bsvg.replace(/width="(\d+)" height="(\d+)" viewBox/, 'width="' + bs + '" height="' + bs + '" viewBox') + hl +
      '<text x="' + (W / 2) + '" y="' + (H - 11) + '" font-size="' + (last && res ? 18 : 14) + '" text-anchor="middle" fill="' + (last && res ? '#ffd54a' : '#a9b0ff') + '" font-family="DejaVu Sans, sans-serif" font-weight="bold">' + (last && res ? res : (i ? Math.ceil(i / 2) + '-yurish' : 'Boshlanish')) + ' · @DraughtsPRObot</text></svg>';
    imgs.push(await sharp(Buffer.from(svg)).png().toBuffer());
  }
  const delay = imgs.map((_, i) => i === 0 ? 1200 : i === imgs.length - 1 ? 4000 : 650);
  const gif = await sharp(imgs, { join: { animated: true } }).gif({ delay, loop: 0, effort: 4 }).toBuffer();
  cache.set(key, gif); if (cache.size > 30) cache.delete(cache.keys().next().value);
  return gif;
}
async function sendTo(uid, gif, caption) {
  const fd = new FormData();
  fd.append('chat_id', String(uid)); fd.append('caption', caption); fd.append('parse_mode', 'HTML');
  fd.append('animation', new Blob([gif], { type: 'image/gif' }), 'shashkapro.gif');
  const r = await fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendAnimation', { method: 'POST', body: fd }).then(x => x.json()).catch(() => null);
  return r && r.ok;
}
// POST /api/gif {roomId}
function handle(req, res, p, h) {
  if (p !== '/api/gif') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  h.readBody(req, 500, async body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const uid = String(t.id), room = require('./gcard.js').rooms() && require('./gcard.js').rooms().get(String(j.roomId || ''));
    if (!room || !room.finished || (room.moves || []).length < 4) return h.send(res, 400, { error: 'O‘yin topilmadi yoki juda qisqa' });
    const L = (lim.get(uid) || []).filter(x => Date.now() - x < 3600e3);
    if (L.length >= 5) return h.send(res, 429, { error: 'Soatiga 5 tagacha GIF' });
    L.push(Date.now()); lim.set(uid, L);
    try {
      const flip = room.black && String(room.black.uid) === uid;
      const gif = await make(room, flip);
      const wn = esc(room.white && room.white.name), bn = esc(room.black && room.black.name);
      const ok = await sendTo(uid, gif, '🎞 <b>' + wn + '</b> ⚪ — ⚫ <b>' + bn + '</b>\n' + (room.winner === 'white' ? '🏆 ' + wn + ' yutdi' : room.winner === 'black' ? '🏆 ' + bn + ' yutdi' : '🤝 Durang') + ' · ' + Math.ceil((room.moves || []).length / 2) + ' yurish\n\n♟ ShashkaPRO — @DraughtsPRObot');
      h.send(res, ok ? 200 : 500, ok ? { ok: true } : { error: 'Bot xabar yubora olmadi — botga /start bosing' });
    } catch (e) { console.log('[gif]', e.message); h.send(res, 500, { error: 'GIF yaratib bo‘lmadi' }); }
  });
  return true;
}
module.exports = { handle, make, frames };
