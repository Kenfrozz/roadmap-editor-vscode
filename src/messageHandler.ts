import * as vscode from 'vscode';
import { parseMD, generateMD } from './parser';
import { readWorkspaceFile, writeWorkspaceFile, readFileLineRange, updateFileLineRange, backupRoadmapFile, listBackupFiles, restoreBackupFile } from './fileOps';
import { loadSettings, saveSettings as saveSettingsFile, detectTerminals, settingsFileExists } from './settings';
import { WebviewMessage, FazConfig, SettingsConfig } from './types';

export async function handleMessage(
  webview: vscode.Webview,
  message: WebviewMessage
): Promise<void> {
  switch (message.command) {
    case 'load': {
      try {
        const settings = loadSettings();
        const columns = settings.roadmap.columns;
        const content = await readWorkspaceFile('ROADMAP.md');
        const { data, fazNames, changelog, fazOrder } = parseMD(content, columns);
        const firstRun = !settingsFileExists();
        webview.postMessage({
          command: 'loadResponse',
          data: { ...data, _fazNames: fazNames, _changelog: changelog, _fazOrder: fazOrder, _columns: columns, ...(firstRun ? { _firstRun: true } : {}) },
        });
      } catch {
        webview.postMessage({
          command: 'loadResponse',
          data: { _notFound: true },
        });
      }
      break;
    }

    case 'createRoadmap': {
      try {
        const settings = loadSettings();
        const columns = settings.roadmap.columns;
        const defaultData = { faz1: [], faz2: [], faz3: [], faz4: [] };
        const md = generateMD(defaultData, undefined, columns);
        await writeWorkspaceFile('ROADMAP.md', md);
        const content = await readWorkspaceFile('ROADMAP.md');
        const { data, fazNames, changelog, fazOrder } = parseMD(content, columns);
        webview.postMessage({
          command: 'createRoadmapResponse',
          success: true,
        });
        webview.postMessage({
          command: 'loadResponse',
          data: { ...data, _fazNames: fazNames, _changelog: changelog, _fazOrder: fazOrder, _columns: columns },
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'createRoadmapResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'save': {
      try {
        const settings = loadSettings();
        const columns = settings.roadmap.columns;
        const saveData = message.data;
        const fazConfig = saveData._fazConfig as Record<string, FazConfig> | undefined;
        const md = generateMD(saveData, fazConfig, columns);
        await writeWorkspaceFile('ROADMAP.md', md);
        webview.postMessage({ command: 'saveResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'prdLoad': {
      try {
        const content = await readWorkspaceFile('PRD.md');
        const lines = content.split('\n');
        webview.postMessage({ command: 'prdLoadResponse', data: { lines, total: lines.length } });
      } catch {
        webview.postMessage({ command: 'prdLoadResponse', data: { lines: [], total: 0 } });
      }
      break;
    }

    case 'prdLines': {
      try {
        const result = await readFileLineRange('PRD.md', message.start, message.end);
        webview.postMessage({ command: 'prdLinesResponse', data: result });
      } catch {
        webview.postMessage({ command: 'prdLinesResponse', data: { excerpt: '', start: 0, end: 0 } });
      }
      break;
    }

    case 'prdUpdate': {
      try {
        await updateFileLineRange('PRD.md', message.start, message.end, message.content);
        webview.postMessage({ command: 'prdUpdateResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'prdUpdateResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'runTerminal': {
      const termName = message.name || 'Flutter';
      const settings = loadSettings();
      const termId = settings.terminal.defaultTerminalId;
      const termOption = termId ? settings.terminal.availableTerminals.find(t => t.id === termId) : null;

      const terminalOpts: vscode.TerminalOptions = { name: termName };
      if (termOption) {
        terminalOpts.shellPath = termOption.path;
        if (termOption.args) terminalOpts.shellArgs = termOption.args;
      }

      const terminal = vscode.window.createTerminal(terminalOpts);
      terminal.show();
      terminal.sendText(message.cmd);
      break;
    }

    case 'savePdf': {
      try {
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(message.filename),
          filters: { 'PDF': ['pdf'] },
        });
        if (uri) {
          const buffer = Buffer.from(message.base64, 'base64');
          await vscode.workspace.fs.writeFile(uri, buffer);
          vscode.window.showInformationMessage('PDF kaydedildi.');
        }
        webview.postMessage({ command: 'savePdfResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'savePdfResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'loadSettings': {
      try {
        const settings = loadSettings();
        const terminals = detectTerminals();
        settings.terminal.availableTerminals = terminals;
        webview.postMessage({ command: 'loadSettingsResponse', settings });
      } catch (err: unknown) {
        const settings = loadSettings();
        webview.postMessage({ command: 'loadSettingsResponse', settings });
      }
      break;
    }

    case 'saveSettings': {
      try {
        saveSettingsFile(message.settings as SettingsConfig);
        webview.postMessage({ command: 'saveSettingsResponse', success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'saveSettingsResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'createRoadmapWithSettings': {
      try {
        const newSettings = message.settings as SettingsConfig;
        saveSettingsFile(newSettings);
        const columns = newSettings.roadmap.columns;
        const defaultData = { faz1: [], faz2: [], faz3: [], faz4: [] };
        const md = generateMD(defaultData, undefined, columns);
        await writeWorkspaceFile('ROADMAP.md', md);
        const content = await readWorkspaceFile('ROADMAP.md');
        const { data, fazNames, changelog, fazOrder } = parseMD(content, columns);
        webview.postMessage({ command: 'createRoadmapWithSettingsResponse', success: true });
        webview.postMessage({
          command: 'loadResponse',
          data: { ...data, _fazNames: fazNames, _changelog: changelog, _fazOrder: fazOrder, _columns: columns },
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'createRoadmapWithSettingsResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'resetRoadmap': {
      try {
        await backupRoadmapFile();
        const settings = loadSettings();
        const columns = settings.roadmap.columns;
        const defaultData = { faz1: [], faz2: [], faz3: [], faz4: [] };
        const md = generateMD(defaultData, undefined, columns);
        await writeWorkspaceFile('ROADMAP.md', md);
        const content = await readWorkspaceFile('ROADMAP.md');
        const { data, fazNames, changelog, fazOrder } = parseMD(content, columns);
        webview.postMessage({ command: 'resetRoadmapResponse', success: true });
        webview.postMessage({
          command: 'loadResponse',
          data: { ...data, _fazNames: fazNames, _changelog: changelog, _fazOrder: fazOrder, _columns: columns },
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'resetRoadmapResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'listBackups': {
      try {
        const backups = await listBackupFiles();
        webview.postMessage({ command: 'listBackupsResponse', backups });
      } catch {
        webview.postMessage({ command: 'listBackupsResponse', backups: [] });
      }
      break;
    }

    case 'restoreBackup': {
      try {
        await restoreBackupFile(message.filename);
        const settings = loadSettings();
        const columns = settings.roadmap.columns;
        const content = await readWorkspaceFile('ROADMAP.md');
        const { data, fazNames, changelog, fazOrder } = parseMD(content, columns);
        webview.postMessage({ command: 'restoreBackupResponse', success: true });
        webview.postMessage({
          command: 'loadResponse',
          data: { ...data, _fazNames: fazNames, _changelog: changelog, _fazOrder: fazOrder, _columns: columns },
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        webview.postMessage({ command: 'restoreBackupResponse', success: false, error: errorMessage });
      }
      break;
    }

    case 'detectTerminals': {
      const terminals = detectTerminals();
      webview.postMessage({ command: 'detectTerminalsResponse', terminals });
      break;
    }
  }
}
