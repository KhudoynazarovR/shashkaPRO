;(function(){
  if (window.__tvLink) return; window.__tvLink = 1;
  var st = document.createElement('style'); st.id = 'tvLinkCss';
  st.textContent = '#tvP{z-index:2147483000!important}#tvRem{z-index:2147483100!important}';
  document.head.appendChild(st);

  var sp = window.__tvLinkTid ? 'lbt_' + window.__tvLinkTid : '';
  try { if (!sp) sp = (Telegram.WebApp.initDataUnsafe || {}).start_param || ''; } catch(e){}
  try { if (!sp) sp = new URLSearchParams(Telegram.WebApp.initData || '').get('start_param') || ''; } catch(e){}
  try { if (!sp) sp = new URLSearchParams((location.hash || '').slice(1)).get('tgWebAppStartParam') || ''; } catch(e){}
  try { if (!sp) { var q = new URLSearchParams(location.search); sp = q.get('tgWebAppStartParam') || (q.get('t') ? 'lbt_' + q.get('t') : ''); } } catch(e){}
  if (!/^lbt_/.test(sp)) return;
  var tid = sp.slice(4);

  function findT(){ try { var s = window.__lb && window.__lb.S; if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === tid) return s.tournaments[i]; } catch(e){} return null; }
  var fromLink = false, n = 0;
  var iv = setInterval(function(){
    n++;
    if (findT() && window.tvOpen) {
      clearInterval(iv);
      fromLink = true; window.tvOpen(tid);
      var p = document.getElementById('tvP');
      if (p) new MutationObserver(function(){
        if (fromLink && !p.classList.contains('on')) { fromLink = false; if (window.lbNav) window.lbNav.open('t'); }
      }).observe(p, { attributes: true, attributeFilter: ['class'] });
    } else if (n > 60) clearInterval(iv);
  }, 500);
})();
