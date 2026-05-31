#!/usr/bin/env sh
set -e

export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/npm-cache}"
export VITE_CACHE_DIR="${VITE_CACHE_DIR:-/tmp/vite-cache}"

echo "==> Installing root dependencies (Node $(node -v))..."
npm install --no-audit --no-fund

echo "==> Building frontend..."
npm run build

echo "==> Copying agent documentation into dist..."
cp AGENTS.md dist/AGENTS.md
mkdir -p dist/docs/agents
cp docs/agents/*.md dist/docs/agents/
cp .cursor/skills/keymint/SKILL.md dist/docs/skill.md

echo "==> Installing server dependencies..."
cd server
npm install --no-audit --no-fund

echo "==> Build complete."
