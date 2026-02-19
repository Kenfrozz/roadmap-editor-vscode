# Kairos — Urun Gereksinim Dokumani (PRD)

> **Surum:** 1.10.0
> **Tarih:** 19 Subat 2026
> **Ozet:** Kairos, proje gelistirme surecini tek bir arayuzden yoneten VS Code eklentisidir. Plan olusturma, gorev takibi, Git islemleri, dokumantasyon ve Claude AI entegrasyonunu bir arada sunar.

---

## Vizyon ve Amac

Kairos, yazilim gelistiricilerin proje planlama, gorev yonetimi ve gelistirme sureclerini parcali araclar arasinda gecis yapmadan, dogrudan kod editorunun icinden yonetmesini saglar.

Bir gelistirici, proje planini olusturur, gorevleri fazlara boler, ilerlemeyi takip eder, Git islemlerini yapar ve gerektiginde yapay zeka desteginden faydalanir — hepsi VS Code'dan cikmadan.

---

## Hedef Kullanici

- Kisisel projelerini sistematik sekilde yonetmek isteyen bireysel gelistiriciler
- Kucuk ekiplerde proje ilerlemesini gorsel olarak takip etmek isteyen yazilimcilar
- Claude Code kullanan ve AI destekli gelistirme isakisini tercih eden gelistiriciler

---

## FAZ 1 — TEMEL YAPI VE PLAN EDITORU

Eklentinin cekirdegini olusturan, proje planlama ve gorev yonetimi icin gereken tum temel yetenekler.

### 1.1 Gorsel Plan Editoru

Kairos'un ana ekrani, projeyi fazlara ve gorevlere bolen gorsel bir tablodur.

- Proje varsayilan olarak 4 faza bolunur: Planlama ve Altyapi, Temel Gelistirme, Ileri Ozellikler, Test ve Yayin
- Faz isimleri ozellestirilebilir
- Fazlar surukle-birak ile yeniden siralanabilir
- Her faz daraltilip genisletilebilir; bu durum oturumlar arasi hatirlanir
- 8 farkli renk koduyla gorsel ayirim saglanir

### 1.2 Gorev Yonetimi

Her faz, icerisine eklenen gorevlerden olusur.

- Her faza sinirsiz gorev eklenebilir
- Gorevler surukle-birak ile siralanabilir veya fazlar arasi tasinabilir
- Bos fazlara da gorev birakilabilir
- Her gorev satirinda ozellik adi, PRD referansi, durum ve tarih bilgisi bulunur
- Gorevler Tamamlandi, Devam Ediyor, Yapilmadi veya Uygulanamaz olarak isaretlenebilir
- Takvim secicisi ile gorevlere tarih atanabilir

### 1.3 Alt Gorev Hiyerarsisi

Gorevler alt parclara bolunebilir.

- 3 seviye derinlige kadar alt gorev destegi (Gorev > Alt Gorev > Alt Alt Gorev)
- Otomatik numaralandirma sistemi (1, 1.1, 1.1.1) ile hiyerarsi gorsel olarak ifade edilir
- Tum alt gorevler tamamlandiginda ust gorev otomatik olarak tamamlandi isaretlenir
- Alt gorev agacinin acik/kapali durumu oturumlar arasi saklanir

### 1.4 Gorev Turleri

Alt gorevlere tur atanarak kategorize edilebilir.

- Varsayilan turler: Gelistirme, Hata, Iyilestirme, Arastirma, Tasarim, Test, Diger
- Her turun kendine ozgu ikonu ve rengi vardir
- Ayarlar sayfasindan yeni tur eklenebilir, mevcut turler duzenlenebilir veya silinebilir

### 1.5 Sutun Yapisi ve Ozellestirme

Gorev tablosundaki sutunlar tamamen ozellestirillebilir.

- Varsayilan sutunlar: Ozellik (metin), PRD (referans), Durum (secim), Tarih (takvim)
- Yeni sutun ekleme (metin, durum veya tarih tipinde)
- Sutun adlarini duzenleme
- Sutunlari surukle-birak ile yeniden siralama
- Ozel sutunlari silme (kilit sutunlar olan ozellik, PRD, durum ve tarih korunur)

### 1.6 Kurulum Sihirbazi

Ilk kez kullanan kullanicilari adim adim yonlendiren rehberli kurulum.

- **Hosgeldin:** Kairos'a giris ve tanitim
- **Terminal Secimi:** Sistemde bulunan terminaller otomatik taranir (cmd, PowerShell, Git Bash, WSL vb.) ve varsayilan terminal secilir
- **Sutun Yapilandirmasi:** Gorev tablosunda gorunecek sutunlar surukle-birak ile siralanir, yeni sutun eklenebilir
- **Claude Plugin:** Claude Code plugin kurulumu aktif veya pasif olarak secilir, kurulacak dosyalar onizlenir
- **Ozet ve Olusturma:** Tum tercihlerin ozeti gosterilir, onay sonrasi proje plani olusturulur

### 1.7 Veri Saklama

Proje verisi guvenli ve tutarli sekilde saklanir.

- JSON formatinda depolama
- Eski Markdown formatindan (KAIROS.md) yeni JSON formatina (data.json) otomatik gecis
- Degisiklikler 800 milisaniye gecikmeli otomatik kaydedilir
- Kaydetme durumu (kaydediliyor, kaydedildi, kaydedilmedi) arayuzde gosterilir
- Proje dizinindeki dosya degisiklikleri izlenir ve veri otomatik yeniden yuklenir
- Veri dosyasi silindiginde kurulum sayfasina otomatik yonlendirilir

### 1.8 Erisim ve Gorunum

Eklenti iki farkli gorunum modunda acilabilir.

- **Sekme Gorunumu:** Kairos ayri bir sekmede acilir, editoru kapatmadan plan uzerinde calisilir
- **Kenar Cubugu Gorunumu:** VS Code kenar cubugunda kalici olarak acik kalir, kod yazarken plana hizlica bakilir
- VS Code komut paletinden "Kairos: Open (Tab)" veya "Kairos: Open in Sidebar" ile acilir
- Etkinlik cubugundaki Kairos ikonu ile kenar cubugu gorunumune erisilir

### 1.9 Tema ve Dil

- VS Code'un aktif temasina (acik veya koyu) otomatik uyum saglar
- Tum renkler, kenarliklar ve arka planlar tema degiskenlerinden turetilir
- Tum arayuz metinleri Turkcedir
- Tarihler Turkce yerel ayarla bicimlenir (ornegin "15 Subat 2026")

---

## FAZ 2 — ILERI OZELLIKLER

Temel plan editorunun uzerine insa edilen, gelistirme surecini zenginlestiren ozellikler.

### 2.1 Git Entegrasyonu

Versiyon kontrol islemleri dogrudan Kairos arayuzunden yapilabilir.

**Durum Gostergesi**
- Aktif dal adi baslik cubugunda gosterilir
- Degisen dosya sayisi rozet olarak goruntulenir
- Uzak sunucudan ileride veya geride olunan commit sayisi ok isaretleriyle belirtilir
- Durum her 5 saniyede otomatik yenilenir

**Git Islemleri**
- Dal rozetine tiklandiginda Git yonetim paneli acilir
- Degisen dosyalar durum ikonlariyla listelenir (Degistirildi, Eklendi, Silindi, Yeniden Adlandirildi, Takipsiz)
- Ozel mesajla commit olusturma
- Uzak sunucuya gonderme (push)
- Uzak sunucudan cekme (pull)
- Her islem sonrasi durum otomatik guncellenir

### 2.2 PRD ve Dokumantasyon Yonetimi

Proje gereksinim dokumanlari gorevlerle iliskilendirilebilir.

**Dosya Referanslama**
- Gorevlerin PRD sutununda herhangi bir proje dosyasina ve satir araligina referans verilebilir
- Dosya adi ve satir araligini iceren format desteklenir (dosya.md:5-10)
- Eski format geriye uyumlu olarak calisir

**Satir Secici**
- PRD ikonuna tiklandiginda interaktif bir modal acilir
- Dosya icerigi satir numaralariyla goruntulenir
- Tiklanarak baslangic ve bitis satiri secilir
- Secilen aralik gorsel olarak vurgulanir
- VS Code dosya secicisi ile farkli dosyalar arasinda gecis yapilabilir

**Icerik Duzenleme**
- Referans verilen satir araliklari dogrudan Kairos icerisinden duzenlenebilir

### 2.3 Istatistik ve Ilerleme Paneli

Projenin genel durumunu gosteren canli bir gosterge paneli.

**Ilerleme Halkasi**
- Genel tamamlanma yuzdesi, gradient efektli buyuk bir halka grafiginde gosterilir
- Animasyonlu sayi sayaci ile yuzdeler canlandirilir

**Faz Ilerleme Cubuklari**
- Her faz icin yatay ilerleme cubugu: faz numarasi, adi, tamamlanma cubugu ve tamamlanan/toplam sayaci

**Tarih Grafigi**
- Gorev tarihlerinin dagilimini gosteren yumusak egrili alan grafigi
- Bugunku tarih kesikli dikey cizgi ve nokta ile isaretlenir
- Projedeki ilk ve son tarih arasindaki zaman dilimini kapsar

**Durum Ozeti**
- Tamamlanan, devam eden ve yapilmamis gorevlerin sayisal dokumu
- Istatistikler yalnizca yaprak gorevleri (alt gorevi olmayanlari) sayar, cifte sayimi onler

### 2.4 PDF Ciktisi

Proje planinin profesyonel gorunumlu PDF dosyasi olarak disari aktarilmasi.

- Proje adi, tarih ve faz bazli duzeni iceren cok sayfalik cikti
- Her faz kendi renk semasina uygun bicimlendirilir
- Gorev durumlari gorsel isaretcilerle gosterilir
- Turkce karakter destegi saglanir
- Kayit konumu kullanicinin sectigi dizindir

### 2.5 Arama ve Filtreleme

Gorevler arasinda hizli erisim saglayan arama.

- Ozellik adi, aciklama ve notlar uzerinden anlik filtreleme
- Yazildikca sonuclar guncellenir
- Alt gorevler ust gorev baglamiyla birlikte gosterilir
- Tek tikla arama temizlenir

### 2.6 Yedekleme ve Kurtarma

Proje verisinin guvenligini saglayan yedekleme mekanizmasi.

- Sifirlama islemi oncesinde otomatik yedek alinir
- Yedekler zaman damgasi ve dosya boyutuyla listelenir
- Tek tikla herhangi bir yedege geri donulebilir
- Yedekler proje dizininde saklanir

### 2.7 Ayarlar Sayfasi

Bes sekmeli kapsamli yapilandirma sayfasi.

- **Terminal:** Mevcut terminaller otomatik algilanir, varsayilan terminal secilir
- **Claude:** Ana komut ve ozellik komutu ayarlanir, plugin yonetilir, CLAUDE.md ve ARCHITECTURE.md duzenlenir
- **Sutunlar:** Sutun sirasi, adi ve tipi duzenlenir; yeni sutun eklenir veya mevcut silinir
- **Gorev Turleri:** Gorev turleri listelenir, yeni tur eklenir, mevcut turler duzenlenir veya silinir
- **Yedekler:** Yedek listesi goruntulenir, secilen yedekten geri yukleme yapilir

### 2.8 Bildirimler

Kullaniciya islem sonuclari hakkinda geri bildirim.

- PDF olusturma, yedek geri yukleme ve ayar kaydetme gibi islemler sonucunda bilgilendirme bildirimi gosterilir
- Hata durumlari aciklayici mesajlarla kullaniciya iletilir
- Uzun suren islemlerde yukleme gostergesi goruntulenir

---

## FAZ 3 — CLAUDE AI ENTEGRASYONU

Claude Code ile birlikte calisan yapay zeka destekli gelistirme ozellikleri.

### 3.1 Gorev Bazli Komut Calistirma

Her gorev icin Claude Code'a ozel komut gonderilebilir.

- Gorev satirindaki Claude butonu ile o goreve ozel komut calistirilir
- Komut sablonu ayarlardan ozellestirilebilir; gorev adi otomatik eklenir
- Komutlar VS Code entegre terminalinde calistirilir

### 3.2 Plugin Sistemi

Claude Code icin ozel Kairos komutlari kurar.

- Tek tikla Kairos pluginini projeye kurar
- Plugin ayarlardan veya kurulum sihirbaziyla kurulabilir

**Build Komutu (/kairos:build)**
- Verilen ozellik icin 3 katmanli bir agent takim olusturur
- Backend, API ve frontend katmanlari ayri ajanlara atanir
- Ajanlar birbirini bilgilendirir ve katman izolasyonuna uyar
- Gorev tamamlandiginda durum otomatik guncellenir

**Test Komutu (/kairos:test)**
- Proje testlerini calistirir
- Basarisiz testleri analiz eder ve sorunun kaynagini tespit eder
- Toplam, basarili, basarisiz ve atlanan test sayilarini raporlar

### 3.3 Proje Dokumani Duzenleyicileri

Ayarlar sayfasindan proje yonerge dosyalari dogrudan duzenlenebilir.

- CLAUDE.md dosyasini okuma ve yazma: Claude Code'un projeye ozel calisma kurallarini tanimlar
- ARCHITECTURE.md dosyasini okuma ve yazma: Projenin mimari yapisini tanimlar
- Degisiklikler aninda dosya sistemine kaydedilir

---

## FAZ 4 — OTONOM GOREV CALISTIRMA (Planlanmis)

Henuz gerceklestirilmemis, gelecekte eklenecek ozellikler. Bu fazin amaci Claude Code'u dogrudan Kairos icerisinden yonetmek ve gorevleri otomatik olarak tamamlatmaktir.

### 4.1 Tekli Gorev Calistirma

Claude CLI'i arka planda calistirip ciktiyi canli olarak Kairos arayuzune aktarma.

- Terminal yerine eklenti icerisinde canli cikti paneli
- Calistirma durumu gostergesi (calisiyor, bitti, hata)
- Durdurma butonu ile islem iptali
- Otomatik kaydirma ve terminal gorunumu

### 4.2 Gorev Kuyrugu

Birden fazla gorevi siraya koyup birbiri ardina otomatik calistirma.

- Tamamlanmamis gorevleri siraya ekleme
- Bir gorev bittiginde sonrakini otomatik baslatma
- Duraklatma, atlama ve durdurma kontrolleri
- Kuyruk ilerlemesini gosteren panel

### 4.3 Akilli Baglam

Her gorev icin zenginlestirilmis bilgi aktarimi.

- PRD icerigini ve satir referanslarini goreve otomatik ekleme
- Onceki gorevlerin sonuc ozetlerini sonraki gorevlere aktarma
- Proje yapisini ve kodlama kurallarini baglama dahil etme

### 4.4 Toplu Calistirma

Faz veya proje duzeyinde toplu gorev calistirma.

- Her faz basligindaki butonla o fazdaki tum tamamlanmamis gorevleri calistirma
- Tum projeyi tek tikla calistirma (faz sirasi korunarak)
- Calistirma oncesi hangi gorevlerin islenecegini gosteren on izleme
- Hata durumunda secenekler: tekrarla, atla, dur veya komutu duzenle
