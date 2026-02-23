import { WebviewMessage, SettingsConfig, MesajGonderilebilir, KairosHost } from '../types';
import { getRoot } from '../_core/db';
import { execute as pdfOlustur } from '../pdf/olustur';

// KairosHost — platform tarafindan set edilir
let _host: KairosHost | null = null;
export function setHost(h: KairosHost): void { _host = h; }
export function getHost(): KairosHost {
  if (!_host) throw new Error('KairosHost ayarlanmadi — setHost() cagirin');
  return _host;
}

// Backend modulleri
import { execute as planYukle } from '../plan/yukle';
import { execute as planKaydet } from '../plan/kaydet';
import { execute as planOlustur } from '../plan/olustur';
import { execute as planOlusturAyarli } from '../plan/olusturAyarli';
import { execute as planSifirla } from '../plan/sifirla';
import { execute as yedekListele } from '../yedek/listele';
import { execute as yedekGeriYukle } from '../yedek/geriYukle';
import { execute as prdYukle } from '../prd/yukle';
import { execute as prdSatirOku } from '../prd/satirOku';
import { execute as prdGuncelle } from '../prd/guncelle';
import { execute as dosyaSec } from '../prd/dosyaSec';
import { execute as ayarYukle } from '../ayarlar/yukle';
import { execute as ayarKaydet } from '../ayarlar/kaydet';
import { execute as terminalCalistir } from '../terminal/calistir';
import { execute as terminalAlgila } from '../terminal/algila';
import { execute as gitDurum } from '../git/durum';
import { execute as gitDegisiklikler } from '../git/degisiklikler';
import { execute as gitKaydet } from '../git/kaydet';
import { execute as gitPaylas } from '../git/paylas';
import { execute as gitGuncelle } from '../git/guncelle';
import { execute as claudeDosyaYukle } from '../claude/dosyaYukle';
import { execute as claudeDosyaKaydet } from '../claude/dosyaKaydet';
import { execute as claudePluginKur } from '../claude/pluginKur';
import { execute as claudeDosyaAc } from '../claude/dosyaAc';
import { execute as claudeDosyaEkle } from '../claude/dosyaEkle';
import { execute as pluginDurumYukle } from '../claude/pluginDurumYukle';
import { execute as pluginKomutKaydet } from '../claude/pluginKomutKaydet';
import { execute as pluginKomutSil } from '../claude/pluginKomutSil';
import { execute as pluginYapilandirmaKaydet } from '../claude/pluginYapilandirmaKaydet';
import { execute as kokpitBaslat } from '../kokpit/baslat';
import { execute as kokpitDurdur } from '../kokpit/durdur';
import { execute as kokpitAtla } from '../kokpit/atla';
import { execute as kokpitDurumAl } from '../kokpit/durumAl';
import { execute as sunucuBaslat } from '../sunucu/baslat';
import { execute as sunucuDurdur } from '../sunucu/durdur';
import { execute as sunucuDurumAl } from '../sunucu/durumAl';
import { execute as logoTara } from '../proje/logoTara';

// Frontend icin TEK giris noktasi
// Tum webview mesajlarini ilgili backend modulune yonlendirir
export async function handleMessage(
  webview: MesajGonderilebilir,
  message: WebviewMessage
): Promise<unknown> {
  const host = getHost();

  switch (message.command) {
    case 'load': {
      try {
        const result = await planYukle();
        const projectName = host.getProjectName();
        const version = host.getVersion();
        let projectPath = '';
        try { projectPath = getRoot(); } catch { /* henuz set edilmemis */ }
        const data = { ...result.data, _projectName: projectName, _version: version, _projectPath: projectPath };
        webview.postMessage({ command: 'loadResponse', data });
        return data;
      } catch {
        const data = { _notFound: true };
        webview.postMessage({ command: 'loadResponse', data });
        return data;
      }
    }

    case 'save': {
      try {
        await planKaydet(message.data);
        webview.postMessage({ command: 'saveResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'createRoadmap': {
      try {
        const data = await planOlustur();
        webview.postMessage({ command: 'createRoadmapResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'createRoadmapResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'createRoadmapWithSettings': {
      try {
        const data = await planOlusturAyarli(message.settings as SettingsConfig);
        webview.postMessage({ command: 'createRoadmapWithSettingsResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'createRoadmapWithSettingsResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'resetRoadmap': {
      try {
        const data = await planSifirla();
        webview.postMessage({ command: 'resetRoadmapResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'resetRoadmapResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'listBackups': {
      try {
        const backups = await yedekListele();
        webview.postMessage({ command: 'listBackupsResponse', backups });
        return { backups };
      } catch {
        webview.postMessage({ command: 'listBackupsResponse', backups: [] });
        return { backups: [] };
      }
    }

    case 'restoreBackup': {
      try {
        await yedekGeriYukle(message.filename);
        const result = await planYukle();
        webview.postMessage({ command: 'restoreBackupResponse', success: true });
        webview.postMessage({ command: 'loadResponse', data: result.data });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'restoreBackupResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'prdLoad': {
      try {
        const data = await prdYukle(message.filename);
        webview.postMessage({ command: 'prdLoadResponse', data });
        return data;
      } catch {
        const data = { lines: [], total: 0 };
        webview.postMessage({ command: 'prdLoadResponse', data });
        return data;
      }
    }

    case 'prdLines': {
      try {
        const data = await prdSatirOku(message.start, message.end, message.filename, message.hash);
        webview.postMessage({ command: 'prdLinesResponse', data });
        return data;
      } catch {
        const data = { excerpt: '', start: 0, end: 0, hash: '', duzeltildi: false };
        webview.postMessage({ command: 'prdLinesResponse', data });
        return data;
      }
    }

    case 'prdUpdate': {
      try {
        await prdGuncelle(message.start, message.end, message.content, message.filename);
        webview.postMessage({ command: 'prdUpdateResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'prdUpdateResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'dosyaSec': {
      try {
        const result = await dosyaSec();
        webview.postMessage({ command: 'dosyaSecResponse', filename: result?.filename || null });
        return { filename: result?.filename || null };
      } catch {
        webview.postMessage({ command: 'dosyaSecResponse', filename: null });
        return { filename: null };
      }
    }

    case 'runTerminal': {
      terminalCalistir(message.cmd, message.name);
      return { success: true };
    }

    case 'bildirimGoster': {
      host.showNotification(message.mesaj);
      return { success: true };
    }

    case 'pdfOlustur': {
      try {
        const filename = await pdfOlustur(message.payload);
        webview.postMessage({ command: 'pdfOlusturResponse', success: true, filename });
        host.showNotification(`PDF kaydedildi: ${filename}`);
        return { success: true, filename };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'pdfOlusturResponse', success: false, error: msg });
        return { success: false, error: msg };
      }
    }

    case 'loadSettings': {
      try {
        const settings = ayarYukle();
        const terminals = terminalAlgila();
        settings.terminal.availableTerminals = terminals;
        webview.postMessage({ command: 'loadSettingsResponse', settings });
        return { settings };
      } catch {
        const settings = ayarYukle();
        webview.postMessage({ command: 'loadSettingsResponse', settings });
        return { settings };
      }
    }

    case 'saveSettings': {
      try {
        ayarKaydet(message.settings as SettingsConfig);
        webview.postMessage({ command: 'saveSettingsResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveSettingsResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'detectTerminals': {
      const terminals = terminalAlgila();
      webview.postMessage({ command: 'detectTerminalsResponse', terminals });
      return { terminals };
    }

    case 'gitDurum': {
      const durum = gitDurum();
      webview.postMessage({ command: 'gitDurumResponse', durum });
      return { durum };
    }

    case 'gitDegisiklikler': {
      const dosyalar = gitDegisiklikler();
      webview.postMessage({ command: 'gitDegisikliklerResponse', dosyalar });
      return { dosyalar };
    }

    case 'gitKaydet': {
      try {
        await gitKaydet(message.mesaj);
        webview.postMessage({ command: 'gitKaydetResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'gitKaydetResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'gitPaylas': {
      try {
        await gitPaylas();
        webview.postMessage({ command: 'gitPaylasResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'gitPaylasResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'gitGuncelle': {
      try {
        await gitGuncelle();
        webview.postMessage({ command: 'gitGuncelleResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'gitGuncelleResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'claudeDosyaYukle': {
      try {
        const data = await claudeDosyaYukle(message.filename);
        webview.postMessage({ command: 'claudeDosyaYukleResponse', data });
        return data;
      } catch {
        webview.postMessage({ command: 'claudeDosyaYukleResponse', data: null });
        return null;
      }
    }

    case 'claudeDosyaKaydet': {
      try {
        await claudeDosyaKaydet(message.filename, message.content);
        webview.postMessage({ command: 'claudeDosyaKaydetResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'claudeDosyaKaydetResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'claudePluginKur': {
      try {
        const result = await claudePluginKur();
        webview.postMessage({ command: 'claudePluginKurResponse', success: true, created: result.created });
        return { success: true, created: result.created };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'claudePluginKurResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'claudeDosyaAc': {
      try {
        await claudeDosyaAc(message.filename);
        webview.postMessage({ command: 'claudeDosyaAcResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'claudeDosyaAcResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'claudeDosyaEkle': {
      try {
        const result = await claudeDosyaEkle();
        webview.postMessage({ command: 'claudeDosyaEkleResponse', filename: result?.filename || null });
        return { filename: result?.filename || null };
      } catch {
        webview.postMessage({ command: 'claudeDosyaEkleResponse', filename: null });
        return { filename: null };
      }
    }

    case 'pluginDurumYukle': {
      try {
        const durum = await pluginDurumYukle();
        webview.postMessage({ command: 'pluginDurumYukleResponse', durum });
        return { durum };
      } catch {
        const durum = { installed: false, pluginJson: null, marketplaceJson: null, komutlar: [] };
        webview.postMessage({ command: 'pluginDurumYukleResponse', durum });
        return { durum };
      }
    }

    case 'pluginKomutKaydet': {
      try {
        await pluginKomutKaydet(message.name, message.content);
        webview.postMessage({ command: 'pluginKomutKaydetResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'pluginKomutKaydetResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'pluginKomutSil': {
      try {
        await pluginKomutSil(message.name);
        webview.postMessage({ command: 'pluginKomutSilResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'pluginKomutSilResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'pluginYapilandirmaKaydet': {
      try {
        await pluginYapilandirmaKaydet(message.pluginJson, message.marketplaceJson);
        webview.postMessage({ command: 'pluginYapilandirmaKaydetResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'pluginYapilandirmaKaydetResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'kokpitBaslat': {
      try {
        await kokpitBaslat(message.kuyruk);
        webview.postMessage({ command: 'kokpitBaslatResponse', success: true });
        return { success: true };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'kokpitBaslatResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'kokpitDurdur': {
      try {
        await kokpitDurdur();
        webview.postMessage({ command: 'kokpitDurdurResponse', success: true });
        return { success: true };
      } catch {
        webview.postMessage({ command: 'kokpitDurdurResponse', success: false });
        return { success: false };
      }
    }

    case 'kokpitAtla': {
      try {
        await kokpitAtla();
        webview.postMessage({ command: 'kokpitAtlaResponse', success: true });
        return { success: true };
      } catch {
        webview.postMessage({ command: 'kokpitAtlaResponse', success: false });
        return { success: false };
      }
    }

    case 'kokpitDurumAl': {
      const durum = kokpitDurumAl();
      webview.postMessage({ command: 'kokpitDurumAlResponse', durum });
      return { durum };
    }

    case 'sunucuBaslat': {
      try {
        const result = await sunucuBaslat({ port: message.port });
        webview.postMessage({ command: 'sunucuBaslatResponse', success: true, ...result });
        return { success: true, ...result };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'sunucuBaslatResponse', success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }

    case 'sunucuDurdur': {
      try {
        await sunucuDurdur();
        webview.postMessage({ command: 'sunucuDurdurResponse', success: true });
        return { success: true };
      } catch {
        webview.postMessage({ command: 'sunucuDurdurResponse', success: false });
        return { success: false };
      }
    }

    case 'sunucuDurumAl': {
      const durum = sunucuDurumAl();
      webview.postMessage({ command: 'sunucuDurumAlResponse', durum });
      return { durum };
    }

    case 'logoTara': {
      try {
        const logo = await logoTara();
        webview.postMessage({ command: 'logoTaraResponse', logo });
        return { logo };
      } catch {
        webview.postMessage({ command: 'logoTaraResponse', logo: null });
        return { logo: null };
      }
    }

  }
}
