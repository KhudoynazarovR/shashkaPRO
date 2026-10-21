/* STATSVIEW — admin statistikasi: faol o'yinchilar, qaytish (retention), kunlik voqealar, eslatmalar */
;(function () {
  if (window.spStats) return;
  var tg = window.Telegram && window.Telegram.WebApp, initData = (tg && tg.initData) || '';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var EV = [['game', '🎮 O‘yinlar'], ['win', '🏆 G‘alabalar'], ['puzzle', '🧩 Yechilgan masalalar'], ['petrova', '📗 Kunlik Petrova'], ['rush', '⚡ Rush'], ['battle', '⚔️ Masala jangi'],
    ['q_claim', '🎯 Olingan vazifalar'], ['q_bonus', '🧰 Sandiqlar'], ['streak_claim', '🔥 Seriya sovg‘alari'], ['share', '📸 Ulashishlar'],
    ['ntf_streak', '🔔 Eslatma: seriya'], ['ntf_back', '🔔 Eslatma: qayting'], ['open_ntf_streak', '👆 Ochildi: seriya'], ['open_ntf_back', '👆 Ochildi: qayting'], ['ntf_blocked', '🚫 Xabar yetmadi']];
  function css() {
    if (document.getElementById('stCss')) return;
    var s = document.createElement('style'); s.id = 'stCss';
    s.textContent = '#stOv{position:fixed;inset:0;z-index:2147482990;background:#120f3a;color:#fff;overflow:auto;padding:14px 14px 90px;box-sizing:border-box;font-family:system-ui,Roboto,sans-serif}' +
      '#stOv .hd{display:flex;align-items:center;gap:10px;margin-bottom:12px}#stOv .hd b{flex:1;font-size:21px}#stOv .hd button{border:0;background:#352d86;color:#fff;border-radius:12px;width:42px;height:42px;font-size:18px}' +
      '#stOv .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}#stOv .kp div{background:#2a2470;border-radius:14px;padding:10px 4px;text-align:center;box-shadow:0 3px 0 #0e0b30}#stOv .kp b{display:block;font-size:22px}#stOv .kp small{font-size:11px;color:#bab7e8}' +
      '#stOv .cd{background:#2a2470;border-radius:16px;padding:12px;margin-bottom:10px;box-shadow:0 3px 0 #0e0b30}#stOv h3{margin:0 0 10px;font-size:16px}' +
      '#stOv .ch{display:flex;align-items:flex-end;gap:4px;height:110px;padding-top:16px}#stOv .ch div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:10px;color:#bab7e8}#stOv .ch i{display:block;width:100%;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#8b7bff,#5b4bd6);min-height:2px}#stOv .ch span{margin-top:3px}#stOv .ch em{font-style:normal;color:#fff;font-weight:700;margin-bottom:2px}' +
      '#stOv table{width:100%;border-collapse:collapse;font-size:13px}#stOv th{color:#bab7e8;font-weight:600;text-align:right;padding:6px 4px;border-bottom:1px solid #4a42a0}#stOv th:first-child,#stOv td:first-child{text-align:left}#stOv td{text-align:right;padding:7px 4px;border-bottom:1px solid #352d86}' +
      '#stOv .stG{color:#4ade80}#stOv .stY{color:#ffcf3f}#stOv .stR{color:#ff8a8a}#stOv .mu{font-size:12px;color:#bab7e8;margin-top:6px;line-height:1.4}';
    document.head.appendChild(s);
  }
  function pc(v) { if (v == null) return '<span style="opacity:.4">—</span>'; return '<span class="' + (v >= 40 ? 'stG' : v >= 20 ? 'stY' : 'stR') + '">' + v + '%</span>'; }
  function dm(d) { var p = d.split('-'); return p[2] + '.' + p[1]; }
  function render(ov, x) {
    var h = '<div class="hd"><b>📊 Statistika</b><button id="stR">🔄</button><button id="stX">✕</button></div>';
    h += '<div class="kp"><div><b>' + x.total + '</b><small>Jami</small></div><div><b>' + x.dau + '</b><small>Bugun</small></div><div><b>' + x.wau + '</b><small>7 kun</small></div><div><b>' + x.mau + '</b><small>30 kun</small></div></div>';
    var ds = x.days.slice().reverse(), mx = Math.max.apply(null, ds.map(function (d) { return d.dau; }).concat([1]));
    h += '<div class="cd"><h3>👥 Kunlik faol o‘yinchilar</h3><div class="ch">' + ds.map(function (d) { return '<div><em>' + (d.dau || '') + '</em><i style="height:' + Math.round(d.dau / mx * 100) + '%"></i><span>' + dm(d.d).slice(0, 2) + '</span></div>'; }).join('') + '</div></div>';
    h += '<div class="cd"><h3>🔁 Yangi o‘yinchilar va qaytish</h3><table><tr><th>Sana</th><th>Faol</th><th>Yangi</th><th>Ertasi</th><th>7 kun</th></tr>' +
      x.days.map(function (d) { return '<tr><td>' + dm(d.d) + '</td><td>' + d.dau + '</td><td>' + d.nw + '</td><td>' + pc(d.d1) + '</td><td>' + pc(d.d7) + '</td></tr>'; }).join('') + '</table>' +
      '<div class="mu">“Ertasi” — o‘sha kuni kelgan yangi o‘yinchilarning necha foizi ertasi kuni qaytdi. “7 kun” — bir haftadan keyin. 40%+ yaxshi, 20% dan past — e‘tibor kerak.</div></div>';
    var t = x.days[0].ev || {}, y = (x.days[1] || {}).ev || {};
    h += '<div class="cd"><h3>📈 Voqealar</h3><table><tr><th></th><th>Bugun</th><th>Kecha</th></tr>' + EV.map(function (e) { return '<tr><td>' + e[1] + '</td><td>' + (t[e[0]] || 0) + '</td><td>' + (y[e[0]] || 0) + '</td></tr>'; }).join('') + '</table>' +
      '<div class="mu">🔕 Eslatmani o‘chirgan yoki botni bloklagan: ' + x.ntfOff + '</div></div>';
    if (x.lead && x.lead.length) h += '<div class="cd"><h3>🔥 Eng uzun seriyalar</h3><table>' + x.lead.map(function (l, i) { return '<tr><td>' + (i + 1) + '. ' + esc(l.name) + '</td><td>' + l.n + ' kun</td></tr>'; }).join('') + '</table></div>';
    h += '<div class="mu">Kuzatuv ' + esc(x.since) + ' dan boshlangan — undan oldingi kunlar uchun faollik va qaytish ma‘lumoti yo‘q.</div>';
    ov.innerHTML = h;
    ov.querySelector('#stX').onclick = function () { ov.remove(); };
    ov.querySelector('#stR').onclick = function () { load(ov); };
  }
  function load(ov) {
    fetch('/api/admin/stats', { headers: { 'x-init-data': initData } }).then(function (r) { return r.json(); }).then(function (x) {
      if (!x || x.error) { ov.innerHTML = '<div class="hd"><b>📊 Statistika</b><button id="stX">✕</button></div><div class="cd">' + esc((x && x.error) || 'Xato') + '</div>'; ov.querySelector('#stX').onclick = function () { ov.remove(); }; return; }
      render(ov, x);
    }).catch(function () { ov.innerHTML = '<div class="cd">Server bilan aloqa yo‘q</div>'; });
  }
  window.spStats = function () {
    css(); var old = document.getElementById('stOv'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'stOv'; ov.innerHTML = '<div class="hd"><b>📊 Statistika</b></div><div class="cd">⏳ Yuklanmoqda…</div>';
    document.body.appendChild(ov); load(ov);
  };
})();
