#!/bin/bash
# oracle-setup.sh — Monster'ni Oracle Cloud (Ubuntu) serverida lidraughts uchun 24/7 ishga tushirish.
# Oracle'da server yaratishda "Cloud-init script" maydoniga quyidagini qo'ying (lip_... o'rniga o'z tokeningiz):
#
#   #!/bin/bash
#   export LIDRAUGHTS_TOKEN=lip_XXXXXXXX
#   curl -fsSL https://raw.githubusercontent.com/KhudoynazarovR/shashkaPRO/main/oracle-setup.sh | bash
#
# Server ishga tushgach 3-5 daqiqada hammasi o'zi o'rnatiladi va bot onlayn bo'ladi.
# Qayta ishga tushirish/yangilash: sudo systemctl restart monster   (har startda GitHub'dan yangilanadi)
# Log: journalctl -u monster -f
set -e
DIR=/opt/shashkapro
ENVF=/etc/monster.env
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y nodejs gcc git ca-certificates

if [ -d "$DIR/.git" ]; then git -C "$DIR" pull -q || true
else git clone -q --depth 1 https://github.com/KhudoynazarovR/shashkaPRO.git "$DIR"; fi

# token va sozlamalar (oldin yozilgan bo'lsa, token saqlanadi)
if [ -n "$LIDRAUGHTS_TOKEN" ] || [ ! -f "$ENVF" ]; then
  cat > "$ENVF" <<EOF
LIDRAUGHTS_TOKEN=${LIDRAUGHTS_TOKEN}
LIDRAUGHTS_AUTO=1
LIDRAUGHTS_TC=${LIDRAUGHTS_TC:-3+2}
LIDRAUGHTS_TARGETS=${LIDRAUGHTS_TARGETS:-coletteBOT,RipeCherry,Adder}
LIDRAUGHTS_MAXSEC=${LIDRAUGHTS_MAXSEC:-15}
EOF
  chmod 600 "$ENVF"
fi

cat > /etc/systemd/system/monster.service <<EOF
[Unit]
Description=ShashkaPRO Monster bot (lidraughts)
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=$DIR
EnvironmentFile=$ENVF
ExecStartPre=-/usr/bin/git -C $DIR pull -q
ExecStart=/usr/bin/node $DIR/lidraughts-run.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable monster
systemctl restart monster
echo "Monster ishga tushdi. Log: journalctl -u monster -f"
