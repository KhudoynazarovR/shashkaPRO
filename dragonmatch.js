'use strict';
const R=require('./kkrules'), L=require('./dragonlearn');
const engines={Dragon:require('./dragonai'),KestoG:require('./kestoai'),'King Kong':require('./kestoai')};
let state={running:false,done:0,wins:0,draws:0,losses:0};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function start(j){
 if(state.running)throw Error('Match already running');
 if(!Object.hasOwn(engines,j.a)||!Object.hasOwn(engines,j.b)||j.a===j.b||![10,50,100,500].includes(j.count)||!['1+0','1+1','3+2','5+0','10+5'].includes(j.tc))throw Error('Invalid match settings');
 const [min,inc]=j.tc.split('+').map(Number);
 state={running:true,done:0,wins:0,draws:0,losses:0,a:j.a,b:j.b,count:j.count,tc:j.tc};
 run(state,min,inc).catch(e=>{state.error=e.message;state.running=false;});
 return state;
}
async function run(s,min,inc){
 for(let g=0;g<s.count&&!s.stop;g++){
 const white=g%2?s.b:s.a,black=g%2?s.a:s.b;
 let b=Array.from({length:64},(_,i)=>((i>>3)+(i&7))%2===1?i<24?-1:i>=40?1:0:0),side=1,ply=0,result='draw',seen=new Map(),clock={1:min*60000,'-1':min*60000};
 s.game=g+1;s.white=white;s.black=black;s.ply=0;s.history=[{board:b.slice(),side}];s.clock={...clock};
 for(;ply<300&&!s.stop;ply++){
 s.turn=side;s.clock={...clock};s.turnAt=Date.now();
 const moves=R.moves(b,side);if(!moves.length){result=side===1?black:white;break;}
 const key=b.join(',')+'|'+side;seen.set(key,(seen.get(key)||0)+1);if(seen.get(key)>=3)break;
 const name=side===1?white:black,E=engines[name],budget=Math.min(5,Math.max(.05,clock[side]/30000+inc*.7));
 const t=Date.now();let r;
 for(let n=0;n<10&&!s.stop;n++){
 r=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Engine timeout')),20000);E.move({board:b,side,time:budget,maxTime:budget,workshop:true,kk:name==='King Kong',book:name==='King Kong',rem:clock[side]/1000},v=>{clearTimeout(timer);resolve(v);});});
 if(r&&!r.error)break;
 if(!r||!['busy','notready'].includes(r.error))throw Error(r?.error||'Engine error');await pause(500);
 }
 if(s.stop)break;
 if(!r||r.error)throw Error('Engine unavailable');
 clock[side]-=Date.now()-t;if(clock[side]<=0){result=side===1?black:white;break;}
 const candidates=moves.filter(m=>m.from===r.from&&m.to===r.to);
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 let exact=candidates.filter(m=>!Number.isInteger(r.jumps)||m.caps.length===r.jumps);
 if(Array.isArray(r.path)&&r.path.length)exact=exact.filter(m=>same(m.path,r.path)||same([m.from,...m.path],r.path));
 if(Array.isArray(r.caps))exact=exact.filter(m=>same(m.caps,r.caps));
 const m=exact.length===1?exact[0]:null;
 if(!m){
 const d={at:Date.now(),game:g+1,ply,engine:name,side,board:b.slice(),reply:r,candidates:moves,clock:{...clock},a:s.a,b:s.b,done:s.done};
 const x=L.db();(x.matchErrors||=[]).push(d);require('./store').save();
 console.error('[Dragon match move]',JSON.stringify(d));
 throw Error('Illegal or ambiguous engine move: '+name+' (diagnostic saved)');
 }
 b=m.board;clock[side]+=inc*1000;side=-side;s.ply=ply+1;s.history.push({board:b.slice(),side,from:m.from,to:m.to,path:m.path,caps:m.caps});s.clock={...clock};s.turn=side;s.turnAt=Date.now();await pause(20);
 }
 if(s.stop)break;
 s.turnAt=null;s.clock={...clock};s.done++;if(result==='draw')s.draws++;else if(result===s.a)s.wins++;else s.losses++;
 L.game({at:Date.now(),white,black,result,ply});
 }
 s.running=false;s.turnAt=null;
}
module.exports={start,state:()=>state,stop:()=>{state.stop=true;return state;}};
