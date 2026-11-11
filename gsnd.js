/* gsnd.js — 🔊 mini o'yinlar ovozi (Ugolki, Gomoku, Go, Shaxmat, Poddavki): yurish, urish, g'alaba/mag'lubiyat.
   Yurish/urish — /sounds/move.wav va capture.wav (asosiy o'yindagidek), qolgani sintez. 🔊/🔇 holati localStorage da (barcha mini o'yinlar uchun bitta).
   API: GSND.play('move'|'cap'|'win'|'lose'|'draw'|'tick'), GSND.btn() → tugma HTML, GSND.bind(root) → tugmalarni ulaydi. */
(function (root) {
  var KEY = 'gsnd_off', ctx = null, buf = {}, off = false;
  try { off = localStorage.getItem(KEY) === '1'; } catch (e) {}
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } load('move', '/sounds/move.wav?v=4'); load('cap', '/sounds/capture.wav?v=1'); }
    if (ctx.state === 'suspended') try { ctx.resume(); } catch (e) {}
    return ctx;
  }
  function load(k, url) { try { fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (ab) { ctx.decodeAudioData(ab, function (b) { buf[k] = b; }, function () {}); }).catch(function () {}); } catch (e) {} }
  function tone(f, t0, d, v, type) { var c = ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, c.currentTime + t0); g.gain.exponentialRampToValueAtTime(v, c.currentTime + t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + d); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + d + 0.05); }
  function play(k) {
    if (off) return; var c = ac(); if (!c) return;
    try {
      if ((k === 'move' || k === 'cap') && buf[k]) { var s = c.createBufferSource(); s.buffer = buf[k]; s.connect(c.destination); s.start(); return; }
      if (k === 'move') return tone(520, 0, 0.07, 0.25, 'triangle');
      if (k === 'cap') { tone(300, 0, 0.08, 0.3, 'square'); return tone(200, 0.06, 0.1, 0.25, 'square'); }
      if (k === 'win') { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, i * 0.11, 0.25, 0.22); }); return; }
      if (k === 'lose') { [392, 330, 262].forEach(function (f, i) { tone(f, i * 0.16, 0.3, 0.2); }); return; }
      if (k === 'draw') { tone(440, 0, 0.25, 0.2); return tone(440, 0.22, 0.25, 0.2); }
      if (k === 'tick') return tone(880, 0, 0.05, 0.12, 'square');
    } catch (e) {}
  }
  function btn() { return '<button class="gsndB" type="button" title="Ovoz" style="width:40px;height:40px;border:0;border-radius:12px;background:rgba(255,255,255,.08);color:inherit;font-size:19px;flex:none;cursor:pointer">' + (off ? '🔇' : '🔊') + '</button>'; }
  function bind(r) { [].forEach.call((r || document).querySelectorAll('.gsndB'), function (b) { b.onclick = function (e) { e.stopPropagation(); off = !off; try { localStorage.setItem(KEY, off ? '1' : '0'); } catch (x) {} b.textContent = off ? '🔇' : '🔊'; if (!off) play('move'); }; }); }
  // birinchi teginishda ovoz tizimini ochib qo'yamiz (brauzer cheklovi)
  document.addEventListener('pointerdown', function u() { ac(); document.removeEventListener('pointerdown', u, true); }, true);
  root.GSND = { play: play, btn: btn, bind: bind, isOff: function () { return off; } };
})(this);
