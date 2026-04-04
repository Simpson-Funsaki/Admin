const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  onShowDialog: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on("show-custom-dialog", listener);
    return () => ipcRenderer.removeListener("show-custom-dialog", listener);
  },

  respondDialog: ({ id, response }) => {
    ipcRenderer.send("custom-dialog-response", { id, response });
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
  fullscreen: () => ipcRenderer.send("window-fullscreen"),
  onWindowState: (callback) => {
    ipcRenderer.on("window-state-changed", (_, state) => callback(state));
  },

  // Navigation
  goBack: () => ipcRenderer.send("navigate-back"),
  goForward: () => ipcRenderer.send("navigate-forward"),
  refresh: () => ipcRenderer.send("navigate-refresh"),
  onCanGoBack: (callback) => {
    ipcRenderer.on("can-go-back", (_, canGoBack) => callback(canGoBack));
  },
  onCanGoForward: (callback) => {
    ipcRenderer.on("can-go-forward", (_, canGoForward) =>
      callback(canGoForward),
    );
  },

  // Window State
  getWindowState: () => ipcRenderer.invoke("get-window-state"),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),

  // 🔄 Auto-Update
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update-status", (_, status) => callback(status));
  },

  // 🔐 Credentials
  saveCredentials: (credentials) =>
    ipcRenderer.send("save-credentials", credentials),
  getCredentials: () => ipcRenderer.invoke("get-credentials"),
  clearCredentials: () => ipcRenderer.send("clear-credentials"),

  biometricAuth: () => ipcRenderer.invoke("biometric-auth"),
  saveBiometricCredentials: (data) =>
    ipcRenderer.invoke("save-biometric-credentials", data),
  readBiometricCredentials: (data) =>
    ipcRenderer.invoke("read-biometric-credentials", data),
  checkFileExists: (data) => ipcRenderer.invoke("check-file-exists", data),
  deleteBiometricCredentials: (data) =>
    ipcRenderer.invoke("delete-biometric-credentials", data),
});

// ── Ollama bridge (separate contextBridge key) ───────────────
contextBridge.exposeInMainWorld("ollama", {
  ps: () => ipcRenderer.invoke("ollama-ps"),
  list: () => ipcRenderer.invoke("ollama-list"),
  run: (model, prompt) => ipcRenderer.invoke("ollama-run", { model, prompt }),

  onToken: (cb) => {
    ipcRenderer.on("ollama-run-token", (_, token) => cb(token));
  },
  onDone: (cb) => {
    ipcRenderer.once("ollama-run-done", () => cb());
  },
  removeListeners: () => {
    ipcRenderer.removeAllListeners("ollama-run-token");
    ipcRenderer.removeAllListeners("ollama-run-done");
  },
});
