const fs = require('fs');
let s = fs.readFileSync('profile.js', 'utf8');
if (s.includes('pfUp')) { console.log('Allaqachon bor'); process.exit(0); }
const a = "$('pfRank').textContent = rank(d.wins) + (d.premium ? ' · 👑 Premium' : '');";
if (s.split(a).length - 1 !== 1) { console.log('XATO: joy topilmadi'); process.exit(1); }
s = s.replace(a, () => a + `
      function setAv(src) {
        var old = document.querySelector('.pf-av'); if (!old) return;
        var im = document.createElement('img'); im.className = 'pf-av'; im.src = src;
        old.parentNode.replaceChild(im, old);
      }
      if (d.avatar) setAv(d.avatar);
      var bt = document.createElement('button');
      bt.id = 'pfUp'; bt.textContent = '📷 Rasm qo‘yish';
      bt.style.cssText = 'display:block;margin:10px auto 0;border:0;border-radius:14px;padding:8px 16px;background:#ffffff33;color:#fff;font-size:13px';
      var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
      bt.onclick = function () { fi.click(); };
      fi.onchange = function () {
        var f = fi.files && fi.files[0]; if (!f) return;
        bt.textContent = 'Yuklanmoqda…'; bt.disabled = true;
        var rd = new FileReader();
        rd.onload = function () {
          var im = new Image();
          im.onload = function () {
            var z = 256, cv = document.createElement('canvas'); cv.width = z; cv.height = z;
            var m = Math.min(im.width, im.height), sx = (im.width - m) / 2, sy = (im.height - m) / 2;
            cv.getContext('2d').drawImage(im, sx, sy, m, m, 0, 0, z, z);
            var url = cv.toDataURL('image/jpeg', 0.8);
            fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: JSON.stringify({ img: url }) })
              .then(function (r) { return r.json(); })
              .then(function (j) {
                bt.disabled = false;
                if (j && j.ok) { setAv(url); bt.textContent = '✅ Saqlandi'; setTimeout(function () { bt.textContent = '📷 Rasm qo‘yish'; }, 2000); }
                else bt.textContent = '⚠️ Xatolik, qayta urinib ko‘ring';
              })
              .catch(function () { bt.disabled = false; bt.textContent = '⚠️ Server bilan aloqa yo‘q'; });
          };
          im.onerror = function () { bt.disabled = false; bt.textContent = '⚠️ Rasm ochilmadi'; };
          im.src = rd.result;
        };
        rd.readAsDataURL(f);
      };
      $('pfRank').parentNode.appendChild(bt);
      $('pfRank').parentNode.appendChild(fi);`);
fs.writeFileSync('profile.js', s);
console.log('TAYYOR');
