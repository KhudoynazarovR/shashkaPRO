'use strict';
// memroom.js — 🧠 Xotira: do'st bilan onlayn o'yin (WebSocket, "mm..." xabarlari).
// Kartalar serverda turadi: mijoz faqat ochilgan kartani ko'radi (aldab bo'lmaydi). Qoidalar — memcore.js.
const crypto = require('crypto');
const { verifyInitData } = require('./auth');
const C = require('./memcore.js');
const SIZES = { '4x6': [4, 6], '6x6': [6, 6] };
const REW = { '4x6': 3, '6x6': 5 };
const TCS = [0, 10, 20, 30, -120];   // >0 — har yurishga soniya, 0 — vaqtsiz, -120 — ⚡ tezkor: butun o'yinga 2 daqiqa
const FC = { '2+2': { b: 120e3, i: 2e3 }, '3+2': { b: 180e3, i: 2e3 } };   // ⏱ har o'yinchining o'z soati: b — boshida, i — har yurishdan (2-karta) keyin qo'shiladi
function normTc(v) { if (typeof v === 'string' && FC[v]) return v; const n = +v; return TCS.includes(n) ? n : 0; }
const IDX = Array.from({ length: 18 }, (_, i) => String(i));   // 🎨 mini o'yinlar markazi xonasi: kartada juftlik raqami, rasmni har o'yinchi o'zi tanlaydi
const rooms = new Map();       // code -> room
const byConn = new Map();      // conn id -> code
const R = () => crypto.randomInt(1e9) / 1e9;

const ANIMALS = Array.from('🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🦓🐸🐵🐔🐧🐦🦆🦉🐴🦄🐝🦋🐢🦜🐙🦀🐬🐳🦒🐘');
const ROMANTIC = (s => Array.from(s).reduce((a, c) => { if (/[\u200d\ufe0f]/.test(c) && a.length) a[a.length - 1] += c; else a.push(c); return a; }, []))('💖💘💝💞💗💓🌹🌷🌸🌺🌻💐🦋🦢🕊️🐞🌈⭐🧸🎀🎁💌💍💎🍓🍒🍫🧁🍭🎂🌙✨🕯️🎈🪷🌼');
function hook(r) { if (r.inline || r.gt) { try { require('./gcard.js').mmTouch(r); } catch (e) {} } }
function code() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const b = crypto.randomBytes(6); for (let i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
function send(ws, o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
function who(m) {
  const t = verifyInitData(String(m.init || ''), process.env.BOT_TOKEN);
  if (!t) return null;
  return { uid: String(t.id), name: String(t.first_name || t.username || 'O‘yinchi').slice(0, 20) };
}
// 🎨 har o'yinchining rasmlari (mijoz yuboradi): juftlik raqami -> rasm
function setSyms(p, arr) {
  const v = [...new Set(arr.filter(s => typeof s === 'string' && s.length > 0 && s.length <= 12))].slice(0, 40);
  if (v.length < IDX.length) return;
  const k = v.join(' '); if (p.symK === k) return;
  p.symK = k; p.syms = v; p.map = null;
}
function mapOf(p) { if (!p) return ANIMALS; if (!p.map) p.map = C.shuffle((p.syms || ANIMALS).slice(), R).slice(0, IDX.length); return p.map; }
function clkNow(r) { const c = r.clk.slice(); if (r.run && r.S) c[r.S.turn] = Math.max(0, c[r.S.turn] - (Date.now() - r.run)); return c; }
function view(r, uid) {
  const S = r.S, cards = [];
  const pi = r.p.findIndex(x => x.uid === uid), mp = r.pt ? mapOf(r.p[pi >= 0 ? pi : 0]) : null, sym = i => mp ? (mp[+S.deck[i]] || '❔') : S.deck[i];
  if (S) for (let i = 0; i < S.deck.length; i++) cards.push(S.done[i] ? { s: sym(i), o: S.done[i] } : S.up.includes(i) ? { s: sym(i) } : null);
  const now = Date.now();
  return {
    type: 'mmState', code: r.code, size: r.size, theme: r.theme, tc: r.tc, rules: r.rules, cards,
    fc: !!r.fc, clk: r.fc && r.clk ? clkNow(r) : null, run: !!(r.fc && r.run), hold: !!r.hold, flag: r.flag != null ? r.flag : null, ns: !!r.ns, mg: !!r.pt, chat: r.chat || [],
    players: r.p.map((x, j) => ({ uid: x.uid, name: x.name, sc: S ? S.sc[j] : 0, on: !!x.ws })), me: r.p.findIndex(x => x.uid === uid),
    turn: S ? S.turn : 0, left: r.tc > 0 && r.deadline ? Math.max(0, r.deadline - now) : 0, blitz: r.tc < 0 && r.blitzEnd ? Math.max(0, r.blitzEnd - now) : 0,
    canSit: !!(r.inline && r.p.length === 1 && r.status === 'wait'), host: r.p[0] ? r.p[0].name : '', pinged: !!r.pinged,
    status: r.status, winner: r.winner, quit: r.quit != null ? r.quit : null, gain: r.gain || null, ev: r.ev || null,
    rt: r.rt ? require('./mgplay.js').rtView(r.rt, uid) : null   // ⭐ mini o'yin reytingi o'zgarishi
  };
}
function push(r) {
  hook(r);
  r.p.forEach(x => send(x.ws, view(r, x.uid)));
  if (r.watch && r.watch.size) { const v = Object.assign(view(r, ''), { watch: true, viewers: r.watch.size }); for (const [, ws] of r.watch) send(ws, v); }
  r.ev = null;
}
const watching = new Map();   // conn id -> code (tomoshabinlar)
function arm(r) {
  clearTimeout(r.tmr); r.deadline = 0;
  if (r.status !== 'play' || !(r.tc > 0) || r.hold) return;
  r.deadline = Date.now() + r.tc * 1000;
  r.tmr = setTimeout(() => {   // vaqt tugadi — navbat o'tadi
    if (r.status !== 'play' || r.busy) return;
    C.timeout(r.S); r.ev = { t: 'timeout' }; arm(r); push(r);
  }, r.tc * 1000 + 300);
}
// ⏱ 2+2 / 3+2: navbatdagi o'yinchining soati yuradi (raqib kartalarni ko'rib turgan 1,1 s — to'xtaydi)
function fRun(r) {
  clearTimeout(r.ftmr); r.run = 0;
  if (!r.fc || r.status !== 'play' || r.hold || r.busy || !r.S) return;
  r.run = Date.now(); fArm(r);
}
function fArm(r) {
  clearTimeout(r.ftmr);
  const left = r.clk[r.S.turn] - (Date.now() - r.run);
  r.ftmr = setTimeout(() => fCheck(r), Math.max(0, left) + 120);
}
function fCheck(r) {
  if (!r.fc || r.status !== 'play' || !r.run || r.busy) return;
  const t = r.S.turn, left = r.clk[t] - (Date.now() - r.run);
  if (left > 0) return fArm(r);
  r.clk[t] = 0; r.run = 0; flag(r, t);
}
function fSpend(r) {   // yurish tugadi (2-karta ochildi): sarflangan vaqt ayiriladi, +i soniya qo'shiladi
  if (!r.fc || !r.run) return;
  const t = r.S.turn; r.clk[t] = Math.max(0, r.clk[t] - (Date.now() - r.run)) + r.fc.i;
  r.run = 0; clearTimeout(r.ftmr);
}
function flag(r, t) {   // ⏰ soati tugadi: qolgan juftliklar raqibga o'tadi
  const S = r.S, o = 1 - t; let n = 0;
  S.up = [];
  for (let i = 0; i < S.deck.length; i++) if (!S.done[i]) { S.done[i] = o + 1; n++; }
  S.sc[o] += n / 2; S.over = true; r.flag = t; r.ev = { t: 'flag', by: t };
  finish(r);
}
function finish(r, quit) {
  if (r.inline) forget(r.code);
  if (r.fc && r.run && r.S && r.clk) r.clk[r.S.turn] = Math.max(0, r.clk[r.S.turn] - (Date.now() - r.run));
  clearTimeout(r.ftmr); r.run = 0; r.hold = false;
  r.status = 'over'; clearTimeout(r.tmr); clearTimeout(r.btmr);
  r.winner = quit != null ? 1 - quit : C.winner(r.S); r.quit = quit != null ? quit : null;
  r.gain = [0, 0];
  if (r.winner >= 0) {
    try {
      const st = require('./store.js'), u = st.users()[r.p[r.winner].uid];
      const day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
      if (u && r.p[0].uid !== r.p[1].uid) {
        u.mem = u.mem || {}; if (u.mem.day !== day) { u.mem.day = day; u.mem.coins = 0; }
        const g = Math.max(0, Math.min(REW[r.size] * 2, 60 - (u.mem.coins || 0)));
        u.mem.coins = (u.mem.coins || 0) + g; u.diamonds = (u.diamonds || 0) + g; r.gain[r.winner] = g;
        u.mem.fw = (u.mem.fw || 0) + 1; st.save();
      }
    } catch (e) { console.log('[xotira]', e.message); }
  }
  try { const S = r.S; r.rt = r.p.length === 2 ? require('./mgplay.js').rated('mm', r.p[0].uid, r.p[1].uid, r.winner === 0 ? 1 : r.winner === 1 ? 2 : 0, { why: quit != null ? 'resign' : 'game', plies: S ? (S.sc[0] + S.sc[1] + (S.att || 0)) : 0 }) : null; } catch (e) { r.rt = null; }   // ⭐ reyting
  try { require('./grp.js').mmFinished(r); } catch (e) { console.log('[grp]', e.message); }
  if (r.onEnd && !r.reported) { r.reported = 1; clearTimeout(r.nsT); try { r.onEnd(r.winner === 0 ? 1 : r.winner === 1 ? 2 : 0, { why: quit != null ? 'resign' : 'game', plies: r.S ? 10 : 0 }); } catch (e) { console.log('[mix]', e.message); } }   // 🔀 Miks turnir
  push(r);
}
function deal(r) {
  clearTimeout(r.stmr); r.pinged = 0;
  const [w, h] = SIZES[r.size];
  r.S = C.newGame({ pairs: w * h / 2, symbols: r.symbols, rules: r.rules, rnd: R });
  r.busy = false; r.status = 'play'; r.winner = null; r.gain = null; r.quit = null; r.rt = null; r.flag = null; r.ns = 0;
  if (r.pt) r.p.forEach(x => { x.map = null; });   // 🎨 har o'yinda rasmlar yangidan tanlanadi
  clearTimeout(r.btmr); r.blitzEnd = 0;
  if (r.tc < 0) { r.blitzEnd = Date.now() + (-r.tc) * 1000; r.btmr = setTimeout(() => { if (r.status === 'play') finish(r); }, -r.tc * 1000 + 200); }
  r.fc = FC[r.tc] || null; clearTimeout(r.ftmr); r.run = 0;
  if (r.fc) { r.clk = [r.fc.b, r.fc.b]; fRun(r); }
  arm(r);
}

let CL = null;   // server.js dagi ulanishlar (o'yin zalidagilarni topish uchun)
function lobbyConns(uid) { return CL ? [...CL.values()].filter(x => x && x.lb && !x.isBot && String(x.lb.uid) === String(uid)) : []; }
function invGone(r, except) {   // taklif qilinganlarga: taklif endi amal qilmaydi
  if (!r.inv) return;
  for (const uid of Object.keys(r.inv)) if (uid !== except) lobbyConns(uid).forEach(x => send(x.ws, { type: 'mmInviteGone', code: r.code }));
  r.inv = {};
}
function handle(c, m, clients) {
  if (clients) CL = clients;
  if (!m || typeof m.type !== 'string' || !m.type.startsWith('mm')) return false;
  if (m.type === 'mmPlayers') {   // o'yin zalidagi onlayn o'yinchilar (taklif uchun)
    const u = who(m), seen = new Set(), list = [], inMem = new Set();
    for (const r of rooms.values()) if (r.status === 'play') r.p.forEach(x => { if (x.ws) inMem.add(x.uid); });
    if (CL) for (const x of CL.values()) {
      if (!x || !x.lb || x.isBot || x.hidden) continue;
      const id = String(x.lb.uid); if (seen.has(id) || (u && id === u.uid)) continue; seen.add(id);
      list.push({ uid: id, name: String(x.lb.name || 'O‘yinchi').slice(0, 24), busy: !!x.lb.inRoom || inMem.has(id) });
    }
    send(c.ws, { type: 'mmPlayers', list: list.slice(0, 100) });
    return true;
  }
  if (m.type === 'mmLive') {   // 📺 jonli efir: hozir ketayotgan o'yinlar
    const list = [];
    for (const r of rooms.values()) if (r.status === 'play' && r.p.length === 2 && r.S) list.push({ code: r.code, size: r.size, a: r.p[0].name, b: r.p[1].name, sa: r.S.sc[0], sb: r.S.sc[1], v: r.watch ? r.watch.size : 0 });
    send(c.ws, { type: 'mmLive', list: list.slice(0, 30) });
    return true;
  }
  if (m.type === 'mmCreate') {
    const u = who(m); if (!u) return send(c.ws, { type: 'mmErr', msg: 'Telegram orqali kiring' }), true;
    const size = SIZES[m.size] ? m.size : '4x6', tc = normTc(m.tc);
    const symbols = Array.isArray(m.symbols) ? m.symbols.filter(s => typeof s === 'string' && s.length <= 8).slice(0, 40) : [];
    if (symbols.length < SIZES[size][0] * SIZES[size][1] / 2) return send(c.ws, { type: 'mmErr', msg: 'Rasmlar yetarli emas' }), true;
    const ru = m.rules || {}, rules = { streak: !!ru.streak, shuffle: !!ru.shuffle, black: !!ru.black };
    let k = code(); while (rooms.has(k)) k = code();
    const r = { code: k, size, tc, rules, theme: String(m.theme || ''), symbols, p: [{ uid: u.uid, name: u.name, ws: c.ws, cid: c.id }], status: 'wait', at: Date.now(), S: null };
    rooms.set(k, r); byConn.set(c.id, k);
    send(c.ws, view(r, u.uid));
    return true;
  }
  let r = rooms.get(String(m.code || '').toUpperCase());
  if (!r && (m.type === 'mmJoin' || m.type === 'mmSit' || m.type === 'mmWatch')) r = revive(String(m.code || '').toUpperCase());   // server qayta yongan bo'lsa ham guruh kartasi ishlaydi
  if (!r) return send(c.ws, { type: 'mmErr', msg: 'O‘yin topilmadi yoki tugagan' }), true;
  if (m.type === 'mmJoin') {
    const u = who(m); if (!u) return send(c.ws, { type: 'mmErr', msg: 'Telegram orqali kiring' }), true;
    let p = r.p.find(x => x.uid === u.uid);
    if (!p && r.inline && r.p.length < 2) {   // guruh kartasi: ochgan odam avval tomoshabin, "Qo'shilish" bilan raqib bo'ladi
      r.watch = r.watch || new Map(); r.watch.set(c.id, c.ws); watching.set(c.id, r.code); push(r);
      return true;
    }
    if (!p && (r.inline || r.gt) && r.p.length >= 2) { r.watch = r.watch || new Map(); r.watch.set(c.id, c.ws); watching.set(c.id, r.code); push(r); return true; }
    if (!p) {
      if (r.p.length >= 2) return send(c.ws, { type: 'mmErr', msg: r.inv && r.inv[u.uid] ? 'Kechikdingiz — boshqa o‘yinchi birinchi qabul qildi' : 'Bu o‘yinda allaqachon 2 kishi bor' }), true;
      p = { uid: u.uid, name: u.name }; r.p.push(p);
      invGone(r, u.uid);
    }
    p.ws = c.ws; p.cid = c.id; p.offAt = 0; p.j = true; byConn.set(c.id, r.code);
    if (r.pt && Array.isArray(m.syms)) setSyms(p, m.syms);   // 🎨 o'zi tanlagan rasmlar
    if (r.p.length === 2 && r.status === 'wait' && (!(r.inline || r.gt || r.onEnd) || r.p.every(x => x.ws))) deal(r);
    if (r.hold && r.status === 'play' && r.p.length === 2 && r.p.every(x => x.j)) { r.hold = false; fRun(r); arm(r); }   // ikkalasi ham kirdi — soat yuradi
    push(r);
    return true;
  }
  if (m.type === 'mmSit') {   // guruh kartasi: tomoshabin raqib bo'ladi
    const u = who(m); if (!u || !r.inline || r.p.length !== 1 || r.status !== 'wait' || r.p[0].uid === u.uid) return true;
    if (r.watch) r.watch.delete(c.id); watching.delete(c.id);
    r.p.push({ uid: u.uid, name: u.name, ws: c.ws, cid: c.id, offAt: 0 }); byConn.set(c.id, r.code);
    if (r.p[0].ws) deal(r); else pingHost(r, u.name);   // yuboruvchi ilovada emas — botdan xabar, 3 daqiqa kutiladi
    push(r);
    return true;
  }
  if (m.type === 'mmWatch') {
    if (r.p.some(x => x.cid === c.id)) return true;
    const old = watching.get(c.id); if (old && rooms.get(old) && rooms.get(old).watch) rooms.get(old).watch.delete(c.id);
    r.watch = r.watch || new Map(); if (r.watch.size >= 200) return send(c.ws, { type: 'mmErr', msg: 'Tomoshabinlar juda ko‘p' }), true;
    r.watch.set(c.id, c.ws); watching.set(c.id, r.code); push(r);
    return true;
  }
  if (m.type === 'mmUnwatch') { if (r.watch) r.watch.delete(c.id); watching.delete(c.id); return true; }
  if (m.type === 'mmDecline') {
    const u = who(m); if (u && r.status === 'wait' && r.p[0]) send(r.p[0].ws, { type: 'mmDeclined', name: u.name });
    return true;
  }
  const me = r.p.findIndex(x => x.cid === c.id);
  if (me < 0) return true;
  if (m.type === 'mmChat') {   // 💬 chat (faqat o'yinchilar), sokinish filtri — mod.js. Doska qayta chizilmasin — alohida xabar
    const P = r.p[me], now = Date.now(); if (P.lastChat && now - P.lastChat < 400) return true;
    let t = String(m.text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120); if (!t) return true;
    try { const M = require('./mod.js'); if (M.isMuted(P.uid)) return true; t = M.censor(t); } catch (e) {}
    P.lastChat = now; r.chat = r.chat || []; r.chatN = (r.chatN || 0) + 1; r.chat.push({ i: r.chatN, name: P.name, text: t }); if (r.chat.length > 30) r.chat.shift();
    const o = { type: 'mmChat', code: r.code, chat: r.chat };
    r.p.forEach(x => send(x.ws, o)); if (r.watch) for (const [, ws] of r.watch) send(ws, o);
    return true;
  }
  if (m.type === 'mmFlip') {
    const S = r.S;
    if (r.status !== 'play' || !S || S.turn !== me || r.busy || r.hold) return true;
    if (r.fc && r.run && r.clk[me] - (Date.now() - r.run) <= 0) { r.clk[me] = 0; r.run = 0; clearTimeout(r.ftmr); flag(r, me); return true; }   // ⏰ ulgurmadi
    const res = C.flip(S, Math.floor(+m.i));
    if (!res) return true;
    if (res.match === true) {
      r.ev = res.ev.length ? { t: res.ev.join(','), by: me } : null;
      fSpend(r);
      if (S.over) return finish(r), true;
      fRun(r); arm(r); push(r);   // topdi — yana yuradi
    } else if (res.match === false) {
      r.busy = true; clearTimeout(r.tmr); fSpend(r); push(r);
      setTimeout(() => {
        if (r.status !== 'play') return;
        const e = C.endTurn(S); r.busy = false;
        if (e.shuffled) r.ev = { t: 'shuffle', at: e.shuffled };
        fRun(r); arm(r); push(r);
      }, 1100);
    } else push(r);
    return true;
  }
  if (m.type === 'mmAgain') {   // qayta o'ynash (ikkalasi ham bosganda)
    if (r.onEnd) return true;   // turnir o'yini — revansh yo'q
    if (r.status !== 'over') return true;
    r.again = r.again || {}; r.again[me] = 1;
    if (r.again[0] && r.again[1]) { r.again = {}; deal(r); push(r); return true; }
    const o = r.p[1 - me]; if (o) send(o.ws, { type: 'mmAgainAsk' });
    return true;
  }
  if (m.type === 'mmInvite') {   // zaldagi o'yinchiga taklif (kodsiz)
    if (r.status !== 'wait' || me !== 0) return true;
    const to = String(m.toUid || ''), cs = lobbyConns(to);
    if (!cs.length) return send(c.ws, { type: 'mmInviteRes', toUid: to, ok: false }), true;
    r.inv = r.inv || {}; if (r.inv[to] && Date.now() - r.inv[to] < 15e3) return true; r.inv[to] = Date.now();
    cs.forEach(x => send(x.ws, { type: 'mmInviteIn', code: r.code, fromName: r.p[0].name, size: r.size, tc: r.tc }));
    send(c.ws, { type: 'mmInviteRes', toUid: to, ok: true });
    return true;
  }
  if (m.type === 'mmInviteAll') {   // tasodifiy raqib: zaldagi hammaga so'rov, kim birinchi qabul qilsa
    if (r.status !== 'wait' || me !== 0) return true;
    r.inv = r.inv || {}; const seen = new Set(); let n = 0;
    if (CL) for (const x of CL.values()) {
      if (!x || !x.lb || x.isBot || x.hidden || x.lb.inRoom) continue;
      const id = String(x.lb.uid); if (id === r.p[0].uid) continue;
      send(x.ws, { type: 'mmInviteIn', code: r.code, fromName: r.p[0].name, size: r.size, tc: r.tc, all: true });
      if (!seen.has(id)) { seen.add(id); r.inv[id] = Date.now(); n++; }
    }
    send(c.ws, { type: 'mmInviteAllRes', n });
    return true;
  }
  if (m.type === 'mmLeave') {
    if (r.hold && r.status === 'play') { r.p[me].ws = null; byConn.delete(c.id); noShow(r, 'left'); return true; }   // raqib hali kirmagan edi — o'yin bekor (reytingsiz)
    if (r.status === 'wait' && me === 0 && !r.onEnd) { invGone(r); byConn.delete(c.id); clearTimeout(r.stmr); rooms.delete(r.code); if (r.inline) forget(r.code); return true; }   // bekor qilindi
    if (r.status === 'wait' && me === 1 && r.inline) { r.p.pop(); byConn.delete(c.id); clearTimeout(r.stmr); r.pinged = 0; push(r); return true; }   // guruh kartasi: qo'shilgan raqib chiqib ketdi — o'rin yana bo'sh
    r.p[me].ws = null; byConn.delete(c.id);
    if (r.status === 'play') finish(r, me); else push(r);
    return true;
  }
  return true;
}
function onClose(c) {
  const wk = watching.get(c.id); if (wk) { watching.delete(c.id); const wr = rooms.get(wk); if (wr && wr.watch) wr.watch.delete(c.id); }
  const k = byConn.get(c.id); if (!k) return; byConn.delete(c.id);
  const r = rooms.get(k); if (!r) return;
  const p = r.p.find(x => x.cid === c.id); if (p) { p.ws = null; p.offAt = Date.now(); }
  push(r);
}
// uzilganlar va eski o'yinlar
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of rooms) {
    const on = r.p.some(x => x.ws);
    if (r.status === 'play') { const off = r.p.findIndex(x => !x.ws && x.offAt && now - x.offAt > 60e3); if (off >= 0) finish(r, off); }
    if (r.inline && r.status === 'wait' && r.p.length === 2 && !r.p[1].ws && r.p[1].offAt && now - r.p[1].offAt > 60e3) { r.p.pop(); clearTimeout(r.stmr); r.pinged = 0; push(r); }   // qo'shilgan raqib ilovani yopib ketdi — o'rin bo'shaydi
    if ((!on && now - r.at > ((r.inline || r.gt) ? 90 : 10) * 60e3) || now - r.at > 6 * 3600e3) { clearTimeout(r.tmr); clearTimeout(r.btmr); rooms.delete(k); }
    else if (on) r.at = Math.max(r.at, now - 9 * 60e3);
  }
}, 30e3).unref();
function newRoom(o) {
  let k = code(); while (rooms.has(k)) k = code();
  const size = SIZES[o.size] ? o.size : '4x6', tc = normTc(o.tc);
  const rom = o.theme === 'romantic', r = { code: k, size, tc, rules: { streak: false, shuffle: false, black: false }, theme: rom ? 'romantic' : 'animals', symbols: rom ? ROMANTIC : ANIMALS, p: o.p, status: 'wait', at: Date.now(), S: null };
  rooms.set(k, r); return r;
}
// guruh kartasi (inline): chaqiruvchi o'rni band
function createInline(uid, name, size, tc, theme) { const r = newRoom({ size, tc, theme, p: [{ uid: String(uid), name: String(name || 'O‘yinchi').slice(0, 20), ws: null, offAt: 0 }] }); r.inline = true; return r; }
// 💾 guruh kartasi xonalari bazada ham turadi (24 soat): server qayta yonsa yoki Telegram «tanlandi» xabarini yubormasa ham karta ishlaydi
function inl() { const d = require('./store.js').db; return d ? (d.mmInl || (d.mmInl = {})) : null; }
function remember(codeX, o) {
  const I = inl(); if (!I || !codeX) return;
  const now = Date.now();
  for (const k of Object.keys(I)) if (now - (I[k].at || 0) > 24 * 3600e3) delete I[k];
  const ks = Object.keys(I); if (ks.length > 300) ks.sort((a, b) => I[a].at - I[b].at).slice(0, ks.length - 300).forEach(k => delete I[k]);
  I[codeX] = Object.assign(I[codeX] || { at: now }, o);
  try { require('./store.js').save(); } catch (e) {}
}
function forget(codeX) { const I = inl(); if (I && I[codeX]) { delete I[codeX]; try { require('./store.js').save(); } catch (e) {} } }
function revive(codeX) {
  const I = inl(), o = I && I[codeX]; if (!o || !o.uid || Date.now() - (o.at || 0) > 24 * 3600e3) return null;
  const r = createInline(o.uid, o.name, o.size, o.tc, o.theme); rooms.delete(r.code); r.code = codeX; rooms.set(codeX, r);
  if (o.imid) { try { require('./gcard.js').mmChosen(codeX, o.imid, o.from || o.name, o.link); } catch (e) {} }
  return r;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function hostLink(r) {
  let l = ''; try { const m = require('./gcard.js').msgOf('mm:' + r.code); l = m && m.link; } catch (e) {}
  const I = inl(); if (!l && I && I[r.code]) l = I[r.code].link;
  return l || (process.env.TG_APP_LINK || 'https://t.me/DraughtsPRObot/play') + '?startapp=mm_' + r.code;
}
// do'st qo'shildi, yuboruvchi esa ilovada emas: botdan xabar + 3 daqiqa kutish, kirmasa o'rin yana bo'shaydi
function pingHost(r, name) {
  const now = Date.now(); if (r.pinged && now - r.pinged < 60e3) return; r.pinged = now;
  try { global.spLobby && global.spLobby.pushUid(r.p[0].uid, { type: 'gmJoinIn', g: 'mm', code: r.code, name: String(name || ''), gn: '🧠 Xotira' }); } catch (e) {}   // 📲 ilova ochiq bo'lsa — o'yin o'zi ochiladi
  try { require('./gcard.js').tg('sendMessage', { chat_id: r.p[0].uid, parse_mode: 'HTML', text: '🧠 <b>' + esc(name) + '</b> Xotira o‘yiningizga qo‘shildi!\nSiz kirishingiz bilan o‘yin boshlanadi ⏳ (3 daqiqa kutadi)', reply_markup: { inline_keyboard: [[{ text: '▶ O‘yinga kirish', url: hostLink(r) }]] } }); } catch (e) {}
  clearTimeout(r.stmr);
  r.stmr = setTimeout(() => {
    if (r.status !== 'wait' || r.p.length !== 2 || r.p[0].ws) return;
    const f = r.p.pop(); if (f.cid) byConn.delete(f.cid);
    send(f.ws, { type: 'mmErr', msg: 'Raqib 3 daqiqada kirmadi — keyinroq qayta urinib ko‘ring' });
    r.pinged = 0; push(r);
  }, 180e3);
}
// kubok: ikkala o'rin band, ikkalasi kirganda boshlanadi
function createPair(a, b, size, tc, theme) { return newRoom({ size, tc, theme, p: [{ uid: a.uid, name: a.name, ws: null, offAt: 0 }, { uid: b.uid, name: b.name, ws: null, offAt: 0 }] }); }
function again(r) { if (!r || r.status !== 'over' || r.p.length !== 2) return false; r.p.reverse(); r.again = {}; r.votes = {}; r.status = 'wait'; r.S = null; r.at = Date.now(); if (r.p.every(x => x.ws)) deal(r); push(r); return true; }
// 🔀 Miks turnir: ikkala o'rin band, ikkalasi kirganda boshlanadi; natija onEnd(1|2|0, info) bilan
function createTour(a, b, size, tc, onEnd, noshowMs) {
  const r = createPair(a, b, size, tc, 'animals'); r.onEnd = onEnd;
  r.nsT = setTimeout(() => {   // ⏱ 30 s: kirmagan — texnik mag'lubiyat
    if (r.reported || r.status === 'over') return;
    const j = r.p.map(x => !!x.j); if (j[0] && j[1]) return;
    r.reported = 1; clearTimeout(r.tmr); clearTimeout(r.btmr); r.status = 'over'; r.winner = j[0] ? 0 : j[1] ? 1 : -1;
    try { onEnd(j[0] ? 1 : j[1] ? 2 : 0, { why: 'noshow', plies: 0, noshow: true, noshowBoth: !j[0] && !j[1] }); } catch (e) { console.log('[mix]', e.message); }
    push(r);
  }, noshowMs || 30000);
  if (r.nsT.unref) r.nsT.unref();
  deal(r);   // 🔀 turnirda o'yin darhol boshlanadi
  return r;
}
// 🎮 mini o'yinlar markazi (mgplay.js): ikkala o'rin band; kartalar darhol tarqatiladi, soat esa ikkalasi kirganda yuradi.
// Rasmlarni har o'yinchi o'zi tanlaydi (kartada juftlik raqami). noshowMs ichida kirmagan bo'lsa — o'yin reytingsiz tugaydi.
function noShow(r, why) {
  if (r.status === 'over') return;
  const j = r.p.map(x => !!(x.j && (why !== 'left' || x.ws)));
  clearTimeout(r.tmr); clearTimeout(r.btmr); clearTimeout(r.ftmr); r.run = 0; r.hold = false;
  r.status = 'over'; r.winner = j[0] && !j[1] ? 0 : j[1] && !j[0] ? 1 : -1; r.ns = 1; r.quit = null; r.rt = null; r.gain = [0, 0];
  push(r);
}
function createMg(a, b, size, tc, noshowMs) {
  let k = code(); while (rooms.has(k)) k = code();
  const r = { code: k, size: SIZES[size] ? size : '4x6', tc: normTc(tc), rules: { streak: false, shuffle: false, black: false }, theme: '', symbols: IDX, pt: true, hold: true,
    p: [{ uid: String(a.uid), name: a.name, ws: null, offAt: 0 }, { uid: String(b.uid), name: b.name, ws: null, offAt: 0 }], status: 'wait', at: Date.now(), S: null };
  rooms.set(k, r);
  deal(r);
  r.nsT = setTimeout(() => { if (r.hold && r.status === 'play') noShow(r, 'noshow'); }, noshowMs || 30000);
  if (r.nsT.unref) r.nsT.unref();
  return r;
}
module.exports = { handle, onClose, rooms, remember, createTour, createInline, createPair, createMg, again, finish, push, SIZES, normTc };
