// Icerik parmak izi hesaplar (djb2 algoritmasi)
// Ilk satir + son satir + satir sayisi hash'lenir, 6 karakter doner
export function execute(content: string): string {
  const lines = content.split('\n');
  const first = lines[0] || '';
  const last = lines[lines.length - 1] || '';
  const input = `${first}|${last}|${lines.length}`;

  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}
