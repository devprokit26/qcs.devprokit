#!/usr/bin/env bash
# ==============================================================================
# ALINCE LOGISTICS — Deployment Script for DigitalOcean Ubuntu Droplet
# ==============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh [user@droplet-ip] [target-directory]
# Example:
#   ./deploy.sh deployer@192.241.150.88 /var/www/alince-logistics
# ==============================================================================

set -euo pipefail

REMOTE_TARGET="${1:-${DEPLOY_HOST:-}}"
TARGET_DIR="${2:-/var/www/alince-logistics}"

if [ -z "$REMOTE_TARGET" ]; then
  echo "❌ Error: Remote host target not provided."
  echo "Usage: ./deploy.sh user@your-droplet-ip [target-dir]"
  exit 1
fi

echo "🚀 Starting ALINCE LOGISTICS Production Build..."

# 1. Run automated tests
echo "🧪 Running unit & component tests..."
npm test

# 2. Build production bundle
echo "📦 Building optimized production bundle..."
npm run build

# 3. Synchronize files with remote Nginx web root
echo "📡 Deploying dist/ to ${REMOTE_TARGET}:${TARGET_DIR}..."
rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  dist/ "${REMOTE_TARGET}:${TARGET_DIR}/"

echo "🔒 Setting file permissions on server..."
ssh "${REMOTE_TARGET}" "sudo chown -R www-data:www-data ${TARGET_DIR} && sudo chmod -R 755 ${TARGET_DIR}"

echo "✅ ALINCE LOGISTICS successfully deployed to ${REMOTE_TARGET}!"
