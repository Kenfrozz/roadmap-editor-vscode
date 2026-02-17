import * as vscode from 'vscode';
import * as path from 'path';
import { getRoot, readDir, statFile } from '../_core/db';
import { BackupEntry } from '../../types';

const BACKUP_DIR = 'kairos/backups';

// Yedek dosyalarini listeler (en yenisi ilk)
export async function execute(): Promise<BackupEntry[]> {
  const root = getRoot();
  const backupDir = path.join(root, BACKUP_DIR);

  try {
    const entries = await readDir(backupDir);
    const backups: BackupEntry[] = [];

    for (const [name, type] of entries) {
      if (type !== vscode.FileType.File || !name.startsWith('KAIROS.md.backup-')) continue;
      const match = name.match(/backup-(\d+)$/);
      const timestamp = match ? parseInt(match[1], 10) : 0;
      const filePath = path.join(backupDir, name);
      const stat = await statFile(filePath);
      backups.push({ filename: name, timestamp, size: stat.size });
    }

    backups.sort((a, b) => b.timestamp - a.timestamp);
    return backups;
  } catch {
    return [];
  }
}
