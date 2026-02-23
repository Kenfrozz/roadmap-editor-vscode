import { ipcMain, BrowserWindow, nativeTheme } from 'electron';
import { handleMessage, MesajGonderilebilir } from '@kairos/shared';
import Store from 'electron-store';

const store: any = new Store({ name: 'kairos-state' });

// IPC Adaptor: handleMessage'in bekledighi MesajGonderilebilir arayuzunu IPC icin implemente eder
class IpcAdaptor implements MesajGonderilebilir {
  private _response: unknown = null;

  postMessage(msg: unknown): Promise<boolean> {
    this._response = msg;
    return Promise.resolve(true);
  }

  getResponse(): unknown {
    return this._response;
  }
}

export function setupIpcHandlers(): void {
  // Ana mesaj handler — tum API cagrilari buradan gecer
  ipcMain.handle('kairos:message', async (_event, msg) => {
    const adaptor = new IpcAdaptor();
    await handleMessage(adaptor, msg);
    return adaptor.getResponse();
  });

  // State yonetimi
  ipcMain.on('kairos:getState', (event) => {
    event.returnValue = store.get('webviewState', {});
  });

  ipcMain.on('kairos:setState', (_event, state) => {
    store.set('webviewState', state);
  });

  // Tema
  ipcMain.on('kairos:isDarkMode', (event) => {
    event.returnValue = nativeTheme.shouldUseDarkColors;
  });

  // Tema degisikliklerini dinle ve tum pencerelere bildir
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    BrowserWindow.getAllWindows().forEach(w => {
      w.webContents.send('kairos:themeChanged', isDark);
    });
  });
}

// Push mesaji tum pencerelere gonder
export function pushToAllWindows(msg: unknown): void {
  BrowserWindow.getAllWindows().forEach(w => {
    w.webContents.send('kairos:push', msg);
  });
}
