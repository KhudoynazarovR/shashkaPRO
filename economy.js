require('./kestoai.js');
'use strict';
const store = require('./store');
const { verifyInitData } = require('./auth');

const CFG = {
  CREATE_COST: 100,
  JOIN_FEE: 10,
  DAILY_BONUS: 20,
  WIN_CASUAL: 1,
  WIN_TOURNAMENT: 3,
  CASUAL_WINS_PER_DAY: 20,
  SAME_OPPONENT_PER_DAY: 3,
  TOURNAMENT_WINS_CAP: 10,
  HOST_TIERS: [[150, 1000], [100, 350], [50, 150]],
};

const today = () => new Date().toISOString().slice(0, 10);
const user = (id) => store.users()[String(id)] || null;

function note(u, d, why) {
  u.log = u.log || [];
  u.log.push({ t: Date.now(), d, why });
  if (u.log.length > 30) u.log.shift();
}
function add(id, n, why) {
  const u = user(id);
  if (!u || n <= 0) return false;
  u.diamonds = (u.diamonds || 0) + n;
  note(u, n, why);
  store.save();
  return true;
}
function spend(id, n, why) {
  const u = user(id);
  if (!u || (u.diamonds || 0) < n) return false;
  u.diamonds -= n;
  note(u, -n, why);
  store.save();
  return true;
}
function balance(id) { const u = user(id); return u ? (u.diamonds || 0) : 0; }

function claimDaily(id) {
  const u = user(id);
  if (!u) return { ok: false, error: 'no_user' };
  const d = today();
  if (u.lastDaily === d) return { ok: false, error: 'already', diamonds: u.diamonds };
  u.lastDaily = d;
  add(id, CFG.DAILY_BONUS, 'daily');
  return { ok: true, amount: CFG.DAILY_BONUS, diamonds: u.diamonds };
}

function dayState(u) {
  const d = today();
  if (!u.eco || u.eco.day !== d) u.eco = { day: d, wins: 0, opp: {}, tw: {} };
  return u.eco;
}

// G'alaba mukofoti. tournamentId berilsa turnir g'alabasi (+3), bo'lmasa oddiy (+1).
// Qancha olmos berilganini qaytaradi (0 = limit yoki aldash himoyasi).
function rewardWin(winnerId, loserId, tournamentId) {
  const u = user(winnerId);
  if (!u || String(winnerId) === String(loserId)) return 0;
  const e = dayState(u);
  if (tournamentId) {
    const k = String(tournamentId);
    if ((e.tw[k] || 0) >= CFG.TOURNAMENT_WINS_CAP) return 0;
    e.tw[k] = (e.tw[k] || 0) + 1;
    add(winnerId, CFG.WIN_TOURNAMENT, 'tournament_win');
    return CFG.WIN_TOURNAMENT;
  }
  const o = String(loserId);
  if (e.wins >= CFG.CASUAL_WINS_PER_DAY) return 0;
  if ((e.opp[o] || 0) >= CFG.SAME_OPPONENT_PER_DAY) return 0;
  e.wins++;
  e.opp[o] = (e.opp[o] || 0) + 1;
  add(winnerId, CFG.WIN_CASUAL, 'win');
  return CFG.WIN_CASUAL;
}

// Turnir yaratish / qatnashish to'lovi. { ok:false, error:'no_diamonds' } qaytarishi mumkin.
function chargeCreate(id) {
  return spend(id, CFG.CREATE_COST, 'tournament_create') ? { ok: true } : { ok: false, error: 'no_diamonds', need: CFG.CREATE_COST };
}
function chargeJoin(id) {
  return spend(id, CFG.JOIN_FEE, 'tournament_join') ? { ok: true } : { ok: false, error: 'no_diamonds', need: CFG.JOIN_FEE };
}
function refund(id, n, why) { return add(id, n, why || 'refund'); }

function hostBonus(n) {
  for (const [min, amt] of CFG.HOST_TIERS) if (n > min) return amt;
  return 0;
}
// Turnir tugaganda chaqiring. participantIds = to'lov qilib qatnashganlar.
function finishTournament(creatorId, participantIds) {
  const set = new Set(participantIds.map(String));
  set.delete(String(creatorId));
  const bonus = hostBonus(set.size);
  if (bonus) add(creatorId, bonus, 'host_bonus_' + set.size);
  return { participants: set.size, bonus };
}

function readBody(req, max, cb) {
  let d = '', big = false;
  req.on('data', c => { d += c; if (d.length > max) { big = true; req.destroy(); } });
  req.on('end', () => { if (!big) cb(d); });
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

// HTTP: GET /api/economy, GET /api/balance, POST /api/daily (sarlavha: x-init-data)
function handle(req, res, url) {
  const p = url.pathname;
  if (p === '/api/economy' && req.method === 'GET') { send(res, 200, CFG); return true; }
  if (p.startsWith('/api/av/') && req.method === 'GET') {
    const _u = store.users()[decodeURIComponent(p.slice(8))];
    const _m = /^data:image\/jpeg;base64,(.+)$/.exec((_u && _u.avatar) || '');
    if (!_m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=300' });
    res.end(Buffer.from(_m[1], 'base64'));
    return true;
  }
  if ((p === '/api/avatar' || p === '/api/bio') && req.method === 'POST') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    readBody(req, 200000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      if (p === '/api/avatar') {
        const a = String(j.img || '');
        if (!/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(a) || a.length > 150000) return send(res, 400, { error: 'bad_image' });
        u.avatar = a;
      } else {
        u.bio = String(j.bio || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 120);
      }
      store.save();
      send(res, 200, { ok: true });
    });
    return true;
  }

  if (p === '/api/feedback' && req.method === 'POST') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    let raw = '';
    req.on('data', d => { raw += d; if (raw.length > 4000) req.destroy(); });
    req.on('end', () => {
      let text = '';
      try { text = String((JSON.parse(raw) || {}).text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 1000); } catch (e) {}
      if (text.length < 5) return send(res, 400, { error: 'Xabar juda qisqa' });
      const who = tg ? ((tg.first_name || tg.name || '') + ' #' + tg.id) : 'mehmon';
      global.__fbAt = global.__fbAt || {};
      const k = tg ? String(tg.id) : (req.socket.remoteAddress || 'x');
      const now = Date.now(), arr = (global.__fbAt[k] || []).filter(t => now - t < 3600000);
      if (arr.length >= 5) return send(res, 429, { error: 'Juda ko‘p xabar. Keyinroq urinib ko‘ring' });
      arr.push(now); global.__fbAt[k] = arr;
      try { require('fs').appendFileSync(require('path').join(__dirname, 'feedback.txt'), new Date().toISOString() + ' | ' + who + ' | ' + text + '\n'); } catch (e) {}
      try {
        if (process.env.ADMIN_ID && process.env.BOT_TOKEN) {
          const body = JSON.stringify({ chat_id: process.env.ADMIN_ID, text: '💬 Taklif/shikoyat\n' + who + '\n\n' + text });
          const r = require('https').request({ hostname: 'api.telegram.org', path: '/bot' + process.env.BOT_TOKEN + '/sendMessage', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } });
          r.on('error', () => {}); r.end(body);
        }
      } catch (e) {}
      send(res, 200, { ok: true });
    });
    return true;
  }
  if (p === '/api/leaderboard' && req.method === 'GET') {
    const all = Object.entries(store.users()).map(([id, u]) => {
      const g = u.games || 0, w = u.wins || 0;
      return {
        id, name: u.name || 'Oyinchi', elo: u.elo || 1000, diamonds: u.diamonds || 0,
        games: g, wins: w, losses: u.losses || 0, draws: u.draws || 0,
        best: u.bestStreak || 0, tw: u.tournWins || 0, pct: g >= 20 ? Math.round(w * 100 / g) : 0,
        av: (u.avatar && u.avatar.length < 500) ? u.avatar : '',
        hasAv: !!u.avatar, premium: !!store.isPremium(u)
      };
    });
    const top = (key, minGames) => all.filter(x => x.games >= (minGames || 0) && x[key] > 0)
      .sort((a, b) => b[key] - a[key] || b.elo - a.elo).slice(0, 30);
    send(res, 200, {
      total: all.length,
      elo: all.slice().sort((a, b) => b.elo - a.elo || b.games - a.games).slice(0, 30),
      wins: top('wins'), games: top('games'), diamonds: top('diamonds'),
      best: top('best'), tourn: all.filter(x => x.tw > 0).sort((a, b) => b.tw - a.tw || b.elo - a.elo).slice(0, 30), pct: top('pct', 20)
    });
    return true;
  }
  if (p.startsWith('/api/user/') && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _id = decodeURIComponent(p.slice(10));
    const _u = store.users()[_id];
    if (!_u) { send(res, 404, { error: 'none' }); return true; }
    send(res, 200, {
      id: _id, name: _u.name || 'Oyinchi', elo: _u.elo || 1000, diamonds: _u.diamonds || 0,
      wins: _u.wins || 0, losses: _u.losses || 0, draws: _u.draws || 0, games: _u.games || 0,
      bestStreak: _u.bestStreak || 0, tournWins: _u.tournWins || 0,
      bio: _u.bio || '', hasAv: !!_u.avatar, premium: !!store.isPremium(_u)
    });
    return true;
  }
  if (p === '/api/archive' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _u = store.users()[String(_tg.id)] || {};
    send(res, 200, { list: _u.arch || [] });
    return true;
  }
  if (p === '/api/puzzles/day' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _dk = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10), _pd = store.db.pzDay, _us = store.users();
    const _rows = (_pd && _pd.d === _dk) ? Object.entries(_pd.c || {}).filter(([k, n]) => n > 0 && _us[k]).map(([k, n]) => ({ uid: k, name: _us[k].name || 'Foydalanuvchi', n })).sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name))) : [];
    send(res, 200, { day: _dk, top: _rows.slice(0, 3), me: _pd && _pd.d === _dk ? (_pd.c[String(_tg.id)] || 0) : 0 });
    return true;
  }
  if (p === '/api/ai/move' && req.method === 'POST') {
    console.log('[KestoG] http, initData uzunligi:', (req.headers['x-init-data'] || '').length);
    const _tk = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tk) { send(res, 401, { error: 'auth' }); return true; }
    readBody(req, 4000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      require('./kestoai.js').move(j, r => send(res, r.code || 200, r));
    });
    return true;
  }
  if (p === '/api/puzzles/top' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    const _ids = new Set((store.db.puzzles || []).map(x => x.id));
    const _rows = Object.entries(store.users()).map(([k, v]) => ({ k, name: v.name || 'Foydalanuvchi', n: (v.solved || []).filter(i => _ids.has(i)).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name)));
    const _i = _rows.findIndex(x => x.k === String(_tg.id));
    send(res, 200, { top: _rows.slice(0, 100).map(x => ({ id: x.k, name: x.name, n: x.n, me: x.k === String(_tg.id) })), rank: _i < 0 ? 0 : _i + 1, n: _i < 0 ? 0 : _rows[_i].n });
    return true;
  }
  if (p === '/api/layout') {
    const _t = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    const _a = !!(_t && (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_t.id)));
    if (req.method === 'GET') { send(res, 200, { layout: store.db.lobbyLayout || null, admin: _a }); return true; }
    if (req.method === 'POST') {
      if (!_a) { send(res, 403, { error: 'admin emassiz' }); return true; }
      readBody(req, 50000, body => { let j = {}; try { j = JSON.parse(body); } catch (e) {} store.db.lobbyLayout = (j.layout && typeof j.layout === 'object') ? j.layout : null; store.save(); send(res, 200, { ok: true }); });
      return true;
    }
  }
  if (p === '/api/puzzles' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    store.db.puzzles = store.db.puzzles || []; try { require('./pzimport.js')(store); require('./pzimport2.js')(store); require('./pzfix.js')(store); require('./pzrenum.js')(store); } catch (e) { console.log('[Import] xato', e.message); }
    { let _mx = 0, _ch = false; const _a = store.db.puzzles; _a.forEach(x => { if (x.no) _mx = Math.max(_mx, x.no); }); _a.forEach(x => { if (!x.no) { x.no = ++_mx; _ch = true; } if (x.title === 'Masala') { x.title = 'Masala ' + x.no; _ch = true; } }); if (_ch) store.save(); } if (!store.db.pzNoV2) { const _c = {}; store.db.puzzles.slice().sort((p, q) => (p.at || 0) - (q.at || 0)).forEach(x => { const k = x.folder || ''; _c[k] = (_c[k] || 0) + 1; if (/^Masala \d+$/.test(x.title)) x.title = 'Masala ' + _c[k]; x.no = _c[k]; }); store.db.pzNoV2 = 1; store.save(); }
    const _u = store.users()[String(_tg.id)] || {};
    const _adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
    send(res, 200, { folders: store.db.pzFolders || [], settings: store.db.pzSettings || {}, hideLv: store.db.pzHideLv || [], best: _u.pzBest || {}, inv: _u.pzInv || null, ranks: require('./pzranks.js').RANKS, topInv: (function () { const m = require('./pzranks.js'); m.watch(store); return m.top(store); })(), promo: Date.parse(process.env.PZ_PROMO_END || '2026-10-25T23:59:59+05:00'), admin: _adm, link: process.env.TG_APP_LINK || '', myId: String(_tg.id), solved: _u.solved || [], list: (() => { const _c = {}; Object.values(store.users()).forEach(v => (v.solved || []).forEach(i => { _c[i] = (_c[i] || 0) + 1; })); return store.db.puzzles.slice().sort((x, y) => (x.no || 0) - (y.no || 0)).map(x => Object.assign({}, x, { cnt: _c[x.id] || 0 })); })() });
    return true;
  }
  if ((p === '/api/puzzle' || p === '/api/puzzle/del' || p === '/api/puzzle/solved' || p === '/api/puzzle/rename' || p === '/api/puzzle/folder' || p === '/api/puzzle/move' || p === '/api/puzzle/settings' || p === '/api/puzzle/order') && req.method === 'POST') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    readBody(req, 100000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      const arr = store.db.puzzles = store.db.puzzles || [];
      if (p === '/api/puzzle/solved') {
        const pz = arr.find(x => x.id === j.id);
        if (!pz) return send(res, 404, { error: 'none' });
        const u = store.getOrCreate(_tg);
        u.solved = u.solved || [];
        let gain = 0;
        if (!u.solved.includes(pz.id)) { if (Date.now() - (u.lastSolve || 0) < 6000) return send(res, 429, { error: 'slow' }); u.lastSolve = Date.now();
          try { const _rf = String(j.ref || ''); if (/^\d{3,15}$/.test(_rf) && _rf !== String(_tg.id) && !u.pzRef && !(u.solved || []).length && Date.now() <= Date.parse(process.env.PZ_PROMO_END || '2026-10-25T23:59:59+05:00')) { const _iv = store.users()[_rf]; if (_iv) { const _day = new Date().toISOString().slice(0, 10); _iv.pzInv = _iv.pzInv || { d: '', n: 0, total: 0 }; if (_iv.pzInv.d !== _day) { _iv.pzInv.d = _day; _iv.pzInv.n = 0; } if (_iv.pzInv.n < 30) { u.pzRef = _rf; _iv.pzInv.n++; _iv.pzInv.total++; _iv.diamonds = (_iv.diamonds || 0) + 100; try { require('./pzranks.js').onInvite(_iv, _rf); } catch (e) {} if (process.env.BOT_TOKEN) fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: _rf, text: '🎉 ' + (u.name || 'Yangi o‘yinchi') + ' havolangiz orqali masala yechdi! +100 💎' }) }).catch(() => {}); } } } } catch (e) {}
          u.solved.push(pz.id); gain = 5; try { gain += require('./pzranks.js').folderBonus(store, u, pz, _tg.id); } catch (e) {} u.diamonds = (u.diamonds || 0) + gain; pz.sv = (pz.sv || []).concat([u.name || 'Foydalanuvchi']).slice(-200); try { const _dk = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); if (!store.db.pzDay || store.db.pzDay.d !== _dk) store.db.pzDay = { d: _dk, c: {} }; const _us = store.users(), _uk = Object.keys(_us).find(k => _us[k] === u); if (_uk) store.db.pzDay.c[_uk] = (store.db.pzDay.c[_uk] || 0) + 1; } catch (e) {} store.save(); try { require('./grpupd.js')(pz, () => Object.values(store.users()).filter(v => (v.solved || []).includes(pz.id)).length); } catch (e) {} }
        const _tm = Math.round(Number(j.time)); if (_tm > 0 && _tm < 36000) { u.pzBest = u.pzBest || {}; if (!u.pzBest[pz.id] || _tm < u.pzBest[pz.id]) { u.pzBest[pz.id] = _tm; store.save(); } } return send(res, 200, { ok: true, gain, best: (u.pzBest || {})[pz.id] || 0 });
      }
      const adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
      if (!adm) return send(res, 403, { error: 'admin emassiz' });
      if (p === '/api/puzzle/settings') {
        const _fl0 = store.db.pzFolders || [], _nm0 = String(j.folder || '');
        if (!_fl0.includes(_nm0)) return send(res, 400, { error: 'papka yo‘q' });
        const _st0 = store.db.pzSettings = store.db.pzSettings || {};
        const _c0 = _st0[_nm0] = _st0[_nm0] || {};
        if (j.time !== undefined) { const _t0 = Math.round(Number(j.time)); _c0.time = (_t0 > 0 && _t0 <= 600) ? _t0 : 0; }
        if (j.lock !== undefined) _c0.lock = !!j.lock;
        store.save();
        return send(res, 200, { ok: true, settings: _st0 });
      }
      if (p === '/api/puzzle/order') {
        const _a0 = arr.find(x => x.id === j.id);
        if (!_a0) return send(res, 404, { error: 'none' });
        const _sib = arr.filter(x => x.folder === _a0.folder && (_a0.folder || x.level === _a0.level)).sort((x, y) => (x.no || 0) - (y.no || 0));
        const _i0 = _sib.indexOf(_a0), _k0 = _i0 + (j.dir === 'up' ? -1 : 1);
        if (_k0 < 0 || _k0 >= _sib.length) return send(res, 200, { ok: true });
        const _b0 = _sib[_k0], _tn = _a0.no; _a0.no = _b0.no; _b0.no = _tn;
        [_a0, _b0].forEach(x => { if (/^Masala \d+$/.test(x.title)) x.title = 'Masala ' + x.no; });
        store.save();
        return send(res, 200, { ok: true });
      }
      if (p === '/api/puzzle/rename') {
        const pz2 = arr.find(x => x.id === j.id);
        const nt = String(j.title || '').replace(/[<>]/g, '').trim().slice(0, 40);
        if (!pz2 || !nt) return send(res, 400, { error: 'invalid' });
        pz2.title = nt; store.save();
        return send(res, 200, { ok: true, title: nt });
      }
      if (p === '/api/puzzle/folder') {
      { const _fl = store.db.pzFolders = store.db.pzFolders || [], _nm = String(j.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
      if (j.hideLv) { const _h = store.db.pzHideLv = store.db.pzHideLv || []; const _lv = Number(j.hideLv); if (!_h.includes(_lv)) _h.push(_lv); store.save(); return send(res, 200, { ok: true }); }
      if (j.ren !== undefined) {
        const _nn = String(j.ren || '').replace(/[<>]/g, ' ').trim().slice(0, 30), _k = _fl.indexOf(_nm);
        if (!_nn || _k < 0 || (_nn !== _nm && _fl.includes(_nn))) return send(res, 400, { error: 'invalid' });
        _fl[_k] = _nn; arr.forEach(x => { if (x.folder === _nm) x.folder = _nn; });
        const _st = store.db.pzSettings; if (_st && _st[_nm] !== undefined) { _st[_nn] = _st[_nm]; delete _st[_nm]; }
        store.save(); return send(res, 200, { ok: true, folders: _fl });
      } }
        const fl = store.db.pzFolders = store.db.pzFolders || [];
        const nm = String(j.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
        if (!nm) return send(res, 400, { error: 'invalid' });
        if (j.del) {
          const k = fl.indexOf(nm); if (k >= 0) fl.splice(k, 1);
          arr.forEach(x => { if (x.folder === nm) delete x.folder; });
        } else if (!fl.includes(nm)) {
          if (fl.length >= 30) return send(res, 400, { error: 'ko‘p papka' });
          fl.push(nm);
        }
        store.save();
        return send(res, 200, { ok: true, folders: fl });
      }
      if (p === '/api/puzzle/move') {
        const fl = store.db.pzFolders = store.db.pzFolders || [];
        const pzm = arr.find(x => x.id === j.id);
        const nf = String(j.folder || '').replace(/[<>]/g, '').trim().slice(0, 30);
        if (!pzm) return send(res, 404, { error: 'none' });
        if (nf && !fl.includes(nf)) return send(res, 400, { error: 'papka yo‘q' });
        if (nf) pzm.folder = nf; else delete pzm.folder;
        store.save();
        return send(res, 200, { ok: true });
      }
      if (p === '/api/puzzle/del') {
        const i = arr.findIndex(x => x.id === j.id);
        if (i >= 0) { arr.splice(i, 1); store.save(); }
        return send(res, 200, { ok: true });
      }
      const b = j.board; const _sols = Array.isArray(j.sols) ? j.sols.slice(0, 10) : [j.sol]; const sol = _sols[0];
      const okB = Array.isArray(b) && b.length === 8 && b.every(r => Array.isArray(r) && r.length === 8 && r.every(v => Number.isInteger(v) && v >= 0 && v <= 4));
      const okS = _sols.length >= 1 && _sols.every(sl => Array.isArray(sl) && sl.length >= 1 && sl.length <= 60 && sl.every(s => Array.isArray(s) && s.length === 4 && s.every(v => Number.isInteger(v) && v >= 0 && v < 8)));
      if (!okB || !okS || (j.side !== 'w' && j.side !== 'b')) return send(res, 400, { error: 'noto‘g‘ri ma‘lumot' });
      const _dk = JSON.stringify(b) + j.side; if (arr.some(x => JSON.stringify(x.board) + x.side === _dk)) return send(res, 400, { error: 'Bunday masala allaqachon mavjud' });
      const id = 'p' + Date.now().toString(36); const _fn = String(j.folder || '').replace(/[<>]/g, '').trim().slice(0, 30), _fo = (store.db.pzFolders || []).includes(_fn) ? _fn : undefined;
      let _mx = 0; arr.forEach(x => { if (x.folder === _fo && x.no) _mx = Math.max(_mx, x.no); });
      const _no = (function () { const _u = new Set(); arr.forEach(x => { if (x.folder === _fo && x.no) _u.add(x.no); }); let _n = 1; while (_u.has(_n)) _n++; return _n; })(), _t0 = String(j.title || '').replace(/[<>]/g, '').trim().slice(0, 40), _title = (!_t0 || _t0 === 'Masala') ? 'Masala ' + _no : _t0; j.title = _title;
      arr.push({ id, no: _no, title: _title, level: [1, 2, 3].includes(j.level) ? j.level : 1, side: j.side, board: b, sol, sols: _sols, at: Date.now(), folder: _fo });
      store.save();
      try {
        const _gc = process.env.GROUP_CHAT_ID, _lk = process.env.TG_APP_LINK;
        if (_gc && _lk && process.env.BOT_TOKEN) {
          const _lv = ['', '🟢 Oson', '🟡 O‘rta', '🔴 Qiyin'][[1, 2, 3].includes(j.level) ? j.level : 1];
          const _pb = { chat_id: _gc, text: '🧩 Yangi shashka masalasi!\n' + String(j.title || 'Masala').replace(/[<>]/g, '').trim().slice(0, 40) + '\n' + _lv + ' · ' + (j.side === 'w' ? '⚪ Oq yuradi' : '⚫ Qora yuradi'),
            reply_markup: { inline_keyboard: [[{ text: '🧩 Yechish', url: _lk + '?startapp=pz_' + id }, { text: '🏆 TOP', callback_data: 'top10' }]] } };
          if (process.env.GROUP_TOPIC_ID) _pb.message_thread_id = Number(process.env.GROUP_TOPIC_ID);
          Array.from(new Set([String(_gc)].concat((store.db.groups || []).map(String), String(process.env.EXTRA_GROUP_IDS || '').split(',').map(x => x.trim()).filter(Boolean)))).forEach((_cid, _ix) => { const _pb2 = Object.assign({}, _pb, { chat_id: _cid }); if (_ix > 0) delete _pb2.message_thread_id; setTimeout(() => { require('./puzimg.js')(_pb2, b, j.side)
            .then(d => { if (!d || !d.ok) return console.log('Guruhga yuborilmadi:', d && d.description); const _pz = arr.find(x => x.id === id); if (_pz && d.result) { _pz.gs = _pz.gs || []; _pz.gs.push({ m: d.result.message_id, c: (d.result.chat && d.result.chat.id) || _cid, ph: !!d.result.photo, cap: d.result.photo ? String(_pb.text).split('\n\n')[0].slice(0, 1000) : _pb.text }); if (!_pz.g) _pz.g = _pz.gs[0]; store.save(); } }).catch(e => console.log('Guruh xatosi:', _cid, e.message)); }, _ix * 400); });
        }
      } catch (e) {}
      send(res, 200, { ok: true, id });
    });
    return true;
  }
    if (p.split('?')[0] === '/api/shop/img' && req.method === 'GET') {
    const _q = new URL(req.url, 'http://x').searchParams;
    const _it = (store.db.shop || []).find(x => _q.get('id') === 'def' ? !!x.def : x.id === _q.get('id'));
    const _d = _it && _it.imgs && ['w', 'b', 'wk', 'bk'].includes(_q.get('k')) ? _it.imgs[_q.get('k')] : '';
    const _m = /^data:(image\/(?:png|webp|jpeg));base64,(.+)$/.exec(_d || '');
    if (!_m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': _m[1], 'Cache-Control': 'public, max-age=86400' });
    res.end(Buffer.from(_m[2], 'base64'));
    return true;
  }
  if (p === '/api/shop' && req.method === 'GET') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    store.db.shop = store.db.shop || [];
    const _u = store.users()[String(_tg.id)] || {};
    const _adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
    const _all = Object.values(store.users());
    send(res, 200, { admin: _adm, link: process.env.TG_APP_LINK || '', diamonds: _u.diamonds || 0, owned: _u.owned || [], equipped: _u.equipped || '', def: (store.db.shop.find(x => x.def) || {}).id || '',
      list: store.db.shop.map(x => ({ id: x.id, name: x.name, price: x.price, by: x.by || '', def: !!x.def, sold: _all.filter(v => (v.owned || []).includes(x.id)).length })) });
    return true;
  }
  if (['/api/shop/buy', '/api/shop/equip', '/api/shop/add', '/api/shop/del', '/api/shop/default'].includes(p) && req.method === 'POST') {
    const _tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!_tg) { send(res, 401, { error: 'auth' }); return true; }
    readBody(req, 800000, body => {
      let j = {};
      try { j = JSON.parse(body); } catch (e) {}
      const arr = store.db.shop = store.db.shop || [];
      const u = store.getOrCreate(_tg);
      u.owned = u.owned || [];
      const adm = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(_tg.id));
      if (p === '/api/shop/buy') {
        const it = arr.find(x => x.id === j.id);
        if (!it) return send(res, 404, { error: 'Dona topilmadi' });
        if (u.owned.includes(it.id)) return send(res, 400, { error: 'Allaqachon sotib olingan' });
        if ((u.diamonds || 0) < it.price) return send(res, 400, { error: 'Olmos yetarli emas' });
        u.diamonds = (u.diamonds || 0) - it.price;
        u.owned.push(it.id);
        store.save();
        return send(res, 200, { ok: true, diamonds: u.diamonds });
      }
      if (p === '/api/shop/equip') {
        if (j.id) {
          if (j.id !== '-' && !arr.find(x => x.id === j.id)) return send(res, 404, { error: 'Dona topilmadi' });
          if (j.id !== '-' && !u.owned.includes(j.id) && !adm && !arr.some(x => x.id === j.id && x.def)) return send(res, 403, { error: 'Avval sotib oling' });
        }
        u.equipped = j.id ? String(j.id) : '';
        store.save();
        return send(res, 200, { ok: true, equipped: u.equipped });
      }
      if (!adm) return send(res, 403, { error: 'admin emassiz' });
      if (p === '/api/shop/default') {
        arr.forEach(x => { delete x.def; });
        const t = arr.find(x => x.id === j.id);
        if (t) t.def = true;
        store.save();
        return send(res, 200, { ok: true });
      }
      if (p === '/api/shop/del') {
        const i = arr.findIndex(x => x.id === j.id);
        if (i >= 0) { arr.splice(i, 1); store.save(); }
        return send(res, 200, { ok: true });
      }
      const nm = String(j.name || '').replace(/[<>]/g, '').trim().slice(0, 30);
      const imgs = {};
      let ok = !!nm && Number.isInteger(j.price) && j.price >= 0 && j.price <= 100000 && j.imgs && typeof j.imgs === 'object';
      ['w', 'b', 'wk', 'bk'].forEach(k => {
        const v = ok ? j.imgs[k] : '';
        if (typeof v === 'string' && /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(v) && v.length <= 150000) imgs[k] = v; else ok = false;
      });
      if (!ok) return send(res, 400, { error: 'Ma‘lumot noto‘g‘ri' });
      if (arr.length >= 200) return send(res, 400, { error: 'Do‘kon to‘ldi' });
      const id = 's' + Date.now().toString(36);
      arr.push({ id, name: nm, price: j.price, imgs, by: '', at: Date.now() });
      store.save();
      send(res, 200, { ok: true, id });
    });
    return true;
  }
  if (p === '/api/profile' && req.method === 'GET') {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    send(res, 200, {
      name: u.name, elo: u.elo || 1000, diamonds: u.diamonds || 0,
      wins: u.wins || 0, losses: u.losses || 0, draws: u.draws || 0, games: u.games || 0,
      streak: u.streak || 0, bestStreak: u.bestStreak || 0, hist: u.hist || [],
      created: u.created || 0, avatar: u.avatar || '', bio: u.bio || '', log: (u.log || []).slice(-10).reverse(), premium: store.isPremium(u)
    });
    return true;
  }
  if ((p === '/api/balance' && req.method === 'GET') || (p === '/api/daily' && req.method === 'POST')) {
    const tg = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!tg) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(tg);
    if (p === '/api/daily') send(res, 200, claimDaily(tg.id));
    else send(res, 200, { diamonds: u.diamonds || 0, canClaimDaily: u.lastDaily !== today() });
    return true;
  }
  return false;
}

module.exports = { CFG, balance, add, spend, claimDaily, rewardWin, chargeCreate, chargeJoin, refund, finishTournament, hostBonus, handle };
