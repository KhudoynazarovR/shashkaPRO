const fs = require('fs');
let H = fs.readFileSync('index.html', 'utf8');
if (H.includes('drawArrow')) { console.log('Allaqachon bor'); process.exit(0); }
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: ' + name + ' -> ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
const fn = `function drawArrow(B){
 B.style.position='relative';
 if(!G.hint||G.hint.length<2)return;
 const pt=i=>{const r=i>>3,c=i&7,vr=G.flip?7-r:r,vc=G.flip?7-c:c;return[vc+.5,vr+.5]};
 const a=pt(G.hint[0]),b=pt(G.hint[1]);
 const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
 const hx=b[0]-ux*.38,hy=b[1]-uy*.38,px=-uy*.24,py=ux*.24;
 B.insertAdjacentHTML('beforeend','<svg viewBox="0 0 8 8" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:5"><g opacity=".85" fill="#2d7ff9" stroke="#2d7ff9"><line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+hx+'" y2="'+hy+'" stroke-width=".17" stroke-linecap="round"/><polygon stroke="none" points="'+b[0]+','+b[1]+' '+(hx+px)+','+(hy+py)+' '+(hx-px)+','+(hy-py)+'"/></g></svg>')}
`;
H = rep(H, 'function render(){', fn + 'function render(){', 'render');
H = rep(H, 'B.innerHTML=h;', 'B.innerHTML=h;drawArrow(B);', 'innerHTML');
fs.writeFileSync('index.html', H);
console.log('TAYYOR');
