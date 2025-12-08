const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');

if (isDev) {
  require('electron-reloader')(module);
}

const mainEntrypoint = path.join(__dirname, '../dist/main.js');

if (!isDev && process.env.ELECTRON_START_URL) {
  require(mainEntrypoint);
} else if (isDev) {
  require(mainEntrypoint);
} else {
  require(mainEntrypoint);
}
