import { RoadmapItem, FazData, FazConfig, ColumnConfig, DEFAULT_COLUMNS, EkTabloItem } from '../../types';

// Roadmap verisinden Markdown dosyasi uretir
// [inputData] - Faz verileri + _changelog + _fazOrder
// [fazConfig] - Faz yapilandirmalari
// [columns] - Sutun yapilandirmasi
export function execute(
  inputData: Record<string, unknown>,
  fazConfig?: Record<string, FazConfig>,
  columns?: ColumnConfig[]
): string {
  const cols = columns || DEFAULT_COLUMNS;

  const cleanData: FazData = {};

  for (const [key, value] of Object.entries(inputData)) {
    if (key.startsWith('faz') && Array.isArray(value)) {
      cleanData[key] = value as RoadmapItem[];
    }
  }

  const fazNames: Record<string, string> = {};
  if (fazConfig) {
    for (const [key, config] of Object.entries(fazConfig)) {
      if (config && config.name) {
        fazNames[key] = config.name;
      }
    }
  }

  const DEFAULT_FAZ_NAMES: Record<string, string> = {
    faz1: 'PLANLAMA & ALTYAPI',
    faz2: 'TEMEL GELİŞTİRME',
    faz3: 'İLERİ ÖZELLİKLER',
    faz4: 'TEST & YAYIN',
  };

  for (const key of Object.keys(cleanData)) {
    if (!fazNames[key]) {
      fazNames[key] = DEFAULT_FAZ_NAMES[key] || 'YENİ FAZ';
    }
  }

  let md = `# Kairos Plan

> Bu dosya projenin mevcut durumunu ve yapılacak işleri takip eder.
> **Son Güncelleme:** ${new Date().toISOString().split('T')[0]}

---

## Durum Açıklamaları

| Simge | Anlam |
|-------|-------|
| ✅ | Tamamlandı |
| ⚠️ | Kısmi / Devam Ediyor |
| ❌ | Yapılmadı |
| - | Uygulanamaz |

---

`;

  const explicitOrder = inputData._fazOrder as string[] | undefined;
  const sortedFazKeys = explicitOrder && explicitOrder.length > 0
    ? explicitOrder.filter(k => k in cleanData)
    : Object.keys(cleanData)
        .filter(k => k.startsWith('faz'))
        .sort((a, b) => {
          const numA = parseInt(a.replace('faz', '')) || 0;
          const numB = parseInt(b.replace('faz', '')) || 0;
          return numA - numB;
        });

  const headerLabels = cols.map(c => c.label);
  const headerSeparators = cols.map(c => {
    const len = Math.max(c.label.length, 3);
    return '-'.repeat(len);
  });

  for (let fi = 0; fi < sortedFazKeys.length; fi++) {
    const fazKey = sortedFazKeys[fi];
    const rows = cleanData[fazKey] || [];
    const fazName = fazNames[fazKey] || fazKey.toUpperCase();
    const fazNo = String(fi + 1).padStart(2, '0');

    md += `## ${fazNo} — ${fazName}\n\n`;
    md += `| No | ${headerLabels.join(' | ')} |\n`;
    md += `|----|${headerSeparators.join('|')}|\n`;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cellValues = cols.map(col => {
        const val = (row[col.key] || '').replace(/\|/g, '\\|');
        if (col.type === 'status' && !val) return '-';
        return val;
      });
      md += `| ${i + 1} | ${cellValues.join(' | ')} |\n`;
    }

    const statusCols = cols.filter(c => c.type === 'status');
    if (statusCols.length > 0) {
      const done = rows.filter(r => statusCols.every(sc => r[sc.key] === '✅')).length;
      md += `\n**${fazKey.toUpperCase()} Durumu:** ${done}/${rows.length} tamamlandı\n\n---\n\n`;
    } else {
      md += `\n---\n\n`;
    }
  }

  // Hatalar bolumu
  const hatalar = (inputData._hatalar as EkTabloItem[]) || [];
  md += `## 🔴 Hatalar\n\n`;
  md += `| Başlık | Açıklama |\n`;
  md += `|--------|----------|\n`;
  for (const item of hatalar) {
    const b = (item.baslik || '').replace(/\|/g, '\\|');
    const a = (item.aciklama || '').replace(/\|/g, '\\|');
    md += `| ${b} | ${a} |\n`;
  }
  md += `\n---\n\n`;

  // Degisiklikler bolumu
  const degisiklikler = (inputData._degisiklikler as EkTabloItem[]) || [];
  md += `## 🟡 Değişiklikler\n\n`;
  md += `| Başlık | Açıklama |\n`;
  md += `|--------|----------|\n`;
  for (const item of degisiklikler) {
    const b = (item.baslik || '').replace(/\|/g, '\\|');
    const a = (item.aciklama || '').replace(/\|/g, '\\|');
    md += `| ${b} | ${a} |\n`;
  }
  md += `\n---\n\n`;

  const statusCols = cols.filter(c => c.type === 'status');
  let total = 0;
  const statusCounts: Record<string, number> = {};
  for (const sc of statusCols) statusCounts[sc.key] = 0;

  for (const fazKey of sortedFazKeys) {
    const rows = cleanData[fazKey] || [];
    for (const row of rows) {
      total++;
      for (const sc of statusCols) {
        if (row[sc.key] === '✅') statusCounts[sc.key]++;
      }
    }
  }

  md += `## GENEL ÖZET

| Kategori | Tamamlanan | Toplam | Yüzde |
|----------|------------|--------|-------|
`;
  for (const sc of statusCols) {
    const count = statusCounts[sc.key];
    md += `| ${sc.label} | ${count} | ${total} | %${total ? Math.round(count / total * 100) : 0} |\n`;
  }

  return md;
}
