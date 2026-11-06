const fs=require('fs');
function load(f){return fs.readFileSync(f,'utf8')}
function rep(o,a,b){
  const n=o.s.split(a).length-1;
  if(n!==1){console.log('XATO ('+n+' ta):',a.slice(0,60));process.exit(1)}
  o.s=o.s.replace(a,()=>b);
}
// ---- SERVER ----
const S={s:load('xochroom.js')};
rep(S,"host: 0, cur: [] };","host: 0, cur: [], tms: [10, 30, 60].includes(+m.turn) ? +m.turn * 1000 : TURN_MS };");
rep(S,"r.deadline = Date.now() + TURN_MS;","r.deadline = Date.now() + (r.tms || TURN_MS);");
rep(S,"auto(r, true), TURN_MS + 200);","auto(r, true), (r.tms || TURN_MS) + 200);");
rep(S,"turn: r.turn, alive: r.alive, last: r.last, rank: r.rank || null,","turn: r.turn, alive: r.alive, last: r.last, rank: r.rank || null, tms: r.tms || TURN_MS,");
rep(S,"  if (m.type === 'xcState') { send(ws, view(r, c.id)); return true; }",
`  if (m.type === 'xcTime') { const t = +m.turn; if (idx === r.host && r.status === 'wait' && [10, 30, 60].includes(t)) { r.tms = t * 1000; push(r); } return true; }
  if (m.type === 'xcChat') {
    const s = r.p[idx]; if (!s || idx < 0) return true;
    const now = Date.now(); if (s.cat && now - s.cat < 700) return true; s.cat = now;
    const e = String(m.e || '').slice(0, 8), t = String(m.t || '').slice(0, 40);
    if (!e && !t) return true;
    r.p.forEach(x => { if (x && x.ws) send(x.ws, { type: 'xcChat', from: idx, e, t }); });
    return true;
  }
  if (m.type === 'xcState') { send(ws, view(r, c.id)); return true; }`);
fs.writeFileSync('xochroom.js',S.s);
// ---- KLIENT ----
const H={s:load('xoch.html')};
if(!H.s.includes('function card(i,P,live)')){console.log('XATO: avval patch_local.js ni bajaring');process.exit(1)}
rep(H,"let ME=2,ON=false,","var BUB={},TS=30;let ME=2,ON=false,");
rep(H,"</style>",`#bx{display:flex;flex-direction:column;gap:8px;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:12px}
#bx .row{display:flex;gap:8px}
#bx input{flex:1;width:auto;min-width:0}
.seg{display:flex;gap:6px}
.seg button{flex:1;background:var(--card);color:var(--fg);border:1px solid var(--bd);padding:9px 4px}
.seg button.on{background:var(--fg);color:var(--bg)}
.chat{display:flex;gap:6px;overflow-x:auto;margin:0 0 12px;padding-bottom:2px}
.chat button{flex:none;background:var(--card);color:var(--fg);border:1px solid var(--bd);border-radius:16px;padding:6px 10px;font-size:15px}
.pcd{position:relative}
.bub{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tm.low{color:#c8402f}
</style>`);
rep(H,'<div class="ch" id="bx"><button id="b1">Onlayn: 4 kishi</button><input id="ci" placeholder="Xona kodi" maxlength="6" autocapitalize="characters"><button id="b2">Kirish</button></div>',
'<div id="bx"><b>👥 Do\'stlar bilan o\'ynash</b><div class="sub">Yurish vaqti:</div><div class="seg" id="tsel"><button data-t="10">⚡ 10 s</button><button data-t="30">⏱ 30 s</button><button data-t="60">🐢 60 s</button></div><button id="b1">Xona yaratish</button><div class="row"><input id="ci" placeholder="Xona kodi" maxlength="6" autocapitalize="characters"><button id="b2">Kirish</button></div><div class="sub">Xona yaratgach kodni do\'stlarga yuboring. Kirmagan o\'rinlarni botlar to\'ldiradi.</div></div>');
rep(H,'<div class="ch" style="margin:0"><button id="o1">','<div class="seg" id="tsel2" style="display:none"><button data-t="10">⚡ 10 s</button><button data-t="30">⏱ 30 s</button><button data-t="60">🐢 60 s</button></div><div class="ch" style="margin:0"><button id="o1">');
rep(H,'<div class="pc" id="pc2"></div>','<div class="pc" id="pc2"></div><div class="chat" id="cb"></div>');
rep(H,'else if(m.type=="xcError")alert(m.message);','else if(m.type=="xcChat")bub(m.from,m.e,m.t);else if(m.type=="xcError")alert(m.message);');
rep(H,'xs({type:"xcCreate",init:initData()})','xs({type:"xcCreate",init:initData(),turn:TS})');
rep(H,'document.getElementById("oc").textContent="Xona: "+s.code;','document.getElementById("oc").textContent="Xona: "+s.code+" · ⏱ "+(s.tms/1000)+" s";');
rep(H,'document.getElementById("o3").textContent=s.status=="done"?"Yopish":"Chiqish";','document.getElementById("o3").textContent=s.status=="done"?"Yopish":"Chiqish";chips();document.getElementById("tsel2").style.display=(s.status=="wait"&&s.host)?"flex":"none";');
const re=/function card\(i,P,live\)\{[\s\S]*?\n\}\n/;
if(!re.test(H.s)){console.log('XATO: card() topilmadi');process.exit(1)}
const NEW=`function card(i,P,live){
  var p=P[i],act=live&&turn==i&&alive[i];
  var l=act&&T0?Math.max(0,Math.ceil((T0-Date.now())/1000)):null;
  var bb=BUB[i]&&BUB[i].u>Date.now()?BUB[i]:null;
  var av=p&&p.photo?'<img src="'+esc(p.photo)+'" alt="">':'<b>'+(p?esc((p.name.trim()[0]||"?")):"…")+'</b>';
  var tm=bb?'<div class="tm bub">'+esc(bb.e)+(bb.t?' '+esc(bb.t):'')+'</div>':'<div class="tm'+(l!=null&&l<=5?' low':'')+'">'+(l!=null?l+" s":"")+'</div>';
  return '<div class="pcd'+(act?' act':'')+(p&&!alive[i]?' off':'')+'" style="--c:'+COL[i]+'"><div class="av">'+av+'</div><div class="in"><div class="nm">'+(p?esc(p.name):"Kutilmoqda…")+'</div>'+tm+'</div></div>';
}
function bub(i,e,t){BUB[i]={e:e||"",t:t||"",u:Date.now()+3000};cards();setTimeout(cards,3100)}
function say(e,t){
  if(ON){xs({type:"xcChat",e:e,t:t});return}
  bub(2,e,t);
  if(Math.random()<.6)setTimeout(function(){var R=["😂","😎","🤔","👏","🔥"];bub([0,1,3][Math.floor(Math.random()*3)],R[Math.floor(Math.random()*R.length)],"")},900+Math.random()*800);
}
function chips(){
  var cur=ON&&ST?ST.tms/1000:TS;
  [].forEach.call(document.querySelectorAll(".seg"),function(g){[].forEach.call(g.children,function(b){b.className=(+b.dataset.t==cur)?"on":""})});
}
[].forEach.call(document.querySelectorAll(".seg"),function(g){g.onclick=function(e){
  var b=e.target.closest("button");if(!b)return;var t=+b.dataset.t;
  if(ON){if(ST&&ST.host&&ST.status=="wait")xs({type:"xcTime",turn:t})}else{TS=t;chips()}
}});
var CH=[["👏",""],["😂",""],["😎",""],["😡",""],["🔥",""],["⏳","Tezroq!"],["👍","Zo'r yurish!"],["🍀","Omad!"]];
document.getElementById("cb").innerHTML=CH.map(function(x,i){return '<button data-i="'+i+'">'+x[0]+(x[1]?' '+x[1]:'')+'</button>'}).join("");
document.getElementById("cb").onclick=function(e){var b=e.target.closest("button");if(!b)return;var x=CH[+b.dataset.i];say(x[0],x[1])};
chips();
`;
H.s=H.s.replace(re,()=>NEW);
fs.writeFileSync('xoch.html',H.s);
console.log('OK');
