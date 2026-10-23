'use strict';
/* bazaserver.js — "Partiyalar bazasi": rus shashkasi bo'yicha 109 ming usta partiyasi (chempionatlar, turnirlar).
   Manba: Aurora Borealis dasturining rus shashkasi bazasi (muallif A. Svirin).
   Fayllar: partiyalar/games.txt.gz (har qatorda: oq\tqora\tturnir\tjoy\tyil\tnatija\tyurishlar), partiyalar/names.json
   Yurishlar: har bir yurish — maydonlar zanjiri (1..32 → 'a'..'F', 1 = a1), yurishlar bo'sh joy bilan ajratilgan.
   API:  GET /api/baza/list?q=&page=&res=   GET /api/baza/game?id=   */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
let G = null, NM = null, LC = null;
function load() {
  if (G) return;
  const dir = path.join(__dirname, 'partiyalar');
  NM = JSON.parse(fs.readFileSync(path.join(dir, 'names.json'), 'utf8'));
  const L = zlib.gunzipSync(fs.readFileSync(path.join(dir, 'games.txt.gz'))).toString('utf8').split('\n');
  G = new Array(L.length); LC = new Array(L.length);
  for (let i = 0; i < L.length; i++) {
    const f = L[i].split('\t');
    G[i] = { w: +f[0], b: +f[1], t: +f[2], s: +f[3], y: +f[4], r: +f[5], m: f[6] || '' };
    LC[i] = (nm('n', G[i].w) + ' | ' + nm('n', G[i].b) + ' | ' + nm('t', G[i].t) + ' | ' + nm('s', G[i].s) + ' | ' + (G[i].y || '')).toLowerCase();
  }
  console.log('[Baza] partiyalar:', G.length);
}
function nm(k, i) { return (NM && NM[k] && NM[k][i]) || ''; }
const RES = { 1: '1-0', 2: '½-½', 3: '0-1' };
function brief(i) { const g = G[i]; return { id: i, w: nm('n', g.w) || '?', b: nm('n', g.b) || '?', t: nm('t', g.t), s: nm('s', g.s), y: g.y || null, r: RES[g.r] || '*', n: g.m ? g.m.split(' ').length : 0 }; }
// lotin/kirill farqi bo'lmasin: qidiruvda ikkala yozuvni ham sinaymiz
const TR = { a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', c: 'ц' };
const TR2 = [['sh', 'ш'], ['ch', 'ч'], ['zh', 'ж'], ['yu', 'ю'], ['ya', 'я'], ['kh', 'х'], ['ts', 'ц']];
function cyr(s) { let x = s; for (const [a, b] of TR2) x = x.split(a).join(b); return x.replace(/[a-z]/g, ch => TR[ch] || ch); }
let cacheQ = '', cacheR = null;
function search(q, res) {
  const key = q + '|' + res; if (key === cacheQ) return cacheR;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean).map(w => [w, cyr(w)]);
  const out = [];
  for (let i = G.length - 1; i >= 0; i--) {
    if (res && String(G[i].r) !== res) continue;
    const s = LC[i]; let ok = true;
    for (const [a, b] of words) if (s.indexOf(a) < 0 && s.indexOf(b) < 0) { ok = false; break; }
    if (ok) out.push(i);
  }
  out.sort((a, b) => (G[b].y || 0) - (G[a].y || 0) || b - a);   // yangi partiyalar birinchi
  cacheQ = key; cacheR = out; return out;
}
function handle(req, res, url, send) {
  const p = url.pathname;
  try { load(); } catch (e) { send(res, 500, { error: 'baza yuklanmadi' }); return true; }
  if (p === '/api/baza/list') {
    const q = String(url.searchParams.get('q') || '').trim().slice(0, 60), r = String(url.searchParams.get('res') || '');
    const page = Math.max(0, Math.min(5000, +url.searchParams.get('page') || 0)), PER = 30;
    const ids = search(q, /^[123]$/.test(r) ? r : '');
    send(res, 200, { total: ids.length, all: G.length, page, items: ids.slice(page * PER, page * PER + PER).map(brief) });
    return true;
  }
  if (p === '/api/baza/game') {
    const id = +url.searchParams.get('id');
    if (!(id >= 0 && id < G.length)) { send(res, 404, { error: 'topilmadi' }); return true; }
    send(res, 200, Object.assign(brief(id), { mv: G[id].m }));
    return true;
  }
  return false;
}
module.exports = { handle };
