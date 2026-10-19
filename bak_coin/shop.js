(function () {
  if (window.spShop) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var BS = 'border:0;border-radius:12px;padding:9px 12px;background:#6b5cf0;color:#fff;font-size:14px;margin:3px';
  var BG = 'border:0;border-radius:12px;padding:9px 12px;background:#262b66;color:#fff;font-size:14px;margin:3px';
  var BO = 'border:0;border-radius:12px;padding:9px 12px;background:linear-gradient(90deg,#f59e0b,#ea580c);color:#fff;font-size:14px;margin:3px';
  var KS = ['w', 'b', 'wk', 'bk'], KN = { w: 'Oq', b: 'Qora', wk: 'Oq damka', bk: 'Qora damka' };
  var ov = null, S = { list: [], owned: [], equipped: '', diamonds: 0, admin: false, link: '' }, tab = 'app', msg = '', form = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
  }
  function imgUrl(id, k) { return '/api/shop/img?id=' + encodeURIComponent(id) + '&k=' + k; }
  function applyEq() {
    var o = document.getElementById('spShopCss'); if (o) o.remove();
    var eqId = S.equipped === '-' ? '' : (S.equipped || S.def || ''); window.spEqId = eqId; if (!eqId || !S.list.some(function (x) { return x.id === eqId; })) return;
    var id = eqId, B = 'html body #board[data-th][data-ps] .sq .pc';
    var css = B + '::before,' + B + '::after{display:none!important}'
      + B + '{background-color:transparent!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 3px 2px #0007)}'
      + B + '.w{background-image:url("' + imgUrl(id, 'w') + '")!important}'
      + B + '.b{background-image:url("' + imgUrl(id, 'b') + '")!important}'
      + B + '.w.k{background-image:url("' + imgUrl(id, 'wk') + '")!important}'
      + B + '.b.k{background-image:url("' + imgUrl(id, 'bk') + '")!important}';
    var st = document.createElement('style'); st.id = 'spShopCss'; st.textContent = css; document.head.appendChild(st);
  }
  function merge(d) { S = d; applyEq(); }

  function open() {
    var old = document.getElementById('spShop'); if (old) old.remove();
    ov = document.createElement('div'); ov.id = 'spShop';
    ov.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9500;background:#0b0e1a;color:#fff;overflow-y:auto;padding:14px;box-sizing:border-box;font-family:inherit;text-align:center';
    document.body.appendChild(ov);
    form = null; msg = '';
    ov.innerHTML = '<div style="padding:30px;opacity:.7">Yuklanmoqda…</div>';
    api('/api/shop').then(function (d) {
      if (d.error) { ov.innerHTML = '<div style="padding:30px">Telegram orqali kiring</div>'; return; }
      merge(d); draw();
    }).catch(function () { ov.innerHTML = '<div style="padding:30px">Server bilan aloqa yo‘q</div>'; });
  }
  function close() { if (ov) ov.remove(); }
  function head() {
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;margin-bottom:12px"><span>💎 Tosh do‘koni</span><span style="font-size:15px">💎 ' + (S.diamonds || 0) + ' <button id="shBack" style="' + BG + '">⬅️</button></span></div>';
  }
  function card(it) {
    var own = S.owned.indexOf(it.id) >= 0 || !!it.def, eq = (S.equipped === '-' ? '' : (S.equipped || S.def)) === it.id;
    var h = '<div style="background:#161a3a;border:1px solid #262b5a;border-radius:16px;padding:10px"><b style="font-size:13px">' + esc(it.name) + '</b>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;aspect-ratio:1;margin:8px 0;border-radius:10px;overflow:hidden">';
    KS.forEach(function (k, i) {
      var dark = (i === 1 || i === 2);
      h += '<div style="background:' + (dark ? '#b58863' : '#f0d9b5') + " center/78% no-repeat url('" + imgUrl(it.id, k) + "')\"></div>";
    });
    h += '</div><div style="font-size:13px;opacity:.8">💎 ' + it.price + ' · 🛒 ' + (it.sold || 0) + '</div>';
    if (own) h += '<button data-a="eq" data-id="' + it.id + '" style="' + (eq ? BS : BG) + ';width:92%">' + (eq ? '✅ Tanlangan' : 'Tanlash') + '</button>';
    else h += '<button data-a="buy" data-id="' + it.id + '" style="' + BO + ';width:92%">🛒 Sotib olish</button>';
    if (S.link) h += '<button data-a="sh" data-id="' + it.id + '" style="' + BG + ';width:92%">🔗 Ulashish</button>';
    if (S.admin) h += '<button data-a="def" data-id="' + it.id + '" style="' + BG + ';width:92%">' + (it.def ? '⭐ Asosiy (bekor qilish)' : '⭐ Hamma uchun asosiy') + '</button>'; if (S.admin) h += '<button data-a="del" data-id="' + it.id + '" style="' + BG + ';width:92%">🗑 O‘chirish</button>';
    return h + '</div>';
  }
  function draw() {
    if (form) return drawForm();
    var items = S.list.filter(function (x) { return tab === 'app' ? !x.by : !!x.by; });
    var h = head();
    h += '<div style="display:flex;justify-content:center;margin-bottom:10px"><button data-tab="app" style="' + (tab === 'app' ? BS : BG) + '">🤖 Dastur donalari</button><button data-tab="usr" style="' + (tab === 'usr' ? BS : BG) + '">👥 Userlar donalari</button></div>';
    if (S.admin && tab === 'app') h += '<button id="shNew" style="' + BS + '">➕ Yangi dona</button>';
    if (msg) h += '<div style="margin:8px 0;color:#ffd27a">' + esc(msg) + '</div>';
    if (!items.length) h += '<div style="padding:30px;opacity:.7">' + (tab === 'app' ? 'Hozircha dona yo‘q' : 'Userlar donalari tez orada') + '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">' + items.map(card).join('') + '</div>';
    ov.innerHTML = h;
    ov.querySelector('#shBack').onclick = close;
    var nb = ov.querySelector('#shNew'); if (nb) nb.onclick = function () { form = { name: '', price: '150', pics: {} }; msg = ''; draw(); };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-tab]'), function (e) { e.onclick = function () { tab = e.getAttribute('data-tab'); msg = ''; draw(); }; });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-a]'), function (e) { e.onclick = function () { act(e.getAttribute('data-a'), e.getAttribute('data-id')); }; });
  }
  function reload() { return api('/api/shop').then(function (d) { if (!d.error) merge(d); }); }
  function act(a, id) {
    var it = S.list.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    if (a === 'buy') {
      if (!confirm(it.name + ' donasini ' + it.price + ' 💎 ga sotib olasizmi?')) return;
      api('/api/shop/buy', { id: id }).then(function (d) {
        if (d && d.ok) { msg = '✅ Sotib olindi'; return reload(); }
        msg = '⚠️ ' + ((d && d.error) || 'Xato');
      }).then(draw).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
    } else if (a === 'eq') {
      api('/api/shop/equip', { id: ((S.equipped === '-' ? '' : (S.equipped || S.def)) === id) ? '-' : id }).then(function (d) {
        if (d && d.ok) { S.equipped = d.equipped; applyEq(); msg = (d.equipped && d.equipped !== '-') ? '✅ Dona doskada qo‘llandi' : 'Standart dona qaytdi'; } else msg = '⚠️ ' + ((d && d.error) || 'Xato');
        draw();
      });
    } else if (a === 'sh') {
      var u = S.link + '?startapp=shop_' + id, sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent('💎 Shashka donasi: ' + it.name);
      if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
    } else if (a === 'def') {
      api('/api/shop/default', { id: it.def ? '' : id }).then(reload).then(function () { msg = '✅ Saqlandi'; draw(); });
    } else if (a === 'del') {
      if (!confirm('Dona o‘chirilsinmi?')) return;
      api('/api/shop/del', { id: id }).then(reload).then(draw);
    }
  }

  function drawForm() {
    form.src = form.src || {}; form.t = form.t || {};
    var SB = 'border:0;border-radius:10px;padding:7px 11px;background:#262b66;color:#fff;font-size:15px;margin:2px';
    var h = head() + '<div style="font-size:17px;font-weight:700;margin-bottom:8px">➕ Yangi dona</div>';
    h += '<input id="fN" maxlength="30" placeholder="Nomi" value="' + esc(form.name) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<input id="fP" type="number" min="0" placeholder="Narxi (💎)" value="' + esc(form.price) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">';
    KS.forEach(function (k) {
      var has = !!form.src[k], dis = has ? '' : ';opacity:.35';
      h += '<div style="background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:8px;font-size:13px">' + KN[k];
      if (has) h += '<canvas data-c="' + k + '" width="120" height="120" style="display:block;margin:6px auto;width:120px;height:120px;border-radius:50%;background:#222;touch-action:none"></canvas>';
      else h += '<label style="display:flex;width:120px;height:120px;border-radius:50%;border:2px dashed #555;margin:6px auto;align-items:center;justify-content:center;cursor:pointer;font-size:12px;box-sizing:border-box">📷 Rasm tanlang<input type="file" accept="image/*" data-k="' + k + '" style="display:none"></label>';
      h += '<div>' + [['in', '＋'], ['out', '－'], ['rs', '↺'], ['ct', '🎯'], ['cl', '🧽']].map(function (z) {
        return '<button data-z="' + z[0] + '" data-k="' + k + '" style="' + SB + dis + '">' + z[1] + '</button>';
      }).join('') + '</div></div>';
    });
    h += '</div>';
    if (msg) h += '<div style="margin:8px 0;color:#ffb3b3">' + esc(msg) + '</div>';
    h += '<button id="fC" style="' + BG + '">Bekor</button><button id="fS" style="' + BS + '">💾 Saqlash</button>';
    ov.innerHTML = h;
    ov.querySelector('#shBack').onclick = function () { form = null; msg = ''; draw(); };
    ov.querySelector('#fC').onclick = function () { form = null; msg = ''; draw(); };
    ov.querySelector('#fS').onclick = saveForm;
    Array.prototype.forEach.call(ov.querySelectorAll('input[type=file]'), function (inp) {
      inp.onchange = function () { sync(); pick(inp.getAttribute('data-k'), inp.files && inp.files[0]); };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('canvas[data-c]'), function (cv) {
      var k = cv.getAttribute('data-c'), px = 0, py = 0, dn = false;
      paint(k, cv, 120);
      cv.onpointerdown = function (e) { dn = true; px = e.clientX; py = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (x) {} };
      cv.onpointermove = function (e) { if (!dn) return; var t = form.t[k]; t.x += (e.clientX - px) / 120; t.y += (e.clientY - py) / 120; px = e.clientX; py = e.clientY; paint(k, cv, 120); };
      cv.onpointerup = cv.onpointercancel = function () { dn = false; };
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-z]'), function (b) {
      b.onclick = function () {
        sync();
        var k = b.getAttribute('data-k'), z = b.getAttribute('data-z'), t = form.t[k];
        if (!form.src[k]) return;
        if (z === 'in') t.s = Math.min(4, t.s * 1.15);
        else if (z === 'out') t.s = Math.max(0.3, t.s / 1.15);
        else if (z === 'rs') { t.s = 1; t.x = 0; t.y = 0; }
        else if (z === 'ct') { autoCenter(k); }
        else { delete form.src[k]; delete form.t[k]; draw(); return; }
        var cv = ov.querySelector('canvas[data-c="' + k + '"]'); if (cv) paint(k, cv, 120);
      };
    });
  }
  function paint(k, cv, sz) {
    var im = form.src[k], t = form.t[k], cx = cv.getContext('2d');
    cx.clearRect(0, 0, sz, sz); cx.save(); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2, 0, 6.2832); cx.clip();
    var m = Math.min(im.width, im.height), sc = sz / m * t.s, dw = im.width * sc, dh = im.height * sc;
    cx.drawImage(im, sz / 2 - dw / 2 + t.x * sz, sz / 2 - dh / 2 + t.y * sz, dw, dh); cx.restore();
    if (cv.getAttribute('data-c')) { cx.save(); cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(sz / 2, 0); cx.lineTo(sz / 2, sz); cx.moveTo(0, sz / 2); cx.lineTo(sz, sz / 2); cx.stroke(); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2 - 3, 0, 6.2832); cx.strokeStyle = 'rgba(80,220,160,.7)'; cx.stroke(); cx.restore(); }
  }
  function autoCenter(k) {
    var im = form.src[k], N = 200, c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true }), m = Math.min(im.width, im.height), sc = N / m;
    x.drawImage(im, N / 2 - im.width * sc / 2, N / 2 - im.height * sc / 2, im.width * sc, im.height * sc);
    var d = x.getImageData(0, 0, N, N).data, bg = [d[0], d[1], d[2], d[3]], x0 = N, y0 = N, x1 = -1, y1 = -1, i, j;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var p = (j * N + i) * 4, a = d[p + 3];
      var solid = bg[3] < 40 ? a > 40 : (a > 40 && (Math.abs(d[p] - bg[0]) + Math.abs(d[p + 1] - bg[1]) + Math.abs(d[p + 2] - bg[2])) > 60);
      if (solid) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    }
    if (x1 < 0) { msg = 'Donani aniqlab bo‘lmadi, qo‘lda sozlang'; return draw(); }
    var w = x1 - x0 + 1, h = y1 - y0 + 1, mid = [(x0 + x1) / 2, (y0 + y1) / 2], t = form.t[k];
    t.s = Math.max(0.3, Math.min(4, N * 0.92 / Math.max(w, h)));
    t.x = -(mid[0] - N / 2) / N * t.s; t.y = -(mid[1] - N / 2) / N * t.s;
    msg = ''; draw();
  }
  function edgeCut(k) {
    var N = 120, c = document.createElement('canvas'); c.width = c.height = N; paint(k, c, N);
    var d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, N, N).data, cnt = 0, tot = 0, a, i;
    for (a = 0; a < 360; a += 4) {
      var px = Math.round(N / 2 + (N / 2 - 3) * Math.cos(a * Math.PI / 180)), py = Math.round(N / 2 + (N / 2 - 3) * Math.sin(a * Math.PI / 180));
      i = (py * N + px) * 4; tot++; if (d[i + 3] > 200) cnt++;
    }
    return cnt / tot > 0.25;
  }
  function exportK(k) {
    var out = '', sz = 200;
    while (sz >= 100) {
      var cv = document.createElement('canvas'); cv.width = cv.height = sz; paint(k, cv, sz);
      out = cv.toDataURL('image/webp', 0.85);
      if (out.length <= 140000) break;
      sz -= 30;
    }
    return out;
  }
  function sync() { var n = ov.querySelector('#fN'), p = ov.querySelector('#fP'); if (n) form.name = n.value; if (p) form.price = p.value; }
  function pick(k, f) {
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () { form.src[k] = im; form.t[k] = { s: 1, x: 0, y: 0 }; msg = ''; draw(); };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  function saveForm() {
    sync();
    var nm = form.name.trim(), pr = Number(form.price);
    if (!nm) { msg = 'Nom yozing'; return draw(); }
    if (!Number.isInteger(pr) || pr < 0) { msg = 'Narx butun son bo‘lsin'; return draw(); }
    if (KS.some(function (k) { return !form.src[k]; })) { msg = '4 ta rasmni ham tanlang'; return draw(); }
    var cut = KS.filter(function (k) { return edgeCut(k); });
    if (cut.length && !form.warned) { form.warned = true; msg = '⚠️ Qirrasi kesilgan: ' + cut.map(function (k) { return KN[k]; }).join(', ') + '. 🎯 yoki － bilan sozlang. Baribir saqlash uchun yana 💾 bosing.'; return draw(); }
    var pics = {}, bad = false;
    KS.forEach(function (k) { pics[k] = exportK(k); if (pics[k].length > 150000) bad = true; });
    if (bad) { msg = '⚠️ Rasm juda og‘ir'; return draw(); }
    msg = 'Saqlanmoqda…'; draw();
    api('/api/shop/add', { name: nm, price: pr, imgs: pics }).then(function (d) {
      if (d && d.ok) { form = null; msg = '✅ Dona qo‘shildi'; return reload().then(draw); }
      msg = '⚠️ ' + ((d && d.error) || 'Saqlanmadi'); draw();
    }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
  }

  
window.spShop = open;
  var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (sp && sp.indexOf('shop_') === 0) setTimeout(open, 700);
  else if (initData) setTimeout(function () { api('/api/shop').then(function (d) { if (d && !d.error) merge(d); }).catch(function () {}); }, 900);
})();
