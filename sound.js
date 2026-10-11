// sound.js — ShashkaPRO ovozlari (Lichess / Lidraughts uslubida). Tashqi audio fayl kerak emas: hammasi Web Audio'da sintez qilinadi.
// window.SPSound.play("move"|"capture"|"king"|"low"|"tick"), SPSound.count(n), SPSound.openSettings()
(function () {
  "use strict";
  var KEY = "sp_snd2";
  var DEF = { on: true, vol: 0.8, move: true, capture: true, king: true, low: true, count: true, speech: true };

  function load() {
    var cfg = {}, k, x = null;
    try { x = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    for (k in DEF) cfg[k] = (x && typeof x[k] === typeof DEF[k]) ? x[k] : DEF[k];
    return cfg;
  }
  var cfg = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  // ---------- Web Audio ----------
  var ac = null, master = null, noiseBuf = null;
  function ctx() {
    try {
      if (!ac) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C();
        master = ac.createGain();
        master.connect(ac.destination);
      }
      if (ac.state === "suspended" && ac.resume) ac.resume();
      master.gain.value = Math.max(0, Math.min(1, cfg.vol));
      return ac;
    } catch (e) { return null; }
  }
  // brauzer ovozni faqat foydalanuvchi bosganidan keyin ruxsat beradi
  ["touchstart", "pointerdown", "click", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { ctx(); }, { passive: true });
  });

  function noise(a) {
    if (noiseBuf) return noiseBuf;
    var len = Math.floor(a.sampleRate * 0.12);
    noiseBuf = a.createBuffer(1, len, a.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  // ravon ovoz: sinus yoki uchburchak, tez so'nadi
  function tone(a, t, freq, dur, type, gain, endFreq) {
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // yog'och "tak": filtrlangan shovqin + past zarba
  function knock(a, t, pitch, gain) {
    var src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noise(a);
    f.type = "bandpass"; f.frequency.value = pitch; f.Q.value = 1.4;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.1);
    tone(a, t, pitch / 6, 0.07, "sine", gain * 0.9, pitch / 12);
  }

  var SOUNDS = {
    move: function (a, t) { knock(a, t, 1100, 0.55); },
    capture: function (a, t) { knock(a, t, 1500, 0.8); knock(a, t + 0.055, 900, 0.7); },
    king: function (a, t) {
      knock(a, t, 1100, 0.45);
      tone(a, t + 0.07, 660, 0.14, "triangle", 0.35);
      tone(a, t + 0.17, 880, 0.14, "triangle", 0.35);
      tone(a, t + 0.27, 1320, 0.28, "triangle", 0.32);
    },
    low: function (a, t) { tone(a, t, 1000, 0.09, "sine", 0.5); tone(a, t + 0.14, 1000, 0.09, "sine", 0.5); tone(a, t + 0.28, 1000, 0.09, "sine", 0.5); },
    tick: function (a, t) { tone(a, t, 820, 0.045, "sine", 0.28); },
    beep: function (a, t) { tone(a, t, 900, 0.09, "sine", 0.35); },
    go: function (a, t) { tone(a, t, 1250, 0.35, "sine", 0.45); }
  };
  var FLAG = { move: "move", capture: "capture", king: "king", low: "low", tick: "low" };

  function play(name, force) {
    if (!force) {
      if (!cfg.on) return;
      if (FLAG[name] && !cfg[FLAG[name]]) return;
    }
    var a = ctx();
    if (!a || !SOUNDS[name]) return;
    try { SOUNDS[name](a, a.currentTime + 0.005); } catch (e) {}
  }

  // ---------- Inglizcha sanash ----------
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  var voice = null;
  function pickVoice() {
    try {
      if (!window.speechSynthesis) return null;
      var vs = window.speechSynthesis.getVoices() || [];
      voice = null;
      for (var i = 0; i < vs.length; i++) if (/^en[-_]US/i.test(vs[i].lang)) { voice = vs[i]; break; }
      if (!voice) for (var j = 0; j < vs.length; j++) if (/^en/i.test(vs[j].lang)) { voice = vs[j]; break; }
    } catch (e) {}
    return voice;
  }
  try { if (window.speechSynthesis) { pickVoice(); window.speechSynthesis.onvoiceschanged = pickVoice; } } catch (e) {}

  function count(n, force) {
    if (!force && !(cfg.on && cfg.count)) return;
    n = Math.max(1, Math.min(10, Math.round(n)));
    var spoken = false;
    if (cfg.speech && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      try {
        var u = new window.SpeechSynthesisUtterance(WORDS[n]);
        u.lang = "en-US"; u.rate = 1.05; u.pitch = 1; u.volume = Math.max(0, Math.min(1, cfg.vol));
        if (voice || pickVoice()) u.voice = voice;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        spoken = true;
      } catch (e) {}
    }
    // ovoz chiqmasa yoki nutq o'chiq bo'lsa, signal beradi; oxirgi soniyada yuqoriroq
    if (!spoken) play(n === 1 ? "go" : "beep", true);
    else play("tick", true);
  }

  // ---------- Sozlamalar oynasi ----------
  var ROWS = [
    ["move", "Dona yurishi", "move"],
    ["capture", "Dona olish", "capture"],
    ["king", "Damkaga chiqish", "king"],
    ["low", "Vaqt kam qolganda signal (oxirgi 10 soniya)", "low"],
    ["count", "Turnir boshlanishidan oldin sanash (10 → 1)", "count"],
    ["speech", "Sanashni inglizcha ovozda aytish", null]
  ];
  var overlay = null;

  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  function closeSettings() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function openSettings() {
    if (overlay) { closeSettings(); return; }
    overlay = el("div", "position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px");
    var box = el("div", "background:#0f1722;color:#e9eef5;font:14px/1.4 Arial,sans-serif;border:1px solid #2a3647;border-radius:14px;padding:14px;width:100%;max-width:380px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 30px rgba(0,0,0,.6)");
    var head = el("div", "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px");
    head.appendChild(el("b", "font-size:17px", "🔊 Ovoz sozlamalari"));
    var x = el("button", "background:#1c2733;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-size:15px;cursor:pointer", "✕");
    x.onclick = closeSettings;
    head.appendChild(x);
    box.appendChild(head);

    function row(label, key, test) {
      var r = el("label", "display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid #1d2a3a");
      var cb = el("input"); cb.type = "checkbox"; cb.checked = !!cfg[key];
      cb.style.cssText = "width:20px;height:20px;flex:none";
      cb.onchange = function () { cfg[key] = cb.checked; save(); refreshMain(); };
      r.appendChild(cb);
      r.appendChild(el("span", "flex:1", label));
      if (test) {
        var b = el("button", "background:#1c2733;color:#fff;border:0;border-radius:8px;padding:6px 10px;font-size:14px;cursor:pointer", "▶");
        b.onclick = function (e) { e.preventDefault(); if (test === "count") { count(3, true); setTimeout(function () { count(2, true); }, 900); setTimeout(function () { count(1, true); }, 1800); } else play(test, true); };
        r.appendChild(b);
      }
      box.appendChild(r);
      return cb;
    }

    var mainCb = row("Ovoz yoqilgan", "on", null);
    var others = [];
    function refreshMain() {
      for (var i = 0; i < others.length; i++) others[i].disabled = !cfg.on;
    }
    ROWS.forEach(function (r) { others.push(row(r[1], r[0], r[2])); });
    refreshMain();

    var vr = el("div", "display:flex;align-items:center;gap:10px;padding:12px 2px;border-top:1px solid #1d2a3a");
    vr.appendChild(el("span", "flex:none", "Balandlik"));
    var rng = el("input"); rng.type = "range"; rng.min = "0"; rng.max = "100"; rng.value = String(Math.round(cfg.vol * 100));
    rng.style.cssText = "flex:1";
    rng.oninput = function () { cfg.vol = rng.value / 100; save(); if (master) master.gain.value = cfg.vol; };
    rng.onchange = function () { play("move", true); };
    vr.appendChild(rng);
    box.appendChild(vr);

    box.appendChild(el("div", "color:#8fa0b5;font-size:12px;padding-top:4px", "Brauzer ovozni faqat ekranga bir marta tekkaningizdan keyin chiqaradi. Sanash ovozi telefondagi inglizcha nutq tizimiga bog‘liq; bo‘lmasa, signal beriladi."));
    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeSettings(); });
    document.body.appendChild(overlay);
  }

  // ---------- Suzuvchi tugma ----------
  function addButton() {
    if (!document.body || document.getElementById("spSndBtn")) return;
    var b = el("button", "position:fixed;right:12px;bottom:68px;z-index:2147483000;width:38px;height:38px;border-radius:50%;border:0;background:#1c2733;color:#fff;font-size:18px;opacity:.85;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer", "🔊");
    b.id = "spSndBtn";
    b.setAttribute("aria-label", "Ovoz sozlamalari");
    b.onclick = openSettings;
    document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton);
  else addButton();

  window.SPSound = { play: play, count: count, openSettings: openSettings, cfg: cfg };
})();
