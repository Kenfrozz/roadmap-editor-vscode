// @deprecated — Yalnizca gocEt.ts tarafindan KAIROS.md → data.json gocunde kullanilir
import { RoadmapItem, FazData, ColumnConfig, DEFAULT_COLUMNS } from '../../types';

const DEFAULT_FAZ_NAMES: Record<string, string> = {
  faz1: 'PLANLAMA & ALTYAPI',
  faz2: 'TEMEL GELİŞTİRME',
  faz3: 'İLERİ ÖZELLİKLER',
  faz4: 'TEST & YAYIN',
};

interface ParseResult {
  data: FazData;
  fazNames: Record<string, string>;
  fazOrder: string[];
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// KAIROS.md icerigini parse eder
export function execute(content: string, columns?: ColumnConfig[]): ParseResult {
  const cols = columns || DEFAULT_COLUMNS;
  const data: FazData = {};
  const fazNames: Record<string, string> = {};
  const fazOrder: string[] = [];

  let currentFaz: string | null = null;
  const lines = content.split('\n');

  for (const line of lines) {
    // EkTablo bolumlerini atla
    if (line.match(/^## DEĞİŞİKLİK GEÇMİŞİ/i) || line.match(/^##\s.*Hatalar/i) || line.match(/^##\s.*Değişiklikler/i) || line.match(/^##\s.*Degisiklikler/i)) {
      currentFaz = null;
      continue;
    }

    if (line.match(/^## GENEL ÖZET/i)) {
      currentFaz = null;
      continue;
    }

    const fazMatchClassic = line.match(/^## (?:\d+\s*[-—–]\s*)?(FAZ\s*(\d+)[^|]*)/i);
    const fazMatchNumbered = !fazMatchClassic && line.match(/^## (\d+)\s*[-—–]\s*(.+)/);
    if (fazMatchClassic) {
      const fazName = fazMatchClassic[1].trim();
      const fazNum = fazMatchClassic[2];
      currentFaz = `faz${fazNum}`;
      fazNames[currentFaz] = fazName;
      if (!data[currentFaz]) data[currentFaz] = [];
      if (!fazOrder.includes(currentFaz)) fazOrder.push(currentFaz);
      continue;
    }
    if (fazMatchNumbered) {
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

  return { data, fazNames, fazOrder };
}
