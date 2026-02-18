import * as vscode from 'vscode';
import * as path from 'path';

// VS Code dosya secici dialog acar, workspace-relative yol doner
export async function execute(): Promise<{ filename: string } | null> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return null;

  const result = await vscode.window.showOpenDialog({
    canSelectMany: false,
    defaultUri: folders[0].uri,
    filters: { 'Markdown / Text': ['md', 'txt', 'rst'] },
    openLabel: 'PRD Dosyasi Sec',
  });

  if (!result || result.length === 0) return null;

  const relativePath = path.relative(folders[0].uri.fsPath, result[0].fsPath).replace(/\\/g, '/');
  return { filename: relativePath };
}
