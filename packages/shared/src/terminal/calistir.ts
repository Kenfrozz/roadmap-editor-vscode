import { getTerminalSaglayici } from '../platform';
import { execute as ayarYukle } from '../ayarlar/yukle';

// Terminalinde komut calistirir
// [cmd] - Calistirilacak komut
// [name] - Terminal adi
export function execute(cmd: string, name?: string): void {
  const termName = name || 'Flutter';
  const settings = ayarYukle();
  const termId = settings.terminal.defaultTerminalId;
  const termOption = termId ? settings.terminal.availableTerminals.find(t => t.id === termId) : null;

  const terminalSaglayici = getTerminalSaglayici();

  terminalSaglayici.calistir({
    name: termName,
    cmd,
    shellPath: termOption?.path,
  });
}
