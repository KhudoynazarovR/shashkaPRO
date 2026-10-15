def patch(path, pairs):
    s = open(path, encoding="utf-8").read()
    for old, new in pairs:
        if s.count(old) != 1:
            raise SystemExit("%s: anchor topilmadi/ko'p: %d -> %s" % (path, s.count(old), old[:50]))
    for old, new in pairs:
        s = s.replace(old, new, 1)
    open(path, "w", encoding="utf-8").write(s)

patch("rooms.js", [(
 "      spectators: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).length,\n",
 "      spectators: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).length,\n"
 "      spectatorNames: [...room.members].filter(id => !colorOf(room, clients.get(id) || {})).map(id => room.names.get(id) || \"Mehmon\").slice(0, 8),\n"
)])

names = '((st.specNames || []).length ? " (" + st.specNames.join(", ") + ")" : "")'
patch("roomclient.js", [
 ("st.spectators = m.spectators || 0;",
  "st.spectators = m.spectators || 0;\n        st.specNames = m.spectatorNames || [];"),
 ('(st.spectators ? "👁 Tomoshabinlar: " + st.spectators : "")',
  '(st.spectators ? "👁 Tomoshabinlar: " + st.spectators + ' + names + ' : "")'),
 ('" · " + st.spectators + " ta tomoshabin"',
  '" · " + st.spectators + " ta tomoshabin" + ' + names),
])
print("OK")
