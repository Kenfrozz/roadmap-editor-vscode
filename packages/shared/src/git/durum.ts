import { execSync } from 'child_process';
import { getRoot } from '../_core/db';
import { GitDurum } from '../types';

// Git durum bilgilerini dondurur (dal, degisiklik sayisi, ileri/geri)
export function execute(): GitDurum {
  const cwd = getRoot();

  try {
    execSync('git rev-parse --git-dir', { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return { branch: '', changedCount: 0, ahead: 0, behind: 0, hasRemote: false, isRepo: false };
  }

  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

    const status = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: 'pipe' });
    const changedCount = status.trim() ? status.trim().split('\n').length : 0;

    let ahead = 0;
    let behind = 0;
    let hasRemote = false;

    try {
      execSync('git rev-parse --abbrev-ref @{u}', { cwd, encoding: 'utf8', stdio: 'pipe' });
      hasRemote = true;
      const counts = execSync('git rev-list --left-right --count HEAD...@{u}', { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
      const parts = counts.split('\t');
      ahead = parseInt(parts[0]) || 0;
      behind = parseInt(parts[1]) || 0;
    } catch {
      // Upstream ayarlanmamis
    }

    return { branch, changedCount, ahead, behind, hasRemote, isRepo: true };
  } catch {
    return { branch: '', changedCount: 0, ahead: 0, behind: 0, hasRemote: false, isRepo: false };
  }
}
