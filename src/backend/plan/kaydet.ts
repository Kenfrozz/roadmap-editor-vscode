import { writeFile } from '../_core/db';
import { execute as uret } from './uret';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { SavePayload, FazConfig } from '../../types';

// Roadmap verisini KAIROS.md dosyasina kaydeder
// [saveData] - Kaydedilecek faz verileri
export async function execute(saveData: SavePayload): Promise<void> {
  const settings = ayarYukle();
  const columns = settings.roadmap.columns;
  const fazConfig = saveData._fazConfig as Record<string, FazConfig> | undefined;
  const md = uret(saveData, fazConfig, columns);
  await writeFile('KAIROS.md', md);
}
