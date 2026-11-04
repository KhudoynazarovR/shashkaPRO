'use strict';
// mod.js — moderatsiya: ⚠️ shikoyat, 💬 chat taqiqi, 🎮 o'yin taqiqi, so'kinish filtri.
// Jazo zinapoyasi (har tur alohida sanaladi): 1-marta 1 kun, 2-marta 7 kun, 3-va keyingilari 30 kun.
// 🎮 o'yin taqiqi — odamlar bilan o'yin, turnir, kubok, reytingli o'yinlar yopiladi (botlar va masalalar ochiq), chat ham yopiladi.
const store = require('./store.js');
const DAY = 86400000;
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const isAdmin = id => ADM().includes(String(id));
const REASONS = { insult: 'Haqorat / so‘kinish', cheat: 'Chiterlik', scam: 'Aldash / firibgarlik', spam: 'Spam', name: 'Nomaqbul ism yoki rasm', other: 'Boshqa' };
const KIND = { chat: '💬 Chat', play: '🎮 O‘yin' };
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
const nameOf = uid => { const u = store.users()[String(uid)]; return String((u && u.name) || 'O‘yinchi').slice(0, 30); };
const dm = ts => { const d = new Date(ts + 5 * 3600e3); return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };

// ---------- holat
function sOf(uid, kind) { const u = store.users()[String(uid)]; return u && u.sanc && u.sanc[kind]; }
function active(uid, kind) { const s = sOf(uid, kind); return s && s.until > Date.now() ? s : null; }
function isPlayBanned(uid) { return !!active(uid, 'play'); }
function isMuted(uid) { return !!(active(uid, 'chat') || active(uid, 'play')); }
function muteText(uid) {
  const s = active(uid, 'play') || active(uid, 'chat'); if (!s) return '';
  return 'Siz ' + dm(s.until) + ' gacha chatga yoza olmaysiz. Sabab: ' + (s.reason || '—');
}
function playText(uid) {
  const s = active(uid, 'play'); if (!s) return '';
  return '🎮 Siz ' + dm(s.until) + ' gacha odamlar bilan o‘ynay olmaysiz (botlar va masalalar ochiq). Sabab: ' + (s.reason || '—');
}
function info(uid) {
  const u = store.users()[String(uid)], o = {};
  for (const k of ['chat', 'play']) { const s = u && u.sanc && u.sanc[k]; o[k] = { n: (s && s.n) || 0, until: s && s.until > Date.now() ? s.until : 0, reason: (s && s.reason) || '' }; }
  return o;
}

// ---------- jazo
function punish(uid, kind, reason, by) {
  const u = store.users()[String(uid)]; if (!u || !KIND[kind]) return null;
  u.sanc = u.sanc || {}; const s = u.sanc[kind] = u.sanc[kind] || { n: 0, until: 0 };
  s.n = (s.n || 0) + 1;
  const days = s.n === 1 ? 1 : s.n === 2 ? 7 : 30;
  s.until = Date.now() + days * DAY; s.reason = String(reason || 'Qoidabuzarlik').slice(0, 80); s.by = String(by || ''); s.at = Date.now();
  store.save();
  tg('sendMessage', { chat_id: String(uid), text: (kind === 'play'
    ? '⛔ Sizga ' + days + ' kunlik o‘yin taqiqi qo‘yildi (' + dm(s.until) + ' gacha).\nOdamlar bilan o‘yin, turnir va kuboklar yopiq, chat ham yopiq. Botlar va masalalar ochiq.'
    : '🔇 Sizga ' + days + ' kunlik chat taqiqi qo‘yildi (' + dm(s.until) + ' gacha).') +
    '\nSabab: ' + s.reason + '\n\nTakrorlansa muddat oshadi: 1 kun → 7 kun → 30 kun.' });
  return { days, until: s.until, n: s.n };
}
function unpunish(uid, kind) {
  const u = store.users()[String(uid)]; if (!u || !u.sanc) return false;
  let ch = false;
  for (const k of kind === 'all' ? ['chat', 'play'] : [kind]) {
    const s = u.sanc[k]; if (!s || !(s.until > Date.now())) continue;
    s.until = 0; s.n = Math.max(0, (s.n || 1) - 1); ch = true;
  }
  if (ch) { store.save(); tg('sendMessage', { chat_id: String(uid), text: '✅ Sizga qo‘yilgan taqiq bekor qilindi.' }); }
  return ch;
}

// ---------- so'kinish filtri (uz / ru / en): so'z boshidan yoki ichidan mos kelsa *** bilan almashtiriladi
const START = ['jalab', 'jalap', 'qanjiq', 'qanjig', 'dalbayob', 'dalbayop', 'dalbaeb', 'sikay', 'sikam', 'sikib', 'sikdi', 'sikish', 'sikasan', 'qotoq', 'qo‘toq', "qo'toq", 'kotinga', 'kotingni', 'itvachcha', 'gandon', 'suka', 'cyka',
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'motherf', 'bastard', 'dick',
  'сука', 'суки', 'сучк', 'бля', 'хуй', 'хуе', 'хуё', 'хуя', 'пизд', 'ебан', 'ебат', 'ебал', 'ебу', 'ёб', 'еб@', 'мудак', 'мудил', 'пидор', 'пидар', 'гандон', 'залуп', 'шлюх', 'дебил', 'уёб', 'уеб'];
const INSIDE = ['fuck', 'хуй', 'хуе', 'пизд', 'ебан', 'ебат', 'бляд', 'jalab', 'qanjiq', 'dalbay'];
const norm = w => w.toLowerCase().replace(/[’‘`ʻʼ]/g, '‘').replace(/0/g, 'o').replace(/@/g, 'a').replace(/3/g, 'e').replace(/(.)\1{2,}/g, '$1$1');
function bad(w) {
  const n = norm(w), m = n.replace(/(.)\1+/g, '$1');
  return START.some(s => n.startsWith(s) || m.startsWith(s)) || INSIDE.some(s => n.includes(s) || m.includes(s));
}
function censor(text) {
  return String(text || '').replace(/[\p{L}\p{N}@'‘’`ʻʼ]+/gu, w => bad(w) ? '*'.repeat(Math.min(w.length, 8)) : w);
}

// ---------- shikoyatlar
function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function reportText(r) {
  const s = info(r.to);
  let t = '⚠️ <b>Shikoyat</b>\n' +
    '👤 Kimga: <b>' + esc(nameOf(r.to)) + '</b> (<code>' + esc(r.to) + '</code>)\n' +
    '🗣 Kimdan: ' + esc(nameOf(r.from)) + ' (<code>' + esc(r.from) + '</code>)\n' +
    '📌 Sabab: <b>' + esc(REASONS[r.reason] || r.reason) + '</b>' + (r.note ? '\n📝 ' + esc(r.note) : '') +
    '\n📚 Avvalgi jazolar: chat ' + s.chat.n + ' marta, o‘yin ' + s.play.n + ' marta';
  if (r.st) t += '\n\n' + r.st;
  return t;
}
const reportKb = r => r.st ? { inline_keyboard: [] } : { inline_keyboard: [[{ text: '💬 Chatni yopish', callback_data: 'md:c:' + r.id }, { text: '🎮 O‘yinni yopish', callback_data: 'md:p:' + r.id }], [{ text: '✅ Asossiz', callback_data: 'md:x:' + r.id }]] };
async function sendReport(r) {
  r.msgs = [];
  for (const a of ADM()) {
    const res = await tg('sendMessage', { chat_id: a, text: reportText(r), parse_mode: 'HTML', reply_markup: reportKb(r) });
    if (res && res.ok && res.result) r.msgs.push([a, res.result.message_id]);
  }
  store.save();
}
function refresh(r) { for (const [ch, mid] of r.msgs || []) tg('editMessageText', { chat_id: ch, message_id: mid, text: reportText(r), parse_mode: 'HTML', reply_markup: reportKb(r) }); }

function report(from, to, reason, note) {
  from = String(from); to = String(to);
  if (from === to) return { error: 'O‘zingizga shikoyat qilib bo‘lmaydi' };
  if (!store.users()[to]) return { error: 'Foydalanuvchi topilmadi' };
  if (!REASONS[reason]) return { error: 'Sababni tanlang' };
  const R = store.db.reports = store.db.reports || {}, now = Date.now();
  for (const k of Object.keys(R)) if (now - R[k].at > 30 * DAY) delete R[k];
  const today = Object.values(R).filter(x => x.from === from && now - x.at < DAY);
  if (today.some(x => x.to === to)) return { error: 'Bu o‘yinchiga bugun shikoyat yuborgansiz' };
  if (today.length >= 10) return { error: 'Bugun juda ko‘p shikoyat yubordingiz' };
  const r = { id: rid(), from, to, reason, note: String(note || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200), at: now, st: '' };
  R[r.id] = r; store.save();
  sendReport(r).catch(() => {});
  return { ok: true };
}

// ---------- bot tugmalari: md:c|p|x:<id>
async function onCallback(q) {
  const d = String(q.data || '').split(':'), uid = String(q.from.id);
  const answer = (text, alert) => tg('answerCallbackQuery', { callback_query_id: q.id, text: String(text || '').slice(0, 195), show_alert: !!alert });
  if (!isAdmin(uid)) return answer('Faqat adminlar uchun'), true;
  if (d[1] === 'cp' || d[1] === 'cx') {   // 🕵️ avtomatik aniqlangan shubhali o'yinchi
    const who = String(q.from.first_name || 'Admin').slice(0, 20), tu = store.users()[d[2]];
    if (!tu) return answer('Foydalanuvchi topilmadi'), true;
    let res;
    if (d[1] === 'cp') { const p = punish(d[2], 'play', 'Chiterlik', uid); res = '🎮 O‘yin ' + p.days + ' kunga yopildi — ' + who; }
    else { tu.cheat = tu.cheat || { g: [] }; tu.cheat.clean = Date.now(); store.save(); res = '✅ Toza deb belgilandi — ' + who; }
    if (q.message) tg('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [[{ text: res, callback_data: 'md:noop' }]] } });
    return answer(res), true;
  }
  if (d[1] === 'noop') return answer(''), true;
  const r = (store.db.reports || {})[d[2]];
  if (!r) return answer('Shikoyat topilmadi (eskirgan)'), true;
  if (r.st) return answer('Allaqachon ko‘rib chiqilgan'), true;
  const who = String(q.from.first_name || q.from.username || 'Admin').slice(0, 20);
  if (d[1] === 'x') r.st = '✅ Asossiz deb topildi — ' + who;
  else {
    const kind = d[1] === 'p' ? 'play' : 'chat', p = punish(r.to, kind, REASONS[r.reason] || 'Qoidabuzarlik', uid);
    if (!p) return answer('Foydalanuvchi topilmadi'), true;
    r.st = (kind === 'play' ? '🎮 O‘yin' : '💬 Chat') + ' ' + p.days + ' kunga yopildi (' + dm(p.until) + ' gacha, ' + p.n + '-marta) — ' + who;
  }
  store.save(); refresh(r);
  return answer(r.st), true;
}

// ---------- HTTP: POST /api/report {uid, reason, note}, POST /api/mod {uid, act: chat|play|undo}
function handle(req, res, p, h) {
  if (p !== '/api/report' && p !== '/api/mod') return false;
  if (req.method !== 'POST') { h.send(res, 405, { error: 'method' }); return true; }
  const tgU = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tgU) { h.send(res, 401, { error: 'auth' }); return true; }
  const me = String(tgU.id);
  h.readBody(req, 4000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (p === '/api/report') { const r = report(me, j.uid, j.reason, j.note); h.send(res, r.error ? 400 : 200, r); return; }
    if (!isAdmin(me)) { h.send(res, 403, { error: 'Faqat adminlar uchun' }); return; }
    const to = String(j.uid || '');
    if (!store.users()[to]) { h.send(res, 404, { error: 'Foydalanuvchi topilmadi' }); return; }
    if (j.act === 'undo') { unpunish(to, 'all'); h.send(res, 200, { ok: true, sanc: info(to) }); return; }
    if (j.act !== 'chat' && j.act !== 'play') { h.send(res, 400, { error: 'act' }); return; }
    const pn = punish(to, j.act, String(j.reason || '').trim() || 'Admin qarori', me);
    h.send(res, 200, { ok: true, days: pn.days, until: pn.until, sanc: info(to) });
  });
  return true;
}

module.exports = { handle, punish, unpunish, isMuted, isPlayBanned, muteText, playText, censor, info, isAdmin, onCallback, report, REASONS };
