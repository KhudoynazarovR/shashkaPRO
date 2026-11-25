'use strict';
// clubs.js — klublar: ochiq/yopiq, so'rovlar, adminlar, rasm
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FILE = process.env.CLUBS_FILE || path.join(__dirname, 'clubs-data.json');
const MAX_CLUBS = 200, MAX_MEMBERS = 500, MAX_PER_USER = 5, MAX_PENDING = 100;
const IMG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
const clubs = new Map();
try {
  for (const c of JSON.parse(fs.readFileSync(FILE, 'utf8')))
    clubs.set(c.id, { id: c.id, name: c.name, desc: c.desc || '', reg: c.reg || '', leaderUid: c.leaderUid, leaderName: c.leaderName, created: c.created,
      open: c.open !== false, img: c.img || '', imgAt: c.imgAt || 0, pts: c.pts || 0, tw: c.tw || 0, elo: c.elo || 1000, tn: c.tn || 0, members: new Map(c.members), pending: new Map(c.pending || []), admins: new Set(c.admins || [c.leaderUid]) });
} catch (e) {}
const toRow = c => ({ ...c, members: [...c.members], pending: [...c.pending], admins: [...c.admins] });
const fromRow = c => ({ id: c.id, name: c.name, desc: c.desc || '', reg: c.reg || '', leaderUid: c.leaderUid, leaderName: c.leaderName, created: c.created,
  open: c.open !== false, img: c.img || '', imgAt: c.imgAt || 0, pts: c.pts || 0, tw: c.tw || 0, elo: c.elo || 1000, tn: c.tn || 0, members: new Map(c.members), pending: new Map(c.pending || []), admins: new Set(c.admins || [c.leaderUid]) });
let pool = null, ready = false, lastJ = '';
async function writeDb() {
  if (!pool || !ready) return;
  try {
    const j = JSON.stringify([...clubs.values()].map(toRow));
    if (j === lastJ) return;
    await pool.query("insert into kv(k, v) values('clubs', $1) on conflict (k) do update set v = excluded.v", [j]);
    lastJ = j;
  } catch (e) { console.log('Klub DB yozish xatosi:', e.message); }
}
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const U = process.env.DATABASE_URL;
  pool = new Pool({ connectionString: U, ssl: /@[^/]*\./.test(U) ? { rejectUnauthorized: false } : false, max: 2, keepAlive: true, idleTimeoutMillis: 20000, connectionTimeoutMillis: 10000 });
  pool.on('error', e => console.log('Klub DB xato:', e.message));
  (async () => {
    try {
      await pool.query('create table if not exists kv (k text primary key, v jsonb not null)');
      const r = await pool.query("select v from kv where k = 'clubs'");
      if (r.rows.length && Array.isArray(r.rows[0].v)) {
        for (const c of r.rows[0].v) clubs.set(c.id, fromRow(c));
        console.log('Klublar DB dan yuklandi:', clubs.size);
      } else console.log('Klublar DB bo‘sh, ko‘chirilmoqda:', clubs.size);
      ready = true;
      await writeDb();
    } catch (e) { console.log('Klub DB ulanish xatosi:', e.message); }
  })();
  const bye = async () => { await writeDb(); };
  process.on('SIGTERM', bye);
}
let timer = null;
function save() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    try { fs.writeFileSync(FILE, JSON.stringify([...clubs.values()].map(c => ({ ...c, members: [...c.members], pending: [...c.pending], admins: [...c.admins] })))); } catch (e) {}
    writeDb();
  }, 15000);
}
const clean = (s, n) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
const okImg = s => typeof s === 'string' && s.length < 30000 && IMG_RE.test(s);
const SYS = 'cbots';
const SYS_BOTS = [['bot_easy', 'Shogird'], ['bot_mid', 'Jangchi'], ['bot', 'Yo‘lbars'], ['bot_pro', 'Arslon'], ['bot_gm', 'Sulton'], ['bot_champ', 'Legend'], ['bot_monster', 'Monster'], ['bot_terminator', 'Terminator'], ['bot_kingkong', 'King Kong']];
const isEnvAdm = uid => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(uid));
function ensureSys() {
  let c = clubs.get(SYS);
  if (!c) { c = { id: SYS, name: '🤖 Botlar klubi', desc: 'Tizim klubi: botlar jamoasi. Faqat admin turnirga qo‘sha oladi.', leaderUid: 'sys', leaderName: 'ShashkaPRO', created: Date.now(), open: false, img: '', pts: 0, tw: 0, elo: 1000, tn: 0, members: new Map(SYS_BOTS), pending: new Map(), admins: new Set() }; clubs.set(SYS, c); }
  if (c.members.size !== SYS_BOTS.length) c.members = new Map(SYS_BOTS);
  c.open = false; if (c.pending.size) c.pending = new Map(); if (c.admins.size) c.admins = new Set();
  return c;
}
ensureSys();
function countOf(uid) { let n = 0; for (const c of clubs.values()) if (c.members.has(uid)) n++; return n; }

// 🏳️ viloyat klublari — har viloyat uchun bitta tizim klubi. Faqat o'sha viloyat o'yinchilari kira oladi.
const REG_PRE = 'reg_';
function regSlug(r) { return REG_PRE + require('./flags.js').REG[r][0].toLowerCase(); }
function ensureRegions() {
  let F; try { F = require('./flags.js'); } catch (e) { return; }
  for (const r of Object.keys(F.REG)) {
    if (r === 'Chet el') continue;
    const id = regSlug(r), had = clubs.get(id);
    if (!had) clubs.set(id, { id, name: '🏳️ ' + r, desc: r + ' viloyati jamoasi — turnirlarda viloyatingiz uchun o‘ynang.', leaderUid: 'sys', leaderName: 'ShashkaPRO',
      created: Date.now(), open: true, img: '', pts: 0, tw: 0, elo: 1000, tn: 0, members: new Map(), pending: new Map(), admins: new Set(), reg: r });
    else { had.reg = r; had.open = true; had.leaderUid = 'sys'; }
  }
}
function regOfUser(uid) { try { const b = require('./flags.js').badge(uid); return b ? b.reg : ''; } catch (e) { return ''; } }
// 🔄 viloyatini belgilagan hamma o'yinchi o'z viloyat jamoasiga avtomatik qo'shiladi
function syncRegion(uid, nameHint) {
  ensureRegions();
  const u = String(uid), r = regOfUser(u);
  let ch = false;
  for (const c of clubs.values()) {
    if (!isReg(c)) continue;
    const want = !!r && c.reg === r;
    if (want && !c.members.has(u)) { c.members.set(u, String(nameHint || nameOfUser(u) || 'O‘yinchi').slice(0, 32)); ch = true; }
    else if (!want && c.members.has(u)) { c.members.delete(u); c.admins.delete(u); ch = true; }
  }
  if (ch) save();
  return ch;
}
function nameOfUser(u) { try { const x = (require('./store.js').users() || {})[String(u)]; return x ? (x.name || x.first_name || '') : ''; } catch (e) { return ''; } }
function syncAllRegions() {   // server ishga tushganda bir marta
  try {
    const us = require('./store.js').users() || {};
    let n = 0;
    for (const id of Object.keys(us)) { if (!/^\d+$/.test(id)) continue; if (syncRegion(id, us[id].name)) n++; }
    if (n) console.log('Viloyat jamoalari yangilandi:', n, 'o‘yinchi');
  } catch (e) { console.log('Viloyat jamoalari xatosi:', e.message); }
}
setTimeout(syncAllRegions, 4000);
const isReg = c => !!c && String(c.id).indexOf(REG_PRE) === 0;
// 👑 kapitan: oddiy klubda — rahbar, viloyat klubida — adminlar tayinlagan kapitan
function capOfClub(c) {
  if (!c) return null;
  if (isReg(c)) { try { const k = require('./flags.js').capOf(c.reg); return k ? { uid: String(k.uid), name: k.name || '', at: k.at || 0 } : null; } catch (e) { return null; } }
  return { uid: String(c.leaderUid), name: c.leaderName || '', at: c.created || 0 };
}
function eloOfUser(u) { try { const x = (require('./store.js').users() || {})[String(u)]; return x ? (Number(x.elo) || 0) : 0; } catch (e) { return 0; } }
const isCap = (c, uid) => { const k = capOfClub(c); return !!k && String(k.uid) === String(uid); };
// 💬 klub chati — oxirgi 60 xabar
function chatPush(c, uid, name, text) {
  c.chat = c.chat || [];
  c.chat.push({ id: crypto.randomBytes(3).toString('hex'), uid: String(uid), name: String(name || '').slice(0, 24), text: String(text || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 300), at: Date.now() });
  if (c.chat.length > 60) c.chat = c.chat.slice(-60);
}

// ⚡ Yengil ro'yxat: har holat yuborishda hamma mijozga ketadi — rasm, a'zolar va chat bu yerda YO'Q.
// (Avval 35 klub × 30 a'zo × rasm = bitta mijozga ~500 KB edi; shuning uchun turnirda qotardi.)
function list(uid) {
  ensureSys(); ensureRegions();
  return [...clubs.values()].sort((a, b) => b.members.size - a.members.size).slice(0, 60).map(c => ({
    id: c.id, name: c.name, count: c.members.size, joined: c.members.has(uid), open: c.open,
    hasImg: !!c.img, iv: c.imgAt || 0, requested: c.pending.has(uid),
    tw: c.tw || 0, elo: c.elo || 1000, reg: c.reg || '',
    isAdmin: c.admins.has(uid) || (c.id === SYS && isEnvAdm(uid)),
    pendN: (c.admins.has(uid) || (c.id === SYS && isEnvAdm(uid))) ? c.pending.size : 0
  }));
}

// 🔍 Bitta klubning to'liq ma'lumoti — faqat ochib turgan mijozga yuboriladi
function one(uid, cid) {
  ensureSys(); ensureRegions();
  const c = clubs.get(String(cid || '')); if (!c) return null;
  const adm = c.admins.has(uid) || (c.id === SYS && isEnvAdm(uid));
  return {
    id: c.id, name: c.name, desc: c.desc, leaderUid: c.leaderUid, leaderName: c.leaderName,
    count: c.members.size, joined: c.members.has(uid), open: c.open, hasImg: !!c.img, iv: c.imgAt || 0,
    isAdmin: adm, requested: c.pending.has(uid), pts: c.pts || 0, tw: c.tw || 0, elo: c.elo || 1000, tn: c.tn || 0, reg: c.reg || '',
    cap: capOfClub(c), canEdit: isCap(c, uid) || (isReg(c) && isEnvAdm(uid)) || (!isReg(c) && String(c.leaderUid) === String(uid)),
    chat: c.members.has(uid) ? (c.chat || []).slice(-30) : [],
    pend: adm ? [...c.pending].slice(0, 50).map(([u, n]) => ({ uid: u, name: n })) : [],
    members: [...c.members].slice(0, 60).map(([u, n]) => ({ uid: u, name: n, admin: c.admins.has(u), elo: eloOfUser(u) }))
  };
}

// 🖼 klub rasmi — HTTP orqali beriladi (brauzer keshlaydi), holat yuborishda emas
function imgOf(cid) { const c = clubs.get(String(cid || '')); return c ? (c.img || '') : ''; }

function act(me, m) {
  const uid = me.uid, name = me.name;
  const c = m.cid ? clubs.get(String(m.cid)) : null;
  const sysAdm = !!(c && c.id === SYS && isEnvAdm(uid));
  const adm = (c && c.admins.has(uid)) || sysAdm;
  if (c && c.id === SYS && !(sysAdm && m.type === 'lbClubImg')) return { error: 'Botlar klubi — tizim klubi, uni o‘zgartirib bo‘lmaydi' };
  if (c && String(c.id).indexOf(REG_PRE) === 0) {   // 🏳️ viloyat klubi: faqat kirish/chiqish, rasmni admin qo'yadi
    const capOk = isCap(c, uid) || isEnvAdm(uid);
    const ok = m.type === 'lbClubJoin' || m.type === 'lbClubChat'
      || (capOk && (m.type === 'lbClubImg' || m.type === 'lbClubSet'));
    if (m.type === 'lbClubLeave') return { error: 'Viloyat jamoasidan chiqib bo‘lmaydi — profilda viloyatni o‘zgartiring' };
    if (!ok) return { error: 'Viloyat klubi — tizim klubi, uni o‘zgartirib bo‘lmaydi' };
    if (m.type === 'lbClubJoin') {
      const r = regOfUser(uid);
      if (!r) return { error: 'Avval profilda viloyatingizni tanlang' };
      if (r !== c.reg) return { error: 'Bu klubga faqat ' + c.reg + ' o‘yinchilari kira oladi' };
    }
  }
  switch (m.type) {
    case 'lbClubCreate': {
      const nm = clean(m.name, 40);
      if (nm.length < 3) return { error: 'Klub nomi kamida 3 belgi bo‘lsin' };
      if (clubs.size >= MAX_CLUBS) return { error: 'Klublar soni limitga yetdi' };
      if ([...clubs.values()].some(x => x.name.toLowerCase() === nm.toLowerCase())) return { error: 'Bunday nomli klub bor' };
      if (countOf(uid) >= MAX_PER_USER) return { error: 'Siz eng ko‘pi bilan ' + MAX_PER_USER + ' ta klubda bo‘la olasiz' };
      const id = 'c' + crypto.randomBytes(4).toString('hex');
      clubs.set(id, { id, name: nm, desc: clean(m.desc, 300), leaderUid: uid, leaderName: name, created: Date.now(),
        open: m.open !== false, img: okImg(m.img) ? m.img : '', imgAt: Date.now(), members: new Map([[uid, name]]), pending: new Map(), admins: new Set([uid]) });
      save(); return { ok: 1 };
    }
    case 'lbClubJoin': {
      if (!c) return { error: 'Klub topilmadi' };
      if (c.members.has(uid)) return { ok: 1 };
      if (c.members.size >= MAX_MEMBERS) return { error: 'Klub to‘lgan' };
      if (countOf(uid) >= MAX_PER_USER) return { error: 'Siz eng ko‘pi bilan ' + MAX_PER_USER + ' ta klubda bo‘la olasiz' };
      if (!c.open) {
        if (c.pending.size >= MAX_PENDING) return { error: 'So‘rovlar ko‘p, keyinroq urinib ko‘ring' };
        c.pending.set(uid, name); save(); return { ok: 1 };
      }
      c.members.set(uid, name); save(); return { ok: 1 };
    }
    case 'lbClubAccept': case 'lbClubReject': {
      if (!adm) return { error: 'Faqat klub adminlari' };
      const t = String(m.uid), tn = c.pending.get(t);
      if (tn === undefined) return { ok: 1 };
      c.pending.delete(t);
      if (m.type === 'lbClubAccept') {
        if (c.members.size >= MAX_MEMBERS) { save(); return { error: 'Klub to‘lgan' }; }
        if (countOf(t) >= MAX_PER_USER) { save(); return { error: 'Bu o‘yinchi klub limitiga yetgan' }; }
        c.members.set(t, tn);
      }
      save(); return { ok: 1 };
    }
    case 'lbClubLeave': {
      if (!c) return { ok: 1 };
      c.pending.delete(uid);
      if (!c.members.has(uid)) { save(); return { ok: 1 }; }
      c.members.delete(uid); c.admins.delete(uid);
      if (c.members.size === 0) clubs.delete(c.id);
      else if (c.leaderUid === uid) { const [nu, nn] = c.members.entries().next().value; c.leaderUid = nu; c.leaderName = nn; c.admins.add(nu); }
      save(); return { ok: 1 };
    }
    case 'lbClubKick': {
      if (!adm) return { error: 'Faqat klub adminlari chiqara oladi' };
      const t = String(m.uid);
      if (t === uid || t === c.leaderUid) return { ok: 1 };
      if (c.admins.has(t) && c.leaderUid !== uid) return { error: 'Adminni faqat rahbar chiqara oladi' };
      c.members.delete(t); c.admins.delete(t); save(); return { ok: 1 };
    }
    case 'lbClubAdmin': {
      if (!c || c.leaderUid !== uid) return { error: 'Faqat klub rahbari admin tayinlaydi' };
      const t = String(m.uid);
      if (!c.members.has(t) || t === c.leaderUid) return { ok: 1 };
      if (c.admins.has(t)) c.admins.delete(t); else c.admins.add(t);
      save(); return { ok: 1 };
    }
    case 'lbClubSet': {
      if (!adm && !isCap(c, uid) && !(isReg(c) && isEnvAdm(uid))) return { error: 'Faqat klub adminlari' };
      if (typeof m.desc === 'string') c.desc = clean(m.desc, 300);                       // 📝 klub haqida — kapitan yozadi
      if (typeof m.name === 'string' && !isReg(c) && String(c.leaderUid) === String(uid)) {
        const nm2 = clean(m.name, 40);
        if (nm2.length >= 3 && ![...clubs.values()].some(x => x.id !== c.id && x.name.toLowerCase() === nm2.toLowerCase())) c.name = nm2;
      }
      if (m.open != null && !isReg(c)) c.open = !!m.open;
      save(); return { ok: 1 };
    }
    case 'lbClubChat': {                                                                  // 💬 klub chati
      if (!c || !c.members.has(uid)) return { error: 'Avval klubga qo‘shiling' };
      const tx = String(m.text || '').trim();
      if (!tx) return { ok: 1 };
      chatPush(c, uid, name, tx); save(); return { ok: 1 };
    }
    case 'lbClubImg': {
      if (!adm && !isCap(c, uid) && !(isReg(c) && isEnvAdm(uid))) return { error: 'Rasmni faqat kapitan qo‘ya oladi' };
      if (!okImg(m.img)) return { error: 'Rasm noto‘g‘ri yoki juda katta' };
      c.img = m.img; c.imgAt = Date.now(); save(); return { ok: 1 };
    }
    case 'lbClubDisband': {
      if (!c || c.leaderUid !== uid) return { error: 'Faqat klub rahbari yopa oladi' };
      clubs.delete(c.id); save(); return { ok: 1 };
    }
  }
  return { ok: 1 };
}

function check(uid, raw) {
  if (!Array.isArray(raw) || !raw.length) return { ids: [] };
  const ids = [...new Set(raw.map(String))].slice(0, 6);
  ensureSys(); ensureRegions();
  for (const id of ids) if (!clubs.has(id)) return { error: 'Klub topilmadi' };
  if (ids.includes(SYS) && !isEnvAdm(uid)) return { error: 'Botlar klubini faqat admin tanlay oladi' };
  if (!ids.some(id => clubs.get(id).admins.has(uid) || (id === SYS && isEnvAdm(uid)))) return { error: 'Klub turnirini faqat klub admini ocha oladi' };
  return { ids };
}
function inAny(uid, ids) { return ids.some(id => { const c = clubs.get(id); return !!c && c.members.has(uid); }); }
function clubOfIn(uid, ids) { for (const id of ids) { const c = clubs.get(id); if (c && c.members.has(uid)) return id; } return null; }
function nameOf(id) { const c = clubs.get(id); return c ? c.name : '?'; }
function eloOf(id) { const c = clubs.get(id); return c ? (c.elo || 1000) : 1000; }

// 🏆 klub reytingi: hamma 1000 dan boshlaydi. Turnir tugagach klublar juft-juft solishtiriladi (Elo).
// rows: [{ id, avg, n }] — avg: eng yaxshi 5 a'zoning o'rtacha ochkosi, n: qatnashgan a'zo soni
function rate(rows) {
  const A = (rows || []).filter(r => clubs.get(r.id) && (r.n || 0) >= 2);   // kamida 2 a'zo chiqqan klublar
  if (A.length < 2) return [];
  const out = [];
  for (const r of A) {
    const c = clubs.get(r.id), Ra = c.elo || 1000, K = (c.tn || 0) < 5 ? 40 : 20;   // dastlabki 5 turnir — tezroq
    let d = 0;
    for (const o of A) {
      if (o.id === r.id) continue;
      const Rb = clubs.get(o.id).elo || 1000, tot = (r.avg || 0) + (o.avg || 0);
      const S = tot > 0 ? (r.avg || 0) / tot : 0.5;                      // haqiqiy natija
      const E = 1 / (1 + Math.pow(10, (Rb - Ra) / 1200));                // kutilgan natija (arenada ochko nisbati 0.4–0.6 atrofida bo'lgani uchun yumshoq shkala)
      d += K * (S - E);
    }
    out.push({ id: r.id, name: c.name, before: Ra, d: Math.max(-50, Math.min(50, Math.round(d))) });
  }
  for (const o of out) { const c = clubs.get(o.id); c.elo = Math.max(100, (c.elo || 1000) + o.d); c.tn = (c.tn || 0) + 1; o.after = c.elo; }
  save();
  return out;
}
function award(cs) {
  cs.forEach((x, i) => { const c = clubs.get(x.id); if (!c) return; c.pts = (c.pts || 0) + x.score; if (i === 0 && x.score > 0) c.tw = (c.tw || 0) + 1; });
  save();
}
module.exports = { list, one, imgOf, act, check, inAny, clubOfIn, nameOf, eloOf, award, rate, syncRegion, syncAllRegions, SYS, sysBots: () => SYS_BOTS.map(b => b[0]) };
