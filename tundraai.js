'use strict';
// Qor Malikasi: disabled until an actual Tundra adapter is configured.
// Adapter contract is ours, not the native Tundra CLI protocol.
const {spawn}=require('node:child_process');
const profile=Object.freeze({uid:'bot_qor_malikasi',name:'❄️ Qor Malikasi Bot',engine:'Tundra'});
function move(opts,cb){
 const executable=process.env.TUNDRA_BRIDGE;
 if(!executable)return queueMicrotask(()=>cb({error:'Tundra adapter not configured'}));
 if(!opts||!Array.isArray(opts.board)||opts.board.length!==64||!opts.board.every(x=>[-2,-1,0,1,2].includes(x))||![1,-1].includes(opts.side))return queueMicrotask(()=>cb({error:'Invalid position'}));
 const time=Math.max(.1,Math.min(60,Number(opts.time)||1));
 let child,done=false,timer,out='';
 function finish(r){if(done)return;done=true;clearTimeout(timer);if(child&&!child.killed)child.kill();cb(r);}
 try{child=spawn(executable,[],{stdio:['pipe','pipe','ignore'],shell:false});}catch(e){return finish({error:e.message});}
 timer=setTimeout(()=>finish({error:'Tundra timeout'}),Math.ceil(time*1000)+3000);
 child.on('error',e=>finish({error:e.message}));
 child.stdin.on('error',e=>finish({error:e.message}));
 child.stdout.on('data',b=>{out+=b;if(out.length>8192)finish({error:'Oversized adapter response'});});
 child.on('close',code=>{if(done)return;if(code!==0)return finish({error:'Tundra adapter failed'});try{const r=JSON.parse(out);if(!r||![r.from,r.to].every(x=>Number.isInteger(x)&&x>=0&&x<64)||r.from===r.to)throw Error('Invalid move');finish({from:r.from,to:r.to});}catch(e){finish({error:e.message});}});
 child.stdin.end(JSON.stringify({board:opts.board,side:opts.side,time})+'\n');
}
module.exports={profile,move};
