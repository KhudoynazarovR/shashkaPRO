'use strict';
// alert.js — 🚨 server xatolari va holati haqida adminlarga bot orqali xabar.
// Bir xil xato 10 daqiqada bir marta (necha marta takrorlangani bilan). Oxirgi 50 xato /xatolar buyrug'i uchun saqlanadi.
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const WIN = 10 * 60e3, seen = new Map(), last = [];
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function send(text) {
  const T = process.env.BOT_TOKEN; if (!T) return Promise.resolve();
  return Promise.all(ADM().map(a => fetch('https://api.telegram.org/bot' + T + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: a, text: String(text).slice(0, 3900), parse_mode: 'HTML' }) }).catch(() => null)));
}
function where(err) {   // stack ichidan birinchi o'z faylimiz
  const m = String(err && err.stack || '').split('\n').map(x => /\(?([^\s()]+\.js):(\d+):\d+\)?$/.exec(x)).find(x => x && !/node:|node_modules/.test(x[1]));
  return m ? m[1].split('/').pop() + ':' + m[2] : '';
}
function report(err, ctx) {
  try {
    const msg = String(err && err.message || err).slice(0, 300), loc = where(err), key = msg + '|' + loc, now = Date.now();
    last.push({ t: now, msg, loc, ctx: ctx || '' }); if (last.length > 50) last.shift();
    console.error('[xato]', ctx || '', err && err.stack || err);
    const s = seen.get(key);
    if (s && now - s.at < WIN) { s.n++; return; }
    const n = s ? s.n : 0; seen.set(key, { at: now, n: 0 });
    send('🚨 <b>Server xatosi</b>\n<code>' + esc(msg) + '</code>' + (loc ? '\n📍 ' + esc(loc) : '') + (ctx ? ' · ' + esc(ctx) : '') + (n ? '\n🔁 Oldingi 10 daqiqada yana: ' + n + ' marta' : ''));
  } catch (e) {}
}
function list() {
  if (!last.length) return '✅ Oxirgi ishga tushishdan beri xato yo‘q';
  const d = t => new Date(t + 5 * 3600e3).toISOString().slice(5, 16).replace('T', ' ');
  return '🧾 <b>Oxirgi xatolar</b> (' + last.length + ')\n\n' + last.slice(-15).reverse().map(x => d(x.t) + ' · ' + esc(x.loc) + (x.ctx ? ' · ' + esc(x.ctx) : '') + '\n<code>' + esc(x.msg.slice(0, 160)) + '</code>').join('\n\n');
}
let installed = false;
function install() {
  if (installed) return; installed = true;
  process.on('uncaughtException', e => report(e, 'uncaught'));   // jarayon to'xtamaydi — boshqa o'yinlar davom etadi
  process.on('unhandledRejection', e => report(e, 'promise'));
  // ishga tushdi
  setTimeout(() => {
    const v = String(process.env.RENDER_GIT_COMMIT || '').slice(0, 7);
    send('♻️ <b>Server ishga tushdi</b>' + (v ? '\n🔖 Versiya: <code>' + v + '</code>' : '') + '\n🕐 ' + new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 16).replace('T', ' '));
  }, 8000);
  // sekinlashuv: hodisalar sikli kechikishi va xotira
  let prev = Date.now(), lagN = 0, memAt = 0, lagAt = 0;
  setInterval(() => {
    const now = Date.now(), lag = now - prev - 1000; prev = now;
    lagN = lag > 1500 ? lagN + 1 : 0;
    if (lagN >= 5 && now - lagAt > 30 * 60e3) { lagAt = now; send('🐢 <b>Server sekinlashdi</b>\nHodisalar sikli kechikishi: ' + lag + ' ms (5 soniya ketma-ket). Bot va o‘yinlar sekin javob berishi mumkin.'); }
  }, 1000).unref();
  setInterval(() => {
    const lim = Number(process.env.MEM_LIMIT_MB || 512), rss = Math.round(process.memoryUsage().rss / 1048576);
    if (rss > lim * 0.85 && Date.now() - memAt > 60 * 60e3) { memAt = Date.now(); send('🐢 <b>Xotira to‘lib bormoqda</b>\n' + rss + ' MB / ' + lim + ' MB (' + Math.round(rss * 100 / lim) + '%). Server qayta ishga tushishi mumkin.'); }
  }, 60e3).unref();
}
module.exports = { install, report, list, send };
