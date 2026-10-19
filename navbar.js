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
        $('nvDaily').textContent = d.canClaimDaily ? '🎁 Kunlik bonus +20' : '✅ Bonus olingan';
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
  po.innerHTML = '<div class="hd"><button id="nvPlayX">←</button>🎮 O‘ynash</div>' +
    '<button class="it g" data-a="seek"><span>🔍</span>Raqib qidirish</button>' +
    '<button class="it" data-a="room"><span>🏠</span>Xona yaratish</button>' +
    '<button class="it" data-a="trn"><span>🏆</span>Turnirlar</button>' +
    '<button class="it" data-a="ai"><span>🤖</span>Kompyuterga qarshi</button>';
  document.body.appendChild(po);
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
  pb.onclick = function () { po.style.display = 'block'; };
  $('nvPlayX').onclick = function () { po.style.display = 'none'; };
  po.onclick = function (e) {
    var b = e.target.closest('.it'); if (!b) return;
    var a = b.getAttribute('data-a');
    po.style.display = 'none';
    if (a === 'seek') clickText('Raqib qidirish');
    else if (a === 'room') clickText('Xona yaratish');
    else if (a === 'trn') { window.nvK = 't'; if (window.lbNav) window.lbNav.open('t'); }
    else if (a === 'ai') { if (window.lbNav) { try { window.lbNav.close(); } catch (x) {} } if (window.aiShow) window.aiShow('play'); }
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
  ex.id = 'nvExit'; ex.textContent = '🚪 Chiqish';
  ex.style.cssText = 'position:fixed;right:10px;top:28px;z-index:99990;padding:6px 14px;border:1px solid #3a3d7a;border-radius:12px;background:#2a2c5e;color:#fff;font-size:15px;font-weight:600;line-height:1.2;display:none';
  document.body.appendChild(ex);
  ex.onclick = function () {
    var z = $('rcZal');
    if (z) z.click();
  };
  setInterval(function () {
    var z = $('rcZal');
    ex.style.display = (z && z.offsetParent !== null) ? 'block' : 'none';
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
  function avEl(uid) {
    var im = document.createElement('img');
    im.src = '/api/av/' + encodeURIComponent(uid);
    im.onerror = function () { var i = document.createElement('i'); i.textContent = '🤖'; im.replaceWith(i); };
    return im;
  }
  function openBots() {
    var L = $('nvBotsL'); L.innerHTML = '';
    var rows = botRows();
    if (!rows.length) L.innerHTML = '<div style="padding:18px;opacity:.7">Botlar yuklanmoqda…</div>';
    rows.forEach(function (b) {
      var r = document.createElement('div'); r.className = 'r';
      r.appendChild(avEl(b.uid));
      var n = document.createElement('div'); n.className = 'n';
      var nb = document.createElement('b'), parts = b.name.split(/\s+BOT\s*$/i);
      nb.textContent = parts[0] + ' ';
      var em = document.createElement('em'); em.textContent = 'BOT'; nb.appendChild(em);
      var sm = document.createElement('small'); sm.textContent = b.info + (b.busy ? ' · band' : '');
      n.appendChild(nb); n.appendChild(sm); r.appendChild(n);
      var bt = document.createElement('button'); bt.textContent = 'O‘ynash'; bt.disabled = b.busy; if (b.busy) bt.style.opacity = '.5';
      bt.onclick = function () {
        var real = document.querySelector('#lbPl [data-a="ch"][data-id="' + b.uid + '"]');
        sheet.style.display = 'none';
        if (real) real.click();
      };
      r.appendChild(bt); L.appendChild(r);
    });
    sheet.style.display = 'flex';
  }
  setInterval(function () {
    var hero = $('hzHero');
    if (!hero) { sheet.style.display = sheet.style.display === 'flex' && window.nvK !== 'pl' ? 'none' : sheet.style.display; return; }
    if ($('nvBotRow')) return;
    var row = document.createElement('div'); row.id = 'nvBotRow';
    row.innerHTML = '<div class="st"><img src="/api/av/bot_champ" onerror="this.outerHTML=\'<i>🤖</i>\'"><img src="/api/av/bot_gm" onerror="this.outerHTML=\'<i>🤖</i>\'"><img src="/api/av/bot_pro" onerror="this.outerHTML=\'<i>🤖</i>\'"></div><div><b>Botlar bilan o‘ynash</b><small>6 ta bot · Shogird dan Legend gacha</small></div><span class="ar">›</span>';
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
