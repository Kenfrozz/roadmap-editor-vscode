---
description: Özellik geliştirme - 3 katmanlı agent team oluşturur
argument-hint: "[özellik açıklaması] | PRD: [dosya:satır-aralığı]"
disable-model-invocation: true
---

# Kairos Build

Kullanıcı bir özellik geliştirmek istiyor: **$ARGUMENTS**

## Bağlam Toplama

1. `CLAUDE.md` dosyasını oku (proje kuralları, mimari, konvansiyonlar)
2. `ARCHITECTURE.md` dosyasını oku (varsa)
3. Proje yapısını anlamak için kök dizini ve ana kaynak klasörlerini tara

> **NOT:** PRD dosya yolu ve satır aralığı argümanda verilmişse o dosyanın o satırlarını oku. Bu, gereksinim bağlamını içerir — önceliğin bu satırlarda olsun.

## Agent Team Oluştur

3 teammate'li bir agent team kur. Görev bağımlılıkları: backend → api → frontend

CLAUDE.md'deki mimari kurallara ve proje yapısına göre her teammate'in çalışma alanını ve kurallarını belirle.

### "backend" teammate
- **Çalışma alanı:** Projenin backend/iş mantığı katmanı
- CLAUDE.md'deki backend konvansiyonlarına uyar (dosya yapısı, isimlendirme, veri erişim kuralları)
- API ve frontend katmanlarına DOKUNMAZ
- İşi bitince "api" teammate'ine haber verir

### "api" teammate
- **Çalışma alanı:** Projenin API / köprü katmanı (backend ile frontend arasındaki bağlantı)
- Yeni endpoint, route, mesaj tipi veya arayüz tanımlarını ekler
- Backend dosyalarını okur ama DEĞİŞTİRMEZ
- Backend'de eksik/hata varsa "backend" teammate'ine bildirir
- Hazır olduğunda "frontend" teammate'ine bildirir
- Backend ve frontend katmanlarına DOKUNMAZ (sadece okur)

### "frontend" teammate
- **Çalışma alanı:** Projenin frontend / UI katmanı
- API katmanı üzerinden çağrı yapar, backend'i doğrudan import ETMEZ
- CLAUDE.md'deki frontend konvansiyonlarına uyar (bileşen yapısı, stil, state yönetimi)
- İhtiyacı olan API yoksa "api" teammate'ine söyler
- Backend katmanına DOKUNMAZ

## İletişim Akışı

```
backend biter → api'ye bildirir → api günceller → frontend'e bildirir → frontend kullanır
frontend eksik API bulursa → api'ye söyler → api kontrol eder → gerekirse backend'e söyler
```

## Tamamlanma

Tüm işler bittiğinde:
1. `kairos/data.json`'daki ilgili görevin durum sütununu güncelle
2. Team'i kapat ve kullanıcıya özet ver
