(function () {
  try {
    var tg = window.Telegram && Telegram.WebApp, sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
    var tap5 = 0, tapT = 0; document.addEventListener('click', function (e) { if (e.clientX < 70 && e.clientY < 70) { var n = Date.now(); tap5 = (n - tapT < 800) ? tap5 + 1 : 1; tapT = n; if (tap5 >= 5) { tap5 = 0; try { localStorage.setItem('spPerf', localStorage.getItem('spPerf') === '1' ? '0' : '1'); } catch (er) {} location.reload(); } } }, true);
    var _on = false; try { _on = localStorage.getItem('spPerf') === '1'; } catch (er) {}
    if (sp !== 'perf' && !_on && !/[?&]perf=1/.test(location.search)) return;
    var rows = [], box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:6px;right:6px;top:60px;z-index:2147483647;background:#000d;color:#7CFC00;font:12px monospace;padding:8px;border-radius:8px;max-height:75vh;overflow:auto;white-space:pre-wrap';
    box.onclick = function () { box.remove(); };
    document.body.appendChild(box);
    function say(t) { rows.push(t); box.textContent = rows.join('\n'); }
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) { say('server javobi (TTFB): ' + Math.round(nav.responseStart) + ' ms'); say('HTML yuklandi: ' + Math.round(nav.responseEnd) + ' ms'); say('DOM tayyor: ' + Math.round(nav.domContentLoadedEventEnd) + ' ms'); }
    say('perf.js ishga tushdi: ' + Math.round(performance.now()) + ' ms');
    function rep() {
      say('--- sahifa to‘liq yuklandi: ' + Math.round(performance.now()) + ' ms');
      var r = performance.getEntriesByType('resource'), api = r.filter(function (x) { return x.initiatorType === 'fetch' || x.initiatorType === 'xmlhttprequest'; });
      say('API so‘rovlar soni: ' + api.length);
      api.sort(function (a, b) { return b.duration - a.duration; }).slice(0, 6).forEach(function (x) { say(Math.round(x.duration) + ' ms  ' + x.name.replace(location.origin, '').slice(0, 45)); });
      say('--- eng sekin fayllar');
      r.sort(function (a, b) { return b.duration - a.duration; }).slice(0, 5).forEach(function (x) { say(Math.round(x.duration) + ' ms  ' + Math.round((x.transferSize || 0) / 1024) + ' KB  ' + x.name.replace(location.origin, '').slice(0, 40)); });
      say('(yopish: bosing)');
    }
    setTimeout(rep, 6000);
  } catch (e) {}
})();
