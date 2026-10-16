(function(){
  var ctx=null;
  function ac(){try{if(!ctx){var C=window.AudioContext||window.webkitAudioContext;if(C)ctx=new C()}if(ctx&&ctx.state==='suspended')ctx.resume()}catch(e){}return ctx}
  function tik(){
    try{if(typeof S!=='undefined'&&S&&S.snd===false)return}catch(e){}
    var c=ac();if(!c)return;
    var o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
    o.type='sine';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(500,t+0.06);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.18,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+0.09);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+0.1);
    try{var H=window.Telegram&&Telegram.WebApp&&Telegram.WebApp.HapticFeedback;if(H)H.impactOccurred('light')}catch(e){}
  }
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest&&e.target.closest('button,a,select,summary,[onclick],[role=button],[data-t],.card,.tab-btn,.nav-item');
    if(!el||el.closest('#board')||el.disabled)return;
    tik();
  },true);
})();
