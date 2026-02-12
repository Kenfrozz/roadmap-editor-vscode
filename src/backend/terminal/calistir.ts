import * as vscode from 'vscode';
import { execute as ayarYukle } from '../ayarlar/yukle';

// VS Code terminalinde komut calistirir
// [cmd] - Calistirilacak komut
// [name] - Terminal adi
export function execute(cmd: string, name?: string): void {
  const termName = name || 'Flutter';
  const settings = ayarYukle();
  const termId = settings.terminal.defaultTerminalId;
  const termOption = termId ? settings.terminal.availableTerminals.find(t => t.id === termId) : null;

  const terminalOpts: vscode.TerminalOptions = { name: termName };
  if (termOption) {
    terminalOpts.shellPath = termOption.path;
    if (termOption.args) terminalOpts.shellArgs = termOption.args;
  }

  const terminal = vscode.window.createTerminal(terminalOpts);
  terminal.show();
  terminal.sendText(cmd);
}
