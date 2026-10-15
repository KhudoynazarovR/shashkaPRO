p = "roomclient.js"
s = open(p, encoding="utf-8").read()
if "roomSetPos" in s:
    raise SystemExit("Patch allaqachon qo'llangan")
anchor = 'b.onclick = function () { send({ type: "roomSetTime", roomId: roomId, tc: tc }); };'
if s.count(anchor) != 1:
    raise SystemExit("Anchor topilmadi: %d" % s.count(anchor))
i = s.index(anchor)
j = s.index("});", i) + 3
add = r'''
      elTc.style.flexWrap = "wrap";
      var sep = document.createElement("span");
      sep.style.cssText = "flex-basis:100%;height:0";
      elTc.appendChild(sep);
      [["std", "📋 Standart"], ["idf", "🎲 IDF 780"]].forEach(function (pp) {
        var pb = document.createElement("button");
        pb.textContent = pp[1];
        var on = (pp[0] === "idf") === !!st.opening;
        pb.style.cssText = on ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
        pb.onclick = function () { send({ type: "roomSetPos", roomId: roomId, pos: pp[0] }); };
        elTc.appendChild(pb);
      });'''
s = s[:j] + add + s[j:]
open(p, "w", encoding="utf-8").write(s)
print("OK")
