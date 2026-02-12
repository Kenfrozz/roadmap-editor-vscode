import * as fs from 'fs';
import { TerminalOption } from '../../types';

// Sistemde kurulu terminalleri tespit eder
export function execute(): TerminalOption[] {
  const terminals: TerminalOption[] = [];

  const candidates: Array<{ id: string; name: string; paths: string[]; args?: string[] }> = [
    {
      id: 'cmd',
      name: 'Command Prompt',
      paths: ['C:\\Windows\\System32\\cmd.exe'],
    },
    {
      id: 'powershell',
      name: 'Windows PowerShell',
      paths: ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'],
    },
    {
      id: 'pwsh',
      name: 'PowerShell 7',
      paths: [
        'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
        'C:\\Program Files (x86)\\PowerShell\\7\\pwsh.exe',
      ],
    },
    {
      id: 'gitbash',
      name: 'Git Bash',
      paths: [
        'C:\\Program Files\\Git\\bin\\bash.exe',
        'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      ],
      args: ['--login', '-i'],
    },
    {
      id: 'wsl',
      name: 'WSL',
      paths: ['C:\\Windows\\System32\\wsl.exe'],
    },
  ];

  for (const candidate of candidates) {
    for (const p of candidate.paths) {
      if (fs.existsSync(p)) {
        terminals.push({
          id: candidate.id,
          name: candidate.name,
          path: p,
          ...(candidate.args ? { args: candidate.args } : {}),
        });
        break;
      }
    }
  }

  return terminals;
}
