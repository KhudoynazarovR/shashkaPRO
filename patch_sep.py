import re,sys
p='bazaserver.js'
s=open(p,encoding='utf8').read()
a="function handle(req, res, url, send) {"
m=re.search(r"return\s*\{\s*id:\s*i\s*,",s)
if s.count(a)!=1 or not m or 'handle0' in s:
    print('XATO bazaserver:',s.count(a),bool(m),'handle0' in s); sys.exit(1)
s=s[:m.start()]+"return { id: i, q: G[i].o ? 1 : 0,"+s[m.end():]
s=s.replace(a,"""function handle(req, res, url, send) {
  if (url.searchParams.get('set') !== 'd') return handle0(req, res, url, send);
  try { load(); loadD(); } catch (e) { send(res, 500, { error: 'baza yuklanmadi' }); return true; }
  const sg = G, sl = LC; G = GD; LC = LCD; cacheQ = ''; cacheR = null;
  try { return handle0(req, res, url, send); } finally { G = sg; LC = sl; cacheQ = ''; cacheR = null; }
}
let GD = null, LCD = null;
function loadD() {
  if (GD) return;
  GD = []; LCD = [];
  let t = ''; try { t = fs.readFileSync(path.join(__dirname, 'partiyalar', 'dasturlar.txt'), 'utf8'); } catch (e) {}
  for (const l of t.split('\\n')) { if (!l) continue; const f = l.split('\\t'); const g = { w: +f[0], b: +f[1], t: +f[2], s: +f[3], y: +f[4], r: +f[5], m: f[6] || '', o: f[7] || '' }; GD.push(g); LCD.push((nm('n', g.w) + ' | ' + nm('n', g.b) + ' | ' + nm('t', g.t) + ' | ' + nm('s', g.s) + ' | ' + (g.y || '')).toLowerCase()); }
}
function handle0(req, res, url, send) {""")
open(p,'w',encoding='utf8').write(s)

p='baza.js'
s=open(p,encoding='utf8').read()
chk=["function list() {","fetch('/api/baza/list?q='","fetch('/api/baza/game?id=' + id","var inp = ov.querySelector('.sr');","items.forEach(function (g) {"]
for k in chk:
    if s.count(k)!=1: print('XATO baza.js:',k,s.count(k)); sys.exit(1)
if 'bset' in s: print('baza.js allaqachon o‘zgargan'); sys.exit(1)
s=s.replace("function list() {","var bset = '', _pk = null;\n  function list() {")
s=s.replace("fetch('/api/baza/list?q='","fetch('/api/baza/list?set=' + bset + '&q='")
s=s.replace("fetch('/api/baza/game?id=' + id","fetch('/api/baza/game?set=' + bset + '&id=' + id")
s=s.replace("var inp = ov.querySelector('.sr');","var inp = ov.querySelector('.sr');\n    var dk = document.createElement('button'); dk.style.cssText = 'display:block;width:100%;margin:0 0 10px;padding:12px;border:0;border-radius:12px;background:#2d2775;color:#fff;font-size:15px;font-weight:700'; dk.textContent = bset === 'd' ? '← Asosiy baza' : '📁 Dasturlar partiyalari (35)'; dk.onclick = function () { bset = bset === 'd' ? '' : 'd'; q = ''; res = ''; load(true); }; inp.parentNode.insertBefore(dk, inp);")
s=s.replace("items.forEach(function (g) {","_pk = null;\n    items.forEach(function (g) { if (bset === 'd' && _pk !== g.q) { _pk = g.q; h += '<div class=\"sub\"><b>' + (g.q ? '🎲 Qura' : '📋 Standart') + '</b></div>'; }")
open(p,'w',encoding='utf8').write(s)
print('patched')
