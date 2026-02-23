import { readFile } from '../_core/db';

// Belirtilen dosyayi yukler (varsayilan: PRD.md)
export async function execute(filename: string = 'PRD.md'): Promise<{ lines: string[]; total: number }> {
  const content = await readFile(filename);
  const lines = content.split('\n');
  return { lines, total: lines.length };
}
