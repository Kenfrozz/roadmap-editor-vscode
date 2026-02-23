import { KuyrukGorevi } from '../types';
import { KokpitYonetici } from './yonetici';

export async function execute(kuyruk: KuyrukGorevi[]): Promise<void> {
  await KokpitYonetici.getInstance().baslat(kuyruk);
}
