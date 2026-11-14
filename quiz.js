'use strict';
// quiz.js — 🧠 Shashka viktorinasi (QuizBot kabi).
// Admin Kombinatsiyalardan masalalarni «Viktorinaga» belgilaydi (navbat). Har kuni admin belgilagan soatda bot
// guruhlarga (va xohlasa kanalga) N ta savol yuboradi: doska rasmi + Telegram «quiz» so'rovnomasi, har biriga `sec` soniya.
// Guruhlarda so'rovnoma anonim emas — bot kim javob berganini ko'radi; oxirida hamma ishtirokchili natija jadvali,
// mukofot: 1–3 o'rin prz[0..2] tanga, qolganlarga `rest` tanga. Kanalda so'rovnoma anonim (Telegram qoidasi) — natija yo'q.
// Holat: store.db.quiz
const store = require('./store.js');
const BOT = process.env.BOT_USERNAME || 'DraughtsPRObot';
const APP = (process.env.TG_APP_LINK || ('https://t.me/' + BOT + '/' + (process.env.APP_NAME || 'play'))).replace(/\/$/, '');
const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const OY = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

function T(t) {   // Toshkent vaqti
  const d = new Date((t || Date.now()) + 5 * 3600e3);
  return { day: d.toISOString().slice(0, 10), hm: d.toISOString().slice(11, 16), dm: String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0'), dd: d.getUTCDate() + '-' + OY[d.getUTCMonth()] };
}
const hmAdd = (hm, m) => { const [h, mi] = hm.split(':').map(Number), t = ((h * 60 + mi + m) % 1440 + 1440) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
function S() {
  const d = store.db; d.quiz = d.quiz || {};
  const s = d.quiz;
  if (s.on === undefined) s.on = true;
  if (!/^\d\d:\d\d$/.test(s.hm || '')) s.hm = '20:00';
  s.n = Math.min(20, Math.max(1, +s.n || 10)); s.sec = Math.min(600, Math.max(10, +s.sec || 60));
  if (!Array.isArray(s.prz) || s.prz.length !== 3) s.prz = [10, 7, 5];
  if (s.rest === undefined) s.rest = 1;
  if (s.chOn === undefined) s.chOn = true;
  if (!s.th) s.th = 'pink';
  s.q = s.q || []; s.opts = s.opts || {}; s.pend = s.pend || {}; s.used = s.used || [];
  return s;
}
const pz = id => (store.db.puzzles || []).find(p => p && p.id === id);
const titleOf = p => String((p && p.title) || 'Masala');

// ---------- yurishlar: to'g'ri birinchi yurish + noto'g'ri, lekin qilish mumkin bo'lgan yurishlar
function b64(p) { const b = []; p.board.forEach(r => r.forEach(v => b.push(v === 1 ? 1 : v === 2 ? -1 : v === 3 ? 2 : v === 4 ? -2 : 0))); return b; }
function correct(p) {
  try {
    const R = require('./kkrules.js'), sol = p.sol || (p.sols && p.sols[0]); if (!sol) return null;
    const b = b64(p), side = p.side === 'b' ? -1 : 1;
    for (const m of R.moves(b, side)) {
      const pts = [m.from].concat(m.path && m.path.length ? m.path : [m.to]); let ok = true;
      for (let k = 1; k < pts.length; k++) { const st = sol[k - 1]; if (!st || st[0] * 8 + st[1] !== pts[k - 1] || st[2] * 8 + st[3] !== pts[k]) { ok = false; break; } }
      if (ok) return pts.map(SQ).join(m.caps && m.caps.length ? ':' : '-');
    }
  } catch (e) {}
  return null;
}
function pool(p, cor) {
  const out = new Set();
  try {
    const R = require('./kkrules.js'), b = b64(p), side = p.side === 'b' ? -1 : 1;
    for (const m of R.moves(b, side)) { const pts = [m.from].concat(m.path && m.path.length ? m.path : [m.to]); out.add(pts.map(SQ).join(m.caps && m.caps.length ? ':' : '-')); }
    for (let i = 0; i < 64; i++) {   // oddiy yurishlar (urish majburiy bo'lsa ham — chalg'ituvchi variant)
      const v = b[i]; if (!v || Math.sign(v) !== side) continue;
      const r = i >> 3, c = i & 7, king = Math.abs(v) === 2;
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        if (!king && dr !== -side) continue;
        const nr = r + dr, nc = c + dc; if (nr < 0 || nr > 7 || nc < 0 || nc > 7 || b[nr * 8 + nc]) continue;
        out.add(SQ(i) + '-' + SQ(nr * 8 + nc));
      }
    }
  } catch (e) {}
  out.delete(cor);
  return [...out];
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function wrongs(p, cor) { const s = S(), man = s.opts[p.id]; if (Array.isArray(man) && man.length) return man.filter(x => x && x !== cor).slice(0, 9); return shuffle(pool(p, cor)).slice(0, 4); }

// ---------- doska rasmi: faqat doska, do'kon toshlari bilan
const TH = {
  pink: ['Pushti', '#f1d4cc', '#b6695f'], classic: ['Klassik', '#f0d9b5', '#b58863'], green: ['Yashil', '#eeeed2', '#769656'], blue: ['Ko‘k', '#dee3e6', '#8ca2ad'],
  gray: ['Kulrang', '#d8d8d8', '#6f6f6f'], walnut: ['Yong‘oq', '#e8cb9a', '#7a4a26'], purple: ['Binafsha', '#e6dcf0', '#8a6bb1'], sand: ['Qum', '#f3e9d2', '#c9a66b'],
  ocean: ['Okean', '#d6eaf2', '#3a7ca5'], rose: ['Atirgul', '#f6e1e6', '#b5667a'], olive: ['Zaytun', '#e9ecd0', '#6b7b3a'], edeon: ['Yog‘och', 'url(#lt)', 'url(#dk)', '#f6c493', '#7b2f13'], photo: ['Fotodoska', 'none', 'none', '#f0d9b5', '#8a5a33']
};
let PHOTO = null;
function photo() { if (PHOTO === null) { try { PHOTO = 'data:image/jpeg;base64,' + require('fs').readFileSync(require('path').join(__dirname, 'board_photo.jpg')).toString('base64'); } catch (e) { PHOTO = ''; } } return PHOTO; }
async function imgs(sharp) {
  try {
    const s = S(), sh = store.db.shop || [], it = (s.skin && sh.find(x => x.id === s.skin)) || sh.find(x => x.def);
    if (!it || !it.imgs) return null;
    const o = {};
    for (const k of ['w', 'b', 'wk', 'bk']) {
      const m = /^data:image\/(?:png|webp|jpeg);base64,(.+)$/.exec(it.imgs[k] || ''); if (!m) return null;
      o[k] = 'data:image/png;base64,' + (await sharp(Buffer.from(m[1], 'base64')).resize(176, 176, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).toString('base64');
    }
    return o;
  } catch (e) { return null; }
}
function svg(p, IM, th) {
  let t = TH[th || S().th] || TH.pink; if (t[0] === 'Fotodoska' && !photo()) t = TH.classic;
  const Z = 100, W = Z * 8, flip = p.side === 'b', LC = t[1], DC = t[2], LT = t[3] || t[1], DT = t[4] || t[2];
  let s = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + W + '" viewBox="0 0 ' + W + ' ' + W + '">'
    + '<defs><radialGradient id="wp" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#ececec"/><stop offset="1" stop-color="#b9b9b9"/></radialGradient>'
    + '<radialGradient id="bp" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#555"/><stop offset=".55" stop-color="#1c1c1c"/><stop offset="1" stop-color="#000"/></radialGradient>'
    + '<linearGradient id="dk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b2f13"/><stop offset=".5" stop-color="#702a10"/><stop offset="1" stop-color="#7d3114"/></linearGradient>'
    + '<linearGradient id="lt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3bb86"/><stop offset=".5" stop-color="#f6c493"/><stop offset="1" stop-color="#eaa874"/></linearGradient></defs>';
  if (t[0] === 'Fotodoska') s += '<image xlink:href="' + photo() + '" x="0" y="0" width="' + W + '" height="' + W + '" preserveAspectRatio="none"/>';
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    const r = flip ? 7 - vr : vr, c = flip ? 7 - vc : vc, x = vc * Z, y = vr * Z, dk = (r + c) % 2 === 1;
    s += '<rect x="' + x + '" y="' + y + '" width="' + Z + '" height="' + Z + '" fill="' + (dk ? DC : LC) + '"/>';
    if (vc === 0) s += '<text x="' + (x + 6) + '" y="' + (y + 20) + '" font-size="17" font-weight="700" font-family="DejaVu Sans, sans-serif" fill="' + (dk ? LT : DT) + '">' + (8 - r) + '</text>';
    if (vr === 7) s += '<text x="' + (x + Z - 6) + '" y="' + (y + Z - 7) + '" font-size="17" font-weight="700" text-anchor="end" font-family="DejaVu Sans, sans-serif" fill="' + (dk ? LT : DT) + '">' + 'abcdefgh'[c] + '</text>';
    const v = p.board[r][c]; if (!v) continue;
    const cx = x + Z / 2, cy = y + Z / 2, w = v === 1 || v === 3;
    if (IM) { s += '<image xlink:href="' + IM[v === 1 ? 'w' : v === 2 ? 'b' : v === 3 ? 'wk' : 'bk'] + '" x="' + (cx - 44) + '" y="' + (cy - 44) + '" width="88" height="88"/>'; continue; }
    s += '<circle cx="' + (cx + 2) + '" cy="' + (cy + 5) + '" r="40" fill="#000" opacity=".35"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="41" fill="url(#' + (w ? 'wp' : 'bp') + ')" stroke="' + (w ? '#9a9a9a' : '#000') + '" stroke-width="2.5"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="26" fill="none" stroke="' + (w ? '#cfcfcf' : '#3a3a3a') + '" stroke-width="3"/>';
    if (v > 2) s += '<text x="' + cx + '" y="' + (cy + 13) + '" font-size="38" text-anchor="middle" fill="#f5b72b" font-family="DejaVu Sans, sans-serif">&#9819;</text>';
  }
  return s + '</svg>';
}
async function png(p) {
  let sharp; try { sharp = require('sharp'); } catch (e) { return null; }
  const IM = await imgs(sharp);
  try { return await sharp(Buffer.from(svg(p, IM))).png().toBuffer(); } catch (e) { try { return await sharp(Buffer.from(svg(p, null))).png().toBuffer(); } catch (e2) { return null; } }
}
async function sendPhoto(chat, buf, caption) {
  const T0 = process.env.BOT_TOKEN; if (!T0 || !buf) return tg('sendMessage', { chat_id: chat, text: caption, parse_mode: 'HTML' });
  const fd = new FormData();
  fd.append('chat_id', String(chat)); fd.append('caption', caption); fd.append('parse_mode', 'HTML');
  fd.append('photo', new Blob([buf], { type: 'image/png' }), 'quiz.png');
  return fetch('https://api.telegram.org/bot' + T0 + '/sendPhoto', { method: 'POST', body: fd }).then(r => r.json()).catch(() => null);
}

// ---------- qayerga yuboriladi
function chats() {
  const s = S(), gr = Array.from(new Set((store.db.groups || []).map(String).concat(String(process.env.QUIZ_GROUPS || '').split(',')).map(z => z.trim()).filter(Boolean)));
  const out = gr.map(id => ({ id, anon: false }));
  const ch = s.chOn && ((store.db.chan || {}).ch || process.env.PZ_CHANNEL || '@Draughts_uz');
  if (ch && !gr.includes(String(ch))) out.push({ id: String(ch), anon: true, ch: 1 });
  return out;
}
const adminSay = text => ADM().forEach(a => tg('sendMessage', { chat_id: a, text }).catch(() => {}));

// ---------- o'yin (run)
let timer = null;
async function startRun(manual) {
  const s = S();
  if (s.run && !s.run.done) return { error: 'Viktorina allaqachon ketyapti' };
  const pids = s.q.filter(id => pz(id) && correct(pz(id))).slice(0, s.n);
  s.q = s.q.filter(id => pz(id));   // o'chirilgan masalalar navbatdan chiqadi
  if (!pids.length) { adminSay('Viktorina boshlanmadi: navbat bo‘sh. Kombinatsiyalardan masalalarni «Viktorinaga» belgilang.'); return { error: 'Navbat bo‘sh' }; }
  const cs = chats(); if (!cs.length) return { error: 'Guruh yoki kanal yo‘q' };
  s.run = { day: T().day, at: Date.now(), pids, qi: -1, nextAt: Date.now(), chats: cs, polls: {}, res: {}, cq: {}, fast: {}, done: 0, manual: !!manual };
  store.save();
  step();
  return { ok: 1, n: pids.length, chats: cs.length };
}
function step() {
  clearTimeout(timer); timer = null;
  const s = S(), R = s.run; if (!R || R.done) return;
  const w = R.nextAt - Date.now();
  if (w > 0) { timer = setTimeout(step, Math.min(w, 60000)); return; }
  if (R.qi + 1 < R.pids.length) {
    R.qi++; R.nextAt = Date.now() + (s.sec + 4) * 1000; store.save();
    sendQ(R, R.qi).catch(e => console.log('[quiz] savol:', e.message)).finally(() => { timer = setTimeout(step, Math.max(1000, R.nextAt - Date.now())); });
  } else finish(R).catch(e => console.log('[quiz] yakun:', e.message));
}
async function sendQ(R, i) {
  const s = S(), p = pz(R.pids[i]); if (!p) return;
  const cor = correct(p); if (!cor) return;
  const ops = shuffle([cor].concat(wrongs(p, cor))).slice(0, 10), ci = ops.indexOf(cor);
  const buf = await png(p), side = p.side === 'b' ? 'Qora' : 'Oq';
  const cap = '<b>Savol ' + (i + 1) + '/' + R.pids.length + '</b> · ' + side + ' yuradi va ' + (p.goal === 'draw' ? 'durangga olib chiqadi' : 'yutadi');
  await Promise.all(R.chats.map(async c => {
    try {
      const ph = await sendPhoto(c.id, buf, cap);
      if (!ph || !ph.ok) { console.log('[quiz] rasm', c.id, ph && ph.description); return; }
      const r = await tg('sendPoll', { chat_id: c.id, question: 'Kombinatsiyaning birinchi yurishini toping', options: ops.map(text => ({ text })), type: 'quiz', correct_option_id: ci, is_anonymous: !!c.anon, open_period: s.sec, explanation: 'To‘g‘ri javob: ' + cor + '. To‘liq yechim ilovada.', reply_parameters: { message_id: ph.result.message_id, allow_sending_without_reply: true } });
      if (r && r.ok && r.result.poll) { R.polls[r.result.poll.id] = { qi: i, chat: c.id, cor: ci, at: Date.now() }; }
      else console.log('[quiz] poll', c.id, r && r.description);
    } catch (e) { console.log('[quiz] yuborish', c.id, e.message); }
  }));
  store.save();
}
function onAnswer(pa) {
  const s = S(), R = s.run; if (!R || !pa || !pa.user) return;
  const P = R.polls[pa.poll_id]; if (!P || !(pa.option_ids || []).length) return;
  const uid = String(pa.user.id), name = String([pa.user.first_name, pa.user.last_name].filter(Boolean).join(' ') || pa.user.username || 'O‘yinchi').slice(0, 30);
  const res = R.res[P.chat] = R.res[P.chat] || {}, rec = res[uid] = res[uid] || { n: name, ok: 0, ans: 0, t: 0, q: [] };
  if (rec.q.includes(P.qi)) return;
  const dt = Date.now() - P.at, ok = pa.option_ids[0] === P.cor;
  rec.q.push(P.qi); rec.ans++; rec.t += dt; rec.n = name; if (ok) rec.ok++;
  const cq = R.cq[P.chat] = R.cq[P.chat] || {}, q = cq[P.qi] = cq[P.qi] || { ok: 0, ans: 0 }; q.ans++; if (ok) q.ok++;
  if (ok) { const f = R.fast[P.chat]; if (!f || dt < f.t) R.fast[P.chat] = { n: name, t: dt, qi: P.qi }; }
  store.save();
}
const sec1 = ms => (ms / 1000).toFixed(1);
function give(uid, name, n, why) {
  if (n <= 0) return;
  try {
    const u = store.users()[uid];
    if (u) require('./economy.js').add(uid, n, why);
    else { const s = S(); s.pend[uid] = (s.pend[uid] || 0) + n; }   // ilovaga hali kirmagan — kirganda hisobiga tushadi
  } catch (e) {}
}
async function finish(R) {
  const s = S(); if (R.done) return; R.done = 1; store.save();
  const t = T(R.at), gave = {}, nQ = R.pids.length;
  for (const c of R.chats) {
    if (c.anon) {
      await tg('sendMessage', { chat_id: c.id, text: '🏁 Shashka viktorinasi ' + t.dm + ' yakunlandi!\n\nNatijalar va mukofotlar guruhlarda e’lon qilindi.\n▶ Ertaga ' + s.hm + ' da yana', reply_markup: { inline_keyboard: [[{ text: 'Ilovani ochish', url: APP }]] } }).catch(() => {});
      continue;
    }
    const res = R.res[c.id] || {}, rows = Object.entries(res).map(([u, v]) => ({ u, n: v.n, ok: v.ok, avg: v.ans ? v.t / v.ans : 1e9, ans: v.ans }));
    if (!rows.length) continue;
    rows.sort((a, b) => b.ok - a.ok || a.avg - b.avg);
    const prize = i => i < 3 ? s.prz[i] : s.rest;
    let txt = '🏁 <b>Shashka viktorinasi ' + t.dm + ' yakunlandi!</b>\n\n👑 G‘olib: <b>' + esc(rows[0].n) + '</b> — ' + rows[0].ok + '/' + nQ + ' · ' + sec1(rows[0].avg) + ' s\n\n';
    const lines = rows.map((r, i) => (i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : (i + 1) + '. ') + esc(r.n) + ' — ' + r.ok + '/' + nQ + (i < 3 ? ' · ' + sec1(r.avg) + ' s' : ''));
    let tail = '';
    const cq = R.cq[c.id] || {}; let hard = -1;
    Object.keys(cq).forEach(k => { if (hard < 0 || cq[k].ok < cq[hard].ok) hard = +k; });
    if (hard >= 0) tail += '\n\n🎯 Eng qiyin savol: №' + (hard + 1) + ' — ' + (cq[hard].ok ? 'atigi ' + cq[hard].ok + ' kishi topdi' : 'hech kim topmadi');
    const f = R.fast[c.id]; if (f) tail += '\n⚡ Eng tez javob: ' + esc(f.n) + ' — ' + sec1(f.t) + ' s (№' + (f.qi + 1) + ')';
    tail += '\n\n🏆 <b>Mukofot:</b>';
    rows.slice(0, 3).forEach((r, i) => { tail += '\n' + ['🥇', '🥈', '🥉'][i] + ' ' + esc(r.n) + ' — ' + prize(i) + ' 🪙'; });
    if (rows.length > 3 && s.rest > 0) tail += '\nQolgan ishtirokchilarga — ' + s.rest + ' 🪙 dan';
    const nAns = rows.reduce((a, r) => a + r.ans, 0);
    tail += '\n\n📊 ' + nQ + ' savol · ' + rows.length + ' ishtirokchi · ' + nAns + ' javob\n\n▶ Ertaga ' + s.hm + ' da yana · Yechimlar ilovada';
    rows.forEach((r, i) => {   // bir kishi bir necha guruhda bo'lsa — eng katta mukofot bir marta
      const n = prize(i), had = gave[r.u] || 0;
      if (n > had) { give(r.u, r.n, n - had, 'quiz'); gave[r.u] = n; }
    });
    const kb = { inline_keyboard: [[{ text: 'Yechimlarni ko‘rish', url: APP + '?startapp=pz_' + R.pids[0] }, { text: 'Ilovani ochish', url: APP }]] };
    const parts = []; let cur = txt;
    for (const l of lines) { if ((cur + l + '\n').length > 3800) { parts.push(cur); cur = ''; } cur += l + '\n'; }
    if ((cur + tail).length > 4000) { parts.push(cur); cur = tail.replace(/^\n+/, ''); } else cur = cur.replace(/\n+$/, '') + tail;
    parts.push(cur);
    for (let k = 0; k < parts.length; k++) await tg('sendMessage', Object.assign({ chat_id: c.id, text: parts[k], parse_mode: 'HTML', link_preview_options: { is_disabled: true } }, k === parts.length - 1 ? { reply_markup: kb } : {})).catch(() => {});
  }
  s.used = s.used.concat(R.pids).slice(-5000);
  s.q = s.q.filter(id => !R.pids.includes(id));
  s.last = R.day;
  s.hist = (s.hist || []).concat([{ day: R.day, n: nQ, p: Object.values(R.res).reduce((a, x) => a + Object.keys(x).length, 0) }]).slice(-30);
  s.run = null; store.save();
  if (s.q.length < s.n) adminSay('Viktorina navbatida ' + s.q.length + ' ta masala qoldi (kuniga ' + s.n + ' ta kerak). Kombinatsiyalardan yana belgilang.');
}

// ---------- jadval
let busy = false;
async function tick() {
  if (busy) return; busy = true;
  try {
    const s = S(); if (!process.env.BOT_TOKEN) return;
    if (s.run && !s.run.done) { if (!timer) step(); return; }   // qayta ishga tushgandan keyin davom etadi
    if (!s.on) return;
    const t = T(), a = hmAdd(s.hm, -10), end = hmAdd(s.hm, 60);
    const inWin = (x, lo, hi) => lo <= hi ? x >= lo && x < hi : x >= lo || x < hi;
    if (s.ann !== t.day && s.last !== t.day && inWin(t.hm, a, s.hm)) {
      s.ann = t.day; store.save();
      const n = Math.min(s.n, s.q.filter(id => pz(id)).length);
      if (n) for (const c of chats()) await tg('sendMessage', { chat_id: c.id, text: '🧠 Bugun ' + s.hm + ' da shashka viktorinasi!\n\n' + n + ' ta savol, har biriga ' + (s.sec >= 60 && s.sec % 60 === 0 ? s.sec / 60 + ' daqiqa' : s.sec + ' soniya') + '.\nKombinatsiyaning birinchi yurishini toping.' + (c.anon ? '' : '\n\n🏆 1-o‘rin ' + s.prz[0] + ' 🪙 · 2-o‘rin ' + s.prz[1] + ' 🪙 · 3-o‘rin ' + s.prz[2] + ' 🪙' + (s.rest ? ' · qolganlarga ' + s.rest + ' 🪙' : '')) }).catch(() => {});
    }
    if (s.last !== t.day && inWin(t.hm, s.hm, end)) { s.last = t.day; store.save(); await startRun(false); }
  } catch (e) { console.log('[quiz] tick:', e.message); } finally { busy = false; }
}
let started = false;
function start() { if (started) return; started = true; setTimeout(tick, 15e3); setInterval(tick, 20e3).unref(); }

// ---------- admin API
function auth(req) {
  try { const u = require('./auth').verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN); return u && ADM().includes(String(u.id)) ? u : null; } catch (e) { return null; }
}
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req, cb) { let d = ''; req.on('data', c => { d += c; if (d.length > 20000) req.destroy(); }); req.on('end', () => { let j = {}; try { j = JSON.parse(d || '{}'); } catch (e) {} cb(j); }); }
function view() {
  const s = S(), t = T();
  let day = t.day, k = 0; const start0 = s.last === t.day || t.hm >= s.hm ? 1 : 0;
  const q = s.q.map((id, i) => {
    const p = pz(id), cor = p ? correct(p) : null, d = Math.floor(i / s.n) + start0;
    return { id, t: p ? titleOf(p) : '(o‘chirilgan)', side: p && p.side, cor, man: !!(s.opts[id] && s.opts[id].length), w: p && cor ? (s.opts[id] && s.opts[id].length ? s.opts[id] : pool(p, cor)) : [], d };
  });
  return { cfg: { on: s.on, hm: s.hm, n: s.n, sec: s.sec, prz: s.prz, rest: s.rest, chOn: s.chOn, skin: s.skin || '', th: s.th }, ths: Object.keys(TH).map(k => ({ id: k, name: TH[k][0] })), q, skins: (store.db.shop || []).map(x => ({ id: x.id, name: x.name || x.id, def: !!x.def })), chats: chats().length, run: s.run ? { qi: s.run.qi, n: s.run.pids.length } : null, hist: (s.hist || []).slice(-7) };
}
function handle(req, res, url) {
  const p = url.pathname; if (!p.startsWith('/api/quiz')) return false;
  const u = auth(req); if (!u) { send(res, 403, { error: 'Faqat admin' }); return true; }
  const s = S();
  if (p === '/api/quiz' && req.method === 'GET') { send(res, 200, view()); return true; }
  if (req.method !== 'POST') { send(res, 404, { error: 'yo‘q' }); return true; }
  body(req, async j => {
    try {
      if (p === '/api/quiz/tog') {
        const id = String(j.id || ''), P = pz(id); if (!P) return send(res, 200, { error: 'Masala topilmadi' });
        const i = s.q.indexOf(id);
        if (i >= 0) { s.q.splice(i, 1); store.save(); return send(res, 200, { ok: 1, on: 0, n: s.q.length }); }
        if (!correct(P)) return send(res, 200, { error: 'Bu masalaning yechimi o‘qilmadi — viktorinaga qo‘shib bo‘lmaydi' });
        s.q.push(id); store.save(); return send(res, 200, { ok: 1, on: 1, n: s.q.length, pos: s.q.length });
      }
      if (p === '/api/quiz/nums') {   // «12, 15-20» — Kombinatsiyalar papkasidagi raqamlar bo'yicha
        const want = new Set(); String(j.nums || '').split(/[,\s]+/).forEach(x => { const m = /^(\d+)(?:-(\d+))?$/.exec(x); if (!m) return; const a = +m[1], b = Math.min(+(m[2] || m[1]), a + 300); for (let k = a; k <= b; k++) want.add(k); });
        const fo = String(j.folder || 'Kombinatsiyalar'); let add = 0, bad = 0;
        (store.db.puzzles || []).filter(x => x && x.folder === fo).forEach(x => { const m = /(\d+)\s*$/.exec(titleOf(x)); if (!m || !want.has(+m[1]) || s.q.includes(x.id)) return; if (!correct(x)) { bad++; return; } s.q.push(x.id); add++; });
        store.save(); return send(res, 200, { ok: 1, add, bad, n: s.q.length });
      }
      if (p === '/api/quiz/mv') {
        const id = String(j.id || ''), i = s.q.indexOf(id); if (i < 0) return send(res, 200, { error: 'Navbatda yo‘q' });
        if (!j.d) s.q.splice(i, 1); else { const k = i + (j.d < 0 ? -1 : 1); if (k >= 0 && k < s.q.length) [s.q[i], s.q[k]] = [s.q[k], s.q[i]]; }
        store.save(); return send(res, 200, view());
      }
      if (p === '/api/quiz/opts') {
        const id = String(j.id || ''); if (!pz(id)) return send(res, 200, { error: 'Masala topilmadi' });
        const L = Array.isArray(j.opts) ? j.opts.map(x => String(x).trim().replace(/\s+/g, '').slice(0, 20)).filter(x => /^[a-h][1-8]([-:][a-h][1-8])+$/.test(x)).slice(0, 9) : [];
        if (L.length) s.opts[id] = L; else delete s.opts[id];
        store.save(); return send(res, 200, view());
      }
      if (p === '/api/quiz/cfg') {
        if (j.on !== undefined) s.on = !!j.on;
        if (/^\d\d:\d\d$/.test(j.hm || '') && +j.hm.slice(0, 2) < 24 && +j.hm.slice(3) < 60) { if (j.hm !== s.hm && s.last === T().day && T().hm < j.hm) s.last = ''; s.hm = j.hm; s.ann = ''; }
        if (j.n !== undefined) s.n = +j.n; if (j.sec !== undefined) s.sec = +j.sec;
        if (Array.isArray(j.prz) && j.prz.length === 3) s.prz = j.prz.map(x => Math.min(1000, Math.max(0, Math.round(+x || 0))));
        if (j.rest !== undefined) s.rest = Math.min(100, Math.max(0, Math.round(+j.rest || 0)));
        if (j.chOn !== undefined) s.chOn = !!j.chOn;
        if (j.skin !== undefined) s.skin = String(j.skin || '');
        if (j.th !== undefined && TH[j.th]) s.th = j.th;
        S(); store.save(); return send(res, 200, view());
      }
      if (p === '/api/quiz/test') {   // navbatdagi 1-savol adminning o'ziga (shaxsiy chat)
        const P = pz(String(j.id || s.q[0] || '')); if (!P) return send(res, 200, { error: 'Navbat bo‘sh' });
        const cor = correct(P), ops = shuffle([cor].concat(wrongs(P, cor))), buf = await png(P);
        const ph = await sendPhoto(u.id, buf, '<b>Sinov</b> · ' + esc(titleOf(P)) + ' · ' + (P.side === 'b' ? 'Qora' : 'Oq') + ' yuradi');
        const r = await tg('sendPoll', { chat_id: u.id, question: 'Kombinatsiyaning birinchi yurishini toping', options: ops.map(text => ({ text })), type: 'quiz', correct_option_id: ops.indexOf(cor), is_anonymous: false, open_period: s.sec, explanation: 'To‘g‘ri javob: ' + cor });
        return send(res, 200, r && r.ok ? { ok: 1 } : { error: (r && r.description) || (ph && ph.description) || 'Yuborilmadi — botga /start yozing' });
      }
      if (p === '/api/quiz/now') { const r = await startRun(true); return send(res, 200, r); }
      if (p === '/api/quiz/stop') { if (s.run) { s.run.qi = s.run.pids.length - 1; s.run.nextAt = Date.now(); store.save(); step(); } return send(res, 200, { ok: 1 }); }
      send(res, 404, { error: 'yo‘q' });
    } catch (e) { send(res, 500, { error: e.message }); }
  });
  return true;
}
const ids = () => S().q.slice();
// yangi foydalanuvchi ilovaga kirganda viktorinada yutgan tangasi
function claim(u) { try { const s = S(), n = s.pend[String(u.id)]; if (n) { u.diamonds = (u.diamonds || 0) + n; delete s.pend[String(u.id)]; } } catch (e) {} }
module.exports = { start, tick, onAnswer, handle, ids, claim, _t: { TH, correct, pool, svg, png, T, hmAdd, S, finish, startRun, view } };
