;(function(){
  if (window.__tvInit) return; window.__tvInit = 1;
  function g(id){ return document.getElementById(id); }
  function L(){ return window.__lb || null; }
  function St(){ var l = L(); try { return l ? l.S : null; } catch(e){ return null; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(x){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]; }); }
  function findT(id){ var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function meUid(){ var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function myP(t){ var u = meUid(), ps = t.players || []; for (var i = 0; i < ps.length; i++) if (String(ps[i].uid) === u) return ps[i]; return null; }
  function joined(t){ var p = myP(t); return !!(p && !p.withdrawn); }
  function send(m){ var l = L(); if (l && l.send) l.send(m); }
  function fmt(ms){ ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function hm(ts){ var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  var CSS =
  "#tvP{position:fixed;inset:0;z-index:2147481500;display:none;flex-direction:column;color:#eafff0;background:radial-gradient(circle at 15% 8%,rgba(80,200,120,.22),transparent 40%),radial-gradient(circle at 90% 85%,rgba(40,160,90,.2),transparent 45%),linear-gradient(160deg,#06281a,#0b3b24 45%,#04170f)}" +
  "#tvP.on{display:flex}" +
  ".tvHead{display:flex;align-items:center;gap:8px;padding:12px;background:rgba(3,25,14,.9);border-bottom:1px solid rgba(110,230,150,.25)}" +
  ".tvIc{width:42px;height:42px;min-height:0!important;padding:0!important;border-radius:12px!important;background:rgba(5,40,22,.9)!important;color:#dfffe8!important;border:1px solid rgba(90,210,130,.45)!important;font-size:18px}" +
  ".tvTit{flex:1;min-width:0}.tvTit b{display:block;font-size:18px;color:#ffd76a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tvTit small{color:#9fe3b4;font-size:13px}" +
  "#tvBody{flex:1;overflow-y:auto;padding:12px 12px 100px;-webkit-overflow-scrolling:touch}" +
  ".tvInfo{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}" +
  ".tvChip{background:rgba(20,80,50,.6);border:1px solid rgba(110,230,150,.3);border-radius:999px;padding:5px 10px;font-size:13px}" +
  ".tvSec{background:linear-gradient(180deg,rgba(10,60,35,.92),rgba(5,35,20,.95));border:1px solid rgba(110,230,150,.3);border-radius:18px;padding:12px;margin-bottom:12px;box-shadow:0 8px 24px rgba(0,0,0,.35)}" +
  ".tvSh{display:flex;align-items:center;gap:6px;font-weight:800;font-size:15px;margin-bottom:8px}.tvSh span{color:#9fe3b4;font-weight:600}.tvSh i{margin-left:auto;font-style:normal;color:#9fe3b4}" +
  "#tvChatH{cursor:pointer}" +
  "#tvMsgs{max-height:170px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:2px}" +
  ".tvM{max-width:82%;align-self:flex-start;background:rgba(3,30,16,.85);border:1px solid rgba(90,210,130,.25);border-radius:14px 14px 14px 4px;padding:6px 10px;font-size:14px;word-wrap:break-word}" +
  ".tvM.me{align-self:flex-end;background:linear-gradient(180deg,#2a9d52,#1c7a3c);border-color:#5ee08a;border-radius:14px 14px 4px 14px}" +
  ".tvM b{display:block;font-size:12px;color:#ffd76a}.tvM small{display:block;text-align:right;font-size:10px;opacity:.6}" +
  ".tvIn{display:flex;gap:8px;margin-top:8px}" +
  ".tvIn input{flex:1;min-width:0;background:rgba(3,30,16,.85);color:#eafff0;border:1px solid rgba(90,210,130,.45);border-radius:14px;padding:10px 12px;outline:none}" +
  ".tvIn button{min-height:0!important;width:46px;border-radius:14px!important;background:linear-gradient(180deg,#45d873,#1e9e45)!important;color:#fff!important;border:0!important;font-size:18px}" +
  ".tvLive{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}" +
  ".tvG{flex:0 0 auto;width:170px;background:rgba(3,30,16,.85);border:1px solid rgba(90,210,130,.35);border-radius:14px;padding:10px;position:relative}" +
  ".tvG .lv{position:absolute;top:8px;right:8px;font-size:11px;color:#ff6b6b;font-weight:800}" +
  ".tvG .n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;margin:3px 0;padding-right:4px}" +
  ".tvG button{width:100%;min-height:0!important;margin-top:8px;padding:7px!important;border-radius:10px!important;background:rgba(46,180,90,.25)!important;color:#bfffd2!important;border:1px solid rgba(94,224,138,.5)!important;font-weight:700}" +
  ".tvEmpty{color:#9fe3b4;font-size:13px;padding:6px 2px}" +
  ".tvTb{width:100%;border-collapse:collapse;font-size:14px}" +
  ".tvTb th{color:#9fe3b4;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;padding:6px 4px;border-bottom:1px solid rgba(110,230,150,.25)}" +
  ".tvTb th.r,.tvTb td.r{text-align:right}" +
  ".tvTb td{padding:9px 4px;border-bottom:1px solid rgba(110,230,150,.1)}" +
  ".tvTb tr.me td{background:rgba(94,224,138,.14)}" +
  ".tvTb .sc{color:#ffd76a;font-weight:800}" +
  ".tvFoot{position:absolute;left:0;right:0;bottom:0;padding:10px 12px calc(12px + env(safe-area-inset-bottom));display:flex;gap:8px;background:linear-gradient(180deg,transparent,rgba(3,20,11,.96) 35%)}" +
  ".tvFoot button{flex:1;min-height:50px;border-radius:16px!important;font-weight:800;font-size:16px;border:0!important;color:#fff!important}" +
  ".tvJ{background:linear-gradient(180deg,#45d873,#1e9e45)!important;box-shadow:0 4px 16px rgba(40,200,90,.45)}" +
  ".tvL{background:linear-gradient(180deg,#e05555,#a92e2e)!important}" +
  ".tvS{background:linear-gradient(180deg,#f0c14b,#c08a1c)!important;color:#1a1205!important}" +
  ".tvD{background:#2b3a31!important;color:#9fb5a6!important}" +
  ".tvRow{display:flex;gap:8px;margin-top:10px}" +
  ".tvRow button{flex:1;min-height:44px!important;border-radius:14px!important;font-weight:800;border:0!important;color:#fff!important}" +
  ".tvCJ{background:linear-gradient(180deg,#45d873,#1e9e45)!important}" +
  ".tvCL{background:linear-gradient(180deg,#e05555,#a92e2e)!important}" +
  ".tvCE{background:rgba(255,215,106,.15)!important;color:#ffd76a!important;border:1px solid rgba(255,215,106,.55)!important}";

  var HTML =
  '<div class="tvHead"><button class="tvIc" id="tvBack">←</button><div class="tvTit"><b id="tvName"></b><small id="tvSub"></small></div><button class="tvIc" id="tvRef">🔄</button></div>' +
  '<div id="tvBody">' +
    '<div class="tvInfo" id="tvInfo"></div>' +
    '<div class="tvSec"><div class="tvSh" id="tvChatH">💬 Chat <span id="tvChatN"></span><i id="tvChatArr">▾</i></div>' +
      '<div id="tvChatBox"><div id="tvMsgs"></div><div class="tvIn"><input id="tvTxt" maxlength="200" placeholder="Xabar yozing..."><button id="tvSend">➤</button></div></div></div>' +
    '<div class="tvSec"><div class="tvSh">🔴 Live o‘yinlar <span id="tvLiveN"></span></div><div id="tvLive" class="tvLive"></div></div>' +
    '<div class="tvSec"><div class="tvSh">🏅 Jadval</div><div id="tvTable"></div></div>' +
  '</div>' +
  '<div class="tvFoot" id="tvFoot"></div>';

  var st = document.createElement('style'); st.id = 'tvCss'; st.textContent = CSS; document.head.appendChild(st);

  var P = null, curId = null, chatOpen = true, lastMain = '', lastChat = '', timer = null;

  function build(){
    if (P) return;
    P = document.createElement('div'); P.id = 'tvP'; P.innerHTML = HTML; document.body.appendChild(P);
    g('tvBack').onclick = close;
    g('tvRef').onclick = function(){ lastMain = ''; lastChat = ''; render(); };
    g('tvChatH').onclick = function(){ chatOpen = !chatOpen; g('tvChatBox').style.display = chatOpen ? '' : 'none'; g('tvChatArr').textContent = chatOpen ? '▾' : '▸'; };
    g('tvSend').onclick = sendChat;
    g('tvTxt').onkeydown = function(e){ if (e.key === 'Enter') sendChat(); };
    P.addEventListener('dblclick', function(e){ var x = e.target.closest('.tvM[data-mid]'); if (x) send({ type: 'lbTChatLike', tid: curId, mid: x.getAttribute('data-mid') }); }); /*TVDBL*/
    P.addEventListener('click', function(e){
      var b = e.target.closest('[data-tv]'); if (!b) return;
      var a = b.getAttribute('data-tv');
      if (a === 'join') send({ type: 'lbTJoin', tid: curId });
      else if (a === 'leave') { if (confirm('Turnirdan chiqasizmi?')) send({ type: 'lbTLeave', tid: curId }); }
      else if (a === 'start') send({ type: 'lbTStart', tid: curId });
      else if (a === 'like') send({ type: 'lbTChatLike', tid: curId, mid: b.getAttribute('data-mid') }); /*TVLKC*/
      else if (a === 'watch') { var r = b.getAttribute('data-room'), l = L(); close(); if (l && l.go) l.go(r); }
    });
  }

  function sendChat(){
    var v = g('tvTxt').value.trim(); if (!v || !curId) return;
    send({ type: 'lbTChat', tid: curId, text: v });
    g('tvTxt').value = '';
  }

  function render(){
    if (!P || !curId) return;
    var t = findT(curId);
    if (!t) { g('tvSub').textContent = 'Turnir topilmadi yoki bekor qilingan'; return; }
    var now = Date.now(), ar = t.type === 'arena';
    g('tvSub').textContent =
      t.status === 'reg' ? (t.startAt ? '⏳ Boshlanishiga ' + fmt(t.startAt - now) : '📝 Ro‘yxat ochiq') :
      t.status === 'running' ? (ar ? (t.ending ? '⌛ Yakunlanmoqda' : '🔥 Tugashiga ' + fmt(t.endAt - now)) : '♟ Tur ' + t.round + '/' + t.rounds + (t.nextAt ? ' · keyingisi ' + fmt(t.nextAt - now) : '')) :
      '🏁 Turnir tugagan';
    var sig = JSON.stringify([t.status, t.players, t.boards, t.name, t.ending, meUid()]);
    if (sig !== lastMain) { lastMain = sig; renderMain(t); }
    var cs = JSON.stringify(t.chat || []);
    if (cs !== lastChat) { lastChat = cs; renderChat(t); }
  }

  function renderMain(t){
    var ar = t.type === 'arena';
    g('tvName').textContent = (ar ? '⚔️ ' : t.type === 'olympic' ? '🏆 ' : '♟ ') + t.name;
    var ch = ['🎯 ' + (ar ? 'Arena' : t.type === 'olympic' ? 'Olimpiya' : 'Shveytsar'), '⏱ ' + t.tc, '👥 ' + (t.players || []).length];
    if (t.prize) ch.push('🪙 ' + t.prize + (t.places ? ' (' + t.places + ' o‘ringa)' : ''));
    if (ar && t.berserk) ch.push('⚡ Berserk');
    if (t.startAt && t.status === 'reg') ch.push('🕐 ' + hm(t.startAt));
    if (t.creatorName) ch.push('👤 ' + t.creatorName);
    g('tvInfo').innerHTML = ch.map(function(x){ return '<span class="tvChip">' + esc(x) + '</span>'; }).join('');

    var live = (t.boards || []).filter(function(b){ return !b.done; });
    g('tvLiveN').textContent = live.length ? '(' + live.length + ')' : '';
    g('tvLive').innerHTML = live.length ? live.map(function(b){
      return '<div class="tvG"><span class="lv">● LIVE</span><div class="n">⚪ ' + esc(b.whiteName) + '</div><div class="n">⚫ ' + esc(b.blackName) + '</div><button data-tv="watch" data-room="' + esc(b.roomId) + '">👁 Tomosha</button></div>';
    }).join('') : '<div class="tvEmpty">' + (t.status === 'running' ? 'Hozir jonli o‘yin yo‘q, juftlash kutilmoqda…' : 'O‘yinlar turnir boshlangach shu yerda chiqadi') + '</div>';

    var me = meUid(), M = ['🥇', '🥈', '🥉'], ps = t.players || [];
    var h = '<table class="tvTb"><tr><th>#</th><th>O‘yinchi</th><th class="r">O‘yin</th><th class="r">Ochko</th></tr>';
    ps.slice(0, 100).forEach(function(p, i){
      h += '<tr class="' + (String(p.uid) === me ? 'me' : '') + '"><td>' + (t.status === 'finished' && M[i] ? M[i] : (i + 1) + '.') /*TVRANK*/ + '</td><td>' + esc(p.name) + (p.fire ? ' 🔥' : '') + (p.busy ? ' 🎮' : '') + (p.withdrawn ? ' ⏸' : '') + '</td><td class="r">' + (p.games || 0) + '</td><td class="r sc">' + (p.score || 0) + '</td></tr>';
    });
    g('tvTable').innerHTML = ps.length ? h + '</table>' : '<div class="tvEmpty">Hali ishtirokchi yo‘q</div>';

    var f = '';
    if (t.status === 'finished') f = '<button class="tvD" disabled>🏁 Turnir tugagan</button>';
    else {
      if (t.status === 'reg' && String(t.creatorUid) === me) f += '<button class="tvS" data-tv="start">▶ Boshlash</button>';
      f += joined(t) ? '<button class="tvL" data-tv="leave">🚪 Chiqish</button>' : '<button class="tvJ" data-tv="join">✅ Qo‘shilish</button>';
    }
    g('tvFoot').innerHTML = f;
  }

  function renderChat(t){
    var c = t.chat || [], me = meUid(), box = g('tvMsgs');
    g('tvChatN').textContent = c.length ? '(' + c.length + ')' : '';
    var atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = c.length ? c.map(function(m){
      var mine = String(m.uid) === me;
      var lk = (m.likes || []).map(String), liked = lk.indexOf(me) >= 0; /*TVLKR*/
      return '<div class="tvM' + (mine ? ' me' : '') + '"' + (m.id ? ' data-mid="' + esc(m.id) + '"' : '') + '><b>' + (mine ? 'Siz' : esc(m.name)) + (String(m.uid) === String(t.creatorUid) ? ' 👑' : '') + '</b>' + esc(m.text) + '<small>' + (m.id ? '<span class="tvLk" data-tv="like" data-mid="' + esc(m.id) + '">' + (liked ? '❤️' : '🤍') + (lk.length ? ' ' + lk.length : '') + '</span>' : '<span></span>') + '<span>' + hm(m.at) + '</span></small></div>';
    }).join('') : '<div class="tvEmpty">Hali xabar yo‘q. Birinchi bo‘lib yozing!</div>';
    if (atBottom || !box.__init) { box.scrollTop = box.scrollHeight; box.__init = 1; }
  }

  function open(id){
    build(); curId = String(id); lastMain = ''; lastChat = ''; g('tvMsgs').__init = 0;
    P.classList.add('on'); render();
    if (timer) clearInterval(timer); timer = setInterval(render, 1000);
  }
  function close(){
    if (P) P.classList.remove('on'); curId = null;
    if (timer) { clearInterval(timer); timer = null; }
  }
  window.tvOpen = open; window.tvClose = close;

  var pend = false;
  function decorate(){
    pend = false;
    var box = g('lbTs'); if (!box) return;
    var links = box.querySelectorAll('[data-a="tlink"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], id = a.getAttribute('data-id'), card = a.closest('.card');
      if (!card || card.querySelector('.tvRow')) continue;
      var t = findT(id); if (!t) continue;
      var old = card.querySelectorAll('[data-a="tj"],[data-a="tl"]');
      for (var k = 0; k < old.length; k++) old[k].parentNode.removeChild(old[k]);
      var row = document.createElement('div'); row.className = 'tvRow';
      row.innerHTML = (t.status === 'finished' ? '' : (joined(t)
        ? '<button class="tvCL" data-a="tl" data-id="' + esc(id) + '">🚪 Chiqish</button>'
        : '<button class="tvCJ" data-a="tj" data-id="' + esc(id) + '">✅ Qo‘shilish</button>')) +
        '<button class="tvCE" data-tvopen="1">🏟 Kirish ›</button>';
      card.appendChild(row);
      card.style.cursor = 'pointer';
      (function(tid){
        card.addEventListener('click', function(e){
          if (e.target.closest('[data-tvopen]')) return open(tid);
          if (e.target.closest('button,a,input,select,summary,label')) return;
          open(tid);
        });
      })(id);
    }
  }
  new MutationObserver(function(){ if (!pend) { pend = true; requestAnimationFrame(decorate); } })
    .observe(document.body, { childList: true, subtree: true });
})();
;(function(){
  if (document.getElementById('tvBlue')) return;
  var css =
  "#tvP{color:#eaf2ff!important;background:radial-gradient(circle at 15% 8%,rgba(80,150,255,.22),transparent 40%),radial-gradient(circle at 90% 85%,rgba(40,110,220,.2),transparent 45%),linear-gradient(160deg,#06183a,#0b2a5c 45%,#040f26)!important}" +
  ".tvHead{background:rgba(3,14,36,.92)!important;border-bottom-color:rgba(90,150,255,.3)!important}" +
  ".tvIc{background:rgba(8,30,70,.9)!important;color:#e3eeff!important;border-color:rgba(80,140,240,.5)!important}" +
  ".tvTit small,.tvSh span,.tvSh i,.tvEmpty,.tvTb th{color:#9cc2ff!important}" +
  ".tvChip{background:rgba(20,60,130,.6)!important;border-color:rgba(90,150,255,.35)!important}" +
  ".tvSec{background:linear-gradient(180deg,rgba(11,42,92,.92),rgba(6,24,58,.95))!important;border-color:rgba(90,150,255,.35)!important}" +
  ".tvM{background:rgba(4,18,46,.85)!important;border-color:rgba(80,140,240,.3)!important}" +
  ".tvM.me{background:linear-gradient(180deg,#2f7bf0,#1d57c4)!important;border-color:#6aa6ff!important}" +
  ".tvIn input{background:rgba(4,18,46,.85)!important;color:#eaf2ff!important;border-color:rgba(80,140,240,.5)!important}" +
  ".tvIn button,.tvJ{background:linear-gradient(180deg,#4d95ff,#2563d9)!important}" +
  ".tvJ{box-shadow:0 4px 16px rgba(47,123,240,.45)!important}" +
  ".tvG{background:rgba(4,18,46,.85)!important;border-color:rgba(80,140,240,.4)!important}" +
  ".tvG button{background:rgba(47,123,240,.25)!important;color:#cfe1ff!important;border-color:rgba(106,166,255,.55)!important}" +
  ".tvTb th{border-bottom-color:rgba(90,150,255,.3)!important}" +
  ".tvTb td{border-bottom-color:rgba(90,150,255,.12)!important}" +
  ".tvTb tr.me td{background:rgba(106,166,255,.16)!important}" +
  ".tvFoot{background:linear-gradient(180deg,transparent,rgba(3,12,32,.96) 35%)!important}";
  var s = document.createElement('style'); s.id = 'tvBlue'; s.textContent = css; document.head.appendChild(s);
})();

;(function(){ if (document.getElementById('tvLikeCss')) return; var s = document.createElement('style'); s.id = 'tvLikeCss'; s.textContent = '.tvM small{display:flex!important;justify-content:space-between;align-items:center;gap:10px;margin-top:2px}.tvLk{cursor:pointer;font-size:13px;opacity:1;padding:2px 6px;border-radius:10px;background:rgba(255,255,255,.08);user-select:none}.tvM.me b{color:#dbe9ff!important}'; document.head.appendChild(s); })();

;(function(){
  if (window.__tvRem) return; window.__tvRem = 1;
  function S(){ try { return window.__lb ? window.__lb.S : null; } catch(e){ return null; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(x){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]; }); }
  function me(){ var s = S(); return s && s.me ? String(s.me.uid) : ''; }
  function isIn(t){ var u = me(); return (t.players || []).some(function(p){ return String(p.uid) === u && !p.withdrawn; }); }
  function find(id){ var s = S(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
  function fmt(ms){ ms = Math.max(0, ms); var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function hm(ts){ var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  var css =
  "#tvRem{position:fixed;left:10px;right:10px;top:10px;z-index:2147482500;background:linear-gradient(180deg,#0e3170,#081d47);border:1px solid rgba(255,215,106,.6);border-radius:18px;padding:12px 14px;color:#eaf2ff;box-shadow:0 10px 30px rgba(0,0,0,.5);transform:translateY(-150%);transition:transform .35s ease}" +
  "#tvRem.on{transform:translateY(0)}" +
  "#tvRem .rT{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#ffd76a;font-weight:800}" +
  "#tvRem .rX{background:none!important;border:0!important;color:#9cc2ff!important;font-size:16px;min-height:0!important;padding:0 4px!important}" +
  "#tvRem .rN{font-size:17px;font-weight:800;margin:4px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  "#tvRem .rI{font-size:13px;color:#9cc2ff}" +
  "#tvRem .rB{display:flex;gap:8px;margin-top:10px}" +
  "#tvRem .rB button{flex:1;min-height:42px!important;border-radius:12px!important;font-weight:800;border:0!important}" +
  "#tvRem .rJ{background:linear-gradient(180deg,#4d95ff,#2563d9)!important;color:#fff!important}" +
  "#tvRem .rL{background:rgba(255,255,255,.1)!important;color:#dbe9ff!important}";
  var st = document.createElement('style'); st.id = 'tvRemCss'; st.textContent = css; document.head.appendChild(st);

  var shown = {}, box = null, cur = null, hideT = null;
  function hide(){ if (box) box.classList.remove('on'); cur = null; clearTimeout(hideT); }
  function show(t, stage){
    if (!box) {
      box = document.createElement('div'); box.id = 'tvRem'; document.body.appendChild(box);
      box.addEventListener('click', function(e){
        var b = e.target.closest('[data-r]'); if (!b || !cur) return;
        var a = b.getAttribute('data-r'), id = cur.id;
        if (a === 'join') { if (window.__lb) window.__lb.send({ type: 'lbTJoin', tid: id }); hide(); setTimeout(function(){ if (window.tvOpen) window.tvOpen(id); }, 600); }
        else if (a === 'open') { hide(); if (window.tvOpen) window.tvOpen(id); }
        else hide();
      });
    }
    cur = { id: t.id, stage: stage };
    var joined = isIn(t);
    box.innerHTML =
      '<div class="rT">' + (stage === 'm15' ? '⏰ 15 daqiqadan keyin boshlanadi!' : '🏆 Yaqinda turnir') + '<button class="rX" data-r="x">✕</button></div>' +
      '<div class="rN">' + (t.type === 'arena' ? '⚔️ ' : '🏆 ') + esc(t.name) + '</div>' +
      '<div class="rI">🕐 ' + hm(t.startAt) + ' · ⏳ <span id="tvRemL">' + fmt(t.startAt - Date.now()) + '</span> · ⏱ ' + esc(t.tc) + (t.prize ? ' · 🪙 ' + t.prize : '') + ' · 👥 ' + (t.players || []).length + '</div>' +
      '<div class="rB">' + (joined
        ? '<button class="rJ" data-r="open">🏟 Turnirga kirish</button><button class="rL" data-r="x">OK</button>'
        : '<button class="rJ" data-r="join">✅ Qo‘shilish</button><button class="rL" data-r="later">Keyinroq</button>') + '</div>';
    requestAnimationFrame(function(){ box.classList.add('on'); });
    clearTimeout(hideT); hideT = setTimeout(hide, 20000);
  }
  function tick(){
    var s = S(); if (!s || !s.tournaments || !s.me) return;
    if (cur) { var lt = document.getElementById('tvRemL'), ct = find(cur.id); if (lt && ct) lt.textContent = fmt(ct.startAt - Date.now()); return; }
    if (/room|xona/i.test(location.search + location.hash)) return;
    var tvp = document.getElementById('tvP'); if (tvp && tvp.classList.contains('on')) return;
    var now = Date.now();
    var list = s.tournaments.filter(function(t){ return t.status === 'reg' && t.startAt && t.startAt > now; })
      .sort(function(a, b){ return a.startAt - b.startAt; });
    for (var i = 0; i < list.length; i++) {
      var t = list[i], left = t.startAt - now;
      if (left <= 15 * 60000) {
        var k = 'tvRem15_' + t.id;
        if (!shown[k] && !ls(k)) { shown[k] = 1; ls(k, '1'); show(t, 'm15'); return; }
      } else if (!isIn(t)) {
        var k2 = 'enter_' + t.id;
        if (!shown[k2]) { shown[k2] = 1; show(t, 'enter'); return; }
      }
    }
  }
  setInterval(tick, 2000);
})();
;(function(){
  if (window.__tvLink) return; window.__tvLink = 1;
  var st = document.createElement('style'); st.id = 'tvLinkCss';
  st.textContent = '#tvP{z-index:2147483000!important}#tvRem{z-index:2147483100!important}';
  document.head.appendChild(st);

  var sp = window.__tvLinkTid ? 'lbt_' + window.__tvLinkTid : '';
  try { if (!sp) sp = (Telegram.WebApp.initDataUnsafe || {}).start_param || ''; } catch(e){}
  try { if (!sp) sp = new URLSearchParams(Telegram.WebApp.initData || '').get('start_param') || ''; } catch(e){}
  try { if (!sp) sp = new URLSearchParams((location.hash || '').slice(1)).get('tgWebAppStartParam') || ''; } catch(e){}
  try { if (!sp) { var q = new URLSearchParams(location.search); sp = q.get('tgWebAppStartParam') || (q.get('t') ? 'lbt_' + q.get('t') : ''); } } catch(e){}
  if (!/^lbt_/.test(sp)) return;
  var tid = sp.slice(4);

  function findT(){ try { var s = window.__lb && window.__lb.S; if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === tid) return s.tournaments[i]; } catch(e){} return null; }
  var fromLink = false, n = 0;
  var iv = setInterval(function(){
    n++;
    if (findT() && window.tvOpen) {
      clearInterval(iv);
      fromLink = true; window.tvOpen(tid);
      var p = document.getElementById('tvP');
      if (p) new MutationObserver(function(){
        if (fromLink && !p.classList.contains('on')) { fromLink = false; if (window.lbNav) window.lbNav.open('t'); }
      }).observe(p, { attributes: true, attributeFilter: ['class'] });
    } else if (n > 60) clearInterval(iv);
  }, 500);
})();
;(function(){
  if (window.__tvNavFix) return; window.__tvNavFix = 1;
  var n = 0, iv = setInterval(function(){
    if (window.lbNav && window.lbNav.open && !window.lbNav.__tvw) {
      var o = window.lbNav.open;
      window.lbNav.open = function(tab){
        window.nvK = tab;
        var r = o.apply(this, arguments);
        var h = document.getElementById('hzHero'), b = document.getElementById('nvPlayBtn');
        if (tab !== 'pl') { if (h) h.style.display = 'none'; if (b) b.style.display = 'none'; }
        return r;
      };
      window.lbNav.__tvw = 1; clearInterval(iv);
    } else if (++n > 100) clearInterval(iv);
  }, 100);
})();
;(function(){
  if (window.__tvClubBtn) return; window.__tvClubBtn = 1;
  var s = document.createElement('style');
  s.textContent = '#lbClubBn{display:none!important}#tvClubBtn.on{box-shadow:inset 0 0 0 2px #ffd76a!important}';
  document.head.appendChild(s);
  function upd(){ var b = document.getElementById('tvClubBtn'); if (b) b.classList.toggle('on', !!window.__lbCO); }
  var pend = false;
  function add(){
    pend = false;
    var bar = document.getElementById('lbTbar'); if (!bar) return;
    if (!document.getElementById('tvClubBtn')) {
      var btns = bar.querySelectorAll('button'), ref = btns[btns.length - 1];
      var b = document.createElement('button'); b.id = 'tvClubBtn'; b.type = 'button'; b.title = 'Klublar';
      if (ref) { b.className = ref.className; b.style.cssText = ref.style.cssText; }
      b.textContent = '👥';
      b.onclick = function(e){
        e.stopPropagation();
        window.__lbCO = !window.__lbCO;
        if (window.lbClubFix) window.lbClubFix();
        upd();
        if (window.__lbCO) setTimeout(function(){
          var all = document.querySelectorAll('.lbcl');
          for (var i = 0; i < all.length; i++) if (all[i].offsetParent) { all[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
        }, 120);
      };
      if (ref && ref.parentNode) ref.parentNode.insertBefore(b, ref); else bar.appendChild(b);
    }
    upd();
  }
  new MutationObserver(function(){ if (!pend) { pend = true; requestAnimationFrame(add); } })
    .observe(document.body, { childList: true, subtree: true });
})();
