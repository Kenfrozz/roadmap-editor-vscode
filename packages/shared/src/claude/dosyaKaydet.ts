import { writeFile } from '../_core/db';

// Workspace kokune CLAUDE.md veya ARCHITECTURE.md gibi dosyalari yazar
export async function execute(filename: string, content: string): Promise<void> {
  await writeFile(filename, content);
}
