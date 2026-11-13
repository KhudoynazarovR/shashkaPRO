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
  function evFmt(x) { if (x == null) return '–'; x = Math.round(Math.max(-9.9, Math.min(9.9, x)) * 10) / 10; return x === 0 ? '0.0' : (x > 0 ? '+' : '') + x.toFixed(1); }
  function note(m) { return m.path.map(function (x) { return sq(x[0], x[1]); }).join(m.caps.length ? ':' : '-'); }
  try { fetch('/api/balance', { headers: { 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' } }).then(function (r) { return r.json(); }).then(function (d) { window.__prem = !!(d && d.premium); }).catch(function () {}); } catch (e) {}
  function hd() { return { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  var S = { t: 2, arrow: true, bar: true, engine: true, mpv: 3, pl: 8, aa: true, abk: true, alm: true };
  try { var _s = JSON.parse(localStorage.getItem('spBdS') || '{}'); for (var _k in _s) if (_k !== "t") S[_k] = _s[_k]; } catch (e) {}
  function sv() { try { localStorage.setItem('spBdS', JSON.stringify(S)); } catch (e) {} }
  function ask(h, cb, tries, tm) {
    tries = tries || 0;
    fetch('/api/ai/move', { method: 'POST', headers: hd(), body: JSON.stringify({ board: toEng(h.b), side: h.t, time: tm || S.t }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.from != null) cb({ ev: typeof j.ev === 'number' ? h.t * j.ev / 200 : null, best: { from: [j.from >> 3, j.from & 7], to: [j.to >> 3, j.to & 7] }, bk: j.bk || null });
        else if (j && j.error === 'busy' && tries < 5) setTimeout(function () { ask(h, cb, tries + 1, tm); }, 800);
        else cb(null);
      }).catch(function () { cb(null); });
  }
  // 🎨 o'yindagi doska: ☰ Menyu'da tanlangan (rc_menu_v1.board), bo'lmasa o'yin doskasining o'z ranglari
  var RCB = [["#EFD9B1", "#B58863"], ["#DEE3E6", "#8CA2AD"], ["#FFFFDD", "#86A666"], ["#DDDDDD", "#A0A0A0"], ["#F1D5CC", "#B5685D"], ["#E3DAEE", "#8B72B5"], ["#D5F0EC", "#4A9A93"], ["#9AA5B8", "#3E4A5E"], ["#F7E7B4", "linear-gradient(135deg,#C9A227,#8A6508)"], ["linear-gradient(135deg,#FAFAFA,#E3E3E0 55%,#F5F5F3)", "linear-gradient(135deg,#4B5563,#1F2937)"], ["#D9F2E3", "linear-gradient(135deg,#0F766E,#064E3B)"], ["#1E1B4B", "linear-gradient(135deg,#7C3AED,#DB2777)"]];
  var SQC = null;
  function sqCol() {
    if (SQC) return SQC;
    var L = '#f3bb86', D = '#7b2f13';
    try { var m = JSON.parse(localStorage.getItem('rc_menu_v1') || '{}'); if (m.board >= 0 && RCB[m.board]) { L = RCB[m.board][0]; D = RCB[m.board][1]; SQC = [L, D]; return SQC; } } catch (e) {}
    try {   // o'yin/AI doskasidan haqiqiy rangni olamiz (S.th mavzusi: rose, classic, edeon…)
      var th = (typeof S === 'object' && S && S.th) || (JSON.parse(localStorage.getItem('sp_s2') || '{}').th) || 'edeon', box = document.createElement('div');
      box.id = 'board'; box.setAttribute('data-th', th); box.style.cssText = 'position:absolute;left:-9999px;top:0;width:40px;height:20px';
      box.innerHTML = '<div class="sq l" style="width:20px;height:20px"></div><div class="sq d" style="width:20px;height:20px"></div>';
      var host = document.createElement('div'); host.appendChild(box); document.body.appendChild(host);
      var gl = function (e) { var cs = getComputedStyle(e); return cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor; };
      var l2 = gl(box.children[0]), d2 = gl(box.children[1]); host.remove();
      if (l2 && !/rgba\(0, 0, 0, 0\)|transparent/.test(l2)) L = l2; if (d2 && !/rgba\(0, 0, 0, 0\)|transparent/.test(d2)) D = d2;
    } catch (e) {}
    SQC = [L, D]; return SQC;
  }
  // 🎨 o'yindagi ko'rinish: S.th (doska mavzusi), S.ps (dona uslubi), ☰ Menyu doskasi, Do'kon donasi — o'yin bilan bir xil CSS
  var GSK = null;
  function gameSkin() {
    if (GSK) return GSK;
    var o = { th: 'edeon', ps: 'img', pz: '90', km: '\u265B', rc: null };
    try { var x = JSON.parse(localStorage.getItem('sp_s2') || '{}'); if (x.th) o.th = x.th; if (x.ps) o.ps = x.ps; if (x.pz) o.pz = x.pz; if (x.km) o.km = x.km; } catch (e) {}
    if (!/^(classic|green|blue|gray|walnut|purple|sand|ocean|rose|olive|photo|edeon)$/.test(o.th)) o.th = 'edeon';
    try { var m = JSON.parse(localStorage.getItem('rc_menu_v1') || '{}'); if (m.board >= 0 && RCB[m.board]) o.rc = RCB[m.board]; } catch (e) {}
    try {   // #board[...] mavzu qoidalarini (edeon va b.) tahlil doskasiga ko'chiramiz — o'yin xonasi kabi
      if (!document.getElementById('spBdTh')) {
        var css = '';
        for (var i = 0; i < document.styleSheets.length; i++) { var R; try { R = document.styleSheets[i].cssRules; } catch (e) { continue; } for (var j = 0; j < R.length; j++) { var t = R[j].cssText || ''; if (t.indexOf('#board[') === 0) css += t.replace(/#board\[/g, '#spBdB[') + '\n'; } }
        var st = document.createElement('style'); st.id = 'spBdTh'; st.textContent = css + '#spBdB .sq{border:0!important}#spBdB .pc{pointer-events:none}'; document.head.appendChild(st);
      }
    } catch (e) {}
    GSK = o; return o;
  }
  function gamePc(p) {
    var w = W(p), k = p > 2, u = window.spEqId ? '/api/shop/img?id=' + encodeURIComponent(window.spEqId) + '&k=' + (w ? 'w' : 'b') + (k ? 'k' : '') : '';
    return '<i class="piece pc ' + (w ? 'w' : 'b') + (k ? ' k' : '') + '"' + (u ? ' style="background-image:url(&quot;' + u + '&quot;)!important;background-size:contain!important;background-color:transparent!important;border:0!important;box-shadow:none!important"' : '') + '></i>';
  }
  function pcH(p, sz) {
    var w = W(p);
    if (window.spEqId) {   // 🪙 Do'kondan tanlangan donalar (o'yindagidek)
      return '<div style="width:' + sz + ';height:' + sz + ';border-radius:50%;background:url(&quot;/api/shop/img?id=' + encodeURIComponent(window.spEqId) + '&amp;k=' + (w ? 'w' : 'b') + (p > 2 ? 'k' : '') + '&quot;) center/contain no-repeat;filter:drop-shadow(0 2px 2px rgba(0,0,0,.45))"></div>';
    }
    return '<div style="width:' + sz + ';height:' + sz + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#f5b72b;border:2px solid ' + (w ? '#9a9a9a' : '#000') + ';background:' + (w ? 'radial-gradient(circle at 35% 28%,#fff,#bbb)' : 'radial-gradient(circle at 35% 28%,#888,#111)') + ';box-sizing:border-box">' + (p > 2 ? '♛' : '') + '</div>';
  }
  function pvWorkerBody() {
  var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function ins(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function capsFrom(b, from) {
    var p = b[from], s = p > 0 ? 1 : -1, out = [];
    b[from] = 0;
    function dfs(pos, k, caps, path, o) {
      var r = pos >> 3, c = pos & 7, found = false, di;
      for (di = 0; di < 4; di++) {
        var dr = DIRS[di][0], dc = DIRS[di][1];
        if (!k) {
          var lr = r + 2 * dr, lc = c + 2 * dc;
          if (!ins(lr, lc)) continue;
          var m = (r + dr) * 8 + c + dc, l = lr * 8 + lc;
          if (b[m] * s < 0 && caps.indexOf(m) < 0 && b[l] === 0) {
            found = true;
            dfs(l, (s > 0 && lr === 0) || (s < 0 && lr === 7), caps.concat([m]), path.concat([l]), o);
          }
        } else {
          var nr = r + dr, nc = c + dc;
          while (ins(nr, nc) && b[nr * 8 + nc] === 0) { nr += dr; nc += dc; }
          if (!ins(nr, nc)) continue;
          var m2 = nr * 8 + nc;
          if (b[m2] * s >= 0 || caps.indexOf(m2) >= 0) continue;
          var lands = [], lr2 = nr + dr, lc2 = nc + dc;
          while (ins(lr2, lc2) && b[lr2 * 8 + lc2] === 0) { lands.push(lr2 * 8 + lc2); lr2 += dr; lc2 += dc; }
          if (!lands.length) continue;
          found = true;
          var rs = lands.map(function (l2) { var oo = []; var e = dfs(l2, true, caps.concat([m2]), path.concat([l2]), oo); return { oo: oo, e: e }; });
          var any = rs.some(function (x) { return x.e; });
          rs.forEach(function (x) { if (!any || x.e) x.oo.forEach(function (y) { o.push(y); }); });
        }
      }
      if (!found && caps.length) o.push({ path: path, caps: caps, pk: k });
      return found;
    }
    dfs(from, Math.abs(p) === 2, [], [from], out);
    b[from] = p;
    return out;
  }
  function simple(b, from) {
    var p = b[from], s = p > 0 ? 1 : -1, r = from >> 3, c = from & 7, o = [], di, nr, nc;
    if (Math.abs(p) === 2) {
      for (di = 0; di < 4; di++) {
        nr = r + DIRS[di][0]; nc = c + DIRS[di][1];
        while (ins(nr, nc) && !b[nr * 8 + nc]) { o.push({ path: [from, nr * 8 + nc], caps: [] }); nr += DIRS[di][0]; nc += DIRS[di][1]; }
      }
    } else {
      [-1, 1].forEach(function (dc) { var rr = r - s, cc = c + dc; if (ins(rr, cc) && !b[rr * 8 + cc]) o.push({ path: [from, rr * 8 + cc], caps: [] }); });
    }
    return o;
  }
  function legal(b, side) {
    var cs = [], i, ms = [];
    for (i = 0; i < 64; i++) if (b[i] * side > 0) capsFrom(b, i).forEach(function (m) { cs.push(m); });
    if (cs.length) return cs;
    for (i = 0; i < 64; i++) if (b[i] * side > 0) simple(b, i).forEach(function (m) { ms.push(m); });
    return ms;
  }
  function apply(b, m) {
    var n = b.slice(), f = m.path[0], t = m.path[m.path.length - 1], p = n[f], i;
    n[f] = 0;
    for (i = 0; i < m.caps.length; i++) n[m.caps[i]] = 0;
    if (Math.abs(p) === 1 && (m.pk || (p > 0 && (t >> 3) === 0) || (p < 0 && (t >> 3) === 7))) p *= 2;
    n[t] = p;
    return n;
  }
  function ev(b) {
    var s = 0, i;
    for (i = 0; i < 64; i++) {
      var p = b[i]; if (!p) continue;
      var r = i >> 3, c = i & 7, w = p > 0, v;
      if (Math.abs(p) === 2) v = 320 + ((c > 1 && c < 6 && r > 1 && r < 6) ? 8 : 0);
      else {
        var adv = w ? 7 - r : r;
        v = 100 + adv * 7 + ((c > 1 && c < 6) ? 5 : 0) + (adv >= 5 ? adv * 2 : 0) + (((w && r === 7) || (!w && r === 0)) ? 10 : 0) - ((c === 0 || c === 7) ? 3 : 0);
      }
      s += w ? v : -v;
    }
    return s;
  }
  var TT = new Map(), hist = new Int32Array(4096), nodes = 0, deadline = 0;
  var TTMAX = 1000000;
  var PVT = [], PVL = new Int32Array(128), zi;
  for (zi = 0; zi < 128; zi++) PVT.push([]);
  var ZA = new Int32Array(320), ZB = new Int32Array(320);
  (function () {
    var s = 123456789, i;
    function rnd() { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return s | 0; }
    for (i = 0; i < 320; i++) { ZA[i] = rnd(); ZB[i] = rnd(); }
  })();
  function hk(b, side) {
    var h1 = side > 0 ? 19088743 : 1985229328, h2 = side > 0 ? 591751049 : 2271560481 | 0, i, p, z;
    for (i = 0; i < 64; i++) { p = b[i]; if (p) { z = i * 5 + p + 2; h1 ^= ZA[z]; h2 ^= ZB[z]; } }
    return (h2 & 0x1fffff) * 4294967296 + (h1 >>> 0);
  }
  function setPV(ply, m) {
    var L = PVL[ply + 1], j, a = PVT[ply], c = PVT[ply + 1];
    a[0] = m;
    for (j = 0; j < L; j++) a[j + 1] = c[j];
    PVL[ply] = L + 1;
  }
  function ab(b, side, d, al, be, ply) {
    if ((++nodes & 1023) === 0 && Date.now() > deadline) throw 0;
    PVL[ply] = 0;
    var ms = legal(b, side);
    if (!ms.length) return -9000 + ply;
    if (ply > 70 || (d <= 0 && !ms[0].caps.length)) return side * ev(b);
    var isPV = be - al > 1;
    var key = hk(b, side), e = TT.get(key), tm = -1;
    if (e) {
      tm = e.m;
      if (!isPV && e.d >= d) { if (e.f === 0 || (e.f === 1 && e.v >= be) || (e.f === 2 && e.v <= al)) return e.v; }
    }
    var sc = ms.map(function (m) {
      var k = m.path[0] * 64 + m.path[m.path.length - 1];
      return [(k === tm ? 1e6 : 0) + hist[k] + m.caps.length * 100, m, k];
    });
    sc.sort(function (x, y) { return y[0] - x[0]; });
    var a0 = al, best = -1e9, bk = -1, i;
    for (i = 0; i < sc.length; i++) {
      var x = sc[i], ch = apply(b, x[1]), v;
      if (i === 0) v = -ab(ch, -side, d - 1, -be, -al, ply + 1);
      else {
        v = -ab(ch, -side, d - 1, -al - 1, -al, ply + 1);
        if (v > al && v < be) v = -ab(ch, -side, d - 1, -be, -al, ply + 1);
      }
      if (v > best) { best = v; bk = x[2]; }
      if (v > al) { al = v; setPV(ply, x[1]); }
      if (al >= be) { if (!x[1].caps.length) hist[x[2]] += d * d; break; }
    }
    if (!e || e.d <= d) {
      if (TT.size > TTMAX) TT.clear();
      TT.set(key, { d: d, v: best, f: best <= a0 ? 2 : best >= be ? 1 : 0, m: best <= a0 ? -1 : bk });
    }
    return best;
  }
  function score(v, side) {
    var w = v * side;
    if (Math.abs(v) > 8000) return (w > 0 ? '+' : '-') + 'M' + Math.ceil((9000 - Math.abs(v)) / 2);
    return (w >= 0 ? '+' : '') + (w / 100).toFixed(1);
  }
  function run(b, side, ms_, maxd) {
    nodes = 0; deadline = Date.now() + ms_; TT.clear(); hist.fill(0); PVL.fill(0);
    var ms = legal(b, side);
    if (!ms.length) { self.postMessage({ d: 0, maxd: maxd, sc: '–', pv: [], nodes: 0, done: true, side: side }); return; }
    var d, lastMsg = null;
    try {
      for (d = 1; d <= maxd; d++) {
        var cb = null, cv = -1e9, sc = [], i;
        for (i = 0; i < ms.length; i++) {
          var ch = apply(b, ms[i]), v;
          if (i === 0) v = -ab(ch, -side, d - 1, -1e9, 1e9, 1);
          else {
            v = -ab(ch, -side, d - 1, -cv - 1, -cv, 1);
            if (v > cv) v = -ab(ch, -side, d - 1, -1e9, -cv, 1);
          }
          sc.push([v, ms[i]]);
          if (v > cv) { cv = v; cb = ms[i]; setPV(0, ms[i]); }
        }
        ms = sc.sort(function (a, c) { return c[0] - a[0]; }).map(function (x) { return x[1]; });
        TT.set(hk(b, side), { d: d, v: cv, f: 0, m: cb.path[0] * 64 + cb.path[cb.path.length - 1] });
        var pv = PVT[0].slice(0, PVL[0]).map(function (m) { return { path: m.path, caps: m.caps.length }; });
        var fin = (d >= maxd) || Math.abs(cv) > 8000;
        lastMsg = { d: d, maxd: maxd, sc: score(cv, side), pv: pv, nodes: nodes, done: fin, side: side };
        self.postMessage(lastMsg);
        if (fin) return;
      }
    } catch (e) {
      if (lastMsg) { lastMsg.done = true; lastMsg.nodes = nodes; self.postMessage(lastMsg); }
      else self.postMessage({ d: 0, maxd: maxd, sc: '–', pv: [], nodes: nodes, done: true, side: side });
    }
  }
  self.onmessage = function (ev_) { var d = ev_.data; run(d.b, d.side, d.ms, d.maxd); };
}

  /* ---- Chuqur tahlil: 16 yarim yurish (8 oq + 8 qora), Web Worker ---- */
  var PVC = {}, PVW = null, PVK = '', PVT = 0, PVREDRAW = null;
  function pvFirst(r) {
    if (!r || r.err || !r.pv || !r.pv.length || !(r.done || r.d >= 8)) return null;
    var p = r.pv[0], a = p.path[0], z = p.path[p.path.length - 1];
    return { from: [a >> 3, a & 7], to: [z >> 3, z & 7], cap: p.caps > 0 };
  }
  function pvKey(r) { var f = pvFirst(r); return f ? f.from + '>' + f.to : ''; }
  function pvLine(pv, side) {
    var s = '', t = side, n = 1, i, m, str;
    for (i = 0; i < pv.length; i++) {
      m = pv[i];
      str = m.path.map(function (x) { return sq(x >> 3, x & 7); }).join(m.caps ? ':' : '-');
      if (t > 0) s += n + '. ';
      else if (i === 0) s += n + '... ';
      s += str + ' ';
      if (t < 0) n++;
      t = -t;
    }
    return s;
  }
  function pvBox(k) {
    var r = PVC[k];
    if (!r || r.err) return '';
    if (!r.pv || !r.d) return '<div style="margin-top:8px;text-align:left;background:#1d1f3a;border-radius:10px;padding:8px 10px;font-size:13px;opacity:.75">🐉 Dragon tahlil qilyapti…</div>';
    window.__pvT = function () { S.pvc = !S.pvc; sv(); if (PVREDRAW) PVREDRAW(); };
    var NW = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    return '<div style="margin-top:8px;text-align:left;background:#1d1f3a;border-radius:10px;padding:6px 10px">' +
      '<div onclick="window.__pvT()" style="font-size:12.5px;opacity:.8;display:flex;justify-content:space-between;cursor:pointer;padding:2px 0"><span>🐉 Dragon · chuqurlik ' + r.d + '</span><span>' + (S.pvc ? '▶' : '▼') + '</span></div>' + (S.pvc ? '' :
      (r.lines && r.lines.length > 1 && (S.mpv || 3) > 1 ? r.lines.slice(0, S.mpv || 3).map(function (L, i) { return '<div style="' + NW + 'font-size:13.5px;line-height:1.5;margin-top:4px;border-top:1px solid #2b2f55;padding-top:4px"><b style="display:inline-block;min-width:44px;color:' + (L.ev == null ? '#ccc' : L.ev > 0.3 ? '#9be89b' : L.ev < -0.3 ? '#ff9b9b' : '#ddd') + '">' + (L.ev == null ? '–' : evFmt(L.ev)) + '</b>' + pvLine(L.pv, r.side) + '</div>'; }).join('') : '<div style="' + NW + 'font-size:13.5px;line-height:1.5;margin-top:4px;border-top:1px solid #2b2f55;padding-top:4px"><b style="display:inline-block;min-width:44px">' + (r.sc != null ? r.sc : '') + '</b>' + pvLine(r.pv, r.side) + '</div>')) + '</div>';
  }
  function pvStart(h, k) {
    if (PVW) { try { PVW.terminate(); } catch (e) {} PVW = null; }
    PVK = k; PVC[k] = { d: 0, done: false };
    var tok = ++PVT;
    setTimeout(function () {   // 🧠 telefon dvigateli o'rniga — serverdagi KestoG
      if (tok !== PVT) return;
      var NN = S.mpv || 3;
      (function req(n) {   // avval 1 ta variant (tez), keyin qolganlari
      fetch('/api/ai/multipv', { method: 'POST', headers: hd(), body: JSON.stringify({ board: toEng(h.b), side: h.t, time: Math.min(2, S.t || 1), n: n, plies: S.pl || 8 }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!document.getElementById('spBd')) return;
          if (n < NN && tok === PVT) setTimeout(function () { if (tok === PVT) req(NN); }, 0);
          if (n < NN && PVC[k] && PVC[k].lines && PVC[k].lines.length > 1) return;
          if (j && j.lines && j.lines.length) j = { pv: j.lines[0].pv, d: j.lines[0].pv.length, ev: j.lines[0].ev, lines: j.lines };
          if (!j || j.error || !j.pv) { PVC[k] = { err: 1, done: true }; }
          else PVC[k] = { pv: j.pv, d: j.d, done: true, side: h.t, sc: j.ev == null ? null : evFmt(j.ev), lines: j.lines || null };
          var el = document.getElementById('spPV');
          if (el && el.getAttribute('data-k') === k) el.innerHTML = pvBox(k);
          if (PVREDRAW) PVREDRAW();
        }).catch(function () { if (!PVC[k] || !PVC[k].pv) PVC[k] = { err: 1, done: true }; });
      })(1);
    }, 250);
  }
  function pvStartWorker(h, k) {   // eski telefon dvigateli — endi ishlatilmaydi
    var tok = PVT;
    setTimeout(function () {
      if (tok !== PVT) return;
      try {
        var url = URL.createObjectURL(new Blob(['(' + pvWorkerBody.toString() + ')()'], { type: 'text/javascript' }));
        var w = PVW = new Worker(url);
        w.onmessage = function (ev) {
          var d = ev.data;
          if (tok !== PVT || !document.getElementById('spBd')) { try { w.terminate(); } catch (e) {} return; }
          var _ka = pvKey(PVC[k]); PVC[k] = d; var _kb = pvKey(d);
          var el = document.getElementById('spPV');
          if (el && el.getAttribute('data-k') === k) el.innerHTML = pvBox(k); if (_ka !== _kb && PVREDRAW) PVREDRAW();
          if (d.done) { try { w.terminate(); } catch (e) {} if (PVW === w) PVW = null; }
        };
        w.onerror = function () { PVC[k] = { err: 1, done: true }; };
        w.postMessage({ b: toEng(h.b), side: h.t, ms: S.pvMs || 20000, maxd: 24 });
      } catch (e) { PVC[k] = { err: 1, done: true }; }
    }, 350);
  }
  function pvHtml(h) {
    if (!h || !h.b) return '';
    var k = kf(h);
    if (!PVC[k] || (!PVC[k].done && PVK !== k)) pvStart(h, k);
    return '<div id="spPV" data-k="' + k + '">' + pvBox(k) + '</div>';
  }

  window.spBoard = function (g) {
    // ♟ o'yin IDF (yoki boshqa) pozitsiyadan boshlangan bo'lsa — o'sha pozitsiyadan (32 belgi: qora kataklar qatorma-qator)
    var b0 = start(), t0 = 1, BAD = 0;
    if (g && g.start && String(g.start).length === 32) { b0 = empty(); var k0 = 0; for (var r0 = 0; r0 < 8; r0++) for (var c0 = 0; c0 < 8; c0++) { if ((r0 + c0) % 2 !== 1) continue; var ch0 = String(g.start).charAt(k0++); b0[r0][c0] = ch0 === 'w' ? 1 : ch0 === 'b' ? 2 : ch0 === 'W' ? 3 : ch0 === 'B' ? 4 : 0; } }
    if (g && g.first === 'black') t0 = -1;
    var hist = [{ b: b0, t: t0, m: null }], cur = 0, flip = false, sel = null, EV = {}, busyK = {}, FAIL = {}, allRun = false, prog = '';
    var panel = null, E = null, PL = null, GI = null;
    var s2h = [0];   // arxiv bosqichi → tarix indeksi (ko'p urishli yurish bitta yurish bo'lib birlashadi)
    if (g && g.moves && g.moves.length) {
      GI = g;
      g.moves.forEach(function (x) {
        if (BAD) return;
        var L = hist[hist.length - 1], P = hist[hist.length - 2];
        if (P && L.m && L.m.caps.length && (x.captures || []).length && P.t === (W(L.b[x.from.r][x.from.c]) ? 1 : -1)) {
          var le = L.m.path[L.m.path.length - 1];
          if (le[0] === x.from.r && le[1] === x.from.c) {
            var p1 = L.b[x.from.r][x.from.c], m2 = { path: L.m.path.concat([[x.to.r, x.to.c]]), caps: L.m.caps.concat((x.captures || []).map(function (y) { return [y.r, y.c]; })), king: L.m.king || (p1 < 3 && (W(p1) ? x.to.r === 0 : x.to.r === 7)) };
            L.b = applyM(P.b, m2); L.m = m2; L.n = note(m2); s2h.push(hist.length - 1); return;
          }
        }
        var h = hist[hist.length - 1], p = h.b[x.from.r][x.from.c], er = x.to.r;
        if (!p) { BAD = hist.length; return; }   // yurish bu pozitsiyaga mos emas (eski arxiv: boshlang'ich pozitsiya saqlanmagan)
        h.t = W(p) ? 1 : -1;   // navbat — yuradigan dona rangi (ko'p urishli yurish arxivda bosqichma-bosqich yoziladi)
        var m = { path: [[x.from.r, x.from.c], [x.to.r, x.to.c]], caps: (x.captures || []).map(function (y) { return [y.r, y.c]; }), king: p < 3 && (W(p) ? er === 0 : er === 7) };
        hist.push({ b: applyM(h.b, m), t: -h.t, m: m, n: note(m) });
        s2h.push(hist.length - 1);
      });
    }
    if (g && typeof g.at === 'number') cur = Math.max(0, Math.min(hist.length - 1, g.at < s2h.length ? s2h[g.at] : hist.length - 1));
    if (g && g.flip) flip = true;
    var old = document.getElementById('spBd'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spBd';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:100001;background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center';
    document.body.appendChild(ov);
    function alive() { return document.body.contains(ov); }
    function evOf(i) {
      var h = hist[i], k = kf(h), L = legal(h.b, h.t);
      if (L.length === 1 && i + 1 < hist.length && hist[i + 1].m) { var nx = evOf(i + 1); if (nx != null) return nx; }   // majburiy yurish: dvigatel 0 qaytaradi — keyingi pozitsiya bahosi
      if (EV[k]) return EV[k].ev;
      if (!L.length) return h.t > 0 ? -9.9 : 9.9;
      return null;
    }
    function go(i) { if (AU.run) auStop('⏸ To‘xtatildi'); cur = Math.max(0, Math.min(hist.length - 1, i)); sel = null; draw(); analyzeCur(); }
    function analyzeCur() {
      if (!S.engine || PL || panel === 'edit' || (AU && AU.run)) return;
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
        ask(h, function (r) { if (r) EV[k] = r; prog = i + '/' + hist.length; draw(); nx(); }, 0, 0.7);   // to'liq tahlil: har pozitsiyaga 0.7 s (server yengil)
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
      if (AU.run) return;
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
    // 📈 to'liq tahlil: hamma pozitsiya bahosi (dvigatel) + qo'pol xato tekshiruvi (telefonda, TX) — grafik, aniqlik, ?!/?/??
    var BL = {}, blRun = false, blProg = '';
    function blScan() {
      if (blRun) return; blRun = true;
      var go2 = function () {
        var i = 0;
        (function nx() {
          if (!alive()) { blRun = false; return; }
          while (i < hist.length - 1 && (BL[i] !== undefined || !hist[i + 1].m)) i++;
          if (i >= hist.length - 1) { blRun = false; blProg = ''; draw(); return; }
          var h = hist[i], m = hist[i + 1].m, f = m.path[0], e = m.path[m.path.length - 1];
          try { BL[i] = window.TX.loss(toEng(h.b), h.t, f[0] * 8 + f[1], e[0] * 8 + e[1]); } catch (x) { BL[i] = null; }
          i++; blProg = i + '/' + (hist.length - 1); if (i % 4 === 0) draw();
          setTimeout(nx, 15);
        })();
      };
      if (window.TX) go2(); else { var sc = document.createElement('script'); sc.src = '/tahlilx.js?v=1'; sc.onload = go2; sc.onerror = function () { blRun = false; }; document.head.appendChild(sc); }
    }
    function fullAna() { if (!S.engine) { S.engine = true; sv(); } runAll(); blScan(); draw(); }
    function wc(e) { return 1 / (1 + Math.exp(-1.1 * Math.max(-9, Math.min(9, e)))); }   // yutish ehtimoli (oq uchun)
    function anaHtml() {
      var n = hist.length - 1; if (n < 2 || !S.engine || PL) return '';
      var pts = [], ok = 0;
      for (var i = 0; i <= n; i++) { var e = evOf(i); pts.push(e); if (e != null) ok++; }
      var full = ok >= n * 0.9, h = '';
      if (!full && !allRun && !blRun) return '<div style="margin-top:10px"><button id="bdFull" style="border:0;border-radius:12px;padding:11px 14px;background:#2e9d6b;color:#fff;font-size:15px;font-weight:700;width:100%">📈 To‘liq tahlil: grafik, xatolar va aniqlik</button></div>';
      if (ok < 2) return '<div style="margin-top:10px;font-size:14px;opacity:.8">⏳ Tahlil qilinmoqda… ' + (prog || '') + '</div>';
      // grafik
      var Wd = 360, Ht = 64, path = '', area = '', last = null;
      pts.forEach(function (e, i) { if (e == null) return; var x = n ? i / n * Wd : 0, y = Ht / 2 - Math.max(-5, Math.min(5, e)) * (Ht / 2 - 3) / 5; path += (path ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); last = [x, y]; });
      if (path) area = path + ' L' + last[0].toFixed(1) + ',' + Ht + ' L0,' + Ht + ' Z';
      var dots = '', cx = n ? cur / n * Wd : 0;
      for (var j = 0; j < n; j++) { var mk = mark(j); if (mk === '??' || mk === '?') { var e2 = pts[j + 1]; if (e2 == null) continue; dots += '<circle cx="' + ((j + 1) / n * Wd).toFixed(1) + '" cy="' + (Ht / 2 - Math.max(-5, Math.min(5, e2)) * (Ht / 2 - 3) / 5).toFixed(1) + '" r="3.2" fill="' + (mk === '??' ? '#f87171' : '#fb923c') + '"/>'; } }
      var hit = ''; for (var k = 0; k <= n; k++) hit += '<rect data-g="' + k + '" x="' + ((k - 0.5) / n * Wd).toFixed(1) + '" y="0" width="' + (Wd / n).toFixed(1) + '" height="' + Ht + '" fill="transparent"/>';
      h += '<div style="margin-top:10px;background:#1d1858;border-radius:12px;padding:6px"><svg viewBox="0 0 ' + Wd + ' ' + Ht + '" style="width:100%;display:block"><rect width="' + Wd + '" height="' + Ht + '" fill="#2a2a2a"/><path d="' + area + '" fill="#e8e8e8"/><line x1="0" y1="' + Ht / 2 + '" x2="' + Wd + '" y2="' + Ht / 2 + '" stroke="#888" stroke-width=".6"/><line x1="' + cx + '" y1="0" x2="' + cx + '" y2="' + Ht + '" stroke="#f5d92b" stroke-width="1.4"/>' + dots + hit + '</svg></div>';
      // xulosa: har tomon uchun ?!, ?, ?? va aniqlik
      var T = { 1: { a: 0, b: 0, c: 0, acc: 0, n: 0 }, '-1': { a: 0, b: 0, c: 0, acc: 0, n: 0 } };
      for (var q = 0; q < n; q++) {
        var t = hist[q].t, A = pts[q], Bv = pts[q + 1], mk2 = mark(q), o = T[t > 0 ? 1 : '-1'];
        if (mk2 === '?!') o.a++; else if (mk2 === '?') o.b++; else if (mk2 === '??') o.c++;
        if (A != null && Bv != null) { var lw = Math.max(0, (t > 0 ? wc(A) - wc(Bv) : wc(Bv) - wc(A))) * 100; if (BL[q] >= 1) lw = Math.max(lw, 30); o.acc += Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * lw) - 3.1669)); o.n++; }
      }
      var row = function (t, lb) { var o = T[t]; return '<tr><td style="text-align:left;padding:4px 6px">' + lb + '</td><td style="color:#fbbf24">' + o.a + '</td><td style="color:#fb923c">' + o.b + '</td><td style="color:#f87171;font-weight:700">' + o.c + '</td><td><b>' + (o.n ? Math.round(o.acc / o.n) + '%' : '–') + '</b></td></tr>'; };
      h += '<table style="width:100%;margin-top:8px;border-collapse:collapse;background:#1d1858;border-radius:12px;font-size:14px;text-align:center"><tr style="opacity:.7;font-size:12px"><td></td><td>?! noaniq</td><td>? xato</td><td>?? qo‘pol</td><td>aniqlik</td></tr>' +
        row(1, '⚪ ' + String((GI && GI.white) || 'Oq').replace(/</g, '&lt;').slice(0, 14)) + row('-1', '⚫ ' + String((GI && GI.black) || 'Qora').replace(/</g, '&lt;').slice(0, 14)) + '</table>';
      if (allRun || blRun) h += '<div style="font-size:12.5px;opacity:.75;margin-top:4px">⏳ Tahlil davom etmoqda… ' + (prog || '') + (blRun ? ' · 🛡 ' + blProg : '') + '</div>';
      // tanlangan yurish izohi
      if (cur >= 1) {
        var mk3 = mark(cur - 1);
        if (mk3) {
          var pe = evOf(cur - 1), pr = hist[cur - 1], be = EV[kf(pr)];
          h += '<div style="margin-top:8px;padding:9px 11px;border-radius:12px;background:' + (mk3 === '??' ? '#4a0f1c' : mk3 === '?' ? '#4a2a0f' : '#3d3a10') + ';font-size:14px"><b>' + hist[cur].n + ' ' + mk3 + '</b> — ' + (mk3 === '??' ? 'qo‘pol xato' : mk3 === '?' ? 'xato' : 'noaniq yurish') +
            (BL[cur - 1] >= 1 ? ' · ⚠️ <b>' + BL[cur - 1] + ' dona yo‘qotadi</b>' : '') +
            (be && be.best ? '<br><span style="opacity:.85">Yaxshisi: <b>' + sq(be.best.from[0], be.best.from[1]) + '-' + sq(be.best.to[0], be.best.to[1]) + '</b> (' + evFmt(pe) + ')</span>' : '') + '</div>';
        }
      }
      return h;
    }
    function mark(i) {
      if (BL[i] >= 1) return '??';   // 🛡 majburiy yo'l bilan dona yo'qotadi (dvigatel ko'rmasa ham)
      var a = evOf(i), b = evOf(i + 1);
      if (a == null || b == null) return '';
      var loss = (hist[i].t) * (a - b);
      return loss >= 1.5 ? '??' : loss >= 0.8 ? '?' : loss >= 0.4 ? '?!' : '';
    }
    function newPos(b, t) { AU.run = false; AU.msg = ''; GI = null; hist = [{ b: cp(b), t: t, m: null }]; cur = 0; sel = null; PL = null; panel = null; E = null; draw(); analyzeCur(); }
    function cnt(b, f) { var n = 0; b.forEach(function (row) { row.forEach(function (p) { if (p && f(p)) n++; }); }); return n; }
    // 🦍 King Kong ustaxonasi (faqat admin): yurish o'rgatish, partiya kiritish, ro'yxat
    // 🤖 Kompyuter vs Kompyuter: dvigatel o'zi bilan tez o'ynaydi — yurishlar baholanadi, xatolar ?!/?/?? bilan ko'rinadi
    var AU = { t: 0.5, run: false, msg: '' };
    function auStop(msg) { AU.run = false; AU.msg = msg || ''; if (alive()) draw(); }
    function auStep() {
      if (!AU.run || !alive()) return;
      var h = hist[cur], ms = legal(h.b, h.t);
      if (!ms.length) return auStop('🏁 O‘yin tugadi: ' + (h.t > 0 ? '⚫ Qora' : '⚪ Oq') + ' yutdi');
      if (cur >= 160) return auStop('⏹ 80 yurishdan keyin to‘xtatildi');
      var k = kf(h), rep = 0; for (var i = 0; i < cur; i++) if (kf(hist[i]) === k) rep++;
      if (rep >= 2) return auStop('🤝 Durang: pozitsiya 3 marta takrorlandi');
      AU.th = true; draw();
      ask(h, function (r) {
        AU.th = false;
        if (!AU.run || hist[cur] !== h || !alive()) return;
        if (!r) return auStop('⚠️ Dvigatel javob bermadi');
        EV[k] = r;
        var m = ms.filter(function (x) { var e = x.path[x.path.length - 1]; return x.path[0][0] === r.best.from[0] && x.path[0][1] === r.best.from[1] && e[0] === r.best.to[0] && e[1] === r.best.to[1]; })[0] || ms[0];
        play(m, true);
        setTimeout(auStep, 120);
      }, 0, AU.t);
    }
    var KK = { msg: '', sides: 'w', busy: false };
    // 🦍 King Kong ko'rinishi: har pozitsiyada u nima o'ynaydi va qayerdan (TB / siz / etyud / Colette / kitob / dvigatel)
    var KKP = {}, KKSRC = { tb: '🏁 endshpil bazasi', admin: '🎓 siz o‘rgatgansiz', etude: '🧩 etyud', colette: '📚 Nazariya', book: '📖 kitob', cache: '🧠 oldindan hisoblangan', engine: '🧠 o‘zi o‘ylaydi (dvigatel)', over: '🏁 o‘yin tugagan' };
    function kkPeekLoad() {
      var need = [], keys = [];
      hist.forEach(function (h) { var k = kf(h); if (KKP[k] === undefined && keys.indexOf(k) < 0) { keys.push(k); need.push({ board: toEng(h.b), side: h.t }); } });
      if (!need.length) return;
      keys.forEach(function (k) { KKP[k] = 0; });
      kkPost('/api/kkbook/peek', { list: need }).then(function (r) { (r.list || []).forEach(function (x, i) { KKP[keys[i]] = x || null; }); if (alive()) draw(); })
        .catch(function () { keys.forEach(function (k) { delete KKP[k]; }); });
    }
    function kkLine(P) {
      if (P === 0 || P === undefined) return '🦍 King Kong: ⏳';
      if (!P) return '';
      var s = '🦍 King Kong bu yerda: ' + (P.n ? '<b>' + P.n + '</b> · ' : '') + (KKSRC[P.src] || P.src) + (P.res ? ' (' + (P.res === 'win' ? 'yutadi' : P.res === 'loss' ? 'yutqazadi' : 'durang') + ')' : '') + (P.forced ? ' · majburiy' : '');
      if (P.src === 'admin' && P.col && P.col !== P.n) s += '<br><span style="font-size:12px;opacity:.75">Nazariya: ' + P.col + ' edi</span>';
      else if (P.src !== 'colette' && P.src !== 'admin' && P.col && P.col !== P.n) s += '<br><span style="font-size:12px;opacity:.75">Nazariya: ' + P.col + '</span>';
      if (P.deep) s += '<br><span style="font-size:12px;opacity:.75">⚠️ Bu yerda avval yutqazgan — chuqurroq o‘ylaydi</span>';
      return s;
    }
    function kkDiff(i) {   // hist[i] dan qilingan yurish King Kongnikidan farq qiladimi
      var P = KKP[kf(hist[i])], m = hist[i + 1] && hist[i + 1].m; if (!P || P.f == null || !m) return '';
      var f = m.path[0], e = m.path[m.path.length - 1];
      return (P.f === f[0] * 8 + f[1] && P.t === e[0] * 8 + e[1]) ? '' : P.n;
    }
    function kkPost(u, body) { return fetch(u, { method: 'POST', headers: hd(), body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
    function kkFromEng(a, s) { var b = [], r, c, v; for (r = 0; r < 8; r++) { b.push([]); for (c = 0; c < 8; c++) { v = +a[r * 8 + c]; b[r].push(v === 1 ? 1 : v === -1 ? 2 : v === 2 ? 3 : v === -2 ? 4 : 0); } } return b; }
    function kkTeach() {
      if (cur < 1 || KK.busy) return;
      var h0 = hist[cur - 1], m = hist[cur].m, f = m.path[0], e = m.path[m.path.length - 1];
      var body = { board: toEng(h0.b), side: h0.t, from: f[0] * 8 + f[1], to: e[0] * 8 + e[1] };
      KK.busy = true; KK.msg = '⏳ Dragon tekshiryapti…'; draw();
      kkPost('/api/kkbook/check', body).then(function (c) {
        if (c.error) { KK.busy = false; KK.msg = '⚠️ ' + c.error; draw(); return; }
        if (!c.same && c.evBest != null && c.evMove != null && c.evBest - c.evMove > 0.5 &&
          !confirm('⚠️ Dragon bu yurishni yomonroq deb baholayapti.\n\nSiznikiga: ' + evFmt(c.evMove) + '\nEng yaxshisi ' + (c.best || '?') + ': ' + evFmt(c.evBest) + '\n\nBaribir King Kongga o‘rgatamizmi?')) { KK.busy = false; KK.msg = 'Bekor qilindi'; draw(); return; }
        return kkPost('/api/kkbook/add', body).then(function (r) { KK.busy = false; KK.msg = r.error ? '⚠️ ' + r.error : '✅ O‘rgatildi: ' + r.n + ' (jami ' + r.total + ')'; draw(); });
      }).catch(function () { KK.busy = false; KK.msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    // 🦍 doskadagi partiyani (yoki tanlangan yurishgacha) bir bosishda o'rgatish
    function kkGameMoves() {
      var L = [];
      for (var i = 1; i <= cur; i++) {
        var h0 = hist[i - 1], m = hist[i].m; if (!m) continue;
        if (KK.sides === 'w' ? h0.t <= 0 : KK.sides === 'b' ? h0.t >= 0 : false) continue;
        var f = m.path[0], e = m.path[m.path.length - 1];
        L.push({ board: toEng(h0.b), side: h0.t, from: f[0] * 8 + f[1], to: e[0] * 8 + e[1], nm: note(m), no: Math.ceil(i / 2) });
      }
      return L;
    }
    function kkGame() {
      if (KK.busy) return;
      var L = kkGameMoves(); if (!L.length) { KK.msg = 'Doskada ' + (KK.sides === 'w' ? 'oq' : KK.sides === 'b' ? 'qora' : '') + ' yurish yo‘q — avval o‘ynang'; draw(); return; }
      var body = L.map(function (x) { return { board: x.board, side: x.side, from: x.from, to: x.to }; });
      KK.busy = true; KK.pend = null; KK.msg = '⏳ Dragon ' + L.length + ' ta yurishni tekshiryapti… (~' + Math.max(2, Math.round(L.length * 0.7)) + ' s)'; draw();
      kkPost('/api/kkbook/game', { moves: body }).then(function (c) {
        KK.busy = false;
        if (c.error) { KK.msg = '⚠️ ' + c.error; draw(); return; }
        if (!c.bad.length) return kkGameGo(body, []);
        c.bad.forEach(function (b) { b.no = L[b.i].no; });
        KK.pend = { body: body, bad: c.bad }; KK.msg = ''; draw();
      }).catch(function () { KK.busy = false; KK.msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    function kkGameGo(body, skip) {
      KK.busy = true; KK.pend = null; KK.msg = '⏳ O‘rgatilmoqda…'; draw();
      kkPost('/api/kkbook/game', { moves: body, go: 1, skip: skip }).then(function (r) { KK.busy = false; KK.msg = r.error ? '⚠️ ' + r.error : '✅ ' + r.added + ' ta yurish King Kongga o‘rgatildi (jami ' + r.total + ')'; draw(); })
        .catch(function () { KK.busy = false; KK.msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    }
    function kkList() {
      var o = document.createElement('div'); o.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:10px';
      var bx = document.createElement('div'); bx.style.cssText = 'width:100%;max-width:440px;max-height:92%;overflow-y:auto;background:#0b0e1a;color:#fff;border:1px solid #5a3a10;border-radius:18px;padding:14px;font:14px system-ui,sans-serif';
      o.appendChild(bx); document.body.appendChild(o); o.onclick = function (e) { if (e.target === o) o.remove(); };
      bx.innerHTML = 'Yuklanmoqda…';
      fetch('/api/kkbook', { headers: hd() }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.error) { bx.textContent = d.error; return; }
        var s = '<div style="display:flex;align-items:center;margin-bottom:8px"><b style="font-size:17px">🦍 O‘rgatilgan yurishlar (' + d.total + ')</b>' + (d.deep != null ? '<span style="font-size:12px;opacity:.7;margin-left:8px">saboq: ' + d.deep + '</span>' : '') + '<span data-x style="margin-left:auto;font-size:22px;padding:2px 8px;cursor:pointer">✕</span></div>';
        if (!d.list.length) s += '<div style="opacity:.7">Hali hech narsa o‘rgatilmagan</div>';
        d.list.forEach(function (x) {
          s += '<div style="display:flex;align-items:center;gap:8px;padding:8px 2px;border-bottom:1px solid #1c2147"><div style="flex:1"><b>' + (x.s > 0 ? '⚪ ' : '⚫ ') + x.n + '</b><div style="font-size:12px;opacity:.7">' + new Date(x.at).toLocaleDateString('ru') + ' · ishlatildi ' + x.used + ' · KK: ' + x.w + 'G ' + x.d + 'D ' + x.l + 'M</div></div>' +
            '<button data-o="' + x.k + '" style="border:0;border-radius:10px;padding:7px 10px;background:#262b66;color:#fff">Ochish</button><button data-d="' + x.k + '" style="border:0;border-radius:10px;padding:7px 10px;background:#5a2a35;color:#fff">🗑</button></div>';
        });
        bx.innerHTML = s; bx.querySelector('[data-x]').onclick = function () { o.remove(); };
        var byK = {}; d.list.forEach(function (x) { byK[x.k] = x; });
        [].forEach.call(bx.querySelectorAll('[data-o]'), function (b) { b.onclick = function () { var x = byK[b.getAttribute('data-o')]; o.remove(); newPos(kkFromEng(x.b.split(','), x.s), x.s); }; });
        [].forEach.call(bx.querySelectorAll('[data-d]'), function (b) { b.onclick = function () { if (!confirm('O‘chirilsinmi?')) return; kkPost('/api/kkbook/del', { k: b.getAttribute('data-d') }).then(function () { b.parentNode.remove(); }); }; });
      }).catch(function () { bx.textContent = 'Server bilan aloqa yo‘q'; });
    }
    var A = {
      kk: function () { panel = 'kk'; KK.msg = ''; KK.pend = null; },
      kkteach: function () { kkTeach(); },
      auto: function () { panel = 'auto'; PL = null; AU.msg = ''; },
      auon: function () { if (AU.run) return; PL = null; hist = hist.slice(0, cur + 1); AU.run = true; AU.msg = ''; setTimeout(auStep, 30); },
      auoff: function () { auStop('⏸ To‘xtatildi — istalgan yurishga qaytib, o‘zingiz davom ettirishingiz mumkin'); return 1; },
      aunew: function () { newPos(start(), 1); panel = 'auto'; AU.run = true; setTimeout(auStep, 30); },
      kkgame: function () { kkGame(); },
      kkdeep: function () {
        if (!confirm('King Kong yutqazgan o‘yinlardan olgan hamma «saboq»larni o‘chiramizmi?\n\nBu joylarda u yana odatdagidek (nazariya, oddiy vaqt) o‘ynaydi. O‘zingiz o‘rgatgan yurishlar o‘chmaydi.')) return;
        KK.msg = '⏳ Tozalanmoqda…';
        kkPost('/api/kkbook/deepclear', {}).then(function (r) { KK.msg = '✅ ' + (r.n || 0) + ' ta saboq o‘chirildi'; KKP = {}; draw(); }).catch(function () { KK.msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
      },
      kkall: function () { if (KK.pend) kkGameGo(KK.pend.body, []); },
      kkgood: function () { if (KK.pend) kkGameGo(KK.pend.body, KK.pend.bad.map(function (b) { return b.i; })); },
      kkno: function () { KK.pend = null; KK.msg = 'Bekor qilindi'; },
      kklist: function () { kkList(); },
      kkpdn: function () { panel = 'kkpdn'; KK.msg = ''; },
      kkload: function () {
        var ta = document.getElementById('kkPdn'), txt = ta ? ta.value : ''; if (!txt.trim()) { KK.msg = 'Yurishlarni kiriting'; return; }
        KK.text = txt;
        var toks = txt.replace(/\{[^}]*\}/g, ' ').split(/\s+/).filter(function (t) { return t && !/^\d+\.+$/.test(t) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t); }).map(function (t) { return t.replace(/^\d+\.+/, '').toLowerCase(); });
        var H = [{ b: start(), t: 1, m: null }], err = '';
        for (var n = 0; n < toks.length; n++) {
          var ps = toks[n].split(/[-:x]/).map(function (q) { var c = 'abcdefgh'.indexOf(q[0]), r = 8 - parseInt(q.slice(1), 10); return (c < 0 || !(r >= 0 && r < 8)) ? null : [r, c]; });
          if (ps.length < 2 || ps.some(function (q) { return !q; })) { err = (n + 1) + '-yurish tushunarsiz: «' + toks[n] + '»'; break; }
          var h = H[H.length - 1], f = ps[0], e = ps[ps.length - 1], ms = legal(h.b, h.t).filter(function (m) { var z = m.path[m.path.length - 1]; return m.path[0][0] === f[0] && m.path[0][1] === f[1] && z[0] === e[0] && z[1] === e[1]; });
          var m = (ps.length > 2 && ms.filter(function (x) { return x.path.length === ps.length && x.path.every(function (q, i) { return q[0] === ps[i][0] && q[1] === ps[i][1]; }); })[0]) || ms[0];
          if (!m) { err = (n + 1) + '-yurish noto‘g‘ri: «' + toks[n] + '»'; break; }
          H.push({ b: applyM(h.b, m), t: -h.t, m: m, n: note(m) });
        }
        if (H.length < 2) { KK.msg = '⚠️ ' + (err || 'Yurish topilmadi'); return; }
        AU.run = false; AU.msg = ''; GI = null; PL = null; E = null; sel = null;
        hist = H; cur = H.length - 1; panel = 'kk'; KK.pend = null;
        KK.msg = '♟ ' + Math.ceil((H.length - 1) / 2) + ' ta yurish doskaga qo‘yildi' + (err ? ' (⚠️ ' + err + ')' : '') + '. ◀ ▶ bilan yurib chiqing: ?! ? ?? — xato yurishlar, 🦍 — King Kong boshqacha yurardi. Xato joyda to‘g‘ri yurishni qilib, «Shu yurishni o‘rgatish»ni bosing.';
        if (!S.engine) { S.engine = true; sv(); }
        setTimeout(runAll, 50);
      },
      kkpdngo: function () {
        var ta = document.getElementById('kkPdn'), txt = ta ? ta.value : ''; if (!txt.trim()) { KK.msg = 'Yurishlarni kiriting'; return; }
        KK.text = txt; KK.msg = '⏳ Kiritilmoqda…';
        kkPost('/api/kkbook/pdn', { text: txt, sides: KK.sides }).then(function (r) { KK.msg = (r.added ? '✅ ' + r.added + ' ta yurish o‘rgatildi (jami ' + r.total + ')' : '') + (r.error ? ' ⚠️ ' + r.error : ''); draw(); }).catch(function () { KK.msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
      },
      menu: function () { panel = panel && panel !== 'book' && panel !== 'engp' ? null : 'menu'; E = null; },
      engp: function () { panel = panel === 'engp' ? null : 'engp'; E = null; },
      drw: function () { DR.on = !DR.on; DR.from = null; },
      drclr: function () { delete SH[kf(hist[cur])]; DR.from = null; },
      book: function () { panel = panel === 'book' ? null : 'book'; E = null; },
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
      if (n.indexOf('bk') === 0) return bkAct(n, v);
      if (n === 'au') { if (+v > 1 && !window.__prem && !window.__isAdmin) { if (window.premGo) window.premGo(); return; } AU.t = +v; }
      else if (n === 'kks') { KK.sides = v; var _ta = document.getElementById('kkPdn'); if (_ta) KK.text = _ta.value; }
      else if (n === 'tool') { E.tool = +v; }
      else if (n === 'st') { if (+v > 2 && !window.__prem) { if (window.premGo) window.premGo(); return; } S.t = +v; sv(); }
      else if (n === 'tog') { S[v] = S[v] === false ? true : !S[v]; sv(); }
      else if (n === 'drc') { DR.col = +v; DR.on = true; }
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
    // ---------- 📖 Baza (lichess Explorer kabi): ShashkaPRO o'yinlari, Colette/kitob, lidraughts, repertuar (admin)
    var BK = { src: window.__isAdmin ? 'rep' : 'sp', D: {}, ed: null, E: {}, msg: '' };
    function bkKey(h) { return kf(h) + '|' + BK.src; }
    function bkLoad(h, src0, quiet) {
      src0 = src0 || BK.src; var k = kf(h) + '|' + src0; if (BK.D[k]) return BK.D[k];
      BK.D[k] = { load: 1 };
      fetch('/api/explore', { method: 'POST', headers: hd(), body: JSON.stringify({ board: toEng(h.b), side: h.t, src: src0, sc: 'all', hk: hist.slice(Math.max(0, cur - 59), cur + 1).map(function (x) { return toEng(x.b).join('') + x.t; }) }) }).then(function (r) { return r.json(); })
        .then(function (j) { BK.D[k] = j || { rows: [] }; if (j && j.building) setTimeout(function () { delete BK.D[k]; }, 15000); if (src0 === 'rep' && j && j.rows) { BK.E[kf(h)] = {}; j.rows.forEach(function (x) { BK.E[kf(h)][x.id] = { w: x.w, mk: x.mk || '', note: x.note || '', lock: x.lock || !x.w, auto: x.src === 'dragon' && !x.lock }; }); if (!j.rows.some(function (x) { return x.w > 0; })) if (!quiet) bkSug(h, false); } if (document.getElementById('spBd')) draw(); })
        .catch(function () { BK.D[k] = { err: 1 }; });
      return BK.D[k];
    }
    // 🐉 Dragon taklifi: foizlarni dvigatel bo'yicha to'ldirish (saqlanmaydi — admin tekshirib 💾 bosadi)
    function repList(h) {   // saqlangan repertuar yurishlari, foiz bo'yicha kamayib
      if (!window.__isAdmin) return [];
      var E = BK.E[kf(h)], d = BK.D[kf(h) + '|rep']; if (!E || !d || !d.rows) return [];
      return d.rows.filter(function (x) { return E[x.id] && E[x.id].w > 0 && !E[x.id].sug; }).sort(function (a, b) { return E[b.id].w - E[a.id].w; });
    }
    function repArrows(h) {   // 🦍 Repertuar tabida: strelkalar foiz bo'yicha (eng kattasi yashil)
      var L = repList(h).slice(0, S.mpv || 3); if (!L.length) return '';
      var E = BK.E[kf(h)], top = E[L[0].id].w, o = '';
      L.forEach(function (x, i) { var q = E[x.id].w / 100; o += arrowEl(fl([x.from >> 3, x.from & 7]), fl([x.to >> 3, x.to & 7]), '#3fb950', i === 0 || E[x.id].w >= top ? .15 : (0.06 + 0.06 * q).toFixed(3), i === 0 || E[x.id].w >= top ? .85 : (0.3 + 0.3 * q).toFixed(2), 'rpAh'); });
      return '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs>' + mkr('rpAh', '#3fb950') + '</defs>' + o + '</svg>';
    }
    function repTop(h) {
      if (!window.__isAdmin) return '';
      var E = BK.E[kf(h)], d = BK.D[kf(h) + '|rep']; if (!E || !d || !d.rows) return '';
      var L = repList(h); if (!L.length) return '';
      return '🦍 KK: <b style="color:#9be89b">' + L[0].t + ' (' + E[L[0].id].w + ')</b> · ';
    }
    function bkSug(h, force) {
      var kk = kf(h); BK.sg = BK.sg || {}; if (BK.sg[kk] && !force) return; BK.sg[kk] = { load: 1 };
      fetch('/api/kkrep/suggest', { method: 'POST', headers: hd(), body: JSON.stringify({ board: toEng(h.b), side: h.t }) }).then(function (r) { return r.json(); }).then(function (j) {
        BK.sg[kk] = { on: 1 }; var E = BK.E[kk] = BK.E[kk] || {};
        (j.list || []).forEach(function (x) { var e = E[x.id] = E[x.id] || { w: 0, mk: '', note: '' }; if (force || !e.w) { e.w = x.w; e.sug = 1; e.ev = x.ev; } });
        if (document.getElementById('spBdB')) draw();
      }).catch(function () { BK.sg[kk] = null; });
    }
    function bkArrows(h, flip) {
      var d = BK.D[bkKey(h)]; if (!d || !d.rows || !d.rows.length) return '';
      var NA = S.mpv || 3, rows = d.rows.slice(0, NA), mx = 0;
      var EE = BK.src === 'rep' ? (BK.E[kf(h)] || {}) : null; if (EE) rows = d.rows.filter(function (x) { return EE[x.id] && EE[x.id].w > 0; }).sort(function (a, b) { return EE[b.id].w - EE[a.id].w; }).slice(0, NA).map(function (x) { return Object.assign({}, x, { w: EE[x.id].w }); });
      rows.forEach(function (x) { mx = Math.max(mx, BK.src === 'rep' ? (x.w || 0) : (x.n || 1)); });
      var o = '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs><marker id="bkAh" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#2f6fd6"/></marker></defs>';
      rows.forEach(function (x) {
        var v = BK.src === 'rep' ? (x.w || 0) : (x.n || 1); if (!v) return; var q = v / (mx || 1);
        var f = [x.from >> 3, x.from & 7], t = [x.to >> 3, x.to & 7];
        var x1 = (flip ? 7 - f[1] : f[1]) + .5, y1 = (flip ? 7 - f[0] : f[0]) + .5, x2 = (flip ? 7 - t[1] : t[1]) + .5, y2 = (flip ? 7 - t[0] : t[0]) + .5, dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1; x2 -= dx / L * .3; y2 -= dy / L * .3;
        o += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#2f6fd6" stroke-width="' + (0.05 + 0.09 * q).toFixed(3) + '" stroke-linecap="round" opacity="' + (0.4 + 0.4 * q).toFixed(2) + '" marker-end="url(#bkAh)"/>';
      });
      return o + '</svg>';
    }
    function wdl(x) {
      var n = x.n || 0; if (!n) return '<span style="flex:1"></span>';
      var a = Math.round(x.w * 100 / n), z = Math.round(x.l * 100 / n), m = 100 - a - z;
      var seg = function (p, bg, fg) { return p > 0 ? '<i style="font-style:normal;width:' + p + '%;background:' + bg + ';color:' + fg + ';display:flex;align-items:center;justify-content:center;overflow:hidden">' + (p >= 14 ? p + '%' : '') + '</i>' : ''; };
      return '<span style="flex:1;display:flex;height:18px;border-radius:9px;overflow:hidden;font-size:10.5px;font-weight:700">' + seg(a, '#f2f2f2', '#222') + seg(m, '#8a8a8a', '#fff') + seg(z, '#2a2a2a', '#ddd') + '</span>';
    }
    function bookHtml() {
      var h = hist[cur], d = bkLoad(h), adm = !!window.__isAdmin, sm = 'border:0;border-radius:10px;padding:7px 10px;color:#fff;font-size:13px;margin:2px;';
      var tabs = (adm ? [['rep', '📖 Repertuar']] : []).concat([['col', '🐉 Dragon'], ['sp', '🎮 O‘yinchilar']]);
      var o = '<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px">' + tabs.map(function (t) { return '<button data-a="bksrc:' + t[0] + '" style="' + sm + 'background:' + (BK.src === t[0] ? '#6aa22a' : '#1d1f3a') + '">' + t[1] + '</button>'; }).join('') + '</div>';
      if (d && d.op) o = '<div style="display:flex;align-items:center;gap:8px;margin:-2px 0 8px;padding:6px 8px;border-radius:8px;background:#1d2a14"><div style="flex:1;min-width:0;line-height:1.3"><b style="color:#7cc3ff">📖 ' + esc2(d.op.uz) + '</b><br><span style="font-size:12px;opacity:.7">' + esc2(d.op.ru) + '</span></div><button data-a="bkop:' + d.op.i + '" style="border:0;border-radius:8px;padding:7px 10px;background:#262b66;color:#fff;font-size:13px;white-space:nowrap">▶ O‘rganish</button></div>' + o;
      if (!d || d.load) return o + '<div style="opacity:.7">⏳ Yuklanmoqda…</div>';
      if (d.err || d.error) return o + '<div style="opacity:.7">⚠️ ' + (d.error || 'Server bilan aloqa yo‘q') + '</div>';
      var rows = d.rows || [];
      if (BK.src === 'sp' && d.building) o += '<div style="font-size:12px;opacity:.7;margin-bottom:6px">⏳ Baza yig‘ilmoqda (' + (d.games || 0) + ' partiya)…</div>';
      if (BK.src === 'rep') {
        var E = BK.E[kf(h)] || {}, sum = 0, mxw = 0; Object.keys(E).forEach(function (id) { sum += E[id].w || 0; mxw = Math.max(mxw, E[id].w || 0); });
        if (d.taught) o += '<div style="font-size:12.5px;color:#fde68a;margin-bottom:6px">📚 Bu pozitsiyada o‘rgatilgan yurish ham bor — foiz qo‘yilgan bo‘lsa, repertuar undan ustun</div>';
        if (BK.ed && E[BK.ed]) {
          var e = E[BK.ed], r0 = rows.filter(function (x) { return x.id === BK.ed; })[0] || {};
          o += '<div style="background:#1d1f3a;border-radius:12px;padding:10px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px"><b style="font:800 16px ui-monospace,monospace">' + r0.t + '</b><input id="bkW" type="range" min="0" max="100" step="5" value="' + e.w + '" oninput="var q=document.getElementById(\'bkWv\');if(q)q.textContent=this.value" style="flex:1;accent-color:#22c55e"><b id="bkWv" style="min-width:30px;text-align:right">' + e.w + '</b></div>' +
            '<div style="font-size:12px;opacity:.75;margin-top:4px">' + (e.w && e.w >= mxw ? 'King Kong shuni o‘ynaydi' : 'zaxira yurish') + (r0.st ? ' · ✅ ' + r0.st.w + ' · ❌ ' + r0.st.l + ' · 🤝 ' + r0.st.d : '') + (e.lock && e.w ? ' · 🔒 qo‘lda' : '') + '</div>' +
            '<div style="margin-top:6px">' + ['!!', '!', '!?', '?!', '?', '??'].map(function (k2) { return '<button data-a="bkmk:' + k2 + '" style="' + sm + 'background:' + (e.mk === k2 ? '#6aa22a' : '#262b66') + '">' + k2 + '</button>'; }).join('') + '</div>' +
            '<input id="bkN" placeholder="📝 izoh" value="' + String(e.note || '').replace(/"/g, '&quot;') + '" style="width:100%;margin-top:6px;border:0;border-radius:10px;padding:8px;background:#262b66;color:#fff;font-size:13px">' +
            '<div style="display:flex;gap:6px;margin-top:8px"><button data-a="bkplay:' + BK.ed + '" style="' + sm + 'background:#262b66;flex:1">▶ O‘ynash</button><button data-a="bkclose" style="' + sm + 'background:#262b66;flex:1">Yopish</button><button data-a="bksave" style="' + sm + 'background:#16a34a;flex:1;font-weight:800">💾 Saqlash</button></div>' + (BK.msg ? '<div style="margin-top:6px;font-size:13px">' + BK.msg + '</div>' : '') + '</div>';
        }
        o += '<div style="display:flex;font-size:11.5px;opacity:.6;padding:0 4px 4px"><span style="width:70px">Yurish</span><span style="width:86px">King Kong</span><span style="flex:1;text-align:right">natija</span></div>';
        o += rows.map(function (x) {
          var e = E[x.id] || { w: 0 }, pct = sum ? Math.round(e.w * 100 / sum) : 0;
          return '<div data-a="bked:' + x.id + '" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:7px 4px;border-bottom:1px solid #22264d;cursor:pointer;' + (BK.ed === x.id ? 'background:#2c4a1c;' : '') + '"><b style="width:70px;font-family:ui-monospace,monospace;color:' + (e.w ? '#9be89b' : '#c7c2ff') + '">' + x.t + '</b><span style="width:86px;flex:none;font-size:12px;white-space:nowrap">' + (e.w ? (e.sug || e.auto ? '<span style="color:#fde68a">' : '') + e.w + (e.sug || e.auto ? '</span>' : '') : '—') + '<i style="display:block;height:4px;border-radius:2px;background:#22c55e;margin-top:3px;width:' + e.w + '%"></i></span><b style="width:34px;flex:none;text-align:center;font-size:17px;color:' + ({ '!!': '#22c55e', '!': '#86efac', '!?': '#fde047', '?!': '#fbbf24', '?': '#f87171', '??': '#ef4444' }[e.mk] || '#fff') + '">' + (e.mk || '') + '</b><span style="flex:1;text-align:right;font-size:11.5px;opacity:.8">' + (x.st ? '✅' + x.st.w + ' ❌' + x.st.l + ' 🤝' + x.st.d : '') + (x.trap ? ' 🪤' : '') + (e.note ? ' 📝' : '') + '</span>' + opSm(x) + '</div>';
        }).join('');
        var anyAuto = Object.keys(E).some(function (id) { return E[id].auto; }), anySug = Object.keys(E).some(function (id) { return E[id].sug; }), sgl = BK.sg && BK.sg[kf(h)] && BK.sg[kf(h)].load;
        if (anyAuto && !anySug) o += '<div style="font-size:12.5px;color:#fde68a;margin-top:8px">Sariq foizlar avtomatik qo‘yilgan, hali tekshirilmagan. To‘g‘ri bo‘lsa — Saqlash.</div>';
        if (anySug) o += '<div style="font-size:12.5px;color:#fde68a;margin-top:8px">Sariq foizlar — dvigatel taklifi, hali saqlanmagan. Tekshirib, kerak bo‘lsa to‘g‘rilang va saqlang.</div>';
        o += '<div style="display:flex;gap:6px;margin-top:8px"><button data-a="bksug" style="' + sm + 'background:#262b66;flex:1">' + (sgl ? '⏳ Dragon baholayapti…' : '🐉 Dragon bilan to‘ldirish') + '</button>' + (anySug || anyAuto ? '<button data-a="bksaveall" style="' + sm + 'background:#16a34a;flex:1;font-weight:800">💾 Hammasini saqlash</button>' : '') + '</div>';
        if (BK.msg && !BK.ed) o += '<div style="margin-top:6px;font-size:13px">' + BK.msg + '</div>';
        return o + '<div style="font-size:11.5px;opacity:.65;margin-top:6px">Yurishni bossangiz — foiz, belgi va izoh. King Kong eng katta foizli yurishni o‘ynaydi; tenglar bo‘lsa — ular orasidan.</div>';
      }
      if (!rows.length) return o + '<div style="opacity:.7;padding:6px 2px">' + (BK.src === 'col' ? 'nazariya bazasida bu pozitsiya yo‘q' : 'Bu pozitsiyada hali partiya yo‘q') + '</div>';
      if (BK.src === 'col') return o + rows.map(function (x) { return '<div data-a="bkplay:' + x.id + '" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #22264d;cursor:pointer"><b style="width:70px;font-family:ui-monospace,monospace">' + x.t + '</b><span style="flex:1">' + x.tag + '</span><span style="opacity:.7;font-size:12px">' + (x.n ? x.n.toLocaleString() + ' marta' : '') + '</span>' + opSm(x) + '</div>'; }).join('');
      var tot = 0; rows.forEach(function (x) { tot += x.n; });
      o += '<div style="display:flex;font-size:11.5px;opacity:.6;padding:0 4px 4px"><span style="width:62px">Yurish</span><span style="width:84px">O‘yinlar</span><span style="flex:1;text-align:center">Oq / Durang / Qora</span></div>';
      return o + rows.map(function (x) { return '<div data-a="bkplay:' + x.id + '" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:7px 4px;border-bottom:1px solid #22264d;cursor:pointer"><b style="width:62px;font-family:ui-monospace,monospace">' + x.t + '</b><span style="width:84px;font-size:12px;opacity:.85">' + Math.round(x.n * 100 / (tot || 1)) + '% · ' + x.n + '</span>' + wdl(x) + opSm(x) + '</div>'; }).join('');
    }
    function esc2(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function opSm(x) { return x.op ? '<small style="flex-basis:100%;font:400 11px Arial;color:#9aa3d9;margin-top:-2px">' + esc2(x.op) + '</small>' : ''; }
    function bkAct(n, v) {
      if (n === 'bkop') { var go = function () { if (window.spDebut) window.spDebut(+v); }; if (window.spDebut) go(); else { var sd = document.createElement('script'); sd.src = '/debyut.js?v=3'; sd.onload = go; document.head.appendChild(sd); } return; }
      var h = hist[cur], E = BK.E[kf(h)] || {};
      var rd = function () { var w = document.getElementById('bkW'), nt = document.getElementById('bkN'); if (BK.ed && E[BK.ed]) { if (w) E[BK.ed].w = +w.value; if (nt) E[BK.ed].note = nt.value; } };
      if (n === 'bksrc') { BK.src = v; BK.ed = null; BK.msg = ''; }
      else if (n === 'bked') { rd(); BK.ed = BK.ed === v ? null : v; BK.msg = ''; if (BK.ed && !E[v]) E[v] = { w: 0, mk: '', note: '' }; }
      else if (n === 'bkclose') { BK.ed = null; BK.msg = ''; }
      else if (n === 'bksug') { bkSug(h, true); BK.msg = ''; }
      else if (n === 'bksaveall') {
        rd(); Object.keys(E).forEach(function (id) { E[id].lock = true; }); BK.msg = '⏳';
        fetch('/api/kkrep/set', { method: 'POST', headers: hd(), body: JSON.stringify({ sc: 'all', board: toEng(h.b), side: h.t, moves: E, why: '🐉 Dragon taklifi' }) }).then(function (r) { return r.json(); }).then(function (j) { BK.msg = j && j.ok ? '✅ Saqlandi' : '⚠️ ' + ((j && j.error) || 'xato'); if (j && j.ok) Object.keys(E).forEach(function (id) { delete E[id].sug; delete E[id].auto; }); delete BK.D[bkKey(h)]; draw(); });
      }
      else if (n === 'bkmk') { rd(); if (E[BK.ed]) E[BK.ed].mk = E[BK.ed].mk === v ? '' : v; }
      else if (n === 'bksave') {
        rd(); Object.keys(E).forEach(function (id) { E[id].lock = true; }); BK.msg = '⏳';
        fetch('/api/kkrep/set', { method: 'POST', headers: hd(), body: JSON.stringify({ sc: 'all', board: toEng(h.b), side: h.t, moves: E }) }).then(function (r) { return r.json(); }).then(function (j) { BK.msg = j && j.ok ? '✅ Saqlandi' : '⚠️ ' + ((j && j.error) || 'xato'); if (j && j.ok) Object.keys(E).forEach(function (id) { delete E[id].sug; delete E[id].auto; }); delete BK.D[bkKey(h)]; try { Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {} draw(); });
      }
      else if (n === 'bkplay') {
        var ft = v.split('-').map(Number), ms = legal(h.b, h.t), m = ms.filter(function (x) { var a = x.path[0], z = x.path[x.path.length - 1]; return a[0] * 8 + a[1] === ft[0] && z[0] * 8 + z[1] === ft[1]; })[0];
        if (m) { BK.ed = null; BK.msg = ''; play(m); return; }
      }
      draw();
    }
    // ---------- ⚙️ Dvigatel sozlamalari, strelkalar, chizish, FEN/PDN (lichess kabi)
    var DR = { on: false, col: 0, from: null }, SH = {}, DCOL = ['#15781b', '#b0302a', '#2f6fd6', '#e6a700'];
    var TV = [0.5, 1, 2, 3, 5, 10], PLV = [4, 6, 8, 10, 12];
    function rgTxt(n, v) { return n === 't' ? TV[v] + 's' : n === 'mpv' ? v + ' / 3' : PLV[v] + ''; }
    function rgSet(n, v) {
      if (n === 't') { var t = TV[v]; if (t > 3 && !window.__prem && !window.__isAdmin) { if (window.premGo) window.premGo(); draw(); return; } S.t = t; }
      else if (n === 'mpv') S.mpv = v; else if (n === 'pl') S.pl = PLV[v];
      sv(); PVC = {}; if (n === 't') EV = {}; draw(); analyzeCur();
    }
    function engHtml(sm) {
      var row = function (lb, inner) { return '<div style="display:flex;align-items:center;gap:10px;margin:9px 0;font-size:14px"><span style="width:118px;flex:none">' + lb + '</span>' + inner + '</div>'; };
      var rg = function (n, mx, v) { return '<input type="range" data-rg="' + n + '" min="0" max="' + mx + '" step="1" value="' + v + '" style="flex:1;accent-color:#3b82f6"><b style="width:44px;text-align:right">' + rgTxt(n, v) + '</b>'; };
      var tg = function (k2, on) { return '<span data-a="tog:' + k2 + '" style="flex:none;display:inline-block;width:42px;height:24px;border-radius:12px;background:' + (on ? '#6aa22a' : '#555') + ';position:relative;cursor:pointer"><span style="position:absolute;top:3px;' + (on ? 'right:3px' : 'left:3px') + ';width:18px;height:18px;border-radius:50%;background:#fff"></span></span>'; };
      var ti = Math.max(0, TV.indexOf(S.t)); if (TV.indexOf(S.t) < 0) ti = 2;
      var o = row('Dvigatel', '<span style="flex:1;border:2px solid #3b82f6;border-radius:8px;padding:6px 10px;background:#1d1f3a">🐉 Dragon · server</span>' + tg('engine', S.engine));
      o += row('Qidiruv vaqti', rg('t', TV.length - 1, ti));
      o += row('Variantlar soni', '<input type="range" data-rg="mpv" min="1" max="3" step="1" value="' + (S.mpv || 3) + '" style="flex:1;accent-color:#3b82f6"><b style="width:44px;text-align:right">' + (S.mpv || 3) + ' / 3</b>');
      o += row('Variant uzunligi', rg('pl', PLV.length - 1, Math.max(0, PLV.indexOf(S.pl || 8))));
      if (!window.__prem && !window.__isAdmin) o += '<div style="font-size:12px;color:#ffd54a">👑 5 va 10 soniya — Premium uchun</div>';
      o += '<div style="font-size:12px;opacity:.65;margin:12px 0 2px;letter-spacing:.5px">STRELKALAR</div>';
      o += row('Eng yaxshi yurish', '<span style="flex:1"></span>' + tg('arrow', S.arrow));
      o += row('2–3-variantlar', '<span style="flex:1;font-size:12px;opacity:.7">xira strelka</span>' + tg('aa', S.aa !== false));
      o += row('📖 Baza yurishlari', '<span style="flex:1;font-size:12px;opacity:.7">ko‘k, ' + (S.mpv || 3) + ' ta</span>' + tg('bka', !!S.bka));
      o += row('Oxirgi yurish', '<span style="flex:1"></span>' + tg('alm', S.alm !== false));
      o += '<div style="font-size:12px;opacity:.65;margin:12px 0 2px;letter-spacing:.5px">O‘Z STRELKALARIM</div>';
      o += row('✏️ Chizish', '<span style="flex:1;display:flex;gap:8px">' + DCOL.map(function (c, i) { return '<span data-a="drc:' + i + '" style="cursor:pointer;width:26px;height:26px;border-radius:50%;background:' + c + ';' + (DR.on && DR.col === i ? 'outline:3px solid #fff' : '') + '"></span>'; }).join('') + '</span>' + '<span data-a="drw" style="flex:none;display:inline-block;width:42px;height:24px;border-radius:12px;background:' + (DR.on ? '#6aa22a' : '#555') + ';position:relative;cursor:pointer"><span style="position:absolute;top:3px;' + (DR.on ? 'right:3px' : 'left:3px') + ';width:18px;height:18px;border-radius:50%;background:#fff"></span></span>');
      o += '<div style="font-size:12px;opacity:.75">Katakdan katakka bosing — strelka, bir katakni ikki marta — doira. ' + (DR.on ? '<b style="color:#9be89b">Chizish yoqiq</b> — yurish uchun o‘chiring.' : '') + '</div><div style="margin-top:6px"><button data-a="drclr" style="' + sm + '">🧽 Tozalash</button></div>';
      return o;
    }
    function arrowEl(f, t, col, w, op, id) {
      var x1 = f[1] + .5, y1 = f[0] + .5, x2 = t[1] + .5, y2 = t[0] + .5, dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1; x2 -= dx / L * .3; y2 -= dy / L * .3;
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" opacity="' + op + '" marker-end="url(#' + id + ')"/>';
    }
    function mkr(id, col) { return '<marker id="' + id + '" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="' + col + '"/></marker>'; }
    function fl(q) { return flip ? [7 - q[0], 7 - q[1]] : q; }
    function altArrows(r) {
      if (!r || !r.lines || r.lines.length < 2 || (S.mpv || 3) < 2) return '';
      var o = '';
      r.lines.slice(1, S.mpv || 3).forEach(function (L) { var P = L.pv && L.pv[0] && L.pv[0].path; if (!P || P.length < 2) return; o += arrowEl(fl([P[0] >> 3, P[0] & 7]), fl([P[P.length - 1] >> 3, P[P.length - 1] & 7]), '#3fb950', .1, .4, 'bdAh2'); });
      return o ? '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs>' + mkr('bdAh2', '#3fb950') + '</defs>' + o + '</svg>' : '';
    }
    function shapesSvg(k) {
      var L = SH[k] || [], o = '', d = '';
      DCOL.forEach(function (c, i) { d += mkr('drA' + i, c); });
      L.forEach(function (z) {
        var f = fl(z.f), t = fl(z.t);
        if (f[0] === t[0] && f[1] === t[1]) o += '<circle cx="' + (f[1] + .5) + '" cy="' + (f[0] + .5) + '" r=".44" fill="none" stroke="' + DCOL[z.c] + '" stroke-width=".07" opacity=".85"/>';
        else o += arrowEl(f, t, DCOL[z.c], .13, .8, 'drA' + z.c);
      });
      if (DR.on && DR.from) { var q = fl(DR.from); o += '<rect x="' + q[1] + '" y="' + q[0] + '" width="1" height="1" fill="' + DCOL[DR.col] + '" opacity=".35"/>'; }
      return o ? '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs>' + d + '</defs>' + o + '</svg>' : '';
    }
    function drClick(r, c) {
      var k = kf(hist[cur]);
      if (!DR.from) { DR.from = [r, c]; draw(); return; }
      var f = DR.from, L = SH[k] = SH[k] || []; DR.from = null;
      var i = L.findIndex(function (z) { return z.f[0] === f[0] && z.f[1] === f[1] && z.t[0] === r && z.t[1] === c; });
      if (i >= 0) { if (L[i].c === DR.col) L.splice(i, 1); else L[i].c = DR.col; } else L.push({ f: f, t: [r, c], c: DR.col });
      draw();
    }
    // FEN (Wa1,Kc3 kabi) va PDN
    function fenOf(h) {
      var w = [], bl = [];
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var p = h.b[r][c]; if (!p) continue; var t = (p > 2 ? 'K' : '') + sq(r, c); (W(p) ? w : bl).push(t); }
      return (h.t > 0 ? 'W' : 'B') + ':W' + w.join(',') + ':B' + bl.join(',');
    }
    function pdnOf() {
      var o = '', h0 = hist[0];
      for (var i = 1; i < hist.length; i++) { var wm = hist[i - 1].t > 0; if (wm || i === 1) o += Math.ceil((i + (h0.t > 0 ? 0 : 1)) / 2) + (wm ? '. ' : '... '); o += hist[i].n + ' '; }
      return o.trim();
    }
    function cpTxt(t, id) { try { navigator.clipboard.writeText(t); } catch (e) {} var el = ov.querySelector(id); if (el) { el.textContent = '✅'; setTimeout(function () { if (el) el.textContent = '📋'; }, 1200); } }
    var FP = { msg: '' };
    function fpLoad(txt) {
      txt = String(txt || '').trim(); if (!txt) return;
      var m = /^\s*\[?FEN\s*"?([WB]):([WB][^:"]*):([WB][^:"\]]*)/i.exec(txt) || /^([WB]):([WB][^:]*):([WB][^:\s]*)/i.exec(txt);
      if (m) {
        var b = empty(), ok = true;
        [m[2], m[3]].forEach(function (part) {
          var white = part[0].toUpperCase() === 'W';
          part.slice(1).split(',').forEach(function (x) { x = x.trim(); if (!x) return; var k2 = /^K/i.test(x); x = x.replace(/^K/i, ''); var c = 'abcdefgh'.indexOf(x[0].toLowerCase()), r = 8 - parseInt(x.slice(1), 10); if (c < 0 || !(r >= 0 && r < 8) || (r + c) % 2 !== 1) { ok = false; return; } b[r][c] = white ? (k2 ? 3 : 1) : (k2 ? 4 : 2); });
        });
        if (!ok) { FP.msg = '⚠️ FEN tushunarsiz'; draw(); return; }
        FP.msg = ''; newPos(b, m[1].toUpperCase() === 'W' ? 1 : -1); return;
      }
      var ta = document.createElement('textarea'); ta.id = 'kkPdn'; ta.value = txt; ta.style.display = 'none'; document.body.appendChild(ta);
      var keep = panel; A.kkload(); ta.remove();
      if (panel === 'kk') { panel = keep === 'kk' ? 'kk' : null; FP.msg = KK.msg && KK.msg.indexOf('⚠️') === 0 ? KK.msg : ''; KK.msg = ''; }
      else FP.msg = KK.msg || ''; draw();
    }
    function fpHtml() {
      var st = 'flex:1;min-width:0;background:#262b66;border-radius:8px;padding:8px;font:12px ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left';
      var cb = 'border:0;background:none;font-size:18px;cursor:pointer;color:#fff';
      return '<div style="margin:8px -8px 0;background:#1d1f3a;border-radius:10px;padding:8px 10px;font-size:13px">' +
        '<div style="display:flex;gap:6px;align-items:center;margin:4px 0"><b style="width:40px;text-align:left">FEN</b><div style="' + st + '">' + fenOf(hist[cur]) + '</div><button id="fpCopyF" style="' + cb + '">📋</button></div>' +
        '<div style="display:flex;gap:6px;align-items:center;margin:4px 0"><b style="width:40px;text-align:left">PDN</b><div style="' + st + '">' + (pdnOf() || '—') + '</div><button id="fpCopyP" style="' + cb + '">📋</button></div>' +
        '<div style="display:flex;gap:6px;margin-top:6px"><input id="fpIn" placeholder="FEN yoki PDN qo‘ying…" style="flex:1;min-width:0;border:0;border-radius:8px;padding:8px;background:#262b66;color:#fff;font-size:13px"><button id="fpLoad" style="border:0;border-radius:8px;padding:8px 12px;background:#2e9d6b;color:#fff">Yuklash</button></div>' +
        (FP.msg ? '<div style="margin-top:6px">' + FP.msg + '</div>' : '') + '</div>';
    }
    function draw() {
      var st = ov.scrollTop, h = hist[cur], k = kf(h), e = EV[k], ed = panel === 'edit';
      var _pf = pvFirst(PVC[k]); if (_pf && e && e.best) e = Object.assign({}, e, { best: _pf }); PVREDRAW = draw;
      var B = ed ? E.b : h.b, ms = ed ? [] : legal(h.b, h.t), over = !ed && !ms.length;
      var en = S.engine && !PL && !ed;
      var x = en ? evOf(cur) : null, pc = 50 + Math.max(-5, Math.min(5, x == null ? 0 : x)) * 10, s = '';
      var bst = 'border:0;border-radius:14px;padding:12px 16px;background:#6b5cf0;color:#fff;font-size:20px';
      var sm = 'border:0;border-radius:12px;padding:10px 12px;background:#262b66;color:#fff;font-size:14px;margin:3px';
      s += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:-4px 0 6px"><b style="white-space:nowrap">🔬 Tahlil</b><span id="bdInfo" style="flex:1;font-size:13px;opacity:.9;text-align:center;line-height:1.3">@@INFO@@</span><button id="bdX" style="border:0;border-radius:10px;padding:6px 12px;background:#262b66;color:#fff;font-size:16px">⬅️</button></div>';
      if (BAD) s += '<div style="font-size:13px;margin-bottom:8px;padding:8px 10px;border-radius:10px;background:#5a1d1d;color:#ffd0d0">⚠️ Bu o‘yin boshqa pozitsiyadan (masalan IDF 780) boshlangan, lekin u arxivga saqlanmagan (eski o‘yin). Faqat ' + (BAD - 1) + ' ta yurish ko‘rsatildi.</div>';
      if (GI && GI.title) s += '<div style="font-size:14px;margin-bottom:6px">' + String(GI.title).replace(/</g, '&lt;') + '</div>';
      else if (GI) s += '<div style="font-size:14px;margin-bottom:6px">⚪ ' + String(GI.white || '') .replace(/</g, '&lt;') + ' — ⚫ ' + String(GI.black || '').replace(/</g, '&lt;') + '<br><span style="opacity:.8">' + (GI.winner === 'white' ? '🏆 Oq yutdi' : GI.winner === 'black' ? '🏆 Qora yutdi' : '🤝 Durang') + '</span></div>';
      var GS = gameSkin();
      s += '<div style="position:relative;width:min(calc(100% + 24px),520px);margin-left:calc((100% - min(calc(100% + 24px),520px)) / 2);box-sizing:border-box"><div id="spBdB" data-th="' + GS.th + '" data-ps="' + GS.ps + '" style="--pz:' + GS.pz + '%;--km:\'' + GS.km + '\';display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);aspect-ratio:1;overflow:hidden;border:0!important;box-shadow:none!important">';
      var lm = (!ed && h.m && S.alm !== false) ? [h.m.path[0], h.m.path[h.m.path.length - 1]] : [], rr, cc, r, c, p, hl, dot;
      for (rr = 0; rr < 8; rr++) for (cc = 0; cc < 8; cc++) {
        r = flip ? 7 - rr : rr; c = flip ? 7 - cc : cc; p = B[r][c];
        hl = ''; dot = false;
        lm.forEach(function (q) { if (q[0] === r && q[1] === c) hl = 'box-shadow:inset 0 0 0 3px #f5d92b;'; });
        if (sel && !ed && sel.r === r && sel.c === c) hl = 'box-shadow:inset 0 0 0 4px #4ade80;';
        if (sel && !ed) sel.moves.forEach(function (m) { var q = m.path[m.path.length - 1]; if (q[0] === r && q[1] === c) dot = true; });
        var isLm = hl.indexOf('#f5d92b') >= 0;
        if (isLm) hl = '';
        s += '<div data-r="' + r + '" data-c="' + c + '" class="sq ' + ((r + c) % 2 ? 'd' : 'l') + (isLm ? ' lm' : '') + '" style="' + (GS.rc ? 'background:' + ((r + c) % 2 ? GS.rc[1] : GS.rc[0]) + ';' : '') + hl + 'position:relative;display:flex;align-items:center;justify-content:center">';
        if (cc === 0) s += '<span style="position:absolute;top:1px;left:3px;font:700 10px Arial;pointer-events:none;color:' + ((r + c) % 2 ? '#f0d9cf' : '#9a5a4c') + ';opacity:.9;z-index:2">' + (8 - r) + '</span>';
        if (rr === 7) s += '<span style="position:absolute;bottom:0;right:3px;font:700 10px Arial;pointer-events:none;color:' + ((r + c) % 2 ? '#f0d9cf' : '#9a5a4c') + ';opacity:.9;z-index:2">' + 'abcdefgh'[c] + '</span>';
        if (p) s += gamePc(p);
        else if (dot) s += '<div style="width:30%;height:30%;border-radius:50%;background:#4ade80;opacity:.8"></div>';
        s += '</div>';
      }
      s += '</div>';
      if (panel === 'book' && !ed && S.bka) s += bkArrows(h, flip);
      if (window.__isAdmin && !ed && !over && !BK.D[kf(h) + '|rep']) bkLoad(h, 'rep', true);
      var RPA = window.__isAdmin && !ed && !over ? repArrows(h) : '';
      if (RPA) s += RPA;
      else if (en && S.aa !== false && !over && !ed) s += altArrows(PVC[k], flip);
      if (!ed) s += shapesSvg(k, flip);
      if (en && S.arrow && e && e.best && !over && !RPA) {
        var f = e.best.from, t2 = e.best.to;
        var x1 = (flip ? 7 - f[1] : f[1]) + .5, y1 = (flip ? 7 - f[0] : f[0]) + .5, x2 = (flip ? 7 - t2[1] : t2[1]) + .5, y2 = (flip ? 7 - t2[0] : t2[0]) + .5;
        var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1; x2 -= dx / L * .3; y2 -= dy / L * .3;
        s += '<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><defs><marker id="bdAh" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#3fb950"/></marker></defs><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#3fb950" stroke-width=".15" stroke-linecap="round" opacity=".8" marker-end="url(#bdAh)"/></svg>';
      }
      s += '</div>';
      var info = '';
      if (ed) info = '✏️ Taxta muharriri';
      else {
        info = (h.t > 0 ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + ' · ';
        if (over) info = '🏁 O‘yin tugadi: ' + (h.t > 0 ? '⚫ Qora' : '⚪ Oq') + ' yutdi';
        else if (PL) info += PL.err ? 'Dvigatel javob bermadi <button data-a="retry" style="border:0;border-radius:10px;padding:6px 10px;background:#2e9d6b;color:#fff">Qayta</button>' : PL.th ? '⏳ Dragon o‘ylayapti...' : (h.t === PL.me ? 'Sizning yurishingiz' : '');
        else if (!S.engine) info += 'Dvigatel o‘chiq';
        else if (e && e.best) info += (e.bk ? '📖 Kitob: <b>' + sq(e.bk.from >> 3, e.bk.from & 7) + '-' + sq(e.bk.to >> 3, e.bk.to & 7) + '</b> · ' : '') + repTop(h) + '🐉 Dragon: <b>' + sq(e.best.from[0], e.best.from[1]) + ((e.best.cap !== undefined ? e.best.cap : (ms[0] && ms[0].caps.length)) ? ':' : '-') + sq(e.best.to[0], e.best.to[1]) + '</b>';
        else if (busyK[k]) info += '⏳ Dvigatel o‘ylayapti...';
        else if (FAIL[k]) info += 'Baho olinmadi <button data-a="eng" style="display:none"></button><button id="bdRt" style="border:0;border-radius:10px;padding:6px 10px;background:#2e9d6b;color:#fff">Qayta</button>';
      }
      s = s.replace('@@INFO@@', info);
      var nb = 'flex:1;border:0;border-radius:6px;padding:9px 0;background:rgba(255,255,255,.09);color:#e6e6e6;font-size:18px';
      s += '<div style="display:flex;gap:4px;margin:4px -8px 0"><button id="bd0" style="' + nb + '">⏮</button><button id="bd1" style="' + nb + '">‹</button><button id="bd2" style="' + nb + '">›</button><button id="bd3" style="' + nb + '">⏭</button></div>';
      var tg = '<span data-a="eng" style="display:inline-block;width:46px;height:26px;border-radius:13px;background:' + (S.engine ? (panel === 'engp' ? '#2c4a1c' : '#6aa22a') : '#555') + ';position:relative;vertical-align:middle"><span style="position:absolute;top:3px;' + (S.engine ? 'right:3px' : 'left:3px') + ';width:20px;height:20px;border-radius:50%;background:#fff"></span></span>';
      s += '<div style="display:flex;gap:4px;margin:6px -8px 0"><div data-a="engp" style="cursor:pointer;flex:1;background:' + (panel === 'engp' ? '#6aa22a' : '#2c4a1c') + ';border-radius:10px 10px 0 0;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">' + tg + '<span style="font-size:15px;opacity:.75">⚙️</span><b style="font-size:22px">' + (en ? evFmt(x) : '–') + '</b></div><div data-a="book" style="flex:1;background:' + (panel === 'book' ? '#6aa22a' : '#1d1f3a') + ';border-radius:10px 10px 0 0;padding:8px;font-size:20px;cursor:pointer;text-align:center">📖</div><div data-a="menu" style="flex:1;background:' + (panel && panel !== 'book' && panel !== 'engp' ? '#6aa22a' : '#1d1f3a') + ';border-radius:10px 10px 0 0;padding:8px;font-size:20px;cursor:pointer;text-align:center">☰</div></div>';
      if (panel) {
        s += '<div style="background:#2a3b22;border-radius:0 0 10px 10px;padding:10px;margin:0 -8px;text-align:left">';
        var mi = function (a, ic, tx) { return '<div data-a="' + a + '" style="display:flex;align-items:center;gap:10px;padding:10px 4px;cursor:pointer;font-size:15px"><span style="font-size:24px;width:32px;text-align:center">' + ic + '</span>' + tx + '</div>'; };
        if (panel === 'book') s += bookHtml();
        else if (panel === 'engp') s += engHtml(sm);
        else if (panel === 'menu') {
          s += '<div style="display:grid;grid-template-columns:1fr 1fr">' + mi('flip', '🔄', 'Taxtani aylantirish') + mi('edit', '✏️', 'Taxta muharriri') + mi('play', '🎯', 'Kompyuter bilan mashq qilish') + mi('cont', '♟', 'Shu pozitsiyadan davom etish') + mi('auto', '🤖', 'Kompyuter vs Kompyuter') + mi('learn', '📚', 'O‘rganish') + mi('set', '⚙️', 'Sozlamalar') + ((window.__isAdmin || (window.hzIsAdmin && window.hzIsAdmin())) ? mi('kk', '🦍', 'King Kong ustaxonasi') : '') + '</div>';
          s += '<div style="text-align:center;margin-top:6px"><button id="bdA" style="' + sm + ';background:#2e9d6b">📊 Hammasini baholash' + (prog ? ' ' + prog : '') + '</button><button id="bdN" style="' + sm + ';background:#8a2b3a">🗑 Yangi o‘yin</button></div>';
        } else if (panel === 'kk') {
          s += '<div style="font-size:15px;font-weight:700;margin-bottom:6px">🦍 King Kong ustaxonasi</div>';
          kkPeekLoad();
          s += '<div style="background:#3a2a10;border-radius:12px;padding:10px;margin-bottom:10px;font-size:14px;line-height:1.5">' + kkLine(KKP[kf(hist[cur])]) + (hist.length > 1 ? '<div style="font-size:12px;opacity:.7;margin-top:4px">Pastdagi ro‘yxatda 🦍 — King Kong o‘sha joyda boshqa yurish qilardi</div>' : '') + '</div>';
          var _gn = kkGameMoves().length;
          s += '<div style="background:#1d2a14;border-radius:12px;padding:10px;margin-bottom:10px"><div style="font-size:14px;margin-bottom:6px">Doskadagi partiya' + (cur < hist.length - 1 ? ' (tanlangan yurishgacha)' : '') + ' — qaysi tomon?</div><div>' +
            [['w', '⚪ Oq'], ['b', '⚫ Qora'], ['both', 'Ikkalasi']].map(function (x) { return '<button data-a="kks:' + x[0] + '" style="' + sm + ';background:' + (KK.sides === x[0] ? '#6aa22a' : '#262b66') + '">' + x[1] + '</button>'; }).join('') + '</div>';
          if (KK.pend) {
            s += '<div style="margin-top:8px;font-size:14px">⚠️ KestoG ' + KK.pend.bad.length + ' ta yurishni xato deb hisoblaydi:</div><div style="font-size:13px;margin:4px 0 6px;line-height:1.6">' +
              KK.pend.bad.map(function (b) { return b.no + '. <b>' + b.n + '</b> (' + evFmt(b.evMove) + ') → yaxshisi <b>' + b.best + '</b> (' + evFmt(b.evBest) + ')'; }).join('<br>') + '</div>' +
              '<button data-a="kkgood" style="' + sm + ';background:#2e9d6b">⏭ Xatolarsiz o‘rgatish</button><button data-a="kkall" style="' + sm + ';background:#b45309">Hammasini</button><button data-a="kkno" style="' + sm + ';background:#5a2a35">Bekor</button>';
          } else s += '<button data-a="kkgame" style="' + sm + ';background:#b45309;margin-top:6px"' + (KK.busy || !_gn ? ' disabled' : '') + '>🦍 Partiyani o‘rgatish (' + _gn + ' yurish)</button>';
          s += '</div><div style="font-size:13px;opacity:.75;margin-bottom:4px">Yoki faqat oxirgi yurish:</div>';
          if (cur >= 1 && hist[cur].m) s += '<div style="font-size:14px;margin-bottom:8px">Oxirgi yurish: <b>' + note(hist[cur].m) + '</b> (' + (hist[cur - 1].t > 0 ? '⚪ oq' : '⚫ qora') + ')<br><span style="opacity:.7;font-size:12px">King Kong shu pozitsiyaga tushsa, aynan shu yurishni qiladi (nazariya bazasidan oldin).</span></div><button data-a="kkteach" style="' + sm + ';background:#b45309">🦍 Shu yurishni o‘rgatish</button>';
          else s += '<div style="font-size:14px;opacity:.8;margin-bottom:8px">Doskada kerakli yurishni qiling — keyin shu yerda uni King Kongga o‘rgatasiz.</div>';
          s += '<div style="margin-top:6px"><button data-a="kkpdn" style="' + sm + '">📋 Partiyani kiritish</button><button data-a="kklist" style="' + sm + '">📚 O‘rgatilganlar</button><button data-a="kkdeep" style="' + sm + ';background:#5a2a35">🧹 Saboqlarni tozalash</button><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
          if (KK.msg) s += '<div style="margin-top:8px;font-size:14px">' + KK.msg + '</div>';
        } else if (panel === 'auto') {
          s += '<div style="font-size:15px;font-weight:700;margin-bottom:4px">🤖 Kompyuter vs Kompyuter</div><div style="font-size:12px;opacity:.75;margin-bottom:8px">Dvigatel o‘zi bilan o‘ynaydi. Har yurish baholanadi — xatolar pastdagi ro‘yxatda ?!, ?, ?? bilan ajraladi.</div>' +
            '<div style="font-size:13px;margin-bottom:4px">Har yurishga vaqt (soniya):</div><div>' + [0.5, 1, 3].map(function (v) { return '<button data-a="au:' + v + '" style="' + sm + ';background:' + (AU.t === v ? '#6aa22a' : '#262b66') + '">' + v + (v > 1 && !window.__prem && !window.__isAdmin ? ' 👑' : '') + '</button>'; }).join('') + '</div><div style="margin-top:8px">';
          if (AU.run) s += '<button data-a="auoff" style="' + sm + ';background:#8a2b3a">⏸ To‘xtatish</button>';
          else s += '<button data-a="auon" style="' + sm + ';background:#2e9d6b">▶ Shu pozitsiyadan</button><button data-a="aunew" style="' + sm + ';background:#b45309">♻️ Boshidan</button>';
          s += '<button data-a="menu" style="' + sm + '">Orqaga</button></div>';
          if (AU.run) s += '<div style="margin-top:8px;font-size:14px">' + (AU.th ? '⏳ ' : '▶ ') + Math.ceil(cur / 2) + '-yurish o‘ynalmoqda…</div>';
          else if (AU.msg) s += '<div style="margin-top:8px;font-size:14px">' + AU.msg + '</div>';
          if (!AU.run && cur > 1 && window.__isAdmin) s += '<div style="margin-top:6px"><button data-a="kk" style="' + sm + ';background:#5a3a10">🦍 King Kongga o‘rgatish</button></div>';
        } else if (panel === 'kkpdn') {
          s += '<div style="font-size:15px;font-weight:700;margin-bottom:6px">📋 Partiyani kiritish</div><div style="font-size:12px;opacity:.75;margin-bottom:6px">Masalan: 1. c3-d4 f6-g5 2. b2-c3 g7-f6 3. ... (urish: c3:e5)</div>' +
            '<textarea id="kkPdn" style="width:100%;box-sizing:border-box;height:90px;border-radius:10px;border:1px solid #3a4a2a;background:#1d2a14;color:#fff;padding:8px;font:13px monospace">' + String(KK.text || '').replace(/</g, '&lt;') + '</textarea>' +
            '<div style="margin:6px 0;font-size:13px">Qaysi tomon yurishlarini o‘rgatamiz?</div><div>' + [['w', '⚪ Oq'], ['b', '⚫ Qora'], ['both', 'Ikkalasi']].map(function (x) { return '<button data-a="kks:' + x[0] + '" style="' + sm + ';background:' + (KK.sides === x[0] ? '#6aa22a' : '#262b66') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
            '<div style="margin-top:6px"><button data-a="kkload" style="' + sm + ';background:#2e7d5b">♟ Doskaga qo‘yish</button><button data-a="kkpdngo" style="' + sm + ';background:#b45309">🦍 O‘rgatish</button><button data-a="kk" style="' + sm + '">Orqaga</button></div>' + (KK.msg ? '<div style="margin-top:8px;font-size:14px">' + KK.msg + '</div>' : '');
        } else if (panel === 'edit') {
          s += '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:8px">';
          [[1, 1], [3, 3], [2, 2], [4, 4], [0, 0]].forEach(function (t) {
            s += '<div data-a="tool:' + t[0] + '" style="padding:6px;border-radius:10px;background:' + (E.tool === t[0] ? '#6aa22a' : '#1d1f3a') + ';width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">' + (t[0] ? pcH(t[1], '30px') : '<span style="font-size:22px">🧽</span>') + '</div>';
          });
          s += '</div><div style="text-align:center"><button data-a="side" style="' + sm + '">Yuradi: ' + (E.t > 0 ? '⚪ Oq' : '⚫ Qora') + '</button><button data-a="clr" style="' + sm + '">Tozalash</button><button data-a="init" style="' + sm + '">Boshlang‘ich</button></div>';
          if (E.msg) s += '<div style="color:#ff8a8a;text-align:center;margin:6px">' + E.msg + '</div>';
          s += '<div style="text-align:center;margin-top:6px"><button data-a="ok" style="' + sm + ';background:#2e9d6b">✔ Tayyor</button><button data-a="cancel" style="' + sm + ';background:#8a2b3a">✖ Bekor</button></div>';
        } else if (panel === 'play') {
          s += '<div style="text-align:center"><div style="margin-bottom:8px">Shu pozitsiyadan Dragon’ga qarshi o‘ynang. Siz kim bilan?</div><button data-a="me:1" style="' + sm + '">⚪ Oq bilan</button><button data-a="me:-1" style="' + sm + '">⚫ Qora bilan</button><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
        } else if (panel === 'learn') {
          s += '<div style="font-size:14px;line-height:1.6"><b>Rus shashkasi qoidalari</b><br>• Taxta 8×8, donalar faqat to‘q kataklarda.<br>• Oddiy dona oldinga diagonal yuradi.<br>• Urish <b>majburiy</b>, ham oldinga, ham orqaga. Ko‘p urish imkoni bo‘lsa, zanjirni oxirigacha urish kerak.<br>• Dona oxirgi qatorga yetsa <b>damka</b> bo‘ladi.<br>• Damka diagonal bo‘ylab istalgan masofaga yuradi va uradi.<br>• Urish paytida damka bo‘lgan dona o‘sha yurishda damka kabi davom etadi.<br>• Dona qolmasa yoki yura olmasa, o‘yinchi yutqazadi.<br><b>Baho:</b> +1.0 ≈ oq tomonda bitta dona ustunlik. <b>?!</b> noaniq, <b>?</b> xato, <b>??</b> qo‘pol xato.</div><div style="text-align:center;margin-top:8px"><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
        } else if (panel === 'set') {
          s += '<div style="margin-bottom:6px">Dvigatel vaqti (soniya):</div><div>';
          [0.2, 0.3, 0.5, 1, 2].forEach(function (v) { s += '<button data-a="st:' + v + '" style="' + sm + ';background:' + (S.t === v ? '#6aa22a' : '#262b66') + '">' + v + '</button>'; });
          [5, 10].forEach(function (v) { s += '<button data-a="st:' + v + '" style="' + sm + ';background:' + (S.t === v ? '#6aa22a' : window.__prem ? '#5a4a00' : '#262b66') + ';opacity:' + (window.__prem ? 1 : 0.55) + '">👑 ' + v + '</button>'; });
          if (!window.__prem) s += '<div style="font-size:12px;color:#ffd54a;margin-top:4px">👑 5 va 10 soniya — faqat Premium uchun</div>';
          s += '</div><div style="margin-top:6px"><button data-a="tog:arrow" style="' + sm + ';background:' + (S.arrow ? '#6aa22a' : '#262b66') + '">Strelka: ' + (S.arrow ? 'yoniq' : 'o‘chiq') + '</button></div>';
          s += '<div style="font-size:12px;opacity:.7;margin-top:4px">Vaqt oshsa, baho aniqroq, lekin sekinroq.</div><div style="text-align:center;margin-top:8px"><button data-a="menu" style="' + sm + '">Orqaga</button></div>';
        }
        s += '</div>';
      }
      if (en && e && e.best && !over) s += '<div style="margin:0 -8px">' + pvHtml(h) + '</div>';
      if (!ed && !PL) s += fpHtml();
      if (AU.run && panel !== 'auto') s += '<div style="margin-top:8px">🤖 ' + Math.ceil(cur / 2) + '-yurish… <button data-a="auoff" style="' + sm + ';background:#8a2b3a">⏸ To‘xtatish</button></div>';
      if (PL) s += '<div style="margin-top:8px"><button data-a="stop" style="' + sm + ';background:#8a2b3a">⏹ Mashqni to‘xtatish</button></div>';
      if (!ed) s += anaHtml();
      s += '<div style="margin-top:12px;text-align:left;font-size:15px;line-height:2.2">';
      for (var i = 0; i < hist.length - 1; i++) {
        if (i % 2 === 0) s += '<span style="opacity:.6;margin-left:6px">' + (i / 2 + 1) + '.</span> ';
        var mk = (S.engine && !PL) ? mark(i) : '', bad = mk === '??' ? '#ff6b6b' : mk ? '#ffb347' : '#fff';
        var kd = (panel === 'kk' || panel === 'kkpdn') ? kkDiff(i) : '';
        s += '<span data-g="' + (i + 1) + '" style="display:inline-block;padding:2px 8px;margin:2px;border-radius:8px;background:' + (cur === i + 1 ? '#6b5cf0' : '#262b66') + ';color:' + bad + '">' + hist[i + 1].n + mk + ((S.engine && !PL) ? ' <small style="opacity:.7;color:#fff">' + evFmt(evOf(i + 1)) + '</small>' : '') + (kd ? ' <small style="color:#ffb347">🦍' + kd + '</small>' : '') + '</span>';
      }
      s += '</div>';
      ov.innerHTML = s;
      function on(id, f) { var el = ov.querySelector(id); if (el) el.onclick = f; }
      on('#bdX', function () { ov.remove(); if (g && g.onClose) try { g.onClose(); } catch (e) {} });
      on('#bd0', function () { go(0); }); on('#bd1', function () { go(cur - 1); });
      on('#bd2', function () { go(cur + 1); }); on('#bd3', function () { go(hist.length - 1); });
      on('#bdA', runAll); on('#bdFull', fullAna);
      on('#bdN', function () { newPos(start(), 1); });
      on('#bdRt', function () { delete FAIL[kf(hist[cur])]; analyzeCur(); draw(); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-a]'), function (el) { el.onclick = function (ev) { if (ev) ev.stopPropagation(); act(el.getAttribute('data-a')); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-rg]'), function (el) { el.oninput = function () { var o = el.nextElementSibling; if (o) o.textContent = rgTxt(el.getAttribute('data-rg'), +el.value); }; el.onchange = function () { rgSet(el.getAttribute('data-rg'), +el.value); }; });
      on('#fpCopyF', function () { cpTxt(fenOf(hist[cur]), '#fpCopyF'); }); on('#fpCopyP', function () { cpTxt(pdnOf(), '#fpCopyP'); });
      on('#fpLoad', function () { var ta = document.getElementById('fpIn'); fpLoad(ta ? ta.value : ''); });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-r]'), function (el) { el.onclick = function () { if (DR.on && panel !== 'edit') drClick(+el.getAttribute('data-r'), +el.getAttribute('data-c')); else click(+el.getAttribute('data-r'), +el.getAttribute('data-c')); }; });
      Array.prototype.forEach.call(ov.querySelectorAll('[data-g]'), function (el) { el.onclick = function () { go(+el.getAttribute('data-g')); }; });
      ov.scrollTop = st;
    }
    draw(); analyzeCur();
    // 👹 Monster tahlilidan: shu pozitsiyadan kompyuterga qarshi darhol o'ynash
    if (g && (g.practiceMe === 1 || g.practiceMe === -1)) { if (g.practiceT) S.t = g.practiceT; act('me:' + g.practiceMe); }
  };
})();
