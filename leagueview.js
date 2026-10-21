/* LEAGUEVIEW — haftalik ligalar va yutuqlar.
   Bosh sahifada ixcham karta; bosilganda: 🏆 Liga jadvali | 🎖 Yutuqlar. Hafta yakuni va yangi yutuq oynalari. */
;(function () {
  if (window.__lgv) return; window.__lgv = 1;
  var tg = window.Telegram && window.Telegram.WebApp, initData = (tg && tg.initData) || '';
  if (!initData) return;
  var D = null, tab = 'lg', popBusy = false, gone = {}; // gone: yopilgan oynalar (qayta chiqmasin)
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(p, body) { return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); }); }
  function left(ms) { ms = Math.max(0, ms); var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return d ? d + ' kun ' + h + ' soat' : h ? h + ' soat ' + m + ' daq' : m + ' daq'; }
  function T(i) { return (D && D.tiers[i]) || { n: '', ic: '', c: '#fff' }; }

  var st = document.createElement('style'); st.id = 'lgCss';
  st.textContent =
    '#lgCard{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;cursor:pointer;color:#fff;background:linear-gradient(90deg,#2a2470,#3b2f9a);box-shadow:0 3px 0 #0e0b30,inset 0 0 0 1.5px rgba(255,255,255,.12);font-family:system-ui,Roboto,sans-serif;box-sizing:border-box;position:relative}' +
    '#lgCard .f{font-size:30px;flex:none}#lgCard .t{flex:1;min-width:0}#lgCard .t b{display:block;font-size:16px;font-weight:900}#lgCard .t small{font-size:13px;font-weight:700;color:#d6d3ff}#lgCard .a{font-size:26px;flex:none}' +
    '#lgCard .dot{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#e11d48;color:#fff;font:900 13px/22px system-ui;text-align:center;padding:0 5px;box-shadow:0 0 0 2px #1a1650}' +
    '#lgOv{position:fixed;inset:0;z-index:2147482980;background:#120f3a;color:#fff;overflow:auto;font-family:system-ui,Roboto,sans-serif;padding:0 0 90px}' +
    '#lgOv .top{display:flex;align-items:center;gap:10px;padding:12px 14px}#lgOv .top b{flex:1;font-size:20px}#lgOv .top button{border:0;background:#352d86;color:#fff;border-radius:12px;width:42px;height:42px;font-size:18px}' +
    '#lgOv .tabs{display:flex;gap:8px;padding:0 14px 10px}#lgOv .tabs button{flex:1;border:0;border-radius:12px;padding:11px;font:800 15px system-ui;background:#2a2470;color:#bab7e8}#lgOv .tabs button.on{background:#ffcf3f;color:#2a1600}' +
    '#lgOv .hero{margin:0 14px 10px;border-radius:20px;padding:16px;text-align:center;position:relative;overflow:hidden}' +
    '#lgOv .hero .ic{font-size:64px;line-height:1;filter:drop-shadow(0 4px 10px rgba(0,0,0,.4))}#lgOv .hero b{display:block;font-size:24px;margin-top:6px}#lgOv .hero small{display:block;font-size:14px;opacity:.9;margin-top:4px}' +
    '#lgOv .lad{display:flex;justify-content:center;gap:6px;margin-top:12px}#lgOv .lad span{width:42px;height:42px;border-radius:12px;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:22px;filter:grayscale(1);opacity:.45}#lgOv .lad span.on{filter:none;opacity:1;box-shadow:0 0 0 2px #fff}#lgOv .lad span.past{filter:none;opacity:.8}' +
    '#lgOv .cd{margin:0 14px 10px;background:#2a2470;border-radius:16px;padding:12px;box-shadow:0 3px 0 #0e0b30}#lgOv h3{margin:0 0 8px;font-size:16px}' +
    '#lgOv .info{font-size:13px;color:#d6d3ff;line-height:1.5}' +
    '#lgOv .row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:10px}#lgOv .row+.row{margin-top:2px}#lgOv .row .p{width:28px;text-align:center;font-weight:900}#lgOv .row .av{width:34px;height:34px;border-radius:50%;overflow:hidden;background:#1f4fd6;flex:none;display:flex;align-items:center;justify-content:center;font-weight:900}#lgOv .row .av img{width:100%;height:100%;object-fit:cover}' +
    '#lgOv .row .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}#lgOv .row .xp{font-weight:900;color:#ffcf3f}#lgOv .row.up{background:rgba(34,197,94,.14)}#lgOv .row.dn{background:rgba(239,68,68,.14)}#lgOv .row.me{box-shadow:inset 0 0 0 2px #ffcf3f}' +
    '#lgOv .zn{font-size:12px;font-weight:800;padding:6px;text-align:center;border-radius:8px;margin:6px 0}#lgOv .zn.u{color:#4ade80;background:rgba(34,197,94,.1)}#lgOv .zn.d{color:#ff8a8a;background:rgba(239,68,68,.1)}' +
    '#lgOv .xpl{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:14px}#lgOv .xpl b{color:#ffcf3f}' +
    '#lgOv .ach{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 14px}' +
    '#lgOv .ac{background:#2a2470;border-radius:14px;padding:10px 6px;text-align:center;box-shadow:0 3px 0 #0e0b30;position:relative}#lgOv .ac .i{font-size:34px;line-height:1.2;filter:grayscale(1);opacity:.4}#lgOv .ac b{display:block;font-size:12px;margin-top:4px;line-height:1.2}#lgOv .ac small{display:block;font-size:10px;color:#bab7e8;margin-top:3px;line-height:1.2;min-height:24px}' +
    '#lgOv .ac .br{height:5px;background:#141040;border-radius:3px;margin-top:6px;overflow:hidden}#lgOv .ac .br i{display:block;height:100%;background:linear-gradient(90deg,#8b7bff,#5b4bd6)}#lgOv .ac .rw{font-size:11px;color:#ffcf3f;font-weight:800;margin-top:4px}' +
    '#lgOv .ac.got{background:linear-gradient(180deg,#4a3a0a,#2a2470);box-shadow:0 3px 0 #0e0b30,inset 0 0 0 2px #ffcf3f}#lgOv .ac.got .i{filter:none;opacity:1}' +
    '#lgPop{position:fixed;inset:0;z-index:2147483002;background:rgba(5,4,20,.85);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,Roboto,sans-serif}' +
    '#lgPop .bx{width:100%;max-width:360px;border-radius:24px;padding:22px 18px;text-align:center;color:#fff;background:radial-gradient(circle at 50% 0,#5b4bd6,#1a1650 70%);box-shadow:0 0 0 2px rgba(255,207,63,.6),0 10px 40px rgba(0,0,0,.6);animation:lgIn .35s cubic-bezier(.2,1.4,.4,1)}' +
    '@keyframes lgIn{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}' +
    '#lgPop .ic{font-size:84px;line-height:1.1;animation:lgSp 1.6s ease-in-out infinite}@keyframes lgSp{50%{transform:scale(1.08) rotate(-4deg)}}' +
    '#lgPop h2{margin:8px 0 4px;font-size:22px}#lgPop p{margin:4px 0;color:#d6d3ff;font-size:15px}#lgPop .rw{display:inline-block;margin-top:10px;background:#ffcf3f;color:#2a1600;font-weight:900;border-radius:20px;padding:6px 16px;font-size:18px}' +
    '#lgPop button{display:block;width:100%;border:0;border-radius:14px;padding:13px;margin-top:10px;font:900 16px system-ui;color:#fff;background:#352d86}#lgPop button.p{background:linear-gradient(90deg,#f58529,#dd2a7b,#8134af)}';
  document.head.appendChild(st);

  // ---------- bosh sahifa kartasi
  function card() {
    var hero = $('hzHero'); if (!hero || !D) return;
    var c = $('lgCard');
    if (!c) { c = document.createElement('div'); c.id = 'lgCard'; c.onclick = function () { show('lg'); }; hero.appendChild(c); }
    var dq = $('dqCard'); if (dq && dq.parentNode === hero && dq.nextSibling !== c) hero.insertBefore(c, dq.nextSibling);
    c.style.setProperty('order', '0', 'important'); c.style.setProperty('flex', '1 1 100%', 'important'); c.style.setProperty('margin', '0', 'important');
    var t = T(D.tier), tb = D.table, h = '<span class="f">' + t.ic + '</span><div class="t"><b>' + t.n + ' liga' + (tb.rank ? ' · ' + tb.rank + '-o‘rin' : '') + '</b><small>⭐ ' + D.xp + ' XP · 🎖 ' + D.got + '/' + D.ach.length + ' yutuq · ⏳ ' + left(D.ends - Date.now()) + '</small></div><span class="a">›</span>';
    if (c._h !== h) { c._h = h; c.innerHTML = h; }
  }

  // ---------- oyna
  function avHtml(r) { var ini = esc(String(r.name || '?').charAt(0).toUpperCase()); return '<span class="av">' + (r.av ? '<img src="/api/av/' + encodeURIComponent(r.av) + '" onerror="this.parentNode.textContent=\'' + ini.replace(/'/g, '') + '\'">' : ini) + '</span>'; }
  function lgHtml() {
    var t = T(D.tier), tb = D.table, h = '';
    h += '<div class="hero" style="background:linear-gradient(160deg,' + t.c + '55,#2a2470 70%)"><div class="ic">' + t.ic + '</div><b>' + t.n + ' liga</b><small>' + (tb.rank ? tb.rank + '-o‘rin · ' : '') + '⭐ ' + D.xp + ' XP · hafta tugashiga ' + left(D.ends - Date.now()) + '</small>';
    h += '<div class="lad">' + D.tiers.map(function (x, i) { return '<span class="' + (i === D.tier ? 'on' : i < D.tier ? 'past' : '') + '" title="' + x.n + '">' + x.ic + '</span>'; }).join('') + '</div></div>';
    h += '<div class="cd info">' + (tb.up ? '▲ <b>TOP-' + tb.up + '</b> ' + T(D.tier + 1).n + ' ligaga ko‘tariladi. ' : (D.tier >= D.tiers.length - 1 ? '👑 Eng yuqori liga! ' : '▲ Kamida 2 kishi bo‘lsa, eng yaxshilar ko‘tariladi. ')) + (tb.dn ? '▼ Oxirgi <b>' + tb.dn + '</b> kishi pastga tushadi. ' : '') + '<br>🏆 Hafta yakunida TOP-3: <b>' + D.prize.join(' / ') + '</b> 🪙</div>';
    h += '<div class="cd"><h3>📋 Ligadagilar (' + tb.n + ')</h3>';
    if (!tb.rows.length || (tb.rows.length === 1 && !tb.rows[0].xp)) h += '<div class="info">Bu hafta hali hech kim ochko to‘plamadi. Birinchi bo‘ling — o‘ynang, masala yeching, vazifalarni bajaring!</div>';
    var n = tb.n;
    tb.rows.forEach(function (r, i) {
      if (tb.up && r.p === tb.up + 1 && i) h += '<div class="zn u">▲ Ko‘tarilish chizig‘i</div>';
      if (tb.dn && r.p === n - tb.dn + 1 && i) h += '<div class="zn d">▼ Tushish chizig‘i</div>';
      var cls = 'row' + (tb.up && r.p <= tb.up ? ' up' : '') + (tb.dn && r.p > n - tb.dn && r.xp > 0 ? ' dn' : '') + (r.me ? ' me' : '');
      h += '<div class="' + cls + '"><span class="p">' + (r.p <= 3 && r.xp > 0 ? ['🥇', '🥈', '🥉'][r.p - 1] : r.p) + '</span>' + avHtml(r) + '<span class="nm">' + esc(r.name) + (r.me ? ' (siz)' : '') + '</span><span class="xp">' + r.xp + '</span></div>';
    });
    h += '</div>';
    var X = D.xpTable, NM = { game: '🎮 O‘yin o‘ynash', win: '🏆 G‘alaba (qo‘shimcha)', bot: '🤖 Botni yutish (qo‘shimcha)', puzzle: '🧩 Masala yechish', petrova: '📗 Kunlik Petrova (qo‘shimcha)', rush: '⚡ Puzzle Rush', battle: '⚔️ Masala jangi', q_claim: '🎯 Vazifa bajarish', q_bonus: '🧰 Sandiq', streak_claim: '🔥 Kunlik sovg‘a' };
    h += '<div class="cd"><h3>⭐ XP qanday yig‘iladi</h3><div class="xpl">' + Object.keys(NM).filter(function (k) { return X[k]; }).map(function (k) { return '<span>' + NM[k] + '</span><b>+' + X[k] + '</b>'; }).join('') + '</div></div>';
    return h;
  }
  function achHtml() {
    var h = '<div class="cd info" style="text-align:center">🎖 <b>' + D.got + ' / ' + D.ach.length + '</b> yutuq ochildi · har biri uchun tanga</div><div class="ach">';
    D.ach.slice().sort(function (a, b) { return (b.got ? 1 : 0) - (a.got ? 1 : 0); }).forEach(function (a) {
      h += '<div class="ac' + (a.got ? ' got' : '') + '"><div class="i">' + a.ic + '</div><b>' + esc(a.t) + '</b><small>' + esc(a.d) + '</small>' +
        (a.got ? '<div class="rw">✅ +' + a.r + ' 🪙</div>' : '<div class="br"><i style="width:' + Math.round(a.v / Math.max(1, a.n) * 100) + '%"></i></div><div class="rw">' + a.v + '/' + a.n + ' · +' + a.r + '</div>') + '</div>';
    });
    return h + '</div>';
  }
  function render() {
    var ov = $('lgOv'); if (!ov || !D) return;
    ov.innerHTML = '<div class="top"><b>' + (tab === 'lg' ? '🏆 Haftalik liga' : '🎖 Yutuqlar') + '</b><button id="lgX">✕</button></div><div class="tabs"><button data-t="lg" class="' + (tab === 'lg' ? 'on' : '') + '">🏆 Liga</button><button data-t="ach" class="' + (tab === 'ach' ? 'on' : '') + '">🎖 Yutuqlar</button></div>' + (tab === 'lg' ? lgHtml() : achHtml());
    ov.querySelector('#lgX').onclick = hide;
    Array.prototype.forEach.call(ov.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); render(); ov.scrollTop = 0; }; });
  }
  function show(t) { tab = t || 'lg'; if (!$('lgOv')) { var ov = document.createElement('div'); ov.id = 'lgOv'; document.body.appendChild(ov); } render(); load(); }
  function hide() { var ov = $('lgOv'); if (ov) ov.remove(); }
  window.lgOpen = show;

  // ---------- hafta yakuni / yangi yutuq oynasi
  function pop(html, onOk, share) {
    popBusy = true;
    var p = document.createElement('div'); p.id = 'lgPop'; p.innerHTML = '<div class="bx">' + html + (share ? '<button class="p" id="lgPS">📸 Ulashish</button>' : '') + '<button id="lgPO">👍 Zo‘r!</button></div>';
    document.body.appendChild(p);
    try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    p.querySelector('#lgPO').onclick = function () { p.remove(); popBusy = false; onOk(); setTimeout(popups, 400); };
    if (share) p.querySelector('#lgPS').onclick = function () { if (window.spShareCard) window.spShareCard(share); };
  }
  function popups() {
    if (!D || popBusy || $('dqOv') || $('lgPop') || document.querySelector('#spRush,#spBattle,#shOv')) return;
    var L = D.last && !gone['w' + D.last.w] ? D.last : null;
    if (L) {
      var nt = T(L.nt), ot = T(L.tier);
      var head = L.res === 'up' ? '🎉 ' + nt.n + ' ligaga ko‘tarildingiz!' : L.res === 'down' ? '⬇️ ' + nt.n + ' ligaga tushdingiz' : ot.n + ' ligada qoldingiz';
      return pop('<div class="ic">' + (L.res === 'up' ? nt.ic : L.place <= 3 ? ['🥇', '🥈', '🥉'][L.place - 1] : ot.ic) + '</div><h2>Hafta yakunlandi!</h2><p>' + ot.n + ' ligada <b>' + L.place + '-o‘rin</b> (' + L.of + ' kishi) · ⭐ ' + L.xp + ' XP</p><p><b>' + head + '</b></p>' + (L.reward ? '<div class="rw">+' + L.reward + ' 🪙</div>' : ''),
        function () { gone['w' + L.w] = 1; D.last = null; api('/api/league/seen', { last: 1 }); },
        { theme: 'pzt', title: '🏆 HAFTALIK LIGA', big: L.place <= 3 ? ['🥇', '🥈', '🥉'][L.place - 1] : L.place + '-o‘rin', unit: ot.n + ' liga · ' + L.of + ' ishtirokchi', badge: L.res === 'up' ? nt.n + ' ligaga ko‘tarildim!' : '', sub: '⭐ ' + L.xp + ' XP', cap: '🏆 ShashkaPRO haftalik ligasida ' + L.place + '-o‘rin!' });
    }
    D.newAch = (D.newAch || []).filter(function (a) { return !gone['a' + a.id]; });
    var A = D.newAch[0];
    if (A) {
      return pop('<div class="ic">' + A.ic + '</div><h2>Yangi yutuq!</h2><p><b>' + esc(A.t) + '</b></p><p>' + esc(A.d) + '</p><div class="rw">+' + A.r + ' 🪙</div>',
        function () { gone['a' + A.id] = 1; D.newAch.shift(); if (!D.newAch.length) api('/api/league/seen', { ach: 1 }); card(); },
        { theme: 'win', title: '🎖 YANGI YUTUQ', big: A.ic, unit: A.t, sub: A.d, cap: '🎖 ShashkaPRO’da «' + A.t + '» yutug‘ini oldim!' });
    }
  }

  function load() {
    return api('/api/league').then(function (x) {
      if (!x || x.error) return;
      var keepNew = D && D.newAch && D.newAch.length && popBusy ? D.newAch : null;
      D = x; if (keepNew) D.newAch = keepNew;
      card(); if ($('lgOv')) render();
      setTimeout(popups, 600);
    }).catch(function () {});
  }
  setTimeout(load, 1500);
  setInterval(function () { card(); popups(); }, 3000);
  setInterval(load, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
