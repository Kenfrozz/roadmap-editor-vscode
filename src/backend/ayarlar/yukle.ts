import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SettingsConfig, DEFAULT_SETTINGS } from '../../types';

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

// Ayarlari yukler, dosya yoksa varsayilanlari dondurur
export function execute(): SettingsConfig {
  const filePath = getSettingsPath();
  if (!filePath) return { ...DEFAULT_SETTINGS };
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<SettingsConfig>;
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
