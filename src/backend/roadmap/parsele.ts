import { RoadmapItem, ChangelogEntry, FazData, ParseResult, ColumnConfig, DEFAULT_COLUMNS } from '../../types';

const DEFAULT_FAZ_NAMES: Record<string, string> = {
  faz1: 'PLANLAMA & ALTYAPI',
  faz2: 'TEMEL GELİŞTİRME',
  faz3: 'İLERİ ÖZELLİKLER',
  faz4: 'TEST & YAYIN',
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ROADMAP.md icerigini parse eder
// [content] - Markdown dosya icerigi
// [columns] - Sutun yapilandirmasi
export function execute(content: string, columns?: ColumnConfig[]): ParseResult {
  const cols = columns || DEFAULT_COLUMNS;
  const data: FazData = {};
  const fazNames: Record<string, string> = {};
  const changelog: ChangelogEntry[] = [];
  const fazOrder: string[] = [];

  let currentFaz: string | null = null;
  let inChangelog = false;
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.match(/^## DEĞİŞİKLİK GEÇMİŞİ/i)) {
      inChangelog = true;
      currentFaz = null;
      continue;
    }

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

    if (line.match(/^## GENEL ÖZET/i)) {
      inChangelog = false;
      currentFaz = null;
      continue;
    }

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

    if (currentFaz && line.startsWith('|') && (line.includes('Özellik') || line.includes('Simge'))) {
      continue;
    }

    if (currentFaz && line.startsWith('|') && !line.includes('---')) {
      const rawCells = line.split('|').map(c => c.trim());
      const cells = rawCells.slice(1, rawCells[rawCells.length - 1] === '' ? -1 : undefined);
      if (cells.length >= 3) {
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

    if (currentFaz && (line.startsWith('**FAZ') || line.startsWith('**faz') || (line.startsWith('---') && data[currentFaz] && data[currentFaz].length > 0))) {
      currentFaz = null;
    }
  }

  return { data, fazNames, changelog, fazOrder };
}
