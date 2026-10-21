/* DEBYUT — rus shashkasi debyutlari kutubxonasi: ro'yxat, yurishma-yurish ko'rish, yod olish mashqi.
   Ma'lumot: ru.wikipedia "Список дебютов (русские шашки)" va bog'liq maqolalar; barcha yurishlar qoidalar dvigateli bilan tekshirilgan. */
;(function () {
  if (window.spDebut) return;
  var DATA = [{"g":"cd4","ru":"Кол","uz":"Qoziq (Kol)","mv":"1.cd4 ba5 2.dc5","d":"Qora 1…ba5 bilan chetga chiqadi, oq 2.dc5 bilan javob beradi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,1,3,0]],"s":"b","n":"b6-a5"},{"p":[[4,3,3,2]],"s":"w","n":"d4-c5"}]},{"g":"cd4","ru":"Двойной кол","uz":"Qo‘sh qoziq","mv":"1.cd4 ba5 2.dc5 d:b4 3.a:c5 fg5 4.bc3 gf6 5.gh4 gf4 6.e:g5 h:f4","d":"“Qoziq”ning almashuvlar bilan davomi. Yurishlar tartibini almashtirib ham chiqadi: 1.cb4 ba5 2.bc5 d:b4 3.a:c5.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,1,3,0]],"s":"b","n":"b6-a5"},{"p":[[4,3,3,2]],"s":"w","n":"d4-c5"},{"p":[[2,3,4,1]],"s":"b","n":"d6:b4"},{"p":[[5,0,3,2]],"s":"w","n":"a3:c5"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"},{"p":[[3,6,4,5]],"s":"b","n":"g5-f4"},{"p":[[5,4,3,6]],"s":"w","n":"e3:g5"},{"p":[[2,7,4,5]],"s":"b","n":"h6:f4"}]},{"g":"cd4","ru":"Городская партия","uz":"Shahar partiyasi","mv":"1.cd4 dc5 2.bc3 fg5 3.cb4 gh4 4.b:d6 e:c5","d":"Mumtoz debyut. Oq markazni egallab, raqibning o‘ng qanotiga hujum qiladi; qora oqning markazini o‘rab olishga harakat qiladi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,2]],"s":"b","n":"d6-c5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[3,6,4,7]],"s":"b","n":"g5-h4"},{"p":[[4,1,2,3]],"s":"w","n":"b4:d6"},{"p":[[1,4,3,2]],"s":"b","n":"e7:c5"}]},{"g":"cd4","ru":"Отказанная городская партия","uz":"Rad etilgan shahar partiyasi","mv":"1.cd4 dc5 2.dc3 fg5 3.gh4 gf4 4.e:g5 h:f4","d":"Oq “Shahar partiyasi”ning odatiy rivojidan voz kechib, 3.gh4 bilan boshqa yo‘l tanlaydi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,2]],"s":"b","n":"d6-c5"},{"p":[[6,3,5,2]],"s":"w","n":"d2-c3"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"},{"p":[[3,6,4,5]],"s":"b","n":"g5-f4"},{"p":[[5,4,3,6]],"s":"w","n":"e3:g5"},{"p":[[2,7,4,5]],"s":"b","n":"h6:f4"}]},{"g":"cd4","ru":"Старая партия","uz":"Eski partiya","mv":"1.cd4 dc5 2.bc3 ed6","d":"Eng mashhur va eng ko‘p o‘rganilgan debyutlardan biri.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,2]],"s":"b","n":"d6-c5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,4,2,3]],"s":"b","n":"e7-d6"}]},{"g":"cd4","ru":"Отыгрыш","uz":"Qaytarib olish (Otigrish)","mv":"1.cd4 dc5 2.bc3 cd6 3.cb4 ba5 4.d:b6 a:c7","d":"Qora 2…cd6 bilan ortga qaytadi, keyin 4…a:c7 bilan almashuv bo‘ladi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,2]],"s":"b","n":"d6-c5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,2,2,3]],"s":"b","n":"c7-d6"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,1,3,0]],"s":"b","n":"b6-a5"},{"p":[[4,3,2,1]],"s":"w","n":"d4:b6"},{"p":[[3,0,1,2]],"s":"b","n":"a5:c7"}]},{"g":"cd4","ru":"Отказанный отыгрыш","uz":"Rad etilgan Otigrish","mv":"1.cd4 dc5 2.bc3 cd6 3.cb4 fe5 4.d:f6 g:e5","d":"Qora 3…ba5 o‘rniga 3…fe5 o‘ynaydi va boshqa almashuv yuzaga keladi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,2]],"s":"b","n":"d6-c5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,2,2,3]],"s":"b","n":"c7-d6"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[4,3,2,5]],"s":"w","n":"d4:f6"},{"p":[[1,6,3,4]],"s":"b","n":"g7:e5"}]},{"g":"cd4","ru":"Перекрёсток","uz":"Chorraha","mv":"1.cd4 de5 2.bc3 ed6 3.ef4","d":"1.cd4 de5 2.bc3 ed6 dan keyingi asosiy davomi — 3.ef4.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,4]],"s":"b","n":"d6-e5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,4,2,3]],"s":"b","n":"e7-d6"},{"p":[[5,4,4,5]],"s":"w","n":"e3-f4"}]},{"g":"cd4","ru":"Обратный перекрёсток","uz":"Teskari chorraha","mv":"1.cd4 de5 2.bc3 ed6 3.gh4","d":"“Chorraha”da oq 3.ef4 o‘rniga 3.gh4 o‘ynaydi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,4]],"s":"b","n":"d6-e5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,4,2,3]],"s":"b","n":"e7-d6"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"}]},{"g":"cd4","ru":"Вилочка","uz":"Vilka","mv":"1.cd4 de5 2.gf4","d":"1.cd4 de5 dan keyin oq 2.gf4 o‘ynaydi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,3,3,4]],"s":"b","n":"d6-e5"},{"p":[[5,6,4,5]],"s":"w","n":"g3-f4"}]},{"g":"cd4","ru":"Игра Романычева","uz":"Romanichev o‘yini","mv":"1.cd4 fe5","d":"Qora birinchi yurishda 1…fe5 o‘ynaydi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"}]},{"g":"cd4","ru":"Гибельное начало","uz":"Halokatli boshlanish","mv":"1.cd4 fe5 2.d:f6 g:e5 3.ab4","d":"Almashuvdan keyin oq uchun kuchli 3.ab4! yurishi bor — qora uchun xavfli boshlanish sifatida tanilgan.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[4,3,2,5]],"s":"w","n":"d4:f6"},{"p":[[1,6,3,4]],"s":"b","n":"g7:e5"},{"p":[[5,0,4,1]],"s":"w","n":"a3-b4"}]},{"g":"cd4","ru":"Атака шашки g5","uz":"g5 donasiga hujum","mv":"1.cd4 fg5 2.gh4","d":"1.cd4 fg5 dan keyin oq 2.gh4 bilan g5 dagi donaga yaqinlashadi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"}]},{"g":"cd4","ru":"Центральная партия","uz":"Markaziy partiya","mv":"1.cd4 fg5 2.gf4 gf6 3.bc3 hg7","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,6,4,5]],"s":"w","n":"g3-f4"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[0,7,1,6]],"s":"b","n":"h8-g7"}]},{"g":"cd4","ru":"Игра Медкова","uz":"Medkov o‘yini","mv":"1.cd4 fg5 2.bc3 gf6 3.ab2 dc5 4.gh4","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[7,0,6,1]],"s":"w","n":"a1-b2"},{"p":[[2,3,3,2]],"s":"b","n":"d6-c5"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"}]},{"g":"cd4","ru":"Игра Когана","uz":"Kogan o‘yini","mv":"1.cd4 fg5 2.bc3 gh4 3.cb4 de5 4.d:f6 g:e5","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[3,6,4,7]],"s":"b","n":"g5-h4"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,3,3,4]],"s":"b","n":"d6-e5"},{"p":[[4,3,2,5]],"s":"w","n":"d4:f6"},{"p":[[1,6,3,4]],"s":"b","n":"g7:e5"}]},{"g":"cd4","ru":"Киевская защита","uz":"Kiyev himoyasi","mv":"1.cd4 fg5 2.bc3 gh4 3.cb4 hg5","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[3,6,4,7]],"s":"b","n":"g5-h4"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,7,3,6]],"s":"b","n":"h6-g5"}]},{"g":"cd4","ru":"Ленинградская защита","uz":"Leningrad himoyasi","mv":"1.cd4 fg5 2.bc3 gf6 3.cb4 ba5 4.dc5","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,1,3,0]],"s":"b","n":"b6-a5"},{"p":[[4,3,3,2]],"s":"w","n":"d4-c5"}]},{"g":"cd4","ru":"Новое начало","uz":"Yangi boshlanish","mv":"1.cd4 bc5 2.d:b6 a:c5","d":"Qora birinchi yurishdayoq 1…bc5 bilan almashuvga boradi.","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,1,3,2]],"s":"b","n":"b6-c5"},{"p":[[4,3,2,1]],"s":"w","n":"d4:b6"},{"p":[[1,0,3,2]],"s":"b","n":"a7:c5"}]},{"g":"cd4","ru":"Начало Ивашко","uz":"Ivashko boshlanishi","mv":"1.cd4 fg5 2.dc3","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,3,5,2]],"s":"w","n":"d2-c3"}]},{"g":"cd4","ru":"Обратная игра Бодянского","uz":"Teskari Bodyanskiy o‘yini","mv":"1.cd4 hg5 2.gh4","d":"","steps":[{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"},{"p":[[2,7,3,6]],"s":"b","n":"h6-g5"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"}]},{"g":"cb4","ru":"Тычок","uz":"Turtki (Tichok)","mv":"1.cb4 fg5 2.bc5","d":"1.cb4 fg5 dan keyin oq b4 donasini 2.bc5 bilan oldinga suradi.","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[4,1,3,2]],"s":"w","n":"b4-c5"}]},{"g":"cb4","ru":"Обратный тычок","uz":"Teskari turtki","mv":"1.cb4 fg5 2.bc3 gf4","d":"","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[3,6,4,5]],"s":"b","n":"g5-f4"}]},{"g":"cb4","ru":"Игра Блиндера","uz":"Blinder o‘yini","mv":"1.cb4 fg5 2.dc3","d":"","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,3,5,2]],"s":"w","n":"d2-c3"}]},{"g":"cb4","ru":"Обратная городская партия","uz":"Teskari shahar partiyasi","mv":"1.cb4 fe5 2.ef4 gf6 3.ba5 fg5 4.bc3 g:e3 5.d:f4","d":"“Shahar partiyasi”ning qora tomonidan aksi.","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[5,4,4,5]],"s":"w","n":"e3-f4"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[4,1,3,0]],"s":"w","n":"b4-a5"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[3,6,5,4]],"s":"b","n":"g5:e3"},{"p":[[6,3,4,5]],"s":"w","n":"d2:f4"}]},{"g":"cb4","ru":"Обратный кол","uz":"Teskari qoziq","mv":"1.cb4 fe5 2.gh4 ef4 3.e:g5 h:f4","d":"","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"},{"p":[[3,4,4,5]],"s":"b","n":"e5-f4"},{"p":[[5,4,3,6]],"s":"w","n":"e3:g5"},{"p":[[2,7,4,5]],"s":"b","n":"h6:f4"}]},{"g":"cb4","ru":"Косяк","uz":"Qiyshiq (Kosyak, Perelman)","mv":"1.cb4 fg5 2.gf4 gf6 3.bc3 bc5 4.ba5 gh4 5.cb4 fg5","d":"Perelman varianti (“Kosyak”ning bir nechta varianti bor).","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,6,4,5]],"s":"w","n":"g3-f4"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[2,1,3,2]],"s":"b","n":"b6-c5"},{"p":[[4,1,3,0]],"s":"w","n":"b4-a5"},{"p":[[3,6,4,7]],"s":"b","n":"g5-h4"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"}]},{"g":"cb4","ru":"Обратный косяк","uz":"Teskari qiyshiq","mv":"1.cb4 fg5 2.gf4 gf6 3.bc3 fe5 4.ab2","d":"","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,6,4,5]],"s":"w","n":"g3-f4"},{"p":[[1,6,2,5]],"s":"b","n":"g7-f6"},{"p":[[6,1,5,2]],"s":"w","n":"b2-c3"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[7,0,6,1]],"s":"w","n":"a1-b2"}]},{"g":"cb4","ru":"Слепая партия","uz":"Ko‘r partiya","mv":"1.cb4 fe5 2.ef4 ef6 3.ba5 fg5 4.fe3 gh4 5.gf2","d":"","steps":[{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[5,4,4,5]],"s":"w","n":"e3-f4"},{"p":[[1,4,2,5]],"s":"b","n":"e7-f6"},{"p":[[4,1,3,0]],"s":"w","n":"b4-a5"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,5,5,4]],"s":"w","n":"f2-e3"},{"p":[[3,6,4,7]],"s":"b","n":"g5-h4"},{"p":[[7,6,6,5]],"s":"w","n":"g1-f2"}]},{"g":"other","ru":"Игра Бодянского","uz":"Bodyanskiy o‘yini","mv":"1.ab4 ba5 2.ba3","d":"Oq birinchi yurishni chetdan, 1.ab4 bilan boshlaydi.","steps":[{"p":[[5,0,4,1]],"s":"w","n":"a3-b4"},{"p":[[2,1,3,0]],"s":"b","n":"b6-a5"},{"p":[[6,1,5,0]],"s":"w","n":"b2-a3"}]},{"g":"other","ru":"Игра Петрова","uz":"Petrov o‘yini","mv":"1.gh4 ba5","d":"Oq birinchi yurishni o‘ng chetdan, 1.gh4 bilan boshlaydi.","steps":[{"p":[[5,6,4,7]],"s":"w","n":"g3-h4"},{"p":[[2,1,3,0]],"s":"b","n":"b6-a5"}]},{"g":"other","ru":"Игра Каулена","uz":"Kaulen o‘yini","mv":"1.gf4 fe5 2.hg3","d":"","steps":[{"p":[[5,6,4,5]],"s":"w","n":"g3-f4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[6,7,5,6]],"s":"w","n":"h2-g3"}]},{"g":"other","ru":"Обратная вилочка","uz":"Teskari vilka","mv":"1.gf4 fe5 2.cd4","d":"","steps":[{"p":[[5,6,4,5]],"s":"w","n":"g3-f4"},{"p":[[2,5,3,4]],"s":"b","n":"f6-e5"},{"p":[[5,2,4,3]],"s":"w","n":"c3-d4"}]},{"g":"other","ru":"Игра Боброва","uz":"Bobrov o‘yini","mv":"1.ef4 fg5 2.de3","d":"","steps":[{"p":[[5,4,4,5]],"s":"w","n":"e3-f4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[6,3,5,4]],"s":"w","n":"d2-e3"}]},{"g":"other","ru":"Игра Шмульяна","uz":"Shmulyan o‘yini","mv":"1.ef4 fg5 2.cb4","d":"","steps":[{"p":[[5,4,4,5]],"s":"w","n":"e3-f4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[5,2,4,1]],"s":"w","n":"c3-b4"}]},{"g":"other","ru":"Игра Матасова — Петрова","uz":"Matasov–Petrov o‘yini","mv":"1.ef4 fg5 2.fe5 d:f4 3.g:e5","d":"","steps":[{"p":[[5,4,4,5]],"s":"w","n":"e3-f4"},{"p":[[2,5,3,6]],"s":"b","n":"f6-g5"},{"p":[[4,5,3,4]],"s":"w","n":"f4-e5"},{"p":[[2,3,4,5]],"s":"b","n":"d6:f4"},{"p":[[5,6,3,4]],"s":"w","n":"g3:e5"}]},{"g":"other","ru":"Игра Филиппова","uz":"Filippov o‘yini","mv":"1.ed4","d":"Oq birinchi yurishni 1.ed4 bilan qiladi.","steps":[{"p":[[5,4,4,3]],"s":"w","n":"e3-d4"}]}];
  var GR = { cd4: '1. c3-d4 bilan boshlanadiganlar', cb4: '1. c3-b4 bilan boshlanadiganlar', other: 'Boshqa birinchi yurishlar' };
  var tg = window.Telegram && window.Telegram.WebApp;
  var ov = null, q = '', cur = null, ply = 0, mode = 'view', side = 'w', sel = null, msg = '', busy = false, auto = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function learned() { return ls('debLearned') || {}; }
  function haptic(t) { try { if (t === 'bad') tg.HapticFeedback.notificationOccurred('error'); else tg.HapticFeedback.impactOccurred('light'); } catch (e) {} }

  function css() {
    if (document.getElementById('debCss')) return;
    var s = document.createElement('style'); s.id = 'debCss';
    s.textContent = '#spDeb{position:fixed;inset:0;z-index:2147482500;overflow-y:auto;background:#0b0e1a;color:#fff;font-family:system-ui,Roboto,sans-serif;padding:12px 12px 100px;box-sizing:border-box}' +
      '#spDeb .tp{display:flex;align-items:center;gap:10px;margin-bottom:12px}#spDeb .tp b{flex:1;font-size:20px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spDeb .tp button{border:0;background:#262b5a;color:#fff;border-radius:12px;min-width:42px;height:42px;font-size:18px}' +
      '#spDeb input.sr{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1px solid #262b5a;background:#161a3a;color:#fff;font-size:16px;margin-bottom:10px;outline:none}' +
      '#spDeb h4{margin:14px 2px 8px;font-size:14px;color:#9aa3d9;font-weight:700}' +
      '#spDeb .it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:11px 12px;margin-bottom:8px;color:#fff}' +
      '#spDeb .it .tx{flex:1;min-width:0}#spDeb .it b{display:block;font-size:16px}#spDeb .it small{display:block;font-size:12px;color:#9aa3d9;margin-top:2px}#spDeb .it .mv{font-family:ui-monospace,Menlo,monospace;color:#f5c542;font-size:12px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spDeb .it .ok{font-size:20px}' +
      '#spDeb .bd{width:min(94vw,440px);aspect-ratio:1;margin:0 auto;display:grid;grid-template-columns:repeat(8,1fr);border:4px solid #8a4a1c;border-radius:6px;overflow:hidden;position:relative}' +
      '#spDeb .bd>div{position:relative;display:flex;align-items:center;justify-content:center}#spDeb .bd .l{background:#f3bb86}#spDeb .bd .d{background:#7b2f13}#spDeb .bd .lm{box-shadow:inset 0 0 0 100px rgba(245,217,43,.35)}#spDeb .bd .sel{box-shadow:inset 0 0 0 3px #f5d92b}#spDeb .bd .hint{box-shadow:inset 0 0 0 3px #34f5c5}' +
      '#spDeb .pc{width:80%;height:80%;border-radius:50%;border:2px solid #000}#spDeb .pc.w{background:radial-gradient(circle at 35% 28%,#fff,#bbb);border-color:#9a9a9a}#spDeb .pc.b{background:radial-gradient(circle at 35% 28%,#888,#111)}' +
      '#spDeb .crd{font-size:10px;position:absolute;left:2px;bottom:1px;color:rgba(0,0,0,.45);font-weight:700}#spDeb .d .crd{color:rgba(255,255,255,.4)}' +
      '#spDeb .ml{display:flex;flex-wrap:wrap;gap:4px;margin:12px 0;font-family:ui-monospace,Menlo,monospace;font-size:14px}#spDeb .ml span{padding:5px 7px;border-radius:8px;background:#161a3a;cursor:pointer}#spDeb .ml span.no{background:transparent;color:#9aa3d9;cursor:default;padding:5px 2px}#spDeb .ml span.on{background:#6b5cf0}' +
      '#spDeb .nav{display:flex;gap:6px;justify-content:center;margin:10px 0}#spDeb .nav button,#spDeb .bt{border:0;border-radius:12px;padding:11px 14px;background:#262b5a;color:#fff;font-size:16px;font-weight:700}#spDeb .bt.p{background:#6b5cf0}#spDeb .bt.g{background:#16a34a}' +
      '#spDeb .ds{background:#161a3a;border:1px solid #262b5a;border-radius:14px;padding:12px;font-size:15px;line-height:1.5;color:#d6dbff;margin-top:10px}#spDeb .ds small{display:block;color:#9aa3d9;margin-top:6px;font-size:12px}' +
      '#spDeb .msg{min-height:24px;text-align:center;font-weight:700;margin:10px 0;font-size:16px}#spDeb .row2{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}' +
      '#spDeb .shake{animation:debSh .3s}@keyframes debSh{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}';
    document.head.appendChild(s);
  }
  function init() { var b = []; for (var r = 0; r < 8; r++) { b.push([]); for (var c = 0; c < 8; c++) b[r].push((r + c) % 2 === 1 ? (r < 3 ? 2 : r > 4 ? 1 : 0) : 0); } return b; }
  function hop(b, h) { var p = b[h[0]][h[1]]; b[h[0]][h[1]] = 0; var dr = h[2] > h[0] ? 1 : -1, dc = h[3] > h[1] ? 1 : -1; for (var r = h[0] + dr, c = h[1] + dc; r !== h[2]; r += dr, c += dc) b[r][c] = 0; if (p === 1 && h[2] === 0) p = 3; if (p === 2 && h[2] === 7) p = 4; b[h[2]][h[3]] = p; }
  function pos(n) { var b = init(); for (var i = 0; i < n; i++) cur.steps[i].p.forEach(function (h) { hop(b, h); }); return b; }
  function nm(r, c) { return String.fromCharCode(97 + c) + (8 - r); }

  // ---------- ro'yxat
  function list() {
    stopAuto(); cur = null; mode = 'view';
    var L = learned(), h = '<div class="tp"><button id="dX">✕</button><b>📖 Debyutlar kutubxonasi</b></div>';
    h += '<input class="sr" id="dQ" placeholder="🔍 Qidirish: Shahar, Kol, Gorodskaya…" value="' + esc(q) + '">';
    var n = DATA.filter(function (d) { return L[d.ru]; }).length;
    h += '<div style="font-size:13px;color:#9aa3d9;margin:0 2px 4px">' + DATA.length + ' ta debyut · ✅ ' + n + ' tasini yod oldingiz</div>';
    var qq = q.trim().toLowerCase();
    Object.keys(GR).forEach(function (g) {
      var a = DATA.filter(function (d) { return d.g === g && (!qq || (d.uz + ' ' + d.ru + ' ' + d.mv).toLowerCase().indexOf(qq) >= 0); });
      if (!a.length) return;
      h += '<h4>' + GR[g] + ' (' + a.length + ')</h4>';
      a.forEach(function (d) { h += '<button class="it" data-i="' + DATA.indexOf(d) + '"><div class="tx"><b>' + esc(d.uz) + '</b><small>' + esc(d.ru) + '</small><div class="mv">' + esc(d.mv) + '</div></div><span class="ok">' + (L[d.ru] ? '✅' : '›') + '</span></button>'; });
    });
    h += '<div style="font-size:11px;color:#6f78ad;margin-top:14px;line-height:1.4">Manba: Vikipediya — “Список дебютов (русские шашки)” va tegishli maqolalar. Yurishlar o‘yin qoidalari bo‘yicha tekshirilgan.</div>';
    ov.innerHTML = h;
    ov.querySelector('#dX').onclick = close;
    var inp = ov.querySelector('#dQ'); inp.oninput = function () { q = inp.value; var p = inp.selectionStart; list(); var i2 = ov.querySelector('#dQ'); i2.focus(); try { i2.setSelectionRange(p, p); } catch (e) {} };
    Array.prototype.forEach.call(ov.querySelectorAll('[data-i]'), function (b) { b.onclick = function () { open(DATA[+b.getAttribute('data-i')]); }; });
  }

  // ---------- ko'rish
  function open(d) { cur = d; ply = d.steps.length; mode = 'view'; msg = ''; sel = null; draw(); }
  function board(b, o) {
    o = o || {}; var h = '<div class="bd' + (o.shake ? ' shake' : '') + '" id="dB">';
    var flip = mode === 'learn' && side === 'b';
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var r = flip ? 7 - i : i, c = flip ? 7 - j : j, v = b[r][c], cls = (r + c) % 2 ? 'd' : 'l';
      if (o.lm && o.lm.some(function (x) { return x[0] === r && x[1] === c; })) cls += ' lm';
      if (sel && sel[0] === r && sel[1] === c) cls += ' sel';
      if (o.hint && o.hint[0] === r && o.hint[1] === c) cls += ' hint';
      h += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + (v ? '<i class="pc ' + (v === 1 || v === 3 ? 'w' : 'b') + '"></i>' : '') + ((flip ? i === 7 : j === 0) ? '' : '') + '</div>';
    }
    return h + '</div>';
  }
  function lastSq(n) { if (!n) return null; var p = cur.steps[n - 1].p; return [[p[0][0], p[0][1]], [p[p.length - 1][2], p[p.length - 1][3]]]; }
  function moveList(n) {
    var h = '<div class="ml">';
    cur.steps.forEach(function (s, i) { if (i % 2 === 0) h += '<span class="no">' + (i / 2 + 1) + '.</span>'; h += '<span data-p="' + (i + 1) + '" class="' + (i + 1 === n ? 'on' : '') + '">' + s.n + '</span>'; });
    return h + '</div>';
  }
  function stepSound(b, p, from) { // b — yurishdan oldingi holat; p — sakrashlar; from — nechanchi sakrashdan
    var S = window.SPSound; if (!S || !p || from >= p.length) return;
    try {
      b = b.map(function (x) { return x.slice(); }); var caps = 0, pc = b[p[from][0]][p[from][1]];
      for (var i = from; i < p.length; i++) { var h = p[i], dr = h[2] > h[0] ? 1 : -1, dc = h[3] > h[1] ? 1 : -1; for (var r = h[0] + dr, c = h[1] + dc; r !== h[2]; r += dr, c += dc) if (b[r][c]) caps++; hop(b, h); }
      var last = p[p.length - 1], king = (pc === 1 && last[2] === 0) || (pc === 2 && last[2] === 7);
      if (king) S.play('king'); else if (caps) { for (var k = 0; k < caps; k++) setTimeout(function () { S.play('capture'); }, k * 120); } else S.play('move');
    } catch (e) {}
  }
  var sCur = null, sN = 0;
  function sounds() { if (sCur === cur && ply === sN + 1) stepSound(pos(ply - 1), cur.steps[ply - 1].p, 0); sCur = cur; sN = ply; }
  function draw(o) {
    o = o || {};
    var d = cur, h = '<div class="tp"><button id="dBk">‹</button><b>' + esc(d.uz) + '</b></div>';
    sounds();
    h += '<div style="color:#9aa3d9;font-size:13px;margin:-6px 0 10px 4px">' + esc(d.ru) + '</div>';
    if (mode === 'view') {
      h += board(pos(ply), { lm: lastSq(ply) });
      h += moveList(ply);
      h += '<div class="nav"><button id="d0">⏮</button><button id="dP">◀</button><button id="dA">' + (auto ? '⏸' : '▶️ Ko‘rsatish') + '</button><button id="dN">▶</button><button id="d9">⏭</button></div>';
      h += '<div class="row2"><button class="bt p" id="dLw">🎯 Oq bo‘lib yod olish</button><button class="bt p" id="dLb">🎯 Qora bo‘lib yod olish</button></div>';
      if (d.d) h += '<div class="ds">' + esc(d.d) + '</div>';
    } else {
      var b = pos(ply), done = ply >= d.steps.length;
      h += '<div class="msg">' + (msg || (done ? '' : (cur.steps[ply].s === side ? '👆 Sizning navbatingiz: ' + (side === 'w' ? '⚪ oq' : '⚫ qora') : '⏳ Raqib yurmoqda…'))) + '</div>';
      h += board(b, { lm: lastSq(ply), hint: o.hint, shake: o.shake });
      h += moveList(ply);
      h += '<div class="row2">' + (done ? '<button class="bt g" id="dAg">🔄 Yana</button>' : '<button class="bt" id="dH">💡 Ko‘rsatma</button>') + '<button class="bt" id="dV">📖 Ko‘rish rejimi</button></div>';
    }
    ov.innerHTML = h;
    ov.querySelector('#dBk').onclick = list;
    var e;
    if (mode === 'view') {
      ov.querySelector('#d0').onclick = function () { stopAuto(); ply = 0; draw(); };
      ov.querySelector('#d9').onclick = function () { stopAuto(); ply = d.steps.length; draw(); };
      ov.querySelector('#dP').onclick = function () { stopAuto(); if (ply > 0) ply--; draw(); };
      ov.querySelector('#dN').onclick = function () { stopAuto(); if (ply < d.steps.length) ply++; draw(); };
      ov.querySelector('#dA').onclick = function () { if (auto) { stopAuto(); draw(); return; } if (ply >= d.steps.length) ply = 0; auto = setInterval(function () { if (!cur || ply >= cur.steps.length) { stopAuto(); if (cur) draw(); return; } ply++; draw(); }, 900); draw(); };
      ov.querySelector('#dLw').onclick = function () { learn('w'); };
      ov.querySelector('#dLb').onclick = function () { learn('b'); };
    } else {
      if ((e = ov.querySelector('#dH'))) e.onclick = function () { var s = cur.steps[ply]; if (s && s.s === side) { sel = null; draw({ hint: [s.p[0][0], s.p[0][1]] }); } };
      if ((e = ov.querySelector('#dAg'))) e.onclick = function () { learn(side); };
      ov.querySelector('#dV').onclick = function () { mode = 'view'; ply = cur.steps.length; msg = ''; sel = null; draw(); };
      var bd = ov.querySelector('#dB'); if (bd) bd.onclick = function (ev) { var c = ev.target.closest('[data-r]'); if (c) tap(+c.getAttribute('data-r'), +c.getAttribute('data-c')); };
    }
    Array.prototype.forEach.call(ov.querySelectorAll('[data-p]'), function (x) { x.onclick = function () { if (mode !== 'view') return; stopAuto(); ply = +x.getAttribute('data-p'); draw(); }; });
  }
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }

  // ---------- yod olish
  function learn(s) { stopAuto(); mode = 'learn'; side = s; ply = 0; sel = null; msg = ''; busy = false; draw(); setTimeout(oppMove, 500); }
  function oppMove() {
    if (!cur || mode !== 'learn') return;
    if (ply < cur.steps.length && cur.steps[ply].s !== side) { busy = true; setTimeout(function () { if (!cur || mode !== 'learn') return; ply++; busy = false; draw(); oppMove(); }, 650); return; }
    if (ply >= cur.steps.length) finish();
  }
  function tap(r, c) {
    if (busy || ply >= cur.steps.length) return;
    var s = cur.steps[ply]; if (s.s !== side) return;
    var b = pos(ply), v = b[r][c], mine = side === 'w' ? (v === 1 || v === 3) : (v === 2 || v === 4);
    if (mine) { sel = [r, c]; msg = ''; haptic(); draw(); return; }
    if (!sel) return;
    var f = s.p[0], t = s.p[s.p.length - 1];
    if (sel[0] === f[0] && sel[1] === f[1] && r === t[2] && c === t[3]) { sel = null; msg = '✅ To‘g‘ri!'; haptic(); ply++; draw(); oppMove(); }
    else { sel = null; msg = '❌ Bu debyutda boshqa yurish. 💡 Ko‘rsatmadan foydalaning'; haptic('bad'); draw({ shake: true }); }
  }
  function finish() {
    var L = learned(); L[cur.ru] = 1; ls('debLearned', L);
    msg = '🎉 Debyutni yod oldingiz!'; draw();
    try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
  }

  function close() { stopAuto(); if (ov) ov.remove(); ov = null; cur = null; }
  window.spDebut = function () { css(); if (ov) ov.remove(); ov = document.createElement('div'); ov.id = 'spDeb'; document.body.appendChild(ov); list(); };
})();
