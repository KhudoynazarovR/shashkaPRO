/* SKIN — doska rangi va toshlarni tanlash (o'yindagi "☰ Menu" bilan bir xil sozlamalar).
   Doska rangi: localStorage "rc_menu_v1".board (o'yin bilan umumiy). Toshlar: do'kondagi o'z toshlaringiz (/api/shop/equip).
   Masalalar bo'limidagi barcha doskalarga (Rush, Battle, Turnir, Debyutlar, Tuzoqlar, Partiyalar bazasi) avtomatik qo'llanadi.
   API: window.spSkin.open(), window.spSkin.refresh() */
;(function () {
  if (window.spSkin) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var KEY = 'rc_menu_v1';
  var BOARDS = [
    ['Yog‘och', '#EFD9B1', '#B58863', 0], ['Ko‘k-kul', '#DEE3E6', '#8CA2AD', 0],
    ['Yashil', '#FFFFDD', '#86A666', 0], ['Kulrang', '#DDDDDD', '#A0A0A0', 0],
    ['Qizil', '#F1D5CC', '#B5685D', 1], ['Binafsha', '#E3DAEE', '#8B72B5', 1],
    ['Feruza', '#D5F0EC', '#4A9A93', 1], ['Tungi', '#9AA5B8', '#3E4A5E', 1]
  ];
  // masalalar bo'limidagi doskalar
  var SEL = ['#rsB', '#ptB', '#btB', '#spDeb .bd', '#spTrap .bd', '#bzBoard'];
  function rd() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function wr(k, v) { var o = rd(); o[k] = v; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function board() { var b = rd().board; return typeof b === 'number' && BOARDS[b] ? b : -1; }
  function api(p, body) {
    return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': (tg && tg.initData) || '' }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
  }

  // ---------- doska ranglari (CSS)
  function css() {
    var el = document.getElementById('spSkinCss');
    if (!el) { el = document.createElement('style'); el.id = 'spSkinCss'; document.head.appendChild(el); }
    var t = '.spImgPc{background-color:transparent!important;background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important;border:0!important;box-shadow:none!important;font-size:0!important;color:transparent!important;filter:drop-shadow(0 2px 2px #0007)}' +
      '.spImgPc::before,.spImgPc::after{content:none!important;display:none!important}';
    var b = board();
    if (b >= 0) {
      var B = BOARDS[b];
      SEL.forEach(function (s) {
        t += s + ' .l:not(.lm):not(.sel){background:' + B[1] + '!important}' + s + ' .d:not(.lm):not(.sel){background:' + B[2] + '!important}';
      });
      t += '#bzBoard .sq.l{background:' + B[1] + '!important}#bzBoard .sq.d{background:' + B[2] + '!important}#bzBoard{border:0!important;box-shadow:0 6px 20px #0005!important}';
    }
    el.textContent = t;
  }

  // ---------- toshlar (do'kon rasmlari)
  var ok = {};
  function eq() { return window.spEqId || ''; }
  function chk(id, cb) {
    if (ok[id] === true) return cb && cb();
    if (ok[id] === false) return;
    ok[id] = false; var im = new Image();
    im.onload = function () { ok[id] = true; pieces(); if (cb) cb(); };
    im.src = '/api/shop/img?id=' + encodeURIComponent(id) + '&k=w';
  }
  function pieces() {
    var id = eq(), on = id && ok[id] === true;
    if (id && ok[id] === undefined) chk(id);
    var list = document.querySelectorAll(SEL.map(function (s) { return s + ' .pc'; }).join(','));
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!on) { if (p.classList.contains('spImgPc')) { p.classList.remove('spImgPc'); p.style.backgroundImage = ''; } continue; }
      var w = p.classList.contains('w') || p.classList.contains('pw'), k = p.classList.contains('k') || /♛/.test(p.textContent || '');
      var u = 'url("/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + (w ? 'w' : 'b') + (k ? 'k' : '') + '")';
      if (p.style.backgroundImage !== u) p.style.setProperty('background-image', u, 'important');
      p.classList.add('spImgPc');
    }
  }
  var pend = false;
  function later() { if (pend) return; pend = true; (window.requestAnimationFrame || setTimeout)(function () { pend = false; pieces(); }); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t && t.nodeType === 1 && (t.closest ? t.closest(SEL.join(',')) || t.querySelector && t.querySelector(SEL.join(',')) : 1)) { later(); return; } }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ---------- tanlash oynasi
  function open(onChange) {
    var old = document.getElementById('spSkinSheet'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spSkinSheet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
    ov.innerHTML = '<div style="width:100%;max-height:86vh;overflow:auto;background:#101a2e;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(22px + env(safe-area-inset-bottom));box-sizing:border-box;font:16px system-ui,sans-serif"></div>';
    document.body.appendChild(ov);
    var box = ov.firstChild;
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    function changed() { css(); pieces(); if (onChange) try { onChange(); } catch (e) {} }
    function build() {
      var b = board();
      var h = '<div style="display:flex;align-items:center;margin-bottom:10px"><b style="font-size:19px;flex:1">🎨 Doska va toshlar</b><span data-x="1" style="font-size:24px;padding:4px 8px;cursor:pointer">✕</span></div>' +
        '<div style="margin:6px 0 8px">Doska rangi</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">';
      BOARDS.forEach(function (B, i) {
        h += '<div data-b="' + i + '" title="' + B[0] + '" style="aspect-ratio:1;border-radius:10px;position:relative;cursor:pointer;border:3px solid ' + (i === b ? '#4c8dff' : 'transparent') +
          ';background:conic-gradient(' + B[2] + ' 25%,' + B[1] + ' 0 50%,' + B[2] + ' 0 75%,' + B[1] + ' 0)">' + (B[3] ? '<span style="position:absolute;top:-8px;right:-4px;font-size:14px">👑</span>' : '') + '</div>';
      });
      h += '</div><div data-r="1" style="margin:10px 0 0;font-size:13px;opacity:.75;text-decoration:underline;cursor:pointer">↺ Standart doska</div>' +
        '<div style="margin:18px 0 8px">♟ Toshlar</div><div id="spSkShop" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"><div style="grid-column:1/-1;opacity:.6;font-size:13px">Yuklanmoqda…</div></div>' +
        '<div style="margin-top:14px;font-size:12px;opacity:.55">Tanlov o‘yindagi doska bilan umumiy. Yangi toshlarni do‘kondan olishingiz mumkin.</div>';
      box.innerHTML = h;
      box.querySelector('[data-x]').onclick = function () { ov.remove(); };
      Array.prototype.forEach.call(box.querySelectorAll('[data-b]'), function (el) {
        el.onclick = function () {
          var i = +el.getAttribute('data-b');
          if (BOARDS[i][3] && window.rcIsPremium && !window.rcIsPremium()) { alert('👑 Bu doska premium. Tosh do‘konidan oching.'); return; }
          wr('board', i); changed(); build();
        };
      });
      box.querySelector('[data-r]').onclick = function () { wr('board', -1); changed(); build(); };
      var g = box.querySelector('#spSkShop');
      api('/api/shop').then(function (d) {
        if (!d || d.error) { g.innerHTML = '<div style="grid-column:1/-1;opacity:.6;font-size:13px">Toshlar yuklanmadi</div>'; return; }
        var cur = d.equipped === '-' ? '' : (d.equipped || d.def || '');
        var mine = (d.list || []).filter(function (x) { return x.def || d.admin || (d.owned || []).indexOf(x.id) >= 0; });
        if (!mine.length) { g.innerHTML = '<div style="grid-column:1/-1;opacity:.6;font-size:13px">Do‘konda tosh yo‘q</div>'; return; }
        g.innerHTML = mine.map(function (x) {
          var u = '/api/shop/img?id=' + encodeURIComponent(x.id) + '&k=';
          return '<div data-sid="' + String(x.id).replace(/"/g, '') + '" style="cursor:pointer;border-radius:10px;background:#26344f;padding:6px 0;display:flex;justify-content:center;border:3px solid ' + (x.id === cur ? '#4c8dff' : 'transparent') + '"><div style="display:grid;grid-template-columns:repeat(2,20px);gap:4px">' +
            ['w', 'b', 'wk', 'bk'].map(function (k) { return '<i style="width:20px;height:20px;display:block;background:url(' + u + k + ') center/contain no-repeat"></i>'; }).join('') + '</div></div>';
        }).join('');
        Array.prototype.forEach.call(g.querySelectorAll('[data-sid]'), function (el) {
          el.onclick = function () {
            var id = el.getAttribute('data-sid');
            api('/api/shop/equip', { id: id }).then(function (r) {
              if (r && r.ok) { window.spEqId = id; chk(id, changed); changed(); build(); }
            });
          };
        });
      }).catch(function () { g.innerHTML = '<div style="grid-column:1/-1;opacity:.6;font-size:13px">Toshlar yuklanmadi</div>'; });
    }
    build();
  }

  window.spSkin = { open: open, refresh: function () { css(); pieces(); }, board: board, boards: BOARDS };
  css(); if (eq()) chk(eq());
})();
