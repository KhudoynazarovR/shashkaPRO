/* tlist.js — 🏆 Turnirlar ro'yxati (chess.com / lichess uslubida, ixcham).
   «Turnir» tabidagi eski kartalar (lbTs), hero, «Keyingi turnirlar» va «Orzular» bloklari o'rniga.
   Bo'limlar: Hozir o'ynalmoqda (tugash vaqti bo'yicha) · Tez orada (boshlanish vaqti bo'yicha) · Tugaganlar tabida.
   Qatorni bosish → turnir sahifasi (arena — tarena.js, qolganlari — eski oyna). Yaratish — mavjud forma (lbTPlus). */
;(function () {
  if (window.__tList) return; window.__tList = 1;
  function g(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); }
  function St() { try { return window.__lb ? window.__lb.S : null; } catch (e) { return null; } }
  function me() { var s = St(); return s && s.me ? String(s.me.uid) : ''; }
  function f2(n) { return (n < 10 ? '0' : '') + n; }
  function speed(tc) {
    var a = String(tc || '').split('+'), b = Number(a[0]) || 0, inc = Number(a[1]) || 0, est = b * 60 + inc * 40;
    if (!tc || tc === '∞') return ['♟', ''];
    return est < 30 ? ['⚡', 'Giper'] : est < 180 ? ['🚀', 'Bullet'] : est < 480 ? ['🔥', 'Blits'] : est < 1500 ? ['🐇', 'Tezkor'] : ['🐢', 'Klassik'];
  }
  function tcTxt(tc) { var a = String(tc || '').split('+'), b = Number(a[0]) || 0; return (b > 0 && b < 1 ? Math.round(b * 60) + ' s' : b) + ' + ' + (Number(a[1]) || 0); }
  function dur(ms) {
    var m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d >= 1) return d + ' kun' + (h % 24 ? ' ' + (h % 24) + ' soat' : '');
    if (h >= 1) return h + ' soat' + (m % 60 ? ' ' + (m % 60) + ' daq' : '');
    return m < 1 ? '1 daqiqadan kam' : m + ' daq';
  }
  function dayLbl(ts) {
    var d = new Date(ts), n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), dd = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - t0) / 864e5);
    return dd === 0 ? '' : dd === 1 ? 'Ertaga ' : f2(d.getDate()) + '.' + f2(d.getMonth() + 1) + ' ';
  }
  var css = '' +
    '#lbT.tlOn>#lbTbar,#lbT.tlOn>#lbHero,#lbT.tlOn #lbTs,#lbT.tlOn #lbDream,#lbT.tlOn #nxtBox2,#lbT.tlOn #lbTsH{display:none!important}' +
    '#lbT.tlOn:not(.tlClub) #lbClubs,#tvClub3{display:none!important}#lbT.tlClub #tlList{display:none}' +
    'body.tlOnB #tvClub3{display:none!important}' +
    '#tlHead{display:flex;align-items:center;gap:8px;margin:4px 0 6px}#tlHead b{flex:1;font-size:21px;font-weight:800}' +
    '#tlHead button{border:0;border-radius:12px;height:40px;padding:0 12px;font-weight:700;font-size:14px;color:#fff;background:#2d2775}#tlHead button.add{background:#3fa34d}' +
    '#tlTabs{display:flex;border-bottom:1px solid rgba(255,255,255,.12);margin-bottom:4px}#tlTabs button{flex:1;border:0;background:none;color:#a9a4d8;font-weight:700;font-size:15px;padding:11px 0;border-bottom:3px solid transparent}' +
    '#tlTabs button.on{color:#fff;border-bottom-color:#6cc04a}' +
    '#tlList h5{margin:14px 4px 4px;font-size:12px;letter-spacing:.8px;color:#8f8bc4;font-weight:700}' +
    '#tlList .r{display:flex;align-items:center;gap:12px;padding:11px 8px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '#tlList .r:active{background:rgba(255,255,255,.05)}#tlList .r.me{background:rgba(108,192,74,.09);box-shadow:inset 3px 0 0 #6cc04a}' +
    '#tlList .i{font-size:25px;width:32px;text-align:center;flex:none}#tlList .t{flex:1;min-width:0}' +
    '#tlList .t b{display:block;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tlList .t small{display:block;color:#a9a4d8;font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tlList .t small .p{color:#f5b72b}#tlList .t small .y{color:#86efac}' +
    '#tlList .w{text-align:right;font-size:12.5px;color:#cfcaff;white-space:nowrap;flex:none}#tlList .w b{display:block;color:#fff;font-size:15px}#tlList .w b.l{color:#6cc04a}' +
    '#tlList .e{padding:28px 10px;text-align:center;color:#a9a4d8}#tlList .e button{margin-top:12px;border:0;border-radius:12px;padding:11px 18px;background:#3fa34d;color:#fff;font-weight:700;font-size:15px}';
  var stl = document.createElement('style'); stl.textContent = css; document.head.appendChild(stl);

  var tab = 'live', sig = '';
  function rowOf(t, u) {
    var sp = speed(t.tc), ps = t.players || [], bots = 0, hum = 0, inn = false, now = Date.now();
    ps.forEach(function (p) { if (p.bot) bots++; else hum++; if (String(p.uid) === u && !p.withdrawn) inn = true; });
    var kind = t.mix ? '🔀 Miks · ' + t.mix.length + ' o‘yin' : t.type === 'arena' ? '' : t.type === 'swiss' ? 'Shveytsariya' + (t.roundsWanted ? ' · ' + t.roundsWanted + ' tur' : '') : t.type === 'olympic' || t.type === 'ko' ? 'Olimpiya tizimi' : 'Turnir';
    var name = String(t.name || 'Turnir').replace(/^[^\p{L}\p{N}]+\s*/u, '');
    var empty = !hum && !bots && t.status !== 'finished';
    var sub = (t.tc && t.tc !== '∞' && !t.mix ? esc(tcTxt(t.tc)) + ' ' + sp[1] + ' · ' : '') + (kind ? kind + ' · ' : '') + (empty ? '<span class="y">Bo‘sh — qo‘shiling!</span>' : hum + ' o‘yinchi') + (bots ? ' · 🤖 ' + bots : '') +
      ((t.clubIds || []).length ? ' · 👥 ' + ((t.clubIds || []).length > 1 ? 'klublar jangi' : 'klub') : '') + (t.prize ? ' · <span class="p">🏆 ' + t.prize + '</span>' : '') + (inn ? ' · <span class="y">✓ siz</span>' : '');
    var w = '';
    if (t.status === 'running') w = t.ending ? '<b class="l">yakunlanmoqda</b>oxirgi o‘yinlar' : t.endAt ? '<b class="l">' + dur(t.endAt - now) + '</b>tugashiga' : '<b class="l">' + (t.round ? t.round + '-tur' : 'jonli') + '</b>' + (t.rounds ? t.rounds + ' turdan' : 'o‘ynalmoqda');
    else if (t.status === 'reg') w = t.startAt ? '<b>' + dayLbl(t.startAt) + f2(new Date(t.startAt).getHours()) + ':' + f2(new Date(t.startAt).getMinutes()) + '</b>' + (t.startAt > now ? dur(t.startAt - now) + ' qoldi' : 'boshlanmoqda') : '<b>Ro‘yxat</b>ochiq';
    else { var top = ps.filter(function (p) { return p.games > 0 || p.score > 0; })[0] || ps[0]; w = '<b>' + (top ? '🥇 ' + esc(String(top.name || '').replace(/^🤖\s*/, '').slice(0, 14)) : 'Tugadi') + '</b>' + (t.endAt ? dayLbl(t.endAt) + f2(new Date(t.endAt).getHours()) + ':' + f2(new Date(t.endAt).getMinutes()) : 'tugadi'); }
    return '<div class="r' + (inn ? ' me' : '') + '" data-tid="' + esc(t.id) + '"><span class="i">' + (t.mix ? '🔀' : t.type === 'arena' ? sp[0] : '🏆') + '</span><div class="t"><b>' + esc(name) + '</b><small>' + sub + '</small></div><div class="w">' + w + '</div></div>';
  }
  function render() {
    var bx = g('lbT'); if (!bx) return;
    if (!bx.classList.contains('tlOn')) bx.classList.add('tlOn');
    var inT = false; try { var lp = g('lbPanel'); inT = !!(lp && lp.classList.contains('lbTMode') && lp.style.display !== 'none'); } catch (e) {}
    document.body.classList.toggle('tlOnB', inT);
    var hd = g('tlHead');
    if (!hd) {
      hd = document.createElement('div'); hd.id = 'tlHead';
      hd.innerHTML = '<b>🏆 Turnirlar</b><button type="button" class="add" id="tlAdd">➕ Yaratish</button>';
      bx.insertBefore(hd, bx.firstChild);
      var tb = document.createElement('div'); tb.id = 'tlTabs'; tb.innerHTML = '<button type="button" data-tb="live" class="on">Jonli</button><button type="button" data-tb="fin">Tugaganlar</button><button type="button" data-tb="club">👥 Klublar</button>';
      var ls = document.createElement('div'); ls.id = 'tlList';
      var form = g('lbTform'); if (form && form.parentNode === bx) { bx.insertBefore(ls, form.nextSibling); bx.insertBefore(tb, ls); } else { bx.insertBefore(ls, hd.nextSibling); bx.insertBefore(tb, ls); }
      g('tlAdd').onclick = function () { if (window.lbTPlus) window.lbTPlus(); try { enhanceForm(); } catch (e) {} var f = g('lbTform'); if (f && f.style.display !== 'none') setTimeout(function () { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
      tb.onclick = function (e) { var b = e.target.closest('[data-tb]'); if (!b) return; tab = b.getAttribute('data-tb'); [].forEach.call(tb.children, function (x) { x.classList.toggle('on', x === b); }); sig = ''; render(); };
      tb.__set = function (k) { tab = k; [].forEach.call(tb.children, function (x) { x.classList.toggle('on', x.getAttribute('data-tb') === k); }); };
      ls.onclick = function (e) { var r = e.target.closest('[data-tid]'); if (!r) return; var id = r.getAttribute('data-tid'); if (window.tvOpen) window.tvOpen(id); };
    }
    // 👥 Klublar tabi: mavjud klublar paneli (#lbClubs) shu yerga ko'chadi; boshqa tablarda yashirin
    var club = tab === 'club', cl = g('lbClubs'), lsE = g('tlList'), tbE = g('tlTabs');
    bx.classList.toggle('tlClub', club);
    if (club && cl && lsE && cl.previousSibling !== tbE) bx.insertBefore(cl, lsE);
    if (window.__lbCO !== club) { window.__lbCO = club; try { if (window.lbClubFix) window.lbClubFix(); } catch (e) {} }
    if (club) { lsE.innerHTML = ''; sig = ''; return; }
    var s = St(), T = (s && s.tournaments) || [], u = me(), now = Date.now();
    var key = JSON.stringify([tab, u, Math.floor(now / 30000), T.map(function (t) { return [t.id, t.status, t.ending, t.startAt, t.endAt, (t.players || []).length, t.round, t.name, t.prize, (t.players || []).some(function (p) { return String(p.uid) === u && !p.withdrawn; })]; })]);
    if (key === sig) return; sig = key;
    var h = '';
    if (tab === 'live') {
      var run = T.filter(function (t) { return t.status === 'running'; }).sort(function (a, b) { return (a.endAt || 9e15) - (b.endAt || 9e15); });
      var reg = T.filter(function (t) { return t.status === 'reg'; }).sort(function (a, b) { return (a.startAt || 9e15) - (b.startAt || 9e15); });
      if (run.length) h += '<h5>HOZIR O‘YNALMOQDA</h5>' + run.map(function (t) { return rowOf(t, u); }).join('');
      if (reg.length) h += '<h5>TEZ ORADA</h5>' + reg.map(function (t) { return rowOf(t, u); }).join('');
      if (!run.length && !reg.length) h = '<div class="e">Hozircha rejalashtirilgan turnir yo‘q.<br><button type="button" onclick="document.getElementById(\'tlAdd\').click()">➕ Turnir yaratish</button></div>';
    } else {
      var fin = T.filter(function (t) { return t.status === 'finished'; }).sort(function (a, b) { return (b.endAt || b.startAt || 0) - (a.endAt || a.startAt || 0); });
      h = fin.length ? fin.map(function (t) { return rowOf(t, u); }).join('') : '<div class="e">Tugagan turnirlar hali yo‘q.</div>';
    }
    g('tlList').innerHTML = h;
  }
  // ---- ➕ Turnir yaratish formasi: ochiladigan ro'yxatlar o'rniga bosiladigan tugmalar (select'lar joyida qoladi — eski mantiq ishlaydi)
  var LBL = { lbTk: 'Turnir turi', lbTtb: 'Boshlang‘ich vaqt', lbTti: 'Har yurishga qo‘shimcha', lbTdur: 'Davomiyligi', lbTflag: 'Bayroq', lbTr: 'Turlar soni', lbTiv: 'Turlar orasida tanaffus', lbTsin: 'Boshlanishi', lbTp: 'Pozitsiya', lbTmg: 'Ishtirok sharti', lbTrated: 'Reyting', lbTpl: 'Mukofot oladigan o‘rinlar' };
  var SHORT = { lbTmg: function (v) { return +v ? 'Kamida ' + v + ' o‘yin' : '✅ Shartsiz'; }, lbTk: function (v, t) { return v === 'swiss' ? '♟ Shveytsariya' : t; } };
  var fcss = document.createElement('style'); fcss.textContent =
    '#lbTform.tlF{background:linear-gradient(180deg,#26207a,#1a155a)!important;border:1px solid #3a33a0!important;border-radius:18px!important;padding:14px!important;box-shadow:0 8px 24px rgba(0,0,0,.35)!important}' +
    '#lbTform.tlF select.tlHid{display:none!important}#lbTform.tlF .row{flex-wrap:wrap;gap:8px}#lbTform.tlF .row>.muted.tlHid{display:none!important}' +
    '#lbTform.tlF #lbTn{height:46px;font-size:16px;border-radius:12px}#lbTform.tlF #lbTCreate{height:46px;border-radius:12px;background:#3fa34d!important;color:#fff!important;font-weight:800}' +
    '.tlCh{width:100%;margin:6px 0 2px}.tlCh>small{display:block;font-size:12px;letter-spacing:.5px;color:#a9a4d8;font-weight:700;text-transform:uppercase;margin-bottom:6px}' +
    '.tlCh>div{display:flex;flex-wrap:wrap;gap:6px}.tlCh button{border:1px solid #3a33a0!important;background:#16124a!important;color:#d6d3f5!important;border-radius:10px!important;padding:9px 12px!important;font-size:14px!important;font-weight:600;min-height:0;box-shadow:none!important}' +
    '.tlCh button.on{background:#3fa34d!important;border-color:#3fa34d!important;color:#fff!important}';
  document.head.appendChild(fcss);
  function enhanceForm() {
    var f = g('lbTform'); if (!f) return;
    if (!f.classList.contains('tlF')) f.classList.add('tlF');
    Object.keys(LBL).forEach(function (id) {
      var sel = g(id); if (!sel || sel.tagName !== 'SELECT') return;
      var box = sel.__tlCh;
      if (!box) {
        box = document.createElement('div'); box.className = 'tlCh'; box.innerHTML = '<small>' + LBL[id] + '</small><div></div>';
        var fc = g('tlFC'); if (!fc) { fc = document.createElement('div'); fc.id = 'tlFC'; var r0 = f.querySelector('.row'); if (r0) r0.parentNode.insertBefore(fc, r0.nextSibling); else f.insertBefore(fc, f.firstChild); }
        var ks = Object.keys(LBL), nx = null; for (var q = ks.indexOf(id) + 1; q < ks.length && !nx; q++) { var o2 = g(ks[q]); if (o2 && o2.__tlCh && o2.__tlCh.parentNode === fc) nx = o2.__tlCh; }
        fc.insertBefore(box, nx);   // LBL tartibida
        var mu = sel.previousElementSibling; if (mu && mu.classList && mu.classList.contains('muted')) mu.classList.add('tlHid');
        box.lastChild.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; e.preventDefault(); sel.value = b.getAttribute('data-v'); try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {} enhanceForm(); };
        sel.__tlCh = box; sel.classList.add('tlHid');
      }
      sync(sel, box);
    });
  }
  function sync(sel, box) {
    var opts = [].map.call(sel.options, function (o) { return o.value + '\u0001' + o.textContent; }).join('|');
    if (box.__o !== opts) { box.__o = opts; var sh = SHORT[sel.id]; box.lastChild.innerHTML = [].map.call(sel.options, function (o) { return '<button type="button" data-v="' + esc(o.value) + '">' + esc(sh ? sh(o.value, o.textContent) : o.textContent) + '</button>'; }).join(''); }
    [].forEach.call(box.lastChild.children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === sel.value); });
    var hid = sel.style.display === 'none' || (sel.closest('.row') && sel.closest('.row').style.display === 'none') || (sel.closest('#lbSw') && g('lbSw').style.display === 'none');
    box.style.display = hid ? 'none' : '';
  }
  // ⚙️ admin «Bot kuchi» tugmasi faqat Menyu sahifasida (boshqa sahifalarda tugmalar ustida suzib turmasin)
  function gear() { var bp = g('bpBtn'); if (!bp) return; var on = document.querySelector('#nvBar button.on'), m = !!(on && /Menyu|Меню|Menu/i.test(on.textContent || '')); bp.style.setProperty('display', 'none', 'important'); }   // endi Menyu → ADMIN → «Bot kuchi» kartasidan ochiladi
  setInterval(function () { try { render(); enhanceForm(); gear(); } catch (e) {} }, 1000);
  setTimeout(function () { try { render(); } catch (e) {} }, 300);
})();
