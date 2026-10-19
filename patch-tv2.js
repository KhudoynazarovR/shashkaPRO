const fs = require('fs');
let ok = true;
function rep(file, find, to, marker) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(marker)) { console.log('= bor edi:', marker); return; }
  if (!s.includes(find)) { console.log('✗ TOPILMADI:', file, '->', find.slice(0, 60)); ok = false; return; }
  s = s.replace(find, to); fs.writeFileSync(file, s); console.log('✓', marker);
}
// --- server: xabarga id + like ---
rep('lobby.js',
  "t0.chat.push({ uid: uid, name: c.lb.name, text: tx, at: now });",
  "t0.chat.push({ id: hex(4), uid: String(uid), name: c.lb.name, text: tx, at: now, likes: [] }); /*TVMID*/",
  '/*TVMID*/');
rep('lobby.js',
  "if (m.type === 'lbTChat') { /*TVCHAT*/",
  `if (m.type === 'lbTChatLike') { /*TVLIKE*/
      if (!t0 || !t0.chat) return true;
      const msg = t0.chat.find(x => x.id && x.id === String(m.mid || ''));
      if (!msg) return true;
      msg.likes = msg.likes || [];
      const k = msg.likes.indexOf(String(uid));
      if (k >= 0) msg.likes.splice(k, 1); else msg.likes.push(String(uid));
      push(); return true;
    }
    if (m.type === 'lbTChat') { /*TVCHAT*/`,
  '/*TVLIKE*/');
// --- klient: medal faqat tugaganda ---
rep('tview.js',
  "(M[i] || (i + 1))",
  "(t.status === 'finished' && M[i] ? M[i] : (i + 1) + '.') /*TVRANK*/",
  '/*TVRANK*/');
// --- klient: ism + like ---
rep('tview.js',
  "return '<div class=\"tvM' + (mine ? ' me' : '') + '\">' + (mine ? '' : '<b>' + esc(m.name) + '</b>') + esc(m.text) + '<small>' + hm(m.at) + '</small></div>';",
  "var lk = (m.likes || []).map(String), liked = lk.indexOf(me) >= 0; /*TVLKR*/\n" +
  "      return '<div class=\"tvM' + (mine ? ' me' : '') + '\"' + (m.id ? ' data-mid=\"' + esc(m.id) + '\"' : '') + '><b>' + (mine ? 'Siz' : esc(m.name)) + (String(m.uid) === String(t.creatorUid) ? ' 👑' : '') + '</b>' + esc(m.text) + '<small>' + (m.id ? '<span class=\"tvLk\" data-tv=\"like\" data-mid=\"' + esc(m.id) + '\">' + (liked ? '❤️' : '🤍') + (lk.length ? ' ' + lk.length : '') + '</span>' : '<span></span>') + '<span>' + hm(m.at) + '</span></small></div>';",
  '/*TVLKR*/');
rep('tview.js',
  "else if (a === 'start') send({ type: 'lbTStart', tid: curId });",
  "else if (a === 'start') send({ type: 'lbTStart', tid: curId });\n      else if (a === 'like') send({ type: 'lbTChatLike', tid: curId, mid: b.getAttribute('data-mid') }); /*TVLKC*/",
  '/*TVLKC*/');
rep('tview.js',
  "g('tvTxt').onkeydown = function(e){ if (e.key === 'Enter') sendChat(); };",
  "g('tvTxt').onkeydown = function(e){ if (e.key === 'Enter') sendChat(); };\n    P.addEventListener('dblclick', function(e){ var x = e.target.closest('.tvM[data-mid]'); if (x) send({ type: 'lbTChatLike', tid: curId, mid: x.getAttribute('data-mid') }); }); /*TVDBL*/",
  '/*TVDBL*/');
// --- like CSS ---
let tv = fs.readFileSync('tview.js', 'utf8');
if (!tv.includes('tvLikeCss')) {
  tv += "\n;(function(){ if (document.getElementById('tvLikeCss')) return; var s = document.createElement('style'); s.id = 'tvLikeCss';" +
    " s.textContent = '.tvM small{display:flex!important;justify-content:space-between;align-items:center;gap:10px;margin-top:2px}" +
    ".tvLk{cursor:pointer;font-size:13px;opacity:1;padding:2px 6px;border-radius:10px;background:rgba(255,255,255,.08);user-select:none}" +
    ".tvM.me b{color:#dbe9ff!important}'; document.head.appendChild(s); })();\n";
  fs.writeFileSync('tview.js', tv); console.log('✓ like CSS');
}
console.log(ok ? '✅ Tayyor' : '⚠️ Ba’zi joylar topilmadi, natijani yuboring');
