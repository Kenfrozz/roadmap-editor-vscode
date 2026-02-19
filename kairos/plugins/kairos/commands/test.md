---
description: Flutter testlerini çalıştır ve sonuçları raporla
argument-hint: "[dosya-yolu veya modül-adı] (boş bırakılırsa tümü)"
disable-model-invocation: true
---

# Kairos Test

Flutter testlerini çalıştır ve sonuçları raporla.

## Çalıştırma

Argüman verilmişse: `$ARGUMENTS`

- Argüman boşsa: `flutter test` ile tüm testleri çalıştır
- Argüman bir dosya yoluysa: `flutter test $ARGUMENTS`
- Argüman bir modül adıysa (örn: "sohbetler"): `test/` altında o modülle ilgili test dosyalarını bul ve çalıştır

## Hata Durumunda

Testler başarısız olursa:
1. Hata mesajlarını analiz et
2. Başarısız olan test dosyalarını ve ilgili kaynak dosyaları oku
3. Sorunun kaynağını tespit et
4. Düzeltme önerisi sun

## Rapor Formatı

- Toplam test sayısı
- Başarılı / Başarısız / Atlanan
- Başarısız testlerin listesi ve hata özeti
