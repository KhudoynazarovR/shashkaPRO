/* Puzzle Battle ekrani: raqib qidirish -> 3,2,1 -> 3 daqiqa bellashuv -> natija. Server: pzbattle.js. Qoidalar: rushview.js (window.spPzRules). */
;(function () {
  if (window.spBattle) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var R = function () { return window.spPzRules; };

  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(ms) { var x = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(x / 60) + ':' + (x % 60 < 10 ? '0' : '') + (x % 60); }
  function haptic(k) { try { if (k === 'ok') tg.HapticFeedback.notificationOccurred('success'); else if (k === 'bad') tg.HapticFeedback.notificationOccurred('error'); else tg.HapticFeedback.impactOccurred('light'); } catch (e) {} }
  function myAv() { try { var u = tg.initDataUnsafe.user; return u && u.id ? '/api/av/' + encodeURIComponent(u.id) : ''; } catch (e) { return ''; } }

  var CSS =
    '#spBat{position:fixed;inset:0;z-index:2147482600;overflow-y:auto;color:#fff;font-family:Roboto,system-ui,sans-serif;background:radial-gradient(circle at 50% 0,#5b2bb0 0,#2a0f63 45%,#120530 100%);padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 20px);box-sizing:border-box;-webkit-tap-highlight-color:transparent}' +
    '#spBat button{font-family:inherit;cursor:pointer}' +
    '.btTop{display:flex;align-items:center;gap:8px;margin-bottom:12px}' +
    '.btX{width:44px;height:44px;border:0;border-radius:12px;background:rgba(0,0,0,.35);color:#fff;font-size:20px;flex:none}' +
    '.btT{flex:1;font-size:22px;font-weight:900}' +
    '.btCard{background:rgba(0,0,0,.3);border-radius:18px;padding:16px;margin-bottom:12px}' +
    '.btCard h3{margin:0 0 8px;font-size:18px}.btCard li{margin:6px 0;font-size:16px;line-height:1.35}' +
    '.btGo{display:block;width:100%;height:58px;border:0;border-radius:18px;background:linear-gradient(180deg,#c69bff,#8a4dff);color:#fff;font-size:22px;font-weight:900;box-shadow:0 5px 0 #4b1fa3;margin:6px 0 14px}' +
    '.btGo:active{transform:translateY(3px);box-shadow:0 2px 0 #4b1fa3}' +
    '.btStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}' +
    '.btBox{background:rgba(0,0,0,.32);border-radius:14px;padding:8px 6px;text-align:center}.btBox small{display:block;font-size:12px;font-weight:700;color:#d9c6ff}.btBox b{display:block;font-size:26px;font-weight:900;font-variant-numeric:tabular-nums}' +
    '.btRow{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:16px}.btRow b{margin-left:auto;font-size:18px}.btRow i{font-style:normal;width:26px;text-align:center;color:#d9c6ff}' +
    '.btSearch{text-align:center;padding:30px 10px}.btSpin{width:90px;height:90px;margin:0 auto 18px;border-radius:50%;border:8px solid rgba(255,255,255,.15);border-top-color:#c69bff;animation:btSp 1s linear infinite}@keyframes btSp{to{transform:rotate(360deg)}}' +
    '.btSecondary{display:block;width:100%;margin-top:10px;border:0;border-radius:14px;padding:12px;background:rgba(0,0,0,.35);color:#e9dcff;font-size:16px;font-weight:700}' +
    '.btVs{display:flex;align-items:stretch;gap:8px;margin-bottom:10px}' +
    '.btP{flex:1;min-width:0;background:rgba(0,0,0,.32);border-radius:14px;padding:8px 10px;border:2px solid transparent}.btP.me{border-color:#8de08a}.btP.op{border-color:#ff9a7a}' +
    '.btP .nm{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e9dcff}.btP .sc{font-size:30px;font-weight:900;line-height:1.1}.btP .ht{font-size:15px;letter-spacing:1px}' +
    '.btP.out{opacity:.5}' +
    '.btClock{flex:none;width:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);border-radius:14px}.btClock small{font-size:11px;color:#d9c6ff;font-weight:700}.btClock b{font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}.btClock.low b{color:#ffcf3f}.btClock.crit b{color:#ff6b6b}' +
    '.btSide{text-align:center;font-size:16px;font-weight:700;margin:2px 0 8px;color:#eadfff}' +
    '#btB{width:min(94vw,460px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:4px solid #5a3415;border-radius:8px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.5)}' +
    '#btB.ok{box-shadow:0 0 0 4px #55e07a}#btB.bad{box-shadow:0 0 0 4px #ff4d4d;animation:btSh .35s}@keyframes btSh{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '#btB>div{position:relative;display:flex;align-items:center;justify-content:center}#btB .l{background:#f0d9b5}#btB .d{background:#b58863}#btB .d.sel{box-shadow:inset 0 0 0 4px #f5d92b}#btB .d.lm{background:#c9a23f}' +
    '#btB .dot{position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(40,200,120,.85)}' +
    '#btB .pc{width:82%;height:82%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f5b72b;box-shadow:0 2px 3px rgba(0,0,0,.45)}#btB .pw{background:radial-gradient(circle at 35% 28%,#fff,#c9c9c9);border:2px solid #9a9a9a}#btB .pb{background:radial-gradient(circle at 35% 28%,#666,#111);border:2px solid #000}' +
    '.btMsg{min-height:28px;text-align:center;font-size:17px;font-weight:800;margin:10px 0 4px}' +
    '.btCount{position:fixed;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(18,5,48,.85)}.btCount b{font-size:120px;font-weight:900;line-height:1}.btCount span{font-size:20px;margin-top:10px;color:#e9dcff}' +
    '.btWait{text-align:center;padding:30px 10px;font-size:18px}' +
    '.btRes{text-align:center}.btRes .big{font-size:44px;font-weight:900;margin:6px 0}.btRes .vs{font-size:56px;font-weight:900;font-variant-numeric:tabular-nums}.btRes .sub{font-size:16px;color:#e9dcff;margin-top:6px}' +
    '.btBots{display:flex;flex-direction:column;gap:8px}' +
    '.btBot{display:flex;align-items:center;gap:12px;width:100%;border:0;border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.08);color:#fff;text-align:left}' +
    '.btBot:active{transform:translateY(2px)}.btBot .bi{font-size:30px;flex:none}.btBot .bt{flex:1;min-width:0;display:flex;flex-direction:column}.btBot .bt b{font-size:17px}.btBot .bt b i{font-style:normal;font-size:14px}.btBot .bt small{font-size:13px;color:#d9c6ff}' +
    '.btBot .bc{flex:none;font-weight:900;color:#ffcf3f;font-size:15px}' +
    '.btGain{display:inline-block;margin-top:10px;background:#ffcf3f;color:#3a1600;font-weight:900;font-size:20px;border-radius:999px;padding:6px 16px}';

  var ov = null, opts = {}, st = null, pollT = null, tickT = null;
  function css() { if (!document.getElementById('btCss')) { var s = document.createElement('style'); s.id = 'btCss'; s.textContent = CSS; document.head.appendChild(s); } }
  function stopAll() { if (pollT) clearInterval(pollT); if (tickT) clearInterval(tickT); pollT = tickT = null; }
  function close() {
    stopAll();
    if (st && st.phase === 'wait') api('/api/battle/cancel', {}).catch(function () {});
    st = null; if (ov) ov.remove(); ov = null;
  }
  function top(title, back) { return '<div class="btTop"><button class="btX" id="btX" aria-label="Orqaga">' + (back || '‹') + '</button><div class="btT">' + (title || '⚔️ Puzzle Battle') + '</div></div>'; }

  // ---------- bosh ekran
  function home() {
    stopAll(); st = null;
    ov.innerHTML = top() + '<div class="btCard">Yuklanmoqda…</div>';
    ov.querySelector('#btX').onclick = close;
    api('/api/battle/top').then(drawHome).catch(function () { drawHome({}); });
  }
  function drawHome(d) {
    d = d || {};
    var me = String((tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) || '');
    var h = top();
    h += '<div class="btStats"><div class="btBox"><small>REYTING</small><b>' + (d.rt || 1000) + '</b></div><div class="btBox"><small>G‘ALABA</small><b>' + (d.wins || 0) + '/' + (d.games || 0) + '</b></div><div class="btBox"><small>TANGALI</small><b>' + (d.paidLeft == null ? 5 : d.paidLeft) + '</b></div></div>';
    h += '<button class="btGo" id="btGo">⚔️ Raqib topish</button><button class="btSecondary" id="btInv" style="margin:-4px 0 14px;background:rgba(255,255,255,.12);color:#fff;font-size:17px">🔗 Do‘stni chaqirish (havola)</button>';
    var bots = d.bots || [];
    if (bots.length) {
      h += '<div class="btCard"><h3>🤖 Bot bilan bellashish</h3><div class="btBots">';
      bots.forEach(function (b) {
        h += '<button class="btBot" data-lv="' + b.lv + '"><span class="bi">' + ['🐣', '🧑‍🎓', '🤴', '🦁', '👑'][b.lv] + '</span><span class="bt"><b>' + esc(b.name.replace(/\s*BOT$/, '')) + (b.beat ? ' <i>✅</i>' : '') + '</b><small>⭐ ' + b.rt + ' · ' + ['Oson', 'O‘rta', 'Qiyin', 'Juda qiyin', 'Afsonaviy'][b.lv] + '</small></span><span class="bc">+' + b.coins + ' 🪙</span></button>';
      });
      h += '</div></div>';
    }
    h += '<div class="btCard"><h3>Qoidalar</h3><ul style="margin:0;padding-left:20px">' +
      '<li>👥 1 ga 1, ikkalangizga <b>bir xil masalalar</b></li>' +
      '<li>⏱ <b>' + Math.round((d.dur || 180) / 60) + ' daqiqa</b>, masalalar osondan qiyinga</li>' +
      '<li>✅ To‘g‘ri yechim — <b>+1 ochko</b>, raqib ochkosi jonli ko‘rinadi</li>' +
      '<li>❌ ' + (d.maxErr || 3) + ' ta xato — chiqasiz (ochkongiz muzlaydi)</li>' +
      '<li>🏆 Ochkosi ko‘p yutadi; teng bo‘lsa — shu ochkoga birinchi yetgan</li>' +
      '<li>🪙 G‘alaba: odamga +' + (d.coins || 20) + ', botga darajasiga qarab +3…+20; kuniga 5 ta tangali g‘alaba</li>' +
      '<li>🤖 20 soniyada raqib topilmasa — bot bilan</li></ul></div>';
    var rows = d.top || [];
    h += '<div class="btCard"><h3>🏆 Reyting</h3>' + (rows.length ? '' : '<div style="opacity:.8">Hali o‘yin yo‘q — birinchi bo‘ling!</div>');
    rows.slice(0, 10).forEach(function (r, i) { h += '<div class="btRow" style="' + (String(r.uid) === me ? 'color:#ffcf3f' : '') + '"><i>' + (['🥇', '🥈', '🥉'][i] || (i + 1)) + '</i><span>' + esc(r.name) + ' <small style="opacity:.7">' + r.w + '/' + r.g + '</small></span><b>' + r.rt + '</b></div>'; });
    h += '</div>';
    ov.innerHTML = h;
    ov.querySelector('#btX').onclick = close;
    ov.querySelector('#btGo').onclick = find;
    ov.querySelector('#btInv').onclick = invite;
    Array.prototype.forEach.call(ov.querySelectorAll('[data-lv]'), function (b) { b.onclick = function () { vsBot(Number(b.getAttribute('data-lv'))); }; });
  }
  function vsBot(lv) {
    stopAll(); st = { phase: 'wait' };
    ov.innerHTML = top('⚔️ Puzzle Battle', '✕') + '<div class="btCard btSearch"><div class="btSpin"></div><div style="font-size:20px;font-weight:800">Bot tayyorlanmoqda…</div></div>';
    ov.querySelector('#btX').onclick = close;
    api('/api/battle/bot', { lv: lv }).then(onState).catch(function () { alert('Server bilan aloqa yo‘q'); home(); });
  }

  // ---------- qidirish
  function find() {
    st = { phase: 'wait' };
    drawSearch(20000);
    api('/api/battle/find', {}).then(onState).catch(function () { alert('Server bilan aloqa yo‘q'); home(); });
    stopAll(); pollT = setInterval(function () { api('/api/battle/poll', {}).then(onState).catch(function () {}); }, 1000);
  }
  function drawSearch(botIn) {
    ov.innerHTML = top('⚔️ Raqib qidirilmoqda', '✕') + '<div class="btCard btSearch"><div class="btSpin"></div><div style="font-size:20px;font-weight:800">Raqib qidirilmoqda…</div><div style="margin-top:8px;color:#e9dcff">' + (botIn > 0 ? Math.ceil(botIn / 1000) + ' soniyadan so‘ng bot bilan' : 'Bot tayyorlanmoqda…') + '</div>' +
      '<button class="btSecondary" id="btBot">🤖 Hozir bot bilan o‘ynash</button><button class="btSecondary" id="btCancel">Bekor qilish</button></div>';
    ov.querySelector('#btX').onclick = close;
    ov.querySelector('#btCancel').onclick = function () { api('/api/battle/cancel', {}).catch(function () {}); home(); };
    ov.querySelector('#btBot').onclick = function () { api('/api/battle/poll', { bot: true }).then(onState).catch(function () {}); };
  }

  // ---------- do'stni havola orqali chaqirish
  function shareText() { return '⚔️ Seni Puzzle Battle’ga chaqiraman! 3 daqiqa, bir xil masalalar — kim ko‘p yechadi? 🧩'; }
  function invite() {
    stopAll(); st = { phase: 'wait', inv: true };
    ov.innerHTML = top('🔗 Do‘stni chaqirish', '✕') + '<div class="btCard btSearch"><div class="btSpin"></div>Havola tayyorlanmoqda…</div>';
    ov.querySelector('#btX').onclick = close;
    api('/api/battle/invite', {}).then(function (v) {
      onState(v);
      pollT = setInterval(function () { api('/api/battle/poll', {}).then(onState).catch(function () {}); }, 1000);
    }).catch(function () { alert('Server bilan aloqa yo‘q'); home(); });
  }
  function drawInvite(v) {
    var link = v.link || (window.TG_APP_LINK ? window.TG_APP_LINK + '?startapp=pb_' + v.code : '');
    st.link = link;
    var mins = Math.max(0, Math.ceil((v.left || 0) / 60000));
    if (ov.querySelector('#btInvBox')) { var t = ov.querySelector('#btInvLeft'); if (t) t.textContent = mins + ' daqiqa amal qiladi'; return; }
    ov.innerHTML = top('🔗 Do‘stni chaqirish', '✕') + '<div class="btCard btSearch" id="btInvBox"><div class="btSpin"></div>' +
      '<div style="font-size:20px;font-weight:800">Do‘stingiz kutilmoqda…</div>' +
      '<div style="margin-top:8px;color:#e9dcff">Havolani guruhga yoki do‘stingizga yuboring. U bosishi bilan bellashuv boshlanadi.</div>' +
      '<div style="margin:12px 0 4px;padding:10px;border-radius:12px;background:rgba(0,0,0,.35);font-size:14px;word-break:break-all">' + esc(link || 'Havola sozlanmagan (TG_APP_LINK)') + '</div>' +
      '<div id="btInvLeft" style="font-size:13px;color:#d9c6ff">' + mins + ' daqiqa amal qiladi</div>' +
      '<button class="btGo" id="btShare" style="margin-top:14px">📤 Telegramda yuborish</button>' +
      '<button class="btSecondary" id="btCopy">📋 Havolani nusxalash</button><button class="btSecondary" id="btCancel">Bekor qilish</button></div>';
    ov.querySelector('#btX').onclick = function () { api('/api/battle/cancel', {}).catch(function () {}); close(); };
    ov.querySelector('#btCancel').onclick = function () { api('/api/battle/cancel', {}).catch(function () {}); home(); };
    ov.querySelector('#btShare').onclick = function () {
      if (!st || !st.link) return;
      var u = 'https://t.me/share/url?url=' + encodeURIComponent(st.link) + '&text=' + encodeURIComponent(shareText());
      try { if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, '_blank'); } catch (e) { window.open(u, '_blank'); }
    };
    ov.querySelector('#btCopy').onclick = function () {
      var b = this; if (!st || !st.link) return;
      var done = function () { b.textContent = '✅ Nusxalandi'; setTimeout(function () { b.textContent = '📋 Havolani nusxalash'; }, 1500); };
      try { navigator.clipboard.writeText(st.link).then(done, function () { prompt('Havolani nusxalang:', st.link); }); } catch (e) { prompt('Havolani nusxalang:', st.link); }
    };
  }
  function join(code) {
    stopAll(); st = { phase: 'wait' };
    ov.innerHTML = top() + '<div class="btCard btSearch"><div class="btSpin"></div><div style="font-size:20px;font-weight:800">Bellashuvga ulanmoqda…</div></div>';
    ov.querySelector('#btX').onclick = close;
    api('/api/battle/join', { code: code }).then(function (v) {
      if (v && v.phase === 'invite') { st.inv = true; onState(v); pollT = setInterval(function () { api('/api/battle/poll', {}).then(onState).catch(function () {}); }, 1000); return; }
      onState(v);
    }).catch(function () { alert('Server bilan aloqa yo‘q'); home(); });
  }
  function notice(t) {
    stopAll(); st = null;
    ov.innerHTML = top() + '<div class="btCard btSearch"><div style="font-size:44px">⌛</div><div style="font-size:19px;font-weight:800;margin-top:8px">' + t + '</div><button class="btGo" id="btOk" style="margin-top:16px">⚔️ Battle’ga o‘tish</button></div>';
    ov.querySelector('#btX').onclick = close; ov.querySelector('#btOk').onclick = home;
  }

  // ---------- server holati
  function onState(v) {
    if (!ov || !st) return;
    if (!v || v.phase === 'idle') return;
    if (v.phase === 'invite') { if (st.phase === 'wait') drawInvite(v); return; }
    if (v.phase === 'expired') return notice('Taklif muddati tugagan yoki bekor qilingan');
    if (v.phase === 'busy') return notice('Do‘stingiz hozir boshqa bellashuvda');
    if (v.phase === 'wait') { if (st.phase === 'wait') drawSearch(v.botIn); return; }
    var first = !st.mid;
    st.mid = v.mid; st.v = v; st.left = v.left; st.at = Date.now();
    if (v.phase === 'over') return result(v);
    if (first) {
      st.phase = v.phase; st.score = 0; st.errors = 0; st.busy = false; st.sel = null; st.msg = ''; st.flash = '';
      stopAll();
      pollT = setInterval(function () { if (st && st.mid) api('/api/battle/poll', {}).then(onState).catch(function () {}); }, 1000);
      tickT = setInterval(tick, 250);
      api('/api/battle/puzzle', { mid: st.mid }).then(function (d) { if (d && d.pz) setPz(d.pz); onView(d); });
      return;
    }
    onView(v);
  }
  function onView(v) {
    if (!st || !v) return;
    if (v.phase === 'over') return result(v);
    st.v = v; st.left = v.left; st.startIn = v.startIn; st.at = Date.now(); st.phase = v.phase;
    if (!st.busy) draw(); else hud();
  }
  function tick() {
    if (!st || !st.v) return;
    var el = Date.now() - st.at, cd = ov && ov.querySelector('#btCd');
    if (st.phase === 'count') {
      var s = Math.ceil((st.startIn - el) / 1000);
      if (cd) cd.querySelector('b').textContent = s > 0 ? s : 'Boshla!';
      if (st.startIn - el <= 0) { st.phase = 'play'; draw(); }
      return;
    }
    var t = ov && ov.querySelector('#btTime'); if (!t) return;
    var left = st.left - el; t.textContent = fmt(left);
    t.parentNode.classList.toggle('low', left <= 30000 && left > 10000); t.parentNode.classList.toggle('crit', left <= 10000);
  }
  function hearts(n, max) { var h = ''; for (var i = 0; i < max; i++) h += i < max - n ? '❤️' : '🖤'; return h; }
  function hudHtml() {
    var v = st.v, me = v.me, op = v.op, mx = v.maxErr || 3;
    return '<div class="btVs" id="btHud"><div class="btP me' + (me.out ? ' out' : '') + '"><div class="nm">Siz</div><div class="sc">' + me.score + '</div><div class="ht">' + hearts(me.err, mx) + '</div></div>' +
      '<div class="btClock"><small>VAQT</small><b id="btTime">' + fmt(st.left - (Date.now() - st.at)) + '</b></div>' +
      '<div class="btP op' + (op.out ? ' out' : '') + '"><div class="nm">' + (op.bot ? '🤖 ' : '') + esc(op.name) + ' · ' + op.rt + '</div><div class="sc">' + op.score + '</div><div class="ht">' + (op.out ? 'chiqdi' : hearts(op.err, mx)) + '</div></div></div>';
  }
  function hud() { var e = ov && ov.querySelector('#btHud'); if (e) e.outerHTML = hudHtml(); }
  function setPz(p) { st.pz = p; st.g = { b: R().copy(p.board), side: p.side, forced: null }; st.sel = null; st.lm = null; }
  function draw() {
    if (!st || !st.v) return;
    var h = top('⚔️ Puzzle Battle', '✕') + hudHtml();
    if (st.v.me.out) {
      h += '<div class="btCard btWait">💔 Siz 3 ta xato qildingiz.<br>Raqib tugatishi kutilmoqda…</div>';
    } else if (st.pz) {
      var p = st.pz, g = st.g, lg = st.sel ? R().legal(g.b, g.side, g.forced).filter(function (s) { return s.f[0] === st.sel[0] && s.f[1] === st.sel[1]; }) : [];
      h += '<div class="btSide">' + (p.side === 'w' ? '⚪ Oqlar yuradi' : '⚫ Qoralar yuradi') + ' · ' + ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'][p.level || 1] + '</div><div id="btB" class="' + (st.flash || '') + '">';
      var flip = p.side === 'b';
      for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
        var r = flip ? 7 - i : i, c = flip ? 7 - j : j, dk = (r + c) % 2 === 1, pc = g.b[r][c], cls = dk ? 'd' : 'l';
        if (st.sel && st.sel[0] === r && st.sel[1] === c) cls += ' sel';
        if (st.lm && ((st.lm[0] === r && st.lm[1] === c) || (st.lm[2] === r && st.lm[3] === c))) cls += ' lm';
        var dot = lg.some(function (s) { return s.t[0] === r && s.t[1] === c; }) ? '<i class="dot"></i>' : '';
        h += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + dot + (pc ? '<div class="pc ' + (pc === 1 || pc === 3 ? 'pw' : 'pb') + '">' + (pc > 2 ? '♛' : '') + '</div>' : '') + '</div>';
      }
      h += '</div><div class="btMsg">' + (st.msg || '') + '</div><button class="btSecondary" id="btSkip">⏭ O‘tkazib yuborish (−1 ❤️)</button>';
    } else h += '<div class="btCard btWait">Masala yuklanmoqda…</div>';
    if (st.phase === 'count') h += '<div class="btCount" id="btCd"><b>' + Math.max(1, Math.ceil((st.startIn - (Date.now() - st.at)) / 1000)) + '</b><span>Raqib: ' + (st.v.op.bot ? '🤖 ' : '') + esc(st.v.op.name) + ' (' + st.v.op.rt + ')</span></div>';
    ov.innerHTML = h;
    ov.querySelector('#btX').onclick = function () { if (confirm('Bellashuvdan chiqasizmi? Bu mag‘lubiyat hisoblanadi.')) api('/api/battle/resign', { mid: st.mid }).then(onView).catch(close); };
    var sk = ov.querySelector('#btSkip'); if (sk) sk.onclick = function () { if (st.busy || st.phase !== 'play') return; st.busy = true; api('/api/battle/skip', { mid: st.mid }).then(onWrong).catch(function () { st.busy = false; }); };
    var bd = ov.querySelector('#btB'); if (bd) bd.onclick = function (ev) { var x = ev.target.closest('[data-r]'); if (x) tap(Number(x.getAttribute('data-r')), Number(x.getAttribute('data-c'))); };
  }
  function tap(r, c) {
    if (!st || st.busy || st.phase !== 'play' || !st.pz || st.g.side !== st.pz.side) return;
    var g = st.g, lg = R().legal(g.b, g.side, g.forced);
    if (st.sel) { var s = R().findStep(lg, [st.sel[0], st.sel[1], r, c]); if (s) return send(s); }
    if (lg.some(function (s2) { return s2.f[0] === r && s2.f[1] === c; })) { st.sel = [r, c]; haptic(); draw(); }
    else if (st.sel) { st.sel = null; draw(); }
  }
  function send(s) {
    st.busy = true;
    var w = [s.f[0], s.f[1], s.t[0], s.t[1]], before = st.g;
    st.g = R().adv(st.g, s); st.sel = null; st.lm = w; draw();
    api('/api/battle/move', { mid: st.mid, step: w }).then(function (d) {
      if (!d || !st) return;
      if (d.bad) { st.g = before; st.lm = null; st.busy = false; draw(); return; }
      if (d.wrong) { st.g = before; return onWrong(d); }
      if (d.phase === 'over') return result(d);
      st.v = d; st.left = d.left; st.at = Date.now();
      var opp = d.opp || [], k = 0;
      (function playOpp() {
        if (k < opp.length) { var x = opp[k++], os = R().findStep(R().legal(st.g.b, st.g.side, st.g.forced), x); if (os) { st.g = R().adv(st.g, os); st.lm = x; draw(); } return setTimeout(playOpp, 350); }
        if (d.solved) {
          haptic('ok'); st.flash = 'ok'; st.msg = '✅ +1'; draw();
          setTimeout(function () { if (!st) return; st.flash = ''; st.msg = ''; if (d.pz) setPz(d.pz); st.busy = false; draw(); }, 400);
        } else { st.busy = false; draw(); }
      })();
    }).catch(function () { st.g = before; st.busy = false; st.msg = '⚠️ Aloqa uzildi'; draw(); });
  }
  function onWrong(d) {
    if (!st) return;
    haptic('bad'); st.v = d; st.left = d.left; st.at = Date.now();
    var sol = d.sol || [], k = 0;
    st.flash = 'bad'; st.msg = '❌ Xato! To‘g‘ri yo‘l:'; draw();
    (function step() {
      if (!st) return;
      if (k < sol.length && k < 6) { var x = sol[k++], s = R().findStep(R().legal(st.g.b, st.g.side, st.g.forced), x); if (s) { st.g = R().adv(st.g, s); st.lm = x; st.flash = ''; draw(); } return setTimeout(step, 380); }
      setTimeout(function () { if (!st) return; st.flash = ''; st.msg = ''; if (d.phase === 'over') return result(d); if (d.pz) setPz(d.pz); st.busy = false; draw(); }, 300);
    })();
  }

  // ---------- natija
  function result(v) {
    stopAll();
    var r = v.result || {}, me = v.me || {}, op = v.op || {};
    if (r.gain && opts.onCoins) opts.onCoins(r.gain);
    var h = top();
    h += '<div class="btCard btRes"><div class="big">' + (r.draw ? '🤝 Durang' : r.win ? '🏆 G‘alaba!' : '😔 Mag‘lubiyat') + '</div>' +
      '<div class="vs">' + (me.score || 0) + ' : ' + (op.score || 0) + '</div><div class="sub">Siz · ' + (op.bot ? '🤖 ' : '') + esc(op.name) + '</div>' +
      (r.delta ? '<div class="sub">Reyting: ' + r.rt + ' (' + (r.delta > 0 ? '+' : '') + r.delta + ')</div>' : '') +
      (r.gain ? '<div class="btGain">+' + r.gain + ' 🪙</div>' : '') + '</div>';
    h += '<button class="btGo" id="btAgain">⚔️ Yana bellashish</button><button class="btSecondary" id="btHome">🏆 Reyting</button>';
    ov.innerHTML = h; st = null;
    ov.querySelector('#btX').onclick = close;
    ov.querySelector('#btAgain').onclick = find;
    ov.querySelector('#btHome').onclick = home;
  }

  window.spBattle = function (o) {
    opts = o || {}; css();
    if (ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'spBat'; document.body.appendChild(ov);
    if (opts.join) join(opts.join); else home();
  };
})();
