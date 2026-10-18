'use strict';
const store = require('./store');
const { verifyInitData } = require('./auth');

const PACKS = {
  d60:  { stars: 50,  diamonds: 60 },
  d350: { stars: 250, diamonds: 350 },
  d800: { stars: 500, diamonds: 800 },
};

function tg(method, params) {
  return fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  }).then((r) => r.json());
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readJson(req, limit) {
  limit = limit || 4096;
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => {
      s += c;
      if (s.length > limit) { reject(new Error('big')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function handle(req, res, url) {
  if (url.pathname === '/api/balance' && req.method === 'GET') {
    const user = verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
    if (!user) { send(res, 401, { error: 'auth' }); return true; }
    const u = store.getOrCreate(user);
    send(res, 200, { diamonds: u.diamonds || 0, premium: store.isPremium(u) });
    return true;
  }

  if (url.pathname === '/api/invoice' && req.method === 'POST') {
    readJson(req).then(async (body) => {
      const user = verifyInitData(String(body.initData || ''), process.env.BOT_TOKEN);
      const pack = PACKS[body.pack];
      if (!user || !pack) return send(res, 400, { error: 'bad request' });
      store.getOrCreate(user);
      try {
        const r = await tg('createInvoiceLink', {
          title: '🪙 ' + pack.diamonds + ' tanga',
          description: 'Shashka Pro: ' + pack.diamonds + ' tanga',
          payload: user.id + ':' + body.pack,
          currency: 'XTR',
          prices: [{ label: 'Tanga', amount: pack.stars }],
        });
        if (!r.ok) { console.log('[pay] invoice xato:', r.description); return send(res, 500, { error: 'invoice' }); }
        send(res, 200, { link: r.result });
      } catch (e) {
        send(res, 500, { error: 'invoice' });
      }
    }).catch(() => send(res, 400, { error: 'bad request' }));
    return true;
  }

  return false;
}

async function onPreCheckout(q) {
  const parts = String(q.invoice_payload || '').split(':');
  const pack = PACKS[parts[1]];
  const ok = q.currency === 'XTR' && pack && String(q.from.id) === parts[0] && q.total_amount === pack.stars;
  await tg('answerPreCheckoutQuery', ok
    ? { pre_checkout_query_id: q.id, ok: true }
    : { pre_checkout_query_id: q.id, ok: false, error_message: 'To‘lovni tekshirib bo‘lmadi, qayta urinib ko‘ring.' });
}

async function onPayment(msg) {
  const p = msg.successful_payment;
  if (!p) return;
  const charge = p.telegram_payment_charge_id;
  const parts = String(p.invoice_payload || '').split(':');
  const pack = PACKS[parts[1]];

  console.log('[pay] to\'lov: user=' + (msg.from && msg.from.id) + ' pack=' + parts[1] + ' stars=' + p.total_amount + ' charge=' + charge);

  if (p.currency !== 'XTR' || !pack || !msg.from || String(msg.from.id) !== parts[0] || p.total_amount !== pack.stars) {
    console.log('[pay] SHUBHALI to\'lov, qo\'lda tekshiring:', charge);
    return;
  }

  const u = store.users()[parts[0]] || store.getOrCreate(msg.from);
  u.charges = u.charges || [];
  if (u.charges.includes(charge)) return;
  u.charges.push(charge);
  if (u.charges.length > 50) u.charges.shift();
  u.diamonds = (u.diamonds || 0) + pack.diamonds;
  store.save();

  await tg('sendMessage', {
    chat_id: msg.chat.id,
    text: '🪙 +' + pack.diamonds + ' tanga qo‘shildi! Balans: ' + u.diamonds,
  });
}

module.exports = { handle, onPreCheckout, onPayment, PACKS };
