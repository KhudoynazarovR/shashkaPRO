const fs = require('fs');
let H = fs.readFileSync('index.html', 'utf8');
if (H.includes('edeonPc2')) { console.log('Allaqachon bor'); process.exit(0); }
const css = "html body #board[data-th=edeon] .sq .pc::before{display:none!important}"
 + "html body #board[data-th=edeon] .sq .pc::after{text-shadow:none}"
 + "html body #board[data-th=edeon] .sq .pc.w{background:radial-gradient(circle,#f6f6f6 0 30%,#c4c4c4 32% 36%,#fdfdfd 38% 60%,#b0b0b0 62% 67%,#ececec 69% 100%)!important;border:2px solid #8c8c8c!important;box-shadow:0 2px 3px #0008!important}"
 + "html body #board[data-th=edeon] .sq .pc.b{background:radial-gradient(circle,#3a3a3a 0 28%,#9a9a9a 30% 35%,#4a4a4a 37% 58%,#a8a8a8 60% 65%,#1c1c1c 67% 100%)!important;border:2px solid #0a0a0a!important;box-shadow:0 2px 3px #000a!important}";
const tag = '<script>(function(){var s=document.createElement("style");s.id="edeonPc2";s.textContent=' + JSON.stringify(css) + ';document.head.appendChild(s)})();</script>\n';
const n = H.split('</body>').length - 1;
if (n !== 1) { console.log('XATO: </body> ' + n + ' marta'); process.exit(1); }
H = H.replace('</body>', () => tag + '</body>');
fs.writeFileSync('index.html', H);
console.log('TAYYOR');
