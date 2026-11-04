'use strict';
// kkbook.js — 🦍 King Kong ustaxonasi: admin o'rgatgan yurishlar (Colette, kitob va dvigateldan oldin ishlatiladi).
// Kalit: 64 ta son (−2..2) + tomon (1 / −1) — kestoai bilan bir xil. Statistika: necha marta ishlatildi, KK natijasi.
const store = require('./store.js');
const R = require('./kkrules.js');
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const isAdmin = id => ADM().includes(String(id));
const B = () => { const d = store.db; d.kkBook = d.kkBook || {}; return d.kkBook; };
const used = new Map();   // roomId -> Set(kalit) — o'yin natijasini yozish uchun
const SQ = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));
const unsq = s => { const m = /^([a-h])([1-8])$/.exec(String(s || '').trim()); return m ? (8 - +m[2]) * 8 + 'abcdefgh'.indexOf(m[1]) : -1; };
const init = () => { const b = Array(64).fill(0); for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 !== 1) continue; if (r < 3) b[i] = -1; if (r > 4) b[i] = 1; } return b; };
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// kestoai.move ichidan (faqat King Kong so'rovlari)
function get(b, side, roomId) {
  const k = b.join('') + side, x = B()[k]; if (!x) return null;
  x.used = (x.used || 0) + 1; x.last = Date.now();
  if (roomId) { if (!used.has(roomId)) used.set(roomId, new Set()); used.get(roomId).add(k); if (used.size > 500) used.delete(used.keys().next().value); }
  return x;
}
// ustaxona ko'rinishi uchun (statistikani o'zgartirmaydi)
function peek(b, side) { return B()[b.join('') + side] || null; }
// rooms.finish dan: King Kong o'yini tugadi
function result(room, winner) {
  try {
    if (!room || !room.vsBot || !room.botCfg || room.botCfg.id !== 'bot_kingkong' || room.etude) return;
    const kkCol = room.white && /^bot/.test(String(room.white.uid)) ? 'white' : 'black', r = winner === 'draw' ? 'd' : winner === kkCol ? 'w' : 'l';
    const S = used.get(room.id); if (S) { for (const k of S) { const x = B()[k]; if (x) x[r] = (x[r] || 0) + 1; } used.delete(room.id); store.save(); }
    if (r === 'l' && (room.moves || []).length >= 8) {   // adminlarga: King Kong yutqazdi
      const human = room[kkCol === 'white' ? 'black' : 'white'] || {};
      const txt = '🦍 <b>King Kong yutqazdi</b>\n👤 ' + esc(human.name || '?') + ' · ' + (room.tc || '') + ' · ' + Math.ceil(room.moves.length / 2) + ' yurish\n\nYurishlar (ustaxonada «📋 Partiyani kiritish» ga qo‘yib ko‘rish mumkin):\n<code>' + esc(notation(room.moves).slice(0, 3000)) + '</code>';
      for (const a of ADM()) tg('sendMessage', { chat_id: a, text: txt, parse_mode: 'HTML' });
    }
  } catch (e) { console.log('[kkbook]', e.message); }
}
function notation(steps) {   // xona yurishlari → "1. c3-d4 f6-g5 2. ..."
  const out = []; let b = init(), side = 1, i = 0, n = 0;
  while (i < steps.length) {
    const L = R.moves(b, side), f = steps[i].from.r * 8 + steps[i].from.c; let m = null, j = i;
    for (; j < steps.length && j < i + 12; j++) { const t = steps[j].to.r * 8 + steps[j].to.c; m = L.find(x => x.from === f && x.to === t && (x.path || [x.to]).length === j - i + 1); if (m) break; }
    if (!m) break;
    const s = [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps.length ? ':' : '-');
    out.push(side === 1 ? (++n) + '. ' + s : s);
    b = m.board; side = -side; i = j + 1;
  }
  return out.join(' ');
}
// "1. c3-d4 f6-g5 2. b2:d4:f6 ..." → to'liq yurishlar
function parse(text) {
  const toks = String(text || '').replace(/\{[^}]*\}/g, ' ').split(/\s+/).filter(t => t && !/^\d+\.+$/.test(t) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)).map(t => t.replace(/^\d+\.+/, ''));
  let b = init(), side = 1; const out = [];
  for (let n = 0; n < toks.length; n++) {
    const parts = toks[n].toLowerCase().split(/[-:x]/).map(unsq);
    if (parts.length < 2 || parts.some(x => x < 0)) return { error: (n + 1) + '-yurish tushunarsiz: «' + toks[n] + '»', out };
    const L = R.moves(b, side), f = parts[0], t = parts[parts.length - 1];
    const m = L.find(x => x.from === f && x.to === t && (parts.length === 2 || (x.path || []).join() === parts.slice(1).join())) || L.find(x => x.from === f && x.to === t);
    if (!m) return { error: (n + 1) + '-yurish noto‘g‘ri: «' + toks[n] + '»', out };
    out.push({ b: b.slice(), side, from: m.from, to: m.to }); b = m.board; side = -side;
  }
  return { out };
}
function legal(b, side, from, to) { return R.moves(b, side).find(x => x.from === from && x.to === to) || null; }
function add(b, side, from, to, by) {
  const m = legal(b, side, from, to); if (!m) return null;
  const k = b.join('') + side, old = B()[k];
  B()[k] = { f: from, t: to, at: Date.now(), by: String(by || ''), used: 0, w: 0, l: 0, d: 0, n: [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps.length ? ':' : '-'), b: b.join(','), s: side };
  if (old && old.f === from && old.t === to) Object.assign(B()[k], { used: old.used || 0, w: old.w || 0, l: old.l || 0, d: old.d || 0, at: old.at });
  return B()[k];
}
const okBoard = b => Array.isArray(b) && b.length === 64 && b.every(v => Number.isInteger(v) && v >= -2 && v <= 2);
// past navbat (o'yinlarni sekinlashtirmaydi): botlar band bo'lsa kutadi
const evl1 = (b, side, secs) => new Promise(res => { try { require('./kestoai.js').move({ board: b, side, time: secs, maxTime: secs, book: false, arena: true }, r => res(r)); } catch (e) { res(null); } });
async function evl(b, side, secs) { for (let t = 0; t < 20; t++) { const r = await evl1(b, side, secs); if (!(r && r.error === 'busy')) return r; await new Promise(z => setTimeout(z, 1500)); } return null; }
const evq = (b, side, secs) => new Promise(res => { try { require('./kestoai.js').move({ board: b, side, time: secs, maxTime: secs, book: false }, r => res(r)); } catch (e) { res(null); } });

// HTTP: /api/kkbook (faqat admin)
function handle(req, res, p, h) {
  if (!p.startsWith('/api/kkbook')) return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t || !isAdmin(t.id)) { h.send(res, 403, { error: 'Faqat admin uchun' }); return true; }
  if (req.method === 'GET') {
    const list = Object.entries(B()).map(([k, x]) => ({ k, n: x.n, b: x.b, s: x.s, at: x.at, used: x.used || 0, w: x.w || 0, l: x.l || 0, d: x.d || 0 })).sort((a, b) => b.at - a.at).slice(0, 300);
    let deep = 0; try { deep = require('./kestoai.js').mem().deep; } catch (e) {}
    h.send(res, 200, { list, total: Object.keys(B()).length, deep }); return true;
  }
  h.readBody(req, 20000, async body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const side = j.side > 0 ? 1 : -1;
    if (p === '/api/kkbook/check') {   // ⚠️ dvigatel ogohlantirishi: eng yaxshi yurish va o'rgatilayotgan yurish bahosi
      if (!okBoard(j.board) || !legal(j.board, side, +j.from, +j.to)) return h.send(res, 400, { error: 'Noto‘g‘ri yurish' });
      const best = await evq(j.board, side, 1.5), m = legal(j.board, side, +j.from, +j.to);
      const after = R.moves(m.board, -side).length ? await evq(m.board, -side, 1.5) : { ev: -3000 };
      const evBest = best && best.ev != null ? best.ev / 200 : null, evMove = after && after.ev != null ? -after.ev / 200 : null;
      return h.send(res, 200, { best: best && best.from != null ? SQ(best.from) + '-' + SQ(best.to) : null, same: !!(best && best.from === +j.from && best.to === +j.to), evBest, evMove });
    }
    if (p === '/api/kkbook/add') {
      if (!okBoard(j.board)) return h.send(res, 400, { error: 'Pozitsiya noto‘g‘ri' });
      const x = add(j.board, side, +j.from, +j.to, t.id); if (!x) return h.send(res, 400, { error: 'Noto‘g‘ri yurish' });
      store.save(); return h.send(res, 200, { ok: true, n: x.n, total: Object.keys(B()).length });
    }
    if (p === '/api/kkbook/deepclear') { let n = 0; try { n = require('./kestoai.js').clearDeep(); } catch (e) {} return h.send(res, 200, { ok: true, n }); }
    if (p === '/api/kkbook/peek') {   // 🦍 King Kong ko'rinishi: [{board, side}] → har pozitsiyada uning yurishi va manbasi
      const K = require('./kestoai.js'), mv = x => x && x.from != null ? SQ(x.from) + '-' + SQ(x.to) : null;
      const out = (Array.isArray(j.list) ? j.list : []).slice(0, 200).map(x => {
        if (!okBoard(x.board)) return null;
        const sd = x.side > 0 ? 1 : -1, o = K.peek(x.board, sd), L = R.moves(x.board, sd);
        const nm = m => { if (!m || m.from == null) return null; const z = L.find(y => y.from === m.from && y.to === m.to); return z ? [z.from].concat(z.path || [z.to]).map(SQ).join(z.caps.length ? ':' : '-') : mv(m); };
        return { src: L.length ? o.src : 'over', n: nm(o), f: o.from, t: o.to, col: nm(o.colette), adm: nm(o.admin), bk: nm(o.book), res: o.res || null, deep: o.deep || 0, forced: L.length === 1 ? 1 : 0 };
      });
      return h.send(res, 200, { list: out });
    }
    if (p === '/api/kkbook/game') {   // 🦍 doskadagi partiya: { moves:[{board,side,from,to}], go } — go yo'q bo'lsa faqat KestoG tekshiruvi
      const L = (Array.isArray(j.moves) ? j.moves : []).slice(0, 80).filter(x => okBoard(x.board) && legal(x.board, x.side > 0 ? 1 : -1, +x.from, +x.to));
      if (!L.length) return h.send(res, 400, { error: 'O‘rgatiladigan yurish yo‘q' });
      if (j.go) {
        let n = 0; const skip = new Set((j.skip || []).map(Number));
        L.forEach((x, i) => { if (!skip.has(i) && add(x.board, x.side > 0 ? 1 : -1, +x.from, +x.to, t.id)) n++; });
        if (n) store.save();
        return h.send(res, 200, { ok: true, added: n, total: Object.keys(B()).length });
      }
      const bad = [];
      for (let i = 0; i < L.length; i++) {
        const x = L[i], sd = x.side > 0 ? 1 : -1, ms = R.moves(x.board, sd); if (ms.length < 2) continue;   // majburiy yurish — tekshirmaymiz
        const best = await evl(x.board, sd, 0.5); if (!best || best.from == null || (best.from === +x.from && best.to === +x.to)) continue;
        const m = legal(x.board, sd, +x.from, +x.to), after = R.moves(m.board, -sd).length ? await evl(m.board, -sd, 0.5) : { ev: -3000 };
        const eb = best.ev != null ? best.ev / 200 : null, em = after && after.ev != null ? -after.ev / 200 : null;
        if (eb != null && em != null && eb - em > 0.5) bad.push({ i, n: [m.from].concat(m.path || [m.to]).map(SQ).join(m.caps.length ? ':' : '-'), best: SQ(best.from) + '-' + SQ(best.to), evBest: eb, evMove: em });
      }
      return h.send(res, 200, { ok: true, n: L.length, bad });
    }
    if (p === '/api/kkbook/del') { delete B()[String(j.k)]; store.save(); return h.send(res, 200, { ok: true }); }
    if (p === '/api/kkbook/pdn') {
      const r = parse(j.text); let n = 0;
      for (const x of r.out) if (j.sides === 'both' || (j.sides === 'b' ? x.side === -1 : x.side === 1)) { if (add(x.b, x.side, x.from, x.to, t.id)) n++; }
      if (n) store.save();
      return h.send(res, r.error && !n ? 400 : 200, { ok: !!n, added: n, moves: r.out.length, error: r.error || null, total: Object.keys(B()).length });
    }
    h.send(res, 404, { error: 'none' });
  });
  return true;
}
module.exports = { peek, get, result, handle, parse, notation, isAdmin };
