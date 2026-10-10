'use strict';
const crypto = require('crypto');

// Telegram Mini App initData ni tekshiradi. To'g'ri bo'lsa user obyektini qaytaradi.
function verifyInitData(initData, botToken, maxAgeSec = 86400) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const check = [...params.entries()]
    .map(([k, v]) => k + '=' + v)
    .sort()
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(check).digest();
  let given;
  try { given = Buffer.from(hash, 'hex'); } catch { return null; }
  if (given.length !== calc.length || !crypto.timingSafeEqual(calc, given)) return null;

  const age = Math.floor(Date.now() / 1000) - Number(params.get('auth_date') || 0);
  if (age > maxAgeSec || age < -300) return null;

  try { return JSON.parse(params.get('user')); } catch { return null; }
}

module.exports = { verifyInitData };
