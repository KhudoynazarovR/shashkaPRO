const fs=require('fs'),zlib=require('zlib'),D='partiyalar/';
const OLD_K='Dasturlar partiyalari · Klassika · 09.02.2011', OLD_Q='Dasturlar partiyalari · Qura · 09.02.2011', NEW='Dasturlar partiyalari · 09.02.2011';
const NM=JSON.parse(fs.readFileSync(D+'names.json','utf8'));
let tk=null,tq=null;
for(const i in NM.t){ if(NM.t[i]===NEW)tk=i; if(NM.t[i]===OLD_K)tk=i; if(NM.t[i]===OLD_Q)tq=i; }
if(tk===null){console.log('Klassika (18 ta) papkasi topilmadi');process.exit(1);}
let base=zlib.gunzipSync(fs.readFileSync(D+'games.txt.gz')).toString('utf8');
if(!base.endsWith('\n')) base+='\n';
if(fs.existsSync(D+'qura_games.txt')){
  const q=fs.readFileSync(D+'qura_games.txt','utf8').trim().split('\n').map(l=>{const f=l.split('\t');f[2]=tk;return f.join('\t');});
  base+=q.join('\n')+'\n';
  fs.renameSync(D+'qura_games.txt',D+'qura_games.txt.done');
}
NM.t[tk]=NEW; if(tq!==null) delete NM.t[tq];
fs.writeFileSync(D+'games.txt.gz',zlib.gzipSync(Buffer.from(base,'utf8'),{level:9}));
fs.writeFileSync(D+'names.json',JSON.stringify(NM));
const rows=base.split('\n').filter(l=>l.split('\t')[2]===String(tk));
const std=rows.filter(l=>l.split('\t').length===7).length, qura=rows.filter(l=>l.split('\t').length===8).length;
console.log('Papka:',NM.t[tk],'| standart:',std,'| qura:',qura,'| jami:',rows.length);
if(std!==18||qura!==17){console.log('XATO: 18 va 17 bo‘lishi kerak');process.exit(2);}
