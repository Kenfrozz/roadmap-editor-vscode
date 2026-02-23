import { SunucuDurum } from '../types';
import { sunucuAktifMi, bagliIstemciSayisi, sunucuPortu, sunucuUrl } from './baslat';

export function execute(): SunucuDurum {
  return {
    aktif: sunucuAktifMi(),
    url: sunucuAktifMi() ? sunucuUrl() : '',
    port: sunucuPortu(),
    bagliIstemci: bagliIstemciSayisi(),
  };
}
