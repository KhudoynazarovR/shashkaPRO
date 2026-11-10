(function () {
  try {
    var tg = window.Telegram && Telegram.WebApp, sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
    try { if (sp !== 'perf' && localStorage.getItem('spPerfOff') === '1') return; } catch (e) {}
    var t0 = Date.now(), shown = false;
    function show() {
      if (shown) return; shown = true;
      var rows = [], nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        rows.push('server javobi (TTFB): ' + Math.round(nav.responseStart) + ' ms');
        rows.push('HTML yuklandi: ' + Math.round(nav.responseEnd) + ' ms');
        rows.push('DOM tayyor: ' + Math.round(nav.domContentLoadedEventEnd) + ' ms');
        rows.push('sahifa tayyor (load): ' + Math.round(nav.loadEventEnd) + ' ms');
      }
      var c = navigator.connection;
      if (c) rows.push('tarmoq: ' + (c.effectiveType || '?') + ' · ' + (c.downlink || '?') + ' Mbit/s · rtt ' + (c.rtt || '?') + ' ms');
      rows.push('hozir: ' + Math.round(performance.now()) + ' ms');
      var r = performance.getEntriesByType('resource'), tot = 0, cached = 0;
      r.forEach(function (x) { tot += x.transferSize || 0; if (!x.transferSize) cached++; });
      rows.push('fayllar: ' + r.length + ' ta · yuklangan ' + Math.round(tot / 1024) + ' KB · keshdan ' + cached + ' ta');
      var api = r.filter(function (x) { return x.initiatorType === 'fetch' || x.initiatorType === 'xmlhttprequest'; });
      rows.push('--- API so‘rovlar: ' + api.length + ' ta');
      api.sort(function (a, b) { return b.duration - a.duration; }).slice(0, 6).forEach(function (x) { rows.push(Math.round(x.duration) + ' ms  ' + x.name.replace(location.origin, '').slice(0, 42)); });
      rows.push('--- eng sekin fayllar');
      r.sort(function (a, b) { return b.duration - a.duration; }).slice(0, 5).forEach(function (x) { rows.push(Math.round(x.duration) + ' ms  ' + Math.round((x.transferSize || 0) / 1024) + ' KB  ' + x.name.replace(location.origin, '').slice(0, 36)); });
      var box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:6px;right:6px;top:60px;z-index:2147483647;background:#000e;color:#7CFC00;font:12px monospace;padding:8px;border-radius:8px;max-height:78vh;overflow:auto';
      var pre = document.createElement('pre'); pre.style.cssText = 'margin:0 0 8px;white-space:pre-wrap'; pre.textContent = rows.join('\n'); box.appendChild(pre);
      function btn(t, f) { var b = document.createElement('button'); b.textContent = t; b.style.cssText = 'margin-right:8px;padding:8px 12px;border:0;border-radius:8px;background:#333;color:#fff;font-size:13px'; b.onclick = f; box.appendChild(b); }
      btn('Yopish', function () { box.remove(); });
      btn('O‘chirish', function () { try { localStorage.setItem('spPerfOff', '1'); } catch (e) {} box.remove(); });
      document.body.appendChild(box);
    }
    if (sp === 'perf') { setTimeout(show, 6000); return; }
    var n = 0, iv = setInterval(function () {
      n++;
      if (window.__isAdmin) { clearInterval(iv); setTimeout(show, Math.max(0, 6000 - (Date.now() - t0))); }
      else if (n > 30) clearInterval(iv);
    }, 500);
  } catch (e) {}
})();
