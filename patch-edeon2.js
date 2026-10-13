const fs=require('fs');let s=fs.readFileSync('index.html','utf8');
const a="S.mode='local';skin();newGame();";
if(s.split(a).length-1!==1||s.includes('edeonCss2')){console.log('ANCHOR XATO yoki allaqachon bor');process.exit(1)}
s=s.replace(a,()=>fs.readFileSync('edeon2.part','utf8').replace(/\n/g,'')+a);
fs.writeFileSync('index.html',s);console.log('PATCH_OK');
