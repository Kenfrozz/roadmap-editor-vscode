# Mimari Dokümantasyonu - Kairos

Bu doküman, Kairos masaüstü uygulamasının mimari yapısını açıklar. Tüm geliştiriciler bu kurallara uymalıdır.

---

## İçindekiler:

1. [Genel Bakış](#genel-bakış)
2. [Monorepo Yapısı](#monorepo-yapısı)
3. [Shared Backend Katmanı](#shared-backend-katmanı)
4. [API Katmanı](#api-katmanı)
5. [Electron Katmanı](#electron-katmanı)
6. [Frontend Katmanı](#frontend-katmanı)
7. [Platform Soyutlama](#platform-soyutlama)
8. [Veri Akışı](#veri-akışı)
9. [Build Sistemi](#build-sistemi)
10. [Yeni Özellik Ekleme](#yeni-özellik-ekleme)
11. [Kurallar ve İlkeler](#kurallar-ve-ilkeler)

---

## Genel Bakış

Proje, **3-Katmanlı Lokal-First Mimari** prensibine dayanan cross-platform bir masaüstü uygulamasıdır. PRD, plan, Git ve AI araçlarını tek arayüzden yönetir. npm workspaces monorepo olarak yapılandırılmıştır. Frontend, backend teknolojilerinden tamamen habersizdir ve tüm işlemlerini Electron IPC üzerinden gerçekleştirir.

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  packages/renderer/ (React 18 + Vite + Tailwind CSS)    │
│  • Backend'den HABERSİZ                                 │
│  • Sadece api.js → bridge.js üzerinden mesaj gönderir   │
└───────────────────────┬─────────────────────────────────┘
                        │ Electron IPC (preload.ts)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 ELECTRON MAIN PROCESS                   │
│  packages/electron/                                     │
│  • BrowserWindow, IPC handlers, file watcher            │
│  • Platform sağlayıcılarını shared'a enjekte eder       │
└───────────────────────┬─────────────────────────────────┘
                        │ import @kairos/shared
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    API KATMANI                           │
│  packages/shared/src/api/index.ts                       │
│  • Mesajları backend modüllerine yönlendirir             │
│  • Frontend için TEK giriş noktası                      │
└───────────────────────┬─────────────────────────────────┘
                        │ import
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   SHARED BACKEND                        │
│  packages/shared/src/                                   │
│  • Her işlem = 1 dosya, 1 execute() fonksiyonu          │
│  • Dosya sistemi = veritabanı (kairos/data.json)        │
│  • Platform-agnostic (Node.js fs)                       │
└─────────────────────────────────────────────────────────┘
```

### Neden Bu Yapı?

| Sorun | Çözüm |
|-------|-------|
| VS Code'a bağımlı monolitik eklenti | Platform-agnostic shared + Electron/Web host |
| Frontend-Backend bağımlılığı | IPC + API katmanı ile izolasyon |
| Tek platform desteği | Shared backend → Electron, Web, Mobile host |
| Yeni özellik eklemek zor | Sadece yeni dosya ekle + API'ye case ekle |

---

## Monorepo Yapısı

```
kairos/
├── packages/
│   ├── shared/                        # @kairos/shared — Platform-agnostic backend + types
│   │   └── src/
│   │       ├── index.ts               # Public API export
│   │       ├── types.ts               # TÜM TypeScript tipleri (tek dosya)
│   │       ├── platform.ts            # Platform arayüzleri
│   │       ├── api/
│   │       │   └── index.ts           # Mesaj router (handleMessage + KairosHost)
│   │       └── _core/
│   │           └── db.ts              # Dosya I/O wrapper
│   │
│   ├── electron/                      # @kairos/electron — Electron main process
│   │   └── src/
│   │       ├── main.ts                # BrowserWindow, app lifecycle, proje yönetimi
│   │       ├── preload.ts             # Context isolation bridge (window.kairos)
│   │       ├── ipcHandlers.ts         # IPC → handleMessage adaptörü
│   │       ├── fileWatcher.ts         # chokidar ile data.json izleme
│   │       └── platform/              # Platform sağlayıcı implementasyonları
│   │           ├── terminal.ts        # TerminalSaglayici
│   │           ├── dialog.ts          # DiyalogSaglayici
│   │           ├── shell.ts           # DosyaAciciSaglayici
│   │           └── notification.ts    # Bildirimler
│   │
│   ├── renderer/                      # @kairos/renderer — React frontend (Vite)
│   │   └── src/
│   │       ├── main.jsx               # React entry point
│   │       ├── App.jsx                # Ana uygulama bileşeni
│   │       ├── api.js                 # API bridge (22+ metod)
│   │       ├── bridge.js              # IPC transport soyutlama
│   │       ├── index.css              # Tailwind CSS giriş dosyası
│   │       ├── lib/                   # Paylaşılan (constants, theme, hooks, utils, statsUtils)
│   │       ├── components/            # UI bileşenleri
│   │       ├── components/ui/         # shadcn/ui primitifleri (DOKUNMA)
│   │       └── pages/                 # Tam sayfa görünümler
│   │
│   └── web-server/                    # @kairos/web-server — Express + WebSocket
│       └── src/
│           └── server.ts              # HTTP + WS sunucu
│
├── kairos/                            # Proje veri dizini
│   └── data.json                      # Plan verisi (version 2, JSON)
│
├── package.json                       # Root: workspaces, scripts, version
├── tsconfig.base.json                 # Paylaşılan TypeScript ayarları
└── electron-builder.yml               # Electron paketleme yapılandırması
```

---

## Shared Backend Katmanı

### `_core/db.ts` - Altyapı

Tüm dosya işlemlerini saran wrapper. Backend modülleri doğrudan `fs` kullanmaz, her zaman `db.ts` üzerinden erişir. Proje kökü dışarıdan `setProjectRoot()` ile ayarlanır.

```typescript
// Dışa açılan fonksiyonlar:
setProjectRoot(root)                       // Proje kökünü ayarla (Electron main.ts'de çağrılır)
getRoot()                                  // Proje kök dizinini döndür

readFile(filename)                         // Proje kökünden dosya oku
writeFile(filename, content)               // Dosya yaz (data.json → auto suppress)
writeFileBinary(filename, buffer)          // Binary dosya yaz (PDF vb.)
deleteFile(filename)                       // Dosya sil
fileExists(filename)                       // Dosya var mı kontrol et

readLineRange(filename, start, end)        // Satır aralığı oku
updateLineRange(filename, start, end, content)  // Satır aralığını güncelle

ensureDir(dirPath)                         // Dizin oluştur (recursive)
readDir(dirPath)                           // Dizin listele
statFile(filePath)                         // Dosya bilgisi (mtime, size)

// FileSystemWatcher suppression mekanizması:
suppressNextFileChange()                   // Kendi yazmamızın watcher'ı tetiklemesini engeller
consumeSuppression()                       // Suppression durumunu tüketir (fileWatcher.ts'de)
```

### Backend Modülleri

Her modül dosyası şu yapıyı takip eder:

```typescript
// packages/shared/src/[modul]/[islem].ts

import { readFile, writeFile, ... } from '../_core/db';

// Ana fonksiyon - her zaman execute() olarak adlandırılır
export async function execute(params): Promise<Result> {
  // 1. db.ts üzerinden dosya oku/yaz
  // 2. Sonucu döndür
}
```

### Mevcut Modüller

| Modül | Dosya | İşlev |
|-------|-------|-------|
| `plan/parsele` | parsele.ts | JSON verisini parse eder |
| `plan/yukle` | yukle.ts | data.json okur + parse eder |
| `plan/kaydet` | kaydet.ts | Veriyi JSON olarak kaydeder |
| `plan/olustur` | olustur.ts | Varsayılan boş plan oluşturur |
| `plan/olusturAyarli` | olusturAyarli.ts | Wizard ayarlarıyla özelleştirilmiş oluşturur |
| `plan/sifirla` | sifirla.ts | Mevcut planı yedekler + yeni boş oluşturur |
| `plan/gocEt` | gocEt.ts | Eski KAIROS.md formatından JSON'a göç |
| `yedek/olustur` | olustur.ts | `.kairos-backups/` dizinine yedek alır |
| `yedek/listele` | listele.ts | Yedekleri timestamp'e göre sıralı listeler |
| `yedek/geriYukle` | geriYukle.ts | Yedekten data.json'ı geri yükler |
| `prd/yukle` | yukle.ts | PRD dosyasını yükler |
| `prd/satirOku` | satirOku.ts | Dosyadan satır aralığı okur |
| `prd/guncelle` | guncelle.ts | Dosyada satır aralığını günceller |
| `prd/dosyaSec` | dosyaSec.ts | Dosya seçici dialog açar |
| `ayarlar/yukle` | yukle.ts | `.kairos-settings.json` yükler |
| `ayarlar/kaydet` | kaydet.ts | Ayarları JSON olarak kaydeder |
| `terminal/calistir` | calistir.ts | Terminalde komut çalıştırır |
| `terminal/algila` | algila.ts | Kurulu terminalleri algılar |
| `git/durum` | durum.ts | Git branch, ahead/behind durumu |
| `git/degisiklikler` | degisiklikler.ts | Değişen dosyaları listeler |
| `git/kaydet` | kaydet.ts | Commit oluşturur |
| `git/paylas` | paylas.ts | Push yapar |
| `git/guncelle` | guncelle.ts | Pull yapar |
| `claude/dosyaYukle` | dosyaYukle.ts | Proje dosyası yükler |
| `claude/dosyaKaydet` | dosyaKaydet.ts | Proje dosyası kaydeder |
| `claude/dosyaAc` | dosyaAc.ts | Dosyayı harici editörde açar |
| `claude/dosyaEkle` | dosyaEkle.ts | Dosya seçici ile dosya ekler |
| `claude/pluginKur` | pluginKur.ts | Claude plugin'i projeye kurar |
| `claude/pluginDurumYukle` | pluginDurumYukle.ts | Plugin kurulum durumunu kontrol eder |
| `claude/pluginKomutKaydet` | pluginKomutKaydet.ts | Plugin komutu kaydeder |
| `claude/pluginKomutSil` | pluginKomutSil.ts | Plugin komutunu siler |
| `claude/pluginYapilandirmaKaydet` | pluginYapilandirmaKaydet.ts | Plugin yapılandırmasını kaydeder |
| `kokpit/baslat` | baslat.ts | AI kokpit kuyruğunu başlatır |
| `kokpit/durdur` | durdur.ts | Kokpiti durdurur |
| `kokpit/atla` | atla.ts | Aktif görevi atlar |
| `kokpit/durumAl` | durumAl.ts | Kokpit durumunu döndürür |
| `kokpit/yonetici` | yonetici.ts | KokpitYonetici singleton |
| `pdf/olustur` | olustur.ts | PDF dosyası oluşturur |
| `sunucu/baslat` | baslat.ts | Web sunucuyu başlatır |
| `sunucu/durdur` | durdur.ts | Web sunucuyu durdurur |
| `sunucu/durumAl` | durumAl.ts | Sunucu durumunu döndürür |

---

## API Katmanı

### `packages/shared/src/api/index.ts` - Mesaj Yönlendirici

Tek dosya. Tüm `WebviewMessage` komutlarını ilgili backend `execute()` fonksiyonuna yönlendirir. `KairosHost` arayüzü üzerinden platform bilgilerine (proje adı, versiyon, bildirim) erişir.

```typescript
import { execute as planYukle } from '../plan/yukle';
// ... diğer importlar

// KairosHost — platform tarafından set edilir
let _host: KairosHost | null = null;
export function setHost(h: KairosHost): void { _host = h; }

export async function handleMessage(
  webview: MesajGonderilebilir,
  message: WebviewMessage
): Promise<unknown> {
  switch (message.command) {
    case 'load': {
      const result = await planYukle();
      webview.postMessage({ command: 'loadResponse', data: result.data });
      return result.data;
    }
    // ... diğer case'ler (40+ komut)
  }
}
```

### Mesaj Akışı

```
WebviewMessage.command          →    Backend execute()
──────────────────────────────────────────────────────
'load'                          →    plan/yukle
'save'                          →    plan/kaydet
'createRoadmap'                 →    plan/olustur
'createRoadmapWithSettings'     →    plan/olusturAyarli
'resetRoadmap'                  →    plan/sifirla
'listBackups'                   →    yedek/listele
'restoreBackup'                 →    yedek/geriYukle
'prdLoad'                       →    prd/yukle
'prdLines'                      →    prd/satirOku
'prdUpdate'                     →    prd/guncelle
'dosyaSec'                      →    prd/dosyaSec
'pdfOlustur'                    →    pdf/olustur
'loadSettings'                  →    ayarlar/yukle + terminal/algila
'saveSettings'                  →    ayarlar/kaydet
'detectTerminals'               →    terminal/algila
'runTerminal'                   →    terminal/calistir
'gitDurum'                      →    git/durum
'gitDegisiklikler'              →    git/degisiklikler
'gitKaydet'                     →    git/kaydet
'gitPaylas'                     →    git/paylas
'gitGuncelle'                   →    git/guncelle
'claudeDosyaYukle'              →    claude/dosyaYukle
'claudeDosyaKaydet'             →    claude/dosyaKaydet
'claudePluginKur'               →    claude/pluginKur
'claudeDosyaAc'                 →    claude/dosyaAc
'claudeDosyaEkle'               →    claude/dosyaEkle
'pluginDurumYukle'              →    claude/pluginDurumYukle
'pluginKomutKaydet'             →    claude/pluginKomutKaydet
'pluginKomutSil'                →    claude/pluginKomutSil
'pluginYapilandirmaKaydet'      →    claude/pluginYapilandirmaKaydet
'kokpitBaslat'                  →    kokpit/baslat
'kokpitDurdur'                  →    kokpit/durdur
'kokpitAtla'                    →    kokpit/atla
'kokpitDurumAl'                 →    kokpit/durumAl
'sunucuBaslat'                  →    sunucu/baslat
'sunucuDurdur'                  →    sunucu/durdur
'sunucuDurumAl'                 →    sunucu/durumAl
```

---

## Electron Katmanı

### `packages/electron/src/main.ts` - Uygulama Girişi

- Frameless `BrowserWindow` oluşturur (özel 24px titlebar)
- Dev modda Vite dev server'dan (`http://localhost:5173`), production'da `renderer/dist/index.html`'den yükler
- Proje seçimi: dialog, son projeler listesi (electron-store), CLI argümanı
- Platform sağlayıcılarını oluşturup shared katmana enjekte eder
- Tek instance kilidi (`requestSingleInstanceLock`)

### `packages/electron/src/preload.ts` - Context Bridge

`contextBridge.exposeInMainWorld('kairos', ...)` ile renderer'a güvenli API sunar:

```typescript
window.kairos = {
  // Ana mesaj kanalı
  sendMessage(msg)           // → ipcRenderer.invoke('kairos:message')
  onPush(callback)           // ← ipcRenderer.on('kairos:push')

  // State (electron-store)
  getState() / setState(s)

  // Tema
  isDarkMode() / onThemeChange(cb)

  // Proje seçimi
  selectProject() / getRecentProjects() / openRecentProject(path) / hasProject()

  // Pencere kontrolleri
  windowMinimize() / windowMaximize() / windowClose() / windowIsMaximized()
  onWindowMaximizeChanged(cb)

  // Platform bilgisi
  platform                   // process.platform
}
```

### `packages/electron/src/ipcHandlers.ts` - IPC Adaptörü

`IpcAdaptor` sınıfı `MesajGonderilebilir` arayüzünü implemente eder. Tüm API çağrıları tek `kairos:message` kanalından geçer:

```typescript
ipcMain.handle('kairos:message', async (_event, msg) => {
  const adaptor = new IpcAdaptor();
  await handleMessage(adaptor, msg);
  return adaptor.getResponse();
});
```

### `packages/electron/src/fileWatcher.ts` - Dosya İzleme

chokidar ile `kairos/data.json` dosyasını izler. Değişiklik algılandığında:
1. `consumeSuppression()` → true ise yoksay (kendi yazmamız tetikledi)
2. false → tüm pencerelere `fileChanged` push mesajı gönder
3. KokpitYonetici'ye dosya değişikliği bildir

---

## Frontend Katmanı

### İletişim Köprüsü: `bridge.js` + `api.js`

Frontend, Electron main process ile IPC üzerinden haberleşir. `bridge.js` transport soyutlaması sağlar, `api.js` bunu promise tabanlı API'ye sarar:

```javascript
// bridge.js — transport katmanı
getTransport()     // → { sendMessage, onPush, getState, setState }
projectApi         // → { hasProject, selectProject, getRecentProjects, openRecentProject }

// api.js — iş mantığı API'si
export const api = {
  load()                         // Plan yükle
  save(data)                     // Plan kaydet
  createRoadmap()                // Boş plan oluştur
  createRoadmapWithSettings(s)   // Ayarlı plan oluştur
  resetRoadmap()                 // Planı sıfırla
  listBackups()                  // Yedekleri listele
  restoreBackup(filename)        // Yedekten geri yükle
  prdLoad(filename)              // PRD dosyası yükle
  prdLines(start, end, ...)      // PRD satır aralığı oku
  prdUpdate(start, end, ...)     // PRD satır aralığı güncelle
  dosyaSec()                     // Dosya seçici aç
  pdfOlustur(payload)            // PDF oluştur
  loadSettings()                 // Ayarları yükle
  saveSettings(settings)         // Ayarları kaydet
  detectTerminals()              // Terminalleri algıla
  runTerminal(cmd, name)         // Terminal komutu çalıştır (fire-and-forget)
  bildirimGoster(mesaj)          // Bildirim göster (fire-and-forget)
  gitDurum()                     // Git durumu
  gitDegisiklikler()             // Değişen dosyalar
  gitKaydet(mesaj)               // Commit
  gitPaylas()                    // Push
  gitGuncelle()                  // Pull
  claudeDosyaYukle(filename)     // Claude dosya yükle
  claudeDosyaKaydet(f, content)  // Claude dosya kaydet
  claudePluginKur()              // Plugin kur
  claudeDosyaAc(filename)        // Dosya aç
  claudeDosyaEkle()              // Dosya ekle
  pluginDurumYukle()             // Plugin durumu
  pluginKomutKaydet(name, content) // Plugin komutu kaydet
  pluginKomutSil(name)           // Plugin komutu sil
  pluginYapilandirmaKaydet(...)  // Plugin yapılandırma kaydet
  kokpitBaslat(kuyruk)           // AI kokpit başlat
  kokpitDurdur()                 // AI kokpit durdur
  kokpitAtla()                   // Aktif görevi atla
  kokpitDurumAl()                // Kokpit durumu al
}

export const state = { get(key, default), set(key, value) }  // electron-store
export function onMessage(command, callback)                   // Push dinleyici
```

### Bileşen Hiyerarşisi

```
App.jsx
├── ProjectPicker (pages/)        # Proje seçimi (ilk açılış)
├── SetupWizard (pages/)          # fileNotFound + firstRun → wizard göster
├── SettingsView (pages/)         # viewMode === 'settings' → ayarlar göster
│
├── Titlebar                      # Özel pencere başlık çubuğu (frameless)
├── Header                        # Proje adı, arama, komutlar, Claude butonu
├── StatsPanel                    # İstatistikler (halka, ilerleme çubukları, grafik)
│
├── DndContext (faz sıralama)
│   └── SortablePhase[]
│       └── FazTable              # Her faz için tablo
│           └── SortableRow[]     # Her özellik satırı
│               ├── StatusDot     # Durum seçici
│               ├── DatePickerCell # Tarih seçici
│               ├── DynamicCell   # Tip bazlı hücre
│               └── SubtaskTree   # Alt görev ağacı
│
├── GitPanel                      # Git işlemleri paneli
├── AiKokpit                     # AI görev kuyruğu
├── PrdLinePicker                 # PRD satır seçici modal
└── PrdModal                     # PRD önizleme modal
```

### Kütüphaneler

| Kütüphane | Kullanım |
|-----------|----------|
| React 18 | UI framework |
| Vite | Dev server + build |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui (Radix UI) | Button, Input, Dialog, Popover, DropdownMenu, Calendar |
| @dnd-kit | Drag-and-drop (satır + faz sıralama) |
| date-fns | Tarih formatlama (Türkçe locale) |
| marked | PRD/dosya markdown render |
| lucide-react | İkonlar |

---

## Platform Soyutlama

Shared backend platform-spesifik koddan bağımsızdır. Platform davranışları `platform.ts`'deki arayüzler ile soyutlanır:

```typescript
// packages/shared/src/platform.ts

interface TerminalSaglayici {
  calistir(opts: { name, cmd, cwd?, shellPath? }): string;
  kapat(termId: string): void;
  onKapandi(callback): () => void;
}

interface DiyalogSaglayici {
  dosyaSec(options?): Promise<string | null>;
}

interface DosyaAciciSaglayici {
  dosyaAc(filePath: string): Promise<void>;
}
```

Her host (Electron, Web) bu arayüzleri implemente eder:

| Arayüz | Electron İmplementasyonu | Konum |
|--------|--------------------------|-------|
| `TerminalSaglayici` | `child_process.spawn` | `electron/src/platform/terminal.ts` |
| `DiyalogSaglayici` | `dialog.showOpenDialog` | `electron/src/platform/dialog.ts` |
| `DosyaAciciSaglayici` | `shell.openPath` | `electron/src/platform/shell.ts` |
| `KairosHost` | Proje adı + bildirim | `electron/src/main.ts` |

Enjeksiyon `main.ts`'de yapılır:

```typescript
setTerminalSaglayici(createTerminalSaglayici(root));
setDiyalogSaglayici(createDiyalogSaglayici(mainWindow));
setDosyaAciciSaglayici(createDosyaAciciSaglayici());
setHost(host);
```

---

## Veri Akışı

### Yazma İşlemi (Kaydetme)

```
Renderer (App.jsx)       api.js / bridge.js         Electron Main          Shared Backend
     │                        │                          │                      │
     │  api.save(data)        │                          │                      │
     ├───────────────────────►│ sendMessage('save')      │                      │
     │                        ├─────────────────────────►│ ipcMain.handle       │
     │                        │                          ├─────────────────────►│
     │                        │                          │                      │ planKaydet(data)
     │                        │                          │                      │ db.writeFile('kairos/data.json')
     │                        │                          │                      │ suppressNextFileChange()
     │                        │                          │◄─────────────────────┤
     │                        │◄─────────────────────────┤ IpcAdaptor response  │
     │◄──────────────────────┤ resolve(success)          │                      │
```

### Okuma İşlemi (Yükleme)

```
Renderer (App.jsx)       api.js / bridge.js         Electron Main          Shared Backend
     │                        │                          │                      │
     │  api.load()            │                          │                      │
     ├───────────────────────►│ sendMessage('load')      │                      │
     │                        ├─────────────────────────►│ ipcMain.handle       │
     │                        │                          ├─────────────────────►│
     │                        │                          │                      │ planYukle()
     │                        │                          │                      │ db.readFile('kairos/data.json')
     │                        │                          │◄─────────────────────┤
     │                        │◄─────────────────────────┤ IpcAdaptor response  │
     │◄──────────────────────┤ resolve(data)             │                      │
```

### Dış Değişiklik Algılama

```
Harici Editör → kairos/data.json değişir
     │
     ▼
fileWatcher.ts (chokidar)
     │
     ├── consumeSuppression() → true ise yoksay (kendi yazmamız tetikledi)
     │
     └── false → pushToAllWindows({ command: 'fileChanged' })
                     │
                     ▼ preload.ts → onPush callback
              App.jsx → onMessage('fileChanged') → api.load() → UI güncelle
```

### Push Mesajları (Backend → Frontend)

```
Electron Main
  │
  ├── fileChanged              → data.json dışarıdan değişti
  ├── kokpitDurumDegisti       → AI kokpit durumu güncellendi
  ├── kokpitGorevTamamlandi    → Bir kokpit görevi tamamlandı
  └── bildirimGosterResponse   → Bildirim göster
```

---

## Build Sistemi

### Paket Build Komutları

| Paket | Komut | Araç | Çıktı |
|-------|-------|------|-------|
| `@kairos/shared` | `npm run build:shared` | `tsc` | `packages/shared/dist/` |
| `@kairos/renderer` | `npm run build:renderer` | `vite build` | `packages/renderer/dist/` |
| `@kairos/electron` | `npm run build:electron` | `tsc` | `packages/electron/dist/` |
| Tümü | `npm run build` | Sıralı: shared → renderer → electron | — |

### Geliştirme

| Komut | Açıklama |
|-------|----------|
| `npm run dev:renderer` | Vite dev server (:5173) |
| `npm run dev:electron` | Concurrent: Vite + Electron |

### Paketleme

```bash
npm run package:electron    # npm run build + electron-builder → release/
```

`electron-builder.yml` yapılandırması: Windows (nsis, portable), macOS (dmg), Linux (AppImage, deb)

---

## Yeni Özellik Ekleme

### Adım 1: Backend Dosyası Oluştur

```typescript
// packages/shared/src/yeniModul/islem.ts
import { readFile, writeFile } from '../_core/db';

export async function execute(params: ParamType): Promise<ResultType> {
  // İş mantığı
  return result;
}
```

### Adım 2: Tip Tanımla

```typescript
// packages/shared/src/types.ts - WebviewMessage'a yeni command ekle
| { command: 'yeniIslem'; param: string }

// ExtensionMessage'a response ekle
| { command: 'yeniIslemResponse'; data: ResultType }
```

### Adım 3: API'ye Case Ekle

```typescript
// packages/shared/src/api/index.ts
import { execute as yeniIslem } from '../yeniModul/islem';

case 'yeniIslem': {
  const result = await yeniIslem(message.param);
  webview.postMessage({ command: 'yeniIslemResponse', data: result });
  return result;
}
```

### Adım 4: Frontend API'ye Ekle

```javascript
// packages/renderer/src/api.js - api objesine yeni metod
async yeniIslem(param) {
  const response = await sendMessage({ command: 'yeniIslem', param })
  return response.data
}
```

### Adım 5: UI'da Kullan

```jsx
// packages/renderer/src/components/YeniBilesen.jsx
import { api } from '../api'

const result = await api.yeniIslem(param)
```

---

## Kurallar ve İlkeler

### YAPILMASI GEREKENLER

| Kural | Açıklama |
|-------|----------|
| **Tek Dosya = Tek İşlem** | Her backend dosyası tek bir `execute()` fonksiyonu içerir |
| **API Üzerinden Erişim** | Frontend asla backend modüllerini doğrudan import etmez |
| **`_core/db.ts` Kullan** | Backend modülleri doğrudan `fs` çağırmaz |
| **Platform Soyutlama** | Shared kodda platform-spesifik import yapılmaz |
| **Tip Güvenliği** | Yeni mesajlar `types.ts`'de tanımlanmalı |
| **Suppression** | data.json yazarken `db.writeFile` kullan (otomatik suppress) |

### YAPILMAMASI GEREKENLER

| Kural | Açıklama |
|-------|----------|
| **Shared'dan Platform Import** | `@kairos/shared` içinde Electron/VS Code import etmek YASAK |
| **Renderer'dan Shared Import** | Frontend'de `@kairos/shared` import etmek YASAK |
| **Doğrudan `fs` Kullanma** | Backend modüllerinde `fs` yerine `db.ts` kullan |
| **Büyük Dosyalar** | Tek dosyada birden fazla execute() YASAK |
| **Monolitik Bileşen** | App.jsx'e yeni UI mantığı eklemek yerine bileşen oluştur |

### Dosya İsimlendirme

| Tür | Format | Örnekler |
|-----|--------|----------|
| Backend dosya | Türkçe fiil (camelCase) | `yukle`, `kaydet`, `parsele`, `olusturAyarli` |
| Backend fonksiyon | `execute()` | `export async function execute(...)` |
| Frontend bileşen | PascalCase | `FazTable`, `StatusDot`, `SortableRow` |
| Frontend sayfa | PascalCase | `SettingsView`, `SetupWizard`, `ProjectPicker` |
| Lib dosya | camelCase | `constants.js`, `theme.js`, `hooks.js` |
| Electron dosya | camelCase | `main.ts`, `preload.ts`, `ipcHandlers.ts` |

### Commit Mesajları

```
# Format: [katman/modul]: açıklama

[shared/plan]: faz sıralama desteği eklendi
[shared/api]: yeni mesaj tipi eklendi
[electron/platform]: terminal sağlayıcı güncellendi
[renderer/components]: FazTable collapse animasyonu düzeltildi
[renderer/pages]: SettingsView yedek sekmesi eklendi
[web-server]: WebSocket bağlantı hatası düzeltildi
```
