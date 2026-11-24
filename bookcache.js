const fs=require('fs'),path=require('path');let B=null;
module.exports={get(){if(!B){try{B=JSON.parse(fs.readFileSync(path.join(__dirname,'book.json'),'utf8'))}catch(e){B={}}}return B}};
