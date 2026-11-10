'use strict';
// flags.js — 🏳️ viloyat belgilari (SRX, TSH…) va chet el uchun davlat bayrog'i. Bayroqli turnir, natija rasmi va profil uchun.
const store = require('./store');
const REG = {
  'Toshkent': ['TSH', '#e11d48'], 'Andijon': ['AND', '#7c3aed'], 'Farg‘ona': ['FAR', '#0d9488'], 'Namangan': ['NAM', '#2563eb'],
  'Samarqand': ['SAM', '#16a34a'], 'Buxoro': ['BUX', '#ca8a04'], 'Navoiy': ['NAV', '#0891b2'], 'Qashqadaryo': ['QSH', '#d97706'],
  'Surxondaryo': ['SRX', '#0ea5e9'], 'Jizzax': ['JIZ', '#db2777'], 'Sirdaryo': ['SIR', '#65a30d'], 'Xorazm': ['XOR', '#9333ea'],
  'Qoraqalpog‘iston': ['QQR', '#0f766e'], 'Chet el': ['🌍', '#64748b']
};
const COUNTRIES = {
  RU: ['🇷🇺', 'Rossiya'], KZ: ['🇰🇿', 'Qozog‘iston'], KG: ['🇰🇬', 'Qirg‘iziston'], TJ: ['🇹🇯', 'Tojikiston'], TM: ['🇹🇲', 'Turkmaniston'],
  TR: ['🇹🇷', 'Turkiya'], KR: ['🇰🇷', 'Koreya'], US: ['🇺🇸', 'AQSh'], DE: ['🇩🇪', 'Germaniya'], GB: ['🇬🇧', 'Britaniya'],
  AE: ['🇦🇪', 'BAA'], PL: ['🇵🇱', 'Polsha'], UA: ['🇺🇦', 'Ukraina'], BY: ['🇧🇾', 'Belarus'], AZ: ['🇦🇿', 'Ozarbayjon'], XX: ['🌐', 'Boshqa']
};
// o'yinchi belgisi: { rg: 'SRX', rc: '#0ea5e9', rn: 'Surxondaryo' } yoki chet el: { rg: '🇷🇺', rc: '#64748b', rn: 'Rossiya', cf: 1 }
function badge(uid) {
  const u = (store.users() || {})[String(uid)];
  if (!u || !u.region || !REG[u.region]) return null;
  if (u.region === 'Chet el') { const c = COUNTRIES[u.country] || COUNTRIES.XX; return { rg: c[0], rc: '#64748b', rn: c[1], cf: 1, reg: 'Chet el' }; }
  return { rg: REG[u.region][0], rc: REG[u.region][1], rn: u.region, reg: u.region };
}
// viloyatlar hisobi: har viloyatning eng yaxshi 5 o'yinchisi ochkolari yig'indisi
function regStandings(players) {
  const by = new Map();
  for (const p of players) {
    if (p.bot || /^bot/.test(String(p.uid))) continue;
    const b = badge(p.uid); if (!b) continue;
    const k = b.reg; if (!by.has(k)) by.set(k, []);
    by.get(k).push({ uid: p.uid, name: p.name, score: +p.score || 0 });
  }
  return [...by].map(([r, a]) => {
    a.sort((x, y) => y.score - x.score);
    const top = a.slice(0, 5);
    return { r, k: REG[r][0], c: REG[r][1], n: a.length, score: Math.round(top.reduce((s, x) => s + x.score, 0) * 10) / 10, top };
  }).sort((x, y) => y.score - x.score || y.n - x.n);
}
module.exports = { REG, COUNTRIES, badge, regStandings };
