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
