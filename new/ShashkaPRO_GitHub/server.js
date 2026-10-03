const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const {WebSocketServer}=require("ws");
const PORT=Number(process.env.PORT||8080),HOST=process.env.HOST||"0.0.0.0";
const DATA=path.join(__dirname,"data"),DB=path.join(DATA,"db.json"),PUBLIC=path.join(__dirname,"public");
fs.mkdirSync(DATA,{recursive:true});
const seed={users:{},sessions:{},friends:{},missionProgress:{},purchases:{},matches:{},
missions:[{id:"daily-game",title:"🎮 3 ta o‘yin o‘yna",reward:25,target:3},{id:"daily-win",title:"🏆 1 ta g‘alaba qozon",reward:50,target:1},{id:"daily-capture",title:"⚔️ 5 ta dona ur",reward:35,target:5}],
shop:[{id:"board-gold",name:"👑 Gold Board",price:100,type:"board"},{id:"pieces-royal",name:"♟ Royal Donalar",price:150,type:"pieces"},{id:"frame-pro",name:"💎 PRO Ramka",price:250,type:"frame"},{id:"win-fire",name:"🔥 G‘alaba effekti",price:300,type:"effect"}],
tournaments:[{id:"daily",name:"👑 Daily Shashka",format:"5+3",status:"open",prize:100},{id:"blitz",name:"⚡ Blitz Arena",format:"3+2",status:"open",prize:200},{id:"pro",name:"🔥 PRO Cup",format:"10+0",status:"open",prize:500}]};
let db;try{db=JSON.parse(fs.readFileSync(DB,"utf8"))}catch{db=seed;save()}
function save(){fs.writeFileSync(DB,JSON.stringify(db,null,2))}
function uid(p="u"){return p+crypto.randomBytes(8).toString("hex")}
function out(res,c,d){res.writeHead(c,{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});res.end(JSON.stringify(d))}
function body(req){return new Promise((ok,no)=>{let s="";req.on("data",x=>s+=x);req.on("end",()=>{try{ok(s?JSON.parse(s):{})}catch(e){no(e)}})})}
function auth(req){let h=req.headers.authorization||"",t=h.startsWith("Bearer ")?h.slice(7):"";return db.users[db.sessions[t]]||null}
function safe(u){if(!u)return null;let{x,...r}=u;return r}
function user(req,b={}){let u=auth(req);if(u)return u;let id=uid(),t=crypto.randomBytes(24).toString("hex");u={id,username:b.username||"ShashkaPRO Player",avatar:"♟",elo:1000,xp:0,level:1,diamonds:100,wins:0,losses:0,draws:0,games:0,streak:0,bestStreak:0,inventory:[],_token:t};db.users[id]=u;db.sessions[t]=id;save();return u}
function file(req,res){let p=decodeURIComponent(new URL(req.url,"http://x").pathname);if(p==="/")p="/index.html";let f=path.normalize(path.join(PUBLIC,p));if(!f.startsWith(PUBLIC))return out(res,403,{error:"Forbidden"});fs.readFile(f,(e,d)=>{if(e)return out(res,404,{error:"Not found"});let m={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".png":"image/png",".jpg":"image/jpeg"}[path.extname(f)]||"application/octet-stream";res.writeHead(200,{"Content-Type":m});res.end(d)})}
const server=http.createServer(async(req,res)=>{
 if(req.method==="OPTIONS")return out(res,204,{});
 const p=new URL(req.url,"http://x").pathname;
 try{
  if(p==="/api/health")return out(res,200,{ok:true,service:"ShashkaPRO",time:new Date().toISOString()});
  let b=req.method==="POST"?await body(req):{},u=user(req,b);
  if(p==="/api/auth/guest"&&req.method==="POST")return out(res,200,{token:u._token,user:safe(u)});
  if(p==="/api/profile")return out(res,200,{user:safe(u)});
  if(p==="/api/leaderboard"){let a=Object.values(db.users).sort((x,y)=>y.elo-x.elo).slice(0,100).map((x,i)=>({rank:i+1,...safe(x)}));return out(res,200,{players:a})}
  if(p==="/api/missions"){let pr=db.missionProgress[u.id]||{};return out(res,200,{missions:db.missions.map(m=>({...m,progress:pr[m.id]||0,claimed:!!pr[m.id+"_claimed"]}))})}
  if(p==="/api/shop")return out(res,200,{items:db.shop,diamonds:u.diamonds,inventory:u.inventory});
  if(p==="/api/friends")return out(res,200,{friends:(db.friends[u.id]||[]).map(x=>safe(db.users[x])).filter(Boolean)});
  if(p==="/api/tournaments")return out(res,200,{tournaments:db.tournaments});
  if(p==="/api/matches"&&req.method==="POST"){let id=uid("m");db.matches[id]={id,mode:b.mode||"quick",players:[u.id],status:"waiting",createdAt:Date.now()};save();return out(res,200,{match:db.matches[id]})}
  let m=p.match(/^\/api\/missions\/([^/]+)\/claim$/);if(m&&req.method==="POST"){let x=db.missions.find(z=>z.id===m[1]),pr=db.missionProgress[u.id]||{};if(!x)return out(res,404,{error:"Mission not found"});if((pr[x.id]||0)<x.target||pr[x.id+"_claimed"])return out(res,400,{error:"Vazifa hali bajarilmagan"});pr[x.id+"_claimed"]=true;db.missionProgress[u.id]=pr;u.diamonds+=x.reward;u.xp+=50;u.level=Math.floor(u.xp/500)+1;save();return out(res,200,{user:safe(u)})}
  let q=p.match(/^\/api\/shop\/([^/]+)\/buy$/);if(q&&req.method==="POST"){let x=db.shop.find(z=>z.id===q[1]);if(!x)return out(res,404,{error:"Item not found"});if(u.diamonds<x.price)return out(res,400,{error:"Olmos yetarli emas"});if(!u.inventory.includes(x.id)){u.diamonds-=x.price;u.inventory.push(x.id);save()}return out(res,200,{user:safe(u),item:x})}
  file(req,res)
 }catch(e){console.error(e);out(res,500,{error:"Server xatosi"})}
});
const wss=new WebSocketServer({server}),peers=new Set();
wss.on("connection",ws=>{peers.add(ws);ws.send(JSON.stringify({type:"connected"}));ws.on("message",raw=>{let m;try{m=JSON.parse(raw)}catch{return}for(const p of peers)if(p!==ws&&p.readyState===1)p.send(JSON.stringify(m))});ws.on("close",()=>peers.delete(ws))});
server.listen(PORT,HOST,()=>console.log(`ShashkaPRO Server: http://0.0.0.0:${PORT}`));
