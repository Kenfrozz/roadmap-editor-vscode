import { writeFile } from '../_core/db';
import { SavePayload, FazConfig, RoadmapItem, KairosData } from '../types';

// Roadmap verisini data.json dosyasina kaydeder
export async function execute(saveData: SavePayload): Promise<void> {
  const fazConfig = saveData._fazConfig as Record<string, FazConfig> | undefined;

  const fazNames: Record<string, string> = {};
  if (fazConfig) {
    for (const [key, config] of Object.entries(fazConfig)) {
      if (config?.name) fazNames[key] = config.name;
    }
  }

  const fazlar: Record<string, RoadmapItem[]> = {};
  for (const [key, value] of Object.entries(saveData)) {
    if (key.startsWith('faz') && Array.isArray(value)) {
      fazlar[key] = value as RoadmapItem[];
    }
  }

  const jsonData: KairosData = {
    version: 2,
    fazOrder: saveData._fazOrder || Object.keys(fazlar).sort(),
    fazNames,
    fazlar,
  };

  await writeFile('kairos/data.json', JSON.stringify(jsonData, null, 2));
}
