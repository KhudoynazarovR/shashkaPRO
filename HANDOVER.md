# ShashkaPRO — topshiriq fayli (boshqa yordamchi davom ettirishi uchun)

Oxirgi yangilanish: 2026-11-26.

Bu fayl loyihani birinchi marta ko‘rgan odam yoki AI uchun. Repozitoriyni ochib, shu faylni
o‘qib chiqsa, ishni to‘xtagan joyidan davom ettira oladi.

---

## 1. Loyiha nima

**ShashkaPRO** — rus shashkasi platformasi: Telegram mini-app (`@DraughtsPRObot`) va veb-sayt.
Onlayn o‘yinlar, turnirlar (arena va shveytsar), viloyatlar kubogi, klublar, masalalar,
debyutlar, botlar bilan o‘yin, reyting, tanga iqtisodi, do‘kon, kvestlar.

- Server: Node.js (freymvorksiz, o‘z HTTP + WebSocket qatlami)
- Baza: PostgreSQL, bitta jadval `kv (k text primary key, v jsonb)` — `store.js` ichida
- Hosting: Render (Frankfurt), `main` tarmog‘idan avtomatik deploy
- Tarmoqlar: ish `keyingi-deploy` da, chiqarishda `main` ga ham yuboriladi

## 2. Asosiy fayllar

### Server
| Fayl | Vazifasi |
|---|---|
| `server.js` | HTTP, statik fayllar, HTML yig‘ish (skriptlarni ulash), WebSocket, gzip, kesh |
| `store.js` | Postgres `kv` jadvali, barcha ma’lumot (`store.db`, `store.users()`), 10 s da bir saqlaydi |
| `lobby.js` | Lobbi, turnirlar (arena/shveytsar), juftlash, mukofotlar, klub/viloyat hisobi |
| `rooms.js` | O‘yin xonalari, soat, yurishlar, natija, botlar bilan o‘yin |
| `vrules.js` | **Haqiqiy o‘yin qoidalari** (xonalarda shu ishlatiladi). Turk zarbasi to‘g‘ri bajarilgan |
| `russian-rules.js` | Qoidalarning ikkinchi nusxasi — bot arenalari (`botarena.js`, `arenabb.js`, `online.js`) uchun |
| `kestoai.js` | Hozirgi dvigatel (King Kong va boshqa botlar shundan kuch oladi) |
| `economy.js` | Tanga, do‘kon, `/api/puzzles`, `/api/leaders` va boshqa HTTP API |
| `clubs.js` | Klublar, viloyat jamoalari (avtomatik a’zolik), klub reytingi (Elo, 1000 dan) |
| `flags.js` | Viloyatlar, bayroqlar, viloyatlar hisobi |
| `bot.js` | Telegram bot: `/start`, xabarlar, kanal/guruhga posterlar |
| `tposter.js` | Turnir e’lon va natija posterlari (SVG → PNG, sharp) |

### Mijoz (brauzer)
| Fayl | Vazifasi |
|---|---|
| `index.html` | Sahifa karkasi, doska CSS, boshlang‘ich skriptlar |
| `roomclient.js` | **O‘yin doskasi**: yurish, sudrab yurish, pro avtohod, premove, soat, chat |
| `lobbyclient.js` | Lobbi, o‘yinchilar, klublar, turnir ro‘yxati |
| `tarena.js` | Arena turniri sahifasi (jadval, viloyat/klub hisobi, tanga taqsimoti) |
| `menu.js` | Masalalar bo‘limi (ro‘yxat, papkalar, kitoblar) |
| `pzhub.js` | Masalalar bosh sahifasi (kartalar) |
| `webauth.js` | Saytda kirish (Google / Telegram / login-parol), sessiya |
| `board.js`, `aiview.js` | AI bilan o‘yin va tahlil doskasi |

## 3. Foydalanuvchi bilan ishlash qoidalari (muhim)

1. **Faqat o‘zbekcha (lotin)** javob berish. Qisqa, takrorsiz, bitta keyingi qadam.
2. **Savol bersa — so‘z bilan javob**, kod yozmaslik. Avval ko‘rinishini rasm qilib ko‘rsatish.
3. **Patch yozishdan oldin so‘rash.** O‘zboshimchalik bilan kod o‘zgartirmaslik.
4. **So‘ralmagan emoji/bezak qo‘shmaslik.**
5. **Va’da emas, o‘lchangan natija**: «tezlashadi» emas, «3336 ms → 2016 ms».
6. **Chiqarish faqat «Chiqar» deganda.** Stop-hook ning «uncommitted changes» xabari ruxsat emas.
7. Terminal buyruq berilsa, oxiriga git add/commit/push qadamini ham qo‘shish.

### Chiqarish tartibi
```bash
cd /home/claude/shashkapro
git checkout -- tournaments.json          # sinov serveri o'zgartirib qo'yadi
git add -A && git commit -F - <<'EOF'
<o'zbekcha sarlavha>

<o'zgarishlar ro'yxati, o'lchangan raqamlar bilan>

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: <sessiya havolasi>
EOF
git push -q origin keyingi-deploy
git push -q origin keyingi-deploy:main     # Render shu tarmoqdan deploy qiladi
```

## 4. Mahalliy sinov

```bash
cd /home/claude/shashkapro
BOT_TOKEN=123:test PORT=3421 NOTIFY_OFF=1 node server.js &
```
`BOT_TOKEN=123:test` bo‘lsa, initData imzosini shu token bilan yasash mumkin (HMAC-SHA256,
kalit = `HMAC("WebAppData", token)`). Playwright o‘rnatilgan — brauzer sinovlari shu bilan
yoziladi (`chromium.launch()`). Sinovdan keyin `tournaments.json` ni tiklash va
`clubs-data.json` ni o‘chirish kerak.

## 5. Render sozlamalari

- Xizmat: `shashkapro` (Frankfurt), manzil `https://shashkapro-eu.onrender.com`
- Baza: `shashkapro-db-eu` (Frankfurt). Eski `shashkapro-db` (Ohio) — zaxira, to‘xtatilgan, keyin o‘chiriladi
- Env guruhi: `shashkapro-env`. `PUBLIC_URL` bo‘lmasa, Render beradigan `RENDER_EXTERNAL_URL` ishlatiladi
- Telegram mini-app manzili BotFather’da ikki joyda: menyu tugmasi va `play` nomli mini-app
- Baza ko‘chirish skripti: `migrate-db.js` (`OLD_DB_URL` + `DATABASE_URL`, `WIPE=1` bilan tozalab ko‘chiradi)

## 6. Yaqinda qilinganlar (2026-11-25/26)

- Turnirda qotish tuzatildi: klublar ro‘yxati yengillashtirildi (bitta mijozga 517 KB → 7,9 KB)
- Arena vaqti tugagach ko‘pi bilan 60 s kutadi, keyin natijani e’lon qiladi
- Tanga taqsimoti ilovada ko‘rinadi (viloyat ulushi, a’zolar, top-3), yaxlitlash qoldig‘i g‘olibga
- Masalalar: API javoblari gzip (2,79 MB → 289 KB), ro‘yxat keshlanadi, etyudlar olib tashlandi
- Kirish sahifasi: skriptlar `defer`, rasmlarga kesh, kirish skeleti → FCP 3,3 s → 2,0 s, CLS 0,3 → 0
- Doskada: pro avtohod (borish katagini bosish), sudrab yurish, premove belgilari
- Ohio → Frankfurt ko‘chirish (228 qator) tugallandi

## 7. Qolgan ishlar

1. `menu.js` ni bo‘lish — 227 KB fayl, 159 KB i ishlatilmaydi (PageSpeed).
2. Eski `shashkapro-db` (Ohio) bazasini o‘chirish — to‘lovni to‘xtatish uchun.
3. `russian-rules.js` dagi turk zarbasi tuzatishi (saqlanmagan bo‘lsa, chiqarish kerak):
   urilgan dona yurish oxirigacha doskada qoladi, ustidan uchib o‘tib bo‘lmaydi.
4. O‘yin tugashi bilan «eng katta xatoyingiz» kartasi (dvigatel bor, natija oynasiga ulash kerak).
5. Aloqa uzilganda o‘yinni yo‘qotmaslik (qayta ulanish holatini aniq ko‘rsatish).

## 8. DragonBOT rejasi (joriy topshiriq)

**Maqsad:** DragonBOT ni Skifi dvigateli ustiga qurish (Kesto emas). Keyinchalik Kolisto’dan ham
kuch oladi.

Hozirgi holat: `dragonsrv.js` va `dragon.js` — faqat «tez kunda» ro‘yxati, izohlar va admin
boshqaruvi. O‘yin dvigateli hali ulanmagan.

**Skifi haqida:** foydalanuvchi yuborgan arxivda `skifi_russian_0_39` — Delphi/Pascal’da yozilgan
rus shashkasi dvigateli (2015), manba kodi bilan:
- `GenMoveUnit.pas` — yurish generatori (32 katakli doska)
- `EvalUnit.pas` — baholash: dona/damka uchun katak jadvallari (`ET`, `ED`), markaz va
  qanot chiziqlari, oxirgi qatordagi tuzilmalar, endshpil bazasi (`EdProbe`) chaqiruvi
- `SearchUnit.pas` — alfa-beta (`AB`), PV, hash jadval (`HashUnit.pas`), history evristikasi
- `skifi_russian_0_39.dll` — Windows uchun tayyor kutubxona, `EI_*` interfeysi
  (`EI_Think`, `EI_SetupBoard`, `EI_Analyse`, …)

**Yo‘llar:**
1. **Pascal’ni Linuxga kompilyatsiya qilish** (Free Pascal). Windowsga bog‘liq joylarni
   (`Windows`, `mmsystem`, `LoadLibrary`) almashtirish kerak. So‘ng Node’dan alohida jarayon
   sifatida chaqiriladi (stdin/stdout protokoli). Eng kuchli natija.
   Diqqat: bu muhitda internet o‘chiq — `fpc` o‘rnatib bo‘lmaydi, kompilyatsiyani boshqa joyda
   qilish kerak.
2. **JS ga ko‘chirish** — `EvalUnit` va `SearchUnit` mantiqini `dragonai.js` ga yozish,
   yurish generatori sifatida bizdagi `russian-rules.js`/`vrules.js` dan foydalanish.
   Sekinroq, lekin Render’da hech qanday qo‘shimcha talabsiz ishlaydi.
3. **Wine orqali DLL** — Render’da ishonchsiz, tavsiya etilmaydi.

Tavsiya: 2-yo‘ldan boshlash (baholash jadvallarini ko‘chirish ham sezilarli kuch beradi),
keyin imkon bo‘lsa 1-yo‘lga o‘tish.

**Ulash nuqtalari:** bot yurishi `rooms.js` dagi bot oqimidan chaqiriladi; botlar ro‘yxati va
reytingi `store.db.botElo` da; `kestoai.js` ning `move({board, side, timeMs})` interfeysi
namuna bo‘ladi — Dragon uchun ham shunday interfeys qilinsa, almashtirish oson bo‘ladi.
