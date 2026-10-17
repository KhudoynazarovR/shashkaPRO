(function () {
  if (window.__uzc) return; window.__uzc = true;
  var st = document.createElement('style');
  st.textContent = '#uzc{position:fixed;top:0;left:0;right:0;z-index:99990;height:22px;display:flex;align-items:center;justify-content:center;font:600 12px/1 system-ui,sans-serif;color:#cfd2ff;background:rgba(13,10,46,.94);pointer-events:none}body{padding-top:22px!important}';
  document.head.appendChild(st);
  var el = document.createElement('div'); el.id = 'uzc'; document.body.appendChild(el);
  var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function tick() {
    var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    el.textContent = '\uD83C\uDDFA\uD83C\uDDFF ' + p.day + '.' + p.month + '.' + p.year + '  \u00B7  ' + p.hour + ':' + p.minute + ':' + p.second;
  }
  tick(); setInterval(tick, 1000);
})();
