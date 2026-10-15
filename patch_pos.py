p = "rooms.js"
s = open(p, encoding="utf-8").read()

a1 = "  function newRoom(roomId, tcKey) {"
a2 = '    if (m.type === "roomDrawOffer") {'
if s.count(a1) != 1 or s.count(a2) != 1:
    raise SystemExit("Anchor topilmadi yoki bir nechta: %d %d" % (s.count(a1), s.count(a2)))
if "roomSetPos" in s:
    raise SystemExit("Patch allaqachon qo'llangan")

helper = r'''  let _idf = null;
  function pickIdf() {
    try {
      if (!_idf) {
        const src = require("fs").readFileSync(require("path").join(__dirname, "idf780.js"), "utf8");
        try { _idf = new Function(src + "\n;return IDF780;")(); }
        catch (e) { _idf = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1)); }
      }
    } catch (e) { console.error("[idf780]", e.message); _idf = []; }
    return _idf.length ? _idf[Math.floor(Math.random() * _idf.length)] : null;
  }

'''

handler = r'''    if (m.type === "roomSetPos") {
      if (room.arena || room.locked) return err(c, "Bu o‘yinda pozitsiyani o‘zgartirib bo‘lmaydi"), true;
      if (col !== "white") return err(c, "Pozitsiyani faqat xona egasi (oq) tanlaydi"), true;
      if (room.moves.length > 0 || room.finished) return err(c, "O‘yin boshlangan, pozitsiyani o‘zgartirib bo‘lmaydi"), true;
      if (m.pos === "idf") {
        const o = pickIdf();
        if (!o || !o.board) return err(c, "IDF pozitsiyalari topilmadi"), true;
        room.opening = { id: String(o.id), board: String(o.board), side: o.side === "b" ? "b" : "w" };
      } else {
        room.opening = null;
      }
      room.turn = room.opening && room.opening.side === "b" ? "black" : "white";
      room.first = room.turn;
      pushState(room);
      return true;
    }

'''
s = s.replace(a1, helper + a1, 1).replace(a2, handler + a2, 1)
open(p, "w", encoding="utf-8").write(s)
print("OK")
