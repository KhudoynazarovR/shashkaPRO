'use strict';
const store=require('./store'), R=require('./kkrules');
function db(){return store.db.dragonWorkshop ||= {samples:[],games:[],lessons:{},enabled:false};}
function key(b,s,p){return b.join(',')+'|'+s+'|'+p;}
function record(j,r){if(j.workshop||!r||r.error||!Number.isInteger(r.from))return;const x=db();x.samples.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),b:j.board.slice(),s:j.side>0?1:-1,p:j.damkaPlies,from:r.from,to:r.to,tb:r.tb||null,ms:r.ms,at:Date.now()});if(x.samples.length>500)x.samples.shift();store.save();}
function game(g){const x=db();x.games.unshift(g);const stats=x.matchTotals||={games:0,wins:0,draws:0,losses:0};stats.games++;if(g.result==='draw')stats.draws++;else if(g.result==='Dragon')stats.wins++;else if(g.white==='Dragon'||g.black==='Dragon')stats.losses++;
if(Array.isArray(g.history)){for(let i=1;i<g.history.length;i++){const prev=g.history[i-1],m=g.history[i];if((prev.side===1?g.white:g.black)!=='Dragon')continue;if(R.moves(prev.board,prev.side).length<2)continue;x.samples.push({id:g.at+'-match-'+i,b:prev.board.slice(),s:prev.side,from:m.from,to:m.to,at:g.at,source:'match',ply:i});}if(x.samples.length>500)x.samples=x.samples.slice(-500);}
store.save();}
function legal(b,s,r){return R.moves(b,s).filter(m=>m.from===r.from&&m.to===r.to).length===1;}
function pick(j){const x=db();if(!x.enabled||j.workshop||!Number.isInteger(j.damkaPlies))return null;const r=x.lessons[key(j.board,j.side>0?1:-1,j.damkaPlies)];return r&&legal(j.board,j.side>0?1:-1,r)?r:null;}
module.exports={db,key,record,game,legal,pick};
