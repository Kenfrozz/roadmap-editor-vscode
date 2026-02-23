import { contextBridge, ipcRenderer } from 'electron';

// window.kairos API'sini renderer process'e expose et
contextBridge.exposeInMainWorld('kairos', {
  // Mesaj gonder ve dogrudan yanit al
  sendMessage: (msg: unknown) => ipcRenderer.invoke('kairos:message', msg),

  // Push mesajlari dinle (fileChanged, kokpitDurumDegisti vb.)
  onPush: (callback: (msg: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, msg: unknown) => callback(msg);
    ipcRenderer.on('kairos:push', handler);
    return () => ipcRenderer.removeListener('kairos:push', handler);
  },

  // State yonetimi (electron-store uzerinden)
  getState: () => ipcRenderer.sendSync('kairos:getState'),
  setState: (s: unknown) => ipcRenderer.send('kairos:setState', s),

  // Tema
  isDarkMode: () => ipcRenderer.sendSync('kairos:isDarkMode'),
  onThemeChange: (callback: (isDark: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isDark: boolean) => callback(isDark);
    ipcRenderer.on('kairos:themeChanged', handler);
    return () => ipcRenderer.removeListener('kairos:themeChanged', handler);
  },

  // Proje secimi
  selectProject: () => ipcRenderer.invoke('kairos:selectProject'),
  getRecentProjects: () => ipcRenderer.invoke('kairos:getRecentProjects'),
  openRecentProject: (projectPath: string) => ipcRenderer.invoke('kairos:openRecentProject', projectPath),
  hasProject: () => ipcRenderer.invoke('kairos:hasProject'),

  // Pencere kontrolleri
  windowMinimize: () => ipcRenderer.send('kairos:windowMinimize'),
  windowMaximize: () => ipcRenderer.send('kairos:windowMaximize'),
  windowClose: () => ipcRenderer.send('kairos:windowClose'),
  windowIsMaximized: () => ipcRenderer.invoke('kairos:windowIsMaximized'),
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('kairos:windowMaximizeChanged', handler);
    return () => ipcRenderer.removeListener('kairos:windowMaximizeChanged', handler);
  },

  // Platform bilgisi
  platform: process.platform,
});
