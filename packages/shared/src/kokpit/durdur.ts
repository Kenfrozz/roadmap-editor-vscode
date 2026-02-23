import { KokpitYonetici } from './yonetici';

export async function execute(): Promise<void> {
  await KokpitYonetici.getInstance().durdur();
}
