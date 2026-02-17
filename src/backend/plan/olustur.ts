import { writeFile, readFile } from '../_core/db';
import { execute as uret } from './uret';
import { execute as parsele } from './parsele';
import { execute as ayarYukle } from '../ayarlar/yukle';

// Varsayilan bos KAIROS.md dosyasi olusturur
export async function execute(): Promise<Record<string, unknown>> {
  const settings = ayarYukle();
  const columns = settings.roadmap.columns;
  const defaultData = { faz1: [], faz2: [], faz3: [], faz4: [] };
  const md = uret(defaultData, undefined, columns);
  await writeFile('kairos/KAIROS.md', md);

  const content = await readFile('kairos/KAIROS.md');
  const { data, fazNames, fazOrder } = parsele(content, columns);
  return { ...data, _fazNames: fazNames, _fazOrder: fazOrder, _columns: columns };
}
