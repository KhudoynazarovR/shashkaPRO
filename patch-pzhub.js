// Masalalar bosh ekrani (5 karta) ni menu.js ga ulaydi. Ishga tushirish: node patch-pzhub.js
const fs = require('fs');
const file = process.argv[2] || 'menu.js';
let s = fs.readFileSync(file, 'utf8');
if (s.includes('hubView()')) { console.log('Allaqachon qo\'llangan'); process.exit(0); }
function rep(re, to, name) {
  const m = s.match(new RegExp(re.source, 'g'));
  const n = m ? m.length : 0;
  if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  s = s.replace(re, to);
}
// 1) open(): har safar bosh ekrandan boshlash
rep(/function open\(\) \{(\s*)var old = document\.getElementById\('spPz'\);/,
  (m, w) => "function open() {" + w + "hub = !pending; view = '';" + w + "var old = document.getElementById('spPz');", 'open');
// 2) o'zgaruvchilar va hubView()
rep(/var curLv = 0, curFo = '', edLv = 0, edFolder = '';/,
  (m) => m + `
  var hub = 0, view = '';
  function hubSoon(n) { var t = '🚧 ' + n + ' tez orada qo‘shiladi!'; if (tg && tg.showAlert) tg.showAlert(t); else alert(t); }
  function dailyPz() { var L = S.list || []; if (!L.length) return null; return L[Math.floor((Date.now() + 18e6) / 864e5) % L.length]; }
  function hubView() {
    var go = function () {
      var dp = dailyPz();
      window.pzHub({
        ov: ov, coins: (S.coins != null ? S.coins : (S.bal != null ? S.bal : null)),
        dailyDone: !!(dp && (S.solved || []).indexOf(dp.id) >= 0),
        back: close, soon: hubSoon,
        daily: function () { var p = dailyPz(); if (!p) { hubSoon('Masalalar'); return; } hub = 0; view = ''; play(p); },
        custom: function () { hub = 0; view = 'custom'; list(); },
        solve: function () { hub = 0; view = ''; list(); }
      });
    };
    if (window.pzHub) go();
    else { var sc = document.createElement('script'); sc.src = '/pzhub.js?v=1'; sc.onload = go; sc.onerror = function () { hub = 0; list(); }; document.head.appendChild(sc); }
  }`, 'vars');
// 3) list(): bosh ekran
rep(/function list\(\) \{(\s*)if \(window\.__pzPF\)/,
  (m, w) => "function list() {" + w + "if (hub && !curLv && !curFo && !window.__pzPF) return hubView();" + w + "if (window.__pzPF)", 'list');
// 4) xarita faqat "yechish" rejimida, sarlavha
rep(/head\('🧩 Masalalar', topBtns\(\)\);(\s*)h \+= pzMap\(\);/,
  (m, w) => "head(view === 'custom' ? '🎨 Maxsus masalalar' : '🧩 Masalalar', topBtns());" + w + "if (view !== 'custom') h += pzMap();", 'map');
// 5) xaritadan orqaga -> bosh ekran
rep(/on\('#pzBack', close\);(\s*)on\('#pzTop', pzTop\);/,
  (m, w) => "on('#pzBack', function () { hub = 1; view = ''; list(); });" + w + "on('#pzTop', pzTop);", 'back');
fs.copyFileSync(file, file + '.before-pzhub');
fs.writeFileSync(file, s);
console.log('TAYYOR');
