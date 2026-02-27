#!/bin/bash

# Start Ovi Frontend
echo " Starting Ovi Frontend..."

cd ovi-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Installing dependencies..."
    npm install
else
    echo "✅ Dependencies found"
fi

# Start the Expo development server
echo "📱 Starting Expo development server..."
echo ""
echo "After starting, press:"
echo "  - 'i' for iOS Simulator"
echo "  - 'a' for Android Emulator"
echo "  - 'w' for Web Browser"
echo ""
npm start
