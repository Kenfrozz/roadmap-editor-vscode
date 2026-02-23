import { updateLineRange } from '../_core/db';

// Belirtilen dosyada belirtilen satir araligini gunceller
// [filename] - Dosya adi (varsayilan: PRD.md)
// [start] - Baslangic satir numarasi
// [end] - Bitis satir numarasi
// [content] - Yeni icerik
export async function execute(start: number, end: number, content: string, filename: string = 'PRD.md'): Promise<void> {
  await updateLineRange(filename, start, end, content);
}
