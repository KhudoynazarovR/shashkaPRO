const fs = require('fs');
let t = fs.readFileSync('tview.js', 'utf8');
function cut(m){
  const i = t.indexOf('if (window.' + m + ') return;'); if (i < 0) return console.log('= yo‘q:', m);
  const a = t.lastIndexOf(';(function(){', i), b = t.indexOf('\n})();', i);
  if (a < 0 || b < 0) return console.log('✗ chegarasi topilmadi:', m);
  t = t.slice(0, a) + t.slice(b + 6); console.log('✓ eski blok olib tashlandi:', m);
}
cut('__tvLink'); cut('__tvRoomGuard');
t = t.replace(/\s*$/, '\n') + `;(function(){
  if (window.__tvLink) return; window.__tvLink = 1;
  var st = document.createElement('style'); st.id = 'tvLinkCss';
  st.textContent = '#tvP{z-index:2147483000!important}#tvRem{z-index:2147483100!important}';
  document.head.appendChild(st);
  function inRoom(){ return !!document.getElementById('lbBack'); }
  var sp = window.__tvLinkTid ? 'lbt_' + window.__tvLinkTid : '';
  try { if (!sp) sp = (Telegram.WebApp.initDataUnsafe || {}).start_param || ''; } catch(e){}
  try { if (!sp) sp = new URLSearchParams(Telegram.WebApp.initData || '').get('start_param') || ''; } catch(e){}
  if (!/^lbt_/.test(sp)) return;
  var tid = sp.slice(4), key = 'tvLinkDone_' + tid;
  try { if (sessionStorage.getItem(key)) return; } catch(e){}
  function findT(){ try { var s = window.__lb && window.__lb.S; if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === tid) return s.tournaments[i]; } catch(e){} return null; }
  var fromLink = false, n = 0;
  var iv = setInterval(function(){
    n++;
    if (inRoom()) { clearInterval(iv); try { sessionStorage.setItem(key, '1'); } catch(e){} return; }
    if (n < 3) return;
    if (findT() && window.tvOpen) {
      clearInterval(iv);
      try { sessionStorage.setItem(key, '1'); } catch(e){}
      fromLink = true; window.tvOpen(tid);
      var p = document.getElementById('tvP');
      if (p) new MutationObserver(function(){
        if (fromLink && !p.classList.contains('on')) { fromLink = false; if (!inRoom() && window.lbNav) window.lbNav.open('t'); }
      }).observe(p, { attributes: true, attributeFilter: ['class'] });
    } else if (n > 60) clearInterval(iv);
  }, 500);
})();
;(function(){
  if (window.__tvRoomGuard) return; window.__tvRoomGuard = 1;
  setInterval(function(){
    if (!document.getElementById('lbBack')) return;
    var p = document.getElementById('tvP');
    if (p && p.classList.contains('on') && window.tvClose) window.tvClose();
    var r = document.getElementById('tvRem'); if (r) r.classList.remove('on');
  }, 300);
})();
`;
fs.writeFileSync('tview.js', t); console.log('✅ Tayyor');
