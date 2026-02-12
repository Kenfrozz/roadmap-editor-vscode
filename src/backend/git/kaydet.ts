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

// Tum degisiklikleri sahneleyip commit eder
// [mesaj] - Commit mesaji
export async function execute(mesaj: string): Promise<void> {
  const cwd = getRoot();
  await run('git add -A', cwd);
  await run(`git commit -m "${mesaj.replace(/"/g, '\\"')}"`, cwd);
}
