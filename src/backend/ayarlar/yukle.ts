import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SettingsConfig, DEFAULT_SETTINGS, LOCKED_COLUMN_KEYS, DEFAULT_COLUMNS } from '../../types';

function getSettingsPath(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    return path.join(folders[0].uri.fsPath, 'kairos', 'settings.json');
  }
  return undefined;
}

export function settingsFileExists(): boolean {
  const filePath = getSettingsPath();
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

// Kilitli sutunlarin her zaman mevcut olmasini garantiler
function ensureLockedColumns(columns: typeof DEFAULT_COLUMNS): typeof DEFAULT_COLUMNS {
  const existingKeys = columns.map(c => c.key);
  const missingLocked = DEFAULT_COLUMNS.filter(
    dc => LOCKED_COLUMN_KEYS.includes(dc.key) && !existingKeys.includes(dc.key)
  );
  if (missingLocked.length === 0) return columns;
  // Kilitli sutunlar basta, kullanici sutunlari sonra
  const locked = LOCKED_COLUMN_KEYS
    .map(key => columns.find(c => c.key === key) || missingLocked.find(c => c.key === key))
    .filter(Boolean) as typeof DEFAULT_COLUMNS;
  const custom = columns.filter(c => !LOCKED_COLUMN_KEYS.includes(c.key));
  return [...locked, ...custom];
}

// Ayarlari yukler, dosya yoksa varsayilanlari dondurur
export function execute(): SettingsConfig {
  const filePath = getSettingsPath();
  if (!filePath) return { ...DEFAULT_SETTINGS };
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<SettingsConfig>;
      const rawColumns = parsed.roadmap?.columns ?? [...DEFAULT_SETTINGS.roadmap.columns];
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
          columns: ensureLockedColumns(rawColumns),
          gorevTurleri: parsed.roadmap?.gorevTurleri ?? [...DEFAULT_SETTINGS.roadmap.gorevTurleri],
        },
      };
    }
  } catch {
    // parse hatasi — varsayilan dondur
  }
  return { ...DEFAULT_SETTINGS, roadmap: { ...DEFAULT_SETTINGS.roadmap, columns: [...DEFAULT_SETTINGS.roadmap.columns] } };
}
