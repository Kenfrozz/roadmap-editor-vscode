# Changelog

Tum onemli degisiklikler bu dosyada belgelenir.

## [1.4.0] - 2026-02-17

### Eklendi
- **Fazlar Arasi Surukle-Birak** — Ogeleri farkli fazlara surukleyerek tasima
- **Birlesik DnD Yonetimi** — Tek DndContext altinda faz ve oge suruklemesi
- **Bos Faz Hedefi** — Bos fazlara da oge birakilabilme destegi
- **Gorsel Geri Bildirim** — Surekleme sirasinda hedef faza halka efekti

### Degisti
- Kullaniciya gorunen "roadmap" referanslari "plan" ile degistirildi
- GitHub repo adi `kairos` olarak guncellendi

## [1.3.0] - 2026-02-17

### Eklendi
- **PDF Export** — Proje planini PDF olarak disa aktarma (pdfkit tabanli, Turkce karakter destegi)
- **Dinamik Versiyon Gostergesi** — Footer'da package.json'dan okunan gercek surum numarasi
- **Proje Adi Destegi** — Workspace klasor adi otomatik algilanarak arayuzde ve PDF'te kullaniliyor

### Degisti
- Tum kairos dosyalari `kairos/` alt dizinine tasindi (`KAIROS.md`, `settings.json`, `backups/`)
- Claude feature komutu `/kairos:build` formatina guncellendi
- `db.ts`'ye binary dosya yazma (`writeFileBinary`) destegi eklendi
- esbuild'e font ve pdfkit data kopyalama adimlari eklendi

## [1.2.0] - 2026-02-16

### Eklendi
- **Istatistik Paneli** — Radial gauge ile genel ilerleme, segmented bar'lar ile durum sutunlari, tarih seridi
- **Gorev Tamamlanma Bildirimi** — Tum durum sutunlari tamamlandiginda VS Code bildirimi
- **Dosya Silme Algilama** — KAIROS.md silindiginde otomatik kurulum sayfasina yonlendirme

### Duzeltildi
- FileSystemWatcher `onDidDelete` eksikligi giderildi
- Kullanilmayan bilesen importlari temizlendi

## [1.1.0] - 2026-02-16

### Eklendi
- **Git Entegrasyonu** — Branch durumu, commit, push, pull islemleri arayuzden
- **Ayarlar Sayfasi** — Terminal, Claude ve sutun yapilandirmasi
- **Kurulum Sihirbazi** — Ilk calistirmada rehberli kurulum
- **Yedekleme Sistemi** — Otomatik yedekleme ve geri yukleme

### Degisti
- Faz menusu ve terminal adi guncellendi

## [1.0.0] - 2026-02-12

### Eklendi
- Gorsel plan editoru (Tab + Sidebar)
- Surukle & birak ile satir ve faz siralama
- Dinamik sutun yapisi (`text`, `status`, `date`)
- PRD.md satir bazli goruntuleme ve duzenleme
- Terminal entegrasyonu
- Claude AI ozellik bazli komut calistirma
- VS Code tema uyumu
- Otomatik kaydetme (800ms debounce)
