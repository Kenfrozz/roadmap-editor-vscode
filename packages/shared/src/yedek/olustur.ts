import * as path from 'path';
import { readFile, ensureDir, writeFile, getRoot } from '../_core/db';

const BACKUP_DIR = 'kairos/backups';

// Mevcut data.json dosyasini yedekler
export async function execute(): Promise<string> {
  const root = getRoot();
  const content = await readFile('kairos/data.json');
  const timestamp = Date.now();
  const backupFilename = `data.json.backup-${timestamp}`;
  const backupDir = path.join(root, BACKUP_DIR);

  await ensureDir(backupDir);

  // Yedek dosyasini writeFile ile yaz
  const backupRelativePath = `${BACKUP_DIR}/${backupFilename}`;
  await writeFile(backupRelativePath, content);

  return backupFilename;
}
