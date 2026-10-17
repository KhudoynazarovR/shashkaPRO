(function () {
  if (window.__arenaView) return; window.__arenaView = true;
  var last = null, ov = null, tmO = null;
  function init() { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nm(s) { return esc(String(s || '').replace(/^\uD83E\uDD16\s*/, '')); }
  function get() { return fetch('/api/arena', { headers: { 'x-init-data': init() } }).then(function (r) { return r.json(); }); }

  var st = document.createElement('style');
  st.textContent =
    '.avCard{margin:10px 0;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,#7f1d1d,#b91c1c);color:#fff;cursor:pointer;font-family:inherit}' +
    '.avCard b{display:block;font-size:16px}.avCard small{display:block;opacity:.85;margin-top:3px;font-size:12px}' +
    '#avOv{position:fixed;inset:0;z-index:100003;background:#0d0a2e;color:#fff;overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px calc(env(safe-area-inset-bottom,0px) + 16px)}' +
    '#avOv .avX{float:right;border:0;background:#2e2a70;color:#fff;border-radius:10px;padding:6px 12px;font-size:18px}' +
    '#avOv h3{margin:4px 0 8px;font-size:17px;font-weight:600}' +
    '#avBd{display:grid;grid-template-columns:repeat(8,1fr);width:min(100%,420px);margin:8px auto;border:4px solid #8a4a1c;border-radius:4px;box-sizing:border-box}' +
    '#avBd i{aspect-ratio:1;display:flex;align-items:center;justify-content:center}' +
    '#avBd i.l{background:#f0d9b5}#avBd i.d{background:#b58863}' +
    '#avBd u{display:block;width:78%;height:78%;border-radius:50%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.35),0 1px 2px #0008;text-decoration:none;position:relative}' +
    '#avBd u.w{background:#f5f5f5}#avBd u.b{background:#222}' +
    '#avBd u.k::after{content:"\\265B";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:130%;color:#d4a017}' +
    '#avOv .avMv{font-family:monospace;font-size:13px;opacity:.9;word-break:break-word;margin:6px 0}' +
    '#avOv table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}' +
    '#avOv td,#avOv th{padding:6px 4px;border-bottom:1px solid #2e2a70;text-align:left}' +
    '#avOv .avT{width:100%;margin-top:12px;padding:12px;border:0;border-radius:10px;background:#2e2a70;color:#fff;font-size:15px}';
  document.head.appendChild(st);

  function dt(t) { try { var p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; }); return p.day + '.' + p.month + ' ' + p.hour + ':' + p.minute; } catch (e) { return ''; } }
  function cardTxt(j) {
    if (!j || !j.enabled) return ['\uD83D\uDD34 Bot arenasi', 'Hozir o‘chiq. Reytingni ko‘rish uchun bosing'];
    var g = j.game;
    if (!g || g.over) return ['\uD83D\uDD34 Jonli o‘yin', 'Keyingi o‘yin boshlanmoqda… Bosib reytingni ko‘ring'];
    return ['\uD83D\uDD34 Jonli: ' + nm(g.white.name) + ' (' + g.white.elo + ') – ' + nm(g.black.name) + ' (' + g.black.elo + ')', g.ply + '-yurish · tomosha qilish uchun bosing'];
  }
  function renderCard(j) {
    var c = document.getElementById('avCard'); if (!c) return;
    var t = cardTxt(j); c.innerHTML = '<b>' + t[0] + '</b><small>' + t[1] + '</small>';
  }
  function refresh() { get().then(function (j) { last = j; renderCard(j); }).catch(function () {}); }

  function mount() {
    var h = document.getElementById('hzMkR');
    if (!h || document.getElementById('avCard')) return;
    var c = document.createElement('div'); c.id = 'avCard'; c.className = 'avCard'; c.onclick = openOv;
    c.innerHTML = '<b>\uD83D\uDD34 Jonli o‘yin</b><small>Yuklanmoqda…</small>';
    h.parentNode.insertBefore(c, h.nextSibling);
    if (last) renderCard(last); else refresh();
  }

  function board64(a) {
    var h = '';
    for (var i = 0; i < 64; i++) {
      var r = i >> 3, c = i & 7, p = a ? a[i] : 0;
      h += '<i class="' + (((r + c) % 2) ? 'd' : 'l') + '">' + (p ? '<u class="' + (p > 0 ? 'w' : 'b') + (Math.abs(p) === 2 ? ' k' : '') + '"></u>' : '') + '</i>';
    }
    return h;
  }
  function draw(j) {
    if (!ov) return; last = j;
    var g = j.game, h = '<button class="avX" id="avClose">✕</button><h3>\uD83D\uDD34 Bot arenasi</h3>';
    if (g) {
      h += '<div>\u26AA ' + nm(g.white.name) + ' (' + g.white.elo + ') &nbsp;vs&nbsp; \u26AB ' + nm(g.black.name) + ' (' + g.black.elo + ')</div>';
      h += '<div id="avBd">' + board64(g.board) + '</div>';
      h += '<div class="avMv">' + esc(g.start === 'std' ? 'Oddiy boshlanish' : 'IDF ' + g.start) + ' · yurish: ' + g.ply + (g.over ? ' · tugadi: ' + (g.result === 'white' ? '1-0' : g.result === 'black' ? '0-1' : '1/2') : '') + '</div>';
      h += '<div class="avMv">' + esc((g.moves || []).join('  ')) + '</div>';
    } else h += '<div class="avMv">Keyingi o‘yin boshlanmoqda…</div>';
    h += '<table><tr><th>Bot</th><th>Elo</th><th>G</th><th>M</th><th>D</th></tr>';
    (j.bots || []).forEach(function (b) { h += '<tr><td>' + nm(b.name) + '</td><td>' + b.elo + '</td><td>' + b.w + '</td><td>' + b.l + '</td><td>' + b.dr + '</td></tr>'; });
    h += '</table>';
    if (j.log && j.log.length) {
      h += '<table><tr><th colspan="4">Oxirgi o‘yinlar</th></tr>';
      j.log.slice(0, 6).forEach(function (x) { h += '<tr><td>' + nm(x.w) + '</td><td>' + esc(x.r) + '</td><td>' + nm(x.b) + '</td><td style="opacity:.7;font-size:12px">' + dt(x.t) + '</td></tr>'; });
      h += '</table>';
    }
    if (j.admin) h += '<button class="avT" id="avTg">' + (j.enabled ? '\u23F8 Arenani to‘xtatish' : '\u25B6 Arenani yoqish') + '</button>';
    ov.innerHTML = h;
    document.getElementById('avClose').onclick = closeOv;
    var tg = document.getElementById('avTg');
    if (tg) tg.onclick = function () {
      fetch('/api/arena', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': init() }, body: JSON.stringify({ on: !j.enabled }) })
        .then(function () { return get(); }).then(draw).catch(function () {});
    };
  }
  function openOv() {
    if (ov) return;
    ov = document.createElement('div'); ov.id = 'avOv'; ov.innerHTML = '<button class="avX" id="avClose">✕</button><h3>Yuklanmoqda…</h3>';
    document.body.appendChild(ov);
    document.getElementById('avClose').onclick = closeOv;
    function tick() { get().then(draw).catch(function () {}); }
    tick(); tmO = setInterval(tick, 1500);
  }
  function closeOv() { if (tmO) clearInterval(tmO); tmO = null; if (ov) ov.remove(); ov = null; refresh(); }

  setInterval(mount, 1500);
  setInterval(function () { if (!ov && document.getElementById('avCard')) refresh(); }, 20000);
})();
