import * as vscode from 'vscode';
import * as path from 'path';
import { writeFile, suppressNextFileChange, getRoot } from '../_core/db';
import { execute as yedekOlustur } from './olustur';

const BACKUP_DIR = '.kairos-backups';

// Belirtilen yedek dosyasini geri yukler
// [backupFilename] - Geri yuklenecek yedek dosyasinin adi
export async function execute(backupFilename: string): Promise<void> {
  const root = getRoot();
  const backupPath = path.join(root, BACKUP_DIR, backupFilename);
  const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(backupPath));
  const content = Buffer.from(bytes).toString('utf8');

  // Mevcut KAIROS.md'yi yedekle
  try {
    await yedekOlustur();
  } catch {
    // Mevcut dosya yoksa sorun degil
  }

  suppressNextFileChange();
  await writeFile('KAIROS.md', content);
}
