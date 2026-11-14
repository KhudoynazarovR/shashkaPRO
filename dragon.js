/* dragon.js — DragonBOT «tez kunda»: bosh sahifada banner, botlar ro'yxatida qulflangan qator, kutayotganlar oynasi.
   Kutayotganlar soni va ro'yxati hammaga ko'rinadi. Admin: rasmni almashtirish, chiqqanda kutganlarga xabar. */
;(function () {
  if (window.spDragonRow) return;
  var S = null, ov = null, busy = false, rep = null, draft = '';
  function $(i) { return document.getElementById(i); }
  function hd() { return { 'Content-Type': 'application/json', 'x-init-data': (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || '' }; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  var SUB = 'Yangi avlod boti — King Kong’dan ham kuchliroq';
  var st = document.createElement('style');
  st.textContent =
    '#lbPanel #hzHero #drBan{order:3!important}' +
    '#drBan{flex:1 1 100%;width:100%;box-sizing:border-box;position:relative;height:150px;border-radius:20px;overflow:hidden;margin:0 0 12px;cursor:pointer;color:#fff;border:2px solid #ff7a3d;box-shadow:0 0 22px rgba(255,90,40,.35);' +
    'background:radial-gradient(circle at 76% 55%,#ff5a1f 0,#8b1d12 30%,#2a0f3a 64%,#1a0b2e 100%)}' +
    '#drBan .im{position:absolute;right:0;top:0;bottom:0;width:55%;background-size:cover;background-position:center;-webkit-mask-image:linear-gradient(90deg,transparent,#000 30%);mask-image:linear-gradient(90deg,transparent,#000 30%)}' +
    '#drBan .tx{position:absolute;left:14px;top:12px;width:58%}#drBan .t{font-size:11px;font-weight:900;letter-spacing:3px;color:#ffb38a}' +
    '#drBan b.n{display:block;font-size:28px;font-weight:900;margin:2px 0 3px;letter-spacing:.5px}#drBan small{display:block;font-size:12.5px;line-height:1.3;opacity:.93}' +
    '#drBan .c{position:absolute;left:14px;bottom:10px;display:flex;align-items:center;gap:8px;font-size:13px}#drBan .x{position:absolute;right:8px;top:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:17px;z-index:2}' +
    '.drSt{display:flex}.drSt img,.drSt i{width:22px;height:22px;border-radius:50%;border:2px solid #3a0d0d;margin-left:-7px;display:block;object-fit:cover;background:#6b5cf0}.drSt>:first-child{margin-left:0}' +
    '#drOv{position:fixed;inset:0;z-index:2147482100;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}' +
    '#drOv .bx{width:100%;max-width:440px;max-height:92vh;overflow-y:auto;background:#1a0f2e;border-radius:22px;color:#fff;font-family:system-ui,Roboto,sans-serif;position:relative}' +
    '#drOv .tp{position:relative;height:200px;background:radial-gradient(circle at 50% 60%,#ff5a1f 0,#7c1d1d 38%,#140a33 78%);background-size:cover;background-position:center}' +
    '#drOv .tp .sh{position:absolute;left:0;right:0;bottom:0;padding:40px 14px 10px;text-align:center;background:linear-gradient(transparent,rgba(10,4,24,.92))}' +
    '#drOv .tp b{display:block;font-size:30px;letter-spacing:2px;font-weight:900}#drOv .tp small{font-size:13px;opacity:.9}' +
    '#drOv .cl{position:absolute;right:10px;top:8px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:20px;z-index:2;cursor:pointer}' +
    '#drOv .cnt{text-align:center;margin-top:14px;font-size:36px;font-weight:900}#drOv .cnt small{display:block;font-size:14px;opacity:.75;font-weight:400}' +
    '#drOv .go{display:block;width:calc(100% - 28px);margin:14px;border:0;border-radius:14px;padding:14px;font-size:18px;font-weight:900;color:#1a0500;background:linear-gradient(180deg,#ffb347,#ff6a1f);cursor:pointer}' +
    '#drOv .go.on{background:#2a1d45;color:#ffb38a;border:2px solid #ff7a3d}' +
    '#drOv .ls{margin:4px 14px 16px}#drOv .ls h4{margin:0 0 8px;font-size:13px;opacity:.75;letter-spacing:1px}' +
    '#drOv .it{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #2a1d45;font-size:14px}#drOv .it span{opacity:.6;font-size:12px;margin-left:auto;white-space:nowrap}' +
    '#drOv .k{width:26px;height:26px;flex:none;border-radius:50%;background:#2a1d45;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}#drOv .g .k{background:#ffd34d;color:#1a0500}' +
    '#drOv .bdg{border:1px solid #ff7a3d;color:#ffb38a;border-radius:8px;padding:1px 6px;font-size:11px;white-space:nowrap}' +
    '#drOv .ad{margin:0 14px 16px;padding:10px;border:1px dashed #6d5cf0;border-radius:14px}#drOv .ad b{display:block;font-size:12px;letter-spacing:1px;opacity:.75;margin-bottom:6px}' +
    '#drOv .ds{margin:2px 18px 4px;font-size:14px;line-height:1.5;opacity:.88;text-align:center}' +
    '#drOv .cmI{display:flex;gap:6px;margin:0 0 10px}#drOv .cmI input{flex:1;min-width:0;border:1px solid #3a2d5a;border-radius:12px;padding:10px;background:#120a22;color:#fff;font-size:14px}#drOv .cmI button{border:0;border-radius:12px;padding:0 14px;background:#ff7a3d;color:#1a0500;font-weight:800}' +
    '#drOv .cm{padding:9px 0;border-bottom:1px solid #2a1d45}#drOv .cm .hd{display:flex;align-items:center;gap:8px;font-size:13px}#drOv .cm .hd b{font-size:13.5px}#drOv .cm .hd span{opacity:.55;font-size:11.5px}' +
    '#drOv .cm .lk{margin-left:auto;border:0;background:#2a1d45;color:#ffb38a;border-radius:10px;padding:3px 9px;font-size:13px;cursor:pointer}#drOv .cm .lk.on{background:#ff7a3d;color:#1a0500}' +
    '#drOv .cm .del{border:0;background:none;color:#ff8a8a;font-size:12px;cursor:pointer}#drOv .cm p{margin:4px 0 0;font-size:14px;line-height:1.4;word-break:break-word}' +
    '#drOv .av{width:30px;height:30px;flex:none;border-radius:50%;object-fit:cover;background:#3a2d5a;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff}' +
    '#drOv .cm .av{width:34px;height:34px}#drOv .cm{display:flex;gap:9px;align-items:flex-start}#drOv .cm .bd{flex:1;min-width:0}' +
    '#drOv .it.me{background:rgba(255,122,61,.12);border:1px solid #ff7a3d;border-radius:12px;padding:7px 8px;margin:2px -9px}' +
    '#drOv .cm .q{margin:4px 0 0;padding:4px 8px;border-left:3px solid #ff7a3d;background:rgba(255,255,255,.05);border-radius:6px;font-size:12px;opacity:.85;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}' +
    '#drOv .cm .ac{display:flex;gap:6px;margin-top:6px;align-items:center}#drOv .cm .ac button{border:0;background:#2a1d45;color:#d8c8ff;border-radius:10px;padding:3px 9px;font-size:12px;cursor:pointer}' +
    '#drOv .cm .pn{font-size:11px;color:#ffb38a;font-weight:800}#drOv .cm.pinned{background:rgba(255,122,61,.07);border-radius:12px;padding:9px 8px;margin:0 -8px}' +
    '#drOv .rp{display:flex;align-items:center;gap:6px;margin:0 0 6px;padding:6px 9px;border-left:3px solid #ff7a3d;background:#120a22;border-radius:8px;font-size:12.5px}#drOv .rp span{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;opacity:.85}#drOv .rp button{border:0;background:none;color:#fff;font-size:16px}' +
    '#drOv .ad button{border:0;border-radius:10px;padding:9px 12px;margin:3px;background:#262b66;color:#fff;font-size:14px}';
  document.head.appendChild(st);
  function api(path, body) {
    return fetch(path, body ? { method: 'POST', headers: hd(), body: JSON.stringify(body) } : { headers: hd() }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function setS(j) { j._t = Date.now(); S = j; }
  function load(cb) { api('/api/dragon').then(function (j) { if (j && !j.error) { setS(j); paint(); } if (cb) cb(); }); }
  function img(k) { return S && S[k] ? '/api/dragon/img?k=' + k + '&v=' + S.v : ''; }
  function avs(n) { return '<span class="drSt">' + ((S && S.recent) || []).slice(0, n || 4).map(function (id) { return '<img src="/api/av/' + encodeURIComponent(id) + '" onerror="this.outerHTML=\'<i></i>\'">'; }).join('') + '</span>'; }
  function av(id, name) {   // profil rasmi, bo'lmasa — ismning bosh harfi
    var L = esc(((String(name || '').match(/[A-Za-z\u0400-\u04FF0-9]/) || ['?'])[0]).toUpperCase()), cols = ['#6b5cf0', '#e5484d', '#22a06b', '#d97706', '#0ea5e9', '#a855f7'], c = cols[(parseInt(String(id).slice(-3), 10) || 0) % cols.length];
    return '<img class="av" src="/api/av/' + encodeURIComponent(id) + '" onerror="this.outerHTML=\'<i class=&quot;av&quot; style=&quot;background:' + c + ';font-style:normal&quot;>' + L + '</i>\'">';
  }
  function ago(at) {
    var now = Date.now() + ((S && S.now) ? S.now - S._t : 0), m = Math.floor((now - at) / 60000);
    if (m < 1) return 'hozirgina'; if (m < 60) return m + ' daqiqa oldin';
    var hh = Math.floor(m / 60); if (hh < 24) return hh + ' soat oldin';
    var dd = Math.floor(hh / 24); if (dd < 7) return dd + ' kun oldin';
    var d = new Date(at + 5 * 3600e3); return d.getUTCDate() + '-' + ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'][d.getUTCMonth()];
  }
  function hidden() { try { return localStorage.getItem('drHide') === new Date().toISOString().slice(0, 10); } catch (e) { return false; } }
  // 🏠 bosh sahifa banneri
  function banner() {
    var hero = $('hzHero'); if (!hero || !S) return;
    var b = $('drBan');
    if (hidden()) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div'); b.id = 'drBan';
      b.onclick = function (e) { if (e.target && e.target.getAttribute && e.target.getAttribute('data-x')) { e.stopPropagation(); try { localStorage.setItem('drHide', new Date().toISOString().slice(0, 10)); } catch (x) {} b.remove(); return; } openOv(); };
    }
    var pz = $('hxPz');
    if (pz && pz.parentNode === hero) { if (pz.nextSibling !== b) hero.insertBefore(b, pz.nextSibling); } else if (b.parentNode !== hero) hero.appendChild(b);
    var w = img('wide') || img('sq');
    var h = (w ? '<div class="im" style="background-image:url(&quot;' + w + '&quot;)"></div>' : '') + '<div class="x" data-x="1">×</div>' +
      '<div class="tx"><div class="t">TEZ KUNDA</div><b class="n">DragonBOT</b><small>' + SUB + '</small></div>' +
      '<div class="c">' + avs(4) + '<span><b>' + fmt(S.n) + '</b> kishi kutmoqda</span></div>';
    if (b._h !== h) { b.innerHTML = h; b._h = h; }
  }
  // 🤖 botlar ro'yxatidagi qator (navbar.js chaqiradi)
  window.spDragonRow = function (closeSheet) {
    var r = document.createElement('div'); r.className = 'r'; r.style.cssText = 'border:2px solid #ff7a3d;border-radius:14px;background:linear-gradient(135deg,#3a0d0d,#7c1d1d 55%,#1f0a3a)';
    var sq = img('sq');
    r.innerHTML = (sq ? '<img src="' + sq + '" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none">' : '<i style="width:52px;height:52px;border-radius:50%;flex:none;background:radial-gradient(circle,#ffb347,#b91c1c);display:block"></i>') +
      '<div class="n"><b>Dragon<em>BOT</em> <span style="background:#ff7a3d;color:#1a0500;border-radius:7px;padding:1px 6px;font-size:11px;font-weight:900;vertical-align:middle">TEZ KUNDA</span></b><small>' + (S ? fmt(S.n) + ' kishi kutmoqda' : 'Yangi avlod boti') + '</small></div>' +
      '<button style="background:transparent!important;box-shadow:none!important;border:2px solid #ff7a3d!important;color:#ffb38a!important">Qulf</button>';
    r.onclick = function () { if (closeSheet) closeSheet(); openOv(); };
    return r;
  };
  // 🐉 kutayotganlar oynasi
  function openOv() { if (!ov) { ov = document.createElement('div'); ov.id = 'drOv'; ov.onclick = function (e) { if (e.target === ov) closeOv(); }; document.body.appendChild(ov); } render(); load(); }
  function closeOv() { if (ov) { ov.remove(); ov = null; } }
  function render() {
    if (!ov) return;
    var s = S || { n: 0, first: [], me: false };
    var w = img('wide') || img('sq');
    var h = '<div class="bx"><div class="cl" data-c="1">×</div><div class="tp"' + (w ? ' style="background-image:url(&quot;' + w + '&quot;)"' : '') + '><div class="sh"><b>DragonBOT</b><small>' + SUB + '. Tez kunda ShashkaPRO’da</small></div></div>' +
      '<div class="cnt">' + fmt(s.n) + '<small>kishi kutmoqda</small></div>' + (s.desc ? '<div class="ds">' + esc(s.desc) + '</div>' : '') +
      '<button class="go' + (s.me ? ' on' : '') + '" data-t="1">' + (busy ? '…' : s.me ? 'Siz kutyapsiz · ' + s.my + '-o‘rin (bekor qilish)' : 'Men ham kutaman') + '</button>';
    if (s.first && s.first.length) {
      h += '<div class="ls"><h4>BIRINCHI KUTGANLAR</h4>' + s.first.map(function (x) {
        return '<div class="it' + (x.i <= 3 ? ' g' : '') + (x.mine ? ' me' : '') + '"><div class="k">' + x.i + '</div>' + av(x.uid, x.name) + esc(x.name) + (x.i <= 100 ? ' <em class="bdg" style="font-style:normal">Birinchi 100</em>' : '') + '<span>' + ago(x.at) + '</span></div>';
      }).join('') + '</div>';
    }
    h += '<div class="ls"><h4>IZOHLAR' + ((s.cm || []).length ? ' · ' + s.cm.length : '') + '</h4>' +
      (rep ? '<div class="rp"><span>Javob: <b>' + esc(rep.name) + '</b> — ' + esc(rep.t) + '</span><button data-rx="1">×</button></div>' : '') +
      '<div class="cmI"><input id="drC" maxlength="120" placeholder="' + (rep ? 'Javobingiz…' : 'Izoh yozing…') + '" value="' + esc(draft) + '"><button data-cs="1">Yuborish</button></div>' +
      ((s.cm || []).map(function (c) {
        return '<div class="cm' + (c.pin ? ' pinned' : '') + '">' + av(c.uid, c.name) + '<div class="bd"><div class="hd"><b>' + esc(c.name) + '</b><span>' + ago(c.at) + '</span>' + (c.pin ? '<em class="pn" style="font-style:normal">Mahkamlangan</em>' : '') + '</div>' +
          (c.re ? '<div class="q"><b>' + esc(c.re.name) + ':</b> ' + esc(c.re.t) + '</div>' : '') + '<p>' + esc(c.t) + '</p>' +
          '<div class="ac"><button data-rp="' + esc(c.id) + '">Javob berish</button><button class="lk' + (c.liked ? ' on' : '') + '" data-lk="' + esc(c.id) + '" style="margin-left:0">♥ ' + c.n + '</button>' +
          (s.admin ? '<button data-pn="' + esc(c.id) + '">' + (c.pin ? 'Yechish' : 'Mahkamlash') + '</button>' : '') +
          (s.admin || c.mine ? '<button class="del" data-cd="' + esc(c.id) + '">o‘chirish</button>' : '') + '</div></div></div>';
      }).join('') || '<div style="opacity:.6;font-size:13px;padding:6px 0">Hali izoh yo‘q — birinchi bo‘ling</div>') + '</div>';
    if (s.admin) h += '<div class="ad"><b>ADMIN</b><button data-a="ds">Tavsifni tahrirlash</button><button data-a="sq">Avatar rasmi (kvadrat)</button><button data-a="wide">Keng rasm</button><button data-a="nt">Kutganlarga xabar yuborish</button><input type="file" accept="image/*" id="drF" style="display:none"></div>';
    ov.innerHTML = h + '</div>';
    ov.querySelector('[data-c]').onclick = closeOv;
    ov.querySelector('[data-t]').onclick = function () { if (busy) return; busy = true; render(); api('/api/dragon/toggle', {}).then(function (j) { busy = false; if (j && !j.error) { setS(j); paint(); } render(); try { Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {} }); };
    var inp = ov.querySelector('#drC'); inp.oninput = function () { draft = inp.value; };
    var cs = function () { var v = inp.value; if (!v.trim()) return; api('/api/dragon/comment', { text: v, re: rep ? rep.id : '' }).then(function (j) { if (j && !j.error) { setS(j); draft = ''; rep = null; render(); } else alert((j && j.error) || 'Xato'); }); };
    var rx = ov.querySelector('[data-rx]'); if (rx) rx.onclick = function () { rep = null; render(); };
    [].forEach.call(ov.querySelectorAll('[data-rp]'), function (b) { b.onclick = function () { var id = b.getAttribute('data-rp'), c = (S.cm || []).filter(function (x) { return x.id === id; })[0]; if (!c) return; rep = { id: id, name: c.name, t: c.t.slice(0, 60) }; render(); var i = ov.querySelector('#drC'); if (i) { i.focus(); i.scrollIntoView({ block: 'center' }); } }; });
    [].forEach.call(ov.querySelectorAll('[data-pn]'), function (b) { b.onclick = function () { api('/api/dragon/pin', { id: b.getAttribute('data-pn') }).then(function (j) { if (j && !j.error) { setS(j); render(); } }); }; });
    ov.querySelector('[data-cs]').onclick = cs;
    ov.querySelector('#drC').onkeydown = function (e) { if (e.key === 'Enter') cs(); };
    [].forEach.call(ov.querySelectorAll('[data-lk]'), function (b) { b.onclick = function () { api('/api/dragon/like', { id: b.getAttribute('data-lk') }).then(function (j) { if (j && !j.error) { setS(j); render(); } }); }; });
    [].forEach.call(ov.querySelectorAll('[data-cd]'), function (b) { b.onclick = function () { if (!confirm('Izoh o‘chirilsinmi?')) return; api('/api/dragon/cdel', { id: b.getAttribute('data-cd') }).then(function (j) { if (j && !j.error) { setS(j); render(); } }); }; });
    if (s.admin) {
      ov.querySelector('[data-a="ds"]').onclick = function () { var t = prompt('DragonBOT tavsifi (400 belgigacha):', s.desc || ''); if (t == null) return; api('/api/dragon/desc', { text: t }).then(function (j) { if (j && !j.error) { setS(j); render(); } }); };
      var f = ov.querySelector('#drF'), kind = 'sq';
      [].forEach.call(ov.querySelectorAll('[data-a="sq"],[data-a="wide"]'), function (b) { b.onclick = function () { kind = b.getAttribute('data-a'); f.value = ''; f.click(); }; });
      f.onchange = function () { var fl = f.files && f.files[0]; if (fl) upload(fl, kind); };
      ov.querySelector('[data-a="nt"]').onclick = function () {
        var t = prompt('Kutganlarga yuboriladigan xabar (' + s.n + ' kishi):', 'DragonBOT chiqdi! Endi u bilan o‘ynashingiz mumkin.'); if (!t) return;
        api('/api/dragon/notify', { text: t }).then(function (j) { alert(j && j.ok ? j.n + ' kishiga yuborilmoqda' : (j && j.error) || 'Xato'); });
      };
    }
  }
  function upload(file, kind) {
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var cv = document.createElement('canvas'), x = 0, y = 0, w = im.width, h = im.height;
        if (kind === 'sq') { var m = Math.min(w, h); x = (w - m) / 2; y = (h - m) / 2; w = h = m; cv.width = cv.height = Math.min(512, m); }
        else { var sc = Math.min(1, 1280 / w); cv.width = Math.round(w * sc); cv.height = Math.round(h * sc); }
        cv.getContext('2d').drawImage(im, x, y, w, h, 0, 0, cv.width, cv.height);
        api('/api/dragon/setimg', { k: kind, data: cv.toDataURL('image/jpeg', 0.86) }).then(function (j) { if (j && !j.error) { S = j; paint(); render(); } else alert((j && j.error) || 'Yuklab bo‘lmadi'); });
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function paint() { banner(); if (ov && !(document.activeElement && document.activeElement.id === 'drC')) render(); }
  load();
  setInterval(function () { if ($('hzHero') && !$('drBan') && S) banner(); }, 1500);
  setInterval(function () { if (document.visibilityState === 'visible') load(); }, 60000);
  window.spDragon = openOv;
})();
