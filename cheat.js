'use strict';
// cheat.js — 🕵️ chiterlarni avtomatik aniqlash: odam-odam o'yini tugagach g'olibning yurishlari KestoG bilan solishtiriladi.
// 10-yurishdan keyingi, kamida 2 ta tanlov bo'lgan pozitsiyalar tekshiriladi (majburiy yurishlar hisoblanmaydi).
// Oxirgi 5 ta tahlil qilingan o'yinda o‘rtacha moslik ≥ 80% bo'lsa — adminlarga "⚠️ shubhali" xabari (har o'yinchiga 3 kunda 1 marta).
// Dvigatelni band qilmaslik uchun: navbatda bitta o'yin, har pozitsiyaga 0.25 s, navbat 20 tadan oshsa yangi o'yinlar o'tkazib yuboriladi.
const store = require('./store.js');
const R = require('./kkrules.js');
const SECS = 0.25, MIN_PLY = 20, MIN_POS = 10, LAST = 5, FLAG = 80, COOL = 3 * 86400e3, QMAX = 20;
const users = () => store.users();
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const init = () => { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; } return b; };
const idx = p => p && Number.isInteger(p.r) && Number.isInteger(p.c) ? p.r * 8 + p.c : -1;

// xona yurishlari (zanjirli urish bir necha qadam) → to'liq yurishlar ketma-ketligi va pozitsiyalar
function replay(steps) {
  let b = init(), side = 1; const out = [];
  for (let i = 0; i < steps.length;) {
    const legal = R.moves(b, side), f = idx(steps[i].from);
    let m = null, j = i;
    for (; j < steps.length && j < i + 12; j++) { const t = idx(steps[j].to); m = legal.find(x => x.from === f && x.to === t && (x.path || [x.to]).length === j - i + 1); if (m) break; }
    if (!m) { for (j = i; j < steps.length && j < i + 12; j++) { const t = idx(steps[j].to); m = legal.find(x => x.from === f && x.to === t); if (m) break; } }
    if (!m) return null;
    out.push({ b, side, n: legal.length, m });
    b = m.board; side = -side; i = j + 1;
  }
  return out;
}
const ask = (b, side) => new Promise(res => { try { require('./kestoai.js').move({ board: b, side, time: SECS, maxTime: SECS, book: false }, r => res(r)); } catch (e) { res(null); } });

const Q = []; let busy = false;
function onFinish(room) {
  try {
    if (!room || room.vsBot || room.opening || !room.white || !room.black || !room.winner || room.winner === 'draw') return;
    const steps = room.moves || [];
    if (steps.length < MIN_PLY || Q.length >= QMAX) return;
    const color = room.winner, uid = String(room[color].uid), opp = String(room[color === 'white' ? 'black' : 'white'].uid);
    if (!/^\d+$/.test(uid) || !users()[uid]) return;
    Q.push({ uid, opp, color, steps: steps.slice(), id: room.id, at: Date.now() });
    run();
  } catch (e) { console.log('[cheat]', e.message); }
}
async function run() {
  if (busy) return; busy = true;
  try {
    while (Q.length) {
      const g = Q.shift(), pos = replay(g.steps); if (!pos) continue;
      const side = g.color === 'white' ? 1 : -1;
      let n = 0, hit = 0;
      for (let k = 0; k < pos.length; k++) {
        const p = pos[k]; if (p.side !== side || k < 10 || p.n < 2) continue;
        const r = await ask(p.b, p.side); if (!r || typeof r.from !== 'number') continue;
        n++; if (r.from === p.m.from && r.to === p.m.to) hit++;
      }
      if (n < MIN_POS) continue;
      record(g, Math.round(hit * 100 / n), n);
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) { console.log('[cheat]', e.message); }
  busy = false;
}
function record(g, pct, n) {
  const u = users()[g.uid]; if (!u) return;
  const C = u.cheat = u.cheat || { g: [] };
  C.g.push({ t: Date.now(), p: pct, n, r: g.id, o: g.opp }); if (C.g.length > 20) C.g.shift();
  const last = C.g.slice(-LAST), avg = Math.round(last.reduce((s, x) => s + x.p, 0) / last.length);
  C.avg = avg; store.save();
  if (last.length < LAST || avg < FLAG || (C.flagAt && Date.now() - C.flagAt < COOL)) return;
  C.flagAt = Date.now(); store.save();
  const opp = users()[g.opp] || {};
  const txt = '🕵️ <b>Shubhali o‘yinchi</b>\n\n👤 <b>' + esc(u.name || g.uid) + '</b> (<code>' + g.uid + '</code>) · ELO ' + (u.elo || 1000) + '\n' +
    '🤖 Oxirgi ' + LAST + ' ta g‘alabada KestoG bilan moslik: <b>' + avg + '%</b>\n' +
    last.map(x => '• ' + x.p + '% (' + x.n + ' yurish)').join('\n') +
    '\n\nOxirgi raqib: ' + esc(opp.name || g.opp) + '\n<i>Kuchli o‘yinchilarda ham moslik yuqori bo‘lishi mumkin — o‘yinlarini ko‘rib, keyin qaror qiling.</i>';
  for (const a of ADM()) tg('sendMessage', { chat_id: a, text: txt, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🎮 O‘yinni yopish', callback_data: 'md:cp:' + g.uid }, { text: '✅ Toza', callback_data: 'md:cx:' + g.uid }]] } });
}
// admin tugmalari (bot.js → mod.js orqali)
function stats(uid) { const C = (users()[String(uid)] || {}).cheat; return C ? { avg: C.avg || 0, n: C.g.length } : null; }
module.exports = { onFinish, replay, stats, _q: Q };
