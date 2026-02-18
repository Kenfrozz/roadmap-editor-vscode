import { readLineRange } from '../_core/db';

// Belirtilen dosyadan belirtilen satir araligini okur
// [filename] - Dosya adi (varsayilan: PRD.md)
// [start] - Baslangic satir numarasi
// [end] - Bitis satir numarasi
export async function execute(start: number, end: number, filename: string = 'PRD.md'): Promise<{ excerpt: string; start: number; end: number }> {
  return readLineRange(filename, start, end);
}
