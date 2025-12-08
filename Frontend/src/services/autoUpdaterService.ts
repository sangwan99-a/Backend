/**
 * Auto-updater service for FusionDesk
 * Manages Squirrel.Windows installer updates via GitHub Releases
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog, ipcMain } from 'electron';

// Configure logging using console
const log = {
  info: (...args: any[]) => console.info('[AutoUpdater]', ...args),
  error: (...args: any[]) => console.error('[AutoUpdater]', ...args),
  warn: (...args: any[]) => console.warn('[AutoUpdater]', ...args),
};

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
}

export class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateDownloaded = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  /**
   * Setup auto-updater event listeners
   */
  private setupAutoUpdater(): void {
    // Check for updates on startup
    autoUpdater.checkForUpdatesAndNotify();

    // Auto-check every hour
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 60 * 60 * 1000);

    // Handle update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });

      // Show notification
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-notification', {
          type: 'available',
          message: `FusionDesk ${info.version} is available. Downloading...`,
        });
      }
    });

    // Handle update not available
    autoUpdater.on('update-not-available', () => {
      log.info('No updates available');
      this.sendToRenderer('update-not-available');
    });

    // Handle update download progress
    autoUpdater.on('download-progress', (progress: UpdateProgress) => {
      log.info(`Download progress: ${progress.percent}%`);
      this.sendToRenderer('update-download-progress', progress);
    });

    // Handle update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.updateDownloaded = true;

      // Show notification
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-notification', {
          type: 'downloaded',
          message: 'Update ready to install. Please restart FusionDesk.',
          action: 'restart',
        });
      }

      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    });

    // Handle update error
    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      this.sendToRenderer('update-error', {
        message: error.message,
      });
    });

    // Setup IPC handlers
    this.setupIpcHandlers();
  }

  /**
   * Setup IPC handlers for renderer process
   */
  private setupIpcHandlers(): void {
    // Check for updates manually
    ipcMain.handle('check-for-updates', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
        return {
          updateAvailable: result?.updateInfo !== null,
          currentVersion: autoUpdater.currentVersion.version,
          availableVersion: result?.updateInfo?.version,
        } as UpdateCheckResult;
      } catch (error) {
        log.error('Check for updates error:', error);
        throw error;
      }
    });

    // Install update and restart
    ipcMain.handle('install-update', async () => {
      if (this.updateDownloaded) {
        autoUpdater.quitAndInstall();
      } else {
        log.warn('Update not yet downloaded');
        throw new Error('Update not yet downloaded');
      }
    });

    // Download update manually
    ipcMain.handle('download-update', async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        log.error('Download update error:', error);
        throw error;
      }
    });

    // Get current version
    ipcMain.handle('get-version', () => {
      return {
        version: autoUpdater.currentVersion.version,
        buildNumber: process.env.BUILD_NUMBER || 'dev',
      };
    });
  }

  /**
   * Send message to renderer process
   */
  private sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        updateAvailable: result?.updateInfo !== null,
        currentVersion: autoUpdater.currentVersion.version,
        availableVersion: result?.updateInfo?.version,
      };
    } catch (error) {
      log.error('Check for updates error:', error);
      throw error;
    }
  }

  /**
   * Show update dialog
   */
  public async showUpdateDialog(mainWindow: BrowserWindow): Promise<void> {
    const result = await autoUpdater.checkForUpdates();

    if (!result || !result.updateInfo) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'No Updates',
        message: 'You are running the latest version of FusionDesk.',
        buttons: ['OK'],
      });
      return;
    }

    const response = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `FusionDesk ${result.updateInfo.version} is available.`,
      detail: `Current version: ${autoUpdater.currentVersion.version}`,
      buttons: ['Download & Install', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 0) {
      // Start download
      log.info('User agreed to update');
      await autoUpdater.downloadUpdate();
    }
  }

  /**
   * Disable auto-updates (for testing)
   */
  public disableAutoUpdates(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    log.info('Auto-updates disabled');
  }

  /**
   * Enable auto-updates
   */
  public enableAutoUpdates(): void {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    log.info('Auto-updates enabled');
  }
}

export default AutoUpdaterService;
