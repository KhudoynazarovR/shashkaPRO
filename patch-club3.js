const fs = require('fs');
let t = fs.readFileSync('tview.js', 'utf8');
function cut(m){
  const i = t.indexOf('if (window.' + m + ') return;'); if (i < 0) return console.log('= yo‘q:', m);
  const a = t.lastIndexOf(';(function(){', i), b = t.indexOf('\n})();', i);
  if (a < 0 || b < 0) return console.log('✗ chegarasi topilmadi:', m);
  t = t.slice(0, a) + t.slice(b + 6); console.log('✓ olib tashlandi:', m);
}
cut('__tvClubBtn'); cut('__tvClubFix2'); cut('__tvNoRef');
if (!t.includes('__tvClub3')) t = t.replace(/\s*$/, '\n') + `;(function(){
  if (window.__tvClub3) return; window.__tvClub3 = 1;
  var s = document.createElement('style');
  s.textContent = '#lbClubBn{display:none!important}' +
    '#tvClub3{position:fixed;z-index:2147480000;display:none;align-items:center;justify-content:center;border:0;border-radius:14px;background:#3f3c39;color:#fff;font-size:22px;box-shadow:0 3px 0 #1f1d1b;padding:0;min-height:0;margin:0}' +
    '#tvClub3.on{background:#81b64c;box-shadow:0 4px 0 #45753c}';
  document.body.appendChild(s);
  var b = document.createElement('button'); b.id = 'tvClub3'; b.type = 'button'; b.textContent = '👥'; b.title = 'Klublar';
  document.body.appendChild(b);
  function ref(){
    var bar = document.getElementById('lbTbar'); if (!bar) return null;
    var bs = bar.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (bs[i].textContent.indexOf('🔄') >= 0) return bs[i];
    return null;
  }
  function place(){
    var r = ref(), p = document.getElementById('lbPanel'), tv = document.getElementById('tvP');
    var ok = !!(r && p && p.style.display !== 'none' && p.classList.contains('lbTMode') && !(tv && tv.classList.contains('on')));
    if (ok) {
      if (r.style.display === 'none') r.style.display = '';
      if (r.style.visibility !== 'hidden') r.style.visibility = 'hidden';
      var q = r.getBoundingClientRect(); ok = q.width > 0 && q.height > 0;
      if (ok) { b.style.left = q.left + 'px'; b.style.top = q.top + 'px'; b.style.width = q.width + 'px'; b.style.height = q.height + 'px'; }
    }
    b.style.display = ok ? 'flex' : 'none';
    b.classList.toggle('on', !!window.__lbCO);
  }
  b.onclick = function(){
    window.__lbCO = !window.__lbCO;
    if (window.lbClubFix) window.lbClubFix();
    place();
    if (window.__lbCO) setTimeout(function(){
      var all = document.querySelectorAll('.lbcl');
      for (var i = 0; i < all.length; i++) if (all[i].offsetParent) { all[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
    }, 120);
  };
  setInterval(place, 150);
  window.addEventListener('scroll', place, true);
})();
`;
fs.writeFileSync('tview.js', t); console.log('✅ Tayyor');
