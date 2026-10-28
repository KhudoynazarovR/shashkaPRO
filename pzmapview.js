/* pzmapview.js — 🗺 Masalalar xaritasi: har 10 ta masala — bitta manzara (rasm), yo'l bo'ylab bekatlar.
   Odamcha yechilgan masaladan keyingisiga qadam bosib boradi (animatsiya).
   Admin har papka uchun o'z rasmlarini joylaydi va bekatlar joyini barmoq bilan belgilaydi.
   API: spPzMap.load(cb), spPzMap.html(items, key, admin), spPzMap.after(root, key, onPlay) */
;(function () {
  if (window.spPzMap) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  function api(p, body) {
    return fetch(p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-init-data': (tg && tg.initData) || '' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  var PER = 10;
  // standart manzaralar (bekatlar — rasm ichidagi %)
  var DEF = [
    { u: '/img/pzzone1.webp?v=1', w: 768, h: 758, pts: [[41.8, 87.6], [62.5, 75.7], [33.9, 68.3], [72.3, 58.4], [52.1, 51.7], [33.5, 39.1], [69.8, 33.7], [36.7, 21.8], [66.0, 15.3], [50.3, 5.6]] },
    { u: '/img/pzzone2.webp?v=1', w: 768, h: 758, pts: [[35.2, 89.1], [68.8, 85.1], [26.9, 64.4], [55.0, 70.3], [43.9, 43.6], [75.9, 50.5], [26.2, 27.7], [50.9, 17.3], [80.9, 23.8], [67.6, 5.6]] },
    { u: '/img/pzzone3.webp?v=1', w: 768, h: 758, pts: [[76.0, 94.5], [57.8, 88.6], [42.3, 76.7], [59.2, 68.0], [33.2, 58.4], [43.0, 51.0], [50.5, 44.5], [57.9, 33.0], [35.8, 23.8], [51.7, 10.6]] }
  ];
  var GEN = [[50, 90], [70, 80], [40, 71], [64, 61], [34, 52], [58, 43], [32, 34], [62, 25], [42, 16], [56, 7]];
  var MAPS = {};
  function zonesOf(key) {
    var z = (MAPS[key] && MAPS[key].length) ? MAPS[key] : (MAPS[''] && MAPS[''].length ? MAPS[''] : null);
    if (!z) return DEF;
    return z.map(function (x) { return { u: '/api/pzmap/img?id=' + encodeURIComponent(x.id), w: x.w || 768, h: x.h || 758, pts: x.pts && x.pts.length === PER ? x.pts : GEN }; });
  }
  function load(cb) { api('/api/pzmap').then(function (d) { if (d && d.maps) MAPS = d.maps; if (cb) cb(); }); }
  function css() {
    if (document.getElementById('pzMapCss')) return;
    var s = document.createElement('style'); s.id = 'pzMapCss';
    s.textContent = '#pzScroll{position:relative;height:min(66vh,620px);overflow-y:auto;-webkit-overflow-scrolling:touch;margin:10px 0;border:3px solid #f5c542;border-radius:18px;box-shadow:0 0 0 2px #7a5a10,0 6px 18px rgba(0,0,0,.45);background:#0b1a33}' +
      '.pzZone{position:relative;width:100%;background-size:100% 100%;background-repeat:no-repeat}' +
      '.pzZt{position:absolute;left:8px;bottom:8px;z-index:2;background:rgba(0,0,0,.55);color:#fff;font:700 12px/1 system-ui,sans-serif;padding:6px 10px;border-radius:12px}' +
      '.pzN{position:absolute;z-index:3;transform:translate(-50%,-50%);width:17%;aspect-ratio:1;border-radius:50%;border:3px solid rgba(255,255,255,.9);color:#fff;font:900 clamp(15px,5vw,24px)/1 system-ui,sans-serif;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-shadow:0 2px 2px rgba(0,0,0,.45);box-shadow:0 5px 0 rgba(0,0,0,.35),0 0 14px rgba(0,0,0,.35)}' +
      '.pzN small{font-size:.55em;line-height:1}.pzN.d{background:radial-gradient(circle at 35% 30%,#7ef07a,#1f9a2a 60%,#0f5e16)}' +
      '.pzN.c{background:radial-gradient(circle at 35% 30%,#ffe58a,#f5a623 60%,#b86a00);animation:pzPulse 1.4s ease-in-out infinite;box-shadow:0 5px 0 rgba(0,0,0,.35),0 0 22px #ffd54f}' +
      '.pzN.o{background:radial-gradient(circle at 35% 30%,#e7b678,#a8692c 60%,#6b3d12)}.pzN.l{background:radial-gradient(circle at 35% 30%,#e8eef1,#9fb2bb 60%,#6c7d86);color:#3b4a52;text-shadow:none}' +
      '#pzHero{position:absolute;z-index:6;width:14%;transform:translate(-50%,-88%);pointer-events:none;font-size:clamp(32px,11vw,50px);line-height:1;text-align:center;will-change:left,top}' +
      '#pzHeroW{display:inline-block;transition:transform .15s}#pzHeroB{display:inline-block;transform-origin:50% 100%;filter:drop-shadow(0 4px 3px rgba(0,0,0,.45))}' +
      '#pzHeroB.idle{animation:pzIdle 1.6s ease-in-out infinite}#pzHeroB.walk{animation:pzWalk .32s ease-in-out infinite}#pzHeroB.joy{animation:pzJoy .9s ease-out 2}' +
      '.pzSh{position:absolute;left:50%;bottom:-4px;width:60%;height:12%;margin-left:-30%;border-radius:50%;background:rgba(0,0,0,.35);filter:blur(2px);animation:pzShI 1.6s ease-in-out infinite}' +
      '@keyframes pzIdle{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-6%) scale(.97,1.04)}}' +
      '@keyframes pzShI{0%,100%{transform:scaleX(1);opacity:.35}50%{transform:scaleX(.85);opacity:.25}}' +
      '@keyframes pzWalk{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}' +
      '@keyframes pzJoy{0%{transform:translateY(0) scale(1)}20%{transform:translateY(0) scale(1.15,.85)}45%{transform:translateY(-45%) scale(.92,1.1) rotate(-8deg)}70%{transform:translateY(0) scale(1.12,.88)}100%{transform:translateY(0) scale(1)}}' +
      '@keyframes pzPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}}' +
      '.pzFx{position:absolute;z-index:7;pointer-events:none;transform:translate(-50%,-50%);font-size:clamp(14px,4.5vw,22px);animation:pzFx .8s ease-out forwards}' +
      '@keyframes pzFx{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.2)}}' +
      '.pzN.pop{animation:pzPop .5s ease-out}@keyframes pzPop{0%{transform:translate(-50%,-50%) scale(1)}40%{transform:translate(-50%,-50%) scale(1.35)}100%{transform:translate(-50%,-50%) scale(1)}}' +
      '.pzBar{display:flex;justify-content:space-between;gap:8px;margin-top:8px}.pzHeroPick{margin:0;border:0;border-radius:10px;padding:6px 12px;background:#6b5cf0;color:#fff;font:700 14px system-ui}.pzMapEd{margin:0;border:0;border-radius:10px;padding:7px 12px;background:#2b3270;color:#fff;font:700 13px system-ui}';
    document.head.appendChild(s);
  }
  // items: [{i, done}] — tartibda; key: '' (umumiy) yoki papka nomi
  // 🧑‍🎓 Qahramonlar: ko'proq masala yechgan sari yangilari ochiladi
  var HEROES = [
    ['🧑‍🎓', 'Talaba', 0], ['👦', 'Bola', 0], ['👧', 'Qizcha', 0], ['🐻', 'Ayiqcha', 15], ['🦊', 'Tulki', 30], ['🐼', 'Panda', 50],
    ['🐱', 'Mushukcha', 75], ['🥷', 'Ninja', 100], ['🧙', 'Sehrgar', 150], ['🧚', 'Pari', 200], ['🦸', 'Qahramon', 300], ['👸', 'Qor malikasi', 400],
    ['🤴', 'Shahzoda', 500], ['🦄', 'Yolqinli ot', 600], ['🐉', 'Ajdar', 750], ['🤖', 'Robot', 900], ['👑', 'Shashka qiroli', 1100]
  ];
  var HS = { av: '', n: 0, save: null };
  function heroAv() { for (var i = 0; i < HEROES.length; i++) if (HEROES[i][0] === HS.av && HS.n >= HEROES[i][2]) return HS.av; return HEROES[0][0]; }
  function setHero(av, n, save) { HS.av = av || ''; HS.n = n || 0; HS.save = save; }
  function picker(onDone) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:rgba(5,8,25,.96);color:#fff;overflow:auto;padding:16px;font:15px system-ui,sans-serif;box-sizing:border-box';
    var cur = heroAv(), h = '<div style="display:flex;align-items:center;margin-bottom:6px"><b style="flex:1;font-size:19px">🧑‍🎓 Qahramon tanlang</b><button data-x style="border:0;border-radius:10px;padding:8px 12px;background:#2b3270;color:#fff;font-size:16px">✕</button></div>' +
      '<div style="font-size:13px;opacity:.75;margin-bottom:12px">Siz yechgan masalalar: <b>' + HS.n + '</b>. Ko‘proq yeching — yangi qahramonlar ochiladi!</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
    HEROES.forEach(function (x) {
      var ok = HS.n >= x[2], on = x[0] === cur;
      h += '<button data-av="' + x[0] + '" ' + (ok ? '' : 'disabled') + ' style="position:relative;border:' + (on ? '3px solid #ffd54f' : '2px solid #2b3270') + ';border-radius:16px;padding:10px 4px;background:' + (on ? '#3a3a10' : '#161c45') + ';color:#fff;opacity:' + (ok ? 1 : .55) + '">' +
        '<div style="font-size:40px;line-height:1.2;' + (ok ? '' : 'filter:grayscale(1)') + '">' + x[0] + '</div><div style="font-size:12px;font-weight:700;margin-top:4px">' + x[1] + '</div>' +
        '<div style="font-size:11px;opacity:.8;margin-top:2px">' + (on ? '✅ tanlangan' : ok ? 'Tanlash' : '🔒 ' + x[2] + ' ta masala') + '</div></button>';
    });
    ov.innerHTML = h + '</div>'; document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
    [].forEach.call(ov.querySelectorAll('[data-av]'), function (b) {
      b.onclick = function () { HS.av = b.getAttribute('data-av'); if (HS.save) HS.save(HS.av); ov.remove(); if (onDone) onDone(); };
    });
  }
  var ST = {};
  function html(items, key, admin) {
    css();
    var n = items.length; if (!n) return '';
    var cu = 0; while (cu < n && items[cu].done) cu++;
    var cur = Math.min(cu, n - 1), zc = Math.floor(cur / PER), Z = zonesOf(key), NZ = Math.ceil(n / PER);
    var z0 = Math.max(0, zc - 1), z1 = Math.min(NZ - 1, zc + 2);
    ST = { key: key, cu: cu, cur: cur, n: n, z0: z0, z1: z1 };
    var h = '<div class="pzBar"><button class="pzHeroPick" data-heropick>' + heroAv() + ' Qahramon</button>' + (admin ? '<button class="pzMapEd" data-mapedit>🗺 Xaritani sozlash</button>' : '') + '</div><div id="pzScroll">';
    for (var z = z1; z >= z0; z--) {
      var cfg = Z[z % Z.length];
      h += '<div class="pzZone" style="aspect-ratio:' + cfg.w + '/' + cfg.h + ';background-image:url(\'' + cfg.u + '\')"><span class="pzZt">' + (z + 1) + '/' + NZ + '-bosqich</span>';
      for (var k = 0; k < PER; k++) {
        var j = z * PER + k; if (j >= n) break;
        var p = cfg.pts[k] || GEN[k], done = items[j].done, now = j === cu, lock = j > cu + 3;
        var cls = done ? 'd' : now ? 'c' : lock ? 'l' : 'o';
        var lab = done ? '<small>✓</small>' + (j + 1) : now ? '<small>👑</small>' + (j + 1) : lock ? '🔒' : (j + 1);
        h += '<button class="pzN ' + cls + '" data-node="' + j + '" ' + (lock ? 'disabled' : 'data-pz="' + items[j].i + '"') + ' style="left:' + p[0] + '%;top:' + p[1] + '%">' + lab + '</button>';
      }
      h += '</div>';
    }
    h += '<div id="pzHero"><i class="pzSh"></i><span id="pzHeroW"><span id="pzHeroB" class="idle">' + heroAv() + '</span></span></div></div>';
    return h;
  }
  function after(root, key, onEdit, onArrive) {
    var c = root.querySelector('#pzScroll'), hero = root.querySelector('#pzHero'), hb = root.querySelector('#pzHeroB'); if (!c || !hero) return;
    var hp = root.querySelector('[data-heropick]'); if (hp) hp.onclick = function () { picker(function () { var a = heroAv(); hb.textContent = a; hp.textContent = a + ' Qahramon'; hb.className = 'joy'; setTimeout(function () { hb.className = 'idle'; }, 1800); }); };
    var ed = root.querySelector('[data-mapedit]'); if (ed) ed.onclick = function (e) { e.stopPropagation(); editor(key, onEdit); };
    function at(j) {
      var b = c.querySelector('[data-node="' + j + '"]'); if (!b) return null;
      var cr = c.getBoundingClientRect(), br = b.getBoundingClientRect();
      return { x: br.left - cr.left + br.width / 2 + c.scrollLeft, y: br.top - cr.top + c.scrollTop + br.height * 0.05 };
    }
    var sk = 'pzHero:' + key, from = ST.cur;
    try { var sp = parseInt(localStorage.getItem(sk) || '', 10); if (sp >= ST.z0 * PER && sp < ST.cur) from = sp; } catch (e) {}
    function place(j, smooth) {
      var P = at(j); if (!P) return null;
      hero.style.left = P.x + 'px'; hero.style.top = P.y + 'px';
      var t = P.y - c.clientHeight / 2;
      if (smooth && c.scrollTo) c.scrollTo({ top: t, behavior: 'smooth' }); else c.scrollTop = t;
      return P;
    }
    var hw = root.querySelector('#pzHeroW');
    function fx(x, y, ch, n, spread) {   // effekt zarrachalari (chang, uchqun, konfetti)
      for (var i = 0; i < n; i++) {
        var e = document.createElement('span'), a = Math.random() * Math.PI * 2, r = spread * (0.5 + Math.random() * 0.6);
        e.className = 'pzFx'; e.textContent = ch[i % ch.length];
        e.style.left = x + 'px'; e.style.top = y + 'px';
        e.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px'); e.style.setProperty('--dy', Math.round(Math.sin(a) * r * 0.7 - spread * 0.3) + 'px');
        e.style.animationDelay = (i * 0.03) + 's';
        c.appendChild(e); setTimeout(function (el) { return function () { el.remove(); }; }(e), 1100);
      }
    }
    function hop(A, B, dur, cb) {   // yoy bo'ylab sakrash (requestAnimationFrame)
      var t0 = null, H = Math.max(28, Math.abs(B.x - A.x) * 0.35);
      fx(A.x, A.y + 6, ['💨'], 2, 22);
      (function fr(ts) {
        if (!document.body.contains(hero)) return;
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e - Math.sin(Math.PI * t) * H;
        hero.style.left = x + 'px'; hero.style.top = y + 'px';
        var ct = y - c.clientHeight / 2; c.scrollTop += (ct - c.scrollTop) * 0.18;
        if (t < 1) requestAnimationFrame(fr); else { fx(B.x, B.y + 10, ['✨', '⭐'], 4, 30); cb(); }
      })(performance.now());
      requestAnimationFrame(function () {});
    }
    var go = function () {
      var P0 = at(from); if (!P0) return;
      hero.style.left = P0.x + 'px'; hero.style.top = P0.y + 'px'; c.scrollTop = P0.y - c.clientHeight / 2;
      var k = from, cur = ST.cur;
      if (k < cur) { hb.className = 'walk'; }
      (function step() {
        if (!document.body.contains(hero)) return;
        if (k >= cur) {
          try { localStorage.setItem(sk, String(cur)); } catch (e) {}
          var E = at(cur), nb = c.querySelector('[data-node="' + cur + '"]');
          if (from < cur && E) {   // yetib keldi: quvonch + konfetti
            hb.className = 'joy'; fx(E.x, E.y, ['🎉', '⭐', '✨', '🎊', '💛'], 12, 70);
            if (nb) { nb.classList.add('pop'); }
            setTimeout(function () { hb.className = 'idle'; }, 1800);
          }
          if (onArrive) setTimeout(function () { if (document.body.contains(hero)) onArrive(); }, from < cur ? 1500 : 700);
          return;
        }
        var A = at(k); k++; var B = at(k);
        if (!A || !B) { step(); return; }
        hw.style.transform = B.x < A.x ? 'scaleX(-1)' : '';
        hop(A, B, 620, function () { setTimeout(step, 90); });
      })();
    };
    // rasmlar yuklanib, o'lcham aniq bo'lgach
    setTimeout(go, 80);
  }

  // ---------------- admin: xarita sozlash
  function shrink(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var W = Math.min(768, im.width), H = Math.round(im.height * W / im.width), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        cv.getContext('2d').drawImage(im, 0, 0, W, H);
        var d = cv.toDataURL('image/webp', 0.78); if (!/^data:image\/webp/.test(d) || d.length > 700000) d = cv.toDataURL('image/jpeg', 0.75);
        cb({ img: d, w: W, h: H });
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function editor(key, done) {
    var zones = (MAPS[key] || []).map(function (x) { return { id: x.id, w: x.w, h: x.h, pts: (x.pts || []).slice(), u: '/api/pzmap/img?id=' + encodeURIComponent(x.id) }; });
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483100;background:#0b1026;color:#fff;overflow:auto;padding:14px;font:15px system-ui,sans-serif;box-sizing:border-box';
    document.body.appendChild(ov);
    var B = 'border:0;border-radius:10px;padding:9px 12px;margin:3px;color:#fff;font:600 14px system-ui;background:#2b3270';
    function draw() {
      var h = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1;font-size:18px">🗺 Xarita: ' + (key ? key.replace(/[<>]/g, '') : 'Umumiy') + '</b><button data-x style="' + B + '">✕</button></div>' +
        '<div style="font-size:13px;opacity:.8;margin-bottom:10px">Har bir rasm — 10 ta masala. Rasmlar pastdan yuqoriga navbat bilan takrorlanadi. Rasm yo‘q bo‘lsa standart xarita ishlatiladi.</div>';
      zones.forEach(function (z, i) {
        h += '<div style="display:flex;gap:10px;align-items:center;background:#161c45;border-radius:12px;padding:8px;margin:8px 0"><img src="' + (z.img || z.u) + '" style="width:90px;height:90px;object-fit:cover;border-radius:8px"><div style="flex:1"><b>' + (i + 1) + '-rasm</b><div style="font-size:12px;opacity:.75">' + (z.pts && z.pts.length === PER ? '📍 10 bekat belgilangan' : '📍 bekatlar standart') + '</div>' +
          '<button data-pt="' + i + '" style="' + B + '">📍 Bekatlar</button><button data-up="' + i + '" style="' + B + '">⬆</button><button data-del="' + i + '" style="' + B + ';background:#7a2333">🗑</button></div></div>';
      });
      h += '<label style="' + B + ';display:inline-block;background:#3b7d2a">➕ Rasm qo‘shish<input type="file" accept="image/*" data-file style="display:none"></label>' +
        '<button data-reset style="' + B + '">↺ Standart xarita</button><div style="margin-top:14px"><button data-save style="' + B + ';background:#6b5cf0;font-size:17px;padding:12px 20px">💾 Saqlash</button> <span data-msg></span></div>';
      ov.innerHTML = h;
      ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
      ov.querySelector('[data-file]').onchange = function () { var f = this.files && this.files[0]; if (!f) return; shrink(f, function (r) { zones.push({ img: r.img, w: r.w, h: r.h, pts: [] }); draw(); }); };
      ov.querySelector('[data-reset]').onclick = function () { zones = []; draw(); };
      [].forEach.call(ov.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { zones.splice(+b.getAttribute('data-del'), 1); draw(); }; });
      [].forEach.call(ov.querySelectorAll('[data-up]'), function (b) { b.onclick = function () { var i = +b.getAttribute('data-up'); if (i > 0) { var t = zones[i - 1]; zones[i - 1] = zones[i]; zones[i] = t; } draw(); }; });
      [].forEach.call(ov.querySelectorAll('[data-pt]'), function (b) { b.onclick = function () { points(zones[+b.getAttribute('data-pt')], draw); }; });
      ov.querySelector('[data-save]').onclick = function () {
        var m = ov.querySelector('[data-msg]'); m.textContent = '⏳';
        api('/api/pzmap/save', { key: key, zones: zones.map(function (z) { return { id: z.id, img: z.img, w: z.w, h: z.h, pts: z.pts }; }) }).then(function (d) {
          if (d && d.ok) { MAPS = d.maps || MAPS; ov.remove(); if (done) done(); } else m.textContent = '❌ ' + ((d && d.error) || 'xato');
        });
      };
    }
    draw();
  }
  function points(z, back) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483200;background:#000;color:#fff;overflow:auto;font:15px system-ui,sans-serif';
    document.body.appendChild(ov);
    var pts = [];
    function draw() {
      ov.innerHTML = '<div style="padding:10px;display:flex;gap:6px;align-items:center;position:sticky;top:0;background:#000;z-index:2"><b style="flex:1">📍 ' + (pts.length < PER ? (pts.length + 1) + '-bekatni bosing (1 — pastdagi)' : 'Tayyor!') + '</b><button data-u style="border:0;border-radius:8px;padding:8px 10px;background:#333;color:#fff">↶</button><button data-ok style="border:0;border-radius:8px;padding:8px 12px;background:#3b7d2a;color:#fff"' + (pts.length < PER ? ' disabled' : '') + '>✓</button><button data-x style="border:0;border-radius:8px;padding:8px 10px;background:#333;color:#fff">✕</button></div>' +
        '<div data-img style="position:relative;width:100%;aspect-ratio:' + z.w + '/' + z.h + ';background:url(\'' + (z.img || z.u) + '\') 0 0/100% 100% no-repeat">' +
        pts.map(function (p, i) { return '<span style="position:absolute;left:' + p[0] + '%;top:' + p[1] + '%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#f5a623;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:900">' + (i + 1) + '</span>'; }).join('') + '</div>';
      var im = ov.querySelector('[data-img]');
      im.onclick = function (e) { if (pts.length >= PER) return; var r = im.getBoundingClientRect(); pts.push([+((e.clientX - r.left) / r.width * 100).toFixed(1), +((e.clientY - r.top) / r.height * 100).toFixed(1)]); draw(); };
      ov.querySelector('[data-u]').onclick = function () { pts.pop(); draw(); };
      ov.querySelector('[data-x]').onclick = function () { ov.remove(); };
      ov.querySelector('[data-ok]').onclick = function () { z.pts = pts; ov.remove(); back(); };
    }
    draw();
  }
  window.spPzMap = { load: load, html: html, after: after, setHero: setHero };
})();
