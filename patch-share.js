const fs = require('fs');
const R = String.raw;
const plan = {
  'lobby.js': [
    [R`  function newPlayer(me) {`,
     R`  // ---------- 🔗 tayyor xabar ulashish (savePreparedInlineMessage) ----------
  const https = require('https');
  function botToken() {
    return process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || process.env.TOKEN || '';
  }
  function tgCall(method, payload) {
    return new Promise((resolve, reject) => {
      const token = botToken();
      if (!token) return reject(new Error('BOT_TOKEN yo‘q'));
      const body = JSON.stringify(payload);
      const req = https.request({
        hostname: 'api.telegram.org', path: '/bot' + token + '/' + method, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 8000
      }, res => {
        let d = '';
        res.on('data', x => { d += x; });
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
      req.end(body);
    });
  }
  function shareImageUrl() {
    if (process.env.SHARE_IMAGE_URL) return process.env.SHARE_IMAGE_URL;
    const base = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
    return base ? base.replace(/\/$/, '') + '/share.jpg' : '';
  }
  async function handleShare(c, m) {
    const me = c.lb;
    const fail = why => send(c.ws, { type: 'lbShareFail', kind: m.kind, id: String(m.id || ''), why });
    try {
      if (!me.tg || !/^\d+$/.test(String(me.uid))) return fail('tg');
      const appLink = process.env.TG_APP_LINK || process.env.APP_LINK || '';
      const img = shareImageUrl();
      if (!appLink || !img) return fail('config');
      const id = String(m.id || '');
      let title, text, prefix;
      if (m.kind === 't') {
        const t = tournaments.get(id);
        if (!t) return fail('notfound');
        prefix = 'lbt_';
        title = (t.type === 'arena' ? '⚔️ ' : '🏆 ') + t.name;
        text = title + ' ga qo‘shiling!\n' + t.tc + ' · ' + t.players.size + ' o‘yinchi';
      } else if (m.kind === 's') {
        const sm = simuls.get(id);
        if (!sm) return fail('notfound');
        prefix = 'lbs_';
        title = '🎭 ' + sm.name;
        text = title + ' siansiga qo‘shiling!\nMezbon: ' + sm.hostName + ' · ' + sm.tc;
      } else return fail('kind');
      const url = appLink.replace(/\/$/, '') + '?startapp=' + prefix + id;
      const r = await tgCall('savePreparedInlineMessage', {
        user_id: Number(me.uid),
        result: {
          type: 'photo', id: hex(8), photo_url: img, thumbnail_url: img,
          title, caption: text,
          reply_markup: { inline_keyboard: [[{ text: '▶ Qo‘shilish', url }]] }
        },
        allow_user_chats: true, allow_bot_chats: false, allow_group_chats: true, allow_channel_chats: true
      });
      if (!r || !r.ok || !r.result || !r.result.id) {
        console.error('[share]', r && r.description);
        return fail('api');
      }
      send(c.ws, { type: 'lbShareReady', kind: m.kind, id, msgId: r.result.id });
    } catch (e) {
      console.error('[share]', e.message);
      fail('error');
    }
  }

  function newPlayer(me) {`],
    [R`      case 'lbTCancel': {`,
     R`      case 'lbShare': { handleShare(c, m); break; }
      case 'lbTCancel': {`],
  ],
  'lobbyclient.js': [
    [R`      } else if (m.type === "lbGo") {`,
     R`      } else if (m.type === "lbShareReady" || m.type === "lbShareFail") {
        var ps = pendingShare; pendingShare = null;
        if (ps) {
          clearTimeout(ps.timer);
          if (m.type === "lbShareReady") { try { tg.shareMessage(m.msgId); } catch (e) { ps.fb(); } }
          else ps.fb();
        }
      } else if (m.type === "lbGo") {`],
    [R`    function shareLink(prefix, qp, id, text) {`,
     R`    var pendingShare = null;
    function shareLink(prefix, qp, id, text) {
      if (tg && tg.shareMessage && initData) {
        if (pendingShare) clearTimeout(pendingShare.timer);
        pendingShare = {
          fb: function () { shareLinkPlain(prefix, qp, id, text); },
          timer: setTimeout(function () { var p = pendingShare; pendingShare = null; if (p) p.fb(); }, 6000)
        };
        sendMsg({ type: "lbShare", kind: prefix === "lbt_" ? "t" : "s", id: id });
        return;
      }
      shareLinkPlain(prefix, qp, id, text);
    }
    function shareLinkPlain(prefix, qp, id, text) {`],
  ],
};
for (const f of Object.keys(plan)) if (!fs.existsSync(f)) { console.log('XATO: ' + f + ' topilmadi'); process.exit(1); }
const out = {}; let bad = 0;
for (const f in plan) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of plan[f]) {
    if (s.includes(b)) { console.log('allaqachon bor:', f); continue; }
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log('MOS KELMADI (' + n + '):', f, JSON.stringify(a.slice(0, 60))); bad++; continue; }
    s = s.replace(a, () => b);
  }
  out[f] = s;
}
if (bad) { console.log('Xato bor, hech narsa o‘zgartirilmadi'); process.exit(1); }
for (const f in out) fs.writeFileSync(f, out[f]);
console.log('Tayyor');
