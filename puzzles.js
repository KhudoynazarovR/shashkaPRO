(function () {
  if (window.spPuzzles) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var LV = ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'];
  var BS = 'border:0;border-radius:12px;padding:10px 14px;background:#6b5cf0;color:#fff;font-size:15px;margin:4px';
  var BG = 'border:0;border-radius:12px;padding:10px 14px;background:#262b66;color:#fff;font-size:15px;margin:4px';
  var ov = null, S = { list: [], solved: [] };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ins(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function sideOf(p) { return p === 1 || p === 3 ? 'w' : (p === 2 || p === 4 ? 'b' : null); }
  function blank() { var b = [], r; for (r = 0; r < 8; r++) b.push([0, 0, 0, 0, 0, 0, 0, 0]); return b; }
  function copy(b) { return b.map(function (x) { return x.slice(); }); }
  function std() { var b = blank(), r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = r < 3 ? 2 : (r > 4 ? 1 : 0); return b; }

  // ---- qoidalar (rus shashkasi): majburiy urish, dama uzoqqa yuradi
  function caps(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p);
    DIRS.forEach(function (d) {
      var nr, nc;
      if (p < 3) {
        var mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
        if (ins(lr, lc) && b[mr][mc] && sideOf(b[mr][mc]) !== me && !b[lr][lc]) out.push({ f: [r, c], t: [lr, lc], x: [mr, mc] });
      } else {
        nr = r + d[0]; nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { nr += d[0]; nc += d[1]; }
        if (ins(nr, nc) && sideOf(b[nr][nc]) !== me) {
          var er = nr, ec = nc; nr += d[0]; nc += d[1];
          while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc], x: [er, ec] }); nr += d[0]; nc += d[1]; }
        }
      }
    });
    return out;
  }
  function simple(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p);
    DIRS.forEach(function (d) {
      if (p > 2) {
        var nr = r + d[0], nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc] }); nr += d[0]; nc += d[1]; }
      } else if (d[0] === (me === 'w' ? -1 : 1)) {
        var tr = r + d[0], tc = c + d[1];
        if (ins(tr, tc) && !b[tr][tc]) out.push({ f: [r, c], t: [tr, tc] });
      }
    });
    return out;
  }
  function legal(b, side, forced) {
    var cs = [], ss = [], r, c;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      if (sideOf(b[r][c]) !== side) continue;
      if (forced && (forced[0] !== r || forced[1] !== c)) continue;
      cs = cs.concat(caps(b, r, c));
      if (!forced) ss = ss.concat(simple(b, r, c));
    }
    return cs.length ? cs : ss;
  }
  function adv(g, s) {
    var n = copy(g.b), p = n[s.f[0]][s.f[1]];
    n[s.f[0]][s.f[1]] = 0;
    if (s.x) n[s.x[0]][s.x[1]] = 0;
    if (p === 1 && s.t[0] === 0) p = 3;
    if (p === 2 && s.t[0] === 7) p = 4;
    n[s.t[0]][s.t[1]] = p;
    var more = s.x && caps(n, s.t[0], s.t[1]).length > 0;
    return { b: n, side: more ? g.side : (g.side === 'w' ? 'b' : 'w'), forced: more ? [s.t[0], s.t[1]] : null };
  }
  function findStep(lg, f, t) {
    for (var i = 0; i < lg.length; i++) if (lg[i].f[0] === f[0] && lg[i].f[1] === f[1] && lg[i].t[0] === t[0] && lg[i].t[1] === t[1]) return lg[i];
    return null;
  }

  // ---- umumiy oyna
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); });
  }
  function on(sel, fn) { var e = ov.querySelector(sel); if (e) e.onclick = fn; }
  function head(t, extra) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>' + t + '</span><span>' + (extra || '') + '<button id="pzBack" style="' + BG + '">⬅️</button></span></div>';
  }
  function boardHtml(b, o) {
    o = o || {};
    var h = '<div id="pzB" style="width:min(94vw,460px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #8a4a1c;border-radius:6px;overflow:hidden">', r, c;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      var dark = (r + c) % 2 === 1, p = b[r][c], sh = '', dot = '';
      if (o.sel && o.sel[0] === r && o.sel[1] === c) sh = 'box-shadow:inset 0 0 0 3px #f5d92b;';
      if ((o.hl || []).some(function (x) { return x[0] === r && x[1] === c; })) dot = '<i style="position:absolute;width:30%;height:30%;border-radius:50%;background:#34f5c5"></i>';
      h += '<div data-r="' + r + '" data-c="' + c + '" style="position:relative;background:' + (dark ? '#7b2f13' : '#f3bb86') + ';' + sh + 'display:flex;align-items:center;justify-content:center">' + dot;
      if (p) {
        var w = p === 1 || p === 3;
        h += '<div style="width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f5b72b;border:2px solid ' + (w ? '#9a9a9a' : '#000') + ';background:' + (w ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + '">' + (p > 2 ? '♛' : '') + '</div>';
      }
      h += '</div>';
    }
    return h + '</div>';
  }
  function bindBoard(fn) {
    var e = ov.querySelector('#pzB'); if (!e) return;
    e.onclick = function (ev) { var c = ev.target.closest('[data-r]'); if (c) fn(Number(c.getAttribute('data-r')), Number(c.getAttribute('data-c'))); };
  }

  function open() {
    var old = document.getElementById('spPz'); if (old) old.remove();
    ov = document.createElement('div'); ov.id = 'spPz';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit;text-align:center';
    document.body.appendChild(ov);
    load();
  }
  function close() { if (ov) ov.remove(); }
  function load() {
    ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    on('#pzBack', close);
    api('/api/puzzles').then(function (d) {
      if (d.error) { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Telegram orqali kiring</div>'; on('#pzBack', close); return; }
      S = d; list();
    }).catch(function () { ov.innerHTML = head('🧩 Masalalar') + '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; on('#pzBack', close); });
  }
  function list() {
    var h = head('🧩 Masalalar', S.admin ? '<button id="pzNew" style="' + BS + '">➕ Yangi</button>' : '');
    if (!S.list.length) h += '<div style="padding:30px;opacity:.7">Hozircha masala yo‘q</div>';
    S.list.forEach(function (p, i) {
      var ok = (S.solved || []).indexOf(p.id) >= 0;
      h += '<div data-i="' + i + '" style="text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer"><b>' + (ok ? '✅ ' : '') + esc(p.title) + '</b><div style="font-size:12px;opacity:.65;margin-top:4px">' + LV[p.level] + ' · ' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + '</div></div>';
    });
    if (!S.admin) h += '<div style="font-size:11px;opacity:.4;margin-top:16px">ID: ' + esc(S.myId) + '</div>';
    ov.innerHTML = h;
    on('#pzBack', close); on('#pzNew', editor);
    Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (e) {
      e.onclick = function () { play(S.list[Number(e.getAttribute('data-i'))]); };
    });
  }

  // ---- yechish
  function play(p) {
    p = Object.assign({}, p);
    var lines = (p.sols && p.sols.length) ? p.sols : [p.sol], alive = lines.map(function (_, i) { return i; });
    p.sol = lines[0];
    var g = { b: copy(p.board), side: p.side, forced: null }, idx = 0, sel = null, msg = '', done = false, busy = false;
    function same(x, y) { return x && y && x[0] === y[0] && x[1] === y[1] && x[2] === y[2] && x[3] === y[3]; }
    function pick(st) {
      var m = null, keep = [], want = [st.f[0], st.f[1], st.t[0], st.t[1]];
      alive.forEach(function (i) { var x = lines[i][idx]; if (same(x, want)) { keep.push(i); m = x; } });
      if (keep.length) {
        alive = keep;
        var fin = keep.filter(function (i) { return lines[i].length === idx + 1; });
        p.sol = lines[fin.length ? fin[0] : keep[0]];
      }
      return m;
    }
    function oppPick() {
      var c = alive.filter(function (i) { return lines[i][idx]; });
      if (!c.length) return p.sol[idx];
      var x = lines[c[Math.floor(Math.random() * c.length)]][idx];
      alive = c.filter(function (j) { return same(lines[j][idx], x); });
      p.sol = lines[alive[0]];
      return x;
    }
    function draw() {
      var tg2 = [];
      if (sel) tg2 = legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === sel[0] && s.f[1] === sel[1]; }).map(function (s) { return s.t; });
      var h = head('🧩 ' + esc(p.title));
      h += '<div style="margin-bottom:8px">' + (p.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ' + LV[p.level] + '</div>';
      h += boardHtml(g.b, { sel: sel, hl: tg2 });
      h += '<div style="min-height:28px;margin:10px 0;font-size:16px">' + msg + '</div>';
      h += '<button id="pzR" style="' + BG + '">🔄 Qayta</button><button id="pzH" style="' + BS + '">💡 Ko‘rsatma</button>';
      if (S.admin) h += '<button id="pzD" style="' + BG + '">🗑 O‘chirish</button>';
      ov.innerHTML = h;
      on('#pzBack', list);
      on('#pzR', function () { play(p); });
      on('#pzH', function () { if (!done && !busy && g.side === p.side && p.sol[idx]) { sel = [p.sol[idx][0], p.sol[idx][1]]; draw(); } });
      on('#pzD', function () {
        if (!confirm('Masala o‘chirilsinmi?')) return;
        api('/api/puzzle/del', { id: p.id }).then(function () { load(); });
      });
      bindBoard(tap);
    }
    function solved() {
      done = true; msg = '🎉 Masala yechildi!'; draw();
      api('/api/puzzle/solved', { id: p.id }).then(function (d) {
        if (d && d.gain) msg += ' +' + d.gain + ' 💎';
        if ((S.solved || []).indexOf(p.id) < 0) S.solved.push(p.id);
        draw();
      });
    }
    function next() {
      if (g.side === p.side || idx >= p.sol.length) return;
      busy = true;
      setTimeout(function () {
        var w = oppPick(), st = findStep(legal(g.b, g.side, g.forced), [w[0], w[1]], [w[2], w[3]]);
        if (!st) { busy = false; msg = '⚠️ Masalada xato'; draw(); return; }
        g = adv(g, st); idx++; busy = false;
        if (idx >= p.sol.length) return solved();
        draw(); next();
      }, 500);
    }
    function tap(r, c) {
      if (done || busy || g.side !== p.side) return;
      var lg = legal(g.b, g.side, g.forced), p0 = g.b[r][c];
      if (sel) {
        var st = findStep(lg, sel, [r, c]);
        if (st) {
          var w = pick(st);
          if (w && w[0] === st.f[0] && w[1] === st.f[1] && w[2] === st.t[0] && w[3] === st.t[1]) {
            g = adv(g, st); idx++; sel = null; msg = '✅ To‘g‘ri';
            if (idx >= p.sol.length) return solved();
            draw(); next();
          } else { sel = null; msg = '❌ Noto‘g‘ri, boshqa yurishni sinang'; draw(); }
          return;
        }
      }
      sel = (p0 && sideOf(p0) === g.side && lg.some(function (s) { return s.f[0] === r && s.f[1] === c; })) ? [r, c] : null;
      draw();
    }
    draw();
  }

  // ---- masala kiritish (faqat admin)
  function editor() {
    var b = blank(), tool = 1, side = 'w', title = '', level = 1, mode = 'edit', g = null, hist = [], rec = [], recSides = [], sel = null, b0 = null, msg = '', extra = [];
    function sync() {
      var t = ov.querySelector('#pzT'); if (t) title = t.value;
      var l = ov.querySelector('#pzL'); if (l) level = Number(l.value);
    }
    function draw() {
      var sc = ov.scrollTop, h, tools = [[1, '⚪'], [2, '⚫'], [3, '⚪♛'], [4, '⚫♛'], [0, '🧽']];
      if (mode === 'edit') {
        h = head('➕ Yangi masala');
        h += '<div style="font-size:13px;opacity:.7;margin-bottom:8px">Asbobni tanlang, to‘q katakka bosing</div>';
        h += boardHtml(b, {});
        h += '<div style="margin-top:8px">' + tools.map(function (t) { return '<button data-t="' + t[0] + '" style="' + (tool === t[0] ? BS : BG) + '">' + t[1] + '</button>'; }).join('') + '</div>';
        h += '<div>Yuradi: <button data-s="w" style="' + (side === 'w' ? BS : BG) + '">⚪ Oq</button><button data-s="b" style="' + (side === 'b' ? BS : BG) + '">⚫ Qora</button></div>';
        h += '<input id="pzT" maxlength="40" placeholder="Masala nomi" value="' + esc(title) + '" style="width:92%;box-sizing:border-box;margin:8px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
        h += '<div><select id="pzL" style="padding:10px;border-radius:12px;background:#161a3a;color:#fff;border:1px solid #333a80;font-size:15px">' + [1, 2, 3].map(function (i) { return '<option value="' + i + '"' + (level === i ? ' selected' : '') + '>' + LV[i] + '</option>'; }).join('') + '</select></div>';
        h += '<div style="min-height:24px;margin:8px 0;color:#ffb3b3">' + msg + '</div>';
        h += '<button id="pzClr" style="' + BG + '">🧹 Tozalash</button><button id="pzStd" style="' + BG + '">📋 Boshlang‘ich</button><button id="pzRec" style="' + BS + '">▶ Yechimni kiritish</button>';
      } else {
        var tg2 = [];
        if (sel) tg2 = legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === sel[0] && s.f[1] === sel[1]; }).map(function (s) { return s.t; });
        h = head('🎯 Yechimni kiriting');
        h += '<div style="font-size:13px;opacity:.75;margin-bottom:8px">Avval yechuvchi (' + (side === 'w' ? '⚪' : '⚫') + ') yuradi, keyin raqib javobi va hokazo. Oxirgi yurish yechuvchiniki bo‘lsin.</div>';
        h += '<div style="margin-bottom:8px">Navbat: ' + (g.side === 'w' ? '⚪ Oq' : '⚫ Qora') + ' · yurishlar: ' + rec.length + '</div>';
        h += boardHtml(g.b, { sel: sel, hl: tg2 });
        h += '<div style="min-height:24px;margin:8px 0;color:#ffb3b3">' + msg + '</div>';
        h += '<button id="pzUn" style="' + BG + '">↩ Bekor</button><button id="pzEd" style="' + BG + '">✏️ Doska</button><button id="pzVar" style="' + BG + '">➕ Variant</button><button id="pzSv" style="' + BS + '">💾 Saqlash</button>';
      }
      ov.innerHTML = h; ov.scrollTop = sc;
      on('#pzBack', function () { if (mode === 'rec') { mode = 'edit'; msg = ''; draw(); } else list(); });
      if (mode === 'edit') {
        Array.prototype.forEach.call(ov.querySelectorAll('[data-t]'), function (e) { e.onclick = function () { sync(); tool = Number(e.getAttribute('data-t')); draw(); }; });
        Array.prototype.forEach.call(ov.querySelectorAll('[data-s]'), function (e) { e.onclick = function () { sync(); side = e.getAttribute('data-s'); draw(); }; });
        bindBoard(function (r, c) { if ((r + c) % 2 !== 1) return; sync(); b[r][c] = tool; msg = ''; draw(); });
        on('#pzClr', function () { sync(); b = blank(); draw(); });
        on('#pzStd', function () { sync(); b = std(); draw(); });
        on('#pzRec', function () {
          sync();
          var w = 0, k = 0, r, c;
          for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { if (sideOf(b[r][c]) === 'w') w++; if (sideOf(b[r][c]) === 'b') k++; }
          if (!w || !k) { msg = 'Ikkala tomonda ham dona bo‘lsin'; return draw(); }
          if (!legal(b, side, null).length) { msg = 'Bu tomonda yurish yo‘q'; return draw(); }
          b0 = copy(b); g = { b: copy(b), side: side, forced: null }; hist = [g]; rec = []; recSides = []; sel = null; msg = ''; extra = []; mode = 'rec'; draw();
        });
      } else {
        bindBoard(recTap);
        on('#pzUn', function () { if (rec.length) { rec.pop(); recSides.pop(); hist.pop(); g = hist[hist.length - 1]; sel = null; msg = ''; draw(); } });
        on('#pzEd', function () { mode = 'edit'; msg = ''; draw(); });
        on('#pzVar', addVar); on('#pzSv', save);
      }
    }
    function addVar() {
      if (!rec.length) { msg = 'Avval yurishlarni kiriting'; return draw(); }
      if (recSides[recSides.length - 1] !== side || g.forced) { msg = '⚠️ Variant yechuvchi yurishi bilan tugashi kerak'; return draw(); }
      extra.push(rec.slice());
      g = { b: copy(b0), side: side, forced: null }; hist = [g]; rec = []; recSides = []; sel = null;
      msg = '✅ ' + extra.length + '-variant saqlandi. Endi ' + (extra.length + 1) + '-variantni kiriting';
      draw();
    }
    function recTap(r, c) {
      var lg = legal(g.b, g.side, g.forced), p0 = g.b[r][c];
      if (sel) {
        var st = findStep(lg, sel, [r, c]);
        if (st) {
          recSides.push(g.side); rec.push([st.f[0], st.f[1], st.t[0], st.t[1]]);
          g = adv(g, st); hist.push(g); sel = null; msg = ''; return draw();
        }
      }
      sel = (p0 && sideOf(p0) === g.side && lg.some(function (s) { return s.f[0] === r && s.f[1] === c; })) ? [r, c] : null;
      draw();
    }
    function save() {
      if (!rec.length && !extra.length) { msg = 'Avval yechim yurishlarini kiriting'; return draw(); }
      if (rec.length && (recSides[recSides.length - 1] !== side || g.forced)) { msg = '⚠️ Oxirgi yurish yechuvchiniki bo‘lishi va zarba tugallanishi kerak'; return draw(); }
      msg = 'Saqlanmoqda…'; draw();
      api('/api/puzzle', { title: title || 'Masala', level: level, side: side, board: b0, sol: (extra.length ? extra[0] : rec), sols: (rec.length ? extra.concat([rec]) : extra) }).then(function (d) {
        if (d && d.ok) load(); else { msg = '⚠️ Saqlanmadi: ' + ((d && d.error) || ''); draw(); }
      }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    draw();
  }

  window.spPuzzles = open;
})();
