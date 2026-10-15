const fs = require('fs');
const reps = [
  // 1) yo'naltiruvchi chiziqlar paint() oxirida (faqat ekrandagi kichik canvas uchun)
  ["cx.drawImage(im, sz / 2 - dw / 2 + t.x * sz, sz / 2 - dh / 2 + t.y * sz, dw, dh); cx.restore();",
   "cx.drawImage(im, sz / 2 - dw / 2 + t.x * sz, sz / 2 - dh / 2 + t.y * sz, dw, dh); cx.restore();\n    if (cv.getAttribute('data-c')) { cx.save(); cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(sz / 2, 0); cx.lineTo(sz / 2, sz); cx.moveTo(0, sz / 2); cx.lineTo(sz, sz / 2); cx.stroke(); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2 - 3, 0, 6.2832); cx.strokeStyle = 'rgba(80,220,160,.7)'; cx.stroke(); cx.restore(); }"],
  // 2) 🎯 tugmasi
  ["[['in', '＋'], ['out', '－'], ['rs', '↺'], ['cl', '🧽']]", "[['in', '＋'], ['out', '－'], ['rs', '↺'], ['ct', '🎯'], ['cl', '🧽']]"],
  ["else if (z === 'rs') { t.s = 1; t.x = 0; t.y = 0; }", "else if (z === 'rs') { t.s = 1; t.x = 0; t.y = 0; }\n        else if (z === 'ct') { autoCenter(k); }"],
  // 3) funksiyalar
  ["function exportK(k) {",
`function autoCenter(k) {
    var im = form.src[k], N = 200, c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true }), m = Math.min(im.width, im.height), sc = N / m;
    x.drawImage(im, N / 2 - im.width * sc / 2, N / 2 - im.height * sc / 2, im.width * sc, im.height * sc);
    var d = x.getImageData(0, 0, N, N).data, bg = [d[0], d[1], d[2], d[3]], x0 = N, y0 = N, x1 = -1, y1 = -1, i, j;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var p = (j * N + i) * 4, a = d[p + 3];
      var solid = bg[3] < 40 ? a > 40 : (a > 40 && (Math.abs(d[p] - bg[0]) + Math.abs(d[p + 1] - bg[1]) + Math.abs(d[p + 2] - bg[2])) > 60);
      if (solid) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    }
    if (x1 < 0) { msg = 'Donani aniqlab bo‘lmadi, qo‘lda sozlang'; return draw(); }
    var w = x1 - x0 + 1, h = y1 - y0 + 1, mid = [(x0 + x1) / 2, (y0 + y1) / 2], t = form.t[k];
    t.s = Math.max(0.3, Math.min(4, N * 0.92 / Math.max(w, h)));
    t.x = -(mid[0] - N / 2) / N * t.s; t.y = -(mid[1] - N / 2) / N * t.s;
    msg = ''; draw();
  }
  function edgeCut(k) {
    var N = 120, c = document.createElement('canvas'); c.width = c.height = N; paint(k, c, N);
    var d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, N, N).data, cnt = 0, tot = 0, a, i;
    for (a = 0; a < 360; a += 4) {
      var px = Math.round(N / 2 + (N / 2 - 3) * Math.cos(a * Math.PI / 180)), py = Math.round(N / 2 + (N / 2 - 3) * Math.sin(a * Math.PI / 180));
      i = (py * N + px) * 4; tot++; if (d[i + 3] > 200) cnt++;
    }
    return cnt / tot > 0.25;
  }
  function exportK(k) {`],
  // 4) saqlashda tekshiruv
  ["var pics = {}, bad = false;", "var cut = KS.filter(function (k) { return edgeCut(k); });\n    if (cut.length && !form.warned) { form.warned = true; msg = '⚠️ Qirrasi kesilgan: ' + cut.map(function (k) { return KN[k]; }).join(', ') + '. 🎯 yoki － bilan sozlang. Baribir saqlash uchun yana 💾 bosing.'; return draw(); }\n    var pics = {}, bad = false;"]
];
const res = {};
for (const f of ['shop.js', 'menu.js']) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('function autoCenter')) { console.log(f + ': allaqachon bor'); continue; }
  for (const [a, b] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('XATO: ' + f + ' -> ' + a.slice(0, 40) + ' (' + n + ')'); process.exit(1); }
    s = s.replace(a, () => b);
  }
  res[f] = s;
}
for (const f in res) fs.writeFileSync(f, res[f]);
console.log('TAYYOR');
