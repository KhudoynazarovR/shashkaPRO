(function(){
const DIRS=[[1,1],[1,-1],[-1,1],[-1,-1]];
const EMPTY=0,WHITE=1,BLACK=2,WHITE_KING=3,BLACK_KING=4;
function clone(b){return b.map(r=>r.slice())}
function inside(r,c){return r>=0&&r<8&&c>=0&&c<8}
function isWhite(p){return p===WHITE||p===WHITE_KING}
function isBlack(p){return p===BLACK||p===BLACK_KING}
function isKing(p){return p===WHITE_KING||p===BLACK_KING}
function sameSide(a,b){return(isWhite(a)&&isWhite(b))||(isBlack(a)&&isBlack(b))}
function startPosition(){const b=Array.from({length:8},()=>Array(8).fill(EMPTY));for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2)b[r][c]=BLACK;for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2)b[r][c]=WHITE;return b}
function simpleMoves(b,r,c){
  const p=b[r][c],out=[];if(!p)return out;
  if(isKing(p)){for(const d of DIRS){let nr=r+d[0],nc=c+d[1];while(inside(nr,nc)&&!b[nr][nc]){out.push({from:{r,c},to:{r:nr,c:nc},captures:[]});nr+=d[0];nc+=d[1]}}}
  else{const dr=isWhite(p)?-1:1;for(const d of DIRS)if(d[0]===dr){const nr=r+d[0],nc=c+d[1];if(inside(nr,nc)&&!b[nr][nc])out.push({from:{r,c},to:{r:nr,c:nc},captures:[]})}}
  return out
}
function captureSteps(b,r,c){
  const p=b[r][c],out=[];if(!p)return out;
  if(isKing(p)){for(const d of DIRS){let nr=r+d[0],nc=c+d[1],enemy=null;while(inside(nr,nc)){const x=b[nr][nc];if(!x){if(enemy)out.push({from:{r,c},to:{r:nr,c:nc},captures:[enemy]})}else{if(sameSide(p,x)||enemy)break;enemy={r:nr,c:nc}}nr+=d[0];nc+=d[1]}}}
  else{for(const d of DIRS){const mr=r+d[0],mc=c+d[1],lr=r+2*d[0],lc=c+2*d[1];if(inside(mr,mc)&&inside(lr,lc)&&b[mr][mc]&&!sameSide(p,b[mr][mc])&&!b[lr][lc])out.push({from:{r,c},to:{r:lr,c:lc},captures:[{r:mr,c:mc}]})}}
  return out
}
function applyStep(b,m){const n=clone(b),p=n[m.from.r][m.from.c];n[m.from.r][m.from.c]=EMPTY;m.captures.forEach(x=>n[x.r][x.c]=EMPTY);n[m.to.r][m.to.c]=p;return n}
function continueCapture(b,r,c,origin,caps,path,out){
  const steps=captureSteps(b,r,c);
  if(!steps.length){out.push({from:origin,to:{r,c},captures:caps.slice(),path:path.slice()});return}
  for(const s of steps)continueCapture(applyStep(b,s),s.to.r,s.to.c,origin,caps.concat(s.captures),path.concat([s.to]),out)
}
function allCaptures(b,side){
  const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(!p||(side===WHITE&&!isWhite(p))||(side===BLACK&&!isBlack(p)))continue;for(const s of captureSteps(b,r,c))continueCapture(applyStep(b,s),s.to.r,s.to.c,{r,c},s.captures,[s.to],out)}return out
}
function getAllMoves(b,side){
  const caps=allCaptures(b,side);if(caps.length)return caps;const out=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(!p||(side===WHITE&&!isWhite(p))||(side===BLACK&&!isBlack(p)))continue;out.push(...simpleMoves(b,r,c))}
  return out
}
function applyMove(b,m){
  const n=clone(b),p=n[m.from.r][m.from.c];n[m.from.r][m.from.c]=EMPTY;m.captures.forEach(x=>n[x.r][x.c]=EMPTY);
  let q=p;if(p===WHITE&&m.to.r===0)q=WHITE_KING;if(p===BLACK&&m.to.r===7)q=BLACK_KING;n[m.to.r][m.to.c]=q;return n
}
window.WHITE=WHITE;window.BLACK=BLACK;
window.initialBoard=startPosition;
window.applyStep=applyStep;window.captureSteps=captureSteps;
window.simpleSteps=simpleMoves;window.allCaptures=allCaptures;
window.allMoves=getAllMoves;window.sameSide=sameSide;
window.isWhite=isWhite;window.isKing=isKing;
})();
