'use strict';
// clubs.js — klublar: yaratish, qo'shilish, chiqish, chiqarish, yopish
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FILE = process.env.CLUBS_FILE || path.join(__dirname, 'clubs-data.json');
const MAX_CLUBS = 200, MAX_MEMBERS = 500, MAX_PER_USER = 5;
const clubs = new Map();
try {
  for (const c of JSON.parse(fs.readFileSync(FILE, 'utf8')))
    clubs.set(c.id, { id: c.id, name: c.name, desc: c.desc || '', leaderUid: c.leaderUid, leaderName: c.leaderName, created: c.created, members: new Map(c.members) });
} catch (e) {}
let timer = null;
function save() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    try { fs.writeFileSync(FILE, JSON.stringify([...clubs.values()].map(c => ({ ...c, members: [...c.members] })))); } catch (e) {}
  }, 500);
}
const clean = (s, n) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
function countOf(uid) { let n = 0; for (const c of clubs.values()) if (c.members.has(uid)) n++; return n; }

function list(uid) {
  return [...clubs.values()].sort((a, b) => b.members.size - a.members.size).slice(0, 60).map(c => ({
    id: c.id, name: c.name, desc: c.desc, leaderUid: c.leaderUid, leaderName: c.leaderName,
    count: c.members.size, joined: c.members.has(uid),
    members: [...c.members].slice(0, 30).map(([u, n]) => ({ uid: u, name: n }))
  }));
}

function act(me, m) {
  const uid = me.uid, name = me.name;
  const c = m.cid ? clubs.get(String(m.cid)) : null;
  switch (m.type) {
    case 'lbClubCreate': {
      const nm = clean(m.name, 30);
      if (nm.length < 3) return { error: 'Klub nomi kamida 3 belgi bo‘lsin' };
      if (clubs.size >= MAX_CLUBS) return { error: 'Klublar soni limitga yetdi' };
      if ([...clubs.values()].some(x => x.name.toLowerCase() === nm.toLowerCase())) return { error: 'Bunday nomli klub bor' };
      if (countOf(uid) >= MAX_PER_USER) return { error: 'Siz eng ko‘pi bilan ' + MAX_PER_USER + ' ta klubda bo‘la olasiz' };
      const id = 'c' + crypto.randomBytes(4).toString('hex');
      clubs.set(id, { id, name: nm, desc: clean(m.desc, 200), leaderUid: uid, leaderName: name, created: Date.now(), members: new Map([[uid, name]]) });
      save(); return { ok: 1 };
    }
    case 'lbClubJoin': {
      if (!c) return { error: 'Klub topilmadi' };
      if (c.members.has(uid)) return { ok: 1 };
      if (c.members.size >= MAX_MEMBERS) return { error: 'Klub to‘lgan' };
      if (countOf(uid) >= MAX_PER_USER) return { error: 'Siz eng ko‘pi bilan ' + MAX_PER_USER + ' ta klubda bo‘la olasiz' };
      c.members.set(uid, name); save(); return { ok: 1 };
    }
    case 'lbClubLeave': {
      if (!c || !c.members.has(uid)) return { ok: 1 };
      c.members.delete(uid);
      if (c.members.size === 0) clubs.delete(c.id);
      else if (c.leaderUid === uid) { const [nu, nn] = c.members.entries().next().value; c.leaderUid = nu; c.leaderName = nn; }
      save(); return { ok: 1 };
    }
    case 'lbClubKick': {
      if (!c || c.leaderUid !== uid) return { error: 'Faqat klub rahbari chiqara oladi' };
      const t = String(m.uid);
      if (t === uid) return { ok: 1 };
      c.members.delete(t); save(); return { ok: 1 };
    }
    case 'lbClubDisband': {
      if (!c || c.leaderUid !== uid) return { error: 'Faqat klub rahbari yopa oladi' };
      clubs.delete(c.id); save(); return { ok: 1 };
    }
  }
  return { ok: 1 };
}
module.exports = { list, act };
