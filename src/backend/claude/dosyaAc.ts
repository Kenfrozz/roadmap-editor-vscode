import * as vscode from 'vscode';
import * as path from 'path';

// Dosyayi VS Code editorunde acar
export async function execute(filename: string): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) throw new Error('Workspace bulunamadi');
  const uri = vscode.Uri.file(path.join(folders[0].uri.fsPath, filename));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc, { preview: false });
}
