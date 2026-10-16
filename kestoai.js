"use strict";
const { spawn, execFile } = require("child_process");
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "engine"), BIN = path.join(DIR, "bridge.bin");
const SRC = [path.join(DIR, "bridge.c"), path.join(DIR, "KestoG.C")];
let ready = false, busy = 0;

function fresh() {
  try { const b = fs.statSync(BIN).mtimeMs; return SRC.every(f => fs.statSync(f).mtimeMs <= b); } catch (e) { return false; }
}

function run(input, secs, cb) {
  let out = "", done = false, ch;
  const tm = setTimeout(() => fin("timeout"), (secs + 8) * 1000);
  const fin = (err, val) => { if (done) return; done = true; clearTimeout(tm); try { ch.kill("SIGKILL"); } catch (e) {} cb(err, val); };
  try { ch = spawn(BIN, [], { cwd: DIR, stdio: ["pipe", "pipe", "ignore"] }); } catch (e) { return fin("spawn"); }
  ch.on("error", () => fin("spawn"));
  ch.stdout.on("data", d => { out += d; if (out.length > 200000) out = out.slice(-100000); });
  ch.on("close", () => {
    const L = out.split("\n").map(s => s.trim()).filter(Boolean);
    for (let i = L.length - 1; i >= 0; i--) {
      if (/^-?\d+ -?\d+ -?\d+ -?\d+ -?\d+$/.test(L[i])) return fin(null, L[i].split(" ").map(Number));
    }
    fin("noout");
  });
  ch.stdin.on("error", () => {});
  ch.stdin.end(input);
}

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

function move(j, cb) {
  console.log("[KestoG] request", j && j.time);
  if (!ready) return cb({ error: "notready", code: 503 });
  const b = j && j.board, side = (j && j.side > 0) ? 1 : -1;
  if (!Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return cb({ error: "bad", code: 400 });
  const secs = Math.min(6, Math.max(0.2, Number(j.time) || 1));
  if (busy >= 2) return cb({ error: "busy", code: 429 });
  busy++; const t0 = Date.now();
  run(encode(b, side, secs), secs, (err, v) => {
    busy--;
    if (err) { console.log('[KestoG] xato:', err, '| kirish:', JSON.stringify(encode(b, side, secs))); return cb({ error: err, code: 500 }); }
    const from = v[1] * 8 + (7 - v[0]), to = v[3] * 8 + (7 - v[2]);
    if (!(from >= 0 && from < 64 && to >= 0 && to < 64) || from === to) return cb({ error: "nomove", code: 500 });
    console.log('[KestoG] vaqt', secs, 'sek soralgan,', Date.now() - t0, 'ms'); cb({ from: from, to: to, jumps: v[4], ms: Date.now() - t0 });
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
      console.log(ready ? "[KestoG] tayyor" : "[KestoG] orientatsiya mos kelmadi, o'chirildi", JSON.stringify([w, k]));
    });
  });
}

function build() {
  if (!SRC.every(f => fs.existsSync(f))) return console.log("[KestoG] engine/ papkasida bridge.c yoki KestoG.C yo'q");
  if (fresh()) return selfTest();
  console.log("[KestoG] kompilyatsiya boshlandi...");
  execFile("gcc", ["-O3", "-w", "-o", BIN, SRC[0], "-lm"], { cwd: DIR, timeout: 240000 }, err => {
    if (err) return console.log("[KestoG] kompilyatsiya bo'lmadi:", String(err.message).slice(0, 200));
    selfTest();
  });
}
build();
module.exports = { move };
