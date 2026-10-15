const fs = require('fs');
let H = fs.readFileSync('index.html', 'utf8');
let P = fs.readFileSync('puzimg.js', 'utf8');
if (H.includes('edeonPc')) { console.log('Allaqachon bor'); process.exit(0); }

const css = "#board[data-th=edeon] .pc::before{display:none!important}"
 + "#board[data-th=edeon] .pc.w{background:radial-gradient(circle,#f6f6f6 0 30%,#c4c4c4 32% 36%,#fdfdfd 38% 60%,#b0b0b0 62% 67%,#ececec 69% 100%)!important;border:2px solid #8c8c8c!important;box-shadow:0 2px 3px #0008!important}"
 + "#board[data-th=edeon] .pc.b{background:radial-gradient(circle,#3a3a3a 0 28%,#9a9a9a 30% 35%,#4a4a4a 37% 58%,#a8a8a8 60% 65%,#1c1c1c 67% 100%)!important;border:2px solid #0a0a0a!important;box-shadow:0 2px 3px #000a!important}";
const tag = '<script>(function(){var s=document.createElement("style");s.id="edeonPc";s.textContent=' + JSON.stringify(css) + ';document.head.appendChild(s)})();</script>\n';
const n = H.split('</body>').length - 1;
if (n !== 1) { console.log('XATO: </body> ' + n + ' marta'); process.exit(1); }
H = H.replace('</body>', () => tag + '</body>');

const from = "r=\"21\" fill=\"none\" stroke=\"' + (w ? '#d0d0d0' : '#3a3a3a') + '\" stroke-width=\"1.5\"/>';";
const m = P.split(from).length - 1;
if (m !== 1) { console.log('XATO: puzimg ' + m + ' marta'); process.exit(1); }
const to = "r=\"23\" fill=\"none\" stroke=\"' + (w ? '#c4c4c4' : '#9a9a9a') + '\" stroke-width=\"3\"/>'; s += '<circle cx=\"' + cx + '\" cy=\"' + cy + '\" r=\"13\" fill=\"none\" stroke=\"' + (w ? '#b4b4b4' : '#8a8a8a') + '\" stroke-width=\"2.5\"/>';";
P = P.replace(from, () => to);

fs.writeFileSync('index.html', H);
fs.writeFileSync('puzimg.js', P);
console.log('TAYYOR');
