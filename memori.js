/* memori.js — 🃏 Memori (xotira o'yini): juft kartalarni toping.
   Doskalar: 4×6 (12 juftlik), 6×6 (18). Rejimlar: 🤖 bot bilan, 👥 do'st bilan (onlayn, havola orqali).
   Vaqt: vaqtsiz yoki har yurishga 10/20 soniya. API: window.spMemori(opts) — opts.onCoins(g), opts.join (kod) */
;(function () {
  if (window.spMemori) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  function T(s) { return window.spT ? window.spT(s) : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
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
    return Array.from(s).reduce(function (a, c) { if (/[‍️]/.test(c) && a.length) { a[a.length - 1] += c; } else a.push(c); return a; }, []);
  }
  var SIZES = [{ k: '4x6', w: 4, h: 6, t: '4×6', p: 12, r: 3 }, { k: '6x6', w: 6, h: 6, t: '6×6', p: 18, r: 5 }];
  var LV = [{ k: 0, t: '😊 Oson', mem: 0.35 }, { k: 1, t: '😐 O‘rta', mem: 0.65 }, { k: 2, t: '🔥 Qiyin', mem: 0.92 }];
  var TCS = [{ k: 0, t: '∞ Vaqtsiz' }, { k: 10, t: '⏱ 10 s' }, { k: 20, t: '⏱ 20 s' }];
  var CFG = { size: '4x6', theme: 'shashka', mode: 'bot', lv: 1, tc: 0 };
  try { var sv = JSON.parse(localStorage.getItem('spMemCfg2') || 'null'); if (sv) for (var k in CFG) if (sv[k] !== undefined) CFG[k] = sv[k]; } catch (e) {}
  if (!SIZES.some(function (z) { return z.k === CFG.size; })) CFG.size = '4x6';
  function saveCfg() { try { localStorage.setItem('spMemCfg2', JSON.stringify(CFG)); } catch (e) {} }
  function sizeOf(k) { return SIZES.filter(function (z) { return z.k === k; })[0] || SIZES[0]; }

  function css() {
    if (document.getElementById('spMemCss')) return;
    var s = document.createElement('style'); s.id = 'spMemCss';
    s.textContent =
      '#spMem{position:fixed;inset:0;z-index:2147482600;overflow-y:auto;color:#fff;font-family:Roboto,system-ui,sans-serif;background:radial-gradient(circle at 50% 0,#1f4a8a 0,#0d1f45 50%,#060d22 100%);padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 40px;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;overscroll-behavior:none}' +
      '#spMem .top{display:flex;align-items:center;gap:10px;margin-bottom:10px}#spMem .bk{width:40px;height:40px;border-radius:12px;border:0;background:#ffffff1a;color:#fff;font-size:26px;line-height:1}' +
      '#spMem h2{margin:0;font-size:22px;flex:1}#spMem .cd{background:#ffffff12;border-radius:16px;padding:12px;margin:10px 0}' +
      '#spMem .lb{font-size:14px;opacity:.85;margin:12px 0 6px}#spMem .row{display:flex;gap:8px;flex-wrap:wrap}' +
      '#spMem .op{flex:1;min-width:70px;border:0;border-radius:12px;padding:12px 6px;background:#26344f;color:#fff;font:600 15px system-ui;position:relative}#spMem .op.on{background:linear-gradient(#3fa34d,#2b7a36);box-shadow:0 0 0 2px #8ff09a inset}' +
      '#spMem .op small{display:block;font-weight:400;font-size:11px;opacity:.75;margin-top:2px}' +
      '#spMem select{width:100%;padding:12px;border-radius:12px;border:0;background:#26344f;color:#fff;font:600 16px system-ui;appearance:none;-webkit-appearance:none;background-image:linear-gradient(45deg,transparent 50%,#fff 50%),linear-gradient(135deg,#fff 50%,transparent 50%);background-position:calc(100% - 20px) 50%,calc(100% - 14px) 50%;background-size:6px 6px;background-repeat:no-repeat}' +
      '#spMem input{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:0;background:#26344f;color:#fff;font:700 18px system-ui;letter-spacing:3px;text-transform:uppercase;text-align:center}' +
      '#spMem .go{display:block;width:100%;margin-top:16px;padding:15px;border:0;border-radius:14px;background:linear-gradient(90deg,#2e9d3a,#5cb85c);color:#fff;font:800 20px system-ui;letter-spacing:1px;box-shadow:0 4px 14px #0007}#spMem .go.g2{background:#26344f;font-size:17px;margin-top:10px}' +
      '#spMem .hud{display:flex;justify-content:space-between;align-items:center;gap:6px;margin:6px 0 10px;font-weight:700}#spMem .hud span{background:#ffffff14;border-radius:10px;padding:6px 10px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%}#spMem .hud .turn{box-shadow:0 0 0 2px #ffd54f inset}' +
      '#spMem .tb{height:6px;border-radius:3px;background:#ffffff1a;overflow:hidden;margin:-4px 0 10px}#spMem .tb i{display:block;height:100%;background:linear-gradient(90deg,#ffd54f,#ff7043);transition:width .25s linear}' +
      '#spMem .bd{display:grid;gap:var(--g);width:100%;max-width:var(--mw);margin:0 auto;perspective:800px}' +
      '#spMem .c{position:relative;aspect-ratio:1;cursor:pointer}#spMem .c>b,#spMem .c>u{position:absolute;inset:0;border-radius:var(--r);display:flex;align-items:center;justify-content:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .35s}' +
      '#spMem .c>b{background:linear-gradient(145deg,#3b5ba8,#22397a);box-shadow:inset 0 0 0 2px #ffffff22,0 2px 4px #0006}#spMem .c>b:after{content:"♛";opacity:.25;font-size:calc(var(--f) * .8)}' +
      '#spMem .c>u{text-decoration:none;background:#fdf6e3;color:#222;font-size:var(--f);font-weight:800;transform:rotateY(180deg);box-shadow:0 2px 6px #0007}' +
      '#spMem .c.up>b{transform:rotateY(180deg)}#spMem .c.up>u{transform:rotateY(0)}#spMem .c.ok>u{background:#c8f7c5;box-shadow:0 0 0 2px #3fa34d inset}#spMem .c.ok.bt>u{background:#ffd9cf;box-shadow:0 0 0 2px #e0533d inset}#spMem .c.ok{animation:spMemP .4s}' +
      '@keyframes spMemP{50%{transform:scale(1.12)}}#spMem .msg{text-align:center;min-height:22px;margin:10px 0;font-weight:600}#spMem .end{text-align:center}#spMem .end .big{font-size:52px}' +
      '#spMem .code{font:900 34px system-ui;letter-spacing:6px;text-align:center;margin:8px 0;color:#ffd54f}';
    document.head.appendChild(s);
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var ov = null, opts = {}, G = {}, WS = null, NET = null;
  function stopAll() { G.over = true; if (G.tm) clearInterval(G.tm); if (G.tt) clearTimeout(G.tt); }
  function close() { stopAll(); netLeave(); if (ov) ov.remove(); ov = null; }
  function shell() { css(); if (!ov) { ov = document.createElement('div'); ov.id = 'spMem'; document.body.appendChild(ov); } }

  // ---------------- menyu
  function menu() {
    shell(); stopAll(); netLeave();
    var h = '<div class="top"><button class="bk" data-x>‹</button><h2>Xotira</h2></div>' +
      '<div class="cd" style="font-size:14px;line-height:1.4">' + T('Kartalarni ochib, bir xil juftliklarni toping. Juftlik topsangiz — yana yurasiz. Ko‘p juftlik yig‘gan yutadi!') + '</div>';
    h += '<div class="lb">📐 ' + T('Doska') + '</div><div class="row">';
    SIZES.forEach(function (z) { h += '<button class="op' + (CFG.size === z.k ? ' on' : '') + '" data-s="' + z.k + '">' + z.t + '<small>' + z.p + ' ' + T('juftlik') + ' · 🪙' + z.r + '</small></button>'; });
    h += '</div><div class="lb">🎨 ' + T('Rasmlar') + '</div><select data-th>';
    for (var k in THEMES) h += '<option value="' + k + '"' + (CFG.theme === k ? ' selected' : '') + '>' + THEMES[k].ic + '  ' + T(THEMES[k].t) + '</option>';
    h += '</select><div class="lb">🎮 ' + T('Kim bilan') + '</div><div class="row">' +
      '<button class="op' + (CFG.mode === 'bot' ? ' on' : '') + '" data-m="bot">🤖 ' + T('Bot bilan') + '</button>' +
      '<button class="op' + (CFG.mode === 'friend' ? ' on' : '') + '" data-m="friend">👥 ' + T('Do‘st bilan') + '</button></div>';
    if (CFG.mode === 'bot') {
      h += '<div class="lb">🧠 ' + T('Bot xotirasi') + '</div><div class="row">';
      LV.forEach(function (l) { h += '<button class="op' + (CFG.lv === l.k ? ' on' : '') + '" data-l="' + l.k + '">' + T(l.t) + '</button>'; });
      h += '</div>';
    }
    h += '<div class="lb">⏱ ' + T('Har yurishga vaqt') + '</div><div class="row">';
    TCS.forEach(function (t) { h += '<button class="op' + (CFG.tc === t.k ? ' on' : '') + '" data-t="' + t.k + '">' + T(t.t) + '</button>'; });
    h += '</div>';
    if (CFG.mode === 'friend') {
      h += '<button class="go" data-go>👥 ' + T('O‘YIN YARATISH') + '</button>' +
        '<div class="lb" style="text-align:center">' + T('yoki do‘stingiz kodi bilan kiring') + '</div><input data-code maxlength="6" placeholder="KOD"><button class="go g2" data-join>🔑 ' + T('Kirish') + '</button>';
    } else h += '<button class="go" data-go>▶ ' + T('O‘YNASH') + '</button>';
    ov.innerHTML = h;
    var q = function (s) { return ov.querySelector(s); };
    q('[data-x]').onclick = close;
    q('[data-th]').onchange = function () { CFG.theme = this.value; saveCfg(); };
    [].forEach.call(ov.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { CFG.size = b.getAttribute('data-s'); saveCfg(); menu(); }; });
    [].forEach.call(ov.querySelectorAll('[data-m]'), function (b) { b.onclick = function () { CFG.mode = b.getAttribute('data-m'); saveCfg(); menu(); }; });
    [].forEach.call(ov.querySelectorAll('[data-l]'), function (b) { b.onclick = function () { CFG.lv = +b.getAttribute('data-l'); saveCfg(); menu(); }; });
    [].forEach.call(ov.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { CFG.tc = +b.getAttribute('data-t'); saveCfg(); menu(); }; });
    q('[data-go]').onclick = function () { if (CFG.mode === 'friend') netCreate(); else startBot(); };
    if (q('[data-join]')) q('[data-join]').onclick = function () { var c = String(q('[data-code]').value || '').trim().toUpperCase(); if (c.length === 6) netJoin(c); };
  }

  // ---------------- doska chizish (umumiy)
  function boardHtml(z, cards) {
    var gap = z.w === 6 ? 6 : 8, f = z.w === 6 ? 28 : 34, mw = z.w === 6 ? 520 : 400;
    var h = '<div class="bd" style="grid-template-columns:repeat(' + z.w + ',1fr);--g:' + gap + 'px;--f:' + f + 'px;--r:10px;--mw:' + mw + 'px">';
    for (var i = 0; i < z.w * z.h; i++) {
      var c = cards[i];
      h += '<div class="c' + (c ? (c.up ? ' up' : '') + (c.ok ? ' up ok' + (c.bt ? ' bt' : '') : '') : '') + '" data-i="' + i + '"><b></b><u>' + (c && c.s ? esc(c.s) : '') + '</u></div>';
    }
    return h + '</div>';
  }
  function timerBar(left, tot) { return tot ? '<div class="tb"><i data-tbar style="width:' + Math.max(0, Math.min(100, left / tot * 100)) + '%"></i></div>' : ''; }

  // ---------------- 🤖 bot bilan
  function startBot() {
    var z = sizeOf(CFG.size), sy = shuffle(symbols(CFG.theme).slice()).slice(0, z.p);
    G = { z: z, deck: shuffle(sy.concat(sy)), up: [], done: {}, owner: {}, mv: 0, busy: false, turn: Math.random() < 0.5 ? 'me' : 'bot', sc: { me: 0, bot: 0 }, mem: {}, over: false, lv: CFG.lv, tc: CFG.tc, t0: Date.now() };
    drawBot();
  }
  function drawBot() {
    var z = G.z, cards = [];
    for (var i = 0; i < G.deck.length; i++) cards.push({ s: G.deck[i], up: G.up.indexOf(i) >= 0, ok: !!G.done[i], bt: G.owner[i] === 'bot' });
    var h = '<div class="top"><button class="bk" data-x>‹</button><h2>' + T('Xotira') + ' · ' + z.t + '</h2><button class="bk" data-r style="font-size:20px">↻</button></div>' +
      '<div class="hud"><span data-pme>🧑 ' + T('Siz') + ': <b data-sme>' + G.sc.me + '</b></span><span data-st></span><span data-pbot>🤖 ' + T('Bot') + ': <b data-sbot>' + G.sc.bot + '</b></span></div>' + timerBar(1, G.tc) +
      boardHtml(z, cards) + '<div class="msg" data-msg></div>';
    ov.innerHTML = h;
    ov.querySelector('[data-x]').onclick = menu;
    ov.querySelector('[data-r]').onclick = function () { stopAll(); startBot(); };
    [].forEach.call(ov.querySelectorAll('[data-i]'), function (e) { e.onclick = function () { tap(+e.getAttribute('data-i')); }; });
    hud(); turnStart();
  }
  function el(i) { return ov && ov.querySelector('[data-i="' + i + '"]'); }
  function hud() {
    if (!ov) return;
    var q = function (s) { return ov.querySelector(s); }; if (!q('[data-sme]')) return;
    q('[data-sme]').textContent = G.sc.me; q('[data-sbot]').textContent = G.sc.bot;
    q('[data-pme]').className = G.turn === 'me' && !G.over ? 'turn' : ''; q('[data-pbot]').className = G.turn === 'bot' && !G.over ? 'turn' : '';
    q('[data-st]').textContent = G.over ? '🏁 ' + T('Tugadi') : G.turn === 'me' ? '👉 ' + T('Navbat sizda') : '🤖 ' + T('Bot o‘ylayapti…');
  }
  function turnStart() {   // har yurishga vaqt (faqat sizning navbatingizda)
    if (G.tm) clearInterval(G.tm); if (G.over) return;
    if (G.turn === 'bot') { setTimeout(botTurn, 650); return; }
    if (!G.tc) return;
    var end = Date.now() + G.tc * 1000;
    G.tm = setInterval(function () {
      var left = end - Date.now(), bar = ov && ov.querySelector('[data-tbar]');
      if (bar) bar.style.width = Math.max(0, left / (G.tc * 1000) * 100) + '%';
      if (left <= 0 && !G.busy) {
        clearInterval(G.tm);
        G.up.forEach(function (x) { var e = el(x); if (e) e.classList.remove('up'); }); G.up = [];
        var m = ov && ov.querySelector('[data-msg]'); if (m) m.textContent = '⏰ ' + T('Vaqt tugadi — navbat botga o‘tdi');
        G.turn = 'bot'; hud(); turnStart();
      }
    }, 200);
  }
  function remember(i) { if (Math.random() < LV[G.lv].mem) G.mem[i] = G.deck[i]; else delete G.mem[i]; }
  function flip(i, who) {
    if (G.done[i] || G.up.indexOf(i) >= 0 || G.up.length >= 2) return false;
    G.up.push(i); var e = el(i); if (e) e.classList.add('up'); hap(); remember(i);
    var m = ov && ov.querySelector('[data-msg]'); if (m) m.textContent = '';
    if (G.up.length === 2) {
      G.mv++; G.busy = true;
      var a = G.up[0], b = G.up[1];
      if (G.deck[a] === G.deck[b]) {
        G.done[a] = G.done[b] = 1; G.owner[a] = G.owner[b] = who; delete G.mem[a]; delete G.mem[b]; G.sc[who]++;
        setTimeout(function () { [a, b].forEach(function (x) { var e2 = el(x); if (e2) { e2.classList.add('ok'); if (who === 'bot') e2.classList.add('bt'); } }); G.up = []; G.busy = false; hap('ok'); hud(); if (!check()) turnStart(); }, 380);
      } else {
        if (G.tm) clearInterval(G.tm);
        setTimeout(function () { [a, b].forEach(function (x) { var e2 = el(x); if (e2) e2.classList.remove('up'); }); G.up = []; G.busy = false; hap('no'); G.turn = who === 'me' ? 'bot' : 'me'; hud(); turnStart(); }, who === 'bot' ? 1100 : 850);
      }
    }
    return true;
  }
  function tap(i) { if (G.over || G.busy || G.turn !== 'me') return; flip(i, 'me'); }
  function botTurn() {
    if (G.over || G.turn !== 'bot' || G.busy || !ov) return;
    var left = []; for (var i = 0; i < G.deck.length; i++) if (!G.done[i]) left.push(i);
    if (!left.length) return;
    var seen = {}, pair = null;
    for (var k in G.mem) { var v = G.mem[k]; if (G.done[k]) continue; if (seen[v] != null) { pair = [seen[v], +k]; break; } seen[v] = +k; }
    var first = pair ? pair[0] : null;
    if (first == null) { var unk = left.filter(function (x) { return G.mem[x] == null; }); var pool = unk.length ? unk : left; first = pool[Math.floor(Math.random() * pool.length)]; }
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
    if (Object.keys(G.done).length < G.deck.length || G.over) return false;
    stopAll(); G.over = true; hud();
    var win = G.sc.me > G.sc.bot, draw = G.sc.me === G.sc.bot;
    setTimeout(function () {
      endCard(win ? '🏆' : draw ? '🤝' : '🤖', win ? T('Siz yutdingiz!') : draw ? T('Durang!') : T('Bot yutdi'), G.sc.me + ' : ' + G.sc.bot, function () { stopAll(); startBot(); });
      api('/api/memori/done', { n: G.z.k, mode: 'bot', lv: G.lv, mv: G.mv, ms: Date.now() - G.t0, win: win, me: G.sc.me, bot: G.sc.bot }).then(function (d) {
        var rw = ov && ov.querySelector('[data-rw]'); if (!d || !rw) return;
        var t = []; if (d.gain) t.push('+' + d.gain + ' 🪙'); if (d.capped) t.push(T('Bugungi tanga limiti tugadi'));
        rw.textContent = t.join(' · '); if (d.gain && opts.onCoins) try { opts.onCoins(d.gain); } catch (e) {}
      });
    }, 500);
    return true;
  }
  function endCard(ic, title, sub, again) {
    var m = ov && ov.querySelector('[data-msg]'); if (!m) return;
    m.innerHTML = '<div class="cd end"><div class="big">' + ic + '</div><b style="font-size:20px">' + title + '</b><div style="margin-top:6px;font-size:18px">' + sub + '</div><div data-rw style="margin-top:6px;color:#ffd54f"></div>' +
      '<button class="go" data-again>↻ ' + T('Yana o‘ynash') + '</button><button class="go g2" data-menu>☰ ' + T('Menyu') + '</button></div>';
    m.querySelector('[data-again]').onclick = again; m.querySelector('[data-menu]').onclick = menu;
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------------- 👥 do'st bilan (onlayn)
  function wsUrl() { return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host; }
  function net(cb) {
    if (WS && WS.readyState === 1) return cb();
    try { if (WS) WS.close(); } catch (e) {}
    WS = new WebSocket(wsUrl());
    WS.onopen = cb;
    WS.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } onNet(m); };
    WS.onclose = function () { if (NET && NET.code && ov && !NET.left) setTimeout(function () { if (NET && !NET.left) net(function () { WS.send(JSON.stringify({ type: 'mmJoin', init: (tg && tg.initData) || '', code: NET.code })); }); }, 1500); };
  }
  function sendN(o) { if (WS && WS.readyState === 1) WS.send(JSON.stringify(o)); }
  function netCreate() {
    shell(); ov.innerHTML = '<div class="top"><button class="bk" data-x>‹</button><h2>👥 ' + T('Do‘st bilan') + '</h2></div><div class="cd" style="text-align:center">⏳ ' + T('Ulanmoqda…') + '</div>';
    ov.querySelector('[data-x]').onclick = menu;
    NET = { left: false };
    net(function () { sendN({ type: 'mmCreate', init: (tg && tg.initData) || '', size: CFG.size, tc: CFG.tc, theme: CFG.theme, symbols: symbols(CFG.theme) }); });
  }
  function netJoin(code) {
    shell(); ov.innerHTML = '<div class="top"><button class="bk" data-x>‹</button><h2>👥 ' + T('Do‘st bilan') + '</h2></div><div class="cd" style="text-align:center">⏳ ' + T('Ulanmoqda…') + '</div>';
    ov.querySelector('[data-x]').onclick = menu;
    NET = { code: code, left: false };
    net(function () { sendN({ type: 'mmJoin', init: (tg && tg.initData) || '', code: code }); });
  }
  function netLeave() { if (NET && NET.code) { NET.left = true; sendN({ type: 'mmLeave', code: NET.code }); } NET = null; try { if (WS) WS.close(); } catch (e) {} WS = null; }
  function shareLink(code) { return (window.TG_APP_LINK || 'https://t.me/DraughtsPRObot/play') + '?startapp=mm_' + code; }
  function onNet(m) {
    if (!ov || !NET) return;
    if (m.type === 'mmErr') { ov.innerHTML = '<div class="top"><button class="bk" data-x>‹</button><h2>Xotira</h2></div><div class="cd" style="text-align:center">⚠️ ' + esc(T(m.msg)) + '</div><button class="go g2" data-x2>☰ ' + T('Menyu') + '</button>'; ov.querySelector('[data-x]').onclick = menu; ov.querySelector('[data-x2]').onclick = menu; NET = null; return; }
    if (m.type === 'mmAgainAsk') { var mm = ov.querySelector('[data-rw]'); if (mm) mm.textContent = '🔁 ' + T('Do‘stingiz yana o‘ynashni xohlayapti'); return; }
    if (m.type !== 'mmState') return;
    NET.code = m.code; NET.st = m;
    var z = sizeOf(m.size), me = m.me, op = 1 - me;
    if (m.status === 'wait') {
      var link = shareLink(m.code);
      ov.innerHTML = '<div class="top"><button class="bk" data-x>‹</button><h2>👥 ' + T('Do‘st bilan') + '</h2></div>' +
        '<div class="cd" style="text-align:center">' + T('O‘yin kodi') + '<div class="code">' + m.code + '</div>' + z.t + ' · ' + (m.tc ? '⏱ ' + m.tc + ' s' : '∞') + '<br><br>⏳ ' + T('Do‘stingiz kutilmoqda…') + '</div>' +
        '<button class="go" data-sh>📤 ' + T('Do‘stga yuborish') + '</button><button class="go g2" data-cp>📋 ' + T('Havolani nusxalash') + '</button>';
      ov.querySelector('[data-x]').onclick = menu;
      ov.querySelector('[data-sh]').onclick = function () {
        var txt = '🧠 ' + T('Xotira o‘yinini o‘ynaymizmi? Kod:') + ' ' + m.code;
        var u = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(txt);
        try { if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, '_blank'); } catch (e) { window.open(u, '_blank'); }
      };
      ov.querySelector('[data-cp]').onclick = function () { try { navigator.clipboard.writeText(link); this.textContent = '✅ ' + T('Nusxalandi'); } catch (e) {} };
      return;
    }
    var cards = m.cards.map(function (c) { return c ? { s: c.s, up: !c.o, ok: !!c.o, bt: c.o && c.o - 1 !== me } : null; });
    var P = m.players, myTurn = m.turn === me && m.status === 'play';
    var h = '<div class="top"><button class="bk" data-x>‹</button><h2>' + T('Xotira') + ' · ' + z.t + '</h2></div>' +
      '<div class="hud"><span class="' + (myTurn ? 'turn' : '') + '">🧑 ' + esc(P[me] ? P[me].name : T('Siz')) + ': <b>' + (P[me] ? P[me].sc : 0) + '</b></span><span>' +
      (m.status === 'over' ? '🏁' : myTurn ? '👉 ' + T('Siz') : '⏳') + '</span><span class="' + (!myTurn && m.status === 'play' ? 'turn' : '') + '">' + (P[op] && !P[op].on ? '📴 ' : '👤 ') + esc(P[op] ? P[op].name : '…') + ': <b>' + (P[op] ? P[op].sc : 0) + '</b></span></div>' +
      timerBar(m.left, m.tc * 1000) + boardHtml(z, cards) + '<div class="msg" data-msg>' + (m.status === 'play' ? (myTurn ? '👉 ' + T('Navbat sizda') : '⏳ ' + T('Do‘stingiz yurmoqda…')) : '') + '</div>';
    ov.innerHTML = h;
    ov.querySelector('[data-x]').onclick = menu;
    [].forEach.call(ov.querySelectorAll('[data-i]'), function (e) { e.onclick = function () { if (NET && NET.st && NET.st.turn === NET.st.me && NET.st.status === 'play') { sendN({ type: 'mmFlip', code: NET.code, i: +e.getAttribute('data-i') }); hap(); } }; });
    if (G.tm) clearInterval(G.tm);
    if (m.status === 'play' && m.tc && m.left) {
      var end = Date.now() + m.left;
      G.tm = setInterval(function () { var bar = ov && ov.querySelector('[data-tbar]'); if (!bar) return clearInterval(G.tm); bar.style.width = Math.max(0, (end - Date.now()) / (m.tc * 1000) * 100) + '%'; }, 200);
    }
    if (m.status === 'over') {
      var win = m.winner === me, draw = m.winner === -1;
      endCard(win ? '🏆' : draw ? '🤝' : '😔', win ? T('Siz yutdingiz!') : draw ? T('Durang!') : T('Do‘stingiz yutdi'),
        (P[me] ? P[me].sc : 0) + ' : ' + (P[op] ? P[op].sc : 0) + (m.quit != null && m.quit !== me ? '<br><small>' + T('Raqib o‘yindan chiqdi') + '</small>' : ''),
        function () { sendN({ type: 'mmAgain', code: NET.code }); var b = ov.querySelector('[data-again]'); if (b) b.textContent = '⏳ ' + T('Do‘stingiz kutilmoqda…'); });
      var rw = ov.querySelector('[data-rw]'); if (rw && m.gain && m.gain[me]) { rw.textContent = '+' + m.gain[me] + ' 🪙'; if (opts.onCoins && !NET.paid) { NET.paid = 1; try { opts.onCoins(m.gain[me]); } catch (e) {} } }
      if (m.status === 'over') NET.paid = NET.paid || 0;
    } else if (NET) NET.paid = 0;
  }

  window.spMemori = function (o) {
    opts = o || {};
    if (ov) { stopAll(); netLeave(); ov.remove(); ov = null; }
    if (opts.join) return netJoin(String(opts.join).toUpperCase());
    menu();
  };
  // havola orqali kirish: startapp=mm_KOD
  try {
    var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
    var mjoin = /^mm_([A-Z0-9]{6})$/i.exec(sp || '');
    if (mjoin && !window.__mmJoined) { window.__mmJoined = 1; setTimeout(function () { window.spMemori({ join: mjoin[1] }); }, 1200); }
  } catch (e) {}
})();
