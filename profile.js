(function () {
  'use strict';
  var tg = window.Telegram && Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var css = document.createElement('style');
  css.textContent =
    '.pf-hero{margin:-20px -20px 16px;padding:30px 16px 22px;text-align:center;border-radius:0 0 32px 32px;position:relative;overflow:hidden;' +
    'background:radial-gradient(2px 2px at 20% 30%,#fff9,transparent),radial-gradient(2px 2px at 80% 20%,#fcd34d,transparent),radial-gradient(1.5px 1.5px at 65% 70%,#fff8,transparent),radial-gradient(2px 2px at 12% 75%,#fcd34d99,transparent),' +
    'radial-gradient(circle at 30% 10%,#7b2ff7 0,#4a0f7a 50%,#1a0b3d 100%)}' +
    '.pf-av{width:104px;height:104px;border-radius:50%;border:4px solid #f5b72b;box-shadow:0 0 26px #f5b72b88;object-fit:cover;background:#1a00a8;display:flex;align-items:center;justify-content:center;font-size:46px;margin:0 auto}' +
    '.pf-nm{font-size:22px;font-weight:700;margin-top:10px}' +
    '.pf-bd{display:inline-block;margin-top:8px;padding:6px 14px;border-radius:20px;background:#ffffff22;font-size:13px}' +
    '.pf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}' +
    '.pf-card{background:#161a3a;border:1px solid #262b5a;border-radius:18px;padding:14px 4px;text-align:center}' +
    '.pf-ic{width:44px;height:44px;border-radius:14px;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:22px}' +
    '.pf-v{font-size:24px;font-weight:700}.pf-l{font-size:12px;color:#8a8db8}' +
    '.pf-box{background:#161a3a;border:1px solid #262b5a;border-radius:18px;padding:14px;margin-bottom:14px}' +
    '.pf-box h3{margin:0 0 10px;font-size:16px}' +
    '.pf-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #20244d;font-size:14px}' +
    '.pf-row:last-child{border:0}' +
    '.pf-bt{width:100%;border:0;border-radius:16px;padding:14px;font-size:16px;font-weight:600;color:#fff;background:linear-gradient(90deg,#8e3bf0,#e03a8c)}' +
    '.pf-bt:disabled{opacity:.5}';
  document.head.appendChild(css);
  var rc = document.createElement('style');
  rc.textContent =
    '.pf-ring{position:relative;width:118px;height:118px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center}' +
    '.pf-ring::before,.pf-ring::after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(#f5b72b,#ff4fd8,#22c1ff,#34f5c5,#f5b72b);animation:pfSpin 3s linear infinite}' +
    '.pf-ring.np::before,.pf-ring.np::after{background:#3a3f6b;animation:none;filter:none;opacity:1}.pf-ring.pr::before,.pf-ring.pr::after{background:conic-gradient(#ffd54a,#b8860b,#fff3b0,#c98a00,#ffd54a)}.pf-crown{position:absolute;top:-16px;left:50%;transform:translateX(-50%) rotate(-8deg);font-size:30px;z-index:2;filter:drop-shadow(0 2px 4px #000a)}' +
    '.pf-ring::after{inset:-6px;filter:blur(12px);opacity:.8;animation:pfSpin 3s linear infinite,pfGlow 1.8s ease-in-out infinite alternate}' +
    '.pf-ring .pf-av{position:relative;z-index:1;box-sizing:border-box;width:104px;height:104px;margin:0;border:4px solid #1a0b3d;box-shadow:none}' +
    '@keyframes pfSpin{to{transform:rotate(360deg)}}' +
    '@keyframes pfGlow{from{opacity:.45}to{opacity:1}}';
  document.head.appendChild(rc);
  var cols = ['#fff', '#fcd34d', '#ff9de2', '#8be9ff', '#b9ffd9'];
  function sparks() {
    var h = '';
    for (var i = 0; i < 12; i++) {
      var ang = i * 30, d = 72 + (i % 3) * 14, sz = 4 + (i % 3) * 2, dur = 2.4 + (i % 4) * 0.6, del = (i * 0.37).toFixed(2);
      h += '<i class="pf-sp" style="--a:' + ang + 'deg;--d:' + d + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + cols[i % 5] + ';box-shadow:0 0 8px 2px ' + cols[i % 5] + ';animation-duration:' + dur + 's;animation-delay:-' + del + 's"></i>';
    }
    return h;
  }
  var sc = document.createElement('style');
  sc.textContent =
    '.pf-sp{position:absolute;left:50%;top:50%;margin:-3px 0 0 -3px;border-radius:50%;z-index:2;pointer-events:none;' +
    'transform:rotate(var(--a)) translateX(var(--d));animation-name:pfTw;animation-iteration-count:infinite;animation-timing-function:ease-in-out}' +
    '@keyframes pfTw{0%{opacity:0;transform:rotate(var(--a)) translateX(calc(var(--d) - 10px)) scale(.3)}' +
    '50%{opacity:1;transform:rotate(calc(var(--a) + 40deg)) translateX(var(--d)) scale(1)}' +
    '100%{opacity:0;transform:rotate(calc(var(--a) + 80deg)) translateX(calc(var(--d) + 12px)) scale(.3)}}';
  document.head.appendChild(sc);
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function api(path, method) {
    return fetch(path, { method: method || 'GET', headers: { 'x-init-data': initData } })
      .then(function (r) { return r.json(); });
  }
  function rank(w) {
    if (w >= 200) return '👑 Usta';
    if (w >= 100) return '🥇 Ekspert';
    if (w >= 50) return '🥈 Kapitan';
    if (w >= 20) return '🥉 Serjant';
    if (w >= 5) return '🎖 Askar';
    return '🌱 Yangi';
  }
  function card(ic, bg, v, l) {
    return '<div class="pf-card"><div class="pf-ic" style="background:' + bg + '">' + ic + '</div>' +
      '<div class="pf-v">' + v + '</div><div class="pf-l">' + l + '</div></div>';
  }
  function ago(t) {
    var m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return 'hozir';
    if (m < 60) return m + ' daq oldin';
    if (m < 1440) return Math.floor(m / 60) + ' soat oldin';
    return Math.floor(m / 1440) + ' kun oldin';
  }
  // ⌨️ klaviatura chiqqanda pastki oyna uning ostida qolmasin
  window.spKb = function (ov) {
    var sheet = ov && ov.firstElementChild; if (!sheet) return;
    var vv = window.visualViewport;
    function up() {
      var gap = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      sheet.style.transform = gap ? 'translateY(-' + gap + 'px)' : '';
      sheet.style.maxHeight = (vv ? Math.round(vv.height * 0.92) : Math.round(window.innerHeight * 0.88)) + 'px';
      sheet.style.overflowY = 'auto';
    }
    up();
    if (vv) { vv.addEventListener('resize', up); vv.addEventListener('scroll', up); }
    var mo = new MutationObserver(function () {
      if (!document.body.contains(ov)) { if (vv) { vv.removeEventListener('resize', up); vv.removeEventListener('scroll', up); } mo.disconnect(); }
    });
    mo.observe(document.body, { childList: true });
    return up;
  };

    window.spBio = function (uid, name) {
    uid = String(uid);
    var tgw = window.Telegram && window.Telegram.WebApp;
    var H = { 'x-init-data': (tgw && tgw.initData) || '', 'Content-Type': 'application/json' };
    var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var old = document.getElementById('spBioOv'); if (old) old.remove();
    var items = [], more = false, canWrite = false, reply = null, busy = false, bioOff = false, isOwn = false;
    var ov = document.createElement('div'); ov.id = 'spBioOv';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
    ov.innerHTML = '<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#141833;color:#fff;border-radius:22px 22px 0 0;padding:14px 14px calc(env(safe-area-inset-bottom,0px) + 12px);box-sizing:border-box;font-family:inherit">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><b style="font-size:17px">💬 Bio izohlari' + (name ? ' · ' + E(name) : '') + '</b><button id="spBioX" style="border:0;background:#262b5a;color:#fff;border-radius:10px;width:36px;height:36px;font-size:16px">✕</button></div>' +
      '<div id="spBioC" style="display:none;gap:8px;margin-bottom:10px"></div>' +
      '<div id="spBioL" style="flex:1;min-height:120px;overflow:auto"></div><div id="spBioF" style="margin-top:10px"></div></div>';
    document.body.appendChild(ov);
    var L = ov.querySelector('#spBioL'), F = ov.querySelector('#spBioF'), C = ov.querySelector('#spBioC');
    var kbUp = window.spKb ? window.spKb(ov) : null;
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.querySelector('#spBioX').onclick = function () { ov.remove(); };
    function tm(t) { var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getDate()) + '.' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
    function av(x) { return '<div style="width:38px;height:38px;border-radius:50%;flex:none;background:#3b3fa8;display:flex;align-items:center;justify-content:center;font-weight:800;position:relative;overflow:hidden">' + E((x.n || '?').charAt(0).toUpperCase()) + '<img src="/api/av/' + encodeURIComponent(x.f) + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>'; }
    function draw(stick) {
      var h = more ? '<button data-a="old" style="width:100%;border:0;border-radius:12px;padding:10px;margin-bottom:8px;background:#262b5a;color:#fff;font-size:14px">⌃ Eskilarini yuklash</button>' : '';
      if (!items.length) h += '<div style="text-align:center;opacity:.6;padding:24px 0">Hali izoh yo‘q</div>';
      h += items.map(function (x) {
        return '<div style="display:flex;gap:10px;background:#1c2145;border-radius:14px;padding:10px;margin-bottom:8px">' + av(x) +
          '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + E(x.n) + (x.vip ? ' 👑' : '') + '</b><span style="opacity:.55;font-size:12px;flex:none">' + tm(x.t) + '</span></div>' +
          (x.r ? '<div style="border-left:3px solid #8e3bf0;background:rgba(142,59,240,.15);padding:4px 8px;margin:4px 0;font-size:13px"><b>' + E(x.r.n) + '</b><br>' + E(x.r.tx) + '</div>' : '') +
          '<div style="font-size:15px;word-break:break-word;margin-top:2px">' + E(x.tx) + '</div>' +
          '<div style="margin-top:4px;font-size:13px;opacity:.75"><span data-a="re" data-id="' + x.id + '" style="cursor:pointer;margin-right:14px">↩ Javob</span>' + (x.del ? '<span data-a="del" data-id="' + x.id + '" style="cursor:pointer">🗑</span>' : '') + '</div></div></div>';
      }).join('');
      L.innerHTML = h; if (stick) L.scrollTop = L.scrollHeight;
    }
    function owner() {   // 🔒 profil egasi: izohlarni yopish/ochish va tozalash
      if (!isOwn) { C.style.display = 'none'; return; }
      C.style.display = 'flex';
      C.innerHTML = '<button id="spBioLk" style="flex:1;border:0;border-radius:12px;padding:11px;font-weight:700;font-size:14px;' +
        (bioOff ? 'background:#7a2b2b;color:#ffd9d9' : 'background:#262b5a;color:#fff') + '">' + (bioOff ? '🔒 Izohlar yopiq — ochish' : '🔓 Izohlarni yopish') + '</button>' +
        '<button id="spBioCl" style="flex:none;border:0;border-radius:12px;padding:11px 14px;background:#262b5a;color:#fff;font-weight:700;font-size:14px">🧹 Tozalash</button>';
      C.querySelector('#spBioLk').onclick = function () {
        fetch('/api/social/biolock', { method: 'POST', headers: H, body: JSON.stringify({ uid: uid, off: !bioOff }) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.ok) { bioOff = !!j.off; owner(); foot(); } });
      };
      C.querySelector('#spBioCl').onclick = function () {
        if (!confirm('Hamma izoh o‘chirilsinmi?')) return;
        fetch('/api/social/bioclear', { method: 'POST', headers: H, body: JSON.stringify({ uid: uid }) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.ok) { items = []; more = false; draw(false); } });
      };
    }
    function foot() {
      var cur = F.querySelector('#spBioI'), v = cur ? cur.value : '';
      if (bioOff && !isOwn) { F.innerHTML = '<div style="text-align:center;opacity:.75;font-size:14px">🔒 Bu profilda izohlar yopiq</div>'; return; }
      if (!canWrite) {
        F.innerHTML = '<div style="text-align:center;opacity:.75;font-size:14px;margin-bottom:8px">Izoh yozish faqat Premium obunachilar uchun</div><button id="spBioP" style="width:100%;border:0;border-radius:12px;padding:12px;background:linear-gradient(90deg,#f59e0b,#fbbf24);color:#1a1205;font-weight:800;font-size:15px">👑 Premium</button>';
        var pb = F.querySelector('#spBioP'); if (pb) pb.onclick = function () { if (window.premGo) window.premGo(); };
        return;
      }
      var rp = reply ? '<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;opacity:.8;margin-bottom:6px"><span>↩ ' + E(reply.n) + ': ' + E(String(reply.tx).slice(0, 40)) + '</span><span data-a="cx" style="cursor:pointer">✕</span></div>' : '';
      F.innerHTML = rp + '<div style="display:flex;gap:8px"><input id="spBioI" maxlength="200" placeholder="Izoh yozing…" style="flex:1;min-width:0;padding:10px;border-radius:10px;border:1px solid #2c3270;background:#0d1024;color:#fff;font-size:16px"><button id="spBioG" style="flex:none;border:0;border-radius:10px;padding:0 16px;background:#81b64c;color:#fff;font-size:18px">➤</button></div><div id="spBioE" style="color:#ff8a8a;font-size:13px;min-height:16px;margin-top:4px"></div>';
      var ii = F.querySelector('#spBioI'); ii.value = v;
      ii.onfocus = function () { setTimeout(function () { if (kbUp) kbUp(); }, 250); };
      F.querySelector('#spBioG').onclick = send;
      ii.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } };
    }
    F.onclick = function (e) { var el = e.target.closest ? e.target.closest('[data-a="cx"]') : null; if (el) { reply = null; foot(); } };
    function send() {
      var i = F.querySelector('#spBioI'), er = F.querySelector('#spBioE'); if (!i || busy) return;
      var t = i.value.trim(); if (!t) { er.textContent = 'Izoh yozing'; return; }
      busy = true;
      fetch('/api/social/bio', { method: 'POST', headers: H, body: JSON.stringify({ uid: uid, text: t, reply: reply ? reply.id : 0 }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { busy = false; if (j && j.ok) { items.push(j.item); reply = null; draw(true); i.value = ''; foot(); } else if (er) er.textContent = (j && j.error) || 'Xato'; })
        .catch(function () { busy = false; if (er) er.textContent = 'Server bilan aloqa yo‘q'; });
    }
    L.onclick = function (e) {
      var el = e.target.closest ? e.target.closest('[data-a]') : null; if (!el) return;
      var a = el.getAttribute('data-a'), id = +el.getAttribute('data-id');
      if (a === 'old') load(items.length ? items[0].id : 0);
      else if (a === 're') { var it = items.filter(function (z) { return z.id === id; })[0]; if (it) { reply = it; foot(); var q = F.querySelector('#spBioI'); if (q) q.focus(); } }
      else if (a === 'del') {
        if (!confirm('Izoh o‘chirilsinmi?')) return;
        fetch('/api/social/biodel', { method: 'POST', headers: H, body: JSON.stringify({ uid: uid, id: id }) }).then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.ok) { items = items.filter(function (z) { return z.id !== id; }); draw(false); } });
      }
    };
    function load(before) {
      fetch('/api/social/bio?uid=' + encodeURIComponent(uid) + (before ? '&before=' + before : ''), { headers: H }).then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || j.error) { L.innerHTML = '<div style="text-align:center;opacity:.7;padding:24px 0">Yuklanmadi</div>'; return; }
          items = before ? j.list.concat(items) : j.list; more = !!j.more; canWrite = !!j.canWrite; bioOff = !!j.off; isOwn = !!j.own; draw(!before); owner(); foot();
        }).catch(function () { L.innerHTML = '<div style="text-align:center;opacity:.7;padding:24px 0">Server bilan aloqa yo‘q</div>'; });
    }
    load(0);
  };

  // ❤️ kim like bosgan — faqat profil egasi va adminlar
  window.spLikers = function (uid) {
    var tgw = window.Telegram && window.Telegram.WebApp;
    var H = { 'x-init-data': (tgw && tgw.initData) || '', 'Content-Type': 'application/json' };
    var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var old = document.getElementById('spLkOv'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spLkOv';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482650;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
    ov.innerHTML = '<div style="width:100%;max-height:82vh;display:flex;flex-direction:column;background:#141833;color:#fff;border-radius:22px 22px 0 0;padding:14px 14px calc(env(safe-area-inset-bottom,0px) + 12px);box-sizing:border-box">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><b style="font-size:17px">❤️ Kim yoqtirdi</b>' +
      '<button id="spLkX" style="border:0;background:#262b5a;color:#fff;border-radius:10px;width:36px;height:36px;font-size:16px">✕</button></div>' +
      '<div id="spLkL" style="flex:1;min-height:120px;overflow:auto">Yuklanmoqda…</div></div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.querySelector('#spLkX').onclick = function () { ov.remove(); };
    var L = ov.querySelector('#spLkL');
    if (window.spKb) window.spKb(ov);
    fetch('/api/social/likers' + (uid ? '?uid=' + encodeURIComponent(uid) : ''), { headers: H })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || j.error) { L.innerHTML = '<div style="text-align:center;opacity:.7;padding:24px 0">' + E((j && j.error) || 'Yuklanmadi') + '</div>'; return; }
        if (!j.list.length) { L.innerHTML = '<div style="text-align:center;opacity:.7;padding:24px 0">Hali hech kim like bosmagan</div>'; return; }
        L.innerHTML = '<div style="opacity:.7;font-size:13px;margin-bottom:8px">Jami: <b>' + j.n + '</b></div>' + j.list.map(function (x) {
          return '<div style="display:flex;align-items:center;gap:10px;background:#1c2145;border-radius:14px;padding:9px 10px;margin-bottom:7px">' +
            '<div style="width:38px;height:38px;border-radius:50%;flex:none;background:#3b3fa8;display:flex;align-items:center;justify-content:center;font-weight:800;position:relative;overflow:hidden">' +
            E((x.n || '?').charAt(0).toUpperCase()) + '<img src="/api/av/' + encodeURIComponent(x.uid) + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>' +
            '<div style="flex:1;min-width:0"><b style="font-size:15px">' + E(x.n) + (x.vip ? ' 👑' : '') + '</b>' +
            '<div style="opacity:.6;font-size:12.5px">' + E(x.d || '') + (x.elo ? ' · ELO ' + x.elo : '') + '</div></div></div>';
        }).join('');
      })
      .catch(function () { L.innerHTML = '<div style="text-align:center;opacity:.7;padding:24px 0">Server bilan aloqa yo‘q</div>'; });
  };

  window.nvProfile = function (pg) {
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var name = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || 'Mehmon';
    var av = u.id
      ? '<img class="pf-av" src="/api/av/' + u.id + '?t=' + Date.now() + '" onerror="this.outerHTML=&quot;<div class=pf-av>👤</div>&quot;">'
      : '<div class="pf-av">👤</div>';
    pg.innerHTML = '<div class="pf-hero"><div class="pf-ring">' + av + sparks() + '</div>' +
      '<div class="pf-nm">' + esc(name) + '</div>' +
      '<div class="pf-bd" id="pfRank">…</div></div><div id="pfBody"></div>';
    if (!initData) {
      $('pfBody').innerHTML = '<div class="pf-box" style="color:#8a8db8">Statistika uchun Telegram orqali kiring.</div>';
      return;
    }
    api('/api/profile').then(function (d) {
      if (d.error) { $('pfBody').innerHTML = '<div class="pf-box">Yuklab bo‘lmadi</div>'; return; }
      var pct = d.games ? Math.round(d.wins * 100 / d.games) : 0;
      $('pfRank').textContent = rank(d.wins) + (d.premium ? ' · 👑 Premium' : '');
      (function () { var rg = document.querySelector('.pf-ring'); if (!rg) return; rg.classList.add(d.premium ? 'pr' : 'np'); if (d.premium && !rg.querySelector('.pf-crown')) { var cr = document.createElement('span'); cr.className = 'pf-crown'; cr.textContent = '👑'; rg.appendChild(cr); } })();   // 👑 Premium ramka
      (function () {   // 👑 Premium tugmasi
        var pb = document.createElement('button'); pb.id = 'pfPrem';
        pb.textContent = d.premium ? '👑 Premium faol' : '👑 Premium olish';
        pb.style.cssText = 'display:block;margin:10px auto 0;border:0;border-radius:14px;padding:8px 18px;font-size:13px;font-weight:700;color:#2a1600;background:linear-gradient(135deg,#ffd54a,#b8860b)';
        pb.onclick = function () { if (window.premGo) window.premGo(); };
        var o = document.getElementById('pfPrem'); if (o) o.remove();
        $('pfRank').parentNode.appendChild(pb);
      })();
      function setAv(src) {
        var old = document.querySelector('.pf-av'); if (!old) return;
        var im = document.createElement('img'); im.className = 'pf-av'; im.src = src;
        old.parentNode.replaceChild(im, old);
      }
      
      var bt = document.createElement('button');
      bt.id = 'pfUp'; bt.textContent = d.premium ? '📷 Rasm qo‘yish' : '📷 Rasm qo‘yish 👑';
      bt.style.cssText = 'display:block;margin:10px auto 0;border:0;border-radius:14px;padding:8px 16px;background:#ffffff33;color:#fff;font-size:13px';
      var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
      bt.onclick = function () {   // 🖼 profil rasmi — faqat Premium
        if (!d.premium) { bt.textContent = '👑 Rasm qo‘yish Premium uchun'; if (window.premGo) window.premGo(); setTimeout(function () { bt.textContent = '📷 Rasm qo‘yish 👑'; }, 2500); return; }
        fi.click();
      };
      fi.onchange = function () {
        var f = fi.files && fi.files[0]; if (!f) return;
        bt.textContent = 'Yuklanmoqda…'; bt.disabled = true;
        var rd = new FileReader();
        rd.onload = function () {
          var im = new Image();
          im.onload = function () {
            var z = 256, cv = document.createElement('canvas'); cv.width = z; cv.height = z;
            var m = Math.min(im.width, im.height), sx = (im.width - m) / 2, sy = (im.height - m) / 2;
            cv.getContext('2d').drawImage(im, sx, sy, m, m, 0, 0, z, z);
            var url = cv.toDataURL('image/jpeg', 0.8);
            fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: JSON.stringify({ img: url }) })
              .then(function (r) { return r.json(); })
              .then(function (j) {
                bt.disabled = false;
                if (j && j.ok) { setAv(url); bt.textContent = '✅ Saqlandi'; setTimeout(function () { bt.textContent = '📷 Rasm qo‘yish'; }, 2000); }
                else bt.textContent = j && j.error === 'premium' ? '👑 Rasm qo‘yish Premium uchun' : '⚠️ Xatolik, qayta urinib ko‘ring';
              })
              .catch(function () { bt.disabled = false; bt.textContent = '⚠️ Server bilan aloqa yo‘q'; });
          };
          im.onerror = function () { bt.disabled = false; bt.textContent = '⚠️ Rasm ochilmadi'; };
          im.src = rd.result;
        };
        rd.readAsDataURL(f);
      };
      $('pfRank').parentNode.appendChild(bt);
      $('pfRank').parentNode.appendChild(fi);

      // ✍️ o'zi haqida (bio) — profil ostida ko'rinadi, faqat Premium yozadi
      (function () {
        var box = document.createElement('div');
        box.id = 'pfBioBox';
        box.style.cssText = 'margin:10px auto 0;max-width:340px;text-align:center';
        var txt = document.createElement('div');
        txt.id = 'pfBioTx';
        txt.style.cssText = 'font-size:13.5px;color:#e9e3ff;opacity:.9;line-height:1.45;margin-bottom:6px;word-break:break-word';
        txt.textContent = d.bio || '';
        var eb = document.createElement('button');
        eb.id = 'pfBioEd';
        eb.textContent = d.bio ? '✍️ Bio o‘zgartirish' : (d.premium ? '✍️ Bio yozish' : '✍️ Bio yozish 👑');
        eb.style.cssText = 'border:0;border-radius:14px;padding:8px 16px;background:#ffffff33;color:#fff;font-size:13px';
        eb.onclick = function () {
          if (!d.premium) { eb.textContent = '👑 Bio faqat Premium uchun'; if (window.premGo) window.premGo(); setTimeout(function () { eb.textContent = '✍️ Bio yozish 👑'; }, 2500); return; }
          var ov = document.createElement('div');
          ov.style.cssText = 'position:fixed;inset:0;z-index:2147482700;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
          ov.innerHTML = '<div style="width:100%;background:#141833;color:#fff;border-radius:22px 22px 0 0;padding:14px 14px calc(env(safe-area-inset-bottom,0px) + 12px);box-sizing:border-box">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><b style="font-size:17px">✍️ O‘zingiz haqingizda</b>' +
            '<button id="pfBioX" style="border:0;background:#262b5a;color:#fff;border-radius:10px;width:36px;height:36px;font-size:16px">✕</button></div>' +
            '<textarea id="pfBioI" maxlength="120" rows="3" placeholder="Masalan: Surxondaryodan, blits yaxshi ko‘raman" style="width:100%;box-sizing:border-box;padding:10px;border-radius:12px;border:1px solid #2c3270;background:#0d1024;color:#fff;font-size:15px;resize:none"></textarea>' +
            '<div id="pfBioN" style="text-align:right;font-size:12px;opacity:.6;margin:4px 2px 8px">0 / 120</div>' +
            '<div style="display:flex;gap:8px"><button id="pfBioS" style="flex:1;border:0;border-radius:12px;padding:12px;background:#81b64c;color:#fff;font-weight:700;font-size:15px">Saqlash</button>' +
            '<button id="pfBioD" style="flex:none;border:0;border-radius:12px;padding:12px 16px;background:#7a2b2b;color:#ffd9d9;font-weight:700;font-size:15px">O‘chirish</button></div>' +
            '<div id="pfBioE" style="color:#ff8a8a;font-size:13px;min-height:16px;margin-top:6px"></div></div>';
          document.body.appendChild(ov);
          var kb = window.spKb ? window.spKb(ov) : null;
          var ta = ov.querySelector('#pfBioI'), nn = ov.querySelector('#pfBioN'), er = ov.querySelector('#pfBioE');
          ta.onfocus = function () { setTimeout(function () { if (kb) kb(); }, 250); };
          ta.value = txt.textContent || ''; nn.textContent = ta.value.length + ' / 120';
          ta.oninput = function () { nn.textContent = ta.value.length + ' / 120'; };
          ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
          ov.querySelector('#pfBioX').onclick = function () { ov.remove(); };
          function save(v) {
            fetch('/api/bio', { method: 'POST', headers: { 'x-init-data': (tg && tg.initData) || '', 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: v }) })
              .then(function (r) { return r.json(); })
              .then(function (j) {
                if (j && j.ok) { txt.textContent = v; d.bio = v; eb.textContent = v ? '✍️ Bio o‘zgartirish' : '✍️ Bio yozish'; ov.remove(); }
                else er.textContent = (j && j.error) || 'Saqlanmadi';
              }).catch(function () { er.textContent = 'Server bilan aloqa yo‘q'; });
          }
          ov.querySelector('#pfBioS').onclick = function () { save(ta.value.trim()); };
          ov.querySelector('#pfBioD').onclick = function () { ta.value = ''; save(''); };
          setTimeout(function () { ta.focus(); }, 100);
        };
        box.appendChild(txt); box.appendChild(eb);
        $('pfRank').parentNode.appendChild(box);
      })();
      var h = '<div class="pf-grid">' +
        card('📈', 'linear-gradient(135deg,#22c1ff,#0be3ff)', d.elo, 'ELO') +
        card('⭐', 'linear-gradient(135deg,#fbbf24,#f59e0b)', d.bestStreak, 'Eng yaxshi seriya') +
        card('🪙', 'linear-gradient(135deg,#ff6fa5,#ff8fc0)', d.diamonds, 'Tanga') +
        card('🏆', 'linear-gradient(135deg,#fcd34d,#f9a77a)', d.wins, 'G‘alaba') +
        card('✖️', 'linear-gradient(135deg,#ff2e63,#ff6b6b)', d.losses, 'Mag‘lub') +
        card('🤝', 'linear-gradient(135deg,#ff5a00,#fbbf24)', d.draws, 'Durang') +
        card('🎮', 'linear-gradient(135deg,#22e6a8,#34f5c5)', d.games, 'Jami o‘yinlar') +
        card('📊', 'linear-gradient(135deg,#8e3bf0,#c05cf0)', pct + '%', 'G‘alaba foizi') +
        card('🔥', 'linear-gradient(135deg,#ff7a18,#ffb347)', d.streak, 'Joriy seriya') +
        '</div><div id="pfSoc"></div>';
      h += '<div class="pf-box"><h3>Oxirgi o‘yinlar</h3>';
      if (!d.hist.length) h += '<div class="pf-l">Hali o‘yin yo‘q</div>';
      d.hist.forEach(function (x) {
        var r = x.r === 'w' ? '✅ G‘alaba' : x.r === 'l' ? '❌ Mag‘lub' : '🤝 Durang';
        h += '<div class="pf-row"><span>' + r + ' · ' + esc(x.opp) + '</span><span class="pf-l">' + ago(x.t) + '</span></div>';
      });
      h += '</div><div class="pf-box"><h3>Tanga tarixi</h3>';
      if (!d.log.length) h += '<div class="pf-l">Hali yozuv yo‘q</div>';
      d.log.forEach(function (x) {
        h += '<div class="pf-row"><span>' + (x.d > 0 ? '+' : '') + x.d + ' 🪙</span><span class="pf-l">' + esc(x.why) + ' · ' + ago(x.t) + '</span></div>';
      });
      if (d.ach && d.ach.list) {   // 🏅 yutuqlar javoni
        h += '</div><div class="pf-box"><h3>🏅 Yutuqlar <span class="pf-l" style="font-weight:400">' + d.ach.n + '/' + d.ach.total + '</span></h3><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">';
        d.ach.list.forEach(function (a) {
          h += '<div data-ach="' + esc(a.ic + ' ' + a.name + ' — ' + a.cond + ' (+' + a.coins + ' 🪙)' + (a.at ? ' ✅' : '')) + '" style="aspect-ratio:1;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;background:' + (a.at ? 'linear-gradient(135deg,#3a2a00,#1d1f45);border:1px solid #f5b72b' : '#141833;border:1px solid #262b5a;filter:grayscale(1);opacity:.35') + '">' + a.ic + '</div>';
        });
        h += '</div><div id="pfAchT" class="pf-l" style="min-height:18px;margin-top:8px;font-size:13px"></div>';
      }
      h += '</div><button class="pf-bt" id="pfDaily" disabled>🎁 Kunlik bonus</button><div id="pfMsg" class="pf-l" style="margin:8px 0 20px;text-align:center"></div>';
      $('pfBody').innerHTML = h;
      (function () {   // 🎖 unvon progressi · ❤️ like · 📸 Instagram · 🔐 parol
        var go = function (f) { var run = function () { window.spSocial[f](); }; if (window.spSocial) return run(); var s = document.createElement('script'); s.src = '/socialview.js?v=1'; s.onload = run; document.head.appendChild(s); };
        api('/api/social/me').then(function (S) {
          var box = $('pfSoc'); if (!box || !S || S.error) return;
          var r = S.rank, nx = r.next, pc = nx ? Math.round((r.n - nx.from) * 100 / Math.max(1, nx.n - nx.from)) : 100;
          var row = function (id, ic, bg, t, s) { return '<div id="' + id + '" class="pf-box" style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:12px 14px"><div class="pf-ic" style="margin:0;flex:none;background:' + bg + '">' + ic + '</div><div style="flex:1;min-width:0"><b style="display:block;font-size:16px">' + t + '</b><span class="pf-l" style="font-size:13px">' + s + '</span></div><span style="opacity:.5;font-size:20px">›</span></div>'; };
          var h2 = '<div id="pfRk" class="pf-box" style="cursor:pointer"><div style="display:flex;align-items:center;gap:10px;font-size:15px"><b>' + esc(r.name) + '</b><span class="pf-l" style="flex:1;text-align:right">' + (nx ? '<b style="color:#fff">' + esc(nx.name.replace(/^\S+\s/, '')) + '</b> unvoniga yana <b style="color:#fff">' + nx.need + '</b> ta do‘st taklifi' : 'Eng yuqori unvon!') + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><div style="flex:1;height:8px;border-radius:6px;background:#262b5a;overflow:hidden"><div style="height:100%;width:' + pc + '%;background:linear-gradient(90deg,#8e3bf0,#e03a8c)"></div></div><span class="pf-l">' + r.n + (nx ? ' / ' + nx.n : '') + '</span></div></div>';
          if (!S.hasPass) h2 += row('pfPw', '🔒', 'linear-gradient(135deg,#f59e0b,#fbbf24)', 'Parol o‘rnating', 'Telegram ishlamasa ham saytdan login + parol bilan kirasiz');
          h2 += row('pfIg', '📸', 'linear-gradient(135deg,#f58529,#dd2a7b,#8134af)', 'Instagram’da ulash', 'Har tasdiqlangan post +' + S.ig.bonus + ' 🪙, har yangi do‘st +100 🪙 gacha');
          if (S.hasPass) h2 += row('pfPw', '🔐', 'linear-gradient(135deg,#334155,#64748b)', 'Login: ' + esc(S.login), 'Parolni almashtirish');
          box.innerHTML = h2;
          $('pfRk').onclick = function () { if (window.refGo) window.refGo(); };
          $('pfIg').onclick = function () { go('ig'); };
          $('pfPw').onclick = function () { go('pass'); };
          var rk = $('pfRank'); if (rk && !document.getElementById('pfLk')) { var lk = document.createElement('div'); lk.id = 'pfLk'; lk.className = 'pf-bd'; lk.style.marginRight = '6px'; lk.textContent = '❤️ ' + S.likes; lk.style.cursor = 'pointer'; lk.onclick = function () { if (window.spLikers) window.spLikers(''); }; rk.parentNode.insertBefore(lk, rk); var bio = document.createElement('div'); bio.className = 'pf-bd'; bio.style.cssText = 'margin-right:6px;cursor:pointer'; bio.textContent = '💬 Izohlar'; bio.onclick = function () { var tw = window.Telegram && window.Telegram.WebApp, u0 = tw && tw.initDataUnsafe && tw.initDataUnsafe.user; if (u0 && window.spBio) window.spBio(String(u0.id), ''); }; rk.parentNode.insertBefore(bio, rk); }
        }).catch(function () {});
      })();
      [].forEach.call(document.querySelectorAll('[data-ach]'), function (el) { el.onclick = function () { var t = $('pfAchT'); if (t) t.textContent = el.getAttribute('data-ach'); }; });
      if (d.achNew && d.achNew.length && d.achNew.some(function (x) { return !/ \+0$/.test(x); })) { var _t = $('pfAchT'); if (_t) { _t.style.color = '#7ee08a'; _t.textContent = '🎉 Yangi: ' + d.achNew.join(' · '); } }
      api('/api/balance').then(function (b) {
        if (b.error) return;
        $('pfDaily').disabled = !b.canClaimDaily;
        $('pfDaily').textContent = b.canClaimDaily ? '🎁 Kunlik bonus +20' : '✅ Bonus olingan';
      });
      $('pfDaily').onclick = function () {
        api('/api/daily', 'POST').then(function (r) {
          $('pfMsg').textContent = r.ok ? '+' + r.amount + ' 🪙 olindi' : 'Bugun olingan';
          window.nvProfile(pg);
        });
      };
    }).catch(function () { $('pfBody').innerHTML = '<div class="pf-box">Server bilan aloqa yo‘q</div>'; });
  };
})();
