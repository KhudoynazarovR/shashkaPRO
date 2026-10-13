const fs = require('fs');
const R = String.raw;
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}

// ---------- lobby.js ----------
let L = fs.readFileSync('lobby.js', 'utf8');
L = rep(L, "wins: (su && su.wins) || 0, prem:", "wins: (su && su.wins) || 0, hasAv: !!(su && su.avatar), prem:", 'players hasAv');
L = rep(L, "me: { uid, name: c.lb.name },", "me: { uid, name: c.lb.name }, ...friendState(uid),", 'stateFor');
L = rep(L, "function stateFor(c) {", `function friendState(uid) {
    let st, us;
    try { st = require('./store'); us = st.users(); } catch (e) { return { friends: [], freqIn: [] }; }
    const u = us[String(uid)] || {};
    const on = new Set(lbClients().map(x => String(x.lb.uid)));
    return {
      friends: (u.friends || []).map(id => { const f = us[id] || {}; return { uid: id, name: f.name || '?', elo: f.elo || 1000, gems: f.diamonds || 0, hasAv: !!f.avatar, online: on.has(id) }; }),
      freqIn: (u.fReq || []).map(id => { const f = us[id] || {}; return { uid: id, name: f.name || '?', hasAv: !!f.avatar }; })
    };
  }

  function stateFor(c) {`, 'friendState');
const re = /switch \(m\.type\) \{(\s*)case 'lbName': \{/;
if (!re.test(L)) { console.log("XATO: switch topilmadi"); process.exit(1); }
L = L.replace(re, (all, ws) => "switch (m.type) {" + ws + `case 'lbFriendReq': {
        const st = require('./store'), us = st.users();
        const to = String(m.uid), mine = String(me.uid);
        const ut = us[to], uu = us[mine];
        if (!ut || !uu || to === mine) break;
        uu.friends = uu.friends || []; ut.friends = ut.friends || [];
        ut.fReq = ut.fReq || []; uu.fReq = uu.fReq || [];
        if (uu.friends.includes(to)) break;
        if (uu.fReq.includes(to)) {
          uu.fReq = uu.fReq.filter(x => x !== to);
          uu.friends.push(to);
          if (!ut.friends.includes(mine)) ut.friends.push(mine);
        } else if (!ut.fReq.includes(mine)) {
          ut.fReq.push(mine);
          toast(to, '👥 ' + me.name + ' do‘stlikka taklif qildi');
        }
        st.save(); push(); break;
      }
      case 'lbFriendResp': {
        const st = require('./store'), us = st.users();
        const from = String(m.uid), mine = String(me.uid);
        const uu = us[mine], uf = us[from];
        if (!uu) break;
        uu.fReq = (uu.fReq || []).filter(x => x !== from);
        if (m.accept && uf) {
          uu.friends = uu.friends || []; uf.friends = uf.friends || [];
          if (!uu.friends.includes(from)) uu.friends.push(from);
          if (!uf.friends.includes(mine)) uf.friends.push(mine);
          toast(from, '✅ ' + me.name + ' do‘stlik taklifini qabul qildi');
        }
        st.save(); push(); break;
      }
      case 'lbName': {`);
fs.copyFileSync('lobby.js', 'lobby.js.before-friends');

// ---------- economy.js ----------
let E = fs.readFileSync('economy.js', 'utf8');
E = rep(E, "if ((p === '/api/avatar' || p === '/api/bio') && req.method === 'POST') {", `if (p.startsWith('/api/av/') && req.method === 'GET') {
    const _u = store.users()[decodeURIComponent(p.slice(8))];
    const _m = /^data:image\\/jpeg;base64,(.+)$/.exec((_u && _u.avatar) || '');
    if (!_m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=300' });
    res.end(Buffer.from(_m[1], 'base64'));
    return true;
  }
  if ((p === '/api/avatar' || p === '/api/bio') && req.method === 'POST') {`, 'avatar GET');
fs.copyFileSync('economy.js', 'economy.js.before-friends');

// ---------- lobbyclient.js ----------
let C = fs.readFileSync('lobbyclient.js', 'utf8');
C = rep(C, 'var all = (S.players || []);', `var all = (S.players || []);
    function avh(uid, has, name, pr) { return '<div class="lbav' + (pr ? ' lbpr' : '') + '" style="overflow:hidden">' + (has ? '<img src="/api/av/' + encodeURIComponent(uid) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">' : '👤') + '</div>'; }`, 'avh');
C = rep(C, 'var list = all.filter(function (p) { return p.uid !== me; });',
`var list = all.slice().sort(function (a, b) { return (b.uid === me ? 1 : 0) - (a.uid === me ? 1 : 0); });
    var fl = S.friends || [], fin = S.freqIn || [], fset = {}, showF = !!window.__lbF;
    fl.forEach(function (f) { fset[f.uid] = 1; });
    if (showF) list = fl.map(function (f) { return { uid: f.uid, name: f.name, elo: f.elo, gems: f.gems, hasAv: f.hasAv, busy: false, offline: !f.online }; });`, 'list');
C = rep(C, R`<button class=\"on\">🌐 Barcha onlinelar " + all.length + "</button></div>";`,
R`<button class=\"lbtb" + (showF ? "" : " on") + "\" data-t=\"pl\">🌐 Barcha onlinelar " + all.length + "</button><button class=\"lbtb" + (showF ? " on" : "") + "\" data-t=\"f\">👥 Do‘stlar " + fl.length + (fin.length ? " 🔴" : "") + "</button></div>";
    fin.forEach(function (r) { h += '<div class="lbp lbin">' + avh(r.uid, r.hasAv, r.name, false) + '<div class="lbinf"><b>' + esc(r.name) + '</b><small>do‘st bo‘lishni taklif qildi</small></div><button class="lbacc" data-f="acc" data-id="' + esc(r.uid) + '">Qabul</button><button class="lbrej" data-f="rej" data-id="' + esc(r.uid) + '">Rad</button></div>'; });`, 'tabs');
C = rep(C, R`<div class=\"lbav" + (p.prem ? " lbpr" : "") + "\">" + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>" +`,
  `" + avh(p.uid, p.hasAv, p.name, p.prem) +`, 'row avatar');
C = rep(C, '(out[p.uid] ? ',
  `(p.uid === me ? "<i class='muted'>Bu siz</i>" : p.offline ? "<span class='muted'>oflayn</span>" : fset[p.uid] ? "" : "<button class='lbinv' style='background:#2e7d32' data-f='add' data-id='" + esc(p.uid) + "'>➕ Do‘st</button>") + (p.uid === me || p.offline ? "" : out[p.uid] ? `, 'buttons');
C = rep(C, '$("lbPl").innerHTML = h;', `$("lbPl").innerHTML = h;
    Array.prototype.forEach.call($("lbPl").querySelectorAll('[data-t]'), function (b) {
      b.onclick = function () { window.__lbF = b.getAttribute('data-t') === 'f'; renderAll(); };
    });
    Array.prototype.forEach.call($("lbPl").querySelectorAll('[data-f]'), function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-f'), id = b.getAttribute('data-id');
        if (a === 'add') { sendMsg({ type: 'lbFriendReq', uid: id }); b.textContent = '✓ Yuborildi'; b.disabled = true; }
        else sendMsg({ type: 'lbFriendResp', uid: id, accept: a === 'acc' });
      };
    });`, 'innerHTML');
fs.copyFileSync('lobbyclient.js', 'lobbyclient.js.before-friends');

fs.writeFileSync('lobby.js', L);
fs.writeFileSync('economy.js', E);
fs.writeFileSync('lobbyclient.js', C);
console.log('TAYYOR. Serverni qayta ishga tushiring.');
