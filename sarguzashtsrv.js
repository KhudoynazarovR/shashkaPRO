'use strict';
// sarguzashtsrv.js — 🗺 Sarguzasht xaritasi (server): har kitob — o'lka, har 10 masala — bekat, oxirgi bekat — qal'a.
// Bekatga kirishda savol (+tanga), bekat tugaganda sandiq, ko'prikli bekatlar (birinchi 3 masala xatosiz — sandiq 2 barobar),
// qal'ada 10 masala ketma-ket sinov (3 xato — boshidan), kunlik mehmon bekati (tanga 2 barobar).
// Admin: o'lka nomi, yo'lboshchi, ertak matnlari, rasmlar, savollar va mukofotlar.
const store = require('./store.js');
const ST = 10, BRIDGE = [3, 6];
const DEF_RW = { q: 2, big: 15, small: 5, castle: 50, guest: 2 };
const ADM = () => (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const day = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
function hs(s) { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h >>> 0; }

// --- savollar (boshlang'ich to'plam; admin o'zgartiradi). a[0] — to'g'ri javob (o'yinchiga aralashtirib ko'rsatiladi)
const QS = [
  ['Shashka doskasida nechta maydon bor?', ['64', '32', '100', '48'], 'Doska 8 × 8 = 64 maydon. O‘yin ularning 32 tasida — qora maydonlarda o‘ynaladi.'],
  ['Shashka qaysi maydonlarda o‘ynaladi?', ['Faqat qora (to‘q) maydonlarda', 'Faqat oq maydonlarda', 'Hamma maydonlarda'], 'Donalar faqat qora maydonlarda turadi va yuradi.'],
  ['O‘yin boshida har tomonda nechta dona bo‘ladi?', ['12', '10', '16', '8'], 'Har tomonda 12 tadan dona, uch qatorda.'],
  ['Birinchi bo‘lib kim yuradi?', ['Oqlar', 'Qoralar', 'Qur’a bo‘yicha aniqlanadi'], 'Rus shashkasida o‘yinni doim oqlar boshlaydi.'],
  ['Oddiy dona urmasdan qanday yuradi?', ['Faqat oldinga, bir maydon diagonal', 'Oldinga ham, orqaga ham', 'Istalgan maydonga'], 'Oddiy dona oldinga, qo‘shni qora maydonga yuradi.'],
  ['Oddiy dona orqaga ura oladimi?', ['Ha, urishda orqaga ham uradi', 'Yo‘q, faqat oldinga', 'Faqat damka bo‘lsa'], 'Rus shashkasida oddiy dona oldinga ham, orqaga ham uradi.'],
  ['Urish majburiymi?', ['Ha, urish imkoni bo‘lsa urish shart', 'Yo‘q, xohlasa uradi', 'Faqat damka uchun majburiy'], 'Urish imkoni bo‘lsa, boshqa yurish qilib bo‘lmaydi.'],
  ['Bir nechta urish yo‘li bo‘lsa, qaysi birini tanlash kerak?', ['Istalganini, lekin uni oxirigacha urish kerak', 'Eng ko‘p dona olinadiganini', 'Faqat damka bilan urishni'], 'Rus shashkasida urish yo‘lini o‘yinchi o‘zi tanlaydi, ammo boshlangan urishni oxirigacha davom ettiradi.'],
  ['Dona oxirgi qatorga yetsa nima bo‘ladi?', ['Damkaga aylanadi', 'Doskadan olinadi', 'Hech narsa o‘zgarmaydi'], 'Raqib tomonning oxirgi qatoriga yetgan dona damka bo‘ladi.'],
  ['Dona urish paytida oxirgi qatorga yetdi va yana urish bor. Nima bo‘ladi?', ['Damka bo‘lib, urishni damka sifatida davom ettiradi', 'To‘xtaydi, keyingi yurishda davom etadi', 'Oddiy dona bo‘lib davom etadi'], 'Rus shashkasida dona shu zahoti damka bo‘ladi va urishni damka kabi davom ettiradi.'],
  ['Damka qanday yuradi?', ['Diagonal bo‘ylab istalgan masofaga', 'Faqat bir maydon', 'To‘g‘ri chiziqda ham yuradi'], 'Damka diagonal bo‘ylab bo‘sh maydonlar orqali istalgancha yuradi.'],
  ['Damka urgandan keyin qayerga to‘xtaydi?', ['Urilgan donadan keyingi istalgan bo‘sh maydonga', 'Faqat darhol keyingi maydonga', 'Boshlagan joyiga qaytadi'], 'Istalgan bo‘sh maydonga. Agar yana urish bo‘lsa, urishni davom ettiradigan maydonni tanlash kerak.'],
  ['O‘z donasi ustidan sakrab o‘tish mumkinmi?', ['Yo‘q', 'Ha', 'Faqat damka o‘ta oladi'], 'Faqat raqib donasini urib o‘tish mumkin.'],
  ['Yonma-yon turgan ikkita raqib donasini bir sakrashda urish mumkinmi?', ['Yo‘q, orqasida bo‘sh maydon bo‘lishi kerak', 'Ha', 'Faqat damka bilan'], 'Urilayotgan donaning orqasida bo‘sh maydon bo‘lishi shart.'],
  ['Bitta urishda bir donadan ikki marta o‘tish mumkinmi?', ['Yo‘q', 'Ha', 'Faqat damka'], 'Bu «turk urishi» qoidasi: urilgan dona yurish tugaguncha doskada turadi, lekin undan ikkinchi marta o‘tib bo‘lmaydi.'],
  ['Urilgan donalar doskadan qachon olinadi?', ['Butun urish tugagandan keyin', 'Har sakrashdan keyin darhol', 'Raqib yurgandan keyin'], 'Urilgan donalar yurish oxirida birdaniga olinadi.'],
  ['Yurishga imkoni qolmagan o‘yinchi…', ['Yutqazadi', 'Durang qiladi', 'Navbatni o‘tkazib yuboradi'], 'Donalari to‘sib qo‘yilgan, yurolmaydigan o‘yinchi yutqazgan hisoblanadi.'],
  ['Hamma donasi urib olingan o‘yinchi…', ['Yutqazadi', 'Durang qiladi', 'Yangi dona oladi'], 'Donasi qolmagan tomon yutqazadi.'],
  ['«Katta yo‘l» qaysi diagonal?', ['a1–h8', 'a7–g1', 'c1–h6'], 'Eng uzun diagonal a1–h8 «katta yo‘l» deyiladi.'],
  ['Doska qanday qo‘yiladi?', ['Har o‘yinchining chap pastki burchagida qora maydon bo‘ladi', 'O‘ng pastki burchakda qora maydon bo‘ladi', 'Farqi yo‘q'], 'a1 maydoni qora va u oqlarning chap pastki burchagida turadi.'],
  ['Oqlar o‘yin boshida qaysi qatorlarda turadi?', ['1, 2, 3-qatorlarda', '6, 7, 8-qatorlarda', '1 va 2-qatorlarda'], 'Oqlar 1–3, qoralar 6–8-qatorlarda joylashadi.'],
  ['Qoralar o‘yin boshida qaysi qatorlarda turadi?', ['6, 7, 8-qatorlarda', '1, 2, 3-qatorlarda', '5, 6, 7-qatorlarda'], 'Qoralar 6–8-qatorlarda, o‘rtadagi 4 va 5-qatorlar bo‘sh bo‘ladi.'],
  ['Doska ustunlari qanday belgilanadi?', ['a dan h gacha harflar bilan', '1 dan 8 gacha raqamlar bilan', 'Rim raqamlari bilan'], 'Ustunlar a–h harflari, qatorlar 1–8 raqamlari bilan belgilanadi.'],
  ['Doskada nechta qora maydon bor?', ['32', '64', '24', '30'], '64 maydonning yarmi — 32 tasi qora.'],
  ['Kombinatsiya nima?', ['Dona qurbon qilib, keyin ko‘proq dona olish yoki yutish rejasi', 'Faqat damka yurishi', 'O‘yin boshidagi birinchi yurishlar'], 'Kombinatsiyada o‘yinchi ataylab dona beradi va evaziga ko‘proq oladi yoki yutadi.'],
  ['Debyut nima?', ['O‘yinning boshlang‘ich bosqichi', 'O‘yinning oxiri', 'Damka olish'], 'Debyut — o‘yinning boshlanishi, donalar endi chiqib kelayotgan payt.'],
  ['Endshpil nima?', ['O‘yinning so‘nggi bosqichi, donalar kam qolganda', 'O‘yinning boshlanishi', 'O‘yinning o‘rtasi'], 'Endshpilda doskada kam dona qoladi, har bir yurish hal qiluvchi bo‘ladi.'],
  ['Masalada «Oq yuradi va yutadi» degani nima?', ['Oqlar to‘g‘ri yurishlar bilan majburan yutadi', 'Oqlar bir yurishda yutadi', 'Qoralar yutadi'], 'Qoralar qanday himoyalanmasin, oqlar yutishga erishadi.'],
  ['Urish imkoni bo‘la turib boshqa yurish qilish mumkinmi?', ['Yo‘q, urish shart', 'Ha, mumkin', 'Faqat o‘yin boshida mumkin'], 'Urish majburiy, shuning uchun bunday yurish qoidaga zid.'],
  ['Damka urishda yo‘nalishini o‘zgartira oladimi?', ['Ha, har sakrashdan keyin boshqa diagonalga buriladi', 'Yo‘q, faqat to‘g‘ri ketadi', 'Faqat bir marta'], 'Damka ham, oddiy dona ham urish davomida yo‘nalishini o‘zgartira oladi.'],
  ['Oddiy dona bitta yurishda nechta donani urishi mumkin?', ['Imkon bo‘lsa bir nechtasini, ketma-ket', 'Faqat bittasini', 'Ko‘pi bilan ikkitasini'], 'Ketma-ket urish imkoni bo‘lsa, hammasini bitta yurishda uradi.'],
  ['Markazdagi maydonlar nega muhim?', ['Markazdagi dona ko‘p yo‘nalishga ta’sir qiladi', 'Ular darhol yutuq beradi', 'Ahamiyati yo‘q'], 'Markazni egallagan tomon o‘yinni boshqarishi osonroq.'],
  ['Doska chetidagi dona haqida nima to‘g‘ri?', ['Uni urib bo‘lmaydi, lekin u kamroq faol', 'Uni har doim urish mumkin', 'U damkaga aylanmaydi'], 'Chetdagi donaning orqasida maydon yo‘q, shuning uchun uni urib bo‘lmaydi, ammo u faqat bir tomonga yura oladi.'],
  ['Oddiy dona bir yurishda (urmasdan) necha maydon yuradi?', ['Bitta', 'Ikkita', 'Istalgancha'], 'Oddiy dona bir maydon yuradi, istalgancha yurish — damkaning imkoniyati.'],
  ['Uchta damka bitta damkaga qarshi, yolg‘iz damka katta yo‘lni egallagan. Natija odatda qanday?', ['Durang', 'Yolg‘iz damka albatta yutqazadi', 'Yolg‘iz damka yutadi'], 'Katta yo‘lni egallagan yolg‘iz damkani uchta damka bilan ham yutib bo‘lmaydi — durang.'],
  ['Bir damka bitta damkaga qarshi qolsa, odatda natija qanday?', ['Durang', 'Oqlar yutadi', 'Birinchi yurgan yutadi'], 'Bir damkaga qarshi bir damka bilan yutib bo‘lmaydi.']
];

function A() { const a = store.db.adv = store.db.adv || {}; a.lands = a.lands || {}; a.rw = a.rw || {}; if (!Array.isArray(a.qs)) a.qs = QS.map((x, i) => ({ id: 'q' + i, t: x[0], a: x[1], x: x[2] })); return a; }
function RW() { return Object.assign({}, DEF_RW, A().rw); }

// --- kitoblar: sodda (s), murakkab (m) — pzbooks.js; etyudlar (e) — etudes.js papkalari 100 tadan
let EC = { n: -1, v: null };
function etBooks() {
  let L = []; try { L = require('./etudes.js').puzzleList(); } catch (e) {}
  if (EC.n === L.length && EC.v) return EC.v;
  const by = {}; L.forEach(x => { (by[x.folder] = by[x.folder] || []).push(x.id); });
  let F = []; try { F = require('./etudes.js').FOLDERS.filter(f => by[f]); } catch (e) {} Object.keys(by).forEach(f => { if (F.indexOf(f) < 0) F.push(f); });
  const out = {}; F.forEach(f => { const ids = by[f]; for (let i = 0, k = 0; i < ids.length; i += 100, k++) out['e' + hs(f).toString(36) + '_' + k] = ids.slice(i, i + 100); });
  EC = { n: L.length, v: out }; return out;
}
function world(w) {   // [{k, ids}] tartib bilan
  if (w === 'e') { const E = etBooks(); return Object.keys(E).map(k => ({ k, ids: E[k] })); }
  let B = { s: [], m: [] }; try { B = require('./pzbooks.js').build(); } catch (e) {}
  return (B[w] || []).map((ids, i) => ({ k: w + i, ids }));
}
function bookOf(k) {
  const w = String(k || '')[0]; if (!/^[sme]$/.test(w)) return null;
  const W = world(w), i = W.findIndex(b => b.k === k); if (i < 0) return null;
  return { w, i, W, ids: W[i].ids };
}
function nSt(ids) { return Math.ceil(ids.length / ST); }
function stIds(ids, st) { return ids.slice(st * ST, st * ST + ST); }
function castleOf(ids) { const n = nSt(ids); return n >= 2 ? n - 1 : -1; }
function cnt(ids, sv) { let c = 0; ids.forEach(id => { if (sv.has(id)) c++; }); return c; }
function landOpen(bk, sv) { if (bk.i === 0) return true; const pv = bk.W[bk.i - 1].ids; return cnt(pv, sv) >= pv.length || cnt(bk.ids, sv) > 0; }
function stOpen(bk, st, sv) {
  if (!landOpen(bk, sv)) return false; if (st === 0) return true;
  const pv = stIds(bk.ids, st - 1); return cnt(pv, sv) >= pv.length || cnt(stIds(bk.ids, st), sv) > 0;
}
function my(u) { const m = u.adv = u.adv || {}; m.q = m.q || {}; m.ch = m.ch || {}; m.cs = m.cs || {}; return m; }

// kunlik mehmon: o'yinchining ochiq, tugamagan bekatlaridan biri (har kuni boshqasi)
function guest(uid, u) {
  const sv = new Set((u && u.solved) || []), c = [];
  ['s', 'm'].forEach(w => {
    const W = world(w);
    W.forEach((b, i) => {
      const bk = { w, i, W, ids: b.ids }; if (!landOpen(bk, sv)) return;
      const cs = castleOf(b.ids);
      for (let st = 0; st < nSt(b.ids); st++) { if (st === cs) continue; const s = stIds(b.ids, st); if (cnt(s, sv) < s.length && stOpen(bk, st, sv)) c.push({ k: b.k, st }); }
    });
  });
  if (!c.length) return null;
  return c[hs(day() + ':' + uid) % c.length];
}
function inGuest(uid, u, id) { const g = guest(uid, u); if (!g) return false; const bk = bookOf(g.k); return !!bk && stIds(bk.ids, g.st).indexOf(id) >= 0; }

// savol: bekat uchun (o'yinchiga qarab) bitta savol, javoblar aralashtiriladi
function qFor(uid, k, st) {
  const L = A().qs; if (!L.length) return null;
  const q = L[hs(uid + ':' + k + ':' + st) % L.length], n = q.a.length, ord = q.a.map((_, i) => i);
  let s = hs('o' + uid + k + st); for (let i = n - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); const t = ord[i]; ord[i] = ord[j]; ord[j] = t; }
  return { q, ord };
}

function view(uid) {
  const a = A(), u = store.users()[uid], m = u ? my(u) : { q: {}, ch: {}, cs: {} };
  const lands = {}; Object.keys(a.lands).forEach(k => { const L = a.lands[k]; lands[k] = { name: L.name || '', guide: L.guide || '', lines: L.lines || [], img: L.img || {} }; });
  return { lands, rw: RW(), my: { q: m.q, ch: m.ch, cs: m.cs, tr: m.tr || null }, guest: u ? guest(uid, u) : null, admin: ADM().includes(String(uid)), qn: a.qs.length, qs: ADM().includes(String(uid)) ? a.qs : undefined };
}
function pay(uid, n, why) { if (n > 0) try { require('./economy.js').add(uid, n, why); } catch (e) {} }

// /api/puzzle/fail va /api/puzzle/solved dan chaqiriladi
function onFail(u, id) { try { const m = my(u), t = m.tr; if (!t) return; const bk = bookOf(t.k); if (bk && stIds(bk.ids, castleOf(bk.ids))[t.i] === id) { t.cf = 1; store.save(); } } catch (e) {} }
function onSolve(uid, u, pz, j, gain) {
  const out = {}; let extra = 0;
  try {
    const m = my(u), t = m.tr;
    if (t) {
      const bk = bookOf(t.k), ids = bk ? stIds(bk.ids, castleOf(bk.ids)) : [];
      if (ids[t.i] === pz.id) {
        const bad = t.cf || (Number(j.errs) || 0) > 0 || (Number(j.hints) || 0) > 0;
        if (bad) t.err++; t.cf = 0; t.i++;
        if (t.err >= 3) { out.tr = { st: 'fail', i: t.i, err: t.err, n: ids.length }; m.tr = null; }
        else if (t.i >= ids.length) {
          const first = !m.cs[t.k]; m.cs[t.k] = 1; m.tr = null;
          const rw = first ? RW().castle : 0; if (rw) pay(uid, rw, 'qal‘a sinovi');
          out.tr = { st: 'win', i: t.i, err: t.err, n: ids.length, gain: rw };
        } else out.tr = { st: 'run', i: t.i, err: t.err, n: ids.length, next: ids[t.i], bad: !!bad };
        store.save();
      }
    }
    if (gain > 0 && inGuest(uid, u, pz.id)) { extra = gain * (Math.max(1, RW().guest) - 1); if (extra) out.guest = extra; }
  } catch (e) { console.log('[sarguzasht]', e.message); }
  return { extra, out };
}

function handle(req, res, p, h) {
  if (!p.startsWith('/api/adv')) return false;
  if (p === '/api/adv/img' && req.method === 'GET') {
    const id = new URL(req.url, 'http://x').searchParams.get('id') || '', d = (store.db.advImg || {})[id];
    const mm = /^data:(image\/(?:webp|jpeg|png));base64,(.+)$/.exec(d || '');
    if (!mm) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': mm[1], 'Cache-Control': 'public, max-age=31536000, immutable' }); res.end(Buffer.from(mm[2], 'base64'));
    return true;
  }
  const tk = h.verifyInitData(req.headers['x-init-data'] || '', process.env.BOT_TOKEN);
  if (!tk) { h.send(res, 401, { error: 'auth' }); return true; }
  const uid = String(tk.id), adm = ADM().includes(uid);
  if (req.method === 'GET') { h.send(res, 200, view(uid)); return true; }
  h.readBody(req, 1200000, body => {
    let j = {}; try { j = JSON.parse(body); } catch (e) {}
    const u = store.getOrCreate(tk), m = my(u), sv = new Set(u.solved || []);
    const bk = j.k ? bookOf(String(j.k)) : null, st = Math.floor(Number(j.st));
    const okSt = () => bk && st >= 0 && st < nSt(bk.ids) && (adm || stOpen(bk, st, sv));
    if (p === '/api/adv/q') {   // bekat savoli
      if (!okSt() || st === castleOf(bk.ids)) return h.send(res, 400, { error: 'Bekat yopiq' });
      const key = j.k + ':' + st; if (key in m.q) return h.send(res, 200, { done: m.q[key] });
      const Q = qFor(uid, j.k, st); if (!Q) return h.send(res, 200, { none: 1 });
      return h.send(res, 200, { t: Q.q.t, a: Q.ord.map(i => Q.q.a[i]) });
    }
    if (p === '/api/adv/ans') {
      if (!okSt()) return h.send(res, 400, { error: 'Bekat yopiq' });
      const key = j.k + ':' + st; if (key in m.q) return h.send(res, 400, { error: 'Bu savolga javob berilgan' });
      const Q = qFor(uid, j.k, st); if (!Q) return h.send(res, 400, { error: 'Savol yo‘q' });
      const pick = Math.floor(Number(j.a)), ok = Q.ord[pick] === 0, right = Q.ord.indexOf(0);
      m.q[key] = ok ? 1 : 0; const g = ok ? RW().q : 0; if (g) pay(uid, g, 'sarguzasht savoli'); if (!ok) { try { require('./economy.js').penalty(String(uid), 'sarguzasht savoli xato'); } catch (e) {} } store.save();
      return h.send(res, 200, { ok, right, x: Q.q.x || '', gain: g, my: m });
    }
    if (p === '/api/adv/chest') {   // bekat sandig'i
      if (!okSt() || st === castleOf(bk.ids)) return h.send(res, 400, { error: 'Bekat yopiq' });
      const key = j.k + ':' + st; if (m.ch[key]) return h.send(res, 400, { error: 'Sandiq ochilgan' });
      const ids = stIds(bk.ids, st); if (ids.some(id => !sv.has(id))) return h.send(res, 400, { error: 'Avval bekatdagi hamma masalani yeching' });
      const stars = u.pzStars || {}, full = ids.every(id => stars[id] >= 3), br = BRIDGE.indexOf(st) >= 0 && ids.slice(0, 3).every(id => stars[id] >= 3);
      const g = (full ? RW().big : RW().small) * (br ? 2 : 1); m.ch[key] = g; pay(uid, g, 'sarguzasht sandig‘i'); store.save();
      return h.send(res, 200, { gain: g, full, br, my: m });
    }
    if (p === '/api/adv/castle') {   // qal'a sinovi: boshlash / to'xtatish
      if (!bk) return h.send(res, 400, { error: 'Kitob topilmadi' });
      const cs = castleOf(bk.ids); if (cs < 0) return h.send(res, 400, { error: 'Qal‘a yo‘q' });
      if (j.op === 'stop') { if (m.tr && m.tr.k === j.k) m.tr = null; store.save(); return h.send(res, 200, { my: m }); }
      if (!adm && !stOpen(bk, cs, sv)) return h.send(res, 400, { error: 'Qal‘a hali yopiq' });
      m.tr = { k: String(j.k), i: 0, err: 0, cf: 0, at: Date.now() }; store.save();
      return h.send(res, 200, { my: m, ids: stIds(bk.ids, cs) });
    }
    // ---- admin
    if (!adm) return h.send(res, 403, { error: 'Faqat admin' });
    const a = A();
    if (p === '/api/adv/post') {   // 📣 guruhga xarita xabari (admin): matn + «Xaritani ochish» tugmasi
      let chat = String(j.chat || '').trim();
      // link: t.me/guruh yoki @guruh → @guruh; ID: -100… o‘zi qoladi. Yopiq invite link (t.me/+… yoki joinchat) ishlamaydi
      const m = chat.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{4,64})\/?$/i);
      if (m) chat = '@' + m[1];
      if (/^t\.me\/\+|joinchat/i.test(chat)) return h.send(res, 400, { error: 'Yopiq link ishlamaydi: guruh linkini (t.me/guruh_nomi) yoki guruh ID sini kiriting' });
      if (!/^-?\d{5,20}$/.test(chat) && !/^@[A-Za-z0-9_]{4,64}$/.test(chat)) return h.send(res, 400, { error: 'Guruh link yoki ID noto‘g‘ri' });
      const link = (process.env.TG_APP_LINK || process.env.APP_LINK || 'https://t.me/DraughtsPRObot/play').replace(/\/$/, '');
      const text = 'Yangi sarguzasht xaritasi!\nHar kitob — alohida o‘lka, har 10 masala — bekat, oxirida qal‘a sinovi.\nSandiqlar, savollar va tangalar kutmoqda.';
      require('./gcard.js').tg('sendMessage', { chat_id: chat, text: text + '\n\nXarita: ' + link + '?startapp=adv', reply_markup: { inline_keyboard: [[{ text: 'Xaritani ochish', url: link + '?startapp=adv' }]] } })
        .then(r => h.send(res, 200, { ok: !!(r && r.ok), err: r && !r.ok ? (r.description || '') : '' }))
        .catch(() => h.send(res, 500, { error: 'Yuborilmadi' }));
      return true;
    }
    if (p === '/api/adv/land') {
      const k = String(j.k || ''); if (!/^[sme][a-z0-9_]{1,30}$/.test(k)) return h.send(res, 400, { error: 'kalit' });
      const L = a.lands[k] = a.lands[k] || {};
      if ('name' in j) L.name = String(j.name || '').slice(0, 40);
      if ('guide' in j) L.guide = String(j.guide || '').slice(0, 40);
      if (Array.isArray(j.lines)) L.lines = j.lines.slice(0, 11).map(s => String(s || '').slice(0, 300));
      L.img = L.img || {};
      const I = store.db.advImg = store.db.advImg || {};
      for (const f of ['land', 'guide', 'boss']) {
        if (!(f in (j.img || {}))) continue;
        const v = j.img[f]; if (L.img[f]) delete I[L.img[f]];
        if (!v) { delete L.img[f]; continue; }
        if (!/^data:image\/(webp|jpeg|png);base64,/.test(v) || v.length > 400000) return h.send(res, 400, { error: 'Rasm juda katta yoki noto‘g‘ri' });
        const id = f + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); I[id] = v; L.img[f] = id;
      }
      store.save(); return h.send(res, 200, view(uid));
    }
    if (p === '/api/adv/qs') {
      const t = String(j.t || '').trim().slice(0, 200), ans = (Array.isArray(j.a) ? j.a : []).map(s => String(s || '').trim().slice(0, 120)).filter(Boolean).slice(0, 4);
      if (j.op === 'del') { a.qs = a.qs.filter(q => q.id !== j.id); store.save(); return h.send(res, 200, view(uid)); }
      if (!t || ans.length < 2) return h.send(res, 400, { error: 'Savol va kamida 2 ta javob kerak' });
      const c = Math.max(0, Math.min(ans.length - 1, Math.floor(Number(j.c) || 0))), ord = [ans[c]].concat(ans.filter((_, i) => i !== c));
      const q = { id: j.op === 'edit' ? String(j.id) : 'q' + Date.now().toString(36), t, a: ord, x: String(j.x || '').slice(0, 300) };
      if (j.op === 'edit') { const i = a.qs.findIndex(x => x.id === q.id); if (i < 0) return h.send(res, 404, { error: 'topilmadi' }); a.qs[i] = q; } else a.qs.push(q);
      store.save(); return h.send(res, 200, view(uid));
    }
    if (p === '/api/adv/rw') {
      const r = {}; Object.keys(DEF_RW).forEach(k => { if (k in j) r[k] = Math.max(0, Math.min(k === 'guest' ? 5 : 1000, Math.floor(Number(j[k]) || 0))); });
      a.rw = Object.assign(a.rw, r); store.save(); return h.send(res, 200, view(uid));
    }
    h.send(res, 404, { error: 'topilmadi' });
  });
  return true;
}
module.exports = { handle, onSolve, onFail, view, world, bookOf, guest };
