;(function(){
  if (window.__tvUi2) return; window.__tvUi2 = 1;
  function St(){ try { return window.__lb ? window.__lb.S : null; } catch(e){ return null; } }
  function findT(id){ var s = St(); if (!s || !s.tournaments) return null; for (var i = 0; i < s.tournaments.length; i++) if (String(s.tournaments[i].id) === String(id)) return s.tournaments[i]; return null; }
  function me(){ var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }

  var css =
  '#tvChatBtn{position:relative}' +
  '#tvChatBtn b{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;line-height:18px;text-align:center;display:none}' +
  '#tvChatBtn.has b{display:block}' +
  '#tvChatDim{position:absolute;inset:0;background:rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .25s;z-index:5}' +
  '#tvChatDim.on{opacity:1;pointer-events:auto}' +
  '#tvChatSheet{position:absolute;left:0;right:0;bottom:0;height:72%;z-index:6;display:flex;flex-direction:column;background:linear-gradient(180deg,#0b2a5c,#061634);border-top:1px solid rgba(90,150,255,.45);border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.5);transform:translateY(105%);transition:transform .28s ease}' +
  '#tvChatSheet.on{transform:translateY(0)}' +
  '#tvChatSheet .shH{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;font-weight:800;font-size:17px}' +
  '#tvChatSheet .shH:before{content:"";position:absolute;left:50%;top:6px;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:rgba(255,255,255,.25)}' +
  '#tvChatSheet .shX{background:none!important;border:0!important;color:#9cc2ff!important;font-size:20px;min-height:0!important;padding:0 4px!important}' +
  '#tvChatSheet .tvSec{flex:1;display:flex;flex-direction:column;margin:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;padding:0 14px calc(14px + env(safe-area-inset-bottom))!important;min-height:0}' +
  '#tvChatSheet #tvChatH{display:none!important}' +
  '#tvChatSheet #tvChatBox{display:flex!important;flex-direction:column;flex:1;min-height:0}' +
  '#tvChatSheet #tvMsgs{flex:1;max-height:none!important;min-height:0}';
  var st = document.createElement('style'); st.id = 'tvUi2Css'; st.textContent = css; document.head.appendChild(st);

  var sheet = null, dim = null, btn = null;
  function seenKey(){ return 'tvSeen_' + window.__tvCur; }
  function setup(){
    var P = document.getElementById('tvP'); if (!P) return false;
    var head = P.querySelector('.tvHead'), ref = document.getElementById('tvRef'), chatH = document.getElementById('tvChatH');
    if (!head || !chatH) return false;
    if (!btn) {
      btn = document.createElement('button'); btn.id = 'tvChatBtn'; btn.className = 'tvIc'; btn.type = 'button'; btn.title = 'Chat';
      btn.innerHTML = '💬<b></b>';
      head.insertBefore(btn, ref || null);
      btn.onclick = function(){ openChat(); };
    }
    if (!sheet) {
      dim = document.createElement('div'); dim.id = 'tvChatDim'; P.appendChild(dim);
      sheet = document.createElement('div'); sheet.id = 'tvChatSheet';
      sheet.innerHTML = '<div class="shH"><span>💬 Turnir chati</span><button class="shX" type="button">✕</button></div>';
      P.appendChild(sheet);
      sheet.appendChild(chatH.closest('.tvSec'));
      dim.onclick = closeChat; sheet.querySelector('.shX').onclick = closeChat;
    }
    return true;
  }
  function lastAt(t){ var c = t.chat || [], u = me(), n = 0, mx = 0; for (var i = 0; i < c.length; i++) { if (c[i].at > mx) mx = c[i].at; } return mx; }
  function openChat(){
    if (!sheet) return;
    sheet.classList.add('on'); dim.classList.add('on');
    var t = findT(window.__tvCur); if (t) ls(seenKey(), String(lastAt(t)));
    var m = document.getElementById('tvMsgs'); if (m) setTimeout(function(){ m.scrollTop = m.scrollHeight; }, 50);
    upd();
  }
  function closeChat(){ if (sheet) { sheet.classList.remove('on'); dim.classList.remove('on'); } upd(); }
  function upd(){
    var P = document.getElementById('tvP');
    if (!P || !P.classList.contains('on')) { if (sheet && sheet.classList.contains('on')) closeChat(); return; }
    if (!setup()) return;
    var t = findT(window.__tvCur); if (!t) return;
    // Live faqat turnir ketayotganda
    var lv = document.getElementById('tvLive'), sec = lv && lv.closest('.tvSec');
    if (sec) sec.style.display = t.status === 'running' ? '' : 'none';
    // o'qilmagan xabarlar
    if (sheet.classList.contains('on')) ls(seenKey(), String(lastAt(t)));
    var seen = Number(ls(seenKey()) || 0), u = me(), n = 0, c = t.chat || [];
    for (var i = 0; i < c.length; i++) if (c[i].at > seen && String(c[i].uid) !== u) n++;
    var b = btn.querySelector('b'); b.textContent = n > 9 ? '9+' : String(n);
    btn.classList.toggle('has', n > 0);
  }
  setInterval(upd, 700);
})();
