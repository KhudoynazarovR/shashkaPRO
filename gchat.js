/* gchat.js — 💬 mini o'yinlar chati (Ugolki, Shaxmat, Go, Gomoku, Poddavki, Tosh-qaychi-qog'oz).
   O'ng pastda 💬 tugmasi (o'qilmaganlar soni bilan) → pastdan oyna: xabarlar, tezkor iboralar va yozish joyi.
   O'yin sahifasidan tashqarida turadi (sahifa qayta chizilsa ham yozilgan matn yo'qolmaydi).
   API: GCHAT.init(sendFn) · GCHAT.set(list, myName) · GCHAT.show(true|false) */
(function (root) {
  var sendFn = null, list = [], seen = 0, open = false, me = '', shown = false, btn, box, ls, inp, bd;
  var QUICK = ['👋 Salom!', '👍 Zo‘r!', '🍀 Omad!', '🤝 Yaxshi o‘yin!', '😅 Voy!', '🔥', '⏳ Tezroq!', '🔁 Yana?'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    var st = document.createElement('style');
    st.textContent = '#gcB{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:52px;height:52px;border-radius:50%;border:0;background:#3fa34d;color:#fff;font-size:24px;box-shadow:0 6px 16px rgba(0,0,0,.45);z-index:60;display:none}' +
      '#gcB i{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#e11d48;font-style:normal;font-size:12px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 5px}' +
      '#gcX{position:fixed;inset:0;z-index:70;display:none;background:rgba(0,0,0,.45)}#gcX .p{position:absolute;left:0;right:0;bottom:0;max-width:520px;margin:0 auto;background:#1a155a;border-radius:18px 18px 0 0;padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;max-height:70vh}' +
      '#gcX .h{display:flex;align-items:center;margin-bottom:8px}#gcX .h b{flex:1;font-size:16px}#gcX .h button{width:36px;height:36px;border:0;border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:18px}' +
      '#gcL{flex:1;overflow:auto;min-height:120px;display:flex;flex-direction:column;gap:6px;padding:4px 2px}#gcL .m{max-width:82%;padding:7px 10px;border-radius:12px;background:#2a2470;font-size:14px;line-height:1.35;word-wrap:break-word;align-self:flex-start}#gcL .m.me{align-self:flex-end;background:#2f7d3a}#gcL .m b{display:block;font-size:11.5px;opacity:.7;margin-bottom:1px}#gcL .e{opacity:.6;text-align:center;font-size:13px;margin:auto}' +
      '#gcQ{display:flex;gap:6px;overflow-x:auto;padding:8px 0 6px;scrollbar-width:none}#gcQ button{flex:none;border:0;border-radius:16px;padding:7px 11px;background:rgba(255,255,255,.1);color:#fff;font-size:13.5px}' +
      '#gcF{display:flex;gap:8px}#gcF input{flex:1;min-width:0;padding:11px 12px;border-radius:12px;border:1px solid #3a33a0;background:#100c33;color:#fff;font-size:15px}#gcF button{border:0;border-radius:12px;padding:0 16px;background:#3fa34d;color:#fff;font-weight:800;font-size:15px}';
    document.head.appendChild(st);
  }
  function build() {
    css();
    btn = document.createElement('button'); btn.id = 'gcB'; btn.innerHTML = '💬<i></i>'; document.body.appendChild(btn);
    box = document.createElement('div'); box.id = 'gcX';
    box.innerHTML = '<div class="p"><div class="h"><b>💬 Chat</b><button type="button" id="gcC">✕</button></div><div id="gcL"></div><div id="gcQ">' + QUICK.map(function (q) { return '<button type="button">' + esc(q) + '</button>'; }).join('') + '</div><form id="gcF"><input id="gcI" maxlength="120" placeholder="Xabar yozing…" autocomplete="off"><button>➤</button></form></div>';
    document.body.appendChild(box);
    ls = box.querySelector('#gcL'); inp = box.querySelector('#gcI'); bd = btn.querySelector('i');
    btn.onclick = function () { setOpen(true); };
    box.querySelector('#gcC').onclick = function () { setOpen(false); };
    box.onclick = function (e) { if (e.target === box) setOpen(false); };
    box.querySelector('#gcQ').onclick = function (e) { var b = e.target.closest('button'); if (b) say(b.textContent); };
    box.querySelector('#gcF').onsubmit = function (e) { e.preventDefault(); say(inp.value); inp.value = ''; };
  }
  function say(t) { t = String(t || '').trim(); if (!t || !sendFn) return; sendFn(t.slice(0, 120)); }
  function setOpen(v) { open = v; box.style.display = v ? 'block' : 'none'; if (v) { seen = lastId(); draw(); badge(); setTimeout(function () { ls.scrollTop = ls.scrollHeight; }, 30); } }
  function lastId() { return list.length ? list[list.length - 1].i || 0 : 0; }
  function badge() { var n = list.filter(function (m) { return (m.i || 0) > seen && m.name !== me; }).length; bd.textContent = n > 9 ? '9+' : n; bd.style.display = n && !open ? 'flex' : 'none'; }
  function draw() {
    ls.innerHTML = list.length ? list.map(function (m) { var mine = m.name === me; return '<div class="m' + (mine ? ' me' : '') + '">' + (mine ? '' : '<b>' + esc(m.name) + '</b>') + esc(m.text) + '</div>'; }).join('') : '<div class="e">Hali xabar yo‘q — salom bering 👋</div>';
    ls.scrollTop = ls.scrollHeight;
  }
  root.GCHAT = {
    init: function (fn) { if (!btn) build(); sendFn = fn; },
    show: function (v) { if (!btn) return; shown = !!v; btn.style.display = v ? 'block' : 'none'; document.body.style.paddingBottom = v ? 'calc(80px + env(safe-area-inset-bottom,0px))' : ''; if (!v) setOpen(false); },
    set: function (arr, myName) {
      if (!btn) return; arr = arr || []; me = myName || me;
      var prev = lastId(); list = arr;
      var fresh = lastId() > prev && arr[arr.length - 1].name !== me;
      if (open) { seen = lastId(); draw(); }
      badge();
      if (fresh && !open && shown) { try { window.GSND && GSND.play('tick'); } catch (e) {} }
    }
  };
})(this);
