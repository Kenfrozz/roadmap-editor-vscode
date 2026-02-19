import * as vscode from 'vscode';
import { WebviewMessage } from './types';
import { handleMessage } from './api';

export class KairosSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kairos.sidebar';

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public postFileChanged(): void {
    if (this._view) {
      this._view.webview.postMessage({ command: 'fileChanged' });
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist')],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleMessage(webviewView.webview, message),
      null,
      this._disposables
    );

    // Webview'a extension hazir sinyali gonder
    setTimeout(() => {
      webviewView.webview.postMessage({ command: 'extensionReady' });
    }, 0);

    webviewView.onDidDispose(() => {
      this._view = undefined;
      while (this._disposables.length) {
        const d = this._disposables.pop();
        if (d) { d.dispose(); }
      }
    });
  }

  private async _handleMessage(webview: vscode.Webview, message: WebviewMessage): Promise<void> {
    await handleMessage(webview, message);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
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
