/* webauth.js — ShashkaPRO Telegramdan tashqarida ochilganda (brauzer, Play Market ilovasi) kirish.
   Telegram ichida hech narsa qilmaydi. Tashqarida: saqlangan sessiyani Telegram.WebApp.initData ga qo'yadi,
   shunda ilovaning qolgan qismi Telegram ichidagidek ishlaydi. Sessiya bo'lmasa — kirish ekrani.
   index.html da telegram-web-app.js dan KEYIN, boshqa skriptlardan OLDIN yuklanadi. */
(function () {
  var KEY = 'spAuth', W = window;
  W.Telegram = W.Telegram || {};
  var tg = W.Telegram.WebApp;
  if (tg && tg.initData) return; // Telegram ichida
  if (!tg) { // telegram-web-app.js yuklanmagan bo'lsa — oddiy almashtiruvchi
    var noop = function () {};
    tg = W.Telegram.WebApp = { initData: '', initDataUnsafe: {}, ready: noop, expand: noop, close: noop, onEvent: noop, offEvent: noop, setHeaderColor: noop, setBackgroundColor: noop, openLink: function (u) { W.open(u, '_blank'); }, openTelegramLink: function (u) { W.location.href = u; }, HapticFeedback: { impactOccurred: noop, notificationOccurred: noop, selectionChanged: noop }, BackButton: { show: noop, hide: noop, onClick: noop, offClick: noop }, MainButton: { show: noop, hide: noop, onClick: noop, offClick: noop, setText: noop }, platform: 'web', version: '6.0', colorScheme: 'dark', themeParams: {} };
  }
  W.SP_WEB = true;
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function apply(a) {
    var unsafe = { user: a.user, auth_date: Math.floor(a.at / 1000) };
    try { tg.initData = a.initData; tg.initDataUnsafe = unsafe; } catch (e) {}
    if (tg.initData !== a.initData) { // xususiyat yozib bo'lmasa — o'ram obyekt
      var w = Object.create(tg); try { Object.defineProperty(w, 'initData', { value: a.initData }); Object.defineProperty(w, 'initDataUnsafe', { value: unsafe }); } catch (e) {}
      try { W.Telegram.WebApp = w; } catch (e) {}
      tg = w;
    }
  }
  function sess(j) { return { initData: j.initData, user: j.user, refresh: j.refresh, at: Date.now() }; }
  W.spLogout = function () { try { localStorage.removeItem(KEY); } catch (e) {} W.location.reload(); };

  var A = load();
  if (A && A.initData && Date.now() - A.at < 20 * 3600e3) { apply(A); later(A); return; }
  if (A && A.refresh) { // sinxron yangilash — boshqa skriptlar initData ni yuklanishda o'qiydi
    try {
      var x = new XMLHttpRequest(); x.open('POST', '/api/auth/refresh', false); x.setRequestHeader('Content-Type', 'application/json');
      x.send(JSON.stringify({ refresh: A.refresh }));
      var j = JSON.parse(x.responseText || '{}');
      if (j.initData) { var B = sess(j); save(B); apply(B); later(B); return; }
      if (j.error === 'relogin') { try { localStorage.removeItem(KEY); } catch (e) {} }
      else { apply(A); return; } // server vaqtincha javob bermadi — eski sessiya bilan urinib ko'ramiz
    } catch (e) { apply(A); return; }
  }
  // uzoq ochiq qolsa — 20 soatdan keyin jimgina yangilab, sahifani qayta yuklaydi
  function later(a) {
    setTimeout(function () {
      fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: a.refresh }) })
        .then(function (r) { return r.json(); }).then(function (j) { if (j.initData) { save(sess(j)); W.location.reload(); } }).catch(function () {});
    }, Math.max(60e3, 20 * 3600e3 - (Date.now() - a.at)));
  }

  // ---------- kirish ekrani
  function screen() {
    if (!document.body) return setTimeout(screen, 30);
    var css = document.createElement('style');
    css.textContent = '#spLogin{visibility:visible!important;position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;box-sizing:border-box;color:#fff;font-family:system-ui,Roboto,sans-serif;text-align:center;background:radial-gradient(circle at 50% 20%,#3a1a7a,#140a33 70%)}' +
      '#spLogin .lg{width:120px;height:120px;border-radius:28px;background:#f3bb86;display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.5)}#spLogin .lg i{display:block}#spLogin .lg i:nth-child(odd){background:#7b2f13}' +
      '#spLogin h1{margin:6px 0 0;font-size:30px;font-weight:900}#spLogin p{margin:0;max-width:340px;color:#d9d2ff;font-size:16px;line-height:1.45}' +
      '#spLogin button{width:100%;max-width:340px;border:0;border-radius:16px;padding:16px;font:800 18px system-ui;color:#fff;background:linear-gradient(180deg,#38b0e8,#1d8bd1);box-shadow:0 4px 0 #0f5b8c}#spLogin button:disabled{opacity:.6}' +
      '#spLogin .st{min-height:44px;font-size:15px;color:#ffe08a;max-width:340px}#spLogin a{color:#9fd6ff;font-size:14px;word-break:break-all}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'spLogin';
    var sq = ''; for (var i = 0; i < 16; i++) sq += '<i style="' + ((Math.floor(i / 4) + i) % 2 ? 'background:#7b2f13' : 'background:#f3bb86') + '"></i>';
    el.innerHTML = '<div class="lg" style="grid-template-columns:repeat(4,1fr)">' + sq + '</div><h1>ShashkaPRO</h1><p>Rus shashkasi: onlayn o‘yinlar, turnirlar, masalalar va AI bilan o‘yin.</p>' +
      '<button id="spLgBtn">✈️ Telegram orqali kirish</button><div class="st" id="spLgSt">Telegram’dagi hisobingiz bilan kirasiz — tangalar, reyting va natijalar saqlanadi.</div>';
    document.documentElement.appendChild(el);
    var btn = el.querySelector('#spLgBtn'), st = el.querySelector('#spLgSt'), poll = null, code = null;
    btn.onclick = function () {
      btn.disabled = true; st.textContent = '⏳ Tayyorlanmoqda…';
      fetch('/api/auth/start', { method: 'POST' }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.code) throw new Error(j.error || 'xato');
        code = j.code;
        st.innerHTML = '📲 Telegram ochildi. Botda <b>«✅ Ha, kiraman»</b> tugmasini bosing va shu yerga qayting.<br><a href="' + j.link + '" target="_blank" rel="noopener">Telegram ochilmadimi? Shu yerni bosing</a>';
        try { W.location.href = j.tg; } catch (e) {}
        setTimeout(function () { if (!document.hidden) try { W.open(j.link, '_blank'); } catch (e) {} }, 1200);
        btn.disabled = false; btn.textContent = '🔄 Qaytadan';
        if (poll) clearInterval(poll);
        var t0 = Date.now();
        poll = setInterval(function () {
          if (Date.now() - t0 > (j.ttl || 600000)) { clearInterval(poll); st.textContent = '⌛ Vaqt tugadi. Qaytadan bosing.'; return; }
          fetch('/api/auth/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code }) }).then(function (r) { return r.json(); }).then(function (p) {
            if (p.initData) { clearInterval(poll); save(sess(p)); st.textContent = '✅ Xush kelibsiz, ' + (p.user.first_name || '') + '!'; setTimeout(function () { W.location.reload(); }, 400); }
            else if (p.error === 'expired') { clearInterval(poll); st.textContent = '⌛ Vaqt tugadi. Qaytadan bosing.'; }
            else if (p.seen) st.innerHTML = '👆 Botda <b>«✅ Ha, kiraman»</b> tugmasini bosing…';
          }).catch(function () {});
        }, 2000);
      }).catch(function () { btn.disabled = false; st.textContent = '⚠️ Server bilan aloqa yo‘q. Birozdan keyin qayta urinib ko‘ring.'; });
    };
  }
  screen();
})();
