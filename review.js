/* review.js — 👹 Monster tahlili: o'yindan keyin o'yinchining har bir yurishini dvigatel bilan tekshiradi,
   xatolarni (?! / ? / ??) va eng yaxshi yurishni ko'rsatadi, xato joyidan qayta o'ynashga imkon beradi.
   window.spReview({ moves, me: 'white'|'black', white, black, winner, bot }) */
(function () {
  if (window.spReview) return;
  var W = window;
  function T(s) { return W.spT ? W.spT(s) : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function start() { var b = [], r, c; for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) b[r].push(r < 3 && (r + c) % 2 ? 2 : (r > 4 && (r + c) % 2 ? 1 : 0)); } return b; }
  function apply(b, m) {
    var n = b.map(function (x) { return x.slice(); }), p = n[m.from.r][m.from.c];
    n[m.from.r][m.from.c] = 0; (m.captures || []).forEach(function (x) { n[x.r][x.c] = 0; });
    if (p === 1 && m.to.r === 0) p = 3; if (p === 2 && m.to.r === 7) p = 4;
    n[m.to.r][m.to.c] = p; return n;
  }
  function sq(p) { return 'abcdefgh'[p.c] + (8 - p.r); }
  function toEng(b) { var a = [], r, c, p; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { p = b[r][c]; a.push(p === 1 ? 1 : p === 2 ? -1 : p === 3 ? 2 : p === 4 ? -2 : 0); } return a; }
  // yurish qadamlari (ketma-ket urish alohida qadam) → to'liq yurishlar
  function group(steps) {
    var out = [], cur = null;
    steps.forEach(function (s, i) {
      var caps = (s.captures || []).length > 0;
      if (cur && cur.cap && caps && cur.last.to.r === s.from.r && cur.last.to.c === s.from.c) { cur.steps.push(s); cur.last = s; cur.end = i + 1; return; }
      cur = { steps: [s], last: s, cap: caps, start: i, end: i + 1 }; out.push(cur);
    });
    return out.map(function (g) {
      var f = g.steps[0].from, t = g.last.to;
      var caps = []; g.steps.forEach(function (x) { (x.captures || []).forEach(function (y) { caps.push(y); }); });
      return { from: f, to: t, captures: caps, cap: g.cap, n: sq(f) + (g.cap ? ':' : '-') + sq(t), start: g.start, end: g.end };
    });
  }
  function legalNote(b, side, j) {   // dvigatel javobi → yozuv (masalan c3-d4)
    try {
      var all = W.allMoves ? W.allMoves(b, side > 0 ? 1 : 2) : [];
      var tryRot = function (rot) {
        var f = rot ? 63 - j.from : j.from, t = rot ? 63 - j.to : j.to;
        for (var i = 0; i < all.length; i++) { var m = all[i]; if (m.from.r === (f >> 3) && m.from.c === (f & 7) && m.to.r === (t >> 3) && m.to.c === (t & 7)) return m; }
        return null;
      };
      var m = tryRot(false) || tryRot(true);
      if (m) return sq(m.from) + (m.captures.length ? ':' : '-') + sq(m.to);
    } catch (e) {}
    return null;
  }
  function ask(b, side, cb, tries) {
    var hd = { 'Content-Type': 'application/json', 'x-init-data': (W.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' };
    fetch('/api/ai/move', { method: 'POST', headers: hd, body: JSON.stringify({ board: toEng(b), side: side, time: 0.8 }) })
      .then(function (r) { return r.status === 429 || r.status === 503 ? { retry: 1 } : r.json(); })
      .then(function (j) {
        if (j && j.retry && (tries || 0) < 40) return setTimeout(function () { ask(b, side, cb, (tries || 0) + 1); }, 900);
        cb(j && typeof j.ev === 'number' ? j : null);
      })
      .catch(function () { if ((tries || 0) < 3) setTimeout(function () { ask(b, side, cb, (tries || 0) + 1); }, 1500); else cb(null); });
  }

  W.spReview = function (g) {
    var TERM = /Terminator/i.test(g.bot || '');
    var me = g.me === 'black' ? -1 : 1, mv = group(g.moves || []);
    var bs = [start()], sides = [1], i;
    var stepB = start();
    for (i = 0; i < mv.length; i++) {
      for (var k = mv[i].start; k < mv[i].end; k++) stepB = apply(stepB, g.moves[k]);
      bs.push(stepB); sides.push(-sides[i]);
    }
    var full = mv.map(function (m) { return { from: m.from, to: m.to, captures: m.captures }; });
    var EV = [], BEST = [], done = 0, total = 0, need = [];
    for (i = 0; i <= mv.length; i++) if (sides[i] === me || (i > 0 && sides[i - 1] === me)) need.push(i);
    total = need.length;
    var old = document.getElementById('spRv'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spRv';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:radial-gradient(circle at 30% 0%,#4a0e2a 0,#24093a 45%,#12061f 100%);color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:system-ui,Roboto,sans-serif';
    document.body.appendChild(ov);
    var css = document.createElement('style');
    css.textContent = '#spRv .cd{background:rgba(255,255,255,.07);border-radius:16px;padding:12px 14px;margin:10px 0}#spRv .bt{border:0;border-radius:12px;padding:10px 12px;color:#fff;font:700 14px system-ui;background:#3b2a8f;margin:8px 6px 0 0}' +
      '#spRv .bt.g{background:linear-gradient(#7fb847,#5f9a2f)}#spRv .bar{height:10px;background:#000a;border-radius:6px;overflow:hidden;margin-top:8px}#spRv .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff3d6e,#ffb02e)}' +
      '#spRv .q{display:inline-block;min-width:34px;text-align:center;border-radius:8px;padding:2px 6px;font-weight:900;margin-right:6px}#spRv .q2{background:#e53935}#spRv .q1{background:#fb8c00}#spRv .q0{background:#fdd835;color:#222}';
    ov.appendChild(css);
    var box = document.createElement('div'); ov.appendChild(box);
    function playFrom(idx) {   // xato oldidagi holatdan Monsterga qarshi qayta o'ynash
      var go = function () { W.spBoard({ moves: full.slice(0, idx), at: idx, white: g.white, black: g.black, winner: g.winner, flip: me < 0, practiceMe: me, practiceT: 3 }); };
      if (W.spBoard) go(); else { var s = document.createElement('script'); s.src = '/board.js?v=' + Date.now(); s.onload = go; document.head.appendChild(s); }
    }
    function view(idx) {
      var go = function () { W.spBoard({ moves: full, at: idx, white: g.white, black: g.black, winner: g.winner, flip: me < 0 }); };
      if (W.spBoard) go(); else { var s = document.createElement('script'); s.src = '/board.js?v=' + Date.now(); s.onload = go; document.head.appendChild(s); }
    }
    function draw() {
      var h = '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:34px">👹</span><div style="flex:1"><b style="font-size:21px">' + T('Monster tahlili') + '</b><div style="font-size:13px;opacity:.75">' + esc(g.white) + ' — ' + esc(g.black) + '</div></div><button id="rvX" class="bt" style="margin:0;background:#2a1f55">✕</button></div>';
      if (done < total) {
        var pc = Math.round(done / Math.max(1, total) * 100);
        h += '<div class="cd"><b>👹 ' + T('Monster partiyangizni tekshirmoqda…') + '</b> ' + done + '/' + total + '<div class="bar"><i style="width:' + pc + '%"></i></div><div style="font-size:13px;opacity:.7;margin-top:6px">' + T('Har bir yurishingiz chuqur tahlil qilinadi. Bu 1–2 daqiqa davom etadi.') + '</div></div>';
      }
      var errs = [], losses = [];
      for (var k = 0; k < mv.length; k++) {
        if (sides[k] !== me || EV[k] == null || EV[k + 1] == null) continue;
        var loss = Math.max(0, me * (EV[k] - EV[k + 1])); losses.push(Math.min(loss, 4));
        var lv = loss >= 1.5 ? 2 : loss >= 0.8 ? 1 : loss >= 0.4 ? 0 : -1;
        if (lv >= 0 && BEST[k] && BEST[k] !== mv[k].n) errs.push({ k: k, lv: lv, loss: loss });
      }
      if (losses.length) {
        var avg = losses.reduce(function (a, b) { return a + b; }, 0) / losses.length, acc = Math.max(0, Math.round(100 - avg * 30));
        var n2 = errs.filter(function (e) { return e.lv === 2; }).length, n1 = errs.filter(function (e) { return e.lv === 1; }).length, n0 = errs.filter(function (e) { return e.lv === 0; }).length;
        h += '<div class="cd" style="text-align:center"><div style="font-size:14px;opacity:.8">' + T('Aniqlik') + '</div><div style="font-size:44px;font-weight:900;color:' + (acc >= 85 ? '#7ee081' : acc >= 65 ? '#ffd54f' : '#ff6b6b') + '">' + acc + '%</div>' +
          '<div><span class="q q2">??</span>' + n2 + ' ' + T('qo‘pol xato') + ' · <span class="q q1">?</span>' + n1 + ' ' + T('xato') + ' · <span class="q q0">?!</span>' + n0 + ' ' + T('noaniqlik') + '</div></div>';
      }
      if (done >= total && !errs.length && losses.length) h += '<div class="cd" style="text-align:center;font-size:18px">🎉 ' + T('Ajoyib! Jiddiy xato topilmadi — Monster sizni hurmat qiladi.') + '</div>';
      if (errs.length) {
        var worst = errs.slice().sort(function (a, b) { return b.loss - a.loss; })[0];
        h += '<button class="bt g" data-p="' + worst.k + '" style="width:100%;font-size:16px;padding:14px;margin:4px 0 6px">🔁 ' + T('Eng katta xatodan qayta o‘ynash') + ' (' + mv[worst.k].n + ')</button>';
        errs.forEach(function (e) {
          var q = ['?!', '?', '??'][e.lv], mn = Math.floor(e.k / 2) + 1;
          h += '<div class="cd"><div><span class="q q' + e.lv + '">' + q + '</span><b>' + mn + '-' + T('yurish') + ':</b> ' + T('Siz') + ' <b>' + mv[e.k].n + '</b> <span style="opacity:.7">(−' + e.loss.toFixed(1) + ')</span></div>' +
            '<div style="margin-top:6px">✅ ' + T('Yaxshisi:') + ' <b style="color:#7ee081">' + esc(BEST[e.k]) + '</b></div>' +
            '<button class="bt" data-v="' + e.k + '">👁 ' + T('Ko‘rish') + '</button><button class="bt g" data-p="' + e.k + '">🔁 ' + T('Shu joydan qayta o‘ynash') + '</button></div>';
        });
      }
      if (TERM) h = h.replace(/👹/g, '🦾').replace(/Монстра/g, 'Терминатора').replace(/Монстр/g, 'Терминатор').replace(/the Monster/g, 'Terminator').replace(/Monster/g, 'Terminator');
      box.innerHTML = h;
      box.querySelector('#rvX').onclick = function () { ov.remove(); };
      [].forEach.call(box.querySelectorAll('[data-p]'), function (b) { b.onclick = function () { playFrom(+b.getAttribute('data-p')); }; });
      [].forEach.call(box.querySelectorAll('[data-v]'), function (b) { b.onclick = function () { view(+b.getAttribute('data-v')); }; });
    }
    draw();
    var qi = 0;
    (function next() {
      if (!document.body.contains(ov) || qi >= need.length) { draw(); return; }
      var idx = need[qi++], b = bs[idx], side = sides[idx];
      var ms = W.allMoves ? W.allMoves(b, side > 0 ? 1 : 2) : [1];
      if (!ms.length) { EV[idx] = side > 0 ? -9.9 : 9.9; done++; draw(); return next(); }
      ask(b, side, function (j) {
        if (j) { EV[idx] = Math.max(-9.9, Math.min(9.9, side * j.ev / 200)); if (side === me) BEST[idx] = legalNote(b, side, j); }
        done++; draw(); next();
      });
    })();
  };
})();
