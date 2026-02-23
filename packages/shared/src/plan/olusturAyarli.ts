import { writeFile } from '../_core/db';
import { execute as ayarKaydet } from '../ayarlar/kaydet';
import { SettingsConfig, KairosData } from '../types';

const DEFAULT_FAZ_NAMES: Record<string, string> = {
  faz1: 'PLANLAMA & ALTYAPI',
  faz2: 'TEMEL GELİŞTİRME',
  faz3: 'İLERİ ÖZELLİKLER',
  faz4: 'TEST & YAYIN',
};

// Ayarlarla birlikte yeni data.json olusturur (ilk kurulum)
export async function execute(settings: SettingsConfig): Promise<Record<string, unknown>> {
  ayarKaydet(settings);
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
