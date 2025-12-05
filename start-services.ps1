# Backend Services Startup Script
Write-Host "🚀 Starting Backend Services..." -ForegroundColor Green
Write-Host ""

# Start API Gateway
Write-Host "📍 Starting API Gateway on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'e:\Backend\services\api-gateway'; node dist/index.js`"" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "✓ API Gateway started" -ForegroundColor Green
Write-Host ""

# Start Chat Service
Write-Host "📍 Starting Chat Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'e:\Backend\services\chat'; npm install --silent; npm start`"" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "✓ Chat Service started" -ForegroundColor Green
Write-Host ""

# Start Email Service
Write-Host "📍 Starting Email Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'e:\Backend\services\email'; npm install --silent; npm start`"" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "✓ Email Service started" -ForegroundColor Green
Write-Host ""

# Start File Management Service
Write-Host "📍 Starting File Management Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'e:\Backend\services\file-management'; npm install --silent; npm start`"" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "✓ File Management Service started" -ForegroundColor Green
Write-Host ""

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    ✅ ALL SERVICES STARTED             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Running Services:" -ForegroundColor Yellow
Write-Host "  • API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • Chat Service: Running" -ForegroundColor Cyan
Write-Host "  • Email Service: Running" -ForegroundColor Cyan
Write-Host "  • File Management: Running" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Backend is fully operational!" -ForegroundColor Green
