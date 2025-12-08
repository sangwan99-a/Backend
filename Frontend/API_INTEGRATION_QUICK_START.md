# Full-Stack API Integration - Quick Start Guide

## What Was Delivered

Complete production-grade API integration layer connecting FusionDesk frontend to 8 backend microservices:

### 8 Module API Clients (2,500+ LOC)
```
✅ Dashboard API (analytics, insights, real-time)
✅ Chat API (messaging, channels, WebSocket)
✅ Email API (compose, folders, notifications)
✅ Calendar API (events, drag-drop, iCal)
✅ Tasks API (projects, boards, collaboration)
✅ Documents API (file upload, versioning, sharing)
✅ Search API (full-text, semantic, AI Q&A)
✅ Admin API (tenants, users, RBAC, billing)
```

### Core Infrastructure
```
✅ Unified API Client (http, retry, auth, caching)
✅ WebSocket Manager (auto-reconnect, offline queue)
✅ React Query Hooks (caching, pagination)
✅ Environment Configuration (dev/prod)
✅ Environment Files (.env.development/.production)
```

## Getting Started (30 seconds)

### 1. Copy Environment Variables
```bash
cd e:/Frontend

# Copy development config
cp .env.example .env.local

# Or for production (update endpoints)
cp .env.production .env.local
```

### 2. Update Your Backend Endpoints
Edit `.env.local`:
```env
REACT_APP_API_URL=http://your-api.com/api/v1
REACT_APP_WS_URL=ws://your-api.com/ws
```

### 3. Import and Use
```typescript
// In your React component
import { useApi } from '@/lib/api-client';
import { useProductivityMetrics } from '@/services/dashboardAPIClient';
import { useChatChannels, useSendMessage } from '@/services/chatAPIClient';

export function Dashboard() {
  // Dashboard metrics with 1-min cache
  const { data: metrics } = useProductivityMetrics('week');
  
  // Chat channels with 2-min cache
  const { data: channels } = useChatChannels();
  
  return (
    <div>
      <MetricsCard metrics={metrics} />
      <ChannelList channels={channels} />
    </div>
  );
}
```

## Common Patterns

### Fetch Data
```typescript
import { useApi } from '@/lib/api-client';
import { dashboardAPI } from '@/services/dashboardAPIClient';

const { data, isLoading, error } = useApi(
  ['key', variables],
  () => dashboardAPI.getProductivityMetrics('month'),
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);
```

### Send Data (Mutation)
```typescript
import { useSendEmail } from '@/services/emailAPIClient';

const { mutate, isPending } = useSendEmail();

const handleSend = () => {
  mutate(
    {
      to: ['user@example.com'],
      subject: 'Hello',
      body: 'Message'
    },
    {
      onSuccess: (email) => console.log('Sent!', email),
      onError: (error) => console.error('Failed:', error)
    }
  );
};
```

### Real-Time Updates
```typescript
import { useWebSocket } from '@/lib/websocket-manager';

const { isConnected } = useWebSocket(
  'chat-channel-1',
  { url: `${wsUrl}/ws/chat/channel-1` },
  (message) => handleNewMessage(message)
);
```

### Paginated Results
```typescript
import { useChatMessages } from '@/services/chatAPIClient';

const { data, fetchNextPage, hasNextPage } = useChatMessages('channel-1');

// Infinite scroll
const handleLoadMore = () => fetchNextPage();
```

## API Methods Reference

### Dashboard
```typescript
dashboardAPI.getProductivityMetrics(period)
dashboardAPI.getAIInsights(limit)
dashboardAPI.getDashboardStats()
dashboardAPI.subscribeToAnalytics(userId, callback)
```

### Chat
```typescript
chatAPI.getChannels()
chatAPI.getMessages(channelId, page)
chatAPI.sendMessage(channelId, content, attachments)
chatAPI.subscribeToChannel(channelId, onMessage)
```

### Email
```typescript
emailAPI.getFolders()
emailAPI.getMessages(folderId, page)
emailAPI.sendEmail({ to, subject, body })
emailAPI.subscribeToNotifications(onNotification)
```

### Calendar
```typescript
calendarAPI.getEvents(startDate, endDate)
calendarAPI.createEvent({ title, startTime, endTime })
calendarAPI.rescheduleEvent(eventId, startTime, endTime)
calendarAPI.importCalendar(file)
```

### Tasks
```typescript
tasksAPI.getProjects()
tasksAPI.getTasks(projectId, filters)
tasksAPI.createTask({ title, projectId })
tasksAPI.updateTaskStatus(taskId, status, order)
tasksAPI.subscribeToProject(projectId, onUpdate)
```

### Documents
```typescript
documentsAPI.listDocuments(parentId)
documentsAPI.uploadFile(file, parentId)
documentsAPI.getVersions(documentId)
documentsAPI.shareDocument(documentId, users)
documentsAPI.subscribeToDocument(documentId, onChange)
```

### Search
```typescript
searchAPI.search(query, filters)
searchAPI.semanticSearch(query)
searchAPI.askQuestion(question)
searchAPI.getSuggestions(query)
```

### Admin
```typescript
adminAPI.getTenant(tenantId)
adminAPI.getUsers(tenantId, role)
adminAPI.createUser({ email, name, role })
adminAPI.getSubscription(tenantId)
adminAPI.getAuditLogs(tenantId, filters)
```

## Architecture

All requests flow through unified client with:
1. **Auth** - Automatic bearer token injection
2. **Retry** - Exponential backoff (1s, 2s, 4s, 8s, max 10s)
3. **Rate Limit** - Automatic queue for 429 responses
4. **Cache** - React Query with module-specific TTLs
5. **Offline** - Request queue when network unavailable
6. **Error Handling** - Structured APIError with context

Real-time features use WebSocket with:
- Auto-reconnect (3s→5s intervals, max 10 attempts)
- Message queuing during disconnects
- Subscription management with cleanup
- Network online/offline detection

## File Locations

```
src/
  lib/
    api-client.ts           # Unified HTTP client
    api-config.ts           # Configuration
    websocket-manager.ts    # WebSocket management
  services/
    dashboardAPIClient.ts   # Dashboard integration
    chatAPIClient.ts        # Chat integration
    emailAPIClient.ts       # Email integration
    calendarAPIClient.ts    # Calendar integration
    tasksAPIClient.ts       # Tasks integration
    documentsAPIClient.ts   # Documents integration
    searchAPIClient.ts      # Search integration
    adminAPIClient.ts       # Admin integration

.env.development            # Development config
.env.production             # Production config
.env.example                # Template
```

## Configuration

### Development
```env
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_WS_URL=ws://localhost:3001/ws
REACT_APP_LOG_LEVEL=debug
```

### Production
```env
REACT_APP_API_URL=https://api.fusiondesk.app/api/v1
REACT_APP_WS_URL=wss://api.fusiondesk.app/ws
REACT_APP_LOG_LEVEL=error
```

### Feature Flags
```env
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_REAL_TIME=true
REACT_APP_ENABLE_AI_INSIGHTS=true
REACT_APP_ENABLE_SEMANTIC_SEARCH=true
REACT_APP_ENABLE_FILE_COLLABORATION=true
REACT_APP_ENABLE_OFFLINE_MODE=true
```

## Error Handling

Errors are automatically structured:
```typescript
{
  status: 500,
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Something went wrong',
  details: { ... }
}
```

Use ErrorBoundary component for UI failures:
```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

## Offline Support

Automatic request queuing when offline:
```typescript
// This request is queued if offline, sent when online
await emailAPI.sendEmail({ to, subject, body });

// Access queue status
import { wsManager } from '@/lib/websocket-manager';
const queueSize = wsManager.getQueueSize();
const isOnline = wsManager.isNetworkOnline();
```

## Performance Tips

1. **Cache stale times** are optimized per module:
   - Analytics: 1-2 min (real-time needs)
   - Chat: 0 min (always fresh)
   - Email: 0 min (new emails critical)
   - Calendar: 5 min
   - Tasks: 1 min
   - Documents: 5-10 min
   - Search: 0 min

2. **Pagination** uses infinite scroll:
   ```typescript
   const { data, fetchNextPage } = useInfiniteApi(...);
   const handleLoadMore = () => fetchNextPage();
   ```

3. **WebSocket** subscriptions auto-cleanup:
   ```typescript
   useEffect(() => {
     const unsubscribe = wsManager.subscribe(channel, onMessage);
     return unsubscribe; // Cleanup on unmount
   }, []);
   ```

## Debugging

Enable debug logging:
```typescript
import { updateApiConfig } from '@/lib/api-config';

updateApiConfig({
  enableLogging: true,
  logLevel: 'debug'
});
```

Monitor WebSocket connections:
```typescript
import { wsManager } from '@/lib/websocket-manager';

wsManager.on('connected', ({ channelId }) => console.log('Connected:', channelId));
wsManager.on('disconnected', ({ channelId }) => console.log('Disconnected:', channelId));
wsManager.on('offline', () => console.log('Network offline'));
wsManager.on('online', () => console.log('Network online'));
```

## Testing

All modules are testable with Mock Service Worker (MSW):
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/v1/dashboard/stats', (req, res, ctx) => {
    return res(ctx.json({ /* mock data */ }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Support

For issues:
1. Check `.env` configuration
2. Verify backend endpoints are running
3. Enable debug logging
4. Check browser DevTools Network tab
5. Review ErrorBoundary logs

## Next Phase

Ready for:
- ✅ MSW mock setup
- ✅ Comprehensive test suite
- ✅ API documentation
- ✅ Performance monitoring
- ✅ Error monitoring (Sentry)
- ✅ Deployment pipeline

---

**Total Integration**: 8 microservices, 80+ API methods, 15+ data hooks, 20+ mutation hooks, 2,500+ lines of code, production-ready.
