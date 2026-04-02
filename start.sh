#!/usr/bin/env bash
# ============================================================
# Garde National — Traffic Accident System — Startup Script
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Garde National — نظام إدارة حوادث المرور          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"

# 1. Start PostgreSQL via Docker
echo "▶ Starting PostgreSQL (Docker)..."
docker compose up -d
echo "  Waiting for DB to be ready..."
sleep 4

# 2. Install backend dependencies
echo "▶ Installing backend dependencies..."
cd "$ROOT/backend"
npm install --silent

# 3. Generate Prisma client
echo "▶ Generating Prisma client..."
npx prisma generate

# 4. Apply migrations
echo "▶ Applying database migrations..."
npx prisma migrate deploy

# 5. Seed the database (idempotent)
echo "▶ Seeding database..."
npx prisma db seed

# 6. Start backend in background
echo "▶ Starting backend API (port 3001)..."
npm run start:dev &
BACKEND_PID=$!

# 7. Install frontend dependencies
echo "▶ Installing frontend dependencies..."
cd "$ROOT/frontend"
npm install --silent

# 8. Start frontend
echo ""
echo "▶ Starting frontend (port 5173)..."
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ System ready!                                    ║"
echo "║  Frontend : http://localhost:5173                    ║"
echo "║  API      : http://localhost:3001/api                ║"
echo "║  DB Studio: run  npm run prisma:studio               ║"
echo "║                                                      ║"
echo "║  Demo credentials:                                   ║"
echo "║    Admin  : admin   / admin123                       ║"
echo "║    Officer: officer / officer123                     ║"
echo "║    Analyst: viewer  / viewer123                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
npm run dev
