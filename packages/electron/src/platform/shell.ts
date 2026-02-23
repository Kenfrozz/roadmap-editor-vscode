import { shell } from 'electron';
import { DosyaAciciSaglayici } from '@kairos/shared';

export function createDosyaAciciSaglayici(): DosyaAciciSaglayici {
  return {
    async dosyaAc(filePath: string) {
      await shell.openPath(filePath);
    },
  };
}
