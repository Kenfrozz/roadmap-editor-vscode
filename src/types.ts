export type ColumnType = 'status' | 'text' | 'date';

export interface ColumnConfig {
  key: string;
  label: string;
  type: ColumnType;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'ozellik', label: 'Özellik', type: 'text' },
  { key: 'prd', label: 'PRD', type: 'text' },
  { key: 'backend', label: 'Backend', type: 'status' },
  { key: 'frontend', label: 'Frontend', type: 'status' },
  { key: 'test', label: 'Test', type: 'status' },
  { key: 'tarih', label: 'Tarih', type: 'date' },
  { key: 'not', label: 'Not', type: 'text' },
];

export interface TerminalOption {
  id: string;
  name: string;
  path: string;
  args?: string[];
}

export interface ClaudeConfig {
  mainCommand: string;
  featureCommand: string;
}

export interface SettingsConfig {
  version: 1;
  terminal: { defaultTerminalId: string | null; availableTerminals: TerminalOption[] };
  claude: ClaudeConfig;
  roadmap: { columns: ColumnConfig[] };
}

export const DEFAULT_SETTINGS: SettingsConfig = {
  version: 1,
  terminal: { defaultTerminalId: null, availableTerminals: [] },
  claude: {
    mainCommand: 'claude --dangerously-skip-permissions',
    featureCommand: 'claude "${ozellik}"',
  },
  roadmap: { columns: [...DEFAULT_COLUMNS] },
};

export interface RoadmapItem {
  id: string;
  [columnKey: string]: string;
}

export interface FazConfig {
  name: string;
  color: string;
  bg: string;
  text: string;
  dim: string;
  tag: string;
}

export interface FazData {
  [fazKey: string]: RoadmapItem[];
}

export interface ParseResult {
  data: FazData;
  fazNames: Record<string, string>;
  fazOrder: string[];
}

export interface SavePayload {
  [fazKey: string]: RoadmapItem[] | Record<string, FazConfig> | string[] | undefined;
  _fazConfig?: Record<string, FazConfig>;
  _fazOrder?: string[];
}

export interface BackupEntry {
  filename: string;
  timestamp: number;
  size: number;
}

export interface GitDurum {
  branch: string;
  changedCount: number;
  ahead: number;
  behind: number;
  hasRemote: boolean;
  isRepo: boolean;
}

export interface GitDegisiklik {
  dosya: string;
  durum: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

// Webview -> Extension mesajlari
export type WebviewMessage =
  | { command: 'load' }
  | { command: 'save'; data: SavePayload }
  | { command: 'createRoadmap' }
  | { command: 'createRoadmapWithSettings'; settings: SettingsConfig }
  | { command: 'resetRoadmap' }
  | { command: 'listBackups' }
  | { command: 'restoreBackup'; filename: string }
  | { command: 'prdLoad' }
  | { command: 'prdLines'; start: number; end: number }
  | { command: 'prdUpdate'; start: number; end: number; content: string }
  | { command: 'savePdf'; base64: string; filename: string }
  | { command: 'runTerminal'; cmd: string; name?: string }
  | { command: 'loadSettings' }
  | { command: 'saveSettings'; settings: SettingsConfig }
  | { command: 'detectTerminals' }
  | { command: 'gitDurum' }
  | { command: 'gitDegisiklikler' }
  | { command: 'gitKaydet'; mesaj: string }
  | { command: 'gitPaylas' }
  | { command: 'gitGuncelle' };

// Extension -> Webview mesajlari
export type ExtensionMessage =
  | { command: 'loadResponse'; data: Record<string, unknown> }
  | { command: 'saveResponse'; success: boolean; error?: string }
  | { command: 'createRoadmapResponse'; success: boolean; error?: string }
  | { command: 'createRoadmapWithSettingsResponse'; success: boolean; error?: string }
  | { command: 'resetRoadmapResponse'; success: boolean; error?: string }
  | { command: 'listBackupsResponse'; backups: BackupEntry[] }
  | { command: 'restoreBackupResponse'; success: boolean; error?: string }
  | { command: 'prdLoadResponse'; data: { lines: string[]; total: number } }
  | { command: 'prdLinesResponse'; data: { excerpt: string; start: number; end: number } }
  | { command: 'prdUpdateResponse'; success: boolean; error?: string }
  | { command: 'fileChanged' }
  | { command: 'loadSettingsResponse'; settings: SettingsConfig }
  | { command: 'saveSettingsResponse'; success: boolean; error?: string }
  | { command: 'detectTerminalsResponse'; terminals: TerminalOption[] }
  | { command: 'gitDurumResponse'; durum: GitDurum }
  | { command: 'gitDegisikliklerResponse'; dosyalar: GitDegisiklik[] }
  | { command: 'gitKaydetResponse'; success: boolean; error?: string }
  | { command: 'gitPaylasResponse'; success: boolean; error?: string }
  | { command: 'gitGuncelleResponse'; success: boolean; error?: string };
