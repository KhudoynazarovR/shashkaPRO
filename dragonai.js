"use strict";
/* dragonai.js — DragonBOT dvigateli (engine/dragon.c) bilan ko'prik.
   Baholash Skifi 0.39 jadvallariga asoslangan, qidiruv — alfa-beta + xesh + urishlar qidiruvi.
   Interfeys kestoai.js bilan bir xil: move({ board, side, time }, cb) → { from, to, jumps, ev, ms }.
   Keyinchalik Kolisto dvigateliga o'tilsa, faqat shu fayl ichi o'zgaradi. */
const { spawn, execFile } = require("child_process");
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "engine");
const BIN = process.env.DRAGON_BIN || path.join(DIR, "dragon.bin");
const SRC = path.join(DIR, "dragon.c");

let ready = false, child = null, buf = "", cur = null, queue = [];
const ENG = { ms: 0, n: 0, qmax: 0 };

function fresh() {
  try { return fs.statSync(SRC).mtimeMs <= fs.statSync(BIN).mtimeMs; } catch (e) { return false; }
}

function spawnEngine() {
  buf = "";
  const ch = spawn(BIN, [], { cwd: DIR, stdio: ["pipe", "pipe", "ignore"] });
  child = ch;
  try { require("os").setPriority(ch.pid, 15); } catch (e) {}   // server protsessorni birinchi oladi
  ch.on("error", () => { if (child === ch) { child = null; finish("spawn"); } });
  ch.on("close", () => { if (child === ch) { child = null; finish("noout"); } });
  ch.stdin.on("error", () => {});
  ch.stdout.on("data", d => {
    if (ch !== child) return;
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (cur && /^-?\d+ -?\d+ -?\d+ -?\d+ -?\d+( -?\d+)?$/.test(line)) finish(null, line.split(" ").map(Number));
    }
  });
}
function finish(err, val) {
  if (!cur) return;
  const c = cur; cur = null; clearTimeout(c.tm);
  if (c.t0) { ENG.ms += Date.now() - c.t0; ENG.n++; }
  if (err && child) { const o = child; child = null; try { o.kill("SIGKILL"); } catch (e) {} }
  c.cb(err, val);
  next();
}
function next() {
  if (cur || !queue.length) return;
  cur = queue.shift();
  if (queue.length > ENG.qmax) ENG.qmax = queue.length;
  if (!child) spawnEngine();
  cur.t0 = Date.now();
  cur.tm = setTimeout(() => finish("timeout"), (cur.secs + 8) * 1000);
  child.stdin.write(cur.input);
}
function run(input, secs, cb) { queue.push({ input, secs, cb }); next(); }

/* doska → dvigatel: kestoai bilan bir xil tartib (y qatorlar, x kamayib) */
function encode(board, side, secs) {
  const rows = [];
  for (let y = 0; y < 8; y++) {
    const vals = [];
    for (let x = (y % 2 === 0 ? 7 : 6); x >= 0; x -= 2) {
      const p = board[y * 8 + x];
      vals.push(p === 0 ? 0 : (p > 0 ? (p === 1 ? 5 : 9) : (p === -1 ? 6 : 10)));
    }
    rows.push(vals.join(" "));
  }
  return (side > 0 ? 1 : 2) + " " + secs.toFixed(2) + "\n" + rows.join("\n") + "\n";
}
function newGame(b) { let n = 0; for (const v of b) if (Math.abs(v) === 1) n++; return n === 24 && !b.some(v => Math.abs(v) === 2); }

function move(j, cb) {
  if (!ready) return cb({ error: "notready", code: 503 });
  const b = j && j.board, side = (j && j.side > 0) ? 1 : -1;
  if (!Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return cb({ error: "bad", code: 400 });
  if (queue.length >= 12) return cb({ error: "busy", code: 429 });
  const secs = Math.min(30, Math.max(0.05, Number(j.time) || 1)), t0 = Date.now();
  run((newGame(b) ? "9 0\n" : "") + encode(b, side, secs), secs, (err, v) => {
    if (err) return cb({ error: err, code: 500 });
    const from = v[1] * 8 + (7 - v[0]), to = v[3] * 8 + (7 - v[2]);
    if (!(from >= 0 && from < 64 && to >= 0 && to < 64) || from === to) return cb({ error: "nomove", code: 500 });
    cb({ from, to, jumps: v[4], ev: v.length > 5 ? v[5] : null, ms: Date.now() - t0 });
  });
}

function selfTest() {
  const b = Array(64).fill(0);
  for (let i = 0; i < 64; i++) { const r = i >> 3, c = i & 7; if ((r + c) % 2 === 1) { if (r < 3) b[i] = -1; else if (r > 4) b[i] = 1; } }
  ready = true;
  move({ board: b, side: 1, time: 0.3 }, w => {
    move({ board: b, side: -1, time: 0.3 }, k => {
      const okW = w.from != null && (w.from >> 3) === 5 && (w.to >> 3) === 4;
      const okB = k.from != null && (k.from >> 3) === 2 && (k.to >> 3) === 3;
      ready = okW && okB;
      console.log(ready ? "[Dragon] tayyor" : "[Dragon] orientatsiya mos kelmadi, o'chirildi", JSON.stringify([w, k]));
    });
  });
}
function build() {
  if (!fs.existsSync(SRC)) return console.log("[Dragon] engine/dragon.c yo'q");
  if (fresh()) return selfTest();
  console.log("[Dragon] kompilyatsiya boshlandi...");
  const CCS = [process.env.CC, "gcc", "clang", "cc"].filter(Boolean);
  (function tryCc(i) {
    if (i >= CCS.length) return console.log("[Dragon] kompilyator topilmadi (gcc/clang)");
    execFile(CCS[i], ["-O3", "-w", "-o", BIN, SRC, "-lm"], { cwd: DIR, timeout: 240000 }, err => {
      if (err) { if (err.code === "ENOENT") return tryCc(i + 1); return console.log("[Dragon] kompilyatsiya bo'lmadi:", String(err.message).slice(0, 200)); }
      selfTest();
    });
  })(0);
}
build();

module.exports = {
  move,
  isReady: () => ready,
  load: () => (cur ? 1 : 0) + queue.length,
  engStat: () => { const o = Object.assign({}, ENG, { q: queue.length, pid: child ? child.pid : 0 }); ENG.ms = ENG.n = ENG.qmax = 0; return o; }
};
