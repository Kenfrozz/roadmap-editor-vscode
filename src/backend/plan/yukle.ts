import { readFile } from '../_core/db';
import { execute as parsele } from './parsele';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { settingsFileExists } from '../ayarlar/yukle';
import { ColumnConfig } from '../../types';

interface YukleResult {
  data: Record<string, unknown>;
  notFound: boolean;
}

// KAIROS.md dosyasini yukler ve parse eder
export async function execute(): Promise<YukleResult> {
  const settings = ayarYukle();
  const columns = settings.roadmap.columns;
  const content = await readFile('kairos/KAIROS.md');
  const { data, fazNames, fazOrder } = parsele(content, columns);
  const firstRun = !settingsFileExists();

  return {
    data: {
      ...data,
      _fazNames: fazNames,
      _fazOrder: fazOrder,
      _columns: columns,
      ...(firstRun ? { _firstRun: true } : {}),
    },
    notFound: false,
  };
}
