import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { setProjectRoot, setHost, KairosHost, setTerminalSaglayici, setDiyalogSaglayici, setDosyaAciciSaglayici } from '@kairos/shared';
import { setupIpcHandlers } from './ipcHandlers';
import { startFileWatcher, stopFileWatcher } from './fileWatcher';
import { createTerminalSaglayici } from './platform/terminal';
import { createDiyalogSaglayici } from './platform/dialog';
import { createDosyaAciciSaglayici } from './platform/shell';

const store: any = new Store({ name: 'kairos-config' });
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let projectRoot: string | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Kairos',
    frame: false,
    show: false, // ready-to-show ile goster (beyaz flash onleme)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Ready-to-show
  win.once('ready-to-show', () => {
    win.show();
  });

  // Dis linkleri varsayilan tarayicide ac
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Dev modda DevTools ac
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Renderer yukle
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    const rendererPath = path.join(__dirname, '..', '..', 'renderer', 'dist', 'index.html');
    win.loadFile(rendererPath);
  }

  return win;
}

function setupWindowControls(): void {
  // Pencere kontrol IPC'leri
  ipcMain.on('kairos:windowMinimize', () => mainWindow?.minimize());
  ipcMain.on('kairos:windowMaximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('kairos:windowClose', () => mainWindow?.close());
  ipcMain.handle('kairos:windowIsMaximized', () => mainWindow?.isMaximized() ?? false);
}

function openProject(root: string): void {
  projectRoot = root;
  setProjectRoot(root);

  // Son projelere ekle
  const recent: string[] = store.get('recentProjects', []) as string[];
  const updated = [root, ...recent.filter(p => p !== root)].slice(0, 10);
  store.set('recentProjects', updated);

  // KairosHost ayarla
  const host: KairosHost = {
    getProjectName: () => path.basename(root),
    getVersion: () => require('../package.json').version,
    showNotification: (msg: string) => {
      if (mainWindow) {
        mainWindow.webContents.send('kairos:push', {
          command: 'bildirimGosterResponse',
          mesaj: msg,
        });
      }
    },
  };
  setHost(host);

  // Platform saglayicilarini ayarla
  setTerminalSaglayici(createTerminalSaglayici(root));
  setDiyalogSaglayici(createDiyalogSaglayici(mainWindow));
  setDosyaAciciSaglayici(createDosyaAciciSaglayici());

  // Dosya izleme baslat
  startFileWatcher(root);

  // Sayfayi yenile
  if (mainWindow) {
    mainWindow.webContents.send('kairos:push', { command: 'fileChanged' });
  }
}

// Tek instance kilidi
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  // Sistem menusunu kaldir
  Menu.setApplicationMenu(null);

  // IPC handlers'i kur
  setupIpcHandlers();
  setupProjectIpc();
  setupWindowControls();

  // Pencere olustur
  mainWindow = createWindow();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Maximize/unmaximize durumunu renderer'a bildir
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('kairos:windowMaximizeChanged', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('kairos:windowMaximizeChanged', false);
  });

  // Komut satiri argumanı ile proje ac
  // Dev modda: [electron, main.js, ...args]  Packaged: [app, ...args]
  const userArgs = isDev ? process.argv.slice(2) : process.argv.slice(1);
  const cliPath = userArgs.find(arg => !arg.startsWith('-') && arg !== '--');

  if (cliPath) {
    // CLI argumaniyla proje belirtilmisse direkt ac
    openProject(path.resolve(cliPath));
  }
  // else: Pencere "proje sec" ekraniyla acilir, kullanici frontend'den secer
});

// Proje secimi IPC — frontend'den "projeSecDialog" cagirilir
function setupProjectIpc(): void {
  ipcMain.handle('kairos:selectProject', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Proje Klasoru Sec',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const selected = result.filePaths[0];
    openProject(selected);
    store.set('lastProject', selected);
    return selected;
  });

  ipcMain.handle('kairos:getRecentProjects', () => {
    return store.get('recentProjects', []);
  });

  ipcMain.handle('kairos:openRecentProject', (_event: Electron.IpcMainInvokeEvent, projectPath: string) => {
    openProject(projectPath);
    store.set('lastProject', projectPath);
    return projectPath;
  });

  ipcMain.handle('kairos:hasProject', () => {
    return projectRoot !== null;
  });
}

app.on('window-all-closed', () => {
  stopFileWatcher();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});
