/* voice.js — 🎤 ShashkaPRO ovozli boshqaruv.
   • Menyu buyruqlari: «turnir», «masalalar», «o'ynash», «bot», «reyting», «menyu», «sozlamalar», «orqaga/chiq»…
   • O'yinda yurish: «c3 d4», «ce uch de to'rt», «си три ди четыре», «c3 e5 g3» (ketma-ket urish).
   • Ovozli bellashuv: qonuniy bo'lmagan yurish aytsa — o'sha o'yinchi yutqazadi (roomclient → roomVoiceFail).
   Ishlaydi: Chrome/sayt (Web Speech API) va Play ilovasi (Capacitor SpeechRecognition plagini).
   Telegram ichida odatda ishlamaydi — u yerda 🎤 tugma ko'rinmaydi. */
(function () {
  if (window.spVoice) return;
  var W = window, L = W.SP_LANG || 'uz';
  var LANG = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' }[L] || 'uz-UZ';
  var SR = W.SpeechRecognition || W.webkitSpeechRecognition;
  function nat() { try { return W.Capacitor && W.Capacitor.isNativePlatform && W.Capacitor.isNativePlatform() && W.Capacitor.Plugins && W.Capacitor.Plugins.SpeechRecognition; } catch (e) { return null; } }
  function supported() { return !!(SR || nat()); }

  // ---------- tanish (alternativ matnlar ro'yxatini qaytaradi)
  var busy = false;
  function listen(cb) {
    if (busy) return; busy = true; ui(true);
    var done = function (alts, err) { busy = false; ui(false); cb(alts || [], err); };
    var P = nat();
    if (P) {
      Promise.resolve().then(function () { return P.requestPermissions ? P.requestPermissions() : null; })
        .then(function () { return P.start({ language: LANG, maxResults: 5, prompt: T('🎤 Gapiring…'), partialResults: false, popup: true }); })
        .then(function (r) { done((r && r.matches) || []); })
        .catch(function (e) { done([], String(e && e.message || e)); });
      return;
    }
    try {
      var rec = new SR(); rec.lang = LANG; rec.maxAlternatives = 5; rec.interimResults = false; rec.continuous = false;
      var got = false;
      rec.onresult = function (e) { got = true; var a = []; var r = e.results[0]; for (var i = 0; i < r.length; i++) a.push(r[i].transcript); done(a); };
      rec.onerror = function (e) { if (!got) { got = true; done([], e.error || 'error'); } };
      rec.onend = function () { if (!got) { got = true; done([]); } };
      rec.start();
    } catch (e) { done([], String(e.message || e)); }
  }

  // ---------- matnni tahlil qilish
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[‘’ʻ`´]/g, "'").replace(/ё/g, 'е')
      .replace(/([a-zа-я])(\d)/g, '$1 $2').replace(/(\d)([a-zа-я])/g, '$1 $2')
      .replace(/[,.!?;:—–\-x×]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  var FILES = {
    a: ['a', 'ah', 'ey', 'ay', 'а', 'эй', 'ей'],
    b: ['b', 'be', 'bi', 'bee', 'бэ', 'бе', 'би'],
    c: ['c', 'ce', 'se', 'si', 'see', 'sea', 'tse', 'си', 'сэ', 'се', 'це', 'цэ'],
    d: ['d', 'de', 'di', 'dee', 'дэ', 'де', 'ди'],
    e: ['e', 'ye', 'э', 'е', 'и', 'йе'],
    f: ['f', 'ef', 'eff', 'эф', 'еф'],
    g: ['g', 'ge', 'gi', 'ji', 'gee', 'je', 'гэ', 'ге', 'же', 'жи', 'джи', 'ги'],
    h: ['h', 'ash', 'ha', 'xa', 'aitch', 'eych', 'аш', 'ха', 'эйч', 'аш', 'ҳа']
  };
  var NUMS = {
    1: ['1', 'bir', 'один', 'одна', 'one', 'won'],
    2: ['2', 'ikki', 'два', 'две', 'two', 'to', 'too'],
    3: ['3', 'uch', 'три', 'three', 'tree'],
    4: ['4', "to'rt", 'tort', 'turt', 'четыре', 'four', 'for'],
    5: ['5', 'besh', 'пять', 'five'],
    6: ['6', 'olti', 'шесть', 'six'],
    7: ['7', 'yetti', 'етти', 'семь', 'seven'],
    8: ['8', 'sakkiz', 'восемь', 'eight', 'ate']
  };
  var FM = {}, NM = {};
  Object.keys(FILES).forEach(function (k, i) { FILES[k].forEach(function (w) { FM[w] = i; }); });
  Object.keys(NUMS).forEach(function (k) { NUMS[k].forEach(function (w) { NM[w] = +k; }); });
  function squares(text) {   // → [{r,c}] (faqat to'q kataklar)
    var t = norm(text).split(' '), out = [];
    for (var i = 0; i < t.length - 1; i++) {
      if (FM[t[i]] !== undefined && NM[t[i + 1]] !== undefined) {
        var c = FM[t[i]], rank = NM[t[i + 1]], r = 8 - rank;
        if ((r + c) % 2 === 1) out.push({ r: r, c: c, n: 'abcdefgh'[c] + rank });
        else out.push({ r: r, c: c, n: 'abcdefgh'[c] + rank, light: true });
        i++;
      }
    }
    return out;
  }
  // menyu buyruqlari: [kalit so'zlar (regex), amal]
  function navK(k) { var b = document.querySelector('#nvBar button[data-k="' + k + '"]'); if (b) b.click(); }
  function closeTop() {
    var sels = ['#spLangSheet', '#spSetSheet', '#nvTcS', '#nvFrS', '#spVoiceHelp'];
    for (var i = 0; i < sels.length; i++) { var e = document.querySelector(sels[i]); if (e) { e.remove(); return true; } }
    var pl = document.getElementById('nvPlay'); if (pl && pl.style.display === 'block') { pl.style.display = 'none'; return true; }
    var bs = [].slice.call(document.querySelectorAll('button,span,div')).filter(function (b) {
      var x = (b.textContent || '').trim(); if (!/^(←|✕|✖|×|⬅️?|◀)$/.test(x)) return false;
      var r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < 200;
    });
    if (bs.length) { bs[bs.length - 1].click(); return true; }
    var back = document.getElementById('lbBack'); if (back) { back.click(); return true; }
    return false;
  }
  var CMDS = [
    [/taslim|сда(ю|ть)|resign|give up/, function () { if (W.rcVoice && inRoom()) W.rcVoice.resign(); }],
    [/durang|нич(ья|ью)|draw/, function () { if (W.rcVoice && inRoom()) W.rcVoice.draw(); }],
    [/turnir|турнир|tournament/, function () { W.nvK = 't'; if (W.lbNav) W.lbNav.open('t'); }],
    [/masala|задач|puzzle/, function () { navK('puz'); }],
    [/debyut|дебют|opening/, function () { if (W.mnA) W.mnA('@deb'); }],
    [/jonli|эфир|live/, function () { if (W.mnA) W.mnA('@live'); }],
    [/bot|kompyuter|компьютер|бот|computer|ai\b/, function () { if (W.lbNav) { try { W.lbNav.close(); } catch (e) {} } if (W.aiShow) W.aiShow('play'); }],
    [/o'?yna|o'?ynash|игра(ть)?|play|start/, function () { var b = document.getElementById('nvPlayBtn'); if (b) b.click(); }],
    [/reyting|рейтинг|rating|leaderboard/, function () { navK('rk'); }],
    [/sozlama|настрой|setting/, function () { if (W.spSettings) W.spSettings(); }],
    [/menyu|меню|menu/, function () { navK('mn'); }],
    [/profil|профиль|profile/, function () { navK('pf'); }],
    [/bosh|главн|home/, function () { navK('pl'); }],
    [/orqaga|chiq|yop|назад|выйти|выход|закр|back|exit|close/, function () { closeTop(); }],
    [/yordam|помощ|help|buyruq|команд|command/, function () { help(); }]
  ];
  function inRoom() { return !!document.getElementById('lbBack') && !!(W.rcVoice); }

  // ---------- asosiy ishlov
  function handle(alts) {
    if (!alts.length) return say('🤔 Eshitilmadi, qayta urinib ko‘ring');
    var info = inRoom() && W.rcVoice ? W.rcVoice.info() : null;
    // 1) o'yinda — yurish
    if (info && info.playing) {
      var best = null;
      for (var i = 0; i < alts.length && !best; i++) { var q = squares(alts[i]); if (q.length >= 2) best = { sq: q, txt: alts[i] }; }
      if (best) {
        var said = best.sq.map(function (x) { return x.n; }).join('–');
        if (!info.myTurn) return say('⏳ Hozir raqib navbati (' + said + ')');
        var res = best.sq.some(function (x) { return x.light; }) ? 'illegal' : W.rcVoice.move(best.sq, said);
        if (res === 'ok') return say('✅ ' + said);
        if (res === 'illegal') {
          if (info.voice) { W.rcVoice.fail(said); return say('❌ ' + said + ' — noto‘g‘ri yurish! Siz yutqazdingiz', 5000); }
          return say('❌ ' + said + ' — bunday yurish yo‘q');
        }
        return say('⏳ Kuting…');
      }
    }
    // 2) menyu buyruqlari
    for (var a = 0; a < alts.length; a++) {
      var t = norm(alts[a]);
      for (var k = 0; k < CMDS.length; k++) if (CMDS[k][0].test(t)) { say('🎤 «' + alts[a] + '»'); try { CMDS[k][1](); } catch (e) {} return; }
    }
    if (info && info.playing) return say('🤔 «' + alts[0] + '» — yurishni tushunmadim. Masalan: «c3 d4»');
    say('🤔 «' + alts[0] + '» — buyruq topilmadi. «Yordam» deb ayting');
  }

  // ---------- interfeys
  var T = function (s) { return W.spT ? W.spT(s) : s; };
  var btn = null, bub = null, bt = 0;
  function css() {
    var st = document.createElement('style');
    st.textContent = '#spMic{position:fixed;right:14px;bottom:calc(132px + env(safe-area-inset-bottom));width:52px;height:52px;border-radius:50%;border:0;z-index:2147482000;background:linear-gradient(135deg,#7c4dff,#4f5bff);color:#fff;font-size:24px;box-shadow:0 6px 18px rgba(79,91,255,.5);display:none;align-items:center;justify-content:center}' +
      '#spMic.on{background:linear-gradient(135deg,#ff5252,#ff1744);animation:spMicP 1s infinite}#spMic.big{width:64px;height:64px;font-size:30px}' +
      '@keyframes spMicP{0%,100%{box-shadow:0 0 0 0 rgba(255,23,68,.6)}50%{box-shadow:0 0 0 14px rgba(255,23,68,0)}}' +
      '#spMicB{position:fixed;left:16px;right:16px;bottom:calc(196px + env(safe-area-inset-bottom));z-index:2147482001;background:rgba(20,16,64,.95);color:#fff;border-radius:14px;padding:12px 14px;font:600 15px system-ui,sans-serif;text-align:center;display:none;box-shadow:0 6px 20px rgba(0,0,0,.4)}' +
      '#spVoiceHelp{position:fixed;inset:0;z-index:2147482500;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;font-family:system-ui,sans-serif}#spVoiceHelp>div{width:100%;background:#141040;color:#fff;border-radius:20px 20px 0 0;padding:16px 18px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;max-height:80vh;overflow:auto}#spVoiceHelp li{margin:5px 0}';
    document.head.appendChild(st);
  }
  function ui(on) { if (btn) btn.classList.toggle('on', !!on); if (on) say('🎤 Gapiring…', 8000); }
  function say(t, ms) {
    if (!bub) return;
    bub.textContent = t; bub.style.display = 'block';
    clearTimeout(bt); bt = setTimeout(function () { bub.style.display = 'none'; }, ms || 3000);
  }
  function help() {
    var old = document.getElementById('spVoiceHelp'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'spVoiceHelp';
    d.innerHTML = '<div><div style="display:flex;align-items:center"><b style="font-size:20px">🎤 Ovozli buyruqlar</b><span data-x="1" style="margin-left:auto;font-size:24px;padding:4px 8px">✕</span></div>' +
      '<p style="color:#b9b2e6;margin:8px 0">🎤 tugmasini bosing va ayting:</p><ul style="padding-left:20px">' +
      '<li><b>«O‘ynash»</b> — o‘ynash sahifasi</li><li><b>«Turnir»</b> — turnirlar</li><li><b>«Masalalar»</b> — masalalar</li>' +
      '<li><b>«Bot»</b> — kompyuterga qarshi</li><li><b>«Reyting»</b>, <b>«Menyu»</b>, <b>«Sozlamalar»</b>, <b>«Bosh sahifa»</b></li>' +
      '<li><b>«Orqaga»</b> / <b>«Chiq»</b> — oynani yopish</li></ul>' +
      '<p style="color:#b9b2e6;margin:12px 0 6px">O‘yin paytida:</p><ul style="padding-left:20px">' +
      '<li><b>«c3 d4»</b> yoki <b>«ce uch de to‘rt»</b> — yurish</li><li><b>«c3 e5 g3»</b> — ketma-ket urish</li>' +
      '<li><b>«Durang»</b>, <b>«Taslim»</b></li></ul>' +
      '<p style="background:#2a1f6b;border-radius:12px;padding:10px;margin-top:12px">⚔️ <b>Ovozli bellashuv</b>da noto‘g‘ri (qoidaga zid) yurish aytgan o‘yinchi darhol yutqazadi. Tushunilmagan gap esa hisobga olinmaydi — qayta aytasiz.</p></div>';
    d.onclick = function (e) { if (e.target === d || e.target.getAttribute('data-x')) d.remove(); };
    document.body.appendChild(d);
  }
  function mount() {
    if (!document.body) return setTimeout(mount, 200);
    css();
    btn = document.createElement('button'); btn.id = 'spMic'; btn.type = 'button'; btn.textContent = '🎤'; btn.setAttribute('aria-label', 'Ovozli buyruq');
    bub = document.createElement('div'); bub.id = 'spMicB'; bub.setAttribute('aria-live', 'polite');
    document.body.appendChild(bub); document.body.appendChild(btn);
    var lp = 0;
    btn.addEventListener('touchstart', function () { lp = setTimeout(function () { lp = -1; help(); }, 650); }, { passive: true });
    btn.addEventListener('touchend', function () { if (lp > 0) clearTimeout(lp); });
    btn.onclick = function () { if (lp === -1) { lp = 0; return; } listen(function (alts, err) { if (err && !alts.length) return say(err === 'not-allowed' ? '🎤 Mikrofonga ruxsat bering' : '🤔 Eshitilmadi, qayta urinib ko‘ring'); handle(alts); }); };
    try { if (!localStorage.getItem('spMicSeen')) { localStorage.setItem('spMicSeen', '1'); setTimeout(function () { say('🎤 Yangi: ovozli boshqaruv! Tugmani bosib «O‘ynash» deb ayting. Uzoq bossangiz — buyruqlar ro‘yxati', 6000); }, 4000); } } catch (e) {}
    setInterval(function () {
      var on = true; try { on = localStorage.getItem('spMicOff') !== '1'; } catch (e) {}
      var room = inRoom(), inf = room && W.rcVoice ? W.rcVoice.info() : null;
      btn.style.display = on ? 'flex' : 'none';
      btn.classList.toggle('big', !!(inf && inf.voice && inf.playing));
      if (room) btn.style.bottom = 'calc(' + (inf && inf.voice ? 110 : 90) + 'px + env(safe-area-inset-bottom))';
      else btn.style.bottom = '';
    }, 700);
  }
  W.spVoice = { supported: supported, listen: listen, squares: squares, hint: function (t) { say(T(t), 3500); }, help: help };
  if (supported()) mount();
})();
