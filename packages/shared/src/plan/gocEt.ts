import { readFile, writeFile } from '../_core/db';
import { execute as parsele } from './parsele';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { KairosData } from '../types';

// KAIROS.md → data.json tek seferlik otomatik goc
export async function execute(): Promise<KairosData> {
  const settings = ayarYukle();
  const columns = settings.roadmap.columns;
  const content = await readFile('kairos/KAIROS.md');
  const { data, fazNames, fazOrder } = parsele(content, columns);

  const jsonData: KairosData = {
    version: 2,
    fazOrder,
    fazNames,
    fazlar: data,
  };

  await writeFile('kairos/data.json', JSON.stringify(jsonData, null, 2));
  return jsonData;
}
