"use strict";
const { spawn, execFile } = require("child_process");
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "engine"), BIN = process.env.KESTO_BIN || path.join(DIR, "bridge.bin");   // telefonda (Termux) alohida fayl
const SRC = [path.join(DIR, "bridge.c"), path.join(DIR, "KestoG.C")];
let ready = false, busy = 0;
let BOOK = {}; try { BOOK = JSON.parse(fs.readFileSync(path.join(__dirname, "book.json"), "utf8")); console.log("[Kitob] pozitsiyalar:", Object.keys(BOOK).length); } catch (e) { console.log("[Kitob] book.json yo'q"); }

function fresh() {
  try { const b = fs.statSync(BIN).mtimeMs; return SRC.every(f => fs.statSync(f).mtimeMs <= b); } catch (e) { return false; }
}

let child = null, buf = "", cur = null, queue = [];
function spawnEngine() {
  buf = "";
  const ch = spawn(BIN, [], { cwd: DIR, stdio: ["pipe", "pipe", "ignore"] });
  child = ch;
  ch.on("error", () => { if (child === ch) { child = null; finish("spawn"); } });
  ch.on("close", () => { if (child === ch) { child = null; finish("noout"); } });
  ch.stdin.on("error", () => {});
  ch.stdout.on("data", d => {
    if (ch !== child) return;
    buf += d; let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (cur && /^-?\d+ -?\d+ -?\d+ -?\d+ -?\d+( -?\d+)?$/.test(line)) finish(null, line.split(" ").map(Number));
    }
  });
}
function finish(err, val) {
  if (!cur) return;
  const c = cur; cur = null; clearTimeout(c.tm);
  if (err && child) { const o = child; child = null; try { o.kill("SIGKILL"); } catch (e) {} }
  c.cb(err, val);
  next();
}
function next() {
  if (cur || !queue.length) return;
  cur = queue.shift();
  if (!child) spawnEngine();
  cur.tm = setTimeout(() => finish("timeout"), (cur.secs + 8) * 1000);
  child.stdin.write(cur.input);
}
let LOWFLAG = false;
function run(input, secs, cb) {
  const it = { input: input, secs: secs, cb: cb, low: LOWFLAG };
  if (!it.low) { const i = queue.findIndex(q => q.low); if (i < 0) queue.push(it); else queue.splice(i, 0, it); } else queue.push(it);
  next();
}
function newGame(b) { let n = 0; for (const v of b) if (Math.abs(v) === 1) n++; return n === 24 && !b.some(v => Math.abs(v) === 2); }

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

// ---------- Tez javob va o'rganish (asosan Monster uchun)
// CACHE: chuqur hisoblangan pozitsiyalar xotirasi — takrorlanganda darhol javob.
// DEEP: bot yutqazgan o'yinlardagi pozitsiyalar — keyingi safar 2 barobar chuqurroq o'ylaydi (xatoni takrorlamaydi).
const CFILE = path.join(__dirname, 'data', 'engcache.json');
const CACHE = new Map(), DEEP = new Set(), ROOMK = new Map();
try { const o = JSON.parse(fs.readFileSync(CFILE, 'utf8')); (o.c || []).forEach(x => CACHE.set(x[0], x[1])); (o.d || []).forEach(k => DEEP.add(k)); console.log('[KestoG] xotira:', CACHE.size, 'pozitsiya,', DEEP.size, 'saboq'); } catch (e) {}
let cDirty = false;
setInterval(() => {
  if (!cDirty) return; cDirty = false;
  try { fs.mkdirSync(path.dirname(CFILE), { recursive: true }); fs.writeFileSync(CFILE, JSON.stringify({ c: [...CACHE.entries()].slice(-60000), d: [...DEEP].slice(-20000) })); } catch (e) {}
}, 5 * 60 * 1000).unref();
function remember(key, secs, r) {
  CACHE.delete(key); CACHE.set(key, { secs, r });
  if (CACHE.size > 60000) CACHE.delete(CACHE.keys().next().value);
  cDirty = true;
}
// bot yutqazdi → o'sha o'yindagi pozitsiyalarni "saboq" sifatida belgilaymiz
function learn(roomId) {
  const ks = ROOMK.get(String(roomId)); ROOMK.delete(String(roomId));
  if (!ks || !ks.length) return 0;
  ks.forEach(k => { CACHE.delete(k); DEEP.add(k); });
  while (DEEP.size > 20000) DEEP.delete(DEEP.values().next().value);
  cDirty = true;
  console.log('[KestoG] saboq olindi:', roomId, ks.length, 'pozitsiya');
  return ks.length;
}
function track(roomId, key) {
  if (!roomId) return;
  const id = String(roomId).slice(0, 40); let a = ROOMK.get(id);
  if (!a) { a = []; ROOMK.set(id, a); if (ROOMK.size > 500) ROOMK.delete(ROOMK.keys().next().value); }
  if (a.length < 200 && a[a.length - 1] !== key) a.push(key);
}

function move(j, cb) {
  LOWFLAG = !!(j && j.arena);
  if (process.env.KDEBUG) console.log("[KestoG] request", j && j.time);
  if (!ready) return cb({ error: "notready", code: 503 });
  const b = j && j.board, side = (j && j.side > 0) ? 1 : -1;
  if (!Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return cb({ error: "bad", code: 400 });
  let secs = Math.min(30, Math.max(0.05, Number(j.time) || 1));
  const bk = BOOK[b.join("") + side];
  if (bk && j.book) return cb({ from: bk.from, to: bk.to, jumps: 0, ev: null, ms: 0, book: 1 });
  const key = b.join(",") + "|" + side;
  if (j.room && secs >= 1) track(j.room, key);
  const deep = secs >= 1 && DEEP.has(key);
  if (deep) secs = Math.min(18, secs * 2, Number(j.maxTime) > 0 ? Number(j.maxTime) : 18);   // bu yerda avval yutqazgan — chuqurroq o'ylaymiz (vaqt imkon bergancha)
  const hit = secs >= 1 && CACHE.get(key);
  if (hit && hit.secs >= secs * 0.9) { cDirty = true; return cb(Object.assign({}, hit.r, { ms: 0, cached: 1 })); }
  // bitta dvigatel jarayoni: so'rovlar navbatga qo'yiladi (rad etilmaydi). Arena (bot va bot) faqat navbat bo'sh bo'lsa.
  if (j && j.arena ? (busy >= 1) : (queue.length >= 12)) return cb({ error: "busy", code: 429 });
  busy++; const t0 = Date.now();
  run((newGame(b) ? "9 0\n" : "") + encode(b, side, secs), secs, (err, v) => {
    busy--;
    if (err) { console.log('[KestoG] xato:', err, '| kirish:', JSON.stringify(encode(b, side, secs))); return cb({ error: err, code: 500 }); }
    const from = v[1] * 8 + (7 - v[0]), to = v[3] * 8 + (7 - v[2]);
    if (!(from >= 0 && from < 64 && to >= 0 && to < 64) || from === to) return cb({ error: "nomove", code: 500 });
    if (process.env.KDEBUG) console.log('[KestoG] vaqt', secs, 'sek soralgan,', Date.now() - t0, 'ms'); const res = { bk: bk ? { from: bk.from, to: bk.to } : null, from: from, to: to, jumps: v[4], ev: (v.length > 5 ? v[5] : null) };
    if (secs >= 1 && !newGame(b)) remember(key, secs, res);
    cb(Object.assign({ ms: Date.now() - t0, deep: deep ? 1 : 0 }, res));
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
  const CCS = [process.env.CC, "gcc", "clang", "cc"].filter(Boolean);   // Termux'da gcc yo'q — clang ishlatiladi
  (function tryCc(i) {
    if (i >= CCS.length) return console.log("[KestoG] kompilyator topilmadi (gcc/clang)");
    execFile(CCS[i], ["-O3", "-w", "-o", BIN, SRC[0], "-lm"], { cwd: DIR, timeout: 240000 }, err => {
      if (err) { if (err.code === "ENOENT") return tryCc(i + 1); return console.log("[KestoG] kompilyatsiya bo'lmadi:", String(err.message).slice(0, 200)); }
      selfTest();
    });
  })(0);
}
build();
module.exports = { move, learn, load: () => busy, mem: () => ({ cache: CACHE.size, deep: DEEP.size }) };
