const { ipcMain } = require("electron");

let _mainWindow = null;
let _pendingDialogs = new Map();
let _dialogCounter = 0;

function setupDialogBridge(mainWindow) {
  _mainWindow = mainWindow;

  ipcMain.on("custom-dialog-response", (_, { id, response }) => {
    const pending = _pendingDialogs.get(id);
    if (pending) {
      _pendingDialogs.delete(id);
      pending.resolve({ response });
    }
  });
}

function showCustomDialog(opts) {
  return new Promise((resolve) => {
    const id = ++_dialogCounter;
    _pendingDialogs.set(id, { resolve });
    _mainWindow.webContents.send("show-custom-dialog", { id, ...opts });
  });
}

function showcustomPopup(){
  
}


module.exports = { setupDialogBridge, showCustomDialog };