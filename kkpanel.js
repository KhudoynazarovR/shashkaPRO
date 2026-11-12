/* kkpanel.js — 🦍 King Kong xatolari (faqat admin): o'yinlar ro'yxati → o'yin → xatoga darhol o'tish → to'g'ri yurishni bir bosishda o'rgatish.
   Server: /api/kkadm (ro'yxat, o'yin tahlili, xavfsiz yurishlar), /api/kkbook/add (o'rgatish). Doska: ☰ Menyu'dagi 12 ta doskadan tanlanadi. */
;(function () {
  if (window.kkPanel) return;
  var BDS = [["Yog‘och", "#EFD9B1", "#B58863"], ["Ko‘k-kul", "#DEE3E6", "#8CA2AD"], ["Yashil", "#FFFFDD", "#86A666"], ["Kulrang", "#DDDDDD", "#A0A0A0"], ["Qizil", "#F1D5CC", "#B5685D"], ["Binafsha", "#E3DAEE", "#8B72B5"], ["Feruza", "#D5F0EC", "#4A9A93"], ["Tungi", "#9AA5B8", "#3E4A5E"], ["Oltin", "#F7E7B4", "linear-gradient(135deg,#C9A227,#8A6508)"], ["Marmar", "linear-gradient(135deg,#FAFAFA,#E3E3E0 55%,#F5F5F3)", "linear-gradient(135deg,#4B5563,#1F2937)"], ["Malaxit", "#D9F2E3", "linear-gradient(135deg,#0F766E,#064E3B)"], ["Neon", "#1E1B4B", "linear-gradient(135deg,#7C3AED,#DB2777)"]];
  var SQ = function (i) { return 'abcdefgh'[i & 7] + (8 - (i >> 3)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hd() { return { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  function get(u) { return fetch(u, { headers: hd() }).then(function (r) { return r.json(); }); }
  function post(u, b) { return fetch(u, { method: 'POST', headers: hd(), body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function bdIdx() { var v = ls('kka_bd', null); if (v != null && BDS[v]) return v; var m = ls('rc_menu_v1', {}); return m && m.board >= 0 && BDS[m.board] ? m.board : 0; }
  var O, V = { tab: 'l', list: null, g: null, cur: 0, pick: null, sel: -1, safe: null, msg: '', busy: false };
  var css = document.createElement('style');
  css.textContent = '#kkP{position:fixed;inset:0;z-index:99990;background:#100c33;color:#fff;overflow:auto;font:15px system-ui,-apple-system,Roboto,sans-serif;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(20px + env(safe-area-inset-bottom,0px))}' +
    '#kkP .in{max-width:520px;margin:0 auto}#kkP button{font:inherit;color:inherit;border:0;cursor:pointer}' +
    '#kkP .top{display:flex;align-items:center;gap:10px;margin-bottom:10px}#kkP .top b{flex:1;font-size:18px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#kkP .bk{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.1);font-size:22px;flex:none}' +
    '#kkP .st{display:flex;gap:6px;margin-bottom:8px}#kkP .st div{flex:1;background:#1d1858;border-radius:12px;padding:8px 2px;text-align:center}#kkP .st b{display:block;font-size:19px}#kkP .st small{font-size:11px;opacity:.7}' +
    '#kkP .tabs{display:flex;gap:6px;margin:8px 0}#kkP .tabs button{flex:1;padding:9px 4px;border-radius:11px;background:#1d1858;font-size:13px;font-weight:700}#kkP .tabs .on{background:#3fa34d}' +
    '#kkP .gm{display:flex;align-items:center;gap:10px;margin:6px 0;padding:10px 12px;border-radius:14px;background:#1d1858;width:100%;text-align:left}#kkP .gm .r{font-size:22px}#kkP .gm .n{flex:1;min-width:0}#kkP .gm .n small{display:block;opacity:.65;font-size:12px}' +
    '#kkP .tg{border-radius:9px;padding:4px 8px;font-size:12px;font-weight:800;background:#7c2d12;color:#fed7aa;white-space:nowrap}#kkP .tg.ok{background:#14532d;color:#bbf7d0}#kkP .tg.q{background:#2a2470;color:#c7c2ff}' +
    '#kkP .bd{display:grid;grid-template-columns:repeat(8,1fr);border:5px solid #6b3a1e;border-radius:8px;overflow:hidden;margin:6px 0;touch-action:manipulation}#kkP .c{aspect-ratio:1;position:relative;display:flex;align-items:center;justify-content:center}' +
    '#kkP .c.fr::after,#kkP .c.to::after{content:"";position:absolute;inset:0;background:rgba(225,29,72,.45)}#kkP .c.gf::after,#kkP .c.gt::after{content:"";position:absolute;inset:0;background:rgba(63,163,77,.6)}#kkP .c.sl::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 3px #ffd257}' +
    '#kkP .pc{width:80%;height:80%;border-radius:50%;z-index:2;display:flex;align-items:center;justify-content:center;font-size:min(5vw,22px);box-shadow:inset 0 -3px 0 rgba(0,0,0,.3),0 2px 3px rgba(0,0,0,.45)}#kkP .pc.w{background:radial-gradient(circle at 35% 30%,#fff,#d9d3c3);color:#b8860b}#kkP .pc.b{background:radial-gradient(circle at 35% 30%,#555,#111);color:#ffd257}' +
    '#kkP .dot{position:absolute;width:28%;height:28%;border-radius:50%;background:rgba(40,150,60,.85);z-index:3}' +
    '#kkP .mv{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0;font:12.5px ui-monospace,monospace;max-height:120px;overflow:auto}#kkP .mv span{padding:4px 6px;border-radius:7px;background:#1d1858}#kkP .mv .k{background:#2a2470}#kkP .mv .x{background:#be123c;font-weight:800}#kkP .mv .t{background:#14532d}#kkP .mv .cur{outline:2px solid #ffd257}' +
    '#kkP .nav{display:flex;gap:6px;margin:6px 0}#kkP .nav button{flex:1;padding:11px 2px;border-radius:11px;background:#2a2470;font-weight:800;font-size:15px}#kkP .nav .er{background:#be123c;flex:1.6;font-size:13.5px}' +
    '#kkP .box{padding:12px;border-radius:14px;background:#1d1858;font-size:13.5px;line-height:1.5;margin:6px 0}#kkP .h{font-size:12px;letter-spacing:.5px;color:#a9a4d8;font-weight:800;margin-bottom:4px}' +
    '#kkP .ch{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#kkP .ch button{padding:8px 10px;border-radius:10px;background:#16124a;border:1px solid #3a33a0;font-weight:700;font-size:13px}#kkP .ch .on{background:#3fa34d;border-color:#3fa34d}#kkP .ch .bad{opacity:.55}' +
    '#kkP .go{width:100%;margin-top:8px;padding:13px;border-radius:13px;background:#3fa34d;font-weight:800;font-size:15.5px}#kkP .go:disabled{opacity:.45}#kkP .msg{text-align:center;margin:8px 0;font-weight:700}' +
    '#kkP .bdp{display:flex;gap:5px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}#kkP .bdp button{flex:none;width:34px;height:34px;border-radius:8px;border:2px solid transparent;padding:0;overflow:hidden;display:grid;grid-template-columns:1fr 1fr}#kkP .bdp .on{border-color:#ffd257}#kkP .bdp i{display:block}';
  document.head.appendChild(css);

  function close() { if (O) O.remove(); O = null; }
  function shell(title, back) { O.innerHTML = '<div class="in"><div class="top"><button class="bk" id="kkB">‹</button><b>' + title + '</b></div><div id="kkC"></div></div>'; O.querySelector('#kkB').onclick = back; return O.querySelector('#kkC'); }
  function when(t) { var d = new Date(t), n = new Date(), hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); return (d.toDateString() === n.toDateString() ? 'bugun ' : d.toDateString() === new Date(Date.now() - 864e5).toDateString() ? 'kecha ' : d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + ' ') + hm; }

  // ---------- 1) ro'yxat
  function list() {
    V.g = null;
    var C = shell('🦍 King Kong xatolari', close);
    C.innerHTML = '<div class="msg">Yuklanmoqda…</div>';
    get('/api/kkadm').then(function (d) {
      if (d.error) { C.innerHTML = '<div class="msg">⚠️ ' + esc(d.error) + '</div>'; return; }
      V.list = d; drawList();
    }).catch(function () { C.innerHTML = '<div class="msg">⚠️ Server bilan aloqa yo‘q</div>'; });
  }
  function drawList() {
    var C = O.querySelector('#kkC'), d = V.list, t = d.today || {};
    var L = d.games.filter(function (g) { return V.tab === 'a' ? true : V.tab === 'l' ? g.res !== 'w' : (g.errs || g.guard); });
    C.innerHTML = '<div class="st"><div><b>' + t.n + '</b><small>bugun</small></div><div><b style="color:#86efac">' + t.w + '</b><small>yutdi</small></div><div><b style="color:#fca5a5">' + t.l + '</b><small>yutqazdi</small></div><div><b style="color:#fdba74">' + t.e + '</b><small>⚠️ xato</small></div></div>' +
      (d.guard && d.guard.n ? '<div style="font-size:12.5px;opacity:.75;margin:-2px 2px 6px">🛡 Qo‘riqchi: ' + d.guard.n + ' tekshiruv, ' + d.guard.swap + ' marta yurishni almashtirdi (o‘rtacha ' + Math.round(d.guard.ms / d.guard.n) + ' ms)</div>' : '') +
      '<div class="tabs"><button data-t="l"' + (V.tab === 'l' ? ' class="on"' : '') + '>❌ Yutqazgan</button><button data-t="e"' + (V.tab === 'e' ? ' class="on"' : '') + '>⚠️ Xatoli</button><button data-t="a"' + (V.tab === 'a' ? ' class="on"' : '') + '>Hammasi</button></div>' +
      (L.length ? L.map(function (g) {
        var tag = g.errs == null ? '<span class="tg q">⏳ tekshirilmagan</span>' : g.errs && g.fixed >= g.errs ? '<span class="tg ok">✅ tuzatilgan</span>' : g.errs ? '<span class="tg">⚠️ ' + (g.errs - g.fixed) + '</span>' : '<span class="tg ok">✓ toza</span>';
        return '<button class="gm" data-id="' + esc(g.id) + '"><span class="r">' + (g.res === 'w' ? '✅' : g.res === 'l' ? '❌' : '🤝') + '</span><span class="n">' + esc(g.opp) + '<small>' + when(g.at) + ' · ' + esc(g.tc || '∞') + ' · ' + g.n + ' yurish' + (g.guard ? ' · 🛡 ' + g.guard : '') + '</small></span>' + tag + '</button>';
      }).join('') : '<div class="msg" style="opacity:.7">Bu yerda hozircha o‘yin yo‘q</div>');
    [].forEach.call(C.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { V.tab = b.getAttribute('data-t'); drawList(); }; });
    [].forEach.call(C.querySelectorAll('[data-id]'), function (b) { b.onclick = function () { game(b.getAttribute('data-id')); }; });
  }

  // ---------- 2) o'yin
  function game(id) {
    var C = shell('🦍 …', list);
    C.innerHTML = '<div class="msg">⏳ King Kong yurishlari tekshirilmoqda…</div>';
    post('/api/kkadm/game', { id: id }).then(function (g) {
      if (g.error) { C.innerHTML = '<div class="msg">⚠️ ' + esc(g.error) + '</div>'; return; }
      V.g = g; V.pick = null; V.sel = -1; V.safe = null; V.msg = '';
      var e = g.moves.findIndex(function (x) { return x.kk && x.err && !x.taught; });
      V.cur = e >= 0 ? e : Math.max(0, g.moves.length - 1);
      O.querySelector('.top b').textContent = (g.res === 'w' ? '✅ ' : g.res === 'l' ? '❌ ' : '🤝 ') + 'King Kong — ' + g.opp;
      drawGame();
    }).catch(function () { C.innerHTML = '<div class="msg">⚠️ Server bilan aloqa yo‘q</div>'; });
  }
  function num(k) { var g = V.g, first = g.moves[0] ? g.moves[0].s : 1, n = Math.floor((k + (first === -1 ? 1 : 0)) / 2) + 1; return n + (g.moves[k].s === 1 ? '. ' : '... '); }
  function srcTxt(x) { return x.g ? '🛡 qo‘riqchi (' + x.g.t + ' o‘rniga)' : ({ 'dvigatel': '⚙️ dvigatel', 'Colette': '📘 Colette', 'kitob': '📖 kitob', 'admin': '🦍 o‘rgatilgan', 'baza': '♟ baza', 'etyud': '🧩 etyud', 'xotira': '💾 xotira' })[x.src] || '⚙️ dvigatel'; }
  function drawGame() {
    var g = V.g, x = g.moves[V.cur], C = O.querySelector('#kkC'); if (!x) return;
    var flip = g.kk === -1, bi = bdIdx(), BD = BDS[bi], hl = {}, alt = V.pick, tgt = {};
    hl[x.from] = 'fr'; hl[x.to] = 'to';
    if (alt) { hl[alt.from] = 'gf'; hl[alt.to] = 'gt'; }
    if (V.sel >= 0) { hl[V.sel] = (hl[V.sel] || '') + ' sl'; (V.safe || []).forEach(function (m) { if (m.from === V.sel) tgt[m.to] = m; }); }
    var h = '<div class="bdp">' + BDS.map(function (b, i) { return '<button data-bd="' + i + '" title="' + b[0] + '"' + (i === bi ? ' class="on"' : '') + '><i style="background:' + b[1] + '"></i><i style="background:' + b[2] + '"></i></button>'; }).join('') + '</div>';
    h += '<div class="bd" id="kkBd">';
    for (var v = 0; v < 64; v++) {
      var i = flip ? 63 - v : v, r = i >> 3, c = i & 7, p = x.b[i], dark = (r + c) % 2 === 1;
      h += '<div class="c ' + (hl[i] || '') + '" data-i="' + i + '" style="background:' + (dark ? BD[2] : BD[1]) + '">' + (p ? '<i class="pc ' + (p > 0 ? 'w' : 'b') + '">' + (Math.abs(p) === 2 ? '♛' : '') + '</i>' : '') + (tgt[i] ? '<i class="dot"></i>' : '') + '</div>';
    }
    h += '</div><div class="mv">' + g.moves.map(function (m, k) { return '<span data-k="' + k + '" class="' + (m.kk ? 'k' : '') + (m.kk && m.err && !m.taught ? ' x' : '') + (m.taught ? ' t' : '') + (k === V.cur ? ' cur' : '') + '">' + (m.s === 1 || k === 0 ? num(k) : '') + m.t + (m.kk && m.err && !m.taught ? ' ⚠️' : '') + (m.g ? ' 🛡' : '') + '</span>'; }).join('') + '</div>';
    h += '<div class="nav"><button data-n="0">⏮</button><button data-n="-1">◀</button><button class="er" data-n="e">⚠️ Keyingi xato</button><button data-n="1">▶</button></div>';
    // ma'lumot qutisi
    var who = x.kk ? 'KING KONG (' + (x.s === 1 ? 'OQ' : 'QORA') + ') O‘YNADI' : 'RAQIB O‘YNADI';
    h += '<div class="box"><div class="h">' + num(V.cur).replace('... ', '').replace('. ', '') + '-YURISH · ' + who + '</div>';
    h += '<b style="color:' + (x.err && !x.taught ? '#fca5a5' : '#fff') + '">' + x.t + '</b>' + (x.kk ? ' — ' + srcTxt(x) : '');
    if (x.kk && x.err) h += '<br>⚠️ <b>' + x.err.loss + ' dona yo‘qotadi</b>' + (x.err.line && x.err.line.length ? ': ' + x.err.line.join(' ') : '');
    if (x.taught) h += '<br>✅ O‘rgatilgan: endi bu yerda <b>' + SQ(x.taught.from) + '-' + SQ(x.taught.to) + '</b> o‘ynaydi';
    if (x.kk) {
      var opts = x.err ? x.err.safe : null;
      if (opts && opts.length) h += '<div class="ch">' + opts.map(function (m, k) { return '<button data-a="' + k + '"' + (alt && alt.from === m.from && alt.to === m.to ? ' class="on"' : '') + '>✅ ' + m.t + '</button>'; }).join('') + '<button data-pick="1"' + (V.sel >= 0 || (alt && alt.own) ? ' class="on"' : '') + '>♟ Doskadan tanlash</button></div>';
      else h += '<div class="ch"><button data-pick="1"' + (V.sel >= 0 || (alt && alt.own) ? ' class="on"' : '') + '>♟ Boshqa yurish tanlash</button></div>';
      if (V.sel >= 0) h += '<div style="margin-top:6px;opacity:.8;font-size:12.5px">Yashil nuqtali katakni bosing (⚠️ — dona yo‘qotadigan yurish)</div>';
      if (alt) h += '<button class="go" id="kkT"' + (V.busy ? ' disabled' : '') + '>✅ O‘rgatish: ' + x.t + ' o‘rniga ' + alt.t + '</button>';
    }
    h += '</div>' + (V.msg ? '<div class="msg">' + V.msg + '</div>' : '');
    C.innerHTML = h;
    [].forEach.call(C.querySelectorAll('[data-bd]'), function (b) { b.onclick = function () { lss('kka_bd', +b.getAttribute('data-bd')); drawGame(); }; });
    [].forEach.call(C.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { go(+b.getAttribute('data-k')); }; });
    [].forEach.call(C.querySelectorAll('[data-n]'), function (b) {
      b.onclick = function () {
        var n = b.getAttribute('data-n');
        if (n === 'e') { var L = g.moves, k = L.findIndex(function (m, j) { return j > V.cur && m.kk && m.err && !m.taught; }); if (k < 0) k = L.findIndex(function (m) { return m.kk && m.err && !m.taught; }); if (k < 0) { V.msg = '✅ Bu o‘yinda tuzatilmagan xato qolmadi'; drawGame(); return; } return go(k); }
        go(n === '0' ? 0 : V.cur + +n);
      };
    });
    [].forEach.call(C.querySelectorAll('[data-a]'), function (b) { b.onclick = function () { var m = x.err.safe[+b.getAttribute('data-a')]; V.pick = { from: m.from, to: m.to, t: m.t }; V.sel = -1; drawGame(); }; });
    var pk = C.querySelector('[data-pick]'); if (pk) pk.onclick = function () { V.pick = null; V.sel = -1; loadSafe(function () { V.msg = '♟ Donani bosing'; V.selMode = true; drawGame(); }); };
    C.querySelector('#kkBd').onclick = function (e) { var el = e.target.closest('[data-i]'); if (el) tap(+el.getAttribute('data-i')); };
    var tb = C.querySelector('#kkT'); if (tb) tb.onclick = teach;
  }
  function go(k) { if (!V.g || k < 0 || k >= V.g.moves.length) return; V.cur = k; V.pick = null; V.sel = -1; V.safe = null; V.selMode = false; V.msg = ''; drawGame(); }
  function loadSafe(cb) { var x = V.g.moves[V.cur]; if (V.safe) return cb(); post('/api/kkadm/safe', { board: x.b, side: x.s }).then(function (r) { V.safe = r.list || []; cb(); }).catch(function () { V.msg = '⚠️ Server bilan aloqa yo‘q'; drawGame(); }); }
  function tap(i) {
    var x = V.g.moves[V.cur]; if (!x.kk || !V.selMode || !V.safe) return;
    if (V.sel >= 0) { var m = V.safe.filter(function (y) { return y.from === V.sel && y.to === i; })[0]; if (m) { var best = V.safe.length ? V.safe[0].v : 0; V.pick = { from: m.from, to: m.to, t: m.t + (m.v < best ? ' ⚠️' : ''), own: true }; V.sel = -1; V.selMode = false; V.msg = ''; drawGame(); return; } }
    if (x.b[i] && Math.sign(x.b[i]) === x.s && V.safe.some(function (y) { return y.from === i; })) { V.sel = i; V.msg = ''; drawGame(); }
  }
  function teach() {
    var x = V.g.moves[V.cur], a = V.pick; if (!a || V.busy) return;
    V.busy = true; drawGame();
    post('/api/kkbook/add', { board: x.b, side: x.s, from: a.from, to: a.to }).then(function (r) {
      V.busy = false;
      if (r.error) { V.msg = '⚠️ ' + esc(r.error); return drawGame(); }
      x.taught = { from: a.from, to: a.to }; V.pick = null;
      V.msg = '✅ O‘rgatildi! King Kong endi bu pozitsiyada ' + esc(a.t.replace(' ⚠️', '')) + ' o‘ynaydi';
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {}
      drawGame();
    }).catch(function () { V.busy = false; V.msg = '⚠️ Server bilan aloqa yo‘q'; drawGame(); });
  }
  window.kkPanel = function () { if (O) O.remove(); O = document.createElement('div'); O.id = 'kkP'; document.body.appendChild(O); list(); };
})();
