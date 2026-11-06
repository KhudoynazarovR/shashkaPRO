// ShashkaPRO: "kim nima qilyapti" (holat ko'rsatkichi + Tomosha + admin uchun global.__lbPresence)
// Ishlatish (loyiha papkasida): node patch-presence.js [lobby.js yo'li] [lobbyclient.js yo'li]
const fs = require("fs");
const cp = require("child_process");
const SRV = process.argv[2] || "lobby.js";
const CLI = process.argv[3] || "lobbyclient.js";

const SERVER_BLOCK = String.raw`
  // === PRESENCE: kim nima qilyapti (patch-presence.js) ===
  const _uidRooms = new Map();   // uid -> Set(roomId)  (lobbi orqali ochilgan xonalar)
  const _actSince = new Map();   // uid -> { act, since }
  try {
    if (roomsApi && typeof roomsApi.create === 'function' && !roomsApi.__presenceWrapped) {
      const _origCreate = roomsApi.create;
      roomsApi.create = function (roomId, opts) {
        try {
          for (const side of [opts && opts.white, opts && opts.black]) {
            if (side && side.uid != null) {
              const k = String(side.uid);
              if (!_uidRooms.has(k)) _uidRooms.set(k, new Set());
              _uidRooms.get(k).add(String(roomId));
            }
          }
        } catch (e) {}
        return _origCreate.apply(this, arguments);
      };
      roomsApi.__presenceWrapped = true;
    }
  } catch (e) {}
  function _liveRoomOf(uid) {
    const set = _uidRooms.get(String(uid));
    if (!set) return null;
    let best = null;
    for (const id of [...set]) {
      let r = null;
      try { r = roomsApi.get(id); } catch (e) {}
      if (!r || r.finished) { set.delete(id); continue; }
      best = r;
    }
    if (!set.size) _uidRooms.delete(String(uid));
    return best;
  }
  function _enrichPresence(list) {
    const now = Date.now();
    for (const p of list) {
      let act = 'idle', room = null, opp = null, plies = 0;
      const r = p.bot ? null : _liveRoomOf(p.uid);
      if (r) {
        act = r.arena ? 'arena' : 'game';
        const me = String(p.uid);
        const other = (r.white && String(r.white.uid) === me) ? r.black : r.white;
        opp = other && other.name ? String(other.name) : null;
        room = String(r.id).replace(/[^A-Za-z0-9_-]/g, '');
        plies = r.plies || (Array.isArray(r.moves) ? r.moves.length : 0);
        p.busy = true;
      } else if (p.busy) {
        act = 'room';
      } else {
        for (const t of tournaments.values()) {
          if (t.type === 'arena' && t.status === 'running') {
            const tp = t.players && t.players.get(p.uid);
            if (tp && !tp.withdrawn) { act = 'wait'; break; }
          }
        }
      }
      const prev = _actSince.get(p.uid);
      if (!prev || prev.act !== act) _actSince.set(p.uid, { act: act, since: now });
      p.act = act;
      if (room) p.room = room;
      if (opp) p.opp = opp;
      if (plies) p.plies = plies;
      p.sec = Math.floor((now - _actSince.get(p.uid).since) / 1000);
    }
    const live = new Set(list.map(function (x) { return x.uid; }));
    for (const k of [..._actSince.keys()]) if (!live.has(k)) _actSince.delete(k);
  }
  // Admin paneli uchun: global.__lbPresence() -> { total, byAct, rows }
  global.__lbPresence = function () {
    const list = playersList();
    const conns = {};
    for (const c of lbClients()) conns[c.lb.uid] = (conns[c.lb.uid] || 0) + 1;
    const rows = list.map(function (p) { return Object.assign({}, p, { conns: conns[p.uid] || 0 }); });
    const byAct = {};
    rows.forEach(function (p) { byAct[p.act] = (byAct[p.act] || 0) + 1; });
    return { total: rows.length, byAct: byAct, rows: rows, at: Date.now() };
  };
  // === /PRESENCE ===
`;

const plan = [
  { file: SRV, edits: [
    { a: "function createLobby({ send, clients, roomsApi }) {",
      b: "function createLobby({ send, clients, roomsApi }) {" + SERVER_BLOCK },
    { a: "return [...seen.values()];",
      b: "const _out = [...seen.values()];\n    try { _enrichPresence(_out); } catch (e) {}\n    return _out;" }
  ]},
  { file: CLI, edits: [
    { a: '(p.busy ? " 🟡" : "")',
      b: '(p.busy ? " " + ({ game: "🎮", arena: "🏆", room: "🟡" }[p.act] || "🟡") : "")' },
    { a: '(p.busy ? " · o‘ynayapti" : "")',
      b: '(p.busy ? " · " + (p.act === "room" ? "xonada" : p.act === "arena" ? "arenada" : "o‘ynayapti") + (p.opp ? " · " + esc(p.opp) : "") + (p.sec >= 60 ? " · " + Math.floor(p.sec / 60) + " daq" : "") : (p.act === "wait" ? " · arena kutmoqda" : ""))' },
    { a: '(p.busy ? "" : (',
      b: '(p.busy ? (p.room ? \'<a class="lbinv" style="background:#3b3f8f;text-decoration:none;color:#fff" href="?room=\' + p.room + \'">👁 Tomosha</a>\' : "") : (' }
  ]}
];

// 1) hammasini avval tekshiramiz
const texts = {};
for (const f of plan) {
  texts[f.file] = fs.readFileSync(f.file, "utf8");
  for (const e of f.edits) {
    const n = texts[f.file].split(e.a).length - 1;
    if (n !== 1) { console.error("TO'XTADI (" + f.file + "): kutilgan 1 ta moslik, topildi " + n + ":\n  " + e.a.slice(0, 90)); process.exit(1); }
  }
}
// 2) zaxira + yozish + sintaksis tekshiruvi (xato bo'lsa avtomatik qaytaradi)
for (const f of plan) {
  fs.copyFileSync(f.file, f.file + ".before-presence");
  let s = texts[f.file];
  for (const e of f.edits) s = s.split(e.a).join(e.b);
  fs.writeFileSync(f.file, s);
}
let ok = true;
for (const f of plan) {
  try { cp.execFileSync(process.execPath, ["--check", f.file], { stdio: "pipe" }); }
  catch (err) { ok = false; console.error("SINTAKSIS XATO: " + f.file + "\n" + String(err.stderr || err.message).slice(0, 400)); }
}
if (!ok) {
  for (const f of plan) fs.copyFileSync(f.file + ".before-presence", f.file);
  console.error("Hammasi avvalgi holatga qaytarildi.");
  process.exit(1);
}
console.log("OK: " + plan.map(function (f) { return f.file; }).join(" va ") + " yangilandi. Zaxira: *.before-presence");
