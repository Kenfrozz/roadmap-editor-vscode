export type ColumnType = 'status' | 'text' | 'date';

export interface ColumnConfig {
  key: string;
  label: string;
  type: ColumnType;
}

export const LOCKED_COLUMN_KEYS = ['ozellik', 'prd', 'durum', 'tarih'];

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'ozellik', label: 'Özellik', type: 'text' },
  { key: 'prd', label: 'PRD', type: 'text' },
  { key: 'durum', label: 'Durum', type: 'status' },
  { key: 'tarih', label: 'Tarih', type: 'date' },
];

export interface GorevTuru {
  key: string;
  label: string;
  color: string;
  icon?: string;
}

export const DEFAULT_GOREV_TURLERI: GorevTuru[] = [
  { key: 'gelistirme', label: 'Gelistirme', color: 'emerald', icon: 'Code2' },
  { key: 'hata', label: 'Hata', color: 'red', icon: 'Bug' },
  { key: 'iyilestirme', label: 'Iyilestirme', color: 'violet', icon: 'Sparkles' },
  { key: 'arastirma', label: 'Arastirma', color: 'cyan', icon: 'Search' },
  { key: 'tasarim', label: 'Tasarim', color: 'pink', icon: 'Palette' },
  { key: 'test', label: 'Test', color: 'amber', icon: 'FlaskConical' },
  { key: 'diger', label: 'Diger', color: 'slate', icon: 'Circle' },
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
  dosyalar: string[];
}

export interface SettingsConfig {
  version: 1;
  terminal: { defaultTerminalId: string | null; availableTerminals: TerminalOption[] };
  claude: ClaudeConfig;
  roadmap: {
    columns: ColumnConfig[];
    gorevTurleri: GorevTuru[];
  };
}

export const DEFAULT_SETTINGS: SettingsConfig = {
  version: 1,
  terminal: { defaultTerminalId: null, availableTerminals: [] },
  claude: {
    mainCommand: 'claude --dangerously-skip-permissions',
    featureCommand: 'claude "${ozellik}"',
    dosyalar: ['CLAUDE.md', 'ARCHITECTURE.md'],
  },
  roadmap: {
    columns: [...DEFAULT_COLUMNS],
    gorevTurleri: [...DEFAULT_GOREV_TURLERI],
  },
};

export interface RoadmapItem {
  id: string;
  tur?: string;
  children?: RoadmapItem[];
  [columnKey: string]: string | RoadmapItem[] | undefined;
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

export interface KairosData {
  version: number;
  fazOrder: string[];
  fazNames: Record<string, string>;
  fazlar: Record<string, RoadmapItem[]>;
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

export interface PluginKomut {
  name: string;
  description: string;
  argumentHint?: string;
}

export interface PluginYapilandirma {
  name: string;
  description: string;
  version: string;
}

export interface MarketplaceYapilandirma {
  name: string;
  description: string;
}

export interface PluginDurum {
  installed: boolean;
  pluginJson: PluginYapilandirma | null;
  marketplaceJson: MarketplaceYapilandirma | null;
  komutlar: PluginKomut[];
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

export interface PdfExportPayload {
  data: FazData;
  fazConfig: Record<string, FazConfig>;
  fazOrder: string[];
  columns: ColumnConfig[];
  projectName: string;
  projectDate: string;
}

// === Ortak Arayuzler ===
/** handleMessage ve KokpitYonetici icin minimal webview arayuzu */
export interface MesajGonderilebilir {
  postMessage(message: unknown): Promise<boolean>;
}

export interface SunucuDurum {
  aktif: boolean;
  url: string;
  port: number;
  bagliIstemci: number;
}

// === AI Kokpit Tipleri ===
export type KokpitDurum = 'bosta' | 'calisiyor' | 'tamamlandi';

export interface KuyrukGorevi {
  id: string;
  fazKey: string;
  ozellik: string;
  prd?: string;
  tur?: string;
}

export interface TamamlananGorev {
  id: string;
  fazKey: string;
  ozellik: string;
  basarili: boolean;
}

export interface KokpitDurumBilgi {
  durum: KokpitDurum;
  kuyruk: KuyrukGorevi[];
  aktifGorevIndex: number;
  tamamlananlar: TamamlananGorev[];
  toplam: number;
}

// === KairosHost — platform soyutlama ===
export interface KairosHost {
  getProjectName(): string;
  getVersion(): string;
  showNotification(message: string): void;
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
  | { command: 'prdLoad'; filename?: string }
  | { command: 'prdLines'; start: number; end: number; filename?: string; hash?: string }
  | { command: 'prdUpdate'; start: number; end: number; content: string; filename?: string }
  | { command: 'dosyaSec' }
  | { command: 'pdfOlustur'; payload: PdfExportPayload }
  | { command: 'runTerminal'; cmd: string; name?: string }
  | { command: 'loadSettings' }
  | { command: 'saveSettings'; settings: SettingsConfig }
  | { command: 'detectTerminals' }
  | { command: 'gitDurum' }
  | { command: 'gitDegisiklikler' }
  | { command: 'gitKaydet'; mesaj: string }
  | { command: 'gitPaylas' }
  | { command: 'gitGuncelle' }
  | { command: 'bildirimGoster'; mesaj: string }
  | { command: 'claudeDosyaYukle'; filename: string }
  | { command: 'claudeDosyaKaydet'; filename: string; content: string }
  | { command: 'claudePluginKur' }
  | { command: 'claudeDosyaAc'; filename: string }
  | { command: 'claudeDosyaEkle' }
  | { command: 'pluginDurumYukle' }
  | { command: 'pluginKomutKaydet'; name: string; content: string }
  | { command: 'pluginKomutSil'; name: string }
  | { command: 'pluginYapilandirmaKaydet'; pluginJson: PluginYapilandirma; marketplaceJson: MarketplaceYapilandirma }
  | { command: 'kokpitBaslat'; kuyruk: KuyrukGorevi[] }
  | { command: 'kokpitDurdur' }
  | { command: 'kokpitAtla' }
  | { command: 'kokpitDurumAl' }
  | { command: 'sunucuBaslat'; port?: number }
  | { command: 'sunucuDurdur' }
  | { command: 'sunucuDurumAl' }
  | { command: 'logoTara' };

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
  | { command: 'prdLinesResponse'; data: { excerpt: string; start: number; end: number; hash: string; duzeltildi: boolean } }
  | { command: 'prdUpdateResponse'; success: boolean; error?: string }
  | { command: 'dosyaSecResponse'; filename: string | null }
  | { command: 'fileChanged' }
  | { command: 'loadSettingsResponse'; settings: SettingsConfig }
  | { command: 'saveSettingsResponse'; success: boolean; error?: string }
  | { command: 'detectTerminalsResponse'; terminals: TerminalOption[] }
  | { command: 'gitDurumResponse'; durum: GitDurum }
  | { command: 'gitDegisikliklerResponse'; dosyalar: GitDegisiklik[] }
  | { command: 'gitKaydetResponse'; success: boolean; error?: string }
  | { command: 'gitPaylasResponse'; success: boolean; error?: string }
  | { command: 'gitGuncelleResponse'; success: boolean; error?: string }
  | { command: 'pdfOlusturResponse'; success: boolean; filename?: string; error?: string }
  | { command: 'claudeDosyaYukleResponse'; data: { content: string; lines: string[]; total: number } | null }
  | { command: 'claudeDosyaKaydetResponse'; success: boolean; error?: string }
  | { command: 'claudePluginKurResponse'; success: boolean; created?: string[]; error?: string }
  | { command: 'claudeDosyaAcResponse'; success: boolean; error?: string }
  | { command: 'claudeDosyaEkleResponse'; filename: string | null }
  | { command: 'pluginDurumYukleResponse'; durum: PluginDurum }
  | { command: 'pluginKomutKaydetResponse'; success: boolean; error?: string }
  | { command: 'pluginKomutSilResponse'; success: boolean; error?: string }
  | { command: 'pluginYapilandirmaKaydetResponse'; success: boolean; error?: string }
  | { command: 'kokpitBaslatResponse'; success: boolean; error?: string }
  | { command: 'kokpitDurdurResponse'; success: boolean }
  | { command: 'kokpitAtlaResponse'; success: boolean }
  | { command: 'kokpitDurumAlResponse'; durum: KokpitDurumBilgi }
  | { command: 'kokpitDurumDegisti'; durum: KokpitDurumBilgi }
  | { command: 'kokpitGorevTamamlandi'; gorevId: string; fazKey: string; basarili: boolean }
  | { command: 'sunucuBaslatResponse'; success: boolean; url?: string; port?: number; ip?: string; error?: string }
  | { command: 'sunucuDurdurResponse'; success: boolean }
  | { command: 'sunucuDurumAlResponse'; durum: SunucuDurum }
  | { command: 'logoTaraResponse'; logo: string | null };
