import * as path from 'path';
import { readFile, ensureDir, writeFile, getRoot } from '../_core/db';

const BACKUP_DIR = '.roadmap-backups';

// Mevcut ROADMAP.md dosyasini yedekler
export async function execute(): Promise<string> {
  const root = getRoot();
  const content = await readFile('ROADMAP.md');
  const timestamp = Date.now();
  const backupFilename = `ROADMAP.md.backup-${timestamp}`;
  const backupDir = path.join(root, BACKUP_DIR);

  await ensureDir(backupDir);

  const backupPath = path.join(backupDir, backupFilename);
  const bytes = Buffer.from(content, 'utf8');
  const vscode = require('vscode');
  await vscode.workspace.fs.writeFile(vscode.Uri.file(backupPath), bytes);

  return backupFilename;
}
