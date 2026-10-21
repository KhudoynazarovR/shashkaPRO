/* 🧩 Masala turniri ekranlari. Server: pztour.js. Qoidalar: rushview.js (window.spPzRules). */
;(function () {
  if (window.spPzt) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var R = function () { return window.spPzRules; };
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mmss(ms) { var x = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(x / 3600), m = Math.floor(x % 3600 / 60), s = x % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function sec(ms) { var s = ms / 1000, m = Math.floor(s / 60); return (m ? m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60).toFixed(1) : (s).toFixed(1) + ' s'); }
  function haptic(k) { try { if (k === 'ok') tg.HapticFeedback.notificationOccurred('success'); else if (k === 'bad') tg.HapticFeedback.notificationOccurred('error'); else tg.HapticFeedback.impactOccurred('light'); } catch (e) {} }
  function hm(ts) { var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  var CSS =
    '#spPzt{position:fixed;inset:0;z-index:2147482600;overflow-y:auto;color:#fff;font-family:Roboto,system-ui,sans-serif;background:radial-gradient(circle at 50% 0,#0f6a5a 0,#063b33 45%,#021a17 100%);padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 24px);box-sizing:border-box;-webkit-tap-highlight-color:transparent}' +
    '#spPzt button{font-family:inherit;cursor:pointer}' +
    '.ptTop{display:flex;align-items:center;gap:8px;margin-bottom:12px}.ptX{width:44px;height:44px;border:0;border-radius:12px;background:rgba(0,0,0,.35);color:#fff;font-size:20px;flex:none}.ptT{flex:1;min-width:0;font-size:21px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ptCard{background:rgba(0,0,0,.3);border-radius:18px;padding:14px;margin-bottom:12px}.ptCard h3{margin:0 0 8px;font-size:18px}' +
    '.ptGo{display:block;width:100%;min-height:56px;border:0;border-radius:18px;background:linear-gradient(180deg,#5ee0b0,#18a77a);color:#fff;font-size:20px;font-weight:900;box-shadow:0 5px 0 #0b5f45;margin:4px 0 12px}.ptGo:active{transform:translateY(3px);box-shadow:0 2px 0 #0b5f45}.ptGo[disabled]{opacity:.5}' +
    '.ptSec{display:block;width:100%;margin-top:8px;border:0;border-radius:14px;padding:12px;background:rgba(0,0,0,.35);color:#d9fff1;font-size:16px;font-weight:700}' +
    '.ptRed{background:#b33430!important;color:#fff!important}' +
    '.ptT1{display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.3);border-radius:16px;padding:12px;margin-bottom:10px;width:100%;border:0;color:#fff;text-align:left}' +
    '.ptT1 .tx{flex:1;min-width:0}.ptT1 b{display:block;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptT1 small{display:block;font-size:14px;color:#c5f3e2;margin-top:3px}' +
    '.ptBadge{flex:none;font-size:12px;font-weight:800;border-radius:8px;padding:4px 8px;background:#1d5c4c;color:#9ff0cf}.ptBadge.run{background:#b33430;color:#fff}.ptBadge.fin{background:#2f3a45;color:#c9d1d9}' +
    '.ptField{margin:10px 0}.ptField>label{display:block;font-size:14px;font-weight:700;color:#c5f3e2;margin-bottom:6px}' +
    '.ptField input[type=text]{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #1f7a63;background:#04241f;color:#fff;font-size:16px}' +
    '.ptChips{display:flex;flex-wrap:wrap;gap:6px}.ptChips button{border:0;border-radius:10px;padding:9px 12px;background:rgba(255,255,255,.1);color:#fff;font-size:15px;font-weight:700}.ptChips button.on{background:#5ee0b0;color:#03251d}' +
    '.ptFold{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.07);margin-bottom:6px;width:100%;border:0;color:#fff;text-align:left;font-size:16px}.ptFold i{font-style:normal;width:26px;height:26px;border-radius:8px;border:2px solid #9ff0cf;display:flex;align-items:center;justify-content:center;flex:none}.ptFold.on i{background:#5ee0b0;color:#03251d}.ptFold span{flex:1}.ptFold small{color:#c5f3e2}' +
    '.ptTb{width:100%;border-collapse:collapse;font-size:15px}.ptTb th{font-size:11px;color:#9fe3c9;text-transform:uppercase;text-align:left;padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.15)}.ptTb td{padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.07)}.ptTb .r{text-align:right;font-variant-numeric:tabular-nums}.ptTb tr.me td{background:rgba(94,224,176,.15)}' +
    '.ptHud{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}.ptBox{background:rgba(0,0,0,.32);border-radius:14px;padding:7px 6px;text-align:center}.ptBox small{display:block;font-size:11px;font-weight:700;color:#9fe3c9}.ptBox b{display:block;font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}.ptBox.low b{color:#ffcf3f}.ptBox.crit b{color:#ff6b6b}' +
    '.ptBar{height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:10px}.ptBar i{display:block;height:100%;background:#5ee0b0}' +
    '#ptB{width:min(94vw,460px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #5a3415;border-radius:8px;overflow:hidden;touch-action:manipulation;user-select:none;-webkit-user-select:none}' +
    '#ptB.ok{box-shadow:0 0 0 4px #55e07a}#ptB.bad{box-shadow:0 0 0 4px #ff4d4d;animation:ptSh .35s}@keyframes ptSh{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '#ptB>div{position:relative;display:flex;align-items:center;justify-content:center}#ptB .l{background:#f0d9b5}#ptB .d{background:#b58863}#ptB .d.sel{box-shadow:inset 0 0 0 4px #f5d92b}#ptB .d.lm{background:#c9a23f}#ptB .dot{position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(40,200,120,.85)}' +
    '#ptB .pc{width:82%;height:82%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f5b72b;box-shadow:0 2px 3px rgba(0,0,0,.45)}#ptB .pw{background:radial-gradient(circle at 35% 28%,#fff,#c9c9c9);border:2px solid #9a9a9a}#ptB .pb{background:radial-gradient(circle at 35% 28%,#666,#111);border:2px solid #000}' +
    '.ptMsg{min-height:26px;text-align:center;font-size:17px;font-weight:800;margin:10px 0 4px}' +
    '.ptCd{text-align:center;padding:12px 0}.ptCd small{display:block;font-size:14px;color:#c5f3e2}.ptCd b{display:block;font-size:54px;font-weight:900;font-variant-numeric:tabular-nums}' +
    '.ptCalc{margin-top:10px;padding:10px;border-radius:14px;background:rgba(255,207,63,.08);border:1px solid rgba(255,207,63,.35)}.ptCalcH{font-weight:800;margin-bottom:8px;color:#ffe08a}.ptCalcG{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}.ptCalcG>div{background:rgba(0,0,0,.3);border-radius:10px;padding:6px 8px;display:flex;flex-direction:column}.ptCalcG span{font-size:13px;color:#c5f3e2}.ptCalcG b{font-size:17px;color:#ffcf3f}.ptCalcG small{font-size:11px;opacity:.6}.ptCalcN{font-size:12px;color:#c5f3e2;margin-top:8px;line-height:1.4}' +
    '.ptShare{display:flex;gap:8px;margin:0 0 12px}.ptShare button{flex:1;border:0;border-radius:14px;padding:12px 8px;background:rgba(255,255,255,.12);color:#fff;font-size:15px;font-weight:800}' +
    '.ptChatB{position:relative}.ptChatB i{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#e04a4a;color:#fff;font-size:11px;font-style:normal;font-weight:800;line-height:18px;padding:0 4px;box-sizing:border-box}' +
    '#ptSheet{position:fixed;left:0;right:0;bottom:0;height:70%;z-index:5;display:none;flex-direction:column;background:#06322a;border-radius:20px 20px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.5);padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px));box-sizing:border-box}' +
    '.ptShH{display:flex;align-items:center;margin-bottom:8px}.ptShH b{flex:1;font-size:18px}.ptShH button{border:0;background:none;color:#c5f3e2;font-size:22px}' +
    '#ptMsgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;min-height:0}' +
    '.ptM{max-width:82%;align-self:flex-start;background:rgba(0,0,0,.35);border-radius:14px 14px 14px 4px;padding:6px 10px;font-size:15px;word-wrap:break-word}.ptM.me{align-self:flex-end;background:#18a77a;border-radius:14px 14px 4px 14px}.ptM b{display:block;font-size:12px;color:#ffe08a}.ptM small{display:block;text-align:right;font-size:10px;opacity:.6}' +
    '.ptQuick{display:flex;gap:6px;overflow-x:auto;padding:8px 0 2px}.ptQuick button{flex:none;border:0;border-radius:999px;padding:7px 12px;background:rgba(255,255,255,.12);color:#fff;font-size:14px}' +
    '.ptIn{display:flex;gap:8px;margin-top:8px}.ptIn input{flex:1;min-width:0;padding:11px 12px;border-radius:14px;border:1px solid #1f7a63;background:#04241f;color:#fff;font-size:16px;outline:none}.ptIn button{width:48px;border:0;border-radius:14px;background:#18a77a;color:#fff;font-size:18px}' +
    '.ptPd{margin-bottom:12px}.ptPod{display:flex;align-items:flex-end;gap:8px;padding-top:6px}.ptPod>div{flex:1;min-width:0;text-align:center}.ptPod .st{border-radius:10px 10px 0 0;color:#1a1205;font-weight:900;font-size:24px;padding-top:6px}.ptPod .nm{font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptPod .sc{font-size:13px;color:#c5f3e2}';

  // mukofot taqsimoti (serverdagi bilan bir xil)
  var PZT = { 1: [100], 2: [60, 40], 3: [50, 30, 20], 4: [40, 28, 20, 12], 5: [35, 25, 18, 13, 9], 6: [30, 22, 17, 13, 10, 8], 7: [28, 20, 15, 12, 10, 8, 7], 8: [26, 19, 15, 12, 10, 8, 5, 5], 9: [24, 18, 14, 11, 10, 8, 6, 5, 4], 10: [22, 17, 13, 11, 9, 8, 7, 5, 4, 4] };
  function calc(prize, places, n) { var k = Math.min(places, n || places); return (PZT[k] || []).map(function (pc) { return Math.floor(prize * pc / 100); }); }
  function calcHtml(prize, places, players) {
    if (!prize) return '';
    var M = ['🥇', '🥈', '🥉'], a = calc(prize, places), h = '<div class="ptCalc"><div class="ptCalcH">🧮 Mukofot taqsimoti</div><div class="ptCalcG">';
    a.forEach(function (x, i) { h += '<div><span>' + (M[i] || (i + 1) + '-o‘rin') + '</span><b>' + x + ' 🪙</b><small>' + PZT[a.length][i] + '%</small></div>'; });
    h += '</div>';
    if (players && players < places) { var b = calc(prize, places, players); h += '<div class="ptCalcN">Hozir ' + players + ' ishtirokchi bor: shu holatda ' + b.map(function (x, i) { return (i + 1) + '-o‘rin ' + x; }).join(', ') + ' 🪙</div>'; }
    else h += '<div class="ptCalcN">Kamida 1 ta masala yechganlar o‘rin oladi. Qatnashchilar ' + places + ' tadan kam bo‘lsa, fond ular orasida qayta taqsimlanadi.</div>';
    return h + '</div>';
  }
  var ov = null, view = 'list', L = null, curId = null, st = null, pollT = null, tickT = null, form = null, opts = {};
  function css() { if (!document.getElementById('ptCss')) { var s = document.createElement('style'); s.id = 'ptCss'; s.textContent = CSS; document.head.appendChild(s); } }
  function stop() { if (pollT) clearInterval(pollT); if (tickT) clearInterval(tickT); pollT = tickT = null; }
  function close() { stop(); if (ov) ov.remove(); ov = null; }
  function top(t, x) { return '<div class="ptTop"><button class="ptX" id="ptX">' + (x || '‹') + '</button><div class="ptT">' + t + '</div>' + (view === 't' ? '<button class="ptX ptChatB" id="ptChatB" aria-label="Chat">💬<i id="ptChatN"></i></button>' : '') + '</div>'; }
  // ---------- chat
  var chatOpen = false;
  function seenKey() { return 'ptSeen_' + curId; }
  function getSeen() { try { return Number(localStorage.getItem(seenKey()) || 0); } catch (e) { return 0; } }
  function setSeen(v) { try { localStorage.setItem(seenKey(), String(v)); } catch (e) {} }
  function chatBadge() {
    var n = 0, d = st && st.d, seen = getSeen(); if (!d || !d.chat) return;
    d.chat.forEach(function (m) { if (!m.me && m.at > seen) n++; });
    var e = ov && ov.querySelector('#ptChatN'); if (e) { e.textContent = n ? (n > 9 ? '9+' : n) : ''; e.style.display = n ? '' : 'none'; }
  }
  function chatHtml() {
    var c = (st.d && st.d.chat) || [];
    return c.length ? c.map(function (m) { return '<div class="ptM' + (m.me ? ' me' : '') + '"><b>' + (m.me ? 'Siz' : esc(m.name)) + (m.host ? ' 👑' : '') + '</b>' + esc(m.text) + '<small>' + hm(m.at) + '</small></div>'; }).join('') : '<div style="opacity:.75;padding:10px 2px">Hali xabar yo‘q. Birinchi bo‘lib yozing! 👋</div>';
  }
  function renderChat() {
    var sh = document.getElementById('ptSheet'); if (!sh || !chatOpen) return;
    var box = sh.querySelector('#ptMsgs'), atB = box.scrollHeight - box.scrollTop - box.clientHeight < 40, html = chatHtml();
    if (box.__h !== html) { box.__h = html; box.innerHTML = html; if (atB || !box.__i) { box.scrollTop = box.scrollHeight; box.__i = 1; } }
    var c = (st.d && st.d.chat) || []; if (c.length) setSeen(c[c.length - 1].at); chatBadge();
  }
  function openChat() {
    chatOpen = true;
    var sh = document.getElementById('ptSheet');
    if (!sh) {
      sh = document.createElement('div'); sh.id = 'ptSheet';
      sh.innerHTML = '<div class="ptShH"><b>💬 Turnir chati</b><button id="ptShX">✕</button></div><div id="ptMsgs"></div>' +
        '<div class="ptQuick">' + ['👍', '🔥', '😅', '🎉', 'Omad! 🍀', 'Zo‘r masala!'].map(function (q) { return '<button data-q="' + q + '">' + q + '</button>'; }).join('') + '</div>' +
        '<div class="ptIn"><input id="ptTxt" maxlength="200" placeholder="Xabar yozing…"><button id="ptSend">➤</button></div>';
      ov.appendChild(sh);
      var send = function (t) { t = String(t || '').trim(); if (!t) return; api('/api/pzt/chat', { id: curId, text: t }).then(function (d) { if (d && !d.error) { st.d.chat = d.chat; renderChat(); } }); };
      sh.querySelector('#ptShX').onclick = closeChat;
      sh.querySelector('#ptSend').onclick = function () { var i = sh.querySelector('#ptTxt'); send(i.value); i.value = ''; };
      sh.querySelector('#ptTxt').onkeydown = function (e) { if (e.key === 'Enter') { send(this.value); this.value = ''; } };
      Array.prototype.forEach.call(sh.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { send(b.getAttribute('data-q')); }; });
    }
    sh.style.display = 'flex'; sh.querySelector('#ptMsgs').__i = 0; sh.querySelector('#ptMsgs').__h = ''; renderChat();
  }
  function closeChat() { chatOpen = false; var sh = document.getElementById('ptSheet'); if (sh) sh.style.display = 'none'; chatBadge(); }
  function bindX(fn) { var b = ov.querySelector('#ptX'); if (b) b.onclick = fn; }

  // ================= RO'YXAT
  function list() {
    stop(); view = 'list'; curId = null;
    ov.innerHTML = top('🧩 Masala turnirlari') + '<div class="ptCard">Yuklanmoqda…</div>'; bindX(close);
    api('/api/pzt/list').then(function (d) { L = d; drawList(); }).catch(function () { ov.querySelector('.ptCard').textContent = 'Server bilan aloqa yo‘q'; });
    pollT = setInterval(function () { if (view === 'list') api('/api/pzt/list').then(function (d) { L = d; drawList(); }).catch(function () {}); }, 15000);
    tickT = setInterval(function () { Array.prototype.forEach.call(ov.querySelectorAll('[data-cd]'), function (e) { e.textContent = mmss(+e.getAttribute('data-cd') - Date.now()); }); }, 1000);
  }
  function drawList() {
    if (view !== 'list' || !L) return;
    var h = top('🧩 Masala turnirlari');
    h += '<button class="ptGo" id="ptNew">➕ Turnir yaratish</button>';
    if (L.admin && L.daily) h += '<div class="ptCard" style="font-size:15px">🔁 Har kuni ' + esc(L.daily.hm) + ' da: «' + esc(L.daily.name) + '» · ' + L.daily.count + ' ta · ' + (L.daily.on ? '<b style="color:#5ee0b0">yoqiq</b>' : '<b style="color:#ff9a7a">o‘chiq</b>') + '<button class="ptSec" id="ptDaily">' + (L.daily.on ? '⏸ Kunlik turnirni to‘xtatish' : '▶ Kunlik turnirni yoqish') + '</button></div>';
    var ts = L.tours || [];
    if (!ts.length) h += '<div class="ptCard">Hozircha turnir yo‘q. Birinchisini siz yarating! 🏆</div>';
    ts.forEach(function (t) {
      var badge = t.status === 'running' ? '<span class="ptBadge run">● Ketmoqda</span>' : t.status === 'finished' ? '<span class="ptBadge fin">Tugagan</span>' : '<span class="ptBadge">' + (t.joined ? '✅ Qo‘shildingiz' : 'Ro‘yxat ochiq') + '</span>';
      var when = t.status === 'reg' ? '⏳ <span data-cd="' + t.startAt + '">' + mmss(t.startAt - Date.now()) + '</span> · 🕐 ' + hm(t.startAt) : t.status === 'running' ? '🔥 tugashiga <span data-cd="' + t.endAt + '">' + mmss(t.endAt - Date.now()) + '</span>' : '🏁 ' + hm(t.endAt);
      h += '<button class="ptT1" data-id="' + esc(t.id) + '"><div class="tx"><b>' + (t.daily ? '🔁 ' : '🧩 ') + esc(t.name) + '</b><small>' + when + '</small><small>📚 ' + t.count + ' ta masala' + (t.per ? ' · ⏱ ' + t.per + ' s' : '') + ' · 👥 ' + t.players + (t.prize ? ' · 🪙 ' + t.prize : '') + '</small></div>' + badge + '</button>';
    });
    ov.innerHTML = h; bindX(close);
    ov.querySelector('#ptNew').onclick = createForm;
    var dl = ov.querySelector('#ptDaily'); if (dl) dl.onclick = function () { api('/api/pzt/daily', { on: !L.daily.on }).then(function () { list(); }); };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-id]'), function (b) { b.onclick = function () { openT(b.getAttribute('data-id')); }; });
  }

  // ================= YARATISH
  function createForm() {
    stop(); view = 'create';
    if (!L) return list();
    form = form || { name: '', folders: [], count: 10, per: 60, prize: 0, places: 3, startIn: 10, daily: false };
    drawForm();
  }
  function chips(key, vals, label) {
    return '<div class="ptChips">' + vals.map(function (v) { return '<button data-k="' + key + '" data-v="' + v + '" class="' + (form[key] === v ? 'on' : '') + '">' + label(v) + '</button>'; }).join('') + '</div>';
  }
  function drawForm() {
    var avail = (L.folders || []).filter(function (f) { return form.folders.indexOf(f.name) >= 0; }).reduce(function (s, f) { return s + f.n; }, 0);
    var cost = (L.fee || 0) + (L.admin ? 0 : form.prize);
    var h = top('➕ Masala turniri');
    h += '<div class="ptCard">';
    h += '<div class="ptField"><label>Turnir nomi</label><input type="text" id="ptName" maxlength="40" placeholder="Masalan: Kechki kubok" value="' + esc(form.name) + '"></div>';
    h += '<div class="ptField"><label>📁 Papkalar (bir nechtasini tanlash mumkin)</label>' + (L.folders || []).map(function (f) { var on = form.folders.indexOf(f.name) >= 0; return '<button class="ptFold' + (on ? ' on' : '') + '" data-f="' + esc(f.name) + '"><i>' + (on ? '✓' : '') + '</i><span>' + esc(f.title) + '</span><small>' + f.n + ' ta</small></button>'; }).join('') + '<div style="font-size:13px;color:#c5f3e2;margin-top:4px">Tanlangan: ' + avail + ' ta masala</div></div>';
    h += '<div class="ptField"><label>📚 Masalalar soni</label>' + chips('count', L.counts || [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], function (v) { return v; }) + '</div>';
    h += '<div class="ptField"><label>⏱ Har bir masalaga vaqt</label>' + chips('per', L.pers || [0, 30, 60, 120, 180, 300], function (v) { return v ? (v < 60 ? v + ' s' : v / 60 + ' daq') : 'Chegarasiz'; }) + '</div>';
    h += '<div class="ptField"><label>🕐 Boshlanishi</label>' + chips('startIn', [2, 5, 10, 15, 30, 60, 120], function (v) { return v < 60 ? v + ' daq' : v / 60 + ' soat'; }) + '</div>';
    h += '<div class="ptField"><label>🪙 Mukofot fondi' + (L.admin ? ' (admin: bepul)' : ' (o‘zingiz to‘laysiz)') + '</label>' + chips('prize', L.prizes || [0, 100, 200, 300, 500, 1000], function (v) { return v ? v : 'Yo‘q'; }) + '</div>';
    if (form.prize) h += '<div class="ptField"><label>🏅 Necha o‘ringa</label>' + chips('places', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function (v) { return v; }) + calcHtml(form.prize, form.places) + '</div>';
    if (L.admin) h += '<div class="ptField"><button class="ptFold' + (form.daily ? ' on' : '') + '" id="ptDailyChk"><i>' + (form.daily ? '✓' : '') + '</i><span>🔁 Har kuni shu vaqtda takrorlash</span></button></div>';
    h += '<div id="ptErr" style="color:#ffb3b3;min-height:20px;font-weight:700"></div>';
    h += '<button class="ptGo" id="ptCreate">✅ Yaratish' + (cost ? ' · ' + cost + ' 🪙' : '') + '</button>';
    h += '<div style="font-size:13px;color:#c5f3e2;text-align:center">' + (L.fee ? 'Yaratish narxi ' + L.fee + ' 🪙' + (form.prize ? ' + mukofot fondi ' + form.prize + ' 🪙' : '') + ' · balans: ' + (L.coins || 0) + ' 🪙' : '') + '</div></div>';
    ov.innerHTML = h; bindX(list);
    var nm = ov.querySelector('#ptName'); nm.oninput = function () { form.name = nm.value; };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { var f = b.getAttribute('data-f'), i = form.folders.indexOf(f); if (i >= 0) form.folders.splice(i, 1); else form.folders.push(f); drawForm(); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { form[b.getAttribute('data-k')] = Number(b.getAttribute('data-v')); drawForm(); }; });
    var dc = ov.querySelector('#ptDailyChk'); if (dc) dc.onclick = function () { form.daily = !form.daily; drawForm(); };
    ov.querySelector('#ptCreate').onclick = function () {
      var b = this; if (!form.folders.length) { ov.querySelector('#ptErr').textContent = 'Kamida bitta papka tanlang'; return; }
      b.disabled = true;
      api('/api/pzt/create', form).then(function (d) {
        if (!d || d.error) { b.disabled = false; ov.querySelector('#ptErr').textContent = (d && d.error) || 'Xatolik'; return; }
        if (d.cost && opts.onCoins) opts.onCoins(-d.cost);
        form = null; openT(d.id);
      }).catch(function () { b.disabled = false; ov.querySelector('#ptErr').textContent = 'Server bilan aloqa yo‘q'; });
    };
  }

  // ================= TURNIR SAHIFASI
  function openT(id) {
    stop(); view = 't'; curId = id; chatOpen = false; var oldSh = document.getElementById('ptSheet'); if (oldSh) oldSh.remove(); st = { busy: false, sel: null, msg: '', flash: '', pzk: -1, tab: 'live' };
    ov.innerHTML = top('🧩 Turnir') + '<div class="ptCard">Yuklanmoqda…</div>'; bindX(list);
    refresh();
    pollT = setInterval(function () { if (!st.busy) refresh(); }, 2000);
    tickT = setInterval(tick, 250);
  }
  function refresh() { if (view !== 't') return; api('/api/pzt/state', { id: curId }).then(onState).catch(function () {}); }
  function onState(d) {
    if (view !== 't' || !d) return;
    if (d.error) { ov.innerHTML = top('🧩 Turnir') + '<div class="ptCard">' + esc(d.error) + '</div>'; bindX(list); return; }
    var prevStatus = st.d && st.d.status, prevK = st.d && st.d.me && st.d.me.k;
    st.d = d; st.skew = d.now ? d.now - Date.now() : 0;
    if (d.pz && d.pz.k !== st.pzk) { st.pzk = d.pz.k; st.g = { b: R().copy(d.pz.board), side: d.pz.side, forced: null }; st.sel = null; st.lm = null;
      (d.steps || []).forEach(function (w) { var s = R().findStep(R().legal(st.g.b, st.g.side, st.g.forced), w); if (s) { st.g = R().adv(st.g, s); st.lm = w; } }); }
    var playing = d.status === 'running' && d.me && d.me.started && !d.me.done;
    if (!st.busy && (!playing || !ov.querySelector('#ptB') || prevStatus !== d.status || prevK !== (d.me && d.me.k))) draw(); else hud();
  }
  function now() { return Date.now() + (st.skew || 0); }
  function tick() {
    if (view !== 't' || !st.d) return;
    var d = st.d, e;
    if ((e = ov.querySelector('#ptStartCd'))) { var l = d.startAt - now(); e.textContent = mmss(l); if (l <= 0 && !st.reloading) { st.reloading = true; setTimeout(function () { st.reloading = false; refresh(); }, 900); } }
    if ((e = ov.querySelector('#ptEndCd'))) e.textContent = mmss(d.endAt - now());
    if ((e = ov.querySelector('#ptPer')) && d.deadline) { var lp = d.deadline - now(); e.textContent = mmss(lp); var bx = e.parentNode; bx.classList.toggle('low', lp <= 10000 && lp > 5000); bx.classList.toggle('crit', lp <= 5000); if (lp <= 0 && !st.busy && !st.burning) { st.burning = true; setTimeout(function () { st.burning = false; refresh(); }, 600); } }
    if ((e = ov.querySelector('#ptMyT')) && d.shownAt) e.textContent = sec((d.me ? d.me.time : 0) + Math.max(0, now() - d.shownAt));
  }
  function tableHtml(d, n) {
    var rows = (d.table || []).slice(0, n || 100);
    if (!rows.length) return '<div style="opacity:.8">Hali ishtirokchi yo‘q</div>';
    var M = ['🥇', '🥈', '🥉'];
    return '<table class="ptTb"><tr><th>#</th><th>O‘yinchi</th><th class="r">✅</th><th class="r">⚡</th><th class="r">Vaqt</th></tr>' + rows.map(function (x) {
      return '<tr class="' + (x.me ? 'me' : '') + '"><td>' + (d.status === 'finished' && M[x.place - 1] ? M[x.place - 1] : x.place) + '</td><td>' + esc(x.name) + (d.status === 'running' && !x.done ? ' <small style="opacity:.6">' + (x.k + 1) + '/' + d.count + '</small>' : '') + '</td><td class="r"><b>' + x.solved + '</b></td><td class="r">' + (x.firsts || '') + '</td><td class="r">' + sec(x.time) + '</td></tr>';
    }).join('') + '</table>';
  }
  function info(d) {
    return '<div style="font-size:15px;color:#c5f3e2;line-height:1.5">📚 ' + d.count + ' ta masala' + (d.per ? ' · ⏱ har biriga ' + (d.per < 60 ? d.per + ' s' : d.per / 60 + ' daq') : ' · ⏱ chegarasiz') + '<br>📁 ' + esc((d.folders || []).join(', ')) + '<br>👥 ' + d.players + ' ishtirokchi' + (d.prize ? ' · 🪙 ' + d.prize + ' (' + d.places + ' o‘ringa)' : '') + '<br>👤 ' + esc(d.creatorName || '') + '</div>';
  }
  function hud() { chatBadge(); if (chatOpen) renderChat(); var e = ov.querySelector('#ptHud'); if (e && st.d) e.outerHTML = hudHtml(st.d); var lb = ov.querySelector('#ptLive'); if (lb) lb.innerHTML = tableHtml(st.d, 5); }
  function hudHtml(d) {
    var me = d.me || {};
    return '<div id="ptHud"><div class="ptHud"><div class="ptBox"><small>MASALA</small><b>' + Math.min(me.k + 1, d.count) + '/' + d.count + '</b></div><div class="ptBox"><small>' + (d.per ? 'QOLDI' : 'VAQTINGIZ') + '</small><b id="' + (d.per ? 'ptPer' : 'ptMyT') + '">' + (d.per && d.deadline ? mmss(d.deadline - now()) : sec(me.time || 0)) + '</b></div><div class="ptBox"><small>OCHKO</small><b>' + (me.points || 0) + '</b></div></div>' +
      '<div class="ptBar"><i style="width:' + Math.round((me.k || 0) / d.count * 100) + '%"></i></div></div>';
  }
  function draw() {
    if (view !== 't' || !st.d) return;
    var d = st.d, h = top(esc(d.name));
    if (d.status === 'reg') {
      h += '<div class="ptCard ptCd"><small>Boshlanishiga</small><b id="ptStartCd">' + mmss(d.startAt - now()) + '</b><small>🕐 ' + hm(d.startAt) + '</small></div>';
      h += '<div class="ptCard">' + info(d) + calcHtml(d.prize, d.places, d.players) + '</div>';
      h += '<div class="ptShare"><button id="ptShareB">📤 Guruhga / do‘stga yuborish</button>' + (d.admin ? '<button id="ptAnn">📣 Bot e‘loni</button>' : '') + '</div>';
      h += d.joined ? '<button class="ptGo ptRed" id="ptLeave">✅ Qo‘shildingiz · chiqish</button>' : '<button class="ptGo" id="ptJoin">➕ Qo‘shilish</button>';
      if (d.mine) h += '<button class="ptSec" id="ptCancel">🗑 Turnirni bekor qilish</button>';
      h += '<div class="ptCard"><h3>👥 Ishtirokchilar</h3>' + tableHtml(d) + '</div>';
    } else if (d.status === 'running') {
      var me = d.me;
      if (!me) {
        h += '<div class="ptCard ptCd"><small>Tugashiga</small><b id="ptEndCd">' + mmss(d.endAt - now()) + '</b></div>';
        h += d.canJoin ? '<button class="ptGo" id="ptJoin">➕ Qo‘shilish va boshlash</button>' : '<div class="ptCard">Qo‘shilish vaqti o‘tdi — natijalarni kuzating</div>';
        h += '<div class="ptCard"><h3>🔴 Jonli jadval</h3>' + tableHtml(d) + '</div>';
      } else if (!me.started) {
        h += '<div class="ptCard ptCd"><small>Turnir boshlandi! Tugashiga</small><b id="ptEndCd">' + mmss(d.endAt - now()) + '</b></div><div class="ptCard">' + info(d) + '</div><button class="ptGo" id="ptStart">▶ Yechishni boshlash</button>';
        h += '<div class="ptCard"><h3>🔴 Jonli jadval</h3>' + tableHtml(d) + '</div>';
      } else if (me.done) {
        h += '<div class="ptCard ptCd"><small>Siz tugatdingiz! ✅ ' + me.solved + '/' + d.count + ' · ⏱ ' + sec(me.time) + '</small><b id="ptEndCd" style="font-size:36px">' + mmss(d.endAt - now()) + '</b><small>turnir tugashiga</small></div>';
        h += '<div class="ptCard"><h3>🔴 Jonli jadval</h3>' + tableHtml(d) + '</div>' + myRes(d);
      } else if (d.pz) {
        var p = d.pz, g = st.g, lg = st.sel ? R().legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === st.sel[0] && s.f[1] === st.sel[1]; }) : [];
        h += hudHtml(d);
        h += '<div style="text-align:center;font-weight:700;margin-bottom:8px">' + (p.side === 'w' ? '⚪ Oqlar yuradi' : '⚫ Qoralar yuradi') + ' · ' + ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'][p.level || 1] + '</div><div id="ptB" class="' + (st.flash || '') + '">';
        var flip = p.side === 'b';
        for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
          var r = flip ? 7 - i : i, c = flip ? 7 - j : j, dk = (r + c) % 2 === 1, pc = g.b[r][c], cls = dk ? 'd' : 'l';
          if (st.sel && st.sel[0] === r && st.sel[1] === c) cls += ' sel';
          if (st.lm && ((st.lm[0] === r && st.lm[1] === c) || (st.lm[2] === r && st.lm[3] === c))) cls += ' lm';
          var dot = lg.some(function (s) { return s.t[0] === r && s.t[1] === c; }) ? '<i class="dot"></i>' : '';
          h += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + dot + (pc ? '<div class="pc ' + (pc === 1 || pc === 3 ? 'pw' : 'pb') + '">' + (pc > 2 ? '♛' : '') + '</div>' : '') + '</div>';
        }
        h += '</div><div class="ptMsg">' + (st.msg || '') + '</div><button class="ptSec" id="ptSkip">⏭ O‘tkazib yuborish</button>';
        h += '<div class="ptCard" style="margin-top:12px"><h3>🔴 TOP-5</h3><div id="ptLive">' + tableHtml(d, 5) + '</div></div>';
      } else h += '<div class="ptCard">Masala yuklanmoqda…</div>';
    } else {
      h += finished(d);
    }
    var keep = document.getElementById('ptSheet');
    ov.innerHTML = h; podFit();
    var _sh = ov.querySelector('#ptShr'); if (_sh) _sh.onclick = function () { var m = (d.table || []).filter(function (x) { return x.me; })[0]; if (!m) return; var a = (d.awards || []).filter(function (z) { return z.place === m.place; })[0]; window.spShareCard({ theme: 'pzt', title: '🧩 ' + d.name, big: m.place <= 3 ? ['🥇', '🥈', '🥉'][m.place - 1] : m.place + '-o‘rin', unit: m.place <= 3 ? m.place + '-o‘rin · ' + (d.table || []).length + ' ishtirokchi' : (d.table || []).length + ' ishtirokchi', badge: a && a.amt ? '+' + a.amt + ' tanga' : '', sub: '✅ ' + m.solved + '/' + d.count + ' masala · ⏱ ' + sec(m.time), cap: '🧩 «' + d.name + '» masala turnirida ' + m.place + '-o‘rin oldim!' }); };
    bindX(function () { closeChat(); var k = document.getElementById('ptSheet'); if (k) k.remove(); list(); });
    if (keep) ov.appendChild(keep);
    var cb = ov.querySelector('#ptChatB'); if (cb) cb.onclick = openChat;
    chatBadge(); if (chatOpen) renderChat();
    var b;
    if ((b = ov.querySelector('#ptJoin'))) b.onclick = function () { api('/api/pzt/join', { id: curId }).then(function (x) { if (x.error) return alert(x.error); onState(x); if (x.status === 'running') api('/api/pzt/go', { id: curId }).then(onState); }); };
    if ((b = ov.querySelector('#ptLeave'))) b.onclick = function () { api('/api/pzt/leave', { id: curId }).then(onState); };
    if ((b = ov.querySelector('#ptCancel'))) b.onclick = function () { if (confirm('Turnir bekor qilinsinmi? Tangalar qaytariladi.')) api('/api/pzt/cancel', { id: curId }).then(function (x) { if (x.error) alert(x.error); list(); }); };
    if ((b = ov.querySelector('#ptShareB'))) b.onclick = function () {
      var l = d.link || (window.TG_APP_LINK ? window.TG_APP_LINK + '?startapp=pzt_' + curId : '');
      if (!l) return alert('Havola sozlanmagan (TG_APP_LINK)');
      var tx = '🧩 «' + d.name + '» masala turniri ' + hm(d.startAt) + ' da boshlanadi!\n📚 ' + d.count + ' ta masala' + (d.prize ? ' · 💰 ' + d.prize + ' mukofot' : '') + '\nKim tez va ko‘p yechadi? Qatnash! 👇';
      var u = 'https://t.me/share/url?url=' + encodeURIComponent(l) + '&text=' + encodeURIComponent(tx);
      function plain() { try { if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, '_blank'); } catch (e) { window.open(u, '_blank'); } }
      // yangi Telegram: rasmli tayyor xabar (banner + "Qatnashish" tugmasi)
      if (tg && tg.shareMessage && tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) {
        var bt = this, old = bt.textContent; bt.disabled = true; bt.textContent = '⏳';
        api('/api/pzt/shareprep', { id: curId }).then(function (x) {
          bt.disabled = false; bt.textContent = old;
          if (!x || !x.pid) return plain();
          try { tg.shareMessage(x.pid); } catch (e) { plain(); }
        }).catch(function () { bt.disabled = false; bt.textContent = old; plain(); });
      } else plain();
    };
    if ((b = ov.querySelector('#ptAnn'))) b.onclick = function () { var bt = this; bt.disabled = true; bt.textContent = '⏳'; api('/api/pzt/announce', { id: curId }).then(function (x) { bt.textContent = x && x.ok ? '✅ Yuborildi' : '⚠️ ' + ((x && x.error) || 'Xato'); }).catch(function () { bt.textContent = '⚠️ Xato'; }); };
    if ((b = ov.querySelector('#ptStart'))) b.onclick = function () { api('/api/pzt/go', { id: curId }).then(onState); };
    if ((b = ov.querySelector('#ptSkip'))) b.onclick = function () { if (st.busy) return; if (!confirm('Masala o‘tkazib yuborilsinmi? U yechilmagan hisoblanadi.')) return; st.busy = true; api('/api/pzt/skip', { id: curId }).then(function (x) { st.busy = false; onState(x); }).catch(function () { st.busy = false; }); };
    if ((b = ov.querySelector('#ptB'))) b.addEventListener('pointerdown', function (ev) { var x = ev.target.closest('[data-r]'); if (!x) return; ev.preventDefault(); tap(Number(x.getAttribute('data-r')), Number(x.getAttribute('data-c'))); });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-tab]'), function (x) { x.onclick = function () { st.tab = x.getAttribute('data-tab'); draw(); }; });
  }
  function myRes(d) {
    var me = d.me; if (!me || !me.res || !me.res.length) return '';
    return '<div class="ptCard"><h3>📝 Sizning natijangiz</h3><table class="ptTb"><tr><th>#</th><th>Natija</th><th class="r">Vaqt</th></tr>' + me.res.map(function (r) { return '<tr><td>' + (r.k + 1) + '</td><td>' + (r.ok ? '✅ yechildi' : '❌') + '</td><td class="r">' + sec(r.ms) + '</td></tr>'; }).join('') + '</table></div>';
  }
  function podFit() {
    if (!document.getElementById('spPd2Css') && !document.getElementById('ptPdCss')) {
      var c = document.createElement('style'); c.id = 'ptPdCss';
      c.textContent = '.spPd{position:relative;width:100%;aspect-ratio:1149/1369;border-radius:18px;overflow:hidden;margin-bottom:12px;background:#0b0920;font-family:Roboto,system-ui,sans-serif;color:#fff}.spPd img.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.spPd .tt{position:absolute;left:12%;right:12%;top:20.1%;transform:translateY(-50%);text-align:center;font:900 2.3em Georgia,serif;color:#ffe08a;text-shadow:0 2px 0 #7a4c00,0 0 12px rgba(255,190,60,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spPd .sl{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;text-align:center}.spPd .av{border-radius:50%;overflow:hidden;background:#1f4fd6;border:.18em solid #ffd76a;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;box-sizing:border-box}.spPd .av img{width:100%;height:100%;object-fit:cover}.spPd .nm{margin-top:.35em;max-width:100%;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000}.spPd .sc{font-weight:900;margin-top:.15em;text-shadow:0 1px 2px #000}.spPd .pz{display:inline-block;font-size:.9em;font-weight:900;color:#1a1205;background:#f5c542;border-radius:999px;padding:.05em .55em;white-space:nowrap}';
      document.head.appendChild(c);
    }
    var el = ov.querySelector('.ptPd'); if (!el) return;
    function f() { if (el.clientWidth) el.style.fontSize = (el.clientWidth / 40) + 'px'; }
    f(); setTimeout(f, 60);
  }
  function finished(d) {
    var h = '', tb = d.table || [];
    if (d.cancelled) return '<div class="ptCard">Turnir bekor qilingan</div>';
    if (tb.length) {
      // shohsupa — oddiy turnirdagi kabi (/podium.jpg ustiga avatar, ism, natija, mukofot)
      var K = 0.70, SL = [{ x: 50.0, y: 31.5, w: 21, d: 15.5, f: 1.25 }, { x: 23.3, y: 39.6, w: 17, d: 11.5, f: 1.05 }, { x: 76.8, y: 40.6, w: 17, d: 11.5, f: 1.05 }]; // K: rasmning yuqori 70% (zinapoya kesiladi)
      h += '<div class="spPd ptPd" style="aspect-ratio:1149/' + Math.round(1369 * K) + '"><img class="bg" src="/podium.jpg" alt="" style="height:' + (100 / K).toFixed(2) + '%;bottom:auto;object-fit:fill"><div class="tt" style="top:' + (20.1 / K).toFixed(2) + '%">' + esc(d.name) + '</div>';
      for (var i = 0; i < 3 && i < tb.length; i++) {
        var x = tb[i], s = SL[i], a = (d.awards || []).filter(function (z) { return z.place === i + 1; })[0], ini = esc(String(x.name || '?').charAt(0).toUpperCase()).replace(/'/g, '');
        var av = x.av ? '<img src="/api/av/' + encodeURIComponent(x.av) + '" alt="" onerror="this.parentNode.textContent=\'' + ini + '\'">' : ini;
        h += '<div class="sl" style="left:' + s.x + '%;top:' + (s.y / K).toFixed(2) + '%;width:' + s.w + '%;font-size:' + s.f + 'em"><div class="av" style="width:' + (s.d / s.w * 100) + '%;aspect-ratio:1;font-size:1.6em">' + av + '</div><div class="nm">' + esc(x.name) + '</div><div class="sc" style="white-space:nowrap;font-size:.8em">✅ ' + x.solved + ' · ' + sec(x.time) + '</div>' + (a && a.amt ? '<div class="sc"><span class="pz">+' + a.amt + ' 🪙</span></div>' : '') + '</div>';
      }
      h += '</div>';
    }
    var mine = tb.filter(function (x) { return x.me; })[0];
    if (mine && window.spShareCard) h += '<button class="ptSec" id="ptShr" style="margin-bottom:10px">📸 Natijamni ulashish</button>';
    var tab = st.tab === 'stats' ? 'stats' : 'live';
    h += '<div class="ptChips" style="margin-bottom:10px"><button data-tab="live" class="' + (tab === 'live' ? 'on' : '') + '">🏅 Jadval</button><button data-tab="stats" class="' + (tab === 'stats' ? 'on' : '') + '">📊 Masalalar</button></div>';
    if (tab === 'live') h += '<div class="ptCard">' + tableHtml(d) + '<div style="font-size:12px;color:#9fe3c9;margin-top:8px">✅ yechilgan · ⚡ birinchi yechgan (+1 ochko) · vaqt soniya aniqligida</div></div>' + myRes(d);
    else h += '<div class="ptCard"><table class="ptTb"><tr><th>#</th><th>Masala</th><th class="r">Yechdi</th><th class="r">O‘rtacha</th></tr>' + (d.stats || []).map(function (s) {
      var pc = s.tried ? Math.round(s.solved / s.tried * 100) : 0;
      return '<tr><td>' + (s.k + 1) + '</td><td>' + esc(s.title) + (s.first ? '<br><small style="opacity:.7">⚡ ' + esc(s.first) + '</small>' : '') + '</td><td class="r">' + s.solved + '/' + s.tried + '<br><small style="opacity:.7">' + pc + '%</small></td><td class="r">' + (s.avg ? sec(s.avg) : '—') + '</td></tr>';
    }).join('') + '</table></div>';
    return h;
  }

  // ---------- yechish
  function tap(r, c) {
    var d = st.d; if (!d || !d.pz || st.busy || !st.g || st.g.side !== d.pz.side) return;
    var g = st.g, lg = R().legal(g.b, g.side, g.forced);
    if (st.sel) { var s = R().findStep(lg, [st.sel[0], st.sel[1], r, c]); if (s) return send(s); }
    if (lg.some(function (s2) { return s2.f[0] === r && s2.f[1] === c; })) { st.sel = [r, c]; haptic(); draw(); return; }
    var to = lg.filter(function (s3) { return s3.t[0] === r && s3.t[1] === c; });
    if (to.length === 1) return send(to[0]);
    if (st.sel) { st.sel = null; draw(); }
  }
  function autoSel() { if (st.g && st.d && st.d.pz && st.g.forced && st.g.side === st.d.pz.side) st.sel = [st.g.forced[0], st.g.forced[1]]; }
  function send(s) {
    st.busy = true;
    var w = [s.f[0], s.f[1], s.t[0], s.t[1]], before = st.g, k = st.d.pz.k;
    st.g = R().adv(st.g, s); st.sel = null; st.lm = w; autoSel(); draw();
    api('/api/pzt/move', { id: curId, k: k, step: w }).then(function (d) {
      if (d.bad) { st.g = before; st.lm = null; st.busy = false; draw(); return; }
      if (d.wrong) {
        haptic('bad'); st.g = before; st.flash = 'bad'; st.msg = '❌ Xato — masala yondi'; st.d = Object.assign(st.d, { me: d.me }); hud(); draw();
        return setTimeout(function () { st.flash = ''; st.msg = ''; st.busy = false; st.pzk = -1; onState(d); }, 700);
      }
      var opp = d.opp || [], i = 0;
      (function playOpp() {
        if (i < opp.length) { var x = opp[i++], os = R().findStep(R().legal(st.g.b, st.g.side, st.g.forced), x); if (os) { st.g = R().adv(st.g, os); st.lm = x; draw(); } return setTimeout(playOpp, 170); }
        if (d.solved) {
          haptic('ok'); st.flash = 'ok'; st.msg = d.first ? '⚡ Birinchi bo‘lib yechdingiz! +3' : '✅ +2'; draw();
          setTimeout(function () { st.flash = ''; st.msg = ''; st.busy = false; st.pzk = -1; onState(d); }, d.first ? 700 : 350);
        } else { st.busy = false; autoSel(); st.d.me = d.me; draw(); }
      })();
    }).catch(function () { st.g = before; st.busy = false; st.msg = '⚠️ Aloqa uzildi'; draw(); });
  }

  window.spPzt = function (o) {
    opts = o || {}; css();
    if (ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'spPzt'; document.body.appendChild(ov);
    if (opts.open) openT(opts.open); else list();
  };
})();
