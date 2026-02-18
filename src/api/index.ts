import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewMessage, SettingsConfig } from '../types';
import { execute as pdfOlustur } from '../backend/pdf/olustur';

// Backend modulleri
import { execute as planYukle } from '../backend/plan/yukle';
import { execute as planKaydet } from '../backend/plan/kaydet';
import { execute as planOlustur } from '../backend/plan/olustur';
import { execute as planOlusturAyarli } from '../backend/plan/olusturAyarli';
import { execute as planSifirla } from '../backend/plan/sifirla';
import { execute as yedekListele } from '../backend/yedek/listele';
import { execute as yedekGeriYukle } from '../backend/yedek/geriYukle';
import { execute as prdYukle } from '../backend/prd/yukle';
import { execute as prdSatirOku } from '../backend/prd/satirOku';
import { execute as prdGuncelle } from '../backend/prd/guncelle';
import { execute as dosyaSec } from '../backend/prd/dosyaSec';
import { execute as ayarYukle } from '../backend/ayarlar/yukle';
import { execute as ayarKaydet } from '../backend/ayarlar/kaydet';
import { execute as terminalCalistir } from '../backend/terminal/calistir';
import { execute as terminalAlgila } from '../backend/terminal/algila';
import { execute as gitDurum } from '../backend/git/durum';
import { execute as gitDegisiklikler } from '../backend/git/degisiklikler';
import { execute as gitKaydet } from '../backend/git/kaydet';
import { execute as gitPaylas } from '../backend/git/paylas';
import { execute as gitGuncelle } from '../backend/git/guncelle';
// Frontend icin TEK giris noktasi
// Tum webview mesajlarini ilgili backend modulune yonlendirir
export async function handleMessage(
  webview: vscode.Webview,
  message: WebviewMessage
): Promise<void> {
  switch (message.command) {
    case 'load': {
      try {
        const result = await planYukle();
        const folders = vscode.workspace.workspaceFolders;
        const projectName = folders ? path.basename(folders[0].uri.fsPath) : 'Proje';
        const version = vscode.extensions.getExtension('Kenfrozz.kairos')?.packageJSON?.version || '1.0.0';
        webview.postMessage({ command: 'loadResponse', data: { ...result.data, _projectName: projectName, _version: version } });
      } catch {
        webview.postMessage({ command: 'loadResponse', data: { _notFound: true } });
      }
      break;
    }

    case 'save': {
      try {
        await planKaydet(message.data);
        webview.postMessage({ command: 'saveResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'createRoadmap': {
      try {
        const data = await planOlustur();
        webview.postMessage({ command: 'createRoadmapResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'createRoadmapResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'createRoadmapWithSettings': {
      try {
        const data = await planOlusturAyarli(message.settings as SettingsConfig);
        webview.postMessage({ command: 'createRoadmapWithSettingsResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'createRoadmapWithSettingsResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'resetRoadmap': {
      try {
        const data = await planSifirla();
        webview.postMessage({ command: 'resetRoadmapResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'resetRoadmapResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'listBackups': {
      try {
        const backups = await yedekListele();
        webview.postMessage({ command: 'listBackupsResponse', backups });
      } catch {
        webview.postMessage({ command: 'listBackupsResponse', backups: [] });
      }
      break;
    }

    case 'restoreBackup': {
      try {
        await yedekGeriYukle(message.filename);
        const result = await planYukle();
        webview.postMessage({ command: 'restoreBackupResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data: result.data });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'restoreBackupResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'prdLoad': {
      try {
        const data = await prdYukle(message.filename);
        webview.postMessage({ command: 'prdLoadResponse', data });
      } catch {
        webview.postMessage({ command: 'prdLoadResponse', data: { lines: [], total: 0 } });
      }
      break;
    }

    case 'prdLines': {
      try {
        const data = await prdSatirOku(message.start, message.end, message.filename);
        webview.postMessage({ command: 'prdLinesResponse', data });
      } catch {
        webview.postMessage({ command: 'prdLinesResponse', data: { excerpt: '', start: 0, end: 0 } });
      }
      break;
    }

    case 'prdUpdate': {
      try {
        await prdGuncelle(message.start, message.end, message.content, message.filename);
        webview.postMessage({ command: 'prdUpdateResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'prdUpdateResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'dosyaSec': {
      try {
        const result = await dosyaSec();
        webview.postMessage({ command: 'dosyaSecResponse', filename: result?.filename || null });
      } catch {
        webview.postMessage({ command: 'dosyaSecResponse', filename: null });
      }
      break;
    }

    case 'runTerminal': {
      terminalCalistir(message.cmd, message.name);
      break;
    }

    case 'bildirimGoster': {
      vscode.window.showInformationMessage(message.mesaj);
      break;
    }

    case 'pdfOlustur': {
      try {
        const filename = await pdfOlustur(message.payload);
        webview.postMessage({ command: 'pdfOlusturResponse', success: true, filename });
        vscode.window.showInformationMessage(`PDF kaydedildi: ${filename}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'pdfOlusturResponse', success: false, error: msg });
      }
      break;
    }

    case 'loadSettings': {
      try {
        const settings = ayarYukle();
        const terminals = terminalAlgila();
        settings.terminal.availableTerminals = terminals;
        webview.postMessage({ command: 'loadSettingsResponse', settings });
      } catch {
        const settings = ayarYukle();
        webview.postMessage({ command: 'loadSettingsResponse', settings });
      }
      break;
    }

    case 'saveSettings': {
      try {
        ayarKaydet(message.settings as SettingsConfig);
        webview.postMessage({ command: 'saveSettingsResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveSettingsResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'detectTerminals': {
      const terminals = terminalAlgila();
      webview.postMessage({ command: 'detectTerminalsResponse', terminals });
      break;
    }

    case 'gitDurum': {
      const durum = gitDurum();
      webview.postMessage({ command: 'gitDurumResponse', durum });
      break;
    }

    case 'gitDegisiklikler': {
      const dosyalar = gitDegisiklikler();
      webview.postMessage({ command: 'gitDegisikliklerResponse', dosyalar });
      break;
    }

    case 'gitKaydet': {
      try {
        await gitKaydet(message.mesaj);
        webview.postMessage({ command: 'gitKaydetResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'gitKaydetResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'gitPaylas': {
      try {
        await gitPaylas();
        webview.postMessage({ command: 'gitPaylasResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'gitPaylasResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'gitGuncelle': {
      try {
        await gitGuncelle();
        webview.postMessage({ command: 'gitGuncelleResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'gitGuncelleResponse', success: false, error: errorMessage });
      }
      break;
    }

  }
}
