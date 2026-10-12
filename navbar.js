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
  var items = [['pf', '👤', 'Profil'], ['pl', '🎮', 'O‘yin'], ['t', '🏆', 'Turnir'], ['rk', '📊', 'Reyting'], ['mn', '☰', 'Menyu']];
  bar.innerHTML = items.map(function (i) {
    return '<button data-k="' + i[0] + '"><span>' + i[1] + '</span>' + i[2] + '</button>';
  }).join('');
  document.body.appendChild(bar);
  var pg = document.createElement('div');
  pg.id = 'nvPg';
  document.body.appendChild(pg);

  function mark(k) {
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
      '<div id="nvBal" style="font-size:28px">💎 …</div>' +
      '<button class="b" id="nvDaily" style="margin-top:10px" disabled>🎁 Kunlik bonus</button>' +
      '<div id="nvMsg" class="m" style="margin-top:8px"></div></div>';
    $('nvName').textContent = name;
    if (!initData) {
      $('nvMsg').textContent = 'Balans uchun Telegram orqali kiring.';
      $('nvBal').textContent = '💎 —';
      return;
    }
    function load() {
      api('/api/balance').then(function (d) {
        if (d.error) { $('nvBal').textContent = '💎 —'; return; }
        $('nvBal').textContent = '💎 ' + d.diamonds;
        $('nvDaily').disabled = !d.canClaimDaily;
        $('nvDaily').textContent = d.canClaimDaily ? '🎁 Kunlik bonus +20' : '✅ Bonus olingan';
      }).catch(function () { $('nvMsg').textContent = 'Server bilan aloqa yo‘q'; });
    }
    $('nvDaily').onclick = function () {
      api('/api/daily', 'POST').then(function (d) {
        $('nvMsg').textContent = d.ok ? '+' + d.amount + ' 💎 olindi' : 'Bugun olingan';
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
})();
