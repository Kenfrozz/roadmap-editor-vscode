import { exec } from 'child_process';
import { getRoot } from '../_core/db';

function run(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

// Degisiklikleri uzak repoya gonderir (git push)
export async function execute(): Promise<void> {
  const cwd = getRoot();
  await run('git push', cwd);
}
