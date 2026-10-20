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

  // Bosh sahifada endi Bot arenasi o'rnida profil kartasi turadi; arena Menyu ichidan ochiladi (window.avOpen)
  var me = null, meAt = 0;
  (function () { var s2 = document.createElement('style'); s2.textContent =
    '#pfCard{display:flex;align-items:center;gap:12px;margin:10px 0;padding:12px 14px;border-radius:18px;background:#2a2470;box-shadow:0 3px 0 #0e0b30;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}' +
    '#pfCard:active{transform:translateY(2px)}' +
    '#pfCard .pfA{flex:none;width:58px;height:58px;border-radius:16px;overflow:hidden;background:#352d86;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}' +
    '#pfCard .pfA img{width:100%;height:100%;object-fit:cover}' +
    '#pfCard .pfB{flex:1;min-width:0}' +
    '#pfCard .pfN{font-size:19px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#pfCard .pfS{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}' +
    '#pfCard .pfS span{font-size:14px;font-weight:700;background:#141040;border-radius:9px;padding:4px 9px;white-space:nowrap}' +
    '#pfCard .pfG{flex:none;font-size:26px;color:#bababa}';
    document.head.appendChild(s2); })();
  function myId() { try { var u = Telegram.WebApp.initDataUnsafe.user; return u && u.id ? String(u.id) : ''; } catch (e) { return ''; } }
  function myName() { try { var u = Telegram.WebApp.initDataUnsafe.user || {}; return ((u.first_name || '') + ' ' + (u.last_name || '')).trim(); } catch (e) { return ''; } }
  function loadMe() {
    var id = myId(); if (!id) return;
    meAt = Date.now();
    fetch('/api/user/' + encodeURIComponent(id), { headers: { 'x-init-data': init() } })
      .then(function (r) { return r.json(); }).then(function (d) { if (d && !d.error) { me = d; drawMe(); } }).catch(function () {});
  }
  function drawMe() {
    var c = document.getElementById('pfCard'); if (!c) return;
    var id = myId(), d = me || {}, nm0 = d.name || myName() || 'Mehmon';
    var av = id ? '<img src="/api/av/' + encodeURIComponent(id) + '" alt="" onerror="this.parentNode.textContent=\'' + esc(nm0.charAt(0).toUpperCase()).replace(/'/g, '') + '\'">' : esc(nm0.charAt(0).toUpperCase());
    var html = '<div class="pfA">' + av + '</div><div class="pfB"><div class="pfN">' + esc(nm0) + (d.premium ? ' 👑' : '') + '</div><div class="pfS">' +
      '<span>⚡ ' + (d.elo || 1000) + '</span><span>🪙 ' + (d.diamonds || 0) + '</span>' +
      (d.games ? '<span>🏆 ' + (d.wins || 0) + ' / ' + d.games + '</span>' : '') + '</div></div><div class="pfG">›</div>';
    if (c.__h !== html) { c.__h = html; c.innerHTML = html; }
  }
  function openProfile() {
    var b = document.querySelector('button[data-k="pf"]');
    if (b) b.click();
  }
  function mount() {
    var h = document.getElementById('hzMkR');
    if (!h || document.getElementById('pfCard')) return;
    var c = document.createElement('div'); c.id = 'pfCard'; c.onclick = openProfile;
    h.parentNode.insertBefore(c, h.nextSibling);
    drawMe(); if (!me || Date.now() - meAt > 30000) loadMe();
  }
  window.avOpen = function () { openOv(); };

  function board64(a) {
    var h = '';
    for (var i = 0; i < 64; i++) {
      var r = i >> 3, c = i & 7, p = a ? a[i] : 0;
      h += '<i class="' + (((r + c) % 2) ? 'd' : 'l') + '">' + (p ? '<u class="' + (p > 0 ? 'w' : 'b') + (Math.abs(p) === 2 ? ' k' : '') + '"></u>' : '') + '</i>';
    }
    return h;
  }
  var viewPly = null, vId = null, vLog = null;
  (function () { var s = document.createElement('style'); s.textContent = '#avOv .avN{border:0;border-radius:10px;background:#2e2a70;color:#fff;padding:8px 14px;font-size:18px}#avOv .avMk{padding:2px 4px;border-radius:6px}#hzMkR,#hzPromo{display:none!important}'; document.head.appendChild(s); })();
  function decB(s) { var a = []; for (var i = 0; i < 64; i++) { var c = s.charAt(i); a.push(c === 'w' ? 1 : c === 'W' ? 2 : c === 'b' ? -1 : c === 'B' ? -2 : 0); } return a; }
  function bindNav(g) {
    if (!g || !g.hist) return;
    var n = g.hist.length - 1, cp = (viewPly == null || viewPly > n) ? n : viewPly;
    ov.querySelectorAll('.avN').forEach(function (b) { b.onclick = function () {
      var t = b.getAttribute('data-n');
      if (t === 'first') viewPly = 0; else if (t === 'prev') viewPly = Math.max(0, cp - 1);
      else if (t === 'next') viewPly = (cp + 1 >= n) ? null : cp + 1; else viewPly = null;
      draw(last); }; });
    ov.querySelectorAll('.avMk').forEach(function (a) { a.onclick = function () {
      var p = +a.getAttribute('data-p'); viewPly = p >= n ? null : p; draw(last); }; });
  }
  function draw(j) {
    if (!ov) return; last = j; var rv = null;
    if (vLog != null && j.log && j.log[vLog] && j.log[vLog].h) { var x0 = j.log[vLog]; rv = x0; j = Object.assign({}, j, { game: { id: 'L' + x0.t, white: { name: x0.w, elo: x0.we || '' }, black: { name: x0.b, elo: x0.be || '' }, board: null, hist: x0.h, all: x0.a, start: x0.s || 'std', ply: x0.n, over: true, result: x0.r === '1-0' ? 'white' : x0.r === '0-1' ? 'black' : 'draw', moves: [] } }); }
    var g = j.game, h = '<button class="avX" id="avClose">✕</button><h3>\uD83D\uDD34 Bot arenasi</h3>';
    if (g) {
      h += '<div>\u26AA ' + nm(g.white.name) + ' (' + g.white.elo + ') &nbsp;vs&nbsp; \u26AB ' + nm(g.black.name) + ' (' + g.black.elo + ')</div>';
      if (g.id !== vId) { vId = g.id; viewPly = null; }
        if (rv) h += '<button class="avN avBk" style="margin:6px 0">\u2B05 Jonli o‘yin</button>';
      var cp = -1, tot = 0, shown = g.board;
      if (g.hist && g.hist.length) { tot = g.hist.length - 1; cp = (viewPly == null || viewPly > tot) ? tot : viewPly; shown = decB(g.hist[cp]); }
      h += '<div id="avBd">' + board64(shown) + '</div>';
      if (cp >= 0) h += '<div style="display:flex;gap:8px;justify-content:center;align-items:center;margin:6px 0"><button class="avN" data-n="first">\u23EE</button><button class="avN" data-n="prev">\u25C0</button><b style="min-width:70px;text-align:center">' + cp + ' / ' + tot + '</b><button class="avN" data-n="next">\u25B6</button><button class="avN" data-n="live">\u23ED</button></div>';
      h += '<div class="avMv">' + esc(g.start === 'std' ? 'Oddiy boshlanish' : 'IDF ' + g.start) + ' · yurish: ' + g.ply + (g.over ? ' · tugadi: ' + (g.result === 'white' ? '1-0' : g.result === 'black' ? '0-1' : '1/2') : '') + '</div>';
      if (g.all && g.all.length) { var mh = ''; var mk = function (mm, i) { return '<a class="avMk" data-p="' + (i + 1) + '" style="cursor:pointer;margin-right:4px;' + (cp === i + 1 ? 'color:#ffd54a;font-weight:700' : '') + '">' + esc(mm) + '</a>'; }; for (var q = 0; q < g.all.length; q += 2) { mh += '<span style="display:inline-block;margin-right:10px;white-space:nowrap">' + (q / 2 + 1) + '.' + mk(g.all[q], q) + (q + 1 < g.all.length ? mk(g.all[q + 1], q + 1) : '') + '</span>'; } h += '<div class="avMv">' + mh + '</div>'; } else h += '<div class="avMv">' + esc((g.moves || []).join('  ')) + '</div>';
    } else h += '<div class="avMv">Keyingi o‘yin boshlanmoqda…</div>';
    h += '<table><tr><th>Bot</th><th>Elo</th><th>G</th><th>M</th><th>D</th></tr>';
    (j.bots || []).forEach(function (b) { h += '<tr><td>' + nm(b.name) + '</td><td>' + b.elo + '</td><td>' + b.w + '</td><td>' + b.l + '</td><td>' + b.dr + '</td></tr>'; });
    h += '</table>';
    if (j.log && j.log.length) {
      h += '<table><tr><th colspan="4">Oxirgi o‘yinlar</th></tr>';
      j.log.slice(0, 6).forEach(function (x, i) { h += '<tr class="avLg" data-i="' + i + '" style="' + (x.h ? 'cursor:pointer;background:rgba(255,255,255,.06)' : '') + '"><td>' + nm(x.w) + '</td><td>' + esc(x.r) + '</td><td>' + nm(x.b) + '</td><td style="opacity:.7;font-size:12px">' + dt(x.t) + '</td></tr>'; });
      h += '</table>';
    }
    if (j.admin) h += '<button class="avT" id="avTg">' + (j.enabled ? '\u23F8 Arenani to‘xtatish' : '\u25B6 Arenani yoqish') + '</button>';
    ov.innerHTML = h; bindNav(g);
    ov.querySelectorAll('.avLg').forEach(function (r) { r.onclick = function () { var i = +r.getAttribute('data-i'); if (j.log[i] && j.log[i].h) { vLog = i; viewPly = null; vId = null; draw(last); } }; });
    var bk = ov.querySelector('.avBk'); if (bk) bk.onclick = function () { vLog = null; viewPly = null; vId = null; draw(last); };
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
  setInterval(function () { if (document.getElementById('pfCard') && document.getElementById('pfCard').offsetParent) loadMe(); }, 30000);
})();
