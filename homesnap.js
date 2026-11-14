/* homesnap.js — ilova ochilganda bosh sahifa «sakramasin».
   Server bu faylni index.html dagi body teg boshiga ichki skript qilib qo'yadi (alohida so'rov yo'q).
   1) Oxirgi marta ko'rilgan bosh sahifa (HTML + uslublar) telefonda saqlanadi. Qayta ochilganda u darhol
      tayyor holda ko'rsatiladi (alohida iframe ichida — haqiqiy sahifa elementlariga tegmaydi).
   2) Saqlangan nusxa bo'lmasa — bloklar joyida xira shakllar turadi.
   Haqiqiy bosh sahifa to'liq yig'ilib, joyidan siljimay qolganda (0.7 s) parda yumshoq olib tashlanadi.
   Barmoq tekkizilsa parda darhol olinadi. Havola orqali kirilsa (xona, masala) ishlamaydi. */
(function () {
  try {
    var W = window, D = document, LS; try { LS = W.localStorage; } catch (e) { return; }
    if (!LS || !D.body || /[?&](emb|pad)=1/.test(location.search)) return;
    var tg = W.Telegram && W.Telegram.WebApp, un = (tg && tg.initDataUnsafe) || {};
    var sp = un.start_param || new URLSearchParams(location.search).get('tgWebAppStartParam') || '';
    if (sp) return;
    var K = 'spSnap1:' + ((un.user && un.user.id) || 'g'), snap = null;
    try { snap = JSON.parse(LS.getItem(K) || 'null'); } catch (e) { snap = null; }
    if (snap && !(snap.t > Date.now() - 5 * 864e5)) snap = null;

    var ov = D.createElement('div'); ov.id = 'spSnapOv';
    ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;height:100dvh;z-index:2147483600;background:' + ((snap && snap.bg) || '#16124a') + ';transition:opacity .18s;overflow:hidden';
    if (snap) {
      var f = D.createElement('iframe');
      f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
      f.style.cssText = 'border:0;width:100%;height:100%;display:block;pointer-events:none;background:transparent';
      f.srcdoc = '<!doctype html><ht' + 'ml' + snap.ha + '><he' + 'ad><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="' + location.origin + '/"><style>' + snap.css + '</style></he' + 'ad><bo' + 'dy' + snap.ba + '>' + snap.html + '</bo' + 'dy></ht' + 'ml>';   // teglar bo'lib yozilgan: server index.html dagi teglarni almashtiradi
      f.onload = function () { try { var d = f.contentDocument, p = d.getElementById('lbPanel'); if (p) p.scrollTop = snap.ps || 0; f.contentWindow.scrollTo(0, snap.sy || 0); } catch (e) {} };
      ov.appendChild(f);
    } else {
      var sk = 'background:rgba(255,255,255,.07);border-radius:18px;margin-bottom:12px';
      ov.innerHTML = '<style>@keyframes spSkP{50%{opacity:.55}}#spSnapOv .sk{animation:spSkP 1.2s ease-in-out infinite}</style><div style="padding:14px 12px">'
        + '<div class="sk" style="' + sk + ';height:104px"></div><div class="sk" style="' + sk + ';height:92px"></div><div class="sk" style="' + sk + ';height:150px"></div>'
        + '<div style="display:flex;gap:10px"><div class="sk" style="' + sk + ';flex:1;height:90px"></div><div class="sk" style="' + sk + ';flex:1;height:90px"></div></div>'
        + '<div class="sk" style="' + sk + ';height:26px;width:40%"></div><div style="display:flex;gap:8px">' + '<div class="sk" style="' + sk + ';flex:1;height:96px"></div>'.repeat(5) + '</div></div>'
        + '<div style="position:absolute;left:0;right:0;bottom:0;height:64px;background:rgba(0,0,0,.25)"></div>';
    }
    var gone = false;
    function hide(fast) {
      if (gone) return; gone = true;
      if (fast) { if (ov.parentNode) ov.parentNode.removeChild(ov); return; }
      ov.style.opacity = '0'; setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
    }
    ov.addEventListener('touchstart', function () { hide(true); }, { passive: true });
    ov.addEventListener('mousedown', function () { hide(true); });
    D.documentElement.appendChild(ov);   // html ichiga: body bolalarini boshqa skriptlar ko'chiradi

    // haqiqiy bosh sahifa joyidan siljimay qoldimi
    var t0 = Date.now(), last = '', since = 0;
    var iv = setInterval(function () {
      if (gone) { clearInterval(iv); return; }
      var h = D.getElementById('hzHero'), p = D.getElementById('lbPanel'), done = Date.now() - t0 > 8000 || !!D.getElementById('rcFrameOv');
      if (!done && h && p && h.offsetParent) {
        var sig = [].map.call(h.children, function (c) { var r = c.getBoundingClientRect(); return Math.round(r.top) + ':' + Math.round(r.height); }).join(',') + '|' + p.scrollHeight;
        if (sig !== last) { last = sig; since = Date.now(); } else if (h.children.length > 2 && Date.now() - since > 700) done = true;
      }
      if (done) { clearInterval(iv); hide(); setTimeout(save, 1500); }
    }, 150);

    // bosh sahifa ko'rinib turganda nusxasini saqlash
    function attrs(el) { return [].map.call(el.attributes, function (a) { return ' ' + a.name + '="' + String(a.value).replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"'; }).join(''); }
    function save() {
      try {
        if (D.getElementById('spSnapOv') || D.getElementById('rcFrameOv') || D.hidden && arguments[0] !== 1) return;
        var h = D.getElementById('hzHero'), p = D.getElementById('lbPanel'); if (!h || !p || !h.offsetParent) return;
        var el = D.elementFromPoint(innerWidth / 2, innerHeight / 2); if (!el || !el.closest || !el.closest('#lbPanel')) return;
        var css = [].map.call(D.querySelectorAll('style'), function (s) { return s.textContent; }).join('\n');
        var b = D.body.cloneNode(true);
        [].forEach.call(b.querySelectorAll('script,iframe,#spSnapOv,noscript'), function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
        var html = b.innerHTML;
        if (css.length + html.length > 1500000) return;
        var o = { t: Date.now(), css: css.replace(/<\/style/gi, '<\\/style'), html: html, ha: attrs(D.documentElement), ba: attrs(D.body), sy: W.scrollY || 0, ps: p.scrollTop || 0, bg: getComputedStyle(D.body).backgroundColor };
        try { LS.setItem(K, JSON.stringify(o)); } catch (e) { try { LS.removeItem(K); } catch (e2) {} }
      } catch (e) {}
    }
    setInterval(function () { if (!D.hidden) save(); }, 20000);
    D.addEventListener('visibilitychange', function () { if (D.hidden) save(1); });
    W.addEventListener('pagehide', function () { save(1); });
  } catch (e) {}
})();
