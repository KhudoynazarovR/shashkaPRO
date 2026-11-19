/* mghub.js — 🎮 Mini o'yinlar markazi: 🧠 Xotira, 🏁 Ugolki, ⭕ Gomoku, ⚪ Go 9×9.
   Markaz: o'yin plitkalari (reyting + hozir o'ynayotganlar), 🏆 shohsupa (o'yin bo'yicha) va o'rningiz.
   O'yin sahifasi: reytingingiz, vaqt, «▶ O‘ynash» (raqib qidirish), «👥 Do‘stni chaqirish», kutayotganlar (Qo‘shilish),
   onlayn o'yinchilar (⚔ Chaqirish), 📖 qoidalar. Chaqiruv oynasi: Qabul / Rad (Telegramga ham boradi).
   Server — mgplay.js: zal ulanishi orqali (window.__lbSend → mg… xabarlar), javoblar lobbyclient.js → window.spMgMsg. */
;(function () {
  if (window.spMgHub) return;
  var G = {
    mm: { ic: '🧠', n: 'Xotira', s: 'Juftliklarni toping', bg: '#3b82f6,#1e3a8a', ib: '#bfdbfe,#3b82f6', tcs: ['30', '2+2', '3+2', '5+3'] },
    ug: { ic: '🏁', n: 'Ugolki', s: 'Burchakdan burchakka', bg: '#ef4444,#991b1b', ib: '#fecaca,#ef4444', tcs: ['3+2', '5+3', '10+0'] },
    gomoku: { ic: '⭕', n: 'Gomoku', s: '5 talik', bg: '#14b8a6,#115e59', ib: '#99f6e4,#14b8a6', tcs: ['1+1', '3+2', '5+3'] },
    go: { ic: '⚪', n: 'Go 9×9', s: 'Hudud uchun kurash', bg: '#f59e0b,#92400e', ib: '#fde68a,#f59e0b', tcs: ['3+2', '5+3', '10+5'] }
  };
  var ORD = ['mm', 'ug', 'gomoku', 'go'];
  var RULES = {
    mm: ['Kartalar yopiq holda aralashtirilgan, har birining jufti bor. Doska: 4×6 (12 juftlik) yoki 6×6 (18 juftlik).', 'Navbatingizda 2 ta kartani ochasiz: bir xil bo‘lsa — 1 ochko va yana yurasiz, har xil bo‘lsa — kartalar yopiladi, navbat raqibga o‘tadi.', 'Hamma juftliklar topilganda ko‘p ochko to‘plagan yutadi, teng bo‘lsa — durang.', '30 s — har yurishga 30 soniya. Vaqt tugasa, navbat raqibga o‘tadi.', '2+2, 3+2 va 5+3 — har o‘yinchining o‘z soati: 2, 3 yoki 5 daqiqa, har yurishdan keyin +2 soniya (5+3 da +3). Soati tugagan o‘yinchining qolgan juftliklari raqibga o‘tadi.', 'Rasmlarni har kim o‘zi tanlaydi: raqibingiz boshqa rasmlarni ko‘rishi mumkin.'],
    ug: ['Doska 8×8. Har tomonda 12 ta dona: oqlar chap yuqori, qoralar o‘ng pastki burchakda (3×4).', 'Dona 1 katak yonga, oldinga yoki orqaga yuradi (diagonal emas) yoki yonidagi dona ustidan bo‘sh katakka sakraydi — bir yurishda ketma-ket bir necha marta. Urish yo‘q.', 'Hamma 12 donani raqib burchagiga birinchi olib kirgan yutadi. Oq to‘ldirsa, qoraga bitta yurish beriladi — u ham to‘ldirsa, durang.', '40-yurishdan keyin o‘z uyida dona qolgan o‘yinchi yutqazadi. 80 yurishdan keyin manzilga ko‘proq dona kiritgan yutadi.'],
    gomoku: ['Doska 15×15. Qora boshlaydi, navbat bilan bittadan tosh qo‘yiladi.', 'Gorizontal, vertikal yoki diagonal bo‘yicha 5 ta (yoki ko‘proq) toshni qatorga birinchi tergan yutadi.', 'Doska to‘lib qolsa — durang.'],
    go: ['Doska 9×9, qora boshlaydi. Tosh chiziqlar kesishgan nuqtaga qo‘yiladi va surilmaydi.', 'Raqib toshlarini har tomondan o‘rab olsangiz (bo‘sh nuqtasi qolmasa), ular olib tashlanadi.', 'Ko qoidasi: oldingi holatni darhol takrorlab bo‘lmaydi.', 'Ikkala o‘yinchi ketma-ket «Pas» desa, hisob: toshlar + o‘ralgan hudud, oqqa 7.5 ochko (komi). Ko‘p ochko to‘plagan yutadi.']
  };
  var RNOTE = '⭐ Reyting: do‘st bilan onlayn o‘yinlar hisoblanadi. Bir raqib bilan kuniga 3 ta o‘yin, juda qisqa o‘yin va kelmaganlik hisoblanmaydi.';
  var INFO = null, cur = null, qSt = null, outV = null, inV = {}, pollT = 0, tickT = 0;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function send(m) { if (window.__lbSend) window.__lbSend(m); }
  function hap(t) { try { Telegram.WebApp.HapticFeedback.impactOccurred(t || 'light'); } catch (e) {} }
  function tcs(g) { return (INFO && INFO.games && INFO.games[g] && INFO.games[g].tcs) || G[g].tcs; }
  var DEF = { mm: '30', ug: '3+2', gomoku: '3+2', go: '5+3' };   // eng ko'p o'ynaladigan vaqt — birinchi kirganda shu tanlanadi
  function tcOf(g) { var L = tcs(g), t = ls('mgTc_' + g); return L.indexOf(t) >= 0 ? t : L.indexOf(DEF[g]) >= 0 ? DEF[g] : L[0]; }
  function tcTxt(g, t) { return '⏱ ' + (g === 'mm' && t === '30' ? '30 s' : t); }
  // 🧠 Xotira: doska va rasmlar (memori.js bilan bir xil sozlama — localStorage spMemCfg2; rasmlar ro'yxati memori.js da)
  var SZ = [{ k: '4x6', t: '4×6', p: 12 }, { k: '6x6', t: '6×6', p: 18 }];
  var TH = [['shashka', '♟', 'Shashka'], ['animals', '🐶', 'Hayvonlar'], ['fruits', '🍐', 'Mevalar'], ['romantic', '🌹', 'Romantik'], ['letters', '🔤', 'Harflar'], ['sport', '⚽', 'Sport'],
    ['transport', '🚗', 'Transport'], ['food', '🍔', 'Taomlar'], ['flags', '🌍', 'Bayroqlar'], ['smileys', '😀', 'Smayliklar'], ['nature', '🌳', 'Tabiat']];
  var MMSUB = { '30': 'har yurishga', '2+2': '2 daq + 2 s', '3+2': '3 daq + 2 s', '5+3': '5 daq + 3 s' };
  function memCfg(p) {
    if (window.spMemCfg) return window.spMemCfg(p);
    var c = {}; try { c = JSON.parse(localStorage.getItem('spMemCfg2') || '{}') || {}; } catch (e) {}
    if (p) { for (var k in p) c[k] = p[k]; try { localStorage.setItem('spMemCfg2', JSON.stringify(c)); } catch (e) {} }
    return c;
  }
  function szOf() { var s = memCfg().size; return s === '6x6' ? '6x6' : '4x6'; }
  function thOf() { var t = memCfg().theme; return TH.some(function (x) { return x[0] === t; }) ? t : 'shashka'; }
  function setTxt(g, tc, sz) { return (g === 'mm' ? String(sz || '4x6').replace('x', '×') + ' · ' : '') + tcTxt(g, tc); }
  function rt(o) { return o ? o.r + (o.p ? '<i>?</i>' : '') : '1500<i>?</i>'; }
  var COL = ['#2563eb', '#db2777', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04', '#dc2626'];
  function av(uid, name, sz, has) {
    var h = 0, s = String(uid || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return '<span class="mg-av" style="width:' + sz + 'px;height:' + sz + 'px;font-size:' + Math.round(sz * .4) + 'px;background:' + COL[h % COL.length] + '">' + esc(String(name || '?').trim().charAt(0).toUpperCase() || '?') +
      (has ? '<img src="/api/av/' + encodeURIComponent(uid) + '" alt="" onerror="this.remove()">' : '') + '</span>';
  }
  function bgOf() { var b = getComputedStyle(document.body); return 'background-color:' + b.backgroundColor + ';background-image:' + b.backgroundImage + ';background-size:' + b.backgroundSize + ';background-repeat:' + b.backgroundRepeat + ';background-attachment:fixed'; }

  var GLs = 'background:var(--spCard,rgba(14,22,82,.84));border:1px solid var(--spLine,rgba(232,196,106,.28));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 22px rgba(0,0,0,.28)';
  var GR = 'linear-gradient(180deg,#5fbf4a,#3a8f2e)';
  var css = document.createElement('style'); css.id = 'mgCss';
  css.textContent =
    '.mgO{position:fixed;inset:0;z-index:99998;overflow-y:auto;-webkit-overflow-scrolling:touch;color:#fff;box-sizing:border-box;padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(96px + env(safe-area-inset-bottom,0px))}' +
    '.mgO *{box-sizing:border-box}.mgO .mg-hd{display:flex;align-items:center;gap:12px;margin-bottom:14px}.mgO .mg-bk{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none;cursor:pointer;' + GLs + '}' +
    '.mgO .mg-hd b{font-size:22px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mgO .mg-ru{font-size:13px;font-weight:700;padding:8px 12px;border-radius:12px;cursor:pointer;flex:none;' + GLs + '}' +
    '.mgO .mg-h{display:flex;justify-content:space-between;align-items:baseline;margin:4px 2px 10px;font-weight:700;font-size:16px}.mgO .mg-h a{font-size:12px;font-weight:600;color:#e8c46a;cursor:pointer}.mgO .mg-cnt{font-style:normal;font-size:12px;font-weight:800;background:#16a34a;border-radius:9px;padding:1px 7px;margin-left:6px;vertical-align:2px}' +
    '.mg-av{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:800;box-shadow:0 0 0 2px #e8c46a;flex:none;overflow:hidden}.mg-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '.mgO .mg-gr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}' +
    '.mgO .mg-t{position:relative;border-radius:20px;padding:13px;min-height:158px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 5px 0 rgba(0,0,0,.28),0 10px 18px rgba(0,0,0,.25);transition:transform .12s}.mgO .mg-t:active{transform:scale(.97)}' +
    '.mgO .mg-ic{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:27px;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 8px rgba(0,0,0,.28)}' +
    '.mgO .mg-ar{position:absolute;right:12px;top:12px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:17px}' +
    '.mgO .mg-t b{display:block;font-size:17px;font-weight:800;line-height:1.15;margin-top:8px}.mgO .mg-t small{display:block;margin-top:2px;font-size:11.5px;opacity:.9}' +
    '.mgO .mg-cp{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.mgO .mg-cp span{font-size:12px;font-weight:800;padding:5px 9px;border-radius:10px;background:rgba(0,0,0,.25);white-space:nowrap}.mgO i{font-style:normal;opacity:.5;font-size:.72em;margin-left:1px}' +
    '.mgO .mg-tb{display:flex;gap:6px;margin-bottom:6px}.mgO .mg-tb span{flex:1;text-align:center;padding:7px 0;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;' + GLs + '}.mgO .mg-tb span.on{background:#3a2a05;border-color:#f59e0b;color:#ffd54a}' +
    '.mgO .mg-pod{display:flex;align-items:flex-end;gap:8px;margin:28px 0 8px}.mgO .mg-pl{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0}.mgO .mg-pa{position:relative;margin-bottom:5px}.mgO .mg-cr{position:absolute;left:50%;top:-21px;transform:translateX(-50%);font-size:22px}' +
    '.mgO .mg-pl b{font-size:13.5px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mgO .mg-pl small{font-size:12px;font-weight:800;color:#ffd54a;margin-bottom:5px}' +
    '.mgO .mg-st{width:100%;border-radius:14px 14px 4px 4px;display:flex;flex-direction:column;align-items:center;padding-top:6px;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 14px rgba(0,0,0,.3)}.mgO .mg-st span{font-size:20px}.mgO .mg-st em{font-style:normal;font-size:20px;font-weight:900;opacity:.85}' +
    '.mgO .mg-p1 .mg-st{height:92px;background:linear-gradient(180deg,#fcd34d,#b45309)}.mgO .mg-p2 .mg-st{height:70px;background:linear-gradient(180deg,#e5e7eb,#6b7280)}.mgO .mg-p3 .mg-st{height:54px;background:linear-gradient(180deg,#fdba74,#9a3412)}.mgO .mg-pl.mg-e{opacity:.35}' +
    '.mgO .mg-me{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:14px;margin-top:8px;background:rgba(63,163,77,.18);border:1px solid rgba(63,163,77,.45);font-size:14.5px}.mgO .mg-me em{font-style:normal;font-weight:800;opacity:.75;min-width:26px}.mgO .mg-me span{flex:1;font-weight:700}' +
    '.mgO .mg-nt{margin:8px 4px 0;font-size:12px;color:var(--spMute,#cdbfae);text-align:center;line-height:1.4}' +
    '.mgO .mg-hero{display:flex;align-items:center;gap:14px;padding:14px;border-radius:20px;margin-bottom:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 5px 0 rgba(0,0,0,.28),0 10px 18px rgba(0,0,0,.25)}.mgO .mg-hero .mg-ic{width:62px;height:62px;font-size:36px;border-radius:18px}' +
    '.mgO .mg-hero small{display:block;font-size:12px;opacity:.85}.mgO .mg-hero b{display:block;font-size:28px;font-weight:900;line-height:1.1}.mgO .mg-hero em{display:block;font-style:normal;font-size:12px;opacity:.9;margin-top:2px}' +
    '.mgO .mg-lb{font-size:12px;font-weight:700;color:var(--spMute,#cdbfae);margin:0 2px 8px;letter-spacing:.3px}.mgO .mg-ts{display:flex;gap:6px;margin-bottom:12px}.mgO .mg-ts span{flex:1;text-align:center;padding:10px 0;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;' + GLs + '}.mgO .mg-ts span.on{background:#3a2a05;border-color:#f59e0b;color:#ffd54a}' +
    '.mgO .mg-ts span small{display:block;font-size:10.5px;font-weight:600;opacity:.75;margin-top:2px}.mgO .mg-ts.mm span{padding:8px 0 7px}' +
    '.mgO .mg-th{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:14px}.mgO .mg-th span{text-align:center;padding:7px 2px 6px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + GLs + '}' +
    '.mgO .mg-th span b{display:block;font-size:22px;line-height:1.2;margin-bottom:1px}.mgO .mg-th span.on{background:#3a2a05;border-color:#f59e0b;color:#ffd54a}' +
    '.mgO .mg-go{display:flex;flex-direction:column;align-items:center;padding:12px;border-radius:18px;font-size:20px;font-weight:900;cursor:pointer;background:' + GR + ';box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 5px 0 #2a6b20;margin-bottom:10px;user-select:none}.mgO .mg-go small{font-size:12px;font-weight:700;opacity:.9}.mgO .mg-go:active{transform:translateY(2px)}' +
    '.mgO .mg-go.q{background:linear-gradient(180deg,#d4a017,#a16207);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 5px 0 #6b4006}' +
    '.mgO .mg-fr{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:14px;font-size:15px;font-weight:800;margin-bottom:16px;cursor:pointer;' + GLs + '}' +
    '.mgO .mg-rw{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;margin-bottom:7px;' + GLs + '}.mgO .mg-rw .mg-tx{flex:1;min-width:0}.mgO .mg-rw .mg-tx b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mgO .mg-rw .mg-tx small{font-size:12px;color:var(--spMute,#cdbfae)}' +
    '.mgO .mg-jb{font-size:13px;font-weight:800;padding:8px 12px;border-radius:11px;background:#3fa34d;cursor:pointer;flex:none}.mgO .mg-em{padding:12px;border-radius:14px;font-size:13px;color:var(--spMute,#cdbfae);text-align:center;margin-bottom:12px;' + GLs + '}' +
    '.mgO .mg-onl{display:flex;gap:8px;overflow-x:auto;margin:0 -14px 10px;padding:2px 14px 6px;scrollbar-width:none}.mgO .mg-onl::-webkit-scrollbar{display:none}' +
    '.mgO .mg-pc{flex:0 0 112px;border-radius:14px;padding:10px 6px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;' + GLs + '}.mgO .mg-aw{position:relative;margin-bottom:3px}.mgO .mg-dot{position:absolute;right:0;bottom:1px;width:11px;height:11px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px #2a1d14}' +
    '.mgO .mg-pc b{font-size:12.5px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mgO .mg-pc small{font-size:11px;font-weight:700;color:#ffd54a}.mgO .mg-pc .mg-bz{font-size:10.5px;color:var(--spMute,#cdbfae);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}' +
    '.mgO .mg-ch{margin-top:5px;font-size:11.5px;font-weight:800;padding:6px 9px;border-radius:9px;background:#3fa34d;cursor:pointer}' +
    // oynalar (chaqiruv, javob kutish, qoidalar, ro'yxat)
    '.mgM{position:fixed;inset:0;z-index:2147482700;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;color:#fff;box-sizing:border-box}.mgM *{box-sizing:border-box}' +
    '.mgM .mg-md{width:100%;max-width:420px;border-radius:24px;padding:20px 18px 18px;text-align:center;background:var(--spFade,#1f160f);border:1px solid var(--spLine,rgba(232,196,106,.35));box-shadow:0 20px 50px rgba(0,0,0,.6)}' +
    '.mgM .mg-k{font-size:13px;font-weight:700;color:#e8c46a;letter-spacing:.4px}.mgM .mg-who{display:flex;flex-direction:column;align-items:center;gap:6px;margin:16px 0 12px}.mgM .mg-who b{font-size:19px}.mgM .mg-who small{font-size:13px;color:#ffd54a;font-weight:800}' +
    '.mgM .mg-gp{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:14px;font-size:17px;font-weight:900;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 4px 0 rgba(0,0,0,.3)}.mgM .mg-gp em{font-style:normal;font-size:14px;font-weight:800;background:rgba(0,0,0,.25);padding:3px 8px;border-radius:8px}' +
    '.mgM .mg-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin:16px 6px 6px;overflow:hidden}.mgM .mg-bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#fde047,#f59e0b);transition:width .9s linear}.mgM .mg-tm{font-size:12px;color:var(--spMute,#cdbfae)}' +
    '.mgM .mg-bb{display:flex;gap:8px;margin-top:14px}.mgM .mg-bb span{flex:1;padding:13px 0;border-radius:14px;font-size:16px;font-weight:900;cursor:pointer}.mgM .mg-bb .n{' + GLs + '}.mgM .mg-bb .y{background:' + GR + ';box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 4px 0 #2a6b20}' +
    '.mgM.mg-sh{align-items:flex-end;padding:0}.mgM .mg-shc{width:100%;max-height:82%;overflow-y:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));background:var(--spFade,#1f160f);border-top:1px solid var(--spLine,rgba(232,196,106,.3));text-align:left}' +
    '.mgM .mg-shh{display:flex;align-items:center;margin-bottom:12px}.mgM .mg-shh b{font-size:18px;flex:1}.mgM .mg-shh span{font-size:22px;padding:2px 8px;cursor:pointer}' +
    '.mgM .mg-ol{margin:0;padding:0 0 0 20px;font-size:14.5px;line-height:1.5}.mgM .mg-ol li{margin-bottom:8px}.mgM .mg-rn{margin-top:10px;padding:10px 12px;border-radius:12px;font-size:12.5px;line-height:1.45;color:var(--spMute,#cdbfae);background:rgba(255,255,255,.05)}' +
    '.mgM .mg-li{display:flex;align-items:center;gap:10px;padding:9px 4px;border-top:1px solid rgba(255,255,255,.07);font-size:14.5px}.mgM .mg-li:first-child{border-top:0}.mgM .mg-li em{font-style:normal;min-width:28px;text-align:center;font-weight:800;opacity:.75}.mgM .mg-li span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}.mgM .mg-li b i{font-style:normal;opacity:.5;font-size:.72em}.mgM .mg-li.me{background:rgba(63,163,77,.16);border-radius:10px}' +
    '.mgTo{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147482800;max-width:92%;padding:11px 16px;border-radius:14px;background:rgba(20,14,8,.95);border:1px solid rgba(232,196,106,.4);color:#fff;font-size:14px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.5)}';
  document.head.appendChild(css);

  function toast(t, ms) { var o = document.createElement('div'); o.className = 'mgTo'; o.innerHTML = t; document.body.appendChild(o); setTimeout(function () { o.remove(); }, ms || 3500); }
  function el(id) { return document.getElementById(id); }
  function overlay(id) { var o = el(id); if (!o) { o = document.createElement('div'); o.id = id; o.className = 'mgO'; document.body.appendChild(o); } o.style.cssText = bgOf(); return o; }
  function frame(url) {   // eski oynalar (do'st bilan o'yin) — ustma-ust iframe
    var o = document.createElement('div'); o.id = 'mxOv'; o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#161512';
    o.innerHTML = '<iframe src="' + url + '" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe><button style="position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:10px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;background:#000a;color:#fff;font-size:20px">✕</button>';
    o.querySelector('button').onclick = function () { o.remove(); refresh(); };
    document.body.appendChild(o);
  }
  function memori(opts) { var go = function () { window.spMemori(opts); }; if (window.spMemori) go(); else { var s = document.createElement('script'); s.src = '/memori.js?v=9'; s.onload = go; document.head.appendChild(s); } }

  // ---------------- 🎮 markaz
  function hub() {
    var o = overlay('mgHub'), I = INFO || {}, me = I.me || {}, act = I.act || {}, pg = G[ls('mgPod')] ? ls('mgPod') : 'ug';
    var h = '<div class="mg-hd"><div class="mg-bk" data-x="1">‹</div><b>🎮 Mini o‘yinlar</b></div><div class="mg-gr">';
    ORD.forEach(function (k) { var g = G[k]; h += '<div class="mg-t" data-g="' + k + '" style="background:linear-gradient(160deg,' + g.bg + ')"><span class="mg-ar">›</span><div><div class="mg-ic" style="background:linear-gradient(145deg,' + g.ib + ')">' + g.ic + '</div><b>' + g.n + '</b><small>' + g.s + '</small></div><div class="mg-cp"><span>⭐ ' + rt(me[k]) + '</span><span>🟢 ' + (act[k] || 0) + '</span></div></div>'; });
    h += '</div><div class="mg-h"><span>🏆 Shohsupa</span><a data-all="1">Hammasi ›</a></div><div class="mg-tb">' + ORD.map(function (k) { return '<span data-pg="' + k + '"' + (k === pg ? ' class="on"' : '') + '>' + G[k].n.replace(' 9×9', '') + '</span>'; }).join('') + '</div>';
    var T = (I.top && I.top[pg]) || [], P = [[1, 'mg-p2', '🥈'], [0, 'mg-p1', '🥇'], [2, 'mg-p3', '🥉']];
    h += '<div class="mg-pod">' + P.map(function (x) { var p = T[x[0]]; return '<div class="mg-pl ' + x[1] + (p ? '' : ' mg-e') + '"><div class="mg-pa">' + (x[0] === 0 && p ? '<span class="mg-cr">👑</span>' : '') + (p ? av(p.uid, p.name, x[0] === 0 ? 54 : 46, p.av) : av('', '?', x[0] === 0 ? 54 : 46)) + '</div><b>' + (p ? esc(p.name) : '—') + '</b><small>' + (p ? rt(p) : '&nbsp;') + '</small><div class="mg-st"><span>' + x[2] + '</span><em>' + (x[0] + 1) + '</em></div></div>'; }).join('') + '</div>';
    var m = me[pg] || {};
    h += '<div class="mg-me"><em>' + (m.rank || '—') + '</em><span>Siz' + (m.n ? '' : ' · hali o‘ynamagansiz') + '</span><b>' + rt(m) + '</b></div>';
    if (!T.length) h += '<div class="mg-nt">' + G[pg].ic + ' ' + G[pg].n + ' bo‘yicha hali reyting yo‘q — birinchi bo‘ling!</div>';
    h += '<div class="mg-nt">' + RNOTE + '</div>';
    o.innerHTML = h;
    o.querySelector('[data-x]').onclick = closeAll;
    [].forEach.call(o.querySelectorAll('[data-g]'), function (e) { e.onclick = function () { hap(); game(e.getAttribute('data-g')); }; });
    [].forEach.call(o.querySelectorAll('[data-pg]'), function (e) { e.onclick = function () { ls('mgPod', e.getAttribute('data-pg')); hub(); }; });
    o.querySelector('[data-all]').onclick = function () { topSheet(pg); };
  }
  function closeAll() { ['mgGame', 'mgHub'].forEach(function (id) { var e = el(id); if (e) e.remove(); }); cur = null; clearInterval(pollT); }

  // ---------------- 🎲 o'yin sahifasi
  function game(g) { cur = g; render(); send({ type: 'mgInfo', g: g }); clearInterval(pollT); pollT = setInterval(function () { if (!el('mgGame') && !el('mgHub')) return clearInterval(pollT); if (document.hidden) return; send({ type: 'mgInfo', g: cur || '' }); }, 4000); }
  function render() {
    if (!cur) return;
    var g = cur, M = G[g], I = INFO || {}, me = (I.me && I.me[g]) || {}, o = overlay('mgGame'), tc = tcOf(g), q = qSt && qSt.g === g;
    var h = '<div class="mg-hd"><div class="mg-bk" data-x="1">‹</div><b>' + M.ic + ' ' + M.n + '</b><span class="mg-ru" data-ru="1">📖 Qoidalar</span></div>';
    h += '<div class="mg-hero" style="background:linear-gradient(160deg,' + M.bg + ')"><div class="mg-ic" style="background:linear-gradient(145deg,' + M.ib + ')">' + M.ic + '</div><div><small>Sizning reytingingiz</small><b>' + rt(me) + '</b><em>' + (me.n ? (me.rank ? me.rank + '-o‘rin · ' : '') + me.n + ' ta o‘yin · ' + (me.w || 0) + ' g‘alaba' : 'Hali o‘ynamagansiz — 1500 dan boshlaysiz') + '</em></div></div>';
    var sz = g === 'mm' ? szOf() : '';
    if (g === 'mm') {   // 🧠 doska, vaqt, rasmlar
      var th = thOf();
      h += '<div class="mg-lb">📐 DOSKA</div><div class="mg-ts mm">' + SZ.map(function (z) { return '<span data-sz="' + z.k + '"' + (z.k === sz ? ' class="on"' : '') + '>' + z.t + '<small>' + z.p + ' juftlik</small></span>'; }).join('') + '</div>';
      h += '<div class="mg-lb">⏱ VAQT</div><div class="mg-ts mm">' + tcs(g).map(function (t) { return '<span data-tc="' + t + '"' + (t === tc ? ' class="on"' : '') + '>' + (t === '30' ? '30 s' : t) + '<small>' + (MMSUB[t] || '') + '</small></span>'; }).join('') + '</div>';
      h += '<div class="mg-lb">🎨 RASMLAR</div><div class="mg-th">' + TH.map(function (x) { return '<span data-th="' + x[0] + '"' + (x[0] === th ? ' class="on"' : '') + '><b>' + x[1] + '</b>' + x[2] + '</span>'; }).join('') + '</div>';
    } else h += '<div class="mg-lb">⏱ VAQT</div><div class="mg-ts">' + tcs(g).map(function (t) { return '<span data-tc="' + t + '"' + (t === tc ? ' class="on"' : '') + '>' + t + '</span>'; }).join('') + '</div>';
    h += q ? '<div class="mg-go q" data-go="1">⏳ Raqib qidirilmoqda… <span data-qt="1">0:00</span><small>' + setTxt(g, qSt.tc, qSt.sz) + ' · bekor qilish uchun bosing</small></div>'
      : '<div class="mg-go" data-go="1">▶ O‘ynash<small>' + setTxt(g, tc, sz) + ' · raqib avtomatik topiladi</small></div>';
    h += '<div class="mg-fr" data-fr="1">👥 Do‘stni chaqirish · Telegram havola</div>';
    var W = I.g === g ? (I.wait || []) : [], O = I.g === g ? (I.online || []) : [];
    h += '<div class="mg-h"><span>Kutayotganlar' + (W.length ? ' <i class="mg-cnt">' + W.length + '</i>' : '') + '</span></div>';
    h += W.length ? W.map(function (p) { return '<div class="mg-rw">' + av(p.uid, p.name, 38, p.av) + '<div class="mg-tx"><b>' + esc(p.name) + '</b><small>⭐ ' + rt(p) + ' · ' + setTxt(g, p.tc, p.sz) + '</small></div><span class="mg-jb" data-jq="' + esc(p.uid) + '">Qo‘shilish</span></div>'; }).join('')
      : '<div class="mg-em">Hozir hech kim kutmayapti. «O‘ynash»ni bosing — boshqalar sizni shu yerda ko‘radi.</div>';
    h += '<div class="mg-h" style="margin-top:12px"><span>Onlayn' + (O.length ? ' <i class="mg-cnt">' + O.length + '</i>' : '') + '</span></div>';
    h += O.length ? '<div class="mg-onl">' + O.map(function (p) { return '<div class="mg-pc"><div class="mg-aw">' + av(p.uid, p.name, 42, p.av) + '<span class="mg-dot"></span></div><b>' + esc(p.name) + '</b><small>⭐ ' + rt(p) + '</small>' + (p.busy ? '<div class="mg-bz">' + esc(p.busy) + '</div>' : '<span class="mg-ch" data-inv="' + esc(p.uid) + '" data-nm="' + esc(p.name) + '">⚔ Chaqirish</span>') + '</div>'; }).join('') + '</div>'
      : '<div class="mg-em">Hozir onlayn o‘yinchi yo‘q. Do‘stingizni Telegram havola bilan chaqiring.</div>';
    o.innerHTML = h;
    o.querySelector('[data-x]').onclick = function () { o.remove(); cur = null; refresh(); };
    o.querySelector('[data-ru]').onclick = function () { rules(g); };
    var requeue = function () { if (qSt && qSt.g === g) { qSt.tc = tcOf(g); qSt.sz = g === 'mm' ? szOf() : ''; send({ type: 'mgQueue', g: g, tc: qSt.tc, sz: qSt.sz }); } };
    [].forEach.call(o.querySelectorAll('[data-tc]'), function (e) { e.onclick = function () { ls('mgTc_' + g, e.getAttribute('data-tc')); hap(); requeue(); render(); }; });
    [].forEach.call(o.querySelectorAll('[data-sz]'), function (e) { e.onclick = function () { memCfg({ size: e.getAttribute('data-sz') }); hap(); requeue(); render(); }; });
    [].forEach.call(o.querySelectorAll('[data-th]'), function (e) { e.onclick = function () { memCfg({ theme: e.getAttribute('data-th') }); hap(); render(); }; });
    o.querySelector('[data-go]').onclick = function () {
      hap('medium');
      if (qSt && qSt.g === g) { send({ type: 'mgCancel' }); qSt = null; render(); return; }
      qSt = { g: g, tc: tcOf(g), sz: g === 'mm' ? szOf() : '', at: Date.now() }; send({ type: 'mgQueue', g: g, tc: qSt.tc, sz: qSt.sz }); render();
    };
    o.querySelector('[data-fr]').onclick = function () { friend(g); };
    [].forEach.call(o.querySelectorAll('[data-jq]'), function (e) { e.onclick = function () { hap('medium'); e.textContent = '⏳'; send({ type: 'mgJoinQ', uid: e.getAttribute('data-jq') }); }; });
    [].forEach.call(o.querySelectorAll('[data-inv]'), function (e) { e.onclick = function () { hap('medium'); invite(g, e.getAttribute('data-inv'), e.getAttribute('data-nm')); }; });
    qTick();
  }
  function qTick() {
    clearInterval(tickT);
    tickT = setInterval(function () {
      var e = document.querySelector('#mgGame [data-qt]'); if (!e || !qSt) return clearInterval(tickT);
      var s = Math.floor((Date.now() - qSt.at) / 1000); e.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    }, 1000);
  }
  function friend(g) {
    if (g === 'mm') return memori();
    frame(g === 'ug' ? '/ugolki.html?m=net' : '/duo.html?g=' + encodeURIComponent(g));
  }
  function refresh() { send({ type: 'mgInfo', g: cur || '' }); }

  // ---------------- 📖 qoidalar va 🏆 to'liq ro'yxat
  function sheet(title, body) {
    var o = document.createElement('div'); o.className = 'mgM mg-sh';
    o.innerHTML = '<div class="mg-shc"><div class="mg-shh"><b>' + title + '</b><span data-c="1">✕</span></div>' + body + '</div>';
    o.onclick = function (e) { if (e.target === o || (e.target.closest && e.target.closest('[data-c]'))) o.remove(); };
    document.body.appendChild(o); return o;
  }
  function rules(g) { sheet('📖 ' + G[g].ic + ' ' + G[g].n + ' qoidalari', '<ol class="mg-ol">' + RULES[g].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="mg-rn">' + RNOTE + '</div>'); }
  var topBox = null;
  function topSheet(g) { topBox = sheet('🏆 ' + G[g].ic + ' ' + G[g].n + ' — reyting', '<div data-tl="' + g + '" class="mg-tm" style="padding:16px 0;text-align:center">⏳ Yuklanmoqda…</div>'); send({ type: 'mgTop', g: g }); }
  function topFill(m) {
    var box = topBox && topBox.querySelector('[data-tl="' + m.g + '"]'); if (!box) return;
    var myUid = ''; try { myUid = String(Telegram.WebApp.initDataUnsafe.user.id); } catch (e) {}
    if (!m.list || !m.list.length) { box.textContent = 'Hali hech kim o‘ynamagan — birinchi bo‘ling!'; return; }
    box.className = ''; box.style.cssText = '';
    box.innerHTML = m.list.map(function (p, i) { return '<div class="mg-li' + (p.uid === myUid ? ' me' : '') + '"><em>' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</em>' + av(p.uid, p.name, 32, p.av) + '<span>' + esc(p.name) + '</span><b>' + p.r + (p.p ? '<i>?</i>' : '') + '</b></div>'; }).join('');
  }

  // ---------------- ⚔ chaqiruv
  function invite(g, uid, name) {
    var tc = tcOf(g), sz = g === 'mm' ? szOf() : '';
    outV = { g: g, tc: tc, sz: sz, uid: uid, name: name, at: Date.now(), ms: 60000, id: '' };
    if (qSt) { send({ type: 'mgCancel' }); qSt = null; }
    send({ type: 'mgInvite', g: g, tc: tc, sz: sz, to: uid });
    outBox();
  }
  function outBox(state) {
    var v = outV; if (!v) return;
    var o = el('mgOut'); if (!o) { o = document.createElement('div'); o.id = 'mgOut'; o.className = 'mgM'; document.body.appendChild(o); }
    var M = G[v.g], left = Math.max(0, v.ms - (Date.now() - v.at));
    var top = state === 'declined' ? '😔 ' + esc(v.name) + ' rad etdi' : state === 'timeout' ? '⌛ ' + esc(v.name) + ' javob bermadi' : state === 'err' ? '⚠️ O‘yinni ochib bo‘lmadi' : '⏳ ' + esc(v.name) + ' javobini kutyapmiz…';
    o.innerHTML = '<div class="mg-md"><div class="mg-k">⚔ CHAQIRUV YUBORILDI</div><div class="mg-who">' + av(v.uid, v.name, 64, 1) + '<b>' + esc(v.name) + '</b><small>' + top + '</small></div>' +
      '<span class="mg-gp" style="background:linear-gradient(160deg,' + M.bg + ')">' + M.ic + ' ' + M.n + ' <em>' + setTxt(v.g, v.tc, v.sz) + '</em></span>' +
      (state ? '' : '<div class="mg-bar"><i style="width:' + (left / v.ms * 100) + '%"></i></div><div class="mg-tm">' + Math.ceil(left / 1000) + ' soniya · taklif Telegramga ham yuborildi</div>') +
      '<div class="mg-bb">' + (state ? '<span class="n" data-c="1">Yopish</span>' : '<span class="n" data-cx="1">Bekor qilish</span>') + '</div></div>';
    var c = o.querySelector('[data-c]'); if (c) c.onclick = function () { o.remove(); outV = null; };
    var cx = o.querySelector('[data-cx]'); if (cx) cx.onclick = function () { if (v.id) send({ type: 'mgInvCancel', id: v.id }); o.remove(); outV = null; };
    if (!state) { clearTimeout(o._t); o._t = setTimeout(function () { if (outV === v && el('mgOut')) outBox(); }, 1000); }
  }
  function inBox(m) {
    var M = G[m.g]; if (!M) return;
    var id = 'mgIn_' + m.id, o = el(id); if (!o) { o = document.createElement('div'); o.id = id; o.className = 'mgM'; document.body.appendChild(o); }
    inV[m.id] = { m: m, at: inV[m.id] ? inV[m.id].at : Date.now() };
    var left = Math.max(0, (m.ms || 60000) - (Date.now() - inV[m.id].at)); if (!left) { o.remove(); delete inV[m.id]; return; }
    var f = m.from || {};
    o.innerHTML = '<div class="mg-md"><div class="mg-k">⚔ SIZNI O‘YINGA CHAQIRISHDI</div><div class="mg-who">' + av(f.uid, f.name, 64, 1) + '<b>' + esc(f.name) + '</b><small>⭐ ' + f.r + (f.p ? '?' : '') + ' · ' + M.n + '</small></div>' +
      '<span class="mg-gp" style="background:linear-gradient(160deg,' + M.bg + ')">' + M.ic + ' ' + M.n + ' <em>' + setTxt(m.g, m.tc, m.sz) + '</em></span>' +
      '<div class="mg-bar"><i style="width:' + (left / (m.ms || 60000) * 100) + '%"></i></div><div class="mg-tm">' + Math.ceil(left / 1000) + ' soniya qoldi</div>' +
      '<div class="mg-bb"><span class="n" data-no="1">Rad etish</span><span class="y" data-ok="1">✓ Qabul qilish</span></div></div>';
    o.querySelector('[data-no]').onclick = function () { send({ type: 'mgDecline', id: m.id }); o.remove(); delete inV[m.id]; };
    o.querySelector('[data-ok]').onclick = function () { hap('medium'); send({ type: 'mgAccept', id: m.id }); this.textContent = '⏳'; };
    clearTimeout(o._t); o._t = setTimeout(function () { if (inV[m.id] && el(id)) inBox(m); }, 1000);
  }

  // ---------------- 📨 server xabarlari
  window.spMgMsg = function (m) {
    if (!m || !m.type) return;
    if (m.type === 'mgInfo') {
      INFO = m;
      if (m.q && !qSt) qSt = { g: m.q.g, tc: m.q.tc, sz: m.q.sz, at: m.q.at };
      if (!m.q && qSt && Date.now() - qSt.at > 3000) qSt = null;
      if (el('mgHub')) hub();
      if (el('mgGame') && cur) render();
      return;
    }
    if (m.type === 'mgTop') return topFill(m);
    if (m.type === 'mgQueued') { qSt = qSt && qSt.g === m.g ? qSt : { g: m.g, tc: m.tc, at: Date.now() }; qSt.tc = m.tc; qSt.sz = m.sz; if (el('mgGame')) render(); return; }
    if (m.type === 'mgQueueEnd') { qSt = null; if (el('mgGame')) render(); if (m.why === 'timeout') toast('⌛ Raqib topilmadi — qayta urinib ko‘ring yoki onlayn o‘yinchini chaqiring'); return; }
    if (m.type === 'mgGo') {
      qSt = null; outV = null; var oo = el('mgOut'); if (oo) oo.remove();
      for (var k in inV) { var ie = el('mgIn_' + k); if (ie) ie.remove(); } inV = {};
      if (el('mgGame')) render();
      toast('🎮 ' + esc((G[m.g] || {}).n || '') + ' · raqib: <b>' + esc(m.opp || '') + '</b>', 2500);
      hap('heavy');
      if (window.mxOpen) window.mxOpen(m.id);
      else { var p = String(m.id).split(':'); if (p[1] === 'mm') memori({ join: p[2] }); else frame(p[1] === 'ug' ? '/ugolki.html?room=' + p[2] : '/duo.html?g=' + encodeURIComponent(p[1]) + '&room=' + p[2]); }
      return;
    }
    if (m.type === 'mgInviteIn') return inBox(m);
    if (m.type === 'mgInviteGone') { var g2 = el('mgIn_' + m.id); if (g2) g2.remove(); delete inV[m.id]; return; }
    if (m.type === 'mgInviteSent') { if (outV) { outV.id = m.id; outV.ms = m.ms || outV.ms; outV.at = Date.now(); outBox(); } return; }
    if (m.type === 'mgInviteRes') { if (outV && (!outV.id || outV.id === m.id)) { if (m.ok) { var o2 = el('mgOut'); if (o2) o2.remove(); outV = null; } else outBox(m.why || 'declined'); } return; }
    if (m.type === 'mgErr') { toast('⚠️ ' + esc(m.msg || 'Xatolik')); if (el('mgGame')) render(); return; }
  };
  window.spMgHub = function () { hub(); send({ type: 'mgInfo' }); clearInterval(pollT); pollT = setInterval(function () { if (!el('mgHub')) return clearInterval(pollT); if (document.hidden) return; send({ type: 'mgInfo', g: cur || '' }); }, cur ? 4000 : 10000); };
  window.spMgGame = function (g) { if (!el('mgHub')) window.spMgHub(); if (G[g]) game(g); };
})();
