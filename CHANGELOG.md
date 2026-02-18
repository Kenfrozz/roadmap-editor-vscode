# Changelog

Tum onemli degisiklikler bu dosyada belgelenir.

## [1.7.0] - 2026-02-18

### Eklendi
- **Istatistik Paneli Yeniden Tasarimi** — Radial gauge yerine animasyonlu sayi sayaci, satir ici ilerleme cubulari ve entegre tarih gostergeleri ile kompakt kokpit tasarimi
- **Durum Ikonlari** — Durum noktalari yerine anlamli ikonlar (Check, Clock, X, Minus) ile gorsel geri bildirim

### Degisti
- **Faz Basliklari** — Renkli FAZ 04 etiketi yerine sade numara, tamamlama sayaci sag yasli monospace metin
- **Navbar** — KAIROS yazisi ve tarih gostergesi kaldirildi, sadece Git durumu kaldi
- **Footer** — "Kairos vX.Y.Z — VS Code" yerine sadece "Kairos vX.Y.Z"
- **StatusDot Boyutu** — Tiklanabilir alan PRD ikonu ile tutarli hale getirildi

### Kaldirildi
- **StatusStatCard & DateStatCard** — Kullanilmayan eski istatistik bilesenleri silindi
- **Eski Stats CSS** — ~300 satir kullanilmayan .stats-* CSS kurallari temizlendi

## [1.6.0] - 2026-02-18

### Eklendi
- **Alt Gorev Sistemi** — Gorevlere 3 seviye derinlikte alt gorev ekleme (Gorev > Alt Gorev > Alt Alt Gorev)
- **Gorev Turleri** — Alt gorevlere tur atama (Gelistirme, Hata, Iyilestirme, Arastirma, Tasarim, Test, Diger) ve ikon destegi
- **Tur Yonetimi** — Ayarlar'da gorev turlerini ozellestirebilme (icon, renk, isim secimi ile yeni tur ekleme/silme)
- **JSON Veri Formati** — KAIROS.md yerine data.json formatina gecis, otomatik v1→v2 migration
- **Durum Hafizasi** — Faz ve alt gorev acik/kapali durumu kalici olarak saklanir

### Degisti
- **Alt Gorev Layoutu** — Alt gorevler yalnizca baslik, detay, tur ve tek durum gostergesi icerir (ana gorev sutunlari yok)
- **Islem Menusu** — Satir islemleri (Claude, Ekle, Sil, Alt Gorev) ayri butonlar yerine tek dropdown menu
- **Otomatik Tamamlama** — Tum alt gorevler tamamlaninca ust gorev otomatik olarak tamamlandi olarak isaretlenir
- **Yaprak Bazli Istatistikler** — Ilerleme hesaplamalari sadece yaprak gorevleri (alt gorevi olmayan) sayar

### Kaldirildi
- **EkTablo Sistemi** — Hatalar, Degisiklikler ve Degisiklik Gecmisi tablolari kaldirildi (alt gorevler ile degistirildi)
- **KAIROS.md Parser** — Markdown parse/generate mantigi kaldirildi, dogrudan JSON okuma/yazma
- **Kisaltma Badge** — 3-harf kisaltma yerine lucide ikonlari kullanilir

### Duzeltildi
- **Toplu Status Guncelleme** — Alt gorevlerde status secimi tum sutunlari atomik olarak gunceller
- **Surukleme Korunumu** — Alt gorevli ana gorevlerde drag handle kaybolma sorunu giderildi

## [1.5.2] - 2026-02-17

### Duzeltildi
- **Durum Sutunu** — Satirlarin sag tarafina tasindi (Baslik → Aciklama → Durum → Butonlar)
- **Ek Tablolar** — Faz tablolarinin altina geri alindi (yan panel yerine)

## [1.5.1] - 2026-02-17

### Eklendi
- **Durum Sutunu** — Hatalar ve Degisiklikler tablolarina StatusDot ile durum takibi (Tamamlandi/Devam Ediyor/Yapilmadi/N-A)

### Degisti
- **Sag Panel Yerlesimi** — Hatalar ve Degisiklikler tablolari ana icerik yaninda sabit sag panele tasindi

## [1.5.0] - 2026-02-17

### Eklendi
- **Hatalar Tablosu** — Proje hatalari icin baslik + aciklama formatinda ayri tablo
- **Degisiklikler Tablosu** — Planlanan degisiklikler icin ayri tablo
- **Claude'a Gonder Butonu** — Hata/degisiklik satirindan tek tikla Claude Code'a gonderme
- **EkTablo Bileseni** — Yeniden kullanilabilir collapse/expand destekli iki sutunlu tablo

### Degisti
- KAIROS.md parser'i Hatalar ve Degisiklikler bolumlerini parse ediyor
- KAIROS.md generator'i her iki bolumu faz tablolari ile ozet arasina yaziyor
- SavePayload ve ParseResult tipleri genisletildi

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
