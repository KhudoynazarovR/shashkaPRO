const fs = require('fs');
let L = fs.readFileSync('lobby.js', 'utf8'), C = fs.readFileSync('clubs.js', 'utf8');
let bad = 0;
function rep(src, anchor, add, where) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) { console.log('ANCHOR XATO (' + n + '): ' + anchor.slice(0, 60)); bad++; return src; }
  return src.replace(anchor, () => where === 'before' ? add + anchor : anchor + add);
}

// ---- clubs.js ----
C = rep(C, "open: c.open !== false, img: c.img || '',", " pts: c.pts || 0, tw: c.tw || 0,", 'after');
C = rep(C, "isAdmin: adm, requested: c.pending.has(uid),", " pts: c.pts || 0, tw: c.tw || 0,", 'after');
C = rep(C, "module.exports = { list, act };", `
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
module.exports = { list, act, check, inAny, clubOfIn, nameOf, award };`, 'replace');
C = C.replace("module.exports = { list, act };", () => "");

// ---- lobby.js ----
L = rep(L, "function pubT(t) {", `function clubStandings(t) {
    if (!t.clubIds || !t.clubIds.length) return [];
    const st = t.type === 'arena' ? arenaStandings(t) : standings(t);
    const by = new Map(t.clubIds.map(id => [id, []]));
    for (const p of st) { const cid = clubsApi.clubOfIn(p.uid, t.clubIds); if (cid) by.get(cid).push(+p.score || 0); }
    return [...by].map(([id, a]) => {
      a.sort((x, y) => y - x);
      return { id, name: clubsApi.nameOf(id), players: a.length, score: Math.round(a.slice(0, 5).reduce((s, x) => s + x, 0) * 10) / 10 };
    }).sort((a, b) => b.score - a.score);
  }

  `, 'before');
L = rep(L, "creatorUid: t.creatorUid, creatorName: t.creatorName,", " clubIds: t.clubIds || [], clubs: clubStandings(t),", 'after');
L = rep(L, "const top = st[0] ? st[0].name : '-';", `
    if (t.clubIds && t.clubIds.length) { const cs = clubStandings(t); if (cs.length > 1) { clubsApi.award(cs); if (cs[0]) for (const p of t.players.values()) toast(p.uid, '🏅 Klublar hisobida g‘olib: ' + cs[0].name + ' (' + cs[0].score + ')'); } }`, 'after');
L = rep(L, "case 'lbTCreate': {", `
        const cl = clubsApi.check(me.uid, m.clubIds); if (cl.error) return err(c, cl.error), true;`, 'after');
L = rep(L, "tournaments.set(at.id, at);", "at.clubIds = cl.ids; ", 'before');
L = rep(L, "tournaments.set(t.id, t);", "t.clubIds = cl.ids; ", 'before');
L = rep(L, "case 'lbTJoin': {", `
        { const tt = tournaments.get(String(m.tid)); if (tt && tt.clubIds && tt.clubIds.length && !clubsApi.inAny(me.uid, tt.clubIds)) return err(c, 'Bu turnir faqat klub a‘zolari uchun'), true; }`, 'after');

if (bad) { console.log('YOZILMADI, xato bor'); process.exit(1); }
fs.writeFileSync('clubs.js', C); fs.writeFileSync('lobby.js', L);
console.log('PATCH_OK');
