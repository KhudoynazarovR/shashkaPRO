/* tarena.js — ⚔️ Arena turniri sahifasi (lidraughts uslubida): jadval + ochko ketma-ketligi + 🔥, sahifalash,
   Qatnashish/Pauza, ma'lumot va shartlar, yetakchi o'yin (jonli doska), TOP o'yinlar, chat, qoidalar.
   Faqat type==='arena' turnirlar uchun window.tvOpen ni egallaydi; qolgan turnirlar eski oynada ochiladi. */
;(function () {
  if (window.__tArena) return; window.__tArena = 1;
  var PER = 10;
  function g(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); }
  function L() { return window.__lb || null; }
  function St() { try { return window.__lb ? window.__lb.S : null; } catch (e) { return null; } }
  function findT(id) { var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function me() { var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function send(m) { var l = L(); if (l && l.send) l.send(m); }
  function fmt(ms) { ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function clk(ms) { if (ms == null) return ''; ms = Math.max(0, ms); var s = Math.ceil(ms / 1000), m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function nm(s) { return esc(String(s || '').replace(/^🤖\s*/, '')); }
  function tcInfo(tc) {
    var a = String(tc || '3+2').split('+'), b = Number(a[0]) || 0, inc = Number(a[1]) || 0, est = b * 60 + inc * 40;
    var sp = est < 180 ? ['🚀', 'Bullet'] : est < 480 ? ['🔥', 'Blits'] : est < 1500 ? ['🐇', 'Tezkor'] : ['🐢', 'Klassik'];
    return { icon: sp[0], name: sp[1], txt: b + '+' + inc };
  }
  // ochko ketma-ketligi: '0'..'9' oddiy, 'A'..'I' (=1..9) va 'o' (=0) — olovdagi o'yin
  function sheetHtml(s) {
    s = String(s || ''); var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), fire = false, v = ch;
      if (ch === 'o') { fire = true; v = '0'; } else if (ch >= 'A' && ch <= 'I') { fire = true; v = String(ch.charCodeAt(0) - 64); }
      out += '<i class="' + (fire ? 'f' : v === '0' ? 'z' : v === '1' ? 'd' : 'w') + '">' + v + '</i>';
    }
    return out;
  }

  var css = '' +
    '#taP{position:fixed;inset:0;z-index:2147483050;display:none;flex-direction:column;background:#161244;color:#ecebff;font-family:-apple-system,system-ui,Roboto,"Segoe UI","Noto Sans",Arial,sans-serif;font-variant-numeric:tabular-nums}' +
    '#taP.on{display:flex}' +
    'body.taOn #lbPanel{visibility:hidden!important}' +
    '#taP .taTop{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 10px;background:#1e1856;border-bottom:1px solid #2d2775}' +
    '#taP .taBk{border:0;background:#2d2775;color:#fff;border-radius:12px;width:40px;height:40px;font-size:18px;flex:none}' +
    '#taP .taTt{flex:1;min-width:0}#taP .taTt b{display:block;font-size:19px;color:#f5b72b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#taP .taTt small{display:block;font-size:12px;color:#a9a4d8;margin-top:2px}' +
    '#taP .taCd{font-size:26px;font-weight:700;color:#fff;flex:none}' +
    '#taP .taSc{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 0 calc(env(safe-area-inset-bottom,0px) + 18px)}' +
    '#taP .taBar{display:flex;align-items:center;gap:4px;padding:8px 8px;background:#1e1856;border-bottom:1px solid #2d2775;position:sticky;top:0;z-index:2}' +
    '#taP .taBar button.n{border:0;background:transparent;color:#cfcaff;font-size:17px;padding:6px 7px;border-radius:8px}#taP .taBar button.n:disabled{opacity:.3}' +
    '#taP .taPg{font-size:14px;color:#cfcaff;min-width:70px;text-align:center}' +
    '#taP .taJ{margin-left:auto;border:0;border-radius:10px;padding:9px 14px;font-weight:800;font-size:14px;letter-spacing:.3px;color:#fff;background:#3fa34d}' +
    '#taP .taJ.p{background:#4a4390}#taP .taJ.s{background:#d97706}' +
    '#taP .taRow{display:grid;grid-template-columns:30px minmax(0,1fr) auto 48px;align-items:center;gap:6px;padding:9px 10px;border-bottom:1px solid #241e63}' +
    '#taP .taRow:nth-child(even){background:#1a1550}#taP .taRow.me{background:#2c2470;box-shadow:inset 3px 0 0 #f5b72b}' +
    '#taP .taRk{font-size:14px;color:#a9a4d8;text-align:center}#taP .taRk.ps{color:#8f8bc4;font-weight:800;letter-spacing:-1px}' +
    '#taP .taNm{min-width:0}#taP .taNm b{display:block;font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#taP .taNm small{font-size:12px;color:#a9a4d8}#taP .taNm small .u{color:#6cc04a}#taP .taNm small .dn{color:#e5534b}#taP .taNm small .pl{color:#5fb3ff;margin-left:4px}' +
    '#taP .taSh{max-width:44vw;overflow:hidden;white-space:nowrap;direction:rtl;text-align:left;font-size:15px;letter-spacing:1px}' +
    '#taP .taSh span{direction:ltr;unicode-bidi:bidi-override}#taP .taSh i{font-style:normal}#taP .taSh i.w{color:#9fd36f}#taP .taSh i.d{color:#d6d3f5}#taP .taSh i.z{color:#7c78ad}#taP .taSh i.f{color:#ff9b2f;font-weight:800}' +
    '#taP .taPt{text-align:right;font-weight:800;font-size:16px}#taP .taPt.f{color:#ff9b2f}' +
    '#taP .taEm{padding:22px 14px;text-align:center;color:#a9a4d8}' +
    '#taP .taCard{margin:12px 10px 0;background:#1e1856;border:1px solid #2d2775;border-radius:14px;padding:12px 14px}' +
    '#taP .taCard h4{margin:0 0 8px;font-size:13px;letter-spacing:.6px;color:#a9a4d8;font-weight:700;text-transform:uppercase}' +
    '#taP .taInf{display:flex;gap:12px;align-items:center}#taP .taInf .ic{font-size:30px}#taP .taInf div{font-size:15px;line-height:1.45}' +
    '#taP .taLn{display:flex;gap:10px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #2d2775;font-size:14px}' +
    '#taP .taLn.bad{color:#f87171}#taP .taLn.ok{color:#86efac}' +
    '#taP .taPod{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:14px 10px 4px}' +
    '#taP .taPod div{flex:1;max-width:120px;text-align:center;border-radius:12px 12px 4px 4px;padding:10px 6px;background:#2a2470}' +
    '#taP .taPod div b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#taP .taPod div em{font-style:normal;font-size:26px;display:block}#taP .taPod div small{color:#f5b72b;font-weight:800}' +
    '#taP .taPod .p1{padding-top:22px;background:linear-gradient(180deg,#6b5310,#2a2470)}' +
    '#taP .taFt{display:grid;grid-template-columns:repeat(8,1fr);width:100%;max-width:360px;margin:6px auto;border:4px solid #7a4016;border-radius:4px;box-sizing:border-box}' +
    '#taP .taFt i{aspect-ratio:1;display:flex;align-items:center;justify-content:center}#taP .taFt i.l{background:#f3bb86}#taP .taFt i.d{background:#7b2f13}' +
    '#taP .taFt u{display:block;width:80%;height:80%;border-radius:50%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.35),0 1px 2px #0008;position:relative}' +
    '#taP .taFt u.w{background:#efefeb}#taP .taFt u.b{background:#232327}#taP .taFt u.k::after{content:"K";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:70%;color:#f5b72b}' +
    '#taP .taFp{display:flex;justify-content:space-between;align-items:center;font-size:14px;max-width:360px;margin:0 auto}' +
    '#taP .taFp b{font-weight:600}#taP .taFp small{color:#a9a4d8}#taP .taFp .c{background:#0f0c33;border-radius:6px;padding:2px 8px;font-weight:700}' +
    '#taP .taW{display:block;width:100%;max-width:360px;margin:10px auto 0;border:0;border-radius:10px;padding:10px;background:#3b3394;color:#fff;font-weight:700;font-size:14px}' +
    '#taP .taTg{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #2d2775}' +
    '#taP .taTg:last-child{border-bottom:0}#taP .taTg div{font-size:14px;line-height:1.5;min-width:0}#taP .taTg div span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#taP .taTg small{color:#a9a4d8}#taP .taTg .rk{display:inline-block;background:#2d2775;border-radius:5px;padding:0 5px;font-size:12px;margin-right:4px;color:#cfcaff}' +
    '#taP .taTg button{border:0;border-radius:9px;background:#3b3394;color:#fff;padding:8px 10px;font-size:13px}' +
    '#taP .taCh{max-height:260px;overflow-y:auto;font-size:14px;line-height:1.45}#taP .taCh p{margin:0 0 5px}#taP .taCh p b{color:#c4b5fd;margin-right:5px}#taP .taCh p.me b{color:#f5b72b}' +
    '#taP .taCi{display:flex;gap:6px;margin-top:8px}#taP .taCi input{flex:1;min-width:0;border:1px solid #2d2775;background:#120e3a;color:#fff;border-radius:10px;padding:10px;font-size:15px}' +
    '#taP .taCi button{border:0;border-radius:10px;background:#3fa34d;color:#fff;padding:0 14px;font-size:16px}' +
    '#taP .taRl{font-size:14px;line-height:1.55;color:#d6d3f5}#taP .taRl p{margin:0 0 7px}#taP details summary{cursor:pointer;font-weight:700;color:#cfcaff;list-style:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var P = null, cur = null, page = -1, timer = null, sigMain = '', sigChat = '', sigFeat = '';
  var RULES = '<p>⏱ Arena belgilangan vaqt davom etadi. O‘yiningiz tugashi bilan sizga darhol yangi raqib topiladi — o‘rni yaqin o‘yinchilar bir-biriga tushadi.</p>' +
    '<p>🏅 G‘alaba — <b>2</b>, durang — <b>1</b>, mag‘lubiyat — <b>0</b> ochko.</p>' +
    '<p>🔥 Ketma-ket 2 g‘alabadan keyin olov yonadi: keyingi o‘yinlarda ochko ikki barobar (g‘alaba 4, durang 2). Durang yoki mag‘lubiyat olovni o‘chiradi.</p>' +
    '<p>⚡ Berserk: o‘yin boshida soatingizning yarmini bersangiz, g‘alaba uchun +1 ochko (kamida 7 yurishdan keyin).</p>' +
    '<p>🤝 10 yurishdan oldingi durangga ochko berilmaydi.</p>' +
    '<p>⚖️ Ochko teng bo‘lsa, turnirdagi samaradorligi (raqiblar reytingi va natijalar) yuqori o‘yinchi oldinda.</p>' +
    '<p>⏸ Pauza bossangiz juftlanmaysiz, ochkolaringiz saqlanadi. «Qatnashish» bilan qaytasiz. 30 soniyada o‘yinga kirmasangiz — mag‘lubiyat va pauza.</p>' +
    '<p>🏁 Vaqt tugaganda ketayotgan o‘yinlar oxirigacha o‘ynaladi va hisoblanadi.</p>';

  function build() {
    if (P) return;
    P = document.createElement('div'); P.id = 'taP';
    P.innerHTML = '<div class="taTop"><button class="taBk" id="taBk">←</button><div class="taTt"><b id="taNm"></b><small id="taSub"></small></div><div class="taCd" id="taCd"></div></div>' +
      '<div class="taSc" id="taSc"><div id="taPod"></div>' +
      '<div class="taBar"><button class="n" data-a="me" title="Meni top">🔍</button><button class="n" data-a="first">⏮</button><button class="n" data-a="prev">◀</button><span class="taPg" id="taPg"></span><button class="n" data-a="next">▶</button><button class="n" data-a="last">⏭</button><span id="taJw" style="margin-left:auto"></span></div>' +
      '<div id="taRows"></div>' +
      '<div class="taCard" id="taInfo"></div>' +
      '<div class="taCard" id="taFeatC" style="display:none"><h4>📺 Yetakchi o‘yin</h4><div id="taFeat"></div></div>' +
      '<div class="taCard" id="taTopC" style="display:none"><h4>⭐ TOP o‘yinlar</h4><div id="taTop"></div></div>' +
      '<div class="taCard"><h4>💬 Chat <span id="taChN"></span></h4><div class="taCh" id="taCh"></div><div class="taCi"><input id="taTx" maxlength="200" placeholder="Xabar yozing…"><button id="taSd">➤</button></div></div>' +
      '<div class="taCard"><details><summary>ℹ️ Arena qoidalari</summary><div class="taRl" style="margin-top:10px">' + RULES + '</div></details></div>' +
      '</div>';
    document.body.appendChild(P);
    g('taBk').onclick = close;
    g('taSd').onclick = chat;
    g('taTx').onkeydown = function (e) { if (e.key === 'Enter') chat(); };
    P.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b || !cur) return;
      var a = b.getAttribute('data-a'), t = findT(cur); if (!t) return;
      var n = Math.max(1, Math.ceil((t.players || []).length / PER));
      if (a === 'first') page = 0; else if (a === 'prev') page = Math.max(0, page - 1); else if (a === 'next') page = Math.min(n - 1, page + 1); else if (a === 'last') page = n - 1;
      else if (a === 'me') { var i = myIdx(t); if (i >= 0) page = Math.floor(i / PER); }
      else if (a === 'join') { send({ type: 'lbTJoin', tid: cur }); }
      else if (a === 'pause') { send({ type: 'lbTLeave', tid: cur }); }
      else if (a === 'leave') { if (confirm('Arenadan chiqasizmi?')) send({ type: 'lbTLeave', tid: cur }); }
      else if (a === 'start') { send({ type: 'lbTStart', tid: cur }); }
      else if (a === 'watch') { var r = b.getAttribute('data-room'), l = L(); close(); if (l && l.go) l.go(r); return; }
      sigMain = ''; render();
    });
  }
  function chat() { var v = g('taTx').value.trim(); if (!v || !cur) return; send({ type: 'lbTChat', tid: cur, text: v }); g('taTx').value = ''; }
  function myIdx(t) { var u = me(), ps = t.players || []; for (var i = 0; i < ps.length; i++) if (String(ps[i].uid) === u) return i; return -1; }

  function render() {
    if (!P || !cur) return;
    var t = findT(cur), now = Date.now();
    if (!t) { g('taSub').textContent = 'Turnir topilmadi yoki bekor qilingan'; return; }
    g('taNm').textContent = '🏆 ' + t.name;
    var cd = '', sub = '';
    if (t.status === 'reg') { cd = t.startAt ? fmt(t.startAt - now) : ''; sub = t.startAt ? 'Boshlanishiga' : 'Ro‘yxat ochiq'; }
    else if (t.status === 'running') { if (t.ending) { sub = '⌛ Yakunlanmoqda — o‘yinlar tugashi kutilmoqda'; } else { cd = fmt(t.endAt - now); sub = 'Tugashiga'; } }
    else sub = '🏁 Arena tugadi';
    g('taCd').textContent = cd; g('taSub').textContent = sub + ' · ' + (t.players || []).length + ' o‘yinchi';
    var sig = JSON.stringify([t.status, t.ending, t.players, t.boards, page, me(), t.minGames, t.prize]);
    if (sig !== sigMain) { sigMain = sig; renderMain(t); }
    var cs = JSON.stringify(t.chat || []); if (cs !== sigChat) { sigChat = cs; renderChat(t); }
  }

  function renderMain(t) {
    var ps = t.players || [], u = me(), mi = myIdx(t), mp = mi >= 0 ? ps[mi] : null, n = Math.max(1, Math.ceil(ps.length / PER));
    if (page < 0) page = mi >= 0 ? Math.floor(mi / PER) : 0;
    if (page > n - 1) page = n - 1;
    // podium
    var pod = '';
    if (t.status === 'finished') {
      var top = ps.filter(function (p) { return p.games > 0; }).slice(0, 3);
      if (top.length) {
        var ord = [1, 0, 2], md = ['🥇', '🥈', '🥉'];
        pod = '<div class="taPod">' + ord.map(function (i) { var p = top[i]; if (!p) return '<span style="flex:1;max-width:120px"></span>'; return '<div class="p' + (i + 1) + '"><em>' + md[i] + '</em><b>' + nm(p.name) + '</b><small>' + p.score + ' ochko</small></div>'; }).join('') + '</div>';
      }
    }
    g('taPod').innerHTML = pod;
    // sahifalash va tugma
    g('taPg').textContent = ps.length ? (page * PER + 1) + '-' + Math.min(ps.length, page * PER + PER) + ' / ' + ps.length : '0';
    var bs = P.querySelectorAll('.taBar button.n');
    bs[1].disabled = bs[2].disabled = page <= 0; bs[3].disabled = bs[4].disabled = page >= n - 1; bs[0].disabled = mi < 0;
    var jb = '';
    if (t.status !== 'finished' && !t.ending) {
      if (t.status === 'reg' && !t.startAt && String(t.creatorUid) === u) jb += '<button class="taJ s" data-a="start">▶ BOSHLASH</button> ';
      if (!mp || mp.withdrawn) jb += '<button class="taJ" data-a="join">▶ QATNASHISH</button>';
      else jb += t.status === 'running' ? '<button class="taJ p" data-a="pause">⏸ PAUZA</button>' : '<button class="taJ p" data-a="leave"><svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px;margin-right:6px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>TARK ETISH</button>';
    }
    g('taJw').innerHTML = jb;
    // jadval
    var rows = ps.slice(page * PER, page * PER + PER).map(function (p, k) {
      var i = page * PER + k, d = Number(p.d) || 0;
      var dh = d > 0 ? ' <span class="u">↗' + d + '</span>' : d < 0 ? ' <span class="dn">↘' + (-d) + '</span>' : '';
      return '<div class="taRow' + (String(p.uid) === u ? ' me' : '') + '">' +
        '<div class="taRk' + (p.withdrawn ? ' ps' : '') + '">' + (p.withdrawn ? 'II' : (i + 1)) + '</div>' +
        '<div class="taNm"><b>' + nm(p.name) + '</b><small>' + (p.elo || '') + dh + (p.busy ? '<span class="pl">⚔ o‘ynamoqda</span>' : '') + '</small></div>' +
        '<div class="taSh"><span>' + sheetHtml(p.sheet) + '</span></div>' +
        '<div class="taPt' + (p.fire ? ' f' : '') + '">' + (p.fire ? '🔥' : '') + p.score + '</div></div>';
    }).join('');
    g('taRows').innerHTML = rows || '<div class="taEm">Hali hech kim qo‘shilmadi. Birinchi bo‘ling!</div>';
    // ma'lumot
    var tc = tcInfo(t.tc), inf = '<div class="taInf"><span class="ic">' + tc.icon + '</span><div><b>' + tc.txt + '</b> · ' + tc.name + ' · ' + (t.durationMin || 0) + ' daq<br>Reytingli · Arena' + (t.berserk ? ' · ⚡ Berserk' : '') + (t.pos === 'idf' ? ' · 🎲 IDF pozitsiyalar' : '') + '</div></div>';
    if (t.prize > 0) inf += '<div class="taLn">🏆 Mukofot jamg‘armasi: <b>' + t.prize + '</b> tanga · ' + (t.places || 3) + ' o‘ringa</div>';
    if (t.minGames > 0) {
      var s = St(), mg = s && s.me && s.me.games != null ? Number(s.me.games) : null, ok = mp ? true : mg == null ? null : mg >= t.minGames;
      inf += '<div class="taLn' + (ok === false ? ' bad' : ok ? ' ok' : '') + '">' + (ok === false ? '✖' : '✔') + ' Ishtirok sharti: kamida ' + t.minGames + ' ta reytingli o‘yin' + (mg != null && !mp ? ' (sizda ' + mg + ')' : '') + '</div>';
    }
    if (t.creatorName) inf += '<div class="taLn">👤 Tashkilotchi: ' + nm(t.creatorName) + '</div>';
    g('taInfo').innerHTML = inf;
    // TOP o'yinlar (eng yuqori o'rinlar bo'yicha)
    var rk = {}; ps.forEach(function (p, i) { rk[String(p.uid)] = i + 1; });
    var live = (t.boards || []).filter(function (b) { return !b.done; }).map(function (b) { return { b: b, r: Math.min(rk[String(b.white)] || 999, rk[String(b.black)] || 999) }; }).sort(function (a, b) { return a.r - b.r; });
    feat = live.length ? live[0].b : null;
    g('taFeatC').style.display = feat ? '' : 'none';
    g('taTopC').style.display = live.length > 1 ? '' : 'none';
    g('taTop').innerHTML = live.slice(1, 9).map(function (x) {
      var b = x.b;
      return '<div class="taTg"><div><span><i class="rk">#' + (rk[String(b.white)] || '–') + '</i>⚪ ' + nm(b.whiteName) + ' <small>' + (b.whiteElo || '') + '</small></span><span><i class="rk">#' + (rk[String(b.black)] || '–') + '</i>⚫ ' + nm(b.blackName) + ' <small>' + (b.blackElo || '') + '</small></span></div><button data-a="watch" data-room="' + esc(b.roomId) + '">👁 Tomosha</button></div>';
    }).join('');
    featRk = rk; renderFeat();
  }

  function renderChat(t) {
    var c = t.chat || [], u = me(), box = g('taCh');
    g('taChN').textContent = c.length ? '(' + c.length + ')' : '';
    var bottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = c.length ? c.map(function (m) { return '<p' + (String(m.uid) === u ? ' class="me"' : '') + '><b>' + (String(m.uid) === u ? 'Siz' : nm(m.name)) + '</b>' + esc(m.text) + '</p>'; }).join('') : '<p style="color:#a9a4d8">Hali xabar yo‘q.</p>';
    if (bottom) box.scrollTop = box.scrollHeight;
  }

  // ---- yetakchi o'yin: roomPeek orqali jonli doska
  var feat = null, featRk = {}, ws = null, peek = null, peekAt = 0;
  function conn() {
    if (ws) return;
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host); } catch (e) { ws = null; return; }
    ws.onopen = askPeek;
    ws.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (!m || m.type !== 'roomPeek') return; peek = (m.games || [])[0] || null; peekAt = Date.now(); sigFeat = ''; renderFeat(); };
    ws.onclose = function () { ws = null; };
  }
  function askPeek() { if (!feat || !cur) return; if (!ws) return conn(); if (ws.readyState === 1) try { ws.send(JSON.stringify({ type: 'roomPeek', ids: [feat.roomId] })); } catch (e) {} }
  function boardOf(x) {
    if (typeof window.initialBoard !== 'function' || typeof window.applyStep !== 'function') return null;
    var b = window.initialBoard();
    if (x.opening && x.opening.board) { var k = 0; for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { if ((r + c) % 2 !== 1) { b[r][c] = 0; continue; } var ch = x.opening.board.charAt(k++); b[r][c] = ch === 'w' ? 1 : ch === 'b' ? 2 : ch === 'W' ? 3 : ch === 'B' ? 4 : 0; } }
    try { for (var i = 0; i < (x.moves || []).length; i++) b = window.applyStep(b, x.moves[i]); } catch (e) {}
    return b;
  }
  function renderFeat() {
    if (!feat) { g('taFeat').innerHTML = ''; return; }
    var pk = peek && peek.id === feat.roomId ? peek : null;
    var sig = feat.roomId + ':' + (pk ? (pk.moves || []).length + ':' + JSON.stringify(pk.clock) : '-');
    if (sig === sigFeat) return; sigFeat = sig;
    var b = pk ? boardOf(pk) : null, cells = '';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var v = b ? b[r][c] : 0, pc = '';
      if (v) pc = '<u class="' + (v === 1 || v === 3 ? 'w' : 'b') + (v > 2 ? ' k' : '') + '"></u>';
      cells += '<i class="' + ((r + c) % 2 ? 'd' : 'l') + '">' + pc + '</i>';
    }
    var ck = pk && pk.clock ? pk.clock : {};
    function line(col) {
      var uid = col === 'w' ? feat.white : feat.black, n = col === 'w' ? feat.whiteName : feat.blackName, e = col === 'w' ? feat.whiteElo : feat.blackElo, t = col === 'w' ? ck.white : ck.black;
      return '<div class="taFp"><span><small>#' + (featRk[String(uid)] || '–') + '</small> <b>' + nm(n) + '</b> <small>' + (e || '') + '</small></span><span class="c">' + clk(t) + '</span></div>';
    }
    g('taFeat').innerHTML = line('b') + '<div class="taFt">' + cells + '</div>' + line('w') + '<button class="taW" data-a="watch" data-room="' + esc(feat.roomId) + '">👁 Tomosha qilish</button>';
  }

  function open(id) {
    build(); cur = String(id); window.__tvCur = cur; page = -1; sigMain = ''; sigChat = ''; sigFeat = ''; peek = null;
    document.body.classList.add('taOn'); P.classList.add('on'); g('taSc').scrollTop = 0; render();
    if (timer) clearInterval(timer);
    var k = 0; timer = setInterval(function () { render(); if (++k % 3 === 0) askPeek(); }, 1000);
    setTimeout(askPeek, 300);
  }
  function close() {
    document.body.classList.remove('taOn'); if (P) P.classList.remove('on'); cur = null; window.__tvCur = null;
    if (timer) { clearInterval(timer); timer = null; }
    try { if (ws) ws.close(); } catch (e) {} ws = null;
  }
  window.taOpen = open; window.taClose = close;
  window.taPeek = function (x) { peek = x; sigFeat = ''; renderFeat(); };   // sinov/tashqi ma'lumot uchun

  // window.tvOpen ni egallash: arena — yangi sahifa, qolganlari — eski oyna
  function hook() {
    if (!window.tvOpen || window.tvOpen.__ta) return false;
    var orig = window.tvOpen;
    var f = function (id) {
      var t = findT(id);
      if (t && t.type === 'arena') { try { if (window.tvClose) window.tvClose(); } catch (e) {} return open(id); }
      return orig.apply(this, arguments);
    };
    f.__ta = 1; window.tvOpen = f; return true;
  }
  var hk = setInterval(function () { hook(); }, 400);
  setTimeout(function () { clearInterval(hk); setInterval(hook, 3000); }, 20000);
})();

/* TAFX: g'oliblar shohsupasi — konfetti, lentalar va fanfara */
;(function () {
  var fired = {}, lastCur = null;
  function fanfare() {
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      var c = window.__spAC || (window.__spAC = new C()); if (c.state === 'suspended') c.resume();
      function note(f, t, d, type, v) {
        var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05);
      }
      // ta-ta-ta-taaa
      [[523.25, 0, .16], [523.25, .18, .16], [523.25, .36, .16], [659.25, .54, .5]].forEach(function (n) { note(n[0], n[1], n[2], 'square', 0.12); note(n[0] / 2, n[1], n[2], 'triangle', 0.15); });
      [[783.99, 1.1, .2], [659.25, 1.3, .2], [783.99, 1.5, .2], [1046.5, 1.7, .9]].forEach(function (n) { note(n[0], n[1], n[2], 'square', 0.12); note(n[0] / 2, n[1], n[2], 'triangle', 0.15); });
      for (var i = 0; i < 12; i++) note(1500 + Math.random() * 2500, 1.7 + i * 0.07, 0.12, 'sine', 0.05);
    } catch (e) {}
  }
  function confetti() {
    try {
      var cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483200';
      var W = cv.width = innerWidth, H = cv.height = innerHeight; document.body.appendChild(cv);
      var cx = cv.getContext('2d'), cols = ['#f5b72b', '#4cc9f0', '#f72585', '#7ae582', '#b5179e', '#ff9b2f', '#ffffff'], P = [];
      function add(x, ang, n) {
        for (var i = 0; i < n; i++) {
          var a = ang + (Math.random() - 0.5) * 1.3, s = 9 + Math.random() * 13, rib = Math.random() < 0.3;
          P.push({ x: x, y: H * 0.55, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
            w: rib ? 5 : 8 + Math.random() * 6, h: rib ? 26 + Math.random() * 22 : 6 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] });
        }
      }
      add(0, -Math.PI / 3, 90); add(W, -2 * Math.PI / 3, 90);
      setTimeout(function () { add(W * 0.25, -Math.PI / 2, 50); add(W * 0.75, -Math.PI / 2, 50); }, 900);
      var t0 = Date.now();
      (function loop() {
        var el = Date.now() - t0; cx.clearRect(0, 0, W, H);
        P.forEach(function (p) {
          p.vy += 0.35; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.max(0, Math.min(1, (5200 - el) / 1200));
          cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
        });
        if (el < 5200) requestAnimationFrame(loop); else cv.remove();
      })();
    } catch (e) {}
  }
  setInterval(function () {
    try {
      var P = document.getElementById('taP'), on = P && P.classList.contains('on'), cur = on ? window.__tvCur : null;
      if (cur !== lastCur) { lastCur = cur; }
      if (!cur || fired[cur]) return;
      var T = (window.__lb && window.__lb.S && window.__lb.S.tournaments) || [], t = null;
      for (var i = 0; i < T.length; i++) if (String(T[i].id) === String(cur)) t = T[i];
      if (!t || t.type !== 'arena' || t.status !== 'finished') return;
      if (!(t.players || []).some(function (p) { return p.games > 0; })) return;
      fired[cur] = 1; confetti(); fanfare();
    } catch (e) {}
  }, 500);
})();
