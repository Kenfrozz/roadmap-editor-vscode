import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SettingsConfig, DEFAULT_SETTINGS, TerminalOption } from './types';

function getSettingsPath(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return path.join(folders[0].uri.fsPath, '.roadmap-settings.json');
  }
  return undefined;
}

export function settingsFileExists(): boolean {
  const filePath = getSettingsPath();
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

export function loadSettings(): SettingsConfig {
  const filePath = getSettingsPath();
  if (!filePath) return { ...DEFAULT_SETTINGS };
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<SettingsConfig>;
      // Merge with defaults to ensure all fields exist
      return {
        version: 1,
        terminal: {
          defaultTerminalId: parsed.terminal?.defaultTerminalId ?? null,
          availableTerminals: parsed.terminal?.availableTerminals ?? [],
        },
        claude: {
          mainCommand: parsed.claude?.mainCommand ?? DEFAULT_SETTINGS.claude.mainCommand,
          featureCommand: parsed.claude?.featureCommand ?? DEFAULT_SETTINGS.claude.featureCommand,
        },
        roadmap: {
          columns: parsed.roadmap?.columns ?? [...DEFAULT_SETTINGS.roadmap.columns],
        },
      };
    }
  } catch {
    // parse hatasi — varsayilan dondur
  }
  return { ...DEFAULT_SETTINGS, roadmap: { columns: [...DEFAULT_SETTINGS.roadmap.columns] } };
}

export function saveSettings(settings: SettingsConfig): void {
  const filePath = getSettingsPath();
  if (!filePath) throw new Error('Workspace bulunamadi');
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
}

export function detectTerminals(): TerminalOption[] {
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
