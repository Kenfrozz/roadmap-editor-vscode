import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import { TerminalSaglayici } from '@kairos/shared';

interface TerminalInstance {
  process: ChildProcess;
  name: string;
  exitCode: number | undefined;
}

let _nextId = 1;
const _terminals = new Map<string, TerminalInstance>();
const _kapandiCallbacks: Array<(termId: string, exitCode: number | undefined) => void> = [];

function shellArgs(shellPath: string, cmd: string): string[] {
  const base = path.basename(shellPath).toLowerCase();
  // /k ve -NoExit: komut bitse bile terminal acik kalir, kullanici ciktiyi gorebilir
  if (base === 'cmd.exe' || base === 'cmd') return ['/k', cmd];
  if (base === 'powershell.exe' || base === 'pwsh.exe' || base === 'pwsh') return ['-NoExit', '-Command', cmd];
  if (base === 'wsl.exe' || base === 'wsl') return ['--', 'bash', '-c', cmd + '; exec bash'];
  // bash, git-bash, zsh, sh, vb.
  return ['-c', cmd + '; exec bash'];
}

export function createTerminalSaglayici(defaultCwd: string): TerminalSaglayici {
  return {
    calistir(opts) {
      const id = `term-${_nextId++}`;
      const shell = opts.shellPath || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');
      const cwd = opts.cwd || defaultCwd;
      const args = shellArgs(shell, opts.cmd);

      const proc = spawn(shell, args, {
        cwd,
        detached: true,
        // Windows: en az bir pipe olmazsa DETACHED_PROCESS kullanilir (gorunmez).
        // Pipe varsa CREATE_NEW_CONSOLE → gorunur terminal penceresi acar.
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      // Buffer dolmasini engelle
      proc.stdout?.resume();
      proc.stderr?.resume();
      proc.unref();

      const instance: TerminalInstance = {
        process: proc,
        name: opts.name,
        exitCode: undefined,
      };

      proc.on('exit', (code) => {
        instance.exitCode = code ?? undefined;
        _kapandiCallbacks.forEach(cb => cb(id, instance.exitCode));
        _terminals.delete(id);
      });

      _terminals.set(id, instance);
      return id;
    },

    kapat(termId) {
      const instance = _terminals.get(termId);
      if (!instance) return;
      const pid = instance.process.pid;
      if (pid) {
        try {
          if (process.platform === 'win32') {
            execSync(`taskkill /T /F /pid ${pid}`, { stdio: 'ignore' });
          } else {
            process.kill(-pid, 'SIGTERM');
          }
        } catch {
          // Proses zaten kapanmis olabilir
        }
      }
      _terminals.delete(termId);
    },

    onKapandi(callback) {
      _kapandiCallbacks.push(callback);
      return () => {
        const idx = _kapandiCallbacks.indexOf(callback);
        if (idx !== -1) _kapandiCallbacks.splice(idx, 1);
      };
    },
  };
}
