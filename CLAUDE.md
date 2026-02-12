# CLAUDE.md - Kairos VS Code

Bu dosya, Claude Code'un bu projede çalışırken uyması gereken kuralları tanımlar.

## Proje Özeti

Proje geliştirme kokpiti — PRD, roadmap, Git ve AI araçlarını tek arayüzden yöneten bir VS Code eklentisi. 3-Katmanlı Lokal-First Mimari kullanır. Detaylar için `ARCHITECTURE.md` dosyasına bakın.

## Teknoloji

- **Extension:** TypeScript, Node.js, VS Code API
- **Frontend:** React 18 (JSX), Tailwind CSS, shadcn/ui (Radix UI), @dnd-kit, date-fns, lucide-react
- **Build:** esbuild (CJS + IIFE) + PostCSS/Tailwind
- **Dil:** UI metinleri Türkçe, kod isimlendirmeleri Türkçe fiil formunda (backend), PascalCase (frontend)

## Build & Test

```bash
npm run build    # Tek seferlik build (extension + webview + CSS)
npm run watch    # Watch modu
```

Build çıktısı `dist/` dizinine yazılır. Test framework'ü henüz yok.

## Mimari Kurallar (KRİTİK)

### 3-Katman İzolasyonu

```
webview/ (Frontend) → postMessage → src/api/ (Router) → src/backend/ (İş Mantığı)
```

1. **Frontend (`webview/`)** asla `src/` altındaki dosyaları import ETMEZ
2. **Frontend** sadece `webview/vscodeApi.js` üzerinden `api.xxx()` çağrıları yapar
3. **API (`src/api/index.ts`)** tek giriş noktasıdır, backend modüllerini import eder
4. **Backend (`src/backend/`)** dosya I/O için her zaman `_core/db.ts` kullanır, doğrudan `vscode.workspace.fs` çağırmaz

### Backend Dosya Kuralı: 1 Dosya = 1 İşlem

- Her backend dosyası TEK bir `execute()` fonksiyonu export eder
- Dosya adları Türkçe fiil formundadır: `yukle.ts`, `kaydet.ts`, `parsele.ts`, `olusturAyarli.ts`
- Yardımcı fonksiyonlar aynı dosyada private kalır, ayrı utils dosyası OLUŞTURULMAZ

### Yeni Özellik Ekleme Sırası

Yeni bir backend işlemi eklerken bu 5 adımı sırayla takip et:

1. `src/backend/[modul]/[islem].ts` → `execute()` fonksiyonu yaz
2. `src/types.ts` → `WebviewMessage` ve `ExtensionMessage` union'larına yeni command ekle
3. `src/api/index.ts` → switch/case'e yeni case ekle, backend modülünü import et
4. `webview/vscodeApi.js` → `api` objesine yeni async metod ekle
5. `webview/components/` veya `webview/pages/` → UI bileşeninde `api.xxx()` ile kullan

### Frontend Bileşen Kuralı

- Yeni UI mantığı App.jsx'e EKLENMEMELİ, ayrı bileşen dosyası oluşturulmalı
- Bileşenler: `webview/components/BilesenAdi.jsx`
- Sayfalar: `webview/pages/SayfaAdi.jsx`
- Paylaşılan mantık: `webview/lib/` (hooks, utils, constants)
- shadcn/ui primitifleri: `webview/components/ui/` (dokunma)

## Dosya Yapısı Haritası

```
src/
├── extension.ts                    # Aktivasyon, komutlar, FileSystemWatcher
├── types.ts                        # TÜM TypeScript tipleri (tek dosya)
├── KairosPanel.ts                  # Tab webview (handleMessage → api/index.ts)
├── KairosSidebarProvider.ts        # Sidebar webview (handleMessage → api/index.ts)
├── api/index.ts                    # Mesaj router (WebviewMessage → backend execute)
└── backend/
    ├── _core/db.ts                 # Dosya I/O wrapper + suppression
    ├── plan/                       # KAIROS.md CRUD (parsele, uret, yukle, kaydet, olustur, olusturAyarli, sifirla)
    ├── yedek/                      # Yedekleme (olustur, listele, geriYukle)
    ├── prd/                        # PRD.md (yukle, satirOku, guncelle)
    ├── ayarlar/                    # .kairos-settings.json (yukle, kaydet)
    └── terminal/                   # VS Code terminal (calistir, algila)

webview/
├── App.jsx                         # Ana uygulama (~793 satır)
├── vscodeApi.js                    # postMessage bridge (api, state, onMessage)
├── lib/                            # Paylaşılan (constants, theme, hooks, utils)
├── components/                     # UI bileşenleri (StatusDot, FazTable, SortableRow, vb.)
├── components/ui/                  # shadcn/ui primitifleri (DOKUNMA)
└── pages/                          # Tam sayfa görünümler (SettingsView, SetupWizard)
```

## Önemli Dosyalar

| Dosya | Ne Zaman Düzenlenir |
|-------|---------------------|
| `src/types.ts` | Yeni mesaj tipi eklerken |
| `src/api/index.ts` | Yeni backend işlemi eklerken (case ekle) |
| `webview/vscodeApi.js` | Yeni API metodu eklerken |
| `webview/lib/constants.js` | STATUS_OPTIONS, FAZ_COLORS, DEFAULT_COLUMNS değiştiğinde |
| `src/backend/_core/db.ts` | Dosya I/O altyapısı değiştiğinde (nadir) |

## Yapma

- `webview/` içinden `src/` dosyalarını import etme (katman ihlali)
- Backend modüllerinde doğrudan `vscode.workspace.fs` kullanma (`db.ts` kullan)
- Tek dosyaya birden fazla `execute()` koyma
- App.jsx'e yeni büyük UI blokları ekleme (bileşen çıkar)
- `webview/components/ui/` altındaki shadcn/ui dosyalarını manuel düzenleme
- Gereksiz utils/helper dosyaları oluşturma (private fonksiyon yeterli)

## Commit Mesajı Formatı

```
[katman/modul]: açıklama

Örnekler:
[backend/plan]: faz sıralama desteği eklendi
[api]: yeni mesaj tipi eklendi
[frontend/components]: FazTable collapse animasyonu düzeltildi
[frontend/pages]: SettingsView yedek sekmesi eklendi
```
