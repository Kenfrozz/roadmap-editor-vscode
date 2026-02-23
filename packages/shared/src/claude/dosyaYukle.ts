import { readFile, fileExists } from '../_core/db';

// Workspace kokunden CLAUDE.md veya ARCHITECTURE.md gibi dosyalari okur
// Dosya yoksa null doner
export async function execute(filename: string): Promise<{ content: string; lines: string[]; total: number } | null> {
  const exists = await fileExists(filename);
  if (!exists) return null;
  const content = await readFile(filename);
  const lines = content.split('\n');
  return { content, lines, total: lines.length };
}
