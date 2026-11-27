'use strict';

const { execFile } = require('child_process');
const path = require('path');

const BIN = path.join(
  __dirname, 'engine/admiral/admiral.bin'
);

function move(opts, cb) {

  try {
    const TBP = require('./tbprobe.js');
    const R = require('./kkrules.js');

    if (TBP.ready()) {
      const t = TBP.best(opts.board, opts.side);

      if (t) {
        const moves = R.moves(opts.board, opts.side);
        const matches = moves.filter(m =>
          m.from === t.from && m.to === t.to
        );

        if (matches.length === 1) {
          const m = matches[0];
          const path = [m.from].concat(
            m.path && m.path.length
              ? m.path : [m.to]
          );

          console.log('[Admiral TB]', t.res, t.d);

          return cb({
            from: m.from,
            to: m.to,
            path,
            jumps: (m.caps || []).length,
            captured: m.caps || [],
            tb: t.res
          });
        }
      }
    }
  } catch (e) {
    console.log('[Admiral TB]', e.message);
  }

  const map = {
    0: 0, 1: 1, '-1': 2,
    2: 3, '-2': 4
  };

  const board = opts.board.map(v => map[v]);
  const side = opts.side === 1 ? 1 : 2;
  const ms = Math.max(50, Math.min(
    15000, Math.round((opts.time || 15) * 1000)
  ));

  const input = [
    side, ms, 64, ...board
  ].join(' ') + '\n';

  const child = execFile(BIN, [], {
    timeout: ms + 3000
  }, (err, stdout) => {
    if (err) return cb({error: err.message});

    const lines = stdout.trim().split('\n');
    const p = lines[1]?.trim().split(/\s+/)
      .slice(1).map(Number) || [];
    const c = lines[2]?.trim().split(/\s+/)
      .slice(1).map(Number) || [];

    if (p.length < 2)
      return cb({error: 'no_move'});

    cb({
      from: p[0],
      to: p[p.length - 1],
      jumps: c.length,
      path: p,
      captured: c
    });
  });

  child.stdin.on('error', () => {});
  child.stdin.end(input);
}

module.exports = { move };
