import { readLineRange } from '../_core/db';

// PRD.md dosyasindan belirtilen satir araligini okur
// [start] - Baslangic satir numarasi
// [end] - Bitis satir numarasi
export async function execute(start: number, end: number): Promise<{ excerpt: string; start: number; end: number }> {
  return readLineRange('PRD.md', start, end);
}
