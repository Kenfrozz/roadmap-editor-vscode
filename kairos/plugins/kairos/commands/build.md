---
description: Ozellik gelistirme - 3 katmanli agent team olusturur
argument-hint: "[ozellik aciklamasi] | PRD: [dosya:satir-araligi]"
disable-model-invocation: true
---

# Kairos Build

Kullanici bir ozellik gelistirmek istiyor: **$ARGUMENTS**

## Baglam Toplama

1. `CLAUDE.md` dosyasini oku (proje kurallari, mimari, konvansiyonlar)
2. `ARCHITECTURE.md` dosyasini oku (varsa)
3. Proje yapisini anlamak icin kok dizini ve ana kaynak klasorlerini tara

> **NOT:** PRD dosya yolu ve satir araligi argumanda verilmisse o dosyanin o satirlarini oku. Bu, gereksinim baglamini icerir — onceligin bu satirlarda olsun.

## Agent Team Olustur

3 teammate'li bir agent team kur. Gorev bagimliliklari: backend → api → frontend

CLAUDE.md'deki mimari kurallara ve proje yapisina gore her teammate'in calisma alanini ve kurallarini belirle.

### "backend" teammate
- **Calisma alani:** Projenin backend/is mantigi katmani
- CLAUDE.md'deki backend konvansiyonlarina uyar (dosya yapisi, isimlendirme, veri erisim kurallari)
- API ve frontend katmanlarina DOKUNMAZ
- Isi bitince "api" teammate'ine haber verir

### "api" teammate
- **Calisma alani:** Projenin API / kopru katmani (backend ile frontend arasindaki baglanti)
- Yeni endpoint, route, mesaj tipi veya arayuz tanimlarini ekler
- Backend dosyalarini okur ama DEGISTIRMEZ
- Backend'de eksik/hata varsa "backend" teammate'ine bildirir
- Hazir oldugunda "frontend" teammate'ine bildirir
- Backend ve frontend katmanlarina DOKUNMAZ (sadece okur)

### "frontend" teammate
- **Calisma alani:** Projenin frontend / UI katmani
- API katmani uzerinden cagri yapar, backend'i dogrudan import ETMEZ
- CLAUDE.md'deki frontend konvansiyonlarina uyar (bilesen yapisi, stil, state yonetimi)
- Ihtiyaci olan API yoksa "api" teammate'ine soyler
- Backend katmanina DOKUNMAZ

## Iletisim Akisi

```
backend biter → api'ye bildirir → api gunceller → frontend'e bildirir → frontend kullanir
frontend eksik API bulursa → api'ye soyler → api kontrol eder → gerekirse backend'e soyler
```

## Tamamlanma

Tum isler bittiginde:
1. `kairos/data.json`'daki ilgili gorevin durum sutununu guncelle
2. Team'i kapat ve kullaniciya ozet ver
