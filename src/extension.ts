import * as vscode from 'vscode';
import { KairosPanel } from './KairosPanel';
import { KairosSidebarProvider } from './KairosSidebarProvider';
import { consumeSuppression } from './backend/_core/db';
import { KokpitYonetici } from './backend/kokpit/yonetici';

export function activate(context: vscode.ExtensionContext) {
  // Sidebar provider
  const sidebarProvider = new KairosSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      KairosSidebarProvider.viewType,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Tab olarak acma komutu
  context.subscriptions.push(
    vscode.commands.registerCommand('kairos.open', () => {
      KairosPanel.createOrShow(context.extensionUri);
    })
  );

  // Sidebar'i focuslama komutu
  context.subscriptions.push(
    vscode.commands.registerCommand('kairos.openSidebar', () => {
      vscode.commands.executeCommand('kairos.sidebar.focus');
    })
  );

  // Yeni pencerede acma komutu
  context.subscriptions.push(
    vscode.commands.registerCommand('kairos.openNewWindow', async () => {
      await KairosPanel.createInNewWindow(context.extensionUri);
    })
  );

  // FileSystemWatcher: data.json degisikliklerini dinle
  const watcher = vscode.workspace.createFileSystemWatcher('**/kairos/data.json');

  const notifyWebviews = () => {
    // Kendi yazmamiz tetiklediyse yoksay
    if (consumeSuppression()) return;
    // Panel ve Sidebar'a bildir
    if (KairosPanel.currentPanel) {
      KairosPanel.currentPanel.postFileChanged();
    }
    sidebarProvider.postFileChanged();
    // Kokpit: aktif gorev data.json'da tamamlandi mi kontrol et
    KokpitYonetici.getInstance().dosyaDegisti();
  };

  watcher.onDidChange(notifyWebviews);
  watcher.onDidCreate(notifyWebviews);
  watcher.onDidDelete(notifyWebviews);
  context.subscriptions.push(watcher);
}

export function deactivate() {
  KokpitYonetici.getInstance().durdur();
}
