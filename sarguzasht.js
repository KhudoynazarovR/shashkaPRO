// sarguzasht.js — 🗺 Sarguzasht xaritasi (mijoz).
// Dunyo (daraja: 3-daraja … GM, yoki Etyudlar) → o'lkalar (har 100 masala) → bekatlar (har 10 masala) → qal'a (oxirgi 10 masala).
// Yo'lboshchi ertak aytadi va savol beradi, bekat tugasa sandiq ochiladi, ko'prikli bekatlar, qal'a sinovi,
// yechilgan joylar gullab «tiriladi», kunlik mehmon bekati (tanga 2 barobar). Admin: nom, ertak, rasmlar, savollar, mukofotlar.
(function () {
  'use strict';
  var C = null, D = null, W = 'r3', LAND = null, BR = [3, 6];
  var WL = ['r3', 'r2', 'r1', 'kms', 'ms', 'gm', 'e'];
  try { W = localStorage.getItem('advW') || 'r3'; } catch (e) {}
  if (WL.indexOf(W) < 0) W = 'r3';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function R(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function hs(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h >>> 0; }

  // ---------- o'lkalar, yo'lboshchilar, ertaklar
  var NAMES = ['Yashil vodiy', 'Qarag‘ayzor', 'Gulzor', 'Kapalaklar bog‘i', 'Oyli ko‘l', 'Sakura tepaligi', 'Kuzgi o‘rmon', 'Sharshara', 'Oltin qumlar',
    'Lolazor', 'Archazor', 'Bodomzor', 'Ninachilar bog‘i', 'Kumush ko‘l', 'Gilos tepaligi', 'Anorzor', 'Kamalak sharsharasi', 'Vohalar',
    'Chinor vodiysi', 'Qoraqarag‘ay', 'Yalpiz dalasi', 'Zumrad bog‘', 'Yulduzli ko‘l', 'O‘rik tepaligi', 'Uzumzor', 'Kumush buloq', 'Sarob cho‘li'];
  var OFF = { r3: 0, r2: 4, r1: 8, kms: 9, ms: 13, gm: 17, e: 18 };
  // sy — ko'rinish: s — orollar, m — tog'lar, e — cho'l; th — birinchi o'lka manzarasi
  var WORLD = { r3: { t: '3-daraja', s: '3-daraja', sy: 's', th: 0 }, r2: { t: '2-daraja', s: '2-daraja', sy: 's', th: 3 }, r1: { t: '1-daraja', s: '1-daraja', sy: 's', th: 6 },
    kms: { t: 'KMS', s: 'KMS', sy: 'm', th: 1 }, ms: { t: 'MS', s: 'MS', sy: 'm', th: 4 }, gm: { t: 'GM', s: 'GM', sy: 'm', th: 7 }, e: { t: 'Etyudlar', s: 'Etyudlar', sy: 'e', th: 8 } };
  function SY() { return (WORLD[W] || WORLD.r3).sy; }
  var TH = [   // g — yer, d — to'q, deco — bezak turi, gd — yo'lboshchi
    { g: '#8fd16a', d: '#4f9d4a', deco: 'tree', gd: 'Toshbaqa bobo' },
    { g: '#5fae6e', d: '#24653c', deco: 'pine', gd: 'Dono Boyqush' },
    { g: '#b9e07a', d: '#6fae3d', deco: 'flower', gd: 'Asalari Asal' },
    { g: '#f3c6dc', d: '#c77da8', deco: 'bfly', gd: 'Kapalak Nilu' },
    { g: '#6c8fd6', d: '#2c4a8e', deco: 'lake', gd: 'Oqqush Oysuluv' },
    { g: '#ffd6e0', d: '#e48aa6', deco: 'sakura', gd: 'Tulki Ziyrak' },
    { g: '#f2b36d', d: '#c26a2c', deco: 'autumn', gd: 'Olmaxon Chaqqon' },
    { g: '#7fd1c3', d: '#2a8c7c', deco: 'fall', gd: 'Qurbaqa Sakrovchi' },
    { g: '#f2d08a', d: '#c9953f', deco: 'dune', gd: 'Tuyacha Bo‘ta' }
  ];
  var INTRO = [
    'Salom, sayohatchi! Men Toshbaqa boboman. Vodiyimizdagi sehrli doska uxlab qoldi — uni jumboqlar bilan uyg‘otamiz.',
    'Uhu-uhu! Men Dono Boyqushman. Qarag‘aylar orasida qadimiy jumboqlar yashiringan — kel, birga topamiz.',
    'Vizz-vizz! Men Asalari Asalman. Gullarim so‘lib qoldi, har yechilgan jumboq ularga shira beradi.',
    'Men Kapalak Niluman. Bog‘imizdagi kapalaklar rangini yo‘qotdi — jumboqlar ularni qaytaradi!',
    'Ko‘limga xush kelibsan! Men Oqqush Oysuluvman. Oy nuri faqat aqlli yurishlarni yoritadi.',
    'Men Tulki Ziyrakman. Ayyorligim bilan mashhurman, lekin sening jumboqlaringga tan beraman. Qani, boshladik!',
    'Chiq-chiq! Men Olmaxon Chaqqonman. Kuzgi o‘rmonda yong‘oqlarim o‘rniga jumboqlar to‘pladim.',
    'Vaq-vaq! Men Qurbaqa Sakrovchiman. Sharshara ortida sirli yo‘l bor — sakrab-sakrab o‘tamiz.',
    'Men Tuyacha Bo‘taman. Cho‘lda adashmaslik uchun har bir yurishni o‘ylab bosamiz.'
  ];
  var MID = [
    'Vodiy gullay boshladi — bu sening yechimlaring sharofati.',
    'Daraxtlar shivirlayapti: «Bu sayohatchi kuchli!» Davom etamiz.',
    'Gullarim yana ochildi! Asal ham ko‘paydi — rahmat senga.',
    'Qara, kapalaklar yana rangli bo‘ldi! Yarim yo‘l ortda qoldi.',
    'Ko‘l yuzida oy aksi tiniqlashdi. Sen to‘g‘ri yo‘ldasan.',
    'Tan olaman, sen mendan ham ziyrakroqsan. Ammo oldinda hiyla ko‘p!',
    'Yarim yo‘l! Yaproqlar oltin rangga kirdi — sening g‘alabalaring rangi.',
    'Sharshara shovqini kuchaydi — qal‘aga yaqinlashyapmiz.',
    'Voha ko‘rindi! Bir oz dam olib, yana yo‘lga tushamiz.'
  ];
  var PRE = [
    'Qal‘a minoralari ko‘rinyapti. Sehrgar seni kutmoqda — kuchingni yig‘!',
    'Oldinda qal‘a. Dono bo‘l: shoshilgan yutqazadi.',
    'Qal‘a darvozasigacha bir bekat qoldi. Gullar senga omad tilaydi!',
    'Kapalaklar qal‘agacha kuzatib boradi. Oxirgi bekat!',
    'Oy to‘lin bo‘ldi — qal‘a sinovi yaqin.',
    'Qal‘a egasi menga ham jumboq bergan edi… Sen albatta yechasan.',
    'Yong‘oqlarimni qal‘a yo‘liga terib qo‘ydim. Oxirgi bekat!',
    'Bir sakrash — va qal‘a oldidamiz!',
    'Qum bo‘roni tindi. Qal‘a ko‘rinib turibdi!'
  ];
  var GEN = {
    1: ['Har bir yechilgan jumboq yo‘limizni yoritadi. Davom etamiz!', 'Yaxshi boshladik! Eng kuchli yurish ko‘pincha kutilmagan bo‘ladi.'],
    2: ['Bu yerda raqib dona berib, tuzoq qo‘ymoqchi. Shoshilmay hisobla.', 'Esingda bo‘lsin: urish majburiy. Raqibni majburlab, o‘zing istagan joyga olib bor.'],
    3: ['Voy, ko‘prik buzilgan! Birinchi uch jumboqni xatosiz yechsang, ko‘prikni tuzatamiz va sandiq ikki barobar bo‘ladi.'],
    5: ['Endi jumboqlar qiyinlashadi. Lekin sen ham kuchliroq bo‘lding.', 'Sandiqlar seni kutmoqda — xatosiz yechsang, to‘la bo‘ladi.'],
    6: ['Yana daryo, yana buzilgan ko‘prik. Uch jumboqni xatosiz yech — ko‘prik tiklanadi!'],
    7: ['Damka — eng kuchli dona. Uni olish yo‘lini qidir.', 'Ba’zan bitta dona qurbon qilsang, uchtasini olasan.']
  };
  var BOSS = [
    { n: 'Qal‘a sehrgari', t: 'Qal‘amga kirmoqchimisan? O‘nta jumbog‘imni ketma-ket yech. Uch marta xato qilsang — boshidan!' },
    { n: 'Tog‘ ajdarhosi', t: 'Grr! Bu qal‘ani men qo‘riqlayman. O‘nta jumboqqa bardosh bersang, xazinam seniki!' },
    { n: 'Bahaybat Dev', t: 'Ho-ho! Kichkina sayohatchi! Mening o‘nta jumbog‘imni yechib ko‘r-chi, uch xatoga ruxsat!' }
  ];

  // ---------- rasmlar (o'zimiz chizgan)
  function guideSvg(t) {
    var g = '';
    switch (t % 9) {
      case 0: g = '<ellipse cx="52" cy="70" rx="34" ry="22" fill="#5a8f3c"/><path d="M30 66 l10 -10 h14 l10 10 l-10 10 h-14z" fill="#7fb85a" stroke="#3f6b28" stroke-width="2"/><path d="M58 60 l8 -8 h10 l6 10 l-8 8 h-10z" fill="#7fb85a" stroke="#3f6b28" stroke-width="2"/><circle cx="84" cy="48" r="12" fill="#9ccc65"/><circle cx="88" cy="45" r="3.2" fill="#222"/><circle cx="85" cy="45" r="5.5" fill="none" stroke="#5d4037" stroke-width="1.6"/><path d="M80 53 q5 3 9 -1" stroke="#33691e" stroke-width="1.6" fill="none"/><rect x="28" y="84" width="10" height="9" rx="4" fill="#8bc34a"/><rect x="62" y="84" width="10" height="9" rx="4" fill="#8bc34a"/>'; break;
      case 1: g = '<ellipse cx="50" cy="58" rx="30" ry="34" fill="#9a6b3f"/><ellipse cx="50" cy="68" rx="19" ry="21" fill="#d8b98a"/><circle cx="39" cy="46" r="11" fill="#fff"/><circle cx="61" cy="46" r="11" fill="#fff"/><circle cx="40" cy="47" r="5" fill="#222"/><circle cx="60" cy="47" r="5" fill="#222"/><path d="M45 56 l5 8 l5 -8z" fill="#f59e0b"/><path d="M24 26 l9 14 l7 -10z M76 26 l-9 14 l-7 -10z" fill="#7a5230"/><path d="M28 18 h44 l-6 -12 h-32z" fill="#3b2a6b"/><rect x="36" y="88" width="8" height="5" rx="2" fill="#f59e0b"/><rect x="56" y="88" width="8" height="5" rx="2" fill="#f59e0b"/>'; break;
      case 2: g = '<ellipse cx="34" cy="38" rx="16" ry="11" fill="#e0f2fe" opacity=".9" transform="rotate(-25 34 38)"/><ellipse cx="66" cy="38" rx="16" ry="11" fill="#e0f2fe" opacity=".9" transform="rotate(25 66 38)"/><ellipse cx="50" cy="62" rx="26" ry="22" fill="#fcd34d"/><path d="M30 56 h40 M27 66 h46 M31 76 h38" stroke="#1f1f1f" stroke-width="6"/><circle cx="50" cy="38" r="15" fill="#fcd34d"/><circle cx="44" cy="36" r="3.2" fill="#222"/><circle cx="56" cy="36" r="3.2" fill="#222"/><path d="M44 44 q6 5 12 0" stroke="#7c2d12" stroke-width="2" fill="none"/><path d="M44 24 q-6 -12 -12 -12 M56 24 q6 -12 12 -12" stroke="#222" stroke-width="2" fill="none"/><circle cx="32" cy="12" r="3" fill="#222"/><circle cx="68" cy="12" r="3" fill="#222"/>'; break;
      case 3: g = '<ellipse cx="30" cy="40" rx="20" ry="24" fill="#a855f7"/><ellipse cx="70" cy="40" rx="20" ry="24" fill="#a855f7"/><ellipse cx="32" cy="72" rx="14" ry="16" fill="#f472b6"/><ellipse cx="68" cy="72" rx="14" ry="16" fill="#f472b6"/><circle cx="28" cy="38" r="6" fill="#fde68a"/><circle cx="72" cy="38" r="6" fill="#fde68a"/><rect x="45" y="34" width="10" height="50" rx="5" fill="#3b2a6b"/><circle cx="50" cy="30" r="10" fill="#3b2a6b"/><circle cx="46" cy="29" r="2.4" fill="#fff"/><circle cx="54" cy="29" r="2.4" fill="#fff"/><path d="M46 20 q-6 -12 -12 -14 M54 20 q6 -12 12 -14" stroke="#3b2a6b" stroke-width="2" fill="none"/>'; break;
      case 4: g = '<ellipse cx="46" cy="76" rx="34" ry="16" fill="#f8fafc"/><path d="M30 70 q-10 -6 -4 -14 q10 4 20 8z" fill="#e2e8f0"/><path d="M66 72 q8 -30 -2 -46 q-6 -10 4 -16" stroke="#f8fafc" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="70" cy="12" r="9" fill="#f8fafc"/><path d="M78 12 l12 3 l-12 4z" fill="#f97316"/><circle cx="72" cy="10" r="2.2" fill="#222"/><path d="M62 4 l3 -6 l3 5 l3 -5 l3 6z" fill="#fbbf24"/><path d="M10 92 q20 -6 40 0 t40 0" stroke="#60a5fa" stroke-width="3" fill="none"/>'; break;
      case 5: g = '<path d="M50 92 q-26 -2 -28 -30 q22 8 28 30z" fill="#ea7a2b"/><path d="M50 92 q26 -2 28 -30 q-22 8 -28 30z" fill="#ea7a2b"/><path d="M22 14 l14 26 l-20 2z M78 14 l-14 26 l20 2z" fill="#ea7a2b"/><path d="M24 22 l9 16 l-12 1z M76 22 l-9 16 l12 1z" fill="#3b2a1a"/><path d="M18 40 q32 -18 64 0 q-6 30 -32 40 q-26 -10 -32 -40z" fill="#f08a3a"/><path d="M26 54 q24 30 48 0 q-6 24 -24 30 q-18 -6 -24 -30z" fill="#fff"/><circle cx="38" cy="50" r="4" fill="#222"/><circle cx="62" cy="50" r="4" fill="#222"/><circle cx="50" cy="66" r="4.5" fill="#222"/>'; break;
      case 6: g = '<path d="M70 86 q30 -10 20 -44 q-8 -26 -28 -20 q14 10 10 30 q-4 18 -2 34z" fill="#b45309"/><path d="M74 78 q20 -10 14 -34" stroke="#f59e0b" stroke-width="3" fill="none"/><ellipse cx="44" cy="68" rx="20" ry="22" fill="#c2662d"/><ellipse cx="44" cy="74" rx="11" ry="13" fill="#fde7c4"/><circle cx="44" cy="38" r="17" fill="#c2662d"/><path d="M30 26 l2 -14 l8 10z M58 26 l-2 -14 l-8 10z" fill="#c2662d"/><circle cx="38" cy="36" r="3.4" fill="#222"/><circle cx="50" cy="36" r="3.4" fill="#222"/><ellipse cx="44" cy="44" rx="3" ry="2.2" fill="#3b2a1a"/><circle cx="58" cy="76" r="7" fill="#8d5524"/><path d="M54 70 q4 -6 8 0" stroke="#5b3a1a" stroke-width="3" fill="none"/>'; break;
      case 7: g = '<ellipse cx="50" cy="66" rx="34" ry="24" fill="#4caf50"/><ellipse cx="50" cy="72" rx="22" ry="14" fill="#a5d6a7"/><circle cx="32" cy="40" r="13" fill="#4caf50"/><circle cx="68" cy="40" r="13" fill="#4caf50"/><circle cx="32" cy="39" r="8" fill="#fff"/><circle cx="68" cy="39" r="8" fill="#fff"/><circle cx="33" cy="40" r="4" fill="#222"/><circle cx="67" cy="40" r="4" fill="#222"/><path d="M34 58 q16 12 32 0" stroke="#1b5e20" stroke-width="3" fill="none"/><ellipse cx="22" cy="88" rx="12" ry="5" fill="#388e3c"/><ellipse cx="78" cy="88" rx="12" ry="5" fill="#388e3c"/>'; break;
      default: g = '<ellipse cx="46" cy="64" rx="30" ry="18" fill="#d9a066"/><path d="M30 50 q8 -20 18 0 q8 -16 16 0" fill="#d9a066"/><path d="M70 56 q10 -18 8 -34" stroke="#d9a066" stroke-width="11" fill="none" stroke-linecap="round"/><ellipse cx="80" cy="20" rx="12" ry="9" fill="#d9a066"/><circle cx="84" cy="17" r="2.4" fill="#222"/><path d="M72 12 l-2 -6 M76 11 l0 -6" stroke="#a16207" stroke-width="2.4"/><rect x="24" y="76" width="6" height="18" rx="3" fill="#b7793e"/><rect x="36" y="76" width="6" height="18" rx="3" fill="#b7793e"/><rect x="54" y="76" width="6" height="18" rx="3" fill="#b7793e"/><rect x="64" y="76" width="6" height="18" rx="3" fill="#b7793e"/><path d="M34 46 h24 v8 h-24z" fill="#dc2626"/>';
    }
    return '<svg viewBox="0 0 100 100" width="100%" height="100%">' + g + '</svg>';
  }
  function bossSvg(b) {
    var g = '';
    if (b === 0) g = '<path d="M20 116 l30 -78 l30 78z" fill="#6d28d9"/><path d="M28 110 l22 -60 l22 60z" fill="#7c3aed"/><circle cx="50" cy="40" r="15" fill="#f2c29b"/><path d="M28 32 l22 -30 l22 30z" fill="#4c1d95"/><circle cx="50" cy="14" r="3" fill="#fde047"/><path d="M38 46 q12 34 24 0 q-12 46 -24 0z" fill="#e5e7eb"/><circle cx="44" cy="38" r="2.6" fill="#222"/><circle cx="56" cy="38" r="2.6" fill="#222"/><path d="M80 116 v-74" stroke="#8b5a2b" stroke-width="4"/><circle cx="80" cy="40" r="7" fill="#22d3ee"/>';
    else if (b === 1) g = '<path d="M14 50 q-12 -30 18 -36 q-4 20 12 28z" fill="#15803d"/><path d="M86 50 q12 -30 -18 -36 q4 20 -12 28z" fill="#15803d"/><ellipse cx="50" cy="82" rx="30" ry="32" fill="#16a34a"/><ellipse cx="50" cy="88" rx="17" ry="22" fill="#bbf7d0"/><path d="M38 92 h24 M38 100 h24 M40 108 h20" stroke="#86efac" stroke-width="2"/><ellipse cx="50" cy="38" rx="22" ry="18" fill="#16a34a"/><path d="M34 24 l-6 -16 l12 10z M66 24 l6 -16 l-12 10z" fill="#fde68a"/><circle cx="42" cy="34" r="4" fill="#fde047"/><circle cx="58" cy="34" r="4" fill="#fde047"/><circle cx="42" cy="34" r="1.8" fill="#111"/><circle cx="58" cy="34" r="1.8" fill="#111"/><path d="M38 48 q12 8 24 0" stroke="#064e3b" stroke-width="2.4" fill="none"/><path d="M42 50 l2 4 l2 -4 M54 50 l2 4 l2 -4" fill="#fff"/>';
    else g = '<rect x="22" y="58" width="56" height="56" rx="16" fill="#64748b"/><rect x="30" y="64" width="40" height="40" rx="10" fill="#94a3b8"/><circle cx="50" cy="38" r="22" fill="#7dd3fc"/><path d="M30 26 q20 -18 40 0" stroke="#334155" stroke-width="6" fill="none"/><circle cx="42" cy="36" r="4" fill="#fff"/><circle cx="58" cy="36" r="4" fill="#fff"/><circle cx="42" cy="37" r="2" fill="#111"/><circle cx="58" cy="37" r="2" fill="#111"/><path d="M40 50 q10 6 20 0" stroke="#0f172a" stroke-width="2.4" fill="none"/><path d="M84 112 l-4 -54 q4 -10 10 -2 l-2 56z" fill="#8b5a2b"/><circle cx="84" cy="58" r="8" fill="#a16207"/>';
    return '<svg viewBox="0 0 100 120" width="100%" height="100%">' + g + '</svg>';
  }
  function lockSvg(x, y, s) { s = s || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-7" y="-2" width="14" height="11" rx="2.5" fill="#e2e8f0"/><path d="M-4.5 -2 v-3.5 a4.5 4.5 0 0 1 9 0 v3.5" stroke="#e2e8f0" stroke-width="2.4" fill="none"/><circle cy="3.5" r="1.7" fill="#475569"/></g>'; }
  function flower(x, y, c, s) { s = s || 1; var g = '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')">'; for (var q = 0; q < 5; q++) { var a = q * 72 * Math.PI / 180; g += '<circle cx="' + (Math.cos(a) * 2.6).toFixed(2) + '" cy="' + (Math.sin(a) * 2.6).toFixed(2) + '" r="2" fill="' + c + '"/>'; } return g + '<circle r="1.4" fill="#ffb703"/></g>'; }
  function bfly(x, y, c, d) { return '<g class="advBf" style="animation-delay:-' + d + 's"><g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><g class="advWg"><ellipse cx="-3.5" cy="-1" rx="3.6" ry="4.4" fill="' + c + '"/><ellipse cx="3.5" cy="-1" rx="3.6" ry="4.4" fill="' + c + '"/></g><rect x="-.7" y="-4" width="1.4" height="8" rx=".7" fill="#222"/></g></g>'; }
  function deco(t, x, y, r, s) {   // bitta bezak elementi
    var k = TH[t].deco; x = +x; y = +y;
    if (k === 'pine' || (k === 'tree' && r() < .3)) return '<path d="M' + x + ' ' + (y - 16 * s) + ' l' + 8 * s + ' ' + 16 * s + ' h' + (-16 * s) + 'z" fill="' + ['#1f6b3a', '#2b8048', '#175a30'][Math.floor(r() * 3)] + '"/><rect x="' + (x - 1.2 * s) + '" y="' + y + '" width="' + 2.4 * s + '" height="' + 3 * s + '" fill="#5a3b1e"/>';
    if (k === 'tree' || k === 'sakura' || k === 'autumn') {
      var cc = k === 'sakura' ? ['#ffafcc', '#ffc8dd', '#ff8fab'] : k === 'autumn' ? ['#e76f51', '#f4a261', '#e9c46a', '#d62828'] : ['#3f9142', '#4caf50', '#2e7d32'];
      return '<rect x="' + (x - 1.3 * s) + '" y="' + (y - 6 * s) + '" width="' + 2.6 * s + '" height="' + 8 * s + '" fill="#6b4423"/><circle cx="' + x + '" cy="' + (y - 9 * s) + '" r="' + 7 * s + '" fill="' + cc[Math.floor(r() * cc.length)] + '"/>';
    }
    if (k === 'flower') return flower(x, y, ['#ff5c8a', '#ffd23f', '#ffffff', '#c77dff', '#ff8c42'][Math.floor(r() * 5)], s);
    if (k === 'bfly') return r() < .5 ? flower(x, y, ['#ff8fab', '#c77dff', '#fff'][Math.floor(r() * 3)], s) : '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse cx="-3" cy="0" rx="3" ry="4" fill="' + ['#7b2cbf', '#ff6d00', '#0096c7', '#e63946'][Math.floor(r() * 4)] + '"/><ellipse cx="3" cy="0" rx="3" ry="4" fill="#f15bb5"/></g>';
    if (k === 'lake') return r() < .5 ? '<ellipse cx="' + x + '" cy="' + y + '" rx="' + 9 * s + '" ry="' + 4 * s + '" fill="#1e3a8a" opacity=".55"/>' : '<path d="M' + x + ' ' + (y - 14 * s) + ' l' + 6 * s + ' ' + 14 * s + ' h' + (-12 * s) + 'z" fill="#1e3a5f"/>';
    if (k === 'fall') return r() < .4 ? '<rect x="' + (x - 3 * s) + '" y="' + (y - 14 * s) + '" width="' + 6 * s + '" height="' + 14 * s + '" fill="#e0fbff" opacity=".85"/>' : '<circle cx="' + x + '" cy="' + (y - 7 * s) + '" r="' + 7 * s + '" fill="#2d6a4f"/>';
    // dune: palma
    return '<path d="M' + x + ' ' + y + ' q' + 2 * s + ' ' + (-10 * s) + ' 0 ' + (-18 * s) + '" stroke="#8b5a2b" stroke-width="' + 2.2 * s + '" fill="none"/><path d="M' + x + ' ' + (y - 18 * s) + ' q' + (-8 * s) + ' ' + (-4 * s) + ' ' + (-12 * s) + ' ' + 3 * s + ' M' + x + ' ' + (y - 18 * s) + ' q' + 8 * s + ' ' + (-4 * s) + ' ' + 12 * s + ' ' + 3 * s + ' M' + x + ' ' + (y - 18 * s) + ' q' + (-3 * s) + ' ' + (-9 * s) + ' ' + (-9 * s) + ' ' + (-9 * s) + ' M' + x + ' ' + (y - 18 * s) + ' q' + 3 * s + ' ' + (-9 * s) + ' ' + 9 * s + ' ' + (-9 * s) + '" stroke="#2e7d32" stroke-width="' + 2.6 * s + '" fill="none" stroke-linecap="round"/>';
  }

  // ---------- ma'lumotlar
  function sv() { return C.S.solved || []; }
  function stars() { return C.S.stars || {}; }
  function isS(id) { return C._sv[id] === 1; }
  function idxBooks(w) { return (C.books()[w] || []); }
  function info(b) {   // kitob bo'yicha hisob
    var n = b.arr.length, d = 0, st = 0, S = stars();
    b.arr.forEach(function (p) { if (isS(p.id)) { d++; st += S[p.id] || 1; } });
    var ns = Math.ceil(n / 10), cs = ns >= 2 ? ns - 1 : -1;
    return { n: n, d: d, st: st, ns: ns, cs: cs };
  }
  function stArr(b, s) { return b.arr.slice(s * 10, s * 10 + 10); }
  function cnt(a) { var c = 0; a.forEach(function (p) { if (isS(p.id)) c++; }); return c; }
  function rankLocked() { return !C.admin && W !== 'e' && C.rankOpen && !C.rankOpen(W); }   // daraja yopiq (admin qarori yoki oldingi darajadan 100 ta yechilmagan)
  function landOpen(books, i) {
    if (C.admin) return true;
    if (rankLocked()) return false;
    if (i === 0) return true;
    var pv = books[i - 1].arr; return cnt(pv) >= pv.length || cnt(books[i].arr) > 0;
  }
  function stOpen(b, s) { if (C.admin || s === 0) return true; var pv = stArr(b, s - 1); return cnt(pv) >= pv.length || cnt(stArr(b, s)) > 0; }
  function nameOf(b, i) { var L = (D.lands || {})[b.key] || {}; if (L.name) return L.name; var k = i + (OFF[W] || 0); return NAMES[k % NAMES.length] + (k >= NAMES.length ? ' ' + (Math.floor(k / NAMES.length) + 1) : ''); }
  function themeOf(i) { return (i + (WORLD[W] || WORLD.r3).th) % 9; }   // tog'larda — qarag'ayzor, cho'lda — vohalar bilan boshlanadi
  function L(b) { return (D.lands || {})[b.key] || {}; }
  function img(id) { return '/api/adv/img?id=' + encodeURIComponent(id); }
  function curLand(books) { var c = 0; for (var i = 0; i < books.length; i++) { if (!landOpen(books, i)) break; c = i; if (cnt(books[i].arr) < books[i].arr.length) break; } return c; }
  function curSt(b) { var I = info(b); for (var s = 0; s < I.ns; s++) { if (s === I.cs) return s; if (cnt(stArr(b, s)) < stArr(b, s).length) return s; } return Math.max(0, I.ns - 1); }
  function lineOf(b, i, s) {
    var t = themeOf(i), ov = (L(b).lines || [])[s];
    if (ov) return ov;
    if (s === 0) return INTRO[t]; if (s === 4) return MID[t]; if (s === 8) return PRE[t];
    var g = GEN[s] || GEN[1]; return g[hs(b.key + s) % g.length];
  }
  function guideHtml(b, i) { var I = L(b).img || {}; return I.guide ? '<img src="' + img(I.guide) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">' : guideSvg(themeOf(i)); }
  function guideName(b, i) { return L(b).guide || TH[themeOf(i)].gd; }
  function bossOf(i) { return (i + (WORLD[W] || WORLD.r3).th) % 3; }
  function heroHtml() {
    var M = window.spPzMap; if (!M || !M.heroSvg) return '<svg viewBox="0 0 40 60"><circle cx="20" cy="16" r="10" fill="#f2c29b"/><rect x="10" y="28" width="20" height="24" rx="6" fill="#d32f2f"/></svg>';
    var hs2 = M.heroes || [], x = null, n = sv().length; hs2.forEach(function (h) { if (h[0] === C.S.heroAv) x = h; });
    return M.heroSvg(x && n >= x[2] ? x[0] : 'b0');
  }

  // ---------- CSS
  function css() {
    if (document.getElementById('advCss')) return;
    var s = document.createElement('style'); s.id = 'advCss';
    s.textContent = '.adv{margin:-14px;min-height:calc(100% + 28px);text-align:left;position:relative}' +
      '.advH{position:sticky;top:-14px;z-index:6;display:flex;align-items:center;gap:8px;padding:10px 12px 8px;background:#0b0e1a}' +
      '.advB{width:38px;height:38px;flex:none;border:0;border-radius:12px;background:#262b66;color:#fff;font-size:24px;line-height:1}' +
      '.advTt{flex:1;min-width:0}.advTt b{display:block;font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.advTt small{display:block;opacity:.7;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.advCh{background:rgba(255,255,255,.1);border-radius:11px;padding:6px 9px;font-size:13px;font-weight:700;white-space:nowrap}.advCh.aY{color:#fde68a}' +
      '.advE{border:0;border-radius:11px;padding:7px 10px;background:#6b5cf0;color:#fff;font-size:13px;font-weight:700}' +
      '.advTb{display:flex;gap:6px;padding:0 12px 8px;position:sticky;top:44px;z-index:5;background:#0b0e1a;box-shadow:0 8px 12px -6px rgba(0,0,0,.5)}.advTb button{flex:1;border:0;border-radius:11px;padding:8px 4px;background:rgba(38,43,102,.9);color:#cfd3ff;font-size:13.5px;font-weight:700}.advTb button.on{background:#6b5cf0;color:#fff}.advTbR{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.advTbR::-webkit-scrollbar{display:none}.advTbR button{flex:none;padding:8px 13px;white-space:nowrap}' +
      '.advM{position:relative;margin-top:-100px}.advM svg{display:block;width:100%;height:auto}.advM [data-l],.advM [data-s],.advM [data-c]{cursor:pointer}' +
      '.advHero{position:absolute;width:13%;max-width:58px;transform:translate(-50%,-96%);pointer-events:none;z-index:2;transition:left .9s ease,top .9s ease}' +
      '.advGd{position:absolute;width:19%;max-width:84px;transform:translate(-50%,-50%);z-index:2;border:0;background:none;padding:0}.advGd i{position:absolute;right:-4px;top:-2px;width:22px;height:22px;border-radius:50%;background:#fbbf24;color:#3b2a1a;font-style:normal;font-weight:900;font-size:15px;line-height:22px;text-align:center;animation:advP 1.2s ease-in-out infinite}' +
      '.advC{position:fixed;left:62px;right:10px;bottom:74px;z-index:9600;background:rgba(11,14,26,.94);border:1px solid #2a3170;border-radius:16px;padding:10px 10px 10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.45)}' +
      '.advC div{flex:1;min-width:0}.advC b{display:block;font-size:15px}.advC small{display:block;opacity:.75;font-size:12.5px;line-height:1.35}.advC button{border:0;border-radius:12px;padding:11px 16px;background:#6b5cf0;color:#fff;font-weight:800;font-size:15px}' +
      '.advPulse{animation:advP 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes advP{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}' +
      '.advBf{animation:advFly 9s ease-in-out infinite}.advWg{animation:advFl .35s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}@keyframes advFly{0%,100%{transform:translate(0,0)}25%{transform:translate(10px,-8px)}50%{transform:translate(-6px,-14px)}75%{transform:translate(-12px,-4px)}}@keyframes advFl{from{transform:scaleX(1)}to{transform:scaleX(.35)}}' +
      '.advWave{animation:advWv 4s linear infinite}@keyframes advWv{from{transform:translateX(0)}to{transform:translateX(-24px)}}' +
      '.advS{position:fixed;left:0;right:0;top:0;bottom:64px;z-index:9700;background:rgba(5,8,20,.6);display:flex;align-items:flex-end}' +
      '.advSp{width:100%;max-height:88%;overflow-y:auto;background:#fffdf7;color:#2b2b2b;border-radius:22px 22px 0 0;padding:16px 14px 18px;box-sizing:border-box;text-align:left;animation:advUp .25s ease-out}@keyframes advUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
      '.advX{float:right;border:0;background:#eee;border-radius:10px;width:34px;height:34px;font-size:18px;color:#444}' +
      '.advG{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.advG .pic{width:76px;height:76px;flex:none;border-radius:50%;background:#e9f5e1;padding:4px;box-sizing:border-box}.advG .bub{flex:1;background:#f1f0fb;border-radius:4px 16px 16px 16px;padding:10px 12px;font-size:14px;line-height:1.45}.advG .bub b{display:block;font-size:14.5px;margin-bottom:2px;color:#4c3bd1}' +
      '.advTag{display:inline-block;background:#fde68a;color:#7c2d12;border-radius:8px;padding:2px 8px;font-size:12px;font-weight:700;margin-bottom:8px}' +
      '.advQ{background:#fff;border:1px solid #ece9ff;border-radius:16px;padding:12px;margin-bottom:12px}.advQ h4{margin:0 0 8px;font-size:15.5px}.advQ button{display:block;width:100%;text-align:left;margin-top:7px;padding:11px 12px;border:0;border-radius:12px;background:#f1f0fb;font-size:14.5px;font-weight:600;color:#2b2b2b}.advQ button.aOk{background:#22c55e;color:#fff}.advQ button.aNo{background:#ef4444;color:#fff}.advQ p{margin:9px 0 0;font-size:13.5px;line-height:1.4}' +
      '.advNote{background:#e0f2fe;color:#0c4a6e;border-radius:12px;padding:9px 11px;font-size:13px;line-height:1.4;margin-bottom:12px}.advNote.aG{background:#dcfce7;color:#14532d}.advNote.aY{background:#fef3c7;color:#78350f}' +
      '.advGr{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:12px}.advGr button{position:relative;border:0;border-radius:12px;padding:9px 0 13px;background:#eef0f6;color:#3b3f5c;font-weight:800;font-size:15px}.advGr button.aOk{background:#dcfce7;color:#166534}.advGr button.aNx{background:#6b5cf0;color:#fff;box-shadow:0 0 0 3px #c7c2ff}.advGr button i{position:absolute;left:0;right:0;bottom:2px;font-style:normal;font-size:9.5px;color:#d97706;letter-spacing:-1px}.advGr button i u{text-decoration:none;opacity:.3}' +
      '.advBtn{display:block;width:100%;border:0;border-radius:14px;padding:13px;background:#6b5cf0;color:#fff;font-size:16px;font-weight:800;margin-top:6px}.advBtn.aG{background:#16a34a}.advBtn.aO{background:#eceaf8;color:#4c3bd1}.advBtn:disabled{opacity:.5}' +
      '.advBar{display:flex;gap:4px;margin:10px 0 6px}.advBar b{flex:1;height:10px;border-radius:5px;background:#e5e7eb}.advBar b.aG{background:#22c55e}.advBar b.aR{background:#ef4444}.advBar b.aY{background:#fbbf24}' +
      '.advCst{position:relative;height:190px;margin:-16px -14px 12px;border-radius:22px 22px 0 0;overflow:hidden;background:linear-gradient(#2a1f45,#4b3a6e)}' +
      '.advChest{position:fixed;inset:0;z-index:9800;background:radial-gradient(circle at 50% 40%,#3b4a8a,#0b0e1a 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px;box-sizing:border-box}' +
      '.advChest .lid{transform-box:fill-box;transform-origin:0% 100%;transition:transform .5s cubic-bezier(.3,1.6,.6,1)}.advChest.op .lid{transform:rotate(-38deg)}.advChest .bx{animation:advSh .5s ease-in-out 2}@keyframes advSh{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}' +
      '.advChest .cn{opacity:0}.advChest.op .cn{animation:advCn 1.1s ease-out forwards}@keyframes advCn{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:1;transform:translate(var(--x),var(--y))}}' +
      '.advChest h2{margin:14px 0 4px;font-size:26px}.advChest p{margin:4px 0;font-size:15px;opacity:.9;max-width:320px}.advChest .advBtn{max-width:320px}' +
      '.advA input,.advA textarea{width:100%;box-sizing:border-box;border:1px solid #d6d3f0;border-radius:10px;padding:9px 10px;font-size:14px;margin:4px 0 8px;font-family:inherit;color:#222;background:#fff}.advA label{font-size:12.5px;font-weight:700;color:#555}.advA .aRow{display:flex;align-items:center;gap:10px;margin:6px 0 12px}.advA .aRow .pv{width:64px;height:64px;border-radius:12px;background:#eee;overflow:hidden;flex:none}.advA .aRow .pv img{width:100%;height:100%;object-fit:cover}.advA .sm{border:0;border-radius:10px;padding:8px 11px;background:#eceaf8;color:#4c3bd1;font-weight:700;font-size:13px}.advA .it{border:1px solid #eee;border-radius:12px;padding:10px;margin-bottom:8px;font-size:13.5px}.advA .it em{display:block;color:#16a34a;font-style:normal;font-size:12.5px;margin-top:3px}' +
      '@media (prefers-reduced-motion:reduce){.advBf,.advWg,.advPulse,.advWave,.advGd i{animation:none!important}}';
    document.head.appendChild(s);
  }

  // ---------- dunyo xaritasi
  function worldView() {
    css(); LAND = null; C.onLand && C.onLand(null);
    var books = idxBooks(W), n = books.length, ov = C.ov;
    var tot = 0, done = 0; books.forEach(function (b) { var I = info(b); tot += I.st; if (I.n && I.d === I.n) done++; });
    var h = '<div class="adv"><div class="advH"><button class="advB" id="pzBack">‹</button><div class="advTt"><b>' + WORLD[W].t + '</b><small>' + n + ' ta o‘lka · ' + done + ' tugatildi</small></div><span class="advCh aY">★ ' + tot + '</span>' + (C.admin ? '<button class="advE" id="advPost">Guruhga</button><button class="advE" id="advAdm">Tahrir</button>' : '') + '</div>';
    var rkLk = rankLocked();
    h += '<div class="advTb advTbR">' + WL.map(function (w) { return '<button data-w="' + w + '"' + (W === w ? ' class="on"' : '') + '>' + WORLD[w].s + '</button>'; }).join('') + '</div>';
    if (rkLk) h += '<div class="advNote aG" style="margin:0 12px 8px">Bu daraja hali yopiq: ' + (WORLD[WL[WL.indexOf(W) - 1]] || {}).t + 'dan ' + (C.rkUnlock || 100) + ' ta masala yeching</div>';
    if (!n) { ov.innerHTML = h + '<div style="padding:40px 20px;opacity:.7;text-align:center">Bu dunyoda hozircha o‘lka yo‘q</div></div>'; bindTop(); return; }
    var GAP = 150, H = 200 + n * GAP + 120, P = [], r = R(7 + hs(W) % 97);
    for (var i = 0; i < n; i++) P.push([(i % 2 ? 262 : 98) + (r() * 20 - 10), H - 170 - i * GAP]);
    var cl = curLand(books), g = '<svg viewBox="0 0 360 ' + H + '"><defs>' +
      '<linearGradient id="advSea" x1="0" y1="0" x2="0" y2="1">' + (SY() === 's' ? '<stop offset="0" stop-color="#1b4f8a"/><stop offset="1" stop-color="#2b78c2"/>' : SY() === 'm' ? '<stop offset="0" stop-color="#1e2a4a"/><stop offset="1" stop-color="#4a5f8f"/>' : '<stop offset="0" stop-color="#d9a75a"/><stop offset="1" stop-color="#f3d39a"/>') + '</linearGradient></defs>' +
      '<rect width="360" height="' + H + '" fill="url(#advSea)"/>';
    // fon bezaklari
    var r2 = R(3 + n);
    if (SY() === 's') { g += '<g class="advWave">'; for (i = 0; i < n * 10; i++) g += '<path d="M' + (r2() * 400).toFixed(0) + ' ' + (r2() * H).toFixed(0) + ' q6 -4 12 0 t12 0" stroke="#9fd0ff" stroke-width="1.4" fill="none" opacity=".45"/>'; g += '</g>'; }
    else if (SY() === 'm') { for (i = 0; i < n * 2 + 2; i++) { var mx = r2() * 360, my = r2() * H; g += '<path d="M' + (mx - 60) + ' ' + my + ' l60 -70 l60 70z" fill="#2b3a63" opacity=".7"/><path d="M' + (mx - 14) + ' ' + (my - 54) + ' l14 -16 l14 16 l-7 -3 l-7 5z" fill="#e2e8f0" opacity=".85"/>'; } for (i = 0; i < n * 2; i++) g += '<ellipse cx="' + (r2() * 360).toFixed(0) + '" cy="' + (r2() * H).toFixed(0) + '" rx="' + (26 + r2() * 20).toFixed(0) + '" ry="9" fill="#fff" opacity=".12"/>'; }
    else { for (i = 0; i < n * 4; i++) { var dx = r2() * 400 - 20, dy = r2() * H; g += '<path d="M' + dx.toFixed(0) + ' ' + dy.toFixed(0) + ' q30 -14 60 0" stroke="#c0873e" stroke-width="2" fill="none" opacity=".45"/>'; } }
    // yo'l
    var pd = 'M' + P[0][0] + ' ' + P[0][1]; for (i = 1; i < n; i++) { var a = P[i - 1], b2 = P[i]; pd += ' C' + a[0] + ' ' + (a[1] - 70) + ' ' + b2[0] + ' ' + (b2[1] + 70) + ' ' + b2[0] + ' ' + b2[1]; }
    g += '<path d="' + pd + '" stroke="' + (SY() === 'e' ? '#8b5a2b' : '#ffe7a3') + '" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round" fill="none" opacity=".9"/>';
    var guestK = D.guest && D.guest.k;
    books.forEach(function (b, i) {
      var I = info(b), x = P[i][0], y = P[i][1], t = themeOf(i), op = landOpen(books, i), dn = I.n && I.d === I.n, cw = !!(D.my.cs || {})[b.key], li = L(b).img || {};
      var rim = SY() === 's' ? '#ecd9a6' : SY() === 'm' ? '#94a3b8' : '#b7793e';
      g += '<g data-l="' + i + '"><ellipse cx="' + x + '" cy="' + (y + 12) + '" rx="82" ry="40" fill="rgba(0,0,0,.18)"/><ellipse cx="' + x + '" cy="' + (y + 8) + '" rx="80" ry="40" fill="' + rim + '"/>';
      if (li.land) g += '<clipPath id="advCl' + i + '"><ellipse cx="' + x + '" cy="' + y + '" rx="74" ry="36"/></clipPath><image href="' + img(li.land) + '" x="' + (x - 74) + '" y="' + (y - 36) + '" width="148" height="72" preserveAspectRatio="xMidYMid slice" clip-path="url(#advCl' + i + ')"/>';
      else {
        g += '<ellipse cx="' + x + '" cy="' + y + '" rx="74" ry="36" fill="' + TH[t].g + '"/>';
        if (TH[t].deco === 'lake') g += '<ellipse cx="' + (x + 30) + '" cy="' + (y + 6) + '" rx="26" ry="12" fill="#1e3a8a"/><circle cx="' + (x + 38) + '" cy="' + (y + 4) + '" r="4" fill="#fdf3c4" opacity=".8"/>';
        if (TH[t].deco === 'fall') g += '<rect x="' + (x + 24) + '" y="' + (y - 20) + '" width="14" height="30" fill="#e0fbff"/><ellipse cx="' + (x + 31) + '" cy="' + (y + 12) + '" rx="16" ry="5" fill="#bdeff7"/>';
        var rr = R(i * 7 + 3);
        for (var q = 0; q < 9; q++) { var ang = rr() * Math.PI * 2, dd = .45 + rr() * .45, qx = x + Math.cos(ang) * 62 * dd, qy = y + Math.sin(ang) * 26 * dd + 6; if (Math.abs(qx - x) < 16 && Math.abs(qy - y) < 18) continue; g += deco(t, qx.toFixed(1), qy.toFixed(1), rr, .8); }
      }
      // 🌸 tirilish: yechilgan sari gul ko'payadi
      var fl = Math.round(I.n ? I.d / I.n * 12 : 0), rf = R(i * 13 + 1);
      for (q = 0; q < fl; q++) { var fa = q / 12 * Math.PI * 2 + rf(); g += flower(x + Math.cos(fa) * 70, y + 6 + Math.sin(fa) * 33, ['#ff5c8a', '#ffd23f', '#fff', '#c77dff'][q % 4], .9); }
      if (dn) g += bfly(x - 40, y - 22, '#f472b6', i % 5) + bfly(x + 44, y - 16, '#60a5fa', (i + 2) % 5);
      // markaz: minora va bayroq
      var fc = cw ? '#fbbf24' : dn ? '#22c55e' : i === cl ? '#fb923c' : '#94a3b8';
      g += '<rect x="' + (x - 10) + '" y="' + (y - 30) + '" width="20" height="24" rx="2" fill="#8a6a4a"/><rect x="' + (x - 4) + '" y="' + (y - 17) + '" width="8" height="11" rx="3" fill="#3b2a1a"/><path d="M' + (x - 13) + ' ' + (y - 30) + ' l13 -13 l13 13z" fill="#b5483d"/><line x1="' + x + '" y1="' + (y - 43) + '" x2="' + x + '" y2="' + (y - 60) + '" stroke="#333" stroke-width="2"/><path d="M' + x + ' ' + (y - 60) + ' l15 5 l-15 5z" fill="' + fc + '"/>';
      if (cw) g += '<path d="M' + (x + 4) + ' ' + (y - 57) + ' l1.4 2.8 l3 .3 l-2.3 2 l.7 3 l-2.8 -1.6 l-2.6 1.6 l.6 -3 l-2.2 -2 l3 -.3z" fill="#7c2d12"/>';
      if (!op) g += '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="80" ry="40" fill="rgba(15,20,40,.55)"/><ellipse cx="' + (x - 34) + '" cy="' + (y - 8) + '" rx="26" ry="11" fill="#e2e8f0" opacity=".55"/><ellipse cx="' + (x + 30) + '" cy="' + (y - 2) + '" rx="30" ry="12" fill="#e2e8f0" opacity=".5"/>' + lockSvg(x, y - 14, 1.3);
      if (guestK === b.key) g += '<g class="advPulse"><rect x="' + (x + 38) + '" y="' + (y - 52) + '" width="40" height="20" rx="10" fill="#fbbf24"/><text x="' + (x + 58) + '" y="' + (y - 38) + '" text-anchor="middle" font-size="11.5" font-weight="900" fill="#78350f">×' + (D.rw.guest || 2) + '</text></g>';
      var sub = !op ? (rkLk ? 'daraja yopiq' : 'oldingi o‘lka 100/100 bo‘lsa ochiladi') : cw ? 'Qal‘a zabt etildi · ★ ' + I.st : dn ? 'Tugatildi · ★ ' + I.st + '/' + I.n * 3 : I.d + '/' + I.n + (I.d ? ' · ★ ' + I.st : '');
      g += '<rect x="' + (x - 66) + '" y="' + (y + 26) + '" width="132" height="34" rx="10" fill="rgba(11,14,26,.84)"/><text x="' + x + '" y="' + (y + 40) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">' + (i + 1) + '. ' + esc(nameOf(b, i)) + '</text><text x="' + x + '" y="' + (y + 54) + '" text-anchor="middle" font-size="10.5" fill="' + (!op ? '#cbd5e1' : cw ? '#fde68a' : dn ? '#86efac' : '#fde68a') + '">' + sub + '</text></g>';
    });
    g += '<rect x="' + (P[cl][0] - 40) + '" y="' + (P[cl][1] - 66) + '" width="80" height="18" rx="9" fill="#2563eb"/><text x="' + P[cl][0] + '" y="' + (P[cl][1] - 53) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Shu yerda</text>';
    g += '</svg>';
    var hb = books[cl], hp = P[cl];
    h += '<div class="advM">' + g + '<div class="advHero idle" id="advHr" style="pointer-events:auto;cursor:pointer;left:' + ((hp[0] - 50) / 360 * 100).toFixed(2) + '%;top:' + ((hp[1] + 8) / H * 100).toFixed(2) + '%">' + heroHtml() + '</div></div><div style="height:96px"></div>';
    var hI = info(hb), hs3 = curSt(hb), gl = '';
    if (D.guest) { var gb = null, gi = -1; var gw = String(D.guest.k).split('_')[0]; idxBooks(gw).forEach(function (bb, ii) { if (bb.key === D.guest.k) { gb = bb; gi = ii; } }); if (gb) gl = 'Mehmon: ' + ((WORLD[gw] || {}).t || '') + ' ' + (gi + 1) + '-o‘lka, ' + (D.guest.st + 1) + '-bekat · tanga ×' + (D.rw.guest || 2); }
    ov.innerHTML = h; bindTop();
    var M = ov.querySelector('.advM svg');
    ov.querySelector('.advM').onclick = function (ev) { var e = ev.target.closest('[data-l]'); if (!e) return; var i2 = +e.getAttribute('data-l'); if (!landOpen(books, i2)) return toast(rkLk ? 'Bu daraja hali yopiq: oldingi darajadan ' + (C.rkUnlock || 100) + ' ta masala yeching' : 'Bu o‘lka hali yopiq: oldingi o‘lkadagi 100 ta masalani yeching'); landView(books[i2], i2); };
    ov.querySelector('#advHr').onclick = function (ev) { ev.stopPropagation(); var M2 = window.spPzMap; if (M2 && M2.picker) M2.picker(function () { worldView(); }); };
    setTimeout(function () { var k = M.getBoundingClientRect().width / 360; ov.scrollTop = Math.max(0, hp[1] * k - ov.clientHeight * .55); }, 0);
  }
  function bindTop() {
    var ov = C.ov;
    var b = ov.querySelector('#pzBack'); if (b) b.onclick = function () { closeSheet(); var ch = document.querySelector('.advChest'); if (ch) ch.remove(); if (LAND) worldView(); else C.back(); };
    var po = ov.querySelector('#advPost'); if (po) po.onclick = function () {
      var u = 'https://t.me/DraughtsPRObot/play?startapp=adv', sh = 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent('Yangi sarguzasht xaritasi! Har daraja — alohida dunyo.');
      if (C.tg && C.tg.openTelegramLink) C.tg.openTelegramLink(sh); else window.open(sh, '_blank');
    };
    var a = ov.querySelector('#advAdm'); if (a) a.onclick = function () { admin(LAND ? LAND.b : null, LAND ? LAND.i : 0); };
    [].forEach.call(ov.querySelectorAll('[data-w]'), function (e) { e.onclick = function () { W = e.getAttribute('data-w'); try { localStorage.setItem('advW', W); } catch (x) {} worldView(); }; });
  }
  function toast(t) { if (C.tg && C.tg.showAlert) C.tg.showAlert(t); else alert(t); }

  // ---------- o'lka ichi
  var XS = [180, 96, 264, 110, 252, 100, 262, 118, 248];
  function posOf(s, ns, cs) { if (ns === 1) return [180, 560]; var y = 830 - s * (690 / (ns - 1)); return [s === cs ? 180 : XS[s % 9], y]; }
  function landView(b, i, after) {
    css(); LAND = { b: b, i: i }; C.onLand && C.onLand(b);
    var ov = C.ov, I = info(b), t = themeOf(i), H = 940, li = L(b).img || {}, my = D.my, cur = curSt(b);
    var h = '<div class="adv"><div class="advH"><button class="advB" id="pzBack">‹</button><div class="advTt"><b>' + (i + 1) + '. ' + esc(nameOf(b, i)) + '</b><small>' + I.d + ' / ' + I.n + ' yechildi · <span style="color:#fde68a">★ ' + I.st + ' / ' + I.n * 3 + '</span></small></div>' + (C.admin ? '<button class="advE" id="advAdm">Tahrir</button>' : '') + '</div>';
    var g = '<svg viewBox="0 0 360 ' + H + '"><rect width="360" height="' + H + '" fill="' + TH[t].g + '"/>';
    if (li.land) g += '<image href="' + img(li.land) + '" x="0" y="0" width="360" height="' + H + '" preserveAspectRatio="xMidYMid slice"/><rect width="360" height="' + H + '" fill="rgba(255,255,255,.08)"/>';
    else {
      g += '<rect width="360" height="' + H + '" fill="url(#advLg)"/><defs><linearGradient id="advLg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient></defs>';
      var r = R(i * 31 + 5);
      for (var q = 0; q < 70; q++) { var dx = r() * 360, dy = 120 + r() * (H - 140); if (dx > 70 && dx < 290 && r() < .85) continue; g += deco(t, dx.toFixed(1), dy.toFixed(1), r, 1.3 + r() * .5); }
    }
    var P = []; for (var s = 0; s < I.ns; s++) P.push(posOf(s, I.ns, I.cs));
    if (I.ns > 1) { var pl = P.map(function (p) { return p.join(' '); }).join(' L'); g += '<path d="M' + pl + '" stroke="#c9a46a" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M' + pl + '" stroke="#ecd3a0" stroke-width="21" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'; }
    // daryo va ko'priklar
    BR.forEach(function (bs) {
      if (bs >= I.ns || bs === I.cs) return;
      var a = P[bs - 1], c = P[bs], mx = (a[0] + c[0]) / 2, my2 = (a[1] + c[1]) / 2, ang = Math.atan2(c[1] - a[1], c[0] - a[0]) * 180 / Math.PI;
      var ids = stArr(b, bs), fx = ids.slice(0, 3).every(function (p) { return isS(p.id) && (stars()[p.id] || 0) >= 3; });
      g += '<path d="M0 ' + (my2 - 12) + ' q45 -8 90 0 t90 0 t90 0 t90 0 v26 q-45 8 -90 0 t-90 0 t-90 0 t-90 0z" fill="#4fa3e0"/><g class="advWave"><path d="M0 ' + my2 + ' q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" stroke="#bfe6ff" stroke-width="1.6" fill="none"/></g>';
      g += '<g transform="translate(' + mx + ' ' + my2 + ') rotate(' + ang + ')">';
      for (var k = -3; k <= 3; k++) { if (!fx && (k === 0 || k === 1)) continue; g += '<rect x="' + (k * 7 - 3) + '" y="-15" width="6" height="30" rx="1.5" fill="#a0612c" stroke="#6b3d16" stroke-width="1"/>'; }
      if (fx) g += '<rect x="-24" y="-17" width="48" height="3" fill="#6b3d16"/><rect x="-24" y="14" width="48" height="3" fill="#6b3d16"/>';
      g += '</g>';
      if (!fx) g += '<g transform="translate(' + (mx + 30) + ' ' + (my2 - 22) + ')"><rect x="-26" y="-10" width="52" height="18" rx="9" fill="rgba(127,29,29,.9)"/><text y="3" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">ko‘prik</text></g>';
    });
    // bekatlar
    var gs = D.guest && D.guest.k === b.key ? D.guest.st : -1;
    for (s = 0; s < I.ns; s++) {
      var x = P[s][0], y = P[s][1], A = stArr(b, s), dn = cnt(A), full = dn === A.length, op = stOpen(b, s), key = b.key + ':' + s;
      if (s === I.cs) {
        var won = !!(my.cs || {})[b.key], tr = my.tr && my.tr.k === b.key;
        g += '<g data-c="1" transform="translate(' + x + ' ' + (y + 6) + ')">' + (won ? bfly(-60, -60, '#fde047', 1) + bfly(56, -50, '#f472b6', 3) : '') +
          '<rect x="-48" y="-62" width="96" height="62" fill="' + (op ? '#8a7a6a' : '#6b7280') + '"/><rect x="-58" y="-88" width="24" height="42" fill="' + (op ? '#7a6a5a' : '#575f6b') + '"/><rect x="34" y="-88" width="24" height="42" fill="' + (op ? '#7a6a5a' : '#575f6b') + '"/>' +
          '<path d="M-62 -88 l16 -20 l16 20z M30 -88 l16 -20 l16 20z" fill="#b5483d"/><rect x="-44" y="-72" width="8" height="10" fill="#3a2a1a"/><rect x="40" y="-72" width="8" height="10" fill="#3a2a1a"/>' +
          '<path d="M-14 0 v-24 a14 14 0 0 1 28 0 v24z" fill="' + (tr ? '#fbbf24' : '#3a2a1a') + '"/><line x1="0" y1="-62" x2="0" y2="-92" stroke="#333" stroke-width="2.4"/><path d="M0 -92 l18 6 l-18 6z" fill="' + (won ? '#fbbf24' : op ? '#ef4444' : '#9ca3af') + '"/>' +
          (op ? '' : lockSvg(0, -30, 1.4)) + '<rect x="-56" y="6" width="112" height="22" rx="11" fill="rgba(11,14,26,.82)"/><text y="21" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + (won ? '#fde68a' : '#fff') + '">' + (won ? 'Qal‘a zabt etildi' : 'Qal‘a · ' + (s * 10 + 1) + '–' + (s * 10 + A.length)) + '</text></g>';
        continue;
      }
      if (full) { var rf = R(s * 17 + i); for (q = 0; q < 7; q++) { var fa = q / 7 * Math.PI * 2; g += flower(x + Math.cos(fa) * 40, y + Math.sin(fa) * 34 + 4, ['#ff5c8a', '#ffd23f', '#fff', '#c77dff'][q % 4], 1.2 + rf() * .3); } g += bfly(x - 44, y - 30, ['#f472b6', '#a78bfa', '#60a5fa'][s % 3], s % 4) + bfly(x + 40, y - 36, '#fbbf24', (s + 2) % 4); }
      if (s === gs) g += '<circle cx="' + x + '" cy="' + y + '" r="33" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5 5"/><g class="advPulse"><rect x="' + (x - 22) + '" y="' + (y - 56) + '" width="44" height="19" rx="9.5" fill="#fbbf24"/><text x="' + x + '" y="' + (y - 42) + '" text-anchor="middle" font-size="11" font-weight="900" fill="#78350f">mehmon ×' + (D.rw.guest || 2) + '</text></g>';
      g += '<g data-s="' + s + '"><circle cx="' + x + '" cy="' + (y + 3) + '" r="26" fill="rgba(0,0,0,.18)"/><circle cx="' + x + '" cy="' + y + '" r="25" fill="' + (full ? '#16a34a' : s === cur ? '#f59e0b' : op ? '#6b5cf0' : '#94a3b8') + '" stroke="#fff" stroke-width="4"/>' +
        (op ? '<text x="' + x + '" y="' + (y + 6.5) + '" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">' + (s + 1) + '</text>' : lockSvg(x, y - 3, 1.2));
      var ss = 0; A.forEach(function (p) { if (isS(p.id)) ss += stars()[p.id] || 1; });
      g += '<rect x="' + (x - 30) + '" y="' + (y + 30) + '" width="60" height="18" rx="9" fill="rgba(11,14,26,.72)"/><text x="' + x + '" y="' + (y + 43) + '" text-anchor="middle" font-size="11" font-weight="800" fill="' + (full ? '#fde68a' : '#fff') + '">' + (full ? '★ ' + ss + '/' + A.length * 3 : dn + '/' + A.length) + '</text>';
      // sandiq
      var cx = x + (x > 180 ? -46 : 46);
      if (full && !(my.ch || {})[key]) g += '<g data-s="' + s + '" class="advPulse"><circle cx="' + cx + '" cy="' + (y - 4) + '" r="19" fill="#fde68a" opacity=".55"/><rect x="' + (cx - 13) + '" y="' + (y - 8) + '" width="26" height="16" rx="3" fill="#a0612c" stroke="#e0a948" stroke-width="2.4"/><path d="M' + (cx - 13) + ' ' + (y - 8) + ' q13 -14 26 0z" fill="#b8733a" stroke="#e0a948" stroke-width="2.4"/><rect x="' + (cx - 3) + '" y="' + (y - 5) + '" width="6" height="7" rx="1" fill="#e0a948"/></g>';
      else if ((my.ch || {})[key]) g += '<g opacity=".85"><rect x="' + (cx - 10) + '" y="' + (y - 4) + '" width="20" height="12" rx="2" fill="#a0612c" stroke="#e0a948" stroke-width="2"/><path d="M' + (cx - 10) + ' ' + (y - 4) + ' l-3 -10 h20 l3 10z" fill="#b8733a" stroke="#e0a948" stroke-width="2"/></g>';
      g += '</g>';
    }
    g += '</svg>';
    var hp = P[cur] || P[0];
    h += '<div class="advM" style="margin-top:-56px">' + g + '<div class="advHero idle" style="left:' + ((hp[0] + (cur === I.cs ? 0 : hp[0] > 180 ? 30 : -30)) / 360 * 100).toFixed(2) + '%;top:' + ((hp[1] + (cur === I.cs ? -20 : -6)) / H * 100).toFixed(2) + '%">' + heroHtml() + '</div>' +
      '<button class="advGd" id="advGd" style="left:13%;top:' + ((H - 52) / H * 100).toFixed(2) + '%">' + guideHtml(b, i) + (qPending(b, cur, I) ? '<i>!</i>' : '') + '</button></div><div style="height:96px"></div>';
    var tr2 = my.tr && my.tr.k === b.key, cA = stArr(b, cur), nx = cA.filter(function (p) { return !isS(p.id); })[0];
    h += '<div class="advC"><div><b>' + (cur === I.cs ? (tr2 ? 'Qal‘a sinovi: ' + my.tr.i + '/' + cA.length : 'Qal‘a sinovi') : (cur + 1) + '-bekat' + (nx ? ' · ' + (b.arr.indexOf(nx) + 1) + '-masala' : '')) + '</b><small>' + esc(guideName(b, i)) + ' · ' + (cur === I.cs ? BOSS[bossOf(i)].n + ' kutmoqda' : cnt(cA) + '/' + cA.length + ' masala') + '</small></div><button id="advGo">' + (cur === I.cs ? (tr2 ? 'Davom' : 'Qal‘a') : 'Yechish') + '</button></div></div>';
    ov.innerHTML = h; bindTop();
    ov.querySelector('.advM').onclick = function (ev) {
      var e = ev.target.closest('[data-s],[data-c]'); if (!e) return;
      if (e.hasAttribute('data-c')) return castle(b, i);
      var s2 = +e.getAttribute('data-s'); if (!stOpen(b, s2)) return toast('Bu bekat hali yopiq: oldingi bekatdagi hamma masalani yeching'); station(b, i, s2);
    };
    ov.querySelector('#advGd').onclick = function () { cur === I.cs ? castle(b, i) : station(b, i, cur); };
    ov.querySelector('#advGo').onclick = function () { cur === I.cs ? castle(b, i) : station(b, i, cur); };
    var M = ov.querySelector('.advM svg');
    setTimeout(function () { var k = M.getBoundingClientRect().width / 360; ov.scrollTop = Math.max(0, hp[1] * k - ov.clientHeight * .5); if (after) after(); }, 0);
  }
  function qPending(b, s, I) { return s !== I.cs && D.qn > 0 && !((b.key + ':' + s) in (D.my.q || {})); }

  // ---------- bekat oynasi
  function sheet(html) { closeSheet(); var e = document.createElement('div'); e.className = 'advS'; e.id = 'advS'; e.innerHTML = '<div class="advSp">' + html + '</div>'; e.onclick = function (ev) { if (ev.target === e) closeSheet(); }; document.body.appendChild(e); return e; }
  function closeSheet() { var e = document.getElementById('advS'); if (e) e.remove(); }
  function station(b, i, s) {
    var I = info(b), A = stArr(b, s), key = b.key + ':' + s, dn = cnt(A), full = dn === A.length, opened = (D.my.ch || {})[key], isBr = BR.indexOf(s) >= 0;
    var nx = A.filter(function (p) { return !isS(p.id); })[0], qAns = key in (D.my.q || {}), gs = D.guest && D.guest.k === b.key && D.guest.st === s;
    var h = '<button class="advX" id="advSx">✕</button><span class="advTag">' + esc(nameOf(b, i)) + ' · ' + (s + 1) + '-bekat</span>' +
      '<div class="advG"><div class="pic">' + guideHtml(b, i) + '</div><div class="bub"><b>' + esc(guideName(b, i)) + '</b>' + esc(lineOf(b, i, s)) + '</div></div>';
    if (gs) h += '<div class="advNote aY"><b>Bugungi mehmon shu bekatda!</b> Bugun bu yerdagi masalalar uchun tanga ×' + (D.rw.guest || 2) + '.</div>';
    if (isBr) { var fx = A.slice(0, 3).every(function (p) { return isS(p.id) && (stars()[p.id] || 0) >= 3; }); h += '<div class="advNote' + (fx ? ' aG' : '') + '">' + (fx ? '<b>Ko‘prik tuzatildi!</b> Sandiq 2 barobar bo‘ladi.' : '<b>Ko‘prik buzilgan.</b> Birinchi 3 masalani xatosiz (★★★) yechsang, ko‘prik tuziladi va sandiq 2 barobar bo‘ladi.') + '</div>'; }
    if (!qAns && D.qn > 0) h += '<div class="advQ" id="advQ"><h4>Yo‘lboshchining savoli</h4><div style="opacity:.6;font-size:13px">Yuklanmoqda…</div></div>';
    h += '<div style="font-weight:800;font-size:14px;margin:4px 0 8px;display:flex;justify-content:space-between"><span>Masalalar</span><span style="color:#16a34a">' + dn + ' / ' + A.length + '</span></div><div class="advGr">';
    var fI = A.indexOf(nx);
    A.forEach(function (p, k) { var ok = isS(p.id), st = stars()[p.id] || (ok ? 1 : 0), lk = !C.admin && fI >= 0 && k > fI && !ok; h += '<button data-p="' + k + '" class="' + (ok ? 'aOk' : '') + (p === nx ? ' aNx' : '') + (lk ? ' aLk' : '') + '"' + (lk ? ' disabled' : '') + '>' + (lk ? '<svg viewBox="-9 -9 18 18" width="14" height="14"><rect x="-6" y="-2" width="12" height="9" rx="2" fill="#64748b"/><path d="M-3.5 -2 v-3 a3.5 3.5 0 0 1 7 0 v3" stroke="#64748b" stroke-width="2" fill="none"/></svg>' : (b.arr.indexOf(p) + 1) + (ok ? '<i>' + '★★★'.slice(0, st) + '<u>' + '★★★'.slice(st) + '</u></i>' : '')) + '</button>'; });
    h += '</div>';
    if (full && !opened) h += '<button class="advBtn aG" id="advOpen">Sandiqni ochish</button>';
    else if (nx) h += '<button class="advBtn" id="advPlay"' + (!qAns && D.qn > 0 ? ' disabled' : '') + '>' + (dn ? 'Davom: ' : 'Boshlash: ') + (b.arr.indexOf(nx) + 1) + '-masala</button>' + (!qAns && D.qn > 0 ? '<div style="text-align:center;font-size:12.5px;opacity:.6;margin-top:6px">Avval yo‘lboshchining savoliga javob bering</div>' : '');
    else h += '<div class="advNote aG">Bekat tugatildi' + (opened > 0 ? ' · sandiqdan ' + opened + ' tanga olindi' : '') + '</div><button class="advBtn aO" id="advSx2">Xaritaga qaytish</button>';
    var e = sheet(h);
    e.querySelector('#advSx').onclick = closeSheet;
    var x2 = e.querySelector('#advSx2'); if (x2) x2.onclick = closeSheet;
    [].forEach.call(e.querySelectorAll('[data-p]'), function (bt) { bt.onclick = function () { if (!qAns && D.qn > 0) return toast('Avval yo‘lboshchining savoliga javob bering'); go(b, i, s, A[+bt.getAttribute('data-p')]); }; });
    var pb = e.querySelector('#advPlay'); if (pb) pb.onclick = function () { go(b, i, s, nx); };
    var ob = e.querySelector('#advOpen'); if (ob) ob.onclick = function () { chest(b, i, s); };
    if (!qAns && D.qn > 0) {
      C.api('/api/adv/q', { k: b.key, st: s }).then(function (d) {
        var q = e.querySelector('#advQ'); if (!q) return;
        if (!d || d.error || d.none || d.done != null) { if (d && d.done != null) { D.my.q[key] = d.done; } if (d && d.none) D.qn = 0; return station(b, i, s); }
        q.innerHTML = '<h4>' + esc(d.t) + '</h4>' + d.a.map(function (a, k) { return '<button data-a="' + k + '">' + esc(a) + '</button>'; }).join('');
        [].forEach.call(q.querySelectorAll('[data-a]'), function (bt) {
          bt.onclick = function () {
            [].forEach.call(q.querySelectorAll('[data-a]'), function (x) { x.disabled = true; });
            C.api('/api/adv/ans', { k: b.key, st: s, a: +bt.getAttribute('data-a') }).then(function (r) {
              if (!r || r.error) { toast((r && r.error) || 'Xato'); return station(b, i, s); }
              D.my = r.my || D.my; if (!(key in D.my.q)) D.my.q[key] = r.ok ? 1 : 0;
              var bs = q.querySelectorAll('[data-a]'); if (bs[r.right]) bs[r.right].className = 'aOk'; if (!r.ok) bt.className = 'aNo';
              q.insertAdjacentHTML('beforeend', '<p><b style="color:' + (r.ok ? '#16a34a' : '#dc2626') + '">' + (r.ok ? 'To‘g‘ri! +' + r.gain + ' tanga' : 'Afsus, noto‘g‘ri.') + '</b> ' + esc(r.x || '') + '</p>');
              if (r.gain && C.coins) C.coins(r.gain);
              var pb2 = e.querySelector('#advPlay'); if (pb2) { pb2.disabled = false; if (pb2.nextSibling) pb2.nextSibling.remove && pb2.nextSibling.remove(); }
              qAns = true;
            });
          };
        });
      });
    }
  }
  function go(b, i, s, p) { if (!p) return; closeSheet(); C.play(p, b, { k: b.key, i: i, st: s, arr: stArr(b, s) }); }

  // ---------- sandiq
  function chest(b, i, s) {
    C.api('/api/adv/chest', { k: b.key, st: s }).then(function (r) {
      if (!r || r.error) return toast((r && r.error) || 'Xato');
      D.my = r.my || D.my; closeSheet(); if (C.coins) C.coins(r.gain);
      var e = document.createElement('div'); e.className = 'advChest';
      var cn = ''; for (var k = 0; k < 9; k++) cn += '<circle class="cn" cx="100" cy="92" r="9" fill="#fbbf24" stroke="#b45309" stroke-width="2.4" style="--x:' + Math.round(Math.cos(k / 9 * Math.PI - Math.PI) * 70) + 'px;--y:' + Math.round(-40 - Math.sin(k / 9 * Math.PI) * 60) + 'px;animation-delay:' + (k * .06).toFixed(2) + 's"/>';
      e.innerHTML = '<svg viewBox="0 0 200 170" width="230" style="overflow:visible"><g class="bx"><rect x="40" y="90" width="120" height="66" rx="8" fill="#a0612c" stroke="#e0a948" stroke-width="5"/><rect x="92" y="104" width="16" height="20" rx="3" fill="#e0a948"/>' + cn + '<path class="lid" d="M40 90 q60 -56 120 0z" fill="#b8733a" stroke="#e0a948" stroke-width="5"/></g></svg>' +
        '<h2>' + (s + 1) + '-bekat tugadi!</h2><p style="font-size:22px;font-weight:900;color:#fde68a">+' + r.gain + ' tanga</p><p>' + (r.full ? 'Hammasi ★★★ — to‘la sandiq!' : 'Kichik sandiq. Xatosiz yechsangiz, sandiq to‘la bo‘ladi.') + '</p>' + (r.br ? '<p style="color:#86efac">Ko‘prik tuzatildi — mukofot 2 barobar!</p>' : '') +
        '<button class="advBtn" id="advCg">' + (s + 1 < info(b).ns ? (s + 1 === info(b).cs ? 'Qal‘a sari' : (s + 2) + '-bekatga yo‘l') : 'Xaritaga') + '</button>';
      document.body.appendChild(e);
      setTimeout(function () { e.classList.add('op'); }, 900);
      e.querySelector('#advCg').onclick = function () { e.remove(); landView(b, i); };
    });
  }

  // ---------- qal'a
  function castle(b, i) {
    var I = info(b), A = stArr(b, I.cs), my = D.my, won = !!(my.cs || {})[b.key], tr = my.tr && my.tr.k === b.key ? my.tr : null, op = stOpen(b, I.cs), bo = BOSS[bossOf(i)], li = L(b).img || {};
    var h = '<div class="advCst">' + '<svg viewBox="0 0 360 190" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><circle cx="300" cy="44" r="24" fill="#f3f0d0"/><g fill="#5e5470"><rect x="70" y="70" width="220" height="130"/><rect x="50" y="40" width="44" height="160"/><rect x="266" y="40" width="44" height="160"/></g><g fill="#2a1f45"><rect x="54" y="32" width="10" height="12"/><rect x="78" y="32" width="10" height="12"/><rect x="270" y="32" width="10" height="12"/><rect x="294" y="32" width="10" height="12"/></g></svg>' +
      '<div style="position:absolute;left:50%;bottom:0;width:120px;height:150px;transform:translateX(-50%)">' + (li.boss ? '<img src="' + img(li.boss) + '" style="width:100%;height:100%;object-fit:contain">' : bossSvg(bossOf(i))) + '</div><button class="advX" id="advSx" style="position:absolute;right:12px;top:12px">✕</button></div>';
    h += '<span class="advTag">' + esc(nameOf(b, i)) + ' · Qal‘a · ' + (b.arr.indexOf(A[0]) + 1) + '–' + (b.arr.indexOf(A[A.length - 1]) + 1) + '</span><div class="advG" style="margin-bottom:8px"><div class="bub"><b>' + bo.n + '</b>' + esc((L(b).lines || [])[9] || bo.t) + '</div></div>';
    h += '<div class="advNote">' + A.length + ' ta jumboq ketma-ket beriladi. Xato yoki ko‘rsatma — bitta xato. 3 ta xato bo‘lsa, sinov boshidan boshlanadi.' + (won ? '' : ' G‘alaba: <b>' + D.rw.castle + ' tanga</b> va o‘lka bayrog‘i.') + '</div>';
    if (tr) { h += '<div class="advBar">' + A.map(function (_, k) { return '<b class="' + (k < tr.i ? 'aG' : k === tr.i ? 'aY' : '') + '"></b>'; }).join('') + '</div><div style="font-size:13px;opacity:.7;margin-bottom:6px">' + tr.i + '/' + A.length + ' · xato: ' + tr.err + ' / 3</div>'; }
    if (won) h += '<div class="advNote aG"><b>Qal‘a zabt etilgan!</b> Yana sinab ko‘rishingiz mumkin (mukofotsiz).</div>';
    if (!op) h += '<div class="advNote aY">Qal‘a hali yopiq: ' + I.cs + '-bekatdagi hamma masalani yeching.</div><button class="advBtn aO" id="advSx2">Xaritaga qaytish</button>';
    else if (tr) h += '<button class="advBtn" id="advTrGo">Davom etish (' + (tr.i + 1) + '-jumboq)</button><button class="advBtn aO" id="advTrNew">Qaytadan boshlash</button>';
    else h += '<button class="advBtn" id="advTrNew">Sinovni boshlash</button>';
    var e = sheet(h);
    e.querySelector('#advSx').onclick = closeSheet;
    var x2 = e.querySelector('#advSx2'); if (x2) x2.onclick = closeSheet;
    var gg = e.querySelector('#advTrGo'); if (gg) gg.onclick = function () { trialPlay(b, i, tr.i); };
    var nn = e.querySelector('#advTrNew'); if (nn) nn.onclick = function () {
      nn.disabled = true;
      C.api('/api/adv/castle', { k: b.key }).then(function (r) { if (!r || r.error) { nn.disabled = false; return toast((r && r.error) || 'Xato'); } D.my = r.my; trialPlay(b, i, 0); });
    };
  }
  function trialPlay(b, i, k) { var I = info(b), A = stArr(b, I.cs), p = A[k]; if (!p) return landView(b, i); closeSheet(); C.play(p, b, { k: b.key, i: i, st: I.cs, arr: [p], trial: 1 }); }
  function victory(b, i, tr) {
    var e = document.createElement('div'); e.className = 'advChest op';
    e.innerHTML = '<div style="width:150px;height:170px">' + bossSvg(bossOf(i)) + '</div><h2>Qal‘a zabt etildi!</h2><p>' + esc(nameOf(b, i)) + ' o‘lkasi sizniki. Xatolar: ' + tr.err + ' / 3.</p>' + (tr.gain ? '<p style="font-size:22px;font-weight:900;color:#fde68a">+' + tr.gain + ' tanga</p>' : '<p>Bu qal‘a avval zabt etilgan — mukofot bir marta beriladi.</p>') + '<button class="advBtn" id="advCg">Xaritaga</button>';
    document.body.appendChild(e); e.querySelector('#advCg').onclick = function () { e.remove(); worldView(); };
  }

  // masala yechilgandan keyin (menu.js chaqiradi): xabar qo'shadi va kerak bo'lsa xaritaga qaytaradi
  function solved(p, d, ctx, add, still) {
    if (!D || !ctx) return;
    C._sv = {}; sv().forEach(function (id) { C._sv[id] = 1; });
    var ad = (d && d.adv) || {}, b = null, i = ctx.i;
    idxBooks(W).forEach(function (x) { if (x.key === ctx.k) b = x; });
    if (!b) WL.forEach(function (w) { idxBooks(w).forEach(function (x) { if (x.key === ctx.k) { b = x; W = w; } }); });
    if (ad.guest) add('<div style="font-size:14px;color:#fde68a;margin-top:4px">Kunlik mehmon: +' + ad.guest + ' tanga qo‘shimcha</div>');
    if (!b) return;
    if (ctx.trial && ad.tr) {
      var t = ad.tr; D.my.tr = t.st === 'run' ? { k: b.key, i: t.i, err: t.err } : null; if (t.st === 'win') D.my.cs[b.key] = 1;
      if (t.st === 'run') { add('<div style="font-size:14px;margin-top:6px">Qal‘a: ' + t.i + '/' + t.n + ' · xato: ' + t.err + ' / 3' + (t.bad ? ' <span style="color:#fca5a5">(bu jumboq xato hisoblandi)</span>' : '') + '</div>'); setTimeout(function () { if (still()) trialPlay(b, i, t.i); }, 1800); }
      else if (t.st === 'fail') { add('<div style="font-size:14px;margin-top:6px;color:#fca5a5">3 ta xato — qal‘a sinovi boshidan boshlanadi</div>'); setTimeout(function () { if (still()) { C.enter(); landView(b, i, function () { castle(b, i); }); } }, 2400); }
      else { add('<div style="font-size:15px;margin-top:6px;color:#86efac;font-weight:800">Qal‘a zabt etildi!</div>'); setTimeout(function () { if (still()) { C.enter(); landView(b, i); victory(b, i, t); } }, 1600); }
      return;
    }
    var A = stArr(b, ctx.st);
    if (A.length && cnt(A) === A.length && !(D.my.ch || {})[b.key + ':' + ctx.st]) {
      add('<div style="font-size:14px;margin-top:6px;color:#fde68a">Bekat tugadi — sandiq sizni kutmoqda!</div>');
      setTimeout(function () { if (still()) { C.enter(); landView(b, i, function () { chest(b, i, ctx.st); }); } }, 2000);
    }
  }

  // ---------- admin
  function shrink(file, max, cb) {
    var fr = new FileReader(); fr.onload = function () {
      var im = new Image(); im.onload = function () {
        var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var q = .85, u = c.toDataURL('image/webp', q); if (!/^data:image\/webp/.test(u)) u = c.toDataURL('image/jpeg', q);
        while (u.length > 380000 && q > .35) { q -= .1; u = c.toDataURL(/webp/.test(u) ? 'image/webp' : 'image/jpeg', q); }
        cb(u.length > 390000 ? null : u);
      }; im.src = fr.result;
    }; fr.readAsDataURL(file);
  }
  function admin(b, i, tab) {
    tab = tab || (b ? 'land' : 'lands');
    var h = '<button class="advX" id="advSx">✕</button><div style="font-weight:900;font-size:18px;margin-bottom:10px">Sarguzasht — tahrir</div><div class="advTb" style="position:static;padding:0 0 12px;background:none;box-shadow:none">' +
      [['lands', 'O‘lkalar'], ['qs', 'Savollar (' + D.qn + ')'], ['rw', 'Mukofotlar']].map(function (x) { return '<button data-t="' + x[0] + '" class="' + (tab === x[0] || (tab === 'land' && x[0] === 'lands') ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="advA">';
    if (tab === 'lands') {
      h += '<div style="font-size:13px;opacity:.7;margin-bottom:8px">' + WORLD[W].t + ' — o‘lkani tanlang</div>';
      idxBooks(W).forEach(function (bb, ii) { var l = L(bb); h += '<div class="it" data-ed="' + ii + '" style="cursor:pointer"><b>' + (ii + 1) + '. ' + esc(nameOf(bb, ii)) + '</b><em style="color:#6b7280">' + esc(guideName(bb, ii)) + (l.img && (l.img.land || l.img.guide || l.img.boss) ? ' · rasm bor' : '') + ((l.lines || []).some(Boolean) ? ' · ertak o‘zgartirilgan' : '') + '</em></div>'; });
    } else if (tab === 'land') {
      var l = L(b), I0 = l.img || {};
      h += '<div style="font-weight:800;margin-bottom:8px">' + (i + 1) + '-o‘lka</div><label>O‘lka nomi</label><input id="aN" maxlength="40" placeholder="' + esc(nameOf({ key: '' }, i)) + '" value="' + esc(l.name || '') + '">' +
        '<label>Yo‘lboshchi ismi</label><input id="aG" maxlength="40" placeholder="' + esc(TH[themeOf(i)].gd) + '" value="' + esc(l.guide || '') + '">';
      [['land', 'O‘lka rasmi (xarita va fon)'], ['guide', 'Yo‘lboshchi rasmi'], ['boss', 'Qal‘a xo‘jayini rasmi']].forEach(function (f) {
        h += '<label>' + f[1] + '</label><div class="aRow"><div class="pv" id="pv_' + f[0] + '">' + (I0[f[0]] ? '<img src="' + img(I0[f[0]]) + '">' : (f[0] === 'guide' ? guideSvg(themeOf(i)) : f[0] === 'boss' ? bossSvg(bossOf(i)) : '')) + '</div><button class="sm" data-up="' + f[0] + '">Rasm tanlash</button>' + (I0[f[0]] ? '<button class="sm" data-rm="' + f[0] + '">O‘chirish</button>' : '') + '<input type="file" accept="image/*" id="fi_' + f[0] + '" style="display:none"></div>';
      });
      h += '<label>Ertak matnlari (bo‘sh qoldirsangiz — odatiy matn)</label>';
      var ns = info(b).ns, cs = info(b).cs;
      for (var s = 0; s < Math.max(ns, 1); s++) { var isC = s === cs; h += '<div style="font-size:12px;opacity:.65;margin-top:4px">' + (isC ? 'Qal‘a xo‘jayini' : (s + 1) + '-bekat') + '</div><textarea rows="2" data-ln="' + (isC ? 9 : s) + '" placeholder="' + esc(isC ? BOSS[bossOf(i)].t : lineOf({ key: b.key }, i, s)) + '">' + esc((l.lines || [])[isC ? 9 : s] || '') + '</textarea>'; }
      h += '<button class="advBtn" id="aSave">Saqlash</button><button class="advBtn aO" data-t="lands">Orqaga</button>';
    } else if (tab === 'qs') {
      h += '<button class="advBtn" id="aQn" style="margin:0 0 12px">+ Yangi savol</button><div id="aQf"></div>';
      (D.qs || []).forEach(function (q) { h += '<div class="it"><b>' + esc(q.t) + '</b><em>' + esc(q.a[0]) + '</em><div style="font-size:12px;opacity:.6;margin-top:3px">' + esc(q.a.slice(1).join(' · ')) + '</div><div style="margin-top:6px"><button class="sm" data-qe="' + esc(q.id) + '">Tahrirlash</button> <button class="sm" data-qd="' + esc(q.id) + '" style="color:#dc2626">O‘chirish</button></div></div>'; });
    } else {
      var w = D.rw; h += [['q', 'To‘g‘ri javob uchun'], ['big', 'To‘la sandiq (hammasi ★★★)'], ['small', 'Kichik sandiq'], ['castle', 'Qal‘a g‘alabasi'], ['guest', 'Kunlik mehmon (necha barobar)']].map(function (x) { return '<label>' + x[1] + '</label><input type="number" min="0" data-rw="' + x[0] + '" value="' + w[x[0]] + '">'; }).join('') + '<button class="advBtn" id="aRw">Saqlash</button>';
    }
    h += '</div>';
    var e = sheet(h), pend = {};
    e.querySelector('#advSx').onclick = function () { closeSheet(); LAND ? landView(LAND.b, LAND.i) : worldView(); };
    [].forEach.call(e.querySelectorAll('[data-t]'), function (x) { x.onclick = function () { admin(b, i, x.getAttribute('data-t')); }; });
    [].forEach.call(e.querySelectorAll('[data-ed]'), function (x) { x.onclick = function () { var ii = +x.getAttribute('data-ed'); admin(idxBooks(W)[ii], ii, 'land'); }; });
    [].forEach.call(e.querySelectorAll('[data-up]'), function (x) { var f = x.getAttribute('data-up'), fi = e.querySelector('#fi_' + f); x.onclick = function () { fi.click(); }; fi.onchange = function () { if (!fi.files[0]) return; shrink(fi.files[0], f === 'land' ? 900 : 420, function (u) { if (!u) return toast('Rasm juda katta'); pend[f] = u; e.querySelector('#pv_' + f).innerHTML = '<img src="' + u + '">'; }); }; });
    [].forEach.call(e.querySelectorAll('[data-rm]'), function (x) { x.onclick = function () { var f = x.getAttribute('data-rm'); pend[f] = ''; e.querySelector('#pv_' + f).innerHTML = ''; x.remove(); }; });
    var sv2 = e.querySelector('#aSave'); if (sv2) sv2.onclick = function () {
      var lines = []; [].forEach.call(e.querySelectorAll('[data-ln]'), function (t) { lines[+t.getAttribute('data-ln')] = t.value.trim(); }); for (var k = 0; k < 10; k++) if (lines[k] == null) lines[k] = '';
      sv2.disabled = true; sv2.textContent = 'Saqlanmoqda…';
      C.api('/api/adv/land', { k: b.key, name: e.querySelector('#aN').value.trim(), guide: e.querySelector('#aG').value.trim(), lines: lines, img: pend }).then(function (r) { if (!r || r.error) { sv2.disabled = false; sv2.textContent = 'Saqlash'; return toast((r && r.error) || 'Xato'); } setD(r); toast('Saqlandi'); admin(b, i, 'lands'); });
    };
    var rw = e.querySelector('#aRw'); if (rw) rw.onclick = function () { var o = {}; [].forEach.call(e.querySelectorAll('[data-rw]'), function (x) { o[x.getAttribute('data-rw')] = +x.value; }); C.api('/api/adv/rw', o).then(function (r) { if (r && !r.error) { setD(r); toast('Saqlandi'); } }); };
    var qn = e.querySelector('#aQn'); if (qn) qn.onclick = function () { qForm(e, null, b, i); };
    [].forEach.call(e.querySelectorAll('[data-qe]'), function (x) { x.onclick = function () { var id = x.getAttribute('data-qe'); qForm(e, (D.qs || []).filter(function (q) { return q.id === id; })[0], b, i); }; });
    [].forEach.call(e.querySelectorAll('[data-qd]'), function (x) { x.onclick = function () { if (!confirm('Savol o‘chirilsinmi?')) return; C.api('/api/adv/qs', { op: 'del', id: x.getAttribute('data-qd') }).then(function (r) { if (r && !r.error) { setD(r); admin(b, i, 'qs'); } }); }; });
  }
  function qForm(e, q, b, i) {
    var f = e.querySelector('#aQf'), a = q ? q.a : ['', '', '', ''];
    f.innerHTML = '<div class="it" style="border-color:#c7c2ff"><label>Savol</label><textarea id="qT" rows="2">' + esc(q ? q.t : '') + '</textarea>' + [0, 1, 2, 3].map(function (k) { return '<label><input type="radio" name="qC" value="' + k + '"' + (k === 0 ? ' checked' : '') + ' style="width:auto;margin:0 6px 0 0">' + (k + 1) + '-javob' + (k === 0 ? ' (to‘g‘ri javobni belgilang)' : '') + '</label><input data-qa="' + k + '" value="' + esc(a[k] || '') + '">'; }).join('') + '<label>Izoh (javobdan keyin ko‘rinadi)</label><input id="qX" value="' + esc(q ? q.x || '' : '') + '"><button class="advBtn" id="qS">' + (q ? 'Saqlash' : 'Qo‘shish') + '</button></div>';
    f.scrollIntoView({ block: 'start' });
    f.querySelector('#qS').onclick = function () {
      var ans = [].map.call(f.querySelectorAll('[data-qa]'), function (x) { return x.value.trim(); }), c = +(f.querySelector('[name=qC]:checked') || { value: 0 }).value;
      if (!ans[c]) return toast('Belgilangan to‘g‘ri javob bo‘sh');
      var keep = []; var cc = 0; ans.forEach(function (x, k) { if (x) { if (k === c) cc = keep.length; keep.push(x); } });
      C.api('/api/adv/qs', { op: q ? 'edit' : 'add', id: q && q.id, t: f.querySelector('#qT').value, a: keep, c: cc, x: f.querySelector('#qX').value }).then(function (r) { if (!r || r.error) return toast((r && r.error) || 'Xato'); setD(r); admin(b, i, 'qs'); });
    };
  }
  function setD(r) { D = { lands: r.lands, rw: r.rw, my: r.my, guest: r.guest, admin: r.admin, qn: r.qn, qs: r.qs }; }

  // ---------- kirish
  function open(ctx) {
    C = ctx; C._sv = {}; sv().forEach(function (id) { C._sv[id] = 1; });
    var ov = C.ov; css();
    var M = window.spPzMap; if (M && M.setHero) M.setHero(C.S.heroAv, sv().length, function (av) { C.S.heroAv = av; C.api('/api/pzmap/hero', { av: av }); });
    var goTo = function () {
      if (ctx.land) { var f = null; WL.forEach(function (w) { idxBooks(w).forEach(function (x, ii) { if (x.key === ctx.land.k) { f = [x, ii]; W = w; } }); }); if (f) return landView(f[0], f[1], ctx.land.then); }
      worldView();
    };
    if (D && ctx.cached) return goTo();
    ov.innerHTML = '<div style="padding:40px;opacity:.7;text-align:center">Xarita yuklanmoqda…</div>';
    C.api('/api/adv').then(function (r) { if (!r || r.error) { ov.innerHTML = '<div style="padding:40px;text-align:center">Xarita yuklanmadi</div>'; return; } setD(r); goTo(); });
  }
  window.spAdv = { open: open, solved: solved, close: closeSheet };
})();
