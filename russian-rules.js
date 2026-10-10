'use strict';

/*
 * ShashkaPRO — Russian Draughts Rules Engine
 * 8x8 / 12+12
 *
 * Pieces:
 *   null = empty
 *   'w' = white man
 *   'W' = white king
 *   'b' = black man
 *   'B' = black king
 *
 * Rows:
 *   0 = black promotion row
 *   7 = white promotion row
 */

const SIZE = 8;

const WHITE = 'white';
const BLACK = 'black';

const DIRS = [
  [-1, -1],
  [-1,  1],
  [ 1, -1],
  [ 1,  1]
];

function inside(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function cloneBoard(board) {
  return board.map(row => row.slice());
}

function colorOf(piece) {
  if (!piece) return null;
  return piece.toLowerCase() === 'w' ? WHITE : BLACK;
}

function isKing(piece) {
  return piece === 'W' || piece === 'B';
}

function isMan(piece) {
  return piece === 'w' || piece === 'b';
}

function enemy(piece, side) {
  return piece && colorOf(piece) !== side;
}

function promoteIfNeeded(piece, row) {
  if (piece === 'w' && row === 0) return 'W';
  if (piece === 'b' && row === 7) return 'B';
  return piece;
}

/*
 * Standard Russian starting position.
 */
function startPosition() {
  const board = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(null)
  );

  // Black
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = 'b';
      }
    }
  }

  // White
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = 'w';
      }
    }
  }

  return board;
}

function sameSquare(a, b) {
  return a && b && a[0] === b[0] && a[1] === b[1];
}

function containsSquare(list, sq) {
  return list.some(x => sameSquare(x, sq));
}

/*
 * Capture generation for a MAN.
 *
 * Russian draughts:
 * - men move forward only
 * - men capture forward AND backward
 * - capture is mandatory
 * - promotion happens immediately during a capture
 */
function manCaptures(board, r, c, piece, side, captured) {
  const results = [];

  for (const [dr, dc] of DIRS) {
    const mr = r + dr;
    const mc = c + dc;
    const lr = r + dr * 2;
    const lc = c + dc * 2;

    if (!inside(mr, mc) || !inside(lr, lc)) continue;

    const middle = board[mr][mc];

    if (!enemy(middle, side)) continue;

    // Cannot capture a piece already captured in this sequence.
    if (containsSquare(captured, [mr, mc])) continue;

    if (board[lr][lc] !== null) continue;

    const next = cloneBoard(board);

    next[r][c] = null;
    next[mr][mc] = null;

    let nextPiece = piece;

    // Russian rule: immediate promotion during capture.
    nextPiece = promoteIfNeeded(nextPiece, lr);

    next[lr][lc] = nextPiece;

    const nextCaptured = captured.concat([[mr, mc]]);

    const move = {
      from: [r, c],
      to: [lr, lc],
      captures: nextCaptured,
      path: [[lr, lc]],
      promotion: nextPiece !== piece
    };

    const continuations = captureSequences(
      next,
      lr,
      lc,
      nextPiece,
      side,
      nextCaptured
    );

    if (continuations.length) {
      for (const cont of continuations) {
        results.push({
          from: [r, c],
          to: cont.to,
          captures: cont.captures,
          path: [[lr, lc]].concat(cont.path),
          promotion: move.promotion || cont.promotion
        });
      }
    } else {
      results.push(move);
    }
  }

  return results;
}

/*
 * Capture generation for a FLYING KING.
 */
function kingCaptures(board, r, c, piece, side, captured) {
  const results = [];

  for (const [dr, dc] of DIRS) {
    let rr = r + dr;
    let cc = c + dc;
    let enemySquare = null;

    while (inside(rr, cc)) {
      const current = board[rr][cc];

      if (current === null) {
        // Before an enemy is found: just continue scanning.
        // After an enemy is found: every empty square beyond it
        // can be a landing square.
        if (enemySquare) {
          const er = enemySquare[0];
          const ec = enemySquare[1];

          if (!containsSquare(captured, enemySquare)) {
            const next = cloneBoard(board);

            next[r][c] = null;
            next[er][ec] = null;
            next[rr][cc] = piece;

            const nextCaptured = captured.concat([enemySquare]);

            const base = {
              from: [r, c],
              to: [rr, cc],
              captures: nextCaptured,
              path: [[rr, cc]],
              promotion: false
            };

            const continuations = captureSequences(
              next,
              rr,
              cc,
              piece,
              side,
              nextCaptured
            );

            if (continuations.length) {
              for (const cont of continuations) {
                results.push({
                  from: [r, c],
                  to: cont.to,
                  captures: cont.captures,
                  path: [[rr, cc]].concat(cont.path),
                  promotion: cont.promotion
                });
              }
            } else {
              results.push(base);
            }
          }
        }

        rr += dr;
        cc += dc;
        continue;
      }

      // Friendly piece blocks this direction.
      if (colorOf(current) === side) break;

      // More than one enemy before landing is impossible.
      if (enemySquare) break;

      enemySquare = [rr, cc];

      rr += dr;
      cc += dc;
    }
  }

  return results;
}

/*
 * Generate every complete capture sequence from one piece.
 */
function captureSequences(board, r, c, piece, side, captured = []) {
  if (isKing(piece)) {
    return kingCaptures(board, r, c, piece, side, captured);
  }

  return manCaptures(board, r, c, piece, side, captured);
}

/*
 * All captures for the player.
 *
 * IMPORTANT:
 * Russian draughts does NOT require the longest capture.
 * Every complete capture sequence is legal.
 */
function allCaptures(board, side) {
  const moves = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];

      if (!piece || colorOf(piece) !== side) continue;

      const captures = captureSequences(
        board,
        r,
        c,
        piece,
        side,
        []
      );

      moves.push(...captures);
    }
  }

  return moves;
}

/*
 * Simple non-capturing moves.
 */
function simpleMoves(board, side) {
  const moves = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];

      if (!piece || colorOf(piece) !== side) continue;

      if (isKing(piece)) {
        // Flying king.
        for (const [dr, dc] of DIRS) {
          let rr = r + dr;
          let cc = c + dc;

          while (inside(rr, cc) && board[rr][cc] === null) {
            moves.push({
              from: [r, c],
              to: [rr, cc],
              captures: [],
              path: [[rr, cc]],
              promotion: false
            });

            rr += dr;
            cc += dc;
          }
        }
      } else {
        // Man moves forward only.
        const dr = piece === 'w' ? -1 : 1;

        for (const dc of [-1, 1]) {
          const rr = r + dr;
          const cc = c + dc;

          if (!inside(rr, cc)) continue;
          if (board[rr][cc] !== null) continue;

          const promoted = promoteIfNeeded(piece, rr);

          moves.push({
            from: [r, c],
            to: [rr, cc],
            captures: [],
            path: [[rr, cc]],
            promotion: promoted !== piece
          });
        }
      }
    }
  }

  return moves;
}

/*
 * Complete legal move list.
 */
function getAllMoves(board, side) {
  const captures = allCaptures(board, side);

  // Mandatory capture.
  if (captures.length > 0) {
    return captures;
  }

  return simpleMoves(board, side);
}

/*
 * Apply one complete move.
 */
function applyMove(board, move) {
  const next = cloneBoard(board);

  const [fr, fc] = move.from;
  const [tr, tc] = move.to;

  let piece = next[fr][fc];

  next[fr][fc] = null;

  // Remove all captured pieces.
  for (const [r, c] of move.captures || []) {
    next[r][c] = null;
  }

  // Promotion at final square.
  piece = promoteIfNeeded(piece, tr);

  next[tr][tc] = piece;

  return next;
}

/*
 * Check whether a move is legal.
 */
function legalMove(board, side, move) {
  const legal = getAllMoves(board, side);

  return legal.some(m => {
    if (!sameSquare(m.from, move.from)) return false;
    if (!sameSquare(m.to, move.to)) return false;

    const a = m.captures || [];
    const b = move.captures || [];

    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!sameSquare(a[i], b[i])) return false;
    }

    return true;
  });
}

/*
 * Winner:
 * if side has no legal moves, opponent wins.
 */
function winnerFor(board, side) {
  const moves = getAllMoves(board, side);

  if (moves.length === 0) {
    return side === WHITE ? BLACK : WHITE;
  }

  return null;
}

/*
 * Position key for threefold repetition.
 */
function positionKey(board, side) {
  let s = side + '|';

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      s += board[r][c] || '.';
    }
  }

  return s;
}

/*
 * Count pieces.
 */
function countPieces(board) {
  const result = {
    whiteMen: 0,
    whiteKings: 0,
    blackMen: 0,
    blackKings: 0
  };

  for (const row of board) {
    for (const p of row) {
      if (p === 'w') result.whiteMen++;
      else if (p === 'W') result.whiteKings++;
      else if (p === 'b') result.blackMen++;
      else if (p === 'B') result.blackKings++;
    }
  }

  return result;
}

/*
 * Utility: is the board completely empty for a side?
 */
function hasPieces(board, side) {
  for (const row of board) {
    for (const p of row) {
      if (p && colorOf(p) === side) return true;
    }
  }

  return false;
}

/*
 * Create an empty 8x8 board.
 */
function emptyBoard() {
  return Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(null)
  );
}

module.exports = {
  SIZE,
  WHITE,
  BLACK,

  startPosition,
  emptyBoard,

  cloneBoard,
  colorOf,
  isKing,
  isMan,

  allCaptures,
  simpleMoves,
  getAllMoves,

  applyMove,
  legalMove,
  winnerFor,

  positionKey,
  countPieces,
  hasPieces
};
