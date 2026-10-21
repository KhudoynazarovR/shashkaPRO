/* DAILYQ — kunlik vazifalar + 🔥 kirish seriyasi.
   Kuniga birinchi kirishda oyna o'zi ochiladi; bosh sahifada ixcham karta qoladi. */
;(function () {
  if (window.__dq) return; window.__dq = 1;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  if (!initData) return;
  var S = null, open = false, autoDone = false, busy = false;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function api(p, body) { return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); }); }
  function hms(ms) { ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function coin(n) { try { if (window.__coinFx) window.__coinFx(n); } catch (e) {} }
  function haptic() { try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {} }

  var st = document.createElement('style'); st.id = 'dqCss';
  st.textContent =
    '#dqOv{position:fixed;inset:0;z-index:2147483000;background:rgba(5,4,20,.78);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,Roboto,sans-serif;animation:dqF .2s}' +
    '@keyframes dqF{from{opacity:0}to{opacity:1}}@keyframes dqU{from{transform:translateY(40px)}to{transform:none}}' +
    '#dqOv .bx{width:100%;max-width:480px;max-height:92vh;overflow:auto;background:#1a1650;color:#fff;border-radius:24px 24px 0 0;padding:16px 14px calc(18px + env(safe-area-inset-bottom,0px));box-sizing:border-box;animation:dqU .25s}' +
    '#dqOv .hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}#dqOv .hd b{flex:1;font-size:21px}#dqOv .hd small{display:block;font-size:13px;color:#bab7e8;font-weight:600}' +
    '#dqOv .x{border:0;background:#352d86;color:#fff;border-radius:12px;width:40px;height:40px;font-size:18px;flex:none}' +
    '#dqOv .sec{background:#2a2470;border-radius:18px;padding:12px;margin-bottom:10px;box-shadow:0 3px 0 #0e0b30}' +
    '#dqOv .sh{display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:17px;margin-bottom:10px}#dqOv .sh span{font-size:13px;color:#ffcf3f}' +
    '#dqOv .days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}' +
    '#dqOv .dy{background:#141040;border-radius:12px;padding:6px 0 5px;text-align:center;font-size:11px;color:#bab7e8;border:2px solid transparent}' +
    '#dqOv .dy i{display:block;font-style:normal;font-size:20px;line-height:1.3}#dqOv .dy b{display:block;font-size:13px;color:#fff}' +
    '#dqOv .dy.ok{background:#3b2a05;color:#ffcf3f}#dqOv .dy.ok b{color:#ffcf3f}' +
    '#dqOv .dy.now{border-color:#ffcf3f;background:#4a3a0a;animation:dqP 1.2s infinite}@keyframes dqP{50%{box-shadow:0 0 14px rgba(255,207,63,.6)}}' +
    '#dqOv .dy.big{background:linear-gradient(180deg,#5b2bb5,#2a2470)}' +
    '#dqOv .go{display:block;width:100%;border:0;border-radius:14px;padding:13px;margin-top:10px;font:900 17px system-ui,Roboto,sans-serif;color:#2a1600;background:linear-gradient(90deg,#ffcf3f,#ff9f1a);box-shadow:0 3px 0 #a3600a}' +
    '#dqOv .go:disabled{background:#3a3570;color:#bab7e8;box-shadow:none}' +
    '#dqOv .lost{font-size:13px;color:#ff9b9b;margin-top:8px;text-align:center}' +
    '#dqOv .q{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #352d86}#dqOv .q:first-of-type{border-top:0}' +
    '#dqOv .q .ic{font-size:28px;width:40px;text-align:center;flex:none}#dqOv .q .tx{flex:1;min-width:0}#dqOv .q .tx b{display:block;font-size:15px}' +
    '#dqOv .bar{height:8px;background:#141040;border-radius:5px;margin-top:6px;overflow:hidden}#dqOv .bar i{display:block;height:100%;background:linear-gradient(90deg,#4ade80,#16a34a);border-radius:5px}' +
    '#dqOv .q small{font-size:12px;color:#bab7e8}' +
    '#dqOv .q button{border:0;border-radius:12px;padding:9px 12px;font:900 14px system-ui,Roboto,sans-serif;min-width:78px;flex:none}' +
    '#dqOv .q .rw{background:#352d86;color:#ffcf3f}#dqOv .q .cl{background:#16a34a;color:#fff;box-shadow:0 3px 0 #0d6b30;animation:dqP 1.2s infinite}#dqOv .q .dn{background:transparent;color:#4ade80}' +
    '#dqOv .chest{display:flex;align-items:center;gap:10px}#dqOv .chest .ic{font-size:34px}#dqOv .chest .tx{flex:1;font-weight:800}#dqOv .chest small{display:block;font-weight:600;color:#bab7e8;font-size:12px}' +
    '#dqOv .chest button{border:0;border-radius:12px;padding:10px 12px;font:900 14px system-ui,Roboto,sans-serif;background:#352d86;color:#bab7e8}#dqOv .chest button.on{background:linear-gradient(90deg,#ffcf3f,#ff9f1a);color:#2a1600}' +
    '#dqOv .shr{display:block;width:100%;border:0;border-radius:14px;padding:12px;margin-top:4px;font:800 15px system-ui,Roboto,sans-serif;color:#fff;background:#352d86}' +
    // shashka doskali sarlavha
    '#dqOv .ban{position:relative;display:flex;align-items:flex-start;gap:14px;margin:-16px -14px 12px;padding:16px 14px 14px;border-radius:24px 24px 0 0;background:radial-gradient(circle at 20% 30%,#3b2a8a,#1a1650 70%);overflow:hidden}' +
    '#dqOv .ban .x{position:absolute;top:12px;right:12px}' +
    '#dqOv .mb{flex:none;width:150px;height:150px;display:grid;grid-template-columns:repeat(8,1fr);border:5px solid #8a4b1f;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.5),inset 0 0 0 1px #c47a3a;position:relative;}' +
    '#dqOv .mb i{display:flex;align-items:center;justify-content:center}#dqOv .mb .l{background:#f0d9b5}#dqOv .mb .d{background:#a8673a}' +
    '#dqOv .mb .p{position:relative;width:84%;height:84%;border-radius:50%;box-shadow:0 2px 0 rgba(0,0,0,.45)}' +
    '#dqOv .mb .w{background:radial-gradient(circle at 40% 35%,#fff,#d9d2c3)}#dqOv .mb .b{background:radial-gradient(circle at 40% 35%,#555,#111)}' +
    '#dqOv .mb .k::after{content:"♛";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#e0a800;font-size:11px}' +
    '#dqOv .ban .gt{flex:1;min-width:0;padding-right:4px}#dqOv .ban .gt b{display:block;font-size:19px;line-height:1.2;margin-top:2px;padding-right:38px}#dqOv .ban .gt small{display:block;margin-top:5px;font-size:13px;color:#d6d3ff;font-weight:600}#dqOv .ban .gt .hi{color:#ffcf3f;font-weight:700;padding-right:40px}' +
    '#dqOv .pzb{display:block;width:100%;margin-top:8px;border:0;border-radius:12px;padding:11px 8px;font:900 15px system-ui,Roboto,sans-serif;color:#fff;background:linear-gradient(90deg,#22c55e,#16a34a);box-shadow:0 3px 0 #0d6b30;animation:dqP 1.4s infinite}#dqOv .pzb.dn{background:#2a2470;color:#4ade80;box-shadow:none;animation:none}' +
    '#dqOv .ld{text-align:center;padding:30px 0;color:#bab7e8;font-weight:700}' +
    // bosh sahifadagi karta
    '#dqCard{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;cursor:pointer;color:#fff;background:linear-gradient(90deg,#e8590c,#f59f00);box-shadow:0 3px 0 #8a3a06;font-family:system-ui,Roboto,sans-serif;box-sizing:border-box;position:relative}' +
    '#dqCard .f{font-size:30px;flex:none}#dqCard .t{flex:1;min-width:0}#dqCard .t b{display:block;font-size:16px;font-weight:900}#dqCard .t small{font-size:13px;font-weight:700;opacity:.95}' +
    '#dqCard .a{font-size:26px;flex:none}#dqCard .dot{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#e11d48;color:#fff;font:900 13px/22px system-ui;text-align:center;padding:0 5px;box-shadow:0 0 0 2px #1a1650}';
  document.head.appendChild(st);

  function ready() { if (!S) return 0; var n = S.streak.claimed ? 0 : 1; S.quests.forEach(function (q) { if (q.done && !q.claimed) n++; }); if (S.bonus.ready && !S.bonus.claimed) n++; return n; }
  function doneN() { return S ? S.quests.filter(function (q) { return q.claimed; }).length : 0; }

  // ---------- bosh sahifa kartasi
  function card() {
    var hero = $('hzHero'); if (!hero || !S) return;
    var c = $('dqCard');
    if (!c) { c = document.createElement('div'); c.id = 'dqCard'; c.onclick = function () { show(); }; hero.appendChild(c); }
    c.style.setProperty('order', '0', 'important'); c.style.setProperty('flex', '1 1 100%', 'important'); c.style.setProperty('margin', '0', 'important');
    var sn = S.streak.claimed ? S.streak.n : S.streak.n, n = ready();
    var h = '<span class="f">🔥</span><div class="t"><b>' + (sn ? sn + ' kunlik seriya' : 'Kunlik vazifalar') + '</b><small>📋 Vazifalar ' + doneN() + '/' + S.quests.length + (S.streak.claimed ? '' : ' · 🎁 Bugungi sovg‘a kutyapti') + '</small></div><span class="a">›</span>' + (n ? '<span class="dot">' + n + '</span>' : '');
    if (c._h !== h) { c._h = h; c.innerHTML = h; }
  }

  // ---------- oyna
  // Petrova kitobidagi navbatdagi masala — haqiqiy pozitsiya
  function board(pz) {
    var h = '<div class="mb">', B = pz && pz.board, flip = pz && pz.side === 'b';
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var r = flip ? 7 - i : i, c = flip ? 7 - j : j, v = B ? B[r][c] : 0;
      h += '<i class="' + ((r + c) % 2 ? 'd' : 'l') + '">' + (v ? '<b class="p ' + (v === 1 || v === 3 ? 'w' : 'b') + (v > 2 ? ' k' : '') + '"></b>' : '') + '</i>';
    }
    return h + '</div>';
  }
  function banner() {
    var nm = ''; try { nm = tg.initDataUnsafe.user.first_name || ''; } catch (e) {}
    var pz = S && S.pz, q0 = S && S.quests && S.quests[0], solved = q0 && (q0.done || q0.claimed);
    var h = '<div class="ban">' + board(pz) + '<div class="gt"><small class="hi">Salom' + (nm ? ', ' + esc(nm) : '') + '! 👋</small><b>📗 Kunning masalasi</b>';
    if (!S) h += '<small>⏳ Yuklanmoqda…</small>';
    else if (!pz) h += '<small>Petrova papkasi topilmadi</small>';
    else {
      h += '<small class="mt">Petrova · №' + pz.no + ' · ' + (pz.side === 'b' ? '⚫ Qoralar' : '⚪ Oqlar') + ' yuradi</small>';
      h += solved ? '<button class="pzb dn" disabled>✅ Bugun yechildi</button>' : '<button class="pzb" id="dqPz">▶ Yechish · +' + (q0 ? q0.r : 40) + ' 🪙</button>';
      h += '<small class="mt">Kitobdan: ' + pz.solvedN + ' / ' + pz.total + '</small>';
    }
    return h + '</div><button class="x" id="dqX">✕</button></div>';
  }
  function render() {
    var ov = $('dqOv'); if (!ov) return;
    if (!S) { ov.innerHTML = '<div class="bx">' + banner() + '<div class="ld">⏳ Vazifalar yuklanmoqda…</div></div>'; ov.querySelector('#dqX').onclick = hide; return; }
    var s = S.streak, h = '<div class="bx">' + banner();
    // seriya
    h += '<div class="sec"><div class="sh">🔥 Kirish seriyasi: ' + s.n + ' kun<span>Rekord: ' + Math.max(s.best, s.n) + '</span></div><div class="days">';
    var base = s.claimed ? s.n : s.n; // 7 kunlik halqa ichidagi o'rin
    var start = Math.floor((s.claimed ? s.n - 1 : s.n) / 7) * 7;
    for (var i = 0; i < 7; i++) {
      var dn = start + i + 1, cls = 'dy' + (i === 6 ? ' big' : '');
      if (dn <= s.n) cls += ' ok';
      if (!s.claimed && dn === s.day) cls += ' now';
      h += '<div class="' + cls + '">' + dn + '-kun<i>' + (dn <= s.n ? '✅' : i === 6 ? '🎁' : '🪙') + '</i><b>' + s.list[i] + '</b></div>';
    }
    h += '</div>';
    h += s.claimed ? '<button class="go" disabled>✅ Bugungi sovg‘a olindi · ertaga +' + s.list[s.n % 7] + '</button>' : '<button class="go" id="dqS">🎁 ' + s.day + '-kun sovg‘asi: +' + s.reward + ' 🪙 olish</button>';
    if (s.lost && !s.claimed) h += '<div class="lost">😔 ' + s.lost + ' kunlik seriya uzildi — bugundan qaytadan boshlang</div>';
    h += '</div>';
    // vazifalar
    h += '<div class="sec"><div class="sh">🎯 Bugungi vazifalar ' + doneN() + '/' + S.quests.length + '<span id="dqT">⏳ ' + hms(S.reset - Date.now()) + '</span></div>';
    S.quests.forEach(function (q) {
      var btn = q.claimed ? '<button class="dn" disabled>✅</button>' : q.done ? '<button class="cl" data-q="' + q.i + '">+' + q.r + ' 🪙</button>' : '<button class="rw" data-go="' + q.i + '">+' + q.r + ' 🪙</button>';
      h += '<div class="q"><span class="ic">' + q.ic + '</span><div class="tx"><b>' + esc(q.t) + '</b><div class="bar"><i style="width:' + Math.round(q.p / q.n * 100) + '%"></i></div><small>' + q.p + ' / ' + q.n + '</small></div>' + btn + '</div>';
    });
    h += '</div>';
    var b = S.bonus;
    h += '<div class="sec chest"><span class="ic">' + (b.claimed ? '📭' : '🧰') + '</span><div class="tx">Uchala vazifa uchun sandiq<small>' + (b.claimed ? 'Olindi — ertaga yangi vazifalar' : 'Hammasini bajarib, qo‘shimcha mukofot oling') + '</small></div><button id="dqB" class="' + (b.ready && !b.claimed ? 'on' : '') + '"' + (b.ready && !b.claimed ? '' : ' disabled') + '>' + (b.claimed ? '✅' : '+' + b.r + ' 🪙') + '</button></div>';
    if (s.n >= 2 && window.spShareCard) h += '<button class="shr" id="dqShare">📸 ' + s.n + ' kunlik seriyamni ulashish</button>';
    h += '</div>';
    ov.innerHTML = h;
    ov.querySelector('#dqX').onclick = hide;
    var e;
    if ((e = ov.querySelector('#dqPz'))) e.onclick = function () { var id = S.pz && S.pz.id; hide(); if (window.spPuzzleOpenId && id) window.spPuzzleOpenId(id); else if (window.mnA) window.mnA('@puz'); };
    if ((e = ov.querySelector('#dqS'))) e.onclick = function () { act('/api/quests/streak', {}); };
    if ((e = ov.querySelector('#dqB'))) e.onclick = function () { act('/api/quests/claim', { bonus: 1 }); };
    if ((e = ov.querySelector('#dqShare'))) e.onclick = function () { window.spShareCard({ theme: 'streak', title: 'KETMA-KET KIRISH', big: String(S.streak.n), unit: 'kun ketma-ket 🔥', sub: 'Har kuni shashka o‘ynayman!', cap: '🔥 ShashkaPRO’da ' + S.streak.n + ' kun ketma-ket o‘ynayapman!' }); };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-q]'), function (x) { x.onclick = function () { act('/api/quests/claim', { i: +x.getAttribute('data-q') }); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-go]'), function (x) { x.onclick = function () { goTo(S.quests[+x.getAttribute('data-go')]); }; });
  }
  function goTo(q) {
    hide();
    var t = q.t;
    if (/Petrova/.test(t) && S && S.pz && window.spPuzzleOpenId) { window.spPuzzleOpenId(S.pz.id); return; }
    if (/masala|Rush|jang/i.test(t)) { if (window.mnA) window.mnA('@puz'); return; }
    if (/Bot/i.test(t)) { var b = document.getElementById('nvBotRow'); if (b) { b.click(); return; } }
    if (/ulash/i.test(t)) { try { tg.showAlert('O‘yin, Rush, masala jangi yoki turnirdan keyin “📸 Ulashish” tugmasini bosing'); } catch (e) {} return; }
    var p = document.getElementById('nvPlayBtn'); if (p) p.click();
  }
  function act(p, body) {
    if (busy) return; busy = true;
    api(p, body).then(function (x) {
      busy = false;
      if (x && x.ok) { coin(x.amount); haptic(); }
      else if (x && x.error) { try { tg.showAlert(x.error); } catch (e) {} }
      if (x && x.state) { S = x.state; render(); card(); }
    }).catch(function () { busy = false; });
  }
  function show() {
    if ($('dqOv')) return;
    var ov = document.createElement('div'); ov.id = 'dqOv';
    ov.onclick = function (e) { if (e.target === ov) hide(); };
    document.body.appendChild(ov); open = true;
    ls('dq_seen', today());
    render(); load();
  }
  function hide() { var ov = $('dqOv'); if (ov) ov.remove(); open = false; }
  window.dqOpen = show;

  function load() {
    return api('/api/quests').then(function (x) {
      if (!x || x.error) return;
      S = x; card(); if (open) render();
      // kuniga birinchi kirishda (yoki bugungi sovg'a olinmagan bo'lsa) oyna o'zi ochiladi
      if (!autoDone) { autoDone = true; if (!S.streak.claimed && !open) show(); }
    }).catch(function () {});
  }
  // kuniga birinchi kirishda — server javobini kutmasdan darhol ochiladi
  function today() { return new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); }
  if (ls('dq_seen') !== today()) { autoDone = true; var _go = function () { if (document.body) show(); else setTimeout(_go, 50); }; _go(); }
  load();
  setInterval(function () {
    card();
    var t = $('dqT'); if (t && S) t.textContent = '⏳ ' + hms(S.reset - Date.now());
    if (S && Date.now() > S.reset) { S.reset = Date.now() + 60000; load(); }
  }, 1000);
  setInterval(function () { if (!open) load(); }, 45000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
