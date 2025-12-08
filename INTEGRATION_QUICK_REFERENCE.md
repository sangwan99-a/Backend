# 🚀 Frontend-Backend Integration - Quick Reference

## Current Setup

### Backend Services (All Running ✓)
```
API Gateway      → localhost:3000  (Entry point, CORS enabled)
Billing Service  → localhost:3001
Chat Service     → localhost:3002
Email Service    → localhost:3003
File Management  → localhost:3004
Logs Service     → localhost:3005
```

### Frontend Configuration (Updated ✓)
```
API_URL: http://localhost:3000/api/v1
WS_URL:  ws://localhost:3000/ws
File: e:\Backend\Frontend\.env.development
```

---

## ⚡ Quick Commands

### Install & Start Frontend
```powershell
# Install dependencies
cd e:\Backend\Frontend
npm install

# Start React dev server
npm run react-dev

# OR start Electron app
npm run dev
```

### Verify All Services Running
```powershell
@(3000,3001,3002,3003,3004,3005) | ForEach-Object { 
  $result = Test-NetConnection -ComputerName localhost -Port $_ -WarningAction SilentlyContinue
  Write-Host "Port $_`: $(if ($result.TcpTestSucceeded) {'✓'} else {'✗'})"
}
```

### Restart All Backend Services
```powershell
# Stop all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart services (in separate terminals)
cd e:\Backend\services\api-gateway; npm start
cd e:\Backend\services\billing; npm start
cd e:\Backend\services\chat; npm start
cd e:\Backend\services\email; npm start
cd e:\Backend\services\file-management; npm start
cd e:\Backend\services\logs; npm start
```

---

## 📝 Key Configuration Files

### Frontend Environment
**Location:** `e:\Backend\Frontend\.env.development`

**Critical Settings:**
```
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_WS_URL=ws://localhost:3000/ws
```

### API Gateway
**Location:** `e:\Backend\services\api-gateway\index.ts`

**CORS Configuration:**
```typescript
server.register(cors, {
  origin: true,
  credentials: true
});
```

---

## 🔌 How It Works

1. **Frontend** makes request to `http://localhost:3000/api/v1/chat`
2. **API Gateway** receives request (CORS headers added ✓)
3. **API Gateway** routes to appropriate backend service
4. **Backend Service** processes request
5. **Response** returns through API Gateway to Frontend

---

## ✅ Integration Checklist

### Configuration
- [x] Frontend `.env.development` → API Gateway (3000)
- [x] API Gateway CORS enabled
- [x] All service ports configured (3000-3005)
- [x] WebSocket URL updated

### Deployment
- [ ] `npm install` in Frontend folder
- [ ] All 6 backend services running
- [ ] Frontend dev server started (`npm run react-dev`)
- [ ] Frontend loads at `http://localhost:3000`
- [ ] API calls successful (check Network tab)

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port already in use | Kill: `Stop-Process -Name node -Force` |
| Cannot reach API | Verify backend services running, check `.env.development` URL |
| CORS error | Ensure calling `localhost:3000`, not individual service ports |
| WebSocket fails | Update `REACT_APP_WS_URL=ws://localhost:3000/ws` |
| Frontend won't start | Run `npm install`, then `npm run react-dev` |

---

## 📊 Status

**Backend:** ✅ 6/6 Services Running
**Frontend:** ⏳ Ready - Install & Start
**Integration:** ✅ Configuration Complete

---

## 📚 Full Documentation

- `FRONTEND_INTEGRATION.md` - Detailed integration guide
- `FRONTEND_BACKEND_INTEGRATION.md` - Configuration details
- `INTEGRATION_STATUS.md` - Complete status report
- `INTEGRATION_QUICK_REFERENCE.md` - This file

---

**Next Step:** Run `npm install` in `e:\Backend\Frontend` and start with `npm run react-dev`
