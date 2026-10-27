/* memcore.js — 🧠 Xotira o'yini qoidalari (brauzer va server uchun bir xil).
   Qoidalar (rules):
     streak  — ketma-ket 3 ta juftlik topilsa +1 bonus ochko
     shuffle — har 5 ta xato urinishdan keyin 2 ta yopiq karta joyini almashtiradi
     black   — 💀 "qora karta" juftligi: topgan raqibdan 1 ochko oladi
   Tezkor rejim (umumiy vaqt) chaqiruvchi tomonda boshqariladi. */
(function (root) {
  var BLACK = '💀';
  function rnd(n, R) { return Math.floor((R || Math.random)() * n); }
  function shuffle(a, R) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1, R), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function newGame(o) {
    var R = o.rnd, rules = o.rules || {};
    var syms = shuffle(o.symbols.filter(function (s) { return s !== BLACK; }).slice(), R).slice(0, o.pairs);
    if (rules.black && syms.length) syms[0] = BLACK;
    return { deck: shuffle(syms.concat(syms), R), done: {}, up: [], sc: [0, 0], turn: o.first != null ? o.first : rnd(2, R), streak: 0, att: 0, rules: rules, over: false, R: R };
  }
  // karta ochish. Qaytaradi: null (mumkin emas) | { open: i } | { match: true, ev: [...] } | { match: false }
  function flip(S, i) {
    if (S.over || S.done[i] || S.up.indexOf(i) >= 0 || S.up.length >= 2 || !(i >= 0 && i < S.deck.length)) return null;
    S.up.push(i);
    if (S.up.length < 2) return { open: i };
    var a = S.up[0], b = S.up[1], me = S.turn, op = 1 - me;
    if (S.deck[a] !== S.deck[b]) return { match: false };
    var ev = [];
    S.done[a] = S.done[b] = me + 1; S.up = []; S.streak++;
    if (S.deck[a] === BLACK) { if (S.sc[op] > 0) { S.sc[op]--; ev.push('steal'); } else ev.push('black'); S.sc[me]++; }
    else S.sc[me]++;
    if (S.rules.streak && S.streak > 0 && S.streak % 3 === 0) { S.sc[me]++; ev.push('bonus'); }
    if (Object.keys(S.done).length >= S.deck.length) S.over = true;
    return { match: true, ev: ev };
  }
  // xato juftlikdan keyin navbat almashadi. Aralashtirish bo'lsa — almashgan kataklar qaytadi
  function endTurn(S) {
    S.up = []; S.turn = 1 - S.turn; S.streak = 0; S.att++;
    if (S.rules.shuffle && S.att % 5 === 0) {
      var closed = []; for (var i = 0; i < S.deck.length; i++) if (!S.done[i]) closed.push(i);
      if (closed.length >= 4) {
        var x = closed[rnd(closed.length, S.R)], y; do { y = closed[rnd(closed.length, S.R)]; } while (y === x || S.deck[y] === S.deck[x]);
        var t = S.deck[x]; S.deck[x] = S.deck[y]; S.deck[y] = t;
        return { shuffled: [x, y] };
      }
    }
    return {};
  }
  function timeout(S) { S.up = []; S.turn = 1 - S.turn; S.streak = 0; }
  function winner(S) { return S.sc[0] === S.sc[1] ? -1 : S.sc[0] > S.sc[1] ? 0 : 1; }
  var API = { BLACK: BLACK, newGame: newGame, flip: flip, endTurn: endTurn, timeout: timeout, winner: winner, shuffle: shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MemCore = API;
})(this);
