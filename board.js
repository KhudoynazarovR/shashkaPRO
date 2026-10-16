(function () {
  if (window.spBoard) return;
  var D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function W(p) { return p === 1 || p === 3; }
  function own(p, t) { return t > 0 ? W(p) : (p === 2 || p === 4); }
  function inb(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function cp(b) { return b.map(function (x) { return x.slice(); }); }
  function start() { var b = [], r, c; for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) b[r].push(r < 3 && (r + c) % 2 ? 2 : (r > 4 && (r + c) % 2 ? 1 : 0)); } return b; }
  function empty() { var b = [], r; for (r = 0; r < 8; r++) b.push([0, 0, 0, 0, 0, 0, 0, 0]); return b; }
  function sq(r, c) { return 'abcdefgh'[c] + (8 - r); }
  function isDone(d, r, c) { return d.some(function (x) { return x[0] === r && x[1] === c; }); }
  function dfs(b, r, c, king, t, done, path, out) {
    var any = false;
    D.forEach(function (d) {
      var rr = r + d[0], cc = c + d[1];
      if (king) { while (inb(rr, cc) && b[rr][cc] === 0) { rr += d[0]; cc += d[1]; } }
      if (!inb(rr, cc)) return;
      var q = b[rr][cc];
      if (!q || own(q, t) || isDone(done, rr, cc)) return;
      var lr = rr + d[0], lc = cc + d[1], lands = [];
      while (inb(lr, lc) && b[lr][lc] === 0) { lands.push([lr, lc]); if (!king) break; lr += d[0]; lc += d[1]; }
      if (!lands.length) return;
      any = true;
      var nd = done.concat([[rr, cc]]), sub = [], cont = false;
      lands.forEach(function (l) {
        var nk = king || (t > 0 ? l[0] === 0 : l[0] === 7), o = [];
        var more = dfs(b, l[0], l[1], nk, t, nd, path.concat([l]), o);
        sub.push({ l: l, more: more, o: o, nk: nk });
        if (more) cont = true;
      });
      sub.forEach(function (s) {
        if (cont && !s.more) return;
        if (s.more) s.o.forEach(function (x) { out.push(x); });
        else out.push({ path: path.concat([s.l]), caps: nd, king: s.nk });
      });
    });
    return any;
  }
  function legal(b, t) {
    var caps = [], quiet = [], r, c, p;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      p = b[r][c]; if (!p || !own(p, t)) continue;
      var bb = cp(b); bb[r][c] = 0; var o = [];
      dfs(bb, r, c, p > 2, t, [], [[r, c]], o);
      o.forEach(function (m) { caps.push(m); });
    }
    if (caps.length) return caps;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      p = b[r][c]; if (!p || !own(p, t)) continue;
      if (p > 2) {
        D.forEach(function (d) { var rr = r + d[0], cc = c + d[1]; while (inb(rr, cc) && b[rr][cc] === 0) { quiet.push({ path: [[r, c], [rr, cc]], caps: [], king: true }); rr += d[0]; cc += d[1]; } });
      } else {
        var dr = t > 0 ? -1 : 1;
        [-1, 1].forEach(function (dc) { var rr = r + dr, cc = c + dc; if (inb(rr, cc) && b[rr][cc] === 0) quiet.push({ path: [[r, c], [rr, cc]], caps: [], king: t > 0 ? rr === 0 : rr === 7 }); });
      }
    }
    return quiet;
  }
  function applyM(b, m) {
    var n = cp(b), f = m.path[0], e = m.path[m.path.length - 1], p = n[f[0]][f[1]];
    n[f[0]][f[1]] = 0; m.caps.forEach(function (x) { n[x[0]][x[1]] = 0; });
    if (m.king && p < 3) p = W(p) ? 3 : 4;
    n[e[0]][e[1]] = p; return n;
  }
  function toEng(b) { var a = [], r, c, p; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { p = b[r][c]; a.push(p === 1 ? 1 : p === 2 ? -1 : p === 3 ? 2 : p === 4 ? -2 : 0); } return a; }
  function kf(h) { return toEng(h.b).join('') + h.t; }
  function evFmt(x) { if (x == null) return '–'; x = Math.max(-9.9, Math.min(9.9, x)); return (x > 0 ? '+' : '') + x.toFixed(1); }
  function note(m) { return m.path.map(function (x) { return sq(x[0], x[1]); }).join(m.caps.length ? ':' : '-'); }
  function hd() { return { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  var S = { t: 0.3, arrow: true, bar: true, engine: true };
  try { var _s = JSON.parse(localStorage.getItem('spBdS') || '{}'); for (var _k in _s) S[_k] = _s[_k]; } catch (e) {}
  function sv() { try { localStorage.setItem('spBdS', JSON.stringify(S)); } catch (e) {} }
  function ask(h, cb, tries) {
    tries = tries || 0;
    fetch('/api/ai/move', { method: 'POST', headers: hd(), body: JSON.stringify({ board: toEng(h.b), side: h.t, time: S.t }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.from != null) cb({ ev: typeof j.ev === 'number' ? h.t * j.ev / 200 : null, best: { from: [j.from >> 3, j.from & 7], to: [j.to >> 3, j.to & 7] } });
        else if (j && j.error === 'busy' && tries < 5) setTimeout(function () { ask(h, cb, tries + 1); }, 800);
        else cb(null);
      }).catch(function () { cb(null); });
  }
  function pcH(p, sz) {
    var w = W(p);
    return '<div style="width:' + sz + ';height:' + sz + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (w ? '#9a9a9a' : '#000') + ';background:' + (w ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + ';box-sizing:border-box">' + (p > 2 ? '♛' : '') + '</div>';
  }
  window.spBoard = function () {
    var hist = [{ b: start(), t: 1, m: null }], cur = 0, flip = false, sel = null, EV = {}, busyK = {}, FAIL = {}, allRun = false, prog = '';
    var panel = null, E = null, PL = null;
    var old = document.getElementById('spBd'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spBd';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    function alive() { return document.body.contains(ov); }
    function evOf(i) {
      var h = hist[i], k = kf(h);
      if (EV[k]) return EV[k].ev;
      if (!legal(h.b, h.t).length) return h.t > 0 ? -9.9 : 9.9;
      return null;
    }
    function go(i) { cur = Math.max(0, Math.min(hist.length - 1, i)); sel = null; draw(); analyzeCur(); }
    function analyzeCur() {
      if (!S.engine || PL || panel === 'edit') return;
      var h = hist[cur], k = kf(h);
      if (EV[k] || busyK[k] || FAIL[k]) return;
      if (!legal(h.b, h.t).length) return;
      busyK[k] = 1;
      ask(h, function (r) { delete busyK[k]; if (r) EV[k] = r; else FAIL[k] = 1; if (alive()) draw(); });
    }
    function runAll() {
      if (allRun) return; allRun = true; var i = 0;
      (function nx() {
        if (!alive()) { allRun = false; return; }
        if (i >= hist.length) { allRun = false; prog = ''; draw(); return; }
        var h = hist[i], k = kf(h); i++;
        if (EV[k] || !legal(h.b, h.t).length) { nx(); return; }
        ask(h, function (r) { if (r) EV[k] = r; prog = i + '/' + hist.length; draw(); nx(); });
      })();
    }
    function engMove() {
      var h = hist[cur]; if (!PL || h.t === PL.me) return;
      var ms = legal(h.b, h.t); if (!ms.length) return;
      PL.th = true; PL.err = false; draw();
      ask(h, function (r) {
        if (!PL || hist[cur] !== h || !alive()) return;
        PL.th = false;
        if (!r) { PL.err = true; draw(); return; }
        var m = ms.filter(function (x) { var e = x.path[x.path.length - 1]; return x.path[0][0] === r.best.from[0] && x.path[0][1] === r.best.from[1] && e[0] === r.best.to[0] && e[1] === r.best.to[1]; })[0] || ms[0];
        play(m, true);
      });
    }
    function play(m, fromEng) {
      var h = hist[cur];
      hist = hist.slice(0, cur + 1);
      hist.push({ b: applyM(h.b, m), t: -h.t, m: m, n: note(m) });
      cur++; sel = null; draw();
      if (PL) { if (!fromEng) setTimeout(engMove, 60); } else analyzeCur();
    }
    function click(r, c) {
      if (panel === 'edit') {
        if ((r + c) % 2 === 0) return;
        var tl = E.tool;
        if (tl === 1 && r === 0) tl = 3; if (tl === 2 && r === 7) tl = 4;
        E.b[r][c] = tl; E.msg = ''; draw(); return;
      }
      var h = hist[cur];
      if (PL && (h.t !== PL.me || PL.th)) return;
      if (sel) {
        var m = sel.moves.filter(function (x) { var e = x.path[x.path.length - 1]; return e[0] === r && e[1] === c; })[0];
        if (m) { play(m); return; }
      }
      var p = h.b[r][c];
      if (p && own(p, h.t)) {
        var ms = legal(h.b, h.t).filter(function (x) { return x.path[0][0] === r && x.path[0][1] === c; });
        sel = { r: r, c: c, moves: ms };
      } else sel = null;
      draw();
    }
    function mark(i) {
      var a = evOf(i), b = evOf(i + 1);
      if (a == null || b == null) return '';
      var loss = (hist[i].t) * (a - b);
      return loss >= 1.5 ? '??' : loss >= 0.8 ? '?' : loss >= 0.4 ? '?!' : '';
    }
    function newPos(b, t) { hist = [{ b: cp(b), t: t, m: null }]; cur = 0; sel = null; PL = null; panel = null; E = null; draw(); analyzeCur(); }
    function cnt(b, f) { var n = 0; b.forEach(function (row) { row.forEach(function (p) { if (p && f(p)) n++; }); }); return n; }
    var A = {
      menu: function () { panel = panel ? null : 'menu'; E = null; },
      eng: function () { S.engine = !S.engine; sv(); },
      flip: function () { flip = !flip; },
      edit: function () { var h = hist[cur]; E = { b: cp(h.b), t: h.t, tool: 1, msg: '' }; panel = 'edit'; PL = null; },
      play: function () { panel = 'play'; },
      cont: function () { var h = hist[cur]; newPos(h.b, h.t); return 1; },
      learn: function () { panel = 'learn'; },
      set: function () { panel = 'set'; },
      stop: function () { PL = null; panel = 'menu'; },
      retry: function () { setTimeout(engMove, 30); },
      side: function () { E.t = -E.t; },
      clr: function () { E.b = empty(); E.msg = ''; },
      init: function () { E.b = start(); E.t = 1; E.msg = ''; },
      cancel: function () { E = null; panel = 'menu'; },
      ok: function () {
        var w = cnt(E.b, W), bl = cnt(E.b, function (p) { return !W(p); });
        if (!w || !bl) { E.msg = 'Ikkala tomonda ham kamida bitta dona bo‘lsin'; return; }
        newPos(E.b, E.t); return 1;
      }
    };
    function act(a) {
      var p = a.split(':'), n = p[0], v = p[1], r;
      if (n === 'tool') { E.tool = +v; }
      else if (n === 'st') { S.t = +v; sv(); }
      else if (n === 'tog') { S[v] = !S[v]; sv(); }
      else if (n === 'me') {
        PL = { me: +v, th: false, err: false }; panel = null;
        hist = hist.slice(0, cur + 1); sel = null; draw();
        if (hist[cur].t !== PL.me) setTimeout(engMove, 60);
        return;
      }
      else if (A[n]) { r = A[n](); if (r) return; if (n === 'eng' || n === 'cancel') analyzeCur(); }
      draw();
      if (n === 'eng' || n === 'tog') analyzeCur();
    }
    function draw() {
      var st = ov.scrollTop, h = hist[cur], k = kf(h), e = EV[k], ed = panel === 'edit';
      var B = ed ? E.b : h.b, ms = ed ? [] : legal(h.b, h.t), over = !ed && !ms.length;
      var en = S.engine && !PL && !ed;
      var x = en ? evOf(cur) : null, pc = 50 + Math.max(-5, Math.min(5, x == null ? 0 : x)) * 10, s = '';
      var bst = 'border:0;border-radius:14px;padding:12px 16px;background:#6b5cf0;color:#fff;font-size:20px';
      var sm = 'border:0;border-radius:12px;padding:10px 12px;background:#262b66;color:#fff;font-size:14px;margin:3px';
      s += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>🔬 Tahlil taxtasi</b><button id="bdX" style="border:0;border-radius:12px;padding:8px 14px;background:#262b66;color:#fff;font-size:16px">⬅️</button></div>';
      if (S.bar) s += '<div style="width:min(94vw,480px);height:10px;margin:0 auto 8px;background:#222;border-radius:5px;overflow:hidden"><div style="width:' + pc + '%;height:100%;background:#eee"></div></div>';
      s += '<div style="position:relative;width:min(94vw,480px);margin:0 auto;box-sizing:border-box;border:4px solid #8a4a1c;border-radius:6px"><div style="display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);aspect-ratio:1;overflow:hidden">';
      var lm = (!ed && h.m) ? [h.m.path[0], h.m.path[h.m.path.length - 1]] : [], rr, cc, r, c, p, hl, dot;
      for (rr = 0; rr < 8; rr++) for (cc = 0; cc < 8; cc++) {
        r = flip ? 7 - rr : rr; c = flip ? 7 - cc : cc; p = B[r][c];
        hl = ''; dot = false;
        lm.forEach(function (q) { if (q[0] === r && q[1] === c) hl = 'box-shadow:inset 0 0 0 3px #f5d92b;'; });
        if (sel && !ed && sel.r === r && sel.c === c) hl = 'box-shadow:inset 0 0 0 4px #4ade80;';
        if (sel && !ed) sel.moves.forEach(function (m) { var q = m.path[m.path.length - 1]; if (q[0] === r && q[1] === c) dot = true; });
        s += '<div data-r="' + r + '" data-c="' + c + '" style="background:' + ((r + c) % 2 ? '#7b2f13' : '#f3bb86') + ';' + hl + 'display:flex;align-items:center;justify-content:center">';
        if (p) s += pcH(p, '80%');
        else if (dot) s += '<div style="width:30%;height:30%;border-radius:50%;background:#4ade80;opacity:.8"></div>';
        s += '</div>';
      }
      s += '</div>';
      if (en && S.arrow && e && e.best && !over) {
        var f = e.best.from, t2 = e.best.to;
        var x1 = (flip ? 7 - f[1] : f[1]) + .5, y1 = (flip ? 7 - f[0] : f[0]) + .5, x2 = (flip ? 7 - t2[1] : t2[1]) + .5, y2 = (flip ? 7 - t2[0] : t2[0]) + .5;
        var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1; x2 -= dx / L * .3; y2 -= dy / L * .3;
        s += '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs><marker id="bdAh" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#3fb950"/></marker></defs><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#3fb950" stroke-width=".2" stroke-linecap="round" opacity=".85" marker-end="url(#bdAh)"/></svg>';
      }
      s += '</div>';
      var info = '';
      if (ed) info = '✏️ Taxta muharriri';
      else {
        info = (h.t > 0 ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ';
        if (over) info = '🏁 O‘yin tugadi: ' + (h.t > 0 ? '⚫ Qora' : '⚪ Oq') + ' yutdi';
        else if (PL) info += PL.err ? 'Dvigatel javob bermadi <button data-a="retry" style="border:0;border-radius:10px;padding:6px 10px;background:#2e9d6b;color:#fff">Qayta</button>' : PL.th ? '⏳ KestoG o‘ylayapti...' : (h.t === PL.me ? 'Sizning yurishingiz' : '');
        else if (!S.engine) info += 'Dvigatel o‘chiq';
        else if (e && e.best) info += 'Eng yaxshi: <b>' + sq(e.best.from[0], e.best.from[1]) + (ms[0] && ms[0].caps.length ? ':' : '-') + sq(e.best.to[0], e.best.to[1]) + '</b>';
        else if (busyK[k]) info += '⏳ Dvigatel o‘ylayapti...';
        else if (FAIL[k]) info += 'Baho olinmadi <button data-a="eng" style="display:none"></button><button id="bdRt" style="border:0;border-radius:10px;padding:6px 10px;background:#2e9d6b;color:#fff">Qayta</button>';
      }
      s += '<div style="margin:8px 0;font-size:15px">' + info + '</div>';
      s += '<div style="display:flex;gap:8px;justify-content:center"><button id="bd0" style="' + bst + '">⏮</button><button id="bd1" style="' + bst + '">◀</button><button id="bd2" style="' + bst + '">▶</button><button id="bd3" style="' + bst + '">⏭</button></div>';
      var tg = '<span data-a="eng" style="display:inline-block;width:46px;height:26px;border-radius:13px;background:' + (S.engine ? '#6aa22a' : '#555') + ';position:relative;vertical-align:middle"><span style="position:absolute;top:3px;' + (S.engine ? 'right:3px' : 'left:3px') + ';width:20px;height:20px;border-radius:50%;background:#fff"></span></span>';
      s += '<div style="display:flex;gap:8px;margin-top:10px"><div style="flex:1;background:#2c4a1c;border-radius:12px 12px 0 0;padding:10px;display:flex;justify-content:space-between;align-items:center">' + tg + '<b style="font-size:22px">' + (en ? evFmt(x) : '–') + '</b></div><div data-a="menu" style="flex:1;background:' + (panel ? '#6aa22a' : '#1d1f3a') + ';border-radius:12px 12px 0 0;padding:10px;font-size:22px;cursor:pointer">☰</div></div>';
      if (panel) {
        s += '<div style="background:#2a3b22;border-radius:0 0 12px 12px;padding:12px;text-align:left">';
        var mi = function (a, ic, tx) { return '<div data-a="' + a + '" style="display:flex;align-items:center;gap:10px;padding:10px 4px;cursor:pointer;font-size:15px"><span style="font-size:24px;width:32px;text-align:center">' + ic + '</span>' + tx + '</div>'; };
        if (panel === 'menu') {
          s += '<div style="display:grid;grid-template-columns:1fr 1fr">' + mi('flip', '🔄', 'Taxtani aylantirish') + mi('edit', '✏️', 'Taxta muharriri') + mi('play', '🎯', 'Kompyuter bilan mashq qilish') + mi('cont', '♟', 'Shu pozitsiyadan davom etish') + mi('learn', '📚', 'O‘rganish') + mi('set', '⚙️', 'Sozlamalar') + '</div>';
          s += '<div style="text-align:center;margin-top:6px"><button id="bdA" style="' + sm + ';background:#2e9d6b">📊 Hammasini baholash' + (prog ? ' ' + prog : '') + '</button><button id="bdN" style="' + sm + ';background:#8a2b3a">🗑 Yangi o‘yin</button></div>';
        } else if (panel === 'edit') {
          s += '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:8px">';
          [[1, 1], [3, 3], [2, 2], [4, 4], [0, 0]].forEach(function (t) {
            s += '<div data-a="tool:' + t[0] + '" style="padding:6px;border-radius:10px;background:' + (E.tool === t[0] ? '#6aa22a' : '#1d1f3a') + ';width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">' + (t[0] ? pcH(t[1], '30px') : '<span style="font-size:22px">🧽</span>') + '</div>';
          });
          s += '</div><div style="text-align:center"><button data-a="side" style="' + sm + '">Yuradi: ' + (E.t > 0 ? '⚪ Oq' : '⚫ Qora') + '</button><button data-a="clr" style="' + sm + '">Tozalash</button><button data-a="init" style="' + sm + '">Boshlang‘ich</button></div>';
          if (E.msg) s += '<div style="color:#ff8a8a;text-align:center;margin:6px">' + E.msg + '</div>';
          s += '<div style="text-align:center;margin-top:6px"><button data-a="ok" style="' + sm + ';background:#2e9d6b">✔ Tayyor</button><button data-a="cancel" style="' + sm + ';background:#8a2b3a">✖ Bekor</button></div>';
        } else if (panel === 'play') {
          s += '<div style="text-align:center"><div style="margin-bottom:8px">Shu pozitsiyadan KestoG ga qarshi o‘ynang. Siz kim bilan?</div><button data-a="me:1" style="' + sm + '">⚪ Oq bilan</button><button data-a="me:-1" style="' + sm + '">⚫ Qora bilan</button><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
        } else if (panel === 'learn') {
          s += '<div style="font-size:14px;line-height:1.6"><b>Rus shashkasi qoidalari</b><br>• Taxta 8×8, donalar faqat to‘q kataklarda.<br>• Oddiy dona oldinga diagonal yuradi.<br>• Urish <b>majburiy</b>, ham oldinga, ham orqaga. Ko‘p urish imkoni bo‘lsa, zanjirni oxirigacha urish kerak.<br>• Dona oxirgi qatorga yetsa <b>damka</b> bo‘ladi.<br>• Damka diagonal bo‘ylab istalgan masofaga yuradi va uradi.<br>• Urish paytida damka bo‘lgan dona o‘sha yurishda damka kabi davom etadi.<br>• Dona qolmasa yoki yura olmasa, o‘yinchi yutqazadi.<br><b>Baho:</b> +1.0 ≈ oq tomonda bitta dona ustunlik. <b>?!</b> noaniq, <b>?</b> xato, <b>??</b> qo‘pol xato.</div><div style="text-align:center;margin-top:8px"><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
        } else if (panel === 'set') {
          s += '<div style="margin-bottom:6px">Dvigatel vaqti (soniya):</div><div>';
          [0.2, 0.3, 0.5, 1, 2].forEach(function (v) { s += '<button data-a="st:' + v + '" style="' + sm + ';background:' + (S.t === v ? '#6aa22a' : '#262b66') + '">' + v + '</button>'; });
          s += '</div><div style="margin-top:6px"><button data-a="tog:arrow" style="' + sm + ';background:' + (S.arrow ? '#6aa22a' : '#262b66') + '">Strelka: ' + (S.arrow ? 'yoniq' : 'o‘chiq') + '</button><button data-a="tog:bar" style="' + sm + ';background:' + (S.bar ? '#6aa22a' : '#262b66') + '">Baho chizig‘i: ' + (S.bar ? 'yoniq' : 'o‘chiq') + '</button></div>';
          s += '<div style="font-size:12px;opacity:.7;margin-top:4px">Vaqt oshsa, baho aniqroq, lekin sekinroq.</div><div style="text-align:center;margin-top:8px"><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
        }
        s += '</div>';
      }
      if (PL) s += '<div style="margin-top:8px"><button data-a="stop" style="' + sm + ';background:#8a2b3a">⏹ Mashqni to‘xtatish</button></div>';
      s += '<div style="margin-top:12px;text-align:left;font-size:15px;line-height:2.2">';
      for (var i = 0; i < hist.length - 1; i++) {
        if (i % 2 === 0) s += '<span style="opacity:.6;margin-left:6px">' + (i / 2 + 1) + '.</span> ';
        var mk = (S.engine && !PL) ? mark(i) : '', bad = mk === '??' ? '#ff6b6b' : mk ? '#ffb347' : '#fff';
        s += '<span data-g="' + (i + 1) + '" style="display:inline-block;padding:2px 8px;margin:2px;border-radius:8px;background:' + (cur === i + 1 ? '#6b5cf0' : '#262b66') + ';color:' + bad + '">' + hist[i + 1].n + mk + ((S.engine && !PL) ? ' <small style="opacity:.7;color:#fff">' + evFmt(evOf(i + 1)) + '</small>' : '') + '</span>';
      }
      s += '</div>';
      ov.innerHTML = s;
      function on(id, f) { var el = ov.querySelector(id); if (el) el.onclick = f; }
      on('#bdX', function () { ov.remove(); });
      on('#bd0', function () { go(0); }); on('#bd1', function () { go(cur - 1); });
      on('#bd2', function () { go(cur + 1); }); on('#bd3', function () { go(hist.length - 1); });
      on('#bdA', runAll);
      on('#bdN', function () { newPos(start(), 1); });
      on('#bdRt', function () { delete FAIL[kf(hist[cur])]; analyzeCur(); draw(); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-a]'), function (el) { el.onclick = function () { act(el.getAttribute('data-a')); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-r]'), function (el) { el.onclick = function () { click(+el.getAttribute('data-r'), +el.getAttribute('data-c')); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-g]'), function (el) { el.onclick = function () { go(+el.getAttribute('data-g')); }; });
      ov.scrollTop = st;
    }
    draw(); analyzeCur();
  };
})();
