'use strict';
// kanal.js — 📣 Telegram kanalga kuniga 5 ta masala (09:00 13:00 16:00 19:00 21:00, Toshkent), javoblar (12:45 15:45 18:45 20:45 22:45),
// kunlik / haftalik / oylik TOP yechuvchilar (rasm + tangalar), «Do'stga yuborish» kartasi (inline) va taklif mukofotlari.
// Holat store.db.chan da. Admin: /kanal (holat), /kanal on|off, /kanal test, /kanal @kanal
const store = require('./store.js');
const BOT = process.env.BOT_USERNAME || 'DraughtsPRObot';
const APP = (process.env.TG_APP_LINK || ('https://t.me/' + BOT + '/' + (process.env.APP_NAME || 'play'))).replace(/\/$/, '');
const SLOTS = [['09:00', '12:45', 1], ['13:00', '15:45', 1], ['16:00', '18:45', 2], ['19:00', '20:45', 2], ['21:00', '22:45', 3]];
const PRZ = { d: [50, 30, 20], w: [200, 120, 80], m: [500, 300, 200] }, REST = { w: 20, m: 20 }, PREM = { w: 7, m: 30 };
const BONUS = 5, FAST = 10, INV = 10, INV_NEW = 30, NEWBIE = 20;
const LV = { 1: '🟢 Oson', 2: '🟡 O‘rta', 3: '🔴 Qiyin' };
const OY = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const xml = s => esc(s).replace(/"/g, '&quot;');
const nm = u => String((u && u.name) || 'O‘yinchi').slice(0, 22);
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

// ---------- Toshkent vaqti
function T(t) {
  const d = new Date((t || Date.now()) + 5 * 3600e3), day = d.toISOString().slice(0, 10), hm = d.toISOString().slice(11, 16);
  const th = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); th.setUTCDate(th.getUTCDate() + 4 - (th.getUTCDay() || 7));
  const wk = th.getUTCFullYear() + '-W' + String(Math.ceil(((th - Date.UTC(th.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7)).padStart(2, '0');
  const nx = new Date(d.getTime() + 864e5);
  return { day, hm, dow: d.getUTCDay(), wk, mon: day.slice(0, 7), lastDay: nx.getUTCMonth() !== d.getUTCMonth(), dd: d.getUTCDate() + '-' + OY[d.getUTCMonth()] };
}
function S() {
  const d = store.db; d.chan = d.chan || {};
  const s = d.chan;
  if (s.on === undefined) s.on = true;
  s.ch = s.ch || process.env.PZ_CHANNEL || '@Draughts_uz';
  s.used = s.used || []; s.done = s.done || {}; s.posts = s.posts || {}; s.pts = s.pts || {}; s.inv = s.inv || {}; s.card = s.card || {}; s.refd = s.refd || {};
  return s;
}
function prune(s) {
  const now = Date.now();
  for (const k of Object.keys(s.posts)) if (now - (s.posts[k].at || 0) > 3 * 864e5) delete s.posts[k];
  const keepD = new Set([0, 1, 2].map(i => T(now - i * 864e5).day));
  for (const k of Object.keys(s.done)) { const m = /(\d{4}-\d\d-\d\d)/.exec(k); if (m && !keepD.has(m[1])) delete s.done[k]; }
  for (const o of [s.pts, s.inv]) {
    const ks = Object.keys(o);
    for (const p of ['d:', 'w:', 'm:']) ks.filter(k => k.startsWith(p)).sort().slice(0, -3).forEach(k => delete o[k]);
  }
  if (s.used.length > 6000) s.used = s.used.slice(-6000);
  const rk = Object.keys(s.refd); if (rk.length > 20000) rk.slice(0, rk.length - 20000).forEach(k => delete s.refd[k]);
  const ck = Object.keys(s.card); if (ck.length > 300) ck.slice(0, ck.length - 300).forEach(k => delete s.card[k]);
}

// ---------- masala tanlash: kun davomida osondan qiyinga, ishlatilmaganlardan
function pick(s, lv) {
  const used = new Set(s.used), fo = new Set(s.folders || []);
  const pcs = p => { let n = 0; p.board.forEach(r => r.forEach(v => { if (v) n++; })); return n; };
  let all = (store.db.puzzles || []).filter(p => p && p.id && p.board && !p.chBad && (p.sol || (p.sols && p.sols[0])) && !used.has(p.id) && (!fo.size || fo.has(p.folder)));
  { const rich = all.filter(p => pcs(p) >= 6 && (p.sol || p.sols[0]).length >= 3); if (rich.length) all = rich; }   // juda oddiy (kam donali, 1 yurishli) masalalar chiqmaydi
  if (!all.length && fo.size && (store.db.puzzles || []).some(p => fo.has(p.folder) && !p.chBad)) { s.used = s.used.filter(id => !(store.db.puzzles || []).some(p => p.id === id && fo.has(p.folder))); return pick(s, lv); }   // tanlangan papkalar tugadi — qaytadan
  if (!all.length) { if (!s.used.length || fo.size) return null; s.used = []; return pick(s, lv); }
  const len = p => (p.sol || p.sols[0]).length;
  let c = all.filter(p => (p.level || 2) === lv && len(p) <= (lv === 1 ? 14 : 30));
  if (!c.length) c = all.filter(p => (p.level || 2) === lv);
  if (!c.length) c = all;
  return c[Math.floor(Math.random() * c.length)];
}
// 🧠 kanalga chiqishidan oldin tekshiruv: King Kong dvigateli birinchi yurishni ham shunday topadimi
function firstMove(p) {
  try {
    const R = require('./kkrules.js'), sol = p.sol || p.sols[0];
    const b = []; p.board.forEach(r => r.forEach(v => b.push(v === 1 ? 1 : v === 2 ? -1 : v === 3 ? 2 : v === 4 ? -2 : 0)));
    const side = p.side === 'b' ? -1 : 1;
    for (const m of R.moves(b, side)) { const pts = [m.from].concat(m.path && m.path.length ? m.path : [m.to]); let ok = true; for (let k = 1; k < pts.length; k++) { const st = sol[k - 1]; if (!st || st[0] * 8 + st[1] !== pts[k - 1] || st[2] * 8 + st[3] !== pts[k]) { ok = false; break; } } if (ok) return { b, side, from: m.from, to: m.to, n: R.moves(b, side).length }; }
  } catch (e) {}
  return null;
}
// yechim oxirigacha qoidaga mos yuriladimi va oxirida yechuvchi oldinda (yoki raqibda yurish qolmagan)mi
function finalOk(p) {
  try {
    const R = require('./kkrules.js'), sol = p.sol || p.sols[0];
    let b = []; p.board.forEach(r => r.forEach(v => b.push(v === 1 ? 1 : v === 2 ? -1 : v === 3 ? 2 : v === 4 ? -2 : 0)));
    const me = p.side === 'b' ? -1 : 1; let side = me, i = 0;
    while (i < sol.length) {
      let hit = null;
      for (const m of R.moves(b, side)) { const pts = [m.from].concat(m.path && m.path.length ? m.path : [m.to]); let ok = true; for (let k = 1; k < pts.length; k++) { const st = sol[i + k - 1]; if (!st || st[0] * 8 + st[1] !== pts[k - 1] || st[2] * 8 + st[3] !== pts[k]) { ok = false; break; } } if (ok) { hit = [m, pts.length - 1]; break; } }
      if (!hit) return -1;   // yechim qoidaga zid
      b = hit[0].board; side = -side; i += hit[1];
    }
    if (p.goal === 'draw') return 1;
    if (!R.moves(b, side).length && side !== me) return 1;
    let d = 0; for (const v of b) d += v * me > 0 ? (Math.abs(v) === 2 ? 3 : 1) : v * me < 0 ? -(Math.abs(v) === 2 ? 3 : 1) : 0;
    return d >= 1 ? 1 : 0;
  } catch (e) { return 0; }
}
function engineOk(p) {
  return new Promise(res => {
    const f = firstMove(p); if (!f) return res(false);
    const fo = finalOk(p); if (fo < 0) return res(false); if (fo > 0) return res(true);   // oxirida yechuvchi oldinda — yaxshi masala
    if (f.n === 1) return res(true);   // yagona yurish — tekshirish shart emas
    let done = false; const t = setTimeout(() => { if (!done) { done = true; res(true); } }, 20000);   // dvigatel javob bermasa — o'tkazamiz
    try {
      require('./kestoai.js').move({ board: f.b, side: f.side, time: 3, book: false }, r => {
        if (done) return; done = true; clearTimeout(t);
        if (!r || typeof r.from !== 'number') return res(true);   // dvigatel band/tayyor emas — to'xtatmaymiz
        res(r.from === f.from && r.to === f.to);
      });
    } catch (e) { done = true; clearTimeout(t); res(true); }
  });
}
async function pickChecked(s, lv) {
  let last = null;
  for (let k = 0; k < 6; k++) {
    const p = pick(s, lv); if (!p) return last;
    last = p;
    if (await engineOk(p)) return p;
    p.chSkip = (p.chSkip || 0) + 1; if (p.chSkip >= 2) p.chBad = 1;   // ikki marta shubhali chiqsa — kanal uchun yaroqsiz
    s.used.push(p.id);
    console.log('[kanal] dvigatel bilan mos kelmadi, boshqasi tanlanadi:', p.id);
  }
  return last;
}
// yechim → "1. c3-d4 f6-g5 2. ..." (urishlar bitta yurish bo'lib)
function notation(p) {
  try {
    const R = require('./kkrules.js'), sol = p.sol || p.sols[0], SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
    let b = []; p.board.forEach(r => r.forEach(v => b.push(v === 1 ? 1 : v === 2 ? -1 : v === 3 ? 2 : v === 4 ? -2 : 0)));
    let side = p.side === 'b' ? -1 : 1, i = 0, n = 0; const out = [];
    while (i < sol.length) {
      const L = R.moves(b, side); let hit = null;
      for (const m of L) { const pts = [m.from].concat(m.path && m.path.length ? m.path : [m.to]); let ok = true; for (let k = 1; k < pts.length; k++) { const st = sol[i + k - 1]; if (!st || st[0] * 8 + st[1] !== pts[k - 1] || st[2] * 8 + st[3] !== pts[k]) { ok = false; break; } } if (ok) { hit = [m, pts]; break; } }
      if (!hit) break;
      const s1 = hit[1].map(SQ).join(hit[0].caps.length ? ':' : '-');
      if (side === (p.side === 'b' ? -1 : 1)) out.push((++n) + '. ' + s1); else out.push(s1);
      b = hit[0].board; side = -side; i += hit[1].length - 1;
    }
    return out.join(' ');
  } catch (e) { return ''; }
}

// ---------- rasmlar (sharp + svg)
function sharp() { try { return require('sharp'); } catch (e) { return null; } }
function boardSvg(p, top, bottom, sub) {
  let svg = require('./puzimg.js').svgBoard(p.board, p.side, null);
  // kvadrat: Telegram chatda rasmni kesmaydi
  const B = +/width="(\d+)"/.exec(svg)[1], H1 = 80, H2 = sub ? 100 : 76, P = (H1 + H2) / 2, W = B + P * 2, H = B + H1 + H2;   // aniq kvadrat
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">'
    + '<defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1a6e"/><stop offset="1" stop-color="#14093f"/></linearGradient></defs>'
    + '<rect width="' + W + '" height="' + H + '" fill="url(#bg1)"/>'
    + '<text x="' + W / 2 + '" y="54" font-family="DejaVu Sans, Arial" font-weight="700" font-size="38" fill="#ffd54a" text-anchor="middle">' + xml(top) + '</text>'
    + '<g transform="translate(' + P + ',' + H1 + ')">' + inner + '</g>'
    + '<text x="' + W / 2 + '" y="' + (B + H1 + 46) + '" font-family="DejaVu Sans, Arial" font-weight="700" font-size="34" fill="#ffffff" text-anchor="middle">' + xml(bottom) + '</text>'
    + (sub ? '<text x="' + W / 2 + '" y="' + (B + H1 + 84) + '" font-family="DejaVu Sans, Arial" font-size="26" fill="#b9a8ff" text-anchor="middle">' + xml(sub) + '</text>' : '')
    + '</svg>';
}
async function png(svg) { const sh = sharp(); if (!sh) return null; return sh(Buffer.from(svg)).png().toBuffer(); }
async function sendPhoto(chat, buf, caption, kb, extra) {
  const T0 = process.env.BOT_TOKEN; if (!T0) return null;
  if (!buf) return tg('sendMessage', Object.assign({ chat_id: chat, text: caption, parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } }, extra || {}));
  const fd = new FormData();
  fd.append('chat_id', String(chat)); fd.append('caption', caption); fd.append('parse_mode', 'HTML');
  if (kb) fd.append('reply_markup', JSON.stringify(kb));
  for (const [k, v] of Object.entries(extra || {})) fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  fd.append('photo', new Blob([buf], { type: 'image/png' }), 'pz.png');
  return fetch('https://api.telegram.org/bot' + T0 + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json()).catch(() => null);
}
const fileId = r => { try { const a = r.result.photo; return a[a.length - 1].file_id; } catch (e) { return ''; } };
const goTxt = p => (p.side === 'b' ? '⚫ Qora' : '⚪ Oq') + ' yuradi va ' + (p.goal === 'draw' ? 'durangga olib chiqadi' : 'yutadi');
const solveUrl = (id, ref) => APP + '?startapp=pz_' + id + (ref ? '-r' + ref : '');

// ---------- masala posti
async function postSlot(i, chat, test) {
  const s = S(), t = T(), lv = (i === 4 && t.dow === 0) ? 3 : SLOTS[i][2], p = test ? pick(s, lv) : await pickChecked(s, lv);
  if (!p) return null;
  const { buf, cap, kb } = await postParts(p, i, lv, t);
  const r = await sendPhoto(chat || s.ch, buf, cap, kb);
  if (!r || !r.ok) { console.log('[kanal] post xato:', r && r.description); return r; }
  if (!test) {
    const key = t.day + '#' + i;
    s.used.push(p.id);
    s.posts[key] = { pid: p.id, mid: r.result.message_id, at: Date.now(), ans: 0, sv: {}, first: [], slot: i };
    store.save();
    adminCopy(key, r);
  }
  return r;
}
async function postParts(p, i, lv, t) {
  const sv = boardSvg(p, 'KUNNING MASALASI · ' + (i + 1) + '/5', '@' + BOT, LV[p.level || lv].replace(/^\S+ /, '') + (p.author ? ' · ' + p.author : ''));
  let buf = null; try { buf = await png(sv); } catch (e) { console.log('[kanal] rasm:', e.message); }
  const cap = '🧩 <b>Kunning masalasi · ' + t.dd + ' · ' + (i + 1) + '/5</b>\n' + goTxt(p) + '\n' + LV[p.level || lv] + (p.author ? ' · ✍️ ' + esc(p.author) : '')
    + '\n\n🪙 Javobgacha yechsangiz: +' + (5 + BONUS) + ' tanga · birinchi 3 kishiga yana +' + FAST
    + '\n📤 Do‘stingizga yuboring — u yechsa sizga +' + INV + ' 🪙 (yangi o‘yinchi bo‘lsa +' + INV_NEW + ')'
    + '\n\n⏰ Javob: ' + SLOTS[i][1] + ' da · #masala #shashka';
  const kb = { inline_keyboard: [[{ text: '🧩 Yechish', url: solveUrl(p.id) }, { text: '📤 Do‘stga yuborish', url: 'https://t.me/' + BOT + '?start=sh_' + p.id }]] };
  return { buf, cap, kb };
}
// 🛠 adminga post nusxasi — tahrirlash / yangilash / almashtirish tugmalari bilan
function adminKb(key, pid) {
  return { inline_keyboard: [[{ text: '✏️ Tahrirlash (ilovada)', url: solveUrl(pid) }], [{ text: '🔄 Kanalda yangilash', callback_data: 'kn:u:' + key }, { text: '🔁 Almashtirish', callback_data: 'kn:r:' + key }]] };
}
async function adminCopy(key, r) {
  const s = S(), P = s.posts[key]; if (!P) return;
  const p = (store.db.puzzles || []).find(x => x.id === P.pid) || {}, fid = fileId(r);
  const cap = '🛠 <b>Kanal posti</b> · ' + SLOTS[P.slot][0] + '\n🧩 ' + esc(p.title || p.id) + (p.folder ? ' · 📁 ' + esc(p.folder) : '') + '\n<code>' + esc(notation(p) || '') + '</code>'
    + '\n\nXato bo‘lsa: ✏️ ilovada tahrirlang → 🔄 Yangilash. Yaroqsiz bo‘lsa: 🔁 Almashtirish (boshqa masala chiqadi, bu masala kanalga qayta tushmaydi).';
  for (const a of ADM()) { if (fid) tg('sendPhoto', { chat_id: a, photo: fid, caption: cap.slice(0, 1000), parse_mode: 'HTML', reply_markup: adminKb(key, P.pid) }); else tg('sendMessage', { chat_id: a, text: cap, parse_mode: 'HTML', reply_markup: adminKb(key, P.pid) }); }
}
// 🔄 tahrirlangan masala bilan kanal postini yangilash (post o'chmaydi)
async function refresh(key) {
  const s = S(), P = s.posts[key]; if (!P) return 'Post topilmadi';
  const p = (store.db.puzzles || []).find(x => x.id === P.pid); if (!p) return 'Masala o‘chirilgan — 🔁 Almashtirish ni bosing';
  const t = T(P.at), { buf, cap, kb } = await postParts(p, P.slot, SLOTS[P.slot][2], t);
  const T0 = process.env.BOT_TOKEN; if (!T0) return 'BOT_TOKEN yo‘q';
  let r;
  if (buf) {
    const fd = new FormData();
    fd.append('chat_id', String(s.ch)); fd.append('message_id', String(P.mid));
    fd.append('media', JSON.stringify({ type: 'photo', media: 'attach://ph', caption: cap, parse_mode: 'HTML' }));
    fd.append('reply_markup', JSON.stringify(kb));
    fd.append('ph', new Blob([buf], { type: 'image/png' }), 'pz.png');
    r = await fetch('https://api.telegram.org/bot' + T0 + '/editMessageMedia', { method: 'POST', body: fd }).then(x => x.json()).catch(() => null);
  } else r = await tg('editMessageCaption', { chat_id: s.ch, message_id: P.mid, caption: cap, parse_mode: 'HTML', reply_markup: kb });
  if (r && r.ok) { delete s.card[p.id]; store.save(); return '✅ Kanal posti yangilandi'; }
  return '⚠️ ' + ((r && r.description) || 'yangilab bo‘lmadi');
}
// 🔁 yaroqsiz masalani kanaldan olib, o'rniga boshqasini qo'yish
async function replace(key) {
  const s = S(), P = s.posts[key]; if (!P) return 'Post topilmadi';
  if (P.ans) return 'Javobi chiqib bo‘lgan — almashtirib bo‘lmaydi';
  const p = (store.db.puzzles || []).find(x => x.id === P.pid); if (p) { p.chBad = 1; }
  if (key.slice(0, 10) !== T().day) return 'Bu kechagi post';
  await tg('deleteMessage', { chat_id: s.ch, message_id: P.mid });
  delete s.posts[key]; store.save();
  const r = await postSlot(P.slot);
  return r && r.ok ? '✅ Almashtirildi: yangi masala kanalga chiqdi' : '⚠️ Yangi masala chiqmadi: ' + ((r && r.description) || '');
}
async function onCallback(q) {
  const m = /^kn:([ur]):(\d{4}-\d\d-\d\d#\d)$/.exec(String(q.data || '')); if (!m) return false;
  const ans = (t, alert) => tg('answerCallbackQuery', { callback_query_id: q.id, text: t, show_alert: !!alert });
  if (!ADM().includes(String(q.from && q.from.id))) { await ans('Faqat admin'); return true; }
  await ans(m[1] === 'u' ? '⏳ Yangilanmoqda…' : '⏳ Almashtirilmoqda…');
  const res = m[1] === 'u' ? await refresh(m[2]) : await replace(m[2]);
  await tg('sendMessage', { chat_id: q.from.id, text: res });
  return true;
}
// ---------- javob posti
// === JAVOB VIDEOSI (patch-answer-video.js) ===
let _vidBusy = false;
// store masalasi -> reelgen formati [id, daraja, maqsad, doska(32 belgi), yurishlar(4 raqamdan), muallif]
function _toDk(p, lvl) {
  if (!p || !Array.isArray(p.board) || p.board.length !== 8) return null;
  if (p.side === 'b') return null;   // video faqat "oq yuradi" masalalar uchun
  const sol = p.sol || (p.sols && p.sols[0]);
  if (!sol || !sol.length) return null;
  let bs = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) bs += '.wbWB'.charAt(+(p.board[r] && p.board[r][c]) || 0);
  let mv = '';
  for (const st of sol) { if (!st || st.length < 4) return null; mv += String(st[0]) + String(st[1]) + String(st[2]) + String(st[3]); }
  return [p.id, lvl, p.goal === 'd' ? 'd' : 'w', bs, mv, p.author || ''];
}
async function _sendAnswer(s, P, p, txt) {
  const kb = { inline_keyboard: [[{ text: '🧩 Yechish', url: solveUrl(p.id) }]] };
  const reply = { message_id: P.mid, allow_sending_without_reply: true };
  const textOnly = () => tg('sendMessage', { chat_id: s.ch, text: txt, parse_mode: 'HTML', reply_parameters: reply, reply_markup: kb });
  if (process.env.ANSWER_VIDEO === '0' || _vidBusy) return textOnly();
  const _fs = require('fs'), _path = require('path'), _os = require('os');
  let r = null, sent = null;
  _vidBusy = true;
  try {
    const dk = _toDk(p, (SLOTS[P.slot || 0] || [])[2] || 2);
    if (!dk) return await textOnly();
    r = await require('./reelgen.js').make(dk, _path.join(_os.tmpdir(), 'kanal_ans_' + Date.now() + '.mp4'));
    const long = txt.length > 1000;
    const fd = new FormData();
    fd.append('chat_id', String(s.ch)); fd.append('supports_streaming', 'true');
    fd.append('caption', long ? txt.split('\n\n')[0].slice(0, 900) : txt); fd.append('parse_mode', 'HTML');
    fd.append('reply_parameters', JSON.stringify(reply)); fd.append('reply_markup', JSON.stringify(kb));
    if (r.dur) fd.append('duration', String(Math.round(r.dur)));
    fd.append('video', new Blob([_fs.readFileSync(r.file)], { type: 'video/mp4' }), 'javob.mp4');
    if (r.cover) fd.append('thumbnail', new Blob([r.cover], { type: 'image/jpeg' }), 'cover.jpg');
    sent = await fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendVideo', { method: 'POST', body: fd }).then(x => x.json()).catch(e => ({ ok: false, description: e.message }));
    if (sent && sent.ok) { if (long) await textOnly(); return sent; }
    console.log('[kanal] javob videosi yuborilmadi:', sent && sent.description);
  } catch (e) { console.log('[kanal] javob videosi yasalmadi:', e && e.message); }
  finally { _vidBusy = false; if (r && r.file) { try { _fs.unlinkSync(r.file); } catch (e) {} } }
  return textOnly();
}
// === /JAVOB VIDEOSI ===
async function answer(key) {
  const s = S(), P = s.posts[key]; if (!P || P.ans) return;
  P.ans = Date.now(); store.save();
  const p = (store.db.puzzles || []).find(x => x.id === P.pid); if (!p) return;
  const us = store.users(), sv = Object.keys(P.sv), pre = sv.filter(u => P.sv[u][1]).length;
  const first = P.first.map(u => esc(nm(us[u]))).join(', ');
  const ti = T(P.at), ik = s.inv['d:' + ti.day] || {}, topInv = Object.entries(ik).sort((a, b) => b[1] - a[1])[0];
  const nx = SLOTS[(P.slot || 0) + 1];
  const txt = '✅ <b>Javob · ' + SLOTS[P.slot || 0][0] + ' dagi masala</b>\n<code>' + esc(notation(p) || '—') + '</code>\n\n'
    + '👥 Yechganlar: <b>' + sv.length + '</b>' + (sv.length ? ' (javobgacha ' + pre + ')' : '')
    + (first ? '\n⚡ Birinchilar: ' + first : '')
    + (topInv ? '\n📤 Bugun eng ko‘p do‘st olib kelgan: ' + esc(nm(us[topInv[0]])) + ' (' + topInv[1] + ')' : '')
    + '\n\n' + (nx ? '⏰ Keyingi masala — ' + nx[0] + ' da' : '🏅 Kunlik TOP — 22:50 da') + '\n🧩 O‘zingiz ham yechib ko‘ring 👇';
  await _sendAnswer(s, P, p, txt);
}

// ---------- reyting (rasm)
function topSvg(title, sub, rows) {
  const W = 900, RH = 64, H = 190 + Math.max(1, rows.length) * RH + 70;
  const MC = ['#ffd54a', '#d9dee6', '#e09a5f'];
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">'
    + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1a6e"/><stop offset="1" stop-color="#120838"/></linearGradient></defs>'
    + '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>'
    + '<text x="' + W / 2 + '" y="78" font-family="DejaVu Sans, Arial" font-weight="700" font-size="48" fill="#ffd54a" text-anchor="middle">' + xml(title) + '</text>'
    + '<text x="' + W / 2 + '" y="128" font-family="DejaVu Sans, Arial" font-size="28" fill="#b9a8ff" text-anchor="middle">' + xml(sub) + '</text>';
  if (!rows.length) s += '<text x="' + W / 2 + '" y="230" font-family="DejaVu Sans, Arial" font-size="32" fill="#fff" text-anchor="middle">Hali hech kim yo‘q — birinchi bo‘ling!</text>';
  rows.forEach((r, i) => {
    const y = 160 + i * RH;
    s += '<rect x="40" y="' + y + '" width="' + (W - 80) + '" height="' + (RH - 10) + '" rx="16" fill="' + (i < 3 ? 'rgba(255,213,74,0.13)' : 'rgba(255,255,255,0.06)') + '"/>'
      + '<circle cx="86" cy="' + (y + 27) + '" r="21" fill="' + (MC[i] || '#5b4bb5') + '"/>'
      + '<text x="86" y="' + (y + 37) + '" font-family="DejaVu Sans, Arial" font-weight="700" font-size="26" fill="' + (i < 3 ? '#2a1a6e' : '#fff') + '" text-anchor="middle">' + (i + 1) + '</text>'
      + '<text x="128" y="' + (y + 37) + '" font-family="DejaVu Sans, Arial" font-size="30" fill="#fff">' + xml(r.name) + '</text>'
      + '<text x="' + (W - 250) + '" y="' + (y + 37) + '" font-family="DejaVu Sans, Arial" font-size="26" fill="#b9a8ff" text-anchor="end">' + r.n + ' ta masala</text>'
      + '<text x="' + (W - 64) + '" y="' + (y + 37) + '" font-family="DejaVu Sans, Arial" font-weight="700" font-size="30" fill="#ffd54a" text-anchor="end">' + r.p + ' ochko</text>';
  });
  return s + '<text x="' + W / 2 + '" y="' + (H - 26) + '" font-family="DejaVu Sans, Arial" font-size="26" fill="#ffffff" text-anchor="middle">@' + BOT + ' · ShashkaPRO</text></svg>';
}
function rank(o) { return Object.entries(o || {}).map(([u, v]) => ({ u, p: v[0], t: v[1], n: v[2] || 0 })).sort((a, b) => b.p - a.p || a.t - b.t).filter(r => r.p > 0); }
async function topPost(kind, test) {
  const s = S(), t = T(), key = kind === 'd' ? 'd:' + t.day : kind === 'w' ? 'w:' + t.wk : 'm:' + t.mon;
  const us = store.users(), R = rank(s.pts[key]).slice(0, 10), E = require('./economy.js'), PZ = PRZ[kind];
  const title = kind === 'd' ? '🏅 KUNLIK TOP · ' + t.dd : kind === 'w' ? '🏆 HAFTALIK TOP' : '👑 OYLIK TOP · ' + OY[+t.mon.slice(5) - 1];
  const rows = R.map(r => ({ name: nm(us[r.u]), p: r.p, n: r.n }));
  let buf = null; try { buf = await png(topSvg(title.replace(/^\S+ /, ''), 'Eng yaxshi masala yechuvchilar', rows)); } catch (e) { console.log('[kanal] top rasm:', e.message); }
  const lines = [];
  R.forEach((r, i) => {
    const c = PZ[i] || ((kind !== 'd' && i < 10) ? REST[kind] : 0), prem = i === 0 && PREM[kind];
    lines.push((['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + esc(nm(us[r.u])) + ' — ' + r.p + ' ochko' + (c ? ' · +' + c + ' 🪙' : '') + (prem ? ' + 👑 ' + prem + ' kun' : ''));
    if (test) return;
    if (c) E.add(r.u, c, 'chan_top_' + kind);
    if (prem && us[r.u]) require('./premium.js').grant(us[r.u], prem, 'chan_top_' + kind);
    tg('sendMessage', { _cat: 'ach', chat_id: r.u, text: '🏆 Tabriklaymiz! ' + (kind === 'd' ? 'Kunlik' : kind === 'w' ? 'Haftalik' : 'Oylik') + ' masala reytingida ' + (i + 1) + '-o‘rin' + (c ? ': +' + c + ' 🪙' : '') + (prem ? ' va 👑 ' + prem + ' kunlik Premium' : '') + '!' });
  });
  let inv = '';
  if (kind === 'w') {
    const iv = Object.entries(s.inv['w:' + t.wk] || {}).sort((a, b) => b[1] - a[1])[0];
    if (iv && iv[1] > 0) {
      inv = '\n\n📤 <b>Haftaning taklif chempioni:</b> ' + esc(nm(us[iv[0]])) + ' — ' + iv[1] + ' do‘st · 👑 7 kun Premium';
      if (!test && us[iv[0]]) { require('./premium.js').grant(us[iv[0]], 7, 'chan_inv_w'); tg('sendMessage', { _cat: 'ach', chat_id: iv[0], text: '📤 Siz haftaning taklif chempionisiz! 👑 7 kunlik Premium sovg‘a qilindi.' }); }
    }
  }
  const cap = '<b>' + title + '</b>\n\n' + (lines.join('\n') || 'Bugun hali hech kim yechmadi — ertaga birinchi bo‘ling!') + inv
    + '\n\n🧩 Har kuni 5 ta masala: 09:00 · 13:00 · 16:00 · 19:00 · 21:00' + (kind === 'd' ? '\n🏆 Haftalik TOP — yakshanba 22:55 · 👑 Oylik — oy oxirida' : '');
  const r = await sendPhoto(test || s.ch, buf, cap, { inline_keyboard: [[{ text: '🎮 ShashkaPRO', url: APP }]] });
  if (!test) store.save();
  return r;
}

// ---------- yechilganda (economy.js /api/puzzle/solved dan): qaytaradi — qo'shimcha tanga
function onSolve(uid, u, pz, j) {
  try {
    const s = S(), now = Date.now(); uid = String(uid); let extra = 0;
    const E = require('./economy.js');
    const P = Object.values(s.posts).find(x => x.pid === pz.id && now - x.at < 36 * 3600e3);
    if (P && !P.sv[uid]) {
      const pre = !P.ans, t = Math.max(1, Math.round((now - P.at) / 1000));
      P.sv[uid] = [t, pre ? 1 : 0];
      let pts = pre ? 3 : 1;
      if (pre) { E.add(uid, BONUS, 'chan_bonus'); extra += BONUS; }
      if (pre && P.first.length < 3) { P.first.push(uid); pts++; E.add(uid, FAST, 'chan_fast'); extra += FAST; }
      const tt = T(now);
      for (const k of ['d:' + tt.day, 'w:' + tt.wk, 'm:' + tt.mon]) { const o = s.pts[k] = s.pts[k] || {}, v = o[uid] = o[uid] || [0, 0, 0]; v[0] += pts; v[1] += t; v[2]++; }
    }
    // 📤 taklif: do'st ulashilgan havola orqali kirib, aynan shu masalani yechdi
    const ref = String((j && j.ref) || ''), refP = String((j && j.refP) || '');
    if (/^\d{3,15}$/.test(ref) && ref !== uid && refP === pz.id) {
      const us = store.users(), iv = us[ref], k = ref + ':' + uid + ':' + pz.id;
      if (iv && !s.refd[k]) {
        s.refd[k] = 1;
        const isNew = !u.chNew && (now - (u.created || 0) < 48 * 3600e3);
        if (isNew) { u.chNew = ref; E.add(uid, NEWBIE, 'chan_newbie'); extra += NEWBIE; }
        const g = isNew ? INV_NEW : INV; E.add(ref, g, 'chan_invite');
        const tt = T(now); for (const kk of ['d:' + tt.day, 'w:' + tt.wk]) { const o = s.inv[kk] = s.inv[kk] || {}; o[ref] = (o[ref] || 0) + 1; }
        tg('sendMessage', { _cat: 'ach', chat_id: ref, text: '🎉 ' + nm(u) + ' siz yuborgan masalani yechdi' + (isNew ? ' (yangi o‘yinchi!)' : '') + ': +' + g + ' 🪙' });
      }
    }
    prune(s); store.save();
    return extra;
  } catch (e) { console.log('[kanal] onSolve:', e.message); return 0; }
}

// ---------- «Do'stga yuborish»: bot shaxsiy kartani beradi, keyin inline orqali istalgan chatga
async function shareStart(chatId, from, pid) {
  const s = S(), p = (store.db.puzzles || []).find(x => x.id === pid);
  if (!p) { await tg('sendMessage', { chat_id: chatId, text: 'Masala topilmadi.' }); return; }
  const kb = { inline_keyboard: [[{ text: '📤 Do‘stlarga yuborish', switch_inline_query: 'pz ' + p.id }], [{ text: '🧩 O‘zim yechaman', url: solveUrl(p.id) }]] };
  const cap = '📤 <b>Masalani do‘stlaringizga yuboring!</b>\nPastdagi tugmani bosing va chat yoki guruhni tanlang.\n\nDo‘stingiz yechsa: <b>+' + INV + ' 🪙</b> sizga\nYangi o‘yinchi bo‘lsa: <b>+' + INV_NEW + ' 🪙</b> sizga va <b>+' + NEWBIE + ' 🪙</b> unga\nChegarasiz — qancha ko‘p do‘st, shuncha ko‘p tanga!';
  if (s.card[p.id]) { const r = await tg('sendPhoto', { chat_id: chatId, photo: s.card[p.id], caption: cap, parse_mode: 'HTML', reply_markup: kb }); if (r && r.ok) return; }
  let buf = null; try { buf = await png(boardSvg(p, '♟ Yecha olasanmi?', '@' + BOT + ' · ShashkaPRO', goTxt(p))); } catch (e) {}
  const r = await sendPhoto(chatId, buf, cap, kb);
  const fid = r && r.ok && fileId(r); if (fid) { s.card[p.id] = fid; store.save(); }
}
function inlineResults(q) {
  const m = /^pz\s+(\S+)/.exec(String(q.query || '').trim()); if (!m) return null;
  const s = S(), p = (store.db.puzzles || []).find(x => x.id === m[1]); if (!p) return [];
  const who = String((q.from && (q.from.first_name || q.from.username)) || 'Do‘stingiz').slice(0, 30), uid = q.from && q.from.id;
  const cap = '🧩 <b>' + esc(who) + ' senga kombinatsiya yubordi!</b>\n' + goTxt(p) + ' · ' + (LV[p.level || 2] || '') + '\nYechsang — ikkalamizga ham tanga 🪙';
  const kb = { inline_keyboard: [[{ text: '🧩 Yechib ko‘raman', url: solveUrl(p.id, uid) }]] };
  if (s.card[p.id]) return [{ type: 'photo', id: 'pz' + p.id.slice(0, 40), photo_file_id: s.card[p.id], caption: cap, parse_mode: 'HTML', reply_markup: kb, title: 'Masalani yuborish' }];
  return [{ type: 'article', id: 'pz' + p.id.slice(0, 40), title: '🧩 Masalani yuborish', description: goTxt(p), input_message_content: { message_text: cap, parse_mode: 'HTML' }, reply_markup: kb }];
}

// ---------- jadval
let busy = false;
async function tick() {
  if (busy) return; busy = true;
  try {
    const s = S(); if (!s.on || !process.env.BOT_TOKEN) return;
    const t = T();
    for (let i = 0; i < SLOTS.length; i++) {
      const key = t.day + '#' + i, dk = 'p' + key;
      if (t.hm >= SLOTS[i][0] && t.hm < SLOTS[i][1] && !s.posts[key] && !s.done[dk]) { s.done[dk] = 1; store.save(); await postSlot(i); }
      const P = s.posts[key]; if (P && !P.ans && t.hm >= SLOTS[i][1]) await answer(key);
    }
    if (t.hm >= '22:50' && !s.done['d' + t.day]) { s.done['d' + t.day] = 1; store.save(); await topPost('d'); }
    if (t.dow === 0 && t.hm >= '22:55' && !s.done['w' + t.day]) { s.done['w' + t.day] = 1; store.save(); await topPost('w'); }
    if (t.lastDay && t.hm >= '23:00' && !s.done['m' + t.day]) { s.done['m' + t.day] = 1; store.save(); await topPost('m'); }
    prune(s);
  } catch (e) { console.log('[kanal] tick:', e.message); } finally { busy = false; }
}
let started = false;
function start() { if (started) return; started = true; setTimeout(tick, 30e3); setInterval(tick, 30e3).unref(); }

// ---------- admin /kanal
async function cmd(msg, text) {
  if (!ADM().includes(String(msg.from && msg.from.id))) return false;
  const s = S(), a = text.trim().split(/\s+/).slice(1), t = T(), c = msg.chat.id;
  if (a[0] === 'on' || a[0] === 'off') { s.on = a[0] === 'on'; store.save(); await tg('sendMessage', { chat_id: c, text: s.on ? '✅ Kanal postlari yoqildi' : '⏸ Kanal postlari to‘xtatildi' }); return true; }
  if (a[0] && /^@\w{4,}$|^-100\d+$/.test(a[0])) { s.ch = a[0]; store.save(); await tg('sendMessage', { chat_id: c, text: '✅ Kanal: ' + s.ch }); return true; }
  if (a[0] === 'yangila' || a[0] === 'almashtir') {
    const ks = Object.keys(s.posts).filter(k => k.startsWith(t.day + '#')).sort(), key = a[1] ? t.day + '#' + (Number(a[1]) - 1) : ks[ks.length - 1];
    if (!key || !s.posts[key]) { await tg('sendMessage', { chat_id: c, text: 'Bugun kanal posti yo‘q' }); return true; }
    await tg('sendMessage', { chat_id: c, text: a[0] === 'yangila' ? await refresh(key) : await replace(key) });
    return true;
  }
  if (a[0] === 'test') { await postSlot(Math.min(4, Number(a[1]) || 0), c, true); await topPost('d', String(c)); return true; }
  const td = SLOTS.map((x, i) => { const P = s.posts[t.day + '#' + i]; return x[0] + ' — ' + (P ? '✅ ' + Object.keys(P.sv).length + ' yechdi' + (P.ans ? ', javob berildi' : '') : (t.hm >= x[1] ? '— o‘tib ketdi' : '⏳')); }).join('\n');
  const fl = (s.folders || []).join(', ') || 'hamma papkalar';
  const top = rank(s.pts['d:' + t.day]).slice(0, 3).map((r, i) => (i + 1) + '. ' + nm(store.users()[r.u]) + ' — ' + r.p).join('\n');
  await tg('sendMessage', { chat_id: c, text: '📣 Kanal: ' + s.ch + ' · ' + (s.on ? '✅ yoqilgan' : '⏸ to‘xtatilgan') + '\n📁 Masalalar: ' + fl + ' (ilovada papka yonidagi 📣 tugmasi)\n\nBugun:\n' + td + '\n\nKunlik TOP:\n' + (top || '—') + '\n\n/kanal test — namunani shu yerga yuborish\n/kanal yangila [1–5] — tahrirlangan masala bilan postni yangilash\n/kanal almashtir [1–5] — yaroqsiz masala o‘rniga boshqasi\n/kanal off · /kanal on\n/kanal @kanal — kanalni almashtirish' });
  return true;
}
function folders() { return (S().folders || []).slice(); }
function toggleFolder(f) { const s = S(); s.folders = s.folders || []; const i = s.folders.indexOf(f); if (i >= 0) s.folders.splice(i, 1); else s.folders.push(f); store.save(); return s.folders.slice(); }
module.exports = { folders, toggleFolder, start, tick, onSolve, onCallback, shareStart, inlineResults, cmd, notation, refresh, replace, _t: { T, pick, pickChecked, engineOk, boardSvg, topSvg, rank, S } };
