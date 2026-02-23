import { readLineRange } from '../_core/db';
import { execute as parmakIzi } from './parmakIzi';
import { execute as satirDuzelt } from './satirDuzelt';

// Belirtilen dosyadan belirtilen satir araligini okur
// Hash varsa dogrular, uyusmazlikta otomatik duzeltme yapar
export async function execute(
  start: number,
  end: number,
  filename: string = 'PRD.md',
  hash?: string
): Promise<{ excerpt: string; start: number; end: number; hash: string; duzeltildi: boolean }> {
  // Hash yoksa eski davranis: oku ve hash hesapla
  if (!hash) {
    const result = await readLineRange(filename, start, end);
    return { ...result, hash: parmakIzi(result.excerpt), duzeltildi: false };
  }

  // Hash var — duzeltme mekanizmasini kullan
  return satirDuzelt(filename, start, end, hash);
}
