# FusionDesk Desktop Application

Production-ready Windows desktop Electron application with React, TypeScript, and Fluent Design System.

## Features

### Core Architecture
- **Electron** - Cross-platform desktop application framework
- **React 18** - Modern component-based UI
- **TypeScript** - Type-safe development
- **Zustand** - Lightweight state management
- **Fluent Design System** - Windows-native UI components

### Key Features

#### 1. Dashboard
- Productivity widgets with recent activity
- AI insights and recommendations
- Productivity statistics
- Quick action shortcuts

#### 2. Unified Communication
- **Chat Module** - Real-time conversations with presence indicators
- **Email Integration** - Full email management
- **Collaboration Views** - Real-time presence and typing status

#### 3. Productivity Tools
- **Tasks** - Task management with priorities and status tracking
- **Calendar** - Event scheduling and management
- **Documents** - Document creation and collaboration
- **Knowledge Base** - AI-powered semantic search

#### 4. Administration
- **Admin Panel** - Tenant management and billing
- **System Monitoring** - Performance and health metrics
- **User Management** - Role-based access control

#### 5. Windows Integration
- **System Tray** - Minimize to tray with system integration
- **Auto-start** - Optional auto-start on login
- **Native Notifications** - Windows native notification API
- **Snap Layouts** - Windows 11 snap layout support
- **Taskbar Integration** - Jumplist and preview

#### 6. Real-time Capabilities
- **WebSocket** - Real-time data synchronization
- **Presence Services** - Live user presence tracking
- **Typing Indicators** - Real-time typing status
- **Notification Service** - Push notifications

#### 7. Offline Support
- **Service Workers** - Offline functionality
- **IndexedDB** - Local data caching
- **Sync Queue** - Automatic queue for offline actions
- **Offline-first Architecture** - Works seamlessly without connection

#### 8. Security
- **OAuth 2.0** - Secure authentication
- **Token Refresh** - Automatic token management
- **Secure Storage** - Encrypted credential storage
- **Context Isolation** - IPC security isolation
- **CSP** - Content Security Policy headers

#### 9. User Experience
- **Dark/Light/System Theme** - Complete theming support
- **Accessibility** - WCAG 2.1 AA compliance
- **Keyboard Shortcuts** - Full keyboard navigation (Ctrl+K, Ctrl+N, Ctrl+,, Ctrl+B)
- **Responsive Design** - Adaptive layouts
- **Smooth Animations** - Fluid transitions (respects prefers-reduced-motion)

#### 10. Performance
- **Code Splitting** - Lazy loading modules
- **Tree Shaking** - Dead code elimination
- **Bundle Optimization** - <100MB target
- **Performance Monitoring** - Real-time metrics

#### 11. Testing
- **Unit Tests** - Jest + React Testing Library
- **E2E Tests** - Playwright cross-browser
- **Coverage Reports** - Automated coverage tracking

#### 12. Packaging
- **Native Installers** - MSI, NSIS, Portable
- **Auto-updater** - Electron-updater with delta updates
- **Code Signing** - Digital signatures
- **Windows Installer** - Full customization

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Python 3.7+ (for build tools)
- Visual Studio Build Tools (Windows)

### Installation

```bash
# Install dependencies
npm install

# Install development dependencies
npm install --save-dev

# Setup development environment
npm run setup
```

## Development

### Running in Development Mode
```bash
# Start Electron with React dev server
npm run dev

# Or separately:
npm run react-dev      # Terminal 1
npm run electron-dev   # Terminal 2 (after React loads)
```

### Building

```bash
# Build for development
npm run build

# Build React only
npm run react-build

# Compile TypeScript
npm run electron-build

# Create distribution package
npm run dist

# Create Windows MSI installer
npm run dist:msi

# Create portable executable
npm run dist:portable
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Analyze bundle size
npm run analyze
```

## Project Structure

```
src/
├── main.ts                 # Electron main process
├── preload.ts             # Preload script for IPC
├── ipc.ts                 # IPC handlers
├── menu.ts                # Application menu
├── App.tsx                # Root React component
├── index.css              # Global styles
├── components/            # React components
│   ├── Dashboard.tsx
│   ├── Sidebar.tsx
│   ├── Chat.tsx
│   ├── Email.tsx
│   ├── Calendar.tsx
│   ├── Tasks.tsx
│   └── Documents.tsx
├── modules/               # Feature modules
├── store/                 # Zustand stores
│   ├── authStore.ts
│   ├── appStore.ts
│   ├── chatStore.ts
│   └── taskStore.ts
├── services/              # API & WebSocket services
│   ├── api.ts
│   ├── websocket.ts
│   └── offlineDB.ts
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
│   ├── theme.ts
│   ├── keyboard.ts
│   └── notifications.ts
├── types/                 # TypeScript definitions
└── index.tsx              # React entry point
public/
├── index.html
├── manifest.json
└── electron.js
```

## Environment Variables

Create `.env` file in the project root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_CHAT_WS_URL=ws://localhost:8001/chat
REACT_APP_COLLAB_WS_URL=ws://localhost:8002/collaboration
REACT_APP_NOTIFY_WS_URL=ws://localhost:8003/notifications

# Feature Flags
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_ENCRYPTION=true

# Build Configuration
REACT_APP_VERSION=1.0.0
```

## Keyboard Shortcuts

- **Ctrl+K** - Open search
- **Ctrl+N** - New chat
- **Ctrl+,** - Settings
- **Ctrl+B** - Toggle sidebar
- **Ctrl+Enter** - Send message
- **Esc** - Close dialog/menu

## Performance Targets

- **Initial Load**: < 2 seconds
- **Bundle Size**: < 100MB (unpacked)
- **Memory Usage**: < 300MB (baseline)
- **CPU Usage**: < 5% (idle)
- **Time to Interactive**: < 3 seconds

## Security Considerations

1. **Context Isolation** - Main and renderer processes are isolated
2. **Preload Script** - Controlled IPC bridge
3. **CSP Headers** - Content Security Policy enabled
4. **Secure Storage** - Sensitive data encrypted
5. **Token Rotation** - Automatic token refresh
6. **Input Validation** - All user inputs validated
7. **Dependency Management** - Regular security updates

## Packaging & Distribution

### Creating Installers

```bash
# MSI Installer (Windows)
npm run dist:msi

# NSIS Installer (Windows with wizard)
npm run dist

# Portable Executable
npm run dist:portable
```

### Code Signing (Windows)

To sign your installer:

1. Obtain a valid code signing certificate
2. Set environment variables:
   ```env
   CSC_LINK=path/to/certificate.pfx
   CSC_KEY_PASSWORD=your-password
   ```
3. Run build command

### Auto-updater

The application automatically checks for updates. Configure update server:

```json
{
  "publish": {
    "provider": "generic",
    "url": "https://updates.example.com"
  }
}
```

## Troubleshooting

### App won't start
- Clear `node_modules` and reinstall
- Check Node.js version (16+)
- Verify Electron installation

### WebSocket connection fails
- Check WebSocket server is running
- Verify REACT_APP_*_WS_URL environment variables
- Check firewall settings

### Build fails on Windows
- Install Visual Studio Build Tools
- Set npm config: `npm config set msvs_version 2019`
- Try rebuilding: `npm run electron-build`

### High memory usage
- Close unnecessary modules
- Clear cache: `npm run build && rm -rf dist`
- Check for memory leaks in DevTools

## Contributing

1. Create a feature branch
2. Make changes following code style
3. Run tests: `npm test`
4. Submit pull request

## License

MIT

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
