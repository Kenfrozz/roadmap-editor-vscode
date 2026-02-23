import { execSync } from 'child_process';
import { getRoot, readFile } from '../_core/db';
import { getTerminalSaglayici } from '../platform';
import { getHost } from '../api';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { KuyrukGorevi, KokpitDurumBilgi, TamamlananGorev, RoadmapItem, MesajGonderilebilir } from '../types';

export class KokpitYonetici {
  private static _instance: KokpitYonetici;

  private _termId: string | null = null;
  private _durum: 'bosta' | 'calisiyor' | 'tamamlandi' = 'bosta';
  private _kuyruk: KuyrukGorevi[] = [];
  private _aktifGorevIndex: number = -1;
  private _tamamlananlar: TamamlananGorev[] = [];
  private _webviewler: Set<MesajGonderilebilir> = new Set();
  private _dinleyiciTemizle: (() => void) | null = null;

  private constructor() {}

  static getInstance(): KokpitYonetici {
    if (!KokpitYonetici._instance) {
      KokpitYonetici._instance = new KokpitYonetici();
    }
    return KokpitYonetici._instance;
  }

  registerWebview(w: MesajGonderilebilir): void { this._webviewler.add(w); }
  unregisterWebview(w: MesajGonderilebilir): void { this._webviewler.delete(w); }

  async baslat(kuyruk: KuyrukGorevi[]): Promise<void> {
    if (this._durum === 'calisiyor') {
      throw new Error('Zaten bir islem devam ediyor');
    }
    try {
      execSync('claude --version', { stdio: 'pipe', timeout: 5000 });
    } catch {
      throw new Error('Claude CLI bulunamadi. Lutfen "npm install -g @anthropic-ai/claude-code" ile kurun.');
    }
    if (!kuyruk || kuyruk.length === 0) {
      throw new Error('Gorev bulunamadi');
    }

    this._kuyruk = [...kuyruk];
    this._aktifGorevIndex = -1;
    this._tamamlananlar = [];
    this._durum = 'calisiyor';

    // Terminal kapanma dinleyicisi
    if (this._dinleyiciTemizle) this._dinleyiciTemizle();
    const terminalSaglayici = getTerminalSaglayici();
    this._dinleyiciTemizle = terminalSaglayici.onKapandi((closedTermId, exitCode) => {
      if (closedTermId !== this._termId) return;
      this._termId = null;
      if (this._durum !== 'calisiyor') return;

      const gorev = this._kuyruk[this._aktifGorevIndex];
      if (!gorev) return;

      const basarili = exitCode === 0;
      this._tamamlananlar.push({
        id: gorev.id, fazKey: gorev.fazKey, ozellik: gorev.ozellik, basarili,
      });

      const host = getHost();
      host.showNotification(
        `Kairos: ${gorev.ozellik} — ${basarili ? 'tamamlandi' : 'basarisiz'}`
      );
      this.broadcast({
        command: 'kokpitGorevTamamlandi',
        gorevId: gorev.id, fazKey: gorev.fazKey, basarili,
      });
      this.broadcastDurum();
      this.sonrakiGorev();
    });

    this.broadcastDurum();
    this.sonrakiGorev();
  }

  async durdur(): Promise<void> {
    const termId = this._termId;
    this._termId = null; // dinleyicinin ignore etmesi icin once null yap
    if (termId) {
      const terminalSaglayici = getTerminalSaglayici();
      terminalSaglayici.kapat(termId);
    }
    if (this._dinleyiciTemizle) {
      this._dinleyiciTemizle();
      this._dinleyiciTemizle = null;
    }
    this._durum = 'bosta';
    this._kuyruk = [];
    this._aktifGorevIndex = -1;
    this.broadcastDurum();
  }

  async atla(): Promise<void> {
    const termId = this._termId;
    this._termId = null;
    if (termId) {
      const terminalSaglayici = getTerminalSaglayici();
      terminalSaglayici.kapat(termId);
    }

    const aktif = this._kuyruk[this._aktifGorevIndex];
    if (aktif) {
      this._tamamlananlar.push({
        id: aktif.id, fazKey: aktif.fazKey, ozellik: aktif.ozellik, basarili: false,
      });
      this.broadcast({
        command: 'kokpitGorevTamamlandi',
        gorevId: aktif.id, fazKey: aktif.fazKey, basarili: false,
      });
    }
    this.broadcastDurum();
    this.sonrakiGorev();
  }

  durumAl(): KokpitDurumBilgi {
    return {
      durum: this._durum,
      kuyruk: this._kuyruk,
      aktifGorevIndex: this._aktifGorevIndex,
      tamamlananlar: [...this._tamamlananlar],
      toplam: this._kuyruk.length,
    };
  }

  // data.json disaridan degistiginde cagirilir (Claude CLI gorevi tamamlayip dosyayi guncellediginde)
  async dosyaDegisti(): Promise<void> {
    if (this._durum !== 'calisiyor') return;
    const gorev = this._kuyruk[this._aktifGorevIndex];
    if (!gorev) return;

    try {
      const content = await readFile('kairos/data.json');
      const data = JSON.parse(content);
      const fazItems: RoadmapItem[] = data.fazlar?.[gorev.fazKey] || [];
      const item = this.gorevBul(fazItems, gorev.id);
      if (!item) return;

      const settings = ayarYukle();
      const statusKeys = settings.roadmap.columns
        .filter((c: { type: string }) => c.type === 'status')
        .map((c: { key: string }) => c.key);
      if (statusKeys.length === 0) return;

      const allDone = statusKeys.every((k: string) => item[k] === '\u2705');
      if (!allDone) return;

      // Gorev data.json'da tamamlanmis — terminali acik birak, referansi birak ki dinleyici ignore etsin
      this._termId = null;

      this._tamamlananlar.push({
        id: gorev.id, fazKey: gorev.fazKey, ozellik: gorev.ozellik, basarili: true,
      });

      const host = getHost();
      host.showNotification(`Kairos: ${gorev.ozellik} — tamamlandi`);
      this.broadcast({
        command: 'kokpitGorevTamamlandi',
        gorevId: gorev.id, fazKey: gorev.fazKey, basarili: true,
      });
      this.broadcastDurum();
      this.sonrakiGorev();
    } catch {
      // data.json okunamazsa sessizce devam et, terminal kapanma fallback'i calisir
    }
  }

  private gorevBul(items: RoadmapItem[], id: string): RoadmapItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = this.gorevBul(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // === Dahili ===

  private broadcast(msg: object): void {
    for (const w of this._webviewler) {
      try { w.postMessage(msg); } catch { this._webviewler.delete(w); }
    }
  }

  private broadcastDurum(): void {
    this.broadcast({ command: 'kokpitDurumDegisti', durum: this.durumAl() });
  }

  private sonrakiGorev(): void {
    this._aktifGorevIndex++;
    if (this._aktifGorevIndex >= this._kuyruk.length) {
      this._durum = 'tamamlandi';
      if (this._dinleyiciTemizle) {
        this._dinleyiciTemizle();
        this._dinleyiciTemizle = null;
      }
      this.broadcastDurum();
      const host = getHost();
      host.showNotification('Kairos: Tum gorevler tamamlandi!');
      return;
    }
    this.broadcastDurum();
    this.gorevCalistir(this._kuyruk[this._aktifGorevIndex]);
  }

  private gorevCalistir(gorev: KuyrukGorevi): void {
    const prompt = this.promptOlustur(gorev);
    let cwd: string;
    try { cwd = getRoot(); } catch {
      this._durum = 'bosta';
      this.broadcastDurum();
      return;
    }

    // Kullanicinin ayarlardan sectigi terminali kullan
    const settings = ayarYukle();
    const termId = settings.terminal.defaultTerminalId;
    const termOption = termId ? settings.terminal.availableTerminals.find(t => t.id === termId) : null;

    const terminalSaglayici = getTerminalSaglayici();

    const safePrompt = prompt.replace(/"/g, '\\"');
    this._termId = terminalSaglayici.calistir({
      name: `Kairos: ${gorev.ozellik}`,
      cmd: `claude --dangerously-skip-permissions "${safePrompt}"`,
      cwd,
      shellPath: termOption?.path,
    });
  }

  private promptOlustur(gorev: KuyrukGorevi): string {
    let prompt = `/kairos:build ${gorev.ozellik || 'Gorevi tamamla'}`;
    if (gorev.prd) {
      // "5-20" (legacy) → "PRD.md:5-20", "docs/spec.md:10-30" → oldugu gibi
      const prdRef = /^\d/.test(gorev.prd) ? `PRD.md:${gorev.prd}` : gorev.prd;
      prompt += ` | PRD: ${prdRef}`;
    }
    return prompt;
  }
}
