import { RoadmapItem, ChangelogEntry, FazData, ParseResult, FazConfig, ColumnConfig, DEFAULT_COLUMNS } from './types';

const DEFAULT_FAZ_NAMES: Record<string, string> = {
  faz1: 'PLANLAMA & ALTYAPI',
  faz2: 'TEMEL GELİŞTİRME',
  faz3: 'İLERİ ÖZELLİKLER',
  faz4: 'TEST & YAYIN',
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function parseMD(content: string, columns?: ColumnConfig[]): ParseResult {
  const cols = columns || DEFAULT_COLUMNS;
  const data: FazData = {};
  const fazNames: Record<string, string> = {};
  const changelog: ChangelogEntry[] = [];
  const fazOrder: string[] = [];

  let currentFaz: string | null = null;
  let inChangelog = false;
  const lines = content.split('\n');

  for (const line of lines) {
    // Değişiklik geçmişi başlığı
    if (line.match(/^## DEĞİŞİKLİK GEÇMİŞİ/i)) {
      inChangelog = true;
      currentFaz = null;
      continue;
    }

    // Değişiklik geçmişi satırı
    if (inChangelog && line.startsWith('|') && !line.includes('---') && !line.includes('Tarih')) {
      const rawCells = line.split('|').map(c => c.trim());
      const cells = rawCells.slice(1, rawCells[rawCells.length - 1] === '' ? -1 : undefined);
      if (cells.length >= 2) {
        changelog.push({
          id: generateId(),
          tarih: cells[0] || '',
          degisiklik: cells[1] || '',
        });
      }
      continue;
    }

    // GENEL ÖZET başlığı - changelog'u bitir
    if (line.match(/^## GENEL ÖZET/i)) {
      inChangelog = false;
      currentFaz = null;
      continue;
    }

    // Faz başlığını bul
    const fazMatchClassic = line.match(/^## (?:\d+\s*[-—–]\s*)?(FAZ\s*(\d+)[^|]*)/i);
    const fazMatchNumbered = !fazMatchClassic && line.match(/^## (\d+)\s*[-—–]\s*(.+)/);
    if (fazMatchClassic) {
      inChangelog = false;
      const fazName = fazMatchClassic[1].trim();
      const fazNum = fazMatchClassic[2];
      currentFaz = `faz${fazNum}`;
      fazNames[currentFaz] = fazName;
      if (!data[currentFaz]) data[currentFaz] = [];
      if (!fazOrder.includes(currentFaz)) fazOrder.push(currentFaz);
      continue;
    }
    if (fazMatchNumbered) {
      inChangelog = false;
      const fazNum = fazMatchNumbered[1];
      const fazName = fazMatchNumbered[2].trim();
      currentFaz = `faz${parseInt(fazNum)}`;
      fazNames[currentFaz] = fazName;
      if (!data[currentFaz]) data[currentFaz] = [];
      if (!fazOrder.includes(currentFaz)) fazOrder.push(currentFaz);
      continue;
    }

    // Tablo header satırını atla
    if (currentFaz && line.startsWith('|') && (line.includes('Özellik') || line.includes('Simge'))) {
      continue;
    }

    // Tablo satırını parse et — dinamik sutunlara gore
    if (currentFaz && line.startsWith('|') && !line.includes('---')) {
      const rawCells = line.split('|').map(c => c.trim());
      const cells = rawCells.slice(1, rawCells[rawCells.length - 1] === '' ? -1 : undefined);
      if (cells.length >= 3) {
        // Ilk hucre numara mi kontrolu
        const hasNoColumn = cells.length > cols.length && /^\d+$/.test(cells[0]);
        const off = hasNoColumn ? 1 : 0;

        const item: RoadmapItem = { id: generateId() };
        cols.forEach((col, i) => {
          const cellVal = cells[off + i] || '';
          if (col.type === 'status') {
            item[col.key] = cellVal || '-';
          } else {
            item[col.key] = cellVal;
          }
        });

        data[currentFaz].push(item);
      }
    }

    // Faz sonu
    if (currentFaz && (line.startsWith('**FAZ') || line.startsWith('**faz') || (line.startsWith('---') && data[currentFaz] && data[currentFaz].length > 0))) {
      currentFaz = null;
    }
  }

  return { data, fazNames, changelog, fazOrder };
}

export function generateMD(
  inputData: Record<string, unknown>,
  fazConfig?: Record<string, FazConfig>,
  columns?: ColumnConfig[]
): string {
  const cols = columns || DEFAULT_COLUMNS;

  // _fazConfig ve _changelog'u data'dan ayır
  const cleanData: FazData = {};
  const changelogData: ChangelogEntry[] = (inputData._changelog as ChangelogEntry[] | undefined) || [];

  for (const [key, value] of Object.entries(inputData)) {
    if (key.startsWith('faz') && Array.isArray(value)) {
      cleanData[key] = value as RoadmapItem[];
    }
  }

  // Faz isimlerini belirle
  const fazNames: Record<string, string> = {};
  if (fazConfig) {
    for (const [key, config] of Object.entries(fazConfig)) {
      if (config && config.name) {
        fazNames[key] = config.name;
      }
    }
  }

  // Eksik faz isimlerini varsayılanlarla doldur
  for (const key of Object.keys(cleanData)) {
    if (!fazNames[key]) {
      fazNames[key] = DEFAULT_FAZ_NAMES[key] || 'YENİ FAZ';
    }
  }

  let md = `# Geliştirme Roadmap

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

  // Fazları sırala: _fazOrder varsa onu kullan, yoksa numerik siralama
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

  // Header satiri icin sutun label'lari
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

    // Faz durumu — sadece status sutunlarini say
    const statusCols = cols.filter(c => c.type === 'status');
    if (statusCols.length > 0) {
      const done = rows.filter(r => statusCols.every(sc => r[sc.key] === '✅')).length;
      md += `\n**${fazKey.toUpperCase()} Durumu:** ${done}/${rows.length} tamamlandı\n\n---\n\n`;
    } else {
      md += `\n---\n\n`;
    }
  }

  // İstatistikler — sadece status sutunlari
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

  md += `
---

## DEĞİŞİKLİK GEÇMİŞİ

| Tarih | Değişiklik |
|-------|------------|
`;

  if (changelogData.length > 0) {
    for (const entry of changelogData) {
      const tarih = (entry.tarih || '').replace(/\|/g, '\\|');
      const degisiklik = (entry.degisiklik || '').replace(/\|/g, '\\|');
      md += `| ${tarih} | ${degisiklik} |\n`;
    }
  } else {
    md += `| ${new Date().toISOString().split('T')[0]} | Roadmap oluşturuldu |\n`;
  }

  return md;
}
