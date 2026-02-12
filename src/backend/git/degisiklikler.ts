import { execSync } from 'child_process';
import { getRoot } from '../_core/db';
import { GitDegisiklik } from '../../types';

const STATUS_MAP: Record<string, GitDegisiklik['durum']> = {
  'M': 'modified',
  'A': 'added',
  'D': 'deleted',
  'R': 'renamed',
  '?': 'untracked',
};

// Degisen dosyalarin listesini dondurur
export function execute(): GitDegisiklik[] {
  const cwd = getRoot();

  try {
    const output = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: 'pipe' });
    if (!output.trim()) return [];

    return output.trim().split('\n').map(line => {
      const x = line[0];
      const y = line[1];
      const dosya = line.slice(3).trim();
      const code = x !== ' ' && x !== '?' ? x : y !== ' ' ? y : x;
      const durum = STATUS_MAP[code] || 'modified';
      const staged = x !== ' ' && x !== '?';
      return { dosya, durum, staged };
    });
  } catch {
    return [];
  }
}
