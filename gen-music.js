'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const SR = 44100, SECS = 92;
const OUT = path.join(__dirname, 'reel_music_new');
fs.mkdirSync(OUT, { recursive: true });
let FF = 'ffmpeg'; try { const p = require('ffmpeg-static'); if (p && fs.existsSync(p)) FF = p; } catch (e) {}

const T = { m: [0, 3, 7, 10], M: [0, 4, 7, 11], d: [0, 4, 7, 10] };
const TRACKS = [
  { name: 'Kechki rohat', bpm: 92, root: 57, swing: 0.16, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'd']], seed: 11 },
  { name: 'Quvnoq tong', bpm: 108, root: 60, swing: 0.08, prog: [[0, 'M'], [7, 'd'], [9, 'm'], [5, 'M']], seed: 23 },
  { name: 'Mulohaza', bpm: 84, root: 52, swing: 0.2, prog: [[0, 'm'], [5, 'm'], [10, 'd'], [3, 'M']], seed: 37 },
  { name: 'O‘yin payti', bpm: 100, root: 55, swing: 0.12, prog: [[0, 'M'], [5, 'M'], [7, 'd'], [9, 'm']], seed: 41 }
];
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

function render(tr) {
  const N = SR * SECS, music = new Float32Array(N), drums = new Float32Array(N), R = rng(tr.seed);
  const beat = 60 / tr.bpm, bar = beat * 4, bars = Math.floor(SECS / bar);
  function tone(buf, t0, dur, f, vol, decay, harm) {
    const s0 = Math.floor(t0 * SR), len = Math.floor((dur + 0.25) * SR);
    for (let i = 0; i < len && s0 + i < N; i++) {
      const t = i / SR, rel = t > dur ? Math.max(0, 1 - (t - dur) / 0.25) : 1;
      const env = Math.min(1, t / 0.006) * Math.exp(-t * decay) * rel;
      let v = Math.sin(2 * Math.PI * f * t);
      if (harm) v += 0.42 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 6) + 0.12 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 9);
      buf[s0 + i] += v * env * vol;
    }
  }
  function kick(t0) {
    const s0 = Math.floor(t0 * SR), len = Math.floor(0.28 * SR);
    for (let i = 0; i < len && s0 + i < N; i++) { const t = i / SR, f = 48 + 90 * Math.exp(-t * 28); drums[s0 + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 11) * 0.9; }
  }
  function noise(t0, dur, vol, hp) {
    const s0 = Math.floor(t0 * SR), len = Math.floor(dur * SR); let prev = 0;
    for (let i = 0; i < len && s0 + i < N; i++) { const w = R() * 2 - 1, v = hp ? w - prev : w; prev = w; drums[s0 + i] += v * Math.exp(-(i / SR) * (3.5 / dur)) * vol; }
  }
  for (let b = 0; b < bars; b++) {
    const ch = tr.prog[b % tr.prog.length], notes = T[ch[1]].map(x => tr.root + ch[0] + x), t = b * bar;
    const pat = [0, 1, 2, 3, 2, 1, 2, 1];
    for (let k = 0; k < 8; k++) {
      const sw = (k % 2) ? tr.swing * beat / 2 : 0, tt = t + k * beat / 2 + sw;
      tone(music, tt, beat * 0.8, hz(notes[pat[k]] + (k === 3 ? 12 : 0)), 0.16, 3.2, true);
    }
    notes.slice(0, 3).forEach(n => tone(music, t, bar, hz(n - 12), 0.05, 0.5, false));
    tone(music, t, beat * 1.6, hz(notes[0] - 24), 0.34, 1.6, false);
    tone(music, t + beat * 2.5, beat * 1.2, hz((R() < 0.5 ? notes[2] : notes[0]) - 24), 0.28, 1.8, false);
    kick(t); kick(t + beat * 2 + (R() < 0.4 ? beat * 0.5 : 0));
    noise(t + beat, 0.16, 0.22, true); noise(t + beat * 3, 0.16, 0.22, true);
    for (let k = 0; k < 8; k++) noise(t + k * beat / 2 + ((k % 2) ? tr.swing * beat / 2 : 0), 0.04, k % 2 ? 0.08 : 0.12, true);
    if (b % 2 === 1 && b > 3) {
      const pent = [0, 3, 5, 7, 10, 12, 15].map(x => tr.root + 12 + x);
      let pos = Math.floor(R() * 4) + 2;
      for (let k = 0; k < 4; k++) {
        pos = Math.max(0, Math.min(pent.length - 1, pos + Math.floor(R() * 3) - 1));
        tone(music, t + beat * (k * 1.0 + (R() < 0.3 ? 0.5 : 0)), beat * 0.9, hz(pent[pos] + 12), 0.11, 2.4, true);
      }
    }
  }
  const d1 = Math.floor(beat * 0.75 * SR);
  for (let i = d1; i < N; i++) music[i] += 0.3 * music[i - d1];
  const out = new Float32Array(N); let pk = 1e-9;
  for (let i = 0; i < N; i++) { out[i] = Math.tanh(music[i] * 0.9 + drums[i] * 0.8); if (Math.abs(out[i]) > pk) pk = Math.abs(out[i]); }
  const g = 0.8 / pk; for (let i = 0; i < N; i++) out[i] *= g;
  return out;
}
function wav(samples, file) {
  const n = samples.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, buf);
}
TRACKS.forEach((tr, i) => {
  const w = path.join(os.tmpdir(), 'mus' + i + '.wav'), o = path.join(OUT, 'm' + i + '.m4a');
  wav(render(tr), w);
  const r = spawnSync(FF, ['-y', '-v', 'error', '-i', w, '-ac', '2', '-c:a', 'aac', '-b:a', '128k', o]);
  try { fs.unlinkSync(w); } catch (e) {}
  console.log(r.status === 0 ? 'OK  m' + i + '.m4a — ' + tr.name + ' (' + tr.bpm + ' BPM)' : 'XATO m' + i + ': ' + String(r.stderr || r.error));
});
