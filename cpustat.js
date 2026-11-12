'use strict';
// cpustat.js — ⚙️ protsessor nimaga ketyapti: har daqiqada o'lchaydi, 24 soatlik tarix saqlaydi.
// Node (server: ulanishlar, xonalar, turnir, qo'riqchi) va dvigatel (KestoG) alohida;
// server kechikishi (event loop), dvigatel navbati, qisqartirilgan o'ylashlar. /kesh da ko'rinadi, band daqiqalar jurnalga yoziladi.
const fs = require('fs');
const H = [];   // {t, node, eng, all, lag, lagMax, n, ms, pon, low, cut, qmax, guard, ws}
let lastCpu = process.cpuUsage(), lastT = Date.now(), lastEng = new Map(), started = false, hist = null;
const TICK = 100 / 1e6;   // /proc stat: 100 tick = 1 s (Linux odatiy)

function engProc() {   // KestoG jarayonlari: pid -> utime+stime (tick)
  const m = new Map();
  try {
    for (const d of fs.readdirSync('/proc')) {
      if (!/^\d+$/.test(d) || +d === process.pid) continue;
      try {
        const cmd = fs.readFileSync('/proc/' + d + '/cmdline', 'utf8');
        if (!/bridge|Kesto/i.test(cmd)) continue;
        const st = fs.readFileSync('/proc/' + d + '/stat', 'utf8'), f = st.slice(st.lastIndexOf(')') + 2).split(' ');
        m.set(d, (+f[11]) + (+f[12]));
      } catch (e) {}
    }
  } catch (e) {}
  return m;
}
function guardMs() { try { const g = require('./kkadm.js').GSTAT; if (!g) return 0; const v = g.ms - (guardMs.prev || 0); guardMs.prev = g.ms; return v; } catch (e) { return 0; } }

function tick() {
  const now = Date.now(), dt = now - lastT; lastT = now;
  const cu = process.cpuUsage(lastCpu); lastCpu = process.cpuUsage();
  const node = (cu.user + cu.system) / 1000 / dt * 100;   // % (1 yadro = 100%)
  const em = engProc(); let et = 0;
  for (const [pid, v] of em) et += Math.max(0, v - (lastEng.get(pid) || 0));
  lastEng = em;
  const eng = et * 10 / dt * 100;   // tick -> ms (10 ms) -> %
  let lag = 0, lagMax = 0;
  if (hist) { lag = Math.round(hist.percentile(99) / 1e6); lagMax = Math.round(hist.max / 1e6); hist.reset(); }
  let K = {}; try { const ka = require('./kestoai.js'); K = ka.engStat(); ka.setLag(lag); } catch (e) {}
  let ws = 0; try { ws = require('./memguard.js').snap().ws; } catch (e) {}
  const r = { t: now, node: Math.round(node), eng: Math.round(eng), all: Math.round(node + eng), lag, lagMax, n: K.n || 0, ms: K.ms || 0, pon: K.pon || 0, low: K.low || 0, cut: K.cut || 0, qmax: K.qmax || 0, guard: guardMs(), ws };
  H.push(r); if (H.length > 1440) H.shift();
  if (r.all >= 60 || r.lag >= 200) console.log('[cpu] ' + line(r));
}
function line(r) {
  return 'jami ' + r.all + '% (server ' + r.node + '%, dvigatel ' + r.eng + '%) · kechikish p99 ' + r.lag + ' ms, eng ko‘p ' + r.lagMax + ' ms · dvigatel: ' + r.n + ' so‘rov, ' + Math.round(r.ms / 1000) + ' s (fon ' + Math.round((r.pon + r.low) / 1000) + ' s), navbat ≤' + r.qmax + (r.cut ? ', qisqartirildi ' + r.cut : '') + (r.guard ? ' · qo‘riqchi ' + r.guard + ' ms' : '') + ' · ulanish ' + r.ws;
}
function hm(t) { return new Date(t + 5 * 3600e3).toISOString().slice(11, 16); }
// /kesh uchun: oxirgi soat o'rtachasi + 24 soatdagi eng og'ir 5 daqiqa
function report() {
  if (!H.length) return '\n\n⚙️ <b>Protsessor</b>: hali o‘lchanmadi (har daqiqada)';
  const last = H.slice(-60), avg = k => Math.round(last.reduce((s, x) => s + x[k], 0) / last.length);
  let t = '\n\n⚙️ <b>Protsessor</b> (oxirgi ' + last.length + ' daqiqa o‘rtacha, 100% = 1 yadro)\n' +
    'Jami: <b>' + avg('all') + '%</b> · server: ' + avg('node') + '% · dvigatel: ' + avg('eng') + '% · kechikish p99: ' + avg('lag') + ' ms';
  const top = H.slice().sort((a, b) => b.all - a.all).slice(0, 5).filter(x => x.all >= 30);
  if (top.length) t += '\n\n🔥 <b>Eng og‘ir daqiqalar</b> (24 soat):\n' + top.map(x => '• ' + hm(x.t) + ' — ' + line(x)).join('\n');
  return t;
}
function start() {
  if (started) return; started = true;
  try { hist = require('perf_hooks').monitorEventLoopDelay({ resolution: 20 }); hist.enable(); } catch (e) { hist = null; }
  lastEng = engProc();
  setInterval(() => { try { tick(); } catch (e) {} }, 60e3).unref();
}
module.exports = { start, report, tick, hist: () => H };
