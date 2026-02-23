import { dialog, BrowserWindow } from 'electron';
import { DiyalogSaglayici, getRoot } from '@kairos/shared';

export function createDiyalogSaglayici(parentWindow: BrowserWindow | null): DiyalogSaglayici {
  return {
    async dosyaSec(options) {
      const filters = options?.filters?.map(f => ({
        name: f.name,
        extensions: f.extensions,
      })) || [];

      let defaultPath: string | undefined;
      try {
        defaultPath = options?.defaultPath || getRoot();
      } catch {
        defaultPath = undefined;
      }

      const result = await dialog.showOpenDialog(parentWindow || BrowserWindow.getFocusedWindow()!, {
        properties: ['openFile'],
        defaultPath,
        filters: filters.length > 0 ? filters : undefined,
        title: options?.openLabel || 'Dosya Sec',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    },
  };
}
