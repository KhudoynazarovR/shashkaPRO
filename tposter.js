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
function coinIcon(cx, cy, r) {
  // tanga: oltin disk, qirrali chekka, ichki halqa va «T» belgisi
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#cn)" stroke="#92400e" stroke-width="3"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 4) + '" fill="none" stroke="#b45309" stroke-width="2" stroke-dasharray="3 3"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 9) + '" fill="none" stroke="#fde68a" stroke-width="2" opacity=".9"/>' +
    '<text x="' + cx + '" y="' + (cy + r * 0.36) + '" font-family="' + F + '" font-size="' + Math.round(r * 0.9) + '" font-weight="900" fill="#92400e" text-anchor="middle">T</text>';
}
function chip(xp, y, txt, fill) { const w = 26 + txt.length * 15.5; return { w, s: '<rect x="' + xp + '" y="' + y + '" width="' + w + '" height="50" rx="14" fill="' + (fill || 'rgba(0,0,0,.28)') + '"/><text x="' + (xp + w / 2) + '" y="' + (y + 34) + '" font-family="' + F + '" font-size="25" font-weight="700" fill="#fff" text-anchor="middle">' + x(txt) + '</text>' }; }
function regBadge(xp, y, k, c, w, hh, fs) { return '<rect x="' + xp + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="10" fill="' + c + '"/><text x="' + (xp + w / 2) + '" y="' + (y + hh * 0.7) + '" font-family="' + F + '" font-size="' + fs + '" font-weight="900" fill="#fff" text-anchor="middle">' + x(/^[A-Z]+$/.test(k) ? k : 'XORIJ') + '</text>'; }
function annSvg(t) {
  // Ko‘k fon, shashka kletkali chekkalar, kalendar/soat/tanga belgilari, sariq «Qo‘shilish» tugmasi
  const name = noEmo(t.name).slice(0, 34);
  const tags = t.mix ? [kindTxt(t), t.mix.length + ' o‘yin', t.rated === false ? 'Reytingsiz' : 'Reytingli'] : [kindTxt(t), tcTxt(t.tc) + ' ' + tcCat(t.tc), t.pos === 'idf' ? 'IDF 780' : 'Standart', t.rated === false ? 'Reytingsiz' : 'Reytingli'].concat(t.flag ? ['Bayroqli'] : []);
  const dt = dayStr(t.startAt), tm = hm(t.startAt) + (t.endAt ? ' – ' + hm(t.endAt) : '');
  const CX = W / 2;
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">';
  s += '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>' +
    '<radialGradient id="cn" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff3b0"/><stop offset=".3" stop-color="#fcd34d"/><stop offset=".75" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/></radialGradient></defs>';
  s += '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>';
  // chekkalar: ikki chetda shashka taxtasi kletkasi
  const SQ = 60;
  for (const side of [0, W - 120]) {
    for (let r = 0; r < Math.ceil(H / SQ); r++) for (let c = 0; c < 2; c++) {
      const dark = (r + c) % 2 === 1;   // to‘q kletka va oq kletka: ikkalasi ham fonda ko‘rinadi
      s += '<rect x="' + (side + c * SQ) + '" y="' + (r * SQ) + '" width="' + SQ + '" height="' + SQ + '" fill="' + (dark ? '#0b1f5c' : '#ffffff') + '" opacity="' + (dark ? '.55' : '.22') + '"/>';
    }
  }
  // yuqori belgi va sarlavha
  const tagTxt = t.rec ? 'HAFTALIK TURNIR' : 'YANGI TURNIR';
  const tagW = 60 + tagTxt.length * 17;
  s += '<rect x="' + (CX - tagW / 2) + '" y="88" width="' + tagW + '" height="52" rx="26" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.35)" stroke-width="2"/>';
  s += '<text x="' + CX + '" y="124" font-family="' + F + '" font-size="24" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="3">' + tagTxt + '</text>';
  s += '<text x="' + CX + '" y="240" font-family="' + F + '" font-size="' + (name.length > 22 ? 58 : 70) + '" font-weight="900" fill="#fff" text-anchor="middle">' + x(name) + '</text>';
  // tashkilotchi ismi (yaratuvchi) — sarlavha ostida
  { const org = noEmo(String(t.creatorName || '')).slice(0, 26); if (org && t.creatorUid !== 'sys') s += '<text x="' + CX + '" y="278" font-family="' + F + '" font-size="24" font-weight="700" fill="#fff" fill-opacity=".85" text-anchor="middle">Tashkilotchi: ' + x(org) + '</text>'; }
  // ma’lumot kartalari: sana (kalendar), vaqt (soat), mukofot (tanga)
  const items = [];
  { const dp = dt.split(', '); items.push({ kind: 'cal', big: dp[1] || dt, small: (dp[0] || 'SANA').toUpperCase() }); }
  items.push({ kind: 'clock', big: tm, small: 'BOSHLANISH – TUGASH' });
  if (t.prize > 0) items.push({ kind: 'coin', big: fmt(t.prize) + ' tanga', small: 'MUKOFOT FONDI' });
  const BW = 320, BH = 110, GAP = 26;
  let bx = CX - (items.length * BW + (items.length - 1) * GAP) / 2;
  const by = 290;
  for (const it of items) {
    s += '<rect x="' + bx + '" y="' + by + '" width="' + BW + '" height="' + BH + '" rx="22" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.3)" stroke-width="2"/>';
    const ix = bx + 62, iy = by + BH / 2;
    if (it.kind === 'cal') s += '<g transform="translate(' + (bx + 20) + ',' + (by + 30) + ') scale(1.6)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></g>';
    if (it.kind === 'clock') s += '<g transform="translate(' + (bx + 20) + ',' + (by + 30) + ') scale(1.6)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></g>';
    if (it.kind === 'coin') s += coinIcon(bx + 54, by + BH / 2, 26);
    const tx = bx + (it.kind === 'coin' ? 102 : 74);
    s += '<text x="' + tx + '" y="' + (by + 48) + '" font-family="' + F + '" font-size="' + (it.big.length > 14 ? 26 : 30) + '" font-weight="900" fill="#fff">' + x(it.big) + '</text>';
    s += '<text x="' + tx + '" y="' + (by + 80) + '" font-family="' + F + '" font-size="16" font-weight="700" fill="#fff" opacity=".8" letter-spacing="1.5">' + x(it.small) + '</text>';
    bx += BW + GAP;
  }
  // format belgilari
  const chipW = tags.map(tg0 => 26 + tg0.length * 15.5);
  const rowW = chipW.reduce((a, b) => a + b, 0) + (tags.length - 1) * 12;
  let cx = CX - rowW / 2;
  for (let i = 0; i < tags.length; i++) { s += chip(cx, 440, tags[i]).s.replace('fill="rgba(0,0,0,.28)"', 'fill="#fff" fill-opacity=".95"').replace(/fill="#fff" font-size="25"/, 'fill="#1e3a8a" font-size="25"'); cx += chipW[i] + 12; }
  // tugma
  s += '<rect x="' + (CX - 230) + '" y="530" width="460" height="92" rx="22" fill="#facc15"/><rect x="' + (CX - 230) + '" y="530" width="460" height="92" rx="22" fill="none" stroke="#ca8a04" stroke-width="4"/>';
  s += '<text x="' + CX + '" y="572" font-family="' + F + '" font-size="34" font-weight="900" fill="#1e293b" text-anchor="middle">Qo‘shilish</text>';
  s += '<text x="' + CX + '" y="604" font-family="' + F + '" font-size="20" font-weight="700" fill="#334155" text-anchor="middle">@' + x(BOT()) + '</text>';
  // flag badges (agar viloyat turniri bo‘lsa)
  if (t.flag) { const R = require('./flags.js').REG; const ks = ['Surxondaryo', 'Toshkent', 'Samarqand', 'Andijon']; let fx = CX - (ks.length * 96 - 12) / 2; for (const k of ks) { s += regBadge(fx, 652, R[k][0], R[k][1], 84, 48, 22); fx += 96; } }
  return s + '</svg>';
}
function resSvg(t, st, regs, pay) {
  // 🟩 natija posteri: yashil mato fon, shashka katakchalari, lenta va konfetti (1080×1350)
  const RW = 1080, RH = 1350, name = noEmo(t.name).slice(0, 26), d = tz(t.endAt || t.startAt || Date.now());
  const dt = String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear();
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + RW + '" height="' + RH + '">';
  s += '<defs>' +
    '<radialGradient id="fg" cx="50%" cy="6%" r="95%"><stop offset="0%" stop-color="#13624a"/><stop offset="45%" stop-color="#0b3d2e"/><stop offset="100%" stop-color="#04211a"/></radialGradient>' +
    '<radialGradient id="vg" cx="50%" cy="40%" r="75%"><stop offset="45%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient>' +
    '<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd977" stop-opacity=".30"/><stop offset="100%" stop-color="#ffbe3c" stop-opacity=".07"/></linearGradient>' +
    '<linearGradient id="rib" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0506a"/><stop offset="100%" stop-color="#c01030"/></linearGradient>' +
    '<pattern id="chk" width="150" height="150" patternUnits="userSpaceOnUse"><rect width="75" height="75" fill="#fff" fill-opacity=".055"/><rect x="75" y="75" width="75" height="75" fill="#fff" fill-opacity=".055"/></pattern>' +
    '<radialGradient id="rm" cx="50%" cy="31%" r="52%"><stop offset="35%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff" stop-opacity="1"/></radialGradient>' +
    '<mask id="chkm"><rect width="' + RW + '" height="' + RH + '" fill="url(#rm)"/></mask>' +
    '</defs>';
  s += '<rect width="' + RW + '" height="' + RH + '" fill="url(#fg)"/>';
  s += '<g mask="url(#chkm)"><rect width="' + RW + '" height="' + RH + '" fill="url(#chk)"/></g>';
  // oltin nurlar
  let ry = '';
  for (let a = 0; a < 360; a += 15) ry += '<path d="M540 430 L' + (540 + 1400 * Math.cos((a - 2.6) * Math.PI / 180)) + ' ' + (430 + 1400 * Math.sin((a - 2.6) * Math.PI / 180)) + ' L' + (540 + 1400 * Math.cos((a + 2.6) * Math.PI / 180)) + ' ' + (430 + 1400 * Math.sin((a + 2.6) * Math.PI / 180)) + ' Z" fill="#ffd678" fill-opacity=".13"/>';
  s += '<g>' + ry + '</g><rect width="' + RW + '" height="' + RH + '" fill="url(#vg)"/>';
  // konfetti — chekkalarda va tepada, matnni to'smaydi
  const CC = ['#ffc93c', '#e03b52', '#4ade80', '#38bdf8', '#f472b6', '#ffffff', '#a78bfa'];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  let cf = '';
  for (let i = 0; i < 110; i++) {
    let cx0 = rnd() * RW, cy0 = rnd() * (RH + 40) - 40;
    if (cy0 > 230 && cy0 < 1180 && cx0 > 60 && cx0 < RW - 60) cx0 = rnd() < .5 ? rnd() * 60 : RW - rnd() * 60;
    const w0 = 9 + rnd() * 12, h0 = 11 + rnd() * 16, rt = -60 + rnd() * 120, c0 = CC[i % CC.length], op = (0.4 + rnd() * 0.6).toFixed(2);
    cf += rnd() < .22
      ? '<circle cx="' + cx0.toFixed(0) + '" cy="' + cy0.toFixed(0) + '" r="' + (w0 / 2).toFixed(0) + '" fill="' + c0 + '" fill-opacity="' + op + '"/>'
      : '<rect x="' + cx0.toFixed(0) + '" y="' + cy0.toFixed(0) + '" width="' + w0.toFixed(0) + '" height="' + h0.toFixed(0) + '" rx="2" fill="' + c0 + '" fill-opacity="' + op + '" transform="rotate(' + rt.toFixed(0) + ' ' + cx0.toFixed(0) + ' ' + cy0.toFixed(0) + ')"/>';
  }
  s += cf;
  // sarlavha
  s += '<text x="62" y="84" font-family="' + F + '" font-size="27" font-weight="900" fill="#e4cfa4" letter-spacing="5">YAKUNLANDI</text>';
  s += '<text x="' + (RW - 62) + '" y="84" font-family="' + F + '" font-size="27" font-weight="800" fill="#e4cfa4" letter-spacing="3" text-anchor="end">' + x(dt) + '</text>';
  s += '<text x="62" y="172" font-family="' + F + '" font-size="' + (name.length > 20 ? 62 : 74) + '" font-weight="900" fill="#fff">' + x(name) + '</text>';
  s += '<text x="62" y="218" font-family="' + F + '" font-size="28" fill="#dcc79d">' + x(tcTxt(t.tc) + ' · ' + (t.durationMin || 60) + ' daqiqa · ' + (t.flag ? 'viloyatlar jangi' : (t.clubIds && t.clubIds.length ? 'klublar jangi' : kindTxt(t)))) + '</text>';
  // lenta
  s += '<path d="M250 268 h170 v56 h-170 l28 -28 Z" fill="#8e1226"/><path d="M830 268 h-170 v56 h170 l-28 -28 Z" fill="#8e1226"/>';
  s += '<rect x="356" y="246" width="368" height="92" rx="18" fill="url(#rib)" stroke="#ffffff" stroke-opacity=".26" stroke-width="3"/>';
  s += '<text x="540" y="308" font-family="' + F + '" font-size="44" font-weight="900" fill="#fff" letter-spacing="10" text-anchor="middle">G‘OLIB</text>';
  // g'olib karta
  const win = regs && regs.length ? regs[0] : null, p1 = st[0];
  const wName = win ? win.r : (p1 ? noEmo(p1.name).slice(0, 18) : '—');
  const wScore = win ? win.score : (p1 ? p1.score : 0);
  const wSub = win ? ((win.n || 0) + ' o‘yinchi · ' + win.score + ' ochko') : (p1 ? (p1.games || 0) + ' o‘yin · ' + p1.score + ' ochko' : '');
  s += '<rect x="62" y="372" width="956" height="162" rx="30" fill="url(#gold)" stroke="#ffce5a" stroke-opacity=".75" stroke-width="3"/>';
  if (win && win.k) s += regBadge(102, 410, win.k, win.c, 128, 86, 40);
  s += '<text x="' + (win && win.k ? 258 : 110) + '" y="455" font-family="' + F + '" font-size="' + (String(wName).length > 14 ? 46 : 56) + '" font-weight="900" fill="#fff">' + x(wName) + '</text>';
  s += '<text x="' + (win && win.k ? 258 : 110) + '" y="496" font-family="' + F + '" font-size="26" fill="#f4ddad">' + x(wSub) + '</text>';
  s += '<text x="978" y="478" font-family="' + F + '" font-size="80" font-weight="900" fill="#ffc93c" text-anchor="end">' + x(wScore) + '</text>';
  // 2-4 o'rin
  const rest = (regs && regs.length ? regs.slice(1, 4).map(r => ({ k: r.k, c: r.c, n: r.r, v: r.score })) : st.slice(1, 4).map(p => ({ k: p.rg && /^[A-Z]+$/.test(p.rg) ? p.rg : null, c: p.rc, n: noEmo(p.name).slice(0, 20), v: p.score })));
  rest.forEach((r, i) => {
    const y = 566 + i * 78;
    s += '<rect x="62" y="' + y + '" width="956" height="66" rx="18" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".07" stroke-width="2"/>';
    s += '<circle cx="110" cy="' + (y + 33) + '" r="19" fill="' + (['#d6dbe6', '#e0975a', '#9aa3b2'][i] || '#9aa3b2') + '"/><text x="110" y="' + (y + 41) + '" font-family="' + F + '" font-size="21" font-weight="900" fill="#20170a" text-anchor="middle">' + (i + 2) + '</text>';
    let nx = 146;
    if (r.k) { s += regBadge(nx, y + 16, r.k, r.c, 84, 36, 19); nx += 100; }
    s += '<text x="' + nx + '" y="' + (y + 44) + '" font-family="' + F + '" font-size="32" font-weight="700" fill="#fff">' + x(r.n) + '</text>';
    s += '<text x="978" y="' + (y + 45) + '" font-family="' + F + '" font-size="34" font-weight="900" fill="#ffc93c" text-anchor="end">' + x(r.v) + '</text>';
  });
  // ikki quti: eng yaxshi o'yinchilar / mukofot
  const by = 566 + rest.length * 78 + 16, bh = 236;
  const box = (bx, bw, title, rows, num) => {
    let o = '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="22" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".08" stroke-width="2"/>';
    o += '<text x="' + (bx + 26) + '" y="' + (by + 44) + '" font-family="' + F + '" font-size="22" font-weight="900" fill="#e4cfa4" letter-spacing="2">' + x(title) + '</text>';
    rows.slice(0, 3).forEach((r, i) => {
      const y = by + 92 + i * 48;
      o += '<text x="' + (bx + 26) + '" y="' + y + '" font-family="' + F + '" font-size="29" font-weight="600" fill="#fff">' + x((num ? (i + 1) + '. ' : '') + r[0]) + '</text>';
      o += '<text x="' + (bx + bw - 26) + '" y="' + y + '" font-family="' + F + '" font-size="29" font-weight="900" fill="#ffc93c" text-anchor="end">' + x(r[1]) + '</text>';
    });
    return o;
  };
  s += box(62, 468, 'ENG YAXSHI O‘YINCHILAR', st.slice(0, 3).map(p => [noEmo(p.name).slice(0, 14), p.score]), true);
  const pz = [];
  if (t.prize > 0) {
    pz.push(['Jami', fmt(t.prize)]);
    const gs = pay && pay.regSum && pay.regSum.length ? pay.regSum.reduce((a, r) => a + (r.amt || 0), 0) : 0;
    if (gs) { pz.push([t.flag ? 'G‘olib viloyat' : 'G‘olib klub', fmt((pay.regSum[0] || {}).amt || 0)]); pz.push(['Shaxsiy 1–3', fmt(t.prize - gs)]); }
    else pz.push(['Shaxsiy 1–3', fmt(t.prize)]);
  }
  s += box(550, 468, pz.length ? 'MUKOFOT · TANGA' : 'TURNIR', pz.length ? pz : [['O‘yinchilar', st.length], ['O‘yinlar', Math.round(st.reduce((a, p) => a + (p.games || 0), 0) / 2)]]);
  // pastki qator
  const games = Math.round(st.reduce((a, p) => a + (p.games || 0), 0) / 2);
  const fy = by + bh + 62;
  s += '<line x1="62" y1="' + (fy - 34) + '" x2="1018" y2="' + (fy - 34) + '" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>';
  s += '<text x="62" y="' + fy + '" font-family="' + F + '" font-size="29" fill="#dcc79d">' + x(games + ' o‘yin · ' + st.length + ' o‘yinchi') + '</text>';
  s += '<text x="1018" y="' + fy + '" font-family="' + F + '" font-size="29" fill="#dcc79d" text-anchor="end">@' + x(BOT()) + '</text>';
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
  if (t.creatorName && t.creatorUid !== 'sys') c += '👤 Tashkilotchi: <b>' + h(t.creatorName) + '</b>\n';
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

async function podiumPng(t, st, pay, all) {
  const sh = sharp(); if (!sh || !st.length) return null;
  const top = st.slice(0, 3);
  const avatars = await Promise.all(top.map(async p => {
    try { const b = await avBuf(p.uid, p.bot); return b ? (await sh(b).resize(240,240,{fit:'cover'}).png().toBuffer()).toString('base64') : ''; } catch(e) { return ''; }
  }));
  const d = tz(t.endAt || t.startAt || Date.now());
  const date = String(d.getUTCDate()).padStart(2,'0')+'.'+String(d.getUTCMonth()+1).padStart(2,'0')+'.'+d.getUTCFullYear();
  const txt = (cx,y,v,size=32,color='#fff',weight=700) => '<text x="'+cx+'" y="'+y+'" text-anchor="middle" font-family="'+F+'" font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'">'+x(v)+'</text>';
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1370"><defs><radialGradient id="bg"><stop stop-color="#176449"/><stop offset="1" stop-color="#031810"/></radialGradient>';
  const metals = [['#fff2a0','#c18b19','#714005'],['#f2f5fa','#9ca7b4','#394653'],['#ffc68c','#b7682e','#63300d']];
  metals.forEach((m,i)=>{svg+='<linearGradient id="m'+i+'"><stop stop-color="'+m[2]+'"/><stop offset=".45" stop-color="'+m[0]+'"/><stop offset=".65" stop-color="'+m[1]+'"/><stop offset="1" stop-color="'+m[2]+'"/></linearGradient>';});
  svg+='</defs><rect width="1080" height="1370" fill="url(#bg)"/>';
  for(let i=0;i<30;i++){let a=i*Math.PI/15;svg+='<path d="M540 420 L'+(540+1600*Math.cos(a))+' '+(420+1600*Math.sin(a))+' L'+(540+1600*Math.cos(a+.07))+' '+(420+1600*Math.sin(a+.07))+' Z" fill="#ffe49b" opacity=".045"/>';}
  for(let i=0;i<65;i++){let xx=(i*173+29)%1080, yy=(i*97+13)%1200;if(xx<55||xx>1025||yy<65)svg+='<rect x="'+xx+'" y="'+yy+'" width="12" height="20" fill="#f5ca62" opacity=".7" transform="rotate(35 '+xx+' '+yy+')"/>';}
  svg+='<rect x="35" y="30" width="1010" height="1310" rx="32" fill="none" stroke="#d5a74a" stroke-width="3"/>';
  svg+=txt(540,100,'SHASHKA PRO',55,'#ffe19a',900);
  svg+='<rect x="65" y="130" width="950" height="95" rx="24" fill="#092c22" stroke="#e7bc58" stroke-width="3"/>';
  const title=noEmo(t.name).slice(0,48);svg+=txt(540,190,title,Math.min(46,Math.floor(1500/Math.max(1,title.length))),'#fff',900);
  svg+='<rect x="285" y="245" width="510" height="65" rx="14" fill="#a51e35" stroke="#f6bc64" stroke-width="2"/>'+txt(540,287,date+' · YAKUNLANDI',30);
  for(const i of [1,0,2]){
    const p=top[i];if(!p)continue;
    const cx=[540,205,875][i], cy=[445,520,550][i], rad=i===0?116:98, base=[745,805,835][i], metal=metals[i][0];
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(rad+9)+'" fill="url(#m'+i+')"/><circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="#263b3a"/>';
    if(avatars[i])svg+='<clipPath id="av'+i+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'"/></clipPath><image x="'+(cx-rad)+'" y="'+(cy-rad)+'" width="'+(2*rad)+'" height="'+(2*rad)+'" clip-path="url(#av'+i+')" xlink:href="data:image/png;base64,'+avatars[i]+'"/>';
    else svg+=txt(cx,cy+32,(noEmo(p.name)||'?').slice(0,1).toUpperCase(),88);
    if(i===0)svg+='<path d="M490 328 L480 290 L515 309 L540 278 L565 309 L600 290 L590 328 Z" fill="#f8ce59" stroke="#fff1a1" stroke-width="3"/>';
    const name=noEmo(p.name)||'O‘yinchi', label=name.length>22?name.slice(0,21)+'…':name;
    svg+='<rect x="'+(cx-151)+'" y="'+(cy+rad+18)+'" width="302" height="104" rx="20" fill="#071d17" stroke="'+metal+'" stroke-width="3"/>';
    svg+=txt(cx,cy+rad+55,label,Math.min(29,Math.floor(430/Math.max(1,label.length))))+txt(cx,cy+rad+93,p.score+' ochko',32,metal);
    svg+='<rect x="'+(cx-155)+'" y="'+base+'" width="310" height="'+(970-base)+'" rx="18" fill="url(#m'+i+')"/><ellipse cx="'+cx+'" cy="'+base+'" rx="155" ry="20" fill="'+metal+'"/>';
    svg+=txt(cx,base+88,String(i+1),82,'#fff4db',900);
    const award=pay&&pay.top&&pay.top.find(a=>String(a.uid)===String(p.uid));
    if(award && Number(award.amt)>0) {
      svg+='<rect x="'+(cx-126)+'" y="914" width="252" height="46" rx="20" fill="#071d17" stroke="'+metal+'" stroke-width="2"/>';
      svg+=txt(cx,946,fmt(award.amt)+' tanga',30,'#ffe19a',900);
    }
  }
  const list=all&&all.length?all:st, games=Math.round(list.reduce((n,p)=>n+(p.games||0),0)/2);
  svg+='<rect x="65" y="1000" width="950" height="110" rx="22" fill="#092c22" stroke="#d5a74a" stroke-width="2"/>';
  svg+=txt(290,1043,games+' o‘yin · '+list.length+' o‘yinchi',29)+txt(290,1082,'TURNIR NATIJASI',22,'#e7bc58');
  svg+=txt(790,1043,'Mukofot fondi',27)+txt(790,1082,fmt(t.prize)+' tanga',35,'#ffe19a');
  svg+='<rect x="65" y="1130" width="950" height="175" rx="24" fill="#082b21" stroke="#e7bc58" stroke-width="3"/><circle cx="155" cy="1217" r="55" fill="#229ed9"/><path d="M112 1212 L193 1182 L177 1250 L151 1228 L137 1240 L140 1220 Z" fill="#fff"/>';
  svg+=txt(595,1185,'@'+BOT(),48,'#ffe19a',900)+txt(595,1230,'Onlayn shashka · Kundalik Arena turnirlari',27)+txt(595,1272,'Telegramda botni ishga tushiring!',29,'#e7bc58')+'</svg>';
  return png(svg);
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
    if (t.prize > 0) c += '🏆 Mukofot fondi: ' + fmt(t.prize) + ' tanga\n\n';
    if (pay && pay.regSum && pay.regSum.length) {   // 🏳️ 1-2-3 viloyat ulushi
      c += (t.flag ? '👑 Viloyatlar ulushi:\n' : '👑 Klublar ulushi:\n');
      pay.regSum.forEach((r, i) => { c += (med[i] || (i + 1) + '.') + ' ' + (r.k ? h(r.k) + ' ' : '') + h(r.r) + ' — ' + fmt(r.amt) + ' tanga\n'; });
      c += '\n';
    }
    if (pay && pay.reg && pay.reg.length) {
      const w = pay.reg.filter(p => !p.place || p.place === 1);
      if (w.length) { c += (t.flag ? '👑 G‘olib viloyat o‘yinchilari:\n' : '👑 G‘olib klub o‘yinchilari:\n'); w.forEach((p, i) => { c += (med[i] || (i + 1) + '.') + ' ' + h(p.name) + ' — ' + fmt(p.amt) + ' tanga\n'; }); c += '\n'; }
    }
    c += '⭐ Eng yaxshi o‘yinchilar:\n';
    st.slice(0, 3).forEach((p, i) => { const a = pay && pay.top && pay.top[i]; c += med[i] + ' ' + (p.rg ? (/^[A-Z]+$/.test(p.rg) ? h(p.rg) + ' ' : p.rg + ' ') : '') + h(p.name) + ' — ' + p.score + ' ochko' + (a && a.amt ? ' · ' + fmt(a.amt) + ' tanga' : '') + '\n'; });
    const games = Math.round(st.reduce((a, p) => a + (p.games || 0), 0) / 2);
    c += '\n🎮 ' + games + ' o‘yin · ' + st.length + ' o‘yinchi';
    const buf = (t.type === 'arena' && !(regs && regs.length) ? await podiumPng(t, st, pay, all).catch(() => null) : null) || await png(resSvg(t, st, regs, pay));
    const extra = t.annMsg ? { reply_parameters: { message_id: t.annMsg, allow_sending_without_reply: true } } : {};
    if (c.length > 1020) c = c.slice(0, Math.max(0, c.lastIndexOf('\n', 1020)));   // Telegram izoh chegarasi — qator chegarasidan kesamiz
    const kb = { inline_keyboard: [[{ text: '🎮 ShashkaPRO', url: APP() }]] };
    const r = await sendPhoto(CH(), buf, c, kb, extra);
    let fid = ''; try { const a = r.result.photo; fid = a[a.length - 1].file_id; } catch (e) {}
    const GR = Array.from(new Set((store.db.groups || []).map(String).concat(String(process.env.T_GROUPS || '').split(','), String(process.env.EXTRA_GROUP_IDS || '').split(',')).map(z => z.trim()).filter(Boolean)));
    for (const g of GR) {   // 👥 natija bot admin bo'lgan guruhlarga ham
      const ex = (t.annGrp && t.annGrp[g]) ? { reply_parameters: { message_id: t.annGrp[g], allow_sending_without_reply: true } } : {};
      try { if (fid) await tg('sendPhoto', Object.assign({ chat_id: g, photo: fid, caption: c.slice(0, 1024), parse_mode: 'HTML', reply_markup: kb }, ex)); else await sendPhoto(g, buf, c, kb, ex); } catch (e) {}
    }
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
// 📣 admin tanlagan joylarga (kanal/guruhlar) e'lon. Bir joyga ikki marta yuborilmaydi.
async function announceTo(t, ids) {
  const buf = (isHvb(t) && await hvbPng(t)) || await png(annSvg(t));
  t.annSentTo = t.annSentTo || {};
  const out = [];
  for (const g of ids) {
    if (t.annSentTo[g]) { out.push({ id: g, ok: false, why: 'yuborilgan' }); continue; }
    try {
      const r = await sendPhoto(g, buf, annCap(t), joinKb(t));
      if (r && r.ok && r.result) { t.annSentTo[g] = r.result.message_id; t.annGrp = t.annGrp || {}; t.annGrp[g] = r.result.message_id; out.push({ id: g, ok: true }); }
      else out.push({ id: g, ok: false, why: (r && r.description) || 'xato' });
    } catch (e) { out.push({ id: g, ok: false, why: e.message }); }
  }
  console.log('[tposter] tanlangan e\'lon:', t.name, JSON.stringify(out));
  return out;
}

// ---------- 💰 HOMIY portreti: homiylik qilgan odamga yuboriladi
function sponsorSvg(t, sp, top, avB64) {
  const SW = 1080, SH = 1350, SC = SW / 2;
  const T = (xx, y, txt, fs, fill, w, a) => '<text x="' + xx + '" y="' + y + '" font-family="' + F + '" font-size="' + fs + '" font-weight="' + (w || 700) + '" fill="' + fill + '"' + (a ? ' text-anchor="' + a + '"' : '') + '>' + x(txt) + '</text>';
  const nm2 = noEmo(String(sp.name || 'Homiy')).slice(0, 20) || 'Homiy';
  const ini = (nm2.trim()[0] || '?').toUpperCase();
  const gold = !top;
  const c1 = gold ? '#2b1c08' : '#2a1358', c2 = gold ? '#180f05' : '#1a0c3c', c3 = gold ? '#0d0803' : '#0b0520';
  const acc = gold ? '#ffd36a' : '#d9c2ff', accD = gold ? '#cf9212' : '#8a5ae0';
  let sq = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) if ((r + c) % 2) sq += '<rect x="' + (c * 120) + '" y="' + (r * 120) + '" width="120" height="120"/>';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + SW + '" height="' + SH + '" viewBox="0 0 ' + SW + ' ' + SH + '">' +
    '<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset=".5" stop-color="' + c2 + '"/><stop offset="1" stop-color="' + c3 + '"/></linearGradient>' +
    '<radialGradient id="shl" cx=".5" cy=".1" r=".62"><stop offset="0" stop-color="' + acc + '" stop-opacity=".34"/><stop offset="1" stop-color="' + acc + '" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (gold ? '#ffe9a9' : '#e9d6ff') + '"/><stop offset="1" stop-color="' + accD + '"/></linearGradient>' +
    '<linearGradient id="avg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (gold ? '#ff9f61' : '#7cc8ff') + '"/><stop offset="1" stop-color="' + (gold ? '#d94e28' : '#2f5fd0') + '"/></linearGradient>' +
    '<radialGradient id="cn3" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff3b0"/><stop offset=".3" stop-color="#fcd34d"/><stop offset=".75" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/></radialGradient></defs>' +
    '<rect width="' + SW + '" height="' + SH + '" fill="url(#sg)"/><rect width="' + SW + '" height="' + SH + '" fill="url(#shl)"/>' +
    '<g transform="translate(0,' + (SH - 470) + ')" fill="#fff" opacity=".055">' + sq + '</g>' +
    '<rect x="28" y="28" width="' + (SW - 56) + '" height="' + (SH - 56) + '" rx="40" fill="none" stroke="' + acc + '" stroke-opacity=".45" stroke-width="3"/>';
  s += T(SC, 118, 'SHASHKAPRO', 30, '#e3c489', 800, 'middle');
  s += T(SC, 212, (top ? 'BOSH HOMIY' : 'HOMIY'), 78, acc, 900, 'middle');
  s += T(SC, 262, (top ? 'ENG KATTA HOMIYLIK' : 'MUKOFOT JAMG‘ARMASIGA'), 28, gold ? '#c9ab74' : '#b9a3e8', 700, 'middle');
  const cy = 470, R = 140;
  s += '<circle cx="' + SC + '" cy="' + cy + '" r="' + (R + 12) + '" fill="none" stroke="' + acc + '" stroke-width="11"/>';
  if (avB64) {
    s += '<defs><clipPath id="avc"><circle cx="' + SC + '" cy="' + cy + '" r="' + R + '"/></clipPath></defs>' +
      '<image href="data:image/png;base64,' + avB64 + '" x="' + (SC - R) + '" y="' + (cy - R) + '" width="' + (R * 2) + '" height="' + (R * 2) + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#avc)"/>';
  } else {
    s += '<circle cx="' + SC + '" cy="' + cy + '" r="' + R + '" fill="url(#avg)"/>';
    s += T(SC, cy + 46, ini, 128, '#fff', 900, 'middle');
  }
  s += T(SC, 712, nm2, 60, '#fff', 900, 'middle');
  const sum = fmt(sp.sum || 0), pw = 330 + String(sum).length * 36;
  s += '<rect x="' + (SC - pw / 2) + '" y="762" width="' + pw + '" height="110" rx="34" fill="url(#pl)"/>';
  s += '<circle cx="' + (SC - pw / 2 + 66) + '" cy="817" r="34" fill="url(#cn3)" stroke="#92400e" stroke-width="3"/>' +
       '<circle cx="' + (SC - pw / 2 + 66) + '" cy="817" r="25" fill="none" stroke="#fde68a" stroke-width="2"/>' +
       T(SC - pw / 2 + 66, 830, 'T', 30, '#92400e', 900, 'middle');
  s += T(SC + 56, 838, sum + '  TANGA', 50, '#3a2500', 900, 'middle');
  s += T(SC, 952, '«' + noEmo(t.name).slice(0, 24) + '» turniriga', 34, gold ? '#e0cfae' : '#d8cdf0', 600, 'middle');
  s += T(SC, 1000, (top ? 'eng katta homiylikni qildi' : 'homiylik qildi'), 34, gold ? '#e0cfae' : '#d8cdf0', 600, 'middle');
  s += '<rect x="' + (SC - 300) + '" y="1052" width="600" height="84" rx="26" fill="rgba(255,255,255,.08)" stroke="' + acc + '" stroke-opacity=".4"/>';
  s += T(SC, 1106, 'Mukofot jamg‘armasi: ' + fmt(t.prize || 0), 34, acc, 700, 'middle');
  s += T(SC, SH - 70, 'Siz ham homiy bo‘ling: @' + BOT(), 30, gold ? '#b89a68' : '#a994d6', 700, 'middle');
  return s + '</svg>';
}
async function sponsorSend(t, sp, top) {
  try {
    let av = '';
    try {
      const raw = await avBuf(sp.uid, false), sh2 = sharp();
      if (raw && sh2) av = (await sh2(raw).resize(300, 300, { fit: 'cover' }).png().toBuffer()).toString('base64');
    } catch (e) {}
    const buf = await png(sponsorSvg(t, sp, top, av));
    const cap = (top ? '👑 <b>Bosh homiy</b>' : '💰 <b>Homiy</b>') + '\n\n«' + h(t.name) + '» turniriga <b>' + fmt(sp.sum) + '</b> tanga homiylik qildingiz.\n🏆 Mukofot jamg‘armasi: <b>' + fmt(t.prize || 0) + '</b>\n\nRahmat! Rasmni do‘stlaringizga ulashing.';
    if (!buf) return tg('sendMessage', { chat_id: Number(sp.uid), text: cap.replace(/<[^>]+>/g, ''), parse_mode: 'HTML' });
    return sendPhoto(Number(sp.uid), buf, cap);
  } catch (e) { console.log('[tposter] homiy', e.message); return null; }
}

module.exports = { sponsorSvg, sponsorSend, announceTo, hvbResPng, hvbResult, cancelAnn, hvbPng, isHvb, today, announce, remind, result, annSvg, resSvg, png, dayStr, hm };
