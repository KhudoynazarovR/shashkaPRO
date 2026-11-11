'use strict';
// duoroom.js — 👥 2 kishilik o'yinlar do'st bilan onlayn (WebSocket, "du..." xabarlari): Gomoku, Go 9×9, Shaxmat, Poddavki.
// Qoidalar duocore.js da (brauzer bilan bir xil kod), har yurish serverda tekshiriladi. Tuzilishi ugroom.js bilan bir xil.
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const D = require('./duocore.js').G;
const TCS = { '0': [0, 0], '1+1': [60, 1], '3+2': [180, 2], '5+3': [300, 3], '10+5': [600, 5] };
const rooms = new Map();     // code -> xona
const byConn = new Map();    // conn id -> code
function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.randomBytes(6); let s = ''; for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function who(m) {
  const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN);
  return t ? { uid: String(t.id), name: String(t.first_name || t.username || 'O‘yinchi').slice(0, 20) } : null;
}
function clocks(r) {   // qolgan vaqt (ms), yurayotgan tomonning soati hozirgacha hisoblanadi
  if (!r.tc || !r.S) return null;
  const c = r.clk.slice(); if (r.status === 'play' && r.runAt) c[r.S.turn - 1] -= Date.now() - r.runAt;
  return c.map(x => Math.max(0, Math.round(x)));
}
function view(r, uid) {
  const S = r.S;
  return {
    type: 'duState', g: r.g, code: r.code, tc: r.tcK, status: r.status,
    st: S ? Object.assign({}, S, { rep: undefined }) : null,
    players: r.p.map(x => ({ name: x.name, side: x.side || 0, on: !!x.ws })),
    me: (r.p.find(x => x.uid === uid) || {}).side || 0, mi: r.p.findIndex(x => x.uid === uid), inl: !!r.inline,
    clk: clocks(r), draw: r.draw || 0, tour: !!r.onEnd, again: r.again ? Object.keys(r.again).map(Number) : []
  };
}
function push(r) { r.p.forEach(x => send(x.ws, view(r, x.uid))); if (r.watch) for (const ws of r.watch.values()) send(ws, view(r, '')); }
function arm(r) {
  clearTimeout(r.tmr); if (!r.tc || r.status !== 'play') return;
  const s = r.S.turn, left = r.clk[s - 1];
  r.tmr = setTimeout(() => { if (r.status === 'play' && r.S.turn === s) { r.clk[s - 1] = 0; end(r, s === 1 ? 2 : 1, 'time'); } }, Math.max(0, left) + 250);
}
function end(r, res, why) {
  clearTimeout(r.tmr); clearTimeout(r.nsT); r.status = 'over';
  if (r.onEnd && !r.reported) { r.reported = 1; try { r.onEnd(res, { why, plies: r.S ? r.S.ply : 0 }); } catch (e) { console.log('[' + 'mix]', e.message); } }
  if (r.S && !r.S.over) { r.S.over = true; r.S.res = res; r.S.why = why; }
  r.at = Date.now(); r.draw = 0; push(r);
  if (r.inline) { card(r); forget(r.code); }
}
function begin(r) {
  if (r.fixed) { r.p[0].side = 1; r.p[1].side = 2; r.fixed = false; r.games = 1; } else {
  const flip = crypto.randomInt(2) === 1;   // ranglar tasodifiy (keyingi o'yinlarda almashadi)
  if (r.games) { r.p.forEach(x => { x.side = x.side === 1 ? 2 : 1; }); } else { r.p[0].side = flip ? 2 : 1; r.p[1].side = flip ? 1 : 2; }
  r.games = (r.games || 0) + 1; }
  r.S = D[r.g].start(); r.status = 'play'; r.draw = 0; r.again = null;
  r.clk = [r.tc * 1000, r.tc * 1000]; r.runAt = Date.now(); r.at = Date.now();
  clearTimeout(r.stmr); r.pinged = 0;
  arm(r); if (r.inline) card(r);
}
function handle(c, m) {
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('du')) return false;
  if (m.type === 'duCreate') {
    if (!D[m.g]) return send(c.ws, { type: 'duErr', msg: 'Noma’lum o‘yin' }), true;
    const u = who(m); if (!u) return send(c.ws, { type: 'duErr', msg: 'O‘yinni Telegram ichida oching' }), true;
    const tcK = TCS[m.tc] ? String(m.tc) : '0';
    let k = code(); while (rooms.has(k)) k = code();
    const r = { g: m.g, code: k, tcK, tc: TCS[tcK][0], inc: TCS[tcK][1], p: [{ uid: u.uid, name: u.name, ws: c.ws, cid: c.id, offAt: 0 }], status: 'wait', at: Date.now(), S: null };
    rooms.set(k, r); byConn.set(c.id, k); push(r);
    return true;
  }
  let r = rooms.get(String(m.code || '').toUpperCase());
  if (!r && m.type === 'duJoin') r = revive(String(m.code || '').toUpperCase());   // 📣 guruh kartasi (server qayta yongan bo'lsa ham)
  if (!r) return send(c.ws, { type: 'duErr', msg: 'O‘yin topilmadi yoki tugagan' }), true;
  if (m.type === 'duJoin') {
    const u = who(m); if (!u) return send(c.ws, { type: 'duErr', msg: 'O‘yinni Telegram ichida oching' }), true;
    let p = r.p.find(x => x.uid === u.uid);
    if (!p) {
      if (r.p.length >= 2) { r.watch = r.watch || new Map(); if (r.watch.size < 100) { r.watch.set(c.id, c.ws); byConn.set(c.id, r.code); } send(c.ws, view(r, '')); return true; }   // 👁 tomosha
      p = { uid: u.uid, name: u.name }; r.p.push(p);
    }
    p.ws = c.ws; p.cid = c.id; p.offAt = 0; byConn.set(c.id, r.code);
    if (r.p.length === 2 && r.status === 'wait' && (!(r.onEnd || r.inline) || r.p.every(x => x.ws))) begin(r);   // turnir / guruh kartasi — ikkalasi ham kirganda
    else if (r.inline && r.status === 'wait' && r.p.length === 2 && !r.p[0].ws) { pingHost(r); card(r); }
    push(r);
    return true;
  }
  const me = r.p.find(x => x.cid === c.id); if (!me) return true;
  const S = r.S;
  if (m.type === 'duMove') {
    if (r.status !== 'play' || S.turn !== me.side) return true;
    const now = Date.now();
    if (r.tc) { r.clk[me.side - 1] -= now - r.runAt; if (r.clk[me.side - 1] <= 0) { r.clk[me.side - 1] = 0; end(r, me.side === 1 ? 2 : 1, 'time'); return true; } }
    if (!D[r.g].play(S, m.mv || {})) { send(c.ws, view(r, me.uid)); return true; }
    if (r.tc) { r.clk[me.side - 1] += r.inc * 1000; r.runAt = now; }
    r.draw = 0; r.at = now;
    if (S.over) { end(r, S.res, S.why); return true; }
    arm(r); push(r);
    return true;
  }
  if (m.type === 'duResign') { if (r.status === 'play') end(r, me.side === 1 ? 2 : 1, 'resign'); return true; }
  if (m.type === 'duDraw') {   // durang taklifi: ikkinchi tomon ham bossa — durang
    if (r.status !== 'play' || S.ply < 2) return true;
    if (r.draw && r.draw !== me.side) { end(r, 0, 'agree'); return true; }
    r.draw = me.side; push(r); return true;
  }
  if (m.type === 'duAgain') {
    if (r.onEnd) return true;   // turnir o'yini — revansh yo'q   // 🔁 revansh — ikkalasi ham bosganda
    if (r.status !== 'over' || r.p.length !== 2) return true;
    r.again = r.again || {}; r.again[me.side] = 1;
    if (r.again[1] && r.again[2]) begin(r);
    push(r); return true;
  }
  if (m.type === 'duLeave') {
    byConn.delete(c.id); me.ws = null; me.offAt = Date.now();
    if (r.status === 'wait' && r.inline) { if (me === r.p[1]) { r.p.pop(); clearTimeout(r.stmr); r.pinged = 0; card(r); } push(r); return true; }   // guruh kartasi: raqib chiqdi — o'rin bo'sh
    if (r.status === 'wait') { if (r.onEnd) { push(r); return true; } clearTimeout(r.tmr); rooms.delete(r.code); return true; }
    if (r.status === 'play') end(r, me.side === 1 ? 2 : 1, 'left'); else push(r);
    return true;
  }
  return true;
}
function onClose(c) {
  const k = byConn.get(c.id); if (!k) return; byConn.delete(c.id);
  const r = rooms.get(k); if (!r) return;
  if (r.watch) r.watch.delete(c.id);
  const p = r.p.find(x => x.cid === c.id); if (p) { p.ws = null; p.offAt = Date.now(); }
  push(r);
}
// uzilganlar (60 s) va eski xonalar
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of rooms) {
    if (r.status === 'play') { const off = r.p.find(x => !x.ws && x.offAt && now - x.offAt > 60e3); if (off) end(r, off.side === 1 ? 2 : 1, 'left'); }
    if (r.inline && r.status === 'wait' && r.p.length === 2 && !r.p[1].ws && r.p[1].offAt && now - r.p[1].offAt > 60e3) { r.p.pop(); clearTimeout(r.stmr); r.pinged = 0; card(r); push(r); }
    const on = r.p.some(x => x.ws);
    if ((!on && now - r.at > 30 * 60e3) || now - r.at > 6 * 3600e3) { clearTimeout(r.tmr); rooms.delete(k); }
  }
}, 30e3).unref();
// 🔀 Miks turnir: ikkala o'rin oldindan band (a — birinchi yuradi), natija onEnd(res 1|2|0, {why, plies, noshow, noshowBoth}) bilan qaytadi.
// noshowMs ichida o'yin boshlanmasa: kirgan yutadi, hech kim kirmasa — ikkalasi ham kelmadi.
function createPair(a, b, tcK, onEnd, noshowMs, g) {
  tcK = TCS[tcK] ? String(tcK) : '3+2';
  let k = code(); while (rooms.has(k)) k = code();
  const r = { code: k, tcK, tc: TCS[tcK][0], inc: TCS[tcK][1], p: [{ uid: String(a.uid), name: a.name, ws: null, offAt: 0 }, { uid: String(b.uid), name: b.name, ws: null, offAt: 0 }], status: 'wait', at: Date.now(), S: null, fixed: true, onEnd };
  if (g) r.g = g;
  r.nsT = setTimeout(() => {
    if (r.status !== 'wait') return;
    const on = r.p.map(x => !!x.ws);
    r.status = 'over'; r.at = Date.now();
    if (!r.reported) { r.reported = 1; try { onEnd(on[0] && !on[1] ? 1 : on[1] && !on[0] ? 2 : 0, { why: 'noshow', plies: 0, noshow: true, noshowBoth: !on[0] && !on[1] }); } catch (e) { console.log('[mix]', e.message); } }
    r.S = r.S || null; push(r);
  }, noshowMs || 120000);
  if (r.nsT.unref) r.nsT.unref();
  rooms.set(k, r); return r;
}
// ================= 📣 GURUH KARTASI (inline): yuboruvchining o'rni band, guruhdan birinchi bosgan — raqib, ikkalasi kirganda boshlanadi.
// Ma'lumot bazada 24 soat (server qayta yonsa yoki Telegram «tanlandi» xabarini yubormasa ham karta ishlaydi). Karta matni holatga qarab yangilanadi.
const GN = { ug: '🏁 Ugolki', chess: '♟ Shaxmat', go: '⚪ Go 9×9', gomoku: '⭕ Gomoku', pod: '🔄 Poddavki' };
function inl() { const d = require('./store.js').db; return d ? (d.duInl || (d.duInl = {})) : null; }
function remember(codeX, o) {
  const I = inl(); if (!I || !codeX) return;
  const now = Date.now();
  for (const k of Object.keys(I)) if (now - (I[k].at || 0) > 24 * 3600e3) delete I[k];
  const ks = Object.keys(I); if (ks.length > 500) ks.sort((a, b) => I[a].at - I[b].at).slice(0, ks.length - 500).forEach(k => delete I[k]);
  I[codeX] = Object.assign(I[codeX] || { at: now }, o);
  const r = rooms.get(codeX); if (r && o.imid) { r.imid = o.imid; card(r); }
  try { require('./store.js').save(); } catch (e) {}
}
function forget(codeX) { const I = inl(); if (I && I[codeX]) { delete I[codeX]; try { require('./store.js').save(); } catch (e) {} } }
function revive(codeX) {
  const I = inl(), o = I && I[codeX]; if (!o || !o.uid || Date.now() - (o.at || 0) > 24 * 3600e3) return null;
  const tcK = TCS[o.tc] ? String(o.tc) : '3+2';
  const r = { code: codeX, tcK, tc: TCS[tcK][0], inc: TCS[tcK][1], p: [{ uid: String(o.uid), name: String(o.name || 'O‘yinchi').slice(0, 20), ws: null, offAt: 0 }], status: 'wait', at: Date.now(), S: null, inline: true, imid: o.imid || '', link: o.link || '', img: o.img || '' };
  if (o.g) r.g = o.g;
  rooms.set(codeX, r); return r;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function TG(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return null; } }
function capOf(r) {
  const T = (GN[r.g] || r.g), tc = r.tcK === '0' ? '∞' : r.tcK, A = r.p[0] ? esc(r.p[0].name) : '', B = r.p[1] ? esc(r.p[1].name) : '';
  if (r.status === 'wait') return r.p.length < 2 ? T + ' · ⏱ ' + tc + '\n🎯 <b>' + A + '</b> raqib qidiryapti — bosing va o‘ynang! 👇' : T + ' · ⏱ ' + tc + '\n⏳ <b>' + B + '</b> qo‘shildi — <b>' + A + '</b> kirishi bilan boshlanadi';
  const W = r.p.find(x => x.side === 1), Bk = r.p.find(x => x.side === 2);
  if (r.status === 'play') return '🔴 <b>Jonli · ' + T + '</b> · ⏱ ' + tc + '\n' + esc(W ? W.name : '') + ' — ' + esc(Bk ? Bk.name : '') + '\n👁 Tomosha qilish uchun bosing';
  const res = r.S ? r.S.res : null, win = res === 1 ? W : res === 2 ? Bk : null;
  return T + ' — o‘yin tugadi\n' + (win ? '🏆 G‘olib — <b>' + esc(win.name) + '</b>' : '🤝 Durang') + '\n' + esc(W ? W.name : '') + ' — ' + esc(Bk ? Bk.name : '');
}
function card(r) {   // guruhdagi xabarni yangilash (imid — «tanlandi» xabaridan)
  if (!r.inline || !r.imid) return;
  const kb = r.status === 'over' ? { inline_keyboard: [[{ text: '🔁 Yana o‘ynash', switch_inline_query_current_chat: r.g || 'ugolki' }]] } : { inline_keyboard: [[{ text: r.status === 'play' ? '👁 Tomosha' : '▶ O‘yinga kirish', url: r.link }]] };
  const p = { inline_message_id: r.imid, text: capOf(r), parse_mode: 'HTML', reply_markup: kb };
  if (r.img) p.link_preview_options = { url: r.img, prefer_large_media: true, show_above_text: true };
  TG('editMessageText', p);
}
// do'st qo'shildi, yuboruvchi esa ilovada emas: botdan xabar + 3 daqiqa kutish
function pingHost(r) {
  const now = Date.now(); if (r.pinged && now - r.pinged < 60e3) return; r.pinged = now;
  TG('sendMessage', { chat_id: r.p[0].uid, parse_mode: 'HTML', text: (GN[r.g] || r.g) + ': <b>' + esc(r.p[1].name) + '</b> o‘yiningizga qo‘shildi!\nSiz kirishingiz bilan boshlanadi ⏳ (3 daqiqa kutadi)', reply_markup: { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: r.link || ('https://t.me/DraughtsPRObot/play?startapp=' + 'du_' + r.g + '_' + r.code) }]] } });
  clearTimeout(r.stmr);
  r.stmr = setTimeout(() => {
    if (r.status !== 'wait' || r.p.length !== 2 || r.p[0].ws) return;
    const f = r.p.pop(); if (f.cid) byConn.delete(f.cid);
    send(f.ws, { type: 'duErr', msg: 'Raqib 3 daqiqada kirmadi — keyinroq qayta urinib ko‘ring' });
    r.pinged = 0; card(r); push(r);
  }, 180e3);
}
module.exports = { handle, onClose, rooms, createPair, remember, GN };
