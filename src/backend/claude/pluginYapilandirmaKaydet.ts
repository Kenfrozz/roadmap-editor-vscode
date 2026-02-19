import { writeFile, ensureDir, getRoot } from '../_core/db';
import * as path from 'path';
import { PluginYapilandirma, MarketplaceYapilandirma } from '../../types';

export async function execute(pluginJson: PluginYapilandirma, marketplaceJson: MarketplaceYapilandirma): Promise<void> {
  const root = getRoot();

  // Dizinlerin var oldugundan emin ol
  await ensureDir(path.join(root, 'kairos', 'plugins', 'kairos', '.claude-plugin'));
  await ensureDir(path.join(root, 'kairos', '.claude-plugin'));

  // plugin.json yaz
  const pluginData = {
    name: pluginJson.name,
    description: pluginJson.description,
    version: pluginJson.version,
    author: { name: 'Kairos' },
  };
  await writeFile('kairos/plugins/kairos/.claude-plugin/plugin.json', JSON.stringify(pluginData, null, 2));

  // marketplace.json yaz
  const marketplaceData = {
    name: marketplaceJson.name,
    owner: { name: 'Kairos' },
    metadata: { description: marketplaceJson.description },
    plugins: [{
      name: pluginJson.name,
      source: './plugins/kairos',
      description: pluginJson.description,
    }],
  };
  await writeFile('kairos/.claude-plugin/marketplace.json', JSON.stringify(marketplaceData, null, 2));
}
