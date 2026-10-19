const fs = require('fs');
let s = fs.readFileSync('lobby.js', 'utf8'), ok = true;
function rep(find, to, marker) {
  if (s.includes(marker)) { console.log('= bor edi:', marker); return; }
  if (!s.includes(find)) { console.log('✗ TOPILMADI:', find); ok = false; return; }
  s = s.replace(find, to); console.log('✓', marker);
}
rep("if (t.status !== 'reg' && t.status !== 'finished') return false;",
    "if (t.status !== 'reg' && t.status !== 'finished' && !(t.type === 'arena' && t.status === 'running')) return false; /*TSAVE1*/",
    '/*TSAVE1*/');
rep("fs.renameSync(T_FILE + '.tmp', T_FILE);",
    "fs.renameSync(T_FILE + '.tmp', T_FILE); /*TSAVE2*/\n      if (tReady) { try { const _st = require('./store'), _s = JSON.stringify(arr, _rep); if (_st.db.tSave !== _s) { _st.db.tSave = _s; _st.save(); } } catch (e) { console.log('[turnir] bazaga saqlash xato:', e.message); } }",
    '/*TSAVE2*/');
rep("console.log('[turnir] yuklandi:', tournaments.size);",
`console.log('[turnir] yuklandi:', tournaments.size); /*TSAVE3*/
  var tReady = false;
  function tFix() {
    const now = Date.now();
    for (const t of tournaments.values()) if (t.type === 'arena' && t.status === 'running') {
      t.cur = []; for (const p of t.players.values()) { p.busy = false; p.waitingSince = now; }
    }
  }
  tFix();
  function tLoad(n) {
    try {
      const st = require('./store');
      if (st.db && typeof st.db.tSave === 'string') {
        if (!tournaments.size) {
          for (const t of JSON.parse(st.db.tSave, _rev)) tournaments.set(t.id, t);
          tFix(); console.log('[turnir] bazadan tiklandi:', tournaments.size);
        }
        tReady = true; try { push(); } catch (e) {} return;
      }
      if (st.db && st.db.users && Object.keys(st.db.users).length) { tReady = true; return; }
    } catch (e) { console.log('[turnir] bazadan o‘qish xato:', e.message); }
    if (n > 30) { tReady = true; return; }
    setTimeout(() => tLoad(n + 1), 2000);
  }
  setTimeout(() => tLoad(0), 1500);`,
    '/*TSAVE3*/');
fs.writeFileSync('lobby.js', s);
console.log(ok ? '✅ Tayyor' : '⚠️ Ba’zi joylar topilmadi, natijani yuboring');
