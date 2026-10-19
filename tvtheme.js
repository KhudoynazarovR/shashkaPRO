;(function(){
  if (window.__tvTheme) return; window.__tvTheme = 1;
  var BG = '#2b2927', CARD = '#363431', DEEP = '#262421', BTN = '#3f3c39', LINE = '#45423e',
      SH = '0 3px 0 #1f1d1b', TX = '#ffffff', MU = '#bababa', GR = '#81b64c', GRS = '0 4px 0 #45753c';
  var O = 'html body #lbPanel.lbTMode ', I = 'html body #tvP ';
  var css =
  // ---------- tashqari: turnirlar ro'yxati va yaratish formasi ----------
  O.trim() + '{background:' + BG + '!important}' +
  O + 'h2{color:' + TX + '!important;text-shadow:none!important}' +
  O + '#lbT>.card,' + O + '#lbTs .card,' + O + '.lbhb,' + O + '#lbHero>div>div{background:' + CARD + '!important;border:0!important;box-shadow:' + SH + '!important;border-radius:14px!important}' +
  O + '#lbT .muted,' + O + '#lbTs .muted{color:' + MU + '!important}' +
  O + '#lbT input:not([type=checkbox]),' + O + '#lbT select{background-color:' + DEEP + '!important;color:' + TX + '!important;border:1px solid ' + LINE + '!important;box-shadow:none!important}' +
  O + '#lbT select{background-image:url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path d=\'M6 9l6 6 6-6\' stroke=\'%23bababa\' stroke-width=\'2.5\' fill=\'none\' stroke-linecap=\'round\'/></svg>")!important}' +
  O + '#lbT input:focus,' + O + '#lbT select:focus{border-color:' + GR + '!important;box-shadow:0 0 0 2px rgba(129,182,76,.25)!important}' +
  O + '#lbTCreate,' + O + '.tvCJ{background:' + GR + '!important;color:#fff!important;border:0!important;box-shadow:' + GRS + '!important}' +
  O + '.sec,' + O + '.tvCE,' + O + '#lbTbar button{background:' + BTN + '!important;color:' + TX + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  O + '#lbTbar button.on,' + O + '#lbTbar button.act,' + O + '#lbTbar button.active{background:' + GR + '!important;box-shadow:' + GRS + '!important}' +
  O + '.tvCL{background:#b33430!important;color:#fff!important;border:0!important;box-shadow:0 4px 0 #7a201d!important}' +
  O + '#lbTclS,' + O + '#lbTinfo{background:' + DEEP + '!important;border:1px solid ' + LINE + '!important;color:' + MU + '!important}' +
  O + '#lbTbzr label{color:' + TX + '!important}' +
  O + '#lbTbzr,' + O + '#lbTpzc{border-bottom-color:' + LINE + '!important}' +
  O + '#lbTpzc{color:' + MU + '!important}' +
  O + 'input[type=checkbox]{accent-color:' + GR + '!important}' +
  O + '#tvClubBtn.on{box-shadow:inset 0 0 0 2px ' + GR + '!important}' +
  // ---------- ichkari: turnir sahifasi ----------
  I.trim() + '{background:' + BG + '!important;color:' + TX + '!important}' +
  I + '.tvHead{background:' + DEEP + '!important;border-bottom:1px solid ' + BTN + '!important}' +
  I + '.tvIc{background:' + BTN + '!important;color:' + TX + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  I + '.tvTit b{color:' + TX + '!important}' +
  I + '.tvTit small,' + I + '.tvSh span,' + I + '.tvSh i,' + I + '.tvEmpty,' + I + '.tvTb th{color:' + MU + '!important}' +
  I + '.tvChip{background:' + BTN + '!important;border:0!important;color:#e8e6e3!important}' +
  I + '.tvSec:not(#tvPodium){background:' + CARD + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  I + '.tvTb th{border-bottom-color:' + LINE + '!important}' +
  I + '.tvTb td{border-bottom-color:' + BTN + '!important}' +
  I + '.tvTb tr.me td{background:rgba(129,182,76,.16)!important}' +
  I + '.tvTb .sc{color:' + TX + '!important}' +
  I + '.tvM{background:' + DEEP + '!important;border:0!important}' +
  I + '.tvM b{color:' + GR + '!important}' +
  I + '.tvM.me{background:#4e7a32!important;border:0!important}' +
  I + '.tvM.me b{color:#e3f2d4!important}' +
  I + '.tvIn input{background:' + DEEP + '!important;color:' + TX + '!important;border:1px solid ' + LINE + '!important}' +
  I + '.tvIn button,' + I + '.tvJ,' + I + '.tvS{background:' + GR + '!important;color:#fff!important;box-shadow:' + GRS + '!important}' +
  I + '.tvL{background:#b33430!important;box-shadow:0 4px 0 #7a201d!important}' +
  I + '.tvD{background:' + BTN + '!important;color:' + MU + '!important}' +
  I + '.tvG{background:' + DEEP + '!important;border:0!important}' +
  I + '.tvG button{background:' + BTN + '!important;color:' + TX + '!important;border:0!important;box-shadow:' + SH + '!important}' +
  I + '.tvFoot{background:linear-gradient(180deg,transparent,' + BG + ' 35%)!important}' +
  I + '#tvChatSheet{background:' + CARD + '!important;border-top:0!important}' +
  I + '#tvChatSheet .shX{color:' + MU + '!important}' +
  'html body #tvRem{background:' + CARD + '!important;border:0!important;box-shadow:0 10px 30px rgba(0,0,0,.6)!important}' +
  'html body #tvRem .rT{color:' + GR + '!important}' +
  'html body #tvRem .rI,html body #tvRem .rX{color:' + MU + '!important}' +
  'html body #tvRem .rJ{background:' + GR + '!important;box-shadow:' + GRS + '!important}' +
  'html body #tvRem .rL{background:' + BTN + '!important;color:' + TX + '!important}';
  var st = document.createElement('style'); st.id = 'tvThemeCss'; st.textContent = css;
  (document.body || document.head).appendChild(st);
})();
