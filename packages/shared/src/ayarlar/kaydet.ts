import * as fs from 'fs';
import * as path from 'path';
import { getRoot } from '../_core/db';
import { SettingsConfig } from '../types';

// Ayarlari .kairos-settings.json dosyasina kaydeder
// [settings] - Kaydedilecek ayarlar
export function execute(settings: SettingsConfig): void {
  const root = getRoot();
  const dirPath = path.join(root, 'kairos');
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  const filePath = path.join(dirPath, 'settings.json');
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
}
