const fs = require('fs');
let s = fs.readFileSync('profile.js', 'utf8');
if (s.includes('pf-ring')) { console.log('Allaqachon bor'); process.exit(0); }
function rep(from, to, name) {
  const n = s.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  s = s.replace(from, () => to);
}
rep("'<div class=\"pf-hero\">' + av +", "'<div class=\"pf-hero\"><div class=\"pf-ring\">' + av + '</div>' +", 'hero');
rep("document.head.appendChild(css);", `document.head.appendChild(css);
  var rc = document.createElement('style');
  rc.textContent =
    '.pf-ring{position:relative;width:118px;height:118px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center}' +
    '.pf-ring::before,.pf-ring::after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(#f5b72b,#ff4fd8,#22c1ff,#34f5c5,#f5b72b);animation:pfSpin 3s linear infinite}' +
    '.pf-ring::after{inset:-6px;filter:blur(12px);opacity:.8;animation:pfSpin 3s linear infinite,pfGlow 1.8s ease-in-out infinite alternate}' +
    '.pf-ring .pf-av{position:relative;z-index:1;box-sizing:border-box;width:104px;height:104px;margin:0;border:4px solid #1a0b3d;box-shadow:none}' +
    '@keyframes pfSpin{to{transform:rotate(360deg)}}' +
    '@keyframes pfGlow{from{opacity:.45}to{opacity:1}}';
  document.head.appendChild(rc);`, 'css');
fs.writeFileSync('profile.js', s);
console.log('TAYYOR');
