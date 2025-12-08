# Quick Reference: Production Build & Deployment

## One-Command Workflows

```bash
# Full production workflow (lint → test → build → dist)
npm run prod-build

# Just build (React + Electron)
npm run build

# Create all installers locally (no publish)
npm run dist

# Build and publish to GitHub Releases
npm run dist:github
```

## Build Output Artifacts

```
release/
├── FusionDesk-1.0.0-x64.exe           # NSIS installer (~85MB)
├── FusionDesk-1.0.0-x64.msi           # MSI installer (~92MB)
├── FusionDesk-1.0.0-portable.exe      # Standalone (~65MB)
├── CHECKSUMS.json                     # SHA256/SHA512 hashes
└── app-metadata.json                  # Build info (version, time, etc)

dist/
├── *.js                               # Bundled React app
├── *.css                              # Stylesheets
├── assets/                            # Images, fonts
└── *.js.map                          # Source maps (debugging)

dist-electron/
├── main.js                            # Electron main process
├── preload.js                         # Preload script
├── ipc.ts                             # IPC handlers
└── *.js                              # Other Electron files
```

## Key Configuration Files

| File | Purpose | Key Settings |
|------|---------|---|
| `vite.config.ts` | React bundling | Code splitting, terser, compression |
| `electron-builder.json` | Installers | Target formats, code signing, publish |
| `tsconfig.electron.json` | Electron build | CommonJS output, Node lib |
| `package.json` | Build scripts | dist, dist:github, prod-build |

## Pre-Release Checklist (5 minutes)

```bash
# 1. Lint
npm run lint

# 2. Test
npm run test

# 3. Build
npm run build

# 4. Bundle analysis
npm run build:report  # Review bundle-report.html

# 5. Create installers
npm run dist

# 6. Verify files exist
ls -la release/
```

## GitHub Release Steps

```bash
# 1. Set environment variable (one-time)
$env:GH_TOKEN = "your-github-token"

# 2. Create tag
git tag v1.0.0
git push origin v1.0.0

# 3. Build and publish
npm run dist:github

# 4. Verify on GitHub
# https://github.com/sangwan99-a/file-management-microservices-app/releases
```

## Size Targets at a Glance

```
Target: <100MB installer, <50MB app

Current:
├── NSIS Installer: ~85MB ✅
├── MSI Installer: ~92MB ✅
├── Portable: ~65MB ✅
├── App (uncompressed): ~50MB ✅
└── App (gzipped): ~45MB ✅
```

## Auto-Update Configuration

```typescript
// In React component
const { ipcRenderer } = window.require('electron');

// Check for updates
const result = await ipcRenderer.invoke('check-for-updates');
// → { updateAvailable: true, currentVersion: '1.0.0', availableVersion: '1.0.1' }

// Install update
await ipcRenderer.invoke('install-update');
// → Restarts app to install

// Listen for update events
ipcRenderer.on('update-available', (_, data) => {
  console.log('Update available:', data.version);
});

ipcRenderer.on('update-download-progress', (_, progress) => {
  console.log(`Downloaded: ${progress.percent}%`);
});

ipcRenderer.on('update-downloaded', (_, data) => {
  console.log('Ready to install:', data.version);
});
```

## Performance Monitoring

```typescript
// In any component
import { getPerformanceService } from '@/services/performanceService';

const perf = getPerformanceService();

// Record page view
perf.recordPageView('dashboard');

// Record API call
perf.recordApiCall('/api/users', 'GET', 200, 145); // 145ms duration

// Record error
perf.recordError('auth', new Error('Login failed'), { userId: '123' });

// Record module load
perf.recordModuleLoad('chat', 250); // 250ms to load

// Get metrics
const summary = perf.getSummary();
const metrics = perf.exportMetrics();
```

## Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| Build fails | `pnpm install && npm run clean && npm run build` |
| Installer too large | `npm run build:report` → identify large chunks |
| Auto-update not working | Check `GH_TOKEN` env var, verify release exists |
| App crashes on startup | Enable DevTools, check electron logs in `%APPDATA%\FusionDesk\logs` |
| Code signing fails | Verify certificate path, check password env var |

## Bundle Analysis

```bash
# Generate visual bundle report
npm run build:report

# Creates: bundle-report.html
# Shows:
#  - Module sizes
#  - Tree of dependencies
#  - Largest chunks
#  - Optimization suggestions
```

## Installer Formats

### NSIS (Recommended for users)
- Most common Windows installer
- User-friendly wizard
- Desktop/Start Menu shortcuts
- File associations
- Uninstall via Control Panel

### MSI (For enterprise)
- Windows Installer format
- Group Policy support
- Enterprise deployment ready
- Per-user and per-machine options

### Portable (Power users)
- Single .exe file
- No installation needed
- Auto-update capable
- Takes ~65MB disk space

## Development vs Production

| Setting | Dev | Prod |
|---------|-----|------|
| Source maps | Full | Hidden (*.map only) |
| Console logs | Kept | Removed |
| Minification | None | Terser |
| Tree-shaking | No | Yes |
| Code splitting | No | Yes (11 chunks) |
| Build time | 10s | 40-60s |

## Deployment Timeline

```
Day 1 (Code preparation):
  - Update package.json version
  - Create release notes
  - Run npm run prod-check
  - Create GitHub Release draft

Day 2 (Testing):
  - Test installers on clean VM
  - Run E2E tests
  - Verify auto-updater
  - Review build artifacts

Day 3 (Release):
  - Tag repository (git tag v1.0.0)
  - Push tag (triggers CI/CD)
  - Monitor build completion
  - Publish GitHub Release
  - Announce update to users

Day 4+ (Monitoring):
  - Monitor crash reports
  - Track update adoption
  - Respond to issues
  - Plan patch releases if needed
```

## CI/CD Workflows

### On Tag Push (v*)
```
Checkout → Install → Lint → Test → Build → Create Installers → Publish to GitHub
```

### Nightly (2 AM UTC)
```
Checkout → Install → Build → Create Installers → Upload Artifacts (7 day retention)
```

## Environment Variables

```powershell
# For GitHub publishing
$env:GH_TOKEN = "ghp_xxxxx"

# For code signing (optional)
$env:WIN_CSC_KEY_PASSWORD = "certificate-password"

# For telemetry (optional)
$env:SENTRY_DSN = "https://xxx@sentry.io/xxxxxx"
```

## Important Paths

```
Root:
├── package.json                    # Version, scripts
├── vite.config.ts                 # Bundle optimization
├── electron-builder.json          # Installer config
├── tsconfig.electron.json         # Electron TS config

Scripts:
├── scripts/beforeBuild.js         # Pre-build hooks
├── scripts/afterPack.js           # Post-build hooks
└── scripts/notarize.js            # Code signing

CI/CD:
└── .github/workflows/
    ├── build-release.yml          # Build workflow
    └── nightly-build.yml          # Nightly workflow

Output:
├── dist/                          # React bundle
├── dist-electron/                 # Electron build
└── release/                       # Installers & metadata

Documentation:
├── PRODUCTION_DEPLOYMENT.md       # Full guide
├── RELEASE_CHECKLIST.md          # Release tasks
└── PRODUCTION_OPTIMIZATION_SUMMARY.md # Overview
```

## Quick Tips

1. **Always test locally before GitHub release**
   ```bash
   npm run dist  # Create installers
   # Test manually on clean Windows VM
   ```

2. **Check bundle size regularly**
   ```bash
   npm run build:report
   ```

3. **Monitor auto-updater adoption**
   - Check GitHub Release download counts
   - Monitor crash reports (Sentry)
   - Track performance metrics

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm outdated
   ```

5. **Test auto-updates before release**
   - Build v1.0.0, install, test auto-update
   - Then build v1.0.1, release, verify update works

---

**Need more details?** See:
- Full guide: `PRODUCTION_DEPLOYMENT.md`
- Release checklist: `RELEASE_CHECKLIST.md`
- Build summary: `PRODUCTION_OPTIMIZATION_SUMMARY.md`
