#!/bin/bash
# deploy/setup.sh — รันครั้งแรกบน Ubuntu server
# sudo bash deploy/setup.sh

set -e

APP_DIR="/var/www/oit-equipment-service"
DOMAIN="oitservice.norhbkk.ac.th"

echo "=== OIT Equipment Service — Server Setup ==="

# ─── 1. ติดตั้ง Node.js (LTS) ────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo "[1/6] ติดตั้ง Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo "[1/6] Node.js $(node -v) มีอยู่แล้ว"
fi

# ─── 2. สร้าง directory ──────────────────────────────────────────────────
echo "[2/6] สร้าง directory..."
mkdir -p "$APP_DIR/public/uploads/inspections"
chown -R www-data:www-data "$APP_DIR"

# ─── 3. Copy ไฟล์โปรเจกต์ ────────────────────────────────────────────────
echo "[3/6] Copy ไฟล์..."
# สมมติว่า git clone หรือ rsync มาแล้วที่ $APP_DIR
cd "$APP_DIR"
npm ci --omit=dev
npm run build

# ─── 4. ตั้งค่า systemd service ──────────────────────────────────────────
echo "[4/6] ตั้งค่า systemd..."
cp "$APP_DIR/deploy/oit-equipment.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable oit-equipment
systemctl restart oit-equipment
echo "    สถานะ: $(systemctl is-active oit-equipment)"

# ─── 5. ตั้งค่า Nginx ────────────────────────────────────────────────────
echo "[5/6] ตั้งค่า Nginx..."
if ! command -v nginx &>/dev/null; then
    apt-get install -y nginx
fi
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/oitservice
ln -sf /etc/nginx/sites-available/oitservice /etc/nginx/sites-enabled/oitservice
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "    Nginx: $(systemctl is-active nginx)"

# ─── 6. สิทธิ์ uploads folder ────────────────────────────────────────────
echo "[6/6] ตั้งสิทธิ์ uploads..."
chown -R www-data:www-data "$APP_DIR/public/uploads"
chmod -R 755 "$APP_DIR/public/uploads"

echo ""
echo "=== Setup เสร็จสมบูรณ์ ==="
echo "    URL: https://$DOMAIN"
echo ""
echo "หมายเหตุ: ตรวจสอบ SSL certificate ใน nginx.conf ก่อน reload Nginx"
echo "    ssl_certificate     /etc/ssl/certs/oitservice.norhbkk.ac.th.crt"
echo "    ssl_certificate_key /etc/ssl/private/oitservice.norhbkk.ac.th.key"
