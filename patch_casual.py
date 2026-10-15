p = "rooms.js"
s = open(p, encoding="utf-8").read()
if "room.casual" in s:
    raise SystemExit("Allaqachon qo'llangan")
a = "room = newRoom(roomId, DEFAULT_TC);"
b = "nextIn: !!room.nextTimer, rematch: room.rematch || null"
if s.count(a) != 1 or s.count(b) != 1:
    raise SystemExit("Anchor: %d %d" % (s.count(a), s.count(b)))
s = s.replace(a, a + " room.casual = true;", 1).replace(b, b + ", casual: !!room.casual", 1)
for key in ('m.type === "roomSetGames"', 'm.type === "roomRematch")'):
    i = s.find(key)
    j = s.find("room.arena || room.locked", i)
    if i < 0 or j < 0 or j - i > 300:
        raise SystemExit("Gate topilmadi: " + key)
    s = s[:j] + "!room.casual || " + s[j:]
open(p, "w", encoding="utf-8").write(s)
print("OK")
