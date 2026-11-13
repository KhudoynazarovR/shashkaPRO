'use strict';
// dragonsrv.js — DragonBOT «tez kunda»: kutayotganlar ro'yxati (hammaga ko'rinadi), admin rasmi, chiqqanda xabar.
const store = require('./store.js');
const D = () => { const d = store.db.dragon || (store.db.dragon = {}); d.w = d.w || {}; return d; };
const isAdm = id => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(String(id));
const nm = id => { const u = (store.users() || {})[id]; return u ? String(u.name || 'O‘yinchi').slice(0, 24) : 'O‘yinchi'; };
function view(uid) {
  const d = D(), L = Object.entries(d.w).sort((a, b) => a[1] - b[1]);
  return {
    n: L.length, me: !!d.w[uid], my: d.w[uid] ? L.findIndex(x => x[0] === String(uid)) + 1 : 0,
    first: L.slice(0, 20).map(([id, at], i) => ({ i: i + 1, name: nm(id), at })),
    recent: L.slice(-5).reverse().map(([id]) => id),
    sq: !!d.sq, wide: !!d.wide, v: d.v || 0, admin: isAdm(uid)
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
    if (p === '/api/dragon/toggle') { if (d.w[uid]) delete d.w[uid]; else d.w[uid] = Date.now(); store.save(); return h.send(res, 200, view(uid)); }
    if (!isAdm(uid)) return h.send(res, 403, { error: 'Faqat admin' });
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
