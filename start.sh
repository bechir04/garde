#!/usr/bin/env bash
# ============================================================
# Garde National — Traffic Accident System — Startup Script
# ============================================================
# The database lives on Render (DATABASE_URL in backend/.env).
# Migrations run on Render at deploy time, so this script does
# not migrate or seed — it only starts the app locally.
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Garde National — نظام إدارة حوادث المرور          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"

# 1. Install backend dependencies
echo "▶ Installing backend dependencies..."
cd "$ROOT/backend"
npm install --silent

# 2. Generate Prisma client
echo "▶ Generating Prisma client..."
npx prisma generate

# 3. Start backend in background
echo "▶ Starting backend API (port 3001)..."
npm run dev &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT

# 4. Install frontend dependencies
echo "▶ Installing frontend dependencies..."
cd "$ROOT/frontend"
npm install --silent

# 5. Start frontend
echo ""
echo "▶ Starting frontend (port 5173)..."
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ System ready!                                    ║"
echo "║  Frontend : http://localhost:5173                    ║"
echo "║  API      : http://localhost:3001/api                ║"
echo "║  DB Studio: run  npm run prisma:studio               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
npm run dev
