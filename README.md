<p align="center">
  <img src="media/icon.png" alt="Roadmap Editor" width="128" height="128">
</p>

<h1 align="center">Roadmap Editor</h1>

<p align="center">
  <strong>ROADMAP.md</strong> dosyalarini VS Code icinde gorsel olarak duzenleyin.<br>
  Projenizin yol haritasini tablolar, fazlar ve durum ikonlariyla yonetin — tek bir markdown dosyasindan.
</p>

<p align="center">
  <a href="https://code.visualstudio.com/"><img src="https://img.shields.io/badge/VS%20Code-%5E1.85.0-007ACC?logo=visual-studio-code&logoColor=white" alt="VS Code"></a>
  <a href="https://github.com/Kenfrozz/roadmap-editor-vscode/releases"><img src="https://img.shields.io/badge/version-1.0.0-28a745" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <img src="media/screenshot.png" alt="Roadmap Editor Screenshot" width="800">
</p>

---

## Ozellikler

| Ozellik | Aciklama |
|---------|----------|
| **Gorsel Editor** | Tab veya sidebar panelinde ROADMAP.md dosyanizi gorsel olarak yonetin |
| **Surekle & Birak** | Satir ve fazlari surukleyerek kolayca siralama |
| **Faz Yonetimi** | Projenizi fazlara bolun, isimlendirin ve renklendirin |
| **Durum Takibi** | Her oge icin durum belirleyin (Tamamlandi, Devam Ediyor, Yapilmadi, N/A) |
| **Dinamik Sutunlar** | `text`, `status`, `date` tiplerinde ozel sutun tanimlama |
| **Tarih Secici** | Takvim bileseninden tarih atama |
| **Changelog** | Degisiklik gecmisini yonetin |
| **PRD Entegrasyonu** | PRD.md dosyasini satir bazli goruntuleme ve duzenleme |
| **Terminal Entegrasyonu** | Komutlari dogrudan VS Code terminalinde calistirin |
| **Backup & Restore** | Otomatik yedekleme ve geri yukleme |
| **Tema Uyumu** | VS Code temanizla otomatik renk senkronizasyonu |
| **Claude AI** | Ozellik bazli Claude komutu calistirma |

## Kurulum

### Marketplace'den (yakin zamanda)

VS Code Extensions bolumunden **Roadmap Editor** aratarak yukleyin.

### Manuel Kurulum

```bash
git clone https://github.com/Kenfrozz/roadmap-editor-vscode.git
cd roadmap-editor-vscode
npm install
npm run build
```

Olusturulan `.vsix` dosyasini VS Code'a yukleyin:

```bash
npm run package
code --install-extension roadmap-editor-*.vsix
```

## Kullanim

### Roadmap Editoru Acma

1. **Komut Paleti** (`Ctrl+Shift+P`) > `Roadmap Editor: Open (Tab)`
2. Veya sol kenar cubugundaki **Roadmap Editor** ikonuna tiklayin

### Yeni Roadmap Olusturma

Workspace'inizde bir `ROADMAP.md` dosyasi yoksa, editor otomatik olarak yeni bir tane olusturmanizi onerir. Ilk acilista sutun yapilandirmanizi da yapabilirsiniz.

### Durum Ikonlari

| Ikon | Anlam |
|------|-------|
| ✅ | Tamamlandi |
| ⚠️ | Devam Ediyor |
| ❌ | Yapilmadi |
| - | N/A |

## Varsayilan Fazlar

| # | Faz | Aciklama |
|---|-----|----------|
| 1 | **Planlama & Altyapi** | Proje kurulumu ve temel yapilandirma |
| 2 | **Cekirdek Gelistirme** | Ana ozelliklerin gelistirilmesi |
| 3 | **Ileri Ozellikler** | Gelismis ozellik ve entegrasyonlar |
| 4 | **Test & Yayin** | Test, optimizasyon ve dagitim |

Faz sayisi ve isimleri tamamen ozellestirilebilir.

## Varsayilan Sutunlar

| Sutun | Tip | Aciklama |
|-------|-----|----------|
| Ozellik | `text` | Is kaleminin adi |
| PRD | `text` | Ilgili PRD referansi |
| Backend | `status` | Backend gelistirme durumu |
| Frontend | `status` | Frontend gelistirme durumu |
| Test | `status` | Test durumu |
| Tarih | `date` | Hedef / tamamlanma tarihi |
| Not | `text` | Ek aciklama |

## Ayarlar

Workspace kokunde `.roadmap-settings.json` dosyasi ile kisisellestirebilirsiniz:

```jsonc
{
  "version": 1,
  "terminal": {
    "defaultTerminalId": "pwsh",
    "availableTerminals": []
  },
  "claude": {
    "mainCommand": "claude --dangerously-skip-permissions",
    "featureCommand": "claude \"${ozellik}\""
  },
  "roadmap": {
    "columns": [
      { "key": "ozellik", "label": "Ozellik", "type": "text" },
      { "key": "backend", "label": "Backend", "type": "status" },
      { "key": "frontend", "label": "Frontend", "type": "status" },
      { "key": "tarih", "label": "Tarih", "type": "date" }
    ]
  }
}
```

### Sutun Tipleri

- **`text`** — Serbest metin girisi
- **`status`** — Durum secici (Tamamlandi / Devam Ediyor / Yapilmadi / N/A)
- **`date`** — Takvim ile tarih secimi

## Gelistirme

```bash
# Bagimliliklari yukle
npm install

# Watch modunda gelistirme
npm run watch

# Uretim build
npm run build

# VSIX paketi olustur
npm run package
```

### Proje Yapisi

```
roadmap-editor-vscode/
├── src/                    # Extension backend (TypeScript)
│   ├── extension.ts        # Activation & komut kayitlari
│   ├── RoadmapPanel.ts     # Tab webview paneli
│   ├── RoadmapSidebarProvider.ts  # Sidebar webview
│   ├── messageHandler.ts   # Webview <-> Extension mesajlasma
│   ├── parser.ts           # ROADMAP.md parse & generate
│   ├── fileOps.ts          # Dosya islemleri & backup
│   ├── settings.ts         # Ayar yonetimi
│   └── types.ts            # Tip tanimlari
├── webview/                # React frontend (JSX)
│   ├── App.jsx             # Ana uygulama bileseni
│   ├── main.jsx            # React entry point
│   ├── vscodeApi.js        # VS Code API koprüsü
│   ├── index.css           # Tailwind CSS & tema
│   ├── components/ui/      # shadcn/ui bilesenleri
│   └── lib/utils.js        # Yardimci fonksiyonlar
├── media/                  # Ikon dosyalari
├── esbuild.mjs             # Build yapilandirmasi
├── tailwind.config.js      # Tailwind yapilandirmasi
└── package.json            # Extension manifest
```

## Gereksinimler

- VS Code **1.85.0** veya uzeri

## Sorun Bildirme & Katkida Bulunma

Bir hata buldunuz veya yeni bir ozellik istiyorsunuz? [GitHub Issues](https://github.com/Kenfrozz/roadmap-editor-vscode/issues) uzerinden bildirebilirsiniz.

Katkida bulunmak icin:

1. Repo'yu fork edin
2. Yeni bir branch olusturun (`git checkout -b feature/yeni-ozellik`)
3. Degisikliklerinizi commit edin
4. Pull request gonderin

## Lisans

[MIT](LICENSE)
