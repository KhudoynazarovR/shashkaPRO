const fs = require('fs');
function edit(file, steps) {
  if (!fs.existsSync(file)) return console.log('YO‘Q  ', file);
  let s = fs.readFileSync(file, 'utf8');
  for (const [label, from, to, all] of steps) {
    const has = from instanceof RegExp ? from.test(s) : s.includes(from);
    if (!has) { console.log('TOPILMADI', file, '-', label); continue; }
    if (s.includes('/*ONL:' + label + '*/')) { console.log('allaqachon', label); continue; }
    s = from instanceof RegExp ? s.replace(from, () => to)
      : all ? s.split(from).join(to) : s.replace(from, () => to);
    console.log('OK       ', file, '-', label);
  }
  fs.writeFileSync(file, s);
}
const T = x => '/*ONL:' + x + '*/';

edit('server.js', [
 ['require', 'const { WebSocketServer } = require("ws");',
  'const { WebSocketServer } = require("ws");\nconst online = require("./online"); ' + T('require')],
 ['login', 'if (m.type === "register") {',
  'if (m.type === "register") { ' + T('login') + '\n      { const L = online.login(c, m); if (!L.ok) return send(ws, { type: "error", message: "Telegram orqali kiring" }); if (L.name) m.name = L.name; }'],
 ['me', 'type: "registered",', 'type: "registered",\n        me: online.pub(c.user),', true],
 ['init', 'matches.set(match.id, match);', 'online.initMatch(match);\n  matches.set(match.id, match);'],
 ['reward', 'match.finished = true;', 'match.finished = true;\n  online.reward(match, winner, clients, send);'],
 ['check', /match\.turn\s*=\s*match\.turn === "white"\s*\?\s*"black"\s*:\s*"white";/,
  'if (!online.checkMove(match, side, m.move)) return send(ws, { type: "error", message: "Noto‘g‘ri yurish" });\n      match.turn = match.turn === "white" ? "black" : "white";'],
 ['after', 'send(black?.ws, msg);',
  'send(black?.ws, msg);\n      { const w = online.winnerAfter(match); if (w) finishMatch(match, w); }'],
 ['claim', 'let winner = m.winner;',
  'let winner = online.claimWinner(match, c.id, m.winner);\n      if (!winner) return;']
]);

for (const f of ['public/index.html', 'index.html']) edit(f, [
 ['reg', "socket.send(JSON.stringify({type:'register',name}));",
  "socket.send(JSON.stringify({type:'register',name,initData:(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initData)||''}));"],
 ['me', 'onlineId=m.id;', 'onlineId=m.id;window.onlineMe=m.me||null;'],
 ['rew', "else if(m.type==='error'){toast('⚠️ '+m.message)}",
  "else if(m.type==='rewards'){window.onlineMe=m.me||window.onlineMe;toast((m.result==='win'?'🏆 ':'🏁 ')+'Elo '+(m.eloDelta>0?'+':'')+m.eloDelta+'  💎 +'+m.diamonds)}\n      else if(m.type==='error'){toast('⚠️ '+m.message)}"],
 ['tg', '</head>', '<script src="https://telegram.org/js/telegram-web-app.js"></script>\n<script>try{Telegram.WebApp.ready();Telegram.WebApp.expand()}catch(e){}</script>\n</head>']
]);
