'use strict';

/*
 * ShashkaPRO — Durang qoidalari (IDF shashka-64, 16.12.2016, 8.2.3 - 8.2.25)
 *
 * russian-rules.js bilan bir xil doska formati:
 *   board[r][c] = null | 'w' | 'W' | 'b' | 'B'
 *   r = 7 -> 1-gorizontal (oq uyi), r = 0 -> 8-gorizontal
 *   a1 = board[7][0], h8 = board[0][7]
 *
 * Holat (state) oddiy JSON obyekt, uni roomga saqlash mumkin.
 *
 * Ishlatish (server tomonda, har bir yurishdan keyin):
 *   const D = require('./draw-rules');
 *   room.draw = D.createDrawState(boardBoshlangich, 'white');
 *   ...
 *   const res = D.updateDraw(room.draw, boardOldin, move, mover, boardKeyin);
 *   res.draw   -> true bo'lsa partiya durang
 *   res.reason -> sabab matni
 *   res.info   -> { text:'3/5', ... } doska tepasida ko'rsatish uchun yoki null
 */

const WHITE = 'white';
const BLACK = 'black';

const other = s => (s === WHITE ? BLACK : WHITE);
const colorOf = p => (!p ? null : (p.toLowerCase() === 'w' ? WHITE : BLACK));
const isKing = p => p === 'W' || p === 'B';

const FILES = 'ABCDEFGH';
const sqName = (r, c) => FILES[c] + (8 - r);

// Katta yo'l a1-h8: r + c = 7
const onMain = o => o.r + o.c === 7;
// Dvoynik: b1-h7 (r+c=8) va a2-g8 (r+c=6)
const onDouble = o => o.r + o.c === 6 || o.r + o.c === 8;
// Katta yo'lning o'ng tomoni (h1 burchak tomoni)
const rightOfMain = o => o.r + o.c > 7;

/*
 * Doskani "kuchli tomon" (S) nuqtai nazaridan, oq sifatida qaytaradi.
 * S qora bo'lsa doska 180 gradusga buriladi, shunda PDF dagi
 * "oqlar uchun" yozuvlari har ikki tomonga to'g'ri keladi.
 */
function canon(board, S) {
  const flip = S === BLACK;
  const res = { oK: [], oM: [], eK: [], eM: [] };
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const rr = flip ? 7 - r : r;
      const cc = flip ? 7 - c : c;
      const o = { r: rr, c: cc, n: sqName(rr, cc) };
      const mine = colorOf(p) === S;
      if (mine) (isKing(p) ? res.oK : res.oM).push(o);
      else (isKing(p) ? res.eK : res.eM).push(o);
    }
  }
  return res;
}

function sameSet(list, names) {
  const a = list.map(o => o.n).sort().join(',');
  const b = names.slice().sort().join(',');
  return a === b;
}

// Kuchli tomonda (kamdor, shashka) juftliklaridan biri bormi
function mm(c, pairs) {
  return pairs.some(([k, m]) => c.oK.length === k && c.oM.length === m);
}

const lone = c => c.eK.length === 1 && c.eM.length === 0; // raqibda faqat 1 damka

/*
 * Qoidalar. test(c) true bo'lsa, qoida hozirgi pozitsiyada amal qiladi.
 * limit = kuchli tomonning yurishlari soni.
 */
const RULES = [
  // ---- 5 yurish ----
  { id: '8.2.4', limit: 5, test: c => lone(c) && onMain(c.eK[0]) && mm(c, [[3, 0], [2, 1], [1, 2]]) },
  { id: '8.2.5', limit: 5, test: c => lone(c) && mm(c, [[2, 0], [1, 1], [1, 0]]) },
  { id: '8.2.6', limit: 5, test: c => c.eK.length === 2 && c.eM.length === 0 && mm(c, [[3, 0], [2, 1], [1, 2]]) },
  {
    id: '8.2.7', limit: 5,
    test: c => c.eK.length === 2 && c.eM.length === 0 && mm(c, [[4, 0]]) &&
      (c.eK.some(onMain) || c.eK.every(onDouble))
  },
  {
    id: '8.2.9', limit: 5,
    test: c => c.oK.length === 1 && sameSet(c.oM, ['G5', 'H4', 'H6']) && lone(c) && onMain(c.eK[0])
  },
  {
    id: '8.2.10', limit: 5,
    test: c => c.oK.length === 2 && c.oK.some(onMain) && sameSet(c.oM, ['A7']) &&
      c.eK.length === 1 && sameSet(c.eM, ['B8'])
  },
  {
    id: '8.2.11', limit: 5,
    test: c => c.oK.length === 2 && c.oK.some(onMain) && sameSet(c.oM, ['G1']) &&
      c.eK.length === 1 && sameSet(c.eM, ['H2'])
  },
  {
    id: '8.2.12', limit: 5,
    test: c => c.oK.length === 2 && c.oK.some(onMain) && sameSet(c.oM, ['H6']) &&
      c.eK.length === 1 && sameSet(c.eM, ['F8'])
  },
  {
    id: '8.2.13', limit: 5,
    test: c => c.oK.length === 1 && c.oM.length === 3 &&
      c.oM.some(o => o.n === 'H6') &&
      c.oM.filter(o => o.n !== 'H6').every(rightOfMain) &&
      c.eK.length === 1 && onMain(c.eK[0]) && sameSet(c.eM, ['F8'])
  },

  // ---- 15 yurish ----
  { id: '8.2.15', limit: 15, test: c => c.oK.length >= 3 && c.oM.length === 0 && lone(c) },
  {
    id: '8.2.16', limit: 15,
    test: c => c.oK.length === 3 && c.oM.length === 0 && c.eK.length === 1 && sameSet(c.eM, ['H2'])
  },
  {
    id: '8.2.17', limit: 15,
    test: c => c.oK.length === 2 && sameSet(c.oM, ['A1']) && c.eK.length === 1 && sameSet(c.eM, ['A3'])
  },

  // ---- 30 yurish (kuchli tomon katta yo'lda damkaga ega) ----
  ...[
    ['8.2.18', ['C1'], ['A3', 'A5']],
    ['8.2.19', ['C1'], ['A3', 'H6']],
    ['8.2.20', ['C1'], ['A3', 'H4']],
    ['8.2.21', ['C1'], ['A3', 'F8']],
    ['8.2.22', ['E1'], ['A3', 'A5']],
    ['8.2.23', ['G1'], ['A3', 'A5']]
  ].map(([id, own, opp]) => ({
    id, limit: 30,
    test: c => c.oK.length === 2 && c.oK.some(onMain) && sameSet(c.oM, own) &&
      c.eK.length === 1 && sameSet(c.eM, opp)
  })),
  {
    id: '8.2.24', limit: 30,
    test: c => c.oK.length === 4 && c.oM.length === 0 && c.eK.length === 2 && c.eM.length === 0 &&
      c.oK.some(onMain) && c.oK.some(onDouble)
  }
];

function counts(board) {
  const n = { wK: 0, wM: 0, bK: 0, bM: 0 };
  for (const row of board) {
    for (const p of row) {
      if (p === 'w') n.wM++;
      else if (p === 'W') n.wK++;
      else if (p === 'b') n.bM++;
      else if (p === 'B') n.bK++;
    }
  }
  return n;
}

function posKey(board, side) {
  let s = side + '|';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) s += board[r][c] || '.';
  }
  return s;
}

function createDrawState(board, sideToMove) {
  const st = {
    rep: {},          // pozitsiya takrori (8.2.3)
    rc: {},           // "qoida|tomon" -> { used }
    kingOnly: 0,      // faqat damka yurishlari (yarim yurish, ply) 8.2.14
    sig: null,        // kuchlar nisbati
    sigPlies: 0,      // nisbat o'zgarmagan yarim yurishlar 8.2.25
    ply: 0,
    moves: { white: 0, black: 0 },
    info: null,
    result: null
  };
  st.rep[posKey(board, sideToMove || WHITE)] = 1;
  const n = counts(board);
  st.sig = [n.wK, n.wM, n.bK, n.bM].join('');
  // Boshlang'ich pozitsiyada amal qiladigan qoidalar sanog'i 0 dan boshlanadi
  for (const S of [WHITE, BLACK]) {
    const c = canon(board, S);
    for (const rule of RULES) {
      if (rule.test(c)) st.rc[rule.id + '|' + S] = { used: 0 };
    }
  }
  return st;
}

/*
 * Har bir yurishdan keyin chaqiriladi.
 *   board0 - yurishdan oldingi doska
 *   move   - { from:[r,c], to:[r,c], captures:[...] }
 *   mover  - 'white' | 'black'
 *   board1 - yurishdan keyingi doska
 */
function updateDraw(st, board0, move, mover, board1) {
  st.ply++;
  st.moves[mover]++;

  const capture = (move.captures || []).length > 0;
  const piece0 = board0[move.from[0]][move.from[1]];
  const wasKing = isKing(piece0);

  // --- 8.2.3: pozitsiya 3 marta takrorlansa ---
  const next = other(mover);
  const key = posKey(board1, next);
  st.rep[key] = (st.rep[key] || 0) + 1;
  if (st.rep[key] >= 3) {
    return finish(st, 'Durang: pozitsiya 3 marta takrorlandi (8.2.3)', '8.2.3');
  }

  // --- 8.2.14: faqat damka yurishlari ---
  if (wasKing && !capture) st.kingOnly++;
  else st.kingOnly = 0;

  // --- 8.2.25: kuchlar nisbati o'zgarmaganda ---
  const n = counts(board1);
  const sig = [n.wK, n.wM, n.bK, n.bM].join('');
  if (sig !== st.sig) {
    st.sig = sig;
    st.sigPlies = 0;
  } else {
    st.sigPlies++;
  }

  // --- kuchli tomon sanog'i (8.2.4 - 8.2.24) ---
  const newRc = {};
  const infos = [];
  for (const S of [WHITE, BLACK]) {
    const c = canon(board1, S);
    for (const rule of RULES) {
      if (!rule.test(c)) continue;
      const k = rule.id + '|' + S;
      const prev = st.rc[k];
      let used = prev ? prev.used : 0;
      if (prev && mover === S) used++;
      newRc[k] = { used };
      infos.push({ rule: rule.id, side: S, used, limit: rule.limit });
    }
  }
  st.rc = newRc;

  for (const i of infos) {
    if (i.used >= i.limit) {
      return finish(
        st,
        'Durang: ' + i.limit + ' yurishda g\u2018alaba qozonilmadi (' + i.rule + ')',
        i.rule
      );
    }
  }

  // --- 8.2.14: 15 yurish (har tomondan) faqat damkalar ---
  const koMoves = Math.floor(st.kingOnly / 2);
  if (st.kingOnly >= 30) {
    return finish(st, 'Durang: 15 yurish faqat damkalar bilan o\u2018ynaldi (8.2.14)', '8.2.14');
  }
  if (koMoves >= 1) infos.push({ rule: '8.2.14', side: null, used: koMoves, limit: 15 });

  // --- 8.2.25 ---
  const total = n.wK + n.wM + n.bK + n.bM;
  if (n.wK > 0 && n.bK > 0 && total >= 4 && total <= 7) {
    const lim = total <= 5 ? 30 : 40;
    if (st.sigPlies >= lim * 2) {
      return finish(
        st,
        'Durang: ' + lim + ' yurishda kuchlar nisbati o\u2018zgarmadi (8.2.25)',
        '8.2.25'
      );
    }
    const used = Math.floor(st.sigPlies / 2);
    if (used >= 1) infos.push({ rule: '8.2.25', side: null, used, limit: lim });
  }

  // doska tepasida ko'rsatiladigan sanoq: tugashiga eng yaqini
  let best = null;
  for (const i of infos) {
    const left = i.limit - i.used;
    if (!best || left < best.limit - best.used) best = i;
  }
  st.info = best
    ? {
        text: best.used + '/' + best.limit,
        used: best.used,
        limit: best.limit,
        rule: best.rule,
        side: best.side,
        label: 'Durang sanog\u2018i ' + best.used + '/' + best.limit
      }
    : null;

  return { draw: false, reason: null, rule: null, info: st.info, repeat: st.rep[key] };
}

function finish(st, reason, rule) {
  st.result = { reason, rule };
  st.info = null;
  return { draw: true, reason, rule, info: null };
}

function drawInfo(st) {
  return st ? st.info : null;
}

/* 9.2: har tomondan kamida 20 yurish bo'lgach durang taklif qilish mumkin */
function canOfferDraw(st) {
  return !!st && st.moves.white >= 20 && st.moves.black >= 20;
}

function material(board, side) {
  let v = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p || colorOf(p) !== side) continue;
      v += isKing(p) ? 3 : 1;
    }
  }
  return v;
}

/*
 * Bot durang taklifiga javobi.
 * Bot teng yoki yomon turganda yoki sanoq ketayotgan bo'lsa qabul qiladi.
 */
function botAcceptsDraw(board, botSide, st) {
  if (!canOfferDraw(st)) return false;
  const diff = material(board, botSide) - material(board, other(botSide));
  if (diff <= 1) return true;
  const info = st.info;
  if (info && info.limit - info.used <= 2 && diff <= 3) return true;
  return false;
}

module.exports = {
  WHITE,
  BLACK,
  RULES,
  createDrawState,
  updateDraw,
  drawInfo,
  canOfferDraw,
  botAcceptsDraw,
  _canon: canon
};
