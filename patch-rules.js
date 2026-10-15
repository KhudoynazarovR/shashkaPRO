const fs = require('fs');

function seg(s, a, b, rep) {
  const i = s.indexOf(a), j = s.indexOf(b);
  if (i < 0 || j < 0 || j < i || s.indexOf(a, i + 1) >= 0 || s.indexOf(b, j + 1) >= 0) return null;
  return s.slice(0, i) + rep + s.slice(j);
}

const BRIDGE = `const DEADS=new WeakMap(),ENDED=new WeakMap();
function deadOf(b){return DEADS.get(b)||[]}
function isDeadSq(d,r,c){for(let i=0;i<d.length;i++)if(d[i].r===r&&d[i].c===c)return true;return false}
function rawCaptures(b,r,c,dead){
  const p=b[r][c],out=[];if(!p)return out;
  if(isKing(p)){for(const d of DIRS){let nr=r+d[0],nc=c+d[1],enemy=null;while(inside(nr,nc)){const x=b[nr][nc];if(!x){if(enemy)out.push({from:{r,c},to:{r:nr,c:nc},captures:[enemy]})}else{if(sameSide(p,x)||enemy||isDeadSq(dead,nr,nc))break;enemy={r:nr,c:nc}}nr+=d[0];nc+=d[1]}}}
  else{for(const d of DIRS){const mr=r+d[0],mc=c+d[1],lr=r+2*d[0],lc=c+2*d[1];if(inside(lr,lc)&&b[mr][mc]&&!sameSide(p,b[mr][mc])&&!isDeadSq(dead,mr,mc)&&!b[lr][lc])out.push({from:{r,c},to:{r:lr,c:lc},captures:[{r:mr,c:mc}]})}}
  return out
}
function keepStep(b,m){
  const n=clone(b),p=n[m.from.r][m.from.c];n[m.from.r][m.from.c]=EMPTY;
  n[m.to.r][m.to.c]=(p===WHITE&&m.to.r===0)?WHITE_KING:(p===BLACK&&m.to.r===7)?BLACK_KING:p;
  if(m.captures.length)DEADS.set(n,deadOf(b).concat(m.captures));
  return n
}
function captureSteps(b,r,c){
  const e=ENDED.get(b);if(e&&e.r===r&&e.c===c)return [];
  const dead=deadOf(b),raw=rawCaptures(b,r,c,dead);
  if(raw.length<2||!isKing(b[r][c]))return raw;
  const groups=new Map();
  for(const s of raw){const k=s.captures[0].r*8+s.captures[0].c;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s)}
  const out=[];
  for(const g of groups.values()){
    const cont=g.filter(s=>{const n=keepStep(b,s);return rawCaptures(n,s.to.r,s.to.c,deadOf(n)).length>0});
    out.push(...(cont.length?cont:g))
  }
  return out
}
function applyStep(b,m){
  const n=keepStep(b,m);
  if(m.captures.length&&!rawCaptures(n,m.to.r,m.to.c,deadOf(n)).length){
    deadOf(n).forEach(x=>{n[x.r][x.c]=EMPTY});DEADS.delete(n);ENDED.set(n,{r:m.to.r,c:m.to.c})
  }
  return n
}
function continueCapture(b,r,c,origin,caps,path,out){
  const steps=captureSteps(b,r,c);
  if(!steps.length){out.push({from:origin,to:{r,c},captures:caps.slice(),path:path.slice()});return}
  for(const s of steps)continueCapture(keepStep(b,s),s.to.r,s.to.c,origin,caps.concat(s.captures),path.concat([s.to]),out)
}
function allCaptures(b,side){
  const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(!p||(side===WHITE&&!isWhite(p))||(side===BLACK&&!isBlack(p)))continue;for(const s of captureSteps(b,r,c))continueCapture(keepStep(b,s),s.to.r,s.to.c,{r,c},s.captures,[s.to],out)}return out
}
`;

const CAPS = `function caps(b, r, c) {
    var p = b[r][c], out = [], me = sideOf(p), dead = b.dead || [];
    function isD(a, e) { for (var i = 0; i < dead.length; i++) if (dead[i][0] === a && dead[i][1] === e) return true; return false; }
    DIRS.forEach(function (d) {
      var nr, nc;
      if (p < 3) {
        var mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
        if (ins(lr, lc) && b[mr][mc] && sideOf(b[mr][mc]) !== me && !isD(mr, mc) && !b[lr][lc]) out.push({ f: [r, c], t: [lr, lc], x: [mr, mc] });
      } else {
        nr = r + d[0]; nc = c + d[1];
        while (ins(nr, nc) && !b[nr][nc]) { nr += d[0]; nc += d[1]; }
        if (ins(nr, nc) && sideOf(b[nr][nc]) !== me && !isD(nr, nc)) {
          var er = nr, ec = nc; nr += d[0]; nc += d[1];
          while (ins(nr, nc) && !b[nr][nc]) { out.push({ f: [r, c], t: [nr, nc], x: [er, ec] }); nr += d[0]; nc += d[1]; }
        }
      }
    });
    return out;
  }
  `;

const ADV = `function adv(g, s) {
    var n = copy(g.b), p = n[s.f[0]][s.f[1]], dead = (g.b.dead || []).slice();
    n[s.f[0]][s.f[1]] = 0;
    if (p === 1 && s.t[0] === 0) p = 3;
    if (p === 2 && s.t[0] === 7) p = 4;
    n[s.t[0]][s.t[1]] = p;
    if (s.x) dead.push([s.x[0], s.x[1]]);
    n.dead = dead;
    var more = !!s.x && caps(n, s.t[0], s.t[1]).length > 0;
    if (!more) { dead.forEach(function (x) { n[x[0]][x[1]] = 0; }); n.dead = []; }
    return { b: n, side: more ? g.side : (g.side === 'w' ? 'b' : 'w'), forced: more ? [s.t[0], s.t[1]] : null };
  }
  `;

const COPY0 = 'function copy(b) { return b.map(function (x) { return x.slice(); }); }';
const COPY1 = 'function copy(b) { var n = b.map(function (x) { return x.slice(); }); if (b.dead) n.dead = b.dead.slice(); return n; }';

{
  const s = fs.readFileSync('rules-bridge.js', 'utf8');
  if (s.includes('const DEADS=')) console.log('Allaqachon bor: rules-bridge.js');
  else {
    const t = seg(s, 'function captureSteps(b,r,c){', 'function getAllMoves(b,side){', BRIDGE);
    if (!t) { console.log('XATO: rules-bridge.js (kutilgan joy topilmadi)'); process.exit(1); }
    fs.writeFileSync('rules-bridge.js', t);
    console.log('TAYYOR: rules-bridge.js');
  }
}

for (const f of ['puzzles.js', 'menu.js']) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('b.dead')) { console.log('Allaqachon bor: ' + f); continue; }
  let t = seg(s, 'function caps(b, r, c) {', 'function simple(b, r, c) {', CAPS);
  if (t) t = seg(t, 'function adv(g, s) {', 'function findStep(', ADV);
  if (!t) { console.log('O‘TKAZILDI: ' + f + ' (kutilgan joy topilmadi)'); continue; }
  if (t.split(COPY0).length === 2) t = t.replace(COPY0, () => COPY1);
  fs.writeFileSync(f, t);
  console.log('TAYYOR: ' + f);
}
