const fs=require('fs');let s=fs.readFileSync('index.html','utf8');let bad=0;
function rep(a,b){const n=s.split(a).length-1;if(n!==1){console.log('ANCHOR XATO ('+n+'): '+a.slice(0,60));bad++;return}s=s.replace(a,()=>b)}
rep("olive|photo)$/.test(S.th)","olive|photo|edeon)$/.test(S.th)");
rep("S.mode='local';skin();newGame();",fs.readFileSync('edeon.part','utf8').replace(/\n/g,'')+"S.mode='local';skin();newGame();");
if(bad){console.log('YOZILMADI');process.exit(1)}
fs.writeFileSync('index.html',s);console.log('PATCH_OK');
