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
  css.textContent = '#kkP{position:fixed;inset:0;z-index:2147482000;background:#100c33;color:#fff;overflow:auto;font:15px system-ui,-apple-system,Roboto,sans-serif;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(96px + env(safe-area-inset-bottom,0px))}' +
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
  css.textContent += '#kkP .cl{position:absolute;font:800 9.5px system-ui,sans-serif;pointer-events:none;z-index:5;line-height:1}#kkP .cl.n{left:2px;top:2px}#kkP .cl.a{right:3px;bottom:2px}' +
    '#kkP .hero{border-radius:18px;padding:14px;margin:4px 0 10px;background:linear-gradient(135deg,#7c2d12,#be123c);box-shadow:0 6px 18px rgba(190,18,60,.35)}#kkP .hero.ok{background:linear-gradient(135deg,#14532d,#15803d);box-shadow:none}#kkP .hero b{font-size:19px;display:block}#kkP .hero p{font-size:13px;opacity:.9;margin:4px 0 10px;line-height:1.4}#kkP .hero button{width:100%;background:#fff;color:#9f1239;border-radius:12px;padding:11px;font-weight:900;font-size:15px}' +
    '#kkP .auto{background:#1d1858;border-radius:14px;padding:11px 12px;display:flex;align-items:center;gap:10px;font-size:13.5px;margin-bottom:6px;width:100%;text-align:left}#kkP .auto small{display:block;opacity:.7;font-size:12px}#kkP .sw{width:46px;height:27px;border-radius:14px;background:#4b4680;position:relative;flex:none}#kkP .sw:after{content:"";position:absolute;left:3px;top:3px;width:21px;height:21px;border-radius:50%;background:#fff;transition:.2s}#kkP .sw.on{background:#16a34a}#kkP .sw.on:after{left:22px}' +
    '#kkP .sec{margin:14px 2px 4px;font-size:12px;color:#a9a4d8;font-weight:800;letter-spacing:.5px}' +
    '#kkP .sb{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;gap:8px;padding:10px 12px calc(12px + env(safe-area-inset-bottom,0px));background:#16124a;box-shadow:0 -6px 18px rgba(0,0,0,.35)}#kkP .sb button{flex:1;padding:13px 4px;border-radius:13px;font-weight:900;font-size:14.5px;background:#3a3480}#kkP .sb .y{background:#16a34a}#kkP .sb .o{background:#2563eb}#kkP .sb button:disabled{opacity:.45}' +
    '#kkP .cmp{display:flex;gap:8px;margin-top:9px}#kkP .cmp div{flex:1;border-radius:12px;padding:8px;font-size:13px;text-align:center}#kkP .cmp .bad{background:#3b0d18;color:#fca5a5}#kkP .cmp .good{background:#0f3d22;color:#86efac}#kkP .cmp b{display:block;font-size:17px}' +
    '#kkP .dots{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin:2px 0 6px}#kkP .dots i{width:7px;height:7px;border-radius:50%;background:#3a3480}#kkP .dots i.on{background:#fbbf24;width:18px;border-radius:4px}' +
    '#kkP .bdw{position:relative}#kkP svg.ar{position:absolute;left:5px;top:5px;width:calc(100% - 10px);height:calc(100% - 10px);pointer-events:none;z-index:4}' +
    '#kkP .row{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:12px;background:#1d1858;margin:5px 0;font-size:13.5px}#kkP .row .f{flex:1;min-width:0}#kkP .row small{opacity:.7;display:block;font-size:12px}#kkP .row button{background:#3a3480;border-radius:9px;padding:6px 9px;font-size:12.5px;font-weight:700}' +
    '#kkP .pill{display:inline-block;border-radius:8px;padding:2px 7px;font-size:11.5px;font-weight:800;background:#2a2470;margin-left:4px}';
  document.head.appendChild(css);

  // ♟ dona: Do'kondan tanlangan bo'lsa — o'sha rasm (damka ham), aks holda oddiy dona va tekis oltin toj
  var CROWN = '<svg viewBox="0 0 24 24" style="width:60%;height:60%;display:block"><path d="M3.5 17.5h17l-1.4-8.6-4.3 3.9L12 6l-2.8 6.8-4.3-3.9z" fill="#e3b21c" stroke="#7a5a00" stroke-width="1.1" stroke-linejoin="round"/><rect x="3.5" y="18.3" width="17" height="2.2" rx="1" fill="#e3b21c" stroke="#7a5a00" stroke-width=".8"/></svg>';
  function pcHtml(p) {
    var w = p > 0, k = Math.abs(p) === 2;
    if (window.spEqId) return '<i class="pc" style="background:url(&quot;/api/shop/img?id=' + encodeURIComponent(window.spEqId) + '&amp;k=' + (w ? 'w' : 'b') + (k ? 'k' : '') + '&quot;) center/contain no-repeat;box-shadow:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.45))"></i>';
    return '<i class="pc ' + (w ? 'w' : 'b') + '">' + (k ? CROWN : '') + '</i>';
  }
  // 🔬 to'liq tahlil (lichess kabi) — o'yinchilar tahlil taxtasi (board.js) bilan bir xil
  function openAna() {
    var g = V.g; if (!g || !g.moves.length) return;
    var b0 = g.moves[0].b, st = '';
    for (var i = 0; i < 64; i++) { if (((i >> 3) + (i & 7)) % 2 !== 1) continue; var v = b0[i]; st += v === 1 ? 'w' : v === 2 ? 'W' : v === -1 ? 'b' : v === -2 ? 'B' : '0'; }
    var steps = [], at = 0; g.moves.forEach(function (m, k) { if (k === V.cur) at = steps.length; (m.st || []).forEach(function (x) { steps.push(x); }); });
    var kkW = g.kk === 1, arg = { moves: steps, start: st, first: g.moves[0].s === -1 ? 'black' : 'white', white: kkW ? 'King Kong' : g.opp, black: kkW ? g.opp : 'King Kong', winner: g.res === 'd' ? 'draw' : (g.res === 'w') === kkW ? 'white' : 'black', at: at, flip: g.kk === -1 };
    var run = function () { window.spBoard(arg); };
    if (window.spBoard) run(); else { var sc = document.createElement('script'); sc.src = '/board.js'; sc.onload = run; document.head.appendChild(sc); }
  }
  function close() { if (O) O.remove(); O = null; }
  function sbar(html) { var o = O.querySelector('.sb'); if (o) o.remove(); if (!html) return null; O.insertAdjacentHTML('beforeend', '<div class="sb">' + html + '</div>'); return O.querySelector('.sb'); }
  function heroHtml(d) {
    var f = d.fx && d.fx.fix; if (!f) return '';
    var h = f.pending ? '<div class="hero"><b>⚡ ' + f.pending + ' ta tuzatish' + (f.ready < f.pending ? ' (' + f.ready + ' tasi tayyor)' : ' tayyor') + '</b><p>King Kong xatolarini o‘zi topdi va har biriga dvigatel 15 s o‘ylab to‘g‘ri yurish tanladi' + (f.ready < f.pending ? ' (qolganlari server bo‘shaganda)' : '') + '.</p><button id="kkFx">👀 Ko‘rib chiqish (' + f.pending + ')</button></div>'
      : '<div class="hero ok"><b>✅ Hamma xatolar ko‘rib chiqilgan</b><p style="margin-bottom:0">Yangi xato topilsa shu yerda chiqadi. Ertalab 08:00 da Telegram’da hisobot keladi.</p></div>';
    return h + '<button class="auto" id="kkAu"><span style="flex:1">🤖 <b>Avto-tuzatish</b>' + (f.autoN ? ' <span class="pill">' + f.autoN + ' ta</span>' : '') + '<small>Aniq xatolar o‘zi o‘rgatiladi, sizga faqat shubhalilari qoladi</small></span><span class="sw' + (f.auto ? ' on' : '') + '"></span></button>';
  }
  // umumiy doska (strelkalar bilan): marks {i: 'fr'|'to'|'gf'|'gt'}, arrows [[from,to,color]]
  function bdHtml(b, flip, marks, arrows) {
    var BD = BDS[bdIdx()], h = '<div class="bdw"><div class="bd">';
    for (var v = 0; v < 64; v++) { var i = flip ? 63 - v : v, r = i >> 3, c = i & 7, p = b[i], dark = (r + c) % 2 === 1; h += '<div class="c ' + ((marks && marks[i]) || '') + '" data-i="' + i + '" style="background:' + (dark ? BD[2] : BD[1]) + '">' + (p ? pcHtml(p) : '') + (((v & 7) === 0) ? '<span class="cl n" style="color:' + (dark ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.55)') + '">' + (8 - r) + '</span>' : '') + (((v >> 3) === 7) ? '<span class="cl a" style="color:' + (dark ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.55)') + '">' + 'abcdefgh'[c] + '</span>' : '') + '</div>'; }
    h += '</div>';
    if (arrows && arrows.length) {
      var xy = function (i) { var v = flip ? 63 - i : i; return [(v & 7) + 0.5, (v >> 3) + 0.5]; };
      h += '<svg class="ar" viewBox="0 0 8 8"><defs><marker id="kkmr" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#e11d48"/></marker><marker id="kkmg" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3z" fill="#22c55e"/></marker></defs>';
      arrows.forEach(function (a) { var p = xy(a[0]), q = xy(a[1]), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, e = [q[0] - dx / L * 0.32, q[1] - dy / L * 0.32]; h += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + e[0] + '" y2="' + e[1] + '" stroke="' + (a[2] === 'g' ? '#22c55e' : '#e11d48') + '" stroke-width=".18" stroke-linecap="round" opacity=".92" marker-end="url(#' + (a[2] === 'g' ? 'kkmg' : 'kkmr') + ')"/>'; });
      h += '</svg>';
    }
    return h + '</div>';
  }
  function evs(v) { return v == null ? '—' : (v > 0 ? '+' : '') + (Math.round(v * 10) / 10).toFixed(1); }
  var SRCN = { oyin: '🎮 o‘yindan', tun: '🌙 tungi tahlil', sinov: '🤖 sinov o‘yini' };

  // ---------- ⚡ tuzatishlar (bittadan, bir bosishda)
  var F = { list: [], i: 0, msg: '', busy: false };
  function fixes() {
    var C = shell('⚡ Tuzatishlar', list); sbar(null);
    C.innerHTML = '<div class="msg">Yuklanmoqda…</div>';
    post('/api/kkadm/fixes', {}).then(function (r) { F.list = r.list || []; F.i = 0; F.msg = ''; F.step = 0; if (F.only == null) F.only = true; drawFix(); }).catch(function () { C.innerHTML = '<div class="msg">⚠️ Server bilan aloqa yo‘q</div>'; });
  }
  function lossTxt(x) { return x.loss >= 10 ? '❌ o‘yin yutqaziladi' : x.loss ? '−' + x.loss + ' dona' : x.drop ? 'baho −' + x.drop : ''; }
  function pathArrows(p, col) { var a = []; if (p) for (var i = 1; i < p.length; i++) a.push([p[i - 1], p[i], col]); return a; }
  function drawFix() {
    var C = O.querySelector('#kkC'), all = F.list, L = F.only ? all.filter(function (y) { return y.main; }) : all;
    if (F.only && !L.length && all.length) { F.only = false; L = all; }
    if (F.i >= L.length) F.i = Math.max(0, L.length - 1);
    var x = L[F.i], nMain = all.filter(function (y) { return y.main; }).length;
    O.querySelector('.top b').textContent = '⚡ Tuzatish ' + (L.length ? (F.i + 1) + ' / ' + L.length : '');
    if (!x) { sbar(null); C.innerHTML = '<div class="hero ok"><b>🎉 Hammasi ko‘rib chiqildi</b><p style="margin-bottom:0">' + (F.msg || 'Yangi xatolar paydo bo‘lganda shu yerda chiqadi.') + '</p></div>'; return; }
    var b = x.best, flip = x.s === -1, st = x.steps || [], si = F.step || 0, mk = {}, arr;
    if (si > 0 && st[si]) { var cs = st[si]; arr = pathArrows(cs.p, cs.s === x.s ? 'r' : 'g'); if (cs.p) { mk[cs.p[0]] = cs.s === x.s ? 'fr' : 'gf'; mk[cs.p[cs.p.length - 1]] = cs.s === x.s ? 'to' : 'gt'; } }
    else { arr = [[x.from, x.to, 'r']]; mk[x.from] = 'fr'; mk[x.to] = 'to'; if (b && !b.same) { arr.push([b.from, b.to, 'g']); mk[b.from] = 'gf'; mk[b.to] = 'gt'; } }
    var h = '<div class="tabs" style="margin:0 0 6px"><button data-only="1"' + (F.only ? ' class="on"' : '') + '>⭐ Asosiy (' + nMain + ')</button><button data-only="0"' + (!F.only ? ' class="on"' : '') + '>Hammasi (' + all.length + ')</button></div>';
    h += '<div class="box" style="padding:10px"><div class="h">' + (x.main ? '<span class="pill" style="background:#7c2d12;color:#fde68a;margin:0 4px 0 0">⭐ ASOSIY XATO</span>' : '<span class="pill" style="margin:0 4px 0 0">keyingi xato · o‘yin allaqachon og‘ir</span>') + 'KING KONG (' + (x.s === 1 ? 'OQ' : 'QORA') + ') · ' + (SRCN[x.src] || '') + (x.hits > 1 ? ' · 🔁 ' + x.hits + ' marta' + (x.opps > 1 ? ', ' + x.opps + ' o‘yinchi' : '') : '') + '</div>';
    h += bdHtml(si > 0 && st[si] ? st[si].b : x.b, flip, mk, arr);
    if (st.length > 2) h += '<div class="nav" style="margin:6px 0 0"><button data-st="-1">◀</button><button data-st="0" style="flex:3;font-size:13px">' + (si === 0 ? '🔎 Raddiyani ko‘rish (' + (st.length - 1) + ' yurish)' : si + ' / ' + (st.length - 1) + ' · ' + esc(st[si].t || 'yakuniy holat') + (st[si].s === x.s ? ' (King Kong)' : ' (raqib)')) + '</button><button data-st="1">▶</button></div>';
    if (si === 0) {
      h += '<div class="cmp"><div class="bad">O‘ynadi<b>' + esc(x.t) + ' ??</b>' + lossTxt(x) + (x.playedEv != null ? ' · ' + evs(x.playedEv) : '') + '</div>';
      h += b ? '<div class="good">' + (b.same ? 'Dvigatel ham' : 'To‘g‘risi') + '<b>' + esc(b.t) + '</b>' + evs(b.ev) + ' · 15 s' + (b.safe ? '' : ' ⚠️') + '</div>' : '<div class="good" style="opacity:.75">To‘g‘risi<b>⏳</b>server bo‘shaganda</div>';
      h += '</div>';
      if (x.line && x.line.length) h += '<div style="font-size:12.5px;opacity:.85;margin-top:8px">Nima uchun: <b>' + esc(x.line.join(' ')) + '</b> — ▶ bilan doskada ko‘ring</div>';
    }
    if (b && b.same && si === 0) h += '<div style="font-size:12.5px;color:#fde68a;margin-top:6px">⚠️ Dvigatel ham shu yurishni tanladi — ehtimol qurbon ataylab. O‘tkazib yuborish tavsiya etiladi.</div>';
    h += '</div>';
    if (x.ctx && x.ctx.length) h += '<div class="box" style="padding:8px 10px"><div class="h">O‘YINDA</div><div class="mv" style="margin:0">' + x.ctx.map(function (c) { return '<span data-cx="' + c.j + '"' + (c.me ? ' class="x cur"' : '') + '>' + (c.s === 1 ? c.n + '. ' : c.n + '… ') + esc(c.t) + '</span>'; }).join('') + '</div></div>';
    h += (F.msg ? '<div class="msg">' + F.msg + '</div>' : '');
    if (b && !b.same && si === 0) h += '<div class="box" style="background:#0f3d22;border:1px solid #16a34a;color:#bbf7d0;font-size:12.5px">✅ Tasdiqlansa — King Kong bu pozitsiyada endi doim <b>' + esc(b.t) + '</b> o‘ynaydi</div>';
    C.innerHTML = h;
    [].forEach.call(C.querySelectorAll('[data-only]'), function (el) { el.onclick = function () { F.only = el.getAttribute('data-only') === '1'; F.i = 0; F.step = 0; drawFix(); }; });
    [].forEach.call(C.querySelectorAll('[data-st]'), function (el) { el.onclick = function () { var d = +el.getAttribute('data-st'); F.step = d === 0 ? (si === 0 ? 1 : 0) : Math.max(0, Math.min(st.length - 1, si + d)); drawFix(); }; });
    [].forEach.call(C.querySelectorAll('[data-cx]'), function (el) { el.onclick = function () { if (x.gid && !/^spar_/.test(x.gid)) game(x.gid, +el.getAttribute('data-cx')); }; });
    var bar = sbar('<button data-f="skip">✖ O‘tkazish</button><button class="o" data-f="own">♟ Boshqa</button><button class="y" data-f="ok"' + (b && !b.same && !F.busy ? '' : ' disabled') + '>✅ O‘rgat</button>');
    [].forEach.call(bar.querySelectorAll('[data-f]'), function (el) {
      el.onclick = function () {
        var a = el.getAttribute('data-f');
        if (a === 'own') { V.g = null; ownPick(x); return; }
        F.busy = true; drawFix();
        post('/api/kkadm/fix', { id: x.id, act: a }).then(function (r) {
          F.busy = false; F.step = 0; if (r.error) { F.msg = '⚠️ ' + esc(r.error); return drawFix(); }
          if (a === 'ok') { F.msg = '✅ O‘rgatildi: ' + esc(b.t); try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {} } else F.msg = '';
          F.list.splice(F.list.indexOf(x), 1); drawFix();
        }).catch(function () { F.busy = false; F.msg = '⚠️ Server bilan aloqa yo‘q'; drawFix(); });
      };
    });
  }
  // ♟ o'zim tanlayman: xavfsiz yurishlar ro'yxati
  function ownPick(x) {
    var C = O.querySelector('#kkC'); sbar('<button data-b="1">‹ Orqaga</button>'); O.querySelector('.sb [data-b]').onclick = drawFix;
    C.innerHTML = '<div class="msg">⏳</div>';
    post('/api/kkadm/safe', { board: x.b, side: x.s }).then(function (r) {
      var L = r.list || [], best = L.length ? L[0].v : 0;
      C.innerHTML = bdHtml(x.b, x.s === -1, (function () { var m = {}; m[x.from] = 'fr'; m[x.to] = 'to'; return m; })(), [[x.from, x.to, 'r']]) + '<div class="box"><div class="h">QAYSI YURISHNI O‘RGATAY?</div><div class="ch">' + L.map(function (m, k) { return '<button data-m="' + k + '"' + (m.v < best ? ' class="bad"' : '') + '>' + (m.v < best ? '⚠️ ' : '✅ ') + esc(m.t) + (m.v < best ? ' <small style="opacity:.8">(' + (best - m.v >= 10 ? 'yutqazadi' : '−' + (best - m.v) + ' dona') + ')</small>' : '') + '</button>'; }).join('') + '</div></div>';
      [].forEach.call(C.querySelectorAll('[data-m]'), function (el) {
        el.onclick = function () { var m = L[+el.getAttribute('data-m')]; post('/api/kkadm/fix', { id: x.id, act: 'ok', from: m.from, to: m.to }).then(function (r) { F.msg = r.error ? '⚠️ ' + esc(r.error) : '✅ O‘rgatildi: ' + esc(m.t); if (!r.error) { F.list.splice(F.list.indexOf(x), 1); F.step = 0; } drawFix(); }); };
      });
    });
  }
  // ---------- 📚 o'rgatilganlar (natijasi bilan)
  function taught() {
    var C = shell('📚 O‘rgatilgan yurishlar', list); sbar(null); C.innerHTML = '<div class="msg">Yuklanmoqda…</div>';
    get('/api/kkbook').then(function (r) {
      var L = r.list || [];
      C.innerHTML = '<div style="opacity:.75;font-size:12.5px;margin:0 2px 6px">Jami ' + (r.total || L.length) + ' ta. Natija — shu yurish o‘ynalgan o‘yinlarda King Kong qanday tugatgani.</div>' + (L.length ? L.map(function (x) {
        var n = x.w + x.l + x.d, res = n ? '✅ ' + x.w + ' · ❌ ' + x.l + ' · 🤝 ' + x.d : 'hali o‘ynalmagan';
        return '<div class="row" data-tk="' + esc(x.k) + '"><span class="f"><b>' + esc(x.n) + '</b>' + (x.auto ? ' <span class="pill">🤖 avto</span>' : '') + (x.l > x.w && n >= 3 ? ' <span class="pill" style="background:#7c2d12">⚠️ foyda yo‘q</span>' : '') + '<small>' + when(x.at) + ' · ' + x.used + ' marta · ' + res + '</small></span><button data-k="' + esc(x.k) + '">↩ Bekor</button></div>';
      }).join('') : '<div class="msg" style="opacity:.7">Hali o‘rgatilmagan</div>');
      [].forEach.call(C.querySelectorAll('[data-k]'), function (el) { el.onclick = function (e) { e.stopPropagation(); if (!confirm('Bu o‘rgatish bekor qilinsinmi?')) return; post('/api/kkbook/del', { k: el.getAttribute('data-k') }).then(function () { el.closest('.row').remove(); }); }; });
      [].forEach.call(C.querySelectorAll('[data-tk]'), function (el) { el.onclick = function () { var k = el.getAttribute('data-tk'), x = L.filter(function (y) { return y.k === k; })[0]; if (x) taughtOne(x); }; });
    });
  }
  // ---------- 📈 aniqlik grafigi
  function accView() {
    var C = shell('📈 Aniqlik grafigi', list); sbar(null);
    var D = (V.list && V.list.fx && V.list.fx.days) || [], P = D.filter(function (x) { return x.acc != null; });
    if (!D.length) { C.innerHTML = '<div class="msg" style="opacity:.7">Hali ma’lumot yo‘q — o‘yinlar tahlil qilingan sari to‘planadi</div>'; return; }
    var W = 340, H = 140, mn = Math.min.apply(null, P.map(function (x) { return x.acc; }).concat([90])), sx = function (i) { return 10 + i * (W - 20) / Math.max(1, D.length - 1); }, sy = function (v) { return H - 18 - (v - mn) / (100 - mn || 1) * (H - 34); };
    var pts = D.map(function (x, i) { return x.acc == null ? null : sx(i).toFixed(1) + ',' + sy(x.acc).toFixed(1); }).filter(Boolean);
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%"><rect width="' + W + '" height="' + H + '" rx="12" fill="#1d1858"/>' + [mn, (mn + 100) / 2, 100].map(function (v) { return '<line x1="8" x2="' + (W - 8) + '" y1="' + sy(v) + '" y2="' + sy(v) + '" stroke="#3a3480" stroke-dasharray="3 4"/><text x="' + (W - 10) + '" y="' + (sy(v) - 3) + '" fill="#a9a4d8" font-size="10" text-anchor="end">' + Math.round(v) + '%</text>'; }).join('') +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#fbbf24" stroke-width="2.4" stroke-linejoin="round"/>' + D.map(function (x, i) { return x.acc == null ? '' : '<circle cx="' + sx(i) + '" cy="' + sy(x.acc) + '" r="3" fill="#fbbf24"/>'; }).join('') +
      '<text x="10" y="' + (H - 4) + '" fill="#a9a4d8" font-size="10">' + D[0].d + '</text><text x="' + (W - 10) + '" y="' + (H - 4) + '" fill="#a9a4d8" font-size="10" text-anchor="end">' + D[D.length - 1].d + '</text></svg>';
    C.innerHTML = svg + '<div style="font-size:12.5px;opacity:.75;margin:6px 2px">Aniqlik = King Kong yurishlarining qancha qismi dona yo‘qotmagan (tahlil qilingan o‘yinlarda).</div>' + D.slice().reverse().map(function (x) { return '<div class="row"><span class="f"><b>' + x.d + '</b><small>' + x.n + ' o‘yin: ✅ ' + x.w + ' · ❌ ' + x.l + ' · 🤝 ' + x.dr + '</small></span><b style="color:#fbbf24">' + (x.acc == null ? '—' : x.acc + '%') + '</b></div>'; }).join('');
  }
  // ---------- 📖 debyutlar
  function opsView() {
    var C = shell('📖 Debyutlar', list); sbar(null);
    var L = (V.list && V.list.fx && V.list.fx.ops) || [];
    C.innerHTML = '<div style="font-size:12.5px;opacity:.75;margin:0 2px 6px">Birinchi 3 yurish bo‘yicha (kamida 2 o‘yin). Eng ko‘p yutqazilganlari tepada.</div>' + (L.length ? L.map(function (x) { var p = Math.round(x.l * 100 / x.n); return '<div class="row"><span class="f" style="font-family:ui-monospace,monospace;font-size:12.5px">' + esc(x.k) + '<small style="font-family:system-ui">' + x.n + ' o‘yin: ✅ ' + x.w + ' · ❌ ' + x.l + ' · 🤝 ' + x.d + '</small></span><b style="color:' + (p >= 50 ? '#fca5a5' : p >= 25 ? '#fdba74' : '#86efac') + '">' + p + '%</b></div>'; }).join('') : '<div class="msg" style="opacity:.7">Hali yetarli o‘yin yo‘q</div>');
  }
  // ---------- 🤖 sinov o'yinlari
  function sparView() {
    var C = shell('🤖 Tungi sinov o‘yinlari', list); sbar(null);
    var L = (V.list && V.list.fx && V.list.fx.spar) || [];
    var fx = (V.list && V.list.fx) || {}, J = fx.job, T = fx.test;
    C.innerHTML = (J ? '<div class="hero ok" style="padding:10px"><b style="font-size:15px">🧪 Sinov ketyapti: ' + J.done + ' / ' + J.n + '</b><p style="margin:2px 0 0">✅ ' + J.w + ' · ❌ ' + J.l + ' · 🤝 ' + J.d + '</p></div>' : T ? '<div class="box">🧪 Oxirgi sinov (' + when(T.at) + '): ' + T.n + ' o‘yin — ✅ ' + T.w + ' · ❌ ' + T.l + ' · 🤝 ' + T.d + '</div>' : '') + '<div style="font-size:12.5px;opacity:.75;margin:0 2px 6px">Har kecha 01:00–07:00 da server bo‘sh bo‘lsa King Kong dvigatelga qarshi 4 tagacha o‘yin o‘ynaydi (tasodifiy debyut). Topilgan xatolar «⚡ Tuzatishlar»ga tushadi.</div>' + (L.length ? L.map(function (x) { return '<div class="row"><span style="font-size:20px">' + (x.res === 'w' ? '✅' : x.res === 'l' ? '❌' : '🤝') + '</span><span class="f">King Kong ' + (x.kk === 1 ? 'oq' : 'qora') + '<small>' + when(x.at) + ' · ' + Math.ceil(x.plies / 2) + ' yurish' + (x.tag ? ' · ' + esc(x.tag) : '') + '</small></span>' + (x.errs ? '<span class="tg">⚠️ ' + x.errs + '</span>' : '<span class="tg ok">✓</span>') + '</div>'; }).join('') : '<div class="msg" style="opacity:.7">Hali sinov o‘yini bo‘lmagan</div>');
  }
  function shell(title, back) { O.innerHTML = '<div class="in"><div class="top"><button class="bk" id="kkB">‹</button><b>' + title + '</b></div><div id="kkC"></div></div>'; O.querySelector('#kkB').onclick = back; return O.querySelector('#kkC'); }
  function when(t) { var d = new Date(t), n = new Date(), hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); return (d.toDateString() === n.toDateString() ? 'bugun ' : d.toDateString() === new Date(Date.now() - 864e5).toDateString() ? 'kecha ' : d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + ' ') + hm; }

  // ---------- 1) ro'yxat
  function list() {
    V.g = null; if (O) sbar(null);
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
    C.innerHTML = heroHtml(d) + '<div class="st"><div><b>' + t.n + '</b><small>bugun</small></div><div><b style="color:#86efac">' + t.w + '</b><small>yutdi</small></div><div><b style="color:#fca5a5">' + t.l + '</b><small>yutqazdi</small></div><div><b style="color:#fdba74">' + t.e + '</b><small>⚠️ xato</small></div></div>' +
      (d.guard && d.guard.n ? '<div style="font-size:12.5px;opacity:.75;margin:-2px 2px 6px">🛡 Qo‘riqchi: ' + d.guard.n + ' tekshiruv, ' + d.guard.swap + ' marta yurishni almashtirdi (o‘rtacha ' + Math.round(d.guard.ms / d.guard.n) + ' ms)</div>' : '') +
      '<div class="tabs"><button data-t="l"' + (V.tab === 'l' ? ' class="on"' : '') + '>❌ Yutqazgan</button><button data-t="e"' + (V.tab === 'e' ? ' class="on"' : '') + '>⚠️ Xatoli</button><button data-t="a"' + (V.tab === 'a' ? ' class="on"' : '') + '>Hammasi</button></div>' +
      (L.length ? L.map(function (g) {
        var tag = g.errs == null ? '<span class="tg q">⏳ tekshirilmagan</span>' : g.errs && g.fixed >= g.errs ? '<span class="tg ok">✅ tuzatilgan</span>' : g.errs ? '<span class="tg">⚠️ ' + (g.errs - g.fixed) + '</span>' : '<span class="tg ok">✓ toza</span>';
        return '<button class="gm" data-id="' + esc(g.id) + '"><span class="r">' + (g.res === 'w' ? '✅' : g.res === 'l' ? '❌' : '🤝') + '</span><span class="n">' + esc(g.opp) + '<small>' + when(g.at) + ' · ' + esc(g.tc || '∞') + ' · ' + g.n + ' yurish' + (g.guard ? ' · 🛡 ' + g.guard : '') + '</small></span>' + tag + '</button>';
      }).join('') : '<div class="msg" style="opacity:.7">Bu yerda hozircha o‘yin yo‘q</div>');
    C.insertAdjacentHTML('beforeend', '<div class="sec">BOSHQA</div>' +
      '<button class="gm" data-x="taught"><span class="r">📚</span><span class="n">O‘rgatilgan yurishlar<small>natijasi bilan · bekor qilish mumkin</small></span>›</button>' +
      '<button class="gm" data-x="acc"><span class="r">📈</span><span class="n">Aniqlik grafigi<small>kunlik aniqlik va natijalar (30 kun)</small></span>›</button>' +
      '<button class="gm" data-x="ops"><span class="r">📖</span><span class="n">Debyutlar<small>King Kong qaysi debyutda ko‘p yutqazadi</small></span>›</button>' +
      '<button class="gm" data-x="rep"><span class="r">📖</span><span class="n">Repertuar<small>har yurishga foiz: King Kong qaysi yurishni qanchalik tez-tez o‘ynaydi</small></span>›</button>' +
      '<button class="gm" data-x="tree"><span class="r">🌳</span><span class="n">Debyut daraxti va sozlamalar<small>tarmoqlar natijasi, import, chuqurlik</small></span>›</button>' +
      '<button class="gm" data-x="pos"><span class="r">♟</span><span class="n">Pozitsiya terish<small>istalgan pozitsiyada King Kong nima o‘ynaydi</small></span>›</button>' +
      '<button class="gm" data-x="trap"><span class="r">🪤</span><span class="n">Tuzoqlar<small>raqiblar ko‘p xato qiladigan pozitsiyalar</small></span>›</button>' +
      '<button class="gm" data-x="pdn"><span class="r">📥</span><span class="n">PDN import<small>ustalar partiyalari → repertuar</small></span>›</button>' +
      '<button class="gm" data-x="hist"><span class="r">🕓</span><span class="n">O‘zgarishlar tarixi<small>orqaga qaytarish</small></span>›</button>' +
      '<button class="gm" data-x="spar"><span class="r">🤖</span><span class="n">Tungi sinov o‘yinlari<small>King Kong ↔ dvigatel, xatolar tuzatishlarga tushadi</small></span>›</button>');
    [].forEach.call(C.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { V.tab = b.getAttribute('data-t'); drawList(); }; });
    [].forEach.call(C.querySelectorAll('[data-id]'), function (b) { b.onclick = function () { game(b.getAttribute('data-id')); }; });
    [].forEach.call(C.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { var x = b.getAttribute('data-x'); if (x === 'taught') taught(); else if (x === 'acc') accView(); else if (x === 'ops') opsView(); else if (x === 'rep') repOpen(null, null, 'all'); else if (x === 'tree') treeView(); else if (x === 'pos') posEdit(); else if (x === 'trap') trapView(); else if (x === 'pdn') pdnView(); else if (x === 'hist') histView(); else sparView(); }; });
    var hf = C.querySelector('#kkFx'); if (hf) hf.onclick = fixes;
    var au = C.querySelector('#kkAu'); if (au) au.onclick = function () { var v = !(d.fx && d.fx.auto); if (v && !confirm('Avto-tuzatish yoqilsinmi?\n\nAniq xatolar (dona yo‘qotish, dvigatel 15 s tasdiqlagan, qo‘riqchi xavfsiz degan) sizsiz o‘rgatiladi. Hammasi «O‘rgatilgan yurishlar»da ko‘rinadi va bekor qilinadi.')) return; post('/api/kkadm/auto', { v: v }).then(function (r) { if (d.fx) d.fx.auto = !!r.auto; drawList(); }); };
  }

  // ---------- 2) o'yin
  function game(id, at) {
    var C = shell('🦍 …', list);
    C.innerHTML = '<div class="msg">⏳ King Kong yurishlari tekshirilmoqda…</div>';
    post('/api/kkadm/game', { id: id }).then(function (g) {
      if (g.error) { C.innerHTML = '<div class="msg">⚠️ ' + esc(g.error) + '</div>'; return; }
      V.g = g; V.pick = null; V.sel = -1; V.safe = null; V.msg = '';
      var e = g.moves.findIndex(function (x) { return x.kk && x.err && !x.taught; });
      V.cur = at != null && g.moves[at] ? at : e >= 0 ? e : Math.max(0, g.moves.length - 1);
      O.querySelector('.top b').textContent = (g.res === 'w' ? '✅ ' : g.res === 'l' ? '❌ ' : '🤝 ') + 'King Kong — ' + g.opp;
      drawGame();
    }).catch(function () { C.innerHTML = '<div class="msg">⚠️ Server bilan aloqa yo‘q</div>'; });
  }
  function num(k) { var g = V.g, first = g.moves[0] ? g.moves[0].s : 1, n = Math.floor((k + (first === -1 ? 1 : 0)) / 2) + 1; return n + (g.moves[k].s === 1 ? '. ' : '... '); }
  function srcTxt(x) { return x.g ? '🛡 qo‘riqchi (' + x.g.t + ' o‘rniga)' : ({ 'dvigatel': '⚙️ dvigatel', 'Colette': '📚 Nazariya', 'kitob': '📖 kitob', 'admin': '🦍 o‘rgatilgan', 'baza': '♟ baza', 'etyud': '🧩 etyud', 'xotira': '💾 xotira' })[x.src] || '⚙️ dvigatel'; }
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
      h += '<div class="c ' + (hl[i] || '') + '" data-i="' + i + '" style="background:' + (dark ? BD[2] : BD[1]) + '">' + (p ? pcHtml(p) : '') + (tgt[i] ? '<i class="dot"></i>' : '') + (((v & 7) === 0) ? '<span class="cl n" style="color:' + (dark ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.55)') + '">' + (8 - r) + '</span>' : '') + (((v >> 3) === 7) ? '<span class="cl a" style="color:' + (dark ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.55)') + '">' + 'abcdefgh'[c] + '</span>' : '') + '</div>';
    }
    h += '</div><div class="mv">' + g.moves.map(function (m, k) { return '<span data-k="' + k + '" class="' + (m.kk ? 'k' : '') + (m.kk && m.err && !m.taught ? ' x' : '') + (m.taught ? ' t' : '') + (k === V.cur ? ' cur' : '') + '">' + (m.s === 1 || k === 0 ? num(k) : '') + m.t + (m.kk && m.err && !m.taught ? ' ⚠️' : '') + (m.g ? ' 🛡' : '') + '</span>'; }).join('') + '</div>';
    h += '<div class="nav"><button data-n="0">⏮</button><button data-n="-1">◀</button><button class="er" data-n="e">⚠️ Keyingi xato</button><button data-n="1">▶</button></div>';
    // ma'lumot qutisi
    var who = x.kk ? 'KING KONG (' + (x.s === 1 ? 'OQ' : 'QORA') + ') O‘YNADI' : 'RAQIB O‘YNADI';
    h += '<div class="box"><div class="h">' + num(V.cur).replace('... ', '').replace('. ', '') + '-YURISH · ' + who + '</div>';
    h += '<b style="color:' + (x.err && !x.taught ? '#fca5a5' : '#fff') + '">' + x.t + '</b>' + (x.kk ? ' — ' + srcTxt(x) : '');
    if (x.kk && x.err) h += '<br>⚠️ <b>' + (x.err.loss >= 10 ? 'o‘yinni yutqazadi' : x.err.loss + ' dona yo‘qotadi') + '</b>' + (x.err.line && x.err.line.length ? ': ' + x.err.line.join(' ') : '');
    if (x.taught) h += '<br>✅ O‘rgatilgan: endi bu yerda <b>' + SQ(x.taught.from) + '-' + SQ(x.taught.to) + '</b> o‘ynaydi';
    if (x.kk) {
      var opts = x.err ? x.err.safe : null;
      if (opts && opts.length) h += '<div class="ch">' + opts.map(function (m, k) { return '<button data-a="' + k + '"' + (alt && alt.from === m.from && alt.to === m.to ? ' class="on"' : '') + '>✅ ' + m.t + '</button>'; }).join('') + '<button data-pick="1"' + (V.sel >= 0 || (alt && alt.own) ? ' class="on"' : '') + '>♟ Doskadan tanlash</button></div>';
      else h += '<div class="ch"><button data-pick="1"' + (V.sel >= 0 || (alt && alt.own) ? ' class="on"' : '') + '>♟ Boshqa yurish tanlash</button></div>';
      if (V.sel >= 0) h += '<div style="margin-top:6px;opacity:.8;font-size:12.5px">Yashil nuqtali katakni bosing (⚠️ — dona yo‘qotadigan yurish)</div>';

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
    var bar = sbar('<button class="o" id="kkAn">🔬 To‘liq tahlil</button>' + (alt ? '<button class="y" id="kkT"' + (V.busy ? ' disabled' : '') + '>✅ ' + esc(alt.t.replace(' ⚠️', '')) + ' ni o‘rgat</button>' : ''));
    var tb = bar.querySelector('#kkT'); if (tb) tb.onclick = teach;
    bar.querySelector('#kkAn').onclick = openAna;
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
  // ---------- 📚 bitta o'rgatilgan yurish: pozitsiya, qaysi o'yindan, natija
  function taughtOne(x) {
    var C = shell('📚 ' + esc(x.n), taught), b = String(x.b).split(',').map(Number), s = +x.s, mk = {}, arr = [[x.f, x.t, 'g']];
    mk[x.f] = 'gf'; mk[x.t] = 'gt';
    var n = x.w + x.l + x.d, g = x.gid;
    var h = bdHtml(b, s === -1, mk, arr) + '<div class="box"><div class="h">QAYERDAN</div>' + (g ? (SRCN[g.src] || '') + (g.was ? ' · <b style="color:#fca5a5">' + esc(g.was) + ' ??</b> o‘rniga ' : ' · ') + '<b style="color:#86efac">' + esc(x.n) + '</b> o‘rgatildi' : 'Qo‘lda o‘rgatilgan') + (x.auto ? ' <span class="pill">🤖 avto</span>' : '') + '<br><small style="opacity:.7">' + when(x.at) + '</small></div>';
    h += '<div class="st"><div><b>' + x.used + '</b><small>o‘ynaldi</small></div><div><b style="color:#86efac">' + x.w + '</b><small>yutdi</small></div><div><b style="color:#fca5a5">' + x.l + '</b><small>yutqazdi</small></div><div><b>' + x.d + '</b><small>durang</small></div></div>';
    if (n >= 3 && x.l > x.w) h += '<div class="msg" style="color:#fdba74">⚠️ Bu yurish foyda bermayapti — boshqasini o‘rgatish yoki bekor qilish tavsiya etiladi</div>';
    C.innerHTML = h;
    var bar = sbar((g && g.gid && !/^spar_/.test(g.gid) ? '<button class="o" id="tP">🔬 Partiya</button>' : '') + '<button id="tO">✏️ Boshqa</button><button id="tR" style="background:#7f1d1d">↩ Bekor</button>');
    var tp = bar.querySelector('#tP'); if (tp) tp.onclick = function () { game(g.gid); };
    bar.querySelector('#tR').onclick = function () { if (!confirm('Bekor qilinsinmi?')) return; post('/api/kkbook/del', { k: x.k }).then(taught); };
    bar.querySelector('#tO').onclick = function () {
      C.innerHTML = '<div class="msg">⏳</div>'; sbar('<button id="tB">‹ Orqaga</button>').querySelector('#tB').onclick = function () { taughtOne(x); };
      post('/api/kkadm/safe', { board: b, side: s }).then(function (r) {
        var L = r.list || [], best = L.length ? L[0].v : 0;
        C.innerHTML = bdHtml(b, s === -1, mk, arr) + '<div class="box"><div class="h">QAYSI YURISHNI O‘RGATAY?</div><div class="ch">' + L.map(function (m, k) { return '<button data-m="' + k + '"' + (m.v < best ? ' class="bad"' : '') + '>' + (m.v < best ? '⚠️ ' : '✅ ') + esc(m.t) + (m.v < best ? ' <small style="opacity:.8">(' + (best - m.v >= 10 ? 'yutqazadi' : '−' + (best - m.v) + ' dona') + ')</small>' : '') + '</button>'; }).join('') + '</div></div>';
        [].forEach.call(C.querySelectorAll('[data-m]'), function (el) { el.onclick = function () { var m = L[+el.getAttribute('data-m')]; post('/api/kkbook/add', { board: b, side: s, from: m.from, to: m.to }).then(function () { taught(); }); }; });
      });
    };
  }
  // ---------- 📖 repertuar
  var RP = { sc: 'all', path: [], b: null, s: 1, v: null, edit: {}, dirty: false, safe: null };
  function initB() { var b = []; for (var i = 0; i < 64; i++) { var r = i >> 3, c = i & 7; b.push((r + c) % 2 ? (r < 3 ? -1 : r > 4 ? 1 : 0) : 0); } return b; }
  function repOpen(b, s, sc) { RP.sc = sc || RP.sc || 'all'; RP.path = b ? [{ b: b, s: s, t: '♟ pozitsiya' }] : []; RP.b = b || initB(); RP.s = s || 1; repLoad(); }
  function repLoad() {
    var C = shell('📖 Repertuar', list); C.innerHTML = '<div class="msg">Yuklanmoqda…</div>'; RP.safe = null;
    post('/api/kkrep/view', { sc: RP.sc, board: RP.b, side: RP.s }).then(function (v) { RP.v = v; RP.edit = {}; v.list.forEach(function (m) { RP.edit[m.id] = { w: m.w, note: m.note, mk: m.mk, lock: m.lock || !m.w ? true : m.lock }; }); RP.dirty = false; repDraw(); });
  }
  function repSum() { var t = 0; for (var k in RP.edit) t += RP.edit[k].w || 0; return t; }
  function repDraw() {
    var C = O.querySelector('#kkC'), v = RP.v; if (!v) return;
    O.querySelector('.top b').textContent = '📖 Repertuar · ' + (RP.s === 1 ? 'oq' : 'qora') + ' yuradi';
    var h = '<div class="tabs" style="flex-wrap:wrap">' + v.scopes.map(function (x) { return '<button data-sc="' + esc(x.id) + '"' + (x.id === RP.sc ? ' class="on"' : '') + ' style="flex:none;padding:7px 9px">' + esc(x.name) + ' <small style="opacity:.7">' + x.n + '</small></button>'; }).join('') + '<button data-sc="+" style="flex:none;padding:7px 9px">＋</button></div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;font:12.5px ui-monospace,monospace"><button data-cr="-1" class="pill" style="font-size:12px">⌂ boshlanish</button>' + RP.path.map(function (p, i) { return '<button data-cr="' + i + '" class="pill" style="font-size:12px;background:#1d1858">' + esc(p.t) + '</button>'; }).join('') + '</div>';
    var sum = repSum(), arr = [], mk = {};
    v.list.forEach(function (m) { var e = RP.edit[m.id]; if (e.w > 0) { arr.push([m.from, m.to, 'g']); mk[m.from] = 'gf'; } });
    h += bdHtml(RP.b, false, mk, arr);
    if (v.taught) h += '<div class="msg" style="color:#fde68a;font-size:12.5px">📚 Bu pozitsiyada o‘rgatilgan yurish bor — u repertuardan ustun</div>';
    h += v.list.map(function (m) {
      var e = RP.edit[m.id], pct = sum ? Math.round(e.w * 100 / sum) : 0, z = m.st, sf = RP.safe && RP.safe[m.id];
      return '<div class="row" style="flex-wrap:wrap;gap:6px"><button data-go="' + m.id + '" style="background:none;padding:0;font:800 15px ui-monospace,monospace;min-width:64px;text-align:left;color:' + (e.w ? '#86efac' : '#c7c2ff') + '">' + esc(m.t) + (e.mk ? ' ' + esc(e.mk) : '') + '</button>' +
        '<input type="range" min="0" max="100" step="5" value="' + e.w + '" data-w="' + m.id + '" style="flex:1;min-width:110px;accent-color:#22c55e">' +
        '<b style="width:42px;text-align:right">' + e.w + '<small style="display:block;font-size:10.5px;opacity:.7;font-weight:400">' + (e.w ? pct + '%' : '') + '</small></b>' +
        '<button data-n="' + m.id + '" style="padding:5px 7px">✏️</button>' +
        '<div style="flex-basis:100%;font-size:11.5px;opacity:.75;margin-top:-2px">' + (z ? '✅ ' + z.w + ' · ❌ ' + z.l + ' · 🤝 ' + z.d : 'natija yo‘q') + (m.trap ? ' · 🪤 raqiblar ' + m.trap.err + '/' + m.trap.n + ' xato qilgan' : '') + (m.allW != null ? ' · umumiyda ' + m.allW : '') + (sf != null ? ' · ' + (sf < 0 ? '⚠️ ' + sf + ' dona' : '🛡 xavfsiz') : '') + (e.lock && e.w ? ' · 🔒' : '') + (m.src && m.src !== 'admin' ? ' · ' + ({ colette: '📚 Nazariya', kitob: '📖 kitob', pdn: '📥 PDN' }[m.src] || m.src) : '') + (e.note ? '<br>📝 ' + esc(e.note) : '') + '</div></div>';
    }).join('');
    h += '<div style="font-size:11.5px;opacity:.7;margin:6px 2px">Yurish nomini bossangiz — keyingi pozitsiyaga o‘tasiz. 0 — o‘ynamaydi. Qo‘lda qo‘yilgan foizlar 🔒 qulflanadi (o‘z-o‘zidan moslashmaydi).</div>';
    C.innerHTML = h;
    var bar = sbar('<button id="rT">Sinab ko‘r</button><button class="o" id="rX">🧪 Sinash</button><button class="y" id="rS"' + (RP.dirty ? '' : ' disabled') + '>💾 Saqlash</button>');
    [].forEach.call(C.querySelectorAll('[data-sc]'), function (el) { el.onclick = function () { var id = el.getAttribute('data-sc'); if (id === '+') { var nm = prompt('Raqib nomi (bot yoki o‘yinchi ismi):'); if (!nm) return; id = 'opp:' + nm.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 40); post('/api/kkrep/scope', { id: id }).then(function () { RP.sc = id; repLoad(); }); return; } if (RP.dirty && !confirm('Saqlanmagan o‘zgarishlar yo‘qoladi. Davom etaymi?')) return; RP.sc = id; repLoad(); }; });
    [].forEach.call(C.querySelectorAll('[data-cr]'), function (el) { el.onclick = function () { var i = +el.getAttribute('data-cr'); if (i < 0) { RP.path = []; RP.b = initB(); RP.s = 1; } else { var p = RP.path[i]; RP.path = RP.path.slice(0, i + 1); RP.b = p.after || p.b; RP.s = p.after ? -p.s : p.s; } repLoad(); }; });
    [].forEach.call(C.querySelectorAll('[data-go]'), function (el) { el.onclick = function () { var m = v.list.filter(function (y) { return y.id === el.getAttribute('data-go'); })[0]; if (RP.dirty && !confirm('Saqlanmagan o‘zgarishlar yo‘qoladi. Davom etaymi?')) return; RP.path.push({ b: RP.b, s: RP.s, t: m.t, after: m.after }); RP.b = m.after; RP.s = -RP.s; repLoad(); }; });
    [].forEach.call(C.querySelectorAll('[data-w]'), function (el) { el.oninput = function () { var e = RP.edit[el.getAttribute('data-w')]; e.w = +el.value; e.lock = true; RP.dirty = true; var b = el.nextElementSibling; b.firstChild.nodeValue = e.w; var sm = repSum(); [].forEach.call(C.querySelectorAll('[data-w]'), function (q) { var ee = RP.edit[q.getAttribute('data-w')]; q.nextElementSibling.querySelector('small').textContent = ee.w ? Math.round(ee.w * 100 / (sm || 1)) + '%' : ''; }); O.querySelector('#rS').disabled = false; }; el.onchange = repDraw; });
    [].forEach.call(C.querySelectorAll('[data-n]'), function (el) { el.onclick = function () { var e = RP.edit[el.getAttribute('data-n')]; var mk = prompt('Belgi: !!  !  !?  ?!  ?  ??  (bo‘sh — yo‘q)', e.mk || ''); if (mk === null) return; var nt = prompt('Izoh (nima uchun):', e.note || ''); if (nt === null) return; e.mk = mk.trim(); e.note = nt.trim(); RP.dirty = true; repDraw(); }; });
    bar.querySelector('#rS').onclick = function () { post('/api/kkrep/set', { sc: RP.sc, board: RP.b, side: RP.s, moves: RP.edit }).then(function (r) { if (r.error) return alert(r.error); try { Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {} repLoad(); }); };
    bar.querySelector('#rT').onclick = function () {
      var L = v.list.filter(function (m) { return RP.edit[m.id].w > 0; }); if (!L.length) return alert('Foiz qo‘yilgan yurish yo‘q — King Kong bu yerda o‘zi o‘ylaydi (nazariya, kitob, dvigatel).');
      var cnt = {}, sm = repSum(); for (var i = 0; i < 20; i++) { var x = Math.random() * sm; for (var j = 0; j < L.length; j++) { x -= RP.edit[L[j].id].w; if (x <= 0) { cnt[L[j].t] = (cnt[L[j].t] || 0) + 1; break; } } }
      alert('20 ta o‘yinda King Kong taxminan shunday o‘ynaydi:\n\n' + Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).map(function (k) { return k + ' — ' + cnt[k] + ' marta'; }).join('\n'));
    };
    bar.querySelector('#rX').onclick = function () {
      if (!confirm('Shu pozitsiyadan King Kong nazariya bazasiga qarshi 10 ta tez o‘yin o‘ynaydi (ranglar almashib). Natijalar «🤖 Sinov o‘yinlari»da, xatolar «⚡ Tuzatishlar»da. Boshlaymi?')) return;
      post('/api/kkrep/test', { sc: RP.sc, board: RP.b, side: RP.s, kk: RP.s, n: 10 }).then(function (r) { alert(r.error ? '⚠️ ' + r.error : '🧪 Boshlandi: 10 ta o‘yin. Bir necha daqiqadan keyin «🤖 Sinov o‘yinlari»ni oching.'); });
    };
    if (!RP.safe) post('/api/kkadm/safe', { board: RP.b, side: RP.s }).then(function (r) { var L = r.list || [], best = L.length ? L[0].v : 0, o = {}; L.forEach(function (m) { o[m.from + '-' + m.to] = m.v - best; }); RP.safe = o; if (O && O.querySelector('#rS') && RP.v === v) repDraw(); });
  }
  // ---------- 🌳 daraxt va sozlamalar
  function treeView() {
    var C = shell('🌳 Debyut daraxti', list); sbar(null); C.innerHTML = '<div class="msg">Yuklanmoqda…</div>';
    post('/api/kkrep/view', { sc: RP.sc }).then(function (v0) {
      post('/api/kkrep/tree', { sc: RP.sc }).then(function (r) {
        var cfg = r.cfg, L = r.list || [];
        var h = '<div class="tabs" style="flex-wrap:wrap">' + v0.scopes.map(function (x) { return '<button data-sc="' + esc(x.id) + '"' + (x.id === RP.sc ? ' class="on"' : '') + ' style="flex:none;padding:7px 9px">' + esc(x.name) + '</button>'; }).join('') + '</div>';
        h += L.length ? '<div class="box" style="font:12.5px ui-monospace,monospace;line-height:1.8;overflow-x:auto">' + L.map(function (x, i) {
          var num = Math.floor(x.d / 2) + 1, z = x.st;
          return '<div data-tr="' + i + '" style="white-space:nowrap;padding-left:' + (x.d * 12) + 'px;cursor:pointer">' + num + (x.s === 1 ? '. ' : '… ') + (x.opp ? '<span style="opacity:.6">' + esc(x.t) + '</span>' : '<b style="color:' + (x.bad ? '#fca5a5' : x.w >= 80 ? '#86efac' : '#fde68a') + '">' + esc(x.t) + (x.mk ? esc(x.mk) : '') + '</b> ' + x.w + (x.bad ? ' ⚠️' : '')) + (z ? ' <span style="font-family:system-ui;opacity:.65;font-size:11px">✅' + z.w + ' ❌' + z.l + ' 🤝' + z.d + '</span>' : '') + '</div>';
        }).join('') + '</div>' : '<div class="msg" style="opacity:.7">Bu doirada hali repertuar yo‘q. «📚 Nazariyadan import» yoki «📖 Repertuar»dan boshlang.</div>';
        var sw = function (k, t, d) { return '<button class="auto" data-cf="' + k + '"><span style="flex:1">' + t + '<small>' + d + '</small></span><span class="sw' + (cfg[k] ? ' on' : '') + '"></span></button>'; };
        h += '<div class="sec">SOZLAMALAR</div>' +
          '<button class="auto" id="cD"><span style="flex:1">🎯 Repertuar chuqurligi<small>import va daraxt shu yurishgacha; keyin King Kong o‘zi o‘ylaydi</small></span><b>' + cfg.depth + ' yurish</b></button>' +
          sw('top', '🥇 Eng katta foiz doim birinchi', 'o‘chirilsa — foizlar ulush bo‘yicha aralashtiriladi') +
          sw('tour100', '🏆 Turnirda faqat 100% lik yurishlar', 'turnir o‘yinlarida eng ishonchli yurishlar') +
          sw('adapt', '📊 Foizlar o‘zi moslashsin', 'yutqazgan tarmoq pasayadi, yutgani ko‘tariladi (🔒 qulflanganlar tegilmaydi)') +
          sw('traps', '🪤 Tuzoqlarga yo‘naltirish', 'repertuar bo‘lmagan joyda raqiblar ko‘p xato qilgan pozitsiyaga xavfsiz yo‘l') +
          '<button class="auto" id="cI"><span style="flex:1">📚 Nazariya bazasidan import<small>shu doiraga; mavjud qulflangan yozuvlarga tegilmaydi</small></span><b style="color:#93c5fd">Import</b></button>' +
          '<button class="auto" id="cL"><span style="flex:1">🌐 Onlayn eski o‘yinlar<small>yutqazgan/durang o‘yinlar → tahlil → ⚡ tuzatishlar (har kecha o‘zi ham)</small></span><b style="color:#93c5fd">Yuklash</b></button>' +
          '<button class="auto" id="cE"><span style="flex:1">📤 Eksport<small>shu doira repertuari (JSON) — nusxa olish uchun</small></span>›</button>';
        C.innerHTML = h;
        sbar('<button class="o" id="tN">＋ Repertuarni ochish</button>').querySelector('#tN').onclick = function () { repOpen(null, null, RP.sc); };
        [].forEach.call(C.querySelectorAll('[data-sc]'), function (el) { el.onclick = function () { RP.sc = el.getAttribute('data-sc'); treeView(); }; });
        [].forEach.call(C.querySelectorAll('[data-tr]'), function (el) { el.onclick = function () { var x = L[+el.getAttribute('data-tr')]; RP.path = [{ b: x.b, s: x.s, t: (x.pre.length ? '…' : '') + x.pre.slice(-2).join(' ') || '♟' }]; RP.b = x.b; RP.s = x.s; repLoad(); }; });
        [].forEach.call(C.querySelectorAll('[data-cf]'), function (el) { el.onclick = function () { var k = el.getAttribute('data-cf'), o = {}; o[k] = !cfg[k]; post('/api/kkrep/cfg', o).then(treeView); }; });
        C.querySelector('#cD').onclick = function () { var n = prompt('Repertuar chuqurligi (yurishlar, 2–30):', cfg.depth); if (n) post('/api/kkrep/cfg', { depth: +n }).then(treeView); };
        C.querySelector('#cI').onclick = function () { if (!confirm('nazariya bazasi yurishlari «' + RP.sc + '» doirasiga foiz bilan qo‘shilsinmi?')) return; this.querySelector('b').textContent = '⏳'; post('/api/kkrep/import', { sc: RP.sc }).then(function (r) { alert('📗 ' + (r.add || 0) + ' ta yurish qo‘shildi'); treeView(); }); };
        C.querySelector('#cL').onclick = function () { this.querySelector('b').textContent = '⏳'; post('/api/kkadm/ldimport', { n: 120 }).then(function (r) { alert(r.error ? '⚠️ ' + r.error : '🌐 ' + r.add + ' ta o‘yin yuklandi (' + r.seen + ' ta ko‘rildi). Xatolar tahlildan keyin «⚡ Tuzatishlar»da.'); treeView(); }); };
        C.querySelector('#cE').onclick = function () { post('/api/kkrep/export', { sc: RP.sc }).then(function (r) { var C2 = shell('📤 Eksport · ' + esc(RP.sc), treeView); C2.innerHTML = '<textarea style="width:100%;height:60vh;background:#1d1858;color:#fff;border:0;border-radius:12px;padding:10px;font:11px ui-monospace,monospace">' + esc(JSON.stringify(r.data)) + '</textarea>'; }); };
      });
    });
  }
  // ---------- ♟ pozitsiya terish
  var PE = { b: null, s: 1, pen: 1, res: null };
  function posEdit() {
    if (!PE.b) PE.b = initB();
    var C = shell('♟ Pozitsiya terish', list), pens = [[0, '⬚ bo‘sh'], [1, '⚪'], [2, '⚪👑'], [-1, '⚫'], [-2, '⚫👑']];
    var h = '<div class="ch" style="margin:0 0 6px">' + pens.map(function (p) { return '<button data-pen="' + p[0] + '"' + (PE.pen === p[0] ? ' class="on"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div>';
    h += bdHtml(PE.b, false, {}, PE.res && PE.res.f != null ? [[PE.res.f, PE.res.t, 'g']] : null);
    h += '<div class="ch"><button id="pS">' + (PE.s === 1 ? '⚪ Oq yuradi' : '⚫ Qora yuradi') + '</button><button id="pI">↺ Boshlang‘ich</button><button id="pC">🧹 Tozalash</button></div>';
    if (PE.res) h += '<div class="box"><div class="h">KING KONG BU YERDA</div>' + (PE.res.n ? '<b style="font-size:17px">' + esc(PE.res.n) + '</b> — ' + esc(({ tb: '🏁 endshpil bazasi', admin: '📚 o‘rgatilgan', etude: '🧩 etyud', colette: '📚 Nazariya', book: '📖 kitob', cache: '🧠 xotira', deep: '🎓 saboq', engine: '⚙️ dvigatel (o‘ylab topadi)', over: 'o‘yin tugagan' })[PE.res.src] || PE.res.src || '') : 'Yurish yo‘q') + '</div>';
    C.innerHTML = h;
    var bar = sbar('<button class="o" id="pK">🦍 Nima o‘ynaydi?</button><button class="y" id="pR">📖 Repertuarda</button>');
    [].forEach.call(C.querySelectorAll('[data-pen]'), function (el) { el.onclick = function () { PE.pen = +el.getAttribute('data-pen'); posEdit(); }; });
    C.querySelector('.bd').onclick = function (e) { var el = e.target.closest('[data-i]'); if (!el) return; var i = +el.getAttribute('data-i'); if (((i >> 3) + (i & 7)) % 2 !== 1) return; PE.b[i] = PE.b[i] === PE.pen ? 0 : PE.pen; PE.res = null; posEdit(); };
    C.querySelector('#pS').onclick = function () { PE.s = -PE.s; PE.res = null; posEdit(); };
    C.querySelector('#pI').onclick = function () { PE.b = initB(); PE.s = 1; PE.res = null; posEdit(); };
    C.querySelector('#pC').onclick = function () { PE.b = Array(64).fill(0); PE.res = null; posEdit(); };
    bar.querySelector('#pK').onclick = function () { post('/api/kkbook/peek', { list: [{ board: PE.b, side: PE.s }] }).then(function (r) { PE.res = (r.list || [])[0] || { n: null }; posEdit(); }); };
    bar.querySelector('#pR').onclick = function () { repOpen(PE.b.slice(), PE.s, RP.sc); };
  }
  // ---------- 🪤 tuzoqlar
  function trapView() {
    var C = shell('🪤 Tuzoqlar', list); sbar(null); C.innerHTML = '<div class="msg">Yuklanmoqda…</div>';
    post('/api/kkrep/traps', {}).then(function (r) {
      var L = r.list || [];
      C.innerHTML = '<div style="font-size:12.5px;opacity:.75;margin:0 2px 8px">Raqib yurishi kerak bo‘lgan pozitsiyalar, unda o‘yinchilar ko‘p xato qilgan (dona yo‘qotgan). ' + (r.on ? 'King Kong repertuar bo‘lmagan joyda bu pozitsiyalarga xavfsiz yo‘l bo‘lsa — o‘sha yurishni tanlaydi.' : '⚠️ Tuzoqlarga yo‘naltirish o‘chiq (🌳 sozlamalarda).') + '</div>' +
        (L.length ? L.map(function (x, i) { return '<div class="row" data-tp="' + i + '"><span style="font-size:20px">🪤</span><span class="f"><b>' + x.err + ' / ' + x.n + '</b> marta xato · ' + x.rate + '%<small>' + (x.s === 1 ? 'oq' : 'qora') + ' yurishi kerak · bosing — ko‘rish</small></span></div>'; }).join('') : '<div class="msg" style="opacity:.7">Hali yetarli o‘yin tahlil qilinmagan</div>');
      [].forEach.call(C.querySelectorAll('[data-tp]'), function (el) { el.onclick = function () { var x = L[+el.getAttribute('data-tp')], C2 = shell('🪤 ' + x.err + '/' + x.n + ' xato', trapView); C2.innerHTML = bdHtml(x.b, false, {}, null) + '<div class="msg">' + (x.s === 1 ? '⚪ Oq' : '⚫ Qora') + ' yurishi kerak — o‘yinchilar ' + x.rate + '% hollarda dona yo‘qotgan</div>'; }; });
    });
  }
  // ---------- 📥 PDN import
  function pdnView() {
    var C = shell('📥 PDN import', list); sbar(null);
    C.innerHTML = '<div style="font-size:12.5px;opacity:.75;margin:0 2px 6px">Bir yoki bir nechta partiyani qo‘ying (masalan: <code>1. c3-d4 f6-g5 2. g3-f4 …</code>). Har pozitsiyada qaysi yurish ko‘p o‘ynalgan bo‘lsa — shuncha katta foiz.</div>' +
      '<textarea id="pT" style="width:100%;height:38vh;background:#1d1858;color:#fff;border:0;border-radius:12px;padding:10px;font:12.5px ui-monospace,monospace" placeholder="1. c3-d4 f6-g5 2. g3-f4 g7-f6 …"></textarea>' +
      '<div class="ch"><button data-sd="both" class="on">Ikkala tomon</button><button data-sd="w">Faqat oq</button><button data-sd="b">Faqat qora</button></div>' +
      '<div style="font-size:12.5px;opacity:.75;margin:6px 2px">Doira: <b>' + esc(RP.sc) + '</b> (📖 Repertuarda o‘zgartiriladi)</div>';
    var sd = 'both';
    [].forEach.call(C.querySelectorAll('[data-sd]'), function (el) { el.onclick = function () { sd = el.getAttribute('data-sd'); [].forEach.call(C.querySelectorAll('[data-sd]'), function (q) { q.classList.toggle('on', q === el); }); }; });
    sbar('<button class="y" id="pG">📥 Import</button>').querySelector('#pG').onclick = function () { var t = C.querySelector('#pT').value; if (!t.trim()) return; post('/api/kkrep/pdn', { sc: RP.sc, text: t, sides: sd }).then(function (r) { alert(r.error ? '⚠️ ' + r.error : '📥 ' + r.games + ' ta partiya o‘qildi' + (r.bad ? ' (' + r.bad + ' tasida xato)' : '') + ', ' + r.add + ' ta yurish repertuarga qo‘shildi'); }); };
  }
  // ---------- 🕓 tarix
  function histView() {
    var C = shell('🕓 O‘zgarishlar tarixi', list); sbar(null); C.innerHTML = '<div class="msg">Yuklanmoqda…</div>';
    post('/api/kkrep/hist', {}).then(function (r) {
      var L = r.list || [];
      C.innerHTML = L.length ? L.map(function (x) { return '<div class="row"><span class="f"><b>' + esc(x.why || x.nw) + '</b><small>' + when(x.at) + ' · ' + esc(x.sc) + (x.why ? '' : ' · avval ' + x.old + ' ta yozuv') + '</small></span>' + (x.b ? '<button data-u="' + x.i + '">↩ Qaytarish</button>' : '') + '</div>'; }).join('') : '<div class="msg" style="opacity:.7">Hali o‘zgarish yo‘q</div>';
      [].forEach.call(C.querySelectorAll('[data-u]'), function (el) { el.onclick = function () { if (!confirm('Shu o‘zgarishdan oldingi holatga qaytarilsinmi?')) return; post('/api/kkrep/undo', { i: +el.getAttribute('data-u') }).then(histView); }; });
    });
  }
  window.kkPanel = function (mode) { if (O) O.remove(); O = document.createElement('div'); O.id = 'kkP'; document.body.appendChild(O); if (mode === 'fix') { O.innerHTML = '<div class="in"><div class="top"><button class="bk" id="kkB">‹</button><b></b></div><div id="kkC"></div></div>'; fixes(); get('/api/kkadm').then(function (d) { if (!d.error) V.list = d; }); } else list(); };
})();
