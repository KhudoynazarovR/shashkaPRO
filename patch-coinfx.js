const fs = require('fs');
let S = fs.readFileSync('rooms.js', 'utf8');
let C = fs.readFileSync('roomclient.js', 'utf8');
const n = (t, x) => t.split(x).length - 1;
const s1 = "eco.add(human, coins, 'bot_win');";
const c1 = '} else if (m.type === "roomFinished" && m.roomId === roomId) {';
if (n(S, s1) !== 1 || n(C, c1) !== 1 || C.includes('__coinFx')) { console.log('XATO yoki allaqachon qollangan'); process.exit(1); }
S = S.replace(s1, s1 + "\n    broadcast(room, { type: 'botCoins', roomId: room.id, n: coins });");
C = C.replace(c1, '} else if (m.type === "botCoins" && m.roomId === roomId) { try { window.__coinFx(m.n); } catch (e) {}\n      ' + c1);
const fx = `;(function(){
  var A=null;
  function ac(){ if(!A) A=new (window.AudioContext||window.webkitAudioContext)(); if(A.state==='suspended') A.resume(); return A; }
  function tone(f,t,d,g){ var a=ac(),o=a.createOscillator(),v=a.createGain(),t0=a.currentTime+t;
    o.type='sine'; o.frequency.setValueAtTime(f,t0);
    v.gain.setValueAtTime(0.0001,t0); v.gain.exponentialRampToValueAtTime(g,t0+0.01); v.gain.exponentialRampToValueAtTime(0.0001,t0+d);
    o.connect(v); v.connect(a.destination); o.start(t0); o.stop(t0+d+0.05); }
  function snd(){ tone(987.77,0,0.18,0.35); tone(1318.5,0.12,0.45,0.35); tone(1975.5,0.12,0.45,0.12); }
  window.__coinFx=function(k){
    try{ snd(); }catch(e){}
    if(!document.getElementById('coinFxCss')){
      var st=document.createElement('style'); st.id='coinFxCss';
      st.textContent='@keyframes coinFxUp{0%{opacity:0;transform:translate(-50%,0) scale(.6)}15%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}70%{opacity:1;transform:translate(-50%,-40px) scale(1)}100%{opacity:0;transform:translate(-50%,-70px) scale(1)}}';
      document.head.appendChild(st);
    }
    var d=document.createElement('div');
    d.textContent='+'+k+' \\uD83E\\uDE99';
    d.style.cssText='position:fixed;left:50%;top:45%;z-index:99999;pointer-events:none;font-size:44px;font-weight:800;color:#ffd54a;text-shadow:0 2px 10px #000,0 0 18px #f5a300;animation:coinFxUp 2.2s ease-out forwards';
    document.body.appendChild(d); setTimeout(function(){ try{ d.remove(); }catch(e){} },2300);
  };
})();
`;
fs.writeFileSync('rooms.js', S);
fs.writeFileSync('roomclient.js', fx + C);
console.log('OK');
