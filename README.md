# Roadmap Editor

VS Code icinde **ROADMAP.md** dosyalarini gorsel olarak duzenleyin.

![Visual Studio Code](https://img.shields.io/badge/VS%20Code-^1.85.0-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## Ozellikler

- **Gorsel Roadmap Duzenleyici** — Tab veya sidebar panelinde ROADMAP.md dosyanizi gorsel olarak yonetin
- **Surekle & Birak** — Ogeleri surukleyerek kolayca siralama
- **Faz Yonetimi** — Projenizi fazlara bolun (Planlama, Gelistirme, Test, Yayin)
- **Durum Takibi** — Her oge icin durum belirleyin (Tamamlandi, Devam Ediyor, Yapilmadi, N/A)
- **Tarih Secici** — Takvim bileseninden tarih atama
- **Changelog** — Degisiklik gecmisini yonetin
- **PRD Entegrasyonu** — Urun Gereksinimleri Dokumani goruntuleyici
- **Terminal Entegrasyonu** — Komutlari dogrudan VS Code terminalinde calistirin
- **Tema Uyumu** — VS Code temanizla otomatik renk senkronizasyonu
- **Ozellestirilebilir Sutunlar** — Ihtiyaciniza gore sutun ekleyin, kaldirin veya duzenleyin

## Kullanim

### Roadmap Editoru Acma

1. **Komut Paleti** (`Ctrl+Shift+P`) > `Roadmap Editor: Open (Tab)`
2. Veya sol kenar cubugundaki **Roadmap Editor** ikonuna tiklayin

### Yeni Roadmap Olusturma

Workspace'inizde bir `ROADMAP.md` dosyasi yoksa, editor otomatik olarak yeni bir tane olusturmanizi oner.

### Durum Ikonlari

| Ikon | Anlam |
|------|-------|
| ✅ | Tamamlandi |
| ⚠️ | Devam Ediyor |
| ❌ | Yapilmadi |
| - | N/A |

## Varsayilan Fazlar

1. **Planlama & Altyapi** — Proje kurulumu ve temel yapilandirma
2. **Cekirdek Gelistirme** — Ana ozelliklerin gelistirilmesi
3. **Ileri Ozellikler** — Gelismis ozellik ve entegrasyonlar
4. **Test & Yayin** — Test, optimizasyon ve dagitim

## Ayarlar

Workspace kokunde `.roadmap-settings.json` dosyasi ile kisisellestirebilirsiniz:

- Faz isimleri ve renkleri
- Ozel sutun tanimlari (metin, durum, tarih)
- Terminal yapilandirmasi
- Claude AI entegrasyonu

## Gereksinimler

- VS Code **1.85.0** veya uzeri

## Bilinen Sorunlar

Sorunlari bildirmek için: +90 541 770 46 10

## Lisans

MIT
