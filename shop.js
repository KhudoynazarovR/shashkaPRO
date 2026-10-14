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
    if (!S.equipped || !S.list.some(function (x) { return x.id === S.equipped; })) return;
    var id = S.equipped, B = 'html body #board .sq .pc';
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
    var own = S.owned.indexOf(it.id) >= 0, eq = S.equipped === it.id;
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
    if (S.admin) h += '<button data-a="del" data-id="' + it.id + '" style="' + BG + ';width:92%">🗑 O‘chirish</button>';
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
      api('/api/shop/equip', { id: S.equipped === id ? '' : id }).then(function (d) {
        if (d && d.ok) { S.equipped = d.equipped; applyEq(); msg = d.equipped ? '✅ Dona doskada qo‘llandi' : 'Standart dona qaytdi'; } else msg = '⚠️ ' + ((d && d.error) || 'Xato');
        draw();
      });
    } else if (a === 'sh') {
      var u = S.link + '?startapp=shop_' + id, sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent('💎 Shashka donasi: ' + it.name);
      if (tg && tg.openTelegramLink) tg.openTelegramLink(sh); else window.open(sh, '_blank');
    } else if (a === 'del') {
      if (!confirm('Dona o‘chirilsinmi?')) return;
      api('/api/shop/del', { id: id }).then(reload).then(draw);
    }
  }

  function drawForm() {
    var h = head() + '<div style="font-size:17px;font-weight:700;margin-bottom:8px">➕ Yangi dona</div>';
    h += '<input id="fN" maxlength="30" placeholder="Nomi" value="' + esc(form.name) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<input id="fP" type="number" min="0" placeholder="Narxi (💎)" value="' + esc(form.price) + '" style="width:92%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #333a80;background:#161a3a;color:#fff;font-size:16px">';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">';
    KS.forEach(function (k) {
      var pv = form.pics[k] ? '<img src="' + form.pics[k] + '" style="width:64px;height:64px;border-radius:50%">' : '<div style="width:64px;height:64px;border-radius:50%;border:2px dashed #555;margin:0 auto"></div>';
      h += '<label style="background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:8px;font-size:13px">' + KN[k] + '<br>' + pv + '<input type="file" accept="image/*" data-k="' + k + '" style="display:none"></label>';
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
  }
  function sync() { var n = ov.querySelector('#fN'), p = ov.querySelector('#fP'); if (n) form.name = n.value; if (p) form.price = p.value; }
  function pick(k, f) {
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var out = '', sz = 200;
        while (sz >= 100) {
          var cv = document.createElement('canvas'); cv.width = cv.height = sz;
          var cx = cv.getContext('2d'); cx.beginPath(); cx.arc(sz / 2, sz / 2, sz / 2, 0, 6.2832); cx.clip();
          var m = Math.min(im.width, im.height), sx = (im.width - m) / 2, sy = (im.height - m) / 2;
          cx.drawImage(im, sx, sy, m, m, 0, 0, sz, sz);
          out = cv.toDataURL('image/webp', 0.85);
          if (out.length <= 140000) break;
          sz -= 30;
        }
        if (out.length > 150000) { msg = '⚠️ Rasm juda og‘ir'; return draw(); }
        form.pics[k] = out; msg = ''; draw();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  function saveForm() {
    sync();
    var nm = form.name.trim(), pr = Number(form.price);
    if (!nm) { msg = 'Nom yozing'; return draw(); }
    if (!Number.isInteger(pr) || pr < 0) { msg = 'Narx butun son bo‘lsin'; return draw(); }
    if (KS.some(function (k) { return !form.pics[k]; })) { msg = '4 ta rasmni ham tanlang'; return draw(); }
    msg = 'Saqlanmoqda…'; draw();
    api('/api/shop/add', { name: nm, price: pr, imgs: form.pics }).then(function (d) {
      if (d && d.ok) { form = null; msg = '✅ Dona qo‘shildi'; return reload().then(draw); }
      msg = '⚠️ ' + ((d && d.error) || 'Saqlanmadi'); draw();
    }).catch(function () { msg = '⚠️ Server bilan aloqa yo‘q'; draw(); });
  }

  window.spShop = open;
  var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (sp && sp.indexOf('shop_') === 0) setTimeout(open, 700);
  else if (initData) setTimeout(function () { api('/api/shop').then(function (d) { if (d && !d.error) merge(d); }).catch(function () {}); }, 900);
})();
