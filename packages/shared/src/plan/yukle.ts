import { readFile, writeFile, fileExists } from '../_core/db';
import { execute as gocEt } from './gocEt';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { settingsFileExists } from '../ayarlar/yukle';
import { KairosData } from '../types';

interface YukleResult {
  data: Record<string, unknown>;
  notFound: boolean;
}

function migrateToV2(raw: Record<string, unknown>): KairosData {
  return {
    version: 2,
    fazOrder: (raw.fazOrder as string[]) || [],
    fazNames: (raw.fazNames as Record<string, string>) || {},
    fazlar: (raw.fazlar as Record<string, unknown[]>) || {},
  } as KairosData;
}

// data.json dosyasini yukler (gerekirse KAIROS.md'den otomatik goc yapar)
export async function execute(): Promise<YukleResult> {
  const settings = ayarYukle();
  const columns = settings.roadmap.columns;
  const firstRun = !settingsFileExists();

  let jsonData: KairosData;

  if (await fileExists('kairos/data.json')) {
    const content = await readFile('kairos/data.json');
    const raw = JSON.parse(content);
    if (raw.version === 1) {
      jsonData = migrateToV2(raw);
      await writeFile('kairos/data.json', JSON.stringify(jsonData, null, 2));
    } else {
      jsonData = raw as KairosData;
    }
  } else if (await fileExists('kairos/KAIROS.md')) {
    jsonData = await gocEt();
  } else {
    throw new Error('Veri dosyasi bulunamadi');
  }

  return {
    data: {
      ...jsonData.fazlar,
      _fazNames: jsonData.fazNames,
      _fazOrder: jsonData.fazOrder,
      _columns: columns,
      ...(firstRun ? { _firstRun: true } : {}),
    },
    notFound: false,
  };
}
