const fs = require('fs');
let c = fs.readFileSync('lobbyclient.js', 'utf8');
const f = 'if (kind === "t") linkTid = ""; else linkSid = "";';
if (c.includes('/*TVOPENLINK*/')) console.log('= bor edi');
else if (!c.includes(f)) console.log('✗ TOPILMADI');
else {
  c = c.replace(f, f + ' /*TVOPENLINK*/ if (kind === "t" && id) { var _tvi = 0, _tvt = setInterval(function () { if (window.tvOpen) { clearInterval(_tvt); window.tvOpen(id); } else if (++_tvi > 20) clearInterval(_tvt); }, 150); }');
  fs.writeFileSync('lobbyclient.js', c); console.log('✅ Tayyor');
}
