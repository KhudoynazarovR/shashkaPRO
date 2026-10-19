const fs = require('fs');
let C = fs.readFileSync('roomclient.js', 'utf8');
const n = (t, x) => t.split(x).length - 1;
const a1 = "@keyframes coinFxUp{";
const a2 = "animation:coinFxUp 2.2s ease-out forwards";
const a3 = "document.body.appendChild(d); setTimeout(function(){ try{ d.remove(); }catch(e){} },2300);";
const a4 = "window.__coinFx=function(k){";
const a5 = "top:45%";
const a6 = 'if (m.type === "roomState" && m.roomId === roomId) {';
if ([a1,a2,a3,a4,a5,a6].some(x => n(C, x) !== 1) || C.includes('__coinClear')) { console.log('XATO yoki allaqachon qollangan'); process.exit(1); }
C = C.replace(a1, "@keyframes coinFxIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}" + a1);
C = C.replace(a2, "animation:coinFxIn .6s ease-out forwards");
C = C.replace(a3, "window.__coinClear(); d.id='coinFxEl'; document.body.appendChild(d); setTimeout(function(){ try{ if(d.parentNode) d.remove(); }catch(e){} },600000);");
C = C.replace(a4, "window.__coinClear=function(){ var e=document.getElementById('coinFxEl'); if(e) e.remove(); };\n  " + a4);
C = C.replace(a5, "top:48%");
C = C.replace(a6, 'if (m.type === "roomState" && m.roomId === roomId && !m.finished) { try { window.__coinClear(); } catch (e) {} }\n      ' + a6);
fs.writeFileSync('roomclient.js', C);
console.log('OK');
