import { readFile } from '../_core/db';

// PRD.md dosyasini yukler
export async function execute(): Promise<{ lines: string[]; total: number }> {
  const content = await readFile('PRD.md');
  const lines = content.split('\n');
  return { lines, total: lines.length };
}
