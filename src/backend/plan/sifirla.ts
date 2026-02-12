import { writeFile, readFile } from '../_core/db';
import { execute as yedekOlustur } from '../yedek/olustur';
import { execute as uret } from './uret';
import { execute as parsele } from './parsele';
import { execute as ayarYukle } from '../ayarlar/yukle';

// Mevcut KAIROS.md'yi yedekler ve bos bir roadmap olusturur
export async function execute(): Promise<Record<string, unknown>> {
  await yedekOlustur();

  const settings = ayarYukle();
  const columns = settings.roadmap.columns;
  const defaultData = { faz1: [], faz2: [], faz3: [], faz4: [] };
  const md = uret(defaultData, undefined, columns);
  await writeFile('KAIROS.md', md);

  const content = await readFile('KAIROS.md');
  const { data, fazNames, changelog, fazOrder } = parsele(content, columns);
  return { ...data, _fazNames: fazNames, _changelog: changelog, _fazOrder: fazOrder, _columns: columns };
}
