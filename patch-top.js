const fs = require('fs');
let U = fs.readFileSync('lobbyclient.js', 'utf8');
const a = 'window.lbFriend = function';
if (U.split(a).length - 1 !== 1) { console.log('ANCHOR XATO'); process.exit(1); }
U = U.replace(a, () => fs.readFileSync('top-ui.part', 'utf8') + a);
fs.writeFileSync('lobbyclient.js', U); console.log('PATCH_OK');
