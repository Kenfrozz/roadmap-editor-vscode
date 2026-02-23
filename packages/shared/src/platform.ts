// Platform-agnostic arayuzler
// Electron, Web ve VS Code farkli implementasyonlar saglar

export interface TerminalSaglayici {
  calistir(opts: { name: string; cmd: string; cwd?: string; shellPath?: string }): string;
  kapat(termId: string): void;
  onKapandi(callback: (termId: string, exitCode: number | undefined) => void): () => void;
}

export interface DiyalogSaglayici {
  dosyaSec(options?: {
    filters?: { name: string; extensions: string[] }[];
    openLabel?: string;
    defaultPath?: string;
  }): Promise<string | null>;
}

export interface DosyaAciciSaglayici {
  dosyaAc(filePath: string): Promise<void>;
}

// Platform servisleri — disaridan set edilir
let _terminalSaglayici: TerminalSaglayici | null = null;
let _diyalogSaglayici: DiyalogSaglayici | null = null;
let _dosyaAciciSaglayici: DosyaAciciSaglayici | null = null;

export function setTerminalSaglayici(s: TerminalSaglayici): void { _terminalSaglayici = s; }
export function getTerminalSaglayici(): TerminalSaglayici {
  if (!_terminalSaglayici) throw new Error('TerminalSaglayici ayarlanmadi');
  return _terminalSaglayici;
}

export function setDiyalogSaglayici(s: DiyalogSaglayici): void { _diyalogSaglayici = s; }
export function getDiyalogSaglayici(): DiyalogSaglayici {
  if (!_diyalogSaglayici) throw new Error('DiyalogSaglayici ayarlanmadi');
  return _diyalogSaglayici;
}

export function setDosyaAciciSaglayici(s: DosyaAciciSaglayici): void { _dosyaAciciSaglayici = s; }
export function getDosyaAciciSaglayici(): DosyaAciciSaglayici {
  if (!_dosyaAciciSaglayici) throw new Error('DosyaAciciSaglayici ayarlanmadi');
  return _dosyaAciciSaglayici;
}
