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
    clubs.set(c.id, { id: c.id, name: c.name, desc: c.desc || '', leaderUid: c.leaderUid, leaderName: c.leaderName, created: c.created,
      open: c.open !== false, img: c.img || '', pts: c.pts || 0, tw: c.tw || 0, members: new Map(c.members), pending: new Map(c.pending || []), admins: new Set(c.admins || [c.leaderUid]) });
} catch (e) {}
const toRow = c => ({ ...c, members: [...c.members], pending: [...c.pending], admins: [...c.admins] });
const fromRow = c => ({ id: c.id, name: c.name, desc: c.desc || '', leaderUid: c.leaderUid, leaderName: c.leaderName, created: c.created,
  open: c.open !== false, img: c.img || '', pts: c.pts || 0, tw: c.tw || 0, members: new Map(c.members), pending: new Map(c.pending || []), admins: new Set(c.admins || [c.leaderUid]) });
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
  pool = new Pool({ connectionString: U, ssl: /@[^/]*\./.test(U) ? { rejectUnauthorized: false } : false, max: 2 });
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
function countOf(uid) { let n = 0; for (const c of clubs.values()) if (c.members.has(uid)) n++; return n; }

function list(uid) {
  return [...clubs.values()].sort((a, b) => b.members.size - a.members.size).slice(0, 60).map(c => {
    const adm = c.admins.has(uid);
    return {
      id: c.id, name: c.name, desc: c.desc, leaderUid: c.leaderUid, leaderName: c.leaderName,
      count: c.members.size, joined: c.members.has(uid), open: c.open, img: c.img,
      isAdmin: adm, requested: c.pending.has(uid), pts: c.pts || 0, tw: c.tw || 0,
      pend: adm ? [...c.pending].slice(0, 50).map(([u, n]) => ({ uid: u, name: n })) : [],
      members: [...c.members].slice(0, 30).map(([u, n]) => ({ uid: u, name: n, admin: c.admins.has(u) }))
    };
  });
}

function act(me, m) {
  const uid = me.uid, name = me.name;
  const c = m.cid ? clubs.get(String(m.cid)) : null;
  const adm = c && c.admins.has(uid);
  switch (m.type) {
    case 'lbClubCreate': {
      const nm = clean(m.name, 40);
      if (nm.length < 3) return { error: 'Klub nomi kamida 3 belgi bo‘lsin' };
      if (clubs.size >= MAX_CLUBS) return { error: 'Klublar soni limitga yetdi' };
      if ([...clubs.values()].some(x => x.name.toLowerCase() === nm.toLowerCase())) return { error: 'Bunday nomli klub bor' };
      if (countOf(uid) >= MAX_PER_USER) return { error: 'Siz eng ko‘pi bilan ' + MAX_PER_USER + ' ta klubda bo‘la olasiz' };
      const id = 'c' + crypto.randomBytes(4).toString('hex');
      clubs.set(id, { id, name: nm, desc: clean(m.desc, 300), leaderUid: uid, leaderName: name, created: Date.now(),
        open: m.open !== false, img: okImg(m.img) ? m.img : '', members: new Map([[uid, name]]), pending: new Map(), admins: new Set([uid]) });
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
      if (!adm) return { error: 'Faqat klub adminlari' };
      c.open = !!m.open; save(); return { ok: 1 };
    }
    case 'lbClubImg': {
      if (!adm) return { error: 'Rasmni faqat admin qo‘ya oladi' };
      if (!okImg(m.img)) return { error: 'Rasm noto‘g‘ri yoki juda katta' };
      c.img = m.img; save(); return { ok: 1 };
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
  for (const id of ids) if (!clubs.has(id)) return { error: 'Klub topilmadi' };
  if (!ids.some(id => clubs.get(id).admins.has(uid))) return { error: 'Klub turnirini faqat klub admini ocha oladi' };
  return { ids };
}
function inAny(uid, ids) { return ids.some(id => { const c = clubs.get(id); return !!c && c.members.has(uid); }); }
function clubOfIn(uid, ids) { for (const id of ids) { const c = clubs.get(id); if (c && c.members.has(uid)) return id; } return null; }
function nameOf(id) { const c = clubs.get(id); return c ? c.name : '?'; }
function award(cs) {
  cs.forEach((x, i) => { const c = clubs.get(x.id); if (!c) return; c.pts = (c.pts || 0) + x.score; if (i === 0 && x.score > 0) c.tw = (c.tw || 0) + 1; });
  save();
}
module.exports = { list, act, check, inAny, clubOfIn, nameOf, award };
