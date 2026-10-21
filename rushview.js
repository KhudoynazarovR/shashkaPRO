/* Puzzle Rush ekrani: boshlash -> 3 daqiqa masalalar -> natija. Javoblarni server tekshiradi (pzrush.js). */
;(function () {
  if (window.spRush && window.spPzRules) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  // ---- qoidalar (faqat tanlashni ko'rsatish uchun; to'g'ri/xatoni server aytadi)
  function ins(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function sideOf(p) { return p === 1 || p === 3 ? 'w' : (p === 2 || p === 4 ? 'b' : null); }
  function copy(b) { var n = b.map(function (x) { return x.slice(); }); n.dead = (b.dead || []).slice(); return n; }
  function caps(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p), dead = b.dead || [];
    function isD(a, e) { for (var i = 0; i < dead.length; i++) if (dead[i][0] === a && dead[i][1] === e) return true; return false; }
    DIRS.forEach(function (d) {
      if (p < 3) {
        var mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
        if (ins(lr, lc) && b[mr][mc] && sideOf(b[mr][mc]) !== me && !isD(mr, mc) && !b[lr][lc]) out.push({ f: [r, c], t: [lr, lc], x: [mr, mc] });
      } else {
        var nr = r + d[0], nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { nr += d[0]; nc += d[1]; }
        if (ins(nr, nc) && sideOf(b[nr][nc]) !== me && !isD(nr, nc)) {
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
      if (p > 2) { var nr = r + d[0], nc = c + d[1]; while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc] }); nr += d[0]; nc += d[1]; } }
      else if (d[0] === (me === 'w' ? -1 : 1)) { var tr = r + d[0], tc = c + d[1]; if (ins(tr, tc) && !b[tr][tc]) out.push({ f: [r, c], t: [tr, tc] }); }
    });
    return out;
  }
  function legal(b, side, forced) {
    var cs = [], ss = [];
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      if (sideOf(b[r][c]) !== side) continue;
      if (forced && (forced[0] !== r || forced[1] !== c)) continue;
      cs = cs.concat(caps(b, r, c));
      if (!forced) ss = ss.concat(simple(b, r, c));
    }
    return cs.length ? cs : ss;
  }
  function adv(g, s) {
    var n = copy(g.b), p = n[s.f[0]][s.f[1]], dead = (g.b.dead || []).slice();
    n[s.f[0]][s.f[1]] = 0;
    if (p === 1 && s.t[0] === 0) p = 3;
    if (p === 2 && s.t[0] === 7) p = 4;
    n[s.t[0]][s.t[1]] = p;
    if (s.x) dead.push([s.x[0], s.x[1]]);
    n.dead = dead;
    var more = !!s.x && caps(n, s.t[0], s.t[1]).length > 0;
    if (!more) { dead.forEach(function (x) { n[x[0]][x[1]] = 0; }); n.dead = []; }
    return { b: n, side: more ? g.side : (g.side === 'w' ? 'b' : 'w'), forced: more ? [s.t[0], s.t[1]] : null };
  }
  function findStep(lg, w) { for (var i = 0; i < lg.length; i++) { var s = lg[i]; if (s.f[0] === w[0] && s.f[1] === w[1] && s.t[0] === w[2] && s.t[1] === w[3]) return s; } return null; }

  window.spPzRules = { legal: legal, adv: adv, findStep: findStep, copy: copy };
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(ms) { var x = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(x / 60) + ':' + (x % 60 < 10 ? '0' : '') + (x % 60); }
  function haptic(k) { try { if (k === 'ok') tg.HapticFeedback.notificationOccurred('success'); else if (k === 'bad') tg.HapticFeedback.notificationOccurred('error'); else tg.HapticFeedback.impactOccurred('light'); } catch (e) {} }

  var CSS =
    '#spRush{position:fixed;inset:0;z-index:2147482600;overflow-y:auto;color:#fff;font-family:Roboto,system-ui,sans-serif;background:radial-gradient(circle at 50% 0,#8a1d14 0,#3d0a08 45%,#1a0504 100%);padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 20px);box-sizing:border-box;-webkit-tap-highlight-color:transparent}' +
    '#spRush button{font-family:inherit;cursor:pointer}' +
    '.rsTop{display:flex;align-items:center;gap:8px;margin-bottom:12px}' +
    '.rsX{width:44px;height:44px;border:0;border-radius:12px;background:rgba(0,0,0,.35);color:#fff;font-size:20px;flex:none}' +
    '.rsT{flex:1;font-size:22px;font-weight:900;letter-spacing:.3px}' +
    '.rsHud{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}' +
    '.rsBox{background:rgba(0,0,0,.35);border-radius:14px;padding:8px 6px;text-align:center}' +
    '.rsBox small{display:block;font-size:12px;font-weight:700;color:#ffc9b8;letter-spacing:.4px}' +
    '.rsBox b{display:block;font-size:28px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.15}' +
    '.rsBox.low b{color:#ffcf3f}.rsBox.crit b{color:#ff6b6b}' +
    '.rsHearts{font-size:22px!important;letter-spacing:2px;padding-top:4px}' +
    '.rsSide{text-align:center;font-size:16px;font-weight:700;margin:4px 0 8px;color:#ffe2d6}' +
    '#rsB{width:min(94vw,460px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #5a3415;border-radius:8px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:box-shadow .2s}' +
    '#rsB.ok{box-shadow:0 0 0 4px #55e07a,0 10px 30px rgba(0,0,0,.5)}#rsB.bad{box-shadow:0 0 0 4px #ff4d4d,0 10px 30px rgba(0,0,0,.5);animation:rsShake .35s}' +
    '@keyframes rsShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '#rsB{touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
    '#rsB>div{position:relative;display:flex;align-items:center;justify-content:center}' +
    '#rsB .l{background:#f0d9b5}#rsB .d{background:#b58863}#rsB .d.sel{box-shadow:inset 0 0 0 4px #f5d92b}#rsB .d.lm{background:#c9a23f}' +
    '#rsB .dot{position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(40,200,120,.85)}' +
    '#rsB .pc{width:82%;height:82%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f5b72b;box-shadow:0 2px 3px rgba(0,0,0,.45)}' +
    '#rsB .pw{background:radial-gradient(circle at 35% 28%,#fff,#c9c9c9);border:2px solid #9a9a9a}#rsB .pb{background:radial-gradient(circle at 35% 28%,#666,#111);border:2px solid #000}' +
    '.rsMsg{min-height:30px;text-align:center;font-size:18px;font-weight:800;margin:10px 0 6px}' +
    '.rsSkip{display:block;margin:6px auto 0;border:0;border-radius:12px;padding:10px 18px;background:rgba(0,0,0,.35);color:#ffd9cc;font-size:15px;font-weight:700}' +
    '.rsCard{background:rgba(0,0,0,.32);border-radius:18px;padding:16px;margin-bottom:12px}' +
    '.rsCard h3{margin:0 0 8px;font-size:18px}' +
    '.rsCard li{margin:6px 0;font-size:16px;line-height:1.35}' +
    '.rsGo{display:block;width:100%;height:58px;border:0;border-radius:18px;background:linear-gradient(180deg,#ffcf3f,#f39a12);color:#3a1600;font-size:22px;font-weight:900;box-shadow:0 5px 0 #a35a00;margin:6px 0 14px}' +
    '.rsGo:active{transform:translateY(3px);box-shadow:0 2px 0 #a35a00}' +
    '.rsTabs{display:flex;gap:6px;margin-bottom:8px}.rsTabs button{flex:1;height:38px;border:0;border-radius:10px;background:rgba(0,0,0,.3);color:#ffd9cc;font-weight:800}.rsTabs button.on{background:#ffcf3f;color:#3a1600}' +
    '.rsRow{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:16px}.rsRow b{margin-left:auto;font-size:18px}.rsRow i{font-style:normal;width:26px;text-align:center;color:#ffc9b8}' +
    '.rsRes{text-align:center;padding:10px 0 4px}.rsRes .big{font-size:84px;font-weight:900;line-height:1}.rsRes .sub{font-size:18px;color:#ffd9cc;margin-top:6px}' +
    '.rsGain{display:inline-block;margin-top:12px;background:#ffcf3f;color:#3a1600;font-weight:900;font-size:20px;border-radius:999px;padding:6px 16px}' +
    '.rsRec{margin-top:10px;font-size:18px;font-weight:900;color:#ffcf3f}';

  var ov = null, opts = {}, T = null, st = null, timer = null, topTab = 'day';
  function css() { if (!document.getElementById('rsCss')) { var s = document.createElement('style'); s.id = 'rsCss'; s.textContent = CSS; document.head.appendChild(s); } }
  function close() { stopTimer(); if (st && st.sid && !st.over) api('/api/rush/end', { sid: st.sid }).then(function (r) { if (r && r.gain && opts.onCoins) opts.onCoins(r.gain); }).catch(function () {}); st = null; if (ov) ov.remove(); ov = null; }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }

  // ---------- boshlash ekrani
  function home() {
    stopTimer(); st = null;
    ov.innerHTML = '<div class="rsTop"><button class="rsX" id="rsX" aria-label="Orqaga">‹</button><div class="rsT">⚡ Puzzle Rush</div></div><div class="rsCard">Yuklanmoqda…</div>';
    ov.querySelector('#rsX').onclick = close;
    api('/api/rush/top').then(function (d) { T = d || {}; drawHome(); }).catch(function () { T = {}; drawHome(); });
  }
  function drawHome() {
    var d = T || {}, rows = (topTab === 'day' ? d.day : d.all) || [], me = String((tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) || '');
    var h = '<div class="rsTop"><button class="rsX" id="rsX" aria-label="Orqaga">‹</button><div class="rsT">⚡ Puzzle Rush</div></div>';
    h += '<div class="rsCard"><h3>Qoidalar</h3><ul style="margin:0;padding-left:20px">' +
      '<li>⏱ <b>' + Math.round((d.dur || 180) / 60) + ' daqiqa</b> ichida iloji boricha ko‘p masala yeching</li>' +
      '<li>✅ Har bir yechilgan masala — <b>+1 ochko</b></li>' +
      '<li>❌ Xato yurish — masala o‘tib ketadi. <b>' + (d.maxErr || 3) + ' ta xato</b> — o‘yin tugaydi</li>' +
      '<li>📈 Masalalar osondan qiyinga qarab boradi</li>' +
      '<li>🪙 Har ochko = 1 tanga (bir urinishda ' + (d.cap || 15) + ' tagacha), kuniga 3 urinish</li></ul></div>';
    h += '<div class="rsHud"><div class="rsBox"><small>REKORD</small><b>' + (d.best || 0) + '</b></div><div class="rsBox"><small>TANGALI URINISH</small><b>' + (d.runsLeft == null ? 3 : d.runsLeft) + '</b></div><div class="rsBox"><small>VAQT</small><b>' + fmt((d.dur || 180) * 1000) + '</b></div></div>';
    h += '<button class="rsGo" id="rsGo">▶ Boshlash</button>';
    h += '<div class="rsCard"><div class="rsTabs"><button data-tt="day" class="' + (topTab === 'day' ? 'on' : '') + '">Bugun</button><button data-tt="all" class="' + (topTab === 'all' ? 'on' : '') + '">Barcha vaqt</button></div>';
    if (!rows.length) h += '<div style="opacity:.8;padding:8px 2px">Hali natija yo‘q — birinchi bo‘ling!</div>';
    rows.slice(0, 10).forEach(function (r, i) { h += '<div class="rsRow" style="' + (String(r.uid) === me ? 'color:#ffcf3f' : '') + '"><i>' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</i><span>' + esc(r.name) + '</span><b>' + r.n + '</b></div>'; });
    h += '</div>';
    ov.innerHTML = h;
    ov.querySelector('#rsX').onclick = close;
    ov.querySelector('#rsGo').onclick = start;
    Array.prototype.forEach.call(ov.querySelectorAll('[data-tt]'), function (b) { b.onclick = function () { topTab = b.getAttribute('data-tt'); drawHome(); }; });
  }

  // ---------- o'yin
  function start() {
    ov.querySelector('#rsGo').disabled = true;
    api('/api/rush/start', {}).then(function (d) {
      if (!d || d.error || !d.pz) { alert((d && d.error) || 'Xatolik'); home(); return; }
      st = { sid: d.sid, end: Date.now() + d.left, score: 0, errors: 0, maxErr: d.maxErr || 3, busy: false, sel: null, msg: '', flash: '', lm: null };
      setPz(d.pz);
      draw();
      stopTimer(); timer = setInterval(tick, 250);
    }).catch(function () { alert('Server bilan aloqa yo‘q'); home(); });
  }
  function setPz(p) { st.pz = p; st.g = { b: copy(p.board), side: p.side, forced: null }; st.sel = null; st.lm = null; }
  function autoSel() { if (st && st.g && st.pz && st.g.forced && st.g.side === st.pz.side) st.sel = [st.g.forced[0], st.g.forced[1]]; }
  function tick() {
    if (!st || st.over) return;
    var left = st.end - Date.now(), e = ov && ov.querySelector('#rsTime');
    if (e) { e.textContent = fmt(left); var bx = e.parentNode; bx.classList.toggle('low', left <= 30000 && left > 10000); bx.classList.toggle('crit', left <= 10000); }
    if (left <= 0 && !st.busy) { st.busy = true; api('/api/rush/end', { sid: st.sid }).then(result).catch(function () { result({ over: true, score: st.score, errors: st.errors, gain: 0 }); }); }
  }
  function hearts() { var h = ''; for (var i = 0; i < st.maxErr; i++) h += i < st.maxErr - st.errors ? '❤️' : '🖤'; return h; }
  function draw() {
    var p = st.pz, g = st.g, lg = st.sel ? legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === st.sel[0] && s.f[1] === st.sel[1]; }) : [];
    var h = '<div class="rsTop"><button class="rsX" id="rsX" aria-label="Chiqish">✕</button><div class="rsT">⚡ Puzzle Rush</div></div>';
    h += '<div class="rsHud"><div class="rsBox"><small>VAQT</small><b id="rsTime">' + fmt(st.end - Date.now()) + '</b></div><div class="rsBox"><small>OCHKO</small><b>' + st.score + '</b></div><div class="rsBox"><small>XATOLAR</small><b class="rsHearts">' + hearts() + '</b></div></div>';
    h += '<div class="rsSide">' + (p.side === 'w' ? '⚪ Oqlar yuradi' : '⚫ Qoralar yuradi') + ' · ' + ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'][p.level || 1] + '</div>';
    h += '<div id="rsB" class="' + (st.flash || '') + '">';
    // masalada qora yursa, doskani aylantiramiz
    var flip = p.side === 'b';
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var r = flip ? 7 - i : i, c = flip ? 7 - j : j, dk = (r + c) % 2 === 1, pc = g.b[r][c];
      var cls = dk ? 'd' : 'l';
      if (st.sel && st.sel[0] === r && st.sel[1] === c) cls += ' sel';
      if (st.lm && ((st.lm[0] === r && st.lm[1] === c) || (st.lm[2] === r && st.lm[3] === c))) cls += ' lm';
      var dot = lg.some(function (s) { return s.t[0] === r && s.t[1] === c; }) ? '<i class="dot"></i>' : '';
      h += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + dot + (pc ? '<div class="pc ' + (pc === 1 || pc === 3 ? 'pw' : 'pb') + '">' + (pc > 2 ? '♛' : '') + '</div>' : '') + '</div>';
    }
    h += '</div><div class="rsMsg">' + st.msg + '</div><button class="rsSkip" id="rsSkip">⏭ O‘tkazib yuborish (−1 ❤️)</button>';
    ov.innerHTML = h;
    ov.querySelector('#rsX').onclick = function () { if (confirm('Rush tugatilsinmi?')) { st.busy = true; api('/api/rush/end', { sid: st.sid }).then(result).catch(close); } };
    ov.querySelector('#rsSkip').onclick = function () { if (st.busy) return; st.busy = true; api('/api/rush/skip', { sid: st.sid }).then(onWrong).catch(function () { st.busy = false; }); };
    var bd = ov.querySelector('#rsB');
    bd.addEventListener('pointerdown', function (ev) { var x = ev.target.closest('[data-r]'); if (!x) return; ev.preventDefault(); tap(Number(x.getAttribute('data-r')), Number(x.getAttribute('data-c'))); });
  }
  function tap(r, c) {
    if (!st || st.busy || st.over || st.g.side !== st.pz.side) return;
    var g = st.g, lg = legal(g.b, g.side, g.forced);
    if (st.sel) {
      var s = findStep(lg, [st.sel[0], st.sel[1], r, c]);
      if (s) return send(s);
    }
    if (lg.some(function (s2) { return s2.f[0] === r && s2.f[1] === c; })) { st.sel = [r, c]; haptic(); draw(); return; }
    // tanlamasdan bosilgan katakka faqat bitta yurish bo'lsa — darhol yuramiz
    var to = lg.filter(function (s3) { return s3.t[0] === r && s3.t[1] === c; });
    if (to.length === 1) return send(to[0]);
    if (st.sel) { st.sel = null; draw(); }
  }
  function send(s) {
    st.busy = true;
    var w = [s.f[0], s.f[1], s.t[0], s.t[1]];
    // darhol ko'rsatamiz, server javobini kutamiz
    var before = st.g; st.g = adv(st.g, s); st.sel = null; st.lm = w; autoSel(); draw();
    api('/api/rush/move', { sid: st.sid, step: w }).then(function (d) {
      if (!d) { st.busy = false; return; }
      if (d.bad) { st.g = before; st.lm = null; st.busy = false; draw(); return; }
      if (d.wrong) { st.g = before; return onWrong(d); }
      if (d.over && !d.ok) return result(d);
      var opp = d.opp || [], k = 0;
      st.score = d.score != null ? d.score : st.score;
      function playOpp() {
        if (k < opp.length) {
          var x = opp[k++], os = findStep(legal(st.g.b, st.g.side, st.g.forced), x);
          if (os) { st.g = adv(st.g, os); st.lm = x; draw(); }
          return setTimeout(playOpp, 170);
        }
        if (d.solved) {
          haptic('ok'); st.flash = 'ok'; st.msg = '✅ +1'; draw();
          setTimeout(function () {
            st.flash = ''; st.msg = '';
            if (d.over) return result(d);
            setPz(d.pz); st.busy = false; draw();
          }, 160);
        } else { st.busy = false; autoSel(); draw(); }
      }
      if (opp.length) setTimeout(playOpp, 120); else playOpp();
    }).catch(function () { st.g = before; st.busy = false; st.msg = '⚠️ Aloqa uzildi'; draw(); });
  }
  function onWrong(d) {
    haptic('bad');
    st.errors = d.errors != null ? d.errors : st.errors + 1;
    // to'g'ri yo'lni qisqa ko'rsatamiz
    var sol = d.sol || [], k = 0;
    st.flash = 'bad'; st.msg = '❌ Xato! To‘g‘ri yo‘l:'; draw();
    function step() {
      if (k < sol.length && k < 6) {
        var x = sol[k++], s = findStep(legal(st.g.b, st.g.side, st.g.forced), x);
        if (s) { st.g = adv(st.g, s); st.lm = x; st.flash = ''; draw(); }
        return setTimeout(step, 260);
      }
      setTimeout(function () {
        st.flash = ''; st.msg = '';
        if (d.over) return result(d);
        setPz(d.pz); st.busy = false; draw();
      }, 250);
    }
    setTimeout(step, 250);
  }

  // ---------- natija
  function result(d) {
    stopTimer();
    if (!st) return;
    st.over = true;
    if (d && d.gain && opts.onCoins) opts.onCoins(d.gain);
    var why = { time: '⏰ Vaqt tugadi', errors: '💔 3 ta xato', quit: '🏳️ To‘xtatildi', empty: '🏁 Masalalar tugadi' }[d.why] || '🏁 Tugadi';
    var h = '<div class="rsTop"><button class="rsX" id="rsX" aria-label="Orqaga">‹</button><div class="rsT">⚡ Puzzle Rush</div></div>';
    h += '<div class="rsCard rsRes"><div class="sub">' + why + '</div><div class="big">' + (d.score || 0) + '</div><div class="sub">ta masala yechildi</div>' +
      (d.record ? '<div class="rsRec">🏆 Yangi rekord!</div>' : '<div class="sub" style="font-size:15px">Rekordingiz: ' + (d.best || 0) + '</div>') +
      (d.gain ? '<div class="rsGain">+' + d.gain + ' 🪙</div>' : (d.runsLeft === 0 ? '<div class="sub" style="font-size:14px;margin-top:10px">Bugungi tangali urinishlar tugadi — rekord uchun o‘ynashingiz mumkin</div>' : '')) + '</div>';
    if ((d.score || 0) > 0 && window.spShareCard) h += '<button class="rsSkip" id="rsShr" style="width:100%;margin-bottom:8px">📸 Natijani ulashish</button>';
    h += '<button class="rsGo" id="rsGo">🔄 Yana o‘ynash</button><button class="rsSkip" id="rsHome" style="width:100%">🏆 Reyting</button>';
    ov.innerHTML = h;
    st = null;
    ov.querySelector('#rsX').onclick = close;
    ov.querySelector('#rsGo').onclick = start;
    ov.querySelector('#rsHome').onclick = home;
    var _sh = ov.querySelector('#rsShr'); if (_sh) _sh.onclick = function () { window.spShareCard({ theme: 'rush', title: '⚡ PUZZLE RUSH', big: String(d.score || 0), unit: 'ta masala 3 daqiqada', badge: d.record ? '🏆 Yangi rekord!' : '', sub: 'Rekordim: ' + (d.best || d.score || 0), cap: '⚡ Puzzle Rush: 3 daqiqada ' + (d.score || 0) + ' ta masala yechdim! Sen-chi?' }); };
  }

  window.spRush = function (o) {
    opts = o || {}; css();
    if (ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'spRush'; document.body.appendChild(ov);
    home();
  };
})();
