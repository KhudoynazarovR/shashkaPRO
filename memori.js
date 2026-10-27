/* memori.js — 🃏 Memori (xotira o'yini): juft kartalarni toping.
   O'lchamlar: 4×4 (8 juftlik), 6×6 (18), 8×8 "Shashka doskasi" (32).
   Rejimlar: 🧍 yolg'iz (kamroq yurish/vaqt — rekord), 🤖 bot bilan navbatma-navbat.
   API: window.spMemori(opts) — opts.onCoins(g) */
;(function () {
  if (window.spMemori) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  function T(s) { return window.spT ? window.spT(s) : s; }
  function api(p, body) {
    return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': (tg && tg.initData) || '' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function hap(k) { try { if (tg && tg.HapticFeedback) { if (k === 'ok') tg.HapticFeedback.notificationOccurred('success'); else if (k === 'no') tg.HapticFeedback.impactOccurred('light'); else tg.HapticFeedback.selectionChanged(); } } catch (e) {} }
  var THEMES = {
    shashka: { ic: '♟', t: 'Shashka', s: '♟️👑🏆🥇🥈🥉🎯⭐🔥💎🎲🧩📖⏱️🛡️⚔️🦁🐯🦅🐺🦍🤖👹🦾🎓🏅🎖️🪙💰🧠⚡🌙' },
    animals: { ic: '🐶', t: 'Hayvonlar', s: '🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦆🦉🐴🦄🐝🦋🐢🐍🐙🦀🐬🐳🦒🐘' },
    fruits: { ic: '🍐', t: 'Mevalar', s: '🍏🍎🍐🍊🍋🍌🍉🍇🍓🥜🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶️🌽🥕🧄🧅🥔🍠🥐🍯' },
    letters: { ic: '🔤', t: 'Harflar', s: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 1 2 3 4 5 6' }
  };
  function symbols(theme) {
    var s = THEMES[theme].s;
    if (theme === 'letters') return s.split(' ');
    return Array.from ? Array.from(s).reduce(function (a, c) { if (/[\u200d\ufe0f]/.test(c) && a.length) { a[a.length - 1] += c; } else a.push(c); return a; }, []) : [];
  }
  var SIZES = [{ n: 4, t: '4×4', p: 8, r: 2 }, { n: 6, t: '6×6', p: 18, r: 5 }, { n: 8, t: '8×8', p: 32, r: 10, star: 1 }];
  var LV = [{ k: 0, t: '😊 Oson', mem: 0.35 }, { k: 1, t: '😐 O‘rta', mem: 0.65 }, { k: 2, t: '😈 Qiyin', mem: 0.92 }];
  var CFG = { n: 6, theme: 'shashka', mode: 'solo', lv: 1 };
  try { var sv = JSON.parse(localStorage.getItem('spMemCfg') || 'null'); if (sv) for (var k in CFG) if (sv[k] !== undefined) CFG[k] = sv[k]; } catch (e) {}
  function saveCfg() { try { localStorage.setItem('spMemCfg', JSON.stringify(CFG)); } catch (e) {} }

  function css() {
    if (document.getElementById('spMemCss')) return;
    var s = document.createElement('style'); s.id = 'spMemCss';
    s.textContent =
      '#spMem{position:fixed;inset:0;z-index:2147482600;overflow-y:auto;color:#fff;font-family:Roboto,system-ui,sans-serif;background:radial-gradient(circle at 50% 0,#1f4a8a 0,#0d1f45 50%,#060d22 100%);padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 40px;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;overscroll-behavior:none}' +
      '#spMem .top{display:flex;align-items:center;gap:10px;margin-bottom:10px}#spMem .bk{width:40px;height:40px;border-radius:12px;border:0;background:#ffffff1a;color:#fff;font-size:26px;line-height:1}' +
      '#spMem h2{margin:0;font-size:22px;flex:1}#spMem .cd{background:#ffffff12;border-radius:16px;padding:12px;margin:10px 0}' +
      '#spMem .lb{font-size:14px;opacity:.85;margin:10px 0 6px}#spMem .row{display:flex;gap:8px;flex-wrap:wrap}' +
      '#spMem .op{flex:1;min-width:70px;border:0;border-radius:12px;padding:12px 6px;background:#26344f;color:#fff;font:600 15px system-ui;position:relative}#spMem .op.on{background:linear-gradient(#3fa34d,#2b7a36);box-shadow:0 0 0 2px #8ff09a inset}' +
      '#spMem .op small{display:block;font-weight:400;font-size:11px;opacity:.75;margin-top:2px}#spMem .op i{position:absolute;top:-7px;right:-4px;font-style:normal;font-size:10px;background:#ffb02e;color:#3a2000;border-radius:7px;padding:1px 5px;font-weight:800}' +
      '#spMem .go{display:block;width:100%;margin-top:16px;padding:15px;border:0;border-radius:14px;background:linear-gradient(90deg,#2e9d3a,#5cb85c);color:#fff;font:800 20px system-ui;letter-spacing:1px;box-shadow:0 4px 14px #0007}' +
      '#spMem .hud{display:flex;justify-content:space-between;align-items:center;gap:6px;margin:6px 0 10px;font-weight:700}#spMem .hud span{background:#ffffff14;border-radius:10px;padding:6px 10px;font-size:15px}#spMem .hud .me.turn,#spMem .hud .bot.turn{box-shadow:0 0 0 2px #ffd54f inset}' +
      '#spMem .bd{display:grid;gap:var(--g);width:100%;max-width:520px;margin:0 auto;perspective:800px}' +
      '#spMem .c{position:relative;aspect-ratio:1;cursor:pointer}#spMem .c>b,#spMem .c>u{position:absolute;inset:0;border-radius:var(--r);display:flex;align-items:center;justify-content:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .35s}' +
      '#spMem .c>b{background:linear-gradient(145deg,#3b5ba8,#22397a);box-shadow:inset 0 0 0 2px #ffffff22,0 2px 4px #0006}#spMem .c>b:after{content:"♛";opacity:.25;font-size:calc(var(--f) * .8)}' +
      '#spMem .bd.b8 .c.dk>b{background:linear-gradient(145deg,#8a5a34,#5e3a1e)}#spMem .bd.b8 .c.lt>b{background:linear-gradient(145deg,#f0d9b5,#d6b98e)}#spMem .bd.b8 .c.lt>b:after{color:#5e3a1e}' +
      '#spMem .c>u{text-decoration:none;background:#fdf6e3;color:#222;font-size:var(--f);transform:rotateY(180deg);box-shadow:0 2px 6px #0007}' +
      '#spMem .c.up>b{transform:rotateY(180deg)}#spMem .c.up>u{transform:rotateY(0)}#spMem .c.ok>u{background:#c8f7c5;box-shadow:0 0 0 2px #3fa34d inset}#spMem .c.ok.bt>u{background:#ffd9cf;box-shadow:0 0 0 2px #e0533d inset}#spMem .c.ok{animation:spMemP .4s}' +
      '@keyframes spMemP{50%{transform:scale(1.12)}}#spMem .msg{text-align:center;min-height:22px;margin:10px 0;font-weight:600}' +
      '#spMem .end{text-align:center}#spMem .end .big{font-size:52px}#spMem table{width:100%;border-collapse:collapse;font-size:14px}#spMem td{padding:5px 4px;border-bottom:1px solid #ffffff14}';
    document.head.appendChild(s);
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmtT(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  var ov = null, opts = {}, stat = null;
  function close() { if (ov) ov.remove(); ov = null; if (G.tm) clearInterval(G.tm); G.over = true; }
  var G = {};

  function menu() {
    css();
    if (!ov) { ov = document.createElement('div'); ov.id = 'spMem'; document.body.appendChild(ov); }
    var h = '<div class="top"><button class="bk" data-x>‹</button><h2>🃏 Memori</h2></div>' +
      '<div class="cd" style="font-size:14px;line-height:1.4">' + T('Kartalarni ochib, bir xil juftliklarni toping. Qayerda nima borligini eslab qoling!') + '</div>';
    h += '<div class="lb">📐 ' + T('Doska') + '</div><div class="row">';
    SIZES.forEach(function (z) {
      var b = stat && stat.best && stat.best[z.n];
      h += '<button class="op' + (CFG.n === z.n ? ' on' : '') + '" data-n="' + z.n + '">' + z.t + (z.star ? '<i>♟ DOSKA</i>' : '') + '<small>' + z.p + ' ' + T('juftlik') + ' · 🪙' + z.r + (b ? '<br>🏅 ' + b.mv + ' ' + T('yurish') : '') + '</small></button>';
    });
    h += '</div><div class="lb">🎨 ' + T('Rasmlar') + '</div><div class="row">';
    for (var k in THEMES) h += '<button class="op' + (CFG.theme === k ? ' on' : '') + '" data-t="' + k + '" style="font-size:22px;padding:8px 4px">' + THEMES[k].ic + '<small>' + T(THEMES[k].t) + '</small></button>';
    h += '</div><div class="lb">🎮 ' + T('Rejim') + '</div><div class="row">' +
      '<button class="op' + (CFG.mode === 'solo' ? ' on' : '') + '" data-m="solo">🧍 ' + T('Yolg‘iz') + '<small>' + T('Kam yurish — rekord') + '</small></button>' +
      '<button class="op' + (CFG.mode === 'bot' ? ' on' : '') + '" data-m="bot">🤖 ' + T('Bot bilan') + '<small>' + T('Navbatma-navbat') + '</small></button></div>';
    if (CFG.mode === 'bot') {
      h += '<div class="lb">🧠 ' + T('Bot xotirasi') + '</div><div class="row">';
      LV.forEach(function (l) { h += '<button class="op' + (CFG.lv === l.k ? ' on' : '') + '" data-l="' + l.k + '">' + T(l.t) + '</button>'; });
      h += '</div>';
    }
    h += '<button class="go" data-go>▶ ' + T('O‘YNASH') + '</button>';
    if (stat && stat.top && stat.top.length) {
      h += '<div class="cd"><b>🏆 ' + T('8×8 rekordlari') + '</b><table>' + stat.top.map(function (r, i) {
        return '<tr><td>' + (i + 1) + '</td><td>' + String(r.name).replace(/[<>&]/g, '') + '</td><td style="text-align:right">' + r.mv + ' ' + T('yurish') + ' · ' + fmtT(r.ms) + '</td></tr>';
      }).join('') + '</table></div>';
    }
    ov.innerHTML = h;
    ov.querySelector('[data-x]').onclick = close;
    [].forEach.call(ov.querySelectorAll('[data-n]'), function (b) { b.onclick = function () { CFG.n = +b.getAttribute('data-n'); saveCfg(); menu(); }; });
    [].forEach.call(ov.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { CFG.theme = b.getAttribute('data-t'); saveCfg(); menu(); }; });
    [].forEach.call(ov.querySelectorAll('[data-m]'), function (b) { b.onclick = function () { CFG.mode = b.getAttribute('data-m'); saveCfg(); menu(); }; });
    [].forEach.call(ov.querySelectorAll('[data-l]'), function (b) { b.onclick = function () { CFG.lv = +b.getAttribute('data-l'); saveCfg(); menu(); }; });
    ov.querySelector('[data-go]').onclick = start;
  }

  function start() {
    var n = CFG.n, pairs = n * n / 2, sy = shuffle(symbols(CFG.theme).slice()).slice(0, pairs);
    var deck = shuffle(sy.concat(sy));
    G = { n: n, deck: deck, up: [], done: {}, owner: {}, mv: 0, t0: 0, tm: null, busy: false, turn: 'me', sc: { me: 0, bot: 0 }, mem: {}, over: false, mode: CFG.mode, lv: CFG.lv };
    draw();
  }
  function draw() {
    var n = G.n, gap = n === 8 ? 4 : n === 6 ? 6 : 10, f = n === 8 ? 22 : n === 6 ? 28 : 40, rad = n === 8 ? 6 : 10;
    var h = '<div class="top"><button class="bk" data-x>‹</button><h2>🃏 ' + n + '×' + n + '</h2><button class="bk" data-r title="' + T('Qayta') + '" style="font-size:20px">↻</button></div>';
    if (G.mode === 'bot') h += '<div class="hud"><span class="me' + (G.turn === 'me' ? ' turn' : '') + '">🧑 ' + T('Siz') + ': <b data-sme>' + G.sc.me + '</b></span><span data-mv>' + G.mv + '</span><span class="bot' + (G.turn === 'bot' ? ' turn' : '') + '">🤖 ' + T('Bot') + ': <b data-sbot>' + G.sc.bot + '</b></span></div>';
    else h += '<div class="hud"><span>🔁 ' + T('Yurish') + ': <b data-mv>' + G.mv + '</b></span><span>⏱ <b data-tm>' + fmtT(G.t0 ? Date.now() - G.t0 : 0) + '</b></span><span>✅ <b data-pr>' + Object.keys(G.done).length / 2 + '</b>/' + (n * n / 2) + '</span></div>';
    h += '<div class="bd' + (n === 8 ? ' b8' : '') + '" style="grid-template-columns:repeat(' + n + ',1fr);--g:' + gap + 'px;--f:' + f + 'px;--r:' + rad + 'px">';
    for (var i = 0; i < n * n; i++) {
      var r = Math.floor(i / n), c = i % n, cls = 'c' + ((r + c) % 2 ? ' dk' : ' lt') + (G.done[i] ? ' up ok' + (G.owner[i] === 'bot' ? ' bt' : '') : G.up.indexOf(i) >= 0 ? ' up' : '');
      h += '<div class="' + cls + '" data-i="' + i + '"><b></b><u>' + G.deck[i] + '</u></div>';
    }
    h += '</div><div class="msg" data-msg></div>';
    ov.innerHTML = h;
    ov.querySelector('[data-x]').onclick = function () { if (G.tm) clearInterval(G.tm); G.over = true; menu(); };
    ov.querySelector('[data-r]').onclick = function () { if (G.tm) clearInterval(G.tm); start(); };
    [].forEach.call(ov.querySelectorAll('[data-i]'), function (e) { e.onclick = function () { tap(+e.getAttribute('data-i')); }; });
    if (G.mode === 'bot' && G.turn === 'bot' && !G.over) setTimeout(botTurn, 600);
  }
  function el(i) { return ov && ov.querySelector('[data-i="' + i + '"]'); }
  function hud() {
    if (!ov) return;
    var q = function (s) { return ov.querySelector(s); };
    if (G.mode === 'bot') {
      q('[data-sme]').textContent = G.sc.me; q('[data-sbot]').textContent = G.sc.bot;
      q('.hud .me').className = 'me' + (G.turn === 'me' ? ' turn' : ''); q('.hud .bot').className = 'bot' + (G.turn === 'bot' ? ' turn' : '');
      q('[data-mv]').textContent = G.turn === 'me' ? '👉 ' + T('Navbat sizda') : '🤖 ' + T('Bot o‘ylayapti…');
    } else {
      q('[data-mv]').textContent = G.mv; q('[data-pr]').textContent = Object.keys(G.done).length / 2;
    }
  }
  function remember(i) {   // bot ko'rgan kartani eslaydi (darajaga qarab)
    if (Math.random() < LV[G.lv].mem) G.mem[i] = G.deck[i]; else delete G.mem[i];
  }
  function flip(i, who) {
    if (G.done[i] || G.up.indexOf(i) >= 0 || G.up.length >= 2) return false;
    G.up.push(i); var e = el(i); if (e) e.classList.add('up'); hap();
    if (G.mode === 'solo' && !G.t0) { G.t0 = Date.now(); G.tm = setInterval(function () { var t = ov && ov.querySelector('[data-tm]'); if (t) t.textContent = fmtT(Date.now() - G.t0); }, 500); }
    if (G.mode === 'bot') remember(i);
    if (G.up.length === 2) {
      G.mv++; G.busy = true;
      var a = G.up[0], b = G.up[1];
      if (G.deck[a] === G.deck[b]) {
        G.done[a] = G.done[b] = 1; G.owner[a] = G.owner[b] = who; delete G.mem[a]; delete G.mem[b];
        if (G.mode === 'bot') G.sc[who]++;
        setTimeout(function () { [a, b].forEach(function (x) { var e2 = el(x); if (e2) { e2.classList.add('ok'); if (who === 'bot') e2.classList.add('bt'); } }); G.up = []; G.busy = false; hap('ok'); hud(); check(); if (G.mode === 'bot' && who === 'bot' && !G.over) setTimeout(botTurn, 700); }, 380);
      } else {
        setTimeout(function () { [a, b].forEach(function (x) { var e2 = el(x); if (e2) e2.classList.remove('up'); }); G.up = []; G.busy = false; hap('no');
          if (G.mode === 'bot') { G.turn = who === 'me' ? 'bot' : 'me'; hud(); if (G.turn === 'bot') setTimeout(botTurn, 700); } else hud();
        }, G.mode === 'bot' && who === 'bot' ? 1100 : 850);
      }
    }
    return true;
  }
  function tap(i) {
    if (G.over || G.busy || (G.mode === 'bot' && G.turn !== 'me')) return;
    flip(i, 'me');
  }
  function botTurn() {
    if (G.over || G.turn !== 'bot' || G.busy || !ov) return;
    var left = []; for (var i = 0; i < G.deck.length; i++) if (!G.done[i]) left.push(i);
    if (!left.length) return;
    // 1) eslab qolingan juftlik bormi?
    var seen = {}, pair = null;
    for (var k in G.mem) { var v = G.mem[k]; if (G.done[k]) continue; if (seen[v] != null) { pair = [seen[v], +k]; break; } seen[v] = +k; }
    var first = pair ? pair[0] : null;
    if (first == null) { var unk = left.filter(function (x) { return G.mem[x] == null; }); first = (unk.length ? unk : left)[Math.floor(Math.random() * (unk.length ? unk : left).length)]; }
    flip(first, 'bot');
    setTimeout(function () {
      if (G.over || !ov) return;
      var sec = pair ? pair[1] : null;
      if (sec == null) { for (var k2 in G.mem) if (+k2 !== first && !G.done[k2] && G.mem[k2] === G.deck[first]) { sec = +k2; break; } }
      if (sec == null) { var rest = left.filter(function (x) { return x !== first && G.mem[x] == null; }); if (!rest.length) rest = left.filter(function (x) { return x !== first; }); sec = rest[Math.floor(Math.random() * rest.length)]; }
      flip(sec, 'bot');
    }, 750);
  }
  function check() {
    if (Object.keys(G.done).length < G.deck.length || G.over) return;
    G.over = true; if (G.tm) clearInterval(G.tm);
    if (G.mode === 'bot') { var hm = ov && ov.querySelector('[data-mv]'); if (hm) hm.textContent = '🏁 ' + T('Tugadi'); }
    var ms = G.t0 ? Date.now() - G.t0 : 0, win = G.mode === 'solo' || G.sc.me > G.sc.bot, draw = G.mode === 'bot' && G.sc.me === G.sc.bot;
    setTimeout(function () {
      var m = ov && ov.querySelector('[data-msg]'); if (!m) return;
      m.innerHTML = '<div class="cd end"><div class="big">' + (G.mode === 'solo' ? '🎉' : win ? '🏆' : draw ? '🤝' : '🤖') + '</div><b style="font-size:20px">' +
        (G.mode === 'solo' ? T('Barcha juftliklar topildi!') : win ? T('Siz yutdingiz!') : draw ? T('Durang!') : T('Bot yutdi')) + '</b><div style="margin-top:6px">' +
        (G.mode === 'solo' ? G.mv + ' ' + T('yurish') + ' · ⏱ ' + fmtT(ms) : G.sc.me + ' : ' + G.sc.bot) + '</div><div data-rw style="margin-top:6px;color:#ffd54f"></div>' +
        '<button class="go" data-again>↻ ' + T('Yana o‘ynash') + '</button><button class="go" data-menu style="background:#26344f">☰ ' + T('Menyu') + '</button></div>';
      m.querySelector('[data-again]').onclick = start; m.querySelector('[data-menu]').onclick = menu;
      api('/api/memori/done', { n: G.n, mode: G.mode, lv: G.lv, mv: G.mv, ms: ms, win: win && !draw, me: G.sc.me, bot: G.sc.bot }).then(function (d) {
        var rw = m.querySelector('[data-rw]'); if (!d || !rw) return;
        var t = []; if (d.gain) t.push('+' + d.gain + ' 🪙'); if (d.record) t.push('🏅 ' + T('Yangi rekord!')); if (d.capped) t.push(T('Bugungi tanga limiti tugadi'));
        rw.textContent = t.join(' · '); if (d.gain && opts.onCoins) try { opts.onCoins(d.gain); } catch (e) {}
        stat = null;
      });
    }, 500);
  }

  window.spMemori = function (o) {
    opts = o || {}; css();
    if (ov) ov.remove(); ov = null;
    menu();
    api('/api/memori/stat').then(function (d) { if (d && !d.error) { stat = d; if (ov && !ov.querySelector('.bd')) menu(); } });
  };
})();
