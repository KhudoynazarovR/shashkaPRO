async function pcImgs(sharp) {
  try {
    const it = (require('./store').db.shop || []).find(x => x.def);
    if (!it || !it.imgs) return null;
    const o = {};
    for (const k of ['w', 'b', 'wk', 'bk']) {
      const m = /^data:image\/(?:png|webp|jpeg);base64,(.+)$/.exec(it.imgs[k] || '');
      if (!m) return null;
      const buf = await sharp(Buffer.from(m[1], 'base64')).resize(68, 68, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      o[k] = 'data:image/png;base64,' + buf.toString('base64');
    }
    return o;
  } catch (e) { return null; }
}
function svgBoard(board, side, IM) {
  const S = 80, M = 28, W = S * 8 + M * 2, flip = side === 'b';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + W + '" viewBox="0 0 ' + W + ' ' + W + '">';
  s += '<defs>'
    + '<linearGradient id="fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eeb272"/><stop offset="1" stop-color="#e9a868"/></linearGradient>'
    + '<linearGradient id="dk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b2f13"/><stop offset=".5" stop-color="#702a10"/><stop offset="1" stop-color="#7d3114"/></linearGradient>'
    + '<linearGradient id="lt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3bb86"/><stop offset=".5" stop-color="#f6c493"/><stop offset="1" stop-color="#eaa874"/></linearGradient>'
    + '<radialGradient id="wp" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#f0f0f0"/><stop offset="1" stop-color="#bdbdbd"/></radialGradient>'
    + '<radialGradient id="bp" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8a8a8a"/><stop offset=".35" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0b0b0b"/></radialGradient>'
    + '</defs>';
  s += '<rect width="' + W + '" height="' + W + '" fill="url(#fr)"/>'; /* edeonL */ s += '<rect x="' + (M - 2) + '" y="' + (M - 2) + '" width="' + (S * 8 + 4) + '" height="' + (S * 8 + 4) + '" fill="none" stroke="#8a4a1c" stroke-width="3"/>';
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    const r = flip ? 7 - vr : vr, c = flip ? 7 - vc : vc, x = M + vc * S, y = M + vr * S;
    s += '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="url(#' + ((r + c) % 2 ? 'dk' : 'lt') + ')"/>';
    const v = board[r][c];
    if (v) {
      const w = v === 1 || v === 3, cx = x + S / 2, cy = y + S / 2;
      if (IM) { s += '<image xlink:href="' + IM[v === 1 ? 'w' : v === 2 ? 'b' : v === 3 ? 'wk' : 'bk'] + '" x="' + (cx - 34) + '" y="' + (cy - 34) + '" width="68" height="68"/>'; continue; }
      s += '<circle cx="' + (cx + 2) + '" cy="' + (cy + 4) + '" r="30" fill="#000" opacity=".35"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="31" fill="url(#' + (w ? 'wp' : 'bp') + ')" stroke="' + (w ? '#9a9a9a' : '#000') + '" stroke-width="2.5"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="21" fill="none" stroke="' + (w ? '#d0d0d0' : '#3a3a3a') + '" stroke-width="1.5"/>';
      if (v > 2) s += '<text x="' + cx + '" y="' + (cy + 10) + '" font-size="30" text-anchor="middle" fill="#f5b72b" font-family="DejaVu Sans, sans-serif">&#9819;</text>';
    }
  }
  const files = 'abcdefgh';
  for (let i = 0; i < 8; i++) {
    const f = flip ? files[7 - i] : files[i], n = flip ? i + 1 : 8 - i;
    s += '<text x="' + (M + i * S + S / 2) + '" y="' + (W - 8) + '" font-size="16" text-anchor="middle" fill="#6b3a14" font-family="sans-serif">' + f + '</text>';
    s += '<text x="12" y="' + (M + i * S + S / 2 + 6) + '" font-size="16" text-anchor="middle" fill="#6b3a14" font-family="sans-serif">' + n + '</text>';
  }
  return s + '</svg>';
}

module.exports = function sendPuzzle(pb, board, side) {
  const api = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;
  const fallback = () => fetch(api + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pb) }).then(r => r.json());
  let sharp;
  try { sharp = require('sharp'); } catch (e) { return fallback(); }
  return pcImgs(sharp).then(IM => sharp(Buffer.from(svgBoard(board, side, IM))).png().toBuffer().catch(() => sharp(Buffer.from(svgBoard(board, side, null))).png().toBuffer())).then(buf => {
    const fd = new FormData();
    fd.append('chat_id', String(pb.chat_id));
    if (pb.message_thread_id) fd.append('message_thread_id', String(pb.message_thread_id));
    fd.append('caption', String(pb.text).split('\n\n')[0].slice(0, 1000));
    fd.append('reply_markup', JSON.stringify(pb.reply_markup));
    fd.append('photo', new Blob([buf], { type: 'image/png' }), 'puzzle.png');
    return fetch(api + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json());
  }).then(d => (d && d.ok) ? d : fallback()).catch(() => fallback());
};
module.exports.svgBoard = svgBoard;
