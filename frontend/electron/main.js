const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // optional safe APIs
      contextIsolation: true,   // ✅ secure
      nodeIntegration: false,   // ✅ secure
      enableRemoteModule: false,
      sandbox: true
    }
  });

  // Load your Vercel web app
  mainWindow.loadURL('https://react-journey-gamma.vercel.app/');

  // Open DevTools if you want for debugging (remove in production)
  // mainWindow.webContents.openDevTools();
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// macOS re-open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
