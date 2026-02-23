import { fileExists, readFile, readDir, getRoot } from '../_core/db';
import * as path from 'path';
import { PluginDurum, PluginKomut, PluginYapilandirma, MarketplaceYapilandirma } from '../types';

function parseFrontmatter(content: string): { description: string; argumentHint?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { description: '' };
  const fm = match[1];
  const desc = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim() || '';
  const hint = fm.match(/^argument-hint:\s*"?(.+?)"?$/m)?.[1]?.trim();
  return { description: desc, argumentHint: hint };
}

export async function execute(): Promise<PluginDurum> {
  const pluginJsonPath = 'kairos/plugins/kairos/.claude-plugin/plugin.json';
  const marketplaceJsonPath = 'kairos/.claude-plugin/marketplace.json';
  const commandsDir = 'kairos/plugins/kairos/commands';

  const installed = await fileExists(pluginJsonPath);

  if (!installed) {
    return { installed: false, pluginJson: null, marketplaceJson: null, komutlar: [] };
  }

  // plugin.json oku
  let pluginJson: PluginYapilandirma | null = null;
  try {
    const raw = await readFile(pluginJsonPath);
    const parsed = JSON.parse(raw);
    pluginJson = { name: parsed.name || '', description: parsed.description || '', version: parsed.version || '' };
  } catch { /* ignore */ }

  // marketplace.json oku
  let marketplaceJson: MarketplaceYapilandirma | null = null;
  try {
    const raw = await readFile(marketplaceJsonPath);
    const parsed = JSON.parse(raw);
    marketplaceJson = {
      name: parsed.name || '',
      description: parsed.metadata?.description || '',
    };
  } catch { /* ignore */ }

  // Komutlari tara
  const komutlar: PluginKomut[] = [];
  try {
    const root = getRoot();
    const entries = await readDir(path.join(root, commandsDir));
    for (const [name, type] of entries) {
      if (type !== 1 || !name.endsWith('.md')) continue; // type 1 = File
      const content = await readFile(`${commandsDir}/${name}`);
      const { description, argumentHint } = parseFrontmatter(content);
      komutlar.push({
        name: name.replace(/\.md$/, ''),
        description,
        argumentHint,
      });
    }
  } catch { /* commands dizini yoksa bos doner */ }

  return { installed, pluginJson, marketplaceJson, komutlar };
}
