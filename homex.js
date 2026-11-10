/* homex.js — 🏠 bosh sahifa (chess.com uslubida): 🎯 jonli stollar yuqorida, 🧩 kunlik masala, 📊 reytinglar,
   🕹 o'yinlarim (oxirgi 5 ta, 🔬 tahlil), bo'sh online ro'yxatda yordamchi tugmalar, 👥 do'stlar qatori, kichik taklif banneri.
   Mavjud bloklar (profil kartasi, jonli stollar, mini o'yinlar / botlar) o'z joyida ishlaydi — biz faqat tartib (order) beramiz va yangilarini qo'shamiz. */
;(function () {
  if (window.__hx) return; window.__hx = 1;
  var tg = window.Telegram && window.Telegram.WebApp;
  function $(id) { return document.getElementById(id); }
  function idata() { return (tg && tg.initData) || ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var st = document.createElement('style'); st.id = 'hxCss';
  st.textContent =
    // tartib: profil → jonli stollar → kunlik masala → mini o'yinlar/botlar → reytinglar → o'yinlarim; eski banner yashiriladi (pastda kichigi bor)
    '#lbPanel #hzHero #pfCard{order:1!important}#lbPanel #hzHero #hxLvW{order:2!important;flex:1 1 100%;width:100%}#lbPanel #hzHero #hxPz{order:3!important}#lbPanel #hzHero #nvDuo{order:4!important}#lbPanel #hzHero #hxRt{order:5!important}#lbPanel #hzHero #hxGm{order:6!important}#lbPanel #hzHero #nvKK{display:none!important}' +
    '#hxPz,#hxRt,#hxGm{flex:1 1 100%;width:100%;box-sizing:border-box}' +
    // 🎯 jonli stollar: yonga suriladigan kartalar, kichik doska
    '#hzLive{flex:1 1 100%;width:100%;box-sizing:border-box;margin:0 0 12px!important}#hzLive:not(:has(.hzLvC)){display:none!important}' +
    '#hzLive .hzLvG{display:flex!important;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:none}#hzLive .hzLvG::-webkit-scrollbar{display:none}' +
    '#hzLive .hzLvC{flex:0 0 46%;scroll-snap-align:start}' +
    '.hzLvB{display:grid;grid-template-columns:repeat(8,1fr);width:84px;height:84px;margin:7px auto 3px;border-radius:5px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.3)}' +
    '.hzLvB i{display:flex!important;align-items:center;justify-content:center;padding:0!important}.hzLvB i.l{background:#ecd3a5}.hzLvB i.d{background:#9a6334}' +
    '.hzLvB s{display:block;width:78%;height:78%;border-radius:50%;text-decoration:none}.hzLvB s.p1,.hzLvB s.p3{background:#fafafa;box-shadow:inset 0 -1px 0 #bbb}.hzLvB s.p2,.hzLvB s.p4{background:#222}.hzLvB s.p3,.hzLvB s.p4{box-shadow:0 0 0 1.5px #f5b82e}' +
    // umumiy
    '.hxH{display:flex;justify-content:space-between;align-items:center;margin:4px 2px 8px;font-weight:800;font-size:16px}.hxH a{font-weight:500;opacity:.7;font-size:13px;cursor:pointer}' +
    // 🧩 kunlik masala
    '#hxPz{display:flex;gap:12px;align-items:stretch;overflow:hidden;border-radius:20px;padding:14px;margin:0 0 12px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#166c45,#1f9e5d 60%,#3ec27a);box-shadow:0 6px 18px rgba(22,108,69,.35)}' +
    '#hxPz .L{flex:1;min-width:0;display:flex;flex-direction:column}#hxPz .R{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:8px}' +
    '#hxPz h3{margin:0;font-size:20px}#hxPz .s{font-size:13px;opacity:.92;margin:3px 0 10px;line-height:1.3}' +
    '#hxPz .bd{width:62px;height:62px;border-radius:9px;background:repeating-conic-gradient(#7a4a22 0 25%,#e8c48e 0 50%) 0 0/15.5px 15.5px;transform:rotate(-8deg);box-shadow:0 6px 14px rgba(0,0,0,.35)}' +
    '#hxPz .n{margin-top:auto;font-weight:800;font-size:13.5px}#hxPz .bar{margin-top:6px;height:10px;border-radius:8px;background:rgba(0,0,0,.25)}#hxPz .bar i{display:block;height:100%;min-width:6px;border-radius:8px;background:linear-gradient(90deg,#ff8a00,#ffb02e)}' +
    '#hxPz button{border:0;border-radius:12px;padding:9px 14px;font-weight:800;font-size:15px;background:#fff;color:#1a7a4c}' +
    // 📊 reytinglar
    '#hxRt .rt{display:flex;gap:8px;margin-bottom:12px}#hxRt .rt div{flex:1;min-width:0;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);padding:10px 3px;text-align:center;cursor:pointer}' +
    '#hxRt em{font-style:normal;font-size:21px;display:block}#hxRt b{display:block;font-size:16px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#hxRt small{opacity:.65;font-size:11px}' +
    // 🕹 o'yinlarim
    '#hxGm .gh{border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);overflow:hidden;margin-bottom:6px}' +
    '#hxGm .g{display:flex;align-items:center;gap:9px;padding:9px 11px;border-top:1px solid rgba(255,255,255,.06);font-size:14px}#hxGm .g:first-child{border-top:0}' +
    '#hxGm .r{flex:none;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff}.hxW{background:#16a34a}.hxL{background:#dc2626}.hxD{background:#64748b}' +
    '#hxGm .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#hxGm .nm small,#hxGm .tc{opacity:.6;font-size:12px}' +
    '#hxGm button{border:0;border-radius:10px;padding:6px 9px;background:rgba(255,255,255,.1);color:#fff;font-size:12px;flex:none}' +
    '#hxGm .e{padding:14px;text-align:center;opacity:.7;font-size:13.5px}' +
    // pastki qism: bo'sh online, do'stlar, banner
    '#hxBot{padding:0 12px 10px}' +
    '#hxEmp{border-radius:18px;border:1px dashed rgba(255,255,255,.22);padding:14px;text-align:center;font-size:14px;margin:4px 0 6px}#hxEmp small{display:block;opacity:.65;margin:3px 0 10px}' +
    '#hxEmp button{border:0;border-radius:12px;padding:9px 13px;margin:0 3px;font-weight:700;color:#fff;background:#6d5cf0}#hxEmp button+button{background:rgba(255,255,255,.12)}' +
    '#hxFr{display:flex;gap:8px;margin-bottom:12px}#hxFr div{flex:1;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);padding:12px 4px;text-align:center;font-size:12.5px;font-weight:600;cursor:pointer}#hxFr em{font-style:normal;font-size:25px;display:block;margin-bottom:4px}' +
    '#hxBan{border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#9a3f13,#e07b00);font-size:13px;cursor:pointer;color:#fff}#hxBan b{font-size:14px}#hxBan button{margin-left:auto;border:0;border-radius:10px;padding:7px 10px;background:#ffd36b;font-weight:800;color:#222}';
  document.head.appendChild(st);

  var D = null, dAt = 0;
  function load(force) {
    if (!idata() || (!force && Date.now() - dAt < 60000)) return;
    dAt = Date.now();
    fetch('/api/home', { headers: { 'x-init-data': idata() } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) { D = j; draw(); } }).catch(function () {});
  }
  function txt(id) { var e = $(id); return e ? (e.innerText || '').replace(/\s+/g, ' ').trim() : ''; }
  function nav(rx) { var b = [].slice.call(document.querySelectorAll('#nvBar button')).find(function (x) { return rx.test(x.textContent || ''); }); if (b) b.click(); }
  function openDaily() {
    if (!window.spPuzzles) { nav(/Masalalar|Задачи|Puzzles/); return; }
    window.spPuzzles();
    var n = 0, t = setInterval(function () { var d = document.querySelector('[data-pzh="daily"]'); if (d) { clearInterval(t); d.click(); } else if (++n > 30) clearInterval(t); }, 200);
  }
  function review(g) {
    if (!g || !g.m || !window.spBoardOpen) return;
    window.spBoardOpen({ white: g.w, black: g.b, winner: g.win, moves: g.m.map(function (x) { return { from: { r: x[0], c: x[1] }, to: { r: x[2], c: x[3] }, captures: (x[4] || []).map(function (y) { return { r: y[0], c: y[1] }; }) }; }) });
  }
  function el(id, html, before) {
    var e = $(id); if (!e) { e = document.createElement('div'); e.id = id; }
    if (e.__h !== html) { e.innerHTML = html; e.__h = html; }
    return e;
  }
  function draw() {
    var hero = $('hzHero'); if (!hero) return;
    // 🎯 jonli stollar profil kartasidan keyin: o'z o'ramimizga (#hxLvW) ko'chiramiz — bosh sahifa muharriri tartibi buzilmaydi
    var lw = $('hxLvW'); if (!lw) { lw = document.createElement('div'); lw.id = 'hxLvW'; }
    if (lw.parentNode !== hero) hero.appendChild(lw);
    var lv = $('hzLive'); if (lv && lv.parentNode !== lw) lw.appendChild(lv);
    // 🧩 kunlik masala
    var day = D ? D.day || 0 : 0, sol = D ? D.solved || 0 : 0;
    var pz = el('hxPz', '<div class="L"><h3>🧩 Kunlik masala</h3><div class="s">' + (day ? '✅ Bugun ' + day + ' ta yechdingiz — davom eting!' : 'Bugungi masala sizni kutmoqda') + '</div>' +
      '<div class="n">Jami ' + sol + ' ta yechilgan</div><div class="bar"><i style="width:' + Math.min(100, day * 20) + '%"></i></div></div><div class="R"><div class="bd"></div><button>Yechish!</button></div>');
    if (pz.parentNode !== hero) { hero.appendChild(pz); pz.onclick = openDaily; }
    // 📊 reytinglar
    var lg = txt('lgCard').match(/(\d+)\s*-?\s*o[‘'`ʻ]?rin/i), sk = txt('dqCard').match(/^\D*(\d+)/);
    var rt = el('hxRt', '<div class="hxH">Reytinglar <a data-x="rk">Hammasi ›</a></div><div class="rt">' +
      '<div data-x="rk"><em>⚡</em><b>' + (D ? D.elo : '—') + '</b><small>ELO</small></div>' +
      '<div data-x="pz"><em>🧩</em><b>' + sol + '</b><small>Masalalar</small></div>' +
      '<div data-x="lg"><em>🏆</em><b>' + (lg ? lg[1] + '-o‘rin' : '—') + '</b><small>Liga</small></div>' +
      '<div data-x="dq"><em>🔥</em><b>' + (sk ? sk[1] : 0) + '</b><small>Seriya</small></div></div>');
    if (rt.parentNode !== hero) {
      hero.appendChild(rt);
      rt.onclick = function (e) {
        var t = e.target; while (t && t !== rt && !t.getAttribute('data-x')) t = t.parentNode; var x = t && t.getAttribute && t.getAttribute('data-x');
        if (x === 'rk') nav(/Reyting|Рейтинг|Rating/); else if (x === 'pz') nav(/Masalalar|Задачи|Puzzles/);
        else if (x === 'lg' && $('lgCard')) $('lgCard').click(); else if (x === 'dq' && $('dqCard')) $('dqCard').click();
      };
    }
    // 🕹 o'yinlarim
    var A = (D && D.arch) || [], gh = '';
    A.forEach(function (g, i) {
      var r = !g.win || g.win === 'draw' ? 'D' : g.me ? (g.win === g.me ? 'W' : 'L') : 'D';
      var opp = g.me === 'white' ? g.b : g.me === 'black' ? g.w : (g.w + ' — ' + g.b);
      gh += '<div class="g"><span class="r hx' + r + '">' + (r === 'W' ? '✓' : r === 'L' ? '✕' : '½') + '</span><span class="nm">' + esc(opp) + (g.oe ? ' <small>(' + g.oe + ')</small>' : '') + '</span><span class="tc">' + esc(g.tc && g.tc !== '∞' ? g.tc : '∞') + '</span><button data-i="' + i + '">🔬 Tahlil</button></div>';
    });
    var gm = el('hxGm', '<div class="hxH">O‘yinlarim <a data-a="1">Arxiv ›</a></div><div class="gh">' + (gh || '<div class="e">Hali o‘yin yo‘q — ▶ O‘ynash tugmasini bosing!</div>') + '</div>');
    if (gm.parentNode !== hero) {
      hero.appendChild(gm);
      gm.onclick = function (e) {
        var t = e.target;
        if (t.getAttribute && t.getAttribute('data-a')) { if (window.mnArchOpen) window.mnArchOpen(); return; }
        if (t.getAttribute && t.getAttribute('data-i') != null) review(((D && D.arch) || [])[+t.getAttribute('data-i')]);
      };
    }
    // pastki qism: online ro'yxatdan keyin
    var pl = $('lbPl'); if (!pl || !pl.parentNode) return;
    var bot = $('hxBot'); if (!bot) { bot = document.createElement('div'); bot.id = 'hxBot'; }
    if (bot.previousSibling !== pl) pl.parentNode.insertBefore(bot, pl.nextSibling);
    bot.style.display = pl.offsetParent ? '' : 'none';
    var vis = [].slice.call(pl.querySelectorAll('.lbp')).filter(function (x) { return x.offsetParent; }).length;
    var onTab = pl.querySelector('.lbtb.on'), fr = onTab && onTab.getAttribute('data-t') === 'f';
    var emp = vis <= 1 && !fr ? '<div id="hxEmp">😴 Hozir hamma o‘yinda<small>Bir daqiqada bo‘shaydi — yoki shu orada:</small><button data-b="bot">🤖 Bot bilan</button><button data-b="live">📺 Jonli efir</button></div>' : '';
    var h = emp + '<div class="hxH">Do‘stlar</div><div id="hxFr"><div data-b="fr"><em>👥</em>Do‘stlarim</div><div data-b="link"><em>⚔️</em>Chaqiruv havolasi</div><div data-b="find"><em>🔍</em>O‘yinchi topish</div></div>' +
      '<div id="hxBan" data-b="ref">🎁 <div><b>Do‘st taklif qiling</b><br>Har do‘st +100 🪙</div><button data-b="ref">Taklif ›</button></div>';
    if (bot.__h !== h) {
      bot.innerHTML = h; bot.__h = h;
      bot.onclick = function (e) {
        var t = e.target; while (t && t !== bot && !t.getAttribute('data-b')) t = t.parentNode; var b = t && t.getAttribute && t.getAttribute('data-b');
        if (b === 'bot') { var br = $('nvBotRow'); if (br) br.click(); }
        else if (b === 'live') { nav(/Menyu|Меню|Menu/); setTimeout(function () { if (window.mnA) window.mnA('@live'); }, 300); }
        else if (b === 'fr') { var ft = pl.querySelector('[data-t="f"]'); if (ft) { ft.click(); pl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
        else if (b === 'link') { if (window.lbPlay) window.lbPlay.friend(window.__nvTc || '3+2'); }
        else if (b === 'find') nav(/Reyting|Рейтинг|Rating/);
        else if (b === 'ref') { var kk = $('nvKK'); if (kk) kk.click(); else if (window.refGo) window.refGo(); }
      };
    }
  }
  setInterval(function () { var hero = $('hzHero'); if (!hero || !hero.offsetParent) return; load(); try { draw(); } catch (e) {} }, 1000);
  // o'yindan qaytganda yangilaymiz
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(true); });
  window.hxRefresh = function () { load(true); };
})();
