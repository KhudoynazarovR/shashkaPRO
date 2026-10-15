p = "roomclient.js"
s = open(p, encoding="utf-8").read()
if "rcZal" in s:
    raise SystemExit("Allaqachon qo'llangan")

T = "'<button id=\"rcChatBtn\">💬 Chat</button>' +"
W = 'var elChatBtn = root.querySelector("#rcChatBtn");'
S = "st.specNames = m.spectatorNames || [];"
for a in (T, W, S, "function renderTc() {", 'send({ type: "roomSetPos"'):
    if s.count(a) != 1:
        raise SystemExit("Anchor topilmadi/ko'p (%d): %s" % (s.count(a), a[:40]))

s = s.replace(T, T + "\n      '<button id=\"rcZal\">🏟 O‘yin zali</button>' +", 1)

s = s.replace(W, W + r'''
    var elZal = root.querySelector("#rcZal");
    elZal.onclick = function () {
      var live = st.color !== "spectator" && !st.finished && bothIn() && st.moves.length > 0;
      if (live && !confirm("O‘yin davom etyapti, zalga chiqsangiz vaqtingiz ketadi. Chiqasizmi?")) return;
      location.href = location.pathname;
    };''', 1)

s = s.replace(S, S + '''
        st.gamesTotal = m.gamesTotal || 1; st.played = m.played || 0; st.seriesScore = m.seriesScore || null;
        st.seriesDone = !!m.seriesDone; st.nextIn = !!m.nextIn; st.rematch = m.rematch || null; st.casual = !!m.casual;''', 1)

extra = r'''function renderExtra() {
      var ex = root.querySelector("#rcEx");
      if (!ex) {
        ex = document.createElement("div"); ex.id = "rcEx";
        ex.style.cssText = "display:none;margin:4px 0 8px;padding:8px 12px;border-radius:10px;background:#1c2733;text-align:center;max-width:min(94vw,520px)";
        var s0 = root.querySelector("#rcStatus"); s0.parentNode.insertBefore(ex, s0.nextSibling);
      }
      ex.innerHTML = "";
      var spec = st.color === "spectator", ser = (st.gamesTotal || 1) > 1;
      function line(t) { var d = document.createElement("div"); d.style.margin = "4px 0"; d.textContent = t; ex.appendChild(d); }
      function btn(t, fn) { var b = document.createElement("button"); b.textContent = t; b.style.margin = "3px"; b.onclick = fn; ex.appendChild(b); }
      if (ser) {
        var sc = st.seriesScore || { white: 0, black: 0 };
        var no = Math.min((st.played || 0) + (st.finished ? 0 : 1), st.gamesTotal);
        line("🏁 Seriya " + (st.seriesDone ? "tugadi" : no + "/" + st.gamesTotal) + " · ⚪ " + sc.white + " – " + sc.black + " ⚫");
        if (st.finished && !st.seriesDone && st.nextIn) line("Keyingi o‘yin 5 soniyadan so‘ng, ranglar almashadi");
      }
      if (!spec && st.casual && st.finished && st.white && st.black && (!ser || st.seriesDone)) {
        if (st.rematch === st.color) {
          line("⏳ Raqib javobi kutilmoqda…");
          btn("Bekor qilish", function () { send({ type: "roomRematchNo", roomId: roomId }); });
        } else if (st.rematch) {
          line("🔁 Raqib qayta o‘ynashni taklif qildi");
          btn("✅ Qabul", function () { send({ type: "roomRematch", roomId: roomId }); });
          btn("❌ Rad", function () { send({ type: "roomRematchNo", roomId: roomId }); });
        } else {
          btn("🔁 Qayta o‘ynash", function () { send({ type: "roomRematch", roomId: roomId }); });
        }
      }
      if (spec) { line("👁 Siz tomoshabinsiz"); btn("🏟 O‘yin zaliga o‘tish", function () { elZal.onclick(); }); }
      ex.style.display = ex.childNodes.length ? "block" : "none";
    }

    function renderTc() { try { renderExtra(); } catch (e) { console.error(e); }'''
s = s.replace("function renderTc() {", extra, 1)

i = s.index('send({ type: "roomSetPos"')
j = s.index("elTc.appendChild(pb);", i)
k = s.index("});", j) + 3
games = r'''
      if (st.casual && (st.played || 0) === 0) {
        var sep2 = document.createElement("span");
        sep2.style.cssText = "flex-basis:100%;height:0";
        elTc.appendChild(sep2);
        [[1, "1 o‘yin"], [2, "2 o‘yin ⇄"], [4, "4 o‘yin ⇄"]].forEach(function (g) {
          var gb = document.createElement("button");
          gb.textContent = g[1];
          gb.style.cssText = (st.gamesTotal || 1) === g[0] ? "background:#2b4a1f;color:#fff;font-weight:bold" : "";
          gb.onclick = function () { send({ type: "roomSetGames", roomId: roomId, games: g[0] }); };
          elTc.appendChild(gb);
        });
      }'''
s = s[:k] + games + s[k:]
open(p, "w", encoding="utf-8").write(s)
print("OK")
