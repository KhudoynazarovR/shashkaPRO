const fs = require('fs');
function apply(file, reps) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('/api/shop/default') || s.includes("a === 'def'")) return null;
  for (const [a, b] of reps) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('XATO: ' + file + ' -> ' + a.slice(0, 50) + ' (' + n + ')'); process.exit(1); }
    s = s.replace(a, () => b);
  }
  return s;
}
const srv = [
  ["owned: _u.owned || [], equipped: _u.equipped || '',", "owned: _u.owned || [], equipped: _u.equipped || '', def: (store.db.shop.find(x => x.def) || {}).id || '',"],
  ["by: x.by || '',", "by: x.by || '', def: !!x.def,"],
  ["['/api/shop/buy', '/api/shop/equip', '/api/shop/add', '/api/shop/del'].includes(p)", "['/api/shop/buy', '/api/shop/equip', '/api/shop/add', '/api/shop/del', '/api/shop/default'].includes(p)"],
  ["if (!arr.find(x => x.id === j.id)) return send(res, 404", "if (j.id !== '-' && !arr.find(x => x.id === j.id)) return send(res, 404"],
  ["if (!u.owned.includes(j.id) && !adm) return", "if (j.id !== '-' && !u.owned.includes(j.id) && !adm && !arr.some(x => x.id === j.id && x.def)) return"],
  ["if (p === '/api/shop/del') {", "if (p === '/api/shop/default') {\n        arr.forEach(x => { delete x.def; });\n        const t = arr.find(x => x.id === j.id);\n        if (t) t.def = true;\n        store.save();\n        return send(res, 200, { ok: true });\n      }\n      if (p === '/api/shop/del') {"]
];
const cli = [
  ["if (!S.equipped || !S.list.some(function (x) { return x.id === S.equipped; })) return;", "var eqId = S.equipped === '-' ? '' : (S.equipped || S.def || ''); if (!eqId || !S.list.some(function (x) { return x.id === eqId; })) return;"],
  ["var id = S.equipped, B =", "var id = eqId, B ="],
  ["var own = S.owned.indexOf(it.id) >= 0, eq = S.equipped === it.id;", "var own = S.owned.indexOf(it.id) >= 0 || !!it.def, eq = (S.equipped === '-' ? '' : (S.equipped || S.def)) === it.id;"],
  ["if (S.admin) h += '<button data-a=\"del\"", "if (S.admin) h += '<button data-a=\"def\" data-id=\"' + it.id + '\" style=\"' + BG + ';width:92%\">' + (it.def ? '⭐ Asosiy (bekor qilish)' : '⭐ Hamma uchun asosiy') + '</button>'; if (S.admin) h += '<button data-a=\"del\""],
  ["{ id: S.equipped === id ? '' : id }", "{ id: ((S.equipped === '-' ? '' : (S.equipped || S.def)) === id) ? '-' : id }"],
  ["msg = d.equipped ?", "msg = (d.equipped && d.equipped !== '-') ?"],
  ["} else if (a === 'del') {", "} else if (a === 'def') {\n      api('/api/shop/default', { id: it.def ? '' : id }).then(reload).then(function () { msg = '✅ Saqlandi'; draw(); });\n    } else if (a === 'del') {"]
];
const out = {};
out['economy.js'] = apply('economy.js', srv);
out['shop.js'] = apply('shop.js', cli);
out['menu.js'] = apply('menu.js', cli);
for (const f in out) if (out[f]) fs.writeFileSync(f, out[f]);
console.log('TAYYOR');
