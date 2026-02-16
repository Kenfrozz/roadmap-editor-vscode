import { writeFile, readFile } from '../_core/db';
import { execute as uret } from './uret';
import { execute as parsele } from './parsele';
import { execute as ayarKaydet } from '../ayarlar/kaydet';
import { SettingsConfig } from '../../types';

// Ayarlarla birlikte yeni KAIROS.md olusturur (ilk kurulum)
// [settings] - Kaydedilecek ayarlar
export async function execute(settings: SettingsConfig): Promise<Record<string, unknown>> {
  ayarKaydet(settings);

  const columns = settings.roadmap.columns;
  const defaultData = { faz1: [], faz2: [], faz3: [], faz4: [] };
  const md = uret(defaultData, undefined, columns);
  await writeFile('KAIROS.md', md);

  const content = await readFile('KAIROS.md');
  const { data, fazNames, fazOrder } = parsele(content, columns);
  return { ...data, _fazNames: fazNames, _fazOrder: fazOrder, _columns: columns };
}
