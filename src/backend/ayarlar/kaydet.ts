import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SettingsConfig } from '../../types';

// Ayarlari .roadmap-settings.json dosyasina kaydeder
// [settings] - Kaydedilecek ayarlar
export function execute(settings: SettingsConfig): void {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) throw new Error('Workspace bulunamadi');
  const filePath = path.join(folders[0].uri.fsPath, '.roadmap-settings.json');
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
}
