import { deleteFile } from '../_core/db';

export async function execute(name: string): Promise<void> {
  await deleteFile(`kairos/plugins/kairos/commands/${name}.md`);
}
