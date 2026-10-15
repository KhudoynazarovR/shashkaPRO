const fs = require('fs');
const reps = [
[`var cur = mv.length;`,
`var cur = mv.length, auto = null, spd = 1, flip = false;
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    function startAuto() {
      stopAuto();
      if (cur >= mv.length) cur = 0;
      auto = setInterval(function () {
        if (!document.body.contains(ov)) { stopAuto(); return; }
        if (cur < mv.length) { cur++; draw(); } else { stopAuto(); draw(); }
      }, 1500 / spd);
    }`],
[`var b = bs[cur], m = cur > 0 ? mv[cur - 1] : null, h = '', r, c, p, bg, hl;`,
`var b = bs[cur], m = cur > 0 ? mv[cur - 1] : null, h = '', r, c, p, bg, hl;
      if (flip) { b = b.slice().reverse().map(function (x) { return x.slice().reverse(); }); if (m) m = { from: { r: 7 - m.from.r, c: 7 - m.from.c }, to: { r: 7 - m.to.r, c: 7 - m.to.c } }; }`],
[`<div style="margin:10px 0;font-size:15px">Yurish: '`,
 `<div id="anL" style="margin:10px 0;font-size:15px">Yurish: '`],
[`<button id="an3" style="' + bst + '">⏭</button></div>';`,
`<button id="an3" style="' + bst + '">⏭</button></div>';
      h += '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button id="anP" style="' + bst + '">' + (auto ? '⏸ To‘xta' : '▶️ Avto') + '</button><button id="anS" style="' + bst + '">' + spd + '×</button><button id="anF" style="' + bst + '">🔄</button></div>';
      h += '<input id="anR" type="range" min="0" max="' + mv.length + '" value="' + cur + '" style="width:min(86vw,420px);margin-top:14px">';`],
[`ov.querySelector('#anX').onclick = function () { ov.remove(); };`,
 `ov.querySelector('#anX').onclick = function () { stopAuto(); ov.remove(); };`],
[`ov.querySelector('#an3').onclick = function () { cur = mv.length; draw(); };`,
`ov.querySelector('#an3').onclick = function () { cur = mv.length; draw(); };
      ov.querySelector('#anP').onclick = function () { if (auto) stopAuto(); else startAuto(); draw(); };
      ov.querySelector('#anS').onclick = function () { spd = spd % 3 + 1; if (auto) startAuto(); draw(); };
      ov.querySelector('#anF').onclick = function () { flip = !flip; draw(); };
      var rg = ov.querySelector('#anR');
      rg.oninput = function () { var l = ov.querySelector('#anL'); if (l) l.textContent = 'Yurish: ' + rg.value + ' / ' + mv.length; };
      rg.onchange = function () { cur = Number(rg.value); draw(); };`]
];
let done = 0;
for (const f of ['menu.js', 'roomclient.js', 'analysis.js']) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('id="anP"')) { console.log('Allaqachon bor: ' + f); continue; }
  let ok = true;
  for (const [a] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('O‘TKAZILDI: ' + f + ' -> ' + a.slice(0, 45) + ' (' + n + ')'); ok = false; break; }
  }
  if (!ok) continue;
  for (const [a, b] of reps) s = s.replace(a, () => b);
  fs.writeFileSync(f, s);
  console.log('TAYYOR: ' + f);
  done++;
}
if (!done) process.exit(1);
