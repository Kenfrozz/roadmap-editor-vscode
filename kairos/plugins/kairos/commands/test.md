---
description: Testleri calistir ve sonuclari raporla
argument-hint: "[dosya-yolu veya modul-adi] (bos birakilirsa tumu)"
disable-model-invocation: true
---

# Kairos Test

Testleri calistir ve sonuclari raporla.

## Calistirma

Arguman verilmisse: `$ARGUMENTS`

- CLAUDE.md'den projenin test komutunu belirle
- Arguman bossa: tum testleri calistir
- Arguman bir dosya yoluysa: o dosyanin testlerini calistir
- Arguman bir modul adiysa: ilgili test dosyalarini bul ve calistir

## Hata Durumunda

Testler basarisiz olursa:
1. Hata mesajlarini analiz et
2. Basarisiz olan test dosyalarini ve ilgili kaynak dosyalari oku
3. Sorunun kaynagini tespit et
4. Duzeltme onerisi sun

## Rapor Formati

- Toplam test sayisi
- Basarili / Basarisiz / Atlanan
- Basarisiz testlerin listesi ve hata ozeti
