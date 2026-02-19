import { writeFile, ensureDir, getRoot } from '../_core/db';
import * as vscode from 'vscode';
import * as path from 'path';

// Plugin sablonlari
function marketplaceJson(): string {
  return JSON.stringify({
    name: 'kairos-marketplace',
    owner: {
      name: 'Kairos'
    },
    metadata: {
      description: 'Kairos proje yonetim plugin marketplace'
    },
    plugins: [
      {
        name: 'kairos',
        source: './plugins/kairos',
        description: 'Proje yonetim ve gelistirme araclari - build, test komutlari'
      }
    ]
  }, null, 2);
}

function pluginJson(): string {
  return JSON.stringify({
    name: 'kairos',
    description: 'Proje yonetim ve gelistirme araclari',
    version: '1.0.0'
  }, null, 2);
}

function buildMd(): string {
  return `---
description: Ozellik gelistirme - 3 katmanli agent team olusturur
argument-hint: "[ozellik aciklamasi] | PRD: [dosya:satir-araligi]"
disable-model-invocation: true
---

# Kairos Build

Kullanici bir ozellik gelistirmek istiyor: **$ARGUMENTS**

## Baglam Toplama

1. \`CLAUDE.md\` dosyasini oku (proje kurallari, mimari, konvansiyonlar)
2. \`ARCHITECTURE.md\` dosyasini oku (varsa)
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

\`\`\`
backend biter → api'ye bildirir → api gunceller → frontend'e bildirir → frontend kullanir
frontend eksik API bulursa → api'ye soyler → api kontrol eder → gerekirse backend'e soyler
\`\`\`

## Tamamlanma

Tum isler bittiginde:
1. \`kairos/data.json\`'daki ilgili gorevin durum sutununu guncelle
2. Team'i kapat ve kullaniciya ozet ver
`;
}

function testMd(): string {
  return `---
description: Testleri calistir ve sonuclari raporla
argument-hint: "[dosya-yolu veya modul-adi] (bos birakilirsa tumu)"
disable-model-invocation: true
---

# Kairos Test

Testleri calistir ve sonuclari raporla.

## Calistirma

Arguman verilmisse: \`$ARGUMENTS\`

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
`;
}

// Plugin dosyalarini workspace'e kurar ve Claude CLI ile marketplace + plugin kurulumu yapar
export async function execute(): Promise<{ created: string[] }> {
  const root = getRoot();
  const created: string[] = [];

  // Dizinleri olustur
  await ensureDir(path.join(root, 'kairos', '.claude-plugin'));
  await ensureDir(path.join(root, 'kairos', 'plugins', 'kairos', '.claude-plugin'));
  await ensureDir(path.join(root, 'kairos', 'plugins', 'kairos', 'commands'));

  // marketplace.json
  const mpPath = 'kairos/.claude-plugin/marketplace.json';
  await writeFile(mpPath, marketplaceJson());
  created.push(mpPath);

  // plugin.json
  const pjPath = 'kairos/plugins/kairos/.claude-plugin/plugin.json';
  await writeFile(pjPath, pluginJson());
  created.push(pjPath);

  // build.md
  const buildPath = 'kairos/plugins/kairos/commands/build.md';
  await writeFile(buildPath, buildMd());
  created.push(buildPath);

  // test.md
  const testPath = 'kairos/plugins/kairos/commands/test.md';
  await writeFile(testPath, testMd());
  created.push(testPath);

  // Claude CLI ile marketplace ekle ve plugin kur
  installViaTerminal();

  return { created };
}

function installViaTerminal(): void {
  const terminal = vscode.window.createTerminal({ name: 'Kairos Plugin Kurulum' });
  terminal.show();
  terminal.sendText('claude plugin marketplace remove kairos-marketplace 2>/dev/null; claude plugin marketplace add ./kairos && claude plugin install kairos@kairos-marketplace --scope project');
}
