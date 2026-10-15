const fs = require('fs');
let P = fs.readFileSync('puzimg.js', 'utf8');
if (P.includes('edeonL')) { console.log('Allaqachon bor'); process.exit(0); }
const reps = [
  ['<linearGradient id="fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8672a"/><stop offset="1" stop-color="#6e3a12"/></linearGradient>',
   '<linearGradient id="fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eeb272"/><stop offset="1" stop-color="#e9a868"/></linearGradient>'],
  ['<linearGradient id="dk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a3517"/><stop offset="1" stop-color="#6e2610"/></linearGradient>',
   '<linearGradient id="dk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b2f13"/><stop offset=".5" stop-color="#702a10"/><stop offset="1" stop-color="#7d3114"/></linearGradient>'],
  ['<linearGradient id="lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c995"/><stop offset="1" stop-color="#ecb078"/></linearGradient>',
   '<linearGradient id="lt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3bb86"/><stop offset=".5" stop-color="#f6c493"/><stop offset="1" stop-color="#eaa874"/></linearGradient>'],
  ['<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9b9b9"/>',
   '<stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#f0f0f0"/><stop offset="1" stop-color="#bdbdbd"/>'],
  ['<stop offset="0" stop-color="#8a8a8a"/><stop offset="1" stop-color="#0d0d0d"/>',
   '<stop offset="0" stop-color="#8a8a8a"/><stop offset=".35" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0b0b0b"/>'],
  ["'#8f8f8f' : '#000'", "'#9a9a9a' : '#000'"],
  ["fill=\"#f3d9b5\" font-family=\"sans-serif\">' + f", "fill=\"#6b3a14\" font-family=\"sans-serif\">' + f"],
  ["fill=\"#f3d9b5\" font-family=\"sans-serif\">' + n", "fill=\"#6b3a14\" font-family=\"sans-serif\">' + n"],
  ["s += '<rect width=\"' + W + '\" height=\"' + W + '\" fill=\"url(#fr)\"/>';",
   "s += '<rect width=\"' + W + '\" height=\"' + W + '\" fill=\"url(#fr)\"/>'; /* edeonL */ s += '<rect x=\"' + (M - 2) + '\" y=\"' + (M - 2) + '\" width=\"' + (S * 8 + 4) + '\" height=\"' + (S * 8 + 4) + '\" fill=\"none\" stroke=\"#8a4a1c\" stroke-width=\"3\"/>';"]
];
for (const [a, b] of reps) {
  const n = P.split(a).length - 1;
  if (n !== 1) { console.log('XATO: topilmadi -> ' + a.slice(0, 50) + ' (' + n + ')'); process.exit(1); }
  P = P.replace(a, () => b);
}
fs.writeFileSync('puzimg.js', P);
console.log('TAYYOR');
