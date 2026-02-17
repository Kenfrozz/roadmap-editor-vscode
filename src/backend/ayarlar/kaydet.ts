import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SettingsConfig } from '../../types';

// Ayarlari .kairos-settings.json dosyasina kaydeder
// [settings] - Kaydedilecek ayarlar
export function execute(settings: SettingsConfig): void {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) throw new Error('Workspace bulunamadi');
  const dirPath = path.join(folders[0].uri.fsPath, 'kairos');
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  const filePath = path.join(dirPath, 'settings.json');
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
}
