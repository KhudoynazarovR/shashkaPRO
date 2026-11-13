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
function isHvb(t) { return (t.clubIds || []).includes('cbots') || /insonlar.*bot/i.test(String(t.name || '')); }
async function hvbPng(t) {
  const sh = sharp(); if (!sh) return null;
  const fs = require('fs'), path = require('path'), f = path.join(__dirname, 'public', 'img', 'hvb_bg.jpg'); if (!fs.existsSync(f)) return null;
  const d = tz(t.startAt), num = (/(?:#|jangi\s*)(\d+)/i.exec(String(t.name || '')) || /(\d+)\s*$/.exec(String(t.name || '')) || [])[1];
  const date = d.getUTCDate() + '-' + MON[d.getUTCMonth()], time = hm(t.startAt) + (t.endAt ? ' - ' + hm(t.endAt) : '');
  const tags = [kindTxt(t), tcTxt(t.tc) + ' ' + tcCat(t.tc), t.pos === 'idf' ? 'IDF 780' : 'Standart', t.rated === false ? 'Reytingsiz' : 'Reytingli'];
  const tz2 = s0 => s0.length > 10 ? 24 : s0.length > 8 ? 27 : 30;
  const T = (xx, y, txt, fs0, fill, anchor, w, st, extra) => '<text x="' + xx + '" y="' + y + '" font-family="' + F + '" font-size="' + fs0 + '" font-weight="' + (w || 900) + '" font-style="' + (st || 'italic') + '" fill="' + fill + '" text-anchor="' + (anchor || 'start') + '"' + (extra || '') + '>' + x(txt) + '</text>';
  let o = '<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941"><defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#e08a00"/></linearGradient>' +
    '<filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".5"/></filter></defs>';
  o += T(885, 356, 'Jangi' + (num ? ' ' + num : ''), 70, '#0b1440', 'middle');
  o += '<g filter="url(#ds)">' + T(735, 462, date, 64, '#ffffff') + T(812, 509, time, 36, '#ffffff', 'start', 700) + '</g>';
  o += '<g filter="url(#ds)">' + T(565, 592, tags[0], tz2(tags[0]), '#fff', 'start', 700, 'normal') + T(775, 592, tags[1], tz2(tags[1]), '#fff', 'start', 700, 'normal') +
    T(1035, 592, tags[2], tz2(tags[2]), '#fff', 'start', 700, 'normal') + T(805, 662, tags[3], tz2(tags[3]), '#fff', 'start', 700, 'normal') + '</g>';
  if (t.prize > 0) { const pz = fmt(t.prize), fs1 = pz.length > 5 ? 62 : pz.length > 3 ? 80 : 110; o += '<g filter="url(#ds)">' + T(355, 858, pz, fs1, 'url(#gd)', 'middle', 900, 'italic', ' stroke="#7a4b00" stroke-width="2"') + '</g>'; }
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
    for (const g of (process.env.T_GROUPS || '').split(',').map(z => z.trim()).filter(Boolean)) {   // 👥 guruhlarga ham (Render: T_GROUPS=@guruh1,-100123...)
      try { const r2 = fid ? await tg('sendPhoto', { chat_id: g, photo: fid, caption: annCap(t), parse_mode: 'HTML', reply_markup: joinKb(t) }) : await sendPhoto(g, buf, annCap(t), joinKb(t)); console.log('[tposter] guruh', g, r2 && r2.ok ? 'ok' : JSON.stringify(r2 && r2.description)); } catch (e) {}
    }
    broadcast(t, fid, buf);
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
async function result(t, st, regs, pay) {
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
module.exports = { hvbPng, isHvb, today, announce, remind, result, annSvg, resSvg, png, dayStr, hm };
