'use strict';
// dragonsrv.js — DragonBOT «tez kunda»: kutayotganlar ro'yxati (hammaga ko'rinadi), admin rasmi, chiqqanda xabar.
const store = require('./store.js');
const D = () => { const d = store.db.dragon || (store.db.dragon = {}); d.w = d.w || {}; d.cm = d.cm || {}; return d; };
const DEF_DESC = 'King Kong’ning barcha o‘yinlaridan saboq olgan, nazariya, endshpil bazasi va repertuarni biladigan yangi bot. Uni birinchi bo‘lib kim yengadi?';
const isAdm = id => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(id));
const nm = id => { const u = (store.users() || {})[id]; return u ? String(u.name || 'O‘yinchi').slice(0, 24) : 'O‘yinchi'; };
const cu = (id, c) => String(c.u || id);   // izoh egasi (eski izohlarda kalit = uid)
function view(uid) {
  const d = D(), L = Object.entries(d.w).sort((a, b) => a[1] - b[1]);
  uid = String(uid);
  return {
    n: L.length, me: !!d.w[uid], my: d.w[uid] ? L.findIndex(x => x[0] === String(uid)) + 1 : 0,
    first: L.slice(0, 20).map(([id, at], i) => ({ i: i + 1, uid: id, name: nm(id), at, mine: id === uid })),
    recent: L.slice(-5).reverse().map(([id]) => id),
    sq: !!d.sq, wide: !!d.wide, v: d.v || 0, admin: isAdm(uid),
    desc: d.desc == null ? DEF_DESC : d.desc,
    now: Date.now(),
    cm: Object.entries(d.cm).map(([id, c]) => ({ id, uid: cu(id, c), name: nm(cu(id, c)), t: c.t, at: c.at, n: Object.keys(c.lk || {}).length, liked: !!(c.lk || {})[uid], mine: cu(id, c) === uid, pin: d.pin === id,
      re: c.re ? { name: nm(c.re.u), t: c.re.t } : null }))
      .sort((a, b) => (b.pin - a.pin) || b.at - a.at).slice(0, 80)
  };
}
function handle(req, res, p, h) {
  if (!p.startsWith('/api/dragon')) return false;
  if (p === '/api/dragon/img' && req.method === 'GET') {
    const u = new URL(req.url, 'http://x'), k = u.searchParams.get('k') === 'wide' ? 'wide' : 'sq', m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(D()[k] || '');
    if (!m) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=31536000, immutable' }); res.end(Buffer.from(m[2], 'base64')); return true;
  }
  const t = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!t) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(t.id);
  if (req.method === 'GET') { h.send(res, 200, view(uid)); return true; }
  h.readBody(req, 3e6, body => {
    let j = {}; try { j = JSON.parse(body || '{}'); } catch (e) {}
    const d = D();
    if (p === '/api/dragon/comment') {   // 💬 yangi izoh (javob bo'lishi mumkin: j.re — izoh id)
      let tx = String(j.text || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      if (/(https?:\/\/|www\.|t\.me\/|\.(com|uz|ru|org|net)\b|@[a-z0-9_]{4,})/i.test(tx)) return h.send(res, 400, { error: 'Havola yozib bo‘lmaydi' });
      try { const M = require('./mod.js'); if (M.isMuted && M.isMuted(uid)) return h.send(res, 403, { error: 'Sizga yozish vaqtincha taqiqlangan' }); tx = M.censor(tx); } catch (e) {}
      if (!tx) return h.send(res, 400, { error: 'Izoh bo‘sh' });
      const mine = Object.entries(d.cm).filter(([id, c]) => cu(id, c) === uid), last = Math.max(0, ...mine.map(([, c]) => c.at || 0));
      if (Date.now() - last < 15000) return h.send(res, 400, { error: 'Biroz kuting (15 soniya)' });
      if (mine.length >= 20) return h.send(res, 400, { error: 'Ko‘pi bilan 20 ta izoh' });
      const c = { u: uid, t: tx, at: Date.now(), lk: {} }, rc = j.re && d.cm[String(j.re)];
      if (rc) c.re = { id: String(j.re), u: cu(String(j.re), rc), t: String(rc.t).slice(0, 60) };
      d.cm[uid + '_' + Date.now().toString(36)] = c;
      const all = Object.entries(d.cm).filter(([id]) => id !== d.pin).sort((a, b) => a[1].at - b[1].at);
      while (all.length > 400) delete d.cm[all.shift()[0]];
      store.save(); return h.send(res, 200, view(uid));
    }
    if (p === '/api/dragon/cdel') {   // o'z izohini yoki admin — istalganini
      const id = String(j.id || j.uid || ''), c = d.cm[id];
      if (c && (cu(id, c) === uid || isAdm(uid))) { delete d.cm[id]; if (d.pin === id) delete d.pin; store.save(); }
      return h.send(res, 200, view(uid));
    }
    if (p === '/api/dragon/like') { const c = d.cm[String(j.id || j.uid)]; if (c) { c.lk = c.lk || {}; if (c.lk[uid]) delete c.lk[uid]; else c.lk[uid] = 1; store.save(); } return h.send(res, 200, view(uid)); }
    if (p === '/api/dragon/toggle') { if (d.w[uid]) delete d.w[uid]; else d.w[uid] = Date.now(); store.save(); return h.send(res, 200, view(uid)); }
    if (!isAdm(uid)) return h.send(res, 403, { error: 'Faqat admin' });
    if (p === '/api/dragon/pin') { const id = String(j.id || ''); if (d.pin === id || !d.cm[id]) delete d.pin; else d.pin = id; store.save(); return h.send(res, 200, view(uid)); }
    if (p === '/api/dragon/desc') { d.desc = String(j.text || '').replace(/[<>]/g, '').trim().slice(0, 400); store.save(); return h.send(res, 200, view(uid)); }
    if (p === '/api/dragon/setimg') {
      const k = j.k === 'wide' ? 'wide' : 'sq', s = String(j.data || '');
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(s) || s.length > 2.6e6) return h.send(res, 400, { error: 'Rasm noto‘g‘ri yoki juda katta' });
      d[k] = s; d.v = Date.now(); store.save(); return h.send(res, 200, view(uid));
    }
    if (p === '/api/dragon/notify') {
      const text = String(j.text || '').trim().slice(0, 1000); if (!text) return h.send(res, 400, { error: 'Matn yo‘q' });
      const ids = Object.keys(d.w).filter(x => /^\d+$/.test(x)); let i = 0, ok = 0;
      const app = (process.env.TG_APP_LINK || process.env.APP_LINK || '').replace(/\/$/, '');
      const next = () => {
        if (i >= ids.length) { console.log('[dragon] xabar:', ok, '/', ids.length); return; }
        const m = { chat_id: Number(ids[i++]), text }; if (app) m.reply_markup = { inline_keyboard: [[{ text: 'Ochish', url: app }]] };
        Promise.resolve(require('./gcard.js').tg('sendMessage', m)).then(r => { if (r && r.ok) ok++; }).catch(() => {});
        setTimeout(next, 70);
      };
      next(); return h.send(res, 200, { ok: true, n: ids.length });
    }
    h.send(res, 404, { error: 'yo‘q' });
  });
  return true;
}
module.exports = { handle, view };
