'use strict';
// endgame.js — 🎓 Endshpil maktabi: endshpil bazasi (≤5 dona) bilan tekshirilgan mashqlar.
// Har mashq King Kongga qarshi yechiladi (etyud tizimi orqali): yutuq/durang boy berilsa — darhol "yechilmadi". Birinchi yechish +15 🪙.
const fs = require('fs'), path = require('path');
let CATS = null, BY = null;
function load() {
  if (CATS) return CATS;
  try { CATS = JSON.parse(fs.readFileSync(path.join(__dirname, 'endgame.json'), 'utf8')); } catch (e) { CATS = []; }
  BY = new Map();
  CATS.forEach(c => c.list.forEach((x, i) => BY.set(x.id, { id: x.id, b: x.b, g: c.goal === 'draw' ? 'd' : 'w', title: '🎓 ' + c.title + ' · ' + (i + 1) })));
  return CATS;
}
function get(id) { load(); return BY.get(String(id)) || null; }
function handle(req, res, p, h) {
  if (p !== '/api/endgame') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const u = require('./store.js').users()[String(t.id)] || {}, done = new Set((u.et && u.et.s) || []);
  h.send(res, 200, { cats: load().map(c => ({ id: c.id, title: c.title, goal: c.goal, list: c.list.map(x => ({ id: x.id, b: x.b, ok: done.has(x.id) })) })) });
  return true;
}
module.exports = { get, handle, load };
