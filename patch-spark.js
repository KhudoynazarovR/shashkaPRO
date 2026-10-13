const fs = require('fs');
let s = fs.readFileSync('profile.js', 'utf8');
if (s.includes('pf-sp')) { console.log('Allaqachon bor'); process.exit(0); }
function rep(from, to, name) {
  const n = s.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  s = s.replace(from, () => to);
}
rep("<div class=\"pf-ring\">' + av + '</div>'", "<div class=\"pf-ring\">' + av + sparks() + '</div>'", 'ring');
rep("document.head.appendChild(rc);", `document.head.appendChild(rc);
  var cols = ['#fff', '#fcd34d', '#ff9de2', '#8be9ff', '#b9ffd9'];
  function sparks() {
    var h = '';
    for (var i = 0; i < 12; i++) {
      var ang = i * 30, d = 72 + (i % 3) * 14, sz = 4 + (i % 3) * 2, dur = 2.4 + (i % 4) * 0.6, del = (i * 0.37).toFixed(2);
      h += '<i class="pf-sp" style="--a:' + ang + 'deg;--d:' + d + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + cols[i % 5] + ';box-shadow:0 0 8px 2px ' + cols[i % 5] + ';animation-duration:' + dur + 's;animation-delay:-' + del + 's"></i>';
    }
    return h;
  }
  var sc = document.createElement('style');
  sc.textContent =
    '.pf-sp{position:absolute;left:50%;top:50%;margin:-3px 0 0 -3px;border-radius:50%;z-index:2;pointer-events:none;' +
    'transform:rotate(var(--a)) translateX(var(--d));animation-name:pfTw;animation-iteration-count:infinite;animation-timing-function:ease-in-out}' +
    '@keyframes pfTw{0%{opacity:0;transform:rotate(var(--a)) translateX(calc(var(--d) - 10px)) scale(.3)}' +
    '50%{opacity:1;transform:rotate(calc(var(--a) + 40deg)) translateX(var(--d)) scale(1)}' +
    '100%{opacity:0;transform:rotate(calc(var(--a) + 80deg)) translateX(calc(var(--d) + 12px)) scale(.3)}}';
  document.head.appendChild(sc);`, 'css');
fs.writeFileSync('profile.js', s);
console.log('TAYYOR');
