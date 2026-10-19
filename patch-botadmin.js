const fs = require('fs');
const cnt = (t, x) => t.split(x).length - 1;
let E = fs.readFileSync('economy.js', 'utf8'), L = fs.readFileSync('lobby.js', 'utf8');
let C = fs.readFileSync('lobbyclient.js', 'utf8'), B = fs.readFileSync('botarena.js', 'utf8');

const e1 = "if (p.startsWith('/api/av/') && req.method === 'GET') {";
const l1 = "function botElo(u) {";
const l2 = "for (const b of BOTS) {";
const l3 = "if (c.isBot) p.elo = botElo(c.lb.uid) || p.elo; }";
const b1 = "return { uid: b.uid, name: b.name, elo: s.elo";
const bad = [[E,e1],[L,l1],[L,l2],[L,l3],[B,b1]].filter(x => cnt(x[0], x[1]) !== 1);
if (bad.length || E.includes('/api/botedit')) { console.log('XATO yoki allaqachon qollangan (' + bad.length + ')'); process.exit(1); }

const srv = `const _ADM = tg => !!(tg && (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(tg.id)));
  if (p === '/api/botadmin' && req.method === 'GET') { const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN); send(res, 200, { admin: _ADM(tg) }); return true; }
  if (p === '/api/botedit' && req.method === 'POST') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_ADM(tg)) { send(res, 403, { error: 'admin emassiz' }); return true; }
    readBody(req, 200000, body => {
      let j = {}; try { j = JSON.parse(body); } catch (e) {}
      const uid = String(j.uid || '');
      if (!/^bot(_[a-z]+)?$/.test(uid)) return send(res, 400, { error: 'bad_uid' });
      store.db.botNames = store.db.botNames || {}; store.db.botAv = store.db.botAv || {};
      if (j.name != null) { const n = String(j.name).replace(/[\\u0000-\\u001f<>'"\\\\]/g, '').trim().slice(0, 24); if (n) { store.db.botNames[uid] = n; try { global.__botRename && global.__botRename(uid, n); } catch (e) {} } }
      if (j.img) { const a = String(j.img); if (!/^data:image\\/jpeg;base64,[A-Za-z0-9+\\/=]+$/.test(a) || a.length > 150000) return send(res, 400, { error: 'bad_image' }); store.db.botAv[uid] = a; }
      store.save(); send(res, 200, { ok: true });
    });
    return true;
  }
  if (p.startsWith('/api/av/bot') && req.method === 'GET') {
    const a = ((store.db.botAv || {})[decodeURIComponent(p.slice(8))]) || '';
    const m = /^data:image\\/jpeg;base64,(.+)$/.exec(a);
    if (!m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-cache' }); res.end(Buffer.from(m[1], 'base64')); return true;
  }
  `;
E = E.replace(e1, () => srv + e1);

L = L.replace(l1, () => "function botX(u) { try { const d = require('./store').db; return { n: (d.botNames || {})[u], a: !!(d.botAv || {})[u] }; } catch (e) { return {}; } }\n  " + l1);
L = L.replace(l3, () => "if (c.isBot) { p.elo = botElo(c.lb.uid) || p.elo; const x = botX(c.lb.uid); p.hasAv = !!x.a; if (x.n) p.name = x.n; } }");
L = L.replace(l2, () => `global.__botRename = function (uid, name) { const b = BOTS.find(x => x.uid === uid); if (!b) return; b.name = name; const c = clients.get('ai_' + uid); if (c) { c.name = name; if (c.lb) c.lb.name = name; } };
  const _applyBN = () => { try { const bn = require('./store').db.botNames || {}; for (const k in bn) global.__botRename(k, bn[k]); } catch (e) {} };
  _applyBN(); setTimeout(_applyBN, 5000); setTimeout(_applyBN, 20000);
  ` + l2);

B = B.replace(b1, () => "return { uid: b.uid, name: ((D().botNames || {})[b.uid]) || b.name, elo: s.elo");

const cli = `
;(function () {
  var adm = false;
  function ini() { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ''; }
  try { fetch('/api/botadmin', { headers: { 'x-init-data': ini() } }).then(function (r) { return r.json(); }).then(function (j) { adm = !!(j && j.admin); }).catch(function () {}); } catch (e) {}
  document.addEventListener('click', function (e) {
    if (!adm) return;
    var t = e.target.closest && e.target.closest('.lbav'); if (!t) return;
    var m = /spUser\\('(bot[a-z_]*)'\\)/.exec(t.getAttribute('onclick') || ''); if (!m) return;
    e.stopPropagation(); e.preventDefault(); openEd(m[1]);
  }, true);
  function openEd(uid) {
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000a;display:flex;align-items:center;justify-content:center';
    o.innerHTML = '<div style="background:#1b1b3a;color:#fff;padding:18px;border-radius:16px;width:80%;max-width:340px;font-size:15px"><b>Botni tahrirlash</b><input id="beN" placeholder="Yangi nom (masalan: Arslon BOT)" maxlength="24" style="width:100%;box-sizing:border-box;margin:12px 0;padding:10px;border-radius:10px;border:0"><input id="beF" type="file" accept="image/*" style="margin-bottom:12px;width:100%"><div style="display:flex;gap:8px"><button id="beS" style="flex:1;padding:10px;border:0;border-radius:10px;background:#2f7bff;color:#fff">Saqlash</button><button id="beC" style="flex:1;padding:10px;border:0;border-radius:10px;background:#444;color:#fff">Bekor</button></div><div id="beM" style="margin-top:8px;font-size:13px"></div></div>';
    document.body.appendChild(o);
    function $(i) { return o.querySelector('#' + i); }
    $('beC').onclick = function () { o.remove(); };
    $('beS').onclick = function () {
      var name = $('beN').value.trim(), f = $('beF').files && $('beF').files[0];
      function send(img) {
        var body = { uid: uid }; if (name) body.name = name; if (img) body.img = img;
        if (!name && !img) { $('beM').textContent = 'Nom yoki rasm tanlang'; return; }
        $('beM').textContent = 'Saqlanmoqda…';
        fetch('/api/botedit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': ini() }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.ok) { $('beM').textContent = '✅ Saqlandi'; setTimeout(function () { location.reload(); }, 600); } else $('beM').textContent = '⚠️ ' + ((j && j.error) || 'xatolik'); })
          .catch(function () { $('beM').textContent = '⚠️ tarmoq xatosi'; });
      }
      if (!f) return send(null);
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image();
        im.onload = function () {
          var z = 256, cv = document.createElement('canvas'); cv.width = z; cv.height = z;
          var mm = Math.min(im.width, im.height);
          cv.getContext('2d').drawImage(im, (im.width - mm) / 2, (im.height - mm) / 2, mm, mm, 0, 0, z, z);
          send(cv.toDataURL('image/jpeg', 0.8));
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
  }
})();
`;
C = C + '\n' + cli;

fs.writeFileSync('economy.js', E); fs.writeFileSync('lobby.js', L);
fs.writeFileSync('lobbyclient.js', C); fs.writeFileSync('botarena.js', B);
console.log('OK');
