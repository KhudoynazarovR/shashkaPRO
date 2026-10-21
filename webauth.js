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
  // ilova rejimi (Play Market / bosh ekranga o'rnatish): oflayn sahifa uchun service worker
  try { if ('serviceWorker' in navigator) W.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); } catch (e) {}
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
      '#spLogin button{width:100%;max-width:340px;border:0;border-radius:16px;padding:16px;font:800 18px system-ui;color:#fff;background:linear-gradient(180deg,#38b0e8,#1d8bd1);box-shadow:0 4px 0 #0f5b8c}#spLogin button:disabled{opacity:.6}#spLogin button.g{display:flex;align-items:center;justify-content:center;white-space:nowrap;background:#fff;color:#1f1f1f;box-shadow:0 4px 0 #b9b2e6}' +
      '#spLogin .st{min-height:44px;font-size:15px;color:#ffe08a;max-width:340px}#spLogin a{color:#9fd6ff;font-size:14px;word-break:break-all}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'spLogin';
    var sq = ''; for (var i = 0; i < 16; i++) sq += '<i style="' + ((Math.floor(i / 4) + i) % 2 ? 'background:#7b2f13' : 'background:#f3bb86') + '"></i>';
    el.innerHTML = '<div class="lg" style="grid-template-columns:repeat(4,1fr)">' + sq + '</div><h1>ShashkaPRO</h1><p>Rus shashkasi: onlayn o‘yinlar, turnirlar, masalalar va AI bilan o‘yin.</p>' +
      '<button id="spLgG" class="g" style="display:none"><svg width="22" height="22" viewBox="0 0 48 48" style="vertical-align:-5px;margin-right:10px"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.7 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Google orqali kirish</button>' +
      '<button id="spLgBtn">✈️ Telegram orqali kirish</button><div class="st" id="spLgSt">Telegram yoki Google hisobingiz bilan kiring — tangalar, reyting va natijalar saqlanadi.</div>';
    document.documentElement.appendChild(el);
    var btn = el.querySelector('#spLgBtn'), gb = el.querySelector('#spLgG'), st = el.querySelector('#spLgSt'), poll = null;
    var isApp = !!(W.Capacitor && W.Capacitor.isNativePlatform && W.Capacitor.isNativePlatform());
    fetch('/api/auth/config').then(function (r) { return r.json(); }).then(function (c) { if (c.google) gb.style.display = ''; else st.textContent = 'Telegram’dagi hisobingiz bilan kirasiz — tangalar, reyting va natijalar saqlanadi.'; }).catch(function () {});
    function waitFor(j, b, seenMsg) { // kirish tasdiqlanishini kutish (Telegram boti yoki Google sahifasi)
      b.disabled = false; b.textContent = '🔄 Qaytadan';
      if (poll) clearInterval(poll);
      var t0 = Date.now();
      poll = setInterval(function () {
        if (Date.now() - t0 > (j.ttl || 600000)) { clearInterval(poll); st.textContent = '⌛ Vaqt tugadi. Qaytadan bosing.'; return; }
        fetch('/api/auth/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: j.code }) }).then(function (r) { return r.json(); }).then(function (p) {
          if (p.initData) { clearInterval(poll); save(sess(p)); st.textContent = '✅ Xush kelibsiz, ' + (p.user.first_name || '') + '!'; setTimeout(function () { W.location.reload(); }, 400); }
          else if (p.error === 'expired') { clearInterval(poll); st.textContent = '⌛ Vaqt tugadi. Qaytadan bosing.'; }
          else if (p.seen && seenMsg) st.innerHTML = seenMsg;
        }).catch(function () {});
      }, 2000);
    }
    gb.onclick = function () {
      gb.disabled = true; st.textContent = '⏳ Google ochilmoqda…';
      fetch('/api/auth/gstart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app: isApp }) }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.url) throw new Error(j.error || 'xato');
        if (!isApp) { W.location.href = j.url; return; } // saytda: shu oynada Google, so'ng o'yinga qaytadi
        st.innerHTML = '🌐 Brauzerda Google hisobingizni tanlang, so‘ng <b>shu ilovaga qayting</b> — o‘yin o‘zi ochiladi.';
        W.location.href = j.url; // ilovada tashqi brauzerda ochiladi
        waitFor(j, gb, null); gb.innerHTML = '🔄 Google orqali qaytadan';
      }).catch(function (e) { gb.disabled = false; st.textContent = '⚠️ ' + (e && e.message && e.message !== 'xato' ? e.message : 'Server bilan aloqa yo‘q. Birozdan keyin qayta urinib ko‘ring.'); });
    };
    btn.onclick = function () {
      btn.disabled = true; st.textContent = '⏳ Tayyorlanmoqda…';
      fetch('/api/auth/start', { method: 'POST' }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.code) throw new Error(j.error || 'xato');
        st.innerHTML = '📲 Telegram ochildi. Botda <b>«✅ Ha, kiraman»</b> tugmasini bosing va shu yerga qayting.<br><a href="' + j.link + '" target="_blank" rel="noopener">Telegram ochilmadimi? Shu yerni bosing</a>';
        try { W.location.href = j.tg; } catch (e) {}
        setTimeout(function () { if (!document.hidden) try { W.open(j.link, '_blank'); } catch (e) {} }, 1200);
        waitFor(j, btn, '👆 Botda <b>«✅ Ha, kiraman»</b> tugmasini bosing…');
      }).catch(function () { btn.disabled = false; st.textContent = '⚠️ Server bilan aloqa yo‘q. Birozdan keyin qayta urinib ko‘ring.'; });
    };
  }
  screen();
})();
