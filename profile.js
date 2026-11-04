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
          var rk = $('pfRank'); if (rk && !document.getElementById('pfLk')) { var lk = document.createElement('div'); lk.id = 'pfLk'; lk.className = 'pf-bd'; lk.style.marginRight = '6px'; lk.textContent = '❤️ ' + S.likes; rk.parentNode.insertBefore(lk, rk); }
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
