'use strict';
const L=require('./dragonlearn'),R=require('./kkrules'),store=require('./store');
let busy=false;
async function analyze(id,secs){if(busy)throw Error('busy');const x=L.db(),q=x.samples.find(v=>v.id===id);if(!q)throw Error('sample missing');const E=require('./dragonai');if(!E.isReady()||E.load())throw Error('engine busy');busy=true;try{const r=await new Promise(resolve=>E.move({board:q.b,side:q.s,damkaPlies:q.p,time:Math.max(1,Math.min(30,+secs||10)),workshop:true},resolve));if(!r||r.error||!L.legal(q.b,q.s,r))throw Error('invalid engine result');q.review={from:r.from,to:r.to,ev:r.ev,tb:r.tb||null,ms:r.ms,changed:r.from!==q.from||r.to!==q.to};store.save();return q.review;}finally{busy=false;}}
function approve(id){const x=L.db(),q=x.samples.find(v=>v.id===id);if(!q||!q.review||!Number.isInteger(q.p))throw Error('review missing');const t=require('./damka_tb').best(q.b,q.s,q.p);if(!t||t.from!==q.review.from||t.to!==q.review.to||!L.legal(q.b,q.s,t))throw Error('Only tablebase verified lessons can be activated');const k=L.key(q.b,q.s,q.p);x.lessons[k]={from:t.from,to:t.to,jumps:t.caps.length,path:t.path,caps:t.caps,tb:t.res,ms:0};store.save();return k;}
// Opt-in background review, one position per minute, no automatic approval.
let lastError='', lastRun=0;
async function tick(){
 if(busy)return;
 const x=L.db();if(!x.auto)return;
 const E=require('./dragonai'),K=require('./kestoai');
 if(!E.isReady()||E.load()||K.load()||K.qstat().queue)return;
 const q=x.samples.find(v=>!v.review&&(!v.retryAt||v.retryAt<Date.now()));
 if(!q)return;
 try{await analyze(q.id,5);lastRun=Date.now();lastError='';}
 catch(e){q.retryAt=Date.now()+600000;lastError=e.message;store.save();}
}
const timer=setInterval(()=>{tick().catch(e=>{lastError=e.message;});},60000);timer.unref();
module.exports={analyze,approve,busy:()=>busy,status:()=>({lastError,lastRun})};
