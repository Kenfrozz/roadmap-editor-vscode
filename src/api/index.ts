import * as vscode from 'vscode';
import { WebviewMessage, SettingsConfig } from '../types';

// Backend modulleri
import { execute as roadmapYukle } from '../backend/roadmap/yukle';
import { execute as roadmapKaydet } from '../backend/roadmap/kaydet';
import { execute as roadmapOlustur } from '../backend/roadmap/olustur';
import { execute as roadmapOlusturAyarli } from '../backend/roadmap/olusturAyarli';
import { execute as roadmapSifirla } from '../backend/roadmap/sifirla';
import { execute as yedekListele } from '../backend/yedek/listele';
import { execute as yedekGeriYukle } from '../backend/yedek/geriYukle';
import { execute as prdYukle } from '../backend/prd/yukle';
import { execute as prdSatirOku } from '../backend/prd/satirOku';
import { execute as prdGuncelle } from '../backend/prd/guncelle';
import { execute as ayarYukle } from '../backend/ayarlar/yukle';
import { execute as ayarKaydet } from '../backend/ayarlar/kaydet';
import { execute as terminalCalistir } from '../backend/terminal/calistir';
import { execute as terminalAlgila } from '../backend/terminal/algila';

// Frontend icin TEK giris noktasi
// Tum webview mesajlarini ilgili backend modulune yonlendirir
export async function handleMessage(
  webview: vscode.Webview,
  message: WebviewMessage
): Promise<void> {
  switch (message.command) {
    case 'load': {
      try {
        const result = await roadmapYukle();
        webview.postMessage({ command: 'loadResponse', data: result.data });
      } catch {
        webview.postMessage({ command: 'loadResponse', data: { _notFound: true } });
      }
      break;
    }

    case 'save': {
      try {
        await roadmapKaydet(message.data);
        webview.postMessage({ command: 'saveResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'createRoadmap': {
      try {
        const data = await roadmapOlustur();
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
        const data = await roadmapOlusturAyarli(message.settings as SettingsConfig);
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
        const data = await roadmapSifirla();
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
        const result = await roadmapYukle();
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
        const data = await prdYukle();
        webview.postMessage({ command: 'prdLoadResponse', data });
      } catch {
        webview.postMessage({ command: 'prdLoadResponse', data: { lines: [], total: 0 } });
      }
      break;
    }

    case 'prdLines': {
      try {
        const data = await prdSatirOku(message.start, message.end);
        webview.postMessage({ command: 'prdLinesResponse', data });
      } catch {
        webview.postMessage({ command: 'prdLinesResponse', data: { excerpt: '', start: 0, end: 0 } });
      }
      break;
    }

    case 'prdUpdate': {
      try {
        await prdGuncelle(message.start, message.end, message.content);
        webview.postMessage({ command: 'prdUpdateResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'prdUpdateResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'runTerminal': {
      terminalCalistir(message.cmd, message.name);
      break;
    }

    case 'savePdf': {
      try {
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(message.filename),
          filters: { 'PDF': ['pdf'] },
        });
        if (uri) {
          const buffer = Buffer.from(message.base64, 'base64');
          await vscode.workspace.fs.writeFile(uri, buffer);
          vscode.window.showInformationMessage('PDF kaydedildi.');
        }
        webview.postMessage({ command: 'savePdfResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'savePdfResponse', success: false, error: errorMessage });
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
  }
}
