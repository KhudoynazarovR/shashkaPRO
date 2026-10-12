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
  var dbg = document.createElement("div");
  dbg.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#c00;color:#fff;font:11px monospace;padding:2px 4px;pointer-events:none;word-break:break-all";
  document.body.appendChild(dbg);
  var lastErr = "";
  window.addEventListener("error", function (e) { lastErr = (e.message || "") + " @" + String(e.filename || "").split("/").pop() + ":" + e.lineno; });
  function upd() {
    dbg.textContent = "DBG keep=" + keep + " sp=[" + sp + "] wrap=" + (wrap.style.display || "show") + " nv=" + !!document.getElementById("nvBar") + " lb=" + !!window.lbNav + " err=" + (lastErr || "yo'q");
  }
  setInterval(upd, 500); upd();
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
