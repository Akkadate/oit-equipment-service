#!/bin/bash
# deploy/update.sh — อัปเดตโปรเจกต์ (รันทุกครั้งที่ deploy ใหม่)
# sudo bash deploy/update.sh

set -e

APP_DIR="/var/www/oit-equipment-service"

echo "=== Deploying OIT Equipment Service ==="

cd "$APP_DIR"

echo "[1/4] Pull latest code..."
git pull origin main

echo "[2/4] Install dependencies..."
npm ci --omit=dev

echo "[3/4] Build..."
npm run build

echo "[4/4] Restart service..."
systemctl restart oit-equipment
sleep 2
echo "    สถานะ: $(systemctl is-active oit-equipment)"

echo ""
echo "=== Deploy เสร็จ ==="
