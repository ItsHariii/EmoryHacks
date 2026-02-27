#!/bin/bash

echo "🛑 Stopping any running backend servers..."
pkill -f "uvicorn app.main:app" 2>/dev/null

echo "🧹 Cleaning Python cache..."
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting backend server..."
echo "   Watch for the message: '🔍 MICRONUTRIENT FIX ACTIVE'"
echo ""

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
