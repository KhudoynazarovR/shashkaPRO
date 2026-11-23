const fs=require('fs');
fs.writeFileSync('bookcache.js',"const fs=require('fs'),path=require('path');let B=null;\nmodule.exports={get(){if(!B){try{B=JSON.parse(fs.readFileSync(path.join(__dirname,'book.json'),'utf8'))}catch(e){B={}}}return B}};\n");
const J="JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'book.json'), 'utf8'))";
const R=[
 ['kestoai.js','JSON.parse(fs.readFileSync(path.join(__dirname, "book.json"), "utf8"))'],
 ['gifopen.js','JSON.parse(fs.readFileSync(__dirname + "/book.json", "utf8"))'],
 ['kkrep.js',J],['posdb.js',J]];
for(const [f,a] of R){
  let s=fs.readFileSync(f,'utf8'); const n=s.split(a).length-1;
  if(!n){console.log('TOPILMADI',f);continue;}
  fs.copyFileSync(f,f+'.before-bookshare');
  fs.writeFileSync(f,s.split(a).join("require('./bookcache.js').get()"));
  console.log(f,n,'ta almashtirildi');
}
