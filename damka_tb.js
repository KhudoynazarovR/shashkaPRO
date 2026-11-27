'use strict';
// DKB1 format from Damka (Anton Medvedev, MIT; see damka_tb/LICENSE).
const fs=require('fs'),path=require('path'),z=require('zlib'),R=require('./kkrules');
const dir=path.join(__dirname,'damka_tb'),tables=new Map(),cache=new Map();let bytes=0;
function choose(n,k){if(n<k||n<0)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return Math.round(v)}
function rank(a,o){return a.reduce((v,s,i)=>v+choose(s-o,i+1),0)}
function quiet(b,side,plies){
 const a=[[],[],[],[]];
 for(let i=0;i<64;i++)if(b[i]){
 const r=i>>3,c=i&7;if((r+c)%2!==1)return null;
 let s=(7-r)*4+(c>>1),p=b[i]*side;if(side<0)s=31-s;
 a[p===1?0:p===2?1:p===-1?2:3].push(s);
 }
 a.forEach(x=>x.sort((u,v)=>u-v));
 if(a[0].some(s=>s>=28)||a[2].some(s=>s<4))return null;
 const [w,k,m,h]=a.map(x=>x.length),name=w+'m'+k+'kv'+m+'m'+h+'k.bin';
 let t=tables.get(name);
 if(!t){const f=fs.readFileSync(path.join(dir,name));if(f.toString('ascii',0,4)!=='DKB1'||f.readUInt32LE(4)!==(w|(k<<8)|(m<<16)|(h<<24)))return null;
 const size=f.readUInt32LE(8),shift=f.readUInt32LE(12),n=f.readUInt32LE(16),head=20+4*(n+1);
 if(shift>20||head>f.length||n!==Math.ceil(size/2**shift))return null;
 t={f,size,shift,n,head};tables.set(name,t);}
 const i=((rank(a[0],0)*choose(28,m)+rank(a[2],4))*choose(32,k)+rank(a[1],0))*choose(32,h)+rank(a[3],0);
 if(i<0||i>=t.size)return null;
 const block=Math.floor(i/2**t.shift),key=name+':'+block;let data=cache.get(key);
 if(!data){const start=t.head+t.f.readUInt32LE(20+4*block),end=t.head+t.f.readUInt32LE(24+4*block),len=Math.min(2**t.shift,t.size-block*2**t.shift);
 if(start>end||end>t.f.length)return null;
 data=z.inflateRawSync(t.f.subarray(start,end),{maxOutputLength:len});if(data.length!==len)return null;
 cache.set(key,data);bytes+=data.length;while(bytes>32*1024*1024){const k=cache.keys().next().value;bytes-=cache.get(k).length;cache.delete(k);}}
 const v=data[i%2**t.shift];if(v===0)return 0;if(v>=1&&v<=30)return v<=30-plies?25000-v:0;if(v>=32&&v<=62)return v-32<=30-plies?v-32-25000:0;return null;
}
function probe(b,side,plies){const moves=R.moves(b,side);if(!moves.length)return -25000;if(!b.some(p=>p*side<0))return 25000;if(moves[0].caps.length){let best=-Infinity;for(const m of moves){const v=probe(m.board,-side,0);if(v===null)return null;best=Math.max(best,-v);}return best;}return quiet(b,side,plies);}
function best(b,side,plies){if(!Number.isInteger(plies)||plies<0||plies>=30||b.filter(Boolean).length>5)return null;try{const root=probe(b,side,plies);if(root===null)return null;let pick=null,score=-Infinity;for(const m of R.moves(b,side)){const v=probe(m.board,-side,m.caps.length||Math.abs(b[m.from])===1?0:plies+1);if(v===null)return null;if(-v>score){score=-v;pick=m;}}if(!pick||Math.sign(score)!==Math.sign(root))return null;return {...pick,score,res:score>0?'win':score<0?'loss':'draw'};}catch(e){return null;}}
module.exports={best};
