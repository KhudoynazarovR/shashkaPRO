/* theme.js — 🎨 platforma mavzusi: bitta shrift, bir xil fon (yengil gradient + xira shashka katakchalari) va 3 ta tungi mavzu.
   A · Tungi ko'k (standart), B · Grafit, C · Zumrad. Tanlov localStorage('spTheme') da.
   B va C uchun: sahifadagi binafsha/ko'k to'q ranglar (fon, chegara, gradient) yorug'ligi saqlangan holda mavzu rangiga almashtiriladi —
   doska kataklari, donalar, oltin va yashil urg'ular o'zgarmaydi. Eski «Fon rasmi» (spBgPicker) qo'shimcha sifatida qoladi. */
;(function () {
  if (window.__spTheme) return; window.__spTheme = 1;
  var T = {
    a: { name: 'Tungi ko‘k', icon: '🌙', bg1: '#1c1854', bg2: '#110e33', nav: '#0e0c2b', chk: 'rgba(255,255,255,.035)', acc: '#3fa34d', h: null },
    b: { name: 'Grafit', icon: '⚫', bg1: '#22201d', bg2: '#161512', nav: '#121110', chk: 'rgba(255,255,255,.03)', acc: '#629924', h: 38, s: 0.07, tx: 0.05 },
    c: { name: 'Zumrad', icon: '🟢', bg1: '#123328', bg2: '#0a1c16', nav: '#08150f', chk: 'rgba(255,255,255,.035)', acc: '#3fa34d', h: 158, s: 0.45, tx: 0.25 }
  };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } }
  function cur() { var k = ls('spTheme'); return T[k] ? k : 'a'; }
  var FONT = '"Roboto","Segoe UI",-apple-system,BlinkMacSystemFont,"SF Pro Text","Noto Sans",system-ui,Arial,sans-serif';

  // ---- asosiy CSS: shrift, fon, pastki menyu
  var st = document.createElement('style'); st.id = 'spThemeCss';
  function css(k) {
    var t = T[k];
    return ':root{--spBg1:' + t.bg1 + ';--spBg2:' + t.bg2 + ';--spNav:' + t.nav + ';--spAcc:' + t.acc + '}' +
      'html body,html body *:not(pre):not(code):not(kbd):not(samp){font-family:' + FONT + '!important}' +
      'html body,html body #nvPg#nvPg,html body #nvPlay#nvPlay,html body #lbPanel#lbPanel,html body #taP#taP,html body #tvP#tvP{background:' + bgImg(t) + '!important;background-color:' + t.bg2 + '!important}' +
      '#nvBar{background:' + t.nav + '!important;border-top:1px solid rgba(255,255,255,.08)!important}' +
      '#nvBar button{font-weight:600}';
  }
  // fon: tepada xira shashka katakchalari (pastga qarab yo'qoladi) + yengil gradient; sahifa bilan birga suriladi
  function bgImg(t) {
    var c = t.chk;
    return 'linear-gradient(180deg,transparent 0,' + t.bg1 + ' 260px,' + t.bg2 + ' 100%),' +
      'linear-gradient(45deg,' + c + ' 25%,transparent 25%,transparent 75%,' + c + ' 75%) 0 0/44px 44px,' +
      'linear-gradient(45deg,' + c + ' 25%,transparent 25%,transparent 75%,' + c + ' 75%) 22px 22px/44px 44px,' + t.bg1;
  }
  function boot() { if (!document.head) return setTimeout(boot, 10); st.textContent = css(cur()); if (!st.parentNode) document.head.appendChild(st); }
  boot();

  // ---- rang almashtirish (B, C): binafsha/ko'k to'q ranglar → mavzu tusi, yorug'lik saqlanadi
  function parse(c) { var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; var p = m[1].split(',').map(function (x) { return parseFloat(x); }); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, h = 0, s = 0; if (M !== m) { var d = M - m; s = l > 0.5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function rgb(h, s, l) { function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); } return [f(0), f(8), f(4)]; }
  function remap(str, t, text) {
    return String(str).replace(/rgba?\([^)]+\)/g, function (c) {
      var o = parse(c); if (!o) return c; var x = hsl(o.r, o.g, o.b);
      // faqat binafsha/ko'k (210°–290°) va yetarli to'yingan; matnda — och, fonda — to'q va o'rta
      if (x[0] < 210 || x[0] > 290 || x[1] < 0.12) return c;
      if (!text && x[2] > 0.62) return c;
      var s2 = text ? Math.min(x[1], t.tx) : Math.min(x[1], t.s), y = rgb(t.h, s2, x[2]);
      return o.a < 1 ? 'rgba(' + y[0] + ',' + y[1] + ',' + y[2] + ',' + o.a + ')' : 'rgb(' + y[0] + ',' + y[1] + ',' + y[2] + ')';
    });
  }
  var SKIP = /^(CANVAS|IMG|SVG|PATH|VIDEO|SCRIPT|STYLE|IFRAME)$/i;
  function paint(el, t) {
    if (!el || el.nodeType !== 1 || SKIP.test(el.tagName) || el.hasAttribute('data-spth')) return;
    if (el.closest && el.closest('.board,#board,.cell,.sq,.taFt,[data-nott]')) return;   // doska kataklari tegilmaydi
    var cs = getComputedStyle(el), ch = 0;
    var bg = cs.backgroundColor, bi = cs.backgroundImage, bc = cs.borderTopColor, co = cs.color, sh = cs.boxShadow;
    var nbg = remap(bg, t), nbi = bi && bi !== 'none' && bi.indexOf('url(') < 0 ? remap(bi, t) : bi, nbc = remap(bc, t), nco = remap(co, t, true), nsh = sh && sh !== 'none' ? remap(sh, t) : sh;
    if (nbg !== bg) { el.style.setProperty('background-color', nbg, 'important'); ch = 1; }
    if (nbi !== bi) { el.style.setProperty('background-image', nbi, 'important'); ch = 1; }
    if (nbc !== bc && parseFloat(cs.borderTopWidth) > 0) { el.style.setProperty('border-color', nbc, 'important'); ch = 1; }
    if (nco !== co) { el.style.setProperty('color', nco, 'important'); ch = 1; }
    if (nsh !== sh) { el.style.setProperty('box-shadow', nsh, 'important'); ch = 1; }
    el.setAttribute('data-spth', ch ? '1' : '0');
  }
  function unpaint() {
    [].forEach.call(document.querySelectorAll('[data-spth="1"]'), function (el) { ['background-color', 'background-image', 'border-color', 'color', 'box-shadow'].forEach(function (p) { el.style.removeProperty(p); }); });
    [].forEach.call(document.querySelectorAll('[data-spth]'), function (el) { el.removeAttribute('data-spth'); });
  }
  var q = [], qT = null;
  function sweep(root) {
    var t = T[cur()]; if (t.h == null) return;
    var all = (root || document.body).getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) paint(all[i], t);
    if (root && root.nodeType === 1) paint(root, t);
  }
  var mo = null;
  function watch() {
    var t = T[cur()];
    if (mo) { mo.disconnect(); mo = null; }
    if (t.h == null || !document.body) return;
    mo = new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'attributes') { var el = m.target; if (el.getAttribute('data-spth') && (m.attributeName === 'class')) { el.removeAttribute('data-spth'); q.push(el); } continue; }
        for (var j = 0; j < m.addedNodes.length; j++) if (m.addedNodes[j].nodeType === 1) q.push(m.addedNodes[j]);
      }
      if (!qT) qT = setTimeout(function () { qT = null; var a = q.splice(0); for (var k = 0; k < a.length; k++) if (a[k].isConnected) sweep(a[k]); }, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    sweep();
  }
  function set(k) { ls('spTheme', k); st.textContent = css(k); unpaint(); watch(); }
  function start() { if (!document.body) return setTimeout(start, 50); watch(); setInterval(function () { if (T[cur()].h != null) sweep(); }, 4000); }
  start();

  // ---- 🎨 Mavzu tanlash oynasi (Menyu → Mavzu)
  function picker() {
    var old = document.getElementById('spThSheet'); if (old) { old.remove(); return; }
    var ov = document.createElement('div'); ov.id = 'spThSheet'; ov.setAttribute('data-nott', '1');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
    var k0 = cur(), h = '<div style="width:100%;background:#17133f;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box">' +
      '<div style="display:flex;align-items:center;margin-bottom:12px"><b style="font-size:19px">🎨 Mavzu</b><span id="spThX" style="margin-left:auto;font-size:22px;padding:2px 8px;cursor:pointer">✕</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
    Object.keys(T).forEach(function (k) {
      var t = T[k];
      h += '<div data-th="' + k + '" style="cursor:pointer;text-align:center">' +
        '<div style="height:96px;border-radius:14px;background:linear-gradient(180deg,' + t.bg1 + ',' + t.bg2 + ');border:3px solid ' + (k === k0 ? t.acc : 'rgba(255,255,255,.15)') + ';position:relative;overflow:hidden">' +
        '<div style="position:absolute;left:10px;right:10px;top:14px;height:12px;border-radius:6px;background:rgba(255,255,255,.14)"></div>' +
        '<div style="position:absolute;left:10px;right:30px;top:34px;height:10px;border-radius:5px;background:rgba(255,255,255,.08)"></div>' +
        '<div style="position:absolute;left:10px;bottom:12px;width:46px;height:20px;border-radius:8px;background:' + t.acc + '"></div>' +
        (k === k0 ? '<div style="position:absolute;right:8px;bottom:8px;font-size:18px">✅</div>' : '') + '</div>' +
        '<div style="margin-top:6px;font-size:13px;font-weight:600">' + t.icon + ' ' + t.name + (k === 'a' ? '<br><small style="opacity:.6;font-weight:400">standart</small>' : '') + '</div></div>';
    });
    h += '</div><button id="spThBg" style="margin-top:16px;width:100%;border:0;border-radius:12px;padding:13px;background:#2d2775;color:#fff;font-size:15px;font-weight:600">🖼 Fon rasmi va boshqa fonlar</button>' +
      '<div style="margin-top:10px;font-size:12px;opacity:.6;text-align:center">☀️ Kunduzgi mavzu tez orada</div></div>';
    ov.innerHTML = h; document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov || e.target.id === 'spThX') ov.remove(); };
    ov.querySelector('#spThBg').onclick = function () { ov.remove(); if (window.spBgPicker) window.spBgPicker(); };
    [].forEach.call(ov.querySelectorAll('[data-th]'), function (el) { el.onclick = function () { set(el.getAttribute('data-th')); ov.remove(); }; });
  }
  window.spThemePicker = picker; window.spThemeSet = set;
})();
