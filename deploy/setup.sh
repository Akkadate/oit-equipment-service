#!/bin/bash
# deploy/setup.sh — รันครั้งแรกบน Ubuntu server
# sudo bash deploy/setup.sh

set -e

APP_DIR="/var/www/app/oit-equipment-service"
DOMAIN="oitservice.norhbkk.ac.th"
REQUIRED_NODE_MAJOR=18

echo "=== OIT Equipment Service — Server Setup ==="

# ─── 1. ตรวจสอบ/อัปเกรด Node.js ─────────────────────────────────────────
CURRENT_NODE_MAJOR=0
if command -v node &>/dev/null; then
    CURRENT_NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
fi

if [ "$CURRENT_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "[1/6] Node.js $(node -v 2>/dev/null || echo 'ไม่มี') — อัปเกรดเป็น Node.js 22 LTS..."
    apt-get remove -y nodejs npm 2>/dev/null || true
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    echo "    Node.js $(node -v) ติดตั้งเรียบร้อย"
else
    echo "[1/6] Node.js $(node -v) OK (>= v${REQUIRED_NODE_MAJOR})"
fi

# ─── 2. สร้าง directory ──────────────────────────────────────────────────
echo "[2/6] สร้าง directory..."
mkdir -p "$APP_DIR/public/uploads/inspections"
chown -R www-data:www-data "$APP_DIR" 2>/dev/null || true

# ─── 3. Install dependencies + Build ─────────────────────────────────────
echo "[3/6] Install & Build..."
cd "$APP_DIR"

# ใช้ npm install แทน npm ci ถ้า lockfile ขาด
if [ -f "package-lock.json" ]; then
    npm ci --omit=dev
else
    echo "    ไม่พบ package-lock.json — รัน npm install..."
    npm install --omit=dev
fi

npm run build

# ─── 4. ตั้งค่า systemd service ──────────────────────────────────────────
echo "[4/6] ตั้งค่า systemd..."
sed "s|/var/www/oit-equipment-service|$APP_DIR|g" \
    "$APP_DIR/deploy/oit-equipment.service" > /etc/systemd/system/oit-equipment.service
systemctl daemon-reload
systemctl enable oit-equipment
systemctl restart oit-equipment
sleep 2
echo "    สถานะ: $(systemctl is-active oit-equipment)"

# ─── 5. ตั้งค่า Nginx ────────────────────────────────────────────────────
echo "[5/6] ตั้งค่า Nginx..."
if ! command -v nginx &>/dev/null; then
    apt-get install -y nginx
fi
sed "s|/var/www/oit-equipment-service|$APP_DIR|g" \
    "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/oitservice
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
