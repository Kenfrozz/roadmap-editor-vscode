import * as path from 'path';
import { getDiyalogSaglayici } from '../platform';
import { getRoot } from '../_core/db';

// Dosya secici dialog acar, workspace-relative yol doner
export async function execute(): Promise<{ filename: string } | null> {
  const root = getRoot();
  const diyalogSaglayici = getDiyalogSaglayici();

  const selectedPath = await diyalogSaglayici.dosyaSec({
    openLabel: 'Dosya Ekle',
    defaultPath: root,
  });

  if (!selectedPath) return null;

  const relativePath = path.relative(root, selectedPath).replace(/\\/g, '/');
  return { filename: relativePath };
}
