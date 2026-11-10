/* tform.js — ➕ turnir yaratish formasiga qo'shimchalar:
   ⏱ lidraughts kabi vaqt (boshlang'ich daqiqa + har yurishga soniya, toifa avtomatik), 🏳️ bayroqli (faqat arena), 📝 tavsif,
   🛡 admin uchun: 📣 kanal va o'yinchilarga e'lon, 🔁 doimiy turnir (hafta kunlari) va doimiy turnirlar ro'yxati. */
;(function () {
  if (window.__tform) return; window.__tform = 1;
  function g(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var DN = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'], ORD = [1, 2, 3, 4, 5, 6, 0], days = [6];
  var st = document.createElement('style');
  st.textContent = '#tfX{margin-top:8px}#tfX textarea{width:100%;box-sizing:border-box;min-height:58px;border-radius:12px;border:1px solid #3a33a0;background:#16124a;color:#fff;padding:9px;font-size:14px;font-family:inherit}' +
    '#tfAdm{margin-top:10px;padding:10px;border-radius:14px;border:1px dashed #6d5cf0;background:rgba(109,92,240,.08)}#tfAdm>b{display:block;font-size:12px;letter-spacing:.5px;color:#a9a4d8;margin-bottom:6px}' +
    '#tfAdm label{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:14px}.tfDays{display:flex;gap:5px;flex-wrap:wrap;margin:6px 0}.tfDays button{border:1px solid #3a33a0!important;background:#16124a!important;color:#d6d3f5!important;border-radius:10px!important;padding:8px 10px!important;font-weight:700;min-width:40px;margin:0!important}.tfDays button.on{background:#3fa34d!important;border-color:#3fa34d!important;color:#fff!important}' +
    '.tfQ{display:flex;gap:5px;flex-wrap:wrap}.tfQ button{border:0!important;background:rgba(255,255,255,.1)!important;color:#e6e3ff!important;border-radius:9px!important;padding:6px 9px!important;font-size:12.5px!important;margin:0!important}' +
    '#tfRecL .r{display:flex;align-items:center;gap:6px;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-size:13px}#tfRecL .r:first-child{border-top:0}#tfRecL .r div{flex:1;min-width:0}#tfRecL .r small{display:block;opacity:.65}#tfRecL button{border:0!important;border-radius:9px!important;padding:6px 8px!important;background:#2a2470!important;color:#fff!important;font-size:13px!important;margin:0!important}';
  document.head.appendChild(st);
  function cat(b, i) { var e = parseFloat(b) * 60 + (parseFloat(i) || 0) * 40; return e < 180 ? '🚀 Bullet' : e < 480 ? '⚡ Blits' : '⏱ Rapid'; }
  function frac(b) { return ({ '0.25': '¼', '0.5': '½', '0.75': '¾', '1.5': '1½' })[b] || b; }
  window.__tfTc = function () { var b = g('lbTtb'), i = g('lbTti'); return b && i ? b.value + '+' + i.value : (g('lbTtc') || {}).value; };
  window.__tfx = function () {
    var o = { flag: !!(g('lbTflag') && g('lbTflag').value === '1' && g('lbTk') && g('lbTk').value === 'arena'), desc: (g('tfDesc') || {}).value || '' };
    if (window.__isAdmin) {
      o.announce = !!(g('tfAnn') && g('tfAnn').checked);
      if (g('tfRec') && g('tfRec').checked) { o.rec = true; o.recDays = days.slice(); }
    }
    return o;
  };
  function tick() {
    var f = g('lbTform'); if (!f) return;
    // vaqt natijasi va toifa
    var tb = g('lbTtb'), ti = g('lbTti'), inf = g('lbTtcI');
    if (tb && ti && inf) { var t = frac(tb.value) + '+' + ti.value + ' · ' + cat(tb.value, ti.value); if (inf.__t !== t) { inf.__t = t; inf.textContent = '→ ' + t; } }
    // bayroq faqat arena uchun
    var fr = g('lbTflagr'), k = g('lbTk'); if (fr && k) { var on = k.value === 'arena'; if ((fr.style.display !== 'none') !== on) fr.style.display = on ? '' : 'none'; }
    // bayroqli: mukofot taqsimoti matni (60% g'olib viloyat top-5, 40% individual 50/30/20)
    var pc = g('lbTpzc'), fl = g('lbTflag'), pz = g('lbTpz');
    if (pc && fl && pz && fl.value === '1' && k && k.value === 'arena') { var v = Math.floor(Number(pz.value) || 0), tp = v - Math.floor(v * 0.6); var tx = '🏳️ ' + Math.floor(v * 0.6) + ' — g‘olib viloyatning eng yaxshi 5 o‘yinchisiga (ochkosiga qarab) · 🥇 ' + Math.floor(tp * 0.5) + ' · 🥈 ' + Math.floor(tp * 0.3) + ' · 🥉 ' + Math.floor(tp * 0.2); if (pc.textContent !== tx) pc.textContent = tx; }
    if (g('tfX')) { if (window.__isAdmin && !g('tfAdm')) g('tfX').remove(); else return; }
    var x = document.createElement('div'); x.id = 'tfX';
    var h = '<div class="muted" style="font-size:12px;margin-bottom:4px">📝 Tavsif (ixtiyoriy) — turnir kartasida va e’londa chiqadi</div><textarea id="tfDesc" maxlength="200" placeholder="Masalan: Viloyatingiz uchun o‘ynang!"></textarea>';
    if (window.__isAdmin) {
      h += '<div id="tfAdm"><b>🛡 ADMIN</b>' +
        '<div class="tfQ" id="tfQ"><button type="button" data-q="kubok">🏳️ Shanba kubogi</button><button type="button" data-q="blits">⚡ Kechki blits</button><button type="button" data-q="bullet">🚀 Bullet soati</button></div>' +
        '<label><input type="checkbox" id="tfAnn" checked> 📣 Kanalga va barcha o‘yinchilarga e’lon (rasm + «Qo‘shilish» tugmasi)</label>' +
        '<label><input type="checkbox" id="tfRec"> 🔁 Doimiy turnir — har hafta takrorlanadi</label>' +
        '<div id="tfRecD" style="display:none"><div class="tfDays">' + ORD.map(function (d) { return '<button type="button" data-d="' + d + '">' + DN[d] + '</button>'; }).join('') + '</div>' +
        '<div class="tfQ"><button type="button" data-p="all">Har kuni</button><button type="button" data-p="work">Ish kunlari</button><button type="button" data-p="wk">Dam olish kunlari</button></div>' +
        '<div class="muted" style="font-size:12px;margin-top:6px">🕗 Soati «📅 Aniq sana va vaqt» dan olinadi. Turnir har gal 24 soat oldin o‘zi yaratiladi va e’lon qilinadi, nomiga #1, #2… qo‘shiladi.</div></div>' +
        '<div style="margin-top:8px;font-size:13px;font-weight:700">🔁 Doimiy turnirlar</div><div id="tfRecL" style="font-size:13px;opacity:.85">Yuklanmoqda…</div></div>';
    }
    x.innerHTML = h;
    var info = g('lbTinfo'); (info && info.parentNode ? info.parentNode : f).insertBefore(x, info || null);
    if (!window.__isAdmin) return;
    var rc = g('tfRec'), rd = g('tfRecD');
    function drawDays() { [].forEach.call(rd.querySelectorAll('[data-d]'), function (b) { b.classList.toggle('on', days.indexOf(+b.getAttribute('data-d')) >= 0); }); }
    rc.onchange = function () { rd.style.display = rc.checked ? '' : 'none'; var cb = g('lbTCreate'); if (cb) cb.textContent = rc.checked ? '🔁 Saqlash' : '➕ Ochish'; };
    rd.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-d')) { var d = +b.getAttribute('data-d'), i = days.indexOf(d); if (i >= 0) days.splice(i, 1); else days.push(d); }
      var p = b.getAttribute('data-p'); if (p) days = p === 'all' ? [0, 1, 2, 3, 4, 5, 6] : p === 'work' ? [1, 2, 3, 4, 5] : [6, 0];
      drawDays();
    };
    drawDays();
    // ⚡ tezkor andozalar
    g('tfQ').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var Q = { kubok: { n: '🏳️ Viloyatlar kubogi', k: 'arena', tb: '2', ti: '2', dur: '80', p: 'idf', fl: '1', pz: 2000 }, blits: { n: '⚡ Kechki blits', k: 'arena', tb: '3', ti: '2', dur: '60', p: 'std', fl: '0', pz: 500 }, bullet: { n: '🚀 Bullet soati', k: 'arena', tb: '1', ti: '1', dur: '30', p: 'std', fl: '0', pz: 300 } }[b.getAttribute('data-q')];
      if (!Q) return;
      var set = function (id, v) { var el = g(id); if (!el) return; el.value = v; try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {} try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {} };
      set('lbTn', Q.n); set('lbTk', Q.k); set('lbTtb', Q.tb); set('lbTti', Q.ti); set('lbTdur', Q.dur); set('lbTp', Q.p); set('lbTflag', Q.fl); set('lbTpz', String(Q.pz));
      if (b.getAttribute('data-q') === 'kubok') { rc.checked = true; days = [6]; rc.onchange(); drawDays(); var bz = g('lbTbz'); if (bz) bz.checked = false; }
    };
    if (window.lbSend) window.lbSend({ type: 'lbRecList' });
  }
  window.tfRec = function (L) {
    var el = g('tfRecL'); if (!el) return;
    if (!L.length) { el.innerHTML = '<span style="opacity:.6">Hali yo‘q.</span>'; return; }
    el.innerHTML = L.map(function (r) {
      var nx = r.next ? new Date(r.next) : null, hm = String(r.hh).padStart(2, '0') + ':' + String(r.mm).padStart(2, '0');
      var nxt = nx ? (nx.getDate() + '.' + String(nx.getMonth() + 1).padStart(2, '0') + ' ' + hm) : '—';
      var skipped = r.skip && nx && new Date(r.next + 5 * 3600e3).toISOString().slice(0, 10) === r.skip;
      return '<div class="r"><div><b>' + esc(r.name) + '</b><small>' + r.days.map(function (d) { return DN[d]; }).join(', ') + ' ' + hm + ' · ' + esc(r.tc) + (r.flag ? ' · 🏳️' : '') + (r.prize ? ' · 💰 ' + r.prize : '') + ' · o‘tkazildi: ' + r.n + '<br>' +
        (r.pause ? '⏸ To‘xtatilgan' : skipped ? '⏭ Keyingisi o‘tkazib yuboriladi (' + nxt + ')' : 'Keyingisi: ' + nxt) + '</small></div>' +
        '<button data-a="pause" data-i="' + r.id + '">' + (r.pause ? '▶' : '⏸') + '</button><button data-a="skip" data-i="' + r.id + '">⏭</button><button data-a="del" data-i="' + r.id + '">🗑</button></div>';
    }).join('');
    el.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'del' && !confirm('Doimiy turnir o‘chirilsinmi? (yaratilgan turnirlar qoladi)')) return;
      if (window.lbSend) window.lbSend({ type: 'lbRecAct', id: b.getAttribute('data-i'), act: a });
    };
  };
  setInterval(function () { try { tick(); } catch (e) {} }, 700);
})();
