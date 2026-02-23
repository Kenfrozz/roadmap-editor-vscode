# Katkida Bulunma

Kairos'a katkida bulunmak istediginiz icin tesekkurler!

## Gelistirme Ortami

### Gereksinimler

- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### Kurulum

```bash
git clone https://github.com/Kenfrozz/kairos.git
cd kairos
npm install
npm run build
```

### Gelistirme

```bash
# Electron + Vite dev (onerilen)
npm run dev:electron

# Sadece frontend dev server (:5173)
npm run dev:renderer

# Tek paket build
npm run build:shared
npm run build:renderer
npm run build:electron
```

## Monorepo Yapisi

Proje npm workspaces ile 4 paketten olusur:

```
packages/
├── shared/     (@kairos/shared)    — Platform-agnostic backend + tipler
├── electron/   (@kairos/electron)  — Electron main process
├── renderer/   (@kairos/renderer)  — React frontend (Vite)
└── web-server/ (@kairos/web-server)— Express + WebSocket sunucu
```

## Mimari Kurallar

Kairos 3-katmanli izole mimari kullanir. Katkida bulunurken bu kurallara uyulmalidir:

```
renderer/ (Frontend) → IPC → electron/ (Main) → shared/api/ (Router) → shared/backend/ (Is Mantigi)
```

### Yeni Ozellik Ekleme Sirasi

1. `packages/shared/src/[modul]/[islem].ts` — `execute()` fonksiyonu yaz
2. `packages/shared/src/types.ts` — Mesaj tipi ekle
3. `packages/shared/src/api/index.ts` — Switch/case ekle
4. `packages/renderer/src/api.js` — API metodu ekle
5. `packages/renderer/src/components/` veya `pages/` — UI bileseni ekle

### Kurallar

- Frontend (`packages/renderer/`) asla `@kairos/shared` veya `electron/` dosyalarini import etmez
- Backend dosyalari tek bir `execute()` fonksiyonu export eder
- Dosya I/O icin `_core/db.ts` kullanilir, dogrudan `fs` cagirilmaz
- Shared kodda platform-spesifik import yapilmaz (Electron, VS Code vb.)
- Yeni UI mantigi `App.jsx`'e eklenmez, ayri bilesen dosyasi olusturulur

Detaylar icin [ARCHITECTURE.md](ARCHITECTURE.md) dosyasina bakin.

## Commit Mesaji Formati

```
[katman/modul]: aciklama

Ornekler:
[shared/plan]: faz siralama destegi eklendi
[shared/api]: yeni mesaj tipi eklendi
[electron/platform]: terminal saglayici guncellendi
[renderer/components]: FazTable collapse animasyonu duzeltildi
[renderer/pages]: SettingsView yedek sekmesi eklendi
[web-server]: WebSocket baglanti hatasi duzeltildi
```

## Pull Request Sureci

1. Repo'yu fork edin
2. Yeni bir branch olusturun (`git checkout -b feature/yeni-ozellik`)
3. Degisikliklerinizi commit edin
4. `npm run build` ile build'in basarili oldugunu dogrulayin
5. Pull request gonderin

## Sorun Bildirme

Hata raporlari ve ozellik istekleri icin [GitHub Issues](https://github.com/Kenfrozz/kairos/issues) kullanin.
