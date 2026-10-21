/* SHARECARD — natijani chiroyli rasm qilib ulashish (Story / chat / saqlash).
   window.spShareCard({ theme, title, big, unit, sub, sub2, badge, cap })
   theme: win | rush | battle | pzt | streak */
;(function () {
  if (window.spShareCard) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = (tg && tg.initData) || '';
  var TH = {
    win:    ['#1b1464', '#5b2bb5', '#ffcf3f'],
    battle: ['#3a0d2e', '#b3263e', '#ffcf3f'],
    rush:   ['#2a1300', '#d9531e', '#ffe08a'],
    pzt:    ['#06392f', '#0f8a63', '#ffcf3f'],
    streak: ['#3b0a00', '#e8590c', '#ffe08a']
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function me() { try { return tg.initDataUnsafe.user || {}; } catch (e) { return {}; } }
  function botName() { var l = window.TG_APP_LINK || 'https://t.me/DraughtsPRObot/play', m = /t\.me\/([^/?]+)/.exec(l); return m ? '@' + m[1] : '@DraughtsPRObot'; }
  function loadImg(src) { return new Promise(function (ok) { if (!src) return ok(null); var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; setTimeout(function () { ok(null); }, 3000); }); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fitText(c, t, max, size, weight) { var s = size; do { c.font = weight + ' ' + s + 'px system-ui,-apple-system,Roboto,"Segoe UI",sans-serif'; s -= 4; } while (c.measureText(t).width > max && s > 20); }

  function draw(o) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d'), th = TH[o.theme] || TH.win, gold = th[2], u = me();
    var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // nur
    var rg = c.createRadialGradient(W / 2, 520, 40, W / 2, 520, 620); rg.addColorStop(0, 'rgba(255,255,255,.22)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    // pastda shashka taxtasi naqshi
    c.save(); c.globalAlpha = .10; var cs = 90;
    for (var r = 0; r < 4; r++) for (var k = 0; k < 12; k++) if ((r + k) % 2) { c.fillStyle = '#fff'; c.fillRect(k * cs, H - 360 + r * cs, cs, cs); }
    c.restore();
    // logotip
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '900 64px system-ui,Roboto,sans-serif'; var t1 = 'Shashka', t2 = 'PRO', w1 = c.measureText(t1).width, w2 = c.measureText(t2).width, x0 = W / 2 - (w1 + w2) / 2;
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(t1, x0, 120); c.fillStyle = gold; c.fillText(t2, x0 + w1, 120); c.textAlign = 'center';
    // sarlavha lentasi
    if (o.title) { fitText(c, o.title, 900, 76, '900'); c.fillStyle = gold; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 18; c.fillText(o.title, W / 2, 250); c.shadowBlur = 0; }
    // katta belgi / raqam
    var big = String(o.big == null ? '' : o.big);
    if (big) {
      var isNum = /^[0-9:.+\/ -]+$/.test(big);
      c.font = (isNum ? '900 230px ' : '170px ') + 'system-ui,Roboto,"Apple Color Emoji","Noto Color Emoji",sans-serif';
      if (isNum) fitText(c, big, 920, 230, '900');
      c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30; c.fillText(big, W / 2, isNum ? 560 : 520); c.shadowBlur = 0;
    }
    if (o.unit) { fitText(c, o.unit, 900, 50, '800'); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillText(o.unit, W / 2, 640); }
    if (o.badge) {
      c.font = '900 44px system-ui,Roboto,sans-serif'; var bw = c.measureText(o.badge).width + 70;
      rr(c, W / 2 - bw / 2, 680, bw, 76, 38); c.fillStyle = gold; c.fill(); c.fillStyle = '#2a1600'; c.fillText(o.badge, W / 2, 733);
    }
    if (o.sub) { fitText(c, o.sub, 940, 46, '700'); c.fillStyle = '#fff'; c.fillText(o.sub, W / 2, o.badge ? 830 : 760); }
    if (o.sub2) { fitText(c, o.sub2, 940, 40, '600'); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText(o.sub2, W / 2, o.badge ? 890 : 820); }
    return { cv: cv, c: c, W: W, H: H, gold: gold, u: u };
  }
  function finish(d, av) {
    var c = d.c, W = d.W, H = d.H, u = d.u, name = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || u.username || 'O‘yinchi';
    // o'yinchi
    var y = 960, R = 62;
    c.save(); c.beginPath(); c.arc(W / 2, y + R, R + 6, 0, 7); c.fillStyle = d.gold; c.fill(); c.beginPath(); c.arc(W / 2, y + R, R, 0, 7); c.clip();
    if (av) c.drawImage(av, W / 2 - R, y, R * 2, R * 2); else { c.fillStyle = '#1f4fd6'; c.fillRect(W / 2 - R, y, R * 2, R * 2); c.fillStyle = '#fff'; c.font = '900 64px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText(name.charAt(0).toUpperCase(), W / 2, y + R + 22); }
    c.restore(); c.textAlign = 'center';
    fitText(c, name, 800, 44, '800'); c.fillStyle = '#fff'; c.fillText(name, W / 2, y + R * 2 + 62);
    // chaqiriq paneli
    rr(c, 70, H - 200, W - 140, 140, 34); c.fillStyle = 'rgba(0,0,0,.38)'; c.fill();
    c.fillStyle = d.gold; c.font = '900 46px system-ui,Roboto,sans-serif'; c.fillText('Meni yenga olasanmi? 😎', W / 2, H - 132);
    c.fillStyle = '#fff'; c.font = '700 38px system-ui,Roboto,sans-serif'; c.fillText('Telegramda: ' + botName(), W / 2, H - 82);
    return d.cv.toDataURL('image/jpeg', 0.86);
  }
  window.spShareRender = function (o) { // test va oldindan ko'rish uchun
    var d = draw(o || {}), u = d.u;
    return loadImg(u.id ? '/api/av/' + encodeURIComponent(u.id) : null).then(function (av) { return finish(d, av); });
  };

  function css() {
    if (document.getElementById('shCss')) return;
    var s = document.createElement('style'); s.id = 'shCss';
    s.textContent = '#shOv{position:fixed;inset:0;z-index:2147483001;background:rgba(5,4,20,.82);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,Roboto,sans-serif}' +
      '#shOv .bx{width:100%;max-width:480px;background:#1a1650;border-radius:22px 22px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px));color:#fff;box-sizing:border-box;max-height:96vh;overflow:auto}' +
      '#shOv .hd{display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:19px;margin-bottom:10px}' +
      '#shOv .hd button{border:0;background:#352d86;color:#fff;border-radius:12px;width:40px;height:40px;font-size:18px}' +
      '#shOv img{display:block;width:62%;margin:0 auto 12px;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.5)}' +
      '#shOv .bt{display:block;width:100%;border:0;border-radius:14px;padding:14px;margin-top:8px;font:800 17px system-ui,Roboto,sans-serif;color:#fff;background:#352d86;box-shadow:0 3px 0 #0e0b30}' +
      '#shOv .bt.p{background:linear-gradient(90deg,#f58529,#dd2a7b,#8134af);box-shadow:0 3px 0 #4a1550}' +
      '#shOv .bt.g{background:#2aabee;box-shadow:0 3px 0 #136a94}' +
      '#shOv .bt:disabled{opacity:.5}#shOv .ms{text-align:center;font-size:14px;color:#c9c6f5;margin-top:8px;min-height:18px}';
    document.head.appendChild(s);
  }
  function toast(t) { var m = document.querySelector('#shOv .ms'); if (m) m.textContent = t; }

  window.spShareCard = function (o) {
    o = o || {}; css();
    var old = document.getElementById('shOv'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'shOv';
    ov.innerHTML = '<div class="bx"><div class="hd"><span>📸 Natijani ulashish</span><button id="shX">✕</button></div><div id="shPv" style="text-align:center;padding:30px 0;color:#c9c6f5">⏳ Rasm tayyorlanmoqda…</div>' +
      '<button class="bt p" id="shStory" disabled>📲 Storyga joylash</button><button class="bt g" id="shChat" disabled>💬 Chat yoki guruhga yuborish</button><button class="bt" id="shSave" disabled>⬇️ Rasmni saqlash</button><div class="ms"></div></div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    ov.querySelector('#shX').onclick = function () { ov.remove(); };
    var up = null, cap = o.cap || 'ShashkaPRO';
    window.spShareRender(o).then(function (data) {
      ov.querySelector('#shPv').outerHTML = '<img src="' + data + '" alt="">';
      return fetch('/api/share/img', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: JSON.stringify({ img: data, cap: cap }) }).then(function (r) { return r.json(); });
    }).then(function (x) {
      if (!x || !x.ok) { toast('Rasmni yuklab bo‘lmadi' + (x && x.error ? ' (' + x.error + ')' : '')); return; }
      up = x;
      var sS = ov.querySelector('#shStory'), sC = ov.querySelector('#shChat'), sV = ov.querySelector('#shSave');
      sC.disabled = false; sV.disabled = false;
      if (tg && tg.shareToStory && tg.isVersionAtLeast && tg.isVersionAtLeast('7.8')) sS.disabled = false; else sS.style.display = 'none';
      sS.onclick = function () { try { tg.shareToStory(up.url, { text: (cap + ' ' + botName()).slice(0, 200) }); } catch (e) { toast('Story ochilmadi'); } };
      sC.onclick = function () {
        if (up.pid && tg && tg.shareMessage) { try { tg.shareMessage(up.pid, function (ok) { if (ok) toast('✅ Yuborildi'); }); return; } catch (e) {} }
        var l = 'https://t.me/share/url?url=' + encodeURIComponent(up.link || up.url) + '&text=' + encodeURIComponent(cap);
        try { tg.openTelegramLink(l); } catch (e) { window.open(l, '_blank'); }
      };
      sV.onclick = function () {
        if (tg && tg.downloadFile && tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) { try { tg.downloadFile({ url: up.url, file_name: 'shashkapro.jpg' }); return; } catch (e) {} }
        try { tg.openLink(up.url); } catch (e) { window.open(up.url, '_blank'); }
      };
    }).catch(function () { toast('Server bilan aloqa yo‘q'); });
  };
})();
