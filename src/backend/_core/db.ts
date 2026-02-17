import * as vscode from 'vscode';
import * as path from 'path';

// Save suppression: kendi yazmamizin file watcher'i tetiklemesini engeller
let _suppressNextChange = false;
let _suppressTimer: ReturnType<typeof setTimeout> | null = null;

export function suppressNextFileChange(): void {
  _suppressNextChange = true;
  if (_suppressTimer) clearTimeout(_suppressTimer);
  _suppressTimer = setTimeout(() => { _suppressNextChange = false; }, 2000);
}

export function consumeSuppression(): boolean {
  if (_suppressNextChange) {
    _suppressNextChange = false;
    if (_suppressTimer) { clearTimeout(_suppressTimer); _suppressTimer = null; }
    return true;
  }
  return false;
}

function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return folders[0].uri.fsPath;
  }
  return undefined;
}

export async function readFile(filename: string): Promise<string> {
  const root = getWorkspaceRoot();
  if (!root) throw new Error('Workspace bulunamadi');
  const filePath = path.join(root, filename);
  const uri = vscode.Uri.file(filePath);
  const bytes = await vscode.workspace.fs.readFile(uri);
  return Buffer.from(bytes).toString('utf8');
}

export async function writeFile(filename: string, content: string): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) throw new Error('Workspace bulunamadi');
  if (filename === 'kairos/KAIROS.md') {
    suppressNextFileChange();
  }
  const filePath = path.join(root, filename);
  const uri = vscode.Uri.file(filePath);
  const bytes = Buffer.from(content, 'utf8');
  await vscode.workspace.fs.writeFile(uri, bytes);
}

export async function readLineRange(
  filename: string,
  startLine: number,
  endLine: number
): Promise<{ excerpt: string; start: number; end: number }> {
  const content = await readFile(filename);
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  const excerpt = lines.slice(start, end).join('\n');
  return { excerpt, start: start + 1, end };
}

export async function updateLineRange(
  filename: string,
  startLine: number,
  endLine: number,
  newContent: string
): Promise<void> {
  const content = await readFile(filename);
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  const newLines = newContent.split('\n');
  lines.splice(start, end - start, ...newLines);
  await writeFile(filename, lines.join('\n'));
}

export async function ensureDir(dirPath: string): Promise<void> {
  await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
}

export async function readDir(dirPath: string): Promise<[string, vscode.FileType][]> {
  return vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
}

export async function statFile(filePath: string): Promise<vscode.FileStat> {
  return vscode.workspace.fs.stat(vscode.Uri.file(filePath));
}

export async function writeFileBinary(filename: string, buffer: Buffer): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) throw new Error('Workspace bulunamadi');
  const filePath = path.join(root, filename);
  const uri = vscode.Uri.file(filePath);
  await vscode.workspace.fs.writeFile(uri, buffer);
}

export function getRoot(): string {
  const root = getWorkspaceRoot();
  if (!root) throw new Error('Workspace bulunamadi');
  return root;
}
