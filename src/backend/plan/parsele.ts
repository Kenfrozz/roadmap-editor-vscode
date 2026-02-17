import { RoadmapItem, FazData, ParseResult, ColumnConfig, DEFAULT_COLUMNS, EkTabloItem } from '../../types';

const DEFAULT_FAZ_NAMES: Record<string, string> = {
  faz1: 'PLANLAMA & ALTYAPI',
  faz2: 'TEMEL GELİŞTİRME',
  faz3: 'İLERİ ÖZELLİKLER',
  faz4: 'TEST & YAYIN',
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// KAIROS.md icerigini parse eder
// [content] - Markdown dosya icerigi
// [columns] - Sutun yapilandirmasi
export function execute(content: string, columns?: ColumnConfig[]): ParseResult {
  const cols = columns || DEFAULT_COLUMNS;
  const data: FazData = {};
  const fazNames: Record<string, string> = {};
  const fazOrder: string[] = [];

  let currentFaz: string | null = null;
  let inChangelog = false;
  let inHatalar = false;
  let inDegisiklikler = false;
  const hatalar: EkTabloItem[] = [];
  const degisiklikler: EkTabloItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.match(/^## DEĞİŞİKLİK GEÇMİŞİ/i)) {
      inChangelog = true;
      inHatalar = false;
      inDegisiklikler = false;
      currentFaz = null;
      continue;
    }

    if (line.match(/^##\s.*Hatalar/i)) {
      inHatalar = true;
      inDegisiklikler = false;
      inChangelog = false;
      currentFaz = null;
      continue;
    }

    if (line.match(/^##\s.*Değişiklikler/i) || line.match(/^##\s.*Degisiklikler/i)) {
      inDegisiklikler = true;
      inHatalar = false;
      inChangelog = false;
      currentFaz = null;
      continue;
    }

    if (inHatalar && line.startsWith('|') && !line.includes('---') && !line.includes('Başlık')) {
      const rawCells = line.split('|').map(c => c.trim());
      const cells = rawCells.slice(1, rawCells[rawCells.length - 1] === '' ? -1 : undefined);
      if (cells.length >= 2) {
        hatalar.push({ id: generateId(), baslik: cells[0], aciklama: cells[1] || '' });
      }
      continue;
    }

    if (inDegisiklikler && line.startsWith('|') && !line.includes('---') && !line.includes('Başlık')) {
      const rawCells = line.split('|').map(c => c.trim());
      const cells = rawCells.slice(1, rawCells[rawCells.length - 1] === '' ? -1 : undefined);
      if (cells.length >= 2) {
        degisiklikler.push({ id: generateId(), baslik: cells[0], aciklama: cells[1] || '' });
      }
      continue;
    }

    if (inChangelog && line.startsWith('|')) {
      continue;
    }

    if (line.match(/^## GENEL ÖZET/i)) {
      inChangelog = false;
      inHatalar = false;
      inDegisiklikler = false;
      currentFaz = null;
      continue;
    }

    const fazMatchClassic = line.match(/^## (?:\d+\s*[-—–]\s*)?(FAZ\s*(\d+)[^|]*)/i);
    const fazMatchNumbered = !fazMatchClassic && line.match(/^## (\d+)\s*[-—–]\s*(.+)/);
    if (fazMatchClassic) {
      inChangelog = false;
      inHatalar = false;
      inDegisiklikler = false;
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
      inHatalar = false;
      inDegisiklikler = false;
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

  return { data, fazNames, fazOrder, hatalar, degisiklikler };
}
