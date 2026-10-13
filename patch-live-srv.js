const fs = require('fs');
let s = fs.readFileSync('rooms.js', 'utf8');
if (s.includes('roomLive')) { console.log('Allaqachon bor'); process.exit(0); }
const re = /(if \(!m \|\| typeof m\.type !== "string" \|\| !m\.type\.startsWith\("room"\)\) return false;)/;
const n = s.split(re).length - 1;
if (n !== 2) { console.log('XATO: joy topilmadi (' + (n / 2) + ')'); process.exit(1); }
s = s.replace(re, (all) => all + `
    if (m.type === "roomLive") {
      const list = [];
      for (const r of rooms.values()) {
        if (!r.white || !r.black || r.finished) continue;
        list.push({
          id: r.id, white: r.white.name, black: r.black.name, tc: r.tc,
          moves: (r.moves || []).length,
          spectators: [...r.members].filter(id => !colorOf(r, clients.get(id) || {})).length
        });
      }
      list.sort((a, b) => b.spectators - a.spectators || b.moves - a.moves);
      send(c.ws, { type: "roomLive", list: list.slice(0, 30) });
      return true;
    }`);
fs.writeFileSync('rooms.js', s);
console.log('TAYYOR');
