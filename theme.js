/* theme.js — 🎨 platforma mavzusi: bitta shrift, bir xil fon (yengil gradient + xira shashka katakchalari) va 3 ta tungi mavzu.
   A · Tungi ko'k (standart), B · Grafit, C · Zumrad. Tanlov localStorage('spTheme') da.
   B va C uchun: sahifadagi binafsha/ko'k to'q ranglar (fon, chegara, gradient) yorug'ligi saqlangan holda mavzu rangiga almashtiriladi —
   doska kataklari, donalar, oltin va yashil urg'ular o'zgarmaydi. Eski «Fon rasmi» (spBgPicker) qo'shimcha sifatida qoladi. */
;(function () {
  if (window.__spTheme) return; window.__spTheme = 1;
  var T = {
    a: { name: 'Tungi ko‘k', icon: '🌙', bg1: '#1c1854', bg2: '#110e33', nav: '#0e0c2b', chk: 'rgba(255,255,255,.035)', acc: '#3fa34d', h: null },
    b: { name: 'Grafit', icon: '⚫', bg1: '#22201d', bg2: '#161512', nav: '#121110', chk: 'rgba(255,255,255,.03)', acc: '#629924', h: 38, s: 0.07, tx: 0.05 },
    c: { name: 'Zumrad', icon: '🟢', bg1: '#123328', bg2: '#0a1c16', nav: '#08150f', chk: 'rgba(255,255,255,.035)', acc: '#3fa34d', h: 158, s: 0.45, tx: 0.25 },
    d: { name: 'Kunduzgi', icon: '☀️', bg1: '#f6f7fb', bg2: '#e8ebf3', nav: '#ffffff', chk: 'rgba(40,40,120,.045)', acc: '#2f9e44', h: null, mode: 'light', line: 'rgba(30,30,90,.10)' }
  };
  // 🌗 Avto: Telegram'ning mavzusi bo'yicha (kunduzgi → D, tungi → A)
  function tgLight() { try { var W = window.Telegram && Telegram.WebApp; return !!(W && W.colorScheme === 'light'); } catch (e) { return false; } }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } }
  var DEF = 'a';   // tanlanmagan bo'lsa (standart)
  function cur() { var k = ls('spTheme') || DEF; if (k === 'auto') return tgLight() ? 'd' : 'a'; return T[k] ? k : 'a'; }
  var FONT = '"Roboto","Segoe UI",-apple-system,BlinkMacSystemFont,"SF Pro Text","Noto Sans",system-ui,Arial,sans-serif';

  // ---- asosiy CSS: shrift, fon, pastki menyu
  var st = document.createElement('style'); st.id = 'spThemeCss';
  function css(k) {
    var t = T[k];
    return ':root{--spBg1:' + t.bg1 + ';--spBg2:' + t.bg2 + ';--spNav:' + t.nav + ';--spAcc:' + t.acc + '}' +
      'html body,html body *:not(pre):not(code):not(kbd):not(samp){font-family:' + FONT + '!important}' +
      'html body,html body #nvPg#nvPg,html body #nvPlay#nvPlay,html body #lbPanel#lbPanel,html body #taP#taP,html body #tvP#tvP{background:' + bgImg(t) + '!important;background-color:' + t.bg2 + '!important}' +
      '#nvBar{background:' + t.nav + '!important;border-top:1px solid ' + (t.line || 'rgba(255,255,255,.08)') + '!important}' +
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

  // ---- rang almashtirish. B, C: binafsha/ko'k → mavzu tusi (yorug'lik saqlanadi). D (kunduzgi): to'q fon → och, och matn → to'q.
  function parse(c) { var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; var p = m[1].split(',').map(function (x) { return parseFloat(x); }); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, h = 0, s = 0; if (M !== m) { var d = M - m; s = l > 0.5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function rgb(h, s, l) { function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); } return [f(0), f(8), f(4)]; }
  function out(y, a) { return a < 1 ? 'rgba(' + y[0] + ',' + y[1] + ',' + y[2] + ',' + a + ')' : 'rgb(' + y[0] + ',' + y[1] + ',' + y[2] + ')'; }
  function each(str, fn) { return String(str).replace(/rgba?\([^)]+\)/g, function (c) { var o = parse(c); if (!o || o.a === 0) return c; return fn(o, hsl(o.r, o.g, o.b)) || c; }); }
  function hueMap(str, t, text) {
    return each(str, function (o, x) {
      if (x[0] < 210 || x[0] > 290 || x[1] < 0.12) return null;
      if (!text && x[2] > 0.62) return null;
      return out(rgb(t.h, text ? Math.min(x[1], t.tx) : Math.min(x[1], t.s), x[2]), o.a);
    });
  }
  // kunduzgi: fon / chegara
  function lightBg(str, border) {
    return each(str, function (o, x) {
      if (o.r > 235 && o.g > 235 && o.b > 235 && o.a < 0.5) return 'rgba(30,30,90,' + Math.min(0.12, o.a * (border ? 1.4 : 0.9)).toFixed(3) + ')';   // to'q fondagi oq shaffof → och fonda xira to'q
      if (x[2] >= 0.42) return null;                               // yorqin urg'ular (yashil, oltin, qizil kartalar) o'zgarmaydi
      if (x[0] >= 10 && x[0] <= 50 && x[1] > 0.25) return null;    // jigarrang/yog'och (doska kataklari, «Masalalar» lavhasi) o'zgarmaydi
      if (o.a < 0.7 && x[2] < 0.12) return null;                   // qora parda (oyna orqasi) o'zgarmaydi
      return out(rgb(x[0], Math.min(x[1], 0.35) * 0.55, border ? 0.86 - x[2] * 0.2 : 0.985 - x[2] * 0.32), o.a < 1 ? Math.max(o.a, 0.85) : 1);
    });
  }
  // kunduzgi: matn (orqa fon och bo'lsa)
  function lightTx(str) {
    return each(str, function (o, x) {
      if (x[2] > 0.6) return out(rgb(x[0], Math.min(x[1], 0.5) * 0.7, Math.max(0.12, 0.95 - x[2] * 0.82)), o.a);   // oq/och → to'q
      if (x[1] > 0.3 && x[2] > 0.42) return out(rgb(x[0], x[1], Math.min(x[2], 0.4)), o.a);                         // oltin/yashil matn — o'qiladigan darajada to'qroq
      return null;
    });
  }
  function lum(o) { return (0.299 * o.r + 0.587 * o.g + 0.114 * o.b) / 255; }
  function bgLumOf(el) {   // elementning ko'rinadigan orqa foni yorqinligi (ota elementlar bo'yicha)
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n), bi = cs.backgroundImage;
      if (bi && bi !== 'none') { if (bi.indexOf('url(') >= 0) return 0.3; var o1 = parse(bi); if (o1 && o1.a > 0.5) return lum(o1); }
      var o = parse(cs.backgroundColor); if (o && o.a > 0.5) return lum(o);
    }
    return 0.95;
  }
  var PROPS = ['background-color', 'background-image', 'border-color', 'color', 'box-shadow', 'text-shadow'];
  function save(el, p) { var o = el.__spO || (el.__spO = {}); if (!(p in o)) o[p] = [el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]; }
  function setP(el, p, v) { save(el, p); el.style.setProperty(p, v, 'important'); (el.__spV || (el.__spV = {}))[p] = el.style.getPropertyValue(p); }
  // ilova inline uslubni o'zgartirdi: biz yozgan (o'zgarmagan) xossalarni asl holiga qaytaramiz, ilova yozganlarini qoldiramiz
  function settle(el) { var o = el.__spO, v = el.__spV || {}; if (!o) return; for (var p in o) { if (el.style.getPropertyPriority(p) === 'important' && el.style.getPropertyValue(p) === v[p]) { if (o[p][0]) el.style.setProperty(p, o[p][0], o[p][1]); else el.style.removeProperty(p); } } el.__spO = null; el.__spV = null; }
  function restore(el) { var o = el.__spO; if (!o) return; for (var p in o) { if (o[p][0]) el.style.setProperty(p, o[p][0], o[p][1]); else el.style.removeProperty(p); } el.__spO = null; el.__spV = null; }
  var SKIP = /^(CANVAS|IMG|SVG|PATH|VIDEO|SCRIPT|STYLE|IFRAME|svg|path)$/;
  var NOTT = '.board,#board,#pzB,.cell,.sq,.pc,.taFt,[data-r][data-c],[data-nott],#spThSheet,#spBgSheet';   // doskalar (o'yin, masala, arena) va donalar
  function paint(el, t) {
    if (!el || el.nodeType !== 1 || SKIP.test(el.tagName) || el.hasAttribute('data-spth')) return;
    if (el.closest && el.closest(NOTT)) return;   // doska kataklari, donalar va mavzu oynasi tegilmaydi
    var cs = getComputedStyle(el), ch = 0, light = t.mode === 'light';
    var bg = cs.backgroundColor, bi = cs.backgroundImage, bc = cs.borderTopColor, co = cs.color, sh = cs.boxShadow, ts = cs.textShadow;
    var hasBi = bi && bi !== 'none' && bi.indexOf('url(') < 0;
    var nbg = light ? lightBg(bg) : hueMap(bg, t), nbi = hasBi ? (light ? lightBg(bi) : hueMap(bi, t)) : bi, nbc = light ? lightBg(bc, true) : hueMap(bc, t);
    if (nbg !== bg) { setP(el, 'background-color', nbg); ch = 1; }
    if (nbi !== bi) { setP(el, 'background-image', nbi); ch = 1; }
    if (nbc !== bc && parseFloat(cs.borderTopWidth) > 0) { setP(el, 'border-color', nbc); ch = 1; }
    if (light) {
      var bl = bgLumOf(el);
      if (bl > 0.6) {
        var nco = lightTx(co); if (nco !== co) { setP(el, 'color', nco); ch = 1; }
        if (ts && ts !== 'none') { setP(el, 'text-shadow', 'none'); ch = 1; }
      }
      if (sh && sh !== 'none') { var nsh = each(sh, function (o, x) { return x[2] < 0.3 ? 'rgba(30,30,90,.13)' : null; }); if (nsh !== sh) { setP(el, 'box-shadow', nsh); ch = 1; } }
    } else {
      var nco2 = hueMap(co, t, true), nsh2 = sh && sh !== 'none' ? hueMap(sh, t) : sh;
      if (nco2 !== co) { setP(el, 'color', nco2); ch = 1; }
      if (nsh2 !== sh) { setP(el, 'box-shadow', nsh2); ch = 1; }
    }
    el.setAttribute('data-spth', ch ? '1' : '0');
    el.__spS = el.getAttribute('style');
  }
  function unpaint() {
    [].forEach.call(document.querySelectorAll('[data-spth]'), function (el) { restore(el); el.removeAttribute('data-spth'); el.__spS = null; });
  }
  function active() { var t = T[cur()]; return t.h != null || t.mode === 'light'; }
  var q = [], qT = null;
  function sweep(root) {
    var t = T[cur()]; if (!active()) return;
    if (root && root.nodeType === 1) paint(root, t);
    var all = (root || document.body).getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) paint(all[i], t);
  }
  var mo = null;
  function watch() {
    if (mo) { mo.disconnect(); mo = null; }
    if (!active() || !document.body) return;
    mo = new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'attributes') {
          var el = m.target; if (!el.hasAttribute('data-spth')) continue;
          if (m.attributeName === 'style' && el.getAttribute('style') === el.__spS) continue;   // o'zimizning yozuvimiz
          if (m.attributeName === 'data-spth') continue;
          // ilova uslubni o'zgartirdi (masalan har 400ms tugmani yangilaydi) — darhol, kadr chizilishidan oldin qayta bo'yaymiz (pirpiramasin)
          if (m.attributeName === 'style') settle(el); else restore(el);
          el.removeAttribute('data-spth'); paint(el, T[cur()]);
          continue;
        }
        for (var j = 0; j < m.addedNodes.length; j++) if (m.addedNodes[j].nodeType === 1) q.push(m.addedNodes[j]);
      }
      if (!qT) qT = setTimeout(function () { qT = null; var a = q.splice(0); for (var k = 0; k < a.length; k++) if (a[k].isConnected) sweep(a[k]); }, 50);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    sweep();
  }
  function set(k) { ls('spTheme', k); st.textContent = css(cur()); unpaint(); watch(); }
  function start() {
    if (!document.body) return setTimeout(start, 50);
    watch(); setInterval(function () { if (active()) sweep(); }, 4000);
    try { var W = window.Telegram && Telegram.WebApp; if (W && W.onEvent) W.onEvent('themeChanged', function () { if (ls('spTheme') === 'auto' || !ls('spTheme')) { st.textContent = css(cur()); unpaint(); watch(); } }); } catch (e) {}
  }
  start();

  // ---- 🎨 Mavzu tanlash oynasi (Menyu → Mavzu)
  function picker() {
    var old = document.getElementById('spThSheet'); if (old) { old.remove(); return; }
    var ov = document.createElement('div'); ov.id = 'spThSheet'; ov.setAttribute('data-nott', '1');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
    var k0 = ls('spTheme') || DEF, h = '<div style="width:100%;background:#17133f;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box">' +
      '<div style="display:flex;align-items:center;margin-bottom:12px"><b style="font-size:19px">🎨 Mavzu</b><span id="spThX" style="margin-left:auto;font-size:22px;padding:2px 8px;cursor:pointer">✕</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
    ['auto', 'a', 'b', 'c', 'd'].forEach(function (k) {
      var t = k === 'auto' ? { name: 'Avto', icon: '🌗', bg1: '#f6f7fb', bg2: '#110e33', acc: '#3fa34d' } : T[k];
      h += '<div data-th="' + k + '" style="cursor:pointer;text-align:center">' +
        '<div style="height:96px;border-radius:14px;background:' + (k === 'auto' ? 'linear-gradient(135deg,#f6f7fb 0 50%,#1c1854 50% 100%)' : 'linear-gradient(180deg,' + t.bg1 + ',' + t.bg2 + ')') + ';border:3px solid ' + (k === k0 ? t.acc : 'rgba(255,255,255,.15)') + ';position:relative;overflow:hidden">' +
        '<div style="position:absolute;left:10px;right:10px;top:14px;height:12px;border-radius:6px;background:rgba(255,255,255,.14)"></div>' +
        '<div style="position:absolute;left:10px;right:30px;top:34px;height:10px;border-radius:5px;background:rgba(255,255,255,.08)"></div>' +
        '<div style="position:absolute;left:10px;bottom:12px;width:46px;height:20px;border-radius:8px;background:' + t.acc + '"></div>' +
        (k === k0 ? '<div style="position:absolute;right:8px;bottom:8px;font-size:18px">✅</div>' : '') + '</div>' +
        '<div style="margin-top:6px;font-size:13px;font-weight:600">' + t.icon + ' ' + t.name + (k === 'auto' ? '<br><small style="opacity:.6;font-weight:400">Telegram bo‘yicha</small>' : k === DEF ? '<br><small style="opacity:.6;font-weight:400">standart</small>' : '') + '</div></div>';
    });
    h += '</div><button id="spThBg" style="margin-top:16px;width:100%;border:0;border-radius:12px;padding:13px;background:#2d2775;color:#fff;font-size:15px;font-weight:600">🖼 Fon rasmi va boshqa fonlar</button>' +
      '</div>';
    ov.innerHTML = h; document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov || e.target.id === 'spThX') ov.remove(); };
    ov.querySelector('#spThBg').onclick = function () { ov.remove(); if (window.spBgPicker) window.spBgPicker(); };
    [].forEach.call(ov.querySelectorAll('[data-th]'), function (el) { el.onclick = function () { set(el.getAttribute('data-th')); ov.remove(); }; });
  }
  window.spThemePicker = picker; window.spThemeSet = set;
})();
