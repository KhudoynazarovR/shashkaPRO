(function () {
  "use strict";
  var tg = window.Telegram && window.Telegram.WebApp;
  var sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || "";
  var keep = /[?&]room=/.test(location.search || "") || (!!sp && !/^lb[tsf]_/.test(sp));
  var wrap = document.createElement("div");
  wrap.id = "aiWrap";
  [].slice.call(document.body.childNodes).forEach(function (n) {
    if (n.nodeType === 1 && n.tagName !== "SCRIPT" && n.tagName !== "STYLE" && n.tagName !== "LINK") wrap.appendChild(n);
  });
  document.body.insertBefore(wrap, document.body.firstChild);
  (function(){var s=document.getElementById("aiPre");if(s)s.remove();})();
  window.aiHide = function () { wrap.style.display = "none"; };
  window.aiShow = function (tab) {
    wrap.style.display = "";
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
    if (tab) { var b = wrap.querySelector('.tabs button[data-t="' + tab + '"]'); if (b) b.click(); }
  };
  if (keep) return;
  wrap.style.display = "none";
  var n = 0, t = setInterval(function () {
    var b = document.querySelector('#nvBar [data-k="pl"]');
    if (b && window.lbNav) { clearInterval(t); b.click(); } else if (++n > 50) clearInterval(t);
  }, 100);
  function vis(id) { var e = document.getElementById(id); return !!e && getComputedStyle(e).display !== "none"; }
  setInterval(function () {
    if (wrap.style.display !== "none" || document.getElementById("lbBack")) return;
    if (vis("lbPanel") || vis("rkPanel") || vis("mnPanel") || vis("nvPg")) return;
    var m = document.querySelector('#nvBar [data-k="mn"]'); if (m) m.click();
  }, 900);
})();
