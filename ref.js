'use strict';
// ref.js — 👥 do'st taklif qilish (doimiy) va 🤖 botni guruhga admin qilish bonusi.
// Bosqichlar: do'st odam bilan 3 o'yin → taklif qilganga +100; 10 o'yin → taklif qilganga +200 va do'stga +200.
// Taklif qilgan odamning o'zi bilan o'ynalgan o'yinlar hisoblanmaydi (o'zaro "dehqonchilik" bo'lmasin).
// Faol do'stlar: 5 → 🏅 Elchi, 10 → 7 kun Premium, 25 → 30 kun Premium. Oylik TOP-3 (faol do'st soni): 1000 / 500 / 250 🪙.
const store = require('./store.js');
const G1 = 3, G2 = 10, P1 = 100, P2 = 200, P2F = 200, MAX_REF = 50;
const TIERS = [{ n: 5, name: '🏅 Elchi' }, { n: 10, name: '👑 7 kun Premium', days: 7 }, { n: 25, name: '👑 30 kun Premium', days: 30 }];
const PRIZES = [1000, 500, 250];
const GRP_MAX = 1000;
const users = () => store.users();
const nm = u => String((u && u.name) || 'O‘yinchi').slice(0, 20);
function tg(method, params) { try { return require('./gcard.js').tg(method, params); } catch (e) { return Promise.resolve(null); } }
const dm = (uid, text) => /^\d+$/.test(String(uid)) && tg('sendMessage', { _cat: 'ach', chat_id: String(uid), text });
const add = (uid, n, why) => require('./economy.js').add(uid, n, why);
const month = (t) => new Date((t || Date.now()) + 5 * 3600e3).toISOString().slice(0, 7);   // Toshkent vaqti

// ---------- oylik hisob
function mon() {
  const db = store.db, m = month();
  if (!db.refMon) db.refMon = { m, c: {} };
  if (db.refMon.m !== m) {   // oy almashdi — o'tgan oy g'oliblari
    const top = Object.entries(db.refMon.c).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    db.refLast = { m: db.refMon.m, top: top.map(([uid, n], i) => ({ uid, name: nm(users()[uid]), n, prize: PRIZES[i] })) };
    top.forEach(([uid, n], i) => { add(uid, PRIZES[i], 'ref-month'); dm(uid, '🏆 Siz o‘tgan oyda eng ko‘p do‘st taklif qilganlar orasida ' + (i + 1) + '-o‘rinni oldingiz (' + n + ' ta faol do‘st): +' + PRIZES[i] + ' 🪙'); });
    db.refMon = { m, c: {} }; store.save();
  }
  return db.refMon;
}
setInterval(() => { try { mon(); } catch (e) {} }, 3600e3).unref();

function premium(u, days) { u.premiumUntil = Math.max(Date.now(), u.premiumUntil || 0) + days * 86400e3; }
function tiers(inv, invId) {
  const a = inv.refAct || 0; inv.refTier = inv.refTier || 0;
  while (inv.refTier < TIERS.length && a >= TIERS[inv.refTier].n) {
    const t = TIERS[inv.refTier++];
    if (t.days) premium(inv, t.days);
    dm(invId, '🎖 ' + a + ' ta faol do‘st! Mukofot: ' + t.name);
  }
}

// ---------- do'st havola orqali kirdi
function join(uid, ref) {
  const us = users(), rid = String(ref || '').replace(/^ref_/, '').replace(/[^0-9]/g, '');
  const u = us[String(uid)], inv = us[rid];
  if (!u || !inv || rid === String(uid) || u.refBy) return null;
  if (Date.now() - (u.created || 0) > 3600000) return null;   // faqat yangi o'yinchi
  if ((inv.refCount || 0) >= MAX_REF) return null;
  u.refBy = rid; u.refG = 0; u.refSt = 0; inv.refCount = (inv.refCount || 0) + 1; store.save();
  dm(rid, '👋 Do‘stingiz ' + nm(u) + ' qo‘shildi!\nU odamlar bilan ' + G1 + ' ta o‘yin o‘ynasa +' + P1 + ' 🪙, ' + G2 + ' ta o‘ynasa yana +' + P2 + ' 🪙 olasiz.');
  dm(uid, '🎁 Siz do‘stingiz ' + nm(inv) + ' taklifi bilan keldingiz. Odamlar bilan ' + G2 + ' ta o‘yin o‘ynasangiz +' + P2F + ' 🪙 sovg‘a!');
  return { inviter: rid, name: nm(u) };
}

// ---------- odam bilan o'yin tugadi (stats.record dan)
function onGame(a, b) {
  for (const [x, opp] of [[a, b], [b, a]]) {
    const u = users()[String(x)]; if (!u || !u.refBy || u.refSt == null || u.refSt >= 2 || String(opp) === u.refBy) continue;
    const inv = users()[u.refBy]; if (!inv) continue;
    u.refG = (u.refG || 0) + 1;
    if (u.refG >= G1 && !(u.refSt >= 1)) {
      u.refSt = 1; add(u.refBy, P1, 'ref-3');
      dm(u.refBy, '🎉 Do‘stingiz ' + nm(u) + ' ' + G1 + ' ta o‘yin o‘ynadi: +' + P1 + ' 🪙');
    }
    if (u.refG >= G2 && u.refSt < 2) {
      u.refSt = 2; add(u.refBy, P2, 'ref-10'); add(x, P2F, 'ref-friend');
      inv.refAct = (inv.refAct || 0) + 1;
      const M = mon(); M.c[u.refBy] = (M.c[u.refBy] || 0) + 1;
      dm(u.refBy, '🎉 Do‘stingiz ' + nm(u) + ' ' + G2 + ' ta o‘yin o‘ynadi: +' + P2 + ' 🪙\nFaol do‘stlaringiz: ' + inv.refAct);
      dm(x, '🎁 ' + G2 + ' ta o‘yin o‘ynadingiz — taklif sovg‘asi: +' + P2F + ' 🪙');
      tiers(inv, u.refBy);
    }
  }
  store.save();
}

// ---------- 🤖 botni guruhga admin qilish: har a'zo uchun 1 🪙 (1000 gacha), har guruh uchun bir marta
async function onGroupAdmin(m) {
  const ch = m.chat || {}, from = m.from || {}, uid = String(from.id || '');
  if (ch.type !== 'group' && ch.type !== 'supergroup') return;
  const st = (m.new_chat_member || {}).status;
  if (st !== 'administrator') return;
  const db = store.db, R = db.grpRew = db.grpRew || {}, cid = String(ch.id);
  if (R[cid]) return;
  const u = users()[uid];
  if (!u) { dm(uid, '🤖 Botni guruhga admin qilganingiz uchun bonus olish uchun avval @DraughtsPRObot ilovasini oching, so‘ng botning admin huquqini olib, qayta bering.'); return; }
  const r = await tg('getChatMemberCount', { chat_id: ch.id });
  const cnt = r && r.ok ? r.result : 0;
  const n = Math.min(GRP_MAX, Math.max(0, cnt - 1));   // botning o'zi hisoblanmaydi
  R[cid] = { uid, n, at: Date.now(), title: String(ch.title || '').slice(0, 60) };
  if (n > 0) add(uid, n, 'group-admin');
  store.save();
  dm(uid, n > 0 ? '🎉 Botni «' + R[cid].title + '» guruhiga admin qildingiz: ' + n + ' a‘zo → +' + n + ' 🪙' : '🤖 Bot «' + R[cid].title + '» guruhiga admin bo‘ldi. Bonus a‘zolar soniga qarab beriladi — bu guruhda a‘zo topilmadi.');
}

// ---------- GET /api/ref
function handle(req, res, p, h) {
  if (p !== '/api/ref') return false;
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const me = String(t.id), us = users(), u = us[me] || {}, M = mon();
  const list = Object.entries(us).filter(([, x]) => x.refBy === me).map(([id, x]) => ({ name: nm(x), g: Math.min(G2, x.refG || 0), st: x.refSt || 0, at: x.created || 0 })).sort((a, b) => b.at - a.at).slice(0, 60);
  const top = Object.entries(M.c).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => ({ name: nm(us[id]), n, me: id === me }));
  const grp = Object.values(store.db.grpRew || {}).filter(x => x.uid === me).map(x => ({ title: x.title, n: x.n }));
  h.send(res, 200, {
    joined: u.refCount || 0, active: u.refAct || 0, list, tiers: TIERS.map(x => ({ n: x.n, name: x.name })),
    rules: { g1: G1, g2: G2, p1: P1, p2: P2, p2f: P2F, max: MAX_REF, grpMax: GRP_MAX },
    month: { m: M.m, top, mine: M.c[me] || 0, prizes: PRIZES }, last: store.db.refLast || null, grp
  });
  return true;
}

const elchi = u => (u && u.refAct || 0) >= TIERS[0].n;
module.exports = { join, onGame, onGroupAdmin, handle, elchi };
