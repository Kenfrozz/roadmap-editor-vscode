import { updateLineRange } from '../_core/db';

// PRD.md dosyasinda belirtilen satir araligini gunceller
// [start] - Baslangic satir numarasi
// [end] - Bitis satir numarasi
// [content] - Yeni icerik
export async function execute(start: number, end: number, content: string): Promise<void> {
  await updateLineRange('PRD.md', start, end, content);
}
