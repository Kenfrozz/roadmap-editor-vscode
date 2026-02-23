import * as fs from 'fs';
import * as path from 'path';
import { getRoot } from '../_core/db';

const LOGO_NAMES = ['logo', 'icon', 'favicon'];
const LOGO_EXTS = ['.png', '.svg', '.ico', '.jpg', '.jpeg'];

// Oncelikli statik kaliplar (sik rastlanan konumlar)
const STATIC_PATTERNS = [
  'logo.png', 'logo.svg', 'logo.ico', 'logo.jpg',
  'icon.png', 'icon.svg', 'icon.ico',
  'favicon.ico', 'favicon.png', 'favicon.svg',
];

// Taranacak alt dizinler
const SCAN_DIRS = [
  'public',
  'src/assets',
  'src',
  'assets',
  'media',
  'images',
  'img',
  'static',
  'resources',
  'res',
  'icons',
  '.kairos',
  'kairos',
];

const MAX_SIZE = 256 * 1024; // 256KB

const EXT_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function isLogoFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  const ext = path.extname(lower);
  if (!LOGO_EXTS.includes(ext)) return false;
  const base = path.basename(lower, ext);
  return LOGO_NAMES.includes(base);
}

async function tryReadLogo(filePath: string): Promise<string | null> {
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile() || stat.size > MAX_SIZE || stat.size === 0) return null;

    const ext = path.extname(filePath).toLowerCase();
    const mime = EXT_MIME[ext];
    if (!mime) return null;

    const buffer = await fs.promises.readFile(filePath);
    const base64 = buffer.toString('base64');
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function execute(): Promise<string | null> {
  const root = getRoot();

  // 1. Statik kaliplar (kok dizin)
  for (const pattern of STATIC_PATTERNS) {
    const result = await tryReadLogo(path.join(root, pattern));
    if (result) return result;
  }

  // 2. Alt dizinleri tara
  for (const dir of SCAN_DIRS) {
    const dirPath = path.join(root, dir);
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!isLogoFile(entry.name)) continue;
        const result = await tryReadLogo(path.join(dirPath, entry.name));
        if (result) return result;
      }
    } catch {
      // dizin yok, devam
    }
  }

  return null;
}
