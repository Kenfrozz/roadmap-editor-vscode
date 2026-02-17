# Mimari Dokümantasyonu - Kairos VS Code

Bu doküman, Kairos VS Code eklentisinin mimari yapısını açıklar. Tüm geliştiriciler bu kurallara uymalıdır.

---

## İçindekiler:

1. [Genel Bakış](#genel-bakış)
2. [Klasör Yapısı](#klasör-yapısı)
3. [Backend Katmanı](#backend-katmanı)
4. [API Katmanı](#api-katmanı)
5. [Frontend Katmanı](#frontend-katmanı)
6. [Veri Akışı](#veri-akışı)
7. [Build Sistemi](#build-sistemi)
8. [Yeni Özellik Ekleme](#yeni-özellik-ekleme)
9. [Kurallar ve İlkeler](#kurallar-ve-ilkeler)

---

## Genel Bakış

Proje, **3-Katmanlı Lokal-First Mimari** prensibine dayanan bir VS Code eklentisidir. PRD, plan, Git ve AI araçlarını tek arayüzden yönetir. Frontend, backend teknolojilerinden tamamen habersizdir ve tüm işlemlerini `postMessage` tabanlı API katmanı üzerinden gerçekleştirir.

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  webview/ (React 18 + JSX + Tailwind CSS)               │
│  • VS Code API'sinden HABERSİZ                          │
│  • Sadece vscodeApi.js üzerinden mesaj gönderir          │
└───────────────────────┬─────────────────────────────────┘
                        │ postMessage
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    API KATMANI                          │
│  src/api/index.ts                                       │
│  • Webview mesajlarını backend modüllerine yönlendirir   │
│  • Frontend için TEK giriş noktası                      │
└───────────────────────┬─────────────────────────────────┘
                        │ import
                        ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│  src/backend/                                           │
│  • Her işlem = 1 dosya, 1 execute() fonksiyonu          │
│  • Dosya sistemi = veritabanı (KAIROS.md)              │
│  • Remote katman yok (tamamen lokal)                    │
└─────────────────────────────────────────────────────────┘
```

### Neden Bu Yapı?

| Sorun | Çözüm |
|-------|-------|
| Monolitik messageHandler.ts (244 satır switch/case) | Her işlem ayrı dosyada, API router |
| Monolitik App.jsx (2577 satır) | 14 bileşen + 2 sayfa |
| Frontend-Backend bağımlılığı | API katmanı ile izolasyon |
| Yeni özellik eklemek zor | Sadece yeni dosya ekle + API'ye case ekle |

---

## Klasör Yapısı

```
kairos-vscode/
├── src/                               # Extension (TypeScript, Node.js)
│   ├── extension.ts                   # Aktivasyon, komutlar, FileSystemWatcher
│   ├── types.ts                       # Tüm TypeScript tipleri
│   ├── KairosPanel.ts                 # Tab webview panel (CSP, nonce)
│   ├── KairosSidebarProvider.ts       # Sidebar webview provider
│   │
│   ├── api/                           # Mesaj yönlendirici
│   │   └── index.ts                   # WebviewMessage → backend modülü eşlemesi
│   │
│   └── backend/                       # İş mantığı
│       ├── _core/
│       │   └── db.ts                  # Dosya I/O wrapper (readFile, writeFile, vb.)
│       │
│       ├── plan/
│       │   ├── parsele.ts             # KAIROS.md → yapılandırılmış veri
│       │   ├── uret.ts               # Yapılandırılmış veri → KAIROS.md
│       │   ├── yukle.ts              # Plan yükle (parse + metadata)
│       │   ├── kaydet.ts             # Plan kaydet
│       │   ├── olustur.ts            # Boş KAIROS.md oluştur
│       │   ├── olusturAyarli.ts      # Wizard ile özelleştirilmiş oluştur
│       │   └── sifirla.ts            # Yedekle + sıfırla
│       │
│       ├── yedek/
│       │   ├── olustur.ts            # Yedek al
│       │   ├── listele.ts            # Yedekleri listele
│       │   └── geriYukle.ts          # Yedekten geri yükle
│       │
│       ├── prd/
│       │   ├── yukle.ts              # PRD.md yükle
│       │   ├── satirOku.ts           # Satır aralığı oku
│       │   └── guncelle.ts           # Satır aralığı güncelle
│       │
│       ├── ayarlar/
│       │   ├── yukle.ts              # .kairos-settings.json yükle
│       │   └── kaydet.ts             # Ayarları kaydet
│       │
│       └── terminal/
│           ├── calistir.ts           # VS Code terminalinde komut çalıştır
│           └── algila.ts             # Kurulu terminalleri algıla
│
├── webview/                           # Frontend (React 18, JSX)
│   ├── main.jsx                       # React entry point
│   ├── App.jsx                        # Ana uygulama bileşeni (~793 satır)
│   ├── vscodeApi.js                   # postMessage bridge (api, state, onMessage)
│   ├── index.css                      # Tailwind CSS giriş dosyası
│   │
│   ├── lib/
│   │   ├── constants.js               # STATUS_OPTIONS, FAZ_COLORS, DEFAULT_COLUMNS
│   │   ├── theme.js                   # VS Code tema senkronizasyonu (useTheme)
│   │   ├── hooks.js                   # useContainerWidth, parseDate
│   │   └── utils.js                   # cn() (clsx + tailwind-merge)
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitifleri (button, input, dialog, vb.)
│   │   ├── ClaudeIcon.jsx             # Claude AI SVG ikonu
│   │   ├── StatusDot.jsx              # Durum seçici (✅⚠️❌-)
│   │   ├── DatePickerCell.jsx         # Tarih seçici (Calendar popover)
│   │   ├── DynamicCell.jsx            # Tip bazlı hücre renderer
│   │   ├── StatItem.jsx               # İstatistik çubuğu
│   │   ├── SortableRow.jsx            # Sıralanabilir satır + faz (SortableRow, SortablePhase)
│   │   ├── FazTable.jsx               # Faz tablosu (DnD, collapse, progress)
│   │   ├── ChangelogSection.jsx       # Değişiklik geçmişi
│   │   └── PrdModal.jsx               # PRD önizleme modal
│   │
│   └── pages/
│       ├── SettingsView.jsx           # Ayarlar sayfası (terminal, claude, sütunlar, yedekler)
│       └── SetupWizard.jsx            # İlk kurulum sihirbazı (4 adım)
│
├── dist/                              # Build çıktısı
│   ├── extension.js                   # Extension bundle (CJS, Node.js)
│   ├── webview.js                     # Webview bundle (IIFE, browser)
│   └── webview.css                    # Tailwind CSS çıktısı
│
├── esbuild.mjs                        # Build yapılandırması
├── postcss.config.js                  # PostCSS + Tailwind
├── tailwind.config.js                 # Tailwind yapılandırması
├── tsconfig.json                      # TypeScript yapılandırması
└── package.json                       # Bağımlılıklar ve VS Code manifest
```

---

## Backend Katmanı

### `_core/db.ts` - Altyapı

Tüm dosya işlemlerini saran wrapper. Backend modülleri doğrudan `vscode.workspace.fs` kullanmaz, her zaman `db.ts` üzerinden erişir.

```typescript
// Dışa açılan fonksiyonlar:
readFile(filename)              // Workspace'ten dosya oku
writeFile(filename, content)    // Workspace'e dosya yaz (KAIROS.md → auto suppress)
readLineRange(filename, start, end)    // Satır aralığı oku
updateLineRange(filename, start, end, content)  // Satır aralığı güncelle
ensureDir(dirPath)              // Dizin oluştur
readDir(dirPath)                // Dizin listele
statFile(filePath)              // Dosya bilgisi
getRoot()                       // Workspace kök dizini

// FileSystemWatcher suppression mekanizması:
suppressNextFileChange()        // Kendi yazmamızın watcher'ı tetiklemesini engeller
consumeSuppression()            // Suppression durumunu tüketir (extension.ts'de kullanılır)
```

### Backend Modülleri

Her modül dosyası şu yapıyı takip eder:

```typescript
// src/backend/[modul]/[islem].ts

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
| `plan/parsele` | parsele.ts | KAIROS.md içeriğini ParseResult'a dönüştürür |
| `plan/uret` | uret.ts | ParseResult'ı KAIROS.md markdown'a dönüştürür |
| `plan/yukle` | yukle.ts | Dosyayı okur + parse eder, firstRun/columns bilgisi döner |
| `plan/kaydet` | kaydet.ts | Veriyi markdown'a çevirip kaydeder |
| `plan/olustur` | olustur.ts | Varsayılan boş KAIROS.md oluşturur |
| `plan/olusturAyarli` | olusturAyarli.ts | Wizard ayarlarıyla özelleştirilmiş oluşturur |
| `plan/sifirla` | sifirla.ts | Mevcut dosyayı yedekler + yeni boş oluşturur |
| `yedek/olustur` | olustur.ts | `.kairos-backups/` dizinine yedek alır |
| `yedek/listele` | listele.ts | Yedekleri timestamp'e göre sıralı listeler |
| `yedek/geriYukle` | geriYukle.ts | Yedekten KAIROS.md'yi geri yükler |
| `prd/yukle` | yukle.ts | PRD.md dosyasını yükler |
| `prd/satirOku` | satirOku.ts | PRD.md'den satır aralığı okur |
| `prd/guncelle` | guncelle.ts | PRD.md'de satır aralığını günceller |
| `ayarlar/yukle` | yukle.ts | `.kairos-settings.json` yükler (senkron) |
| `ayarlar/kaydet` | kaydet.ts | Ayarları JSON olarak kaydeder |
| `terminal/calistir` | calistir.ts | VS Code terminalinde komut çalıştırır |
| `terminal/algila` | algila.ts | Kurulu terminalleri algılar (cmd, ps, pwsh, gitbash, wsl) |

---

## API Katmanı

### `src/api/index.ts` - Mesaj Yönlendirici

Tek dosya. Tüm `WebviewMessage` komutlarını ilgili backend `execute()` fonksiyonuna yönlendirir.

```typescript
import { execute as planYukle } from '../backend/plan/yukle';
// ... diğer importlar

export async function handleMessage(
  webview: vscode.Webview,
  message: WebviewMessage
): Promise<void> {
  switch (message.command) {
    case 'load': {
      const result = await planYukle();
      webview.postMessage({ command: 'loadResponse', data: result.data });
      break;
    }
    // ... diğer case'ler
  }
}
```

### Mesaj Akışı

```
WebviewMessage.command    →    API case    →    Backend execute()
─────────────────────────────────────────────────────────────────
'load'                    →    'load'      →    plan/yukle
'save'                    →    'save'      →    plan/kaydet
'createRoadmap'           →    ...         →    plan/olustur
'createRoadmapWithSettings' →  ...         →    plan/olusturAyarli
'resetRoadmap'            →    ...         →    plan/sifirla
'listBackups'             →    ...         →    yedek/listele
'restoreBackup'           →    ...         →    yedek/geriYukle
'prdLoad'                 →    ...         →    prd/yukle
'prdLines'                →    ...         →    prd/satirOku
'prdUpdate'               →    ...         →    prd/guncelle
'loadSettings'            →    ...         →    ayarlar/yukle + terminal/algila
'saveSettings'            →    ...         →    ayarlar/kaydet
'detectTerminals'         →    ...         →    terminal/algila
'runTerminal'             →    ...         →    terminal/calistir
'savePdf'                 →    (inline)    →    vscode.window.showSaveDialog
```

---

## Frontend Katmanı

### İletişim Köprüsü: `webview/vscodeApi.js`

Frontend, extension ile `postMessage` üzerinden haberleşir. `vscodeApi.js` bunu promise tabanlı bir API'ye sarar:

```javascript
export const api = {
  load()                         // → 'load' → 'loadResponse'
  save(data)                     // → 'save' → 'saveResponse'
  createRoadmap()                // → 'createRoadmap' → 'createRoadmapResponse'
  createRoadmapWithSettings(s)   // → 'createRoadmapWithSettings' → ...
  resetRoadmap()                 // → 'resetRoadmap' → ...
  listBackups()                  // → 'listBackups' → ...
  restoreBackup(filename)        // → 'restoreBackup' → ...
  prdLoad()                      // → 'prdLoad' → ...
  prdLines(start, end)           // → 'prdLines' → ...
  prdUpdate(start, end, content) // → 'prdUpdate' → ...
  loadSettings()                 // → 'loadSettings' → ...
  saveSettings(settings)         // → 'saveSettings' → ...
  detectTerminals()              // → 'detectTerminals' → ...
  runTerminal(cmd, name)         // fire-and-forget (yanıt beklemez)
}

export const state = { get(key, default), set(key, value) }  // vscode.getState/setState
export function onMessage(command, callback)                   // Push dinleyici
```

### Bileşen Hiyerarşisi

```
App.jsx
├── SetupWizard (pages/)           # fileNotFound + firstRun → wizard göster
├── SettingsView (pages/)          # viewMode === 'settings' → ayarlar göster
│
├── Header                         # Proje adı, arama, komutlar, Claude butonu
├── Stats Bar                      # StatItem x N (istatistikler)
│
├── DndContext (faz sıralama)
│   └── SortablePhase[]
│       └── FazTable               # Her faz için tablo
│           └── SortableRow[]      # Her özellik satırı
│               ├── StatusDot      # Durum seçici
│               ├── DatePickerCell # Tarih seçici
│               ├── DynamicCell    # Tip bazlı hücre
│               └── ClaudeIcon     # Claude butonu
│
├── ChangelogSection               # Değişiklik geçmişi
└── PrdModal                       # PRD önizleme (Dialog)
```

### Kütüphaneler

| Kütüphane | Kullanım |
|-----------|----------|
| React 18 | UI framework |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui (Radix UI) | Button, Input, Dialog, Popover, DropdownMenu, Calendar |
| @dnd-kit | Drag-and-drop (satır + faz sıralama) |
| date-fns | Tarih formatlama (Türkçe locale) |
| marked | PRD markdown render |
| lucide-react | İkonlar |

---

## Build Sistemi

`esbuild.mjs` ile iki ayrı bundle üretilir:

| Bundle | Giriş | Çıkış | Format | Platform |
|--------|-------|-------|--------|----------|
| Extension | `src/extension.ts` | `dist/extension.js` | CJS | Node.js 18 |
| Webview | `webview/main.jsx` | `dist/webview.js` | IIFE | Browser (ES2020) |

CSS: `postcss` + `tailwindcss` → `dist/webview.css`

```bash
npm run build          # Tek seferlik build
npm run watch          # Watch modu (esbuild + CSS)
```

---

## Veri Akışı

### Yazma İşlemi (Kaydetme)

```
Frontend (App.jsx)           vscodeApi.js              API (index.ts)           Backend
     │                           │                          │                      │
     │  api.save(data)           │                          │                      │
     ├──────────────────────────►│ postMessage('save')      │                      │
     │                           ├─────────────────────────►│                      │
     │                           │                          │ planKaydet(data)     │
     │                           │                          ├─────────────────────►│
     │                           │                          │                      │ uret.execute(data) → markdown
     │                           │                          │                      │ db.writeFile('KAIROS.md', md)
     │                           │                          │                      │ suppressNextFileChange()
     │                           │                          │◄─────────────────────┤
     │                           │◄─────────────────────────┤ postMessage('saveResponse')
     │◄──────────────────────────┤ resolve(success)         │                      │
```

### Okuma İşlemi (Yükleme)

```
Frontend (App.jsx)           vscodeApi.js              API (index.ts)           Backend
     │                           │                          │                      │
     │  api.load()               │                          │                      │
     ├──────────────────────────►│ postMessage('load')      │                      │
     │                           ├─────────────────────────►│                      │
     │                           │                          │ planYukle()          │
     │                           │                          ├─────────────────────►│
     │                           │                          │                      │ db.readFile('KAIROS.md')
     │                           │                          │                      │ parsele.execute(content)
     │                           │                          │◄─────────────────────┤
     │                           │◄─────────────────────────┤ postMessage('loadResponse')
     │◄──────────────────────────┤ resolve(data)            │                      │
```

### Dış Değişiklik Algılama

```
Harici Editör → KAIROS.md değişir
     │
     ▼
FileSystemWatcher (extension.ts)
     │
     ├── consumeSuppression() → true ise yoksay (kendi yazmamız tetikledi)
     │
     └── false → webview.postMessage('fileChanged')
                     │
                     ▼
              App.jsx → onMessage('fileChanged') → api.load() → UI güncelle
```

---

## Yeni Özellik Ekleme

### Adım 1: Backend Dosyası Oluştur

```typescript
// src/backend/yeniModul/islem.ts
import { readFile, writeFile } from '../_core/db';

export async function execute(params: ParamType): Promise<ResultType> {
  // İş mantığı
  return result;
}
```

### Adım 2: Tip Tanımla

```typescript
// src/types.ts - WebviewMessage'a yeni command ekle
| { command: 'yeniIslem'; param: string }

// ExtensionMessage'a response ekle
| { command: 'yeniIslemResponse'; data: ResultType }
```

### Adım 3: API'ye Case Ekle

```typescript
// src/api/index.ts
import { execute as yeniIslem } from '../backend/yeniModul/islem';

case 'yeniIslem': {
  const result = await yeniIslem(message.param);
  webview.postMessage({ command: 'yeniIslemResponse', data: result });
  break;
}
```

### Adım 4: Frontend Bridge'e Ekle

```javascript
// webview/vscodeApi.js - api objesine yeni metod
async yeniIslem(param) {
  const response = await sendAndWait(
    { command: 'yeniIslem', param },
    'yeniIslemResponse'
  );
  return response.data;
}
```

### Adım 5: UI'da Kullan

```jsx
// webview/components/YeniBilesen.jsx
import { api } from '../vscodeApi'

const result = await api.yeniIslem(param)
```

---

## Kurallar ve İlkeler

### YAPILMASI GEREKENLER

| Kural | Açıklama |
|-------|----------|
| **Tek Dosya = Tek İşlem** | Her backend dosyası tek bir `execute()` fonksiyonu içerir |
| **API Üzerinden Erişim** | Frontend asla backend modüllerini doğrudan import etmez |
| **`_core/db.ts` Kullan** | Backend modülleri doğrudan `vscode.workspace.fs` çağırmaz |
| **Tip Güvenliği** | Yeni mesajlar `types.ts`'de tanımlanmalı |
| **Suppression** | KAIROS.md yazarken `db.writeFile` kullan (otomatik suppress) |

### YAPILMAMASI GEREKENLER

| Kural | Açıklama |
|-------|----------|
| **Backend Import Etme** | Frontend'de backend modüllerini import etmek YASAK |
| **Doğrudan `vscode` Kullanma** | Backend modüllerinde `vscode.workspace.fs` yerine `db.ts` kullan |
| **Büyük Dosyalar** | Tek dosyada birden fazla execute() YASAK |
| **Monolitik Bileşen** | App.jsx'e yeni UI mantığı eklemek yerine bileşen oluştur |

### Dosya İsimlendirme

| Tür | Format | Örnekler |
|-----|--------|----------|
| Backend dosya | Türkçe fiil (camelCase) | `yukle`, `kaydet`, `parsele`, `olusturAyarli` |
| Backend fonksiyon | `execute()` | `export async function execute(...)` |
| Frontend bileşen | PascalCase | `FazTable`, `StatusDot`, `SortableRow` |
| Frontend sayfa | PascalCase | `SettingsView`, `SetupWizard` |
| Lib dosya | camelCase | `constants.js`, `theme.js`, `hooks.js` |

### Commit Mesajları

```
# Format: [katman/modul]: açıklama

[backend/plan]: faz sıralama desteği eklendi
[api]: yeni mesaj tipi eklendi
[frontend/components]: FazTable collapse animasyonu düzeltildi
[frontend/pages]: SettingsView yedek sekmesi eklendi
```
