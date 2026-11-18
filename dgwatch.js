'use strict';
// dgwatch.js — 🐉 «Dragon bilan kuzatish» (tomoshabin tahlili) kimga ochiq: admin boshqaradi.
// store.db.dgw = { all: true|false, on: {uid:1}, off: {uid:1} } — «hammaga» holati va alohida odamlar (istisnolar).
// Adminlar uchun doim ochiq.
const store = require('./store');
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const isAdmin = id => ADM().includes(String(id));
function cfg() { const d = store.db.dgw || (store.db.dgw = { all: true, on: {}, off: {} }); d.on = d.on || {}; d.off = d.off || {}; if (d.all === undefined) d.all = true; return d; }
function allowed(uid) {
  uid = String(uid || ''); if (!uid) return false;
  if (isAdmin(uid)) return true;
  const d = cfg();
  return d.all ? !d.off[uid] : !!d.on[uid];
}
function setUser(uid, on) {
  const d = cfg(); uid = String(uid);
  delete d.on[uid]; delete d.off[uid];
  if (d.all && !on) d.off[uid] = 1;   // hammaga ochiq — bu odamga yopiq
  if (!d.all && on) d.on[uid] = 1;    // hammaga yopiq — bu odamga ochiq
  store.save();
}
function setAll(on) { const d = cfg(); d.all = !!on; d.on = {}; d.off = {}; store.save(); }   // hammaga yoqish / hammadan o'chirish — alohida sozlamalar ham tozalanadi
function view() {
  const d = cfg(), us = store.users(), ids = Object.keys(d.all ? d.off : d.on);
  return { all: d.all, list: ids.slice(0, 200).map(id => ({ id, name: (us[id] && us[id].name) || id, on: allowed(id) })) };
}
// HTTP: GET /api/dgw — holat va istisnolar ro'yxati; POST /api/dgw {act:'all'|'none'|'user', uid, on}
function handle(req, res, p, h) {
  if (p !== '/api/dgw') return false;
  const tgU = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tgU) { h.send(res, 401, { error: 'auth' }); return true; }
  if (!isAdmin(tgU.id)) { h.send(res, 403, { error: 'Faqat adminlar uchun' }); return true; }
  if (req.method === 'GET') { h.send(res, 200, view()); return true; }
  if (req.method !== 'POST') { h.send(res, 405, { error: 'method' }); return true; }
  h.readBody(req, 2000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    if (j.act === 'all' || j.act === 'none') { setAll(j.act === 'all'); return h.send(res, 200, Object.assign({ ok: true }, view())); }
    if (j.act === 'user') {
      const to = String(j.uid || '');
      if (!store.users()[to]) return h.send(res, 404, { error: 'Foydalanuvchi topilmadi' });
      setUser(to, !!j.on);
      return h.send(res, 200, Object.assign({ ok: true, on: allowed(to), adm: isAdmin(to) }, view()));
    }
    h.send(res, 400, { error: 'act' });
  });
  return true;
}
module.exports = { allowed, isAdmin, setUser, setAll, view, handle };
