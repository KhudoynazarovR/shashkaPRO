const fs = require('fs');
let c = fs.readFileSync('lobbyclient.js', 'utf8');
const f = 'if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; }';
if (c.includes('window.__tvLinkTid')) console.log('= bor edi: linkTid');
else if (!c.includes(f)) console.log('✗ TOPILMADI: linkTid qatori');
else { c = c.replace(f, 'if (/^lbt_/.test(curRoom)) { linkTid = curRoom.slice(4); curRoom = ""; window.__tvLinkTid = linkTid; }'); fs.writeFileSync('lobbyclient.js', c); console.log('✓ linkTid uzatildi'); }
let t = fs.readFileSync('tview.js', 'utf8');
const i = t.indexOf('if (window.__tvLink) return;');
if (i >= 0) { const j = t.lastIndexOf(';(function(){', i); t = t.slice(0, j); }
t = t.replace(/\s*$/, '\n') + fs.readFileSync('tvlink.js', 'utf8');
fs.writeFileSync('tview.js', t); console.log('✓ tvlink yangilandi');
