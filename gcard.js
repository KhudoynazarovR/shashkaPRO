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
  let v = 0; if (room && room.members) for (const id of room.members) { if (!(room.white && room.white.clientId === id) && !(room.black && room.black.clientId === id)) v++; }
  return { w, k, st, win, v, tc: room ? room.tc : '', turn: room ? room.turn : 'white', n: room ? Math.ceil((room.plies || 0) / 2) : 0, from };
}
async function render(roomId, from) {
  const room = ROOMS && ROOMS.get(roomId), I = info(room, from);
  const key = roomId + ':' + (room ? (room.moves || []).length + ':' + I.st + ':' + I.w + ':' + I.k + ':' + I.v : 'x') + ':' + from;
  if (cache.has(key)) return cache.get(key);
  const sharp = require('sharp');
  const bd = boardOf(room).map(r => r.map(x => NUM[x] || 0));
  const inner = svgBoard(bd, 'w', null).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const F = 'DejaVu Sans,sans-serif';
  const pl = (y, nm, col, on, sub) => '<g transform="translate(730 ' + y + ')"><rect width="250" height="96" rx="18" fill="' + (on ? '#2b3a6b' : '#1c2547') + '" stroke="' + (on ? '#ffd54f' : '#33406e') + '" stroke-width="3"/><circle cx="46" cy="48" r="26" fill="url(#' + col + ')" stroke="#000" stroke-width="2"/>' +
    '<text x="86" y="44" font-size="' + (String(nm).length > 9 ? 21 : 26) + '" font-weight="700" fill="#fff" font-family="' + F + '">' + esc(String(nm).slice(0, 16)) + '</text><text x="86" y="74" font-size="18" fill="#9fb0d8" font-family="' + F + '">' + esc(sub) + '</text></g>';
  const wt = I.w || (!room && from ? from : 'Kutilmoqda…'), bk = I.k || 'Kutilmoqda…';
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
    pl(170, bk, 'bpx', live && I.turn === 'black', I.st === 'over' ? (I.win && I.win === I.k ? '★ g‘olib' : '') : live && I.turn === 'black' ? 'navbat' : '') +
    '<text x="855" y="330" font-size="26" text-anchor="middle" fill="#cbd5f5" font-family="' + F + '">' + (live ? I.n + '-yurish' + (I.v ? ' · ' + I.v + ' tomosha' : '') : I.st === 'over' ? (I.win ? '★ ' + esc(I.win.slice(0, 14)) : 'Durang') : 'vs') + '</text>' +
    pl(420, wt, 'wpx', live && I.turn === 'white', I.st === 'over' ? '' : live && I.turn === 'white' ? 'navbat' : '') +
    '<rect x="740" y="575" width="230" height="80" rx="20" fill="' + bc + '"/>' + (live ? '<circle cx="785" cy="615" r="11" fill="#fff"/>' : '') +
    '<text x="' + (live ? 870 : 855) + '" y="626" font-size="30" font-weight="800" fill="#fff" text-anchor="middle" font-family="' + F + '">' + badge + '</text></svg>';
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
  cache.set(key, buf); if (cache.size > 300) cache.delete(cache.keys().next().value);
  return buf;
}
function url(roomId, from, v) { const b = BASE(); return b ? b + '/api/gcard/' + roomId + '.jpg?f=' + encodeURIComponent(from || '') + '&v=' + (v || 0) : ''; }
function caption(roomId, from) {
  const room = ROOMS && ROOMS.get(roomId), I = info(room, from), tc = I.tc ? ' · ⏱ ' + esc(I.tc) : '';
  const vt = room && room.votes ? Object.values(room.votes) : [], vw = vt.filter(x => x === 'w').length, vb = vt.length - vw;
  if (I.st === 'wait') {
    const who = room && (room.white || room.black), side = room && room.white ? '⚫ qora' : '⚪ oq';
    return '♟ <b>' + esc(from || (who && who.name) || 'Kimdir') + '</b> shashka o‘ynashga chaqiryapti!' + tc + '\nBosing — ' + side + ' bilan raqib bo‘lasiz. Qolganlar tomosha qiladi 👁';
  }
  if (I.st === 'live') return '🔴 <b>Jonli</b>: ⚪ ' + esc(I.w) + ' — ⚫ ' + esc(I.k) + ' · ' + I.n + '-yurish' + tc + (I.v ? ' · ' + I.v + ' tomosha' : '') + (vt.length ? '\n🗳 Kim yutadi? ⚪ ' + vw + ' · ⚫ ' + vb : '\n🗳 Kim yutadi? Ovoz bering — topganlarga +5 💰');
  return '🏁 O‘yin tugadi: ' + (I.win ? '🏆 G‘olib — <b>' + esc(I.win) + '</b>' : '🤝 durang') + '\n⚪ ' + esc(I.w) + ' — ⚫ ' + esc(I.k) + (vt.length ? '\n🗳 To‘g‘ri topganlar +5 💰 oldi' : '');
}
function markup(link, roomId) {
  const room = ROOMS && ROOMS.get(roomId), I = info(room, '');
  if (I.st === 'wait') return { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: link }]] };
  if (I.st === 'live') {
    const vt = room.votes ? Object.values(room.votes) : [], vw = vt.filter(x => x === 'w').length;
    const rows = [[{ text: (room.moves || []).length ? '👁 Tomosha qilish' : '▶ O‘yinga kirish', url: link }]];
    if ((room.plies || 0) < 20) rows.push([{ text: '⚪ ' + String(I.w).slice(0, 12) + ' yutadi · ' + vw, callback_data: 'g:v:' + roomId + ':w' }, { text: '⚫ ' + String(I.k).slice(0, 12) + ' yutadi · ' + (vt.length - vw), callback_data: 'g:v:' + roomId + ':b' }]);
    return { inline_keyboard: rows };
  }
  return { inline_keyboard: [[{ text: '🔁 Revansh', callback_data: 'g:r:' + roomId }, { text: '📊 Guruh TOP', callback_data: 'g:t:' + roomId }]] };
}
// inline natijasi tanlandi — xabarni kuzatamiz
let API = null;
function parseOpt(q) {   // "3+2 qora" -> { tc, col }
  q = String(q || '').toLowerCase();
  const m = /(\d{1,2}(?:\.\d)?)\s*\+\s*(\d{1,2})/.exec(q), col = /qora|black|черн|чёрн|⚫/.test(q) ? 'b' : /tasodif|random|случ|🎲/.test(q) ? 'r' : 'w';
  return { tc: m ? m[1] + '+' + m[2] : '', col };
}
function chosen(roomId, imid, from, link, uid, tc, col) {
  if (!roomId || !imid) return;
  msgs.set(roomId, { imid, from, link, at: Date.now(), ver: 0, last: 0 });
  // chaqiruvchi taniladi: tanlangan rangdagi o'rindiq uniki, boshqalar "Qo'shilish" bilan raqib bo'ladi
  try {
    if (API && uid) {
      if (col === 'r') col = Math.random() < 0.5 ? 'w' : 'b';
      const seat = { uid: String(uid), name: String(from || 'O‘yinchi').slice(0, 20) }, o = { tc: tc || undefined };
      if (col === 'b') o.black = seat; else o.white = seat;
      const room = API.create(roomId, o); if (room && !(room.white && room.black)) { room.inline = true; room.casual = true; }
    }
  } catch (e) { console.log('[gcard]', e.message); }
}
function edit(room, m) {
  m.last = Date.now(); m.ver++;
  const u = url(room.id, m.from, m.ver + '_' + (room.moves || []).length); if (!u) return;
  tg('editMessageMedia', { inline_message_id: m.imid, media: { type: 'photo', media: u }, reply_markup: markup(m.link, room.id) });
}
function touch(room) {   // rooms.js dan: xonada o'zgarish bo'ldi
  const m = room && msgs.get(room.id); if (!m || m.done) return;
  if (room.finished && !m.fin) { m.fin = true; try { require('./grp.js').gameOver(room, m); } catch (e) { console.log('[grp]', e.message); } }
  if (m.tmr) return;
  const wait = Math.max(0, 3000 - (Date.now() - m.last));
  m.tmr = setTimeout(() => { m.tmr = null; edit(room, m); if (room.finished) m.done = true; }, wait);
}
function now(room) { const m = room && msgs.get(room.id); if (m) { if (m.tmr) { clearTimeout(m.tmr); m.tmr = null; } edit(room, m); } }   // darhol yangilash (ovoz berilganda)
function msgOf(roomId) { return msgs.get(roomId); }
function move(oldId, newId) { const m = msgs.get(oldId); if (!m) return null; msgs.delete(oldId); const n = Object.assign({}, m, { at: Date.now(), ver: m.ver + 1, done: false, fin: false, tmr: null, link: m.mkLink ? m.mkLink(newId) : m.link }); msgs.set(newId, n); return n; }
setInterval(() => { const t = Date.now(); for (const [k, m] of msgs) if (t - m.at > 12 * 3600e3) msgs.delete(k); }, 600e3).unref();
// ================= 🧠 Xotira kartasi (guruhga)
function MR() { try { return require('./memroom.js').rooms; } catch (e) { return null; } }
function mmInfo(r) {
  const P = r ? r.p : [], S = r && r.S;
  const st = !r || r.status === 'wait' ? 'wait' : r.status === 'over' ? 'over' : 'live';
  const found = S ? Object.keys(S.done).length / 2 : 0;
  let v = r && r.watch ? r.watch.size : 0;
  return { st, a: P[0] ? P[0].name : '', b: P[1] ? P[1].name : '', sa: S ? S.sc[0] : 0, sb: S ? S.sc[1] : 0, turn: S ? S.turn : 0, win: r ? r.winner : null, size: r ? r.size : '4x6', tc: r ? r.tc : 0, found, v };
}
function tcTxt(tc) { return tc > 0 ? tc + ' s' : tc < 0 ? '⚡ ' + (-tc / 60) + ' daq' : 'vaqtsiz'; }
// emoji rasmlari (public/img/emo/<kod>.png) — server emoji shriftini chiza olmaydi
const EMO = new Map();
function emo(s) {
  const k = Array.from(String(s)).map(c => c.codePointAt(0).toString(16)).filter(h => h !== 'fe0f').join('-');
  if (EMO.has(k)) return EMO.get(k);
  let v = null; try { v = 'data:image/png;base64,' + require('fs').readFileSync(require('path').join(__dirname, 'public', 'img', 'emo', k + '.png')).toString('base64'); } catch (e) {}
  EMO.set(k, v); return v;
}
async function mmRender(codeX, from, romQ) {
  const r = MR() && MR().get(codeX), I = mmInfo(r); if (!r && from) I.a = from;
  const rom = r ? r.theme === 'romantic' : !!romQ;
  const DEMO = r && r.S ? {} : rom ? { 0: ['🌹', 1], 5: ['🌹', 1], 2: ['💌', 0], 9: ['🦋', 0], 14: ['🧸', 2], 19: ['🧸', 2], 22: ['💍', 0], 11: ['🌷', 0] } : { 0: ['🦊', 1], 5: ['🦊', 1], 2: ['🐼', 0], 9: ['🐸', 0], 14: ['🐱', 2], 19: ['🐱', 2], 22: ['🦁', 0] };
  const key = 'mm:' + codeX + ':' + (from || '') + ':' + (rom ? 'r' : '') + ':' + I.st + ':' + I.sa + ':' + I.sb + ':' + I.turn + ':' + I.found + ':' + I.v + ':' + I.a + ':' + I.b + ':' + (r && r.S ? r.S.up.join(',') : '');
  if (cache.has(key)) return cache.get(key);
  const sharp = require('sharp'), F = 'DejaVu Sans,sans-serif';
  const [w, h] = (I.size || '4x6').split('x').map(Number), S = r && r.S;
  const cell = Math.floor(Math.min(680 / w, 680 / h)), ox = 10 + (680 - cell * w) / 2, oy = 10 + (680 - cell * h) / 2;
  let g = '';
  for (let i = 0; i < w * h; i++) {
    const x = ox + (i % w) * cell + 4, y = oy + Math.floor(i / w) * cell + 4, z = cell - 8;
    let d = S && S.done[i], up = S && S.up.includes(i), sym = S ? S.deck[i] : null;
    if (!S && DEMO[i]) { sym = DEMO[i][0]; d = DEMO[i][1]; up = !d; }   // taklif kartasi: bir nechta karta ochiq (o'yin nima ekani ko'rinsin)
    const im = sym && emo(sym);
    if (im && (d || up)) { g += '<rect x="' + x + '" y="' + y + '" width="' + z + '" height="' + z + '" rx="12" fill="' + (d === 1 ? '#c8f7c5' : d === 2 ? '#ffd9cf' : '#fdf6e3') + '" stroke="' + (d === 1 ? '#3fa34d' : d === 2 ? '#e0533d' : '#ffd54f') + '" stroke-width="5"/><image href="' + im + '" x="' + (x + z * .17) + '" y="' + (y + z * .17) + '" width="' + (z * .66) + '" height="' + (z * .66) + '"/>'; continue; }
    if (d) g += '<rect x="' + x + '" y="' + y + '" width="' + z + '" height="' + z + '" rx="12" fill="' + (d === 1 ? '#3fa34d' : '#e0533d') + '"/><path d="M' + (x + z * .28) + ' ' + (y + z * .52) + ' l' + (z * .16) + ' ' + (z * .16) + ' l' + (z * .3) + ' -' + (z * .32) + '" stroke="#fff" stroke-width="' + (z * .09) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    else if (up) g += '<rect x="' + x + '" y="' + y + '" width="' + z + '" height="' + z + '" rx="12" fill="#fdf6e3" stroke="#ffd54f" stroke-width="4"/><text x="' + (x + z / 2) + '" y="' + (y + z * .66) + '" font-size="' + (z * .5) + '" text-anchor="middle" fill="#7a5a10" font-family="' + F + '">?</text>';
    else if (rom) { const cx = x + z / 2, cy = y + z * .54, k = z * .2; g += '<rect x="' + x + '" y="' + y + '" width="' + z + '" height="' + z + '" rx="12" fill="url(#cb)" stroke="#ffffff" stroke-width="2"/><path d="M' + cx + ' ' + (cy + k * 1.1) + ' C' + (cx - k * 2.2) + ' ' + (cy - k * .3) + ' ' + (cx - k * 1.1) + ' ' + (cy - k * 1.9) + ' ' + cx + ' ' + (cy - k * .8) + ' C' + (cx + k * 1.1) + ' ' + (cy - k * 1.9) + ' ' + (cx + k * 2.2) + ' ' + (cy - k * .3) + ' ' + cx + ' ' + (cy + k * 1.1) + ' Z" fill="#ff4d8d"/>'; }
    else g += '<rect x="' + x + '" y="' + y + '" width="' + z + '" height="' + z + '" rx="12" fill="url(#cb)" stroke="#ffffff33" stroke-width="2"/><text x="' + (x + z / 2) + '" y="' + (y + z * .64) + '" font-size="' + (z * .42) + '" text-anchor="middle" fill="#ffffff40" font-family="' + F + '">♛</text>';
  }
  const live = I.st === 'live';
  const pl = (y, nm, sc, col, on, crown) => '<g transform="translate(730 ' + y + ')"><rect width="250" height="96" rx="18" fill="' + (rom ? (on ? '#ffffff33' : '#ffffff1f') : on ? '#2b3a6b' : '#1c2547') + '" stroke="' + (on ? '#ffd54f' : rom ? '#ffffff55' : '#33406e') + '" stroke-width="3"/><circle cx="40" cy="48" r="20" fill="' + col + '"/>' +
    '<text x="72" y="44" font-size="' + (String(nm || 'Kutilmoqda…').length > 9 ? 18 : 25) + '" font-weight="700" fill="#fff" font-family="' + F + '">' + esc(String(nm || 'Kutilmoqda…').slice(0, 14)) + '</text><text x="72" y="78" font-size="24" font-weight="800" fill="#ffd54f" font-family="' + F + '">' + (I.st === 'wait' ? '' : sc + ' juftlik') + (crown ? '  ★' : '') + '</text></g>';
  const badge = I.st === 'wait' ? '▶ O‘YIN' : live ? 'JONLI' : I.win === -1 ? 'DURANG' : 'G‘OLIB', bc = I.st === 'wait' ? '#2e9d3a' : live ? '#c62828' : '#b7791f';
  const svg = (rom ? '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><defs><radialGradient id="bgm" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#ff5c8a"/><stop offset=".55" stop-color="#b0124f"/><stop offset="1" stop-color="#3d0420"/></radialGradient><linearGradient id="cb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffd1e0"/></linearGradient></defs>' : '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><defs><linearGradient id="bgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f4a8a"/><stop offset="1" stop-color="#060d22"/></linearGradient><linearGradient id="cb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b5ba8"/><stop offset="1" stop-color="#22397a"/></linearGradient></defs>') +
    '<rect width="1000" height="700" fill="url(#bgm)"/>' + g +
    '<text x="855" y="66" font-size="34" font-weight="800" fill="#ffd54f" text-anchor="middle" font-family="' + F + '">XOTIRA</text>' +
    '<text x="855" y="100" font-size="20" fill="#cbd5f5" text-anchor="middle" font-family="' + F + '">' + esc(I.size.replace('x', '×')) + ' · ' + esc(tcTxt(I.tc).replace('⚡ ', '')) + '</text>' +
    pl(150, I.a, I.sa, '#3fa34d', live && I.turn === 0, I.st === 'over' && I.win === 0) +
    '<text x="855" y="292" font-size="20" text-anchor="middle" fill="#cbd5f5" font-family="' + F + '">' + (live ? I.found + ' / ' + (w * h / 2) + ' topildi' + (I.v ? ' · ' + I.v + ' tomosha' : '') : I.st === 'over' ? 'O‘yin tugadi' : 'vs') + '</text>' +
    pl(330, I.b, I.sb, '#e0533d', live && I.turn === 1, I.st === 'over' && I.win === 1) +
    '<rect x="740" y="575" width="230" height="80" rx="20" fill="' + bc + '"/>' + (live ? '<circle cx="785" cy="615" r="11" fill="#fff"/>' : '') +
    '<text x="' + (live ? 870 : 855) + '" y="626" font-size="30" font-weight="800" fill="#fff" text-anchor="middle" font-family="' + F + '">' + badge + '</text></svg>';
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
  cache.set(key, buf); if (cache.size > 300) cache.delete(cache.keys().next().value);
  return buf;
}
const MM_CAP = 'O‘yla, izla, top — keng mushohada 🎮';
function mmUrl(codeX, v, from, rom) { const b = BASE(); return b ? b + '/api/mcard/' + codeX + '.jpg?v=' + (v || 0) + (from ? '&f=' + encodeURIComponent(from) : '') + (rom ? '&r=1' : '') : ''; }
function mmCaption(codeX, from) {
  const r = MR() && MR().get(codeX), I = mmInfo(r), sz = ' · ' + I.size.replace('x', '×') + ' · ⏱ ' + tcTxt(I.tc);
  const vt = r && r.votes ? Object.values(r.votes) : [], v0 = vt.filter(x => x === 0).length;
  if (I.st === 'wait') return I.b ? '🧠 <b>Xotira</b>' + sz + '\n⏳ ' + esc(I.a) + ' va ' + esc(I.b) + ' — ikkalasi kirishi bilan boshlanadi' : '🧠 <b>' + esc(I.a || from || 'Kimdir') + '</b> Xotira o‘yiniga chaqiryapti!' + sz + '\nBosing — raqib bo‘lasiz. Qolganlar tomosha qiladi 👁';
  if (I.st === 'live') return '🔴 <b>Jonli · Xotira</b>: 🟢 ' + esc(I.a) + ' ' + I.sa + ' : ' + I.sb + ' ' + esc(I.b) + ' 🔴' + sz + (I.v ? ' · ' + I.v + ' tomosha' : '') + (vt.length ? '\n🗳 Kim yutadi? 🟢 ' + v0 + ' · 🔴 ' + (vt.length - v0) : '\n🗳 Kim yutadi? Ovoz bering — topganlarga +5 💰');
  return '🏁 Xotira tugadi: ' + (I.win >= 0 ? '🏆 G‘olib — <b>' + esc(I.win === 0 ? I.a : I.b) + '</b>' : '🤝 durang') + '\n🟢 ' + esc(I.a) + ' ' + I.sa + ' : ' + I.sb + ' ' + esc(I.b) + ' 🔴' + (vt.length ? '\n🗳 To‘g‘ri topganlar +5 💰 oldi' : '');
}
function mmMarkup(link, codeX) {
  const r = MR() && MR().get(codeX), I = mmInfo(r);
  if (I.st === 'wait') return { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: link }]] };
  if (I.st === 'live') {
    const vt = r.votes ? Object.values(r.votes) : [], v0 = vt.filter(x => x === 0).length, rows = [[{ text: '👁 Tomosha qilish', url: link }]];
    if (I.found < 3) rows.push([{ text: '🟢 ' + String(I.a).slice(0, 12) + ' · ' + v0, callback_data: 'g:mv:' + codeX + ':0' }, { text: '🔴 ' + String(I.b).slice(0, 12) + ' · ' + (vt.length - v0), callback_data: 'g:mv:' + codeX + ':1' }]);
    return { inline_keyboard: rows };
  }
  return { inline_keyboard: [[{ text: '🔁 Revansh', callback_data: 'g:mr:' + codeX }, { text: '📊 Guruh TOP', callback_data: 'g:mt:' + codeX }]] };
}
function mmChosen(codeX, imid, from, link) { if (codeX && imid) msgs.set('mm:' + codeX, { imid, from, link, at: Date.now(), ver: 0, last: 0, mm: true }); }
function mmEdit(r, m) {
  m.last = Date.now(); m.ver++;
  const u = mmUrl(r.code, m.ver); if (!u) return;
  tg('editMessageText', { inline_message_id: m.imid, text: MM_CAP, link_preview_options: { url: mmUrl(r.code, m.ver + '_' + Date.now() % 1e6, m.from, r.theme === 'romantic'), prefer_large_media: true, show_above_text: true }, reply_markup: mmMarkup(m.link, r.code) });
}
function mmTouch(r) {
  const m = r && msgs.get('mm:' + r.code); if (!m) return;
  if (r.status === 'over' && !m.fin) { m.fin = true; try { require('./grp.js').mmOver(r, m); } catch (e) { console.log('[grp]', e.message); } }
  if (r.status !== 'over') m.fin = false;
  if (m.tmr) return;
  m.tmr = setTimeout(() => { m.tmr = null; mmEdit(r, m); }, Math.max(0, 3000 - (Date.now() - m.last)));
}
function mmNow(r) { const m = r && msgs.get('mm:' + r.code); if (m) { if (m.tmr) { clearTimeout(m.tmr); m.tmr = null; } mmEdit(r, m); } }
function handleHttp(req, res, p) {
  const mx = /^\/api\/mcard\/([A-Z0-9]{6})\.jpg$/.exec(p);
  if (mx) { mmRender(mx[1], String(new URL(req.url, 'http://x').searchParams.get('f') || '').slice(0, 30), new URL(req.url, 'http://x').searchParams.get('r') === '1').then(buf => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=60' }); res.end(buf); }).catch(e => { console.log('[mcard]', e.message); res.writeHead(500); res.end(); }); return true; }
  const mm = /^\/api\/gcard\/([a-z0-9]{4,16})\.jpg$/.exec(p); if (!mm) return false;
  const q = new URL(req.url, 'http://x').searchParams;
  render(mm[1], String(q.get('f') || '').slice(0, 30)).then(buf => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=60' }); res.end(buf); })
    .catch(e => { console.log('[gcard]', e.message); res.writeHead(500); res.end(); });
  return true;
}
module.exports = { MM_CAP, mmUrl, mmCaption, mmMarkup, mmChosen, mmTouch, mmNow, mmRender, setRooms: r => { ROOMS = r; }, setApi: a => { API = a; }, api: () => API, rooms: () => ROOMS, url, caption, markup, chosen, touch, now, msgOf, move, parseOpt, handleHttp, render, tg };
