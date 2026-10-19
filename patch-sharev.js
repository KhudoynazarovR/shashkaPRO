const fs = require('fs');
let s = fs.readFileSync('lobby.js', 'utf8');
const find = "return base ? base.replace(/\\/$/, '') + '/share.jpg' : '';";
if (s.includes('/*SHAREV*/')) console.log('= bor edi');
else if (!s.includes(find)) console.log('✗ TOPILMADI');
else {
  s = s.replace(find, "let v = ''; try { v = '?v=' + Math.floor(require('fs').statSync(require('path').join(__dirname, 'public', 'share.jpg')).mtimeMs); } catch (e) {} return base ? base.replace(/\\/$/, '') + '/share.jpg' + v : ''; /*SHAREV*/");
  fs.writeFileSync('lobby.js', s); console.log('✅ Tayyor');
}
