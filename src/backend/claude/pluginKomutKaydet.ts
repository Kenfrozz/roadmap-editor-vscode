import { writeFile, ensureDir, getRoot } from '../_core/db';
import * as path from 'path';

export async function execute(name: string, content: string): Promise<void> {
  const root = getRoot();
  await ensureDir(path.join(root, 'kairos', 'plugins', 'kairos', 'commands'));
  await writeFile(`kairos/plugins/kairos/commands/${name}.md`, content);
}
