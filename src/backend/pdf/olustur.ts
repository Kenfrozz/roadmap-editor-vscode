import * as path from 'path';
import PDFDocument from 'pdfkit';
import { PdfExportPayload, ColumnConfig, FazConfig, RoadmapItem } from '../../types';
import { writeFileBinary } from '../_core/db';

// ═══════════════════════ DESIGN TOKENS ═══════════════════════

const P = {
  ink:     '#0f172a',
  body:    '#334155',
  muted:   '#94a3b8',
  subtle:  '#e2e8f0',
  light:   '#f1f5f9',
  surface: '#f8fafc',
  emerald: '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
};

const BG_HEX: Record<string, string> = {
  'bg-teal-500':    '#14b8a6',
  'bg-violet-500':  '#8b5cf6',
  'bg-rose-500':    '#f43f5e',
  'bg-amber-500':   '#f59e0b',
  'bg-emerald-500': '#10b981',
  'bg-cyan-500':    '#06b6d4',
  'bg-pink-500':    '#ec4899',
  'bg-indigo-500':  '#6366f1',
};

const STATUS_HEX: Record<string, string> = {
  '✅':  P.emerald,
  '⚠️': P.amber,
  '❌':  P.red,
  '-':   P.subtle,
};

// A4 Portrait
const PW = 595.28;
const PH = 841.89;
const PAGE_SIZE: [number, number] = [PW, PH];
const MG = 40;
const CW = PW - MG * 2;
const FOOTER_Y = PH - 44;

// ═══════════════════════ HELPERS ═══════════════════════

interface FazStat {
  name: string;
  hex: string;
  total: number;
  done: number;
  wip: number;
  todo: number;
}

function fazHex(c: FazConfig): string {
  return BG_HEX[c.bg] || '#6b7280';
}

function fmtDate(v: string): string {
  if (!v) return '';
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

function strokeArc(
  doc: PDFKit.PDFDocument,
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number,
  color: string, lineW: number,
): void {
  if (Math.abs(endDeg - startDeg) < 0.5) return;
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const n = Math.max(Math.ceil(Math.abs(endDeg - startDeg) / 2), 8);

  doc.save();
  doc.moveTo(cx + r * Math.cos(s), cy + r * Math.sin(s));
  for (let i = 1; i <= n; i++) {
    const t = s + (e - s) * (i / n);
    doc.lineTo(cx + r * Math.cos(t), cy + r * Math.sin(t));
  }
  doc.lineWidth(lineW).strokeColor(color).lineCap('round').stroke();
  doc.restore();
}

// Sayfa kirma: yer yoksa yeni sayfa ac, yeni Y dondur
function ensureSpace(doc: PDFKit.PDFDocument, curY: number, needed: number): number {
  if (curY + needed > FOOTER_Y) {
    doc.addPage({ size: PAGE_SIZE, margin: 0 });
    return MG;
  }
  return curY;
}

// ═══════════════════════ FOOTER ═══════════════════════

function drawFooter(doc: PDFKit.PDFDocument, page: number, total: number): void {
  const y = PH - 34;
  doc.save();
  doc.moveTo(MG, y - 8).lineTo(PW - MG, y - 8)
    .lineWidth(0.5).strokeColor(P.subtle).stroke();
  doc.font('Regular').fontSize(7).fillColor(P.muted);
  doc.text(`Sayfa ${page} / ${total}`, MG, y, { width: CW, align: 'right' });
  doc.restore();
}

// ═══════════════════════ COVER PAGE ═══════════════════════

function drawCover(
  doc: PDFKit.PDFDocument,
  projectName: string,
  projectDate: string,
  fazList: FazStat[],
  total: number, done: number, wip: number, todo: number,
  pct: number,
): void {
  // ── Cok renkli ust aksent cizgisi ──
  const barH = 5;
  if (fazList.length > 0) {
    const segW = CW / fazList.length;
    for (let i = 0; i < fazList.length; i++) {
      doc.rect(MG + i * segW, MG, segW + 0.5, barH).fillColor(fazList[i].hex).fill();
    }
  } else {
    doc.rect(MG, MG, CW, barH).fillColor(P.ink).fill();
  }

  let y = MG + barH + 32;

  // ── Proje adi (buyuk harf) ──
  const upperName = projectName.toLocaleUpperCase('tr-TR');
  doc.font('Bold').fontSize(26).fillColor(P.ink);
  doc.text(upperName, MG, y, { width: CW });
  y += doc.heightOfString(upperName, { width: CW, fontSize: 26 }) + 14;

  // ── Alt baslik badge ──
  const subText = 'PROJE YOL HAR\u0130TASI';
  const charSpacing = 1.5;
  doc.font('Bold').fontSize(8);
  const subW = doc.widthOfString(subText) + charSpacing * subText.length + 20;
  doc.roundedRect(MG, y, subW, 20, 3).fillColor(P.ink).fill();
  doc.font('Bold').fontSize(8).fillColor('#ffffff');
  doc.text(subText, MG + 10, y + 6, { lineBreak: false, characterSpacing: charSpacing });
  y += 32;

  // ── Tarih ──
  doc.font('Regular').fontSize(9).fillColor(P.muted);
  doc.text(projectDate, MG, y);
  y += 30;

  // ── Ince ayirici ──
  doc.moveTo(MG, y).lineTo(PW - MG, y)
    .lineWidth(0.5).strokeColor(P.subtle).stroke();
  y += 36;

  // ── PROGRESS RING (ortalanmis, hero eleman) ──
  const ringR = 52;
  const ringW = 8;
  const ringCX = PW / 2;
  const ringCY = y + ringR + 4;

  // Arka plan halka
  strokeArc(doc, ringCX, ringCY, ringR, 0, 360, P.subtle, ringW);
  // Dolu halka
  if (pct > 0) {
    const ringColor = pct >= 70 ? P.emerald : pct >= 40 ? P.amber : P.red;
    strokeArc(doc, ringCX, ringCY, ringR, 0, 3.6 * pct, ringColor, ringW);
  }
  // Yuzde (tam ortada)
  const pctStr = `%${pct}`;
  doc.font('Bold').fontSize(26).fillColor(P.ink);
  const pctW = doc.widthOfString(pctStr);
  const pctH = doc.currentLineHeight();
  doc.text(pctStr, ringCX - pctW / 2, ringCY - pctH / 2 - 4, { lineBreak: false });
  // Alt etiket
  doc.font('Regular').fontSize(7.5).fillColor(P.muted);
  const lbl = 'TAMAMLANDI';
  const lblW = doc.widthOfString(lbl);
  doc.text(lbl, ringCX - lblW / 2, ringCY + pctH / 2 + 1, { lineBreak: false });

  y = ringCY + ringR + 30;

  // ── ISTATISTIK KARTLARI (4'lu satir) ──
  const gap = 10;
  const cardW = (CW - gap * 3) / 4;
  const cardH = 72;
  const cards = [
    { val: total, label: 'TOPLAM\n\u00D6ZELL\u0130K', accent: P.ink },
    { val: done,  label: 'TAMAMLANDI', accent: P.emerald },
    { val: wip,   label: 'DEVAM\nED\u0130YOR', accent: P.amber },
    { val: todo,  label: 'YAPILMADI', accent: P.red },
  ];

  for (let i = 0; i < cards.length; i++) {
    const cx = MG + i * (cardW + gap);
    const c = cards[i];
    doc.roundedRect(cx, y, cardW, cardH, 5).fillColor(P.surface).fill();
    doc.roundedRect(cx, y, cardW, cardH, 5).lineWidth(0.5).strokeColor(P.subtle).stroke();
    // Ust aksent cizgisi
    doc.rect(cx + 10, y + 8, 18, 2.5).fillColor(c.accent).fill();
    // Buyuk rakam
    doc.font('Bold').fontSize(24).fillColor(P.ink);
    doc.text(c.val.toString(), cx + 10, y + 18, { width: cardW - 20 });
    // Etiket
    doc.font('Regular').fontSize(6.5).fillColor(P.muted);
    doc.text(c.label, cx + 10, y + 48, { width: cardW - 20, lineGap: 1.5 });
  }

  y += cardH + 32;

  // ── Ayirici ──
  doc.moveTo(MG, y).lineTo(PW - MG, y)
    .lineWidth(0.5).strokeColor(P.subtle).stroke();
  y += 24;

  // ── FAZ DAGILIMI (tam genislik) ──
  doc.font('Bold').fontSize(9).fillColor(P.ink);
  doc.text('FAZ DA\u011EILIMI', MG, y, { characterSpacing: 1 });
  y += 22;

  for (const fs of fazList) {
    // Renkli nokta
    doc.circle(MG + 5, y + 5.5, 4).fillColor(fs.hex).fill();

    // Faz adi
    doc.font('Regular').fontSize(8.5).fillColor(P.body);
    doc.text(fs.name, MG + 18, y, { width: CW - 130, lineBreak: false, ellipsis: true });

    // Sayi ve yuzde (sag taraf)
    const pctFaz = fs.total > 0 ? Math.round((fs.done / fs.total) * 100) : 0;
    doc.font('Bold').fontSize(8.5).fillColor(P.ink);
    doc.text(`${fs.done}/${fs.total}`, PW - MG - 80, y, { width: 36, align: 'right', lineBreak: false });
    doc.font('Regular').fontSize(7.5).fillColor(P.muted);
    doc.text(`%${pctFaz}`, PW - MG - 38, y + 0.5, { width: 38, align: 'right', lineBreak: false });

    // Progress bar (tam genislik)
    const bx = MG + 18;
    const by = y + 16;
    const bw = CW - 18;
    doc.roundedRect(bx, by, bw, 2.5, 1.25).fillColor(P.subtle).fill();
    if (fs.total > 0 && fs.done > 0) {
      const fw = Math.max((bw * fs.done) / fs.total, 3);
      doc.roundedRect(bx, by, fw, 2.5, 1.25).fillColor(fs.hex).fill();
    }
    y += 28;
  }
}

// ═══════════════════════ PHASE HEADER (CARD) ═══════════════════════

const PHASE_HEADER_H = 58;

function drawPhaseHeader(
  doc: PDFKit.PDFDocument,
  stat: FazStat,
  y: number,
): void {
  const hex = stat.hex;
  const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;

  // Kart arka plan (acik faz rengi)
  doc.save();
  doc.roundedRect(MG, y, CW, PHASE_HEADER_H, 6)
    .fillOpacity(0.04).fillColor(hex).fill();
  doc.fillOpacity(1);
  doc.restore();
  // Kart border
  doc.save();
  doc.roundedRect(MG, y, CW, PHASE_HEADER_H, 6)
    .lineWidth(0.5).strokeOpacity(0.15).strokeColor(hex).stroke();
  doc.strokeOpacity(1);
  doc.restore();

  // Sol aksent bar (kalin)
  doc.roundedRect(MG, y, 5, PHASE_HEADER_H, 3).fillColor(hex).fill();

  // Faz adi
  doc.font('Bold').fontSize(14).fillColor(P.ink);
  doc.text(stat.name, MG + 18, y + 10, { width: CW - 120 });

  // Alt metin: ozellik sayisi
  doc.font('Regular').fontSize(8.5).fillColor(P.muted);
  doc.text(
    `${stat.total} \u00f6zellik \u00b7 ${stat.done} tamamland\u0131`,
    MG + 18, y + 30,
    { width: 300 },
  );

  // Progress bar (kart icinde)
  const pbX = MG + 18;
  const pbY = y + PHASE_HEADER_H - 10;
  const pbW = CW - 120;
  const pbH = 3;
  doc.roundedRect(pbX, pbY, pbW, pbH, 1.5).fillColor(P.subtle).fill();
  if (pct > 0) {
    const fw = Math.max((pbW * pct) / 100, 3);
    doc.roundedRect(pbX, pbY, fw, pbH, 1.5).fillColor(hex).fill();
  }

  // Sag taraf: mini progress ring
  const ringR = 18;
  const ringW = 4;
  const ringCX = PW - MG - 36;
  const ringCY = y + PHASE_HEADER_H / 2;

  strokeArc(doc, ringCX, ringCY, ringR, 0, 360, P.subtle, ringW);
  if (pct > 0) {
    strokeArc(doc, ringCX, ringCY, ringR, 0, 3.6 * pct, hex, ringW);
  }
  doc.font('Bold').fontSize(9).fillColor(P.ink);
  const pctStr = `%${pct}`;
  const pw = doc.widthOfString(pctStr);
  doc.text(pctStr, ringCX - pw / 2, ringCY - 5, { lineBreak: false });
}

// ═══════════════════════ PHASE BLOCK ═══════════════════════
// Fazi cizer ve yeni curY dondurur (sayfa kirma dahili)

function drawPhaseBlock(
  doc: PDFKit.PDFDocument,
  cfg: FazConfig,
  items: RoadmapItem[],
  columns: ColumnConfig[],
  stat: FazStat,
  curY: number,
): number {
  const hex = stat.hex;
  const rowH = 26;
  const tableHeaderH = 24;

  // Faz basligi + tablo basligi + en az 1 satir icin yer kontrol
  const minNeeded = PHASE_HEADER_H + 10 + tableHeaderH + rowH;
  let y = ensureSpace(doc, curY, minNeeded);

  // Faz basligi ciz
  drawPhaseHeader(doc, stat, y);
  y += PHASE_HEADER_H + 10;

  // Bos faz
  if (items.length === 0) {
    doc.font('Regular').fontSize(9).fillColor(P.muted);
    doc.text('Bu fazda hen\u00fcz \u00f6zellik yok.', MG + 18, y);
    return y + 24;
  }

  // Tablo
  const colWidths = computeColWidths(columns, CW);
  y = drawTableHeader(doc, columns, colWidths, y, hex);

  for (let ri = 0; ri < items.length; ri++) {
    if (y + rowH > FOOTER_Y) {
      doc.addPage({ size: PAGE_SIZE, margin: 0 });
      // Devam sayfasi mini baslik
      doc.roundedRect(MG, MG, CW, 18, 4).fillColor(P.light).fill();
      doc.rect(MG, MG, 4, 18).fillColor(hex).fill();
      doc.font('Regular').fontSize(7.5).fillColor(P.muted);
      doc.text(`${cfg.name} (devam)`, MG + 12, MG + 4);
      y = MG + 24;
      y = drawTableHeader(doc, columns, colWidths, y, hex);
    }
    drawTableRow(doc, items[ri], columns, colWidths, y, rowH, ri % 2 === 1);
    y += rowH;
  }

  // Alt cizgi
  doc.moveTo(MG, y).lineTo(PW - MG, y)
    .lineWidth(0.5).strokeColor(P.subtle).stroke();

  return y + 20; // fazlar arasi bosluk
}

// ═══════════════════════ TABLE ═══════════════════════

function computeColWidths(columns: ColumnConfig[], totalW: number): number[] {
  const widths: number[] = [];
  let fixed = 0;
  let flex = 0;

  for (const col of columns) {
    if (col.type === 'status') { widths.push(36); fixed += 36; }
    else if (col.type === 'date') { widths.push(60); fixed += 60; }
    else if (col.key === 'prd') { widths.push(48); fixed += 48; }
    else { widths.push(0); flex++; }
  }

  const rem = totalW - fixed;
  const flexW = flex > 0 ? rem / flex : 0;
  return widths.map(w => (w === 0 ? flexW : w));
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  columns: ColumnConfig[],
  widths: number[],
  y: number,
  accentColor: string,
): number {
  const h = 24;
  doc.rect(MG, y, CW, h).fillColor(P.light).fill();
  doc.rect(MG, y, 3, h).fillColor(accentColor).fill();

  let x = MG;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const w = widths[i];
    const center = col.type === 'status';
    const tx = center ? x : x + 10;
    const tw = center ? w : w - 16;

    doc.font('Bold').fontSize(7.5).fillColor(P.body);
    doc.text(col.label, tx, y + 8, { width: tw, align: center ? 'center' : 'left', lineBreak: false });
    x += w;
  }

  doc.moveTo(MG, y + h).lineTo(PW - MG, y + h)
    .lineWidth(0.5).strokeColor(P.subtle).stroke();
  return y + h;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  item: RoadmapItem,
  columns: ColumnConfig[],
  widths: number[],
  y: number,
  h: number,
  isZebra: boolean,
): void {
  if (isZebra) {
    doc.rect(MG, y, CW, h).fillColor(P.surface).fill();
  }
  doc.moveTo(MG, y + h).lineTo(PW - MG, y + h)
    .lineWidth(0.25).strokeColor(P.subtle).stroke();

  let x = MG;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const w = widths[i];
    const val = item[col.key] || '';

    if (col.type === 'status') {
      const hex = STATUS_HEX[val] || P.subtle;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = 7;

      // Renkli daire
      doc.circle(cx, cy, r).fillColor(hex).fill();

      // Beyaz ikon
      doc.save();
      doc.strokeColor('#ffffff').lineWidth(1.6).lineCap('round').lineJoin('round');

      if (val === '✅') {
        // Checkmark
        doc.moveTo(cx - 3.5, cy + 0.5).lineTo(cx - 1, cy + 3).lineTo(cx + 4, cy - 3).stroke();
      } else if (val === '⚠️') {
        // Sag ok (devam ediyor)
        doc.moveTo(cx - 3, cy).lineTo(cx + 2.5, cy).stroke();
        doc.moveTo(cx + 0.5, cy - 2.5).lineTo(cx + 3, cy).lineTo(cx + 0.5, cy + 2.5).stroke();
      } else if (val === '❌') {
        // X isareti
        doc.moveTo(cx - 2.5, cy - 2.5).lineTo(cx + 2.5, cy + 2.5).stroke();
        doc.moveTo(cx + 2.5, cy - 2.5).lineTo(cx - 2.5, cy + 2.5).stroke();
      } else {
        // Tire (N/A)
        doc.moveTo(cx - 3, cy).lineTo(cx + 3, cy).stroke();
      }
      doc.restore();

    } else if (col.type === 'date') {
      doc.font('Regular').fontSize(8).fillColor(P.body);
      doc.text(fmtDate(val), x + 10, y + 8, { width: w - 16, lineBreak: false, ellipsis: true });

    } else {
      const isFeature = col.key === 'ozellik';
      doc.font(isFeature ? 'Bold' : 'Regular').fontSize(8).fillColor(isFeature ? P.ink : P.body);
      doc.text(val, x + 10, y + 8, { width: w - 16, height: h - 10, lineBreak: false, ellipsis: true });
    }

    x += w;
  }
}

// ═══════════════════════ MAIN ═══════════════════════

export async function execute(payload: PdfExportPayload): Promise<string> {
  const { data, fazConfig, fazOrder, columns, projectName, projectDate } = payload;

  const fontDir = path.join(__dirname, 'fonts');
  const doc = new PDFDocument({
    size: PAGE_SIZE,
    bufferPages: true,
    margin: 0,
    info: {
      Title: `${projectName} \u2014 Proje Yol Haritas\u0131`,
    },
  });

  doc.registerFont('Regular', path.join(fontDir, 'Roboto-Regular.ttf'));
  doc.registerFont('Bold', path.join(fontDir, 'Roboto-Bold.ttf'));

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const ready = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Global istatistikler
  const statusCols = columns.filter(c => c.type === 'status');
  const fazStatMap = new Map<string, FazStat>();
  const fazList: FazStat[] = [];
  let totalAll = 0, doneAll = 0, wipAll = 0, todoAll = 0;

  for (const fk of fazOrder) {
    const cfg = fazConfig[fk];
    if (!cfg) continue;
    const items = data[fk] || [];
    let done = 0, wip = 0, todo = 0;
    for (const item of items) {
      if (statusCols.length > 0 && statusCols.every(sc => item[sc.key] === '✅')) done++;
      else if (statusCols.some(sc => item[sc.key] === '⚠️')) wip++;
      else todo++;
    }
    const stat: FazStat = { name: cfg.name, hex: fazHex(cfg), total: items.length, done, wip, todo };
    fazStatMap.set(fk, stat);
    fazList.push(stat);
    totalAll += items.length;
    doneAll += done;
    wipAll += wip;
    todoAll += todo;
  }

  const pctAll = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  // ===== KAPAK SAYFASI =====
  drawCover(doc, projectName, projectDate, fazList, totalAll, doneAll, wipAll, todoAll, pctAll);

  // ===== FAZ BLOKLARI (her faz yeni sayfada) =====
  for (const fk of fazOrder) {
    const cfg = fazConfig[fk];
    if (!cfg) continue;
    const items = data[fk] || [];
    const stat = fazStatMap.get(fk)!;

    doc.addPage({ size: PAGE_SIZE, margin: 0 });
    drawPhaseBlock(doc, cfg, items, columns, stat, MG);
  }

  // ===== SAYFA NUMARALARI =====
  const pages = doc.bufferedPageRange().count;
  for (let i = 0; i < pages; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, pages);
  }

  doc.end();
  const buf = await ready;

  const dateStr = projectDate.split('.').reverse().join('-');
  const safeName = projectName.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u0400-\u04FF]/g, '_');
  const filename = `${safeName}-${dateStr}.pdf`;

  await writeFileBinary(filename, buf);
  return filename;
}
