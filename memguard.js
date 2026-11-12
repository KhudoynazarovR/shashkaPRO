'use strict';
// memguard.js — 🧹 xotira nazorati: keshlar ro'yxati, /kesh admin buyrug'i, avtomatik tozalash.
// Keshlar: reg('nom', Map) — qiymati Buffer yoki { buf } bo'lgan Map. Tozalash faqat qayta yasaladigan nusxalarni o'chiradi
// (rasm, GIF, gzip) — o'yinlar, foydalanuvchilar va tangalarga tegmaydi.
// Avtomatik: jami xotira AUTO_MB dan oshsa (10 daqiqada bir martadan ko'p emas) keshlar tozalanadi va adminlarga xabar boradi.
const fs = require('fs');
// konteyner xotira chegarasi (Render tarifi): cgroup dan o'qiladi; avtomatik tozalash chegaraning ~90% ida
const LIMIT_MB = (() => { for (const f of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) { try { const v = Number(require('fs').readFileSync(f, 'utf8').trim()); if (v > 0 && v < 1e13) return Math.round(v / 1048576); } catch (e) {} } return 512; })();
const AUTO_MB = Number(process.env.MEM_AUTO_MB || Math.round(LIMIT_MB * 0.9));
const C = new Map();   // nom -> Map
let GC = null;
try { require('v8').setFlagsFromString('--expose_gc'); GC = require('vm').runInNewContext('gc'); } catch (e) { GC = typeof global.gc === 'function' ? global.gc : null; }
try { const s = require('sharp'); s.cache(false); s.concurrency(1); } catch (e) {}   // libvips keshi xotirani ushlab turmasin

const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const tg = (m, p) => { try { return require('./gcard.js').tg(m, p); } catch (e) { return Promise.resolve(null); } };
const MB = b => Math.round(b / 1048576);

function reg(name, map) { if (map && typeof map.clear === 'function') C.set(name, map); return map; }
function sizeOf(v) { if (!v) return 0; if (Buffer.isBuffer(v)) return v.length; if (v.buf && Buffer.isBuffer(v.buf)) return v.buf.length; if (typeof v === 'string') return v.length; return 0; }
function caches() {
  const out = [];
  for (const [n, m] of C) { let b = 0; try { for (const v of m.values()) b += sizeOf(v); } catch (e) {} out.push({ n, k: m.size, b }); }
  return out;
}
// jami: shu konteynerdagi barcha jarayonlar (Render shuni hisoblaydi), dvigatel: KestoG
function total() {
  let t = 0, e = 0;
  try {
    for (const d of fs.readdirSync('/proc')) {
      if (!/^\d+$/.test(d)) continue;
      try { const r = +fs.readFileSync('/proc/' + d + '/statm', 'utf8').split(' ')[1] * 4096; t += r; if (/bridge|Kesto/i.test(fs.readFileSync('/proc/' + d + '/cmdline', 'utf8'))) e += r; } catch (x) {}
    }
  } catch (x) {}
  return { t, e };
}
let WSS = null, ROOMS = null;
function setRefs(o) { if (o.wss) WSS = o.wss; if (o.rooms) ROOMS = o.rooms; }
function snap() {
  const m = process.memoryUsage(), T = total();
  let rooms = 0; try { rooms = ROOMS && ROOMS.count ? ROOMS.count() : 0; } catch (e) {}
  return { rss: m.rss, heap: m.heapUsed, ext: m.external, ab: m.arrayBuffers, jami: T.t || m.rss, dv: T.e, ws: WSS ? WSS.clients.size : 0, rooms, c: caches() };
}
function line(s) { return 'ulanish=' + s.ws + (s.rooms ? ' xona=' + s.rooms : '') + ' kesh=' + s.c.map(x => x.n + ':' + x.k + '/' + MB(x.b) + 'MB').join(','); }
function clear() {
  let n = 0, b = 0;
  for (const x of caches()) { n += x.k; b += x.b; }
  for (const m of C.values()) try { m.clear(); } catch (e) {}
  try { const s = require('sharp'); s.cache(false); } catch (e) {}
  if (GC) { try { GC(); GC(); } catch (e) {} }
  return { n, b };
}
async function cleanReport() {
  const a = snap(), r = clear();
  await new Promise(res => setTimeout(res, 1500));
  const b = snap();
  return { a, b, r };
}
// 🤖 bot yurishlari qayerdan keldi (odam bilan o'yinlarda): e — dvigatel, z — zaxira (telefonning sayoz qidiruvi), t — vaqt tugay deb tez yurish, r — ataylab tasodifiy, f — yagona yurish
const BS = { since: Date.now(), all: { e: 0, z: 0, t: 0, r: 0, f: 0 }, bots: {} };
function botSrc(k, bot) {
  if (!/^[eztrf]$/.test(String(k))) return;
  BS.all[k]++; const id = String(bot || '?').slice(0, 30), o = BS.bots[id] || (BS.bots[id] = { e: 0, z: 0, t: 0, r: 0, f: 0 }); o[k]++;
}
function pct(a, b) { return b ? Math.round(a * 100 / b) + '%' : '0%'; }
function fmtBots() {
  const a = BS.all, n = a.e + a.z + a.t + a.r + a.f, h = new Date(BS.since + 5 * 3600e3).toISOString().slice(11, 16);
  let q = null; try { q = require('./kestoai.js').qstat(); } catch (e) {}
  let t = '\n\n🤖 <b>Bot yurishlari</b> (' + h + ' dan beri, ' + n + ' ta)\n' +
    'Dvigatel: ' + a.e + ' · <b>zaxira: ' + a.z + ' (' + pct(a.z, n) + ')</b> · tezkor ⏱: ' + a.t + ' · tasodifiy: ' + a.r + ' · yagona: ' + a.f;
  const worst = Object.keys(BS.bots).map(id => { const o = BS.bots[id], m = o.e + o.z + o.t + o.r + o.f; return { id, z: o.z + o.t, m }; }).filter(x => x.z).sort((x, y) => y.z - x.z).slice(0, 4);
  if (worst.length) t += '\nZaif yurish ko‘p: ' + worst.map(x => x.id.replace(/^bot_?/, '') + ' ' + pct(x.z, x.m)).join(', ');
  if (q) t += '\nDvigatel navbati: o‘rtacha ' + q.avg + ' ms, eng ko‘p ' + Math.round(q.max / 100) / 10 + ' s, 1.5 s dan uzoq: ' + q.slow + ' marta (hozir navbatda ' + q.queue + ')';
  return t;
}
function fmtSnap(s) {
  return 'RAM jami: <b>' + MB(s.jami) + ' MB</b> / ' + LIMIT_MB + ' MB (' + Math.round(MB(s.jami) * 100 / LIMIT_MB) + '%)\n' +
    'Node: rss ' + MB(s.rss) + ' · heap ' + MB(s.heap) + ' · ext ' + MB(s.ext) + ' · ab ' + MB(s.ab) + ' MB' + (s.dv ? '\nDvigatel (KestoG): ' + MB(s.dv) + ' MB' : '') +
    '\nUlanishlar: ' + s.ws + (s.rooms ? ' · Xonalar: ' + s.rooms : '') +
    '\n\n🗂 Keshlar:\n' + (s.c.length ? s.c.map(x => '• ' + x.n + ': ' + x.k + ' ta, ' + MB(x.b) + ' MB').join('\n') : '—') + fmtBots() + cpuRep();
}
const KB = { inline_keyboard: [[{ text: '🧹 Keshni tozalash', callback_data: 'mg:clr' }, { text: '🔄 Yangilash', callback_data: 'mg:st' }]] };
async function cmd(msg, text) {
  if (!ADM().includes(String(msg.from && msg.from.id))) return false;
  const a = String(text || '').trim().split(/\s+/)[1] || '';
  if (a === 'tozala') { const r = await cleanReport(); await tg('sendMessage', { chat_id: msg.chat.id, text: done(r), parse_mode: 'HTML', reply_markup: KB }); return true; }
  await tg('sendMessage', { chat_id: msg.chat.id, text: '🧠 <b>Xotira holati</b>\n' + fmtSnap(snap()) + '\n\n/kesh tozala — keshlarni bo‘shatish\nAvtomatik tozalash: ' + AUTO_MB + ' MB dan oshganda', parse_mode: 'HTML', reply_markup: KB });
  return true;
}
function done(r) { return '🧹 <b>Keshlar tozalandi</b> (' + r.r.n + ' ta nusxa, ' + MB(r.r.b) + ' MB)\nJami: ' + MB(r.a.jami) + ' MB → <b>' + MB(r.b.jami) + ' MB</b>\nheap: ' + MB(r.a.heap) + ' → ' + MB(r.b.heap) + ' MB · ab: ' + MB(r.a.ab) + ' → ' + MB(r.b.ab) + ' MB\n\nℹ️ Xotira tizimga bir necha daqiqada to‘liqroq qaytadi.'; }
async function onCallback(q) {
  if (!q || !q.data || q.data.indexOf('mg:') !== 0) return false;
  const ok = ADM().includes(String(q.from && q.from.id));
  await tg('answerCallbackQuery', { callback_query_id: q.id, text: ok ? (q.data === 'mg:clr' ? '🧹 Tozalanmoqda…' : '🔄') : 'Faqat admin uchun' });
  if (!ok || !q.message) return true;
  const text = q.data === 'mg:clr' ? done(await cleanReport()) : '🧠 <b>Xotira holati</b>\n' + fmtSnap(snap());
  await tg('editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text, parse_mode: 'HTML', reply_markup: KB });
  return true;
}
let lastAuto = 0, started = false;
function cpuRep() { try { return require('./cpustat.js').report(); } catch (e) { return ''; } }
function start() {
  if (started) return; started = true;
  try { require('./cpustat.js').start(); } catch (e) { console.log('[cpu]', e.message); }
  try { require('./kkfix.js').start(); } catch (e) { console.log('[kkfix]', e.message); }
  setInterval(async () => {
    const s = snap();
    if (MB(s.jami) < AUTO_MB || Date.now() - lastAuto < 10 * 60e3) return;
    lastAuto = Date.now();
    const r = await cleanReport();
    console.log('[xotira] avtomatik tozalash:', MB(r.a.jami), '→', MB(r.b.jami), 'MB');
    for (const a of ADM()) tg('sendMessage', { chat_id: a, text: '⚠️ Xotira ' + MB(r.a.jami) + ' MB ga yetdi — keshlar avtomatik tozalandi.\n' + done(r), parse_mode: 'HTML', reply_markup: KB });
  }, 60e3).unref();
}
module.exports = { botSrc, reg, snap, line, clear, cmd, onCallback, start, setRefs, total };
