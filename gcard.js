'use strict';
// gcard.js — guruhga tushadigan "doska kartasi" (inline rejim): rasm + jonli yangilanish.
// /api/gcard/<xona>.jpg — joriy pozitsiya rasmi. Inline xabar yuborilgach (chosen_inline_result),
// xonadagi har o'zgarishda xabar rasmi va yozuvi yangilanadi (editMessageMedia, ~3 s da bir marta).
const svgBoard = require('./puzimg.js').svgBoard;
const BASE = () => (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const msgs = new Map();   // xona -> { imid, from, at, last, tmr, ver, done }
const cache = new Map();  // kalit -> jpeg
let ROOMS = null;

function tg(method, params) {
  const T = process.env.BOT_TOKEN; if (!T) return Promise.resolve(null);
  return fetch('https://api.telegram.org/bot' + T + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).then(r => r.json()).catch(() => null);
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function startBoard(room) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  const o = room && room.opening && room.opening.board;
  if (o) { let k = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) continue; const ch = o.charAt(k++); b[r][c] = 'wbWB'.includes(ch) && ch ? ch : null; } return b; }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = r < 3 ? 'b' : r > 4 ? 'w' : null;
  return b;
}
function boardOf(room) {   // yurishlarni qayta o'ynab joriy pozitsiya
  if (!room) return startBoard(null);
  if (room.dr && room.dr.b) return room.dr.b;
  const b = startBoard(room);
  for (const mv of room.moves || []) {
    if (!mv || !mv.from || !mv.to) continue;
    let p = b[mv.from.r][mv.from.c]; b[mv.from.r][mv.from.c] = null;
    for (const x of mv.captures || []) b[x.r][x.c] = null;
    if (p === 'w' && mv.to.r === 0) p = 'W'; if (p === 'b' && mv.to.r === 7) p = 'B';
    b[mv.to.r][mv.to.c] = p;
  }
  return b;
}
const NUM = { w: 1, b: 2, W: 3, B: 4 };
function info(room, from) {
  const w = room && room.white ? room.white.name : null, k = room && room.black ? room.black.name : null;
  const st = !room || !w || !k ? 'wait' : room.finished ? 'over' : 'live';
  let win = null; if (st === 'over') win = room.winner === 'white' ? w : room.winner === 'black' ? k : null;
  return { w, k, st, win, tc: room ? room.tc : '', turn: room ? room.turn : 'white', n: room ? Math.ceil((room.plies || 0) / 2) : 0, from };
}
async function render(roomId, from) {
  const room = ROOMS && ROOMS.get(roomId), I = info(room, from);
  const key = roomId + ':' + (room ? (room.moves || []).length + ':' + I.st + ':' + I.w + ':' + I.k : 'x') + ':' + from;
  if (cache.has(key)) return cache.get(key);
  const sharp = require('sharp');
  const bd = boardOf(room).map(r => r.map(x => NUM[x] || 0));
  const inner = svgBoard(bd, 'w', null).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const F = 'DejaVu Sans,sans-serif';
  const pl = (y, nm, col, on, sub) => '<g transform="translate(730 ' + y + ')"><rect width="250" height="96" rx="18" fill="' + (on ? '#2b3a6b' : '#1c2547') + '" stroke="' + (on ? '#ffd54f' : '#33406e') + '" stroke-width="3"/><circle cx="46" cy="48" r="26" fill="url(#' + col + ')" stroke="#000" stroke-width="2"/>' +
    '<text x="86" y="44" font-size="' + (String(nm).length > 9 ? 21 : 26) + '" font-weight="700" fill="#fff" font-family="' + F + '">' + esc(String(nm).slice(0, 16)) + '</text><text x="86" y="74" font-size="18" fill="#9fb0d8" font-family="' + F + '">' + esc(sub) + '</text></g>';
  const wt = I.w || (I.st === 'wait' && from ? from : 'Kutilmoqda…'), bk = I.k || 'Kutilmoqda…';
  const live = I.st === 'live';
  let badge = '', bc = '#2e9d3a';
  if (I.st === 'wait') badge = '▶ O‘YIN';
  else if (live) { badge = 'JONLI'; bc = '#c62828'; }
  else { badge = I.win ? 'G‘OLIB' : 'DURANG'; bc = '#b7791f'; }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="700"><defs><linearGradient id="bgx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18224a"/><stop offset="1" stop-color="#0a0f26"/></linearGradient>' +
    '<radialGradient id="wpx" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bdbdbd"/></radialGradient><radialGradient id="bpx" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8a8a8a"/><stop offset="1" stop-color="#0b0b0b"/></radialGradient></defs>' +
    '<rect width="1000" height="700" fill="url(#bgx)"/><g transform="translate(2 2)">' + inner + '</g>' +
    '<text x="855" y="70" font-size="34" font-weight="800" fill="#ffd54f" text-anchor="middle" font-family="' + F + '">ShashkaPRO</text>' +
    '<text x="855" y="104" font-size="20" fill="#cbd5f5" text-anchor="middle" font-family="' + F + '">Rus shashkasi' + (I.tc ? ' · ' + esc(I.tc) : '') + '</text>' +
    pl(170, bk, 'bpx', live && I.turn === 'black', I.st === 'over' ? (I.win && I.win === I.k ? '🏆' : '') : live && I.turn === 'black' ? 'navbat' : '') +
    '<text x="855" y="330" font-size="26" text-anchor="middle" fill="#cbd5f5" font-family="' + F + '">' + (live ? I.n + '-yurish' : I.st === 'over' ? (I.win ? '🏆 ' + esc(I.win.slice(0, 14)) : 'Durang') : 'vs') + '</text>' +
    pl(420, wt, 'wpx', live && I.turn === 'white', I.st === 'over' ? '' : live && I.turn === 'white' ? 'navbat' : '') +
    '<rect x="740" y="575" width="230" height="80" rx="20" fill="' + bc + '"/>' + (live ? '<circle cx="785" cy="615" r="11" fill="#fff"/>' : '') +
    '<text x="' + (live ? 870 : 855) + '" y="626" font-size="30" font-weight="800" fill="#fff" text-anchor="middle" font-family="' + F + '">' + badge + '</text></svg>';
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
  cache.set(key, buf); if (cache.size > 300) cache.delete(cache.keys().next().value);
  return buf;
}
function url(roomId, from, v) { const b = BASE(); return b ? b + '/api/gcard/' + roomId + '.jpg?f=' + encodeURIComponent(from || '') + '&v=' + (v || 0) : ''; }
function caption(roomId, from) {
  const room = ROOMS && ROOMS.get(roomId), I = info(room, from);
  if (I.st === 'wait') return '♟ <b>' + esc(from || 'Kimdir') + '</b> shashka o‘ynashga chaqiryapti!\nBirinchi kirgan — raqib, qolganlar tomosha qiladi.';
  if (I.st === 'live') return '🔴 <b>Jonli</b>: ⚪ ' + esc(I.w) + ' — ⚫ ' + esc(I.k) + ' · ' + I.n + '-yurish';
  return '🏁 O‘yin tugadi: ' + (I.win ? '🏆 G‘olib — <b>' + esc(I.win) + '</b>' : '🤝 durang') + '\n⚪ ' + esc(I.w) + ' — ⚫ ' + esc(I.k);
}
function markup(link, roomId) {
  const room = ROOMS && ROOMS.get(roomId), I = info(room, '');
  return { inline_keyboard: [[{ text: I.st === 'wait' ? '▶ O‘yinga kirish' : I.st === 'live' ? '👁 Tomosha qilish' : '🔁 Yangi o‘yin', url: link }]] };
}
// inline natijasi tanlandi — xabarni kuzatamiz
function chosen(roomId, imid, from, link) { if (!roomId || !imid) return; msgs.set(roomId, { imid, from, link, at: Date.now(), ver: 0, last: 0 }); }
function touch(room) {   // rooms.js dan: xonada o'zgarish bo'ldi
  const m = room && msgs.get(room.id); if (!m || m.done) return;
  if (m.tmr) return;
  const wait = Math.max(0, 3000 - (Date.now() - m.last));
  m.tmr = setTimeout(() => {
    m.tmr = null; m.last = Date.now(); m.ver++;
    const u = url(room.id, m.from, m.ver + '_' + (room.moves || []).length); if (!u) return;
    tg('editMessageMedia', { inline_message_id: m.imid, media: { type: 'photo', media: u, caption: caption(room.id, m.from), parse_mode: 'HTML' }, reply_markup: markup(m.link, room.id) });
    if (room.finished) m.done = true;
  }, wait);
}
setInterval(() => { const now = Date.now(); for (const [k, m] of msgs) if (now - m.at > 12 * 3600e3) msgs.delete(k); }, 600e3).unref();
function handleHttp(req, res, p) {
  const mm = /^\/api\/gcard\/([a-z0-9]{4,16})\.jpg$/.exec(p); if (!mm) return false;
  const q = new URL(req.url, 'http://x').searchParams;
  render(mm[1], String(q.get('f') || '').slice(0, 30)).then(buf => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=60' }); res.end(buf); })
    .catch(e => { console.log('[gcard]', e.message); res.writeHead(500); res.end(); });
  return true;
}
module.exports = { setRooms: r => { ROOMS = r; }, url, caption, markup, chosen, touch, handleHttp, render };
