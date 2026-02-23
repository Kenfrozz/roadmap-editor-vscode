import * as fs from 'fs';
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

// Proje koku — disaridan set edilir (Electron: dialog, Web: CLI arg)
let _projectRoot: string | undefined;

export function setProjectRoot(root: string): void {
  _projectRoot = root;
}

export function getRoot(): string {
  if (!_projectRoot) throw new Error('Proje koku ayarlanmadi — setProjectRoot() cagirin');
  return _projectRoot;
}

// FileType enum
export const FileType = { File: 1, Directory: 2, SymbolicLink: 64 } as const;

export async function readFile(filename: string): Promise<string> {
  const root = getRoot();
  const filePath = path.join(root, filename);
  return fs.promises.readFile(filePath, 'utf8');
}

export async function writeFile(filename: string, content: string): Promise<void> {
  const root = getRoot();
  if (filename === 'kairos/data.json') {
    suppressNextFileChange();
  }
  const filePath = path.join(root, filename);
  // Dizin yoksa olustur
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, content, 'utf8');
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
  await fs.promises.mkdir(dirPath, { recursive: true });
}

export async function readDir(dirPath: string): Promise<[string, number][]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  return entries.map(e => {
    let type: number = FileType.File;
    if (e.isDirectory()) type = FileType.Directory;
    else if (e.isSymbolicLink()) type = FileType.SymbolicLink;
    return [e.name, type] as [string, number];
  });
}

export async function statFile(filePath: string): Promise<{ mtime: number; size: number }> {
  const stat = await fs.promises.stat(filePath);
  return { mtime: stat.mtimeMs, size: stat.size };
}

export async function writeFileBinary(filename: string, buffer: Buffer): Promise<void> {
  const root = getRoot();
  const filePath = path.join(root, filename);
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
}

export async function deleteFile(filename: string): Promise<void> {
  const root = getRoot();
  const filePath = path.join(root, filename);
  await fs.promises.unlink(filePath);
}

export async function fileExists(filename: string): Promise<boolean> {
  const root = getRoot();
  const filePath = path.join(root, filename);
  try {
    await fs.promises.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
