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
function run(input, secs, cb) { queue.push({ input: input, secs: secs, cb: cb }); next(); }
function newGame(b) { let n = 0; for (const v of b) if (Math.abs(v) === 1) n++; return n === 24 && !b.some(v => Math.abs(v) === 2); }

