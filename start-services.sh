#!/bin/bash

echo "🚀 Starting Backend Services..."
echo ""

# Start API Gateway
echo "📍 Starting API Gateway on port 3000..."
cd e:\Backend\services\api-gateway
node dist/index.js &
API_GATEWAY_PID=$!
echo "✓ API Gateway started (PID: $API_GATEWAY_PID)"
echo ""

# Start Chat Service
echo "📍 Starting Chat Service..."
cd e:\Backend\services\chat
npm install --silent
npm start &
CHAT_PID=$!
echo "✓ Chat Service started (PID: $CHAT_PID)"
echo ""

# Start Email Service
echo "📍 Starting Email Service..."
cd e:\Backend\services\email
npm install --silent
npm start &
EMAIL_PID=$!
echo "✓ Email Service started (PID: $EMAIL_PID)"
echo ""

# Start File Management Service
echo "📍 Starting File Management Service..."
cd e:\Backend\services\file-management
npm install --silent
npm start &
FILE_PID=$!
echo "✓ File Management Service started (PID: $FILE_PID)"
echo ""

echo "╔════════════════════════════════════════╗"
echo "║    ✅ ALL SERVICES STARTED             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📊 Running Services:"
echo "  • API Gateway: http://localhost:3000"
echo "  • Chat Service: Running"
echo "  • Email Service: Running"
echo "  • File Management: Running"
echo ""
echo "⏸️  Press Ctrl+C to stop all services"
sleep infinity
