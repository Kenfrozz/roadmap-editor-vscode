import * as vscode from 'vscode';
import { RoadmapPanel } from './RoadmapPanel';
import { RoadmapSidebarProvider } from './RoadmapSidebarProvider';
import { consumeSuppression } from './backend/_core/db';

export function activate(context: vscode.ExtensionContext) {
  // Sidebar provider
  const sidebarProvider = new RoadmapSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RoadmapSidebarProvider.viewType,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Tab olarak acma komutu
  context.subscriptions.push(
    vscode.commands.registerCommand('roadmapEditor.open', () => {
      RoadmapPanel.createOrShow(context.extensionUri);
    })
  );

  // Sidebar'i focuslama komutu
  context.subscriptions.push(
    vscode.commands.registerCommand('roadmapEditor.openSidebar', () => {
      vscode.commands.executeCommand('roadmapEditor.sidebar.focus');
    })
  );

  // FileSystemWatcher: ROADMAP.md degisikliklerini dinle
  const watcher = vscode.workspace.createFileSystemWatcher('**/ROADMAP.md');

  const notifyWebviews = () => {
    // Kendi yazmamiz tetiklediyse yoksay
    if (consumeSuppression()) return;
    // Panel ve Sidebar'a bildir
    if (RoadmapPanel.currentPanel) {
      RoadmapPanel.currentPanel.postFileChanged();
    }
    sidebarProvider.postFileChanged();
  };

  watcher.onDidChange(notifyWebviews);
  watcher.onDidCreate(notifyWebviews);
  context.subscriptions.push(watcher);
}

export function deactivate() {}
