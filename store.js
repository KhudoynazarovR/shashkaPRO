'use strict';
const fs = require('fs');
const path = require('path');

const FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'players.json');
let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}

let timer = null;
function save() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(db));
    fs.renameSync(FILE + '.tmp', FILE);
  }, 200);
}

function getOrCreate(tg) {
  const id = String(tg.id);
  const name = String(tg.first_name || tg.username || 'Player').slice(0, 20);
  let u = db.users[id];
  if (!u) {
    u = db.users[id] = {
      id, name, elo: 1000, diamonds: 100, premiumUntil: 0,
      wins: 0, losses: 0, games: 0, lastDaily: '', created: Date.now()
    };
  } else {
    u.name = name;
  }
  save();
  return u;
}

function isPremium(u) { return u.premiumUntil > Date.now(); }

module.exports = { getOrCreate, save, isPremium, users: () => db.users };
