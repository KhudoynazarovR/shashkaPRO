const fs = require('fs');
const rd = f => fs.readFileSync(f, 'utf8');
let bad = 0;
function rep(src, a, add, w) {
  const n = src.split(a).length - 1;
  if (n !== 1) { console.log('ANCHOR XATO (' + n + '): ' + a.slice(0, 70)); bad++; return src; }
  return src.replace(a, () => w === 'before' ? add + a : w === 'after' ? a + add : add);
}
let ST = rd('store.js'), L = rd('lobby.js'), U = rd('lobbyclient.js'), R = rd('roomclient.js'), A = rd('aiview.js');
ST = rep(ST, 'diamonds: 100, premiumUntil: 0', 'diamonds: 500, premiumUntil: 0', 'replace');
ST = rep(ST, 'module.exports = { getOrCreate,', 'module.exports = { db, getOrCreate,', 'replace');
L = rep(L, 'function pubT(t) {', `function promoInfo() {
    const st = require('./store');
    if (!st.db.promoEnd) { st.db.promoEnd = Date.now() + 10 * 86400000; st.save(); }
    return { end: st.db.promoEnd, on: Date.now() < st.db.promoEnd };
  }
  `, 'before');
L = rep(L, 'tournaments: [...tournaments.values()].map(pubT),', ' promo: promoInfo(),', 'after');
L = rep(L, "case 'lbFriendNew': {", `case 'lbRef': {
        if (!c.lb || !c.lb.tg) break;
        const st = require('./store'), us = st.users();
        const rid = String(m.ref || '').replace(/^ref_/, '').replace(/[^0-9]/g, '');
        const u = us[String(me.uid)], inv = us[rid];
        if (!u || !inv || rid === String(me.uid) || u.refBy || !promoInfo().on) break;
        if (Date.now() - (u.created || 0) > 3600000) break;
        if ((inv.refCount || 0) >= 50) break;
        u.refBy = rid; inv.refCount = (inv.refCount || 0) + 1; st.save();
        economy.add(rid, 200, 'referral');
        toast(rid, '🎉 Do‘stingiz ' + u.name + ' qo‘shildi: +200 💎');
        push();
        break;
      }
      `, 'before');
U = rep(U, 'tg.initDataUnsafe.start_param) curRoom', 'tg.initDataUnsafe.start_param && !/^ref_/.test(tg.initDataUnsafe.start_param)) curRoom', 'replace');
U = rep(U, 'window.lbFriend = function', rd('promo-ui.part'), 'before');
R = rep(R, 'tg.initDataUnsafe.start_param) roomId', 'tg.initDataUnsafe.start_param && !/^ref_/.test(tg.initDataUnsafe.start_param)) roomId', 'replace');
A = rep(A, '/^lb[tsf]_/', '/^(lb[tsf]|ref)_/', 'replace');
if (bad) { console.log('YOZILMADI'); process.exit(1); }
fs.writeFileSync('store.js', ST); fs.writeFileSync('lobby.js', L); fs.writeFileSync('lobbyclient.js', U);
fs.writeFileSync('roomclient.js', R); fs.writeFileSync('aiview.js', A);
console.log('PATCH_OK');
