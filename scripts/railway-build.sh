#!/usr/bin/env sh
set -e

export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/npm-cache}"
export VITE_CACHE_DIR="${VITE_CACHE_DIR:-/tmp/vite-cache}"

echo "==> Installing root dependencies (Node $(node -v))..."
npm install --no-audit --no-fund

echo "==> Building frontend..."
npm run build

echo "==> Installing server dependencies..."
cd server
npm install --no-audit --no-fund

echo "==> Build complete."
