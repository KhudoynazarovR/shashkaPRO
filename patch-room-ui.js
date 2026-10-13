const fs = require('fs');
const C = [
["🎮","Yurishlar",["👍 Ajoyib yurish!","⏩ Tezroq yur!","🐢 Shoshilma!","🎯 Aniq yurish!","🧠 Aqlli yurish!","🔥 Zo‘r yurish!","⚡ Tez va aniq!","👀 Yaxshilab o‘yla!","🤔 Variantlarni ko‘r!","💡 Mana bu yurishni qara!","🚀 Olg‘a!","🎲 Tavakkal qil!","🛡️ Himoyalan!","⚔️ Hujum qil!","🔄 Yana bir o‘yla!"]],
["🧠","Strategiya",["🧠 Haqiqiy strateg!","♟️ Reja zo‘r!","🔮 Keyingi yurishni bilaman!","🧐 Qiziq strategiya!","💡 Zo‘r fikr!","🎯 Hammasi hisoblangan!","🕵️ Tuzog‘imga tushding!","🪤 Bu tuzoq!","🤯 Qanday yurish?!","📈 Ustunlik menda!","🧩 Kombinatsiyani top!","🧠 Miyani ishlat!","👑 Strategiya qiroli!","🥷 Ayyor yurish!","🔍 Bir xatoni kutyapman!"]],
["🔥","Hujum",["🔥 Zo‘r kombinatsiya!","⚔️ Hujum boshlandi!","💥 Kuchli zarba!","🎯 Nishonga tegdi!","🪓 Bittasi ketdi!","💣 Portlovchi yurish!","🚀 Hujumga o‘t!","🐉 Shafqatsiz hujum!","⚡ Chaqmoqdek yurish!","🥊 Zarba ber!","🔗 Ketma-ket zarbalar!","💥 Bir yurishda ikki dona!","🧨 Kutilmagan hujum!","🦈 O‘ljani ko‘rdim!","🏹 Aniq zarba!"]],
["👑","Dama",["👑 Dama bo‘ldi!","🎉 Dama oldim!","💎 Dama — mening boyligim!","🏆 Ustunlik menda!","📈 Vaziyat yaxshi!","😎 Endi qiziq bo‘ladi!","🔥 Dama bilan ehtiyot bo‘l!","👑 Dama qiroli!","🚀 Dama bilan hujum!","🛡️ Damani asra!","😏 Dama bilan nima qilasan?","💪 Kuchlar teng emas!","🌟 Dama vaqti!","🎯 Damani tutib ko‘r!","🦁 Maydon meniki!"]],
["😂","Hazil",["😂 Nima qilyapsan?","🤣 Bunaqasi ham bo‘ladimi?","😅 Voy, xato ketdi!","🙈 Ko‘rmadim deb hisobla!","🤦 O‘zim ham tushunmadim!","😜 Ataylab qildim!","🫣 Bu yurishni unutaylik!","🤡 Bugun omad kulmadi!","🥲 Yuragim og‘ridi!","😎 Hammasi reja bo‘yicha!","🤭 Seni sinab ko‘rdim!","🐒 Qiziq yurish ekan!","😆 Qaytadan o‘ynaymizmi?","🙃 Vaziyat chatoq!","🫡 Xo‘p, ustoz!"]],
["😈","Chaqiriq",["😈 Qani, kuchingni ko‘rsat!","🔥 Meni yenga olasanmi?","😏 Ishonching komilmi?","🥶 Sovuqqon bo‘l!","👀 Seni kuzatyapman!","🐯 Hujumga tayyormisan?","🦁 Qani, boshladik!","🎯 Meni tutib ko‘r!","🧠 O‘ylashga vaqt bor!","😜 Qo‘rqib ketdingmi?","⚔️ Oxirigacha kurash!","🏆 G‘olib kim bo‘larkin?","💪 Qani, raqib!","🔥 Hali hammasi oldinda!","😎 Men tayyorman!"]],
["🤝","Hurmat",["👏 Yaxshi o‘yin!","🤝 Omad, raqib!","🙌 Ajoyib!","💯 Zo‘r o‘ynayapsan!","🫡 Hurmat!","👏 Chiroyli yurish!","🧠 Ustalik bilan!","🌟 Barakalla!","🏅 Haqiqiy mahorat!","🤜🤛 Kuchli raqib!","❤️ O‘yin uchun rahmat!","🙏 Rahmat, do‘stim!","🎖️ Munosib raqib!","🤝 Yana o‘ynaymiz!","🏆 G‘alabang muborak!"]],
["😬","Omadsizlik",["😅 Omadsizlik!","🤦 Qanday xato!","😭 Voy, donam ketdi!","💔 Bu og‘riqli bo‘ldi!","🥲 Buni kutmagandim!","😵 Vaziyat yomonlashdi!","🙈 Xatoni ko‘rmadim!","😓 Endi nima qilaman?","💀 Tamom bo‘ldim!","🫠 Vaziyat erib ketdi!","😩 Bitta dona qoldi!","🤯 Qanday qilib?!","🥶 Sovuq dush!","📉 Ustunlik qo‘ldan ketdi!","🫥 Jim bo‘lib qoldim..."]],
["🏆","G‘alaba",["🏆 Yutding!","🎉 G‘alaba!","👑 Men chempionman!","🔥 Zo‘r g‘alaba!","🥇 Birinchi o‘rin!","😎 Men aytgandim!","💪 Kuchlilar g‘alaba qozonadi!","🏳️ Taslim bo‘laman!","😅 Bu safar seniki!","🤝 Durang?","🥲 Keyingi safar yutaman!","🔄 Qayta o‘ynaymiz!","🏆 G‘alaba shirin!","👏 Munosib g‘alaba!","🎮 Yana bir partiya!"]],
["⏳","Vaqt",["⏩ Tezroq yur!","⏰ Vaqt ketyapti!","🐢 Juda sekin!","⚡ Tezroq!","⌛ Kutib turibman!","🕐 Vaqting oz qoldi!","🏃 Qani, yur!","😴 Uxlab qoldingmi?","🤔 Hali ham o‘ylayapsanmi?","🚦 Navbat senda!","🔔 Yurish vaqti!","🧘 Shoshilma, lekin yur!","⏳ Vaqt tugayapti!","👀 Kutamiz...","⚡ Tezkor o‘yin!"]],
["🤔","Hayrat",["🤔 O‘ylayapsanmi?","😳 Rostdanmi?","😮 Voy-bo‘!","🤯 Aql bovar qilmaydi!","🧐 Qiziq yurish!","👀 Buni kutmagandim!","😲 Qanday kombinatsiya!","🤨 Ishonching komilmi?","😱 Bunaqa ham bo‘ladimi?!","🫢 Kutilmagan yurish!","🧩 Rejangni tushunmadim!","🤔 Nima maqsad?","😏 Nimadir rejalashtiryapsan!","🕵️ Bir sir bor...","💭 O‘ylab ko‘ray..."]],
["💪","Ruhlantirish",["💪 Sen uddalaysan!","🔥 Olg‘a!","🚀 To‘xtama!","🦁 Kurashni davom ettir!","🌟 Hammasi oldinda!","🙌 Ishon o‘zingga!","💯 Zo‘r ketyapsan!","🏆 G‘alabaga intil!","⚡ Kuchingni ko‘rsat!","🎯 Maqsad sari!","💪 Taslim bo‘lma!","🔥 Oxirigacha!","🌈 Hali imkon bor!","🧠 Aql bilan yut!","🥇 Chempion bo‘l!"]],
["😎","Maqtanish",["😎 Shashka ustasi!","👑 Men qirolman!","🔥 Menga teng keladigani yo‘q!","🏆 G‘alaba meniki!","💪 Kuchimni ko‘rdingmi?","😏 Hammasi nazoratda!","🧠 Ustalik shu!","🥷 Sokin, lekin xavfli!","🎯 Bir zarbada!","👑 Maydon hukmdori!","😎 Professional daraja!","💎 Mening uslubim!","🚀 Darajam boshqa!","🦾 Kuchli o‘yinchi!","🏅 Tajriba gapiradi!"]],
["🔁","Takliflar",["🤝 Durang?","🔄 Qayta o‘ynaymizmi?","🎮 Yana bir partiya?","⏸️ Biroz tanaffus?","🤔 Durangga rozimisan?","🔥 Yana bir jang!","🏆 Revansh qilamizmi?","🙌 Tayyor bo‘lsang, boshlaymiz!","🤜🤛 Kelishdik!","🔁 Yana urinib ko‘r!","🎯 Rematch?","🫱🏻‍🫲🏼 Kelishuv?","🕹️ O‘yinni davom ettiramiz!","💪 Ikkinchi raund?","👋 Keyingi safargacha!"]],
["⚔️","Shashka",["♟️ Shashka ustasi!","👑 Dama bo‘ldi!","💥 Urib ol!","🔗 Zanjirli zarba!","🪤 Tuzoq tayyor!","🎯 Donani saqla!","🛡️ Himoyani mustahkamla!","⚔️ Hujum vaqti!","🔄 Donalarni almashtiramizmi?","🧩 Kombinatsiyani ko‘r!","🏃 Dama tomon yur!","👀 Donangni ehtiyot qil!","💎 Damani yo‘qotma!","🔥 Oxirgi donagacha!","🏆 Shashka — aql o‘yini!"]]
];
function rep(src, from, to, name) {
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log('XATO: "' + name + '" ' + n + ' marta topildi'); process.exit(1); }
  return src.replace(from, () => to);
}
let s = fs.readFileSync('roomclient.js', 'utf8');
if (s.includes('rcQuick')) { console.log('Allaqachon bor'); process.exit(0); }

s = rep(s, 'background:#0b1017;color:#fff;font-family:Arial,sans-serif;',
  'background:radial-gradient(circle at 30% 10%,#3a1a7a 0,#241058 50%,#140a33 100%);color:#fff;font-family:Arial,sans-serif;', 'fon');
s = rep(s, '<div style="font-weight:bold;font-size:18px">♟️ ShashkaPRO</div>',
  '<div style="display:none">♟️ ShashkaPRO</div>', 'sarlavha');
s = rep(s, '<button id="rcClose">', '<button id="rcClose" style="display:none">', 'yopish');
s = rep(s, 'aspect-ratio:1;display:grid;', 'aspect-ratio:1;flex:none;display:grid;', 'doska');
s = rep(s, '<div id="rcChat" style="display:none;width:min(94vw,520px);margin-top:10px">',
  '<div id="rcChat" style="display:none;position:fixed;left:0;right:0;bottom:0;z-index:10000;background:#120b30;border-top:1px solid #3a2f7a;padding:8px 10px calc(env(safe-area-inset-bottom,0px) + 8px);box-sizing:border-box">', 'chat panel');
s = rep(s, 'id="rcMsgs" style="height:150px;', 'id="rcMsgs" style="height:90px;', 'xabarlar');
s = rep(s, '<div style="display:flex;gap:6px;margin-top:6px">',
  '<div id="rcQuick"></div><div style="display:none">', 'kiritish');

const block = `root.querySelector("#rcSend").onclick = sendChat;
    var CATS = ${JSON.stringify(C)};
    var elQ = root.querySelector("#rcQuick");
    elQ.style.cssText = "margin-top:6px";
    var tabs = document.createElement("div");
    tabs.style.cssText = "display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;align-items:center";
    var lab = document.createElement("div");
    lab.style.cssText = "font-size:12px;opacity:.7;margin-bottom:4px";
    var box = document.createElement("div");
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;max-height:112px;overflow-y:auto";
    function showCat(i) {
      box.innerHTML = "";
      lab.textContent = CATS[i][1];
      for (var k = 0; k < tabs.children.length - 1; k++) tabs.children[k].style.background = k === i ? "#6b5cf0" : "";
      CATS[i][2].forEach(function (p) {
        var bt = document.createElement("button");
        bt.textContent = p; bt.style.cssText = "padding:7px 10px;border-radius:12px;font-size:14px";
        bt.onclick = function () { send({ type: "roomChat", roomId: roomId, text: p }); };
        box.appendChild(bt);
      });
    }
    CATS.forEach(function (c, i) {
      var t = document.createElement("button");
      t.textContent = c[0]; t.style.cssText = "flex:none;padding:6px 10px;border-radius:12px;font-size:18px";
      t.onclick = function () { showCat(i); };
      tabs.appendChild(t);
    });
    var xb = document.createElement("button");
    xb.textContent = "✕"; xb.style.cssText = "flex:none;padding:6px 12px;border-radius:12px;font-size:16px";
    xb.onclick = function () { elChatBtn.click(); };
    tabs.appendChild(xb);
    elQ.appendChild(tabs); elQ.appendChild(lab); elQ.appendChild(box);
    showCat(0);`;
s = rep(s, 'root.querySelector("#rcSend").onclick = sendChat;', block, 'kategoriyalar');
fs.writeFileSync('roomclient.js', s);
fs.writeFileSync('phrases.json', JSON.stringify(C.reduce((x, c) => x.concat(c[2]), [])));
console.log('TAYYOR, iboralar:', C.reduce((n, c) => n + c[2].length, 0));
