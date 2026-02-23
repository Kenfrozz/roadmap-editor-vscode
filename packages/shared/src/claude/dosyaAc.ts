import * as path from 'path';
import { getDosyaAciciSaglayici } from '../platform';
import { getRoot } from '../_core/db';

// Dosyayi editorde acar
export async function execute(filename: string): Promise<void> {
  const root = getRoot();
  const fullPath = path.join(root, filename);
  const dosyaAciciSaglayici = getDosyaAciciSaglayici();
  await dosyaAciciSaglayici.dosyaAc(fullPath);
}
