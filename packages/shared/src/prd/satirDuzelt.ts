import { readFile } from '../_core/db';
import { execute as parmakIzi } from './parmakIzi';

// Kaymis referansi duzeltir: dosyada ayni hash'e sahip blogu arar
// Eski pozisyona en yakin eslemeyi tercih eder
export async function execute(
  filename: string,
  eskiStart: number,
  eskiEnd: number,
  beklenenHash: string
): Promise<{ excerpt: string; start: number; end: number; hash: string; duzeltildi: boolean }> {
  const content = await readFile(filename);
  const lines = content.split('\n');
  const blockSize = eskiEnd - eskiStart + 1;

  // Oncelikle mevcut pozisyonda kontrol et
  const s0 = Math.max(0, eskiStart - 1);
  const e0 = Math.min(lines.length, eskiEnd);
  const currentExcerpt = lines.slice(s0, e0).join('\n');
  const currentHash = parmakIzi(currentExcerpt);
  if (currentHash === beklenenHash) {
    return { excerpt: currentExcerpt, start: s0 + 1, end: e0, hash: currentHash, duzeltildi: false };
  }

  // Uyusmazlik var — ayni boyuttaki bloklari tarayarak esleseni bul
  let enYakinMesafe = Infinity;
  let enYakinStart = -1;

  for (let i = 0; i <= lines.length - blockSize; i++) {
    const blok = lines.slice(i, i + blockSize).join('\n');
    const blokHash = parmakIzi(blok);
    if (blokHash === beklenenHash) {
      const mesafe = Math.abs(i - s0);
      if (mesafe < enYakinMesafe) {
        enYakinMesafe = mesafe;
        enYakinStart = i;
      }
    }
  }

  if (enYakinStart >= 0) {
    const yeniExcerpt = lines.slice(enYakinStart, enYakinStart + blockSize).join('\n');
    return {
      excerpt: yeniExcerpt,
      start: enYakinStart + 1,
      end: enYakinStart + blockSize,
      hash: beklenenHash,
      duzeltildi: true,
    };
  }

  // Eslesen blok bulunamadi — mevcut pozisyonu yeni hash ile dondur
  return { excerpt: currentExcerpt, start: s0 + 1, end: e0, hash: currentHash, duzeltildi: false };
}
