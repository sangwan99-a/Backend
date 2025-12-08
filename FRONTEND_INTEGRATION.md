# Frontend Integration Guide

## 📋 Overview
This guide explains how to integrate your frontend application with the Backend microservices.

## 🏗️ Current Backend Architecture

Your backend has **6 microservices** running on dedicated ports:

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Main entry point for all frontend requests |
| Billing Service | 3001 | Handle billing and payments |
| Chat Service | 3002 | Real-time messaging |
| Email Service | 3003 | Email delivery |
| File Management | 3004 | File upload and storage |
| Logs Service | 3005 | Centralized logging |

## 📂 Integration Steps

### Step 1: Copy Frontend Files
```powershell
# Copy your frontend folder to the Backend directory
Copy-Item -Path "C:\path\to\your\frontend" -Destination "e:\Backend\frontend" -Recurse
```

Expected structure after copying:
```
e:\Backend\
├── services/
├── frontend/          # ← Your frontend app
├── libs/
├── kubernetes/
└── k8s-manifests/
```

### Step 2: Configure Frontend Environment

Update your frontend `.env` or configuration file:

**For React:**
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_BILLING_URL=http://localhost:3001
REACT_APP_CHAT_URL=http://localhost:3002
REACT_APP_EMAIL_URL=http://localhost:3003
REACT_APP_FILE_URL=http://localhost:3004
REACT_APP_LOGS_URL=http://localhost:3005
```

**For Vue:**
```env
VUE_APP_API_URL=http://localhost:3000
VUE_APP_BILLING_URL=http://localhost:3001
```

**For Angular:**
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  billingUrl: 'http://localhost:3001',
  chatUrl: 'http://localhost:3002',
  emailUrl: 'http://localhost:3003',
  fileUrl: 'http://localhost:3004',
  logsUrl: 'http://localhost:3005'
};
```

### Step 3: Install Dependencies

```powershell
cd e:\Backend\frontend
npm install
```

### Step 4: Start Backend Services

Ensure all 6 backend services are running (they are currently running):

```powershell
# Check status
@(3000,3001,3002,3003,3004,3005) | ForEach-Object { 
  $result = Test-NetConnection -ComputerName localhost -Port $_ -WarningAction SilentlyContinue
  if ($result.TcpTestSucceeded) { 
    Write-Host "✓ Port $_" -ForegroundColor Green 
  } 
}
```

### Step 5: Start Frontend Development Server

**React:**
```powershell
cd e:\Backend\frontend
npm start
```

**Vue:**
```powershell
cd e:\Backend\frontend
npm run serve
```

**Angular:**
```powershell
cd e:\Backend\frontend
ng serve
```

Your frontend will typically run on `http://localhost:3000` or `http://localhost:4200` (Angular default).

## 🔌 API Gateway CORS Configuration

The API Gateway has been configured with CORS enabled to allow cross-origin requests from your frontend.

**Current CORS Settings:**
- ✓ All origins allowed in development
- ✓ Credentials enabled
- ✓ Ready for frontend requests

For production, update the CORS configuration in `services/api-gateway/index.ts`:
```typescript
server.register(cors, {
  origin: 'https://yourdomain.com', // Specify your domain
  credentials: true
});
```

## 🔄 API Communication Pattern

Frontend requests flow through the API Gateway:

```
Frontend (localhost:3000 or :4200)
         ↓
    API Gateway (port 3000) - CORS enabled
         ↓
    Routes to specific services:
    - /billing → Billing Service (3001)
    - /chat → Chat Service (3002)
    - /email → Email Service (3003)
    - /files → File Management (3004)
    - /logs → Logs Service (3005)
```

## 📝 Example API Call

```javascript
// From your frontend
const response = await fetch('http://localhost:3000/api/endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## 🚀 Production Deployment

For production:

1. **Build Frontend:**
   ```powershell
   npm run build
   ```

2. **Update API URLs** to point to production backend

3. **Configure CORS** for your production domain

4. **Deploy with Docker:**
   - Dockerfiles ready in service folders
   - Use Kubernetes manifests in `k8s-manifests/`

## 🐛 Troubleshooting

### Frontend can't connect to backend
- ✓ Verify all 6 services are running on their ports
- ✓ Check browser console for CORS errors
- ✓ Ensure API URLs in `.env` are correct

### CORS errors
- Update `services/api-gateway/index.ts` CORS configuration
- Restart API Gateway: `npm run dev` in `services/api-gateway/`

### Port already in use
```powershell
# Find and kill process using port
Get-Process node | Stop-Process -Force
# Restart all services
```

## 📞 API Gateway Endpoints

Currently available:
- `GET /` - Health check returns `{ message: "API Gateway is running" }`

Add more routes in `services/api-gateway/index.ts` to proxy requests to other services.

## ✅ Integration Checklist

- [ ] Frontend folder copied to `e:\Backend\frontend`
- [ ] `.env` file configured with backend URLs
- [ ] `npm install` completed
- [ ] All 6 backend services running
- [ ] Frontend starts without CORS errors
- [ ] API calls work from frontend to backend
- [ ] Data flows correctly through API Gateway

---

**Need help?** Check the logs:
```powershell
# Check backend service logs
Get-Process node | Select-Object Id, ProcessName

# Verify ports
netstat -ano | Select-String ":300[0-5]\s"
```
