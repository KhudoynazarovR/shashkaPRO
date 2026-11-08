"use strict";
const { spawn, execFile } = require("child_process");
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "engine"), BIN = process.env.KESTO_BIN || path.join(DIR, "bridge.bin");   // telefonda (Termux) alohida fayl
const SRC = [path.join(DIR, "bridge.c"), path.join(DIR, "KestoG.C")];
let ready = false, busy = 0;
let COLETTE = {}; try { COLETTE = JSON.parse(fs.readFileSync(path.join(__dirname, "partiyalar", "colette_moves.json"), "utf8")); console.log("[Colette uslubi] pozitsiyalar:", Object.keys(COLETTE).length); } catch (e) {}
let BOOK = {}; try { BOOK = JSON.parse(fs.readFileSync(path.join(__dirname, "book.json"), "utf8")); console.log("[Kitob] pozitsiyalar:", Object.keys(BOOK).length); } catch (e) { console.log("[Kitob] book.json yo'q"); }

function fresh() {
  try { const b = fs.statSync(BIN).mtimeMs; return SRC.every(f => fs.statSync(f).mtimeMs <= b); } catch (e) { return false; }
}

let child = null, buf = "", cur = null, queue = [];
function spawnEngine() {
  buf = "";
  const ch = spawn(BIN, [], { cwd: DIR, stdio: ["pipe", "pipe", "ignore"] });
  child = ch; if (process.env.KKLOG) console.log("[KK] ENGINE SPAWN");
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
  if (err && child && process.env.KKLOG) console.log("[KK] ENGINE KILL sabab:", err);
  if (err && child) { const o = child; child = null; try { o.kill("SIGKILL"); } catch (e) {} }
  c.cb(err, val);
  next();
}
function next() {
  if (cur || !queue.length) return;
  cur = queue.shift();
  if (cur.mk) {   // o'ylash vaqti navbatdan chiqqanda hisoblanadi: kutilgan vaqt soatdan ayiriladi
    let s = cur.secs;
    if (cur.due) s = Math.min(s, Math.max(0.08, (cur.due - Date.now()) / 1000));
    cur.secs = s; cur.input = cur.mk(s);
  }
  if (!child) spawnEngine();
  cur.tm = setTimeout(() => finish("timeout"), (cur.secs + 8) * 1000);
  child.stdin.write(cur.input);
}
let LOWFLAG = false;
// navbat tartibi (pri — kichigi oldin): ⏱ vaqtli King Kong — javob kerak bo'lgan vaqt (due) bo'yicha, eng shoshilinchi birinchi;
// oddiy so'rovlar; vaqtsiz King Kong; fon ishlari (arena, ponder) — eng oxirida
function run(input, secs, cb, opt) {
  const pon = !!(opt && opt.ponder), now = Date.now(), low = (opt && opt.low) || LOWFLAG || pon;
  const it = { input: input, secs: secs, cb: cb, low, ponder: pon, mk: opt && opt.mk, due: opt && opt.due, slow: !!(opt && opt.slow) };
  it.pri = it.due ? it.due : low ? now + 1e12 : it.slow ? now + 60e3 : now + 3e3;
  const i = queue.findIndex(q => q.pri > it.pri); if (i < 0) queue.push(it); else queue.splice(i, 0, it);
  // haqiqiy so'rov kelsa — oldindan o'ylash (ponder) darhol to'xtatiladi
  if (!pon && cur && cur.ponder) finish("preempt");
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
  const last = ks.slice(-LEARN_LAST);   // xato odatda yutqazishdan oldingi oxirgi yurishlarda — butun partiyani emas
  last.forEach(k => { CACHE.delete(k); DEEP.add(k); });
  while (DEEP.size > 20000) DEEP.delete(DEEP.values().next().value);
  cDirty = true;
  console.log('[KestoG] saboq olindi:', roomId, last.length, 'pozitsiya');
  return last.length;
}
const LEARN_LAST = 10;
function clearDeep() { const n = DEEP.size; DEEP.clear(); cDirty = true; return n; }   // 🧹 ustaxonadan: hamma saboqlarni o'chirish
function track(roomId, key) {
  if (!roomId) return;
  const id = String(roomId).slice(0, 40); let a = ROOMK.get(id);
  if (!a) { a = []; ROOMK.set(id, a); if (ROOMK.size > 500) ROOMK.delete(ROOMK.keys().next().value); }
  if (a.length < 200 && a[a.length - 1] !== key) a.push(key);
}

function move(j, cb) {
  if (j && j.kk && process.env.KKLOG) { const _c = cb; cb = r => { try { console.log("[KK]", JSON.stringify({ room: j.room, t: j.time, rem: j.rem, from: r.from, to: r.to, ev: r.ev, ms: r.ms, book: r.book, colette: r.colette, admin: r.admin, tb: r.tb, cached: r.cached, deep: r.deep, err: r.error })); } catch (e) {} return _c(r); }; }
  LOWFLAG = !!(j && j.arena);
  if (process.env.KDEBUG) console.log("[KestoG] request", j && j.time);
  if (!ready) return cb({ error: "notready", code: 503 });
  const b = j && j.board, side = (j && j.side > 0) ? 1 : -1;
  if (!Array.isArray(b) || b.length !== 64 || !b.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return cb({ error: "bad", code: 400 });
  let secs = Math.min(30, Math.max(0.05, Number(j.time) || 1));
  // ♟ endshpil bazasi: kam dona qolganda kuchli botlar mukammal o'ynaydi (hisoblamasdan)
  if ((secs >= 2 || j.tbAlways) && TBP && TBP.ready()) {
    try { const t = TBP.best(b, side); if (t) return cb({ from: t.from, to: t.to, jumps: 0, ev: t.res === 'win' ? 3000 - t.d : t.res === 'loss' ? -3000 + t.d : 0, ms: 0, tb: t.res }); } catch (e) { console.log('[TB]', e.message); }
  }
  if (j.kk) { try { const ab = require('./kkbook.js').get(b, side, j.room); if (ab) return cb({ from: ab.f, to: ab.t, jumps: 0, ev: null, ms: 0, book: 1, admin: 1 }); } catch (e) {} }   // 🦍 admin o'rgatgan yurish — birinchi
  try { const eb = require('./etudes.js').bookMove(b, side); if (eb) return cb({ from: eb.from, to: eb.to, jumps: 0, ev: null, ms: 0, book: 1, etude: 1 }); } catch (e) {}
  const bk = BOOK[b.join("") + side];
  const cm = j.book && !(j.kk && process.env.KK_NOBOOK === "1") && (secs >= 2 || j.tbAlways) && COLETTE[b.join("") + side];   // coletteBOT (2300) o'yin uslubi — saboq (DEEP) uni chetga surmaydi
  if (cm) return cb({ from: cm[0], to: cm[1], jumps: 0, ev: null, ms: 0, book: 1, colette: 1 });
  if (bk && j.book && !(j.kk && process.env.KK_NOBOOK === "1")) return cb({ from: bk.from, to: bk.to, jumps: 0, ev: null, ms: 0, book: 1 });
  const key = b.join(",") + "|" + side;
  if (j.room && secs >= 1) track(j.room, key);
  const deep = secs >= 1 && DEEP.has(key);
  const dcap = secs >= 12 ? 30 : 18;   // King Kong saboq joylarida 30 s gacha o'ylaydi
  if (deep) secs = Math.min(dcap, secs * 2, Number(j.maxTime) > 0 ? Number(j.maxTime) : dcap);   // bu yerda avval yutqazgan — chuqurroq o'ylaymiz (vaqt imkon bergancha)
  const hit = (secs >= 1 || j.tbAlways) && CACHE.get(key);   // tez o'yinda ham oldindan o'ylangan (ponder) javobdan foydalanamiz
  if (hit && hit.secs >= secs * 0.9) { cDirty = true; return cb(Object.assign({}, hit.r, { ms: 0, cached: 1 })); }
  // bitta dvigatel jarayoni: so'rovlar navbatga qo'yiladi (rad etilmaydi). Arena (bot va bot) faqat navbat bo'sh bo'lsa.
  if (j && j.arena ? (busy >= 1) : (queue.length >= 12)) return cb({ error: "busy", code: 429 });
  busy++; const t0 = Date.now();
  const due = j.kk && Number(j.rem) > 0 ? t0 + Math.round(secs * 1000) : 0;   // ⏱ vaqtli King Kong: shu vaqtgacha javob berilishi shart (navbat kutish ham shunga kiradi)
  const ng = newGame(b), mk = s => (ng ? "9 0\n" : "") + encode(b, side, s);
  let used = secs, capped = false;
  // uzoq o'ylash (vaqtsiz o'yin) 1 s lik bo'laklarga bo'linadi: oraliqda vaqtli o'yinlar navbatsiz o'tib ketadi,
  // dvigatel xesh-jadvali saqlangani uchun keyingi bo'lak oldingisidan davom etadi
  const CH = 1.0, lowNow = LOWFLAG;
  const go = (left, cb2) => {
    if (due || left <= CH + 0.3) return run(mk(left), left, cb2, { mk: s => { used = s; capped = s < left - 0.01; return mk(s); }, due, slow: !!(j.kk && !due), low: lowNow });
    run(mk(CH), CH, (err, v) => { if (err) return cb2(err, v); go(left - CH, (e2, v2) => cb2(null, e2 ? v : v2)); }, { slow: true, low: lowNow });
  };
  go(secs, (err, v) => {
    busy--;
    if (err) { console.log('[KestoG] xato:', err, '| kirish:', JSON.stringify(encode(b, side, secs))); return cb({ error: err, code: 500 }); }
    const from = v[1] * 8 + (7 - v[0]), to = v[3] * 8 + (7 - v[2]);
    if (!(from >= 0 && from < 64 && to >= 0 && to < 64) || from === to) return cb({ error: "nomove", code: 500 });
    if (process.env.KDEBUG) console.log('[KestoG] vaqt', secs, 'sek soralgan,', Date.now() - t0, 'ms'); const res = { bk: bk ? { from: bk.from, to: bk.to } : null, from: from, to: to, jumps: v[4], ev: (v.length > 5 ? v[5] : null) };
    if (!ng && (capped ? used : secs) >= 1) remember(key, capped ? used : secs, res);
    cb(Object.assign({ ms: Date.now() - t0, deep: deep ? 1 : 0 }, res));
  });
}

// ---------- 🦍 King Kong: raqib o'ylayotganda o'ylash (ponder)
// 1) raqibning eng ehtimolli javobini qisqa hisoblaymiz, 2) shu javobdan keyingi pozitsiyani King Kong vaqtidan 1.6 barobar uzoq
// hisoblab CACHE ga yozamiz. Raqib shu yurishni qilsa — King Kong darhol, chuqur hisoblangan javob beradi.
// Haqiqiy so'rov kelishi bilan to'xtatiladi (boshqa o'yinchilar kutmaydi).
let RULES = null; try { RULES = require("./kkrules.js"); } catch (e) {}
let TBP = null; try { TBP = require("./tbprobe.js"); } catch (e) { console.log("[TB] yuklanmadi:", e.message); }
let ponderTok = 0;
const PONDER = { n: 0, hit: 0 };
function engMove(v) { return { from: v[1] * 8 + (7 - v[0]), to: v[3] * 8 + (7 - v[2]), jumps: v[4], ev: v.length > 5 ? v[5] : null }; }
function ponder(b, humanSide, kkSecs, room, predict) {
  if (!ready || !RULES || !Array.isArray(b) || b.length !== 64) return;
  const tok = ++ponderTok;
  queue = queue.filter(q => !q.ponder);   // eski ponderlar bekor
  if (cur && cur.ponder) finish("preempt");
  const legal = RULES.moves(b, humanSide); if (!legal.length) return;
  const go2 = mv => {
    if (tok !== ponderTok || !mv) return;
    const b2 = mv.board, side2 = -humanSide, key2 = b2.join(",") + "|" + side2, secs2 = Math.min(30, kkSecs * 1.6);
    if (BOOK[b2.join("") + side2] || COLETTE[b2.join("") + side2]) return;
    const h = CACHE.get(key2); if (h && h.secs >= secs2 * 0.9) return;
    const deep = DEEP.has(key2), s2 = deep ? 30 : secs2;
    run(encode(b2, side2, s2), s2, (err, v) => {
      if (err || tok !== ponderTok) return;
      const r = engMove(v); if (!(r.from >= 0 && r.to >= 0 && r.from !== r.to)) return;
      remember(key2, s2, { bk: null, from: r.from, to: r.to, jumps: r.jumps, ev: r.ev }); PONDER.n++;
      if (room) track(room, key2);
    }, { ponder: true });
  };
  if (legal.length === 1) return go2(legal[0]);   // majburiy javob — taxmin shart emas
  const ps = predict > 0 ? predict : 0.5;   // raqib javobini taxmin qilish vaqti (tez o'yinda qisqaroq)
  run(encode(b, humanSide, ps), ps, (err, v) => {
    if (err || tok !== ponderTok) return;
    const r = engMove(v);
    go2(legal.find(m => m.from === r.from && m.to === r.to) || legal.find(m => m.to === r.to) || null);
  }, { ponder: true });
}

// ---------- tezkor tahlil: butun partiya ~10 soniyada (har pozitsiya qisqa hisob), so'rovlar orasida botlar navbati kutmaydi
let reviews = 0;
function review(list, cb) {
  if (!ready) return cb({ error: "notready", code: 503 });
  if (!Array.isArray(list) || !list.length || list.length > 220) return cb({ error: "bad", code: 400 });
  if (reviews >= 2) return cb({ error: "busy", code: 429 });
  for (const x of list) if (!x || !Array.isArray(x.board) || x.board.length !== 64 || !x.board.every(v => Number.isInteger(v) && v >= -2 && v <= 2)) return cb({ error: "bad", code: 400 });
  reviews++;
  const per = Math.max(0.05, Math.min(0.3, 8.5 / list.length)), out = [], t0 = Date.now();
  (function step(i) {
    if (i >= list.length || Date.now() - t0 > 25000) { reviews--; return cb({ res: out, ms: Date.now() - t0, per: per }); }
    const x = list[i], side = x.side > 0 ? 1 : -1, key = x.board.join(",") + "|" + side, h = CACHE.get(key);
    if (h && h.r && typeof h.r.ev === "number") { out.push({ from: h.r.from, to: h.r.to, ev: h.r.ev }); return step(i + 1); }
    run(encode(x.board, side, per), per, (err, v) => {
      if (err) out.push(null); else { const r = engMove(v); out.push({ from: r.from, to: r.to, ev: r.ev }); }
      step(i + 1);
    });
  })(0);
}

// ---------- xotira (saboqlar + chuqur hisoblar) bazada saqlanadi — deploydan keyin ham yo'qolmaydi
const zlib = require("zlib");
function packMem() {
  const c = [...CACHE.entries()].filter(e => e[1].secs >= 5).slice(-12000);
  return zlib.gzipSync(Buffer.from(JSON.stringify({ c: c, d: [...DEEP].slice(-8000) }))).toString("base64");
}
setTimeout(() => {
  let st = null; try { st = require("./store.js"); } catch (e) { return; }
  if (!st.kvGet) return;
  st.kvGet("engmem").then(v => {
    if (typeof v === "string") {
      try {
        const o = JSON.parse(zlib.gunzipSync(Buffer.from(v, "base64")).toString());
        (o.c || []).forEach(x => { if (!CACHE.has(x[0])) CACHE.set(x[0], x[1]); }); (o.d || []).forEach(k => DEEP.add(k));
        console.log("[KestoG] bazadan xotira:", (o.c || []).length, "chuqur hisob,", (o.d || []).length, "saboq");
      } catch (e) { console.log("[KestoG] xotira o'qilmadi:", e.message); }
    }
    let memDirty = false, lastN = CACHE.size + DEEP.size;
    setInterval(() => {
      const n = CACHE.size + DEEP.size + PONDER.n;
      if (n === lastN && !memDirty) return; lastN = n;
      st.kvSet("engmem", packMem());
    }, 10 * 60 * 1000).unref();
  });
}, 5000).unref();

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
// 🦍 King Kong shu pozitsiyada nima qiladi (dvigatelni ishga tushirmasdan): manba va yurish
function peek(b, side) {
  const k = b.join('') + side, key = b.join(',') + '|' + side, o = { src: 'engine' };
  try { const cm = COLETTE[k]; if (cm) o.colette = { from: cm[0], to: cm[1] }; } catch (e) {}
  try { const bk = BOOK[k]; if (bk) o.book = { from: bk.from, to: bk.to }; } catch (e) {}
  let ad = null; try { ad = require('./kkbook.js').peek(b, side); } catch (e) {}
  if (ad) o.admin = { from: ad.f, to: ad.t };
  let tb = null; try { if (TBP && TBP.ready()) tb = TBP.best(b, side); } catch (e) {}
  let et = null; try { et = require('./etudes.js').bookMove(b, side); } catch (e) {}
  const hit = CACHE.get(key);
  if (tb) Object.assign(o, { src: 'tb', from: tb.from, to: tb.to, res: tb.res });
  else if (ad) Object.assign(o, { src: 'admin', from: ad.f, to: ad.t });
  else if (et) Object.assign(o, { src: 'etude', from: et.from, to: et.to });
  else if (o.colette) Object.assign(o, { src: 'colette' }, o.colette);
  else if (o.book) Object.assign(o, { src: 'book' }, o.book);
  else if (hit && hit.r && hit.r.from != null) Object.assign(o, { src: 'cache', from: hit.r.from, to: hit.r.to });
  if (DEEP.has(key)) o.deep = 1;
  return o;
}
// 🔬 tahlil taxtasi uchun KestoG varianti: eng yaxshi yurish + davomi (n yarim yurish)
const PVCACHE = new Map();
function pv(b, side, secs, plies, cb) {
  const key = b.join('') + side + '|' + secs + '|' + plies, c = PVCACHE.get(key); if (c) return cb(c);
  if (!RULES) return cb({ error: 'norules' });
  const line = []; let ev = null, cur = b.slice(), s = side, i = 0, tries = 0;
  (function step() {
    const L = RULES.moves(cur, s);
    if (!L.length || i >= plies) {
      const out = { pv: line, ev, d: line.length };
      if (line.length) { PVCACHE.set(key, out); if (PVCACHE.size > 3000) PVCACHE.delete(PVCACHE.keys().next().value); }
      return cb(out);
    }
    if (L.length === 1) { const m = L[0]; line.push({ path: [m.from].concat(m.path || [m.to]), caps: m.caps.length }); cur = m.board; s = -s; i++; return setImmediate(step); }
    move({ board: cur, side: s, time: i === 0 ? secs : 0.3, maxTime: i === 0 ? secs : 0.3, book: false, tbAlways: true }, r => {
      if (r && r.error === 'busy' && tries++ < 8) return setTimeout(step, 700);
      if (!r || r.from == null) return cb(line.length ? { pv: line, ev, d: line.length } : { error: (r && r.error) || 'x' });
      const m = L.find(x => x.from === r.from && x.to === r.to); if (!m) return cb({ pv: line, ev, d: line.length });
      if (i === 0 && typeof r.ev === 'number') ev = side * r.ev / 200;   // oq nuqtai nazaridan
      line.push({ path: [m.from].concat(m.path || [m.to]), caps: m.caps.length }); cur = m.board; s = -s; i++; step();
    });
  })();
}
module.exports = { pv, peek, clearDeep, move, learn, ponder, review, ponderStat: () => PONDER, load: () => busy, mem: () => ({ cache: CACHE.size, deep: DEEP.size }) };
