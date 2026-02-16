const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  fullscreen: () => ipcRenderer.send('window-fullscreen'),

  // Navigation
  goBack: () => ipcRenderer.send('navigate-back'),
  goForward: () => ipcRenderer.send('navigate-forward'),
  refresh: () => ipcRenderer.send('navigate-refresh'),

  // Navigation State Listeners
  onCanGoBack: (callback) => {
    ipcRenderer.on('can-go-back', (_, canGoBack) => callback(canGoBack));
  },
  onCanGoForward: (callback) => {
    ipcRenderer.on('can-go-forward', (_, canGoForward) => callback(canGoForward));
  },

  // Window State
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // 🔄 Auto-Update
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_, status) => callback(status));
  },
});