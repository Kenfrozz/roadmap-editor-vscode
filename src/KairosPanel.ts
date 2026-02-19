import * as vscode from 'vscode';
import { WebviewMessage } from './types';
import { handleMessage } from './api';

export class KairosPanel {
  public static currentPanel: KairosPanel | undefined;
  private static readonly viewType = 'kairos';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (KairosPanel.currentPanel) {
      KairosPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      KairosPanel.viewType,
      'Kairos',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      }
    );

    KairosPanel.currentPanel = new KairosPanel(panel, extensionUri);
  }

  public static async createInNewWindow(extensionUri: vscode.Uri): Promise<void> {
    // Mevcut paneli kapat — yeni pencerede temiz acilsin
    if (KairosPanel.currentPanel) {
      KairosPanel.currentPanel.dispose();
    }

    const panel = vscode.window.createWebviewPanel(
      KairosPanel.viewType,
      'Kairos',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      }
    );

    KairosPanel.currentPanel = new KairosPanel(panel, extensionUri);

    // Tab'i yeni pencereye tasi
    await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleMessage(message),
      null,
      this._disposables
    );

    // Webview'a extension hazir sinyali gonder
    setTimeout(() => {
      this._panel.webview.postMessage({ command: 'extensionReady' });
    }, 0);
  }

  public postFileChanged(): void {
    this._panel.webview.postMessage({ command: 'fileChanged' });
  }

  public dispose(): void {
    KairosPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
    }
  }

  private async _handleMessage(message: WebviewMessage): Promise<void> {
    await handleMessage(this._panel.webview, message);
  }

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const nonce = getNonce();

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
  <link href="${styleUri}" rel="stylesheet">
  <title>Kairos</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
