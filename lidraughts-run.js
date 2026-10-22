'use strict';
/* lidraughts-run.js — Monster'ni lidraughts'da TELEFONDAN (Termux) yoki istalgan kompyuterdan o'ynatish.
   Render'ning bepul serveri juda sekin (0.1 CPU) — telefon protsessori o'nlab barobar tezroq, Monster ancha chuqur o'ylaydi.
   Ishga tushirish (Termux):
     pkg install -y nodejs clang
     termux-wake-lock
     cd ~/downloads/ShashkaPRO
     LIDRAUGHTS_TOKEN=lip_... LIDRAUGHTS_AUTO=1 node lidraughts-run.js
   ESLATMA: bir vaqtda faqat BITTA joyda ishlasin — Render'dagi LIDRAUGHTS_TOKEN ni o'chirib qo'ying. */
const path = require('path');
process.env.KESTO_BIN = process.env.KESTO_BIN || path.join(__dirname, 'engine', 'bridge-local.bin');
process.env.LIDRAUGHTS_MAXSEC = process.env.LIDRAUGHTS_MAXSEC || '15';
if (!process.env.LIDRAUGHTS_TOKEN) { console.log('LIDRAUGHTS_TOKEN berilmagan. Masalan:\n  LIDRAUGHTS_TOKEN=lip_xxx LIDRAUGHTS_AUTO=1 node lidraughts-run.js'); process.exit(1); }
require('./lidraughts.js');
setInterval(() => {}, 1 << 30);   // jarayon to'xtamasin
