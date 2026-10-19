;(function(){
  if (window.__tvLink) return; window.__tvLink = 1;
  var st = document.createElement('style'); st.id = 'tvLinkCss';
  st.textContent = '#tvP{z-index:2147483000!important}#tvRem{z-index:2147483100!important}';
  document.head.appendChild(st);

  var sp = '';
  try { sp = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) || ''; } catch(e){}
  if (!sp) { try { var q = new URLSearchParams(location.search); sp = q.get('tgWebAppStartParam') || (q.get('t') ? 'lbt_' + q.get('t') : ''); } catch(e){} }
  if (!/^lbt_/.test(sp)) return;
  var tid = sp.slice(4), key = 'tvLinkDone_' + tid;
  try { if (sessionStorage.getItem(key)) return; } catch(e){}

  function findT(){ try { var s = window.__lb && window.__lb.S; if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === tid) return s.tournaments[i]; } catch(e){} return null; }
  var fromLink = false, n = 0;
  var iv = setInterval(function(){
    n++;
    if (findT() && window.tvOpen) {
      clearInterval(iv);
      try { sessionStorage.setItem(key, '1'); } catch(e){}
      fromLink = true; window.tvOpen(tid);
      var p = document.getElementById('tvP');
      if (p) new MutationObserver(function(){
        if (fromLink && !p.classList.contains('on')) { fromLink = false; if (window.lbNav) window.lbNav.open('t'); }
      }).observe(p, { attributes: true, attributeFilter: ['class'] });
    } else if (n > 60) clearInterval(iv);
  }, 500);
})();
