'use strict';
// region.js — 🗺 Viloyatlar jangi: o'yinchi viloyatini tanlaydi, odamlar bilan o'yinlardan ochko yig'iladi.
// G'alaba +3, durang +1 (o'z viloyati hisobiga). Oy oxirida: g'olib viloyatning ≥10 ochko yig'gan o'yinchilariga 300 🪙,
// har bir viloyatning eng faol o'yinchisiga (viloyat qahramoni) — g'olib viloyatda 7 kunlik 👑 Premium.
const store = require('./store.js');
const REGIONS = ['Toshkent', 'Andijon', 'Farg‘ona', 'Namangan', 'Samarqand', 'Buxoro', 'Navoiy', 'Qashqadaryo', 'Surxondaryo', 'Jizzax', 'Sirdaryo', 'Xorazm', 'Qoraqalpog‘iston', 'Chet el'];
const WIN = 3, DRAW = 1, MIN_PTS = 10, REWARD = 300, CHANGE_DAYS = 30;
const users = () => store.users();
const month = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 7);
const MN = ['', 'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
const dm = (uid, text) => /^\d+$/.test(String(uid)) && tg('sendMessage', { _cat: 'ach', chat_id: String(uid), text, parse_mode: 'HTML' });

function mon() {
  const db = store.db, m = month();
  if (!db.regMon) db.regMon = { m, pts: {}, ppl: {} };
  if (db.regMon.m !== m) settle(db.regMon, m);
  return db.regMon;
}
function settle(R, m) {   // o'tgan oy natijasi
  const db = store.db, rank = Object.entries(R.pts).sort((a, b) => b[1] - a[1]);
  const win = rank[0] && rank[0][1] > 0 ? rank[0][0] : null;
  const heroes = {};
  for (const [uid, x] of Object.entries(R.ppl)) if (!heroes[x.r] || x.p > heroes[x.r].p) heroes[x.r] = { uid, p: x.p };
  db.regLast = { m: R.m, top: rank.slice(0, 5).map(([r, p]) => ({ r, p })), win, hero: win && heroes[win] ? { uid: heroes[win].uid, name: (users()[heroes[win].uid] || {}).name || '', p: heroes[win].p } : null };
  db.regMon = { m, pts: {}, ppl: {} }; store.save();
  if (!win) return;
  const mm = MN[+R.m.slice(5, 7)] || R.m;
  let k = 0;
  for (const [uid, x] of Object.entries(R.ppl)) {
    if (x.r !== win || x.p < MIN_PTS) continue;
    try { require('./economy.js').add(uid, REWARD, 'region_win'); } catch (e) {}
    setTimeout(() => dm(uid, '🗺 <b>' + win + ' ' + mm + ' oyidagi Viloyatlar jangida g‘olib bo‘ldi!</b>\n\nSiz ' + x.p + ' ochko bilan hissa qo‘shdingiz: <b>+' + REWARD + ' 🪙</b> 🎉'), (k++) * 120);
  }
  const h = heroes[win];
  if (h) { try { const u = users()[h.uid]; if (u) require('./premium.js').grant(u, 7, 'region_hero'); } catch (e) {} setTimeout(() => dm(h.uid, '🦸 <b>Siz ' + win + 'ning qahramonisiz!</b>\nOy davomida eng ko‘p ochko (' + h.p + ') yig‘dingiz: <b>+7 kunlik 👑 Premium</b>'), (k++) * 120); }
}
setInterval(() => { try { mon(); } catch (e) {} }, 3600e3).unref();

// stats.record dan: odam bilan o'yin tugadi (sw: oq uchun 1 / 0.5 / 0)
function onGame(a, b, sw) {
  const R = mon(), us = users();
  for (const [id, s] of [[a, sw], [b, 1 - sw]]) {
    const u = us[String(id)]; if (!u || !u.region) continue;
    const p = s === 1 ? WIN : s === 0.5 ? DRAW : 0; if (!p) continue;
    R.pts[u.region] = (R.pts[u.region] || 0) + p;
    const x = R.ppl[String(id)] = R.ppl[String(id)] || { r: u.region, p: 0 };
    if (x.r !== u.region) { x.r = u.region; x.p = 0; }
    x.p += p;
  }
}

function view(uid) {
  const R = mon(), u = users()[String(uid)] || {}, me = R.ppl[String(uid)];
  const heroes = {};
  for (const [id, x] of Object.entries(R.ppl)) if (!heroes[x.r] || x.p > heroes[x.r].p) heroes[x.r] = { name: (users()[id] || {}).name || '', p: x.p };
  const L = store.db.regLast;
  return {
    regions: REGIONS, my: u.region || '', myPts: me && me.r === u.region ? me.p : 0, m: R.m,
    canChange: !u.regionAt || Date.now() - u.regionAt > CHANGE_DAYS * 86400e3,
    table: REGIONS.filter(r => r !== 'Chet el' || R.pts[r]).map(r => ({ r, p: R.pts[r] || 0, hero: heroes[r] || null, n: Object.values(R.ppl).filter(x => x.r === r).length })).sort((a, b) => b.p - a.p),
    last: L ? { m: L.m, win: L.win, hero: L.hero, top: L.top } : null,
    rules: { win: WIN, draw: DRAW, min: MIN_PTS, reward: REWARD, days: CHANGE_DAYS }
  };
}

function handle(req, res, p, h) {
  if (p !== '/api/region') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(t.id);
  if (req.method === 'GET') { h.send(res, 200, view(uid)); return true; }
  h.readBody(req, 1000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const u = store.getOrCreate(t), r = String(j.r || '');
    if (!REGIONS.includes(r)) return h.send(res, 400, { error: 'Viloyatni tanlang' });
    if (u.region === r) return h.send(res, 200, view(uid));
    if (u.region && u.regionAt && Date.now() - u.regionAt < CHANGE_DAYS * 86400e3) return h.send(res, 400, { error: 'Viloyatni ' + CHANGE_DAYS + ' kunda bir marta o‘zgartirish mumkin' });
    u.region = r; u.regionAt = Date.now(); store.save();
    h.send(res, 200, view(uid));
  });
  return true;
}
module.exports = { REGIONS, onGame, handle, view };
