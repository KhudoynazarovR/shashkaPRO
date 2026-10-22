// prepare.js — GitHub Actions'da `npx cap add android` dan keyin ishga tushadi.
// Android loyihasini ShashkaPRO uchun sozlaydi: AdMob ID, ikonkalar, splash, versiya.
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = __dirname;
const RES = path.join(ROOT, 'android/app/src/main/res');
const ICON = path.join(ROOT, '../public/app/icon-512.png');        // dumaloq burchakli ikonka
const MASK = path.join(ROOT, '../public/app/maskable-512.png');    // to'liq fonli (adaptive)
const BG = '#140a33';
// AdMob ilova ID si. Hali AdMob hisobi bo'lmasa — Google'ning rasmiy TEST ID si (sinov reklamalari).
const ADMOB_APP_ID = process.env.ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
const RUN = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);

function edit(file, fn) { const p = path.join(ROOT, file); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); }

(async () => {
  // 1) AndroidManifest: AdMob ilova ID si
  edit('android/app/src/main/AndroidManifest.xml', s => s.includes('gms.ads.APPLICATION_ID') ? s :
    s.replace(/<application([^>]*)>/, m => m + '\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="' + ADMOB_APP_ID + '"/>'));

  // 1b) Ovozli boshqaruv: mikrofon ruxsati va Android ovoz tanish xizmatiga murojaat (Android 11+)
  edit('android/app/src/main/AndroidManifest.xml', s => {
    if (!s.includes('android.permission.RECORD_AUDIO')) s = s.replace(/<application/, '<uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <application');
    if (!s.includes('android.speech.RecognitionService')) s = s.replace(/<application/, '<queries>\n        <intent>\n            <action android:name="android.speech.RecognitionService" />\n        </intent>\n    </queries>\n    <application');
    return s;
  });

  // 2) Versiya: har bir GitHub yig'ishida versionCode oshadi (Play shuni talab qiladi)
  edit('android/app/build.gradle', s => s
    .replace(/versionCode\s+\d+/, 'versionCode ' + RUN)
    .replace(/versionName\s+"[^"]*"/, 'versionName "1.0.' + RUN + '"'));

  // 3) Ikonkalar
  const D = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(D)) {
    const dir = path.join(RES, 'mipmap-' + d); fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(48 * k), f = Math.round(108 * k);
    await sharp(ICON).resize(n, n).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(ICON).resize(n, n).composite([{ input: Buffer.from('<svg width="' + n + '" height="' + n + '"><circle cx="' + n / 2 + '" cy="' + n / 2 + '" r="' + n / 2 + '"/></svg>'), blend: 'dest-in' }]).png().toFile(path.join(dir, 'ic_launcher_round.png'));
    await sharp(MASK).resize(f, f).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
  // adaptive ikonka foni
  const bgXml = path.join(RES, 'values/ic_launcher_background.xml');
  fs.writeFileSync(bgXml, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">' + BG + '</color>\n</resources>\n');
  const ad = path.join(RES, 'mipmap-anydpi-v26');
  if (fs.existsSync(ad)) for (const f of fs.readdirSync(ad)) {
    const p = path.join(ad, f);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/@drawable\/ic_launcher_background/g, '@color/ic_launcher_background'));
  }
  const vbg = path.join(RES, 'drawable/ic_launcher_background.xml'); if (fs.existsSync(vbg)) fs.unlinkSync(vbg);

  // 4) Splash ekranlar: Capacitor logotipi o'rniga ShashkaPRO ikonkasi
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  for (const f of walk(RES).filter(p => path.basename(p) === 'splash.png')) {
    const m = await sharp(f).metadata(), w = m.width, h = m.height, s = Math.round(Math.min(w, h) * 0.38);
    const ic = await sharp(ICON).resize(s, s).png().toBuffer();
    await sharp({ create: { width: w, height: h, channels: 4, background: BG } })
      .composite([{ input: ic, top: Math.round((h - s) / 2), left: Math.round((w - s) / 2) }]).png().toFile(f + '.tmp');
    fs.renameSync(f + '.tmp', f);
  }

  // 5) Ekran: Android 15 dagi «butun ekran» (edge-to-edge) ni o'chiramiz — aks holda sahifa
  //    holat paneli va pastki tugmalar ostiga kirib qoladi. Panellar o'yin rangida bo'ladi.
  edit('android/app/src/main/res/values/styles.xml', s => s.replace(/<\/style>/g,
    '    <item name="android:windowOptOutEdgeToEdgeEnforcement" tools:targetApi="35">true</item>\n' +
    '        <item name="android:statusBarColor">' + BG + '</item>\n' +
    '        <item name="android:navigationBarColor">' + BG + '</item>\n' +
    '        <item name="android:windowLightStatusBar">false</item>\n    </style>')
    .replace(/<resources(\s[^>]*)?>/, m => m.includes('xmlns:tools') ? m : m.replace('<resources', '<resources xmlns:tools="http://schemas.android.com/tools"')));

  console.log('✅ prepare.js: AdMob=' + ADMOB_APP_ID + ' versionCode=' + RUN);
})().catch(e => { console.error(e); process.exit(1); });
