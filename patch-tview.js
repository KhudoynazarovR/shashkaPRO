const fs = require('fs');
let ok = true;
function patch(file, find, ins, marker, before) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(marker)) { console.log('= bor edi:', file); return; }
  const i = s.indexOf(find);
  if (i < 0) { console.log('✗ TOPILMADI:', file, '->', find); ok = false; return; }
  s = before ? s.slice(0, i) + ins + s.slice(i) : s.slice(0, i + find.length) + ins + s.slice(i + find.length);
  fs.writeFileSync(file, s); console.log('✓', file);
}
const CHAT = `
    if (m.type === 'lbTChat') { /*TVCHAT*/
      if (!t0) return true;
      const now = Date.now();
      if (now - (c.lb._tvChatAt || 0) < 800) return true;
      const tx = String(m.text || '').replace(/[\\u0000-\\u001f<>]/g, ' ').trim().slice(0, 200);
      if (!tx) return true;
      c.lb._tvChatAt = now;
      t0.chat = t0.chat || [];
      t0.chat.push({ uid: uid, name: c.lb.name, text: tx, at: now });
      if (t0.chat.length > 60) t0.chat.splice(0, t0.chat.length - 60);
      push();
      return true;
    }
`;
patch('lobby.js', 'const FEE = economy.CFG;', CHAT, '/*TVCHAT*/', false);
patch('lobby.js', 'bye: t.curBye || null', ', chat: (t.chat || []).slice(-60)', 'chat: (t.chat ||', false);
patch('lobbyclient.js', 'window.lbNav = {',
  'window.__lb = { get S() { return S; }, send: function (m) { sendMsg(m); }, go: function (id) { if (typeof go === "function") go(id); } };\n    ',
  'window.__lb =', true);
let c = fs.readFileSync('lobbyclient.js', 'utf8');
c = c.replace(/\n?\/\*TVIEW-START\*\/[\s\S]*?\/\*TVIEW-END\*\/\n?/, '');
c += '\n/*TVIEW-START*/\n' + fs.readFileSync('tview.js', 'utf8') + '\n/*TVIEW-END*/\n';
fs.writeFileSync('lobbyclient.js', c);
console.log(ok ? '✅ Tayyor' : '⚠️ Ba’zi joylar topilmadi, natijani yuboring');
