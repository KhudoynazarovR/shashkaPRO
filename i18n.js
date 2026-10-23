/* i18n.js — ShashkaPRO tillari: O‘zbek (asl), Русский, English.
   Ilova matnlari o‘zbekcha yozilgan; bu fayl tanlangan tilga qarab sahifadagi matnlarni
   (va alert/confirm/prompt, Telegram oynalarini) lug‘at bo‘yicha almashtiradi.
   Lug‘at: i18n-ru.js / i18n-en.js (faqat kerak bo‘lganda yuklanadi).
   index.html da telegram-web-app.js va webauth.js dan KEYIN, boshqa skriptlardan OLDIN. */
(function () {
  var W = window, KEY = 'spLang', LANGS = { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function detect() {
    var s = ls(KEY); if (LANGS[s]) return s;
    var tg = W.Telegram && W.Telegram.WebApp, u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    var c = String((u && u.language_code) || (navigator.language || '')).toLowerCase().slice(0, 2);
    if (c === 'uz') return 'uz';
    if (/^(ru|uk|be|kk|ky|tg|az|hy|ka|tk)$/.test(c)) return 'ru';
    if (tg && tg.initData) return 'uz'; // Telegram ichida boshqa tillar — o‘zbekcha (asosiy auditoriya)
    return c ? 'en' : 'uz';
  }
  var L = detect();
  W.SP_LANG = L;
  try { document.documentElement.lang = L; } catch (e) {}
  // eski tahlil taxtasi (index.html) o‘z tilini sp_s2.lang dan oladi
  try { var s2 = JSON.parse(ls('sp_s2') || '{}'); if (s2.lang !== L) { s2.lang = L; ls('sp_s2', JSON.stringify(s2)); } } catch (e) {}

  W.spSetLang = function (l) { if (!LANGS[l]) return; ls(KEY, l); W.location.reload(); };
  W.spLangPicker = function () {
    var old = document.getElementById('spLangSheet'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'spLangSheet'; ov.setAttribute('data-noi18n', '1');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482600;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';
    var h = '<div style="width:100%;background:#141040;color:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:system-ui,sans-serif">' +
      '<div style="display:flex;align-items:center;margin-bottom:10px"><b style="font-size:20px">🌐 Til · Язык · Language</b><span data-x="1" style="margin-left:auto;font-size:24px;padding:4px 8px;cursor:pointer">✕</span></div>';
    var fl = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' };
    for (var k in LANGS) h += '<div data-l="' + k + '" style="display:flex;align-items:center;gap:14px;padding:15px 4px;border-bottom:1px solid #26305a;cursor:pointer;font-size:18px">' +
      '<span style="font-size:26px">' + fl[k] + '</span><b style="flex:1">' + LANGS[k] + '</b>' + (k === L ? '<span style="color:#7ee081;font-size:22px">✓</span>' : '') + '</div>';
    ov.innerHTML = h + '</div>';
    ov.onclick = function (e) {
      var t = e.target.closest ? e.target.closest('[data-l],[data-x]') : null;
      if (e.target === ov || (t && t.getAttribute('data-x'))) return ov.remove();
      if (t) { var l = t.getAttribute('data-l'); ov.remove(); if (l !== L) W.spSetLang(l); }
    };
    (document.body || document.documentElement).appendChild(ov);
  };
  W.spLangName = function () { return LANGS[L]; };
  W.spT = function (s) { return s; };
  if (L === 'uz') return;

  var M = null, FR = null, RU = [], cache = new Map();
  // tarjima qilinmagan qism o'zbekcha ekanini bildiruvchi belgilar/so'zlar
  var UZW = /[‘ʻ’]|\b(ta|va|bilan|uchun|yoki|kun|bu|shu|siz|sizni|sizga|sizda|emas|bor|hali|yana|qiling|bosing|kiring|yeching|o'ynang|yuting|qoldi|kerak|mumkin|bo'ldi|bo'lsin|qildi|keyin|oldin|hozir|ham)\b/i;
  var LETTER = /[A-Za-z]/;
  function tr(s) {
    if (!M || s == null) return null;
    var t = String(s).replace(/\s+/g, ' ').trim();
    if (t.length < 2 || !LETTER.test(t)) return null;
    if (cache.has(t)) return cache.get(t);
    var r = null;
    if (Object.prototype.hasOwnProperty.call(M, t)) r = M[t];
    else {
      if (/\d/.test(t)) {
        var nums = [], k = t.replace(/\d+/g, function (m) { nums.push(m); return '#'; });
        if (Object.prototype.hasOwnProperty.call(M, k)) { var i = 0; r = M[k].replace(/#/g, function () { return nums[i++] || ''; }); }
      }
      if (r === null) { // qisman: qoidalar + ma'lum bo'laklar; qolgan qismida o'zbekcha qolsa — tarjima qilmaymiz
        var x = t, hit = false;
        for (var q = 0; q < RU.length; q++) { var y = x.replace(RU[q][0], '\u0001' + RU[q][1] + '\u0002'); if (y !== x) { x = y; hit = true; } }
        if (FR) x = x.replace(FR, function (m) { if (!Object.prototype.hasOwnProperty.call(M, m)) return m; hit = true; return '\u0001' + M[m] + '\u0002'; });
        if (hit) {
          var rest = x.replace(/\u0001[^\u0002]*\u0002/g, ' ');
          if (!UZW.test(rest)) r = x.replace(/[\u0001\u0002]/g, '');
        }
      }
    }
    if (cache.size > 8000) cache.clear();
    cache.set(t, r);
    return r;
  }
  function trKeep(s) { // bosh/oxirdagi bo‘sh joylarni saqlab tarjima
    var r = tr(s); if (r === null || r === undefined) return null;
    var a = /^\s*/.exec(s)[0], b = /\s*$/.exec(s)[0];
    return a + r + b;
  }
  function trText(s) { // ko‘p qatorli xabarlar (alert/confirm)
    if (typeof s !== 'string') return s;
    var whole = trKeep(s); if (whole !== null) return whole;
    return s.split('\n').map(function (ln) { var r = trKeep(ln); return r === null ? ln : r; }).join('\n');
  }
  W.spT = function (s) { var r = trKeep(String(s)); return r === null ? s : r; };

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1 };
  function skipEl(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName] || e.isContentEditable || e.hasAttribute('data-noi18n')) return true;
    }
    return false;
  }
  function doText(n) {
    var v = n.nodeValue; if (!v || v.length < 2) return;
    var r = trKeep(v); if (r !== null && r !== v && !skipEl(n.parentNode)) n.nodeValue = r;
  }
  var ATTR = ['placeholder', 'title', 'aria-label'];
  function doAttrs(el) {
    for (var i = 0; i < ATTR.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTR[i]);
      if (v) { var r = trKeep(v); if (r !== null && r !== v) el.setAttribute(ATTR[i], r); }
    }
    if (el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type) && el.value) { var r2 = trKeep(el.value); if (r2 !== null && r2 !== el.value) el.value = r2; }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skipEl(root)) return; doAttrs(root); }
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) { return n.nodeType === 1 && (SKIP[n.tagName] || n.hasAttribute('data-noi18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    }), n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  var Q = [], pend = false;
  function flush() {
    pend = false; var q = Q; Q = [];
    for (var i = 0; i < q.length; i++) { var n = q[i]; if (n.isConnected !== false) walk(n); }
    if (document.title) { var t = trKeep(document.title); if (t !== null && t !== document.title) document.title = t; }
  }
  function push(n) { Q.push(n); if (!pend) { pend = true; (W.queueMicrotask || setTimeout)(flush); } }

  function wrapDialogs() {
    ['alert', 'confirm', 'prompt'].forEach(function (f) {
      var o = W[f]; if (!o || o.__i18n) return;
      var w = function (m, d) { return o.call(W, trText(m), d); }; w.__i18n = 1; W[f] = w;
    });
    var tg = W.Telegram && W.Telegram.WebApp; if (!tg || tg.__i18n) return;
    try {
      tg.__i18n = 1;
      ['showAlert', 'showConfirm'].forEach(function (f) { var o = tg[f]; if (typeof o === 'function') tg[f] = function (m, cb) { return o.call(tg, trText(m), cb); }; });
      var sp = tg.showPopup; if (typeof sp === 'function') tg.showPopup = function (p, cb) {
        try { p = Object.assign({}, p); if (p.title) p.title = trText(p.title); if (p.message) p.message = trText(p.message);
          if (p.buttons) p.buttons = p.buttons.map(function (b) { b = Object.assign({}, b); if (b.text) b.text = trText(b.text); return b; }); } catch (e) {}
        return sp.call(tg, p, cb);
      };
    } catch (e) {}
  }

  W.SPI18N = function (dict, rules) {
    M = dict;
    RU = (rules || []).map(function (r) { try { return [new RegExp(r[0], 'g'), r[1]]; } catch (e) { return null; } }).filter(Boolean);
    var keys = Object.keys(M).filter(function (k) { return k.indexOf('#') < 0 && LETTER.test(k) && (k.length >= 6 || / /.test(k)); })
      .sort(function (a, b) { return b.length - a.length; })
      .map(function (k) { return k.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); });
    try { FR = new RegExp('(?<![\\p{L}\\p{N}‘’ʻ\'])(?:' + keys.join('|') + ')(?![\\p{L}\\p{N}‘’ʻ\'])', 'gu'); }
    catch (e) { try { FR = new RegExp('(?:' + keys.join('|') + ')', 'g'); } catch (e2) { FR = null; } }
    wrapDialogs();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') push(m.target);
        else if (m.type === 'attributes') push(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) push(m.addedNodes[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
    push(document.documentElement);
    document.addEventListener('DOMContentLoaded', function () { wrapDialogs(); push(document.documentElement); });
    W.addEventListener('load', wrapDialogs);
  };
  // lug‘atni sahifa tahlil qilinayotgan paytda sinxron yuklaymiz (matnlar o‘zbekcha "miltillamasligi" uchun)
  var src = '/i18n-' + L + '.js?v=6';
  if (document.readyState === 'loading') document.write('<script src="' + src + '"><\/script>');
  else { var sc = document.createElement('script'); sc.src = src; document.head.appendChild(sc); }
})();
