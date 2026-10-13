const fs=require('fs');let s=fs.readFileSync('index.html','utf8');let bad=0;
function rep(a,b){const n=s.split(a).length-1;if(n!==1){console.log('ANCHOR XATO ('+n+'): '+a.slice(0,50));bad++;return}s=s.replace(a,()=>b)}
if(s.includes('cleanCss')){console.log('allaqachon bor');process.exit(1)}
rep('<script>window.TG_APP_LINK=','<script src="/idf780.js"></script><script>window.TG_APP_LINK=');
rep("S.mode='local';skin();newGame();",fs.readFileSync('clean.part','utf8').replace(/\n/g,'')+"S.mode='local';skin();newGame();");
if(bad){console.log('YOZILMADI');process.exit(1)}
fs.writeFileSync('index.html',s);console.log('PATCH_OK');
