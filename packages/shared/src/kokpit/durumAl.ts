import { KokpitDurumBilgi } from '../types';
import { KokpitYonetici } from './yonetici';

export function execute(): KokpitDurumBilgi {
  return KokpitYonetici.getInstance().durumAl();
}
