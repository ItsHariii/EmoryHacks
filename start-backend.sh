#!/bin/bash

# Start Ovi Backend
echo "🚀 Starting Ovi Backend..."

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "✅ Virtual environment found"
fi

# Start the backend server
echo "🔧 Starting FastAPI server on http://localhost:8000"
./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
