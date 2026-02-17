# Katkida Bulunma

Kairos'a katkida bulunmak istediginiz icin tesekkurler!

## Gelistirme Ortami

### Gereksinimler

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.85.0+

### Kurulum

```bash
git clone https://github.com/Kenfrozz/roadmap-editor-vscode.git
cd roadmap-editor-vscode
npm install
npm run build
```

### Gelistirme

```bash
# Watch modunda gelistirme
npm run watch

# F5 ile VS Code Extension Development Host baslatilir
```

## Mimari Kurallar

Kairos 3-katmanli izole mimari kullanir. Katkida bulunurken bu kurallara uyulmalidir:

```
webview/ (Frontend) --> postMessage --> src/api/ (Router) --> src/backend/ (Is Mantigi)
```

### Yeni Ozellik Ekleme Sirasi

1. `src/backend/[modul]/[islem].ts` — `execute()` fonksiyonu yaz
2. `src/types.ts` — Mesaj tipi ekle
3. `src/api/index.ts` — Switch/case ekle
4. `webview/vscodeApi.js` — API metodu ekle
5. `webview/components/` veya `webview/pages/` — UI bileseni ekle

### Kurallar

- Frontend (`webview/`) asla `src/` dosyalarini import etmez
- Backend dosyalari tek bir `execute()` fonksiyonu export eder
- Dosya I/O icin `_core/db.ts` kullanilir
- Yeni UI mantigi `App.jsx`'e eklenmez, ayri bilesen dosyasi olusturulur

Detaylar icin [ARCHITECTURE.md](ARCHITECTURE.md) dosyasina bakin.

## Commit Mesaji Formati

```
[katman/modul]: aciklama

Ornekler:
[backend/plan]: faz siralama destegi eklendi
[api]: yeni mesaj tipi eklendi
[frontend/components]: FazTable collapse animasyonu duzeltildi
```

## Pull Request Sureci

1. Repo'yu fork edin
2. Yeni bir branch olusturun (`git checkout -b feature/yeni-ozellik`)
3. Degisikliklerinizi commit edin
4. `npm run build` ile build'in basarili oldugunu dogrulayin
5. Pull request gonderin

## Sorun Bildirme

Hata raporlari ve ozellik istekleri icin [GitHub Issues](https://github.com/Kenfrozz/roadmap-editor-vscode/issues) kullanin.
