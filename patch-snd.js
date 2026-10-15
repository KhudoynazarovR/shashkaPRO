const fs = require("fs");
let s = fs.readFileSync("sound.js", "utf8");
function R(a, b) {
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("XATO: anchor soni =", n, "\n", a.slice(0, 70)); process.exit(1); }
  s = s.replace(a, () => b);
}
const i = s.indexOf("function knock(a, t, pitch, gain) {"), j = s.indexOf("var SOUNDS = {");
if (i < 0 || j < 0 || j < i) { console.log("XATO: knock topilmadi"); process.exit(1); }
const knock = String.raw`function knock(a, t, pitch, gain) {
    var src = a.createBufferSource(), f = a.createBiquadFilter(), lp = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noise(a);
    f.type = "bandpass"; f.frequency.value = pitch; f.Q.value = 0.8;
    lp.type = "lowpass"; lp.frequency.value = 1600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(f); f.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.12);
    tone(a, t, 170, 0.11, "sine", gain * 1.1, 70);
  }

  `;
s = s.slice(0, i) + knock + s.slice(j);
R(String.raw`move: function (a, t) { knock(a, t, 1100, 0.55); },`, String.raw`move: function (a, t) { knock(a, t, 520, 0.3); },`);
R(String.raw`capture: function (a, t) { knock(a, t, 1500, 0.8); knock(a, t + 0.055, 900, 0.7); },`, String.raw`capture: function (a, t) { knock(a, t, 620, 0.42); knock(a, t + 0.05, 430, 0.32); },`);
R(String.raw`knock(a, t, 1100, 0.45);`, String.raw`knock(a, t, 520, 0.28);`);
R(String.raw`var KEY = "sp_snd2";`, String.raw`var KEY = "sp_snd3";`);
R(String.raw`vol: 0.8,`, String.raw`vol: 0.6,`);
fs.writeFileSync("sound.js", s);
console.log("OK");
