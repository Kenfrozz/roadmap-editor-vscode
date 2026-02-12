import * as vscode from 'vscode';
import * as path from 'path';
import { BackupEntry } from './types';

// Save suppression: kendi yazmamizin file watcher'i tetiklemesini engeller
let _suppressNextChange = false;
let _suppressTimer: ReturnType<typeof setTimeout> | null = null;

export function suppressNextFileChange(): void {
  _suppressNextChange = true;
  // 2 saniyelik guvenlik zamanlayicisi — yazma islemi gec kalirsa flag'i temizle
  if (_suppressTimer) clearTimeout(_suppressTimer);
  _suppressTimer = setTimeout(() => { _suppressNextChange = false; }, 2000);
}

export function consumeSuppression(): boolean {
  if (_suppressNextChange) {
    _suppressNextChange = false;
    if (_suppressTimer) { clearTimeout(_suppressTimer); _suppressTimer = null; }
    return true; // suppressed — dosya degisikligini yoksay
  }
  return false; // suppress yok — bildirim gonder
}

function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0].uri.fsPath;
  }
  return undefined;
}

export async function readWorkspaceFile(filename: string): Promise<string> {
  const root = getWorkspaceRoot();
  if (!root) {
    throw new Error('Workspace bulunamadi');
  }
  const filePath = path.join(root, filename);
  const uri = vscode.Uri.file(filePath);
  const bytes = await vscode.workspace.fs.readFile(uri);
  return Buffer.from(bytes).toString('utf8');
}

export async function writeWorkspaceFile(filename: string, content: string): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) {
    throw new Error('Workspace bulunamadi');
  }
  if (filename === 'ROADMAP.md') {
    suppressNextFileChange();
  }
  const filePath = path.join(root, filename);
  const uri = vscode.Uri.file(filePath);
  const bytes = Buffer.from(content, 'utf8');
  await vscode.workspace.fs.writeFile(uri, bytes);
}

export async function readFileLineRange(
  filename: string,
  startLine: number,
  endLine: number
): Promise<{ excerpt: string; start: number; end: number }> {
  const content = await readWorkspaceFile(filename);
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  const excerpt = lines.slice(start, end).join('\n');
  return { excerpt, start: start + 1, end };
}

export async function updateFileLineRange(
  filename: string,
  startLine: number,
  endLine: number,
  newContent: string
): Promise<void> {
  const content = await readWorkspaceFile(filename);
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  const newLines = newContent.split('\n');
  lines.splice(start, end - start, ...newLines);
  await writeWorkspaceFile(filename, lines.join('\n'));
}

const BACKUP_DIR = '.roadmap-backups';

export async function backupRoadmapFile(): Promise<string> {
  const root = getWorkspaceRoot();
  if (!root) throw new Error('Workspace bulunamadi');

  const content = await readWorkspaceFile('ROADMAP.md');
  const timestamp = Date.now();
  const backupFilename = `ROADMAP.md.backup-${timestamp}`;
  const backupDir = path.join(root, BACKUP_DIR);
  const backupPath = path.join(backupDir, backupFilename);

  // Ensure backup directory exists
  await vscode.workspace.fs.createDirectory(vscode.Uri.file(backupDir));
  const bytes = Buffer.from(content, 'utf8');
  await vscode.workspace.fs.writeFile(vscode.Uri.file(backupPath), bytes);

  return backupFilename;
}

export async function listBackupFiles(): Promise<BackupEntry[]> {
  const root = getWorkspaceRoot();
  if (!root) return [];

  const backupDir = path.join(root, BACKUP_DIR);
  const backupUri = vscode.Uri.file(backupDir);

  try {
    const entries = await vscode.workspace.fs.readDirectory(backupUri);
    const backups: BackupEntry[] = [];

    for (const [name, type] of entries) {
      if (type !== vscode.FileType.File || !name.startsWith('ROADMAP.md.backup-')) continue;
      const match = name.match(/backup-(\d+)$/);
      const timestamp = match ? parseInt(match[1], 10) : 0;
      const filePath = path.join(backupDir, name);
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      backups.push({ filename: name, timestamp, size: stat.size });
    }

    // Sort by timestamp descending (newest first)
    backups.sort((a, b) => b.timestamp - a.timestamp);
    return backups;
  } catch {
    return [];
  }
}

export async function restoreBackupFile(backupFilename: string): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) throw new Error('Workspace bulunamadi');

  const backupPath = path.join(root, BACKUP_DIR, backupFilename);
  const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(backupPath));
  const content = Buffer.from(bytes).toString('utf8');

  // Backup current ROADMAP.md before restoring
  try {
    await backupRoadmapFile();
  } catch {
    // If current ROADMAP.md doesn't exist, that's fine
  }

  suppressNextFileChange();
  await writeWorkspaceFile('ROADMAP.md', content);
}
