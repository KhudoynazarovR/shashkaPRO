'use strict';
// tposter.js — 📣 turnir e'loni va natijasi kanalga (va kerak bo'lsa guruhlarga) rasm + matn + «Qo'shilish» tugmasi bilan.
// Rasm: SVG → PNG (sharp). Telegram'da 🪙 qora ko'rinadi, shuning uchun matnda 💰, rasmda tangani o'zimiz chizamiz.
const store = require('./store');
const W = 1280, H = 720, F = 'DejaVu Sans, Arial, sans-serif';
const CH = () => process.env.T_CHANNEL || process.env.PZ_CHANNEL || '@Draughts_uz';
const BOT = () => (process.env.BOT_USERNAME || 'DraughtsPRObot').replace(/^@/, '');
const APP = () => (process.env.TG_APP_LINK || process.env.APP_LINK || ('https://t.me/' + BOT() + '/play')).replace(/\/$/, '');
const x = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const noEmo = s => String(s || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s+/g, ' ').trim();   // rasm shriftida emoji yo'q
const fmt = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
function tz(t) { return new Date(t + 5 * 3600e3); }
function hm(t) { const d = tz(t); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }
function dayStr(t) { const d = tz(t); return DAYS[d.getUTCDay()] + ', ' + d.getUTCDate() + '-' + MON[d.getUTCMonth()]; }
function tcCat(tc) { const m = /^([\d.]+)\+(\d+)/.exec(String(tc || '')); if (!m) return ''; const e = +m[1] * 60 + +m[2] * 40; return e < 180 ? 'Bullet' : e < 480 ? 'Blits' : 'Rapid'; }
function tcTxt(tc) { const m = /^([\d.]+)\+(\d+)$/.exec(String(tc || '')); if (!m) return String(tc || ''); const b = +m[1]; const bs = b === 0.25 ? '¼' : b === 0.5 ? '½' : b === 0.75 ? '¾' : b === 1.5 ? '1½' : String(b); return bs + '+' + m[2]; }
const MIXN = { mm: '🧠 Xotira', sh: '⚫ Shashka', ug: '🏁 Ugolki', chess: '♟ Shaxmat', go: '⚪ Go', gomoku: '⭕ Gomoku', pod: '🔄 Poddavki' };
function kindTxt(t) { return t.mix ? 'Miks' : t.type === 'arena' ? 'Arena' : t.type === 'olympic' ? 'Olimpiya' : 'Shveytsar'; }
function sharp() { try { return require('sharp'); } catch (e) { return null; } }
async function png(svg) { const sh = sharp(); if (!sh) return null; try { return await sh(Buffer.from(svg)).png().toBuffer(); } catch (e) { console.log('[tposter] png', e.message); return null; } }
async function tg(method, params) {
  const T = process.env.BOT_TOKEN; if (!T) return null;
  return fetch('https://api.telegram.org/bot' + T + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).then(r => r.json()).catch(() => null);
}
async function sendPhoto(chat, buf, caption, kb, extra) {
  const T = process.env.BOT_TOKEN; if (!T) return null;
  if (!buf) return tg('sendMessage', Object.assign({ chat_id: chat, text: caption, parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } }, extra || {}));
  const fd = new FormData();
  fd.append('chat_id', String(chat)); fd.append('caption', caption.slice(0, 1024)); fd.append('parse_mode', 'HTML');
  if (kb) fd.append('reply_markup', JSON.stringify(kb));
  for (const [k, v] of Object.entries(extra || {})) fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  { const jp = buf[0] === 0xff && buf[1] === 0xd8; fd.append('photo', new Blob([buf], { type: jp ? 'image/jpeg' : 'image/png' }), jp ? 't.jpg' : 't.png'); }
  return fetch('https://api.telegram.org/bot' + T + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json()).catch(() => null);
}
// ---------- rasm qismlari
function bg() {
  let sq = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if ((r + c) % 2) sq += '<rect x="' + (c * 80) + '" y="' + (r * 80) + '" width="80" height="80"/>';
  return '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b1150"/><stop offset=".55" stop-color="#3b1d8f"/><stop offset="1" stop-color="#6d28d9"/></linearGradient>' +
    '<radialGradient id="cn" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff3b0"/><stop offset=".3" stop-color="#fcd34d"/><stop offset=".75" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/></radialGradient></defs>' +
    '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/><g transform="translate(700,-90) rotate(-14)" fill="#fff" opacity=".13">' + sq + '</g>';
}
function coin(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#cn)" stroke="#b45309" stroke-width="5"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.62) + '" fill="none" stroke="#fde68a" stroke-width="3" opacity=".8"/>'; }
function chip(xp, y, txt, fill) { const w = 26 + txt.length * 15.5; return { w, s: '<rect x="' + xp + '" y="' + y + '" width="' + w + '" height="50" rx="14" fill="' + (fill || 'rgba(0,0,0,.28)') + '"/><text x="' + (xp + w / 2) + '" y="' + (y + 34) + '" font-family="' + F + '" font-size="25" font-weight="700" fill="#fff" text-anchor="middle">' + x(txt) + '</text>' }; }
function regBadge(xp, y, k, c, w, hh, fs) { return '<rect x="' + xp + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="10" fill="' + c + '"/><text x="' + (xp + w / 2) + '" y="' + (y + hh * 0.7) + '" font-family="' + F + '" font-size="' + fs + '" font-weight="900" fill="#fff" text-anchor="middle">' + x(/^[A-Z]+$/.test(k) ? k : 'XORIJ') + '</text>'; }
function annSvg(t) {
  const name = noEmo(t.name).slice(0, 34), tags = t.mix ? [kindTxt(t), t.mix.length + ' o‘yin', t.rated === false ? 'Reytingsiz' : 'Reytingli'] : [kindTxt(t), tcTxt(t.tc) + ' ' + tcCat(t.tc), t.pos === 'idf' ? 'IDF 780' : 'Standart', t.rated === false ? 'Reytingsiz' : 'Reytingli'].concat(t.flag ? ['Bayroqli'] : []);
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' + bg();
  s += '<circle cx="1000" cy="240" r="44" fill="#f5f5f5"/><circle cx="1130" cy="340" r="44" fill="#1f1f2e"/><circle cx="930" cy="410" r="44" fill="#1f1f2e"/>';
  s += '<text x="70" y="90" font-family="' + F + '" font-size="30" font-weight="900" fill="#fbbf24" letter-spacing="2">' + (t.rec ? 'HAFTALIK TURNIR' : 'YANGI TURNIR') + '</text>';
  s += '<text x="1210" y="90" font-family="' + F + '" font-size="26" font-weight="700" fill="#fff" opacity=".8" text-anchor="end">@' + x(BOT()) + '</text>';
  s += '<text x="70" y="172" font-family="' + F + '" font-size="' + (name.length > 22 ? 56 : 70) + '" font-weight="900" fill="#fff">' + x(name) + '</text>';
  const dt = dayStr(t.startAt), tm = hm(t.startAt) + (t.endAt ? ' – ' + hm(t.endAt) : '');
  const dw = 60 + dt.length * 25 + tm.length * 17;
  s += '<rect x="70" y="205" width="' + dw + '" height="84" rx="22" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.28)" stroke-width="2"/>';
  s += '<text x="98" y="261" font-family="' + F + '" font-size="42" font-weight="900" fill="#fff">' + x(dt) + '<tspan font-size="30" font-weight="400" dx="18">' + x(tm) + '</tspan></text>';
  let cx = 70, cy = 320;
  for (const tg0 of tags) { const c = chip(cx, cy, tg0); if (cx + c.w > 800) { cx = 70; cy += 62; } const c2 = chip(cx, cy, tg0); s += c2.s; cx += c2.w + 12; }
  if (t.prize > 0) {
    s += coin(110, 620, 40) + '<text x="170" y="592" font-family="' + F + '" font-size="25" fill="#fff" opacity=".85">Mukofot fondi</text><text x="170" y="652" font-family="' + F + '" font-size="60" font-weight="900" fill="#fcd34d">' + fmt(t.prize) + '</text>';
  }
  if (t.flag) { const R = require('./flags.js').REG; const ks = ['Surxondaryo', 'Toshkent', 'Samarqand', 'Andijon']; let bx = 1210 - ks.length * 96; for (const k of ks) { s += regBadge(bx, 610, R[k][0], R[k][1], 84, 48, 22); bx += 96; } }
  return s + '</svg>';
}
function resSvg(t, st, regs) {
  const name = noEmo(t.name).slice(0, 30), d = tz(t.startAt || Date.now());
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' + bg();
  s += '<text x="70" y="90" font-family="' + F + '" font-size="30" font-weight="900" fill="#fbbf24" letter-spacing="2">TURNIR NATIJASI</text>';
  s += '<text x="70" y="160" font-family="' + F + '" font-size="58" font-weight="900" fill="#fff">' + x(name + ' · ' + String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0')) + '</text>';
  const win = regs && regs.length ? regs[0] : null, p1 = st[0];
  if (win) {
    s += regBadge(70, 200, win.k, win.c, 150, 96, 46) + '<text x="244" y="228" font-family="' + F + '" font-size="27" fill="#fff" opacity=".9">G‘olib viloyat</text>';
    s += '<text x="244" y="280" font-family="' + F + '" font-size="54" font-weight="900" fill="#fbbf24">' + x(win.r) + '</text><text x="244" y="318" font-family="' + F + '" font-size="25" fill="#fff" opacity=".85">' + x(win.score + ' ochko · eng yaxshi 5 o‘yinchi') + '</text>';
  } else if (p1) {
    s += '<text x="70" y="235" font-family="' + F + '" font-size="27" fill="#fff" opacity=".9">G‘olib</text><text x="70" y="295" font-family="' + F + '" font-size="58" font-weight="900" fill="#fbbf24">' + x(noEmo(p1.name).slice(0, 24)) + '</text><text x="70" y="335" font-family="' + F + '" font-size="25" fill="#fff" opacity=".85">' + x(p1.score + ' ochko') + '</text>';
  }
  const col = (x0, title, rows) => {
    let o = '<text x="' + x0 + '" y="392" font-family="' + F + '" font-size="22" font-weight="700" fill="#fff" opacity=".85" letter-spacing="1">' + x(title) + '</text>';
    rows.slice(0, 3).forEach((r, i) => {
      const y = 412 + i * 66, gold = i === 0;
      o += '<rect x="' + x0 + '" y="' + y + '" width="552" height="56" rx="16" fill="' + (gold ? '#fbbf24' : 'rgba(255,255,255,.12)') + '"/>';
      o += '<circle cx="' + (x0 + 35) + '" cy="' + (y + 28) + '" r="17" fill="' + (['#fff', '#d6dbe6', '#e0975a'][i]) + '"/><text x="' + (x0 + 35) + '" y="' + (y + 35) + '" font-family="' + F + '" font-size="19" font-weight="900" fill="#222" text-anchor="middle">' + (i + 1) + '</text>';
      let nx = x0 + 66;
      if (r.k) { o += regBadge(nx, y + 11, r.k, r.c, 64, 34, 17); nx += 76; }
      o += '<text x="' + nx + '" y="' + (y + 37) + '" font-family="' + F + '" font-size="25" font-weight="700" fill="' + (gold ? '#2a1a00' : '#fff') + '">' + x(noEmo(r.n).slice(0, 20)) + '</text>';
      o += '<text x="' + (x0 + 532) + '" y="' + (y + 37) + '" font-family="' + F + '" font-size="25" font-weight="800" fill="' + (gold ? '#2a1a00' : '#fff') + '" text-anchor="end">' + x(r.v) + '</text>';
    });
    return o;
  };
  if (regs && regs.length) s += col(70, 'VILOYATLAR', regs.map(r => ({ k: r.k, c: r.c, n: r.r, v: r.score })));
  s += col(regs && regs.length ? 658 : 70, 'ENG YAXSHI O‘YINCHILAR', st.map(p => ({ k: p.rg && /^[A-Z]+$/.test(p.rg) ? p.rg : null, c: p.rc, n: p.name, v: p.score })));
  const games = Math.round(st.reduce((a, p) => a + (p.games || 0), 0) / 2);
  s += '<text x="70" y="684" font-family="' + F + '" font-size="24" fill="#fff" opacity=".75">@' + x(BOT()) + '</text><text x="1210" y="684" font-family="' + F + '" font-size="24" fill="#fff" opacity=".75" text-anchor="end">' + x(games + ' o‘yin · ' + st.length + ' o‘yinchi') + '</text>';
  return s + '</svg>';
}
// ---------- e'lon
function joinKb(t) { return { inline_keyboard: [[{ text: '▶️ Turnirga qo‘shilish', url: APP() + '?startapp=lbt_' + t.id }]] }; }
function annCap(t) {
  let c = '🏆 <b>' + h(t.name) + '</b>\n\n📅 ' + dayStr(t.startAt) + ' · ' + hm(t.startAt) + (t.endAt ? '–' + hm(t.endAt) : '') + '\n';
  c += t.mix ? '🔀 Miks: ' + t.mix.map(g => MIXN[g] || g).join(' → ') + '\n' : '⚡ ' + kindTxt(t) + ' · ' + tcTxt(t.tc) + ' ' + tcCat(t.tc) + ' · ' + (t.pos === 'idf' ? 'IDF 780 pozitsiyalari' : 'standart pozitsiya') + '\n';
  c += (t.rated === false ? '🤝 Reytingsiz' : '⭐ Reytingli') + '\n';
  if (t.flag) c += '🏳️ Viloyatingiz uchun o‘ynang — eng yaxshi 5 o‘yinchi ochkosi viloyatga!\n';
  if (t.prize > 0) c += '💰 Mukofot fondi: <b>' + fmt(t.prize) + '</b>\n';
  if (t.desc) c += '\n' + h(t.desc) + '\n';
  return c + '\n👇 Qo‘shilish uchun tugmani bosing';
}
// 🤖 «Insonlar va Botlar» jangi — tayyor rasm (admin tanlagan) ustiga turnir ma'lumotlari yoziladi
function isHvb(t) { return (t.clubIds || []).includes('cbots') || /inson.*bot|bot.*inson/i.test(String(t.name || '')); }
async function hvbPng(t) {
  const sh = sharp(); if (!sh) return null;
  const fs = require('fs'), path = require('path'), f = path.join(__dirname, 'public', 'img', 'hvb_bg.jpg'); if (!fs.existsSync(f)) return null;
  const d = tz(t.startAt), num = (/(?:#|jangi\s*)(\d+)/i.exec(String(t.name || '')) || /(\d+)\s*$/.exec(String(t.name || '')) || [])[1];
  const date = d.getUTCDate() + '-' + MON[d.getUTCMonth()], time = hm(t.startAt) + (t.endAt ? ' - ' + hm(t.endAt) : '');
  const tags = [kindTxt(t), tcTxt(t.tc) + ' ' + tcCat(t.tc), t.pos === 'idf' ? 'IDF 780' : 'Standart', t.rated === false ? 'Reytingsiz' : 'Reytingli'];
  const tz2 = s0 => s0.length > 10 ? 25 : s0.length > 8 ? 28 : 32;
  const T = (xx, y, txt, fs0, fill, anchor, w, st, extra) => '<text x="' + xx + '" y="' + y + '" font-family="' + F + '" font-size="' + fs0 + '" font-weight="' + (w || 900) + '" font-style="' + (st || 'italic') + '" fill="' + fill + '" text-anchor="' + (anchor || 'start') + '"' + (extra || '') + '>' + x(txt) + '</text>';
  let o = '<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941"><defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#e08a00"/></linearGradient>' +
    '<filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".5"/></filter></defs>';
  const dayLine = dayStr(t.startAt);
  o += T(850, 372, 'Jangi' + (num ? ' ' + num : ''), 72, '#0b1440', 'middle');
  o += '<g filter="url(#ds)">' + T(843, 486, dayLine, dayLine.length > 20 ? 50 : 56, '#ffffff', 'middle', 800, 'normal') + T(843, 534, time, 38, '#ffffff', 'middle', 400, 'normal') + '</g>';
  const cx = [537, 739, 947, 1148];
  o += '<g filter="url(#ds)">' + tags.map((g, k) => T(cx[k], 622, g, tz2(g), '#fff', 'middle', 700, 'normal')).join('') + '</g>';
  if (t.prize > 0) { const pz = fmt(t.prize), fs1 = pz.length > 5 ? 38 : pz.length > 3 ? 50 : 80; o += '<g filter="url(#ds)">' + T(272, 846, pz, fs1, 'url(#gd)', 'middle', 900, 'italic', ' stroke="#7a4b00" stroke-width="2"') + '</g>'; }
  o += '</svg>';
  try { return await sh(f).composite([{ input: Buffer.from(o) }]).jpeg({ quality: 90 }).toBuffer(); } catch (e) { console.log('[tposter] hvb', e.message); return null; }
}
async function announce(t) {
  try {
    const buf = (isHvb(t) && await hvbPng(t)) || await png(annSvg(t));
    const r = await sendPhoto(CH(), buf, annCap(t), joinKb(t));
    if (r && r.ok && r.result) t.annMsg = r.result.message_id;
    console.log('[tposter] e\'lon:', t.name, r && r.ok ? 'yuborildi' : JSON.stringify(r && r.description));
    let fid = ''; try { const a = r.result.photo; fid = a[a.length - 1].file_id; } catch (e) {}
    const GR = Array.from(new Set((store.db.groups || []).map(String).concat(String(process.env.T_GROUPS || '').split(','), String(process.env.EXTRA_GROUP_IDS || '').split(',')).map(z => z.trim()).filter(Boolean)));
    for (const g of GR) {   // 👥 bot admin bo'lgan barcha guruhlarga (avtomatik ro'yxat) + T_GROUPS
      try { const r2 = fid ? await tg('sendPhoto', { chat_id: g, photo: fid, caption: annCap(t), parse_mode: 'HTML', reply_markup: joinKb(t) }) : await sendPhoto(g, buf, annCap(t), joinKb(t)); if (r2 && r2.ok && r2.result) { t.annGrp = t.annGrp || {}; t.annGrp[g] = r2.result.message_id; } console.log('[tposter] guruh', g, r2 && r2.ok ? 'ok' : JSON.stringify(r2 && r2.description)); } catch (e) {}
    }
    // o'yinchilarga shaxsiy xabar yuborilmaydi — e'lon faqat kanal va guruhlarda
  } catch (e) { console.log('[tposter] e\'lon xato', e.message); }
}
// 📨 platformadagi o'yinchilarga botda shaxsiy xabar (rasm bilan). Oxirgi 60 kunda kirganlar, «turnir xabarlari»ni o'chirmaganlar.
// Telegram cheklovi: sekundiga ~25 xabar — biz 15/s yuboramiz.
function broadcast(t, fid, buf) {
  try {
    const now = Date.now(), us = store.users(), N = require('./notify.js');
    const ids = Object.keys(us).filter(id => /^\d+$/.test(id) && !us[id].banned && now - (us[id].lastSeen || 0) < 60 * 86400e3 && N.allowed(id, 'arena'));
    let i = 0, ok = 0;
    const cap = annCap(t), kb = joinKb(t);
    const next = () => {
      if (i >= ids.length) { console.log('[tposter] xabar yuborildi:', ok, '/', ids.length); return; }
      const id = ids[i++];
      const p = fid ? tg('sendPhoto', { chat_id: Number(id), photo: fid, caption: cap, parse_mode: 'HTML', reply_markup: kb }) : sendPhoto(Number(id), buf, cap, kb);
      Promise.resolve(p).then(r => { if (r && r.ok) ok++; }).catch(() => {});
      setTimeout(next, 70);
    };
    console.log('[tposter] o‘yinchilarga xabar:', ids.length, 'kishi');
    next();
  } catch (e) { console.log('[tposter] broadcast xato', e.message); }
}
async function remind(t) {
  try {
    const extra = t.annMsg ? { reply_parameters: { message_id: t.annMsg, allow_sending_without_reply: true } } : {};
    await tg('sendMessage', Object.assign({ chat_id: CH(), parse_mode: 'HTML', text: '⏰ <b>' + h(t.name) + '</b> — 15 daqiqadan keyin boshlanadi!\n👥 ' + t.players.size + ' kishi yozildi' + (t.prize > 0 ? ' · 💰 ' + fmt(t.prize) : ''), reply_markup: joinKb(t) }, extra));
  } catch (e) {}
}
// st: o'yinchilar (o'rin tartibida, rg/rc bilan), regs: viloyatlar hisobi, pay: { reg: [{name, amt}], top: [{name, amt}] }
// 🤖 Botlar va Insonlar: natija — umumiy g'olib (bot ham bo'lishi mumkin) + mukofot olgan insonlar; inson 1-o'rinda bo'lsa — «Botlar ovchisi»
async function avBuf(uid, isBot) {   // ishtirokchi rasmi: profil rasmi → Telegram rasmi
  try {
    const u = require('./store.js').users()[String(uid)] || {};
    const m = /^data:image\/(?:jpeg|png|webp);base64,(.+)$/.exec(isBot ? (u.avatar || '') : (require('./store.js').avOf(u) || ''));
    if (m) return Buffer.from(m[1], 'base64');
    if (!isBot && /^\d+$/.test(String(uid))) {
      const p = await tg('getUserProfilePhotos', { user_id: Number(uid), limit: 1 }), ph = p && p.ok && p.result.photos[0];
      if (ph) { const f = await tg('getFile', { file_id: ph[ph.length - 1].file_id }); if (f && f.ok) { const r = await fetch('https://api.telegram.org/file/bot' + process.env.BOT_TOKEN + '/' + f.result.file_path); if (r.ok) return Buffer.from(await r.arrayBuffer()); } }
    }
  } catch (e) {}
  return null;
}
async function hvbResPng(t, all, hum, hunter) {
  const sh = sharp(); if (!sh) return null;
  const fs = require('fs'), path = require('path'), d = tz(t.startAt || Date.now()), w0 = all[0];
  const name = noEmo(t.name).slice(0, 30), dl = dayStr(t.startAt || Date.now()) + ' ' + d.getUTCFullYear() + ' · ' + hm(t.startAt || Date.now()) + (t.endAt ? '–' + hm(t.endAt) : '');
  const T = (xx, y, s0, fs0, fill, w, a, ex) => '<text x="' + xx + '" y="' + y + '" font-family="' + F + '" font-size="' + fs0 + '" font-weight="' + (w || 700) + '" fill="' + fill + '"' + (a ? ' text-anchor="' + a + '"' : '') + (ex || '') + '>' + x(s0) + '</text>';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><radialGradient id="bgr" cx=".25" cy=".5" r=".85"><stop offset="0" stop-color="#1e5bff"/><stop offset=".4" stop-color="#0b2a9a"/><stop offset="1" stop-color="#071042"/></radialGradient>' +
    '<pattern id="ck" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fff"/><rect x="40" y="40" width="40" height="40" fill="#fff"/></pattern><linearGradient id="fd" x1="0" x2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient><mask id="mk"><rect width="1280" height="720" fill="url(#fd)"/></mask>' +
    '<linearGradient id="gw" x1="0" x2="1"><stop offset="0" stop-color="' + (hunter ? '#ffcf3a' : '#b8c6e6') + '"/><stop offset="1" stop-color="' + (hunter ? '#ff9f1a' : '#7f93c4') + '"/></linearGradient><clipPath id="ca"><circle cx="642" cy="252" r="44"/></clipPath></defs>' +
    '<rect width="1280" height="720" fill="url(#bgr)"/><rect width="1280" height="720" fill="url(#ck)" mask="url(#mk)"/>';
  s += T(560, 78, 'TURNIR NATIJASI', 20, '#ffd34d', 900, '', ' letter-spacing="4"') + T(560, 126, name, 38, '#fff', 900) + T(560, 160, dl, 20, '#fff', 400, '', ' opacity=".85"');
  s += '<rect x="560" y="186" width="674" height="132" rx="20" fill="url(#gw)"/><circle cx="642" cy="252" r="47" fill="#fff" opacity=".9"/>';
  const tc = hunter ? '#1a0d00' : '#0a1430';
  s += T(706, 220, hunter ? 'G‘OLIB · BARCHA BOTLARNI ORTDA QOLDIRDI' : 'TURNIR G‘OLIBI', 15, tc, 800, '', ' letter-spacing="2" opacity=".85"');
  s += T(706, 268, noEmo(w0.name).slice(0, 22), 40, tc, 900);
  s += T(706, 300, w0.score + ' ochko' + (hunter ? ' · «Botlar ovchisi» nishoni' : ' · «Botlar ovchisi» bu safar hech kimga nasib qilmadi'), hunter ? 20 : 15, tc, 700);
  const rows = (hunter ? all : hum).slice(0, 3);
  s += '<rect x="560" y="340" width="674" height="' + (52 + rows.length * 56) + '" rx="20" fill="#050c32" fill-opacity=".6" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>';
  s += T(584, 372, hunter ? 'JADVAL' : 'ENG YAXSHI INSONLAR · MUKOFOT', 16, '#9fc0ff', 800, '', ' letter-spacing="2"');
  rows.forEach((p, i) => {
    const y = 412 + i * 56;
    s += '<circle cx="602" cy="' + (y - 8) + '" r="17" fill="' + (i === 0 ? '#ffcf3a' : '#2c3c99') + '"/>' + T(602, y - 1, String(i + 1), 18, i === 0 ? '#1a0d00' : '#fff', 900, 'middle');
    const nm0 = noEmo(p.name).replace(/\s*BOT$/i, '').slice(0, 24);
    s += T(634, y, nm0, 24, '#fff', 600) + (p.bot ? T(634 + nm0.length * 15.5 + 10, y - 1, 'BOT', 15, '#fff', 600, '', ' opacity=".7"') : '') + T(1212, y, String(p.score), 24, '#ffd34d', 900, 'end');
  });
  s += T(160 + 120, 690, hunter ? 'BOTLAR OVCHISI!' : 'BOTLAR G‘OLIB CHIQDI', hunter ? 44 : 34, hunter ? '#ffd34d' : '#cfe0ff', 900, 'middle', hunter ? ' stroke="#6a3d00" stroke-width="2"' : '');
  if (t.prize > 0) s += T(560, 690, 'Mukofot fondi: ' + fmt(t.prize) + ' tanga', 18, '#fff', 400, '', ' opacity=".75"');
  s += T(1234, 690, '@' + BOT(), 18, '#fff', 400, 'end', ' opacity=".75"') + '</svg>';
  const comp = [];
  try { let b = await sh(path.join(__dirname, 'public', 'img', 'bhunt_r.png')).resize(440, 485, { fit: 'inside' }); if (!hunter) b = b.modulate({ saturation: 0.55, brightness: 0.85 }); comp.push({ input: await b.png().toBuffer(), left: 60, top: 120 }); } catch (e) {}
  try {
    const ab = await avBuf(w0.uid, w0.bot);
    if (ab) { const mask = Buffer.from('<svg width="88" height="88"><circle cx="44" cy="44" r="44" fill="#fff"/></svg>'); comp.push({ input: await sh(ab).resize(88, 88, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), left: 598, top: 208 }); }
    else s = s.replace('</svg>', T(642, 266, (noEmo(w0.name).trim()[0] || '?').toUpperCase(), 40, tc, 900, 'middle') + '</svg>');
  } catch (e) {}
  try { return await sh(Buffer.from(s)).composite(comp).jpeg({ quality: 90 }).toBuffer(); } catch (e) { console.log('[tposter] hvb natija', e.message); return null; }
}
async function hvbResult(t, all, hum, pay) {
  try {
    const med = ['🥇', '🥈', '🥉'], w0 = all[0]; if (!w0) return;
    const hunter = !w0.bot && /^\d+$/.test(String(w0.uid)), d = tz(t.startAt || Date.now());
    let c = '🏁 <b>' + h(t.name) + ' ' + String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '</b> yakunlandi!\n\n';
    c += '🏆 Turnir g‘olibi: <b>' + h(w0.name) + '</b> — ' + w0.score + ' ochko\n';
    if (hunter) c += '🎖 <b>' + h(w0.name) + '</b> barcha botlarni ortda qoldirib, «Botlar ovchisi» nishonini oldi!\n';
    all.slice(1, 3).forEach((p, i) => { c += (i + 2) + '. ' + h(p.name) + ' — ' + p.score + '\n'; });
    if (t.prize > 0) c += '\n💰 Mukofot fondi: ' + fmt(t.prize) + '\n';
    c += '\n👤 Eng yaxshi insonlar (mukofot):\n';
    hum.slice(0, 3).forEach((p, i) => { const a = pay && pay.top && pay.top[i]; c += med[i] + ' ' + h(p.name) + ' — ' + p.score + ' ochko' + (a && a.amt ? ' · ' + fmt(a.amt) + ' 💰' : '') + '\n'; });
    const games = Math.round(all.reduce((a, p) => a + (p.games || 0), 0) / 2);
    c += '\n🎮 ' + games + ' o‘yin · ' + all.length + ' o‘yinchi';
    const buf = await hvbResPng(t, all, hum, hunter);
    const kb = { inline_keyboard: [[{ text: '🎮 ShashkaPRO', url: APP() }]] };
    const r = await sendPhoto(CH(), buf, c, kb, t.annMsg ? { reply_parameters: { message_id: t.annMsg, allow_sending_without_reply: true } } : {});
    let fid = ''; try { const a = r.result.photo; fid = a[a.length - 1].file_id; } catch (e) {}
    const GR = Array.from(new Set((require('./store.js').db.groups || []).map(String).concat(String(process.env.T_GROUPS || '').split(',')).map(z => z.trim()).filter(Boolean)));
    for (const g of GR) {
      const mid = t.annGrp && t.annGrp[g], ex = mid ? { reply_parameters: { message_id: mid, allow_sending_without_reply: true } } : {};
      try { if (fid) await tg('sendPhoto', Object.assign({ chat_id: g, photo: fid, caption: c.slice(0, 1024), parse_mode: 'HTML', reply_markup: kb }, ex)); else await sendPhoto(g, buf, c, kb, ex); } catch (e) {}
    }
  } catch (e) { console.log('[tposter] hvb natija xato', e.message); }
}
async function result(t, st, regs, pay, all) {
  if (all && all.length && isHvb(t)) return hvbResult(t, all, st, pay);
  try {
    const med = ['🥇', '🥈', '🥉'];
    const d = tz(t.startAt || Date.now());
    let c = '🏁 <b>' + h(t.name) + ' ' + String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '</b> yakunlandi!\n\n';
    if (regs && regs.length) {
      c += '👑 G‘olib viloyat: <b>' + h(regs[0].k) + ' ' + h(regs[0].r) + '</b> — ' + regs[0].score + ' ochko\n\n';
      regs.slice(0, 5).forEach((r, i) => { c += (med[i] || (i + 1) + '.') + ' ' + h(r.k) + ' ' + h(r.r) + ' — ' + r.score + '\n'; });
      c += '\n';
    }
    if (t.prize > 0) c += '🏆 Mukofot fondi: ' + fmt(t.prize) + ' 💰\n\n';
    if (pay && pay.reg && pay.reg.length) { c += '👑 G‘olib viloyat o‘yinchilari:\n'; pay.reg.forEach((p, i) => { c += (med[i] || (i + 1) + '.') + ' ' + h(p.name) + ' — ' + fmt(p.amt) + ' 💰\n'; }); c += '\n'; }
    c += '⭐ Eng yaxshi o‘yinchilar:\n';
    st.slice(0, 3).forEach((p, i) => { const a = pay && pay.top && pay.top[i]; c += med[i] + ' ' + (p.rg ? (/^[A-Z]+$/.test(p.rg) ? h(p.rg) + ' ' : p.rg + ' ') : '') + h(p.name) + ' — ' + p.score + ' ochko' + (a && a.amt ? ' · ' + fmt(a.amt) + ' 💰' : '') + '\n'; });
    const games = Math.round(st.reduce((a, p) => a + (p.games || 0), 0) / 2);
    c += '\n🎮 ' + games + ' o‘yin · ' + st.length + ' o‘yinchi';
    const buf = await png(resSvg(t, st, regs));
    const extra = t.annMsg ? { reply_parameters: { message_id: t.annMsg, allow_sending_without_reply: true } } : {};
    await sendPhoto(CH(), buf, c, { inline_keyboard: [[{ text: '🎮 ShashkaPRO', url: APP() }]] }, extra);
  } catch (e) { console.log('[tposter] natija xato', e.message); }
}
async function today(t) {
  try {
    const extra = t.annMsg ? { reply_parameters: { message_id: t.annMsg, allow_sending_without_reply: true } } : {};
    await tg('sendMessage', Object.assign({ chat_id: CH(), parse_mode: 'HTML', text: '📣 <b>Bugun ' + hm(t.startAt) + ' da — ' + h(t.name) + '!</b>\n⏱ ' + tcTxt(t.tc) + ' ' + tcCat(t.tc) + (t.flag ? ' · 🏳️ viloyatingiz uchun' : '') + (t.prize > 0 ? ' · 💰 ' + fmt(t.prize) : '') + '\n👥 ' + t.players.size + ' kishi yozildi — siz ham qo‘shiling 👇', reply_markup: joinKb(t) }, extra));
  } catch (e) {}
}
async function cancelAnn(t) {   // ❌ turnir bekor qilindi — kanal va guruhlardagi e'lon o'chiriladi
  try { if (t.annMsg) await tg('deleteMessage', { chat_id: CH(), message_id: t.annMsg }); } catch (e) {}
  for (const [g, mid] of Object.entries(t.annGrp || {})) { try { await tg('deleteMessage', { chat_id: g, message_id: mid }); } catch (e) {} }
}
module.exports = { hvbResPng, hvbResult, cancelAnn, hvbPng, isHvb, today, announce, remind, result, annSvg, resSvg, png, dayStr, hm };
