import * as chokidar from 'chokidar';
import * as path from 'path';
import { consumeSuppression } from '@kairos/shared';
import { pushToAllWindows } from './ipcHandlers';

let _watcher: chokidar.FSWatcher | null = null;

export function startFileWatcher(projectRoot: string): void {
  stopFileWatcher();

  const dataJsonPath = path.join(projectRoot, 'kairos', 'data.json');

  _watcher = chokidar.watch(dataJsonPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  _watcher.on('change', () => {
    if (consumeSuppression()) return;
    pushToAllWindows({ command: 'fileChanged' });

    // Kokpit dosya degisikligi bildirimi
    try {
      const { KokpitYonetici } = require('@kairos/shared/dist/kokpit/yonetici');
      KokpitYonetici.getInstance().dosyaDegisti();
    } catch {
      // kokpit modulu yuklenemezse sessizce devam et
    }
  });

  _watcher.on('add', () => {
    if (consumeSuppression()) return;
    pushToAllWindows({ command: 'fileChanged' });
  });
}

export function stopFileWatcher(): void {
  if (_watcher) {
    _watcher.close();
    _watcher = null;
  }
}
