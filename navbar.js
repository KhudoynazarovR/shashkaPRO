(function () {
  'use strict';
  var tg = window.Telegram && Telegram.WebApp;
  var initData = (tg && tg.initDataUnsafe && tg.initData) || '';
  var $ = function (id) { return document.getElementById(id); };
  var css = document.createElement('style');
  css.textContent =
    '#lbBtn{display:none!important}' +
    'body{padding-bottom:64px}' +
    '#nvBar{position:fixed;left:0;right:0;bottom:0;height:60px;display:flex;background:#10112a;border-top:1px solid #2a2c55;z-index:99999;padding-bottom:env(safe-area-inset-bottom)}' +
    '#nvBar button{flex:1;background:none;border:0;color:#8a8db8;font-size:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}' +
    '#nvBar button span{font-size:22px;line-height:1}' +
    '#nvBar button.on{color:#7c83ff}' +
    '#nvPg{position:fixed;left:0;right:0;top:0;bottom:60px;background:#12122b;color:#fff;z-index:99998;overflow:auto;padding:20px;display:none;font-family:system-ui,sans-serif}' +
    '#nvPg h2{margin:0 0 14px}#nvPg .c{background:#1b1c3d;border-radius:14px;padding:14px;margin-bottom:12px}' +
    '#nvPg .m{color:#8a8db8;font-size:13px}' +
    '#nvPg .b{background:#4f5bff;color:#fff;border:0;border-radius:10px;padding:10px 16px;font-size:15px}' +
    '#nvPg .b:disabled{opacity:.5}';
  document.head.appendChild(css);
  var bar = document.createElement('div');
  bar.id = 'nvBar';
  var items = [['pl', '🏠', 'Bosh'], ['puz', '🧩', 'Masalalar'], ['rk', '📊', 'Reyting'], ['mn', '☰', 'Menyu']];
  bar.innerHTML = items.map(function (i) {
    return '<button data-k="' + i[0] + '"><span>' + i[1] + '</span>' + i[2] + '</button>';
  }).join('') + '<button data-k="pf" style="display:none"><span>👤</span>Profil</button><button data-k="t" style="display:none"><span>🏆</span>Turnir</button>';
  document.body.appendChild(bar);
  var pg = document.createElement('div');
  pg.id = 'nvPg';
  document.body.appendChild(pg);

  function mark(k) {
    window.nvK = k;
    [].forEach.call(bar.querySelectorAll('button'), function (b) {
      b.className = b.getAttribute('data-k') === k ? 'on' : '';
    });
  }
  function api(path, method) {
    return fetch(path, { method: method || 'GET', headers: { 'x-init-data': initData } })
      .then(function (r) { return r.json(); });
  }
  function profile() {
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var name = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || 'Mehmon';
    var photo = u.photo_url
      ? '<img src="' + u.photo_url + '" style="width:72px;height:72px;border-radius:50%">'
      : '<div style="font-size:56px">👤</div>';
    pg.innerHTML = '<h2>Profil</h2><div class="c" style="text-align:center">' + photo +
      '<div id="nvName" style="font-size:20px;font-weight:600;margin-top:8px"></div></div>' +
      '<div class="c"><div class="m">Balans</div>' +
      '<div id="nvBal" style="font-size:28px">🪙 …</div>' +
      '<button class="b" id="nvDaily" style="margin-top:10px" disabled>🎁 Kunlik bonus</button>' +
      '<div id="nvMsg" class="m" style="margin-top:8px"></div></div>';
    $('nvName').textContent = name;
    if (!initData) {
      $('nvMsg').textContent = 'Balans uchun Telegram orqali kiring.';
      $('nvBal').textContent = '🪙 —';
      return;
    }
    function load() {
      api('/api/balance').then(function (d) {
        if (d.error) { $('nvBal').textContent = '🪙 —'; return; }
        $('nvBal').textContent = '🪙 ' + d.diamonds;
        $('nvDaily').disabled = !d.canClaimDaily;
        $('nvDaily').textContent = d.canClaimDaily ? '🎁 Kunlik bonus +' + (d.dailyAmount || 20) + (d.streak ? ' · 🔥' + d.streak : '') : '✅ Bonus olingan';
      }).catch(function () { $('nvMsg').textContent = 'Server bilan aloqa yo‘q'; });
    }
    $('nvDaily').onclick = function () {
      api('/api/daily', 'POST').then(function (d) {
        $('nvMsg').textContent = d.ok ? '+' + d.amount + ' 🪙 olindi' : 'Bugun olingan';
        load();
      });
    };
    load();
  }
  function soon(title, text) {
    pg.innerHTML = '<h2>' + title + '</h2><div class="c m">' + text + '</div>';
  }
  bar.onclick = function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var k = b.getAttribute('data-k');
    mark(k);
    if (window.aiHide) window.aiHide();
    if (window.rkClose) window.rkClose();
    if (window.mnClose) window.mnClose();
    if (k !== 'puz') { for (var zi = 0; zi < 5 && $('pzBack'); zi++) { try { $('pzBack').click(); } catch (x) { break; } } }
    if (k === 'puz') {
      pg.style.display = 'none';
      if (window.lbNav) window.lbNav.close();
      window.nvPzAt = Date.now(); if (window.spPuzzles) window.spPuzzles(); else { pg.style.display = 'block'; soon('Masalalar', 'Yuklanmoqda…'); }
      return;
    }
    if (k === 'mn') {
      pg.style.display = 'none';
      if (window.lbNav) window.lbNav.close();
      if (window.mnOpen) window.mnOpen(); else { pg.style.display = 'block'; soon('Menyu', 'Yuklanmoqda…'); }
      return;
    }
    if (k === 'rk') {
      pg.style.display = 'none';
      if (window.lbNav) window.lbNav.close();
      if (window.rkOpen) window.rkOpen(); else { pg.style.display = 'block'; soon('Reyting', 'Yuklanmoqda…'); }
      return;
    }
    if (k === 'pl' || k === 't') {
      pg.style.display = 'none';
      if (window.lbNav) window.lbNav.open(k);
      return;
    }
    if (window.lbNav) window.lbNav.close();
    pg.style.display = 'block';
    if (k === 'pf') { if (window.nvProfile) window.nvProfile(pg); else soon('Profil', 'Yuklanmoqda…'); }
    else if (k === 'rk') soon('Reyting', 'Eng ko‘p g‘alaba qozonganlar jadvali tez orada.');
    else soon('Menyu', 'Qoidalar va sozlamalar tez orada.');
  };
  setInterval(function () {
    var inRoom = !!$('lbBack');
    bar.style.display = inRoom ? 'none' : 'flex';
    if (inRoom) { pg.style.display = 'none'; if (window.rkClose) window.rkClose(); if (window.mnClose) window.mnClose(); }
  }, 800);

  // ===== O'YNASH tugmasi va sahifasi =====
  var css2 = document.createElement('style');
  css2.textContent =
    '#nvPlayBtn{position:fixed;left:16px;right:16px;bottom:calc(68px + env(safe-area-inset-bottom));height:54px;border:0;border-radius:14px;background:linear-gradient(#7fb847,#5f9a2f);box-shadow:0 5px 0 #3f6f1c;color:#fff;font:800 22px system-ui,sans-serif;z-index:99997;display:none}' +
    '#nvPlay{position:fixed;left:0;right:0;top:0;bottom:60px;background:#12122b;color:#fff;z-index:99998;overflow:auto;padding:16px;display:none;font-family:system-ui,sans-serif}' +
    '#nvPlay .hd{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:800;margin-bottom:16px}' +
    '#nvPlay .hd button{background:none;border:0;color:#fff;font-size:26px}' +
    '#nvPlay .it{display:flex;align-items:center;gap:14px;width:100%;box-sizing:border-box;margin-bottom:12px;padding:16px;border:0;border-radius:14px;background:#1f2147;color:#fff;font-size:18px;font-weight:700;text-align:left}' +
    '#nvPlay .it span{font-size:26px}' +
    '#nvPlay .it.g{background:linear-gradient(#7fb847,#5f9a2f);box-shadow:0 4px 0 #3f6f1c}';
  document.head.appendChild(css2);
  var pb = document.createElement('button');
  pb.id = 'nvPlayBtn'; pb.textContent = '▶ O‘ynash';
  document.body.appendChild(pb);
  var po = document.createElement('div');
  po.id = 'nvPlay';
  document.body.appendChild(po);
  // ----- vaqt nazorati (chess.com uslubida): tepada tanlangan vaqt, bosilsa — tanlov oynasi
  var TCG = [
    ['⚡', 'Bullet', ['1+0', '1+1', '2+1']],
    ['🔥', 'Blits', ['3+0', '3+2', '5+0', '5+3']],
    ['⏱', 'Rapid', ['10+0', '10+5', '15+10', '30+0']]
  ];
  function tcName(tc) { var a = +String(tc).split('+')[0]; return a < 3 ? '⚡ Bullet' : a < 10 ? '🔥 Blits' : '⏱ Rapid'; }
  function tcLabel(tc) { var p = String(tc).split('+'); return p[1] === '0' ? p[0] + ' daq' : p[0] + ' + ' + p[1]; }
  var TC = '3+2'; try { var _s = localStorage.getItem('nvTc'); if (/^\d{1,2}\+\d{1,2}$/.test(_s || '')) TC = _s; } catch (x) {}
  function setTc(t) { TC = t; try { localStorage.setItem('nvTc', t); } catch (x) {} drawPlay(); }
  var css3 = document.createElement('style');
  css3.textContent =
    '#nvPlay .tcb{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;margin-bottom:12px;padding:16px;border:0;border-radius:14px;background:#1f2147;color:#fff;font:800 20px system-ui,sans-serif}' +
    '#nvPlay .tcb i{font-style:normal;margin-left:auto;opacity:.6}#nvPlay .tcb small{font-size:13px;opacity:.6;font-weight:600}' +
    '#nvPlay .go{width:100%;padding:18px;border:0;border-radius:14px;background:linear-gradient(#7fb847,#5f9a2f);box-shadow:0 5px 0 #3f6f1c;color:#fff;font:800 24px system-ui,sans-serif;margin-bottom:8px}' +
    '#nvPlay .go.on{background:linear-gradient(#f5a524,#e07b00);box-shadow:0 5px 0 #9a5300;font-size:19px}' +
    '#nvPlay .inf{text-align:center;font-size:13px;color:#a9acd6;margin:6px 0 16px;min-height:18px}' +
    '#nvTcS{position:fixed;inset:0;z-index:2147482400;background:#12122b;color:#fff;overflow:auto;padding:16px;font-family:system-ui,sans-serif}' +
    '#nvTcS .hd{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:800;margin-bottom:10px}#nvTcS .hd button{background:none;border:0;color:#fff;font-size:26px}' +
    '#nvTcS h4{margin:16px 0 8px;font-size:18px}#nvTcS .gr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
    '#nvTcS .gr button{padding:14px 4px;border:2px solid transparent;border-radius:12px;background:#1f2147;color:#fff;font:700 17px system-ui,sans-serif}#nvTcS .gr button.on{border-color:#7fb847}' +
    '#nvTcS .cu{background:#1a1b3d;border-radius:14px;padding:14px;margin-top:18px}#nvTcS .cu label{display:block;text-align:center;margin:8px 0 4px;color:#cfd2f5}' +
    '#nvTcS input[type=range]{width:100%;accent-color:#7fb847}#nvTcS .cu button{width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#2c2f66;color:#fff;font:700 17px system-ui,sans-serif}' +
    '#nvFrS{position:fixed;inset:0;z-index:2147482400;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;font-family:system-ui,sans-serif}' +
    '#nvFrS>div{width:100%;background:#141040;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box}' +
    '#nvFrS .it{display:flex;align-items:center;gap:14px;width:100%;box-sizing:border-box;margin-top:10px;padding:16px;border:0;border-radius:14px;background:#1f2147;color:#fff;font-size:17px;font-weight:700;text-align:left}#nvFrS .it span{font-size:24px}#nvFrS small{display:block;font-weight:500;opacity:.65;font-size:13px;margin-top:2px}';
  document.head.appendChild(css3);
  function st() { try { return window.lbPlay ? window.lbPlay.state() : null; } catch (x) { return null; } }
  function drawPlay() {
    var s = st() || {}, q = !!s.inQueue;
    var info = '';
    if (q) info = '⏳ ' + (s.tc || TC) + ' · raqib kutilmoqda…';
    else if (s.online) { var n = (s.seekers || {})[TC] || 0; info = '🟢 ' + s.online + ' o‘yinchi onlayn' + (n ? ' · ' + TC + ' da ' + n + ' kishi kutmoqda' : ''); }
    var html = '<div class="hd"><button id="nvPlayX">←</button>🎮 O‘ynash</div>' +
      '<button class="tcb" id="nvTcB">⏱ ' + tcLabel(TC) + ' <small>' + tcName(TC) + '</small><i>▾</i></button>' +
      '<button class="go' + (q ? ' on' : '') + '" id="nvGo">' + (q ? '⏳ Qidirilmoqda… (bekor qilish)' : '▶ O‘ynash') + '</button>' +
      '<div class="inf">' + info + '</div>' +
      '<button class="it" data-a="fr"><span>👥</span>Do‘st bilan o‘ynash</button>' +
      '<button class="it" data-a="ai"><span>🤖</span>Kompyuterga qarshi</button>' +
      '<button class="it" data-a="trn"><span>🏆</span>Turnirlar</button>' +
      '<button class="it" data-a="room"><span>🏠</span>Xona yaratish</button>' +
      (window.spVoice && window.spVoice.supported() ? '<button class="it" data-a="vb"><span>🎤</span>Ovozli bellashuv</button>' : '') +
      '<button class="it" data-a="pb"><span>⚔️</span>Masala jangi</button>' +
      '<button class="it" data-a="live"><span>📺</span>Jonli o‘yinlar</button>';
    if (html === drawPlay.last && $('nvGo')) return;
    drawPlay.last = html; po.innerHTML = html;
    $('nvPlayX').onclick = function () { po.style.display = 'none'; };
    $('nvTcB').onclick = tcSheet;
    $('nvGo').onclick = function () {
      if (!window.lbPlay) return clickText('Raqib qidirish');
      var s2 = st() || {};
      if (s2.inQueue) window.lbPlay.cancel(); else window.lbPlay.quick(TC);
      setTimeout(drawPlay, 400);
    };
  }
  function tcSheet() {
    var old = $('nvTcS'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'nvTcS';
    var p = TC.split('+'), h = '<div class="hd"><button data-x="1">←</button>Vaqt</div>';
    TCG.forEach(function (g) {
      h += '<h4>' + g[0] + ' ' + g[1] + '</h4><div class="gr">' + g[2].map(function (t) { return '<button data-t="' + t + '"' + (t === TC ? ' class="on"' : '') + '>' + tcLabel(t) + '</button>'; }).join('') + '</div>';
    });
    h += '<div class="cu"><h4 style="margin:0">⚙️ O‘zim tanlayman</h4>' +
      '<label>Boshlang‘ich vaqt: <b id="nvCuM">' + p[0] + '</b> daq</label><input type="range" id="nvCuA" min="1" max="60" value="' + p[0] + '">' +
      '<label>Har yurishga qo‘shimcha: <b id="nvCuS">' + p[1] + '</b> soniya</label><input type="range" id="nvCuB" min="0" max="30" value="' + p[1] + '">' +
      '<button id="nvCuOk">Tanlash</button></div>';
    d.innerHTML = h; document.body.appendChild(d);
    var A = d.querySelector('#nvCuA'), B = d.querySelector('#nvCuB');
    A.oninput = function () { d.querySelector('#nvCuM').textContent = A.value; };
    B.oninput = function () { d.querySelector('#nvCuS').textContent = B.value; };
    d.querySelector('#nvCuOk').onclick = function () { setTc(A.value + '+' + B.value); d.remove(); };
    d.onclick = function (e) {
      var b = e.target.closest('[data-t],[data-x]'); if (!b) return;
      if (b.getAttribute('data-t')) setTc(b.getAttribute('data-t'));
      d.remove();
    };
  }
  function friendSheet() {
    var old = $('nvFrS'); if (old) old.remove();
    var s = st() || {};
    var d = document.createElement('div'); d.id = 'nvFrS';
    d.innerHTML = '<div><div style="display:flex;align-items:center"><b style="font-size:20px">👥 Do‘st bilan o‘ynash</b><span data-x="1" style="margin-left:auto;font-size:24px;padding:4px 8px">✕</span></div>' +
      '<div style="margin-top:6px;color:#a9acd6;font-size:14px">⏱ Vaqt: ' + tcLabel(TC) + '</div>' +
      '<button class="it" data-f="link"><span>🔗</span><div>Havola yuborish<small>Telegram’da do‘stingizga yuboring — bosishi bilan o‘yin boshlanadi</small></div></button>' +
      '<button class="it" data-f="list"><span>🟢</span><div>Onlayn do‘stlar' + (s.friendsOnline ? ' (' + s.friendsOnline + ')' : '') + '<small>Ro‘yxatdan tanlab, o‘yinga chaqiring</small></div></button></div>';
    document.body.appendChild(d);
    d.onclick = function (e) {
      var b = e.target.closest('[data-f],[data-x]');
      if (e.target === d || (b && b.getAttribute('data-x'))) return d.remove();
      if (!b) return;
      var f = b.getAttribute('data-f'); d.remove(); po.style.display = 'none';
      if (f === 'link') { if (window.lbPlay) window.lbPlay.friend(TC); else if (window.lbFriend) window.lbFriend(); }
      else { if (window.lbNav) window.lbNav.open('pl'); setTimeout(function () { var c = $('hzCf'); if (c) c.click(); }, 300); }
    };
  }
  function voiceSheet() {
    var old = $('nvFrS'); if (old) old.remove();
    var s = st() || {}, n = (s.seekers || {})[TC + 'v'] || 0;
    var d = document.createElement('div'); d.id = 'nvFrS';
    d.innerHTML = '<div><div style="display:flex;align-items:center"><b style="font-size:20px">🎤 Ovozli bellashuv</b><span data-x="1" style="margin-left:auto;font-size:24px;padding:4px 8px">✕</span></div>' +
      '<div style="margin-top:8px;color:#cfd2f5;font-size:14px;line-height:1.45">Donalarni bosib bo‘lmaydi — har bir yurishni 🎤 tugmasini bosib <b>ovoz bilan</b> aytasiz (masalan: «c3 d4»).<br>❌ <b>Qoidaga zid yurish aytgan o‘yinchi darhol yutqazadi.</b><br>🤔 Tushunilmagan gap hisobga olinmaydi — qayta aytasiz.</div>' +
      '<div style="margin-top:6px;color:#a9acd6;font-size:14px">⏱ Vaqt: ' + tcLabel(TC) + (n ? ' · ' + n + ' kishi kutmoqda' : '') + '</div>' +
      '<button class="it" data-f="seek"><span>🔍</span><div>Raqib qidirish<small>Ovozli bellashuvni tanlagan o‘yinchi bilan</small></div></button>' +
      '<button class="it" data-f="link"><span>🔗</span><div>Do‘stga havola<small>Do‘stingiz bilan ovozli bellashuv</small></div></button>' +
      '<button class="it" data-f="help"><span>❔</span><div>Qanday aytiladi?<small>Ovozli buyruqlar ro‘yxati</small></div></button></div>';
    document.body.appendChild(d);
    d.onclick = function (e) {
      var b = e.target.closest('[data-f],[data-x]');
      if (e.target === d || (b && b.getAttribute('data-x'))) return d.remove();
      if (!b) return;
      var f = b.getAttribute('data-f'); d.remove();
      if (f === 'help') { if (window.spVoice) window.spVoice.help(); return; }
      if (!window.lbPlay) return;
      if (f === 'seek') { window.lbPlay.quick(TC, true); setTimeout(drawPlay, 400); }
      else { po.style.display = 'none'; window.lbPlay.friend(TC, true); }
    };
  }
  function clickText(label) {
    var all = document.querySelectorAll('button,div,a'), best = null;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('#nvPlay') || e.closest('#nvBar')) continue;
      var tx = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (tx.indexOf(label) >= 0 && tx.length < label.length + 40 && (!best || tx.length < best.n)) best = { e: e, n: tx.length };
    }
    if (best) { try { best.e.click(); } catch (x) {} }
  }
  function ldJs(src, cb) { var sc = document.createElement('script'); sc.src = src; sc.onload = cb; document.head.appendChild(sc); }
  pb.onclick = function () { drawPlay(); po.style.display = 'block'; };
  setInterval(function () { if (po.style.display === 'block') drawPlay(); }, 1500);
  po.onclick = function (e) {
    var b = e.target.closest('.it'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'fr') return friendSheet();
    if (a === 'vb') return voiceSheet();
    po.style.display = 'none';
    if (a === 'room') { if (window.lbNav) window.lbNav.open('pl'); setTimeout(function () { var m = $('hzMkR'); if (m) m.click(); }, 300); }
    else if (a === 'trn') { window.nvK = 't'; if (window.lbNav) window.lbNav.open('t'); }
    else if (a === 'ai') { if (window.lbNav) { try { window.lbNav.close(); } catch (x) {} } if (window.aiShow) window.aiShow('play'); }
    else if (a === 'pb') { var go = function () { window.spBattle({}); }; if (window.spBattle) go(); else ldJs('/battleview.js?v=5', go); }
    else if (a === 'live') { if (window.mnA) window.mnA('@live'); }
  };
  window.nvK = window.nvK || 'pl'; mark('pl');
  setInterval(function () {
    var inRoom = !!$('lbBack');
    var on = !inRoom && window.nvK === 'pl' && pg.style.display !== 'block';
    pb.style.display = on ? 'block' : 'none';
    if (!on) po.style.display = 'none';
  }, 400);

  // ===== nvFlat: turnir/lobbi sahifasini soddalashtirish =====
  var cf = document.createElement('style');
  cf.id = 'nvFlat';
  cf.textContent =
    '#lbPanel{background:#12122b!important}' +
    '#lbPanel::before{display:none!important}' +
    '#lbPanel .lbhb{animation:none!important;box-shadow:none!important;background:#1b1c3d!important;border:1px solid #2a2c55!important;border-radius:14px!important;padding:12px 14px!important;margin-bottom:10px}' +
    '#lbPanel .lbhb h3{font-size:17px!important;margin:6px 0 4px!important}' +
    '#lbPanel .lbhb p{display:none!important}' +
    '#lbPanel .lbhb .tg{background:#2a2c55!important;color:#aab!important;font-size:10px!important}' +
    '#lbPanel .lbhb button{background:#4f5bff!important;color:#fff!important;border-radius:10px!important;padding:8px 14px!important;font-size:14px!important;box-shadow:none!important}' +
    '#lbPanel .lbdr{display:none!important}' +
    '#lbPanel .tabs button{box-shadow:none!important}';
  document.head.appendChild(cf);

  // ===== nvFlat2: yaltirash va harakatlanuvchi effektlarni o'chirish =====
  var cf2 = document.createElement('style');
  cf2.id = 'nvFlat2';
  cf2.textContent =
    '#lbPanel *,#hzHero *{animation:none!important;transition:none!important;text-shadow:none!important}' +
    '#lbPanel *::before,#lbPanel *::after,#hzHero *::before,#hzHero *::after{display:none!important;animation:none!important;content:none!important}' +
    '#lbPanel,#hzHero{background-image:none!important}' +
    '#lbPanel [style*="gradient"],#hzHero [style*="gradient"]{background-size:auto!important}' +
    '#lbPanel .lbhb,#lbPanel .lbc,#lbPanel .lbcl,#hzHero>*{box-shadow:none!important;filter:none!important}';
  document.head.appendChild(cf2);

  var cf3 = document.createElement('style');
  cf3.id = 'nvFlat3';
  cf3.textContent =
    '#lbPanel div[onclick*="lbTPlus"]{display:none!important}' +
    '#lbPanel div:has(>div[onclick*="lbTPlus"]){display:none!important}';
  document.head.appendChild(cf3);

  // ===== nvFlat4: Turnir ko'rinishida ortiqcha kartalarni yashirish =====
  var cf4 = document.createElement('style');
  cf4.id = 'nvFlat4';
  cf4.textContent =
    'body.nvT #hzHero,body.nvT #hzMe,body.nvT #promoBar,body.nvT #lbPanel .lbhb,body.nvT #lbPanel .lbdr{display:none!important}';
  document.head.appendChild(cf4);
  setInterval(function () {
    document.body.classList.toggle('nvT', window.nvK === 't');
  }, 300);

  // ===== nvExit: o'yin xonasida tepada chiqish tugmasi =====
  var ex = document.createElement('button');
  ex.id = 'nvExit'; ex.textContent = 'Chiqish';
  ex.style.cssText = 'position:fixed;right:10px;top:28px;z-index:99990;padding:6px 14px;border:1px solid #3a3d7a;border-radius:12px;background:#2a2c5e;color:#fff;font-size:15px;font-weight:600;line-height:1.2;display:none';
  document.body.appendChild(ex);
  ex.onclick = function () {
    var z = $('rcZal');
    if (z) z.click();
  };
  setInterval(function () {
    var z = $('rcZal');
    ex.style.display = 'none';
  }, 400);

  // ===== nvBots: botlar kartasi (tepada) + botlar oynasi =====
  var cb = document.createElement('style');
  cb.id = 'nvBotCss';
  cb.textContent =
    '#lbPl .lbp:has(img[src*="/api/av/bot"]),#lbPl .lbp:has([data-a="ch"][data-id^="bot"]){display:none!important}' +
    '#nvBotRow{order:2;display:flex;align-items:center;gap:14px;margin:0 0 10px;padding:12px 14px;border-radius:16px;background:#1b1c3d;border:1px solid #2a2c55;color:#fff;cursor:pointer}' +
    '#nvBotRow .st{display:flex;flex:none}' +
    '#nvBotRow .st img,#nvBotRow .st i{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #1b1c3d;margin-left:-14px;background:#2a2c55;display:flex;align-items:center;justify-content:center;font-style:normal}' +
    '#nvBotRow .st :first-child{margin-left:0}' +
    '#nvBotRow b{display:block;font-size:17px}#nvBotRow small{opacity:.7;font-size:13px}#nvBotRow .ar{margin-left:auto;font-size:26px;opacity:.7}' +
    '#nvBots{position:fixed;left:0;right:0;top:0;bottom:60px;z-index:99998;background:rgba(0,0,0,.55);display:none;align-items:flex-end}' +
    '#nvBots .sh{width:100%;max-height:80%;overflow:auto;background:#12122b;border-radius:20px 20px 0 0;padding:14px 16px 20px;color:#fff;font-family:system-ui,sans-serif}' +
    '#nvBots .hd{display:flex;align-items:center;font-size:20px;font-weight:800;margin-bottom:8px}#nvBots .hd button{margin-left:auto;background:none;border:0;color:#fff;font-size:24px}' +
    '#nvBots .r{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #22244a}' +
    '#nvBots .r img,#nvBots .r i{width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none;background:#2a2c55;display:flex;align-items:center;justify-content:center;font-style:normal}' +
    '#nvBots .r .n{flex:1;min-width:0}#nvBots .r .n b{display:block;font-size:17px}#nvBots .r .n small{opacity:.7}' +
    '#nvBots .r .n em{color:#ff3b3b;font-style:normal}' +
    '#nvBots .r button{background:linear-gradient(#7fb847,#5f9a2f);box-shadow:0 3px 0 #3f6f1c;color:#fff;border:0;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:700}';
  document.head.appendChild(cb);

  var sheet = document.createElement('div');
  sheet.id = 'nvBots';
  sheet.innerHTML = '<div class="sh"><div class="hd">🤖 Botlar bilan o‘ynash<button id="nvBotsX">✕</button></div><div id="nvBotsL"></div></div>';
  document.body.appendChild(sheet);
  sheet.onclick = function (e) { if (e.target === sheet) sheet.style.display = 'none'; };
  $('nvBotsX').onclick = function () { sheet.style.display = 'none'; };

  function botRows() {
    var out = [], seen = {};
    [].forEach.call(document.querySelectorAll('#lbPl .lbp'), function (row) {
      var im = row.querySelector('img[src*="/api/av/bot"]'), bt = row.querySelector('[data-a="ch"][data-id^="bot"]');
      var uid = bt ? bt.getAttribute('data-id') : (im ? decodeURIComponent((im.getAttribute('src').split('/api/av/')[1] || '')) : '');
      if (!uid || seen[uid]) return; seen[uid] = 1;
      var nm = row.querySelector('.lbinf b'), sm = row.querySelector('.lbinf small');
      out.push({ uid: uid, name: nm ? nm.textContent.replace(/\s+/g, ' ').trim() : uid, info: sm ? sm.textContent.split('·')[0].trim() : '', busy: !bt });
    });
    out.sort(function (a, b) { return (parseInt((a.info.match(/\d+/) || [0])[0], 10)) - (parseInt((b.info.match(/\d+/) || [0])[0], 10)); });
    return out;
  }
  function avEl(uid) {   // o'ram (display:contents) — rasm yuklanmasa ham bosish ishlaydi
    var w = document.createElement('span'); w.style.display = 'contents';
    var im = document.createElement('img');
    im.src = '/api/av/' + encodeURIComponent(uid);
    im.onerror = function () { var i = document.createElement('i'); i.textContent = uid === 'bot_monster' ? '👹' : uid === 'bot_terminator' ? '🦾' : uid === 'bot_kingkong' ? '🦍' : '🤖'; im.replaceWith(i); };
    w.appendChild(im);
    return w;
  }
  // ===== bot bilan o'yin sozlamasi (lidraughts'dagi "Вызвать на игру" kabi)
  var BM = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 45, 60, 90, 120, 180];
  var BI = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 45, 60];
  function mTxt(m) { return m === 0.25 ? '¼' : m === 0.5 ? '½' : m === 0.75 ? '¾' : m === 1.5 ? '1½' : String(m); }
  function botSetup(b) {
    var cfg = { t: 'inf', m: 3, i: 2, pos: 'std', c: 'white' };
    try { var sv = JSON.parse(localStorage.getItem('spBotCfg') || 'null'); if (sv) for (var k in cfg) if (sv[k] !== undefined) cfg[k] = sv[k]; } catch (e) {}
    if (BM.indexOf(cfg.m) < 0) cfg.m = 3; if (BI.indexOf(cfg.i) < 0) cfg.i = 2;
    try { var tw = window.Telegram && window.Telegram.WebApp; if (tw && tw.disableVerticalSwipes) tw.disableVerticalSwipes(); } catch (e) {}
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overscroll-behavior:none;-webkit-tap-highlight-color:transparent';
    ov.innerHTML = '<style>#spBS *{-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}' +
      '#spBS .bsg{display:flex;border-radius:12px;overflow:hidden;margin:6px 0 4px}#spBS .bsg b{flex:1;text-align:center;padding:11px 4px;background:#26344f;cursor:pointer;font-weight:600}#spBS .bsg b.on{background:#5a9a2e;color:#fff}' +
      '#spBS .sl{display:flex;align-items:center;gap:10px;margin-top:4px}#spBS .pm{width:40px;height:40px;flex:none;border-radius:50%;background:#26344f;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;cursor:pointer}' +
      '#spBS .tr{flex:1;height:40px;position:relative;touch-action:none;cursor:pointer}#spBS .tr i{position:absolute;left:0;right:0;top:17px;height:6px;border-radius:3px;background:#3a4560}#spBS .tr u{position:absolute;left:0;top:17px;height:6px;border-radius:3px;background:#5cb85c}' +
      '#spBS .tr s{position:absolute;top:8px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:#7bd36b;box-shadow:0 2px 6px #0008}' +
      '#spBS .lb{font-size:15px;margin-top:12px;opacity:.9}#spBS .lb b{color:#ffd86b;font-size:17px}' +
      '#spBS .go{display:block;width:100%;margin-top:16px;padding:15px;border:0;border-radius:14px;background:linear-gradient(90deg,#2e9d3a,#5cb85c);color:#fff;font-size:21px;font-weight:800;letter-spacing:1px;box-shadow:0 4px 14px #0007;cursor:pointer}</style>' +
      '<div id="spBS" style="width:100%;max-width:420px;background:#101a2e;color:#fff;border-radius:18px;padding:18px;box-sizing:border-box;font:16px system-ui,sans-serif;max-height:92vh;overflow-x:hidden;overflow-y:auto;overscroll-behavior:none;touch-action:pan-y">' +
      '<div style="display:flex;align-items:center"><b style="flex:1;font-size:19px">⚔️ Bot bilan o‘ynash</b><span data-x style="font-size:24px;padding:2px 8px;cursor:pointer">✕</span></div>' +
      '<div style="text-align:center;margin:8px 0 4px;font-weight:700;color:#c98bff">' + b.name.replace(/[<>]/g, '') + '</div>' +
      '<div class="lb">⏱ Vaqt nazorati</div><div class="bsg" data-g="t"><b data-v="inf">∞ Vaqtsiz</b><b data-v="clk">⏱ Vaqtli</b></div>' +
      '<div data-clk><div class="lb">Daqiqa: <b data-mv></b></div><div class="sl" data-s="m"><span class="pm" data-d="-1">−</span><div class="tr"><i></i><u></u><s></s></div><span class="pm" data-d="1">+</span></div>' +
      '<div class="lb">Har yurishga qo‘shimcha soniya: <b data-iv></b></div><div class="sl" data-s="i"><span class="pm" data-d="-1">−</span><div class="tr"><i></i><u></u><s></s></div><span class="pm" data-d="1">+</span></div></div>' +
      '<div class="lb">📖 Boshlang‘ich holat</div><div class="bsg" data-g="pos"><b data-v="std">📋 Standart</b><b data-v="idf">🎲 IDF 780</b></div>' +
      '<div class="lb">🎨 Rangingiz</div><div class="bsg" data-g="c"><b data-v="white">⚪ Oq</b><b data-v="random">🎲 Tasodifiy</b><b data-v="black">⚫ Qora</b></div>' +
      '<button class="go" data-go>▶ O‘YNASH</button></div>';
    document.body.appendChild(ov);
    var q = function (x) { return ov.querySelector(x); };
    var L = { m: BM, i: BI };
    function upd() {
      q('[data-mv]').textContent = mTxt(cfg.m); q('[data-iv]').textContent = cfg.i;
      q('[data-clk]').style.display = cfg.t === 'clk' ? '' : 'none';
      [].forEach.call(ov.querySelectorAll('.bsg'), function (g) { var k = g.getAttribute('data-g'); [].forEach.call(g.children, function (x) { x.className = x.getAttribute('data-v') === cfg[k] ? 'on' : ''; }); });
      ['m', 'i'].forEach(function (k) {
        var pc = L[k].indexOf(cfg[k]) / (L[k].length - 1) * 100, sl = q('[data-s="' + k + '"]');
        sl.querySelector('u').style.width = pc + '%'; sl.querySelector('s').style.left = pc + '%';
      });
    }
    ['m', 'i'].forEach(function (k) {
      var sl = q('[data-s="' + k + '"]'), tr = sl.querySelector('.tr'), drag = false;
      function at(e) {
        var r = tr.getBoundingClientRect(), x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        var v = L[k][Math.round(x * (L[k].length - 1))];
        if (v !== cfg[k]) { cfg[k] = v; upd(); }
      }
      tr.addEventListener('pointerdown', function (e) { drag = true; try { tr.setPointerCapture(e.pointerId); } catch (x) {} at(e); e.preventDefault(); });
      tr.addEventListener('pointermove', function (e) { if (drag) { at(e); e.preventDefault(); } });
      tr.addEventListener('pointerup', function () { drag = false; });
      tr.addEventListener('pointercancel', function () { drag = false; });
      [].forEach.call(sl.querySelectorAll('.pm'), function (pb) {
        pb.onclick = function () { var j = L[k].indexOf(cfg[k]) + (+pb.getAttribute('data-d')); if (j >= 0 && j < L[k].length) { cfg[k] = L[k][j]; upd(); } };
      });
    });
    [].forEach.call(ov.querySelectorAll('.bsg b'), function (x) { x.onclick = function () { cfg[x.parentNode.getAttribute('data-g')] = x.getAttribute('data-v'); upd(); }; });
    q('[data-x]').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    q('[data-go]').onclick = function () {
      try { localStorage.setItem('spBotCfg', JSON.stringify(cfg)); } catch (e) {}
      var real = document.querySelector('#lbPl [data-a="ch"][data-id="' + b.uid + '"]');
      if (!real) { alert('Bot hozir band, birozdan keyin urinib ko‘ring'); return; }
      window.__botTc = cfg.t === 'clk' ? cfg.m + '+' + cfg.i : '∞';
      window.__botColor = cfg.c; window.__botPos = cfg.pos;
      ov.remove(); real.click();
    };
    upd();
  }
  window.spBotSetup = botSetup;
  function openBots() {
    var L = $('nvBotsL'); L.innerHTML = '';
    var rows = botRows();
    if (!rows.length) L.innerHTML = '<div style="padding:18px;opacity:.7">Botlar yuklanmoqda…</div>';
    rows.forEach(function (b) {
      var r = document.createElement('div'); r.className = 'r';
      var av = avEl(b.uid); av.style.cursor = 'pointer';
      av.onclick = function (e) { if (window.spBotEdit && window.spBotEdit(b.uid)) { e.stopPropagation(); sheet.style.display = 'none'; } };   // admin: rasm/nomni o'zgartirish
      r.appendChild(av);
      var n = document.createElement('div'); n.className = 'n';
      var nb = document.createElement('b'), parts = b.name.split(/\s+BOT\s*$/i);
      nb.textContent = parts[0] + ' ';
      var em = document.createElement('em'); em.textContent = 'BOT'; nb.appendChild(em);
      var sm = document.createElement('small'); sm.textContent = b.info + (b.busy ? ' · band' : '');
      n.appendChild(nb); n.appendChild(sm); r.appendChild(n);
      var bt = document.createElement('button'); bt.textContent = 'O‘ynash'; bt.disabled = b.busy; if (b.busy) bt.style.opacity = '.5';
      bt.onclick = function () { sheet.style.display = 'none'; botSetup(b); };
      r.appendChild(bt); L.appendChild(r);
    });
    sheet.style.display = 'flex';
  }
  setInterval(function () {
    var hero = $('hzHero');
    if (!hero) { sheet.style.display = sheet.style.display === 'flex' && window.nvK !== 'pl' ? 'none' : sheet.style.display; return; }
    if (!$('nvKK')) {   // 🦍 King Kong — tez kunda (premyera e'loni)
      if (!$('nvKKcss')) { var kc = document.createElement('style'); kc.id = 'nvKKcss'; kc.textContent =
        '#nvKK{order:-1;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:14px;border-radius:18px;color:#fff;cursor:pointer;' +
        'background:linear-gradient(120deg,#1a0d05,#5a2a0c 45%,#8a3f10 70%,#1a0d05);box-shadow:inset 0 0 0 1.5px #ffb347,0 0 22px rgba(255,140,40,.35)}' +
        '#nvKK .kf{font-size:46px;flex:none;filter:drop-shadow(0 0 10px #ff8c28);animation:nvKKp 1.6s ease-in-out infinite}' +
        '#nvKK small{display:inline-block;background:#ff8c28;color:#1a0d05;font-weight:900;font-size:11px;letter-spacing:1px;padding:2px 8px;border-radius:8px}' +
        '#nvKK b{display:block;font-size:19px;margin:4px 0 2px}#nvKK p{margin:0;font-size:13px;opacity:.85;line-height:1.3}' +
        '#nvKK:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform:skewX(-20deg);animation:nvKKs 3.2s infinite}' +
        '@keyframes nvKKp{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}@keyframes nvKKs{0%{left:-60%}60%,100%{left:130%}}';
        document.head.appendChild(kc); }
      var kk = document.createElement('div'); kk.id = 'nvKK';
      kk.innerHTML = '<span class="kf">🦍</span><div><small>TEZ KUNDA</small><b>King Kong BOT</b><p>Eng kuchli bot keladi: Monster va Terminatordan ham kuchli. Siz o‘ylayotganda ham o‘ylaydi!</p></div>';
      kk.onclick = function () { var t = window.Telegram && window.Telegram.WebApp; var m = '🦍 King Kong BOT tez kunda! Uni birinchilardan bo‘lib sinab ko‘ring — yutganlarga 5000 🪙.'; try { if (t && t.showAlert) t.showAlert(m); else alert(m); } catch (e) { alert(m); } };
      hero.insertBefore(kk, hero.firstChild);
    }
    if (!window.__mmSP) { window.__mmSP = 1; try { var _sp = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param; if (/^mm_/i.test(_sp || '') && !window.spMemori) { var _ms = document.createElement('script'); _ms.src = '/memori.js?v=6'; document.head.appendChild(_ms); } } catch (e) {} }
    if (!$('nvMemRow') && $('nvBotRow')) {   // 🃏 Memori — bosh sahifadan tez kirish
      var mr = document.createElement('div'); mr.id = 'nvMemRow';
      mr.style.cssText = 'order:2;display:flex;align-items:center;gap:14px;margin:0 0 10px;padding:12px 14px;border-radius:16px;background:linear-gradient(110deg,#0a3b6b,#0f6fb0);border:1px solid #2f8fd6;color:#fff;cursor:pointer';
      mr.innerHTML = '<span style="font-size:34px;flex:none">🧠</span><div style="flex:1"><b style="display:block;font-size:17px">Xotira</b><small style="opacity:.8;font-size:13px">Juftliklarni toping · bot yoki do‘st bilan</small></div><span style="margin-left:auto;font-size:26px;opacity:.7">›</span>';
      mr.onclick = function () { if (window.spMemori) window.spMemori(); else { var sm = document.createElement('script'); sm.src = '/memori.js?v=6'; sm.onload = function () { window.spMemori(); }; document.head.appendChild(sm); } };
      var br = $('nvBotRow'); br.parentNode.insertBefore(mr, br.nextSibling);
    }
    if ($('nvBotRow')) return;
    var row = document.createElement('div'); row.id = 'nvBotRow';
    row.innerHTML = '<div class="st"><img src="/api/av/bot_terminator" onerror="this.outerHTML=\'<i>🦾</i>\'"><img src="/api/av/bot_monster" onerror="this.outerHTML=\'<i>👹</i>\'"><img src="/api/av/bot_champ" onerror="this.outerHTML=\'<i>🤖</i>\'"><img src="/api/av/bot_gm" onerror="this.outerHTML=\'<i>🤖</i>\'"><img src="/api/av/bot_pro" onerror="this.outerHTML=\'<i>🤖</i>\'"></div><div><b>Botlar bilan o‘ynash</b><small>8 ta bot · Shogird dan Terminator gacha</small></div><span class="ar">›</span>';
    row.onclick = openBots;
    var ref = $('hzRow2') || $('hzDaily');
    if (ref && ref.parentNode === hero) hero.insertBefore(row, ref); else hero.appendChild(row);
  }, 600);

  // ===== nvPzSync: masalalar oynasi bilan panel holatini moslash =====
  setInterval(function () {
    var pb = $('pzBack'), open = !!(pb && pb.offsetParent !== null);
    if (open && window.nvK !== 'puz') { window.nvK = 'puz'; mark('puz'); }
    else if (!open && window.nvK === 'puz' && Date.now() - (window.nvPzAt || 0) > 3500 && pg.style.display !== 'block') { window.nvK = 'pl'; mark('pl'); }
  }, 400);
})();
