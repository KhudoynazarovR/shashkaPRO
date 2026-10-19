// patch-rsave.js — ketayotgan partiyalarni bazaga saqlash va server qayta ishga tushganda tiklash
const fs = require('fs');
let ok = true;
function rep(file, find, to, marker) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(marker)) { console.log('= bor edi:', marker); return; }
  if (!s.includes(find)) { console.log('✗ TOPILMADI:', file, '->', find.slice(0, 70)); ok = false; return; }
  s = s.replace(find, to); fs.writeFileSync(file, s); console.log('✓', marker);
}

// ---------- rooms.js ----------
rep('rooms.js',
  'room = newRoom(roomId, DEFAULT_TC); room.casual = true;',
  'room = newRoom(roomId, DEFAULT_TC); room.casual = true; if (!rRestored) room._tmp = true; /*RTMP*/',
  '/*RTMP*/');

rep('rooms.js',
  '  return { handle, onClose, rooms, results, create, forfeit, get: id => rooms.get(id) };',
  `  // ---------- /*RSAVE*/ partiyalarni saqlash / tiklash ----------
  const _rrep = (k, v) => v instanceof Map ? { __map: [...v] } : v instanceof Set ? { __set: [...v] } : v;
  const _rrev = (k, v) => v && v.__map ? new Map(v.__map) : v && v.__set ? new Set(v.__set) : v;
  var rRestored = false, rReady = false, rSig = '';
  function rSnap() {
    const arr = [];
    for (const r of rooms.values()) {
      if (r.finished || !r.white || !r.black || r.vsBot || r._tmp) continue;
      const o = Object.assign({}, r);
      o.members = []; o.names = []; delete o.nextTimer;
      o.white = Object.assign({}, r.white, { clientId: null });
      o.black = Object.assign({}, r.black, { clientId: null });
      o.clock = currentClock(r);
      arr.push(o);
    }
    return arr;
  }
  function saveRooms(force) {
    if (!rReady) return;
    try {
      const arr = rSnap();
      const sig = JSON.stringify(arr.map(o => [o.id, o.moves.length, o.turn, o.berserk, o.drawOffer]));
      if (!force && sig === rSig) return;
      rSig = sig;
      const st = require('./store'), s = JSON.stringify(arr, _rrep);
      if (st.db.rSave !== s) { st.db.rSave = s; st.save(); }
    } catch (e) { console.log('[xona] saqlash xato:', e.message); }
  }
  function restore() {
    if (rRestored) return true;
    try {
      const st = require('./store');
      if (!st.db) return false;
      if (typeof st.db.rSave === 'string') {
        const arr = JSON.parse(st.db.rSave, _rrev), now = Date.now();
        let n = 0;
        for (const o of arr) {
          const ex = rooms.get(o.id);
          if (ex && !ex._tmp) continue;
          o.members = new Set(); o.names = new Map();
          o.turnStartedAt = now; o.lastActive = now; o.nextTimer = null; o.drawOffer = null;
          if (ex) {
            o.members = ex.members; o.names = ex.names;
            for (const k of ['white', 'black']) for (const s2 of [ex.white, ex.black]) if (s2 && o[k] && String(s2.uid) === String(o[k].uid)) o[k].clientId = s2.clientId;
          }
          rooms.set(o.id, o); n++;
          if (ex) pushState(o);
        }
        console.log('[xona] tiklandi:', n);
        rRestored = true; rReady = true; return true;
      }
      if (st.db.users && Object.keys(st.db.users).length) { rRestored = true; rReady = true; return true; }
    } catch (e) { console.log('[xona] tiklash xato:', e.message); }
    return false;
  }
  (function tr(n) { if (restore() || n > 30) { rRestored = true; rReady = true; return; } setTimeout(() => tr(n + 1), 1500); })(0);
  setInterval(() => saveRooms(false), 3000).unref();
  process.once('SIGTERM', () => {
    console.log('[xona] SIGTERM: partiyalar saqlanmoqda');
    saveRooms(true);
    setTimeout(() => process.exit(0), 3000);
  });

  return { handle, onClose, rooms, results, create, forfeit, restore, get: id => rooms.get(id) };`,
  '/*RSAVE*/');

// ---------- lobby.js ----------
(function () {
  let s = fs.readFileSync('lobby.js', 'utf8');
  if (s.includes('/*TFIX2*/')) return console.log('= bor edi: /*TFIX2*/');
  const a = s.indexOf('  function tFix() {'), b = s.indexOf('\n  tFix();', a);
  if (a < 0 || b < 0) { console.log('✗ TOPILMADI: lobby.js tFix'); ok = false; return; }
  const nf = `  function tFix() { /*TFIX2*/
    const now = Date.now();
    try { if (roomsApi.restore) roomsApi.restore(); } catch (e) {}
    for (const t of tournaments.values()) if (t.type === 'arena' && t.status === 'running') {
      t.cur = (t.cur || []).filter(b => { const r = roomsApi.get(b.roomId); return r && !r.finished; });
      const busy = new Set();
      for (const b of t.cur) { roomToBoard.set(b.roomId, { t, b }); busy.add(b.white); busy.add(b.black); }
      for (const p of t.players.values()) { p.busy = busy.has(p.uid); if (!p.busy) p.waitingSince = now; }
    }
  }
  setTimeout(tFix, 0);`;
  s = s.slice(0, a) + nf + s.slice(b + '\n  tFix();'.length);
  fs.writeFileSync('lobby.js', s); console.log('✓ /*TFIX2*/');
})();

console.log(ok ? '✅ Tayyor' : '⚠️ Ba’zi joylar topilmadi, natijani yuboring');
