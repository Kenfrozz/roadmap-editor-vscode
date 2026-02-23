import { sunucuDurdur } from './baslat';

export async function execute(): Promise<void> {
  await sunucuDurdur();
}
