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
  window.nvProfile = function (pg) {
    var u = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var name = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || 'Mehmon';
    var av = u.photo_url
      ? '<img class="pf-av" src="' + esc(u.photo_url) + '">'
      : '<div class="pf-av">👤</div>';
    pg.innerHTML = '<div class="pf-hero">' + av +
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
      function setAv(src) {
        var old = document.querySelector('.pf-av'); if (!old) return;
        var im = document.createElement('img'); im.className = 'pf-av'; im.src = src;
        old.parentNode.replaceChild(im, old);
      }
      if (d.avatar) setAv(d.avatar);
      var bt = document.createElement('button');
      bt.id = 'pfUp'; bt.textContent = '📷 Rasm qo‘yish';
      bt.style.cssText = 'display:block;margin:10px auto 0;border:0;border-radius:14px;padding:8px 16px;background:#ffffff33;color:#fff;font-size:13px';
      var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
      bt.onclick = function () { fi.click(); };
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
                else bt.textContent = '⚠️ Xatolik, qayta urinib ko‘ring';
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
      var h = '<div class="pf-grid">' +
        card('📈', 'linear-gradient(135deg,#22c1ff,#0be3ff)', d.elo, 'ELO') +
        card('⭐', 'linear-gradient(135deg,#fbbf24,#f59e0b)', d.bestStreak, 'Eng yaxshi seriya') +
        card('💎', 'linear-gradient(135deg,#ff6fa5,#ff8fc0)', d.diamonds, 'Olmos') +
        card('🏆', 'linear-gradient(135deg,#fcd34d,#f9a77a)', d.wins, 'G‘alaba') +
        card('✖️', 'linear-gradient(135deg,#ff2e63,#ff6b6b)', d.losses, 'Mag‘lub') +
        card('🤝', 'linear-gradient(135deg,#ff5a00,#fbbf24)', d.draws, 'Durang') +
        card('🎮', 'linear-gradient(135deg,#22e6a8,#34f5c5)', d.games, 'Jami o‘yinlar') +
        card('📊', 'linear-gradient(135deg,#8e3bf0,#c05cf0)', pct + '%', 'G‘alaba foizi') +
        card('🔥', 'linear-gradient(135deg,#ff7a18,#ffb347)', d.streak, 'Joriy seriya') +
        '</div>';
      h += '<div class="pf-box"><h3>Oxirgi o‘yinlar</h3>';
      if (!d.hist.length) h += '<div class="pf-l">Hali o‘yin yo‘q</div>';
      d.hist.forEach(function (x) {
        var r = x.r === 'w' ? '✅ G‘alaba' : x.r === 'l' ? '❌ Mag‘lub' : '🤝 Durang';
        h += '<div class="pf-row"><span>' + r + ' · ' + esc(x.opp) + '</span><span class="pf-l">' + ago(x.t) + '</span></div>';
      });
      h += '</div><div class="pf-box"><h3>Olmos tarixi</h3>';
      if (!d.log.length) h += '<div class="pf-l">Hali yozuv yo‘q</div>';
      d.log.forEach(function (x) {
        h += '<div class="pf-row"><span>' + (x.d > 0 ? '+' : '') + x.d + ' 💎</span><span class="pf-l">' + esc(x.why) + ' · ' + ago(x.t) + '</span></div>';
      });
      h += '</div><button class="pf-bt" id="pfDaily" disabled>🎁 Kunlik bonus</button><div id="pfMsg" class="pf-l" style="margin:8px 0 20px;text-align:center"></div>';
      $('pfBody').innerHTML = h;
      api('/api/balance').then(function (b) {
        if (b.error) return;
        $('pfDaily').disabled = !b.canClaimDaily;
        $('pfDaily').textContent = b.canClaimDaily ? '🎁 Kunlik bonus +20' : '✅ Bonus olingan';
      });
      $('pfDaily').onclick = function () {
        api('/api/daily', 'POST').then(function (r) {
          $('pfMsg').textContent = r.ok ? '+' + r.amount + ' 💎 olindi' : 'Bugun olingan';
          window.nvProfile(pg);
        });
      };
    }).catch(function () { $('pfBody').innerHTML = '<div class="pf-box">Server bilan aloqa yo‘q</div>'; });
  };
})();
