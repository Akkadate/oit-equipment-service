#!/bin/bash
set -e

APP_DIR="/var/www/app/oit-equipment-service"

cd "$APP_DIR"
git pull
npm run build
systemctl restart oit-equipment

echo "Deploy สำเร็จ ✓"
