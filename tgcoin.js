'use strict';
// tgcoin.js — Telegram'ga ketadigan barcha xabarlarda 🪙 → 💰 (Android Telegram'da 🪙 kulrang/qora chiqadi).
// Mini-ilova ichida 🪙 o'zgarmaydi: faqat api.telegram.org ga yuboriladigan so'rov tanasi almashtiriladi.
if (typeof global.fetch === 'function' && !global.fetch.__coin) {
  const orig = global.fetch, A = '\u{1FA99}', B = '\u{1F4B0}';
  const fix = s => (typeof s === 'string' && s.indexOf(A) >= 0) ? s.split(A).join(B) : s;
  const wrapped = function (url, opts) {
    try {
      if (opts && opts.body && /api\.telegram\.org\/bot/.test(String(url))) {
        const b = opts.body;
        if (typeof b === 'string') opts = Object.assign({}, opts, { body: fix(b) });
        else if (typeof FormData !== 'undefined' && b instanceof FormData) {
          let need = false; for (const [, v] of b.entries()) if (typeof v === 'string' && v.indexOf(A) >= 0) { need = true; break; }
          if (need) { const n = new FormData(); for (const [k, v] of b.entries()) { if (typeof v === 'string') n.append(k, fix(v)); else n.append(k, v, v.name); } opts = Object.assign({}, opts, { body: n }); }
        }
      }
    } catch (e) {}
    return orig.call(this, url, opts);
  };
  wrapped.__coin = true;
  global.fetch = wrapped;
}
