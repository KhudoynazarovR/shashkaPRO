
"use strict";
const $=id=>document.getElementById(id),DIRS=[[-1,-1],[-1,1],[1,-1],[1,1]],ins=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const sq=i=>'abcdefgh'[i&7]+(8-(i>>3)),fmt=m=>m.path.map(sq).join(m.caps.length?'x':'-');
/* ---------- i18n ---------- */
const K='new undo redo hint flip resign draw analyze play settings editor copy imp exp clear reset start think turnW turnB winW winB drw tap ok no'.split(' ');
const L={uz:`Yangi o'yin|Orqaga|Oldinga|Maslahat|Aylantirish|Taslim|Durang|Tahlil|O'yin|Sozlamalar|Muharrir|Nusxa|Import|Eksport|Tozalash|Boshlang'ich|Shundan o'ynash|AI o'ylamoqda…|Oq yuradi|Qora yuradi|Oq g'alaba qozondi|Qora g'alaba qozondi|Durang|Yana bosing|Durang qabul qilindi|AI rad etdi`,
ru:`Новая игра|Назад|Вперёд|Подсказка|Повернуть|Сдаться|Ничья|Анализ|Игра|Настройки|Редактор|Копировать|Импорт|Экспорт|Очистить|Сброс|Играть отсюда|ИИ думает…|Ход белых|Ход чёрных|Победили белые|Победили чёрные|Ничья|Нажмите ещё раз|Ничья принята|ИИ отказал`,
en:`New game|Undo|Redo|Hint|Flip|Resign|Draw|Analyze|Play|Settings|Editor|Copy|Import|Export|Clear|Reset|Play from here|AI thinking…|White to move|Black to move|White wins|Black wins|Draw|Tap again|Draw accepted|AI declined`};
const T=k=>(L[S.lang]||L.en).split('|')[K.indexOf(k)];
/* ---------- settings ---------- */
let S={lang:'uz',lvl:'2',mode:'ai',col:'w',tc:'300+3',th:'classic',ps:'img',theme:'auto',co:true,dots:true,hl:true,mc:true,snd:true,open:'std',mm:false,km:'♛',bw:'100',pz:'80'};
try{Object.assign(S,JSON.parse(localStorage.getItem('sp_s')||'{}'))}catch(e){}
const TG=window.Telegram&&Telegram.WebApp;
if(TG){try{TG.ready();TG.expand();if(TG.disableVerticalSwipes)TG.disableVerticalSwipes();
 TG.setHeaderColor&&TG.setHeaderColor('bg_color');TG.setBackgroundColor&&TG.setBackgroundColor('bg_color')}catch(e){}}
const hap=t=>{try{TG&&TG.HapticFeedback&&TG.HapticFeedback.impactOccurred(t)}catch(e){}};
const sv=()=>{try{localStorage.setItem('sp_s',JSON.stringify(S))}catch(e){}};
if(!S.v2){S.ps='img';S.pz='90';S.v2=1;sv()}
let ST={w:0,l:0,d:0};try{Object.assign(ST,JSON.parse(localStorage.getItem('sp_st')||'{}'))}catch(e){}
const svs=()=>{try{localStorage.setItem('sp_st',JSON.stringify(ST))}catch(e){}};
/* ---------- rules: Russian draughts ---------- */
function init(){const b=Array(64).fill(0);for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2){if(r<3)b[r*8+c]=-1;else if(r>4)b[r*8+c]=1}return b}
function capsFrom(b,from){
 const p=b[from],s=Math.sign(p),out=[];b[from]=0;
 const dfs=(pos,k,caps,path,o)=>{
  const r=pos>>3,c=pos&7;let found=false;
  for(const[dr,dc]of DIRS){
   if(!k){
    const lr=r+2*dr,lc=c+2*dc;if(!ins(lr,lc))continue;
    const m=(r+dr)*8+c+dc,l=lr*8+lc;
    if(b[m]*s<0&&!caps.includes(m)&&b[l]===0){found=true;dfs(l,(s>0&&lr===0)||(s<0&&lr===7),[...caps,m],[...path,l],o)}
   }else{
    let nr=r+dr,nc=c+dc;
    while(ins(nr,nc)&&b[nr*8+nc]===0){nr+=dr;nc+=dc}
    if(!ins(nr,nc))continue;
    const m=nr*8+nc;if(b[m]*s>=0||caps.includes(m))continue;
    const lands=[];let lr=nr+dr,lc=nc+dc;
    while(ins(lr,lc)&&b[lr*8+lc]===0){lands.push(lr*8+lc);lr+=dr;lc+=dc}
    if(!lands.length)continue;found=true;
    const rs=lands.map(l=>{const oo=[];const e=dfs(l,true,[...caps,m],[...path,l],oo);return{oo,e}});
    const any=rs.some(x=>x.e);rs.forEach(x=>{if(!any||x.e)o.push(...x.oo)});
   }
  }
  if(!found&&caps.length)o.push({path,caps,pk:k});
  return found};
 dfs(from,Math.abs(p)===2,[],[from],out);b[from]=p;return out}
function simple(b,from){
 const p=b[from],s=Math.sign(p),r=from>>3,c=from&7,o=[];
 if(Math.abs(p)===2){for(const[dr,dc]of DIRS){let nr=r+dr,nc=c+dc;while(ins(nr,nc)&&!b[nr*8+nc]){o.push({path:[from,nr*8+nc],caps:[]});nr+=dr;nc+=dc}}}
 else for(const dc of[-1,1]){const nr=r-s,nc=c+dc;if(ins(nr,nc)&&!b[nr*8+nc])o.push({path:[from,nr*8+nc],caps:[]})}
 return o}
function legal(b,side){const cs=[];for(let i=0;i<64;i++)if(b[i]*side>0)cs.push(...capsFrom(b,i));if(cs.length)return cs;
 const ms=[];for(let i=0;i<64;i++)if(b[i]*side>0)ms.push(...simple(b,i));return ms}
function apply(b,m){const n=b.slice(),f=m.path[0],t=m.path[m.path.length-1];let p=n[f];n[f]=0;m.caps.forEach(x=>n[x]=0);
 if(Math.abs(p)===1&&(m.pk||(p>0&&t>>3===0)||(p<0&&t>>3===7)))p*=2;n[t]=p;return n}
/* ---------- AI: iterative deepening alpha-beta + TT ---------- */
function ev(b){let s=0;for(let i=0;i<64;i++){const p=b[i];if(!p)continue;const r=i>>3,c=i&7,w=p>0;
 const v=Math.abs(p)===2?330:100+(w?7-r:r)*6+(c>1&&c<6?4:0)+((w&&r===7)||(!w&&r===0)?8:0);s+=w?v:-v}return s}
let nodes=0,deadline=0;const TT=new Map();
function ab(b,side,d,al,be,ply){
 if((++nodes&1023)===0&&Date.now()>deadline)throw 0;
 const ms=legal(b,side);if(!ms.length)return-9000+ply;
 if(ply>60||(d<=0&&!ms[0].caps.length))return side*ev(b);
 const key=side+b.join(''),e=TT.get(key);
 if(e&&e.d>=d){if(e.f===0||(e.f===1&&e.v>=be)||(e.f===2&&e.v<=al))return e.v}
 const a0=al;let best=-1e9;
 for(const m of ms){const v=-ab(apply(b,m),-side,d-1,-be,-al,ply+1);if(v>best)best=v;if(v>al)al=v;if(al>=be)break}
 TT.set(key,{d,v:best,f:best<=a0?2:best>=be?1:0});return best}
const LV=[[1,40],[3,150],[5,500],[8,1500],[14,3500]];
function bestMove(b,side,lvl,ms_){
 const[md,tm]=LV[lvl];nodes=0;deadline=Date.now()+(ms_||tm);let ms=legal(b,side);if(TT.size>3e5)TT.clear();
 if(!ms.length)return null;let best=ms[0],bv=side*ev(apply(b,ms[0])),bd=0;if(ms.length===1)return{m:best,v:bv*side,d:0};
 try{for(let d=1;d<=md;d++){let cb=null,cv=-1e9;const sc=[];
  for(const m of ms){let v=-ab(apply(b,m),-side,d-1,-1e9,-cv,1);if(lvl<2)v+=Math.random()*60;sc.push([v,m]);if(v>cv){cv=v;cb=m}}
  best=cb;bv=cv;bd=d;ms=sc.sort((a,c)=>c[0]-a[0]).map(x=>x[1])}}catch(e){}
 return{m:best,v:bv*side,d:bd}}
/* ---------- game state ---------- */
let MM={};
let DT={fmjd:`1-I: ab4 ba5 ba3 ab6 ab2 dc5
1-II: ab4 ba5 ba3 cb6 cb2 de5
1-III: ab4 ba5 ba3 cb6 gh4 fe5
1-IV: ab4 ba5 ba3 fe5 gh4
1-V: ab4 ba5 ed4 ab6 fe3 ba7
1-VI: ab4 ba5 ed4 ab6 fe3 dc5
1-VII: ab4 ba5 ed4 ab6 fe3 fe5
1-VIII: ab4 ba5 ed4 ab6 fe3 hg5`,idf:`IDF 1-III: ab4 ba5 gh4 fe5 hg3
IDF 1-V: ab4 fe5 gh4 gf6
IDF 1-VII: cb4 bc5 dc3 ab6
IDF 2-III: ab4 ba5 gh4 fg5
IDF 2-V: ab4 fe5 gh4 gf6 fg3
IDF 2-VII: cb4 bc5 dc3 fe5
IDF 3-I: ab4 ba5 ba3 ab6
IDF 3-VII: cb4 bc5 dc3 fe5 ef4 ef6
IDF 4-I: ab4 ba5 ba3 ab6 ab2 dc5
IDF 4-III: ab4 bc5 ba5 cb4
IDF 4-V: ab4 fg5 ba5 gf6 ed4
IDF 4-VII: cb4 bc5 dc3 fe5 gh4 ab6
IDF 5-I: ab4 ba5 ba3 cb6 ab2 bc5
IDF 5-III: ab4 bc5 ba5 cb4 ed4 fe5
IDF 5-V: ab4 fg5 ba3 ef6 ed4
IDF 5-VII: cb4 bc5 dc3 fe5 gh4 gf6
IDF 6-I: ab4 ba5 ba3 ab6 gf4 de5
IDF 6-III: ab4 bc5 ba5 cb4 ed4 fg5
IDF 6-V: ab4 fg5 bc5 db4
IDF 6-VII: cb4 bc5 ed4 ce3 fd4 cb6
IDF 7-I: ab4 ba5 ba3 cb6 cb2 de5
IDF 7-III: ab4 bc5 ba5 cb4 ed4 hg5
IDF 7-VII: cb4 bc5 ed4 ce3 fd4 de5
IDF 8-I: ab4 ba5 ba3 cb6 ef4 bc7
IDF 8-III: ab4 bc5 ba5 cb4 gf4 fe5
IDF 8-V: ab4 hg5 ba3 gf4
IDF 8-VII: cb4 bc5 gf4 ab6 hg3 fg5
IDF 9-I: ab4 ba5 ba3 cb6 ef4 fg5
IDF 9-III: ab4 bc5 ba5 cb4 gh4
IDF 9-V: ab4 hg5 gf4 bc5
IDF 10-I: ab4 ba5 ba3 cb6 gf4
IDF 10-III: ab4 bc5 ba5 fg5 ef4
IDF 10-V: ab4 hg5 gf4 gh6
IDF 10-VII: cb4 dc5 bd6 ec5 gf4 ba5
IDF 11-I: ab4 ba5 ba3 cb6 gh4 fe5
IDF 11-III: ab4 bc5 ba5 fg5
IDF 11-V: ab4 hg5 gh4 ba5
IDF 11-VII: cb4 dc5 bd6 ce5 gh4 ba5
IDF 12-I: ab4 ba5 ba3 de5
IDF 12-V: ab4 hg5 gh4 gf4
IDF 13-I: ab4 ba5 ba3 fe5 gh4
IDF 13-III: ab4 dc5 bd6 ec5 gh4
IDF 13-VII: cb4 de5 ba5 bc5
IDF 14-I: ab4 ba5 ed4 ab6 de3 dc5
IDF 14-III: ab4 dc5 bd6 ce5 ef4
IDF 14-V: cb4 ba5 bc5 db4 ac5 cb6
IDF 14-VII: cb4 de5 ba5 fg5
IDF 15-I: ab4 ba5 ed4 ab6 fe3 ba7
IDF 15-V: cb4 ba5 bc5 db4 ac5 fe5
IDF 15-VII: cb4 de5 dc3 fg5
IDF 16-I: ab4 ba5 ed4 ab6 fe3 dc5
IDF 16-III: ab4 de5 ba5 fg5 ef4
IDF 16-V: cb4 ba5 dc3 fe5 gh4 cb6
IDF 16-VII: cb4 de5 ef4 ba5
IDF 17-I: ab4 ba5 ed4 ab6 fe3 fe5
IDF 17-III: ab4 de5 ba5 fg5 gh4
IDF 17-V: cb4 ba5 dc3 hg5
IDF 18-I: ab4 ba5 ed4 ab6 fe3 hg5
IDF 18-III: ab4 de5 ba3 fg5
IDF 18-VII: cb4 de5 gf4 eg3 hf4 fe5
IDF 19-I: ab4 ba5 ed4 cb6
IDF 19-III: ab4 de5 ba3 fg5 gf4
IDF 19-VII: cb4 de5 gh4 cd6
IDF 20-I: ab4 ba5 ed4 dc5
IDF 20-III: ab4 de5 ed4 hg5 ba5
IDF 20-V: cb4 ba5 ef4 ac3 bd4
IDF 20-VII: cb4 fe5 ba5 bc5
IDF 21-I: ab4 ba5 ed4 dc5 bd6 ce5
IDF 21-VII: cb4 fe5 bc3 gf6 ab2
IDF 22-I: ab4 ba5 ed4 fe5 df6 ge5
IDF 22-V: cb4 ba5 gh4 ac3 bd4 de5
IDF 22-VII: cb4 fe5 bc3 gf6 cb2 fg5
IDF 23-I: ab4 ba5 ed4 fe5 df6 eg5
IDF 23-III: ab4 fe5 ba5 ef4
IDF 23-VII: cb4 fe5 bc3 gf6 ed4
IDF 24-I: ab4 ba5 ed4 de5 gh4 ef4
IDF 24-III: ab4 fe5 ba5 gf6
IDF 24-V: cb4 bc5 bc3 fe5 ed4
IDF 24-VII: cb4 fe5 bc3 gf6 gh4 hg7
IDF 25-I: ab4 ba5 ed4 fg5
IDF 25-III: ab4 fe5 bc5 db4
IDF 25-V: cb4 bc5 bc3 fg5 cd4 ab6
IDF 25-VII: cb4 fe5 dc3 gf6
IDF 26-I: ab4 ba5 ed4 hg5
IDF 26-V: cb4 bc5 bc3 fg5 ed4
IDF 26-VII: cb4 fe5 ef4 ba5
IDF 1-IX: cb4 fe5 ef4 ba5 bc5
IDF 1-XI: cd4 ba5 bc3 fe5
IDF 1-XIII: cd4 dc5 dc3 hg5
IDF 1-XV: cd4 fg5 dc3 gf6 gf4 de5
IDF 2-IX: cb4 fe5 ef4 gf6 bc3
IDF 2-XI: cd4 ba5 bc3 hg5 ab2
IDF 2-XIII: cd4 dc5 gf4 cd6 de5
IDF 2-XV: cd4 fg5 dc3 gh4 cb4
IDF 3-IX: cb4 fe5 ef4 gf6 de3 bc5
IDF 3-XI: cd4 ba5 bc3 hg5 cb2 gf4
IDF 3-XIII: cd4 dc5 gh4 fe5
IDF 3-XV: cd4 fg5 gf4 gf6 bc3 hg7
IDF 4-IX: cb4 fe5 gh4 ba5 hg5
IDF 4-XI: cd4 ba5 dc3 de5 gf4
IDF 4-XV: cd4 fg5 gf4 gf6 bc3 gh4
IDF 5-IX: cb4 fe5 gh4 bc5 hg5
IDF 5-XI: cd4 ba5 dc3 de5 gh4
IDF 5-XIII: cd4 de5 bc3 ed6 cb2 fe7
IDF 5-XV: cd4 fg5 gh4 ba5
IDF 6-IX: cb4 fg5 ed4 ba5
IDF 6-XI: cd4 ba5 dc3 fg5 gh4 ab6
IDF 6-XIII: cd4 de5 bc3 ed6 ef4 fe7
IDF 6-XV: cd4 fg5 gh4 dc5
IDF 7-IX: cb4 fg5 ed4 dc5
IDF 7-XI: cd4 ba5 de5 df4
IDF 7-XIII: cd4 de5 bc3 ed6 gf4
IDF 7-XV: cd4 fg5 gh4 dc5 hf6 eg5
IDF 8-IX: cb4 fg5 ed4 ef6
IDF 8-XI: cd4 ba5 ef4 dc5
IDF 8-XIII: cd4 de5 bc3 ef4 eg5 fh4
IDF 8-XV: cd4 fg5 gh4 ef6
IDF 9-IX: cb4 fg5 ed4 gf4
IDF 9-XI: cd4 ba5 ef4 de5
IDF 9-XV: cd4 fg5 gh4 gf4
IDF 10-IX: cb4 fg5 ed4 gh4
IDF 10-XI: cd4 ba5 ef4 cb6 de3 dc5
IDF 10-XIII: cd4 de5 gf4 ec3
IDF 11-XI: cd4 ba5 ef4 cb6 fe3 ab4
IDF 11-XIII: cd4 de5 gf4 eg3
IDF 11-XV: cd4 hg5 bc3 gf4
IDF 12-IX: cb4 hg5 ba5 gh4 ed4
IDF 12-XI: cd4 ba5 ef4 fg5 fe3 ab4
IDF 12-XIII: cd4 de5 gh4 ec3 bd4 fe5
IDF 12-XV: cd4 hg5 bc3 gf4 eg5
IDF 13-IX: cb4 hg5 gf4 gh4 fg5 ba5
IDF 13-XI: cd4 ba5 gf4 de5
IDF 13-XV: cd4 hg5 bc3 gh4
IDF 14-IX: cb4 hg5 gh4 ba5
IDF 14-XI: cd4 ba5 gf4 fe5 df6 eg5
IDF 14-XIII: cd4 fe5 df6 ge5 bc3
IDF 14-XV: cd4 hg5 bc3 gh4 cb4 de5
IDF 15-IX: cb4 hg5 gh4 de5
IDF 15-XI: cd4 ba5 gh4 ab6 dc5
IDF 15-XIII: cd4 fe5 df6 ge5 ed4
IDF 15-XV: cd4 hg5 gf4 gh4 fe5
IDF 16-IX: cb4 hg5 gh4 gh6 bc5
IDF 16-XIII: cd4 fe5 df6 ge5 gh4
IDF 16-XV: cd4 hg5 gf4 gh4 fg5 dc5
IDF 17-IX: cb4 hg5 gh4 gh6 hg3
IDF 17-XI: cd4 bc5 db6 ac5 bc3 de5
IDF 17-XIII: cd4 fe5 df6 eg5 gf4 de7
IDF 17-XV: cd4 hg5 gf4 gh4 fg5 de5
IDF 18-XI: cd4 bc5 db6 ac5 bc3 fe5
IDF 18-XIII: cd4 fg5 bc3 ef6
IDF 18-XV: cd4 hg5 gf4 gh4 fg5 fe5
IDF 19-XI: cd4 bc5 db6 ca5
IDF 19-XIII: cd4 fg5 bc3 ef6 ab2
IDF 20-IX: cd4 ba5 bc3 ab6
IDF 20-XI: cd4 bc5 db6 ca5 ed4
IDF 20-XIII: cd4 fg5 bc3 gf6 ab2 de5
IDF 21-IX: cd4 ba5 bc3 ab6 ab2 dc5
IDF 21-XI: cd4 dc5 bc3 cd6
IDF 21-XIII: cd4 fg5 bc3 gf6 ab2 gh4
IDF 21-XV: ed4 ba5 dc5 db4 ac5 fg5
IDF 22-IX: cd4 ba5 bc3 ab6 ef4
IDF 22-XI: cd4 dc5 bc3 cd6 ab2 de5
IDF 22-XIII: cd4 fg5 bc3 gf4
IDF 22-XV: ed4 ba5 fe3 ab6
IDF 23-IX: cd4 ba5 bc3 ab6 gf4
IDF 23-XI: cd4 dc5 bc3 ed6 gh4
IDF 23-XIII: cd4 fg5 bc3 gh4 cb4 de5
IDF 23-XV: ed4 ba5 fe3 cb6
IDF 24-IX: cd4 ba5 bc3 de5
IDF 24-XI: cd4 dc5 bc3 fg5 cb4 ba5
IDF 24-XIII: cd4 fg5 bc3 gh4 cb4 hg5
IDF 24-XV: ed4 ba5 fe3 de5 gh4 ab6
IDF 25-IX: cd4 ba5 bc3 de5 ef4
IDF 25-XI: cd4 dc5 dc3 ed6 cb4 fg5
IDF 25-XV: ed4 ba5 fe3 de5 gh4 cb6
IDF 26-IX: cd4 ba5 bc3 de5 gf4
IDF 26-XI: cd4 dc5 dc3 fe5
IDF 26-XIII: cd4 fg5 dc3 ef6 ed2 bc5
IDF 26-XV: ed4 ba5 fe3 fe5
IDF 1-XVII: ed4 ba5 fe3 fg5 gf2 gh4
IDF 1-XXIII: gf4 ba5 cb4 ac3 db4 de5
IDF 2-XVII: ed4 ba5 fe3 hg5 gf2
IDF 2-XIX: ed4 fe5 df6 ge5 ab4 hg7
IDF 2-XXI: ef4 bc5 cb4 fg5 de3
IDF 2-XXIII: gf4 ba5 cb4 ac3 db4 fg5
IDF 3-XVII: ed4 ba5 gf4 fg5
IDF 3-XIX: ed4 fe5 df6 ge5 ab4 hg5
IDF 3-XXI: ef4 bc5 de3 ab6 cd4 fg5
IDF 3-XXIII: gf4 ba5 cb4 ac3 bd4 de5
IDF 4-XIX: ed4 fe5 df6 ge5 gh4 hg7
IDF 4-XXI: ef4 bc5 fe3 cb6 cd4 fe5
IDF 4-XXIII: gf4 ba5 cb4 ac3 bd4 fg5
IDF 5-XVII: ed4 bc5 db6 ac5 de3 hg5
IDF 5-XIX: ed4 fe5 df6 eg5 fe3
IDF 5-XXI: ef4 bc5 gh4 ab6 hg3 fe5
IDF 5-XXIII: gf4 ba5 hg3 ab6 gh4 de5
IDF 6-XVII: ed4 bc5 db6 ac5 gf4 fe5
IDF 6-XXI: ef4 dc5 cb4 ed6
IDF 6-XXIII: gf4 ba5 hg3 fg5
IDF 7-XVII: ed4 bc5 db6 ac5 gh4 de5
IDF 7-XIX: ed4 fg5 fe3 bc5
IDF 7-XXI: ef4 dc5 cb4 ed6 gh4 de5
IDF 7-XXIII: gf4 bc5 hg3 ab6 gh4 ba5
IDF 8-XVII: ed4 bc5 db6 ca5
IDF 8-XIX: ed4 fg5 fe3 ef6
IDF 8-XXIII: gf4 bc5 hg3 fe5 cd4
IDF 9-XVII: ed4 bc5 db6 ca5 ab4 ab6
IDF 9-XIX: ed4 fg5 fe3 ef6 gf2 bc5
IDF 10-XVII: ed4 bc5 db6 ca5 ab4 hg5
IDF 10-XIX: ed4 fg5 fe3 gf6
IDF 10-XXI: ef4 dc5 gh4 ed6 hg3 fe5
IDF 10-XXIII: gf4 dc5 cb4 ba5
IDF 11-XVII: ed4 dc5 cb4 ce3 fd4 fg5
IDF 11-XIX: ed4 fg5 gh4 ba5
IDF 11-XXIII: gf4 dc5 cb4 fg5
IDF 12-XVII: ed4 dc5 cb4 ce3 df4 cd6
IDF 12-XIX: ed4 fg5 gh4 dc5
IDF 12-XXI: ef4 de5 fd6 ec5 de3
IDF 12-XXIII: gf4 dc5 cd4 ed6
IDF 13-XVII: ed4 dc5 fe3 cd6
IDF 13-XIX: ed4 fg5 gh4 ef6
IDF 13-XXI: ef4 de5 fd6 ce5 de3 fg5
IDF 13-XXIII: gf4 dc5 hg3 ed6 gh4 fe5
IDF 14-XVII: ed4 dc5 fe3 ed6
IDF 14-XIX: ed4 fg5 gh4 gf6
IDF 14-XXI: ef4 fe5 cd4 ec3 bd4
IDF 15-XVII: ed4 dc5 fe3 fg5 gh4 cd6
IDF 15-XXIII: gf4 de5 fd6 ce5 fg3 bc7
IDF 16-XVII: ed4 dc5 fe3 fg5 gh4 gf6
IDF 16-XIX: ed4 hg5 cb4 de5
IDF 16-XXI: ef4 fe5 de3 ba5 ab4 cb6
IDF 16-XXIII: gf4 de5 fd6 ce5 ab4
IDF 17-XVII: ed4 dc5 fe3 fg5 gh4 gf4
IDF 17-XIX: ed4 hg5 cb4 gf4
IDF 17-XXIII: gf4 de5 fd6 ec5 hg3
IDF 18-XVII: ed4 dc5 fe3 hg5 ef4
IDF 18-XIX: ed4 hg5 cb4 gh4
IDF 18-XXI: ef4 fg5 cb4 ge3 fd4
IDF 19-XVII: ed4 dc5 gh4 ce3 fd4 ba5
IDF 19-XIX: ed4 hg5 fe3 gf4
IDF 19-XXI: ef4 fg5 cb4 ge3 df4 ef6
IDF 19-XXIII: gf4 fe5 ab4 eg3 fh4 gf6
IDF 20-XIX: ed4 hg5 gh4 gh6
IDF 20-XXI: ef4 fg5 fe5 df4 ge5 gh4
IDF 20-XXIII: gf4 fe5 cd4 ec3
IDF 21-XVII: ed4 de5 ab4 cd6
IDF 21-XXI: ef4 fg5 fe3 gh4 ef2 de5
IDF 21-XXIII: gf4 fe5 cd4 eg3
IDF 22-XVII: ed4 de5 ab4 ed6
IDF 22-XIX: ef4 ba5 de3 ab6 cd4 dc5
IDF 22-XXI: ef4 fg5 fe3 gh4 gf2 ba5
IDF 23-XVII: ed4 de5 de3 ed6
IDF 23-XIX: ef4 ba5 de3 cb6 cd2 fe5
IDF 23-XXI: ef4 fg5 fe3 gh4 gf2 de5
IDF 23-XXIII: gf4 fe5 ed4 eg3 hf4 ba5
IDF 25-XVII: ed4 de5 gf4 eg3 fh4 hg5
IDF 25-XIX: ef4 ba5 fe3 ab6 gf2 fg5
IDF 25-XXIII: gf4 fe5 fg3 ef6 ab4
IDF 26-XVII: ed4 de5 gh4 hg5 fe3
IDF 26-XIX: ef4 ba5 fe3 fe5 cd4
IDF 26-XXIII: gf4 fe5 hg3 bc5 cb4 ab6
IDF 1-XXV: gf4 fe5 hg3 ed4 ec5
IDF 1-XXVII: gh4 dc5 fg3 fe5 cd4
IDF 1-XXIX: gh4 hg5 ef4 ge3 df4 bc5
IDF 2-XXV: gf4 fe5 hg3 ef6 cd4
IDF 2-XXVII: gh4 dc5 fg3 fe5 ed4
IDF 2-XXIX: gh4 hg5 hg3 de5
IDF 3-XXV: gf4 fe5 hg3 gf6 cb4
IDF 3-XXVII: gh4 dc5 hg3 fe5
IDF 3-XXIX: gh4 hg5 hg3 gh6
IDF 4-XXV: gf4 fe5 hg3 gf6 ed4
IDF 5-XXV: gf4 fg5 cb4 de5
IDF 5-XXVII: gh4 de5 ab4 cd6
IDF 6-XXV: gf4 fg5 cb4 gf6 bc3 de5
IDF 7-XXVII: gh4 de5 hg3 bc5
IDF 9-XXV: gh4 ba5 fg3 ab6 gf2 fg5
IDF 9-XXVII: gh4 fe5 ab4 ed4
IDF 10-XXV: gh4 ba5 fg3 de5 ed4
IDF 10-XXVII: gh4 fe5 cb4 ef4
IDF 11-XXV: gh4 ba5 fg3 fe5 ed4
IDF 11-XXVII: gh4 fe5 cd4 ec3 bd4 ba5
IDF 12-XXV: gh4 ba5 fg3 fe5 ed4 ef4
IDF 12-XXVII: gh4 fe5 ed4 bc5
IDF 13-XXV: gh4 ba5 fg3 hg5 gf2
IDF 13-XXVII: gh4 fe5 ed4 dc5
IDF 14-XXV: gh4 ba5 hg3 fe5 ed4
IDF 14-XXVII: gh4 fe5 ed4 ef6
IDF 15-XXV: gh4 ba5 hg3 ab6 ef4 dc5
IDF 15-XXVII: gh4 fe5 ed4 gf6
IDF 16-XXV: gh4 ba5 hg3 ab6 gh2 ba7
IDF 16-XXVII: gh4 fe5 ed4 gf6 fg3 dc5
IDF 17-XXVII: gh4 fe5 ef4 eg3 hf4 ba5
IDF 18-XXV: gh4 bc5 cd4 ab6
IDF 19-XXV: gh4 bc5 cd4 fe5
IDF 19-XXVII: gh4 fe5 fg3 gf6
IDF 20-XXV: gh4 bc5 ed4 ce3 df4 cb6
IDF 21-XXV: gh4 bc5 ed4 ce3 fd4 de5
IDF 21-XXVII: gh4 fg5 hf6 ge5 ab4 fg7
IDF 22-XXV: gh4 bc5 fg3 ab6 cd4 fg5
IDF 22-XXVII: gh4 fg5 hf6 ge5 ed4 fg7
IDF 23-XXVII: gh4 fg5 hf6 eg5 ed4
IDF 24-XXV: gh4 dc5 cb4 cd4
IDF 24-XXVII: gh4 hg5 cd4 dc5
IDF 25-XXV: gh4 dc5 cb4 fg5
IDF 25-XXVII: gh4 hg5 cd4 gh6 fg3
IDF 26-XXV: gh4 dc5 ef4 cd6
IDF 26-XXVII: gh4 hg5 ef4 ge3 df4 ba5`};
try{const x=JSON.parse(localStorage.getItem('sp_dt')||'null');if(x){DT.fmjd=x.fmjd||DT.fmjd;DT.idf=x.idf||DT.idf}}catch(e){}
const dtList=k=>(DT[k]||'').split('\n').map(l=>l.match(/^\s*([^:]+?)\s*:\s*(.+)$/)).filter(Boolean).map(m=>({n:m[1],mv:m[2].trim().split(/\s+/)}));
const IDF780_RAW=`I-1|b|bbbbbbbbbbbb....w....wwwwwwwwwww|ab4
I-2|w|bbbbbbbb.bbbb...w....wwwwwwwwwww|ab4 ba5
I-3|w|bbbb.bbbbbbbb...w...wwww.wwwwwww|ab4 ba5 ba3 ab6
I-4|w|bbbb.bbbb.bbbb..w...wwwwwwww.www|ab4 ba5 ba3 ab6 ab2 dc5
I-5|w|bbbbb.bb.bbbbb..w...wwwwwwww.www|ab4 ba5 ba3 cb6 ab2 bc5
I-6|w|bbbb.bbbb.bbb.b.w.w.www..wwwwwww|ab4 ba5 ba3 ab6 gf4 de5
I-7|w|bbbbb.bbb.bbb.b.w...wwwwwwwww.ww|ab4 ba5 ba3 cb6 cb2 de5
I-8|w|.bbbbbbbbbbbb...w.w.ww.w.wwwwwww|ab4 ba5 ba3 cb6 ef4 bc7
I-9|w|bbbbb.bbbb.bb..bw.w.ww.w.wwwwwww|ab4 ba5 ba3 cb6 ef4 fg5
I-10|b|bbbbb.bbbbbbb...w.w.www..wwwwwww|ab4 ba5 ba3 cb6 gf4
I-11|w|bbbbb.bbbb.bb.b.w..wwww..wwwwwww|ab4 ba5 ba3 cb6 gh4 fe5
I-12|w|bbbbbbbb..bbb.b.w...wwww.wwwwwww|ab4 ba5 ba3 de5
I-13|b|bbbbbbbb.b.bb.b.w..wwww..wwwwwww|ab4 ba5 ba3 fe5 gh4
I-14|w|bbbb.bbbb.bbbb..ww...wwww.wwwwww|ab4 ba5 ed4 ab6 de3 dc5
I-15|w|.bbbbbbbbbbbb...ww...wwwww.wwwww|ab4 ba5 ed4 ab6 fe3 ba7
I-16|w|bbbb.bbbb.bbbb..ww...wwwww.wwwww|ab4 ba5 ed4 ab6 fe3 dc5
I-17|w|bbbb.bbbbb.bb.b.ww...wwwww.wwwww|ab4 ba5 ed4 ab6 fe3 fe5
I-18|w|bbbb.bbbbbb.b..bww...wwwww.wwwww|ab4 ba5 ed4 ab6 fe3 hg5
I-19|w|bbbbb.bbbbbbb...ww...w.wwwwwwwww|ab4 ba5 ed4 cb6
I-20|w|bbbbbbbb..bbbb..ww...w.wwwwwwwww|ab4 ba5 ed4 dc5
I-21|w|bbbbb.bb..bbb.b..w...w.wwwwwwwww|ab4 ba5 ed4 dc5 bd6 ce5
I-22|w|bbbbbbb..b.bb.b.w....w.wwwwwwwww|ab4 ba5 ed4 fe5 df6 ge5
I-23|w|bbbbbb.b.b.bb..bw....w.wwwwwwwww|ab4 ba5 ed4 fe5 df6 eg5
I-24|w|bbbbbbbb..bbb...wwbw.w..wwwwwwww|ab4 ba5 ed4 de5 gh4 ef4
I-25|w|bbbbbbbb.b.bb..bww...w.wwwwwwwww|ab4 ba5 ed4 fg5
I-26|w|bbbbbbbb.bb.b..bww...w.wwwwwwwww|ab4 ba5 ed4 hg5
II-1|w|bbbbbbbbbbbbw.......wwwwwwww.www|a1-a5
II-2|w|bbbb.bbbbbbbw......bwwwwwwww.www|a1-a5 a7-h4
II-3|w|bbbbbbbb.bbbw..b....wwwwwwww.www|a1-a5 b6-g5
II-4|w|bbbbbbbb.bbbw......bwwwwwwww.www|a1-a5 b6-h4
II-5|w|bbbbbbbbb.bbw.b.....wwwwwwww.www|a1-a5 d6-e5
II-6|w|bbbbbbbbbb.bw......bwwwwwwww.www|a1-a5 f6-h4
II-7|w|bbbbbbb.bbbbw...b...wwwwwwww.www|a1-a5 g7-b4
II-8|w|bbbbbbb.bbbbw.b.....wwwwwwww.www|a1-a5 g7-e5
II-9|w|bbbbbbb.bbbbw..b....wwwwwwww.www|a1-a5 g7-g5
II-10|w|bbbbbbb.bbbbw......bwwwwwwww.www|a1-a5 g7-h4
II-11|w|bbb.bbbbbbbbw..b....wwwwwwww.www|a1-a5 h8-g5
II-12|w|bbbbbbbbbbb.w...b...wwwwwwww.www|a1-a5 h6-b4
II-13|w|bbbb.bbbbbbbb...w...wwwwwwww.www|a1-b4 a7-a5
II-14|w|bbbb.bbbbbbb...bw...wwwwwwww.www|a1-b4 a7-g5
II-15|w|bbbbbbbb.bbbb...w...wwwwwwww.www|a1-b4 b6-a5
II-16|w|bbbbbbbbb.bb.b..w...wwwwwwww.www|a1-b4 d6-c5
II-17|w|bbbbbbbbb.bb...bw...wwwwwwww.www|a1-b4 d6-g5
II-18|w|bbb.bbbbbbbb..b.w...wwwwwwww.www|a1-b4 h8-e5
II-19|w|bbbbbbbbbbb....bw...wwwwwwww.www|a1-b4 h6-g5
II-20|w|bbbb.bbbbbbb.b...w..wwwwwwww.www|a1-d4 a7-c5
II-21|w|bbbb.bbbbbbb.....wb.wwwwwwww.www|a1-d4 a7-f4
II-22|w|bbbbbbbb.bbbb....w..wwwwwwww.www|a1-d4 b6-a5
II-23|w|bbbbbbbb.bbb.b...w..wwwwwwww.www|a1-d4 b6-c5
II-24|w|bbbb.bbbbbbbw.......bwwwwwwwwwww|a3-a5 a7-a3
II-25|w|bbbbbbbb.bbbw.......bwwwwwwwwwww|a3-a5 b6-a3
II-26|w|bbbbbbbbb.bbw...b....wwwwwwwwwww|a3-a5 d6-b4
III-1|b|bbbbbbbb.b.bb.b.w..w.wwwwww.wwww|ab4 ba5 gh4 fe5 hg3
III-2|w|bbbbbbbb.b.bb..bw..w.ww.wwwwwwww|ab4 ba5 gh4 fg5
III-3|w|bbbbbbbb.bbb.b..w....wwwwwwwwwww|ab4 bc5
III-4|w|bbbbbbbb.bbbw...b....wwwwwwwwwww|ab4 bc5 ba5 cb4
III-5|w|bbbbbbbb.b.bw.b.bw...w.wwwwwwwww|ab4 bc5 ba5 cb4 ed4 fe5
III-6|w|bbbbbbbb.b.bw..bbw...w.wwwwwwwww|ab4 bc5 ba5 cb4 ed4 fg5
III-7|w|bbbbbbbb.bb.w..bbw...w.wwwwwwwww|ab4 bc5 ba5 cb4 ed4 hg5
III-8|w|bbbbbbbb.b.bw.b.b.w..ww.wwwwwwww|ab4 bc5 ba5 cb4 gf4 fe5
III-9|b|bbbbbbbb.bbbw...b..w.ww.wwwwwwww|ab4 bc5 ba5 cb4 gh4
III-10|b|bbbbbbbb.b.bwb.b..w..w.wwwwwwwww|ab4 bc5 ba5 fg5 ef4
III-11|w|bbbbbbbb.b.bwb.b.....wwwwwwwwwww|ab4 bc5 ba5 fg5
III-12|w|bbbbbbbbb.bb.b..w....wwwwwwwwwww|ab4 dc5
III-13|b|bbbbbb.bb.bb.b.....w.ww.wwwwwwww|ab4 dc5 bd6 ec5 gh4
III-14|b|bbbbb.bbb.bb..b...w..w.wwwwwwwww|ab4 dc5 bd6 ce5 ef4
III-15|w|bbbbbbbbb.bb..b.w....wwwwwwwwwww|ab4 de5
III-16|b|bbbbbbbbb..bw.bb..w..w.wwwwwwwww|ab4 de5 ba5 fg5 ef4
III-17|b|bbbbbbbbb..bw.bb...w.ww.wwwwwwww|ab4 de5 ba5 fg5 gh4
III-18|w|bbbbbbbbb..b..bbw...wwww.wwwwwww|ab4 de5 ba3 fg5
III-19|b|bbbbbbbbb..b..bbw.w.www..wwwwwww|ab4 de5 ba3 fg5 gf4
III-20|b|bbbbbbbbb.b.w.bb.w...w.wwwwwwwww|ab4 de5 ed4 hg5 ba5
III-21|b|bbbbbbbbb.bb..b.w..w.ww.wwwwwwww|ab4 de5 gh4
III-22|w|bbbbbbbbbb.b..b.w....wwwwwwwwwww|ab4 fe5
III-23|w|bbbbbbbbbb.bw.....b..wwwwwwwwwww|ab4 fe5 ba5 ef4
III-24|w|bbbbbbb.bbbbw.b......wwwwwwwwwww|ab4 fe5 ba5 gf6
III-25|w|bbbbbbbbb..b..b.b....wwwwwwwwwww|ab4 fe5 bc5 db4
III-26|b|bbbbbbbbbb.b..b.w.w..w.wwwwwwwww|ab4 fe5 ef4
IV-1|w|bbbbbbbbbb.bw.......bwwwwwwwwwww|a3-a5 f6-a3
IV-2|w|bbbbbbbbbbb.w.......bwwwwwwwwwww|a3-a5 h6-a3
IV-3|w|bbbbbbbbbbb.w...b....wwwwwwwwwww|a3-a5 h6-b4
IV-4|w|bbbbbbbbbbb.w.b......wwwwwwwwwww|a3-a5 h6-e5
IV-5|w|bbbbbbbb.bbb....w...bwwwwwwwwwww|a3-b4 b6-a3
IV-6|w|bbbbbbbbb.bb....w...bwwwwwwwwwww|a3-b4 d6-a3
IV-7|w|bbbbbb.bbbbbb...w....wwwwwwwwwww|a3-b4 e7-a5
IV-8|w|bbbbbbbbbbb.....w...bwwwwwwwwwww|a3-b4 h6-a3
IV-9|w|bbbbbbbbbbb...b.w....wwwwwwwwwww|a3-b4 h6-e5
IV-10|w|bbb.bbbbbbbb....w...bwwwwwwwwwww|a3-b4 h8-a3
IV-11|w|bbbbbbbb.bbb.w......bwwwwwwwwwww|a3-c5 b6-a3
IV-12|w|bbbbbbbbb.bb.w......bwwwwwwwwwww|a3-c5 d6-a3
IV-13|w|bbbbbbbbbb.b.w......bwwwwwwwwwww|a3-c5 f6-a3
IV-14|w|bbbbbbb.bbbb.w......bwwwwwwwwwww|a3-c5 g7-a3
IV-15|w|bbb.bbbbbbbb.w......bwwwwwwwwwww|a3-c5 h8-a3
IV-16|w|bbbbbbbb.bbb.....w..bwwwwwwwwwww|a3-d4 b6-a3
IV-17|w|bbbbb.bbbbbbb....w...wwwwwwwwwww|a3-d4 c7-a5
IV-18|w|bbbbbb.bbbbb.b...w...wwwwwwwwwww|a3-d4 e7-c5
IV-19|w|bbbbbbbbbb.b.....w..bwwwwwwwwwww|a3-d4 f6-a3
IV-20|w|bbbbbbb.bbbb.....w..bwwwwwwwwwww|a3-d4 g7-a3
IV-21|w|bbbbbbb.bbbbb....w...wwwwwwwwwww|a3-d4 g7-a5
IV-22|w|bbb.bbbbbbbb.....w..bwwwwwwwwwww|a3-d4 h8-a3
IV-23|w|bbb.bbbbbbbb.....w.b.wwwwwwwwwww|a3-d4 h8-h4
IV-24|w|bbbbbbbbbbb....b.w...wwwwwwwwwww|a3-d4 h6-g5
IV-25|w|bbbb.bbbbbbb.bw......wwwwwwwwwww|a3-e5 a7-c5
IV-26|w|bbbbbbbb.bbb..w.....bwwwwwwwwwww|a3-e5 b6-a3
V-1|w|bbbbbbb.bbbb..b.w..w.ww.wwwwwwww|ab4 fe5 gh4 gf6
V-2|b|bbbbbbb.bbbb..b.w..w.wwwww.wwwww|ab4 fe5 gh4 gf6 fg3
V-3|w|bbbbbbbbbb.b...bw....wwwwwwwwwww|ab4 fg5
V-4|b|bbbbbbb.bbbbw..b.w...w.wwwwwwwww|ab4 fg5 ba5 gf6 ed4
V-5|b|bbbbbb.bbbbb...bww..ww.w.wwwwwww|ab4 fg5 ba3 ef6 ed4
V-6|w|bbbbbbbbb..b...bb....wwwwwwwwwww|ab4 fg5 bc5 db4
V-7|w|bbbbbbbbbbb....bw....wwwwwwwwwww|ab4 hg5
V-8|w|bbbbbbbbbbb.....w.b.wwww.wwwwwww|ab4 hg5 ba3 gf4
V-9|w|bbbbbbbb.bb..b.bw.w..ww.wwwwwwww|ab4 hg5 gf4 bc5
V-10|w|bbbbbbb.bbbb...bw.w..ww.wwwwwwww|ab4 hg5 gf4 gh6
V-11|w|bbbbbbbb.bb.b..bw..w.ww.wwwwwwww|ab4 hg5 gh4 ba5
V-12|w|bbbbbbbbbbb.....w.bw.ww.wwwwwwww|ab4 hg5 gh4 gf4
V-13|b|bbbbbbbbbbbb....w...w.wwwwwwwwww|cb4
V-14|w|bbbbb.bbb.bbbw........wwwwwwwwww|cb4 ba5 bc5 db4 ac5 cb6
V-15|w|bbbbbbbb...bbwb.......wwwwwwwwww|cb4 ba5 bc5 db4 ac5 fe5
V-16|w|bbbbb.bbbb.bb.b.w..wwww.w.wwwwww|cb4 ba5 dc3 fe5 gh4 cb6
V-17|w|bbbbbbbb.bb.b..bw...wwwww.wwwwww|cb4 ba5 dc3 hg5
V-18|b|bbbbbbbb.bbbb...w.w.w..wwwwwwwww|cb4 ba5 ef4
V-19|b|bbbbbbbb.bbbb...w.w.w.w.wwwwwwww|cb4 ba5 gf4
V-20|b|bbbbbbbb.bbb.....ww.w..w.wwwwwww|cb4 ba5 ef4 ac3 bd4
V-21|b|bbbbbbbb.bbbb...w..ww.w.wwwwwwww|cb4 ba5 gh4
V-22|w|bbbbbbbb..bb..b..w.ww.w..wwwwwww|cb4 ba5 gh4 ac3 bd4 de5
V-23|w|bbbbbbbb.bbb.b..w...w.wwwwwwwwww|cb4 bc5
V-24|b|bbbbbbbb.b.b.bb.ww..ww.w.wwwwwww|cb4 bc5 bc3 fe5 ed4
V-25|w|bbbb.bbbbb.b.b.bww..w.ww.wwwwwww|cb4 bc5 bc3 fg5 cd4 ab6
V-26|b|bbbbbbbb.b.b.b.bww..ww.w.wwwwwww|cb4 bc5 bc3 fg5 ed4
VI-1|w|bbbbbbb.bbbb..w.....bwwwwwwwwwww|a3-e5 g7-a3
VI-2|w|bbbbbbb.bbbb..w....b.wwwwwwwwwww|a3-e5 g7-h4
VI-3|w|bbb.bbbbbbbb..w.....bwwwwwwwwwww|a3-e5 h8-a3
VI-4|w|bbbbbbbbbbbb......w..wwwwwwwwwww|a3-f4 ---
VI-5|w|bbbb.bbbbbbb.b....w..wwwwwwwwwww|a3-f4 a7-c5
VI-6|w|bbbbb.bbbbbb.b....w..wwwwwwwwwww|a3-f4 c7-c5
VI-7|w|bbbbbbbbbb.b..b...w..wwwwwwwwwww|a3-f4 f6-e5
VI-8|w|bbbb.bbbbbbb...w....bwwwwwwwwwww|a3-g5 a7-a3
VI-9|w|bbbbbbbb.bbb...w....bwwwwwwwwwww|a3-g5 b6-a3
VI-10|w|bbbbb.bbbbbb...w....bwwwwwwwwwww|a3-g5 c7-a3
VI-11|w|bbbbbbbbb.bb...w....bwwwwwwwwwww|a3-g5 d6-a3
VI-12|w|bbbbbbbbb.bb.b.w.....wwwwwwwwwww|a3-g5 d6-c5
VI-13|w|bbbbbbbbbb.b...w....bwwwwwwwwwww|a3-g5 f6-a3
VI-14|w|bbbbbbb.bbbb...w....bwwwwwwwwwww|a3-g5 g7-a3
VI-15|w|bbb.bbbbbbbb...w....bwwwwwwwwwww|a3-g5 h8-a3
VI-16|w|bbbb.bbbbbbb.......wbwwwwwwwwwww|a3-h4 a7-a3
VI-17|w|bbbb.bbbbbbbb......w.wwwwwwwwwww|a3-h4 a7-a5
VI-18|w|bbbbbbbb.bbb.b.....w.wwwwwwwwwww|a3-h4 b6-c5
VI-19|w|bbbbb.bbbbbb.......wbwwwwwwwwwww|a3-h4 c7-a3
VI-20|w|bbbbbbbbb.bb.......wbwwwwwwwwwww|a3-h4 d6-a3
VI-21|w|bbbbbbbbb.bb.b.....w.wwwwwwwwwww|a3-h4 d6-c5
VI-22|w|bbbbbbbbb.bb..b....w.wwwwwwwwwww|a3-h4 d6-e5
VI-23|w|bbbbbb.bbbbb.......wbwwwwwwwwwww|a3-h4 e7-a3
VI-24|w|bbbbbb.bbbbbb......w.wwwwwwwwwww|a3-h4 e7-a5
VI-25|w|bbbbbbbbbb.b.......wbwwwwwwwwwww|a3-h4 f6-a3
VI-26|w|bbbbbbbbbb.b.b.....w.wwwwwwwwwww|a3-h4 f6-c5
VII-1|w|bbbb.bbbbbbb.b..w...wwwww.wwwwww|cb4 bc5 dc3 ab6
VII-2|w|bbbbbbbb.b.b.bb.w...wwwww.wwwwww|cb4 bc5 dc3 fe5
VII-3|w|bbbbbb.b.bbb.bb.w.w.ww.ww.wwwwww|cb4 bc5 dc3 fe5 ef4 ef6
VII-4|w|bbbb.bbbbb.b.bb.w..wwww.w.wwwwww|cb4 bc5 dc3 fe5 gh4 ab6
VII-5|w|bbbbbbb..bbb.bb.w..wwww.w.wwwwww|cb4 bc5 dc3 fe5 gh4 gf6
VII-6|w|bbbbb.bbbbbb....ww..w..www.wwwww|cb4 bc5 ed4 ce3 fd4 cb6
VII-7|w|bbbbbbbb..bb..b.ww..w..www.wwwww|cb4 bc5 ed4 ce3 fd4 de5
VII-8|w|bbbb.bbbbb.b.b.bw.w.w.wwwww.wwww|cb4 bc5 gf4 ab6 hg3 fg5
VII-9|w|bbbbbbbbb.bb.b..w...w.wwwwwwwwww|cb4 dc5
VII-10|w|bbbbbb.b..bbbb....w.w.w.wwwwwwww|cb4 dc5 bd6 ec5 gf4 ba5
VII-11|w|bbbbb.bb..bbb.b....ww.w.wwwwwwww|cb4 dc5 bd6 ce5 gh4 ba5
VII-12|w|bbbbbbbbb.bb..b.w...w.wwwwwwwwww|cb4 de5
VII-13|w|bbbbbbbb..bbwbb.....w.wwwwwwwwww|cb4 de5 ba5 bc5
VII-14|w|bbbbbbbbb..bw.bb....w.wwwwwwwwww|cb4 de5 ba5 fg5
VII-15|w|bbbbbbbbb..b..bbw...wwwww.wwwwww|cb4 de5 dc3 fg5
VII-16|w|bbbbbbbb..bbb.b.w.w.w..wwwwwwwww|cb4 de5 ef4 ba5
VII-17|b|bbbbbbbbb.bb..b.w.w.w.w.wwwwwwww|cb4 de5 gf4
VII-18|w|bbbbbbbbb..b..b.w.w.w.w.www.wwww|cb4 de5 gf4 eg3 hf4 fe5
VII-19|w|bbbbb.bbbbbb..b.w..ww.w.wwwwwwww|cb4 de5 gh4 cd6
VII-20|w|bbbbbbbb.b.bwbb.....w.wwwwwwwwww|cb4 fe5 ba5 bc5
VII-21|b|bbbbbbb.bbbb..b.w...wwwwwwww.www|cb4 fe5 bc3 gf6 ab2
VII-22|w|bbbbbbb.bb.b..bbw...wwwwwwwww.ww|cb4 fe5 bc3 gf6 cb2 fg5
VII-23|b|bbbbbbb.bbbb..b.ww..ww.w.wwwwwww|cb4 fe5 bc3 gf6 ed4
VII-24|w|bbb.bbbbbbbb..b.w..wwww..wwwwwww|cb4 fe5 bc3 gf6 gh4 hg7
VII-25|w|bbbbbbb.bbbb..b.w...wwwww.wwwwww|cb4 fe5 dc3 gf6
VII-26|w|bbbbbbbb.b.bb.b.w.w.w..wwwwwwwww|cb4 fe5 ef4 ba5
VIII-1|w|bbbbbbbbbb.b..b....w.wwwwwwwwwww|a3-h4 f6-e5
VIII-2|w|bbbbbbb.bbbb.......wbwwwwwwwwwww|a3-h4 g7-a3
VIII-3|w|bbbbbbb.bbbbb......w.wwwwwwwwwww|a3-h4 g7-a5
VIII-4|w|bbbbbbb.bbbb.b.....w.wwwwwwwwwww|a3-h4 g7-c5
VIII-5|w|bbbbbbb.bbbb..b....w.wwwwwwwwwww|a3-h4 g7-e5
VIII-6|w|bbbbbbbbbbb........wbwwwwwwwwwww|a3-h4 h6-a3
VIII-7|w|bbbbbbbbbbb.b......w.wwwwwwwwwww|a3-h4 h6-a5
VIII-8|w|bbbbbbbbbbbw.b.......wwwwwwwwwww|a3-h6 h6-c5
VIII-9|w|bbbb.bbbbbbbb.......wwwwwwwwwwww|--- a7-a5
VIII-10|w|bbbb.bbbbbbb.b......wwwwwwwwwwww|--- a7-c5
VIII-11|w|bbbb.bbbbbbb...b....wwwwwwwwwwww|--- a7-g5
VIII-12|w|bbbb.bbbbbbb.......bwwwwwwwwwwww|--- a7-h4
VIII-13|w|bbbbbbbbbbbbw.......wwww.wwwwwww|b2-a5 ---
VIII-14|w|bbbb.bbbbbbbw.b.....wwww.wwwwwww|b2-a5 a7-e5
VIII-15|w|bbbb.bbbbbbbw......bwwww.wwwwwww|b2-a5 a7-h4
VIII-16|w|bbbbbbbb.bbbw...b...wwww.wwwwwww|b2-a5 b6-b4
VIII-17|w|bbbbbbbbbb.bw.b.....wwww.wwwwwww|b2-a5 f6-e5
VIII-18|w|bbbbbbbbbbb.w..b....wwww.wwwwwww|b2-a5 h6-g5
VIII-19|w|bbbbbbbbb.bb..b.w...wwww.wwwwwww|b2-b4 d6-e5
VIII-20|w|bbbbbbbbb.bb...bw...wwww.wwwwwww|b2-b4 d6-g5
VIII-21|w|bbb.bbbbbbbbb...w...wwww.wwwwwww|b2-b4 h8-a5
VIII-22|w|bbbbbbbbbbb...b.w...wwww.wwwwwww|b2-b4 h6-e5
VIII-23|w|bbbbbbbbbbbb.w......wwww.wwwwwww|b2-c5 ---
VIII-24|w|bbbbbbb.bbbb.w.b....wwww.wwwwwww|b2-c5 g7-g5
VIII-25|w|bbbbbbbbbbbb.....w..wwww.wwwwwww|b2-d4 ---
VIII-26|w|bbbb.bbbbbbb...b.w..wwww.wwwwwww|b2-d4 a7-g5
IX-1|b|bbbbbbbb.b.bbwb...w.w..wwwwwwwww|cb4 fe5 ef4 ba5 bc5
IX-2|b|bbbbbbb.bbbb..b.w.w.ww.w.wwwwwww|cb4 fe5 ef4 gf6 bc3
IX-3|w|bbbbbbb..bbb.bb.w.w.w.www.wwwwww|cb4 fe5 ef4 gf6 de3 bc5
IX-4|b|bbbbbbbb.b.bb.bww...w.w.wwwwwwww|cb4 fe5 gh4 ba5 hg5
IX-5|b|bbbbbbbb.b.b.bbww...w.w.wwwwwwww|cb4 fe5 gh4 bc5 hg5
IX-6|w|bbbbbbbb.b.bb..bww..w..wwwwwwwww|cb4 fg5 ed4 ba5
IX-7|w|bbbbbbbbb..b.b.bww..w..wwwwwwwww|cb4 fg5 ed4 dc5
IX-8|w|bbbbbb.bbbbb...bww..w..wwwwwwwww|cb4 fg5 ed4 ef6
IX-9|w|bbbbbbbbbb.b....wwb.w..wwwwwwwww|cb4 fg5 ed4 gf4
IX-10|w|bbbbbbbbbb.b....ww.bw..wwwwwwwww|cb4 fg5 ed4 gh4
IX-11|w|bbbbbbbbbbb....bw...w.wwwwwwwwww|cb4 hg5
IX-12|b|bbbbbbbbbbb.w....w.bw..wwwwwwwww|cb4 hg5 ba5 gh4 ed4
IX-13|w|bbbbbbbb.bb.b..ww..bw.w.wwwwwwww|cb4 hg5 gf4 gh4 fg5 ba5
IX-14|w|bbbbbbbb.bb.b..bw..ww.w.wwwwwwww|cb4 hg5 gh4 ba5
IX-15|w|bbbbbbbbb.b...bbw..ww.w.wwwwwwww|cb4 hg5 gh4 de5
IX-16|b|bbbbbbb.bbbb.w.b...ww.w.wwwwwwww|cb4 hg5 gh4 gh6 bc5
IX-17|b|bbbbbbb.bbbb...bw..ww.wwwww.wwww|cb4 hg5 gh4 gh6 hg3
IX-18|b|bbbbbbbbbbbb.....w..w.wwwwwwwwww|cd4
IX-19|b|bbbbbbbb.bbbb....w..wwww.wwwwwww|cd4 ba5 bc3
IX-20|w|bbbb.bbbbbbbb....w..wwww.wwwwwww|cd4 ba5 bc3 ab6
IX-21|w|bbbb.bbbb.bbbb...w..wwwwwwww.www|cd4 ba5 bc3 ab6 ab2 dc5
IX-22|b|bbbb.bbbbbbbb....ww.ww.w.wwwwwww|cd4 ba5 bc3 ab6 ef4
IX-23|b|bbbb.bbbbbbbb....ww.www..wwwwwww|cd4 ba5 bc3 ab6 gf4
IX-24|w|bbbbbbbb..bbb.b..w..wwww.wwwwwww|cd4 ba5 bc3 de5
IX-25|b|bbbbbbbb..bbb.b..ww.ww.w.wwwwwww|cd4 ba5 bc3 de5 ef4
IX-26|b|bbbbbbbb..bbb.b..ww.www..wwwwwww|cd4 ba5 bc3 de5 gf4
X-1|w|bbbbbbbb.bbb.b...w..wwww.wwwwwww|b2-d4 b6-c5
X-2|w|bbbbbbbbbb.b.b...w..wwww.wwwwwww|b2-d4 f6-c5
X-3|w|bbbbbbbbbb.b..b..w..wwww.wwwwwww|b2-d4 f6-e5
X-4|w|bbb.bbbbbbbb.....w.bwwww.wwwwwww|b2-d4 h8-h4
X-5|w|bbbbbbb.bbbbb.w.....wwww.wwwwwww|b2-e5 g7-a5
X-6|w|bbbbbbb.bbbb..w....bwwww.wwwwwww|b2-e5 g7-h4
X-7|w|bbbbbbbbb.bb.b....w.wwww.wwwwwww|b2-f4 d6-c5
X-8|w|bbbb.bbbbbbbb..w....wwww.wwwwwww|b2-g5 a7-a5
X-9|w|bbbbb.bbbbbbb..w....wwww.wwwwwww|b2-g5 c7-a5
X-10|w|bbbbbbbbb.bb..bw....wwww.wwwwwww|b2-g5 d6-e5
X-11|w|bbbbbbb.bbbbb..w....wwww.wwwwwww|b2-g5 g7-a5
X-12|w|bbbbbbbbbbb...bw....wwww.wwwwwww|b2-g5 h6-e5
X-13|w|bbb.bbbbbbbbb..w....wwww.wwwwwww|b2-g5 h8-a5
X-14|w|bbbb.bbbbbbbb......wwwww.wwwwwww|b2-h4 a7-a5
X-15|w|bbbbbbbb.bbbb......wwwww.wwwwwww|b2-h4 b6-a5
X-16|w|bbbbbbb.bbbb..b....wwwww.wwwwwww|b2-h4 g7-e5
X-17|w|bbbbbbbbbbbwb.......wwww.wwwwwww|b2-h6 h6-a5
X-18|w|bbbbbbbbbbbw..b.....wwww.wwwwwww|b2-h6 h6-e5
X-19|w|bbbbbbbbbbbw......b.wwww.wwwwwww|b2-h6 h6-f4
X-20|w|bbbbbbbb.bbb.......bwwwwwwwwwwww|--- b6-h4
X-21|w|bbbb.bbbbbbbwb......wwwwwwwww.ww|c1-a5 a7-c5
X-22|w|bbbb.bbbbbbbw.b.....wwwwwwwww.ww|c1-a5 a7-e5
X-23|w|bb.bbbbbbbbbw......bwwwwwwwww.ww|c1-a5 f8-h4
X-24|w|bbbbbbbb.bbb.wb.....wwwwwwwww.ww|c1-c5 b6-e5
X-25|w|bbbbbbbb.bbb.b...w..wwwwwwwww.ww|c1-d4 b6-c5
X-26|w|bbbbbbbbbbb....b.w..wwwwwwwww.ww|c1-d4 h6-g5
XI-1|w|bbbbbbbb.b.bb.b..w..wwww.wwwwwww|cd4 ba5 bc3 fe5
XI-2|b|bbbbbbbb.bb.b..b.w..wwwwwwww.www|cd4 ba5 bc3 hg5 ab2
XI-3|w|bbbbbbbb.bb.b....wb.wwwwwwwww.ww|cd4 ba5 bc3 hg5 cb2 gf4
XI-4|b|bbbbbbbb..bbb.b..ww.www.w.wwwwww|cd4 ba5 dc3 de5 gf4
XI-5|b|bbbbbbbb..bbb.b..w.wwww.w.wwwwww|cd4 ba5 dc3 de5 gh4
XI-6|w|bbbb.bbbbb.bb..b.w.wwww.w.wwwwww|cd4 ba5 dc3 fg5 gh4 ab6
XI-7|w|bbbbbbbb..bbb.....b.w.wwwwwwwwww|cd4 ba5 de5 df4
XI-8|w|bbbbbbbb..bbbb...ww.w..wwwwwwwww|cd4 ba5 ef4 dc5
XI-9|w|bbbbbbbb..bbb.b..ww.w..wwwwwwwww|cd4 ba5 ef4 de5
XI-10|w|bbbbb.bbb.bbbb...ww.w.www.wwwwww|cd4 ba5 ef4 cb6 de3 dc5
XI-11|w|bbbbb.bbbbbb....bww.w.wwww.wwwww|cd4 ba5 ef4 cb6 fe3 ab4
XI-12|w|bbbbbbbb.b.b...bbww.w.wwww.wwwww|cd4 ba5 ef4 fg5 fe3 ab4
XI-13|w|bbbbbbbb..bbb.b..ww.w.w.wwwwwwww|cd4 ba5 gf4 de5
XI-14|w|bbbbbb.b.b.bb..b..w.w.w.wwwwwwww|cd4 ba5 gf4 fe5 df6 eg5
XI-15|b|bbbb.bbbbbbbbw.....ww.w.wwwwwwww|cd4 ba5 gh4 ab6 dc5
XI-16|w|bbbbbbbb.bbb.b...w..w.wwwwwwwwww|cd4 bc5
XI-17|w|bbbb.bbb..bb.bb.....wwww.wwwwwww|cd4 bc5 db6 ac5 bc3 de5
XI-18|w|bbbb.bbb.b.b.bb.....wwww.wwwwwww|cd4 bc5 db6 ac5 bc3 fe5
XI-19|w|bbbbb.bb.bbbb.......w.wwwwwwwwww|cd4 bc5 db6 ca5
XI-20|b|bbbbb.bb.bbbb....w..w..wwwwwwwww|cd4 bc5 db6 ca5 ed4
XI-21|w|bbbbb.bbbbbb.b...w..wwww.wwwwwww|cd4 dc5 bc3 cd6
XI-22|w|bbbbb.bbb.bb.bb..w..wwwwwwww.www|cd4 dc5 bc3 cd6 ab2 de5
XI-23|b|bbbbbb.bbbbb.b...w.wwww..wwwwwww|cd4 dc5 bc3 ed6 gh4
XI-24|w|bbbbbbbb...bbb.bww..w.ww.wwwwwww|cd4 dc5 bc3 fg5 cb4 ba5
XI-25|w|bbbbbb.bbb.b.b.bww..w.www.wwwwww|cd4 dc5 dc3 ed6 cb4 fg5
XI-26|w|bbbbbbbbb..b.bb..w..wwwww.wwwwww|cd4 dc5 dc3 fe5
XII-1|w|bbbbbbbbb.bb..b...w.wwwwwwwww.ww|c1-f4 d6-e5
XII-2|w|.bbbbbbbbbbb......wbwwwwwwwww.ww|c1-f4 b8-h4
XII-3|w|bbbbbbbbbb.b...b...wwwwwwwwww.ww|c1-h4 f6-g5
XII-4|w|bbbb.bbbbbbbw..b....w.wwwwwwwwww|c3-a5 a7-g5
XII-5|w|bbbbbbbbb.bbw..b....w.wwwwwwwwww|c3-a5 d6-g5
XII-6|w|bbbbbbbbb.bbw......bw.wwwwwwwwww|c3-a5 d6-h4
XII-7|w|bbbbbbbbbb.bw.b.....w.wwwwwwwwww|c3-a5 f6-e5
XII-8|w|bbb.bbbbbbbbw..b....w.wwwwwwwwww|c3-a5 h8-g5
XII-9|w|bbbbbbbbbbb.w.b.....w.wwwwwwwwww|c3-a5 h6-e5
XII-10|w|bbbb.bbbbbbbb...w...w.wwwwwwwwww|c3-b4 a7-a5
XII-11|w|bbbb.bbbbbbb..b.w...w.wwwwwwwwww|c3-b4 a7-e5
XII-12|w|bbbb.bbbbbbb....w..bw.wwwwwwwwww|c3-b4 a7-h4
XII-13|w|bbb.bbbbbbbb...bw...w.wwwwwwwwww|c3-b4 h8-g5
XII-14|w|bbbbbbbbbbb...b.w...w.wwwwwwwwww|c3-b4 h6-e5
XII-15|w|bbbbbbbbbb.b.w.b....w.wwwwwwwwww|c3-c5 f6-g5
XII-16|w|bbbbbbb.bbbb.wb.....w.wwwwwwwwww|c3-c5 g7-e5
XII-17|w|bbbbbbb.bbbb.w.....bw.wwwwwwwwww|c3-c5 g7-h4
XII-18|w|bbbb.bbbbbbb..b..w..w.wwwwwwwwww|c3-d4 a7-e5
XII-19|w|bbbbbbbbb.bbb....w..w.wwwwwwwwww|c3-d4 d6-a5
XII-20|w|bbbbbb.bbbbb..b..w..w.wwwwwwwwww|c3-d4 e7-e5
XII-21|w|bbbbbbbbbb.b.b...w..w.wwwwwwwwww|c3-d4 f6-c5
XII-22|w|bbb.bbbbbbbb...b.w..w.wwwwwwwwww|c3-d4 h8-g5
XII-23|w|bbbbbbbbbbb...b..w..w.wwwwwwwwww|c3-d4 h6-e5
XII-24|w|bbbbbbbb.bbbb.w.....w.wwwwwwwwww|c3-e5 b6-a5
XII-25|w|bbbbbbb.bbbbb.w.....w.wwwwwwwwww|c3-e5 g7-a5
XII-26|w|bbbbbbb.bbbb..wb....w.wwwwwwwwww|c3-e5 g7-g5
XIII-1|w|bbbbbbbbb.b..b.b.w..wwwww.wwwwww|cd4 dc5 dc3 hg5
XIII-2|b|bbbbb.bbbbbb.bw...w.w.w.wwwwwwww|cd4 dc5 gf4 cd6 de5
XIII-3|w|bbbbbbbbb..b.bb..w.ww.w.wwwwwwww|cd4 dc5 gh4 fe5
XIII-4|w|bbbbbbbbb.bb..b..w..w.wwwwwwwwww|cd4 de5
XIII-5|w|bb.bbbbbbbbb..b..w..wwwwwwwww.ww|cd4 de5 bc3 ed6 cb2 fe7
XIII-6|w|bb.bbbbbbbbb..b..ww.ww.w.wwwwwww|cd4 de5 bc3 ed6 ef4 fe7
XIII-7|b|bbbbbb.bbbbb..b..ww.www..wwwwwww|cd4 de5 bc3 ed6 gf4
XIII-8|w|bbbbbbbbb..b.....w.bww.w.wwwwwww|cd4 de5 bc3 ef4 eg5 fh4
XIII-9|b|bbbbbbbbb.bb..b..w..wwwww.wwwwww|cd4 de5 dc3
XIII-10|w|bbbbbbbbb.bb......w.wbw.wwwwwwww|cd4 de5 gf4 ec3
XIII-11|w|bbbbbbbbb.bb.....w..w.wbwwwwwwww|cd4 de5 gf4 eg3
XIII-12|w|bbbbbbbbb..b..b..w.ww.w..wwwwwww|cd4 de5 gh4 ec3 bd4 fe5
XIII-13|w|bbbbbbbbbb.b..b..w..w.wwwwwwwwww|cd4 fe5
XIII-14|b|bbbbbbb.bb.b..b.....wwww.wwwwwww|cd4 fe5 df6 ge5 bc3
XIII-15|b|bbbbbbb.bb.b..b..w..w..wwwwwwwww|cd4 fe5 df6 ge5 ed4
XIII-16|b|bbbbbbb.bb.b..b....ww.w.wwwwwwww|cd4 fe5 df6 ge5 gh4
XIII-17|w|b.bbbbbbbb.b...b..w.w.w.wwwwwwww|cd4 fe5 df6 eg5 gf4 de7
XIII-18|w|bbbbbb.bbbbb...b.w..wwww.wwwwwww|cd4 fg5 bc3 ef6
XIII-19|b|bbbbbb.bbbbb...b.w..wwwwwwww.www|cd4 fg5 bc3 ef6 ab2
XIII-20|w|bbbbbbb.b.bb..bb.w..wwwwwwww.www|cd4 fg5 bc3 gf6 ab2 de5
XIII-21|w|bbbbbbb.bbbb.....w.bwwwwwwww.www|cd4 fg5 bc3 gf6 ab2 gh4
XIII-22|w|bbbbbbbbbb.b.....wb.wwww.wwwwwww|cd4 fg5 bc3 gf4
XIII-23|w|bbbbbbbbb..b..b.ww.bw.ww.wwwwwww|cd4 fg5 bc3 gh4 cb4 de5
XIII-24|w|bbbbbbbbbb.....bww.bw.ww.wwwwwww|cd4 fg5 bc3 gh4 cb4 hg5
XIII-25|b|bbbbbbbbbb.b.w.b....w.wwwwwwwwww|cd4 fg5 dc5
XIII-26|w|bbbbbb.b.bbb.b.b.w..wwwwwwwwww.w|cd4 fg5 dc3 ef6 ed2 bc5
XIV-1|w|bbbbbbb.bbbb..w....bw.wwwwwwwwww|c3-e5 g7-h4
XIV-2|w|bbbbbbbbbbbb......w.w.wwwwwwwwww|c3-f4 ---
XIV-3|w|bbbb.bbbbbbb..b...w.w.wwwwwwwwww|c3-f4 a7-e5
XIV-4|w|bbbbbbbbbb.b....b.w.w.wwwwwwwwww|c3-f4 f6-b4
XIV-5|w|bbbbbbbbbb.b..b...w.w.wwwwwwwwww|c3-f4 f6-e5
XIV-6|w|bbb.bbbbbbbb......wbw.wwwwwwwwww|c3-f4 h8-h4
XIV-7|w|bbbbbbbbbbb..b....w.w.wwwwwwwwww|c3-f4 h6-c5
XIV-8|w|bbbb.bbbbbbbb..w....w.wwwwwwwwww|c3-g5 a7-a5
XIV-9|w|bbbb.bbbbbbb..bw....w.wwwwwwwwww|c3-g5 a7-e5
XIV-10|w|bbbbbbbb.bbb.b.w....w.wwwwwwwwww|c3-g5 b6-c5
XIV-11|w|bbbbb.bbbbbb.b.w....w.wwwwwwwwww|c3-g5 c7-c5
XIV-12|w|bbbbb.bbbbbb..bw....w.wwwwwwwwww|c3-g5 c7-e5
XIV-13|w|bbbbbbb.bbbb.b.w....w.wwwwwwwwww|c3-g5 g7-c5
XIV-14|w|bbbbbbb.bbbb..bw....w.wwwwwwwwww|c3-g5 g7-e5
XIV-15|w|bbb.bbbbbbbbb..w....w.wwwwwwwwww|c3-g5 h8-a5
XIV-16|w|bbbbbbbbbbbb.......ww.wwwwwwwwww|c3-h4 ---
XIV-17|w|bbbb.bbbbbbb...b...ww.wwwwwwwwww|c3-h4 a7-g5
XIV-18|w|bbbbbbbbbb.bb......ww.wwwwwwwwww|c3-h4 f6-a5
XIV-19|w|bbbbbbbbbb.b..b....ww.wwwwwwwwww|c3-h4 f6-e5
XIV-20|w|bbbbbbb.bbbb.b.....ww.wwwwwwwwww|c3-h4 g7-c5
XIV-21|w|bbbbbbbbbbb..b.....ww.wwwwwwwwww|c3-h4 h6-c5
XIV-22|w|bbbbbbbbbbbwb.......w.wwwwwwwwww|c3-h6 h6-a5
XIV-23|w|bbbbb.bbbbbbb.......wwwwwwwwwwww|--- c7-a5
XIV-24|w|bbbbb.bbbbbb...b....wwwwwwwwwwww|--- c7-g5
XIV-25|w|bbbbbbbbbbbbw.......wwwww.wwwwww|d2-a5 ---
XIV-26|w|bbbbbbbb.bbbw......bwwwww.wwwwww|d2-a5 b6-h4
XV-1|w|bbbbbbb.b.bb..bb.ww.www.w.wwwwww|cd4 fg5 dc3 gf6 gf4 de5
XV-2|b|bbbbbbbbbb.b....ww.bw.www.wwwwww|cd4 fg5 dc3 gh4 cb4
XV-3|w|bbb.bbbbbbbb...b.ww.www..wwwwwww|cd4 fg5 gf4 gf6 bc3 hg7
XV-4|w|bbbbbbb.bbbb.....wwbwww..wwwwwww|cd4 fg5 gf4 gf6 bc3 gh4
XV-5|w|bbbbbbbb.b.bb..b.w.ww.w.wwwwwwww|cd4 fg5 gh4 ba5
XV-6|w|bbbbbbbbb..b.b.b.w.ww.w.wwwwwwww|cd4 fg5 gh4 dc5
XV-7|w|bbbbbb.bb..b.b.b.w..w.w.wwwwwwww|cd4 fg5 gh4 dc5 hf6 eg5
XV-8|w|bbbbbb.bbbbb...b.w.ww.w.wwwwwwww|cd4 fg5 gh4 ef6
XV-9|w|bbbbbbbbbb.b.....wbww.w.wwwwwwww|cd4 fg5 gh4 gf4
XV-10|w|bbbbbbbbbbb....b.w..w.wwwwwwwwww|cd4 hg5
XV-11|w|bbbbbbbbbbb......wb.wwww.wwwwwww|cd4 hg5 bc3 gf4
XV-12|b|bbbbbbbbbbb....w.w..ww.w.wwwwwww|cd4 hg5 bc3 gf4 eg5
XV-13|w|bbbbbbbbbbb......w.bwwww.wwwwwww|cd4 hg5 bc3 gh4
XV-14|w|bbbbbbbbb.b...b.ww.bw.ww.wwwwwww|cd4 hg5 bc3 gh4 cb4 de5
XV-15|b|bbbbbbbbbbb...w..w.bw.w.wwwwwwww|cd4 hg5 gf4 gh4 fe5
XV-16|w|bbbbbbbbb.b..b.w.w.bw.w.wwwwwwww|cd4 hg5 gf4 gh4 fg5 dc5
XV-17|w|bbbbbbbbb.b...bw.w.bw.w.wwwwwwww|cd4 hg5 gf4 gh4 fg5 de5
XV-18|w|bbbbbbbbbb....bw.w.bw.w.wwwwwwww|cd4 hg5 gf4 gh4 fg5 fe5
XV-19|b|bbbbbbbbbbbb.....w..ww.wwwwwwwww|ed4
XV-20|w|bbbbbbbb.bbbb....w..ww.wwwwwwwww|ed4 ba5
XV-21|w|bbbbbbbb...bbw.b.....w.wwwwwwwww|ed4 ba5 dc5 db4 ac5 fg5
XV-22|w|bbbb.bbbbbbbb....w..wwwwww.wwwww|ed4 ba5 fe3 ab6
XV-23|w|bbbbb.bbbbbbb....w..wwwwww.wwwww|ed4 ba5 fe3 cb6
XV-24|w|bbbb.bbbb.bbb.b..w.wwww.ww.wwwww|ed4 ba5 fe3 de5 gh4 ab6
XV-25|w|bbbbb.bbb.bbb.b..w.wwww.ww.wwwww|ed4 ba5 fe3 de5 gh4 cb6
XV-26|w|bbbbbbbb.b.bb.b..w..wwwwww.wwwww|ed4 ba5 fe3 fe5
XVI-1|w|bbbbbb.bbbbbw..b....wwwww.wwwwww|d2-a5 e7-g5
XVI-2|w|bbbbbbb.bbbbw.......wwwwwbwwwwww|d2-a5 g7-d2
XVI-3|w|bbbbbbb.bbbbw.b.....wwwww.wwwwww|d2-a5 g7-e5
XVI-4|w|bbbbbbbbbbbb....w...wwwww.wwwwww|d2-b4 ---
XVI-5|w|bbbb.bbbbbbb...bw...wwwww.wwwwww|d2-b4 a7-g5
XVI-6|w|bbbb.bbbbbbb....w..bwwwww.wwwwww|d2-b4 a7-h4
XVI-7|w|bbbbbbbbb.bb..b.w...wwwww.wwwwww|d2-b4 d6-e5
XVI-8|w|bbb.bbbbbbbbb...w...wwwww.wwwwww|d2-b4 h8-a5
XVI-9|w|bbb.bbbbbbbb...bw...wwwww.wwwwww|d2-b4 h8-g5
XVI-10|w|bbb.bbbbbbbb....w..bwwwww.wwwwww|d2-b4 h8-h4
XVI-11|w|bbbbbbbbbbbb.w......wwwww.wwwwww|d2-c5 ---
XVI-12|w|bbbb.bbbbbbb.w......wwwwwbwwwwww|d2-c5 a7-d2
XVI-13|w|bbbbbbbb.bbb.w.b....wwwww.wwwwww|d2-c5 b6-g5
XVI-14|w|bbbbbbbbb.bb.w.....bwwwww.wwwwww|d2-c5 d6-h4
XVI-15|w|bbbbbbbbbbbb.....w..wwwww.wwwwww|d2-d4 ---
XVI-16|w|bbbb.bbbbbbb...b.w..wwwww.wwwwww|d2-d4 a7-g5
XVI-17|w|bbbb.bbbbbbb.....w.bwwwww.wwwwww|d2-d4 a7-h4
XVI-18|w|bbbbbbbb.bbbb....w..wwwww.wwwwww|d2-d4 b6-a5
XVI-19|w|bbbbbbbb.bbb...b.w..wwwww.wwwwww|d2-d4 b6-g5
XVI-20|w|bbbbb.bbbbbb.....w.bwwwww.wwwwww|d2-d4 c7-h4
XVI-21|w|bbbbbbbbb.bb.....w.bwwwww.wwwwww|d2-d4 d6-h4
XVI-22|w|bbbbbbbbbb.b..b..w..wwwww.wwwwww|d2-d4 f6-e5
XVI-23|w|bbbbbbbbbb.b...b.w..wwwww.wwwwww|d2-d4 f6-g5
XVI-24|w|bbb.bbbbbbbb.....w.bwwwww.wwwwww|d2-d4 h8-h4
XVI-25|w|bbbbbbbbbbb....b.w..wwwww.wwwwww|d2-d4 h6-g5
XVI-26|w|bbbbbbb.bbbb..w....bwwwww.wwwwww|d2-e5 g7-h4
XVII-1|w|bbbbbbbb.b.bb....w.bwwwwwwwwwww.|ed4 ba5 fe3 fg5 gf2 gh4
XVII-2|b|bbbbbbbb.bb.b..b.w..wwwwwwwwwww.|ed4 ba5 fe3 hg5 gf2
XVII-3|w|bbbbbbbb.b.bb..b.ww.ww..wwwwwwww|ed4 ba5 gf4 fg5
XVII-4|w|bbbbbbbb.bbb.b...w..ww.wwwwwwwww|ed4 bc5
XVII-5|w|bbbb.bbb.bb..b.b....wwwww.wwwwww|ed4 bc5 db6 ac5 de3 hg5
XVII-6|w|bbbb.bbb.b.b.bb...w.ww..wwwwwwww|ed4 bc5 db6 ac5 gf4 fe5
XVII-7|w|bbbb.bbb..bb.bb....www..wwwwwwww|ed4 bc5 db6 ac5 gh4 de5
XVII-8|w|bbbbb.bb.bbbb.......ww.wwwwwwwww|ed4 bc5 db6 ca5
XVII-9|w|bbbb..bbbbbbb...w....w.wwwwwwwww|ed4 bc5 db6 ca5 ab4 ab6
XVII-10|w|bbbbb.bb.bb.b..bw....w.wwwwwwwww|ed4 bc5 db6 ca5 ab4 hg5
XVII-11|w|bbbbbbbbb..b...bww..w..www.wwwww|ed4 dc5 cb4 ce3 fd4 fg5
XVII-12|w|bbbbb.bbbbbb....w.w.w..ww.wwwwww|ed4 dc5 cb4 ce3 df4 cd6
XVII-13|w|bbbbb.bbbbbb.b...w..wwwwww.wwwww|ed4 dc5 fe3 cd6
XVII-14|w|bbbbbb.bbbbb.b...w..wwwwww.wwwww|ed4 dc5 fe3 ed6
XVII-15|w|bbbbb.bbbb.b.b.b.w.wwww.ww.wwwww|ed4 dc5 fe3 fg5 gh4 cd6
XVII-16|w|bbbbbbb.b.bb.b.b.w.wwww.ww.wwwww|ed4 dc5 fe3 fg5 gh4 gf6
XVII-17|w|bbbbbbbbb..b.b...wbwwww.ww.wwwww|ed4 dc5 fe3 fg5 gh4 gf4
XVII-18|b|bbbbbbbbb.b..b.b.ww.ww.www.wwwww|ed4 dc5 fe3 hg5 ef4
XVII-19|w|bbbbbbbb..bbb....w.www..ww.wwwww|ed4 dc5 gh4 ce3 fd4 ba5
XVII-20|w|bbbbbbbbb.bb..b..w..ww.wwwwwwwww|ed4 de5
XVII-21|w|bbbbb.bbbbbb..b.ww...w.wwwwwwwww|ed4 de5 ab4 cd6
XVII-22|w|bbbbbb.bbbbb..b.ww...w.wwwwwwwww|ed4 de5 ab4 ed6
XVII-23|w|bbbbbb.bbbbb..b..w..wwwww.wwwwww|ed4 de5 de3 ed6
XVII-24|b|bbbbbbbbb.bb..b..w..wwwwww.wwwww|ed4 de5 fe3
XVII-25|w|bbbbbbbbb.b....b.w.www..ww.wwwww|ed4 de5 gf4 eg3 fh4 hg5
XVII-26|b|bbbbbbbbb.b...bb.w.wwww.ww.wwwww|ed4 de5 gh4 hg5 fe3
XVIII-1|w|bbbbbbbbbbbb......w.wwwww.wwwwww|d2-f4 ---
XVIII-2|w|bbbbbbbb.bbb.b....w.wwwww.wwwwww|d2-f4 b6-c5
XVIII-3|w|bbbbbbbbb.bbb.....w.wwwww.wwwwww|d2-f4 d6-a5
XVIII-4|w|bbbbbb.bbbbbb.....w.wwwww.wwwwww|d2-f4 e7-a5
XVIII-5|w|bbbbbbbbbbb....w...bwwwww.wwwwww|d2-g5 h6-h4
XVIII-6|w|bbbbbbbb.bbb.b.....wwwwww.wwwwww|d2-h4 b6-c5
XVIII-7|w|bbbbbb.bbbbb.b.....wwwwww.wwwwww|d2-h4 e7-c5
XVIII-8|w|bbbbbbbbbb.b...b...wwwwww.wwwwww|d2-h4 f6-g5
XVIII-9|w|bbbbbbb.bbbb..b....wwwwww.wwwwww|d2-h4 g7-e5
XVIII-10|w|bbbbbbbbbbb...b....wwwwww.wwwwww|d2-h4 h6-e5
XVIII-11|w|bbbbbbbbb.bbb.......wwwwwwwwwwww|--- d6-a5
XVIII-12|w|bbbbbbbbb.bb...b....wwwwwwwwwwww|--- d6-g5
XVIII-13|w|bbbbbbbbb.bb.......bwwwwwwwwwwww|--- d6-h4
XVIII-14|w|bb.bbbbbbbbbwb......wwwwwwwwww.w|e1-a5 f8-c5
XVIII-15|w|bbbbbbbbb.bb.b..w...wwwwwwwwww.w|e1-b4 d6-c5
XVIII-16|w|bbbbbbbb.bbb.b...w..wwwwwwwwww.w|e1-d4 b6-c5
XVIII-17|w|bbbbb.bbbbbb..b..w..wwwwwwwwww.w|e1-d4 c7-e5
XVIII-18|w|bbbbbb.bbbbb..b..w..wwwwwwwwww.w|e1-d4 e7-e5
XVIII-19|w|bbbbbbbbbbbbw.......ww.wwwwwwwww|e3-a5 ---
XVIII-20|w|bbbb.bbbbbbbw.b.....ww.wwwwwwwww|e3-a5 a7-e5
XVIII-21|w|bbbb.bbbbbbbw..b....ww.wwwwwwwww|e3-a5 a7-g5
XVIII-22|w|bbbbbbbb.bbbwb......ww.wwwwwwwww|e3-a5 b6-c5
XVIII-23|w|bbbbbbbbb.bbw.b.....ww.wwwwwwwww|e3-a5 d6-e5
XVIII-24|w|bbbbbb.bbbbbw..b....ww.wwwwwwwww|e3-a5 e7-g5
XVIII-25|w|bbbbbbbbbb.bw...b...ww.wwwwwwwww|e3-a5 f6-b4
XVIII-26|w|bbbbbbb.bbbbw...b...ww.wwwwwwwww|e3-a5 g7-b4
XIX-1|w|bbbbbbbbbb.b..b..w..ww.wwwwwwwww|ed4 fe5
XIX-2|w|bbb.bbbbbb.b..b.w....w.wwwwwwwww|ed4 fe5 df6 ge5 ab4 hg7
XIX-3|w|bbbbbbb.bb....bbw....w.wwwwwwwww|ed4 fe5 df6 ge5 ab4 hg5
XIX-4|w|bbb.bbbbbb.b..b....www..wwwwwwww|ed4 fe5 df6 ge5 gh4 hg7
XIX-5|b|bbbbbb.bbb.b...b....wwwwww.wwwww|ed4 fe5 df6 eg5 fe3
XIX-6|w|bbbbbbbbbb.b...b.w..ww.wwwwwwwww|ed4 fg5
XIX-7|w|bbbbbbbb.b.b.b.b.w..wwwwww.wwwww|ed4 fg5 fe3 bc5
XIX-8|w|bbbbbb.bbbbb...b.w..wwwwww.wwwww|ed4 fg5 fe3 ef6
XIX-9|w|bbbbbb.b.bbb.b.b.w..wwwwwwwwwww.|ed4 fg5 fe3 ef6 gf2 bc5
XIX-10|w|bbbbbbb.bbbb...b.w..wwwwww.wwwww|ed4 fg5 fe3 gf6
XIX-11|w|bbbbbbbb.b.bb..b.w.www..wwwwwwww|ed4 fg5 gh4 ba5
XIX-12|w|bbbbbbbbb..b.b.b.w.www..wwwwwwww|ed4 fg5 gh4 dc5
XIX-13|w|bbbbbb.bbbbb...b.w.www..wwwwwwww|ed4 fg5 gh4 ef6
XIX-14|w|bbbbbbb.bbbb...b.w.www..wwwwwwww|ed4 fg5 gh4 gf6
XIX-15|w|bbbbbbbbbbb....b.w..ww.wwwwwwwww|ed4 hg5
XIX-16|w|bbbbbbbbb.b...bbww..w..wwwwwwwww|ed4 hg5 cb4 de5
XIX-17|w|bbbbbbbbbbb.....wwb.w..wwwwwwwww|ed4 hg5 cb4 gf4
XIX-18|w|bbbbbbbbbbb.....ww.bw..wwwwwwwww|ed4 hg5 cb4 gh4
XIX-19|w|bbbbbbbbbbb......wb.wwwwww.wwwww|ed4 hg5 fe3 gf4
XIX-20|w|bbbbbbb.bbbb...b.w.www..wwwwwwww|ed4 hg5 gh4 gh6
XIX-21|b|bbbbbbbbbbbb......w.ww.wwwwwwwww|ef4
XIX-22|w|bbbb.bbbb.bbbb...ww.w.www.wwwwww|ef4 ba5 de3 ab6 cd4 dc5
XIX-23|w|bbbbb.bbbb.bb.b...w.wwwwwwwww.ww|ef4 ba5 de3 cb6 cd2 fe5
XIX-24|b|bbbbbbbb.bbbb.....w.wwwwww.wwwww|ef4 ba5 fe3
XIX-25|w|bbbb.bbbbb.bb..b..w.wwwwwwwwwww.|ef4 ba5 fe3 ab6 gf2 fg5
XIX-26|b|bbbbbbbb.b.bb.b..ww.w.wwww.wwwww|ef4 ba5 fe3 fe5 cd4
XX-1|w|bbb.bbbbbbbbw.b.....ww.wwwwwwwww|e3-a5 h8-e5
XX-2|w|bbb.bbbbbbbbw......bww.wwwwwwwww|e3-a5 h8-h4
XX-3|w|bbbbbbbbbbbb....w...ww.wwwwwwwww|e3-b4 ---
XX-4|w|bbbb.bbbbbbb.b..w...ww.wwwwwwwww|e3-b4 a7-c5
XX-5|w|bbbb.bbbbbbb..b.w...ww.wwwwwwwww|e3-b4 a7-e5
XX-6|w|bbbb.bbbbbbb....w..bww.wwwwwwwww|e3-b4 a7-h4
XX-7|w|bbbbbbbb.bbb....w.b.ww.wwwwwwwww|e3-b4 b6-f4
XX-8|w|bbbbbbbb.bbb...bw...ww.wwwwwwwww|e3-b4 b6-g5
XX-9|w|bbbbbbbbbb.b..b.w...ww.wwwwwwwww|e3-b4 f6-e5
XX-10|w|bbb.bbbbbbbb..b.w...ww.wwwwwwwww|e3-b4 h8-e5
XX-11|w|bbb.bbbbbbbb....w..bww.wwwwwwwww|e3-b4 h8-h4
XX-12|w|bbbbbbbbwbbb....b...ww.wwwwwwwww|e3-b6 b6-b4
XX-13|w|bbbbbbbbb.bb.w.b....ww.wwwwwwwww|e3-c5 d6-g5
XX-14|w|bbbbbbb.bbbb.w.....bww.wwwwwwwww|e3-c5 g7-h4
XX-15|w|bbbbbbbbbbbb.....w..ww.wwwwwwwww|e3-d4 ---
XX-16|w|bbbb.bbbbbbb..b..w..ww.wwwwwwwww|e3-d4 a7-e5
XX-17|w|bbbb.bbbbbbb...b.w..ww.wwwwwwwww|e3-d4 a7-g5
XX-18|w|bbbbbbbbb.bbb....w..ww.wwwwwwwww|e3-d4 d6-a5
XX-19|w|bbbbbbbbb.bb.....w.bww.wwwwwwwww|e3-d4 d6-h4
XX-20|w|bb.bbbbbbbbb.b...w..ww.wwwwwwwww|e3-d4 f8-c5
XX-21|w|bbbbbbbbbbbb......w.ww.wwwwwwwww|e3-f4 ---
XX-22|w|bbbb.bbbbbbb..b...w.ww.wwwwwwwww|e3-f4 a7-e5
XX-23|w|.bbbbbbbbbbb...b..w.ww.wwwwwwwww|e3-f4 b8-g5
XX-24|w|bbbbbbbbb.bbb.....w.ww.wwwwwwwww|e3-f4 d6-a5
XX-25|w|bbbbbbbbbb.b.b....w.ww.wwwwwwwww|e3-f4 f6-c5
XX-26|w|bbbbbbb.bbbbb.....w.ww.wwwwwwwww|e3-f4 g7-a5
XXI-1|b|bbbbbbbb.bbbb.....wwww..wwwwwwww|ef4 ba5 gh4
XXI-2|b|bbbbbbbb.b.b.b.bw.w.w.www.wwwwww|ef4 bc5 cb4 fg5 de3
XXI-3|w|bbbb.bbbbb.b.b.b.ww.w.www.wwwwww|ef4 bc5 de3 ab6 cd4 fg5
XXI-4|w|bbbbb.bbbb.b.bb..ww.w.wwww.wwwww|ef4 bc5 fe3 cb6 cd4 fe5
XXI-5|w|bbbb.bbbbb.b.bb...wwww.wwww.wwww|ef4 bc5 gh4 ab6 hg3 fe5
XXI-6|w|bbbbbb.bbbbb.b..w.w.w..wwwwwwwww|ef4 dc5 cb4 ed6
XXI-7|w|bbbbbb.bb.bb.bb.w.www...wwwwwwww|ef4 dc5 cb4 ed6 gh4 de5
XXI-8|b|bbbbbbbbb.bb.b....w.wwwww.wwwwww|ef4 dc5 de3
XXI-9|b|bbbbbbbbb.bb.b....w.wwwwww.wwwww|ef4 dc5 fe3
XXI-10|w|bbbbbb.bbb.b.bb...wwww.wwww.wwww|ef4 dc5 gh4 ed6 hg3 fe5
XXI-11|w|bbbbbbbbb.bb..b...w.ww.wwwwwwwww|ef4 de5
XXI-12|b|bbbbbb.bb.bb.b......wwwww.wwwwww|ef4 de5 fd6 ec5 de3
XXI-13|w|bbbbb.bbb..b..bb....wwwww.wwwwww|ef4 de5 fd6 ce5 de3 fg5
XXI-14|b|bbbbbbbbbb.b.....ww.w..w.wwwwwww|ef4 fe5 cd4 ec3 bd4
XXI-15|b|bbbbbbbbbb.b..b...w.wwwww.wwwwww|ef4 fe5 de3
XXI-16|w|bbbbb.bbbb.bb.b.w.w..wwww.wwwwww|ef4 fe5 de3 ba5 ab4 cb6
XXI-17|w|bbbbbbbbbb.b...b..w.ww.wwwwwwwww|ef4 fg5
XXI-18|b|bbbbbbbbbb.b....ww..w..www.wwwww|ef4 fg5 cb4 ge3 fd4
XXI-19|w|bbbbbb.bbbbb....w.w.w..ww.wwwwww|ef4 fg5 cb4 ge3 df4 ef6
XXI-20|w|bbbbbbbbb..b..w....bww..wwwwwwww|ef4 fg5 fe5 df4 ge5 gh4
XXI-21|w|bbbbbbbbb..b..b...wbwwwwwwwwww.w|ef4 fg5 fe3 gh4 ef2 de5
XXI-22|w|bbbbbbbb.b.bb.....wbwwwwwwwwwww.|ef4 fg5 fe3 gh4 gf2 ba5
XXI-23|w|bbbbbbbbb..b..b...wbwwwwwwwwwww.|ef4 fg5 fe3 gh4 gf2 de5
XXI-24|b|bbbbbbbbbbbb......w.www.wwwwwwww|gf4
XXI-25|w|bbbbbbbb.bbbb.....w.www.wwwwwwww|gf4 ba5
XXI-26|w|bbbbbbbb.b.b...b.ww.w.w..wwwwwww|gf4 ba5 cb4 ac3 bd4 fg5
XXII-1|w|bbb.bbbbbbbb...b..w.ww.wwwwwwwww|e3-f4 h8-g5
XXII-2|w|bbbbbbbbbbwb....b...ww.wwwwwwwww|e3-f6 f6-b4
XXII-3|w|bbbbbbbbbbb...bw....ww.wwwwwwwww|e3-g5 h6-e5
XXII-4|w|bbbbbbbbbb.bb......www.wwwwwwwww|e3-h4 f6-a5
XXII-5|w|bbbbbbb.bbbb...b...www.wwwwwwwww|e3-h4 g7-g5
XXII-6|w|bbbbbbbbbbb.b......www.wwwwwwwww|e3-h4 h6-a5
XXII-7|w|bbbbbbbbbbb....b...www.wwwwwwwww|e3-h4 h6-g5
XXII-8|w|bbbbbbbbbbbwb.......ww.wwwwwwwww|e3-h6 h6-a5
XXII-9|w|bbbbbbbbbbbw..b.....ww.wwwwwwwww|e3-h6 h6-e5
XXII-10|w|bbbbbb.bbbbb.......bwwwwwwwwwwww|--- e7-h4
XXII-11|w|b.bbbbbbbbbbw.....b.wwwwww.wwwww|f2-a5 d8-f4
XXII-12|w|bbbbbbbbb.bbw.b.....wwwwww.wwwww|f2-a5 d6-e5
XXII-13|w|bbbbbb.bbbbbw.b.....wwwwww.wwwww|f2-a5 e7-e5
XXII-14|w|bbbbbbbbbb.bw.b.....wwwwww.wwwww|f2-a5 f6-e5
XXII-15|w|bbbbbbb.bbbbw.b.....wwwwww.wwwww|f2-a5 g7-e5
XXII-16|w|bbbbbbbbb.bbb...w...wwwwww.wwwww|f2-b4 d6-a5
XXII-17|w|b.bbbbbbbbbb....w..bwwwwww.wwwww|f2-b4 d8-h4
XXII-18|w|bbbbbb.bbbbb..b.w...wwwwww.wwwww|f2-b4 e7-e5
XXII-19|w|bbbbbbb.bbbb..b.w...wwwwww.wwwww|f2-b4 g7-e5
XXII-20|w|bbb.bbbbbbbb.b..w...wwwwww.wwwww|f2-b4 h8-c5
XXII-21|w|bbb.bbbbbbbb...bw...wwwwww.wwwww|f2-b4 h8-g5
XXII-22|w|bbbb.bbbbbbb.w......wwwwwwbwwwww|f2-c5 a7-f2
XXII-23|w|bbb.bbbbbbbb.wb.....wwwwww.wwwww|f2-c5 h8-e5
XXII-24|w|bbbbbbbb.bbb.b...w..wwwwww.wwwww|f2-d4 b6-c5
XXII-25|w|bbbbb.bbbbbb...b.w..wwwwww.wwwww|f2-d4 c7-g5
XXII-26|w|bbbbbbbbb.bbb....w..wwwwww.wwwww|f2-d4 d6-a5
XXIII-1|w|bbbbbbbb..bb..b.w.w.w.w.w.wwwwww|gf4 ba5 cb4 ac3 db4 de5
XXIII-2|w|bbbbbbbb.b.b...bw.w.w.w.w.wwwwww|gf4 ba5 cb4 ac3 db4 fg5
XXIII-3|w|bbbbbbbb..bb..b..ww.w.w..wwwwwww|gf4 ba5 cb4 ac3 bd4 de5
XXIII-4|w|bbbbbbbb.b.b...b.ww.w.w..wwwwwww|gf4 ba5 cb4 ac3 bd4 fg5
XXIII-5|w|bbbb.bbbb.bbb.b...wwwww.www.wwww|gf4 ba5 hg3 ab6 gh4 de5
XXIII-6|w|bbbbbbbb.b.bb..b..w.wwwwwww.wwww|gf4 ba5 hg3 fg5
XXIII-7|w|bbbb.bbb.bbbbb....wwwww.www.wwww|gf4 bc5 hg3 ab6 gh4 ba5
XXIII-8|b|bbbbbbbb.b.b.bb..ww.w.wwwww.wwww|gf4 bc5 hg3 fe5 cd4
XXIII-9|w|bbbbbbbbb.bb.b....w.www.wwwwwwww|gf4 dc5
XXIII-10|w|bbbbbbbb..bbbb..w.w.w.w.wwwwwwww|gf4 dc5 cb4 ba5
XXIII-11|w|bbbbbbbbb..b.b.bw.w.w.w.wwwwwwww|gf4 dc5 cb4 fg5
XXIII-12|w|bbbbbb.bbbbb.b...ww.w.w.wwwwwwww|gf4 dc5 cd4 ed6
XXIII-13|w|bbbbbb.bbb.b.bb...wwwww.www.wwww|gf4 dc5 hg3 ed6 gh4 fe5
XXIII-14|w|bbbbbbbbb.bb..b...w.www.wwwwwwww|gf4 de5
XXIII-15|w|.bbbbbbbb.bb..b.....wwwwww.wwwww|gf4 de5 fd6 ce5 fg3 bc7
XXIII-16|b|bbbbb.bbb.bb..b.w....ww.wwwwwwww|gf4 de5 fd6 ce5 ab4
XXIII-17|b|bbbbbb.bb.bb.b......wwwwwww.wwww|gf4 de5 fd6 ec5 hg3
XXIII-18|w|bbbbbbbbbb.b..b...w.www.wwwwwwww|gf4 fe5
XXIII-19|w|bbbbbbb.bbbb....w..w.ww.ww.wwwww|gf4 fe5 ab4 eg3 fh4 gf6
XXIII-20|w|bbbbbbbbbb.b......w.wbw.wwwwwwww|gf4 fe5 cd4 ec3
XXIII-21|w|bbbbbbbbbb.b.....w..w.wbwwwwwwww|gf4 fe5 cd4 eg3
XXIII-22|b|bbbbbbbbbb.b..b..ww.ww..wwwwwwww|gf4 fe5 ed4
XXIII-23|w|bbbbbbbb.b.bb....ww.ww..www.wwww|gf4 fe5 ed4 eg3 hf4 ba5
XXIII-24|b|bbbbbbbbbb.b..b...w.wwwwww.wwwww|gf4 fe5 fg3
XXIII-25|b|bbbbbb.bbbbb..b.w.w..wwwww.wwwww|gf4 fe5 fg3 ef6 ab4
XXIII-26|w|bbbb.bbbbb.b.bb.w.w.w.wwwww.wwww|gf4 fe5 hg3 bc5 cb4 ab6
XXIV-1|w|bbbbbbbbbbb....b.w..wwwwww.wwwww|f2-d4 h6-g5
XXIV-2|w|bbbbbbbbb.bb..b...w.wwwwww.wwwww|f2-f4 d6-e5
XXIV-3|w|bbbbbbbbbb.b..b...w.wwwwww.wwwww|f2-f4 f6-e5
XXIV-4|w|bbbbbbbbbbb.b.....w.wwwwww.wwwww|f2-f4 h6-a5
XXIV-5|w|bbb.bbbbbbbb..b...w.wwwwww.wwwww|f2-f4 h8-e5
XXIV-6|w|bbbbbbb.bbbbb..w....wwwwww.wwwww|f2-g5 g7-a5
XXIV-7|w|bbbbbbbbbbb.b..w....wwwwww.wwwww|f2-g5 h6-a5
XXIV-8|w|bbbbbbbbbbb..b.w....wwwwww.wwwww|f2-g5 h6-c5
XXIV-9|w|bbbbbbbbbbbb.......wwwwwww.wwwww|f2-h4 ---
XXIV-10|w|bbbbbbbbbb.b.b.....wwwwwww.wwwww|f2-h4 f6-c5
XXIV-11|w|bbbbbbbbbb.bb.......wwwwwwwwwwww|--- f6-a5
XXIV-12|w|bbbbbbbbbb.b.......bwwwwwwwwwwww|--- f6-h4
XXIV-13|w|bbbbbbbbbb.bw...b...wwwwwwwwwww.|g1-a5 f6-b4
XXIV-14|w|bbbbbbb.bbbbwb......wwwwwwwwwww.|g1-a5 g7-c5
XXIV-15|w|bbbbbbbbb.bb..b.w...wwwwwwwwwww.|g1-b4 d6-e5
XXIV-16|w|bbbbbb.bbbbb.b..w...wwwwwwwwwww.|g1-b4 e7-c5
XXIV-17|w|bbb.bbbbbbbb.b..w...wwwwwwwwwww.|g1-b4 h8-c5
XXIV-18|w|bbbbbbbbb.bb...b.w..wwwwwwwwwww.|g1-d4 d6-g5
XXIV-19|w|bbbbbbbbbbb.b....w..wwwwwwwwwww.|g1-d4 h6-a5
XXIV-20|w|bbbbbbb.bbbbb.w.....wwwwwwwwwww.|g1-e5 g7-a5
XXIV-21|w|bbbbbbbbb.bb.b....w.wwwwwwwwwww.|g1-f4 d6-c5
XXIV-22|w|bbbbbbbbb.bb..b...w.wwwwwwwwwww.|g1-f4 d6-e5
XXIV-23|w|bbb.bbbbbbbbb.....w.wwwwwwwwwww.|g1-f4 h8-a5
XXIV-24|w|bbbbbbb.bbbbb..w....wwwwwwwwwww.|g1-g5 g7-a5
XXIV-25|w|bbbbbbb.bbbb..bw....wwwwwwwwwww.|g1-g5 g7-e5
XXIV-26|w|bbb.bbbbbbbbb..w....wwwwwwwwwww.|g1-g5 h8-a5
XXV-1|b|bbbbbbbbbb.b.w....w.ww.wwww.wwww|gf4 fe5 hg3 ed4 ec5
XXV-2|b|bbbbbb.bbbbb..b..ww.w.wwwww.wwww|gf4 fe5 hg3 ef6 cd4
XXV-3|b|bbbbbbb.bbbb..b.w.w.w.wwwww.wwww|gf4 fe5 hg3 gf6 cb4
XXV-4|b|bbbbbbb.bbbb..b..ww.ww.wwww.wwww|gf4 fe5 hg3 gf6 ed4
XXV-5|w|bbbbbbbbb..b..bbw.w.w.w.wwwwwwww|gf4 fg5 cb4 de5
XXV-6|w|bbbbbbb.b.bb..bbw.w.www..wwwwwww|gf4 fg5 cb4 gf6 bc3 de5
XXV-7|b|bbbbbbbbbbbb.......wwww.wwwwwwww|gh4
XXV-8|w|bbbbbbbb.bbbb......wwww.wwwwwwww|gh4 ba5
XXV-9|w|bbbb.bbbbb.bb..b...wwwwwwwwwwww.|gh4 ba5 fg3 ab6 gf2 fg5
XXV-10|b|bbbbbbbb..bbb.b..w.www.www.wwwww|gh4 ba5 fg3 de5 ed4
XXV-11|b|bbbbbbbb.b.bb.b..w.www.www.wwwww|gh4 ba5 fg3 fe5 ed4
XXV-12|w|bbbbbbbb.b.bb....wbwww.www.wwwww|gh4 ba5 fg3 fe5 ed4 ef4
XXV-13|b|bbbbbbbb.bb.b..b...wwwwwwwwwwww.|gh4 ba5 fg3 hg5 gf2
XXV-14|b|bbbbbbbb.b.bb.b..w.www.wwww.wwww|gh4 ba5 hg3 fe5 ed4
XXV-15|w|bbbb.bbbb.bbbb....wwww.wwww.wwww|gh4 ba5 hg3 ab6 ef4 dc5
XXV-16|w|.bbbbbbbbbbbb......wwwwwwwwwwww.|gh4 ba5 hg3 ab6 gh2 ba7
XXV-17|w|bbbbbbbb.bbb.b.....wwww.wwwwwwww|gh4 bc5
XXV-18|w|bbbb.bbbbbbb.b...w.ww.w.wwwwwwww|gh4 bc5 cd4 ab6
XXV-19|w|bbbbbbbb.b.b.bb..w.ww.w.wwwwwwww|gh4 bc5 cd4 fe5
XXV-20|w|bbbbb.bbbbbb......wwww..w.wwwwww|gh4 bc5 ed4 ce3 df4 cb6
XXV-21|w|bbbbbbbb..bb..b..w.www..ww.wwwww|gh4 bc5 ed4 ce3 fd4 de5
XXV-22|w|bbbb.bbbbb.b.b.b.w.ww.wwww.wwwww|gh4 bc5 fg3 ab6 cd4 fg5
XXV-23|w|bbbbbbbbb.bb.b.....wwww.wwwwwwww|gh4 dc5
XXV-24|w|bbbbbbbbb.bb....wb.ww.w.wwwwwwww|gh4 dc5 cb4 cd4
XXV-25|w|bbbbbbbbb..b.b.bw..ww.w.wwwwwwww|gh4 dc5 cb4 fg5
XXV-26|w|bbbbb.bbbbbb.b....wwww..wwwwwwww|gh4 dc5 ef4 cd6
XXVI-1|w|bbbbbbbbb.bb.b.....wwwwwwwwwwww.|g1-h4 d6-c5
XXVI-2|w|bbbbbb.bbbbb...b...wwwwwwwwwwww.|g1-h4 e7-g5
XXVI-3|w|bbbbbbbbbbb....b...wwwwwwwwwwww.|g1-h4 h6-g5
XXVI-4|w|bbbbbbbbbbbbw.......www.wwwwwwww|g3-a5 ---
XXVI-5|w|bbbb.bbbbbbbw.b.....www.wwwwwwww|g3-a5 a7-e5
XXVI-6|w|bbbbbbbb.bbbw.b.....www.wwwwwwww|g3-a5 b6-e5
XXVI-7|w|bbbbbbbbbbb.w..b....www.wwwwwwww|g3-a5 h6-g5
XXVI-8|w|bbbb.bbbbbbb..b.w...www.wwwwwwww|g3-b4 a7-e5
XXVI-9|w|bbbbbbbb.bbb..b.w...www.wwwwwwww|g3-b4 b6-e5
XXVI-10|w|bb.bbbbbbbbb....w.b.www.wwwwwwww|g3-b4 f8-f4
XXVI-11|w|bbbbbbb.bbbb...bw...www.wwwwwwww|g3-b4 g7-g5
XXVI-12|w|bbb.bbbbbbbb....w..bwww.wwwwwwww|g3-b4 h8-h4
XXVI-13|w|bbbbbbbbbbb....bw...www.wwwwwwww|g3-b4 h6-g5
XXVI-14|w|bbbbbbbb.bbb.w.b....www.wwwwwwww|g3-c5 b6-g5
XXVI-15|w|bbbb.bbbbbbbb....w..www.wwwwwwww|g3-d4 a7-a5
XXVI-16|w|bbbb.bbbbbbb..b..w..www.wwwwwwww|g3-d4 a7-e5
XXVI-17|w|bbbb.bbbbbbb.....wb.www.wwwwwwww|g3-d4 a7-f4
XXVI-18|w|bbbbbbbb.bbb.b...w..www.wwwwwwww|g3-d4 b6-c5
XXVI-19|w|bbbbbbbbb.bbb....w..www.wwwwwwww|g3-d4 d6-a5
XXVI-20|w|bbbbbbbbb.bb..b..w..www.wwwwwwww|g3-d4 d6-e5
XXVI-21|w|bbbbbbb.bbbbb....w..www.wwwwwwww|g3-d4 g7-a5
XXVI-22|w|bbbbbbb.bbbb..w....bwww.wwwwwwww|g3-e5 g7-h4
XXVI-23|w|bbb.bbbbbbbbb.w.....www.wwwwwwww|g3-e5 h8-a5
XXVI-24|w|bbbbbbbbbbbb......w.www.wwwwwwww|g3-f4 ---
XXVI-25|w|bbbbbbbbb.bb...b..w.www.wwwwwwww|g3-f4 d6-g5
XXVI-26|w|bbbbbbb.bbbbb.....w.www.wwwwwwww|g3-f4 g7-a5
XXVII-1|b|bbbbbbbbb..b.bb..w.ww.wwww.wwwww|gh4 dc5 fg3 fe5 cd4
XXVII-2|b|bbbbbbbbb..b.bb..w.www.www.wwwww|gh4 dc5 fg3 fe5 ed4
XXVII-3|w|bbbbbbbbb..b.bb....wwwwwwww.wwww|gh4 dc5 hg3 fe5
XXVII-4|w|bbbbbbbbb.bb..b....wwww.wwwwwwww|gh4 de5
XXVII-5|w|bbbbb.bbbbbb..b.w..w.ww.wwwwwwww|gh4 de5 ab4 cd6
XXVII-6|b|bbbbbbbbb.bb..b....wwwwwww.wwwww|gh4 de5 fg3
XXVII-7|w|bbbbbbbb..bb.bb....wwwwwwww.wwww|gh4 de5 hg3 bc5
XXVII-8|w|bbbbbbbbbb.b..b....wwww.wwwwwwww|gh4 fe5
XXVII-9|w|bbbbbbbbbb.b....wb.w.ww.wwwwwwww|gh4 fe5 ab4 ed4
XXVII-10|w|bbbbbbbbbb.b....w.bww.w.wwwwwwww|gh4 fe5 cb4 ef4
XXVII-11|w|bbbbbbbb.b.bb....w.ww.w..wwwwwww|gh4 fe5 cd4 ec3 bd4 ba5
XXVII-12|w|bbbbbbbb.b.b.bb..w.www..wwwwwwww|gh4 fe5 ed4 bc5
XXVII-13|w|bbbbbbbbb..b.bb..w.www..wwwwwwww|gh4 fe5 ed4 dc5
XXVII-14|w|bbbbbb.bbbbb..b..w.www..wwwwwwww|gh4 fe5 ed4 ef6
XXVII-15|w|bbbbbbb.bbbb..b..w.www..wwwwwwww|gh4 fe5 ed4 gf6
XXVII-16|w|bbbbbbb.b.bb.bb..w.www.www.wwwww|gh4 fe5 ed4 gf6 fg3 dc5
XXVII-17|w|bbbbbbbb.b.bb.....wwww..www.wwww|gh4 fe5 ef4 eg3 hf4 ba5
XXVII-18|b|bbbbbbbbbb.b..b....wwwwwww.wwwww|gh4 fe5 fg3
XXVII-19|w|bbbbbbb.bbbb..b....wwwwwww.wwwww|gh4 fe5 fg3 gf6
XXVII-20|w|bbbbbbbbbb.b...b...wwww.wwwwwwww|gh4 fg5
XXVII-21|w|bb.bbbbbbb.b..b.w....ww.wwwwwwww|gh4 fg5 hf6 ge5 ab4 fg7
XXVII-22|w|bb.bbbbbbb.b..b..w..ww..wwwwwwww|gh4 fg5 hf6 ge5 ed4 fg7
XXVII-23|b|bbbbbb.bbb.b...b.w..ww..wwwwwwww|gh4 fg5 hf6 eg5 ed4
XXVII-24|w|bbbbbbbbb.b..b.b.w.ww.w.wwwwwwww|gh4 hg5 cd4 dc5
XXVII-25|b|bbbbbbb.bbbb...b.w.ww.wwww.wwwww|gh4 hg5 cd4 gh6 fg3
XXVII-26|w|bbbbbbbb.bb.b.....wwww..w.wwwwww|gh4 hg5 ef4 ge3 df4 ba5
XXVIII-1|w|bbb.bbbbbbbb...b..w.www.wwwwwwww|g3-f4 h8-g5
XXVIII-2|w|bbbb.bbbbbbb...w...bwww.wwwwwwww|g3-g5 a7-h4
XXVIII-3|w|bbb.bbbbbbbb...wb...www.wwwwwwww|g3-g5 h8-b4
XXVIII-4|w|bbbbbbbbbbb.b..w....www.wwwwwwww|g3-g5 h6-a5
XXVIII-5|w|bbbbbbbbbbbb.......wwww.wwwwwwww|g3-h4 ---
XXVIII-6|w|bbbb.bbbbbbb...b...wwww.wwwwwwww|g3-h4 a7-g5
XXVIII-7|w|bbbbb.bbbbbb......bwwww.wwwwwwww|g3-h4 c7-f4
XXVIII-8|w|bbbbbbb.bbbbb......wwww.wwwwwwww|g3-h4 g7-a5
XXVIII-9|w|bbbbbbb.bbbb.b.....wwww.wwwwwwww|g3-h4 g7-c5
XXVIII-10|w|bbb.bbbbbbbb..b....wwww.wwwwwwww|g3-h4 h8-e5
XXVIII-11|w|bbbbbbbbbbbwb.......www.wwwwwwww|g3-h6 h6-a5
XXVIII-12|w|bbbbbbbbbbbw..b.....www.wwwwwwww|g3-h6 h6-e5
XXVIII-13|w|bbbbbbbbbbbw.......bwww.wwwwwwww|g3-h6 h6-h4
XXVIII-14|w|bbbbbbb.bbbbb.......wwwwwwwwwwww|--- g7-a5
XXVIII-15|w|bbbbbbb.bbbb..b.....wwwwwwwwwwww|--- g7-e5
XXVIII-16|w|bbbbbbb.bbbb...b....wwwwwwwwwwww|--- g7-g5
XXVIII-17|w|bbbbbbb.bbbb.......bwwwwwwwwwwww|--- g7-h4
XXVIII-18|w|bbbbbbbbbbbbw.......wwwwwww.wwww|h2-a5 ---
XXVIII-19|w|bbbb.bbbbbbbw..b....wwwwwww.wwww|h2-a5 a7-g5
XXVIII-20|w|bbbb.bbbbbbbw.......wwwwwwwbwwww|h2-a5 a7-h2
XXVIII-21|w|bbbbbbbb.bbbw.......wwwwwwwbwwww|h2-a5 b6-h2
XXVIII-22|w|bbbbbbbbb.bbw.......wwwwwwwbwwww|h2-a5 d6-h2
XXVIII-23|w|bbbbbb.bbbbbw..b....wwwwwww.wwww|h2-a5 e7-g5
XXVIII-24|w|bbbbbbbbbb.bw......bwwwwwww.wwww|h2-a5 f6-h4
XXVIII-25|w|bbbbbbb.bbbbw...b...wwwwwww.wwww|h2-a5 g7-b4
XXVIII-26|w|bbbbbbb.bbbbw.......wwwwwwwbwwww|h2-a5 g7-h2
XXIX-1|w|bbbbbbbb.bb..b....wwww..w.wwwwww|gh4 hg5 ef4 ge3 df4 bc5
XXIX-2|w|bbbbbbbbb.b...bb...wwwwwwww.wwww|gh4 hg5 hg3 de5
XXIX-3|w|bbbbbbb.bbbb...b...wwwwwwww.wwww|gh4 hg5 hg3 gh6
XXIX-4|w|bbbb.bbbbbbb...bw...wwwwwww.wwww|h2-b4 a7-g5
XXIX-5|w|bbbb.bbbbbbb....w...wwwwwwwbwwww|h2-b4 a7-h2
XXIX-6|w|bbb.bbbbbbbbw.......wwwwwwwbwwww|h2-a5 h8-h2
XXIX-7|w|bbb.bbbbbbbbw......bwwwwwww.wwww|h2-a5 h8-h4
XXIX-8|w|bbbbwbbbbbbb.....b..wwwwwww.wwww|h2-a7 a7-d4
XXIX-9|w|bbbb.bbbbbbb..b.w...wwwwwww.wwww|h2-b4 a7-e5
XXIX-10|w|bbbbbbbb.bbb.b..w...wwwwwww.wwww|h2-b4 b6-c5
XXIX-11|w|bbbbbbbb.bbb....w...wwwwwwwbwwww|h2-b4 b6-h2
XXIX-12|w|bbbbbbbbb.bb...bw...wwwwwww.wwww|h2-b4 d6-g5
XXIX-13|w|bbbbbbbbb.bb....w...wwwwwwwbwwww|h2-b4 d6-h2
XXIX-14|w|bbbbbbb.bbbb....w...wwwwwwwbwwww|h2-b4 g7-h2
XXIX-15|w|bbb.bbbbbbbb....w...wwwwwwwbwwww|h2-b4 h8-h2
XXIX-16|w|bbbb.bbbbbbb.w....b.wwwwwww.wwww|h2-c5 a7-f4
XXIX-17|w|bbbb.bbbbbbb.w......wwwwwwwbwwww|h2-c5 a7-h2
XXIX-18|w|bbbbbbbb.bbb.w......wwwwwwwbwwww|h2-c5 b6-h2
XXIX-19|w|bbbbbbbbb.bb.w......wwwwwwwbwwww|h2-c5 d6-h2
XXIX-20|w|bbbbbbbbbb.b.w......wwwwwwwbwwww|h2-c5 f6-h2
XXIX-21|w|bbb.bbbbbbbb.w......wwwwwwwbwwww|h2-c5 h8-h2
XXIX-22|w|bbbb.bbbbbbb.....w..wwwwwwwbwwww|h2-d4 a7-h2
XXIX-23|w|bbbbbbbb.bbb.b...w..wwwwwww.wwww|h2-d4 b6-c5
XXIX-24|w|bbbbbbbb.bbb.....w..wwwwwwwbwwww|h2-d4 b6-h2
XXIX-25|w|bbbbb.bbbbbb.....w..wwwwwwwbwwww|h2-d4 c7-h2
XXIX-26|w|bbbbbbbbb.bb.....w..wwwwwwwbwwww|h2-d4 d6-h2
XXX-1|w|bbbbbbb.bbbb.....w..wwwwwwwbwwww|h2-d4 g7-h2
XXX-2|w|bbbb.bbbbbbb..w.b...wwwwwww.wwww|h2-e5 a7-b4
XXX-3|w|bbbb.bbbbbbb..w..b..wwwwwww.wwww|h2-e5 a7-d4
XXX-4|w|bbbbbb.bbbbb..w.....wwwwwwwbwwww|h2-e5 e7-h2
XXX-5|w|bbb.bbbbbbbb..w.....wwwwwwwbwwww|h2-e5 h8-h2
XXX-6|w|bbbbbbbbbbbb......w.wwwwwww.wwww|h2-f4 ---
XXX-7|w|bbbb.bbbbbbb......w.wwwwwwwbwwww|h2-f4 a7-h2
XXX-8|w|bbbbb.bbbbbb......wbwwwwwww.wwww|h2-f4 c7-h4
XXX-9|w|bbbbb.bbbbbb......w.wwwwwwwbwwww|h2-f4 c7-h2
XXX-10|w|bbbbbb.bbbbb......w.wwwwwwwbwwww|h2-f4 e7-h2
XXX-11|w|bbbbbbbbbb.b..b...w.wwwwwww.wwww|h2-f4 f6-e5
XXX-12|w|bbbbbbbbbbb..b....w.wwwwwww.wwww|h2-f4 h6-c5
XXX-13|w|bbbbb.bbbbbbb..w....wwwwwww.wwww|h2-g5 c7-a5
XXX-14|w|bbbbb.bbbbbb..bw....wwwwwww.wwww|h2-g5 c7-e5
XXX-15|w|bbbbbbbbb.bb...w....wwwwwwwbwwww|h2-g5 d6-h2
XXX-16|w|bbbbbbbbbbbb.......wwwwwwww.wwww|h2-h4 ---
XXX-17|w|bbbbbbbbbbb........wwwwwwwwbwwww|h2-h4 h6-h2
XXX-18|w|bbbb.bbbbbbb..b....wwwwwwww.wwww|h2-h4 a7-e5
XXX-19|w|bbbb.bbbbbbb.......wwwwwwwwbwwww|h2-h4 a7-h2
XXX-20|w|bbbbbbbbb.bb..b....wwwwwwww.wwww|h2-h4 d6-e5
XXX-21|w|bbbbbbbbbbbw......b.wwwwwww.wwww|h2-h6 h6-f4
XXX-22|w|bbbbbbbbbbbw.......bwwwwwww.wwww|h2-h6 h6-h4
XXX-23|w|bbbbbbbbbbb.......b.wwwwwwwwwwww|--- h6-f4
XXX-24|w|bbbbbbbbbbb........bwwwwwwwwwwww|--- h6-h4
XXX-25|w|bbb.bbbbbbbb...b....wwwwwwwwwwww|--- h8-g5
XXX-26|w|bbb.bbbbbbbb.......bwwwwwwwwwwww|--- h8-h4`;
let _idf780=null;
function idf780List(){if(_idf780)return _idf780;_idf780=IDF780_RAW.trim().split('\n').map(l=>{const p=l.split('|');return{n:'IDF '+p[0],mv:p[3].split(' '),bs:p[2],sd:p[1]==='b'?-1:1}});return _idf780}
function setIdf(e){const b=Array(64).fill(0),mp={w:1,b:-1,W:2,B:-2};let k=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2){const ch=e.bs[k++];if(ch!=='.')b[r*8+c]=mp[ch]}G.pos=[b];G.mv=[];G.cur=0;G.s0=e.sd;return true}
function playOpen(e){for(let t of e.mv){t=t.replace(/[^a-h1-8]/g,'');const f='abcdefgh'.indexOf(t[0]),d=(8-t.slice(-1))*8+'abcdefgh'.indexOf(t.slice(-2)[0]);
 const ms=legal(G.pos[G.cur],sideAt(G.cur)).filter(m=>(m.path[0]&7)===f&&m.path[m.path.length-1]===d);if(!ms.length)return false;pushMove(ms[0])}return true}
function saveDT(){DT.fmjd=$('dt-fmjd').value;DT.idf=$('dt-idf').value;try{localStorage.setItem('sp_dt',JSON.stringify(DT))}catch(e){}toast(T('ok')+' · '+dtList('fmjd').length+' / '+dtList('idf').length)}
let G={tool:'1',es:null,pos:[init()],mv:[],cur:0,s0:1,over:false,res:null,mode:'ai',me:1,flip:false,sel:null,hint:null,t:[0,0],inc:0,tc:false,last:Date.now(),edit:false,tok:0,busy:false,tapR:0,tapD:0};
const sideAt=i=>G.s0*(i%2?-1:1),myTurn=()=>G.mode==='local'||sideAt(G.cur)===G.me,atEnd=()=>G.cur===G.pos.length-1;
function beep(f,d,t){if(!S.snd)return;try{G.ac=G.ac||new(window.AudioContext||window.webkitAudioContext)();const o=G.ac.createOscillator(),g=G.ac.createGain();o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(.3,G.ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,G.ac.currentTime+d);o.connect(g);g.connect(G.ac.destination);o.start();o.stop(G.ac.currentTime+d)}catch(e){}}
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),1800)}
function pushMove(m){const side=sideAt(G.cur),b=G.pos[G.cur];
 if(!atEnd()){G.pos.length=G.cur+1;G.mv.length=G.cur;G.over=false;G.res=null}
 G.mv.push({...m,n:fmt(m),man:Math.abs(b[m.path[0]])===1});G.pos.push(apply(b,m));G.cur++;G.sel=null;G.hint=null}
function newGame(){G.tok++;const[a,b]=String(S.tc).split('+').map(Number);
 G.pos=[init()];G.mv=[];G.cur=0;G.s0=1;G.over=false;G.res=null;G.edit=false;G.mode=S.mode;
 G.me=S.col==='r'?(Math.random()<.5?1:-1):S.col==='w'?1:-1;G.flip=G.mode==='ai'&&G.me===-1;
 G.opn=null;if(S.open&&S.open!=='std'){let e=null;
 if(S.mm&&MM.e&&MM.e.k===S.open){e=MM.e;G.me=-MM.me;MM={}}else{const L=S.open==='idf780'?idf780List():dtList(S.open);if(L.length)e=L[Math.random()*L.length|0];else toast('Ro\'yxat bo\'sh')}
 if(e){if(e.bs?setIdf(e):playOpen(e))G.opn={...e,k:S.open};else{G.pos=[init()];G.mv=[];G.cur=0;G.s0=1;toast('✗ '+e.n)}}}
 G.flip=G.mode==='ai'&&G.me===-1;G.tc=a>0;G.t=[a*1000,a*1000];G.inc=(b||0)*1000;G.last=Date.now();G.sel=null;G.hint=null;TT.clear();$('an').textContent=G.opn?G.opn.n+': '+G.opn.mv.join(' '):'';tab('play');render();kick()}
function kick(){if(!G.over&&!G.edit&&G.mode==='ai'&&sideAt(G.cur)!==G.me&&atEnd())aiMove()}
function diagScroll(tag){
 const b=document.querySelector('#board');
 const w=document.querySelector('.wrap');
 const r=b.getBoundingClientRect();
 const wr=w.getBoundingClientRect();
 console.log('[SCROLL-DIAG]',tag,{
  scrollY:window.scrollY,
  innerHeight:window.innerHeight,
  visualHeight:window.visualViewport?.height,
  visualTop:window.visualViewport?.offsetTop,
  boardTop:Math.round(r.top),
  boardBottom:Math.round(r.bottom),
  wrapTop:Math.round(wr.top),
  wrapBottom:Math.round(wr.bottom),
  boardHeight:Math.round(r.height)
 });
}
function doMove(m){diagScroll('BEFORE MOVE');const side=sideAt(G.cur);tick();pushMove(m);hap(m.caps.length?'medium':'light');if(G.tc)G.t[side>0?0:1]+=G.inc;beep(m.caps.length?330:200,.1);checkEnd();render();requestAnimationFrame(()=>diagScroll('AFTER MOVE'));kick()}
function aiMove(){const tok=++G.tok,side=sideAt(G.cur);G.busy=true;render();
 setTimeout(()=>{if(tok!==G.tok||G.over){G.busy=false;return}const r=bestMove(G.pos[G.cur],side,+S.lvl);G.busy=false;if(!r)return;
  $('an').textContent=`d${r.d} · ${nodes} nodes · ${(r.v/100).toFixed(2)}`;doMove(r.m)},40)}
function checkEnd(){if(!atEnd())return;const b=G.pos[G.cur],side=sideAt(G.cur);
 if(!legal(b,side).length)return end(side>0?'b':'w');
 let n=0;for(let i=G.mv.length-1;i>=0;i--){if(G.mv[i].caps.length||G.mv[i].man)break;n++}
 let rep=0;const k=side+b.join('');for(let i=G.cur;i>=0;i-=2)if(sideAt(i)+G.pos[i].join('')===k)rep++;
 if(n>=30)end('d');else if(rep>=3)end('d')}
function end(res){if(G.over)return;G.over=true;G.res=res;if(S.mm&&G.opn)MM={e:G.opn,me:G.me};beep(res==='d'?300:520,.4,'sine');
 if(G.mode==='ai'){const w=res==='d'?'d':(res==='w')===(G.me===1)?'w':'l';ST[w]++;svs()}render()}
function tick(){const now=Date.now();if(G.over||G.edit||!G.tc||!atEnd()){G.last=now;return}
 const i=sideAt(G.cur)>0?0:1;G.t[i]-=now-G.last;G.last=now;if(G.t[i]<=0){G.t[i]=0;end(i?'w':'b')}}
setInterval(()=>{tick();clk()},200);
function go(i){G.cur=Math.max(0,Math.min(G.pos.length-1,i));G.sel=null;G.hint=null;render()}
function undo(){if(G.edit)return;G.tok++;let t=G.cur-1;while(t>=0&&G.mode==='ai'&&sideAt(t)!==G.me)t--;if(t<0)return;G.over=false;G.res=null;G.pos.length=G.cur+1;G.cur=t;G.sel=null;G.last=Date.now();render()}
function redo(){let t=G.cur+1;while(t<G.pos.length-1&&G.mode==='ai'&&sideAt(t)!==G.me)t++;go(t);kick()}
function resign(){if(G.over||G.edit)return;if(Date.now()-G.tapR>2500){G.tapR=Date.now();return toast(T('tap'))}end(G.mode==='ai'?(G.me>0?'b':'w'):(sideAt(G.cur)>0?'b':'w'))}
function offerDraw(){if(G.over||G.edit)return;if(G.mode==='local'){toast(T('ok'));return end('d')}
 const r=bestMove(G.pos[G.cur],-G.me,2,300);const aiScore=r?r.v*-G.me:0;if(aiScore<=30){toast(T('ok'));end('d')}else toast(T('no'))}
function hint(){if(G.over||G.edit||!myTurn())return;const r=bestMove(G.pos[G.cur],sideAt(G.cur),3,1200);if(r){G.hint=[r.m.path[0],r.m.path[r.m.path.length-1]];render()}}
function analyze(){const b=G.pos[G.cur],s=sideAt(G.cur);$('an').textContent='…';setTimeout(()=>{const r=bestMove(b,s,4,2500);
 if(!r){$('an').textContent='—';return}G.hint=[r.m.path[0],r.m.path[r.m.path.length-1]];$('an').textContent=`${(r.v/100).toFixed(2)} · d${r.d} · ${nodes} nodes · ${fmt(r.m)}`;render()},30)}
function clearStats(){ST={w:0,l:0,d:0};svs();render()}
/* ---------- editor ---------- */
function tab(t){const was=G.edit;document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 document.querySelectorAll('.tab').forEach(e=>e.classList.toggle('on',e.id==='t-'+t));
 if(t==='ed'&&!was){const s=sideAt(G.cur);G.tok++;G.pos=[G.pos[G.cur].slice()];G.mv=[];G.cur=0;G.s0=s;G.over=false;G.edit=true;$('edside').value=s}
 if(t!=='ed'&&was){G.edit=false;G.s0=+$('edside').value;G.last=Date.now();checkEnd();kick()}render()}
function edFill(x){G.pos[0]=x?init():Array(64).fill(0);render()}
/* ---------- PDN ---------- */
function expPdn(){let s='[Event "Shashka Pro"]\n[GameType "Russian draughts"]\n\n';G.mv.forEach((m,i)=>{if(i%2===0)s+=(i/2+1)+'. ';s+=m.n+' '});$('pdn').value=s.trim()}
function cpPdn(){const t=$('pdn');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){try{document.execCommand('copy')}catch(e2){}}toast(T('ok'))}
function impPdn(){const toks=$('pdn').value.match(/[a-h][1-8](?:[-x:][a-h][1-8])+/g)||[];G.tok++;
 G.pos=[init()];G.mv=[];G.cur=0;G.s0=1;G.over=false;G.res=null;G.edit=false;
 for(const tk of toks){const p=tk.match(/[a-h][1-8]/g).map(s=>(8-s[1])*8+'abcdefgh'.indexOf(s[0]));
  const ms=legal(G.pos[G.cur],sideAt(G.cur)).filter(m=>m.path[0]===p[0]&&m.path[m.path.length-1]===p[p.length-1]);
  const m=ms.find(m=>m.path.join()===p.join())||ms[0];if(!m){toast('✗ '+tk);break}pushMove(m)}
 G.mode='local';G.tc=false;G.last=Date.now();checkEnd();tab('play');render()}
/* ---------- render ---------- */
const pad=s=>String(s).padStart(2,'0'),mm=ms=>{const s=Math.ceil(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60)};
function clk(){const top=G.flip?1:-1;const f=s=>G.tc?mm(G.t[s>0?0:1]):'∞';$('tclk').textContent=f(top);$('bclk').textContent=f(-top)}
function render(){
 const bd=G.pos[G.cur],side=sideAt(G.cur),B=$('board');B.dataset.th=S.th;B.dataset.ps=S.ps;B.style.setProperty('--km',"'"+S.km+"'");B.style.width=S.bw+'%';B.style.setProperty('--pz',S.pz+'%');B.style.margin='0 auto';
 const ms=G.edit?[]:legal(bd,side),ok=!G.edit&&myTurn()&&!(G.over&&atEnd())&&!G.busy,pre=ok?(G.sel||[]):[];
 const srcs=new Set(ok?ms.map(m=>m.path[0]):[]),forced=ms.length&&ms[0].caps.length;
 const cands=pre.length?ms.filter(m=>pre.every((x,i)=>m.path[i]===x)):[],tg=new Map();
 cands.forEach(m=>{if(m.path.length>pre.length)tg.set(m.path[pre.length],m.caps.length)});
 const lm=G.cur>0?G.mv[G.cur-1].path:[];let h='';
 for(let vr=0;vr<8;vr++)for(let vc=0;vc<8;vc++){const r=G.flip?7-vr:vr,c=G.flip?7-vc:vc,i=r*8+c,p=bd[i];let cl='sq '+((r+c)%2?'d':'l');
  if(S.hl&&lm.includes(i))cl+=' lm';if(pre.includes(i)||(G.edit&&G.es===i))cl+=' sel';if(S.dots&&tg.has(i))cl+=tg.get(i)?' cp':' tg';
  if(G.hint&&G.hint.includes(i))cl+=' hn';if(S.mc&&forced&&!pre.length&&srcs.has(i))cl+=' mc';
  h+=`<div class="${cl}" data-i="${i}">${S.co&&vc===0?`<b class="rk">${8-r}</b>`:''}${S.co&&vr===7?`<b class="fl">${'abcdefgh'[c]}</b>`:''}${p?`<i class="pc ${p>0?'w':'b'}${Math.abs(p)===2?' k':''}"></i>`:''}</div>`}
 B.innerHTML=h;
 let wc=0,bc=0;bd.forEach(p=>{if(p>0)wc++;else if(p<0)bc++});const top=G.flip?1:-1;
 const nm=s=>(s>0?'⚪ ':'⚫ ')+(G.mode==='ai'?(s===G.me?'You':'AI · L'+(+S.lvl+1)):(s>0?'White':'Black'));
 $('tn').textContent=nm(top);$('bn').textContent=nm(-top);$('tcn').textContent=(top>0?wc:bc);$('bcn').textContent=(top>0?bc:wc);clk();
 const e=ev(bd);$('evf').style.width=Math.max(4,Math.min(96,50+e/8))+'%';$('evt').textContent=(e/100).toFixed(1);
 $('st').textContent=G.edit?T('editor'):G.over?(G.res==='d'?T('drw'):G.res==='w'?T('winW'):T('winB')):G.busy?T('think'):side>0?T('turnW'):T('turnB');
 let ml='';G.mv.forEach((m,i)=>{if(i%2===0)ml+=(i/2+1)+'. ';ml+=`<span data-p="${i+1}" class="${G.cur===i+1?'cu':''}">${m.n}</span> `});$('ml').innerHTML=ml;
 $('stats').textContent=`✔ ${ST.w}  ✘ ${ST.l}  = ${ST.d}`;
 if(G.edit){$('fen').value=fenOf(bd,G.s0);document.querySelectorAll('#tools button').forEach(b=>b.classList.toggle('on',b.dataset.tl===String(G.tool)))}}
$('ml').onclick=e=>{const p=e.target.dataset.p;if(p)go(+p)};
$('board').onclick=e=>{const el=e.target.closest('.sq');if(!el)return;const i=+el.dataset.i;
 if(G.edit){if(!(((i>>3)+(i&7))%2))return;const b=G.pos[0];
 if(G.tool==='hand'){if(G.es==null){if(b[i])G.es=i}else{if(G.es!==i&&!b[i]){b[i]=b[G.es];b[G.es]=0}G.es=null}}
 else{const v=+G.tool;b[i]=b[i]===v?0:v}render();return}
 if(G.busy||!myTurn()||(G.over&&atEnd()))return;
 const ms=legal(G.pos[G.cur],sideAt(G.cur));let pre=G.sel||[];
 if(pre.length){const cs=ms.filter(m=>pre.every((x,k)=>m.path[k]===x)&&m.path[pre.length]===i);
  if(cs.length){pre=[...pre,i];const done=cs.find(m=>m.path.length===pre.length);if(done){G.sel=null;return doMove(done)}G.sel=pre;return render()}}
 G.sel=ms.some(m=>m.path[0]===i)?[i]:null;render()};
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
document.querySelectorAll('[data-s]').forEach(el=>{const k=el.dataset.s;if(el.type==='checkbox')el.checked=!!S[k];else el.value=S[k];
 el.onchange=()=>{S[k]=el.type==='checkbox'?el.checked:el.value;sv();skin();if(k==='mode'||k==='col'||k==='tc'||k==='lvl'){}render()}});
function skin(){const r=document.documentElement;if(S.theme==='auto'){if(TG&&TG.initData)r.dataset.theme=TG.colorScheme;else r.removeAttribute('data-theme')}else r.dataset.theme=S.theme;
 document.documentElement.lang=S.lang;document.querySelectorAll('[data-i]').forEach(e=>e.textContent=T(e.dataset.i))}
$('edside').onchange=()=>{G.s0=+$('edside').value;render()};
document.onkeydown=e=>{if(/TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();
 if(k==='arrowleft')go(G.cur-1);else if(k==='arrowright')go(G.cur+1);else if(k==='u')undo();else if(k==='f'){G.flip=!G.flip;render()}else if(k==='h')hint();else if(k==='n')newGame()};
function fenOf(b,s){const L=v=>{const r=[];for(let i=0;i<64;i++)if(b[i]*v>0)r.push((Math.abs(b[i])===2?'K':'')+sq(i));return r.join(',')};return(s>0?'W':'B')+':W'+L(1)+':B'+L(-1)}
function loadFen(t){const m=t.trim().match(/^([WB]):W([^:]*):B(.*)$/i);if(!m)return toast('FEN ✗');const b=Array(64).fill(0);
 for(const[v,str]of[[1,m[2]],[-1,m[3]]])for(const it of str.split(',').filter(Boolean)){const x=it.trim().match(/^(K?)([a-h])([1-8])$/i);if(!x)return toast('✗ '+it);
  const i=(8-x[3])*8+'abcdefgh'.indexOf(x[2].toLowerCase());if(((i>>3)+(i&7))%2===0)return toast('✗ '+it);b[i]=v*(x[1]?2:1)}
 G.pos[0]=b;G.s0=m[1].toUpperCase()==='W'?1:-1;$('edside').value=G.s0;render()}
function cpFen(){const t=$('fen');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){try{document.execCommand('copy')}catch(e2){}}toast(T('ok'))}
$('fen').onchange=()=>loadFen($('fen').value);
document.querySelectorAll('#tools button').forEach(b=>b.onclick=()=>{G.tool=b.dataset.tl;G.es=null;render()});
$('dt-fmjd').value=DT.fmjd;$('dt-idf').value=DT.idf;skin();newGame();
