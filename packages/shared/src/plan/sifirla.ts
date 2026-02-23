import { writeFile } from '../_core/db';
import { execute as yedekOlustur } from '../yedek/olustur';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { KairosData } from '../types';

const DEFAULT_FAZ_NAMES: Record<string, string> = {
  faz1: 'PLANLAMA & ALTYAPI',
  faz2: 'TEMEL GELİŞTİRME',
  faz3: 'İLERİ ÖZELLİKLER',
  faz4: 'TEST & YAYIN',
};

// Mevcut veriyi yedekler ve bos bir data.json olusturur
export async function execute(): Promise<Record<string, unknown>> {
  await yedekOlustur();

  const settings = ayarYukle();
  const columns = settings.roadmap.columns;

  const jsonData: KairosData = {
    version: 2,
    fazOrder: ['faz1', 'faz2', 'faz3', 'faz4'],
    fazNames: { ...DEFAULT_FAZ_NAMES },
    fazlar: { faz1: [], faz2: [], faz3: [], faz4: [] },
  };

  await writeFile('kairos/data.json', JSON.stringify(jsonData, null, 2));

  return {
    ...jsonData.fazlar,
    _fazNames: jsonData.fazNames,
    _fazOrder: jsonData.fazOrder,
    _columns: columns,
  };
}
