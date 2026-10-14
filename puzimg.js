function svgBoard(board, side) {
  const S = 80, M = 28, W = S * 8 + M * 2, flip = side === 'b';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + W + '" viewBox="0 0 ' + W + ' ' + W + '">';
  s += '<defs>'
    + '<linearGradient id="fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8672a"/><stop offset="1" stop-color="#6e3a12"/></linearGradient>'
    + '<linearGradient id="dk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a3517"/><stop offset="1" stop-color="#6e2610"/></linearGradient>'
    + '<linearGradient id="lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c995"/><stop offset="1" stop-color="#ecb078"/></linearGradient>'
    + '<radialGradient id="wp" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9b9b9"/></radialGradient>'
    + '<radialGradient id="bp" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8a8a8a"/><stop offset="1" stop-color="#0d0d0d"/></radialGradient>'
    + '</defs>';
  s += '<rect width="' + W + '" height="' + W + '" fill="url(#fr)"/>';
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    const r = flip ? 7 - vr : vr, c = flip ? 7 - vc : vc, x = M + vc * S, y = M + vr * S;
    s += '<rect x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '" fill="url(#' + ((r + c) % 2 ? 'dk' : 'lt') + ')"/>';
    const v = board[r][c];
    if (v) {
      const w = v === 1 || v === 3, cx = x + S / 2, cy = y + S / 2;
      s += '<circle cx="' + (cx + 2) + '" cy="' + (cy + 4) + '" r="30" fill="#000" opacity=".35"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="31" fill="url(#' + (w ? 'wp' : 'bp') + ')" stroke="' + (w ? '#8f8f8f' : '#000') + '" stroke-width="2.5"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="21" fill="none" stroke="' + (w ? '#d0d0d0' : '#3a3a3a') + '" stroke-width="1.5"/>';
      if (v > 2) s += '<text x="' + cx + '" y="' + (cy + 10) + '" font-size="30" text-anchor="middle" fill="#f5b72b" font-family="DejaVu Sans, sans-serif">&#9819;</text>';
    }
  }
  const files = 'abcdefgh';
  for (let i = 0; i < 8; i++) {
    const f = flip ? files[7 - i] : files[i], n = flip ? i + 1 : 8 - i;
    s += '<text x="' + (M + i * S + S / 2) + '" y="' + (W - 8) + '" font-size="16" text-anchor="middle" fill="#f3d9b5" font-family="sans-serif">' + f + '</text>';
    s += '<text x="12" y="' + (M + i * S + S / 2 + 6) + '" font-size="16" text-anchor="middle" fill="#f3d9b5" font-family="sans-serif">' + n + '</text>';
  }
  return s + '</svg>';
}

module.exports = function sendPuzzle(pb, board, side) {
  const api = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;
  const fallback = () => fetch(api + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pb) }).then(r => r.json());
  let sharp;
  try { sharp = require('sharp'); } catch (e) { return fallback(); }
  return sharp(Buffer.from(svgBoard(board, side))).png().toBuffer().then(buf => {
    const fd = new FormData();
    fd.append('chat_id', String(pb.chat_id));
    if (pb.message_thread_id) fd.append('message_thread_id', String(pb.message_thread_id));
    fd.append('caption', String(pb.text).split('\n\n')[0].slice(0, 1000));
    fd.append('reply_markup', JSON.stringify(pb.reply_markup));
    fd.append('photo', new Blob([buf], { type: 'image/png' }), 'puzzle.png');
    return fetch(api + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json());
  }).then(d => (d && d.ok) ? d : fallback()).catch(() => fallback());
};
