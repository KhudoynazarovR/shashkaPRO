'use strict';
const R=require('./kkrules'), L=require('./dragonlearn');
const engines={Dragon:require('./dragonai'),KestoG:require('./kestoai')};
let state={running:false,done:0,wins:0,draws:0,losses:0};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function start(j){
 if(state.running)throw Error('Match already running');
 if(!engines[j.a]||!engines[j.b]||j.a===j.b||![10,50,100,500].includes(j.count)||!['1+0','1+1','3+2','5+0','10+5'].includes(j.tc))throw Error('Invalid match settings');
 const [min,inc]=j.tc.split('+').map(Number);
 state={running:true,done:0,wins:0,draws:0,losses:0,a:j.a,b:j.b,count:j.count,tc:j.tc};
 run(state,min,inc).catch(e=>{state.error=e.message;state.running=false;});
 return state;
}
async function run(s,min,inc){
 for(let g=0;g<s.count&&!s.stop;g++){
 const white=g%2?s.b:s.a,black=g%2?s.a:s.b;
 let b=Array.from({length:64},(_,i)=>((i>>3)+(i&7))%2===1?i<24?-1:i>=40?1:0:0),side=1,ply=0,result='draw',seen=new Map(),clock={1:min*60000,'-1':min*60000};
 for(;ply<300&&!s.stop;ply++){
 const moves=R.moves(b,side);if(!moves.length){result=side===1?black:white;break;}
 const key=b.join(',')+'|'+side;seen.set(key,(seen.get(key)||0)+1);if(seen.get(key)>=3)break;
 const E=engines[side===1?white:black],budget=Math.min(5,Math.max(.05,clock[side]/30000+inc*.7));
 const t=Date.now();let r;
 for(let n=0;n<10&&!s.stop;n++){
 r=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Engine timeout')),20000);E.move({board:b,side,time:budget,workshop:true},v=>{clearTimeout(timer);resolve(v);});});
 if(r&&!r.error)break;
 if(!r||!['busy','notready'].includes(r.error))throw Error(r?.error||'Engine error');await pause(500);
 }
 if(s.stop)break;
 if(!r||r.error)throw Error('Engine unavailable');
 clock[side]-=Date.now()-t;if(clock[side]<=0){result=side===1?black:white;break;}
 const candidates=moves.filter(m=>m.from===r.from&&m.to===r.to);
 const m=candidates.find(m=>m.caps.length===r.jumps)|| (candidates.length===1?candidates[0]:null);
 if(!m)throw Error('Illegal or ambiguous engine move');
 b=m.board;clock[side]+=inc*1000;side=-side;s.ply=ply+1;await pause(20);
 }
 if(s.stop)break;
 s.done++;if(result==='draw')s.draws++;else if(result===s.a)s.wins++;else s.losses++;
 L.game({at:Date.now(),white,black,result,ply});
 }
 s.running=false;
}
module.exports={start,state:()=>state,stop:()=>{state.stop=true;return state;}};
