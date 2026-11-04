/* SOCIALVIEW — 📸 Instagram'da ulash, 🔐 login va parol. window.spSocial.ig() / .pass() */
;(function () {
  if (window.spSocial) return;
  var tg = window.Telegram && window.Telegram.WebApp, initData = (tg && tg.initData) || '';
  var APP = function () { return window.TG_APP_LINK || 'https://t.me/DraughtsPRObot/play'; };
  function myId() { try { return String(tg.initDataUnsafe.user.id); } catch (e) { return ''; } }
  function link() { return APP() + '?startapp=ref_' + myId(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(p, body) { return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); }); }
  function copy(t, el) { var ok = function () { if (el) { var o = el.innerHTML; el.innerHTML = '✅'; setTimeout(function () { el.innerHTML = o; }, 1500); } }; try { navigator.clipboard.writeText(t).then(ok, function () { prompt('Nusxa oling:', t); }); } catch (e) { prompt('Nusxa oling:', t); } }
  function css() {
    if (document.getElementById('scCss')) return;
    var s = document.createElement('style'); s.id = 'scCss';
    s.textContent = '#scOv{position:fixed;inset:0;z-index:100070;background:rgba(5,4,20,.7);display:flex;align-items:flex-end;justify-content:center}' +
      '#scOv .bx{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:#141236;color:#fff;border-radius:24px 24px 0 0;padding:16px 16px calc(24px + env(safe-area-inset-bottom,0px));box-sizing:border-box;font-family:system-ui,Roboto,sans-serif}' +
      '#scOv .hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}#scOv .hd b{flex:1;font-size:20px}#scOv .x{border:0;background:#2b2475;color:#fff;border-radius:10px;width:36px;height:36px;font-size:16px}' +
      '#scOv .tabs{display:flex;background:#0d0b2a;border-radius:14px;padding:4px;margin-bottom:12px}#scOv .tabs button{flex:1;border:0;background:transparent;color:#9d97e0;padding:10px;border-radius:10px;font-size:15px;font-weight:700}#scOv .tabs button.on{background:#2b2475;color:#fff}' +
      '#scOv .note{background:#2a1f4f;border-radius:12px;padding:10px 12px;font-size:14px;margin-bottom:12px;line-height:1.45}#scOv h4{margin:14px 0 8px;font-size:16px}' +
      '#scOv .imgs{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px}#scOv .imgs img{width:130px;height:163px;border-radius:14px;object-fit:cover;flex:none;cursor:pointer;border:2px solid transparent}' +
      '#scOv .row{display:flex;gap:6px}#scOv input{flex:1;min-width:0;background:#0d0b2a;border:1px solid #3d3590;color:#fff;border-radius:12px;padding:12px;font-size:14px;box-sizing:border-box;width:100%}' +
      '#scOv .sm{border:0;border-radius:12px;padding:0 14px;background:#2b2475;color:#fff;font-size:18px}#scOv .go{width:100%;border:0;border-radius:14px;padding:14px;margin-top:12px;font-size:16px;font-weight:800;color:#fff;background:linear-gradient(90deg,#7c3aed,#db2777)}#scOv .go:disabled{opacity:.6}' +
      '#scOv .msg{min-height:20px;margin-top:8px;font-size:14px}#scOv .mu{font-size:12px;color:#b8b3ea;margin-top:6px;line-height:1.45}' +
      '#scOv .li{display:flex;align-items:center;gap:10px;background:#1c1846;border-radius:14px;padding:10px 12px;margin-bottom:8px}#scOv .li .n{width:22px;color:#9d97e0;font-weight:700}#scOv .li .av{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#2b2475;flex:none}#scOv .li b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#scOv .li .c{background:#3a1030;color:#ff6fa5;border-radius:10px;padding:4px 10px;font-size:13px;font-weight:700;white-space:nowrap}';
    document.head.appendChild(s);
  }
  function sheet(title) {
    css(); var o = document.getElementById('scOv'); if (o) o.remove();
    o = document.createElement('div'); o.id = 'scOv'; o.innerHTML = '<div class="bx"><div class="hd"><b>' + title + '</b><button class="x">✕</button></div><div class="bd">⏳</div></div>';
    document.body.appendChild(o);
    o.onclick = function (e) { if (e.target === o) o.remove(); }; o.querySelector('.x').onclick = function () { o.remove(); };
    return o.querySelector('.bd');
  }
  function saveImg(src) {
    var url = location.origin + src;
    if (tg && tg.downloadFile && tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) { try { tg.downloadFile({ url: url, file_name: 'shashkapro_' + src.replace(/\D/g, '') + '.jpg' }); return; } catch (e) {} }
    if (tg && tg.openLink) tg.openLink(url); else window.open(url, '_blank');
  }
  var ST = { p: '⏳ tekshirilmoqda', ok: '✅ tasdiqlandi', no: '❌ rad etildi' };
  function ig(tab) {
    var bd = sheet('📸 Instagram\'da ulash'); tab = tab || 'share';
    function draw(me) {
      var h = '<div class="tabs"><button data-t="share" class="' + (tab === 'share' ? 'on' : '') + '">🔗 Ulash</button><button data-t="top" class="' + (tab === 'top' ? 'on' : '') + '">🏆 Reyting</button></div><div id="scT"></div>';
      bd.innerHTML = h;
      [].forEach.call(bd.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); draw(me); }; });
      var T = bd.querySelector('#scT');
      if (tab === 'top') {
        T.innerHTML = '⏳';
        api('/api/social/igtop').then(function (r) {
          var L = (r && r.list) || [];
          T.innerHTML = '<div class="mu" style="margin:0 0 8px">Instagram orqali eng ko‘p do‘st taklif qilganlar</div>' + (L.length ? L.map(function (x, i) {
            return '<div class="li"><span class="n">' + (i + 1) + '</span><img class="av" src="/api/av/' + encodeURIComponent(x.uid) + '" onerror="this.style.visibility=\'hidden\'"><b>' + esc(x.name) + '</b><span class="c">👥 ' + x.friends + '</span><span class="c" style="background:#2a1f4f;color:#c4b5fd">📸 ' + x.posts + '</span></div>';
          }).join('') : '<div class="mu">Hali hech kim yo‘q — birinchi bo‘ling!</div>');
        }).catch(function () { T.innerHTML = 'Server bilan aloqa yo‘q'; });
        return;
      }
      var b = (me && me.ig && me.ig.bonus) || 50;
      T.innerHTML = '<div class="note">👥 Har bir yangi do‘st: <b>3 ta o‘yin → +100 🪙</b>, <b>10 ta o‘yin → +200 🪙</b><br>📸 Tasdiqlangan har post uchun: <b>+' + b + ' 🪙</b> (kuniga 1 ta)</div>' +
        '<h4>1. 🖼 Rasmni saqlang</h4><div class="imgs">' + [1, 2, 3, 4].map(function (i) { return '<img src="/img/ig' + i + '.jpg" data-s="/img/ig' + i + '.jpg">'; }).join('') + '</div><div class="mu">Rasmni bosing — telefoningizga saqlanadi</div>' +
        '<h4>2. 📋 Havolani post tagiga yozing</h4><div class="row"><input id="scL" readonly value="' + esc(link()) + '"><button class="sm" id="scC">📋</button></div>' +
        '<div class="mu">Instagram izohdagi havolani bosiladigan qilmaydi — post matniga yozing va «havola profilimda» deb qo‘shing yoki Stories’ga «Havola» stikeri bilan qo‘ying.</div>' +
        '<h4>3. 🔗 Post havolasini shu yerga qo‘ying</h4><input id="scU" placeholder="https://www.instagram.com/p/…">' +
        '<button class="go" id="scG">✓ Tekshirishga yuborish</button><div class="msg" id="scM"></div>' +
        ((me && me.ig && me.ig.posts && me.ig.posts.length) ? '<h4>Mening postlarim</h4>' + me.ig.posts.map(function (p) { return '<div class="li"><b style="font-weight:400;font-size:13px">' + esc(p.url.replace(/^https:\/\/www\./, '')) + '</b><span class="c" style="background:#1d2a4a;color:#c4d4ff">' + ST[p.st] + '</span></div>'; }).join('') : '');
      [].forEach.call(T.querySelectorAll('[data-s]'), function (im) { im.onclick = function () { saveImg(im.getAttribute('data-s')); im.style.borderColor = '#22c55e'; }; });
      T.querySelector('#scC').onclick = function () { copy(link(), this); };
      T.querySelector('#scG').onclick = function () {
        var g = this, u = T.querySelector('#scU').value.trim(), m = T.querySelector('#scM'); if (!u) { m.textContent = 'Post havolasini qo‘ying'; return; }
        g.disabled = true; m.textContent = '⏳';
        api('/api/social/ig', { url: u }).then(function (r) {
          g.disabled = false;
          if (r.error) { m.style.color = '#ff8a8a'; m.textContent = '⚠️ ' + r.error; return; }
          m.style.color = '#7ee08a'; m.textContent = '✅ Yuborildi! Admin tekshirgach +' + b + ' 🪙 tushadi va botga xabar keladi.';
          setTimeout(function () { load(); }, 1500);
        }).catch(function () { g.disabled = false; m.textContent = 'Server bilan aloqa yo‘q'; });
      };
    }
    function load() { api('/api/social/me').then(draw).catch(function () { draw(null); }); }
    load();
  }
  function pass() {
    var bd = sheet('🔐 Login va parol');
    api('/api/social/me').then(function (me) {
      bd.innerHTML = '<div class="note">Telegram ishlamasa yoki sekinlashsa, <b>shashkapro.onrender.com</b> saytiga yoki ilovaga login va parol bilan kirasiz. Tangalar, reyting va natijalar o‘sha akkauntingizda bo‘ladi.</div>' +
        (me && me.hasPass ? '<div class="mu" style="margin-bottom:8px">Hozirgi login: <b style="color:#fff">' + esc(me.login) + '</b> · yangi parol yozsangiz, almashtiriladi</div>' : '') +
        '<h4>Login</h4><input id="scLg" autocomplete="username" placeholder="masalan: ramazon_2026" value="' + esc((me && me.login) || '') + '"><div class="mu">4–20 ta lotin harfi, raqam yoki _</div>' +
        '<h4>Parol</h4><input id="scPw" type="password" autocomplete="new-password" placeholder="kamida 6 ta belgi"><h4>Parolni takrorlang</h4><input id="scPw2" type="password" autocomplete="new-password">' +
        '<button class="go" id="scSv">💾 Saqlash</button><div class="msg" id="scM"></div><div class="mu">⚠️ Parolni hech kimga aytmang. Admin ham uni so‘ramaydi.</div>';
      bd.querySelector('#scSv').onclick = function () {
        var g = this, m = bd.querySelector('#scM'), l = bd.querySelector('#scLg').value.trim(), p1 = bd.querySelector('#scPw').value, p2 = bd.querySelector('#scPw2').value;
        if (p1 !== p2) { m.style.color = '#ff8a8a'; m.textContent = '⚠️ Parollar bir xil emas'; return; }
        g.disabled = true; m.textContent = '⏳';
        api('/api/social/setpass', { login: l, password: p1 }).then(function (r) {
          g.disabled = false;
          if (r.error) { m.style.color = '#ff8a8a'; m.textContent = '⚠️ ' + r.error; return; }
          m.style.color = '#7ee08a'; m.innerHTML = '✅ Saqlandi! Endi saytda <b>' + esc(r.login) + '</b> va parolingiz bilan kira olasiz.';
          bd.querySelector('#scPw').value = bd.querySelector('#scPw2').value = '';
        }).catch(function () { g.disabled = false; m.textContent = 'Server bilan aloqa yo‘q'; });
      };
    }).catch(function () { bd.innerHTML = 'Server bilan aloqa yo‘q'; });
  }
  window.spSocial = { ig: ig, pass: pass };
})();
